import { Server } from "socket.io";
import Message from "../models/message.model.js";
import socketAuth from "../middleware/socketAuth.middleware.js";
import User from "../models/user.model.js";
import Group from "../models/group.model.js";
import GroupMessage from "../models/groupMessage.model.js";
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
           try{
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
        }catch(error){
               console.error("Message delivery error:", error);

               socket.emit("message-error", {
                   message: "Failed to update message delivery status"
               });
        }
        })

        socket.on("message-read", async ({ messageId }) => {
            try{
            const message = await Message.findOneAndUpdate(
                {
                    _id: messageId,
                    receiver: socket.user.id,
                    status: {$in:["sent","delivered"]}
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
        }catch(error){
            console.error("Message read error:", error);

        socket.emit("message-error", {
            message: "Failed to update message read status"
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


        socket.on("joinGroup", async (groupId) => {
            try {
                const group = await Group.findById(groupId);

                if (!group) {
                    return socket.emit("group-error", {
                        message: "Group not found"
                    });
                }

                const isMember = group.members.some(
                    member => member.toString() === socket.user.id
                );

                if (!isMember) {
                    return socket.emit("group-error", {
                        message: "You are not a member of this group"
                    });
                }

                socket.join(groupId);

                socket.emit("group-joined", {
                    groupId
                });

            } catch (error) {
                console.error("Join group error:", error);

                socket.emit("group-error", {
                    message: "Failed to join group"
                });
            }
        });

        socket.on("send-group-message", async ({ groupId, content }) => {
            try {
                const senderId = socket.user.id;

                if (!groupId) {
                    return socket.emit("group-message-error", {
                        message: "Group ID is required"
                    });
                }

                if (!content || !content.trim()) {
                    return socket.emit("group-message-error", {
                        message: "Message content is required"
                    });
                }

                const group = await Group.findById(groupId);

                if (!group) {
                    return socket.emit("group-message-error", {
                        message: "Group not found"
                    });
                }

                const isMember = group.members.some(
                    member => member.toString() === senderId
                );

                if (!isMember) {
                    return socket.emit("group-message-error", {
                        message: "You are not a member of this group"
                    });
                }

                const groupMessage = await GroupMessage.create({
                    sender: senderId,
                    group: groupId,
                    content: content.trim()
                });

                const populatedMessage = await groupMessage.populate(
                    "sender",
                    "username"
                );

                io.to(groupId).emit("new-group-message", {
                    groupId,
                    message: populatedMessage
                });

            } catch (error) {
                console.error("Group message error:", error);

                socket.emit("group-message-error", {
                    message: "Failed to send group message"
                });
            }
        });

        socket.on("group-typing", async ({ groupId }) => {

            try {
                const group = await Group.findById(groupId);
                if (!group) {
                    return socket.emit("group-message-error", {
                        message: "Group not found"
                    });
                }

                const isMember = group.members.some((member) => member.toString() === socket.user.id);
                if (!isMember) {
                    return socket.emit("group-message-error", {
                        message: "user not in group"
                    });
                }

                const user = await User.findById(
                    socket.user.id
                ).select("username");

                console.log("EMITTING GROUP USER TYPING:", user.username);
                socket.to(groupId).emit("group-user-typing", {
                    userId: socket.user.id,
                    username: user.username
                })
            } catch (error) {
                console.log("Group typing error:", error)
            }

        })

        socket.on("group-stop-typing", async ({ groupId }) => {
         try{
            const group = await Group.findById(groupId);
            if (!group) {
                return socket.emit("group-message-error", {
                    message: "Group not found"
                });
            }

            const isMember = group.members.some((member) => member.toString() === socket.user.id);
            if (!isMember) {
                return socket.emit("group-message-error", {
                    message: "user not in group"
                });
            }

            socket.to(groupId).emit("group-user-stop-typing", {
                userId: socket.user.id
            })
        }catch(error){
             console.error("Group stop typing error:", error);

             socket.emit("group-message-error", {
                 message: "Failed to stop group typing"
             });
        }
        })

        socket.on("leaveGroup",  ({ groupId }) => {
            socket.leave(groupId)

            console.log(
                `Socket ${socket.id} left group ${groupId}`
            )
            socket.emit("group-left", {
                groupId
            });
        })
    });
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO not initialized");
    }

    return io;
};

export { userSocketMap };