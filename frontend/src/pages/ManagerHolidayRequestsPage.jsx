import { useCallback, useEffect, useMemo, useState } from "react";
import "../css/ManagerDashboard.css";
import "../css/ManagerProfilePage.css";
import "../css/ManagerHolidayRequestsPage.css";
import ManagerSidebar from "../components/ManagerSidebar";
import { apiUrl } from "../lib/api";

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

export default function ManagerHolidayRequestsPage() {
  const [currentUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [holidayRequests, setHolidayRequests] = useState([]);
  const [requestNotes, setRequestNotes] = useState({});
  const [message, setMessage] = useState({ text: "", type: "info" });
  const [statusFilter, setStatusFilter] = useState("all");

  const loadHolidayRequests = useCallback(async () => {
    const res = await fetch(apiUrl(`/holiday-requests/manager/${currentUser.email}`));
    const data = await res.json();

    if (!res.ok) {
      setMessage({ text: data.msg || "Could not load holiday requests", type: "error" });
      return;
    }

    setHolidayRequests(data);
  }, [currentUser.email]);

  useEffect(() => {
    loadHolidayRequests();
  }, [loadHolidayRequests]);

  const filteredRequests = useMemo(() => {
    if (statusFilter === "all") {
      return holidayRequests;
    }

    return holidayRequests.filter((request) => request.status === statusFilter);
  }, [holidayRequests, statusFilter]);

  const counts = useMemo(() => {
    return holidayRequests.reduce(
      (acc, request) => {
        acc.total += 1;
        acc[request.status] = (acc[request.status] || 0) + 1;
        return acc;
      },
      { total: 0, pending: 0, approved: 0, denied: 0 }
    );
  }, [holidayRequests]);

  const updateHolidayRequest = async (requestId, status) => {
    const res = await fetch(apiUrl(`/holiday-requests/${requestId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        managerEmail: currentUser.email,
        managerNote: requestNotes[requestId] || ""
      })
    });

    const data = await res.json();
    setMessage({ text: data.msg, type: res.ok ? "success" : "error" });

    if (res.ok) {
      loadHolidayRequests();
      setRequestNotes((prev) => ({ ...prev, [requestId]: "" }));
    }
  };

  return (
    <div className="manager-section-page">
      <div className="manager-section-layout">
        <ManagerSidebar />

        <main className="manager-section-main">
          <div className="dashboard-header manager-holiday-header">
            <div>
              <h1>Manager Holiday Requests</h1>
              <p className="manager-holiday-subtitle">
                Review leave requests, check dates and reasons, and approve or reject with an
                optional note.
              </p>
            </div>
            <button
              type="button"
              className="header-icon-button"
              aria-label="Refresh holiday requests"
              title="Refresh holiday requests"
              onClick={loadHolidayRequests}
            >
              <RefreshIcon />
            </button>
          </div>

          {message.text && (
            <div className={`app-message app-message-${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="manager-holiday-stats">
            <div className="manager-holiday-stat-card">
              <span>Total</span>
              <strong>{counts.total}</strong>
            </div>
            <div className="manager-holiday-stat-card">
              <span>Pending</span>
              <strong>{counts.pending}</strong>
            </div>
            <div className="manager-holiday-stat-card">
              <span>Approved</span>
              <strong>{counts.approved}</strong>
            </div>
            <div className="manager-holiday-stat-card">
              <span>Rejected</span>
              <strong>{counts.denied}</strong>
            </div>
          </div>

          <section className="create-site-form">
            <div className="section-header-row">
              <h2>Holiday Request List</h2>
              <div className="manager-holiday-filter-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="manager-holiday-filter"
                >
                  <option value="all">All requests</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="denied">Rejected</option>
                </select>
                <button
                  type="button"
                  className="header-icon-button"
                  aria-label="Refresh filtered requests"
                  title="Refresh filtered requests"
                  onClick={loadHolidayRequests}
                >
                  <RefreshIcon />
                </button>
              </div>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="manager-section-card">
                <p className="manager-holiday-empty">
                  No holiday requests match the selected filter.
                </p>
              </div>
            ) : (
              <div className="task-log manager-holiday-log">
                {filteredRequests.map((request) => (
                  <div key={request._id} className="task-item manager-holiday-card">
                    <div className="manager-holiday-card-top">
                      <div>
                        <strong>{request.employeeName || request.employeeEmail}</strong>
                        <p className="manager-holiday-email">{request.employeeEmail}</p>
                      </div>
                      <span className={`status-badge status-${request.status}`}>
                        {request.status}
                      </span>
                    </div>

                    <div className="manager-holiday-meta">
                      <div className="manager-holiday-meta-row">
                        <span>Site</span>
                        <strong>{request.siteName}</strong>
                      </div>
                      <div className="manager-holiday-meta-row">
                        <span>Dates</span>
                        <strong>
                          {request.startDate} to {request.endDate}
                        </strong>
                      </div>
                    </div>

                    {request.reason && (
                      <div className="manager-holiday-detail">
                        <span>Reason</span>
                        <strong>{request.reason}</strong>
                      </div>
                    )}

                    {request.managerNote && (
                      <div className="manager-holiday-detail manager-holiday-note">
                        <span>Manager note</span>
                        <strong>{request.managerNote}</strong>
                      </div>
                    )}

                    {request.status === "pending" && (
                      <>
                        <input
                          type="text"
                          placeholder="Optional note"
                          value={requestNotes[request._id] || ""}
                          onChange={(e) =>
                            setRequestNotes((prev) => ({
                              ...prev,
                              [request._id]: e.target.value
                            }))
                          }
                        />

                        <div className="task-actions-row">
                          <button onClick={() => updateHolidayRequest(request._id, "approved")}>
                            Approve
                          </button>
                          <button
                            className="delete-site-btn"
                            onClick={() => updateHolidayRequest(request._id, "denied")}
                          >
                            Reject
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
