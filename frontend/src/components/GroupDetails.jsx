import { useEffect, useState } from "react";

const GroupDetails = ({
    group,
    userId,
    onGroupUpdated,
    onLeaveGroup
}) => {
    const [groupDetails, setGroupDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!group?._id) return;
        const fetchGroupDetails = async () => {
            setLoading(true);

            try {
                const token = localStorage.getItem("token");

                const response = await fetch(
                    `http://localhost:3000/api/groups/${group._id}`,
                    {
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

                setGroupDetails(data.group);
            } catch (error) {
                console.error("Failed to fetch group details:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGroupDetails();
    }, [group?._id]);

    const isAdmin = groupDetails?.admins?.some(
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

            setGroupDetails(data.group);

            if (onGroupUpdated) {
                onGroupUpdated(data.group);
            }
        } catch (error) {
            console.error("Failed to remove member:", error);
        }
    };

    if (loading) {
        return <p>Loading group details...</p>;
    }

    if (!groupDetails) {
        return <p>Unable to load group details.</p>;
    }

    return (
        <div>
            <h3>{groupDetails.name}</h3>

            <p>
                Created by:{" "}
                {groupDetails.createdBy?.username}
            </p>

            <h4>Members ({groupDetails.members.length})</h4>

            {groupDetails.members.map(member => {
                const memberIsAdmin = groupDetails.admins.some(
                    admin =>
                        admin._id.toString() === member._id.toString()
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