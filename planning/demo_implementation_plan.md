# Demo Implementation Plan

## Summary

This is a simplified same-day MVP plan for showing the maintenance request assistant. The demo should use seeded dummy data, demo-user logins, no real file storage, no Cloudinary, and only the core workflow: tenant submits a request, AI helps structure it, Hausverwaltung reviews it, owner approves or rejects it, and everyone can see relevant status updates.

## Demo Scope

### Include

- React/Vite frontend.
- Node/Express backend.
- Postgres database, preferably Neon.
- Demo-user login.
- Seeded dummy data.
- English/German language switch.
- Tenant request intake.
- AI-assisted ticket structuring.
- Hausverwaltung ticket dashboard and detail view.
- Owner approval list and detail view.
- Basic ticket status tracking.
- Mock attachment/photo fields as text or placeholder URLs only.

### Skip For Demo

- Cloudinary.
- Real image/file upload.
- Full admin setup UI.
- Full service-provider portal.
- Email notifications.
- Complex permissions.
- ERP integrations.
- Compliance features.
- Owner meeting features.
- Production-grade auth.

## Demo Users

Seed these users into the database:

### Tenant

- Email: `tenant@demo.com`
- Role: `tenant`
- Name: `Demo Tenant`

### Hausverwaltung

- Email: `manager@demo.com`
- Role: `property_manager`
- Name: `Demo Property Manager`

### Owner

- Email: `owner@demo.com`
- Role: `owner`
- Name: `Demo Owner`

For the demo, login can be passwordless by selecting a demo user from a login screen, or all demo users can share one simple password such as `demo123`.

Recommendation:

- Use selectable demo-user login to reduce setup friction during presentation.

## Dummy Data

Seed these records:

### Property

- Name: `Schillerstrasse 24`
- Address: `Schillerstrasse 24, 80336 Munich`

### Unit

- Label: `Apartment 3B`
- Floor: `3`
- Tenant: `Demo Tenant`
- Owner: `Demo Owner`

### Service Providers

Seed as simple contacts only:

- `Muller Plumbing`, trade `plumbing`
- `WarmTech Heating`, trade `heating`
- `Elektro Klein`, trade `electricity`

### Example Tickets

Seed two or three tickets so the dashboard is not empty:

1. Heating issue
   - Category: `heating`
   - Priority: `urgent`
   - Status: `submitted`
   - Description: heating does not work in the living room.

2. Water leak
   - Category: `water_damage`
   - Priority: `high`
   - Status: `waiting_for_owner_approval`
   - Description: water is dripping under the kitchen sink.

3. Internet/TV issue
   - Category: `internet_tv`
   - Priority: `medium`
   - Status: `in_progress`
   - Description: TV signal has been unstable for several days.

## Sprint D0: Minimal Project Setup

Goal:

Create the basic runnable app.

Steps:

- Create React/Vite/TypeScript frontend.
- Create Node/Express/TypeScript backend.
- Add simple folder structure:
  - `apps/web`
  - `apps/api`
  - `packages/shared`
- Add frontend route shell.
- Add backend health endpoint.
- Add frontend API base URL configuration.
- Confirm frontend can call backend health endpoint.

Done when:

- Frontend opens locally.
- Backend starts locally.
- Frontend shows backend is reachable.

## Sprint D1: UI Shell And Language Switch

Goal:

Create a presentable UI frame with English/German support.

Steps:

- Configure Tailwind CSS.
- Add basic shadcn/ui components needed for demo:
  - Button
  - Input
  - Textarea
  - Select
  - Badge
  - Card
  - Table
- Add `lucide-react`.
- Add i18next and React i18next.
- Add `en.json` and `de.json`.
- Add language switcher.
- Add basic navigation:
  - New request
  - My tickets
  - Manager dashboard
  - Approvals

Done when:

- User can switch between English and German.
- Main navigation and common labels translate.
- UI looks coherent enough for a demo.

## Sprint D2: Database, Schema, And Seed Data

Goal:

Add persistence and demo data.

Steps:

- Configure Drizzle ORM.
- Connect to Postgres with `DATABASE_URL`.
- Create schema for:
  - Users
  - Properties
  - Units
  - Tickets
  - Ticket messages
  - Approvals
  - Service providers
- Create migration.
- Create seed script with demo users, property, unit, providers, and example tickets.
- Add backend database connection check.

Done when:

- Migrations run successfully.
- Seed script fills the database.
- Backend can read seeded tickets.

## Sprint D3: Demo Login And Role-Based Pages

Goal:

Allow quick switching between demo users.

Steps:

- Add login page with demo-user buttons:
  - Continue as Tenant
  - Continue as Hausverwaltung
  - Continue as Owner
- Add backend endpoint:
  - `POST /api/auth/demo-login`
- Store a simple demo token in the browser.
- Add `/api/me`.
- Add role-based landing pages:
  - Tenant -> New request or My tickets
  - Hausverwaltung -> Manager dashboard
  - Owner -> Approval list

Done when:

- Presenter can switch demo roles quickly.
- Each role sees the correct pages.

## Sprint D4: Tenant Ticket Creation Without AI

Goal:

Make the ticket creation flow work before AI is added.

Steps:

- Build tenant request form with:
  - Title
  - Description
  - Category
  - Priority
  - Room/location
  - Contact details
  - Access details
  - Optional photo URL or attachment note
- Add form validation.
- Add backend endpoints:
  - `POST /api/tickets`
  - `GET /api/tickets`
  - `GET /api/tickets/:ticketId`
- Build tenant ticket list.
- Build tenant ticket detail page.

Done when:

- Tenant can create a ticket.
- Ticket appears in tenant list.
- Ticket appears in manager dashboard data.

## Sprint D5: Manager Dashboard And Ticket Updates

Goal:

Let the Hausverwaltung review and manage tickets.

Steps:

- Build manager dashboard with ticket table.
- Add filters:
  - Status
  - Priority
  - Category
- Build manager ticket detail page.
- Add editable fields:
  - Status
  - Category
  - Priority
  - Internal note
  - Tenant-visible update
- Add backend endpoints:
  - `PATCH /api/tickets/:ticketId`
  - `GET /api/tickets/:ticketId/messages`
  - `POST /api/tickets/:ticketId/messages`

Done when:

- Manager can update a ticket.
- Tenant can see tenant-visible updates.
- Internal notes remain manager-only.

## Sprint D6: AI-Assisted Request Structuring

Goal:

Add the key AI demo moment.

Steps:

- Add OpenAI backend service.
- Add endpoint:
  - `POST /api/ai/tickets/extract`
- Optional endpoint if time allows:
  - `POST /api/ai/tickets/check-completeness`
- AI should return:
  - Suggested title
  - Clean description
  - Category
  - Priority
  - Room/location if available
  - Missing fields
  - Follow-up questions
  - Short summary
  - Confidence score
- Add free-text mode to tenant request page.
- Add button: `Structure with AI`.
- Prefill form fields from AI result.
- Let user edit before submitting.

Done when:

- Tenant can paste an unstructured issue.
- AI fills structured fields.
- User can submit the final ticket.

Fallback if API setup fails:

- Add a deterministic local mock AI response for demo mode.
- Keep the UI flow identical.
- Clearly mark this as demo fallback in code comments, not in the UI.

## Sprint D7: Owner Approval Flow

Goal:

Complete the end-to-end demo workflow.

Steps:

- Add approval endpoints:
  - `POST /api/tickets/:ticketId/approval-request`
  - `GET /api/approvals`
  - `GET /api/approvals/:approvalId`
  - `POST /api/approvals/:approvalId/approve`
  - `POST /api/approvals/:approvalId/reject`
- Add manager button: `Request owner approval`.
- Build owner approval list.
- Build owner approval detail page.
- Owner can approve or reject with optional note.
- Ticket status updates after decision.

Done when:

- Manager can request approval.
- Owner sees pending request.
- Owner approves/rejects.
- Manager and tenant views reflect the updated status.

## Sprint D8: Demo Polish

Goal:

Make the MVP presentable for a same-day demo.

Steps:

- Add status badges.
- Add priority badges.
- Add loading states.
- Add empty states.
- Add simple error messages.
- Add translated labels for all visible demo UI.
- Add a clear status timeline on ticket detail.
- Add seeded example messages for richer demo data.
- Test main flow in English and German.

Done when:

- App can be demoed without explaining missing pieces.
- Core flow works in both languages.

## Minimal Backend Endpoints For Demo

Auth:

- `POST /api/auth/demo-login`
- `GET /api/me`

Tickets:

- `GET /api/tickets`
- `POST /api/tickets`
- `GET /api/tickets/:ticketId`
- `PATCH /api/tickets/:ticketId`
- `GET /api/tickets/:ticketId/messages`
- `POST /api/tickets/:ticketId/messages`

AI:

- `POST /api/ai/tickets/extract`

Approvals:

- `POST /api/tickets/:ticketId/approval-request`
- `GET /api/approvals`
- `GET /api/approvals/:approvalId`
- `POST /api/approvals/:approvalId/approve`
- `POST /api/approvals/:approvalId/reject`

Health:

- `GET /api/health`

## Minimal Frontend Pages For Demo

- Login/demo user selection.
- Tenant new request.
- Tenant ticket list.
- Tenant ticket detail.
- Manager dashboard.
- Manager ticket detail.
- Owner approval list.
- Owner approval detail.

## Suggested Demo Script

1. Open the app and switch language to English or German.
2. Continue as tenant.
3. Paste an unstructured maintenance issue.
4. Click `Structure with AI`.
5. Review the generated structured ticket.
6. Submit the ticket.
7. Switch to Hausverwaltung.
8. Open the dashboard and review the new ticket.
9. Add a tenant-visible update.
10. Request owner approval.
11. Switch to owner.
12. Open approval request.
13. Approve or reject with a note.
14. Switch back to Hausverwaltung or tenant and show the updated status.

## Manual Steps Required

### Required

- Create or choose a Postgres database.
- Recommended: create a Neon Postgres database.
- Copy the database connection string.
- Create an OpenAI API key if real AI extraction should be used.
- Install Node.js locally if not already installed.
- Install project dependencies after the scaffold exists.

### Environment Variables

Create backend environment file:

```text
apps/api/.env
```

Required:

```text
DATABASE_URL=your_neon_or_local_postgres_connection_string
JWT_SECRET=replace_with_a_long_random_secret_for_demo_tokens
CORS_ORIGIN=http://localhost:5173
```

Required only if using real AI:

```text
OPENAI_API_KEY=your_openai_api_key
```

Create frontend environment file:

```text
apps/web/.env
```

Required:

```text
VITE_API_BASE_URL=http://localhost:3000
```

### Optional For Sharing The Demo

- Create a Vercel project for the frontend.
- Create a Render or Railway project for the backend.
- Add the same backend environment variables to Render/Railway.
- Add `VITE_API_BASE_URL=https://your-backend-url` to Vercel.
- Update backend `CORS_ORIGIN=https://your-frontend-url`.
- Run migrations and seed script against the Neon database.

### Decisions To Make Before Coding

- Whether demo login uses buttons only or a shared password.
- Whether to use real OpenAI extraction or mock AI fallback if setup time is tight.
- Whether the same-day demo needs public deployment or local screen sharing is enough.

