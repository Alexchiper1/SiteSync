import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import multer from "multer";
import path from "path";


const app = express();
app.use(cors());
app.use(express.json());

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

//allow frontend access to images
app.use("/uploads", express.static("uploads"));

// ---------------- USERS ----------------

app.get("/users", async (req, res) => {
  await client.connect();
  const db = client.db("app");
  const users = await db.collection("users").find({}).toArray();
  res.json(users);
});

app.post("/users", async (req, res) => {
  await client.connect();
  const db = client.db("app");
  await db.collection("users").insertOne(req.body);
  res.json({ msg: "User added" });
});

// ---------------- SITES ----------------

// create site
app.post("/sites", async (req, res) => {
  await client.connect();
  const db = client.db("app");
  await db.collection("sites").insertOne(req.body);
  res.status(201).json({ msg: "Site created" });
});

// get sites for manager
app.get("/sites/:managerEmail", async (req, res) => {
  await client.connect();
  const db = client.db("app");

  const sites = await db
    .collection("sites")
    .find({ managerEmail: req.params.managerEmail })
    .toArray();

  res.json(sites);
});

// search sites
app.get("/sites-search/:query", async (req, res) => {
  await client.connect();
  const db = client.db("app");

  const sites = await db
    .collection("sites")
    .find({ name: { $regex: req.params.query, $options: "i" } })
    .toArray();

  res.json(sites);
});

// join site
app.post("/join-site", async (req, res) => {
  try {
    const { siteId, joinKey, employeeEmail } = req.body;

    await client.connect();
    const db = client.db("app");

    const site = await db.collection("sites").findOne({
      _id: new ObjectId(siteId),
      joinKey: joinKey
    });

    if (!site) {
      return res.status(400).json({ msg: "Invalid join key" });
    }

    await db.collection("siteMembers").insertOne({
      siteId: siteId,
      siteName: site.name,
      employeeEmail: employeeEmail.trim().toLowerCase()
    });

    res.json({ msg: "Joined site successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error joining site" });
  }
});

// ✅ get sites joined by employee
app.get("/employee-sites/:email", async (req, res) => {
  await client.connect();
  const db = client.db("app");

  const sites = await db
    .collection("siteMembers")
    .find({ employeeEmail: req.params.email.trim().toLowerCase() })
    .toArray();

  res.json(sites);
});
// CREATE TASK
app.post("/tasks", async (req, res) => {
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

// GET TASKS FOR EMPLOYEE
app.get("/tasks/:employeeEmail", async (req, res) => {
  await client.connect();
  const db = client.db("app");

  const tasks = await db.collection("tasks")
    .find({ employeeEmail: req.params.employeeEmail })
    .toArray();

  res.json(tasks);
});

//update wether task is complete or not 
app.put("/tasks-complete/:taskId", upload.single("photo"), async (req, res) => {
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
app.get("/tasks-site/:siteId", async (req, res) => {
  await client.connect();
  const db = client.db("app");

  const tasks = await db.collection("tasks")
    .find({ siteId: req.params.siteId })
    .toArray();

  res.json(tasks);
});

app.listen(5000, () => {
  console.log("Server running on 5000");
});
