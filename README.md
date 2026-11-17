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
