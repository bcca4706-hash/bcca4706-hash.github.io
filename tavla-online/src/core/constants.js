/**
 * Oyun sabitleri.
 * Yönelim (mutlak): 24 hane, index 0..23.
 *  - BEYAZ (w): index'i azalan yönde ilerler (24 -> 1). Ev tahtası: idx 0..5 (haneler 1-6).
 *    Bardan giriş: idx 24-zar (18..23). Toplama: idx 0'ın altına.
 *  - SİYAH (b): index'i artan yönde ilerler (1 -> 24). Ev tahtası: idx 18..23 (haneler 19-24).
 *    Bardan giriş: idx zar-1 (0..5). Toplama: idx 23'ün üstüne.
 */
export const POINTS = 24;
export const CHECKERS_PER_PLAYER = 15;

export const WHITE = 'w';
export const BLACK = 'b';
export const PLAYERS = [WHITE, BLACK];

export const BAR = 'bar';
export const OFF = 'off';

// Ev tahtası index aralıkları [lo, hi]
export const HOME = {
  [WHITE]: [0, 5],
  [BLACK]: [18, 23],
};

// İlerleme yönü
export const DIR = {
  [WHITE]: -1,
  [BLACK]: +1,
};

export const opponent = (p) => (p === WHITE ? BLACK : WHITE);

/**
 * Standart uluslararası başlangıç dizilişi.
 * [index, adet, oyuncu]
 */
export const START_LAYOUT = [
  [23, 2, WHITE], [12, 5, WHITE], [7, 3, WHITE], [5, 5, WHITE],
  [0, 2, BLACK],  [11, 5, BLACK], [16, 3, BLACK], [18, 5, BLACK],
];

// Sonuç türleri (Türk tavlasında Mars = Gammon, çift puan)
export const RESULT = {
  SINGLE: 'single',       // 1x
  GAMMON: 'gammon',       // 2x  (Mars)
  BACKGAMMON: 'backgammon' // 3x
};
