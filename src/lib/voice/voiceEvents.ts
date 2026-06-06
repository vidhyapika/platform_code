/** LiveKit voice tutor event contracts (whiteboard, transcript, session meta). */

export type CognitiveState = "FLOW" | "CONFUSED" | "BORED" | "LOST";

export type WhiteboardEventType =
  | "title"
  | "highlight"
  | "formula"
  | "write"
  | "step"
  | "question"
  | "code"
  | "rich_card"
  | "diagram_loading"
  | "diagram_ready"
  | "scene_loading"
  | "scene_ready"
  | "clear"
  | "cognitive_state"
  | `graph:${string}`;

export type WhiteboardPayload = {
  type: WhiteboardEventType | string;
  content?: string;
  title?: string;
  html?: string;
  language?: string;
  number?: number;
  caption?: string;
  data_uri?: string;
  error?: string;
  state?: CognitiveState;
  reason?: string;
  id?: string;
  label?: string;
  position?: string;
  from?: string;
  to?: string;
  student_teaser?: string;
  student_bridge?: string;
  [key: string]: unknown;
};

export type SessionMeta = {
  sessionId: string;
  studentId: string;
  topicId: string;
  topicName: string;
  subTopicName?: string;
  contextType: "prereq" | "subtopic" | "finaltest";
  contextId?: string | null;
  standard?: string;
  failedQuestions: {
    questionId: string;
    text: string;
    type?: string;
    studentAnswer?: string;
    correctAnswer?: string;
    aiReasoning?: string;
  }[];
  lessonCards: { title: string; content: string; latex?: string }[];
  mistakes: {
    questionId: string;
    mistakeTitle: string;
    whatWentWrong: string;
    likelyMisconception: string;
    fix: string;
    example: string;
  }[];
  drills: {
    prompt: string;
    hint: string;
    checkYourself: string;
    solution: string;
  }[];
  openingPhase: "mistakes" | "practice" | "learn";
  bootstrapStatus?: "pending" | "ready" | "failed";
};

export type SessionEndPayload = {
  type: "end";
  notes: string;
  assignment: string;
};

/** LiveKit data topic for tutor → student events. */
export const LIVEKIT_TUTOR_TOPIC = "vidhyapika/tutor";

export type TutorEventKind = "whiteboard" | "transcript" | "session_end" | "chunk";

export type TutorDataEnvelope =
  | { kind: "whiteboard"; payload: WhiteboardPayload }
  | { kind: "transcript"; payload: { text: string } }
  | { kind: "session_end"; payload: { notes: string; assignment: string } }
  | {
      kind: "chunk";
      payload: {
        chunkId: string;
        index: number;
        total: number;
        data: string;
      };
    };

export const LIVEKIT_RPC_WRAP_UP = "request_wrap_up";
export const LIVEKIT_RPC_IMAGE_ANALYSIS = "inject_image_analysis";
export const LIVEKIT_RPC_ASK_BOARD = "ask_about_board";
export const LIVEKIT_RPC_SUBMIT_BOARD_ANSWER = "submit_board_answer";

/** Max bytes per LiveKit data packet (WebRTC limit ~65KB; use margin). */
export const LIVEKIT_DATA_MAX_BYTES = 60_000;

export function encodeTutorEnvelope(envelope: TutorDataEnvelope): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(envelope));
}

export function parseTutorEnvelope(raw: Uint8Array | string): TutorDataEnvelope | null {
  try {
    const text = typeof raw === "string" ? raw : new TextDecoder().decode(raw);
    const parsed = JSON.parse(text) as TutorDataEnvelope;
    if (parsed && typeof parsed.kind === "string" && parsed.payload) return parsed;
    return null;
  } catch {
    return null;
  }
}
