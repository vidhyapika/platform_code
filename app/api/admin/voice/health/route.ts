import { verifyJWT, requireAdmin } from "../../../../../backend/middleware/auth";

import { getLiveKitConfig } from "../../../../../backend/lib/livekit";



export async function GET(req: Request) {

  const user = await verifyJWT(req.headers.get("authorization"));

  const err = requireAdmin(user);

  if (err) return err;



  let livekitOk = false;

  let livekitDetail = "";

  try {

    const cfg = getLiveKitConfig();

    livekitOk = !!(cfg.url && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET);

    livekitDetail = livekitOk ? "configured" : "missing credentials";

  } catch (e: any) {

    livekitDetail = e?.message ?? "not configured";

  }



  const geminiKey = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

  const deepgramKey = !!process.env.DEEPGRAM_API_KEY;

  const agentSecret = !!process.env.VOICE_AGENT_SERVICE_SECRET;



  return Response.json({

    livekit: { ok: livekitOk, detail: livekitDetail },

    gemini: { configured: geminiKey },

    deepgram: { configured: deepgramKey },

    agentAuth: { configured: agentSecret, detail: agentSecret ? "service secret set" : "VOICE_AGENT_SERVICE_SECRET missing" },

    voiceAgent: {

      hint: "Run the LiveKit agent worker: cd voice-agent && npm run dev. Events flow over LiveKit data (no Redis or bridge).",

    },

  });

}

