/* ---------- Моди, кімнати, розрахунок. Тексти беруться зі словника T. ---------- */
const M = {
  serration: { n: 'Serration',        d: T.dmgMod(165), k: 'base', v: 1.65 },
  heavycal:  { n: 'Heavy Caliber',    d: T.dmgMod(165), k: 'base', v: 1.65 },
  hellfire:  { n: 'Hellfire',         d: '+90% Heat',        k: 'elem', t: 'Heat',        v: 0.9 },
  cryo:      { n: 'Cryo Rounds',      d: '+90% Cold',        k: 'elem', t: 'Cold',        v: 0.9 },
  storm:     { n: 'Stormbringer',     d: '+90% Electricity', k: 'elem', t: 'Electricity', v: 0.9 },
  clip:      { n: 'Infected Clip',    d: '+90% Toxin',       k: 'elem', t: 'Toxin',       v: 0.9 },
  thermite:  { n: 'Thermite Rounds',  d: '+60% Heat',        k: 'elem', t: 'Heat',        v: 0.6 },
  piercing:  { n: 'Piercing Hit',     d: '+90% Puncture',    k: 'phys', t: 'Puncture',    v: 0.9 },
  fanged:    { n: 'Fanged Fusillade', d: '+120% Slash',      k: 'phys', t: 'Slash',       v: 1.2 },
  bane:      { n: 'Bane of Grineer',  d: T.vsMod(30, 'Grineer'),  k: 'faction', v: 0.3 },
  baneInf:   { n: 'Bane of Infested', d: T.vsMod(30, 'Infested'), k: 'faction', v: 0.3 },
  pstrike:   { n: 'Point Strike',   d: T.ccMod(150), k: 'cc', v: 1.5 },
  vsense:    { n: 'Vital Sense',    d: T.cdMod(120), k: 'cd', v: 1.2 },
  cdelay:    { n: 'Critical Delay', d: T.ccMod(200) + T.frPenalty, k: 'cc', v: 2 },
  avenger:   { n: 'Arcane Avenger', d: T.flatCC(45), k: 'ccflat', v: 0.45 },
  elementalist: { n: 'Rifle Elementalist', d: T.sdMod(90), k: 'status', v: 0.9 },
  malignant: { n: 'Malignant Force', d: '+60% Toxin, ' + T.scMod(60), fx: [{ k: 'elem', t: 'Toxin', v: 0.6 }, { k: 'sc', v: 0.6 }] },
  split:     { n: 'Split Chamber', d: T.msMod(90), k: 'ms', v: 0.9 },
  aptitude:  { n: 'Galvanized Aptitude', d: T.aptitude, k: 'none' },
  vitality: { n: 'Vitality', d: T.wf.vitality, k: 'none' }, steel: { n: 'Steel Fiber', d: T.wf.steel, k: 'none' },
  redirection: { n: 'Redirection', d: T.wf.redirection, k: 'none' }, agility: { n: 'Armored Agility', d: T.wf.agility, k: 'none' },
  adaptation: { n: 'Adaptation', d: T.wf.adaptation, k: 'none' }, intensify: { n: 'Intensify', d: T.wf.intensify, k: 'none' },
  transient: { n: 'Transient Fortitude', d: T.wf.transient, k: 'none' }, overext: { n: 'Overextended', d: T.wf.overext, k: 'none' },
  fleeting: { n: 'Fleeting Expertise', d: T.wf.fleeting, k: 'none' }, streamline: { n: 'Streamline', d: T.wf.streamline, k: 'none' },
  flow: { n: 'Flow', d: T.wf.flow, k: 'none' }, continuity: { n: 'Continuity', d: T.wf.continuity, k: 'none' },
  stretch: { n: 'Stretch', d: T.wf.stretch, k: 'none' },
  primedInf: { n: 'Primed Bane of Infested', d: T.vsMod(55, 'Infested'), k: 'faction', v: 0.55 },
};

const f1 = x => {
  const r = Math.round(x * 10) / 10;
  const s = r % 1 ? r.toFixed(1) : String(r);
  return Math.abs(r) >= 10000 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : s;
};
const pct = x => (Math.round(x * 1000) / 10) + '%';
const x2 = x => String(Math.round(x * 100) / 100);
const x3 = x => String(Math.round(x * 1000) / 1000);

function rowsHit(b, h, tg) {
  const R = T.r, rows = [];
  rows.push([R.base(f1(b.weapon.base), b.baseList.join(' + ')), f1(b.modBase)]);
  for (const l of h.lines) {
    let lab;
    if (PHYS.includes(l.t)) {
      lab = `${l.t}: ${l.share === 1 ? R.all : R.share(Math.round(l.share * 100))}`;
      if (l.bonus) lab += ` × (1 + ${l.bonus})`;
    } else {
      lab = `${l.t}${l.from ? ' (' + l.from.join(' + ') + ')' : ''}: ${f1(b.modBase)} × ${x2(l.pct)}`;
    }
    rows.push([lab, f1(l.v)]);
  }
  const pre = h.lines.reduce((a, l) => a + l.v, 0);
  if (b.fac) rows.push([R.facMod(b.fac), f1(pre * (1 + b.fac))]);
  for (const l of h.lines) {
    if (l.tm !== 1) rows.push([`${l.t} × ${l.tm}: ${l.tm > 1 ? R.weak : R.res} ${FACTIONS[tg.faction].name}`, f1(l.d)]);
  }
  rows.push([R.pre, f1(h.raw), 'sum']);
  if (tg.armor) rows.push([R.armor(f1(h.armor), pct(h.dr)), f1(h.raw * (1 - h.dr))]);
  if (h.vm > 1) rows.push([R.viral(h.vm), f1(h.health)]);
  if (b.weapon.cc) {
    rows.push([R.cc(pct(b.weapon.cc), b.ccList.join(' + '), b.ccFlat ? pct(b.ccFlat) : ''), pct(b.cc)]);
    rows.push([R.cm(x2(b.weapon.cm), b.cdList.join(' + ')), '× ' + x2(b.cm)]);
    if (b.cc > 1) rows.push([R.orange(pct(b.cc - 1)), '× ' + x2(2 * b.cm - 1)]);
    rows.push([R.avg(x3(b.cc), x2(b.cm)), '× ' + x2(b.crit)]);
  }
  return rows;
}
function setup(room, i, extra) {
  const o = room.options[i];
  const tg = { ...room.enemy, st: o.st || {} };
  const b = build(room.weapon, [...room.fixed, ...(extra || o.mods || [])].map(k => M[k]));
  return { o, tg, b, h: hit(b, tg) };
}
const bare = room => {
  const tg = { ...room.enemy, st: {} };
  const b = build(room.weapon, room.fixed.map(k => M[k]));
  return { tg, b, h: hit(b, tg) };
};

function critCalc(i) {
  const { b, h, tg } = setup(this, i);
  const hell = setup(this, i, ['hellfire']).h.health;
  return {
    value: h.health, rows: rowsHit(b, h, tg),
    ctx: { cc: pct(b.cc), ccd: x3(b.cc), cm: x2(b.cm), avg: x2(b.crit), v: f1(h.health), hell: f1(hell), over: pct(Math.max(0, b.cc - 1)), orange: x2(2 * b.cm - 1) },
  };
}
const SPEC = [
  {
    id: 'dummy', scene: 'sim', better: 'high',
    enemy: { faction: 'none', sprite: 'dummy', pal: 'dummy', health: 600 },
    weapon: { base: 100, ips: { Impact: 0.4, Puncture: 0.2, Slash: 0.4 } },
    fixed: ['serration'],
    options: [{ mods: ['heavycal'] }, { mods: ['hellfire'] }, { mods: ['piercing'] }],
    calc(i) {
      const { b, h, tg } = setup(this, i), base = bare(this).h.health;
      return { value: h.health, rows: rowsHit(b, h, tg), ctx: { v: f1(h.health), base: f1(base), ratio: x2(h.health / base), mb: f1(b.modBase) } };
    },
  },
  {
    id: 'critlow', scene: 'sim', better: 'high',
    enemy: { faction: 'none', sprite: 'dummy', pal: 'dummy', health: 480 },
    weapon: { base: 100, ips: { Puncture: 1 }, cc: 0.1, cm: 2 },
    fixed: ['serration'],
    options: [{ mods: ['pstrike'] }, { mods: ['vsense'] }, { mods: ['avenger'] }],
    calc: critCalc,
  },
  {
    id: 'crithigh', scene: 'sim', better: 'high',
    enemy: { faction: 'none', sprite: 'dummy', pal: 'dummy', health: 1800 },
    weapon: { base: 100, ips: { Puncture: 1 }, cc: 0.35, cm: 3 },
    fixed: ['serration', 'pstrike'],
    options: [{ mods: ['vsense'] }, { mods: ['cdelay'] }, { mods: ['avenger'] }],
    calc: critCalc,
  },
  {
    id: 'lancer', scene: 'grineer', better: 'high',
    enemy: { faction: 'grineer', sprite: 'trooper', pal: 'grineer', armor: 300, health: 1000 },
    weapon: { base: 100, ips: { Puncture: 1 } },
    fixed: ['serration'],
    options: [{ mods: ['storm', 'clip'] }, { mods: ['cryo', 'clip'] }, { mods: ['hellfire', 'storm'] }, { mods: ['cryo', 'storm'] }],
    calc(i) {
      const { b, h, tg } = setup(this, i), el = h.lines[h.lines.length - 1];
      return { value: h.health, rows: rowsHit(b, h, tg), ctx: { a: f1(el.v), b: f1(el.d), dr: pct(h.dr), bomb: ORDER.indexOf('bombard') + 1 } };
    },
  },
  {
    id: 'crewman', scene: 'corpus', better: 'low',
    enemy: { faction: 'corpus', sprite: 'crew', pal: 'corpus', shields: 1150, health: 280 },
    weapon: { base: 60, ips: { Impact: 1 } },
    fixed: ['serration'],
    options: [{ mods: ['cryo', 'storm'] }, { mods: ['clip'] }, { mods: ['cryo', 'clip'] }],
    calc(i) {
      const { b, h, tg } = setup(this, i), k = shotsToKill(b, tg), R = T.r;
      const rows = rowsHit(b, h, tg);
      rows.push([R.toShield, f1(k.rest)]);
      rows.push([R.pastShield, f1(k.tox)]);
      rows.push([R.shieldN(f1(tg.shields)), k.broke ? R.brokeOn(k.broke) : R.left(f1(k.shieldLeft))]);
      return { value: k.shots, rows, shieldLeft: k.shieldLeft, kill: true, ctx: { broke: k.broke, tox: f1(k.tox) } };
    },
  },
  {
    id: 'bombard', scene: 'forge', better: 'high',
    enemy: { faction: 'grineer', sprite: 'trooper', pal: 'heavy', armor: 2700, health: 180 },
    weapon: { base: 100, ips: { Puncture: 1 } },
    fixed: ['serration'],
    options: [{ st: { corrosive: 10 } }, { st: { heat: true } }, { st: { viral: 10 } }],
    calc(i) {
      const { b, h, tg } = setup(this, i), base = bare(this).h.health;
      const at = (armor, st) => hit(b, { ...this.enemy, armor, st }).health;
      return {
        value: h.health, rows: rowsHit(b, h, tg),
        ctx: { arm: f1(h.armor), dr: pct(h.dr), base: f1(base), v: f1(h.health), v12: f1(at(1200, { viral: 10 })), c12: f1(at(1200, { corrosive: 10 })) },
      };
    },
  },
  {
    id: 'gunner', scene: 'forge', better: 'high',
    enemy: { faction: 'grineer', sprite: 'trooper', pal: 'heavy', armor: 2700, health: 1100 },
    weapon: { base: 100, ips: { Slash: 1 } },
    fixed: ['serration'],
    options: [{ mods: ['heavycal'] }, { mods: ['bane'] }, { mods: ['fanged'] }],
    calc(i) {
      const { b, h, tg } = setup(this, i), t = bleedTick(b, tg), t0 = bleedTick(bare(this).b, tg);
      const rows = rowsHit(b, h, tg);
      rows.push([b.fac ? T.r.bleedF(f1(b.modBase), b.fac) : T.r.bleed(f1(b.modBase)), f1(t)]);
      rows.push([T.r.six, f1(t * 6)]);
      return { value: h.health + t * 6, rows, ctx: { r: x2(t / t0), tick: f1(t) } };
    },
  },
  {
    id: 'ancient', scene: 'hive', better: 'high',
    enemy: { faction: 'infested', sprite: 'crawler', pal: 'infested', health: 7000 },
    weapon: { base: 100, ips: { Puncture: 1 } },
    fixed: ['serration', 'heavycal', 'hellfire'],
    options: [{ mods: ['thermite'] }, { mods: ['cryo'] }, { mods: ['piercing'] }],
    calc(i) {
      const { b, h, tg } = setup(this, i), t = heatTick(b, tg), bp = blastPop(b, tg);
      const rows = rowsHit(b, h, tg);
      if (t) {
        rows.push([T.r.burn(f1(b.modBase), [0.9].concat(i === 0 ? [0.6] : []).join(' + ')), f1(t)]);
        rows.push([T.r.six, f1(t * 6)]);
      } else {
        rows.push([T.r.noBurn, '0']);
        rows.push([T.r.blastPop(f1(b.modBase)), f1(bp)]);
      }
      const value = h.health + t * 6 + bp;
      const s0 = setup(this, 0), best = s0.h.health + heatTick(s0.b, s0.tg) * 6;
      return { value, rows, ctx: { hit: f1(h.health), k: f1(best / value) } };
    },
  },
  {
    id: 'element', scene: 'hive', better: 'high',
    enemy: { faction: 'infested', sprite: 'crawler', pal: 'techrot', health: 5400 },
    weapon: { base: 100, ips: { Puncture: 1 } },
    fixed: ['serration', 'hellfire'],
    options: [{ mods: ['elementalist'] }, { mods: ['thermite'] }, { mods: ['baneInf'] }],
    calc(i) {
      const { b, h, tg } = setup(this, i), t = heatTick(b, tg), t0 = heatTick(bare(this).b, tg);
      const rows = rowsHit(b, h, tg);
      rows.push([T.r.burnX(f1(b.modBase), i === 1 ? '0.9 + 0.6' : '0.9', b.fac, b.sd), f1(t)]);
      rows.push([T.r.six, f1(t * 6)]);
      return { value: h.health + t * 6, rows, ctx: { t0: f1(t0), t: f1(t), r: x2(t / t0) } };
    },
  },
  {
    id: 'lash', scene: 'hive', better: 'high',
    enemy: { faction: 'infested', sprite: 'crawler', pal: 'deimos', health: 1700 },
    weapon: { base: 100, ips: { Puncture: 1 } },
    fixed: ['serration'], xpct: 0.3, xtype: 'Toxin',
    options: [{ mods: ['heavycal'] }, { mods: ['clip'] }, { mods: ['baneInf'] }, { mods: ['cryo'] }],
    calc(i) {
      const total = s => { const x = extraHit(s.b, s.tg, this.xpct, this.xtype); return { x, sum: s.h.health + x.dealt + x.tick * 6 }; };
      const s = setup(this, i), { x, sum } = total(s);
      const x0 = extraHit(bare(this).b, s.tg, this.xpct, this.xtype);
      const rows = rowsHit(s.b, s.h, s.tg);
      rows.push([T.r.xhit('Toxic Lash', f1(x.src), this.xpct, s.b.fac), f1(x.dealt)]);
      rows.push([T.r.xtick(f1(x.raw), x.bonus, s.b.fac), f1(x.tick)]);
      rows.push([T.r.six, f1(x.tick * 6)]);
      return { value: sum, rows, ctx: { r: x2(x.dealt / x0.dealt), tr: x2(x.tick / x0.tick), primed: f1(total(setup(this, i, ['primedInf'])).sum) } };
    },
  },
  {
    id: 'weights', scene: 'sim', better: 'high',
    enemy: { faction: 'none', sprite: 'dummy', pal: 'dummy', health: 600 },
    weapon: { base: 100, ips: { Impact: 0.1, Puncture: 0.2, Slash: 0.7 }, sc: 0.3 },
    fixed: ['serration', 'cryo', 'clip'],
    options: [{ mods: ['heavycal'] }, { mods: ['fanged'] }, { mods: ['malignant'] }, { mods: ['split'] }],
    calc(i) {
      const { b, h, tg } = setup(this, i), b0 = bare(this).b, R = T.r;
      const procs = x => x.ms * x.sc * x.share('Viral') * 100;
      const rows = rowsHit(b, h, tg);
      rows.push([R.shareOf('Viral', f1(b.total * b.share('Viral')), f1(b.total)), pct(b.share('Viral'))]);
      rows.push([R.sc(pct(b.weapon.sc), b.scList.join(' + ')), pct(b.sc)]);
      if (b.ms > 1) rows.push([R.ms(b.msList.join(' + ')), '× ' + x2(b.ms)]);
      const v = procs(b);
      return {
        value: v, rows, keep: true, pop: `${f1(v)} Viral`,
        ctx: { v: f1(v), v0: f1(procs(b0)), share: pct(b.share('Viral')), share0: pct(b0.share('Viral')), sc: pct(b.sc), dr: x2(b.total / b0.total) },
      };
    },
  },
  {
    id: 'overload', scene: 'sim', better: 'high',
    enemy: { faction: 'none', sprite: 'dummy', pal: 'dummy', health: 1000 },
    weapon: { base: 100, ips: { Puncture: 1 } },
    fixed: ['serration', 'aptitude'], statuses: 3,
    options: [{ co: 'add' }, { co: 'mul' }, { co: 'none' }],
    calc(i) {
      const { b, o } = setup(this, i), R = T.r, bonus = 0.8 * this.statuses, w = b.weapon.base;
      const list = b.baseList.join(' + ');
      let value, rows;
      if (o.co === 'add') { value = w * (1 + b.baseB + bonus); rows = [[R.base(f1(w), `${list} + ${x2(bonus)}`), f1(value)]]; }
      else if (o.co === 'mul') { value = b.modBase * (1 + bonus); rows = [[R.base(f1(w), list), f1(b.modBase)], [R.coMul(x2(bonus)), f1(value)]]; }
      else { value = b.modBase; rows = [[R.base(f1(w), list), f1(b.modBase)], [R.coNone, f1(value)]]; }
      return { value, rows, ctx: { v: f1(value), mb: f1(b.modBase), bonus: x2(bonus) } };
    },
  },
  {
    id: 'corrupted', scene: 'tower', better: 'high',
    enemy: { faction: 'orokin', sprite: 'trooper', pal: 'orokin', armor: 2700, health: 2600 },
    weapon: { base: 100, ips: { Slash: 1 } },
    fixed: ['serration'],
    options: [{ st: { viral: 10 } }, { st: { corrosive: 10 } }, { st: { radiation: 10 } }],
    calc(i) {
      const { b, h, tg } = setup(this, i), t = bleedTick(b, tg), h0 = bare(this).h.health;
      const rows = rowsHit(b, h, tg);
      rows.push([h.vm > 1 ? T.r.bleedViral(f1(b.modBase), h.vm) : T.r.bleed(f1(b.modBase)), f1(t)]);
      rows.push([T.r.six, f1(t * 6)]);
      return { value: h.health + t * 6, rows, ctx: { h0: f1(h0), h1: f1(h.health), ticks: f1(t * 6) } };
    },
  },
  {
    id: 'murmur', scene: 'murmur', better: 'high',
    enemy: { faction: 'murmur', sprite: 'wisp', pal: 'murmur', health: 1300 },
    weapon: { base: 100, ips: { Puncture: 1 } },
    fixed: ['serration'],
    options: [{ mods: ['storm', 'clip', 'hellfire'] }, { mods: ['hellfire', 'storm', 'clip'] }, { mods: ['clip', 'hellfire', 'storm'] }],
    calc(i) {
      const { b, h, tg } = setup(this, i);
      return { value: h.health, rows: rowsHit(b, h, tg), ctx: {} };
    },
  },
  {
    id: 'vitality', scene: 'forge', better: 'high',
    enemy: { faction: 'none', sprite: 'trooper', pal: 'heavy', health: 500, armor: 300, shields: 300 },
    fixed: [],
    options: [{ mods: ['vitality'] }, { mods: ['steel'] }, { mods: ['redirection'] }],
    calc(i) {
      const e = this.enemy, R = T.r;
      const k = [{ H: 2, A: 1, S: 1 }, { H: 1, A: 2, S: 1 }, { H: 1, A: 1, S: 2 }][i];
      const H = e.health * k.H, A = e.armor * k.A, S = e.shields * k.S;
      const hp = H * (1 + A / 300), sh = S / 0.5, base = e.health * (1 + e.armor / 300) + e.shields / 0.5;
      return {
        value: hp + sh, rows: [[R.ehpH(f1(H), f1(A)), f1(hp)], [R.ehpS(f1(S)), f1(sh)]], keep: true, pop: `+${f1(hp + sh - base)}`,
        ctx: { H: f1(H), hp: f1(hp), sh: f1(sh), gain: f1(hp + sh - base), gain2: f1(2 * e.health * e.armor / 300), base: f1(base) },
      };
    },
  },
  {
    id: 'layers', scene: 'forge', better: 'low',
    enemy: { faction: 'none', sprite: 'trooper', pal: 'heavy', health: 1000, armor: 900 },
    fixed: ['vitality', 'steel'], hitDmg: 1000, baseArmor: 450,
    options: [{ mods: ['agility'] }, { mods: ['adaptation'] }, { dr: 0.5 }],
    calc(i) {
      const R = T.r, D = this.hitDmg;
      const armor = i === 0 ? this.baseArmor * 2.4 : this.enemy.armor;
      const pass = 300 / (300 + armor), extra = i === 1 ? 0.9 : i === 2 ? 0.5 : 0, v = D * pass * (1 - extra);
      const rows = [[R.wfArmor(f1(armor)), pct(1 - pass)], [R.afterArmor(f1(D), pct(1 - pass)), f1(D * pass)]];
      if (extra) rows.push([R.layer(pct(extra)), f1(v)]);
      return { value: v, rows, keep: true, pop: `−${f1(v)}`, ctx: { v: f1(v), armor: f1(armor), dr: pct(1 - pass), before: f1(D * 300 / (300 + this.enemy.armor)), total: pct(1 - v / D) } };
    },
  },
  {
    id: 'threshold', scene: 'forge', better: 'high',
    enemy: { faction: 'grineer', sprite: 'trooper', pal: 'heavy', armor: 2700, health: 300 },
    fixed: [], shot: 265, stripBase: 0.7,
    options: [{ mods: ['intensify'], str: 0.3 }, { mods: ['transient'], str: 0.55 }, { mods: ['overext'], str: -0.6 }],
    calc(i) {
      const o = this.options[i], R = T.r, str = 1 + o.str, strip = Math.min(1, this.stripBase * str);
      const armor = this.enemy.armor * (1 - strip), dr = armorDR(armor), v = this.shot * (1 - dr);
      const rows = [[R.strength(o.str), pct(str)], [R.strip(pct(this.stripBase), x2(str)), pct(strip)], [R.armorLeft(this.enemy.armor, x2(strip)), f1(armor)], [R.armor(f1(armor), pct(dr)), f1(v)]];
      return { value: v, rows, ctx: { dr: pct(dr), strip: pct(strip), v: f1(v), need: Math.ceil(100 / this.stripBase) + '%', str: pct(str) } };
    },
  },
  {
    id: 'efficiency', scene: 'sim', better: 'high',
    enemy: { faction: 'none', sprite: 'dummy', pal: 'dummy', health: 600 },
    fixed: ['fleeting'], energy: 200, cost: 100,
    options: [{ mods: ['streamline'] }, { mods: ['flow'] }, { mods: ['continuity'] }],
    calc(i) {
      const R = T.r, eff = 1.6 + (i === 0 ? 0.3 : 0), mult = Math.max(2 - eff, 0.25);
      const energy = this.energy * (i === 1 ? 2 : 1), cost = this.cost * mult, casts = Math.floor(energy / cost + 1e-9);
      const dur = 0.4 + (i === 2 ? 0.3 : 0);
      const rows = [[R.eff(i === 0 ? '100% + 60% + 30%' : '100% + 60%'), pct(eff)], [R.cost(this.cost, pct(eff)), f1(cost)], [R.energy, f1(energy)], [R.duration, pct(dur)]];
      return { value: casts, rows, keep: true, pop: R.casts(casts), ctx: { casts, eff: pct(eff), cost: f1(cost), energy: f1(energy), dur: pct(dur) } };
    },
  },
  {
    id: 'range', scene: 'hive', better: 'high',
    enemy: { faction: 'none', sprite: 'crawler', pal: 'infested', health: 600 },
    fixed: [], radius: 10,
    options: [{ mods: ['stretch'], rng: 0.45, str: 0 }, { mods: ['overext'], rng: 0.9, str: -0.6 }, { mods: ['intensify'], rng: 0, str: 0.3 }],
    calc(i) {
      const o = this.options[i], R = T.r, rr = 1 + o.rng, area = rr * rr, str = 1 + o.str, v = area * str;
      const rows = [[R.radius(this.radius, x2(rr)), f1(this.radius * rr) + R.m], [R.area(x2(rr)), '× ' + x2(area)], [R.strengthPlain, pct(str)]];
      return { value: v, rows, keep: true, pop: `× ${x2(v)}`, ctx: { area: x2(area), v: x2(v) } };
    },
  },
];
const ORDER = ['dummy', 'critlow', 'crithigh', 'lancer', 'murmur', 'crewman', 'bombard', 'gunner', 'ancient', 'element', 'lash', 'weights', 'overload', 'corrupted', 'vitality', 'layers', 'threshold', 'efficiency', 'range'];
const CH = { dummy: 0, critlow: 0, crithigh: 0, lancer: 1, murmur: 1, crewman: 1, bombard: 1, gunner: 2, ancient: 2, element: 2, lash: 2, weights: 3, overload: 3, corrupted: 3, vitality: 4, layers: 4, threshold: 5, efficiency: 5, range: 5 };
const ROOMS = ORDER.map(id => SPEC.find(s => s.id === id)).map(s => {
  const t = T.rooms[s.id];
  return {
    ...s, ch: CH[s.id], kit: t.kit, place: t.place, title: t.title, intro: t.intro, hint: t.hint, ask: t.ask,
    enemy: { ...s.enemy, name: t.enemy }, weapon: { ...s.weapon, desc: t.desc },
    metric: { label: t.metric, better: s.better },
    options: s.options.map((o, i) => ({ ...o, ...((t.opts || [])[i] || {}) })),
    calc(i) { const c = s.calc.call(this, i); c.say = t.say[i](c.ctx); return c; },
  };
});
const _best = {};
function bestIndex(room) {
  if (room.id in _best) return _best[room.id];
  const vals = room.options.map((_, i) => room.calc(i).value);
  const pick = room.metric.better === 'low' ? Math.min(...vals) : Math.max(...vals);
  return (_best[room.id] = vals.indexOf(pick));
}
if (typeof module !== 'undefined') module.exports = { ROOMS, M, bestIndex };
