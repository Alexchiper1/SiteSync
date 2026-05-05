import { useEffect, useState } from "react";
import "../css/ManagerProfilePage.css";
import "../css/ManagerEmployeesPage.css";
import ManagerSidebar from "../components/ManagerSidebar";
import { apiUrl } from "../lib/api";

export default function ManagerEmployeesPage() {
  const [currentUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [employees, setEmployees] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "info" });

  useEffect(() => {
    const loadEmployees = async () => {
      const res = await fetch(apiUrl(`/manager-employees/${currentUser.email}`));
      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.msg || "Could not load employees", type: "error" });
        return;
      }

      setEmployees(data);
    };

    loadEmployees();
  }, [currentUser.email]);

  return (
    <div className="manager-section-page">
      <div className="manager-section-layout">
        <ManagerSidebar />

        <main className="manager-section-main">
          <div className="dashboard-header">
            <h1>Manager Employees</h1>
            <p className="manager-employees-subtitle">
              View employee names and email addresses.
            </p>
          </div>

          {message.text && (
            <div className={`app-message app-message-${message.type}`}>
              {message.text}
            </div>
          )}

          {employees.length === 0 ? (
            <div className="manager-section-card">
              <p className="manager-employees-empty">
                No employees found.
              </p>
            </div>
          ) : (
            <div className="manager-employee-grid">
              {employees.map((employee) => (
                <article key={employee.email} className="manager-employee-card">
                  <div className="manager-employee-top">
                    <div className="manager-employee-heading">
                      <h3>{employee.name}</h3>
                      <p>{employee.email}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
