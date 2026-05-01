import express from "express";
import { ObjectId } from "mongodb";
import { getDb } from "./db.js";
import { cloudinary, hasCloudinaryConfig, upload } from "./uploadStorage.js";

const router = express.Router();

// Upload a task to Cloudinary when Cloudinary env are configured. uploadStorage.js gives this route an in-memory file buffer in
// that case, and this helper streams that buffer to Cloudinary.
function uploadTaskPhoto(file) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "sitesync/tasks",
        resource_type: "image",
        public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result?.secure_url || result?.url || "");
      }
    );

    // Multer placeds the uploaded file in memory, so Cloudinary receives the
    // buffer directly instead of reading a temporary file from disk.
    uploadStream.end(file.buffer);
  });
}

// ---------------- TASKS ----------------

// Create a task for one employee at one site.
router.post("/tasks", async (req, res) => {
  const db = await getDb();

  await db.collection("tasks").insertOne({
    siteId: req.body.siteId,
    siteName: req.body.siteName,
    employeeEmail: req.body.employeeEmail,
    description: req.body.description,
    status: "assigned",
    employeeMessage: ""
  });

  res.json({ msg: "Task created" });
});

// Return tasks assigned to employee, Employee pages pass the email in the URL. Task stores employeeEmail directly,
// so MongoDB can filter the tasks collection by the field.
router.get("/tasks/:employeeEmail", async (req, res) => {
  const db = await getDb();

  const tasks = await db.collection("tasks")
    .find({ employeeEmail: req.params.employeeEmail })
    .toArray();

  res.json(tasks);
});

// Mark task as completed and add thephoto, upload.single("photo") comes from Multer and reads the multipart form upload
// sent by the employee task page.
router.put("/tasks-complete/:taskId", upload.single("photo"), async (req, res) => {
  try {
    // A completed task must have photo, so the route stops before
    // updating MongoDB if no file was included.
    if (!req.file) {
      return res.status(400).json({ msg: "Photo upload is required" });
    }

    const db = await getDb();

    //Upload to Cloudinary. Local development without Cloudinary,keeps Multer's disk path so the image can still be served from the uploads folder.
    const imagePath = hasCloudinaryConfig
      ? await uploadTaskPhoto(req.file)
      : req.file?.path || req.file?.filename || "";

    // Task ids arrive from the URL as strings, but MongoDB stores _id as ObjectId, so the id is converted for the update query.
    await db.collection("tasks").updateOne(
      { _id: new ObjectId(req.params.taskId) },
      {
        $set: {
          status: "completed",
          image: imagePath
        }
      }
    );

    res.json({ msg: "Task completed with photo" });
  } catch (err) {
    console.error("PUT /tasks-complete failed:", err);
    res.status(500).json({ msg: "Error completing task" });
  }
});

// Return every task belonging to the manager's sites.
//First finds the manager site ids from sites collection, then use those ids to query tasks.
router.get("/manager-tasks/:managerEmail", async (req, res) => {
  try {
    const db = await getDb();

    // Emails normalized
    const managerEmail = String(req.params.managerEmail || "").trim().toLowerCase();

    const sites = await db
      .collection("sites")
      .find({ managerEmail })
      .project({ _id: 1 })
      .toArray();

    const siteIds = sites.map((site) => String(site._id));

    // If the manager has no sites, there cannot be any manager tasks.
    if (siteIds.length === 0) {
      return res.json([]);
    }

    const tasks = await db
      .collection("tasks")
      .find({ siteId: { $in: siteIds } })
      .sort({ _id: -1 })
      .toArray();

    res.json(tasks);
  } catch (err) {
    console.error("GET /manager-tasks failed:", err);
    res.status(500).json({ msg: err.message || "Server error" });
  }
});

// Update existing task status and employee message, The employee task page uses this when worker marks task unable and sends reason to manager.
router.put("/tasks/:taskId", async (req, res) => {
  const db = await getDb();

  await db.collection("tasks").updateOne(
    { _id: new ObjectId(req.params.taskId) },
    {
      $set: {
        status: req.body.status,
        employeeMessage: req.body.employeeMessage || ""
      }
    }
  );

  res.json({ msg: "Task updated" });
});

export default router;
