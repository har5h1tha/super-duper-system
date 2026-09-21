import express from "express"
import {register,login} from "../controllers/auth.controller.js"
import authMiddleware from "../middleware/auth.middleware.js"
import User from "../models/user.model.js"

const router = express.Router()

router.post('/register',register);
router.post('/login',login);
router.get("/profile", authMiddleware, async(req, res) => {
    const user = await User.findById(req.user.id).select("username");
    res.json({
        userId: req.user.id,
        username: user.username
    });
});

export default router