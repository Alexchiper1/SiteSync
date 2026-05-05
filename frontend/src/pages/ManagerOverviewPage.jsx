import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/ManagerProfilePage.css";
import "../css/ManagerOverviewPage.css";
import ManagerSidebar from "../components/ManagerSidebar";
import { apiUrl } from "../lib/api";

export default function ManagerOverviewPage() {
  const [currentUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [sites, setSites] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "info" });
  const navigate = useNavigate();

  const loadOverviewData = useCallback(async () => {
    const sitesRes = await fetch(apiUrl(`/sites/${currentUser.email}`));

    const sitesData = await sitesRes.json();

    if (!sitesRes.ok) {
      setMessage({
        text:
          sitesData.msg ||
          "Could not load manager dashboard overview",
        type: "error"
      });
      return;
    }

    setSites(sitesData);
  }, [currentUser.email]);

  useEffect(() => {
    loadOverviewData();
  }, [loadOverviewData]);

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
              Your overview for managed sites and quick actions.
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
