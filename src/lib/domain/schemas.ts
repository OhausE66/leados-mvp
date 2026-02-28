import { z } from "zod";

export const chatInputSchema = z.object({
  caseId: z.string().nullish().transform((value) => value ?? undefined),
  leaderId: z.string().min(1).default("leader-demo"),
  message: z.string().min(4),
});

export const contactCreateSchema = z.object({
  caseId: z.string().min(1),
  leaderId: z.string().min(1),
  coachId: z.string().min(1),
  subject: z.string().min(3).max(120),
  body: z.string().min(10).max(1000),
});

export const contactDecisionSchema = z.object({
  messageId: z.string().min(1),
  coachId: z.string().min(1),
  decision: z.enum(["accepted", "declined"]),
});

export const bookingCreateSchema = z.object({
  caseId: z.string().min(1),
  leaderId: z.string().min(1),
  coachId: z.string().min(1),
  requestedHours: z.number().int().min(1).max(10),
  proposedDates: z.array(z.string().min(10)).min(1).max(5),
});

export const bookingConfirmSchema = z.object({
  bookingId: z.string().min(1),
  actorRole: z.enum(["leader", "coach"]),
  actorId: z.string().min(1),
  decision: z.enum(["confirm", "decline"]).default("confirm"),
});
