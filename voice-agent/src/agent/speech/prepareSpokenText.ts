/** §5.5 TTS text pipeline — plain English, no markdown/LaTeX in speech. */

export function stripGeminiThinking(raw: string): string {
  let s = raw;
  s = s.replace(/```[\s\S]*?```/g, "");
  s = s.replace(/<tool_code>[\s\S]*?<\/tool_code>/gi, "");
  s = s.replace(/\(thinking:[\s\S]*?\)/gi, "");
  return s.trim();
}

export function stripMarkdownForSpeech(raw: string): string {
  return raw
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^[-*]\s+/gm, "")
    .replace(/~~([^~]+)~~/g, "$1")
    .trim();
}

const LATEX_COMMANDS: Record<string, string> = {
  "\\sqrt": "square root of",
  "\\times": " times ",
  "\\div": " divided by ",
  "\\pm": " plus or minus ",
  "\\cdot": " times ",
  "\\leq": " less than or equal to ",
  "\\geq": " greater than or equal to ",
  "\\neq": " not equal to ",
  "\\rightarrow": " goes to ",
  "\\infty": " infinity ",
  "\\pi": " pi ",
  "\\alpha": " alpha ",
  "\\beta": " beta ",
  "\\theta": " theta ",
};

function applyLatexCommands(latex: string): string {
  let s = latex;
  for (const [cmd, spoken] of Object.entries(LATEX_COMMANDS)) {
    s = s.replaceAll(cmd, spoken);
  }
  s = s.replace(/\\sqrt\{([^}]+)\}/g, "square root of $1");
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 over $2");
  return s;
}

function verbalizeLatex(latex: string): string {
  let s = applyLatexCommands(latex.trim());
  s = s.replace(/\^2/g, " squared");
  s = s.replace(/\^3/g, " cubed");
  s = s.replace(/\^(\d+)/g, " to the power of $1");
  s = s.replace(/\\[a-zA-Z]+/g, " ");
  s = s.replace(/[{}]/g, " ");
  return s.replace(/\s+/g, " ").trim();
}

export function verbalizeMathForSpeech(raw: string): string {
  let s = raw;
  s = s.replace(/\$\$([^$]+)\$\$/g, (_, m) => verbalizeLatex(m));
  s = s.replace(/\$([^$]+)\$/g, (_, m) => verbalizeLatex(m));
  s = applyLatexCommands(s);
  s = s.replace(/\^2/g, " squared");
  s = s.replace(/\^3/g, " cubed");
  s = s.replace(/\^(\d+)/g, " to the power of $1");
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 over $2");
  s = s.replace(/\\[a-zA-Z]+/g, " ");
  s = s.replace(/\$/g, "");
  return s;
}

export function stripHtmlForSpeech(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, " and ")
    .replace(/&lt;/gi, " less than ")
    .replace(/&gt;/gi, " greater than ");
}

export function cleanupSpokenResiduals(raw: string): string {
  return raw
    .replace(/[{}[\]]/g, " ")
    .replace(/\(\s*\)/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim();
}

export function prepareSpokenText(raw: string): string {
  if (!raw?.trim()) return "";
  let s = stripGeminiThinking(raw);
  s = stripHtmlForSpeech(s);
  s = stripMarkdownForSpeech(s);
  s = verbalizeMathForSpeech(s);
  s = cleanupSpokenResiduals(s);
  return s;
}
