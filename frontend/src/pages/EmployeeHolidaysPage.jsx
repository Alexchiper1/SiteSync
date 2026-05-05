import { useCallback, useEffect, useState } from "react";
import "../css/EmployeeOverviewPage.css";
import "../css/EmployeeProfilePage.css";
import "../css/EmployeeHolidaysPage.css";
import EmployeeSidebar from "../components/EmployeeSidebar";
import { apiUrl } from "../lib/api";

export default function EmployeeHolidaysPage() {
  const [currentUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [message, setMessage] = useState({ text: "", type: "info" });
  const [mySites, setMySites] = useState([]);
  const [holidayRequests, setHolidayRequests] = useState([]);
  const [holidayForm, setHolidayForm] = useState({
    siteId: "",
    startDate: "",
    endDate: "",
    reason: ""
  });

  const loadMySites = useCallback(async () => {
    const res = await fetch(apiUrl(`/employee-sites/${currentUser.email.trim().toLowerCase()}`));
    setMySites(await res.json());
  }, [currentUser.email]);

  const loadHolidayRequests = useCallback(async () => {
    const res = await fetch(
      apiUrl(`/holiday-requests/employee/${currentUser.email.trim().toLowerCase()}`)
    );
    setHolidayRequests(await res.json());
  }, [currentUser.email]);

  useEffect(() => {
    loadMySites();
    loadHolidayRequests();
  }, [loadHolidayRequests, loadMySites]);

  const submitHolidayRequest = async () => {
    if (!holidayForm.siteId || !holidayForm.startDate || !holidayForm.endDate) {
      setMessage({
        text: "Please fill all holiday dates and select a site.",
        type: "error"
      });
      return;
    }

    const res = await fetch(apiUrl("/holiday-requests"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId: holidayForm.siteId,
        employeeEmail: currentUser.email,
        employeeName: currentUser.name,
        startDate: holidayForm.startDate,
        endDate: holidayForm.endDate,
        reason: holidayForm.reason
      })
    });

    const data = await res.json();
    setMessage({ text: data.msg, type: res.ok ? "success" : "error" });

    if (res.ok) {
      setHolidayForm({
        siteId: "",
        startDate: "",
        endDate: "",
        reason: ""
      });
      loadHolidayRequests();
    }
  };

  return (
    <div className="employee-section-page">
      <div className="employee-section-layout">
        <EmployeeSidebar />

        <main className="employee-section-main">
          <div className="dashboard-header">
            <h1>Employee Holidays</h1>
            <p className="employee-holidays-subtitle">
              Request time off and include a reason if needed.
            </p>
          </div>

          {message.text && (
            <div className={`app-message app-message-${message.type}`}>
              {message.text}
            </div>
          )}

          <section className="create-site-form">
            <h2>Request Holiday</h2>

            <select
              value={holidayForm.siteId}
              onChange={(e) =>
                setHolidayForm((prev) => ({ ...prev, siteId: e.target.value }))
              }
            >
              <option value="">Select a site</option>
              {mySites.map((site) => (
                <option key={site._id} value={site.siteId}>
                  {site.siteName}
                </option>
              ))}
            </select>

            <div className="form-row">
              <input
                type="date"
                value={holidayForm.startDate}
                onChange={(e) =>
                  setHolidayForm((prev) => ({ ...prev, startDate: e.target.value }))
                }
              />
              <input
                type="date"
                value={holidayForm.endDate}
                onChange={(e) =>
                  setHolidayForm((prev) => ({ ...prev, endDate: e.target.value }))
                }
              />
            </div>

            <input
              type="text"
              placeholder="Reason (optional)"
              value={holidayForm.reason}
              onChange={(e) =>
                setHolidayForm((prev) => ({ ...prev, reason: e.target.value }))
              }
            />

            <button type="button" onClick={submitHolidayRequest}>
              Send Holiday Request
            </button>
          </section>

          <section className="create-site-form">
            <div className="employee-holiday-history-header">
              <h2>Holiday Request History</h2>
            </div>

            {holidayRequests.length === 0 ? (
              <div className="employee-section-card">
                <p className="employee-holidays-empty">
                  No holiday requests yet.
                </p>
              </div>
            ) : (
              <div className="holiday-request-list employee-holiday-list">
                {holidayRequests.map((request) => (
                  <div key={request._id} className="task-card holiday-request-card employee-holiday-card">
                    <div className="employee-holiday-card-top">
                      <div>
                        <strong>{request.siteName}</strong>
                        <p className="employee-holiday-date-text">
                          {request.startDate} to {request.endDate}
                        </p>
                      </div>

                      <span className={`status-badge status-${request.status}`}>
                        {request.status === "denied" ? "rejected" : request.status}
                      </span>
                    </div>

                    {request.reason && (
                      <div className="employee-holiday-detail-box">
                        <span>Reason</span>
                        <strong>{request.reason}</strong>
                      </div>
                    )}

                    {request.managerNote && (
                      <div className="employee-holiday-detail-box employee-holiday-note-box">
                        <span>Manager note</span>
                        <strong>{request.managerNote}</strong>
                      </div>
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
