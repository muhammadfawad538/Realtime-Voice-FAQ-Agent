---
id: 001
title: Create Voice Agent Constitution
stage: constitution
date: 2026-03-26
surface: agent
model: qwen-code
feature: voice-agent-core
branch: main
user: user
command: Create constitution.md for free voice agent using spec-driven development
labels: ["constitution", "voice-agent", "free-stack", "gemini", "pipecat"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - N/A (constitution is foundational document)
---

## Prompt

Using spec driven development create constitution.md file for this voice agent which will complete free like using gemini api or other..

## Response Snapshot

Created comprehensive constitution for voice-agent project with free-first principles:

**Key Decisions:**
- **STT**: Web Speech API (browser, free) / Whisper (local) / Google Cloud STT (60 min free)
- **LLM**: Gemini API (1M tokens/month free) / Ollama with Llama 3 (local)
- **TTS**: Edge TTS (free) / Piper (local) / Google TTS (1M chars free)
- **Framework**: Pipecat (open-source BSD license)
- **Latency Budget**: p95 < 800ms end-to-end, interruption detection < 150ms
- **Hosting**: Local → Render/Railway free tiers → Self-hosted Kubernetes

**7 Core Principles:**
1. Free-First Stack
2. Latency Budget (NON-NEGOTIABLE)
3. Modular Pipeline (swappable components)
4. Test-First (TDD mandatory)
5. Observability & Debuggability
6. Privacy & Security (no hardcoded secrets)
7. Simplicity (YAGNI)

**Directory Structure Created:**
- `history/prompts/constitution/` — Constitution PHRs
- `history/adr/` — Architectural Decision Records
- `specs/` — Feature specifications
- `logs/` — Runtime logs

## Outcome

- ✅ Impact: Foundation established for free voice agent development
- 🧪 Tests: N/A (constitution is policy document)
- 📁 Files: 1 created (`.specify/memory/constitution.md`)
- 🔁 Next prompts: Create first feature spec (e.g., "browser voice FAQ agent")
- 🧠 Reflection: Constitution balances free-tier constraints with production-quality requirements

## Evaluation Notes (Flywheel)

- Failure modes observed: None (document creation successful)
- Graders run and results: N/A
- Prompt variant: N/A
- Next experiment: Create `specs/browser-voice-agent/spec.md` for MVP feature

---

**PHR Location**: `E:\voice-agent\history\prompts\constitution\001-create-voice-agent-constitution.constitution.prompt.md`
