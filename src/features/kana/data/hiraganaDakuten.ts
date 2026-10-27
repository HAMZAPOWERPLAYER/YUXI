import { buildKana, type KanaDataSet } from './buildKana';

export const hiraganaDakutenData = {
  needsHumanReview: true,
  script: 'hiragana',
  group: 'dakuten',
  entries: buildKana('hiragana', 'dakuten', [
    ['ga', 'が', 'ga', 'g', 'گا'],
    ['gi', 'ぎ', 'gi', 'g', 'گی'],
    ['gu', 'ぐ', 'gu', 'g', 'گُو'],
    ['ge', 'げ', 'ge', 'g', 'گے'],
    ['go', 'ご', 'go', 'g', 'گو'],
    ['za', 'ざ', 'za', 'z', 'زا'],
    ['ji', 'じ', 'ji', 'z', 'جی'],
    ['zu', 'ず', 'zu', 'z', 'زُو'],
    ['ze', 'ぜ', 'ze', 'z', 'زے'],
    ['zo', 'ぞ', 'zo', 'z', 'زو'],
    ['da', 'だ', 'da', 'd', 'دا'],
    ['dji', 'ぢ', 'dji', 'd', 'جی / دَجی'],
    ['dzu', 'づ', 'dzu', 'd', 'زُو / دَزُو'],
    ['de', 'で', 'de', 'd', 'دے'],
    ['do', 'ど', 'do', 'd', 'دو'],
    ['ba', 'ば', 'ba', 'b', 'با'],
    ['bi', 'び', 'bi', 'b', 'بی'],
    ['bu', 'ぶ', 'bu', 'b', 'بُو'],
    ['be', 'べ', 'be', 'b', 'بے'],
    ['bo', 'ぼ', 'bo', 'b', 'بو'],
    ['pa', 'ぱ', 'pa', 'p', 'پا'],
    ['pi', 'ぴ', 'pi', 'p', 'پی'],
    ['pu', 'ぷ', 'pu', 'p', 'پُو'],
    ['pe', 'ぺ', 'pe', 'p', 'پے'],
    ['po', 'ぽ', 'po', 'p', 'پو'],
  ]),
} satisfies KanaDataSet;

export const hiraganaDakuten = hiraganaDakutenData.entries;
