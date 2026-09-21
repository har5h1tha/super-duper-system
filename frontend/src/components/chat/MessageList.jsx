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
            className="flex-1 overflow-y-auto p-4 space-y-4"
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
            {/* Infinite loading spinner can go here */}
            {loadingMessagesRef.current && (
                <div className="text-center py-2">
                    <span className="text-xs text-brand-secondary">Loading older messages...</span>
                </div>
            )}
            
            {messages.map((message, index) => {
                const senderId =
                    message.sender?._id?.toString() ||
                    message.sender?.toString();

                const isMine =
                    senderId === userId?.toString();

                // Simple check for continuous messages to group them
                const prevMessage = index > 0 ? messages[index - 1] : null;
                const prevSenderId = prevMessage ? (prevMessage.sender?._id?.toString() || prevMessage.sender?.toString()) : null;
                const isGroupStart = prevSenderId !== senderId;

                return (
                    <div 
                        key={message._id} 
                        className={`flex flex-col ${isMine ? "items-end" : "items-start"} ${isGroupStart ? "mt-4" : "mt-1"}`}
                    >
                        <div className={`max-w-[70%] group flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                            <div 
                                className={`px-4 py-2 text-sm shadow-sm border ${
                                    isMine 
                                    ? "bg-brand-primary border-brand-hover text-brand-dark rounded-l-lg rounded-tr-lg" 
                                    : "bg-white border-brand-border/20 text-brand-dark rounded-r-lg rounded-tl-lg"
                                }`}
                            >
                                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                            </div>
                            
                            {/* Message Status - Show on hover or if last message */}
                            {isMine && (
                                <div className="mt-1 flex items-center justify-end text-[10px] text-brand-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="mr-1">
                                        {new Date(message.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                    <span>
                                        {message.status === "sent" && (
                                            <svg className="w-3.5 h-3.5 text-brand-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        )}
                                        {message.status === "delivered" && (
                                            <div className="flex -space-x-1">
                                                <svg className="w-3.5 h-3.5 text-brand-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                <svg className="w-3.5 h-3.5 text-brand-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                        )}
                                        {message.status === "read" && (
                                            <div className="flex -space-x-1">
                                                <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                        )}
                                    </span>
                                </div>
                            )}
                            
                            {!isMine && (
                                <div className="mt-1 flex items-center justify-start text-[10px] text-brand-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span>
                                        {new Date(message.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default MessageList;