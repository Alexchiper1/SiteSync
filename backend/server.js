import express from "express";
import cors from "cors";

import usersAPI from "./users_api.js";
import sitesAPI from "./sites_api.js";
import tasksAPI from "./tasks_api.js";

const app = express();
app.use(cors());
app.use(express.json());

// allow frontend access to images
app.use("/uploads", express.static("uploads"));

// mount APIs
app.use(usersAPI);
app.use(sitesAPI);
app.use(tasksAPI);

app.listen(5000, () => {
  console.log("Server running on 5000");
});