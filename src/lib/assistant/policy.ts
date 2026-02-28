import { readFileSync } from "node:fs";
import path from "node:path";

let policyCache = "";

export function getAssistantPolicy(): string {
  if (policyCache) {
    return policyCache;
  }

  const policyPath = path.join(process.cwd(), "assistant_policy.md");
  try {
    policyCache = readFileSync(policyPath, "utf8");
  } catch {
    policyCache = "Rule-based Fallback Policy aktiv";
  }

  return policyCache;
}
