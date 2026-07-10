# AGENTS.md

## Repo layout
- `frontend/`: React + Vite web app for public pages and user, admin, hospital, blood bank, and institution dashboards.
- `backend/`: FastAPI API, SQLAlchemy models, Alembic migrations, seed script, and tests.
- `docs/`: documentation assets and placeholder image locations.
- `docker-compose.yml`: local multi-service development stack.

## Run commands
- Frontend dev:
  - `cd frontend`
  - `npm install`
  - `npm run dev`
- Backend dev:
  - `cd backend`
  - `python -m venv venv`
  - `venv\Scripts\activate` on Windows or `source venv/bin/activate` on Unix shells
  - `pip install -r requirements.txt`
  - `alembic upgrade head`
  - `python -m app.seed`
  - `uvicorn app.main:app --reload`
- Docker Compose:
  - `docker compose up --build`

## Build, test, and lint
- Frontend build: `cd frontend && npm run build`
- Backend tests: `cd backend && pytest`
- Backend migrations: `cd backend && alembic upgrade head`

## Coding conventions
- Keep the MVP realistic and readable.
- Prefer explicit route handlers and small service helpers over clever abstractions.
- Keep backend modules modular: auth, donors, requests, matches, chats, notifications, hospitals, blood_banks, institutions, reports, admin, uploads, cities, audit.
- Keep frontend responsive and card-friendly on small screens.
- Use simple readable code over over-engineering.
- Use descriptive names and avoid hidden business logic in UI components.

## Security rules
- Do not hardcode secrets.
- Do not commit `.env` files.
- Do not commit uploaded files.
- Keep uploaded document access behind backend authorization.
- Preserve role-based access control.
- Use migrations for database changes.
- Keep donor contact exposure limited to what the current role actually needs (phone numbers visible only in confirmed match/chat contexts).

## Authentication
- JWT (python-jose, HS256 algorithm) with `OAuth2PasswordBearer` token extraction from `Authorization: Bearer` header.
- `create_access_token(str(user.id))` generates tokens; `get_current_user` dependency decodes them and returns the user.
- Token expiry is configurable via `ACCESS_TOKEN_EXPIRE_MINUTES` (default 60).
- Passwords hashed with bcrypt via Passlib.
- Frontend stores token in auth context (in-memory) and attaches it to every API request.

## Do-not-do rules
- Do not add roadmap features unless explicitly requested.
- Do not add real SMS, WhatsApp, NADRA, payment, or hospital integrations in this MVP.
- Do not introduce Kubernetes, microservices, or other hosting complexity for this repo.
- Do not bypass migrations with ad hoc schema edits.
- Do not commit database dumps, local uploads, or generated secrets.

## Definition of done
- `docker compose up --build` starts frontend, backend, and PostgreSQL.
- Frontend opens at `http://localhost:5173`.
- Backend opens at `http://localhost:8000`.
- Backend docs are available at `/docs`.
- Users can register and log in.
- Donors can create profiles.
- Users can create blood requests and upload hospital slips.
- Admins can approve or reject requests and verify institutions.
- Matching by blood group and city works.
- Donors can accept or decline assigned matches (declined donors excluded from future matching).
- Request status updates properly.
- In-app notifications work.
- Basic admin dashboard works.
- Seed data is available.
- README is complete and professional.
- Future updates remain documented instead of implemented.
- Uploaded files and secrets stay out of version control.
- Basic tests exist and pass locally when dependencies are installed.

