import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Flag,
  Loader2,
  MessageSquare,
  RefreshCw,
  Scale,
  Send,
  X,
  XCircle,
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { MathRenderer, StudentAnswerMath } from '../../components/MathRenderer';
import { Modal } from '../../components/ui/Modal';
import { apiFetch, useApiGet } from '../../hooks/useApi';
import type { ComposeRecipients } from '../../types/messages';
import type { QuestionFlag, QuestionFlagStatus } from '../../types/questionFlags';

const STATUS_TABS: { id: QuestionFlagStatus; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'in_review', label: 'In review' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'rejected', label: 'Rejected' },
];

const REASON_LABELS: Record<string, string> = {
  question_issue: 'Question issue',
  grading_dispute: 'Grading dispute',
  other: 'Other',
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const t = Date.parse(iso);
  return Number.isNaN(t) ? '—' : new Date(t).toLocaleString();
}

function StatusBadge({ status }: { status: QuestionFlagStatus }) {
  const styles: Record<QuestionFlagStatus, string> = {
    open: 'bg-amber-100 text-amber-800',
    in_review: 'bg-blue-100 text-blue-800',
    resolved: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-slate-200 text-slate-700',
  };
  return (
    <span className={`text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full ${styles[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export function AdminQueryResolution() {
  const [statusFilter, setStatusFilter] = useState<QuestionFlagStatus>('open');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    flag: QuestionFlag;
    student: { id: string; name: string | null; email: string } | null;
    topicName: string;
    contextLabel: string;
    enrollments: { classId: string }[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const [messageOpen, setMessageOpen] = useState(false);
  const [messageMode, setMessageMode] = useState<'student' | 'broadcast'>('student');
  const [messageBody, setMessageBody] = useState('');
  const [audienceType, setAudienceType] = useState<'class' | 'standard' | 'all'>('class');
  const [classId, setClassId] = useState('');
  const [standardId, setStandardId] = useState('');

  const [overrideOpen, setOverrideOpen] = useState(false);
  const [markCorrect, setMarkCorrect] = useState(true);

  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveStatus, setResolveStatus] = useState<'resolved' | 'rejected'>('resolved');
  const [adminNotes, setAdminNotes] = useState('');

  const listUrl = `/api/admin/question-flags?status=${statusFilter}`;
  const { data: listData, loading: listLoading, refetch: refetchList } = useApiGet<{ flags: QuestionFlag[] }>(
    listUrl,
    [statusFilter]
  );
  const { data: recipientsData } = useApiGet<ComposeRecipients>('/api/admin/messages/recipients', []);

  const flags = listData?.flags ?? [];

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setActionError(null);
    const { data, error } = await apiFetch<{
      flag: QuestionFlag;
      student: { id: string; name: string | null; email: string } | null;
      topicName: string;
      contextLabel: string;
      enrollments: { classId: string }[];
    }>(`/api/admin/question-flags/${id}`);
    setDetailLoading(false);
    if (error) {
      setActionError(error);
      setDetail(null);
      return;
    }
    setDetail(data ?? null);
  }, []);

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId);
    else setDetail(null);
  }, [selectedId, loadDetail]);

  useEffect(() => {
    if (flags.length > 0 && !selectedId) setSelectedId(flags[0]!.id);
    if (flags.length === 0) setSelectedId(null);
    if (selectedId && !flags.some((f) => f.id === selectedId)) {
      setSelectedId(flags[0]?.id ?? null);
    }
  }, [flags, selectedId]);

  const flag = detail?.flag;
  const curriculumLink = useMemo(() => {
    if (!flag) return null;
    const params = new URLSearchParams({
      topicId: flag.topicId,
      contextType: flag.contextType,
      contextId: flag.contextId,
      questionId: flag.questionId,
    });
    return `/admin/curriculum?${params.toString()}`;
  }, [flag]);

  async function refreshAll() {
    await refetchList();
    if (selectedId) await loadDetail(selectedId);
  }

  async function sendMessage() {
    if (!selectedId || !messageBody.trim()) return;
    setActionBusy(true);
    setActionError(null);
    const payload: Record<string, string> = { body: messageBody.trim() };
    if (messageMode === 'student') {
      payload.audienceType = 'student';
    } else {
      payload.audienceType = audienceType;
      if (audienceType === 'class') payload.classId = classId;
      if (audienceType === 'standard') payload.standardId = standardId;
    }
    const { error } = await apiFetch(`/api/admin/question-flags/${selectedId}/message`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setActionBusy(false);
    if (error) {
      setActionError(error);
      return;
    }
    setMessageOpen(false);
    setMessageBody('');
    await refreshAll();
  }

  async function applyOverride() {
    if (!selectedId) return;
    setActionBusy(true);
    setActionError(null);
    const { error } = await apiFetch(`/api/admin/question-flags/${selectedId}/override-score`, {
      method: 'POST',
      body: JSON.stringify({ markCorrect }),
    });
    setActionBusy(false);
    if (error) {
      setActionError(error);
      return;
    }
    setOverrideOpen(false);
    await refreshAll();
  }

  async function applyResolve() {
    if (!selectedId) return;
    setActionBusy(true);
    setActionError(null);
    const { error } = await apiFetch(`/api/admin/question-flags/${selectedId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: resolveStatus, adminNotes: adminNotes.trim() || undefined }),
    });
    setActionBusy(false);
    if (error) {
      setActionError(error);
      return;
    }
    setResolveOpen(false);
    setAdminNotes('');
    await refreshAll();
  }

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Flag className="w-7 h-7 text-indigo-600" />
              Query Resolution
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Review student question flags, message learners, override scores, and edit curriculum.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refreshAll()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 min-h-[560px]">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80">
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                {flags.length} flag{flags.length === 1 ? '' : 's'}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {listLoading ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : flags.length === 0 ? (
                <p className="p-6 text-sm text-slate-500 text-center">No flags in this queue.</p>
              ) : (
                flags.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedId(f.id)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${
                      selectedId === f.id ? 'bg-indigo-50/70 border-l-4 border-indigo-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <StatusBadge status={f.status} />
                      <span className="text-[10px] text-slate-400 shrink-0">{formatDate(f.createdAt)}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                      {f.questionSnapshot.text.replace(/\$\$/g, '').slice(0, 80)}
                      {f.questionSnapshot.text.length > 80 ? '…' : ''}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{REASON_LABELS[f.reasonType] ?? f.reasonType}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {!selectedId ? (
              <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
                <p className="text-sm font-medium">Select a flag to view details</p>
              </div>
            ) : detailLoading ? (
              <div className="flex-1 flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : !flag ? (
              <div className="flex-1 flex items-center justify-center p-12 text-red-500 text-sm font-semibold">
                {actionError ?? 'Could not load flag'}
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={flag.status} />
                    {flag.scoreOverridden ? (
                      <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
                        Score overridden
                      </span>
                    ) : null}
                  </div>
                  <span className="text-xs text-slate-400">#{flag.id.slice(0, 8)}</span>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {actionError ? (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm font-semibold text-red-700">
                      {actionError}
                    </div>
                  ) : null}

                  <section className="grid sm:grid-cols-2 gap-4">
                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Student</p>
                      <p className="font-bold text-slate-900">{detail?.student?.name ?? 'Unknown'}</p>
                      <p className="text-sm text-slate-500">{detail?.student?.email ?? '—'}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Context</p>
                      <p className="font-bold text-slate-900">{detail?.topicName}</p>
                      <p className="text-sm text-slate-500">{detail?.contextLabel}</p>
                    </div>
                  </section>

                  <section>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Reason</p>
                    <p className="font-bold text-slate-800">{REASON_LABELS[flag.reasonType]}</p>
                    {flag.reasonText ? (
                      <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{flag.reasonText}</p>
                    ) : null}
                  </section>

                  <section>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Question</p>
                    <div className="rounded-xl border border-slate-200 p-4 bg-white">
                      <div className="text-base font-semibold text-slate-900 leading-relaxed">
                        <MathRenderer text={flag.questionSnapshot.text} block />
                      </div>
                      {flag.questionSnapshot.imageUrl ? (
                        <img
                          src={flag.questionSnapshot.imageUrl}
                          alt="Question"
                          className="mt-3 max-h-48 rounded-lg border border-slate-200"
                        />
                      ) : null}
                    </div>
                  </section>

                  <section className="grid sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Student answer</p>
                      <div className="text-sm font-bold text-slate-800 whitespace-pre-wrap break-words">
                        <StudentAnswerMath answer={flag.studentAnswer || '—'} />
                      </div>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Expected</p>
                      <div className="text-sm font-bold text-emerald-900">
                        <MathRenderer text={flag.questionSnapshot.correctAnswer ?? '—'} />
                      </div>
                      <p className="text-xs font-bold mt-2 text-slate-600">
                        System marked: {flag.systemMarkedCorrect ? 'Correct' : 'Incorrect'}
                      </p>
                    </div>
                  </section>

                  {flag.aiReasoning ? (
                    <section className="rounded-xl border border-violet-100 bg-violet-50/60 p-4">
                      <p className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider mb-1">AI feedback</p>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap">{flag.aiReasoning}</p>
                    </section>
                  ) : null}

                  {flag.adminNotes ? (
                    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Admin notes</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{flag.adminNotes}</p>
                    </section>
                  ) : null}
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMessageMode('student');
                      setMessageBody('');
                      setMessageOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Message student
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMessageMode('broadcast');
                      setMessageBody('');
                      setMessageOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Send className="w-4 h-4" />
                    Broadcast
                  </button>
                  {flag.quizAttemptId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMarkCorrect(!flag.systemMarkedCorrect);
                        setOverrideOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-violet-200 bg-violet-50 text-sm font-bold text-violet-800 hover:bg-violet-100"
                    >
                      <Scale className="w-4 h-4" />
                      Override score
                    </button>
                  ) : null}
                  {curriculumLink ? (
                    <Link
                      to={curriculumLink}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Edit question
                    </Link>
                  ) : null}
                  {flag.lastMessageThreadId ? (
                    <Link
                      to={`/admin/messages?studentId=${flag.studentId}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Open in Messages
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setResolveStatus('resolved');
                      setAdminNotes(flag.adminNotes ?? '');
                      setResolveOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 ml-auto"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Resolve
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResolveStatus('rejected');
                      setAdminNotes(flag.adminNotes ?? '');
                      setResolveOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={messageOpen}
        onClose={() => setMessageOpen(false)}
        title={messageMode === 'student' ? 'Message student' : 'Broadcast about this flag'}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Your message is appended to an auto-generated block with the full question, answers, and flag context.
          </p>
          {messageMode === 'broadcast' ? (
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 block">Audience</label>
              <select
                value={audienceType}
                onChange={(e) => setAudienceType(e.target.value as 'class' | 'standard' | 'all')}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm"
              >
                <option value="class">Class</option>
                <option value="standard">Standard / grade</option>
                <option value="all">All students</option>
              </select>
              {audienceType === 'class' ? (
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="">Select class</option>
                  {(recipientsData?.classes ?? []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              ) : null}
              {audienceType === 'standard' ? (
                <select
                  value={standardId}
                  onChange={(e) => setStandardId(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="">Select standard</option>
                  {(recipientsData?.standards ?? []).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              ) : null}
            </div>
          ) : null}
          <textarea
            rows={4}
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            placeholder="Your message to the student(s)…"
            className="w-full p-3 border border-slate-200 rounded-xl text-sm resize-none"
          />
          <div className="flex gap-3">
            <button type="button" onClick={() => setMessageOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700">
              Cancel
            </button>
            <button
              type="button"
              disabled={actionBusy || !messageBody.trim()}
              onClick={() => void sendMessage()}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {actionBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={overrideOpen} onClose={() => setOverrideOpen(false)} title="Override score">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            This updates the stored quiz attempt and recalculates progress. The flag will be marked as overridden.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMarkCorrect(true)}
              className={`flex-1 py-3 rounded-xl border-2 font-bold ${markCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200'}`}
            >
              Mark correct
            </button>
            <button
              type="button"
              onClick={() => setMarkCorrect(false)}
              className={`flex-1 py-3 rounded-xl border-2 font-bold ${!markCorrect ? 'border-red-500 bg-red-50 text-red-800' : 'border-slate-200'}`}
            >
              Mark incorrect
            </button>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setOverrideOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700">
              Cancel
            </button>
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => void applyOverride()}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-bold disabled:opacity-60"
            >
              Confirm override
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={resolveOpen}
        onClose={() => setResolveOpen(false)}
        title={resolveStatus === 'resolved' ? 'Resolve flag' : 'Reject flag'}
      >
        <div className="space-y-4">
          <textarea
            rows={3}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Optional admin notes (internal)"
            className="w-full p-3 border border-slate-200 rounded-xl text-sm resize-none"
          />
          <div className="flex gap-3">
            <button type="button" onClick={() => setResolveOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700">
              Cancel
            </button>
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => void applyResolve()}
              className={`flex-1 py-2.5 rounded-xl font-bold text-white disabled:opacity-60 ${
                resolveStatus === 'resolved' ? 'bg-emerald-600' : 'bg-slate-600'
              }`}
            >
              {resolveStatus === 'resolved' ? 'Mark resolved' : 'Mark rejected'}
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
