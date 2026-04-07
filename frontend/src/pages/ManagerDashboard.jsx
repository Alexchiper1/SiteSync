import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/ManagerDashboard.css";
import MapPicker from "../components/MapPicker";
import { apiUrl, profileImageUrl, taskImageUrl } from "../lib/api";

export default function ManagerDashboard() {
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem("user"))
  );
  const navigate = useNavigate();
  const [message, setMessage] = useState({ text: "", type: "info" });
  const [profileName, setProfileName] = useState(
    JSON.parse(localStorage.getItem("user"))?.name || ""
  );
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const uploadInputRef = useRef(null);
  const cameraInputRef = useRef(null);

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
  const [editingSiteId, setEditingSiteId] = useState("");

  const loadSites = useCallback(async () => {
    const res = await fetch(apiUrl(`/sites/${currentUser.email}`));
    setSites(await res.json());
  }, [currentUser.email]);

  const loadAttendance = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await fetch(apiUrl(`/attendance/manager/${currentUser.email}?date=${today}`));
    setAttendance(await res.json());
  }, [currentUser.email]);

  const loadHolidayRequests = useCallback(async () => {
    const res = await fetch(apiUrl(`/holiday-requests/manager/${currentUser.email}`));
    setHolidayRequests(await res.json());
  }, [currentUser.email]);

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
      managerEmail: currentUser.email
    };

    if (!payload.lat || !payload.lng) {
      setMessage({ text: "Please click the map to pick the site location.", type: "error" });
      return;
    }

    const isEditing = Boolean(editingSiteId);
    const res = await fetch(apiUrl(isEditing ? `/sites/${editingSiteId}` : "/sites"), {
      method: isEditing ? "PUT" : "POST",
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
      setEditingSiteId("");

      loadSites();
    }
  };

  const startEditSite = (siteToEdit) => {
    setEditingSiteId(siteToEdit._id);
    setSite({
      name: siteToEdit.name || "",
      location: siteToEdit.location || "",
      joinKey: siteToEdit.joinKey || "",
      radiusMeters: String(siteToEdit.radiusMeters ?? 150),
      coords:
        siteToEdit.lat != null && siteToEdit.lng != null
          ? { lat: siteToEdit.lat, lng: siteToEdit.lng }
          : null
    });

    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const cancelEditSite = () => {
    setEditingSiteId("");
    setSite({
      name: "",
      location: "",
      joinKey: "",
      radiusMeters: "150",
      coords: null
    });
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
        managerEmail: currentUser.email,
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

  const saveProfile = async () => {
    const trimmedName = profileName.trim();
    if (!trimmedName) {
      setMessage({ text: "Name cannot be empty", type: "error" });
      return;
    }

    const formData = new FormData();
    formData.append("email", currentUser.email);
    formData.append("name", trimmedName);

    if (profileImageFile) {
      formData.append("profileImage", profileImageFile);
    }

    const res = await fetch(apiUrl("/users/profile"), {
      method: "PUT",
      body: formData
    });

    const data = await res.json();
    setMessage({ text: data.msg, type: res.ok ? "success" : "error" });

    if (res.ok && data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
      setCurrentUser(data.user);
      setProfileName(data.user.name || "");
      setProfileImageFile(null);
      setIsEditingProfile(false);
      setShowPhotoOptions(false);
    }
  };

  const startEditingProfile = () => {
    setProfileName(currentUser?.name || "");
    setProfileImageFile(null);
    setIsEditingProfile(true);
  };

  const cancelEditingProfile = () => {
    setProfileName(currentUser?.name || "");
    setProfileImageFile(null);
    setIsEditingProfile(false);
    setShowPhotoOptions(false);
  };

  const handleProfileFileChange = (file) => {
    if (!file) return;
    setProfileImageFile(file);
    setShowPhotoOptions(false);
  };

  return (
    <div className="manager-dashboard">
      {deleteSiteId && (
        <div className="manager-modal-overlay" onClick={() => setDeleteSiteId("")}>
          <div
            className="manager-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="manager-modal-badge">Delete Site</span>
            <h3>Delete this site?</h3>
            <p>This will remove the site and its related data from the dashboard.</p>
            <div className="task-actions-row">
              <button
                className="delete-site-btn"
                type="button"
                onClick={() => deleteSite(deleteSiteId)}
              >
                Delete
              </button>
              <button
                className="cancel-action-btn"
                type="button"
                onClick={() => setDeleteSiteId("")}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="profile-sidebar">
        <div className="profile-card">
          <div
            className={`profile-avatar ${isEditingProfile ? "profile-avatar-editable" : ""}`}
            onClick={() => isEditingProfile && setShowPhotoOptions(true)}
            role={isEditingProfile ? "button" : undefined}
            tabIndex={isEditingProfile ? 0 : undefined}
            onKeyDown={(e) => {
              if (isEditingProfile && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                setShowPhotoOptions(true);
              }
            }}
          >
            <img
              src={profileImageUrl(currentUser?.profileImage) || "https://via.placeholder.com/80"}
              alt="Profile"
            />
          </div>
          <h3 className="profile-name">{currentUser?.name || "Manager"}</h3>
          <p className="profile-role">Manager</p>
          <p className="profile-details">{currentUser?.email}</p>
          <p className="profile-company">
            <strong>Company:</strong> {currentUser?.companyName}
          </p>
          <Link to="/manager/profile" className="profile-page-link">
            Open Profile Page
          </Link>
          {!isEditingProfile ? (
            <button
              type="button"
              className="profile-edit-toggle"
              onClick={startEditingProfile}
            >
              Edit Profile
            </button>
          ) : (
            <div className="profile-edit-box">
              <input
                type="text"
                value={profileName}
                placeholder="Update your name"
                onChange={(e) => setProfileName(e.target.value)}
              />
              <p className="profile-edit-hint">
                Tap the profile picture to upload or take a new photo.
              </p>
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*"
                className="hidden-file-input"
                onChange={(e) => handleProfileFileChange(e.target.files?.[0] || null)}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden-file-input"
                onChange={(e) => handleProfileFileChange(e.target.files?.[0] || null)}
              />
              <div className="profile-edit-actions">
                <button type="button" className="profile-save-button" onClick={saveProfile}>
                  Save Changes
                </button>
                <button
                  type="button"
                  className="profile-cancel-button"
                  onClick={cancelEditingProfile}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {showPhotoOptions && (
        <div className="profile-photo-modal" onClick={() => setShowPhotoOptions(false)}>
          <div
            className="profile-photo-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h4>Change profile picture</h4>
            <button type="button" onClick={() => uploadInputRef.current?.click()}>
              Upload Picture
            </button>
            <button type="button" onClick={() => cameraInputRef.current?.click()}>
              Take Picture
            </button>
            <button
              type="button"
              className="profile-cancel-button"
              onClick={() => setShowPhotoOptions(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
          <div className="section-header-row">
            <h2>Today's Check-Ins</h2>
            <button
              type="button"
              className="header-icon-button"
              aria-label="Refresh check-ins"
              title="Refresh check-ins"
              onClick={loadAttendance}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="site-icon-svg">
                <path
                  d="M17.65 6.35A7.95 7.95 0 0012 4V1L7 6l5 5V7a5 5 0 11-4.9 6h-2.02A7 7 0 1017.65 6.35z"
                  fill="currentColor"
                />
              </svg>
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
          <div className="section-header-row">
            <h2>Holiday Requests</h2>
            <button
              type="button"
              className="header-icon-button"
              aria-label="Refresh holiday requests"
              title="Refresh holiday requests"
              onClick={loadHolidayRequests}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="site-icon-svg">
                <path
                  d="M17.65 6.35A7.95 7.95 0 0012 4V1L7 6l5 5V7a5 5 0 11-4.9 6h-2.02A7 7 0 1017.65 6.35z"
                  fill="currentColor"
                />
              </svg>
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
              <button
                className="site-icon-button delete-site-icon"
                type="button"
                aria-label={`Delete ${site.name}`}
                title="Delete site"
                onClick={() =>
                  setDeleteSiteId(deleteSiteId === site._id ? "" : site._id)
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="site-icon-svg"
                >
                  <path
                    d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v8h-2V9zm4 0h2v8h-2V9zM7 9h2v8H7V9zm1 12c-1.1 0-2-.9-2-2V8h12v11c0 1.1-.9 2-2 2H8z"
                    fill="currentColor"
                  />
                </svg>
              </button>

              <strong>{site.name}</strong>
              <p>{site.location}</p>

              <button
                className="edit-site-btn"
                type="button"
                onClick={() => startEditSite(site)}
              >
                Edit Site
              </button>

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
          <div className="section-header-row">
            <h2>{editingSiteId ? "Edit Site" : "Create Site"}</h2>
            {editingSiteId && (
              <button
                type="button"
                className="cancel-action-btn compact-action-btn"
                onClick={cancelEditSite}
              >
                Cancel Edit
              </button>
            )}
          </div>
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
                {editingSiteId ? "Save Changes" : "Create Site"}
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