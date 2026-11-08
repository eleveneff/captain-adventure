/**
 * Targeted lighthouse camera check. Not a performance sweep.
 * The hat and the torso stay on screen at the bottom, middle, and top
 * of the climb, and on the walk up to the lamp.
 * Run: node tests/lh-view.mjs
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
page.on("pageerror", (e) => errors.push(String(e.message || e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.setViewport({ width: 1280, height: 720 });
await page.goto("http://127.0.0.1:8765/index.html?debug=nogate,nofuel", { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForFunction(() => window.CaptainAdventure && window.CaptainAdventure.lh, { timeout: 30000 });

const views = await page.evaluate(() => {
  const C = window.CaptainAdventure;
  document.getElementById("intro").classList.add("hidden");
  C.photo(null);
  const L = C.lh;
  const g = C.scene.getObjectByName("lh-interior");
  function frame(label) {
    const cam = C.camera;
    const pl = C.captain;
    cam.updateMatrixWorld(true);
    const hatP = pl.position.clone();
    hatP.y += 2.05;
    const hat = hatP.project(cam);
    cam.updateMatrixWorld(true);
    const bodyP = pl.position.clone();
    bodyP.y = pl.position.y + 0.95;
    const body = bodyP.project(cam);
    const lc = g.worldToLocal(cam.position.clone());
    const lp = g.worldToLocal(pl.position.clone());
    const abx = lp.x - lc.x;
    const abz = lp.z - lc.z;
    const ab2 = abx * abx + abz * abz || 1;
    let t = -(lc.x * abx + lc.z * abz) / ab2;
    t = Math.max(0, Math.min(1, t));
    const origin = Math.hypot(lc.x + abx * t, lc.z + abz * t);
    return {
      label,
      hat: [hat.x, hat.y, hat.z],
      body: [body.x, body.y, body.z],
      origin,
      py: pl.position.y,
    };
  }
  const out = [];
  function climbTo(frac) {
    L.land();
    L.enterInside();
    L.startClimb(true);
    let u = 0;
    const need = frac * 2.6;
    while (u < need) { L.step(0.04); u += 0.04; }
    return frame("climb " + frac);
  }
  out.push(climbTo(0.2));
  out.push(climbTo(0.5));
  out.push(climbTo(0.85));
  L.land();
  L.enterInside();
  L.startClimb(true);
  let u = 0;
  while (u < 3.2) { L.step(0.04); u += 0.04; }
  L.snapCam();
  out.push(frame("lamp stand"));
  L.teleport(-1.1, -0.3, 1);
  L.snapCam();
  out.push(frame("lamp approach"));
  const yLamp = C.captain.position.y;
  L.lampAct();
  const lit = !!(C.state().v4 && C.state().v4.lh && C.state().v4.lh.lit);
  return { out, yLamp, lit };
});

function onScreen(p) {
  return p[0] > -0.55 && p[0] < 0.55 && p[1] > -0.85 && p[1] < 0.78 && p[2] > 0 && p[2] < 1;
}
for (const v of views.out) {
  check(`${v.label} hat stays on screen`, onScreen(v.hat), JSON.stringify(v.hat.map((n) => +n.toFixed(2))));
  check(`${v.label} torso stays on screen`, onScreen(v.body), JSON.stringify(v.body.map((n) => +n.toFixed(2))));
}
const lamp = views.out.filter((v) => v.label.startsWith("lamp"));
check("lamp view does not look through the cage", lamp.every((v) => v.origin > 0.9), lamp.map((v) => v.origin.toFixed(2)).join(", "));
check("climb reaches the lamp floor", views.yLamp > 4, String(views.yLamp));
check("the lamp still lights", views.lit === true);

await browser.close();
const real = errors.filter((e) => !/favicon/i.test(e));
check("no console errors", real.length === 0, real.slice(0, 3).join(" | "));
const failed = failures.filter((f) => !f.ok).length;
console.log(JSON.stringify({ passed: failures.length - failed, failed }));
if (failed) process.exit(1);
