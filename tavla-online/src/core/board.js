/**
 * Tahta durumu yapısı ve yardımcıları.
 * state = {
 *   points: Array(24) of {c:number, p:'w'|'b'|null},
 *   bar:   {w:number, b:number},
 *   off:   {w:number, b:number},
 * }
 */
import { POINTS, WHITE, BLACK, START_LAYOUT } from './constants.js';

export function emptyPoints() {
  return Array.from({ length: POINTS }, () => ({ c: 0, p: null }));
}

/** Yeni standart başlangıç durumu üretir. */
export function initialState() {
  const points = emptyPoints();
  for (const [idx, count, player] of START_LAYOUT) {
    points[idx] = { c: count, p: player };
  }
  return {
    points,
    bar: { [WHITE]: 0, [BLACK]: 0 },
    off: { [WHITE]: 0, [BLACK]: 0 },
  };
}

/** Derin kopya (performans için sığ-derin karışımı, yeterli). */
export function cloneState(state) {
  return {
    points: state.points.map((pt) => ({ c: pt.c, p: pt.p })),
    bar: { ...state.bar },
    off: { ...state.off },
  };
}

/**
 * Pip sayımı: oyuncunun tüm taşlarının toplamıştıracağı adım sayısı.
 * Düşük pip = kazanmaya yakın. Bardaki taş 25 pip sayılır.
 */
export function pipCount(state, player) {
  let pip = state.bar[player] * 25;
  for (let i = 0; i < POINTS; i++) {
    const pt = state.points[i];
    if (pt.p === player && pt.c > 0) {
      const dist = player === WHITE ? i + 1 : POINTS - i;
      pip += dist * pt.c;
    }
  }
  return pip;
}

/** Oyuncunun tahtadaki toplam taş sayısı (bar dahil, off hariç). */
export function checkersOnBoard(state, player) {
  let n = state.bar[player];
  for (let i = 0; i < POINTS; i++) {
    if (state.points[i].p === player) n += state.points[i].c;
  }
  return n;
}

/** Doğrulama: her oyuncunun tam 15 taşı olmalı (bar + tahta + off). */
export function validateCounts(state) {
  for (const player of [WHITE, BLACK]) {
    const total = checkersOnBoard(state, player) + state.off[player];
    if (total !== 15) return false;
  }
  return true;
}
