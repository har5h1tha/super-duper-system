import Group from "../models/group.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createGroup = asyncHandler(async (req, res) => {

    const groupName = req.body.name;

    const creatorId = req.user.id;

    if (!groupName || !groupName.trim()) {
        throw new ApiError(400, "Invalid Group name")
    }

    const group = await Group.create({
        name: groupName,
        createdBy: creatorId,
        members: [creatorId],
        admins: [creatorId]
    })

    res.status(201).json({
        message: "Group created successfully",
        group
    })
})