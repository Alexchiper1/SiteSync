import { Link } from "react-router-dom";
import logo from "../pictures/LogoNoBack.png";
import "../css/LandingPage.css";

const LANDING_VIDEO_EMBED_URL =
  process.env.REACT_APP_LANDING_VIDEO_EMBED_URL?.trim() ||
  "https://player.cloudinary.com/embed/?cloud_name=djd5nuajp&public_id=0422_oj7fcf";

const featureCards = [
  {
    title: "Who Can Use It",
    text: "SiteSync is built for site managers, supervisors, and employees who need a simple way to coordinate daily work on construction and field-based projects."
  },
  {
    title: "When To Use It",
    text: "Use it before the day starts, during active site work, and at check-in or check-out so everyone has a live record of attendance, tasks, and site activity."
  },
  {
    title: "Why Use It",
    text: "It keeps teams organised, improves accountability, and gives managers a clearer picture of who is on site, what jobs are assigned, and what work has been completed."
  }
];

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-brand">
          <img src={logo} alt="SiteSync Logo" className="landing-logo" />
        </div>

        <div className="landing-title-wrap">
          <p className="landing-title-label">Welcome to</p>
          <h1 className="landing-title">SITESYNC</h1>
        </div>

        <nav className="landing-nav">
          <Link className="landing-nav-link" to="/login">
            Sign In
          </Link>
          <Link className="landing-nav-cta" to="/register">
            Sign Up
          </Link>
        </nav>
      </header>

      <main className="landing-content">
        <section className="landing-hero">
          <div className="landing-video-panel">
            <div className="landing-video-shell">
              <span className="landing-video-badge">Walkthrough</span>
              <h2 className="landing-video-heading">See SiteSync in action</h2>
              <div className="landing-video-frame">
                <iframe
                  src={LANDING_VIDEO_EMBED_URL}
                  title="SiteSync walkthrough"
                  className="landing-video-iframe"
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <p className="landing-video-caption">
                How teams manage sites, tasks, and attendance in one place.
              </p>
            </div>
          </div>

          <div className="landing-about-panel">
            <span className="landing-section-tag">About SiteSync</span>
            <h2>What it is and who we are</h2>
            <p>
              SiteSync is a construction site management platform designed to
              help teams stay connected throughout the working day.
            </p>
            <p>
              We are building a simple system that helps managers track job
              sites, assign work, monitor attendance, and give employees a
              clearer way to manage their tasks on site.
            </p>
            <p>
              The goal is to make daily site operations easier to manage, more
              transparent, and more reliable for everyone involved.
            </p>
          </div>
        </section>

        <section className="landing-info-section">
          <div className="landing-info-heading">
            <span className="landing-section-tag">Who It Is For</span>
            <h2>Built for real site teams</h2>
            <p>
              SiteSync supports the people who organise work, complete tasks,
              and need accurate attendance and site records all in one place.
            </p>
          </div>

          <div className="landing-feature-grid">
            {featureCards.map((card) => (
              <article key={card.title} className="landing-feature-card">
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
