/* A fake Home Assistant for trying the panel in a browser without Home Assistant.
   It implements the hverdagsro/* websocket commands in memory, the way the integration does,
   and a small, made-up home: the Hansen family (two parents, two children). */

const now = new Date();
const iso = (d) => d.toISOString();
const day = (n, h = 0, m = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() + n);
  d.setHours(h, m, 0, 0);
  return d;
};
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function st(entity_id, state, attributes = {}) {
  return { entity_id, state, attributes, last_changed: iso(day(0, 7, 12)), last_updated: iso(day(0, 7, 12)), context: { id: "x" } };
}

export function demoStates() {
  const S = {};
  const add = (s) => (S[s.entity_id] = s);
  add(st("sun.sun", "above_horizon", { next_rising: iso(day(1, 7, 31)), next_setting: iso(day(0, 16, 42)), elevation: 14 }));
  add(st("person.anna", "home", { friendly_name: "Anna", user_id: "u-anna", device_trackers: ["device_tracker.anna_telefon"] }));
  add(st("device_tracker.anna_telefon", "home", { friendly_name: "Annas telefon", source_type: "gps" }));
  add(st("sensor.anna_telefon_battery_level", "45", { friendly_name: "Annas telefon batteri", device_class: "battery", unit_of_measurement: "%" }));
  add(st("person.mads", "not_home", { friendly_name: "Mads", user_id: "u-mads" }));
  add(st("person.ida", "home", { friendly_name: "Ida", user_id: "u-ida" }));
  add(st("person.oskar", "home", { friendly_name: "Oskar" }));
  add(st("weather.forecast_home", "rainy", { friendly_name: "Hjemme", temperature: 9.4, humidity: 88, wind_speed: 6.1, temperature_unit: "°C" }));
  for (const [id, name, on, extra] of [
    ["stue", "Stue", true, { brightness: 180, color_mode: "color_temp", color_temp_kelvin: 2700, supported_color_modes: ["color_temp"] }],
    ["kokken", "Køkken", true, { brightness: 230, color_mode: "color_temp", color_temp_kelvin: 3200, supported_color_modes: ["color_temp"] }],
    ["ida", "Idas værelse", true, { brightness: 120, color_mode: "rgbww", rgb_color: [255, 120, 200], supported_color_modes: ["rgbww"] }],
    ["oskar", "Oskars værelse", false, { supported_color_modes: ["brightness"] }],
    ["sovevaerelse", "Soveværelse", false, { supported_color_modes: ["color_temp"] }],
    ["bad", "Badeværelse", false, { supported_color_modes: ["brightness"] }],
    ["have", "Haven", false, { supported_color_modes: ["onoff"] }],
  ])
    add(st(`light.${id}`, on ? "on" : "off", { friendly_name: name, ...extra }));
  add(st("media_player.stue", "playing", { friendly_name: "Stue", volume_level: 0.32, is_volume_muted: false, media_title: "Solskin", media_artist: "Familiebåndet", media_album_name: "Hverdag", media_duration: 214, media_position: 63, media_position_updated_at: iso(now), supported_features: 4127295, group_members: ["media_player.stue", "media_player.kokken"], source_list: ["Spotify", "Radio"], source: "Spotify" }));
  add(st("media_player.kokken", "playing", { friendly_name: "Køkken", volume_level: 0.25, is_volume_muted: false, media_title: "Solskin", media_artist: "Familiebåndet", supported_features: 4127295, group_members: ["media_player.stue", "media_player.kokken"] }));
  add(st("media_player.ida", "paused", { friendly_name: "Idas højttaler", volume_level: 0.18, media_title: "Godnathistorie", media_artist: "Radio", supported_features: 4127295 }));
  add(st("media_player.tv_stue", "playing", { friendly_name: "TV i stuen", supported_features: 21437, media_content_type: "tvshow", media_title: "Bamses billedbog", media_series_title: "DR Ramasjang" }));
  add(st("alarm_control_panel.huset", "disarmed", { friendly_name: "Huset", code_arm_required: false, supported_features: 63, code_format: null }));
  add(st("binary_sensor.hoveddor", "off", { friendly_name: "Hoveddør", device_class: "door" }));
  add(st("binary_sensor.terrassedor", "on", { friendly_name: "Terrassedør", device_class: "door" }));
  add(st("binary_sensor.vindue_ida", "off", { friendly_name: "Vindue Ida", device_class: "window" }));
  add(st("binary_sensor.bevaegelse_stue", "on", { friendly_name: "Bevægelse stue", device_class: "motion" }));
  add(st("binary_sensor.rog_gang", "off", { friendly_name: "Røgalarm gang", device_class: "smoke" }));
  add(st("lock.hoveddor", "locked", { friendly_name: "Lås hoveddør" }));
  add(st("cover.garageport", "closed", { friendly_name: "Garageport", device_class: "garage" }));
  add(st("camera.indkorsel", "idle", { friendly_name: "Indkørsel", entity_picture: "/api/camera_proxy/camera.indkorsel?token=x" }));
  add(st("todo.indkob", "3", { friendly_name: "Indkøb", supported_features: 15 }));
  add(st("todo.huskeliste", "1", { friendly_name: "Huskeliste", supported_features: 15 }));
  add(st("calendar.familie", "off", { friendly_name: "Familie", message: "Svømning" }));
  add(st("calendar.ida", "off", { friendly_name: "Ida" }));
  add(st("calendar.ida_skema", "off", { friendly_name: "Idas skema" }));
  add(st("calendar.madplan", "off", { friendly_name: "Madplan", message: "Lasagne" }));
  add(st("calendar.affald", "off", { friendly_name: "Affald" }));
  add(st("sensor.restaffald", ymd(day(1)), { friendly_name: "Restaffald", device_class: "date" }));
  add(st("sensor.papir", ymd(day(6)), { friendly_name: "Papir og pap", device_class: "date" }));
  const prices = Array.from({ length: 24 }, (_, h) => ({ hour: iso(day(0, h)), price: +(1.2 + Math.sin((h - 6) / 3.5) * 0.9 + (h >= 17 && h <= 20 ? 1.4 : 0)).toFixed(2) }));
  const tomorrow = Array.from({ length: 24 }, (_, h) => ({ hour: iso(day(1, h)), price: +(0.9 + Math.sin((h - 6) / 3.5) * 0.7 + (h >= 17 && h <= 20 ? 1.2 : 0)).toFixed(2) }));
  add(st("sensor.tesla_model_3_status", "unplugged", { friendly_name: "Tesla Model 3 Status", soc: 68, target_soc: 100, connected: false, options: ["unplugged", "planned", "charging", "complete"] }));
  add(st("sensor.tesla_model_3_summary", "04.00-06.28 · 14,07 kr.", { friendly_name: "Tesla Model 3 Summary" }));
  add(st("sensor.mercedes_eqb_status", "charging", { friendly_name: "Mercedes EQB Status", soc: 97, target_soc: 100, connected: true }));
  add(st("sensor.mercedes_eqb_summary", "05.00-05.23 · 2,22 kr.", { friendly_name: "Mercedes EQB Summary" }));
  add(st("sensor.kaffemaskine_operation_state", "ready", { friendly_name: "Kaffemaskine Operation state", device_class: "enum" }));
  add(st("switch.torretumbler_power", "off", { friendly_name: "Tørretumbler Power" }));
  add(st("sensor.elpris", "2.31", { friendly_name: "Elpris", unit_of_measurement: "kr/kWh", raw_today: prices, raw_tomorrow: tomorrow }));
  add(st("sensor.vaskemaskine_status", "running", { friendly_name: "Vaskemaskine" }));
  add(st("sensor.vaskemaskine_tid_tilbage", "38", { friendly_name: "Vaskemaskine tid tilbage", unit_of_measurement: "min" }));
  add(st("sensor.opvasker_status", "off", { friendly_name: "Opvasker" }));
  add(st("vacuum.robotstovsuger", "cleaning", { friendly_name: "Robotstøvsuger", battery_level: 64 }));
  add(st("lawn_mower.plaeneklipper", "docked", { friendly_name: "Plæneklipper" }));
  add(st("sensor.tesla_battery", "68", { friendly_name: "Tesla batteri", unit_of_measurement: "%", device_class: "battery" }));
  add(st("sensor.lader_status", "charging", { friendly_name: "Lader status" }));
  add(st("sensor.stue_temperatur", "21.4", { friendly_name: "Stue temperatur", unit_of_measurement: "°C", device_class: "temperature" }));
  add(st("script.godnat", "off", { friendly_name: "Godnat" }));
  add(st("scene.film", "2026-01-01T00:00:00", { friendly_name: "Filmaften" }));
  return S;
}

export function demoRegistry(states) {
  const areas = {
    stue: { area_id: "stue", name: "Stue", floor_id: null },
    kokken: { area_id: "kokken", name: "Køkken", floor_id: null },
    ida: { area_id: "ida", name: "Idas værelse", floor_id: null },
    oskar: { area_id: "oskar", name: "Oskars værelse", floor_id: null },
    sovevaerelse: { area_id: "sovevaerelse", name: "Soveværelse", floor_id: null },
    bad: { area_id: "bad", name: "Badeværelse", floor_id: null },
    bryggers: { area_id: "bryggers", name: "Bryggers", floor_id: null },
    kontor: { area_id: "kontor", name: "Kontor", floor_id: null },
    have: { area_id: "have", name: "Have", floor_id: null },
  };
  const areaOf = { "light.stue": "stue", "light.kokken": "kokken", "light.ida": "ida", "light.oskar": "oskar", "light.sovevaerelse": "sovevaerelse", "light.bad": "bad", "light.have": "have", "media_player.stue": "stue", "media_player.kokken": "kokken", "media_player.ida": "ida", "media_player.tv_stue": "stue", "binary_sensor.vindue_ida": "ida", "binary_sensor.terrassedor": "stue", "binary_sensor.bevaegelse_stue": "stue", "sensor.vaskemaskine_status": "bryggers", "sensor.stue_temperatur": "stue" };
  const entities = {};
  for (const id of Object.keys(states)) entities[id] = { entity_id: id, area_id: areaOf[id] || null, device_id: null, platform: id.split(".")[0] === "media_player" ? "sonos" : "demo" };
  const devices = {
    dev_tesla: { id: "dev_tesla", name: "Tesla Model 3" },
    dev_eqb: { id: "dev_eqb", name: "Mercedes EQB" },
    dev_anna: { id: "dev_anna", name: "Annas iPhone" },
    dev_kaffe: { id: "dev_kaffe", name: "Kaffemaskine" },
    dev_tumbler: { id: "dev_tumbler", name: "Tørretumbler" },
  };
  const put = (id, device_id, platform) => entities[id] && Object.assign(entities[id], { device_id, platform });
  put("sensor.tesla_model_3_status", "dev_tesla", "ev_planner");
  put("sensor.tesla_model_3_summary", "dev_tesla", "ev_planner");
  put("sensor.mercedes_eqb_status", "dev_eqb", "ev_planner");
  put("sensor.mercedes_eqb_summary", "dev_eqb", "ev_planner");
  put("device_tracker.anna_telefon", "dev_anna", "mobile_app");
  put("sensor.anna_telefon_battery_level", "dev_anna", "mobile_app");
  put("sensor.kaffemaskine_operation_state", "dev_kaffe", "home_connect");
  put("switch.torretumbler_power", "dev_tumbler", "home_connect");
  return { areas, entities, devices };
}

export function demoData(setupDone = true) {
  const family = [
    { id: "anna", name: "Anna", role: "parent", person: "person.anna", color: "#EE5E52", birthday: "1988-03-14", institution: "none", skin: "standard", mode: "auto", calendar: "calendar.familie", device_tracker: null },
    { id: "mads", name: "Mads", role: "parent", person: "person.mads", color: "#3B6BF5", birthday: "1986-11-02", institution: "none", skin: "standard", mode: "auto", calendar: null, device_tracker: null },
    { id: "ida", name: "Ida", role: "child", person: "person.ida", color: "#8B5CF6", birthday: "2017-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(Math.min(28, now.getDate() + 3)).padStart(2, "0"), institution: "skole", skin: "rosa", mode: "auto", calendar: "calendar.ida", skema: "calendar.ida_skema", features: { board: true }, pet: { name: "Bølle", kind: "hund" }, device_tracker: null },
    { id: "oskar", name: "Oskar", role: "child", person: "person.oskar", color: "#1FA36A", birthday: "2021-06-20", institution: "bornehave", skin: "skov", mode: "auto", calendar: null, device_tracker: null },
  ];
  const all = [0, 1, 2, 3, 4, 5, 6];
  const missions = [
    { id: "tandboerst", title: "Børst tænder", member: "all", points: 5, days: all, time: "07:15", emoji: "🪥", part: "morning" },
    { id: "seng", title: "Red seng", member: "ida", points: 5, days: [0, 1, 2, 3, 4], time: null, emoji: "🛏️", part: "morning" },
    { id: "taske", title: "Pak skoletaske", member: "ida", points: 10, days: [0, 1, 2, 3, 4], time: "19:00", emoji: "🎒", part: "evening" },
    { id: "opvask", title: "Tøm opvaskeren", member: "ida", points: 15, days: [1, 3, 5], time: null, emoji: "🍽️", part: "afternoon" },
    { id: "legetoj", title: "Ryd legetøj op", member: "oskar", points: 10, days: all, time: "18:30", emoji: "🧸", part: "evening" },
    { id: "pyjamas", title: "Tag nattøj på", member: "oskar", points: 5, days: all, time: "19:00", emoji: "🌙", part: "evening" },
  ];
  const rewards = [
    { id: "film", title: "Vælg aftenens film", member: "all", cost: 40, emoji: "🎬" },
    { id: "is", title: "Is efter aftensmad", member: "all", cost: 25, emoji: "🍦" },
    { id: "lego", title: "Nyt LEGO-sæt", member: "ida", cost: 300, emoji: "🧱" },
    { id: "skaerm", title: "30 min. ekstra skærmtid", member: "all", cost: 60, emoji: "📱" },
  ];
  const t = ymd(now);
  return {
    setup_done: setupDone,
    family: setupDone ? family : [],
    modules: { missions: true, points: true, shop: true, lists: true, calendar: true, meals: true, music: true, appliances: true, security: true, house: true, decor: true, energy: true, waste: true },
    settings: {
      weather: "weather.forecast_home",
      calendars: ["calendar.familie", "calendar.ida"],
      todo: ["todo.indkob", "todo.huskeliste"],
      meals_calendar: "calendar.madplan",
      alarm: "alarm_control_panel.huset",
      media: ["media_player.stue", "media_player.kokken", "media_player.ida", "media_player.tv_stue"],
      cameras: ["camera.indkorsel"],
      quick: ["script.godnat", "scene.film"],
      price: "sensor.elpris",
      waste: [{ entity: "sensor.restaffald", name: "Restaffald", color: "#2F7D4F" }, { entity: "sensor.papir", name: "Papir og pap", color: "#2F6FED" }],
      decor: {},
      decor_days: {},
      anniversaries: { together: "2009-05-16", wedding: "2014-08-09" },
      mission_reset: "00:00",
      language: "auto",
      home_name: "Hjemme hos Hansen",
    },
    missions: setupDone ? missions : [],
    rewards: setupDone ? rewards : [],
    house: setupDone ? demoHouse() : { name: "", rooms: [], walls: [], areas: [], items: [] },
    appliances: setupDone
      ? [
          { id: "vask", entity: "sensor.vaskemaskine_status", name: "Vaskemaskine", kind: "washer", controls: ["sensor.vaskemaskine_tid_tilbage"] },
          { id: "opvask", entity: "sensor.opvasker_status", name: "Opvasker", kind: "dish", controls: [] },
          { id: "robot", entity: "vacuum.robotstovsuger", name: "Robotstøvsuger", kind: "vacuum", controls: [] },
          { id: "klipper", entity: "lawn_mower.plaeneklipper", name: "Plæneklipper", kind: "mower", controls: [] },
        ]
      : [],
    points: { ida: 135, oskar: 48 },
    game: { ida: { coins: 140, xp: 520, owned: ["fyrtaarn", "brandbil", "p:poter", "place:by-hospital", "place:by-villa", "place:by-uni", "place:by-indkob", "place:by-familiehus"], daily: "" } },
    fun: {
      day: { date: t, kind: "wave", need: 5, count: 2, keys: [], who: ["oskar"], paid: false },
      tasks: [
        { id: "t1", title: "Find noget rødt i huset", emoji: "🔴", for: [], coins: 5, real: true, by: "anna", at: iso(day(0, 15)), done: {} },
        { id: "t2", title: "Lav en dans til aftensmaden", emoji: "💃", for: ["ida"], coins: 10, real: true, by: "anna", at: iso(day(0, 16)), done: { ida: "wait" } },
      ],
      hunt: { id: "h1", by: "anna", who: ["anna", "ida", "oskar"], stars: [{ id: "s0", space: "room:ida", x: 300, y: 470 }, { id: "s1", space: "have", x: 600, y: 520 }, { id: "s2", space: "room:oskar", x: 500, y: 500 }], found: { s2: "oskar" }, at: iso(day(0, 16)), done: false },
      hide: { id: "x1", by: "oskar", space: "room:ida", x: 820, y: 560, thing: "teddy", at: iso(day(0, 16)), found_by: null },
      party: null,
      build: { i: 0, bricks: 12, who: { ida: 7, oskar: 5 }, built: [] },
      helps: [{ id: "h1", by: "oskar", for: "ida", task: "teeth", title: "Børst tænder", at: iso(day(0, 17)), ok: false }],
      votes: {},
      played: {},
    },
    routines: { helpers: [], pickups: {}, cards: [], boards: { ida: { morgen: ["op", "tis", "taend", "toj", "morgenmad", "taske"], eftermiddag: ["haand", "vand", "taske"], aften: ["taend", "tis", "ansigt"] } } },
    board_done: { ida: ["morgen:0", "morgen:1", "morgen:2"] },
    requests: [{ id: "r1", member: "ida", reward: "film", at: iso(day(0, 8, 2)), status: "pending" }],
    ledger: [{ at: iso(day(0, 7, 20)), member: "ida", delta: 5, reason: "Børst tænder", by: null }],
    done_today: { "tandboerst:ida": { at: iso(day(0, 7, 20)), by: null } },
    done_week: { [t]: { "tandboerst:ida": { at: iso(day(0, 7, 20)), by: null } } },
    me: null,
    can_manage: false,
    is_admin: false,
    today: t,
  };
}

/* A simple bungalow: 1 m = 60 units. Rooms are polygons; walls are segments; items sit on walls or in rooms. */
export function demoHouse() {
  const R = (id, name, rtype, pts, extra = {}) => ({ id, name, rtype, area: extra.area ?? id, light: extra.light || "", pts, ...extra });
  const W = (a, b, k = "int") => ({ id: `w${a.join("_")}_${b.join("_")}`, a, b, k });
  const I = (type, id, name, x, y, ex = {}) => ({ type, id, name, x, y, ent: "", ...ex });
  return {
    name: "Hjemme hos Hansen",
    rooms: [
      R("kokken", "Køkken", "kitchen", [[100, 100], [460, 100], [460, 400], [100, 400]], { light: "light.kokken" }),
      R("stue", "Stue", "living", [[460, 100], [900, 100], [900, 400], [460, 400]], { light: "light.stue" }),
      R("ida", "Idas værelse", "kid", [[100, 400], [340, 400], [340, 640], [100, 640]], { light: "light.ida", kid: "ida", age: "bigchild", style: "pige" }),
      R("oskar", "Oskars værelse", "kid", [[340, 400], [580, 400], [580, 640], [340, 640]], { light: "light.oskar", kid: "oskar", age: "child", style: "dreng" }),
      R("bad", "Badeværelse", "bath", [[580, 400], [720, 400], [720, 640], [580, 640]], { light: "light.bad" }),
      R("sovevaerelse", "Soveværelse", "bed", [[720, 400], [900, 400], [900, 640], [720, 640]], { light: "light.sovevaerelse" }),
    ],
    walls: [
      W([100, 100], [900, 100], "ext"), W([900, 100], [900, 640], "ext"), W([900, 640], [100, 640], "ext"), W([100, 640], [100, 100], "ext"),
      W([460, 100], [460, 400]), W([100, 400], [900, 400]), W([340, 400], [340, 640]), W([580, 400], [580, 640]), W([720, 400], [720, 640]),
    ],
    areas: [
      { id: "have", kind: "lawn", name: "Haven", pts: [[100, 700], [900, 700], [900, 960], [100, 960]] },
      { id: "terr", kind: "deck", name: "Terrasse", pts: [[560, 650], [900, 650], [900, 700], [560, 700]] },
      { id: "indk", kind: "drive", name: "Indkørsel", pts: [[100, -60], [400, -60], [400, 90], [100, 90]] },
    ],
    items: [
      I("door", "hoveddor", "Hoveddør", 300, 100, { ent: "binary_sensor.hoveddor", lock: "lock.hoveddor", dir: "h", w: 54, side: 1, hinge: "l" }),
      I("door", "terrasse", "Terrassedør", 700, 400, { ent: "binary_sensor.terrassedor", dir: "h", w: 70, side: -1, hinge: "l" }),
      I("window", "vindue_ida", "Vindue Ida", 100, 520, { ent: "binary_sensor.vindue_ida", dir: "v", w: 90, side: -1 }),
      I("motion", "bev_stue", "Bevægelse stue", 860, 140, { ent: "binary_sensor.bevaegelse_stue" }),
      I("smoke", "rog", "Røgalarm", 520, 380, { ent: "binary_sensor.rog_gang" }),
      I("camera", "cam", "Indkørsel", 120, 80, { ent: "camera.indkorsel", a: 270, s: 50, r: 200 }),
      I("speaker", "spk_stue", "Stue", 860, 360, { ent: "media_player.stue" }),
      I("speaker", "spk_kok", "Køkken", 140, 360, { ent: "media_player.kokken" }),
      I("tv", "tv", "TV", 680, 120, { ent: "media_player.tv_stue" }),
      I("vacuum", "robot", "Robotstøvsuger", 700, 300, { ent: "vacuum.robotstovsuger", appl: "robot" }),
      I("mower", "klipper", "Plæneklipper", 200, 900, { ent: "lawn_mower.plaeneklipper", appl: "klipper" }),
      I("washer", "vask", "Vaskemaskine", 130, 130, { ent: "sensor.vaskemaskine_status", appl: "vask" }),
      // Furniture put in with Husbyggeren (it comes into the game's rooms).
      I("furn", "f_sofa", "Sofa", 640, 360, { fk: "sofa", w: 230, h: 95, rot: 180 }),
      I("furn", "f_coffee", "Sofabord", 640, 270, { fk: "coffee", w: 120, h: 60, rot: 0 }),
      I("furn", "f_arm", "Lænestol", 860, 260, { fk: "arm", w: 85, h: 85, rot: 0 }),
      I("furn", "f_plant", "Plante", 880, 130, { fk: "plant", w: 50, h: 50, rot: 0 }),
      I("furn", "f_piano", "Klaver", 500, 130, { fk: "piano", w: 150, h: 60, rot: 0 }),
      I("furn", "f_counter", "Køkkenbord", 260, 120, { fk: "counter", w: 300, h: 62, rot: 0 }),
      I("furn", "f_hob", "Kogeplade", 380, 120, { fk: "hobc", w: 60, h: 60, rot: 0 }),
      I("furn", "f_fridge", "Køleskab", 430, 130, { fk: "fridgec", w: 60, h: 65, rot: 0 }),
      I("furn", "f_table", "Spisebord", 280, 320, { fk: "table", w: 200, h: 95, rot: 0 }),
      I("furn", "f_chair1", "Stol", 200, 320, { fk: "chair", w: 48, h: 50, rot: 0 }),
      I("furn", "f_chair2", "Stol", 360, 320, { fk: "chair", w: 48, h: 50, rot: 0 }),
    ],
  };
}

const USERS = {
  anna: { id: "u-anna", name: "Anna", is_admin: true, is_owner: true },
  mads: { id: "u-mads", name: "Mads", is_admin: false },
  ida: { id: "u-ida", name: "Ida", is_admin: false },
  tablet: { id: "u-tablet", name: "Køkkenskærm", is_admin: false },
  admin: { id: "u-admin", name: "Administrator", is_admin: true },
};

export function createMockHass({ user = "anna", setup = true, lang = "da", dark = false, seed = null } = {}) {
  let states = seed?.states || demoStates();
  const reg = seed?.registry || demoRegistry(states);
  const store = seed?.store || demoData(setup);
  if (seed && !setup) Object.assign(store, { setup_done: false, family: [], missions: [], rewards: [] });
  for (const [k, v] of Object.entries({ quick: [], routines: { helpers: [], pickups: {}, boards: {}, cards: [] }, pins: {}, board_done: {}, game: {}, fun: { tasks: [], hunt: null, hide: null, party: null, day: null }, osky: { accounts: {}, lists: [] } })) if (!(k in store)) store[k] = v;
  const calls = [];
  const listeners = new Set();
  const playListeners = new Set();
  const users = seed?.users || USERS;
  const u = users[user] || Object.values(users)[0];
  const todoItems = seed?.todoItems || {
    "todo.indkob": [
      { uid: "1", summary: "Mælk", status: "needs_action" },
      { uid: "2", summary: "Rugbrød", status: "needs_action" },
      { uid: "3", summary: "Rosiner", status: "needs_action", description: "250 GR. / REMA 1000 ØKOLOGISKE · 13,95 kr." },
      { uid: "4", summary: "Kaffe", status: "completed" },
    ],
    "todo.huskeliste": [{ uid: "5", summary: "Madpakke fredag", status: "needs_action", due: ymd(day(4)) }],
  };

  const memberForUser = () => store.family.find((m) => m.person && states[m.person]?.attributes?.user_id === u.id) || null;
  const canManage = () => {
    const m = memberForUser();
    return m ? m.role === "parent" : !!u.is_admin;
  };
  const panelState = () => {
    const me = memberForUser();
    return JSON.parse(JSON.stringify({ ...store, me: me ? me.id : null, can_manage: canManage(), is_admin: !!u.is_admin }));
  };
  const push = () => listeners.forEach((cb) => cb(panelState()));
  const check = (memberId) => {
    if (canManage()) return;
    const me = memberForUser();
    const target = store.family.find((m) => m.id === memberId);
    if (target && ((!me && target.role === "child") || (me && me.id === target.id))) return;
    throw { code: "not_allowed", message: "Ikke tilladt" };
  };

  const ws = async (msg) => {
    calls.push(msg);
    const t = msg.type;
    if (t === "hverdagsro/state") return panelState();
    if (t === "hverdagsro/save") {
      if (!canManage()) throw { code: "not_allowed", message: "Ikke tilladt" };
      store[msg.section] = msg.section === "modules" ? { ...store.modules, ...msg.value } : msg.value;
      setTimeout(push, 10);
      return { value: store[msg.section] };
    }
    if (t === "hverdagsro/setup_done") {
      store.setup_done = true;
      setTimeout(push, 10);
      return null;
    }
    if (t === "hverdagsro/mission") {
      check(msg.member);
      const key = `${msg.mission}:${msg.member}`;
      const m = store.missions.find((x) => x.id === msg.mission);
      const had = key in store.done_today;
      if (msg.done !== had) {
        if (msg.done) store.done_today[key] = { at: iso(new Date()), by: memberForUser()?.id || null };
        else delete store.done_today[key];
        store.done_week[store.today] = store.done_today;
        store.points[msg.member] = Math.max(0, (store.points[msg.member] || 0) + (msg.done ? m.points : -m.points));
      }
      setTimeout(push, 10);
      return { done: msg.done, points: store.points[msg.member] || 0 };
    }
    if (t === "hverdagsro/points") {
      if (!canManage()) throw { code: "not_allowed", message: "Ikke tilladt" };
      store.points[msg.member] = Math.max(0, (store.points[msg.member] || 0) + msg.delta);
      setTimeout(push, 10);
      return { points: store.points[msg.member] };
    }
    if (t === "hverdagsro/reward/request") {
      check(msg.member);
      const r = { id: Math.random().toString(36).slice(2, 8), member: msg.member, reward: msg.reward, at: iso(new Date()), status: "pending" };
      store.requests.push(r);
      if (canManage()) {
        r.status = "approved";
        store.points[msg.member] -= store.rewards.find((x) => x.id === msg.reward).cost;
      }
      setTimeout(push, 10);
      return r;
    }
    if (t === "hverdagsro/reward/decide") {
      const r = store.requests.find((x) => x.id === msg.request);
      r.status = msg.approve ? "approved" : "declined";
      if (msg.approve) store.points[r.member] -= store.rewards.find((x) => x.id === r.reward).cost;
      setTimeout(push, 10);
      return null;
    }
    if (t === "hverdagsro/theme") {
      check(msg.member);
      const m = store.family.find((x) => x.id === msg.member);
      Object.assign(m, { skin: msg.skin, mode: msg.mode });
      setTimeout(push, 10);
      return null;
    }
    if (t === "hverdagsro/prefs") {
      check(msg.member);
      if ("msg_off" in msg.prefs && !canManage()) throw { code: "not_allowed", message: "Ikke tilladt" };
      const m = store.family.find((x) => x.id === msg.member);
      for (const k of ["quick_order", "quick_hide", "msg_off", "photo", "skin", "mode", "goal", "playroom", "room_prefs", "nav"]) if (k in msg.prefs) m[k] = msg.prefs[k];
      setTimeout(push, 10);
      return null;
    }
    if (t === "hverdagsro/pin") return { ok: !store.family.find((x) => x.id === msg.member)?.has_pin || msg.pin === "1234" };
    if (t === "hverdagsro/play") {
      check(msg.member);
      const player = msg.space ? { member: msg.member, space: msg.space, x: msg.x, y: msg.y, me: msg.me || {} } : { member: msg.member, space: "" };
      setTimeout(() => playListeners.forEach((cb) => cb({ player })), 10);
      return null;
    }
    if (t === "hverdagsro/fun") {
      const f = store.fun, a = msg.action;
      if (!["task_add", "task_approve", "task_remove", "hunt_stop", "hide_stop"].includes(a)) check(msg.member);
      if (["task_add", "task_approve", "task_remove"].includes(a) && !canManage()) {
        check(msg.approver);
        const task = f.tasks.find((x) => x.id === msg.task);
        if (a !== "task_add" && (!task?.kid || task.by !== msg.approver)) throw { code: "not_allowed", message: "Kun en voksen kan det." };
      }
      const coin = (id, n) => {
        const g = (store.game[id] ||= { coins: 0, xp: 0, owned: [] });
        g.coins += n;
        g.xp += n;
      };
      if (a === "event" && f.day.kind === msg.kind && !f.day.paid) {
        f.day.count = Math.min(f.day.need, f.day.count + 1);
        if (!f.day.who.includes(msg.member)) f.day.who.push(msg.member);
        if (f.day.count >= f.day.need) {
          f.day.paid = true;
          f.day.who.forEach((id) => coin(id, 8));
          f.party = { id: "p" + Date.now(), at: iso(new Date()), reason: "day", who: f.day.who };
        }
      } else if (a === "task_add") f.tasks.push({ id: "t" + Date.now(), title: msg.title, emoji: msg.emoji || "⭐", for: msg.for || [], coins: msg.coins ?? 5, real: msg.real !== false, by: canManage() ? memberForUser()?.id || "" : msg.approver, kid: !canManage(), at: iso(new Date()), done: {} });
      else if (a === "task_done") f.tasks.find((x) => x.id === msg.task).done[msg.member] = "wait";
      else if (a === "task_approve") {
        f.tasks.find((x) => x.id === msg.task).done[msg.member] = "ok";
        coin(msg.member, 5);
      } else if (a === "task_remove") f.tasks = f.tasks.filter((x) => x.id !== msg.task);
      else if (a === "hunt_start") f.hunt = { id: "h" + Date.now(), by: msg.member, who: msg.who || [], stars: Array.from({ length: msg.n || 8 }, (_, i) => ({ id: "s" + i, space: msg.spaces[i % msg.spaces.length], x: 150 + ((i * 97) % 700), y: 380 + ((i * 53) % 200) })), found: {}, at: iso(new Date()), done: false };
      else if (a === "hunt_find") {
        f.hunt.found[msg.star] = msg.member;
        coin(msg.member, 3);
        if (Object.keys(f.hunt.found).length >= f.hunt.stars.length) {
          f.hunt.done = true;
          f.party = { id: "p" + Date.now(), at: iso(new Date()), reason: "hunt", who: [...new Set(Object.values(f.hunt.found))] };
        }
      } else if (a === "hunt_stop") f.hunt = null;
      else if (a === "hide") f.hide = { id: "x" + Date.now(), by: msg.member, space: msg.space, x: msg.x, y: msg.y, thing: msg.thing, at: iso(new Date()), found_by: null };
      else if (a === "seek") {
        if (!f.hide || f.hide.found_by || f.hide.by === msg.member) throw { code: "no_hide", message: "Der er ikke gemt noget lige nu." };
        if (msg.space === f.hide.space && Math.hypot(msg.x - f.hide.x, msg.y - f.hide.y) <= 80) {
          f.hide.found_by = msg.member;
          coin(msg.member, 10);
          f.party = { id: "p" + Date.now(), at: iso(new Date()), reason: "hide", who: [msg.member, f.hide.by] };
        }
      } else if (a === "hide_stop") f.hide = null;
      else if (a === "help_ask") (f.helps ||= []).push({ id: "h" + Date.now(), by: msg.member, for: msg.helped, task: msg.task, title: msg.title, at: iso(new Date()), ok: false });
      else if (a === "help_ok") {
        const h = f.helps.find((x) => x.id === msg.help);
        if (h && !h.ok) {
          h.ok = true;
          coin(h.by, 3);
          coin(h.for, 3);
        }
      } else if (a === "vote") {
        const d = new Date();
        d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
        const wk = ymd(d);
        ((f.votes ||= {})[wk] ||= {})[msg.member] = msg.dish;
      } else if (a === "tick") {
        const p = (f.played ||= {})[msg.member] || { date: store.today, min: 0 };
        p.min += 1;
        f.played[msg.member] = p;
      }
      setTimeout(push, 10);
      return JSON.parse(JSON.stringify(f));
    }
    if (t === "hverdagsro/game") {
      check(msg.member);
      const g = (store.game[msg.member] ||= { coins: 0, xp: 0, owned: [] });
      if (msg.action === "daily") {
        if (g.daily !== store.today) {
          g.daily = store.today;
          g.coins += 5;
          g.xp += 5;
        }
      } else {
        const fresh = (msg.items || []).filter((x) => !g.owned.includes(x));
        if (fresh.length) {
          if ((msg.cost || 0) > g.coins) throw { code: "not_enough_coins", message: "Der er ikke mønter nok." };
          g.coins -= msg.cost || 0;
          g.owned.push(...fresh);
        }
      }
      setTimeout(push, 10);
      return { ...g };
    }
    if (t === "hverdagsro/board") {
      check(msg.member);
      const mine = (store.board_done[msg.member] ||= []);
      const key = `${msg.slot}:${msg.index}`;
      if (msg.done && !mine.includes(key)) mine.push(key);
      if (!msg.done && mine.includes(key)) mine.splice(mine.indexOf(key), 1);
      const cards = store.routines.boards?.[msg.member]?.[msg.slot] || [];
      if (cards.length && !mine.includes(`${msg.slot}:bonus`) && cards.every((c, i) => mine.includes(`${msg.slot}:${i}`))) {
        mine.push(`${msg.slot}:bonus`);
        store.points[msg.member] = (store.points[msg.member] || 0) + 5;
      }
      setTimeout(push, 10);
      return { done: mine };
    }
    if (t === "hverdagsro/osky/login") {
      store.osky.accounts[msg.member] = { name: msg.email.split("@")[0], at: new Date().toISOString() };
      setTimeout(push, 10);
      return null;
    }
    if (t === "hverdagsro/osky/logout") {
      delete store.osky.accounts[msg.member];
      setTimeout(push, 10);
      return null;
    }
    if (t === "hverdagsro/osky/refresh") return null;
    if (t === "hverdagsro/osky/wish") {
      const l = store.osky.lists.find((x) => x.id === msg.list);
      l?.wishes.unshift({ id: Math.random().toString(36).slice(2, 8), title: msg.title, price: msg.price ?? null, currency: "DKK", photo: null, url: msg.url || null, shop: "", reserved: 0 });
      if (l) l.count++;
      setTimeout(push, 10);
      return null;
    }
    if (t === "todo/item/list") return { items: todoItems[msg.entity_id] || [] };
    if (t === "config/area_registry/list") return Object.values(reg.areas);
    if (t === "media_player/browse_media") return { title: "Bibliotek", children: [{ title: "Favoritter", media_content_id: "fav", media_content_type: "favorites", can_expand: true, thumbnail: null }] };
    if (t === "logbook/get_events") return [];
    if (t === "history/history_during_period") return {};
    if (t === "image/list") return [];
    if (t === "search/related") return {};
    return null;
  };

  const hass = {
    states,
    entities: reg.entities,
    devices: reg.devices,
    areas: reg.areas,
    floors: {},
    user: u,
    language: lang,
    locale: { language: lang, number_format: "language", time_format: "24" },
    themes: { darkMode: dark },
    selectedTheme: null,
    panelUrl: "hverdagsro",
    panels: { hverdagsro: { url_path: "hverdagsro" }, "ev-planner": { url_path: "ev-planner" } },
    hassUrl: (p = "") => p,
    formatEntityState: (s) => s?.state,
    formatEntityAttributeValue: (s, a) => s?.attributes?.[a],
    callWS: ws,
    callService: async (domain, service, data) => {
      calls.push({ type: "call_service", domain, service, data });
      const ids = [].concat(data?.entity_id || []);
      // Like Home Assistant: a new states object, so the panel sees what changed.
      states = { ...states };
      for (const id of ids) {
        const s = states[id];
        if (!s) continue;
        let next = s.state;
        if (service === "turn_on") next = "on";
        else if (service === "turn_off") next = "off";
        else if (service === "toggle") next = s.state === "on" ? "off" : "on";
        else if (service === "media_play") next = "playing";
        else if (service === "media_pause") next = "paused";
        else if (service.startsWith("alarm_arm_")) next = "armed_" + service.slice(10);
        else if (service === "alarm_disarm") next = "disarmed";
        else if (service === "lock") next = "locked";
        else if (service === "unlock") next = "unlocked";
        const attrs = { ...s.attributes };
        if (service === "volume_set") attrs.volume_level = data.volume_level;
        if (data?.brightness != null) attrs.brightness = data.brightness;
        if (data?.brightness_pct != null) attrs.brightness = Math.round((data.brightness_pct / 100) * 255);
        states[id] = { ...s, state: next, attributes: attrs, last_changed: iso(new Date()) };
      }
      hass.states = { ...states };
      window.__panel && (window.__panel.hass = { ...hass });
    },
    callApi: async (method, path) => {
      calls.push({ type: "api", method, path });
      if (path.startsWith("calendars/") && seed?.calendars) {
        const cal = path.split("?")[0].split("/")[1];
        const qs = new URLSearchParams(path.split("?")[1] || "");
        const from = new Date(qs.get("start") || 0), to = new Date(qs.get("end") || "2100-01-01");
        return (seed.calendars[cal] || []).filter((e) => new Date(e.start.dateTime || e.start.date + "T00:00:00") < to && new Date(e.end.dateTime || e.end.date + "T00:00:00") > from);
      }
      if (path.startsWith("calendars/")) {
        const cal = path.split("?")[0].split("/")[1];
        const qs = new URLSearchParams(path.split("?")[1] || "");
        const from = new Date(qs.get("start") || 0), to = new Date(qs.get("end") || "2100-01-01");
        const inRange = (list) => list.filter((e) => new Date(e.start.dateTime || e.start.date + "T00:00:00") < to && new Date(e.end.dateTime || e.end.date + "T00:00:00") > from);
        const ev = (title, d, h, m, dur = 60, extra = {}) => ({ summary: title, start: { dateTime: iso(day(d, h, m)) }, end: { dateTime: iso(new Date(+day(d, h, m) + dur * 60000)) }, ...extra });
        const allday = (title, d) => ({ summary: title, start: { date: ymd(day(d)) }, end: { date: ymd(day(d + 1)) } });
        if (cal === "calendar.familie") return inRange([ev("Svømning", 0, 16, 30, 60), ev("Forældremøde", 0, 19, 0, 90), ev("Fodbold", 1, 17, 0), ev("Mormor på besøg", 2, 15, 0, 180), allday("Skolefri", 4)]);
        if (cal === "calendar.ida_skema") {
          const L = [["Dansk", 8, 0], ["Matematik", 8, 50], ["Engelsk", 10, 0], ["Natur/teknologi", 10, 50], ["Idræt", 12, 15], ["Musik", 13, 5]];
          const out = [];
          for (let d = -7; d <= 14; d++) {
            const wd = day(d).getDay();
            if (wd === 0 || wd === 6) continue;
            L.slice(0, 4 + ((d + 14) % 3)).forEach(([n, h, m]) => out.push(ev(n, d, h, m, 45)));
          }
          return inRange(out);
        }
        if (cal === "calendar.ida") return inRange([ev("Spejder", 0, 18, 0, 90), ev("Klaver", 2, 15, 30, 45)]);
        if (cal === "calendar.madplan") return inRange([0, 1, 2, 3, 4, 5, 6].map((d, i) => allday(["Lasagne", "Fiskefrikadeller", "Kylling i karry", "Pasta med kødsovs", "Tarteletter", "Pizza", "Suppe"][i], d)));
        return [];
      }
      return null;
    },
    connection: {
      subscribeMessage: async (cb, msg) => {
        calls.push(msg);
        if (msg.type === "hverdagsro/subscribe") {
          listeners.add(cb);
          setTimeout(() => cb(panelState()), 30);
          return () => listeners.delete(cb);
        }
        if (msg.type === "hverdagsro/play_subscribe") {
          // A sibling who is playing too: Oskar in the park, and he walks about.
          const oskar = { member: "oskar", space: "park-plads", x: 640, y: 590, me: { skin: "#F6C9A3", hair: "pjusk", hairc: "#A8642A", top: "#4D96FF", bottom: "#3A3A55", extra: "kasket" } };
          playListeners.add(cb);
          setTimeout(() => cb({ players: [oskar] }), 30);
          return () => playListeners.delete(cb);
        }
        if (msg.type === "weather/subscribe_forecast") {
          const f =
            msg.forecast_type === "daily"
              ? Array.from({ length: 7 }, (_, i) => ({ datetime: iso(day(i, 12)), condition: ["rainy", "partlycloudy", "sunny", "cloudy", "rainy", "sunny", "partlycloudy"][i], temperature: 9 + i, templow: 3 + (i % 3), precipitation: i % 2 ? 0 : 2.4 }))
              : Array.from({ length: 30 }, (_, i) => ({ datetime: iso(new Date(+day(0, now.getHours()) + i * 3600000)), condition: i < 4 ? "rainy" : i < 10 ? "cloudy" : "partlycloudy", temperature: 8 + Math.sin(i / 4) * 3, precipitation: i < 4 ? 0.8 : 0 }));
          setTimeout(() => cb({ type: msg.forecast_type, forecast: f }), 40);
          return () => {};
        }
        return () => {};
      },
      sendMessagePromise: ws,
    },
    __calls: calls,
    __store: store,
  };
  return hass;
}
