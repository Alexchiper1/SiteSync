const localApiBase = "http://localhost:5000";

export const API_BASE =
  process.env.REACT_APP_API_BASE ||
  (window.location.hostname === "localhost" ? localApiBase : "/api");

export function apiUrl(path) {
  return `${API_BASE}${path}`;
}

export function taskImageUrl(image) {
  if (!image) {
    return "";
  }

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return "";
}

export function profileImageUrl(image) {
  return taskImageUrl(image);
}

export function profileFallbackUrl(name = "User") {
  const trimmed = String(name || "User").trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const initials = (words[0]?.[0] || "U") + (words[1]?.[0] || "");
  const safeInitials = initials.toUpperCase().slice(0, 2);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#14b8a6" />
          <stop offset="100%" stop-color="#0f766e" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="80" fill="#e6fffb" />
      <circle cx="80" cy="80" r="72" fill="url(#g)" opacity="0.12" />
      <text
        x="50%"
        y="54%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="52"
        font-weight="700"
        fill="#115e59"
      >${safeInitials}</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
