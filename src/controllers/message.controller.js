import Message from "../models/message.model.js";

export const sendMessage = async (req, res) => {
    try {
        const sender = req.user.id;
        const { receiver, content } = req.body;

        if (!receiver || !content) {
            return res.status(400).json({
                message: "Receiver and message are required"
            });
        }

        const newMessage = await Message.create({
            sender,
            receiver,
            content
        });

        return res.status(201).json({
            message: "Message sent successfully",
            data: newMessage
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

export const getMessages = async (req, res) => {
    try {
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

    } catch (err) {
        return res.status(500).json({
            message: err.message,
        });
    }
};