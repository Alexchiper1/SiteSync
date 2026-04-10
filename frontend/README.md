# Frontend

This is the React frontend for SiteSync.

For full project setup, environment variables, local development, and deployment notes, use the root `README.md`.

## Available Scripts

From `frontend/`:

```bash
npm start
npm run build
npm test
```

Default local URL:
- `http://localhost:3000`

API behavior:
- Uses `http://localhost:5000` while running on localhost
- Uses same-origin `/api` in production unless `REACT_APP_API_BASE` is set
