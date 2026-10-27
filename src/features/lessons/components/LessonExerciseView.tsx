import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Row } from '@/components/Row';
import { Stack } from '@/components/Stack';
import type { FuriganaSegment } from '@/features/content';
import type { ExerciseAttempt, GeneratedExercise } from '@/features/exercises';
import { FuriganaText } from '@/features/exercises/components/FuriganaText';
import { useI18n, useT } from '@/i18n';
import { useAppTheme } from '@/theme/ThemeProvider';

import { ExerciseChoiceButton, type ExerciseChoiceState } from './ExerciseChoiceButton';
import { ExercisePrompt } from './ExercisePrompt';
import { LessonProgressHeader } from './LessonProgressHeader';

export type ExerciseFeedback = {
  attempt: ExerciseAttempt;
  correct: boolean;
};

export type LessonExerciseViewProps = {
  exercise: GeneratedExercise;
  currentNumber: number;
  total: number;
  isLast: boolean;
  feedback: ExerciseFeedback | null;
  saving: boolean;
  saveError: boolean;
  onCheck: (attempt: ExerciseAttempt) => void;
  onNext: () => void;
  onQuit: () => void;
};

type AnswerDisplay = {
  text: string;
  japanese: boolean;
  segments?: FuriganaSegment[];
};

function localized(language: 'ur' | 'en', en: string | undefined, ur: string | undefined): string {
  if (language === 'ur') return ur ?? en ?? '';
  return en ?? ur ?? '';
}

function segmentsForTile(text: string, reading: string | undefined): FuriganaSegment[] | undefined {
  return reading && reading !== text ? [{ text, reading }] : undefined;
}

function correctAnswerDisplay(exercise: GeneratedExercise, language: 'ur' | 'en'): AnswerDisplay {
  switch (exercise.kind) {
    case 'meaning-choice': {
      const option = exercise.options.find((entry) => entry.id === exercise.correctOptionId);
      return {
        text: localized(language, option?.en, option?.ur),
        japanese: false,
      };
    }
    case 'reverse-choice': {
      const option = exercise.options.find((entry) => entry.id === exercise.correctOptionId);
      const text = option?.ja ?? '';
      const segments = option ? segmentsForTile(text, option.reading) : undefined;
      return { text, japanese: true, ...(segments ? { segments } : {}) };
    }
    case 'sentence-builder': {
      const tiles = exercise.correctTileIds
        .map((id) => exercise.tiles.find((tile) => tile.id === id))
        .filter((tile): tile is NonNullable<typeof tile> => tile !== undefined);
      const segments: FuriganaSegment[] = [];
      for (const tile of tiles) {
        const reading = segmentsForTile(tile.surface, tile.reading);
        if (reading) segments.push(...reading);
        else segments.push({ text: tile.surface });
      }
      return {
        text: tiles.map((tile) => tile.surface).join(''),
        japanese: true,
        ...(segments.some((segment) => segment.reading) ? { segments } : {}),
      };
    }
    case 'particle-cloze': {
      const segments: FuriganaSegment[] = [];
      let text = '';
      for (const piece of exercise.pieces) {
        if (piece.kind === 'blank') {
          text += exercise.correctParticle;
          segments.push({ text: exercise.correctParticle });
          continue;
        }
        text += piece.text;
        const reading = segmentsForTile(piece.text, piece.reading);
        if (reading) segments.push(...reading);
        else segments.push({ text: piece.text });
      }
      return {
        text,
        japanese: true,
        ...(segments.some((segment) => segment.reading) ? { segments } : {}),
      };
    }
  }
}

export function LessonExerciseView({
  exercise,
  currentNumber,
  total,
  isLast,
  feedback,
  saving,
  saveError,
  onCheck,
  onNext,
  onQuit,
}: LessonExerciseViewProps) {
  const t = useT();
  const theme = useAppTheme();
  const { language } = useI18n();
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [orderedTileIds, setOrderedTileIds] = useState<string[]>([]);
  const [selectedParticle, setSelectedParticle] = useState<string | null>(null);

  const buildAttempt = (): ExerciseAttempt | null => {
    switch (exercise.kind) {
      case 'meaning-choice':
      case 'reverse-choice':
        return selectedOptionId ? { kind: 'choice', optionId: selectedOptionId } : null;
      case 'sentence-builder':
        return orderedTileIds.length === exercise.tiles.length
          ? { kind: 'sentence-builder', orderedTileIds }
          : null;
      case 'particle-cloze':
        return selectedParticle ? { kind: 'particle-cloze', particle: selectedParticle } : null;
    }
  };

  const canSubmit = feedback === null && buildAttempt() !== null;
  const answer = feedback ? correctAnswerDisplay(exercise, language) : null;

  const choiceState = (optionId: string): ExerciseChoiceState => {
    if (!feedback) return selectedOptionId === optionId ? 'selected' : 'idle';
    if (exercise.kind !== 'meaning-choice' && exercise.kind !== 'reverse-choice') return 'muted';
    if (optionId === exercise.correctOptionId) return 'correct';
    if (feedback.attempt.kind === 'choice' && feedback.attempt.optionId === optionId)
      return 'wrong';
    return 'muted';
  };

  const particleState = (particle: string): ExerciseChoiceState => {
    if (!feedback) return selectedParticle === particle ? 'selected' : 'idle';
    if (exercise.kind !== 'particle-cloze') return 'muted';
    if (particle === exercise.correctParticle) return 'correct';
    if (feedback.attempt.kind === 'particle-cloze' && feedback.attempt.particle === particle) {
      return 'wrong';
    }
    return 'muted';
  };

  const optionLabel = (optionId: string): { label: string; caption?: string } => {
    if (exercise.kind === 'reverse-choice') {
      const option = exercise.options.find((entry) => entry.id === optionId);
      return {
        label: option?.ja ?? '',
        ...(option?.reading ? { caption: option.reading } : {}),
      };
    }
    if (exercise.kind === 'meaning-choice') {
      const option = exercise.options.find((entry) => entry.id === optionId);
      return { label: localized(language, option?.en, option?.ur) };
    }
    return { label: optionId };
  };

  const toggleTile = (tileId: string) => {
    if (feedback) return;
    setOrderedTileIds((current) =>
      current.includes(tileId) ? current.filter((id) => id !== tileId) : [...current, tileId],
    );
  };

  const removeTile = (tileId: string) => {
    if (feedback) return;
    setOrderedTileIds((current) => current.filter((id) => id !== tileId));
  };

  const orderedTiles = orderedTileIds
    .map((id) =>
      exercise.kind === 'sentence-builder'
        ? exercise.tiles.find((tile) => tile.id === id)
        : undefined,
    )
    .filter((tile): tile is NonNullable<typeof tile> => tile !== undefined);

  const answerBorder = feedback
    ? feedback.correct
      ? theme.colors.success
      : theme.colors.danger
    : theme.colors.border;

  return (
    <Stack gap={theme.spacing.md}>
      <LessonProgressHeader current={currentNumber} onQuit={onQuit} total={total} />

      <ExercisePrompt exercise={exercise} />

      {exercise.kind === 'meaning-choice' || exercise.kind === 'reverse-choice' ? (
        <Row gap={theme.spacing.sm} wrap>
          {exercise.options.map((option) => {
            const state = choiceState(option.id);
            const { label, caption } = optionLabel(option.id);
            const accessibilityLabel =
              state === 'correct'
                ? t('a11y.optionCorrect', { text: label })
                : state === 'wrong'
                  ? t('a11y.optionWrong', { text: label })
                  : label;
            return (
              <ExerciseChoiceButton
                accessibilityLabel={accessibilityLabel}
                caption={caption}
                disabled={feedback !== null}
                japanese={exercise.kind === 'reverse-choice'}
                key={option.id}
                label={label}
                onPress={() => setSelectedOptionId(option.id)}
                state={state}
              />
            );
          })}
        </Row>
      ) : null}

      {exercise.kind === 'sentence-builder' ? (
        <Stack gap={theme.spacing.sm}>
          <View
            style={[
              styles.answerArea,
              {
                backgroundColor: theme.colors.surface2,
                borderColor: answerBorder,
                borderRadius: theme.radii.md,
              },
            ]}
          >
            {orderedTiles.length === 0 ? (
              <AppText align="center" color="textMuted" variant="caption">
                {t('lesson.tileHint')}
              </AppText>
            ) : (
              <Row gap={6} justify="center" wrap>
                {orderedTiles.map((tile) => (
                  <Pressable
                    accessibilityLabel={t('lesson.removeTile', { text: tile.surface })}
                    accessibilityRole="button"
                    disabled={feedback !== null}
                    key={tile.id}
                    onPress={() => removeTile(tile.id)}
                    style={[
                      styles.tile,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                        borderRadius: theme.radii.sm,
                      },
                    ]}
                  >
                    <AppText lang="ja" variant="kana">
                      {tile.surface}
                    </AppText>
                  </Pressable>
                ))}
              </Row>
            )}
          </View>

          {orderedTileIds.length > 0 && !feedback ? (
            <Button
              fullWidth={false}
              label={t('lesson.clear')}
              onPress={() => setOrderedTileIds([])}
              size="sm"
              variant="ghost"
            />
          ) : null}

          <Row gap={6} justify="center" wrap>
            {exercise.tiles
              .filter((tile) => !orderedTileIds.includes(tile.id))
              .map((tile) => (
                <Pressable
                  accessibilityLabel={t('lesson.addTile', { text: tile.surface })}
                  accessibilityRole="button"
                  disabled={feedback !== null}
                  key={tile.id}
                  onPress={() => toggleTile(tile.id)}
                  style={({ pressed }) => [
                    styles.tile,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radii.sm,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <AppText lang="ja" variant="kana">
                    {tile.surface}
                  </AppText>
                </Pressable>
              ))}
          </Row>
        </Stack>
      ) : null}

      {exercise.kind === 'particle-cloze' ? (
        <Stack gap={theme.spacing.md}>
          <Row align="center" gap={2} justify="center" wrap>
            {exercise.pieces.map((piece, index) => {
              if (piece.kind === 'text') {
                return (
                  <AppText key={`${index}:${piece.text}`} lang="ja" variant="kanaLarge">
                    {piece.text}
                  </AppText>
                );
              }

              const filled = feedback
                ? feedback.correct
                  ? exercise.correctParticle
                  : feedback.attempt.kind === 'particle-cloze'
                    ? feedback.attempt.particle
                    : ''
                : (selectedParticle ?? '');
              return (
                <View
                  key={`blank:${index}`}
                  style={[
                    styles.blank,
                    {
                      backgroundColor: theme.colors.surface2,
                      borderColor: feedback
                        ? feedback.correct
                          ? theme.colors.success
                          : theme.colors.danger
                        : theme.colors.primary,
                      borderRadius: theme.radii.sm,
                    },
                  ]}
                >
                  <AppText
                    color={feedback ? (feedback.correct ? 'success' : 'danger') : 'primaryText'}
                    lang="ja"
                    variant="kanaLarge"
                  >
                    {filled}
                  </AppText>
                </View>
              );
            })}
          </Row>

          <Row gap={theme.spacing.sm} wrap>
            {exercise.options.map((particle) => {
              const state = particleState(particle);
              const accessibilityLabel =
                state === 'correct'
                  ? t('a11y.optionCorrect', { text: particle })
                  : state === 'wrong'
                    ? t('a11y.optionWrong', { text: particle })
                    : particle;
              return (
                <ExerciseChoiceButton
                  accessibilityLabel={accessibilityLabel}
                  disabled={feedback !== null}
                  japanese
                  key={particle}
                  label={particle}
                  onPress={() => setSelectedParticle(particle)}
                  state={state}
                />
              );
            })}
          </Row>
        </Stack>
      ) : null}

      {feedback && answer ? (
        <Card tone={feedback.correct ? 'successSoft' : 'dangerSoft'}>
          <Stack gap={theme.spacing.xs}>
            <Row align="center" gap={theme.spacing.xs}>
              <Icon
                color={feedback.correct ? 'success' : 'danger'}
                name={feedback.correct ? 'checkmark-circle' : 'close-circle'}
                size={22}
              />
              <AppText color={feedback.correct ? 'success' : 'danger'} variant="bodyStrong">
                {feedback.correct ? t('lesson.correct') : t('lesson.wrong')}
              </AppText>
            </Row>

            <Stack gap={2}>
              <AppText color="textMuted" variant="caption">
                {t('lesson.correctAnswer')}
              </AppText>
              {answer.segments ? (
                <FuriganaText segments={answer.segments} text={answer.text} variant="kana" />
              ) : (
                <AppText lang={answer.japanese ? 'ja' : 'auto'} variant="bodyStrong">
                  {answer.text}
                </AppText>
              )}
            </Stack>

            {saveError ? (
              <AppText color="warning" variant="caption">
                {t('lesson.saveError')}
              </AppText>
            ) : null}
          </Stack>
        </Card>
      ) : null}

      {feedback ? (
        <Button
          icon={isLast ? 'flag' : 'arrow-forward'}
          iconPosition={isLast ? 'start' : 'end'}
          label={isLast ? t('lesson.finish') : t('lesson.next')}
          loading={saving}
          onPress={onNext}
        />
      ) : (
        <Button
          disabled={!canSubmit}
          label={t('lesson.check')}
          onPress={() => {
            const attempt = buildAttempt();
            if (attempt) onCheck(attempt);
          }}
        />
      )}
    </Stack>
  );
}

const styles = StyleSheet.create({
  answerArea: {
    borderStyle: 'dashed',
    borderWidth: 1.5,
    minHeight: 68,
    padding: 8,
    justifyContent: 'center',
  },
  blank: {
    alignItems: 'center',
    borderWidth: 1.5,
    height: 48,
    justifyContent: 'center',
    minWidth: 48,
    paddingHorizontal: 6,
  },
  tile: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 12,
  },
});
