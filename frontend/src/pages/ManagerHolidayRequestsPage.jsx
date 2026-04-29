import { useCallback, useEffect, useMemo, useState } from "react";
import "../css/ManagerOverviewPage.css";
import "../css/ManagerProfilePage.css";
import "../css/ManagerHolidayRequestsPage.css";
import ManagerSidebar from "../components/ManagerSidebar";
import { apiUrl } from "../lib/api";

const REQUESTS_PER_PAGE = 8;
const STATUS_ALL = "all";
const STATUS_PENDING = "pending";
const STATUS_APPROVED = "approved";
const STATUS_DENIED = "denied";

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
  // Logged-in manager used for manager-scoped API requests.
  const [currentUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [holidayRequests, setHolidayRequests] = useState([]);
  const [requestNotes, setRequestNotes] = useState({});
  const [message, setMessage] = useState({ text: "", type: "info" });
  const [statusFilter, setStatusFilter] = useState(STATUS_ALL);
  const [currentPage, setCurrentPage] = useState(1);

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
    // Keep all rows when no status filter is selected.
    if (statusFilter === STATUS_ALL) {
      return holidayRequests;
    }

    return holidayRequests.filter((request) => request.status === statusFilter);
  }, [holidayRequests, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / REQUESTS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRequests = useMemo(() => {
    // Render only the current page slice to keep the list manageable.
    const start = (currentPage - 1) * REQUESTS_PER_PAGE;
    return filteredRequests.slice(start, start + REQUESTS_PER_PAGE);
  }, [currentPage, filteredRequests]);

  const counts = useMemo(() => {
    // Compute status totals for the summary cards.
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

  const handleRequestNoteChange = (requestId, value) => {
    setRequestNotes((prev) => ({
      ...prev,
      [requestId]: value
    }));
  };

  const startItem = (currentPage - 1) * REQUESTS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * REQUESTS_PER_PAGE, filteredRequests.length);

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
                  <option value={STATUS_ALL}>All requests</option>
                  <option value={STATUS_PENDING}>Pending</option>
                  <option value={STATUS_APPROVED}>Approved</option>
                  <option value={STATUS_DENIED}>Rejected</option>
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
                {paginatedRequests.map((request) => (
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

                    {request.status === STATUS_PENDING && (
                      <>
                        <input
                          type="text"
                          placeholder="Optional note"
                          value={requestNotes[request._id] || ""}
                          onChange={(e) => handleRequestNoteChange(request._id, e.target.value)}
                        />

                        <div className="task-actions-row">
                          <button onClick={() => updateHolidayRequest(request._id, STATUS_APPROVED)}>
                            Approve
                          </button>
                          <button
                            className="delete-site-btn"
                            onClick={() => updateHolidayRequest(request._id, STATUS_DENIED)}
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

            {filteredRequests.length > 0 && (
              <div className="manager-holiday-pagination">
                <span className="manager-holiday-pagination-info">
                  Showing {startItem}-{endItem} of {filteredRequests.length}
                </span>
                <div className="manager-holiday-pagination-controls">
                  <button
                    type="button"
                    className="cancel-action-btn compact-action-btn"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span className="manager-holiday-pagination-page">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="compact-action-btn"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
