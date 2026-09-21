const ChatHeader = ({selectedUser,onlineUsers}) => {
  const isOnline = onlineUsers.includes(selectedUser._id);
  
  return (
    <div className="h-16 px-6 py-3 border-b border-brand-border/20 bg-white flex items-center justify-between shrink-0 shadow-sm z-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded bg-gray-100 border border-brand-border/30 flex items-center justify-center text-brand-dark font-medium text-lg uppercase">
          {selectedUser.username.charAt(0)}
        </div>
        <div>
          <h2 className="font-semibold text-brand-dark text-base leading-tight">
            {selectedUser.username}
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            <span className="text-xs font-medium text-brand-secondary">
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </div>
      
      {/* Optional: Add action buttons here like info, call, etc. */}
      <div className="flex gap-2">
         <button className="p-2 text-brand-secondary hover:text-brand-dark hover:bg-gray-50 rounded transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
         </button>
      </div>
    </div>
  )
}

export default ChatHeader