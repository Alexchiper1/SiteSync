import { useEffect, useState } from "react";

export default function ManagerDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

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

  return (
    <div>
      <h1>Manager Dashboard</h1>
      <p><strong>Company:</strong> {user.companyName}</p>

      <h2>Create Site</h2>
      <form onSubmit={createSite}>
        <input placeholder="Site name" value={site.name} onChange={e => setSite({ ...site, name: e.target.value })} />
        <input placeholder="Location" value={site.location} onChange={e => setSite({ ...site, location: e.target.value })} />
        <input placeholder="Join Key" value={site.joinKey} onChange={e => setSite({ ...site, joinKey: e.target.value })} />
        <button>Create Site</button>
      </form>

      <h2>My Sites</h2>

      {sites.map(site => (
        <div key={site._id} style={{ border: "1px solid #000", margin: 15, padding: 10 }}>
          <strong>{site.name}</strong><br />
          {site.location}

          <h4>Assign Task</h4>
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

          <br /><br />
          <button onClick={() => loadTaskLog(site._id)}>
            {expandedSite === site._id ? "Hide Task Log" : "View Task Log"}
          </button>

          {expandedSite === site._id && taskLogs[site._id] && (
            <div style={{ background: "#f5f5f5", marginTop: 10, padding: 10 }}>
              {taskLogs[site._id].map(task => (
                <div key={task._id} style={{ marginBottom: 10 }}>
                  <strong>{task.employeeEmail}</strong> — {task.status}<br />
                  {task.description}

                  {task.image && (
                    <div>
                      <img
                        src={`http://localhost:5000/uploads/${task.image}`}
                        alt="proof"
                        style={{ width: 200, marginTop: 5 }}
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
      ))}
    </div>
  );
}
