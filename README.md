# Blot's School

**English** · [Українська](README.uk.md)

A pixel trainer for Warframe damage math and status logic. You pick a mod or a status, see the number and a step-by-step breakdown, and Blot explains why it came out that way.

**Play:** [in English](https://zavarovek.github.io/klyaksa/en.html) · [українською](https://zavarovek.github.io/klyaksa/)

## What's inside

- **Run:** 19 puzzle rooms in six chapters: damage piles, elements and defenses, ticks, statuses, defense, abilities.
- **Arena:** quick drills on faction weaknesses and element combos.
- **Sandbox:** made-up mods labelled by what they multiply, any faction, armor, Viral and Corrosive toggles, and damage over a 5, 10 or 30 second window.
- **Cheat sheet:** the faction table, the damage formula, crits, procs, extra hits, defense and abilities on one page.

## Rules and numbers

Rules since Update 36 (Jade Shadows), numbers checked against [wiki.warframe.com](https://wiki.warframe.com/w/Damage). The game also rounds damage (quantization), and the trainer does not.

Found a mismatch with the game? Open an issue and say which room and option it is and what the game shows.

## Build

No dependencies. Sources live in `src/`, the pages are built into the repository root.

```
python build.py    # builds index.html and en.html
node check.js      # prints every option's result and compares control values with the wiki
```

## Fan art

![Blot by Altemis](fanart/altemis.webp)

Blot as seen by [Altemis](https://www.twitch.tv/altemisvt). The drawing belongs to its author and is not covered by the MIT license.

---

A fan project, not affiliated with Digital Extremes. Warframe and all related names belong to Digital Extremes Ltd. Code is under the MIT license.
