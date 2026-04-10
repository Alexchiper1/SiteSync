import express from "express";
import { MongoClient, ObjectId } from "mongodb";

const router = express.Router();

const uri = process.env.MONGO_URI;
if (!uri) throw new Error("MONGO_URI missing. Check backend/.env");

// create Mongo client
const client = new MongoClient(uri);

// helper to reuse DB connection
async function getDb() {
  if (!client.topology || !client.topology.isConnected()) {
    await client.connect();
  }
  return client.db("app");
}

// --- helpers ---
function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // meters
  const toRad = (v) => (v * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return 2 * R * Math.asin(Math.sqrt(a));
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

// ---------------- ATTENDANCE ----------------

// CHECK IN
// body: { siteId, employeeEmail, employeeName, employeeLat, employeeLng }
router.post("/attendance/check-in", async (req, res) => {
  try {
    const { siteId, employeeEmail, employeeName, employeeLat, employeeLng } = req.body;

    if (!siteId || !employeeEmail || employeeLat == null || employeeLng == null) {
      return res.status(400).json({ msg: "Missing fields" });
    }

    const db = await getDb();

    const site = await db.collection("sites").findOne({ _id: new ObjectId(siteId) });
    if (!site) return res.status(404).json({ msg: "Site not found" });

    const radius = Number(site.radiusMeters ?? 100);
    const dist = haversineMeters(employeeLat, employeeLng, site.lat, site.lng);

    if (dist > radius) {
      return res.status(403).json({ msg: `Not within radius (${Math.round(dist)}m away)` });
    }

    const email = normalizeEmail(employeeEmail);

    // prevent multiple open check-ins for this employee on this site
    const existingOpen = await db.collection("attendance").findOne({
      siteId: String(siteId),
      employeeEmail: email,
      checkOutAt: null
    });

    if (existingOpen) {
      return res.status(400).json({ msg: "Already checked in" });
    }

    await db.collection("attendance").insertOne({
      siteId: String(siteId),
      siteName: site.name,
      managerEmail: normalizeEmail(site.managerEmail),
      employeeEmail: email,
      employeeName: employeeName || email,
      checkInAt: new Date(),
      checkOutAt: null
    });

    res.json({ msg: "Checked in" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// CHECK OUT
// body: { siteId, employeeEmail, employeeLat, employeeLng }
router.post("/attendance/check-out", async (req, res) => {
  try {
    const { siteId, employeeEmail, employeeLat, employeeLng } = req.body;

    if (!siteId || !employeeEmail || employeeLat == null || employeeLng == null) {
      return res.status(400).json({ msg: "Missing fields" });
    }

    const db = await getDb();

    const site = await db.collection("sites").findOne({ _id: new ObjectId(siteId) });
    if (!site) return res.status(404).json({ msg: "Site not found" });

    const radius = Number(site.radiusMeters ?? 100);
    const dist = haversineMeters(employeeLat, employeeLng, site.lat, site.lng);

    if (dist > radius) {
      return res.status(403).json({ msg: `Not within radius (${Math.round(dist)}m away)` });
    }

    const email = normalizeEmail(employeeEmail);

    const openRecord = await db.collection("attendance").findOne({
      siteId: String(siteId),
      employeeEmail: email,
      checkOutAt: null
    });

    if (!openRecord) {
      return res.status(400).json({ msg: "No active check-in found" });
    }

    await db.collection("attendance").updateOne(
      { _id: openRecord._id },
      { $set: { checkOutAt: new Date() } }
    );

    res.json({ msg: "Checked out" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// MANAGER VIEW (today's check-ins by default)
// GET /attendance/manager/:managerEmail?date=YYYY-MM-DD
router.get("/attendance/manager/:managerEmail", async (req, res) => {
  try {
    const db = await getDb();

    const managerEmail = normalizeEmail(req.params.managerEmail);

    const dateStr = req.query.date; // optional
    const start = dateStr ? new Date(dateStr + "T00:00:00.000Z") : new Date();
    if (!dateStr) start.setUTCHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    const rows = await db
      .collection("attendance")
      .find({
        managerEmail,
        checkInAt: { $gte: start, $lt: end }
      })
      .sort({ checkInAt: -1 })
      .toArray();

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/attendance/manager-history/:managerEmail", async (req, res) => {
  try {
    const db = await getDb();
    const managerEmail = normalizeEmail(req.params.managerEmail);

    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    let start;
    let end;

    if (startDate && endDate) {
      start = new Date(`${startDate}T00:00:00.000Z`);
      end = new Date(`${endDate}T00:00:00.000Z`);
      end.setUTCDate(end.getUTCDate() + 1);
    } else {
      end = new Date();
      end.setUTCHours(23, 59, 59, 999);
      start = new Date(end);
      start.setUTCDate(start.getUTCDate() - 6);
      start.setUTCHours(0, 0, 0, 0);
    }

    const rows = await db
      .collection("attendance")
      .find({
        managerEmail,
        checkInAt: { $gte: start, $lt: end }
      })
      .sort({ checkInAt: -1 })
      .toArray();

    res.json(rows);
  } catch (err) {
    console.error("GET /attendance/manager-history failed:", err);
    res.status(500).json({ msg: err.message || "Server error" });
  }
});

router.get("/attendance/employee-history/:employeeEmail", async (req, res) => {
  try {
    const db = await getDb();
    const employeeEmail = normalizeEmail(req.params.employeeEmail);

    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    let start;
    let end;

    if (startDate && endDate) {
      start = new Date(`${startDate}T00:00:00.000Z`);
      end = new Date(`${endDate}T00:00:00.000Z`);
      end.setUTCDate(end.getUTCDate() + 1);
    } else {
      end = new Date();
      end.setUTCHours(23, 59, 59, 999);
      start = new Date(end);
      start.setUTCDate(start.getUTCDate() - 6);
      start.setUTCHours(0, 0, 0, 0);
    }

    const rows = await db
      .collection("attendance")
      .find({
        employeeEmail,
        checkInAt: { $gte: start, $lt: end }
      })
      .sort({ checkInAt: -1 })
      .toArray();

    res.json(rows);
  } catch (err) {
    console.error("GET /attendance/employee-history failed:", err);
    res.status(500).json({ msg: err.message || "Server error" });
  }
});

export default router;