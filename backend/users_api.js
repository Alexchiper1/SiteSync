import express from "express";
import { MongoClient } from "mongodb";

const router = express.Router();

const uri =
  "mongodb+srv://sitesync:pass@cluster0.ehai0mf.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri);

// ---------------- USERS ----------------

router.get("/users", async (req, res) => {
  await client.connect();
  const db = client.db("app");
  const users = await db.collection("users").find({}).toArray();
  res.json(users);
});

router.post("/users", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("app");

    const email = req.body.email.trim().toLowerCase();

    // check if email already exists
    const existingUser = await db.collection("users").findOne({ email });

    if (existingUser) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    await db.collection("users").insertOne({
      name: req.body.name,
      email,
      password: req.body.password,
      role: req.body.role,
      companyName: req.body.companyName || ""
    });

    res.status(201).json({ msg: "User added" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("app");

    const email = req.body.email.trim().toLowerCase();
    const user = await db.collection("users").findOne({ email });

    if (!user || user.password !== req.body.password) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;