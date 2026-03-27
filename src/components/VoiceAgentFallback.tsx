/**
 * Text-Only Fallback Component for Voice Agent
 *
 * Provides a text-based interface for environments where voice features
 * are not supported or available. Maintains the same functionality as
 * the voice-enabled version but uses text input/output instead.
 */

import React, { useState, useEffect } from 'react';
import { FAQItem } from '../types';
import { LLMService } from '../services/llm/llm-contract';

interface VoiceAgentFallbackProps {
  llmService: LLMService;
  faqs: FAQItem[];
  className?: string;
}

const VoiceAgentFallback: React.FC<VoiceAgentFallbackProps> = ({ 
  llmService, 
  faqs, 
  className = '' 
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError(null);
    
    try {
      // Find relevant FAQ items based on the input
      const relevantFaqs = faqs.filter(faq => 
        faq.question.toLowerCase().includes(inputText.toLowerCase()) ||
        faq.answer.toLowerCase().includes(inputText.toLowerCase())
      );
      
      // Generate response using LLM
      const answer = await llmService.generateAnswer(inputText, relevantFaqs);
      setResponse(answer);
    } catch (err: any) {
      setError(err.message || 'An error occurred while processing your request.');
      console.error('LLM Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`voice-agent-fallback ${className}`}>
      <div className="fallback-container">
        <h3>FAQ Assistant</h3>
        
        {error && (
          <div className="error-message">
            <p><strong>Error:</strong> {error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="input-form">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your question here..."
            disabled={isLoading}
            rows={3}
            className="input-textarea"
          />
          <button 
            type="submit" 
            disabled={isLoading || !inputText.trim()}
            className="submit-button"
          >
            {isLoading ? 'Processing...' : 'Submit'}
          </button>
        </form>
        
        {response && (
          <div className="response-container">
            <h4>Response:</h4>
            <div className="response-content">{response}</div>
          </div>
        )}
        
        <div className="faq-preview">
          <h4>Related FAQs:</h4>
          <ul>
            {faqs.slice(0, 3).map((faq, index) => (
              <li key={index}>
                <strong>{faq.question}</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <style jsx>{`
        .voice-agent-fallback {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-family: Arial, sans-serif;
        }
        
        .fallback-container h3 {
          margin-top: 0;
          color: #333;
        }
        
        .error-message {
          background-color: #ffebee;
          color: #c62828;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
        }
        
        .input-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .input-textarea {
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          resize: vertical;
          font-size: 14px;
        }
        
        .input-textarea:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }
        
        .submit-button {
          padding: 10px 15px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .submit-button:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }
        
        .response-container {
          margin-top: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 4px;
          border-left: 4px solid #007bff;
        }
        
        .response-container h4 {
          margin-top: 0;
          color: #333;
        }
        
        .faq-preview {
          margin-top: 20px;
        }
        
        .faq-preview h4 {
          color: #333;
        }
        
        .faq-preview ul {
          list-style-type: none;
          padding: 0;
        }
        
        .faq-preview li {
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
      `}</style>
    </div>
  );
};

export default VoiceAgentFallback;
