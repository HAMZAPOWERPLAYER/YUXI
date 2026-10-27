import * as Speech from 'expo-speech';

import { logEvent } from '@/utils/logger';

export type JapaneseVoiceInfo = Pick<Speech.Voice, 'identifier' | 'language' | 'name' | 'quality'>;

export type SpeakOutcome = 'spoken' | 'missing-voice' | 'empty' | 'failed';

export type SpeakOptions = {
  slow?: boolean;
  onDone?: () => void;
  onError?: (error: Error) => void;
};

export const NORMAL_RATE = 0.85;
export const SLOW_RATE = 0.6;

let voiceCache: Promise<JapaneseVoiceInfo | null> | null = null;

/**
 * Chooses the best installed Japanese voice. Prefers ja-JP and enhanced
 * quality; returns null when the device has no Japanese data installed.
 */
export function selectJapaneseVoice(
  voices: readonly JapaneseVoiceInfo[],
): JapaneseVoiceInfo | null {
  const japanese = voices.filter((voice) => voice.language.toLowerCase().startsWith('ja'));
  if (japanese.length === 0) return null;

  const score = (voice: JapaneseVoiceInfo): number => {
    let value = 0;
    if (voice.language.toLowerCase() === 'ja-jp') value += 2;
    if (voice.quality === Speech.VoiceQuality.Enhanced) value += 1;
    return value;
  };

  return [...japanese].sort((a, b) => score(b) - score(a))[0] ?? null;
}

/** Cached lookup. Pass true after the user installs voice data. */
export function loadJapaneseVoice(force = false): Promise<JapaneseVoiceInfo | null> {
  if (!voiceCache || force) {
    voiceCache = Speech.getAvailableVoicesAsync()
      .then((voices) => selectJapaneseVoice(voices))
      .catch((error: unknown) => {
        logEvent('debug', 'Could not read available voices', error);
        return null;
      });
  }
  return voiceCache;
}

export function resetVoiceCache(): void {
  voiceCache = null;
}

export async function hasJapaneseVoice(force = false): Promise<boolean> {
  return (await loadJapaneseVoice(force)) !== null;
}

/** Stops any current utterance. Safe to call on unmount. */
export async function stopSpeaking(): Promise<void> {
  try {
    await Speech.stop();
  } catch (error) {
    logEvent('debug', 'Could not stop speech', error);
  }
}

/**
 * Speaks Japanese text with the installed voice. Returns a status instead of
 * throwing so the caller can show the "install a Japanese voice" flow.
 */
export async function speakJapanese(
  text: string,
  options: SpeakOptions = {},
): Promise<SpeakOutcome> {
  const value = text.trim();
  if (value.length === 0) return 'empty';

  const voice = await loadJapaneseVoice();
  if (!voice) return 'missing-voice';
  if (value.length > Speech.maxSpeechInputLength) {
    logEvent('warn', 'Speech text exceeds the platform limit');
    return 'failed';
  }

  try {
    await stopSpeaking();
    Speech.speak(value, {
      language: voice.language,
      voice: voice.identifier,
      rate: options.slow ? SLOW_RATE : NORMAL_RATE,
      pitch: 1,
      onDone: options.onDone,
      onError: (error: Error) => {
        logEvent('debug', 'Speech playback failed', error);
        options.onError?.(error);
      },
    });
    return 'spoken';
  } catch (error) {
    logEvent('error', 'Could not start speech', error);
    return 'failed';
  }
}
