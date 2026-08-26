import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client"
import GroupList from "../components/GroupList";
import GroupChat from "../components/GroupChat";
import GroupDetails from "../components/GroupDetails";
import CreateGroup from "../components/CreateGroup";
import AddGroupMember from "../components/AddGroupMember";

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
    const [conversations, setConversations] = useState([]);

    const [messagePage, setMessagePage] = useState(1);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    
    const socketRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const selectedUserRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const loadingMessagesRef = useRef(false);
    const previousScrollHeightRef = useRef(null);

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

            setUsers(data);
        };

        getProfile();
        getUsers();
    }, []);

    //get MESSAGES
    useEffect(() => {
        if (!selectedUser) return;

        const getMessages = async () => {
            if (loadingMessagesRef.current) return;

            loadingMessagesRef.current = true;
        try{
            const token = localStorage.getItem("token");

            const response = await fetch(
                `http://localhost:3000/api/messages/${selectedUser._id}?page=${messagePage}&limit=30`,
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
           

            if(messagePage === 1){
                setMessages(data.messages)
            }else{
                setMessages(prev => {
                    const existingIds = new Set(prev.map(message => message._id));

                    const newMessages = data.messages.filter(
                        message => !existingIds.has(message._id)
                    );

                    const result = [...newMessages, ...prev];

                    return result;
                });
            }
            setHasMoreMessages(data.hasMore);

            const socket = socketRef.current;
            if (socket) {
                data.messages.forEach((message) => {
                    if (message.receiver.toString() === userId &&
                        message.status === "delivered") {
                        socket.emit("message-read", {
                            messageId: message._id
                        })
                    }
                })
            }
        }finally{
                loadingMessagesRef.current = false;
        }
};

        getMessages();
    }, [selectedUser, userId,messagePage]);

    //SOCKET connection
    useEffect(() => {
        const token = localStorage.getItem("token");

        const socket = io("http://localhost:3000", {
            auth: {
                token
            }
        });
        socketRef.current = socket;

        const updateConversation = (message) => {
            const myId = userId?.toString();
            const senderId = message.sender?._id?.toString() || message.sender?.toString();
            const receiverId = message.receiver?._id?.toString() || message.receiver?.toString();
            const selectedId = selectedUserRef.current?._id?.toString();

            const otherUser =
                senderId === myId
                    ? message.receiver
                    : message.sender;

            if (!otherUser) {
                console.error(
                    "Could not determine other user:",
                    message
                );
                return;
            }
            const otherUserId =
                otherUser._id?.toString() ||
                otherUser.toString();

            setConversations((prevConversations) => {

                const existingConversation = prevConversations.find(
                    (conversation) =>
                        conversation.user._id.toString() === otherUserId
                );

                if (existingConversation) {

                    const isCurrentChat =
                        (senderId === myId && receiverId === selectedId) ||
                        (senderId === selectedId && receiverId === myId);

                    let unreadCount = existingConversation.unreadCount || 0;
                    if (senderId !== myId && !isCurrentChat) {
                        unreadCount++;
                    }

                    if (isCurrentChat) {
                        unreadCount = 0;
                    }

                    const updatedConversation = {
                        ...existingConversation,
                        lastMessage: message,
                        unreadCount
                    };

                    const remainingConversations = prevConversations.filter(
                        (conversation) =>
                            conversation.user._id.toString() !== otherUserId
                    );

                    return [
                        updatedConversation,
                        ...remainingConversations
                    ];
                }

                return [
                    {
                        user: otherUser,
                        lastMessage: message,
                        unreadCount: senderId !== myId ? 1 : 0
                    },
                    ...prevConversations
                ];
            });
        };

        const handleReceiveMessage = (message) => {
            const selectedId = selectedUserRef.current?._id?.toString();
            const myId = userId?.toString();

            const senderId = message.sender?._id?.toString() || message.sender?.toString();
            const receiverId = message.receiver?._id?.toString() || message.receiver?.toString();

            const isCurrentChat =
                (senderId === myId && receiverId === selectedId) ||
                (senderId === selectedId && receiverId === myId);

            updateConversation(message);

            if (!isCurrentChat) {
                return;
            }

            setMessages((prevMessages) => {
                if (prevMessages.some((msg) => msg._id === message._id)) {
                    return prevMessages;
                }

                return [...prevMessages, message];
            });

            if (receiverId === myId) {
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

        const handleMessagesRead = ({ messageIds }) => {

            setMessages((prevMessages) =>
                prevMessages.map((message) =>
                    messageIds.includes(message._id)
                        ? { ...message, status: "read" }
                        : message
                )
            );
        };

        socket.on("messages-read", handleMessagesRead);

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
            socket.off("messages-read", handleMessagesRead);


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

    //get conversations
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await fetch("http://localhost:3000/api/messages/conversations",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                )
                const data = await response.json();
                if (!response.ok) {
                    console.error(data);
                    return
                }
                setConversations(data.conversations);

            } catch (error) {
                console.log("Failed to fetch conversations", error)
            }
        }

        fetchConversations()
    }, [])

useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Loading older messages
    if (previousScrollHeightRef.current !== null) {
        const newScrollHeight = container.scrollHeight;

        const heightDifference =
            newScrollHeight - previousScrollHeightRef.current;

        container.scrollTop = heightDifference;

        previousScrollHeightRef.current = null;
        return;
    }

    // Initial load / new message
    container.scrollTop = container.scrollHeight;

}, [messages]);


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

        if (!selectedUser || !socketRef.current) {
            return;
        }

        socketRef.current.emit("typing", {
            receiverId: selectedUser._id
        });

        clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {

            socketRef.current.emit("stop-typing", {
                receiverId: selectedUser._id
            });
        }, 1000);
    };

    const handleLeaveGroup = async () => {
        if (!selectedGroup) return;

        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `http://localhost:3000/api/groups/${selectedGroup._id}/leave`,
                {
                    method: "DELETE",
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
            
            setSelectedGroup(null);

            setGroupRefresh(prev => prev + 1);

        } catch (error) {
            console.error("Failed to leave group:", error);
        }
    };
    const handleSelectGroup = async (group) => {
    try {
        const token = localStorage.getItem("token");

        const response = await fetch(
            `http://localhost:3000/api/groups/${group._id}`,
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

        setSelectedGroup(data.group);
        setSelectedUser(null);

    } catch (error) {
        console.error("Failed to load group details:", error);
    }
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

            <h2>Your Contacts</h2>
            <div>
                {conversations.map((conversation) => {
                    const user = conversation.user;
                    const isOnline = onlineUsers.includes(user._id);
                    return (
                        <div key={user._id}
                            onClick={() => {
                                clearTimeout(typingTimeoutRef.current);

                                setSelectedUser(user)
                                selectedUserRef.current = user;
                                setIsTyping(false)
                                
                                setMessagePage(1);
                                setHasMoreMessages(true);
                                setMessages([]);

                                setConversations((prev) =>
                                    prev.map((conversation) =>
                                        conversation.user._id === user._id
                                            ? {
                                                ...conversation,
                                                unreadCount: 0
                                            }
                                            : conversation
                                    )
                                );
                            }}
                        >

                            <div>
                                {user.username}
                                {conversation.unreadCount > 0 && (
                                    <span>
                                        {conversation.unreadCount}
                                    </span>
                                )}
                            </div>

                            <div>
                                {conversation.lastMessage?.content || "NO messages yet"}
                            </div>
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
                onSelectGroup={handleSelectGroup}
            />
        {selectedGroup &&(
            <GroupDetails
                group={selectedGroup}
                userId={userId}
                onGroupUpdated={(updatedGroup) => {
                    setSelectedGroup(updatedGroup);
                }}
                onLeaveGroup={handleLeaveGroup}
            />
        )}
            {selectedGroup && (
                <AddGroupMember
                    group={selectedGroup}
                    users={users}
                    onMemberAdded={(updatedGroup) => {
                        setSelectedGroup(updatedGroup);
                    }}
                />
            )}

            {selectedUser && (
                <div>
                    <h2>Chat with {selectedUser.username}</h2>
                    <p>
                        {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
                    </p>

                    <div
                        ref={messagesContainerRef}
                        style={{
                            height: "400px",
                            overflowY: "auto"
                        }}
                        onScroll={(e) => {
                            if (
                                e.currentTarget.scrollTop === 0 &&
                                hasMoreMessages &&
                                !loadingMessagesRef.current
                            ) {
                                previousScrollHeightRef.current =
                                    e.currentTarget.scrollHeight;

                                setMessagePage(prev => prev + 1);
                            }
                        }}
                    >
                    {messages.map((message) => {
                        const senderId = message.sender?._id?.toString() || message.sender?.toString();

                        const isMine = senderId === userId?.toString();

                        return (<div key={message._id}>
                            {isMine ? "You" : "Them"}: {message.content}

                            {isMine && (
                                <span>
                                    {" "}
                                    {message.status === "sent" && "✓"}
                                    {message.status === "delivered" && "✓✓"}
                                    {message.status === "read" && "✓✓BLUE"}
                                </span>
                            )}
                        </div>
                        )
                    })}
                    </div>
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