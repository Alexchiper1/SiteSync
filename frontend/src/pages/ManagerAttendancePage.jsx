import { useCallback, useEffect, useState } from "react";
import "../css/ManagerOverviewPage.css";
import "../css/ManagerProfilePage.css";
import "../css/ManagerAttendancePage.css";
import ManagerSidebar from "../components/ManagerSidebar";
import { apiUrl } from "../lib/api";

function formatTime(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function ManagerAttendancePage() {
  const [currentUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [attendance, setAttendance] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "info" });

  const loadAttendance = useCallback(async () => {
    const res = await fetch(apiUrl(`/attendance/manager-history/${currentUser.email}`));
    const data = await res.json();

    if (!res.ok) {
      setMessage({ text: data.msg || "Could not load attendance", type: "error" });
      return;
    }

    setAttendance(data);
  }, [currentUser.email]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  return (
    <div className="manager-section-page">
      <div className="manager-section-layout">
        <ManagerSidebar />

        <main className="manager-section-main">
          <div className="dashboard-header manager-attendance-header">
            <div>
              <h1>Manager Attendance</h1>
              <p className="manager-attendance-subtitle">
                View check-ins and check-outs as a simple attendance list.
              </p>
            </div>
          </div>

          {message.text && (
            <div className={`app-message app-message-${message.type}`}>
              {message.text}
            </div>
          )}

          {attendance.length === 0 ? (
            <div className="manager-section-card">
              <p className="manager-attendance-empty">
                No attendance records found.
              </p>
            </div>
          ) : (
            <section className="create-site-form">
              <div className="section-header-row">
                <h2>Attendance List</h2>
              </div>

              <div className="attendance-table manager-attendance-table">
                <div className="attendance-header">
                  <span><strong>Employee</strong></span>
                  <span><strong>Site</strong></span>
                  <span><strong>Check In</strong></span>
                  <span><strong>Check Out</strong></span>
                </div>

                {attendance.map((row) => (
                  <div key={row._id} className="attendance-row">
                    <span>{row.employeeName || row.employeeEmail}</span>
                    <span>{row.siteName}</span>
                    <span>{formatTime(row.checkInAt)}</span>
                    <span>{formatTime(row.checkOutAt)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
