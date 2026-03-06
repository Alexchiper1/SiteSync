import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import usersAPI from "./users_api.js";
import sitesAPI from "./sites_api.js";
import tasksAPI from "./tasks_api.js";
import attendanceAPI from "./attendance_api.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

app.use(usersAPI);
app.use(sitesAPI);
app.use(tasksAPI);
app.use(attendanceAPI);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});