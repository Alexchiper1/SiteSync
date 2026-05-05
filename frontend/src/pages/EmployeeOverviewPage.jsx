import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/EmployeeProfilePage.css";
import "../css/EmployeeOverviewPage.css";
import EmployeeSidebar from "../components/EmployeeSidebar";
import { apiUrl } from "../lib/api";

export default function EmployeeOverviewPage() {
  const [currentUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [message] = useState({ text: "", type: "info" });
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const navigate = useNavigate();

  const loadAttendanceHistory = useCallback(async () => {
    const res = await fetch(
      apiUrl(`/attendance/employee-history/${currentUser.email.trim().toLowerCase()}`)
    );
    setAttendanceHistory(await res.json());
  }, [currentUser.email]);

  useEffect(() => {
    loadAttendanceHistory();
  }, [loadAttendanceHistory]);

  const openAttendanceRecord = attendanceHistory.find((row) => !row.checkOutAt);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="employee-section-page employee-overview-page">
      <div className="employee-section-layout">
        <EmployeeSidebar />

        <aside className="profile-sidebar">
          <div className="profile-card employee-overview-profile-card">
            <h3 className="profile-name">{currentUser?.name || "Employee"}</h3>
            <p className="profile-role">Construction Worker</p>
            <p className="profile-details">{currentUser?.email}</p>
            <button
              type="button"
              className="profile-edit-toggle"
              onClick={() => navigate("/employee/profile")}
            >
              View Profile
            </button>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </aside>

        <main className="main-content employee-overview-main">
          <div className="dashboard-header employee-overview-header">
            <h1>Hello {currentUser?.name?.split(" ")[0] || "Employee"}!</h1>
            <p className="employee-overview-subtitle">
              Your overview for site access and attendance.
            </p>
          </div>

          {message.text && (
            <div className={`app-message app-message-${message.type}`}>
              {message.text}
            </div>
          )}

          <section className="employee-overview-grid">
            <article className="employee-overview-stat-card">
              <span>Check-In Status</span>
              <strong>{openAttendanceRecord ? "Checked In" : "Not Checked In"}</strong>
              <p>
                {openAttendanceRecord
                  ? `Active at ${openAttendanceRecord.siteName}`
                  : "No active check-in right now."}
              </p>
            </article>
          </section>

          <section className="create-site-form employee-overview-quick-actions">
            <h2>Quick Actions</h2>
            <div className="employee-overview-action-grid">
              <button type="button" onClick={() => navigate("/employee/attendance")}>
                {openAttendanceRecord ? "Check In / Check Out" : "Check In / Check Out"}
              </button>
              <button type="button" onClick={() => navigate("/employee/tasks")}>
                View Tasks
              </button>
              <button type="button" onClick={() => navigate("/employee/sites")}>
                Join Site
              </button>
              <button type="button" onClick={() => navigate("/employee/holidays")}>
                Request Holiday
              </button>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}