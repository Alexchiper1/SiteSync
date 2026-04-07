import { Link } from "react-router-dom";
import ManagerSidebar from "../components/ManagerSidebar";
import "../css/ManagerProfilePage.css";

export default function ManagerPlaceholderPage({ title, description }) {
  return (
    <div className="manager-section-page">
      <div className="manager-section-layout">
        <ManagerSidebar />

        <main className="manager-section-main">
          <div className="manager-section-card">
            <span className="manager-section-badge">Coming Next</span>
            <h1>{title}</h1>
            <p>{description}</p>
            <Link to="/manager" className="manager-profile-back-link">
              Back to dashboard
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
