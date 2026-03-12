import "./env.js";
import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error("MONGO_URI missing. Check your environment variables.");
}

const client = new MongoClient(uri);
let connectionPromise;

export async function getDb() {
  if (!connectionPromise) {
    connectionPromise = client.connect();
  }

  await connectionPromise;
  return client.db("app");
}
