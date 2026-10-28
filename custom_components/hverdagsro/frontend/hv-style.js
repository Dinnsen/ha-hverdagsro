/* Hverdagsro – styles. Ported from the prototype; scoped to the panel's shadow root. */
export default `
/* Layout: levende himmel (stor på forsiden, mini på de andre sider), tynd linje til el og biler,
   faner som i Middagsro. Forældre og børn ser hver deres version. */
:host {
  --bg: #F2F4F6; --surface: #FFFFFF; --surface-2: #F6F5FA; --ink: #1B1530; --muted: #6B6880; --line: #E4E2EE;
  --petrol: #11A39A; --violet: #6E4AFF; --coral: #FF7A59; --good: #1E9E62; --warn: #D98A12; --bad: #D9473B; --gold: #F2B01E;
  --shadow: 0 1px 2px rgba(27,21,48,.06), 0 8px 24px rgba(27,21,48,.06);
  --font-display: "Bricolage Grotesque", "Avenir Next", "Segoe UI", system-ui, sans-serif;
  --font-body: "Figtree", "Segoe UI", system-ui, -apple-system, sans-serif;
  --radius: 18px;
}
@media (prefers-color-scheme: dark) { :host(:not([data-theme="light"])) {
  --bg: #0F0E19; --surface: #191726; --surface-2: #221F33; --ink: #F1EFFA; --muted: #A7A3BD; --line: #2D2A42;
  --petrol: #2CC4B8; --violet: #9B83FF; --coral: #FF8E70; --good: #3CCB83; --warn: #F0A93A; --bad: #F06A5E; --gold: #F6C243;
  --shadow: 0 1px 2px rgba(0,0,0,.3), 0 10px 28px rgba(0,0,0,.28); color-scheme: dark; } }
:host([data-theme="dark"]) {
  --bg: #0F0E19; --surface: #191726; --surface-2: #221F33; --ink: #F1EFFA; --muted: #A7A3BD; --line: #2D2A42;
  --petrol: #2CC4B8; --violet: #9B83FF; --coral: #FF8E70; --good: #3CCB83; --warn: #F0A93A; --bad: #F06A5E; --gold: #F6C243;
  --shadow: 0 1px 2px rgba(0,0,0,.3), 0 10px 28px rgba(0,0,0,.28); color-scheme: dark; }

:host([data-skin="nordlys"]) { --violet: #0EA5A0; --bg: #EEF6F5; --surface-2: #EFF7F6; --line: #D7E8E6; }
:host([data-skin="hav"]) { --violet: #2F6FED; --bg: #EEF3FA; --surface-2: #F0F5FC; --line: #DAE4F2; }
:host([data-skin="skov"]) { --violet: #2E8B57; --bg: #F0F5EF; --surface-2: #F2F7F1; --line: #DCE8DA; }
:host([data-skin="sand"]) { --violet: #C2703D; --bg: #F7F2EB; --surface-2: #FAF5EF; --line: #ECE2D6; --ink: #2A2018; }
:host([data-skin="rosa"]) { --violet: #E4568C; --bg: #FBF0F4; --surface-2: #FCF3F7; --line: #F2DCE5; }
:host([data-skin="kontrast"]) { --violet: #111111; --bg: #FFFFFF; --surface: #FFFFFF; --surface-2: #F2F2F2; --ink: #000000; --muted: #333333; --line: #111111; --shadow: 0 0 0 1.5px #111111; }
@media (prefers-color-scheme: dark) {
  :host([data-skin="nordlys"]:not([data-theme="light"])) { --violet: #2CD3C5; --bg: #07161A; --surface: #0E2126; --surface-2: #132A30; --line: #1D3940; }
  :host([data-skin="hav"]:not([data-theme="light"])) { --violet: #6FA0FF; --bg: #0A1220; --surface: #111B2D; --surface-2: #17233A; --line: #22304A; }
  :host([data-skin="skov"]:not([data-theme="light"])) { --violet: #4CC283; --bg: #0C140F; --surface: #132019; --surface-2: #192A20; --line: #23382B; }
  :host([data-skin="sand"]:not([data-theme="light"])) { --violet: #E2925C; --bg: #17120D; --surface: #211A13; --surface-2: #2A2118; --line: #3A2E22; --ink: #F5EDE3; }
  :host([data-skin="rosa"]:not([data-theme="light"])) { --violet: #FF7FAE; --bg: #1A0E14; --surface: #24141C; --surface-2: #2E1A24; --line: #3E2531; }
  :host([data-skin="kontrast"]:not([data-theme="light"])) { --violet: #FFFFFF; --bg: #000000; --surface: #000000; --surface-2: #111111; --ink: #FFFFFF; --muted: #DDDDDD; --line: #FFFFFF; --shadow: 0 0 0 1.5px #FFFFFF; }
}
:host([data-skin="nordlys"][data-theme="dark"]) { --violet: #2CD3C5; --bg: #07161A; --surface: #0E2126; --surface-2: #132A30; --line: #1D3940; }
:host([data-skin="hav"][data-theme="dark"]) { --violet: #6FA0FF; --bg: #0A1220; --surface: #111B2D; --surface-2: #17233A; --line: #22304A; }
:host([data-skin="skov"][data-theme="dark"]) { --violet: #4CC283; --bg: #0C140F; --surface: #132019; --surface-2: #192A20; --line: #23382B; }
:host([data-skin="sand"][data-theme="dark"]) { --violet: #E2925C; --bg: #17120D; --surface: #211A13; --surface-2: #2A2118; --line: #3A2E22; --ink: #F5EDE3; }
:host([data-skin="rosa"][data-theme="dark"]) { --violet: #FF7FAE; --bg: #1A0E14; --surface: #24141C; --surface-2: #2E1A24; --line: #3E2531; }
:host([data-skin="kontrast"][data-theme="dark"]) { --violet: #FFFFFF; --bg: #000000; --surface: #000000; --surface-2: #111111; --ink: #FFFFFF; --muted: #DDDDDD; --line: #FFFFFF; --shadow: 0 0 0 1.5px #FFFFFF; }
:host([data-skin="rummet"]) { --violet: #A78BFA; --bg: #0B0D1E; --surface: #14172E; --surface-2: #1B1F3A; --line: #272C4D; --ink: #EEF0FF; --muted: #A3A8C9; --petrol: #2CC4B8; --good: #3CCB83; --warn: #F0A93A; --bad: #F06A5E; --gold: #F6C243; --shadow: 0 1px 2px rgba(0,0,0,.3), 0 10px 28px rgba(0,0,0,.35); color-scheme: dark; }
* { box-sizing: border-box; }
:host { display: block; position: relative; height: 100%; overflow: hidden auto; -webkit-overflow-scrolling: touch; background: var(--bg); color: var(--ink); font-family: var(--font-body); font-size: 15px; line-height: 1.45; -webkit-font-smoothing: antialiased; }
button, input, select { font: inherit; color: inherit; }
button { cursor: pointer; }
:focus-visible { outline: 2px solid var(--violet); outline-offset: 2px; border-radius: 8px; }
.num { font-variant-numeric: tabular-nums; }
.wrap { max-width: 1280px; margin: 0 auto; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
.ic { width: 1em; height: 1em; flex: none; }

/* ---------- Himlen ---------- */
.hero { position: relative; height: 404px; overflow: hidden; color: #fff; isolation: isolate; transition: height .55s cubic-bezier(.2,.8,.2,1); }
.hero.open { height: 560px; }
.hero.compact { height: 82px; }
.hero canvas { position: absolute; inset: 0; width: 100%; height: 100%; z-index: -1; }
.hero::after { content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none;
  background: linear-gradient(180deg, rgba(10,12,30,.4) 0%, rgba(10,12,30,0) 40%, rgba(10,12,30,0) 55%, rgba(10,12,30,.5) 100%); }
.hero .wrap { height: 100%; display: flex; flex-direction: column; padding-block: 16px 12px; gap: 8px; }
.hero.compact .wrap { padding-block: 0; justify-content: center; }
.hero-top { display: flex; align-items: center; gap: 10px; min-height: 44px; }
.brand { display: flex; align-items: center; gap: 10px; font-family: var(--font-display); font-weight: 700; font-size: 19px; letter-spacing: -.2px; border: 0; background: none; color: inherit; padding: 0; }
.brand svg { width: 34px; height: 34px; border-radius: 9px; box-shadow: 0 4px 14px rgba(0,0,0,.25); }
.mini-title { display: none; font-family: var(--font-display); font-weight: 700; font-size: 19px; opacity: .95; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.mini-title::before { content: "/"; opacity: .5; margin: 0 8px 0 0; font-weight: 500; }
.hero.compact .mini-title { display: block; }
.hero-top .grow { flex: 1; }
.glass { background: rgba(255,255,255,.17); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 0; color: #fff; border-radius: 999px; }
.wx-btn { display: flex; align-items: center; gap: 7px; padding: 6px 10px 6px 12px; font-weight: 700; font-size: 15px; flex: none; }
.wx-btn .ic { width: 20px; height: 20px; }
.wx-btn .chev { width: 16px; height: 16px; transition: transform .35s; }
.hero.open .wx-btn .chev { transform: rotate(180deg); }
.hero.compact .wx-btn .chev { display: none; }
.clock { font-weight: 700; font-variant-numeric: tabular-nums; font-size: 15px; opacity: .95; }
.me { display: flex; align-items: center; gap: 8px; padding: 4px 10px 4px 4px; font-weight: 700; font-size: 14px; flex: none; }
.me .av { width: 30px; height: 30px; font-size: 13px; border: 2px solid rgba(255,255,255,.85); }
.greet { margin-top: 4px; }
.greet .date { font-size: 14px; font-weight: 600; opacity: .9; letter-spacing: .3px; }
.greet h1 { font-family: var(--font-display); font-weight: 800; font-size: clamp(30px, 5.4vw, 52px); line-height: 1.02; letter-spacing: -1px; margin: 4px 0 8px; text-wrap: balance; text-shadow: 0 2px 18px rgba(0,0,0,.25); }
.greet .line { font-size: 15px; font-weight: 600; opacity: .95; text-shadow: 0 1px 10px rgba(0,0,0,.3); display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.greet .line .ic { width: 18px; height: 18px; }
.kidbar { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
.kidbar .glass { display: flex; align-items: center; gap: 6px; padding: 6px 12px; font-weight: 700; font-size: 14px; }
.kidbar .ic { width: 17px; height: 17px; }
.kidbar .ic:first-child { color: #FFD24A; }
.hero.compact .greet, .hero.compact .tl-wrap, .hero.compact .spacer { display: none; }
.spacer { flex: 1; }

/* Tidslinjen */
.tl-wrap { display: flex; flex-direction: column; gap: 6px; }
.tl-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 12px; font-weight: 600; opacity: .95; min-height: 24px; flex-wrap: wrap; }
.tl { position: relative; height: 70px; user-select: none; -webkit-user-select: none; touch-action: none; cursor: ew-resize; transition: height .45s; }
.hero.open .tl { height: 118px; }
.tl-axis { position: absolute; left: 0; right: 0; bottom: 18px; height: 6px; border-radius: 6px; overflow: hidden; display: flex; background: rgba(255,255,255,.2); }
.tl-axis span { flex: 1; opacity: .92; }
.tl-hours { position: absolute; left: 0; right: 0; bottom: 0; height: 14px; font-size: 11px; font-weight: 600; opacity: .8; }
.tl-hours span { position: absolute; transform: translateX(-50%); }
.tl-ev { position: absolute; bottom: 28px; height: 22px; display: flex; align-items: center; gap: 6px; padding: 0 9px 0 7px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap;
  background: rgba(255,255,255,.92); color: #1B1530; box-shadow: 0 4px 14px rgba(0,0,0,.18); animation: pop .5s cubic-bezier(.2,.9,.3,1.3) both; }
.tl-ev.row2 { bottom: 54px; }
.tl-ev.end { translate: -100% 0; }
.tl-ev i { width: 8px; height: 8px; border-radius: 50%; flex: none; }
.tl-ev.ex { background: rgba(255,255,255,.62); }
.tl-sun { position: absolute; bottom: 24px; width: 2px; height: 18px; background: #FFD27A; border-radius: 2px; box-shadow: 0 0 10px #FFB84D; }
.tl-wx { position: absolute; left: 0; right: 0; bottom: 82px; height: 36px; opacity: 0; transform: translateY(8px); transition: opacity .35s .1s, transform .35s .1s; pointer-events: none; }
.hero.open .tl-wx { opacity: 1; transform: none; }
.tl-wx div { position: absolute; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 1px; font-size: 11px; font-weight: 700; }
.tl-wx .ic { width: 17px; height: 17px; }
.tl-wx div.past { opacity: .55; }
.tl-wx i { display: block; width: 4px; border-radius: 2px; background: #9FD3FF; margin-top: 1px; }
.tl-now { position: absolute; bottom: 10px; top: auto; height: 24px; width: 2px; z-index: 0; background: #fff; border-radius: 2px; box-shadow: 0 0 12px rgba(255,255,255,.9); pointer-events: none; }
.tl-now b { position: absolute; top: 0; left: 50%; transform: translate(-50%, -100%); font-size: 10.5px; font-weight: 800; background: #fff; color: #1B1530; padding: 1px 6px; border-radius: 999px; white-space: nowrap; }
.hero.open .tl-now { top: auto; }
.tl-next { display: none; }
.back-now { border: 0; background: rgba(255,255,255,.92); color: #1B1530; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }
.wk { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 6px; max-height: 0; opacity: 0; overflow: hidden; transition: max-height .45s cubic-bezier(.2,.8,.2,1), opacity .35s; }
.hero.open .wk { max-height: 120px; opacity: 1; }
.wk div { padding: 8px 8px 7px; border-radius: 14px; background: rgba(255,255,255,.16); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.wk b { font-size: 12px; }
.wk .ic { width: 22px; height: 22px; }
.wk .range { position: relative; height: 6px; border-radius: 6px; background: rgba(255,255,255,.18); }
.wk .range i { position: absolute; top: 0; bottom: 0; border-radius: 6px; background: linear-gradient(90deg, #8FD0FF, #FFD27A); }
.wk small { font-size: 11px; font-weight: 600; opacity: .9; font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wx-try { display: none; gap: 4px; align-items: center; flex-wrap: wrap; }
.hero.open .wx-try { display: flex; }
.wx-try button { border: 0; background: rgba(255,255,255,.18); color: #fff; padding: 3px 9px; border-radius: 999px; font-size: 11.5px; font-weight: 700; }
.wx-try button[aria-pressed="true"] { background: #fff; color: #1B1530; }
@keyframes pop { from { opacity: 0; transform: translateY(6px) scale(.85); } to { opacity: 1; transform: none; } }

/* ---------- El og biler ---------- */
.status { background: var(--surface); border-bottom: 1px solid var(--line); }
.status .wrap { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 1fr); }
.st { display: flex; align-items: center; gap: 14px; padding-block: 10px; min-width: 0; padding-right: 14px; }
.st + .st { border-left: 1px solid var(--line); padding-left: 14px; }
.el-now { display: flex; flex-direction: column; line-height: 1.05; flex: none; }
.el-now small { font-size: 11px; font-weight: 700; letter-spacing: .7px; text-transform: uppercase; color: var(--muted); }
.el-now b { font-family: var(--font-display); font-size: 26px; font-weight: 800; letter-spacing: -.5px; }
.el-now span { font-size: 11.5px; color: var(--muted); font-weight: 600; }
.spark-box { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; max-width: 360px; }
.spark span.midnight { margin-left: 4px; }
.spark-notes { display: flex; flex-direction: column; gap: 2px; margin-left: auto; flex: none; }
.spark { display: flex; align-items: flex-end; gap: 1px; height: 30px; }
.spark span { flex: 1; min-width: 2px; border-radius: 2px 2px 0 0; transform-origin: bottom; animation: grow .7s cubic-bezier(.2,.8,.2,1) both; }
.spark span.now { box-shadow: 0 0 0 1.5px var(--ink); }
.spark-ax { display: flex; justify-content: space-between; font-size: 10px; font-weight: 700; color: var(--muted); font-variant-numeric: tabular-nums; }
.spark-note { font-size: 12px; color: var(--muted); font-weight: 600; white-space: nowrap; }
.spark-note b { color: var(--ink); }
.weekp { display: flex; gap: 4px; align-items: flex-end; flex: none; }
.weekp div { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 10px; font-weight: 700; color: var(--muted); }
.weekp b { display: block; width: 10px; border-radius: 3px; animation: grow .7s cubic-bezier(.2,.8,.2,1) both; }
.weekp b.fc { background-image: repeating-linear-gradient(135deg, rgba(255,255,255,.5) 0 2px, transparent 2px 4px); }
.weekp-l { font-size: 10px; font-weight: 700; color: var(--muted); letter-spacing: .6px; text-transform: uppercase; writing-mode: vertical-rl; transform: rotate(180deg); }
@keyframes grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
.car { border: 0; background: transparent; text-align: left; border-radius: 14px; margin-block: 4px; transition: background .2s; }
.car:hover { background: var(--surface-2); }
.car .go { margin-left: auto; color: var(--muted); width: 18px; height: 18px; }
.ring { width: 42px; height: 42px; flex: none; }
.ring text { font-family: var(--font-body); font-weight: 800; font-size: 11px; fill: var(--ink); }
.st-text { min-width: 0; flex: 1; }
.st-main { font-size: 14px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.st-sub { font-size: 12.5px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ---------- Faner ---------- */
.tabs { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 20; background: color-mix(in srgb, var(--bg) 86%, transparent); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: 1px solid var(--line); }

.tabs .wrap { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; padding-block: 8px; }
.tab { border: 0; background: transparent; padding: 8px 14px; border-radius: 12px; font-weight: 600; color: var(--muted); display: flex; align-items: center; gap: 8px; white-space: nowrap; position: relative; }
.tab .ic { width: 19px; height: 19px; }
.tab[aria-selected="true"] { color: var(--ink); background: var(--surface); box-shadow: var(--shadow); }
.tab .badge { font-size: 11px; font-weight: 700; background: var(--violet); color: #fff; border-radius: 999px; padding: 0 6px; line-height: 17px; }
main { padding-block: 22px 40px; }
.view { animation: viewIn .45s cubic-bezier(.2,.8,.2,1) both; }
@keyframes viewIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
.grid { display: grid; align-items: start; gap: 16px; grid-template-columns: repeat(12, minmax(0, 1fr)); }
.card { background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow); padding: 18px; min-width: 0; }
.s12 { grid-column: span 12; } .s8 { grid-column: span 8; } .s7 { grid-column: span 7; } .s6 { grid-column: span 6; } .s5 { grid-column: span 5; } .s4 { grid-column: span 4; }
.card h2, .h2 { font-family: var(--font-display); font-size: 20px; font-weight: 700; letter-spacing: -.3px; margin: 0; text-wrap: balance; }
.card-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
.card-head .meta { font-size: 13px; color: var(--muted); }
.eyebrow { font-size: 11px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; color: var(--muted); }
.ex-tag { font-size: 10.5px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; color: var(--muted); border: 1px dashed var(--line); padding: 1px 6px; border-radius: 6px; white-space: nowrap; }
.btn { border: 0; border-radius: 12px; padding: 9px 14px; font-weight: 700; background: var(--ink); color: var(--bg); display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
.btn.soft { background: var(--surface-2); color: var(--ink); }
.btn.danger { background: var(--bad); color: #fff; }
.btn.sm { padding: 6px 10px; font-size: 13px; border-radius: 10px; }
.btn[disabled] { opacity: .45; cursor: default; }
.btn .ic { width: 16px; height: 16px; }
.iconbtn { border: 0; background: transparent; width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; color: var(--muted); flex: none; }
.iconbtn:hover { background: var(--surface-2); color: var(--ink); }
.iconbtn .ic { width: 17px; height: 17px; }
.lock { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--muted); font-weight: 600; }
.lock .ic { width: 14px; height: 14px; }
.foot { font-size: 12.5px; color: var(--muted); margin-top: 28px; max-width: 80ch; }
.star { color: var(--gold); }

/* Familien */
.family { display: flex; gap: 10px; flex-wrap: wrap; }
.member { display: flex; align-items: center; gap: 10px; padding: 8px 14px 8px 8px; border-radius: 999px; background: var(--surface-2); min-width: 0; border: 0; text-align: left; transition: transform .2s, box-shadow .2s; }
@media (hover: hover) { button.member:hover { transform: translateY(-2px); box-shadow: var(--shadow); } }
.av { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-family: var(--font-display); font-weight: 800; font-size: 15px; flex: none; position: relative; }
.av.sm { width: 26px; height: 26px; font-size: 11px; }
.av.home::after { content: ""; position: absolute; right: -1px; bottom: -1px; width: 11px; height: 11px; border-radius: 50%; background: var(--good); border: 2px solid var(--surface-2); }
.member .nm { font-weight: 700; font-size: 14px; line-height: 1.15; }
.member .sub { font-size: 12px; color: var(--muted); display: flex; gap: 6px; align-items: center; }
.pts { font-variant-numeric: tabular-nums; font-weight: 700; color: var(--violet); }
.chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-size: 12.5px; font-weight: 600; background: var(--surface-2); }
.chip i { width: 8px; height: 8px; border-radius: 50%; }

/* Dagsliste */
.agenda { display: flex; flex-direction: column; gap: 2px; }
.ag { display: grid; grid-template-columns: 58px 4px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 9px 6px; border-radius: 12px; transition: opacity .3s; }
.ag:hover { background: var(--surface-2); }
.ag .time { font-variant-numeric: tabular-nums; font-weight: 700; font-size: 14px; }
.ag .bar { width: 4px; height: 34px; border-radius: 4px; }
.ag .ttl { font-weight: 600; }
.ag .sub { font-size: 12.5px; color: var(--muted); }
.ag .who { display: flex; }
.ag .who .av { margin-left: -6px; border: 2px solid var(--surface); }
.ag.past { opacity: .42; }
.ag.next { background: color-mix(in srgb, var(--kc, var(--violet)) 12%, var(--surface)); }
.day-split { font-size: 12px; font-weight: 700; color: var(--muted); letter-spacing: .6px; text-transform: uppercase; margin: 12px 6px 4px; }
.pickup { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 14px; background: color-mix(in srgb, var(--violet) 12%, var(--surface)); margin-top: 10px; }
.pickup .ic { width: 26px; height: 26px; color: var(--violet); }

/* Aftensmad */
.dinner { display: flex; gap: 16px; align-items: center; }
.plate { width: 84px; height: 84px; border-radius: 22px; flex: none; display: grid; place-items: center; background: linear-gradient(135deg, #6E4AFF, #FF7A59); color: #fff; }
.plate .ic { width: 50px; height: 50px; }
.dinner h3 { font-family: var(--font-display); font-size: 21px; line-height: 1.12; margin: 2px 0 6px; font-weight: 700; letter-spacing: -.3px; text-wrap: balance; }
.minis { display: flex; flex-direction: column; gap: 6px; margin-top: 14px; }
.mini { display: flex; justify-content: space-between; gap: 10px; font-size: 13.5px; padding-top: 8px; border-top: 1px solid var(--line); }
.mini span:first-child { color: var(--muted); font-weight: 600; width: 70px; flex: none; }
.mini span:last-child { flex: 1; min-width: 0; }

/* Opgaver og missioner */
.tasks { display: flex; flex-direction: column; gap: 6px; }
.task { display: grid; grid-template-columns: 30px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 10px; border-radius: 14px; background: var(--surface-2); position: relative; }
.task.late { box-shadow: inset 3px 0 0 var(--bad); }
.check { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--line); background: var(--surface); display: grid; place-items: center; padding: 0; transition: transform .2s; color: #fff; }
.check svg { width: 15px; height: 15px; stroke-dasharray: 24; stroke-dashoffset: 24; transition: stroke-dashoffset .35s .05s; }
.done .check { border-color: transparent; transform: scale(1.06); }
.done .check svg { stroke-dashoffset: 0; }
.done .t-ttl { text-decoration: line-through; color: var(--muted); }
.t-ttl { font-weight: 600; transition: color .3s; overflow-wrap: anywhere; }
.t-sub { font-size: 12.5px; color: var(--muted); display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.t-pts { font-weight: 800; font-size: 13px; color: var(--violet); white-space: nowrap; display: inline-flex; align-items: center; gap: 3px; }
.t-pts .ic { color: var(--gold); width: 14px; height: 14px; }
.late-tag { color: var(--bad); font-weight: 700; }
.fly { position: fixed; z-index: 99; font-weight: 800; color: var(--violet); pointer-events: none; font-size: 18px; animation: fly 1s cubic-bezier(.2,.8,.2,1) forwards; }
@keyframes fly { to { transform: translateY(-60px) scale(1.3); opacity: 0; } }
#confetti { position: fixed; inset: 0; pointer-events: none; z-index: 98; width: 100%; height: 100%; }
.approve { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 14px; background: color-mix(in srgb, var(--gold) 16%, var(--surface)); flex-wrap: wrap; }
.approve .t-ttl { flex: 1; min-width: 180px; }
.approve > .ic { width: 20px; height: 20px; color: var(--muted); }

.kids { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.kid { padding: 18px; border-radius: var(--radius); background: var(--surface); box-shadow: var(--shadow); display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; position: relative; overflow: hidden; border: 0; transition: transform .2s; }
@media (hover: hover) { .kid:hover { transform: translateY(-3px); } }
.kid::before { content: ""; position: absolute; inset: 0 0 auto; height: 64px; background: var(--kc); opacity: .14; }
.big-ring { width: 104px; height: 104px; position: relative; }
.big-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.big-ring .av { position: absolute; inset: 18px; width: auto; height: auto; font-size: 28px; }
.score { font-family: var(--font-display); font-size: 30px; font-weight: 800; line-height: 1; letter-spacing: -.5px; display: inline-flex; align-items: center; gap: 6px; }
.score .ic { color: var(--gold); width: 24px; height: 24px; }
.goal { font-size: 13px; color: var(--muted); }
.goal b { color: var(--ink); }
.streak { display: inline-flex; align-items: center; gap: 4px; font-weight: 800; font-size: 13px; color: var(--coral); }
.streak .ic { width: 15px; height: 15px; }
.cols-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; align-items: start; }
.person-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.person-head h3 { margin: 0; font-size: 16px; font-weight: 700; }
.person-head .meta { font-size: 12.5px; color: var(--muted); margin-left: auto; }

/* Personside */
.p-hero { border-radius: 24px; padding: 22px; color: #fff; position: relative; overflow: hidden; display: flex; gap: 18px; align-items: center; flex-wrap: wrap; background: var(--pc); }
.p-hero::after { content: ""; position: absolute; inset: 0; background: radial-gradient(120% 120% at 100% 0%, rgba(255,255,255,.28), transparent 55%), radial-gradient(80% 90% at 0% 100%, rgba(0,0,0,.18), transparent 60%); pointer-events: none; }
.p-hero > .av { width: 78px; height: 78px; font-size: 34px; border: 3px solid rgba(255,255,255,.7); position: relative; z-index: 1; }
.p-hero > .av:not(.photo) { background: rgba(255,255,255,.22) !important; border: 3px solid rgba(255,255,255,.7); position: relative; z-index: 1; }
.p-hero h2 { font-family: var(--font-display); font-size: 34px; margin: 0; letter-spacing: -.6px; line-height: 1; }
.p-hero .role { font-weight: 600; opacity: .9; }
.p-hero .stats { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
.p-hero .stats span { background: rgba(255,255,255,.2); padding: 5px 11px; border-radius: 999px; font-weight: 700; font-size: 13px; display: inline-flex; gap: 6px; align-items: center; }
.p-hero .stats .ic { width: 15px; height: 15px; }
.p-hero .acts { margin-left: auto; display: flex; gap: 8px; flex-wrap: wrap; position: relative; z-index: 1; }
.p-hero .acts .btn { background: rgba(255,255,255,.95); color: #1B1530; }
.back { border: 0; background: none; color: var(--muted); font-weight: 700; display: inline-flex; align-items: center; gap: 4px; padding: 4px 0; margin-bottom: 10px; }
.back .ic { width: 18px; height: 18px; }
.rights { display: grid; grid-template-columns: minmax(0, 1fr) repeat(2, 76px); font-size: 13.5px; }
.rights > * { padding: 8px 6px; border-bottom: 1px solid var(--line); }
.rights .h { font-size: 11px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: var(--muted); text-align: center; }
.rights .h:first-child { text-align: left; }
.rights .y, .rights .n { display: grid; place-items: center; }
.rights .y .ic { color: var(--good); width: 18px; height: 18px; }
.rights .n .ic { color: var(--muted); width: 15px; height: 15px; opacity: .6; }
.mods { display: grid; grid-template-columns: minmax(0, 1fr) repeat(3, 56px); font-size: 13.5px; align-items: center; }
.mods > * { padding: 7px 4px; border-bottom: 1px solid var(--line); }
.mods .h { display: flex; justify-content: center; }
.toggle { width: 40px; height: 24px; border-radius: 999px; border: 0; background: var(--line); position: relative; padding: 0; justify-self: center; transition: background .25s; }
.toggle::after { content: ""; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform .25s cubic-bezier(.2,.8,.2,1.3); box-shadow: 0 1px 3px rgba(0,0,0,.25); }
.toggle[aria-pressed="true"] { background: var(--tc, var(--good)); }
.toggle[aria-pressed="true"]::after { transform: translateX(16px); }

/* Mit dyr */
.pet { display: flex; align-items: center; gap: 14px; }
.pet svg { width: 92px; height: 92px; flex: none; overflow: visible; color: var(--ink); }
.pet .body { animation: breathe 3s ease-in-out infinite; transform-origin: 50% 90%; transform-box: fill-box; }
.pet.happy .body { animation: hop 1.2s ease-in-out infinite; }
@keyframes breathe { 50% { transform: scaleY(.96); } }
@keyframes hop { 0%, 100% { transform: translateY(0); } 40% { transform: translateY(-8px) scaleY(1.03); } 60% { transform: translateY(0) scaleY(.95); } }
.pet h3 { margin: 0; font-family: var(--font-display); font-size: 19px; }
.mood { font-weight: 700; font-size: 13px; }

/* Shop */
.goal-card { border-radius: 20px; padding: 18px; color: #fff; background: linear-gradient(135deg, var(--violet), var(--coral)); display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
.goal-card .em { font-size: 44px; line-height: 1; }
.goal-card h3 { margin: 0; font-family: var(--font-display); font-size: 24px; }
.goal-card .bar { height: 12px; border-radius: 12px; background: rgba(255,255,255,.25); overflow: hidden; margin-top: 8px; }
.goal-card .bar i { display: block; height: 100%; background: #fff; border-radius: 12px; transition: width .8s cubic-bezier(.2,.8,.2,1); }
.shop { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
.ware { border-radius: 18px; background: var(--surface); box-shadow: var(--shadow); padding: 14px; display: flex; flex-direction: column; gap: 6px; align-items: flex-start; position: relative; min-width: 0; }
.ware .em { font-size: 36px; line-height: 1.1; }
.ware b { font-weight: 700; }
.ware .price { display: inline-flex; align-items: center; gap: 4px; font-weight: 800; color: var(--violet); }
.ware .price .ic { color: var(--gold); width: 16px; height: 16px; }
.ware .tag { position: absolute; top: 10px; right: 10px; font-size: 10.5px; font-weight: 800; letter-spacing: .4px; text-transform: uppercase; padding: 2px 7px; border-radius: 999px; background: var(--violet); color: #fff; }

/* Skoleskema */
.skema-wrap { overflow-x: auto; }
.skema { display: grid; grid-template-columns: 46px repeat(5, minmax(110px, 1fr)); gap: 6px; min-width: 620px; }
.sk-h { text-align: center; font-weight: 700; font-size: 13px; padding: 6px 0; border-radius: 10px; }
.sk-h small { display: block; font-size: 11px; color: var(--muted); font-weight: 600; }
.sk-h.today { background: color-mix(in srgb, var(--violet) 14%, var(--surface)); color: var(--violet); }
.sk-times { position: relative; }
.sk-times span { position: absolute; right: 4px; font-size: 11px; color: var(--muted); font-weight: 700; transform: translateY(-50%); font-variant-numeric: tabular-nums; }
.sk-col { position: relative; border-radius: 12px; background: var(--surface-2); }
.sk-break { position: absolute; left: 0; right: 0; background: repeating-linear-gradient(135deg, transparent 0 6px, color-mix(in srgb, var(--muted) 16%, transparent) 6px 7px); border-radius: 4px; }
.sk-l { position: absolute; left: 4px; right: 4px; border-radius: 10px; padding: 5px 8px; color: #fff; overflow: hidden; display: flex; flex-direction: column; justify-content: center; animation: pop .45s cubic-bezier(.2,.9,.3,1.2) both; box-shadow: 0 2px 6px rgba(0,0,0,.12); }
.sk-l b { font-size: 13px; line-height: 1.1; }
.sk-l small { font-size: 11px; opacity: .9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sk-l.ex { opacity: .78; }
.sk-legend { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.sk-kids { display: flex; gap: 6px; flex-wrap: wrap; }

/* Kalender */
.cal-tools { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.filters { display: flex; gap: 6px; flex-wrap: wrap; }
.fchip { border: 1.5px solid var(--line); background: var(--surface); padding: 5px 11px 5px 6px; border-radius: 999px; display: flex; align-items: center; gap: 7px; font-weight: 600; font-size: 13px; transition: opacity .2s, border-color .2s; }
.fchip .av { width: 20px; height: 20px; font-size: 10px; }
.fchip[aria-pressed="false"] { opacity: .45; }
.fchip[aria-pressed="true"] { border-color: var(--fc); }
.week { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; }
.wday { background: var(--surface); border-radius: 16px; box-shadow: var(--shadow); padding: 10px 8px; min-height: 290px; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.wday.today { outline: 2px solid var(--petrol); }
.wday-h { display: flex; align-items: baseline; gap: 6px; padding: 0 4px 6px; border-bottom: 1px solid var(--line); }
.wday-h b { font-family: var(--font-display); font-size: 22px; font-weight: 800; }
.wday-h span { font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .5px; }
.wday-h em { margin-left: auto; font-style: normal; font-size: 11px; color: var(--muted); display: inline-flex; gap: 3px; align-items: center; }
.wday-h em .ic { width: 14px; height: 14px; }
.ev { border: 0; text-align: left; border-radius: 10px; padding: 7px 8px; background: color-mix(in srgb, var(--ec) 14%, var(--surface)); border-left: 3px solid var(--ec); font-size: 12.5px; line-height: 1.25; min-width: 0; animation: pop .45s cubic-bezier(.2,.9,.3,1.2) both; }
.ev b { display: block; font-weight: 700; overflow-wrap: anywhere; }
.ev small { color: var(--muted); font-size: 11.5px; font-variant-numeric: tabular-nums; }
.ev.pick { background: repeating-linear-gradient(135deg, color-mix(in srgb, var(--ec) 12%, var(--surface)) 0 6px, var(--surface) 6px 12px); }
.ev-dinner { margin-top: auto; font-size: 11.5px; color: var(--muted); padding: 6px 4px 0; border-top: 1px dashed var(--line); display: flex; gap: 6px; }
.ev-dinner .ic { width: 14px; height: 14px; margin-top: 1px; }

/* Madplan */
.meals { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; }
.votes { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.votes li { display: flex; justify-content: space-between; gap: 12px; padding: 10px 12px; border-radius: 12px; background: var(--card2, #F6F3FA); }
.meal { border-radius: 16px; padding: 14px; background: var(--surface); box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.meal.tonight { background: linear-gradient(140deg, #6E4AFF, #FF7A59); color: #fff; }
.meal.tonight .eyebrow, .meal.tonight .m-sub { color: rgba(255,255,255,.85); }
.meal h3 { margin: 0; font-family: var(--font-display); font-size: 17px; line-height: 1.15; font-weight: 700; text-wrap: balance; }
.m-sub { font-size: 12.5px; color: var(--muted); }
.meal.rest { background: var(--surface-2); box-shadow: none; }
.budget { display: flex; align-items: center; gap: 14px; }
.budget .bar { flex: 1; height: 10px; border-radius: 10px; background: var(--surface-2); overflow: hidden; }
.budget .bar i { display: block; height: 100%; border-radius: 10px; background: linear-gradient(90deg, var(--petrol), var(--violet)); animation: fill 1.1s cubic-bezier(.2,.8,.2,1) both; transform-origin: left; }
@keyframes fill { from { transform: scaleX(0); } }

/* Lister */
.lists { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
.lchip { border: 0; background: var(--surface); box-shadow: var(--shadow); padding: 9px 14px 9px 9px; border-radius: 14px; display: flex; align-items: center; gap: 10px; font-weight: 700; animation: pop .4s both; }
.lchip[aria-pressed="true"] { background: var(--ink); color: var(--bg); }
.lchip small { font-weight: 600; opacity: .7; font-variant-numeric: tabular-nums; }
.lchip .dot { width: 26px; height: 26px; border-radius: 8px; display: grid; place-items: center; color: #fff; }
.lchip .dot .ic { width: 16px; height: 16px; }
.lchip.new { background: transparent; box-shadow: none; border: 1.5px dashed var(--line); color: var(--muted); padding-left: 12px; }
.lchip.new .ic { width: 16px; height: 16px; }
.items { display: flex; flex-direction: column; gap: 6px; }
.item { display: grid; grid-template-columns: 30px minmax(0, 1fr) auto auto; gap: 10px; align-items: center; padding: 8px 6px 8px 10px; border-radius: 14px; background: var(--surface-2); transition: opacity .3s, transform .3s; }
.item.li { grid-template-columns: 30px minmax(0, 1fr) auto; }
.li-txt { display: grid; gap: 2px; min-width: 0; }
.li-txt .t-ttl { overflow-wrap: anywhere; }
.li-txt .t-sub { font-size: 12.5px; overflow-wrap: anywhere; }
.item.done { opacity: .55; }
.item.done .t-ttl { text-decoration: line-through; }
.item.gone { opacity: 0; transform: translateX(30px); }
.item > .gift { display: grid; place-items: center; }
.item > .gift .ic { width: 20px; height: 20px; }
.add { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
.add input { flex: 1; min-width: 140px; border: 1.5px solid var(--line); background: var(--surface); border-radius: 12px; padding: 9px 12px; }
.progress { height: 6px; border-radius: 6px; background: var(--surface-2); overflow: hidden; margin: 4px 0 14px; }
.progress i { display: block; height: 100%; background: var(--petrol); border-radius: 6px; transition: width .4s cubic-bezier(.2,.8,.2,1); }
.confirm { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 12px; border-radius: 14px; background: color-mix(in srgb, var(--bad) 12%, var(--surface)); margin-bottom: 12px; animation: pop .3s both; }
.confirm span { flex: 1; min-width: 160px; font-weight: 600; }
.reserved { font-weight: 700; color: var(--good); }

/* Børnenes dag */
.days { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
.dbtn { border: 0; background: var(--surface); box-shadow: var(--shadow); border-radius: 14px; padding: 8px 12px; display: flex; flex-direction: column; align-items: center; min-width: 58px; font-weight: 700; flex: none; }
.dbtn small { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .5px; }
.dbtn b { font-family: var(--font-display); font-size: 20px; }
.dbtn[aria-pressed="true"] { background: var(--kc, var(--violet)); color: #fff; }
.dbtn[aria-pressed="true"] small { color: rgba(255,255,255,.85); }
.nownext { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.nn { border-radius: 16px; padding: 14px; background: var(--surface-2); min-width: 0; }
.nn.now { background: var(--kc, var(--violet)); color: #fff; }
.nn small { font-size: 11px; font-weight: 800; letter-spacing: .7px; text-transform: uppercase; opacity: .8; }
.nn b { display: block; font-family: var(--font-display); font-size: 19px; line-height: 1.15; margin-top: 2px; }
.pin-msg { display: flex; gap: 10px; align-items: center; padding: 12px 14px; font-weight: 600; }
.pin-msg .txt { flex: 1; min-width: 0; }
.mission { grid-template-columns: 52px minmax(0, 1fr) auto; padding: 12px; border-radius: 18px; }
.mission .check { width: 46px; height: 46px; }
.mission .check svg { width: 22px; height: 22px; }
.mission .t-ttl { font-size: 16px; }

/* Ark */
.sheet-bg { position: fixed; inset: 0; background: rgba(15,14,25,.45); z-index: 60; display: grid; place-items: end center; animation: fadeIn .2s both; }
.sheet { width: min(560px, 100%); background: var(--surface); border-radius: 22px 22px 0 0; padding: 20px max(18px, env(safe-area-inset-right, 0px)) calc(20px + env(safe-area-inset-bottom, 0px)) max(18px, env(safe-area-inset-left, 0px)); box-shadow: 0 -10px 40px rgba(0,0,0,.25); animation: up .35s cubic-bezier(.2,.9,.3,1) both; max-height: 90vh; overflow: auto; }
@media (min-width: 700px) { .sheet-bg { place-items: center; } .sheet { border-radius: 22px; } }
@keyframes up { from { transform: translateY(40px); opacity: 0; } }
@keyframes fadeIn { from { opacity: 0; } }
.sheet h2 { font-family: var(--font-display); font-size: 24px; margin: 0 0 4px; letter-spacing: -.4px; }
.field { display: flex; flex-direction: column; gap: 6px; margin-top: 14px; }
.field label, .field .lbl { font-size: 12px; font-weight: 700; color: var(--muted); letter-spacing: .5px; text-transform: uppercase; }
.field input, .field select { border: 1.5px solid var(--line); background: var(--surface-2); border-radius: 12px; padding: 10px 12px; }
.row { display: flex; gap: 10px; flex-wrap: wrap; }
.row > * { flex: 1; min-width: 120px; }
.sheet-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; flex-wrap: wrap; }
.kv { display: grid; grid-template-columns: 110px minmax(0, 1fr); gap: 8px 12px; margin-top: 14px; font-size: 14px; }
.kv dt { color: var(--muted); font-weight: 600; }
.kv dd { margin: 0; }
.swatches { display: flex; gap: 8px; flex-wrap: wrap; }
.sw { width: 32px; height: 32px; border-radius: 10px; border: 3px solid transparent; }
.sw[aria-pressed="true"] { border-color: var(--ink); }
.seg { display: flex; gap: 4px; padding: 4px; border-radius: 14px; background: var(--surface-2); }
.seg button { flex: 1; border: 0; background: transparent; border-radius: 10px; padding: 8px 6px; font-weight: 700; font-size: 13px; color: var(--muted); }
.seg button[aria-pressed="true"] { background: var(--surface); color: var(--ink); box-shadow: var(--shadow); }
.qc { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 14px; }
.qc button { border: 0; border-radius: 16px; padding: 16px; background: var(--surface-2); text-align: left; display: flex; flex-direction: column; gap: 6px; font-weight: 700; }
.qc .ic { width: 24px; height: 24px; color: var(--violet); }
.qc small { font-weight: 500; color: var(--muted); font-size: 12.5px; }
.evp { display: flex; gap: 18px; align-items: center; }
.evp .ring { width: 116px; height: 116px; }
.evp .ring text { font-size: 9px; }
.evp h2 { margin: 0; }
.evp-plan { margin-top: 16px; border-radius: 16px; padding: 14px; background: var(--surface-2); display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px 10px; }
.evp-plan small { display: block; font-size: 11px; font-weight: 700; color: var(--muted); letter-spacing: .5px; text-transform: uppercase; }
.evp-plan b { font-family: var(--font-display); font-size: 17px; font-variant-numeric: tabular-nums; }
.evp-brand { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; color: var(--muted); margin-bottom: 12px; letter-spacing: .3px; }
.evp-brand .ic { width: 18px; height: 18px; color: #3CCB83; }
.pin-dots { display: flex; gap: 12px; justify-content: center; margin: 18px 0; }
.pin-dots i { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--ink); transition: background .15s; }
.pin-dots i.on { background: var(--ink); }
.pin-dots.shake { animation: shake .35s; }
@keyframes shake { 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
.pinpad { display: grid; grid-template-columns: repeat(3, 72px); gap: 10px; justify-content: center; }
.pinpad button { height: 60px; border-radius: 18px; border: 0; background: var(--surface-2); font-family: var(--font-display); font-size: 24px; font-weight: 700; }
.pin-av { width: 64px; height: 64px; font-size: 26px; margin: 0 auto; }
.who-list { display: flex; flex-direction: column; gap: 6px; margin-top: 14px; }
.who-list button { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 14px; border: 0; background: var(--surface-2); text-align: left; font-weight: 700; }
.who-list button[aria-current="true"] { outline: 2px solid var(--violet); }
.who-list small { display: block; font-weight: 500; color: var(--muted); font-size: 12.5px; }
.toast { position: fixed; left: 50%; bottom: calc(24px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); background: var(--ink); color: var(--bg); padding: 10px 16px; border-radius: 14px; font-weight: 700; z-index: 70; animation: up .3s both; box-shadow: var(--shadow); max-width: calc(100% - 32px); }

/* Familiebåndet */
.fband { display: flex; gap: 12px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; padding: 6px 4px 14px; margin: -6px -4px -2px; }
.fband::-webkit-scrollbar { display: none; }
@media (min-width: 861px) { .fband { -webkit-mask-image: linear-gradient(90deg, #000 93%, transparent); mask-image: linear-gradient(90deg, #000 93%, transparent); padding-right: 60px; } }
.fsum { flex: none; width: 176px; height: 150px; border-radius: 24px; padding: 14px 16px; color: #fff; background: linear-gradient(150deg, #19B6A5, #6E4AFF); position: relative; overflow: hidden; scroll-snap-align: start; display: flex; flex-direction: column; animation: podIn .6s cubic-bezier(.2,.9,.3,1.1) both; }
.fsum::after { content: ""; position: absolute; width: 150px; height: 150px; right: -60px; top: -70px; border-radius: 50%; background: rgba(255,255,255,.16); animation: drift 9s ease-in-out infinite alternate; }
.fsum b { font-family: var(--font-display); font-size: 42px; line-height: 1; font-weight: 800; letter-spacing: -1px; margin-top: 2px; }
.fsum b small { font-size: 18px; opacity: .75; }
.fsum .lbl { font-weight: 700; font-size: 12.5px; opacity: .92; position: relative; z-index: 1; }
.fsum .dots { display: flex; gap: 5px; margin: 8px 0 auto; }
.fsum .dots i { width: 12px; height: 12px; border-radius: 50%; border: 2px solid rgba(255,255,255,.8); }
.fsum .dots i.in { background: #fff; }
.fsum .nx { font-size: 12px; font-weight: 600; opacity: .95; line-height: 1.25; position: relative; z-index: 1; }
.fsum .nx strong { display: block; font-size: 16px; font-variant-numeric: tabular-nums; }
.pod { flex: none; width: 252px; min-height: 150px; border-radius: 24px; background: var(--surface); box-shadow: var(--shadow); position: relative; overflow: hidden; padding: 14px 14px 12px; display: grid; grid-template-columns: 66px minmax(0, 1fr); grid-template-rows: auto 1fr auto; column-gap: 12px; scroll-snap-align: start; border: 0; text-align: left; animation: podIn .6s cubic-bezier(.2,.9,.3,1.1) both; transition: transform .3s cubic-bezier(.2,.8,.2,1.4), box-shadow .3s; }
@media (hover: hover) { .pod:hover { transform: translateY(-4px) rotate(-.6deg); box-shadow: 0 2px 4px rgba(27,21,48,.08), 0 18px 34px rgba(27,21,48,.13); } }
.pod::before { content: ""; position: absolute; width: 200px; height: 200px; border-radius: 50%; right: -80px; top: -100px; background: radial-gradient(circle, var(--pc) 0%, transparent 68%); opacity: .24; animation: drift 7s ease-in-out infinite alternate; pointer-events: none; }
@keyframes drift { to { transform: translate(-26px, 18px) scale(1.15); } }
@keyframes podIn { from { opacity: 0; transform: translateY(14px) scale(.96); } }
.ringav { grid-row: 1 / 3; width: 66px; height: 66px; position: relative; }
.ringav > svg { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); }
.ringav .arc { animation: arcIn 1.3s .2s cubic-bezier(.2,.8,.2,1) both; }
@keyframes arcIn { from { stroke-dashoffset: 188.5; } }
.ringav .av { position: absolute; inset: 7px; width: auto; height: auto; font-size: 22px; }
.pres { position: absolute; right: -3px; bottom: -3px; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; color: #fff; border: 2.5px solid var(--surface); z-index: 1; }
.pres .ic { width: 13px; height: 13px; display: block; }
.pres.home { background: var(--good); }
.pres.away { background: var(--warn); }
.pres.fresh::after { content: ""; position: absolute; inset: -4px; border-radius: 50%; border: 2px solid var(--good); animation: ping2 1.8s ease-out infinite; }
@keyframes ping2 { to { transform: scale(1.8); opacity: 0; } }
.pod .nm { font-weight: 800; font-size: 16px; line-height: 1.15; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kidpod .nm, .kidpod .pst { padding-right: 34px; }
.pst { display: block; font-size: 12px; color: var(--muted); margin-top: 1px; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.facts { display: flex; gap: 5px; flex-wrap: nowrap; overflow: hidden; align-self: start; margin-top: 6px; min-width: 0; }
.fact { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 800; padding: 2px 8px; border-radius: 999px; background: var(--surface-2); white-space: nowrap; }
.fact .ic { width: 13px; height: 13px; }
.fact.fpts { color: var(--violet); }
.fact.fpts .ic { animation: twinkle 2.6s ease-in-out infinite; }
.fact.flame .ic { color: var(--coral); animation: flicker .9s ease-in-out infinite alternate; transform-origin: 50% 90%; }
@keyframes twinkle { 50% { transform: scale(1.3) rotate(20deg); } }
@keyframes flicker { from { transform: scale(1) rotate(-5deg); } to { transform: scale(1.18) rotate(5deg); } }
.pod .next { grid-column: 1 / -1; display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 12.5px; font-weight: 600; padding: 7px 10px; border-radius: 12px; background: color-mix(in srgb, var(--pc) 11%, var(--surface-2)); min-width: 0; position: relative; z-index: 1; }
.pod .next .ic { width: 15px; height: 15px; color: var(--pc); }
.pod .next span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pod .next b { font-variant-numeric: tabular-nums; white-space: nowrap; }
.stay { position: absolute; left: 0; right: 0; top: 0; height: 4px; background: var(--surface-2); }
.stay i { display: block; height: 100%; background: var(--pc); border-radius: 0 4px 4px 0; animation: fill 1.2s .3s cubic-bezier(.2,.8,.2,1) both; transform-origin: left; }
.mini-pet { position: absolute; right: 8px; top: 8px; width: 40px; height: 40px; animation: bob 2.6s ease-in-out infinite; }
.mini-pet svg { width: 100%; height: 100%; overflow: visible; }
@keyframes bob { 50% { transform: translateY(-4px) rotate(5deg); } }
.av.photo { color: transparent; }
/* EV Planners prisur */
.evp-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.batt { display: inline-flex; gap: 6px; align-items: center; font-weight: 800; padding: 6px 12px; border-radius: 999px; background: var(--surface-2); white-space: nowrap; }
.batt .ic { width: 18px; height: 18px; color: var(--good); }
.dial-wrap { position: relative; width: min(100%, 300px); aspect-ratio: 1; margin: 10px auto 4px; }
.dial { width: 100%; height: 100%; overflow: visible; }
.dial .face { fill: color-mix(in srgb, var(--ink) 3%, transparent); stroke: var(--line); }
.dial .tick { stroke: var(--muted); stroke-opacity: .35; stroke-width: 1.2; }
.dial .tick.major { stroke-opacity: .8; stroke-width: 2; }
.dial .hour { font-size: 13px; fill: var(--muted); font-family: var(--font-body); font-weight: 600; }
.dial .bar { opacity: .92; transform-origin: 200px 200px; animation: barIn .7s cubic-bezier(.2,.8,.2,1) both; }
.dial .bar:hover { opacity: 1; }
@keyframes barIn { from { opacity: 0; transform: scale(.82); } }
.dial .window { fill: none; stroke: url(#evp-win); stroke-width: 18; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; animation: sweep 1.1s .35s cubic-bezier(.6,0,.2,1) forwards; }
.dial .window.past { opacity: .35; }
.dial .window-glow { fill: none; stroke: #A3E635; stroke-width: 18; stroke-linecap: round; opacity: .35; }
@keyframes sweep { to { stroke-dashoffset: 0; } }
.dial .needle { stroke: var(--ink); stroke-width: 2.5; stroke-linecap: round; }
.dial .needle-dot { fill: var(--ink); }
.dial-center { position: absolute; inset: 31%; display: grid; place-content: center; justify-items: center; text-align: center; gap: 2px; pointer-events: none; }
.dial-center strong { font-family: var(--font-display); font-size: 30px; font-weight: 800; letter-spacing: -.5px; font-variant-numeric: tabular-nums; line-height: 1.05; }
.dial-center span { color: var(--muted); font-size: 13px; font-variant-numeric: tabular-nums; }
.dial-center em { font-style: normal; color: var(--good); font-weight: 700; font-size: 12.5px; }
.status-pill { display: flex; align-items: center; gap: 10px; padding: 8px 14px; border-radius: 999px; border: 1px solid var(--line); font-weight: 600; width: fit-content; margin: 6px auto 0; font-size: 14px; }
.status-pill i { width: 10px; height: 10px; border-radius: 50%; background: var(--muted); }
.status-pill.on i { background: var(--good); box-shadow: 0 0 0 0 color-mix(in srgb, var(--good) 70%, transparent); animation: ping3 1.6s ease-out infinite; }
@keyframes ping3 { to { box-shadow: 0 0 0 10px transparent; } }
/* Ønskeskyen */
.osky { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 800; color: #2F80ED; background: color-mix(in srgb, #2F80ED 12%, var(--surface)); padding: 4px 10px; border-radius: 999px; white-space: nowrap; }
.osky .ic { width: 15px; height: 15px; }
.wishes { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
.wish { display: grid; grid-template-columns: 64px minmax(0, 1fr); gap: 4px 12px; align-items: center; padding: 10px; border-radius: 16px; background: var(--surface-2); animation: pop .45s both; }
.wish .btn { grid-column: 2; justify-self: start; }
.thumb { width: 64px; height: 64px; border-radius: 14px; background: var(--surface); display: grid; place-items: center; font-size: 32px; box-shadow: var(--shadow); grid-row: span 2; }
.fav { color: #2F80ED; display: inline-flex; margin-left: 6px; vertical-align: -2px; }
.fav .ic { width: 15px; height: 15px; }
.res { display: inline-flex; gap: 4px; align-items: center; font-size: 12px; font-weight: 700; color: var(--good); margin-top: 3px; }
.res .ic { width: 12px; height: 12px; }
.osky-foot { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: space-between; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--line); font-size: 13px; color: var(--muted); }
.spin .ic { animation: spin .8s linear; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Forslag til familiebåndet */
.band-pick { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; align-items: center; margin-bottom: 12px; padding-bottom: 2px; }
.band-pick span { font-size: 11px; font-weight: 800; letter-spacing: .7px; text-transform: uppercase; color: var(--muted); margin-right: 2px; flex: none; }
.band-pick button { flex: none; border: 1.5px solid var(--line); background: var(--surface); border-radius: 999px; padding: 5px 12px; font-size: 13px; font-weight: 700; color: var(--muted); }
.band-pick button[aria-pressed="true"] { background: var(--ink); border-color: var(--ink); color: var(--bg); }
/* 1. Historier */
.stories { display: flex; justify-content: space-between; gap: 4px; padding: 4px 0; }
.story { flex: 1; min-width: 0; border: 0; background: none; padding: 0; display: flex; flex-direction: column; align-items: center; gap: 3px; animation: podIn .55s cubic-bezier(.2,.9,.3,1.2) both; }
.sr { position: relative; width: 68px; height: 68px; }
.sr > svg { position: absolute; inset: 0; width: 100%; height: 100%; animation: ringSpin 1s cubic-bezier(.2,.8,.2,1) both; }
@keyframes ringSpin { from { transform: rotate(-120deg); opacity: 0; } }
.sr .av { position: absolute; inset: 7px; width: auto; height: auto; font-size: 22px; transition: transform .2s; }
.story:active .av { transform: scale(.92); }
.story.fresh .sr::after { content: ""; position: absolute; inset: -2px; border-radius: 50%; border: 2px solid var(--pc); animation: ping2 2s ease-out infinite; }
.sbadge { position: absolute; bottom: -7px; left: 50%; transform: translateX(-50%); white-space: nowrap; display: inline-flex; align-items: center; gap: 3px; background: var(--gold); color: #1B1530; font-size: 11px; font-weight: 800; border-radius: 999px; padding: 1px 6px 1px 4px; border: 2px solid var(--surface); }
.sbadge .ic { width: 11px; height: 11px; flex: none; }
.sdot { position: absolute; right: 2px; top: 2px; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid var(--surface); }
.sdot.in { background: var(--good); } .sdot.out { background: var(--warn); }
.story b { font-size: 13px; font-weight: 800; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.story small { font-size: 11.5px; color: var(--muted); font-weight: 600; margin-top: -3px; }
.story .sr { margin-bottom: 6px; }
.story .snext { display: none; color: var(--pc); font-weight: 700; margin-top: 2px; }
@media (min-width: 861px) { .story .snext { display: block; } }
.storyv { position: fixed; inset: 0; z-index: 80; background: radial-gradient(120% 90% at 30% 10%, var(--pc), #0f0e19 78%); color: #fff; display: grid; place-items: center; padding: env(safe-area-inset-top, 0px) max(16px, env(safe-area-inset-right, 0px)) env(safe-area-inset-bottom, 0px) max(16px, env(safe-area-inset-left, 0px)); user-select: none; -webkit-user-select: none; }
.storyv.first { animation: fadeIn .25s both; }
.sv-in { width: min(420px, 100%); height: min(640px, 100%); display: flex; flex-direction: column; gap: 18px; padding: 16px 4px 24px; }
.sv-bars { display: flex; gap: 4px; }
.sv-bars span { flex: 1; height: 3px; border-radius: 3px; background: rgba(255,255,255,.3); overflow: hidden; }
.sv-bars i { display: block; height: 100%; width: 0; background: #fff; }
.sv-bars i.full { width: 100%; }
.sv-bars i.run { animation: svrun 4.2s linear forwards; }
@keyframes svrun { to { width: 100%; } }
.sv-head { display: flex; align-items: center; gap: 10px; font-size: 16px; }
.sv-head .av { border: 2px solid #fff; }
.sv-x { margin-left: auto; border: 0; background: rgba(255,255,255,.18); color: #fff; width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; }
.sv-x .ic { width: 18px; height: 18px; }
.sv-body { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 12px; animation: svIn .45s cubic-bezier(.2,.9,.3,1.1) both; }
@keyframes svIn { from { opacity: 0; transform: translateY(16px) scale(.97); } }
.sv-body small { font-size: 13px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; opacity: .75; }
.sv-body h3 { font-family: var(--font-display); font-size: clamp(34px, 9vw, 52px); line-height: 1.02; margin: 0; letter-spacing: -1px; display: flex; align-items: center; gap: 10px; text-wrap: balance; }
.sv-body h3 .ic { width: .8em; height: .8em; color: #FFD24A; }
.sv-body p { margin: 0; font-size: 17px; font-weight: 600; opacity: .92; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.sv-body p .ic { width: 18px; height: 18px; }
.sv-body p.big { font-family: var(--font-display); font-size: 32px; font-weight: 800; }
.sbar { height: 10px; border-radius: 10px; background: rgba(255,255,255,.25); overflow: hidden; }
.sbar i { display: block; height: 100%; background: #fff; border-radius: 10px; animation: fill 1s .2s cubic-bezier(.2,.8,.2,1) both; transform-origin: left; }
.spet { width: 120px; height: 120px; color: #fff; animation: bob 2.4s ease-in-out infinite; }
.spet svg { width: 100%; height: 100%; overflow: visible; }
.sv-go { align-self: center; background: #fff; color: #1B1530; }
.sv-hint { font-size: 12px; opacity: .6; text-align: center; }
/* 2. Huset */
.hb { display: flex; height: 150px; border-radius: 24px; overflow: hidden; background: linear-gradient(180deg, color-mix(in srgb, var(--petrol) 16%, var(--surface)), var(--surface)); box-shadow: var(--shadow); }
.hb-house { flex: 0 0 64%; position: relative; padding: 8px 6px 10px 14px; display: flex; flex-direction: column; }
.hb-roof { height: 30px; margin: 0 -4px; background: #4A3F78; clip-path: polygon(0 100%, 50% 0, 100% 100%); flex: none; }
.hb-house::before { content: ""; position: absolute; left: 72%; top: 10px; width: 12px; height: 20px; background: #4A3F78; }
.hb-smoke { position: absolute; left: calc(72% + 2px); top: 0; width: 10px; }
.hb-smoke i { position: absolute; left: 0; top: 0; width: 9px; height: 9px; border-radius: 50%; background: color-mix(in srgb, var(--muted) 45%, transparent); animation: smoke 3s ease-out infinite; }
.hb-smoke i:nth-child(2) { animation-delay: 1s; } .hb-smoke i:nth-child(3) { animation-delay: 2s; }
@keyframes smoke { from { transform: translate(0, 4px) scale(.6); opacity: .9; } to { transform: translate(14px, -18px) scale(1.6); opacity: 0; } }
.hb-body { flex: 1; border-radius: 0 0 16px 16px; background: linear-gradient(180deg, #FFE9B8, #FFD27A); box-shadow: inset 0 0 28px rgba(255,160,40,.35); padding: 6px 10px; display: flex; flex-direction: column; color: #1B1530; min-height: 0; }
.hb-top { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; font-weight: 800; }
.hb-top span { display: inline-flex; gap: 4px; align-items: center; white-space: nowrap; }
.hb-top .ic { width: 14px; height: 14px; }
.hb-people { display: flex; gap: 6px; flex: 1; align-items: center; justify-content: space-around; }
.hb-p { border: 0; background: none; padding: 0; display: flex; flex-direction: column; align-items: center; gap: 1px; animation: podIn .5s both; color: #1B1530; }
.hb-p .av { width: 38px; height: 38px; font-size: 15px; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,.15); }
.hb-p small { font-size: 10.5px; font-weight: 800; }
.hb-out { flex: 1; position: relative; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 12px; }
.hb-road { position: absolute; left: 0; right: 0; bottom: 58px; height: 3px; background: repeating-linear-gradient(90deg, var(--muted) 0 8px, transparent 8px 14px); opacity: .45; animation: road 1.4s linear infinite; }
@keyframes road { to { background-position: 14px 0; } }
.hb-walker { border: 0; background: none; padding: 0; display: flex; flex-direction: column; align-items: center; gap: 3px; position: relative; z-index: 1; color: var(--ink); }
.hb-walker .av { width: 42px; height: 42px; border: 2.5px solid var(--warn); animation: walk .55s ease-in-out infinite alternate; }
.hb-walker small { font-size: 10.5px; font-weight: 700; color: var(--muted); text-align: center; line-height: 1.2; }
@keyframes walk { from { transform: translateY(0) rotate(-4deg); } to { transform: translateY(-4px) rotate(4deg); } }
/* 3. Dagens spor */
.lanes { padding: 10px 14px 12px; }
.lanes-in { position: relative; display: flex; flex-direction: column; gap: 4px; padding-top: 16px; }
.lanes-axis { position: absolute; left: 0; right: 0; top: 0; height: 14px; font-size: 10.5px; font-weight: 700; color: var(--muted); }
.lanes-axis span { position: absolute; transform: translateX(-50%); }
.lane { display: flex; align-items: center; gap: 8px; border: 0; background: none; padding: 0; width: 100%; height: 24px; }
.lane .av { width: 26px; height: 26px; }
.ltrack { flex: 1; position: relative; height: 12px; border-radius: 6px; background: var(--surface-2); }
.lblk span { display: none; }
@media (min-width: 861px) { .ltrack { height: 18px; } .lane { height: 26px; } .lblk span { display: block; font-size: 10.5px; font-weight: 700; color: #fff; padding: 1px 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-style: normal; } }
.lblk { position: absolute; top: 0; bottom: 0; border-radius: 6px; overflow: hidden; transform-origin: left; animation: fill .9s cubic-bezier(.2,.8,.2,1) both; }
.laway { position: absolute; top: 0; bottom: 0; border-radius: 6px; background: repeating-linear-gradient(135deg, color-mix(in srgb, var(--warn) 60%, transparent) 0 4px, transparent 4px 8px); }
.lmark { position: absolute; top: -4px; width: 4px; height: 20px; border-radius: 2px; background: var(--good); transform: translateX(-50%); }
.lnow { position: absolute; top: 14px; bottom: -4px; width: 2px; background: var(--ink); border-radius: 2px; pointer-events: none; }
.lnow b { position: absolute; bottom: 100%; left: 50%; transform: translate(-50%, 2px); font-size: 10px; background: var(--ink); color: var(--bg); padding: 0 5px; border-radius: 999px; font-variant-numeric: tabular-nums; }
/* 4. Bobler */
.bub { display: flex; gap: 10px; height: 156px; }
.bub-home { flex: 0 0 72%; position: relative; border-radius: 999px / 78px; background: radial-gradient(ellipse at 50% 55%, color-mix(in srgb, var(--petrol) 22%, var(--surface)) 0%, color-mix(in srgb, var(--petrol) 7%, var(--surface)) 72%); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--petrol) 28%, transparent); }
.bub-away { flex: 1; position: relative; border-radius: 999px / 78px; border: 2px dashed color-mix(in srgb, var(--warn) 55%, transparent); }
.bub-l { position: absolute; top: 9px; left: 50%; transform: translateX(-50%); font-size: 11.5px; font-weight: 800; color: var(--muted); display: flex; gap: 4px; align-items: center; white-space: nowrap; }
.bub-l .ic { width: 13px; height: 13px; }
.bubble { position: absolute; width: var(--s); height: var(--s); margin: calc(var(--s) / -2) 0 0 calc(var(--s) / -2); border: 0; background: none; padding: 0; animation: floaty 5s ease-in-out infinite; }
@keyframes floaty { 0%, 100% { transform: translate(0, 0); } 33% { transform: translate(4px, -6px); } 66% { transform: translate(-5px, 3px); } }
.bubble .av { width: 100%; height: 100%; font-size: calc(var(--s) * .38); box-shadow: 0 6px 16px color-mix(in srgb, var(--pc) 40%, transparent), 0 0 0 3px var(--surface); }
.bubble small { position: absolute; left: 50%; top: 100%; transform: translateX(-50%); font-size: 10.5px; font-weight: 800; white-space: nowrap; margin-top: 3px; color: var(--ink); }
.orbit { position: absolute; inset: -9px; animation: spin 7s linear infinite; pointer-events: none; }
.sat { position: absolute; top: -3px; left: 50%; width: 24px; margin-left: -12px; text-align: center; background: var(--gold); color: #1B1530; font-size: 10px; font-weight: 800; border-radius: 999px; padding: 1px 0; animation: spin 7s linear infinite reverse; }
/* 5. Live-linje */
.live { display: flex; align-items: center; gap: 14px; padding: 12px 16px; min-height: 72px; }
.stack { display: flex; flex: none; }
.stk { border: 0; background: none; padding: 0; margin-left: -10px; position: relative; transition: transform .2s; }
.stk:first-child { margin-left: 0; }
@media (hover: hover) { .stk:hover { transform: translateY(-3px); z-index: 1; } }
.stk .av { width: 40px; height: 40px; border: 3px solid var(--surface); }
.stk i { position: absolute; right: 0; bottom: 1px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--surface); }
.stk i.in { background: var(--good); } .stk i.out { background: var(--warn); }
.live-win { flex: 1; min-width: 0; height: 44px; overflow: hidden; }
.live-track { transition: transform .6s cubic-bezier(.2,.8,.2,1); }
.live-it { height: 44px; display: flex; align-items: center; gap: 10px; border: 0; background: none; padding: 0; width: 100%; text-align: left; font-size: 14.5px; color: var(--ink); }
.live-it > span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.live-ic { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; background: color-mix(in srgb, var(--petrol) 16%, var(--surface)); color: var(--petrol); flex: none; }
.live-ic .ic { width: 15px; height: 15px; }
.live-tag { flex: none; display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; letter-spacing: .6px; text-transform: uppercase; color: var(--bad); }
.live-tag i { width: 8px; height: 8px; border-radius: 50%; background: var(--bad); animation: blink 1.4s ease-in-out infinite; }
@keyframes blink { 50% { opacity: .25; } }

/* Kort over hinanden */
.fband.stackv { flex-direction: column; overflow: visible; gap: 10px; padding: 0; margin: 0; -webkit-mask-image: none; mask-image: none; }
.stackv .fsum { width: auto; height: auto; flex-direction: row; align-items: center; gap: 14px; padding: 12px 18px; border-radius: 20px; animation-name: rowIn; }
.stackv .fsum b { font-size: 30px; margin: 0; }
.stackv .fsum .dots { margin: 0; }
.stackv .fsum .nx { margin-left: auto; text-align: right; }
.stackv .pod { width: 100%; min-height: 0; grid-template-columns: 58px minmax(0, 1fr) auto; grid-template-rows: auto auto; align-items: center; column-gap: 14px; row-gap: 2px; padding: 12px 14px; border-radius: 20px; animation-name: rowIn; }
@keyframes rowIn { from { opacity: 0; transform: translateX(-14px); } }
@media (hover: hover) { .stackv .pod:hover { transform: translateX(4px); } }
.stackv .pod::before { right: 120px; top: -110px; }
.stackv .ringav { width: 58px; height: 58px; grid-row: 1 / 3; }
.stackv .ringav .av { inset: 6px; font-size: 19px; }
.stackv .who { grid-column: 2; min-width: 0; align-self: end; }
.stackv .pod .nm { display: flex; align-items: center; gap: 5px; overflow: visible; }
.ipet { width: 22px; height: 22px; flex: none; display: inline-block; animation: bob 2.6s ease-in-out infinite; }
.ipet svg { width: 100%; height: 100%; overflow: visible; }
.stackv .facts { grid-column: 2; margin-top: 2px; align-self: start; }
.rlane { display: none; }
@media (min-width: 861px) {
  .stackv .pod { grid-template-columns: 58px minmax(200px, 280px) minmax(0, 1fr) auto; }
  .rlane { display: block; grid-column: 3; grid-row: 1 / 3; position: relative; height: 40px; align-self: center; margin-right: 6px; }
  .rlane .ltrack { position: absolute; left: 0; right: 0; top: 6px; height: 18px; }
  .rlane .lblk span { display: none !important; }
  .rlane .rnow { position: absolute; top: -5px; bottom: -5px; width: 2px; background: var(--ink); border-radius: 2px; }
  .rl-ax { position: absolute; left: 0; right: 0; bottom: 0; display: flex; justify-content: space-between; font-size: 10px; font-weight: 700; color: var(--muted); }
}
.stackv .pod .next { grid-column: -2 / -1; grid-row: 1 / 3; margin: 0; flex-direction: column; align-items: flex-end; justify-content: center; gap: 2px; padding: 8px 12px; min-width: 150px; max-width: 240px; align-self: stretch; }
.stackv .pod .next > .nl, .stackv .pod .next > b { flex: none !important; }
.stackv .pod .next .nl { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); font-weight: 700; max-width: 100%; min-width: 0; }
.stackv .pod .next .nl span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.stackv .pod .next b { font-size: 16px; font-family: var(--font-display); font-weight: 800; color: var(--ink); }
@media (max-width: 640px) {
  .stackv .pod { grid-template-columns: 50px minmax(0, 1fr) auto; column-gap: 10px; padding: 10px 12px; }
  .stackv .ringav { width: 50px; height: 50px; }
  .stackv .ringav .av { inset: 5px; font-size: 16px; }
  .stackv .pres { width: 20px; height: 20px; }
  .stackv .pod .next { min-width: 0; max-width: 112px; padding: 6px 9px; }
  .stackv .pod .next .nl { font-size: 11px; }
  .stackv .pod .next .nl .ic { display: none; }
  .stackv .pod .next b { font-size: 13.5px; white-space: nowrap; }
  .stackv .fact { font-size: 11px; padding: 2px 6px; }
  .stackv .fsum { padding: 10px 14px; gap: 10px; }
  .stackv .fsum b { font-size: 24px; }
  .stackv .fsum .dots i { width: 10px; height: 10px; }
  .stackv .fsum .lbl { display: none; }
}

/* Forsiden: familien til venstre på tablet og pc */
.homegrid { display: grid; gap: 16px; align-items: start; }
.home-main { min-width: 0; }
@media (min-width: 1024px) {
  .homegrid { grid-template-columns: minmax(330px, 390px) minmax(0, 1fr); gap: 20px; }
  .home-fam { position: sticky; top: calc(env(safe-area-inset-top, 0px) + 72px); }
}
@media (min-width: 641px) and (max-width: 1023px) {
  .fband.stackv { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .stackv .fsum { grid-column: 1 / -1; }
}
.rlane { display: none !important; }
.stackv .pod { border: 1px solid color-mix(in srgb, var(--pc) 14%, var(--line)); }
.stackv .pod .next { min-width: 0 !important; width: 124px; max-width: none !important; }
@media (max-width: 640px) { .stackv .pod .next { width: 104px; } }
.stackv .facts { flex-wrap: nowrap; }
.nmt { white-space: nowrap; flex: none; }
.nbat { margin-left: auto; flex: none; display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: var(--muted); font-variant-numeric: tabular-nums; }
.bglyph { width: 17px; height: 9px; border: 1.5px solid currentColor; border-radius: 3px; padding: 1px; position: relative; display: inline-block; }
.bglyph::after { content: ""; position: absolute; right: -4px; top: 1.5px; width: 2px; height: 3px; border-radius: 0 1px 1px 0; background: currentColor; }
.bglyph i { display: block; height: 100%; border-radius: 1px; background: var(--good); }
.nbat.low { color: var(--bad); }
.nbat.low .bglyph i { background: var(--bad); }
.stackv .pod::before { right: -60px; top: -120px; }
@media (min-width: 641px) { .stackv .pod { grid-template-columns: 56px minmax(0, 1fr) auto !important; } }
/* Vinduer åbner fra toppen */
.sheet-bg { place-items: start center !important; }
.sheet { border-radius: 0 0 24px 24px !important; padding-top: calc(20px + env(safe-area-inset-top, 0px)) !important; padding-bottom: 20px !important; animation: down .4s cubic-bezier(.2,.9,.3,1) both !important; box-shadow: 0 14px 40px rgba(0,0,0,.28) !important; }
@keyframes down { from { transform: translateY(-48px); opacity: 0; } }
@media (min-width: 700px) { .sheet { margin-top: 24px; border-radius: 24px !important; padding-top: 22px !important; } }

/* Hovedets knapper */
.hbtn { width: 38px; height: 38px; display: grid; place-items: center; padding: 0; flex: none; }
.hbtn > .ic { width: 19px; height: 19px; }
.ashield { position: relative; display: grid; place-items: center; }
.ashield .ic { width: 20px; height: 20px; color: #fff; }
.ashield::after { content: ""; position: absolute; right: -4px; bottom: -3px; width: 10px; height: 10px; border-radius: 50%; background: var(--ac); border: 2px solid rgba(255,255,255,.9); }
.ashield.armed::after { animation: ping3 1.6s ease-out infinite; box-shadow: 0 0 0 0 var(--ac); }
/* Quick actions */
.quick { display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none; padding: 2px 2px 14px; margin: 0 -2px 4px; }
.quick::-webkit-scrollbar { display: none; }
.qa { flex: none; width: 96px; border: 0; background: var(--surface); box-shadow: var(--shadow); border-radius: 22px; padding: 12px 6px 10px; display: flex; flex-direction: column; align-items: center; gap: 4px; position: relative; animation: podIn .5s cubic-bezier(.2,.9,.3,1.2) both; transition: transform .2s; color: var(--ink); }
.qa:active { transform: scale(.94); }
.qa-ic { width: 46px; height: 46px; border-radius: 16px; display: grid; place-items: center; color: #fff; background: linear-gradient(145deg, color-mix(in srgb, var(--qc) 80%, #fff), var(--qc)); box-shadow: 0 6px 16px color-mix(in srgb, var(--qc) 40%, transparent); }
.qa-ic .ic { width: 24px; height: 24px; }
.qa-ic.sm { width: 38px; height: 38px; border-radius: 13px; flex: none; }
.qa-ic.sm .ic { width: 20px; height: 20px; }
.qa-ic.big { width: 76px; height: 76px; border-radius: 26px; margin: 4px auto 10px; }
.qa-ic.big .ic { width: 38px; height: 38px; }
.qa b { font-size: 13.5px; font-weight: 800; }
.qa small { font-size: 11px; color: var(--muted); font-weight: 600; white-space: nowrap; }
.qa-badge { position: absolute; top: 6px; right: 12px; min-width: 20px; height: 20px; padding: 0 5px; border-radius: 999px; background: var(--bad); color: #fff; font-size: 11px; font-weight: 800; display: grid; place-items: center; border: 2px solid var(--surface); }
.qa.ghost { opacity: .45; box-shadow: none; background: transparent; border: 1.5px dashed var(--line); }
.qa.ghost .qa-ic { background: var(--line); box-shadow: none; color: var(--muted); }
.qa.add { background: transparent; box-shadow: none; border: 1.5px dashed var(--line); }
.qa.add .qa-ic { background: var(--surface-2); color: var(--muted); box-shadow: none; }
.qa-alarm .qa-ic.armed { animation: glow 1.8s ease-in-out infinite; }
@keyframes glow { 50% { box-shadow: 0 0 0 8px color-mix(in srgb, var(--qc) 25%, transparent), 0 6px 16px color-mix(in srgb, var(--qc) 40%, transparent); } }
.qa.fired .qa-ic { animation: fire .6s cubic-bezier(.2,.9,.3,1.4); }
@keyframes fire { 40% { transform: scale(1.22) rotate(-8deg); } }
.qa-sheet { text-align: center; }
.qa-sheet h2 { margin-top: 4px; }
.optrow { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px; padding: 12px 14px; border-radius: 14px; background: var(--surface-2); font-weight: 700; text-align: left; }
.gopill { position: fixed; z-index: 75; left: 50%; transform: translateX(-50%); top: calc(12px + env(safe-area-inset-top, 0px)); display: flex; align-items: center; gap: 10px; padding: 8px 8px 8px 8px; border-radius: 20px; background: var(--surface); box-shadow: 0 12px 34px rgba(0,0,0,.25); overflow: hidden; width: min(420px, calc(100% - 32px)); animation: down .4s cubic-bezier(.2,.9,.3,1) both; }
.gopill > span:nth-child(2) { flex: 1; min-width: 0; }
.gopill .qa-ic { width: 36px; height: 36px; border-radius: 12px; }
.gopill .qa-ic .ic { width: 19px; height: 19px; }
.gopill i { position: absolute; left: 0; bottom: 0; height: 3px; background: var(--qc); transition: width 1s linear; }
/* Alarm */
.al-head { display: flex; gap: 14px; align-items: center; margin-bottom: 14px; }
.al-head h2 { margin: 2px 0; }
.al-shield { width: 64px; height: 64px; border-radius: 22px; display: grid; place-items: center; color: #fff; background: var(--ac); flex: none; position: relative; }
.al-shield .ic { width: 34px; height: 34px; }
.al-shield.armed::after { content: ""; position: absolute; inset: -6px; border-radius: 26px; border: 3px solid var(--ac); animation: ping2 1.8s ease-out infinite; }
.al-modes { display: grid; grid-template-columns: repeat(var(--n, 2), minmax(0, 1fr)); gap: 10px; }
.al-mode { border: 0; border-radius: 18px; padding: 14px 10px; background: color-mix(in srgb, var(--mc) 12%, var(--surface-2)); display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; color: var(--ink); }
.al-mode .ic { width: 28px; height: 28px; color: var(--mc); }
.al-mode b { font-size: 15px; }
.al-mode small { font-size: 11.5px; color: var(--muted); line-height: 1.25; }
.al-mode.big { width: 100%; flex-direction: row; justify-content: center; gap: 10px; padding: 16px; }
/* Indstillinger */
.feats { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px; }
.feat { display: grid; grid-template-columns: 44px minmax(0, 1fr) auto; gap: 12px; align-items: center; text-align: left; border: 1.5px solid var(--line); background: var(--surface); border-radius: 18px; padding: 12px; color: var(--ink); transition: background .3s, border-color .3s, opacity .3s; animation: pop .4s both; }
.feat.on { background: color-mix(in srgb, var(--fc) 9%, var(--surface)); border-color: color-mix(in srgb, var(--fc) 40%, var(--line)); }
.feat:not(.on) { opacity: .7; }
.feat-ic { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; color: #fff; background: var(--fc); transition: filter .3s, transform .3s; }
.feat:not(.on) .feat-ic { filter: grayscale(1); opacity: .5; }
.feat.on .feat-ic { transform: rotate(-6deg); }
.feat-ic .ic { width: 22px; height: 22px; }
.feat-t b { display: block; font-size: 14.5px; }
.feat-t small { display: block; font-size: 12px; color: var(--muted); line-height: 1.3; }
.feat .toggle { pointer-events: none; }
.feat.on .toggle { background: var(--tc); }
.feat.on .toggle::after { transform: translateX(16px); }
.qal { display: flex; flex-direction: column; gap: 8px; }
.qar { display: grid; grid-template-columns: 38px minmax(0, 1fr) auto auto; gap: 12px; align-items: center; padding: 10px; border-radius: 16px; background: var(--surface-2); }
.qar-t { min-width: 0; }
.qar-t b { display: block; }
.qar-t small { display: block; font-size: 12px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cond { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 700; color: var(--good); margin-top: 3px; }
.cond.timed { color: var(--violet); }
.cond .ic { width: 13px; height: 13px; }
.qar-who { display: flex; gap: 3px; }
.whob { border: 0; background: none; padding: 0; border-radius: 50%; transition: opacity .2s, transform .2s; }
.whob:not(.on) { opacity: .25; filter: grayscale(1); }
.whob.on .av { box-shadow: 0 0 0 2px var(--surface-2), 0 0 0 4px var(--pc); }
.sugg { margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--line); }
.sugg-row { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
.chip.sg { border: 1.5px dashed color-mix(in srgb, var(--qc) 50%, var(--line)); background: var(--surface); font-weight: 700; cursor: pointer; }
.chip.sg .ic { width: 15px; height: 15px; color: var(--qc); }
.chip.sg span { color: var(--qc); font-weight: 800; }
.iconpick { display: flex; gap: 6px; flex-wrap: wrap; }
.iconpick button { width: 40px; height: 40px; border-radius: 12px; border: 1.5px solid var(--line); background: var(--surface); display: grid; place-items: center; }
.iconpick button .ic { width: 20px; height: 20px; }
.iconpick button[aria-pressed="true"] { border-color: var(--ink); background: var(--ink); color: var(--bg); }

/* Skrald i hovedet */
.greet .line .hl { display: inline-flex; align-items: center; gap: 7px; }
.wchip { border: 0; background: rgba(255,255,255,.16); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); color: #fff; font-weight: 700; font-size: 14px; border-radius: 999px; padding: 4px 10px 4px 8px; text-shadow: none; }
.wchip.due { background: #fff; color: #1B1530; animation: nudge 2.4s ease-in-out infinite; }
@keyframes nudge { 0%, 70%, 100% { transform: none; } 75% { transform: rotate(-4deg); } 85% { transform: rotate(4deg); } }
.wdots { display: inline-flex; gap: 3px; }
.wdots i { width: 9px; height: 9px; border-radius: 3px; border: 1.5px solid rgba(255,255,255,.8); }
.bins { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
.bin-row { display: flex; align-items: center; gap: 14px; padding: 10px 12px; border-radius: 16px; background: var(--surface-2); animation: pop .45s both; }
.bin { width: 34px; height: 44px; flex: none; }
.bin-row:first-child .bin { animation: bob 2.4s ease-in-out infinite; }
.bin-n { display: flex; flex-direction: column; align-items: center; min-width: 46px; padding: 6px 8px; border-radius: 12px; background: var(--surface); }
.bin-n b { font-family: var(--font-display); font-size: 22px; line-height: 1; }
.bin-n small { font-size: 11px; color: var(--muted); font-weight: 700; }
.bin-n.due { background: var(--bad); color: #fff; }
.bin-n.due small { color: rgba(255,255,255,.85); }
.ev.wev { display: grid; grid-template-columns: 16px minmax(0, 1fr); column-gap: 6px; align-items: center; }
.ev.wev .ic { grid-row: span 2; width: 16px; height: 16px; color: var(--ec); }
/* + knappen */
.fab { position: fixed; right: max(18px, env(safe-area-inset-right, 0px)); bottom: calc(22px + env(safe-area-inset-bottom, 0px)); z-index: 55; display: flex; flex-direction: column; align-items: flex-end; gap: 12px; pointer-events: none; }
.fab > * { pointer-events: auto; }
.fab-scrim { position: fixed; inset: 0; background: rgba(15,14,25,.38); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); opacity: 0; pointer-events: none; transition: opacity .25s; z-index: -1; }
.fab.open .fab-scrim { opacity: 1; pointer-events: auto; }
.fab-list { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; pointer-events: none; }
.fab.open .fab-list { pointer-events: auto; }
.fi { display: flex; align-items: center; gap: 10px; border: 0; background: none; padding: 0; opacity: 0; transform: translateY(18px) scale(.6); transform-origin: right center; transition: opacity .22s, transform .32s cubic-bezier(.2,.9,.3,1.3); transition-delay: 0ms; color: inherit; }
.fab.open .fi { opacity: 1; transform: none; transition-delay: var(--d); }
.fi .fl { display: flex; flex-direction: column; align-items: flex-end; background: var(--surface); padding: 6px 12px; border-radius: 14px; box-shadow: var(--shadow); line-height: 1.15; }
.fi .fl b { font-size: 14px; color: var(--ink); }
.fi .fl small { font-size: 11.5px; color: var(--muted); font-weight: 600; }
.fi .qa-ic { width: 50px; height: 50px; border-radius: 17px; position: relative; }
.fi .qa-ic .ic { width: 25px; height: 25px; }
.fi.ghost { opacity: 0; }
.fab.open .fi.ghost { opacity: .5; }
.fi.ghost .qa-ic { background: var(--surface); color: var(--muted); box-shadow: var(--shadow); }
.fi.edit .qa-ic { background: var(--surface); color: var(--ink); box-shadow: var(--shadow); }
.fi .qa-ic.armed { animation: glow 1.8s ease-in-out infinite; }
.fab-btn { width: 62px; height: 62px; border-radius: 22px; border: 0; color: #fff; background: linear-gradient(145deg, #19B6A5, #6E4AFF); box-shadow: 0 10px 28px rgba(110,74,255,.45), 0 2px 6px rgba(0,0,0,.18); display: grid; place-items: center; position: relative; transition: transform .35s cubic-bezier(.2,.9,.3,1.4), border-radius .35s; }
.fab-btn .ic { width: 30px; height: 30px; stroke-width: 2.4; transition: transform .35s cubic-bezier(.2,.9,.3,1.4); }
.fab.open .fab-btn { border-radius: 50%; transform: scale(.94); }
.fab.open .fab-btn .ic { transform: rotate(135deg); }
.fab-btn:active { transform: scale(.9); }
.fab-dot { position: absolute; top: -3px; right: -3px; width: 16px; height: 16px; border-radius: 50%; border: 3px solid var(--bg); animation: ping3 1.6s ease-out infinite; }
@media (max-width: 640px) { .fab { bottom: calc(84px + env(safe-area-inset-bottom, 0px)); right: max(14px, env(safe-area-inset-right, 0px)); } .fab-btn { width: 56px; height: 56px; border-radius: 20px; } }

/* Profilmenu */
.pm-bg { position: fixed; inset: 0; z-index: 65; animation: fadeIn .15s both; }
.pm-bg.out { opacity: 0; transition: opacity .18s; }
.pm { position: absolute; top: calc(64px + env(safe-area-inset-top, 0px)); right: max(16px, env(safe-area-inset-right, 0px)); width: min(320px, calc(100% - 32px)); background: var(--surface); border-radius: 22px; box-shadow: 0 18px 50px rgba(0,0,0,.28), 0 0 0 1px var(--line); padding: 8px; transform-origin: top right; animation: pmIn .28s cubic-bezier(.2,.9,.3,1.2) both; }
@keyframes pmIn { from { opacity: 0; transform: scale(.85) translateY(-8px); } }
.pm-head { display: flex; align-items: center; gap: 12px; padding: 10px 10px 12px; border-bottom: 1px solid var(--line); margin-bottom: 6px; }
.pm-head .av { width: 46px; height: 46px; font-size: 18px; }
.pm-head b { display: block; font-size: 16px; }
.pm-head small { color: var(--muted); font-size: 12.5px; }
.pm-i { display: flex; align-items: center; gap: 12px; width: 100%; border: 0; background: none; padding: 10px; border-radius: 14px; text-align: left; color: var(--ink); }
.pm-i:hover, .pm-i:focus-visible { background: var(--surface-2); }
.pm-i > .ic { width: 20px; height: 20px; color: var(--muted); flex: none; }
.pm-i b { display: block; font-size: 14.5px; }
.pm-i small { display: block; font-size: 12px; color: var(--muted); }
.pm-i.fam { background: color-mix(in srgb, var(--violet) 9%, var(--surface)); margin: 4px 0; }
.pm-i.fam > .ic { color: var(--violet); }
/* Mine indstillinger */
.me-hero { display: flex; align-items: center; gap: 16px; padding: 18px; border-radius: 24px; background: linear-gradient(135deg, color-mix(in srgb, var(--pc) 22%, var(--surface)), var(--surface)); box-shadow: var(--shadow); flex-wrap: wrap; }
.me-hero .av { width: 64px; height: 64px; font-size: 26px; }
.me-hero h2 { margin: 0; font-family: var(--font-display); font-size: 26px; }
.me-hero small { color: var(--muted); font-weight: 600; }
.me-hero .btn { margin-left: auto; }
.me-r { grid-template-columns: 38px minmax(0, 1fr) auto auto !important; transition: opacity .25s; }
.me-r.off { opacity: .5; }
.ord { display: flex; }
.ord .iconbtn { width: 28px; height: 28px; }
.ord .iconbtn[disabled] { opacity: .25; }
/* Kom i gang */
.kig { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; padding: 16px; border-radius: 22px; background: linear-gradient(120deg, color-mix(in srgb, #F2B01E 16%, var(--surface)), color-mix(in srgb, #11A39A 14%, var(--surface))); margin-bottom: 16px; box-shadow: var(--shadow); }
.kig-t { flex: 1 1 200px; }
.kig-t .h2 { margin-top: 2px; }
.kig-row { display: flex; gap: 10px; flex-wrap: wrap; }
.kig-b { border: 0; background: var(--surface); border-radius: 18px; padding: 12px 14px; display: grid; grid-template-columns: 38px auto; grid-template-rows: auto auto; column-gap: 10px; align-items: center; text-align: left; box-shadow: var(--shadow); min-width: 170px; transition: transform .2s; color: var(--ink); }
@media (hover: hover) { .kig-b:hover { transform: translateY(-3px); } }
.kig-em { grid-row: span 2; width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center; font-size: 22px; background: color-mix(in srgb, var(--kc) 18%, var(--surface)); }
.kig-b small { color: var(--muted); font-size: 12px; }
/* Faste rutiner */
.rt-tabs { display: flex; gap: 6px; padding: 5px; border-radius: 18px; background: var(--surface); box-shadow: var(--shadow); width: fit-content; max-width: 100%; overflow-x: auto; scrollbar-width: none; }
.rt-tabs button { border: 0; background: none; border-radius: 13px; padding: 9px 14px; font-weight: 700; color: var(--muted); display: flex; gap: 7px; align-items: center; white-space: nowrap; }
.rt-tabs button[aria-selected="true"] { background: var(--ink); color: var(--bg); }
.rc-list { display: flex; flex-direction: column; gap: 8px; }
.rcr { display: grid; grid-template-columns: 44px minmax(0, 1fr) auto auto; gap: 10px; align-items: center; padding: 10px; border-radius: 16px; background: var(--surface-2); animation: pop .35s both; }
.rc-em { width: 44px; height: 44px; border-radius: 14px; background: var(--surface); display: grid; place-items: center; font-size: 24px; }
.rcr-t b { display: block; margin-bottom: 5px; }
.wd { display: flex; gap: 4px; flex-wrap: wrap; }
.wd button { width: 28px; height: 28px; border-radius: 50%; border: 1.5px solid var(--line); background: var(--surface); font-size: 11.5px; font-weight: 800; color: var(--muted); padding: 0; transition: background .2s, color .2s, transform .2s; }
.wd button[aria-pressed="true"] { background: var(--pc); border-color: var(--pc); color: #fff; transform: scale(1.05); }
.step { display: inline-flex; align-items: center; gap: 4px; background: var(--surface); border-radius: 999px; padding: 3px; font-weight: 800; color: var(--violet); }
.step .ic { width: 14px; height: 14px; color: var(--gold); }
.step button { width: 26px; height: 26px; border-radius: 50%; border: 0; background: var(--surface-2); font-weight: 800; color: var(--ink); }
.lnk { border: 0; background: none; color: var(--violet); font-weight: 700; padding: 0; text-decoration: underline; }
.chore-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 8px; }
.chore { position: relative; border: 1.5px solid var(--line); background: var(--surface); border-radius: 16px; padding: 10px 6px; display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 12.5px; font-weight: 700; text-align: center; color: var(--ink); transition: transform .15s, border-color .2s, background .2s; }
.chore span { font-size: 26px; }
.chore:active { transform: scale(.93); }
.chore.has { border-color: var(--good); background: color-mix(in srgb, var(--good) 10%, var(--surface)); }
.chore i { position: absolute; top: 6px; right: 6px; width: 20px; height: 20px; border-radius: 50%; background: var(--good); color: #fff; display: grid; place-items: center; }
.chore i .ic { width: 13px; height: 13px; }
/* Hent og bring */
.hb-legend { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 14px; }
.hb-legend .chip { padding: 4px 10px 4px 4px; }
.hb-av { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; background: var(--hc); color: #fff; font-weight: 800; font-size: 13px; flex: none; transition: background .25s; font-family: var(--font-display); }
.hb-av.sm { width: 22px; height: 22px; font-size: 11px; }
.hb-av .av { width: 100%; height: 100%; }
.hb-wrap { overflow-x: auto; }
.hb-grid { display: grid; grid-template-columns: 54px repeat(var(--n), minmax(150px, 1fr)); gap: 8px; min-width: 540px; }
.hb-kh { display: flex; align-items: center; gap: 8px; font-weight: 800; padding: 6px 8px; border-radius: 12px; background: color-mix(in srgb, var(--pc) 12%, var(--surface)); }
.hb-d { display: flex; flex-direction: column; justify-content: center; }
.hb-d small { color: var(--muted); font-size: 11px; }
.hb-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.hb-c { border: 1.5px solid color-mix(in srgb, var(--hc) 40%, var(--line)); background: color-mix(in srgb, var(--hc) 9%, var(--surface)); border-radius: 14px; padding: 6px; display: flex; align-items: center; gap: 6px; text-align: left; min-width: 0; color: var(--ink); transition: border-color .25s, background .25s; }
.hb-c.flip .hb-av { animation: flipav .35s; }
@keyframes flipav { 50% { transform: rotateY(90deg) scale(.8); } }
.hb-c.none { border-style: dashed; background: var(--surface); }
.hb-c.none .hb-av { color: var(--muted); }
.hb-c.mor { background: repeating-linear-gradient(135deg, var(--surface-2) 0 6px, var(--surface) 6px 12px); border-color: var(--line); cursor: default; }
.hb-c.mor .hb-av { background: var(--surface); font-size: 15px; }
.hb-l { min-width: 0; line-height: 1.15; }
.hb-l small { display: block; font-size: 10.5px; color: var(--muted); font-weight: 700; white-space: nowrap; }
.hb-l b { display: block; font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* Rutinetavle: bygger */
.bb { display: grid; gap: 16px; margin-top: 16px; user-select: none; -webkit-user-select: none; }
.bb input { user-select: text; -webkit-user-select: text; }
@media (min-width: 1100px) {
  .bb { grid-template-columns: minmax(0, 1fr) minmax(300px, 30%); align-items: start; }
  .bb-seg { grid-column: 1 / -1; }
  .bb-cols { grid-row: 1; }
  .bb-pal { grid-row: 1; grid-column: 2; position: sticky; top: 76px; max-height: calc(100vh - 92px); display: flex; flex-direction: column; }
  .bb-pal .pal { overflow-y: auto; flex: 1; min-height: 0; padding: 2px 4px 8px 2px; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); }
  .bb-pal .add { flex: none; margin-top: 10px; }
}
.rcd b { text-align: center; line-height: 1.15; }
.bb-seg { display: none; }
.bb-cols { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.bb-col { background: var(--surface); border-radius: 20px; box-shadow: var(--shadow); padding: 10px; border: 2px solid transparent; transition: border-color .2s, background .2s; min-width: 0; }
.bb-col.active { border-color: color-mix(in srgb, var(--pc) 60%, transparent); }
.bb-col.over { background: color-mix(in srgb, var(--pc) 10%, var(--surface)); border-color: var(--pc); }
.bb-h { display: grid; grid-template-columns: 22px 1fr auto; grid-template-rows: auto auto; column-gap: 8px; align-items: center; width: 100%; border: 0; background: none; text-align: left; padding: 4px 4px 10px; color: var(--ink); }
.bb-h .ic { grid-row: span 2; width: 22px; height: 22px; color: var(--pc); }
.bb-h small { grid-column: 2; color: var(--muted); font-size: 11.5px; }
.bb-h span { grid-row: 1 / 3; grid-column: 3; font-weight: 800; background: var(--surface-2); border-radius: 999px; padding: 2px 9px; }
.bb-list { display: flex; flex-direction: column; gap: 6px; min-height: 60px; }
.bb-card { display: grid; grid-template-columns: 22px 36px minmax(0, 1fr) auto; gap: 8px; align-items: center; padding: 6px 4px 6px 6px; border-radius: 14px; background: color-mix(in srgb, var(--cc) 12%, var(--surface)); border-left: 4px solid var(--cc); cursor: grab; touch-action: pan-y; user-select: none; -webkit-user-select: none; animation: pop .3s both; }
.bb-card.lifted { opacity: .3; }
.bb-card.pop-in { animation: pop .45s cubic-bezier(.2,.9,.3,1.5) both; }
.bb-n { font-size: 11px; font-weight: 800; color: var(--muted); text-align: center; }
.bb-em { font-size: 24px; text-align: center; }
.bb-card b { font-size: 13.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bb-card .iconbtn { width: 28px; height: 28px; }
.bb-drop { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border: 1.5px dashed var(--line); border-radius: 14px; color: var(--muted); font-size: 12.5px; font-weight: 700; }
.bb-drop .ic { width: 15px; height: 15px; }
.bb-ph { height: 44px; border-radius: 14px; background: color-mix(in srgb, var(--pc) 18%, transparent); border: 2px dashed var(--pc); animation: pop .2s both; }
.bb-cats { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
.bb-cats button { border: 0; border-radius: 999px; padding: 5px 12px; font-weight: 700; font-size: 13px; background: color-mix(in srgb, var(--cc) 12%, var(--surface-2)); color: var(--ink); }
.bb-cats button[aria-pressed="true"] { background: var(--cc); color: #fff; }
.pal { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 8px; }
.pc { border: 0; border-radius: 18px; padding: 12px 6px 10px; background: color-mix(in srgb, var(--cc) 14%, var(--surface)); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--cc) 30%, transparent); display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 12.5px; font-weight: 700; text-align: center; cursor: grab; touch-action: pan-y; user-select: none; -webkit-user-select: none; color: var(--ink); transition: transform .15s; }
.pc span { font-size: 32px; line-height: 1.1; }
@media (hover: hover) { .pc:hover { transform: translateY(-3px) rotate(-2deg); } }
.pc:active { transform: scale(.94); }
.ghost-drag { position: fixed; z-index: 90; pointer-events: none; transform: rotate(-4deg) scale(1.06); box-shadow: 0 18px 40px rgba(0,0,0,.28); opacity: .96; margin: 0; }
:host(.dragging) { cursor: grabbing; user-select: none; -webkit-user-select: none; }
/* Rutinetavle: barnet */
.rb-slots { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.rb-s { border: 0; background: var(--surface); border-radius: 18px; padding: 10px; display: flex; align-items: center; gap: 10px; text-align: left; box-shadow: var(--shadow); color: var(--ink); min-width: 0; }
.rb-s.on { background: var(--kc); color: #fff; }
.rb-s.on small { color: rgba(255,255,255,.85); }
.rb-ring { position: relative; width: 36px; height: 36px; flex: none; display: grid; place-items: center; color: var(--kc); }
.rb-s.on .rb-ring { color: #fff; }
.rb-ring svg { position: absolute; inset: 0; }
.rb-ring .ic { width: 16px; height: 16px; }
.rb-s b { display: block; font-size: 14px; }
.rb-s small { display: block; font-size: 11px; color: var(--muted); white-space: nowrap; }
.rb-bar { position: relative; height: 26px; border-radius: 999px; background: var(--surface); box-shadow: var(--shadow); margin: 14px 0; overflow: hidden; }
.rb-bar i { position: absolute; inset: 0 auto 0 0; background: linear-gradient(90deg, color-mix(in srgb, var(--kc) 70%, #fff), var(--kc)); border-radius: 999px; transition: width .6s cubic-bezier(.2,.8,.2,1); }
.rb-bar span { position: relative; display: block; text-align: center; line-height: 26px; font-weight: 800; font-size: 13px; color: var(--ink); text-shadow: 0 0 6px var(--surface), 0 0 2px var(--surface); }
.rb-path { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
.rcd { position: relative; border: 0; border-radius: 26px; padding: 18px 10px 14px; background: color-mix(in srgb, var(--cc) 16%, var(--surface)); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--cc) 35%, transparent), var(--shadow); display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--ink); animation: pop .45s cubic-bezier(.2,.9,.3,1.3) both; transition: transform .2s; }
.rcd:active { transform: scale(.94); }
.rcd-em { font-size: 58px; line-height: 1; filter: drop-shadow(0 4px 6px rgba(0,0,0,.12)); }
.rcd b { font-size: 16px; font-family: var(--font-display); }
.rcd-n { position: absolute; top: 10px; left: 12px; width: 24px; height: 24px; border-radius: 50%; background: var(--surface); font-size: 12px; font-weight: 800; display: grid; place-items: center; color: var(--muted); }
.rcd-now { position: absolute; top: 10px; right: 10px; background: var(--cc); color: #fff; font-size: 11px; font-weight: 800; padding: 2px 9px; border-radius: 999px; letter-spacing: .5px; text-transform: uppercase; }
.rcd.next { background: color-mix(in srgb, var(--cc) 26%, var(--surface)); box-shadow: 0 0 0 3px var(--cc), 0 14px 30px color-mix(in srgb, var(--cc) 35%, transparent); transform: scale(1.03); animation: pop .45s both, breathe2 2.4s ease-in-out .5s infinite; }
@keyframes breathe2 { 50% { transform: scale(1.06); } }
.rcd.next .rcd-em { animation: bob 1.8s ease-in-out infinite; }
.rcd.away { animation: away .38s cubic-bezier(.5,0,.8,.4) forwards !important; }
@keyframes away { to { transform: translateY(-40px) rotate(12deg) scale(.5); opacity: 0; } }
.rb-tray { margin-top: 16px; padding: 12px; border-radius: 20px; background: var(--surface); box-shadow: var(--shadow); }
.rb-done { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
.rdn { position: relative; width: 48px; height: 48px; border: 0; border-radius: 16px; background: color-mix(in srgb, var(--good) 14%, var(--surface-2)); font-size: 24px; display: grid; place-items: center; animation: pop .4s cubic-bezier(.2,.9,.3,1.5) both; }
.rdn span { opacity: .55; }
.rdn i { position: absolute; right: -4px; bottom: -4px; width: 20px; height: 20px; border-radius: 50%; background: var(--good); color: #fff; display: grid; place-items: center; border: 2px solid var(--surface); }
.rdn i .ic { width: 11px; height: 11px; }
.rb-yay { text-align: center; padding: 30px 16px; border-radius: 28px; background: radial-gradient(circle at 50% 30%, color-mix(in srgb, var(--kc) 30%, var(--surface)), var(--surface)); box-shadow: var(--shadow); animation: pop .5s both; }
.rb-yay h2 { font-family: var(--font-display); font-size: 30px; margin: 8px 0 4px; }
.rb-yay p { margin: 0; color: var(--muted); font-weight: 600; }
.rb-star { font-size: 80px; display: inline-block; animation: spinstar 2.4s ease-in-out infinite; }
@keyframes spinstar { 50% { transform: scale(1.15) rotate(15deg); } }
.rb-foot { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 14px; font-size: 12.5px; color: var(--muted); font-weight: 600; }
.rb-foot > span { display: inline-flex; align-items: center; gap: 6px; margin-right: auto; }
.rb-foot .ic { width: 14px; height: 14px; }
@media (max-width: 640px) {
  .bb-seg { display: flex; gap: 4px; padding: 4px; border-radius: 14px; background: var(--surface); box-shadow: var(--shadow); }
  .bb-seg button { flex: 1; border: 0; background: none; border-radius: 10px; padding: 8px 4px; font-weight: 700; font-size: 13px; color: var(--muted); }
  .bb-seg button[aria-pressed="true"] { background: var(--pc); color: #fff; }
  .bb-cols { grid-template-columns: minmax(0, 1fr); }
  .bb-col:not(.active) { display: none; }
  .rb-slots { gap: 6px; }
  .rb-s { flex-direction: column; text-align: center; padding: 8px 4px; gap: 4px; }
  .rb-s small { display: none; }
  .rb-path { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .rcd-em { font-size: 48px; }
  .pal { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .rcr { grid-template-columns: 40px minmax(0, 1fr) auto; }
  .rcr .step { grid-column: 2; justify-self: start; }
  .me-hero .btn { margin-left: 0; }
  .kig-b { min-width: 0; flex: 1 1 140px; }
}

/* Hent og bring pr. barn */
.hb-kids { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.hb-kid { border: 2px solid transparent; background: var(--surface-2); border-radius: 18px; padding: 10px; display: flex; align-items: center; gap: 10px; text-align: left; color: var(--ink); min-width: 0; transition: border-color .2s, background .2s, transform .2s; }
.hb-kid .av { width: 40px; height: 40px; flex: none; }
.hb-kid b { display: block; }
.hb-kid small { color: var(--muted); font-size: 12px; }
.hb-kid[aria-pressed="true"] { border-color: var(--pc); background: color-mix(in srgb, var(--pc) 14%, var(--surface)); transform: translateY(-2px); }
.hb-two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 16px; }
.hb-sec { background: var(--surface); border-radius: 24px; box-shadow: var(--shadow); padding: 16px; animation: pop .35s both; min-width: 0; }
.hb-sh { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.hb-sh h3 { margin: 0; font-family: var(--font-display); font-size: 19px; }
.hb-sh small { color: var(--muted); font-weight: 600; font-size: 12.5px; }
.hb-si { width: 42px; height: 42px; border-radius: 14px; display: grid; place-items: center; flex: none; }
.hb-bring .hb-si { background: color-mix(in srgb, #F2B01E 20%, var(--surface)); color: #C98A00; }
.hb-hent .hb-si { background: color-mix(in srgb, var(--pc) 18%, var(--surface)); color: var(--pc); }
.hb-si .ic { width: 22px; height: 22px; }
.hb-rows { display: flex; flex-direction: column; gap: 6px; }
.hb-row { display: grid; grid-template-columns: 48px 36px minmax(0, 1fr) auto 18px; gap: 10px; align-items: center; border: 0; border-left: 4px solid var(--hc); background: color-mix(in srgb, var(--hc) 9%, var(--surface-2)); border-radius: 14px; padding: 8px 10px 8px 8px; text-align: left; color: var(--ink); animation: pop .3s both; transition: transform .15s, background .2s; }
@media (hover: hover) { .hb-row:not([disabled]):hover { transform: translateX(3px); } }
.hb-row > .ic { width: 16px; height: 16px; color: var(--muted); transform: rotate(-90deg); }
.hb-row.none { border-left-style: dashed; background: var(--surface-2); }
.hb-row.none .hb-nm { color: var(--muted); }
.hb-row.mor { background: repeating-linear-gradient(135deg, var(--surface-2) 0 6px, var(--surface) 6px 12px); border-left-color: var(--line); cursor: default; }
.hb-day b { display: block; font-size: 14px; }
.hb-day small { color: var(--muted); font-size: 11px; }
.hb-row .hb-av { width: 36px; height: 36px; font-size: 15px; background: var(--hc); }
.hb-row.mor .hb-av { background: var(--surface); }
.hb-nm { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hb-nm small { display: block; font-weight: 600; font-size: 11px; color: var(--muted); }
.hb-tm { font-weight: 800; font-size: 16px; }
.hb-week { display: flex; align-items: center; gap: 6px; margin-top: 12px; flex-wrap: wrap; }
.hb-week small { color: var(--muted); font-weight: 600; margin-right: 2px; }
.hb-week button { border: 0; background: none; padding: 2px; border-radius: 50%; transition: transform .15s; }
.hb-week button:hover { transform: scale(1.12); }
.hb-av { background: var(--hc); }
.hb-helpers { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 8px; }
.hb-hp { display: flex; align-items: center; gap: 10px; padding: 8px 8px 8px 10px; border-radius: 16px; background: color-mix(in srgb, var(--hc) 10%, var(--surface-2)); animation: pop .3s both; }
.hb-hp .hb-av { width: 36px; height: 36px; font-size: 15px; }
.hb-hp span:not(.hb-av) { flex: 1; min-width: 0; }
.hb-hp b { display: block; }
.hb-hp small { color: var(--muted); font-size: 12px; }
.hb-pick { display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 8px; margin-top: 12px; }
.hb-pick button { border: 2px solid transparent; background: var(--surface-2); border-radius: 16px; padding: 10px 6px; display: flex; flex-direction: column; align-items: center; gap: 6px; color: var(--ink); font-size: 13px; transition: border-color .2s, background .2s, transform .15s; }
.hb-pick .hb-av { width: 42px; height: 42px; font-size: 17px; }
.hb-pick button[aria-pressed="true"] { border-color: var(--hc); background: color-mix(in srgb, var(--hc) 14%, var(--surface)); transform: scale(1.04); }
.hb-wd button { width: 38px; height: 38px; font-size: 13px; }
.hb-wd button[disabled] { opacity: .35; }
.hb-sw { display: flex; gap: 8px; flex-wrap: wrap; }
.hb-sw button { width: 36px; height: 36px; border-radius: 50%; border: 3px solid var(--surface); background: var(--hc); box-shadow: 0 0 0 2px transparent; transition: box-shadow .2s, transform .15s; }
.hb-sw button[aria-pressed="true"] { box-shadow: 0 0 0 2px var(--hc); transform: scale(1.1); }
#hb-del { margin-right: auto; }
@media (max-width: 760px) {
  .hb-two { grid-template-columns: minmax(0, 1fr); }
  .hb-kid { flex-direction: column; text-align: center; gap: 4px; }
}

.al-pick { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 8px; }
.al-pk { border: 2px solid transparent; background: var(--surface-2); border-radius: 16px; padding: 10px; display: flex; align-items: center; gap: 10px; text-align: left; color: var(--ink); transition: border-color .2s, background .2s; }
.al-pk .ic { width: 24px; height: 24px; color: var(--mc); flex: none; }
.al-pk b { display: block; font-size: 14px; }
.al-pk small { display: block; font-size: 11.5px; color: var(--muted); line-height: 1.25; }
.al-pk[aria-pressed="true"] { border-color: var(--mc); background: color-mix(in srgb, var(--mc) 12%, var(--surface)); }
.al-pk[disabled] { opacity: .45; cursor: not-allowed; }
.feat[disabled] { opacity: .45; cursor: not-allowed; }

/* Opladningsboksen fra EV Planner */
.cs-grid { display: grid; gap: 16px; }
.cb { margin-top: 16px; padding: 16px; border-radius: 20px; background: var(--surface-2); }
.cb h3 { display: flex; align-items: center; gap: 8px; margin: 0 0 12px; font-family: var(--font-display); font-size: 18px; }
.cb h3 .ic { width: 20px; height: 20px; color: var(--cc); }
.cb-modes { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; padding: 5px; border-radius: 16px; background: var(--surface); }
.cb-modes button { border: 0; background: none; border-radius: 12px; padding: 9px 4px 7px; display: flex; flex-direction: column; align-items: center; gap: 3px; font-weight: 700; font-size: 12.5px; color: var(--muted); transition: background .2s, color .2s, transform .15s; }
.cb-modes button .ic { width: 20px; height: 20px; }
.cb-modes button:active { transform: scale(.94); }
.cb-modes button[aria-checked="true"] { color: #fff; background: var(--cc); box-shadow: 0 6px 16px color-mix(in srgb, var(--cc) 40%, transparent); }
.cb-modes .m-charge_now[aria-checked="true"] { background: #F2B01E; box-shadow: 0 6px 16px rgba(242,176,30,.4); }
.cb-modes .m-pause[aria-checked="true"] { background: #8A8FA3; box-shadow: none; }
.cb-modes .m-off[aria-checked="true"] { background: var(--ink); color: var(--bg); box-shadow: none; }
.cb-bat { position: relative; display: flex; align-items: center; margin: 30px 0 6px; transition: opacity .25s; }
.cb-bat.dim { opacity: .45; }
.cb-cells { position: relative; flex: 1; height: 46px; border-radius: 14px; background: var(--surface); border: 2px solid var(--line); cursor: pointer; touch-action: none; }
.cb-nub { width: 7px; height: 18px; border-radius: 0 5px 5px 0; background: var(--line); margin-left: 2px; }
.cb-now { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 12px 0 0 12px; background: linear-gradient(90deg, color-mix(in srgb, var(--cc) 70%, #000 0%), var(--cc)); }
.cb-tgt { position: absolute; top: 0; bottom: 0; background: repeating-linear-gradient(135deg, color-mix(in srgb, var(--cc) 30%, transparent) 0 7px, color-mix(in srgb, var(--cc) 14%, transparent) 7px 14px); border-radius: 0 12px 12px 0; }
.cb-flow { position: absolute; top: 0; bottom: 0; opacity: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent) 0 0 / 40% 100% no-repeat; }
.cb-flow.on { opacity: 1; animation: cbflow 1.4s linear infinite; }
@keyframes cbflow { from { background-position: -40% 0; } to { background-position: 140% 0; } }
.cb-ticks i { position: absolute; top: 8px; bottom: 8px; width: 1px; background: color-mix(in srgb, var(--ink) 12%, transparent); }
.cb-min { position: absolute; top: -4px; bottom: -4px; width: 2px; margin-left: -1px; background: var(--bad); border-radius: 2px; opacity: .7; }
.cb-h { position: absolute; top: 50%; width: 6px; height: 58px; margin: -29px 0 0 -3px; border-radius: 4px; border: 0; padding: 0; }
.cb-h::after { content: attr(data-l); position: absolute; bottom: calc(100% + 4px); left: 50%; transform: translateX(-50%); font-size: 11.5px; font-weight: 800; white-space: nowrap; padding: 2px 7px; border-radius: 8px; }
.cb-h.now { background: var(--ink); opacity: .7; pointer-events: none; }
.cb-h.now::after { display: none; }
.cb-h.tgt { width: 22px; margin-left: -11px; background: var(--surface); box-shadow: 0 0 0 2.5px var(--cc), 0 4px 10px rgba(0,0,0,.2); cursor: grab; transition: transform .15s; }
.cb-h.tgt::after { background: var(--cc); color: #fff; }
.cb.dragging .cb-h.tgt, .cb-h.tgt:focus-visible { transform: scale(1.12); }
.cb-leg { display: flex; justify-content: space-between; gap: 8px; font-size: 13px; color: var(--muted); margin-top: 8px; }
.cb-leg b { color: var(--ink); }
.cb-gain { color: var(--cc); font-weight: 700; }
.cb-hint { font-size: 12px; color: var(--muted); margin: 6px 0 0; }
.cb-f { margin-top: 16px; }
.cb-f > .lbl { display: block; font-size: 11px; font-weight: 800; letter-spacing: .5px; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
.cb-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.cb-chips button, .cb-time { border: 1.5px solid var(--line); background: var(--surface); border-radius: 999px; padding: 7px 13px; font-weight: 700; font-size: 13.5px; color: var(--ink); font-variant-numeric: tabular-nums; transition: background .2s, border-color .2s, color .2s; }
.cb-chips button[aria-pressed="true"] { background: var(--cc); border-color: var(--cc); color: #fff; }
.cb-chips button.none[aria-pressed="true"] { background: var(--ink); border-color: var(--ink); color: var(--bg); }
.cb-time { padding: 3px 8px; display: inline-flex; align-items: center; }
.cb-time.on { border-color: var(--cc); background: color-mix(in srgb, var(--cc) 12%, var(--surface)); }
.cb-time input { border: 0; background: none; font: inherit; color: inherit; padding: 2px 0; }
.cb-week { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 5px; transition: opacity .2s; }
.cb-week.dim { opacity: .45; }
.cb-day { border: 1.5px solid var(--line); background: var(--surface); border-radius: 12px; padding: 6px 2px; display: flex; flex-direction: column; align-items: center; gap: 1px; color: var(--ink); }
.cb-day b { font-size: 12px; }
.cb-day span { font-size: 11.5px; color: var(--muted); font-weight: 700; font-variant-numeric: tabular-nums; }
.cb-day.own { border-color: var(--cc); background: color-mix(in srgb, var(--cc) 12%, var(--surface)); }
.cb-day.own span { color: var(--cc); }
.cb-day.none span { color: var(--muted); }
.cb-day.open { box-shadow: 0 0 0 2px var(--cc); }
.cb-pick { margin-top: 10px; padding: 12px; border-radius: 14px; background: var(--surface); animation: pop .25s both; }
.cb-pick p { margin: 0 0 8px; font-weight: 700; font-size: 13.5px; }
.cb-seg button[aria-pressed="true"] { color: var(--cc); }
@media (max-width: 899px) { .car-sheet .dial-wrap { width: min(100%, 250px); } }
.status-pill.replan i { background: var(--warn); animation: ping3 1s ease-out infinite; }
@media (min-width: 900px) {
  .sheet.car-sheet { width: min(980px, calc(100% - 48px)); }
  .cs-grid { grid-template-columns: minmax(0, .9fr) minmax(0, 1fr); align-items: start; }
  .cs-grid .cb { margin-top: 0; }
}

/* Pynt */
.hl.dchip { border: 0; background: color-mix(in srgb, var(--dc) 55%, rgba(0,0,0,.25)); color: #fff; box-shadow: 0 0 0 1px rgba(255,255,255,.18), 0 6px 18px color-mix(in srgb, var(--dc) 40%, transparent); }
.dchip .dem { font-size: 16px; line-height: 1; animation: bob 2.4s ease-in-out infinite; display: inline-block; }
.dchip .ic { width: 14px; height: 14px; }
.kidbar .dchip { padding: 6px 12px; border-radius: 999px; display: inline-flex; gap: 6px; align-items: center; font-weight: 700; }
.dec-list { display: flex; flex-direction: column; gap: 8px; }
.dec-row { display: grid; grid-template-columns: 44px minmax(0, 1fr) auto 56px; gap: 4px 12px; align-items: center; padding: 10px 12px; border-radius: 18px; background: color-mix(in srgb, var(--dc) 8%, var(--surface-2)); transition: opacity .25s, background .25s; }
.dec-row.off { opacity: .55; background: var(--surface-2); }
.dec-row.live { box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--dc) 55%, transparent); }
.dec-em { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; font-size: 24px; background: var(--surface); }
.dec-t b { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dec-t small { color: var(--muted); font-size: 12.5px; }
.dec-live { font-style: normal; font-size: 10.5px; font-weight: 800; letter-spacing: .4px; text-transform: uppercase; color: #fff; background: var(--dc); padding: 2px 8px; border-radius: 999px; }
.dec-ctl { display: flex; align-items: center; gap: 8px; }
.dec-st { display: inline-flex; align-items: center; gap: 4px; background: var(--surface); border-radius: 999px; padding: 3px 8px 3px 3px; }
.dec-st > small:first-child { padding: 0 4px 0 8px; font-weight: 700; font-size: 11.5px; color: var(--muted); }
.dec-st > small:last-child { font-size: 11.5px; color: var(--muted); }
.dec-st button { width: 26px; height: 26px; border-radius: 50%; border: 0; background: var(--surface-2); font-weight: 800; color: var(--ink); }
.dec-st button[disabled] { opacity: .35; }
.dec-st b { min-width: 18px; text-align: center; }
.dec-bd { grid-column: 2 / -1; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 6px; }
.dec-p { display: inline-flex; align-items: center; gap: 6px; background: var(--surface); border-radius: 999px; padding: 3px 4px 3px 3px; font-size: 13px; font-weight: 700; }
.dec-p .av { width: 24px; height: 24px; font-size: 11px; }
.dec-p select { border: 0; background: var(--surface-2); border-radius: 999px; padding: 4px 6px; font: inherit; font-weight: 600; color: var(--ink); }
@media (max-width: 760px) {
  .dec-row { grid-template-columns: 40px minmax(0, 1fr) 56px; }
  .dec-em { width: 40px; height: 40px; font-size: 22px; }
  .dec-ctl { grid-column: 1 / -1; grid-row: 2; flex-wrap: wrap; }
  .dec-row > .toggle { grid-column: 3; grid-row: 1; }
  .dec-bd { grid-column: 1 / -1; }
  .dec-st > small:last-child { display: none; }
  .dec-ctl { gap: 6px; }
}

/* Børnenes værelser */
.rm-wrap { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); gap: 18px; align-items: start; }
.rm-pic { position: relative; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(20,16,40,.18); background: #1B1D2E; }
.rm-svg { display: block; width: 100%; height: auto; }
.rm-hint { position: absolute; left: 12px; bottom: 10px; display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #fff; background: rgba(15,15,30,.45); backdrop-filter: blur(6px); padding: 5px 10px; border-radius: 999px; pointer-events: none; }
.rm-hint .ic { width: 14px; height: 14px; }
.rm-hint { transition: opacity .4s; }
.rm-card.touched .rm-hint { opacity: 0; }
@media (max-width: 520px) { .rm-hint { font-size: 11px; padding: 4px 8px; left: 8px; bottom: 8px; } }
.rm-glow, .rm-dark { transition: opacity .7s ease, fill .7s ease; }
.rm-glows { mix-blend-mode: screen; }
.rm-lamp { cursor: pointer; }
.rm-static .rm-shade { fill: #E2DDD6; stroke: #E2DDD6; }
.rm-lamp .rm-shade { transition: fill .6s ease, stroke .6s ease; }
.rm-lamp:hover .rm-shade { filter: brightness(1.06); }
.rm-lamp.on .rm-shade { filter: drop-shadow(0 0 4px rgba(255,240,210,.9)); }
.rm-sway { transform-box: view-box; animation: rmsway 7s ease-in-out infinite; }
.rm-sway.slow { animation-duration: 9s; }
@keyframes rmsway { 0%, 100% { transform: rotate(-1.4deg); } 50% { transform: rotate(1.4deg); } }
.rm-bob { transform-box: view-box; animation: rmbob 6s ease-in-out infinite; }
@keyframes rmbob { 0%, 100% { transform: translateY(0) rotate(-1deg); } 50% { transform: translateY(3px) rotate(1deg); } }
.rm-dust { transition: opacity 1s; }
.rm-dust circle { animation: rmdust 9s ease-in-out infinite; transform-box: fill-box; }
@keyframes rmdust { 0%, 100% { transform: translate(0, 0); opacity: .2; } 50% { transform: translate(8px, -14px); opacity: .9; } }
.rm-stars { transition: opacity 1.2s; }
.rm-stars circle { animation: rmtw 3s ease-in-out infinite; }
@keyframes rmtw { 50% { opacity: .25; } }
.rm-leak { transition: opacity 1s; }
.rm-strip { transition: stroke .6s; }
.rm-side { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.rm-scenes { display: flex; gap: 6px; flex-wrap: wrap; }
.rm-scenes button { border: 1.5px solid var(--line); background: var(--surface); border-radius: 999px; padding: 4px 12px 4px 4px; display: inline-flex; align-items: center; gap: 7px; font-weight: 700; font-size: 13px; color: var(--ink); transition: border-color .2s, transform .15s, box-shadow .2s; }
.rm-scenes button i { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; box-shadow: inset 0 0 0 1px rgba(0,0,0,.08); }
.rm-scenes button:active { transform: scale(.95); }
.rm-scenes button[aria-pressed="true"] { border-color: var(--pc); box-shadow: 0 0 0 2px color-mix(in srgb, var(--pc) 30%, transparent); }
.rm-offb i { background: var(--ink); color: var(--bg); }
.rm-offb i .ic { width: 13px; height: 13px; }
.rm-lights { display: flex; flex-direction: column; gap: 8px; }
.rm-l { display: grid; grid-template-columns: 42px minmax(0, 1fr) minmax(90px, 140px); gap: 4px 10px; align-items: center; padding: 8px 10px; border-radius: 16px; background: var(--surface-2); transition: background .4s; }
.rm-l.on { background: color-mix(in srgb, var(--lc) 22%, var(--surface-2)); }
.rm-tg { width: 42px; height: 42px; border-radius: 14px; border: 0; background: var(--surface); color: var(--muted); display: grid; place-items: center; transition: background .4s, color .4s, box-shadow .4s; }
.rm-tg .ic { width: 22px; height: 22px; }
.rm-tg[aria-pressed="true"] { background: var(--lc); color: #3A2A10; box-shadow: 0 0 18px color-mix(in srgb, var(--lc) 70%, transparent); }
.rm-ln { min-width: 0; }
.rm-ln b { display: block; font-size: 14px; }
.rm-ln small { display: block; font-size: 11.5px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rm-l input[type=range] { width: 100%; accent-color: var(--lc); }
.rm-cols { grid-column: 2 / -1; display: flex; gap: 6px; flex-wrap: wrap; }
.rm-cols button { width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--surface); background: var(--sw); box-shadow: 0 0 0 1px var(--line); padding: 0; transition: transform .15s, box-shadow .2s; }
.rm-cols button[aria-pressed="true"] { box-shadow: 0 0 0 2px var(--ink); transform: scale(1.1); }
.rm-foot { margin-top: 12px; }
@media (max-width: 980px) { .rm-wrap { grid-template-columns: minmax(0, 1fr); } .rm-scenes { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; } .rm-scenes button { flex: none; } }
@media (max-width: 520px) { .rm-l { grid-template-columns: 42px minmax(0, 1fr); } .rm-l input[type=range] { grid-column: 2; } .rm-pic { margin: 0 -6px; border-radius: 16px; } }

/* Vinduet i værelserne */
.rm-clouds { animation: rmcloud 50s linear infinite alternate; }
@keyframes rmcloud { from { transform: translateX(-24px); } to { transform: translateX(24px); } }
.rm-rain line { animation: rmrain .7s linear infinite; }
@keyframes rmrain { from { transform: translate(0, -20px); } to { transform: translate(-4px, 30px); } }
.rm-snow circle { animation: rmsnow 4s linear infinite; }
@keyframes rmsnow { from { transform: translate(0, -30px); } to { transform: translate(6px, 40px); } }
.rm-leaves ellipse { animation: rmleaf 7s linear infinite; }
@keyframes rmleaf { 0% { transform: translate(0, 0) rotate(0); opacity: 0; } 10% { opacity: 1; } 100% { transform: translate(18px, 60px) rotate(260deg); opacity: 0; } }
/* Musik */
.mu-hero { position: relative; overflow: hidden; border-radius: 28px; padding: 22px; display: grid; grid-template-columns: minmax(200px, 360px) minmax(0, 1fr); gap: 28px; align-items: center; color: #fff; background: #15121F; box-shadow: 0 20px 50px rgba(20,14,40,.3); isolation: isolate; }
.mu-hero.empty { display: block; min-height: 160px; }
.mu-bg { position: absolute; inset: -20%; z-index: -1; filter: blur(60px) saturate(1.3); opacity: .85; }
.mu-bg i { position: absolute; width: 60%; height: 60%; border-radius: 50%; animation: mublob 18s ease-in-out infinite alternate; }
.mu-bg i:nth-child(1) { background: var(--c1); left: 0; top: 0; }
.mu-bg i:nth-child(2) { background: var(--c2); right: 0; bottom: 0; animation-delay: -6s; }
.mu-bg i:nth-child(3) { background: color-mix(in srgb, var(--c1) 50%, var(--c2)); left: 30%; top: 30%; width: 40%; height: 40%; animation-delay: -12s; }
@keyframes mublob { to { transform: translate(12%, -8%) scale(1.15); } }
.mu-hero::after { content: ""; position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, rgba(10,8,20,.15), rgba(10,8,20,.45)); }
.mu-art { position: relative; aspect-ratio: 1.3; }
.mu-cover { position: absolute; left: 0; top: 0; z-index: 2; width: 77%; aspect-ratio: 1; border-radius: 18px; overflow: hidden; box-shadow: 0 18px 40px rgba(0,0,0,.45); transition: transform .5s cubic-bezier(.2,.8,.2,1); }
.mu-cover .cover { width: 100%; height: 100%; display: block; }
.playing .mu-cover { transform: rotate(-2deg); }
.mu-vinyl { position: absolute; z-index: 1; left: 2%; top: 3%; width: 71%; aspect-ratio: 1; border-radius: 50%; background: repeating-radial-gradient(circle, #111 0 2px, #1d1d1d 2px 4px); transition: transform .6s cubic-bezier(.2,.8,.2,1); box-shadow: 0 10px 30px rgba(0,0,0,.4); }
.mu-vinyl i { position: absolute; inset: 36%; border-radius: 50%; background: linear-gradient(135deg, var(--c1), var(--c2)); }
.playing .mu-vinyl { transform: translateX(38%); animation: muspin 3.2s linear infinite; }
@keyframes muspin { from { transform: translateX(38%) rotate(0); } to { transform: translateX(38%) rotate(360deg); } }
.mu-info { min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.mu-src { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; background: rgba(255,255,255,.16); backdrop-filter: blur(8px); padding: 4px 10px; border-radius: 999px; width: fit-content; }
.mu-src .ic { width: 14px; height: 14px; }
.mu-info h2 { margin: 2px 0 0; font-family: var(--font-display); font-size: clamp(24px, 3.4vw, 38px); line-height: 1.05; }
.mu-info p { margin: 0; opacity: .8; font-weight: 600; }
.mu-eq { display: flex; gap: 3px; align-items: flex-end; height: 18px; }
.mu-eq i { width: 4px; height: 4px; border-radius: 2px; background: #fff; opacity: .9; }
.playing .mu-eq i, .mu-eq.on i { animation: mueq .9s ease-in-out infinite alternate; }
.mu-eq i:nth-child(2) { animation-delay: -.3s !important; } .mu-eq i:nth-child(3) { animation-delay: -.6s !important; } .mu-eq i:nth-child(4) { animation-delay: -.15s !important; } .mu-eq i:nth-child(5) { animation-delay: -.45s !important; }
@keyframes mueq { from { height: 3px; } to { height: 18px; } }
.mu-eq.sm { height: 12px; } .mu-eq.sm i { width: 3px; background: var(--violet); }
.mu-prog { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 10px; align-items: center; font-size: 12px; font-weight: 700; opacity: .9; }
.mu-prog input, .mu-vol input { accent-color: #fff; width: 100%; }
.mu-live { display: inline-flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 700; }
.mu-live i { width: 8px; height: 8px; border-radius: 50%; background: #FF4D4D; animation: ping3 1.4s ease-out infinite; }
.mu-ctl { display: flex; align-items: center; gap: 10px; margin-top: 4px; }
.mu-b { width: 40px; height: 40px; border-radius: 50%; border: 0; background: rgba(255,255,255,.12); color: #fff; display: grid; place-items: center; position: relative; transition: background .2s, transform .15s; }
.mu-b .ic { width: 20px; height: 20px; } .mu-b small { position: absolute; font-size: 8px; font-weight: 800; }
.mu-b.on { background: rgba(255,255,255,.95); color: #1B1530; }
.mu-b:active, .mu-play:active { transform: scale(.92); }
.mu-play { width: 62px; height: 62px; border-radius: 50%; border: 0; background: #fff; color: #1B1530; display: grid; place-items: center; box-shadow: 0 10px 26px rgba(0,0,0,.35); transition: transform .15s; }
.mu-play .ic { width: 28px; height: 28px; fill: currentColor; }
.mu-where { display: flex; gap: 6px; flex-wrap: wrap; }
.mu-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 999px; background: rgba(255,255,255,.16); font-size: 12.5px; font-weight: 700; border: 0; color: #fff; }
.mu-chip .ic { width: 15px; height: 15px; } .mu-chip.add { background: transparent; box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.4); }
.mu-vol { display: grid; grid-template-columns: 20px minmax(0, 1fr) 28px auto; gap: 10px; align-items: center; max-width: 420px; }
.mu-vol .ic { width: 18px; height: 18px; } .mu-vol small { font-size: 11px; opacity: .8; }
.mu-sess { display: flex; gap: 8px; overflow-x: auto; margin-bottom: 12px; scrollbar-width: none; }
.mu-sess button { display: flex; align-items: center; gap: 10px; padding: 6px 12px 6px 6px; border-radius: 16px; border: 1.5px solid var(--line); background: var(--surface); color: var(--ink); flex: none; text-align: left; }
.mu-sess button[aria-pressed="true"] { border-color: var(--violet); box-shadow: 0 0 0 3px color-mix(in srgb, var(--violet) 20%, transparent); }
.mu-sess .cover { width: 40px; height: 40px; border-radius: 10px; }
.mu-sess b { display: block; font-size: 13.5px; } .mu-sess small { font-size: 11.5px; color: var(--muted); }
.mu-spks { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
.mu-spk { display: grid; grid-template-columns: 44px minmax(0, 1fr) 40px; grid-template-rows: auto auto; gap: 6px 10px; align-items: center; padding: 10px; border-radius: 18px; background: var(--surface-2); border: 1.5px solid transparent; transition: border-color .2s, background .2s; }
.mu-spk.sel { border-color: var(--violet); background: color-mix(in srgb, var(--violet) 7%, var(--surface)); }
.mu-si { width: 44px; height: 44px; border-radius: 14px; background: var(--surface); display: grid; place-items: center; color: var(--ink); }
.mu-si .ic { width: 26px; height: 26px; }
.mu-spk.playing .woof { animation: woof .45s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: center; }
@keyframes woof { to { transform: scale(1.25); } }
.mu-sn b { display: block; font-size: 14px; } .mu-sn small { display: block; font-size: 11.5px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mu-link { width: 40px; height: 40px; border-radius: 12px; border: 1.5px dashed var(--line); background: transparent; color: var(--muted); display: grid; place-items: center; transition: all .2s; }
.mu-link .ic { width: 20px; height: 20px; }
.mu-link.on { border: 0; background: var(--violet); color: #fff; transform: rotate(-20deg); }
.mu-sv { grid-column: 1 / -1; display: grid; grid-template-columns: 30px minmax(0, 1fr) 28px; gap: 8px; align-items: center; }
.mu-sv input { width: 100%; accent-color: var(--violet); }
.mu-sv b { font-size: 12px; text-align: right; }
.mu-mute { width: 30px; height: 30px; border-radius: 10px; border: 0; background: var(--surface); color: var(--muted); display: grid; place-items: center; }
.mu-mute .ic { width: 16px; height: 16px; }
.mu-spk.muted .mu-sv input { opacity: .35; }
.mu-acc { margin-bottom: 10px; } .mu-acc button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
.mu-acc .av { width: 20px; height: 20px; font-size: 10px; }
.mu-search { display: flex; align-items: center; gap: 8px; background: var(--surface-2); border-radius: 12px; padding: 8px 12px; margin-bottom: 12px; color: var(--muted); }
.mu-search input { border: 0; background: none; flex: 1; outline: none; color: var(--ink); }
.mu-search .ic { width: 18px; height: 18px; }
.mu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 12px; }
.mu-item { position: relative; border: 0; background: none; padding: 0; text-align: left; color: var(--ink); }
.mu-item .cover { width: 100%; aspect-ratio: 1; border-radius: 14px; display: block; box-shadow: 0 6px 16px rgba(0,0,0,.12); transition: transform .2s; }
@media (hover: hover) { .mu-item:hover .cover { transform: translateY(-3px); } .mu-item:hover .mu-pi { opacity: 1; transform: none; } }
.mu-item b { display: block; font-size: 13.5px; margin-top: 6px; } .mu-item small { font-size: 11.5px; color: var(--muted); }
.mu-pi { position: absolute; right: 8px; top: calc(100% - 82px); width: 34px; height: 34px; border-radius: 50%; background: #1DB954; color: #fff; display: grid; place-items: center; opacity: 0; transform: translateY(6px); transition: all .2s; box-shadow: 0 6px 14px rgba(0,0,0,.25); }
.mu-pi .ic { width: 16px; height: 16px; fill: currentColor; }
@media (max-width: 760px) { .mu-hero { grid-template-columns: minmax(0, 1fr); padding: 18px; gap: 18px; } .mu-art { width: 88%; margin: 0 auto; } .mu-ctl { justify-content: center; } }
/* Apparater */
.ap-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
.ap-top .h2 { margin: 2px 0; }
.ap-area { font-family: var(--font-display); font-size: 18px; margin: 18px 0 10px; }
.ap-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 14px; }
.ap-card { display: grid; grid-template-columns: 116px minmax(0, 1fr); gap: 14px; background: var(--surface); border-radius: 22px; box-shadow: var(--shadow); padding: 14px; animation: pop .35s both; }
.ap-card.off { opacity: .72; } .ap-card.off .ap-art { filter: grayscale(.8); }
.ap-art { border-radius: 16px; background: linear-gradient(160deg, color-mix(in srgb, var(--violet) 8%, var(--surface-2)), var(--surface-2)); display: grid; place-items: center; padding: 6px; align-self: start; aspect-ratio: 1; }
.ap-art.fi { color: var(--muted); } .ap-art.fi .ic { width: 40px; height: 40px; }
.ap-svg { width: 100%; height: auto; display: block; }
.ap-h { display: flex; justify-content: space-between; gap: 8px; align-items: flex-start; margin-bottom: 8px; }
.ap-h b { display: block; font-size: 15.5px; } .ap-h small { display: block; font-size: 12px; color: var(--muted); }
.ap-st { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; padding: 3px 9px; border-radius: 999px; background: var(--surface-2); white-space: nowrap; }
.ap-st i { width: 7px; height: 7px; border-radius: 50%; background: var(--muted); }
.ap-st.ok i { background: var(--good); } .ap-st.run i { background: #3B82F6; animation: ping3 1.4s ease-out infinite; } .ap-st.bad { color: var(--bad); } .ap-st.bad i { background: var(--bad); } .ap-st.warn i { background: var(--warn); }
.ap-facts { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-bottom: 8px; }
.ap-facts small { display: block; font-size: 10.5px; font-weight: 700; letter-spacing: .4px; text-transform: uppercase; color: var(--muted); }
.ap-facts b { font-size: 14.5px; }
.ap-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.ap-chips button { border: 1.5px solid var(--line); background: var(--surface); border-radius: 999px; padding: 5px 11px; font-size: 12.5px; font-weight: 700; color: var(--ink); display: inline-flex; gap: 6px; align-items: center; }
.ap-chips button .ic { width: 14px; height: 14px; }
.ap-chips button[aria-pressed="true"] { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.ap-chips button[disabled] { opacity: .4; }
.ap-acts { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.ap-bar { height: 8px; border-radius: 999px; background: var(--surface-2); overflow: hidden; margin-bottom: 10px; }
.ap-bar i { display: block; height: 100%; background: linear-gradient(90deg, #3B82F6, #7FD1FF); border-radius: 999px; transition: width 1s; }
.ap-temp { display: flex; align-items: center; gap: 10px; } .ap-temp b { font-size: 18px; min-width: 40px; text-align: center; }
.ap-warn { display: flex; gap: 10px; align-items: center; padding: 10px 12px; border-radius: 14px; background: color-mix(in srgb, var(--warn) 14%, var(--surface)); margin-bottom: 10px; font-size: 13.5px; }
.ap-warn > .ic { width: 20px; height: 20px; color: var(--warn); flex: none; } .ap-warn span { flex: 1; }
.ap-card.fut { opacity: .75; border: 1.5px dashed var(--line); box-shadow: none; }
.ap-pick { margin-bottom: 8px; }
.ap-picks { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 8px; }
.ap-picks button { display: grid; grid-template-columns: 40px minmax(0, 1fr); grid-template-rows: auto auto; column-gap: 10px; align-items: center; text-align: left; border: 1.5px solid var(--line); background: var(--surface); border-radius: 14px; padding: 6px 10px 6px 6px; font-weight: 700; font-size: 13.5px; color: var(--ink); }
.ap-picks button small { grid-column: 2; font-weight: 500; font-size: 11px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ap-picks button[aria-pressed="true"] { border-color: var(--violet); background: color-mix(in srgb, var(--violet) 8%, var(--surface)); }
.ap-mini { grid-row: span 2; width: 40px; height: 40px; border-radius: 10px; background: var(--surface-2); display: grid; place-items: center; overflow: hidden; }
.ap-mini .ap-svg { width: 38px; } .ap-mini.fi .ic { width: 22px; height: 22px; color: var(--muted); }
.ap-svg.run .ap-water { animation: apwave 2s ease-in-out infinite alternate; }
@keyframes apwave { to { transform: translateX(-12px); } }
.ap-steam path { animation: apsteam 2.4s ease-in-out infinite; }
@keyframes apsteam { 0% { opacity: 0; transform: translateY(4px); } 50% { opacity: .7; } 100% { opacity: 0; transform: translateY(-6px); } }
.ap-glow { animation: apglow 2.4s ease-in-out infinite alternate; } @keyframes apglow { to { opacity: .35; } }
.ap-zone { animation: apzone 1.6s ease-in-out infinite alternate; } @keyframes apzone { to { opacity: .55; } }
.ap-pour { animation: appour .5s linear infinite; } @keyframes appour { 50% { opacity: .6; } }
.ap-fill { transform-box: fill-box; transform-origin: bottom; animation: apfill 7s linear both; } @keyframes apfill { from { transform: scaleY(0); } }
.ap-alarm { animation: apblink 1s steps(2) infinite; } @keyframes apblink { 50% { opacity: .2; } }
.ap-fan { animation: apspin 2s linear infinite; transform-box: view-box; }
.ap-infolight { transition: all .4s; }
@media (max-width: 520px) { .ap-grid { grid-template-columns: minmax(0, 1fr); } .ap-card { grid-template-columns: 92px minmax(0, 1fr); } }
/* Sikkerhed */
.sec-hero { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 20px; align-items: center; padding: 20px; border-radius: 26px; background: linear-gradient(120deg, color-mix(in srgb, var(--ac) 16%, var(--surface)), var(--surface)); box-shadow: var(--shadow); }
.sec-shield { position: relative; width: 96px; height: 96px; border-radius: 50%; border: 0; background: color-mix(in srgb, var(--ac) 18%, var(--surface)); color: var(--ac); display: grid; place-items: center; }
.sec-shield > .ic { width: 44px; height: 44px; position: relative; z-index: 1; }
.sec-rings i { position: absolute; inset: 0; border-radius: 50%; border: 2px solid var(--ac); opacity: 0; animation: secring 3s ease-out infinite; }
.sec-rings i:nth-child(2) { animation-delay: 1s; } .sec-rings i:nth-child(3) { animation-delay: 2s; }
@keyframes secring { 0% { transform: scale(.7); opacity: .6; } 100% { transform: scale(1.5); opacity: 0; } }
.sec-ht h2 { margin: 2px 0 8px; font-family: var(--font-display); font-size: 26px; }
.sec-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.sec-chips span { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 999px; background: var(--surface); font-size: 12.5px; font-weight: 700; box-shadow: inset 0 0 0 1px var(--line); }
.sec-chips .ic { width: 15px; height: 15px; color: var(--good); } .sec-chips .bad { color: var(--bad); } .sec-chips .bad .ic { color: var(--bad); }
.sec-plan { width: 100%; height: auto; display: block; }
.sec-scroll { overflow-x: auto; margin: 0 -4px; padding: 0 4px; scrollbar-width: none; }
@media (max-width: 620px) { .sec-plan { min-width: 600px; } }
.sec-ground { fill: color-mix(in srgb, #7FA36A 30%, var(--surface-2)); }
.sec-drive { fill: color-mix(in srgb, #9A9A98 35%, var(--surface-2)); }
.sec-terrace { fill: color-mix(in srgb, #A0794F 30%, var(--surface-2)); }
.sec-room { fill: var(--surface); stroke: var(--line); stroke-width: 1.5; }
.sec-outline { fill: none; stroke: var(--ink); stroke-width: 3; opacity: .7; }
.sec-lbl { font-size: 10.5px; font-weight: 700; fill: var(--muted); font-family: var(--font-body); }
.sec-lbl.sm { font-size: 8.5px; } .sec-lbl.out { font-size: 11px; fill: color-mix(in srgb, var(--ink) 55%, transparent); }
.sec-hit { cursor: pointer; }
.sec-door { fill: var(--good); transition: fill .3s; } .sec-door.open { fill: var(--bad); }
.sec-win { fill: #7FB9E8; } .sec-win.open { fill: var(--bad); } .sec-win.offl { fill: var(--muted); opacity: .5; }
.sec-port { fill: var(--good); transition: all .5s; } .sec-port.open { fill: var(--bad); opacity: .5; }
.sec-motion circle { fill: var(--violet); } .sec-motion .ring { fill: none; stroke: var(--violet); stroke-width: 1.5; opacity: 0; }
.sec-motion.live .ring { animation: secping 1.6s ease-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes secping { from { transform: scale(1); opacity: .8; } to { transform: scale(5); opacity: 0; } }
.sec-smoke circle { fill: var(--surface); stroke: var(--muted); stroke-width: 1.5; } .sec-smoke .dot { fill: var(--good); stroke: none; animation: apblink 3s steps(2) infinite; }
.sec-cam .cam-dot { fill: #1B1530; } .sec-cam .cone { animation: seccone 4s ease-in-out infinite alternate; transform-box: fill-box; }
@keyframes seccone { from { opacity: .55; } to { opacity: 1; } }
.sec-legend { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 10px; font-size: 12px; font-weight: 600; color: var(--muted); align-items: center; }
.sec-legend span { display: inline-flex; gap: 6px; align-items: center; }
.lg { width: 14px; height: 6px; border-radius: 2px; display: inline-block; } .lg.door { background: var(--good); } .lg.win { background: #7FB9E8; } .lg.mot { width: 8px; height: 8px; border-radius: 50%; background: var(--violet); } .lg.smk { width: 9px; height: 9px; border-radius: 50%; border: 1.5px solid var(--muted); } .lg.cam { width: 10px; height: 10px; border-radius: 50%; background: #1B1530; }
.sec-tl { display: flex; flex-direction: column; gap: 4px; max-height: 420px; overflow-y: auto; margin-top: 4px; }
.sec-ev { display: grid; grid-template-columns: 54px 32px minmax(0, 1fr); gap: 10px; align-items: center; padding: 8px; border-radius: 12px; border: 0; background: none; text-align: left; color: var(--ink); animation: pop .3s both; }
.sec-ev:hover { background: var(--surface-2); }
.sec-t b { display: block; font-size: 13.5px; } .sec-t small { font-size: 11px; color: var(--muted); }
.sec-ei { width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; background: var(--surface-2); }
.sec-ei .ic { width: 17px; height: 17px; }
.k-door .sec-ei { color: var(--good); } .k-car .sec-ei, .k-person .sec-ei, .k-cat .sec-ei { color: var(--violet); } .k-sys .sec-ei { color: var(--warn); }
.sec-et { font-size: 13.5px; }
.cam-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
.cam-tile, .cam-big { position: relative; border: 0; padding: 0; border-radius: 16px; overflow: hidden; aspect-ratio: 16 / 9; background: #111; display: block; width: 100%; }
.cam-svg { width: 100%; height: 100%; display: block; }
.cam-svg.ir { filter: grayscale(1) contrast(1.15) brightness(1.1); }
.cam-tile::after, .cam-big::after { content: ""; position: absolute; inset: 0; background: repeating-linear-gradient(0deg, rgba(255,255,255,.03) 0 1px, transparent 1px 3px); pointer-events: none; }
.cam-ov { position: absolute; left: 10px; right: 10px; top: 8px; display: flex; justify-content: space-between; color: #fff; font-size: 12.5px; text-shadow: 0 1px 3px rgba(0,0,0,.6); }
.cam-live { display: inline-flex; align-items: center; gap: 5px; font-size: 10.5px; font-weight: 800; letter-spacing: .5px; background: rgba(0,0,0,.45); padding: 2px 7px; border-radius: 6px; }
.cam-live i { width: 7px; height: 7px; border-radius: 50%; background: #FF3B3B; animation: apblink 1.2s steps(2) infinite; }
.cam-live.rec i { background: #F2B01E; }
.cam-time { position: absolute; right: 10px; bottom: 8px; color: #fff; font-size: 11.5px; font-weight: 700; background: rgba(0,0,0,.45); padding: 2px 7px; border-radius: 6px; }
.cam-box { position: absolute; border: 2px solid #3CCB83; border-radius: 4px; }
.cam-box small { position: absolute; top: -17px; left: -2px; background: #3CCB83; color: #0B1B12; font-size: 9.5px; font-weight: 800; padding: 1px 5px; border-radius: 3px; white-space: nowrap; }
.cam-box.car { left: 38%; top: 50%; width: 26%; height: 31%; animation: apblink 4s steps(2) infinite; }
.cam-box.cat { top: 62%; width: 11%; height: 14%; animation: catbox 16s linear infinite; }
@keyframes catbox { from { left: -12%; } to { left: 104%; } }
.cam-cat { animation: catwalk 16s linear infinite; }
@keyframes catwalk { from { transform: translate(-20px, 128px); } to { transform: translate(340px, 128px); } }
.cam-sheet { width: min(860px, 100%) !important; }
.cam-scrub { position: relative; margin-top: 12px; }
.cam-scrub input { width: 100%; accent-color: var(--violet); }
.cam-marks { position: relative; height: 8px; } .cam-marks i { position: absolute; top: 0; width: 3px; height: 8px; border-radius: 2px; background: var(--violet); }
.sec-list { display: flex; flex-direction: column; gap: 6px; }
.sec-row { display: grid; grid-template-columns: 36px minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 8px; border-radius: 14px; background: var(--surface-2); }
.sec-row b { display: block; font-size: 14px; } .sec-row small { font-size: 11.5px; color: var(--muted); }
.sec-ic { width: 36px; height: 36px; border-radius: 11px; display: grid; place-items: center; background: var(--surface); color: var(--muted); }
.sec-ic .ic { width: 19px; height: 19px; } .sec-ic.ok { color: var(--good); } .sec-ic.bad { color: var(--bad); background: color-mix(in srgb, var(--bad) 12%, var(--surface)); }
@media (max-width: 760px) { .sec-hero { grid-template-columns: auto minmax(0, 1fr); } .sec-hero > .btn { grid-column: 1 / -1; } .sec-shield { width: 72px; height: 72px; } .sec-ht h2 { font-size: 21px; } }
/* Mere-menu */
.more-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
.more-grid button { border: 0; background: var(--surface-2); border-radius: 18px; padding: 16px 8px; display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--ink); }
.more-grid button .ic { width: 26px; height: 26px; color: var(--violet); }
.more-grid button[aria-current="true"] { background: color-mix(in srgb, var(--violet) 14%, var(--surface)); }
/* Temaer */
.sk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; }
.sk { border: 2px solid transparent; background: var(--surface-2); border-radius: 18px; padding: 8px; display: flex; flex-direction: column; gap: 8px; color: var(--ink); font-weight: 700; transition: border-color .2s, transform .15s; }
.sk[aria-pressed="true"] { border-color: var(--sa); transform: translateY(-2px); }
.sk-prev { position: relative; height: 70px; border-radius: 12px; background: var(--sb); overflow: hidden; box-shadow: inset 0 0 0 1px rgba(0,0,0,.06); }
.sk-sky { position: absolute; inset: 0 0 60%; background: linear-gradient(180deg, color-mix(in srgb, var(--sa) 60%, #0B1030), color-mix(in srgb, var(--sa) 30%, #fff)); }
.sk-card { position: absolute; left: 8px; right: 8px; top: 34px; height: 28px; border-radius: 7px; background: color-mix(in srgb, var(--sb) 40%, #fff); box-shadow: 0 2px 6px rgba(0,0,0,.1); }
.sk-btn { position: absolute; left: 14px; top: 42px; width: 30px; height: 10px; border-radius: 5px; background: var(--sa); }
.sk-chip { position: absolute; right: 14px; top: 42px; width: 18px; height: 10px; border-radius: 5px; background: color-mix(in srgb, var(--sa) 30%, #fff); }

/* Familieindstillinger med faner */
.set-tabs { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; margin-bottom: 14px; padding: 2px; }
.set-tabs button { flex: none; border: 1.5px solid var(--line); background: var(--surface); border-radius: 999px; padding: 7px 14px; font-weight: 700; font-size: 13.5px; color: var(--muted); }
.set-tabs button[aria-pressed="true"] { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.set-wrap > [data-st] { display: none; }
.set-wrap[data-t="funk"] > [data-st="funk"] { display: block; }
.set-wrap[data-t="born"] > [data-st="born"] { display: block; }
.set-wrap[data-t="osky"] > [data-st="osky"] { display: block; }
.set-wrap[data-t="musik"] > [data-st="musik"] { display: block; }
.set-wrap[data-t="pynt"] > [data-st="pynt"] { display: block; }
.set-wrap[data-t="qa"] > [data-st="qa"] { display: block; }
.set-wrap[data-t="alarm"] > [data-st="alarm"] { display: block; }
.set-wrap[data-t="ret"] > [data-st="ret"] { display: block; }
.set-wrap > [data-st][hidden] { display: none !important; }
/* Ønskeskyen */
.os-acc { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 8px; }
.os-a { display: grid; grid-template-columns: 40px minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 10px; border-radius: 16px; background: var(--surface-2); }
.os-a.on { background: color-mix(in srgb, #2F80ED 10%, var(--surface)); }
.os-a b { display: block; } .os-a small { font-size: 12px; color: var(--muted); }
.os-lists { display: flex; flex-direction: column; gap: 6px; }
.os-l { display: grid; grid-template-columns: 36px minmax(0, 1fr) minmax(130px, 190px); gap: 10px; align-items: center; padding: 8px 10px; border-radius: 14px; background: var(--surface-2); }
.os-l.off { opacity: .55; }
.os-l b { display: block; font-size: 14px; } .os-l small { font-size: 11.5px; color: var(--muted); }
.os-ic { width: 36px; height: 36px; border-radius: 11px; background: color-mix(in srgb, #2F80ED 14%, var(--surface)); color: #2F80ED; display: grid; place-items: center; }
.os-ic .ic { width: 18px; height: 18px; }
.os-l select { border: 1.5px solid var(--line); background: var(--surface); border-radius: 10px; padding: 7px 8px; font-weight: 600; color: var(--ink); width: 100%; }
@media (max-width: 560px) { .os-l { grid-template-columns: 36px minmax(0, 1fr); } .os-l select { grid-column: 1 / -1; } }
/* Børn */
.kset { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
.kset-k { border-radius: 18px; padding: 12px; background: color-mix(in srgb, var(--pc) 7%, var(--surface-2)); display: flex; flex-direction: column; gap: 10px; }
.kset-h { display: flex; align-items: center; gap: 10px; font-size: 16px; }
.inst { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 5px; }
.inst button { border: 1.5px solid var(--line); background: var(--surface); border-radius: 12px; padding: 6px 2px; display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 11.5px; font-weight: 700; color: var(--ink); }
.inst button span { font-size: 18px; }
.inst button[aria-pressed="true"] { border-color: var(--pc); background: color-mix(in srgb, var(--pc) 16%, var(--surface)); }
.bd-f { display: grid; grid-template-columns: 36px minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 8px 10px; border-radius: 14px; background: var(--surface); }
.bd-ic { width: 36px; height: 36px; border-radius: 11px; background: var(--surface-2); display: grid; place-items: center; font-size: 19px; }
.bd-f b { display: block; font-size: 14px; } .bd-f small { font-size: 12px; color: var(--muted); }
.bd-f input { border: 1.5px solid var(--line); background: var(--surface); border-radius: 10px; padding: 6px 8px; color: var(--ink); }
.kprof { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 8px; }
.kprof .bd-f { background: var(--surface-2); }
.kid-lock { opacity: .55; }
.card-head .meta .ic { width: 13px; height: 13px; vertical-align: -2px; }
.dec-p input { border: 0; background: var(--surface-2); border-radius: 999px; padding: 4px 8px; font: inherit; font-weight: 600; color: var(--ink); }
/* Musik: færre scroll */
.mu-tabs { display: none; margin-bottom: 12px; }
.mu-layout { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(300px, 1fr); grid-template-areas: "a b" "c c"; gap: 16px; align-items: start; }
.mu-pa { grid-area: a; min-width: 0; } .mu-pb { grid-area: b; max-height: 470px; overflow-y: auto; } .mu-pc { grid-area: c; }
.mu-pb .mu-grid { grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 10px; }
.mu-spks { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important; gap: 8px !important; }
.mu-spk { grid-template-columns: 34px minmax(0, 1fr) 34px !important; padding: 8px !important; gap: 4px 8px !important; }
.mu-si { width: 34px !important; height: 34px !important; border-radius: 11px !important; } .mu-si .ic { width: 20px !important; height: 20px !important; }
.mu-link { width: 34px !important; height: 34px !important; }
.mu-hero { min-height: 0; }
.mu-pick { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; }
.mu-pick button { display: grid; grid-template-columns: 26px minmax(0, 1fr); gap: 10px; align-items: center; text-align: left; border: 1.5px solid var(--line); background: var(--surface); border-radius: 14px; padding: 8px 10px; color: var(--ink); }
.mu-pick button .ic { width: 22px; height: 22px; } .mu-pick b { display: block; font-size: 13.5px; } .mu-pick small { font-size: 11px; color: var(--muted); }
.mu-pick button[aria-pressed="true"] { border-color: var(--violet); background: color-mix(in srgb, var(--violet) 8%, var(--surface)); }
@media (max-width: 899px) {
  .mu-tabs { display: flex; }
  .mu-layout { display: block; }
  .mu [data-pane] { display: none; } .mu[data-tab="spiller"] [data-pane="spiller"], .mu[data-tab="hojt"] [data-pane="hojt"], .mu[data-tab="udforsk"] [data-pane="udforsk"] { display: block; }
  .mu-pb { max-height: none; }
}
/* Apparater: små kort */
.ap-tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 10px; }
.ap-t { background: var(--surface); border-radius: 18px; box-shadow: var(--shadow); padding: 10px; display: flex; flex-direction: column; gap: 8px; }
.ap-t.off { opacity: .7; } .ap-t.off .ap-art { filter: grayscale(.8); }
.ap-t.run { box-shadow: 0 0 0 2px color-mix(in srgb, var(--good) 45%, transparent), var(--shadow); }
.ap-t.fut { box-shadow: none; border: 1.5px dashed var(--line); opacity: .75; }
.ap-tb { display: grid; grid-template-columns: 56px minmax(0, 1fr); gap: 10px; align-items: center; border: 0; background: none; padding: 0; text-align: left; color: var(--ink); width: 100%; }
.ap-t .ap-art { width: 56px; height: 56px; aspect-ratio: auto; padding: 4px; border-radius: 14px; }
.ap-art.lg { width: 120px; height: 120px; padding: 8px; }
.ap-tt b { display: block; font-size: 14.5px; } .ap-tt small { display: block; font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ap-tt .ap-st { display: inline-flex; padding: 0; background: none; font-size: 12px; margin: 1px 0; }
.ap-c { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.ap-mini-b, .ap-pw { border: 1.5px solid var(--line); background: var(--surface); border-radius: 999px; padding: 5px 10px; font-size: 12.5px; font-weight: 700; color: var(--ink); display: inline-flex; gap: 5px; align-items: center; }
.ap-mini-b .ic, .ap-pw .ic { width: 14px; height: 14px; }
.ap-mini-b.pri { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.ap-pw.on { background: var(--good); border-color: var(--good); color: #fff; }
.ap-left { font-size: 12.5px; font-weight: 700; color: #3B82F6; }
.ap-sh { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 16px; align-items: start; margin-top: 10px; }
.ap-sh .ap-facts { margin-top: 8px; }
.ap-pulse { animation: apblink 2s ease-in-out infinite; }
/* Sikkerhed: alt på én skærm */
.sx-status { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 14px; align-items: center; padding: 12px 16px; border-radius: 22px; background: linear-gradient(120deg, color-mix(in srgb, var(--ac) 14%, var(--surface)), var(--surface)); box-shadow: var(--shadow); margin-bottom: 14px; }
.sx-status .sec-shield { width: 58px; height: 58px; } .sx-status .sec-shield > .ic { width: 28px; height: 28px; }
.sx-st b { display: block; font-family: var(--font-display); font-size: 20px; margin: 1px 0 6px; }
.sx-st .sec-chips { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; }
.sx-st .sec-chips span { flex: none; }
.sx-tabs { display: none; margin-bottom: 12px; }
.sx-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 16px; align-items: start; }
.sx-side { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.sx-plan .card-head { flex-wrap: wrap; gap: 8px; }
.sx-layers { display: flex; gap: 4px; flex-wrap: wrap; }
.sx-layers button { border: 1.5px solid var(--line); background: var(--surface); border-radius: 999px; padding: 4px 10px; font-size: 12px; font-weight: 700; color: var(--muted); }
.sx-layers button[aria-pressed="true"] { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.sec-room { fill: var(--surface); stroke: color-mix(in srgb, var(--ink) 30%, transparent); stroke-width: 4; cursor: pointer; transition: fill .4s; }
.sec-room.lit { fill: color-mix(in srgb, #FFD98A 45%, var(--surface)); }
.sec-outline { fill: none; stroke: var(--ink); stroke-width: 10; opacity: .8; stroke-linejoin: round; }
.sec-plan .sec-lbl { font-size: 22px; } .sec-plan .sec-lbl.sm { font-size: 17px; } .sec-plan .sec-lbl.out { font-size: 26px; } .sec-plan .sec-lbl.big { font-size: 34px; }
.sx-deckbg { fill: color-mix(in srgb, #A0794F 26%, var(--surface-2)); } .sx-deckln { stroke: color-mix(in srgb, #A0794F 40%, transparent); stroke-width: 1.5; }
.sx-det circle { fill: #F2C230; stroke: #fff; stroke-width: 3; } .sx-det .dot { fill: #fff; stroke: none; } .sx-det .ring { fill: none; stroke: #F2C230; opacity: 0; }
.sx-det.live .ring { animation: secping 1.6s ease-out infinite; transform-box: fill-box; transform-origin: center; }
.sx-smoke circle { fill: #B94FD1; stroke: #fff; stroke-width: 3; } .sx-smoke .dot { fill: #9EF0B8; stroke: none; animation: apblink 3s steps(2) infinite; }
.sec-cam .cam-dot { fill: #2F6FED; stroke: #fff; stroke-width: 3; }
.sx-mk circle { stroke: #fff; stroke-width: 3; } .sx-mk.sonos circle { fill: #E5484D; } .sx-mk.tv circle { fill: #1E9E62; } .sx-mk.ap circle { fill: #F97316; }
.sec-plan .sec-door, .sec-plan .sec-win, .sec-plan .sec-port { stroke: #fff; stroke-width: 3; }
.sx-ctls { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; }
.sx-ctl { display: inline-flex; align-items: center; gap: 8px; border: 1.5px solid var(--line); background: var(--surface); border-radius: 14px; padding: 6px 10px; text-align: left; color: var(--ink); }
.sx-ctl .ic { width: 18px; height: 18px; color: var(--good); } .sx-ctl b { display: block; font-size: 12.5px; } .sx-ctl small { font-size: 11px; color: var(--muted); }
.sx-ctl.bad { border-color: var(--bad); } .sx-ctl.bad .ic { color: var(--bad); }
.lg.det { width: 10px; height: 10px; border-radius: 50%; background: #F2C230; } .lg.smk { border: 0; background: #B94FD1; } .lg.cam { background: #2F6FED; } .lg.son { width: 10px; height: 10px; border-radius: 50%; background: #E5484D; } .lg.tvv { width: 10px; height: 10px; border-radius: 50%; background: #1E9E62; } .lg.apx { width: 10px; height: 10px; border-radius: 50%; background: #F97316; }
.cam-grid.sm { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.cam-grid.sm .cam-ov { font-size: 11.5px; } .cam-grid.sm .cam-live { font-size: 9.5px; }
.sx-side .sec-tl { max-height: 250px; }
.filters.sm .fchip { padding: 4px 10px; font-size: 12px; }
@media (max-width: 1000px) {
  .sx-tabs { display: flex; }
  .sx-grid { display: block; }
  .sx [data-pane] { display: none; } .sx[data-tab="huset"] [data-pane="huset"], .sx[data-tab="kamera"] [data-pane="kamera"], .sx[data-tab="haendelser"] [data-pane="haendelser"] { display: block; }
  .sx-side { display: block; } .sx-side .sec-tl { max-height: none; }
  .sx-status { grid-template-columns: auto minmax(0, 1fr); } .sx-status > .btn { grid-column: 1 / -1; }
}
@media (max-width: 620px) { .sec-plan { min-width: 0 !important; } .cam-grid.sm { grid-template-columns: minmax(0, 1fr); } }

@media (max-width: 860px) {
  .s8, .s7, .s6, .s5, .s4 { grid-column: span 12; }
  .status .wrap { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .st.el { grid-column: span 2; border-bottom: 1px solid var(--line); padding-right: 0; }
  .st + .st { border-left: 0; padding-left: 0; }
  .st.car2 { border-left: 1px solid var(--line); padding-left: 10px; }
  .week { grid-template-columns: minmax(0, 1fr); }
  .wday { min-height: 0; }
  .kids { gap: 8px; }
  .kid { padding: 14px 8px; }
  .big-ring { width: 78px; height: 78px; }
  .big-ring .av { inset: 14px; font-size: 20px; }
  .score { font-size: 24px; }
  .cols-2 { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 640px) {
  .tl-ev.row2 { bottom: 28px; }
  .tl-ev { height: 18px; padding: 0 4px !important; }
  .tl-ev i { width: 8px; height: 8px; }
  .qa { width: 84px; padding: 10px 4px 8px; border-radius: 20px; }
  .qa-ic { width: 42px; height: 42px; }
  .qar { grid-template-columns: 38px minmax(0, 1fr) auto; }
  .qar-who { grid-column: 1 / -1; grid-row: 2; padding-left: 50px; }
  .al-modes { gap: 6px; }
  .hbtn { width: 34px; height: 34px; }
  .pod { width: 236px; }
  .sr { width: 60px; height: 60px; }
  .sr .av { inset: 6px; font-size: 19px; }
  .story b { font-size: 12px; }
  .stk .av { width: 32px; height: 32px; font-size: 12px; }
  .stk { margin-left: -12px; }
  .live { gap: 10px; padding: 10px 12px; }
  .live-it { font-size: 13px; line-height: 1.25; }
  .live-it > span:last-child { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .live-tag { display: none; }
  .hb-p .av { width: 34px; height: 34px; }
  .hb-p small { font-size: 10px; }
  .fsum { width: 150px; }
  .hero { height: 376px; }
  .hero.open { height: 560px; }
  .hero.compact { height: 72px; }
  .brand .nm, .clock { display: none; }
  .hero.compact .brand svg { width: 30px; height: 30px; }
  .me .nm { display: none; }
  .me { padding: 3px; }
  .tl-ev span.lbl { display: none; }
  .tl-ev { padding: 0 6px; }
  .tl-next { display: block; }
  .tl-hint { display: none; }
  .tl-wx div.odd { display: none; }
  .wk { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .hero.open .wk { max-height: 220px; }
  .tabs { position: fixed; top: auto; bottom: 0; left: 0; right: 0; border-top: 1px solid var(--line); border-bottom: 0; background: color-mix(in srgb, var(--surface) 92%, transparent); }
  .tabs .wrap { justify-content: space-around; padding-block: 6px calc(6px + env(safe-area-inset-bottom, 0px)); }
  .tab { flex-direction: column; gap: 2px; font-size: 11px; padding: 6px 8px; }
  .tab[aria-selected="true"] { background: transparent; box-shadow: none; color: var(--violet); }
  .tab .badge { position: absolute; top: 0; right: 4px; }
  main { padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px)); }
  .spark-note { font-size: 11px; }
  .st.el { gap: 10px; }
  .el-now b { font-size: 22px; }
  .st.car .st-sub.l2 { display: none; }
  .st.car { gap: 8px; }
  .st.car .st-main { white-space: normal; font-size: 13px; line-height: 1.2; }
  .st.car .ring { width: 36px; height: 36px; }
  .nownext { grid-template-columns: minmax(0, 1fr); }
  .rights { grid-template-columns: minmax(0, 1fr) repeat(2, 58px); }
  .evp-plan { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
/* ---------- Huset: plan, markører og kort ---------- */
.sx-stage { position: relative; }
.sx-edit { display: inline-flex; align-items: center; gap: 5px; border: 1.5px dashed color-mix(in srgb, var(--violet) 55%, transparent) !important; color: var(--violet) !important; background: color-mix(in srgb, var(--violet) 8%, var(--surface)) !important; }
.sx-edit .ic { width: 14px; height: 14px; }
.hx-wall { stroke: color-mix(in srgb, var(--ink) 78%, var(--surface)); stroke-width: 7; stroke-linecap: square; }
.hx-wall.k-ext { stroke-width: 12; stroke: var(--ink); }
.hx-wall.k-open { stroke-width: 4; stroke-dasharray: 10 9; opacity: .55; }
.hx-drive { fill: color-mix(in srgb, #9A9A98 35%, var(--surface-2)); } .hx-lawn { fill: color-mix(in srgb, #7FA36A 45%, var(--surface-2)); }
.sec-room { stroke: none !important; }
.sec-plan .sec-room:hover { fill: color-mix(in srgb, #FFD98A 18%, var(--surface)); }
.sec-plan .sec-room.lit:hover { fill: color-mix(in srgb, #FFD98A 55%, var(--surface)); }
.ho { cursor: pointer; outline: none; }
.ho-hit { fill: transparent; }
.ho-gap { fill: var(--surface); }
.ho-door .ho-leaf rect { fill: var(--good); stroke: var(--surface); stroke-width: 1.5; }
.ho-leaf, .ho-sash { transform-box: fill-box; transform-origin: 0% 50%; transition: transform 1.4s cubic-bezier(.25,1.2,.4,1); }
.ho-arc { fill: none; stroke: color-mix(in srgb, var(--ink) 30%, transparent); stroke-width: 1.6; stroke-dasharray: 5 6; }
.ho-hinge { fill: var(--ink); opacity: .55; }
.ho-door.open .ho-leaf rect { fill: var(--warn); }
.ho-door.open .ho-arc { stroke: var(--warn); stroke-dasharray: none; opacity: .8; }
.ho-leaf.a-open { animation: hoOpen 2s cubic-bezier(.25,1.2,.4,1) both; } .ho-leaf.a-close { animation: hoClose 1.6s cubic-bezier(.45,0,.3,1.15) both; }
.ho-sash.a-open { animation: hoOpen 1.8s cubic-bezier(.25,1.2,.4,1) both; }
@keyframes hoOpen { from { transform: rotate(0deg); } to { transform: rotate(var(--ang)); } }
@keyframes hoClose { from { transform: rotate(var(--ang)); } to { transform: rotate(0deg); } }
.ho-glass { stroke: #7FB9E8; stroke-width: 3; stroke-linecap: round; }
.ho-window.open .ho-glass { stroke: var(--warn); }
.ho-sash rect { fill: var(--warn); stroke: var(--surface); stroke-width: 1.5; }
.ho-window.off .ho-glass { stroke: var(--muted); stroke-dasharray: 6 5; opacity: .7; }
.ho-alert { fill: color-mix(in srgb, var(--warn) 22%, transparent); stroke: var(--warn); stroke-width: 2; transform-box: fill-box; transform-origin: center; animation: hoPulse 3.2s ease-out infinite; }
@keyframes hoPulse { 0% { transform: scale(.7); opacity: .9; } 100% { transform: scale(1.35); opacity: 0; } }
.ho-pbody { fill: var(--good); stroke: var(--surface); stroke-width: 2; transition: fill .4s; } .ho-pln { stroke: rgba(255,255,255,.7); stroke-width: 2; }
.ho-port.open .ho-pbody, .ho-port.open { opacity: 1; }
.ho-port.open .ho-pbody { fill: var(--warn); stroke-dasharray: 8 6; animation: portRoll 3s linear infinite; }
.ho-port.a-open { animation: portUp 2.2s cubic-bezier(.3,1.3,.5,1) both; transform-box: fill-box; transform-origin: center top; }
.ho-port.a-close { animation: portDown 2s cubic-bezier(.3,1.3,.5,1) both; transform-box: fill-box; transform-origin: center top; }
@keyframes portUp { 0% { transform: scaleY(1); } 50% { transform: scaleY(.25) translateY(-14px); } 100% { transform: scaleY(1); } }
@keyframes portDown { 0% { transform: translateY(-14px); opacity: .4; } 100% { transform: none; opacity: 1; } }
@keyframes portRoll { to { stroke-dashoffset: -28; } }
.ho-plbl { font-size: 17px !important; }
.ho-lock circle { fill: var(--warn); stroke: var(--surface); stroke-width: 3; }
.ho-lock.locked circle { fill: var(--good); }
.ho-lock .lk-body { fill: #fff; } .ho-lock .lk-sh { fill: none; stroke: #fff; stroke-width: 2.2; stroke-linecap: round; transition: transform .4s; }
.ho-lock:not(.locked) .lk-sh { transform: translateY(-2.5px); }
.ho-lock.a-lock { animation: lockPop 1.2s cubic-bezier(.3,1.6,.5,1); transform-box: fill-box; transform-origin: center; }
@keyframes lockPop { 0% { transform: scale(.6); } 60% { transform: scale(1.25); } 100% { transform: scale(1); } }
.ho:hover .ho-leaf rect, .ho:focus-visible .ho-leaf rect, .ho:hover .ho-glass, .ho:hover .ho-pbody { filter: brightness(1.15) drop-shadow(0 0 6px var(--hc)); }
/* Markører */
.hm { cursor: pointer; outline: none; }
.hm-body { transition: transform .25s cubic-bezier(.3,1.6,.5,1); }
.hm:hover .hm-body, .hm:focus-visible .hm-body, .hm.sel .hm-body { transform: scale(1.22); }
.hm-body { transition-duration: .4s !important; }
.hm-base { fill: var(--hc); stroke: #fff; stroke-width: 3.5; filter: drop-shadow(0 3px 5px rgba(0,0,0,.25)); }
.hm-ic { fill: none; stroke: #fff; stroke-width: 2.1; stroke-linecap: round; stroke-linejoin: round; pointer-events: none; }
.hm.nolink .hm-base { fill: var(--surface); stroke: var(--hc); stroke-dasharray: 5 4; } .hm.nolink .hm-ic { stroke: var(--hc); }
.hm-tip { opacity: 0; transform: translateY(6px); transition: opacity .2s, transform .2s; pointer-events: none; }
.hm-tip rect { fill: var(--ink); } .hm-tip text { fill: var(--bg); font: 800 15px var(--font-body); }
.hm:hover .hm-tip, .hm:focus-visible .hm-tip { opacity: 1; transform: none; }
.hm-cone { fill: color-mix(in srgb, #2F6FED 16%, transparent); stroke: color-mix(in srgb, #2F6FED 35%, transparent); stroke-width: 1.5; stroke-dasharray: 6 6; pointer-events: none; }
.hm-scan { stroke: #2F6FED; stroke-width: 3; stroke-linecap: round; opacity: .55; animation: camScan 10s ease-in-out infinite alternate; pointer-events: none; }
@keyframes camScan { from { transform: rotate(calc(var(--s) * -1)); } to { transform: rotate(var(--s)); } }
.hm-rec { fill: #FF3B3B; stroke: #fff; stroke-width: 2; animation: apblink 2.4s steps(2) infinite; }
.hm-radar path { fill: color-mix(in srgb, #EAB308 30%, transparent); }
.hm-radar { animation: spin 10s linear infinite; pointer-events: none; opacity: .7; }
.hm-rip { fill: none; stroke: #EAB308; stroke-width: 3; opacity: 0; transform-box: fill-box; transform-origin: center; pointer-events: none; }
.hm.live .hm-rip { animation: ripple 2.6s ease-out infinite; } .hm.live .hm-rip.r2 { animation-delay: 1.3s; }
.hm.live .hm-base { fill: #F59E0B; } .hm.live .hm-radar { animation-duration: 3s; opacity: 1; }
@keyframes ripple { 0% { transform: scale(.9); opacity: .9; } 100% { transform: scale(3); opacity: 0; } }
.hm-waves circle, .hm-wifi circle { fill: none; stroke: var(--hc); stroke-width: 2.5; transform-box: fill-box; transform-origin: center; opacity: 0; pointer-events: none; }
.hm-waves circle { animation: ripple 3.2s ease-out infinite; }
.hm-wifi circle { stroke-width: 2; animation: wifiOut 6s ease-out infinite; }
@keyframes wifiOut { 0% { transform: scale(1); opacity: .55; } 100% { transform: scale(4.2); opacity: 0; } }
.hm.st-play:not(.hm-ap) .hm-body { animation: bump 1.1s ease-in-out infinite alternate; }
@keyframes bump { to { transform: scale(1.1); } }
.hm-breath { fill: color-mix(in srgb, #A855F7 18%, transparent); transform-box: fill-box; transform-origin: center; animation: breath 7s ease-in-out infinite; pointer-events: none; }
@keyframes breath { 0%, 100% { transform: scale(.75); opacity: .3; } 50% { transform: scale(1.15); opacity: .8; } }
.hm-okdot { fill: #3CCB83; stroke: #fff; stroke-width: 2; }
.hm-flick { fill: color-mix(in srgb, #7DD3FC 40%, transparent); animation: flick 3s steps(5) infinite; pointer-events: none; }
@keyframes flick { 0% { opacity: .2; } 30% { opacity: .7; } 60% { opacity: .35; } 100% { opacity: .6; } }
.hm-lampglow { fill: url(#hx-lit); pointer-events: none; }
.hm-val rect { fill: var(--ink); } .hm-val text { fill: var(--bg); font: 800 13px var(--font-body); }
/* Kortet ved en markør */
.hm-pop { position: absolute; z-index: 6; width: 268px; transform: translate(-50%, calc(-100% - 26px)); background: var(--surface); border-radius: 20px; padding: 12px; box-shadow: 0 18px 44px rgba(10,10,30,.28), 0 0 0 1px var(--line); animation: popIn .32s cubic-bezier(.3,1.5,.5,1) both; transform-origin: 50% 100%; }
.hm-pop.below { transform: translate(-50%, 26px); transform-origin: 50% 0; }
.hm-pop.l { transform: translate(-14%, calc(-100% - 26px)); } .hm-pop.l.below { transform: translate(-14%, 26px); }
.hm-pop.r { transform: translate(-86%, calc(-100% - 26px)); } .hm-pop.r.below { transform: translate(-86%, 26px); }
@keyframes popIn { from { opacity: 0; scale: .85; } to { opacity: 1; scale: 1; } }
.hp-h { display: grid; grid-template-columns: 36px minmax(0, 1fr) auto; gap: 10px; align-items: center; }
.hp-h b { display: block; font-size: 14.5px; line-height: 1.2; } .hp-h small { font-size: 11.5px; color: var(--muted); }
.hp-ic { width: 36px; height: 36px; border-radius: 12px; display: grid; place-items: center; background: color-mix(in srgb, var(--hc) 16%, var(--surface)); color: var(--hc); }
.hp-ic .ic { width: 19px; height: 19px; }
.hp-x { border: 0; background: var(--surface-2); width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; color: var(--muted); }
.hp-x .ic { width: 15px; height: 15px; }
.hp-st { display: inline-flex; align-items: center; gap: 7px; margin: 10px 0 8px; font-weight: 800; font-size: 13px; padding: 5px 10px; border-radius: 999px; background: var(--surface-2); }
.hp-st i { width: 8px; height: 8px; border-radius: 50%; background: var(--muted); }
.hp-st.st-ok i { background: var(--good); } .hp-st.st-bad { background: color-mix(in srgb, var(--warn) 16%, var(--surface)); } .hp-st.st-bad i, .hp-st.st-warn i { background: var(--warn); animation: apblink 1s steps(2) infinite; }
.hp-st.st-play i, .hp-st.st-live i { background: var(--hc); animation: apblink .8s steps(2) infinite; } .hp-st.st-off i { background: var(--bad); }
.hp-row { display: flex; justify-content: space-between; gap: 10px; font-size: 13px; padding: 5px 0; border-top: 1px solid var(--line); } .hp-row span { color: var(--muted); }
.hp-big { width: 100%; display: grid; grid-template-columns: 34px minmax(0, 1fr) 42px; gap: 10px; align-items: center; text-align: left; border: 0; border-radius: 16px; padding: 9px 10px; background: var(--surface-2); color: var(--ink); margin: 4px 0; }
.hp-big > .ic { width: 22px; height: 22px; color: var(--muted); } .hp-big b { display: block; font-size: 14px; } .hp-big small { font-size: 11.5px; color: var(--muted); }
.hp-big.on > .ic { color: var(--good); } .hp-big.warn > .ic { color: var(--warn); }
.hp-sw { width: 40px; height: 24px; border-radius: 12px; background: color-mix(in srgb, var(--ink) 20%, transparent); position: relative; transition: background .25s; }
.hp-sw::after { content: ""; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform .3s cubic-bezier(.3,1.6,.5,1); box-shadow: 0 1px 3px rgba(0,0,0,.25); }
.hp-big.on .hp-sw { background: var(--good); } .hp-big.on .hp-sw::after { transform: translateX(16px); }
.hp-sim { display: block; margin-top: 6px; font-size: 12px; }
.hp-ent { margin-top: 8px; font-size: 11px; color: var(--muted); font-family: ui-monospace, monospace; word-break: break-all; }
.hp-ent .lnk { font-family: var(--font-body); font-size: 11.5px; }
.hp-cam { position: relative; display: block; width: 100%; border: 0; padding: 0; border-radius: 14px; overflow: hidden; aspect-ratio: 16 / 9; background: #111; }
.hp-cam .cam-live { position: absolute; top: 6px; right: 6px; color: #fff; } .hp-open { position: absolute; left: 8px; bottom: 6px; color: #fff; font-weight: 800; font-size: 12px; text-shadow: 0 1px 3px rgba(0,0,0,.6); }
.hp-now { display: grid; grid-template-columns: 44px minmax(0, 1fr) 40px; gap: 10px; align-items: center; } .hp-now .cover { width: 44px; height: 44px; border-radius: 10px; }
.hp-now b { display: block; font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .hp-now small { font-size: 11.5px; color: var(--muted); }
.hp-pl { width: 40px; height: 40px; border-radius: 50%; border: 0; background: var(--ink); color: var(--bg); display: grid; place-items: center; } .hp-pl .ic { width: 18px; height: 18px; }
.hp-vol { display: grid; grid-template-columns: 20px minmax(0, 1fr) 28px; gap: 8px; align-items: center; margin: 10px 0 4px; } .hp-vol .ic { width: 18px; height: 18px; color: var(--muted); } .hp-vol input { width: 100%; accent-color: var(--hc); }
.sec-chips .warnc { color: var(--warn); } .sec-chips .warnc .ic { color: var(--warn); }
@media (max-width: 620px) { .hm-pop { width: 236px; } .sec-scroll { overflow-x: auto; margin: 0 -16px; padding: 0 16px; scroll-snap-type: x proximity; } .sx-stage { width: 620px; } .sec-plan { min-width: 0 !important; } .hm-tip { display: none; } .sx-swipe { display: block !important; } }
.sx-swipe { display: none; font-size: 12px; color: var(--muted); margin: 6px 0 0; }
/* ---------- Husbygger ---------- */
.hz-top { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
.hz-top .h2 { margin: 2px 0 0; }
.hz-acts { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.hz-dirty { font-size: 12px; font-weight: 800; color: var(--warn); background: color-mix(in srgb, var(--warn) 14%, var(--surface)); padding: 4px 10px; border-radius: 999px; animation: pop .3s both; }
.hz-body { display: grid; grid-template-columns: 96px minmax(0, 1fr) 300px; gap: 12px; align-items: start; }
.hz-tools { display: flex; flex-direction: column; gap: 12px; background: var(--surface); border-radius: 20px; padding: 10px 8px; box-shadow: var(--shadow); position: sticky; top: 76px; max-height: calc(100vh - 100px); overflow-y: auto; scrollbar-width: none; }
.hz-tg { display: flex; flex-direction: column; gap: 4px; } .hz-tg small { font-size: 10.5px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: .6px; padding: 0 4px; }
.hz-tool { border: 0; background: transparent; border-radius: 14px; padding: 7px 4px; display: flex; flex-direction: column; align-items: center; gap: 3px; color: var(--ink); font-size: 11px; font-weight: 700; }
.hz-tool .ic { width: 21px; height: 21px; color: var(--hc, var(--ink)); }
.hz-tool:hover { background: var(--surface-2); }
.hz-tool[aria-pressed="true"] { background: var(--ink); color: var(--bg); } .hz-tool[aria-pressed="true"] .ic { color: var(--bg); }
.hz-canvas { position: relative; background: var(--surface); border-radius: 22px; box-shadow: var(--shadow); overflow: hidden; }
#hz-svg { display: block; width: 100%; height: max(480px, calc(100vh - 250px)); touch-action: none; cursor: crosshair; user-select: none; -webkit-user-select: none; }
.hz-bg { pointer-events: all; } .hz-gl { fill: none; stroke: color-mix(in srgb, var(--ink) 7%, transparent); stroke-width: 1; } .hz-gl2 { fill: none; stroke: color-mix(in srgb, var(--ink) 14%, transparent); stroke-width: 1.5; }
#hz-svg .sec-room { fill: color-mix(in srgb, var(--violet) 5%, var(--surface)); cursor: move; } #hz-svg .sec-room.sel { fill: color-mix(in srgb, var(--violet) 16%, var(--surface)); stroke: var(--violet) !important; stroke-width: 3; stroke-dasharray: 10 6; }
#hz-svg .sec-lbl { font-size: 22px; } #hz-svg .sec-lbl.out { font-size: 24px; }
#hz-svg .hx-wall { cursor: move; } #hz-svg .hx-wall:hover { stroke: color-mix(in srgb, var(--violet) 70%, var(--ink)); } #hz-svg .hx-wall.sel { stroke: var(--violet); }
#hz-svg .hx-area { cursor: move; } #hz-svg .hx-area.sel rect { stroke: var(--violet); stroke-width: 3; stroke-dasharray: 10 6; } #hz-svg text.hx-area.sel { fill: var(--violet); }
#hz-svg .hm, #hz-svg .ho { cursor: grab; }
.hz-h { fill: var(--surface); stroke: var(--violet); stroke-width: 3; cursor: grab; vector-effect: non-scaling-stroke; } .hz-h.on, .hz-h:hover { fill: var(--violet); }
.hz-selring { fill: none; stroke: var(--violet); stroke-width: 3; stroke-dasharray: 7 6; vector-effect: non-scaling-stroke; animation: dash 1s linear infinite; pointer-events: none; }
@keyframes dash { to { stroke-dashoffset: -26; } }
.hz-prev { fill: color-mix(in srgb, var(--violet) 14%, transparent); stroke: var(--violet); stroke-width: 2.5; stroke-dasharray: 8 6; vector-effect: non-scaling-stroke; pointer-events: none; }
.hz-wprev { stroke: var(--violet); stroke-width: 7; stroke-linecap: round; opacity: .7; pointer-events: none; }
.hz-meas { fill: var(--violet); font-weight: 800; font-family: var(--font-body); pointer-events: none; paint-order: stroke; stroke: var(--surface); stroke-width: 4px; }
.hz-ghost { fill: color-mix(in srgb, var(--hc) 35%, transparent); stroke: var(--hc); stroke-width: 2.5; stroke-dasharray: 5 4; pointer-events: none; }
.hz-zoom { position: absolute; top: 10px; right: 10px; display: flex; flex-direction: column; gap: 6px; }
.hz-zoom .iconbtn { background: var(--surface); box-shadow: var(--shadow); } .hz-zoom .iconbtn.on { color: var(--violet); }
.hz-hint { position: absolute; left: 10px; right: 64px; bottom: 10px; display: flex; gap: 10px; align-items: center; background: color-mix(in srgb, var(--ink) 88%, transparent); color: var(--bg); border-radius: 14px; padding: 8px 8px 8px 14px; font-size: 13px; font-weight: 600; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
.hz-hint span { flex: 1; }
.hz-props { background: var(--surface); border-radius: 20px; padding: 16px; box-shadow: var(--shadow); position: sticky; top: 76px; max-height: calc(100vh - 100px); overflow-y: auto; }
.hz-props h3 { margin: 0 0 10px; font-family: var(--font-display); font-size: 20px; } .hz-props h4 { margin: 16px 0 8px; font-size: 13px; color: var(--muted); }
.hz-f { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; } .hz-f > span:first-child { font-size: 12px; font-weight: 800; color: var(--muted); }
.hz-f input:not([type=range]):not([type=checkbox]) { border: 1.5px solid var(--line); border-radius: 12px; padding: 9px 11px; font: inherit; font-size: 14px; background: var(--surface-2); color: var(--ink); width: 100%; }
.hz-f input:focus { outline: none; border-color: var(--violet); }
.hz-f select { border: 1.5px solid var(--line); border-radius: 12px; padding: 9px 11px; font: inherit; font-size: 14px; background: var(--surface-2); color: var(--ink); width: 100%; }
.hz-f input[type=range] { accent-color: var(--violet); }
.hz-f .seg button { font-size: 12px; padding: 6px 8px; }
.ei { display: inline-flex; gap: 5px; align-items: center; font-size: 11.5px; font-weight: 700; } .ei .ic { width: 13px; height: 13px; }
.ei.ok { color: var(--good); } .ei.warn { color: var(--warn); } .ei.bad { color: var(--bad); }
.hz-ph { display: grid; grid-template-columns: 42px minmax(0, 1fr); gap: 10px; align-items: center; margin-bottom: 14px; } .hz-ph b { display: block; font-size: 16px; } .hz-ph small { font-size: 12px; color: var(--muted); }
.hz-pi { width: 42px; height: 42px; border-radius: 14px; display: grid; place-items: center; background: color-mix(in srgb, var(--hc) 16%, var(--surface)); color: var(--hc); } .hz-pi .ic { width: 22px; height: 22px; }
.hz-row2 { display: flex; gap: 8px; flex-wrap: wrap; margin: 4px 0 10px; }
.danger-t { color: var(--bad) !important; }
.hz-lock { background: var(--surface-2); border-radius: 14px; padding: 10px; margin-bottom: 12px; }
.hz-chk { display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 8px; align-items: start; cursor: pointer; } .hz-chk input { width: 18px; height: 18px; accent-color: var(--violet); margin-top: 2px; }
.hz-chk b { display: block; font-size: 13.5px; } .hz-chk small { font-size: 11.5px; color: var(--muted); }
.hz-lock .hz-f { margin: 10px 0 0; }
.hz-cnt { display: grid; grid-template-columns: repeat(auto-fill, minmax(78px, 1fr)); gap: 6px; } .hz-cnt span { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; background: var(--surface-2); border-radius: 12px; padding: 8px; font-size: 11.5px; color: var(--muted); }
.hz-cnt .ic { width: 16px; height: 16px; color: var(--violet); } .hz-cnt b { font-size: 18px; color: var(--ink); }
.hz-un { display: flex; flex-direction: column; gap: 6px; }
.hz-un button { display: grid; grid-template-columns: 30px minmax(0, 1fr) auto; gap: 8px; align-items: center; border: 1.5px dashed color-mix(in srgb, var(--hc) 50%, var(--line)); background: color-mix(in srgb, var(--hc) 6%, var(--surface)); border-radius: 14px; padding: 7px 9px; text-align: left; color: var(--ink); }
.hz-un .ic { width: 20px; height: 20px; color: var(--hc); } .hz-un b { display: block; font-size: 13px; } .hz-un small { font-size: 10.5px; color: var(--muted); word-break: break-all; }
.hz-un i { font-style: normal; font-size: 12px; font-weight: 800; color: var(--hc); }
.hz-how { margin: 0; padding-left: 18px; font-size: 13px; color: var(--ink); display: grid; gap: 4px; }
.hz-reset { display: flex; flex-direction: column; gap: 6px; margin-top: 14px; align-items: flex-start; }
@media (max-width: 1100px) { .hz-body { grid-template-columns: 84px minmax(0, 1fr); } .hz-props { grid-column: 1 / -1; position: static; max-height: none; } }
@media (max-width: 860px) {
  .hz-body { grid-template-columns: minmax(0, 1fr); }
  .hz-tools { position: static; flex-direction: row; max-height: none; overflow-x: auto; padding: 8px; gap: 8px; }
  .hz-tg { flex-direction: row; align-items: center; } .hz-tg small { writing-mode: vertical-rl; transform: rotate(180deg); padding: 0; }
  .hz-tool { min-width: 62px; }
  #hz-svg { height: 58vh; min-height: 340px; }
  .hz-hint { right: 10px; bottom: 10px; font-size: 12px; } .hz-zoom { top: 8px; right: 8px; }
}
/* ---------- Skrald: knappen over spandene ---------- */
.waste-hit { position: absolute; z-index: 4; border: 0; padding: 0; background: transparent; border-radius: 14px; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.waste-hit:hover { background: rgba(255,255,255,.12); } .waste-hit:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
.waste-hit:active { transform: scale(.94); }
.hero.compact .waste-hit { display: none; }
/* ---------- Mere ---------- */
.more-bg { position: fixed; inset: 0; z-index: 65; background: rgba(15,14,25,.42); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); animation: fadeIn .2s both; }
.more-bg.out { animation: fadeOut .22s both; }
@keyframes fadeOut { to { opacity: 0; } }
.more-pop { position: absolute; left: max(10px, env(safe-area-inset-left, 0px)); right: max(10px, env(safe-area-inset-right, 0px)); bottom: calc(78px + env(safe-area-inset-bottom, 0px)); max-width: 520px; margin: 0 auto; background: var(--surface); border-radius: 28px; padding: 8px 14px 14px; box-shadow: 0 24px 60px rgba(10,10,30,.35), 0 0 0 1px var(--line); animation: moreUp .42s cubic-bezier(.2,1.25,.3,1) both; transform-origin: 85% 100%; transition: transform .3s cubic-bezier(.2,.9,.3,1); }
.more-bg.out .more-pop { animation: moreDown .22s ease-in both; }
@keyframes moreUp { from { opacity: 0; transform: translateY(40px) scale(.92); } to { opacity: 1; transform: none; } }
@keyframes moreDown { to { opacity: 0; transform: translateY(30px) scale(.96); } }
.more-grab { display: block; width: 42px; height: 5px; border-radius: 3px; background: var(--line); margin: 2px auto 6px; cursor: grab; touch-action: none; }
.more-h { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; touch-action: none; }
.more-h h2 { margin: 0; font-family: var(--font-display); font-size: 24px; }
.more-tiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.more-t { position: relative; display: grid; grid-template-columns: 44px minmax(0, 1fr) 14px; gap: 10px; align-items: center; text-align: left; border: 0; border-radius: 20px; padding: 12px 10px; color: var(--ink); background: linear-gradient(140deg, color-mix(in srgb, var(--mc) 14%, var(--surface)), color-mix(in srgb, var(--mc) 5%, var(--surface))); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--mc) 18%, transparent); overflow: hidden; animation: tileIn .45s cubic-bezier(.2,1.3,.3,1) both; transition: transform .15s; }
.more-t:active { transform: scale(.96); }
.more-t::after { content: ""; position: absolute; width: 90px; height: 90px; right: -40px; top: -40px; border-radius: 50%; background: var(--mc); opacity: .12; }
@keyframes tileIn { from { opacity: 0; transform: translateY(14px) scale(.94); } to { opacity: 1; transform: none; } }
.more-ic { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; background: var(--mc); color: #fff; box-shadow: 0 6px 14px color-mix(in srgb, var(--mc) 40%, transparent); }
.more-ic .ic { width: 23px; height: 23px; }
.more-tx b { display: block; font-size: 15px; } .more-tx small { display: block; font-size: 11.5px; color: var(--muted); line-height: 1.25; margin-top: 1px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.more-ch { width: 14px; height: 14px; color: var(--muted); }
.more-t[aria-current="true"] { box-shadow: inset 0 0 0 2px var(--mc); }
.more-links { display: flex; gap: 6px; margin-top: 10px; overflow-x: auto; scrollbar-width: none; animation: tileIn .45s cubic-bezier(.2,1.3,.3,1) both; }
.more-links button { flex: none; display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid var(--line); background: var(--surface); border-radius: 999px; padding: 7px 12px; font-size: 12.5px; font-weight: 700; color: var(--ink); }
.more-links .ic { width: 15px; height: 15px; color: var(--violet); }
@media (max-width: 360px) { .more-tiles { grid-template-columns: minmax(0, 1fr); } }
/* ---------- Apparater: rækkefølge ---------- */
.ap-edhint { display: flex; gap: 10px; align-items: center; padding: 10px 14px; border-radius: 16px; background: color-mix(in srgb, var(--violet) 9%, var(--surface)); color: var(--ink); font-size: 13px; font-weight: 600; margin-bottom: 12px; animation: pop .3s both; }
.ap-edhint .ic { width: 18px; height: 18px; color: var(--violet); flex: none; }
.ap-tiles.editing .ap-t { box-shadow: 0 0 0 1.5px color-mix(in srgb, var(--violet) 35%, transparent), var(--shadow); }
.ap-tiles.editing .ap-t .ap-art { animation: jiggle .32s ease-in-out infinite alternate; animation-delay: calc(var(--i) * -70ms); }
.ap-tiles.editing .ap-t:nth-child(even) .ap-art { animation-direction: alternate-reverse; }
@keyframes jiggle { from { transform: rotate(-3deg); } to { transform: rotate(3deg); } }
@keyframes jiggle { from { transform: rotate(-.7deg); } to { transform: rotate(.7deg); } }
.ap-t.dragging { animation: none !important; transform: scale(1.04) rotate(-1.5deg); box-shadow: 0 18px 40px rgba(0,0,0,.25), 0 0 0 2px var(--violet) !important; z-index: 5; position: relative; opacity: .95; }
.ap-t.moved { animation: movedIn .5s cubic-bezier(.2,1.4,.3,1) !important; }
@keyframes movedIn { from { transform: scale(.9); box-shadow: 0 0 0 3px var(--violet); } }
.ap-ord { display: flex; gap: 4px; align-items: center; margin: -2px -2px 0; }
.ap-ord .num { flex: 1; }
.ap-ord .num { font-size: 12px; font-weight: 800; color: var(--violet); }
.ap-hdl { width: 34px; height: 30px; border: 0; border-radius: 10px; background: var(--surface-2); color: var(--ink); display: grid; place-items: center; cursor: grab; touch-action: none; }
.ap-hdl:active { cursor: grabbing; background: var(--violet); color: #fff; }
.ap-hdl .ic { width: 18px; height: 18px; }
.ap-mv { grid-column: auto; width: 30px; height: 30px; border: 0; border-radius: 10px; background: var(--surface-2); color: var(--ink); display: grid; place-items: center; }
.ap-mv:disabled { opacity: .3; } .ap-mv .ic { width: 16px; height: 16px; }
/* ---------- Ønsker: tilføj ---------- */
.wish-new { width: 100%; display: flex; align-items: center; gap: 12px; border: 2px dashed color-mix(in srgb, #2F80ED 45%, var(--line)); background: color-mix(in srgb, #2F80ED 5%, var(--surface)); border-radius: 18px; padding: 12px 14px; color: var(--ink); margin-bottom: 12px; font-size: 15px; transition: background .2s, transform .15s; }
.wish-new:hover { background: color-mix(in srgb, #2F80ED 10%, var(--surface)); } .wish-new:active { transform: scale(.98); }
.wish-new span { width: 36px; height: 36px; border-radius: 12px; display: grid; place-items: center; background: #2F80ED; color: #fff; } .wish-new .ic { width: 20px; height: 20px; }
.wish-new.kid { padding: 16px; font-size: 18px; } .wish-new.kid span { width: 46px; height: 46px; border-radius: 16px; animation: bob 2.4s ease-in-out infinite; }
@keyframes bob { 50% { transform: translateY(-4px) rotate(-6deg); } }
.wish-add { background: var(--surface-2); border-radius: 18px; padding: 14px; margin-bottom: 14px; display: flex; flex-direction: column; gap: 10px; animation: pop .3s both; }
.wa-h { display: flex; justify-content: space-between; align-items: center; } .wa-h b { font-size: 16px; }
.wa-emo { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 6px; }
.wa-emo button { border: 0; background: var(--surface); border-radius: 14px; font-size: 24px; padding: 6px 0; transition: transform .2s; }
.wa-emo button[aria-pressed="true"] { box-shadow: 0 0 0 2.5px #2F80ED; transform: scale(1.08); }
.wish-add .field { margin: 0; } .wish-add input { width: 100%; }
.wa-2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr); gap: 8px; }
.wa-f { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
.wa-fav { display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid var(--line); background: var(--surface); border-radius: 999px; padding: 7px 12px; font-weight: 700; font-size: 13px; color: var(--muted); }
.wa-fav .ic { width: 16px; height: 16px; } .wa-fav[aria-pressed="true"] { color: #E4568C; border-color: #E4568C; background: color-mix(in srgb, #E4568C 10%, var(--surface)); } .wa-fav[aria-pressed="true"] .ic { fill: currentColor; }
.wish.fresh { animation: wishIn .7s cubic-bezier(.2,1.5,.3,1) both !important; box-shadow: 0 0 0 2px #2F80ED; }
@keyframes wishIn { from { opacity: 0; transform: translateY(-16px) scale(.9); } }
.wish-b { display: flex; gap: 6px; align-items: center; } .wby { color: #2F80ED; font-weight: 700; }
/* ---------- Musik: zoner og individuel styring ---------- */
.mu-zones { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; margin-bottom: 14px; padding: 3px; }
.mu-z { flex: none; display: flex; align-items: center; gap: 10px; padding: 6px 12px 6px 6px; border-radius: 18px; border: 0; background: var(--surface); box-shadow: var(--shadow), inset 0 0 0 1.5px var(--line); color: var(--ink); text-align: left; max-width: 250px; transition: transform .2s, box-shadow .2s; }
.mu-z:active { transform: scale(.96); }
.mu-z .cover { width: 42px; height: 42px; border-radius: 12px; flex: none; }
.mu-z b { display: block; font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .mu-z small { display: block; font-size: 11.5px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; }
.mu-z > span:nth-child(2) { min-width: 0; }
.mu-z.on { box-shadow: 0 8px 22px color-mix(in srgb, var(--violet) 28%, transparent), inset 0 0 0 2.5px var(--violet); }
.mu-z.playing .cover { animation: zpulse 2.2s ease-in-out infinite; }
@keyframes zpulse { 50% { transform: scale(1.06) rotate(-3deg); } }
.mu-z.idle { padding: 6px 14px 6px 6px; } .mu-zi { width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; background: var(--surface-2); } .mu-zi .ic { width: 22px; height: 22px; }
.mu-zp { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; background: var(--surface-2); color: var(--muted); } .mu-zp .ic { width: 12px; height: 12px; }
.mu-tools { display: flex; gap: 6px; flex-wrap: wrap; }
.mu-tool { display: inline-flex; align-items: center; gap: 6px; border: 0; border-radius: 999px; padding: 6px 11px; background: rgba(255,255,255,.16); color: #fff; font-weight: 700; font-size: 12.5px; backdrop-filter: blur(6px); transition: background .2s; }
.mu-tool .ic { width: 15px; height: 15px; } .mu-tool.on { background: #fff; color: #1B1530; } .mu-tool b { font-size: 11px; background: rgba(0,0,0,.18); border-radius: 8px; padding: 0 6px; }
.mu-gv { display: flex; flex-direction: column; gap: 6px; background: rgba(0,0,0,.16); border-radius: 16px; padding: 8px 10px; }
.mu-gv .mu-vol { grid-template-columns: 30px minmax(0, 1fr) 26px minmax(60px, 90px) 24px; gap: 8px; max-width: none; }
.mu-gv .mu-vol.all { grid-template-columns: 30px minmax(0, 1fr) 26px minmax(60px, 90px) 24px; padding-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,.18); }
.mu-gv .mu-vol.all > .ic { justify-self: center; }
.mu-gv .mu-mute { background: rgba(255,255,255,.16); color: #fff; } .mu-gv .mu-vol.muted input { opacity: .35; }
.mu-gv small { font-size: 12px !important; font-weight: 700; opacity: .9 !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mu-x { width: 24px; height: 24px; border-radius: 50%; border: 0; background: rgba(255,255,255,.16); color: #fff; display: grid; place-items: center; } .mu-x .ic { width: 12px; height: 12px; }
.mu-hero.idle .mu-cover.idle { display: grid; place-items: center; background: rgba(255,255,255,.14); backdrop-filter: blur(8px); color: #fff; } .mu-cover.idle .ic { width: 46%; height: 46%; }
.mu-quick { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.mu-q { border: 0; background: rgba(255,255,255,.12); border-radius: 14px; padding: 6px; color: #fff; display: flex; flex-direction: column; gap: 4px; font-weight: 700; font-size: 12px; text-align: left; transition: transform .15s; }
.mu-q:active { transform: scale(.95); } .mu-q .cover { width: 100%; aspect-ratio: 1; height: auto; border-radius: 10px; display: block; }
.mu-join { display: flex; gap: 6px; flex-wrap: wrap; }
.mu-queue { margin-top: 14px; }
.mu-ql { display: flex; flex-direction: column; gap: 4px; max-height: 300px; overflow-y: auto; }
.mu-qi { display: grid; grid-template-columns: 20px 40px minmax(0, 1fr) repeat(3, 34px); gap: 8px; align-items: center; padding: 6px; border-radius: 12px; animation: pop .3s both; }
.mu-qi:hover { background: var(--surface-2); } .mu-qi > .num { font-size: 12px; color: var(--muted); font-weight: 700; text-align: center; }
.mu-qi .cover { width: 40px; height: 40px; border-radius: 9px; } .mu-qi b { display: block; font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .mu-qi small { font-size: 11.5px; color: var(--muted); }
.mu-qi .iconbtn { width: 34px; height: 34px; }
.mu-pre { display: flex; gap: 6px; flex-wrap: wrap; margin: -4px 0 12px; }
.mu-spk { grid-template-columns: 34px minmax(0, 1fr) auto !important; }
.mu-pc .mu-spks { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)) !important; }
.mu-here { display: none; }
.mu-si { border: 0; color: var(--ink); } .mu-sn { border: 0; background: none; padding: 0; text-align: left; color: var(--ink); min-width: 0; }
.mu-sb { display: flex; gap: 4px; align-items: center; }
.mu-sp { width: 34px; height: 34px; border-radius: 50%; border: 0; background: var(--ink); color: var(--bg); display: grid; place-items: center; } .mu-sp .ic { width: 15px; height: 15px; }
.mu-spk.playing .mu-sp { background: var(--violet); color: #fff; }
.mu-here { font-size: 11px; font-weight: 800; color: var(--violet); padding: 0 6px; }
.mu-gear { width: 34px !important; height: 34px !important; } .mu-gear .ic { width: 17px; height: 17px; }
.mu-spk.focus { animation: focusPulse 1.4s ease-out 2; }
@keyframes focusPulse { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--violet) 60%, transparent); } 100% { box-shadow: 0 0 0 14px transparent; } }
.mu-eqs { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
.mu-eqf { display: grid; grid-template-columns: 70px minmax(0, 1fr) 34px; gap: 10px; align-items: center; font-weight: 700; font-size: 14px; } .mu-eqf input { accent-color: var(--violet); } .mu-eqf b { text-align: right; font-size: 13px; }
.mu-pickl { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
.mu-pickl button { display: grid; grid-template-columns: 30px minmax(0, 1fr); gap: 10px; align-items: center; border: 1.5px solid var(--line); background: var(--surface); border-radius: 14px; padding: 10px; text-align: left; color: var(--ink); }
.mu-pickl .ic { width: 24px; height: 24px; } .mu-pickl b { display: block; } .mu-pickl small { font-size: 12px; color: var(--muted); }
@media (max-width: 620px) { .mu-quick { grid-template-columns: repeat(2, minmax(0, 1fr)); } .mu-gv .mu-vol, .mu-gv .mu-vol.all { grid-template-columns: 30px minmax(0, 1fr) 24px 64px 24px; } }

.hm-notes text { font: 800 36px var(--font-body); fill: var(--hc); opacity: 0; transform-box: fill-box; transform-origin: center; animation: noteUp 4.6s ease-out infinite; pointer-events: none; paint-order: stroke; stroke: var(--surface); stroke-width: 3px; }
@keyframes noteUp { 0% { opacity: 0; transform: translate(0, 6px) scale(.6) rotate(-10deg); } 15% { opacity: 1; } 70% { opacity: .85; } 100% { opacity: 0; transform: translate(var(--dx), -62px) scale(1.15) rotate(14deg); } }
.hm-tile { fill: var(--surface); stroke: var(--hc); stroke-width: 2.5; filter: drop-shadow(0 3px 5px rgba(0,0,0,.2)); }
.hm-ap .hm-body { transition: transform .4s cubic-bezier(.3,1.4,.5,1); }
.hm-runring { fill: none; stroke: var(--good); stroke-width: 3; transform-box: fill-box; transform-origin: center; animation: ripple 3s ease-out infinite; pointer-events: none; }
.hm-offdot { fill: var(--bad); stroke: #fff; stroke-width: 2; }
.rb-dock rect { fill: color-mix(in srgb, var(--ink) 75%, var(--surface)); } .rb-dl { fill: #3CCB83; animation: apblink 2.4s steps(2) infinite; }
.rb-route { fill: none; stroke: var(--hc); stroke-width: 2; stroke-dasharray: 3 9; opacity: .28; pointer-events: none; }
.rb-v { fill: #2B2F38; stroke: #fff; stroke-width: 2.5; } .rb-v2 { fill: #4A4E57; } .rb-bump { fill: none; stroke: #9AA3AE; stroke-width: 2; } .rb-led { fill: #3CCB83; }
.rb-m { fill: #E3E6E0; stroke: #3E4A3C; stroke-width: 2.5; } .rb-m2 { fill: #F28C1B; } .rb-w { fill: #2B2F38; }
.rb { filter: drop-shadow(0 3px 4px rgba(0,0,0,.3)); }
.rb-zone { fill: color-mix(in srgb, var(--hc) 10%, transparent); stroke: var(--hc); stroke-width: 2.5; stroke-dasharray: 8 6; vector-effect: non-scaling-stroke; pointer-events: none; }
.hp-apc { margin: 8px 0 4px; display: flex; gap: 6px; flex-wrap: wrap; }
.hz-sync { display: inline-flex; align-items: center; gap: 6px; margin-top: 6px; font-size: 12px; font-weight: 700; color: var(--muted); } .hz-sync .ic { width: 14px; height: 14px; color: var(--good); }
.hz-apic { width: 26px; height: 26px; display: block; } .hz-apic .ap-svg { width: 100%; height: 100%; }
.hz-io { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 4px; }
.hz-ta { width: 100%; font: 12px ui-monospace, monospace; border: 1.5px solid var(--line); border-radius: 12px; padding: 10px; background: var(--surface-2); color: var(--ink); margin-top: 10px; }
/* ---------- Udearealer ---------- */
.hx-tilebg { fill: color-mix(in srgb, #B8B2A7 45%, var(--surface)); } .hx-tileln { fill: none; stroke: color-mix(in srgb, #8C857A 45%, transparent); stroke-width: 1.4; }
.hx-soil { fill: color-mix(in srgb, #7A5634 55%, var(--surface)); } .hx-sprout { fill: #5E9C4A; } .hx-sprout2 { fill: #D9667A; }
.hx-gravbg { fill: color-mix(in srgb, #CFC8BA 60%, var(--surface)); } .hx-grav { fill: color-mix(in srgb, #8E877B 60%, transparent); }
.hx-lawnbg { fill: color-mix(in srgb, #7FA36A 50%, var(--surface-2)); } .hx-lawnst { fill: color-mix(in srgb, #8DB377 50%, var(--surface-2)); }
.hx-area polygon { stroke: color-mix(in srgb, var(--ink) 12%, transparent); stroke-width: 1.5; }
.hx-area.k-lawn polygon { stroke: none; } .hx-drive { fill: color-mix(in srgb, #9A9A98 40%, var(--surface-2)); }
/* ---------- Møbler ---------- */
.ob { outline: none; }
.fu-fab { fill: color-mix(in srgb, #8E9AAF 70%, var(--surface)); stroke: color-mix(in srgb, #5B6478 60%, transparent); stroke-width: 1.2; } .fu-fab2 { fill: color-mix(in srgb, #7A869C 75%, var(--surface)); } .fu-cush { fill: color-mix(in srgb, #A7B2C6 70%, var(--surface)); }
.fu-wood { fill: color-mix(in srgb, #C69C6D 65%, var(--surface)); stroke: color-mix(in srgb, #8A6440 55%, transparent); stroke-width: 1.2; } .fu-wood2 { fill: color-mix(in srgb, #E2D3BE 70%, var(--surface)); stroke: color-mix(in srgb, #A68E70 50%, transparent); stroke-width: 1.2; }
.fu-grain { fill: none; stroke: color-mix(in srgb, #8A6440 35%, transparent); stroke-width: 1.2; }
.fu-sheet { fill: #FBFAF7; } .fu-pillow { fill: #FFFFFF; stroke: #D8D4CC; stroke-width: 1; } .fu-duvet { fill: color-mix(in srgb, #9DB7D5 55%, #fff); } .fu-fold { stroke: rgba(0,0,0,.08); stroke-width: 2; } .fu-bar { stroke: #8A6440; stroke-width: 1.4; }
.fu-seat { fill: color-mix(in srgb, #C69C6D 50%, var(--surface)); stroke: color-mix(in srgb, #8A6440 45%, transparent); stroke-width: 1; }
.fu-dark { fill: #2B2F38; } .fu-ln { stroke: color-mix(in srgb, #5B4632 40%, transparent); stroke-width: 1.2; fill: none; } .fu-knob { fill: #8A8F98; }
.fu-stone { fill: color-mix(in srgb, #D4D2CE 75%, var(--surface)); stroke: color-mix(in srgb, #9C9890 55%, transparent); stroke-width: 1.2; } .fu-stone2 { fill: color-mix(in srgb, #E6E4E0 70%, var(--surface)); } .fu-steel { fill: #B8BEC6; stroke: #8E959E; stroke-width: 1; }
.fu-white { fill: #FDFDFC; stroke: #C9CCD1; stroke-width: 1.3; } .fu-water { fill: color-mix(in srgb, #9FD3EC 70%, #fff); } .fu-tile { fill: color-mix(in srgb, #DCE7EE 80%, var(--surface)); stroke: #A9B8C4; stroke-width: 1.2; }
.fu-rug { fill: color-mix(in srgb, #D9A87E 40%, var(--surface)); } .fu-rug2 { fill: none; stroke: color-mix(in srgb, #A0663C 40%, transparent); stroke-width: 2; stroke-dasharray: 6 4; }
.fu-pot { fill: #B9774A; } .fu-leaf { fill: #4E9F3D; opacity: .92; }
/* ---------- Lys ---------- */
.lt-shade { fill: color-mix(in srgb, var(--ink) 18%, var(--surface)); stroke: color-mix(in srgb, var(--ink) 45%, transparent); stroke-width: 1.4; } .lt-shade2 { fill: none; stroke: color-mix(in srgb, var(--ink) 30%, transparent); stroke-width: 1.2; }
.lt-bulb { fill: color-mix(in srgb, var(--ink) 30%, var(--surface)); transition: fill .6s; } .lt-arm { stroke: color-mix(in srgb, var(--ink) 50%, transparent); stroke-width: 2.5; stroke-linecap: round; }
.lt-b.on .lt-bulb { fill: #FFE7A8; filter: drop-shadow(0 0 4px #FFD98A); } .lt-b.on .lt-shade { fill: #FFF3D6; }
.lt-strip { fill: color-mix(in srgb, var(--ink) 35%, var(--surface)); } .lt-post { fill: #3A3F48; }
.lt-rgbring { fill: none; stroke: #EC4899; stroke-width: 2; stroke-dasharray: 3 3; }
.lt-glow { pointer-events: none; animation: ltOn 1.2s ease-out both; } .lt-sglow { opacity: .45; filter: blur(6px); pointer-events: none; }
.lt-glow.fx, .lt-sglow.fx, .lk-rgb.on .lt-bulb, .lk-strip.on .lt-strip { animation: hueCycle 9s linear infinite; }
@keyframes hueCycle { to { filter: hue-rotate(360deg); } }
@keyframes ltOn { from { opacity: 0; } }
.lt-sglow.fx { animation: hueCycle 9s linear infinite; filter: blur(6px); }
.ob-light:hover .lt-shade, .ob-light:focus-visible .lt-shade { stroke: #F5B301; stroke-width: 3; }
/* ---------- TV og højttalere som ting ---------- */
.tv-body { fill: #1B1E25; } .tv-scr { fill: #3B4252; } .ob-tv.on .tv-scr { fill: #7DD3FC; }
.tv-beam { fill: color-mix(in srgb, #7DD3FC 30%, transparent); animation: flick 3.4s steps(6) infinite; pointer-events: none; }
.spk-body { fill: #2B2F38; stroke: #fff; stroke-width: 1.5; } .spk-cone { fill: #4A4F59; } .spk-dot { fill: #6B7280; }
.ob-speaker.play .spk-body { stroke: #E5484D; stroke-width: 2.5; }
.spk-wave { fill: none; stroke: var(--hc); stroke-width: 2.5; transform-box: fill-box; transform-origin: center; animation: ripple 3.2s ease-out infinite; pointer-events: none; }
.ob-tv, .ob-speaker, .ob-light, .ob-car, .ob-charger, .ob-solar, .ob-battery { cursor: pointer; }
/* ---------- Biler, ladere og ledninger ---------- */
.car-body { stroke: color-mix(in srgb, #000 35%, transparent); stroke-width: 1.5; filter: drop-shadow(0 4px 6px rgba(0,0,0,.25)); } .car-wh { fill: #1F2329; }
.car-glass { fill: #2D3748; opacity: .88; } .car-roof { fill: rgba(0,0,0,.08); } .car-mir { stroke: rgba(0,0,0,.3); stroke-width: 1; } .car-lamp { fill: #FFF7D6; } .car-tail { fill: #E5484D; }
.ob-car.away { opacity: .4; } .ob-car:hover .car-body { stroke: var(--violet); stroke-width: 3; }
.car-soc { pointer-events: none; } .car-soc > rect:first-child { fill: color-mix(in srgb, var(--ink) 85%, transparent); } .car-soc text { fill: #fff; font: 800 15px var(--font-body); }
.car-soc .cs-b { fill: none; stroke: rgba(255,255,255,.7); stroke-width: 1.5; } .car-soc .cs-f { fill: var(--sc); }
.car-soc.chg .cs-f { animation: socPulse 1.6s ease-in-out infinite; } @keyframes socPulse { 50% { opacity: .45; } }
.chg-box { fill: #F4F5F7; stroke: #3A3F48; stroke-width: 2; } .chg-sock { fill: #3A3F48; }
.chg-led { fill: var(--cc); filter: drop-shadow(0 0 5px var(--cc)); }
.ob-charger.st-charging .chg-led { animation: ledBreath 2.4s ease-in-out infinite; } .ob-charger.st-fault .chg-led { animation: apblink 1.2s steps(2) infinite; }
@keyframes ledBreath { 50% { opacity: .35; } }
.cb { pointer-events: none; }
.cb-base { fill: none; stroke: #2B2F38; stroke-width: 7; stroke-linecap: round; }
.cb-st { fill: none; stroke: var(--cc); stroke-width: 3.5; stroke-linecap: round; }
.cb-charging .cb-st { stroke-dasharray: 10 12; animation: cbFlow 1.4s linear infinite; } @keyframes cbFlow { to { stroke-dashoffset: 44; } }
.cb-spark { fill: #EFFFF4; filter: drop-shadow(0 0 6px #22C55E); }
.cb-scheduled .cb-st { stroke-dasharray: 4 7; } .cb-connected .cb-st, .cb-waiting .cb-st { animation: cbPulse 3.2s ease-in-out infinite; } @keyframes cbPulse { 50% { opacity: .35; } }
.cb-fault .cb-st { animation: apblink 1.2s steps(2) infinite; } .cb-none .cb-st { stroke-dasharray: 5 6; opacity: .6; }
.cb-plug { fill: var(--cc); stroke: #fff; stroke-width: 2; }
.cb-badge circle { fill: var(--cc); stroke: #fff; stroke-width: 3; filter: drop-shadow(0 2px 4px rgba(0,0,0,.25)); } .cb-ic { fill: none; stroke: #fff; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
.cb-charging .cb-badge { animation: bump 1.6s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: center; }
.cb-txt { font: 800 14px var(--font-body); fill: var(--ink); paint-order: stroke; stroke: var(--surface); stroke-width: 4px; }
/* ---------- Sol og batteri ---------- */
.sol-frame { fill: #CBD5E1; stroke: #64748B; stroke-width: 1.5; } .sol-cell { fill: #1E3A8A; stroke: #3B5BB5; stroke-width: .8; }
.ob-solar .sol-shine { fill: rgba(255,255,255,.18); animation: solShine 6s ease-in-out infinite; } @keyframes solShine { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }
.bat-box { fill: #F4F5F7; stroke: #3A3F48; stroke-width: 2; } .bat-cell { fill: #D9DDE3; } .bat-cell.on { fill: #22C55E; } .bat-cell.lvl { animation: socPulse 2s ease-in-out infinite; }
/* ---------- Træer ---------- */
.tr-shadow { fill: rgba(0,0,0,.12); } .tr-1 { fill: #3F7F35; } .tr-2 { fill: #57A046; } .tr-3 { fill: #6DB357; } .tr-trunk { fill: #6B4A2B; }
.ob-bush .tr-1 { fill: #4E8F3F; } .ob-bush .tr-2 { fill: #6DAF55; }
.tr-can.sway { transform-box: fill-box; transform-origin: center; animation: sway 7s ease-in-out infinite alternate; } @keyframes sway { from { transform: rotate(-2.5deg) scale(1); } to { transform: rotate(2.5deg) scale(1.03); } }
/* ---------- Popover ---------- */
.hp-cols, .hz-cols { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin: 6px 0; }
.hp-cols button, .hz-cols button { width: 26px; height: 26px; border-radius: 50%; border: 0; background: var(--c); box-shadow: inset 0 0 0 1px rgba(0,0,0,.15); }
.hp-cols button[aria-pressed="true"], .hz-cols button[aria-pressed="true"] { box-shadow: 0 0 0 2.5px var(--surface), 0 0 0 4.5px var(--c); }
.hp-fx { border: 1.5px solid var(--line); background: var(--surface); border-radius: 999px; padding: 4px 10px; font-size: 12px; font-weight: 800; color: var(--ink); } .hp-fx.on { background: conic-gradient(from 0deg, #FF6B6B, #F59E0B, #22C55E, #38BDF8, #6366F1, #EC4899, #FF6B6B); color: #fff; border-color: transparent; }
.hp-soc { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; align-items: center; margin: 2px 0 6px; } .hp-soc span { height: 10px; border-radius: 5px; background: var(--surface-2); overflow: hidden; } .hp-soc i { display: block; height: 100%; background: var(--good); border-radius: 5px; }
.hp-try small { font-size: 11px; font-weight: 800; color: var(--muted); } .hp-try div { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
.hp-try button { border: 1.5px solid color-mix(in srgb, var(--cc) 50%, var(--line)); background: var(--surface); border-radius: 999px; padding: 3px 8px; font-size: 11.5px; font-weight: 700; color: var(--ink); }
.hp-try button[aria-pressed="true"] { background: var(--cc); color: #fff; border-color: var(--cc); }
/* ---------- Husbygger: værktøjer ---------- */
.hz-tools details { border-radius: 14px; } .hz-tools summary { list-style: none; cursor: pointer; font-size: 10.5px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: .5px; padding: 6px 4px; display: flex; justify-content: space-between; align-items: center; }
.hz-tools summary::-webkit-details-marker { display: none; } .hz-tools summary::after { content: "+"; font-size: 14px; } .hz-tools details[open] summary::after { content: "–"; }
.hz-tl { display: flex; flex-direction: column; gap: 4px; }
.hz-mini { width: 30px; height: 30px; display: block; } .hz-apic { width: 28px; height: 28px; }
.hz-sw { width: 26px; height: 20px; border-radius: 6px; display: block; box-shadow: inset 0 0 0 1px rgba(0,0,0,.12); }
.hz-sw.k-lawn { background: repeating-linear-gradient(90deg, #8DB377 0 7px, #7FA36A 7px 14px); } .hz-sw.k-tiles { background: #CFCAC0; background-image: linear-gradient(#9C958A 1px, transparent 1px), linear-gradient(90deg, #9C958A 1px, transparent 1px); background-size: 8px 8px; }
.hz-sw.k-deck { background: repeating-linear-gradient(0deg, #C9A57B 0 4px, #B88F61 4px 5px); } .hz-sw.k-bed { background: radial-gradient(circle at 30% 40%, #5E9C4A 2px, transparent 3px), radial-gradient(circle at 70% 70%, #D9667A 2px, transparent 3px), #8B6A4A; }
.hz-sw.k-drive { background: #9A9A98; } .hz-sw.k-gravel { background: radial-gradient(circle, #8E877B 1px, transparent 1.5px) 0 0 / 5px 5px, #D8D2C6; }
.hz-kinds { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; } .hz-kinds button { display: flex; flex-direction: column; align-items: center; gap: 4px; border: 1.5px solid var(--line); background: var(--surface); border-radius: 12px; padding: 6px; font-size: 11.5px; font-weight: 700; color: var(--ink); }
.hz-kinds button[aria-pressed="true"] { border-color: var(--violet); background: color-mix(in srgb, var(--violet) 8%, var(--surface)); }
.hz-row3 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; } .hz-row3 .hz-f { margin-bottom: 8px; }
.hz-rots { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px; } .hz-rots .btn { padding: 4px 8px; font-size: 12px; }
.hz-objsel { fill: none; stroke: var(--violet); stroke-width: 2.5; stroke-dasharray: 7 5; vector-effect: non-scaling-stroke; pointer-events: none; animation: dash 1s linear infinite; }
.hz-rotln { stroke: var(--violet); stroke-width: 2; vector-effect: non-scaling-stroke; pointer-events: none; }
.hz-h.rot { fill: var(--violet); cursor: grab; } .hz-h.rs { cursor: nwse-resize; }
.hz-port { fill: #22C55E; stroke: #fff; stroke-width: 2.5; vector-effect: non-scaling-stroke; pointer-events: none; }
#hz-svg .ob { cursor: grab; } #hz-svg .ob.sel { filter: drop-shadow(0 0 6px color-mix(in srgb, var(--violet) 60%, transparent)); }
#hz-svg .hx-area polygon { cursor: move; } #hz-svg .hx-area.sel polygon { stroke: var(--violet); stroke-width: 3; stroke-dasharray: 10 6; }
@media (max-width: 860px) {
  .hz-tools { flex-direction: column !important; overflow: visible !important; }
  .hz-tg { flex-direction: column !important; align-items: stretch !important; }
  .hz-tl { flex-direction: row; overflow-x: auto; scrollbar-width: none; padding-bottom: 4px; }
}
.hz-pal-m { display: none; } .hz-pal-m .hz-tool { min-width: 68px; font-size: 10.5px; text-align: center; }
@media (max-width: 860px) {
  .hz-pal-d { display: none !important; } .hz-pal-m { display: block; min-width: 0; }
  .hz-gchips { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; padding-bottom: 6px; }
  .hz-gchips button { flex: none; border: 1.5px solid var(--line); background: var(--surface); border-radius: 999px; padding: 5px 11px; font-size: 12px; font-weight: 700; color: var(--muted); }
  .hz-gchips button[aria-pressed="true"] { background: var(--ink); color: var(--bg); border-color: var(--ink); }
  .hz-tools { display: block !important; }
}
/* ---------- Rummets side ---------- */
.rp-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; flex-wrap: wrap; margin: 4px 0 14px; } .rp-head .h2 { margin: 2px 0 0; }
.rp-side { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.rp-plan { width: 100%; height: auto; display: block; border-radius: 14px; background: var(--surface-2); }
.rp-plan .sec-lbl { font-size: 18px; } .rp-focus { fill: none; stroke: var(--violet); stroke-width: 5; stroke-dasharray: 12 8; animation: dash 1.6s linear infinite; }
.rp-list { display: flex; flex-direction: column; gap: 6px; }
.rp-row { display: grid; grid-template-columns: 38px minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 8px; border-radius: 14px; background: var(--surface-2); }
.rp-row b { display: block; font-size: 13.5px; } .rp-row small { display: block; font-size: 11.5px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rp-ic { width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center; background: color-mix(in srgb, var(--hc) 15%, var(--surface)); color: var(--hc); } .rp-ic .ic { width: 19px; height: 19px; }
.rp-row.st-bad .rp-ic, .rp-row.st-warn .rp-ic { box-shadow: 0 0 0 2px var(--warn); } .rp-row.st-play .rp-ic { animation: bump 1.2s ease-in-out infinite alternate; }
.rp-b { border: 0; border-radius: 999px; background: var(--ink); color: var(--bg); min-width: 36px; height: 36px; padding: 0 12px; display: grid; place-items: center; font-weight: 800; font-size: 12.5px; } .rp-b .ic { width: 16px; height: 16px; }
.rp-tg { width: 46px; height: 28px; border-radius: 14px; border: 0; background: color-mix(in srgb, var(--ink) 20%, transparent); position: relative; } .rp-tg i { position: absolute; top: 4px; left: 4px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform .3s cubic-bezier(.3,1.6,.5,1); }
.rp-tg.on { background: var(--good); } .rp-tg.on i { transform: translateX(18px); }
.hz-quick { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; padding: 12px; border-radius: 16px; background: linear-gradient(135deg, color-mix(in srgb, var(--violet) 12%, var(--surface)), color-mix(in srgb, #22C55E 8%, var(--surface))); margin-top: 14px; }
.hz-quick b { font-size: 14px; } .hz-quick span { font-size: 12.5px; color: var(--muted); }
.hz-up { cursor: pointer; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-delay: 0s !important; transition-duration: .01ms !important; }
}
`;
