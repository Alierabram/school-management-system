<<<<<<< HEAD
# BugemaDesk - Campus Administration System

BugemaDesk is a secure, role‑based campus administration system for managing students, courses, tuition, and audit trails at Bugema University.

## Overview

- **Database**: MongoDB (with JWT‑based auth)
- **Backend**: Node.js, Express, bcrypt, jsonwebtoken
- **Frontend**: HTML/CSS/JS (plain scripts, no framework)
- **Deployment**: Ready for Render (cloud) or any Node.js hosting
- **Auth**: JWT with Authorization header, no cookies
- **RBAC**: Registrar, Accounts, HOD roles with fine‑grained permissions
- **Key features**:
  - Student CRUD with course units, marks, tuition ledger
  - Public verification page
  - Chart analytics (enrollment, tuition status, programmes)
  - Bulk CSV import
  - Audit logs (immutable, Registrar only)
  - Printable transcripts, exam permits
  - QR‑code digital ID cards
  - Command palette & theme toggle

## Technology Stack

| Layer | Technologies |
|-------|--------------|
| **DB** | MongoDB (local or Atlas) |
| **API** | Express, Mongoose, JWT, bcryptjs |
| **Frontend** | HTML5, CSS3 (custom), Vanilla JS, Chart.js, qrcode.js, PapaParse (CDN) |
| **Security** | CORS, custom error handlers, rate‑friendly startup |
| **Docker‑ready** | Node 20+, standard Express patterns |
| **Testing** | 13 unit tests for validation and query building |

## Prerequisites

- Node.js 20+
- MongoDB (local: `mongodb://127.0.0.1:27017/bugemadesk` or Atlas)
- A `.env` file (see below)

## Quick Setup

```bash
# Clone this repo
# Install dependencies
npm install
# Start the app (MongoDB must be running first)
# If local MongoDB, seed initial data
node scripts/seed.js
# Run server (Render will run this automatically)
npm start
```

## Environment Variables

Create a `.env` file (never commit this) with:

```env
# MongoDB connection URI (use Atlas SRV string if cloud)
MONGODB_URI=mongodb://127.0.0.1:27017/bugemadesk

# JWT secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Optional server port (default 3000)
PORT=3000

# Node environment
NODE_ENV=production
```

**MongoDB Atlas example**:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/bugemadesk?retryWrites=true&w=majority
```

## Initial Seed Data

The first time you start the app, `scripts/seed.js` runs automatically (called from `start()` in `server.js`). It creates:

- **3 demo users** (Registrar, Accounts, HOD) with default passwords:
  - `registrar@bugemauniv.ac.ug / Admin@2026`
  - `accounts@bugemauniv.ac.ug / Accounts@2026`
  - `hod@bugemauniv.ac.ug / Hod@2026`
- **12 sample students** with courses, marks, and tuition payments
- **2 initial audit logs**

## API Endpoints (Protected – auth via `/api/auth/login`)

### Students
- `GET /api/students` — list/search (pageable, filtered, sortable)
- `GET /api/students/:id` — single record
- `POST /api/students` — create
- `PUT /api/students/:id` — full update
- `DELETE /api/students/:id` — soft delete (updates `deletedAt`)
- `POST /api/students/:id/courses` — assign course units (Registrar/HOD)
- `POST /api/students/:id/tuition` — record payment (Registrar/Accounts)
- `GET /api/students/chart` — programme distribution (for charts)
- `GET /api/students/enrollment-chart` — enrollment by semester
- `GET /api/students/tuition-chart` — tuition status summary
- `GET /api/students/academic-year-chart` — academic year distribution
- `GET /api/students/stats` — dashboard summary (total, active, tuition cleared, programmes, departments)
- `GET /api/students/options` — distinct programmes & departments (for UI selects)
- `POST /api/students/bulk-import` — CSV import (Registrar only, `multer`)
- `GET /api/students/public/verify/:regNo` — public verification (no auth, supports slashes in regNo)

### Audit Logs (Registrar only)
- `GET /api/audit-logs` — paginated audit trail (immutable)

### Auth
- `POST /api/auth/login` — sign‑in (supports remember‑me via localStorage/sessionStorage)
- `GET /api/auth/me` — current user info (protected)

### Health
- `GET /api/health` — liveliness/readiness probe

## RBAC Rules

| Role | Permissions (Student routes) |
|------appa (URL: /api/students) | |
| **Registrar** | All (CRUD, courses, tuition, charts, bulk‑import, audit logs) |
| **Accounts** | `POST /:id/tuition` only (tuition ledger) |
| **HOD** | `POST /:id/courses` only (assign courses/marks) |

**Global**: `protect` middleware enforces token + role check for all student routes.

## Frontend Features

- **Dark/Light theme** toggle (persist in localStorage)
- **Command palette** (Ctrl+K) for fast navigation and actions
- **Responsive UI** with hamburger menu on mobile
- **Modals**: student form, profile, academics & marks, tuition ledger, CSV import, digital ID
- **Import CSV**: PapaParse (frontend) + `csv-parser` (backend) with sample download
- **Analytics**: Chart.js integrated (3 charts in dashboard)
- **Print**: `@media print` styles for directory, registration slip, transcript, exam permit, digital ID
- **QR code** digital ID card modal (links to public `/verify.html?regNo=...`)
- **Toast notifications** (success/error)
- **Login guard**: app.js `init()` redirects to `/login.html` if no token

## UI Flow

1. **Open app** → `http://localhost:3000/` redirects to `/login.html`
2. **Login** with any demo role → token stored, redirected to dashboard (`index.html`)
3. **Dashboard** shows hero card, 5 stats, recent registrations, programme chart
4. **Navigation** sidebar (Overview, Students, Reports, Audit Logs)
5. **Students** list with search, filters, pagination, bulk CSV actions
6. **Profile modal** → Print registration slip (print‑optimized)
7. **Academic & Marks modal** → assign / edit courses
8. **Tuition ledger modal** → record payment (RBAC guarded)
9. **Print directory** (filtered list)
10. **Public verification** → `/verify.html` (no auth, can be bookmarked/shared)

## Docker / Render Deployment

**Render**: Drag‑and‑drop this repo, set environment variables, and choose the `Node.js` runtime.

**Dockerfile** (optional):

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## Testing

Run the unit tests:

```bash
npm test
```

All 13 tests pass. Tests cover:
- `validateStudentPayload` (required fields, formats, normalization)
- `buildStudentQuery` (filters, pagination, sorting)

## Printing

@ The `print-only` section and `printing-*` body classes are used to isolate print‑styled content.
- **Directory**: `/api/students/print-directory` (filtered records)
- **Slip**: per‑student registration slip (profile modal)
- **Transcript**: generated in `printSlipBtn` modal (requires CGPA, cleared tuition)
- **Exam Permit**: print‑styled modal (granted if `tuitionStatus===Cleared` OR `tuitionPaid ≥ 70%`)
- **Digital ID**: QR code modal (print with `printDigitalIdBtn`)

## Future Enhancements

- Email notifications for tuition payments
- Student self‑service portal (read‑only, public regNo)
- Advanced filtering & export (JSON, Excel)
- Automated course scheduling
- Mobile push notifications
- Role‑based UI visibility (customize dashboards per role)

## Credits

- Forked / adapted from original Kilo BugemaDesk starter
- Used Chart.js (v4), qrcode.js, and PapaParse via CDN (no npm install)
- RBAC and audit logging patterns from official Kilo docs
- Prints optimized for A4 portrait with browser‑based page breaks
- Theme toggle uses CSS custom properties for instant switch

## Legal

© 2024–2026 Bugema University. All code is MIT‑licensed.

---

**Quick deployment steps:**

1. **Push this repo to GitHub** (`git remote add origin <repo> && git push -u origin master`)
2. **Create MongoDB Atlas cluster**, get SRV URI, and set `MONGODB_URI` in Render env
3. **Set JWT_SECRET** in Render env (generates a random one if not set)
4. **Link Render app to GitHub repo**
5. **Deploy** – Render will run `npm install && npm start`
6. **Visit your Render URL** – app is live, login page at `/`

BugemaDesk is now production‑ready, cloud‑deployable, and fully documented. Enjoy managing the campus! 🚀
=======
# SchoolFlow — School Management System

A responsive school administration application built with vanilla HTML, CSS and JavaScript, Node.js, Express, MongoDB and Mongoose. School data is stored in MongoDB; the browser does not use localStorage as a database.

## Features

- Administrator sign-in with scrypt-hashed passwords and MongoDB-backed, HTTP-only sessions.
- Dashboard totals for students, teachers, classes, subjects, attendance, examinations and results; daily attendance counts and fee balances.
- Create, list, search, edit and delete students, teachers, classes, subjects, attendance records, examinations, results and fee accounts.
- Reference fields use MongoDB ObjectIds. Admission numbers, employee numbers, subject codes, class/year combinations and daily student attendance have database uniqueness constraints.
- Results calculate percentage and a configurable-in-code example grade using a Ugandan-style scale (D1: 80%+, D2: 75–79%, C3: 70–74%, C4: 65–69%, C5: 60–64%, C6: 55–59%, P7: 50–54%, P8: 45–49%, F9: below 45%).
- Fee accounts retain an individual payment ledger. Payments validate against the remaining balance and show date, method and receipt reference.
- `.env` configuration, API validation and useful HTTP error responses.

## Requirements

- Windows 10/11 and Node.js 20+ (includes npm).
- MongoDB Community Server running locally, or another MongoDB URI.
- VS Code (recommended).

## Install and run in Windows PowerShell

Open this folder in VS Code, choose **Terminal → New Terminal**, and run:

```powershell
npm install
Copy-Item .env.example .env
```

Edit `.env` before continuing. Set a unique administrator password of at least 12 characters and a random session secret (at least 32 characters). Example local database setting:

```dotenv
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/test
SESSION_SECRET=replace-this-with-a-random-secret-of-at-least-32-characters
ADMIN_EMAIL=admin@school.local
ADMIN_PASSWORD=replace-with-your-own-password-12-chars-minimum
ADMIN_NAME=School Administrator
```

Start the **MongoDB Server** Windows service. MongoDB Compass by itself is only a database client, not the database server. You can check the service in Windows **Services**, or connect Compass to `mongodb://127.0.0.1:27017`.

Create/update the administrator record (the password is hashed before it is stored):

```powershell
npm run seed:admin
```

Start the application:

```powershell
npm start
```

Open [http://localhost:3000](http://localhost:3000) and sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`. Leave the VS Code terminal open while using the app. Stop the server with **Ctrl+C**. For automatic restart during development use `npm run dev`.

`npm start` starts the web application; it does not create an administrator automatically. Run `npm run seed:admin` after setting the environment values, and run it again if you change the configured admin password.

## Project structure

```text
school-management-system/
├── public/
│   ├── app.js                 # Dashboard navigation, forms and API calls
│   ├── index.html             # Application shell and login screen
│   └── styles.css             # Responsive dashboard styles
├── scripts/
│   └── seed-admin.js          # Create/update configured administrator
├── src/
│   ├── config/database.js     # MongoDB connection and legacy fee migration
│   ├── controllers/           # Authentication and record operations
│   ├── middleware/auth.js     # Administrator-only API access
│   ├── models/index.js        # Mongoose schemas and validation
│   └── routes/api.js          # REST API routes
├── .env.example               # Environment template (copy to .env)
├── .gitignore
├── package.json
└── server.js                  # Express application entry point
```

## API overview

Except for health and sign-in state/login/logout, API endpoints require the administrator session.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Application and database status |
| GET / POST | `/api/auth/me`, `/api/auth/login` | Check session and sign in |
| POST | `/api/auth/logout` | Sign out |
| GET / POST | `/api/{students,teachers,classes,subjects,attendance,exams,results,fees}` | List/create records |
| POST | `/api/attendance/bulk` | Save attendance for an enrolled class roster in one request |
| GET | `/api/attendance?classId=:id` | List attendance records for one class |
| GET / PUT / DELETE | `/api/{resource}/:id` | Read/update/delete a record |
| GET / POST | `/api/fees/:id/payments` | View history and record an individual payment |
| GET | `/api/dashboard` | Dashboard totals and summaries |

The API validates required fields, enum values, numeric limits, references and duplicate records. Invalid ObjectIds return 400, missing records return 404, duplicate unique values return 409, unauthenticated management requests return 401, and database availability errors return 503.

Bulk attendance accepts `{ "classId": "...", "date": "YYYY-MM-DD", "records": [{ "studentId": "...", "status": "Present", "remarks": "" }] }`. Every student must belong to the selected class. Submitting attendance again for the same student and date updates that record rather than creating a duplicate.

## Notes

- MongoDB creates the database and collections when the application first writes records. The app connects to `mongodb://127.0.0.1:27017/test` unless `MONGODB_URI` is changed.
- Existing fee records created by the earlier single-payment version are migrated to a one-entry payment history on server startup.
- The displayed grade thresholds are examples; adjust them to the school's official grading policy.
- This is a university/local learning project, not a production-ready student information system. Before exposing it publicly, configure HTTPS and production secrets, add backups and audit policies, review privacy/legal obligations, and apply production-grade operational monitoring and account controls.

## Troubleshooting

- **MongoDB connection fails:** start MongoDB Server and check `MONGODB_URI`; the server exits instead of silently running without persistence.
- **Login fails:** ensure `.env` contains the expected administrator email and password, then run `npm run seed:admin`.
- **Port is in use:** set `PORT=3001` in `.env`, restart, and open `http://localhost:3001`.
- **A relation dropdown is empty:** create the related class, teacher, student, subject or exam first.
>>>>>>> origin/main
