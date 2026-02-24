import { z } from "zod";

export const topActionSchema = z.object({
  title: z.string().min(1),
  why: z.string().min(1),
  script: z.string().min(1),
  timebox_minutes: z.number().int().positive(),
});

export const leadershipOutputSchema = z.object({
  daily_briefing: z.object({
    top_actions: z.array(topActionSchema).min(1).max(3),
    watchouts: z.array(z.string().min(1)).max(5),
  }),
  one_on_one: z.object({
    agenda: z
      .array(
        z.object({
          topic: z.string().min(1),
          goal: z.string().min(1),
          questions: z.array(z.string().min(1)).min(1),
        }),
      )
      .min(1),
    feedback_script: z.object({
      opening: z.string().min(1),
      core: z.string().min(1),
      support: z.string().min(1),
      close: z.string().min(1),
    }),
    followups: z
      .array(
        z.object({
          owner: z.string().min(1),
          action: z.string().min(1),
          due_in_days: z.number().int().positive(),
        }),
      )
      .max(5),
  }),
  templates_used: z.array(z.string().min(1)).max(5),
  assumptions: z.array(z.string().min(1)).max(6),
  clarifying_questions: z.array(z.string().min(1)).max(3),
});

export type LeadershipOutput = z.infer<typeof leadershipOutputSchema>;

export const dailyBriefingRequestSchema = z.object({
  week_goal: z.string().min(3).max(300),
  challenge: z.string().min(3).max(300),
  tone: z.string().min(2).max(50),
  context: z.string().max(1000).optional().default(""),
});

export const oneOnOneRequestSchema = z.object({
  team_member_id: z.string().min(1),
  team_member_name: z.string().min(1).optional(),
  context: z.string().min(3).max(1500),
  tone: z.string().min(2).max(50),
  goal: z.string().min(3).max(300),
});

export type DailyBriefingRequest = z.infer<typeof dailyBriefingRequestSchema>;
export type OneOnOneRequest = z.infer<typeof oneOnOneRequestSchema>;

export const aiGenerateInputSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("daily-briefing"),
    week_goal: z.string(),
    challenge: z.string(),
    tone: z.string(),
    context: z.string().optional().default(""),
  }),
  z.object({
    kind: z.literal("one-on-one"),
    team_member_name: z.string(),
    context: z.string(),
    tone: z.string(),
    goal: z.string(),
  }),
]);

export type AIGenerateInput = z.infer<typeof aiGenerateInputSchema>;
