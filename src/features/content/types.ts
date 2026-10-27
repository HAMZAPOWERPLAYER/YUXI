import type { z } from 'zod';

import type {
  contentItemSchema,
  courseFileSchema,
  exerciseTemplateSchema,
  furiganaSegmentSchema,
  lessonRefSchema,
  lessonSchema,
  sentenceItemSchema,
  sentenceTokenSchema,
  unitFileSchema,
  unitRefSchema,
  unitSchema,
  vocabItemSchema,
} from './schema';

export type CourseFile = z.infer<typeof courseFileSchema>;
export type Course = CourseFile['course'];
export type UnitRef = z.infer<typeof unitRefSchema>;
export type Unit = z.infer<typeof unitSchema>;
export type LessonRef = z.infer<typeof lessonRefSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type ItemRef = Lesson['items'][number];
export type UnitFile = z.infer<typeof unitFileSchema>;
export type VocabItem = z.infer<typeof vocabItemSchema>;
export type SentenceItem = z.infer<typeof sentenceItemSchema>;
export type ContentItem = z.infer<typeof contentItemSchema>;
export type FuriganaSegment = z.infer<typeof furiganaSegmentSchema>;
export type SentenceToken = z.infer<typeof sentenceTokenSchema>;
export type ExerciseTemplate = z.infer<typeof exerciseTemplateSchema>;

export type ContentBundle = {
  course: CourseFile;
  units: UnitFile[];
};

export type UnitStats = {
  id: string;
  lessons: number;
  vocabulary: number;
  sentences: number;
  items: number;
};

export type ContentStats = {
  units: number;
  lessons: number;
  vocabulary: number;
  sentences: number;
  items: number;
  byUnit: UnitStats[];
};

export type ValidationSeverity = 'error' | 'warning';

export type ValidationIssue = {
  severity: ValidationSeverity;
  code: string;
  path: string;
  message: string;
};

export type ValidationResult = {
  ok: boolean;
  issues: ValidationIssue[];
  stats: ContentStats;
};
