import { Server } from "socket.io";
import Message from "../models/message.model.js";
import socketAuth from "../middleware/socketAuth.middleware.js";

let io;
const userSocketMap = {};

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
        },
    });

    io.use(socketAuth);

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        const userId = socket.user.id;


        if (!userSocketMap[userId])
            userSocketMap[userId] = new Set();

        userSocketMap[userId].add(socket.id);


        socket.emit("online-users", Object.keys(userSocketMap));

        io.emit("user-online", {
            userId
        });

        socket.on("typing", ({ receiverId }) => {
            const receiverSockets = userSocketMap[receiverId];

            if (receiverSockets) {
                receiverSockets.forEach((socketId) => {
                    io.to(socketId).emit("user-typing", {
                        userId: socket.user.id
                    });
                });
            }
        });

        socket.on("stop-typing", ({ receiverId }) => {
            const receiverSockets = userSocketMap[receiverId];

            if (receiverSockets) {
                receiverSockets.forEach((socketId) => {
                    io.to(socketId).emit("user-stop-typing", {
                        userId: socket.user.id
                    });
                });
            }
        });

        socket.on("message-delivered", async ({ messageId }) => {
            const message = await Message.findOneAndUpdate(
                {
                    _id: messageId,
                    receiver: socket.user.id,
                    status: "sent"
                },
                { status: "delivered" },
                { returnDocument: "after" }
            )

            if (!message) return;
            const senderSockets = userSocketMap[message.sender.toString()];

            if (senderSockets) {
                senderSockets.forEach((socketId) => {
                    io.to(socketId).emit("message-delivered", {
                        messageId: message._id.toString(),
                        status: message.status
                    })
                })
            }
        })

        socket.on("message-read", async ({ messageId }) => {
            const message = await Message.findOneAndUpdate(
                {
                    _id: messageId,
                    receiver: socket.user.id,
                    status: "delivered"
                },
                { status: "read" },
                { returnDocument: "after" }
            )

            if (!message) return;
            const senderSockets = userSocketMap[message.sender.toString()];
            if (senderSockets) {
                senderSockets.forEach((socketId) => {
                    io.to(socketId).emit("message-read", {
                        messageId: message._id.toString(),
                        status: message.status

                    });
                });
            }
        });

        socket.on("disconnect", () => {
            userSocketMap[userId].delete(socket.id)
            if (userSocketMap[userId].size === 0) {
                delete userSocketMap[userId];

                io.emit("user-offline", {
                    userId
                });
            }

            console.log("Disconnected", userSocketMap);
        });
    });
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO not initialized");
    }

    return io;
};

export { userSocketMap };