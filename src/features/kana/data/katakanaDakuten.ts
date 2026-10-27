import { buildKana, type KanaDataSet } from './buildKana';

export const katakanaDakutenData = {
  needsHumanReview: true,
  script: 'katakana',
  group: 'dakuten',
  entries: buildKana('katakana', 'dakuten', [
    ['ga', 'ガ', 'ga', 'g', 'گا'],
    ['gi', 'ギ', 'gi', 'g', 'گی'],
    ['gu', 'グ', 'gu', 'g', 'گُو'],
    ['ge', 'ゲ', 'ge', 'g', 'گے'],
    ['go', 'ゴ', 'go', 'g', 'گو'],
    ['za', 'ザ', 'za', 'z', 'زا'],
    ['ji', 'ジ', 'ji', 'z', 'جی'],
    ['zu', 'ズ', 'zu', 'z', 'زُو'],
    ['ze', 'ゼ', 'ze', 'z', 'زے'],
    ['zo', 'ゾ', 'zo', 'z', 'زو'],
    ['da', 'ダ', 'da', 'd', 'دا'],
    ['dji', 'ヂ', 'dji', 'd', 'جی / دَجی'],
    ['dzu', 'ヅ', 'dzu', 'd', 'زُو / دَزُو'],
    ['de', 'デ', 'de', 'd', 'دے'],
    ['do', 'ド', 'do', 'd', 'دو'],
    ['ba', 'バ', 'ba', 'b', 'با'],
    ['bi', 'ビ', 'bi', 'b', 'بی'],
    ['bu', 'ブ', 'bu', 'b', 'بُو'],
    ['be', 'ベ', 'be', 'b', 'بے'],
    ['bo', 'ボ', 'bo', 'b', 'بو'],
    ['pa', 'パ', 'pa', 'p', 'پا'],
    ['pi', 'ピ', 'pi', 'p', 'پی'],
    ['pu', 'プ', 'pu', 'p', 'پُو'],
    ['pe', 'ペ', 'pe', 'p', 'پے'],
    ['po', 'ポ', 'po', 'p', 'پو'],
  ]),
} satisfies KanaDataSet;

export const katakanaDakuten = katakanaDakutenData.entries;
