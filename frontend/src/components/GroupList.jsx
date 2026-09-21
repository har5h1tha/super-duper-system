import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

const GroupList = ({ onSelectGroup ,refresh}) => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await fetch(
                    `${API_URL}/api/groups`,
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
        return <div className="p-4 text-sm text-brand-secondary">Loading groups...</div>;
    }

    return (
        <div className="py-2">
            <h3 className="px-4 pb-2 text-xs font-semibold text-brand-secondary uppercase tracking-wider">
                Your Groups
            </h3>

            {groups.length === 0 ? (
                <p className="px-4 py-2 text-sm text-brand-secondary italic">No groups yet</p>
            ) : (
                <div className="flex flex-col">
                    {groups.map((group) => (
                        <button
                            key={group._id}
                            onClick={() => onSelectGroup(group)}
                            className="text-left px-4 py-2.5 mx-2 my-0.5 rounded border border-transparent hover:bg-white hover:border-brand-border/20 transition-colors flex items-center gap-2 group"
                        >
                            <div className="w-6 h-6 rounded bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center text-brand-dark font-semibold text-xs shrink-0">
                                {group.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-brand-dark text-sm truncate">
                                {group.name}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GroupList;