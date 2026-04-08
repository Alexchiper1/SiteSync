import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "../css/EmployeeSidebar.css";

const navItems = [
  { to: "/employee", label: "Dashboard" },
  { to: "/employee/profile", label: "Profile" },
  { to: "/employee/sites", label: "Sites" },
  { to: "/employee/tasks", label: "Tasks" },
  { to: "/employee/attendance", label: "Attendance" },
  { to: "/employee/holidays", label: "Holidays" }
];

export default function EmployeeSidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!isMobileOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen]);

  return (
    <>
      <button
        type="button"
        className="employee-sidebar-mobile-toggle"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open employee navigation"
      >
        <span />
        <span />
        <span />
      </button>

      <div
        className={`employee-sidebar-backdrop${isMobileOpen ? " employee-sidebar-backdrop-open" : ""}`}
        onClick={() => setIsMobileOpen(false)}
      />

      <aside className={`employee-sidebar-nav${isMobileOpen ? " employee-sidebar-nav-open" : ""}`}>
        <div className="employee-sidebar-card">
          <div className="employee-sidebar-mobile-header">
            <div className="employee-sidebar-brand">
              <span className="employee-sidebar-kicker">Employee Area</span>
              <h2>SiteSync</h2>
            </div>
            <button
              type="button"
              className="employee-sidebar-close"
              onClick={() => setIsMobileOpen(false)}
              aria-label="Close employee navigation"
            >
              x
            </button>
          </div>

          <nav className="employee-sidebar-links" aria-label="Employee navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/employee"}
                className={({ isActive }) =>
                  `employee-sidebar-link${isActive ? " employee-sidebar-link-active" : ""}`
                }
                onClick={() => setIsMobileOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
