import express from "express"
import {createGroup,addGroupMembers,deleteGroupMembers} from "../controllers/groupController.js"
import authMiddleware from "../middleware/auth.middleware.js"


const router = express.Router();

router.post('/',authMiddleware,createGroup)
router.post('/:groupId/members',authMiddleware,addGroupMembers)
router.post('/:groupId/members/:userId',authMiddleware,deleteGroupMembers)

export default router