/**
 * Text-to-Speech (TTS) Service Contract
 *
 * Defines the interface for text-to-speech services.
 * This contract allows for interchangeable TTS implementations
 * (e.g., Web Speech API, cloud services like Google Text-to-Speech, etc.)
 */

export interface TTSService {
  /**
   * Speak the provided text
   * @param text The text to be spoken
   * @param options Optional parameters for speech synthesis
   * @returns Promise that resolves when speaking completes
   */
  speak(text: string, options?: TTSSpeakOptions): Promise<void>;

  /**
   * Stop the current speech
   * @returns Promise that resolves when speech stops
   */
  stop(): Promise<void>;

  /**
   * Pause the current speech
   * @returns Promise that resolves when speech pauses
   */
  pause(): Promise<void>;

  /**
   * Resume paused speech
   * @returns Promise that resolves when speech resumes
   */
  resume(): Promise<void>;

  /**
   * Check if the service is currently speaking
   */
  isSpeaking(): boolean;

  /**
   * Check if the service is paused
   */
  isPaused(): boolean;

  /**
   * Check if the TTS service is supported in the current environment
   */
  isSupported(): boolean;

  /**
   * Get available voices for the TTS service
   */
  getVoices(): Promise<TTSVoice[]>;

  /**
   * Get information about the current TTS service
   */
  getServiceInfo(): {
    name: string;
    version?: string;
    capabilities: string[];
  };
}

/**
 * Options for speech synthesis
 */
export interface TTSSpeakOptions {
  /**
   * Voice to use for speech synthesis
   * @default system default
   */
  voice?: TTSVoice;

  /**
   * Speaking rate (0.1 - 10.0)
   * @default 1.0
   */
  rate?: number;

  /**
   * Pitch of the voice (0.0 - 2.0)
   * @default 1.0
   */
  pitch?: number;

  /**
   * Volume of the speech (0.0 - 1.0)
   * @default 1.0
   */
  volume?: number;

  /**
   * Language code for the speech (e.g., 'en-US', 'es-ES')
   * @default 'en-US'
   */
  language?: string;
}

/**
 * Voice representation for TTS
 */
export interface TTSVoice {
  /**
   * Unique identifier for the voice
   */
  id: string;

  /**
   * Display name for the voice
   */
  name: string;

  /**
   * Language code for the voice
   */
  lang: string;

  /**
   * Indicates if this is a local voice (as opposed to remote/network)
   */
  localService: boolean;

  /**
   * Indicates if this is the default voice
   */
  default: boolean;
}

/**
 * Base error class for TTS-related errors
 */
export class TTSError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'TTSError';
  }
}

/**
 * Error thrown when TTS service is not supported in the current environment
 */
export class TTSNotSupportedError extends TTSError {
  constructor(message: string = 'Text-to-speech service is not supported in this environment', originalError?: any) {
    super(message, originalError);
    this.name = 'TTSNotSupportedError';
  }
}

/**
 * Error thrown when TTS service encounters a network error
 */
export class TTSNetworkError extends TTSError {
  constructor(message: string = 'Network error occurred during text-to-speech synthesis', originalError?: any) {
    super(message, originalError);
    this.name = 'TTSNetworkError';
  }
}

/**
 * Configuration options for TTS services
 */
export interface TTSConfig {
  /**
   * Default voice to use
   */
  defaultVoice?: string;

  /**
   * Default speaking rate
   * @default 1.0
   */
  defaultRate?: number;

  /**
   * Default pitch
   * @default 1.0
   */
  defaultPitch?: number;

  /**
   * Default volume
   * @default 1.0
   */
  defaultVolume?: number;

  /**
   * Default language code
   * @default 'en-US'
   */
  defaultLanguage?: string;

  /**
   * Additional provider-specific options
   */
  [key: string]: any;
}
