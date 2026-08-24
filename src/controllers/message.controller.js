import Message from "../models/message.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getIO, userSocketMap } from "../socket/socket.js";
import mongoose from "mongoose";

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
    const populatedMessage = await newMessage.populate([
    {
        path: "sender",
        select: "username"
    },
    {
        path: "receiver",
        select: "username"
    }
]);

    const io = getIO();

    const receiverSockets = userSocketMap[receiver];

    if (receiverSockets) {
        receiverSockets.forEach((socketId) => {
            io.to(socketId).emit("receive-message", populatedMessage);
        });
    }
    const senderSockets= userSocketMap[sender];

    if (senderSockets) {
        senderSockets.forEach((socketId) => {
            io.to(socketId).emit("receive-message", populatedMessage);
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
    
    const messagesToRead = await Message.find({
        sender: otherUserId,
        receiver: myId,
        status: { $in: ["sent", "delivered"] }
    }).select("_id");

    await Message.updateMany(
        {
            sender: otherUserId,
            receiver: myId,
            status: { $in: ["sent", "delivered"] }
        },
        {
            $set: { status: "read" }
        }
    );
    
    const io = getIO();
    const senderSockets = userSocketMap[otherUserId];

    if (senderSockets && messagesToRead.length > 0) {
        senderSockets.forEach((socketId) => {
            io.to(socketId).emit("messages-read", {
                messageIds: messagesToRead.map(
                    message => message._id.toString()
                )
            });
        });
    }

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

export const getConversations =asyncHandler(async (req,res) =>{
    const userId = req.user.id;

    const messages = await Message.find({
        $or:[
            {sender : userId},
            { receiver : userId}
        ]
    })
        .sort({createdAt:-1})
        .populate("sender","username")
        .populate("receiver","username");

    const conversations =[];
    const seenUsers = new Set();

    for(const message of messages){
        const otherUser = 
            message.sender._id.toString() === userId 
            ? message.receiver : message.sender;

        const otherUserId = otherUser._id.toString();

        if(seenUsers.has(otherUserId)){
            continue;
        }
        seenUsers.add(otherUserId);

        conversations.push({
            user:otherUser,
            lastMessage : message
        })
    }
    res.status(200).json({
        conversations
    });
})