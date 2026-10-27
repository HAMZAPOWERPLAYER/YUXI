import * as Speech from 'expo-speech';

import {
  NORMAL_RATE,
  SLOW_RATE,
  hasJapaneseVoice,
  loadJapaneseVoice,
  resetVoiceCache,
  selectJapaneseVoice,
  speakJapanese,
  stopSpeaking,
} from '@/services/tts';

jest.mock('expo-speech', () => ({
  getAvailableVoicesAsync: jest.fn(),
  speak: jest.fn(),
  stop: jest.fn(),
  maxSpeechInputLength: 4000,
  VoiceQuality: { Default: 'Default', Enhanced: 'Enhanced' },
}));

const getVoices = Speech.getAvailableVoicesAsync as jest.Mock;
const speak = Speech.speak as jest.Mock;
const stop = Speech.stop as jest.Mock;

const jaJp = {
  identifier: 'ja-jp-voice',
  language: 'ja-JP',
  name: 'Japanese',
  quality: Speech.VoiceQuality.Default,
};
const jaJpEnhanced = {
  identifier: 'ja-jp-enhanced',
  language: 'ja-JP',
  name: 'Japanese Enhanced',
  quality: Speech.VoiceQuality.Enhanced,
};
const jaAny = {
  identifier: 'ja-other',
  language: 'ja',
  name: 'Japanese Generic',
  quality: Speech.VoiceQuality.Default,
};

beforeEach(() => {
  jest.resetAllMocks();
  resetVoiceCache();
  getVoices.mockResolvedValue([]);
  stop.mockResolvedValue(undefined);
});

describe('selectJapaneseVoice', () => {
  it('returns null when no Japanese voice is installed', () => {
    expect(selectJapaneseVoice([])).toBeNull();
    expect(
      selectJapaneseVoice([
        {
          identifier: 'en',
          language: 'en-US',
          name: 'English',
          quality: Speech.VoiceQuality.Default,
        },
      ]),
    ).toBeNull();
  });

  it('prefers ja-JP over a generic Japanese voice', () => {
    expect(selectJapaneseVoice([jaAny, jaJp])?.identifier).toBe('ja-jp-voice');
    expect(selectJapaneseVoice([jaJp, jaAny])?.identifier).toBe('ja-jp-voice');
  });

  it('prefers an enhanced ja-JP voice', () => {
    expect(selectJapaneseVoice([jaJp, jaJpEnhanced])?.identifier).toBe('ja-jp-enhanced');
  });

  it('accepts a generic Japanese voice when nothing else exists', () => {
    expect(selectJapaneseVoice([jaAny])?.identifier).toBe('ja-other');
  });
});

describe('loadJapaneseVoice', () => {
  it('caches the installed voice until forced to refresh', async () => {
    getVoices.mockResolvedValue([jaJp]);
    await expect(hasJapaneseVoice()).resolves.toBe(true);
    await expect(loadJapaneseVoice()).resolves.toMatchObject({ identifier: 'ja-jp-voice' });
    expect(getVoices).toHaveBeenCalledTimes(1);

    await expect(hasJapaneseVoice(true)).resolves.toBe(true);
    expect(getVoices).toHaveBeenCalledTimes(2);
  });

  it('resolves to null when the platform lookup fails', async () => {
    getVoices.mockRejectedValue(new Error('no engine'));
    await expect(loadJapaneseVoice()).resolves.toBeNull();
    await expect(hasJapaneseVoice()).resolves.toBe(false);
  });
});

describe('speakJapanese', () => {
  it('rejects empty text without touching the voice list', async () => {
    await expect(speakJapanese('   ')).resolves.toBe('empty');
    expect(getVoices).not.toHaveBeenCalled();
    expect(speak).not.toHaveBeenCalled();
  });

  it('reports a missing voice instead of speaking', async () => {
    getVoices.mockResolvedValue([]);
    await expect(speakJapanese('あ')).resolves.toBe('missing-voice');
    expect(speak).not.toHaveBeenCalled();
  });

  it('speaks with the installed Japanese voice at the normal rate', async () => {
    getVoices.mockResolvedValue([jaJp]);
    await expect(speakJapanese('あ')).resolves.toBe('spoken');
    expect(stop).toHaveBeenCalled();
    expect(speak).toHaveBeenCalledWith(
      'あ',
      expect.objectContaining({
        language: 'ja-JP',
        voice: 'ja-jp-voice',
        rate: NORMAL_RATE,
        pitch: 1,
      }),
    );
  });

  it('supports the slow playback rate', async () => {
    getVoices.mockResolvedValue([jaJp]);
    await expect(speakJapanese('あ', { slow: true })).resolves.toBe('spoken');
    expect(speak).toHaveBeenCalledWith('あ', expect.objectContaining({ rate: SLOW_RATE }));
  });

  it('forwards completion and error callbacks', async () => {
    getVoices.mockResolvedValue([jaJp]);
    const onDone = jest.fn();
    const onError = jest.fn();
    await speakJapanese('あ', { onDone, onError });
    const options = speak.mock.calls[0]?.[1] as {
      onDone: () => void;
      onError: (error: Error) => void;
    };
    options.onDone();
    options.onError(new Error('playback'));
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('fails safely when the text is longer than the platform limit', async () => {
    getVoices.mockResolvedValue([jaJp]);
    await expect(speakJapanese('あ'.repeat(4001))).resolves.toBe('failed');
    expect(speak).not.toHaveBeenCalled();
  });

  it('returns failed if the speech engine throws', async () => {
    getVoices.mockResolvedValue([jaJp]);
    speak.mockImplementation(() => {
      throw new Error('engine');
    });
    await expect(speakJapanese('あ')).resolves.toBe('failed');
  });

  it('still attempts to speak when stopping the previous utterance fails', async () => {
    getVoices.mockResolvedValue([jaJp]);
    stop.mockRejectedValue(new Error('not speaking'));
    await expect(speakJapanese('あ')).resolves.toBe('spoken');
  });
});

describe('stopSpeaking', () => {
  it('swallows stop errors', async () => {
    stop.mockRejectedValue(new Error('engine'));
    await expect(stopSpeaking()).resolves.toBeUndefined();
  });
});
