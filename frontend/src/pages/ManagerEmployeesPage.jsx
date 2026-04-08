import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../css/ManagerProfilePage.css";
import "../css/ManagerEmployeesPage.css";
import ManagerSidebar from "../components/ManagerSidebar";
import { apiUrl, profileFallbackUrl, profileImageUrl } from "../lib/api";

export default function ManagerEmployeesPage() {
  const [currentUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [employees, setEmployees] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "info" });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");

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

  const siteOptions = useMemo(() => {
    return [...new Set(employees.map((employee) => employee.assignedSite).filter(Boolean))].sort();
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesSearch =
        !query ||
        employee.name?.toLowerCase().includes(query) ||
        employee.email?.toLowerCase().includes(query) ||
        employee.assignedSite?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || employee.status === statusFilter;

      const matchesSite =
        siteFilter === "all" || employee.assignedSite === siteFilter;

      return matchesSearch && matchesStatus && matchesSite;
    });
  }, [employees, search, siteFilter, statusFilter]);

  return (
    <div className="manager-section-page">
      <div className="manager-section-layout">
        <ManagerSidebar />

        <main className="manager-section-main">
          <div className="dashboard-header">
            <h1>Manager Employees</h1>
            <p className="manager-employees-subtitle">
              Review employees, see assigned sites, filter by status, and jump into task assignment.
            </p>
          </div>

          {message.text && (
            <div className={`app-message app-message-${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="manager-employees-toolbar">
            <input
              type="text"
              placeholder="Search by employee, email, or site"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="assigned">Assigned</option>
              <option value="checked in">Checked In</option>
              <option value="checked out">Checked Out</option>
            </select>

            <select value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)}>
              <option value="all">All sites</option>
              {siteOptions.map((site) => (
                <option key={site} value={site}>
                  {site}
                </option>
              ))}
            </select>
          </div>

          <div className="manager-employees-summary">
            <span>{filteredEmployees.length} employees shown</span>
          </div>

          {filteredEmployees.length === 0 ? (
            <div className="manager-section-card">
              <p className="manager-employees-empty">
                No employees match the current search or filters.
              </p>
            </div>
          ) : (
            <div className="manager-employee-grid">
              {filteredEmployees.map((employee) => (
                <article key={employee.email} className="manager-employee-card">
                  <div className="manager-employee-top">
                    <div className="manager-employee-avatar">
                      <img
                        src={
                          profileImageUrl(employee.profileImage) ||
                          profileFallbackUrl(employee.name)
                        }
                        alt={employee.name}
                      />
                    </div>

                    <div className="manager-employee-heading">
                      <h3>{employee.name}</h3>
                      <p>{employee.email}</p>
                      <span
                        className={`status-badge status-${employee.status.replace(/\s+/g, "-")}`}
                      >
                        {employee.status}
                      </span>
                    </div>
                  </div>

                  <div className="manager-employee-meta">
                    <div className="manager-employee-meta-row">
                      <span>Assigned Site</span>
                      <strong>{employee.assignedSite || "Unassigned"}</strong>
                    </div>
                    <div className="manager-employee-meta-row">
                      <span>Role</span>
                      <strong>{employee.role || "employee"}</strong>
                    </div>
                    <div className="manager-employee-meta-row">
                      <span>Company</span>
                      <strong>{employee.companyName || "Not set"}</strong>
                    </div>
                    <div className="manager-employee-meta-row">
                      <span>Total Tasks</span>
                      <strong>{employee.taskCount}</strong>
                    </div>
                  </div>

                  {employee.joinedSites?.length > 1 && (
                    <div className="manager-employee-extra-sites">
                      <span>Also on:</span>
                      <strong>
                        {employee.joinedSites
                          .slice(1)
                          .map((site) => site.siteName)
                          .join(", ")}
                      </strong>
                    </div>
                  )}

                  <Link
                    to={`/manager/tasks?employee=${encodeURIComponent(employee.email)}`}
                    className="manager-employee-task-link"
                  >
                    Quick Assign Task
                  </Link>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
