/* Opens every page of the panel as different family members with a fake Home Assistant and fails on any
   console error. Run: node tests/frontend/smoke.mjs  (needs Playwright with Chromium). */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const runs = [
  ["--view", "hjem"],
  ["--view", "hjem", "--narrow", "--width", "390"],
  ["--view", "hjem", "--dark", "--lang", "en"],
  ["--view", "kalender"],
  ["--view", "opgaver"],
  ["--view", "madplan"],
  ["--view", "lister"],
  ["--view", "musik"],
  ["--view", "apparater"],
  ["--view", "sikkerhed"],
  ["--view", "husbygger"],
  ["--view", "rum:ida"],
  ["--view", "rum:stue"],
  ["--view", "person:ida"],
  ["--view", "mig"],
  ["--view", "indstillinger:familie"],
  ["--view", "indstillinger:moduler"],
  ["--view", "indstillinger:hjemmet"],
  ["--view", "indstillinger:pynt"],
  ["--view", "indstillinger:avanceret"],
  ["--view", "guide", "--setup", "0"],
  ["--user", "admin", "--setup", "0"],
  ["--user", "mads", "--setup", "0"],
  ["--user", "ida", "--view", "dag"],
  ["--user", "ida", "--view", "shop"],
  ["--user", "ida", "--view", "vaerelse"],
  ["--user", "ida", "--view", "lister", "--narrow", "--width", "390"],
  ["--user", "tablet"],
  ["--user", "tablet", "--as", "oskar", "--view", "dag"],
  ["--user", "anna", "--as", "ida", "--view", "dag", "--lang", "en"],
];
let failed = 0;
for (const args of runs) {
  const r = spawnSync(process.execPath, [path.join(here, "run.mjs"), ...args, "--wait", "700"], { encoding: "utf8" });
  const ok = r.status === 0;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${args.join(" ")}  ${r.stdout.trim().split("\n")[0]}`);
  if (!ok) console.log(r.stdout + r.stderr);
}
console.log(failed ? `${failed} of ${runs.length} failed` : `all ${runs.length} passed`);
process.exit(failed ? 1 : 0);
