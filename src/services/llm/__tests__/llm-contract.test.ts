/**
 * LLM Contract Interface Tests
 *
 * Tests for the LLMService interface contract to ensure
 * implementations conform to the expected behavior.
 */

import { LLMService, LLMConfig, LLMError, LLMRateLimitError, LLMTokenLimitError } from '../llm-contract';
import { FAQItem } from '../../../types';

// Mock implementation for testing the contract
class MockLLMService implements LLMService {
  private tokenUsage = { input: 0, output: 0 };
  
  async generateAnswer(question: string, faqContext: FAQItem[]): Promise<string> {
    // Simulate generating an answer based on question and context
    const contextStr = faqContext.map(faq => faq.question).join(', ');
    return `Based on your question "${question}" and context "${contextStr}", here is the answer.`;
  }

  async getTokenUsage(): Promise<{ input: number; output: number }> {
    return { ...this.tokenUsage };
  }

  getModelInfo(): { name: string; capabilities: string[] } {
    return {
      name: 'Mock LLM Service',
      capabilities: ['text-generation', 'mock-capability']
    };
  }

  async testConnection(): Promise<boolean> {
    // Simulate a successful connection test
    return true;
  }
}

describe('LLM Contract Interface', () => {
  let llmService: LLMService;

  beforeEach(() => {
    llmService = new MockLLMService();
  });

  describe('Interface Methods', () => {
    test('should have generateAnswer method', () => {
      expect(llmService.generateAnswer).toBeDefined();
      expect(typeof llmService.generateAnswer).toBe('function');
    });

    test('should have getTokenUsage method', () => {
      expect(llmService.getTokenUsage).toBeDefined();
      expect(typeof llmService.getTokenUsage).toBe('function');
    });

    test('should have getModelInfo method', () => {
      expect(llmService.getModelInfo).toBeDefined();
      expect(typeof llmService.getModelInfo).toBe('function');
    });

    test('should have testConnection method', () => {
      expect(llmService.testConnection).toBeDefined();
      expect(typeof llmService.testConnection).toBe('function');
    });
  });

  describe('generateAnswer method', () => {
    test('should accept a question and FAQ context', async () => {
      const question = 'What is your return policy?';
      const faqContext: FAQItem[] = [
        { question: 'Return Policy', answer: 'We offer a 30-day return policy.' }
      ];
      
      const answer = await llmService.generateAnswer(question, faqContext);
      
      expect(typeof answer).toBe('string');
      expect(answer).toContain(question);
    });

    test('should return a promise with string result', async () => {
      const result = llmService.generateAnswer('Test question', []);
      expect(result).toBeInstanceOf(Promise);
      
      const answer = await result;
      expect(typeof answer).toBe('string');
    });
  });

  describe('getTokenUsage method', () => {
    test('should return token usage object', async () => {
      const usage = await llmService.getTokenUsage();
      
      expect(usage).toHaveProperty('input');
      expect(usage).toHaveProperty('output');
      expect(typeof usage.input).toBe('number');
      expect(typeof usage.output).toBe('number');
    });

    test('should return a promise', async () => {
      const result = llmService.getTokenUsage();
      expect(result).toBeInstanceOf(Promise);
      
      const usage = await result;
      expect(typeof usage).toEqual(expect.objectContaining({
        input: expect.any(Number),
        output: expect.any(Number)
      }));
    });
  });

  describe('getModelInfo method', () => {
    test('should return model information object', () => {
      const info = llmService.getModelInfo();
      
      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('capabilities');
      expect(Array.isArray(info.capabilities)).toBe(true);
      expect(typeof info.name).toBe('string');
    });
  });

  describe('testConnection method', () => {
    test('should return a boolean indicating connection status', async () => {
      const isConnected = await llmService.testConnection();
      expect(typeof isConnected).toBe('boolean');
    });

    test('should return a promise', async () => {
      const result = llmService.testConnection();
      expect(result).toBeInstanceOf(Promise);
      
      const isConnected = await result;
      expect(typeof isConnected).toBe('boolean');
    });
  });

  describe('LLM Error Classes', () => {
    test('LLMError should extend Error', () => {
      const error = new LLMError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(LLMError);
      expect(error.message).toBe('Test error');
    });

    test('LLMRateLimitError should extend LLMError', () => {
      const error = new LLMRateLimitError('Rate limit exceeded');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(LLMError);
      expect(error).toBeInstanceOf(LLMRateLimitError);
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.statusCode).toBe(429);
    });

    test('LLMTokenLimitError should extend LLMError', () => {
      const error = new LLMTokenLimitError('Token limit exceeded');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(LLMError);
      expect(error).toBeInstanceOf(LLMTokenLimitError);
      expect(error.message).toBe('Token limit exceeded');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('LLMConfig Interface', () => {
    test('should accept valid configuration options', () => {
      const config: LLMConfig = {
        apiKey: 'test-key',
        model: 'gpt-4',
        temperature: 0.7,
        maxOutputTokens: 1000,
        topP: 0.9,
        systemPrompt: 'You are a helpful assistant.'
      };
      
      expect(config.apiKey).toBe('test-key');
      expect(config.model).toBe('gpt-4');
      expect(config.temperature).toBe(0.7);
      expect(config.maxOutputTokens).toBe(1000);
      expect(config.topP).toBe(0.9);
      expect(config.systemPrompt).toBe('You are a helpful assistant.');
    });

    test('should allow optional properties to be undefined', () => {
      const config: LLMConfig = {};
      
      expect(config.apiKey).toBeUndefined();
      expect(config.model).toBeUndefined();
      expect(config.temperature).toBeUndefined();
      expect(config.maxOutputTokens).toBeUndefined();
      expect(config.topP).toBeUndefined();
      expect(config.systemPrompt).toBeUndefined();
    });
  });
});
