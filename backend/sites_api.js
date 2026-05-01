import express from "express";
import { ObjectId } from "mongodb";
import { getDb } from "./db.js";

// This file defines every API route that works with sites
const router = express.Router();

// ---------------- SITES ----------------
// Create a new site
// The frontend sends the site details in req.body, and MongoDB stores that body in the sites collection
router.post("/sites", async (req, res) => {
  const db = await getDb();
  await db.collection("sites").insertOne(req.body);
  res.status(201).json({ msg: "Site created" });
});

// Returns all the sites owned by the manager.
// The manager email comes from the URL, then MongoDB filters sites where the stored managerEmail matches that value
router.get("/sites/:managerEmail", async (req, res) => {
  const db = await getDb();

  const sites = await db
    .collection("sites")
    .find({ managerEmail: req.params.managerEmail })
    .toArray();

  res.json(sites);
});

// Update one site by MongoDB id.
// Using ObjectId because the _id field in the sites collection is a MongoDB ObjectId
router.put("/sites/:siteId", async (req, res) => {
  try {
    const db = await getDb();
    const siteId = req.params.siteId;

    // Load the existing site before changing it so we can confirm it exists
    const existingSite = await db.collection("sites").findOne({
      _id: new ObjectId(siteId)
    });

    if (!existingSite) {
      return res.status(404).json({ msg: "Site not found" });
    }

    // Build an explicit update object instead of writing the whole req.body.
    // this keeps route focused on the fields a site is meant to own.
    const updates = {
      name: req.body.name,
      location: req.body.location,
      joinKey: req.body.joinKey,
      radiusMeters: Number(req.body.radiusMeters),
      lat: req.body.lat,
      lng: req.body.lng,
      managerEmail: req.body.managerEmail
    };

    // Save the new site details in the main sites collection.
    await db.collection("sites").updateOne(
      { _id: new ObjectId(siteId) },
      { $set: updates }
    );

    // Several other collections store a copy of siteName for quick display, If the site is renamed, those copied names must be updated too
    if (existingSite.name !== updates.name) {
      await db.collection("siteMembers").updateMany(
        { siteId },
        { $set: { siteName: updates.name } }
      );

      await db.collection("tasks").updateMany(
        { siteId },
        { $set: { siteName: updates.name } }
      );

      await db.collection("attendance").updateMany(
        { siteId },
        { $set: { siteName: updates.name } }
      );

      await db.collection("holidayRequests").updateMany(
        { siteId },
        { $set: { siteName: updates.name } }
      );
    }

    res.json({ msg: "Site updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error updating site" });
  }
});

// Get site by id, for map display and check-in, where frontend needs the exact site location.
router.get("/site/:siteId", async (req, res) => {
  try {
    const db = await getDb();

    const site = await db.collection("sites").findOne({
      _id: new ObjectId(req.params.siteId)
    });

    if (!site) {
      return res.status(404).json({ msg: "Site not found" });
    }

    res.json(site);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching site" });
  }
});

// Search sites by name, The regular expression lets users find partial (so search a you will find all sites containign a), instead of needing the exact site name.
router.get("/sites-search/:query", async (req, res) => {
  const db = await getDb();

  const sites = await db
    .collection("sites")
    .find({ name: { $regex: req.params.query, $options: "i" } })
    .toArray();

  res.json(sites);
});

// Employee join a site, The frontend sends a siteId, joinKey, and employeeEmail. The route first checks that the join key belongs to that site
router.post("/join-site", async (req, res) => {
  try {
    const { siteId, joinKey, employeeEmail } = req.body;

    const db = await getDb();

    // Match both _id and joinKey in one lookup so a valid key for one site
    const site = await db.collection("sites").findOne({
      _id: new ObjectId(siteId),
      joinKey: joinKey
    });

    if (!site) {
      return res.status(400).json({ msg: "Invalid join key" });
    }

    // Store email in a normalized format so later lookups by email match even if the user accidentally typs cap letter or space.
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

// Return every site for the employee.
router.get("/employee-sites/:email", async (req, res) => {
  const db = await getDb();

  const sites = await db
    .collection("siteMembers")
    .find({ employeeEmail: req.params.email.trim().toLowerCase() })
    .toArray();

  res.json(sites);
});

// Delete a site,
router.delete("/sites/:siteId", async (req, res) => {
  try {
    const db = await getDb();

    // The sites uses ObjectId for the _id, so the URL string is converted, before deletion.
    await db.collection("sites").deleteOne({
      _id: new ObjectId(req.params.siteId)
    });

    // Related collections store siteId as a string
    await db.collection("siteMembers").deleteMany({
      siteId: req.params.siteId
    });

    await db.collection("tasks").deleteMany({
      siteId: req.params.siteId
    });

    await db.collection("holidayRequests").deleteMany({
      siteId: req.params.siteId
    });

    res.json({ msg: "Site deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error deleting site" });
  }
});

// app.js imports this router and mounts it with the other API routers.
export default router;
