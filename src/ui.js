/* ---------- Інтерфейс ---------- */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const view = $('#view'), U = T.ui;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const KEY = 'klyaksa.v5';
  const TYPES = ['Impact', 'Puncture', 'Slash', 'Heat', 'Cold', 'Electricity', 'Toxin', 'Blast', 'Corrosive', 'Gas', 'Magnetic', 'Radiation', 'Viral', 'Void'];
  let state = { view: 'run', room: 0, reached: 0, tried: {}, first: {}, last: {}, arena: { streak: 0, best: 0, q: null, mode: 'weak', c: { streak: 0, best: 0, q: null } }, sb: { w: 0, mods: [], fac: 'grineer', armor: 300, viral: false, cor: false, T: 10 } };
  try { document.documentElement.lang = T.lang; } catch (e) { /* ignore */ }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ room: state.room, reached: state.reached, tried: state.tried, first: state.first, last: state.last, best: state.arena.best, cbest: state.arena.c.best, amode: state.arena.mode, sb: state.sb }));
    } catch (e) { /* без сховища теж працює */ }
  }
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!d) return;
      state.room = Math.min(Math.max(0, d.room | 0), ROOMS.length);
      state.reached = Math.min(Math.max(0, d.reached | 0), ROOMS.length);
      state.tried = d.tried || {}; state.first = d.first || {}; state.last = d.last || {};
      state.arena.best = d.best | 0; state.arena.c.best = d.cbest | 0; state.arena.mode = d.amode === 'combo' ? 'combo' : 'weak';
      const s = d.sb;
      if (s && Array.isArray(s.mods)) state.sb = {
        w: SBW[s.w] ? s.w : 0, mods: s.mods.filter(id => SBM[id]).slice(0, SLOTS),
        fac: s.fac === 'none' || LOOK[s.fac] ? s.fac : 'grineer', armor: ARMORS.includes(s.armor) ? s.armor : 300, viral: !!s.viral, cor: !!s.cor, T: WINDOWS.includes(s.T) ? s.T : 10,
      };
    } catch (e) { /* ignore */ }
  }

  /* ---------- Піксельна сцена ---------- */
  const HALF = {
    dummy:   ['.....111', '....1111', '....1111', '.....111', '......22', '..111111', '.1111111', '.11.1133', '.11.1131', '....1133', '....1111', '.....111', '......22', '......22', '....2222', '...22222'],
    trooper: ['.....111', '....1111', '....1441', '....1121', '.2231111', '22211111', '22.21111', '22.21131', '22.21111', '.3..1222', '....1111', '...111..', '...111..', '...121..', '...222..', '..2222..'],
    crew:    ['...11111', '...13333', '...13443', '...13333', '...11111', '.....222', '...11111', '..111131', '..1.1111', '..1.1111', '..3.1222', '....1111', '....11..', '....11..', '....11..', '...222..'],
    crawler: ['........', '........', '..3.....', '..1....3', '..13..11', '...11111', '..111111', '.1114111', '11111111', '11.11221', '1..11111', '1..1.111', '3..1..11', '...1....', '..11....', '..3.....'],
    wisp:    ['......1.', '..1...11', '..11..11', '..11.111', '..111111', '...11111', '...11441', '...11441', '...12111', '....1111', '....1211', '.....111', '.....11.', '......1.', '......3.', '........'],
    shard:   ['.......1', '......11', '1.....11', '11...111', '.11.1111', '..111441', '...11441', '..111111', '.11.1211', '11...111', '1....111', '......11', '.....1.1', '....1..1', '...3....', '........'],
  };
  const SPR = {};
  for (const k in HALF) SPR[k] = HALF[k].map(r => r + [...r].reverse().join(''));
  const BLOB = ['....########....', '..############..', '.#hh###########.', '.#h############.', '################', '################', '################', '################', '################', '.##############.', '.##############.', '..###.####.###..', '...#...##...#...'];
  const INK = '#0d0920', INK_HI = '#6a5acd', EYE = '#f7f4ff';
  const PAL = {
    dummy:    { 1: '#cfc8ae', 2: '#857f66', 3: '#e0503c', 4: '#e0503c' },
    grineer:  { 1: '#b3b272', 2: '#66643a', 3: '#e2dcab', 4: '#ff7a3c' },
    heavy:    { 1: '#c05a40', 2: '#742f22', 3: '#eba478', 4: '#ffd24a' },
    kuva:     { 1: '#a8323c', 2: '#5e1820', 3: '#e88a8a', 4: '#ffcf5a' },
    scaldra:  { 1: '#7f8c98', 2: '#454f5a', 3: '#c9d4dc', 4: '#ff5a3c' },
    corpus:   { 1: '#74b6dc', 2: '#2f5c84', 3: '#dcf2ff', 4: '#ffe36a' },
    amalgam:  { 1: '#8fa0b8', 2: '#465066', 3: '#e0e8f4', 4: '#5affd0' },
    anarchs:  { 1: '#d88a4a', 2: '#7a4420', 3: '#ffd2a0', 4: '#5ad0ff' },
    infested: { 1: '#b56c8e', 2: '#6c3652', 3: '#eaa4ac', 4: '#f5e37a' },
    deimos:   { 1: '#d8904a', 2: '#84482a', 3: '#ffc890', 4: '#8affc0' },
    techrot:  { 1: '#7fcb6e', 2: '#3b6c36', 3: '#c8f0b8', 4: '#ff4a9a' },
    orokin:   { 1: '#ecd382', 2: '#9c7c30', 3: '#fff6cc', 4: '#ff5a5a' },
    narmer:   { 1: '#d8c9a0', 2: '#7c6a44', 3: '#ffffff', 4: '#5ad8ff' },
    murmur:   { 1: '#cdc5b6', 2: '#7a736c', 3: '#ffffff', 4: '#8a4cff' },
    zariman:  { 1: '#e8e4f8', 2: '#8a84b0', 3: '#ffffff', 4: '#5affea' },
    sentient: { 1: '#5fd2c2', 2: '#2b7c7a', 3: '#ccfff2', 4: '#ff6ad0' },
  };
  const SCENES = {
    sim:     { wall: '#3d4a7c', band: '#55649c', floor: '#272c52', edge: '#6d7cb8', deco: '#8fa0e0' },
    grineer: { wall: '#4f4a40', band: '#6a6252', floor: '#2e2a24', edge: '#857a62', deco: '#c06a3a' },
    corpus:  { wall: '#3c5c78', band: '#4f7696', floor: '#243c50', edge: '#74a4c8', deco: '#ffe36a' },
    forge:   { wall: '#6a4a3c', band: '#855e4a', floor: '#3a2820', edge: '#a4765a', deco: '#ffb24a' },
    hive:    { wall: '#5a4a5c', band: '#73607a', floor: '#352a38', edge: '#8e7496', deco: '#b5e06a' },
    tower:   { wall: '#8a7a50', band: '#a8966a', floor: '#4a4028', edge: '#d0bc84', deco: '#fff6cc' },
    murmur:  { wall: '#3c2c50', band: '#52406c', floor: '#201830', edge: '#70589a', deco: '#b08aff' },
  };
  const LOOK = {
    grineer: ['trooper', 'grineer', 'grineer'], kuva: ['trooper', 'kuva', 'forge'], corpus: ['crew', 'corpus', 'corpus'],
    amalgam: ['crew', 'amalgam', 'corpus'], infested: ['crawler', 'infested', 'hive'], deimos: ['crawler', 'deimos', 'hive'],
    orokin: ['trooper', 'orokin', 'tower'], sentient: ['shard', 'sentient', 'sim'], narmer: ['trooper', 'narmer', 'tower'],
    murmur: ['wisp', 'murmur', 'murmur'], zariman: ['wisp', 'zariman', 'sim'], scaldra: ['trooper', 'scaldra', 'forge'],
    techrot: ['crawler', 'techrot', 'hive'], anarchs: ['crew', 'anarchs', 'forge'],
  };
  const sc = { scene: 'sim', sprite: 'dummy', pal: 'dummy', mood: 'idle', hitAt: -1e9, dead: false, talkUntil: 0 };

  function px(c, rows, x, y, s, pal, white) {
    for (let ry = 0; ry < rows.length; ry++) {
      const row = rows[ry];
      for (let cx = 0; cx < row.length; cx++) {
        const ch = row[cx];
        if (ch === '.') continue;
        c.fillStyle = white ? '#ffffff' : pal[ch];
        c.fillRect(x + cx * s, y + ry * s, s, s);
      }
    }
  }
  function drawBlob(c, x, y, s, t, mood, talking) {
    px(c, BLOB, x, y, s, { '#': INK, h: INK_HI });
    const R = (cx, ry, w, h) => c.fillRect(x + cx * s, y + ry * s, w * s, h * s);
    const blink = !reduce && t > 0 && (t % 3600) < 140;
    for (const cx of [4, 9]) {
      c.fillStyle = EYE;
      if (mood === 'happy') { R(cx, 5, 1, 1); R(cx + 1, 4, 1, 1); R(cx + 2, 5, 1, 1); }
      else if (blink) R(cx, 6, 3, 1);
      else if (mood === 'sad') { R(cx, 5, 3, 3); c.fillStyle = INK; R(cx, 6, 2, 2); }
      else { R(cx, 4, 3, 4); c.fillStyle = INK; R(cx + 1, 5, 2, 2); }
    }
    if (mood === 'happy') { c.fillStyle = EYE; R(7, 9, 2, 1); }
    else if (talking) { c.fillStyle = INK_HI; R(7, 9, 2, 1); }
    else if (mood === 'sad') { c.fillStyle = INK_HI; R(7, 10, 2, 1); }
  }
  function draw(t) {
    const cv = document.getElementById('scene');
    if (!cv) return;
    const c = cv.getContext('2d'), W = 200, H = 84, F = 66, s = SCENES[sc.scene];
    c.fillStyle = s.wall; c.fillRect(0, 0, W, F);
    c.fillStyle = s.band; c.fillRect(0, 14, W, 3); c.fillRect(0, F - 9, W, 2);
    for (let x = 19; x < W; x += 40) c.fillRect(x, 17, 2, F - 26);
    c.fillStyle = s.deco;
    for (let i = 0; i < 9; i++) c.fillRect((i * 47 + 9) % W, 4 + (i * 5) % 8, 2, 2);
    c.fillStyle = s.floor; c.fillRect(0, F, W, H - F);
    c.fillStyle = s.edge; c.fillRect(0, F, W, 2);
    c.fillStyle = 'rgba(0,0,0,.38)'; c.fillRect(17, F + 5, 42, 3); c.fillRect(141, F + 5, 42, 3);
    const beat = reduce ? 0 : Math.floor(t / 450) % 2;
    const since = t - sc.hitAt, flash = !reduce && since < 320;
    const ex = 138 + (flash ? (Math.floor(since / 60) % 2 ? 2 : -2) : 0);
    const ey = F - 48 + (reduce ? 0 : Math.floor(t / 700) % 2);
    c.globalAlpha = sc.dead ? 0.28 : 1;
    px(c, SPR[sc.sprite], ex, ey, 3, PAL[sc.pal], flash);
    c.globalAlpha = 1;
    drawBlob(c, 14, F - 39 - beat, 3, t, sc.mood, t < sc.talkUntil && beat);
  }
  function loop(t) { draw(t); requestAnimationFrame(loop); }
  function setScene(o) { Object.assign(sc, { dead: false, mood: 'idle' }, o); if (reduce) draw(1); }
  function faces() {
    document.querySelectorAll('canvas.face').forEach(cv => {
      const c = cv.getContext('2d'); c.clearRect(0, 0, 16, 13);
      drawBlob(c, 0, 0, 1, 0, cv.dataset.mood, false);
    });
  }

  /* ---------- Дрібні помічники ---------- */
  const ty = t => `<span class="ty" data-t="${t}">${t}</span>`;
  const tyList = a => a.length ? a.map(ty).join(' ') : U.none;
  const fmtMetric = (r, v) => f1(v);
  let typing = null;
  function typeTo(el, text) {
    if (typing) { clearInterval(typing); typing = null; }
    if (reduce) { el.textContent = text; return; }
    el.innerHTML = '<span class="on"></span><span class="off"></span>';
    const on = el.firstChild, off = el.lastChild;
    let i = 0; off.textContent = text;
    sc.talkUntil = performance.now() + text.length * 16;
    const done = () => { clearInterval(typing); typing = null; el.textContent = text; sc.talkUntil = 0; };
    typing = setInterval(() => { i += 2; on.textContent = text.slice(0, i); off.textContent = text.slice(i); if (i >= text.length) done(); }, 32);
    el.parentElement.addEventListener('click', () => { if (typing) done(); }, { once: true });
  }
  const bar = (lab, v, max, cls) => `<div class="bar ${cls}"><span class="b-l">${lab}</span><span class="b-t"><i style="width:${Math.max(0, v / max * 100)}%"></i></span><span class="b-v">${f1(v)} / ${f1(max)}</span></div>`;
  function targetHTML(r, c) {
    const e = r.enemy;
    const hp = c && !c.keep ? (c.kill ? 0 : Math.max(0, e.health - c.value)) : e.health;
    const sh = e.shields ? (c && c.shieldLeft !== undefined ? c.shieldLeft : e.shields) : 0;
    return `<div class="t-name"><strong>${e.name}</strong>${e.faction !== 'none' ? `<span class="chip">${FACTIONS[e.faction].name}</span>` : ''}${e.armor ? `<span class="chip arm">${U.armor} ${e.armor}</span>` : ''}</div>
      ${e.shields ? bar(U.shield, sh, e.shields, 'sh') : ''}${bar(U.health, hp, e.health, e.armor ? 'ar' : 'hp')}`;
  }
  function pipsHTML() {
    const pip = (r, i) => {
      const done = (state.tried[r.id] || []).includes(bestIndex(r));
      const star = state.first[r.id] === bestIndex(r);
      const cls = [i === state.room ? 'cur' : '', done ? 'done' : '', star ? 'star' : ''].join(' ');
      return `<li><button type="button" class="pip ${cls}" data-room="${i}" ${i <= state.reached ? '' : 'disabled'} aria-label="${U.pip(i + 1, star, done)}" ${i === state.room ? 'aria-current="step"' : ''}>${star ? '★' : i + 1}</button></li>`;
    };
    return `<ol class="pips" aria-label="${U.roomsLabel}">${T.chapters.map((name, c) =>
      `<li class="chap"><span class="lab">${name}</span><ol>${ROOMS.map((r, i) => r.ch === c ? pip(r, i) : '').join('')}</ol></li>`).join('')}</ol>`;
  }
  const optName = o => o.title || o.mods.map(k => M[k].n).join(' + ');

  /* ---------- Похід ---------- */
  function optsHTML(r) {
    const tried = state.tried[r.id] || [], best = bestIndex(r);
    return r.options.map((o, i) => {
      const sub = o.sub || o.mods.map(k => M[k].d).join(', ');
      const was = tried.includes(i);
      return `<button type="button" class="btn opt${was ? ' was' : ''}${was && i === best ? ' best' : ''}" data-i="${i}" aria-pressed="${state.last[r.id] === i}">
        <span class="o-t">${optName(o)}</span><span class="o-s">${sub}</span>${was ? `<span class="o-v">${fmtMetric(r, r.calc(i).value)}${i === best ? ' ✓' : ''}</span>` : ''}</button>`;
    }).join('');
  }
  function resultHTML(r, i) {
    const c = r.calc(i), best = bestIndex(r), ok = i === best, f = FACTIONS[r.enemy.faction];
    const tried = state.tried[r.id] || [];
    const max = Math.max(...tried.map(k => r.calc(k).value));
    const cmp = r.options.map((o, k) => {
      if (!tried.includes(k)) return `<div class="c-row un"><span class="c-n">${optName(o)}</span><span class="c-b"></span><span class="c-v">${U.notYet}</span></div>`;
      const v = r.calc(k).value;
      return `<div class="c-row${k === best ? ' best' : ''}${k === i ? ' now' : ''}"><span class="c-n">${optName(o)}</span><span class="c-b"><i style="width:${v / max * 100}%"></i></span><span class="c-v">${fmtMetric(r, v)}</span></div>`;
    }).join('');
    return `
      <div class="res-head">
        <div><p class="lab">${r.metric.label}</p><p class="big">${fmtMetric(r, c.value)}</p></div>
        <p class="verdict ${ok ? 'good' : 'bad'}">${ok ? U.best : U.better}</p>
      </div>
      <div class="say"><canvas class="face" width="16" height="13" data-mood="${ok ? 'happy' : 'sad'}" aria-hidden="true"></canvas><p>${c.say}</p></div>
      <h4 class="lab">${U.how}</h4>
      <div class="tbl"><table class="how"><tbody>${c.rows.map(([a, b, k]) => `<tr class="${k || ''}"><td>${a}</td><td>${b}</td></tr>`).join('')}
        <tr class="total"><td>${r.metric.label}</td><td>${fmtMetric(r, c.value)}</td></tr></tbody></table></div>
      ${r.enemy.faction === 'none' ? '' : `<p class="weak"><span class="lab">${f.name}</span><span>+50%: ${tyList(f.plus)}</span><span>−50%: ${tyList(f.minus)}</span></p>`}
      <h4 class="lab">${U.tries}${r.metric.better === 'low' ? U.lowBetter : ''}</h4>
      <div class="cmp">${cmp}</div>`;
  }
  function paint(r, animated) {
    const i = state.last[r.id], has = i !== undefined, best = bestIndex(r);
    $('#opts').innerHTML = optsHTML(r);
    const res = $('#result');
    res.hidden = !has;
    const c = has ? r.calc(i) : null;
    if (has) res.innerHTML = resultHTML(r, i);
    $('#target').innerHTML = targetHTML(r, c);
    $('.pips').outerHTML = pipsHTML();
    const nx = $('#next');
    nx.textContent = state.room === ROOMS.length - 1 ? U.toEnd : U.next;
    nx.classList.toggle('go', (state.tried[r.id] || []).includes(best));
    faces();
    if (has) {
      sc.mood = i === best ? 'happy' : 'sad';
      sc.dead = !c.keep && (c.kill || r.enemy.health - c.value <= 0);
      if (animated) {
        sc.hitAt = performance.now();
        const d = $('#dmg');
        d.textContent = c.pop || (r.metric.better === 'low' ? `${c.value} ${U.shots}` : `−${f1(c.value)}`);
        d.classList.remove('pop'); void d.offsetWidth; d.classList.add('pop');
        res.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
      }
      if (reduce) draw(1);
    }
  }
  function renderRun() {
    const r = ROOMS[state.room];
    if (!r) return renderEnd();
    const e = r.enemy;
    view.innerHTML = `
      <section class="run">
        ${pipsHTML()}
        <header class="room-head"><p class="eyebrow">${U.room(state.room + 1, ROOMS.length, r.place)}</p><h2>${r.title}</h2></header>
        <p class="narr">${r.intro}</p>
        <div class="stage"><canvas id="scene" width="200" height="84" role="img" aria-label="${U.sceneAlt(e.name)}"></canvas><div class="dmg" id="dmg" aria-hidden="true"></div></div>
        <div class="target" id="target"></div>
        <div class="bubble"><p class="who">${T.blob}</p><p class="line" id="hint"></p></div>
        <div class="kit">
          <div class="kit-row"><span class="lab">${r.kit || U.weapon}</span><span>${r.weapon.desc}</span></div>
          ${r.fixed.length ? `<div class="kit-row"><span class="lab">${U.fitted}</span><span class="chips">${r.fixed.map(k => `<span class="mod">${M[k].n} <i>${M[k].d}</i></span>`).join('')}</span></div>` : ''}
        </div>
        <h3 class="ask">${r.ask}</h3>
        <div class="opts" id="opts"></div>
        <div class="result" id="result" hidden></div>
        <div class="nav"><button type="button" class="btn next" id="next">${U.next}</button></div>
      </section>`;
    setScene({ scene: r.scene, sprite: e.sprite, pal: e.pal });
    paint(r, false);
    typeTo($('#hint'), r.hint);
  }
  function pick(i) {
    const r = ROOMS[state.room];
    const tried = state.tried[r.id] || (state.tried[r.id] = []);
    if (state.first[r.id] === undefined) state.first[r.id] = i;
    if (!tried.includes(i)) tried.push(i);
    state.last[r.id] = i;
    save(); paint(r, true);
  }
  function goRoom(n) {
    state.room = n; state.reached = Math.max(state.reached, Math.min(n, ROOMS.length));
    save(); renderRun(); window.scrollTo({ top: 0, behavior: 'auto' });
  }
  function renderEnd() {
    const stars = ROOMS.filter(r => state.first[r.id] === bestIndex(r)).length;
    const line = stars === ROOMS.length ? U.endAll : stars >= ROOMS.length * 0.6 ? U.endGood : U.endLow;
    view.innerHTML = `
      <section class="run end">
        ${pipsHTML()}
        <header class="room-head"><p class="eyebrow">${U.endEyebrow}</p><h2>${U.endTitle(stars, ROOMS.length)}</h2></header>
        <div class="stage"><canvas id="scene" width="200" height="84" role="img" aria-label="${U.endAlt}"></canvas></div>
        <div class="bubble"><p class="who">${T.blob}</p><p class="line" id="hint"></p></div>
        <h3 class="ask">${U.takeaways}</h3>
        <ul class="rules">${U.rules.map(x => `<li>${x}</li>`).join('')}</ul>
        <p class="narr">${U.outside}</p>
        <div class="nav two"><button type="button" class="btn" id="again">${U.again}</button><button type="button" class="btn go" id="toArena">${U.toArena}</button></div>
      </section>`;
    setScene({ scene: 'sim', sprite: 'dummy', pal: 'dummy', mood: 'happy' });
    typeTo($('#hint'), line);
  }

  /* ---------- Арена ---------- */
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function newQ() {
    const ids = Object.keys(LOOK).filter(k => !state.arena.q || k !== state.arena.q.fid);
    const fid = ids[Math.floor(Math.random() * ids.length)], f = FACTIONS[fid];
    const correct = f.plus[Math.floor(Math.random() * f.plus.length)];
    const wrong = shuffle(TYPES.filter(t => !f.plus.includes(t))).slice(0, 3);
    state.arena.q = { fid, correct, opts: shuffle([correct, ...wrong]), ans: null };
  }
  const modesHTML = () => `<div class="seg two">${U.arenaModes.map((n, i) => { const m = i ? 'combo' : 'weak'; return `<button type="button" class="btn" data-am="${m}" aria-pressed="${state.arena.mode === m}">${n}</button>`; }).join('')}</div>`;
  function renderArena() {
    if (state.arena.mode === 'combo') return renderCombo();
    if (!state.arena.q) newQ();
    const q = state.arena.q, f = FACTIONS[q.fid], a = state.arena, done = q.ans !== null, ok = q.ans === q.correct;
    view.innerHTML = `
      <section class="run arena">
        ${modesHTML()}
        <header class="room-head"><p class="eyebrow">${U.arenaEyebrow(a.streak, a.best)}</p><h2>${f.name}</h2></header>
        <div class="stage"><canvas id="scene" width="200" height="84" role="img" aria-label="${U.arenaAlt(f.name)}"></canvas></div>
        <h3 class="ask">${U.arenaAsk}</h3>
        <div class="opts four">${q.opts.map(t => `<button type="button" class="btn opt${done && t === q.correct ? ' best' : ''}${done && t === q.ans && !ok ? ' wrong' : ''}" data-t="${t}" ${done ? 'disabled' : ''}>${ty(t)}</button>`).join('')}</div>
        <div class="result" ${done ? '' : 'hidden'}>
          <div class="res-head"><p class="verdict ${ok ? 'good' : 'bad'}">${ok ? U.hit : U.miss(q.correct)}</p></div>
          <div class="say"><canvas class="face" width="16" height="13" data-mood="${ok ? 'happy' : 'sad'}" aria-hidden="true"></canvas><p>${T.tip[q.fid]}</p></div>
          <p class="weak"><span class="lab">${f.name}</span><span>+50%: ${tyList(f.plus)}</span><span>−50%: ${tyList(f.minus)}</span></p>
        </div>
        <div class="nav"><button type="button" class="btn go" id="nextQ" ${done ? '' : 'hidden'}>${U.nextEnemy}</button></div>
      </section>`;
    const [sprite, pal, scene] = LOOK[q.fid];
    setScene({ scene, sprite, pal, mood: done ? (ok ? 'happy' : 'sad') : 'idle' });
    faces();
  }
  function answer(t) {
    const a = state.arena, q = a.q;
    if (q.ans !== null) return;
    q.ans = t;
    if (t === q.correct) { a.streak++; a.best = Math.max(a.best, a.streak); } else a.streak = 0;
    save(); renderArena();
    if (t === q.correct) sc.hitAt = performance.now();
    const n = $('#nextQ'); if (n) n.focus();
  }

  /* Комбінації стихій: сума пари, склад комбінації, порядок слотів. */
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const ELS = ['Heat', 'Cold', 'Electricity', 'Toxin'];
  const PAIRS = ELS.flatMap((a, i) => ELS.slice(i + 1).map(b => [a, b]));
  const comboOf = (a, b) => COMBO[[a, b].sort().join('+')];
  const tyPlus = key => key.split('+').map(ty).join(' + ');
  function newCQ() {
    const prev = state.arena.c.q;
    let q;
    do {
      const kind = rnd(['sum', 'sum', 'parts', 'order']);
      if (kind === 'sum') {
        const p = shuffle(rnd(PAIRS).slice()), correct = comboOf(...p);
        q = { kind, ask: p, correct, combos: [correct], opts: shuffle([correct, ...shuffle(Object.values(COMBO).filter(c => c !== correct)).slice(0, 3)]) };
      } else if (kind === 'parts') {
        const p = rnd(PAIRS), c = comboOf(...p);
        q = { kind, ask: [c], correct: p.join('+'), combos: [c], opts: shuffle([p, ...shuffle(PAIRS.filter(x => x !== p)).slice(0, 3)]).map(x => x.join('+')) };
      } else {
        const e = shuffle(ELS.slice()).slice(0, rnd([3, 4]));
        const ways = e.length === 3 ? [[[0, 1], [2]], [[0, 2], [1]], [[1, 2], [0]]] : [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]];
        const res = ways.map(w => w.map(g => (g.length === 2 ? comboOf(e[g[0]], e[g[1]]) : e[g[0]])));
        q = { kind, ask: e, correct: res[0].join('+'), combos: res[0].filter(t => !ELS.includes(t)), opts: shuffle(res.map(r => r.join('+'))) };
      }
      q.ans = null;
    } while (prev && prev.kind === q.kind && prev.ask.join() === q.ask.join());
    state.arena.c.q = q;
  }
  function comboWeakHTML(c) {
    const ids = Object.keys(LOOK), names = k => ids.filter(id => FACTIONS[id][k].includes(c)).map(id => FACTIONS[id].name).join(', ') || U.none;
    return `<p class="weak"><span class="lab">${ty(c)}</span><span>+50%: ${names('plus')}</span><span>−50%: ${names('minus')}</span></p>`;
  }
  function renderCombo() {
    const a = state.arena.c;
    if (!a.q) newCQ();
    const q = a.q, done = q.ans !== null, ok = q.ans === q.correct;
    const head = q.kind === 'order' ? q.ask.map((t, i) => `<span class="slotn">${i + 1}</span>${ty(t)}`).join(' ') : q.ask.map(ty).join(' + ');
    view.innerHTML = `
      <section class="run arena combo">
        ${modesHTML()}
        <header class="room-head"><p class="eyebrow">${U.comboEyebrow(a.streak, a.best)}</p><h2 class="chain">${head}</h2></header>
        <div class="stage"><canvas id="scene" width="200" height="84" role="img" aria-label="${U.comboAlt}"></canvas></div>
        <h3 class="ask">${U.comboAsk[q.kind]}</h3>
        <div class="opts ${q.kind === 'sum' ? 'four' : 'wide'}">${q.opts.map(o => `<button type="button" class="btn opt${done && o === q.correct ? ' best' : ''}${done && o === q.ans && !ok ? ' wrong' : ''}" data-c="${o}" ${done ? 'disabled' : ''}>${tyPlus(o)}</button>`).join('')}</div>
        <div class="result" ${done ? '' : 'hidden'}>
          <div class="res-head"><p class="verdict ${ok ? 'good' : 'bad'}">${ok ? U.hit : U.miss(q.correct.split('+').join(' + '))}</p></div>
          <div class="say"><canvas class="face" width="16" height="13" data-mood="${ok ? 'happy' : 'sad'}" aria-hidden="true"></canvas><p>${q.kind === 'order' ? U.comboOrderTip : T.ctip[q.combos[0]]}</p></div>
          ${q.combos.map(comboWeakHTML).join('')}
        </div>
        <div class="nav"><button type="button" class="btn go" id="nextQ" ${done ? '' : 'hidden'}>${U.nextCombo}</button></div>
      </section>`;
    setScene({ scene: 'sim', sprite: 'dummy', pal: 'dummy', mood: done ? (ok ? 'happy' : 'sad') : 'idle' });
    faces();
  }
  function answerC(o) {
    const a = state.arena.c, q = a.q;
    if (q.ans !== null) return;
    q.ans = o;
    if (o === q.correct) { a.streak++; a.best = Math.max(a.best, a.streak); } else a.streak = 0;
    save(); renderCombo();
    if (o === q.correct) sc.hitAt = performance.now();
    const n = $('#nextQ'); if (n) n.focus();
  }

  /* ---------- Шпаргалка ---------- */
  function renderSheet() {
    const S = T.sheet;
    const combos = [['Heat', 'Cold', 'Blast'], ['Electricity', 'Toxin', 'Corrosive'], ['Heat', 'Toxin', 'Gas'], ['Cold', 'Electricity', 'Magnetic'], ['Heat', 'Electricity', 'Radiation'], ['Cold', 'Toxin', 'Viral']];
    view.innerHTML = `
      <section class="sheet">
        <header class="room-head"><p class="eyebrow">${S.eyebrow}</p><h2>${S.title}</h2></header>
        <h3 class="ask">${S.hFactions}</h3>
        <div class="tbl"><table class="fx"><thead><tr><th>${S.thFaction}</th><th>+50%</th><th>−50%</th></tr></thead><tbody>
          ${Object.keys(LOOK).map(k => `<tr><td>${FACTIONS[k].name}</td><td>${tyList(FACTIONS[k].plus)}</td><td>${FACTIONS[k].minus.length ? tyList(FACTIONS[k].minus) : `<span class="none">${U.none}</span>`}</td></tr>`).join('')}
        </tbody></table></div>
        <h3 class="ask">${S.hOrder}</h3>
        <div class="tbl"><pre class="formula">${S.formula}</pre></div>
        <p class="narr">${S.orderNote}</p>
        <h3 class="ask">${S.hCrit}</h3>
        <div class="tbl"><pre class="formula">${S.critFormula}</pre></div>
        <p class="narr">${S.critNote}</p>
        <h3 class="ask">${S.hProc}</h3>
        <div class="tbl"><pre class="formula">${S.procFormula}</pre></div>
        <p class="narr">${S.procNote}</p>
        <h3 class="ask">${S.hExtra}</h3>
        <p class="narr">${S.extraIntro}</p>
        <div class="tbl"><pre class="formula">${S.extraFormula}</pre></div>
        <p class="narr">${S.extraNote}</p>
        <div class="tbl"><table class="fx xh"><thead><tr><th>${S.thSource}</th><th>${S.thHit}</th><th>${S.thNote}</th></tr></thead><tbody>
          ${S.extra.map(([a, b, c]) => `<tr><td>${a}</td><td>${b}</td><td>${c}</td></tr>`).join('')}
        </tbody></table></div>
        <p class="narr small">${S.extraFoot}</p>
        <h3 class="ask">${S.hDef}</h3>
        <div class="tbl"><pre class="formula">${S.defFormula}</pre></div>
        <p class="narr">${S.defNote}</p>
        <h3 class="ask">${S.hAb}</h3>
        <div class="tbl"><pre class="formula">${S.abFormula}</pre></div>
        <p class="narr">${S.abNote}</p>
        <h3 class="ask">${S.hCombos}</h3>
        <ul class="combos">${combos.map(([a, b, c]) => `<li>${ty(a)} + ${ty(b)} = ${ty(c)}</li>`).join('')}</ul>
        <p class="narr">${S.comboNote}</p>
        <h3 class="ask">${S.hStatus}</h3>
        <dl class="status">${S.status.map(([t, d]) => `<div><dt>${ty(t)}</dt><dd>${d}</dd></div>`).join('')}</dl>
      </section>`;
  }

  /* ---------- Пісочниця: вигадані моди, чесні купи ---------- */
  const SLOTS = 8;
  const SBM = {
    base:  { pile: 'base', k: 'base', v: 1.65, like: 'Serration' },
    heat:  { pile: 'elem', k: 'elem', t: 'Heat', v: 0.9, like: 'Hellfire' },
    cold:  { pile: 'elem', k: 'elem', t: 'Cold', v: 0.9, like: 'Cryo Rounds' },
    elec:  { pile: 'elem', k: 'elem', t: 'Electricity', v: 0.9, like: 'Stormbringer' },
    tox:   { pile: 'elem', k: 'elem', t: 'Toxin', v: 0.9, like: 'Infected Clip' },
    imp:   { pile: 'elem', k: 'phys', t: 'Impact', v: 1.2 },
    pun:   { pile: 'elem', k: 'phys', t: 'Puncture', v: 1.2 },
    sla:   { pile: 'elem', k: 'phys', t: 'Slash', v: 1.2, like: 'Fanged Fusillade' },
    fac30: { pile: 'fac', k: 'faction', v: 0.3, like: 'Bane' },
    fac55: { pile: 'fac', k: 'faction', v: 0.55, like: 'Primed Bane' },
    cc:    { pile: 'crit', k: 'cc', v: 1.5, like: 'Point Strike' },
    cd:    { pile: 'crit', k: 'cd', v: 1.2, like: 'Vital Sense' },
    ms:    { pile: 'ms', k: 'ms', v: 0.9, like: 'Split Chamber' },
    sc:    { pile: 'st', k: 'sc', v: 0.9 },
    sd:    { pile: 'st', k: 'status', v: 0.9, like: 'Rifle Elementalist' },
    fr:    { pile: 'rate', k: 'fr', v: 0.6, like: 'Speed Trigger' },
    mag:   { pile: 'rate', k: 'mag', v: 0.3, like: 'Magazine Warp' },
    rl:    { pile: 'rate', k: 'rl', v: 0.3, like: 'Fast Hands' },
  };
  const SBO = Object.keys(SBM), PILES = ['base', 'elem', 'fac', 'crit', 'ms', 'st', 'rate'], WINDOWS = [5, 10, 30];
  const SBW = [
    { base: 100, ips: { Impact: 0.34, Puncture: 0.33, Slash: 0.33 }, cc: 0.2, cm: 2, sc: 0.2, ms: 1, fr: 8, mag: 60, rl: 2 },
    { base: 100, ips: { Impact: 0.1, Puncture: 0.7, Slash: 0.2 }, cc: 0.35, cm: 3, sc: 0.1, ms: 1, fr: 2.5, mag: 20, rl: 2.5 },
    { base: 100, ips: { Impact: 0.1, Puncture: 0.2, Slash: 0.7 }, cc: 0.1, cm: 2, sc: 0.35, ms: 1, fr: 12, mag: 100, rl: 2 },
  ];
  const ARMORS = [0, 300, 1200, 2700];
  const sbName = id => T.sb.mod[id];
  const fN = v => (Math.abs(v) >= 1000 ? f1(Math.round(v)) : f1(v));
  const pl = p => `<span class="pl" data-p="${p}"></span>`;

  function sbCalc(s, mods) {
    const none = s.fac === 'none';
    const list = (mods || s.mods).map(id => (none && SBM[id].k === 'faction' ? { k: 'none' } : SBM[id]));
    const b = build(SBW[s.w], list);
    const tg = { faction: s.fac, armor: s.armor, st: { viral: s.viral ? 10 : 0, corrosive: s.cor ? 10 : 0 } };
    const h = hit(b, tg), w = SBW[s.w], add = k => list.filter(m => m.k === k).map(m => m.v), sum = a => a.reduce((x, y) => x + y, 0);
    const lists = { fr: add('fr'), mag: add('mag'), rl: add('rl') };
    const rate = { fr: w.fr * (1 + sum(lists.fr)), mag: Math.round(w.mag * (1 + sum(lists.mag))), reload: w.rl / (1 + sum(lists.rl)) };
    return { b, tg, h, shot: h.health * b.ms, rate, lists, T: s.T, win: windowDamage(b, tg, rate, s.T) };
  }
  function sbRemarks(s, c) {
    const S = T.sb.say, b = c.b, f = FACTIONS[s.fac], none = s.fac === 'none', out = [];
    if (!s.mods.length) return [{ t: S.empty, mood: 'idle' }];
    const has = k => s.mods.some(id => SBM[id].k === k);
    const direct = id => !(none && SBM[id].k === 'faction');
    if (none && has('faction')) out.push({ t: S.noFaction, mood: 'sad' });
    const res = c.h.lines.filter(l => l.tm < 1 && l.v / b.total >= 0.15).sort((x, y) => y.v - x.v)[0];
    if (res) out.push({ t: S.resist(res.t, f.name, pct(res.v / b.total)), mood: 'sad' });
    /* Найслабший слот: що буде без нього і що буде, якщо поставити на його місце найкращу заміну. */
    let weak = null;
    s.mods.forEach((id, i) => {
      if (!direct(id)) return;
      const without = sbCalc(s, s.mods.filter((_, k) => k !== i)).win.total, gain = c.win.total / without;
      if (!weak || gain < weak.gain) weak = { i, id, gain, without };
    });
    if (weak && weak.gain < 0.995) out.push({ t: S.hurts(sbName(weak.id), x2(weak.gain)), mood: 'sad' });
    else if (weak) {
      let best = null;
      for (const id of SBO) {
        if (id === weak.id || !direct(id)) continue;
        const shot = sbCalc(s, s.mods.map((x, k) => (k === weak.i ? id : x))).win.total;
        if (!best || shot > best.shot) best = { id, shot };
      }
      if (best && best.shot / c.win.total >= 1.1) {
        const p = SBM[weak.id].pile, n = s.mods.filter(id => SBM[id].pile === p).length;
        const a = [sbName(weak.id), x2(weak.gain), sbName(best.id), x2(best.shot / weak.without)];
        const stacked = n > 1 && ['base', 'elem', 'fac', 'ms'].includes(p) && !(p === 'elem' && c.h.lines.some(l => l.tm < 1));
        out.push({ t: stacked ? S.swapPile(...a, T.sb.piles[p], n) : S.swap(...a), mood: 'idle' });
      }
    }
    if (has('cd') && !has('cc') && b.cc < 0.3) out.push({ t: S.critNoChance(pct(b.cc)), mood: 'idle' });
    const dots = ['Slash', 'Heat', 'Toxin', 'Electricity', 'Gas', 'Blast'];
    const dotShare = b.parts.filter(p => dots.includes(p.t)).reduce((a, p) => a + p.v, 0) / b.total;
    if (has('status') && dotShare * b.sc * b.ms < 0.05) out.push({ t: S.sdNoDot, mood: 'idle' });
    const can = f.plus.filter(t => t !== 'Void');
    if (!none && can.length && !c.h.lines.some(l => l.tm > 1)) out.push({ t: S.unused(f.name, can.join(', ')), mood: 'idle' });
    if (c.h.dr >= 0.5 && !s.cor) out.push({ t: S.armor(pct(c.h.dr)), mood: 'idle' });
    if (c.win.total && c.win.dot / c.win.total >= 0.5) out.push({ t: S.dotShare(pct(c.win.dot / c.win.total), c.T), mood: 'idle' });
    if (c.rate.reload / c.win.cycle >= 0.35) out.push({ t: S.reload(pct(c.rate.reload / c.win.cycle)), mood: 'idle' });
    if (!out.length) return [{ t: weak && s.mods.length < SLOTS ? S.goodMore : S.good, mood: 'happy' }];
    return out.slice(0, 2);
  }
  function sbPiles(s, c) {
    const R = T.sb.rows, b = c.b, h = c.h, sum = a => a.reduce((x, y) => x + y, 0);
    const plus = a => ['1'].concat(a).join(' + ');
    const elemTerms = b.comb.map(e => x2(e.v)).concat(b.parts.filter(p => p.share && p.bonus).map(p => `${x2(p.share)} × ${x2(p.bonus)}`));
    const facList = s.fac === 'none' ? [] : s.mods.filter(id => SBM[id].k === 'faction').map(id => x2(SBM[id].v));
    const weak = h.raw / (b.total * (1 + b.fac));
    const typed = h.lines.filter(l => l.tm !== 1).map(l => `${l.t} ×${l.tm}`);
    const rows = [
      ['base', R.base, plus(b.baseList.map(x2)), 1 + b.baseB],
      ['elem', R.elem, plus(elemTerms), b.total / b.modBase],
      ['fac', R.fac, plus(facList), 1 + b.fac],
      ['', R.weak, typed.length ? typed.join(', ') : R.noWeak, weak],
      ['', R.armor(f1(h.armor)), h.dr ? `1 − ${pct(h.dr)}` : R.noArmor, 1 - h.dr],
      ['', R.viral, h.vm > 1 ? R.viralOn : R.viralOff, h.vm],
      ['crit', R.crit, `1 + ${x3(b.cc)} × (${x2(b.cm)} − 1)`, b.crit],
      ['ms', R.ms, plus(b.msList.map(x2)), b.ms],
    ];
    return `<div class="tbl"><table class="how piles"><tbody>
      <tr><td>${R.start}</td><td>${f1(b.weapon.base)}</td></tr>
      ${rows.map(([p, lab, f, m]) => `<tr class="${Math.abs(m - 1) < 1e-9 ? 'off' : ''}"><td>${p ? pl(p) : ''}<b>${lab}</b><span class="f">${f}</span></td><td>×${x2(m)}</td></tr>`).join('')}
      <tr class="total"><td>${T.sb.shot}</td><td>${f1(c.shot)}</td></tr></tbody></table></div>`;
  }
  function sbTime(c) {
    const R = T.sb.time, w = SBW[state.sb.w], r = c.rate, win = c.win;
    const fm = (base, op, a) => (a.length ? `${base} ${op} (${['1'].concat(a.map(x2)).join(' + ')})` : R.noMods);
    const row = (lab, f, v, cls, p) => `<tr class="${cls || ''}"><td>${p || ''}<b>${lab}</b>${f ? `<span class="f">${f}</span>` : ''}</td><td>${v}</td></tr>`;
    const off = a => (a.length ? '' : 'off');
    return `<div class="tbl"><table class="how piles time"><tbody>
      ${row(R.fr, fm(x2(w.fr), '×', c.lists.fr), R.perSec(x2(r.fr)), off(c.lists.fr), pl('rate'))}
      ${row(R.mag, fm(w.mag, '×', c.lists.mag), r.mag, off(c.lists.mag), pl('rate'))}
      ${row(R.reload, fm(x2(w.rl), '÷', c.lists.rl), R.sec(x2(r.reload)), off(c.lists.rl), pl('rate'))}
      ${row(R.shots(c.T), R.cycle(r.mag, x2(r.fr), x2(r.reload), x2(win.cycle)), win.N)}
      ${row(R.direct, `${win.N} × ${f1(win.shot)}`, fN(win.direct))}
      ${win.dots.map(x => row(`${ty(x.t)} ${x.t === 'Blast' ? R.pops : R.ticks}`, R.dotF(f1(x.procs), x2(x.avg), f1(x.tick)) + (x.upper !== null && x.upper > x.low * 1.005 ? ` ${R.heatRange(fN(x.low), fN(x.upper))}` : ''), fN(x.dmg))).join('')}
      <tr class="sum"><td>${R.total(c.T)}</td><td>${fN(win.total)}</td></tr>
      <tr class="total"><td>${R.dps}</td><td>${fN(win.dps)}</td></tr></tbody></table></div>`;
  }
  function sbParts(c) {
    const S = T.sb, b = c.b;
    return `<ul class="parts">${c.h.lines.map(l => {
      const share = l.v / b.total, procs = b.ms * b.sc * share * 100, tick = dotTick(b, c.tg, l.t);
      const tm = l.tm > 1 ? '<span class="tm up">×1.5</span>' : l.tm < 1 ? '<span class="tm down">×0.5</span>' : '';
      return `<li class="part"><div class="p-h">${ty(l.t)}<span>${S.share(pct(share))}</span>${tm}</div>
        <div class="p-s">${S.procs(f1(procs))} · ${tick === null ? S.fx[l.t] : S.tick(f1(tick))}</div></li>`;
    }).join('')}</ul>`;
  }
  function paintSandbox(animated) {
    const S = T.sb, s = state.sb, c = sbCalc(s);
    const bare = sbCalc(s, []).shot, rem = sbRemarks(s, c), full = s.mods.length >= SLOTS;
    $('#sb-sum').innerHTML = `<div><p class="lab">${S.shot}</p><p class="big">${f1(c.shot)}</p></div><div class="sum-r"><p class="mult">${S.vsBare(x2(c.shot / bare))}</p><p class="dps">${S.dps(fN(c.win.dps), c.T)}</p><button type="button" class="link" id="sb-why">${rem[0].mood === 'happy' ? S.whyGood : S.why(rem.length)}</button></div>`;
    $('#sb-count').textContent = S.hSlots(s.mods.length, SLOTS);
    $('#sb-slots').innerHTML = Array.from({ length: SLOTS }, (_, i) => {
      const id = s.mods[i];
      return id ? `<li><button type="button" class="btn slot" data-sb-rm="${i}" aria-label="${S.remove(sbName(id))}">${pl(SBM[id].pile)}<span>${sbName(id)}</span><span class="x" aria-hidden="true">×</span></button></li>`
        : `<li class="slot empty"><span>${i + 1}</span></li>`;
    }).join('');
    document.querySelectorAll('[data-sb-add]').forEach(b => { b.disabled = full; });
    document.querySelectorAll('[data-sb-w]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.sbW === s.w));
    document.querySelectorAll('[data-sb-t]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.sbT === s.T));
    $('#sb-wdesc').textContent = S.weapons[s.w][1];
    $('#sb-out').innerHTML = `
      ${rem.map(r => `<div class="say"><canvas class="face" width="16" height="13" data-mood="${r.mood}" aria-hidden="true"></canvas><p>${r.t}</p></div>`).join('')}
      <h4 class="lab">${S.hPiles}</h4>${sbPiles(s, c)}
      <h4 class="lab">${S.hParts}</h4>${sbParts(c)}
      <p class="narr small">${S.partsNote}</p>
      <h4 class="lab">${S.hTime(c.T)}</h4>${sbTime(c)}
      <p class="narr small">${S.timeNote}</p>`;
    const look = LOOK[s.fac] || ['dummy', 'dummy', 'sim'];
    setScene({ sprite: look[0], pal: look[1], scene: look[2], mood: rem[0].mood });
    faces();
    if (animated) {
      sc.hitAt = performance.now();
      const d = $('#dmg');
      d.textContent = `−${f1(c.shot)}`;
      d.classList.remove('pop'); void d.offsetWidth; d.classList.add('pop');
    }
    if (reduce) draw(1);
  }
  function renderSandbox() {
    const S = T.sb, s = state.sb, opt = (v, t, cur) => `<option value="${v}"${v === cur ? ' selected' : ''}>${t}</option>`;
    view.innerHTML = `
      <section class="run sandbox">
        <header class="room-head"><p class="eyebrow">${S.eyebrow}</p><h2>${S.title}</h2></header>
        <p class="narr">${S.intro}</p>
        <div class="stage"><canvas id="scene" width="200" height="84" role="img" aria-label="${S.alt}"></canvas><div class="dmg" id="dmg" aria-hidden="true"></div></div>
        <div class="sb-sum" id="sb-sum" aria-live="polite"></div>
        <fieldset><legend class="lab">${S.hWeapon}</legend>
          <div class="seg">${S.weapons.map(([n], i) => `<button type="button" class="btn" data-sb-w="${i}">${n}</button>`).join('')}</div>
          <p class="w-desc" id="sb-wdesc"></p>
        </fieldset>
        <fieldset><legend class="lab">${S.hEnemy}</legend>
          <div class="fields">
            <label>${S.faction}<select id="sb-fac">${opt('none', S.dummy, s.fac)}${Object.keys(LOOK).map(k => opt(k, FACTIONS[k].name, s.fac)).join('')}</select></label>
            <label>${S.armor}<select id="sb-armor">${ARMORS.map(a => opt(a, a ? a : S.noArmor, s.armor)).join('')}</select></label>
            <label class="chk"><input type="checkbox" id="sb-viral"${s.viral ? ' checked' : ''}>${S.viral}</label>
            <label class="chk"><input type="checkbox" id="sb-cor"${s.cor ? ' checked' : ''}>${S.corrosive}</label>
          </div>
        </fieldset>
        <fieldset><legend class="lab">${S.hWindow}</legend>
          <div class="seg">${WINDOWS.map(n => `<button type="button" class="btn" data-sb-t="${n}">${S.time.sec(n)}</button>`).join('')}</div>
        </fieldset>
        <div class="sb-head"><h3 class="lab" id="sb-count"></h3><button type="button" class="btn small" id="sb-clear">${S.clear}</button></div>
        <ol class="slots" id="sb-slots"></ol>
        <div class="palette">${PILES.map(p => `<div class="pal-g"><h3 class="lab">${pl(p)}${S.piles[p]}</h3><div class="pal">${
          SBO.filter(id => SBM[id].pile === p).map(id => `<button type="button" class="btn" data-sb-add="${id}"><span class="o-t">${sbName(id)}</span><span class="o-s">${SBM[id].like ? S.like(SBM[id].like) : S.theory}</span></button>`).join('')}</div></div>`).join('')}</div>
        <div class="result" id="sb-out"></div>
      </section>`;
    paintSandbox(false);
  }
  function sbAct(fn) { fn(state.sb); save(); paintSandbox(true); }
  document.addEventListener('change', ev => {
    const t = ev.target, s = state.sb;
    if (t.id === 'sb-fac') sbAct(() => { s.fac = t.value; });
    else if (t.id === 'sb-armor') sbAct(() => { s.armor = +t.value; });
    else if (t.id === 'sb-viral') sbAct(() => { s.viral = t.checked; });
    else if (t.id === 'sb-cor') sbAct(() => { s.cor = t.checked; });
  });

  /* ---------- Каркас ---------- */
  function render() {
    document.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected', b.dataset.view === state.view));
    if (state.view === 'arena') renderArena();
    else if (state.view === 'sheet') renderSheet();
    else if (state.view === 'sandbox') renderSandbox();
    else renderRun();
    faces();
  }
  document.addEventListener('click', ev => {
    const b = ev.target.closest('button');
    if (!b) return;
    if (b.classList.contains('tab')) { state.view = b.dataset.view; render(); }
    else if (b.classList.contains('pip')) goRoom(+b.dataset.room);
    else if (b.id === 'next') goRoom(state.room + 1);
    else if (b.id === 'again') { state.tried = {}; state.first = {}; state.last = {}; state.reached = 0; goRoom(0); }
    else if (b.id === 'toArena') { state.view = 'arena'; render(); window.scrollTo({ top: 0 }); }
    else if (b.id === 'nextQ') { if (state.arena.mode === 'combo') newCQ(); else newQ(); renderArena(); }
    else if (b.dataset.am) { state.arena.mode = b.dataset.am; save(); renderArena(); const cur = $(`[data-am="${b.dataset.am}"]`); if (cur) cur.focus(); }
    else if (b.dataset.c && b.closest('.arena')) answerC(b.dataset.c);
    else if (b.dataset.sbAdd) { if (state.sb.mods.length < SLOTS) sbAct(s => { s.mods.push(b.dataset.sbAdd); }); }
    else if (b.dataset.sbRm !== undefined) {
      const i = +b.dataset.sbRm;
      sbAct(s => { s.mods.splice(i, 1); });
      const left = document.querySelectorAll('#sb-slots button');
      (left[Math.min(i, left.length - 1)] || $('[data-sb-add]')).focus();
    }
    else if (b.dataset.sbW !== undefined) sbAct(s => { s.w = +b.dataset.sbW; });
    else if (b.dataset.sbT !== undefined) sbAct(s => { s.T = +b.dataset.sbT; });
    else if (b.id === 'sb-clear') sbAct(s => { s.mods = []; });
    else if (b.id === 'sb-why') $('#sb-out').scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    else if (b.dataset.i !== undefined && b.closest('#opts')) pick(+b.dataset.i);
    else if (b.dataset.t && b.closest('.arena')) answer(b.dataset.t);
  });

  const start = d => {
    load();
    if (d && d.state) Object.assign(state, d.state);
    const h = (location.hash || '').replace('#', '');
    if (['arena', 'sheet', 'sandbox'].includes(h)) state.view = h;
    render();
    if (!reduce) requestAnimationFrame(loop);
  };
  start({});
})();
