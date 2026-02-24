import { leadershipOutputSchema } from "@/lib/schemas";

const validOutput = {
  daily_briefing: {
    top_actions: [
      {
        title: "Action 1",
        why: "Reason",
        script: "Say this",
        timebox_minutes: 20,
      },
    ],
    watchouts: ["Watchout"],
  },
  one_on_one: {
    agenda: [
      {
        topic: "Topic",
        goal: "Goal",
        questions: ["Question?"],
      },
    ],
    feedback_script: {
      opening: "Opening",
      core: "Core",
      support: "Support",
      close: "Close",
    },
    followups: [{ owner: "Leader", action: "Do thing", due_in_days: 2 }],
  },
  templates_used: ["template-a"],
  assumptions: [],
  clarifying_questions: [],
};

describe("leadershipOutputSchema", () => {
  it("accepts valid payload", () => {
    const result = leadershipOutputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  it("rejects invalid payload", () => {
    const invalid = {
      ...validOutput,
      daily_briefing: {
        ...validOutput.daily_briefing,
        top_actions: [
          {
            title: "",
            why: "",
            script: "",
            timebox_minutes: -1,
          },
        ],
      },
    };

    const result = leadershipOutputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
