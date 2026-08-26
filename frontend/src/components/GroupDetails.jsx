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
                `http://localhost:3000/api/groups/${group._id}/members/${memberId}`,
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
        <div>
            <h3>{group.name}</h3>

            <p>
                Created by: {group.createdBy?.username}
            </p>

            <h4>
                Members ({group.members.length})
            </h4>

            {group.members.map(member => {

                const memberIsAdmin = group.admins.some(
                    admin =>
                        admin._id.toString() ===
                        member._id.toString()
                );

                return (
                    <div key={member._id}>
                        <span>
                            {member.username}
                            {memberIsAdmin && " (Admin)"}
                        </span>

                        {isAdmin &&
                            member._id.toString() !== userId.toString() && (
                                <button
                                    onClick={() =>
                                        handleRemoveMember(member._id)
                                    }
                                >
                                    Remove
                                </button>
                            )}
                    </div>
                );
            })}

            <button onClick={onLeaveGroup}>
                Leave Group
            </button>
        </div>
    );
};

export default GroupDetails;