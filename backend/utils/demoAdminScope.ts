import type { JWTPayload } from "../middleware/auth";
import { ensureDemoMetaUpToDate, type DemoMeta } from "../services/demoSeed";

export function isDemoAdmin(user: JWTPayload | null): boolean {
  if (!user) return false;
  return user.role === "admin" && user.email.toLowerCase() === "admin@demo.com";
}

export async function requireDemoScope(user: JWTPayload | null): Promise<DemoMeta | null> {
  if (!isDemoAdmin(user)) return null;
  return await ensureDemoMetaUpToDate();
}

