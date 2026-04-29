import "./env.js";
import { MongoClient } from "mongodb";

// Connection string from env
const uri = process.env.MONGO_URI;

// Fail fast at startup time if we forgot to configure the database URL.
if (!uri) {
  throw new Error("MONGO_URI missing. Check your environment variables.");
}
// One shared client instance for the whole app 
const client = new MongoClient(uri);
// Holds the Promise so callers share one connection attempt
let connectionPromise;
// Async function other modules import, returns a handle to database named app on MongoDB cluster.
export async function getDb() {
  // First caller make the promise, later callers await the same promise.
  if (!connectionPromise) {
    connectionPromise = client.connect();
  }

  // Wait until auth to MongoDB finished for this process.
  await connectionPromise;
  // Database name on the server collections live inside this DB.
  return client.db("app");
}
