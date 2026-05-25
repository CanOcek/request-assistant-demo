# Implementation Plan

## Summary

This plan breaks the maintenance request assistant into small implementation sprints. Each sprint should be independently buildable and testable, so future prompts can ask to implement one sprint at a time without expanding the project scope.

## Sprint 0: Project Scaffold

Goal:

Set up the basic project structure, tooling, and empty app shell.

Implementation steps:

- Create a frontend app with React, Vite, and TypeScript.
- Create a backend app with Node, Express, and TypeScript.
- Add workspace/package scripts for running frontend and backend.
- Add basic linting/formatting setup.
- Add initial folder structure:
  - `apps/web`
  - `apps/api`
  - `packages/shared`
- Add a basic frontend layout with placeholder navigation.
- Add a basic backend health endpoint.
- Add environment variable examples.

Expected result:

- Frontend runs locally.
- Backend runs locally.
- Frontend can call backend health endpoint.
- No database or AI functionality yet.

Suggested verification:

- Open frontend in browser.
- Confirm backend health endpoint returns a success response.
- Confirm frontend displays backend connection status.

## Sprint 1: UI Foundation And Internationalization

Goal:

Build the reusable UI foundation and English/German language switching.

Implementation steps:

- Install and configure Tailwind CSS.
- Add shadcn/ui setup.
- Add core UI components:
  - Button
  - Input
  - Textarea
  - Select
  - Badge
  - Card
  - Dialog
  - Table
  - Tabs
- Add `lucide-react` icons.
- Add `i18next` and `react-i18next`.
- Create English and German translation files.
- Add a language switcher in the app shell.
- Add role-aware placeholder navigation:
  - Tenant
  - Hausverwaltung
  - Owner
  - Admin
- Add translated labels for:
  - Navigation
  - Ticket statuses
  - Priorities
  - Categories
  - Common buttons
  - Common empty states

Expected result:

- UI shell is styled.
- User can switch between English and German.
- Language preference persists locally.
- Pages still use placeholder content.

Suggested verification:

- Switch language and refresh the page.
- Confirm labels remain in the selected language.
- Confirm layout works on desktop and mobile widths.

## Sprint 2: Database And Core Backend Models

Goal:

Add Postgres persistence and core backend data models.

Implementation steps:

- Install and configure Drizzle ORM.
- Add Postgres connection using `DATABASE_URL`.
- Define database schema for:
  - Users
  - Properties
  - Units
  - Maintenance tickets
  - Ticket messages
  - Attachments
  - Approvals
  - Service providers
- Add Drizzle migration scripts.
- Add seed script for local/demo data:
  - One tenant
  - One owner
  - One property manager
  - One property
  - One unit
  - A few service providers
- Add basic backend services/repositories for database access.
- Add shared TypeScript/Zod schemas for core entities.

Expected result:

- Database schema exists.
- Migrations can be applied.
- Demo data can be seeded.
- Backend can read/write basic records internally.

Suggested verification:

- Run migrations.
- Run seed script.
- Confirm seeded records exist in the database.
- Confirm backend starts with valid database connection.

## Sprint 3: Basic Auth And Role Switching

Goal:

Add simple prototype authentication and role-based routing.

Implementation steps:

- Implement simple login endpoint.
- Use seeded demo users.
- Add JWT-based session handling or simple prototype token handling.
- Add `/api/me`.
- Add frontend login page.
- Store token in browser storage for the prototype.
- Add protected frontend routes.
- Add role-based redirect after login:
  - Tenant -> tenant ticket list or request intake
  - Property manager -> Hausverwaltung dashboard
  - Owner -> owner approval list
  - Admin -> admin setup page
- Add logout.

Expected result:

- Users can log in as demo roles.
- Frontend shows the correct role-based navigation.
- Backend can identify the current user.

Suggested verification:

- Log in as each seeded role.
- Confirm each role lands on the expected page.
- Confirm protected API calls reject missing/invalid tokens.

## Sprint 4: Tenant Request Intake Without AI

Goal:

Let tenants create structured maintenance tickets manually.

Implementation steps:

- Build tenant request intake page.
- Add form fields:
  - Property/unit
  - Title
  - Description
  - Category
  - Urgency/priority
  - Room or location
  - Contact details
  - Access details
- Add frontend validation with React Hook Form and Zod.
- Add `POST /api/tickets`.
- Add `GET /api/tickets`.
- Add `GET /api/tickets/:ticketId`.
- Add role-aware ticket filtering:
  - Tenants see their own tickets.
  - Managers see all tickets.
  - Owners see relevant tickets where applicable.
- Add tenant ticket list page.
- Add tenant ticket detail page.

Expected result:

- Tenant can create a ticket without AI.
- Tenant can view submitted tickets.
- Manager can see submitted tickets in the backend response, even if manager UI is still basic.

Suggested verification:

- Log in as tenant.
- Submit a maintenance request.
- Confirm it appears in tenant ticket list.
- Open the ticket detail page.
- Confirm it exists in the database.

## Sprint 5: Hausverwaltung Dashboard And Ticket Management

Goal:

Give property managers the core operating dashboard.

Implementation steps:

- Build Hausverwaltung dashboard page.
- Add ticket table/list with filters:
  - Status
  - Priority
  - Category
  - Property
- Build Hausverwaltung ticket detail page.
- Show:
  - Submitted information
  - Attachments placeholder
  - Current status
  - Priority
  - Category
  - Tenant/contact details
  - Internal notes/messages
- Add `PATCH /api/tickets/:ticketId`.
- Add `GET /api/tickets/:ticketId/messages`.
- Add `POST /api/tickets/:ticketId/messages`.
- Let managers update:
  - Status
  - Category
  - Priority
  - Room/location
  - Internal notes
  - Tenant-visible updates
- Add status timeline or simple update list.

Expected result:

- Manager can review and update tickets.
- Tenant can see tenant-visible status updates.
- Internal notes stay hidden from tenants.

Suggested verification:

- Tenant submits a ticket.
- Manager updates status and adds a tenant-visible message.
- Tenant sees the update.
- Manager adds an internal note.
- Tenant does not see the internal note.

## Sprint 6: AI Ticket Structuring

Goal:

Add AI-assisted extraction and completeness checking to the request intake flow.

Implementation steps:

- Add OpenAI SDK to backend.
- Add backend AI service.
- Add `POST /api/ai/tickets/extract`.
- Add `POST /api/ai/tickets/check-completeness`.
- Define strict Zod schemas for AI output.
- Make AI extraction return:
  - Suggested title
  - Suggested description
  - Suggested category
  - Suggested priority
  - Suggested room/location
  - Missing fields
  - Follow-up questions
  - Short summary
  - Confidence score
- Add free-text input mode to tenant request page.
- Show AI suggestions before final submission.
- Let user accept/edit AI-suggested fields.
- Add follow-up question UI.
- Save AI summary and confidence on ticket creation.

Expected result:

- Tenant can enter unstructured text.
- AI suggests structured fields.
- App asks for missing information.
- Tenant can submit a final structured ticket.

Suggested verification:

- Submit vague issue text and confirm follow-up questions appear.
- Submit detailed issue text and confirm fields are prefilled.
- Confirm saved ticket contains AI summary and confidence.
- Confirm user can override AI suggestions before submit.

## Sprint 7: Owner Approval Workflow

Goal:

Support owner approval for selected maintenance tickets.

Implementation steps:

- Add approval request backend logic.
- Add `POST /api/tickets/:ticketId/approval-request`.
- Add `GET /api/approvals`.
- Add `GET /api/approvals/:approvalId`.
- Add `POST /api/approvals/:approvalId/approve`.
- Add `POST /api/approvals/:approvalId/reject`.
- Add manager UI control to request owner approval.
- Update ticket status to `waiting_for_owner_approval`.
- Build owner approval list page.
- Build owner approval detail page.
- Show:
  - Ticket summary
  - Property/unit
  - Category
  - Priority
  - Photos placeholder
  - Manager note
  - Approve/reject buttons
- Add optional owner decision note.
- Reflect approval decision back on ticket detail.

Expected result:

- Manager can request owner approval.
- Owner can approve or reject.
- Ticket status reflects the decision.

Suggested verification:

- Manager requests approval for a ticket.
- Owner sees pending approval.
- Owner approves it.
- Manager sees ticket status changed to approved.
- Repeat with rejection and a decision note.

## Sprint 8: Admin Setup And Service Provider Contacts

Goal:

Add lightweight setup screens and provider assignment.

Implementation steps:

- Build admin setup page.
- Add CRUD endpoints or minimal create/list endpoints for:
  - Properties
  - Units
  - Users
  - Service providers
- Build service provider list.
- Add `POST /api/tickets/:ticketId/provider-assignment`.
- Let managers assign or note a provider contact on a ticket.
- Show assigned provider on ticket detail.

Expected result:

- Demo data can be managed from the UI instead of only seed scripts.
- Manager can assign a service-provider contact to a ticket.

Suggested verification:

- Admin creates a service provider.
- Manager assigns provider to a ticket.
- Ticket detail shows assigned provider.

## Sprint 9: Attachments And Photos

Goal:

Add practical attachment support for maintenance photos.

Implementation steps:

- Decide upload mode:
  - Mock/local metadata only for prototype, or
  - Cloudinary for real hosted uploads.
- Add backend attachment upload route.
- Add `POST /api/tickets/:ticketId/attachments`.
- Add `GET /api/tickets/:ticketId/attachments`.
- Add frontend photo upload component.
- Show uploaded attachments on:
  - Tenant ticket detail
  - Manager ticket detail
  - Owner approval detail
- Validate file type and size.

Expected result:

- Users can attach photos to tickets.
- Relevant users can view the attachments.

Suggested verification:

- Tenant uploads photo during or after ticket creation.
- Manager sees uploaded photo.
- Owner sees photo during approval.

## Sprint 10: Deployment Preparation

Goal:

Prepare the app for shared testing through public links.

Implementation steps:

- Add production build scripts.
- Add deployment documentation.
- Configure frontend environment variable:
  - `VITE_API_BASE_URL`
- Configure backend environment variables:
  - `DATABASE_URL`
  - `OPENAI_API_KEY`
  - `JWT_SECRET`
  - `CORS_ORIGIN`
  - Optional Cloudinary variables
- Add CORS configuration for deployed frontend URL.
- Add basic error handling and logging.
- Add deployment health check endpoint.
- Test production build locally.
- Prepare Vercel deployment for frontend.
- Prepare Render or Railway deployment for backend.
- Connect backend to Neon database.

Expected result:

- Frontend can be deployed to a public URL.
- Backend can be deployed to a public URL.
- Both use the shared Neon database.
- Teammates can test from their own devices.

Suggested verification:

- Open deployed frontend URL.
- Log in as demo users.
- Complete the main flow:
  - Tenant submits request.
  - AI structures request.
  - Manager reviews request.
  - Manager requests approval.
  - Owner approves or rejects.
  - Manager updates status.

## Sprint 11: Prototype Polish

Goal:

Make the prototype coherent and test-ready.

Implementation steps:

- Improve empty states.
- Improve loading and error states.
- Add translated validation messages.
- Add status and priority badges.
- Add responsive layout refinements.
- Add confirmation dialogs for approval/rejection.
- Add basic audit-like event messages for important actions:
  - Ticket submitted
  - Status changed
  - Approval requested
  - Approval approved/rejected
  - Provider assigned
- Review English and German copy.
- Remove unused placeholder UI.

Expected result:

- The app feels complete enough for tester feedback.
- Core flows are understandable in English and German.

Suggested verification:

- Test main flow in English.
- Switch to German and test the same flow.
- Check mobile layout.
- Check manager and owner views for missing labels or unclear states.

## Manual Setup Required

Before or during implementation, you will need to do the following manually.

### Accounts And Services

- Create a Neon account if using hosted Postgres.
- Create a Neon Postgres database.
- Copy the Neon database connection string.
- Create an OpenAI API key for AI ticket extraction and summaries.
- Optional: create a Cloudinary account if real photo uploads are needed.
- Optional: create Vercel account/project for frontend deployment.
- Optional: create Render or Railway account/project for backend deployment.

### Environment Variables

Create backend environment file:

```text
apps/api/.env
```

Required backend values:

```text
DATABASE_URL=your_neon_or_local_postgres_connection_string
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=replace_with_a_long_random_secret
CORS_ORIGIN=http://localhost:5173
```

Optional backend values if Cloudinary is used:

```text
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Create frontend environment file:

```text
apps/web/.env
```

Required frontend values:

```text
VITE_API_BASE_URL=http://localhost:3000
```

For deployment, update:

```text
CORS_ORIGIN=https://your-frontend-domain
VITE_API_BASE_URL=https://your-backend-domain
```

### Deployment Configuration

- Add backend environment variables in Render or Railway.
- Add frontend environment variables in Vercel.
- Run database migrations against the Neon database.
- Run seed script against the Neon database if demo users are needed online.
- Update CORS origin after the frontend deployment URL is known.

### Product Decisions Needed Later

- Decide whether Sprint 3 should use real email/password login or simple demo-user login.
- Decide whether Sprint 9 should use Cloudinary or stay with mocked/local attachment metadata.
- Decide exact approval trigger rules, for example manual manager toggle only or category/priority-based suggestion.
- Decide which demo users and demo property/unit data should be seeded.

