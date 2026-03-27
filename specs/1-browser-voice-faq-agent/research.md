# Research: Browser Voice FAQ Agent

**Feature**: Browser Voice FAQ Agent  
**Date**: 2026-03-26  
**Purpose**: Resolve all NEEDS CLARIFICATION items and technical unknowns from plan.md

---

## Decision 1: Web Speech API Browser Support

**Decision**: Use Web Speech API (SpeechRecognition) with Chrome/Edge as primary browsers, text-only fallback for Firefox

**Rationale**: 
- Chrome 88+ and Edge 88+ have full SpeechRecognition support
- Firefox has limited/experimental support (behind flags as of 2024)
- Safari has no support (requires iOS app for native alternative)

**Browser Support Matrix**:
| Browser | STT Support | Notes |
|---------|-------------|-------|
| Chrome 88+ | ✅ Full | Recommended |
| Edge 88+ | ✅ Full | Chromium-based |
| Firefox 89+ | ⚠️ Limited | Behind `media.webspeech.recognition.enable` flag |
| Safari 14+ | ❌ None | Requires iOS native app |

**Alternatives Considered**:
1. **Whisper.js (local)**: Too slow for browser (500MB+ model), defeats free-first principle
2. **Google Cloud STT API**: Paid after 60 min/month, requires backend proxy for security
3. **AssemblyAI**: Free tier (5 hrs/month) but requires API key management

**Implementation Strategy**:
```typescript
// Feature detection
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  // Graceful degradation: show text-only mode
  showTextOnlyWarning();
  return;
}

// Browser-specific prefixes
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
```

**Fallback Strategy**: Text input mode with clear messaging: "Voice not supported in this browser. Try Chrome or Edge."

---

## Decision 2: Gemini API Client-Side Security

**Decision**: Use Gemini API directly from browser with restricted API key for MVP; document backend proxy requirement for production

**Rationale**:
- MVP is browser-only (NFR-003), no backend available
- Gemini API keys can be restricted by HTTP referrer (domain)
- Free tier limits (15 RPM, 1M tokens/month) provide natural protection
- Acceptable risk for MVP with proper user warnings

**Security Mitigations**:
1. **HTTP Referrer Restrictions**: Limit API key to specific domains in Google Cloud Console
2. **Rate Limiting Client-Side**: Enforce 15 RPM with queue system
3. **Usage Monitoring**: Track tokens in localStorage, warn at 80%
4. **No Sensitive Operations**: FAQ answers are public information (no user data exposure)

**Alternatives Considered**:
1. **Backend Proxy (Cloudflare Workers)**: Free tier available, adds complexity, violates NFR-003
2. **Firebase Cloud Functions**: Free tier (125K invocations/month), requires backend setup
3. **Vercel Edge Functions**: Free tier (100GB-hours), adds deployment complexity

**Production Recommendation**: For production with >100 users/day, migrate to Cloudflare Workers proxy:
```typescript
// Cloudflare Worker (future)
export default {
  async fetch(request, env) {
    const apiKey = env.GEMINI_API_KEY; // Hidden from client
    // Forward request to Gemini API
    // Add rate limiting, logging, abuse detection
  }
};
```

**API Key Setup**:
1. Visit https://makersuite.google.com/app/apikey
2. Create API key
3. Set HTTP referrer restrictions: `https://yourdomain.com/*`
4. Add to `.env`: `VITE_GEMINI_API_KEY=your_key_here`

---

## Decision 3: Edge TTS JavaScript Integration

**Decision**: Use `edge-tts-js` npm package for browser-compatible Edge TTS

**Rationale**:
- Pure JavaScript implementation (no Python CLI dependency)
- Works in browser via WebAssembly or Node.js
- Free, no authentication required
- 400+ voices across 100+ languages

**Package**: `edge-tts-js` (npm: https://www.npmjs.com/package/edge-tts-js)

**Alternatives Considered**:
1. **edge-tts (Python CLI)**: Requires backend server, violates NFR-003
2. **Web Speech API (SpeechSynthesis)**: Free, built-in, but robotic voice quality
3. **Coqui TTS (local)**: Too large for browser (ML models), requires backend
4. **Google TTS API**: Free tier (1M chars/month) but requires API key management

**Implementation Strategy**:
```typescript
import { EdgeTTS } from 'edge-tts-js';

const tts = new EdgeTTS();
await tts.initialize();

// Generate speech
const audioBlob = await tts.speak({
  text: "Your answer here",
  voice: "en-US-JennyNeural", // High-quality neural voice
  rate: 1.0,
  pitch: 0
});

// Play audio
const audio = new Audio(URL.createObjectURL(audioBlob));
await audio.play();
```

**Fallback Strategy**: If `edge-tts-js` fails, degrade to browser SpeechSynthesis:
```typescript
if (!EdgeTTS.isSupported()) {
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
}
```

**Voice Selection**: Use neural voices for quality:
- `en-US-JennyNeural` (friendly, professional)
- `en-US-GuyNeural` (alternative male voice)

---

## Decision 4: API Rate Limiting Strategy

**Decision**: Implement client-side rate limiting with exponential backoff and request queue

**Gemini API Limits** (Free Tier):
- 15 requests per minute (RPM)
- 1M tokens per month
- 1 request per 4 seconds sustained

**Rate Limiting Algorithm**:
```typescript
class RateLimiter {
  private queue: Request[] = [];
  private lastRequestTime: number = 0;
  private readonly MIN_INTERVAL = 4000; // 4 seconds between requests

  async enqueue(request: () => Promise<any>): Promise<any> {
    // Wait if we've exceeded RPM
    const timeSinceLast = Date.now() - this.lastRequestTime;
    if (timeSinceLast < this.MIN_INTERVAL) {
      await sleep(this.MIN_INTERVAL - timeSinceLast);
    }
    
    this.lastRequestTime = Date.now();
    return request();
  }

  getEstimatedWaitTime(): number {
    // Show user "You're next in X seconds" message
    return Math.max(0, this.MIN_INTERVAL - (Date.now() - this.lastRequestTime));
  }
}
```

**Exponential Backoff for Errors**:
```typescript
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) { // Rate limited
        const backoff = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await sleep(backoff);
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}
```

**User Experience**:
- Show queue position: "You're #3 in line, ~8 seconds"
- Graceful error: "Too many users. Please wait a moment."
- Retry button for failed requests

---

## Decision 5: WCAG 2.1 AA Accessibility Requirements

**Decision**: Implement ARIA live regions, keyboard navigation, and visual state indicators

**Required Accessibility Features**:

1. **ARIA Live Regions** (for screen readers):
```html
<!-- Real-time transcript -->
<div aria-live="polite" aria-atomic="true" id="transcript">
  {{ transcribed speech }}
</div>

<!-- Answer display -->
<div aria-live="assertive" aria-atomic="true" id="answer">
  {{ generated answer }}
</div>

<!-- Status updates -->
<div aria-live="polite" role="status" id="status">
  {{ listening | processing | speaking }}
</div>
```

2. **Keyboard Navigation**:
```typescript
// Voice button: Space/Enter to toggle
<button 
  onKeyDown={(e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggleVoice();
    }
  }}
  aria-pressed={isListening}
>
  {isListening ? 'Stop Voice' : 'Start Voice'}
</button>
```

3. **Visual State Indicators** (color + icon + text):
```typescript
// Status must not rely on color alone
<div className={`status ${status}`}>
  <Icon icon={statusIcon} />
  <span className="status-text">{statusLabel}</span>
  <span className="sr-only">{screenReaderStatus}</span>
</div>
```

4. **Focus Management**:
- Trap focus during voice session
- Return focus to trigger button on close
- Skip links for main content

5. **Contrast Requirements**:
- Text: 4.5:1 minimum contrast ratio
- UI components: 3:1 minimum
- Status indicators: Dual-coded (color + shape/icon)

**Testing**:
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Keyboard-only navigation
- Automated: axe-core, WAVE

---

## Decision 6: API Usage Tracking Schema

**Decision**: Use localStorage with monthly reset for API usage tracking

**Schema**:
```typescript
interface APIUsage {
  gemini: {
    tokensUsed: number;      // Cumulative tokens this month
    requestsCount: number;   // Requests this month
    lastReset: number;       // Unix timestamp of last reset
  };
  edgeTTS: {
    charactersUsed: number;  // Characters synthesized this month
  };
}

const USAGE_KEY = 'voice-agent-api-usage';

function getUsage(): APIUsage {
  const stored = localStorage.getItem(USAGE_KEY);
  const now = Date.now();
  const monthMs = 30 * 24 * 60 * 60 * 1000;

  if (!stored) {
    return {
      gemini: { tokensUsed: 0, requestsCount: 0, lastReset: now },
      edgeTTS: { charactersUsed: 0 }
    };
  }

  const usage = JSON.parse(stored);
  
  // Reset monthly counters
  if (now - usage.gemini.lastReset > monthMs) {
    usage.gemini.tokensUsed = 0;
    usage.gemini.requestsCount = 0;
    usage.gemini.lastReset = now;
    saveUsage(usage);
  }

  return usage;
}

function updateUsage(delta: { geminiTokens?: number; ttsChars?: number }) {
  const usage = getUsage();
  if (delta.geminiTokens) usage.gemini.tokensUsed += delta.geminiTokens;
  if (delta.ttsChars) usage.edgeTTS.charactersUsed += delta.ttsChars;
  saveUsage(usage);

  // Warn at 80%
  if (usage.gemini.tokensUsed > 800000) {
    showWarning('Gemini API: 80% of monthly limit reached');
  }
}
```

**Free Tier Limits**:
| API | Monthly Limit | 80% Threshold | Daily Budget (100 users) |
|-----|---------------|---------------|--------------------------|
| Gemini | 1M tokens | 800K tokens | ~33K tokens/day |
| Edge TTS | Unlimited | N/A | N/A |

**Estimated Usage per Session**:
- Average question: 50 tokens (input)
- Average answer: 200 tokens (output)
- Total per session: ~250 tokens
- 100 users/day × 30 days × 250 tokens = 750K tokens/month ✅ (within free tier)

---

## Summary of Decisions

| Unknown | Decision | Impact |
|---------|----------|--------|
| Web Speech API support | Chrome/Edge primary, text fallback for Firefox | Affects browser compatibility |
| Gemini API security | Client-side with referrer restrictions (MVP only) | Production requires backend proxy |
| Edge TTS integration | `edge-tts-js` npm package | Pure JS, no backend needed |
| Rate limiting | Client-side queue + exponential backoff | User experience: queue messages |
| WCAG 2.1 AA | ARIA live regions, keyboard nav, dual-coded status | Accessibility compliance |
| API usage tracking | localStorage with monthly reset | 80% warnings, sustainable usage |

---

**Research Complete**: All NEEDS CLARIFICATION items resolved. Ready for Phase 1 design.

**Next**: Create data-model.md, API contracts, and quickstart.md
