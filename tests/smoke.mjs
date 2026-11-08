/**
 * Smoke the systems this branch must not change.
 * There is no older automated suite in this repo, so this checks live constants
 * and a few calls. It does not play a full mini-game.
 * Run: node tests/smoke.mjs
 */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const puppeteer = require("/tmp/cap-tools/node_modules/puppeteer-core");
const failures = [];
function check(name, ok, detail = "") {
  failures.push({ name, ok: !!ok });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
}
const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--no-sandbox"],
});
const errors = [];
const page = await browser.newPage();
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto("http://127.0.0.1:8765/index.html?debug=nogate,nofuel", { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForFunction(() => window.CaptainAdventure && window.CaptainAdventure.fuel, { timeout: 30000 });
await page.evaluate(() => document.getElementById("intro").classList.add("hidden"));
const info = await page.evaluate(() => {
  const C = window.CaptainAdventure;
  const s = C.state();
  const before = s.score;
  C.setScore(40);
  const fuel = C.fuel;
  const home = C.walkable(0, 8);
  const qs = C.questionsFor ? C.questionsFor("baseball") : [];
  return {
    version: C.version,
    tank: fuel && fuel.FULL_TANK_COINS,
    price: fuel && fuel.PRICE,
    mg: C.MG_COST,
    big: C.MG_COST_BIG,
    gate: C.GATE_EVERY,
    score: C.state().score,
    before,
    home,
    qCount: Array.isArray(qs) ? qs.length : 0,
    deep: C.deep && Math.round(C.deep.DEEP_R),
    mode: C.mode,
    hasBoard: typeof C.enterVehicle === "function",
    hasTow: typeof C.towToDock === "function",
  };
});
check("version is v4.6", info.version === "v4.6", info.version);
check("full tank is still 20 coins", info.tank === 20, String(info.tank));
check("diesel price constant is unchanged", info.price === 5, String(info.price));
check("small tickets stay 10", info.mg === 10, String(info.mg));
check("baseball and Tecmo stay 30", info.big && info.big.baseball === 30 && info.big.tecmo === 30, JSON.stringify(info.big));
check("math gate is still every 3", info.gate === 3, String(info.gate));
check("home beach is walkable", info.home === true);
check("baseball station still has questions", info.qCount > 0, String(info.qCount));
check("sea boundary is the widened disk", info.deep === 324, String(info.deep));
check("boarding and tow hooks still exist", info.hasBoard === true && info.hasTow === true);
check("score can be set without going negative", info.score === 40);
const moved = await page.evaluate(() => {
  const C = window.CaptainAdventure;
  C.boatAt(30, 12, 0);
  const a = { x: C.VEH.motorboat.obj.position.x, z: C.VEH.motorboat.obj.position.z };
  C.keys.KeyW = true;
  return new Promise((resolve) => {
    let n = 0;
    function step() {
      n++;
      if (n < 20) requestAnimationFrame(step);
      else {
        C.keys.KeyW = false;
        const b = C.VEH.motorboat.obj.position;
        resolve({ moved: Math.hypot(b.x - a.x, b.z - a.z), score: C.state().score, fuel: C.fuel.level("motorboat") });
      }
    }
    requestAnimationFrame(step);
  });
});
check("power boat still moves at home waters", moved.moved > 1, moved.moved.toFixed(2));
check("boating did not spend coins or empty the tank", moved.score === 40 && moved.fuel > 0.9, JSON.stringify(moved));
await browser.close();
const real = errors.filter((e) => !/favicon/i.test(e));
check("no console errors", real.length === 0, real.slice(0, 3).join(" | "));
console.log(JSON.stringify({ passed: failures.filter((f) => f.ok).length, failed: failures.filter((f) => !f.ok).length }));
if (failures.some((f) => !f.ok)) process.exit(1);
