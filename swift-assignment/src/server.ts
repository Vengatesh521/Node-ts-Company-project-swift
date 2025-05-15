import { createServer, IncomingMessage, ServerResponse } from "http";
import { URL } from "url";
import { connectToDb, getDb } from "./db";
import { User } from "./models/User";
import { Post } from "./models/Post";
import { Comment } from "./models/Comment";

// Helper function to parse the request body
const getRequestBody = (req: IncomingMessage): Promise<string> => {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => resolve(body));
    req.on("error", (err) => reject(err));
  });
};

// Create the HTTP server
const server = createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const method = req.method;
    const path = url.pathname;

    res.setHeader("Content-Type", "application/json");

    try {
      // GET /load: Fetch data from JSON Placeholder and store in MongoDB
      if (method === "GET" && path === "/load") {
        const usersResponse = await fetch(
          "https://jsonplaceholder.typicode.com/users"
        );
        const postsResponse = await fetch(
          "https://jsonplaceholder.typicode.com/posts"
        );
        const commentsResponse = await fetch(
          "https://jsonplaceholder.typicode.com/comments"
        );

        if (!usersResponse.ok || !postsResponse.ok || !commentsResponse.ok) {
          res.statusCode = 500;
          res.end(
            JSON.stringify({
              error: "Failed to fetch data from JSON Placeholder",
            })
          );
          return;
        }

        const users: User[] = await usersResponse.json();
        const posts: Post[] = await postsResponse.json();
        const comments: Comment[] = await commentsResponse.json();

        // Limit to 10 users
        const limitedUsers = users.slice(0, 10);

        const db = getDb();
        const usersCollection = db.collection<User>("users");
        const postsCollection = db.collection<Post>("posts");
        const commentsCollection = db.collection<Comment>("comments");

        // Clear existing data
        await usersCollection.deleteMany({});
        await postsCollection.deleteMany({});
        await commentsCollection.deleteMany({});

        // Insert users
        await usersCollection.insertMany(limitedUsers);

        // Insert posts with comments
        const userPosts = posts.filter((post) => post.userId <= 10);
        const postIds = userPosts.map((post) => post.id);
        const postComments = comments.filter((comment) =>
          postIds.includes(comment.postId)
        );
        const postsWithComments = userPosts.map((post) => ({
          ...post,
          comments: postComments.filter(
            (comment) => comment.postId === post.id
          ),
        }));
        await postsCollection.insertMany(postsWithComments);

        // Insert comments separately (optional, since they're already in posts)
        await commentsCollection.insertMany(postComments);

        res.statusCode = 200;
        res.end(JSON.stringify({}));
        return;
      }

      // DELETE /users: Delete all data
      if (method === "DELETE" && path === "/users") {
        const db = getDb();
        const usersCollection = db.collection<User>("users");
        const postsCollection = db.collection<Post>("posts");
        const commentsCollection = db.collection<Comment>("comments");

        await usersCollection.deleteMany({});
        await postsCollection.deleteMany({});
        await commentsCollection.deleteMany({});

        res.statusCode = 200;
        res.end(JSON.stringify({ message: "All users deleted successfully" }));
        return;
      }

      // DELETE /users/:userId: Delete a specific user
      if (method === "DELETE" && path.startsWith("/users/")) {
        const userId = parseInt(path.split("/")[2], 10);
        if (isNaN(userId)) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Invalid userId" }));
          return;
        }

        const db = getDb();
        const usersCollection = db.collection<User>("users");
        const postsCollection = db.collection<Post>("posts");
        const commentsCollection = db.collection<Comment>("comments");

        const userResult = await usersCollection.deleteOne({ id: userId });
        if (userResult.deletedCount === 0) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: "User not found" }));
          return;
        }

        const posts = await postsCollection.find({ userId }).toArray();
        await postsCollection.deleteMany({ userId });
        await commentsCollection.deleteMany({
          postId: { $in: posts.map((post) => post.id) },
        });

        res.statusCode = 200;
        res.end(JSON.stringify({ message: "User deleted successfully" }));
        return;
      }

      // GET /users/:userId: Get a specific user with posts and comments
      if (method === "GET" && path.startsWith("/users/")) {
        const userId = parseInt(path.split("/")[2], 10);
        if (isNaN(userId)) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Invalid userId" }));
          return;
        }

        const db = getDb();
        const usersCollection = db.collection<User>("users");
        const postsCollection = db.collection<Post>("posts");

        const user = await usersCollection.findOne({ id: userId });
        if (!user) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: "User not found" }));
          return;
        }

        const posts = await postsCollection.find({ userId }).toArray();
        const userWithPosts: User = { ...user, posts };

        res.statusCode = 200;
        res.end(JSON.stringify(userWithPosts));
        return;
      }

      // PUT /users: Add a new user
      if (method === "PUT" && path === "/users") {
        const body = await getRequestBody(req);
        let userData: User;
        try {
          userData = JSON.parse(body);
        } catch (err) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Invalid JSON body" }));
          return;
        }

        if (!userData.id || !userData.name || !userData.email) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Missing required fields" }));
          return;
        }

        const db = getDb();
        const usersCollection = db.collection<User>("users");

        const existingUser = await usersCollection.findOne({ id: userData.id });
        if (existingUser) {
          res.statusCode = 409;
          res.end(JSON.stringify({ error: "User already exists" }));
          return;
        }

        await usersCollection.insertOne(userData);
        res.statusCode = 201;
        res.setHeader("Link", `/users/${userData.id}`);
        res.end(JSON.stringify(userData));
        return;
      }

      // Handle unknown routes
      res.statusCode = 404;
      res.end(JSON.stringify({ error: "Not found" }));
    } catch (err) {
      console.error(err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  }
);

// Start the server after connecting to MongoDB
connectToDb()
  .then(() => {
    server.listen(3000, () => {
      console.log("Server running on port 3000");
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  });
