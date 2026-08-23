import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { sendMessage,getMessages,getConversations } from "../controllers/message.controller.js";

const router = express.Router();

router.post("/send", authMiddleware, sendMessage);
router.get("/conversations", authMiddleware, getConversations);
router.get("/:userId", authMiddleware, getMessages);

export default router;