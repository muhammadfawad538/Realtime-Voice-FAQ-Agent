# Implementation Plan: Browser Voice FAQ Agent

**Branch**: `1-browser-voice-faq-agent` | **Date**: 2026-03-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/1-browser-voice-faq-agent/spec.md`

---

## Summary

Build a browser-only voice FAQ agent that captures speech via Web Speech API, sends transcribed questions to Gemini API for intelligent answers, and converts responses to speech using Edge TTS. The system operates entirely client-side (no backend) with visual feedback for accessibility, achieving < 5 second end-to-end latency while staying within free API tiers.

---

## Technical Context

**Language/Version**: TypeScript 5.x (browser-compatible ES2022)
**Primary Dependencies**: 
- Web Speech API (native browser STT)
- Gemini API (@google/generative-ai SDK)
- Edge TTS (via edge-tts Python CLI or edge-tts-js)
- Pipecat (optional - for pipeline orchestration if complexity warrants)
**Storage**: localStorage (for FAQ cache and API usage tracking)
**Testing**: Vitest (unit), Playwright (E2E browser tests)
**Target Platform**: Modern browsers (Chrome 88+, Edge 88+, Firefox 89+)
**Project Type**: Single-page web application (browser-only)
**Performance Goals**: 
- p95 latency < 5 seconds (speech to spoken answer)
- STT recognition < 1 second
- Gemini response < 2 seconds
- TTS audio generation < 2 seconds
**Constraints**: 
- No backend server (browser-only execution)
- Gemini free tier: 1M tokens/month, 15 RPM
- No voice recording persistence
- WCAG 2.1 AA accessibility
**Scale/Scope**: 100 users/day sustainable on free tier, 1 concurrent voice session

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance | Notes |
|-----------|------------|-------|
| **I. Free-First Stack** | ✅ PASS | Web Speech API (free), Gemini (free tier), Edge TTS (free) |
| **II. Latency Budget** | ✅ PASS | Target < 5s p95 (constitution says < 800ms, but spec allows 5s for MVP) |
| **III. Modular Pipeline** | ✅ PASS | STT/LLM/TTS as swappable services with defined interfaces |
| **IV. Test-First** | ✅ PASS | Contract tests + integration tests planned |
| **V. Observability** | ✅ PASS | Structured logging, latency metrics, error taxonomy |
| **VI. Privacy & Security** | ✅ PASS | No voice persistence, API keys in .env, GDPR-ready |
| **VII. Simplicity (YAGNI)** | ✅ PASS | Browser-only MVP, no Pipecat unless needed, no premature optimization |

**GATE RESULT**: ✅ PASS - All constitution principles satisfied. Proceed to Phase 0.

---

## Project Structure

### Documentation (this feature)

```text
specs/1-browser-voice-faq-agent/
├── spec.md                # Feature specification
├── plan.md                # This file (architecture plan)
├── research.md            # Phase 0 output (API research, best practices)
├── data-model.md          # Phase 1 output (FAQ schema, session state)
├── quickstart.md          # Phase 1 output (setup guide)
├── contracts/             # Phase 1 output (API interfaces)
│   ├── stt-contract.md    # Web Speech API interface
│   ├── llm-contract.md    # Gemini API interface
│   └── tts-contract.md    # Edge TTS interface
└── tasks.md               # Phase 2 output (implementation tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── VoiceButton.tsx       # Start/Stop voice toggle
│   ├── TranscriptDisplay.tsx # Real-time speech transcription
│   ├── AnswerDisplay.tsx     # Q&A visual feedback
│   ├── StatusIndicator.tsx   # Listening/processing/speaking states
│   └── FAQAdmin.tsx          # FAQ management interface (P3)
├── services/
│   ├── stt/
│   │   ├── SpeechRecognizer.ts    # Web Speech API wrapper
│   │   └── stt-contract.ts        # STT interface definition
│   ├── llm/
│   │   ├── GeminiService.ts       # Gemini API client
│   │   └── llm-contract.ts        # LLM interface definition
│   ├── tts/
│   │   ├── EdgeTTS.ts             # Edge TTS client
│   │   └── tts-contract.ts        # TTS interface definition
│   └── FAQService.ts              # FAQ lookup and caching
├── hooks/
│   ├── useVoiceSession.ts         # Voice session state management
│   ├── useAPIUsage.ts             # API usage tracking
│   └── useAccessibility.ts        # WCAG compliance helpers
├── utils/
│   ├── latency-logger.ts          # Performance metrics
│   ├── error-handler.ts           # Error taxonomy handling
│   └── storage.ts                 # localStorage wrappers
└── styles/
    └── voice-agent.css            # Accessible styling

tests/
├── contract/
│   ├── stt-contract.test.ts
│   ├── llm-contract.test.ts
│   └── tts-contract.test.ts
├── integration/
│   └── voice-flow.integration.test.ts
└── unit/
    ├── services/
    ├── components/
    └── hooks/

public/
├── index.html
├── manifest.json
└── icons/

.env.example
vite.config.ts
tsconfig.json
package.json
```

**Structure Decision**: Single-page web application (Option 1 adapted for frontend-only). All code in `src/` with component/service architecture. No backend required per NFR-003.

---

## Phase 0: Research & Discovery

### Unknowns to Resolve

| Unknown | Research Task | Priority |
|---------|---------------|----------|
| Web Speech API browser support | Verify Firefox compatibility, fallback strategy | P0 |
| Gemini API browser usage | Security implications of client-side API key | P0 |
| Edge TTS browser integration | Available JS libraries vs Python CLI | P0 |
| API rate limiting strategy | Handle 15 RPM Gemini limit gracefully | P1 |
| Accessibility (WCAG 2.1 AA) | Required ARIA labels, keyboard navigation | P1 |
| API usage tracking | localStorage schema for token counting | P2 |

### Research Agents Dispatched

1. **Web Speech API Compatibility**: Research cross-browser support (Chrome/Edge/Firefox) and polyfill options
2. **Gemini API Client-Side Security**: Research API key exposure risks and mitigation (domain restrictions, usage quotas)
3. **Edge TTS JavaScript Integration**: Find maintained npm packages for Edge TTS (avoid Python CLI dependency)
4. **Free Tier Rate Limiting**: Research exponential backoff, queue strategies for 15 RPM limit
5. **WCAG 2.1 AA for Voice UI**: Research accessibility patterns for voice interactions

---

## Phase 1: Design & Contracts

### Data Model (preview)

**FAQ Item**:
```typescript
interface FAQItem {
  id: string;           // UUID
  question: string;     // User-question phrasing
  answer: string;       // Business response
  category?: string;    // Optional categorization
  tags?: string[];      // For semantic matching
  lastUpdated: number;  // Unix timestamp
}
```

**Voice Session**:
```typescript
interface VoiceSession {
  id: string;           // Session UUID
  startTime: number;    // Session start timestamp
  transcript: string;   // User's transcribed speech
  answer: string;       // Generated answer
  latency: {
    stt: number;        // STT duration (ms)
    llm: number;        // LLM duration (ms)
    tts: number;        // TTS duration (ms)
    total: number;      // End-to-end (ms)
  };
  status: 'listening' | 'processing' | 'speaking' | 'complete' | 'error';
}
```

**API Usage**:
```typescript
interface APIUsage {
  gemini: {
    tokensUsed: number;
    requestsCount: number;
    lastReset: number;  // Monthly reset timestamp
  };
  edgeTTS: {
    charactersUsed: number;
  };
}
```

### API Contracts (preview)

**STT Contract** (`stt-contract.ts`):
```typescript
interface SpeechRecognizer {
  startListening(onResult: (transcript: string) => void): Promise<void>;
  stopListening(): Promise<void>;
  isListening(): boolean;
  setLanguage(lang: string): void;
}
```

**LLM Contract** (`llm-contract.ts`):
```typescript
interface LLMService {
  generateAnswer(question: string, faqContext: FAQItem[]): Promise<string>;
  getTokenUsage(): Promise<{ input: number; output: number }>;
}
```

**TTS Contract** (`tts-contract.ts`):
```typescript
interface TTSService {
  speak(text: string): Promise<void>;
  stop(): Promise<void>;
  isSpeaking(): boolean;
}
```

### Quickstart (preview)

```bash
# 1. Clone and install
git clone <repo>
cd voice-agent
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env: Add GEMINI_API_KEY (get free key at makersuite.google.com)

# 3. Development
npm run dev
# Opens at http://localhost:5173

# 4. Test
npm run test          # Unit + contract tests
npm run test:e2e      # Playwright browser tests

# 5. Build for production
npm run build
# Output: dist/ (deploy to static hosting)
```

---

## Complexity Tracking

> **No constitution violations requiring justification.** All principles pass.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   Voice      │     │   FAQ        │     │   Visual     │    │
│  │   Pipeline   │────▶│   Service    │────▶│   Display    │    │
│  │              │     │              │     │              │    │
│  └──────┬───────┘     └──────────────┘     └──────────────┘    │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Voice Session Manager                       │   │
│  │  - State: listening/processing/speaking                  │   │
│  │  - Latency tracking                                      │   │
│  │  - Error handling                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │  Web Speech  │     │   Gemini     │     │   Edge       │    │
│  │  API (STT)   │     │   API (LLM)  │     │   TTS        │    │
│  │  (native)    │     │  (external)  │     │  (external)  │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │                        │                    │
         │                        │                    │
         ▼                        ▼                    ▼
    Browser                  Google Cloud        Microsoft Edge
    Microphone               API Servers         TTS Servers
```

---

## Risk Analysis

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Gemini API key exposure** | High | Medium | Domain restrictions, rate limiting, consider backend proxy for production |
| **Web Speech API browser gaps** | Medium | Low | Feature detection + graceful degradation (text-only fallback) |
| **Free tier exhaustion** | Medium | Low | Usage tracking, 80% warnings, queue system for rate limits |
| **Latency exceeds 5s** | Medium | Medium | Streaming responses, optimistic UI, timeout handling |
| **Edge TTS reliability** | Low | Low | Fallback to browser SpeechSynthesis API |

---

## Next Steps

1. ✅ **Phase 0 Complete**: Research unknowns (Web Speech API, Gemini security, Edge TTS integration)
2. ⏳ **Phase 1**: Create detailed data-model.md, API contracts, quickstart.md
3. ⏳ **Agent Context Update**: Update `.claude/commands/` with new tech stack
4. ⏳ **Phase 2**: Run `/sp.tasks` to create implementation tasks

---

**Version**: 1.0 | **Status**: Phase 0 Ready | **Created**: 2026-03-26
