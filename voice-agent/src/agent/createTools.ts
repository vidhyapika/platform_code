import { llm } from "@livekit/agents";
import { z } from "zod";
import type { WhiteboardPublisher } from "./tools/whiteboard.js";
import { generateHtmlDiagram } from "./diagram/generateDiagram.js";
import { generateSceneImage } from "./scene/generateScene.js";

export function createTutorTools(wb: WhiteboardPublisher, meta: { standard?: string }) {
  const geminiKey = process.env.GEMINI_API_KEY ?? "";
  const hfToken = process.env.HF_TOKEN;

  return {
    write_title: llm.tool({
      description:
        "Write a section title on the whiteboard (≤12 words). Use $...$ for math. Do not paste lesson body text.",
      parameters: z.object({ content: z.string() }),
      execute: async ({ content }) => wb.title(content),
    }),
    write_highlight: llm.tool({
      description:
        "Write one highlighted formula or key result (≤1 line). Pass raw LaTeX WITHOUT dollar signs (e.g. E=mc^2 or \\frac{a}{b}).",
      parameters: z.object({ content: z.string() }),
      execute: async ({ content }) => wb.highlight(content),
    }),
    write_on_whiteboard: llm.tool({
      description:
        "Write a short note on the board (≤60 words). One idea only. Supports $...$ math and markdown. Never paste full lesson cards.",
      parameters: z.object({ content: z.string() }),
      execute: async ({ content }) => wb.write(content),
    }),
    show_step: llm.tool({
      description:
        "Show one numbered step (≤60 words). Use for progressive reveal instead of one long write block.",
      parameters: z.object({ number: z.number(), content: z.string() }),
      execute: async ({ number, content }) => wb.step(number, content),
    }),
    show_question: llm.tool({
      description:
        "Show one practice question on the board (≤80 words). Content may include $...$ math.",
      parameters: z.object({ content: z.string() }),
      execute: async ({ content }) => wb.question(content),
    }),
    write_code: llm.tool({
      description:
        "Show syntax-highlighted code on the board. Use a valid language id: python, javascript, typescript, java, sql, html, css, bash, etc.",
      parameters: z.object({ content: z.string(), language: z.string().optional() }),
      execute: async ({ content, language }) => wb.code(content, language ?? "text"),
    }),
    show_rich_card: llm.tool({
      description:
        "Show a compact lesson card: <h3> title + <ul> with ≤4 <li> bullets (≤2 short paragraphs max). Use $...$ for math. No inline styles. Never paste the full preloaded lesson text.",
      parameters: z.object({ title: z.string(), html: z.string() }),
      execute: async ({ title, html }) => wb.richCard(title, html),
    }),
    set_cognitive_state: llm.tool({
      description: "Set student cognitive state",
      parameters: z.object({
        state: z.enum(["FLOW", "CONFUSED", "BORED", "LOST"]),
        reason: z.string(),
      }),
      execute: async ({ state, reason }) => wb.cognitiveState(state, reason),
    }),
    add_concept_node: llm.tool({
      description: "Add a node to the knowledge graph",
      parameters: z.object({
        id: z.string(),
        label: z.string(),
        position: z.string(),
        state: z.string(),
        student_teaser: z.string().optional(),
      }),
      execute: async (p) => wb.graphAddNode(p),
    }),
    connect_concepts: llm.tool({
      description: "Connect two concept nodes",
      parameters: z.object({
        from: z.string(),
        to: z.string(),
        label: z.string().optional(),
        student_bridge: z.string().optional(),
      }),
      execute: async (p) => wb.graphConnect(p),
    }),
    update_concept_state: llm.tool({
      description: "Update a concept node state",
      parameters: z.object({ id: z.string(), state: z.string() }),
      execute: async ({ id, state }) => wb.graphSetState(id, state),
    }),
    focus_concept: llm.tool({
      description: "Pulse/focus a concept on the graph",
      parameters: z.object({ id: z.string() }),
      execute: async ({ id }) => wb.graphPulse(id),
    }),
    zoom_graph_out: llm.tool({
      description: "Zoom the knowledge graph out for synthesis",
      parameters: z.object({}),
      execute: async () => wb.graphZoomOut(),
    }),
    show_diagram: llm.tool({
      description: "Generate and show an HTML/SVG diagram",
      parameters: z.object({
        diagram_type: z.string(),
        description: z.string(),
        caption: z.string(),
      }),
      execute: async ({ diagram_type, description, caption }) => {
        await wb.diagramLoading(caption);
        const html = await generateHtmlDiagram(
          geminiKey,
          diagram_type,
          description,
          meta.standard ?? "Grade 8"
        );
        await wb.diagramReady(caption, html);
        return "Diagram displayed.";
      },
    }),
    show_scene: llm.tool({
      description: "Generate and show a scene image",
      parameters: z.object({ prompt: z.string(), caption: z.string() }),
      execute: async ({ prompt, caption }) => {
        await wb.sceneLoading(caption);
        const { dataUri, error } = await generateSceneImage(hfToken, prompt);
        await wb.sceneReady(caption, dataUri, error);
        return error ? `Scene error: ${error}` : "Scene displayed.";
      },
    }),
    end_session: llm.tool({
      description:
        "End the tutoring session. notes: GFM markdown for the student to review later — include ## Key takeaways, ## Formulas & steps (use $...$ / $$...$$ for math), and ## What we practiced. assignment: numbered homework list (5 items). Students reopen these notes from their quiz history.",
      parameters: z.object({ notes: z.string(), assignment: z.string() }),
      execute: async ({ notes, assignment }) => {
        await wb.endSession(notes, assignment);
        return "Session ended.";
      },
    }),
  };
}
