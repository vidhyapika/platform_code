import { bootstrapDemoData } from "../../../../backend/services/demoSeed";

export async function POST() {
  const demo = await bootstrapDemoData();
  return Response.json({ success: true, demo });
}

