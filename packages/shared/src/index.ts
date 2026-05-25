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
