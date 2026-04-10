import { useCallback, useEffect, useMemo, useState } from "react";
import "../css/EmployeeDashboard.css";
import "../css/EmployeeProfilePage.css";
import "../css/EmployeeAttendancePage.css";
import SiteLiveMap from "../components/SiteLiveMap";
import EmployeeSidebar from "../components/EmployeeSidebar";
import { apiUrl } from "../lib/api";
import { haversineMeters } from "../utils/distance";

function toDateInputValue(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function formatTime(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDate(value) {
  return new Date(value).toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short"
  });
}

export default function EmployeeAttendancePage() {
  const [currentUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [message, setMessage] = useState({ text: "", type: "info" });
  const [mySites, setMySites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [selectedSite, setSelectedSite] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [distance, setDistance] = useState(null);
  const [isWithin, setIsWithin] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  const today = useMemo(() => new Date(), []);
  const defaultStart = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return toDateInputValue(date);
  }, []);
  const defaultEnd = useMemo(() => toDateInputValue(today), [today]);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  const loadMySites = useCallback(async () => {
    const res = await fetch(apiUrl(`/employee-sites/${currentUser.email.trim().toLowerCase()}`));
    setMySites(await res.json());
  }, [currentUser.email]);

  const loadAttendanceHistory = useCallback(async () => {
    const params = new URLSearchParams({
      startDate,
      endDate
    });

    const res = await fetch(
      apiUrl(`/attendance/employee-history/${currentUser.email.trim().toLowerCase()}?${params.toString()}`)
    );
    setAttendanceHistory(await res.json());
  }, [currentUser.email, endDate, startDate]);

  useEffect(() => {
    loadMySites();
    loadAttendanceHistory();
  }, [loadAttendanceHistory, loadMySites]);

  useEffect(() => {
    if (!navigator.geolocation) return undefined;

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
    const loadSite = async () => {
      if (!selectedSiteId) {
        setSelectedSite(null);
        setDistance(null);
        setIsWithin(false);
        setCheckedIn(false);
        return;
      }

      const res = await fetch(apiUrl(`/site/${selectedSiteId}`));
      const site = await res.json();
      setSelectedSite(site);

      const openRecord = attendanceHistory.find(
        (row) => row.siteId === selectedSiteId && !row.checkOutAt
      );
      setCheckedIn(Boolean(openRecord));
    };

    loadSite();
  }, [attendanceHistory, selectedSiteId]);

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

  const doCheckIn = async () => {
    if (!selectedSiteId) {
      setMessage({ text: "Select a site first.", type: "error" });
      return;
    }

    if (!userPos) {
      setMessage({ text: "Please allow location access (GPS).", type: "error" });
      return;
    }

    const res = await fetch(apiUrl("/attendance/check-in"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId: selectedSiteId,
        employeeEmail: currentUser.email,
        employeeName: currentUser.name,
        employeeLat: userPos.lat,
        employeeLng: userPos.lng
      })
    });

    const data = await res.json();
    setMessage({ text: data.msg, type: res.ok ? "success" : "error" });

    if (res.ok) {
      setCheckedIn(true);
      loadAttendanceHistory();
    }
  };

  const doCheckOut = async () => {
    if (!selectedSiteId) {
      setMessage({ text: "Select a site first.", type: "error" });
      return;
    }

    if (!userPos) {
      setMessage({ text: "Please allow location access (GPS).", type: "error" });
      return;
    }

    const res = await fetch(apiUrl("/attendance/check-out"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId: selectedSiteId,
        employeeEmail: currentUser.email,
        employeeLat: userPos.lat,
        employeeLng: userPos.lng
      })
    });

    const data = await res.json();
    setMessage({ text: data.msg, type: res.ok ? "success" : "error" });

    if (res.ok) {
      setCheckedIn(false);
      loadAttendanceHistory();
    }
  };

  const todayRecord = attendanceHistory.find(
    (row) =>
      new Date(row.checkInAt).toDateString() === new Date().toDateString()
  );

  return (
    <div className="employee-section-page">
      <div className="employee-section-layout">
        <EmployeeSidebar />

        <main className="employee-section-main">
          <div className="dashboard-header">
            <h1>Employee Attendance</h1>
            <p className="employee-attendance-subtitle">
              Track your location, check in or out when within range, and review your recent
              attendance history.
            </p>
          </div>

          {message.text && (
            <div className={`app-message app-message-${message.type}`}>
              {message.text}
            </div>
          )}

          <section className="create-site-form">
            <h2>Check In / Check Out</h2>

            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
            >
              <option value="">Select a site</option>
              {mySites.map((site) => (
                <option key={site._id} value={site.siteId}>
                  {site.siteName}
                </option>
              ))}
            </select>

            <div className="employee-attendance-status-grid">
              <div className="employee-attendance-status-card">
                <span>Current location</span>
                <strong>{userPos ? "Location detected" : "Waiting for GPS"}</strong>
              </div>
              <div className="employee-attendance-status-card">
                <span>Radius status</span>
                <strong>{selectedSite ? (isWithin ? "Within radius" : "Outside radius") : "No site selected"}</strong>
              </div>
              <div className="employee-attendance-status-card">
                <span>Attendance state</span>
                <strong>{checkedIn ? "Checked in" : "Not checked in"}</strong>
              </div>
            </div>

            {selectedSite && (
              <>
                <div className="employee-attendance-map-wrap">
                  <SiteLiveMap site={selectedSite} userPos={userPos} size={320} />
                </div>

                <div className="employee-attendance-feedback">
                  <div className="employee-attendance-feedback-row">
                    <span>Distance to site</span>
                    <strong>{distance == null ? "..." : `${Math.round(distance)}m`}</strong>
                  </div>
                  <div className="employee-attendance-feedback-row">
                    <span>Allowed radius</span>
                    <strong>{Number(selectedSite.radiusMeters ?? 100)}m</strong>
                  </div>
                  <div className="employee-attendance-feedback-row">
                    <span>Site</span>
                    <strong>{selectedSite.name}</strong>
                  </div>
                </div>

                <div className="task-actions">
                  <button disabled={!isWithin || checkedIn} onClick={doCheckIn}>
                    Check In
                  </button>
                  <button
                    className="unable-button"
                    disabled={!isWithin}
                    onClick={doCheckOut}
                  >
                    Check Out
                  </button>
                </div>

                {!isWithin && (
                  <p className="employee-attendance-warning">
                    You must be inside the site radius to check in or out.
                  </p>
                )}
              </>
            )}
          </section>

          <section className="create-site-form">
            <h2>Today's Attendance</h2>

            {todayRecord ? (
              <div className="employee-attendance-record-card">
                <div className="employee-attendance-feedback-row">
                  <span>Site</span>
                  <strong>{todayRecord.siteName}</strong>
                </div>
                <div className="employee-attendance-feedback-row">
                  <span>Check In</span>
                  <strong>{formatTime(todayRecord.checkInAt)}</strong>
                </div>
                <div className="employee-attendance-feedback-row">
                  <span>Check Out</span>
                  <strong>{formatTime(todayRecord.checkOutAt)}</strong>
                </div>
              </div>
            ) : (
              <div className="employee-section-card">
                <p className="employee-attendance-empty">No attendance record yet today.</p>
              </div>
            )}
          </section>

          <section className="create-site-form">
            <div className="employee-attendance-history-header">
              <h2>Recent Attendance History</h2>
              <div className="employee-attendance-date-range">
                <input
                  type="date"
                  value={startDate}
                  max={endDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  max={defaultEnd}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {attendanceHistory.length === 0 ? (
              <div className="employee-section-card">
                <p className="employee-attendance-empty">
                  No attendance history found for the selected dates.
                </p>
              </div>
            ) : (
              <div className="employee-attendance-history-grid">
                {attendanceHistory.map((row) => (
                  <article key={row._id} className="employee-attendance-record-card">
                    <div className="employee-attendance-feedback-row">
                      <span>Date</span>
                      <strong>{formatDate(row.checkInAt)}</strong>
                    </div>
                    <div className="employee-attendance-feedback-row">
                      <span>Site</span>
                      <strong>{row.siteName}</strong>
                    </div>
                    <div className="employee-attendance-feedback-row">
                      <span>Check In</span>
                      <strong>{formatTime(row.checkInAt)}</strong>
                    </div>
                    <div className="employee-attendance-feedback-row">
                      <span>Check Out</span>
                      <strong>{formatTime(row.checkOutAt)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
