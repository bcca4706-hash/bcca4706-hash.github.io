/**
 * Uluslararası tavla kural motoru (production).
 * Framework'ten bağımsız saf JavaScript. Phaser, backend, AI hepsi bunu kullanır.
 *
 * Hamle temsili: { from, to, die, hit }
 *   from: 0..23 | 'bar'
 *   to:   0..23 | 'off'
 *   die:  1..6
 *   hit:  boolean (rakip taşı kırıldı mı)
 */
import { POINTS, WHITE, BLACK, BAR, OFF, HOME, DIR, opponent, RESULT } from './constants.js';
import { cloneState } from './board.js';

/* ------------------------------------------------------------------ */
/* Yardımcı sorgular                                                   */
/* ------------------------------------------------------------------ */

/** Hedef hane bu oyuncu için açık mı? (boş / kendi / rakip tek taş) */
function pointOpen(state, idx, player) {
  const pt = state.points[idx];
  if (pt.p === null || pt.p === player) return true;
  return pt.c === 1; // rakip blot -> kırılır
}

function isBlot(state, idx, opp) {
  const pt = state.points[idx];
  return pt.p === opp && pt.c === 1;
}

/** Oyuncunun bardaki taşı hariç tüm taşları ev tahtasında mı? */
export function canBearOff(state, player) {
  if (state.bar[player] > 0) return false;
  const [lo, hi] = HOME[player];
  for (let i = 0; i < POINTS; i++) {
    const pt = state.points[i];
    if (pt.p === player && pt.c > 0 && (i < lo || i > hi)) return false;
  }
  return true;
}

/** Belirli haneden belirli zarla toplama (bear off) yapılabilir mi? */
function canBearFrom(state, player, from, die) {
  if (!canBearOff(state, player)) return false;
  if (player === WHITE) {
    const need = from + 1;             // idx0 -> 1 pip, idx5 -> 6 pip
    if (die === need) return true;
    if (die > need) {                  // büyük zar: daha uzakta taş kalmamalı
      for (let i = from + 1; i <= 5; i++) {
        if (state.points[i].p === WHITE && state.points[i].c > 0) return false;
      }
      return true;
    }
    return false;                      // küçük zar: bu taş toplanamaz
  } else {
    const need = POINTS - from;        // idx23 -> 1 pip, idx18 -> 6 pip
    if (die === need) return true;
    if (die > need) {
      for (let i = 18; i < from; i++) {
        if (state.points[i].p === BLACK && state.points[i].c > 0) return false;
      }
      return true;
    }
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Tek zarlık hamleler                                                 */
/* ------------------------------------------------------------------ */

/** Verilen tek zar için tüm yasal hamleler. Barda taş varsa yalnızca giriş. */
export function singleMoves(state, player, die) {
  const moves = [];
  const opp = opponent(player);

  // Barda taş varsa önce girmek zorunlu
  if (state.bar[player] > 0) {
    const to = player === WHITE ? POINTS - die : die - 1; // idx
    if (pointOpen(state, to, player)) {
      moves.push({ from: BAR, to, die, hit: isBlot(state, to, opp) });
    }
    return moves;
  }

  const dir = DIR[player];
  for (let i = 0; i < POINTS; i++) {
    const pt = state.points[i];
    if (pt.p !== player || pt.c === 0) continue;
    const to = i + dir * die;
    if (to >= 0 && to <= 23) {
      if (pointOpen(state, to, player)) {
        moves.push({ from: i, to, die, hit: isBlot(state, to, opp) });
      }
    } else {
      // tahta dışı -> toplama adayı
      if (canBearFrom(state, player, i, die)) {
        moves.push({ from: i, to: OFF, die, hit: false });
      }
    }
  }
  return moves;
}

/** Bir hamleyi uygular ve YENİ durum döndürür (state'i değiştirmez). */
export function applyMove(state, player, move) {
  const st = cloneState(state);
  const opp = opponent(player);

  if (move.from === BAR) st.bar[player]--;
  else {
    st.points[move.from].c--;
    if (st.points[move.from].c === 0) st.points[move.from].p = null;
  }

  if (move.to === OFF) {
    st.off[player]++;
  } else {
    const pt = st.points[move.to];
    if (pt.p === opp && pt.c === 1) { // kırma
      pt.c = 0; pt.p = null;
      st.bar[opp]++;
    }
    pt.c++; pt.p = player;
  }
  return st;
}

/* ------------------------------------------------------------------ */
/* Tur dizileri + zorunlu hamle kuralı                                 */
/* ------------------------------------------------------------------ */

/**
 * Bir turda oynanabilecek tüm maksimal hamle dizilerini üretir.
 * Çift zar 4 hamle, tekli zar en fazla 2 hamledir.
 */
function generateSequences(state, player, dice) {
  const results = [];
  const recurse = (st, remaining, path) => {
    let extended = false;
    const tried = new Set();
    for (let i = 0; i < remaining.length; i++) {
      const die = remaining[i];
      if (tried.has(die)) continue; // aynı seviyede aynı zarı bir kez dene
      tried.add(die);
      const moves = singleMoves(st, player, die);
      for (const mv of moves) {
        extended = true;
        const nst = applyMove(st, player, mv);
        const rem = remaining.slice();
        rem.splice(i, 1);
        recurse(nst, rem, path.concat([mv]));
      }
    }
    if (!extended) results.push(path); // daha fazla uzatılamıyor -> maksimal yaprak
  };
  recurse(state, dice.slice(), []);
  return results;
}

/**
 * Zorunlu hamle kuralını uygular:
 *  1) Mümkün olan en çok sayıda zar oynanmalı.
 *  2) Yalnızca tek zar oynanabiliyorsa büyük zar oynanmalı.
 * Geriye yalnızca geçerli (izin verilen) tam diziler döner.
 */
export function legalTurn(state, player, dice) {
  const seqs = generateSequences(state, player, dice);
  let maxLen = 0;
  for (const s of seqs) if (s.length > maxLen) maxLen = s.length;

  let filtered = seqs.filter((s) => s.length === maxLen);

  // Büyük zar kuralı: sadece 1 zar oynanabiliyor ve zarlar farklıysa
  if (maxLen === 1 && dice.length === 2 && dice[0] !== dice[1]) {
    const hi = Math.max(dice[0], dice[1]);
    const usingHi = filtered.filter((s) => s[0].die === hi);
    if (usingHi.length > 0) filtered = usingHi;
  }

  return { maxLen, sequences: filtered };
}

/* ------------------------------------------------------------------ */
/* Kazanma ve puanlama                                                 */
/* ------------------------------------------------------------------ */

export function isGameOver(state) {
  return state.off[WHITE] === 15 || state.off[BLACK] === 15;
}

export function winner(state) {
  if (state.off[WHITE] === 15) return WHITE;
  if (state.off[BLACK] === 15) return BLACK;
  return null;
}

/**
 * Sonuç puanı: single(1) / gammon-Mars(2) / backgammon(3).
 * - Gammon: kaybeden hiç taş toplayamadı.
 * - Backgammon: kaybeden hiç toplayamadı VE kazananın ev tahtasında veya barda taşı var.
 */
export function scoreResult(state, win) {
  const loser = opponent(win);
  if (state.off[loser] > 0) return { type: RESULT.SINGLE, points: 1 };

  const [lo, hi] = HOME[win];
  let inWinnerHome = false;
  for (let i = lo; i <= hi; i++) {
    if (state.points[i].p === loser && state.points[i].c > 0) { inWinnerHome = true; break; }
  }
  if (state.bar[loser] > 0 || inWinnerHome) return { type: RESULT.BACKGAMMON, points: 3 };
  return { type: RESULT.GAMMON, points: 2 };
}

/* ------------------------------------------------------------------ */
/* Küçük yardımcılar (UI/AI paylaşımlı)                                */
/* ------------------------------------------------------------------ */

export function moveKey(mv) {
  return `${mv.from}>${mv.to}#${mv.die}`;
}

export function sameMove(a, b) {
  return a.from === b.from && a.to === b.to && a.die === b.die;
}
