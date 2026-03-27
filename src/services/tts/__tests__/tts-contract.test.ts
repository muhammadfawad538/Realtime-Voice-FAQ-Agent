/**
 * TTS Contract Interface Tests
 *
 * Tests for the TTSService interface contract to ensure
 * implementations conform to the expected behavior.
 */

import { TTSService, TTSConfig, TTSError, TTSNotSupportedError } from '../tts-contract';

// Mock implementation for testing the contract
class MockTTSService implements TTSService {
  private speakingState: boolean = false;
  private pausedState: boolean = false;

  async speak(text: string, options?: any): Promise<void> {
    this.speakingState = true;
    this.pausedState = false;
    // Simulate speech completion after a delay
    return new Promise(resolve => {
      setTimeout(() => {
        this.speakingState = false;
        resolve();
      }, 100);
    });
  }

  async stop(): Promise<void> {
    this.speakingState = false;
    this.pausedState = false;
  }

  async pause(): Promise<void> {
    if (this.speakingState) {
      this.pausedState = true;
    }
  }

  async resume(): Promise<void> {
    if (this.pausedState) {
      this.pausedState = false;
    }
  }

  isSpeaking(): boolean {
    return this.speakingState && !this.pausedState;
  }

  isPaused(): boolean {
    return this.pausedState;
  }

  isSupported(): boolean {
    return true;
  }

  async getVoices(): Promise<any[]> {
    return [
      { id: '1', name: 'Test Voice 1', lang: 'en-US', localService: true, default: true },
      { id: '2', name: 'Test Voice 2', lang: 'es-ES', localService: false, default: false }
    ];
  }

  getServiceInfo(): { name: string; version?: string; capabilities: string[] } {
    return {
      name: 'Mock TTS Service',
      version: '1.0',
      capabilities: ['text-to-speech', 'mock-capability']
    };
  }
}

describe('TTS Contract Interface', () => {
  let ttsService: TTSService;

  beforeEach(() => {
    ttsService = new MockTTSService();
  });

  describe('Interface Methods', () => {
    test('should have speak method', () => {
      expect(ttsService.speak).toBeDefined();
      expect(typeof ttsService.speak).toBe('function');
    });

    test('should have stop method', () => {
      expect(ttsService.stop).toBeDefined();
      expect(typeof ttsService.stop).toBe('function');
    });

    test('should have pause method', () => {
      expect(ttsService.pause).toBeDefined();
      expect(typeof ttsService.pause).toBe('function');
    });

    test('should have resume method', () => {
      expect(ttsService.resume).toBeDefined();
      expect(typeof ttsService.resume).toBe('function');
    });

    test('should have isSpeaking method', () => {
      expect(ttsService.isSpeaking).toBeDefined();
      expect(typeof ttsService.isSpeaking).toBe('function');
    });

    test('should have isPaused method', () => {
      expect(ttsService.isPaused).toBeDefined();
      expect(typeof ttsService.isPaused).toBe('function');
    });

    test('should have isSupported method', () => {
      expect(ttsService.isSupported).toBeDefined();
      expect(typeof ttsService.isSupported).toBe('function');
    });

    test('should have getVoices method', () => {
      expect(ttsService.getVoices).toBeDefined();
      expect(typeof ttsService.getVoices).toBe('function');
    });

    test('should have getServiceInfo method', () => {
      expect(ttsService.getServiceInfo).toBeDefined();
      expect(typeof ttsService.getServiceInfo).toBe('function');
    });
  });

  describe('speak method', () => {
    test('should accept text and options parameters', async () => {
      const result = ttsService.speak('Hello world', { rate: 1.0, pitch: 1.0 });
      expect(result).toBeInstanceOf(Promise);
      await result;
    });

    test('should update speaking state', async () => {
      expect(ttsService.isSpeaking()).toBe(false);

      ttsService.speak('Hello world');
      // Note: We're not awaiting here as we want to check the intermediate state

      // After a short delay to allow state update
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(ttsService.isSpeaking()).toBe(true);
    });
  });

  describe('stop method', () => {
    test('should return a promise', async () => {
      const result = ttsService.stop();
      expect(result).toBeInstanceOf(Promise);
      await result;
    });

    test('should stop the speaking state', async () => {
      await ttsService.speak('Hello world');
      expect(ttsService.isSpeaking()).toBe(true);

      await ttsService.stop();
      expect(ttsService.isSpeaking()).toBe(false);
    });
  });

  describe('pause method', () => {
    test('should return a promise', async () => {
      const result = ttsService.pause();
      expect(result).toBeInstanceOf(Promise);
      await result;
    });

    test('should update paused state when speaking', async () => {
      await ttsService.speak('Hello world');
      expect(ttsService.isSpeaking()).toBe(true);
      expect(ttsService.isPaused()).toBe(false);

      await ttsService.pause();
      expect(ttsService.isPaused()).toBe(true);
      expect(ttsService.isSpeaking()).toBe(false);
    });
  });

  describe('resume method', () => {
    test('should return a promise', async () => {
      const result = ttsService.resume();
      expect(result).toBeInstanceOf(Promise);
      await result;
    });

    test('should update states when resuming from paused', async () => {
      await ttsService.speak('Hello world');
      await ttsService.pause();

      expect(ttsService.isPaused()).toBe(true);
      expect(ttsService.isSpeaking()).toBe(false);

      await ttsService.resume();
      expect(ttsService.isPaused()).toBe(false);
      // Note: In our mock, resume doesn't necessarily start speaking again
      // This behavior may vary depending on the actual implementation
    });
  });

  describe('isSpeaking method', () => {
    test('should return boolean indicating speaking state', async () => {
      expect(ttsService.isSpeaking()).toBe(false);

      await ttsService.speak('Hello world');
      // Check intermediate state
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(ttsService.isSpeaking()).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for speech to complete
      expect(ttsService.isSpeaking()).toBe(false);
    });
  });

  describe('isPaused method', () => {
    test('should return boolean indicating paused state', async () => {
      expect(ttsService.isPaused()).toBe(false);

      await ttsService.speak('Hello world');
      await ttsService.pause();
      expect(ttsService.isPaused()).toBe(true);

      await ttsService.resume();
      expect(ttsService.isPaused()).toBe(false);
    });
  });

  describe('isSupported method', () => {
    test('should return boolean indicating support status', () => {
      const isSupported = ttsService.isSupported();
      expect(typeof isSupported).toBe('boolean');
    });
  });

  describe('getVoices method', () => {
    test('should return a promise with voices array', async () => {
      const voices = await ttsService.getVoices();

      expect(Array.isArray(voices)).toBe(true);
      expect(voices.length).toBeGreaterThan(0);

      const firstVoice = voices[0];
      expect(firstVoice).toHaveProperty('id');
      expect(firstVoice).toHaveProperty('name');
      expect(firstVoice).toHaveProperty('lang');
      expect(firstVoice).toHaveProperty('localService');
      expect(firstVoice).toHaveProperty('default');
    });
  });

  describe('getServiceInfo method', () => {
    test('should return service information object', () => {
      const info = ttsService.getServiceInfo();

      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('capabilities');
      expect(Array.isArray(info.capabilities)).toBe(true);
      expect(typeof info.name).toBe('string');
    });
  });

  describe('TTS Error Classes', () => {
    test('TTSError should extend Error', () => {
      const error = new TTSError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(TTSError);
      expect(error.message).toBe('Test error');
    });

    test('TTSNotSupportedError should extend TTSError', () => {
      const error = new TTSNotSupportedError('Not supported');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(TTSError);
      expect(error).toBeInstanceOf(TTSNotSupportedError);
      expect(error.message).toBe('Not supported');
    });

    test('TTSNetworkError should extend TTSError', () => {
      const TTSNetworkError = require('../tts-contract').TTSNetworkError;
      const error = new TTSNetworkError('Network error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(require('../tts-contract').TTSError);
      expect(error).toBeInstanceOf(TTSNetworkError);
      expect(error.message).toBe('Network error');
    });
  });

  describe('TTSConfig Interface', () => {
    test('should accept valid configuration options', () => {
      const config: TTSConfig = {
        defaultVoice: 'voice-1',
        defaultRate: 1.0,
        defaultPitch: 1.0,
        defaultVolume: 1.0,
        defaultLanguage: 'en-US'
      };

      expect(config.defaultVoice).toBe('voice-1');
      expect(config.defaultRate).toBe(1.0);
      expect(config.defaultPitch).toBe(1.0);
      expect(config.defaultVolume).toBe(1.0);
      expect(config.defaultLanguage).toBe('en-US');
    });

    test('should allow optional properties to be undefined', () => {
      const config: TTSConfig = {};

      expect(config.defaultVoice).toBeUndefined();
      expect(config.defaultRate).toBeUndefined();
      expect(config.defaultPitch).toBeUndefined();
      expect(config.defaultVolume).toBeUndefined();
      expect(config.defaultLanguage).toBeUndefined();
    });
  });
});