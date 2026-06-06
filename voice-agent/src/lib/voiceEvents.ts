/** LiveKit voice tutor event contracts (shared with Next.js app). */

export type CognitiveState = "FLOW" | "CONFUSED" | "BORED" | "LOST";

export type WhiteboardPayload = {
  type: string;
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
  [key: string]: unknown;
};

export type SessionMeta = {
  sessionId: string;
  studentId: string;
  topicId: string;
  topicName: string;
  subTopicName?: string;
  contextType: string;
  contextId?: string | null;
  standard?: string;
  failedQuestions: unknown[];
  lessonCards: { title: string; content: string; latex?: string }[];
  mistakes: {
    questionId: string;
    mistakeTitle: string;
    whatWentWrong: string;
    likelyMisconception: string;
    fix: string;
    example: string;
  }[];
  drills: { prompt: string; hint: string; checkYourself: string; solution: string }[];
  openingPhase: "mistakes" | "practice" | "learn";
  bootstrapStatus?: "pending" | "ready" | "failed";
};

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

export const LIVEKIT_DATA_MAX_BYTES = 60_000;

export function encodeTutorEnvelope(envelope: TutorDataEnvelope): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(envelope));
}
