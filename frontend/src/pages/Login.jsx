import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import "../css/Login.css";
import { apiUrl } from "../lib/api";

export default function Login() {
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch(apiUrl("/users"))
      .then(res => res.json())
      .then(data => setUsers(data));
  }, []);

  const handleLogin = () => {
    const user = users.find(
      u => u.email === email && u.password === password
    );

    if (!user) {
      alert("Invalid email or password");
      return;
    }

    localStorage.setItem("user", JSON.stringify(user));

    if (user.role === "manager") navigate("/manager");
    else navigate("/employee");
  };

  return (
    <>
      <Logo />
      <div className="form-container">
      <h2>Login</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Login</button>

      <p>
        Don't have an account?
        <a href="/register"> Register</a>
      </p>
    </div>
    </>
  );
}
