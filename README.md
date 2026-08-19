# CollabHub

A real-time collaboration and messaging platform built with **Node.js, Express, MongoDB, Socket.IO, and React**.

CollabHub is a backend-focused project exploring how real-time applications work beyond basic CRUD, including authentication, WebSockets, message state synchronization, multi-device support, and scalable backend architecture.

## Features

* JWT-based authentication
* Protected REST APIs
* One-to-one real-time messaging
* Persistent message history with MongoDB
* Message states: `sent → delivered → read`
* Real-time typing indicators
* Online/offline presence
* Multi-device Socket.IO support
* React frontend

## Tech Stack

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* Socket.IO
* JWT

### Frontend

* React
* Socket.IO Client

### Tools

* Git & GitHub
* Postman
* Nodemon

## API Endpoints

All protected endpoints require:

```http id="d8zq76"
Authorization: Bearer <JWT>
```

### Authentication

| Method | Endpoint             | Description                | Auth |
| ------ | -------------------- | -------------------------- | ---- |
| `POST` | `/api/auth/register` | Register a new user        | No   |
| `POST` | `/api/auth/login`    | Login and receive JWT      | No   |
| `GET`  | `/api/auth/profile`  | Get current user's profile | Yes  |

### Users

| Method | Endpoint     | Description                       | Auth |
| ------ | ------------ | --------------------------------- | ---- |
| `GET`  | `/api/users` | Get users available for messaging | Yes  |

### Messages

| Method | Endpoint                | Description               | Auth |
| ------ | ----------------------- | ------------------------- | ---- |
| `POST` | `/api/messages/send`    | Send a one-to-one message | Yes  |
| `GET`  | `/api/messages/:userId` | Get conversation history  | Yes  |

## Socket.IO Events

### Client → Server

| Event               | Purpose                                     |
| ------------------- | ------------------------------------------- |
| `typing`            | Notify another user that you are typing     |
| `stop-typing`       | Notify another user that you stopped typing |
| `message-delivered` | Mark a message as delivered                 |
| `message-read`      | Mark a message as read                      |

### Server → Client

| Event               | Purpose                                 |
| ------------------- | --------------------------------------- |
| `receive-message`   | Deliver a new message in real time      |
| `user-typing`       | Notify that another user is typing      |
| `user-stop-typing`  | Notify that another user stopped typing |
| `message-delivered` | Notify sender of delivery status        |
| `message-read`      | Notify sender of read status            |
| `online-users`      | Send currently online users             |
| `user-online`       | Notify when a user comes online         |
| `user-offline`      | Notify when a user goes offline         |

## Architecture

```text id="q7r4kn"
                    CollabHub
                       │
              ┌────────┴────────┐
              │                 │
          REST API           Socket.IO
              │                 │
          Express          Real-time events
              │                 │
              └────────┬────────┘
                       │
                    MongoDB
```

REST APIs handle operations such as authentication, users, message persistence, and message history.

Socket.IO handles real-time communication such as:

* Messages
* Typing indicators
* Online/offline presence
* Delivery receipts
* Read receipts

## Project Structure

```text id="8m1q6p"
collabhub/
│
├── frontend/
│
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── message.controller.js
│   │   └── user.controller.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   └── socketAuth.middleware.js
│   │
│   ├── models/
│   │   ├── user.model.js
│   │   └── message.model.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── message.routes.js
│   │   └── user.routes.js
│   │
│   ├── socket/
│   │   └── socket.js
│   │
│   ├── database/
│   │   └── db.js
│   │
│   └── utils/
│       ├── ApiError.js
│       └── asyncHandler.js
│
├── server.js
├── package.json
├── .env
└── README.md
```

## Real-Time Messaging

Messages are persisted in MongoDB and delivered in real time using Socket.IO.

The message lifecycle is:

```text id="t3k5w8"
sent
  ↓
delivered
  ↓
read
```

The backend validates the authenticated user before allowing delivery or read status updates.

### Multi-Device Support

Each user can have multiple active Socket.IO connections.

```text id="4k2k8y"
User A
 ├── Socket 1
 ├── Socket 2
 └── Socket 3
```

This allows real-time events such as message status updates to reach all active devices belonging to the user.

### Online Presence

The server tracks active socket connections and broadcasts:

```text id="0s7o8w"
user-online
user-offline
```

A user is considered offline only after their last active socket disconnects.

## Getting Started

### 1. Clone the repository

```bash id="x1kn6h"
git clone "https://github.com/har5h1tha/super-duper-system"
cd collabhub
```

### 2. Install backend dependencies

```bash id="t7k5k3"
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env id="3ymk9a"
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Make sure `.env` is included in `.gitignore`.

### 4. Start the backend

```bash id="j9u7i4"
npm run dev
```

### 5. Start the frontend

```bash id="8w4g2e"
cd frontend
npm install
npm run dev
```

## Current Status

### Completed

* [x] User registration
* [x] User login
* [x] JWT authentication
* [x] Protected routes
* [x] User profile
* [x] User listing
* [x] One-to-one messaging
* [x] Message persistence
* [x] Message history
* [x] Socket.IO authentication
* [x] Real-time messaging
* [x] Typing indicators
* [x] Online/offline presence
* [x] Multi-device socket handling
* [x] Delivery receipts
* [x] Read receipts

### Planned

* [ ] Group chats
* [ ] Socket.IO rooms
* [ ] Group roles and permissions
* [ ] Message pagination
* [ ] Redis
* [ ] Rate limiting
* [ ] Structured logging
* [ ] Refresh tokens
* [ ] Production deployment
* [ ] AI-powered collaboration features

## Why I Built This

CollabHub is a hands-on project for understanding backend engineering beyond CRUD applications.

The project focuses on **authentication, database design, REST APIs, WebSockets, real-time state synchronization, multi-device communication, and scalable backend architecture**.

The system is being developed incrementally, with the goal of eventually making it production-ready.

## License

This project is currently being developed as a personal learning and portfolio project.
