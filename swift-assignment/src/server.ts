import express, {
  Application,
  Request,
  Response,
  RequestHandler,
} from "express";
import axios from "axios";
import { connectToDb, getDb } from "./db";
import { User } from "./models/User";
import { Post } from "./models/Post";
import { Comment } from "./models/Comment";

const app: Application = express();
app.use(express.json()); // Parse JSON request bodies

// Connect to MongoDB when the server starts
connectToDb().then(() => {
  app.listen(3000, () => console.log("Server running on port 3000"));
});

// GET /load
app.get("/load", (async (req: Request, res: Response) => {
  try {
    const usersResponse = await axios.get(
      "https://jsonplaceholder.typicode.com/users"
    );
    const postsResponse = await axios.get(
      "https://jsonplaceholder.typicode.com/posts"
    );
    const commentsResponse = await axios.get(
      "https://jsonplaceholder.typicode.com/comments"
    );

    const db = getDb();
    const usersCollection = db.collection("users");
    const postsCollection = db.collection("posts");
    const commentsCollection = db.collection("comments");

    await usersCollection.deleteMany({});
    await postsCollection.deleteMany({});
    await commentsCollection.deleteMany({});

    const users: User[] = usersResponse.data.slice(0, 10);
    await usersCollection.insertMany(users);

    const posts: Post[] = postsResponse.data.map((post: any) => {
      const postComments: Comment[] = commentsResponse.data.filter(
        (comment: any) => comment.postId === post.id
      );
      return { ...post, comments: postComments };
    });
    await postsCollection.insertMany(posts);

    const comments: Comment[] = commentsResponse.data;
    await commentsCollection.insertMany(comments);

    res.status(200).json({});
  } catch (err) {
    console.error("Error loading data:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}) as RequestHandler);

// DELETE /users
app.delete("/users", (async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const usersCollection = db.collection("users");
    const postsCollection = db.collection("posts");
    const commentsCollection = db.collection("comments");

    await usersCollection.deleteMany({});
    await postsCollection.deleteMany({});
    await commentsCollection.deleteMany({});

    res.status(200).json({ message: "All users deleted successfully" });
  } catch (err) {
    console.error("Error deleting users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}) as RequestHandler);

// DELETE /users/:userId
app.delete("/users/:userId", (async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);

  try {
    const db = getDb();
    const usersCollection = db.collection("users");
    const postsCollection = db.collection("posts");
    const commentsCollection = db.collection("comments");

    const userResult = await usersCollection.deleteOne({ id: userId });
    if (userResult.deletedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const posts = await postsCollection.find({ userId }).toArray();
    await postsCollection.deleteMany({ userId });
    await commentsCollection.deleteMany({
      postId: { $in: posts.map((post: Post) => post.id) },
    });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}) as RequestHandler);

// GET /users/:userId
app.get("/users/:userId", (async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);

  try {
    const db = getDb();
    const usersCollection = db.collection("users");
    const postsCollection = db.collection("posts");

    const user = await usersCollection.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const posts = await postsCollection.find({ userId }).toArray();
    const userWithPosts = { ...user, posts };

    res.status(200).json(userWithPosts);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}) as RequestHandler);

// PUT /users
app.put("/users", (async (req: Request, res: Response) => {
  const userData: User = req.body;

  if (!userData.id || !userData.name || !userData.email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const db = getDb();
    const usersCollection = db.collection("users");

    const existingUser = await usersCollection.findOne({ id: userData.id });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    await usersCollection.insertOne(userData);
    res.status(201).json(userData);
  } catch (err) {
    console.error("Error adding user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}) as RequestHandler);
