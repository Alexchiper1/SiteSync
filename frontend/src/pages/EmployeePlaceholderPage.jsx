import EmployeeSidebar from "../components/EmployeeSidebar";
import "../css/EmployeeProfilePage.css";

export default function EmployeePlaceholderPage({ title, description }) {
  return (
    <div className="employee-section-page">
      <div className="employee-section-layout">
        <EmployeeSidebar />

        <main className="employee-section-main">
          <div className="employee-section-card">
            <span className="employee-section-badge">Coming Next</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
        </main>
      </div>
    </div>
  );
}
