import { useCallback, useEffect, useMemo, useState } from "react";
import "../css/EmployeeOverviewPage.css";
import "../css/EmployeeProfilePage.css";
import "../css/EmployeeSitesPage.css";
import EmployeeSidebar from "../components/EmployeeSidebar";
import { apiUrl } from "../lib/api";

export default function EmployeeSitesPage() {
  const [currentUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [message, setMessage] = useState({ text: "", type: "info" });
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [joinKeys, setJoinKeys] = useState({});
  const [mySites, setMySites] = useState([]);

  const loadMySites = useCallback(async () => {
    const res = await fetch(apiUrl(`/employee-sites/${currentUser.email.trim().toLowerCase()}`));
    setMySites(await res.json());
  }, [currentUser.email]);

  useEffect(() => {
    loadMySites();
  }, [loadMySites]);

  const joinedSiteIds = useMemo(() => {
    return new Set(mySites.map((site) => site.siteId));
  }, [mySites]);

  const searchSites = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const res = await fetch(apiUrl(`/sites-search/${query}`));
    setResults(await res.json());
  };

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
    setMessage({ text: data.msg, type: res.ok ? "success" : "error" });

    if (res.ok) {
      loadMySites();
      setJoinKeys((prev) => ({ ...prev, [siteId]: "" }));
    }
  };

  return (
    <div className="employee-section-page">
      <div className="employee-section-layout">
        <EmployeeSidebar />

        <main className="employee-section-main">
          <div className="dashboard-header">
            <h1>Employee Sites</h1>
            <p className="employee-sites-subtitle">
              Search for sites, join with a key, and review the sites already assigned to you.
            </p>
          </div>

          {message.text && (
            <div className={`app-message app-message-${message.type}`}>
              {message.text}
            </div>
          )}

          <section className="create-site-form">
            <h2>Search Sites</h2>
            <div className="form-row">
              <input
                type="text"
                placeholder="Search by site name"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="button" onClick={searchSites}>
                Search
              </button>
            </div>

            {results.length > 0 && (
              <div className="employee-search-results-grid">
                {results.map((site) => {
                  const isJoined = joinedSiteIds.has(String(site._id));

                  return (
                    <article key={site._id} className="search-result-item employee-site-card">
                      <div className="employee-site-card-top">
                        <div>
                          <strong>{site.name}</strong>
                          <p>{site.location || "No location set"}</p>
                        </div>
                        <span
                          className={`status-badge ${
                            isJoined ? "status-completed" : "status-pending"
                          }`}
                        >
                          {isJoined ? "joined" : "available"}
                        </span>
                      </div>

                      <div className="employee-site-meta">
                        <div className="employee-site-meta-row">
                          <span>Status</span>
                          <strong>{isJoined ? "Assigned / Joined" : "Available to join"}</strong>
                        </div>
                        <div className="employee-site-meta-row">
                          <span>Location</span>
                          <strong>{site.location || "Not provided"}</strong>
                        </div>
                        <div className="employee-site-meta-row">
                          <span>Site details</span>
                          <strong>
                            Radius: {Number(site.radiusMeters ?? 100)}m
                            {site.lat != null && site.lng != null ? " | Map ready" : ""}
                          </strong>
                        </div>
                      </div>

                      {!isJoined && (
                        <div className="join-input-group">
                          <input
                            type="text"
                            placeholder="Enter join key"
                            value={joinKeys[site._id] || ""}
                            onChange={(e) =>
                              setJoinKeys((prev) => ({
                                ...prev,
                                [site._id]: e.target.value
                              }))
                            }
                          />
                          <button type="button" onClick={() => joinSite(site._id)}>
                            Join Site
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="create-site-form">
            <div className="employee-sites-section-header">
              <h2>Assigned Sites</h2>
              <span className="employee-sites-count">
                {mySites.length} {mySites.length === 1 ? "site" : "sites"}
              </span>
            </div>

            {mySites.length === 0 ? (
              <div className="employee-section-card">
                <p className="employee-sites-empty">You have not joined any sites yet.</p>
              </div>
            ) : (
              <div className="employee-my-sites-grid">
                {mySites.map((site) => (
                  <article key={site._id} className="site-item employee-assigned-site-card">
                    <div>
                      <strong>{site.siteName}</strong>
                      <p className="employee-assigned-site-text">
                        Site membership is active for this location.
                      </p>
                    </div>

                    <div className="employee-site-assigned-badge-wrap">
                      <span className="status-badge status-completed">assigned</span>
                    </div>
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
