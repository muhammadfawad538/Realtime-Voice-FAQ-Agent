/**
 * Error Taxonomy
 * 
 * Defines standardized error types and codes for the Voice FAQ Agent.
 * All errors follow a consistent structure for easy handling and logging.
 * 
 * Error Categories:
 * - STT_ERROR: Speech-to-Text failures
 * - LLM_ERROR: Language Model failures
 * - TTS_ERROR: Text-to-Speech failures
 * - PIPELINE_ERROR: Voice pipeline orchestration failures
 * - RATE_LIMITED: API rate limit exceeded
 */

// ============================================
// Base Error Types
// ============================================

/**
 * Base error interface for all voice agent errors
 */
export interface VoiceAgentError {
  /** Unique error code for programmatic handling */
  code: string;
  
  /** Human-readable error message */
  message: string;
  
  /** Whether the operation can be retried */
  retryable: boolean;
  
  /** Optional: seconds to wait before retrying (for rate limits) */
  retryAfter?: number;
  
  /** Optional: underlying error that caused this */
  cause?: unknown;
  
  /** Optional: additional context for debugging */
  context?: Record<string, unknown>;
}

// ============================================
// STT Error Codes
// ============================================

export type STTErrorCode =
  | 'NOT_SUPPORTED'      // Browser doesn't support Web Speech API
  | 'NOT_ALLOWED'        // User denied microphone permission
  | 'NO_SPEECH'          // No speech detected
  | 'ABORTED'            // Recognition was aborted
  | 'NETWORK';           // Network error during recognition

export interface STTError extends VoiceAgentError {
  code: STTErrorCode;
}

export function createSTTError(code: STTErrorCode, options?: Partial<STTError>): STTError {
  const errorMessages: Record<STTErrorCode, string> = {
    NOT_SUPPORTED: 'Speech recognition is not supported in this browser. Try Chrome or Edge.',
    NOT_ALLOWED: 'Microphone access was denied. Please allow microphone access and try again.',
    NO_SPEECH: 'No speech detected. Please try again.',
    ABORTED: 'Speech recognition was cancelled.',
    NETWORK: 'Network error during speech recognition. Please check your connection.',
  };

  return {
    code,
    message: options?.message || errorMessages[code],
    retryable: options?.retryable ?? (code === 'NETWORK' || code === 'NO_SPEECH'),
    retryAfter: options?.retryAfter,
    cause: options?.cause,
    context: options?.context,
  };
}

// ============================================
// LLM Error Codes
// ============================================

export type LLMErrorCode =
  | 'RATE_LIMITED'        // API rate limit exceeded
  | 'AUTH_ERROR'          // Invalid or missing API key
  | 'TIMEOUT'             // Request timed out
  | 'INVALID_REQUEST'     // Malformed request
  | 'SERVICE_UNAVAILABLE'; // Service temporarily down

export interface LLMError extends VoiceAgentError {
  code: LLMErrorCode;
}

export function createLLMError(code: LLMErrorCode, options?: Partial<LLMError>): LLMError {
  const errorMessages: Record<LLMErrorCode, string> = {
    RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
    AUTH_ERROR: 'Invalid API key. Please check your Gemini API key configuration.',
    TIMEOUT: 'Request timed out. Please try again.',
    INVALID_REQUEST: 'Invalid request format. Please try again.',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable. Please try again later.',
  };

  return {
    code,
    message: options?.message || errorMessages[code],
    retryable: options?.retryable ?? (code === 'RATE_LIMITED' || code === 'TIMEOUT' || code === 'SERVICE_UNAVAILABLE'),
    retryAfter: options?.retryAfter ?? (code === 'RATE_LIMITED' ? 4 : undefined),
    cause: options?.cause,
    context: options?.context,
  };
}

// ============================================
// TTS Error Codes
// ============================================

export type TTSErrorCode =
  | 'NOT_SUPPORTED'      // TTS not supported
  | 'NETWORK_ERROR'      // Network error during TTS
  | 'INVALID_VOICE'      // Selected voice not available
  | 'PLAYBACK_ERROR';    // Audio playback failed

export interface TTSError extends VoiceAgentError {
  code: TTSErrorCode;
}

export function createTTSError(code: TTSErrorCode, options?: Partial<TTSError>): TTSError {
  const errorMessages: Record<TTSErrorCode, string> = {
    NOT_SUPPORTED: 'Text-to-speech is not supported in this browser.',
    NETWORK_ERROR: 'Network error during speech generation. Please check your connection.',
    INVALID_VOICE: 'Selected voice is not available. Please choose a different voice.',
    PLAYBACK_ERROR: 'Failed to play audio. Please check your audio settings.',
  };

  return {
    code,
    message: options?.message || errorMessages[code],
    retryable: options?.retryable ?? (code === 'NETWORK_ERROR' || code === 'PLAYBACK_ERROR'),
    retryAfter: options?.retryAfter,
    cause: options?.cause,
    context: options?.context,
  };
}

// ============================================
// Pipeline Error Codes
// ============================================

export type PipelineErrorCode =
  | 'STT_ERROR'           // Speech-to-Text failed
  | 'LLM_ERROR'           // Language Model failed
  | 'TTS_ERROR'           // Text-to-Speech failed
  | 'PIPELINE_ERROR'      // General pipeline failure
  | 'RATE_LIMITED';       // Rate limited

export interface PipelineError extends VoiceAgentError {
  code: PipelineErrorCode;
  component?: 'stt' | 'llm' | 'tts';
}

export function createPipelineError(
  code: PipelineErrorCode,
  options?: Partial<PipelineError>
): PipelineError {
  const errorMessages: Record<PipelineErrorCode, string> = {
    STT_ERROR: 'Failed to capture speech. Please try again.',
    LLM_ERROR: 'Failed to generate answer. Please try again.',
    TTS_ERROR: 'Failed to play answer. Please try again.',
    PIPELINE_ERROR: 'An error occurred during processing. Please try again.',
    RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  };

  return {
    code,
    message: options?.message || errorMessages[code],
    retryable: options?.retryable ?? true,
    retryAfter: options?.retryAfter,
    component: options?.component,
    cause: options?.cause,
    context: options?.context,
  };
}

// ============================================
// FAQ Service Error Codes
// ============================================

export type FAQErrorCode =
  | 'NOT_FOUND'           // FAQ not found
  | 'VALIDATION_ERROR'    // FAQ validation failed
  | 'STORAGE_ERROR'       // localStorage operation failed
  | 'IMPORT_ERROR';       // FAQ import failed

export interface FAQError extends VoiceAgentError {
  code: FAQErrorCode;
}

export function createFAQError(code: FAQErrorCode, options?: Partial<FAQError>): FAQError {
  const errorMessages: Record<FAQErrorCode, string> = {
    NOT_FOUND: 'FAQ item not found.',
    VALIDATION_ERROR: 'Invalid FAQ data. Please check the input.',
    STORAGE_ERROR: 'Failed to save FAQ. Storage may be full.',
    IMPORT_ERROR: 'Failed to import FAQs. Please check the file format.',
  };

  return {
    code,
    message: options?.message || errorMessages[code],
    retryable: options?.retryable ?? (code === 'STORAGE_ERROR'),
    retryAfter: options?.retryAfter,
    cause: options?.cause,
    context: options?.context,
  };
}

// ============================================
// Error Type Guards
// ============================================

/**
 * Check if an error is an STT error
 */
export function isSTTError(error: unknown): error is STTError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    ['NOT_SUPPORTED', 'NOT_ALLOWED', 'NO_SPEECH', 'ABORTED', 'NETWORK'].includes(
      (error as Record<string, unknown>).code as string
    )
  );
}

/**
 * Check if an error is an LLM error
 */
export function isLLMError(error: unknown): error is LLMError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    ['RATE_LIMITED', 'AUTH_ERROR', 'TIMEOUT', 'INVALID_REQUEST', 'SERVICE_UNAVAILABLE'].includes(
      (error as Record<string, unknown>).code as string
    )
  );
}

/**
 * Check if an error is a TTS error
 */
export function isTTSError(error: unknown): error is TTSError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    ['NOT_SUPPORTED', 'NETWORK_ERROR', 'INVALID_VOICE', 'PLAYBACK_ERROR'].includes(
      (error as Record<string, unknown>).code as string
    )
  );
}

/**
 * Check if an error is a pipeline error
 */
export function isPipelineError(error: unknown): error is PipelineError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    ['STT_ERROR', 'LLM_ERROR', 'TTS_ERROR', 'PIPELINE_ERROR', 'RATE_LIMITED'].includes(
      (error as Record<string, unknown>).code as string
    )
  );
}

/**
 * Check if an error is a FAQ error
 */
export function isFAQError(error: unknown): error is FAQError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    ['NOT_FOUND', 'VALIDATION_ERROR', 'STORAGE_ERROR', 'IMPORT_ERROR'].includes(
      (error as Record<string, unknown>).code as string
    )
  );
}

// ============================================
// Error Handler Utilities
// ============================================

/**
 * Convert any error to a VoiceAgentError
 */
export function toVoiceAgentError(error: unknown, fallbackCode = 'UNKNOWN'): VoiceAgentError {
  if (
    isSTTError(error) ||
    isLLMError(error) ||
    isTTSError(error) ||
    isPipelineError(error) ||
    isFAQError(error)
  ) {
    return error;
  }

  // Handle native Error objects
  if (error instanceof Error) {
    return {
      code: fallbackCode,
      message: error.message,
      retryable: false,
      cause: error,
    };
  }

  // Handle unknown errors
  return {
    code: fallbackCode,
    message: typeof error === 'string' ? error : 'An unknown error occurred',
    retryable: false,
    cause: error,
  };
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: VoiceAgentError): string {
  return error.message;
}

/**
 * Get technical error details for logging
 */
export function getErrorDetails(error: VoiceAgentError): string {
  const details: string[] = [
    `Code: ${error.code}`,
    `Message: ${error.message}`,
    `Retryable: ${error.retryable}`,
  ];

  if (error.retryAfter) {
    details.push(`Retry After: ${error.retryAfter}s`);
  }

  if (error.context) {
    details.push(`Context: ${JSON.stringify(error.context)}`);
  }

  return details.join(' | ');
}

/**
 * Log error for debugging
 */
export function logError(error: VoiceAgentError, context?: string): void {
  const prefix = context ? `[VoiceAgent:${context}]` : '[VoiceAgent]';
  console.error(`${prefix} ${getErrorDetails(error)}`);
  
  // Log full error stack if available
  if (error.cause instanceof Error) {
    console.error(`${prefix} Cause:`, error.cause.stack);
  }
}

// ============================================
// Error Recovery Strategies
// ============================================

export interface RecoveryStrategy {
  /** Whether to retry the operation */
  shouldRetry: boolean;
  
  /** Delay before retry in milliseconds */
  retryDelay?: number;
  
  /** Alternative action if retry fails */
  fallback?: () => void;
  
  /** User message to display */
  userMessage?: string;
}

/**
 * Get recovery strategy for an error
 */
export function getRecoveryStrategy(error: VoiceAgentError): RecoveryStrategy {
  if (!error.retryable) {
    return {
      shouldRetry: false,
      userMessage: error.message,
    };
  }

  const retryDelay = error.retryAfter ? error.retryAfter * 1000 : 1000;

  return {
    shouldRetry: true,
    retryDelay,
    userMessage: `${error.message} Retrying in ${Math.round(retryDelay / 1000)} seconds...`,
  };
}

/**
 * Execute with automatic retry based on error type
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  context?: string
): Promise<T> {
  let lastError: VoiceAgentError | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = toVoiceAgentError(error);
      logError(lastError, context);

      const strategy = getRecoveryStrategy(lastError);

      if (!strategy.shouldRetry || attempt === maxRetries) {
        break;
      }

      if (strategy.retryDelay) {
        await new Promise((resolve) => setTimeout(resolve, strategy.retryDelay));
      }
    }
  }

  throw lastError;
}
