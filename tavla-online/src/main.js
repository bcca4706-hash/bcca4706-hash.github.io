/**
 * GEÇİCİ DEMO KABUĞU.
 * Bu dosya, çekirdek motorun (src/core) tarayıcıda çalıştığını göstermek için
 * hafif bir DOM arayüzüdür. Bir sonraki aşamada Phaser 3 sahneleriyle
 * (Boot / Menu / Game / UI) değiştirilecektir. Motor API'si aynı kalacak.
 *
 * Mod: Sen (Beyaz) vs Yapay Zeka (Siyah, 'normal').
 */
import { Game } from './core/game.js';
import { playAiTurn } from './ai/ai.js';
import { t } from './i18n/index.js';

const FACES = {1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
const TOP=[12,13,14,15,16,17,18,19,20,21,22,23];
const BOT=[11,10,9,8,7,6,5,4,3,2,1,0];
const HUMAN='w', AI='b', DIFF='normal';

let game, selected=null, rolling=false, animFaces=[1,1], built=false;

function newGame(){
  game=new Game(); game.openingRoll();
  selected=null; rolling=false;
  // insan başlamıyorsa yapay zeka oynasın
  if(game.turn!==HUMAN) setTimeout(aiTurn, 400);
  render();
}

/* --- Yapay zeka turu --- */
function aiTurn(){
  if(game.phase==='ended') return;
  if(game.phase==='roll') game.rollDice();
  if(game.mustPass()){ game.pass(); render(); return afterTurn(); }
  playAiTurn(game, DIFF);
  render();
  afterTurn();
}
function afterTurn(){
  if(game.phase==='ended'){ render(); return; }
  if(game.turn===AI) setTimeout(aiTurn, 550);
}

/* --- Zar --- */
function tapDice(){
  if(rolling || game.turn!==HUMAN || game.phase!=='roll') return;
  rolling=true;
  let t2=0;
  const iv=setInterval(()=>{
    animFaces=[1+Math.floor(Math.random()*6),1+Math.floor(Math.random()*6)];
    renderDice();
    if(++t2>=10){
      clearInterval(iv); rolling=false;
      game.rollDice();
      if(game.mustPass()){
        render(); setTimeout(()=>{ game.pass(); render(); afterTurn(); }, 900);
      } else render();
    }
  },65);
}

/* --- Etkileşim --- */
function tap(kind, idx){
  if(game.turn!==HUMAN || game.phase!=='move' || rolling) return;
  if(selected!==null){
    const from=selected;
    const dest = kind==='off' ? 'off' : (kind==='point'? idx : null);
    const mv = game.legalMovesFrom(from).find(m=>m.to===dest);
    if(mv){ game.playMove(mv); selected=null; render(); return afterTurn(); }
  }
  if(game.state.bar[HUMAN]>0){
    selected = (kind==='bar') ? (selected==='bar'?null:'bar') : null;
    return render();
  }
  if(kind==='point' && game.state.points[idx].p===HUMAN && game.state.points[idx].c>0)
    selected = (selected===idx)?null:idx;
  else selected=null;
  render();
}

/* --- Çizim --- */
function buildBoard(){
  const root=document.getElementById('game-root');
  root.innerHTML=`<div class="topbar"><span id="status"></span><button class="pill" id="new">↻ ${t('common.rematch')}</button></div><div class="board" id="board"></div>`;
  const b=document.getElementById('board');
  const make=(idx,row)=>{
    const col=row===1?TOP.indexOf(idx):BOT.indexOf(idx);
    const gcol=col<6?col+1:col+2;
    const d=document.createElement('div');
    d.className='point '+(row===2?'bottom ':'')+((idx%2===0)?'ta':'tb');
    d.id='pt-'+idx; d.style.gridColumn=gcol; d.style.gridRow=row;
    d.onclick=()=>tap('point',idx); b.appendChild(d);
  };
  TOP.forEach(i=>make(i,1)); BOT.forEach(i=>make(i,2));
  const bar=document.createElement('div'); bar.className='bar'; bar.id='bar';
  bar.onclick=()=>tap('bar'); bar.innerHTML='<div class="bz" id="bar-b"></div><div class="bz bot" id="bar-w"></div>';
  b.appendChild(bar);
  const off=document.createElement('div'); off.className='offcol';
  off.innerHTML='<div class="oz" id="off-b"><span class="cnt" id="cnt-b">0</span></div><div class="oz bot" id="off-w"><span class="cnt" id="cnt-w">0</span></div>';
  b.appendChild(off);
  off.querySelector('#off-b').onclick=()=>tap('off');
  off.querySelector('#off-w').onclick=()=>tap('off');
  const dl=document.createElement('div'); dl.className='diceLayer'; dl.id='diceLayer';
  dl.onclick=tapDice; b.appendChild(dl);
  document.getElementById('new').onclick=newGame;
}
function checkerHTML(color,count){
  const shown=Math.min(count,5); let h='';
  for(let i=0;i<shown;i++){
    const last=i===shown-1 && count>5;
    h+=`<div class="checker ${color}">${last?`<span class="badge">${count}</span>`:''}</div>`;
  }
  return h;
}
function renderDie(n){
  const d=document.createElement('div'); d.className='die'+(rolling?' roll':'');
  const set=FACES[n];
  for(let i=0;i<9;i++){const p=document.createElement('div');p.className='pip'+(set.includes(i)?'':' empty');d.appendChild(p);}
  return d;
}
function renderDice(){
  const L=document.getElementById('diceLayer'); if(!L) return;
  L.innerHTML=''; L.className='diceLayer';
  if(rolling){ animFaces.forEach(f=>L.appendChild(renderDie(f))); L.style.pointerEvents='none'; return; }
  if(game.phase==='roll' && game.turn===HUMAN){
    L.classList.add('prompt'); [1+((Date.now()>>1)%6),1+((Date.now()>>3)%6)].forEach(f=>L.appendChild(renderDie(f)));
    L.style.pointerEvents='auto'; return;
  }
  const rem=game.remainingDice();
  (rem.length?rem:game.dice).forEach(d=>L.appendChild(renderDie(d)));
  L.style.pointerEvents='none';
}
function render(){
  if(!built){ buildBoard(); built=true; }
  const st=game.state;
  for(let i=0;i<24;i++){
    const el=document.getElementById('pt-'+i), pt=st.points[i];
    el.innerHTML=pt.c>0?checkerHTML(pt.p,pt.c):'';
    el.classList.toggle('sel',selected===i);
  }
  document.getElementById('bar-w').innerHTML=checkerHTML('w',st.bar.w);
  document.getElementById('bar-b').innerHTML=checkerHTML('b',st.bar.b);
  document.getElementById('bar').classList.toggle('sel',selected==='bar');
  for(const p of ['w','b']){
    const z=document.getElementById('off-'+p);
    z.querySelectorAll('.ob').forEach(e=>e.remove());
    for(let i=0;i<Math.min(st.off[p],8);i++) z.insertAdjacentHTML('afterbegin',`<div class="ob ${p}"></div>`);
    document.getElementById('cnt-'+p).textContent=st.off[p];
  }
  document.querySelectorAll('.hl').forEach(e=>e.classList.remove('hl'));
  if(selected!==null){
    for(const m of game.legalMovesFrom(selected)){
      if(m.to==='off') document.getElementById('off-'+HUMAN).classList.add('hl');
      else document.getElementById('pt-'+m.to)?.classList.add('hl');
    }
  } else if(game.turn===HUMAN && game.state.bar[HUMAN]>0 && game.phase==='move'){
    document.getElementById('bar').classList.add('hl');
  }
  const s=document.getElementById('status');
  if(game.phase==='ended'){
    const p=game.result.winner==='w'?t('game.white'):t('game.black');
    const typ={single:t('result.single'),gammon:t('result.gammon'),backgammon:t('result.backgammon')}[game.result.type];
    s.innerHTML=`<b>${p}</b> — ${typ} (+${game.result.points})`;
    showWin(p, typ);
  } else {
    const p=game.turn==='w'?t('game.white'):t('game.black');
    s.innerHTML=`${t('game.yourTurn',{player:''})} <b>${p}</b>`;
  }
  renderDice();
}
function showWin(p, typ){
  let w=document.querySelector('.win');
  if(!w){ w=document.createElement('div'); w.className='win'; document.body.appendChild(w); }
  w.innerHTML=`<div>${t('result.win',{player:p})}<br><span style="font-size:18px;opacity:.8">${typ}</span></div><button id="rm">${t('common.rematch')}</button>`;
  w.classList.remove('hidden');
  w.querySelector('#rm').onclick=()=>{ w.classList.add('hidden'); newGame(); };
}

// Service worker (PWA)
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}

newGame();
