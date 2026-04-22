import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "../css/ManagerOverviewPage.css";
import "../css/ManagerProfilePage.css";
import "../css/ManagerTasksPage.css";
import ManagerSidebar from "../components/ManagerSidebar";
import { apiUrl, taskImageUrl } from "../lib/api";

const TASKS_PER_PAGE = 8;

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="site-icon-svg">
      <path
        d="M12 5a7 7 0 1 1-6.32 4H3l3.5-3.5L10 9H7.72A5 5 0 1 0 12 7c1.1 0 2.1.36 2.92.97l1.42-1.42A6.95 6.95 0 0 0 12 5z"
        fill="currentColor"
      />
    </svg>
  );
}

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
  const [filters, setFilters] = useState({
    employee: searchParams.get("employee") || "all",
    site: "all",
    status: "all",
    search: ""
  });
  const [currentPage, setCurrentPage] = useState(1);

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
      setFilters((prev) => ({ ...prev, employee: preselectedEmployee }));
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

  const filteredTasks = useMemo(() => {
    const searchQuery = filters.search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesEmployee =
        filters.employee === "all" || task.employeeEmail === filters.employee;
      const matchesSite = filters.site === "all" || task.siteId === filters.site;
      const matchesStatus = filters.status === "all" || task.status === filters.status;
      const matchesSearch =
        !searchQuery ||
        task.employeeEmail?.toLowerCase().includes(searchQuery) ||
        task.siteName?.toLowerCase().includes(searchQuery) ||
        task.description?.toLowerCase().includes(searchQuery) ||
        task.employeeMessage?.toLowerCase().includes(searchQuery);

      return matchesEmployee && matchesSite && matchesStatus && matchesSearch;
    });
  }, [filters, tasks]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / TASKS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.employee, filters.search, filters.site, filters.status]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * TASKS_PER_PAGE;
    return filteredTasks.slice(start, start + TASKS_PER_PAGE);
  }, [currentPage, filteredTasks]);

  const taskCounts = useMemo(() => {
    return tasks.reduce(
      (acc, task) => {
        acc.total += 1;
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      },
      { total: 0, assigned: 0, completed: 0, unable: 0 }
    );
  }, [tasks]);

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
            <button
              type="button"
              className="header-icon-button"
              aria-label="Refresh tasks"
              title="Refresh tasks"
              onClick={loadTaskData}
            >
              <RefreshIcon />
            </button>
          </div>

          {message.text && (
            <div className={`app-message app-message-${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="manager-task-stats">
            <div className="manager-task-stat-card">
              <span>Total Tasks</span>
              <strong>{taskCounts.total}</strong>
            </div>
            <div className="manager-task-stat-card">
              <span>Assigned</span>
              <strong>{taskCounts.assigned}</strong>
            </div>
            <div className="manager-task-stat-card">
              <span>Completed</span>
              <strong>{taskCounts.completed}</strong>
            </div>
            <div className="manager-task-stat-card">
              <span>Unable</span>
              <strong>{taskCounts.unable}</strong>
            </div>
          </div>

          <section className="create-site-form">
            <div className="section-header-row">
              <h2>Assign Task</h2>
              <button
                type="button"
                className="header-icon-button"
                aria-label="Refresh assignment data"
                title="Refresh assignment data"
                onClick={loadTaskData}
              >
                <RefreshIcon />
              </button>
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
              <button
                type="button"
                className="header-icon-button"
                aria-label="Refresh task log"
                title="Refresh task log"
                onClick={loadTaskData}
              >
                <RefreshIcon />
              </button>
            </div>

            <div className="manager-task-filters">
              <input
                type="text"
                placeholder="Search tasks"
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    search: e.target.value
                  }))
                }
              />

              <select
                value={filters.employee}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    employee: e.target.value
                  }))
                }
              >
                <option value="all">All employees</option>
                {employees.map((employee) => (
                  <option key={employee.email} value={employee.email}>
                    {employee.name}
                  </option>
                ))}
              </select>

              <select
                value={filters.site}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    site: e.target.value
                  }))
                }
              >
                <option value="all">All sites</option>
                {sites.map((site) => (
                  <option key={site._id} value={String(site._id)}>
                    {site.name}
                  </option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: e.target.value
                  }))
                }
              >
                <option value="all">All statuses</option>
                <option value="assigned">Assigned</option>
                <option value="completed">Completed</option>
                <option value="unable">Unable</option>
              </select>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="manager-section-card">
                <p className="manager-task-empty">No tasks match the current filters.</p>
              </div>
            ) : (
              <div className="manager-task-log-grid">
                {paginatedTasks.map((task) => (
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

            {filteredTasks.length > 0 && (
              <div className="manager-task-pagination">
                <span className="manager-task-pagination-info">
                  Showing {(currentPage - 1) * TASKS_PER_PAGE + 1}-
                  {Math.min(currentPage * TASKS_PER_PAGE, filteredTasks.length)} of{" "}
                  {filteredTasks.length}
                </span>
                <div className="manager-task-pagination-controls">
                  <button
                    type="button"
                    className="cancel-action-btn compact-action-btn"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span className="manager-task-pagination-page">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="compact-action-btn"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
