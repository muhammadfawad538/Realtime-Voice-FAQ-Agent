# Data Model: Browser Voice FAQ Agent

**Feature**: Browser Voice FAQ Agent  
**Date**: 2026-03-26  
**Source**: Derived from spec.md entities and requirements

---

## Core Entities

### FAQItem

**Description**: A question-answer pair that the voice agent uses to respond to user queries.

**Storage**: localStorage (MVP), backend database (future)

```typescript
interface FAQItem {
  // Identity
  id: string;                    // UUID v4 (e.g., "550e8400-e29b-41d4-a716-446655440000")
  
  // Content
  question: string;              // User-question phrasing (e.g., "What are your business hours?")
  answer: string;                // Business response (e.g., "We're open Mon-Fri 9am-5pm EST")
  
  // Metadata (optional)
  category?: string;             // Category for organization (e.g., "Billing", "Support", "Shipping")
  tags?: string[];               // Keywords for semantic matching (e.g., ["hours", "open", "time"])
  aliases?: string[];            // Alternative phrasings (e.g., ["When are you open?", "Business hours?"])
  
  // Lifecycle
  createdAt: number;             // Unix timestamp (milliseconds)
  updatedAt: number;             // Unix timestamp (milliseconds)
  lastUsedAt?: number;           // Last time this FAQ was matched
  usageCount: number;            // Number of times this FAQ has been matched
  
  // State
  isActive: boolean;             // Whether this FAQ is currently in use (default: true)
  priority: number;              // Match priority (higher = matched first, default: 0)
}
```

**Validation Rules**:
- `question`: Required, 5-500 characters, trimmed whitespace
- `answer`: Required, 10-2000 characters, trimmed whitespace
- `category`: Optional, 1-50 characters
- `tags`: Optional, max 10 tags, each 2-30 characters
- `aliases`: Optional, max 5 alternatives, each follows question validation

**Example**:
```json
{
  "id": "faq-001",
  "question": "What are your business hours?",
  "answer": "We're open Monday through Friday, 9:00 AM to 5:00 PM Eastern Standard Time. We're closed on weekends and major holidays.",
  "category": "General",
  "tags": ["hours", "open", "time", "schedule"],
  "aliases": ["When are you open?", "What time do you close?", "Are you open on weekends?"],
  "createdAt": 1711468800000,
  "updatedAt": 1711468800000,
  "isActive": true,
  "priority": 10,
  "usageCount": 47,
  "lastUsedAt": 1711555200000
}
```

---

### VoiceSession

**Description**: A single voice interaction from "Start Voice" to answer completion. Used for latency tracking and analytics.

**Storage**: In-memory (ephemeral, not persisted per NFR-005)

```typescript
type SessionStatus = 
  | 'idle'           // No active session
  | 'listening'      // Capturing user speech
  | 'processing'     // Sending to LLM, waiting for response
  | 'speaking'       // Playing TTS audio
  | 'complete'       // Session finished successfully
  | 'error';         // Session failed (with error details)

interface VoiceSession {
  // Identity
  id: string;                    // UUID v4 for session tracking
  
  // Timing
  startTime: number;             // Session start timestamp (Unix ms)
  endTime?: number;              // Session end timestamp (Unix ms)
  
  // Content
  transcript: string;            // User's transcribed speech (from STT)
  answer: string;                // Generated answer (from LLM)
  matchedFAQId?: string;         // ID of matched FAQ item (if applicable)
  
  // Latency Breakdown (all in milliseconds)
  latency: {
    stt: number;                 // Speech-to-text duration
    llm: number;                 // LLM processing duration (first token)
    tts: number;                 // Text-to-speech duration (first audio)
    total: number;               // End-to-end duration (startTime to answer complete)
  };
  
  // State
  status: SessionStatus;         // Current session state
  error?: {
    code: 'STT_ERROR' | 'LLM_ERROR' | 'TTS_ERROR' | 'PIPELINE_ERROR' | 'RATE_LIMITED';
    message: string;             // User-friendly error message
    retryable: boolean;          // Whether user can retry
  };
  
  // Quality Metrics
  confidence: {
    stt: number;                 // STT confidence score (0.0 - 1.0)
    match: number;               // FAQ match confidence (0.0 - 1.0)
  };
  
  // User Feedback (optional)
  feedback?: {
    helpful: boolean;            // Thumbs up/down
    comment?: string;            // Optional text feedback
  };
}
```

**State Transitions**:
```
idle ──[Start Voice]──▶ listening ──[Speech detected]──▶ processing
                            ▲                                  │
                            │                                  ▼
                            │                            speaking
                            │                                  │
                            └─────────────[Error]◀─────────────┘
                                                      │
                                                      ▼
                                                 complete
```

**Example (Complete Session)**:
```json
{
  "id": "session-20260326-001",
  "startTime": 1711555200000,
  "endTime": 1711555204500,
  "transcript": "What are your business hours?",
  "answer": "We're open Monday through Friday, 9:00 AM to 5:00 PM Eastern Standard Time.",
  "matchedFAQId": "faq-001",
  "latency": {
    "stt": 850,
    "llm": 1200,
    "tts": 1800,
    "total": 4500
  },
  "status": "complete",
  "confidence": {
    "stt": 0.95,
    "match": 0.98
  }
}
```

---

### APIUsage

**Description**: Tracks API consumption against free tier limits. Resets monthly.

**Storage**: localStorage (persistent across sessions)

```typescript
interface APIUsage {
  gemini: {
    tokensUsed: number;          // Total tokens consumed this month
    requestsCount: number;       // Total API requests this month
    lastReset: number;           // Unix timestamp of last monthly reset
    lastWarning?: number;        // Timestamp of last 80% warning (prevent spam)
  };
  edgeTTS: {
    charactersUsed: number;      // Total characters synthesized this month
  };
  
  // Metadata
  version: number;               // Schema version (for migrations)
  lastUpdated: number;           // Last update timestamp
}
```

**Monthly Reset Logic**:
```typescript
const MONTH_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

function shouldReset(lastReset: number): boolean {
  return Date.now() - lastReset > MONTH_MS;
}
```

**Warning Thresholds**:
| API | Limit | 80% Warning | 100% Action |
|-----|-------|-------------|-------------|
| Gemini | 1M tokens | 800K tokens | Queue requests, show upgrade message |
| Edge TTS | Unlimited | N/A | N/A |

**Example**:
```json
{
  "gemini": {
    "tokensUsed": 425000,
    "requestsCount": 1700,
    "lastReset": 1709251200000,
    "lastWarning": 1711468800000
  },
  "edgeTTS": {
    "charactersUsed": 125000
  },
  "version": 1,
  "lastUpdated": 1711555200000
}
```

---

### AppState

**Description**: Global application state managed by React context or similar.

**Storage**: In-memory (React state), persisted settings in localStorage

```typescript
interface AppSettings {
  // Voice Settings
  language: string;              // ISO 639-1 code (e.g., "en-US")
  voiceSpeed: number;            // TTS playback speed (0.5 - 2.0, default: 1.0)
  voiceName?: string;            // Preferred TTS voice (e.g., "en-US-JennyNeural")
  
  // Accessibility
  highContrast: boolean;         // High contrast mode for visual impairment
  reducedMotion: boolean;        // Reduce animations for motion sensitivity
  screenReaderMode: boolean;     // Optimize for screen readers
  
  // Developer
  debugMode: boolean;            // Enable verbose logging
  showLatencyMetrics: boolean;   // Display latency breakdown
  
  // Privacy
  allowAnalytics: boolean;       // Opt-in to usage analytics
}

interface AppState {
  // Session State
  currentSession: VoiceSession | null;
  sessionHistory: VoiceSession[]; // Last N sessions (for debugging)
  
  // FAQ State
  faqs: FAQItem[];               // Loaded FAQ database
  faqsLoaded: boolean;           // Whether FAQs have been loaded
  faqsLoading: boolean;          // Loading state
  
  // API State
  apiUsage: APIUsage;            // Current API usage
  isAPIKeySet: boolean;          // Whether Gemini API key is configured
  
  // Settings
  settings: AppSettings;
  
  // UI State
  isListening: boolean;          // Currently capturing speech
  isSpeaking: boolean;           // Currently playing audio
  error: Error | null;           // Current error (if any)
}
```

---

## Data Relationships

```
┌─────────────────┐
│   VoiceSession  │
└────────┬────────┘
         │
         │ matchedFAQId (optional)
         ▼
┌─────────────────┐
│    FAQItem      │
└─────────────────┘

┌─────────────────┐
│   VoiceSession  │───┐
└─────────────────┘   │
                      │ Creates/Updates
                      ▼
┌─────────────────┐
│    APIUsage     │
└─────────────────┘
```

---

## Validation Schemas (Zod)

```typescript
import { z } from 'zod';

export const FAQItemSchema = z.object({
  id: z.string().uuid(),
  question: z.string().min(5).max(500).trim(),
  answer: z.string().min(10).max(2000).trim(),
  category: z.string().max(50).optional(),
  tags: z.array(z.string().min(2).max(30)).max(10).optional(),
  aliases: z.array(z.string().min(5).max(500)).max(5).optional(),
  createdAt: z.number().positive(),
  updatedAt: z.number().positive(),
  lastUsedAt: z.number().positive().optional(),
  usageCount: z.number().nonnegative().default(0),
  isActive: z.boolean().default(true),
  priority: z.number().default(0),
});

export const VoiceSessionSchema = z.object({
  id: z.string().uuid(),
  startTime: z.number().positive(),
  endTime: z.number().positive().optional(),
  transcript: z.string(),
  answer: z.string(),
  matchedFAQId: z.string().uuid().optional(),
  latency: z.object({
    stt: z.number().nonnegative(),
    llm: z.number().nonnegative(),
    tts: z.number().nonnegative(),
    total: z.number().nonnegative(),
  }),
  status: z.enum(['idle', 'listening', 'processing', 'speaking', 'complete', 'error']),
  error: z.object({
    code: z.enum(['STT_ERROR', 'LLM_ERROR', 'TTS_ERROR', 'PIPELINE_ERROR', 'RATE_LIMITED']),
    message: z.string(),
    retryable: z.boolean(),
  }).optional(),
  confidence: z.object({
    stt: z.number().min(0).max(1),
    match: z.number().min(0).max(1),
  }),
  feedback: z.object({
    helpful: z.boolean(),
    comment: z.string().optional(),
  }).optional(),
});

export const APIUsageSchema = z.object({
  gemini: z.object({
    tokensUsed: z.number().nonnegative(),
    requestsCount: z.number().nonnegative(),
    lastReset: z.number().positive(),
    lastWarning: z.number().positive().optional(),
  }),
  edgeTTS: z.object({
    charactersUsed: z.number().nonnegative(),
  }),
  version: z.number().default(1),
  lastUpdated: z.number().positive(),
});
```

---

## localStorage Keys

```typescript
const STORAGE_KEYS = {
  FAQS: 'voice-agent-faqs',           // FAQItem[]
  API_USAGE: 'voice-agent-api-usage', // APIUsage
  SETTINGS: 'voice-agent-settings',   // AppSettings
  API_KEY: 'voice-agent-gemini-key',  // Encrypted API key (future)
};
```

---

**Next Steps**:
1. Implement TypeScript interfaces in `src/types/index.ts`
2. Create validation schemas in `src/utils/validation.ts`
3. Build localStorage wrappers in `src/utils/storage.ts`
