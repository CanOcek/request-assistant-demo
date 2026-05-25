import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["tenant", "property_manager", "owner", "admin"]);
export const ticketCategoryEnum = pgEnum("ticket_category", [
  "heating",
  "water_damage",
  "internet_tv",
  "electricity",
  "cleaning",
  "access",
  "noise",
  "general_repair",
  "other"
]);
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "medium", "high", "urgent"]);
export const ticketStatusEnum = pgEnum("ticket_status", [
  "draft",
  "submitted",
  "needs_more_information",
  "under_review",
  "waiting_for_owner_approval",
  "approved",
  "rejected",
  "assigned",
  "in_progress",
  "resolved",
  "closed",
  "cancelled"
]);
export const approvalStatusEnum = pgEnum("approval_status", ["pending", "approved", "rejected"]);
export const messageVisibilityEnum = pgEnum("message_visibility", ["internal", "tenant_visible", "owner_visible", "all"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
};

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  role: userRoleEnum("role").notNull(),
  ...timestamps
});

export const properties = pgTable("properties", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  ...timestamps
});

export const units = pgTable("units", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  floor: text("floor"),
  tenantUserId: uuid("tenant_user_id").references(() => users.id, { onDelete: "set null" }),
  ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "set null" }),
  ...timestamps
});

export const serviceProviders = pgTable("service_providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  trade: text("trade").notNull(),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  ...timestamps
});

export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: ticketCategoryEnum("category").notNull().default("other"),
  priority: ticketPriorityEnum("priority").notNull().default("medium"),
  status: ticketStatusEnum("status").notNull().default("submitted"),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  unitId: uuid("unit_id").references(() => units.id, { onDelete: "set null" }),
  roomOrLocation: text("room_or_location"),
  submittedByUserId: uuid("submitted_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  assignedManagerUserId: uuid("assigned_manager_user_id").references(() => users.id, { onDelete: "set null" }),
  assignedServiceProviderId: uuid("assigned_service_provider_id").references(() => serviceProviders.id, {
    onDelete: "set null"
  }),
  contactDetails: text("contact_details"),
  accessDetails: text("access_details"),
  attachmentNote: text("attachment_note"),
  approvalRequired: boolean("approval_required").notNull().default(false),
  approvalStatus: approvalStatusEnum("approval_status"),
  aiSummary: text("ai_summary"),
  aiConfidence: numeric("ai_confidence", { precision: 4, scale: 3 }),
  estimatedCostCents: integer("estimated_cost_cents"),
  ...timestamps
});

export const ticketMessages = pgTable("ticket_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => tickets.id, { onDelete: "cascade" }),
  authorUserId: uuid("author_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  message: text("message").notNull(),
  visibility: messageVisibilityEnum("visibility").notNull().default("internal"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const approvals = pgTable("approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => tickets.id, { onDelete: "cascade" }),
  requestedByUserId: uuid("requested_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  ownerUserId: uuid("owner_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  status: approvalStatusEnum("status").notNull().default("pending"),
  decisionNote: text("decision_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  decidedAt: timestamp("decided_at", { withTimezone: true })
});

export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => tickets.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileUrl: text("file_url").notNull(),
  uploadedByUserId: uuid("uploaded_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
