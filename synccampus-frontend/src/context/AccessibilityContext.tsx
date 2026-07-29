import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';

interface AccessibilityState {
  mode: ThemeMode;
  toggleMode: () => void;
  fontScale: number;
  fontScaleLabel: string;
  increaseFontScale: () => void;
  decreaseFontScale: () => void;
  canIncreaseFontScale: boolean;
  canDecreaseFontScale: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  speakPage: () => void;
  pauseSpeech: () => void;
  resumeSpeech: () => void;
  stopSpeech: () => void;
}

const AccessibilityContext = createContext<AccessibilityState | null>(null);

// Discrete steps rather than a free slider — easier to reason about and to
// keep every screen's fixed-position layouts (e.g. the admin triage grid)
// predictable at each level.
const FONT_SCALE_STEPS = [0.9, 1, 1.1, 1.25, 1.4, 1.6];
const DEFAULT_STEP_INDEX = 1; // 1.0x

const STORAGE_KEY_MODE = 'synccampus_theme_mode';
const STORAGE_KEY_SCALE = 'synccampus_font_scale_index';

function readStoredMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const saved = window.localStorage.getItem(STORAGE_KEY_MODE);
  return saved === 'dark' ? 'dark' : 'light';
}

function readStoredScaleIndex(): number {
  if (typeof window === 'undefined') return DEFAULT_STEP_INDEX;
  const saved = window.localStorage.getItem(STORAGE_KEY_SCALE);
  const idx = saved ? parseInt(saved, 10) : DEFAULT_STEP_INDEX;
  return Number.isInteger(idx) && idx >= 0 && idx < FONT_SCALE_STEPS.length ? idx : DEFAULT_STEP_INDEX;
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(readStoredMode);
  const [scaleIndex, setScaleIndex] = useState<number>(readStoredScaleIndex);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Dark mode: toggling a class on <html> lets index.css flip body defaults,
  // form-control color-scheme (native scrollbars/date pickers), etc.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
    window.localStorage.setItem(STORAGE_KEY_MODE, mode);
  }, [mode]);

  // Font scale: applied as a single CSS `zoom` on <html> — equivalent to the
  // browser's own zoom, so it works on every current and future screen
  // without touching individual font-size declarations anywhere.
  useEffect(() => {
    document.documentElement.style.setProperty('--a11y-zoom', String(FONT_SCALE_STEPS[scaleIndex]));
    window.localStorage.setItem(STORAGE_KEY_SCALE, String(scaleIndex));
  }, [scaleIndex]);

  const toggleMode = useCallback(() => setMode((m) => (m === 'light' ? 'dark' : 'light')), []);
  const increaseFontScale = useCallback(() => setScaleIndex((i) => Math.min(i + 1, FONT_SCALE_STEPS.length - 1)), []);
  const decreaseFontScale = useCallback(() => setScaleIndex((i) => Math.max(i - 1, 0)), []);

  const speakPage = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel();

    const main = document.querySelector('main');
    const text = main?.innerText?.trim();
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
  }, []);

  const pauseSpeech = useCallback(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resumeSpeech = useCallback(() => {
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, []);

  const stopSpeech = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  // Stop any speech in progress when the whole app unmounts (rare in an SPA,
  // but keeps the browser from talking after the tab is effectively gone).
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const fontScale = FONT_SCALE_STEPS[scaleIndex];

  return (
    <AccessibilityContext.Provider
      value={{
        mode,
        toggleMode,
        fontScale,
        fontScaleLabel: `${Math.round(fontScale * 100)}%`,
        increaseFontScale,
        decreaseFontScale,
        canIncreaseFontScale: scaleIndex < FONT_SCALE_STEPS.length - 1,
        canDecreaseFontScale: scaleIndex > 0,
        isSpeaking,
        isPaused,
        speakPage,
        pauseSpeech,
        resumeSpeech,
        stopSpeech,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used within an AccessibilityProvider');
  return ctx;
}