
const ChatHeader = ({selectedUser,onlineUsers}) => {
  return (
    <div>
          <h2>Chat with {selectedUser.username}</h2>
          <p>
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
          </p>
    </div>
  )
}

export default ChatHeader