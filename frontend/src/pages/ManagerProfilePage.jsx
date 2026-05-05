import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/ManagerOverviewPage.css";
import "../css/ManagerProfilePage.css";
import ManagerSidebar from "../components/ManagerSidebar";

export default function ManagerProfilePage() {
  const [currentUser] = useState(JSON.parse(localStorage.getItem("user")));
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="manager-profile-page">
      <div className="manager-section-layout">
        <ManagerSidebar />

        <main className="manager-section-main">
          <div className="manager-profile-shell">
            <div className="profile-card manager-profile-card">
              <h1 className="manager-profile-title">Manager Profile</h1>
              <h3 className="profile-name">{currentUser?.name || "Manager"}</h3>
              <p className="profile-role">Manager</p>
              <p className="profile-details">{currentUser?.email}</p>
              <p className="profile-company">
                <strong>Company:</strong> {currentUser?.companyName}
              </p>

              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </main>
      </div>

    </div>
  );
}
