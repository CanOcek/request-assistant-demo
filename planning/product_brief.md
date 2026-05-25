# Product Brief

## Summary

The app should be a focused AI-powered maintenance request assistant for German Hausverwaltungen. It should help tenants or owners submit repair issues, use AI to turn incomplete or unstructured input into structured tickets, let Hausverwaltungen review and manage those tickets, support owner approval when needed, and provide transparent status tracking without replacing existing property-management software.

## What The App Should Do

### Core Goal

Reduce fragmented repair communication and missing information by creating a single structured workflow for maintenance requests.

### MVP Capabilities

- Let tenants, landlords, or owners submit maintenance requests.
- Support both structured form input and AI-assisted free-text input.
- Ask follow-up questions when required information is missing.
- Collect:
  - Issue description.
  - Property/unit.
  - Room or location.
  - Photos or attachments.
  - Urgency.
  - Contact details.
  - Access details.
- Use AI to:
  - Extract structured fields from free text.
  - Suggest a request category.
  - Suggest a priority level.
  - Detect missing information.
  - Summarize the request for the Hausverwaltung.
- Store each request as a maintenance ticket.
- Let Hausverwaltung users review, edit, prioritize, and update tickets.
- Let owners review selected tickets and approve or reject them when approval is required.
- Show ticket status to relevant users.
- Keep the product modular and integration-friendly, without requiring replacement of existing systems.

### Out Of Scope For Now

- Full ERP replacement.
- Legal document generation.
- Owner meeting automation.
- Compliance dashboards.
- Rent reminders.
- Full service-provider portal.
- Marketplace for Hausverwaltungen or providers.
- Voice assistant features.
- Automated legally binding decisions.

## Core Entities

### User

Represents a person using the system.

Fields:

- `id`
- `name`
- `email`
- `phone`
- `role`
- `createdAt`
- `updatedAt`

Roles:

- `tenant`
- `owner`
- `property_manager`
- `admin`

### Property

Represents a managed building or property.

Fields:

- `id`
- `name`
- `address`
- `managementCompanyId`
- `createdAt`
- `updatedAt`

### Unit

Represents an apartment or commercial unit inside a property.

Fields:

- `id`
- `propertyId`
- `label`
- `floor`
- `tenantUserId`
- `ownerUserId`
- `createdAt`
- `updatedAt`

### Maintenance Ticket

Represents a repair or maintenance request.

Fields:

- `id`
- `title`
- `description`
- `category`
- `priority`
- `status`
- `propertyId`
- `unitId`
- `roomOrLocation`
- `submittedByUserId`
- `assignedManagerUserId`
- `approvalRequired`
- `approvalStatus`
- `aiSummary`
- `aiConfidence`
- `createdAt`
- `updatedAt`

Categories:

- `heating`
- `water_damage`
- `internet_tv`
- `electricity`
- `cleaning`
- `access`
- `noise`
- `general_repair`
- `other`

Priorities:

- `low`
- `medium`
- `high`
- `urgent`

Statuses:

- `draft`
- `submitted`
- `needs_more_information`
- `under_review`
- `waiting_for_owner_approval`
- `approved`
- `rejected`
- `assigned`
- `in_progress`
- `resolved`
- `closed`
- `cancelled`

### Attachment

Represents uploaded photos or documents.

Fields:

- `id`
- `ticketId`
- `fileName`
- `fileType`
- `fileUrl`
- `uploadedByUserId`
- `createdAt`

### Ticket Message

Represents communication or updates inside a ticket.

Fields:

- `id`
- `ticketId`
- `authorUserId`
- `message`
- `visibility`
- `createdAt`

Visibility values:

- `internal`
- `tenant_visible`
- `owner_visible`
- `all`

### Approval

Represents an owner approval decision for a ticket.

Fields:

- `id`
- `ticketId`
- `requestedByUserId`
- `ownerUserId`
- `status`
- `decisionNote`
- `createdAt`
- `decidedAt`

Approval statuses:

- `pending`
- `approved`
- `rejected`

### Service Provider

For MVP, this can be a simple contact record used by the Hausverwaltung. A full provider portal is out of scope.

Fields:

- `id`
- `name`
- `trade`
- `email`
- `phone`
- `notes`
- `createdAt`
- `updatedAt`

## User Stories

### Tenant

- As a tenant, I want to submit a maintenance request with text and photos so that the Hausverwaltung has enough information to act.
- As a tenant, I want the app to ask me follow-up questions when my request is incomplete so that I do not need repeated emails or calls.
- As a tenant, I want to see the status of my request so that I know whether it was received and what happens next.
- As a tenant, I want to understand who is responsible for the next step so that I do not contact the wrong person.

### Owner

- As an owner, I want to see maintenance requests that need my approval so that I can make a decision quickly.
- As an owner, I want to see the issue summary, urgency, photos, and relevant notes before approving so that the decision is informed.
- As an owner, I want to approve or reject a request with an optional note so that the Hausverwaltung can continue the workflow.

### Hausverwaltung

- As a property manager, I want to see all submitted maintenance tickets in one dashboard so that I can prioritize work.
- As a property manager, I want AI to summarize and categorize requests so that I spend less time interpreting incomplete messages.
- As a property manager, I want to edit AI-suggested fields so that the final ticket is accurate.
- As a property manager, I want to mark a ticket as requiring owner approval so that larger-cost actions are not started without permission.
- As a property manager, I want to update ticket status so that tenants and owners have visibility.
- As a property manager, I want to assign or note a service provider contact so that the next operational step is clear.

### Admin

- As an admin, I want to manage properties, units, users, and service-provider contacts so that the request workflow has accurate reference data.

## Backend Endpoints

Endpoint names are proposed REST-style routes for the MVP.

### Auth And Users

- `POST /api/auth/login`
  - Log in a user.
- `POST /api/auth/logout`
  - Log out the current user.
- `GET /api/me`
  - Return current user profile and role.
- `GET /api/users`
  - List users for admin or manager views.

### Properties And Units

- `GET /api/properties`
  - List properties visible to the current user.
- `POST /api/properties`
  - Create a property.
- `GET /api/properties/:propertyId`
  - Get property details.
- `GET /api/properties/:propertyId/units`
  - List units for a property.
- `POST /api/properties/:propertyId/units`
  - Create a unit.

### Maintenance Tickets

- `GET /api/tickets`
  - List tickets filtered by role, property, status, priority, or category.
- `POST /api/tickets`
  - Create a ticket from structured form input.
- `GET /api/tickets/:ticketId`
  - Get ticket details.
- `PATCH /api/tickets/:ticketId`
  - Update ticket fields, status, priority, category, or assignment.
- `POST /api/tickets/:ticketId/messages`
  - Add a message or status note to a ticket.
- `GET /api/tickets/:ticketId/messages`
  - List ticket messages.
- `POST /api/tickets/:ticketId/attachments`
  - Upload ticket attachments.
- `GET /api/tickets/:ticketId/attachments`
  - List ticket attachments.

### AI Assistance

- `POST /api/ai/tickets/extract`
  - Convert free-text input into suggested structured ticket fields.
- `POST /api/ai/tickets/check-completeness`
  - Check whether a ticket has enough information and return missing fields or follow-up questions.
- `POST /api/ai/tickets/:ticketId/summarize`
  - Generate or refresh an internal ticket summary.

### Approvals

- `POST /api/tickets/:ticketId/approval-request`
  - Request owner approval for a ticket.
- `GET /api/approvals`
  - List approval requests for the current owner or manager.
- `GET /api/approvals/:approvalId`
  - Get approval request details.
- `POST /api/approvals/:approvalId/approve`
  - Approve the request.
- `POST /api/approvals/:approvalId/reject`
  - Reject the request with an optional note.

### Service Providers

- `GET /api/service-providers`
  - List service-provider contacts.
- `POST /api/service-providers`
  - Create a service-provider contact.
- `PATCH /api/service-providers/:providerId`
  - Update a service-provider contact.
- `POST /api/tickets/:ticketId/provider-assignment`
  - Attach a provider contact to a ticket.

## Frontend Pages

### Login

Purpose:

- Let users access the correct role-based experience.

### Tenant Request Intake

Purpose:

- Let tenants submit a request using structured fields and AI-assisted free text.

Core UI:

- Free-text issue description.
- Structured fields for property/unit, room, urgency, contact/access details.
- Photo upload.
- AI follow-up questions.
- Submit button.

### Tenant Ticket List

Purpose:

- Show a tenant their submitted requests and current statuses.

Core UI:

- Ticket cards or table.
- Status.
- Last update.
- Priority if visible.

### Tenant Ticket Detail

Purpose:

- Show request details, updates, and responsibility.

Core UI:

- Ticket summary.
- Status timeline.
- Messages visible to tenant.
- Attachments.

### Hausverwaltung Dashboard

Purpose:

- Central operational view for property managers.

Core UI:

- Ticket list.
- Filters by status, priority, category, property.
- Highlight urgent and incomplete requests.
- Quick status updates.

### Hausverwaltung Ticket Detail

Purpose:

- Let managers review and manage a ticket.

Core UI:

- Original submission.
- AI summary.
- Editable structured fields.
- Attachments.
- Internal notes.
- Status controls.
- Approval-required toggle.
- Provider assignment/contact field.

### Owner Approval List

Purpose:

- Show owners requests waiting for their decision.

Core UI:

- Pending approvals.
- Ticket summary.
- Property/unit.
- Urgency.
- Decision status.

### Owner Approval Detail

Purpose:

- Let owners approve or reject a request.

Core UI:

- Issue summary.
- Photos.
- Manager notes.
- Approval/rejection controls.
- Optional decision note.

### Admin Management

Purpose:

- Manage setup data required for the prototype.

Core UI:

- Properties.
- Units.
- Users.
- Service-provider contacts.

## Open Questions

- Should the first prototype require login, or use simple role-switching for testing?
- Should tenants always submit directly, or should some requests be submitted by owners on behalf of tenants?
- Which ticket fields are mandatory before submission?
- Which priority rules should trigger `urgent`?
- What cost or category threshold should require owner approval?
- Should approval be required manually by a manager in MVP, or automatically suggested by AI?
- Which statuses should tenants see, and which should remain internal?
- Should service-provider assignment send an email in MVP, or only store the selected contact?
- How should AI uncertainty be shown to property managers?
- What languages need to be supported in the prototype beyond German and English?
- Should photos be required for categories like water damage?
- What minimum audit log is needed for AI-generated suggestions and owner decisions?

## Short Sprint Plan

### Sprint 1: Core Ticket Intake And Storage

- Create project data model for users, properties, units, tickets, attachments, and messages.
- Build tenant request intake page.
- Build ticket creation endpoint.
- Store structured tickets in the database.
- Add basic tenant ticket list and detail views.

### Sprint 2: AI Structuring And Manager Review

- Add AI extraction endpoint for free-text request input.
- Add completeness-check endpoint with follow-up questions.
- Build Hausverwaltung dashboard.
- Build Hausverwaltung ticket detail page.
- Allow managers to edit category, priority, status, and ticket details.

### Sprint 3: Owner Approval And Status Tracking

- Add approval entity and endpoints.
- Build owner approval list and detail pages.
- Let managers request approval.
- Let owners approve or reject with an optional note.
- Reflect approval status in ticket detail and dashboards.

### Sprint 4: Prototype Polish And Testing

- Add attachment upload flow.
- Add service-provider contact assignment.
- Improve status timeline and visible updates.
- Add role-based navigation.
- Test one complete flow: tenant submits request, AI structures it, manager reviews it, owner approves it, manager updates status.

