import { GoogleGenAI } from "@google/genai";
import { Question, createQuestionsInBatch, listQuestions } from "../repositories/curriculumRepo";

function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenAI({ apiKey });
}

function cleanLikelyJson(raw: string): string {
  return (raw ?? "")
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
}

/** If the model marked correct=true but the reasoning clearly says the work is wrong or irrelevant, force incorrect. */
function shouldDowngradeImageMarkToIncorrect(reasoning: string): boolean {
  const r = (reasoning ?? "").toLowerCase().trim();
  if (r.length < 15) return true;
  const phrases = [
    "unrelated to the question",
    "not related to the question",
    "does not address the question",
    "doesn't address the question",
    "does not answer the question",
    "doesn't answer the question",
    "random image",
    "random diagram",
    "unrelated diagram",
    "irrelevant image",
    "does not show",
    "doesn't show",
    "cannot verify",
    "can't verify",
    "unable to verify",
    "cannot determine",
    "no valid solution",
    "not a valid",
    "not the correct",
    "incorrect solution",
    "wrong solution",
    "contradicts",
    "does not match",
    "doesn't match",
    "meme",
    "decorative",
    "no meaningful attempt",
  ];
  return phrases.some((p) => r.includes(p));
}

function buildImageEvaluationPrompt(
  questionText: string,
  correctAnswerText: string,
  imageCount: number
): string {
  const rubric =
    correctAnswerText?.trim() ||
    "(No separate rubric text — infer the required result only from the question.)";

  return `You are a STRICT independent examiner grading a written exam. You must reduce false positives: do NOT mark answers correct unless you would defend that decision to another teacher.

QUESTION (read carefully):
${questionText}

EXPECTED CRITERIA / MODEL ANSWER / RUBRIC:
${rubric}

INPUT: The student submitted ${imageCount} image(s). Treat all images as one submission.

GRADING RULES (follow in order):
1) Mark "correct": true ONLY if the visible work in the image(s) fully addresses THIS question and matches the expected criteria (correct ideas, correct final result when applicable, and sufficient reasoning/steps for the question type).
2) Mark "correct": false if ANY of these apply:
   - The image(s) look unrelated to the question (random diagrams, unrelated sketches, decorative figures, memes, charts about a different topic, empty/near-empty submission).
   - The work is too ambiguous, illegible, or cropped so you cannot verify that the solution is right.
   - The conclusion or key steps clearly disagree with the expected criteria/rubric when that rubric is specific (numbers, definitions, classification, etc.).
   - Only part of the solution is right, or the student guessed without adequate justification visible.
   - You are not fully confident the submission demonstrates mastery — in doubt, choose false.
3) Do not give credit for effort alone. Being "close" or "on the right track" still yields false unless the question explicitly allows partial credit (most quizzes here do not).

OUTPUT (JSON only, no markdown):
{"correct": boolean, "reasoning": "2-4 sentences: what you see in the image, how it compares to the rubric, and why true/false."}`;
}

async function generateText(prompt: string): Promise<string> {
  const ai = getGenAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  return response.text ?? "";
}

// ─── Lesson Cards ─────────────────────────────────────────────────────────────

export type LessonCard = {
  title: string;
  content: string;
  latex?: string;
};

// ─── Mistake Diagnosis + Mini Drills ──────────────────────────────────────────

export type MistakeInsight = {
  questionId: string;
  mistakeTitle: string;
  whatWentWrong: string;
  likelyMisconception: string;
  fix: string;
  example: string;
};

export type MiniDrill = {
  prompt: string;
  hint: string;
  checkYourself: string;
  solution: string;
};

export type MistakePackage = {
  mistakes: MistakeInsight[];
  drills: MiniDrill[];
};

export async function generateMistakePackage(params: {
  topicName: string;
  subTopicName?: string;
  failedQuestions: { questionId?: string; text: string; studentAnswer?: string; correctAnswer?: string; aiReasoning?: string }[];
  contextType: "prereq" | "subtopic" | "finaltest";
}): Promise<MistakePackage> {
  const { topicName, subTopicName, failedQuestions, contextType } = params;
  const context = subTopicName ? `${topicName} > ${subTopicName}` : topicName;

  const failedList = failedQuestions
    .slice(0, 12)
    .map((q, i) => {
      const qid = q.questionId ? ` (id: ${q.questionId})` : "";
      return `${i + 1}. Question${qid}: ${q.text}` +
        (q.studentAnswer ? `\n   Student answered: ${q.studentAnswer}` : "") +
        (q.correctAnswer ? `\n   Correct answer: ${q.correctAnswer}` : "") +
        (q.aiReasoning ? `\n   Prior grading feedback: ${q.aiReasoning}` : "");
    })
    .join("\n\n");

  const prompt = `You are an expert math tutor for school students. A student failed a ${contextType} quiz on "${context}".

You will diagnose the student's mistakes and create mini-practice drills to fix them.

Failed questions:
${failedList}

Rules:
- Be concise, clear, and step-by-step.
- Use LaTeX for math where helpful ($...$ inline, $$...$$ block).
- Return STRICT JSON only. No markdown. No extra keys.
- Keep text short: each field <= 400 characters.
- drills: produce 4 to 8 drills total. Each drill must be directly related to the mistakes.

Respond in this exact JSON format:
{
  "mistakes": [
    {
      "questionId": "string (must match a provided question id when available; else use the question number like \\"q1\\")",
      "mistakeTitle": "short title",
      "whatWentWrong": "what the student did wrong",
      "likelyMisconception": "likely misconception",
      "fix": "how to fix it / correct approach",
      "example": "a tiny worked example (may use $...$)"
    }
  ],
  "drills": [
    {
      "prompt": "micro practice question",
      "hint": "one hint",
      "checkYourself": "final answer only",
      "solution": "brief worked steps"
    }
  ]
}`;

  try {
    const raw = await generateText(prompt);
    const cleaned = cleanLikelyJson(raw);
    const parsed = JSON.parse(cleaned);
    const mistakes = Array.isArray(parsed.mistakes) ? parsed.mistakes : [];
    const drills = Array.isArray(parsed.drills) ? parsed.drills : [];
    return {
      mistakes: mistakes as MistakeInsight[],
      drills: drills as MiniDrill[],
    };
  } catch {
    const fallbackMistakes: MistakeInsight[] = failedQuestions.slice(0, 8).map((q, idx) => ({
      questionId: q.questionId ?? `q${idx + 1}`,
      mistakeTitle: "Concept gap detected",
      whatWentWrong: "This answer did not match the expected method or result.",
      likelyMisconception: "A step, rule, or definition may be misapplied.",
      fix: "Review the key rule, then solve slowly step-by-step and re-check the final answer.",
      example: "Example: If $2(x+3)=14$, then $x+3=7$ so $x=4$.",
    }));

    const fallbackDrills: MiniDrill[] = [
      {
        prompt: `Warm-up: simplify $3(2x-1)$.`,
        hint: "Distribute 3 into both terms.",
        checkYourself: "$6x-3$",
        solution: "Distribute: $3\\cdot 2x=6x$ and $3\\cdot(-1)=-3$ so $6x-3$.",
      },
      {
        prompt: `Quick check: solve $x/5=7$.`,
        hint: "Multiply both sides by 5.",
        checkYourself: "$x=35$",
        solution: "Multiply both sides by 5: $x=7\\cdot 5=35$.",
      },
    ];

    return { mistakes: fallbackMistakes, drills: fallbackDrills };
  }
}

export async function generateLessonCards(params: {
  topicName: string;
  subTopicName?: string;
  failedQuestions: { text: string; studentAnswer?: string; correctAnswer?: string }[];
  contextType: "prereq" | "subtopic" | "finaltest";
}): Promise<LessonCard[]> {
  const { topicName, subTopicName, failedQuestions, contextType } = params;

  const context = subTopicName ? `${topicName} > ${subTopicName}` : topicName;
  const failedList = failedQuestions
    .map(
      (q, i) =>
        `${i + 1}. Question: ${q.text}${q.studentAnswer ? `\n   Student answered: ${q.studentAnswer}` : ""}${q.correctAnswer ? `\n   Correct answer: ${q.correctAnswer}` : ""}`
    )
    .join("\n\n");

  const prompt = `You are an expert math tutor for school students. A student failed a ${contextType} quiz on "${context}".

Failed questions:
${failedList}

Create 3-5 focused lesson cards to teach the student the concepts they missed. Each card should:
- Have a clear title
- Explain the concept simply and step-by-step
- Use LaTeX notation for math (enclosed in $...$ for inline, $$...$$ for block)
- Be encouraging and student-friendly

Respond in this exact JSON format (no markdown, just JSON):
{
  "cards": [
    {
      "title": "Card title",
      "content": "Explanation with $inline math$ and $$block math$$",
      "latex": "optional standalone formula if applicable"
    }
  ]
}`;

  try {
    const raw = await generateText(prompt);
    const cleaned = cleanLikelyJson(raw);
    const parsed = JSON.parse(cleaned);
    return parsed.cards as LessonCard[];
  } catch {
    return [
      {
        title: `Review: ${context}`,
        content: `Let's revisit the key concepts in ${context}. Focus on understanding each step carefully before attempting the quiz again.`,
      },
    ];
  }
}

// ─── Retake Quiz Generation ───────────────────────────────────────────────────

export async function generateRetakeQuestions(params: {
  studentId: string;
  topicName: string;
  subTopicName?: string;
  failedQuestions: { text: string; studentAnswer?: string; correctAnswer?: string }[];
  count?: number;
  contextType: "prereq" | "subtopic" | "finaltest";
  contextId: string;
}): Promise<string[]> {
  const { studentId, topicName, subTopicName, failedQuestions, count = 5, contextType, contextId } =
    params;

  const context = subTopicName ? `${topicName} > ${subTopicName}` : topicName;
  const failedList = failedQuestions
    .map((q, i) => `${i + 1}. ${q.text}`)
    .join("\n");

  const prompt = `You are an expert math teacher. A student struggled with these questions on "${context}":

${failedList}

Generate ${count} NEW multiple-choice questions that test the same concepts but with different numbers/scenarios. Questions must:
- Be at the same difficulty level
- Test the exact concepts the student got wrong
- Have clear, unambiguous correct answers
- Use LaTeX for any math notation ($...$ for inline)
- Include exactly 4 options (A, B, C, D)

Respond in this exact JSON format (no markdown, just JSON):
{
  "questions": [
    {
      "text": "Question text with $math$ if needed",
      "type": "mcq",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A"
    }
  ]
}`;

  try {
    const raw = await generateText(prompt);
    const cleaned = cleanLikelyJson(raw);
    const parsed = JSON.parse(cleaned);

    const existing = await listQuestions(contextType, contextId);
    const maxOrder = existing.reduce((m, q) => Math.max(m, q.order ?? 0), 0);

    const questions: Omit<Question, "id" | "createdAt">[] = parsed.questions.map(
      (q: any, i: number) => ({
        contextType,
        contextId,
        text: q.text,
        type: "mcq" as const,
        options: q.options,
        correctAnswer: q.correctAnswer,
        order: maxOrder + 1 + i,
        isAIGenerated: true,
        generatedForStudentId: studentId,
      })
    );

    return createQuestionsInBatch(questions);
  } catch {
    return [];
  }
}

// ─── AI Answer Evaluation ─────────────────────────────────────────────────────

export async function evaluateSubjectiveAnswer(params: {
  questionText: string;
  correctAnswerText: string;
  gradingGuidance?: string | null;
  studentAnswer: string;
  type: "text" | "image_upload";
}): Promise<{ correct: boolean; reasoning: string; evaluationFailed?: boolean }> {
  const { questionText, correctAnswerText, gradingGuidance, studentAnswer, type } = params;
  const guidanceBlock =
    gradingGuidance?.trim() ?
      `\nGrading guidance: ${gradingGuidance.trim()}\n`
    : "";

  let parts: any[] = [];

  if (type === "image_upload") {
    // Answer may be a JSON array of base64 data URLs (multi-image) or a single data URL
    let imageUrls: string[] = [];
    try {
      const parsed = JSON.parse(studentAnswer);
      imageUrls = Array.isArray(parsed) ? parsed : [studentAnswer];
    } catch {
      imageUrls = [studentAnswer];
    }

    const imageParts: any[] = [];
    for (const url of imageUrls) {
      const match = url.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
      if (match) {
        imageParts.push({ inlineData: { mimeType: match[1], data: match[2] } });
      }
    }

    if (imageParts.length === 0) {
      return { correct: false, reasoning: "No valid image data provided." };
    }

    const rubric =
      [correctAnswerText?.trim(), gradingGuidance?.trim()].filter(Boolean).join("\n") ||
      "(No separate rubric text — infer the required result only from the question.)";
    parts = [
      {
        text: buildImageEvaluationPrompt(questionText, rubric, imageParts.length),
      },
      ...imageParts,
    ];
  } else {
    parts = [
      {
        text: `Question: ${questionText}\nExpected answer: ${correctAnswerText}${guidanceBlock}\nStudent answer: ${studentAnswer}\n\n` +
          `Evaluate whether the student answer is mathematically equivalent to the expected answer. ` +
          `Be lenient on how the answer is written: symbolic notation, informal keyboard-style input, and plain words are all acceptable. ` +
          `Be strict on whether the underlying mathematics is correct (value, operation, and concept must match). ` +
          `Do not require a specific formatting style. ` +
          `Respond in exact JSON: {"correct": true/false, "reasoning": "short explanation"}`
      }
    ];
  }

  try {
    const ai = getGenAI();
    const isImage = type === "image_upload";
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: parts,
      config: isImage
        ? {
            temperature: 0.15,
            topP: 0.75,
            responseMimeType: "application/json",
          }
        : {
            temperature: 0.35,
            responseMimeType: "application/json",
          },
    });
    const raw = response.text ?? "";
    const cleaned = cleanLikelyJson(raw);
    const parsed = JSON.parse(cleaned) as { correct?: boolean; reasoning?: string };
    let correct = !!parsed.correct;
    let reasoning = String(parsed.reasoning ?? "").trim();

    if (isImage && correct && shouldDowngradeImageMarkToIncorrect(reasoning)) {
      correct = false;
      reasoning =
        (reasoning ? `${reasoning} ` : "") +
        "Marked incorrect automatically because the explanation did not support a correct score (e.g. unrelated or unverifiable work).";
    }

    return { correct, reasoning: reasoning || (correct ? "Meets the rubric." : "Does not meet the rubric.") };
  } catch (e) {
    console.error("AI Evaluation error:", e);
    return {
      correct: false,
      reasoning: "We couldn’t grade this answer automatically. Tap “Retry evaluation” to try again.",
      evaluationFailed: true,
    };
  }
}

// ─── Voice session recap notes ────────────────────────────────────────────────

const THIN_NOTES_THRESHOLD = 200;

function whiteboardRecapLines(log: Record<string, unknown>[]): string[] {
  const lines: string[] = [];
  for (const entry of log.slice(-40)) {
    const type = String(entry.type ?? "");
    if (type.startsWith("graph:") || type === "cognitive_state") continue;
    const content = entry.content as string | undefined;
    const title = entry.title as string | undefined;
    const caption = entry.caption as string | undefined;
    if (type === "title" && content) lines.push(`- **${content}**`);
    else if (type === "highlight" && content) lines.push(`- Formula: $${content}$`);
    else if ((type === "write" || type === "step" || type === "question") && content) {
      lines.push(`- ${content.slice(0, 280)}${content.length > 280 ? "…" : ""}`);
    } else if (type === "rich_card" && title) lines.push(`- Card: ${title}`);
    else if ((type === "diagram_ready" || type === "scene_ready") && caption) {
      lines.push(`- Diagram/scene: ${caption}`);
    }
  }
  return lines.slice(-12);
}

export async function generateVoiceSessionRecapNotes(params: {
  topicName: string;
  subTopicName?: string;
  mistakes: { mistakeTitle: string; fix: string }[];
  lessonCards: { title: string; content: string }[];
  whiteboardLog: Record<string, unknown>[];
  transcript: { role: string; text: string }[];
}): Promise<string> {
  const { topicName, subTopicName, mistakes, lessonCards, whiteboardLog, transcript } = params;
  const context = subTopicName ? `${topicName} > ${subTopicName}` : topicName;
  const boardLines = whiteboardRecapLines(whiteboardLog);
  const transcriptSample = transcript
    .slice(-24)
    .map((t) => `${t.role === "student" ? "Student" : "Tutor"}: ${t.text}`)
    .join("\n");

  const prompt = `You are writing study notes for a student who just finished a live voice tutoring session on "${context}".

Create markdown study notes the student can review later. Use:
- ## Key takeaways (3-6 bullets)
- ## Formulas & steps (with $...$ or $$...$$ for math)
- ## What we practiced (short paragraph)

Use only information from the session data below. Be encouraging and concise.

Mistakes covered:
${mistakes.map((m) => `- ${m.mistakeTitle}: ${m.fix}`).join("\n") || "(none)"}

Lesson cards:
${lessonCards.map((c) => `- ${c.title}: ${c.content.slice(0, 200)}`).join("\n") || "(none)"}

Whiteboard highlights:
${boardLines.join("\n") || "(none)"}

Recent transcript:
${transcriptSample || "(none)"}

Respond with markdown only (no JSON, no code fences).`;

  try {
    return await generateText(prompt);
  } catch {
    const fallback: string[] = ["## Key takeaways", ""];
    for (const m of mistakes.slice(0, 5)) {
      fallback.push(`- **${m.mistakeTitle}**: ${m.fix}`);
    }
    for (const c of lessonCards.slice(0, 3)) {
      fallback.push(`- ${c.title}: ${c.content.slice(0, 150)}…`);
    }
    if (boardLines.length) {
      fallback.push("", "## Board recap", ...boardLines);
    }
    return fallback.join("\n");
  }
}

export async function buildVoiceSessionNotes(
  session: {
    mistakes?: { mistakeTitle: string; fix: string }[];
    lessonCards?: { title: string; content: string }[];
  },
  agentNotes: string,
  whiteboardLog: Record<string, unknown>[],
  transcript: { role: string; text: string }[],
  topicName: string,
  subTopicName?: string
): Promise<string> {
  const trimmed = (agentNotes ?? "").trim();
  const boardRecap = whiteboardRecapLines(whiteboardLog);

  if (trimmed.length < THIN_NOTES_THRESHOLD) {
    return generateVoiceSessionRecapNotes({
      topicName,
      subTopicName,
      mistakes: session.mistakes ?? [],
      lessonCards: session.lessonCards ?? [],
      whiteboardLog,
      transcript,
    });
  }

  if (boardRecap.length === 0) return trimmed;
  if (trimmed.includes("## Board recap")) return trimmed;

  return `${trimmed}\n\n## Board recap\n${boardRecap.join("\n")}`;
}
