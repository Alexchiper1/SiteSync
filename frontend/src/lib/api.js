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

  return `${localApiBase}/uploads/${image}`;
}
