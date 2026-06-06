import { randomUUID } from "crypto";
import { generateLessonCards, generateMistakePackage, buildVoiceSessionNotes } from "../services/ai";
import { getTopic, getSubTopic, getPrerequisite } from "../repositories/curriculumRepo";
import {
  createAISession,
  countFailedAiRetakes,
  upsertTopicProgress,
  upsertSubTopicProgress,
  getTopicProgress,
  getSubTopicProgress,
  updateAISession,
  getAISession,
  getAISessionByRoomName,
} from "../repositories/progressRepo";
import { createLiveKitToken, ensureLiveKitRoom, getLiveKitConfig } from "./livekit";
import { type SessionMeta } from "../../src/lib/voice/voiceEvents";

export const MAX_AI_COACHING_CYCLES = 3;

export type BootstrapStatus = "pending" | "ready" | "failed";

export type CreateVoiceSessionInput = {
  studentId: string;
  topicId: string;
  subTopicId?: string;
  contextId?: string;
  contextType: "prereq" | "subtopic" | "finaltest";
  failedQuestions: {
    questionId: string;
    text: string;
    studentAnswer?: string;
    correctAnswer?: string;
    aiReasoning?: string;
    type?: string;
  }[];
  /** Skip coaching cap (admin sandbox). */
  skipCoachingCap?: boolean;
  /** Skip incrementing student AI attempt counters until started. */
  skipAttemptCounters?: boolean;
  /** Override topic display name when topicId is synthetic (admin lab). */
  topicNameOverride?: string;
  subTopicNameOverride?: string;
};

type ResolvedContext = {
  topic: { id: string; name: string };
  subTopic: { id: string; name: string } | null;
  resolvedContextId: string | null;
};

async function resolveSessionContext(input: CreateVoiceSessionInput): Promise<ResolvedContext> {
  const { topicId, subTopicId, contextType, contextId: contextIdBody } = input;

  const [topic, subTopic] = await Promise.all([
    getTopic(topicId),
    subTopicId ? getSubTopic(subTopicId) : Promise.resolve(null),
  ]);

  if (!topic && !input.topicNameOverride) throw new Error("Topic not found");

  let resolvedContextId =
    contextIdBody ?? (contextType === "subtopic" && subTopicId ? subTopicId : null) ?? null;
  if (!resolvedContextId && contextType === "prereq") {
    const pr = await getPrerequisite(topicId);
    resolvedContextId = pr?.id ?? null;
  }
  if (!resolvedContextId && contextType === "finaltest") {
    resolvedContextId = topicId;
  }

  return {
    topic: {
      id: topic?.id ?? topicId,
      name: input.topicNameOverride ?? topic?.name ?? "Practice topic",
    },
    subTopic: subTopic
      ? { id: subTopic.id, name: input.subTopicNameOverride ?? subTopic.name }
      : input.subTopicNameOverride
        ? { id: subTopicId ?? "lab", name: input.subTopicNameOverride }
        : null,
    resolvedContextId,
  };
}

function deriveOpeningPhase(
  mistakes: SessionMeta["mistakes"],
  drills: SessionMeta["drills"],
  failedQuestions: SessionMeta["failedQuestions"]
): SessionMeta["openingPhase"] {
  if (mistakes.length > 0) return "mistakes";
  if (drills.length > 0) return "practice";
  if (failedQuestions.length > 0) return "mistakes";
  return "learn";
}

/** Fast path: room + token in ~1–3s; Gemini bootstrap runs in background. */
export async function createVoiceSessionFast(input: CreateVoiceSessionInput) {
  const { studentId, topicId, subTopicId, contextType, failedQuestions, skipCoachingCap } = input;

  const { topic, subTopic, resolvedContextId } = await resolveSessionContext(input);

  if (!skipCoachingCap && resolvedContextId) {
    const failedAi = await countFailedAiRetakes(studentId, contextType, resolvedContextId);
    if (failedAi >= MAX_AI_COACHING_CYCLES) {
      const err = new Error(
        "You have used all AI coaching and retest attempts for this quiz. Please contact your instructor for help."
      ) as Error & { code?: string; failedAiRetakes?: number };
      err.code = "AI_COACHING_CAP";
      err.failedAiRetakes = failedAi;
      throw err;
    }
  }

  const roomName = `tutor-${randomUUID()}`;
  const { url: livekitUrl } = getLiveKitConfig();

  const openingPhase = deriveOpeningPhase([], [], failedQuestions);

  const sessionId = await createAISession({
    studentId,
    topicId,
    contextId: resolvedContextId,
    subTopicId: subTopicId ?? null,
    contextType,
    messages: [],
    lessonCards: [],
    mistakes: [],
    drills: [],
    failedQuestionsSnapshot: failedQuestions,
    status: "active",
    roomName,
    livekitUrl,
    voiceStatus: "active",
    bootstrapStatus: "pending",
    transcript: [],
  });

  await ensureLiveKitRoom(roomName);

  const token = await createLiveKitToken({
    roomName,
    identity: `student-${studentId}`,
    name: "Student",
    metadata: { sessionId, role: "student", roomName },
  });

  return {
    sessionId,
    roomName,
    token,
    livekitUrl,
    bootstrapStatus: "pending" as BootstrapStatus,
    lessonCards: [] as SessionMeta["lessonCards"],
    mistakes: [] as SessionMeta["mistakes"],
    drills: [] as SessionMeta["drills"],
    openingPhase,
    skipAttemptCounters: !!input.skipAttemptCounters,
    contextType,
    topicId,
    subTopicId,
  };
}

/** Build agent-facing session meta from Firestore (replaces Redis meta key). */
export async function buildSessionMetaForRoom(roomName: string): Promise<SessionMeta | null> {
  const session = await getAISessionByRoomName(roomName);
  if (!session) return null;

  const topic = await getTopic(session.topicId);
  const subTopic = session.subTopicId ? await getSubTopic(session.subTopicId) : null;
  const failedQuestions = session.failedQuestionsSnapshot ?? [];
  const mistakes = session.mistakes ?? [];
  const drills = session.drills ?? [];
  const lessonCards = session.lessonCards ?? [];

  return {
    sessionId: session.id,
    studentId: session.studentId,
    topicId: session.topicId,
    topicName: topic?.name ?? "Topic",
    subTopicName: subTopic?.name,
    contextType: session.contextType,
    contextId: session.contextId,
    standard: "Grade 8",
    failedQuestions,
    lessonCards,
    mistakes,
    drills,
    openingPhase: deriveOpeningPhase(mistakes, drills, failedQuestions),
    bootstrapStatus: session.bootstrapStatus ?? "pending",
  };
}

/** Background Gemini bootstrap — updates Firestore when ready. */
export async function bootstrapVoiceSession(sessionId: string, roomName: string) {
  const session = await getAISession(sessionId);
  if (!session) {
    console.error("[voice] bootstrap: session not found", sessionId);
    return;
  }

  const topic = await getTopic(session.topicId);
  const subTopic = session.subTopicId ? await getSubTopic(session.subTopicId) : null;
  const failedQuestions = session.failedQuestionsSnapshot ?? [];

  try {
    const [lessonCards, mistakePackage] = await Promise.all([
      generateLessonCards({
        topicName: topic?.name ?? "Topic",
        subTopicName: subTopic?.name,
        failedQuestions,
        contextType: session.contextType,
      }),
      generateMistakePackage({
        topicName: topic?.name ?? "Topic",
        subTopicName: subTopic?.name,
        failedQuestions,
        contextType: session.contextType,
      }),
    ]);

    const openingPhase = deriveOpeningPhase(
      mistakePackage.mistakes,
      mistakePackage.drills,
      failedQuestions
    );

    await updateAISession(sessionId, {
      lessonCards,
      mistakes: mistakePackage.mistakes,
      drills: mistakePackage.drills,
      bootstrapStatus: "ready",
    });

    console.log("[voice] bootstrap ready", { sessionId, roomName, openingPhase });
  } catch (e) {
    console.error("[voice] bootstrap failed", sessionId, e);
    await updateAISession(sessionId, { bootstrapStatus: "failed" });
  }
}

/** Increment AI attempt counters when LiveKit connect succeeds (student flow only). */
export async function recordVoiceSessionStarted(sessionId: string) {
  const session = await getAISession(sessionId);
  if (!session || session.attemptRecorded) return;

  const { studentId, topicId, contextType, subTopicId } = session;

  if (contextType === "prereq") {
    const existing = await getTopicProgress(studentId, topicId);
    await upsertTopicProgress(studentId, topicId, {
      prereqAIAttemptCount: (existing?.prereqAIAttemptCount ?? 0) + 1,
    });
  } else if (contextType === "subtopic" && subTopicId) {
    const existing = await getSubTopicProgress(studentId, subTopicId);
    await upsertSubTopicProgress(studentId, subTopicId, topicId, {
      quizAIAttemptCount: (existing?.quizAIAttemptCount ?? 0) + 1,
    });
  } else if (contextType === "finaltest") {
    const existing = await getTopicProgress(studentId, topicId);
    await upsertTopicProgress(studentId, topicId, {
      finalTestAIAttemptCount: (existing?.finalTestAIAttemptCount ?? 0) + 1,
    });
  }

  await updateAISession(sessionId, { attemptRecorded: true });
}

/** @deprecated Use createVoiceSessionFast + bootstrapVoiceSession */
export async function createVoiceSession(input: CreateVoiceSessionInput) {
  const fast = await createVoiceSessionFast(input);
  await bootstrapVoiceSession(fast.sessionId, fast.roomName);
  const session = await getAISession(fast.sessionId);
  if (!input.skipAttemptCounters) {
    await recordVoiceSessionStarted(fast.sessionId);
  }
  return {
    ...fast,
    bootstrapStatus: (session?.bootstrapStatus ?? "ready") as BootstrapStatus,
    lessonCards: session?.lessonCards ?? [],
    mistakes: session?.mistakes ?? [],
    drills: session?.drills ?? [],
    openingPhase: deriveOpeningPhase(
      session?.mistakes ?? [],
      session?.drills ?? [],
      input.failedQuestions
    ),
  };
}

export async function completeVoiceSession(
  sessionId: string,
  payload: {
    notes: string;
    assignment: string;
    transcript?: { role: string; text: string; ts: number }[];
    whiteboardLog?: Record<string, unknown>[];
  }
) {
  const session = await getAISession(sessionId);
  if (!session) return;

  const topic = await getTopic(session.topicId);
  const subTopic = session.subTopicId ? await getSubTopic(session.subTopicId) : null;
  const incomingBoard = payload.whiteboardLog ?? [];
  const existingBoard = (session.whiteboardLog as Record<string, unknown>[] | undefined) ?? [];
  const whiteboardLog =
    incomingBoard.length >= existingBoard.length ? incomingBoard : existingBoard;

  const incomingTranscript = payload.transcript ?? [];
  const existingTranscript = session.transcript ?? [];
  const transcript =
    incomingTranscript.length >= existingTranscript.length ? incomingTranscript : existingTranscript;

  const notesInput =
    payload.notes.trim().length >= (session.notes ?? "").trim().length
      ? payload.notes
      : session.notes ?? payload.notes;

  const finalNotes = await buildVoiceSessionNotes(
    session,
    notesInput,
    whiteboardLog,
    transcript,
    topic?.name ?? "Topic",
    subTopic?.name
  );

  await updateAISession(sessionId, {
    notes: finalNotes,
    assignment: payload.assignment.trim() ? payload.assignment : session.assignment ?? "",
    voiceStatus: "ended",
    status: "completed",
    transcript,
    whiteboardLog,
  });
}

export async function getVoiceSessionStatus(sessionId: string) {
  const session = await getAISession(sessionId);
  if (!session) return null;
  return {
    voiceStatus: session.voiceStatus ?? "active",
    bootstrapStatus: (session.bootstrapStatus ?? "pending") as BootstrapStatus,
    roomName: session.roomName ?? null,
    mistakesCount: session.mistakes?.length ?? 0,
    lessonCount: session.lessonCards?.length ?? 0,
    drillCount: session.drills?.length ?? 0,
    attemptRecorded: !!(session as { attemptRecorded?: boolean }).attemptRecorded,
    whiteboardLog: (session.whiteboardLog as Record<string, unknown>[] | undefined) ?? [],
  };
}
