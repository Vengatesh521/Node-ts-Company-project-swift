# Node.js Backend Assignment

A Node.js server with REST APIs using TypeScript, MongoDB, and JSON Placeholder API.

## Setup

1. Install Node.js (LTS version).
2. Install MongoDB and ensure it's running on `mongodb://localhost:27017`.
3. Clone this repository.
4. Run `npm install` to install dependencies.
5. Run `npm start` to start the server.

## Endpoints

- `GET /load`: Loads 10 users, posts, and comments from JSON Placeholder.
- `DELETE /users`: Deletes all users.
- `DELETE /users/:userId`: Deletes a specific user.
- `GET /users/:userId`: Fetches a user with their posts and comments.
- `PUT /users`: Adds a new user.

## Notes

- Uses TypeScript for type safety.
- MongoDB stores data in `users`, `posts`, and `comments` collections.
- Error handling follows REST best practices.
