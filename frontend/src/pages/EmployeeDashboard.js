import { useEffect, useState } from "react";

export default function EmployeeDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [joinKeys, setJoinKeys] = useState({});
  const [mySites, setMySites] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [photos, setPhotos] = useState({});

  // loads the construction sitres
  const loadMySites = async () => {
    const res = await fetch(
      `http://localhost:5000/employee-sites/${user.email.trim().toLowerCase()}`
    );
    setMySites(await res.json());
  };

  // loads the tasks
  const loadTasks = async () => {
    const res = await fetch(
      `http://localhost:5000/tasks/${user.email.trim().toLowerCase()}`
    );
    setTasks(await res.json());
  };

  useEffect(() => {
    loadMySites();
    loadTasks();
  }, []);

  // able to search for a task
  const searchSites = async () => {
    if (!query.trim()) return;

    const res = await fetch(`http://localhost:5000/sites-search/${query}`);
    setResults(await res.json());
  };

  // join a site
  const joinSite = async (siteId) => {
    const res = await fetch("http://localhost:5000/join-site", {
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
    if (data.msg === "Joined site successfully") loadMySites();
  };

  // ✅ COMPLETE TASK (REQUIRES PHOTO)
  const completeTask = async (taskId) => {
    if (!photos[taskId]) {
      alert("You must upload a photo before completing the task.");
      return;
    }

    const formData = new FormData();
    formData.append("photo", photos[taskId]);

    await fetch(`http://localhost:5000/tasks-complete/${taskId}`, {
      method: "PUT",
      body: formData
    });

    alert("Task completed successfully");
    loadTasks();
  };

  // unable to complete task 
  const unableTask = async (taskId) => {
    const reason = prompt("Why are you unable to complete this task?");
    if (!reason) return;

    await fetch(`http://localhost:5000/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "unable",
        employeeMessage: reason
      })
    });

    loadTasks();
  };

  return (
    <div>
      <h1>Employee Dashboard</h1>

      {/* SEARCH + JOIN */}
      <h2>Join a Site</h2>

      <input
        placeholder="Search site"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <button onClick={searchSites}>Search</button>

      {results.map(site => (
        <div key={site._id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
          <strong>{site.name}</strong><br />
          Location: {site.location}<br />

          <input
            placeholder="Join Key"
            value={joinKeys[site._id] || ""}
            onChange={e =>
              setJoinKeys({ ...joinKeys, [site._id]: e.target.value })
            }
          />
          <button onClick={() => joinSite(site._id)}>Join</button>
        </div>
      ))}

      {/* MY SITES */}
      <h2>My Sites</h2>

      {mySites.map(site => (
        <div key={site._id} style={{ marginBottom: 10 }}>
          <strong>{site.siteName}</strong>
          <button
            style={{ marginLeft: 10 }}
            onClick={() => setSelectedSiteId(site.siteId)}
          >
            View Tasks
          </button>
        </div>
      ))}

      {/* TASKS */}
      {selectedSiteId && (
        <>
          <h2>Tasks</h2>

          {tasks
            .filter(task => task.siteId === selectedSiteId)
            .map(task => (
              <div key={task._id} style={{ border: "1px solid #000", margin: 10, padding: 10 }}>
                <strong>{task.siteName}</strong><br />
                Task: {task.description}<br />
                Status: {task.status}<br />

                {task.status === "assigned" && (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e =>
                        setPhotos({ ...photos, [task._id]: e.target.files[0] })
                      }
                    />
                    <br />
                    <button onClick={() => completeTask(task._id)}>✅ Complete</button>
                    <button onClick={() => unableTask(task._id)}>❌ Unable</button>
                  </>
                )}

                {task.status === "unable" && (
                  <p><strong>Reason sent:</strong> {task.employeeMessage}</p>
                )}
              </div>
            ))}
        </>
      )}
    </div>
  );
}
