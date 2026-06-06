import React, { useState } from "react";
import { Shield, GraduationCap, ArrowRight, Database, AlertTriangle } from "lucide-react";

type DemoRole = "admin" | "student";

const TOKEN_KEY = "vidhyapika_token";
const USER_KEY = "vidhyapika_user";

export function DemoPortal() {
  const [loadingRole, setLoadingRole] = useState<DemoRole | null>(null);
  const [error, setError] = useState<string>("");

  const start = async (role: DemoRole) => {
    setError("");
    setLoadingRole(role);
    try {
      // Ensure demo data exists; session endpoint also bootstraps, but this makes errors clearer.
      const boot = await fetch("/api/demo/bootstrap", { method: "POST" });
      const bootJson = await boot.json().catch(() => null);
      if (!boot.ok) {
        const msg =
          bootJson?.error
            ? `${bootJson.error}${bootJson.message ? `: ${bootJson.message}` : ""}`
            : `Demo bootstrap failed (${boot.status})`;
        const hint = bootJson?.hint ? `\n\nHint: ${bootJson.hint}` : "";
        throw new Error(`${msg}${hint}`);
      }

      const res = await fetch("/api/demo/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          data?.error
            ? `${data.error}${data.message ? `: ${data.message}` : ""}`
            : `Demo login failed (${res.status})`;
        const hint = data?.hint ? `\n\nHint: ${data.hint}` : "";
        throw new Error(`${msg}${hint}`);
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      // Force a full reload so AuthProvider rehydrates from localStorage,
      // otherwise route guards may redirect to login.
      window.location.assign(role === "admin" ? "/admin/dashboard" : "/dashboard");
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-7 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Demo Portal
                </h1>
                <p className="text-sm font-medium text-slate-500">
                  One-click demo login with populated dummy data.
                </p>
              </div>
            </div>
          </div>

          <div className="px-8 py-7 space-y-5">
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-800">Demo login failed</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <p className="text-xs text-red-600 mt-2">
                    If this is production, set <code className="px-1.5 py-0.5 bg-white border rounded">ALLOW_DEMO_ENDPOINTS=true</code>.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => start("admin")}
                disabled={loadingRole !== null}
                className="group text-left p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all disabled:opacity-60"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">Login as Admin</p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">
                        Curriculum, students, analytics.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <div className="mt-4 text-xs text-slate-500 font-medium">
                  {loadingRole === "admin" ? "Preparing demo admin…" : "Instant access to admin dashboard"}
                </div>
              </button>

              <button
                type="button"
                onClick={() => start("student")}
                disabled={loadingRole !== null}
                className="group text-left p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm transition-all disabled:opacity-60"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">Login as Student</p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">
                        Roadmap, quizzes, progress.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <div className="mt-4 text-xs text-slate-500 font-medium">
                  {loadingRole === "student" ? "Preparing demo student…" : "Sample progress across multiple topics"}
                </div>
              </button>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 font-medium">
              Tip: You can bookmark <code className="px-1.5 py-0.5 bg-white border rounded">/demo</code> for instant walkthroughs.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

