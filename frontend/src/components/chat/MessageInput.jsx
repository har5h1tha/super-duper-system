function MessageInput({
    messageInput,
    handleTyping,
    sendMessage,
    isTyping,
    selectedUser
}) {
    return (
        <div>
            <input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={handleTyping}
            />

            <button onClick={sendMessage}>
                Send
            </button>

            {isTyping && (
                <p>
                    {selectedUser.username} is typing...
                </p>
            )}
        </div>
    );
}

export default MessageInput;