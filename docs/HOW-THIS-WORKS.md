# Shore Crisis Management — How This Works

A complete feature walkthrough of the web application.

---

## System Overview

Shore Crisis Management is a full-stack web application for Tyrin Miller's mental health practice in Charlotte, NC. It serves four user types:

| Role | Who | What They See |
|------|-----|---------------|
| **Public** | Anyone on the internet | Homepage, Services, Insurance, Crisis Resources, Contact/Intake form |
| **Client** | Registered patients | Dashboard, appointment booking, messaging, profile with message history |
| **Owner** | Tyrin Miller | Dashboard, clients directory, appointment detail modals, messaging, clinical profiles, reports, settings |
| **Admin** | Tian Reid | Everything the owner sees + admin panel, test mode controls, rate settings |

### Global UI Features

**Dark Mode** — A moon/sun toggle in the navbar switches between light and dark themes. The preference is saved in localStorage and persists across sessions. On first visit, the app respects the user's system preference (`prefers-color-scheme`). Every element — cards, forms, modals, charts, badges, messages, tables, hero sections — has dark-mode-specific styling.

**Breadcrumb Navigation** — A contextual breadcrumb trail appears below the navbar on every page (except Home, Login, and Register). Breadcrumbs are role-aware:
- Owner sees: `Home / Dashboard / Clients / Client Profile`
- Client sees: `Home / My Dashboard / Messages`
- Admin sees: `Home / Admin`

Each segment is a clickable link back to that level. This solves navigation dead-ends — particularly in Messages and Profile views where there was no obvious way back.

**Responsive Design** — The app is fully responsive across three breakpoints:
- **1024px** (tablet landscape) — tighter spacing, smaller nav text
- **768px** (tablet portrait / large phone) — hamburger menu with slide-out drawer, single-column layouts, stacked forms, mobile chat view with back button, bottom-sheet modals
- **480px** (small phone) — logo text hidden (icon only), full-width drawer, single-column stats

**PWA** — The app is installable on mobile and desktop via "Add to Home Screen." The service worker provides offline caching (network-first with cache fallback) and handles push notification display.

---

## Public-Facing Website

### Homepage (`/`)
- **Crisis banner** at the top — always visible, links to 911 and 988
- **Hero section** with the Shore Crisis Management logo, tagline ("Helping You Weather the Waves of Life"), and mission statement
- **Services preview** — 5 service cards with brief descriptions
- **Insurance accepted** — Aetna, BlueCross BlueShield, Carolina Complete, Vaya Health, Alliance
- **Call-to-action** — "Book a Consultation" button
- **Footer** — address (227 W 4th St, Suite LL102, Charlotte, NC 28202), email, hours (24hrs), nav links

### Services (`/services`)
- Detailed descriptions of all 5 services: Individual Therapy, Child & Adolescent, Psychiatric Evaluation, Psychological Testing, Crisis Intervention
- 11 specialties displayed as tags: Anxiety, Depression, Trauma/PTSD, Grief & Loss, Stress Management, Bipolar Disorder, Anger Management, Life Transitions, Addiction/Recovery, LGBTQ+ Issues, Sleep Issues
- Age groups served: Adolescents (13–17), Young Adults (18–25), Adults (26–64), Seniors (65+)

### Insurance (`/insurance`)
- Card for each accepted provider with description
- Coverage guidance and contact info

### Crisis Resources (`/crisis`)
- Emergency 911 call button (red, prominent)
- National hotlines: 988 Lifeline, Crisis Text Line, SAMHSA, Veterans Crisis Line, Trevor Project, Domestic Violence Hotline
- Each with contact method and description
- Shore Crisis Management direct contact info

### Contact / Intake Form (`/contact`)
- **HIPAA-aware intake form** collecting:
  - Full name (required)
  - Date of birth
  - Mental health concern / diagnosis
  - Insurance provider (dropdown of accepted + Other + None)
  - Preferred contact method (phone/email/text)
  - Contact value (required)
  - Reason for reaching out
- HIPAA disclaimer displayed above the form
- On submit:
  1. Data saved to `contact_submissions` table
  2. Email sent to owner with all form details
  3. Real-time socket notification to owner dashboard
  4. Confirmation message shown to user
- Sidebar shows practice contact info (email, address, hours)

---

## Authentication

### How Login Works
1. User enters email + password at `/login`
2. Server verifies credentials with bcrypt (10 salt rounds)
3. Returns:
   - **Access token** (JWT, 15-min expiry) — stored in React state (memory only, never localStorage)
   - **Refresh token** (random UUID, 7-day expiry) — stored in httpOnly secure cookie + `refresh_tokens` table
4. User redirected based on role: admin → `/admin`, owner → `/dashboard`, client → `/client`

### Token Refresh
- Axios interceptor catches any 401 response (except `/auth/refresh` and `/auth/login` to prevent loops)
- Automatically calls `/api/auth/refresh` with the httpOnly cookie
- Gets a new access token + rotated refresh token (old token deleted from DB)
- Retries the original failed request transparently
- If refresh fails → user stays on current page in unauthenticated state

### Session Restoration
- On page load/refresh, the AuthContext attempts a token refresh via a direct axios call (bypassing the interceptor)
- If successful, the user is seamlessly restored to their session
- If not, the app loads in public/unauthenticated mode

### Registration (`/register`)
- Clients self-register with: full name, email, phone (optional), password (min 8 chars), confirm password
- Owner and admin accounts are seeded on first server start (not registerable through the UI)

---

## Client Features

### Client Dashboard (`/client`)
- **Stats row**: upcoming appointment count, quick links to Book Appointment and Messages
- **Upcoming appointments** with status badges (pending, confirmed)
  - Owner response and suggested alternative times shown when applicable
  - Cancel button on each appointment
- **Past appointments** section (dimmed, showing completed/cancelled/denied)
- Real-time updates via Socket.io when owner approves/denies/completes

### Booking (`/booking`)
Two modes, toggled with tabs:

**Slot-Based Booking:**
1. Client picks a date from a date picker
2. App fetches open slots from `/api/availability/open?date=YYYY-MM-DD`
3. Slots are calculated by expanding the owner's weekly availability template and subtracting all confirmed/completed appointments
4. Available slots displayed as clickable buttons (e.g., "9:00 AM — 10:00 AM")
5. Client clicks a slot → appointment auto-confirmed, redirected to dashboard
6. Owner notified via socket + email

**Request-Based Booking:**
1. Client picks a custom date, start time, end time
2. Adds optional notes explaining the request
3. Submits → appointment created with status `pending`
4. Owner notified via socket + email
5. Owner approves, denies, or suggests alternative time from their dashboard
6. Client notified of decision via socket + email

### Messaging (`/messages`)
- **Desktop**: two-panel layout — conversation list on left, chat window on right
- **Mobile**: full-screen conversation list → tap to open chat → back arrow to return to list
- Real-time message delivery via Socket.io
- Typing indicators ("Typing..." shown when other party is typing, clears after 1.5s of inactivity)
- Read receipts ("Read" shown on sent messages once the other party opens the conversation)
- Unread count badges on conversation list items
- Message history loaded via REST (paginated, last 50), new messages via WebSocket

### Profile (`/my-profile`)
- View/edit personal info: name, phone, DOB, insurance, emergency contact, address
- **Message history** — full conversation thread with the owner displayed in chat-bubble layout (client messages on right, owner messages on left) with timestamps and sender names
- "Open Full Chat" button links to the Messages page
- Client cannot see clinical notes, session notes, or billing data (owner-only)

---

## Owner Features

### Owner Dashboard (`/dashboard`)
- **Stats row**: Today's appointments, Pending requests, Upcoming, Completed, View Messages link
- **Pending Requests section**: shows request-based bookings waiting for approval
  - **Approve** → status set to `confirmed`, client notified via socket + email
  - **Deny** → status set to `denied`, optional message sent to client
- **Today's Schedule**: all confirmed appointments for today with Mark Complete and Cancel buttons
- **Upcoming Appointments**: next 10 confirmed appointments with same actions
- All sections update in real-time via Socket.io
- **Every appointment card is clickable** — opens the Appointment Detail Modal

### Appointment Detail Modal
Clicking any appointment opens a full detail modal with:

**Schedule section**:
- Date, time range, duration, booking type (slot/request)
- Client's notes if any

**Client section**:
- Avatar, name, email, phone, DOB, insurance, emergency contact
- **"Full Profile" button** — links directly to `/profile/:id`
- **Clinical Summary** (if clinical profile exists):
  - Diagnosis codes (ICD-10)
  - Diagnosis notes
  - Treatment goals
  - Current medications

**Session Notes**:
- View existing notes for this appointment
- Textarea to add new session notes (saved immediately)

**Billing** (for confirmed/completed appointments):
- Editable fee field
- Payment status dropdown (pending/paid)
- Update button

**Actions**:
- Pending: Approve / Deny (with optional response message)
- Confirmed: Mark Complete / Cancel
- Completed: shows completion status and fee

### How "Mark Complete" Works
1. Owner clicks "Mark Complete" on a confirmed appointment (from dashboard or detail modal)
2. Server automatically calculates:
   - **Duration**: from scheduled start_time to end_time (e.g., 60 minutes)
   - **Fee**: duration × default hourly rate from `rate_settings` (e.g., 60 min × $150/hr = $150.00)
   - **Insurance billed**: auto-filled from the client's `insurance_provider` field
   - **Payment status**: set to `pending`
3. Appointment status → `completed`
4. Fee, duration, and insurance stored on the appointment record
5. This data automatically flows into Revenue reports
6. Owner can manually adjust the fee and payment status in the detail modal if needed

### Clients Directory (`/clients`)
- Searchable list of all registered clients
- Search filters by name, email, or insurance provider
- Each client card shows:
  - Avatar (first initial), name, email, phone
  - Insurance provider badge
  - Appointment stats (total, confirmed, last visit date)
  - Arrow indicating clickability
- Click any client → navigates to their full profile

### Client Profiles (`/profile/:userId`)
Owner can view any client's full profile with sections:

**Personal Info** (also editable by client):
- Name, phone, DOB, insurance, emergency contact, address
- Edit mode with form fields, save button

**Clinical Profile** (owner-only, editable):
- Diagnosis codes (ICD-10, e.g., F41.1, F32.1)
- Diagnosis notes
- Treatment goals
- Current medications
- General clinical notes

**Session Notes** (owner-only):
- Add new notes linked to specific appointments (dropdown selector)
- Notes displayed in reverse chronological order with appointment date
- Each note has a left-border accent and timestamp

**Messages**:
- Full conversation thread with the client displayed in chat-bubble layout
- Owner messages on right (blue), client messages on left (gray)
- Sender name and timestamp on each message
- "Open Full Chat" button to jump to the Messages page
- Scrollable container (max 500px height)

**Appointment History** (owner-only):
- Full table with: date, status (badge), booking type, fee, insurance billed, payment status (badge)
- Sortable by date (newest first)

### Messaging (`/messages`)
- **Conversation list** on the left: all clients who have messaged, sorted by most recent, with unread count badges
- **Chat window** on the right: full message history with selected client
- Messages marked as read automatically when conversation is opened
- If the client is offline when a message is sent:
  - **Push notification** sent via Web Push API (if subscribed)
  - **Email notification** sent via Nodemailer with branded template
- **Mobile**: conversation list and chat are separate full-screen views with a back arrow to navigate between them

### Settings (`/settings`)
- **Availability Editor**: Configure weekly recurring time slots
  - Pick day of week, start time, end time, slot duration (30/45/60/90 min)
  - Add multiple slots per day (e.g., Monday 9:00–12:00 and 1:00–5:00)
  - Delete individual slots
  - Grouped display by day of week
  - These slots power the client-facing booking calendar

### Reports (`/reports`)
Three tabs with a **Data Mode Toggle** (All | Real | Test):

**Appointment Analytics:**
- Stats: today, this week, total, confirmed, completed, pending, denied, cancelled
- **Monthly volume bar chart** (last 12 months, blue bars)
- **Busiest days** horizontal bar chart (ranked by appointment count)
- **Busiest hours** horizontal bar chart (ranked by appointment count)

**Client Activity:**
- Table of all clients with:
  - Name, email
  - Member since date
  - Total/confirmed/cancelled appointments
  - Message count
  - Total fees
  - Last visit date
  - "View" link to full client profile

**Revenue:**
- Stats: total revenue, paid revenue, pending revenue, paid session count
- **Monthly revenue bar chart** (gold/amber bars)
- **Revenue by insurance provider** breakdown with horizontal bars

**Data Mode Toggle:**
- **All** — shows both real and test data combined
- **Real** — filters to only real client/appointment data (test data hidden)
- **Test** — filters to only seeded test data (toggle highlighted in amber)

---

## Admin Features

### Admin Panel (`/admin`)
Only accessible to the admin role (Tian Reid).

**Test Mode:**
- **Generate Test Data** button seeds:
  - 8 realistic test clients (Sarah Johnson, Marcus Williams, Aisha Patel, James Rodriguez, Keisha Thompson, David Chen, Maria Santos, Tyler Brooks)
  - Each with: name, email, phone, DOB, insurance provider
  - 3–7 appointments per client spread over 60 days (mix of completed, confirmed, pending, cancelled)
  - Clinical profiles with real ICD-10 codes, diagnosis notes, treatment goals, medications
  - Session notes with realistic clinical content (grounding techniques, medication adjustments, EMDR, etc.)
  - Full multi-message conversations per client (5–9 messages each, covering intake, progress updates, medication questions, crisis check-ins, scheduling)
  - 3 unread messages from different clients
  - 3 contact form submissions from prospective clients
  - A default rate setting ($150/hr) if none exists
- All test data tagged with `is_test_data = TRUE`
- **Clear Test Data** button removes all tagged records cleanly
- **Status indicator** shows green dot and counts when test data is loaded

**Rate Settings:**
- Add hourly rates with a name (e.g., "Standard Session", "Extended Session") and $/hr amount
- Set one rate as the **default** — this is used for auto-revenue calculation when appointments are marked complete
- Default rate highlighted with green accent
- Edit or delete existing rates

The admin can also access all owner pages (Dashboard, Clients, Messages, Settings, Profiles, Reports).

---

## Real-Time Features (Socket.io)

### Connection
- WebSocket connection established on login
- JWT access token sent in the auth handshake
- Server middleware validates the token before allowing connection
- Each user joins a private room (`user:<id>`)
- Connection tracked server-side (Map of userId → Set of socketIds) to determine online/offline status
- Reconnects automatically on token refresh

### Events

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `message:send` | Client → Server | `{ receiverId, content }` | Send a chat message |
| `message:new` | Server → Both | `{ id, senderId, senderName, content, createdAt }` | Deliver message to sender + receiver |
| `message:read` | Client → Server | `{ senderId }` | Mark all messages from sender as read |
| `message:read-ack` | Server → Client | `{ readerId }` | Tell sender their messages were read |
| `typing:start` | Client → Server | `{ receiverId }` | User started typing |
| `typing:stop` | Client → Server | `{ receiverId }` | User stopped typing (or 1.5s timeout) |
| `typing:indicator` | Server → Client | `{ senderId, typing }` | Show/hide typing indicator |
| `appointment:updated` | Server → Client | `{ appointment }` | Appointment status changed |
| `contact:new` | Server → Owner | `{ fullName, reason }` | New intake form submitted |

### Offline Notifications
When a message or appointment update targets a user who has no active socket connection:
1. **Web Push notification** sent via the Web Push API (if they have a saved subscription)
2. **Email notification** sent via Nodemailer with branded HTML template

---

## Notifications

### Browser Push (Web Push API)
- Service worker (`sw.js`) registered on page load
- Users prompted to allow notifications via browser's native permission dialog
- Subscription (endpoint + keys) stored in `push_subscriptions` table
- Push sent when: new message to offline user, appointment status change
- Notification displays: title, body, Shore logo icon
- Notification click opens the app to the relevant page (`/messages`, `/client`, etc.)
- Expired subscriptions (410 Gone) automatically cleaned from the database

### Email (Nodemailer)
- Branded HTML email template with:
  - Blue header with "Shore Crisis Management" title
  - Gold tagline
  - Content body on light background
  - Footer with practice address
- Triggered on: appointment booked/approved/denied/cancelled, new message (to offline user), contact form submission
- Fire-and-forget — never blocks the HTTP response
- Development: Ethereal fake SMTP inbox (no real emails sent)
- Production: plug in any SMTP provider (Gmail, SendGrid, Mailgun, etc.)

---

## PWA (Progressive Web App)

- `manifest.json` with app name, icons, theme color, display mode
- Enables "Add to Home Screen" on iOS Safari, Android Chrome, and desktop browsers
- Service worker provides:
  - **Offline caching** — network-first strategy for all non-API requests, falls back to cached version
  - **Push notification handling** — receives push events and displays system notifications
  - **App shell** cached on install for instant load
- Theme color: `#3A7CB8` (brand blue)
- Works on localhost in development; requires HTTPS in production

---

## Dark Mode

- Toggle button (moon/sun icon) in the navbar, visible on all screen sizes
- Sets `data-theme="dark"` on the `<html>` element
- All colors swap via CSS variable overrides in `darkmode.css`
- Covers every UI element: navbar, cards, forms, inputs, buttons, badges, modals, charts, tables, messages, hero sections, footer, breadcrumbs
- Preference persisted in `localStorage` as `theme: "dark"` or `theme: "light"`
- On first visit with no stored preference, respects `prefers-color-scheme` media query

---

## Breadcrumb Navigation

- Rendered below the navbar on every page except Home, Login, and Register
- Shows hierarchical path with clickable links: `Home / Dashboard / Clients / Client Profile`
- Role-aware — owner breadcrumbs route through Dashboard, client breadcrumbs route through My Dashboard
- Specific paths:
  - Messages: `Home / Dashboard / Messages` (owner) or `Home / My Dashboard / Messages` (client)
  - Client Profile: `Home / Clients / Client Profile` (owner)
  - My Profile: `Home / My Dashboard / My Profile` (client)
  - Booking: `Home / My Dashboard / Book Appointment`
  - Reports: `Home / Dashboard / Reports`
  - Settings: `Home / Dashboard / Settings`
- On mobile, breadcrumbs use smaller text and wrap naturally

---

## Logging

- **Engine**: pino (structured JSON logger)
- **Dev mode**: pretty-printed with colors and timestamps via pino-pretty
- **Production**: raw JSON output (pipe through `npx pino-pretty` for readability)
- **Log levels**: debug, info, warn, error (configurable via `LOG_LEVEL` env var)
- **Request logging middleware**: every HTTP request logged with method, URL, status code, response duration (ms), client IP, and authenticated user ID
- **Console redirect**: all `console.log`, `console.error`, `console.warn` calls throughout the codebase are piped through pino automatically
- **Socket events**: connection/disconnection logged with user ID and active socket count
- **Errors**: all route errors logged with full error context before returning 500

---

## Database Schema

11 tables across 3 migrations:

**Migration 001 — Core:**

| Table | Purpose |
|-------|---------|
| `users` | All accounts (owner, admin, client) with role, profile fields |
| `refresh_tokens` | JWT refresh token storage with expiry for rotation |
| `availability_slots` | Owner's recurring weekly schedule template |
| `appointments` | All bookings with status, type, billing fields, test flag |
| `messages` | Chat messages between users with read status |
| `push_subscriptions` | Web Push API endpoint + keys per user |
| `contact_submissions` | Public intake form submissions |

**Migration 002 — Profiles & Reporting:**

| Table | Purpose |
|-------|---------|
| `clinical_profiles` | Per-client clinical data: diagnosis, goals, meds (owner-only) |
| `session_notes` | Per-appointment notes linked to client (owner-only) |
| `client_files` | File attachments on client profiles |

**Migration 003 — Admin & Rates:**

| Table | Purpose |
|-------|---------|
| `rate_settings` | Configurable hourly rates for auto-billing |

Additional columns added by migrations 002–003: user profile fields (DOB, emergency contact, insurance, address), appointment billing fields (fee, actual_duration_min, insurance_billed, payment_status), and `is_test_data` flags on all data tables.

---

## Security Considerations

- **Passwords**: bcrypt with 10 salt rounds
- **JWT**: short-lived access tokens (15 min) stored in memory only, httpOnly secure cookie refresh tokens (7 days)
- **Refresh token rotation**: old token deleted from database on each refresh, preventing replay attacks
- **Interceptor safety**: auth refresh and login requests skip the 401 interceptor to prevent infinite loops
- **Role-based access**: `authenticate` middleware verifies JWT on every protected route; `requireRole` middleware checks `req.user.role` against allowed roles
- **Admin elevation**: admin role can access all owner routes; enforced in both backend middleware and frontend ProtectedRoute
- **CORS**: restricted to the configured client origin
- **Input validation**: required fields checked server-side on all endpoints
- **Test data isolation**: `is_test_data` boolean flag on all data tables; reports support filtering by mode (all/real/test)
- **HIPAA notice**: contact form displays a confidentiality disclaimer before submission
- **No sensitive data in JWT**: payload contains only userId, email, and role
- **Cookie security**: refresh token cookie uses `httpOnly`, `secure` (in production), and `sameSite: strict`
