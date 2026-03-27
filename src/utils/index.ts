/**
 * Utilities Index
 *
 * Exports all utility functions for easy importing
 */

export { 
  supportsSpeechRecognition, 
  supportsSpeechSynthesis, 
  supportsMediaDevices, 
  supportsVoiceFeatures, 
  getBrowserCapabilities, 
  requestMicrophonePermission,
  isSecureContext
} from './browser-feature-detection';

export { Logger } from './logger';
export { LatencyLogger } from './latency-logger';
export { RateLimiter } from './rate-limiter';
export { StorageManager } from './storage';
export { ValidationError, ArgumentError, NetworkError, TimeoutError } from './errors';
export { validateInput, isValidEmail, isValidUrl, sanitizeInput } from './validation';
