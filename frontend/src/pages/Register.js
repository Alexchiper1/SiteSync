import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [role, setRole] = useState("employee");
  const [form, setForm] = useState({});
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();

    const newUser = {
      name: form.name,
      email: form.email,
      password: form.password, 
      role,
      ...(role === "manager" && { companyName: form.companyName })
    };


    await fetch("http://localhost:5000/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser)
    });

    navigate("/");
  };

  return (
    <form onSubmit={submit}>
      <h2>Register</h2>

      <input
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
  );
}
