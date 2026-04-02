import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../pictures/LogoNoBack.png";
import "../css/Register.css";
import { apiUrl } from "../lib/api";

export default function Register() {
  const [role, setRole] = useState("employee");
  const [form, setForm] = useState({});
  const [message, setMessage] = useState({ text: "", type: "info" });
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();

    if ((form.password || "").length < 6) {
      setMessage({
        text: "Password must be min 6 characters",
        type: "error"
      });
      return;
    }

    const newUser = {
      name: form.name?.trim(),
      email: form.email?.trim().toLowerCase(),
      password: form.password, 
      role,
      ...(role === "manager" && { companyName: form.companyName?.trim() })
    };


    try {
      const response = await fetch(apiUrl("/users"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
      });

      const raw = await response.text();
      let data = {};

      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = { msg: raw };
      }

      if (response.ok) {
        navigate("/login", {
          state: {
            message: {
              text: "Account created successfully! You can now login.",
              type: "success"
            }
          }
        });
      } else {
        setMessage({
          text: data.msg || `Unable to create account. Status ${response.status}`,
          type: "error"
        });
      }
    } catch (error) {
      setMessage({
        text: `Create account failed: ${error.message}`,
        type: "error"
      });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page-header">
        <Link to="/" className="auth-brand">
          <img src={logo} alt="SiteSync Logo" className="auth-brand-logo" />
          <span className="auth-brand-text">SiteSync</span>
        </Link>
      </div>

      <div className="form-container auth-form-card">
        <form onSubmit={submit}>
          <div className="form-top-link">
            <Link to="/">Back to home</Link>
          </div>
          <h2>Register</h2>

          {message.text && (
            <div className={`auth-inline-message auth-inline-message-${message.type}`}>
              {message.text}
            </div>
          )}

          <input
            type="text"
            placeholder="Name"
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />

          <input
            type="email"
            placeholder="Email"
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password || ""}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
          />

          {(form.password || "").length > 0 && (form.password || "").length < 6 && (
            <div className="field-error-message">Password must be min 6 characters</div>
          )}

          <select onChange={e => setRole(e.target.value)}>
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
          </select>

          {role === "manager" && (
            <input
              type="text"
              placeholder="Company Name"
              onChange={e => setForm({ ...form, companyName: e.target.value })}
              required
            />
          )}

          <button>Create Account</button>
          
          <p>
            Already Have An Account?
            <Link to="/login"> Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}