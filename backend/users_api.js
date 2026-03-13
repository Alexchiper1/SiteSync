import express from "express";
import { getDb } from "./db.js";

const router = express.Router();

// ---------------- USERS ----------------

router.get("/users", async (req, res) => {
  const db = await getDb();
  const users = await db.collection("users").find({}).toArray();
  res.json(users);
});

router.post("/users", async (req, res) => {
  try {
    if (!req.body?.name || !req.body?.email || !req.body?.password || !req.body?.role) {
      return res.status(400).json({ msg: "Missing required registration fields" });
    }

    const db = await getDb();

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
    console.error("POST /users failed:", err);
    res.status(500).json({ msg: err.message || "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const db = await getDb();

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