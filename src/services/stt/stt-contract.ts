/**
 * Speech-to-Text (STT) Service Contract
 *
 * Defines the interface for speech recognition services.
 * This contract allows for interchangeable STT implementations
 * (e.g., Web Speech API, cloud services like Google Speech-to-Text, etc.)
 */

export interface STTService {
  /**
   * Start listening for speech input
   * @param callback Function called when speech is recognized
   * @returns Promise that resolves when listening starts successfully
   */
  startListening(callback: (transcript: string) => void): Promise<void>;

  /**
   * Stop listening for speech input
   * @returns Promise that resolves when listening stops successfully
   */
  stopListening(): Promise<void>;

  /**
   * Check if the service is currently listening
   */
  isListening(): boolean;

  /**
   * Check if the STT service is supported in the current environment
   */
  isSupported(): boolean;

  /**
   * Get information about the current STT service
   */
  getServiceInfo(): {
    name: string;
    version?: string;
    capabilities: string[];
  };
}

/**
 * Base error class for STT-related errors
 */
export class STTError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'STTError';
  }
}

/**
 * Error thrown when STT service is not supported in the current environment
 */
export class STTNotSupportedError extends STTError {
  constructor(message: string = 'Speech-to-text service is not supported in this environment', originalError?: any) {
    super(message, originalError);
    this.name = 'STTNotSupportedError';
  }
}

/**
 * Error thrown when STT service encounters a network error
 */
export class STTNetworkError extends STTError {
  constructor(message: string = 'Network error occurred during speech recognition', originalError?: any) {
    super(message, originalError);
    this.name = 'STTNetworkError';
  }
}

/**
 * Configuration options for STT services
 */
export interface STTConfig {
  /**
   * Language code for speech recognition (e.g., 'en-US', 'es-ES')
   * @default 'en-US'
   */
  language?: string;

  /**
   * Whether to enable interim results (partial results before final recognition)
   * @default false
   */
  interimResults?: boolean;

  /**
   * Whether to enable continuous listening
   * @default false
   */
  continuous?: boolean;

  /**
   * Additional provider-specific options
   */
  [key: string]: any;
}
