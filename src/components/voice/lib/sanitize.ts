const ALLOWED_ARTIFACT_TAGS = new Set([
  "div", "span", "p", "h1", "h2", "h3", "h4", "ul", "ol", "li", "strong", "em", "br",
  "table", "thead", "tbody", "tr", "th", "td", "pre", "code", "blockquote",
]);

const ALLOWED_DIAGRAM_TAGS = new Set([
  ...ALLOWED_ARTIFACT_TAGS,
  "svg", "g", "path", "circle", "rect", "line", "text", "defs", "marker", "use", "ellipse", "polyline", "polygon",
]);

function stripUnsafe(html: string, allowSvg: boolean) {
  const allowed = allowSvg ? ALLOWED_DIAGRAM_TAGS : ALLOWED_ARTIFACT_TAGS;
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/\sstyle='[^']*'/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/<(\/?)([\w-]+)([^>]*)>/g, (match, slash, tag) => {
      const t = tag.toLowerCase();
      if (!allowed.has(t)) return "";
      if (!allowSvg && t === "svg") return "";
      return match;
    });
}

export function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function sanitizeArtifactHtml(html: string) {
  return stripUnsafe(html, false);
}

export function sanitizeDiagramHtml(html: string) {
  return stripUnsafe(html, true);
}

export function slugCaption(caption: string) {
  return caption
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "diagram";
}
