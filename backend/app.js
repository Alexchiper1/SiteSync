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

// Allow approved origins to send requests to the server.
app.use(
  cors({
    // origin callback runs per request
    origin(origin, callback) {
      const isLocalhost = origin?.startsWith("http://localhost:");
      const isVercelDeployment = origin?.endsWith(".vercel.app");
      const isConfiguredFrontend = origin === process.env.FRONTEND_URL;

      // Allow no Origin, local dev, Vercel production, or exact FRONTEND_URL from env.
      if (!origin || isLocalhost || isVercelDeployment || isConfiguredFrontend) {
        return callback(null, true); // null = no error, true = reflect this origin in Access-Control-Allow-Origin
      }

      return callback(new Error("Origin not allowed by CORS"));
    }
  })
);
// Parse JSON request bodies into req.body for routes that send application/json.
app.use(express.json());

// Stack feature routers on the shared api router
api.use(usersAPI);
api.use(sitesAPI);
api.use(tasksAPI);
api.use(attendanceAPI);
api.use(holidayRequestsAPI);

// Mount the same router at "/" so some routes may also work without the /api prefix
app.use(api);
// Primary mount: all grouped routes live under /api/for the frontend
app.use("/api", api);

// Default export used by api/[[...path]].js and local server startup the assembled HTTP app.
export default app;