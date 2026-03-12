import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/ManagerDashboard.css";
import MapPicker from "../components/MapPicker";

export default function ManagerDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

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

  const loadSites = async () => {
    const res = await fetch(`http://localhost:5000/sites/${user.email}`);
    setSites(await res.json());
  };

  useEffect(() => {
    loadSites();
  }, []);

  // CREATE SITE
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
      alert("Please click the map to pick the site location.");
      return;
    }

    const res = await fetch("http://localhost:5000/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    alert(data.msg);

    setSite({
      name: "",
      location: "",
      joinKey: "",
      radiusMeters: "150",
      coords: null
    });

    loadSites();
  };

  const deleteSite = async (siteId) => {
  const confirmDelete = window.confirm("Delete this site?");
  if (!confirmDelete) return;

  const res = await fetch(`http://localhost:5000/sites/${siteId}`, {
    method: "DELETE"
  });

  const data = await res.json();
  alert(data.msg);

  loadSites();
  };
  // assign tasks 
  const createTask = async (site) => {
    const input = taskInputs[site._id];
    if (!input?.email || !input?.desc) return alert("Fill all fields");

    await fetch("http://localhost:5000/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId: site._id,
        siteName: site.name,
        employeeEmail: input.email.trim().toLowerCase(),
        description: input.desc
      })
    });

    alert("Task assigned");
    setTaskInputs({ ...taskInputs, [site._id]: { email: "", desc: "" } });
  };

  //loads the task log
  const loadTaskLog = async (siteId) => {
    if (expandedSite === siteId) {
      setExpandedSite(null);
      return;
    }

    const res = await fetch(`http://localhost:5000/tasks-site/${siteId}`);
    setTaskLogs({ ...taskLogs, [siteId]: await res.json() });
    setExpandedSite(siteId);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <>
      
      <div className="manager-dashboard">
      {/* Left Sidebar - Profile Card */}
      <div className="profile-sidebar">
        <div className="profile-card">
          <div className="profile-avatar">
            <img src="https://via.placeholder.com/80" alt="Profile" />
          </div>
          <h3 className="profile-name">{user?.name || "Manager"}</h3>
          <p className="profile-role">Manager</p>
          <p className="profile-details">{user?.email}</p>
          <p className="profile-company"><strong>Company:</strong> {user?.companyName}</p>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        <div className="dashboard-header">
          <h1>Manager Dashboard</h1>
        </div>
        <div className="create-site-form">
          <h2>Create Site</h2>
          <form onSubmit={createSite} className="create-site-grid">
          {/* LEFT: inputs */}
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
          {/* RIGHT: map */}
          <div className="create-site-right">
            <MapPicker
              value={site.coords}
              onChange={(coords) => setSite({ ...site, coords })}
              height={260}
              defaultZoom={14}
            />
          </div>

        </form>
        </div>

        <h2>My Sites</h2>

        {sites.map(site => (
          <div key={site._id} className="site-card">
            <strong>{site.name}</strong>
            <p>{site.location}</p>

            <button
              className="delete-site-btn"
              onClick={() => deleteSite(site._id)}>
              Delete Site
            </button>

            <div className="task-section">
              <h4>Assign Task</h4>
              <div className="task-inputs">
                <input
                  placeholder="Employee email"
                  value={taskInputs[site._id]?.email || ""}
                  onChange={e => setTaskInputs({ ...taskInputs, [site._id]: { ...taskInputs[site._id], email: e.target.value } })}
                />
                <input
                  placeholder="Task description"
                  value={taskInputs[site._id]?.desc || ""}
                  onChange={e => setTaskInputs({ ...taskInputs, [site._id]: { ...taskInputs[site._id], desc: e.target.value } })}
                />
                <button onClick={() => createTask(site)}>Add Task</button>
              </div>

              <button onClick={() => loadTaskLog(site._id)}>
                {expandedSite === site._id ? "Hide Task Log" : "View Task Log"}
              </button>

              {expandedSite === site._id && taskLogs[site._id] && (
                <div className="task-log">
                  {taskLogs[site._id].map(task => (
                    <div key={task._id} className="task-item">
                      <strong>{task.employeeEmail}</strong>
                      <span className={`status-badge status-${task.status}`}>{task.status}</span>
                      <p>{task.description}</p>

                      {task.image && (
                        <div>
                          <img
                            src={`http://localhost:5000/uploads/${task.image}`}
                            alt="proof"
                          />
                        </div>
                      )}

                      {task.employeeMessage && (
                        <p><strong>Message:</strong> {task.employeeMessage}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
