import "./env.js";
import express from "express";
import cors from "cors";

import usersAPI from "./users_api.js";
import sitesAPI from "./sites_api.js";
import tasksAPI from "./tasks_api.js";

const app = express();
const api = express.Router();

app.use(
  cors({
    origin(origin, callback) {
      const isLocalhost = origin?.startsWith("http://localhost:");
      const isVercelDomain = origin?.endsWith(".vercel.app");
      const matchesConfiguredFrontend = origin === process.env.FRONTEND_URL;

      if (!origin || isLocalhost || isVercelDomain || matchesConfiguredFrontend) {
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

app.use(api);
app.use("/api", api);

export default app;
