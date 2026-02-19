import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import "../css/Register.css";

export default function Register() {
  const [role, setRole] = useState("employee");
  const [form, setForm] = useState({});
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();

    const newUser = {
      name: form.name?.trim(),
      email: form.email?.trim().toLowerCase(),
      password: form.password, 
      role,
      ...(role === "manager" && { companyName: form.companyName?.trim() })
    };


    const response = await fetch("http://localhost:5000/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser)
    });

    const data = await response.json();
    
    if (response.ok) {
      alert("Account created successfully! You can now login.");
      navigate("/");
    } else {
      alert(data.msg);
    }
  };

  return (
    <>
       <Logo />

      <div className="form-container">
        <form onSubmit={submit}>
          <h2>Register</h2>


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
          onChange={e => setForm({ ...form, password: e.target.value })}
          required
        />

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
          <a href="./"> Login</a>
        </p>
      </form>
    </div>
    </>
  );
}
