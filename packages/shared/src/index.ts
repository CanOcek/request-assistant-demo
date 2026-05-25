import { z } from "zod";

export type HealthResponse = {
  status: "ok";
  service: string;
  timestamp: string;
  database?: "not_configured" | "connected" | "error";
};

export const appName = "Request Assistant";

export const userRoleSchema = z.enum(["tenant", "property_manager", "owner", "admin"]);
export const ticketCategorySchema = z.enum([
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
export const ticketPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export const ticketStatusSchema = z.enum([
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
export const approvalStatusSchema = z.enum(["pending", "approved", "rejected"]);
export const messageVisibilitySchema = z.enum(["internal", "tenant_visible", "owner_visible", "all"]);

export type UserRole = z.infer<typeof userRoleSchema>;
export type TicketCategory = z.infer<typeof ticketCategorySchema>;
export type TicketPriority = z.infer<typeof ticketPrioritySchema>;
export type TicketStatus = z.infer<typeof ticketStatusSchema>;
export type ApprovalStatus = z.infer<typeof approvalStatusSchema>;
export type MessageVisibility = z.infer<typeof messageVisibilitySchema>;

export const demoLoginRequestSchema = z.object({
  role: z.enum(["tenant", "property_manager", "owner"])
});

export type DemoLoginRequest = z.infer<typeof demoLoginRequestSchema>;

export type DemoUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type DemoLoginResponse = {
  token: string;
  user: DemoUser;
};

export const createTicketRequestSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  title: z.string().min(3).max(140),
  description: z.string().min(10).max(4000),
  category: ticketCategorySchema,
  priority: ticketPrioritySchema,
  roomOrLocation: z.string().max(200).optional(),
  contactDetails: z.string().max(500).optional(),
  accessDetails: z.string().max(500).optional(),
  attachmentNote: z.string().max(500).optional()
});

export type CreateTicketRequest = z.infer<typeof createTicketRequestSchema>;

export type UnitOption = {
  id: string;
  label: string;
  floor: string | null;
};

export type PropertyOption = {
  id: string;
  name: string;
  address: string;
  units: UnitOption[];
};

export type TicketListItem = {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  propertyName: string;
  unitLabel: string | null;
  roomOrLocation: string | null;
  submittedByName: string;
  createdAt: string;
  updatedAt: string;
};

export type TicketMessage = {
  id: string;
  authorName: string;
  message: string;
  visibility: MessageVisibility;
  createdAt: string;
};

export type TicketDetail = TicketListItem & {
  propertyId: string;
  unitId: string | null;
  propertyAddress: string;
  contactDetails: string | null;
  accessDetails: string | null;
  attachmentNote: string | null;
  approvalRequired: boolean;
  approvalStatus: ApprovalStatus | null;
  aiSummary: string | null;
  messages: TicketMessage[];
};

export const updateTicketRequestSchema = z.object({
  status: ticketStatusSchema.optional(),
  category: ticketCategorySchema.optional(),
  priority: ticketPrioritySchema.optional(),
  roomOrLocation: z.string().max(200).optional(),
  contactDetails: z.string().max(500).optional(),
  accessDetails: z.string().max(500).optional(),
  attachmentNote: z.string().max(500).optional()
});

export type UpdateTicketRequest = z.infer<typeof updateTicketRequestSchema>;

export const createTicketMessageRequestSchema = z.object({
  message: z.string().min(2).max(1200),
  visibility: messageVisibilitySchema
});

export type CreateTicketMessageRequest = z.infer<typeof createTicketMessageRequestSchema>;

export const aiTicketExtractRequestSchema = z.object({
  input: z.string().min(10).max(4000),
  uiLanguage: z.enum(["en", "de"]).optional()
});

export type AiTicketExtractRequest = z.infer<typeof aiTicketExtractRequestSchema>;

export const aiTicketExtractResponseSchema = z.object({
  suggestedTitle: z.string().min(3).max(140),
  cleanDescription: z.string().min(10).max(4000),
  category: ticketCategorySchema,
  priority: ticketPrioritySchema,
  roomOrLocation: z.string().max(200).nullable(),
  missingFields: z.array(z.string()).max(8),
  followUpQuestions: z.array(z.string()).max(8),
  summary: z.string().min(5).max(800),
  confidence: z.number().min(0).max(1),
  source: z.enum(["openai", "mock"])
});

export type AiTicketExtractResponse = z.infer<typeof aiTicketExtractResponseSchema>;

export const approvalDecisionRequestSchema = z.object({
  decisionNote: z.string().max(1000).optional()
});

export type ApprovalDecisionRequest = z.infer<typeof approvalDecisionRequestSchema>;

export type ApprovalListItem = {
  id: string;
  ticketId: string;
  ticketTitle: string;
  ticketDescription: string;
  propertyName: string;
  unitLabel: string | null;
  category: TicketCategory;
  priority: TicketPriority;
  status: ApprovalStatus;
  createdAt: string;
  decidedAt: string | null;
};

export type ApprovalDetail = ApprovalListItem & {
  ticketStatus: TicketStatus;
  roomOrLocation: string | null;
  attachmentNote: string | null;
  managerName: string;
  ownerName: string;
  decisionNote: string | null;
};
