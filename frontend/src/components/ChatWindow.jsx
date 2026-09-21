import ChatHeader from "./chat/ChatHeader";
import MessageList from "./chat/MessageList";
import MessageInput from "./chat/MessageInput";

const ChatWindow = ({
    selectedUser,
    userId,
    messages,
    messageInput,
    setMessageInput,
    isTyping,
    onlineUsers,
    messagesContainerRef,
    loadingMessagesRef,
    previousScrollHeightRef,
    hasMoreMessages,
    setMessagePage,
    handleTyping,
    sendMessage,
}) => {
    return (
        <div className="flex flex-col h-full w-full bg-gray-50/50">
            <ChatHeader
                selectedUser={selectedUser}
                onlineUsers={onlineUsers}
            />

            <MessageList
                messages={messages}
                userId={userId}
                messagesContainerRef={messagesContainerRef}
                hasMoreMessages={hasMoreMessages}
                loadingMessagesRef={loadingMessagesRef}
                previousScrollHeightRef={previousScrollHeightRef}
                setMessagePage={setMessagePage}
            />

            <MessageInput
                messageInput={messageInput}
                setMessageInput={setMessageInput}
                handleTyping={handleTyping}
                sendMessage={sendMessage}
                isTyping={isTyping}
                selectedUser={selectedUser}
            />
        </div>
    );
};

export default ChatWindow;