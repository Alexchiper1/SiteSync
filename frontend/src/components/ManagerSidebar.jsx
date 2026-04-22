import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.clear();
    setIsMobileOpen(false);
    navigate("/login", { replace: true });
  };

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
        className="manager-sidebar-mobile-toggle"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open manager navigation"
      >
        <span />
        <span />
        <span />
      </button>

      <div
        className={`manager-sidebar-backdrop${isMobileOpen ? " manager-sidebar-backdrop-open" : ""}`}
        onClick={() => setIsMobileOpen(false)}
      />

      <aside className={`manager-sidebar-nav${isMobileOpen ? " manager-sidebar-nav-open" : ""}`}>
        <div className="manager-sidebar-card">
          <div className="manager-sidebar-mobile-header">
            <div className="manager-sidebar-brand">
              <span className="manager-sidebar-kicker">Manager Area</span>
              <h2>SiteSync</h2>
            </div>
            <button
              type="button"
              className="manager-sidebar-close"
              onClick={() => setIsMobileOpen(false)}
              aria-label="Close manager navigation"
            >
              x
            </button>
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
                onClick={() => setIsMobileOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <button
              type="button"
              className="manager-sidebar-logout"
              onClick={handleLogout}
            >
              Log Out
            </button>
          </nav>
        </div>
      </aside>
    </>
  );
}
