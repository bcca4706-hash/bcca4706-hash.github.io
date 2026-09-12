/**
 * Yapay zeka. Kural motorunu kullanarak tur dizisi seçer.
 * Zorluklar: easy | normal | hard | expert(ileride).
 *
 * Kullanım:
 *   const seq = chooseSequence(game, 'hard');  // hamle dizisi
 *   for (const mv of seq) game.playMove(mv);
 */
import { WHITE, opponent, HOME, POINTS } from '../core/constants.js';
import { pipCount } from '../core/board.js';
import { legalTurn, applyMove } from '../core/rules.js';

/** Bir durumu, verilen oyuncunun bakış açısıyla puanlar (yüksek = iyi). */
function evaluate(state, me) {
  const opp = opponent(me);
  let score = 0;

  // 1) Pip farkı (rakip pip - benim pip): önde olmak iyi
  score += (pipCount(state, opp) - pipCount(state, me)) * 1.0;

  // 2) Ev tahtasında yapılan haneler (2+ taş) -> güçlü blokaj
  const [lo, hi] = HOME[me];
  for (let i = lo; i <= hi; i++) {
    const pt = state.points[i];
    if (pt.p === me && pt.c >= 2) score += 6;
  }

  // 3) Rakibi bara göndermek çok değerli
  score += state.bar[opp] * 22;
  // Kendi taşımız barda ise kötü
  score -= state.bar[me] * 25;

  // 4) Açık taş (blot) cezası — rakip menzilindeyse daha ağır
  for (let i = 0; i < POINTS; i++) {
    const pt = state.points[i];
    if (pt.p === me && pt.c === 1) {
      // rakip bu taşı kaç adım uzaktan vurabilir? kabaca yakınlık cezası
      score -= 4;
    }
  }

  // 5) Toplanan taş bonusu
  score += state.off[me] * 12;

  // 6) Geride kalmış taşları (rakip evinde) kurtarma teşviki
  const [olo, ohi] = HOME[opp];
  for (let i = olo; i <= ohi; i++) {
    const pt = state.points[i];
    if (pt.p === me) score -= pt.c * 3;
  }

  return score;
}

/** Bir dizinin sonuç durumunu hesaplar. */
function applySequence(state, player, seq) {
  let st = state;
  for (const mv of seq) st = applyMove(st, player, mv);
  return st;
}

/**
 * Zorluk seviyesine göre tur dizisi seçer.
 * game: aktif Game örneği (zar atılmış, phase='move').
 */
export function chooseSequence(game, difficulty = 'normal') {
  const player = game.turn;
  const { sequences } = legalTurn(game.turnStartState, player, game.dice);
  if (sequences.length === 0) return [];

  if (difficulty === 'easy') {
    // Rastgele — bazen kötü oynar
    return sequences[Math.floor(Math.random() * sequences.length)];
  }

  // normal / hard / expert: değerlendirme ile en iyiyi seç
  let best = sequences[0];
  let bestScore = -Infinity;
  const noise = difficulty === 'normal' ? 8 : difficulty === 'hard' ? 2 : 0;

  for (const seq of sequences) {
    const end = applySequence(game.turnStartState, player, seq);
    let s = evaluate(end, player);
    if (noise) s += (Math.random() - 0.5) * noise; // insansı hata payı
    if (s > bestScore) { bestScore = s; best = seq; }
  }
  return best;
}

/** Kolaylık: diziyi doğrudan oyuna uygular. */
export function playAiTurn(game, difficulty = 'normal') {
  const seq = chooseSequence(game, difficulty);
  if (seq.length === 0) { game.pass(); return []; }
  for (const mv of seq) game.playMove(mv);
  return seq;
}
