import Group from "../models/group.model.js";
import GroupMessage from "../models/groupMessage.model.js";
import User from "../models/user.model.js"
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";

export const createGroup = asyncHandler(async (req, res) => {

    const groupName = req.body.name;

    const creatorId = req.user.id;

    if (!groupName || !groupName.trim()) {
        throw new ApiError(400, "Invalid Group name")
    }

    const existingGroup = await Group.findOne({
        name: groupName.trim(),
        createdBy: creatorId
    });

    if (existingGroup) {
        throw new ApiError(409, "You already have a group with this name");
    }

    const group = await Group.create({
        name: groupName.trim(),
        createdBy: creatorId,
        members: [creatorId],
        admins: [creatorId]
    })

    res.status(201).json({
        message: "Group created successfully",
        group
    })
})

export const addGroupMembers = asyncHandler(async (req, res) => {
    const adminId = req.user.id;
    const { userId } = req.body;
    const groupId = req.params.groupId;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
        throw new ApiError(400, "Invalid group ID");
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
}

    const group = await Group.findById(groupId)
    if (!group) {
        throw new ApiError(404, "no such group")
    }

    if (!group.admins.some(admin => admin.toString() === adminId)) {
        throw new ApiError(403, "forbidden admin")
    }

    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "invalid user")
    }

    if (group.members.some(member => member.toString() === userId)) {
        throw new ApiError(409, "already user is a member")
    }

    group.members.push(userId);
    await group.save();

    res.status(200).json({
        message: "SUCCESS in ADDING MEMBER",
        group
    })

})

export const deleteGroupMembers = asyncHandler(async (req, res) => {
    const requesterId = req.user.id;
    const groupId = req.params.groupId
    const delId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
        throw new ApiError(400, "Invalid group ID");
    }

    if (!mongoose.Types.ObjectId.isValid(delId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const group = await Group.findById(groupId)
    if (!group) {
        throw new ApiError(404, "Invalid group")
    }

    if (!group.admins.some(admin => admin.toString() === requesterId)) {
        throw new ApiError(403, "forbidden admin")
    }
    if (requesterId === delId) {
        throw new ApiError(400, "Admin can't delete themselves currently")
    }

    if (!group.members.some(member => member.toString() === delId)) {
        throw new ApiError(404, "invalid member");
    }

    group.members = group.members.filter(
        member => member.toString() !== delId
    );
    group.admins = group.admins.filter(
        admin => admin.toString() !== delId
    );
    await group.save();

    res.status(200).json({
        message: "DELETE success",
        group
    })


})

export const messageGroupMembers = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const sender = req.user.id;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
        throw new ApiError(400, "Invalid group ID");
    }
    const group = await Group.findById(groupId);
    if (!group) {
        throw new ApiError(404, "Invalid Group")
    }
    if (!group.members.some(member => member.toString() === sender)) {
        throw new ApiError(403, "Invalid user")
    }

    if (!content || !content.trim()) {
        throw new ApiError(400, "Invalid message")
    }

    const grpMsg = await GroupMessage.create({
        sender,
        group: groupId,
        content: content.trim()
    })

    res.status(201).json({
        message: "SUccesfully sent",
        grpMsg
    })
})

export const getGroupMessages = asyncHandler(async (req, res) => {
    const user = req.user.id;
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
        throw new ApiError(400, "Invalid group ID");
    }

    const group = await Group.findById(groupId)
    if (!group) {
        throw new ApiError(404, "Invalid group")
    }

    const isMember = group.members.some((member) => member.toString() === user);
    if (!isMember) {
        throw new ApiError(403, "Invalid user")
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);

    const limit = Math.min(
        Math.max(parseInt(req.query.limit) || 20, 1),
        100
    );
    const skip = (page - 1) * limit;

    const messages = await GroupMessage.find({
        group: groupId
    })
        .populate("sender", "username")
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit);

    res.status(200).json({
        message: "Fetched group messages SUCCESS",
        messages
    })
});

export const getGroupDetails = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
        throw new ApiError(400, "Invalid group ID");
    }

    const group = await Group.findOne({
        _id: groupId,
        members: userId
    })
        .populate("members", "username")
        .populate("admins", "username")
        .populate("createdBy", "username");

    if (!group) {
        throw new ApiError(404, "Group not there")
    }

    res.status(200).json({
        group
    })

})

export const getMyGroups= asyncHandler(async ( req,res)=>{
    const userId = req.user.id;

    const groups = await Group.find({
        members:userId
    }).select("name createdBy members admins")

    res.status(200).json({
        groups
    })
})

export const leaveGroup = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
        throw new ApiError(400, "Invalid group ID");
    }
    const group = await Group.findById(groupId);

    if (!group) {
        throw new ApiError(404, "Group not found");
    }

    const isMember = group.members.some(
        member => member.toString() === userId
    );

    if (!isMember) {
        throw new ApiError(400, "You are not a member of this group");
    }

    const isAdmin = group.admins.some(
        admin => admin.toString() === userId
    );

    if (isAdmin) {
        throw new ApiError(
            400,
            "Admin cannot leave the group currently"
        );
    }

    group.members = group.members.filter(
        member => member.toString() !== userId
    );

    await group.save();

    res.status(200).json({
        message: "Successfully left the group",
        group
    });
});