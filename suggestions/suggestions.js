(() => {
'use strict';

/* =====================================================================
   PASTE YOUR WEB3FORMS ACCESS KEY BETWEEN THE QUOTES BELOW.
   It is safe for this key to be public: it is not an email address.
   Leave it empty and the cats will spit every suggestion back out.
   ===================================================================== */
const WEB3FORMS_ACCESS_KEY = '';

const $ = id => document.getElementById(id);
const RM = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pick = a => a[Math.floor(Math.random() * a.length)];
const wait = ms => new Promise(r => setTimeout(r, ms));

const ta = $('note'), prof = $('prof'), bubble = $('bubble'), btn = $('send'), pad = $('pad');

/* ---------------- Word list (loads after the page appears) ---------------- */
let WORDS = null;
function decodeWords(txt) {
  const D = '0123456789abcdefghijklmnopqrstuvwxyz', set = new Set();
  let prev = '';
  const lines = txt.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l) continue;
    const w = prev.slice(0, D.indexOf(l[0])) + l.slice(1);
    set.add(w); prev = w;
  }
  return set;
}
function loadWords() {
  fetch('words.txt').then(r => { if (!r.ok) throw new Error('no list'); return r.text(); })
    .then(t => { WORDS = decodeWords(t); })
    .catch(() => { WORDS = null; });
}
if (document.readyState === 'complete') setTimeout(loadWords, 100);
else window.addEventListener('load', () => setTimeout(loadWords, 100));

/* ---------------- Family-friendly guard (ROT13 so the source stays clean) ---------------- */
const rot = s => s.replace(/[a-z]/g, c => String.fromCharCode((c.charCodeAt(0) - 84) % 26 + 97));
const BAD_PARTS = 'shpx shx shd cuhx fuvg fulg phag xhag pbpx xbpx qvpx ovgpu ovpu olgpu ovngpu fyhg juber chffl avtt avte avtn snttbg sntt encr encvfg ergneq gjng jnax cvff cravf crravf intvan qvyqb obbo gvggl gvggvr cbea onfgneq obyybpx qbhpur wvmm anmv uvgyre'.split(' ').map(rot);
const BAD_WORDS = 'nff nefr nffrf phz xhz snt sntf uryy qnza penc frk frkl nany nahf ubzb fcvp xvxr puvax tbbx jbc pbba wnc gvg gvgf ubr ubrf abo xabo'.split(' ').map(rot);
function isRude(w) {
  const pieces = w.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  const whole = pieces.join('');
  for (const p of pieces.concat([whole])) {
    if (BAD_WORDS.indexOf(p) >= 0) return true;
  }
  for (const b of BAD_PARTS) if (whole.indexOf(b) >= 0) return true;
  return false;
}

/* ---------------- Misspelling styles ---------------- */
const SOUNDALIKE = {
  i: 'eye', more: 'moor', games: 'gnomes', game: 'gnome', want: 'wand', new: 'gnu', know: 'no', no: 'know',
  write: 'right', right: 'rite', great: 'grate', there: 'their', their: 'there', your: 'yore', you: 'ewe',
  for: 'four', to: 'two', too: 'tutu', be: 'bee', see: 'sea', here: 'hear', would: 'wood', whole: 'hole',
  site: 'sight', website: 'websight', made: 'maid', meet: 'meat', week: 'weak', way: 'weigh', one: 'won',
  night: 'knight', hair: 'hare', tail: 'tale', sun: 'son', peace: 'piece', buy: 'bye', by: 'bye', read: 'reed',
  wait: 'weight', plain: 'plane', mail: 'male', road: 'rode', so: 'sew', our: 'hour', all: 'awl', blue: 'blew',
  dear: 'deer', flew: 'flu', real: 'reel', sale: 'sail', some: 'sum', where: 'wear', which: 'witch',
  weather: 'whether', fair: 'fare', poor: 'pour', cats: 'katz', cat: 'kat', page: 'paige', idea: 'eyedea',
  please: 'pleas', add: 'ad', eight: 'ate', four: 'fore', knew: 'gnu', flower: 'flour', button: 'mutton',
  suggest: 'sujjest', suggestion: 'sujjestshun', fun: 'fungus', cool: 'kool', thanks: 'thanx', pizza: 'peetza'
};
const OLDE = { website: 'webbe-syte', the: 'ye', you: 'thou', your: 'thy', are: 'art', has: 'hath', does: 'doth', old: 'olde', shop: 'shoppe', town: 'towne', my: 'mine', is: 'be' };
const PHONETIC = [
  [/ph/g, 'f'], [/tion/g, 'shun'], [/sion/g, 'zhun'], [/gg(?=e)/g, 'jj'], [/ight/g, 'yte'], [/ite/g, 'yte'],
  [/ough/g, 'uff'], [/ck/g, 'k'], [/qu/g, 'kw'], [/c(?=[eiy])/g, 's'], [/c/g, 'k'], [/x/g, 'ks'], [/wh/g, 'w'],
  [/^kn/, 'n'], [/ea/g, 'ee'], [/oo/g, 'u'], [/er$/, 'ur'], [/le$/, 'ul'], [/y$/, 'ee'], [/s$/, 'z'], [/ou/g, 'ow']
];
const VOWEL_SWAP = { a: 'u', e: 'i', i: 'y', o: 'aw', u: 'oo' };

function phonetic(w) {
  let r = w;
  for (const [re, to] of PHONETIC) r = r.replace(re, to);
  if (r === w) {
    const idx = [];
    for (let i = 1; i < w.length; i++) if (VOWEL_SWAP[w[i]]) idx.push(i);
    if (!idx.length) return null;
    const i = pick(idx);
    r = w.slice(0, i) + VOWEL_SWAP[w[i]] + w.slice(i + 1);
  }
  return r;
}
function stretch(w) {
  const idx = [];
  for (let i = 0; i < w.length; i++) if ('aeiouy'.indexOf(w[i]) >= 0) idx.push(i);
  if (!idx.length) return w + w[w.length - 1];
  const i = pick(idx), n = 3 + Math.floor(Math.random() * 3);
  return w.slice(0, i) + w[i].repeat(n) + w.slice(i + 1);
}
function soundalike(w) { return SOUNDALIKE[w] || phonetic(w); }
function olde(w) {
  if (OLDE[w]) return OLDE[w];
  const isV = c => 'aeiou'.indexOf(c) >= 0;
  if (w.length > 3 && w[w.length - 1] === 's' && w[w.length - 2] !== 's') {
    const base = olde(w.slice(0, -1));
    return base ? base.replace(/e?$/, 'e') + 's' : null;
  }
  let s = w.replace('i', 'y');
  const last = s[s.length - 1];
  if (last === 'y' && s.length > 3) s = s.slice(0, -1) + 'ie';
  else if (!isV(last) && last !== 'y') s = s.length <= 5 && !isV(s[s.length - 2]) ? s + 'e' : (s.length <= 5 ? s + last + 'e' : s + 'e');
  return s;
}
function shuffle(w) {
  if (w.length < 3) return null;
  const opts = [];
  for (let i = 1; i < w.length - 1; i++) if (w[i] !== w[i + 1]) opts.push(i);
  if (!opts.length) return null;
  const i = pick(opts);
  return w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2);
}
const STYLES = {
  phonetic: { fn: phonetic, label: 'Phonetic chaos' },
  stretch: { fn: stretch, label: 'Extra letters' },
  soundalike: { fn: soundalike, label: 'Sound-alike words' },
  olde: { fn: olde, label: 'Olde English' },
  shuffle: { fn: shuffle, label: 'Letter shuffle' }
};
let style = pick(Object.keys(STYLES));

function caseLike(orig, r) {
  if (orig === 'I') return r;
  if (orig.length > 1 && orig === orig.toUpperCase()) return r.toUpperCase();
  if (orig[0] !== orig[0].toLowerCase()) return r[0].toUpperCase() + r.slice(1);
  return r;
}
function eligible(word) {
  if (!WORDS || /[^A-Za-z]/.test(word)) return false;
  const w = word.toLowerCase();
  if ((style === 'soundalike' && SOUNDALIKE[w]) || (style === 'olde' && OLDE[w])) return true;
  return w.length >= 3 && WORDS.has(w);
}
function wreck(word) {
  const w = word.toLowerCase();
  for (let t = 0; t < 6; t++) {
    const r = STYLES[style].fn(w);
    if (r && r !== w && !isRude(r)) return caseLike(word, r);
  }
  return null;
}

/* ---------------- Keeping the original text ---------------- */
let swaps = {};   // wrecked form -> queue of original words
function logSwap(wrecked, orig) { (swaps[wrecked] = swaps[wrecked] || []).push(orig); }
function originalText() {
  const used = {};
  return ta.value.replace(/[A-Za-z][A-Za-z'-]*/g, tok => {
    const q = swaps[tok];
    if (!q) return tok;
    const n = used[tok] || 0;
    if (n >= q.length) return tok;
    used[tok] = n + 1;
    return q[n];
  });
}

/* ---------------- Professor Misspellington ---------------- */
let poseTimer = 0, lastShake = 0;
function pose(name, ms) {
  prof.classList.remove('shake', 'scribble', 'pleased');
  void prof.getBoundingClientRect();
  if (!name) return;
  prof.classList.add(name);
  clearTimeout(poseTimer);
  poseTimer = setTimeout(() => prof.classList.remove(name), ms || 1200);
}
function say(text, suggestion) {
  bubble.textContent = '';
  const p = document.createElement('span');
  p.textContent = text;
  bubble.appendChild(p);
  if (suggestion) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'dym'; b.textContent = suggestion;
    b.addEventListener('pointerdown', e => e.preventDefault());
    b.addEventListener('click', acceptSuggestion);
    bubble.appendChild(document.createTextNode(' '));
    bubble.appendChild(b);
    bubble.appendChild(document.createTextNode('?'));
  }
  bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
}
function sigh() {
  const now = Date.now();
  if (now - lastShake < 1800) return;
  lastShake = now;
  pose('shake', 1300);
  const s = $('sigh');
  s.classList.remove('show'); void s.offsetWidth; s.classList.add('show');
}
const HELLO = 'I’m here to fix your spelling. By which I mean ruin it.';
const ASK1 = ['Did you mean:', 'Surely you meant:', 'Did you mean:'];
const ASK2 = ['I’ll ask again. Did you mean:', 'Ignoring me won’t help. Did you mean:', 'Last chance. Did you mean:'];
const TOOK_OVER = 'That’s it. I’m fixing them myself.';
const FIXED = ['Fixed it.', 'You’re welcome.', 'Much better.', 'There.', 'Corrected.'];
const THANKED = ['Excellent. Much worse.', 'Wonderful. Truly awful.', 'Yes. Perfect.', 'See? Easy.'];

/* ---------------- Escalating chaos ---------------- */
let pending = null, ignored = 0, autoCount = 0, busy = false, wordsSince = 9;
const phase = () => (ignored >= 6 ? 3 : ignored >= 3 ? 2 : 1);

function replaceWord(start, end, orig, wrecked) {
  if (ta.value.slice(start, end) !== orig) {
    const re = new RegExp('\\b' + orig + '\\b', 'g');
    let m, found = -1;
    while ((m = re.exec(ta.value))) found = m.index;
    if (found < 0) return false;
    start = found; end = found + orig.length;
  }
  ta.setRangeText(wrecked, start, end, 'preserve');
  logSwap(wrecked, orig);
  return true;
}
function acceptSuggestion() {
  if (!pending || busy) return;
  const p = pending; pending = null;
  if (!replaceWord(p.start, p.end, p.orig, p.wrecked)) { say('Too late. You changed it.'); return; }
  ignored = 0;
  pose('pleased', 1100);
  say(pick(THANKED));
  ta.focus({ preventScroll: true });
}
function handleWord(word, start, end) {
  wordsSince++;
  if (!eligible(word)) return;
  if (phase() < 3 && (wordsSince < 3 || Math.random() < 0.6)) { sigh(); return; }
  if (phase() === 3 && Math.random() < 0.5) { sigh(); return; }
  const wrecked = wreck(word);
  if (!wrecked) { sigh(); return; }
  if (pending) { ignored++; pending = null; if (phase() === 3) say(TOOK_OVER); }
  if (phase() === 3) {
    ta.setRangeText(wrecked, start, end, 'preserve');
    logSwap(wrecked, word);
    pose('pleased', 900);
    autoCount++;
    if (autoCount > 1 && autoCount % 2 === 0) say(pick(FIXED));
    return;
  }
  pending = { start, end, orig: word, wrecked };
  wordsSince = 0;
  pose('scribble', 900);
  say(pick(phase() === 2 ? ASK2 : ASK1), wrecked);
}
ta.addEventListener('input', e => {
  if (busy || e.isComposing) return;
  const t = e.inputType || '';
  if (t && t.indexOf('insert') !== 0) return;
  const caret = ta.selectionStart;
  if (caret !== ta.selectionEnd) return;
  const m = ta.value.slice(0, caret).match(/([A-Za-z]+(?:'[A-Za-z]+)?)([^A-Za-z'])$/);
  if (!m) return;
  const start = caret - m[0].length;
  handleWord(m[1], start, start + m[1].length);
});

/* ---------------- The runaway button ---------------- */
let dodges = 0, suppressUntil = 0, lastDodge = 0;
const DODGE_TEXT = ['Submit', 'Nope.', 'Too slow.', 'Missed me.'];
const limit = touch => (touch ? 2 : 3);
function centerButton() {
  btn.style.left = ''; btn.style.top = ''; btn.classList.remove('moved');
  btn.textContent = 'Submit';
}
function dodge(touch) {
  if (busy || dodges >= limit(touch) || Date.now() - lastDodge < 260) return false;
  dodges++; lastDodge = Date.now();
  const pr = pad.getBoundingClientRect(), br = btn.getBoundingClientRect();
  const maxX = Math.max(0, pr.width - br.width - 8), maxY = Math.max(0, pr.height - br.height - 8);
  const curX = br.left - pr.left;
  let x = 0, y = 0;
  for (let t = 0; t < 12; t++) {
    x = 4 + Math.random() * maxX; y = 4 + Math.random() * maxY;
    if (Math.abs(x - curX) > br.width * 0.7) break;
  }
  btn.classList.add('moved');
  btn.style.left = Math.round(x) + 'px';
  btn.style.top = Math.round(y) + 'px';
  btn.textContent = dodges >= limit(touch) ? 'Fine. Click me.' : DODGE_TEXT[dodges];
  return true;
}
pad.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  const r = btn.getBoundingClientRect();
  const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
  const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
  if (Math.hypot(dx, dy) < 36) dodge(false);
});
btn.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse') return;
  if (dodge(true)) { suppressUntil = Date.now() + 600; e.preventDefault(); } else suppressUntil = 0;
});
btn.addEventListener('click', e => {
  if (Date.now() < suppressUntil) { e.preventDefault(); return; }
  submit();
});

/* ---------------- The black cats ---------------- */
const EYES = [['green', '#7bd389'], ['yellow', '#f2d14b'], ['orange', '#f39a3d'], ['blue', '#6cc3f0']];
const ACCESSORIES = ['hat', 'bowtie', 'monocle', 'crown', 'none'];
const TAILS = ['fluffy', 'skinny', 'long'];
const EATING = [['nibble', 'A polite nibble'], ['gobble', 'Gobbled it whole'], ['sniff', 'Suspicious sniff first'], ['play', 'Played with it first']];
const NAMES = ['Sir Crumbsalot', 'Lady Nibblesworth', 'Professor Chompington', 'Duchess Gobbleton', 'Captain Munchkins',
  'Count Paperchew', 'Madame Crinkle', 'Lord Scribblescarf', 'Sergeant Snacksalot', 'Miss Tummyrumble',
  'Admiral Napkin', 'Dame Papyrus', 'Chef Crumple', 'Little Shredward', 'Baroness Wadsworth', 'Mister Inkwhiskers',
  'The Right Honourable Fuzz', 'Archduke Nomsworth'];
let lastName = '';
function newCat() {
  let name = pick(NAMES);
  while (name === lastName) name = pick(NAMES);
  lastName = name;
  return { name, eye: pick(EYES), acc: pick(ACCESSORIES), tail: pick(TAILS), eat: pick(EATING) };
}
function catSVG(c) {
  const INK = '#4a3d57', FUR = '#211a28', E = c.eye[1];
  const tails = {
    skinny: `<path d="M148 196 C188 190 196 140 178 112" fill="none" stroke="${FUR}" stroke-width="9" stroke-linecap="round"/>`,
    fluffy: `<path d="M146 194 C190 188 200 140 178 108" fill="none" stroke="${INK}" stroke-width="30" stroke-linecap="round"/><path d="M146 194 C190 188 200 140 178 108" fill="none" stroke="${FUR}" stroke-width="24" stroke-linecap="round" stroke-dasharray="2 7"/><path d="M146 194 C190 188 200 140 178 108" fill="none" stroke="${FUR}" stroke-width="20" stroke-linecap="round"/>`,
    long: `<path d="M148 196 C214 190 214 96 186 62 C166 38 136 30 122 14" fill="none" stroke="${FUR}" stroke-width="11" stroke-linecap="round"/>`
  };
  const acc = {
    none: '',
    hat: `<g transform="rotate(14 130 40)"><ellipse cx="130" cy="44" rx="24" ry="6" fill="#8a5fd0" stroke="#2b1d2e" stroke-width="3"/><rect x="116" y="12" width="28" height="32" rx="4" fill="#8a5fd0" stroke="#2b1d2e" stroke-width="3"/><rect x="116" y="34" width="28" height="6" fill="#f2c14e"/></g>`,
    bowtie: `<g stroke="#2b1d2e" stroke-width="3" stroke-linejoin="round"><path d="M100 140 L78 128 L78 152 Z" fill="#e0476b"/><path d="M100 140 L122 128 L122 152 Z" fill="#e0476b"/><circle cx="100" cy="140" r="6" fill="#ff8fb1"/></g>`,
    monocle: `<circle cx="122" cy="82" r="17" fill="#ffffff22" stroke="#f2c14e" stroke-width="4"/><path d="M137 90 C150 110 146 130 136 146" fill="none" stroke="#f2c14e" stroke-width="2.5" stroke-dasharray="4 3"/>`,
    crown: `<path d="M72 40 L76 14 L88 28 L100 8 L112 28 L124 14 L128 40 Z" fill="#f2c14e" stroke="#2b1d2e" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="30" r="4" fill="#e0476b"/>`
  };
  return `<svg class="kitty-svg" viewBox="0 0 220 230" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g class="k-tail">${tails[c.tail]}</g>
  <ellipse cx="100" cy="182" rx="58" ry="48" fill="${FUR}" stroke="${INK}" stroke-width="4"/>
  <g class="k-head">
    <path d="M52 80 L58 22 L96 56 Z" fill="${FUR}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M148 80 L142 22 L104 56 Z" fill="${FUR}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M60 64 L63 36 L82 54 Z" fill="#7d4d6b"/><path d="M140 64 L137 36 L118 54 Z" fill="#7d4d6b"/>
    <circle cx="100" cy="88" r="52" fill="${FUR}" stroke="${INK}" stroke-width="4"/>
    <ellipse cx="78" cy="82" rx="12" ry="14" fill="${E}"/><ellipse cx="122" cy="82" rx="12" ry="14" fill="${E}"/>
    <ellipse cx="78" cy="83" rx="3.5" ry="10" fill="#0d0a10"/><ellipse cx="122" cy="83" rx="3.5" ry="10" fill="#0d0a10"/>
    <circle cx="82" cy="77" r="3" fill="#fff"/><circle cx="126" cy="77" r="3" fill="#fff"/>
    <path d="M94 102 L106 102 L100 109 Z" fill="#d98aa6"/>
    <path class="m-closed" d="M88 114 q6 7 12 0 q6 7 12 0" fill="none" stroke="#6b5878" stroke-width="3" stroke-linecap="round"/>
    <ellipse class="m-open" cx="100" cy="120" rx="13" ry="11" fill="#5a1f35" stroke="#6b5878" stroke-width="3"/>
    <path d="M70 108 L40 102 M70 114 L40 118 M130 108 L160 102 M130 114 L160 118" stroke="#6b5878" stroke-width="2.5" stroke-linecap="round"/>
    ${acc[c.acc]}
  </g>
  <ellipse class="k-paw l" cx="80" cy="224" rx="15" ry="9" fill="${FUR}" stroke="${INK}" stroke-width="3"/>
  <ellipse class="k-paw r" cx="120" cy="224" rx="15" ry="9" fill="${FUR}" stroke="${INK}" stroke-width="3"/>
</svg>`;
}

/* ---------------- The feast ---------------- */
const slot = $('catslot'), kitty = $('kitty'), catSays = $('catsays');
function abs(el) { const r = el.getBoundingClientRect(); return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height }; }
function mouthPos() {
  const r = abs(kitty.querySelector('svg'));
  return { x: r.x + r.w * (100 / 220), y: r.y + r.h * (120 / 230) };
}
function makeBall(x, y) {
  const b = document.createElement('div');
  b.className = 'ball'; b.innerHTML = '<span></span>';
  b.style.transform = `translate(${x}px,${y}px)`;
  document.body.appendChild(b);
  return b;
}
function fly(ball, from, to, ms, lift) {
  if (RM()) { ball.style.transform = `translate(${to.x}px,${to.y}px)`; return wait(10); }
  const mid = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - (lift || 120) };
  const a = ball.animate([
    { transform: `translate(${from.x}px,${from.y}px) rotate(0deg)` },
    { transform: `translate(${mid.x}px,${mid.y}px) rotate(220deg)` },
    { transform: `translate(${to.x}px,${to.y}px) rotate(400deg)` }
  ], { duration: ms, easing: 'ease-in-out', fill: 'forwards' });
  return a.finished ? a.finished.then(() => {}, () => {}) : wait(ms);
}
function catLine(text) { catSays.textContent = text; catSays.classList.remove('show'); void catSays.offsetWidth; catSays.classList.add('show'); }
function scale(ball, s) { ball.firstChild.style.transform = `scale(${s})`; }
function mouth(open) { kitty.classList.toggle('chomp', open); }

async function eat(cat, ball) {
  const k = cat.eat[0];
  if (k === 'sniff') {
    kitty.classList.add('sniff'); catLine('sniff… sniff…'); await wait(1100); kitty.classList.remove('sniff');
    mouth(true); await wait(220); scale(ball, 0.4); await wait(200);
  } else if (k === 'nibble') {
    for (const s of [0.78, 0.56, 0.34]) { mouth(true); await wait(170); scale(ball, s); mouth(false); await wait(200); }
    mouth(true); await wait(200);
  } else if (k === 'play') {
    const m = mouthPos();
    kitty.classList.add('bat');
    await fly(ball, m, { x: m.x - 50, y: m.y + 10 }, 320, 40);
    await fly(ball, { x: m.x - 50, y: m.y + 10 }, { x: m.x + 50, y: m.y + 10 }, 380, 50);
    await fly(ball, { x: m.x + 50, y: m.y + 10 }, m, 320, 40);
    kitty.classList.remove('bat'); mouth(true); await wait(200);
  } else {
    mouth(true); await wait(120);
  }
  ball.style.opacity = '0';
  mouth(false);
  kitty.classList.add('gulp');
}

async function send(data) {
  if ($('botcheck').checked) { await wait(600); return { ok: true }; }
  if (!WEB3FORMS_ACCESS_KEY) { await wait(500); return { ok: false, unplugged: true }; }
  const ctrl = window.AbortController ? new AbortController() : null;
  const timer = setTimeout(() => { if (ctrl) ctrl.abort(); }, 15000);
  const body = {
    access_key: WEB3FORMS_ACCESS_KEY,
    subject: 'New suggestion, digested by ' + data.cat.name,
    from_name: 'comicalFloof Suggestion Box',
    'What they meant': data.original,
    'What the Professor did to it': data.wrecked,
    'Misspelling style': STYLES[data.style].label,
    'Cat that ate it': data.cat.name
  };
  try {
    const r = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl ? ctrl.signal : undefined
    });
    const j = await r.json().catch(() => null);
    return { ok: !!(r.ok && j && j.success) };
  } catch (e) {
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}

async function submit() {
  if (busy) return;
  const wrecked = ta.value.trim();
  if (!wrecked) { sigh(); say('You have to suggest something. That’s the whole job.'); ta.focus(); return; }
  busy = true;
  pending = null;
  const original = originalText().trim();
  const cat = newCat();
  kitty.className = 'kitty';
  kitty.innerHTML = catSVG(cat);
  btn.disabled = true;
  ta.readOnly = true;
  say('Goodbye, sweet typo.');

  const sending = send({ original, wrecked, style, cat });

  $('stage').scrollIntoView({ behavior: RM() ? 'auto' : 'smooth', block: 'center' });
  const start = abs(ta);
  ta.classList.add('crumpled');
  await wait(RM() ? 50 : 650);
  const ball = makeBall(start.x + start.w / 2 - 18, start.y + start.h / 2 - 18);
  slot.classList.add('up');
  await wait(RM() ? 50 : 420);
  const m = mouthPos();
  const target = { x: m.x - 18, y: m.y - 18 };
  await fly(ball, { x: start.x + start.w / 2 - 18, y: start.y + start.h / 2 - 18 }, target, 900, 160);
  await eat(cat, ball);
  const res = await sending;

  if (res.ok) {
    await wait(250);
    kitty.classList.remove('gulp');
    catLine('*burp*');
    $('burp').classList.remove('show'); void $('burp').offsetWidth; $('burp').classList.add('show');
    await wait(1100);
    slot.classList.remove('up');
    ball.remove();
    await wait(400);
    showReceipt(cat);
  } else {
    kitty.classList.remove('gulp');
    kitty.classList.add('blech');
    mouth(true);
    ball.style.opacity = '1';
    scale(ball, 1);
    catLine(res.unplugged ? 'Blech. This box isn’t plugged in yet.' : 'Blech. Try again.');
    await fly(ball, target, { x: start.x + start.w / 2 - 18, y: start.y + start.h / 2 - 18 }, 800, 140);
    ball.remove();
    ta.classList.remove('crumpled');
    mouth(false);
    await wait(900);
    kitty.classList.remove('blech');
    slot.classList.remove('up');
    ta.readOnly = false;
    btn.disabled = false;
    busy = false;
    say(res.unplugged ? 'The cat refuses. Someone forgot to plug in the box.' : 'Even the cat has standards. Try again.');
  }
}

/* ---------------- Receipt and status tracker ---------------- */
let trackTimers = [];
function showReceipt(cat) {
  $('desk').hidden = true;
  $('rCat').textContent = cat.name;
  $('rEat').textContent = cat.eat[1];
  $('rStyle').textContent = STYLES[style].label;
  const steps = Array.prototype.slice.call(document.querySelectorAll('#tracker li'));
  steps.forEach(li => { li.className = ''; });
  $('receipt').hidden = false;
  $('receipt').scrollIntoView({ behavior: RM() ? 'auto' : 'smooth', block: 'start' });
  steps.forEach((li, i) => {
    trackTimers.push(setTimeout(() => {
      if (i > 0) steps[i - 1].className = 'done';
      li.className = i === steps.length - 1 ? 'done' : 'now';
    }, 500 + i * 1300));
  });
}
function reset() {
  trackTimers.forEach(clearTimeout); trackTimers = [];
  $('receipt').hidden = true;
  $('desk').hidden = false;
  ta.value = ''; ta.readOnly = false; ta.classList.remove('crumpled');
  swaps = {}; pending = null; ignored = 0; autoCount = 0; dodges = 0; wordsSince = 9;
  style = pick(Object.keys(STYLES));
  centerButton(); btn.disabled = false; busy = false;
  pose(null);
  say('Back for more? Wonderful. Type away.');
  $('desk').scrollIntoView({ behavior: RM() ? 'auto' : 'smooth', block: 'start' });
  ta.focus({ preventScroll: true });
}
$('again').addEventListener('click', reset);

say(HELLO);
})();
