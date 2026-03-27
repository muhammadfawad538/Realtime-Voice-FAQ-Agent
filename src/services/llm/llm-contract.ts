/**
 * Large Language Model (LLM) Service Contract
 *
 * Defines the interface for large language model services.
 * This contract allows for interchangeable LLM implementations
 * (e.g., OpenAI GPT, Google Gemini, Anthropic Claude, etc.)
 */

import { FAQItem } from '../../types';

export interface LLMService {
  /**
   * Generate an answer to a question based on provided FAQ context
   * @param question The user's question
   * @param faqContext Relevant FAQ items to provide context
   * @returns Promise that resolves to the generated answer
   */
  generateAnswer(question: string, faqContext: FAQItem[]): Promise<string>;

  /**
   * Get the current token usage statistics
   * @returns Object containing input and output token counts
   */
  getTokenUsage(): Promise<{ input: number; output: number }>;

  /**
   * Get information about the current LLM service
   */
  getModelInfo(): {
    name: string;
    capabilities: string[];
  };

  /**
   * Test the connection to the LLM service
   * @returns Promise that resolves to true if connection is successful
   */
  testConnection(): Promise<boolean>;
}

/**
 * Base error class for LLM-related errors
 */
export class LLMError extends Error {
  constructor(message: string, public statusCode?: number, public originalError?: any) {
    super(message);
    this.name = 'LLMError';
  }
}

/**
 * Error thrown when LLM service rate limits are exceeded
 */
export class LLMRateLimitError extends LLMError {
  constructor(message: string = 'Rate limit exceeded for LLM service', originalError?: any) {
    super(message, 429, originalError);
    this.name = 'LLMRateLimitError';
  }
}

/**
 * Error thrown when LLM service token limits are exceeded
 */
export class LLMTokenLimitError extends LLMError {
  constructor(message: string = 'Token limit exceeded for LLM service', originalError?: any) {
    super(message, 400, originalError);
    this.name = 'LLMTokenLimitError';
  }
}

/**
 * Configuration options for LLM services
 */
export interface LLMConfig {
  /**
   * API key for the LLM service
   */
  apiKey?: string;

  /**
   * Model name to use (e.g., 'gpt-4', 'gemini-pro', 'claude-3')
   * @default 'gemini-pro'
   */
  model?: string;

  /**
   * Temperature parameter for response randomness
   * @default 0.7
   */
  temperature?: number;

  /**
   * Maximum number of tokens in the output
   * @default 500
   */
  maxOutputTokens?: number;

  /**
   * Top-P parameter for nucleus sampling
   * @default 0.95
   */
  topP?: number;

  /**
   * System prompt to set the behavior of the LLM
   * @default "You are a helpful FAQ assistant..."
   */
  systemPrompt?: string;

  /**
   * Additional provider-specific options
   */
  [key: string]: any;
}
