const MAX_TEXT_CHARS = 1200;
const MAX_RICH_CARD_LIST_ITEMS = 4;

function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  console.warn("[whiteboard] truncated content", { from: t.length, to: max });
  return t.slice(0, max - 1).trimEnd() + "…";
}

function normalizeRichCardHtml(html: string): string {
  let out = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const liMatches = [...out.matchAll(/<li[^>]*>[\s\S]*?<\/li>/gi)];
  if (liMatches.length > MAX_RICH_CARD_LIST_ITEMS) {
    console.warn("[whiteboard] capped list items", {
      from: liMatches.length,
      to: MAX_RICH_CARD_LIST_ITEMS,
    });
    const keep = liMatches.slice(0, MAX_RICH_CARD_LIST_ITEMS).map((m) => m[0]);
    const ulOpen = out.match(/<ul[^>]*>/i)?.[0] ?? "<ul>";
    out = `${ulOpen}${keep.join("")}</ul>`;
  }

  return truncate(out, MAX_TEXT_CHARS);
}

export function normalizeBoardPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const type = String(payload.type ?? "");
  const copy = { ...payload };

  if (typeof copy.content === "string") {
    copy.content = truncate(copy.content, MAX_TEXT_CHARS);
  }
  if (typeof copy.html === "string") {
    copy.html =
      type === "rich_card" || type === "diagram_ready"
        ? normalizeRichCardHtml(copy.html)
        : truncate(copy.html, MAX_TEXT_CHARS);
  }
  if (typeof copy.title === "string") {
    copy.title = truncate(copy.title, 120);
  }
  if (typeof copy.caption === "string") {
    copy.caption = truncate(copy.caption, 200);
  }

  return copy;
}
