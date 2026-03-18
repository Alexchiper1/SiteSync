import "./env.js";
import express from "express";
import cors from "cors";

import usersAPI from "./users_api.js";
import sitesAPI from "./sites_api.js";
import tasksAPI from "./tasks_api.js";
import attendanceAPI from "./attendance_api.js";
import holidayRequestsAPI from "./holidayRequests_api.js";

const app = express();
const api = express.Router();

app.use(
  cors({
    origin(origin, callback) {
      const isLocalhost = origin?.startsWith("http://localhost:");
      const isVercelDeployment = origin?.endsWith(".vercel.app");
      const isConfiguredFrontend = origin === process.env.FRONTEND_URL;

      if (!origin || isLocalhost || isVercelDeployment || isConfiguredFrontend) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    }
  })
);
app.use(express.json());
app.use("/uploads", express.static("uploads"));

api.use(usersAPI);
api.use(sitesAPI);
api.use(tasksAPI);
api.use(attendanceAPI);
api.use(holidayRequestsAPI);

app.use(api);
app.use("/api", api);

export default app;