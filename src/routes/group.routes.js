import express from "express"
import {createGroup,addGroupMembers} from "../controllers/groupController.js"
import authMiddleware from "../middleware/auth.middleware.js"


const router = express.Router();

router.post('/',authMiddleware,createGroup)
router.post('/:groupId/members',authMiddleware,addGroupMembers)

export default router