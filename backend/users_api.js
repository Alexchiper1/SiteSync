import express from "express";
import { getDb } from "./db.js";
import { cloudinary, hasCloudinaryConfig, upload } from "./uploadStorage.js";

const router = express.Router();

function uploadProfileImage(file) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "sitesync/profiles",
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

    if (String(req.body.password).length < 6) {
      return res.status(400).json({ msg: "Password must be a minimum of 6 characters." });
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

router.put("/users/profile", upload.single("profileImage"), async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const name = String(req.body.name || "").trim();

    if (!email || !name) {
      return res.status(400).json({ msg: "Name and email are required" });
    }

    const db = await getDb();
    const existingUser = await db.collection("users").findOne({ email });

    if (!existingUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    let profileImage = existingUser.profileImage || "";

    if (req.file && hasCloudinaryConfig) {
      profileImage = await uploadProfileImage(req.file);
    } else if (req.file) {
      profileImage = req.file?.path || req.file?.filename || profileImage;
    }

    await db.collection("users").updateOne(
      { email },
      {
        $set: {
          name,
          profileImage
        }
      }
    );

    const updatedUser = await db.collection("users").findOne({ email });
    res.json({
      msg: "Profile updated",
      user: updatedUser
    });
  } catch (err) {
    console.error("PUT /users/profile failed:", err);
    res.status(500).json({ msg: err.message || "Server error" });
  }
});

export default router;