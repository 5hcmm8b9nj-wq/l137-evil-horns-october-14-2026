(function(){
'use strict';
const D = window.L137;
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- storage with in-memory fallback ---------- */
const mem = {};
let LS = null;
try { const k='__t'; window.localStorage.setItem(k,'1'); window.localStorage.removeItem(k); LS = window.localStorage; } catch(e) { LS = null; }
const store = {
  get(k, d){ try { const v = LS ? LS.getItem('l137eh_'+k) : mem[k]; return v==null ? d : JSON.parse(v); } catch(e){ return d; } },
  set(k, v){ const s = JSON.stringify(v); try { if (LS) LS.setItem('l137eh_'+k, s); else mem[k] = s; } catch(e){ mem[k] = s; } }
};

/* ---------- constants ---------- */
const SW = ['#221E1A','#9B1B1B','#C24A16','#8A5E00','#4F7A2E','#1E40AF','#1F4E8C','#6E2F5A','#4A1F70','#7A3B12'];
const PALETTES = [
  {id:'blood', name:'Blood of the Lamb', bg:['#5E0F12','#2A0608'], fg:'#FFF4E0', acc:'#E7C965', studio:['#9B1B1B','#8A5E00','#221E1A'], set:['all','fire']},
  {id:'fire', name:'Holy Ghost Fire', bg:['#C24A16','#6E1F05'], fg:'#FFF8EC', acc:'#FFD36B', studio:['#C24A16','#9B1B1B','#8A5E00'], set:['all','fire']},
  {id:'royal', name:'Royal Priesthood', bg:['#6E2F5A','#2E1027'], fg:'#FFF5FB', acc:'#E7C965', studio:['#6E2F5A','#4A1F70','#8A5E00'], set:['all','gentle']},
  {id:'water', name:'Living Waters', bg:['#1E40AF','#062C2F'], fg:'#F1FBFA', acc:'#E7C965', studio:['#1E40AF','#1F4E8C','#0B1F4D'], set:['all','gentle']},
  {id:'harvest', name:'Harvest Blessing', bg:['#4F7A2E','#1F3310'], fg:'#FBFFF4', acc:'#F2D46B', studio:['#4F7A2E','#7A5A12','#2F4A1B'], set:['all','gentle']},
  {id:'glory', name:'Glory Light', bg:['#FFF6DA','#EBD79C'], fg:'#221E1A', acc:'#8A3B00', studio:['#8A5E00','#221E1A','#C24A16'], set:['all','gentle']}
];
const THEMES = [
  {id:'parchment', name:'Parchment'},
  {id:'scroll', name:'Scroll'},
  {id:'poster', name:'Poster'},
  {id:'cards', name:'Cards'},
  {id:'night', name:'Night Watch'}
];
const KIND = {instruction:'Prophetic instruction', scripture:'Scripture', declaration:'Declaration', thanks:'Thanksgiving', blessing:'Scripture over names'};
const ROM1017 = {ref:'Romans 10:17 KJV', text:'So then faith cometh by hearing, and hearing by the word of God.'};
const DP_CARDS = {q:'There are countless situations that need to have the power of God released into them, and there is no more effective way to release the power of God than by proclamation.', by:'Derek Prince', src:'Proclamation Cards', url:'https://www.derekprince.com/cards'};

const phrases = D.phrases;
const decls = phrases.filter(p => p.type==='declaration');

/* ---------- state ---------- */
const S = {
  colors: store.get('colors', {}),
  include: store.get('include', null),
  theme: store.get('theme', 'parchment'),
  title: store.get('title', 'Dealing with the Evil Horns'),
  done: store.get('done', {}),
  names: store.get('names', []),
  saved: store.get('saved', []),
  set: Object.assign({mode:'repeat', turn:'auto', rate:1, voice:''}, store.get('settings', {})),
  deutMode: store.get('deutMode', 'orig'),
  groups: store.get('groups', {}),
  resume: store.get('resume', null),
  mode: store.get('mode', null),
  size: store.get('size', 0),
  filter: 'all'
};
if (!S.include) { S.include = {}; phrases.forEach(p => S.include[p.id] = p.type==='declaration'); }
S.colors = {}; phrases.forEach(p => { S.colors[p.id] = defaultColor(p); });
function defaultColor(p){ return p.type==='scripture' ? '#1E40AF' : p.type==='instruction' ? '#6E2F5A' : p.action ? '#C24A16' : '#221E1A'; }
function colorClass(p){ return p.type==='scripture' ? 'c-scr' : p.type==='instruction' ? 'c-ins' : p.action ? 'c-pour' : 'c-dec'; }

// names from link: #names=Hannah,Tyler
(function(){
  const m = location.hash.match(/names=([^&]+)/);
  if (m) { try { const list = decodeURIComponent(m[1]).split(',').map(s=>s.trim()).filter(Boolean).slice(0,20); if (list.length) { S.names = list; store.set('names', list); } } catch(e){} }
})();

function save(){ store.set('deutMode',S.deutMode); store.set('groups',S.groups); store.set('resume',S.resume); store.set('colors',S.colors); store.set('include',S.include); store.set('theme',S.theme); store.set('title',S.title); store.set('done',S.done); store.set('names',S.names); store.set('saved',S.saved); store.set('settings',S.set); store.set('mode',S.mode); store.set('size',S.size); }

/* ---------- prayer mode ---------- */
if (!['listen','repeat','study'].includes(S.set.mode)) S.set.mode = (S.set.repeat === false) ? 'listen' : 'repeat';
const repeatOn = () => S.set.mode !== 'listen';
const handsOn = () => S.set.mode !== 'study';
const MODE_NAME = {listen:'Listen only', repeat:'Repeat after me', study:'Study mode'};
function setMode(m){ S.set.mode = m; save(); $$('[data-pmode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.pmode===m)); $$('#modeSeg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.m===m)); }

/* ---------- utilities ---------- */
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('show'),2400); }
function hexRgb(h){ h=h.replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join(''); const n=parseInt(h,16); return [(n>>16)&255,(n>>8)&255,n&255]; }
function lum(h){ return hexRgb(h).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0); }
function contrast(a,b){ const x=lum(a), y=lum(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); }
function lighten(h,amt){ const [r,g,b]=hexRgb(h); const f=v=>Math.round(v+(255-v)*amt); return '#'+[f(r),f(g),f(b)].map(v=>v.toString(16).padStart(2,'0')).join(''); }
function joinNames(a){ if(!a.length) return ''; if(a.length===1) return a[0]; return a.slice(0,-1).join(', ')+' and '+a[a.length-1]; }
function phraseLabel(p){ if (p.label) return p.label; return p.type==='scripture' ? p.ref : p.type==='thanks' ? 'Thanksgiving' : KIND[p.type]+' '+p.n+' of '+p.of; }
function markDone(key){ if(!key || S.done[key]) return; S.done[key]=true; save(); refreshDone(key); updateProgress(); if (typeof dprog==='function') dprog(); }

/* ---------- mode / size ---------- */
function applyMode(){ const m = S.mode || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day'); document.documentElement.dataset.mode = m; }
applyMode();
document.documentElement.dataset.size = S.size;
$('#modeBtn').onclick = () => { S.mode = document.documentElement.dataset.mode==='night' ? 'day' : 'night'; applyMode(); save(); toast(S.mode==='night'?'Night mode':'Day mode'); };
$('#sizeBtn').onclick = () => { S.size = (S.size+1)%3; document.documentElement.dataset.size = S.size; save(); toast(['Normal text','Large text','Extra large text'][S.size]); };

/* ---------- router ---------- */
let current = 'home';
function go(v, fromVoice){
  if (!fromVoice) V.follow = false;
  current = v;
  $$('.view').forEach(s => s.hidden = s.dataset.view !== v);
  $$('.tab').forEach(t => { if (t.dataset.go===v) t.setAttribute('aria-current','page'); else t.removeAttribute('aria-current'); });
  if (v==='progress') renderProgress();
  if (!fromVoice) window.scrollTo({top:0});
}
document.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) { e.preventDefault(); go(b.dataset.go); } });

/* =========================================================
   UNDERSTAND PANEL (Beginner / Intermediate / Advanced)
   ========================================================= */
function scripHTML(v){ return v ? `<div class="scrip"><b>${esc(v.ref)}</b><p>${esc(v.text)}</p></div>` : ''; }
function teachHTML(t){ return `<blockquote class="teach">"${esc(t.q)}"<cite><a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.by)}, ${esc(t.src)}</a></cite></blockquote>`; }
function understandHTML(h, level, original, fb){
  const VV = (h && h.verse) || fb || ROM1017;
  if (!h) return '<p class="muted">No explanation for this line.</p>';
  if (level==='b') return `<p><b>🌱 What it means</b></p><p>${esc(h.simple)}</p>${h.key?`<p class="small muted">🔑 Key words: <b>${esc(h.key)}</b></p>`:''}`;
  if (level==='i') return `<p><b>🌿 In real life</b></p><p>${esc(h.example)}</p><p><b>📖 The Bible says</b></p>${scripHTML(VV)}`;
  const t = (h.teach && h.teach.length) ? h.teach : [DP_CARDS];
  return `<p><b>🌳 Deeper study</b></p>${original?`<p class="orig-lbl">Pastor Kiki's original words (unchanged)</p><p class="small"><b>${esc(original)}</b></p>`:''}<p class="small muted">Scripture behind it: ${esc(VV.ref)}</p><p><b>Bible teacher</b></p>${t.map(teachHTML).join('')}`;
}
function attachUnderstand(btn, box, h, original, key, fb){
  btn.onclick = () => {
    if (!box.hidden) { box.hidden = true; btn.setAttribute('aria-expanded','false'); return; }
    box.hidden = false; btn.setAttribute('aria-expanded','true'); box.classList.add('supp');
    box.innerHTML = `<p class="supp-lbl">Supplementary Biblical Study — Not Part of Pastor Kiki's Original Direction</p><div class="lvl-tabs" role="tablist"><button data-l="b" aria-selected="true">🌱 Beginner</button><button data-l="i">🌿 Intermediate</button><button data-l="a">🌳 Advanced</button></div><div class="lvl-body"></div>`;
    const body = $('.lvl-body', box);
    const show = l => { $$('.lvl-tabs button', box).forEach(b => b.setAttribute('aria-selected', b.dataset.l===l)); body.innerHTML = understandHTML(h, l, original, fb); };
    $$('.lvl-tabs button', box).forEach(b => b.onclick = () => show(b.dataset.l));
    show('b');
  };
}

/* =========================================================
   COLOR STUDIO
   ========================================================= */
function visible(p){ const f=S.filter; return f==='all' || (f==='action' ? p.action : p.type===f); }
function renderPhrases(){
  const list = $('#phraseList'); list.innerHTML = '';
  phrases.forEach(p => {
    if (!visible(p)) return;
    const c = S.colors[p.id];
    const card = document.createElement('article');
    card.className = 'pcard ' + colorClass(p); card.dataset.vid = p.id; card.style.setProperty('--pc', c);
    card.innerHTML = `
      <div class="meta"><span>${esc(phraseLabel(p))}</span>${p.action?'<span class="tag-act">🩸 As you pour</span>':''}<span class="tag-done" ${S.done[p.id]?'':'hidden'}>✔ Declared</span></div>
      ${p.ref && p.type==='scripture' ? '' : ''}
      <p class="pword">${esc(p.text)}</p>
      <div class="pactions">
        <button class="btn btn-sm b-play">▶ Listen from here</button>
        <button class="btn btn-sm b-one">🔊 This line only</button>
        <button class="btn btn-sm b-und" aria-expanded="false">💡 Understand</button>
        <button class="btn btn-sm b-done">✔ I declared it</button>
      </div>
      <div class="und" hidden></div>`;
    $('.b-play', card).onclick = () => { const q = studioQueue(); const i = q.findIndex(x => x.key===p.id); V.start(q, Math.max(0,i), true, 'studio'); };
    $('.b-one', card).onclick = () => V.start([phraseItem(p)], 0, true, 'studio');
    $('.b-done', card).onclick = () => { markDone(p.id); toast('Marked as declared'); };
    attachUnderstand($('.b-und', card), $('.und', card), p.help, p.text, p.id);
    if (p.id==='declaration-1' && S.filter==='all') { const sh = document.createElement('p'); sh.className = 'say-hd'; sh.textContent = D.say; list.appendChild(sh); }
    list.appendChild(card);
  });
}
function refreshDone(key){ $$(`[data-vid="${key}"] .tag-done`).forEach(t => t.hidden = false); }
function renderStartFrom(){ const sel = $('#startFrom'); sel.innerHTML = '<option value="">Choose a line…</option>' + phrases.map(p => `<option value="${p.id}">${esc(phraseLabel(p))}: ${esc(p.text.slice(0,48))}${p.text.length>48?'…':''}</option>`).join(''); }
$('#startFrom').onchange = e => { const id = e.target.value; if (!id) return; S.filter = 'all'; $$('#filterSeg button').forEach(x => x.setAttribute('aria-pressed', x.dataset.f==='all')); renderPhrases(); const q = studioQueue(); V.start(q, Math.max(0, q.findIndex(x => x.key===id)), true, 'studio'); e.target.value = ''; };
$$('#filterSeg button').forEach(b => b.onclick = () => { S.filter = b.dataset.f; $$('#filterSeg button').forEach(x => x.setAttribute('aria-pressed', x===b)); renderPhrases(); });
$('#playStudio').onclick = () => V.start(studioQueue(), 0, true);

/* =========================================================
   VOICE ENGINE
   ========================================================= */
const synth = window.speechSynthesis || null;
const V = { q:[], i:0, last:0, playing:false, token:0, timers:[], follow:false, wasPlaying:false, ctx:'full', session:new Set() };
let voices = [];
function loadVoices(){
  if (!synth) return; voices = synth.getVoices().filter(v => /^en/i.test(v.lang));
  const sel = $('#voiceSel'); sel.innerHTML = '<option value="">Phone default voice</option>' + voices.map(v => `<option value="${esc(v.name)}" ${v.name===S.set.voice?'selected':''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('');
}
if (synth) { loadVoices(); synth.onvoiceschanged = loadVoices; }
$('#voiceSel').onchange = e => { S.set.voice = e.target.value; save(); };
function chunks(t){ const parts = String(t).match(/[^.!?;:]+[.!?;:]*\s*/g) || [t]; const out = []; let cur = ''; parts.forEach(p => { if ((cur+p).length > 180 && cur) { out.push(cur); cur = p; } else cur += p; }); if (cur.trim()) out.push(cur); return out.map(s=>s.trim()).filter(Boolean); }
function later(fn, ms){ const t = setTimeout(fn, ms); V.timers.push(t); return t; }
function clearTimers(){ V.timers.forEach(clearTimeout); V.timers = []; clearInterval(V.cd); $('#pTurn').hidden = true; }
function speakSeq(texts, tok, done){
  const list = texts.flatMap(chunks); let k = 0;
  const next = () => {
    if (tok !== V.token) return;
    if (k >= list.length) { done(); return; }
    const t = list[k++];
    if (!synth) { later(next, Math.max(1200, t.split(/\s+/).length * 380 / S.set.rate)); return; }
    const u = new SpeechSynthesisUtterance(t);
    u.rate = S.set.rate; u.lang = 'en-US';
    const v = voices.find(x => x.name === S.set.voice); if (v) u.voice = v;
    let fired = false;
    const fin = () => { if (fired) return; fired = true; if (tok === V.token) next(); };
    u.onend = fin; u.onerror = fin;
    later(fin, t.length * 110 / S.set.rate + 6000); // watchdog in case onend never fires
    synth.speak(u);
  };
  next();
}
function turnSecs(it){ if (S.set.turn !== 'auto') return +S.set.turn; const w = it.speak.split(/\s+/).length; return Math.min(20, Math.max(5, Math.round(w*0.45 + 3))); }
function openStudy(it){ const card = $(`.view:not([hidden]) [data-vid="${it.key}"]`); if (!card) return; const box = $('.und', card), btn = $('.b-und', card); if (box && btn && box.hidden) btn.click(); }
function runItem(){
  const tok = ++V.token; clearTimers(); if (synth) synth.cancel();
  const it = V.q[V.i]; if (!it) { finish(); return; }
  if (V.follow && it.view && current !== it.view) go(it.view, true);
  if (it.onStart) it.onStart(V.i);
  V.last = V.i; saveResume();
  highlight(it); ui();
  if (S.set.mode === 'study') openStudy(it);
  const parts = [];
  if (it.pre) parts.push(it.pre);
  if (repeatOn() && it.turn) parts.push('Repeat after me.');
  parts.push(it.speak);
  later(() => speakSeq(parts, tok, () => {
    if (repeatOn() && it.turn) speakSeq(['Your turn.'], tok, () => waitTurn(it, tok));
    else after(it, tok);
  }), synth ? 120 : 0);
}
function waitTurn(it, tok){
  let s = turnSecs(it); const el = $('#pTurn'); el.hidden = false; el.textContent = 'Your turn · ' + s;
  V.cd = setInterval(() => { if (tok !== V.token) { clearInterval(V.cd); return; } s--; el.textContent = 'Your turn · ' + Math.max(0,s); if (s <= 0) { clearInterval(V.cd); el.hidden = true; after(it, tok); } }, 1000);
}
function after(it, tok){
  if (tok !== V.token) return;
  if (it.key) { markDone(it.key); V.session.add(it.key); }
  if (it.onDone) it.onDone();
  V.i++;
  if (V.i >= V.q.length) { finish(); return; }
  if (handsOn()) runItem(); else { V.playing = false; V.token++; wakeOff(); ui(); $('#pLabel').textContent = 'Tap ⏭ Forward or ▶ Play for the next line'; }
}
function finish(){ wakeOff(); V.playing = false; V.token++; clearTimers(); V.i = Math.max(0, V.q.length-1); S.resume = null; save(); updateResumeUI(); ui(); $('#pLabel').textContent = 'Finished · God bless you as you pray in faith'; if (V.onFinish) { const f = V.onFinish; V.onFinish = null; f(); } }
function highlight(it){ $$('.speaking').forEach(e => e.classList.remove('speaking')); if (!it || !it.key) return; const el = $(`.view:not([hidden]) [data-vid="${it.key}"]`); if (el) { el.classList.add('speaking'); if (V.follow || V.playing) el.scrollIntoView({behavior:'smooth', block:'center'}); } }
function ui(){
  const it = V.q[V.i];
  $('#player').classList.toggle('on', V.playing);
  $('#pPlay').innerHTML = V.playing ? '⏸<small>Pause</small>' : '▶<small>Play</small>';
  $('#pPlay').setAttribute('aria-label', V.playing ? 'Pause' : 'Play');
  $('#pLabel').textContent = it ? `${V.i+1} of ${V.q.length} · ${it.label}` : 'Tap ▶ to listen';
  dprog();
}
function dprog(){ const it = V.q[V.i]; const done = decls.filter(d => S.done[d.id]).length; const pc = Math.round(done/21*100); const cur = it && /^declaration-\d+$/.test(it.key||'') ? 'Declaration ' + it.key.split('-')[1] + ' of 21 · ' : ''; const el = $('#pDLab'); if (!el) return; el.textContent = done === 21 ? '✅ All 21 declarations completed (100%)' : cur + done + ' of 21 completed (' + pc + '%)'; $('#pDBar').style.width = pc + '%'; $('#pDBarW').setAttribute('aria-valuenow', done); $('#pDBarW').setAttribute('aria-valuetext', done + ' of 21 completed'); }
V.start = (q, idx, follow, ctx, keepSession) => { wakeOn(); V.q = q; V.i = idx || 0; V.playing = true; V.follow = !!follow; V.ctx = ctx || 'full'; V.onFinish = null; if (!keepSession) V.session = new Set(); runItem(); };
V.pause = () => { wakeOff(); V.playing = false; V.token++; clearTimers(); if (synth) synth.cancel(); ui(); };
V.play = () => { wakeOn(); if (!V.q.length) { if (S.resume) { resumeLast(); return; } V.start(fullQueue(), 0, true, 'full'); return; } if (V.i >= V.q.length) V.i = 0; V.playing = true; V.follow = true; runItem(); };
V.stop = () => { V.pause(); V.i = 0; $$('.speaking').forEach(e => e.classList.remove('speaking')); $('#pLabel').textContent = 'Stopped'; };
V.step = d => { if (!V.q.length) return; V.i = Math.min(V.q.length-1, Math.max(0, V.i + d)); if (V.playing) runItem(); else { const it = V.q[V.i]; if (it && it.onStart) it.onStart(V.i); highlight(it); ui(); } };
$('#pPlay').onclick = () => V.playing ? V.pause() : V.play();
$('#pStop').onclick = V.stop;
V.replay = () => { if (!V.q.length) return; V.i = Math.min(V.last, V.q.length-1); V.playing = true; V.follow = true; wakeOn(); runItem(); };
$('#pReplay').onclick = V.replay;
$('#pPrev').onclick = () => V.step(-1);
$('#pNext').onclick = () => V.step(1);
$('#pSet').onclick = () => { const s = $('#pSettings'); s.hidden = !s.hidden; $('#pSet').setAttribute('aria-expanded', !s.hidden); };
$$('#modeSeg button').forEach(b => b.onclick = () => { setMode(b.dataset.m); toast(MODE_NAME[b.dataset.m]); });
$$('[data-pmode]').forEach(b => b.onclick = () => { setMode(b.dataset.pmode); toast(MODE_NAME[b.dataset.pmode]); });
setMode(S.set.mode);
function segBind(id, attr, key, conv){ $$('#'+id+' button').forEach(b => { b.setAttribute('aria-pressed', String(b.dataset[attr]) === String(S.set[key])); b.onclick = () => { S.set[key] = conv(b.dataset[attr]); save(); $$('#'+id+' button').forEach(x => x.setAttribute('aria-pressed', x===b)); }; }); }
segBind('turnSeg','t','turn', v => v); segBind('rateSeg','r','rate', v => +v);
$('#testVoice').onclick = () => { if (!synth) { toast('This browser has no voice'); return; } synth.cancel(); const u = new SpeechSynthesisUtterance('For with God nothing shall be impossible.'); u.rate = S.set.rate; const v = voices.find(x => x.name===S.set.voice); if (v) u.voice = v; synth.speak(u); };
document.addEventListener('visibilitychange', () => {
  if (document.hidden && V.playing) { V.wasPlaying = true; V.pause(); }
  else if (!document.hidden && V.wasPlaying) { $('#resumeBar').hidden = false; }
});
$('#resumeBtn').onclick = () => { $('#resumeBar').hidden = true; V.wasPlaying = false; V.play(); };


/* ---------- keep screen awake while playing ---------- */
let wakeLock = null;
async function wakeOn(){ try { if ('wakeLock' in navigator && !wakeLock && document.visibilityState==='visible') { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } } catch(e){ wakeLock = null; } }
function wakeOff(){ try { if (wakeLock) wakeLock.release(); } catch(e){} wakeLock = null; }

/* ---------- queues ---------- */
function phraseItem(p){
  const it = {key:p.id, label:phraseLabel(p), speak:p.speak, view:'studio', turn:p.type!=='instruction' && p.type!=='thanks'};
  if (p.type==='scripture') it.pre = p.speakRef;
  if (p.type==='declaration') it.pre = (p.n===1 ? 'Say. ' : '') + 'Declaration ' + p.n + '.';
  if (p.type==='instruction') it.pre = 'Instruction ' + p.n + '.';
  return it;
}
const bSpeakRef = b => (phrases.find(p => p.type==='scripture' && p.n===b.v) || {}).speakRef || b.ref;
const persOn = () => S.deutMode === 'pers' && S.names.length > 0;
function blessDecl(b){ return S.names.length ? joinNames(S.names) + ': ' + b.text : b.text; }
function blessItem(b, forcePers){ const pers = forcePers === undefined ? persOn() : (forcePers && S.names.length > 0); return pers ? {key:'b'+b.v, label:'Personalized prayer · '+b.ref, pre:'A prayer based on '+bSpeakRef(b), speak: joinNames(S.names)+'. '+b.text, view:'blessings', turn:true, pers:true} : {key:'b'+b.v, label:b.ref, pre:bSpeakRef(b), speak: b.text, view:'blessings', turn:true}; }
function studioQueue(){ return phrases.filter(visible).map(phraseItem); }
function fullQueue(){
  return phrases.map(phraseItem);
}
$('#startAll').onclick = () => { S.filter = 'all'; $$('#filterSeg button').forEach(x => x.setAttribute('aria-pressed', x.dataset.f==='all')); renderPhrases(); go('studio', true); V.start(fullQueue(), 0, true, 'full'); };

/* ---------- resume where I left off ---------- */
function saveResume(){ const it = V.q[V.i]; if (!it) return; S.resume = {ctx:V.ctx, keys:V.q.map(x => x.key), i:V.i, label:it.label, focus:G.focus, at:Date.now()}; save(); updateResumeUI(); }
function itemFor(key, ctx){
  if (/^b\d+$/.test(key)) { const b = D.blessings[+key.slice(1)-1]; return ctx==='gen' ? genBlessItem(b) : blessItem(b); }
  const p = phrases.find(x => x.id===key); if (!p) return null;
  const it = phraseItem(p);
  if (ctx==='gen') Object.assign(it, {view:'generator', text:p.text, kind:phraseLabel(p), ref:p.type==='scripture'?p.ref:'', cls:colorClass(p)});
  return it;
}
function resumeLast(){
  const r = S.resume; if (!r) return;
  const q = r.keys.map(k => itemFor(k, r.ctx)).filter(Boolean); if (!q.length) return;
  if (r.ctx==='studio') { S.filter = 'all'; $$('#filterSeg button').forEach(x => x.setAttribute('aria-pressed', x.dataset.f==='all')); renderPhrases(); }
  if (r.ctx==='gen') { G.items = q; G.items.forEach(it => { it.onStart = i => paintSlide(i); }); $('#genSetup').hidden = true; $('#genStage').hidden = false; G.focus = r.focus || G.focus; V.start(q, Math.min(r.i, q.length-1), true, 'gen'); V.onFinish = genFinished; return; }
  V.start(q, Math.min(r.i, q.length-1), true, r.ctx);
}
function updateResumeUI(){ const r = S.resume; const b = $('#resumeHome'); if (!b) return; b.hidden = !r; if (r) $('#resumeHomeLbl').textContent = r.label; }
$('#resumeHome').onclick = resumeLast;

/* =========================================================
   PRAYER GENERATOR
   ========================================================= */
const byN = ns => ns.map(n => decls[n-1]);
const FOCUS = [
  {id:'full', ico:'🔥', name:'The whole direction', desc:'4 instructions, 3 Scriptures and all 21 declarations', get:() => phrases.filter(p => p.type!=='thanks')},
  {id:'all', ico:'🗣️', name:'All 21 declarations', desc:'Every declaration in Pastor Kiki\'s order', get:() => decls},
  {id:'pour', ico:'🩸', name:'“As I pour” declarations', desc:'Declarations 1, 3, 5, 8, 11, 14, 17 and 20', get:() => decls.filter(d => d.action)},
  {id:'scrip', ico:'📖', name:'Scriptures only', desc:'Psalm 75:10, Psalm 3:3 and Revelation 12:11', get:() => phrases.filter(p => p.type==='scripture')}
]
const G = {focus:'all', order:'orig', items:[]};
function genFinished(){ markDone('gen'); S.groups[G.focus] = true; save(); toast('Group prayed. Thank the Lord'); if (current==='progress') renderProgress(); }
function renderFocus(){
  const box = $('#focusList'); box.innerHTML = '';
  FOCUS.forEach(f => { const b = document.createElement('button'); b.className = 'focus'; b.setAttribute('aria-pressed', G.focus===f.id); b.innerHTML = `<span class="fc">${f.ico}</span><span><b>${esc(f.name)}</b><small>${esc(f.desc)}</small></span>`; b.onclick = () => { G.focus = f.id; renderFocus(); genCount(); }; box.appendChild(b); });
}
function genBlessItem(b){ const pers = S.names.length > 0; return Object.assign(blessItem(b, pers), {view:'generator', text: pers ? blessDecl(b) : b.text, kind: pers ? 'Personalized prayer · based on '+b.ref : b.ref, ref: pers ? 'Not a direct Bible quotation' : '', cls: pers ? 'c-dec' : 'c-scr'}); }
function genBuild(){
  let list = FOCUS.find(f => f.id===G.focus).get().slice();
  if (G.order==='shuffle') for (let i = list.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [list[i], list[j]] = [list[j], list[i]]; }
  const items = list.map(p => Object.assign(phraseItem(p), {view:'generator', text:p.text, kind:phraseLabel(p), ref:p.type==='scripture'?p.ref:'', cls:colorClass(p)}));
  if ($('#genNames').checked) D.blessings.forEach(b => items.push(genBlessItem(b)));
  if ($('#genThanks').checked) phrases.filter(p => p.type==='thanks').forEach(t => items.push(Object.assign(phraseItem(t), {view:'generator', text:t.text, kind:phraseLabel(t), ref:'', cls:'c-dec'})));
  return items;
}
function genCount(){ const n = genBuild().length; $('#genCount').textContent = n + ' lines · about ' + Math.max(1, Math.round(n*0.4)) + ' minutes'; }
function paintSlide(i){
  const it = G.items[i]; if (!it) return;
  const card = $('#genCard');
  card.className = 'gen-card ' + (it.cls || 'c-dec');
  $('#genKind').textContent = it.kind;
  $('#genText').textContent = it.text; $('#genRef').textContent = it.ref || '';
  $('#genPos').textContent = (i+1) + ' of ' + G.items.length;
  $('#genBar').style.width = Math.round((i+1)/G.items.length*100) + '%';
  G.cur = i;
}
$$('#orderSeg button').forEach(b => b.onclick = () => { G.order = b.dataset.o; $$('#orderSeg button').forEach(x => x.setAttribute('aria-pressed', x===b)); });
$('#genNames').onchange = genCount; $('#genThanks').onchange = genCount;
$('#genStart').onclick = () => {
  G.items = genBuild();
  G.items.forEach(it => { it.onStart = i => paintSlide(i); });
  $('#genSetup').hidden = true; $('#genStage').hidden = false;
  paintSlide(0); V.start(G.items, 0, true, 'gen');
  V.onFinish = genFinished;
};
$('#genPrev').onclick = () => V.step(-1);
$('#genNew').onclick = () => { V.stop(); $('#genSetup').hidden = false; $('#genStage').hidden = true; };
/* =========================================================
   DEUTERONOMY 28 · NAMES
   ========================================================= */
function renderNames(){
  const box = $('#nameChips');
  box.innerHTML = S.names.length ? S.names.map((n,i) => `<span class="nchip">${esc(n)}<button aria-label="Remove ${esc(n)}" data-i="${i}">×</button></span>`).join('') : '<p class="muted small">Add the names of everyone you are declaring the blessings over.</p>';
  $$('button', box).forEach(b => b.onclick = () => { S.names.splice(+b.dataset.i, 1); save(); renderNames(); renderBless(); genCount(); });
}
$('#nameForm').onsubmit = e => { e.preventDefault(); const v = $('#nameInput').value.trim(); if (!v) return; v.split(',').map(s=>s.trim()).filter(Boolean).forEach(n => { if (!S.names.includes(n)) S.names.push(n); }); $('#nameInput').value = ''; save(); renderNames(); renderBless(); genCount(); };
async function shareApp(){
  const url = location.origin + location.pathname;
  const text = 'L137 Deliverance Ministry · Pastor Kiki Ocansey\nDealing with the Evil Horns · October 14, 2026\n🎧 Press START PRAYING and repeat after me:\n' + url;
  if (navigator.share) { try { await navigator.share({title:'Dealing with the Evil Horns · L137', text, url}); } catch(e){} return; }
  try { await navigator.clipboard.writeText(url); toast('Link copied (no names)'); } catch(e){ window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener'); }
}
$('#shareNoNames').onclick = shareApp;
$('#familyLink').onclick = async () => {
  if (!S.names.length) { toast('Add names first'); return; }
  if (!confirm('This link contains the names you added (' + joinNames(S.names) + '). Anyone who receives it will see those names. Only send it to your own family. Copy it?')) return;
  const url = location.origin + location.pathname + '#names=' + encodeURIComponent(S.names.join(','));
  try { await navigator.clipboard.writeText(url); toast('Link with names copied'); } catch(e){ prompt('Copy this link:', url); }
};
function renderDeutMode(){ $$('[data-dm]').forEach(b => b.setAttribute('aria-pressed', b.dataset.dm===S.deutMode)); $('#namesPanel').hidden = S.deutMode !== 'pers'; }
$$('[data-dm]').forEach(b => b.onclick = () => { S.deutMode = b.dataset.dm; save(); renderDeutMode(); renderBless(); toast(b.dataset.dm==='orig' ? 'Original Scripture' : 'Personalized prayer'); });
function renderBless(){
  const list = $('#blessList'); list.innerHTML = '';
  const pers = S.deutMode === 'pers';
  D.blessings.forEach(b => {
    const card = document.createElement('article'); card.className = 'bcard'; card.dataset.vid = 'b'+b.v;
    card.innerHTML = `<div class="bhead"><span>${esc(b.ref)}</span><span class="tag-done" ${S.done['b'+b.v]?'':'hidden'}>✔ Declared</span></div>
      <div class="bbody">
        <p class="orig-eyebrow">📜 Original Scripture</p>
        <p class="bverse">${esc(b.text)}</p>
        ${pers ? `<div class="pers-box"><p class="pers-lbl">🙏🏽 Personalized prayer based on ${esc(b.ref)} · not a direct Bible quotation</p>
          <div class="bnames">${S.names.length ? S.names.map(n=>`<span>${esc(n)}</span>`).join('') : '<span>Add names above</span>'}</div>
          ${S.names.length ? `<p class="bdecl">${esc(blessDecl(b))}</p>` : ''}</div>` : ''}
        <div class="pactions"><button class="btn btn-sm b-play">▶ Listen from here</button><button class="btn btn-sm b-one">🔊 This verse only</button><button class="btn btn-sm b-und" aria-expanded="false">💡 Understand</button><button class="btn btn-sm b-done">✔ I declared it</button></div>
        <div class="und" hidden></div>
      </div>`;
    $('.b-play', card).onclick = () => V.start(D.blessings.map(x => blessItem(x)), b.v-1, true, 'bless');
    $('.b-one', card).onclick = () => V.start([blessItem(b)], 0, true, 'bless');
    $('.b-done', card).onclick = () => { markDone('b'+b.v); toast('Marked as declared'); };
    attachUnderstand($('.b-und', card), $('.und', card), b.help, null, 'b'+b.v, K.ps33);
    list.appendChild(card);
  });
  updateBlessCount();
}
function updateBlessCount(){ const n = D.blessings.filter(b => S.done['b'+b.v]).length; $('#blessCount').textContent = n + ' of ' + D.blessings.length; $('#blessBar').style.width = (n/D.blessings.length*100)+'%'; }
$('#playBless').onclick = () => V.start(D.blessings.map(x => blessItem(x)), 0, true, 'bless');

/* =========================================================
   LEARN: three levels
   ========================================================= */
const K = {
  job2228:{ref:'Job 22:28 KJV', text:'Thou shalt also decree a thing, and it shall be established unto thee: and the light shall shine upon thy ways.'},
  prov1821:{ref:'Proverbs 18:21 KJV', text:'Death and life are in the power of the tongue: and they that love it shall eat the fruit thereof.'},
  isa5417:{ref:'Isaiah 54:17 KJV', text:'No weapon that is formed against thee shall prosper; and every tongue that shall rise against thee in judgment thou shalt condemn. This is the heritage of the servants of the LORD, and their righteousness is of me, saith the LORD.'},
  rom1010:{ref:'Romans 10:10 KJV', text:'For with the heart man believeth unto righteousness; and with the mouth confession is made unto salvation.'},
  cor413:{ref:'2 Corinthians 4:13 KJV', text:'We having the same spirit of faith, according as it is written, I believed, and therefore have I spoken; we also believe, and therefore speak;'},
  mark1123:{ref:'Mark 11:23 KJV', text:'For verily I say unto you, That whosoever shall say unto this mountain, Be thou removed, and be thou cast into the sea; and shall not doubt in his heart, but shall believe that those things which he saith shall come to pass; he shall have whatsoever he saith.'},
  john1413:{ref:'John 14:13–14 KJV', text:'And whatsoever ye shall ask in my name, that will I do, that the Father may be glorified in the Son. If ye shall ask any thing in my name, I will do it.'},
  phil29:{ref:'Philippians 2:9–10 KJV', text:'Wherefore God also hath highly exalted him, and given him a name which is above every name: That at the name of Jesus every knee should bow, of things in heaven, and things in earth, and things under the earth;'},
  isa5511:{ref:'Isaiah 55:11 KJV', text:'So shall my word be that goeth forth out of my mouth: it shall not return unto me void, but it shall accomplish that which I please, and it shall prosper in the thing whereto I sent it.'},
  gal313:{ref:'Galatians 3:13–14 KJV', text:'Christ hath redeemed us from the curse of the law, being made a curse for us: for it is written, Cursed is every one that hangeth on a tree: That the blessing of Abraham might come on the Gentiles through Jesus Christ; that we might receive the promise of the Spirit through faith.'},
  rev1211:{ref:'Revelation 12:11 KJV', text:'And they overcame him by the blood of the Lamb, and by the word of their testimony; and they loved not their lives unto the death.'},
  heb1224:{ref:'Hebrews 12:24 KJV', text:'And to Jesus the mediator of the new covenant, and to the blood of sprinkling, that speaketh better things than that of Abel.'},
  ps10928:{ref:'Psalm 109:28 KJV', text:'Let them curse, but bless thou: When they arise, let them be ashamed; but let thy servant rejoice.'},
  ps11817:{ref:'Psalm 118:17 KJV', text:'I shall not die, but live, and declare the works of the LORD.'},
  heb116:{ref:'Hebrews 11:6 KJV', text:'But without faith it is impossible to please him: for he that cometh to God must believe that he is, and that he is a rewarder of them that diligently seek him.'},
  phil46:{ref:'Philippians 4:6 KJV', text:'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.'},
  ps1212:{ref:'Psalm 121:2 KJV', text:'My help cometh from the LORD, which made heaven and earth.'},
  acts312:{ref:'Acts 3:12 KJV', text:'And when Peter saw it, he answered unto the people, Ye men of Israel, why marvel ye at this? or why look ye so earnestly on us, as though by our own power or holiness we had made this man to walk?'},
  mat38:{ref:'Matthew 3:8 KJV', text:'Bring forth therefore fruits meet for repentance:'},
  ps1094:{ref:'Psalm 109:4 KJV', text:'For my love they are my adversaries: but I give myself unto prayer.'},
  rev1210:{ref:'Revelation 12:10 KJV', text:'And I heard a loud voice saying in heaven, Now is come salvation, and strength, and the kingdom of our God, and the power of his Christ: for the accuser of our brethren is cast down, which accused them before our God day and night.'},
  deut281:{ref:'Deuteronomy 28:1 KJV', text:'And it shall come to pass, if thou shalt hearken diligently unto the voice of the LORD thy God, to observe and to do all his commandments which I command thee this day, that the LORD thy God will set thee on high above all nations of the earth:'},
  ex2056:{ref:'Exodus 20:5–6 KJV', text:'Thou shalt not bow down thyself to them, nor serve them: for I the LORD thy God am a jealous God, visiting the iniquity of the fathers upon the children unto the third and fourth generation of them that hate me; And shewing mercy unto thousands of them that love me, and keep my commandments.'},
  ezk1820:{ref:'Ezekiel 18:20 KJV', text:'The soul that sinneth, it shall die. The son shall not bear the iniquity of the father, neither shall the father bear the iniquity of the son: the righteousness of the righteous shall be upon him, and the wickedness of the wicked shall be upon him.'},
  jer3129:{ref:'Jeremiah 31:29–30 KJV', text:"In those days they shall say no more, The fathers have eaten a sour grape, and the children's teeth are set on edge. But every one shall die for his own iniquity: every man that eateth the sour grape, his teeth shall be set on edge."},
  john92:{ref:'John 9:2–3 KJV', text:'And his disciples asked him, saying, Master, who did sin, this man, or his parents, that he was born blind? Jesus answered, Neither hath this man sinned, nor his parents: but that the works of God should be made manifest in him.'},
  heb86:{ref:'Hebrews 8:6 KJV', text:'But now hath he obtained a more excellent ministry, by how much also he is the mediator of a better covenant, which was established upon better promises.'},
  heb922:{ref:'Hebrews 9:22 KJV', text:'And almost all things are by the law purged with blood; and without shedding of blood is no remission.'},
  john1930:{ref:'John 19:30 KJV', text:'When Jesus therefore had received the vinegar, he said, It is finished: and he bowed his head, and gave up the ghost.'},
  cor517:{ref:'2 Corinthians 5:17 KJV', text:'Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.'},
  mat310:{ref:'Matthew 3:10 KJV', text:'And now also the axe is laid unto the root of the trees: therefore every tree which bringeth not forth good fruit is hewn down, and cast into the fire.'}
};
Object.assign(K, D.K);
const T = {
  hear:{q:'Because when you hear yourself read, faith comes, you see?', by:'Derek Prince', src:'The Provision Is in the Promises', url:'https://www.derekprince.com/radio/c-r143-104'},
  bold:{q:'A proclamation is a confession that is made boldly. It is releasing the authority of God’s Word into a situation: into your own life, the life of your church, a political situation, or whatever it may be.', by:'Derek Prince Ministries', src:'from Declaring God’s Word', url:'https://www.derekprince.com/en/news/20231208-3'},
  release:{q:'Proclaiming it is releasing it into a situation. It takes confidence, it takes boldness.', by:'Derek Prince', src:'The Word and the Spirit', url:'https://www.derekprince.com/radio/552'},
  spirit:{q:'If the Spirit of God propels the word of God through your mouth, it’s as effective as it was when God spoke the universe into being.', by:'Derek Prince', src:'The Word and the Spirit', url:'https://www.derekprince.com/radio/552'},
  exchange:{q:'There is a very simple practical exchange. Jesus became a curse that we might receive the blessing.', by:'Derek Prince', src:'Release from the Curse – Part 1', url:'https://www.derekprince.com/sermons/326'},
  positive:{q:'You see, we replace the negative with the positive because the Bible says if people curse you, don’t curse them back, bless them.', by:'Derek Prince', src:'Proclamations', url:'https://www.derekprince.com/radio/554'},
  regula:{q:'I think almost every night Ruth and I proclaim on her behalf, “Regula shall not die but live and declare the works of the Lord.”', by:'Derek Prince', src:'Fierce Times Are Coming', url:'https://www.derekprince.com/sermons/108'},
  cards:DP_CARDS
};
Object.assign(T, D.T);
const ROLES = {
  auth:{name:'Who you call on', color:'#8A5E00', v:K.phil29, t:'You call on the Lord, or speak as you apply the Blood of Jesus. The power is His, not yours.'},
  cmd:{name:'What you command', color:'#C24A16', v:K.mark1123, t:'You speak to the problem directly, the way Jesus taught us to say unto the mountain.'},
  tgt:{name:'What it is aimed at', color:'#6E2F5A', v:K.ps7510, t:'You name exactly which horn must be broken or cut off.'},
  seal:{name:'Sealed in Jesus name', color:'#1E40AF', v:K.john1413, t:'Every command rests on the name of Jesus.'},
  promise:{name:'What you ask God to do', color:'#4F7A2E', v:K.ps9210, t:'You ask the Lord to exalt your horn and lift your head.'}
};
const ANAT = [
  {n:1, parts:[['As I pour the blood of Jesus upon this earth, ','auth'],['every evil horn fighting against my life, my destiny, and my progress, ','tgt'],['be broken and destroyed now ','cmd'],['in Jesus Name.','seal']]},
  {n:7, parts:[['O Lord, arise ','auth'],['and cut off ','cmd'],['every horn of the wicked standing against my financial breakthrough, my career advancement, my business, and my divine establishment.','tgt']]},
  {n:19, parts:[['O Lord as you cut off the Horns of the wicked, ','auth'],['exalt my Horn, ','promise'],['Lift my head above shame, rejection, delay, stagnation, and every opposition, ','promise'],['Let my testimony manifest for Your glory, ','promise'],['in Jesus Name','seal']]}
]
const LEVELS = {
  b:{title:'🌱 Beginner: what is an evil horn?', html:() => `
    <p><b>🐂 A horn is a picture of power.</b> Animals with horns use them to push and to fight. In the Bible, a horn stands for strength and power. Strong's Concordance (H7161, <i>qeren</i>) gives its figurative meaning as “power.”</p>
    <p><b>📖 Psalm 75:10.</b> God will cut off the power of the wicked, and He will lift up the righteous.</p>${scripHTML(K.ps7510)}
    <p><b>🛡️ Psalm 3:3.</b> David wrote this when he was running from his own son Absalom. When enemies pushed him down, the LORD lifted his head.</p>${scripHTML(K.ps33)}
    <p><b>🩸 Revelation 12:11.</b> We overcome by the blood of the Lamb, which is what Jesus did for us, and by the word of our testimony, which is saying out loud what God's Word says.</p>${scripHTML(K.rev1211)}${teachHTML(T.dp146)}
    <p><b>🗣️ Pastor Kiki's declaration 19 agrees with Psalm 75:10.</b></p>
    <div class="say"><b>🗣️ SAY IT · Pastor Kiki's original words</b><p class="pword c-dec">${esc(decls[18].text)}</p><button class="btn btn-sm" data-sayk="declaration-19">▶ Listen &amp; repeat</button></div>`,
    checks:[
      {q:'In the Bible, a horn is a picture of…', o:['Music only','Power','Food'], a:1, e:'Strong’s Concordance H7161 (qeren) gives the figurative meaning “power.”'},
      {q:'Psalm 75:10: what will God do to the horns of the wicked?', o:['Cut them off','Make them bigger','Hide them'], a:0, e:'“All the horns of the wicked also will I cut off; but the horns of the righteous shall be exalted.” Psalm 75:10 KJV'},
      {q:'Psalm 3:3: the LORD is the lifter up of my…', o:['Hands','Voice','Head'], a:2, e:'“But thou, O LORD, art a shield for me; my glory, and the lifter up of mine head.” Psalm 3:3 KJV'},
      {q:'Revelation 12:11: they overcame him by the blood of the Lamb and by…', o:['The word of their testimony','Their own strength','Staying quiet'], a:0, e:'“And they overcame him by the blood of the Lamb, and by the word of their testimony.” Revelation 12:11 KJV'},
      {q:'Who wrote Psalm 3 when he fled from his son Absalom?', o:['Moses','David','Asaph'], a:1, e:'The title of Psalm 3 says it is “A Psalm of David, when he fled from Absalom his son.”'}
    ]},
  i:{title:'🌿 Intermediate: Zechariah’s vision of four horns and four carpenters', html:() => `
    <p><b>Who is speaking?</b> The prophet Zechariah, describing what he saw by night.</p>${scripHTML(K.zech18)}
    <p><b>The setting.</b> God’s people had come back to Jerusalem to rebuild. Just before this vision, God promised to return with mercies and build His house.</p>${scripHTML(K.zech116)}
    <p><b>The vision.</b> <b>Blue Scripture boxes are the Bible itself. Plain text is explanation.</b></p>${scripHTML(K.zech11821)}
    <p class="small muted">Explanation: the horns were the powers that scattered God’s people “so that no man did lift up his head.” The carpenters, or craftsmen, were God’s answer, sent “to fray them, to cast out the horns.”</p>${teachHTML(T.mhcarp)}
    <p><b>Cross-references: God’s good horn.</b> The Bible also speaks of God lifting up the horn of His people, and of Jesus as the horn of salvation.</p>${scripHTML(K.ps182)}${scripHTML(K.ps14814)}${scripHTML(K.luke169)}
    <p><b>👆 How Pastor Kiki's declarations are built.</b> Tap each part to see what it does.</p>
    ${ANAT.map((a,ai)=>`<p class="small muted">Declaration ${a.n}</p><p class="anat">${a.parts.map((p,pi)=>`<button class="anat-part" data-ai="${ai}" data-pi="${pi}">${esc(p[0].trim())}</button>`).join(' ')}</p><div class="anat-out" id="anatOut${ai}">Tap a part.</div>`).join('')}`,
    checks:[
      {q:'How many horns did Zechariah see?', o:['Two','Four','Seven'], a:1, e:'“Then lifted I up mine eyes, and saw, and behold four horns.” Zechariah 1:18 KJV'},
      {q:'According to Zechariah 1:19, whom had the horns scattered?', o:['Egypt and Babylon','Judah, Israel, and Jerusalem','The Philistines'], a:1, e:'“These are the horns which have scattered Judah, Israel, and Jerusalem.” Zechariah 1:19 KJV'},
      {q:'What did the LORD show Zechariah after the horns?', o:['Four carpenters','Four chariots','Four angels with swords'], a:0, e:'“And the LORD shewed me four carpenters.” Zechariah 1:20 KJV'},
      {q:'What did the scattering do to the people (Zechariah 1:21)?', o:['No man did lift up his head','They became rich','They built a tower'], a:0, e:'“…so that no man did lift up his head.” Zechariah 1:21 KJV'},
      {q:'What did the carpenters come to do?', o:['Build a temple','To fray them, to cast out the horns','Count the people'], a:1, e:'“…but these are come to fray them, to cast out the horns of the Gentiles.” Zechariah 1:21 KJV'},
      {q:'Luke 1:69 says God raised up an horn of…', o:['Judgment','Salvation','Gold'], a:1, e:'“And hath raised up an horn of salvation for us in the house of his servant David.” Luke 1:69 KJV'},
      {q:'Just before the vision, what did God promise in Zechariah 1:16?', o:['I am returned to Jerusalem with mercies','I will leave Jerusalem','I will send a flood'], a:0, e:'“I am returned to Jerusalem with mercies: my house shall be built in it.” Zechariah 1:16 KJV'}
    ]},
  a:{title:'🌳 Advanced: Hebrew words, commentaries and documented teaching', html:() => `
    <p><b>1. Hebrew word studies (Strong’s Concordance).</b></p>
    <div class="scrip"><b>Horn · קֶרֶן qeren · Strong’s H7161</b><p>“a horn (as projecting)… figuratively, power.” Usage includes “of strength (fig).”</p></div>
    <div class="scrip"><b>Carpenters · חָרָשׁ chârâsh · Strong’s H2796</b><p>“a fabricator or any material:—artificer, carpenter, craftsman, engraver… smith, worker, workman.” Usage outline includes “skilful to destroy (warriors) (fig.).”</p></div>
    <div class="scrip"><b>Fray · חָרַד chârad · Strong’s H2729</b><p>“to shudder with terror; hence, to fear.” In the causative: “to cause to tremble,” “to drive in terror, rout (an army).”</p></div>
    <p class="small muted">Sources: <a href="https://www.blueletterbible.org/lexicon/h7161/kjv/wlc/0-1/" target="_blank" rel="noopener">H7161</a>, <a href="https://www.blueletterbible.org/lexicon/h2796/kjv/wlc/0-1/" target="_blank" rel="noopener">H2796</a>, <a href="https://www.blueletterbible.org/lexicon/h2729/kjv/wlc/0-1/" target="_blank" rel="noopener">H2729</a> (Blue Letter Bible).</p>
    <p><b>2. What the commentaries say.</b></p>${teachHTML(T.mhhorns)}${teachHTML(T.mhcarp)}${teachHTML(T.gill)}
    <p><b>3. The horn exalted.</b> Scripture uses the exalted horn for God lifting up His people.</p>${scripHTML(K.sam21)}${scripHTML(K.ps9210)}${scripHTML(K.ps7567)}
    <p><b>4. Documented deliverance teaching: the blood and the testimony.</b></p>${scripHTML(K.rev1211)}${teachHTML(T.dp146)}${teachHTML(T.dp146b)}${teachHTML(T.dp389b)}
    <p><b>5. Original meaning and today’s use.</b> In Zechariah, the horns were the nations that scattered Judah, Israel and Jerusalem. Deliverance ministry applies the same picture to powers that oppose a believer's life today. Both are shown here, but they are not the same thing.</p>`,
    checks:[
      {q:'The Hebrew word for “horn” in Zechariah 1:18 is…', o:['qeren (H7161)','shofar','chârâsh'], a:0, e:'Strong’s H7161, qeren.'},
      {q:'Strong’s gives the figurative meaning of qeren as…', o:['Wisdom','Power','Time'], a:1, e:'“figuratively, power” (Strong’s H7161).'},
      {q:'The Hebrew word translated “carpenters” is…', o:['qeren','chârâsh (H2796)','chârad'], a:1, e:'Strong’s H2796, chârâsh: craftsman, smith, workman.'},
      {q:'The usage outline for chârâsh includes the figurative sense…', o:['Skilful to build ships','Skilful to destroy (warriors)','Skilful to sing'], a:1, e:'H2796 outline: “skilful to destroy (warriors) (fig.).”'},
      {q:'“Fray” (chârad, H2729) in the causative means…', o:['To cause to tremble, drive in terror','To heal','To count'], a:0, e:'H2729: “to cause to tremble… to drive in terror, rout (an army).”'},
      {q:'Matthew Henry says the horns denote…', o:['Weakness and fear','Dignity and dominion… strength, and power, and violence','Music and worship'], a:1, e:'Matthew Henry, Commentary on Zechariah 1.'},
      {q:'Matthew Henry says the carpenters denote…', o:['The wisdom and forecast of men','Angels of judgment','Priests'], a:0, e:'“carpenters (which denote the wisdom and forecast of men) for the church.” Matthew Henry.'},
      {q:'John Gill says the horns signify…', o:['Kingdoms or kings','Temptations only','Musical instruments'], a:0, e:'Gill: “signify kingdoms or kings, and these very powerful and mighty.”'},
      {q:'Derek Prince: “We overcome Satan when we…”', o:['fast for forty days','testify personally to what the Word says the blood does for us','stay silent'], a:1, e:'Derek Prince, How To Appropriate The Blood. Revelation 12:11 KJV.'},
      {q:'In 1 Samuel 2:1, who prayed, “mine horn is exalted in the LORD”?', o:['Hannah','Ruth','Deborah'], a:0, e:'“And Hannah prayed, and said, My heart rejoiceth in the LORD, mine horn is exalted in the LORD.” 1 Samuel 2:1 KJV'}
    ]}
};

let level = 'b';
function checkHTML(c, i){ return `<div class="qblock" data-q="${i}"><p class="small muted">Question ${i+1} of ${LEVELS[level].checks.length}</p><p><b>${esc(c.q)}</b></p><div class="opts">${c.o.map((o,j)=>`<button class="opt" data-j="${j}">${esc(o)}</button>`).join('')}</div><div class="expl" hidden></div></div>`; }
function bindQuestion(block, correct, explain, onAnswer){
  $$('.opt', block).forEach(b => b.onclick = () => {
    if (block.dataset.done) return; block.dataset.done = '1';
    const j = +b.dataset.j; $$('.opt', block).forEach(x => { x.disabled = true; if (+x.dataset.j === correct) x.classList.add('right'); });
    if (j !== correct) b.classList.add('wrong');
    const ex = $('.expl', block); ex.hidden = false; ex.innerHTML = (j===correct ? '✅ <b>Correct.</b> ' : '❌ <b>Not quite.</b> The answer is: <b>' + esc($$('.opt', block)[correct].textContent) + '</b>. ') + esc(explain) + ' <button class="btn btn-sm qsay">🔊 Read answer</button>';
    const said = (j===correct ? 'Correct. ' : 'Not quite. The answer is: ' + $$('.opt', block)[correct].textContent + '. ') + explain;
    $('.qsay', ex).onclick = () => V.start([{key:null, label:'Answer', speak:said, turn:false}], 0, false, 'quiz');
    onAnswer && onAnswer(j===correct);
  });
}
function addQuizVoice(root){ $$('.qblock', root).forEach(blk => { if ($('.qread', blk)) return; const b = document.createElement('button'); b.className = 'btn btn-sm qread'; b.textContent = '🔊 Read question'; const opts = $('.opts', blk); opts.parentNode.insertBefore(b, opts); b.onclick = () => { const q = $('p b', blk).textContent; const o = $$('.opt', blk).map((x,k) => 'Answer ' + (k+1) + '. ' + x.textContent.replace(/^\d+\. /,'') + '.').join(' '); V.start([{key:null, label:'Question', speak:q + ' ' + o, turn:false}], 0, false, 'quiz'); }; }); }
function levelItems(k){ const L = LEVELS[k]; const d = document.createElement('div'); d.innerHTML = L.html(); const name = {b:'Beginner',i:'Intermediate',a:'Advanced'}[k]; const out = [name + ' level. ' + L.title.replace(/^\S+\s/,'')];
  [...d.children].forEach(c => { if (c.classList.contains('anat') || c.classList.contains('anat-out')) return; let s = c.textContent.replace(/▶ Listen & repeat/,'').replace(/\s+/g,' ').trim(); if (/^Declaration \d+$/.test(s) || /^Sources:/.test(s)) return; if (c.classList.contains('scrip')) { const r = $('b', c).textContent, x = $('p', c).textContent; s = r.replace(/ KJV$/,'').replace(/ · Strong’s /,'. Strong’s ') + '. ' + x; } if (c.classList.contains('teach')) s = s.replace(/"/g,''); if (s) out.push(s); });
  out.push('Quiz instructions. There are ' + L.checks.length + ' questions. Read each question, then tap one answer. You will see right away if it is correct, with the Scripture.');
  out.push('End of the ' + name + ' level.');
  return out.map((s,j) => ({key:null, label:name + ' · part ' + (j+1) + ' of ' + out.length, speak:s, turn:false, view:'learn'})); }
$('#lvListen').onclick = () => V.start(levelItems(level), 0, false, 'learn');
$('#lvAll').onclick = () => { let all = []; ['b','i','a'].forEach((k,j) => { if (j) all.push({key:null, label:'Next level', speak:'Now the ' + {i:'Intermediate',a:'Advanced'}[k] + ' level begins.', turn:false, view:'learn'}); all = all.concat(levelItems(k)); }); V.start(all, 0, false, 'learn'); };
function renderLevel(){
  const L = LEVELS[level];
  $$('#levelSeg button').forEach(b => b.setAttribute('aria-selected', b.dataset.l===level));
  $('#lvListen').textContent = '▶ LISTEN · ' + {b:'Beginner',i:'Intermediate',a:'Advanced'}[level] + ' level';
  $('#levelBody').innerHTML = `<div class="lv supp"><p class="supp-lbl">Supplementary Biblical Study — Not Part of Pastor Kiki's Original Direction</p><h3>${esc(L.title)}</h3>${L.html()}<div class="check"><p class="lbl">❓ Check yourself</p>${L.checks.map(checkHTML).join('')}<p class="muted small" id="lvStatus">${S.done['lv-'+level]?'✔ Level complete':''}</p></div></div>`;
  let answered = 0;
  $$('#levelBody .qblock').forEach((blk, i) => bindQuestion(blk, L.checks[i].a, L.checks[i].e, () => { answered++; if (answered === L.checks.length) { markDone('lv-'+level); $('#lvStatus').textContent = '✔ Level complete'; toast('Level complete'); } }));
  addQuizVoice($('#levelBody'));
  $$('#levelBody [data-sayk]').forEach(b => b.onclick = () => { const p = phrases.find(x => x.id===b.dataset.sayk); V.start([Object.assign(phraseItem(p), {view:'learn'})], 0, false); });
  $$('#levelBody .anat button').forEach(b => b.onclick = () => { const a = ANAT[+b.dataset.ai], part = a.parts[+b.dataset.pi], r = ROLES[part[1]]; $('#anatOut'+b.dataset.ai).innerHTML = `<b>${esc(r.name)}:</b> "${esc(part[0].trim())}". ${esc(r.t)}<br><span class="small"><b>${esc(r.v.ref)}</b>: ${esc(r.v.text)}</span>`; });
}
$$('#levelSeg button').forEach(b => b.onclick = () => { level = b.dataset.l; renderLevel(); });

/* flashcards */
let fi = 0, flipped = false;
function renderFlash(){
  const f = D.review.flash[fi];
  $('#flashBox').innerHTML = `<button class="flash ${flipped?'back':''}" id="flashCard" aria-live="polite">${esc(flipped ? f.a : f.q)}</button><div class="row gap center"><button class="btn btn-sm" id="fSay">🔊 Listen</button></div><div class="row gap center"><button class="btn btn-sm" id="fPrev">← Previous</button><span class="small muted">${fi+1} of ${D.review.flash.length}</span><button class="btn btn-sm" id="fNext">Next →</button></div>`;
  $('#flashCard').onclick = () => { flipped = !flipped; renderFlash(); };
  $('#fSay').onclick = () => V.start([{key:null, label:'Scripture memory card ' + (fi+1), speak:f.a.replace(/\(([^)]+) KJV\)$/,'. $1.'), turn:true}], 0, false, 'learn');
  $('#fPrev').onclick = () => { fi = (fi - 1 + D.review.flash.length) % D.review.flash.length; flipped = false; renderFlash(); };
  $('#fNext').onclick = () => { fi = (fi + 1) % D.review.flash.length; flipped = false; renderFlash(); };
}
/* final quiz */
function renderQuiz(){
  const qs = D.review.quiz; let score = 0, answered = 0;
  $('#quizBox').innerHTML = qs.map((q,i) => {
    if (q.type==='order') { const sh = q.items.map((t,k)=>({t,k})).sort(() => Math.random()-.5); return `<div class="qblock lv" style="margin-bottom:10px" data-q="${i}"><p class="small muted">Question ${i+1} of ${qs.length}</p><p><b>${esc(q.q)}</b></p><p class="small muted">Tap the steps in the right order.</p><div class="opts">${sh.map(s=>`<button class="opt ord" data-k="${s.k}">${esc(s.t)}</button>`).join('')}</div><div class="expl" hidden></div></div>`; }
    const opts = q.type==='tf' ? ['True','False'] : q.o;
    return `<div class="qblock lv" style="margin-bottom:10px" data-q="${i}"><p class="small muted">Question ${i+1} of ${qs.length}</p><p><b>${esc(q.q)}</b></p><div class="opts">${opts.map((o,j)=>`<button class="opt" data-j="${j}">${esc(o)}</button>`).join('')}</div><div class="expl" hidden></div></div>`;
  }).join('') + `<p id="quizScore" class="h3"></p>`;
  const doneOne = ok => { answered++; if (ok) score++; if (answered === qs.length) { $('#quizScore').textContent = `🏆 You scored ${score} of ${qs.length}`; markDone('quiz'); } };
  $$('#quizBox .qblock').forEach((blk, i) => { const q = qs[i];
    if (q.type==='order') { const picked = []; $$('.ord', blk).forEach(b => b.onclick = () => { if (b.disabled) return; picked.push(+b.dataset.k); b.disabled = true; b.textContent = picked.length + '. ' + b.textContent; if (picked.length === q.items.length) { const ok = picked.every((k,j) => k===j); $$('.ord', blk).forEach(x => x.classList.add(ok?'right':'wrong')); const ex = $('.expl', blk); ex.hidden = false; ex.innerHTML = (ok ? '✅ <b>Correct.</b> ' : '❌ <b>Not quite.</b> The right order: ') + esc(q.e); doneOne(ok); } }); return; }
    const correct = q.type==='tf' ? (q.a ? 0 : 1) : q.a; bindQuestion(blk, correct, q.e, doneOne); });
  addQuizVoice($('#quizBox'));
}

/* =========================================================
   PROGRESS
   ========================================================= */
const GROUPS = [
  {name:'🗣️ Declarations', keys:decls.map(d => d.id)},
  {name:'📖 Instructions and Scriptures heard', keys:phrases.filter(p => p.type==='instruction'||p.type==='scripture').map(p=>p.id)},
  {name:'🌱🌿🌳 Learning levels', keys:['lv-b','lv-i','lv-a']},
  {name:'❓ Final quiz', keys:['quiz']},
  {name:'🔁 Finished praying a group', keys:['gen']},
  {name:'🙏🏽 Closing direction and blessing', keys:['thanks-1','thanks-2']}
];
const ALL_KEYS = GROUPS.flatMap(g => g.keys);
function pct(){ return Math.round(ALL_KEYS.filter(k => S.done[k]).length / ALL_KEYS.length * 100); }
function updateProgress(){
  const p = pct();
  $('#progChip').textContent = p + '%';
  const nd = decls.filter(d => S.done[d.id]).length;
  $('#homeProg').textContent = p ? `${p}% · ${nd} of 21 declarations` : 'Nothing started yet';
  updateBlessCount();
  if (current === 'progress') renderProgress();
}
function renderProgress(){
  const p = pct();
  const r = S.resume, sessDecl = [...V.session].filter(k => k.startsWith('declaration-')).length;
  const remaining = decls.filter(d => !S.done[d.id]).length;
  $('#nowBox').innerHTML = `<div class="now-grid">
    <div><small>Current line</small><b>${r ? esc(r.label) : (V.session.size ? 'Finished' : 'Not started')}</b></div>
    <div><small>Declared this session</small><b>${sessDecl}</b></div>
    <div><small>Declarations remaining</small><b>${remaining} of 21</b></div>
    <div><small>Groups completed</small><b>${FOCUS.filter(f => S.groups[f.id]).length} of ${FOCUS.length}</b></div>
  </div>${r ? '<button class="btn btn-primary wide" id="progResume">▶ Resume where I left off</button>' : ''}`;
  if (r) $('#progResume').onclick = resumeLast;
  $('#groupsDone').innerHTML = FOCUS.filter(f => S.groups[f.id]).map(f => `<span class="gdone">✔ ${esc(f.name)}</span>`).join('') || '<p class="muted small">None yet. Use 🔁 Pray to pray a group.</p>';
  $('#ringPct').textContent = p + '%';
  $('#ringFg').style.strokeDashoffset = 326.7 * (1 - p/100);
  $('#progList').innerHTML = GROUPS.map(g => { const n = g.keys.filter(k => S.done[k]).length; return `<div class="pitem"><div class="top"><span>${g.name}</span><span>${n} of ${g.keys.length}</span></div><div class="bar"><i style="width:${n/g.keys.length*100}%"></i></div></div>`; }).join('');
  const todo = decls.filter(d => !S.done[d.id]);
  $('#todoList').innerHTML = todo.length ? todo.map(d => `<button data-n="${d.n}" aria-label="Go to declaration ${d.n}">${d.n}</button>`).join('') : '<p>🏆 All 21 declarations prayed. Thank the Lord.</p>';
  $$('#todoList button').forEach(b => b.onclick = () => { S.filter = 'all'; $$('#filterSeg button').forEach(x => x.setAttribute('aria-pressed', x.dataset.f==='all')); renderPhrases(); go('studio'); setTimeout(() => { const el = $(`[data-vid="declaration-${b.dataset.n}"]`); if (el) { el.scrollIntoView({block:'center'}); el.classList.add('speaking'); setTimeout(()=>el.classList.remove('speaking'), 1800); } }, 60); });
}
$('#resetProg').onclick = () => { if (confirm('Start again? This clears your progress on this phone so you can start fresh. Your loved ones’ names stay saved.')) { S.done = {}; S.groups = {}; S.resume = null; V.session = new Set(); save(); updateResumeUI(); renderPhrases(); renderBless(); updateProgress(); renderProgress(); dprog(); toast('Progress cleared'); } };

/* share */
$('#shareApp').onclick = shareApp;

/* init */
renderPhrases(); renderStartFrom(); renderFocus(); genCount(); renderDeutMode(); updateResumeUI();
renderNames(); renderBless(); renderLevel(); renderFlash(); renderQuiz(); updateProgress(); ui();
go('home');
window.__L137 = {S, V, G, phrases, D, ANAT};
})();
