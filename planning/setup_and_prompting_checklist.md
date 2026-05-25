# Setup And Prompting Checklist

## Manual Setup Needed

### 1. Install Local Tools

- Install Node.js LTS.
- Install Git if not already installed.
- Optional but recommended: install VS Code or continue using PyCharm.

### 2. Create Accounts

- Create a Neon account for Postgres.
- Create an OpenAI platform account/API key.
- Optional for sharing later:
  - Create a Vercel account for frontend hosting.
  - Create a Render account for backend hosting.

### 3. Create Neon Database

- Create a new Neon project.
- Create or use the default Postgres database.
- Copy the connection string.
- Save it for `DATABASE_URL`.

### 4. Create OpenAI API Key

- Create an API key in the OpenAI platform.
- Save it for `OPENAI_API_KEY`.
- Set a small usage/budget limit in the OpenAI dashboard.

### 5. Generate JWT Secret

Run locally:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save the output for `JWT_SECRET`.

### 6. Create Local Env Files After Scaffold Exists

Backend:

```text
apps/api/.env
```

```env
DATABASE_URL=your_neon_connection_string
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_generated_secret
CORS_ORIGIN=http://localhost:5173
```

Frontend:

```text
apps/web/.env
```

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 7. Deployment Env Vars Later

Frontend on Vercel:

```env
VITE_API_BASE_URL=https://your-render-backend-url
```

Backend on Render:

```env
DATABASE_URL=your_neon_connection_string
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_generated_secret
CORS_ORIGIN=https://your-vercel-frontend-url
```

## Recommended Prompting Workflow For Codex

### General Rule

Prompt one sprint at a time from `planning/demo_implementation_plan.md`.

### Best Prompt Template

```text
Implement Sprint DX from planning/demo_implementation_plan.md.
Use planning/proposed_architecture.md and planning/product_brief.md as context.
Keep scope limited to the demo plan.
Do not add extra features.
After implementation, run relevant checks and tell me:
1. What changed
2. What works
3. What I need to do manually next
```

Replace `DX` with the sprint number, for example `D0`, `D1`, or `D2`.

### Suggested Sprint Order

1. `D0` Minimal project setup.
2. `D1` UI shell and language switch.
3. `D2` Database, schema, and seed data.
4. `D3` Demo login and role pages.
5. `D4` Tenant ticket creation.
6. `D5` Manager dashboard and updates.
7. `D6` AI-assisted structuring.
8. `D7` Owner approval flow.
9. `D8` Demo polish.

### If Time Is Short

Prioritize:

1. `D0`
2. `D1`
3. `D2`
4. `D3`
5. `D4`
6. `D6`
7. `D5`

Owner approval can come after if needed.

### When Something Fails

Use:

```text
The last sprint failed at [describe issue]. Debug it without expanding scope, run checks again, and tell me the fix.
```

### Before Deployment

Use:

```text
Prepare the current demo app for deployment to Vercel frontend, Render backend, and Neon Postgres. Do not deploy automatically. Tell me the exact manual deployment steps and required env vars.
```

