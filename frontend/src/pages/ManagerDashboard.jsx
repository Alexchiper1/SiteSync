import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/ManagerDashboard.css";
import MapPicker from "../components/MapPicker";
import { apiUrl, taskImageUrl } from "../lib/api";

export default function ManagerDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const [message, setMessage] = useState({ text: "", type: "info" });

  const [site, setSite] = useState({
    name: "",
    location: "",
    joinKey: "",
    radiusMeters: "150",
    coords: null
  });
  const [sites, setSites] = useState([]);
  const [taskInputs, setTaskInputs] = useState({});
  const [taskLogs, setTaskLogs] = useState({});
  const [expandedSite, setExpandedSite] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [holidayRequests, setHolidayRequests] = useState([]);
  const [requestNotes, setRequestNotes] = useState({});
  const [deleteSiteId, setDeleteSiteId] = useState("");

  const loadSites = useCallback(async () => {
    const res = await fetch(apiUrl(`/sites/${user.email}`));
    setSites(await res.json());
  }, [user.email]);

  const loadAttendance = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await fetch(apiUrl(`/attendance/manager/${user.email}?date=${today}`));
    setAttendance(await res.json());
  }, [user.email]);

  const loadHolidayRequests = useCallback(async () => {
    const res = await fetch(apiUrl(`/holiday-requests/manager/${user.email}`));
    setHolidayRequests(await res.json());
  }, [user.email]);

  useEffect(() => {
    loadSites();
    loadAttendance();
    loadHolidayRequests();
  }, [loadSites, loadAttendance, loadHolidayRequests]);

  const createSite = async (e) => {
    e.preventDefault();

    const payload = {
      name: site.name,
      location: site.location,
      joinKey: site.joinKey,
      radiusMeters: Number(site.radiusMeters),
      lat: site.coords?.lat,
      lng: site.coords?.lng,
      managerEmail: user.email
    };

    if (!payload.lat || !payload.lng) {
      setMessage({ text: "Please click the map to pick the site location.", type: "error" });
      return;
    }

    const res = await fetch(apiUrl("/sites"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    setMessage({ text: data.msg, type: res.ok ? "success" : "error" });

    if (res.ok) {
      setSite({
        name: "",
        location: "",
        joinKey: "",
        radiusMeters: "150",
        coords: null
      });

      loadSites();
    }
  };

  const deleteSite = async (siteId) => {
    const res = await fetch(apiUrl(`/sites/${siteId}`), {
      method: "DELETE"
    });

    const data = await res.json();
    setMessage({ text: data.msg, type: res.ok ? "success" : "error" });

    if (res.ok) {
      setDeleteSiteId("");
      loadSites();
    }
  };

  const createTask = async (site) => {
    const input = taskInputs[site._id];
    if (!input?.email || !input?.desc) {
      setMessage({ text: "Fill all fields", type: "error" });
      return;
    }

    const res = await fetch(apiUrl("/tasks"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId: site._id,
        siteName: site.name,
        employeeEmail: input.email.trim().toLowerCase(),
        description: input.desc
      })
    });

    if (res.ok) {
      setMessage({ text: "Task assigned", type: "success" });
      setTaskInputs({ ...taskInputs, [site._id]: { email: "", desc: "" } });
      return;
    }

    const data = await res.json();
    setMessage({ text: data.msg || "Error assigning task", type: "error" });
  };

  const loadTaskLog = async (siteId) => {
    if (expandedSite === siteId) {
      setExpandedSite(null);
      return;
    }

    const res = await fetch(apiUrl(`/tasks-site/${siteId}`));
    setTaskLogs({ ...taskLogs, [siteId]: await res.json() });
    setExpandedSite(siteId);
  };

  const updateHolidayRequest = async (requestId, status) => {
    const res = await fetch(apiUrl(`/holiday-requests/${requestId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        managerEmail: user.email,
        managerNote: requestNotes[requestId] || ""
      })
    });

    const data = await res.json();
    setMessage({ text: data.msg, type: res.ok ? "success" : "error" });

    if (res.ok) {
      loadHolidayRequests();
      setRequestNotes({ ...requestNotes, [requestId]: "" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="manager-dashboard">
      <div className="profile-sidebar">
        <div className="profile-card">
          <div className="profile-avatar">
            <img src="https://via.placeholder.com/80" alt="Profile" />
          </div>
          <h3 className="profile-name">{user?.name || "Manager"}</h3>
          <p className="profile-role">Manager</p>
          <p className="profile-details">{user?.email}</p>
          <p className="profile-company">
            <strong>Company:</strong> {user?.companyName}
          </p>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="dashboard-header">
          <h1>Manager Dashboard</h1>
        </div>

        {message.text && (
          <div className={`app-message app-message-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="create-site-form" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0 }}>Today's Check-Ins</h2>
            <button onClick={loadAttendance} style={{ height: 36 }}>
              Refresh
            </button>
          </div>

          <div className="attendance-table">
            <div className="attendance-header">
              <span><strong>Employee</strong></span>
              <span><strong>Site</strong></span>
              <span><strong>Check In</strong></span>
              <span><strong>Check Out</strong></span>
            </div>

            {attendance.length === 0 ? (
              <div className="attendance-row">
                <span>No check-ins yet today.</span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            ) : (
              attendance.map((row) => (
                <div key={row._id} className="attendance-row">
                  <span>{row.employeeName}</span>
                  <span>{row.siteName}</span>
                  <span>
                    {new Date(row.checkInAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                  <span>
                    {row.checkOutAt
                      ? new Date(row.checkOutAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : "—"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="create-site-form" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0 }}>Holiday Requests</h2>
            <button onClick={loadHolidayRequests} style={{ height: 36 }}>
              Refresh
            </button>
          </div>

          {holidayRequests.length === 0 ? (
            <p>No holiday requests yet.</p>
          ) : (
            <div className="task-log">
              {holidayRequests.map((request) => (
                <div key={request._id} className="task-item">
                  <strong>{request.employeeName || request.employeeEmail}</strong>
                  <span className={`status-badge status-${request.status}`}>
                    {request.status}
                  </span>

                  <p>
                    <strong>Email:</strong> {request.employeeEmail}
                  </p>
                  <p>
                    <strong>Site:</strong> {request.siteName}
                  </p>
                  <p>
                    <strong>Dates:</strong> {request.startDate} to {request.endDate}
                  </p>

                  {request.reason && (
                    <p>
                      <strong>Reason:</strong> {request.reason}
                    </p>
                  )}

                  {request.managerNote && (
                    <p>
                      <strong>Manager note:</strong> {request.managerNote}
                    </p>
                  )}

                  {request.status === "pending" && (
                    <>
                      <input
                        type="text"
                        placeholder="Optional note"
                        value={requestNotes[request._id] || ""}
                        onChange={(e) =>
                          setRequestNotes({
                            ...requestNotes,
                            [request._id]: e.target.value
                          })
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
                          Deny
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <h2>My Sites</h2>

        {sites.length === 0 ? (
          <p>No sites created yet.</p>
        ) : (
          sites.map((site) => (
            <div key={site._id} className="site-card">
              <strong>{site.name}</strong>
              <p>{site.location}</p>

              <button
                className="delete-site-btn"
                onClick={() =>
                  setDeleteSiteId(deleteSiteId === site._id ? "" : site._id)
                }
              >
                Delete Site
              </button>

              {deleteSiteId === site._id && (
                <div className="inline-confirm-box">
                  <p>Delete this site?</p>
                  <div className="task-actions-row">
                    <button onClick={() => deleteSite(site._id)}>Yes, delete</button>
                    <button
                      className="cancel-action-btn"
                      onClick={() => setDeleteSiteId("")}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="task-section">
                <h4>Assign Task</h4>
                <div className="task-inputs">
                  <input
                    placeholder="Employee email"
                    value={taskInputs[site._id]?.email || ""}
                    onChange={(e) =>
                      setTaskInputs({
                        ...taskInputs,
                        [site._id]: {
                          ...taskInputs[site._id],
                          email: e.target.value
                        }
                      })
                    }
                  />
                  <input
                    placeholder="Task description"
                    value={taskInputs[site._id]?.desc || ""}
                    onChange={(e) =>
                      setTaskInputs({
                        ...taskInputs,
                        [site._id]: {
                          ...taskInputs[site._id],
                          desc: e.target.value
                        }
                      })
                    }
                  />
                  <button onClick={() => createTask(site)}>Add Task</button>
                </div>

                <button onClick={() => loadTaskLog(site._id)}>
                  {expandedSite === site._id ? "Hide Task Log" : "View Task Log"}
                </button>

                {expandedSite === site._id && taskLogs[site._id] && (
                  <div className="task-log">
                    {taskLogs[site._id].map((task) => (
                      <div key={task._id} className="task-item">
                        <strong>{task.employeeEmail}</strong>
                        <span className={`status-badge status-${task.status}`}>
                          {task.status}
                        </span>
                        <p>{task.description}</p>

                        {task.image && (
                          <div>
                            <img src={taskImageUrl(task.image)} alt="proof" />
                          </div>
                        )}

                        {task.employeeMessage && (
                          <p>
                            <strong>Message:</strong> {task.employeeMessage}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        <div className="create-site-form">
          <h2>Create Site</h2>
          <form onSubmit={createSite} className="create-site-grid">
            <div className="create-site-left">
              <input
                placeholder="Site name"
                value={site.name}
                onChange={(e) => setSite({ ...site, name: e.target.value })}
              />
              <input
                placeholder="Address / Location name"
                value={site.location}
                onChange={(e) => setSite({ ...site, location: e.target.value })}
              />
              <input
                placeholder="Radius meters (e.g. 150)"
                value={site.radiusMeters}
                onChange={(e) => setSite({ ...site, radiusMeters: e.target.value })}
              />
              <div className="coords-pill">
                {site.coords ? (
                  <>
                    <span>Selected:</span>
                    <strong>
                      {site.coords.lat.toFixed(6)}, {site.coords.lng.toFixed(6)}
                    </strong>
                  </>
                ) : (
                  <span>Click the map to set the exact site location</span>
                )}
              </div>
              <input
                placeholder="Join Key"
                value={site.joinKey}
                onChange={(e) => setSite({ ...site, joinKey: e.target.value })}
              />
              <button className="create-site-btn" type="submit">
                Create Site
              </button>
            </div>

            <div className="create-site-right">
              <MapPicker
                value={site.coords}
                onChange={(coords) => setSite({ ...site, coords })}
                size={320}
                defaultZoom={14}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}