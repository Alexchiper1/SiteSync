import express from "express";
import { ObjectId } from "mongodb";
import { getDb } from "./db.js";

const router = express.Router();

// ---------------- SITES ----------------

// create site
router.post("/sites", async (req, res) => {
  const db = await getDb();
  await db.collection("sites").insertOne(req.body);
  res.status(201).json({ msg: "Site created" });
});

// get sites for manager
router.get("/sites/:managerEmail", async (req, res) => {
  const db = await getDb();

  const sites = await db
    .collection("sites")
    .find({ managerEmail: req.params.managerEmail })
    .toArray();

  res.json(sites);
});

// get one site by id (for employee map/check-in)
router.get("/site/:siteId", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("app");

    const site = await db.collection("sites").findOne({
      _id: new ObjectId(req.params.siteId)
    });

    if (!site) return res.status(404).json({ msg: "Site not found" });

    res.json(site);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching site" });
  }
});

// search sites
router.get("/sites-search/:query", async (req, res) => {
  const db = await getDb();

  const sites = await db
    .collection("sites")
    .find({ name: { $regex: req.params.query, $options: "i" } })
    .toArray();

  res.json(sites);
});

// join site
router.post("/join-site", async (req, res) => {
  try {
    const { siteId, joinKey, employeeEmail } = req.body;

    const db = await getDb();

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

// get sites joined by employee
router.get("/employee-sites/:email", async (req, res) => {
  const db = await getDb();

  const sites = await db
    .collection("siteMembers")
    .find({ employeeEmail: req.params.email.trim().toLowerCase() })
    .toArray();

  res.json(sites);
});

// DELETE SITE
router.delete("/sites/:siteId", async (req, res) => {
  try {
    const db = await getDb();

    await db.collection("sites").deleteOne({
      _id: new ObjectId(req.params.siteId)
    });

    await db.collection("siteMembers").deleteMany({
      siteId: req.params.siteId
    });

    await db.collection("tasks").deleteMany({
      siteId: req.params.siteId
    });

    res.json({ msg: "Site deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error deleting site" });
  }
});

export default router;