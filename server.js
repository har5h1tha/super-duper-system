import express from "express";
import dotenv from "dotenv";
import connectDB  from "./src/database/db.js";
import authRoutes from "./src/routes/auth.routes.js"

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api/auth',authRoutes)

const PORT = process.env.PORT || 5000;

connectDB();
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

