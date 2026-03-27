# Voice Agent Constitution

**Version**: 1.0.0 | **Ratified**: 2026-03-26 | **Last Amended**: 2026-03-26

---

## Core Principles

### I. Free-First Stack
All components MUST prioritize free tiers, open-source, or local execution:
- **STT (Speech-to-Text)**: Web Speech API (browser), Whisper (local), or Google Cloud STT free tier (60 min/month)
- **LLM**: Gemini API free tier (15 RPM, 1M tokens/month) OR Ollama with local models (Llama 3, Phi 3)
- **TTS (Text-to-Speech)**: Edge TTS (free), Piper (local), or Google TTS free tier (1M chars/month)
- **Voice Framework**: Pipecat (open-source, BSD license) for orchestration
- **Hosting**: Local development → Render/Railway free tiers → Kubernetes (self-hosted)

### II. Latency Budget (NON-NEGOTIABLE)
End-to-end voice response MUST meet these budgets:
- **STT → LLM**: < 200ms (streaming preferred)
- **LLM → TTS**: < 300ms (first token to first audio)
- **Total p95 latency**: < 800ms for conversational flow
- **Interruption detection**: < 150ms (Voice Activity Detection)

### III. Modular Pipeline
STT, LLM, and TTS components MUST be swappable without breaking contracts:
- Each component exposes a CLI interface (stdin → stdout, errors → stderr)
- JSON + human-readable output formats supported
- Configuration via `.env` file (no hardcoded endpoints/keys)
- Component interfaces defined in `specs/<feature>/plan.md`

### IV. Test-First (NON-NEGOTIABLE)
TDD mandatory for all voice pipeline components:
- **Red**: Tests written → User approved → Tests fail
- **Green**: Minimal implementation to pass tests
- **Refactor**: Clean up without breaking tests
- **Contract tests**: Required for STT, LLM, TTS interfaces
- **Integration tests**: Required for end-to-end voice flows

### V. Observability & Debuggability
All voice interactions MUST be traceable:
- Structured logging to `logs/voice-agent.log`
- Debug mode: `DEBUG=1` enables verbose STT/LLM/TTS transcripts
- Latency metrics: Log time spent in each pipeline stage
- Error taxonomy: `STT_ERROR`, `LLM_ERROR`, `TTS_ERROR`, `PIPELINE_ERROR`

### VI. Privacy & Security
- **No hardcoded secrets**: All API keys in `.env` (git-ignored)
- **Local-first**: Default to local models; cloud APIs are opt-in
- **Data retention**: Voice recordings NOT persisted unless explicitly enabled
- **Compliance**: GDPR-ready (user data deletion on request)

### VII. Simplicity (YAGNI)
- Start with browser-based Web Speech API (simplest, free)
- Add Pipecat only when multi-provider support needed
- Add telephony (SIP/Twilio) only after browser MVP works
- No premature optimization; measure latency before optimizing

---

## Additional Constraints

### Technology Stack
| Component | Primary (Free) | Fallback (Paid) |
|-----------|---------------|-----------------|
| STT | Web Speech API / Whisper (local) | Google Cloud STT |
| LLM | Gemini API (free tier) / Ollama | OpenAI, Anthropic |
| TTS | Edge TTS / Piper (local) | Google TTS, ElevenLabs |
| Framework | Pipecat (open-source) | LiveKit Agents |
| Hosting | Local / Render free tier | Kubernetes (GCP/AWS) |

### Performance Standards
- **Concurrent users**: Support 1 concurrent voice session (MVP)
- **Uptime**: Best-effort for local; 99% for deployed (free tier)
- **Resource caps**: < 2GB RAM, < 50% CPU (local execution)

### Cost Controls
- **Gemini API**: Stay within 1M tokens/month free tier
- **Google Cloud STT/TTS**: Stay within 60 min / 1M chars free tier
- **Alert threshold**: Warn user at 80% of free tier usage

---

## Development Workflow

### Spec-Driven Flow
1. **Constitution** (this file) → Principles defined ✅
2. **Spec** (`specs/<feature>/spec.md`) → User stories, requirements
3. **Plan** (`specs/<feature>/plan.md`) → Architecture, tech decisions
4. **Tasks** (`specs/<feature>/tasks.md`) → Testable implementation items
5. **Implementation** → Red-Green-Refactor cycle
6. **PHRs** (`history/prompts/...`) → Every interaction logged
7. **ADRs** (`history/adr/...`) → Significant decisions documented

### Code Review Requirements
- All PRs MUST verify constitution compliance
- Latency tests MUST pass before merge
- No secrets committed (`.env` checked in `.gitignore`)
- PHR created for each implementation task

### Quality Gates
- [ ] All P1 user stories have passing tests
- [ ] Latency p95 < 800ms (measured in integration tests)
- [ ] No hardcoded API keys or tokens
- [ ] `.env.example` provided with placeholder values
- [ ] README includes setup instructions for free tier

---

## Governance

**Amendment Process**:
- Changes require: Updated version number + amendment date
- Breaking changes: Require ADR documenting migration path
- All amendments logged in this file's version history

**Compliance Verification**:
- Use `/sp.checklist` command before marking features complete
- Constitution violations block PR merges

**Related Files**:
- Templates: `.specify/templates/*.md`
- Commands: `.claude/commands/sp.*.md`
- History: `history/prompts/`, `history/adr/`

---

## Quick Start (Free Stack)

```bash
# 1. Set up free API keys (optional - local models work without)
cp .env.example .env
# Edit .env: Add GEMINI_API_KEY if using Gemini cloud

# 2. Install dependencies
pip install pipecat-ai edge-tts ollama

# 3. Run local LLM (optional)
ollama pull llama3

# 4. Start voice agent
python voice_agent.py
```

---

**Version**: 1.0.0 | **Ratified**: 2026-03-26 | **Last Amended**: 2026-03-26
