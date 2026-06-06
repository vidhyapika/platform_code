/**
 * Smoke test for whiteboard math/typeset helpers (no browser).
 */
import katex from "katex";

function renderLatexString(source: string, displayMode: boolean): string {
  return katex.renderToString(source, { displayMode, throwOnError: false, trust: false });
}

function typesetMathInHtml(html: string): string {
  let out = html;
  out = out.replace(/\$\$([^$]+)\$\$/g, (_, latex) => renderLatexString(latex.trim(), true));
  out = out.replace(/\$([^$]+)\$/g, (_, latex) => renderLatexString(latex.trim(), false));
  return out;
}

const highlight = renderLatexString("E=mc^2", false);
if (!highlight.includes("katex")) {
  throw new Error("highlight LaTeX failed");
}

const inline = typesetMathInHtml("<p>The area is $x^2$ units.</p>");
if (!inline.includes("katex")) {
  throw new Error("inline math in HTML failed");
}

const block = typesetMathInHtml("<p>$$\\frac{a}{b}$$</p>");
if (!block.includes("katex")) {
  throw new Error("block math in HTML failed");
}

console.log("whiteboard-format-smoke: OK");
