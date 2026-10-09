"""Збирає сайт із src/: index.html (українська) та en.html (англійська). Запуск: python build.py"""
import re, pathlib, urllib.parse
d = pathlib.Path(__file__).parent
out = d
strip = lambda s: re.sub(r"\nif \(typeof module[^\n]*", "", s)
read = lambda n: (d / "src" / n).read_text(encoding="utf8")
eng, rooms, ui, css = read("engine.js"), read("rooms.js"), read("ui.js"), read("style.css")

BLOB = ['....########....', '..############..', '.#hh###########.', '.#h############.', '################', '################',
        '################', '################', '################', '.##############.', '.##############.', '..###.####.###..', '...#...##...#...']
rects = []
for y, row in enumerate(BLOB):
    for x, ch in enumerate(row):
        if ch != '.':
            rects.append(f'<rect x="{x}" y="{y + 1.5}" width="1.02" height="1.02" fill="{"#8f7dff" if ch == "h" else "#5b46c9"}"/>')
for cx in (4, 9):
    rects.append(f'<rect x="{cx}" y="5.5" width="3" height="4" fill="#fff"/><rect x="{cx + 1}" y="6.5" width="2" height="2" fill="#0d0920"/>')
icon = "data:image/svg+xml," + urllib.parse.quote(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">{"".join(rects)}</svg>')

SITE = {
    "uk": dict(file="index.html", title="Школа Клякси", tag="Тренажер шкоди та статусів Warframe за правилами після Jade Shadows",
               desc="Піксельний тренажер математики шкоди та статусів Warframe: похід із кімнат-головоломок, арена на слабкості фракцій і комбінації стихій, пісочниця з модами і шпаргалка.",
               modes="Режими", tabs=("Похід", "Арена", "Пісочниця", "Шпаргалка"),
               foot='Цифри звірено з <a href="https://wiki.warframe.com/w/Damage">wiki.warframe.com</a> 9 жовтня 2026 року. Гра додатково округлює шкоду (квантування), тут цього немає. Назви модів і типів шкоди лишено англійською, як у більшості білдів. <a href="en.html">English version</a>'),
    "en": dict(file="en.html", title="Blot's School", tag="A trainer for Warframe damage math and status logic, on the rules since Jade Shadows",
               desc="A pixel trainer for Warframe damage math and status logic: a run of puzzle rooms, an arena for faction weaknesses and element combos, a mod sandbox and a cheat sheet.",
               modes="Modes", tabs=("Run", "Arena", "Sandbox", "Cheat sheet"),
               foot='Numbers checked against <a href="https://wiki.warframe.com/w/Damage">wiki.warframe.com</a> on 9 October 2026. The game also rounds damage (quantization), and this trainer does not. <a href="index.html">Українська версія</a>'),
}
for lang, s in SITE.items():
    html = f"""<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{s['title']}</title>
<meta name="description" content="{s['desc']}">
<meta property="og:title" content="{s['title']}">
<meta property="og:description" content="{s['desc']}">
<link rel="icon" href="{icon}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Handjet:wght@500;700&family=JetBrains+Mono:wght@400;700&family=Press+Start+2P&display=swap">
<style>
html {{ -webkit-text-size-adjust: 100%; }}
body {{ margin: 0; }}
img {{ max-width: 100%; }}
[hidden] {{ display: none !important; }}
{css}</style>
</head>
<body>
<div class="wrap">
  <header class="top">
    <div class="brand">
      <canvas class="face logo" width="16" height="13" data-mood="idle" aria-hidden="true"></canvas>
      <div><h1>{s['title']}</h1><p class="tag">{s['tag']}</p></div>
    </div>
    <nav class="tabs" role="tablist" aria-label="{s['modes']}">
      <button type="button" class="tab" role="tab" data-view="run" id="tab-run">{s['tabs'][0]}</button>
      <button type="button" class="tab" role="tab" data-view="arena" id="tab-arena">{s['tabs'][1]}</button>
      <button type="button" class="tab" role="tab" data-view="sandbox" id="tab-sandbox">{s['tabs'][2]}</button>
      <button type="button" class="tab" role="tab" data-view="sheet" id="tab-sheet">{s['tabs'][3]}</button>
    </nav>
  </header>
  <main id="view"></main>
  <footer class="foot"><p>{s['foot']}</p></footer>
</div>
<script>
{strip(eng)}
{read(f't.{lang}.js')}
{strip(rooms)}
{ui}</script>
</body>
</html>
"""
    (out / s["file"]).write_text(html, encoding="utf8")
    print(s["file"], len(html.encode("utf8")), "bytes")
