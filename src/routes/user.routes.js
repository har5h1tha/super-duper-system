import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { getUsers,getMe } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/", authMiddleware, getUsers);
router.get("/me", authMiddleware, getMe);

export default router;