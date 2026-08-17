import express from "express";
import http from "http";
import { initSocket } from "./src/socket/socket.js";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/database/db.js";
import authRoutes from "./src/routes/auth.routes.js";
import messageRoutes from "./src/routes/message.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import groupRoutes  from "./src/routes/group.routes.js";
import errorMiddleware from "./src/middleware/error.middleware.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
app.use(cors({
    origin: "*"
}));

initSocket(server);

app.use(express.json());

app.use('/api/auth', authRoutes)
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/groups",groupRoutes)

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

connectDB();
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

