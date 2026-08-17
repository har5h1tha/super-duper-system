import { useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";

function App() {
    const [page, setPage] = useState("login");

    const token = localStorage.getItem("token");

    if (token) {
        return <Chat onLogout={() => {
            localStorage.removeItem("token");
            window.location.reload();
        }} />;
    }

    if (page === "register") {
        return (
            <Register
                onRegister={() => setPage("login")}
            />
        );
    }

    return (
        <Login
            onLogin={() => window.location.reload()}
            onRegister={() => setPage("register")}
        />
    );
}

export default App;