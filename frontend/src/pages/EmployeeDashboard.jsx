import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/EmployeeDashboard.css";
import { apiUrl } from "../lib/api";
import SiteLiveMap from "../components/SiteLiveMap";
import { haversineMeters } from "../utils/distance";

export default function EmployeeDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [joinKeys, setJoinKeys] = useState({});
  const [mySites, setMySites] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [photos, setPhotos] = useState({});

  // attendance states
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [selectedSite, setSelectedSite] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [distance, setDistance] = useState(null);
  const [isWithin, setIsWithin] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);

  const loadMySites = useCallback(async () => {
    const res = await fetch(
      apiUrl(`/employee-sites/${user.email.trim().toLowerCase()}`)
    );
    setMySites(await res.json());
  }, [user.email]);

  const loadTasks = useCallback(async () => {
    const res = await fetch(
      apiUrl(`/tasks/${user.email.trim().toLowerCase()}`)
    );
    setTasks(await res.json());
  }, [user.email]);

  useEffect(() => {
    loadMySites();
    loadTasks();
  }, [loadMySites, loadTasks]);

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
        employeeEmail: user.email.trim().toLowerCase()
      })
    });

    const data = await res.json();
    alert(data.msg);

    if (data.msg === "Joined site successfully") {
      loadMySites();
      loadTasks();
    }
  };

  // CHECK IN
  const doCheckIn = async () => {
    if (!selectedSiteId) {
      alert("Select a site first.");
      return;
    }

    if (!userPos) {
      alert("Please allow location access (GPS).");
      return;
    }

    const res = await fetch(apiUrl("/attendance/check-in"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId: selectedSiteId,
        employeeEmail: user.email,
        employeeName: user.name,
        employeeLat: userPos.lat,
        employeeLng: userPos.lng
      })
    });

    const data = await res.json();
    alert(data.msg);

    if (res.ok) {
      setCheckedIn(true);
    }
  };

  // CHECK OUT
  const doCheckOut = async () => {
    if (!selectedSiteId) {
      alert("Select a site first.");
      return;
    }

    if (!userPos) {
      alert("Please allow location access (GPS).");
      return;
    }

    const res = await fetch(apiUrl("/attendance/check-out"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId: selectedSiteId,
        employeeEmail: user.email,
        employeeLat: userPos.lat,
        employeeLng: userPos.lng
      })
    });

    const data = await res.json();
    alert(data.msg);

    if (res.ok) {
      setCheckedIn(false);
    }
  };

  // COMPLETE TASK
  const completeTask = async (taskId) => {
    if (!photos[taskId]) {
      alert("You must upload a photo before completing the task.");
      return;
    }

    const formData = new FormData();
    formData.append("photo", photos[taskId]);

    await fetch(apiUrl(`/tasks-complete/${taskId}`), {
      method: "PUT",
      body: formData
    });

    alert("Task completed successfully");
    loadTasks();
  };

  // UNABLE TASK
  const unableTask = async (taskId) => {
    const reason = prompt("Why are you unable to complete this task?");
    if (!reason) return;

    await fetch(apiUrl(`/tasks/${taskId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "unable",
        employeeMessage: reason
      })
    });

    loadTasks();
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
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
      <div className="profile-sidebar">
        <div className="profile-card">
          <div className="profile-avatar">
            <img src="" alt="Profile" />
          </div>
          <h3 className="profile-name">{user?.name || "Employee"}</h3>
          <p className="profile-role">Construction Worker</p>
          <p className="profile-details">{user?.email}</p>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="dashboard-header">
          <h1>Hello {user?.name?.split(" ")[0] || "Employee"}!</h1>
        </div>

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
                <SiteLiveMap site={selectedSite} userPos={userPos} height={280} />
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