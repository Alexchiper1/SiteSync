import "../css/Logo.css";

export default function Logo() {
  return (
    <div className="logo-container">
      <div className="logo-icon">
        <div className="logo-cloud"></div>
        <div className="logo-checkbox">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M16 6L8 14L4 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      <span className="logo-text">SiteSync</span>
    </div>
  );
}
