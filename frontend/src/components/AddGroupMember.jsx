import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL;

const AddGroupMember = ({ group, users, onMemberAdded }) => {

    const [selectedUserId, setSelectedUserId] = useState("");
    const [loading, setLoading] = useState(false);

    const handleAddMember = async (e) => {
        e.preventDefault();

        if (!selectedUserId) {
            return;
        }
        try {
            setLoading(true);

            const token = localStorage.getItem("token");

            const response = await fetch(`${API_URL}/api/groups/${group._id}/members`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        userId: selectedUserId
                    })
                }
            )

            const data = await response.json();
            if (!response.ok) {
                return
            }
            console.log("Member added:", data.group);

            setSelectedUserId("");

            onMemberAdded(data.group);


        } catch (error) {
            console.log("Eror in adding a member", error)
        } finally {
            setLoading(false);
        }
    }

    const availableUsers = users.filter((user) => {
        return !group.members.some((member) => {
            const memberId = member._id || member;

            return memberId.toString() === user._id.toString();
        });
    });

    if (availableUsers.length === 0) {
        return (
            <div className="p-4 text-sm text-brand-secondary italic">
                All users are already in this group.
            </div>
        );
    }

    return (
        <div className="p-4 bg-white border-t border-brand-border/20">
            <h4 className="text-xs font-semibold text-brand-secondary uppercase tracking-wider mb-3">
                Add New Member
            </h4>
            <form onSubmit={handleAddMember} className="flex flex-col gap-2">
                <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-brand-border/40 rounded bg-gray-50 text-brand-dark outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                >
                    <option value="" disabled>
                        Select a user...
                    </option>

                    {availableUsers.map((user) => (
                        <option value={user._id} key={user._id}>
                            {user.username}
                        </option>
                    ))}
                </select>

                <button 
                    type="submit" 
                    disabled={loading || !selectedUserId}
                    className="w-full py-2 bg-brand-primary text-brand-dark text-sm font-medium rounded hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border border-brand-hover"
                >
                    {loading ? "Adding..." : "Add Member"}
                </button>
            </form>
        </div>
    )
}

export default AddGroupMember