/**
 * Browser Feature Detection Utilities
 *
 * Provides functions to detect browser support for various features
 * required by the voice FAQ agent, particularly speech-related APIs.
 */

/**
 * Checks if the browser supports the Web Speech API for speech recognition
 */
export function supportsSpeechRecognition(): boolean {
  return !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);
}

/**
 * Checks if the browser supports the Web Speech API for speech synthesis
 */
export function supportsSpeechSynthesis(): boolean {
  return !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
}

/**
 * Checks if the browser supports MediaDevices API for microphone access
 */
export function supportsMediaDevices(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Checks if the browser supports the required features for the voice FAQ agent
 */
export function supportsVoiceFeatures(): {
  speechRecognition: boolean;
  speechSynthesis: boolean;
  mediaDevices: boolean;
  allRequired: boolean;
} {
  const speechRecognition = supportsSpeechRecognition();
  const speechSynthesis = supportsSpeechSynthesis();
  const mediaDevices = supportsMediaDevices();

  return {
    speechRecognition,
    speechSynthesis,
    mediaDevices,
    allRequired: speechRecognition && speechSynthesis && mediaDevices
  };
}

/**
 * Gets detailed information about browser capabilities
 */
export async function getBrowserCapabilities(): Promise<{
  supportsSpeechRecognition: boolean;
  supportsSpeechSynthesis: boolean;
  supportsMediaDevices: boolean;
  availableVoices: Array<{ name: string; lang: string; default: boolean }>;
  getUserMediaPermission: PermissionState | null;
}> {
  // Check basic feature support
  const speechRecognition = supportsSpeechRecognition();
  const speechSynthesis = supportsSpeechSynthesis();
  const mediaDevices = supportsMediaDevices();

  // Get available voices if speech synthesis is supported
  let availableVoices: Array<{ name: string; lang: string; default: boolean }> = [];
  if (speechSynthesis) {
    // Wait a bit for voices to be loaded
    availableVoices = await new Promise(resolve => {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        resolve(voices.map(voice => ({
          name: voice.name,
          lang: voice.lang,
          default: voice.default
        })));
      };

      // Chrome loads voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      // Try loading immediately
      loadVoices();
    });
  }

  // Check getUserMedia permission status
  let getUserMediaPermission: PermissionState | null = null;
  if (mediaDevices && 'permissions' in navigator) {
    try {
      const permission = await navigator.permissions.query({ name: 'microphone' as any });
      getUserMediaPermission = permission.state;
    } catch (error) {
      // Permission API not supported in this browser
      getUserMediaPermission = null;
    }
  }

  return {
    supportsSpeechRecognition: speechRecognition,
    supportsSpeechSynthesis: speechSynthesis,
    supportsMediaDevices: mediaDevices,
    availableVoices,
    getUserMediaPermission
  };
}

/**
 * Request microphone access permission
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  if (!supportsMediaDevices()) {
    return false;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop all tracks to release the microphone
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.warn('Microphone permission denied:', error);
    return false;
  }
}

/**
 * Check if the application is running in a secure context
 * (required for some browser APIs like getUserMedia)
 */
export function isSecureContext(): boolean {
  return window.isSecureContext;
}
