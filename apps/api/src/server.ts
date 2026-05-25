import "./env.js";
import cors from "cors";
import { and, desc, eq } from "drizzle-orm";
import express from "express";
import {
  aiTicketExtractRequestSchema,
  approvalDecisionRequestSchema,
  createTicketMessageRequestSchema,
  createTicketRequestSchema,
  demoLoginRequestSchema,
  ticketCategorySchema,
  ticketPrioritySchema,
  ticketStatusSchema,
  updateTicketRequestSchema,
  type ApprovalDetail,
  type ApprovalListItem,
  type CreateTicketMessageRequest,
  type DemoLoginResponse,
  type DemoUser,
  type HealthResponse,
  type PropertyOption,
  type TicketCategory,
  type TicketDetail,
  type TicketListItem,
  type TicketMessage,
  type TicketPriority,
  type TicketStatus,
  type UpdateTicketRequest
} from "@request-assistant/shared";
import { extractTicketFields } from "./ai/ticketExtraction.js";
import { createDemoToken, verifyDemoToken } from "./auth/token.js";
import { createDatabaseClient, hasDatabaseUrl } from "./db/client.js";
import { approvals, properties, ticketMessages, tickets, units, users } from "./db/schema.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

function getBearerToken(header: string | undefined) {
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length);
}

function requireDatabase() {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is not configured");
  }
}

function requireAuth(req: express.Request, res: express.Response): DemoUser | null {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    res.status(401).json({ message: "Missing bearer token." });
    return null;
  }

  const payload = verifyDemoToken(token);

  if (!payload) {
    res.status(401).json({ message: "Invalid bearer token." });
    return null;
  }

  return {
    id: payload.sub,
    name: payload.name,
    email: payload.email,
    role: payload.role
  };
}

function canReadTicket(user: DemoUser, ticket: { submittedByUserId: string; ownerUserId: string | null }) {
  if (user.role === "property_manager" || user.role === "admin") return true;
  if (user.role === "tenant") return ticket.submittedByUserId === user.id;
  if (user.role === "owner") return ticket.ownerUserId === user.id;
  return false;
}

function canWriteTicket(user: DemoUser) {
  return user.role === "property_manager" || user.role === "admin";
}

function visibleToUser(user: DemoUser, visibility: string) {
  if (user.role === "property_manager" || user.role === "admin") return true;
  if (user.role === "tenant") return visibility === "tenant_visible" || visibility === "all";
  if (user.role === "owner") return visibility === "owner_visible" || visibility === "all";
  return false;
}

function parseQueryValue(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

app.get("/api/health", async (_req, res) => {
  let database: HealthResponse["database"] = "not_configured";

  if (hasDatabaseUrl()) {
    const { client } = createDatabaseClient();

    try {
      await client`select 1`;
      database = "connected";
    } catch {
      database = "error";
    } finally {
      await client.end();
    }
  }

  const response: HealthResponse = {
    status: "ok",
    service: "request-assistant-api",
    timestamp: new Date().toISOString(),
    database
  };

  res.json(response);
});

app.post("/api/auth/demo-login", async (req, res) => {
  const parsed = demoLoginRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: "Invalid demo role." });
    return;
  }

  try {
    requireDatabase();
    const { client, db } = createDatabaseClient();

    try {
      const [user] = await db.select().from(users).where(eq(users.role, parsed.data.role)).limit(1);

      if (!user) {
        res.status(404).json({ message: "Demo user not found. Run the seed script first." });
        return;
      }

      const demoUser: DemoUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };
      const response: DemoLoginResponse = {
        token: createDemoToken(demoUser),
        user: demoUser
      };

      res.json(response);
    } finally {
      await client.end();
    }
  } catch (error) {
    res.status(503).json({
      message: error instanceof Error ? error.message : "Demo login is unavailable."
    });
  }
});

app.get("/api/me", (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  res.json({ user });
});

app.post("/api/ai/tickets/extract", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  if (user.role !== "tenant" && user.role !== "property_manager") {
    res.status(403).json({ message: "This demo role cannot use AI ticket extraction." });
    return;
  }

  const parsed = aiTicketExtractRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: "Invalid AI extraction input.", issues: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    const extraction = await extractTicketFields(parsed.data.input);
    res.json({ extraction });
  } catch (error) {
    res.status(503).json({ message: error instanceof Error ? error.message : "AI extraction unavailable." });
  }
});

app.get("/api/properties", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  try {
    requireDatabase();
    const { client, db } = createDatabaseClient();

    try {
      const conditions = [];
      if (user.role === "tenant") conditions.push(eq(units.tenantUserId, user.id));
      if (user.role === "owner") conditions.push(eq(units.ownerUserId, user.id));

      const rows = await db
        .select({
          propertyId: properties.id,
          propertyName: properties.name,
          propertyAddress: properties.address,
          unitId: units.id,
          unitLabel: units.label,
          unitFloor: units.floor
        })
        .from(properties)
        .innerJoin(units, eq(units.propertyId, properties.id))
        .where(conditions.length ? and(...conditions) : undefined);

      const byProperty = new Map<string, PropertyOption>();

      for (const row of rows) {
        const current = byProperty.get(row.propertyId) ?? {
          id: row.propertyId,
          name: row.propertyName,
          address: row.propertyAddress,
          units: []
        };

        current.units.push({
          id: row.unitId,
          label: row.unitLabel,
          floor: row.unitFloor
        });
        byProperty.set(row.propertyId, current);
      }

      res.json({ properties: Array.from(byProperty.values()) });
    } finally {
      await client.end();
    }
  } catch (error) {
    res.status(503).json({ message: error instanceof Error ? error.message : "Properties unavailable." });
  }
});

app.get("/api/tickets", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  const status = parseQueryValue(req.query.status);
  const priority = parseQueryValue(req.query.priority);
  const category = parseQueryValue(req.query.category);
  const propertyId = parseQueryValue(req.query.propertyId);
  let statusFilter: TicketStatus | undefined;
  let priorityFilter: TicketPriority | undefined;
  let categoryFilter: TicketCategory | undefined;

  if (status) {
    const parsedStatus = ticketStatusSchema.safeParse(status);
    if (!parsedStatus.success) {
      res.status(400).json({ message: "Invalid status filter." });
      return;
    }
    statusFilter = parsedStatus.data;
  }
  if (priority) {
    const parsedPriority = ticketPrioritySchema.safeParse(priority);
    if (!parsedPriority.success) {
      res.status(400).json({ message: "Invalid priority filter." });
      return;
    }
    priorityFilter = parsedPriority.data;
  }
  if (category) {
    const parsedCategory = ticketCategorySchema.safeParse(category);
    if (!parsedCategory.success) {
      res.status(400).json({ message: "Invalid category filter." });
      return;
    }
    categoryFilter = parsedCategory.data;
  }

  try {
    requireDatabase();
    const { client, db } = createDatabaseClient();

    try {
      const conditions = [];
      if (user.role === "tenant") conditions.push(eq(tickets.submittedByUserId, user.id));
      if (user.role === "owner") conditions.push(eq(units.ownerUserId, user.id));
      if (statusFilter) conditions.push(eq(tickets.status, statusFilter));
      if (priorityFilter) conditions.push(eq(tickets.priority, priorityFilter));
      if (categoryFilter) conditions.push(eq(tickets.category, categoryFilter));
      if (propertyId) conditions.push(eq(tickets.propertyId, propertyId));

      const rows = await db
        .select({
          id: tickets.id,
          title: tickets.title,
          description: tickets.description,
          category: tickets.category,
          priority: tickets.priority,
          status: tickets.status,
          propertyName: properties.name,
          unitLabel: units.label,
          roomOrLocation: tickets.roomOrLocation,
          submittedByName: users.name,
          createdAt: tickets.createdAt,
          updatedAt: tickets.updatedAt
        })
        .from(tickets)
        .innerJoin(properties, eq(tickets.propertyId, properties.id))
        .leftJoin(units, eq(tickets.unitId, units.id))
        .innerJoin(users, eq(tickets.submittedByUserId, users.id))
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(tickets.createdAt));

      const mapped: TicketListItem[] = rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString()
      }));

      res.json({ tickets: mapped });
    } finally {
      await client.end();
    }
  } catch (error) {
    res.status(503).json({ message: error instanceof Error ? error.message : "Tickets unavailable." });
  }
});

app.post("/api/tickets", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  if (user.role !== "tenant") {
    res.status(403).json({ message: "Only tenant demo users can create tickets in this sprint." });
    return;
  }

  const parsed = createTicketRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: "Invalid ticket data.", issues: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    requireDatabase();
    const { client, db } = createDatabaseClient();

    try {
      const [unit] = parsed.data.unitId
        ? await db.select().from(units).where(and(eq(units.id, parsed.data.unitId), eq(units.tenantUserId, user.id))).limit(1)
        : [];

      if (parsed.data.unitId && !unit) {
        res.status(403).json({ message: "Selected unit is not available for this tenant." });
        return;
      }

      const [createdTicket] = await db
        .insert(tickets)
        .values({
          propertyId: parsed.data.propertyId,
          unitId: parsed.data.unitId,
          submittedByUserId: user.id,
          title: parsed.data.title,
          description: parsed.data.description,
          category: parsed.data.category,
          priority: parsed.data.priority,
          roomOrLocation: parsed.data.roomOrLocation,
          contactDetails: parsed.data.contactDetails,
          accessDetails: parsed.data.accessDetails,
          attachmentNote: parsed.data.attachmentNote,
          status: "submitted"
        })
        .returning({ id: tickets.id });

      await db.insert(ticketMessages).values({
        ticketId: createdTicket.id,
        authorUserId: user.id,
        message: "Ticket submitted by tenant.",
        visibility: "all"
      });

      res.status(201).json({ id: createdTicket.id });
    } finally {
      await client.end();
    }
  } catch (error) {
    res.status(503).json({ message: error instanceof Error ? error.message : "Ticket creation unavailable." });
  }
});

app.get("/api/tickets/:ticketId", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  try {
    requireDatabase();
    const { client, db } = createDatabaseClient();

    try {
      const [row] = await db
        .select({
          id: tickets.id,
          title: tickets.title,
          description: tickets.description,
          category: tickets.category,
          priority: tickets.priority,
          status: tickets.status,
          propertyId: tickets.propertyId,
          unitId: tickets.unitId,
          propertyName: properties.name,
          propertyAddress: properties.address,
          unitLabel: units.label,
          ownerUserId: units.ownerUserId,
          roomOrLocation: tickets.roomOrLocation,
          submittedByUserId: tickets.submittedByUserId,
          submittedByName: users.name,
          contactDetails: tickets.contactDetails,
          accessDetails: tickets.accessDetails,
          attachmentNote: tickets.attachmentNote,
          approvalRequired: tickets.approvalRequired,
          approvalStatus: tickets.approvalStatus,
          aiSummary: tickets.aiSummary,
          createdAt: tickets.createdAt,
          updatedAt: tickets.updatedAt
        })
        .from(tickets)
        .innerJoin(properties, eq(tickets.propertyId, properties.id))
        .leftJoin(units, eq(tickets.unitId, units.id))
        .innerJoin(users, eq(tickets.submittedByUserId, users.id))
        .where(eq(tickets.id, req.params.ticketId))
        .limit(1);

      if (!row) {
        res.status(404).json({ message: "Ticket not found." });
        return;
      }

      if (!canReadTicket(user, row)) {
        res.status(403).json({ message: "You cannot view this ticket." });
        return;
      }

      const messageRows = await db
        .select({
          id: ticketMessages.id,
          authorName: users.name,
          message: ticketMessages.message,
          visibility: ticketMessages.visibility,
          createdAt: ticketMessages.createdAt
        })
        .from(ticketMessages)
        .innerJoin(users, eq(ticketMessages.authorUserId, users.id))
        .where(eq(ticketMessages.ticketId, row.id))
        .orderBy(ticketMessages.createdAt);

      const visibleMessages = messageRows.filter((message) => visibleToUser(user, message.visibility));

      const messages: TicketMessage[] = visibleMessages.map((message) => ({
        ...message,
        createdAt: message.createdAt.toISOString()
      }));

      const detail: TicketDetail = {
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category,
        priority: row.priority,
        status: row.status,
        propertyId: row.propertyId,
        unitId: row.unitId,
        propertyName: row.propertyName,
        propertyAddress: row.propertyAddress,
        unitLabel: row.unitLabel,
        roomOrLocation: row.roomOrLocation,
        submittedByName: row.submittedByName,
        contactDetails: row.contactDetails,
        accessDetails: row.accessDetails,
        attachmentNote: row.attachmentNote,
        approvalRequired: row.approvalRequired,
        approvalStatus: row.approvalStatus,
        aiSummary: row.aiSummary,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        messages
      };

      res.json({ ticket: detail });
    } finally {
      await client.end();
    }
  } catch (error) {
    res.status(503).json({ message: error instanceof Error ? error.message : "Ticket unavailable." });
  }
});

app.patch("/api/tickets/:ticketId", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  if (!canWriteTicket(user)) {
    res.status(403).json({ message: "Only Hausverwaltung demo users can update tickets in this sprint." });
    return;
  }

  const parsed = updateTicketRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: "Invalid ticket update.", issues: parsed.error.flatten().fieldErrors });
    return;
  }

  const updateData: UpdateTicketRequest = parsed.data;

  try {
    requireDatabase();
    const { client, db } = createDatabaseClient();

    try {
      const [updated] = await db
        .update(tickets)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(tickets.id, req.params.ticketId))
        .returning({ id: tickets.id });

      if (!updated) {
        res.status(404).json({ message: "Ticket not found." });
        return;
      }

      res.json({ id: updated.id });
    } finally {
      await client.end();
    }
  } catch (error) {
    res.status(503).json({ message: error instanceof Error ? error.message : "Ticket update unavailable." });
  }
});

app.get("/api/tickets/:ticketId/messages", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  try {
    requireDatabase();
    const { client, db } = createDatabaseClient();

    try {
      const [ticket] = await db
        .select({
          submittedByUserId: tickets.submittedByUserId,
          ownerUserId: units.ownerUserId
        })
        .from(tickets)
        .leftJoin(units, eq(tickets.unitId, units.id))
        .where(eq(tickets.id, req.params.ticketId))
        .limit(1);

      if (!ticket) {
        res.status(404).json({ message: "Ticket not found." });
        return;
      }

      if (!canReadTicket(user, ticket)) {
        res.status(403).json({ message: "You cannot view messages for this ticket." });
        return;
      }

      const rows = await db
        .select({
          id: ticketMessages.id,
          authorName: users.name,
          message: ticketMessages.message,
          visibility: ticketMessages.visibility,
          createdAt: ticketMessages.createdAt
        })
        .from(ticketMessages)
        .innerJoin(users, eq(ticketMessages.authorUserId, users.id))
        .where(eq(ticketMessages.ticketId, req.params.ticketId))
        .orderBy(ticketMessages.createdAt);

      const messages: TicketMessage[] = rows
        .filter((message) => visibleToUser(user, message.visibility))
        .map((message) => ({
          ...message,
          createdAt: message.createdAt.toISOString()
        }));

      res.json({ messages });
    } finally {
      await client.end();
    }
  } catch (error) {
    res.status(503).json({ message: error instanceof Error ? error.message : "Messages unavailable." });
  }
});

app.post("/api/tickets/:ticketId/messages", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  if (!canWriteTicket(user)) {
    res.status(403).json({ message: "Only Hausverwaltung demo users can add ticket updates in this sprint." });
    return;
  }

  const parsed = createTicketMessageRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: "Invalid message.", issues: parsed.error.flatten().fieldErrors });
    return;
  }

  const data: CreateTicketMessageRequest = parsed.data;

  try {
    requireDatabase();
    const { client, db } = createDatabaseClient();

    try {
      const [ticket] = await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.id, req.params.ticketId)).limit(1);

      if (!ticket) {
        res.status(404).json({ message: "Ticket not found." });
        return;
      }

      const [created] = await db
        .insert(ticketMessages)
        .values({
          ticketId: req.params.ticketId,
          authorUserId: user.id,
          message: data.message,
          visibility: data.visibility
        })
        .returning({ id: ticketMessages.id });

      await db.update(tickets).set({ updatedAt: new Date() }).where(eq(tickets.id, req.params.ticketId));

      res.status(201).json({ id: created.id });
    } finally {
      await client.end();
    }
  } catch (error) {
    res.status(503).json({ message: error instanceof Error ? error.message : "Message creation unavailable." });
  }
});

app.post("/api/tickets/:ticketId/approval-request", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  if (!canWriteTicket(user)) {
    res.status(403).json({ message: "Only Hausverwaltung demo users can request approval." });
    return;
  }

  try {
    requireDatabase();
    const { client, db } = createDatabaseClient();

    try {
      const [ticket] = await db
        .select({
          id: tickets.id,
          ownerUserId: units.ownerUserId
        })
        .from(tickets)
        .leftJoin(units, eq(tickets.unitId, units.id))
        .where(eq(tickets.id, req.params.ticketId))
        .limit(1);

      if (!ticket) {
        res.status(404).json({ message: "Ticket not found." });
        return;
      }

      if (!ticket.ownerUserId) {
        res.status(400).json({ message: "Ticket has no owner assigned through its unit." });
        return;
      }

      const [existing] = await db
        .select({ id: approvals.id })
        .from(approvals)
        .where(and(eq(approvals.ticketId, ticket.id), eq(approvals.status, "pending")))
        .limit(1);

      if (existing) {
        res.json({ id: existing.id });
        return;
      }

      const [created] = await db
        .insert(approvals)
        .values({
          ticketId: ticket.id,
          requestedByUserId: user.id,
          ownerUserId: ticket.ownerUserId,
          status: "pending"
        })
        .returning({ id: approvals.id });

      await db
        .update(tickets)
        .set({
          approvalRequired: true,
          approvalStatus: "pending",
          status: "waiting_for_owner_approval",
          updatedAt: new Date()
        })
        .where(eq(tickets.id, ticket.id));

      await db.insert(ticketMessages).values({
        ticketId: ticket.id,
        authorUserId: user.id,
        message: "Owner approval requested.",
        visibility: "all"
      });

      res.status(201).json({ id: created.id });
    } finally {
      await client.end();
    }
  } catch (error) {
    res.status(503).json({ message: error instanceof Error ? error.message : "Approval request unavailable." });
  }
});

app.get("/api/approvals", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  try {
    requireDatabase();
    const { client, db } = createDatabaseClient();

    try {
      const conditions = [];
      if (user.role === "owner") conditions.push(eq(approvals.ownerUserId, user.id));
      if (user.role === "property_manager") conditions.push(eq(approvals.requestedByUserId, user.id));

      const rows = await db
        .select({
          id: approvals.id,
          ticketId: approvals.ticketId,
          ticketTitle: tickets.title,
          ticketDescription: tickets.description,
          propertyName: properties.name,
          unitLabel: units.label,
          category: tickets.category,
          priority: tickets.priority,
          status: approvals.status,
          createdAt: approvals.createdAt,
          decidedAt: approvals.decidedAt
        })
        .from(approvals)
        .innerJoin(tickets, eq(approvals.ticketId, tickets.id))
        .innerJoin(properties, eq(tickets.propertyId, properties.id))
        .leftJoin(units, eq(tickets.unitId, units.id))
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(approvals.createdAt));

      const mapped: ApprovalListItem[] = rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
        decidedAt: row.decidedAt ? row.decidedAt.toISOString() : null
      }));

      res.json({ approvals: mapped });
    } finally {
      await client.end();
    }
  } catch (error) {
    res.status(503).json({ message: error instanceof Error ? error.message : "Approvals unavailable." });
  }
});

app.get("/api/approvals/:approvalId", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  try {
    requireDatabase();
    const { client, db } = createDatabaseClient();

    try {
      const [row] = await db
        .select({
          id: approvals.id,
          ticketId: approvals.ticketId,
          ticketTitle: tickets.title,
          ticketDescription: tickets.description,
          propertyName: properties.name,
          unitLabel: units.label,
          category: tickets.category,
          priority: tickets.priority,
          status: approvals.status,
          createdAt: approvals.createdAt,
          decidedAt: approvals.decidedAt,
          ticketStatus: tickets.status,
          roomOrLocation: tickets.roomOrLocation,
          attachmentNote: tickets.attachmentNote,
          managerName: users.name,
          ownerName: users.name,
          decisionNote: approvals.decisionNote,
          ownerUserId: approvals.ownerUserId,
          requestedByUserId: approvals.requestedByUserId
        })
        .from(approvals)
        .innerJoin(tickets, eq(approvals.ticketId, tickets.id))
        .innerJoin(properties, eq(tickets.propertyId, properties.id))
        .leftJoin(units, eq(tickets.unitId, units.id))
        .innerJoin(users, eq(approvals.requestedByUserId, users.id))
        .where(eq(approvals.id, req.params.approvalId))
        .limit(1);

      if (!row) {
        res.status(404).json({ message: "Approval not found." });
        return;
      }

      if (user.role === "owner" && row.ownerUserId !== user.id) {
        res.status(403).json({ message: "You cannot view this approval." });
        return;
      }

      if (user.role === "tenant") {
        res.status(403).json({ message: "Tenants cannot view approval requests in this demo." });
        return;
      }

      const [owner] = await db.select({ name: users.name }).from(users).where(eq(users.id, row.ownerUserId)).limit(1);

      const detail: ApprovalDetail = {
        id: row.id,
        ticketId: row.ticketId,
        ticketTitle: row.ticketTitle,
        ticketDescription: row.ticketDescription,
        propertyName: row.propertyName,
        unitLabel: row.unitLabel,
        category: row.category,
        priority: row.priority,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        decidedAt: row.decidedAt ? row.decidedAt.toISOString() : null,
        ticketStatus: row.ticketStatus,
        roomOrLocation: row.roomOrLocation,
        attachmentNote: row.attachmentNote,
        managerName: row.managerName,
        ownerName: owner?.name ?? "Owner",
        decisionNote: row.decisionNote
      };

      res.json({ approval: detail });
    } finally {
      await client.end();
    }
  } catch (error) {
    res.status(503).json({ message: error instanceof Error ? error.message : "Approval unavailable." });
  }
});

async function decideApproval(req: express.Request, res: express.Response, decision: "approved" | "rejected") {
  const user = requireAuth(req, res);
  if (!user) return;
  const approvalId = String(req.params.approvalId);

  if (user.role !== "owner") {
    res.status(403).json({ message: "Only owner demo users can decide approvals." });
    return;
  }

  const parsed = approvalDecisionRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: "Invalid approval decision.", issues: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    requireDatabase();
    const { client, db } = createDatabaseClient();

    try {
      const [approval] = await db
        .select({
          id: approvals.id,
          ticketId: approvals.ticketId,
          ownerUserId: approvals.ownerUserId,
          status: approvals.status
        })
        .from(approvals)
        .where(eq(approvals.id, approvalId))
        .limit(1);

      if (!approval) {
        res.status(404).json({ message: "Approval not found." });
        return;
      }

      if (approval.ownerUserId !== user.id) {
        res.status(403).json({ message: "You cannot decide this approval." });
        return;
      }

      await db
        .update(approvals)
        .set({
          status: decision,
          decisionNote: parsed.data.decisionNote,
          decidedAt: new Date()
        })
        .where(eq(approvals.id, approval.id));

      await db
        .update(tickets)
        .set({
          approvalStatus: decision,
          status: decision === "approved" ? "approved" : "rejected",
          updatedAt: new Date()
        })
        .where(eq(tickets.id, approval.ticketId));

      await db.insert(ticketMessages).values({
        ticketId: approval.ticketId,
        authorUserId: user.id,
        message: decision === "approved" ? "Owner approved the request." : "Owner rejected the request.",
        visibility: "all"
      });

      res.json({ id: approval.id, status: decision });
    } finally {
      await client.end();
    }
  } catch (error) {
    res.status(503).json({ message: error instanceof Error ? error.message : "Approval decision unavailable." });
  }
}

app.post("/api/approvals/:approvalId/approve", (req, res) => {
  void decideApproval(req, res, "approved");
});

app.post("/api/approvals/:approvalId/reject", (req, res) => {
  void decideApproval(req, res, "rejected");
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
