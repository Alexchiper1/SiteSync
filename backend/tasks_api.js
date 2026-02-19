import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import multer from "multer";

const router = express.Router();

const uri =
  "mongodb+srv://sitesync:pass@cluster0.ehai0mf.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri);

/*Add storage */
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// ---------------- TASKS ----------------

// CREATE TASK
router.post("/tasks", async (req, res) => {
  await client.connect();
  const db = client.db("app");

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
  await client.connect();
  const db = client.db("app");

  const tasks = await db.collection("tasks")
    .find({ employeeEmail: req.params.employeeEmail })
    .toArray();

  res.json(tasks);
});

//update whether task is complete or not
router.put("/tasks-complete/:taskId", upload.single("photo"), async (req, res) => {
  try {
    await client.connect();
    const db = client.db("app");

    await db.collection("tasks").updateOne(
      { _id: new ObjectId(req.params.taskId) },
      {
        $set: {
          status: "completed",
          image: req.file.filename
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
  await client.connect();
  const db = client.db("app");

  const tasks = await db.collection("tasks")
    .find({ siteId: req.params.siteId })
    .toArray();

  res.json(tasks);
});

router.put("/tasks/:taskId", async (req, res) => {
  await client.connect();
  const db = client.db("app");

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