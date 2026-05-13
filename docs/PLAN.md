# Shore Crisis Management — Web Application Plan

## Context
Building a full-stack web app for **Shore Crisis Management**, a mental health crisis management business in Charlotte, NC owned by **Tyrin Miller (CEO)**. The business focuses on helping people through mental health crises. Tyrin needs a dashboard to manage appointment scheduling and client messaging, and clients need to book consultations and communicate with the practice. Both sides need push + email notifications.

## Business Details (from questionnaire)
- **Business**: Shore Crisis Management
- **Tagline**: "Helping You Weather the Waves of Life"
- **Owner**: Tyrin Miller (CEO) — LPC, LCSW, PhD, PsyD, LMFT
- **Email**: Shorecrisis35@gmail.com
- **Address**: 227 W 4th St, Suite LL102, Charlotte, NC 28202
- **Hours**: 24hrs
- **EHR**: SimplePractice
- **Mission**: "I've always felt like my purpose was to be able to help others in need."
- **Ideal client**: Someone going through a mental health crisis needing assistance through troubled times
- **Brand tone**: Safe, Professional, Diverse
- **#1 CTA**: Book a consultation / call
- **Desired feeling**: Welcomed, confident these professionals can help

### Services Offered
- Individual Therapy, Child/Adolescent, Psychiatric Evaluation, Psychological Testing, Crisis Intervention

### Specialties
- Anxiety, Depression, Trauma/PTSD, Grief & Loss, Stress Management, Bipolar Disorder, Anger Management, Life Transitions, Addiction/Recovery, LGBTQ+ Issues, Sleep Issues

### Age Groups Served
- Adolescents (13-17), Young Adults (18-25), Adults (26-64), Seniors (65+)

### Insurance Accepted
- Aetna, BlueCross BlueShield, Carolina Complete, Vaya Health, Alliance

### Website Pages Requested
- Home, Services, Fees/Insurance, Online Booking, Crisis Info/Hotlines, Client Portal Link
- Contact form collecting: Full name, Mental Health Diagnosis, DOB, SS#, Insurance Provider, Way of contact
- HIPAA-compliant contact form required

## Color Scheme (from logo)
- **Primary — Ocean Blue**: `#5AACE8` (the "SHORE" text / wave tones)
- **Primary Dark**: `#3A7CB8` (deeper blue for headers, nav)
- **Accent — Gold/Bronze**: `#C49A4A` (the figure / sun rays / accents)
- **Light Background**: `#F0F6FA` (soft blue-white)
- **White**: `#FFFFFF`
- **Dark Text**: `#1E293B` (slate gray)
- **Body Text**: `#475569`

## Tech Stack
- **Frontend**: React + TypeScript (Vite) — **Progressive Web App (PWA)**
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **Real-time**: Socket.io (WebSockets)
- **Auth**: Email/password with JWT (access token) + httpOnly cookie (refresh token)
- **Notifications**: Web Push API (browser) + Nodemailer (email)
- **PWA**: Web app manifest, service worker (offline caching + push), installable on mobile/desktop

## Project Structure
```
milly_mental_health/
├── client/                   # React frontend (Vite)
│   ├── public/
│   │   ├── sw.js             # Service worker for push + offline caching
│   │   ├── manifest.json     # PWA manifest (installable app)
│   │   ├── logo.png          # Shore Crisis Management logo
│   │   ├── icon-192.png      # PWA icon 192x192
│   │   └── icon-512.png      # PWA icon 512x512
│   └── src/
│       ├── api/client.ts     # Axios with JWT interceptors
│       ├── components/
│       │   ├── layout/       # AppLayout, Sidebar, Navbar
│       │   ├── scheduling/   # CalendarView, TimeSlotPicker, BookingRequestForm, AvailabilityEditor
│       │   ├── messaging/    # ConversationList, ChatWindow, MessageBubble, MessageInput
│       │   ├── auth/         # LoginForm, RegisterForm, ProtectedRoute
│       │   └── ui/           # Button, Modal, Badge, Toast
│       ├── contexts/         # AuthContext, SocketContext
│       ├── hooks/            # useAuth, useSocket, usePushNotifications
│       ├── pages/
│       │   ├── HomePage.tsx          # Public landing page with business info
│       │   ├── ServicesPage.tsx      # Services & specialties
│       │   ├── InsurancePage.tsx     # Fees & insurance info
│       │   ├── CrisisPage.tsx       # Crisis info & hotlines
│       │   ├── ContactPage.tsx       # HIPAA-aware intake/contact form
│       │   ├── LoginPage.tsx
│       │   ├── RegisterPage.tsx
│       │   ├── ClientDashboard.tsx
│       │   ├── OwnerDashboard.tsx
│       │   ├── BookingPage.tsx
│       │   ├── MessagesPage.tsx
│       │   └── SettingsPage.tsx
│       ├── styles/
│       │   └── variables.css   # CSS custom properties for brand colors
│       └── types.ts
├── server/
│   └── src/
│       ├── config/db.ts
│       ├── middleware/       # auth.ts, roleGuard.ts
│       ├── routes/           # auth, appointments, availability, messages, notifications, contact
│       ├── services/         # email.ts, push.ts
│       ├── socket/index.ts
│       └── db/migrations/001_initial.sql
└── package.json              # Root scripts (concurrently)
```

## Database Schema (6 tables)
- **users** — id, email, password_hash, full_name, phone, role (owner|client), created_at
- **refresh_tokens** — user_id, token, expires_at
- **availability_slots** — owner_id, day_of_week, start_time, end_time, slot_duration_min
- **appointments** — client_id, owner_id, start/end time, status (pending|confirmed|denied|cancelled), booking_type (slot|request), notes, owner_response, suggested_time
- **messages** — sender_id, receiver_id, content, is_read, created_at
- **push_subscriptions** — user_id, endpoint, p256dh, auth
- **contact_submissions** — full_name, diagnosis, dob, insurance_provider, contact_method, contact_value, reason, created_at (for the public intake form)

## API Endpoints
| Area | Key Endpoints |
|------|--------------|
| Auth | POST register, login, refresh, logout; GET me |
| Availability | GET / POST / DELETE slots; GET /open?date= (public) |
| Appointments | POST /book (auto-confirm), POST /request (pending), PATCH /:id/status, PATCH /:id/cancel, GET / |
| Messages | GET /conversations, GET /conversations/:userId, POST /, PATCH /read/:userId |
| Notifications | POST /push/subscribe, DELETE /push/unsubscribe |
| Contact | POST /submit (public intake form — stores submission, emails owner) |

## Public-Facing Pages (from questionnaire)

### HomePage
- Hero section with logo, tagline "Helping You Weather the Waves of Life", ocean-themed calm aesthetic
- Brief intro: Tyrin's mission statement
- Services overview cards
- "Book a Consultation" primary CTA button
- Crisis hotline banner (always visible)
- Address & hours in footer

### ServicesPage
- Individual Therapy, Child/Adolescent, Psychiatric Evaluation, Psychological Testing, Crisis Intervention
- Each with description card
- Specialties listed: Anxiety, Depression, Trauma/PTSD, Grief & Loss, Stress Management, Bipolar Disorder, Anger Management, Life Transitions, Addiction/Recovery, LGBTQ+ Issues, Sleep Issues
- Age groups: Adolescents through Seniors

### InsurancePage
- Accepted: Aetna, BlueCross BlueShield, Carolina Complete, Vaya Health, Alliance
- Clear layout for each provider

### CrisisPage
- National crisis hotlines (988, Crisis Text Line, etc.)
- Local Charlotte resources
- When to seek emergency help

### ContactPage (HIPAA-aware intake form)
- Collects: Full name, Mental Health Diagnosis, DOB, SS#, Insurance Provider, Way of contact, Reason for reaching out
- Data encrypted at rest, SSL in transit
- Submitted data stored in contact_submissions table AND emailed to owner
- Clear HIPAA disclaimer/notice

## Scheduling (Dual-Mode)
1. **Slot-based**: Owner configures weekly availability. Clients pick from open slots → auto-confirmed.
2. **Request-based**: Client requests custom date/time with notes → status=pending. Owner approves, denies, or suggests alternative.

## Messaging (Real-time via Socket.io)
- JWT auth on WebSocket handshake
- Each user joins room `user:<id>`
- Events: `message:send`, `message:new`, `message:read`, `message:read-ack`, `typing` indicators
- Messages persisted to PostgreSQL, history loaded via REST with pagination

## Notifications
- **Browser push**: Web Push API + service worker. Triggered when receiver has no active socket.
- **Email**: Nodemailer (Ethereal for dev). Sent on appointment changes and new messages.

## Key Packages
**Server**: express, pg, socket.io, bcrypt, jsonwebtoken, cookie-parser, cors, web-push, nodemailer, dotenv, tsx
**Client**: react-router-dom, axios, socket.io-client, date-fns, react-hot-toast, vite-plugin-pwa

## Build Order

### Phase 1: Foundation
1. Initialize monorepo — root package.json, Vite React client, Express server
2. Set up CSS variables with Shore brand colors, copy logo to public/
3. PostgreSQL setup — connection pool, migration script, run 001_initial.sql
4. Auth system — register/login/refresh/logout routes + AuthContext + Login/Register pages + ProtectedRoute
5. Owner seed — auto-create Tyrin's owner account on first run

### Phase 2: Public Pages
6. HomePage — hero with logo, tagline, mission, services preview, CTA, crisis banner
7. ServicesPage — service cards + specialties list + age groups
8. InsurancePage — accepted providers
9. CrisisPage — hotlines and resources
10. ContactPage — HIPAA-aware intake form with contact_submissions endpoint

### Phase 3: Scheduling
11. Availability CRUD — owner routes + AvailabilityEditor on SettingsPage
12. Open slots query — expand weekly template minus existing bookings
13. Slot booking — BookingPage with TimeSlotPicker, auto-confirm
14. Request booking — BookingRequestForm, pending status flow
15. Appointment dashboards — Owner sees all appointments + pending requests; Client sees theirs

### Phase 4: Messaging
16. Message REST endpoints — send, history, conversations, mark-read
17. Socket.io setup — JWT middleware, rooms, message events
18. Messaging UI — ConversationList + ChatWindow + MessageInput + real-time delivery
19. Unread indicators — badge counts on nav

### Phase 5: Notifications
20. Web Push — VAPID keys, push service, subscribe endpoint, service worker
21. Email — Nodemailer, emails on appointment changes and new messages

### Phase 6: Docker Deployment
22. Dockerfile for server (Node.js multi-stage build)
23. Dockerfile for client (Vite build → nginx)
24. docker-compose.yml with services: client, server, postgres, nginx reverse proxy
25. .env.example with all required environment variables
26. nginx.conf for routing API/WebSocket traffic to server, static to client

### Phase 7: Polish
27. Calendar view on owner dashboard
28. Responsive layout + consistent ocean-blue/gold styling
29. Typing indicators in chat

## Verification
1. Start PostgreSQL, run migration
2. `npm run dev` from root (concurrently starts client :5173 + server :3000)
3. Visit public pages: Home, Services, Insurance, Crisis, Contact — verify all business info displays
4. Submit contact/intake form — verify it stores and emails owner
5. Register a client account, log in as owner (seeded)
6. Owner: set availability on Settings page
7. Client: book a time slot, send a request for custom time
8. Owner: approve/deny requests on dashboard
9. Two browser windows: send messages, verify real-time delivery
10. Check browser push notification in background tab
11. Check Ethereal inbox for email notifications
12. `docker compose up --build` — verify full stack runs in containers
13. Access app at localhost:80 via nginx — verify all features work through Docker
