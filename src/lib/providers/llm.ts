export interface LlmProvider {
  enabled: boolean;
  rewriteResponse(input: string): Promise<string>;
}

export class DisabledLlmProvider implements LlmProvider {
  enabled = false;

  async rewriteResponse(input: string): Promise<string> {
    return input;
  }
}

export function createLlmProvider(): LlmProvider {
  const enabled = process.env.ENABLE_LLM_PROVIDER === "true" && Boolean(process.env.LLM_API_KEY);

  if (!enabled) {
    return new DisabledLlmProvider();
  }

  return {
    enabled: true,
    async rewriteResponse(input: string): Promise<string> {
      return `${input}\n\n(Hinweis: LLM Hook ist aktiv, derzeit nur Pass-through)`;
    },
  };
}
