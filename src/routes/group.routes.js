import express from "express"
import {createGroup} from "../controllers/groupController.js"
import authMiddleware from "../middleware/auth.middleware.js"


const router = express.Router();

router.post('/',authMiddleware,createGroup)

export default router