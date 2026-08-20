import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client"
import GroupList from "../components/GroupList";
import GroupChat from "../components/GroupChat";
import CreateGroup from "../components/CreateGroup";

function Chat({ onLogout }) {
    const [userId, setUserId] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupRefresh, setGroupRefresh] = useState(0);

    const socketRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const selectedUserRef = useRef(null);

    //getUsers
    useEffect(() => {
        const getProfile = async () => {
            const token = localStorage.getItem("token");

            const response = await fetch(
                "http://localhost:3000/api/auth/profile",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error(data);
                return;
            }

            setUserId(data.userId);
        };

        const getUsers = async () => {
            const token = localStorage.getItem("token");

            const response = await fetch(
                "http://localhost:3000/api/users",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error(data);
                return;
            }

            console.log("USERS:", data);
            setUsers(data);
        };

        getProfile();
        getUsers();
    }, []);

    //get MESSAGES
    useEffect(() => {
        if (!selectedUser) return;

        const getMessages = async () => {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `http://localhost:3000/api/messages/${selectedUser._id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error(data);
                return;
            }

            setMessages(data);

            const socket = socketRef.current;
            if (socket) {
                data.forEach((message) => {
                    if (message.receiver.toString() === userId &&
                        message.status === "delivered") {
                        socket.emit("message-read", {
                            messageId: message._id
                        })
                    }
                })
            }
        };

        getMessages();
    }, [selectedUser, userId]);

    //SOCKET connection
    useEffect(() => {
        const token = localStorage.getItem("token");

        const socket = io("http://localhost:3000", {
            auth: {
                token
            }
        });
        socketRef.current = socket;

        const handleReceiveMessage = (message) => {
            const selectedId = selectedUserRef.current?._id?.toString();

            const senderId = message.sender?.toString();
            const receiverId = message.receiver?.toString();

            const isCurrentChat =
                (senderId === userId && receiverId === selectedId) ||
                (senderId === selectedId && receiverId === userId);

            if (!isCurrentChat) {
                return;
            }

            setMessages((prevMessages) => {
                if (prevMessages.some((msg) => msg._id === message._id)) {
                    return prevMessages;
                }

                return [...prevMessages, message];
            });

            if (receiverId === userId) {
                if (selectedId === senderId) {
                    socket.emit("message-read", {
                        messageId: message._id
                    });
                } else {
                    socket.emit("message-delivered", {
                        messageId: message._id
                    });
                }
            }
        };
        socket.on("receive-message", handleReceiveMessage);

        const handleMessageDelivered = ({ messageId, status }) => {
            setMessages((prevMessages) =>
                prevMessages.map((message) =>
                    message._id === messageId
                        ? { ...message, status }
                        : message
                )
            );
        };
        socket.on("message-delivered", handleMessageDelivered);

        const handleMessageRead = ({ messageId, status }) => {
            setMessages((prevMessages) =>
                prevMessages.map((message) =>
                    message._id === messageId
                        ? { ...message, status }
                        : message
                )
            );
        };
        socket.on("message-read", handleMessageRead);

        const handleOnlineUsers = (users) => {
            setOnlineUsers(users);
        }
        socket.on("online-users", handleOnlineUsers)


        const handleUserOnline = (data) => {
            setOnlineUsers((prev) => {
                if (prev.includes(data.userId)) {
                    return prev;
                }
                return [...prev, data.userId]
            })
        }
        socket.on("user-online", handleUserOnline)


        const handleUserOffline = (data) => {
            setOnlineUsers((prev) =>
                prev.filter((id) => id !== data.userId)
            )
        }
        socket.on("user-offline", handleUserOffline)


        return () => {
            clearTimeout(typingTimeoutRef.current);
            socket.off("receive-message", handleReceiveMessage);
            socket.off("message-delivered", handleMessageDelivered);
            socket.off("message-read", handleMessageRead);
            socket.off("online-users", handleOnlineUsers);
            socket.off("user-online", handleUserOnline);
            socket.off("user-offline", handleUserOffline);


            socket.disconnect();
            socketRef.current = null;
        };
    }, [userId]);

    useEffect(() => {
        const socket = socketRef.current;

        if (!socket) return;

        const handleUserTyping = (data) => {
            if (data.userId === selectedUser?._id) {
                setIsTyping(true);
            }
        };

        const handleUserStopTyping = (data) => {
            if (data.userId === selectedUser?._id) {
                setIsTyping(false);
            }
        };

        socket.on("user-typing", handleUserTyping);
        socket.on("user-stop-typing", handleUserStopTyping);

        return () => {
            socket.off("user-typing", handleUserTyping);
            socket.off("user-stop-typing", handleUserStopTyping);
        };
    }, [selectedUser]);


    const sendMessage = async () => {
        if (!messageInput.trim() || !selectedUser) {
            return;
        }

        const token = localStorage.getItem("token");

        const response = await fetch(
            "http://localhost:3000/api/messages/send",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    receiver: selectedUser._id,
                    content: messageInput.trim()
                })
            }
        )

        const data = await response.json();

        if (!response.ok) {
            console.error(data);
            return;
        }

        setMessageInput("");
    }

    const handleTyping = (e) => {
        const value = e.target.value;

        setMessageInput(value);

        console.log("TYPING INPUT");

        if (!selectedUser || !socketRef.current) {
            console.log("NO USER OR SOCKET");
            return;
        }

        console.log("EMITTING TYPING TO:", selectedUser._id);

        socketRef.current.emit("typing", {
            receiverId: selectedUser._id
        });

        clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            console.log("EMITTING STOP TYPING");

            socketRef.current.emit("stop-typing", {
                receiverId: selectedUser._id
            });
        }, 1000);
    };

    return (
        <div>
            <h1>CollabHub Chat</h1>

            {userId && (
                <p>
                    Logged in as: {userId}
                </p>
            )}
            <h2>Users</h2>

            <div>
                {users.map((user) => {
                    const isOnline = onlineUsers.includes(user._id);
                    return (
                        <div key={user._id}
                            onClick={() => {
                                clearTimeout(typingTimeoutRef.current);

                                setSelectedUser(user)
                                selectedUserRef.current = user
                                setIsTyping(false)
                            }}
                        >

                            {user.username}
                            <span>{isOnline ? "🟢 Online" : "⚫ Offline"}</span>

                        </div>
                    )

                })}
            </div>


            <CreateGroup
                onGroupCreated={() => {
                    setGroupRefresh(prev => prev + 1);
                }}
            />

            <GroupList
                refresh={groupRefresh}
                onSelectGroup={(group) => {
                    setSelectedGroup(group);
                    setSelectedUser(null);
                }}
            />

            {selectedUser && (
                <div>
                    <h2>Chat with {selectedUser.username}</h2>
                    <p>
                        {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
                    </p>

                    {messages.map((message) => (
                        <div key={message._id}>
                            {message.sender === userId ? "You" : "Them"}: {message.content}

                            {message.sender === userId && (
                                <span>
                                    {" "}
                                    {message.status === "sent" && "✓"}
                                    {message.status === "delivered" && "✓✓"}
                                    {message.status === "read" && "✓✓"}
                                </span>
                            )}
                        </div>
                    ))}

                    <div>
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={messageInput}
                            onChange={handleTyping} />

                        <button onClick={sendMessage}>
                            Send
                        </button>
                        {isTyping && (
                            <p>
                                {selectedUser.username} is typing...
                            </p>
                        )}
                    </div>
                </div>
            )}

            {selectedGroup && (
                <GroupChat
                    group={selectedGroup}
                    getSocket={() => socketRef.current} />
            )}

            <button onClick={onLogout}>
                Logout
            </button>
        </div>
    );
}

export default Chat;