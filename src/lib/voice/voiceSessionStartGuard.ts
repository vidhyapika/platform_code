/** Records a successful voice session create per quiz context (used for cleanup on pass/back). */
const STALE_MS = 2 * 60 * 60 * 1000;

export function voiceSessionStartKey(topicId: string, contextId: string, contextType: string) {
  return `voice-session-start:${topicId}:${contextType}:${contextId}`;
}

export function markVoiceSessionStart(topicId: string, contextId: string, contextType: string) {
  try {
    sessionStorage.setItem(voiceSessionStartKey(topicId, contextId, contextType), String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function hasVoiceSessionStart(topicId: string, contextId: string, contextType: string) {
  try {
    const key = voiceSessionStartKey(topicId, contextId, contextType);
    const raw = sessionStorage.getItem(key);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts) || Date.now() - ts > STALE_MS) {
      sessionStorage.removeItem(key);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function clearVoiceSessionStart(topicId: string, contextId: string, contextType: string) {
  try {
    sessionStorage.removeItem(voiceSessionStartKey(topicId, contextId, contextType));
  } catch {
    /* ignore */
  }
}
