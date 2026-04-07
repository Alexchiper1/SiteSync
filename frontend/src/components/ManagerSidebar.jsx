import { NavLink } from "react-router-dom";
import "../css/ManagerSidebar.css";

const navItems = [
  { to: "/manager", label: "Dashboard" },
  { to: "/manager/profile", label: "Profile" },
  { to: "/manager/sites", label: "Sites" },
  { to: "/manager/employees", label: "Employees" },
  { to: "/manager/tasks", label: "Tasks" },
  { to: "/manager/attendance", label: "Attendance" },
  { to: "/manager/holidays", label: "Holiday Requests" }
];

export default function ManagerSidebar() {
  return (
    <aside className="manager-sidebar-nav">
      <div className="manager-sidebar-card">
        <div className="manager-sidebar-brand">
          <span className="manager-sidebar-kicker">Manager Area</span>
          <h2>SiteSync</h2>
        </div>

        <nav className="manager-sidebar-links" aria-label="Manager navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/manager"}
              className={({ isActive }) =>
                `manager-sidebar-link${isActive ? " manager-sidebar-link-active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}
