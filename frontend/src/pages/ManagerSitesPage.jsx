import { useCallback, useEffect, useState } from "react";
import "../css/ManagerOverviewPage.css";
import "../css/ManagerProfilePage.css";
import "../css/ManagerSitesPage.css";
import MapPicker from "../components/MapPicker";
import ManagerSidebar from "../components/ManagerSidebar";
import { apiUrl } from "../lib/api";

const emptySiteForm = {
  name: "",
  location: "",
  joinKey: "",
  radiusMeters: "150",
  coords: null
};

export default function ManagerSitesPage() {
  const [currentUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [message, setMessage] = useState({ text: "", type: "info" });
  const [site, setSite] = useState(emptySiteForm);
  const [sites, setSites] = useState([]);
  const [deleteSiteId, setDeleteSiteId] = useState("");
  const [editingSiteId, setEditingSiteId] = useState("");

  const loadSites = useCallback(async () => {
    const res = await fetch(apiUrl(`/sites/${currentUser.email}`));
    setSites(await res.json());
  }, [currentUser.email]);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  const createSite = async (e) => {
    e.preventDefault();

    const payload = {
      name: site.name,
      location: site.location,
      joinKey: site.joinKey,
      radiusMeters: Number(site.radiusMeters),
      lat: site.coords?.lat,
      lng: site.coords?.lng,
      managerEmail: currentUser.email
    };

    if (!payload.lat || !payload.lng) {
      setMessage({ text: "Please click the map to pick the site location.", type: "error" });
      return;
    }

    const isEditing = Boolean(editingSiteId);
    const res = await fetch(apiUrl(isEditing ? `/sites/${editingSiteId}` : "/sites"), {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    setMessage({ text: data.msg, type: res.ok ? "success" : "error" });

    if (res.ok) {
      setSite(emptySiteForm);
      setEditingSiteId("");
      loadSites();
    }
  };

  const startEditSite = (siteToEdit) => {
    setEditingSiteId(siteToEdit._id);
    setSite({
      name: siteToEdit.name || "",
      location: siteToEdit.location || "",
      joinKey: siteToEdit.joinKey || "",
      radiusMeters: String(siteToEdit.radiusMeters ?? 150),
      coords:
        siteToEdit.lat != null && siteToEdit.lng != null
          ? { lat: siteToEdit.lat, lng: siteToEdit.lng }
          : null
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEditSite = () => {
    setEditingSiteId("");
    setSite(emptySiteForm);
  };

  const deleteSite = async (siteId) => {
    const res = await fetch(apiUrl(`/sites/${siteId}`), {
      method: "DELETE"
    });

    const data = await res.json();
    setMessage({ text: data.msg, type: res.ok ? "success" : "error" });

    if (res.ok) {
      setDeleteSiteId("");
      loadSites();
    }
  };

  return (
    <div className="manager-section-page">
      <div className="manager-section-layout">
        <ManagerSidebar />

        <main className="manager-section-main">
          {deleteSiteId && (
            <div className="manager-modal-overlay" onClick={() => setDeleteSiteId("")}>
              <div
                className="manager-modal-card"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="manager-modal-badge">Delete Site</span>
                <h3>Delete this site?</h3>
                <p>This will remove the site and its related data from the dashboard.</p>
                <div className="task-actions-row">
                  <button
                    className="delete-site-btn"
                    type="button"
                    onClick={() => deleteSite(deleteSiteId)}
                  >
                    Delete
                  </button>
                  <button
                    className="cancel-action-btn"
                    type="button"
                    onClick={() => setDeleteSiteId("")}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="dashboard-header">
            <h1>Manager Sites</h1>
            <p className="manager-sites-subtitle">
              Create sites, update details, set location coordinates, and manage existing sites.
            </p>
          </div>

          {message.text && (
            <div className={`app-message app-message-${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="create-site-form">
            <div className="section-header-row">
              <h2>{editingSiteId ? "Edit Site" : "Create Site"}</h2>
              {editingSiteId && (
                <button
                  type="button"
                  className="cancel-action-btn compact-action-btn"
                  onClick={cancelEditSite}
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={createSite} className="create-site-grid">
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
                  placeholder="Join Key"
                  value={site.joinKey}
                  onChange={(e) => setSite({ ...site, joinKey: e.target.value })}
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
                <button className="create-site-btn" type="submit">
                  {editingSiteId ? "Save Changes" : "Create Site"}
                </button>
              </div>

              <div className="create-site-right">
                <MapPicker
                  value={site.coords}
                  onChange={(coords) => setSite({ ...site, coords })}
                  size={320}
                  defaultZoom={14}
                />
              </div>
            </form>
          </div>

          <div className="manager-sites-header-row">
            <h2>Existing Sites</h2>
            <span className="manager-sites-count">
              {sites.length} {sites.length === 1 ? "site" : "sites"}
            </span>
          </div>

          {sites.length === 0 ? (
            <div className="manager-section-card">
              <p className="manager-sites-empty">No sites created yet.</p>
            </div>
          ) : (
            sites.map((siteItem) => (
              <div key={siteItem._id} className="site-card">
                <button
                  className="site-icon-button delete-site-icon"
                  type="button"
                  aria-label={`Delete ${siteItem.name}`}
                  title="Delete site"
                  onClick={() => setDeleteSiteId(siteItem._id)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="site-icon-svg"
                  >
                    <path
                      d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v8h-2V9zm4 0h2v8h-2V9zM7 9h2v8H7V9zm1 12c-1.1 0-2-.9-2-2V8h12v11c0 1.1-.9 2-2 2H8z"
                      fill="currentColor"
                    />
                  </svg>
                </button>

                <strong>{siteItem.name}</strong>
                <p>{siteItem.location}</p>

                <div className="manager-site-meta-list">
                  <div className="manager-site-meta-item">
                    <span>Join Key</span>
                    <strong>{siteItem.joinKey || "Not set"}</strong>
                  </div>
                  <div className="manager-site-meta-item">
                    <span>Radius</span>
                    <strong>{siteItem.radiusMeters ?? 150}m</strong>
                  </div>
                  <div className="manager-site-meta-item">
                    <span>Coordinates</span>
                    <strong>
                      {siteItem.lat != null && siteItem.lng != null
                        ? `${Number(siteItem.lat).toFixed(5)}, ${Number(siteItem.lng).toFixed(5)}`
                        : "No coordinates set"}
                    </strong>
                  </div>
                </div>

                <button
                  className="edit-site-btn"
                  type="button"
                  onClick={() => startEditSite(siteItem)}
                >
                  Edit Site
                </button>
              </div>
            ))
          )}
        </main>
      </div>
    </div>
  );
}
