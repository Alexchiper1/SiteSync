import express from "express";
import bcrypt from "bcryptjs";
import { getDb } from "./db.js";

const router = express.Router();

//compare emails. This prevents dup accounts and lookup misses.
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

//email validation for registration. rejects empty, spaced, double-dot, and malformed addresses before they are saved in MongoDB.
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

//passwords are bcrypt hashes, and this check tells login which path to use.
function isBcryptHash(value) {
  return /^\$2[aby]\$\d{2}\$/.test(String(value || ""));
}

// ---------------- USERS ----------------

//Return employees belong to site owned by manager.
//tells us which sites the manager owns,
//siteMembers tells us which employees joined those sites,
//users gives profile details,
//attendance gives today's check-in status,
//tasks gives the manager task count per employee.
router.get("/manager-employees/:managerEmail", async (req, res) => {
  try {
    const db = await getDb();
    const managerEmail = normalizeEmail(req.params.managerEmail);

    //employees are scoped to the manager work locations.
    const sites = await db
      .collection("sites")
      .find({ managerEmail })
      .toArray();

    const siteIds = sites.map((site) => String(site._id));

    //no sites means no employees can be assigned.
    if (siteIds.length === 0) {
      return res.json([]);
    }

    // siteMembers is the join table between employees and sites.
    const members = await db
      .collection("siteMembers")
      .find({ siteId: { $in: siteIds } })
      .toArray();

    //No site members means the manager has sites but no joined employees yet.
    if (members.length === 0) {
      return res.json([]);
    }

    //undupkicate emails because one employee can join more than one of the manager sites.
    const employeeEmails = [...new Set(members.map((member) => normalizeEmail(member.employeeEmail)))];

    // Load profile, attendance, and task 
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

        //attendance is filtered to today so the manager page can show a current, check-in/check-out statu
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

    // Build joinedSites per employee for display and for manager task assignment
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

    //"checked in" if an employee has multiple attendance rows today andat least one is still open.
    todaysAttendance.forEach((row) => {
      const email = normalizeEmail(row.employeeEmail);
      const nextStatus = row.checkOutAt ? "checked out" : "checked in";
      const currentStatus = statusMap.get(email);

      if (currentStatus !== "checked in") {
        statusMap.set(email, nextStatus);
      }
    });

    // Count tasks per employee for manager employee card.
    tasks.forEach((task) => {
      const email = normalizeEmail(task.employeeEmail);
      taskCountMap.set(email, (taskCountMap.get(email) || 0) + 1);
    });

    //one frontend object per employee. If site member exists before a user record is found,  email still appears as a fallback.
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

// Register a new account.
// The frontend sends name, email, password, role, and optional companyName.
// Passwords are hashed before storage so MongoDB never stores passwords.
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

    //reject duplicate emails beforeinserting the new user.
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

// Log a user in.
// The route finds the user by normalized email, checks password, and returns user object without the password so the frontend can store the safe user details in localStorage.
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
      //old accounts may still have plaintext passwords. If login succeeds, immediately upgrade that password to a bcrypt hash so future logins use the secure path.
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
    console.error("POST /login failed:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;