import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LLMService } from '../../src/services/llm/llm-contract';
import { FAQItem } from '../../src/types';

// Mock implementation for testing contract compliance
class MockLLMService implements LLMService {
  async generateAnswer(question: string, faqContext: FAQItem[]): Promise<string> {
    // Simulate AI response
    return `Mock response to: ${question}`;
  }

  async getTokenUsage(): Promise<{ input: number; output: number }> {
    return { input: 10, output: 20 };
  }
}

describe('LLM Contract Tests', () => {
  let llmService: MockLLMService;

  beforeEach(() => {
    llmService = new MockLLMService();
  });

  it('should implement LLMService interface correctly', () => {
    expect(llmService).toHaveProperty('generateAnswer');
    expect(llmService).toHaveProperty('getTokenUsage');
  });

  it('should generate answer for a given question', async () => {
    const question = 'What are your business hours?';
    const faqContext: FAQItem[] = [];

    const answer = await llmService.generateAnswer(question, faqContext);

    expect(typeof answer).toBe('string');
    expect(answer).toContain('Mock response to:');
    expect(answer).toContain(question);
  });

  it('should return token usage information', async () => {
    const tokenUsage = await llmService.getTokenUsage();

    expect(tokenUsage).toHaveProperty('input');
    expect(tokenUsage).toHaveProperty('output');
    expect(typeof tokenUsage.input).toBe('number');
    expect(typeof tokenUsage.output).toBe('number');
    expect(tokenUsage.input).toBeGreaterThan(0);
    expect(tokenUsage.output).toBeGreaterThan(0);
  });

  it('should handle empty question gracefully', async () => {
    const faqContext: FAQItem[] = [];

    const answer = await llmService.generateAnswer('', faqContext);

    expect(typeof answer).toBe('string');
  });

  it('should handle empty FAQ context gracefully', async () => {
    const question = 'What are your business hours?';

    const answer = await llmService.generateAnswer(question, []);

    expect(typeof answer).toBe('string');
    expect(answer).toContain('Mock response to:');
  });

  it('should handle complex questions with special characters', async () => {
    const question = 'What\'s your policy on "refunds"?';
    const faqContext: FAQItem[] = [];

    const answer = await llmService.generateAnswer(question, faqContext);

    expect(typeof answer).toBe('string');
  });

  it('should return consistent token usage format', async () => {
    const tokenUsage = await llmService.getTokenUsage();

    expect(tokenUsage).toEqual({
      input: expect.any(Number),
      output: expect.any(Number)
    });
  });
});