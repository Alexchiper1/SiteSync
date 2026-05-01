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

## Personal Reflection

Working on SiteSync has been one of the most useful learning experiences I have had so far because it brought together a lot of the technologies and ideas I wanted to improve in. Before building this project, I had some experience with web development, but creating a full application with a React frontend, a JavaScript/Node.js backend, routing, database storage, authentication-style user flows, image uploads, and deployment helped me understand how all of those parts connect in a real project. It was not just about writing separate pages or individual functions. I had to think about how managers and employees would move through the system, how data would travel from the browser to the server, how it would be stored in MongoDB, and how the interface should respond when something changed.

I learned a lot about React during this project. I became more confident with components, state, forms, conditional rendering, page routing, and passing data through the application. Building separate manager and employee views helped me understand how important structure is in a frontend project. I also learned that small user experience details matter, such as showing clear status messages, keeping forms understandable, updating the page after actions, and making sure each user only sees the information that is relevant to them. React made it easier to break the app into reusable pieces like sidebars, map components, pages, and helper functions, but it also taught me that good organisation is essential as an app grows.

This project also improved my JavaScript skills a lot. I used JavaScript on both the frontend and backend, which helped me see the language from two different angles. On the frontend, JavaScript was mainly about user interaction, rendering information, and calling the API. On the backend, it was about handling requests, validating data, working with MongoDB, managing uploaded files, and returning useful responses. Writing both sides of the application helped me understand the full request-and-response flow much better. It also made debugging easier because I could follow a feature from the button the user clicks, through the API call, into the backend route, and finally into the database.

Another important part of this project was learning how to work with real-world features instead of only simple examples. SiteSync includes geolocation check-ins, site radius checks, task completion with photo proof, holiday requests, dashboards, and profile image uploads. These features made the project feel closer to something that could actually be used by a construction company. They also came with challenges. For example, I had to think about how to stop users from checking in when they are outside the allowed area, how to connect employees to the sites they join, how managers should see only their own sites and staff, and how uploaded images should work locally and in deployment. Solving these problems helped me become more practical and confident as a developer.

I am also currently doing an internship where we are using similar technologies, especially React and JavaScript. That made this project even more valuable because the work I was doing in my internship helped me with SiteSync, and the work I was doing on SiteSync helped me understand my internship tasks better. The two experiences supported each other. When I learned something in the internship, I could apply it to this project. When I ran into a problem in this project, it often helped me understand something I later saw in a professional codebase. Because of that, I feel like my learning was not only theoretical. I was practising the same kind of skills in both an academic project and a real working environment.

Overall, SiteSync helped me grow as a developer. I became more comfortable with React, JavaScript, APIs, MongoDB, styling, deployment, and thinking through a complete user workflow. I also learned the importance of testing features carefully, reading errors properly, keeping code organised, and making sure the application works for the people who would actually use it. If I continued developing this project, I would like to improve areas such as security, role-based authentication, reporting, and mobile usability. However, I am proud of what I built because it shows how much I have learned and how I can apply those skills to a practical, real-world problem.

## Notes

- The frontend automatically uses same-origin `/api` in production.
- Attendance features depend on browser geolocation access.
- React Router refreshes on routes like `/manager/*` and `/employee/*` are handled by `vercel.json`.
