# Deployment Instructions

## Goal

Deploy the current demo so teammates can open it from their own devices using a public frontend URL.

Recommended setup:

- Database: Neon
- Backend API: Render
- Frontend: Vercel

## 1. Check Local App First

From the project root, run:

```powershell
npm.cmd run check
npm.cmd run build
```

Then run locally:

```powershell
npm.cmd run dev:api
npm.cmd run dev:web
```

Open:

```text
http://localhost:5173
```

Confirm the demo works before deploying.

## 2. Push Project To GitHub

Create a GitHub repository.

From the project root:

```powershell
git init
git add .
git commit -m "Initial demo MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Do not commit `.env` files. They are already ignored by `.gitignore`.

## 3. Prepare Backend Environment Values

You need these values for Render:

```env
DATABASE_URL=your_neon_connection_string
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.4-mini
JWT_SECRET=your_long_random_secret
CORS_ORIGIN=*
```

Use `CORS_ORIGIN=*` only for the first backend deploy. After Vercel gives you the frontend URL, replace it with the exact Vercel URL.

Generate `JWT_SECRET` locally if needed:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 4. Deploy Backend On Render

Go to:

```text
https://render.com
```

Steps:

1. Create a Render account or log in.
2. Click `New +`.
3. Choose `Web Service`.
4. Connect your GitHub repository.
5. Use these settings:

```text
Name:
request-assistant-api

Runtime:
Node

Root Directory:
leave empty / repository root

Build Command:
npm install && npm --workspace @request-assistant/shared run build && npm --workspace @request-assistant/api run build

Start Command:
npm --workspace @request-assistant/api run start
```

6. Add the backend environment variables from step 3.
7. Deploy.

After deployment, Render gives you a backend URL like:

```text
https://request-assistant-api.onrender.com
```

Test:

```text
https://request-assistant-api.onrender.com/api/health
```

Expected:

```json
"status": "ok",
"database": "connected"
```

## 5. Deploy Frontend On Vercel

Go to:

```text
https://vercel.com
```

Steps:

1. Create a Vercel account or log in.
2. Click `Add New Project`.
3. Import the same GitHub repository.
4. Use these settings:

```text
Framework Preset:
Vite

Root Directory:
leave empty / repository root

Install Command:
npm install

Build Command:
npm --workspace @request-assistant/shared run build && npm --workspace @request-assistant/web run build

Output Directory:
apps/web/dist
```

5. Add this frontend environment variable:

```env
VITE_API_BASE_URL=https://your-render-backend-url
```

Example:

```env
VITE_API_BASE_URL=https://request-assistant-api.onrender.com
```

6. Deploy.

Vercel gives you a frontend URL like:

```text
https://request-assistant-demo.vercel.app
```

## 6. Update Render CORS

Go back to the Render backend service.

Change:

```env
CORS_ORIGIN=*
```

to:

```env
CORS_ORIGIN=https://your-vercel-frontend-url
```

Example:

```env
CORS_ORIGIN=https://request-assistant-demo.vercel.app
```

Redeploy or restart the Render backend.

## 7. Final Test

Open the Vercel frontend URL on your own device:

```text
https://your-vercel-frontend-url
```

Test the full demo flow:

1. Switch language to English or German.
2. Continue as `Tenant`.
3. Paste an unstructured issue.
4. Click `Structure with AI`.
5. Submit the ticket.
6. Log out.
7. Continue as `Hausverwaltung`.
8. Open the ticket.
9. Add a tenant-visible update.
10. Request owner approval.
11. Log out.
12. Continue as `Owner`.
13. Open approvals.
14. Approve or reject the request.

If this works, send the Vercel frontend URL to your teammates.

## 8. If The Database Is Empty

If you create a new Neon database for deployment, run migrations and seed data against that database.

Locally, set `apps/api/.env` to the deployed Neon `DATABASE_URL`, then run:

```powershell
npm.cmd --workspace @request-assistant/api run db:migrate
npm.cmd --workspace @request-assistant/api run db:seed
```

Then redeploy/restart the Render backend.

## 9. Common Problems

### Frontend says backend is offline

Check Vercel:

```env
VITE_API_BASE_URL=https://your-render-backend-url
```

Also check that the Render backend is awake. Free Render services may sleep when idle.

### Backend health says database error

Check Render:

```env
DATABASE_URL=your_neon_connection_string
```

Make sure the Neon database still exists and the connection string includes SSL settings.

### Login fails

The database may not be seeded.

Run:

```powershell
npm.cmd --workspace @request-assistant/api run db:seed
```

### AI structuring fails

Check Render:

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.4-mini
```

If no API key is available, the backend should use the demo fallback.

### Browser CORS error

Check Render:

```env
CORS_ORIGIN=https://your-vercel-frontend-url
```

The value must match the Vercel URL exactly.

