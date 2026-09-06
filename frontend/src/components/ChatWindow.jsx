import ChatHeader from "./chat/ChatHeader";
import MessageList from "./chat/MessageList";
import MessageInput from "./chat/MessageInput";

const ChatWindow = ({
    selectedUser,
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
        <div>
            <ChatHeader
                selectedUser={selectedUser}
                onlineUsers={onlineUsers}
            />

            <MessageList
                messages={messages}
                userId={selectedUser._id}
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