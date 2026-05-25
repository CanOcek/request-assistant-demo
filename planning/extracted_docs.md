# Extracted Document Findings

This file consolidates the relevant findings from the local PDF, DOCX, and Markdown files for future implementation planning.

## Source Files Reviewed

- `README.md`
- `raw_input_documents/summary.md`
- `raw_input_documents/notes.md`
- `raw_input_documents/mock_claude_answer.md`
- `raw_input_documents/Module_1_Submission (5).docx`
- `raw_input_documents/Module_2_Submission_Mexico-City (6).pdf`
- `raw_input_documents/Module 3 Submission Mexico City.docx`

## High-Level Project Direction

The project is an AI-powered maintenance request assistant for German Hausverwaltungen.

The assistant should help property managers collect, structure, prioritize, and track repair and maintenance cases across tenants, owners, Hausverwaltungen, and service providers. The intended product should reduce fragmented communication, repeated follow-ups, missing information, and unclear responsibilities without forcing Hausverwaltungen to replace their existing property-management software.

The most recent and explicit chosen idea from `summary.md` and `Module 3 Submission Mexico City.docx` is:

> We want to build an AI-powered maintenance request assistant that helps Hausverwaltungen collect, structure, prioritize, and track repair cases across tenants, owners, and service providers.

## Core MVP Concept

The core feature is an AI-based repair ticket assistant that turns unstructured messages from tenants, landlords, or owners into complete and structured maintenance tickets.

The assistant should:

- Accept unstructured maintenance messages.
- Ask follow-up questions when information is missing.
- Collect relevant information such as photos, location, urgency, contact details, and issue description.
- Help users format requests clearly.
- Verify or improve submitted request information using AI.
- Create a clear structured ticket for the Hausverwaltung.
- Also allow users to fill out a structured web form manually.
- Store requests in a database.
- Let owners view a request and accept or reject it where approval is required.

## Important Product Requirements

Relevant product requirements gathered across the documents:

- Tenant request creation.
- AI-assisted request formatting.
- AI verification of completeness and clarity.
- Structured request form as an alternative to chat-style intake.
- Status tracking for tenants, owners, and Hausverwaltungen.
- Automatic request categorization, for example heating, water damage, internet, cleaning, utility issue, building issue.
- Suggested priority level based on urgency.
- Service provider recommendation from an existing contact pool.
- Automatic summaries of communication.
- Multilingual support for international tenants.
- Optional owner or Beirat approval workflow for larger costs.
- Integration-friendly design that sits on top of existing core systems.
- Avoid requiring migration away from existing ERP/property-management software.
- Potential support for phone, email, WhatsApp, SMS, and paper-originated requests, because these channels currently fragment work.

## Opportunity Space From Module 1

The German property management industry is described as fragmented and under-digitized.

Important opportunity-space details:

- There are over 28,000 Hausverwaltungen/property management firms in Germany.
- These firms manage residential and commercial properties.
- Many still rely on legacy software, phone calls, emails, WhatsApp, paper folders, and manual workflows.
- Tenants and landlords increasingly expect digital and transparent communication.
- Property managers are overwhelmed by administrative burden.
- There is an opportunity for an AI-powered platform that streamlines the management lifecycle, including:
  - Tenant communication.
  - Rental contract compliance.
  - Maintenance coordination.
  - Owner reporting.

### Top Arguments Why The Opportunity Matters

1. Massive underserved market with low digital penetration.
   - The sector oversees roughly 10 million rental units through 28,000+ Verwaltungen.
   - Existing tooling is often outdated or manual.
   - Rising homeownership costs are increasing long-term renting.
   - There is no dominant AI-native player identified in the submitted documents.

2. Regulatory complexity is increasing demand.
   - Relevant regulatory and compliance areas include WEG-Reform, DSGVO, Betriebskostenabrechnung, and tenancy law.
   - Manual compliance tracking creates risk and cost.
   - An AI co-pilot could flag deadlines, generate documents, and automate meeting minutes for Eigentuemerversammlungen.

3. Tenant expectations have shifted.
   - Renting is increasingly normal for younger generations.
   - Tenants expect digital-first experiences, instant maintenance requests, transparent communication, and digital documentation.
   - Hausverwaltungen that cannot deliver modern workflows risk reputational damage and tenant dissatisfaction.

## Stakeholders And Jobs To Be Done From Module 2

### 1. Hausverwaltungen / Property Management Firms

Description:

Hausverwaltungen are the primary customers. They manage residential and commercial properties on behalf of owners. They are responsible for maintenance coordination, financial administration, legal documentation, reporting, owner communication, and sometimes tenant communication depending on the management type.

Research findings:

- Work is highly operational and reactive.
- Many tasks are triggered by unexpected issues such as broken heating, internet problems, water damage, invoices, or urgent coordination with service providers.
- One interviewee estimated that about 60% of the work is operational rather than fully plannable.
- Processes are fragmented across phone calls, email, WhatsApp, paper folders, and legacy software.

JTBD:

When managing multiple properties, repair cases, owners, service providers, invoices, and legal deadlines at the same time, Hausverwaltungen need to reduce manual coordination, structure incoming requests, and automate repetitive administrative tasks without replacing existing core software, so they can save time, avoid errors, stay legally compliant, and provide reliable service to owners, tenants, and external partners.

Implementation implications:

- The system should reduce manual coordination.
- The system should structure incoming requests from multiple channels.
- The system should preserve compatibility with existing software.
- The system should support operational workflows, not only planned administration.

### 2. Tenants / Renters

Description:

Tenants are affected by property-management quality, especially in rental management. They contact the Hausverwaltung or landlord for heating issues, internet or TV outages, water damage, utility questions, and building-related concerns.

Important distinction:

- In WEG management, tenants are often not the direct contact of the Hausverwaltung.
- Tenants may need to contact their landlord first, who then communicates with the Hausverwaltung.
- Tenants may still be end users or indirect users depending on the management model.

JTBD:

When tenants have a problem in their apartment or need information about a building-related issue, they need to report the issue easily, provide relevant information such as photos or location, and understand who is responsible for the next step, so their problem is handled quickly and they do not need to repeatedly call or write messages without visibility.

Implementation implications:

- Tenant-facing request intake must be simple.
- The product should support photo upload and location/room details.
- The product should show responsibility and status.
- The product should reduce repeated follow-up emails.
- The product should account for direct and indirect tenant workflows.

### 3. Property Owners / Landlords / WEG Boards

Description:

Owners, landlords, and WEG boards own the properties, approve decisions, pay for management services, and expect legally correct administration. In WEG management they are usually the primary contact for the Hausverwaltung rather than tenants.

They depend on:

- Transparent reporting.
- Accurate annual statements.
- Correct allocation of costs.
- Repair documentation.
- Reliable communication about larger expenses.
- Approval workflows above certain cost thresholds.

Research notes:

- Beirat or ownership group approval may be required above certain thresholds.
- Eigentuemerversammlungen can become time-consuming and difficult when discussions become emotional or unstructured.

JTBD:

When owning or co-owning a property managed by a Hausverwaltung, owners need transparent information about costs, repairs, invoices, decisions, and legal obligations, so they can make informed decisions, protect property value, and trust that management acts correctly and efficiently.

Implementation implications:

- Owners need a clear request-review view.
- Requests requiring approval should expose cost estimates, urgency, supporting evidence, and recommended action.
- The owner approval workflow should support accept/reject decisions.
- Larger future scope could include owner reporting and meeting support.

### 4. Maintenance Providers / Handwerker / Facility Service Providers

Description:

Maintenance providers perform repairs, inspections, cleaning, heating service, technical maintenance, and renovations. They are essential for resolving operational issues.

Research findings:

- Reliable service providers are highly valuable even when slightly more expensive.
- Fast response times matter in urgent cases.
- Repair coordination often involves:
  - Receiving the issue.
  - Contacting the right provider.
  - Checking the problem.
  - Collecting photos or cost estimates.
  - Getting approval if needed.
  - Checking the invoice against the offer later.

JTBD:

When receiving a repair, maintenance, or inspection request from a Hausverwaltung, providers need complete information, clear descriptions, photos, access details, urgency level, and approval status, so they can assess the issue quickly, avoid unnecessary back-and-forth, and complete the job efficiently.

Implementation implications:

- Tickets should contain enough provider-ready fields to reduce clarification loops.
- Provider assignment/recommendation should use categories and existing contact pools.
- Tickets should include access details and approval status.
- Later invoice/offer matching may be useful post-MVP.

### 5. Public Authorities / Utility Providers / Municipal Services

Description:

Authorities, municipal services, utility providers, tax-related institutions, and administrative bodies are external stakeholders that Hausverwaltungen depend on.

Research findings:

- Communication with authorities and utility providers can be a major pain point.
- Outdated contact records or unclear responsibilities can lead to wrong invoices, reminders, and unnecessary administrative work.
- Public institutions were described as slower and harder to move forward than service providers.

JTBD:

When property, ownership structure, billing address, management responsibility, or administrative status changes, these stakeholders need complete, correct, and clearly structured information from the Hausverwaltung, so records, invoices, taxes, and responsibilities can be updated accurately.

Implementation implications:

- Not likely MVP for maintenance assistant.
- Relevant for future contact data, ownership data, and administrative workflow modules.
- Structured records and audit trails may reduce wrong invoices or reminders.

## Empathy Research Findings And Quotes

### Interview 1: Property Management Context

Interview context:

- Conducted in person using a semi-structured interview guideline.
- Focused on daily workflows, communication channels, repair coordination, software usage, and major pain points.

Relevant insights:

- Operational business is a large share of the work.
- Communication losses happen heavily through phone calls.
- Small property managers may find digital modules too expensive relative to their property count.
- Authorities are a surprising but important pain point.
- Owner meetings are exhausting and include social/organizational complexity.

Implementation implications:

- The product must reduce interruptions.
- Async structured intake is valuable.
- Pricing and modular adoption matter.
- Future modules could include authority communication and owner-meeting support.

### Interview 2: International Student / Tenant In Munich

Interview context:

- Conducted online with an international student renting a private apartment in Munich.
- Covered landlord/property-management communication, maintenance request experiences, language barriers, and tracking apartment issues.

Important quotes and findings:

- The tenant heard nothing for almost a week after reporting an issue.
- The tenant kept checking the inbox and sent follow-up emails.
- There was no central place to see requests or maintenance progress.
- The tenant did not know whether to contact the landlord, apartment management, or an external technician.
- The tenant did not necessarily expect immediate repair, but wanted visibility into what was happening.

Implementation implications:

- Status tracking is a core value driver.
- Acknowledgement/confirmation after submission matters.
- The product should show who is responsible for the next step.
- The product should reduce uncertainty even before the issue is fixed.
- International tenants benefit from multilingual UX and clear process guidance.

### Interview 3: Shared Apartment / Renovation Case

Interview context:

- Conducted in person with a university student in a shared apartment in Munich.
- Focused on larger maintenance and renovation periods, tenant-landlord coordination, lack of communication, and lack of alternative options.

Important findings:

- Tenants were left without a place to stay for three weeks with barely any notice.
- Tenants were out of the loop for the renovation decision process.
- The landlord spent heavily on renovation while ignoring a repeatedly reported leaking kitchen sink.
- One flatmate started looking for a new place because of poor communication and inconvenience.

Implementation implications:

- Maintenance workflows are not only about repair execution, but also communication, notice periods, impact, and decision transparency.
- Tenant-visible timelines and updates are important.
- Smaller recurring issues should not disappear below larger owner-driven projects.
- Poor communication can affect tenant retention and trust.

## POV Statements From Module 2

1. Hausverwaltungen need a way to structure incoming requests, repair cases, invoices, and communication across different channels because their daily work is fragmented, reactive, and interrupted by phone calls, emails, WhatsApp messages, and paper-based processes.

2. Tenants need a clear and transparent way to report and track apartment or building-related issues because they often do not know who is responsible, what information is needed, whether their request has been received, the current repair status, or what decisions are being made without their knowledge.

3. Property owners and WEG boards need a way to receive transparent, legally reliable, and decision-ready information because they must approve costs, understand repairs, check annual statements, and protect the long-term value of their property.

4. Maintenance providers need a way to receive complete, structured, and pre-qualified repair information because missing details, unclear responsibilities, or delayed approvals create unnecessary back-and-forth communication and slow down repairs.

5. Small and medium-sized Hausverwaltungen need a way to access affordable automation on a per-unit or modular basis because high fixed software costs often do not pay off when only a limited number of properties or units are managed.

6. Hausverwaltungen need a way to add digital or AI-based support without replacing their existing core software because switching systems requires long onboarding, reduces short-term productivity, and may not be economically viable for smaller property managers.

7. Hausverwaltungen need a way to prepare, structure, and document owner meetings more efficiently because Eigentuemerversammlungen can become long, emotional, and difficult to manage when multiple owners discuss complex property issues.

## Module 3 How Might We Questions

From `Module 3 Submission Mexico City.docx`:

1. How might we help Hausverwaltungen handle repair and maintenance requests faster without replacing their existing property management software?
2. How might we make communication between tenants, landlords, property managers, and service providers more transparent and less fragmented?
3. How might we support small and medium-sized Hausverwaltungen with affordable AI-based automation so they can stay competitive against larger, more digital players?

From `mock_claude_answer.md`, there is an earlier or alternate framing:

1. How might we help mid-sized Hausverwaltungen handle routine tenant communication automatically so that property managers can spend their working time on owner relationships and decisions that legally require a human?
2. How might we help small property-management teams stay continuously compliant with WEG, DSGVO, and Betriebskosten deadlines so legal risk shrinks without hiring a dedicated compliance officer?
3. How might we help Hausverwaltungen coordinate maintenance and craftsmen with minimal back-and-forth so tenants get faster fixes and managers stop drowning in phone calls and email chains?

Implementation interpretation:

- The current chosen direction is maintenance request handling.
- However, the broader communication co-pilot, compliance support, and owner-meeting support remain relevant future modules.

## Idea Backlog From Mock Claude Answer

The `mock_claude_answer.md` file appears to be a rough copy/paste and says it is not the main source of information. Still, it contains useful backlog ideas.

### Communication Ideas

- Auto-draft tenant reply emails.
- Inbox triage by urgency and topic.
- Multilingual replies in DE, EN, TR, RU, AR.
- Auto-reminders for overdue rent.
- Auto-reminders for expiring contracts.
- WhatsApp/SMS channel parity.

### Owner Assembly / WEG Ideas

- Auto-generated agenda from open Beschluesse.
- WEG-compliant invitations with Ladungsfristen.
- Real-time meeting transcription.
- Auto-drafted legally compliant Protokoll.
- Beschluss follow-up and status tracker.

### Compliance Ideas

- Betriebskostenabrechnung deadline tracker.
- WEG-Reform 2024 dashboard.
- Auto-filled DSGVO-checked contracts.
- Prueffristen calendar, for example heating and smoke detector checks.

### Craftsmen / Maintenance Ideas

- Maintenance request triage by urgency.
- Match craftsman from preferred vendor list.
- Tenant photo intake of damage.
- Job status and cost tracker.
- Cost-per-property summary for owners.
- Auto-draft repair orders.

### Bolder Or Adjacent Ideas

- Style mirror trained on a firm's past emails.
- Voice copilot, for example "Hey Valta, what is overdue?"
- Risk-clause flagger for tenancy contracts.
- Immutable audit trail of every AI action.
- Vote tally and quorum calculator.
- Voice-to-email dictation.
- Owner mobile app with live property status.
- Embed Valta inside Domus/Haufe ERPs.
- Marketplace for vetted Hausverwaltungen.
- AI-trained legal Q&A for property law.

## Alternate Earlier Chosen Idea: AI Communication Co-Pilot

The rough `mock_claude_answer.md` file identifies a different chosen idea:

> An AI communication co-pilot for German Hausverwaltungen that drafts, classifies and prioritises tenant emails, so Sabine reviews and approves instead of writing from scratch.

Its MVP features were:

- Inbox triage: classify incoming tenant mails as urgent, routine, or informational.
- Auto-drafted replies grounded in property file, lease terms, and prior thread.
- Human review, edit, and send workflow.
- Multilingual support in DE, EN, TR, RU, AR, while Sabine works only in German.
- Active reminders for overdue rent, expiring contracts, and missing documents.
- No ERP migration; sits on top of Domus, Haufe, Impower, or similar systems.

Why it was selected in that version:

- Routine email writing was described as a large share of Sabine's week.
- A firm with 500 units may write 200+ tenant emails per week.
- Reducing drafting time from about 6 minutes to about 45 seconds could save 15-20 hours per FTE per week.
- A pilot could use one Hausverwaltung and read-only inbox access to measure draft acceptance and time-to-reply in 4-6 weeks.

Implementation relevance:

- This should be treated as a possible future module or supporting feature, not the final primary MVP direction unless the team changes scope.
- Email parsing and AI drafting may still be useful as an input channel for maintenance request creation.
- The human-in-the-loop approval model is relevant for AI-generated messages and decisions.

## User Roles To Support

Likely implementation roles:

- Tenant/renter: creates and tracks requests, uploads photos, answers follow-up questions.
- Owner/landlord/WEG board: reviews selected requests, approves or rejects larger-cost actions, sees transparent decision-ready information.
- Hausverwaltung/property manager: central operator who reviews, prioritizes, assigns, communicates, and tracks maintenance cases.
- Service provider/Handwerker: receives structured job information and updates job status.
- Admin/system owner: manages properties, units, user access, categories, providers, and approval thresholds.

Possible future roles:

- Beirat member for approval workflows.
- Public authority/utility contact, probably not interactive in MVP.

## Suggested MVP Workflow

1. Tenant, landlord, or owner submits a maintenance issue through chat-style intake or a structured form.
2. AI checks whether the request has enough information.
3. If information is missing, AI asks follow-up questions.
4. User adds missing details such as room/location, photos, urgency, contact/access details, and preferred times.
5. System creates a structured maintenance ticket.
6. AI categorizes the issue and suggests a priority.
7. Hausverwaltung reviews the ticket and can edit category, priority, status, and assignment.
8. If approval is required, owner/Beirat receives a decision-ready view.
9. Owner/Beirat accepts or rejects.
10. Hausverwaltung assigns or contacts a service provider.
11. Service provider receives complete information and approval status.
12. Tenant and relevant stakeholders can track status.
13. System stores communication summaries and ticket history.

## Suggested Data Model Concepts

Future implementation should likely include these entities:

- User
- Role
- Property
- Unit/apartment
- Owner group or WEG
- Tenant
- Maintenance request/ticket
- Ticket category
- Priority
- Status
- Photo/attachment
- Comment/message
- AI follow-up question
- AI-generated summary
- Approval request
- Approval decision
- Service provider
- Provider assignment
- Cost estimate
- Invoice or final cost, possibly post-MVP
- Audit log

Important ticket fields:

- Title
- Description
- Submitted by
- Affected property/unit
- Room/location
- Category
- Urgency
- Priority
- Status
- Photos/attachments
- Contact details
- Access details
- Responsible party
- Approval required flag
- Approval status
- Assigned provider
- Created date
- Last updated date
- Communication summary

## Statuses To Consider

Possible request statuses:

- Draft
- Submitted
- Needs more information
- Received
- Under review
- Waiting for owner approval
- Rejected by owner
- Approved
- Assigned to provider
- Appointment pending
- In progress
- Waiting for parts/provider
- Resolved
- Closed
- Cancelled

## AI Behaviors To Implement Carefully

The AI should:

- Convert unstructured text into structured ticket fields.
- Detect missing information.
- Ask concise follow-up questions.
- Categorize issue type.
- Suggest urgency/priority with explanation.
- Summarize long communication threads.
- Translate or normalize multilingual tenant messages.
- Draft messages for human review where needed.

The AI should not:

- Make legally binding decisions without human approval.
- Automatically approve large expenses.
- Hide uncertainty when priority/category is unclear.
- Replace existing core property-management software in the initial version.

## Integration Constraints

Repeated source theme:

- The product should not require replacing existing systems.
- It should be integration-friendly and modular.
- Existing systems named in the broader notes include Domus, Haufe, and Impower.

Implementation implications:

- Design APIs/import/export boundaries early.
- Keep data model independent from any single ERP.
- Allow manual entry first, then integrations later.
- Consider email import as a practical early integration.

## Pricing And Adoption Considerations

Research suggests small and medium-sized Hausverwaltungen may reject expensive fixed-cost modules.

Relevant adoption constraints:

- Smaller property managers need affordable automation.
- Per-unit or modular pricing may fit better than high fixed SaaS fees.
- Low migration effort is important.
- A prototype should be testable with a simple chatbot or structured form before a full platform is built.

## Prototype Focus Suggested By Notes

The group notes mention starting with a high-level frontend prototype and one showcase use case for testers.

Recommended first prototype scope:

- Tenant creates a maintenance request.
- AI helps structure and verify the request.
- Request is stored.
- Owner can view a request.
- Owner can accept or reject it.
- Hausverwaltung can see the structured ticket and status.

This prototype directly matches the current selected idea and is narrow enough for early feedback.

## Risks And Open Product Questions

Open questions for implementation planning:

- Which users log in first: tenants, owners, or property managers?
- Is the first prototype tenant-facing, Hausverwaltung-facing, or both?
- Are requests created only through a form/chat UI, or also from imported emails?
- What approval threshold triggers owner/Beirat approval?
- Does the product support WEG workflows from the start, or only rental management?
- Which statuses should be visible to tenants versus internal-only?
- Should service providers have their own portal in MVP, or receive structured emails/PDFs first?
- Are photos required for certain categories such as water damage?
- How should AI confidence be shown to Hausverwaltung users?
- What data must be stored for DSGVO compliance and auditability?

## Recommended Implementation Priorities

1. Build the maintenance ticket intake flow.
2. Add AI extraction and completeness checking.
3. Add structured ticket storage.
4. Add Hausverwaltung review dashboard.
5. Add tenant-facing status tracking.
6. Add owner approval/rejection flow.
7. Add provider recommendation or assignment.
8. Add communication summaries.
9. Add multilingual support.
10. Add integrations or email import once the core flow is validated.

