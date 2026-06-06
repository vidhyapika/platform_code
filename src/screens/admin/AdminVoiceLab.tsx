import React, { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "../../components/AdminLayout";
import { VoiceClassroomPanel } from "../../components/voice/VoiceClassroomPanel";
import { apiFetch } from "../../hooks/useApi";
import { Loader2, Mic, RefreshCw } from "lucide-react";

type HealthResponse = {
  livekit: { ok: boolean; detail: string };
  gemini: { configured: boolean };
  deepgram: { configured: boolean };
  agentAuth: { configured: boolean; detail: string };
  voiceAgent: { hint: string };
};

type SandboxSession = {
  sessionId: string;
  roomName: string;
  token: string;
  livekitUrl: string;
  bootstrapStatus?: "pending" | "ready" | "failed";
};

const DEFAULT_FAILED = [
  {
    questionId: "sandbox-q1",
    text: "Solve for x: 2x + 5 = 13",
    studentAnswer: "x = 3",
    correctAnswer: "x = 4",
    aiReasoning: "You subtracted incorrectly when isolating x.",
    type: "mcq",
  },
];

export function AdminVoiceLab() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [topicTitle, setTopicTitle] = useState("Voice Lab (Algebra)");
  const [subTopicTitle, setSubTopicTitle] = useState("Linear equations");
  const [failedJson, setFailedJson] = useState(JSON.stringify(DEFAULT_FAILED, null, 2));
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [sandboxSession, setSandboxSession] = useState<SandboxSession | null>(null);
  const [configuredFailedQuestions, setConfiguredFailedQuestions] = useState(DEFAULT_FAILED);
  const [sessionKey, setSessionKey] = useState(0);

  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    const res = await apiFetch<HealthResponse>("/api/admin/voice/health");
    setHealthLoading(false);
    if (res.data) setHealth(res.data);
    else setError(res.error ?? "Failed to load health");
  }, []);

  useEffect(() => {
    void loadHealth();
  }, [loadHealth]);

  const startSandbox = async () => {
    setStarting(true);
    setError("");
    let failedQuestions = DEFAULT_FAILED;
    try {
      failedQuestions = JSON.parse(failedJson) as typeof DEFAULT_FAILED;
    } catch {
      setError("Invalid failed questions JSON");
      setStarting(false);
      return;
    }

    const res = await apiFetch<SandboxSession>("/api/admin/voice/sandbox/create", {
      method: "POST",
      body: JSON.stringify({
        topicTitle,
        subTopicTitle,
        contextType: "subtopic",
        failedQuestions,
      }),
    });
    setStarting(false);
    if (res.error || !res.data) {
      setError(res.error ?? "Failed to create sandbox session");
      return;
    }
    setConfiguredFailedQuestions(failedQuestions);
    setSandboxSession(res.data);
    setSessionKey((k) => k + 1);
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Mic className="w-7 h-7 text-blue-600" />
              Voice Lab
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Test the LiveKit voice tutor without a quiz failure or student login.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadHealth()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 ${healthLoading ? "animate-spin" : ""}`} />
            Refresh health
          </button>
        </div>

        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {healthLoading && !health ? (
            <p className="col-span-full text-sm text-slate-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Checking infrastructure…
            </p>
          ) : health ? (
            <>
              <HealthCard title="LiveKit" ok={health.livekit.ok} detail={health.livekit.detail} />
              <HealthCard
                title="Agent auth"
                ok={health.agentAuth.configured}
                detail={health.agentAuth.detail}
              />
              <HealthCard
                title="Gemini / Deepgram"
                ok={health.gemini.configured && health.deepgram.configured}
                detail={
                  health.gemini.configured && health.deepgram.configured
                    ? "keys present"
                    : "missing API keys"
                }
              />
            </>
          ) : null}
        </section>

        {health?.voiceAgent.hint ? (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {health.voiceAgent.hint}
          </p>
        ) : null}

        {!sandboxSession ? (
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-sm font-extrabold text-slate-800 uppercase">Session config</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-bold text-slate-600">Topic title</span>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-600">Subtopic title</span>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={subTopicTitle}
                  onChange={(e) => setSubTopicTitle(e.target.value)}
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-bold text-slate-600">Mock failed questions (JSON)</span>
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono h-40"
                value={failedJson}
                onChange={(e) => setFailedJson(e.target.value)}
              />
            </label>
            {error ? <p className="text-sm text-rose-600 font-medium">{error}</p> : null}
            <button
              type="button"
              disabled={starting}
              onClick={() => void startSandbox()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-50"
            >
              {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
              Start test session
            </button>
          </section>
        ) : (
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden min-h-[70vh] flex flex-col">
            <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-600">
                Room: <span className="font-mono">{sandboxSession.roomName}</span>
              </p>
              <button
                type="button"
                className="text-xs font-bold text-blue-600"
                onClick={() => {
                  setSandboxSession(null);
                  void loadHealth();
                }}
              >
                End & configure new
              </button>
            </div>
            <div className="flex-1 min-h-[60vh]">
              <VoiceClassroomPanel
                key={sessionKey}
                mode="sandbox"
                topicId="voice-lab"
                topicTitle={topicTitle}
                subtopicTitle={subTopicTitle}
                kind="subtopic"
                failedQuestions={configuredFailedQuestions}
                passingThreshold={60}
                onPassed={() => {}}
                sandboxSession={sandboxSession}
              />
            </div>
          </section>
        )}
      </div>
    </AdminLayout>
  );
}

function HealthCard({
  title,
  ok,
  detail,
}: {
  title: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        ok ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
      }`}
    >
      <p className="text-xs font-extrabold uppercase text-slate-700">{title}</p>
      <p className={`text-sm font-bold mt-1 ${ok ? "text-emerald-800" : "text-rose-800"}`}>
        {ok ? "OK" : "Issue"}
      </p>
      <p className="text-[10px] text-slate-600 mt-1 break-words">{detail}</p>
    </div>
  );
}
