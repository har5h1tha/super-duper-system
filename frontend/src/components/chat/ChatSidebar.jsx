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
    <div className="relative w-80 h-screen border-r bg-white flex flex-col">

          <div className="px-4 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                  Chats
              </h2>

              <button
                  onClick={() => {
                      setSearchTerm("");
                      onNewChat();
                  }}
                  className="text-sm text-blue-500 hover:text-blue-600"
              >
                  New Chat
              </button>
          </div>

          {showNewChat && (
              <div className="absolute inset-0 bg-white z-10">
                  <div className="px-4 py-4 border-b flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">
                          New Chat
                      </h2>

                      <button
                          onClick={() => {
                              setSearchTerm("");
                              onCloseNewChat();
                          }}
                          className="text-sm text-gray-500 hover:text-gray-700"
                      >
                          Cancel
                      </button>
                  </div>

                  <div className="p-3">
                      <input
                          type="text"
                          placeholder="Search users..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      <div className="mt-2">
                          {filteredUsers.map((user) => (
                              <div
                                  key={user._id}
                                  onClick={() => {
                                      onSelectUser(user);
                                      onCloseNewChat();
                                  }}
                                  className="px-4 py-3 cursor-pointer hover:bg-gray-100"
                              >
                                  <span className="font-medium text-gray-900">
                                      {user.username}
                                  </span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          <h2 className="px-4 pt-4 pb-2 text-sm font-semibold text-gray-500 uppercase">
              Your Contacts
          </h2>
            <div className="flex-1 overflow-y-auto">
                {conversations.map((conversation) => {
                    const user = conversation.user;
                    const isOnline = onlineUsers.includes(user._id);
                    return (
                        <div key={user._id}
                            onClick={() => {onSelectUser(user)}}
                            className={`px-4 py-3 cursor-pointer hover:bg-gray-100 ${selectedUser?._id === user._id ? "bg-gray-100" : ""}`}
                        >

                            <div className="flex items-center justify-between">
                                <span className="font-medium text-blue-900">
                                    {user.username}
                                </span>
                               
                                {conversation.unreadCount > 0 && (
                                    <span className="min-w-5 h-5 px-1 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                                        {conversation.unreadCount}
                                    </span>
                                )}
                            </div>

                            <div className="mt-1 text-sm text-grey-500 truncate">
                                {conversation.lastMessage?.content || "NO messages yet"}
                            </div>
                            <span className="mt-1 text-xs text-gray-400">
                                {isOnline ? "🟢 Online" : "⚫ Offline"}
                            </span>

                        </div>
                    )

                })}
            </div>
    </div>
  )
}

export default ChatSidebar