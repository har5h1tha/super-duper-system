import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client"
import ChatSidebar from "../components/chat/ChatSidebar";
import GroupList from "../components/GroupList";
import GroupChat from "../components/GroupChat";
import GroupDetails from "../components/GroupDetails";
import CreateGroup from "../components/CreateGroup";
import AddGroupMember from "../components/AddGroupMember";
import ChatWindow from "../components/ChatWindow";

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
    const [showNewChat, setShowNewChat] = useState(false);

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

    if (previousScrollHeightRef.current !== null) {
        const newScrollHeight = container.scrollHeight;

        const heightDifference =
            newScrollHeight - previousScrollHeightRef.current;

        container.scrollTop = heightDifference;

        previousScrollHeightRef.current = null;
        return;
    }

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
    const handleSelectUser = (user) => {
        clearTimeout(typingTimeoutRef.current);

        setSelectedUser(user);
        selectedUserRef.current = user;
        setIsTyping(false);

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
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden text-brand-dark">
            {/* Sidebar Pane */}
            <div className="w-80 flex-shrink-0 border-r border-brand-border/20 bg-white flex flex-col z-20 shadow-sm relative">
                <div className="flex-1 overflow-hidden flex flex-col">
                    <ChatSidebar
                        users={users}
                        conversations={conversations}
                        onlineUsers={onlineUsers}
                        selectedUser={selectedUser}
                        onSelectUser={handleSelectUser}
                        onNewChat={() => setShowNewChat(true)}
                        onCloseNewChat={() => setShowNewChat(false)}
                        showNewChat={showNewChat}
                    />
                </div>
                
                <div className="border-t border-brand-border/20 bg-gray-50 flex flex-col max-h-64 overflow-y-auto">
                    <div className="p-4 border-b border-brand-border/10">
                        <CreateGroup
                            onGroupCreated={() => {
                                setGroupRefresh(prev => prev + 1);
                            }}
                        />
                    </div>
                    <GroupList
                        refresh={groupRefresh}
                        onSelectGroup={handleSelectGroup}
                    />
                </div>
            </div>

            {/* Main Content Pane */}
            <div className="flex-1 flex flex-col bg-gray-50/50 relative min-w-0">
                {/* Global Header */}
                <div className="h-14 border-b border-brand-border/20 bg-white flex items-center justify-between px-6 z-10 flex-shrink-0">
                    <h1 className="text-lg font-bold text-brand-dark flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-brand-primary"></div>
                        CollabHub
                    </h1>
                    <div className="flex items-center gap-4">
                        {userId && (
                            <span className="text-sm text-brand-secondary font-medium">
                                ID: {userId.substring(0, 8)}...
                            </span>
                        )}
                        <button 
                            onClick={onLogout}
                            className="text-sm font-medium text-brand-dark hover:text-brand-primary transition-colors border border-brand-border/30 px-3 py-1.5 rounded bg-white hover:bg-gray-50"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Group Details Overlay */}
                {selectedGroup && (
                    <div className="absolute top-14 right-0 w-80 bottom-0 bg-white border-l border-brand-border/20 shadow-lg z-20 flex flex-col transform transition-transform">
                        <GroupDetails
                            group={selectedGroup}
                            userId={userId}
                            onGroupUpdated={(updatedGroup) => {
                                setSelectedGroup(updatedGroup);
                            }}
                            onLeaveGroup={handleLeaveGroup}
                        />
                        <div className="border-t border-brand-border/20 flex-1 overflow-y-auto">
                            <AddGroupMember
                                group={selectedGroup}
                                users={users}
                                onMemberAdded={(updatedGroup) => {
                                    setSelectedGroup(updatedGroup);
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Active Chat Area */}
                <div className="flex-1 overflow-hidden relative flex flex-col">
                    {!selectedUser && !selectedGroup && (
                        <div className="flex-1 flex flex-col items-center justify-center text-brand-secondary">
                            <div className="w-16 h-16 mb-4 rounded-xl bg-gray-100 border border-brand-border/20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </div>
                            <h2 className="text-xl font-medium text-brand-dark mb-1">Welcome to CollabHub</h2>
                            <p className="text-sm">Select a contact to start messaging</p>
                        </div>
                    )}

                    {selectedUser && (
                        <ChatWindow
                            selectedUser={selectedUser}
                            userId={userId}
                            messages={messages}
                            messageInput={messageInput}
                            setMessageInput={setMessageInput}
                            isTyping={isTyping}
                            onlineUsers={onlineUsers}
                            messagesContainerRef={messagesContainerRef}
                            loadingMessagesRef={loadingMessagesRef}
                            previousScrollHeightRef={previousScrollHeightRef}
                            hasMoreMessages={hasMoreMessages}
                            setMessagePage={setMessagePage}
                            handleTyping={handleTyping}
                            sendMessage={sendMessage}
                        />
                    )}

                    {selectedGroup && (
                        <GroupChat
                            group={selectedGroup}
                            getSocket={() => socketRef.current} />
                    )}
                </div>
            </div>
        </div>
    );
}

export default Chat;