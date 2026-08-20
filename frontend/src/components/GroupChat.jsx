import { useEffect, useState, useRef } from "react";

const GroupChat = ({ group, getSocket }) => {
    const [groupMessages, setGroupMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [messageInput, setMessageInput] = useState("");
    const [typingUser, setTypingUser] = useState(null);

    const typingTimeoutRef = useRef(null);


    useEffect(() => {

        const socket = getSocket();

        if (!socket) {
            console.log("Socket not connected");
            return;
        }

        const groupId = group._id;

        console.log("Joining Group:", groupId);

        socket.emit("joinGroup", groupId);

        const handleGroupJoined = ({ groupId }) => {
            console.log("Group joined:", groupId);
        };

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
            console.log("RECEIVED GROUP TYPING:", data);
            setTypingUser(data.username);
        };

        const handleGroupStopTyping = () => {
            setTypingUser(null);
        };

        socket.on("group-joined", handleGroupJoined);
        socket.on("new-group-message", handleNewGroupMessage);
        socket.on("group-error", handleGroupError);

        socket.on("group-user-typing", handleGroupTyping);
        socket.on("group-user-stop-typing", handleGroupStopTyping);

        const getGroupMessages = async () => {
            const token = localStorage.getItem("token");

            try {
                const response = await fetch(
                    `http://localhost:3000/api/groups/${groupId}/messages?page=1&limit=20`,
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

            socket.off("group-joined", handleGroupJoined);
            socket.off("new-group-message", handleNewGroupMessage);
            socket.off("group-error", handleGroupError);
            socket.off("group-user-typing", handleGroupTyping);
            socket.off("group-user-stop-typing", handleGroupStopTyping);
        };

    }, [group._id, getSocket]);

    if (loading) {
        return <p>Loading groups...</p>;
    }

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
        console.log("EMITTING GROUP TYPING:", group._id);
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
        <div>

            {groupMessages.map((message) =>
                <div key={message._id}>
                    {message.sender.username}:{message.content}
                </div>
            )}

            <input
                placeholder="Type a message..."
                value={messageInput}
                onChange={handleGroupTyping}
            />

            <button onClick={sendGroupMessage}>
                Send
            </button>
            {typingUser && (
                <p>
                    {typingUser} is typing...
                </p>
            )}

        </div>
    )
}

export default GroupChat