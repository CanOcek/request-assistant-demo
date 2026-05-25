# Local Setup Quickstart

Use this to run the app locally from a fresh clone.

## 1. Install Dependencies

From the project root:

```powershell
npm.cmd install
```

## 2. Create Backend Env File

Create:

```text
apps/api/.env
```

Add:

```env
DATABASE_URL=your_neon_database_url
JWT_SECRET=your_long_random_secret
OPENAI_API_KEY=your_openai_api_key_optional_for_demo
OPENAI_MODEL=gpt-5.4-mini
CORS_ORIGIN=http://localhost:5173
PORT=3000
```

Generate a `JWT_SECRET`:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`OPENAI_API_KEY` is optional for basic demo use. Without it, the backend should use fallback extraction behavior.

## 3. Prepare Database

Run migrations and seed demo data:

```powershell
npm.cmd --workspace @request-assistant/api run db:migrate
npm.cmd --workspace @request-assistant/api run db:seed
```

## 4. Run Checks

```powershell
npm.cmd run check
npm.cmd run build
```

## 5. Start Local Servers

In one terminal:

```powershell
npm.cmd run dev:api
```

In a second terminal:

```powershell
npm.cmd run dev:web
```

Open:

```text
http://localhost:5173
```

## Useful URLs

Frontend:

```text
http://localhost:5173
```

Backend health check:

```text
http://localhost:3000/api/health
```

## Common Issues

If login fails, the database may not be seeded.

If the frontend says the backend is offline, confirm the API is running and `CORS_ORIGIN=http://localhost:5173`.

If AI extraction does not work, confirm `OPENAI_API_KEY` is set. The rest of the demo can still run without it.
