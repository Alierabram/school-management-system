# Deployment Guide — MongoDB Atlas + GitHub + Render

This guide takes BugemaDesk from your local machine to a live, public URL using:
- **MongoDB Atlas** — managed cloud database
- **GitHub** — source control + deploy trigger
- **Render** — Node.js web service hosting

---

## Part 1 — MongoDB Atlas (cloud database)

1. Sign up / log in at <https://cloud.mongodb.com>.
2. **Create a cluster** (the free M0 tier is enough):
   - Click **Build a Database** → choose **M0 Free** → pick a region near you → **Create**.
3. **Create a database user**:
   - Left menu → **Database Access** → **Add New Database User**.
   - Authentication method: **Password**.
   - Username: e.g. `bugemadesk_user`
   - Password: click **Autogenerate Secure Password** and **copy it** (you'll need it below).
   - Database User Privileges: **Read and write to any database** → **Add User**.
4. **Allow network access from Render**:
   - Left menu → **Network Access** → **Add IP Address**.
   - Click **Allow Access from Anywhere** → `0.0.0.0/0` → **Confirm**.
     (Render's outbound IPs are not fixed on the free plan, so `0.0.0.0/0` is required. Atlas still requires the DB username/password.)
5. **Get your connection string**:
   - Left menu → **Database** → **Connect** on your cluster → **Drivers**.
   - Copy the string. It looks like:
     ```
     mongodb+srv://bugemadesk_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with the password from step 3.
   - Add the database name before the `?`:
     ```
     mongodb+srv://bugemadesk_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/bugemadesk?retryWrites=true&w=majority
     ```
   - Save this — it becomes `MONGODB_URI` on Render.

---

## Part 2 — GitHub (source control)

The repo is already initialized locally. Push it:

1. Create a **new empty repository** on GitHub (no README, no .gitignore) — e.g. `bugemadesk`.
2. In your project folder, run:
   ```bash
   git add .
   git commit -m "BugemaDesk v2.0 - student management system"
   git branch -M main
   git remote add origin https://github.com/<your-username>/bugemadesk.git
   git push -u origin main
   ```
3. Confirm `.env` is **not** pushed (it is in `.gitignore`). Only `.env.example` should appear.

> Note: `git init` already ran in the project directory, and files were staged. If you committed earlier, just `git push`.

---

## Part 3 — Render (hosting)

### Option A — Blueprint (uses `render.yaml`, recommended)

1. Push the repo to GitHub (Part 2).
2. In Render → **New** → **Blueprint** → connect your GitHub repo.
3. Render reads `render.yaml` and creates the web service.
4. When prompted, enter the environment variables (see below).

### Option B — Manual web service

1. Render → **New** → **Web Service** → connect your GitHub repo.
2. Settings:
   - **Name**: `bugemadesk`
   - **Region**: closest to you
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
3. Add environment variables (next section) → **Create Web Service**.

### Required environment variables (Render → Environment)

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | your Atlas SRV string from Part 1 |
| `JWT_SECRET` | a long random string (or let Render generate it) |
| `INITIAL_ADMIN_EMAIL` | your real registrar email, e.g. `registrar@bugemauniv.ac.ug` |
| `INITIAL_ADMIN_PASSWORD` | a strong password, **min 12 characters** |

Render injects `PORT` automatically — do **not** set it manually.

> On first boot, the app seeds exactly **one** registrar account from `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD`. The demo accounts (`Admin@2026`, etc.) are **only** created outside production. Keep your admin credentials safe.

4. Render builds and deploys. Watch the **Logs** tab:
   ```
   Connected to MongoDB.
   Seeded user: your-email (Registrar)
   Seeded 12 student records.
   BugemaDesk running at http://localhost:<port>
   ```
5. Open the public URL — you land on the **login page** (`/`), then sign in with the registrar account you set.

---

## Post-deploy checklist

- [ ] `https://<your-app>.onrender.com/` shows the login page
- [ ] Login with `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` works
- [ ] Dashboard loads stats and charts
- [ ] `GET https://<your-app>.onrender.com/api/health` returns `{ "ok": true }`
- [ ] Public verify works: `/verify.html?regNo=24/BSE/BU/R/0016`
- [ ] Atlas → **Database** shows the `bugemadesk` database with `users`, `students`, `audit_logs`

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| App boots then crashes: "Production requires INITIAL_ADMIN_EMAIL..." | Set `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` (≥12 chars) in Render env. |
| Health check fails / cannot reach MongoDB | Check Atlas **Network Access** allows `0.0.0.0/0`, and the `MONGODB_URI` password is correct. |
| 401 on all API calls after redeploy | `JWT_SECRET` changed — old tokens are invalid. Sign in again. |
| Charts/QR not showing | They load from CDN (Chart.js, qrcode.js, PapaParse). Ensure the browser has internet access. |
| Free instance cold starts | Render free services sleep after inactivity; the first request may take ~30–50s. |

---

## Updating the live app

```bash
# make changes locally, then:
git add .
git commit -m "describe change"
git push
```
Render auto-deploys on every push to `main`.
