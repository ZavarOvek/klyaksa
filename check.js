// Перевірка цифр: node check.js. Друкує результат кожного варіанта і звіряє контрольні приклади з вікі.
const fs = require('fs');
const rd = n => fs.readFileSync(__dirname + '/src/' + n, 'utf8').replace(/\nif \(typeof module[^\n]*/, '');
for (const lang of ['uk', 'en']) {
  const src = rd('engine.js') + rd(`t.${lang}.js`) + rd('rooms.js') + `
  console.log('#### ' + T.lang + ' rooms=' + ROOMS.length);
  for (const r of ROOMS) {
    const v = r.options.map((_, i) => r.calc(i));
    const bad = v.filter(c => /undefined|NaN/.test(c.say + JSON.stringify(c.rows))).length;
    const vals = v.map(c => Math.round(c.value * 100) / 100), b = bestIndex(r);
    const uniqBest = vals.filter(x => x === vals[b]).length === 1;
    console.log(r.id.padEnd(10), 'best=' + b, JSON.stringify(vals), uniqBest ? '' : '!! best not unique', bad ? '!! undefined/NaN in text' : '');
    if (process.argv.includes(r.id)) r.options.forEach((o, i) => { const c = r.calc(i); console.log('  ', c.rows.slice(-4).map(x => x.slice(0, 2).join(' = ')).join(' ; ')); console.log('  ', c.say); });
  }
  if (T.lang === 'uk') {
    const b = build({ base: 100, ips: { Puncture: 1 } }, [M.clip]);
    const x = extraHit(b, { faction: 'none' }, 0.3, 'Toxin');
    console.log('wiki Extra Hit: 100 × 1.9 × 0.3 = 57 ->', x.raw, '| tick 57 × 1.9 × 0.5 = 54.15 ->', x.tick);
    console.log('wiki Aptitude 1 status, 2 stacks: 345 ->', 100 * (1 + 1.65 + 0.8), '| order:', ROOMS.map(r => r.ch + ':' + r.id).join(' '));
    const paris = build({ base: 100, ips: { Puncture: 1 }, cc: 0.3, cm: 2 }, [M.pstrike, M.vsense]);
    console.log('fandom Paris avg crit 3.55 ->', paris.crit, '| unmodded 1.3 ->', build({ base: 100, ips: { Puncture: 1 }, cc: 0.3, cm: 2 }, []).crit);
    const sl = build({ base: 100, ips: { Slash: 1 } }, [M.serration, M.bane, M.elementalist]);
    console.log('wiki bleed with Elementalist 297.8202 ->', bleedTick(sl, { faction: 'grineer' }));
    const tx = build({ base: 100, ips: { Puncture: 1 } }, [M.serration, M.clip, M.elementalist, M.baneInf]);
    console.log('wiki Toxin tick 808.3692 ->', dotTick(tx, { faction: 'none' }, 'Toxin'));
    console.log('shots 10/s, mag 10, reload 1 s, 5 s: 30 ->', shotTimes(10, 10, 1, 5).length, '| 8/s, mag 60, reload 2 s, 10 s: 64 ->', shotTimes(8, 60, 2, 10).length);
    const wd = windowDamage(build({ base: 100, ips: { Slash: 1 }, sc: 1 }, []), { faction: 'none' }, { fr: 1, mag: 100, reload: 0 }, 3);
    console.log('window: 3 shots × 100 + 6 bleed ticks × 35 = 510 ->', wd.total, '| dps 170 ->', wd.dps);
    const wh = windowDamage(build({ base: 100, ips: { Puncture: 1 }, sc: 1 }, [M.hellfire]), { faction: 'none' }, { fr: 1, mag: 100, reload: 0 }, 8).dots.find(x => x.t === 'Heat');
    console.log('heat 8 s: share 0.9/1.9, ticks 6+6+6+5+4+3+2+1 = 33, tick 95; lower', 0.9 / 1.9 * 33 * 95, '->', wh.low, '| estimate', wh.dmg, '| no-expiry ticks 8+7+...+1 = 36:', 0.9 / 1.9 * 36 * 95, '->', wh.upper);
    const rare = windowDamage(build({ base: 100, ips: { Puncture: 1 }, sc: 0.01 }, [M.hellfire]), { faction: 'none' }, { fr: 1, mag: 100, reload: 0 }, 30).dots[0];
    const often = windowDamage(build({ base: 100, ips: { Puncture: 1 }, sc: 1 }, [M.hellfire]), { faction: 'none' }, { fr: 10, mag: 100, reload: 0 }, 30).dots[0];
    console.log('heat estimate: rare procs stay near the lower bound ->', (rare.dmg / rare.low).toFixed(3), '| frequent procs reach the upper bound ->', (often.dmg / often.upper).toFixed(3), '| always inside bounds:', rare.low <= rare.dmg && rare.dmg <= rare.upper && often.low <= often.dmg && often.dmg <= often.upper);
    const cr = ROOMS.find(r => r.id === 'crewman'); cr.options.forEach((o, i) => { const s = setup(cr, i); if (shotsToKill(s.b, s.tg, true).shots !== shotsToKill(s.b, s.tg, false).shots) console.log('!! shield carry matters'); });
  }`;
  (0, eval)(`(() => {${src}})()`);
}
