import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "../css/ManagerOverviewPage.css";
import "../css/ManagerProfilePage.css";
import "../css/ManagerTasksPage.css";
import ManagerSidebar from "../components/ManagerSidebar";
import { apiUrl, taskImageUrl } from "../lib/api";

export default function ManagerTasksPage() {
  const [currentUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [searchParams] = useSearchParams();
  const [sites, setSites] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "info" });
  const [taskForm, setTaskForm] = useState({
    siteId: "",
    employeeEmail: searchParams.get("employee") || "",
    description: ""
  });

  const loadTaskData = useCallback(async () => {
    const [sitesRes, employeesRes, tasksRes] = await Promise.all([
      fetch(apiUrl(`/sites/${currentUser.email}`)),
      fetch(apiUrl(`/manager-employees/${currentUser.email}`)),
      fetch(apiUrl(`/manager-tasks/${currentUser.email}`))
    ]);

    const [sitesData, employeesData, tasksData] = await Promise.all([
      sitesRes.json(),
      employeesRes.json(),
      tasksRes.json()
    ]);

    if (!sitesRes.ok || !employeesRes.ok || !tasksRes.ok) {
      setMessage({
        text:
          sitesData.msg ||
          employeesData.msg ||
          tasksData.msg ||
          "Could not load manager tasks data",
        type: "error"
      });
      return;
    }

    setSites(sitesData);
    setEmployees(employeesData);
    setTasks(tasksData);
  }, [currentUser.email]);

  useEffect(() => {
    loadTaskData();
  }, [loadTaskData]);

  useEffect(() => {
    const preselectedEmployee = searchParams.get("employee");
    if (preselectedEmployee) {
      setTaskForm((prev) => ({ ...prev, employeeEmail: preselectedEmployee }));
    }
  }, [searchParams]);

  const filteredEmployeesForForm = useMemo(() => {
    if (!taskForm.siteId) {
      return employees;
    }

    return employees.filter((employee) =>
      employee.joinedSites?.some((site) => site.siteId === taskForm.siteId)
    );
  }, [employees, taskForm.siteId]);

  const createTask = async (e) => {
    e.preventDefault();

    if (!taskForm.siteId || !taskForm.employeeEmail || !taskForm.description.trim()) {
      setMessage({ text: "Choose a site, employee, and task description.", type: "error" });
      return;
    }

    const selectedSite = sites.find((site) => String(site._id) === taskForm.siteId);

    const res = await fetch(apiUrl("/tasks"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId: taskForm.siteId,
        siteName: selectedSite?.name || "",
        employeeEmail: taskForm.employeeEmail.trim().toLowerCase(),
        description: taskForm.description.trim()
      })
    });

    const data = await res.json();
    setMessage({ text: data.msg || "Task updated", type: res.ok ? "success" : "error" });

    if (res.ok) {
      setTaskForm((prev) => ({
        ...prev,
        description: ""
      }));
      loadTaskData();
    }
  };

  return (
    <div className="manager-section-page">
      <div className="manager-section-layout">
        <ManagerSidebar />

        <main className="manager-section-main">
          <div className="dashboard-header manager-tasks-header">
            <div>
              <h1>Manager Tasks</h1>
              <p className="manager-tasks-subtitle">
                Assign tasks, monitor progress, review proof photos, and track unable updates.
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
              <h2>Assign Task</h2>
            </div>

            <form onSubmit={createTask} className="manager-task-form-grid">
              <select
                value={taskForm.siteId}
                onChange={(e) =>
                  setTaskForm((prev) => ({
                    ...prev,
                    siteId: e.target.value
                  }))
                }
              >
                <option value="">Select site</option>
                {sites.map((site) => (
                  <option key={site._id} value={site._id}>
                    {site.name}
                  </option>
                ))}
              </select>

              <select
                value={taskForm.employeeEmail}
                onChange={(e) =>
                  setTaskForm((prev) => ({
                    ...prev,
                    employeeEmail: e.target.value
                  }))
                }
              >
                <option value="">Select employee</option>
                {filteredEmployeesForForm.map((employee) => (
                  <option key={employee.email} value={employee.email}>
                    {employee.name} ({employee.email})
                  </option>
                ))}
              </select>

              <textarea
                className="manager-task-textarea"
                placeholder="Task description"
                value={taskForm.description}
                onChange={(e) =>
                  setTaskForm((prev) => ({
                    ...prev,
                    description: e.target.value
                  }))
                }
                rows={4}
              />

              <button type="submit" className="create-site-btn">
                Assign Task
              </button>
            </form>
          </section>

          <section className="create-site-form">
            <div className="section-header-row">
              <h2>Task Log</h2>
            </div>

            {tasks.length === 0 ? (
              <div className="manager-section-card">
                <p className="manager-task-empty">No tasks found.</p>
              </div>
            ) : (
              <div className="manager-task-log-grid">
                {tasks.map((task) => (
                  <article key={task._id} className="task-item manager-task-card">
                    <div className="manager-task-card-top">
                      <div>
                        <strong>{task.employeeEmail}</strong>
                        <p className="manager-task-site-name">{task.siteName}</p>
                      </div>
                      <span className={`status-badge status-${task.status}`}>
                        {task.status}
                      </span>
                    </div>

                    <p className="manager-task-description">{task.description}</p>

                    {task.employeeMessage && (
                      <div className="manager-task-note">
                        <span>Employee note</span>
                        <strong>{task.employeeMessage}</strong>
                      </div>
                    )}

                    {task.image && (
                      <div className="manager-task-proof">
                        <span>Uploaded proof</span>
                        <img src={taskImageUrl(task.image)} alt="Task proof" />
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
