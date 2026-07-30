import express from "express";
import dotenv from "dotenv";
import connectDB  from "./src/database/db.js";
import authRoutes from "./src/routes/auth.routes.js";
import messageRoutes from "./src/routes/message.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import errorMiddleware from "./src/middleware/error.middleware.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api/auth',authRoutes)
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

connectDB();
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

