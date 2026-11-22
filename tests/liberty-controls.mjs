/**
 * Walk controls follow the camera: W and joystick-up move away from the camera,
 * Z and joystick-down toward it, A/left and S/right strafe. Liberty Isle used a
 * radial walk camera while movement stayed on world axes, so the keys felt backwards.
 * Run: node tests/liberty-controls.mjs
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
  failures.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
}

const server = http.createServer((req, res) => {
  const file = req.url.split("?")[0] === "/" ? "/index.html" : req.url.split("?")[0];
  const full = path.join(root, decodeURIComponent(file));
  if (!full.startsWith(root) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
    res.writeHead(404); res.end("no"); return;
  }
  const ext = path.extname(full);
  const type = ext === ".js" ? "text/javascript" : ext === ".json" ? "application/json" : "text/html";
  res.writeHead(200, { "content-type": type });
  fs.createReadStream(full).pipe(res);
});
await new Promise((r) => server.listen(8816, "127.0.0.1", r));
const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--no-sandbox", "--disable-dev-shm-usage"]
});
const errors = [];
const page = await browser.newPage();
page.on("pageerror", (err) => errors.push(String(err.message || err)));
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
await page.setViewport({ width: 1100, height: 700 });
await page.goto("http://127.0.0.1:8816/index.html?quiet=1&debug=nogate,nofuel", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForFunction(() => window.CaptainAdventure && window.CaptainLiberty && window.CaptainLiberty.ready, { timeout: 30000 });
await page.evaluate(() => window.CaptainLiberty.ready);
await page.evaluate(() => {
  const intro = document.getElementById("intro");
  if (intro) intro.classList.add("hidden");
  document.body.classList.add("touch");
});

const places = await page.evaluate(() => {
  const C = window.CaptainAdventure;
  const spots = [{ name: "home", x: 0, z: 8 }];
  const isles = (C.isl && C.isl.L) || [];
  for (const id of ["turtle", "pirate", "parrot"]) {
    const isle = isles.find((n) => n.id === id);
    if (!isle) continue;
    const land = isle.landSpot || { x: isle.cx, z: isle.cz };
    const ix = isle.cx - land.x;
    const iz = isle.cz - land.z;
    const len = Math.hypot(ix, iz) || 1;
    spots.push({ name: id, x: land.x + ix / len * 4, z: land.z + iz / len * 4 });
  }
  const host = C.liberty.host();
  spots.push({ name: "liberty", x: host.land.x, z: host.land.z });
  C.setScore(400);
  C.lair.commit("hq");
  C.lair.enter();
  const inside = C.lair.inside();
  const cap = C.captain.position;
  if (inside) {
    C.lair.place(0, 1.2);
    const mid = C.captain.position;
    spots.push({ name: "lair", x: mid.x, z: mid.z });
  }
  C.lair.leave();
  return { spots, inside };
});
check("the lair can be entered for the control check", places.inside === true, JSON.stringify(places.inside));

function expectOf(input) {
  if (input === "forward") return { along: 1, side: 0 };
  if (input === "back") return { along: -1, side: 0 };
  if (input === "left") return { along: 0, side: -1 };
  if (input === "right") return { along: 0, side: 1 };
  return null;
}

async function stand(spot) {
  await page.evaluate((p) => {
    const C = window.CaptainAdventure;
    if (p.name === "lair") {
      C.lair.enter();
      // Open floor. (-7, 1) is a step from the west wall, so a real stride
      // slides along it, and a longer right step crosses into the corner
      // where the lair camera swaps and the walk direction bends.
      C.lair.place(-3.6, 0.2);
    } else if (C.lair.inside()) {
      C.lair.leave();
    }
    C.mode = "walk";
    if (p.name !== "lair") C.teleport(p.x, p.z);
    const cap = C.captain.position;
    if (p.name !== "liberty" && p.name !== "lair") {
      C.camera.position.set(cap.x, cap.y + 9, cap.z + 12.5);
      C.camera.lookAt(cap.x, cap.y + 1.6, cap.z);
      if (C.snapCam) C.snapCam();
    }
    if (C.captain) C.captain.visible = true;
  }, spot);
  await page.waitForFunction((name) => {
    const C = window.CaptainAdventure;
    const cam = C.camera;
    const cap = C.captain.position;
    cam.updateMatrixWorld(true);
    const dx = cam.position.x - cap.x;
    const dz = cam.position.z - cap.z;
    const dist = Math.hypot(dx, dz);
    if (name === "lair") return dist > 3 && Math.hypot(dx, dz - 12.5) > 4;
    if (name === "liberty") return dist > 6;
    return Math.hypot(dx, dz - 12.5) < 2.5;
  }, { timeout: 4000 }, spot.name);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

async function readMove() {
  return page.evaluate(() => {
    const C = window.CaptainAdventure;
    const cam = C.camera;
    const cap = C.captain.position;
    cam.updateMatrixWorld(true);
    const e = cam.matrixWorld.elements;
    let fx = -e[8];
    let fz = -e[10];
    const fl = Math.hypot(fx, fz) || 1;
    fx /= fl; fz /= fl;
    const faceX = Math.sin(C.captain.rotation.y);
    const faceZ = Math.cos(C.captain.rotation.y);
    const bx = cam.position.x - cap.x;
    const bz = cam.position.z - cap.z;
    const bl = Math.hypot(bx, bz) || 1;
    return {
      x: cap.x, z: cap.z, fx, fz, rx: -fz, rz: fx,
      faceX, faceZ,
      behind: (faceX * bx + faceZ * bz) / bl
    };
  });
}

async function frames(count) {
  await page.evaluate((n) => new Promise((resolve) => {
    let left = n;
    function step() {
      left -= 1;
      if (left <= 0) resolve();
      else requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }), count);
}

async function pumpUntilMoved() {
  await page.evaluate(() => new Promise((resolve) => {
    const C = window.CaptainAdventure;
    const x0 = C.captain.position.x;
    const z0 = C.captain.position.z;
    let n = 0;
    const t0 = performance.now();
    function step() {
      n += 1;
      const dist = Math.hypot(C.captain.position.x - x0, C.captain.position.z - z0);
      // Score a short stride, then let go. Wall-clock holds miss frames when
      // the other suites load the machine. A long hold inside the lair hits
      // the room wall or the camera-corner circle and the path bends.
      if ((dist > 1.15 && n >= 2) || n >= 40 || performance.now() - t0 > 4000) resolve();
      else requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }));
}

async function holdKey(code) {
  await page.keyboard.down(code);
  await pumpUntilMoved();
  await page.keyboard.up(code);
  await frames(2);
}

async function holdStick(dir) {
  await page.evaluate((which) => {
    const joy = document.getElementById("joy");
    const rect = joy.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const reach = rect.width * 0.35;
    const off = { up: [0, -reach], down: [0, reach], left: [-reach, 0], right: [reach, 0] }[which];
    const down = new PointerEvent("pointerdown", { bubbles: true, pointerId: 7, clientX: cx, clientY: cy });
    const move = new PointerEvent("pointermove", { bubbles: true, pointerId: 7, clientX: cx + off[0], clientY: cy + off[1] });
    joy.dispatchEvent(down);
    joy.dispatchEvent(move);
  }, dir);
  await pumpUntilMoved();
  await page.evaluate(() => {
    const joy = document.getElementById("joy");
    joy.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 7, clientX: 0, clientY: 0 }));
  });
  await frames(2);
}

function scoreMove(before, after, want) {
  const dx = after.x - before.x;
  const dz = after.z - before.z;
  const along = dx * before.fx + dz * before.fz;
  const side = dx * before.rx + dz * before.rz;
  const dist = Math.hypot(dx, dz);
  const aim = along * want.along + side * want.side;
  const good = dist > 0.3 && aim > dist * 0.62;
  return { good, along, side, dist, behind: after.behind };
}

const keys = [
  ["forward", "KeyW"],
  ["back", "KeyZ"],
  ["left", "KeyA"],
  ["right", "KeyS"],
  ["forward", "ArrowUp"],
  ["back", "ArrowDown"],
  ["left", "ArrowLeft"],
  ["right", "ArrowRight"]
];
const sticks = [
  ["forward", "up"],
  ["back", "down"],
  ["left", "left"],
  ["right", "right"]
];

async function attemptKey(spot, code) {
  await stand(spot);
  let before = await readMove();
  await holdKey(code);
  let after = await readMove();
  const scored = scoreMove(before, after, expectOf(codeToName(code)));
  return { before, after, scored };
}

function codeToName(code) {
  if (code === "KeyW" || code === "ArrowUp") return "forward";
  if (code === "KeyZ" || code === "ArrowDown") return "back";
  if (code === "KeyA" || code === "ArrowLeft") return "left";
  return "right";
}

for (const spot of places.spots) {
  for (const [name, code] of keys) {
    const { after, scored } = await attemptKey(spot, code);
    check(`${spot.name} ${code} moves ${name} on screen`, scored.good, JSON.stringify(scored));
    if (name === "forward" && (code === "KeyW" || code === "ArrowUp")) {
      check(`${spot.name} camera sits behind Captain after ${code}`, after.behind < -0.45, JSON.stringify({ behind: after.behind, face: [after.faceX, after.faceZ] }));
    }
  }
  for (const [name, dir] of sticks) {
    await stand(spot);
    const before = await readMove();
    await holdStick(dir);
    const after = await readMove();
    const scored = scoreMove(before, after, expectOf(name));
    check(`${spot.name} joystick ${dir} moves ${name} on screen`, scored.good, JSON.stringify(scored));
  }
}

check("no page errors", errors.length === 0, errors.slice(0, 3).join(" | "));
if (failures.some((row) => !row.ok)) {
  console.log(JSON.stringify({ passed: failures.filter((r) => r.ok).length, failed: failures.filter((r) => !r.ok).length }, null, 2));
  await browser.close();
  server.close();
  process.exit(1);
}
console.log(JSON.stringify({ passed: failures.length, failed: 0 }, null, 2));
await browser.close();
server.close();
