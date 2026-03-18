import express from "express";
import { ObjectId } from "mongodb";
import { getDb } from "./db.js";

const router = express.Router();

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

// create holiday request
router.post("/holiday-requests", async (req, res) => {
  try {
    const { siteId, employeeEmail, employeeName, startDate, endDate, reason } = req.body;

    if (!siteId || !employeeEmail || !startDate || !endDate) {
      return res.status(400).json({ msg: "Missing fields" });
    }

    if (startDate > endDate) {
      return res.status(400).json({ msg: "End date must be after start date" });
    }

    const db = await getDb();
    const email = normalizeEmail(employeeEmail);

    const member = await db.collection("siteMembers").findOne({
      siteId: String(siteId),
      employeeEmail: email
    });

    if (!member) {
      return res.status(403).json({ msg: "You are not registered in this site" });
    }

    const site = await db.collection("sites").findOne({
      _id: new ObjectId(siteId)
    });

    if (!site) {
      return res.status(404).json({ msg: "Site not found" });
    }

    await db.collection("holidayRequests").insertOne({
      siteId: String(siteId),
      siteName: site.name,
      managerEmail: normalizeEmail(site.managerEmail),
      employeeEmail: email,
      employeeName: employeeName || email,
      startDate,
      endDate,
      reason: reason || "",
      status: "pending",
      managerNote: "",
      createdAt: new Date(),
      decidedAt: null
    });

    res.status(201).json({ msg: "Holiday request sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error creating holiday request" });
  }
});

// employee holiday requests
router.get("/holiday-requests/employee/:email", async (req, res) => {
  try {
    const db = await getDb();

    const requests = await db
      .collection("holidayRequests")
      .find({ employeeEmail: normalizeEmail(req.params.email) })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching holiday requests" });
  }
});

// manager holiday requests
router.get("/holiday-requests/manager/:managerEmail", async (req, res) => {
  try {
    const db = await getDb();

    const requests = await db
      .collection("holidayRequests")
      .find({ managerEmail: normalizeEmail(req.params.managerEmail) })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching holiday requests" });
  }
});

// approve / deny holiday request
router.put("/holiday-requests/:requestId", async (req, res) => {
  try {
    const { status, managerEmail, managerNote } = req.body;

    if (!["approved", "denied"].includes(status)) {
      return res.status(400).json({ msg: "Invalid status" });
    }

    const db = await getDb();
    const requestId = req.params.requestId;
    const manager = normalizeEmail(managerEmail);

    const request = await db.collection("holidayRequests").findOne({
      _id: new ObjectId(requestId)
    });

    if (!request) {
      return res.status(404).json({ msg: "Holiday request not found" });
    }

    if (request.managerEmail !== manager) {
      return res.status(403).json({ msg: "You cannot update this request" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ msg: "This request was already updated" });
    }

    const site = await db.collection("sites").findOne({
      _id: new ObjectId(request.siteId),
      managerEmail: manager
    });

    if (!site) {
      return res.status(403).json({ msg: "You do not manage this site" });
    }

    await db.collection("holidayRequests").updateOne(
      { _id: request._id },
      {
        $set: {
          status,
          managerNote: managerNote || "",
          decidedAt: new Date()
        }
      }
    );

    res.json({
      msg: status === "approved" ? "Holiday request approved" : "Holiday request denied"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error updating holiday request" });
  }
});

export default router;
