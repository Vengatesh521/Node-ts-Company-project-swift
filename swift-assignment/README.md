Node.js Backend Assignment
Description
This project is a Node.js backend application built for the Node.js Backend Assignment. It provides a REST API to manage users, posts, and comments, using MongoDB as the database. The application fetches data from JSON Placeholder, stores it in MongoDB, and provides endpoints to retrieve, add, and delete users and their associated data.
The project adheres to the assignment requirements:

Uses only typescript and mongodb as dependencies (ts-node is used for running the server).
Implements a server using Node.js's built-in http module (no express).
Fetches data using fetch (no axios).
Provides REST endpoints: GET /load, DELETE /users, DELETE /users/:userId, GET /users/:userId, and PUT /users.
Uses TypeScript for proper typing of request and response bodies.
Follows REST best practices (appropriate status codes, Link header in PUT /users).

Prerequisites

Node.js: Version 18 or higher (to support fetch).
MongoDB: A running MongoDB instance (local or MongoDB Atlas).
VS Code: Recommended for testing APIs with the REST Client extension.

Setup Instructions

Clone or Extract the Project:

If you received this as a zip file, extract it to a folder (e.g., swift-assignment).

Install Dependencies:Navigate to the project directory and install dependencies:
cd swift-assignment
npm install

Set Up MongoDB:

Local MongoDB:
Ensure MongoDB is installed and running on mongodb://127.0.0.1:27017.
Start MongoDB:mongod --dbpath /path/to/data/db

MongoDB Atlas:
Update the uri in src/db.ts with your Atlas connection string:const uri = "mongodb+srv://<username>:<password>@cluster0.mongodb.net/node_assignment?retryWrites=true&w=majority";

Running the Server

Start the server:npm start

This runs ts-node to execute src/server.ts.
You should see:Attempting to connect to MongoDB at: mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000
Connected to MongoDB
Server running on port 3000

Testing the APIs

Open VS Code:

Open the project folder in VS Code.
Ensure the REST Client extension is installed.

Use the api-tests.http File:

Open api-tests.http in the project root.
Run each request by clicking "Send Request" above each section.

Available Requests:

GET /load: Loads 10 users, their posts, and comments into MongoDB.
GET /users/1: Retrieves user with ID 1, including their posts and comments.
PUT /users: Adds a new user (ID 11).
DELETE /users/11: Deletes the user with ID 11.
DELETE /users: Deletes all users and associated data.

Verify Data in MongoDB:

Use MongoDB Compass to connect to your database (mongodb://127.0.0.1:27017 or your Atlas URI).
Check the node_assignment database for the users, posts, and comments collections.

API Endpoints

GET /load:
Fetches 10 users, their posts, and comments from JSON Placeholder and stores them in MongoDB.
Response: {} (status 200).

DELETE /users:
Deletes all data from the users, posts, and comments collections.
Response: { "message": "All users deleted successfully" } (status 200).

DELETE /users/:userId:
Deletes a specific user and their associated posts and comments.
Response: { "message": "User deleted successfully" } (status 200), or { "error": "User not found" } (status 404).

GET /users/:userId:
Retrieves a user with their posts and comments nested under posts.
Response: User object (status 200), or { "error": "User not found" } (status 404).

PUT /users:
Adds a new user.
Response: User object (status 201) with a Link header, or { "error": "User already exists" } (status 409), or { "error": "Missing required fields" } (status 400).

Project Structure

src/server.ts: Main server file implementing the REST API.
src/db.ts: MongoDB connection setup.
src/models/User.ts: TypeScript interface for users.
src/models/Post.ts: TypeScript interface for posts.
src/models/Comment.ts: TypeScript interface for comments.
api-tests.http: File for testing APIs with VS Code REST Client.
package.json: Project dependencies and scripts.

Steps:
Stop the server (Ctrl + C).
