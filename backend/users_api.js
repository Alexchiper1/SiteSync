import express from "express";
import bcrypt from "bcryptjs";
import { getDb } from "./db.js";
import { cloudinary, hasCloudinaryConfig, upload } from "./uploadStorage.js";

const router = express.Router();

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  const value = normalizeEmail(email);

  if (value.length < 5 || value.length > 254) {
    return false;
  }

  if (/\s/.test(value) || value.includes("..")) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function isBcryptHash(value) {
  return /^\$2[aby]\$\d{2}\$/.test(String(value || ""));
}

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
  const users = await db.collection("users").find({}, { projection: { password: 0 } }).toArray();
  res.json(users);
});

router.get("/manager-employees/:managerEmail", async (req, res) => {
  try {
    const db = await getDb();
    const managerEmail = normalizeEmail(req.params.managerEmail);

    const sites = await db
      .collection("sites")
      .find({ managerEmail })
      .toArray();

    const siteIds = sites.map((site) => String(site._id));

    if (siteIds.length === 0) {
      return res.json([]);
    }

    const members = await db
      .collection("siteMembers")
      .find({ siteId: { $in: siteIds } })
      .toArray();

    if (members.length === 0) {
      return res.json([]);
    }

    const employeeEmails = [...new Set(members.map((member) => normalizeEmail(member.employeeEmail)))];

    const [users, todaysAttendance, tasks] = await Promise.all([
      db
        .collection("users")
        .find({ email: { $in: employeeEmails } })
        .toArray(),
      (() => {
        const start = new Date();
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setUTCDate(end.getUTCDate() + 1);

        return db
          .collection("attendance")
          .find({
            managerEmail,
            employeeEmail: { $in: employeeEmails },
            checkInAt: { $gte: start, $lt: end }
          })
          .toArray();
      })(),
      db
        .collection("tasks")
        .find({ employeeEmail: { $in: employeeEmails } })
        .toArray()
    ]);

    const userMap = new Map(users.map((user) => [normalizeEmail(user.email), user]));
    const membershipMap = new Map();
    const statusMap = new Map();
    const taskCountMap = new Map();

    members.forEach((member) => {
      const email = normalizeEmail(member.employeeEmail);
      const existing = membershipMap.get(email) || [];
      if (!existing.some((item) => item.siteId === member.siteId)) {
        existing.push({
          siteId: member.siteId,
          siteName: member.siteName || "Unknown site"
        });
      }
      membershipMap.set(email, existing);
    });

    todaysAttendance.forEach((row) => {
      const email = normalizeEmail(row.employeeEmail);
      const nextStatus = row.checkOutAt ? "checked out" : "checked in";
      const currentStatus = statusMap.get(email);

      if (currentStatus !== "checked in") {
        statusMap.set(email, nextStatus);
      }
    });

    tasks.forEach((task) => {
      const email = normalizeEmail(task.employeeEmail);
      taskCountMap.set(email, (taskCountMap.get(email) || 0) + 1);
    });

    const employees = employeeEmails.map((email) => {
      const user = userMap.get(email);
      const joinedSites = membershipMap.get(email) || [];
      const primarySite = joinedSites[0];

      return {
        email,
        name: user?.name || email,
        role: user?.role || "employee",
        companyName: user?.companyName || "",
        profileImage: user?.profileImage || "",
        assignedSite: primarySite?.siteName || "Unassigned",
        assignedSiteId: primarySite?.siteId || "",
        joinedSites,
        status: statusMap.get(email) || "assigned",
        taskCount: taskCountMap.get(email) || 0
      };
    });

    res.json(employees);
  } catch (err) {
    console.error("GET /manager-employees failed:", err);
    res.status(500).json({ msg: err.message || "Server error" });
  }
});

router.post("/users", async (req, res) => {
  try {
    if (!req.body?.name || !req.body?.email || !req.body?.password || !req.body?.role) {
      return res.status(400).json({ msg: "Missing required registration fields" });
    }

    if (String(req.body.password).length < 6) {
      return res.status(400).json({ msg: "Password must be a minimum of 6 characters." });
    }

    const email = normalizeEmail(req.body.email);

    if (!isValidEmail(email)) {
      return res.status(400).json({ msg: "Please enter a valid email address" });
    }

    const db = await getDb();

    // check if email already exists
    const existingUser = await db.collection("users").findOne({ email });

    if (existingUser) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(String(req.body.password), 12);

    await db.collection("users").insertOne({
      name: req.body.name,
      email,
      password: hashedPassword,
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

    const email = normalizeEmail(req.body.email);
    const inputPassword = String(req.body.password || "");
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    let isValidPassword = false;
    const storedPassword = String(user.password || "");

    if (isBcryptHash(storedPassword)) {
      isValidPassword = await bcrypt.compare(inputPassword, storedPassword);
    } else {
      // Backward-compatible: allow old plaintext account once, then upgrade to hash.
      isValidPassword = storedPassword === inputPassword;
      if (isValidPassword) {
        const upgradedHash = await bcrypt.hash(inputPassword, 12);
        await db.collection("users").updateOne(
          { _id: user._id },
          { $set: { password: upgradedHash } }
        );
      }
    }

    if (!isValidPassword) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const { password, ...safeUser } = user;
    res.json(safeUser);
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