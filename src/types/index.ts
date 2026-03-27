/**
 * TypeScript Type Definitions for Browser Voice FAQ Agent
 */

// ============================================
// FAQ Data Types
// ============================================

export interface FAQItem {
  // Identity
  id: string; // UUID v4

  // Content
  question: string; // User-question phrasing
  answer: string; // Business response

  // Metadata (optional)
  category?: string; // Category for organization
  tags?: string[]; // Keywords for semantic matching
  aliases?: string[]; // Alternative phrasings

  // Lifecycle
  createdAt: number; // Unix timestamp (milliseconds)
  updatedAt: number; // Unix timestamp (milliseconds)
  lastUsedAt?: number; // Last time this FAQ was matched
  usageCount: number; // Number of times this FAQ has been matched

  // State
  isActive: boolean; // Whether this FAQ is currently in use
  priority: number; // Match priority (higher = matched first)
}

// ============================================
// Voice Session Types
// ============================================

export type SessionStatus =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'complete'
  | 'error';

export type ErrorCode =
  | 'STT_ERROR'
  | 'LLM_ERROR'
  | 'TTS_ERROR'
  | 'PIPELINE_ERROR'
  | 'RATE_LIMITED';

export interface SessionError {
  code: ErrorCode;
  message: string;
  retryable: boolean;
}

export interface LatencyBreakdown {
  stt: number; // Speech-to-text duration (ms)
  llm: number; // LLM processing duration (ms)
  tts: number; // Text-to-speech duration (ms)
  total: number; // End-to-end duration (ms)
}

export interface Confidence {
  stt: number; // STT confidence score (0.0 - 1.0)
  match: number; // FAQ match confidence (0.0 - 1.0)
}

export interface Feedback {
  helpful: boolean; // Thumbs up/down
  comment?: string; // Optional text feedback
}

export interface VoiceSession {
  // Identity
  id: string; // UUID v4 for session tracking

  // Timing
  startTime: number; // Session start timestamp (Unix ms)
  endTime?: number; // Session end timestamp (Unix ms)

  // Content
  transcript: string; // User's transcribed speech
  answer: string; // Generated answer
  matchedFAQId?: string; // ID of matched FAQ item

  // Latency Breakdown
  latency: LatencyBreakdown;

  // State
  status: SessionStatus;
  error?: SessionError;

  // Quality Metrics
  confidence: Confidence;

  // User Feedback (optional)
  feedback?: Feedback;
}

// ============================================
// API Usage Types
// ============================================

export interface GeminiUsage {
  tokensUsed: number; // Total tokens consumed this month
  requestsCount: number; // Total API requests this month
  lastReset: number; // Unix timestamp of last monthly reset
  lastWarning?: number; // Timestamp of last 80% warning
}

export interface EdgeTTSUsage {
  charactersUsed: number; // Total characters synthesized this month
}

export interface APIUsage {
  gemini: GeminiUsage;
  edgeTTS: EdgeTTSUsage;
  version: number; // Schema version (for migrations)
  lastUpdated: number; // Last update timestamp
}

// ============================================
// App State Types
// ============================================

export interface AppSettings {
  // Voice Settings
  language: string; // ISO 639-1 code (e.g., "en-US")
  voiceSpeed: number; // TTS playback speed (0.5 - 2.0)
  voiceName?: string; // Preferred TTS voice

  // Accessibility
  highContrast: boolean; // High contrast mode
  reducedMotion: boolean; // Reduce animations
  screenReaderMode: boolean; // Optimize for screen readers

  // Developer
  debugMode: boolean; // Enable verbose logging
  showLatencyMetrics: boolean; // Display latency breakdown

  // Privacy
  allowAnalytics: boolean; // Opt-in to usage analytics
}

export interface AppState {
  // Session State
  currentSession: VoiceSession | null;
  sessionHistory: VoiceSession[]; // Last N sessions

  // FAQ State
  faqs: FAQItem[]; // Loaded FAQ database
  faqsLoaded: boolean;
  faqsLoading: boolean;

  // API State
  apiUsage: APIUsage;
  isAPIKeySet: boolean;

  // Settings
  settings: AppSettings;

  // UI State
  isListening: boolean;
  isSpeaking: boolean;
  error: Error | null;
}

// ============================================
// Web Speech API Types (for TypeScript)
// ============================================

export interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;

  start(): void;
  stop(): void;
  abort(): void;

  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onspeechend: ((this: ISpeechRecognition, ev: Event) => void) | null;
}

export interface ISpeechSynthesis {
  speak(utterance: SpeechSynthesisUtterance): void;
  cancel(): void;
  pause(): void;
  resume(): void;
  getVoices(): SpeechSynthesisVoice[];
  pending: boolean;
  speaking: boolean;
  paused: boolean;
  onvoiceschanged: (() => void) | null;
}

// Augment global Window interface
declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
    speechSynthesis: ISpeechSynthesis;
  }
}

// ============================================
// Component Props Types
// ============================================

export interface VoiceButtonProps {
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export interface StatusIndicatorProps {
  status: SessionStatus;
  label?: string;
}

export interface TranscriptDisplayProps {
  transcript: string;
  isFinal: boolean;
  onEdit?: (newTranscript: string) => void;
}

export interface AnswerDisplayProps {
  answer: string;
  isLoading: boolean;
  onFeedback?: (helpful: boolean) => void;
}

// ============================================
// Service Contract Types
// ============================================

export type STTEventType = 'start' | 'result' | 'end' | 'error';

export interface STTEvent {
  type: STTEventType;
  transcript?: string;
  isFinal?: boolean;
  confidence?: number;
  error?: STTError;
}

export interface STTError {
  code: 'NOT_SUPPORTED' | 'NOT_ALLOWED' | 'NO_SPEECH' | 'ABORTED' | 'NETWORK';
  message: string;
  retryable: boolean;
}

export interface STTOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  timeout?: number;
}

export interface SpeechRecognizer {
  startListening(onEvent: (event: STTEvent) => void, options?: STTOptions): Promise<void>;
  stopListening(): Promise<void>;
  abortListening(): Promise<void>;
  isListening(): boolean;
  setLanguage(language: string): void;
  getLanguage(): string;
  isSupported(): boolean;
}

// LLM Types
export interface LLMRequest {
  prompt: string;
  context?: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

export type FinishReason = 'STOP' | 'LENGTH' | 'SAFETY' | 'ERROR';

export interface LLMResponse {
  text: string;
  usage: TokenUsage;
  model: string;
  finishReason: FinishReason;
}

export interface LLMError {
  code: 'RATE_LIMITED' | 'AUTH_ERROR' | 'TIMEOUT' | 'INVALID_REQUEST' | 'SERVICE_UNAVAILABLE';
  message: string;
  retryable: boolean;
  retryAfter?: number;
}

export interface LLMService {
  generateAnswer(request: LLMRequest): Promise<LLMResponse>;
  getTokenUsage(): Promise<TokenUsage>;
  resetTokenUsage(): void;
  isHealthy(): Promise<boolean>;
  setApiKey(key: string): void;
}

// TTS Types
export interface TTSVoice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female';
  type: 'standard' | 'neural';
}

export interface TTSError {
  code: 'NOT_SUPPORTED' | 'NETWORK_ERROR' | 'INVALID_VOICE' | 'PLAYBACK_ERROR';
  message: string;
  retryable: boolean;
}

export interface TTSRequest {
  text: string;
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export type TTSEventType = 'start' | 'progress' | 'end' | 'error';

export interface TTSEvent {
  type: TTSEventType;
  bytesReceived?: number;
  totalBytes?: number;
  duration?: number;
  error?: TTSError;
}

export interface TTSService {
  speak(request: TTSRequest, onEvent?: (event: TTSEvent) => void): Promise<void>;
  stop(): Promise<void>;
  isSpeaking(): boolean;
  getVoices(): Promise<TTSVoice[]>;
  setVoice(voiceId: string): void;
  isSupported(): boolean;
}

// FAQ Service Types
export interface FAQMatch {
  faq: FAQItem;
  confidence: number;
  matchedField: 'question' | 'aliases' | 'tags' | 'semantic';
}

export interface FAQServiceInterface {
  loadFAQs(): Promise<FAQItem[]>;
  saveFAQs(faqs: FAQItem[]): Promise<void>;
  matchQuestion(question: string, minConfidence?: number): Promise<FAQMatch | null>;
  addFAQ(faq: Omit<FAQItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<FAQItem>;
  updateFAQ(id: string, updates: Partial<FAQItem>): Promise<FAQItem>;
  deleteFAQ(id: string): Promise<void>;
  getAllFAQs(): Promise<FAQItem[]>;
  getFAQById(id: string): Promise<FAQItem | null>;
  exportFAQs(): Promise<string>;
  importFAQs(json: string): Promise<number>;
}
