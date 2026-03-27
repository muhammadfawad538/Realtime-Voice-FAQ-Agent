/**
 * Web Speech API Implementation for Speech-to-Text
 *
 * Uses the browser's built-in Web Speech API for speech recognition.
 * Provides a concrete implementation of the STTService contract.
 */

import { STTService, STTConfig, STTError, STTNotSupportedError, STTNetworkError } from './stt-contract';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export class WebSpeechRecognizer implements STTService {
  private recognition: any;
  private isListeningState: boolean = false;
  private config: Required<STTConfig>;

  constructor(config?: STTConfig) {
    // Check if Web Speech API is supported
    if (!this.isSupported()) {
      throw new STTNotSupportedError('Web Speech API is not supported in this browser');
    }

    // Set default configuration
    this.config = {
      language: config?.language || 'en-US',
      interimResults: config?.interimResults ?? false,
      continuous: config?.continuous ?? false,
    };

    // Initialize the speech recognition object
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    // Configure the recognition
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.lang = this.config.language;
  }

  async startListening(callback: (transcript: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      // Reset any previous listeners
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;

      // Set up the result handler
      this.recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            transcript += result[0].transcript;
          }
        }

        if (transcript.trim()) {
          callback(transcript.trim());
        }
      };

      // Handle errors
      this.recognition.onerror = (event: any) => {
        let errorMessage = `Web Speech Recognition error: ${event.error}`;
        if (event.error === 'network') {
          reject(new STTNetworkError(errorMessage));
        } else {
          reject(new STTError(errorMessage));
        }
      };

      // Handle when recognition ends
      this.recognition.onend = () => {
        this.isListeningState = false;
      };

      // Start the recognition
      this.recognition.start();
      this.isListeningState = true;
      resolve();
    });
  }

  async stopListening(): Promise<void> {
    return new Promise((resolve) => {
      if (this.recognition && this.isListeningState) {
        this.recognition.stop();
        this.isListeningState = false;
      }
      resolve();
    });
  }

  isListening(): boolean {
    return this.isListeningState;
  }

  isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  getServiceInfo(): { name: string; version?: string; capabilities: string[] } {
    return {
      name: 'Web Speech API Recognizer',
      version: '1.0',
      capabilities: [
        'speech-recognition',
        'real-time-recognition',
        'interim-results',
        'multi-language-support'
      ]
    };
  }
}
