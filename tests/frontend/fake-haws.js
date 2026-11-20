/* A stand-in for home-assistant-js-websocket in app.mjs: the home-screen app (app.html) signs in and talks to
   the fake Home Assistant of mock-hass.js. */
import { createMockHass } from "/tests/frontend/mock-hass.js"; // served at /hverdagsro_app/, so an absolute path

const mock = createMockHass({ user: "anna" });
window.__mock = mock;
export const ERR_INVALID_AUTH = 2;
export const getAuth = async () => ({ expired: false, accessToken: "test", refreshAccessToken: async () => {} });
export const getUser = async () => mock.user;
const compress = (entities) => ({
  entity_categories: { 0: "config", 1: "diagnostic" },
  entities: Object.values(entities).map((e) => ({ ei: e.entity_id, di: e.device_id ?? undefined, ai: e.area_id ?? undefined, pl: e.platform })),
});
export const createConnection = async () => ({
  connected: true,
  async sendMessagePromise(msg) {
    window.__sent = [...(window.__sent || []), msg.type];
    if (msg.type === "get_panels")
      return { hverdagsro: { url_path: "hverdagsro", config: { static_url: "/custom_components/hverdagsro/frontend", app_url: "/hverdagsro_app", version: "test", _panel_custom: { name: "hverdagsro-panel", module_url: "/custom_components/hverdagsro/frontend/hverdagsro-panel.js" } } }, "ev-planner": { url_path: "ev-planner" } };
    if (msg.type === "get_config") return { language: "da", components: ["hverdagsro", "ev_household_planner"], time_zone: "Europe/Copenhagen" };
    if (msg.type === "frontend/get_themes") return { themes: {}, default_theme: "default" };
    if (msg.type === "frontend/get_user_data") return { value: null };
    if (msg.type === "config/entity_registry/list_for_display") return compress(mock.entities);
    if (msg.type === "config/device_registry/list") return Object.values(mock.devices);
    if (msg.type === "config/area_registry/list") return Object.values(mock.areas);
    if (msg.type === "call_service") return mock.callService(msg.domain, msg.service, msg.service_data);
    return mock.callWS(msg);
  },
  subscribeMessage: (cb, msg) => mock.connection.subscribeMessage(cb, msg),
  subscribeEvents: async () => () => {},
});
export const subscribeEntities = (conn, cb) => {
  setTimeout(() => cb(mock.states), 10);
  return () => {};
};
