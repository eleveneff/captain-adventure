/**
 * Graphics regression for the 5.0 world upgrade.
 * Run: node tests/v50-gfx.mjs
 */
import { createRequire } from "module";
import http from "http";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const puppeteer = require("/tmp/cap-tools/node_modules/puppeteer-core");
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const failures = [];
function check(name, ok, detail = "") {
  failures.push({ name, ok: !!ok });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
}

const server = http.createServer((req, res) => {
  const file = req.url.split("?")[0] === "/" ? "/index.html" : req.url.split("?")[0];
  const full = path.join(root, decodeURIComponent(file));
  if (!full.startsWith(root) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, { "content-type": path.extname(full) === ".js" ? "text/javascript" : "text/html" });
  fs.createReadStream(full).pipe(res);
});
await new Promise((r) => server.listen(8798, "127.0.0.1", r));
const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--no-sandbox", "--disable-dev-shm-usage"]
});
const errors = [];
const page = await browser.newPage();
page.on("pageerror", (e) => errors.push(String(e.message || e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.setViewport({ width: 1280, height: 800 });
await page.goto("http://127.0.0.1:8798/index.html?quiet=1", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForFunction(() => window.CaptainAdventure && window.CaptainAdventure.learn, { timeout: 30000 });
await page.evaluate(() => document.getElementById("intro")?.classList.add("hidden"));

const report = await page.evaluate(() => {
  const C = window.CaptainAdventure;
  const names = {};
  C.scene.traverse((o) => { if (o.name && o.name.indexOf("v50-") === 0) names[o.name] = (names[o.name] || 0) + 1; });
  let shingle = 0, swell = 0, court = 0, lava = 0, cones = 0;
  C.scene.traverse((o) => {
    if (o.userData && o.userData.v50Shingle) shingle += 1;
    if (o.material && o.material.userData && o.material.userData.v50swell) swell += 1;
    if (o.userData && o.userData.v50court) court += 1;
    if (o.userData && o.userData.v50lava) lava += 1;
    if (o.name && o.name.indexOf("v50-snow") === 0 && o.geometry && o.geometry.type === "ConeGeometry") cones += 1;
  });
  const prices = { tank: C.fuel && C.fuel.PRICE, big: C.MG_COST_BIG, other: C.MG_COST };
  return { names, shingle, swell, court, lava, cones, prices, hooked: !!(C.renderer && C.renderer.__v50hook) };
});
const need = ["v50-face", "v50-joint", "v50-doorframe", "v50-rail", "v50-beam", "v50-frond", "v50-foam", "v50-slide-lip", "v50-path", "v50-smoke", "v50-rope", "v50-shadow", "v50-cloud", "v50-buoy", "v50-seat", "v50-wall", "v50-dirt", "v50-court"];
need.forEach((name) => check(name + " is in the world", (report.names[name] || 0) > 0, String(report.names[name] || 0)));
check("roofs carry shingles", report.shingle >= 1, String(report.shingle));
check("the ocean shader has the slow swell", report.swell >= 1, String(report.swell));
check("lava has a flowing map", report.lava >= 1 && (report.names["v50-smoke"] || 0) >= 2, JSON.stringify({ lava: report.lava, smoke: report.names["v50-smoke"] }));
check("prices are unchanged", report.prices.other === 10 && report.prices.big && report.prices.big.baseball === 30 && report.prices.big.tecmo === 30, JSON.stringify(report.prices));
check("mini-game render hook is still installed", report.hooked);

const hidden = await page.evaluate(() => {
  const C = window.CaptainAdventure;
  C.setScore(900);
  const before = C.renderer.info.render.frame;
  C.openMG("fishing");
  const open = document.body.classList.contains("mg-on") && !document.getElementById("mg").classList.contains("hidden");
  return new Promise((resolve) => {
    setTimeout(() => {
      const during = C.renderer.info.render.frame - before;
      document.querySelector("#mg .mg-x")?.click();
      setTimeout(() => {
        const back = !document.body.classList.contains("mg-on");
        resolve({ open, during, back, score: C.state().score });
      }, 200);
    }, 250);
  });
});
check("a mini-game still skips 3D drawing and then restores it", hidden.open && hidden.during === 0 && hidden.back, JSON.stringify(hidden));

const fps = await page.evaluate(() => {
  const C = window.CaptainAdventure;
  C.photo([28, 14, 22], [0, 1, 2]);
  const draws = [];
  for (let i = 0; i < 8; i++) {
    const a = performance.now();
    C.renderer.render(C.scene, C.camera);
    draws.push(performance.now() - a);
  }
  draws.sort((a, b) => a - b);
  const median = draws[Math.floor(draws.length / 2)];
  return { median, rate: median > 0 ? Math.round(1000 / median) : 0, draws: draws.map((n) => Math.round(n)) };
});
check("a frame still draws at least 15 fps", fps.rate >= 15, fps.rate + " fps " + JSON.stringify(fps.draws));

const winter = await page.evaluate(() => {
  const C = window.CaptainAdventure;
  C.learn.setDate("2026-12-20");
  const on = C.learn.winter.stats();
  C.learn.setDate("2026-11-17");
  const off = C.learn.winter.stats();
  return { on, off };
});
check("winter snow still sits on the world and turns off again", winter.on.on && winter.on.roofs >= 1 && winter.on.cones === 0 && winter.off.on === false, JSON.stringify(winter));

const shop = await page.evaluate(() => {
  const C = window.CaptainAdventure;
  C.openShop();
  const canvas = document.querySelector("#shop-preview canvas");
  const open = canvas && !document.getElementById("shop").classList.contains("hidden");
  document.getElementById("shop-close")?.click();
  return { open: !!open, closed: document.getElementById("shop").classList.contains("hidden") };
});
check("the shop shows a live captain preview", shop.open && shop.closed, JSON.stringify(shop));
check("no page errors", errors.filter((e) => !/favicon|Failed to load resource/i.test(e)).length === 0, errors.slice(0, 2).join(" | "));

await browser.close();
server.close();
if (failures.some((f) => !f.ok)) process.exit(1);
