import type { Language } from '@/i18n/types';

type Titled = {
  titleUr: string;
  titleEn: string;
};

type Described = Titled & {
  descriptionUr: string;
  descriptionEn: string;
};

export function localizedTitle(entry: Titled, language: Language): string {
  return language === 'ur' ? entry.titleUr : entry.titleEn;
}

export function localizedDescription(entry: Described, language: Language): string {
  return language === 'ur' ? entry.descriptionUr : entry.descriptionEn;
}
