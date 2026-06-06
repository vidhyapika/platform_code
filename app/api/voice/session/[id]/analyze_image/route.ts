import { verifyJWT, requireAuth } from "../../../../../../backend/middleware/auth";
import { getAISession } from "../../../../../../backend/repositories/progressRepo";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const BodySchema = z.object({
  image: z.string().min(1),
  question: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyJWT(req.headers.get("authorization"));
  const err = requireAuth(user);
  if (err) return err;

  const { id } = await params;
  const session = await getAISession(id);
  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });
  if (session.studentId !== user!.sub) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!session.roomName) {
    return Response.json({ error: "Not a voice session" }, { status: 400 });
  }

  const body = BodySchema.parse(await req.json());
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });

  const ai = new GoogleGenAI({ apiKey });
  const prompt = body.question
    ? `Analyze this homework image for a student. Question context: ${body.question}. Give 2-4 sentences the tutor should speak aloud.`
    : "Analyze this homework image. Give 2-4 sentences the tutor should speak aloud about what the student did well or needs to fix.";

  const imageData = body.image.replace(/^data:image\/\w+;base64,/, "");

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/png", data: imageData } },
        ],
      },
    ],
  });

  const analysis = response.text ?? "I reviewed your image. Let's discuss it together.";

  return Response.json({ analysis });
}
