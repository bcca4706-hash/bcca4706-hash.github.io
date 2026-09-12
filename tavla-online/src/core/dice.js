/**
 * Zar üretimi. Çevrimiçi modda zar SUNUCUDA atılır (anti-cheat);
 * bu modül offline/AI ve istemci animasyonu içindir.
 */
export function rollDie() {
  return 1 + Math.floor(Math.random() * 6);
}

/** İki zar atar. Çift gelirse dört hamle hakkı. */
export function roll() {
  const a = rollDie();
  const b = rollDie();
  return a === b ? [a, a, a, a] : [a, b];
}

/**
 * Açılış zarı: iki oyuncu birer zar atar, büyük olan başlar.
 * Eşitlikte tekrar atılır. Dönen: { first:'w'|'b', dice:[hi,lo] }
 */
export function rollOpening() {
  let w, b;
  do { w = rollDie(); b = rollDie(); } while (w === b);
  const first = w > b ? 'w' : 'b';
  const dice = [Math.max(w, b), Math.min(w, b)];
  return { first, dice };
}
