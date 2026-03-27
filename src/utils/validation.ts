/**
 * Validation Schemas using Zod
 * 
 * Provides runtime type validation for all data models.
 * Schemas are used for:
 * - API request/response validation
 * - localStorage data validation
 * - Form input validation
 * - FAQ import/export validation
 */

import { z } from 'zod';

// ============================================
// FAQ Item Schema
// ============================================

export const FAQItemSchema = z.object({
  // Identity
  id: z.string().uuid('Invalid UUID format'),

  // Content
  question: z
    .string()
    .min(5, 'Question must be at least 5 characters')
    .max(500, 'Question must not exceed 500 characters')
    .trim(),
  answer: z
    .string()
    .min(10, 'Answer must be at least 10 characters')
    .max(2000, 'Answer must not exceed 2000 characters')
    .trim(),

  // Metadata (optional)
  category: z.string().max(50, 'Category must not exceed 50 characters').optional(),
  tags: z
    .array(z.string().min(2, 'Tag must be at least 2 characters').max(30, 'Tag must not exceed 30 characters'))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
  aliases: z
    .array(z.string().min(5, 'Alias must be at least 5 characters').max(500, 'Alias must not exceed 500 characters'))
    .max(5, 'Maximum 5 aliases allowed')
    .optional(),

  // Lifecycle
  createdAt: z.number().positive('createdAt must be a positive timestamp'),
  updatedAt: z.number().positive('updatedAt must be a positive timestamp'),
  lastUsedAt: z.number().positive('lastUsedAt must be a positive timestamp').optional(),
  usageCount: z.number().nonnegative('usageCount must be non-negative').default(0),

  // State
  isActive: z.boolean().default(true),
  priority: z.number().default(0),
});

export type FAQItemInput = z.input<typeof FAQItemSchema>;
export type FAQItemOutput = z.output<typeof FAQItemSchema>;

// ============================================
// Voice Session Schema
// ============================================

export const LatencyBreakdownSchema = z.object({
  stt: z.number().nonnegative('STT latency must be non-negative'),
  llm: z.number().nonnegative('LLM latency must be non-negative'),
  tts: z.number().nonnegative('TTS latency must be non-negative'),
  total: z.number().nonnegative('Total latency must be non-negative'),
});

export const SessionErrorSchema = z.object({
  code: z.enum(['STT_ERROR', 'LLM_ERROR', 'TTS_ERROR', 'PIPELINE_ERROR', 'RATE_LIMITED']),
  message: z.string(),
  retryable: z.boolean(),
});

export const ConfidenceSchema = z.object({
  stt: z.number().min(0).max(1, 'STT confidence must be between 0 and 1'),
  match: z.number().min(0).max(1, 'Match confidence must be between 0 and 1'),
});

export const FeedbackSchema = z.object({
  helpful: z.boolean(),
  comment: z.string().optional(),
});

export const VoiceSessionSchema = z.object({
  // Identity
  id: z.string().uuid('Invalid UUID format'),

  // Timing
  startTime: z.number().positive('startTime must be a positive timestamp'),
  endTime: z.number().positive('endTime must be a positive timestamp').optional(),

  // Content
  transcript: z.string(),
  answer: z.string(),
  matchedFAQId: z.string().uuid('Invalid FAQ ID').optional(),

  // Latency Breakdown
  latency: LatencyBreakdownSchema,

  // State
  status: z.enum(['idle', 'listening', 'processing', 'speaking', 'complete', 'error']),
  error: SessionErrorSchema.optional(),

  // Quality Metrics
  confidence: ConfidenceSchema,

  // User Feedback (optional)
  feedback: FeedbackSchema.optional(),
});

export type VoiceSessionInput = z.input<typeof VoiceSessionSchema>;
export type VoiceSessionOutput = z.output<typeof VoiceSessionSchema>;

// ============================================
// API Usage Schema
// ============================================

export const GeminiUsageSchema = z.object({
  tokensUsed: z.number().nonnegative('Tokens used must be non-negative'),
  requestsCount: z.number().nonnegative('Request count must be non-negative'),
  lastReset: z.number().positive('lastReset must be a positive timestamp'),
  lastWarning: z.number().positive('lastWarning must be a positive timestamp').optional(),
});

export const EdgeTTSUsageSchema = z.object({
  charactersUsed: z.number().nonnegative('Characters used must be non-negative'),
});

export const APIUsageSchema = z.object({
  gemini: GeminiUsageSchema,
  edgeTTS: EdgeTTSUsageSchema,
  version: z.number().default(1),
  lastUpdated: z.number().positive('lastUpdated must be a positive timestamp'),
});

export type APIUsageInput = z.input<typeof APIUsageSchema>;
export type APIUsageOutput = z.output<typeof APIUsageSchema>;

// ============================================
// App Settings Schema
// ============================================

export const AppSettingsSchema = z.object({
  // Voice Settings
  language: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/, 'Invalid language code (e.g., "en-US")'),
  voiceSpeed: z.number().min(0.5).max(2.0, 'Voice speed must be between 0.5 and 2.0'),
  voiceName: z.string().optional(),

  // Accessibility
  highContrast: z.boolean().default(false),
  reducedMotion: z.boolean().default(false),
  screenReaderMode: z.boolean().default(false),

  // Developer
  debugMode: z.boolean().default(false),
  showLatencyMetrics: z.boolean().default(false),

  // Privacy
  allowAnalytics: z.boolean().default(false),
});

export type AppSettingsInput = z.input<typeof AppSettingsSchema>;
export type AppSettingsOutput = z.output<typeof AppSettingsSchema>;

// ============================================
// Service Contract Schemas
// ============================================

// STT Schemas
export const STTErrorSchema = z.object({
  code: z.enum(['NOT_SUPPORTED', 'NOT_ALLOWED', 'NO_SPEECH', 'ABORTED', 'NETWORK']),
  message: z.string(),
  retryable: z.boolean(),
});

export const STTOptionsSchema = z.object({
  language: z.string().optional(),
  continuous: z.boolean().optional(),
  interimResults: z.boolean().optional(),
  timeout: z.number().positive().optional(),
});

// LLM Schemas
export const LLMRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  context: z.string().optional(),
  systemPrompt: z.string().optional(),
  maxTokens: z.number().positive().optional(),
  temperature: z.number().min(0).max(1).optional(),
  timeout: z.number().positive().optional(),
});

export const TokenUsageSchema = z.object({
  input: z.number().nonnegative(),
  output: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

export const LLMResponseSchema = z.object({
  text: z.string(),
  usage: TokenUsageSchema,
  model: z.string(),
  finishReason: z.enum(['STOP', 'LENGTH', 'SAFETY', 'ERROR']),
});

export const LLMErrorSchema = z.object({
  code: z.enum(['RATE_LIMITED', 'AUTH_ERROR', 'TIMEOUT', 'INVALID_REQUEST', 'SERVICE_UNAVAILABLE']),
  message: z.string(),
  retryable: z.boolean(),
  retryAfter: z.number().positive().optional(),
});

// TTS Schemas
export const TTSVoiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  language: z.string(),
  gender: z.enum(['male', 'female']),
  type: z.enum(['standard', 'neural']),
});

export const TTSErrorSchema = z.object({
  code: z.enum(['NOT_SUPPORTED', 'NETWORK_ERROR', 'INVALID_VOICE', 'PLAYBACK_ERROR']),
  message: z.string(),
  retryable: z.boolean(),
});

export const TTSRequestSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  voice: z.string().optional(),
  rate: z.number().min(0.5).max(2.0).optional(),
  pitch: z.number().min(-20).max(20).optional(),
  volume: z.number().min(0).max(1).optional(),
});

// FAQ Match Schema
export const FAQMatchSchema = z.object({
  faq: FAQItemSchema,
  confidence: z.number().min(0).max(1),
  matchedField: z.enum(['question', 'aliases', 'tags', 'semantic']),
});

// ============================================
// Validation Helper Functions
// ============================================

/**
 * Validate FAQ item and return parsed data or error
 */
export function validateFAQItem(data: unknown): FAQItemOutput {
  return FAQItemSchema.parse(data);
}

/**
 * Validate FAQ item safely (returns error instead of throwing)
 */
export function validateFAQItemSafe(data: unknown): { success: boolean; data?: FAQItemOutput; error?: z.ZodError } {
  const result = FAQItemSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Validate voice session
 */
export function validateVoiceSession(data: unknown): VoiceSessionOutput {
  return VoiceSessionSchema.parse(data);
}

/**
 * Validate API usage
 */
export function validateAPIUsage(data: unknown): APIUsageOutput {
  return APIUsageSchema.parse(data);
}

/**
 * Validate app settings
 */
export function validateAppSettings(data: unknown): AppSettingsOutput {
  return AppSettingsSchema.parse(data);
}

/**
 * Validate FAQ import JSON
 */
export function validateFAQImport(data: unknown): FAQItemOutput[] {
  const schema = z.array(FAQItemSchema);
  return schema.parse(data);
}
