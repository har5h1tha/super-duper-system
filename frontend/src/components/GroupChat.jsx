import { useEffect, useState, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL;

const GroupChat = ({ group, getSocket }) => {
    const [groupMessages, setGroupMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [messageInput, setMessageInput] = useState("");
    const [typingUser, setTypingUser] = useState(null);

    const typingTimeoutRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // Auto-scroll on new message
    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [groupMessages]);

    useEffect(() => {

        const socket = getSocket();

        if (!socket) {
            return;
        }

        const groupId = group._id;


        socket.emit("joinGroup", groupId);


        const handleNewGroupMessage = ({
            groupId: incomingGroupId,
            message
        }) => {

            if (incomingGroupId !== group._id) {
                return;
            }

            setGroupMessages(prev => {
                const exists = prev.some(msg => msg._id === message._id);
                if (exists) {
                    return prev;
                }
                return [...prev, message];
            });
        };

        const handleGroupError = ({ message }) => {
            console.error("Group error:", message);
        };

        const handleGroupTyping = (data) => {
            setTypingUser(data.username);
        };

        const handleGroupStopTyping = () => {
            setTypingUser(null);
        };

        socket.on("new-group-message", handleNewGroupMessage);
        socket.on("group-error", handleGroupError);

        socket.on("group-user-typing", handleGroupTyping);
        socket.on("group-user-stop-typing", handleGroupStopTyping);

        const getGroupMessages = async () => {
            const token = localStorage.getItem("token");

            try {
                const response = await fetch(
                    `${API_URL}/api/groups/${groupId}/messages?page=1&limit=20`,
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

                setGroupMessages(
                    [...data.messages].sort(
                        (a, b) =>
                            new Date(a.createdAt) -
                            new Date(b.createdAt)
                    )
                );

            } catch (error) {
                console.error(
                    "Failed to fetch Group messages:",
                    error
                );
            } finally {
                setLoading(false);
            }
        };

        getGroupMessages();


        return () => {
            clearTimeout(typingTimeoutRef.current);

            socket.emit("group-stop-typing", { groupId });

            socket.emit("leaveGroup", { groupId });


            socket.off("new-group-message", handleNewGroupMessage);
            socket.off("group-error", handleGroupError);
            socket.off("group-user-typing", handleGroupTyping);
            socket.off("group-user-stop-typing", handleGroupStopTyping);
        };

    }, [group._id, getSocket]);

    const sendGroupMessage = () => {
        const socket = getSocket();

        if (!socket) return;

        if (!messageInput.trim()) return;

        socket.emit("send-group-message", {
            groupId: group._id,
            content: messageInput.trim()
        });

        setMessageInput("");
        clearTimeout(typingTimeoutRef.current);

        socket.emit("group-stop-typing", {
            groupId: group._id
        });
    };

    const handleGroupTyping = (e) => {
        const value = e.target.value;

        setMessageInput(value);

        const socket = getSocket();

        if (!socket) return;

        if (!value.trim()) {
            clearTimeout(typingTimeoutRef.current);

            socket.emit("group-stop-typing", {
                groupId: group._id
            });

            return;
        }
        socket.emit("group-typing", {
            groupId: group._id
        });

        clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {

            socket.emit("group-stop-typing", {
                groupId: group._id
            });

        }, 1000);
    };

    return (
        <div className="flex flex-col h-full w-full bg-gray-50/50">

            <div className="h-16 px-6 py-3 border-b border-brand-border/20 bg-white flex items-center justify-between shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center text-brand-dark font-bold text-lg uppercase">
                        {group.name.charAt(0)}
                    </div>
                    <div>
                        <h2 className="font-semibold text-brand-dark text-base leading-tight">
                            {group.name}
                        </h2>
                        <div className="text-xs font-medium text-brand-secondary mt-0.5">
                            {group.members?.length || 0} members
                        </div>
                    </div>
                </div>
            </div>

            <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
            >
                {loading && (
                    <div className="text-center py-4 text-sm text-brand-secondary">
                        Loading messages...
                    </div>
                )}
                
                {groupMessages.map((message, index) => {
                    const prevMessage = index > 0 ? groupMessages[index - 1] : null;
                    const prevSenderId = prevMessage ? (prevMessage.sender?._id || prevMessage.sender) : null;
                    const currentSenderId = message.sender?._id || message.sender;
                    const isGroupStart = prevSenderId !== currentSenderId;

                    return (
                        <div key={message._id} className={`flex flex-col items-start ${isGroupStart ? "mt-4" : "mt-1"}`}>
                            <div className="max-w-[70%] group flex flex-col items-start">
                                {isGroupStart && (
                                    <span className="text-[11px] font-semibold text-brand-secondary ml-1 mb-1">
                                        {message.sender?.username || "Unknown User"}
                                    </span>
                                )}
                                <div className="px-4 py-2 text-sm shadow-sm border bg-white border-brand-border/20 text-brand-dark rounded-r-lg rounded-bl-lg">
                                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                </div>
                                <div className="mt-1 flex items-center justify-start text-[10px] text-brand-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span>
                                        {new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>


            <div className="p-4 bg-white border-t border-brand-border/20 shrink-0 shadow-sm relative">
                {typingUser && (
                    <div className="absolute -top-7 left-6 text-xs text-brand-secondary font-medium flex items-center gap-1.5 bg-white/90 px-2 py-1 rounded-t border-t border-x border-brand-border/20">
                        <div className="flex gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-bounce"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-bounce delay-75"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-bounce delay-150"></span>
                        </div>
                        {typingUser} is typing...
                    </div>
                )}
                
                <div className="flex items-end gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Message group..."
                            value={messageInput}
                            onChange={handleGroupTyping}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendGroupMessage();
                                }
                            }}
                            className="w-full bg-gray-50 border border-brand-border/30 text-brand-dark text-sm rounded-md focus:ring-1 focus:ring-brand-primary focus:border-brand-primary block p-3 pr-10 outline-none transition-shadow placeholder-gray-400"
                        />
                    </div>

                    <button 
                        onClick={sendGroupMessage}
                        disabled={!messageInput.trim()}
                        className="p-3 bg-brand-primary text-brand-dark rounded-md hover:bg-brand-hover focus:ring-2 focus:ring-brand-primary focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-brand-hover shadow-sm flex items-center justify-center shrink-0"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default GroupChat