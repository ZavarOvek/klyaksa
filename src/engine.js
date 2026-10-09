/* ---------- Рушій розрахунку. Правила після Update 36 (Jade Shadows). ---------- */
const FACTIONS = {
  none:     { name: 'Без фракції',     plus: [],                          minus: [] },
  grineer:  { name: 'Grineer',         plus: ['Impact', 'Corrosive'],     minus: [] },
  kuva:     { name: 'Kuva Grineer',    plus: ['Impact', 'Corrosive'],     minus: ['Heat'] },
  corpus:   { name: 'Corpus',          plus: ['Puncture', 'Magnetic'],    minus: [] },
  amalgam:  { name: 'Corpus Amalgam',  plus: ['Electricity', 'Magnetic'], minus: ['Blast'] },
  infested: { name: 'Infested',        plus: ['Slash', 'Heat'],           minus: [] },
  deimos:   { name: 'Infested Deimos', plus: ['Blast', 'Gas'],            minus: ['Viral'] },
  orokin:   { name: 'Orokin',          plus: ['Puncture', 'Viral'],       minus: ['Radiation'] },
  sentient: { name: 'Sentient',        plus: ['Cold', 'Radiation'],       minus: ['Corrosive'] },
  narmer:   { name: 'Narmer',          plus: ['Slash', 'Toxin'],          minus: ['Magnetic'] },
  murmur:   { name: 'The Murmur',      plus: ['Electricity', 'Radiation'],minus: ['Viral'] },
  zariman:  { name: 'Zariman',         plus: ['Void'],                    minus: [] },
  scaldra:  { name: 'Scaldra',         plus: ['Impact', 'Corrosive'],     minus: ['Gas'] },
  techrot:  { name: 'Techrot',         plus: ['Gas', 'Magnetic'],         minus: ['Cold'] },
  anarchs:  { name: 'Anarchs',         plus: ['Impact', 'Electricity'],   minus: ['Radiation'] },
};
const COMBO = {
  'Cold+Heat': 'Blast', 'Electricity+Toxin': 'Corrosive', 'Heat+Toxin': 'Gas',
  'Cold+Electricity': 'Magnetic', 'Electricity+Heat': 'Radiation', 'Cold+Toxin': 'Viral',
};
const PHYS = ['Impact', 'Puncture', 'Slash'];

function typeMod(fid, type) {
  const f = FACTIONS[fid];
  return f.plus.includes(type) ? 1.5 : f.minus.includes(type) ? 0.5 : 1;
}
function armorDR(a) {
  if (a <= 0) return 0;
  return a <= 2700 ? 0.9 * Math.sqrt(a / 2700) : a / (a + 300);
}
function corrosiveStrip(n) { return n > 0 ? Math.min(0.8, 0.26 + 0.06 * (n - 1)) : 0; }
function viralMult(n) { return n > 0 ? 1 + Math.min(3.25, 1 + 0.25 * (n - 1)) : 1; }

/* Стихії зливаються попарно в порядку слотів: 1+2, 3+4. Непарна лишається сама. */
function combine(elems) {
  const order = [], sum = {};
  for (const e of elems) {
    if (!(e.el in sum)) { order.push(e.el); sum[e.el] = 0; }
    sum[e.el] += e.v;
  }
  const out = [];
  for (let i = 0; i < order.length; i += 2) {
    const a = order[i], b = order[i + 1];
    if (b) out.push({ el: COMBO[[a, b].sort().join('+')], v: sum[a] + sum[b], from: [a, b] });
    else out.push({ el: a, v: sum[a] });
  }
  return out;
}

function build(weapon, mods) {
  let baseB = 0, fac = 0, ccFlat = 0, sd = 0;
  const scList = [], msList = [], ccList = [], cdList = [], baseList = [], phys = { Impact: 0, Puncture: 0, Slash: 0 }, elems = [], prim = {};
  for (const m of mods.flatMap(x => x.fx || [x])) {
    if (m.k === 'base') { baseB += m.v; baseList.push(m.v); }
    else if (m.k === 'faction') fac += m.v;
    else if (m.k === 'cc') ccList.push(m.v);
    else if (m.k === 'cd') cdList.push(m.v);
    else if (m.k === 'ccflat') ccFlat += m.v;
    else if (m.k === 'status') sd += m.v;
    else if (m.k === 'sc') scList.push(m.v);
    else if (m.k === 'ms') msList.push(m.v);
    else if (m.k === 'phys') phys[m.t] += m.v;
    else if (m.k === 'elem') { elems.push({ el: m.t, v: m.v }); prim[m.t] = (prim[m.t] || 0) + m.v; }
  }
  const modBase = weapon.base * (1 + baseB);
  const parts = [];
  for (const t of PHYS) {
    const s = weapon.ips[t] || 0;
    if (s > 0) parts.push({ t, share: s, bonus: phys[t], v: modBase * s * (1 + phys[t]) });
  }
  const comb = combine(elems);
  for (const c of comb) parts.push({ t: c.el, pct: c.v, from: c.from, v: modBase * c.v });
  /* Крит: шанс = база × (1 + Σ моди) + плоскі бонуси; множник = база × (1 + Σ моди); у середньому 1 + шанс × (множник − 1). */
  const sum = a => a.reduce((x, y) => x + y, 0);
  const cc = (weapon.cc || 0) * (1 + sum(ccList)) + ccFlat, cm = (weapon.cm || 1) * (1 + sum(cdList));
  const crit = 1 + cc * (cm - 1);
  /* Шанс статусу і мультишот: база × (1 + Σ моди). Тип прока вибирається за часткою шкоди. */
  const sc = (weapon.sc || 0) * (1 + sum(scList)), ms = (weapon.ms || 1) * (1 + sum(msList));
  const total = parts.reduce((a, p) => a + p.v, 0);
  const share = t => parts.filter(p => p.t === t).reduce((a, p) => a + p.v, 0) / total;
  return { sc, ms, scList, msList, total, share, weapon, modBase, baseB, baseList, fac, parts, comb, prim, cc, cm, crit, ccList, cdList, ccFlat, sd, has: t => comb.some(c => c.el === t) };
}

function effArmor(tg) {
  const st = tg.st || {};
  return (tg.armor || 0) * (1 - corrosiveStrip(st.corrosive || 0)) * (st.heat ? 0.5 : 1);
}
function hit(b, tg) {
  const st = tg.st || {};
  const dr = armorDR(effArmor(tg)), vm = viralMult(st.viral || 0);
  let raw = 0; const lines = [];
  for (const p of b.parts) {
    const tm = typeMod(tg.faction, p.t), d = p.v * (1 + b.fac) * tm;
    raw += d; lines.push({ ...p, tm, d });
  }
  return { raw, dr, vm, lines, armor: effArmor(tg), health: raw * (1 - dr) * vm * b.crit };
}
/* DoT. Фракційний бонус входить двічі: у модовану базу і ще раз у тік. */
function bleedTick(b, tg) {
  return 0.35 * b.modBase * (1 + b.fac) ** 2 * (1 + b.sd) * viralMult((tg.st || {}).viral || 0);
}
function heatTick(b, tg) {
  if (!b.has('Heat')) return 0;
  return 0.5 * b.modBase * (1 + (b.prim.Heat || 0)) * (1 + b.fac) ** 2 * (1 + b.sd)
    * typeMod(tg.faction, 'Heat') * (1 - armorDR(effArmor(tg))) * viralMult((tg.st || {}).viral || 0);
}
function blastPop(b, tg) {
  if (!b.has('Blast')) return 0;
  return 0.3 * b.modBase * (1 + b.fac) ** 2 * (1 + b.sd)
    * typeMod(tg.faction, 'Blast') * (1 - armorDR(effArmor(tg))) * viralMult((tg.st || {}).viral || 0);
}
/* Тік або вибух статусу будь-якого типу. Toxin та Electricity множаться своїми модами, Gas і Blast модами половинок не множаться. */
function dotTick(b, tg, t) {
  if (t === 'Slash') return bleedTick(b, tg);
  const def = typeMod(tg.faction, t) * (1 - armorDR(effArmor(tg))) * viralMult((tg.st || {}).viral || 0);
  const f = (1 + b.fac) ** 2 * (1 + b.sd);
  if (['Heat', 'Toxin', 'Electricity'].includes(t)) return 0.5 * b.modBase * (1 + (b.prim[t] || 0)) * f * def;
  if (t === 'Gas') return 0.5 * b.modBase * f * def;
  if (t === 'Blast') return 0.3 * b.modBase * f * def;
  return null;
}
/* Час. Між пострілами 1 / скорострільність, після магазину ще перезарядка (цикл = магазин / скорострільність + перезарядка). */
function shotTimes(fr, mag, reload, T) {
  const out = [], cycle = mag / fr + reload;
  for (let c = 0; c < 1e5; c++) {
    for (let i = 0; i < mag; i++) {
      const t = c * cycle + i / fr;
      if (t >= T - 1e-9) return out;
      out.push(t);
    }
  }
  return out;
}
/* Коли тікає прок, рахуючи від влучання (за вікі). Gas узято як Toxin, затримка Blast 1.5 с. */
const TICK_AT = { Slash: [1, 2, 3, 4, 5, 6], Heat: [1, 2, 3, 4, 5, 6], Toxin: [1, 2, 3, 4, 5, 6], Gas: [1, 2, 3, 4, 5, 6], Electricity: [0, 1, 2, 3, 4, 5], Blast: [1.5] };
/* Шкода за вікно T секунд у середньому: проки рахуються дробами, тік множиться на середній крит.
   Heat: новий прок оновлює тривалість усіх стаків. low = без оновлення (6 тіків на стак), upper = стаки не згасають
   до кінця вікна, dmg = оцінка: стак живе в середньому (e^(6λ) − 1) / λ секунд при λ проків за секунду (потік Пуассона). */
function windowDamage(b, tg, rate, T) {
  const h = hit(b, tg), shot = h.health * b.ms, times = shotTimes(rate.fr, rate.mag, rate.reload, T), N = times.length;
  const dots = [];
  for (const l of h.lines) {
    const tick = dotTick(b, tg, l.t);
    if (tick === null) continue;
    const per = b.ms * b.sc * (l.v / b.total), at = TICK_AT[l.t];
    const heat = l.t === 'Heat', lam = per * N / T, life = lam > 0 ? Math.expm1(6 * lam) / lam : 6;
    let ticks = 0, up = 0, est = 0;
    for (const s of times) {
      for (const o of at) if (s + o <= T + 1e-9) ticks++;
      if (heat) { const left = Math.max(0, Math.floor(T - s + 1e-9)); up += left; est += Math.min(left, life); }
    }
    const one = tick * b.crit, used = heat ? est : ticks;
    dots.push({ t: l.t, procs: per * N, avg: N ? used / N : 0, tick: one, dmg: per * used * one, low: per * ticks * one, upper: heat ? per * up * one : null });
  }
  const direct = N * shot, dot = dots.reduce((a, x) => a + x.dmg, 0);
  return { shot, N, cycle: rate.mag / rate.fr + rate.reload, direct, dots, dot, total: direct + dot, dps: (direct + dot) / T };
}
/* Скільки пострілів до смерті цілі зі щитом. Toxin іде одразу в здоров'я. */
function shotsToKill(b, tg, carry = true) {
  const h = hit(b, tg);
  let sh = tg.shields, hp = tg.health, shots = 0, broke = 0;
  const tox = h.lines.filter(l => l.t === 'Toxin').reduce((a, l) => a + l.d, 0);
  const rest = h.raw - tox;
  while (hp > 0 && shots < 99) {
    shots++;
    hp -= tox;
    if (sh > 0) {
      sh -= rest;
      if (sh <= 0) { broke = shots; if (carry) hp += sh; sh = 0; }
    } else hp -= rest;
  }
  return { shots, broke, tox, rest, shieldLeft: Math.max(0, sh) };
}
/* Додатковий хіт (Toxic Lash, Resupply тощо): відсоток від усього пострілу, ще раз × фракційний бонус.
   Його тік рахується від самого хіта: × 0.5 × (1 + моди тієї ж стихії) × (1 + фракційний бонус). */
function weaponHitRaw(b) { return b.parts.reduce((a, p) => a + p.v, 0) * (1 + b.fac); }
function extraHit(b, tg, pct, type) {
  const st = tg.st || {}, def = typeMod(tg.faction, type) * (1 - armorDR(effArmor(tg))) * viralMult(st.viral || 0);
  const src = weaponHitRaw(b), raw = src * pct * (1 + b.fac), bonus = b.prim[type] || 0;
  return { src, raw, bonus, dealt: raw * def, tick: 0.5 * raw * (1 + bonus) * (1 + b.fac) * (1 + b.sd) * def };
}
if (typeof module !== 'undefined') module.exports = { FACTIONS, COMBO, typeMod, armorDR, corrosiveStrip, viralMult, combine, build, hit, effArmor, bleedTick, heatTick, blastPop, shotsToKill };
