# User Guide

This guide explains the core demo flows and gives a practical walkthrough for showing the app to teammates. Keep the demo focused on the MVP: a tenant submits a maintenance request, a property manager reviews and manages it, and an owner approves or rejects cost-sensitive work.

## Demo Overview

The app is a multilingual property maintenance request assistant for tenants, property managers, and owners.

The demo should show:

1. A tenant logs in and creates a maintenance ticket.
2. The app uses AI assistance to extract structured details from a free-text request.
3. The property manager reviews incoming tickets, updates ticket details, and communicates with the tenant.
4. The property manager requests owner approval when needed.
5. The owner reviews the approval request and approves or rejects it.
6. The app can be switched between English and German.

## Demo Roles

Use the demo login buttons on the login screen.

### Tenant

The tenant submits and tracks maintenance requests.

Use this role to show:

- Creating a new request.
- Using the AI-assisted intake form.
- Reviewing submitted tickets.
- Opening a ticket detail page.
- Reading tenant-visible updates.

### Property Manager

The property manager manages incoming tickets and coordinates next steps.

Use this role to show:

- Viewing all tickets.
- Filtering by status, priority, category, or property.
- Opening ticket details.
- Updating ticket status, priority, category, and other fields.
- Posting tenant-visible or internal messages.
- Creating an owner approval request.

### Owner

The owner reviews approval requests created by the property manager.

Use this role to show:

- Viewing pending approval requests.
- Opening approval request details.
- Approving or rejecting a request.
- Adding a short decision note.

## Recommended Demo Order

### 1. Start With The Language Switch

Open the app and point out the English/German toggle.

Show that the interface can be switched without changing the underlying workflow. This is important because the intended users may include German-speaking tenants, owners, and property managers.

Suggested explanation:

> The same operational flow works in English and German. For the MVP, the app includes a simple language switch so the demo can support both audiences.

### 2. Log In As A Tenant

Use the tenant demo login.

Show the tenant-facing ticket list first, then create a new request.

Suggested explanation:

> Tenants do not need a full account setup in the demo. For now, we use demo users so we can focus on the workflow instead of authentication complexity.

### 3. Create A Maintenance Request

Go to the new request flow.

Enter a realistic maintenance request, for example:

```text
Die Heizung im Wohnzimmer funktioniert seit gestern nicht mehr. Es ist sehr kalt in der Wohnung. Bitte so schnell wie möglich prüfen.
```

Use the AI extraction action.

Show how the app turns free text into structured fields such as:

- Title
- Description
- Category
- Priority
- Location

Then submit the ticket.

Suggested explanation:

> The AI is not replacing the tenant form. It helps pre-fill the form so tenants can describe the issue naturally while the property manager still receives structured information.

### 4. Review The Ticket As A Tenant

After submission, open the ticket from the tenant view.

Show:

- Ticket status
- Ticket details
- Message history
- Timeline-style updates

Suggested explanation:

> The tenant gets a simple status view instead of needing to call or email repeatedly for updates.

### 5. Log In As A Property Manager

Return to the login screen or switch sessions if needed, then use the property manager demo login.

Open the dashboard.

Show:

- Ticket list
- Status and priority information
- Filters
- Ticket detail page

Suggested explanation:

> This is the operational view. The manager can triage incoming requests, update details, and keep tenant communication attached to the ticket.

### 6. Update The Ticket

Open the ticket created during the tenant flow.

Update a few fields, such as:

- Status: move it to under review or in progress.
- Priority: adjust if the situation is urgent.
- Location: clarify the affected room or area.

Add a tenant-visible update, for example:

```text
Danke für die Meldung. Wir prüfen den Fall und melden uns mit den nächsten Schritten.
```

Optionally add an internal note to show the difference between tenant-visible and internal communication.

Suggested explanation:

> The property manager can separate tenant communication from internal coordination, while keeping both attached to the same request.

### 7. Request Owner Approval

If the ticket needs owner approval, create an approval request from the ticket detail page.

Use a realistic reason and estimated cost, for example:

- Reason: Heating repair requires owner approval before contractor work is assigned.
- Estimated cost: 350

Suggested explanation:

> Some maintenance work needs owner approval before spending money. The MVP keeps that decision linked to the original ticket.

### 8. Log In As An Owner

Use the owner demo login.

Open the approvals view.

Show:

- Pending approval requests.
- Approval details.
- Related ticket information.
- Estimated cost and reason.

Approve or reject the request with a short note.

Suggested approval note:

```text
Approved. Please proceed with the repair.
```

Suggested rejection note:

```text
Please get a second estimate before proceeding.
```

Suggested explanation:

> The owner has a focused view. They only need to see approval decisions, not the full property manager dashboard.

## Core User Flows

### Flow 1: Tenant Creates A Request

1. Tenant logs in.
2. Tenant opens the new request form.
3. Tenant writes the issue in natural language.
4. AI extracts structured request details.
5. Tenant reviews and submits the form.
6. Ticket appears in the tenant ticket list.

Success outcome:

- A new ticket exists in the system.
- The ticket has structured fields.
- The tenant can track the ticket.

### Flow 2: Property Manager Triages A Request

1. Property manager logs in.
2. Property manager opens the dashboard.
3. Property manager filters or selects a ticket.
4. Property manager reviews the submitted details.
5. Property manager updates status, priority, category, or location.
6. Property manager adds a tenant-visible message or internal note.

Success outcome:

- The ticket is updated.
- Tenant-facing communication is visible to the tenant.
- Internal notes remain manager-facing.

### Flow 3: Property Manager Requests Approval

1. Property manager opens a ticket detail page.
2. Property manager creates an approval request.
3. Property manager enters reason and estimated cost.
4. Approval request is created and linked to the ticket.

Success outcome:

- Owner can see the request in the approval view.
- The approval decision remains connected to the original ticket.

### Flow 4: Owner Makes A Decision

1. Owner logs in.
2. Owner opens the approvals view.
3. Owner selects a pending approval.
4. Owner reviews ticket context, reason, and estimated cost.
5. Owner approves or rejects with an optional note.

Success outcome:

- Approval request status changes.
- The decision is saved.
- The property manager can continue the workflow based on the decision.

## What To Emphasize During The Demo

Emphasize that the MVP is intentionally narrow.

The current demo is meant to prove:

- The three main roles can use one shared workflow.
- Maintenance requests can move from tenant intake to manager handling.
- Owner approval can be requested and decided.
- AI can reduce manual form entry without taking control away from the user.
- English and German are supported in the interface.
- The app is backed by a real database instead of only browser-local mock data.

Avoid presenting this as a finished production system. It is a working MVP for validating the flow and collecting feedback.

## What Not To Demo Yet

Do not focus on features outside the current MVP, such as:

- Real user registration.
- Password reset.
- File uploads.
- Contractor assignment.
- Email notifications.
- Payment workflows.
- Full audit logs.
- Advanced analytics.
- Production permission management.

These can be discussed as future work, but they are not part of the current demo scope.

## Suggested Demo Script

Use this short structure when presenting:

1. "This is a maintenance request assistant for tenants, property managers, and owners."
2. "The tenant can describe a problem naturally, and the app helps turn it into a structured ticket."
3. "The property manager gets a dashboard to triage and update the request."
4. "If approval is needed, the manager can send a focused approval request to the owner."
5. "The owner can approve or reject the request without using the full manager dashboard."
6. "The same app can be used in English or German."
7. "For today's demo, authentication and data are simplified with demo users and dummy data."

## Feedback To Ask For

Ask teammates for feedback on:

- Whether the tenant request flow is clear.
- Whether the AI-filled fields are useful or need different labels.
- Whether the manager dashboard shows the right information first.
- Whether the approval flow is simple enough for owners.
- Whether English and German labels feel understandable.
- What information is missing before this could be tested with real users.

## Manual Demo Checklist

Before showing the app:

1. Confirm the API is running.
2. Confirm the web app is running.
3. Confirm the database is reachable.
4. Confirm demo login works for tenant, property manager, and owner.
5. Confirm at least one tenant ticket exists.
6. Confirm at least one owner approval exists or can be created during the demo.
7. Confirm the English/German switch works.
8. If using AI extraction, confirm the OpenAI API key is configured.

If OpenAI is not configured, the demo can still continue with the fallback extraction behavior, but mention that live AI extraction is not active in that environment.
