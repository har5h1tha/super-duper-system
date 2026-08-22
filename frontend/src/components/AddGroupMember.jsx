import { useState } from 'react'

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

            const response = await fetch(`http://localhost:3000/api/groups/${group._id}/members`,
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


    return (

        <form onSubmit={handleAddMember}>
            <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
            >
                <option value="">
                    Select a User
                </option>

                {availableUsers.map((user) => (
                    <option value={user._id} key={user._id}>
                        {user.username}
                    </option>
                ))}
            </select>

            <button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Member"}
            </button>



        </form>



    )
}

export default AddGroupMember