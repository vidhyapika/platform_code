import { GoogleGenAI } from "@google/genai";

const DIAGRAM_SYSTEM = `You generate a single HTML fragment for a student whiteboard diagram.
Rules: Raw HTML only starting with <div or <svg. No markdown fences.
Use CSS variables --color-text-primary, --wb-accent. Prefer SVG viewBox for spatial content.
KaTeX allowed as $...$ inside HTML. No JavaScript, no external images, no base64. Max 3800 chars.`;

export async function generateHtmlDiagram(
  apiKey: string,
  diagramType: string,
  description: string,
  subjectLevel: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Type: ${diagramType}\nLevel: ${subjectLevel}\nDescription: ${description}\nReturn HTML fragment only.`,
    config: {
      systemInstruction: DIAGRAM_SYSTEM,
      temperature: 0.15,
    },
  });
  let html = (response.text ?? "").trim();
  html = html.replace(/^```html?\n?/i, "").replace(/```$/i, "").trim();
  if (!html.startsWith("<")) {
    html = `<div class="wb-card"><p>${html}</p></div>`;
  }
  return html.slice(0, 3800);
}
