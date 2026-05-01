# SiteSync

SiteSync is a construction site attendance and workforce management app for managers and employees.

Managers can:
- Create and manage sites
- Review employee attendance
- Assign and track tasks
- Approve or reject holiday requests
- View overview dashboards and profile details

Employees can:
- Join assigned sites
- Check in and out using geolocation and site radius checks
- View and complete tasks with photo uploads
- Mark tasks as unable with a reason
- Request holidays
- Manage their profile and profile picture

## Tech Stack
- Frontend: React, React Router, React Leaflet, plain CSS
- Backend: Node.js, Express
- Database: MongoDB
- Media uploads: Cloudinary
- Deployment: Vercel

## Project Structure
- `frontend/` React client app
- `backend/` Express app, route modules, DB connection, upload handling
- `api/[[...path]].js` Vercel serverless entrypoint that forwards to the backend app
- `vercel.json` frontend build output and SPA/API routing config

## Local Setup

Install dependencies from the repo root:

```bash
npm install
npm --prefix frontend install
npm --prefix backend install
```

Create `backend/.env` with your local environment variables:

```env
MONGO_URI=your_mongodb_connection_string
FRONTEND_URL=http://localhost:3000
PORT=5000

# Optional locally, but recommended if you want image uploads
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Running Locally

Run frontend and backend together from the repo root:

```bash
npm run dev:full
```

Other available root scripts:

```bash
npm run dev:frontend
npm run dev:backend
```

Default local URLs:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

## Environment Variables

Backend reads variables from `backend/.env`.

Required:
- `MONGO_URI`

Recommended:
- `FRONTEND_URL`

Needed for image uploads on Vercel, and recommended locally if you want cloud uploads:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Optional:
- `PORT`

Frontend:
- `REACT_APP_API_BASE` is optional. If omitted, the app uses `http://localhost:5000` on localhost and `/api` in production.

## Deployment

This repo is configured for Vercel:
- The frontend is built from `frontend/`
- The output directory is `frontend/build`
- API requests are handled by `api/[[...path]].js`
- Client-side routes are rewritten to `index.html` by `vercel.json`

### Vercel Environment Variables

Set these in Vercel:
- `MONGO_URI`
- `FRONTEND_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Recommended production value:

```env
FRONTEND_URL=https://your-vercel-project.vercel.app
```

## Upload Behavior

- On localhost, uploads can fall back to local disk storage if Cloudinary is not configured.
- On Vercel, the filesystem is read-only, so uploads should use Cloudinary.

## Notes

- The frontend automatically uses same-origin `/api` in production.
- Attendance features depend on browser geolocation access.
- React Router refreshes on routes like `/manager/*` and `/employee/*` are handled by `vercel.json`.
