import { z } from "zod";
import { createDemoSession } from "../../../../backend/services/demoSeed";

const BodySchema = z.object({
  role: z.enum(["admin", "student"]),
});

export async function POST(req: Request) {
  const body = BodySchema.parse(await req.json().catch(() => ({})));
  const result = await createDemoSession(body.role);
  if (result.deny) return result.deny;
  return Response.json({
    success: true,
    token: result.token,
    user: result.user,
    demo: result.demo,
  });
}

