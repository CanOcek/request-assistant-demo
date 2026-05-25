# Proposed Architecture

## Summary

Use a simple full-stack web app with a React/Vite frontend, a small Node/Express backend, and Postgres hosted on Neon. This keeps the project understandable, gives teammates a browser link for testing, avoids a heavy framework migration, and stays close to the kind of React/Tailwind/shadcn stack that Lovable commonly generates. The app should include English/German language switching from the beginning.

## Recommended Architecture

### Frontend

Use a React single-page app.

Recommended stack:

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- shadcn/ui
- TanStack Query
- i18next

Responsibilities:

- Tenant request intake.
- Tenant ticket list and detail views.
- Hausverwaltung dashboard.
- Hausverwaltung ticket detail view.
- Owner approval pages.
- Admin setup pages.
- English/German language toggle.

Why this fits:

- Lovable-generated apps are usually React/Tailwind/shadcn-style apps, so merging or reusing teammate code should be easier.
- Vite is lightweight and fast for a prototype.
- A single-page app is enough for the current scope.

### Backend

Use a small Node.js API.

Recommended stack:

- Node.js
- Express
- TypeScript
- Drizzle ORM
- Zod
- OpenAI SDK

Responsibilities:

- User/session handling for the prototype.
- CRUD endpoints for tickets, properties, units, attachments, approvals, and service providers.
- AI extraction, completeness checking, categorization, priority suggestion, and summary generation.
- Database access.
- Server-side protection of AI API keys and database credentials.

Why this fits:

- Express is simple and familiar.
- A separate backend keeps API keys off the frontend.
- The backend can be deployed independently and called by a Lovable/Vite frontend.
- Drizzle keeps the database layer lighter than Prisma while still giving typed schema management.

### Database

Use Postgres.

Recommended host:

- Neon

Why Neon fits:

- It provides managed Postgres without running infrastructure locally.
- It is suitable for a preliminary shared database.
- Teammates can test against the same deployed database.
- It avoids committing to a larger platform too early.

Alternative:

- Supabase could also work, especially because Lovable often integrates well with Supabase. However, if the team wants to keep control of backend logic in a normal Node API and use Neon, Neon is a clean choice.

### File Uploads

For the first version, keep uploads simple.

Recommended options:

1. Store attachment metadata in Postgres and use object storage later.
2. If real photo uploads are needed immediately, use Cloudinary.

Recommendation for MVP:

- Start with Cloudinary only if real photo upload is needed during testing.
- Otherwise, support attachment URLs or local/mock uploads first.

Why:

- Building file storage too early adds setup complexity.
- The product can still validate the core request workflow without production-grade file storage.

### Deployment

Recommended deployment setup:

- Frontend: Vercel
- Backend: Render or Railway
- Database: Neon

Why:

- Vercel gives a shareable frontend URL quickly.
- Render or Railway can host the Express API with minimal setup.
- Neon gives a shared Postgres URL.
- This lets teammates test from their own devices through normal public links.

Alternative:

- If the team later moves closer to Lovable/Supabase, the frontend can remain mostly the same while backend/database decisions are revisited.

## App Structure

Recommended repository layout:

```text
/
  apps/
    web/
      src/
        components/
        pages/
        routes/
        lib/
        i18n/
        api/
        styles/
    api/
      src/
        routes/
        services/
        db/
        ai/
        middleware/
        validators/
  packages/
    shared/
      src/
        types/
        schemas/
  planning/
```

For a smaller prototype, this can also be flattened:

```text
/
  frontend/
  backend/
  planning/
```

Recommendation:

- Use `apps/web` and `apps/api` if starting clean.
- Use `frontend` and `backend` if the team prefers simpler folder names.

## Package Requirements

### Root / Workspace

#### `pnpm`

Purpose:

- Package manager for the monorepo.

Justification:

- Fast installs.
- Good workspace support.
- Keeps frontend, backend, and shared types manageable.

Alternative:

- `npm` is acceptable if teammates prefer the lowest-friction setup.

#### `typescript`

Purpose:

- Shared type safety across frontend and backend.

Justification:

- Reduces mismatch between API responses, database entities, and UI assumptions.

### Frontend Dependencies

#### `react`

Purpose:

- Main UI library.

Justification:

- Common with Lovable-generated code.
- Flexible enough for dashboards, forms, and ticket flows.

#### `react-dom`

Purpose:

- Renders React into the browser.

Justification:

- Required for React web apps.

#### `vite`

Purpose:

- Frontend dev server and build tool.

Justification:

- Lightweight.
- Fast.
- Common in generated React prototypes.

#### `@vitejs/plugin-react`

Purpose:

- React support for Vite.

Justification:

- Standard Vite React integration.

#### `react-router-dom`

Purpose:

- Client-side routing.

Justification:

- Needed for pages such as request intake, ticket detail, manager dashboard, and owner approvals.
- Simpler than adding a full framework router.

#### `@tanstack/react-query`

Purpose:

- API data fetching, caching, loading states, and refetching.

Justification:

- Keeps server state cleaner than manually using `useEffect` everywhere.
- Useful for ticket lists, approval lists, detail pages, and status updates.

#### `tailwindcss`

Purpose:

- Utility-first CSS styling.

Justification:

- Fits Lovable-style apps.
- Works well with shadcn/ui.
- Fast for prototype UI.

#### `postcss`

Purpose:

- CSS processing required by Tailwind.

Justification:

- Standard Tailwind dependency.

#### `autoprefixer`

Purpose:

- Adds vendor prefixes where needed.

Justification:

- Standard Tailwind/PostCSS setup.

#### `shadcn/ui`

Purpose:

- Reusable UI components built on Tailwind and Radix.

Justification:

- Matches Lovable-style output.
- Gives forms, dialogs, tabs, buttons, cards, tables, dropdowns, and badges without designing everything from scratch.
- Components are copied into the codebase, making them easy to customize.

#### `lucide-react`

Purpose:

- Icon library.

Justification:

- Commonly used with shadcn/ui.
- Useful for actions, status indicators, navigation, uploads, approvals, and settings.

#### `react-hook-form`

Purpose:

- Form state management.

Justification:

- Good fit for request intake, approval forms, admin setup forms, and ticket edit forms.
- Avoids excessive custom form state.

#### `zod`

Purpose:

- Runtime validation schemas.

Justification:

- Can share validation logic between frontend and backend.
- Useful for ticket creation, AI extraction results, and approval decisions.

#### `@hookform/resolvers`

Purpose:

- Connects Zod validation to React Hook Form.

Justification:

- Keeps form validation declarative and consistent.

#### `i18next`

Purpose:

- Internationalization engine.

Justification:

- Required for English/German UI support.
- Lets the app switch languages without duplicating pages.

#### `react-i18next`

Purpose:

- React bindings for i18next.

Justification:

- Provides hooks and components for translated UI text.

#### `clsx`

Purpose:

- Conditional class name utility.

Justification:

- Helpful for status badges, active navigation, priority styling, and component variants.

#### `tailwind-merge`

Purpose:

- Safely merges Tailwind class names.

Justification:

- Common in shadcn/ui setups.
- Prevents conflicting Tailwind classes.

### Backend Dependencies

#### `express`

Purpose:

- HTTP API server.

Justification:

- Small, familiar, and enough for the current backend endpoints.
- Avoids the complexity of a larger backend framework.

#### `cors`

Purpose:

- Allows frontend and backend to run on different domains during development and deployment.

Justification:

- Needed when frontend is on Vercel and backend is on Render/Railway.

#### `dotenv`

Purpose:

- Loads environment variables locally.

Justification:

- Needed for database URL, OpenAI API key, CORS origins, and deployment configuration.

#### `drizzle-orm`

Purpose:

- Typed database ORM/query layer.

Justification:

- Works well with Postgres.
- Lighter than Prisma.
- Keeps schema definitions close to TypeScript types.

#### `drizzle-kit`

Purpose:

- Database migration and schema tooling.

Justification:

- Needed to create and evolve database tables safely.

#### `postgres`

Purpose:

- Postgres client library used by Drizzle.

Justification:

- Simple and works well with Neon connection strings.

#### `zod`

Purpose:

- Runtime request and response validation.

Justification:

- Protects API routes from invalid input.
- Can validate AI outputs before saving them.

#### `openai`

Purpose:

- Calls OpenAI models for ticket extraction, completeness checking, categorization, priority suggestion, and summaries.

Justification:

- The product depends on AI-assisted structuring.
- Keeping this in the backend protects the API key.

#### `multer`

Purpose:

- Handles multipart file uploads if local upload handling is needed.

Justification:

- Useful for photos attached to maintenance requests.
- Can be skipped initially if the prototype uses URL-only or mocked attachments.

#### `cloudinary`

Purpose:

- Stores uploaded photos if real image upload is needed.

Justification:

- Avoids building object storage infrastructure.
- Gives public/private hosted URLs for attachments.
- Optional for MVP if upload complexity should stay low.

#### `jsonwebtoken`

Purpose:

- Simple token-based authentication.

Justification:

- Enough for a prototype with roles.
- Can be replaced later by Supabase Auth, Clerk, Auth.js, or another auth provider.

#### `bcryptjs`

Purpose:

- Password hashing if email/password login is implemented.

Justification:

- Needed only if the prototype stores passwords.
- Can be skipped if using simple test users or magic-link style auth later.

### Development Dependencies

#### `tsx`

Purpose:

- Runs TypeScript backend code during development.

Justification:

- Avoids manual build steps while developing the API.

#### `nodemon`

Purpose:

- Restarts backend on file changes.

Justification:

- Improves development speed.

#### `eslint`

Purpose:

- Code linting.

Justification:

- Catches common mistakes early.

#### `prettier`

Purpose:

- Code formatting.

Justification:

- Keeps team contributions consistent.

## Environment Variables

Recommended backend variables:

```text
DATABASE_URL=
OPENAI_API_KEY=
JWT_SECRET=
CORS_ORIGIN=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Recommended frontend variables:

```text
VITE_API_BASE_URL=
```

Notes:

- Cloudinary variables are only required if real uploads are enabled.
- `JWT_SECRET` is only required if using JWT auth.
- Never expose `OPENAI_API_KEY` in the frontend.

## Language Support

The UI must support English and German.

Recommended approach:

- Add a language switcher in the app header or settings area.
- Store selected language in local storage.
- Keep translation files in:

```text
apps/web/src/i18n/en.json
apps/web/src/i18n/de.json
```

Initial language keys should cover:

- Navigation labels.
- Ticket statuses.
- Priorities.
- Categories.
- Form labels.
- Validation messages.
- Button labels.
- Empty states.
- Approval actions.

The database does not need to store translated labels. Store stable enum values such as `water_damage`, then translate them in the UI.

## Proposed Data Flow

### Request Intake

1. User opens tenant request intake page.
2. User enters free text and optional structured fields.
3. Frontend calls `POST /api/ai/tickets/extract`.
4. Backend calls OpenAI and validates the structured result with Zod.
5. Frontend displays suggested fields.
6. Frontend calls `POST /api/ai/tickets/check-completeness`.
7. If fields are missing, the UI asks follow-up questions.
8. User submits final request.
9. Frontend calls `POST /api/tickets`.
10. Ticket is saved in Postgres.

### Manager Review

1. Manager opens dashboard.
2. Frontend calls `GET /api/tickets`.
3. Manager opens a ticket.
4. Manager edits fields or status.
5. Frontend calls `PATCH /api/tickets/:ticketId`.
6. If owner approval is needed, manager calls `POST /api/tickets/:ticketId/approval-request`.

### Owner Approval

1. Owner opens approval list.
2. Frontend calls `GET /api/approvals`.
3. Owner opens approval detail.
4. Owner approves or rejects.
5. Backend updates approval and related ticket status.

## Deployment Plan

### Recommended Prototype Deployment

- Frontend on Vercel.
- Backend on Render or Railway.
- Database on Neon.

This gives:

- Public frontend link for teammates.
- Public API URL.
- Shared database.
- Separate environment variable management.

### Local Development

Run frontend and backend separately:

```text
apps/web  -> http://localhost:5173
apps/api  -> http://localhost:3000
```

Frontend uses `VITE_API_BASE_URL=http://localhost:3000`.

## Why Not Use A Heavier Setup Yet

Avoid for now:

- Next.js full-stack app.
- Microservices.
- Full provider portal.
- Complex permissions engine.
- Event queues.
- Object storage unless real uploads are required.
- ERP integrations.

Reason:

The prototype needs to validate the maintenance-request workflow first: submit, structure, review, approve, and track.

## Final Recommendation

Start with:

- React + Vite + TypeScript frontend.
- Tailwind + shadcn/ui for UI.
- i18next for English/German switching.
- Node + Express + TypeScript backend.
- Drizzle + Neon Postgres for persistence.
- OpenAI SDK on the backend for AI assistance.
- Vercel frontend deployment and Render/Railway backend deployment.

This stack is simple enough for a student/team prototype, compatible with likely Lovable-generated frontend code, and strong enough to support the app described in the product brief without expanding the project scope.

