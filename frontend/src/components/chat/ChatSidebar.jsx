import { useState } from "react";

const ChatSidebar = ({
    users,
    conversations,
    onlineUsers,
    selectedUser,
    onSelectUser,
    onNewChat,
    onCloseNewChat,
    showNewChat,
 }) => {
    
    const [searchTerm, setSearchTerm] = useState("");
    const filteredUsers = users.filter((user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
  return (
    <div className="relative w-full h-full flex flex-col">

          <div className="px-4 py-4 border-b border-brand-border/20 flex items-center justify-between bg-white shrink-0">
              <h2 className="text-sm font-semibold text-brand-dark uppercase tracking-wider">
                  Chats
              </h2>

              <button
                  onClick={() => {
                      setSearchTerm("");
                      onNewChat();
                  }}
                  className="text-sm font-medium text-brand-primary hover:text-brand-hover transition-colors"
              >
                  + New Chat
              </button>
          </div>

          {showNewChat && (
              <div className="absolute inset-0 bg-white z-10 flex flex-col border-r border-brand-border/20">
                  <div className="px-4 py-4 border-b border-brand-border/20 flex items-center justify-between shrink-0">
                      <h2 className="text-sm font-semibold text-brand-dark uppercase tracking-wider">
                          New Chat
                      </h2>

                      <button
                          onClick={() => {
                              setSearchTerm("");
                              onCloseNewChat();
                          }}
                          className="text-sm text-brand-secondary hover:text-brand-dark transition-colors"
                      >
                          Cancel
                      </button>
                  </div>

                  <div className="p-3 flex-1 flex flex-col overflow-hidden">
                      <input
                          type="text"
                          placeholder="Search users..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-3 py-2 border border-brand-border/40 rounded bg-gray-50 text-brand-dark text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary mb-2 shrink-0"
                      />

                      <div className="flex-1 overflow-y-auto min-h-0">
                          {filteredUsers.map((user) => (
                              <div
                                  key={user._id}
                                  onClick={() => {
                                      onSelectUser(user);
                                      onCloseNewChat();
                                  }}
                                  className="px-3 py-2.5 cursor-pointer hover:bg-gray-50 border-b border-brand-border/10 last:border-0 rounded-sm"
                              >
                                  <span className="font-medium text-brand-dark">
                                      {user.username}
                                  </span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

            <div className="flex-1 overflow-y-auto min-h-0 py-2 bg-white">
                {conversations.map((conversation) => {
                    const user = conversation.user;
                    const isOnline = onlineUsers.includes(user._id);
                    return (
                        <div key={user._id}
                            onClick={() => {onSelectUser(user)}}
                            className={`px-4 py-3 mx-2 my-1 cursor-pointer rounded border transition-colors ${
                                selectedUser?._id === user._id 
                                ? "bg-brand-primary/10 border-brand-primary/30" 
                                : "bg-white border-transparent hover:bg-gray-50 hover:border-brand-border/20"
                            }`}
                        >

                            <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-brand-dark">
                                    {user.username}
                                </span>
                               
                                {conversation.unreadCount > 0 && (
                                    <span className="min-w-5 h-5 px-1.5 rounded bg-brand-primary text-brand-dark font-medium text-xs flex items-center justify-center shadow-sm">
                                        {conversation.unreadCount}
                                    </span>
                                )}
                            </div>

                            <div className="text-sm text-brand-secondary truncate">
                                {conversation.lastMessage?.content || "No messages yet"}
                            </div>
                            <div className="mt-1.5 flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                <span className="text-xs font-medium text-brand-secondary">
                                    {isOnline ? "Online" : "Offline"}
                                </span>
                            </div>

                        </div>
                    )

                })}
            </div>
    </div>
  )
}

export default ChatSidebar