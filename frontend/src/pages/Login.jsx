import { useState } from 'react'

const Login = ({ onLogin, onRegister }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:3000/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json()

            if (!response.ok) {
                console.error(data);
                return;
            }
            console.log("LOGIN SUCCESS");
            localStorage.setItem("token", data.token);

            onLogin()
        } catch (error) {
            console.error("LOGIN error:", error);
        }
    }

    return (
        <div>
            <h1>CollabHub</h1>

            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button type='submit'>
                    Login
                </button>

                <button type="button" onClick={onRegister}>
                    Create an account
                </button>

            </form>

        </div>
    )
}

export default Login