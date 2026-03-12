# SiteSync


SiteSync is a construction site check-in and management platform where managers can register companies, create job sites, and track employee check-ins via geolocation.

Employees can:
- Check in/out automatically within 100m of a job site
- Receive assigned tasks
- Upload photos of completed work
- Mark tasks as “Unable to complete” with reasons
- Request holidays or time off

Managers can:
- View live check-in data
- Assign and review employee tasks
- Approve/deny leave requests

---

## 🧠 Tech Stack
- **Frontend:** React + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MongoDB or MySQL
- **Mobile (Phase 2):** React Native
- **Version Control:** GitHub

---

## 🧩 Folder Overview
| Folder | Purpose |
|---------|----------|
| `frontend/` | Website UI and components |
| `backend/` | Node.js API, controllers, and DB logic |
| `database/` | Database schema and diagrams |
| `design/` | Figma designs, color palette, and mockups |
| `docs/` | Reports, architecture, notes |
| `mobile/` | Future React Native app |

---

## How to Run

### Local setup
```bash
cd backend
npm install

cd ../frontend
npm install

cd ..
npm install
```

### Start frontend and backend together
```bash
cd C:\SiteSync
npm run dev:full
```

The frontend runs on `http://localhost:3000` and the backend runs on `http://localhost:5000`.

### Backend environment variables

Create `backend/.env` from `backend/.env.example`.

Required:
- `MONGO_URI`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Optional:
- `PORT`
- `FRONTEND_URL`

## Vercel Deployment

This repo is configured so Vercel serves the React frontend from `frontend/` and the API from `api/index.js`.

### Required Vercel environment variables
- `MONGO_URI`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `FRONTEND_URL`

Recommended production value:
```bash
FRONTEND_URL=https://your-vercel-project.vercel.app
```

### Deployment notes
- Frontend API calls switch to same-origin `/api` automatically in production.
- Task photos upload to Cloudinary in production when the Cloudinary env vars are set.
- React Router refreshes on routes like `/manager` and `/employee` are handled by `vercel.json`.
