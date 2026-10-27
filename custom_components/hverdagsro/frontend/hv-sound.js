/* Hverdagsro – the sounds of the play world, made in the browser (Web Audio): a little theme tune for every kind of
   place, a voice for every kind of character, and sounds for the things. No sound files. Music and sounds can each
   be turned off (remembered on the device). Nothing plays before the child has touched the screen. */

let ac = null, master = null, musicBus = null, sfxBus = null;
let theme = "", variant = 0, step = 0, nextAt = 0, timer = null;
const KEY = "hverdagsro-sound";
const prefs = (() => {
  try {
    return { music: true, sfx: true, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch (err) {
    return { music: true, sfx: true };
  }
})();
export const soundPrefs = () => ({ ...prefs });
export function setSound(kind, on) {
  prefs[kind] = !!on;
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch (err) {
    /* private window */
  }
  if (kind === "music") {
    if (!on) stopMusic();
    else if (theme && wake()) start();
  }
}
/* The audio starts on the first touch (browsers need that). */
export function wake() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = 0.7;
    master.connect(ac.destination);
    musicBus = ac.createGain();
    musicBus.gain.value = 0.16;
    musicBus.connect(master);
    sfxBus = ac.createGain();
    sfxBus.gain.value = 0.45;
    sfxBus.connect(master);
  }
  if (ac.state === "suspended") ac.resume().catch(() => {});
  if (theme && prefs.music && !timer) start();
  return true;
}
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
/* One note: an oscillator with a soft envelope. */
function note(freq, t, dur, { type = "triangle", vol = 0.3, bus = sfxBus, to = null, attack = 0.01 } = {}) {
  if (!ac || !bus) return;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(bus);
  o.start(t);
  o.stop(t + dur + 0.05);
}
/* A short burst of noise (drums, whooshes, engines). */
function noise(t, dur, { vol = 0.2, bus = sfxBus, hp = 800, lp = 8000 } = {}) {
  if (!ac || !bus) return;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur)), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = ac.createBufferSource(), g = ac.createGain(), f1 = ac.createBiquadFilter(), f2 = ac.createBiquadFilter();
  s.buffer = buf;
  f1.type = "highpass";
  f1.frequency.value = hp;
  f2.type = "lowpass";
  f2.frequency.value = lp;
  g.gain.value = vol;
  s.connect(f1);
  f1.connect(f2);
  f2.connect(g);
  g.connect(bus);
  s.start(t);
}

/* ------------------------------------------------------------------ the theme tunes */
/* [bpm, melody (midi notes per eighth, 0 = rest), bass (per quarter), melody wave, beat: "" | "pop" | "march" | "waltz"] */
const THEMES = {
  hjem: [96, [72, 0, 76, 79, 77, 76, 74, 0, 71, 0, 74, 77, 76, 74, 72, 0], [48, 55, 53, 55], "triangle", ""],
  vaerelse: [90, [76, 79, 81, 79, 76, 0, 74, 72, 74, 76, 79, 0, 76, 74, 72, 0], [48, 52, 53, 55], "sine", ""],
  have: [104, [79, 0, 76, 0, 77, 79, 81, 0, 79, 77, 76, 74, 76, 0, 72, 0], [48, 53, 55, 48], "triangle", ""],
  redning: [118, [67, 67, 72, 72, 76, 74, 72, 0, 74, 74, 77, 77, 79, 77, 76, 0], [43, 48, 41, 43], "square", "march"],
  skov: [92, [74, 0, 76, 78, 81, 0, 78, 76, 74, 0, 71, 0, 69, 71, 74, 0], [50, 45, 47, 45], "triangle", ""],
  pop: [124, [76, 76, 0, 79, 0, 76, 74, 0, 72, 72, 0, 74, 0, 76, 79, 0], [45, 45, 48, 43], "square", "pop"],
  park: [132, [72, 76, 79, 76, 72, 76, 79, 84, 81, 77, 74, 77, 81, 79, 76, 0], [48, 53, 55, 48], "triangle", "waltz"],
  slik: [100, [84, 88, 91, 88, 86, 0, 84, 0, 83, 86, 89, 86, 84, 0, 0, 0], [60, 65, 67, 60], "sine", ""],
  tekno: [120, [69, 72, 76, 72, 69, 72, 76, 81, 67, 71, 74, 71, 67, 71, 74, 79], [45, 45, 43, 43], "sawtooth", "pop"],
  nat: [80, [69, 0, 72, 0, 71, 69, 68, 0, 69, 0, 64, 0, 65, 64, 62, 0], [45, 41, 40, 45], "sine", ""],
  hule: [84, [74, 0, 0, 77, 0, 0, 79, 0, 77, 0, 74, 0, 72, 0, 0, 0], [50, 46, 48, 45], "sine", ""],
  trae: [100, [79, 81, 84, 81, 79, 0, 76, 0, 79, 81, 84, 86, 84, 0, 0, 0], [48, 55, 53, 48], "triangle", ""],
  rumstation: [88, [76, 0, 83, 0, 81, 0, 79, 0, 76, 0, 74, 0, 71, 0, 0, 0], [40, 40, 43, 38], "sawtooth", ""],
  scene: [126, [72, 74, 76, 79, 0, 79, 76, 0, 77, 76, 74, 72, 0, 74, 0, 0], [48, 43, 45, 41], "square", "pop"],
  centrum: [112, [72, 0, 74, 76, 0, 79, 76, 74, 72, 0, 69, 72, 74, 0, 0, 0], [45, 50, 43, 48], "triangle", "pop"],
  /* The music player's party songs (our own). */
  fest0: [128, [76, 79, 81, 79, 76, 74, 76, 0, 79, 81, 84, 81, 79, 76, 74, 0], [48, 48, 53, 55], "square", "pop"],
  fest1: [118, [69, 0, 72, 69, 76, 0, 74, 72, 69, 0, 72, 74, 72, 69, 67, 0], [45, 45, 41, 43], "sawtooth", "pop"],
  fest2: [140, [72, 72, 79, 79, 81, 81, 79, 0, 77, 77, 76, 76, 74, 74, 72, 0], [48, 53, 55, 48], "square", "march"],
  fest3: [124, [84, 0, 83, 81, 79, 0, 81, 83, 84, 0, 88, 86, 84, 0, 79, 0], [52, 57, 55, 48], "triangle", "pop"],
  kort: [108, [72, 76, 79, 84, 0, 79, 76, 0, 74, 77, 81, 79, 0, 76, 74, 0], [48, 53, 55, 48], "triangle", ""],
};
/* Which tune should play now. It starts right away if the sound is awake, otherwise on the first touch. */
/* v: a variant, so that every place in a part of town has its own take on the area's tune (another key, another start). */
export function playTheme(id, v = 0) {
  if (!THEMES[id]) id = "hjem";
  if (theme === id && variant === v && timer) return;
  theme = id;
  variant = v;
  if (prefs.music && ac) start();
}
function start() {
  clearInterval(timer);
  step = 0;
  nextAt = ac.currentTime + 0.1;
  timer = setInterval(schedule, 60);
}
/* The music only plays while the game is on the screen: guard() says so (the play view sets it). */
let guard = () => true;
export function setGuard(fn) {
  guard = fn;
}
if (typeof document !== "undefined")
  document.addEventListener("visibilitychange", () => {
    if (!ac) return;
    if (document.hidden) ac.suspend().catch(() => {});
    else ac.resume().catch(() => {});
  });
export function stopMusic() {
  clearInterval(timer);
  timer = null;
}
function schedule() {
  if (!ac || !prefs.music || !THEMES[theme]) return;
  if (!guard()) {
    stopMusic();
    theme = "";
    return;
  }
  const [bpm0, mel, bass, wave, beat] = THEMES[theme], up = [0, 2, -3, 5, -5, 4, -2][variant % 7], bpm = bpm0 + (variant % 3) * 6, eighth = 60 / bpm / 2;
  while (nextAt < ac.currentTime + 0.25) {
    const i = step % mel.length, m = mel[(i + (variant % 4) * 4) % mel.length] && mel[(i + (variant % 4) * 4) % mel.length] + up;
    if (m) note(hz(m), nextAt, eighth * 1.6, { type: wave, vol: wave === "sawtooth" || wave === "square" ? 0.12 : 0.24, bus: musicBus });
    if (i % 2 === 0) {
      const b = bass[(i / 2) % bass.length];
      note(hz(b + up), nextAt, eighth * 1.8, { type: "sine", vol: 0.3, bus: musicBus });
    }
    if (beat === "pop" && i % 4 === 0) noise(nextAt, 0.08, { vol: 0.25, bus: musicBus, hp: 60, lp: 300 });
    if (beat === "pop" && i % 4 === 2) noise(nextAt, 0.05, { vol: 0.12, bus: musicBus, hp: 5000 });
    if (beat === "march" && i % 2 === 0) noise(nextAt, 0.06, { vol: i % 8 === 0 ? 0.22 : 0.1, bus: musicBus, hp: 1500 });
    if (beat === "waltz" && i % 6 === 0) noise(nextAt, 0.07, { vol: 0.18, bus: musicBus, hp: 80, lp: 400 });
    nextAt += eighth;
    step++;
  }
}

/* ------------------------------------------------------------------ sounds of things and characters */
const SFX = {
  tap: (t) => note(880, t, 0.08, { type: "sine", vol: 0.25, to: 1320 }),
  coin: (t) => {
    note(hz(88), t, 0.1, { type: "square", vol: 0.12 });
    note(hz(93), t + 0.08, 0.3, { type: "square", vol: 0.12 });
  },
  level: (t) => [72, 76, 79, 84, 88].forEach((m, i) => note(hz(m), t + i * 0.1, 0.35, { type: "triangle", vol: 0.3 })),
  buy: (t) => [79, 84, 91].forEach((m, i) => note(hz(m), t + i * 0.07, 0.25, { type: "sine", vol: 0.3 })),
  bounce: (t) => note(220, t, 0.35, { type: "sine", vol: 0.35, to: 660 }),
  drive: (t) => {
    note(90, t, 0.9, { type: "sawtooth", vol: 0.12, to: 220 });
    noise(t, 0.7, { vol: 0.08, hp: 200, lp: 1200 });
  },
  music: (t) => [72, 76, 79, 76].forEach((m, i) => note(hz(m), t + i * 0.12, 0.2, { type: "triangle", vol: 0.3 })),
  yum: (t) => {
    note(300, t, 0.08, { type: "square", vol: 0.12, to: 200 });
    note(300, t + 0.15, 0.08, { type: "square", vol: 0.12, to: 200 });
    note(500, t + 0.3, 0.2, { type: "sine", vol: 0.25, to: 700 });
  },
  light: (t) => noise(t, 0.03, { vol: 0.3, hp: 3000 }),
  spin: (t) => noise(t, 0.6, { vol: 0.12, hp: 600, lp: 3000 }),
  wiggle: (t) => note(330, t, 0.25, { type: "sine", vol: 0.25, to: 392 }),
  screen: (t) => note(1200, t, 0.06, { type: "square", vol: 0.08 }),
  whoosh: (t) => noise(t, 0.35, { vol: 0.2, hp: 400, lp: 4000 }),
  pop: (t) => note(600, t, 0.07, { type: "sine", vol: 0.3, to: 300 }),
  chest: (t) => {
    noise(t, 0.12, { vol: 0.2, hp: 300, lp: 2000 });
    [84, 88, 91, 96].forEach((m, i) => note(hz(m), t + 0.15 + i * 0.06, 0.25, { type: "sine", vol: 0.22 }));
  },
  step: (t) => noise(t, 0.04, { vol: 0.12, hp: 200, lp: 1200 }),
  page: (t) => noise(t, 0.18, { vol: 0.16, hp: 2500, lp: 9000 }),
  hug: (t) => [64, 67, 72].forEach((m, i) => note(hz(m + 12), t + i * 0.08, 0.5, { type: "sine", vol: 0.22 })),
  clap: (t) => {
    noise(t, 0.08, { vol: 0.45, hp: 900, lp: 6000 });
    noise(t + 0.03, 0.06, { vol: 0.3, hp: 1500 });
  },
  snore: (t) => note(110, t, 0.8, { type: "sawtooth", vol: 0.05, to: 90 }),
};
export function sfx(name) {
  // Only after the first touch has woken the sound (wake() runs on pointerdown).
  if (!prefs.sfx || !ac || !SFX[name] || !wake()) return;
  SFX[name](ac.currentTime + 0.01);
}
/* A character's voice, by what kind they are. A few babbling sounds; nobody speaks real words. */
const VOICES = {
  dog: (t) => [0, 0.18].forEach((d) => note(420, t + d, 0.12, { type: "square", vol: 0.12, to: 260 })),
  cat: (t) => note(520, t, 0.45, { type: "sine", vol: 0.25, to: 760 }),
  fox: (t) => note(600, t, 0.2, { type: "triangle", vol: 0.2, to: 900 }),
  bear: (t) => note(140, t, 0.5, { type: "sawtooth", vol: 0.1, to: 110 }),
  bunny: (t) => [0, 0.1, 0.2].forEach((d) => note(900, t + d, 0.06, { type: "sine", vol: 0.2 })),
  mouse: (t) => [0, 0.08].forEach((d) => note(1600, t + d, 0.05, { type: "sine", vol: 0.15 })),
  hedgehog: (t) => note(700, t, 0.15, { type: "sine", vol: 0.2, to: 500 }),
  owl: (t) => [0, 0.35].forEach((d) => note(330, t + d, 0.3, { type: "sine", vol: 0.25, to: 300 })),
  hen: (t) => [0, 0.12, 0.24].forEach((d) => note(700, t + d, 0.08, { type: "square", vol: 0.08, to: 500 })),
  robot: (t) => [0, 0.1, 0.2, 0.3].forEach((d, i) => note([880, 660, 990, 770][i], t + d, 0.07, { type: "square", vol: 0.08 })),
  dino: (t) => note(110, t, 0.6, { type: "sawtooth", vol: 0.12, to: 70 }),
  drop: (t) => note(400, t, 0.15, { type: "sine", vol: 0.3, to: 1200 }),
  blob: (t) => note(200, t, 0.3, { type: "sine", vol: 0.3, to: 120 }),
  snail: (t) => note(300, t, 0.6, { type: "sine", vol: 0.15, to: 280 }),
  butterfly: (t) => [0, 0.06, 0.12].forEach((d, i) => note(1200 + i * 200, t + d, 0.08, { type: "sine", vol: 0.15 })),
  flower: (t) => [0, 0.08].forEach((d, i) => note(1000 + i * 300, t + d, 0.1, { type: "sine", vol: 0.18 })),
  sweet: (t) => [0, 0.07, 0.14].forEach((d, i) => note(hz(84 + i * 4), t + d, 0.12, { type: "sine", vol: 0.2 })),
  person: (t, pitch = 1) => [0, 0.11, 0.22, 0.36].forEach((d) => note((260 + Math.random() * 160) * pitch, t + d, 0.09, { type: "triangle", vol: 0.22, to: (300 + Math.random() * 200) * pitch })),
};
const VOICE_OF = { bun: "sweet", cupcake: "sweet", donut: "sweet", berry: "sweet", mochi: "sweet", macaron: "sweet", elephant: "bear" };
export function voice(kind, pitch = 1) {
  if (!prefs.sfx || !ac || !wake()) return;
  const v = VOICES[VOICE_OF[kind] || kind] || VOICES.person;
  v(ac.currentTime + 0.01, pitch);
}
/* For the tests: what is playing. */
export const soundState = () => ({ theme, variant, playing: !!timer, audio: ac ? ac.state : "" });
