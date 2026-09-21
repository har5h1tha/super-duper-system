import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

const CreateGroup = ({ onGroupCreated }) => {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreateGroup = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            return;
        }

        try {
            setLoading(true);

            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_URL}/api/groups`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: name.trim()
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error(data);
                return;
            }

            setName("");

            onGroupCreated(data.group);

        } catch (error) {
            console.error("Create group error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleCreateGroup} className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-brand-secondary uppercase tracking-wider">
                Create New Group
            </label>
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="Group name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 min-w-0 px-2 py-1.5 text-sm border border-brand-border/40 rounded bg-white text-brand-dark outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary placeholder-gray-400"
                />

                <button 
                    type="submit" 
                    disabled={loading || !name.trim()}
                    className="px-3 py-1.5 bg-brand-primary text-brand-dark text-sm font-medium rounded hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap border border-brand-hover shadow-sm"
                >
                    {loading ? "..." : "Create"}
                </button>
            </div>
        </form>
    );
};

export default CreateGroup;