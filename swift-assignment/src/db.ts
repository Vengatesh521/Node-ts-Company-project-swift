import { MongoClient } from "mongodb";

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

let db: any;

export const connectToDb = async () => {
  try {
    await client.connect();
    db = client.db("node_assignment");
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    throw new Error("Failed to connect to MongoDB");
  }
};

export const getDb = () => {
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
