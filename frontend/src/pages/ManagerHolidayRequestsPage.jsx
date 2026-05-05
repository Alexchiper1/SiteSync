import { useCallback, useEffect, useState } from "react";
import "../css/ManagerOverviewPage.css";
import "../css/ManagerProfilePage.css";
import "../css/ManagerHolidayRequestsPage.css";
import ManagerSidebar from "../components/ManagerSidebar";
import { apiUrl } from "../lib/api";

const STATUS_PENDING = "pending";
const STATUS_APPROVED = "approved";
const STATUS_DENIED = "denied";

export default function ManagerHolidayRequestsPage() {
  // Logged-in manager used for manager-scoped API requests.
  const [currentUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [holidayRequests, setHolidayRequests] = useState([]);
  const [requestNotes, setRequestNotes] = useState({});
  const [message, setMessage] = useState({ text: "", type: "info" });

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
          </div>

          {message.text && (
            <div className={`app-message app-message-${message.type}`}>
              {message.text}
            </div>
          )}

          <section className="create-site-form">
            <div className="section-header-row">
              <h2>Holiday Request List</h2>
            </div>

            {holidayRequests.length === 0 ? (
              <div className="manager-section-card">
                <p className="manager-holiday-empty">
                  No holiday requests found.
                </p>
              </div>
            ) : (
              <div className="task-log manager-holiday-log">
                {holidayRequests.map((request) => (
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
          </section>
        </main>
      </div>
    </div>
  );
}
