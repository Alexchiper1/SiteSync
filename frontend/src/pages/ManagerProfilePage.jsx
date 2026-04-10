import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/ManagerOverviewPage.css";
import "../css/ManagerProfilePage.css";
import { apiUrl, profileFallbackUrl, profileImageUrl } from "../lib/api";
import ManagerSidebar from "../components/ManagerSidebar";

export default function ManagerProfilePage() {
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem("user"))
  );
  const [message, setMessage] = useState({ text: "", type: "info" });
  const [profileName, setProfileName] = useState(
    JSON.parse(localStorage.getItem("user"))?.name || ""
  );
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const uploadInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const saveProfile = async () => {
    const trimmedName = profileName.trim();
    if (!trimmedName) {
      setMessage({ text: "Name cannot be empty", type: "error" });
      return;
    }

    const formData = new FormData();
    formData.append("email", currentUser.email);
    formData.append("name", trimmedName);

    if (profileImageFile) {
      formData.append("profileImage", profileImageFile);
    }

    const res = await fetch(apiUrl("/users/profile"), {
      method: "PUT",
      body: formData
    });

    const data = await res.json();
    setMessage({ text: data.msg, type: res.ok ? "success" : "error" });

    if (res.ok && data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
      setCurrentUser(data.user);
      setProfileName(data.user.name || "");
      setProfileImageFile(null);
      setIsEditingProfile(false);
      setShowPhotoOptions(false);
    }
  };

  const startEditingProfile = () => {
    setProfileName(currentUser?.name || "");
    setProfileImageFile(null);
    setIsEditingProfile(true);
  };

  const cancelEditingProfile = () => {
    setProfileName(currentUser?.name || "");
    setProfileImageFile(null);
    setIsEditingProfile(false);
    setShowPhotoOptions(false);
  };

  const handleProfileFileChange = (file) => {
    if (!file) return;
    setProfileImageFile(file);
    setShowPhotoOptions(false);
  };

  return (
    <div className="manager-profile-page">
      <div className="manager-section-layout">
        <ManagerSidebar />

        <main className="manager-section-main">
          <div className="manager-profile-shell">
            {message.text && (
              <div className={`app-message app-message-${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="profile-card manager-profile-card">
              <div
                className={`profile-avatar ${isEditingProfile ? "profile-avatar-editable" : ""}`}
                onClick={() => isEditingProfile && setShowPhotoOptions(true)}
                role={isEditingProfile ? "button" : undefined}
                tabIndex={isEditingProfile ? 0 : undefined}
                onKeyDown={(e) => {
                  if (isEditingProfile && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    setShowPhotoOptions(true);
                  }
                }}
              >
                <img
                  src={
                    profileImageUrl(currentUser?.profileImage) ||
                    profileFallbackUrl(currentUser?.name)
                  }
                  alt="Profile"
                />
              </div>

              <h1 className="manager-profile-title">Manager Profile</h1>
              <h3 className="profile-name">{currentUser?.name || "Manager"}</h3>
              <p className="profile-role">Manager</p>
              <p className="profile-details">{currentUser?.email}</p>
              <p className="profile-company">
                <strong>Company:</strong> {currentUser?.companyName}
              </p>

              {!isEditingProfile ? (
                <button
                  type="button"
                  className="profile-edit-toggle"
                  onClick={startEditingProfile}
                >
                  Edit Profile
                </button>
              ) : (
                <div className="profile-edit-box">
                  <input
                    type="text"
                    value={profileName}
                    placeholder="Update your name"
                    onChange={(e) => setProfileName(e.target.value)}
                  />
                  <p className="profile-edit-hint">
                    Tap the profile picture to upload or take a new photo.
                  </p>
                  <input
                    ref={uploadInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden-file-input"
                    onChange={(e) => handleProfileFileChange(e.target.files?.[0] || null)}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden-file-input"
                    onChange={(e) => handleProfileFileChange(e.target.files?.[0] || null)}
                  />
                  <div className="profile-edit-actions">
                    <button type="button" className="profile-save-button" onClick={saveProfile}>
                      Save Changes
                    </button>
                    <button
                      type="button"
                      className="profile-cancel-button"
                      onClick={cancelEditingProfile}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </main>
      </div>

      {showPhotoOptions && (
        <div className="profile-photo-modal" onClick={() => setShowPhotoOptions(false)}>
          <div
            className="profile-photo-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h4>Change profile picture</h4>
            <button type="button" onClick={() => uploadInputRef.current?.click()}>
              Upload Picture
            </button>
            <button type="button" onClick={() => cameraInputRef.current?.click()}>
              Take Picture
            </button>
            <button
              type="button"
              className="profile-cancel-button"
              onClick={() => setShowPhotoOptions(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
