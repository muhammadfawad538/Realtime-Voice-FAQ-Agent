# API Contracts: Browser Voice FAQ Agent

**Feature**: Browser Voice FAQ Agent  
**Date**: 2026-03-26  
**Purpose**: Define swappable interfaces for STT, LLM, and TTS components (Constitution Principle III)

---

## Contract 1: Speech-to-Text (STT)

**File**: `src/services/stt/stt-contract.ts`

**Implementation**: Web Speech API (Chrome/Edge), with text fallback for Firefox

```typescript
/**
 * STT Service Contract
 * 
 * Captures user speech and converts to transcribed text.
 * Must be swappable (Web Speech API → Whisper → Google Cloud STT)
 */

/** Events emitted by STT service */
type STTEvent = 
  | { type: 'start' }
  | { type: 'result'; transcript: string; isFinal: boolean; confidence: number }
  | { type: 'end'; transcript: string }
  | { type: 'error'; error: STTError };

/** STT Error taxonomy */
interface STTError {
  code: 'NOT_SUPPORTED' | 'NOT_ALLOWED' | 'NO_SPEECH' | 'ABORTED' | 'NETWORK';
  message: string;
  retryable: boolean;
}

/** STT Service Interface */
interface SpeechRecognizer {
  /**
   * Start listening for speech
   * @param onEvent - Event callback for results and errors
   * @param options - Recognition options
   */
  startListening(
    onEvent: (event: STTEvent) => void,
    options?: STTOptions
  ): Promise<void>;

  /**
   * Stop listening (graceful - processes partial transcript)
   */
  stopListening(): Promise<void>;

  /**
   * Abort listening immediately (discards partial transcript)
   */
  abortListening(): Promise<void>;

  /**
   * Check if currently listening
   */
  isListening(): boolean;

  /**
   * Set recognition language
   * @param language - BCP 47 language tag (e.g., "en-US")
   */
  setLanguage(language: string): void;

  /**
   * Get current language
   */
  getLanguage(): string;

  /**
   * Check if STT is supported in current browser
   */
  isSupported(): boolean;
}

/** Recognition options */
interface STTOptions {
  language?: string;        // BCP 47 tag (default: "en-US")
  continuous?: boolean;     // Continue after first result (default: false)
  interimResults?: boolean; // Return interim results (default: true)
  timeout?: number;         // Silence timeout in ms (default: 10000)
}

/** STT Service Factory */
interface STTServiceFactory {
  create(): SpeechRecognizer;
  isSupported(): boolean;
  getSupportedLanguages(): string[];
}
```

**Implementation Notes**:
- Web Speech API returns interim results (confidence scores) before final
- Handle `speechend` event for automatic silence detection
- Firefox fallback: return `NOT_SUPPORTED` error, trigger text-only mode

**Example Usage**:
```typescript
const stt = new WebSpeechRecognizer();

stt.startListening((event) => {
  if (event.type === 'result') {
    console.log('Transcript:', event.transcript);
    console.log('Confidence:', event.confidence);
  }
  if (event.type === 'end') {
    console.log('Final transcript:', event.transcript);
  }
  if (event.type === 'error') {
    console.error('STT Error:', event.error);
  }
}, { language: 'en-US', interimResults: true });

// Stop after user finishes speaking
await stt.stopListening();
```

---

## Contract 2: Large Language Model (LLM)

**File**: `src/services/llm/llm-contract.ts`

**Implementation**: Gemini API (free tier), swappable to Ollama (local) or OpenAI

```typescript
/**
 * LLM Service Contract
 * 
 * Generates FAQ answers from user questions.
 * Must be swappable (Gemini → Ollama → OpenAI)
 */

/** LLM Error taxonomy */
interface LLMError {
  code: 'RATE_LIMITED' | 'AUTH_ERROR' | 'TIMEOUT' | 'INVALID_REQUEST' | 'SERVICE_UNAVAILABLE';
  message: string;
  retryable: boolean;
  retryAfter?: number; // Seconds until retry (for 429)
}

/** Token usage tracking */
interface TokenUsage {
  input: number;   // Input tokens (question + context)
  output: number;  // Output tokens (answer)
  total: number;   // Total tokens consumed
}

/** LLM Request */
interface LLMRequest {
  prompt: string;                    // User question
  context?: string;                  // FAQ context (optional)
  systemPrompt?: string;             // System instructions (optional)
  maxTokens?: number;                // Max output tokens (default: 500)
  temperature?: number;              // Creativity (0.0-1.0, default: 0.3 for FAQ)
  timeout?: number;                  // Request timeout in ms (default: 10000)
}

/** LLM Response */
interface LLMResponse {
  text: string;                      // Generated answer
  usage: TokenUsage;                 // Token consumption
  model: string;                     // Model used (e.g., "gemini-pro")
  finishReason: 'STOP' | 'LENGTH' | 'SAFETY' | 'ERROR';
}

/** LLM Service Interface */
interface LLMService {
  /**
   * Generate answer from question
   * @param request - LLM request with prompt and options
   * @returns Generated response
   */
  generateAnswer(request: LLMRequest): Promise<LLMResponse>;

  /**
   * Get current token usage (for free tier tracking)
   */
  getTokenUsage(): Promise<TokenUsage>;

  /**
   * Reset token usage counter (for monthly reset)
   */
  resetTokenUsage(): void;

  /**
   * Check if service is healthy
   */
  isHealthy(): Promise<boolean>;

  /**
   * Set API key (if not using environment variable)
   */
  setApiKey(key: string): void;
}

/** LLM Service Factory */
interface LLMServiceFactory {
  create(apiKey?: string): LLMService;
  isAvailable(): boolean;
}
```

**System Prompt for FAQ Agent** (default):
```
You are a helpful FAQ assistant. Answer questions concisely and accurately 
based on the provided FAQ context. If the answer is not in the FAQ context, 
say "I don't have information about that. Would you like to contact support?" 
Keep answers under 100 words. Be friendly and professional.
```

**Example Usage**:
```typescript
const llm = new GeminiService(apiKey);

const response = await llm.generateAnswer({
  prompt: "What are your business hours?",
  context: "Q: What are your business hours? A: Mon-Fri 9am-5pm EST",
  systemPrompt: FAQ_SYSTEM_PROMPT,
  maxTokens: 200,
  temperature: 0.3,
  timeout: 10000,
});

console.log('Answer:', response.text);
console.log('Tokens used:', response.usage.total);
```

**Rate Limiting Helper**:
```typescript
class RateLimitedLLMService implements LLMService {
  private queue: Array<() => Promise<LLMResponse>> = [];
  private processing = false;
  private readonly MIN_INTERVAL = 4000; // 4 seconds between requests

  async generateAnswer(request: LLMRequest): Promise<LLMResponse> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        const waitTime = Math.max(0, this.MIN_INTERVAL - (Date.now() - this.lastRequest));
        if (waitTime > 0) {
          await sleep(waitTime);
        }
        this.lastRequest = Date.now();
        return this.wrappedService.generateAnswer(request);
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        try {
          await task();
        } catch (error) {
          // Error handled by individual task promise
        }
      }
    }
    
    this.processing = false;
  }
}
```

---

## Contract 3: Text-to-Speech (TTS)

**File**: `src/services/tts/tts-contract.ts`

**Implementation**: Edge TTS (via edge-tts-js), fallback to SpeechSynthesis

```typescript
/**
 * TTS Service Contract
 * 
 * Converts text answers to spoken audio.
 * Must be swappable (Edge TTS → Piper → Google TTS)
 */

/** TTS Voice options */
interface TTSVoice {
  id: string;           // Voice identifier (e.g., "en-US-JennyNeural")
  name: string;         // Display name (e.g., "Jenny (Neural)")
  language: string;     // BCP 47 tag (e.g., "en-US")
  gender: 'male' | 'female';
  type: 'standard' | 'neural'; // Neural = higher quality
}

/** TTS Error taxonomy */
interface TTSError {
  code: 'NOT_SUPPORTED' | 'NETWORK_ERROR' | 'INVALID_VOICE' | 'PLAYBACK_ERROR';
  message: string;
  retryable: boolean;
}

/** TTS Request */
interface TTSRequest {
  text: string;                    // Text to synthesize
  voice?: string;                  // Voice ID (default: "en-US-JennyNeural")
  rate?: number;                   // Speech rate (0.5-2.0, default: 1.0)
  pitch?: number;                  // Pitch shift (-20 to 20, default: 0)
  volume?: number;                 // Volume (0.0-1.0, default: 1.0)
}

/** TTS Events */
type TTSEvent =
  | { type: 'start' }
  | { type: 'progress'; bytesReceived: number; totalBytes?: number }
  | { type: 'end'; duration: number } // Duration in ms
  | { type: 'error'; error: TTSError };

/** TTS Service Interface */
interface TTSService {
  /**
   * Speak text and play audio
   * @param request - TTS request with text and options
   * @param onEvent - Event callback for progress
   */
  speak(request: TTSRequest, onEvent?: (event: TTSEvent) => void): Promise<void>;

  /**
   * Stop current playback
   */
  stop(): Promise<void>;

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean;

  /**
   * Get available voices
   */
  getVoices(): Promise<TTSVoice[]>;

  /**
   * Set default voice
   */
  setVoice(voiceId: string): void;

  /**
   * Check if TTS is supported
   */
  isSupported(): boolean;
}

/** TTS Service Factory */
interface TTSServiceFactory {
  create(): TTSService;
  isSupported(): boolean;
  getDefaultVoice(): string;
}
```

**Example Usage**:
```typescript
const tts = new EdgeTTSService();

// Initialize and load voices
await tts.initialize();
const voices = await tts.getVoices();

// Speak with callback
await tts.speak(
  {
    text: "We're open Monday through Friday, 9 AM to 5 PM.",
    voice: 'en-US-JennyNeural',
    rate: 1.0,
  },
  (event) => {
    if (event.type === 'start') {
      console.log('Speech started');
    }
    if (event.type === 'end') {
      console.log('Speech finished, duration:', event.duration, 'ms');
    }
  }
);

// Emergency stop
await tts.stop();
```

**Fallback Strategy**:
```typescript
class FallbackTTSService implements TTSService {
  private primary: TTSService;
  private fallback: TTSService; // SpeechSynthesis

  constructor(primary: TTSService, fallback: TTSService) {
    this.primary = primary;
    this.fallback = fallback;
  }

  async speak(request: TTSRequest, onEvent?: (event: TTSEvent) => void): Promise<void> {
    if (!this.primary.isSupported()) {
      console.warn('Primary TTS not supported, using fallback');
      return this.fallback.speak(request, onEvent);
    }

    try {
      return await this.primary.speak(request, onEvent);
    } catch (error) {
      console.warn('Primary TTS failed, using fallback:', error);
      return this.fallback.speak(request, onEvent);
    }
  }
}
```

---

## Contract 4: FAQ Service

**File**: `src/services/FAQService.ts`

**Implementation**: localStorage-based FAQ repository with semantic matching

```typescript
/**
 * FAQ Service Contract
 * 
 * Manages FAQ storage and matching.
 */

/** FAQ Match Result */
interface FAQMatch {
  faq: FAQItem;
  confidence: number; // 0.0 - 1.0 match confidence
  matchedField: 'question' | 'aliases' | 'tags' | 'semantic';
}

/** FAQ Service Interface */
interface FAQServiceInterface {
  /**
   * Load FAQs from storage
   */
  loadFAQs(): Promise<FAQItem[]>;

  /**
   * Save FAQs to storage
   */
  saveFAQs(faqs: FAQItem[]): Promise<void>;

  /**
   * Find best matching FAQ for a question
   * @param question - User's question
   * @param minConfidence - Minimum confidence threshold (default: 0.6)
   */
  matchQuestion(question: string, minConfidence?: number): Promise<FAQMatch | null>;

  /**
   * Add a new FAQ
   */
  addFAQ(faq: Omit<FAQItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<FAQItem>;

  /**
   * Update an existing FAQ
   */
  updateFAQ(id: string, updates: Partial<FAQItem>): Promise<FAQItem>;

  /**
   * Delete an FAQ
   */
  deleteFAQ(id: string): Promise<void>;

  /**
   * Get all FAQs
   */
  getAllFAQs(): Promise<FAQItem[]>;

  /**
   * Get FAQ by ID
   */
  getFAQById(id: string): Promise<FAQItem | null>;

  /**
   * Export FAQs (for backup)
   */
  exportFAQs(): Promise<string>; // JSON string

  /**
   * Import FAQs (from backup)
   */
  importFAQs(json: string): Promise<number>; // Number of FAQs imported
}
```

**Example Usage**:
```typescript
const faqService = new LocalStorageFAQService();

// Load FAQs
await faqService.loadFAQs();

// Match a question
const match = await faqService.matchQuestion("What time do you close?");

if (match) {
  console.log('Matched FAQ:', match.faq.question);
  console.log('Answer:', match.faq.answer);
  console.log('Confidence:', match.confidence);
  
  // Update usage stats
  await faqService.updateFAQ(match.faq.id, {
    usageCount: match.faq.usageCount + 1,
    lastUsedAt: Date.now(),
  });
} else {
  console.log('No matching FAQ found');
}
```

---

## Integration: Voice Pipeline

**File**: `src/services/VoicePipeline.ts`

**Orchestrates STT → LLM → TTS flow**

```typescript
/**
 * Voice Pipeline Contract
 * 
 * Orchestrates the complete voice interaction flow.
 */

interface VoicePipelineOptions {
  stt: SpeechRecognizer;
  llm: LLMService;
  tts: TTSService;
  faqService: FAQServiceInterface;
  onStateChange?: (state: PipelineState) => void;
  onLatency?: (latency: LatencyBreakdown) => void;
}

type PipelineState = 
  | 'idle' 
  | 'listening' 
  | 'processing' 
  | 'speaking' 
  | 'complete' 
  | 'error';

interface LatencyBreakdown {
  stt: number;
  llm: number;
  tts: number;
  total: number;
}

interface PipelineResult {
  session: VoiceSession;
  matchedFAQ?: FAQItem;
}

interface VoicePipeline {
  /**
   * Start a voice session
   */
  startSession(): Promise<void>;

  /**
   * Stop current session
   */
  stopSession(): Promise<void>;

  /**
   * Get current state
   */
  getState(): PipelineState;

  /**
   * Check if pipeline is healthy
   */
  isHealthy(): Promise<boolean>;
}
```

---

## Error Taxonomy (Summary)

| Component | Error Codes | Retryable |
|-----------|-------------|-----------|
| **STT** | `NOT_SUPPORTED`, `NOT_ALLOWED`, `NO_SPEECH`, `ABORTED`, `NETWORK` | Some |
| **LLM** | `RATE_LIMITED`, `AUTH_ERROR`, `TIMEOUT`, `INVALID_REQUEST`, `SERVICE_UNAVAILABLE` | Some |
| **TTS** | `NOT_SUPPORTED`, `NETWORK_ERROR`, `INVALID_VOICE`, `PLAYBACK_ERROR` | Some |
| **Pipeline** | `STT_ERROR`, `LLM_ERROR`, `TTS_ERROR`, `PIPELINE_ERROR`, `RATE_LIMITED` | Some |

---

**Next Steps**:
1. Implement contract interfaces in `src/services/*/`
2. Write contract tests in `tests/contract/`
3. Create mock implementations for testing
