/**
 * Voice Flow Integration Tests
 *
 * Tests for the integration between STT, LLM, and TTS services
 * to ensure proper voice FAQ agent functionality.
 */

import { STTService } from '../services/stt/stt-contract';
import { LLMService } from '../services/llm/llm-contract';
import { TTSService } from '../services/tts/tts-contract';
import { FAQItem } from '../types';
import { VoiceFlow } from '../services/VoiceFlow';

// Mock implementations for testing
class MockSTTService implements STTService {
  private listeningState: boolean = false;
  private callback: ((transcript: string) => void) | null = null;

  async startListening(callback: (transcript: string) => void): Promise<void> {
    this.listeningState = true;
    this.callback = callback;

    // Simulate speech recognition after a short delay
    setTimeout(() => {
      if (this.listeningState && this.callback) {
        this.callback('What is your return policy?');
      }
    }, 100);
  }

  async stopListening(): Promise<void> {
    this.listeningState = false;
    this.callback = null;
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
      capabilities: ['mock-stt']
    };
  }
}

class MockLLMService implements LLMService {
  private tokenUsage = { input: 0, output: 0 };

  async generateAnswer(question: string, faqContext: FAQItem[]): Promise<string> {
    // Simulate generating an answer based on the question
    return `Based on your question "${question}", our return policy is 30 days.`;
  }

  async getTokenUsage(): Promise<{ input: number; output: number }> {
    return { ...this.tokenUsage };
  }

  getModelInfo(): { name: string; capabilities: string[] } {
    return {
      name: 'Mock LLM Service',
      capabilities: ['mock-llm']
    };
  }

  async testConnection(): Promise<boolean> {
    return true;
  }
}

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
      }, 200);
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
      { id: '1', name: 'Test Voice', lang: 'en-US', localService: true, default: true }
    ];
  }

  getServiceInfo(): { name: string; version?: string; capabilities: string[] } {
    return {
      name: 'Mock TTS Service',
      version: '1.0',
      capabilities: ['mock-tts']
    };
  }
}

describe('Voice Flow Integration Tests', () => {
  let sttService: STTService;
  let llmService: LLMService;
  let ttsService: TTSService;
  let voiceFlow: VoiceFlow;
  let faqs: FAQItem[];

  beforeEach(() => {
    sttService = new MockSTTService();
    llmService = new MockLLMService();
    ttsService = new MockTTSService();
    faqs = [
      { question: 'Return Policy', answer: 'We offer a 30-day return policy for all items.' },
      { question: 'Shipping Time', answer: 'Orders are delivered within 5-7 business days.' }
    ];

    voiceFlow = new VoiceFlow(sttService, llmService, ttsService, faqs);
  });

  test('should properly initialize with all services', () => {
    expect(voiceFlow).toBeDefined();
    expect(voiceFlow['sttService']).toBe(sttService);
    expect(voiceFlow['llmService']).toBe(llmService);
    expect(voiceFlow['ttsService']).toBe(ttsService);
    expect(voiceFlow['faqs']).toBe(faqs);
  });

  test('should process a complete voice interaction cycle', async () => {
    // Mock the methods to track calls
    const originalProcessTranscript = voiceFlow['processTranscript'];
    const processTranscriptSpy = jest.fn();
    voiceFlow['processTranscript'] = processTranscriptSpy;

    // Start the voice flow
    await voiceFlow.start();

    // Allow time for the mock STT to simulate recognition
    await new Promise(resolve => setTimeout(resolve, 150));

    // Verify that the transcript was processed
    expect(processTranscriptSpy).toHaveBeenCalled();

    // Restore original method
    voiceFlow['processTranscript'] = originalProcessTranscript;
  });

  test('should handle speech recognition and generate appropriate response', async () => {
    const question = 'What is your return policy?';
    const expectedAnswer = 'Based on your question "What is your return policy?", our return policy is 30 days.';

    // Directly test the transcript processing
    const result = await voiceFlow['processTranscript'](question);

    expect(result).toBe(expectedAnswer);
  });

  test('should handle speaking the generated response', async () => {
    const question = 'What is your return policy?';
    const answer = 'Based on your question "What is your return policy?", our return policy is 30 days.';

    // Mock the speak method to track calls
    const originalSpeak = ttsService.speak;
    const speakSpy = jest.fn().mockResolvedValue(undefined);
    ttsService.speak = speakSpy;

    // Process the transcript which should trigger speech
    await voiceFlow['processTranscript'](question);

    // Verify that the TTS service was called with the answer
    expect(speakSpy).toHaveBeenCalledWith(answer, undefined);

    // Restore original method
    ttsService.speak = originalSpeak;
  });

  test('should stop the voice flow properly', async () => {
    await voiceFlow.start();

    // Verify it's running
    expect(voiceFlow['isActive']).toBe(true);

    // Stop the voice flow
    await voiceFlow.stop();

    // Verify it's stopped
    expect(voiceFlow['isActive']).toBe(false);
    expect(sttService.isListening()).toBe(false);
    expect(ttsService.isSpeaking()).toBe(false);
  });

  test('should handle errors gracefully during the flow', async () => {
    // Create a mock LLM service that throws an error
    const errorLLMService: LLMService = {
      generateAnswer: jest.fn().mockRejectedValue(new Error('LLM Error')),
      getTokenUsage: jest.fn(),
      getModelInfo: jest.fn(),
      testConnection: jest.fn()
    };

    const errorVoiceFlow = new VoiceFlow(
      new MockSTTService(),
      errorLLMService,
      new MockTTSService(),
      faqs
    );

    // Spy on console.error to verify error handling
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    try {
      await errorVoiceFlow['processTranscript']('Test question');
    } catch (error) {
      // Expected to handle the error internally
    }

    // Verify that errors are logged
    expect(consoleSpy).toHaveBeenCalledWith('Error processing transcript:', expect.any(Error));

    // Restore console.error
    consoleSpy.mockRestore();
  });

  test('should maintain correct state throughout the flow', async () => {
    // Initially inactive
    expect(voiceFlow['isActive']).toBe(false);
    expect(sttService.isListening()).toBe(false);

    // After starting
    await voiceFlow.start();
    expect(voiceFlow['isActive']).toBe(true);
    // Note: The mock STT service state might not perfectly reflect real behavior
    // This test is more about verifying the flow maintains its internal state

    // After stopping
    await voiceFlow.stop();
    expect(voiceFlow['isActive']).toBe(false);
  });

  test('should find relevant FAQs based on the question', () => {
    const question = 'What is your return policy?';

    const relevantFaqs = voiceFlow['findRelevantFAQs'](question);

    // Should find the return policy FAQ
    expect(relevantFaqs).toHaveLength(1);
    expect(relevantFaqs[0].question).toBe('Return Policy');
  });
});