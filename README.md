# FeedersLab

FeedersLab is a feedback platform for product teams that helps them collect feedback about which features their customers want, so they can build the right features.

## What is in this repository

- Frontend: Next.js app in `Frontend/`
- Backend: FastAPI app in `Backend/`
- Local automation scripts: `scripts/`

## Stack

- Frontend: Next.js, React, TypeScript, Tailwind, Better Auth
- Backend: FastAPI, SQLModel/SQLAlchemy, PostgreSQL, Stripe
- Auth: Better Auth + backend JWT access/refresh flow
- Email: Resend magic-link transactional emails

## Project structure

```text
.
|- Frontend/
|  |- app/
|  |- lib/
|  |- public/
|  |- .env.local
|  |- .env.example
|
|- Backend/
|  |- src/
|  |  |- routes/
|  |  |- services/
|  |  |- models/
|  |  |- exceptions/
|  |  |- config/
|  |  |- middlewares/
|  |- scripts/
|  |- Dockerfile
|  |- .dockerignore
|  |- .env
|  |- .env.example
|
|- scripts/
|  |- start-all.bat
|  |- stop-all.bat
```

## Local setup

### 1) Prerequisites

- Node.js 18+
- Python 3.11+
- Stripe CLI (optional for local webhooks)

### 2) Install frontend dependencies

```powershell
cd Frontend
npm install
```

### 3) Install backend dependencies

```powershell
cd Backend
..\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### 4) Configure environment files

- Copy `Backend/.env.example` to `Backend/.env`
- Copy `Frontend/.env.example` to `Frontend/.env.local`

### 5) Start everything (frontend + backend + webhook listener)

```powershell
scripts\start-all.bat
```

### 6) Stop everything

```powershell
scripts\stop-all.bat
```

## Scripts folder

All root-level helper scripts are organized under `scripts/`.

- `scripts/start-all.bat`: starts frontend, backend, and Stripe listener
- `scripts/stop-all.bat`: stops related processes and frees ports

## Deployment

### Frontend deployment: Vercel

- Deploy `Frontend/` as a Vercel project.
- Build command: `npm run build`
- Output handled by Next.js automatically.
- Set frontend environment variables from `Frontend/.env.example`.

### Backend deployment: Render (Docker image)

- Deploy `Backend/` on Render as a Docker-based Web Service.
- This repo now includes `Backend/Dockerfile` for image build.
- Container start command uses:
  `uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}`
- Set backend environment variables from `Backend/.env.example`.

## Environment notes

- Keep `BETTER_AUTH_SECRET` identical in frontend and backend.
- Keep frontend/backend base URLs aligned in production.
- If using secure cookies in production, set `REFRESH_COOKIE_SECURE=true`.
- The same database connection string can be used where required by your setup.

## Common commands

```powershell
# Frontend lint
cd Frontend
npm run lint

# Backend run (manual)
cd Backend
..\.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000
```

## Troubleshooting

- Port already in use:
  run `scripts\stop-all.bat` and start again.
- Magic link not arriving:
  verify `RESEND_KEY`, `RESEND_FROM`, and sender domain setup.
- Stripe webhook noise locally:
  the listener is configured to forward only required event types.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
