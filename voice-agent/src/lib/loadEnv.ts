import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const voiceAgentRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const repoRoot = resolve(voiceAgentRoot, "..");

/** Load env from voice-agent/ and repo root (same keys as Next.js .env.local). */
export function loadVoiceAgentEnv() {
  const files = [
    resolve(voiceAgentRoot, ".env"),
    resolve(voiceAgentRoot, ".env.local"),
    resolve(repoRoot, ".env.local"),
    resolve(repoRoot, ".env"),
  ];

  for (const path of files) {
    if (existsSync(path)) {
      dotenv.config({ path, override: false });
    }
  }

  // Next app may use GEMINI_API_KEY; Google plugin accepts GOOGLE_API_KEY or GEMINI_API_KEY
  if (!process.env.GEMINI_API_KEY && process.env.GOOGLE_API_KEY) {
    process.env.GEMINI_API_KEY = process.env.GOOGLE_API_KEY;
  }
  if (!process.env.GOOGLE_API_KEY && process.env.GEMINI_API_KEY) {
    process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
  }
}
