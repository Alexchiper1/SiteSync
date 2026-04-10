import { useCallback, useEffect, useMemo, useState } from "react";
import "../css/EmployeeOverviewPage.css";
import "../css/EmployeeProfilePage.css";
import "../css/EmployeeTasksPage.css";
import EmployeeSidebar from "../components/EmployeeSidebar";
import { apiUrl } from "../lib/api";

export default function EmployeeTasksPage() {
  const [currentUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [tasks, setTasks] = useState([]);
  const [photos, setPhotos] = useState({});
  const [unableInputs, setUnableInputs] = useState({});
  const [message, setMessage] = useState({ text: "", type: "info" });
  const [statusFilter, setStatusFilter] = useState("all");

  const loadTasks = useCallback(async () => {
    const res = await fetch(apiUrl(`/tasks/${currentUser.email.trim().toLowerCase()}`));
    setTasks(await res.json());
  }, [currentUser.email]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const filteredTasks = useMemo(() => {
    if (statusFilter === "all") {
      return tasks;
    }

    if (statusFilter === "pending") {
      return tasks.filter((task) => task.status === "assigned");
    }

    return tasks.filter((task) => task.status === statusFilter);
  }, [statusFilter, tasks]);

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

  const unableTask = async (taskId) => {
    const reason = unableInputs[taskId]?.trim();
    if (!reason) {
      setMessage({ text: "Please enter a reason first.", type: "error" });
      return;
    }

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
      setUnableInputs((prev) => ({ ...prev, [taskId]: "" }));
      loadTasks();
      return;
    }

    const data = await res.json();
    setMessage({ text: data.msg || "Error updating task", type: "error" });
  };

  return (
    <div className="employee-section-page">
      <div className="employee-section-layout">
        <EmployeeSidebar />

        <main className="employee-section-main">
          <div className="dashboard-header">
            <h1>Employee Tasks</h1>
            <p className="employee-tasks-subtitle">
              Review your assigned work, upload task photos, and tell your manager when a task is
              unable to be completed.
            </p>
          </div>

          {message.text && (
            <div className={`app-message app-message-${message.type}`}>
              {message.text}
            </div>
          )}

          <section className="create-site-form">
            <div className="employee-tasks-toolbar">
              <h2>Task List</h2>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All tasks</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="unable">Unable</option>
              </select>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="employee-section-card">
                <p className="employee-tasks-empty">No tasks match the current filter.</p>
              </div>
            ) : (
              <div className="employee-task-grid">
                {filteredTasks.map((task) => (
                  <article key={task._id} className="task-card employee-task-card">
                    <div className="employee-task-card-top">
                      <div>
                        <strong>{task.siteName || "Site Task"}</strong>
                        <p className="employee-task-label">
                          <span>Task details</span>
                          {task.description}
                        </p>
                      </div>

                      <span
                        className={`status-badge status-${
                          task.status === "assigned" ? "pending" : task.status
                        }`}
                      >
                        {task.status === "assigned" ? "pending" : task.status}
                      </span>
                    </div>

                    <div className="employee-task-detail-box">
                      <span>Current status</span>
                      <strong>{task.status === "assigned" ? "Pending action" : task.status}</strong>
                    </div>

                    {task.status === "assigned" && (
                      <>
                        <div className="employee-task-upload">
                          <label htmlFor={`task-photo-${task._id}`}>Upload task photo</label>
                          <input
                            id={`task-photo-${task._id}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              setPhotos((prev) => ({
                                ...prev,
                                [task._id]: e.target.files?.[0]
                              }))
                            }
                          />
                        </div>

                        <div className="task-actions">
                          <button onClick={() => completeTask(task._id)}>Complete</button>

                          <button
                            className="unable-button"
                            onClick={() => unableTask(task._id)}
                          >
                            Mark Unable
                          </button>
                        </div>

                        <div className="inline-action-box">
                          <input
                            type="text"
                            placeholder="Why are you unable to complete this task?"
                            value={unableInputs[task._id] || ""}
                            onChange={(e) =>
                              setUnableInputs((prev) => ({
                                ...prev,
                                [task._id]: e.target.value
                              }))
                            }
                          />
                          <button onClick={() => unableTask(task._id)}>Send Reason</button>
                        </div>
                      </>
                    )}

                    {task.status === "unable" && (
                      <div className="employee-task-detail-box employee-task-detail-box-warning">
                        <span>Reason sent</span>
                        <strong>{task.employeeMessage || "No reason provided"}</strong>
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
