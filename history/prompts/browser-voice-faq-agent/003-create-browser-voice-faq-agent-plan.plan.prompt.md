---
id: 003
title: Create Browser Voice FAQ Agent Plan
stage: plan
date: 2026-03-26
surface: agent
model: qwen-code
feature: browser-voice-faq-agent
branch: 1-browser-voice-faq-agent
user: user
command: /sp.plan Create technical plan for browser voice FAQ agent
labels: ["plan", "voice-agent", "browser", "gemini", "edge-tts", "typescript"]
links:
  spec: specs/1-browser-voice-faq-agent/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/1-browser-voice-faq-agent/plan.md
  - specs/1-browser-voice-faq-agent/research.md
  - specs/1-browser-voice-faq-agent/data-model.md
  - specs/1-browser-voice-faq-agent/contracts/api-contracts.md
  - specs/1-browser-voice-faq-agent/quickstart.md
  - CLAUDE.md (updated agent context)
tests:
  - Constitution check: PASS (all 7 principles compliant)
  - Phase 0 research: Complete (6 decisions documented)
  - Phase 1 design: Complete (data model, contracts, quickstart)
---

## Prompt

do this 1 /sp.plan Create technical plan for browser voice FAQ agent

## Response Snapshot

Created comprehensive architecture plan for Browser Voice FAQ Agent:

**Branch**: `1-browser-voice-faq-agent`

**Plan File**: `specs/1-browser-voice-faq-agent/plan.md`

### Technical Stack Defined

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Language** | TypeScript 5.x (ES2022) | Browser-compatible, type safety |
| **STT** | Web Speech API | Free, native in Chrome/Edge |
| **LLM** | Gemini API (free tier) | 1M tokens/month, 15 RPM |
| **TTS** | Edge TTS (edge-tts-js) | Free, 400+ neural voices |
| **Storage** | localStorage | Browser-only, no backend |
| **Testing** | Vitest + Playwright | Unit + E2E browser tests |
| **Build** | Vite | Fast HMR, production optimization |

### Constitution Check: ✅ PASS (7/7)

All principles compliant:
- Free-First Stack ✅
- Latency Budget (< 5s p95) ✅
- Modular Pipeline (swappable contracts) ✅
- Test-First (contract + integration tests) ✅
- Observability (logging, metrics) ✅
- Privacy & Security (no voice persistence) ✅
- Simplicity (YAGNI, browser-only MVP) ✅

### Phase 0: Research Complete

**6 Key Decisions Documented** in `research.md`:

1. **Web Speech API Support**: Chrome/Edge primary, text fallback for Firefox
2. **Gemini API Security**: Client-side with referrer restrictions (MVP only)
3. **Edge TTS Integration**: `edge-tts-js` npm package (no Python CLI)
4. **Rate Limiting**: Client-side queue + exponential backoff (4s intervals)
5. **WCAG 2.1 AA**: ARIA live regions, keyboard nav, dual-coded status
6. **API Usage Tracking**: localStorage with monthly reset, 80% warnings

### Phase 1: Design Artifacts

**1. Data Model** (`data-model.md`):
- `FAQItem`: Q&A pairs with metadata, tags, aliases
- `VoiceSession`: Session tracking with latency breakdown
- `APIUsage`: Free tier consumption tracking
- `AppState`: Global React state management
- Zod validation schemas included

**2. API Contracts** (`contracts/api-contracts.md`):
- STT Contract: `SpeechRecognizer` interface (swappable)
- LLM Contract: `LLMService` interface (Gemini/Ollama/OpenAI)
- TTS Contract: `TTSService` interface (Edge TTS/SpeechSynthesis)
- FAQ Contract: `FAQServiceInterface` (localStorage/backend)
- Voice Pipeline: Orchestrates STT → LLM → TTS flow
- Error taxonomy: Standardized error codes across components

**3. Quickstart Guide** (`quickstart.md`):
- 7-step setup process (< 10 minutes)
- Troubleshooting section (6 common issues)
- Commands reference table
- Project structure overview

### Agent Context Updated

**File**: `CLAUDE.md`
- Added: TypeScript 5.x, localStorage
- Preserved: Existing SDD workflow instructions

### Project Structure

```
specs/1-browser-voice-faq-agent/
├── spec.md                # Feature specification ✅
├── plan.md                # Architecture plan ✅
├── research.md            # Phase 0 decisions ✅
├── data-model.md          # Entity schemas ✅
├── quickstart.md          # Setup guide ✅
├── contracts/
│   └── api-contracts.md   # API interfaces ✅
└── tasks.md               # Implementation tasks (next)

src/
├── components/            # React components
├── services/              # STT, LLM, TTS, FAQ
├── hooks/                 # State management
├── utils/                 # Helpers
└── styles/                # CSS

tests/
├── contract/              # API contract tests
├── integration/           # End-to-end flow tests
└── unit/                  # Unit tests
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
├─────────────────────────────────────────────────────────┤
│  Voice Pipeline → FAQ Service → Visual Display          │
│       ↓                                                   │
│  Voice Session Manager (state, latency, errors)          │
│       ↓                                                   │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐           │
│  │ Web      │    │ Gemini   │    │ Edge     │           │
│  │ Speech   │    │ API      │    │ TTS      │           │
│  │ API      │    │ (cloud)  │    │ (cloud)  │           │
│  └──────────┘    └──────────┘    └──────────┘           │
└─────────────────────────────────────────────────────────┘
```

### Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gemini API key exposure | High | Referrer restrictions, production backend proxy |
| Web Speech API gaps | Medium | Feature detection, text-only fallback |
| Free tier exhaustion | Medium | Usage tracking, 80% warnings, queue system |
| Latency > 5s | Medium | Streaming UI, timeout handling |
| Edge TTS reliability | Low | Fallback to SpeechSynthesis |

## Outcome

- ✅ Impact: Complete architecture plan ready for implementation
- 🧪 Tests: Constitution check PASS, all research questions resolved
- 📁 Files: 5 created (plan, research, data-model, contracts, quickstart) + 1 updated (CLAUDE.md)
- 🔁 Next prompts: Run `/sp.tasks` to create implementation tasks
- 🧠 Reflection: Plan balances free-tier constraints with production-quality architecture; all contracts are swappable per Constitution Principle III

## Evaluation Notes (Flywalker)

- Failure modes observed: None (plan creation successful)
- Graders run and results: Constitution check 7/7 PASS
- Prompt variant: N/A
- Next experiment: Implement tasks with TDD (Red-Green-Refactor)

---

**PHR Location**: `E:\voice-agent\history\prompts\browser-voice-faq-agent\003-create-browser-voice-faq-agent-plan.plan.prompt.md`
