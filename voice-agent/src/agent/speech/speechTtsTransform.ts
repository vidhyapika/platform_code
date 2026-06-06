import { ReadableStream } from "node:stream/web";
import { prepareSpokenText } from "./prepareSpokenText.js";

/** LiveKit TTS transform: sanitize each text chunk before Deepgram synthesis. */
export function spokenTextTransform(text: ReadableStream<string>): ReadableStream<string> {
  return new ReadableStream<string>({
    async start(controller) {
      const reader = text.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const cleaned = prepareSpokenText(value);
          if (cleaned) controller.enqueue(cleaned);
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      } finally {
        reader.releaseLock();
      }
    },
  });
}
