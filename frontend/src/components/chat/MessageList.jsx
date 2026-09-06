function MessageList({
    messages,
    userId,
    messagesContainerRef,
    hasMoreMessages,
    loadingMessagesRef,
    previousScrollHeightRef,
    setMessagePage
}) {
    return (
        <div
            ref={messagesContainerRef}
            className="h-100 overflow-y-auto"
            onScroll={(e) => {
                if (
                    e.currentTarget.scrollTop === 0 &&
                    hasMoreMessages &&
                    !loadingMessagesRef.current
                ) {
                    previousScrollHeightRef.current =
                        e.currentTarget.scrollHeight;

                    setMessagePage((prev) => prev + 1);
                }
            }}
        >
            {messages.map((message) => {
                const senderId =
                    message.sender?._id?.toString() ||
                    message.sender?.toString();

                const isMine =
                    senderId === userId?.toString();

                return (
                    <div key={message._id}>
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
                );
            })}
        </div>
    );
}

export default MessageList;