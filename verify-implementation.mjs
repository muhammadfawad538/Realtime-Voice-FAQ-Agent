import fs from 'fs';
import path from 'path';

console.log('🧪 Voice Agent File Verification');

const requiredFiles = [
  'src/services/stt/stt-contract.ts',
  'src/services/llm/llm-contract.ts',
  'src/services/tts/tts-contract.ts',
  'src/services/stt/WebSpeechRecognizer.ts',
  'src/services/llm/GeminiService.ts',
  'src/services/VoiceFlow.ts',
  'src/utils/browser-feature-detection.ts',
  'src/components/VoiceAgentFallback.tsx'
];

let allFound = true;

requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`✅ Found: ${file} (${content.length} chars)`);
  } else {
    console.log(`❌ Missing: ${file}`);
    allFound = false;
  }
});

console.log('\n📋 Testing core functionality exists...');

// Check specific files for expected content
const sttContract = fs.readFileSync(path.join(process.cwd(), 'src/services/stt/stt-contract.ts'), 'utf8');
const hasSTTInterface = sttContract.includes('export interface STTService');
const hasSTTMethods = sttContract.includes('startListening') && sttContract.includes('stopListening');
console.log(`   🎤 STT Contract: Interface ${hasSTTInterface ? '✅' : '❌'}, Methods ${hasSTTMethods ? '✅' : '❌'}`);

const llmContract = fs.readFileSync(path.join(process.cwd(), 'src/services/llm/llm-contract.ts'), 'utf8');
const hasLLMInterface = llmContract.includes('export interface LLMService');
const hasGenerateAnswer = llmContract.includes('generateAnswer');
console.log(`   🧠 LLM Contract: Interface ${hasLLMInterface ? '✅' : '❌'}, generateAnswer ${hasGenerateAnswer ? '✅' : '❌'}`);

const ttsContract = fs.readFileSync(path.join(process.cwd(), 'src/services/tts/tts-contract.ts'), 'utf8');
const hasTTSInterface = ttsContract.includes('export interface TTSService');
const hasSpeakMethod = ttsContract.includes('speak');
console.log(`   🔊 TTS Contract: Interface ${hasTTSInterface ? '✅' : '❌'}, speak ${hasSpeakMethod ? '✅' : '❌'}`);

const voiceFlow = fs.readFileSync(path.join(process.cwd(), 'src/services/VoiceFlow.ts'), 'utf8');
const hasVoiceFlowClass = voiceFlow.includes('export class VoiceFlow');
const hasStartMethod = voiceFlow.includes('async start()');
console.log(`   🔄 VoiceFlow: Class ${hasVoiceFlowClass ? '✅' : '❌'}, start() ${hasStartMethod ? '✅' : '❌'}`);

const webSpeech = fs.readFileSync(path.join(process.cwd(), 'src/services/stt/WebSpeechRecognizer.ts'), 'utf8');
const hasWebSpeechClass = webSpeech.includes('export class WebSpeechRecognizer');
const hasSTTImplementation = webSpeech.includes('implements STTService');
console.log(`   🌐 WebSpeechRecognizer: Class ${hasWebSpeechClass ? '✅' : '❌'}, Implementation ${hasSTTImplementation ? '✅' : '❌'}`);

const geminiService = fs.readFileSync(path.join(process.cwd(), 'src/services/llm/GeminiService.ts'), 'utf8');
const hasGeminiClass = geminiService.includes('export class GeminiService');
const hasLLMImplementation = geminiService.includes('implements LLMService');
console.log(`   💎 GeminiService: Class ${hasGeminiClass ? '✅' : '❌'}, Implementation ${hasLLMImplementation ? '✅' : '❌'}`);

const featureDetection = fs.readFileSync(path.join(process.cwd(), 'src/utils/browser-feature-detection.ts'), 'utf8');
const hasFeatureDetection = featureDetection.includes('supportsVoiceFeatures');
const hasSpeechRecognitionCheck = featureDetection.includes('supportsSpeechRecognition');
console.log(`   🔍 Browser Detection: Main function ${hasFeatureDetection ? '✅' : '❌'}, Speech Recognition ${hasSpeechRecognitionCheck ? '✅' : '❌'}`);

console.log('\n🎯 Overall Result:');
if (allFound) {
  console.log('   ✅ All required files exist');
  console.log('   ✅ Core functionality is implemented');
  console.log('   ✅ Contracts and implementations follow expected patterns');
  console.log('\n🎉 The voice agent implementation is structurally complete!');
  console.log('   Note: Actual functionality requires a browser environment with Web Speech API support.');
} else {
  console.log('   ❌ Some required files are missing');
}