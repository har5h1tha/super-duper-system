function MessageInput({
    messageInput,
    handleTyping,
    sendMessage,
    isTyping,
    selectedUser
}) {
    return (
        <div className="p-4 bg-white border-t border-brand-border/20 shrink-0 shadow-sm relative">
            {/* Typing indicator */}
            {isTyping && (
                <div className="absolute -top-7 left-6 text-xs text-brand-secondary font-medium flex items-center gap-1.5 bg-white/90 px-2 py-1 rounded-t border-t border-x border-brand-border/20">
                    <div className="flex gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-bounce"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-bounce delay-75"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-bounce delay-150"></span>
                    </div>
                    {selectedUser.username} is typing...
                </div>
            )}
            
            <div className="flex items-end gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={messageInput}
                        onChange={handleTyping}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                        className="w-full bg-gray-50 border border-brand-border/30 text-brand-dark text-sm rounded-md focus:ring-1 focus:ring-brand-primary focus:border-brand-primary block p-3 pr-10 outline-none transition-shadow placeholder-gray-400"
                    />
                </div>

                <button 
                    onClick={sendMessage}
                    disabled={!messageInput.trim()}
                    className="p-3 bg-brand-primary text-brand-dark rounded-md hover:bg-brand-hover focus:ring-2 focus:ring-brand-primary focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-brand-hover shadow-sm flex items-center justify-center shrink-0"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

export default MessageInput;