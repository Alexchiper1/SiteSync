import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/EmployeeDashboard.css";
import { apiUrl, profileFallbackUrl, profileImageUrl } from "../lib/api";
import SiteLiveMap from "../components/SiteLiveMap";
import { haversineMeters } from "../utils/distance";
import EmployeeSidebar from "../components/EmployeeSidebar";

export default function EmployeeDashboard() {
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

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [joinKeys, setJoinKeys] = useState({});
  const [mySites, setMySites] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [photos, setPhotos] = useState({});
  const [unableInputs, setUnableInputs] = useState({});
  const [holidayRequests, setHolidayRequests] = useState([]);
  const [holidayForm, setHolidayForm] = useState({
    siteId: "",
    startDate: "",
    endDate: "",
    reason: ""
  });

  // attendance states
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [selectedSite, setSelectedSite] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [distance, setDistance] = useState(null);
  const [isWithin, setIsWithin] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);

  const loadMySites = useCallback(async () => {
    const res = await fetch(
      apiUrl(`/employee-sites/${currentUser.email.trim().toLowerCase()}`)
    );
    setMySites(await res.json());
  }, [currentUser.email]);

  const loadTasks = useCallback(async () => {
    const res = await fetch(
      apiUrl(`/tasks/${currentUser.email.trim().toLowerCase()}`)
    );
    setTasks(await res.json());
  }, [currentUser.email]);

  const loadHolidayRequests = useCallback(async () => {
    const res = await fetch(
      apiUrl(`/holiday-requests/employee/${currentUser.email.trim().toLowerCase()}`)
    );
    setHolidayRequests(await res.json());
  }, [currentUser.email]);

  useEffect(() => {
    loadMySites();
    loadTasks();
    loadHolidayRequests();
  }, [loadMySites, loadTasks, loadHolidayRequests]);

  // GPS live location
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      (err) => {
        console.warn(err);
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // load selected site details
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
      setCheckedIn(false);
    };

    loadSite();
  }, [selectedSiteId]);

  // compute distance to site
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

  // search sites
  const searchSites = async () => {
    if (!query.trim()) return;

    const res = await fetch(apiUrl(`/sites-search/${query}`));
    setResults(await res.json());
  };

  // join site
  const joinSite = async (siteId) => {
    const res = await fetch(apiUrl("/join-site"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId,
        joinKey: joinKeys[siteId],
        employeeEmail: currentUser.email.trim().toLowerCase()
      })
    });

    const data = await res.json();
    setMessage({ text: data.msg, type: res.ok ? "danger" : "error" });

    if (data.msg === "Joined site successfully") {
      loadMySites();
      loadTasks();
    }
  };

  // CHECK IN
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
    }
  };

  // CHECK OUT
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
    }
  };

  // COMPLETE TASK
  const completeTask = async (taskId) => {
    if (!photos[taskId]) {
      setMessage({
        text: "You must upload a photo before completing the task.",
        type: "error"
      });
      return;
    }

    const formData = new FormData();
    formData.append("photo", photos[taskId]);

    const res = await fetch(apiUrl(`/tasks-complete/${taskId}`), {
      method: "PUT",
      body: formData
    });

    if (res.ok) {
      setMessage({ text: "Task completed successfully", type: "success" });
      loadTasks();
      return;
    }

    const data = await res.json();
    setMessage({ text: data.msg || "Error completing task", type: "error" });
  };

  // UNABLE TASK
  const unableTask = async (taskId) => {
    const reason = unableInputs[taskId]?.trim();
    if (!reason) return;

    const res = await fetch(apiUrl(`/tasks/${taskId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "unable",
        employeeMessage: reason
      })
    });

    if (res.ok) {
      setMessage({ text: "Reason sent to manager", type: "success" });
      setUnableInputs({ ...unableInputs, [taskId]: "" });
      loadTasks();
      return;
    }

    const data = await res.json();
    setMessage({ text: data.msg || "Error updating task", type: "error" });
  };

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

  // group tasks by site
  const tasksBySite = {};
  tasks.forEach((task) => {
    if (!tasksBySite[task.siteId]) {
      tasksBySite[task.siteId] = [];
    }
    tasksBySite[task.siteId].push(task);
  });

  return (
    <div className="employee-dashboard">
      <EmployeeSidebar />

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
              src={
                profileImageUrl(currentUser?.profileImage) ||
                profileFallbackUrl(currentUser?.name)
              }
              alt="Profile"
            />
          </div>
          <h3 className="profile-name">{currentUser?.name || "Employee"}</h3>
          <p className="profile-role">Construction Worker</p>
          <p className="profile-details">{currentUser?.email}</p>
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
          <h1>Hello {currentUser?.name?.split(" ")[0] || "Employee"}!</h1>
        </div>

        {message.text && (
          <div className={`app-message app-message-${message.type}`}>
            {message.text}
          </div>
        )}

        <h2>Your Tasks</h2>
        {tasks.length === 0 ? (
          <p>No tasks assigned yet.</p>
        ) : (
          Object.keys(tasksBySite).map((siteId) => (
            <div key={siteId} className="tasks-section">
              <h3 className="site-tasks-header">
                {tasksBySite[siteId][0]?.siteName || "Site Tasks"}
              </h3>

              {tasksBySite[siteId].map((task) => (
                <div key={task._id} className="task-card">
                  <p>
                    <strong>Task:</strong> {task.description}
                  </p>

                  <p>
                    Status:{" "}
                    <span className={`status-badge status-${task.status}`}>
                      {task.status}
                    </span>
                  </p>

                  {task.status === "assigned" && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setPhotos({
                            ...photos,
                            [task._id]: e.target.files[0]
                          })
                        }
                      />

                      <div className="task-actions">
                        <button onClick={() => completeTask(task._id)}>
                          Complete
                        </button>

                        <button
                          className="unable-button"
                          onClick={() => unableTask(task._id)}
                        >
                          Unable
                        </button>
                      </div>

                      <div className="inline-action-box">
                        <input
                          type="text"
                          placeholder="Why are you unable to complete this task?"
                          value={unableInputs[task._id] || ""}
                          onChange={(e) =>
                            setUnableInputs({
                              ...unableInputs,
                              [task._id]: e.target.value
                            })
                          }
                        />
                        <button onClick={() => unableTask(task._id)}>
                          Send Reason
                        </button>
                      </div>
                    </>
                  )}

                  {task.status === "unable" && (
                    <p>
                      <strong>Reason sent:</strong> {task.employeeMessage}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ))
        )}

        <h2>My Sites</h2>
        <div className="my-sites-list">
          {mySites.length === 0 ? (
            <p>You haven't joined any sites yet.</p>
          ) : (
            mySites.map((site) => (
              <div key={site._id} className="site-item">
                <strong>{site.siteName}</strong>
              </div>
            ))
          )}
        </div>

        <div className="create-site-form" style={{ marginTop: 20 }}>
          <h2>Check In / Check Out</h2>

          <div className="form-row">
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="">Select a site</option>
              {mySites.map((s) => (
                <option key={s._id} value={s.siteId}>
                  {s.siteName}
                </option>
              ))}
            </select>
          </div>

          {selectedSite && (
            <>
              <div style={{ marginTop: 12 }}>
                <SiteLiveMap site={selectedSite} userPos={userPos} size={320} />
              </div>

              <p style={{ marginTop: 10 }}>
                Distance to site:{" "}
                <strong>
                  {distance == null ? "..." : `${Math.round(distance)}m`}
                </strong>{" "}
                | Allowed radius:{" "}
                <strong>{Number(selectedSite.radiusMeters ?? 100)}m</strong>
              </p>

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
                <p style={{ color: "tomato" }}>
                  You must be inside the radius to check in/out.
                </p>
              )}
            </>
          )}
        </div>

        <div className="create-site-form">
          <h2>Request Holiday</h2>

          <select
            value={holidayForm.siteId}
            onChange={(e) =>
              setHolidayForm({ ...holidayForm, siteId: e.target.value })
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
                setHolidayForm({ ...holidayForm, startDate: e.target.value })
              }
            />
            <input
              type="date"
              value={holidayForm.endDate}
              onChange={(e) =>
                setHolidayForm({ ...holidayForm, endDate: e.target.value })
              }
            />
          </div>

          <input
            type="text"
            placeholder="Reason (optional)"
            value={holidayForm.reason}
            onChange={(e) =>
              setHolidayForm({ ...holidayForm, reason: e.target.value })
            }
          />

          <button onClick={submitHolidayRequest}>Send Holiday Request</button>
        </div>

        <h2>My Holiday Requests</h2>
        {holidayRequests.length === 0 ? (
          <p>No holiday requests yet.</p>
        ) : (
          <div className="holiday-request-list">
            {holidayRequests.map((request) => (
              <div key={request._id} className="task-card holiday-request-card">
                <p>
                  <strong>Site:</strong> {request.siteName}
                </p>
                <p>
                  <strong>Dates:</strong> {request.startDate} to {request.endDate}
                </p>
                <p>
                  <strong>Status:</strong>
                  <span className={`status-badge status-${request.status}`}>
                    {request.status}
                  </span>
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
              </div>
            ))}
          </div>
        )}

        <div className="create-site-form">
          <h2>Join a New Site</h2>

          <div className="form-row">
            <input
              placeholder="Search site"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button onClick={searchSites}>Search</button>
          </div>
        </div>

        <div className="search-results">
          {results.map((site) => (
            <div key={site._id} className="search-result-item">
              <strong>{site.name}</strong>
              <p>Location: {site.location}</p>

              <div className="join-input-group">
                <input
                  placeholder="Join Key"
                  value={joinKeys[site._id] || ""}
                  onChange={(e) =>
                    setJoinKeys({
                      ...joinKeys,
                      [site._id]: e.target.value
                    })
                  }
                />
                <button onClick={() => joinSite(site._id)}>Join</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}