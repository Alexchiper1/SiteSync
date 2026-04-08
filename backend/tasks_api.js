import express from "express";
import { ObjectId } from "mongodb";
import { getDb } from "./db.js";
import { cloudinary, hasCloudinaryConfig, upload } from "./uploadStorage.js";

const router = express.Router();

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

    uploadStream.end(file.buffer);
  });
}

// ---------------- TASKS ----------------

// CREATE TASK
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

//get the tasks for the employee
router.get("/tasks/:employeeEmail", async (req, res) => {
  const db = await getDb();

  const tasks = await db.collection("tasks")
    .find({ employeeEmail: req.params.employeeEmail })
    .toArray();

  res.json(tasks);
});

//update whether task is complete or not
router.put("/tasks-complete/:taskId", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "Photo upload is required" });
    }

    const db = await getDb();
    const imagePath = hasCloudinaryConfig
      ? await uploadTaskPhoto(req.file)
      : req.file?.path || req.file?.filename || "";

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
    res.status(500).json({ msg: "Error completing task" });
  }
});

// get the tasks for manager to view
router.get("/tasks-site/:siteId", async (req, res) => {
  const db = await getDb();

  const tasks = await db.collection("tasks")
    .find({ siteId: req.params.siteId })
    .toArray();

  res.json(tasks);
});

router.get("/manager-tasks/:managerEmail", async (req, res) => {
  try {
    const db = await getDb();
    const managerEmail = String(req.params.managerEmail || "").trim().toLowerCase();

    const sites = await db
      .collection("sites")
      .find({ managerEmail })
      .project({ _id: 1 })
      .toArray();

    const siteIds = sites.map((site) => String(site._id));

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