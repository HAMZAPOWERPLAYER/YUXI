import { fireEvent, render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import type {
  ChoiceExercise,
  ParticleClozeExercise,
  SentenceBuilderExercise,
} from '@/features/exercises';
import {
  LessonExerciseView,
  type ExerciseFeedback,
} from '@/features/lessons/components/LessonExerciseView';
import { I18nProvider } from '@/i18n';
import { AppThemeProvider } from '@/theme/ThemeProvider';

jest.mock('@/components/ui/Icon', () => ({
  Icon: () => null,
}));

function renderPlayer(element: ReactElement) {
  return render(
    <I18nProvider initialLanguage="en">
      <AppThemeProvider>{element}</AppThemeProvider>
    </I18nProvider>,
  );
}

const choice: ChoiceExercise = {
  kind: 'meaning-choice',
  id: 'lesson:meaning:greet-ohayou',
  sourceId: 'greet-ohayou',
  unitId: 'unit-one',
  lessonId: 'lesson-one',
  prompt: { ja: 'おはよう', reading: 'おはよう' },
  options: [
    { id: 'greet-ohayou', en: 'Good morning', ur: 'صبح بخیر' },
    { id: 'greet-konnichiwa', en: 'Good afternoon', ur: 'دوپہر بخیر' },
  ],
  correctOptionId: 'greet-ohayou',
};

const builder: SentenceBuilderExercise = {
  kind: 'sentence-builder',
  id: 'lesson:builder:sentence-one',
  sourceId: 'sentence-one',
  unitId: 'unit-one',
  lessonId: 'lesson-one',
  prompt: { en: 'This is a book.', ur: 'یہ کتاب ہے۔' },
  tiles: [
    { id: 't2', surface: '本' },
    { id: 't0', surface: 'これ' },
    { id: 't4', surface: '。' },
    { id: 't1', surface: 'は' },
    { id: 't3', surface: 'です' },
  ],
  acceptedOrders: [['t0', 't1', 't2', 't3', 't4']],
  correctTileIds: ['t0', 't1', 't2', 't3', 't4'],
};

const cloze: ParticleClozeExercise = {
  kind: 'particle-cloze',
  id: 'lesson:cloze:sentence-one',
  sourceId: 'sentence-one',
  unitId: 'unit-one',
  lessonId: 'lesson-one',
  prompt: { en: 'This is a book.', ur: 'یہ کتاب ہے۔' },
  pieces: [
    { kind: 'text', text: 'これ' },
    { kind: 'blank' },
    { kind: 'text', text: '本' },
    { kind: 'text', text: 'です' },
    { kind: 'text', text: '。' },
  ],
  options: ['が', 'は'],
  correctParticle: 'は',
};

function baseProps(exercise: ChoiceExercise | SentenceBuilderExercise | ParticleClozeExercise) {
  return {
    exercise,
    currentNumber: 1,
    total: 3,
    isLast: false,
    feedback: null as ExerciseFeedback | null,
    saving: false,
    saveError: false,
    onCheck: jest.fn(),
    onNext: jest.fn(),
    onQuit: jest.fn(),
  };
}

describe('LessonExerciseView', () => {
  it('submits a choice answer and shows the correction after grading', async () => {
    const props = baseProps(choice);
    const screen = await renderPlayer(<LessonExerciseView {...props} />);

    expect(screen.getByText('Choose the meaning')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Good afternoon'));
    await fireEvent.press(screen.getByText('Check'));

    expect(props.onCheck).toHaveBeenCalledWith({
      kind: 'choice',
      optionId: 'greet-konnichiwa',
    });

    const feedback: ExerciseFeedback = {
      attempt: { kind: 'choice', optionId: 'greet-konnichiwa' },
      correct: false,
    };
    await screen.rerender(
      <I18nProvider initialLanguage="en">
        <AppThemeProvider>
          <LessonExerciseView {...props} feedback={feedback} />
        </AppThemeProvider>
      </I18nProvider>,
    );

    expect(screen.getByText('Not quite')).toBeTruthy();
    expect(screen.getByText('Correct answer')).toBeTruthy();
    expect(screen.getAllByText('Good morning')).toHaveLength(2);
    await fireEvent.press(screen.getByText('Next'));
    expect(props.onNext).toHaveBeenCalledTimes(1);
  });

  it('builds a sentence from tiles and submits the ordered ids', async () => {
    const props = baseProps(builder);
    const screen = await renderPlayer(<LessonExerciseView {...props} />);

    for (const tile of builder.correctTileIds) {
      const surface = builder.tiles.find((entry) => entry.id === tile)?.surface;
      if (!surface) throw new Error('Missing tile');
      await fireEvent.press(screen.getByLabelText(`Add ${surface}`));
    }
    await fireEvent.press(screen.getByText('Check'));

    expect(props.onCheck).toHaveBeenCalledWith({
      kind: 'sentence-builder',
      orderedTileIds: builder.correctTileIds,
    });
  });

  it('removes a selected tile before submitting', async () => {
    const props = baseProps(builder);
    const screen = await renderPlayer(<LessonExerciseView {...props} />);

    await fireEvent.press(screen.getByLabelText('Add これ'));
    await fireEvent.press(screen.getByLabelText('Remove これ'));

    expect(screen.getByLabelText('Add これ')).toBeTruthy();
    expect(props.onCheck).not.toHaveBeenCalled();
  });

  it('submits the selected particle and disables input after grading', async () => {
    const props = baseProps(cloze);
    const screen = await renderPlayer(<LessonExerciseView {...props} />);

    expect(screen.getByText('Choose the missing particle')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('は'));
    expect(screen.getAllByText('は')).toHaveLength(2);
    await fireEvent.press(screen.getByText('Check'));

    expect(props.onCheck).toHaveBeenCalledWith({
      kind: 'particle-cloze',
      particle: 'は',
    });
  });

  it('renders a correct feedback panel and the finish action on the last exercise', async () => {
    const props = baseProps(builder);
    const feedback: ExerciseFeedback = {
      attempt: { kind: 'sentence-builder', orderedTileIds: builder.correctTileIds },
      correct: true,
    };
    const screen = await renderPlayer(<LessonExerciseView {...props} feedback={feedback} isLast />);

    expect(screen.getByText('Correct!')).toBeTruthy();
    expect(screen.getByText('Finish lesson')).toBeTruthy();
    await fireEvent.press(screen.getByText('Finish lesson'));
    expect(props.onNext).toHaveBeenCalledTimes(1);
  });
});
