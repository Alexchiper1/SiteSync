import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import "../css/ManagerDashboard.css";

export default function ManagerDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const [site, setSite] = useState({ name: "", location: "", joinKey: "" });
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

    await fetch("http://localhost:5000/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: site.name,
        location: site.location,
        joinKey: site.joinKey,
        managerEmail: user.email
      })
    });

    setSite({ name: "", location: "", joinKey: "" });
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
          <form onSubmit={createSite}>
            <div className="form-row">
              <input placeholder="Site name" value={site.name} onChange={e => setSite({ ...site, name: e.target.value })} />
              <input placeholder="Location" value={site.location} onChange={e => setSite({ ...site, location: e.target.value })} />
              <input placeholder="Join Key" value={site.joinKey} onChange={e => setSite({ ...site, joinKey: e.target.value })} />
              <button>Create Site</button>
            </div>
          </form>
        </div>

        <h2>My Sites</h2>

        {sites.map(site => (
          <div key={site._id} className="site-card">
            <strong>{site.name}</strong>
            <p>{site.location}</p>

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
