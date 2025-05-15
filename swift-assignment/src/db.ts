import { MongoClient, Db } from "mongodb";
import process from "process";

const uri =
  "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000"; // Use your MongoDB Atlas URI if applicable
const client = new MongoClient(uri);

let db: Db | null = null;

export const connectToDb = async () => {
  try {
    console.log("Attempting to connect to MongoDB at:", uri);
    await client.connect();
    db = client.db("node_assignment");
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    throw new Error("Failed to connect to MongoDB");
  }
};

export const getDb = (): Db => {
  if (!db) {
    throw new Error("Database not connected");
  }
  return db;
};

process.on("SIGINT", async () => {
  await client.close();
  console.log("MongoDB connection closed");
  process.exit(0);
});
