const API_URL = import.meta.env.VITE_API_URL;

const GroupDetails = ({
    group,
    userId,
    onGroupUpdated,
    onLeaveGroup
}) => {

    const isAdmin = group.admins?.some(
        admin => admin._id.toString() === userId.toString()
    );

    const handleRemoveMember = async (memberId) => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_URL}/api/groups/${group._id}/members/${memberId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error(data);
                return;
            }
            onGroupUpdated(data.group);

        } catch (error) {
            console.error("Failed to remove member:", error);
        }
    };

    return (
        <div className="flex flex-col ">
            <div className="p-6 border-b border-brand-border/20 bg-gray-50 shrink-0">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center text-brand-dark font-bold text-xl uppercase">
                        {group.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-brand-dark leading-tight">{group.name}</h3>
                        <p className="text-xs text-brand-secondary">
                            Created by: {group.createdBy?.username}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <h4 className="text-xs font-semibold text-brand-secondary uppercase tracking-wider mb-3">
                    Members ({group.members.length})
                </h4>

                <div className="flex flex-col gap-1">
                    {group.members.map(member => {

                        const memberIsAdmin = group.admins.some(
                            admin =>
                                admin._id.toString() ===
                                member._id.toString()
                        );

                        const isMe = member._id.toString() === userId.toString();

                        return (
                            <div key={member._id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 border border-transparent hover:border-brand-border/10 transition-colors">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded bg-gray-200 border border-brand-border/20 flex items-center justify-center text-brand-dark font-medium text-xs uppercase">
                                        {member.username.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-brand-dark leading-none">
                                            {member.username} {isMe && "(You)"}
                                        </span>
                                        {memberIsAdmin && (
                                            <span className="text-[10px] font-semibold text-brand-primary uppercase mt-1">Admin</span>
                                        )}
                                    </div>
                                </div>

                                {isAdmin && !isMe && (
                                    <button
                                        onClick={() =>
                                            handleRemoveMember(member._id)
                                        }
                                        className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors font-medium border border-transparent hover:border-red-200"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="p-4 border-t border-brand-border/20 shrink-0 bg-gray-50">
                <button 
                    onClick={onLeaveGroup}
                    className="w-full py-2 bg-white border border-brand-border/40 text-red-600 text-sm font-medium rounded hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm"
                >
                    Leave Group
                </button>
            </div>
        </div>
    );
};

export default GroupDetails;