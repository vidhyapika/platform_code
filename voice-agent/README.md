# Vidhyapika Voice Agent

LiveKit voice tutor worker. Runs **separately** from the Next.js app. Whiteboard, transcript, and session events travel over **LiveKit data messages** (no Redis or Socket.IO bridge).

## Prerequisites

- [LiveKit Cloud](https://cloud.livekit.io/) project
- [Deepgram](https://deepgram.com/) API key (STT + TTS)
- Same `GEMINI_API_KEY` as the main app
- Firestore session data via Next.js internal API (`VOICE_AGENT_SERVICE_SECRET`)

## Local development

1. Copy env and fill values (or use repo root `.env.local` — loaded automatically):

```bash
cp .env.example .env
```

2. Run the agent worker:

```bash
npm install
npm run dev
```

3. In the main app root, set matching vars in `.env.local`:

```
LIVEKIT_URL=...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
VOICE_AGENT_SERVICE_SECRET=...
DEEPGRAM_API_KEY=...
GEMINI_API_KEY=...
APP_URL=http://localhost:3000
```

4. Start Next.js: `npm run dev` (repo root).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | LiveKit agent worker (dev mode) |
| `npm run build` | Compile TypeScript |
| `npm start` | Production agent worker |

## Architecture

- **Next.js** — session create, Firestore bootstrap, LiveKit tokens
- **This package** — LiveKit agent (Gemini + tools), publishes tutor events via LiveKit data
- **Browser** — LiveKit WebRTC audio + LiveKit data (whiteboard/transcript/session end)

## Troubleshooting

1. **Student reached LiveKit Connected** — classroom connection status shows agent in room.
2. **`voice-agent` worker running** — `cd voice-agent && npm run dev`.
3. **Same LiveKit project** — keys match in root `.env.local` and voice-agent env.
4. **`VOICE_AGENT_SERVICE_SECRET` matches** — agent loads session meta from `/api/voice/internal/session-meta`.
5. **No Redis required** — if you see Redis errors, pull latest code.

### Admin testing without quiz flow

Use **Admin → Voice Lab** (`/admin/voice-lab`) to start a sandbox session with mock failed questions.
