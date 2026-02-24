const requireApiUserMock = jest.fn();
const generateLeadershipOutputsMock = jest.fn();
const saveDailyBriefingMock = jest.fn();

jest.mock("@/lib/api-auth", () => ({
  requireApiUser: requireApiUserMock,
}));

jest.mock("@/lib/ai", () => ({
  formatAIError: (error: Error) => ({ code: "UNKNOWN", message: error.message }),
  generateLeadershipOutputs: generateLeadershipOutputsMock,
}));

jest.mock("@/lib/db/ai-results", () => ({
  saveDailyBriefing: saveDailyBriefingMock,
}));

describe("POST /api/ai/daily-briefing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 on happy path", async () => {
    requireApiUserMock.mockResolvedValue({
      user: { id: "user-1" },
      supabase: {},
    });

    generateLeadershipOutputsMock.mockResolvedValue({
      daily_briefing: {
        top_actions: [
          {
            title: "Action",
            why: "Why",
            script: "Script",
            timebox_minutes: 20,
          },
        ],
        watchouts: ["Watchout"],
      },
      one_on_one: {
        agenda: [{ topic: "Topic", goal: "Goal", questions: ["Q1"] }],
        feedback_script: {
          opening: "Opening",
          core: "Core",
          support: "Support",
          close: "Close",
        },
        followups: [{ owner: "Leader", action: "Act", due_in_days: 2 }],
      },
      templates_used: ["t1"],
      assumptions: [],
      clarifying_questions: [],
    });

    const { POST } = await import("@/app/api/ai/daily-briefing/route");

    const request = new Request("http://localhost/api/ai/daily-briefing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        week_goal: "Ship beta",
        challenge: "Too many priorities",
        tone: "direct",
        context: "Need quick focus",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.output.daily_briefing.top_actions).toHaveLength(1);
    expect(saveDailyBriefingMock).toHaveBeenCalledTimes(1);
  });

  it("allows guest generation but skips persistence when unauthorized", async () => {
    requireApiUserMock.mockResolvedValue(null);
    generateLeadershipOutputsMock.mockResolvedValue({
      daily_briefing: {
        top_actions: [
          {
            title: "Action",
            why: "Why",
            script: "Script",
            timebox_minutes: 20,
          },
        ],
        watchouts: ["Watchout"],
      },
      one_on_one: {
        agenda: [{ topic: "Topic", goal: "Goal", questions: ["Q1"] }],
        feedback_script: {
          opening: "Opening",
          core: "Core",
          support: "Support",
          close: "Close",
        },
        followups: [{ owner: "Leader", action: "Act", due_in_days: 2 }],
      },
      templates_used: ["t1"],
      assumptions: [],
      clarifying_questions: [],
    });

    const { POST } = await import("@/app/api/ai/daily-briefing/route");
    const request = new Request("http://localhost/api/ai/daily-briefing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        week_goal: "Ship beta",
        challenge: "Too many priorities",
        tone: "direct",
        context: "Need quick focus",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.output.daily_briefing.top_actions).toHaveLength(1);
    expect(saveDailyBriefingMock).not.toHaveBeenCalled();
  });
});
