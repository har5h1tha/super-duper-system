import { useEffect, useState } from "react";

const GroupList = ({ onSelectGroup ,refresh}) => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await fetch(
                    "http://localhost:3000/api/groups",
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

                setGroups(data.groups);
            } catch (error) {
                console.error("Failed to fetch groups:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGroups();
    }, [refresh]);

    if (loading) {
        return <p>Loading groups...</p>;
    }

    return (
        <div>
            <h3>Groups</h3>

            {groups.length === 0 ? (
                <p>No groups yet</p>
            ) : (
                groups.map((group) => (
                    <button
                        key={group._id}
                        onClick={() => onSelectGroup(group)}
                    >
                        {group.name}
                    </button>
                ))
            )}
        </div>
    );
};

export default GroupList;