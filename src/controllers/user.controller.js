import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getUsers = asyncHandler (async (req, res) => {
 
    const loggedInUserId = req.user.id;

        const users = await User.find({
            _id: {
                $ne: loggedInUserId
            }
        }).select("-password");

        res.status(200).json(users);
})

export const getMe= async(req,res) => {

    const currUser = await User.findById(req.user.id).select("-password");

    if(!currUser){
        throw new ApiError(404,"user not found")
    }

    return res.status(200).json(currUser)

}