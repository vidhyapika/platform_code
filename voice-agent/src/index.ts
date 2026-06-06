import { loadVoiceAgentEnv } from "./lib/loadEnv.js";
loadVoiceAgentEnv();
import { cli, defineAgent, voice, ServerOptions, type JobContext } from "@livekit/agents";
import * as deepgram from "@livekit/agents-plugin-deepgram";
import * as google from "@livekit/agents-plugin-google";
import * as silero from "@livekit/agents-plugin-silero";
import { fileURLToPath } from "node:url";
import { ParticipantKind, type LocalParticipant, type RemoteParticipant } from "@livekit/rtc-node";
import { fetchSessionMeta } from "./lib/sessionMeta.js";
import type { SessionMeta } from "./lib/voiceEvents.js";
import {
  LIVEKIT_RPC_IMAGE_ANALYSIS,
  LIVEKIT_RPC_ASK_BOARD,
  LIVEKIT_RPC_SUBMIT_BOARD_ANSWER,
  LIVEKIT_RPC_WRAP_UP,
} from "./lib/voiceEvents.js";
import { WhiteboardPublisher } from "./agent/tools/whiteboard.js";
import { buildSystemPrompt, isDegradedBootstrap } from "./agent/prompts/systemPrompt.js";
import { createTutorTools } from "./agent/createTools.js";
import { prepareSpokenText } from "./agent/speech/prepareSpokenText.js";
import { spokenTextTransform } from "./agent/speech/speechTtsTransform.js";

const TTS_TEXT_TRANSFORMS = [
  "filter_markdown",
  "filter_emoji",
  spokenTextTransform,
] as const;

interface ProcessUserData extends Record<string, unknown> {
  vad: silero.VAD;
}

const USER_AWAY_TIMEOUT_SEC = 120;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseRoomFromMetadata(metadata: string | undefined): string | null {
  if (!metadata) return null;
  try {
    const parsed = JSON.parse(metadata) as { roomName?: string };
    if (typeof parsed.roomName === "string" && parsed.roomName.trim()) {
      return parsed.roomName.trim();
    }
  } catch {
    /* ignore */
  }
  return null;
}

function roomFromRemoteParticipants(ctx: JobContext): string | null {
  for (const p of ctx.room.remoteParticipants.values()) {
    const fromMeta = parseRoomFromMetadata(p.metadata);
    if (fromMeta) return fromMeta;
  }
  return null;
}

function isAgentLikeParticipant(p: LocalParticipant | RemoteParticipant): boolean {
  if (p.info?.kind === ParticipantKind.AGENT) return true;
  const identity = p.identity.toLowerCase();
  const name = (p.name ?? "").toLowerCase();
  return (
    identity.includes("agent") ||
    identity.startsWith("agent-") ||
    identity.includes("tutor") ||
    name.includes("agent") ||
    name.includes("tutor")
  );
}

function countAgentParticipants(ctx: JobContext): number {
  let count = 0;
  const local = ctx.room.localParticipant;
  if (local && isAgentLikeParticipant(local)) count++;
  for (const p of ctx.room.remoteParticipants.values()) {
    if (isAgentLikeParticipant(p)) count++;
  }
  return count;
}

async function resolveRoomName(ctx: JobContext): Promise<string> {
  const fromJob = ctx.job.room?.name?.trim() ?? "";
  if (fromJob) return fromJob;

  const fromRoom = ctx.room.name?.trim() ?? "";
  if (fromRoom) return fromRoom;

  const fromParticipant = roomFromRemoteParticipants(ctx);
  if (fromParticipant) return fromParticipant;

  return "";
}

/** Poll Firestore (via internal API) until Gemini bootstrap is ready or times out. */
async function waitForBootstrap(roomName: string, initial: SessionMeta | null): Promise<SessionMeta | null> {
  let meta = initial;
  if (!meta) return null;

  const isReady = (m: SessionMeta) =>
    (m.bootstrapStatus === "ready" &&
      ((m.mistakes?.length ?? 0) > 0 ||
        (m.lessonCards?.length ?? 0) > 0 ||
        (m.drills?.length ?? 0) > 0)) ||
    (m.mistakes?.length ?? 0) > 0 ||
    (m.lessonCards?.length ?? 0) > 0;

  if (isReady(meta)) {
    console.log("[voice-agent] bootstrap already ready", {
      room: roomName,
      status: meta.bootstrapStatus,
      mistakes: meta.mistakes?.length ?? 0,
      lessons: meta.lessonCards?.length ?? 0,
    });
    return meta;
  }

  console.log("[voice-agent] bootstrap pending — polling Firestore meta", { room: roomName });
  for (let i = 0; i < 45; i++) {
    await sleep(2000);
    meta = await fetchSessionMeta(roomName);
    if (!meta) break;
    if (isReady(meta)) {
      console.log("[voice-agent] bootstrap ready after poll", {
        room: roomName,
        attempts: i + 1,
        status: meta.bootstrapStatus,
      });
      return meta;
    }
  }

  console.warn("[voice-agent] bootstrap poll timeout — proceeding with failedQuestions only", {
    room: roomName,
  });
  return meta;
}

async function runMissingMetaSession(ctx: JobContext, roomName: string, vad: silero.VAD) {
  const agent = new voice.Agent({
    instructions:
      "You are a voice tutor. The lesson session failed to load. Apologize briefly and ask the student to leave and restart the voice session from the app.",
  });

  const session = new voice.AgentSession({
    vad,
    stt: new deepgram.STT({ apiKey: process.env.DEEPGRAM_API_KEY }),
    tts: new deepgram.TTS({
      apiKey: process.env.DEEPGRAM_API_KEY,
      model: "aura-asteria-en",
    }),
    ttsTextTransforms: TTS_TEXT_TRANSFORMS,
    userAwayTimeout: USER_AWAY_TIMEOUT_SEC,
  });

  await session.start({ agent, room: ctx.room });
  await ctx.waitForParticipant().catch(() => undefined);
  session.generateReply({
    instructions:
      "Apologize in one or two short sentences. Say the tutoring session could not load and they should restart from the app.",
  });
}

function registerAgentRpcHandlers(
  localParticipant: LocalParticipant,
  session: voice.AgentSession,
  wb: WhiteboardPublisher
) {
  localParticipant.registerRpcMethod(LIVEKIT_RPC_WRAP_UP, async () => {
    try {
      await session.interrupt({ force: true });
    } catch {
      /* ignore */
    }
    session.generateReply({
      instructions:
        "Wrap up the lesson briefly, then call end_session with study notes and a 5-item numbered homework assignment.",
    });
    return "ok";
  });

  localParticipant.registerRpcMethod(LIVEKIT_RPC_IMAGE_ANALYSIS, async (data) => {
    try {
      const payload = JSON.parse(data.payload) as { text?: string };
      if (payload.text) {
        try {
          await session.interrupt({ force: true });
        } catch {
          /* ignore */
        }
        session.generateReply({
          instructions: `Speak this image analysis to the student in plain English: ${payload.text}`,
        });
      }
    } catch {
      /* ignore */
    }
    return "ok";
  });

  localParticipant.registerRpcMethod(LIVEKIT_RPC_ASK_BOARD, async (data) => {
    try {
      const payload = JSON.parse(data.payload) as { context?: string };
      const context = payload.context?.trim();
      if (!context) return "ok";
      try {
        await session.interrupt({ force: true });
      } catch {
        /* ignore */
      }
      session.generateReply({
        userInput: `Can you explain this whiteboard item: ${context}`,
        instructions:
          "The student tapped a board item and wants help. Answer in plain spoken English. Do not speak dollar signs, markdown, or raw LaTeX.",
      });
    } catch {
      /* ignore */
    }
    return "ok";
  });

  localParticipant.registerRpcMethod(LIVEKIT_RPC_SUBMIT_BOARD_ANSWER, async (data) => {
    try {
      const payload = JSON.parse(data.payload) as { question?: string; answer?: string };
      const question = payload.question?.trim();
      const answer = payload.answer?.trim();
      if (!question || !answer) return "ok";
      void wb.transcript(`Student (written): ${answer}`);
      try {
        await session.interrupt({ force: true });
      } catch {
        /* ignore */
      }
      session.generateReply({
        userInput: `My answer to the practice question "${question}": ${answer}`,
        instructions:
          "The student submitted a written answer on the whiteboard. Evaluate it gently in plain spoken English: say what is correct, what to fix, and give one short hint if wrong. Then continue teaching.",
      });
    } catch {
      /* ignore */
    }
    return "ok";
  });
}

export default defineAgent<ProcessUserData>({
  prewarm: async (proc) => {
    proc.userData.vad = await silero.VAD.load();
  },
  entry: async (ctx) => {
    let roomName = await resolveRoomName(ctx);
    console.log("[voice-agent] job received", {
      room: roomName,
      jobRoom: ctx.job.room?.name ?? "",
      dispatchId: ctx.job.dispatchId ?? "",
      agentName: ctx.job.agentName ?? "",
    });

    console.log("[voice-agent] connecting to room", { room: roomName || "(pending)" });
    await ctx.connect();

    if (!roomName) {
      roomName = (ctx.room.name?.trim() || (await resolveRoomName(ctx))) ?? "";
    }
    console.log("[voice-agent] connected", { room: roomName, rtcRoom: ctx.room.name ?? "" });

    const agentCount = countAgentParticipants(ctx);
    if (agentCount > 1) {
      console.warn("[voice-agent] duplicate agent job — exiting", {
        room: roomName,
        agentCount,
        dispatchId: ctx.job.dispatchId,
      });
      ctx.shutdown("duplicate agent");
      return;
    }

    if (!roomName) {
      console.error("[voice-agent] abort: could not resolve room name", {
        jobRoom: ctx.job.room?.name ?? "",
        rtcRoom: ctx.room.name ?? "",
        dispatchId: ctx.job.dispatchId,
      });
      await runMissingMetaSession(ctx, "", ctx.proc.userData.vad);
      return;
    }

    let meta = await fetchSessionMeta(roomName);
    console.log("[voice-agent] meta loaded", {
      room: roomName,
      sessionId: meta?.sessionId,
      bootstrapStatus: meta?.bootstrapStatus,
      keys: meta ? Object.keys(meta) : [],
      failedQuestions: meta?.failedQuestions?.length ?? 0,
    });

    if (!meta) {
      console.error("[voice-agent] abort: no session meta from Firestore", {
        room: roomName,
        dispatchId: ctx.job.dispatchId,
      });
      await runMissingMetaSession(ctx, roomName, ctx.proc.userData.vad);
      return;
    }

    meta = await waitForBootstrap(roomName, meta);

    const topicLabel = meta?.subTopicName
      ? `${meta.topicName} — ${meta.subTopicName}`
      : meta?.topicName ?? "your topic";

    const instructions = buildSystemPrompt(meta);
    const wb = new WhiteboardPublisher(ctx.room.localParticipant, meta.sessionId);
    const tools = createTutorTools(wb, { standard: meta.standard });

    const agent = new voice.Agent({
      instructions,
      tools,
      llm: new google.LLM({
        model: "gemini-2.5-flash",
        apiKey: process.env.GEMINI_API_KEY,
        temperature: 0.52,
        maxOutputTokens: 8192,
        thinkingConfig: { thinkingBudget: 0 },
      }),
    });

    const session = new voice.AgentSession({
      vad: ctx.proc.userData.vad,
      stt: new deepgram.STT({ apiKey: process.env.DEEPGRAM_API_KEY }),
      tts: new deepgram.TTS({
        apiKey: process.env.DEEPGRAM_API_KEY,
        model: "aura-asteria-en",
      }),
      ttsTextTransforms: TTS_TEXT_TRANSFORMS,
      maxToolSteps: 40,
      userAwayTimeout: USER_AWAY_TIMEOUT_SEC,
    });

    (session as { on: (ev: string, fn: (e: unknown) => void) => void }).on(
      "conversation_item_added",
      (ev: { item: { role: string; content?: unknown[] } }) => {
        if (ev.item.role !== "assistant") return;
        const content = "content" in ev.item ? ev.item.content : [];
        const parts = (Array.isArray(content) ? content : []).filter(
          (c): c is string => typeof c === "string"
        );
        const text = prepareSpokenText(parts.join(" "));
        if (text) void wb.transcript(text);
      }
    );
    (session as { on: (ev: string, fn: (e: unknown) => void) => void }).on(
      "user_input_transcribed",
      (ev: { transcript: string; isFinal: boolean }) => {
        if (ev.isFinal && ev.transcript.trim()) {
          console.log("[voice-agent] user speech", { room: roomName, len: ev.transcript.length });
          void wb.transcript(`Student: ${ev.transcript.trim()}`);
        }
      }
    );

    await session.start({ agent, room: ctx.room });
    registerAgentRpcHandlers(ctx.room.localParticipant, session, wb);
    console.log("[voice-agent] session started", { room: roomName, sessionId: meta.sessionId });

    try {
      await ctx.waitForParticipant();
      console.log("[voice-agent] student participant joined", { room: roomName });
    } catch (err) {
      console.warn("[voice-agent] no student participant yet — greeting anyway", {
        room: roomName,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    const degraded = isDegradedBootstrap(meta);
    const greeting = degraded
      ? `Greet the student warmly in 2 short sentences. You are helping them with quiz questions they missed on ${topicLabel}. Say you will walk through each missed question and practice briefly. Do not mention a full lesson pack.`
      : `Greet the student warmly. You are helping them with concepts they missed on ${topicLabel}. Say you will review their mistakes, teach the lesson, and practice together before their retake quiz. Keep it to 2-3 short sentences.`;

    session.generateReply({ instructions: greeting });
    console.log("[voice-agent] greeting dispatched", { room: roomName, topicLabel });

    ctx.addShutdownCallback(async () => {
      console.log("[voice-agent] shutdown", { room: roomName });
    });
  },
});

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: process.env.LIVEKIT_AGENT_NAME ?? "vidhyapika-tutor",
    numIdleProcesses: 1,
  })
);
