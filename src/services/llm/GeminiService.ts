/**
 * Gemini API Service Implementation
 *
 * Uses Google's Gemini API for generating answers to user questions.
 * Integrates with FAQ context to provide relevant responses.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMService, LLMConfig, LLMError, LLMRateLimitError, LLMTokenLimitError } from './llm-contract';
import { FAQItem } from '../../types';
import { apiUsageTracker } from '../APIUsageTracker';

export class GeminiService implements LLMService {
  private generativeModel: any;
  private config: Required<LLMConfig>;
  private tokenUsage: { input: number; output: number };

  constructor(config: LLMConfig) {
    const apiKey = config.apiKey || import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('Gemini API key is required. Set VITE_GEMINI_API_KEY environment variable.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    this.config = {
      apiKey,
      model: config.model || 'gemini-pro',
      temperature: config.temperature ?? 0.7,
      maxOutputTokens: config.maxOutputTokens ?? 500,
      topP: config.topP ?? 0.95,
      systemPrompt: config.systemPrompt || `You are a helpful FAQ assistant. Use the provided FAQ context to answer questions. If the FAQ context doesn't contain the information needed to answer the question, politely explain that you don't have that information and suggest contacting support. Be concise but informative in your responses.`,
    };

    this.generativeModel = genAI.getGenerativeModel({
      model: this.config.model,
      systemInstruction: this.config.systemPrompt
    });

    this.tokenUsage = { input: 0, output: 0 };
  }

  async generateAnswer(question: string, faqContext: FAQItem[]): Promise<string> {
    try {
      // Prepare context from FAQs
      const faqContextText = this.formatFAQContext(faqContext);

      // Construct the prompt with FAQ context
      const prompt = this.buildPrompt(question, faqContextText);

      // Generate content using Gemini
      const result = await this.generativeModel.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxOutputTokens,
          topP: this.config.topP,
        }
      });

      const response = await result.response;
      const text = response.text();

      // Track token usage
      const usage = result.response.usageMetadata;
      if (usage) {
        const inputTokens = usage.promptTokenCount || 0;
        const outputTokens = usage.candidatesTokenCount || 0;

        this.tokenUsage.input += inputTokens;
        this.tokenUsage.output += outputTokens;

        // Update API usage tracker
        await apiUsageTracker.trackGeminiUsage(inputTokens + outputTokens);
      }

      return text;
    } catch (error: any) {
      // Handle specific Gemini API errors
      if (error.status === 429) {
        throw new LLMRateLimitError('Gemini API rate limit exceeded', error);
      } else if (error.status === 400) {
        throw new LLMTokenLimitError('Gemini API token limit exceeded', error);
      } else if (error.message?.includes('quota')) {
        throw new LLMTokenLimitError('Gemini API quota exceeded', error);
      } else {
        throw new LLMError(`Gemini API error: ${error.message}`, undefined, error);
      }
    }
  }

  async getTokenUsage(): Promise<{ input: number; output: number }> {
    return { ...this.tokenUsage };
  }

  /**
   * Format FAQ context for inclusion in the prompt
   */
  private formatFAQContext(faqs: FAQItem[]): string {
    if (!faqs || faqs.length === 0) {
      return 'No relevant FAQ items found.';
    }

    return faqs.map(faq =>
      `Q: ${faq.question}\nA: ${faq.answer}`
    ).join('\n\n');
  }

  /**
   * Build the complete prompt with question and FAQ context
   */
  private buildPrompt(question: string, faqContext: string): string {
    return `FAQ Context:\n${faqContext}\n\nUser Question: ${question}\n\nPlease provide a helpful answer based on the FAQ context above. If the context doesn't contain the information needed, politely explain that you don't have that information and suggest contacting support.`;
  }

  /**
   * Test the connection to the Gemini API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.generateAnswer("Hello, can you respond to this test question?", []);
      return true;
    } catch (error) {
      console.error('Gemini API connection test failed:', error);
      return false;
    }
  }

  /**
   * Get the current model information
   */
  getModelInfo(): { name: string; capabilities: string[] } {
    return {
      name: this.config.model,
      capabilities: ['text-generation', 'context-understanding']
    };
  }
}

/**
 * Factory function to create a Gemini service instance
 */
export function createGeminiService(config: LLMConfig): GeminiService {
  return new GeminiService(config);
}

/**
 * Check if Gemini API key is configured
 */
export function isGeminiConfigured(): boolean {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  return !!apiKey;
}