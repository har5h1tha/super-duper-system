import Message from "../models/message.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getIO, userSocketMap } from "../socket/socket.js";

export const sendMessage = asyncHandler(async (req, res) => {

    const sender = req.user.id;
    const { receiver, content } = req.body;

    if (!receiver || !content) {
        throw new ApiError(400, "Receiver and message are required");
    }

    const newMessage = await Message.create({
        sender,
        receiver,
        content
    });

    const io = getIO();

    const receiverSockets = userSocketMap[receiver];

    if (receiverSockets) {
        receiverSockets.forEach((socketId) => {
            io.to(socketId).emit("receive-message", newMessage);
        });
    }
    const senderSockets= userSocketMap[sender];

    if (senderSockets) {
        senderSockets.forEach((socketId) => {
            io.to(socketId).emit("receive-message", newMessage);
        });
    }

    return res.status(201).json({
        message: "Message sent successfully",
        data: newMessage
    });


})

export const getMessages = asyncHandler(async (req, res) => {

    const myId = req.user.id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
        $or: [
            {
                sender: myId,
                receiver: otherUserId,
            },
            {
                sender: otherUserId,
                receiver: myId,
            },
        ],
    }).sort({ createdAt: 1 });
    console.log("My ID:", req.user.id);
    console.log("Other ID:", req.params.userId);

    return res.status(200).json(messages);
})