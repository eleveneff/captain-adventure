/**
 * Captain Adventure v4.5 sea-spread checks.
 * Run: node tests/sea-spread.mjs
 * Needs google-chrome and puppeteer-core (this environment: /tmp/cap-tools).
 */
import { createRequire } from "module";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const puppeteer = require("/tmp/cap-tools/node_modules/puppeteer-core");

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const S = Math.sqrt(1.25);
const OLD_R = 290;
const outDir = "/tmp/cap-shots/after";
fs.mkdirSync(outDir, { recursive: true });

const failures = [];
function check(name, ok, detail = "") {
  const row = { name, ok: !!ok, detail };
  failures.push(row);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
}

function sourceHas(needle) {
  return html.includes(needle);
}

check("spread constant", sourceHas("var SEA_SPREAD=Math.sqrt(1.25)"));
check("sea radius uses spread", sourceHas("m=232*p*SEA_SPREAD"));
check("pirate radius unchanged", sourceHas("r:218*SEA_SPREAD,R:20"));
check("turtle radius unchanged", sourceHas("r:222*SEA_SPREAD,R:19"));
check("parrot radius unchanged", sourceHas("r:226*SEA_SPREAD,R:18"));
check("full tank still 20", sourceHas("FULL_TANK_COINS:20"));
check("gate reward still 20", sourceHas("var Of=20"));
check("big mini-games still 30", sourceHas("baseball:30,tecmo:30"));
check("other tickets still 10", sourceHas("Z_=10"));
check("home radius formula unchanged", sourceHas("var $n=15*Ot"));
check("activity radius formula unchanged", sourceHas("var Vc=40*Ot,Hc=11*Ot"));
check("deep swell band unchanged", sourceHas("Lf(120,185"));
check("layout migration present", sourceHas("Ne.layoutVer!==3"));

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--no-sandbox",
    "--disable-dev-shm-usage",
  ],
});

const errors = [];
async function open(save) {
  const page = await browser.newPage();
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  if (save) {
    await page.evaluateOnNewDocument((payload) => {
      localStorage.setItem("captain-adventure-save-v1", JSON.stringify(payload));
    }, save);
  }
  await page.goto("http://127.0.0.1:8765/index.html?debug=nogate,nofuel", {
    waitUntil: "networkidle0",
    timeout: 60000,
  });
  await page.waitForFunction(() => window.CaptainAdventure && window.CaptainAdventure.isl && window.CaptainAdventure.isl.L.length === 3, {
    timeout: 30000,
  });
  await page.click("#start");
  await page.waitForFunction(() => document.getElementById("intro").classList.contains("hidden"));
  return page;
}

const page = await open(null);
const world = await page.evaluate(() => {
  const C = window.CaptainAdventure;
  return {
    version: C.version,
    spread: C.SEA_SPREAD,
    deepR: C.deep.DEEP_R,
    fogNear: C.scene.fog.near,
    fogFar: C.scene.fog.far,
    camFar: C.camera.far,
    homeR: C.HOME_R,
    stR: C.ST_R,
    isR: C.IS_R,
    tank: C.fuel && C.fuel.FULL_TANK_COINS,
    mg: C.MG_COST,
    big: C.MG_COST_BIG,
    buoys: C.deep.buoys ? C.deep.buoys.count : null,
    isles: C.isl.L.map((n) => ({
      id: n.id,
      R: n.R,
      dist: Math.hypot(n.cx, n.cz),
      boat: n.boatSpot,
      land: n.landSpot,
    })),
    sights: C.deep.SIGHTS.map((n) => ({ id: n.id, r: Math.hypot(n.x, n.z) })),
    score: C.state().score,
  };
});

check("version v4.5", world.version === "v4.5", world.version);
check("spread value", Math.abs(world.spread - S) < 1e-9, String(world.spread));
check("area +25%", Math.abs(world.deepR / OLD_R - S) < 1e-6 && Math.abs((world.deepR / OLD_R) ** 2 - 1.25) < 1e-6, `R=${world.deepR}`);
check("home radius", Math.abs(world.homeR - 15 * 1.5625) < 1e-6, String(world.homeR));
check("ring radius", Math.abs(world.stR - 40 * 1.5625) < 1e-6, String(world.stR));
check("activity radius", Math.abs(world.isR - 11 * 1.5625) < 1e-6, String(world.isR));
check("camera far still clears the sea", world.camFar > world.deepR + 80, String(world.camFar));
const fogWant = 175 + (OLD_R * S - 175) * (470 - 175) / (OLD_R - 175);
check("fog far tracks the new edge", Math.abs(world.fogFar - fogWant) < 0.01, `got ${world.fogFar} want ${fogWant}`);
check("fuel price untouched", world.tank === 20, String(world.tank));
check("ticket prices untouched", world.mg === 10 && world.big.baseball === 30 && world.big.tecmo === 30, JSON.stringify({ mg: world.mg, big: world.big }));
check("starting coins stay 0", world.score === 0, String(world.score));
check("buoy count scaled", world.buoys === Math.round(56 * S) + 6, String(world.buoys));

const expectR = { turtle: 19, pirate: 20, parrot: 18 };
const expectDist = { turtle: 222 * S, pirate: 218 * S, parrot: 226 * S };
for (const isle of world.isles) {
  check(`${isle.id} land radius`, isle.R === expectR[isle.id], String(isle.R));
  check(`${isle.id} spaced out`, Math.abs(isle.dist - expectDist[isle.id]) < 0.05, isle.dist.toFixed(2));
  check(`${isle.id} inside the buoys`, isle.dist + isle.R + 8 < world.deepR, isle.dist.toFixed(1));
}
const sightBase = { sandbar: 132 * 1.25, dolphins: 150 * 1.25, lighthouse: 175 * 1.25, whale: 200 * 1.25, treasure: 212 * 1.25 };
for (const sight of world.sights) {
  check(`${sight.id} spaced out`, Math.abs(sight.r - sightBase[sight.id] * S) < 0.05, sight.r.toFixed(2));
  check(`${sight.id} inside the buoys`, sight.r + 12 < world.deepR, sight.r.toFixed(1));
}

const routes = await page.evaluate(() => {
  const C = window.CaptainAdventure;
  const ok = (x, z) => C.deep.waterOk(x, z, () => true);
  const edge = C.deep.DEEP_R;
  const samples = [];
  for (const ang of [0.4, 1.2, 2.2, 3.4, 4.6, 5.5]) {
    samples.push({
      ang,
      inside: ok(Math.cos(ang) * (edge - 6), Math.sin(ang) * (edge - 6)),
      outside: ok(Math.cos(ang) * (edge + 8), Math.sin(ang) * (edge + 8)),
    });
  }
  const docks = C.isl.L.map((n) => {
    C.boatAt(n.boatSpot.x, n.boatSpot.z, n.yaw || 0);
    const boat = C.VEH.motorboat.obj.position;
    const landed = C.isl.canLand(boat);
    const water = ok(n.boatSpot.x, n.boatSpot.z);
    const cam = C.camera.position;
    return {
      id: n.id,
      water,
      landed: !!(landed && landed.id === n.id),
      camOk: [cam.x, cam.y, cam.z].every(Number.isFinite),
      boatY: boat.y,
    };
  });
  // Open-water hop between the hub speedway and Pirate Point.
  const pirate = C.isl.L.find((n) => n.id === "pirate");
  const mid = ok(pirate.cx * 0.55, pirate.cz * 0.55);
  const homeGap = ok(Math.cos(1.18) * (C.HOME_R + 6), Math.sin(1.18) * (C.HOME_R + 6));
  return { samples, docks, mid, homeGap, bridgeOpen: C.deep.open };
});

check("every bearing allows water inside the buoys", routes.samples.every((s) => s.inside), JSON.stringify(routes.samples.map((s) => s.inside)));
check("every bearing stops past the buoys", routes.samples.every((s) => !s.outside), JSON.stringify(routes.samples.map((s) => s.outside)));
check("open water between hub and Pirate Point", routes.mid === true);
check("home harbor water still boats", routes.homeGap === true);
for (const dock of routes.docks) {
  check(`${dock.id} dock is water`, dock.water === true);
  check(`${dock.id} boat can land`, dock.landed === true, JSON.stringify(dock));
  check(`${dock.id} camera finite`, dock.camOk === true);
}

const drive = await page.evaluate(() => new Promise((resolve) => {
  const C = window.CaptainAdventure;
  C.qc(null);
  const ang = 0.4;
  const radius = C.deep.DEEP_R * 0.72;
  C.boatAt(Math.cos(ang) * radius, Math.sin(ang) * radius, ang);
  const a = C.VEH.motorboat.obj.position.clone();
  C.keys.KeyW = true;
  let n = 0;
  function step() {
    n++;
    if (n < 40) requestAnimationFrame(step);
    else {
      C.keys.KeyW = false;
      const b = C.VEH.motorboat.obj.position;
      resolve({
        moved: Math.hypot(b.x - a.x, b.z - a.z),
        score: C.state().score,
        fuel: C.fuel.level("motorboat"),
      });
    }
  }
  requestAnimationFrame(step);
}));
check("W drives the power boat", drive.moved > 2, drive.moved.toFixed(2));
check("driving does not mint or spend coins", drive.score === 0, String(drive.score));
check("nofuel debug does not empty the tank", drive.fuel > 0.9, String(drive.fuel));

const keys = await page.evaluate(() => new Promise((resolve) => {
  const C = window.CaptainAdventure;
  const before = !!C.keys.KeyA;
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "a", code: "KeyA", bubbles: true }));
  const down = !!C.keys.KeyA;
  window.dispatchEvent(new KeyboardEvent("keyup", { key: "a", code: "KeyA", bubbles: true }));
  resolve({ before, down, up: !!C.keys.KeyA });
}));
check("keyboard A is the left control", keys.down === true && keys.up === false, JSON.stringify(keys));

await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
const touch = await page.evaluate(() => {
  document.body.classList.add("touch");
  const joy = getComputedStyle(document.getElementById("joy")).display;
  const act = document.getElementById("act");
  return { joy, act: !!act, hintHidden: getComputedStyle(document.getElementById("hint")).display === "none" };
});
check("portrait touch stick is available", touch.joy !== "none", touch.joy);
check("mobile action button exists", touch.act === true);

async function fpsAt(label, place) {
  const runs = [];
  for (let i = 0; i < 3; i++) {
    const fps = await page.evaluate((p) => new Promise((resolve) => {
      const C = window.CaptainAdventure;
      C.qc(null);
      if (p) C.boatAt(p.x, p.z, p.yaw || 0);
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
  const median = runs[1];
  console.log(`FPS ${label} runs ${runs.map((n) => n.toFixed(1)).join(", ")} median ${median.toFixed(1)}`);
  return { label, runs, median };
}

const pirate = world.isles.find((n) => n.id === "pirate");
const fps = [];
fps.push(await fpsAt("home-harbor", { x: 30, z: 12, yaw: 0 }));
fps.push(await fpsAt("open-water", { x: pirate.dist * 0.45 * (pirate.boat.x / pirate.dist), z: pirate.dist * 0.45 * (pirate.boat.z / pirate.dist), yaw: 0 }));
fps.push(await fpsAt("sea-edge", { x: world.deepR - 12, z: 0, yaw: Math.PI }));
fps.push(await fpsAt("pirate-point", { x: pirate.boat.x, z: pirate.boat.z, yaw: 0 }));
const worst = fps.slice().sort((a, b) => a.median - b.median)[0];
check("frames advance at every spot", fps.every((n) => n.runs.every((v) => v > 0)), fps.map((n) => `${n.label} median ${n.median.toFixed(1)}`).join("; "));

await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
async function shot(name, size, cam, look) {
  await page.setViewport({ width: size[0], height: size[1], deviceScaleFactor: 1 });
  await page.evaluate((cam, look) => {
    const intro = document.getElementById("intro");
    if (intro) {
      intro.classList.add("hidden");
      intro.style.display = "none";
    }
    for (const id of ["hud", "hint", "gear", "touch-toggle", "zoom", "shop-btn"]) {
      const n = document.getElementById(id);
      if (n) n.style.display = "none";
    }
    window.CaptainAdventure.photo(cam, look);
    window.CaptainAdventure.qc(8);
  }, cam, look);
  await new Promise((r) => setTimeout(r, 450));
  await page.screenshot({ path: path.join(outDir, name + ".png") });
}

const beforePirate = { cx: -185.39518329702713, cz: 114.68489878908082 };
const bang = Math.atan2(beforePirate.cz, beforePirate.cx);
const bdist = Math.hypot(beforePirate.cx, beforePirate.cz);
await shot("lagoon", [1280, 720], [40, 90, 95], [0, 2, 0]);
await shot("portrait", [390, 844], [40, 90, 95], [0, 2, 0]);
await shot("landscape-short", [844, 390], [40, 78, 88], [0, 2, 0]);
await shot("spacing", [1280, 720], [-149.31432737766434, 70, -13.462601522576392], [-101.96735081336493, 2, 63.07669433399445]);
await shot("channel-out", [1280, 720], [Math.cos(bang) * 120, 28, Math.sin(bang) * 120], [Math.cos(bang) * (bdist * 0.72), 2, Math.sin(bang) * (bdist * 0.72)]);
await shot(
  "pirate-same-camera",
  [1280, 720],
  [beforePirate.cx + Math.cos(bang) * 38, 22, beforePirate.cz + Math.sin(bang) * 38],
  [beforePirate.cx, 4, beforePirate.cz],
);
await page.close();

async function migrate(label, save, expectPos) {
  const p = await open(save);
  const got = await p.evaluate(() => {
    const s = window.CaptainAdventure.state();
    return { score: s.score, layoutVer: s.layoutVer, pos: s.pos || null, badges: s.badges, prizes: s.prizes, fuel: s.fuel, isles: s.v43 && s.v43.isles, stars: s.stars };
  });
  check(`${label} coins kept`, got.score === save.score, String(got.score));
  check(`${label} layoutVer 3`, got.layoutVer === 3, String(got.layoutVer));
  check(`${label} badges kept`, got.badges && got.badges.volcano === true);
  check(`${label} prize kept`, Array.isArray(got.prizes) && got.prizes.includes("yacht"));
  check(`${label} fuel kept`, got.fuel && Math.abs(got.fuel.motorboat - 0.5) < 1e-6, JSON.stringify(got.fuel));
  check(`${label} isle discovery kept`, got.isles && got.isles.pirate === 1);
  if (expectPos) {
    check(`${label} inner position kept`, got.pos && Math.abs(got.pos.x - expectPos.x) < 0.02 && Math.abs(got.pos.z - expectPos.z) < 0.02, JSON.stringify(got.pos));
  } else {
    check(`${label} outer position cleared`, got.pos == null, JSON.stringify(got.pos));
  }
  await p.close();
}

await migrate("outer save", {
  score: 77,
  streak: 4,
  badges: { volcano: true },
  prizes: ["yacht"],
  layoutVer: 2,
  pos: { x: -185.4, z: 114.68 },
  fuel: { motorboat: 0.5, yacht: 1 },
  v43: { isles: { pirate: 1 } },
}, null);

await migrate("inner save", {
  score: 88,
  badges: { volcano: true },
  prizes: ["yacht"],
  layoutVer: 2,
  pos: { x: 0, z: 8 },
  fuel: { motorboat: 0.5, yacht: 1 },
  v43: { isles: { pirate: 1 } },
}, { x: 0, z: 8 });

await browser.close();

const realErrors = errors.filter((e) => !/favicon/i.test(e));
check("no console errors", realErrors.length === 0, realErrors.slice(0, 4).join(" | "));

const summary = {
  passed: failures.filter((f) => f.ok).length,
  failed: failures.filter((f) => !f.ok).length,
  worstFps: worst,
  fps,
  deepR: world.deepR,
  fogFar: world.fogFar,
};
fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
if (summary.failed) process.exit(1);
