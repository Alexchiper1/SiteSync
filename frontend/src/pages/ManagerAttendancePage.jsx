import { useCallback, useEffect, useMemo, useState } from "react";
import "../css/ManagerOverviewPage.css";
import "../css/ManagerProfilePage.css";
import "../css/ManagerAttendancePage.css";
import ManagerSidebar from "../components/ManagerSidebar";
import { apiUrl } from "../lib/api";

function toDateInputValue(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function formatDayLabel(value) {
  return new Date(value).toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
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

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="site-icon-svg">
      <path
        d="M17.65 6.35A7.95 7.95 0 0012 4V1L7 6l5 5V7a5 5 0 11-4.9 6h-2.02A7 7 0 1017.65 6.35z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function ManagerAttendancePage() {
  const [currentUser] = useState(JSON.parse(localStorage.getItem("user")));
  const today = useMemo(() => new Date(), []);
  const defaultStart = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return toDateInputValue(date);
  }, []);
  const defaultEnd = useMemo(() => toDateInputValue(today), [today]);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [attendance, setAttendance] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "info" });

  const loadAttendance = useCallback(async () => {
    const params = new URLSearchParams({
      startDate,
      endDate
    });

    const res = await fetch(
      apiUrl(`/attendance/manager-history/${currentUser.email}?${params.toString()}`)
    );
    const data = await res.json();

    if (!res.ok) {
      setMessage({ text: data.msg || "Could not load attendance", type: "error" });
      return;
    }

    setAttendance(data);
  }, [currentUser.email, endDate, startDate]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const groupedAttendance = useMemo(() => {
    const groups = new Map();

    attendance.forEach((row) => {
      const key = new Date(row.checkInAt).toISOString().slice(0, 10);
      const existing = groups.get(key) || [];
      existing.push(row);
      groups.set(key, existing);
    });

    return Array.from(groups.entries()).map(([date, rows]) => ({
      date,
      rows
    }));
  }, [attendance]);

  const totals = useMemo(() => {
    return attendance.reduce(
      (acc, row) => {
        acc.records += 1;
        if (row.checkOutAt) {
          acc.checkedOut += 1;
        } else {
          acc.checkedIn += 1;
        }
        return acc;
      },
      { records: 0, checkedIn: 0, checkedOut: 0 }
    );
  }, [attendance]);

  return (
    <div className="manager-section-page">
      <div className="manager-section-layout">
        <ManagerSidebar />

        <main className="manager-section-main">
          <div className="dashboard-header manager-attendance-header">
            <div>
              <h1>Manager Attendance</h1>
              <p className="manager-attendance-subtitle">
                View check-ins and check-outs across previous days, grouped by date and optimized
                for mobile.
              </p>
            </div>
            <button
              type="button"
              className="header-icon-button"
              aria-label="Refresh attendance"
              title="Refresh attendance"
              onClick={loadAttendance}
            >
              <RefreshIcon />
            </button>
          </div>

          {message.text && (
            <div className={`app-message app-message-${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="manager-attendance-stats">
            <div className="manager-attendance-stat-card">
              <span>Total Records</span>
              <strong>{totals.records}</strong>
            </div>
            <div className="manager-attendance-stat-card">
              <span>Open Check-Ins</span>
              <strong>{totals.checkedIn}</strong>
            </div>
            <div className="manager-attendance-stat-card">
              <span>Checked Out</span>
              <strong>{totals.checkedOut}</strong>
            </div>
          </div>

          <section className="create-site-form">
            <div className="section-header-row">
              <h2>Filter Attendance</h2>
              <button
                type="button"
                className="header-icon-button"
                aria-label="Refresh filtered attendance"
                title="Refresh filtered attendance"
                onClick={loadAttendance}
              >
                <RefreshIcon />
              </button>
            </div>

            <div className="manager-attendance-filters">
              <div className="manager-attendance-filter-field">
                <label htmlFor="attendance-start-date">Start date</label>
                <input
                  id="attendance-start-date"
                  type="date"
                  value={startDate}
                  max={endDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="manager-attendance-filter-field">
                <label htmlFor="attendance-end-date">End date</label>
                <input
                  id="attendance-end-date"
                  type="date"
                  value={endDate}
                  min={startDate}
                  max={defaultEnd}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="compact-action-btn"
                onClick={() => {
                  setStartDate(defaultStart);
                  setEndDate(defaultEnd);
                }}
              >
                Last 7 Days
              </button>
            </div>
          </section>

          {groupedAttendance.length === 0 ? (
            <div className="manager-section-card">
              <p className="manager-attendance-empty">
                No attendance records found for the selected dates.
              </p>
            </div>
          ) : (
            groupedAttendance.map((group) => (
              <section key={group.date} className="create-site-form">
                <div className="section-header-row">
                  <h2>{formatDayLabel(group.date)}</h2>
                  <span className="manager-attendance-date-count">
                    {group.rows.length} {group.rows.length === 1 ? "record" : "records"}
                  </span>
                </div>

                <div className="attendance-table manager-attendance-table">
                  <div className="attendance-header">
                    <span><strong>Employee</strong></span>
                    <span><strong>Site</strong></span>
                    <span><strong>Check In</strong></span>
                    <span><strong>Check Out</strong></span>
                  </div>

                  {group.rows.map((row) => (
                    <div key={row._id} className="attendance-row">
                      <span>{row.employeeName || row.employeeEmail}</span>
                      <span>{row.siteName}</span>
                      <span>{formatTime(row.checkInAt)}</span>
                      <span>{formatTime(row.checkOutAt)}</span>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </main>
      </div>
    </div>
  );
}
