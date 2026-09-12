/**
 * Basit i18n katmanı. v1: TR + EN. Yeni diller eklemek için
 * dosyayı import edip LOCALES'e eklemek yeterli.
 */
import tr from './tr.json';
import en from './en.json';

const LOCALES = { tr, en };
let current = 'tr';

export function setLocale(code) {
  if (LOCALES[code]) current = code;
}
export function getLocale() { return current; }
export function availableLocales() { return Object.keys(LOCALES); }

/** t('game.yourTurn', {player:'Beyaz'}) */
export function t(key, params = {}) {
  const dict = LOCALES[current] || LOCALES.tr;
  let str = dict[key] ?? key;
  for (const [k, v] of Object.entries(params)) {
    str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return str;
}
