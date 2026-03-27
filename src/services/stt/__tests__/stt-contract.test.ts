/**
 * STT Contract Interface Tests
 *
 * Tests for the STTService interface contract to ensure
 * implementations conform to the expected behavior.
 */

import { STTService, STTConfig, STTError, STTNotSupportedError } from '../stt-contract';

// Mock implementation for testing the contract
class MockSTTService implements STTService {
  private listeningState: boolean = false;
  
  async startListening(callback: (transcript: string) => void): Promise<void> {
    this.listeningState = true;
    // Simulate recognizing some speech after a delay
    setTimeout(() => {
      if (this.listeningState) {
        callback('Test speech recognition');
      }
    }, 100);
  }

  async stopListening(): Promise<void> {
    this.listeningState = false;
  }

  isListening(): boolean {
    return this.listeningState;
  }

  isSupported(): boolean {
    return true;
  }

  getServiceInfo(): { name: string; version?: string; capabilities: string[] } {
    return {
      name: 'Mock STT Service',
      version: '1.0',
      capabilities: ['mock-capability']
    };
  }
}

describe('STT Contract Interface', () => {
  let sttService: STTService;

  beforeEach(() => {
    sttService = new MockSTTService();
  });

  describe('Interface Methods', () => {
    test('should have startListening method', () => {
      expect(sttService.startListening).toBeDefined();
      expect(typeof sttService.startListening).toBe('function');
    });

    test('should have stopListening method', () => {
      expect(sttService.stopListening).toBeDefined();
      expect(typeof sttService.stopListening).toBe('function');
    });

    test('should have isListening method', () => {
      expect(sttService.isListening).toBeDefined();
      expect(typeof sttService.isListening).toBe('function');
    });

    test('should have isSupported method', () => {
      expect(sttService.isSupported).toBeDefined();
      expect(typeof sttService.isSupported).toBe('function');
    });

    test('should have getServiceInfo method', () => {
      expect(sttService.getServiceInfo).toBeDefined();
      expect(typeof sttService.getServiceInfo).toBe('function');
    });
  });

  describe('startListening method', () => {
    test('should accept a callback function', async () => {
      const mockCallback = jest.fn();
      await sttService.startListening(mockCallback);
      
      // Wait a bit for the mock to trigger the callback
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(mockCallback).toHaveBeenCalledWith('Test speech recognition');
    });

    test('should return a promise', async () => {
      const result = sttService.startListening(() => {});
      expect(result).toBeInstanceOf(Promise);
      await result; // Wait for the promise to resolve
    });
  });

  describe('stopListening method', () => {
    test('should return a promise', async () => {
      const result = sttService.stopListening();
      expect(result).toBeInstanceOf(Promise);
      await result; // Wait for the promise to resolve
    });

    test('should stop the listening state', async () => {
      await sttService.startListening(() => {});
      expect(sttService.isListening()).toBe(true);
      
      await sttService.stopListening();
      expect(sttService.isListening()).toBe(false);
    });
  });

  describe('isListening method', () => {
    test('should return boolean indicating listening state', async () => {
      expect(sttService.isListening()).toBe(false);
      
      await sttService.startListening(() => {});
      expect(sttService.isListening()).toBe(true);
      
      await sttService.stopListening();
      expect(sttService.isListening()).toBe(false);
    });
  });

  describe('isSupported method', () => {
    test('should return boolean indicating support status', () => {
      const isSupported = sttService.isSupported();
      expect(typeof isSupported).toBe('boolean');
    });
  });

  describe('getServiceInfo method', () => {
    test('should return service information object', () => {
      const info = sttService.getServiceInfo();
      
      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('capabilities');
      expect(Array.isArray(info.capabilities)).toBe(true);
      expect(typeof info.name).toBe('string');
    });
  });

  describe('STT Error Classes', () => {
    test('STTError should extend Error', () => {
      const error = new STTError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(STTError);
      expect(error.message).toBe('Test error');
    });

    test('STTNotSupportedError should extend STTError', () => {
      const error = new STTNotSupportedError('Not supported');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(STTError);
      expect(error).toBeInstanceOf(STTNotSupportedError);
      expect(error.message).toBe('Not supported');
    });

    test('STTNetworkError should extend STTError', () => {
      const STTNetworkError = require('../stt-contract').STTNetworkError;
      const error = new STTNetworkError('Network error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(require('../stt-contract').STTError);
      expect(error).toBeInstanceOf(STTNetworkError);
      expect(error.message).toBe('Network error');
    });
  });

  describe('STTConfig Interface', () => {
    test('should accept valid configuration options', () => {
      const config: STTConfig = {
        language: 'en-US',
        interimResults: true,
        continuous: false
      };
      
      expect(config.language).toBe('en-US');
      expect(config.interimResults).toBe(true);
      expect(config.continuous).toBe(false);
    });

    test('should allow optional properties to be undefined', () => {
      const config: STTConfig = {};
      
      expect(config.language).toBeUndefined();
      expect(config.interimResults).toBeUndefined();
      expect(config.continuous).toBeUndefined();
    });
  });
});
