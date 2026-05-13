# Shore Crisis Management — Build & Execution Guide

## Prerequisites

| Tool       | Version | Install |
|------------|---------|---------|
| Node.js    | 20+     | `brew install node` |
| PostgreSQL | 15+     | `brew install postgresql@16` |
| Docker     | 24+     | [Docker Desktop](https://docker.com/products/docker-desktop) (optional, for containerized deploy) |

---

## Option A: Local Development

### 1. Start PostgreSQL

```bash
# Start the service
brew services start postgresql@16

# Create the database and user
psql postgres -c "CREATE USER shore_user WITH PASSWORD 'shore_pass';"
psql postgres -c "CREATE DATABASE shore_crisis OWNER shore_user;"
```

### 2. Configure Environment

```bash
# From project root
cp .env.example .env

# Edit .env — the defaults work for local dev, but review:
#   DATABASE_URL   → matches the DB you just created
#   JWT_SECRET     → change to any random string
#   OWNER_EMAIL    → Tyrin's login (Shorecrisis35@gmail.com)
#   OWNER_PASSWORD → owner's login password
#   ADMIN_EMAIL    → your admin login
#   ADMIN_PASSWORD → your admin password
```

### 3. Install Dependencies

```bash
npm run install:all
```

This runs `npm install` in the root, `client/`, and `server/` directories.

### 4. Start the Dev Servers

```bash
npm run dev
```

This uses `concurrently` to start both:
- **Client** → http://localhost:5173 (Vite dev server with HMR)
- **Server** → http://localhost:3000 (Express + Socket.io)

Migrations run automatically on server start. The Vite config proxies `/api/*` and `/socket.io/*` to the server, so everything works through port 5173.

### 5. First Login

On first server start, the database is migrated and two accounts are auto-seeded:

| Role  | Email                       | Password        |
|-------|-----------------------------|-----------------|
| Owner | Shorecrisis35@gmail.com     | changeme123     |
| Admin | admin@shorecrisis.com       | adminpass123    |

### 6. Seed Test Data (Optional)

1. Log in as **Admin** (admin@shorecrisis.com)
2. Go to `/admin`
3. Click **"Generate Test Data"**

This creates:
- 8 test clients with full profiles
- ~40 appointments across 60 days (completed, confirmed, pending, cancelled)
- Clinical profiles with ICD-10 codes, treatment goals, medications
- Full message conversations (5-9 messages per client, realistic clinical back-and-forth)
- Session notes tied to completed appointments
- 3 contact form submissions
- All tagged as test data (toggleable via Reports data mode)

---

## Option B: Docker (Full Stack)

### 1. Configure Environment

```bash
cp .env.example .env
# Edit .env as needed (Docker overrides DATABASE_URL automatically)
```

### 2. Build and Start

```bash
docker compose up --build
```

This starts three containers:
- **postgres** → PostgreSQL 16 on port 5432
- **server** → Node.js API on port 3000 (auto-runs migrations on start)
- **client** → Nginx serving the React build on port 80

Migrations and account seeding happen automatically — no manual steps needed.

### 3. Access the App

Open http://localhost in your browser.

### 4. Stop

```bash
docker compose down          # stop containers
docker compose down -v       # stop + delete database volume (full reset)
```

### 5. Rebuild After Code Changes

```bash
docker compose down && docker compose up --build
```

---

## Option C: Production Deployment (VPS / Cloud)

This section covers what you need to go from Docker demo to a live, publicly accessible app with a real domain and HTTPS.

### 1. Get a Server

Any Linux VPS works. Recommended options:
- **DigitalOcean Droplet** — $6–12/mo, 1-click Docker install available
- **Hetzner Cloud** — cheapest option (~$4/mo)
- **Railway / Render** — managed platforms, less configuration

Minimum spec: 1 vCPU, 1 GB RAM (2 GB recommended for a busy practice).

### 2. Point Your Domain

Buy a domain (e.g., `shorecrisismanagement.com` on Namecheap ~$12/yr) and add a DNS A record pointing to your server's IP address. Wait a few minutes for it to propagate.

### 3. Set Strong Secrets in `.env`

Before deploying, update these in your `.env` file:

```bash
# Generate strong secrets (run each command and paste the output)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"  # for JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"  # for JWT_REFRESH_SECRET

# Set a real owner password — Tyrin should change this after first login
OWNER_PASSWORD=something-secure-here

# Set a real admin password
ADMIN_PASSWORD=something-secure-here

# Set the database password (also update DATABASE_URL and docker-compose.yml POSTGRES_PASSWORD)
```

### 4. Set Up Real Email (Nodemailer)

Ethereal is dev-only. For production, use one of:
- **Gmail** (free) — create an App Password at myaccount.google.com → Security → App Passwords
  ```
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=Shorecrisis35@gmail.com
  SMTP_PASS=your-16-char-app-password
  EMAIL_FROM=Shorecrisis35@gmail.com
  ```
- **Postmark / SendGrid** — more reliable for transactional email, free tiers available

### 5. Generate VAPID Keys (Push Notifications)

```bash
cd server && npx web-push generate-vapid-keys
# Copy VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY into .env
```

### 6. Add HTTPS with nginx + Certbot

On your server, install Certbot and get a free SSL certificate:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate (replace with your domain)
sudo certbot --nginx -d shorecrisismanagement.com -d www.shorecrisismanagement.com
```

Certbot auto-renews every 90 days.

### 7. Update docker-compose for Production

In `docker-compose.yml`, update `CLIENT_URL` to your real domain:
```yaml
CLIENT_URL: https://shorecrisismanagement.com
```

### 8. Deploy

```bash
# On the server — pull your code and start
git pull
docker compose up --build -d
```

The `-d` flag runs in the background. View logs with `docker compose logs -f`.

### Test Mode in Production

Test mode controls are **automatically hidden** in production Docker builds. The `VITE_SHOW_TEST_MODE` flag is not passed during `docker compose up --build`, so:
- The "Test Mode" section on the Admin page won't appear
- The Reports data toggle won't appear (reports show real data only)
- The test seed/clear endpoints still exist on the server but the UI is gone

To enable test mode in a demo Docker build (e.g., for a presentation):
```bash
docker compose build --build-arg VITE_SHOW_TEST_MODE=true client
docker compose up
```

---

## Features Overview

### User Roles

| Role | Login | Access |
|------|-------|--------|
| **Admin** | admin@shorecrisis.com | Admin panel, test mode, rate settings + all owner features |
| **Owner** | Shorecrisis35@gmail.com | Dashboard, clients, messages, reports, settings, profiles |
| **Client** | Self-registered | Dashboard, booking, messages, profile |
| **Public** | No login | Home, Services, Insurance, Crisis, Contact |

### Key Features

- **Dual-mode scheduling** — time-slot booking + custom time requests
- **Real-time messaging** — Socket.io with typing indicators, read receipts, unread badges
- **Clinical profiles** — diagnosis codes, treatment goals, medications, session notes (owner-only)
- **Appointment detail modal** — click any appointment to see client info, clinical summary, add session notes, manage billing
- **Clients tab** — searchable client directory with appointment stats, links to full profiles
- **Message history in profiles** — full conversation thread visible on client profiles (owner view) and on `/my-profile` (client view)
- **Auto-revenue calculation** — "Mark Complete" auto-calculates fee from session duration × default hourly rate
- **Reporting dashboard** — appointment analytics, client activity, revenue charts with test/real data toggle
- **Test mode** — one-click seed/clear of realistic test data, toggle between test and real data in reports
- **Rate settings** — configurable hourly rates for auto-billing
- **Dark mode** — toggle in navbar, persisted in localStorage, respects system preference on first visit
- **Breadcrumb navigation** — contextual breadcrumbs on every page for easy back-navigation
- **Responsive design** — tablet and mobile layouts with hamburger menu, mobile chat view with back button
- **PWA** — installable on mobile/desktop, offline caching, push notifications
- **Contact/intake form** — HIPAA-aware, emails owner on submission
- **Push + email notifications** — browser push for offline users, branded emails for appointments and messages
- **Structured logging** — pino with request logging, pretty-print in dev, JSON in production

### Navigation

**Breadcrumbs** appear below the navbar on every page (except Home/Login/Register), showing the current path hierarchy. Examples:
- `Home / Dashboard / Clients / Client Profile`
- `Home / My Dashboard / Messages`
- `Home / Dashboard / Reports`

**Dark mode** toggle (moon/sun icon) in the navbar — persists across sessions via localStorage.

---

## Useful Commands

### Development

```bash
# Start dev (both client + server)
npm run dev

# Build both for production
npm run build

# Type-check server only
cd server && npx tsc --noEmit

# Type-check client only
cd client && npx tsc -b
```

### Database

```bash
# Connect to local database
psql postgresql://shore_user:shore_pass@localhost:5432/shore_crisis

# Reset database (drop and recreate — migrations auto-run on next server start)
psql postgres -c "DROP DATABASE shore_crisis;"
psql postgres -c "CREATE DATABASE shore_crisis OWNER shore_user;"

# Connect to Docker database
docker compose exec postgres psql -U shore_user -d shore_crisis
```

### Docker

```bash
# Build without starting
docker compose build

# Rebuild a single service
docker compose build server

# View logs
docker compose logs -f           # all services
docker compose logs -f server    # server only

# Shell into a container
docker compose exec server sh
docker compose exec postgres sh

# Check container status
docker compose ps
```

### Logging

The server uses **pino** for structured JSON logging.

```bash
# In development, logs are pretty-printed with colors automatically
# Set log level in .env:
LOG_LEVEL=debug    # debug, info, warn, error

# In production (Docker), logs output as JSON:
docker compose logs -f server | head -20

# Pipe production logs through pino-pretty for readability:
docker compose logs -f server | npx pino-pretty
```

Every HTTP request is logged with: method, URL, status code, duration, and user ID (if authenticated).

### Push Notifications (Optional Setup)

```bash
# Generate VAPID keys
cd server && npx web-push generate-vapid-keys

# Copy the output into .env:
# VAPID_PUBLIC_KEY=...
# VAPID_PRIVATE_KEY=...
```

### Email Notifications (Optional Setup)

For development, get free SMTP credentials from https://ethereal.email and add to `.env`:
```
SMTP_USER=your-ethereal-user
SMTP_PASS=your-ethereal-pass
```

All sent emails will appear in your Ethereal inbox (no real emails are sent).

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Yes | Secret for refresh tokens |
| `OWNER_EMAIL` | Yes | Owner account email (seeded on first start) |
| `OWNER_PASSWORD` | Yes | Owner account password |
| `OWNER_NAME` | No | Owner display name (default: Tyrin Miller) |
| `ADMIN_EMAIL` | No | Admin account email |
| `ADMIN_PASSWORD` | No | Admin account password |
| `ADMIN_NAME` | No | Admin display name (default: Admin) |
| `PORT` | No | Server port (default: 3000) |
| `CLIENT_URL` | No | Client origin for CORS (default: http://localhost:5173) |
| `LOG_LEVEL` | No | Pino log level (default: info) |
| `NODE_ENV` | No | Environment (development/production) |
| `VAPID_PUBLIC_KEY` | No | Web Push public key |
| `VAPID_PRIVATE_KEY` | No | Web Push private key |
| `VAPID_EMAIL` | No | Web Push contact email |
| `SMTP_HOST` | No | Email SMTP host (default: smtp.ethereal.email) |
| `SMTP_PORT` | No | Email SMTP port (default: 587) |
| `SMTP_USER` | No | Email SMTP username |
| `SMTP_PASS` | No | Email SMTP password |
| `EMAIL_FROM` | No | From address for emails |

**Frontend (client) build-time variable** (set in `client/.env` for local dev):

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_SHOW_TEST_MODE` | `""` (hidden) | Set to `"true"` to show test mode controls in admin panel and reports toggle |

---

## Project Structure

```
shore-crisis-management/
├── client/                     # React + TypeScript (Vite) — PWA
│   ├── public/                 # logo, manifest.json, sw.js
│   ├── src/
│   │   ├── api/                # Axios client with JWT interceptors
│   │   ├── components/
│   │   │   ├── layout/         # Navbar (hamburger), Footer, Breadcrumbs
│   │   │   ├── scheduling/     # AppointmentDetail modal
│   │   │   ├── auth/           # ProtectedRoute
│   │   │   └── ui/             # Shared UI components
│   │   ├── contexts/           # AuthContext, SocketContext, ThemeContext
│   │   ├── pages/              # 14 page components
│   │   │   ├── HomePage        # Public landing page
│   │   │   ├── ServicesPage    # Services & specialties
│   │   │   ├── InsurancePage   # Insurance providers
│   │   │   ├── CrisisPage     # Crisis hotlines & resources
│   │   │   ├── ContactPage    # HIPAA-aware intake form
│   │   │   ├── LoginPage      # Authentication
│   │   │   ├── RegisterPage   # Client registration
│   │   │   ├── OwnerDashboard # Appointments, stats, actions
│   │   │   ├── ClientDashboard # Client's view
│   │   │   ├── ClientsPage    # Searchable client directory
│   │   │   ├── BookingPage    # Dual-mode booking
│   │   │   ├── MessagesPage   # Real-time chat
│   │   │   ├── ProfilePage    # Client profiles + messages
│   │   │   ├── ReportsPage    # Analytics with data mode toggle
│   │   │   ├── SettingsPage   # Availability management
│   │   │   └── AdminPage      # Test mode + rate settings
│   │   └── styles/
│   │       ├── variables.css   # Design tokens & global styles
│   │       ├── responsive.css  # Tablet & mobile breakpoints
│   │       └── darkmode.css    # Dark theme overrides
│   ├── Dockerfile              # Multi-stage build → nginx
│   └── nginx.conf              # SPA routing + API/WebSocket proxy
├── server/                     # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/             # db.ts, logger.ts (pino)
│   │   ├── middleware/         # auth.ts, roleGuard.ts, requestLogger.ts
│   │   ├── routes/             # 10 route modules
│   │   │   ├── auth.ts         # Register, login, refresh, logout
│   │   │   ├── appointments.ts # CRUD + complete + cancel
│   │   │   ├── availability.ts # Weekly schedule + open slots
│   │   │   ├── messages.ts     # Conversations + history + send
│   │   │   ├── notifications.ts# Push subscribe/unsubscribe
│   │   │   ├── contact.ts      # Public intake form
│   │   │   ├── profiles.ts     # Client profiles + clinical + notes
│   │   │   ├── reports.ts      # Analytics with test mode filter
│   │   │   ├── rates.ts        # Revenue rate CRUD
│   │   │   └── admin.ts        # Test data seed/clear
│   │   ├── services/           # email.ts, push.ts
│   │   ├── socket/             # Socket.io handlers
│   │   └── db/
│   │       ├── migrations/     # 3 SQL migration files
│   │       ├── migrate.ts      # Migration runner (auto-runs on start)
│   │       └── seed.ts         # Owner + admin account seeder
│   └── Dockerfile              # Multi-stage Node.js build
├── docker-compose.yml          # postgres + server + client
├── .env.example                # All environment variables
└── docs/
    ├── PLAN.md                 # Architecture plan
    ├── BUILD-EXECUTION.md      # This file
    └── HOW-THIS-WORKS.md       # Feature walkthrough
```

---

## Troubleshooting

**Screen flickers/reloads constantly:**
This was a known issue with the auth token refresh loop — it's been fixed. If it recurs, clear your browser cookies for localhost and hard refresh.

**Docker build fails with peer dependency error:**
The client Dockerfile uses `--legacy-peer-deps` to handle the vite-plugin-pwa compatibility. If you add new client dependencies, install them with `npm install --legacy-peer-deps`.

**Server crashes with "relation does not exist":**
Migrations now auto-run on server start. If you see this, the server may have started before PostgreSQL was ready. Docker's `depends_on` with healthcheck handles this, but on local dev make sure PostgreSQL is running first.

**Dark mode doesn't persist:**
Check that localStorage is accessible. The theme is stored as `theme: "dark"` or `theme: "light"` in localStorage.

**Can't get out of messages:**
Breadcrumbs now appear on every page. On mobile, there's a back arrow button in the chat header. Breadcrumbs show `Home / Dashboard / Messages` with clickable links back.
