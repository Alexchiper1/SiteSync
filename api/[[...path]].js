// Import the full application object from the backend folder.
import app from "../backend/app.js";

// Export this app as the default export for this module.
// The filename [[...path]] is a Vercel pattern, it catches all url paths under /api/*
// and forwards them to this handler so every api request runs through the same Express app.
export default app;
