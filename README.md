# depolylive

A standalone monorepo scaffold for the EcommercePro project, containing three independent apps:

- **server/**: Express API server
- **client/**: React storefront
- **admin/**: React admin panel

---

## Prerequisites

- Node.js v16+ and npm installed
- MongoDB URI (e.g. Atlas)
- Environment variables configured in `.env`

## Environment Variables

Create `depolylive/.env` with:

```env
# CORS origins (comma-separated)
CORS_ORIGINS=https://ecommercepro-admin.onrender.com,https://ecommercepro-0ukc.onrender.com

# Server settings
PORT=5000
HOST_URL=http://localhost:5000

# Frontend API base
VITE_API_BASE=https://ecommercepro-0ukc.onrender.com
VITE_PORT=5173
VITE_ADMIN_PORT=5174

# MongoDB connection
MONGODB_URI=your-mongo-uri
JWT_SECRET=your-jwt-secret
``` 

## Installation

From repo root:

```bash
cd depolylive
npm install        # install root dependencies (if any)

# Install each app
cd server && npm install
cd ../client && npm install
cd ../admin && npm install
``` 

## Development

Open three terminals:

1. **Server**
   ```bash
   cd server
   npm run dev
   ```
2. **Client**
   ```bash
   cd client
   npm run dev
   ```
3. **Admin**
   ```bash
   cd admin
   npm run dev
   ```

Each app will run on its configured port:
- Server: `https://ecommercepro-0ukc.onrender.com`
- Client: `https://ecommercepro-0ukc.onrender.com`
- Admin:  `https://ecommercepro-admin.onrender.com`

## Build & Production

1. Build all apps:
   ```bash
   cd depolylive/server && npm run build
   cd ../client && npm run build
   cd ../admin && npm run build
   ```
2. Start server in production mode:
   ```bash
   cd server
   npm start
   ```
3. Serve static files from `client/dist` and `admin/dist` as needed (e.g. via Nginx or Express static middleware).

## GitHub & Deployment

1. Add remote and push:
   ```bash
   git remote add origin <your-repo-url>
   git add .
   git commit -m "chore: scaffold depolylive"
   git push -u origin main
   ```
2. On Render.com (or other host): create 3 services:
   - **Web Service** for `server/`
   - **Static Site** for `client/` (publish `build` folder)
   - **Static Site** for `admin/` (publish `dist` folder)

Configure build & start commands per service. Use environment variables from Render dashboard.

---

Happy coding! Feel free to update this README with additional details.
