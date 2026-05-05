import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/ManagerProfilePage.css";
import "../css/ManagerOverviewPage.css";
import ManagerSidebar from "../components/ManagerSidebar";
import { apiUrl } from "../lib/api";

export default function ManagerOverviewPage() {
  const [currentUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [sites, setSites] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [holidayRequests, setHolidayRequests] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "info" });
  const navigate = useNavigate();

  const loadOverviewData = useCallback(async () => {
    const [sitesRes, tasksRes, attendanceRes, holidaysRes] = await Promise.all([
      fetch(apiUrl(`/sites/${currentUser.email}`)),
      fetch(apiUrl(`/manager-tasks/${currentUser.email}`)),
      fetch(apiUrl(`/attendance/manager/${currentUser.email}`)),
      fetch(apiUrl(`/holiday-requests/manager/${currentUser.email}`))
    ]);

    const [sitesData, tasksData, attendanceData, holidaysData] = await Promise.all([
      sitesRes.json(),
      tasksRes.json(),
      attendanceRes.json(),
      holidaysRes.json()
    ]);

    if (!sitesRes.ok || !tasksRes.ok || !attendanceRes.ok || !holidaysRes.ok) {
      setMessage({
        text:
          sitesData.msg ||
          tasksData.msg ||
          attendanceData.msg ||
          holidaysData.msg ||
          "Could not load manager dashboard overview",
        type: "error"
      });
      return;
    }

    setSites(sitesData);
    setTasks(tasksData);
    setAttendance(attendanceData);
    setHolidayRequests(holidaysData);
  }, [currentUser.email]);

  useEffect(() => {
    loadOverviewData();
  }, [loadOverviewData]);

  const pendingHolidayCount = useMemo(
    () => holidayRequests.filter((request) => request.status === "pending").length,
    [holidayRequests]
  );

  const checkOutCount = useMemo(
    () => attendance.filter((row) => Boolean(row.checkOutAt)).length,
    [attendance]
  );

  const taskSummary = useMemo(() => {
    return tasks.reduce(
      (acc, task) => {
        acc.total += 1;
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      },
      { total: 0, assigned: 0, completed: 0, unable: 0 }
    );
  }, [tasks]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="manager-section-page manager-overview-page">
      <div className="manager-section-layout">
        <ManagerSidebar />

        <aside className="profile-sidebar">
          <div className="profile-card manager-overview-profile-card">
            <h3 className="profile-name">{currentUser?.name || "Manager"}</h3>
            <p className="profile-role">Manager</p>
            <p className="profile-details">{currentUser?.email}</p>
            <p className="profile-company">
              <strong>Company:</strong> {currentUser?.companyName}
            </p>
            <button
              type="button"
              className="profile-edit-toggle"
              onClick={() => navigate("/manager/profile")}
            >
              View Profile
            </button>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </aside>

        <main className="main-content manager-overview-main">
          <div className="dashboard-header manager-overview-header">
            <h1>Hello {currentUser?.name?.split(" ")[0] || "Manager"}!</h1>
            <p className="manager-overview-subtitle">
              Your overview for sites, employees, attendance, tasks, and leave requests.
            </p>
          </div>

          {message.text && (
            <div className={`app-message app-message-${message.type}`}>
              {message.text}
            </div>
          )}

          <section className="manager-overview-grid">
            <article className="manager-overview-stat-card">
              <span>Total Sites</span>
              <strong>{sites.length}</strong>
              <p>Managed construction sites in your workspace.</p>
            </article>

            <article className="manager-overview-stat-card">
              <span>Pending Holidays</span>
              <strong>{pendingHolidayCount}</strong>
              <p>Leave requests waiting for review.</p>
            </article>

            <article className="manager-overview-stat-card">
              <span>Today's Check-Ins</span>
              <strong>{attendance.length}</strong>
              <p>Attendance records created today.</p>
            </article>

            <article className="manager-overview-stat-card">
              <span>Today's Check-Outs</span>
              <strong>{checkOutCount}</strong>
              <p>Employees who have checked out today.</p>
            </article>

            <article className="manager-overview-stat-card">
              <span>Task Summary</span>
              <strong>{taskSummary.total} Active Tasks</strong>
              <p>
                {taskSummary.assigned} assigned · {taskSummary.completed} completed ·{" "}
                {taskSummary.unable} unable
              </p>
            </article>
          </section>

          <section className="create-site-form manager-overview-quick-actions">
            <h2>Quick Actions</h2>
            <div className="manager-overview-action-grid">
              <button type="button" onClick={() => navigate("/manager/sites")}>
                Create Site
              </button>
              <button type="button" onClick={() => navigate("/manager/tasks")}>
                Assign Task
              </button>
              <button type="button" onClick={() => navigate("/manager/attendance")}>
                View Attendance
              </button>
              <button type="button" onClick={() => navigate("/manager/holidays")}>
                Review Holidays
              </button>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
