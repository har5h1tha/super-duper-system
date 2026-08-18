import { useState } from "react";

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
                "http://localhost:5000/api/groups",
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

            console.log("GROUP CREATED:", data.group);

            setName("");

            onGroupCreated(data.group);

        } catch (error) {
            console.error("Create group error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleCreateGroup}>
            <input
                type="text"
                placeholder="Group name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />

            <button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Group"}
            </button>
        </form>
    );
};

export default CreateGroup;