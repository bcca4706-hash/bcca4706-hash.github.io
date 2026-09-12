import { Game } from '../src/core/game.js';
import { playAiTurn } from '../src/ai/ai.js';
import { legalTurn, scoreResult } from '../src/core/rules.js';
import { initialState, validateCounts, pipCount } from '../src/core/board.js';

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) { pass++; } else { fail++; console.log('  FAIL:', msg); } };

// 1) Başlangıç: her oyuncu 15 taş
{
  const g = new Game();
  ok(validateCounts(g.state), 'başlangıç 15 taş korunuyor');
  ok(pipCount(g.state, 'w') === 167, 'beyaz pip = 167 (standart), got ' + pipCount(g.state,'w'));
  ok(pipCount(g.state, 'b') === 167, 'siyah pip = 167 (standart), got ' + pipCount(g.state,'b'));
}

// 2) 300 rastgele parti sonuna kadar oyna, hiçbirinde taş kaybolmasın / hata olmasın
{
  let games = 0, doubles = 0, bgs = 0, gammons = 0;
  for (let n = 0; n < 300; n++) {
    const g = new Game();
    g.openingRoll();
    let safety = 0;
    while (g.phase !== 'ended' && safety < 2000) {
      safety++;
      if (g.phase === 'roll') { g.rollDice(); continue; }
      if (g.phase === 'move') {
        if (g.mustPass()) { g.pass(); continue; }
        const diff = ['easy','normal','hard'][n % 3];
        playAiTurn(g, diff);
      }
    }
    if (!validateCounts(g.state)) { fail++; console.log('  FAIL: taş sayısı bozuldu oyun', n); }
    if (g.phase !== 'ended') { fail++; console.log('  FAIL: oyun bitmedi oyun', n, 'safety', safety); }
    if (g.result) {
      games++;
      if (g.result.type === 'backgammon') bgs++;
      if (g.result.type === 'gammon') gammons++;
    }
  }
  ok(games === 300, '300 parti tamamlandı, got ' + games);
  console.log(`  bilgi: ${gammons} mars(gammon), ${bgs} backgammon görüldü`);
}

// 3) Zorunlu hamle: sadece tek zar oynanabiliyorsa büyük zar seçilmeli
{
  // Kurgu: beyazın tek taşı idx2'de, [5,2] zarı. 2 ile idx0'a, 5 ile toplama(6>3 gerek).
  // Rakip idx0'ı kapatsın (2+ taş) -> beyaz 2'yi oynayamaz; sadece 5 oynanır.
  const g = new Game();
  g.state = initialState();
  // temiz kurgu
  g.state.points = Array.from({length:24}, () => ({c:0,p:null}));
  g.state.bar = {w:0,b:0}; g.state.off = {w:0,b:0};
  g.state.points[2] = {c:1,p:'w'};             // beyaz taş, ev tahtasında
  // diğer 14 beyaz taşı toplanmış say (bear off testine karışmasın)
  g.state.off.w = 14;
  g.state.points[0] = {c:2,p:'b'};             // idx0 kapalı
  g.state.off.b = 13;
  g.turn = 'w';
  g._beginTurnWithDice([5,2]);
  const lm = g.legalMoves();
  // 2 ile idx0 kapalı; 5 ile toplama (die 5 > need 3, daha uzakta taş yok) -> off
  ok(lm.length >= 1, 'en az bir hamle var');
  ok(lm.every(m => m.die === 5), 'sadece büyük zar (5) oynanabilir; got ' + JSON.stringify(lm.map(m=>m.die)));
  ok(lm.some(m => m.to === 'off'), 'toplama hamlesi mevcut');
}

// 4) Bardan giriş zorunluluğu
{
  const g = new Game();
  g.state.bar.w = 1;
  // beyazın barda taşı varken sadece giriş hamleleri olmalı
  g.turn = 'w';
  g._beginTurnWithDice([6,6]);
  const lm = g.legalMoves();
  ok(lm.every(m => m.from === 'bar'), 'barda taş varken sadece giriş; got ' + JSON.stringify(lm.map(m=>m.from)));
}

// 5) Backgammon puanı: kaybedenin barda taşı varsa 3 puan
{
  const st = initialState();
  st.points = Array.from({length:24}, () => ({c:0,p:null}));
  st.off = {w:15, b:0}; st.bar = {w:0, b:1};   // siyah hiç toplayamamış + barda
  const r = scoreResult(st, 'w');
  ok(r.type === 'backgammon' && r.points === 3, 'backgammon = 3 puan; got ' + JSON.stringify(r));
}

// 6) Gammon (Mars): kaybeden hiç toplayamamış ama barda/ev tahtasında yok
{
  const st = initialState();
  st.points = Array.from({length:24}, () => ({c:0,p:null}));
  st.points[10] = {c:1,p:'b'};                 // siyah orta sahada, kazananın evinde değil
  st.off = {w:15, b:0}; st.bar = {w:0, b:0};
  const r = scoreResult(st, 'w');
  ok(r.type === 'gammon' && r.points === 2, 'gammon/mars = 2 puan; got ' + JSON.stringify(r));
}

console.log(`\nSONUC: ${pass} geçti, ${fail} başarısız`);
process.exit(fail ? 1 : 0);
