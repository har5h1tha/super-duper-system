import express from "express"
import {
    createGroup,
    addGroupMembers,
    deleteGroupMembers,
    messageGroupMembers,
    getGroupMessages,
    getGroupDetails,
    getMyGroups,
    leaveGroup
}
    from "../controllers/groupController.js"
import authMiddleware from "../middleware/auth.middleware.js"


const router = express.Router();

router.post('/', authMiddleware, createGroup)
router.post('/:groupId/members', authMiddleware, addGroupMembers)
router.delete('/:groupId/members/:userId', authMiddleware, deleteGroupMembers)
router.delete('/:groupId/leave',authMiddleware,leaveGroup);
router.post('/:groupId/messages', authMiddleware, messageGroupMembers)
router.get('/:groupId/messages', authMiddleware, getGroupMessages)
router.get("/:groupId", authMiddleware, getGroupDetails)
router.get('/', authMiddleware, getMyGroups)

export default router