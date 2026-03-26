import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import "../css/Login.css";
import { apiUrl } from "../lib/api";

export default function Login() {
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "info" });
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(apiUrl("/users"))
      .then(res => res.json())
      .then(data => setUsers(data));
  }, []);

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const handleLogin = () => {
    const user = users.find(
      u => u.email === email && u.password === password
    );

    if (!user) {
      setMessage({ text: "Invalid email or password", type: "error" });
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
      <div className="form-top-link">
        <Link to="/">Back to home</Link>
      </div>
      <h2>Login</h2>

      {message.text && (
        <div className={`app-message app-message-${message.type}`}>
          {message.text}
        </div>
      )}

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
        <Link to="/register"> Register</Link>
      </p>
    </div>
    </>
  );
}
