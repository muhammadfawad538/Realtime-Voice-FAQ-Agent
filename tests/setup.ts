import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Web Speech API (not available in jsdom)
global.SpeechRecognition = class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = 'en-US';
  
  start() {}
  stop() {}
  abort() {}
  
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onresult: ((event: any) => void) | null = null;
  onspeechend: (() => void) | null = null;
  onsoundstart: (() => void) | null = null;
  onsoundend: (() => void) | null = null;
  onaudiostart: (() => void) | null = null;
  onaudioend: (() => void) | null = null;
};

global.webkitSpeechRecognition = global.SpeechRecognition;

// Mock SpeechSynthesis
global.speechSynthesis = {
  speak: () => {},
  cancel: () => {},
  pause: () => {},
  resume: () => {},
  getVoices: () => [],
  pending: false,
  speaking: false,
  paused: false,
  onvoiceschanged: null,
};

// Mock localStorage
const localStorageMock = {
  store: new Map<string, string>(),
  getItem: function (key: string): string | null {
    return this.store.get(key) || null;
  },
  setItem: function (key: string, value: string): void {
    this.store.set(key, value);
  },
  removeItem: function (key: string): void {
    this.store.delete(key);
  },
  clear: function (): void {
    this.store.clear();
  },
  key: function (index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] || null;
  },
  get length(): number {
    return this.store.size;
  },
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock matchMedia
Object.defineProperty(global, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
