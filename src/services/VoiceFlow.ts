/**
 * Voice Flow Manager
 *
 * Orchestrates the interaction between STT, LLM, and TTS services
 * to create a seamless voice FAQ agent experience.
 */

import { STTService } from './stt/stt-contract';
import { LLMService } from './llm/llm-contract';
import { TTSService } from './tts/tts-contract';
import { FAQItem } from '../types';

export class VoiceFlow {
  private sttService: STTService;
  private llmService: LLMService;
  private ttsService: TTSService;
  private faqs: FAQItem[];
  private isActive: boolean = false;
  private onResultCallback: ((result: string) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;

  constructor(
    sttService: STTService,
    llmService: LLMService,
    ttsService: TTSService,
    faqs: FAQItem[]
  ) {
    this.sttService = sttService;
    this.llmService = llmService;
    this.ttsService = ttsService;
    this.faqs = faqs;
  }

  /**
   * Starts the voice flow
   */
  async start(): Promise<void> {
    if (this.isActive) {
      throw new Error('Voice flow is already active');
    }

    this.isActive = true;
    await this.sttService.startListening(async (transcript: string) => {
      if (this.isActive) {
        await this.processTranscript(transcript);
      }
    });
  }

  /**
   * Stops the voice flow
   */
  async stop(): Promise<void> {
    this.isActive = false;
    await this.sttService.stopListening();
    
    // Stop any ongoing speech
    if (this.ttsService.isSpeaking() || this.ttsService.isPaused()) {
      await this.ttsService.stop();
    }
  }

  /**
   * Processes the transcribed text through the LLM and responds via TTS
   */
  async processTranscript(transcript: string): Promise<string> {
    try {
      // Find relevant FAQs based on the transcript
      const relevantFaqs = this.findRelevantFAQs(transcript);

      // Generate an answer using the LLM
      const answer = await this.llmService.generateAnswer(transcript, relevantFaqs);

      // Speak the answer using TTS
      await this.ttsService.speak(answer);

      // Notify any listeners of the result
      if (this.onResultCallback) {
        this.onResultCallback(answer);
      }

      return answer;
    } catch (error) {
      console.error('Error processing transcript:', error);
      
      // Notify any listeners of the error
      if (this.onErrorCallback) {
        this.onErrorCallback(error as Error);
      }
      
      throw error;
    }
  }

  /**
   * Finds FAQs that are relevant to the given question
   */
  findRelevantFAQs(question: string): FAQItem[] {
    const lowerQuestion = question.toLowerCase();
    return this.faqs.filter(faq => 
      faq.question.toLowerCase().includes(lowerQuestion) ||
      faq.answer.toLowerCase().includes(lowerQuestion) ||
      // Simple keyword matching
      this.extractKeywords(lowerQuestion).some(keyword => 
        faq.question.toLowerCase().includes(keyword) || 
        faq.answer.toLowerCase().includes(keyword)
      )
    );
  }

  /**
   * Extracts keywords from a question for matching
   */
  private extractKeywords(text: string): string[] {
    // Remove common stop words and return meaningful keywords
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 10); // Limit to 10 keywords
  }

  /**
   * Sets a callback for when a result is generated
   */
  setResultCallback(callback: (result: string) => void): void {
    this.onResultCallback = callback;
  }

  /**
   * Sets a callback for when an error occurs
   */
  setErrorCallback(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Checks if the voice flow is currently active
   */
  isActive(): boolean {
    return this.isActive;
  }

  /**
   * Updates the FAQs used by the voice flow
   */
  updateFAQs(faqs: FAQItem[]): void {
    this.faqs = faqs;
  }
}
