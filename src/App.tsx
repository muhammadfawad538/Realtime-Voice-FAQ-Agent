import React from 'react';

/**
 * Main Application Component
 * 
 * Voice FAQ Agent - Browser-based voice interaction for FAQ queries
 * 
 * Features:
 * - Voice input via Web Speech API
 * - Gemini-powered FAQ answers
 * - Edge TTS voice output
 * - Visual feedback and accessibility support
 * - FAQ management interface
 */
function App(): React.ReactElement {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Voice FAQ Agent</h1>
        <p className="tagline">Ask questions with your voice, get instant answers</p>
      </header>

      <main id="main-content" className="app-main">
        <div className="placeholder-message">
          <h2>🚧 Under Construction</h2>
          <p>Voice FAQ Agent is being built. Check back soon!</p>
          <p className="tech-stack">
            Built with: Web Speech API • Gemini API • Edge TTS • React • TypeScript
          </p>
        </div>
      </main>

      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Voice FAQ Agent. MIT License.</p>
      </footer>
    </div>
  );
}

export default App;
