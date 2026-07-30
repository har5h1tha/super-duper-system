import User from "../models/user.model.js";

export const getUsers = async (req, res) => {
    try {

        const loggedInUserId = req.user.id;

        const users = await User.find({
            _id: {
                $ne: loggedInUserId
            }
        }).select("-password");

        res.status(200).json(users);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};