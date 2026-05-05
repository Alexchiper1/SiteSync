import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/EmployeeProfilePage.css";
import "../css/EmployeeOverviewPage.css";
import EmployeeSidebar from "../components/EmployeeSidebar";
import SiteLiveMap from "../components/SiteLiveMap";
import { apiUrl } from "../lib/api";
import { haversineMeters } from "../utils/distance";

export default function EmployeeOverviewPage() {
  const [currentUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [message, setMessage] = useState({ text: "", type: "info" });
  const [mySites, setMySites] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [selectedSite, setSelectedSite] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [distance, setDistance] = useState(null);
  const [isWithin, setIsWithin] = useState(false);
  const navigate = useNavigate();

  const loadMySites = useCallback(async () => {
    const res = await fetch(apiUrl(`/employee-sites/${currentUser.email.trim().toLowerCase()}`));
    setMySites(await res.json());
  }, [currentUser.email]);

  const loadAttendanceHistory = useCallback(async () => {
    const res = await fetch(
      apiUrl(`/attendance/employee-history/${currentUser.email.trim().toLowerCase()}`)
    );
    setAttendanceHistory(await res.json());
  }, [currentUser.email]);

  useEffect(() => {
    loadMySites();
    loadAttendanceHistory();
  }, [loadAttendanceHistory, loadMySites]);

  useEffect(() => {
    if (!navigator.geolocation) {
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      () => {
        setMessage({ text: "Please allow location access (GPS).", type: "error" });
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (!selectedSiteId && mySites.length > 0) {
      setSelectedSiteId(mySites[0].siteId);
    }
  }, [mySites, selectedSiteId]);

  useEffect(() => {
    const loadSite = async () => {
      if (!selectedSiteId) {
        setSelectedSite(null);
        setDistance(null);
        setIsWithin(false);
        return;
      }

      const res = await fetch(apiUrl(`/site/${selectedSiteId}`));
      const site = await res.json();
      setSelectedSite(site);
    };

    loadSite();
  }, [selectedSiteId]);

  useEffect(() => {
    if (!selectedSite?.lat || !selectedSite?.lng || !userPos?.lat || !userPos?.lng) {
      setDistance(null);
      setIsWithin(false);
      return;
    }

    const d = haversineMeters(
      userPos.lat,
      userPos.lng,
      selectedSite.lat,
      selectedSite.lng
    );

    setDistance(d);
    const radius = Number(selectedSite.radiusMeters ?? 100);
    setIsWithin(d <= radius);
  }, [selectedSite, userPos]);

  const openAttendanceRecord = attendanceHistory.find((row) => !row.checkOutAt);
  const todayAttendanceRecord = attendanceHistory.find(
    (row) => new Date(row.checkInAt).toDateString() === new Date().toDateString()
  );

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="employee-section-page employee-overview-page">
      <div className="employee-section-layout">
        <EmployeeSidebar />

        <aside className="profile-sidebar">
          <div className="profile-card employee-overview-profile-card">
            <h3 className="profile-name">{currentUser?.name || "Employee"}</h3>
            <p className="profile-role">Construction Worker</p>
            <p className="profile-details">{currentUser?.email}</p>
            <button
              type="button"
              className="profile-edit-toggle"
              onClick={() => navigate("/employee/profile")}
            >
              View Profile
            </button>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </aside>

        <main className="main-content employee-overview-main">
          <div className="dashboard-header employee-overview-header">
            <h1>Hello {currentUser?.name?.split(" ")[0] || "Employee"}!</h1>
            <p className="employee-overview-subtitle">
              Your overview for site access and attendance.
            </p>
          </div>

          {message.text && (
            <div className={`app-message app-message-${message.type}`}>
              {message.text}
            </div>
          )}

          <section className="employee-overview-grid">
            <article className="employee-overview-stat-card">
              <span>Check-In Status</span>
              <strong>{openAttendanceRecord ? "Checked In" : "Not Checked In"}</strong>
              <p>
                {openAttendanceRecord
                  ? `Active at ${openAttendanceRecord.siteName}`
                  : "No active check-in right now."}
              </p>
            </article>

            <article className="employee-overview-stat-card">
              <span>Today's Site</span>
              <strong>
                {selectedSite?.name || openAttendanceRecord?.siteName || mySites[0]?.siteName || "No site"}
              </strong>
              <p>
                {selectedSite
                  ? `${Number(selectedSite.radiusMeters ?? 100)}m allowed radius`
                  : "Select or join a site to start tracking attendance."}
              </p>
            </article>

          </section>

          <section className="create-site-form employee-overview-quick-actions">
            <h2>Quick Actions</h2>
            <div className="employee-overview-action-grid">
              <button type="button" onClick={() => navigate("/employee/attendance")}>
                {openAttendanceRecord ? "Check In / Check Out" : "Check In / Check Out"}
              </button>
              <button type="button" onClick={() => navigate("/employee/tasks")}>
                View Tasks
              </button>
              <button type="button" onClick={() => navigate("/employee/sites")}>
                Join Site
              </button>
              <button type="button" onClick={() => navigate("/employee/holidays")}>
                Request Holiday
              </button>
            </div>
          </section>

          <section className="employee-overview-detail-grid">
            <div className="create-site-form employee-overview-attendance-card">
              <div className="employee-overview-section-header">
                <h2>Attendance Snapshot</h2>
                <select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="employee-overview-site-select"
                >
                  <option value="">Select a site</option>
                  {mySites.map((site) => (
                    <option key={site._id} value={site.siteId}>
                      {site.siteName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="employee-overview-feedback-grid">
                <div className="employee-overview-feedback-card">
                  <span>Current Location</span>
                  <strong>{userPos ? "GPS ready" : "Waiting for GPS"}</strong>
                </div>
                <div className="employee-overview-feedback-card">
                  <span>Radius Status</span>
                  <strong>
                    {selectedSite ? (isWithin ? "Within radius" : "Outside radius") : "No site selected"}
                  </strong>
                </div>
                <div className="employee-overview-feedback-card">
                  <span>Distance</span>
                  <strong>{distance == null ? "..." : `${Math.round(distance)}m`}</strong>
                </div>
                <div className="employee-overview-feedback-card">
                  <span>Today</span>
                  <strong>
                    {todayAttendanceRecord
                      ? `${new Date(todayAttendanceRecord.checkInAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })} check-in`
                      : "No record yet"}
                  </strong>
                </div>
              </div>

              {selectedSite && (
                <div className="employee-overview-map-wrap">
                  <SiteLiveMap site={selectedSite} userPos={userPos} size={280} />
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
