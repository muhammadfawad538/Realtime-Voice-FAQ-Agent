# Realtime Voice FAQ Agent

A browser-based voice FAQ agent that uses Web Speech API for speech recognition and synthesis, integrated with Google's Gemini API for intelligent responses to frequently asked questions.

## Features

- 🎤 **Speech Recognition**: Uses Web Speech API for real-time speech-to-text conversion
- 🧠 **Intelligent Responses**: Leverages Gemini API for contextual FAQ answers
- 🔊 **Text-to-Speech**: Converts responses back to speech for natural interaction
- 🌐 **Browser Compatible**: Works in modern browsers (Chrome, Edge, Firefox with experimental features)
- 📋 **FAQ Management**: Handles common questions with predefined answers
- 🛡️ **Fallback Support**: Text-only interface when voice features aren't available

## Architecture

The system follows a contract-based architecture with three main components:

- **STT Service**: Speech-to-Text for converting voice to text
- **LLM Service**: Large Language Model for processing questions and generating responses
- **TTS Service**: Text-to-Speech for converting responses to audible output

## Prerequisites

- Modern browser (Chrome, Edge, or Firefox with experimental features enabled)
- Microphone access for speech input
- Internet connection for Gemini API access

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/muhammadfawad538/Realtime-Voice-FAQ-Agent.git
   ```

2. Navigate to the project directory:
   ```bash
   cd Realtime-Voice-FAQ-Agent
   ```

3. Create a `.env` file in the root directory with your Gemini API key:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Open `public/demo.html` in your browser to start using the voice agent

## Usage

1. Open the demo page in a compatible browser
2. Allow microphone access when prompted
3. Click "Start Listening" to begin
4. Speak your question clearly
5. Listen to the voice response or read the text response

## Demo

The project includes a demo interface at `public/demo.html` that showcases the full functionality:
- Real-time speech recognition
- FAQ matching and response generation
- Text-to-speech output
- Browser capability detection

## Components

- `src/services/stt/`: Speech-to-Text implementations
- `src/services/llm/`: Large Language Model integrations
- `src/services/tts/`: Text-to-Speech implementations
- `src/services/VoiceFlow.ts`: Orchestrates the STT→LLM→TTS flow
- `src/utils/browser-feature-detection.ts`: Checks browser compatibility
- `src/components/VoiceAgentFallback.tsx`: Text-only fallback component

## Integration

To integrate with your own FAQ database:
1. Modify the FAQ data source in the LLM service
2. Connect to your backend API endpoints
3. Update the response generation logic as needed

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

MIT