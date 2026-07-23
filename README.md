# BloodLink Pakistan

A blood donation coordination platform for Pakistan connecting donors, request creators, blood banks, institutions, and admins through a single-account identity model, automatic city-and-blood-group matching, a Blood Radar map, and role-based dashboards.

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

- **Frontend**: React + Vite + Lucide React + Leaflet/react-leaflet (OpenStreetMap tiles) + react-i18next for English/Urdu localization + custom CSS design system
- **Backend**: FastAPI with modular route handlers (auth, donors, requests, matches, chats, notifications, blood banks, institutions, reports, admin, uploads, cities, blood_radar, notification_stubs)
- **Database**: PostgreSQL with SQLAlchemy ORM + Alembic migrations (14 migrations)
- **Real-time**: Redis-backed WebSocket chat via FastAPI WebSockets
- **Object storage**: MinIO for uploaded document storage
- **Infrastructure**: Docker Compose with 7 services (frontend, backend, PostgreSQL, Redis, MinIO, worker, scheduler)

## Problem statement

Blood donation coordination in Pakistan is often handled through scattered social media posts, informal WhatsApp groups, and unverifiable requests. This creates fake appeal risk, poor privacy practices, manual back-and-forth, and weak tracking once a donor is found.

## Solution

BloodLink provides a realistic MVP with a single-account identity model:

- **One account, optional capabilities**: Every user registers with a single `MEMBER` account and can optionally set up a donor profile, create blood requests, or both — no separate donor/receiver registration.
- **Donor profiles** are city-based with blood group, availability status, last donation date, public/private visibility toggle, and optional lat/lng pin-drop location for the Blood Radar map.
- **Blood requests** include patient details, hospital, ward/room, urgency level, required-by date, supporting document upload, and a max 3 active requests per user limit enforced server-side.
- **Blood Radar** displays nearby blood banks, available donors, and upcoming donation drives on an interactive Leaflet/OpenStreetMap map with haversine distance sorting.
- **Matching** runs automatically on city, blood-group compatibility, donor availability, and donation recency — excluding the request creator's own profile. CRITICAL urgency requests auto-route to the Blood Radar page after creation.
- **Donors accept or reject** assigned matches; request creators track confirmed donor counts and requester reputation scores.
- **Blood bank inventory** tracks units by blood group, component type, testing status, expiry, and storage location — with QR code identifiers and an automatic expiry scheduler.
- **Donation drives** let blood banks create community drives with event dates, target blood groups, capacity, and donor appointment scheduling.
- **Blood bank analytics** provide fulfillment rates, donation breakdowns, and expiry stats.
- **Institution donors** register through a separate verification flow and only become publicly visible after admin approval (with pending/rejected/suspended states).
- **Government Health Authority Verification** badge on blood banks — a manually admin-toggled boolean above the standard approval status.
- **Transparency & Impact** public page showing real platform statistics aggregated from PostgreSQL.
- **Chat and notifications** keep coordination inside the platform, with WebSocket real-time messaging. Notification delivery (SMS/WhatsApp) is stubbed.
- **Urdu localization** via react-i18next with RTL support and a language toggle.
- **Admins** act as the trust and moderation layer with analytics, audit logs, reports, system-wide visibility, and institution/blood bank approval workflows.

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
- Government Health Authority Verified badge on blood banks (`govt_verified` boolean in DB, API endpoint exists; **no admin UI toggle implemented yet — toggling requires direct API calls or database access**)
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
- Public transparency stats endpoint (`GET /api/v1/blood-banks/transparency-stats`) returning real data:
  - Total donors, fulfilled requests, blood banks, govt-verified banks
  - Institutions, blood units available, matches made, cities covered
  - Requester fulfillment rate, average donor reliability score
- Transparency & Impact page at `/transparency` with stat cards and fulfillment metrics

### Notifications & communication
- In-app notifications (list, mark-read)
- In-app messaging (WebSocket real-time chat) between matched parties
- WhatsApp share buttons with real `wa.me` deep links on request cards and blood bank profiles
- SMS notification stub (`POST /api/v1/notification-stubs/sms/send`) — returns mocked delivery status
- WhatsApp notification stub (`POST /api/v1/notification-stubs/whatsapp/send`) — returns a `wa.me` deep link
- Notification delivery log (`GET /api/v1/notification-stubs/delivery-log`) — returns hardcoded mock data

### Localization & accessibility
- Urdu localization via react-i18next (`src/i18n/en.json` / `src/i18n/ur.json`)
- Language toggle in the dashboard sidebar header ("English / اردو") — **not available on public pages**
- RTL support via `dir="rtl"` on `<html>` when Urdu is active, with logical CSS properties for sidebar, page headers, and filters
- **Font**: Only the Inter Google Font is loaded. Noto Nastaliq Urdu is **not currently loaded** — Urdu text renders in the browser's default Nastaliq-capable font, which may not render correctly on all systems.
- Low-Data Mode toggle in notification settings (persisted to localStorage)

### Dashboards & admin
- Admin dashboard with user, donor, request, match, report, and audit-log management
- Blood bank dashboard with inventory, drives, appointments, analytics, and city requests
- Institution workspace with status-based access control
- Reports (user-submitted) with pending/reviewed status
- **Hospital workspace**: Frontend pages exist (`src/pages/hospital/`) but are **not routed** — dead code. No hospital-specific role exists in the current user-role enum.

### Seed data
- 20 Lahore donors with lat/lng coordinates across Gulberg III, DHA Phase 5, Johar Town, Model Town, Cantonment, and other Lahore areas
- 4 Lahore blood banks with lat/lng (Lahore Central, Mayo Hospital, Shaikh Zaid, Fatima Jinnah Medical)
- 3 donation drives (Gulberg community drive, Mayo Hospital drive, DHA community drive)
- Blood units seeded per bank per blood group (2–15 randomized units per group)
- 8 Pakistan cities (Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, Quetta)

### UI & infrastructure
- Responsive UI with reusable card system, badges, alerts, modals, empty/skeleton states, and crimson box-shadow glow focus/hover system
- Single-theme design system — no dark mode or theme switching
- API versioning at `/api/v1` (routes are also mounted at root level without the prefix)
- Redis, MinIO, worker, and scheduler Docker services alongside frontend, backend, and PostgreSQL

## Third-party integrations & mocked features

| Feature | Status | What is implemented | What is not implemented |
|---|---|---|---|
| SMS notifications | **Stubbed** | Backend stub endpoint at `/api/v1/notification-stubs/sms/send` returns a delivery-status JSON response. Delivery log at `/api/v1/notification-stubs/delivery-log` returns hardcoded entries. Notification settings page in the frontend shows SMS toggle and delivery history table. | No real SMS provider (Twilio, local Pakistani gateway) is integrated. The toggle and log are purely cosmetic — no messages are sent. |
| WhatsApp notifications | **Stubbed** | Backend stub at `/api/v1/notification-stubs/whatsapp/send` returns a `wa.me` deep link. Same settings/log UI as SMS. | No WhatsApp Business API integration. |
| WhatsApp share buttons | **Real** | `WhatsAppShareButton` component generates real `https://wa.me/?text=...` URLs with a pre-filled message (blood group, city) and opens WhatsApp in a new tab. Shown on approved/matched request cards. | No server-side delivery tracking for share-button usage. |
| Government Health Authority Verification | **Partial** | `govt_verified` boolean field on `blood_banks` table (migration 0013). Backend API endpoint `PATCH /api/v1/blood-banks/{id}/admin/govt-verified` (admin-only, audit-logged). `GovtVerifiedBadge` component renders a blue shield pill on public blood bank cards and Blood Radar results. | **No admin UI** — the `AdminBloodBanksPage.jsx` manages approval status (approve/reject/suspend) but has no toggle for `govt_verified`. Toggling requires direct API calls or database access. No real NADRA/government verification API. |
| Transparency & Impact | **Real** | `GET /api/v1/blood-banks/transparency-stats` computes stats from live PostgreSQL data. `/transparency` page renders 8 stat cards plus fulfillment rate and reliability score. | — |
| Email notifications | **Not started** | — | No email service configured. No registration verification, no password-reset email flow. |
| Phone OTP verification | **Not started** | — | No Twilio/Authy integration. |
| NADRA identity verification | **Not started** | — | No CNIC verification API. |
| Payment gateway | **Not started** | — | — |
| Hospital HIS/LIS integration | **Not started** | — | — |
| Push notifications (FCM/APNs) | **Not started** | — | — |
| React Native mobile app | **Not started** | — | — |

## Localization (Urdu support)

BloodLink includes Urdu localization via `react-i18next`:

- **Translation files**: `src/i18n/en.json` (English) and `src/i18n/ur.json` (Urdu) with 181 lines each covering nav, common, bloodGroup, request, bloodBank, radar, donor, notifications, transparency, settings, share, and landing keys.
- **Language toggle**: A toggle ("English / اردو") is in the dashboard sidebar top bar (`Layout.jsx`). It sets `dir="rtl"` and `lang="ur"` on `<html>`.
- **RTL support**: CSS rules under `[dir="rtl"]` adjust sidebar border, padding, text alignment, page header layout, and filter toolbar direction.
- **Font**: Only Inter is loaded via Google Fonts (`styles.css` line 1). **Noto Nastaliq Urdu is not loaded** — Urdu text renders in the browser's default font, which may not display Nastaliq script correctly on all systems.
- **Coverage**: Landing page, request form, blood bank pages, notification settings, Blood Radar, and common UI buttons are translated. Nav labels, donor/receiver/blood bank/dashboard page content, and admin views remain in English.
- **Partial coverage**: Not all pages are fully translated. Dashboard pages, admin views, modal flows, and most form labels still default to English.

## Low-Data Mode

A Low-Data Mode toggle is included in the notification settings page:

- **Toggle**: Found at `/notifications/settings`, persisted to `localStorage`, toggles the `low-data-mode` class on `<body>`.
- **Current behavior**: When active, the CSS **does** apply some real conditional rendering — it hides `.hero-section`, `.landing-hero-image`, and `.public-footer-social` elements, and disables all CSS animations/transitions (`animation-duration: 0s`, `transition-duration: 0s`).
- **What is not implemented**: No image stripping, no lighter API payloads, no conditional map-tile loading, no deferred non-critical API calls. The current implementation is a minimal subset of what a full low-data mode would provide.

## Tech stack

- Frontend: React + Vite + Lucide React + Leaflet/react-leaflet (OpenStreetMap) + react-i18next + custom CSS design system
- Backend: FastAPI
- Database: PostgreSQL
- Authentication: JWT (python-jose, HS256) + OAuth2PasswordBearer + bcrypt (Passlib)
- Cache / queue broker: Redis
- Object storage foundation: MinIO
- ORM and migrations: SQLAlchemy + Alembic
- Containerization: Docker + Docker Compose

## Project structure

```text
bloodlink-pakistan/
├── frontend/
│   ├── src/
│   │   ├── api/                  # API client (client.js)
│   │   ├── auth/                 # AuthContext (token management)
│   │   ├── i18n/                 # i18next setup, en.json, ur.json
│   │   ├── components/           # 25 shared components: Layout, PageTransition,
│   │   │                         # PublicHeader, PublicFooter, SocialRow,
│   │   │                         # RadarMap, FilterToolbar, RequestCard,
│   │   │                         # GovtVerifiedBadge, WhatsAppShareButton,
│   │   │                         # BloodGroupBadge, LowDataModeToggle, etc.
│   │   ├── pages/
│   │   │   ├── public/           # Landing, About, HowItWorks, LoginPage,
│   │   │   │                     # RegisterPage, RegisterBloodBankPage,
│   │   │   │                     # RegisterInstitutionPage, ForgotPasswordPage,
│   │   │   │                     # BloodRadarPage, BloodBankBrowsePage,
│   │   │   │                     # BloodBankProfilePage, TransparencyPage
│   │   │   ├── dashboard/        # DashboardPage, NotificationSettingsPage
│   │   │   ├── donor/            # DonorDashboardPage, DonorProfilePage,
│   │   │   │                     # _DonorLocationMap, MyMatchesPage,
│   │   │   │                     # NotificationsPage, DonorChatPage
│   │   │   ├── receiver/         # ReceiverDashboardPage, CreateRequestPage,
│   │   │   │                     # MyRequestsPage, RequestDetailsPage,
│   │   │   │                     # MatchedDonorsPage, AvailableDonorsPage,
│   │   │   │                     # BloodBanksInCityPage, InstitutionsInCityPage,
│   │   │   │                     # ReceiverChatPage
│   │   │   ├── bloodbank/        # BloodBankDashboardPage, BloodBankInventoryPage,
│   │   │   │                     # BloodBankCityRequestsPage, BloodBankDrivesPage,
│   │   │   │                     # BloodBankAppointmentsPage, BloodBankAnalyticsPage,
│   │   │   │                     # BloodBankProfilePage, BloodUnitDetailPage,
│   │   │   │                     # CreateBloodUnitPage (unrouted)
│   │   │   ├── institution/      # InstitutionDashboardPage, InstitutionProfilePage,
│   │   │   │                     # InstitutionMessagesPage, verification-pending,
│   │   │   │                     # rejected, suspended status pages
│   │   │   ├── hospital/         # HospitalDashboardPage, HospitalRequestsPage
│   │   │   │                     # (exist on disk but NOT routed in App.jsx — dead code)
│   │   │   └── admin/            # AdminDashboardPage, UsersPage, DonorsPage,
│   │   │                         # BloodRequestsPage, MatchesPage, ReportsPage,
│   │   │                         # AuditLogsPage, AdminBloodBanksPage,
│   │   │                         # AdminInstitutionsPage
│   │   ├── App.jsx               # All routing
│   │   ├── main.jsx              # Entry point (loads i18n first)
│   │   ├── styles.css            # Design system (3157 lines): tokens, cards,
│   │   │                         # forms, sidebar nav-skew, RTL rules, responsive
│   │   └── styles/theme.css
│   ├── public/
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── backend/
│   ├── app/
│   │   ├── core/                 # config.py, database.py, deps.py, security.py
│   │   ├── models/               # 15 SQLAlchemy model files (16+ tables)
│   │   ├── routes/               # 16 route modules: auth, donors, requests,
│   │   │                         # matches, chats, notifications, notification_stubs,
│   │   │                         # hospitals, blood_banks, blood_radar, institutions,
│   │   │                         # reports, admin, uploads, cities
│   │   ├── schemas/              # 14 Pydantic schema files
│   │   ├── services/             # 5 service modules: audit, chat_realtime,
│   │   │                         # matching, notifications, reports
│   │   ├── utils/                # validators.py (blood group, phone, upload checks)
│   │   ├── tests/                # conftest.py + test_api.py (16 tests)
│   │   ├── api/v1/               # api_router mounting 13 routers under /api/v1
│   │   ├── main.py               # FastAPI app entry
│   │   ├── seed.py               # 20 Lahore donors, 4 banks, 3 drives, 8 cities
│   │   ├── worker.py             # Stub — prints Redis URL, sleeps
│   │   └── scheduler.py          # Blood unit auto-expiration (every 5 min)
│   ├── alembic/                  # 14 migration files (0001–0013)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── docs/                         # images/ (Banner.png, screenshot.png)
├── docker-compose.yml            # 7 services: frontend, backend, db, redis,
│                                 # minio, worker, scheduler
├── .env.example
├── .gitignore
├── AGENTS.md
├── LICENSE                       # MIT
└── README.md
```

## User roles

| Role | Status | Description |
|---|---|---|
| `MEMBER` | **Active** | Single account identity — can create a donor profile, submit blood requests, or both. Default registration role. |
| `ADMIN` | **Active** | Full system-wide visibility: manages users, donors, requests, matches, reports, audit logs, institution approvals, and blood bank admin status. |
| `SUPER_ADMIN` | **Active** | Extended admin with platform-wide coordination. Same permissions as `ADMIN`. |
| `OPERATIONS_AGENT` | **Active** | Focused operational view: manages blood requests and reports. Included in admin role checks. |
| `BLOOD_BANK_ADMIN` | **Active** | Blood-bank-scoped workspace: manages inventory, blood unit lifecycle, donation drives, appointment slots, analytics, city-level request visibility, and request fulfillment. |
| `BLOOD_BANK_STAFF` | **Active** | Blood-bank-scoped workspace with access to inventory management and city requests (no drive or analytics access). |
| `INSTITUTION_DONOR` | **Active** | Organization-level account (university, NGO, blood society). Registers through a separate verification flow. Features unlock only after admin approval. |
| `AUDITOR` | **Defined, unused** | Role exists in the `UserRole` enum but no routes, dashboards, or permission checks reference it. Reserved for future use. |

**Note**: `HOSPITAL_ADMIN` and `HOSPITAL_STAFF` roles were removed in migration 0009. Hospital-scoped request management via a dedicated hospital workspace is **not implemented** in the current codebase.

## Permissions

- Every `MEMBER` can create a donor profile, manage their own blood requests (up to 3 active), view their matches, chat with matched parties, and discover public donors, blood banks, and approved institutions.
- Chat is available only between users connected through a valid request context (match, public donor, blood bank, or institution in the same city as the request).
- Blood bank staff operate only within their assigned blood bank, with access to inventory management and city requests. Blood bank admins additionally have access to drives, appointments, analytics, and profile management.
- Institution donors with `pending` status see only a verification progress screen. `rejected` institutions can correct and resubmit. `suspended` institutions lose all institution features until restored by admin. Only `approved` institutions appear in public listings and can use messaging.
- Admin can manage all users, donors, requests, matches, reports, audit logs, and institution approvals.
- Admin can approve, reject, or suspend institution and blood bank accounts.
- The `govt_verified` badge toggle on blood banks is only accessible via the backend API endpoint (`PATCH /api/v1/blood-banks/{id}/admin/govt-verified`) — no frontend admin UI exists for it.

## System workflow

1. A user creates an account (`MEMBER` role) or an institution submits a separate verification registration (`INSTITUTION_DONOR` role).
2. The user can optionally set up a donor profile (blood group, city, area, availability, public/private toggle, optional lat/lng pin-drop on map).
3. The user creates a blood request with a supporting hospital slip upload.
4. Requests start in `pending_review` status and require admin approval to activate matching. Users are limited to 3 simultaneously active requests.
5. Admin approves or rejects the request; approval triggers automatic match creation with compatible donors.
6. **CRITICAL urgency**: After creating a critical-urgency request, the user is auto-redirected to the Blood Radar map to find immediate help.
7. Matched donors receive in-app notifications and can accept or decline. Declined donors are excluded from future matching.
8. Admin reviews institution registrations and approves only legitimate organizations for public visibility.
9. Blood banks can view city-level requests and fulfill them directly from their inventory, decrementing available units.
10. Users can discover public donors, blood banks, and approved institutions in their request city.
11. Blood banks create donation drives; donors browse upcoming drives on the Blood Radar and book appointment slots.
12. Users track confirmed donor counts, message matched parties via real-time chat, and mark the request fulfilled.
13. Admins monitor users, reports, inventory visibility, and audit history — with full moderation tools.

## Database tables

| Table | Key columns |
|---|---|
| `users` | id, full_name, email, phone, password_hash, role (enum), hospital_id, blood_bank_id, is_active |
| `donor_profiles` | id, user_id, blood_group, city, area, age, gender, last_donation_date, availability_status, is_publicly_available, verification_status, health_notes, latitude, longitude, location_opt_in, blood_group_verified, matches_accepted, matches_completed, matches_no_show |
| `blood_requests` | id, created_by_user_id, patient_name, blood_group_needed, units_required, hospital_name, city, area, ward_room, urgency, required_by, status, attendant_name, attendant_phone |
| `request_documents` | id, request_id, file_path, original_filename, uploaded_at |
| `donation_matches` | id, request_id, donor_profile_id, status, accepted_at, rejected_at, fulfilled_at |
| `blood_banks` | id, name, hospital_id, city, area, contact_number, email, address, latitude, longitude, license_number, contact_person_name, contact_person_cnic, operating_hours, description, logo_url, public_stock_visible, accepts_walkins, verification_status, verified_at, last_verified_by_admin_id, stock_update_frequency, govt_verified |
| `blood_units` | id, unit_code, qr_code_value, donor_profile_id, blood_bank_id, blood_group, units_available, component_type, collected_at, expires_at, testing_status, status, storage_location |
| `inventory_movements` | id, blood_unit_id, from_blood_bank_id, to_blood_bank_id, issued_to_hospital_id, movement_type, movement_time, performed_by, notes |
| `blood_bank_donation_drives` | id, blood_bank_id, title, description, event_date, start_time, end_time, city, location_address, target_blood_groups, expected_capacity, status |
| `blood_bank_donation_drive_registrations` | id, drive_id, donor_profile_id, status, registered_at, cancelled_at |
| `blood_bank_appointment_slots` | id, blood_bank_id, date, start_time, end_time, max_donors, booked_count, status |
| `blood_bank_appointments` | id, slot_id, donor_profile_id, status, booked_at, checked_in_at, completed_at, cancelled_at |
| `hospitals` | id, name, city, area, address, phone, verification_status |
| `institutions` | id, user_id, institution_name, institution_type, city, area, contact_person, contact_person_designation, email, phone, address, website_social_link, proof_document_url, status, rejection_reason, approved_at, approved_by_user_id, operating_hours, available_blood_groups, notes |
| `chats` | id, participant_one_id, participant_two_id, request_id, created_at |
| `chat_messages` | id, chat_id, sender_id, message, sent_at |
| `notifications` | id, user_id, title, message, is_read, created_at |
| `reports` | id, reporter_id, reported_user_id, request_id, reported_type, report_reason, description, status, reviewed_by_user_id, reviewed_at, resolution_notes |
| `audit_logs` | id, admin_user_id, action, entity_type, entity_id, details |
| `cities` | id, name, province, sort_order |

## API documentation

- FastAPI Swagger docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check: `GET /health`
- All routes are available at both root level (`/auth/login`) and under the `/api/v1` prefix (`/api/v1/auth/login`)

Key public endpoints:

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/blood-radar?blood_group=O%2B&city=Lahore&lat=31.52&lng=74.35` | Required | Blood Radar search (haversine distance) |
| `GET` | `/api/v1/blood-banks/transparency-stats` | None | Public transparency & impact stats |
| `GET` | `/api/v1/blood-banks/public` | None | Public blood bank listing |
| `GET` | `/api/v1/blood-banks/public/{id}` | None | Public blood bank profile |
| `POST` | `/api/v1/notification-stubs/sms/send` | Required | SMS stub (mocked) |
| `POST` | `/api/v1/notification-stubs/whatsapp/send` | Required | WhatsApp stub (mocked) |
| `GET` | `/api/v1/notification-stubs/delivery-log` | Required | Delivery log (hardcoded) |
| `PATCH` | `/api/v1/blood-banks/{id}/admin/govt-verified` | Admin only | Toggle govt_verified badge |

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

14 migrations as of v1.1, covering: initial tables, org/inventory foundation, messaging, institution approval and verification, reports moderation, user-role rename, hospital role removal, blood bank elevation, blood radar location fields, trust & data freshness, and govt_verified badge.

## Seed data

Run `python -m app.seed` after `alembic upgrade head` to populate sample data.

### Counts

| Entity | Count | Notes |
|---|---|---|
| Cities | 8 | Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, Quetta |
| Users | ~22 | 20 Lahore donors + 2 institution users. Admin users are preserved from prior manual creation — the seed does not create new admin accounts. |
| Donor profiles | 20 | All in Lahore with lat/lng coordinates across Gulberg III, DHA Phase 5, Johar Town, Model Town, Cantonment, etc. |
| Blood requests | 0 seeded | Requests are created through the app, not seed data. |
| Donation matches | 0 seeded | Matches are created when requests are approved. |
| Hospitals | 1 seeded | Services Hospital Lahore (verification_status="verified") |
| Blood banks | 4 | All in Lahore: Lahore Central, Mayo Hospital, Shaikh Zaid, Fatima Jinnah Medical |
| Blood units | ~200+ | 2–15 random units per blood group per bank (4 banks × 8 blood groups) |
| Donation drives | 3 | Gulberg community (3 days out), Mayo Hospital (7 days), DHA community (14 days) |
| Institutions | 2 | Punjab University Donor Society (Lahore, approved), Edhi Foundation Blood Bank (Karachi, approved) |
| Chats | 0 seeded | Created through the app. |
| Notifications | 0 seeded | Created through the app. |
| Reports | 0 seeded | Created through the app. |
| Audit logs | 0 seeded | Created through the app. |

### Test accounts

| Email | Password | Role | Notes |
|---|---|---|---|
| `admin@bloodlink.pk` | `Admin12345` | ADMIN | Must be created manually or exist before seed — seed preserves admin users |
| `bloodbank.admin@bloodlink.pk` | `BloodBank12345` | BLOOD_BANK_ADMIN | Same as above |
| `institution@bloodlink.pk` | `Institution12345` | INSTITUTION_DONOR | Created by seed |
| `edhi.institution@bloodlink.pk` | `Institution12345` | INSTITUTION_DONOR | Created by seed |
| `ahmed.donor@bloodlink.pk` | `Donor12345` | MEMBER | Created by seed (Lahore donor) |

All 20 Lahore seeded donors use password `Donor12345` and have real lat/lng coordinates.

> **Note**: The seed script preserves existing admin users and deletes/recreates all other data. Running the seed is destructive to donor profiles, blood requests, matches, chats, and notifications.

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

- **Public pages**: Landing, About, and How It Works pages use a stacked-card layout with hero stats, feature cards, and a step timeline. No icons in step cards. Sticky scroll-shrink header with backdrop blur.
- **Blood Radar page**: Full-width interactive Leaflet/OpenStreetMap map with blood bank markers (red, with available unit popups), donor pins (blue, anonymized with jittered coordinates), and donation drive markers (green). Filtered by blood group and city.
- **Sidebar nav**: Nav links use a skewX(-15deg) CTA-style button with a stagger-animated arrow SVG and a color-pulse fill animation on hover. Active item uses solid crimson background with white text.
- **Social row**: Facebook, Twitter, Instagram icons via `react-icons/fa` in the public footer. Links are placeholder `#` hrefs.
- **Footer**: Slim layout — brand + tagline on left, link to Transparency & Impact page, SocialRow, copyright centered below.
- **Focus ring**: Global `:focus-visible` ring uses a soft crimson box-shadow glow at 3px spread with 180ms transition. Card hover states use the same crimson glow pattern. Respects `prefers-reduced-motion: reduce`.

## Validation and security notes

- Valid Pakistani mobile number format is enforced.
- Blood group values are limited to `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, and `O-`.
- Units required must be greater than zero.
- Donor age is constrained to a reasonable donation range.
- Last donation date cannot be in the future.
- Required-by date and time cannot be empty or in the past.
- Max 3 simultaneously active requests per user enforced server-side.
- Passwords are hashed with bcrypt through Passlib.
- Authentication uses JWT (python-jose) with HS256 signing. Tokens contain the user ID as the `sub` claim and are sent via `Authorization: Bearer <token>` header. FastAPI's `OAuth2PasswordBearer` extracts the token and `get_current_user` dependency decodes it.
- Uploaded files are stored on disk, not in PostgreSQL.
- Uploaded hospital slips are served only through authorized backend routes.
- Donor phone numbers are exposed only within confirmed match and chat contexts. Public donor listings do not include phone numbers.
- Blood Radar donor pins use anonymized IDs (`D-0001`) and jittered coordinates to protect donor privacy.
- `.env`, uploads, and generated local artifacts are ignored by Git.
- No rate limiting on auth endpoints (login, registration).
- No email verification on registration.

## Testing

Backend tests cover:

- Health route
- Auth register and login flow
- Institution registration and approval-state access control
- Donor profile creation
- Blood request creation and auto-matching
- Matching service logic (compatible groups)
- Self-exclusion (request creator's own donor profile excluded from matches)
- Public donor discovery
- Chat creation
- WebSocket chat delivery
- Institution directory exclusion of unapproved institutions
- Admin institution approval
- Institution rejection and resubmission
- Admin request approval
- Blood bank inventory summary

Run:
```bash
cd backend
pytest
```

**Note**: Tests use an in-memory SQLite database, not PostgreSQL. Some features (like the auto-expiration scheduler) are not covered by the test suite.

## Deployment notes

Suggested future hosting options:
- Frontend: Vercel or Netlify
- Backend: Render, Railway, or a VPS
- Database: Supabase, Neon, Railway, or Docker PostgreSQL on a VPS
- File storage later: Supabase Storage, AWS S3, Cloudinary, or MinIO

This MVP avoids paid integrations and production orchestration. Docker Compose is used for local development.

## Medical and legal disclaimer

This application is not a replacement for hospitals, licensed blood banks, medical screening, or transfusion approval. Final blood testing, crossmatching, and transfusion decisions must be handled by authorized hospitals or blood banks.

## Future updates / roadmap

### Version 1.1: Trust, maps & transparency — partially complete

**Done:**
- Blood Radar with Leaflet/OpenStreetMap — interactive map with haversine distance sorting, blood bank markers, anonymized donor pins, and donation drive markers
- Donor pin-drop location map — click-to-set lat/lng on a Leaflet map in the donor profile page
- Blood unit auto-expiration scheduler — background job in `scheduler.py` running every 5 minutes, flipping expired units to `EXPIRED` status
- Reliability counters on donor profiles — `matches_accepted`, `matches_completed`, `matches_no_show` fields updated on match accept/complete/reject
- Blood group verification badges — admin-toggled `blood_group_verified` boolean on donor profiles, rendered as a `BloodGroupBadge` component (verified vs. self-reported)
- Blood bank request fulfillment — blood banks can fulfill city-level requests from their inventory via `POST /api/v1/blood-requests/{id}/fulfill`
- Donation drives and appointment scheduling — full CRUD for drives, slot creation, booking, check-in, and completion
- Blood bank analytics — `GET /api/v1/blood-banks/me/analytics` returning donations by blood group, by month, fulfillment rate, and expiry rate
- Max 3 active requests per user — enforced in `POST /api/v1/requests`
- Requester reputation on request cards — total requests and fulfilled count shown on `RequestCard`
- CRITICAL urgency auto-route to Blood Radar — after creating a critical request, user is redirected to `/blood-radar`
- Government Health Authority Verified badge — backend API endpoint and public `GovtVerifiedBadge` component (**no admin frontend UI for toggling**)
- Transparency & Impact stats — real PostgreSQL aggregation endpoint and `/transparency` page
- WhatsApp share buttons — real `wa.me` deep links on request cards
- Notification stubs — mocked SMS/WhatsApp send endpoints and delivery log
- 20 seeded Lahore donors with lat/lng + 4 seeded Lahore blood banks + 3 donation drives

**Partially done:**
- Urdu localization — translation files and toggle exist, but coverage is incomplete across all pages and no Nastaliq font is loaded
- Low-Data Mode — toggle exists and applies some CSS hiding/animation disabling, but no real payload reduction

**Not started:**
- Admin UI for `govt_verified` toggle (API exists, no frontend widget)

### Version 1.2: Better notifications — partially started

**Done:**
- Notification stub endpoints for SMS and WhatsApp (mocked send + delivery log)
- Notification settings page with toggle UI

**Not started — blocked on paid provider accounts:**
- Real SMS via Twilio or a local Pakistani gateway — requires signing up for a Twilio account (or equivalent), provisioning a Pakistani phone number, storing API keys as environment config, and implementing the actual send call. The backend would need a new `sms_logs` table (id, recipient_phone, request_id, message_content, status, created_at) with an Alembic migration, a `send_sms()` function in `services/` that wraps the provider SDK, and a scheduled job in `scheduler.py` that checks for unaccepted matches after N minutes and triggers escalation.
- Real WhatsApp via WhatsApp Business API — requires Meta Business verification, a WhatsApp Business account, and API token. Implementation would follow the same pattern as SMS: a `whatsapp_logs` table, a `send_whatsapp()` service function, and a scheduler job.
- Email notifications — requires an SMTP provider (e.g., Resend, SendGrid) or direct SMTP credentials. A new `email_logs` table and `send_email()` service function would be needed, plus template rendering for registration verification, password reset, and request status updates.
- Per-user notification preferences — would extend the `users` table with a JSON preferences column or a new `notification_preferences` table to let users toggle SMS/email/push per notification type (match alerts, request updates, drive reminders).
- Emergency broadcast to verified donors — requires a new `broadcast` endpoint that queries all available, verified donors in a city and fans out notifications.

### Version 1.3: Better verification — not started

- **Phone OTP verification**: Requires an SMS gateway (same provider dependency as 1.2). Implementation: a `phone_otps` table (user_id, otp_hash, expires_at, verified), a `POST /auth/request-otp` endpoint that generates a 6-digit code, hashes it, stores it, and sends via SMS, and a `POST /auth/verify-otp` endpoint that compares the submitted OTP against the hash. Users cannot complete registration until phone is verified.
- **CNIC upload with document review**: Requires a `cnic_documents` table (user_id, front_image_url, back_image_url, status, reviewed_by, reviewed_at) with an Alembic migration. Upload flow reuses the existing MinIO storage backend. Admin review UI would extend `AdminDashboardPage` with a document review queue.
- **Donor health questionnaire**: A new `donor_health_questionnaires` table linked to `donor_profiles` (donor_id, question_key, answer, answered_at). A multi-step form component in the donor profile flow. Questions would cover recent illness, medications, travel history, and pregnancy status — standard pre-donation screening.
- **Admin document review enhancements**: Extends the existing reports module with document preview, side-by-side comparison, and batch approval workflows.
- **Fake request reporting improvements**: Currently basic (report form + status tracking). Would add auto-flagging rules (e.g., multiple requests from same IP/phone), reporter reputation scoring, and admin triage queue.
- **Enhanced audit logs with diff tracking**: Currently stores a string `details` field. Would add a `previous_state` and `new_state` JSON pair to `audit_logs` for before/after comparison, queryable by admin.

### Version 2: Platform intelligence — not started

- **Donor reliability scoring**: Reliability counters already exist (`matches_accepted`, `matches_completed`, `matches_no_show`). A scoring formula would weight response rate (accepted/matches_offered), completion rate (completed/accepted), and recency of last donation. Computed as a materialized view or cached field on `donor_profiles`, updated by a scheduled job in `scheduler.py` after each match state change.
- **Demand prediction by city / blood group**: Would aggregate `blood_requests` by city, blood_group, and month to produce a demand heatmap. Implementation: a scheduled job that runs a `GROUP BY city, blood_group, date_trunc('month', created_at)` query on `blood_requests`, stores results in a `demand_forecasts` table, and serves them via a new `GET /api/v1/analytics/demand` endpoint.
- **Rare blood group registry**: A new `rare_blood_groups` table or a boolean flag on `donor_profiles`. Would add a search filter to the Blood Radar for rare types (AB-, O-, B-) and a dedicated public listing page.
- **Emergency heatmap**: An aggregated view of active requests by city and blood group, rendered as a color-coded map layer on Leaflet. Would use a new `GET /api/v1/blood-radar/heatmap` endpoint that groups pending/approved requests by city coordinates and blood group.

### Version 3: Mobile app — not started

- **React Native + Expo**: Reuses the existing FastAPI backend and PostgreSQL database as-is. All API endpoints are already HTTP/JSON. The main work is rebuilding the UI in React Native components.
- **Push notifications (FCM/APNs)**: Requires a `device_tokens` table (user_id, platform, token, created_at) and a push-notification service module in the backend using `firebase-admin` (FCM) or `apns-client` (APNs). A scheduled job would check for new matches and push to registered devices.
- **Camera/gallery upload for hospital slips**: Same MinIO storage backend. React Native's `expo-image-picker` or `expo-document-picker` for capture, then multipart upload to the existing `POST /api/v1/requests/{id}/upload-document` endpoint.
- **GPS-based nearby requests**: Uses the device's GPS to call `GET /api/v1/blood-radar` with the user's current coordinates, same as the web implementation.

### Version 4: Supply chain — not started

- **Full blood unit movement history**: Extend `inventory_movements` with additional fields (`hospital_id`, `patient_reference`, `issued_by`, `received_by`) or create a new `blood_unit_chain` table to track each handoff: donor → blood bank (collection), blood bank → hospital (issuance), blood bank → blood bank (transfer).
- **Donor-to-blood-bank traceability**: Currently `blood_units.donor_profile_id` links a unit to its donor. A more complete chain would add donor donation timestamps, collection events, and screening results.
- **Blood bank-to-hospital allocation tracking**: A new `hospital_allocations` table (blood_bank_id, hospital_id, blood_group, units, allocation_date, fulfilled) with a scheduled aggregation job.
- **Low-stock alerts per blood bank**: A scheduled job in `scheduler.py` that queries `blood_units` grouped by `blood_bank_id` and `blood_group`, flags any group below a configurable threshold (e.g., 5 units), creates `notifications` for blood bank admins, and optionally exposes a `GET /api/v1/blood-banks/me/alerts` endpoint.
- **Expiry forecast dashboard**: Extend the blood bank analytics endpoint with a 30/60/90-day expiry projection based on `expires_at` distribution in `blood_units`.

### Version 5: Integrations — not started

- **NADRA verification gateway**: Would replace the current `verification_status` string field on institutions with a real identity check. Requires NADRA API access (government-issued, not publicly available for MVPs). Implementation: a `verification_requests` table (entity_type, entity_id, nadra_reference, status, verified_at), a `services/nadra.py` module wrapping the NADRA REST API, and a callback webhook endpoint.
- **Hospital HIS/LIS integration**: Would allow hospitals to push blood request orders and receive transfusion results via HL7/FHIR APIs. Requires a hospital-facing API layer (separate auth, rate limiting) and a new `hospital_integrations` table tracking connected hospitals and their webhook endpoints.
- **Government Health Authority tie-in**: The current `govt_verified` boolean would evolve into a real integration with provincial health department verification registries. Implementation: a scheduled job that queries a government API for blood bank licensing status and auto-updates `govt_verified`, plus an audit trail of verification syncs.
- **Real production SMS / WhatsApp**: See Version 1.2 above for full implementation plan.
- **Payment gateway**: Scoped to institutional donor accounts (e.g., paid drive registrations or priority matching). Would require a `payments` table (entity_type, entity_id, amount, currency, provider_reference, status, created_at) and integration with a provider like Stripe or a local Pakistani gateway (e.g., JazzCash, Sadad). Optional — not core to the donation workflow.

## Known gaps / TODO

### Bugs
- [ ] **Seed script crashes on blood unit creation** — `seed.py` uses `units_reserved` and `expiry_date` fields that do not exist on the `BloodUnit` model (the model has `expires_at` and no `units_reserved` column). Running `python -m app.seed` will fail at the blood-unit insertion step.
- [ ] **Missing `Phone` import in `BloodBankProfilePage.jsx`** — `src/pages/public/BloodBankProfilePage.jsx` uses `<Phone>` for the "Show contact" button but does not import it from `lucide-react`. This will cause a runtime error when the button is clicked.
- [ ] **Seed hospital uses `verification_status="verified"`** — the string `"verified"` is not a standard status value in the codebase. Blood banks use `"approved"` in route logic. The column is a plain `String(40)` so it doesn't error, but it is inconsistent.

### Dead code
- [ ] `src/pages/hospital/HospitalDashboardPage.jsx` and `HospitalRequestsPage.jsx` exist on disk but are not imported or routed in `App.jsx`.
- [ ] `src/pages/bloodbank/CreateBloodUnitPage.jsx` exists on disk but is not imported or routed in `App.jsx`.
- [ ] `UserRole.AUDITOR` is defined in the enum but never checked by any route or permission guard.
- [ ] `app/worker.py` is a stub (prints Redis URL, sleeps forever) — not connected to any actual job processing.

### Missing features / incomplete implementations
- [ ] No admin UI for `govt_verified` toggle — backend API exists but `AdminBloodBanksPage.jsx` does not expose it.
- [ ] Noto Nastaliq Urdu font is not loaded — only Inter is imported. Urdu text may not render correctly in Nastaliq script on all systems.
- [ ] Language toggle only in dashboard sidebar, not on public pages (landing, about, how-it-works, login, register).
- [ ] No dark mode or theme switching.
- [ ] No rate limiting on auth endpoints (login, registration).
- [ ] No email verification on registration.
- [ ] Social media links in footer are placeholder `#` hrefs.
- [ ] Hospital workspace pages exist but are not functional (no routes, no `HOSPITAL_ADMIN` role).
- [ ] `CreateBloodUnitPage.jsx` is dead code — blood unit creation is handled within `BloodBankInventoryPage.jsx`.

### Infrastructure
- [ ] No `.dockerignore` files — node_modules and `.git` are copied into Docker build contexts.
- [ ] Both Dockerfiles run as root — no non-root `USER` directive.
- [ ] `worker.py` is a stub — no actual background job processing.
- [ ] No production Dockerfiles or multi-stage builds.
- [ ] `docker-compose.yml` contains hardcoded database and MinIO credentials.
- [ ] Duplicate `npm install` — `frontend/Dockerfile` runs it and `docker-compose.yml` runs it again.

## License

MIT. See [LICENSE](LICENSE).
