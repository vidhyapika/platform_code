import React, { useCallback, useRef, useState, useMemo } from "react";
import { Loader2, PhoneOff, RotateCcw, Sparkles } from "lucide-react";
import { apiFetch } from "../../hooks/useApi";
import { InlineQuiz, type QuizSubmitGradingResult } from "../InlineQuiz";
import { MarkdownLesson } from "../MarkdownLesson";
import type { Question } from "../../types";
import type { CognitiveState, WhiteboardPayload } from "../../lib/voice/voiceEvents";
import { VoiceLiveKitSessionBridge, type VoiceLiveKitSessionBridgeHandle } from "./classroom/VoiceLiveKitSessionBridge";
import { VoiceWhiteboardArea } from "./classroom/VoiceWhiteboardArea";
import type { WhiteboardHandle } from "./classroom/Whiteboard";
import {
  ClassroomConceptRail,
  ClassroomTranscriptRail,
  ClassroomMobileAux,
} from "./classroom/ClassroomSessionRail";
import { TutorStatusPill } from "./classroom/TutorStatusPill";
import { useKnowledgeGraph } from "./classroom/KnowledgeGraph";
import { CognitiveBadge } from "./classroom/CognitiveBadge";
import { LiveKitVoiceRoom } from "./classroom/LiveKitVoiceRoom";
import { VoiceControlBar } from "./classroom/VoiceControlBar";
import { type LoadingStep } from "./classroom/VoiceConnectionStatus";
import { VoiceLiveKitTracker } from "./classroom/VoiceLiveKitTracker";
import {
  clearVoiceSessionStart,
  markVoiceSessionStart,
} from "../../lib/voice/voiceSessionStartGuard";
import "../voice/styles/wb-artifacts.css";
import "../voice/styles/classroom.css";

export type VoiceClassroomPanelProps = {
  topicId?: string;
  topicTitle: string;
  subTopicId?: string;
  subtopicTitle?: string;
  kind: "prereq" | "subtopic" | "finaltest" | "prerequisite" | "final-test";
  contextId?: string;
  failedQuestions?: {
    questionId: string;
    text: string;
    type?: string;
    studentAnswer?: string;
    correctAnswer?: string;
    aiReasoning?: string;
  }[];
  passingThreshold?: number;
  onPassed: () => void;
  onBack?: () => void;
  onRetakeRecorded?: () => void;
  mode?: "default" | "sandbox";
  /** `coach`: landing then voice; `retake`: open AI retake quiz directly. */
  entryIntent?: "coach" | "retake";
  /** When set (sandbox), skips auto POST create on mount. */
  sandboxSession?: {
    sessionId: string;
    roomName: string;
    token: string;
    livekitUrl: string;
    bootstrapStatus?: "pending" | "ready" | "failed";
  } | null;
};

type PanelState = "landing" | "loading" | "classroom" | "ended" | "quiz" | "passed" | "error";

export function VoiceClassroomPanel({
  topicId = "",
  topicTitle,
  subTopicId,
  subtopicTitle,
  kind,
  contextId = "",
  failedQuestions = [],
  passingThreshold = 60,
  onPassed,
  onBack,
  onRetakeRecorded,
  mode = "default",
  entryIntent = "coach",
  sandboxSession = null,
}: VoiceClassroomPanelProps) {
  const isSandbox = mode === "sandbox";
  const normalizedKind = (
    kind === "prerequisite" ? "prereq" : kind === "final-test" ? "finaltest" : kind
  ) as "prereq" | "subtopic" | "finaltest";

  const [panelState, setPanelState] = useState<PanelState>(() => {
    if (sandboxSession) return "classroom";
    if (entryIntent === "retake") return "loading";
    return "landing";
  });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [assignment, setAssignment] = useState("");
  const [transcriptLines, setTranscriptLines] = useState<
    { role: string; text: string; ts: number }[]
  >([]);
  const [cognitive, setCognitive] = useState<{ state: CognitiveState; reason?: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [retakeQuestions, setRetakeQuestions] = useState<Question[]>([]);
  const [generatingTest, setGeneratingTest] = useState(false);
  const [loadingStep, setLoadingStep] = useState<LoadingStep>("api");
  const [bootstrapStatus, setBootstrapStatus] = useState<"pending" | "ready" | "failed">("pending");
  const [tutorDataConnected, setTutorDataConnected] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [lastWhiteboardType, setLastWhiteboardType] = useState<string | null>(null);
  const [retryingBootstrap, setRetryingBootstrap] = useState(false);
  const [hydratedBoardLog, setHydratedBoardLog] = useState<Record<string, unknown>[] | null>(null);

  const [analysisFailures, setAnalysisFailures] = useState(() => [...failedQuestions]);
  const whiteboardHandlerRef = useRef<((p: WhiteboardPayload) => void) | null>(null);
  const whiteboardRef = useRef<WhiteboardHandle>(null);
  const transcriptLogRef = useRef<{ role: string; text: string; ts: number }[]>([]);
  const whiteboardLogRef = useRef<Record<string, unknown>[]>([]);
  const knowledgeGraph = useKnowledgeGraph();
  const lastRetakeSubmitRef = useRef<{
    passed: boolean;
    flagged?: boolean;
    failedQuestions?: VoiceClassroomPanelProps["failedQuestions"];
  } | null>(null);
  const sessionStartRequestedRef = useRef(false);
  const retakeBootstrappedRef = useRef(false);
  const liveKitBridgeRef = useRef<VoiceLiveKitSessionBridgeHandle | null>(null);

  const guardContextKey = useMemo(
    () => ({ topicId, contextId, normalizedKind }),
    [topicId, contextId, normalizedKind]
  );

  const clearSessionStartGuard = useCallback(() => {
    const { topicId: tid, contextId: cid, normalizedKind: kind } = guardContextKey;
    if (tid && cid) clearVoiceSessionStart(tid, cid, kind);
  }, [guardContextKey]);

  const routeWhiteboard = useCallback((payload: WhiteboardPayload) => {
    const type = String(payload.type);
    setLastWhiteboardType(type);
    if (type.startsWith("graph:")) {
      if (type === "graph:pulse" && payload.id) {
        whiteboardRef.current?.scrollToConcept(String(payload.id));
      }
      knowledgeGraph.handleEvent(payload);
      return;
    }
    if (type !== "cognitive_state" && type !== "clear") {
      whiteboardLogRef.current.push({ ...payload, type, ts: Date.now() });
      if (whiteboardLogRef.current.length > 200) {
        whiteboardLogRef.current = whiteboardLogRef.current.slice(-200);
      }
    }
    whiteboardHandlerRef.current?.(payload);
  }, [knowledgeGraph.handleEvent]);

  const applySession = useCallback(
    (data: {
      sessionId: string;
      roomName: string;
      token: string;
      livekitUrl: string;
      bootstrapStatus?: "pending" | "ready" | "failed";
    }) => {
      setSessionId(data.sessionId);
      setRoomName(data.roomName);
      setToken(data.token);
      setLivekitUrl(data.livekitUrl);
      setBootstrapStatus(data.bootstrapStatus ?? "pending");
      setTranscriptLines([]);
      transcriptLogRef.current = [];
      setNotes("");
      setAssignment("");
      setTutorDataConnected(false);
      setLoadingStep("livekit");
      setPanelState("classroom");
    },
    []
  );

  const retryBootstrap = useCallback(async () => {
    if (!sessionId) return;
    setRetryingBootstrap(true);
    setBootstrapStatus("pending");
    await apiFetch(`/api/voice/session/${sessionId}/retry-bootstrap`, { method: "POST" });
    setRetryingBootstrap(false);
  }, [sessionId]);

  const startVoiceSession = useCallback(
    async (failureOverride?: VoiceClassroomPanelProps["failedQuestions"]) => {
      setPanelState("loading");
      setLoadingStep("api");
      const fq = failureOverride ?? analysisFailures;
      if (!isSandbox && fq.length === 0) {
        setErrorMsg("No missed questions to review. Complete the quiz first.");
        setPanelState("error");
        return;
      }
      const endpoint = isSandbox
        ? "/api/admin/voice/sandbox/create"
        : "/api/voice/session/create";
      const res = await apiFetch<{
        sessionId: string;
        roomName: string;
        token: string;
        livekitUrl: string;
        bootstrapStatus?: "pending" | "ready" | "failed";
      }>(endpoint, {
        method: "POST",
        body: JSON.stringify(
          isSandbox
            ? {
                topicTitle,
                subTopicTitle: subtopicTitle,
                contextType: normalizedKind,
                failedQuestions: fq,
              }
            : {
                topicId,
                subTopicId,
                contextType: normalizedKind,
                failedQuestions: fq,
                ...(contextId ? { contextId } : {}),
              }
        ),
      });

      if (res.error || !res.data) {
        if (!isSandbox && topicId && contextId) {
          clearVoiceSessionStart(topicId, contextId, normalizedKind);
        }
        setErrorMsg(res.error ?? "Failed to start voice session");
        setPanelState("error");
        return;
      }

      setAnalysisFailures([...fq]);
      applySession(res.data);
      if (!isSandbox && topicId && contextId) {
        markVoiceSessionStart(topicId, contextId, normalizedKind);
      }
    },
    [
      analysisFailures,
      applySession,
      contextId,
      isSandbox,
      normalizedKind,
      subTopicId,
      subtopicTitle,
      topicId,
      topicTitle,
    ]
  );

  const onLiveKitConnected = useCallback(async () => {
    if (!sessionId || isSandbox) return;
    await apiFetch(`/api/voice/session/${sessionId}/started`, { method: "POST" });
  }, [sessionId, isSandbox]);

  const generateRetakeTest = useCallback(async () => {
    setGeneratingTest(true);
    setPanelState("loading");
    const res = await apiFetch<{ questions: Question[] }>("/api/ai/generate-test", {
      method: "POST",
      body: JSON.stringify({
        topicId,
        subTopicId,
        contextType: normalizedKind,
        contextId,
        failedQuestions: analysisFailures,
        count: 5,
      }),
    });
    setGeneratingTest(false);
    if (res.error) {
      setErrorMsg(res.error);
      setPanelState("error");
      return;
    }
    if (res.data?.questions?.length) {
      const questions: Question[] = res.data.questions.map((q: Question & { type?: string }) => ({
        id: q.id,
        text: q.text,
        type:
          (q.type as string) === "true_false"
            ? "boolean"
            : q.type === "image_upload"
              ? "image_upload"
              : q.type === "text"
                ? "text"
                : "mcq",
        options: q.options,
        correctAnswer: (q as Question).correctAnswer ?? "",
        explanation: "",
        difficulty: "Medium" as const,
      }));
      setRetakeQuestions(questions);
      setPanelState("quiz");
    } else {
      setErrorMsg("Could not generate retake questions.");
      setPanelState("error");
    }
  }, [analysisFailures, contextId, normalizedKind, subTopicId, topicId]);

  const handleRetryStart = useCallback(() => {
    clearSessionStartGuard();
    sessionStartRequestedRef.current = false;
    if (entryIntent === "retake") {
      retakeBootstrappedRef.current = false;
      void generateRetakeTest();
      return;
    }
    void startVoiceSession();
  }, [clearSessionStartGuard, entryIntent, generateRetakeTest, startVoiceSession]);

  React.useEffect(() => {
    if (sandboxSession) {
      applySession(sandboxSession);
      return;
    }
    if (entryIntent === "retake") {
      if (retakeBootstrappedRef.current) return;
      retakeBootstrappedRef.current = true;
      void generateRetakeTest();
      return;
    }
    // Student coach flow: stay on landing until they click Start voice session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sandboxSession, entryIntent]);

  React.useEffect(() => {
    if (panelState !== "loading") return;
    const timeoutId = window.setTimeout(() => {
      clearSessionStartGuard();
      setErrorMsg(
        "Voice session is taking longer than expected. Check that the voice agent is running (cd voice-agent && npm run dev), then try again."
      );
      setPanelState("error");
    }, 60_000);
    return () => window.clearTimeout(timeoutId);
  }, [panelState, clearSessionStartGuard]);

  React.useEffect(() => {
    if (!sessionId || panelState !== "classroom") return;
    void apiFetch<{ whiteboardLog?: Record<string, unknown>[] }>(
      `/api/voice/session/${sessionId}/status`
    ).then((res) => {
      const log = res.data?.whiteboardLog;
      if (log?.length) {
        whiteboardLogRef.current = log;
        setHydratedBoardLog(log);
      }
    });
  }, [sessionId, panelState]);

  React.useEffect(() => {
    if (!sessionId || bootstrapStatus === "ready" || bootstrapStatus === "failed") return;
    const id = window.setInterval(async () => {
      const res = await apiFetch<{
        bootstrapStatus: "pending" | "ready" | "failed";
      }>(`/api/voice/session/${sessionId}/status`);
      if (res.data?.bootstrapStatus) {
        setBootstrapStatus(res.data.bootstrapStatus);
      }
    }, 3000);
    return () => window.clearInterval(id);
  }, [sessionId, bootstrapStatus]);

  const onSessionEnded = useCallback(
    (n: string, a: string) => {
      setNotes(n);
      setAssignment(a);
      setPanelState("ended");
      if (sessionId) {
        void apiFetch(`/api/voice/session/${sessionId}/complete`, {
          method: "POST",
          body: JSON.stringify({
            notes: n,
            assignment: a,
            transcript: transcriptLogRef.current,
            whiteboardLog: whiteboardLogRef.current,
          }),
        });
      }
    },
    [sessionId]
  );

  const handleTranscript = useCallback((text: string) => {
    const raw = text.trim();
    if (raw) {
      const isStudent = raw.startsWith("Student:") || raw.startsWith("Student (written):");
      const studentText = raw.startsWith("Student (written):")
        ? raw.slice("Student (written):".length).trim()
        : raw.startsWith("Student:")
          ? raw.slice("Student:".length).trim()
          : raw;
      const line = isStudent
        ? { role: "student", text: studentText, ts: Date.now() }
        : { role: "tutor", text: raw, ts: Date.now() };
      transcriptLogRef.current.push(line);
      if (transcriptLogRef.current.length > 500) {
        transcriptLogRef.current = transcriptLogRef.current.slice(-500);
      }
      setTranscriptLines((prev) => [...prev.slice(-80), line]);
    }
  }, []);

  const liveKitBridgeEnabled = panelState !== "quiz" && panelState === "classroom";

  const handleQuizComplete = async (
    clientScore: number,
    clientTotal: number,
    answers?: Record<string, string>
  ): Promise<QuizSubmitGradingResult | null | void> => {
    if (!topicId || !contextId || !answers || Object.keys(answers).length === 0) {
      const pct = clientTotal > 0 ? (clientScore / clientTotal) * 100 : 0;
      lastRetakeSubmitRef.current = { passed: pct >= passingThreshold };
      return null;
    }

    const res = await apiFetch<{
      evaluationIncomplete?: boolean;
      score: number;
      total: number;
      passed: boolean;
      flagged?: boolean;
      failedQuestions?: VoiceClassroomPanelProps["failedQuestions"];
      scoredAnswers?: Array<{
        questionId: string;
        correct: boolean;
        aiReasoning?: string;
        evaluationFailed?: boolean;
      }>;
    }>("/api/student/quiz/submit", {
      method: "POST",
      body: JSON.stringify({
        contextType: normalizedKind,
        contextId,
        topicId,
        answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
        ...(normalizedKind === "subtopic" ? { subTopicId: subTopicId ?? contextId } : {}),
      }),
    });

    if (res.error) {
      setErrorMsg(res.error);
      return null;
    }
    const data = res.data;
    if (!data) return null;

    const perQuestion: QuizSubmitGradingResult["perQuestion"] = {};
    for (const row of data.scoredAnswers ?? []) {
      perQuestion[row.questionId] = {
        correct: row.correct,
        aiReasoning: row.aiReasoning,
        evaluationFailed: row.evaluationFailed,
      };
    }

    if (data.evaluationIncomplete) {
      return { score: data.score, total: data.total, perQuestion, evaluationIncomplete: true };
    }

    lastRetakeSubmitRef.current = {
      passed: data.passed,
      flagged: !!data.flagged,
      failedQuestions: data.failedQuestions,
    };
    onRetakeRecorded?.();

    return {
      score: data.score,
      total: data.total,
      perQuestion,
      evaluationIncomplete: false,
      serverPassed: data.passed,
      flagged: !!data.flagged,
    };
  };

  const handleQuizFullyReviewed = () => {
    const r = lastRetakeSubmitRef.current;
    if (r?.flagged) {
      setErrorMsg(
        "You have used all AI coaching and retest attempts for this quiz. An instructor has been notified."
      );
      setPanelState("error");
      return;
    }
    if (r?.passed) {
      setPanelState("passed");
      return;
    }
    onBack?.();
  };

  const endSession = async () => {
    if (!sessionId) return;
    await apiFetch(`/api/voice/session/${sessionId}/end`, { method: "POST" });
    await liveKitBridgeRef.current?.requestWrapUp();
  };

  const subjectLine = useMemo(() => {
    if (normalizedKind === "prereq") return `Prerequisite: ${topicTitle}`;
    if (normalizedKind === "subtopic") return subtopicTitle ?? topicTitle;
    return `Final test review: ${topicTitle}`;
  }, [normalizedKind, subtopicTitle, topicTitle]);

  if (panelState === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8">
        <Loader2 className="w-10 h-10 animate-spin text-[#0084B4]" />
        <p className="text-slate-600 font-medium">
          {entryIntent === "retake" || generatingTest ? "Preparing AI retake quiz…" : "Starting voice tutor…"}
        </p>
        <p className="text-sm text-slate-400">
          {entryIntent === "retake" || generatingTest
            ? "Generating questions from your missed topics…"
            : loadingStep === "api"
              ? "Preparing session (connecting in a few seconds)…"
              : "Connecting to voice room…"}
        </p>
      </div>
    );
  }

  if (panelState === "landing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 p-8 max-w-lg mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">AI tutor ready</h2>
          <p className="text-slate-600 leading-relaxed">
            Your tutor will review the questions you missed on <span className="font-semibold">{subjectLine}</span>.
            Start when you&apos;re ready — you can leave and come back anytime.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => void startVoiceSession()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"
          >
            <Sparkles className="w-4 h-4" />
            Start voice session
          </button>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50"
            >
              Back to quiz
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (panelState === "error") {
    return (
      <div className="p-8 max-w-lg mx-auto text-center">
        <p className="text-rose-600 font-bold mb-4">{errorMsg}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleRetryStart}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0084B4] text-white font-bold"
          >
            <RotateCcw className="w-4 h-4" />
            Retry
          </button>
          {onBack && (
            <button type="button" onClick={onBack} className="text-[#0084B4] font-bold">
              Go back
            </button>
          )}
        </div>
      </div>
    );
  }

  if (panelState === "passed") {
    return (
      <div className="p-8 text-center">
        <Sparkles className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-xl font-extrabold text-slate-900 mb-2">Great work!</h2>
        <p className="text-slate-600 mb-6">You passed the retake quiz.</p>
        <button
          type="button"
          onClick={onPassed}
          className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold"
        >
          Continue
        </button>
      </div>
    );
  }

  if (panelState === "quiz") {
    return (
      <InlineQuiz
        questions={retakeQuestions}
        title="AI Retake Quiz"
        passingThresholdPercent={passingThreshold}
        onSubmit={handleQuizComplete}
        onQuizFullyReviewed={handleQuizFullyReviewed}
      />
    );
  }

  if (panelState === "ended") {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full">
          <h2 className="text-lg font-extrabold text-slate-900 mb-4">Session complete</h2>
          {notes ? (
            <section className="mb-6">
              <h3 className="text-sm font-bold text-[#0084B4] uppercase mb-2">Notes</h3>
              <MarkdownLesson content={notes} />
            </section>
          ) : null}
          {assignment ? (
            <section className="mb-6">
              <h3 className="text-sm font-bold text-[#0084B4] uppercase mb-2">Assignment</h3>
              <MarkdownLesson content={assignment} />
            </section>
          ) : null}
        </div>
        <div className="shrink-0 p-4 border-t border-slate-200 flex flex-wrap gap-3 justify-center">
          {!isSandbox ? (
            <button
              type="button"
              disabled={generatingTest}
              onClick={() => void generateRetakeTest()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0084B4] text-white font-bold disabled:opacity-50"
            >
              {generatingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              Start retake quiz
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void startVoiceSession()}
            className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700"
          >
            New voice session
          </button>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50"
            >
              Back to quiz
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  const sandboxDebugProps =
    isSandbox
      ? {
          loadingStep,
          bootstrapStatus,
          sessionId,
          roomName,
          tutorDataConnected,
          lastWhiteboardType,
        }
      : undefined;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-slate-100">
      <header className="vc-header shrink-0 px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-3">
          <div className="hidden sm:flex w-9 h-9 rounded-xl bg-[#0084B4]/10 items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-[#0084B4]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <TutorStatusPill loadingStep={loadingStep} tutorDataConnected={tutorDataConnected} />
            </div>
            <p className="text-sm font-extrabold text-slate-900 truncate">{subjectLine}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CognitiveBadge state={cognitive?.state ?? null} reason={cognitive?.reason} />
          <button
            type="button"
            onClick={() => void endSession()}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors"
          >
            <PhoneOff className="w-3.5 h-3.5" /> End
          </button>
        </div>
      </header>

      {bootstrapStatus === "pending" ? (
        <div className="shrink-0 px-4 py-2 bg-blue-50 border-b border-blue-100 text-xs font-medium text-blue-900">
          Preparing your personalized lesson content… You can speak while we finish loading.
        </div>
      ) : null}
      {bootstrapStatus === "failed" ? (
        <div className="shrink-0 px-4 py-2 bg-amber-50 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-amber-900">
            Lesson content could not be generated. Your tutor will use your quiz answers only.
          </p>
          <button
            type="button"
            disabled={retryingBootstrap}
            onClick={() => void retryBootstrap()}
            className="text-xs font-bold text-amber-800 underline disabled:opacity-50"
          >
            {retryingBootstrap ? "Retrying…" : "Retry"}
          </button>
        </div>
      ) : null}

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col vc-stage">
        {token && livekitUrl ? (
          <LiveKitVoiceRoom
            token={token}
            serverUrl={livekitUrl}
            roomName={roomName}
          >
            <VoiceLiveKitTracker
              sessionId={sessionId}
              mode={mode}
              onLoadingStep={setLoadingStep}
              onLiveKitConnected={onLiveKitConnected}
            />
            <VoiceLiveKitSessionBridge
              ref={liveKitBridgeRef}
              enabled={liveKitBridgeEnabled}
              onWhiteboard={routeWhiteboard}
              onCognitive={(state, reason) => setCognitive({ state, reason })}
              onTranscript={handleTranscript}
              onSessionEnded={onSessionEnded}
              onDataConnected={() => setTutorDataConnected(true)}
            />
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <div className="vc-stage flex-1 min-h-0 overflow-hidden flex">
                <aside className="hidden lg:flex w-[14rem] xl:w-[16rem] shrink-0 flex-col min-h-0 overflow-hidden">
                  <ClassroomConceptRail
                    nodes={knowledgeGraph.nodes}
                    edges={knowledgeGraph.edges}
                    pulseId={knowledgeGraph.pulseId}
                    zoomedOut={knowledgeGraph.zoomedOut}
                    onNodeClick={(id) => whiteboardRef.current?.scrollToConcept(id)}
                    showDebug={isSandbox && showDebug}
                    debugProps={sandboxDebugProps}
                  />
                </aside>
                <main className="flex-1 min-w-0 min-h-0 overflow-hidden flex flex-col">
                  <VoiceWhiteboardArea
                    whiteboardRef={whiteboardRef}
                    sessionId={sessionId ?? undefined}
                    initialLog={hydratedBoardLog ?? undefined}
                    onMount={(h) => {
                      whiteboardHandlerRef.current = h;
                    }}
                  />
                </main>
                <aside className="hidden lg:flex w-[14rem] xl:w-[16rem] shrink-0 flex-col min-h-0 overflow-hidden">
                  <ClassroomTranscriptRail transcriptLines={transcriptLines} />
                </aside>
              </div>
              <div className="lg:hidden shrink-0 vc-mobile-aux flex flex-col min-h-0">
                {isSandbox ? (
                  <div className="px-3 py-1 border-b border-slate-100 flex justify-end shrink-0 bg-white">
                    <button
                      type="button"
                      className="text-[10px] font-bold text-slate-500"
                      onClick={() => setShowDebug((v) => !v)}
                    >
                      {showDebug ? "Hide debug" : "Debug"}
                    </button>
                  </div>
                ) : null}
                <ClassroomMobileAux
                  nodes={knowledgeGraph.nodes}
                  edges={knowledgeGraph.edges}
                  pulseId={knowledgeGraph.pulseId}
                  zoomedOut={knowledgeGraph.zoomedOut}
                  transcriptLines={transcriptLines}
                  onNodeClick={(id) => whiteboardRef.current?.scrollToConcept(id)}
                  showDebug={isSandbox && showDebug}
                  debugProps={sandboxDebugProps}
                />
              </div>
              <VoiceControlBar />
            </div>
          </LiveKitVoiceRoom>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-sm text-slate-500">
            Connecting voice session…
          </div>
        )}
      </div>
    </div>
  );
}
