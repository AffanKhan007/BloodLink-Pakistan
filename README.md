# BloodLink Pakistan

A production-style blood donation coordination platform for Pakistan that unifies donors, request creators, hospitals, blood banks, institution donors, and admins through a single-account identity model, verified request capture, automatic city-and-blood-group matching, real-time chat, role-based dashboards, Blood Radar map, donation drives, and a transparency & impact public page.

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
  <img src="https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=FFFFFF" alt="Leaflet" />
  <img src="https://img.shields.io/badge/OpenStreetMap-7FFF00?style=for-the-badge" alt="OpenStreetMap" />
  <img src="https://img.shields.io/badge/react--i18next-26A160?style=for-the-badge" alt="react-i18next" />
  <img src="https://img.shields.io/badge/Alembic%20Migrations-6C47FF?style=for-the-badge" alt="Alembic migrations" />
</p>

<p align="left">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=FFD43B" alt="Python" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=1F2328" alt="JavaScript" />
</p>

- **Frontend**: React + Vite + Lucide React + Leaflet / react-leaflet (OpenStreetMap tiles) + react-i18next for Urdu/English localization + custom CSS design system with animated focus rings, skew-based sidebar navigation effects, and a responsive card-friendly layout
- **Backend**: FastAPI with modular route handlers (auth, donors, requests, matches, chats, notifications, hospitals, blood banks, institutions, reports, admin, uploads, cities, blood_radar, notification_stubs)
- **Database**: PostgreSQL with SQLAlchemy ORM + Alembic migrations (13 migrations)
- **Real-time**: Redis-backed WebSocket chat via FastAPI WebSockets
- **Object storage**: MinIO for uploaded document storage
- **Infrastructure**: Docker Compose with frontend, backend, PostgreSQL, Redis, MinIO, worker, and scheduler services

## Problem statement

Blood donation coordination in Pakistan is often handled through scattered social media posts, informal WhatsApp groups, and unverifiable requests. This creates fake appeal risk, poor privacy practices, manual back-and-forth, and weak tracking once a donor is found.

## Solution

BloodLink provides a realistic MVP with a single-account identity model:

- **One account, optional capabilities**: Every user registers with a single `MEMBER` account and can optionally set up a donor profile, create blood requests, or do both — no separate donor/receiver registration.
- **Donor profiles** are city-based with blood group, availability status, last donation date, public/private visibility toggle, and optional lat/lng pin-drop location for the Blood Radar map.
- **Blood requests** include patient details, hospital, ward/room, urgency level, required-by date, supporting document upload, and a max 3 active requests per user limit.
- **Blood Radar** displays nearby blood banks, available donors, and upcoming donation drives on an interactive Leaflet/OpenStreetMap map with distance sorting.
- **Matching** runs automatically on city, blood-group compatibility, donor availability, and donation recency — excluding the request creator's own profile. CRITICAL urgency requests auto-route to the Blood Radar page after creation.
- **Donors accept or reject** assigned matches; request creators track confirmed donor counts and requester reputation scores.
- **Blood bank inventory** tracks units by blood group, component type, testing status, expiry, and storage location — with QR code identifiers and an automatic expiry scheduler.
- **Donation drives** let blood banks create community drives with event dates, target blood groups, capacity, and donor appointment scheduling.
- **Blood bank analytics** provide fulfillment rates, donation breakdowns, and expiry stats.
- **Hospital workspace** allows hospital staff to create and manage their own requests independently.
- **Institution donors** register through a separate verification flow and only become publicly visible after admin approval (with pending/rejected/suspended states).
- **Government Health Authority Verification** badge on blood banks — manually toggled by admins.
- **Transparency & Impact** public page showing real platform statistics.
- **Chat and notifications** keep coordination inside the platform, with WebSocket real-time messaging and mocked SMS/WhatsApp notification stubs.
- **Admins** act as the trust and moderation layer with analytics, audit logs, reports, system-wide visibility, and govt_verified badge toggling.

## MVP features

### Core platform
- User registration and login (single-account identity, no role picker)
- Institution donor self-registration with admin approval flow (pending, approved, rejected, suspended)
- Donor profile creation, availability toggle, and public/private visibility
- Blood request creation with hospital slip upload
- Max 3 active (pending/approved/matched) requests per user — enforced server-side
- Requester reputation badges on request cards (total requests, fulfilled count)
- Automatic donor matching by blood-group compatibility, city, availability, and donation recency
- Donor accept/decline flow for assigned matches (declined donors excluded from future matching)
- CRITICAL urgency requests auto-route to the Blood Radar map after creation
- Matched donors, public donors, blood banks, and institution discovery views

### Blood Radar & maps
- Blood Radar page (`/blood-radar`) with interactive Leaflet/OpenStreetMap map
- Nearby blood banks with available unit counts, sorted by distance (haversine formula)
- Available donors shown as anonymized pins (D-0001, etc.) with jittered coordinates for privacy
- Upcoming donation drives filtered by blood group compatibility
- Donor profile pin-drop location map (lat/lng selection via click on map)
- Location opt-in toggle — only opt-in donors appear on the radar

### Trust & verification
- Blood group verification badges on donor profiles (admin-toggled `blood_group_verified`)
- Reliability counters on donor profiles: `matches_accepted`, `matches_completed`, `matches_no_show`
- Government Health Authority Verified badge on blood banks (admin toggle, `govt_verified` boolean in DB)
- Institution approval workflow (pending → approved/rejected/suspended)
- Audit log tracking for admin actions

### Blood bank operations
- Blood bank inventory management with unit creation, testing status, expiry tracking, component types, and city-request visibility
- Blood bank request fulfillment workflow — blood banks can fulfill city-level requests from their inventory
- Donation drives with event dates, target blood groups, capacity, and donor appointment booking
- Appointment slot management (create slots, book, check-in, complete, no-show)
- Blood bank analytics page (donations by group, by month, fulfillment rate, expiry rate)
- Quick-stock bulk update endpoint
- QR code identifiers on blood units
- Blood unit auto-expiration scheduler (runs every 5 minutes, flips expired units)

### Transparency & impact
- Public transparency stats endpoint (`/api/v1/blood-banks/transparency-stats`) returning real data:
  - Total donors, fulfilled requests, blood banks, govt-verified banks
  - Institutions, blood units available, matches made, cities covered
  - Requester fulfillment rate, average reliability score

### Notifications & communication
- In-app notifications
- In-app messaging (WebSocket real-time chat) between matched parties
- WhatsApp share buttons with real `wa.me` deep links (pre-filled message)
- WhatsApp notification mock stub (`/api/v1/notification-stubs/whatsapp/send`)
- SMS notification mock stub (`/api/v1/notification-stubs/sms/send`)
- Hardcoded notification delivery log (`/api/v1/notification-stubs/delivery-log`)

### Localization & accessibility
- Urdu localization via react-i18next (`en.json` / `ur.json`)
- Language toggle in header ("English / اردو")
- RTL support via `dir="rtl"` on `<html>` when Urdu is active
- Noto Nastaliq Urdu Google Font loaded for Urdu mode
- Low-Data Mode toggle in user settings (mocked — persisted to localStorage, no real conditional rendering yet; intended for low-bandwidth environments in Pakistan)

### Dashboards & admin
- Admin dashboard with user, donor, request, match, report, and audit-log management
- Admin govt_verified toggle on blood bank cards
- Hospital staff workspace for hospital-originated requests
- Blood bank dashboard with inventory, drives, appointments, analytics, and city requests
- Institution workspace with status-based access control
- Reports (user-submitted) with pending/reviewed status

### Seed data
- 20 Lahore donors with real lat/lng coordinates across Gulberg, DHA, Johar Town, Model Town, and more
- 4 Lahore blood banks with lat/lng (Lahore Central, Mayo Hospital, Shaikh Zaid, Fatima Jinnah Medical)
- 3 donation drives (Gulberg community drive, Mayo Hospital drive, DHA community drive)
- 7 blood units seeded per bank per blood group (randomized stock)

### UI & infrastructure
- Responsive UI with reusable card system, badges, alerts, modals, empty/skeleton states, and crimson box-shadow glow focus/hover system
- Single-theme design system — no dark mode or theme switching
- API versioning at `/api/v1`
- Redis, MinIO, worker, and scheduler Docker services
- Docker Compose setup (frontend, backend, PostgreSQL, Redis, MinIO, worker, scheduler)

## Third-party integrations & mocked features

| Feature | Status | What's real | What's mocked/stubbed |
|---|---|---|---|
| SMS notifications | **Mocked** | Backend stub endpoint at `/api/v1/notification-stubs/sms/send` returns a delivery status response | No real SMS provider (Twilio/local). Delivery log at `/api/v1/notification-stubs/delivery-log` is hardcoded. |
| WhatsApp notifications | **Mocked** | `wa.me` deep links generated server-side in the stub endpoint at `/api/v1/notification-stubs/whatsapp/send` | No real WhatsApp Business API integration. |
| WhatsApp share buttons | **Real** | Real `wa.me` URLs open WhatsApp with a pre-filled message via `https://wa.me/{phone}?text={message}` | No server-side delivery tracking for share-button usage. |
| Government Health Authority Verification | **Manual** | Admin toggle on blood bank cards in admin panel. `govt_verified` boolean stored in DB. Public badge renders conditionally on blood bank cards. Audit log records toggle actions. | No real NADRA/government API integration. Verification is a manual admin action. |
| Email notifications | **Not started** | — | No email service configured. |
| Phone OTP verification | **Not started** | — | No Twilio/Authy integration. |
| NADRA identity verification | **Not started** | — | No CNIC verification API. |
| Payment gateway | **Not started** | — | — |
| Hospital HIS/LIS integration | **Not started** | — | — |
| Real production SMS/WhatsApp | **Not started** | — | — |
| Push notifications (FCM/APNs) | **Not started** | — | — |
| React Native mobile app | **Not started** | — | — |

## Localization (Urdu support)

BloodLink includes Urdu localization via `react-i18next`:

- **Translation files**: `en.json` (English) and `ur.json` (Urdu) in the frontend locale directory
- **Language toggle**: A toggle ("English / اردو") is available in the site header
- **RTL support**: When Urdu is active, the `<html>` element receives `dir="rtl"` for correct right-to-left text rendering
- **Font**: Noto Nastaliq Urdu Google Font is loaded for Urdu mode to provide proper Nastaliq script rendering
- **Coverage**: Landing page, request form, blood bank pages, notifications, and common UI buttons are translated
- **Partial coverage**: Not all pages are fully translated as of v1.1. Dashboard pages, admin views, and some modal flows still default to English. Translation completeness will improve in future releases.

## Low-Data Mode

A Low-Data Mode toggle is included in user settings for users on low-bandwidth connections (common in Pakistan's rural and semi-urban areas):

- **Toggle**: Found in user settings, persisted to `localStorage`
- **Current status**: **Mocked / display-only** — the toggle exists in the UI and persists the user's preference, but no real conditional rendering (e.g., hiding images, reducing animations, deferring loads) is implemented yet
- **Intended behavior**: Future versions will conditionally strip heavy assets, disable map tile preloading, reduce animation, and defer non-critical API calls when this mode is active

## Tech stack

- Frontend: React + Vite + Lucide React + Leaflet / react-leaflet (OpenStreetMap) + react-i18next + custom modern CSS design system
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
│   │   │                     # PublicFooter, SocialRow, RadarMap,
│   │   │                     # FilterToolbar, request/modals
│   │   ├── pages/
│   │   │   ├── public/        # Landing, About, HowItWorks,
│   │   │   │                  # BloodRadarPage, BloodBankBrowsePage,
│   │   │   │                  # BloodBankProfilePage
│   │   │   ├── auth/          # Login, Register, ForgotPassword
│   │   │   ├── dashboard/     # User dashboard
│   │   │   ├── donor/         # Donor dashboard, DonorProfilePage
│   │   │   │                  # (with _DonorLocationMap), MyMatches,
│   │   │   │                  # Notifications, DonorChat
│   │   │   ├── receiver/      # Receiver dashboard, CreateRequest,
│   │   │   │                  # MyRequests, RequestDetails,
│   │   │   │                  # MatchedDonors, AvailableDonors,
│   │   │   │                  # BloodBanksInCity, InstitutionsInCity,
│   │   │   │                  # ReceiverChat
│   │   │   ├── bloodbank/     # Blood bank dashboard, inventory,
│   │   │   │                  # CreateBloodUnit, BloodUnitDetail,
│   │   │   │                  # BloodBankDrives, BloodBankAppointments,
│   │   │   │                  # BloodBankAnalytics, BloodBankCityRequests,
│   │   │   │                  # BloodBankProfile
│   │   │   ├── hospital/      # Hospital dashboard, requests
│   │   │   ├── institution/   # Institution dashboard, profile,
│   │   │   │                  # messages, verification pages
│   │   │   └── admin/         # Admin dashboard, Users, Donors,
│   │   │                      # BloodRequests, Matches, Reports,
│   │   │                      # AuditLogs, BloodBanks, Institutions
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
│   │   ├── models/            # SQLAlchemy models (16+ tables)
│   │   ├── routes/            # auth, donors, requests, matches, chats,
│   │   │                     # notifications, notification_stubs,
│   │   │                     # hospitals, blood_banks, blood_radar,
│   │   │                     # institutions, reports, admin, uploads,
│   │   │                     # cities
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── services/          # matching, notifications, audit, chat_realtime
│   │   ├── utils/             # validators
│   │   ├── tests/             # pytest test suite
│   │   ├── main.py            # FastAPI app entry
│   │   ├── seed.py            # ~24 users, ~28 donors, 7 banks,
│   │   │                     # 3 drives, blood units, etc.
│   │   ├── worker.py          # Redis task worker
│   │   └── scheduler.py       # Blood unit auto-expiration scheduler
│   ├── alembic/               # Migration versions (13 migrations)
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
| `MEMBER` | Single account identity — can create a donor profile, submit blood requests, or both from one dashboard. This is the default registration role. |
| `ADMIN` | Full system-wide visibility: manages users, donors, requests, matches, reports, audit logs, institution approvals, and govt_verified badge toggling. |
| `SUPER_ADMIN` | Extended admin with platform-wide coordination. Same permissions as `ADMIN`. |
| `OPERATIONS_AGENT` | Focused operational view: manages blood requests and reports. |
| `HOSPITAL_ADMIN` / `HOSPITAL_STAFF` | Hospital-scoped workspace: creates and manages hospital-originated blood requests within the assigned hospital. |
| `BLOOD_BANK_ADMIN` / `BLOOD_BANK_STAFF` | Blood-bank-scoped workspace: manages inventory, blood unit lifecycle, testing status, donation drives, appointment slots, analytics, city-level request visibility, and request fulfillment. |
| `INSTITUTION_DONOR` | Organization-level account (university, NGO, blood society). Registers through a separate verification flow. Features unlock only after admin approval. |

## Permissions

- Every `MEMBER` can create a donor profile, manage their own blood requests (up to 3 active), view their matches, chat with matched parties, and discover public donors, blood banks, and approved institutions.
- Chat is available only between users connected through a valid request context (match, public donor, blood bank, or institution in the same city as the request).
- Hospital staff operate only within their assigned hospital.
- Blood bank staff operate only within their assigned blood bank, with access to inventory management, drives, appointments, analytics, city requests, and request fulfillment.
- Institution donors with `pending` status see only a verification progress screen. `rejected` institutions can correct and resubmit. `suspended` institutions lose all institution features until restored by admin. Only `approved` institutions appear in public listings and can use messaging.
- Admin can manage all users, donors, requests, matches, reports, audit logs, and institution approvals.
- Admin can approve, reject, or suspend institution accounts.
- Admin can toggle the `govt_verified` badge on blood banks (logged in audit trail).

## System workflow

1. A user creates an account (`MEMBER` role) or an institution submits a separate verification registration (`INSTITUTION_DONOR` role).
2. The user can optionally set up a donor profile (blood group, city, area, availability, public/private toggle, optional lat/lng pin-drop on map).
3. The user or hospital staff creates a blood request with a supporting hospital slip upload.
4. Requests start in `pending_review` status and require admin approval to activate matching. Users are limited to 3 simultaneously active requests.
5. Admin approves or rejects the request; approval triggers automatic match creation with compatible donors.
6. **CRITICAL urgency**: After creating a critical-urgency request, the user is auto-redirected to the Blood Radar map to find immediate help.
7. Matched donors receive in-app notifications and can accept or decline. Declined donors are excluded from future matching.
8. Admin reviews institution registrations and approves only legitimate organizations for public visibility.
9. Blood banks can view city-level requests and fulfill them directly from their inventory, decrementing available units.
10. Users can discover public donors, blood banks, and approved institutions in their request city.
11. Blood banks create donation drives; donors browse upcoming drives on the Blood Radar and book appointment slots.
12. Users track confirmed donor counts, message matched parties via real-time chat, and mark the request fulfilled.
13. Admins monitor users, reports, inventory visibility, audit history, and govt_verified status — with full moderation tools.

## Database tables

- `users` — single-account identity; stores `role` enum, `hospital_id` and `blood_bank_id` for scoped roles
- `donor_profiles` — blood group, city, area, age, gender, last donation date, availability, public visibility, verification status, health notes, lat/lng, location_opt_in, blood_group_verified, matches_accepted, matches_completed, matches_no_show
- `blood_requests` — patient name, blood group needed, units, hospital name, city, area, ward/room, urgency, required-by, status, attendant info, attachments
- `request_documents` — uploaded hospital slip files linked to a request
- `donation_matches` — links a donor to a request; status (pending, accepted, rejected, fulfilled) with timestamps
- `blood_banks` — name, city, area, contact, license, linked hospital, lat/lng, govt_verified, stock_update_frequency, public_stock_visible, accepts_walkins, operating_hours
- `blood_units` — unit code, QR code, blood group, component type, units available, collection/expiry dates, testing status, storage location, linked to donor and blood bank
- `blood_bank_donation_drives` — title, description, event date, start/end time, city, location address, target blood groups, expected capacity, status
- `blood_bank_donation_drive_registrations` — links a donor to a drive with registration status and timestamps
- `blood_bank_appointment_slots` — date, start/end time, max donors, booked count, status
- `blood_bank_appointments` — links a donor to a slot with booking status (booked, checked_in, completed, cancelled, no_show)
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
- Blood Radar: `GET /api/v1/blood-radar?blood_group=O%2B&city=Lahore&lat=31.52&lng=74.35` (auth required)
- Transparency stats: `GET /api/v1/blood-banks/transparency-stats` (public)
- Notification stubs:
  - `POST /api/v1/notification-stubs/sms/send` (auth required, mocked)
  - `POST /api/v1/notification-stubs/whatsapp/send` (auth required, mocked)
  - `GET /api/v1/notification-stubs/delivery-log` (auth required, hardcoded data)
- Admin govt_verified toggle: `PATCH /api/v1/blood-banks/{id}/admin/govt-verified` (admin only)

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
venv\Scripts\activate   # Windows
# source venv/bin/activate   # macOS/Linux
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
alembic revision --autogenerate -m "description"
alembic upgrade head
```

13 migrations as of v1.1, covering: initial tables, org/inventory foundation, blood bank elevation, trust & data freshness, blood radar location fields, govt_verified badge, and more.

## Seed data

Run `python -m app.seed` after `alembic upgrade head` to populate sample data.

### Counts

| Entity | Count | Notes |
|---|---|---|
| Cities | 8 | Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, Quetta |
| Users | ~24 | 1 admin, 1 hospital admin, 1 blood bank admin, 20 Lahore donors, 2 institution users, plus other members |
| Donor profiles | ~28 | 8 original + 20 seeded Lahore donors with lat/lng coordinates |
| Blood requests | 7 | 2 matched, 2 approved, 1 pending review, 1 rejected, 1 cancelled |
| Donation matches | 4 | 2 accepted, 1 pending, 1 rejected |
| Hospitals | 5 | Lahore, Karachi, Islamabad, Multan, Peshawar — all verified |
| Blood banks | 7 | 3 original (Lahore Central, Jinnah Karachi, PIMS Islamabad) + 4 seeded in Lahore (Lahore Central, Mayo Hospital, Shaikh Zaid, Fatima Jinnah Medical) |
| Blood units | ~150+ | ~10 original + seeded: 2–15 random units per blood group per Lahore bank (8 banks × 8 blood groups) |
| Donation drives | 3 | Gulberg community drive (3 days out), Mayo Hospital drive (7 days), DHA community drive (14 days) |
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
| `ali.donor@bloodlink.pk` | `Donor12345` | MEMBER (donor profile) |
| `sara.receiver@bloodlink.pk` | `Receiver12345` | MEMBER (request creator) |
| `ahmed.donor@bloodlink.pk` | `Donor12345` | MEMBER (Lahore seeded donor) |

All 20 Lahore seeded donors use password `Donor12345` and have real lat/lng coordinates across Gulberg III, DHA Phase 5, Johar Town, Model Town, Cantonment, and other Lahore areas.

### Institution approval note

- New institution registrations start as `pending` and see only a verification-progress screen.
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
- **Blood Radar page**: Full-width interactive Leaflet/OpenStreetMap map with blood bank markers (with available unit popups), donor pins (anonymized, jittered coordinates), and upcoming donation drive markers. Filtered by blood group and city from URL params.
- **Sidebar nav**: All nav links across every role use a skewX(-15deg) CTA-style button with a stagger-animated arrow SVG (three paths sliding from translateX offsets) and a color-pulse fill animation on hover. The effect uses hard box-shadow offsets that grow and change color on hover. The sidebar panel uses a warm-neutral background with inactive items in plain dark text and the active item in solid crimson with white text.
- **Social row**: A compact 3D-skew social media row (Facebook, Twitter, Instagram) appears in the public footer via `react-icons/fa`.
- **Footer**: Slim two-row layout — brand + tagline on the left, SocialRow on the right, copyright centered below.
- **Focus ring**: Global `:focus-visible` ring uses a soft crimson box-shadow glow at 3px spread with 180ms transition. `:focus:not(:focus-visible)` hides the ring on mouse clicks. All card hover states use the same crimson glow pattern with `:has()` guards to prevent nested-element stacking. Respects `prefers-reduced-motion: reduce`.
- **Govt-verified badge**: Blood bank cards conditionally render a green government-verification badge when `govt_verified` is true on the blood bank record.

## Validation and security notes

- Valid Pakistani mobile number format is enforced.
- Blood group values are limited to `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, and `O-`.
- Units required must be greater than zero.
- Donor age is constrained to a reasonable donation range.
- Last donation date cannot be in the future.
- Required-by date and time cannot be empty or in the past.
- Max 3 simultaneously active requests per user enforced server-side.
- Passwords are hashed with bcrypt through Passlib.
- Authentication uses JWT (python-jose) with HS256 signing. Tokens contain the user ID as the `sub` claim and are sent via `Authorization: Bearer <token>` header. FastAPI's `OAuth2PasswordBearer` extracts the token and `get_current_user` dependency decodes it to identify the requesting user.
- Uploaded files are stored on disk, not in PostgreSQL.
- Uploaded hospital slips are served only through authorized backend routes.
- Donor phone numbers are exposed only within confirmed match and chat contexts. Public donor listings do not include phone numbers.
- Blood Radar donor pins use anonymized IDs (`D-0001`) and jittered coordinates to protect donor privacy while still enabling proximity-based discovery.
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
- Blood Radar API (blood group + city + lat/lng filtering, haversine distance calculation)
- Transparency stats endpoint (real DB aggregation)
- Notification stubs (SMS send, WhatsApp send, delivery log)
- Admin govt_verified toggle
- Blood bank request fulfillment
- Donation drive creation and listing
- Appointment slot creation and booking
- Blood bank analytics endpoint
- Blood unit auto-expiration scheduler

Run:
```bash
cd backend
pytest
```

Manual frontend verification covers:
- Public landing, about, and how-it-works pages
- Blood Radar page with Leaflet map and donor/bank/drive pins
- Unified user dashboard, donor profile, matching, and request management
- Admin, hospital, blood bank, and institution dashboards
- Blood request creation with hospital slip upload and CRITICAL urgency auto-redirect
- Public donor, blood bank, institution, and chat flows
- Donation drives and appointment booking in blood bank dashboard
- Blood bank analytics page
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

### Version 1.1: Trust, maps & transparency (partially complete)
- Blood Radar with Leaflet/OpenStreetMap — **done**
- Donor pin-drop location map — **done**
- Blood unit auto-expiration scheduler — **done**
- Reliability counters on donor profiles — **done**
- Blood group verification badges — **done**
- Blood bank request fulfillment — **done**
- Donation drives and appointment scheduling — **done**
- Blood bank analytics — **done**
- Max 3 active requests per user — **done**
- Requester reputation on request cards — **done**
- CRITICAL urgency auto-route to Blood Radar — **done**
- Government Health Authority Verified badge (admin toggle) — **done**
- Transparency & Impact stats endpoint — **done**
- WhatsApp share buttons (wa.me deep links) — **done**
- WhatsApp/SMS notification stubs — **done**
- Notification stubs and delivery log — **done**
- Admin govt_verified toggle with audit log — **done**
- 20 seeded Lahore donors with lat/lng — **done**
- 4 seeded Lahore blood banks with lat/lng — **done**
- 3 seeded donation drives — **done**
- Urdu localization (react-i18next) — **partially started** (translation files and toggle exist, but coverage is incomplete across all pages)
- Low-Data Mode toggle — **partially started** (UI toggle exists and persists to localStorage, no real conditional rendering implemented)

### Version 1.2: Better notifications (partially started)
- Notification stubs built (SMS + WhatsApp mock endpoints) — **done**
- No real SMS provider (Twilio or local) integrated yet — **not started**
- No real WhatsApp Business API integrated yet — **not started**
- Email notifications — **not started**
- Emergency broadcast to verified donors — **not started**
- Per-user notification preferences — **not started**

### Version 1.3: Better verification
- Phone OTP verification
- CNIC upload with document review
- Donor health questionnaire
- Admin document review enhancements
- Fake request reporting improvements
- Enhanced audit logs with diff tracking

### Version 2: Platform intelligence
- Donor reliability scoring (counters exist; scoring formula not yet implemented)
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
