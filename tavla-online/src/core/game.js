/**
 * Oyun durumu makinesi. Tek bir tavla partisini yönetir.
 * UI (Phaser) ve AI bu API üzerinden oynar. Çevrimiçi modda sunucu
 * aynı motoru çalıştırıp istemci hamlelerini doğrular (sunucu-otoriter).
 *
 * Fazlar: 'roll' (zar bekleniyor) -> 'move' (hamle) -> 'ended'
 */
import { WHITE, opponent } from './constants.js';
import { initialState, cloneState, validateCounts } from './board.js';
import {
  legalTurn, applyMove, isGameOver, winner, scoreResult,
  moveKey, sameMove,
} from './rules.js';
import { roll as rollDice, rollOpening } from './dice.js';

export class Game {
  constructor(options = {}) {
    this.state = initialState();
    this.phase = 'opening';          // ilk zar açılış zarı
    this.turn = WHITE;
    this.dice = [];                  // atılan zarlar (çift ise 4 adet)
    this.validSequences = [];        // legalTurn sonucu
    this.movesPlayed = [];           // bu turda oynanan hamleler
    this.turnStartState = null;      // geri al için
    this.history = [];               // {player, dice, moves} tam log (tekrar oynatma)
    this.result = null;              // {winner, type, points}
    this.matchScore = { w: 0, b: 0 };
    this.rng = options.rng || null;  // sunucu enjeksiyonu için opsiyonel
  }

  /* --- Zar --- */

  /** Açılış: ilk oyuncuyu belirler ve o turun zarlarını kurar. */
  openingRoll() {
    if (this.phase !== 'opening') return null;
    const { first, dice } = rollOpening();
    this.turn = first;
    this._beginTurnWithDice(dice);
    return { first, dice };
  }

  /** Normal tur zarı atar. */
  rollDice() {
    if (this.phase !== 'roll') return null;
    const dice = rollDice();
    this._beginTurnWithDice(dice);
    return dice;
  }

  /** Sunucudan gelen sabit zarları kabul eder (çevrimiçi mod). */
  applyServerDice(dice) {
    this.turn = this.turn;
    this._beginTurnWithDice(dice.slice());
    return dice;
  }

  _beginTurnWithDice(dice) {
    this.dice = dice;
    this.turnStartState = cloneState(this.state);
    this.movesPlayed = [];
    const { sequences } = legalTurn(this.state, this.turn, this.dice);
    this.validSequences = sequences;
    this.phase = 'move';
  }

  /* --- Hamle sorguları --- */

  /** Şu an oynanabilecek benzersiz hamleler (zorunlu hamle filtresi uygulanmış). */
  legalMoves() {
    const played = this.movesPlayed;
    const res = [];
    const seen = new Set();
    for (const seq of this.validSequences) {
      if (seq.length <= played.length) continue;
      let ok = true;
      for (let i = 0; i < played.length; i++) {
        if (!sameMove(seq[i], played[i])) { ok = false; break; }
      }
      if (!ok) continue;
      const mv = seq[played.length];
      const k = moveKey(mv);
      if (!seen.has(k)) { seen.add(k); res.push(mv); }
    }
    return res;
  }

  /** Belirli bir kaynaktan yasal hedefler. */
  legalMovesFrom(from) {
    return this.legalMoves().filter((m) => m.from === from);
  }

  /** Bu turda hamle yapılamıyorsa true (pas gerekli). */
  mustPass() {
    return this.phase === 'move' && this.legalMoves().length === 0;
  }

  remainingDice() {
    const used = this.movesPlayed.map((m) => m.die);
    const rem = this.dice.slice();
    for (const d of used) {
      const i = rem.indexOf(d);
      if (i >= 0) rem.splice(i, 1);
    }
    return rem;
  }

  /* --- Hamle uygulama --- */

  /** Bir hamleyi oynar. Yasal değilse false döner. */
  playMove(move) {
    if (this.phase !== 'move') return false;
    const legal = this.legalMoves().find((m) => sameMove(m, move));
    if (!legal) return false;

    this.state = applyMove(this.state, this.turn, legal);
    this.movesPlayed.push(legal);

    if (isGameOver(this.state)) {
      this._endGame();
      return true;
    }
    if (this.legalMoves().length === 0) {
      this._commitTurn();
      this.endTurn();
    }
    return true;
  }

  /** Hamle yoksa turu geç. */
  pass() {
    if (!this.mustPass()) return false;
    this._commitTurn();
    this.endTurn();
    return true;
  }

  /** Bu turdaki son hamleyi geri alır. */
  undo() {
    if (this.phase !== 'move' || this.movesPlayed.length === 0) return false;
    const keep = this.movesPlayed.slice(0, -1);
    this.state = cloneState(this.turnStartState);
    this.movesPlayed = [];
    for (const mv of keep) {
      this.state = applyMove(this.state, this.turn, mv);
      this.movesPlayed.push(mv);
    }
    return true;
  }

  endTurn() {
    if (this.phase === 'ended') return;
    this.turn = opponent(this.turn);
    this.dice = [];
    this.movesPlayed = [];
    this.validSequences = [];
    this.phase = 'roll';
  }

  _commitTurn() {
    this.history.push({
      player: this.turn,
      dice: this.dice.slice(),
      moves: this.movesPlayed.slice(),
    });
  }

  _endGame() {
    this._commitTurn();
    const win = winner(this.state);
    const score = scoreResult(this.state, win);
    this.result = { winner: win, ...score };
    this.matchScore[win] += score.points;
    this.phase = 'ended';
  }

  /* --- Yardımcılar --- */
  isValidState() { return validateCounts(this.state); }

  snapshot() {
    return {
      state: cloneState(this.state),
      phase: this.phase,
      turn: this.turn,
      dice: this.dice.slice(),
      matchScore: { ...this.matchScore },
      result: this.result ? { ...this.result } : null,
    };
  }
}
