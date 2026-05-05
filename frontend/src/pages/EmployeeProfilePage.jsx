import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/EmployeeOverviewPage.css";
import "../css/EmployeeProfilePage.css";
import EmployeeSidebar from "../components/EmployeeSidebar";

export default function EmployeeProfilePage() {
  const [currentUser] = useState(JSON.parse(localStorage.getItem("user")));
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="employee-profile-page">
      <div className="employee-section-layout">
        <EmployeeSidebar />

        <main className="employee-section-main">
          <div className="employee-profile-shell">
            <div className="profile-card employee-profile-card">
              <h1 className="employee-profile-title">Employee Profile</h1>
              <h3 className="profile-name">{currentUser?.name || "Employee"}</h3>
              <p className="profile-role">Construction Worker</p>
              <p className="profile-details">{currentUser?.email}</p>

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
