# BloodLink Pakistan

A production-style blood donation coordination platform for Pakistan that unifies donors, request creators, hospitals, blood banks, institution donors, and admins through a single-account identity model, verified request capture, automatic city-and-blood-group matching, real-time chat, and role-based dashboards.

## Built with

<p align="left">
  <img src="https://img.shields.io/badge/ReactJS-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="ReactJS" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=FFFFFF" alt="Vite" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=FFFFFF" alt="FastAPI" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=FFFFFF" alt="PostgreSQL" />
</p>

<p align="left">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=FFFFFF" alt="Docker" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=FFFFFF" alt="Redis" />
  <img src="https://img.shields.io/badge/MinIO-C72E49?style=for-the-badge&logo=minio&logoColor=FFFFFF" alt="MinIO" />
  <img src="https://img.shields.io/badge/SQLAlchemy-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=FFFFFF" alt="SQLAlchemy" />
</p>

<p align="left">
  <img src="https://img.shields.io/badge/Alembic%20Migrations-6C47FF?style=for-the-badge" alt="Alembic migrations" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=FFD43B" alt="Python" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=1F2328" alt="JavaScript" />
</p>

- **Frontend**: React + Vite + Lucide React + custom CSS design system with animated focus rings, skew-based sidebar navigation effects, and a responsive card-friendly layout
- **Backend**: FastAPI with modular route handlers (auth, donors, requests, matches, chats, notifications, hospitals, blood banks, institutions, reports, admin, uploads, cities)
- **Database**: PostgreSQL with SQLAlchemy ORM + Alembic migrations
- **Real-time**: Redis-backed WebSocket chat via FastAPI WebSockets
- **Object storage**: MinIO for uploaded document storage
- **Infrastructure**: Docker Compose with frontend, backend, PostgreSQL, Redis, MinIO, worker, and scheduler services

## Problem statement

Blood donation coordination in Pakistan is often handled through scattered social media posts, informal WhatsApp groups, and unverifiable requests. This creates fake appeal risk, poor privacy practices, manual back-and-forth, and weak tracking once a donor is found.

## Solution

BloodLink provides a realistic MVP with a single-account identity model:

- **One account, both roles**: Every user registers with a single `USER` account and can optionally set up a donor profile, create blood requests, or do both — no separate donor/receiver registration.
- **Donor profiles** are city-based with blood group, availability status, last donation date, and public/private visibility toggle.
- **Blood requests** include patient details, hospital, ward/room, urgency level, required-by date, supporting document upload.
- **Matching** runs automatically on city, blood-group compatibility, donor availability, and donation recency — excluding the request creator's own profile.
- **Donors accept or reject** assigned matches; request creators track confirmed donor counts.
- **Blood bank inventory** tracks units by blood group, component type, testing status, expiry, and storage location — with QR code identifiers.
- **Hospital workspace** allows hospital staff to create and manage their own requests independently.
- **Institution donors** register through a separate verification flow and only become publicly visible after admin approval (with pending/rejected/suspended states).
- **Chat and notifications** keep coordination inside the platform, with WebSocket real-time messaging.
- **Admins** act as the trust and moderation layer with analytics, audit logs, reports, and system-wide visibility.

## MVP features

- User registration and login (single-account identity, no role picker)
- Institution donor self-registration with admin approval flow (pending, approved, rejected, suspended)
- Donor profile creation, availability toggle, and public/private visibility
- Blood request creation with hospital slip upload
- Automatic donor matching by blood-group compatibility, city, availability, and donation recency
- Donor accept/decline flow for assigned matches (declined donors excluded from future matching)
- Matched donors, public donors, blood banks, and institution discovery views
- Blood bank inventory management with unit creation, testing status, expiry tracking, component types, and city-request visibility
- Hospital staff workspace for hospital-originated requests
- Institution donor workspace with status-based access control
- In-app messaging (WebSocket real-time chat) between matched parties
- In-app notifications
- Admin dashboard with user, donor, request, match, report, and audit-log management
- Reports (user-submitted) with pending/reviewed status
- Audit log tracking for admin actions (approve/reject donor, approve/reject request, etc.)
- Pakistan city seed data (8 cities, extensible)
- Search and filter flows for donors, requests, blood bank inventory, and institutions
- Responsive UI with reusable card system, badges, alerts, modals, empty/skeleton states, and crimson box-shadow glow focus/hover system
- Single-theme design system — no dark mode or theme switching
- API versioning at `/api/v1`
- Redis, MinIO, worker, and scheduler Docker services
- Docker Compose setup (frontend, backend, PostgreSQL, Redis, MinIO)

## Tech stack
- Frontend: React + Vite + Lucide React + custom modern CSS design system
- Backend: FastAPI
- Database: PostgreSQL
- Authentication: JWT (python-jose) + OAuth2PasswordBearer + bcrypt (Passlib)
- Cache / queue broker: Redis
- Object storage foundation: MinIO
- ORM and migrations: SQLAlchemy + Alembic
- Containerization: Docker + Docker Compose

## Project structure

```text
bloodlink-pakistan/
├── frontend/
│   ├── src/
│   │   ├── api/               # API client, request helpers
│   │   ├── auth/              # Auth context, token management
│   │   ├── components/        # Layout, PageTransition, PublicHeader,
│   │   │                     # PublicFooter, SocialRow, request/modals
│   │   ├── pages/
│   │   │   ├── public/        # Landing, About, HowItWorks
│   │   │   ├── auth/          # Login, Register
│   │   │   └── dashboard/     # User, Admin, Hospital, BloodBank,
│   │   │                      # Institution dashboards
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css         # Design system: tokens, cards, forms,
│   │                          # sidebar nav-skew effect, responsive
│   ├── public/
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── backend/
│   ├── app/
│   │   ├── core/              # Config, database, security, dependencies
│   │   ├── models/            # SQLAlchemy models (14 tables)
│   │   ├── routes/            # auth, donors, requests, matches, chats,
│   │   │                     # notifications, hospitals, blood_banks,
│   │   │                     # institutions, reports, admin, uploads, cities
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── services/          # matching, notifications, audit, chat_realtime
│   │   ├── tests/             # pytest test suite
│   │   ├── main.py            # FastAPI app entry
│   │   ├── seed.py            # 18 users, 8 donor profiles, 7 requests, etc.
│   │   ├── worker.py          # Redis task worker
│   │   └── scheduler.py       # Scheduled job runner
│   ├── alembic/               # Migration versions (5 migrations)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── docs/                      # Assets, image placeholders
├── docker-compose.yml         # 7 services (frontend, backend, db, redis,
│                              # minio, worker, scheduler)
├── .env.example
├── .gitignore
├── AGENTS.md
└── README.md
```

## User roles

| Role | Description |
|---|---|
| `USER` | Single account identity — can create a donor profile, submit blood requests, or both from one dashboard. This is the default registration role. |
| `ADMIN` | Full system-wide visibility: manages users, donors, requests, matches, reports, audit logs, and institution approvals. |
| `SUPER_ADMIN` | Extended admin with platform-wide coordination. Same permissions as `ADMIN`. |
| `OPERATIONS_AGENT` | Focused operational view: manages blood requests and reports. |
| `HOSPITAL_ADMIN` / `HOSPITAL_STAFF` | Hospital-scoped workspace: creates and manages hospital-originated blood requests within the assigned hospital. |
| `BLOOD_BANK_ADMIN` / `BLOOD_BANK_STAFF` | Blood-bank-scoped workspace: manages inventory, blood unit lifecycle, testing status, and city-level request visibility. |
| `INSTITUTION_DONOR` | Organization-level account (university, NGO, blood society). Registers through a separate verification flow. Features unlock only after admin approval. |

## Permissions

- Every `USER` can create a donor profile, manage their own blood requests, view their matches, chat with matched parties, and discover public donors, blood banks, and approved institutions.
- Chat is available only between users connected through a valid request context (match, public donor, blood bank, or institution in the same city as the request).
- Hospital staff operate only within their assigned hospital.
- Blood bank staff operate only within their assigned blood bank.
- Institution donors with `pending_approval` status see only a verification progress screen. `rejected` institutions can correct and resubmit. `suspended` institutions lose all institution features until restored by admin. Only `approved` institutions appear in public listings and can use messaging.
- Admin can manage all users, donors, requests, matches, reports, audit logs, and institution approvals.
- Admin can approve, reject, or suspend institution accounts.

## System workflow

1. A user creates an account (`USER` role) or an institution submits a separate verification registration (`INSTITUTION_DONOR` role).
2. The user can optionally set up a donor profile (blood group, city, availability, public/private toggle).
3. The user or hospital staff creates a blood request with a supporting hospital slip upload.
4. Requests start in `pending_review` status and require admin approval to activate matching.
5. Admin approves or rejects the request; approval triggers automatic match creation with compatible donors.
6. Matched donors receive in-app notifications and can accept or decline. Declined donors are excluded from future matching.
7. Admin reviews institution registrations and approves only legitimate organizations for public visibility.
7. Users can discover public donors, blood banks, and approved institutions in their request city.
8. Donors accept or decline assigned matches.
9. Users track confirmed donor counts, message matched parties via real-time chat, and mark the request fulfilled.
10. Admins monitor users, reports, inventory visibility, and audit history — with full moderation tools.

## Database tables

- `users` — single-account identity; stores `role` enum, `hospital_id` and `blood_bank_id` for scoped roles
- `donor_profiles` — blood group, city, area, age, gender, last donation date, availability, public visibility, verification status, health notes
- `blood_requests` — patient name, blood group needed, units, hospital name, city, area, ward/room, urgency, required-by, status, attendant info, attachments
- `request_documents` — uploaded hospital slip files linked to a request
- `donation_matches` — links a donor to a request; status (pending, accepted, rejected, fulfilled) with timestamps
- `blood_banks` — name, city, area, contact, license, linked hospital
- `blood_units` — unit code, QR code, blood group, component type, units available, collection/expiry dates, testing status, storage location, linked to donor and blood bank
- `hospitals` — name, city, area, address, phone, verification status
- `institutions` — type, city, area, contact person, blood groups, website, admin approval status
- `chats` — two participants linked to a request context
- `chat_messages` — sender, message text, timestamp
- `notifications` — user, title, message, read status
- `reports` — reporter, reported user, request, reason, status
- `audit_logs` — admin user, action, entity type/id, details
- `cities` — name, province, sort order

## API documentation
- FastAPI Swagger docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check: `GET /health`

## Environment variables
Copy the root template and then create service-local `.env` files if needed.

Root `.env.example`:
```env
DATABASE_URL=postgresql+psycopg://blood_user:blood_password@db:5432/blood_app
SECRET_KEY=change_this_secret
ACCESS_TOKEN_EXPIRE_MINUTES=60
BACKEND_CORS_ORIGINS=["http://localhost:5173"]
VITE_API_BASE_URL=http://localhost:8000
UPLOAD_DIR=/app/uploads
REDIS_URL=redis://redis:6379/0
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=bloodlink-private
```

Backend `.env.example` and frontend `.env.example` mirror the service-specific values required for local work.

## Local setup with Docker
1. Copy `.env.example` to `.env`.
2. Run:

```bash
docker compose up --build
```

Expected local URLs:
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:8000](http://localhost:8000)
- FastAPI docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- MinIO API: [http://localhost:9000](http://localhost:9000)
- MinIO Console: [http://localhost:9001](http://localhost:9001)

> **Note**: If Docker reports a DNS resolution error for apt / pip / npm during build, add `"dns": ["8.8.8.8", "1.1.1.1"]` to Docker Desktop's `daemon.json` and restart Docker.

## Local setup without Docker
### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
python -m venv venv
pip install -r requirements.txt
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload
```

### Database
Use either:
- Local PostgreSQL with a connection string matching `DATABASE_URL`
- The Docker PostgreSQL service from `docker compose up db -d`

## Database migrations
```bash
cd backend
alembic revision --autogenerate -m "initial tables"
alembic upgrade head
```

## Seed data

Run `python -m app.seed` after `alembic upgrade head` to populate sample data.

### Counts

| Entity | Count | Notes |
|---|---|---|
| Cities | 8 | Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, Quetta |
| Users | 18 | 1 admin, 1 hospital admin, 1 blood bank admin, 8 donor-profile users, 5 request-creator users, 2 institution users |
| Donor profiles | 8 | Various blood groups, cities, verification statuses (6 approved, 1 pending, 1 rejected) |
| Blood requests | 7 | 2 matched, 2 approved, 1 pending review, 1 rejected, 1 cancelled |
| Donation matches | 4 | 2 accepted, 1 pending, 1 rejected |
| Hospitals | 5 | Lahore, Karachi, Islamabad, Multan, Peshawar — all verified |
| Blood banks | 3 | Lahore Central, Jinnah (Karachi), PIMS (Islamabad) |
| Blood units | 5 | Available, testing pending, reserved, expired |
| Institutions | 2 | Punjab University Donor Society, Edhi Foundation — both approved |
| Chats | 2 | 3 messages each |
| Notifications | 7 | Across donors, request creators, and admin |
| Reports | 2 | 1 pending, 1 reviewed |
| Audit logs | 3 | Donor approve, donor reject, request approve |

### Test accounts

| Email | Password | Role |
|---|---|---|
| `admin@bloodlink.pk` | `Admin12345` | ADMIN |
| `hospital.admin@bloodlink.pk` | `Hospital12345` | HOSPITAL_ADMIN |
| `bloodbank.admin@bloodlink.pk` | `BloodBank12345` | BLOOD_BANK_ADMIN |
| `institution@bloodlink.pk` | `Institution12345` | INSTITUTION_DONOR |
| `edhi.institution@bloodlink.pk` | `Institution12345` | INSTITUTION_DONOR |
| `ali.donor@bloodlink.pk` | `Donor12345` | USER (donor profile) |
| `sara.receiver@bloodlink.pk` | `Receiver12345` | USER (request creator) |

All 8 donor users use password `Donor12345`. All 5 request creator users use password `Receiver12345`.

### Institution approval note

- New institution registrations start as `pending_approval` and see only a verification-progress screen.
- Only `approved` institutions appear in public listings and can use messaging.
- Admin can approve, reject, or suspend institutions.

## Backup and restore
Backup:
```bash
docker exec -t bloodlink-postgres pg_dump -U blood_user -d blood_app > backup.sql
```

Restore:
```bash
cat backup.sql | docker exec -i bloodlink-postgres psql -U blood_user -d blood_app
```

## Frontend UI notes

- **Public pages**: Landing, About, and How It Works pages use a clean stacked-card layout with hero stats, feature cards, step timeline, and testimonials — no icons in step cards, varied grid rhythm, sticky scroll-shrink header with backdrop blur.
- **Sidebar nav**: All nav links across every role use a skewX(-15deg) CTA-style button with a stagger-animated arrow SVG (three paths sliding from translateX offsets) and a color-pulse fill animation on hover. The effect uses hard box-shadow offsets that grow and change color on hover. The sidebar panel uses a warm-neutral background with inactive items in plain dark text and the active item in solid crimson with white text.
- **Social row**: A compact 3D-skew social media row (Facebook, Twitter, Instagram) appears in the public footer via `react-icons/fa`.
- **Footer**: Slim two-row layout — brand + tagline on the left, SocialRow on the right, copyright centered below.
- **Focus ring**: Global `:focus-visible` ring uses a soft crimson box-shadow glow at 3px spread with 180ms transition. `:focus:not(:focus-visible)` hides the ring on mouse clicks. All card hover states use the same crimson glow pattern with `:has()` guards to prevent nested-element stacking. Respects `prefers-reduced-motion: reduce`.

## Validation and security notes
- Valid Pakistani mobile number format is enforced.
- Blood group values are limited to `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, and `O-`.
- Units required must be greater than zero.
- Donor age is constrained to a reasonable donation range.
- Last donation date cannot be in the future.
- Required-by date and time cannot be empty or in the past.
- Passwords are hashed with bcrypt through Passlib.
- Authentication uses JWT (python-jose) with HS256 signing. Tokens contain the user ID as the `sub` claim and are sent via `Authorization: Bearer <token>` header. FastAPI's `OAuth2PasswordBearer` extracts the token and `get_current_user` dependency decodes it to identify the requesting user.
- Uploaded files are stored on disk, not in PostgreSQL.
- Uploaded hospital slips are served only through authorized backend routes.
- Donor phone numbers are exposed only within confirmed match and chat contexts. Public donor listings do not include phone numbers.
- `.env`, uploads, and generated local artifacts are ignored by Git.

## Testing
Basic backend tests cover:
- Health route
- Auth register and login flow
- Institution registration and approval-state access control
- Donor profile creation
- Blood request creation and auto-matching
- Matching service logic
- Public donor discovery
- Chat creation
- WebSocket chat delivery
- Admin approval route compatibility
- Hospital dashboard route
- Blood bank inventory summary route

Run:
```bash
cd backend
pytest
```

Manual frontend verification covers:
- Public landing, about, and how-it-works pages
- Unified user dashboard, donor profile, matching, and request management
- Admin, hospital, blood bank, and institution dashboards
- Blood request creation with hospital slip upload
- Public donor, blood bank, institution, and chat flows
- Responsive layout behavior across mobile and desktop widths
- Search and filter interactions for donor/request/inventory lists

## Deployment notes
Suggested future-friendly hosting options:
- Frontend: Vercel or Netlify
- Backend: Render, Railway, or a VPS
- Database: Supabase, Neon, Railway, or Docker PostgreSQL on a VPS
- File storage later: Supabase Storage, AWS S3, Cloudinary, or MinIO

This MVP intentionally avoids paid integrations and complex production orchestration. Docker Compose is used for realistic local development, not Kubernetes or microservices.

## Medical and legal disclaimer
This application is not a replacement for hospitals, licensed blood banks, medical screening, or transfusion approval. Final blood testing, crossmatching, and transfusion decisions must be handled by authorized hospitals or blood banks.

## Future updates / roadmap

### Version 1.1: Better verification
- Phone OTP verification
- CNIC upload with document review
- Donor health questionnaire
- Admin document review enhancements
- Fake request reporting improvements
- Enhanced audit logs with diff tracking

### Version 1.2: Better notifications
- SMS alerts via Twilio or local provider
- WhatsApp alerts
- Email notifications
- Emergency broadcast to verified donors
- Per-user notification preferences

### Version 2: Platform intelligence
- Donor reliability scoring
- Demand prediction by city / blood group
- Rare blood group registry
- Emergency heatmap
- Advanced analytics dashboard

### Version 3: Mobile app
- React Native + Expo
- Same FastAPI backend and PostgreSQL
- Push notifications (FCM / APNs)
- Camera or gallery upload for hospital slips
- GPS-based nearby requests

### Version 4: Supply chain
- Full blood unit movement history (donor → bank → hospital → patient)
- Donor-to-blood-bank traceability
- Blood bank-to-hospital allocation tracking
- Low-stock alerts per blood bank
- Expiry forecast dashboard

### Version 5: Integrations
- NADRA verification gateway
- Hospital system API integration (HIS / LIS)
- Third-party blood bank system integration
- Real production SMS / WhatsApp provider
- Payment gateway for institutional donors (optional)

## License
MIT. See [LICENSE](LICENSE).
