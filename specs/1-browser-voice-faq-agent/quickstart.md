# Quickstart: Browser Voice FAQ Agent

**Feature**: Browser Voice FAQ Agent  
**Date**: 2026-03-26  
**Purpose**: Get the voice agent running in under 10 minutes

---

## Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **pnpm** package manager
- **Modern browser** (Chrome 88+ or Edge 88+ recommended)
- **Gemini API Key** (free - [Get here](https://makersuite.google.com/app/apikey))

---

## Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url> voice-agent
cd voice-agent

# Install dependencies
npm install

# Or with pnpm
pnpm install
```

**Expected Output**:
```
added 245 packages in 1m
```

---

## Step 2: Set Up Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file
# Add your Gemini API key
```

**.env** (required variables):
```ini
# Gemini API (required for LLM)
VITE_GEMINI_API_KEY=your_api_key_here

# Optional: Customize behavior
VITE_DEFAULT_LANGUAGE=en-US
VITE_DEBUG_MODE=false
```

**Get Gemini API Key**:
1. Visit https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key (starts with `AIza...`)
4. Paste into `.env` as `VITE_GEMINI_API_KEY=...`

**Security Note** (MVP only):
- For MVP, API key is client-side with HTTP referrer restrictions
- Set referrer restrictions in Google Cloud Console: `https://yourdomain.com/*`
- For production, use a backend proxy (see `docs/production-setup.md`)

---

## Step 3: Load Sample FAQs (Optional)

```bash
# Load sample FAQ data for testing
npm run seed-faqs
```

**Sample FAQs Included**:
- Business hours
- Contact information
- Return policy
- Shipping information
- Account setup

**Add Your Own FAQs**:
1. Open the app in browser
2. Click "Admin" (bottom right)
3. Add Q&A pairs via the form
4. FAQs are saved to localStorage

---

## Step 4: Start Development Server

```bash
# Start Vite dev server
npm run dev
```

**Expected Output**:
```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Open Browser**: http://localhost:5173/

**Recommended Browser**: Chrome 88+ or Edge 88+ (full Web Speech API support)

---

## Step 5: Test Voice Interaction

1. **Click "Start Voice"** button
2. **Allow microphone access** when prompted
3. **Ask a question**: "What are your business hours?"
4. **Wait for response** (should be < 5 seconds)
5. **Hear spoken answer** + see transcript

**Expected Flow**:
```
[Start Voice] → [Listening...] → [Processing...] → [Speaking...] → [Complete]
```

**Visual Indicators**:
- 🔵 Blue pulse = Listening
- 🟡 Yellow spin = Processing
- 🟢 Green wave = Speaking

---

## Step 6: Run Tests

```bash
# Unit tests (Vitest)
npm run test

# Contract tests (API interfaces)
npm run test:contract

# E2E browser tests (Playwright)
npm run test:e2e

# All tests
npm test
```

**Expected Output**:
```
 PASS  tests/unit/services/GeminiService.test.ts
 PASS  tests/contract/stt-contract.test.ts
 PASS  tests/integration/voice-flow.integration.test.ts

Test Suites: 8 passed, 8 total
Tests:       42 passed, 42 total
Snapshots:   0 total
Time:        4.5 s
```

---

## Step 7: Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

**Output**: `dist/` folder (static files)

**Deploy to Static Hosting**:
- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy`
- **GitHub Pages**: Push `dist/` to `gh-pages` branch
- **Cloudflare Pages**: Connect repo, build command `npm run build`

---

## Troubleshooting

### "Web Speech API not supported"

**Problem**: Browser doesn't support SpeechRecognition

**Solution**:
1. Use Chrome 88+ or Edge 88+
2. Firefox: Go to `about:config`, set `media.webspeech.recognition.enable` to `true`
3. Safari: Not supported (use text mode or iOS app)

**Fallback**: Text input mode is automatically enabled

---

### "Gemini API error: API_KEY_INVALID"

**Problem**: Invalid or missing API key

**Solution**:
1. Check `.env` file: `VITE_GEMINI_API_KEY=AIza...`
2. Restart dev server: `npm run dev`
3. Verify key at https://makersuite.google.com/app/apikey
4. Check API key restrictions (HTTP referrer)

---

### "Too many requests" (429)

**Problem**: Exceeded Gemini free tier (15 RPM)

**Solution**:
1. Wait 4 seconds between requests (automatic rate limiting)
2. Check API usage in app (click "Usage" in settings)
3. Reduce test frequency
4. For production: Upgrade to paid tier or add backend proxy

---

### "No audio output"

**Problem**: TTS not playing

**Solution**:
1. Check browser volume (not muted)
2. Check system volume
3. Try different voice in settings
4. Fallback to SpeechSynthesis: Settings → "Use browser TTS"

---

### "Microphone permission denied"

**Problem**: Browser blocked microphone access

**Solution**:
1. Click lock icon in address bar
2. Set "Microphone" to "Allow"
3. Refresh page
4. If still blocked: Browser settings → Privacy → Site settings → Microphone → Allow

---

## Next Steps

### Development

- **Add Custom FAQs**: Admin panel → Add Q&A pairs
- **Customize Voice**: Settings → Voice → Select preferred TTS voice
- **Adjust Speed**: Settings → Voice → Speech rate (0.5x - 2.0x)
- **Enable Debug**: Settings → Developer → Debug mode (shows latency metrics)

### Testing

- **Contract Tests**: Verify API interfaces
- **Integration Tests**: Test full voice flow
- **E2E Tests**: Browser automation with Playwright
- **Manual Testing**: Real voice interactions with edge cases

### Deployment

- **Read Production Guide**: `docs/production-setup.md`
- **Set Up Backend Proxy**: For API key security (production)
- **Configure Monitoring**: Latency tracking, error alerts
- **Set Up Analytics**: User behavior, FAQ usage stats

---

## Project Structure

```
voice-agent/
├── src/
│   ├── components/       # React components
│   ├── services/         # STT, LLM, TTS, FAQ services
│   ├── hooks/            # React hooks (state management)
│   ├── utils/            # Helpers (storage, validation)
│   └── styles/           # CSS styles
├── tests/
│   ├── contract/         # API contract tests
│   ├── integration/      # End-to-end flow tests
│   └── unit/             # Unit tests
├── public/
│   └── index.html
├── .env.example          # Environment template
├── package.json
└── vite.config.ts
```

---

## Commands Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run all tests |
| `npm run test:contract` | Run contract tests |
| `npm run test:e2e` | Run E2E browser tests |
| `npm run seed-faqs` | Load sample FAQ data |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |

---

## Getting Help

- **Documentation**: `/docs/` folder
- **API Contracts**: `specs/1-browser-voice-faq-agent/contracts/api-contracts.md`
- **Data Model**: `specs/1-browser-voice-faq-agent/data-model.md`
- **Issues**: GitHub Issues (link to your repo)
- **Discussions**: GitHub Discussions (link to your repo)

---

**Ready to build!** 🎤

Next: Run `/sp.tasks` to see implementation tasks breakdown.
