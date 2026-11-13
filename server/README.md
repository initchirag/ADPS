# ADPS Backend (Express + SQLite + JWT)

## Setup

```bash
# 1. Install backend dependencies
cd server
npm install

# 2. Go back to root and install frontend deps (adds concurrently)
cd ..
npm install

# 3. Run everything at once
npm run dev:all
```

This starts:
- **Frontend** (Vite) on http://localhost:5173
- **Backend** (Express) on http://localhost:3001

Vite proxies `/api/*` → `http://localhost:3001` so you never hit CORS.

## Running separately

```bash
# Frontend only
npm run dev

# Backend only
npm run server
```

## Default credentials

| Email | Password | Role |
|-------|----------|------|
| admin@adps.com | rmf@5864 | admin |
| james.wilson@adps.com | password | user |
| sarah.johnson@adps.com | password | user |
| (8 more users) | password | user/analyst/manager |

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/login | — | Login, returns JWT |
| POST | /api/auth/logout | ✓ | Logout, logs session duration |
| GET | /api/auth/me | ✓ | Current user from DB |
| GET | /api/users | admin | All users |
| PUT | /api/users/:id/block | admin | Toggle block |
| PUT | /api/users/:id/chatbot | admin | Toggle chatbot |
| GET | /api/datasets | ✓ | All datasets |
| GET | /api/datasets/:id | ✓ | Dataset + versions |
| POST | /api/datasets | ✓ | Create dataset |
| PUT | /api/datasets/:id | ✓ | Update (bumps version) |
| DELETE | /api/datasets/:id | ✓ | Delete |
| GET | /api/audit-logs | ✓ | Audit log (filterable) |
| POST | /api/audit-logs | ✓ | Log custom action |
| GET | /api/lineage | ✓ | Lineage relationships |
| GET | /api/lineage/transformations | ✓ | Transformations |
| GET | /api/files | ✓ | Analyzed files (current user) |
| POST | /api/files | ✓ | Save analysis result |
| DELETE | /api/files/:id | ✓ | Delete file record |
| GET | /api/dashboard/stats | ✓ | Dashboard stats |
| GET | /api/health | — | Health check |

## Production notes

- Set `JWT_SECRET` env var to something strong before deploying
- SQLite DB auto-created at `server/adps.db` on first run
- Seed data is inserted only once (idempotent check on user count)
