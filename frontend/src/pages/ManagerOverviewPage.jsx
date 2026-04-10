import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/ManagerDashboard.css";
import "../css/ManagerProfilePage.css";
import "../css/ManagerOverviewPage.css";
import ManagerSidebar from "../components/ManagerSidebar";
import { apiUrl, profileFallbackUrl, profileImageUrl } from "../lib/api";

export default function ManagerOverviewPage() {
  const [currentUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [sites, setSites] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [holidayRequests, setHolidayRequests] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "info" });
  const navigate = useNavigate();

  const loadOverviewData = useCallback(async () => {
    const [sitesRes, employeesRes, tasksRes, attendanceRes, holidaysRes] = await Promise.all([
      fetch(apiUrl(`/sites/${currentUser.email}`)),
      fetch(apiUrl(`/manager-employees/${currentUser.email}`)),
      fetch(apiUrl(`/manager-tasks/${currentUser.email}`)),
      fetch(apiUrl(`/attendance/manager/${currentUser.email}`)),
      fetch(apiUrl(`/holiday-requests/manager/${currentUser.email}`))
    ]);

    const [sitesData, employeesData, tasksData, attendanceData, holidaysData] = await Promise.all([
      sitesRes.json(),
      employeesRes.json(),
      tasksRes.json(),
      attendanceRes.json(),
      holidaysRes.json()
    ]);

    if (!sitesRes.ok || !employeesRes.ok || !tasksRes.ok || !attendanceRes.ok || !holidaysRes.ok) {
      setMessage({
        text:
          sitesData.msg ||
          employeesData.msg ||
          tasksData.msg ||
          attendanceData.msg ||
          holidaysData.msg ||
          "Could not load manager dashboard overview",
        type: "error"
      });
      return;
    }

    setSites(sitesData);
    setEmployees(employeesData);
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

  const recentUpdates = useMemo(() => {
    const attendanceItems = attendance.slice(0, 3).map((row) => ({
      id: `attendance-${row._id}`,
      title: row.checkOutAt ? "Check-out recorded" : "Check-in recorded",
      detail: `${row.employeeName || row.employeeEmail} · ${row.siteName}`,
      time: new Date(row.checkOutAt || row.checkInAt).getTime()
    }));

    const holidayItems = holidayRequests.slice(0, 3).map((request) => ({
      id: `holiday-${request._id}`,
      title: `Holiday ${request.status === "denied" ? "rejected" : request.status}`,
      detail: `${request.employeeName || request.employeeEmail} · ${request.siteName}`,
      time: new Date(request.createdAt || request.startDate).getTime()
    }));

    const taskItems = tasks.slice(0, 3).map((task) => ({
      id: `task-${task._id}`,
      title: `Task ${task.status}`,
      detail: `${task.employeeEmail} · ${task.siteName}`,
      time: task._id ? Number.parseInt(String(task._id).slice(0, 8), 16) * 1000 : 0
    }));

    return [...attendanceItems, ...holidayItems, ...taskItems]
      .sort((a, b) => b.time - a.time)
      .slice(0, 6);
  }, [attendance, holidayRequests, tasks]);

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
            <div className="profile-avatar">
              <img
                src={
                  profileImageUrl(currentUser?.profileImage) ||
                  profileFallbackUrl(currentUser?.name)
                }
                alt="Profile"
              />
            </div>
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
              <span>Total Employees</span>
              <strong>{employees.length}</strong>
              <p>Employees currently assigned across your sites.</p>
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

          <section className="manager-overview-detail-grid">
            <div className="create-site-form manager-overview-summary-card">
              <h2>Operations Snapshot</h2>
              <div className="manager-overview-feedback-grid">
                <div className="manager-overview-feedback-card">
                  <span>Employees checked in</span>
                  <strong>{attendance.filter((row) => !row.checkOutAt).length}</strong>
                </div>
                <div className="manager-overview-feedback-card">
                  <span>Employees checked out</span>
                  <strong>{checkOutCount}</strong>
                </div>
                <div className="manager-overview-feedback-card">
                  <span>Sites with teams</span>
                  <strong>{new Set(employees.map((employee) => employee.assignedSite)).size}</strong>
                </div>
                <div className="manager-overview-feedback-card">
                  <span>Holiday reviews left</span>
                  <strong>{pendingHolidayCount}</strong>
                </div>
              </div>
            </div>

            <div className="create-site-form manager-overview-recent-card">
              <h2>Recent Updates</h2>
              {recentUpdates.length === 0 ? (
                <p className="manager-overview-empty">No recent updates yet.</p>
              ) : (
                <div className="manager-overview-activity-list">
                  {recentUpdates.map((item) => (
                    <div key={item.id} className="manager-overview-activity-item">
                      <strong>{item.title}</strong>
                      <p>{item.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
