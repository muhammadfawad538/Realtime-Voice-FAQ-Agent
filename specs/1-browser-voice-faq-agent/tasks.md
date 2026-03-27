# Tasks: Browser Voice FAQ Agent

**Input**: Design documents from `specs/1-browser-voice-faq-agent/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Contract tests and integration tests INCLUDED (TDD approach per Constitution Principle IV)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project structure per implementation plan (src/, tests/, public/)
- [X] T002 [P] Initialize TypeScript project with Vite, React, and dependencies in package.json
- [X] T003 [P] Configure ESLint, Prettier, and TypeScript in tsconfig.json
- [X] T004 [P] Create .env.example with VITE_GEMINI_API_KEY placeholder
- [X] T005 [P] Create .gitignore with .env, node_modules, dist/ entries
- [X] T006 [P] Setup Vitest configuration in vite.config.ts
- [X] T007 [P] Setup Playwright for E2E tests in playwright.config.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 [P] Create TypeScript types in src/types/index.ts (FAQItem, VoiceSession, APIUsage, AppState)
- [X] T009 [P] Create validation schemas in src/utils/validation.ts (Zod schemas for all types)
- [X] T010 [P] Implement localStorage wrappers in src/utils/storage.ts (get/set with error handling)
- [X] T011 [P] Create error taxonomy in src/utils/errors.ts (STTError, LLMError, TTSError types)
- [X] T012 [P] Implement logging utility in src/utils/logger.ts (debug, info, warn, error with timestamps)
- [X] T013 [P] Create latency tracker in src/utils/latency-logger.ts (performance.mark/measure wrappers)
- [ ] T014 [P] Setup React context in src/context/AppContext.tsx (global state management)
- [ ] T015 [P] Create API usage tracker in src/services/APIUsageTracker.ts (localStorage-based tracking)
- [X] T016 [P] Implement rate limiter in src/utils/rate-limiter.ts (4-second intervals for Gemini API)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Voice Question & Answer (Priority: P1) 🎯 MVP

**Goal**: Users can ask questions via voice and hear spoken answers

**Independent Test**: User clicks "Start Voice", asks "What are your business hours?", hears answer within 5 seconds

### Tests for User Story 1 (TDD - Write FIRST) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T017 [P] [US1] Contract test for STT service in tests/contract/stt-contract.test.ts
- [ ] T018 [P] [US1] Contract test for LLM service in tests/contract/llm-contract.test.ts
- [ ] T019 [P] [US1] Contract test for TTS service in tests/contract/tts-contract.test.ts
- [ ] T020 [P] [US1] Integration test for complete voice flow in tests/integration/voice-flow.integration.test.ts

### Implementation for User Story 1

#### STT Layer (Web Speech API)
- [ ] T021 [P] [US1] Create STT contract interface in src/services/stt/stt-contract.ts
- [ ] T022 [P] [US1] Implement WebSpeechRecognizer in src/services/stt/WebSpeechRecognizer.ts
- [ ] T023 [US1] Add browser feature detection in src/services/stt/browser-detection.ts
- [ ] T024 [US1] Create text-only fallback component for unsupported browsers

#### LLM Layer (Gemini API)
- [ ] T025 [P] [US1] Create LLM contract interface in src/services/llm/llm-contract.ts
- [ ] T026 [P] [US1] Implement GeminiService in src/services/llm/GeminiService.ts
- [ ] T027 [US1] Add FAQ system prompt in src/prompts/faq-system-prompt.ts
- [ ] T028 [US1] Implement token usage tracking in GeminiService

#### TTS Layer (Edge TTS)
- [ ] T029 [P] [US1] Create TTS contract interface in src/services/tts/tts-contract.ts
- [ ] T030 [P] [US1] Implement EdgeTTSService in src/services/tts/EdgeTTSService.ts
- [ ] T031 [US1] Add SpeechSynthesis fallback in src/services/tts/BrowserTTSService.ts
- [ ] T032 [US1] Create TTS voice selector utility in src/services/tts/voice-selector.ts

#### FAQ Service
- [ ] T033 [P] [US1] Create FAQ contract interface in src/services/FAQService.ts
- [ ] T034 [P] [US1] Implement LocalStorageFAQService in src/services/LocalStorageFAQService.ts
- [ ] T035 [US1] Add sample FAQ data in src/data/sample-faqs.ts (20 Q&A pairs)
- [ ] T036 [US1] Implement FAQ matching algorithm (keyword + semantic similarity)

#### Voice Pipeline (Orchestration)
- [ ] T037 [US1] Implement VoicePipeline in src/services/VoicePipeline.ts (STT → LLM → TTS flow)
- [ ] T038 [US1] Add state machine for pipeline states (listening/processing/speaking/complete)
- [ ] T039 [US1] Implement error recovery and retry logic in VoicePipeline
- [ ] T040 [US1] Add latency tracking for each pipeline stage

#### UI Components (Voice Interaction)
- [ ] T041 [P] [US1] Create VoiceButton component in src/components/VoiceButton.tsx
- [ ] T042 [P] [US1] Create StatusIndicator component in src/components/StatusIndicator.tsx
- [ ] T043 [US1] Create TranscriptDisplay component in src/components/TranscriptDisplay.tsx
- [ ] T044 [US1] Create AnswerDisplay component in src/components/AnswerDisplay.tsx
- [ ] T045 [US1] Create main VoiceAgent container in src/components/VoiceAgent.tsx

#### Hooks (State Management)
- [ ] T046 [P] [US1] Create useVoiceSession hook in src/hooks/useVoiceSession.ts
- [ ] T047 [P] [US1] Create useAPIUsage hook in src/hooks/useAPIUsage.ts
- [ ] T048 [US1] Create useAccessibility hook in src/hooks/useAccessibility.ts

#### Entry Point
- [ ] T049 [US1] Create main App component in src/App.tsx (integrates all components)
- [ ] T050 [US1] Create index.html entry point in public/index.html
- [ ] T051 [US1] Add basic CSS styling in src/styles/voice-agent.css

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently
- ✅ Voice input via Web Speech API
- ✅ FAQ matching and Gemini-powered answers
- ✅ Voice output via Edge TTS
- ✅ Visual feedback (transcript + answer display)
- ✅ All contract tests passing
- ✅ Integration test passing (end-to-end voice flow)

---

## Phase 4: User Story 2 - Visual Feedback & Transcript (Priority: P2)

**Goal**: Users can see real-time transcription and text-based Q&A for accessibility

**Independent Test**: User can type a question in a text box and see the answer displayed as text (no voice required)

### Tests for User Story 2 (TDD - Write FIRST) ⚠️

- [ ] T052 [P] [US2] Unit test for TranscriptDisplay component in tests/unit/components/TranscriptDisplay.test.tsx
- [ ] T053 [P] [US2] Unit test for AnswerDisplay component in tests/unit/components/AnswerDisplay.test.tsx
- [ ] T054 [US2] Integration test for text-only mode in tests/integration/text-mode.integration.test.ts
- [ ] T055 [US2] Accessibility test (WCAG 2.1 AA) in tests/integration/accessibility.test.ts

### Implementation for User Story 2

#### Text Input Components
- [ ] T056 [P] [US2] Create TextInput component in src/components/TextInput.tsx
- [ ] T057 [P] [US2] Create TextModeToggle component in src/components/TextModeToggle.tsx
- [ ] T058 [US2] Add text input handler in src/services/TextModeService.ts

#### Accessibility Enhancements
- [ ] T059 [P] [US2] Add ARIA live regions in src/components/AriaLiveRegions.tsx
- [ ] T060 [P] [US2] Implement keyboard navigation in src/utils/keyboard-nav.ts
- [ ] T061 [US2] Add focus management in src/hooks/useFocusManagement.ts
- [ ] T062 [US2] Implement high contrast mode in src/styles/high-contrast.css
- [ ] T063 [US2] Add reduced motion support in src/styles/reduced-motion.css

#### Visual State Indicators
- [ ] T064 [P] [US2] Create visual state icons in src/components/StateIcons.tsx (listening/processing/speaking)
- [ ] T065 [US2] Add color + shape dual-coding in src/styles/accessibility-states.css
- [ ] T066 [US2] Implement screen reader announcements in src/components/ScreenReaderAnnouncer.tsx

#### Transcript Enhancements
- [ ] T067 [US2] Add real-time transcript streaming in src/services/TranscriptStreamer.ts
- [ ] T068 [US2] Implement transcript highlighting (current word) in src/components/TranscriptHighlight.tsx
- [ ] T069 [US2] Add transcript edit capability (fix STT errors) in src/components/EditableTranscript.tsx

#### Session History Display
- [ ] T070 [P] [US2] Create SessionHistory component in src/components/SessionHistory.tsx
- [ ] T071 [US2] Add scroll-to-bottom auto-scroll in src/hooks/useAutoScroll.ts
- [ ] T072 [US2] Implement clear history function in src/services/HistoryService.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently
- ✅ Voice mode (US1) fully functional
- ✅ Text-only mode (US2) fully functional
- ✅ Accessibility features (ARIA, keyboard nav, high contrast)
- ✅ Real-time transcript with visual feedback
- ✅ All accessibility tests passing

---

## Phase 5: User Story 3 - FAQ Management Interface (Priority: P3)

**Goal**: Business owners can update FAQ questions and answers

**Independent Test**: Admin can add a new Q&A pair via form, and the agent answers the new question correctly

### Tests for User Story 3 (TDD - Write FIRST) ⚠️

- [ ] T073 [P] [US3] Unit test for FAQAdmin component in tests/unit/components/FAQAdmin.test.tsx
- [ ] T074 [P] [US3] Unit test for FAQForm component in tests/unit/components/FAQForm.test.tsx
- [ ] T075 [US3] Integration test for FAQ CRUD operations in tests/integration/faq-crud.integration.test.ts

### Implementation for User Story 3

#### Admin Components
- [ ] T076 [P] [US3] Create FAQAdmin component in src/components/FAQAdmin.tsx (admin dashboard)
- [ ] T077 [P] [US3] Create FAQList component in src/components/FAQList.tsx (display all FAQs)
- [ ] T078 [P] [US3] Create FAQForm component in src/components/FAQForm.tsx (add/edit form)
- [ ] T079 [US3] Create FAQItemCard component in src/components/FAQItemCard.tsx (individual FAQ display)

#### CRUD Operations
- [ ] T080 [P] [US3] Implement FAQ create operation in LocalStorageFAQService
- [ ] T081 [P] [US3] Implement FAQ read operation in LocalStorageFAQService
- [ ] T082 [P] [US3] Implement FAQ update operation in LocalStorageFAQService
- [ ] T083 [US3] Implement FAQ delete operation in LocalStorageFAQService
- [ ] T084 [US3] Add FAQ validation in src/utils/faq-validation.ts

#### Import/Export
- [ ] T085 [P] [US3] Implement FAQ export to JSON in src/services/FAQExportService.ts
- [ ] T086 [US3] Implement FAQ import from JSON in src/services/FAQImportService.ts
- [ ] T087 [US3] Add bulk upload capability in src/components/FAQBulkUpload.tsx

#### Admin UI Features
- [ ] T088 [US3] Add FAQ search/filter in src/components/FAQSearch.tsx
- [ ] T089 [US3] Add FAQ category filter in src/components/FAQCategoryFilter.tsx
- [ ] T090 [US3] Implement FAQ usage statistics display in src/components/FAQUsageStats.tsx
- [ ] T091 [US3] Add FAQ reorder (drag-and-drop) in src/components/FAQReorder.tsx

#### Admin Access (Simple - No Auth for MVP)
- [ ] T092 [US3] Create admin toggle button in src/components/AdminToggle.tsx (bottom-right corner)
- [ ] T093 [US3] Add admin confirmation dialog in src/components/AdminConfirmDialog.tsx
- [ ] T094 [US3] Store admin mode in localStorage in src/services/AdminSettingsService.ts

**Checkpoint**: All user stories should now be independently functional
- ✅ Voice Q&A (US1)
- ✅ Visual feedback + accessibility (US2)
- ✅ FAQ management (US3)
- ✅ All CRUD tests passing

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T095 [P] Create README.md with setup instructions (copy from quickstart.md)
- [ ] T096 [P] Create .env.example with all environment variables documented
- [ ] T097 [P] Add production build configuration in vite.config.ts
- [ ] T098 [P] Create deployment guide in docs/deployment.md
- [ ] T099 Code cleanup and refactoring (remove unused code, improve naming)
- [ ] T100 [P] Add comprehensive JSDoc comments in src/
- [ ] T101 Performance optimization (code splitting, lazy loading in src/App.tsx)
- [ ] T102 [P] Add additional unit tests in tests/unit/services/ and tests/unit/utils/
- [ ] T103 Security hardening (input sanitization, XSS prevention in src/utils/sanitize.ts)
- [ ] T104 [P] Create CHANGELOG.md with version history
- [ ] T105 Run quickstart.md validation (follow all steps, verify working)
- [ ] T106 [P] Add license file (MIT per constitution open-source principle)
- [ ] T107 [P] Create CONTRIBUTING.md with development guidelines

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent of US1/US2

### Within Each User Story

1. **Tests FIRST** (if included): Write contract/integration tests, ensure they FAIL
2. **Models/Types**: Create data structures and validation
3. **Services**: Implement business logic
4. **Components**: Build UI layer
5. **Integration**: Connect services to components
6. **Story-complete**: Run all tests, verify independent functionality

### Parallel Opportunities

**Phase 1 (Setup)** - All tasks can run in parallel:
- T002, T003, T004, T005, T006, T007 can all be done simultaneously

**Phase 2 (Foundational)** - Most tasks can run in parallel:
- T008, T009, T010, T011, T012, T013, T014, T015, T016 can all be done simultaneously

**Phase 3 (US1)** - Parallel within layers:
- Tests (T017, T018, T019, T020) can run in parallel
- STT services (T021, T022, T023, T024) can run in parallel
- LLM services (T025, T026, T027, T028) can run in parallel
- TTS services (T029, T030, T031, T032) can run in parallel
- FAQ services (T033, T034, T035, T036) can run in parallel
- UI components (T041, T042, T043, T044) can run in parallel
- Hooks (T046, T047, T048) can run in parallel

**Phase 4 (US2)** - Parallel within layers:
- Tests (T052, T053, T054, T055) can run in parallel
- Text components (T056, T057, T058) can run in parallel
- Accessibility (T059, T060, T061, T062, T063) can run in parallel

**Phase 5 (US3)** - Parallel within layers:
- Tests (T073, T074, T075) can run in parallel
- Admin components (T076, T077, T078, T079) can run in parallel
- CRUD operations (T080, T081, T082, T083) can run in parallel

**Cross-Story Parallel**:
- Once Phase 2 completes, US1, US2, and US3 can be developed in parallel by different developers

---

## Parallel Example: User Story 1

```bash
# Launch all contract tests for User Story 1 together:
npm run test:contract -- stt-contract &
npm run test:contract -- llm-contract &
npm run test:contract -- tts-contract &
wait

# Launch all service implementations in parallel:
# File 1: src/services/stt/WebSpeechRecognizer.ts
# File 2: src/services/llm/GeminiService.ts
# File 3: src/services/tts/EdgeTTSService.ts
# File 4: src/services/LocalStorageFAQService.ts

# Launch all UI components in parallel:
# File 1: src/components/VoiceButton.tsx
# File 2: src/components/StatusIndicator.tsx
# File 3: src/components/TranscriptDisplay.tsx
# File 4: src/components/AnswerDisplay.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete **Phase 1**: Setup (T001-T007)
2. Complete **Phase 2**: Foundational (T008-T016) - **CRITICAL BLOCKER**
3. Complete **Phase 3**: User Story 1 (T017-T051)
4. **STOP and VALIDATE**:
   - Run: `npm run test:contract` (all contract tests must pass)
   - Run: `npm run test:e2e voice-flow` (integration test must pass)
   - Manual test: Voice interaction in Chrome/Edge
5. **Deploy MVP** to staging for demo

### Incremental Delivery

1. **Foundation** (T001-T016): Core types, utilities, infrastructure
2. **MVP Release** (add T017-T051): Voice Q&A functional
   - Deploy to production with basic FAQ set
   - Gather user feedback on voice interaction
3. **Accessibility Release** (add T052-T072): Text mode + WCAG compliance
   - Deploy text-only mode for Firefox/Safari users
   - Ensure WCAG 2.1 AA compliance
4. **Admin Release** (add T073-T094): FAQ management
   - Enable business owners to update FAQs
   - Add import/export for bulk FAQ management

### Parallel Team Strategy

With multiple developers:

1. **Team completes Phase 1 + Phase 2 together** (foundation)
2. **Once Phase 2 is done**, split into parallel tracks:
   - **Developer A**: User Story 1 (T017-T051) - Voice pipeline
   - **Developer B**: User Story 2 (T052-T072) - Accessibility + visual feedback
   - **Developer C**: User Story 3 (T073-T094) - FAQ management
3. **Each developer** completes their story independently
4. **Integration**: All stories work together, no conflicts
5. **Phase 6**: Polish tasks distributed among team

---

## Task Summary

| Phase | Description | Task Count |
|-------|-------------|------------|
| Phase 1 | Setup | 7 tasks |
| Phase 2 | Foundational | 9 tasks |
| Phase 3 | User Story 1 (P1 - MVP) | 35 tasks (4 tests + 31 implementation) |
| Phase 4 | User Story 2 (P2) | 21 tasks (4 tests + 17 implementation) |
| Phase 5 | User Story 3 (P3) | 22 tasks (3 tests + 19 implementation) |
| Phase 6 | Polish | 13 tasks |
| **Total** | **All phases** | **107 tasks** |

### MVP Scope (User Story 1 Only)
- **Minimum**: T001-T051 (51 tasks)
- **Deliverable**: Voice FAQ agent with basic visual feedback

### Full Feature Scope
- **Complete**: T001-T107 (107 tasks)
- **Deliverable**: Production-ready voice agent with accessibility + admin panel

---

## Notes

- **[P]** tasks = different files, no dependencies, can run in parallel
- **[Story]** label maps task to specific user story for traceability
- Each user story should be **independently completable and testable**
- **Verify tests fail** before implementing (TDD principle)
- **Commit after each task** or logical group
- **Stop at checkpoints** to validate story independently
- **Avoid**: vague tasks, same file conflicts, cross-story dependencies that break independence

---

**Next Steps**:
1. Review and approve this task breakdown
2. Run `/sp.checklist` to create quality checklist
3. Run `/sp.implement` to start implementation (Phase 1 → Phase 2 → Phase 3...)
