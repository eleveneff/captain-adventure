/**
 * Pirate Point lair: prices, prerequisites, persistence, and each interaction.
 * Run: node tests/lair.mjs
 */
import { createRequire } from "module";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const puppeteer = require("/tmp/cap-tools/node_modules/puppeteer-core");
const outDir = "/tmp/cap-shots/lair";
fs.mkdirSync(outDir, { recursive: true });
const failures = [];
function check(name, ok, detail = "") {
  failures.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
}

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--no-sandbox", "--disable-dev-shm-usage"],
});
const errors = [];
async function open(save) {
  const page = await browser.newPage();
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  if (save) await page.evaluateOnNewDocument((payload) => localStorage.setItem("captain-adventure-save-v1", JSON.stringify(payload)), save);
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto("http://127.0.0.1:8765/index.html?debug=nogate,nofuel", { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForFunction(() => window.CaptainAdventure && window.CaptainAdventure.lair && window.CaptainAdventure.lair.DEFS.length === 10, { timeout: 30000 });
  await page.evaluate(() => {
    const intro = document.getElementById("intro");
    if (intro) { intro.classList.add("hidden"); intro.style.display = "none"; }
  });
  return page;
}

const page = await open(null);
const prices = await page.evaluate(() => window.CaptainAdventure.lair.DEFS.map((d) => [d.id, d.price, d.need.join("+")]));
const expect = [["hq", 60, ""], ["pool", 40, "hq"], ["garage", 50, "hq"], ["tower", 30, "hq"], ["trophy", 25, "hq"], ["slide", 35, "hq+pool"], ["course", 30, "hq"], ["aqua", 40, "hq"], ["roof", 25, "hq"], ["tunnel", 45, "hq"]];
check("ten parts at the approved prices", JSON.stringify(prices) === JSON.stringify(expect), JSON.stringify(prices));

const gates = await page.evaluate(() => {
  const L = window.CaptainAdventure.lair;
  const C = window.CaptainAdventure;
  C.setScore(30);
  const slide = L.commit("slide");
  const pool = L.commit("pool");
  const hq = L.commit("hq");
  const afterShort = L.coins();
  C.setScore(100);
  const built = L.commit("hq");
  const slideStill = L.commit("slide");
  const poolBuilt = L.commit("pool");
  const slideShort = L.commit("slide");
  return { slide, pool, hq, afterShort, built, slideStill, poolBuilt, slideShort, vis: {
    hq: C.scene.getObjectByName("lair-hq").visible,
    pool: C.scene.getObjectByName("lair-pool").visible,
    slide: C.scene.getObjectByName("lair-slide").visible,
  } };
});
check("slide refuses without the HQ", gates.slide.ok === false && gates.slide.reason === "need");
check("pool refuses without the HQ", gates.pool.ok === false && gates.pool.reason === "need");
check("short HQ does not charge", gates.hq.ok === false && gates.hq.reason === "short" && gates.afterShort === 30, JSON.stringify(gates.hq));
check("HQ charges exactly 60", gates.built.ok === true && gates.built.score === 40, String(gates.built.score));
check("slide still needs the pool", gates.slideStill.ok === false && gates.slideStill.score === 40);
check("pool charges exactly 40", gates.poolBuilt.ok === true && gates.poolBuilt.score === 0, String(gates.poolBuilt.score));
check("slide refuses when coins are 0", gates.slideShort.ok === false && gates.slideShort.reason === "short" && gates.slideShort.score === 0);
check("HQ and pool are visible, slide is not", gates.vis.hq && gates.vis.pool && !gates.vis.slide, JSON.stringify(gates.vis));

const dup = await page.evaluate(() => {
  const L = window.CaptainAdventure.lair;
  window.CaptainAdventure.setScore(80);
  const again = L.commit("hq");
  return { again, score: L.coins() };
});
check("buying the HQ again does not charge", dup.again.ok === false && dup.again.reason === "owned" && dup.score === 80, String(dup.score));

const menu = await page.evaluate(() => {
  const L = window.CaptainAdventure.lair;
  window.CaptainAdventure.setScore(400);
  const asked = L.ask("garage");
  return { ok: asked.ok === true && asked.pending === true, score: L.coins(), open: !document.getElementById("lair-shop").classList.contains("hidden") };
});
check("build menu shows the price before charging", menu.ok === true && menu.open === true && menu.score === 400, JSON.stringify(menu));
await page.click("#lair-yes");
await page.click("#lair-close");
const afterYes = await page.evaluate(() => window.CaptainAdventure.lair.coins());
check("Yes charges the garage exactly 50", afterYes === 350, String(afterYes));

const rest = await page.evaluate(() => {
  const L = window.CaptainAdventure.lair;
  const C = window.CaptainAdventure;
  const order = ["tower", "trophy", "slide", "course", "aqua", "roof", "tunnel"];
  const log = [];
  for (const id of order) {
    const before = L.coins();
    const res = L.commit(id);
    log.push({ id, drop: before - res.score, ok: res.ok, price: L.DEFS.find((d) => d.id === id).price });
  }
  const again = L.commit("slide");
  return { log, again, score: L.coins(), all: L.DEFS.every((d) => L.own(d.id)) };
});
check("remaining parts charge their exact prices", rest.log.every((row) => row.ok && row.drop === row.price), JSON.stringify(rest.log));
check("full lair leaves 400 minus the eight remaining prices", rest.score === 120, String(rest.score));
check("second slide purchase is free of charge", rest.again.reason === "owned" && rest.score === 120);
check("all ten are owned", rest.all === true);

const play = await page.evaluate(() => {
  const L = window.CaptainAdventure.lair;
  const C = window.CaptainAdventure;
  const out = {};
  L.enter();
  out.inside = L.inside();
  L.act("lair:chair");
  out.sat = L.sitting();
  L.act("lair:chair");
  out.stood = !L.sitting();
  L.act("lair:map");
  L.act("lair:trophy");
  L.act("lair:aqua");
  L.act("lair:aqua");
  L.act("lair:tunnel");
  out.tunnel = L.tunnel();
  const inTunnel = L.loc(C.captain.position.x, C.captain.position.z);
  out.tunnelIe = inTunnel.ie;
  for (let i = 0; i < 8; i++) L.frame(0.05);
  L.place(-16.2, 2.2);
  L.frame(0.05);
  out.beach = !L.tunnel() && !L.inside();
  L.act("lair:beach");
  out.backIn = L.tunnel();
  L.leave();
  out.outside = !L.inside() && !L.tunnel();
  const diveFrom = { x: C.captain.position.x, z: C.captain.position.z };
  L.act("lair:board");
  for (let i = 0; i < 24; i++) L.frame(0.04);
  out.dove = Math.hypot(C.captain.position.x - diveFrom.x, C.captain.position.z - diveFrom.z) > 0.4;
  const slideFrom = { x: C.captain.position.x, z: C.captain.position.z };
  L.act("lair:slide");
  for (let i = 0; i < 30; i++) L.frame(0.04);
  out.slid = Math.hypot(C.captain.position.x - slideFrom.x, C.captain.position.z - slideFrom.z) > 0.5;
  L.act("lair:climb");
  out.high = C.captain.position.y > 4;
  L.act("lair:scope");
  L.frame(0.05);
  out.fovIn = C.camera.fov;
  L.act("lair:scope");
  out.fovOut = C.camera.fov;
  L.act("lair:garage");
  out.doors = L.gOpen();
  L.act("lair:hammock");
  const hy = C.captain.position.y;
  L.frame(0.05);
  out.hammock = C.captain.position.y > 4;
  L.act("lair:hammock");
  out.hammockUp = C.captain.position.y !== hy || true;
  L.place(-6, -7.1);
  for (const ie of [-7.2, -9.35, -11.5, -13.65]) {
    L.place(ie, -7.1);
    L.frame(0.05);
  }
  out.course = L.courseAt();
  const spot = L.world(0.4, 18.5, 0);
  C.boatAt(spot.x, spot.z, 0);
  const boat = C.VEH.motorboat.obj;
  out.parked = L.boatE(boat);
  out.modeAfterPark = C.mode;
  out.boatHidden = !boat.visible;
  out.parkFlag = L.parked();
  const coinsMid = L.coins();
  L.act("lair:garage");
  out.modeAfterLaunch = C.mode;
  out.parkCleared = !L.parked();
  out.coinsHeld = L.coins() === coinsMid;
  const near = L.near(C.captain.position);
  return out;
});
check("door enters the HQ", play.inside === true);
check("chair sits and stands", play.sat === true && play.stood === true);
check("tunnel starts under the lair", play.tunnel === true && play.tunnelIe < -1, String(play.tunnelIe));
check("tunnel walk reaches the back beach", play.beach === true);
check("beach arch returns into the tunnel", play.backIn === true);
check("exit leaves the lair", play.outside === true);
check("dive leaves the board", play.dove === true, JSON.stringify(play));
check("slide carries the captain", play.slid === true, JSON.stringify(play));
check("tower climb raises the captain", play.high === true, String(play.high));
check("telescope narrows the camera and closes again", play.fovIn < 25 && play.fovOut > 40, JSON.stringify({ fovIn: play.fovIn, fovOut: play.fovOut }));
check("rock doors slide open", play.doors === 1, String(play.doors));
check("hammock holds the captain up on the roof", play.hammock === true);
check("obstacle course counts four gates", play.course === 4, String(play.course));
check("boat parks in the garage without spending coins", play.parked === true && play.modeAfterPark === "walk" && play.boatHidden === true && play.parkFlag === true && play.coinsHeld === true, JSON.stringify(play));
check("launch puts the boat back in the water", play.modeAfterLaunch === "motorboat" && play.parkCleared === true);

const kept = await page.evaluate(() => {
  const C = window.CaptainAdventure;
  const s = C.state();
  s.badges.volcano = true;
  s.badges.baseball = true;
  s.prizes = ["yacht"];
  s.fuel.motorboat = 0.35;
  s.fuel.yacht = 0.8;
  s.v43.isles = { turtle: 1, pirate: 1, parrot: 1 };
  s.streak = 6;
  s.shop = { equip: { hat: "captain" } };
  s.score = 80;
  C.save();
  return { score: s.score, stars: Object.keys(s.badges).length };
});
await page.reload({ waitUntil: "networkidle0" });
await page.waitForFunction(() => window.CaptainAdventure && window.CaptainAdventure.lair && window.CaptainAdventure.lair.own("tunnel"), { timeout: 30000 });
const restored = await page.evaluate(() => {
  const C = window.CaptainAdventure;
  const s = C.state();
    const outside = ["lair-hq", "lair-pool", "lair-slide", "lair-garage", "lair-tower", "lair-roof", "lair-tunnel", "lair-course"];
    const exterior = outside.every((n) => C.scene.getObjectByName(n) && C.scene.getObjectByName(n).visible);
    C.lair.enter();
    const rooms = ["lair-trophy", "lair-aqua"].every((n) => C.scene.getObjectByName(n) && C.scene.getObjectByName(n).visible);
    return {
      score: s.score,
      badges: s.badges,
      prizes: s.prizes,
      fuel: s.fuel,
      isles: s.v43.isles,
      streak: s.streak,
      hat: s.shop && s.shop.equip && s.shop.equip.hat,
      owned: s.v45.owned,
      shown: exterior && rooms,
    };
});
check("reload keeps coins", restored.score === 80, String(restored.score));
check("reload keeps stars and badges", restored.badges.volcano === true && restored.badges.baseball === true);
check("reload keeps the yacht, fuel, discoveries, streak, and hat", restored.prizes.includes("yacht") && Math.abs(restored.fuel.motorboat - 0.35) < 1e-6 && restored.isles.pirate === 1 && restored.isles.turtle === 1 && restored.streak === 6 && restored.hat === "captain", JSON.stringify(restored));
check("reload shows every built part", restored.shown === true && restored.owned.slide === 1 && restored.owned.hq === 1);

async function shot(name, size, camIe, camGe, camY, lookIe, lookGe) {
  await page.setViewport({ width: size[0], height: size[1], deviceScaleFactor: 1 });
  await page.evaluate((camIe, camGe, camY, lookIe, lookGe) => {
    for (const id of ["intro", "hud", "hint", "prize", "garage", "lair-shop"]) {
      const n = document.getElementById(id);
      if (n) { n.classList.add("hidden"); n.style.display = "none"; }
    }
    const C = window.CaptainAdventure;
    const L = C.lair;
    L.leave();
    L.place(16, 4);
    const exit = document.getElementById("lair-exit");
    if (exit) exit.style.display = "none";
    const prompt = document.getElementById("prompt");
    if (prompt) prompt.style.display = "none";
    const cam = L.world(camIe, camGe, 0);
    const look = L.world(lookIe, lookGe, 2);
    C.photo([cam.x, camY, cam.z], [look.x, 3, look.z]);
    C.qc(8);
  }, camIe, camGe, camY, lookIe, lookGe);
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(outDir, name + ".png") });
}
await shot("desktop", [1280, 720], -6, 24, 16, 2, -1);
await shot("portrait", [390, 844], -4, 26, 20, 2, -1);
await shot("landscape-short", [844, 390], -8, 22, 12, 2, -1);
await shot("garage", [1280, 720], 2, 20, 9, 0.3, 5);
await page.evaluate(() => {
  const C = window.CaptainAdventure;
  const L = C.lair;
  L.enter();
  const eye = L.world(-1.4, -2.4, 0);
  const look = L.world(-1.2, 0.6, 1);
  const gy = L.gy(-1.4, -2.4);
  const prompt = document.getElementById("prompt");
  if (prompt) prompt.style.display = "none";
  C.photo([eye.x, gy + 1.7, eye.z], [look.x, gy + 1.15, look.z]);
  C.qc(8);
});
await page.setViewport({ width: 1280, height: 720 });
await new Promise((r) => setTimeout(r, 300));
await page.screenshot({ path: path.join(outDir, "interior.png") });

async function fpsAt(label, place) {
  const runs = [];
  for (let i = 0; i < 3; i++) {
    const fps = await page.evaluate((p) => new Promise((resolve) => {
      const C = window.CaptainAdventure;
      C.qc(null);
      C.lair.leave();
      if (p) C.boatAt(p.x, p.z, 0);
      let n = 0;
      const t0 = performance.now();
      function loop(t) {
        n++;
        if (t - t0 >= 1200) resolve((n * 1000) / (t - t0));
        else requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
    }), place);
    runs.push(fps);
  }
  runs.sort((a, b) => a - b);
  console.log(`FPS ${label} ${runs.map((n) => n.toFixed(1)).join(", ")} median ${runs[1].toFixed(1)}`);
  return { label, runs, median: runs[1] };
}
const center = await page.evaluate(() => {
  const isle = window.CaptainAdventure.isl.L.find((n) => n.id === "pirate");
  return { x: isle.cx + 12, z: isle.cz + 8 };
});
const fps = [];
fps.push(await fpsAt("home-harbor", { x: 30, z: 12 }));
fps.push(await fpsAt("pirate-lair", center));
const worst = fps.slice().sort((a, b) => a.median - b.median)[0];
check("frames advance with the lair built", fps.every((n) => n.median > 0), fps.map((n) => `${n.label}:${n.median.toFixed(1)}`).join(" "));

await page.close();
await browser.close();
const realErrors = errors.filter((e) => !/favicon/i.test(e));
check("no console errors", realErrors.length === 0, realErrors.slice(0, 5).join(" | "));
const summary = { passed: failures.filter((f) => f.ok).length, failed: failures.filter((f) => !f.ok).length, worst, fps };
fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
if (summary.failed) process.exit(1);
