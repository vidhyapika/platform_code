/**
 * Smoke test for voice session notes helpers (no Firestore).
 */
import { buildVoiceSessionNotes } from "../../backend/services/ai";

const longNotes = await buildVoiceSessionNotes(
  {
    mistakes: [{ mistakeTitle: "Sign error", fix: "Track negative signs" }],
    lessonCards: [{ title: "Linear equations", content: "Isolate $x$ on one side." }],
  },
  "## Key takeaways\n\n- Watch signs when moving terms.\n\n## Formulas & steps\n\nSolve $ax+b=c$ by subtracting $b$.",
  [{ type: "highlight", content: "x = 5" }],
  [{ role: "tutor", text: "Let's review your mistakes." }],
  "Algebra",
  "Linear equations"
);

if (!longNotes.includes("Key takeaways")) {
  throw new Error("expected agent notes preserved");
}
if (!longNotes.includes("Board recap")) {
  throw new Error("expected board recap appended");
}

const thinNotes = await buildVoiceSessionNotes(
  {
    mistakes: [{ mistakeTitle: "Sign error", fix: "Track negative signs" }],
    lessonCards: [],
  },
  "ok",
  [],
  [],
  "Algebra"
);

if (thinNotes.length < 50) {
  throw new Error("expected fallback recap for thin notes");
}

console.log("voice-notes-smoke: OK");
