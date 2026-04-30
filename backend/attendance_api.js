import express from "express";
import { MongoClient, ObjectId } from "mongodb";

// Create an isolated router so the attendance endpoints can be mounted in server.js.
const router = express.Router();

// Read Mongo connection string from environment variables.
const uri = process.env.MONGO_URI;
// Fail fast at startup if DB connection string is missing.
if (!uri) throw new Error("MONGO_URI missing. Check backend/.env");

// Single shared Mongo client for this module's routes.
const client = new MongoClient(uri);

// Reuse one DB connection across requests.
async function getDb() {
  // If there is no connection yet, open one now.
  if (!client.topology || !client.topology.isConnected()) {
    await client.connect();
  }
  // Use app database 
  return client.db("app");
}

// --- helpers ---
// Distance calculator used to enforce check-in and check-out.
function haversineMeters(lat1, lon1, lat2, lon2) {
  // Earth radius in meters.
  const R = 6371000;
  // Convert degrees to radians before calculations.
  const toRad = (v) => (v * Math.PI) / 180;

  // Delta latitude and longitude .
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  // Haversine formula core value.
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  // circle distance in meters.
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Lowercase and trim email so its consistent across requests.
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

// ---------------- ATTENDANCE ----------------

// CHECK IN
// body: { siteId, employeeEmail, employeeName, employeeLat, employeeLng }
router.post("/attendance/check-in", async (req, res) => {
  try {
    // Pull expected fields from request body.
    const { siteId, employeeEmail, employeeName, employeeLat, employeeLng } = req.body;

    // Basic required fields validation.
    if (!siteId || !employeeEmail || employeeLat == null || employeeLng == null) {
      return res.status(400).json({ msg: "Missing fields" });
    }

    // Get DB handle.
    const db = await getDb();

    // Get assigned site location. Employee must be within this radius.
    // Convert string siteId into Mongo ObjectId for the id lookup.
    const site = await db.collection("sites").findOne({ _id: new ObjectId(siteId) });
    // If site doesn't exist, cannot validate geofence.
    if (!site) return res.status(404).json({ msg: "Site not found" });

    // Radius fallback to 100m if site has no configured radius.
    const radius = Number(site.radiusMeters ?? 100);
    // Compute employee to site distance from GPS coordinates.
    const dist = haversineMeters(employeeLat, employeeLng, site.lat, site.lng);

    // Reject check-in when employee is outside allowed geofence.
    if (dist > radius) {
      return res.status(403).json({ msg: `Not within radius (${Math.round(dist)}m away)` });
    }

    // Normalize once and reuse in queries
    const email = normalizeEmail(employeeEmail);

    // Prevent multiple open check-ins for the same employee site.
    const existingOpen = await db.collection("attendance").findOne({
      // Store query siteId as string in attendance docs.
      siteId: String(siteId),
      employeeEmail: email,
      // Open means check out timestamp has not been set yet.
      checkOutAt: null
    });

    // If one open record exists, employee is already checked in.
    if (existingOpen) {
      return res.status(400).json({ msg: "Already checked in" });
    }

    // Manager linkage happens here:
    // each attendance row stores site.managerEmail so manager dashboards can query directly.
    await db.collection("attendance").insertOne({
      siteId: String(siteId),
      siteName: site.name,
      // This is how records become visible to the manager endpoints.
      managerEmail: normalizeEmail(site.managerEmail),
      employeeEmail: email,
      // If no display name sent, fallback to email.
      employeeName: employeeName || email,
      // Check in timestamp created by backend server clock.
      checkInAt: new Date(),
      // Null until employee checks out.
      checkOutAt: null
    });

    // Success response for frontend/app.
    res.json({ msg: "Checked in" });
  } catch (err) {
    // Log internal details server-side.
    console.error(err);
    // Return generic error to client.
    res.status(500).json({ msg: "Server error" });
  }
});

// CHECK OUT
// body: { siteId, employeeEmail, employeeLat, employeeLng }
router.post("/attendance/check-out", async (req, res) => {
  try {
    // Pull required fields.
    const { siteId, employeeEmail, employeeLat, employeeLng } = req.body;

    // Validate required payload.
    if (!siteId || !employeeEmail || employeeLat == null || employeeLng == null) {
      return res.status(400).json({ msg: "Missing fields" });
    }

    // Get DB handle.
    const db = await getDb();

    // Same geofence validation on check-out.
    const site = await db.collection("sites").findOne({ _id: new ObjectId(siteId) });
    if (!site) return res.status(404).json({ msg: "Site not found" });

    // Same radius fallback rule as check-in.
    const radius = Number(site.radiusMeters ?? 100);
    // Recalculate employee distance to site.
    const dist = haversineMeters(employeeLat, employeeLng, site.lat, site.lng);

    // Must still be inside radius to check out.
    if (dist > radius) {
      return res.status(403).json({ msg: `Not within radius (${Math.round(dist)}m away)` });
    }

    // Normalize email before lookup.
    const email = normalizeEmail(employeeEmail);

    // Find the active row created by check-in.
    const openRecord = await db.collection("attendance").findOne({
      siteId: String(siteId),
      employeeEmail: email,
      checkOutAt: null
    });

    // Cannot check out if no open check-in exists.
    if (!openRecord) {
      return res.status(400).json({ msg: "No active check-in found" });
    }

    // Close the open attendance row by stamping checkOutAt.
    await db.collection("attendance").updateOne(
      // Update by the exact attendance document id found above.
      { _id: openRecord._id },
      // Set checkout timestamp to now.
      { $set: { checkOutAt: new Date() } }
    );

    // Success response for client.
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
    // Get DB handle.
    const db = await getDb();

    // Read manager email from URL parameter and normalize it for matching.
    const managerEmail = normalizeEmail(req.params.managerEmail);

    // Optional query string date, when omitted, today is used.
    const dateStr = req.query.date;
    // Start of date range in UTC.
    const start = dateStr ? new Date(dateStr + "T00:00:00.000Z") : new Date();
    // If no explicit date was provided, force start to today's UTC midnight.
    if (!dateStr) start.setUTCHours(0, 0, 0, 0);

    // End boundary is start + 1 day 
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    // Manager app calls this endpoint with its email.
    // Because managerEmail is stored in attendance rows at check-in time,
    // this becomes a direct query 
    const rows = await db
      .collection("attendance")
      .find({
        managerEmail,
        // Return rows where check-in happened during start, end
        checkInAt: { $gte: start, $lt: end }
      })
      // Newest first.
      .sort({ checkInAt: -1 })
      //array for JSON response.
      .toArray();

    // Send attendance rows to frontend manager screen.
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// MANAGER HISTORY
// GET /attendance/manager-history/:managerEmail?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get("/attendance/manager-history/:managerEmail", async (req, res) => {
  try {
    const db = await getDb();
    // Manager identity comes from route param.
    const managerEmail = normalizeEmail(req.params.managerEmail);

    // Optional custom date range from query string.
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    // Will be computed below.
    let start;
    let end;

    // If caller provides explicit range, use it.
    if (startDate && endDate) {
      // Inclusive start at UTC midnight.
      start = new Date(`${startDate}T00:00:00.000Z`);
      // End is made exclusive by adding one day after midnight.
      end = new Date(`${endDate}T00:00:00.000Z`);
      end.setUTCDate(end.getUTCDate() + 1);
    } else {
      // Default fallback range = last 7 days 
      end = new Date();
      // End of current day.
      end.setUTCHours(23, 59, 59, 999);
      start = new Date(end);
      // Go back 6 days to cover a 7-day window total.
      start.setUTCDate(start.getUTCDate() - 6);
      // Start of first day in range.
      start.setUTCHours(0, 0, 0, 0);
    }

    // Extended manager view for a custom date range (or last 7 days by default).
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
    // Route specific error log message for easier troubleshooting.
    console.error("GET /attendance/manager-history failed:", err);
    // Include err.message when available for slightly more detail.
    res.status(500).json({ msg: err.message || "Server error" });
  }
});

// EMPLOYEE HISTORY
// GET /attendance/employee-history/:employeeEmail?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get("/attendance/employee-history/:employeeEmail", async (req, res) => {
  try {
    const db = await getDb();
    // Employee identity from route param.
    const employeeEmail = normalizeEmail(req.params.employeeEmail);

    // Optional custom range.
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    // Will be filled based on provided range or default.
    let start;
    let end;

    // Use provided range when present.
    if (startDate && endDate) {
      start = new Date(`${startDate}T00:00:00.000Z`);
      end = new Date(`${endDate}T00:00:00.000Z`);
      end.setUTCDate(end.getUTCDate() + 1);
    } else {
      // Same default as manager history: recent 7 days.
      end = new Date();
      end.setUTCHours(23, 59, 59, 999);
      start = new Date(end);
      start.setUTCDate(start.getUTCDate() - 6);
      start.setUTCHours(0, 0, 0, 0);
    }

    // Employee self-history endpoint mirrors manager-history date handling.
    const rows = await db
      .collection("attendance")
      .find({
        // Filter by employee identity.
        employeeEmail,
        // Filter by check-in timestamp range.
        checkInAt: { $gte: start, $lt: end }
      })
      // Most recent first.
      .sort({ checkInAt: -1 })
      .toArray();

    // Return matching history rows.
    res.json(rows);
  } catch (err) {
    console.error("GET /attendance/employee-history failed:", err);
    res.status(500).json({ msg: err.message || "Server error" });
  }
});

// Export router so backend/server.js can mount these endpoints.
export default router;