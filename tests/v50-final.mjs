/**
 * Final play-through for Captain Adventure 5.0.
 * Run: node tests/v50-final.mjs
 */
import { createRequire } from "module";
import http from "http";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const puppeteer = require("/tmp/cap-tools/node_modules/puppeteer-core");
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const findings = [];
function note(area, status, detail) {
  findings.push({ area, status, detail });
  console.log(`${status.toUpperCase()} ${area}${detail ? " — " + detail : ""}`);
}

const server = http.createServer((req, res) => {
  const file = req.url.split("?")[0] === "/" ? "/index.html" : req.url.split("?")[0];
  const full = path.join(root, decodeURIComponent(file));
  if (!full.startsWith(root) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, { "content-type": path.extname(full) === ".js" ? "text/javascript" : "text/html" });
  fs.createReadStream(full).pipe(res);
});
await new Promise((r) => server.listen(8796, "127.0.0.1", r));
const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--no-sandbox", "--disable-dev-shm-usage"]
});
const errors = [];
const page = await browser.newPage();
page.on("pageerror", (e) => errors.push(String(e.message || e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

async function shot(name) {
  await page.screenshot({ path: path.join(out, name) });
}
async function go(url) {
  await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForFunction(() => window.CaptainAdventure && window.CaptainAdventure.learn, { timeout: 30000 });
  await page.evaluate(() => document.getElementById("intro")?.classList.add("hidden"));
}

await page.setViewport({ width: 1280, height: 800 });
await page.evaluateOnNewDocument(() => localStorage.removeItem("captain-adventure-save-v1"));
await go("http://127.0.0.1:8796/index.html?quiet=1");

const bank = await page.evaluate(() => {
  const raw = JSON.parse(document.getElementById("question-bank").textContent);
  const rows = [];
  for (const loc of raw.locations || []) {
    rows.push({ id: loc.id + " questions", n: (loc.questions || []).length });
    for (const reading of loc.readings || []) rows.push({ id: loc.id + " / " + reading.id, n: (reading.questions || []).length });
  }
  return rows;
});
const short = bank.filter((r) => r.n < 3);
note("question sets", short.length ? "open" : "fixed", short.length ? JSON.stringify(short) : bank.map((r) => r.id + ":" + r.n).join(", "));

const prices = await page.evaluate(() => {
  const html = document.documentElement.innerHTML;
  const tank = /FULL_TANK_COINS:(\d+)/.exec(html);
  const big = /J_=\{baseball:(\d+),tecmo:(\d+)\}/.exec(html);
  const other = /Z_=(\d+)/.exec(html);
  const gate = /var Of=(\d+)/.exec(html);
  return { tank: tank && tank[1], baseball: big && big[1], tecmo: big && big[2], other: other && other[1], gate: gate && gate[1] };
});
note("prices", prices.tank === "20" && prices.baseball === "30" && prices.tecmo === "30" && prices.other === "10" && prices.gate === "20" ? "fixed" : "open", JSON.stringify(prices));

await page.evaluate(() => window.CaptainAdventure.setScore(400));
for (const id of ["nav", "market", "blueprint", "code", "log"]) {
  const info = await page.evaluate((name) => {
    const L = window.CaptainAdventure.learn;
    const act = L.activity(name);
    L.play(name);
    const ready = document.getElementById("learn-ready");
    if (ready) ready.click();
    const choices = document.querySelectorAll("[data-choice]").length;
    const exit = !!document.getElementById("learn-exit");
    document.getElementById("learn-exit").click();
    return { total: act.total, choices, exit };
  }, id);
  note("activity " + id, info.total >= 3 && info.choices === 4 && info.exit ? "fixed" : "open", JSON.stringify(info));
}

await page.evaluate(() => window.CaptainAdventure.learn.openLore("lighthouse"));
const lore = await page.evaluate(() => {
  const ready = !!document.getElementById("learn-ready");
  document.getElementById("learn-exit").click();
  return ready;
});
note("lighthouse lore", lore ? "fixed" : "open", lore ? "passage then questions" : "missing ready");

await page.evaluate(() => { window.CaptainAdventure.learn.setDate("2026-11-04"); window.CaptainAdventure.learn.startDaily(); });
const daily = await page.evaluate(() => {
  const n = document.body.innerText.includes("Question 1 of 3");
  document.getElementById("learn-exit").click();
  return n;
});
note("daily three", daily ? "fixed" : "open", "");

for (const id of ["hq", "pool", "tower"]) {
  if (id !== "hq") await page.evaluate(() => window.CaptainAdventure.lair.commit("hq"));
  const gate = await page.evaluate((build) => {
    const L = window.CaptainAdventure.learn;
    const res = L.openGate(build);
    const themes = new Set((L.gateQuestions(build) || []).map((q) => q.theme));
    const exit = !!document.getElementById("learn-exit");
    document.getElementById("learn-exit")?.click();
    return { ok: !!(res && res.ok), n: res && res.total, themes: [...themes], exit };
  }, id);
  note("gate " + id, gate.ok && gate.n >= 3 && gate.n <= 5 && gate.themes.length === 1 && gate.exit ? "fixed" : "open", JSON.stringify(gate));
}

const tutor = await page.evaluate(() => {
  const L = window.CaptainAdventure.learn;
  L.openGate("garage");
  const q = L.gate.current();
  if (!q) return { gentle: false, open: false, taught: false, reason: "no question" };
  const wrong = q.answer === 0 ? 1 : 0;
  const res = L.answer(wrong);
  const open = !!document.getElementById("learn-layer")?.classList.contains("show");
  const text = document.getElementById("learn-card")?.innerText || "";
  document.getElementById("learn-exit")?.click();
  return { gentle: !!(res && res.gentle), open, taught: /learn|step|multiply|add|divide|area|perimeter|plank/i.test(text) };
});
note("wrong-answer tutorial", tutor.gentle && tutor.open ? "fixed" : "open", JSON.stringify(tutor));

await page.evaluate(() => window.CaptainAdventure.learn.hold(3000));
const progress = await page.evaluate(() => {
  const text = document.getElementById("learn-card")?.innerText || "";
  const ok = /Progress/.test(text) && /Weakest/.test(text);
  document.getElementById("learn-exit")?.click();
  return ok;
});
note("progress card", progress ? "fixed" : "open", "");

const shop = await page.evaluate(() => {
  const btn = document.getElementById("shop-btn");
  if (btn) btn.click();
  const panel = document.getElementById("shop");
  const open = !!(panel && !panel.classList.contains("hidden"));
  const tabs = panel ? panel.innerText.slice(0, 180) : "";
  return { open, tabs };
});
note("shop and wardrobe", shop.open ? "fixed" : "open", shop.tabs.replace(/\s+/g, " ").slice(0, 120));
if (shop.open) await shot("gfx-10-shop.png");
await page.evaluate(() => {
  const panel = document.getElementById("shop");
  const close = panel && panel.querySelector("button");
  if (close) close.click();
});

const islands = await page.evaluate(() => (window.CaptainAdventure.isl.L || []).map((i) => ({ id: i.id, x: i.cx, z: i.cz })));
const shots = {
  home: "gfx-01-home.png",
  volcano: "gfx-02-volcano.png",
  minefield: "gfx-03-minefield.png",
  laser: "gfx-04-laser.png",
  baseball: "gfx-05-baseball.png",
  football: "gfx-06-football.png",
  tennis: "gfx-07-tennis.png",
  sailboat: "gfx-08-sailboat.png",
  powerboat: "gfx-09-powerboat.png"
};
for (const isle of islands) {
  await page.evaluate((spot) => {
    const C = window.CaptainAdventure;
    C.teleport(spot.x, spot.z);
    C.photo([spot.x + 16, 11, spot.z + 16], [spot.x, 2, spot.z]);
    C.qc(3);
  }, isle);
  if (shots[isle.id]) await shot(shots[isle.id]);
  note("visit " + isle.id, "fixed", "teleported");
}

await page.evaluate(() => {
  const C = window.CaptainAdventure;
  C.teleport(0, 2);
  C.photo([3.2, 1.7, 5.5], [0, 1.1, 2]);
  C.qc(3);
});
await shot("gfx-11-captain.png");

await page.evaluate(() => {
  const C = window.CaptainAdventure;
  C.photo([90, 10, 70], [40, 0, 20]);
  C.qc(3);
});
await shot("gfx-12-ocean.png");

await page.evaluate(() => {
  const C = window.CaptainAdventure;
  C.teleport(2, 6);
  C.photo([14, 8, -2], [10.9, 4, -10.2]);
  C.qc(3);
});
await shot("gfx-13-lighthouse.png");

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
async function poll(fn, ms = 3000) {
  const start = Date.now();
  let last = null;
  while (Date.now() - start < ms) {
    last = await page.evaluate(fn);
    if (last && last.done) return last;
    await sleep(40);
  }
  return Object.assign({ done: false, timedOut: true }, last || {});
}
const mgIds = ["football", "tecmo", "baseball", "tennis", "fishing", "powerboat", "sailboat", "laser", "lava"];
const unlocks = await page.evaluate((ids) => {
  const C = window.CaptainAdventure;
  const mg = C.v3 && C.v3.mg;
  if (!mg) return { missing: true };
  const at = {};
  ids.forEach((id) => { at[id] = mg.unlockAt(id); });
  C.setScore(0);
  const lockedAtZero = { laser: mg.unlocked("laser"), lava: mg.unlocked("lava"), fishing: mg.unlocked("fishing") };
  C.setScore(900);
  return { at, lockedAtZero, ids: mg.ids.slice(), scoreNow: C.state().score, hooked: !!(C.renderer && C.renderer.__v50hook) };
}, mgIds);
const rulesOk = !unlocks.missing && unlocks.hooked
  && unlocks.at.laser === 350 && unlocks.at.lava === 400 && unlocks.at.fishing === 0
  && unlocks.lockedAtZero.laser === false && unlocks.lockedAtZero.lava === false && unlocks.lockedAtZero.fishing === true
  && mgIds.every((id) => unlocks.ids.includes(id));
note("mini-game unlock rules", rulesOk ? "fixed" : "open", JSON.stringify(unlocks));

const mgTable = [];
for (const id of mgIds) {
  const row = { id, opens: false, playable: false, worldHidden: false, restored: false };
  const opened = await page.evaluate((name) => {
    const C = window.CaptainAdventure;
    const frames = C.renderer.info.render.frame;
    let api = false;
    let error = "";
    try { api = C.openMG(name) !== false; } catch (err) { error = String(err && err.message || err); }
    const mg = document.getElementById("mg");
    const hud = document.getElementById("hud");
    const scene = document.getElementById("scene");
    const panel = !!(mg && !mg.classList.contains("hidden") && (mg.querySelector(".mg-card:not(.hidden)") || mg.querySelector("canvas")));
    return {
      api, error, panel,
      phase: C.v3.mg.phase,
      title: (mg && mg.querySelector(".mg-title") && mg.querySelector(".mg-title").textContent) || "",
      immediate: document.body.classList.contains("mg-on"),
      hudHidden: !hud || getComputedStyle(hud).visibility === "hidden",
      sceneHidden: !scene || getComputedStyle(scene).visibility === "hidden",
      frames
    };
  }, id);
  row.opens = !!(opened.api && opened.panel);
  row.worldHidden = !!(opened.immediate && opened.hudHidden && opened.sceneHidden);
  if (opened.phase === "choose") {
    await page.evaluate((name) => {
      const btn = document.querySelector('#mg .opts button[data-id="' + name + '"]');
      if (btn) btn.click();
    }, id);
  }
  await page.evaluate(() => document.querySelector("#mg .mg-start")?.click());
  for (let step = 0; step < 8; step++) {
    const phase = await page.evaluate(() => {
      const mg = window.CaptainAdventure.v3.mg;
      if (mg.phase === "gate") {
        mg.gateAnswer(true);
        const go = document.querySelector("#mg .mg-go");
        const next = document.querySelector("#mg .mg-next");
        if (go) go.click();
        else if (next) next.click();
      } else if (mg.phase === "card") {
        document.querySelector("#mg .mg-start")?.click();
      }
      return mg.phase;
    });
    if (phase === "count" || phase === "play" || phase === "end") break;
    await sleep(80);
  }
  const playing = await poll(() => {
    const phase = window.CaptainAdventure.v3.mg.phase;
    return { done: phase === "play" || phase === "end", phase };
  }, 6000);
  if (playing.phase === "play") {
    await page.evaluate(() => {
      const mg = window.CaptainAdventure.v3.mg;
      mg.debugPress("action");
      mg.debugSetTime(0.05);
    });
  }
  const ended = await poll(() => {
    const mg = window.CaptainAdventure.v3.mg;
    const card = document.querySelector("#mg .mg-card");
    const text = card ? card.innerText : "";
    const done = mg.phase === "end" && /Score/.test(text) && !!document.querySelector("#mg .mg-back");
    return { done, phase: mg.phase, text: text.slice(0, 140) };
  }, 4000);
  row.playable = !!ended.done;
  const quiet = await page.evaluate(() => {
    const frame = window.CaptainAdventure.renderer.info.render.frame;
    return frame;
  });
  await sleep(280);
  const still = await page.evaluate((start) => {
    const C = window.CaptainAdventure;
    const hud = document.getElementById("hud");
    const scene = document.getElementById("scene");
    return {
      frames: C.renderer.info.render.frame - start,
      mgOn: document.body.classList.contains("mg-on"),
      hudHidden: !hud || getComputedStyle(hud).visibility === "hidden",
      sceneHidden: !scene || getComputedStyle(scene).visibility === "hidden"
    };
  }, quiet);
  row.worldHidden = row.worldHidden && still.frames === 0 && still.mgOn && still.hudHidden && still.sceneHidden;
  if (id === "baseball" && row.opens) await shot("gfx-14-baseball-mg.png");
  if (id === "laser" && row.opens) await shot("gfx-15-laser-mg.png");
  await page.evaluate(() => {
    const back = document.querySelector("#mg .mg-back");
    if (back) back.click();
    else document.querySelector("#mg .mg-x")?.click();
  });
  const back = await poll(() => {
    const mg = document.getElementById("mg");
    const hud = document.getElementById("hud");
    const scene = document.getElementById("scene");
    const hidden = !mg || mg.classList.contains("hidden");
    const world = !document.body.classList.contains("mg-on");
    const hudShown = !!hud && getComputedStyle(hud).visibility !== "hidden";
    const sceneShown = !!scene && getComputedStyle(scene).visibility !== "hidden";
    const frames = window.CaptainAdventure.renderer.info.render.frame;
    return { done: hidden && world && hudShown && sceneShown, hidden, world, hudShown, sceneShown, frames };
  }, 3000);
  let resumed = back.frames;
  if (back.done) {
    await sleep(250);
    resumed = await page.evaluate((start) => window.CaptainAdventure.renderer.info.render.frame - start, back.frames);
  }
  row.restored = !!(back.done && resumed > 0);
  row.detail = { phase: ended.phase || playing.phase || opened.phase, framesWhileOpen: still.frames, resumed, error: opened.error || "" };
  mgTable.push(row);
  const ok = row.opens && row.playable && row.worldHidden && row.restored;
  note("mini-game " + id, ok ? "fixed" : "open", JSON.stringify(row));
}
fs.writeFileSync(path.join(out, "mg-table.json"), JSON.stringify(mgTable, null, 2));
const allMg = mgTable.length === mgIds.length && mgTable.every((row) => row.opens && row.playable && row.worldHidden && row.restored);
note("every mini-game hides the world and restores it", allMg ? "fixed" : "open", mgTable.map((row) => row.id + ":" + (row.opens && row.playable && row.worldHidden && row.restored ? "ok" : "no")).join(", "));

for (const id of ["minefield", "volcano"]) {
  const station = await page.evaluate((name) => {
    const C = window.CaptainAdventure;
    C.openPanel(name);
    const panel = document.getElementById("panel");
    const body = document.getElementById("panel-body");
    const open = !!(panel && !panel.classList.contains("hidden"));
    const text = body ? body.innerText : "";
    const question = /Question \d+ of \d+/.test(text) && text.length > 40;
    document.getElementById("close")?.click();
    const closed = !document.getElementById("panel") || document.getElementById("panel").classList.contains("hidden");
    return { open, question, closed, sample: text.slice(0, 120) };
  }, id);
  note("station " + id, station.open && station.question && station.closed ? "fixed" : "open", JSON.stringify(station));
}

const esc = await page.evaluate(() => {
  const before = document.body.classList.contains("mg-on");
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  const pause = !!document.getElementById("mg-pause");
  return { exploring: !before, pauseWhileExploring: pause };
});
note("escape pauses only during play", !esc.pauseWhileExploring ? "fixed" : "open", JSON.stringify(esc));

await page.setViewport({ width: 390, height: 844 });
const phone = await page.evaluate(() => {
  const C = window.CaptainAdventure;
  C.teleport(0, 4);
  C.photo([18, 10, 16], [0, 1, 2]);
  C.qc(2);
  const chips = [...document.querySelectorAll("#hud .chip, #hud .hud-row > *")].slice(0, 8).map((el) => {
    const b = el.getBoundingClientRect();
    return { right: Math.round(b.right), bottom: Math.round(b.bottom), w: Math.round(b.width) };
  });
  return { chips, view: 390 };
});
const clipped = phone.chips.some((c) => c.right > 390 || c.w <= 0);
note("phone HUD", clipped ? "open" : "fixed", JSON.stringify(phone.chips));
await shot("gfx-16-phone.png");
await page.setViewport({ width: 1280, height: 800 });

const fps = await page.evaluate(() => new Promise((resolve) => {
  const C = window.CaptainAdventure;
  C.teleport(0, 4);
  C.photo([28, 14, 22], [0, 1, 2]);
  const info = C.renderer && C.renderer.info && C.renderer.info.render;
  const start = info ? info.frame : 0;
  const t0 = performance.now();
  setTimeout(() => resolve({ frames: info ? info.frame - start : 0, ms: performance.now() - t0 }), 1200);
}));
const rate = fps.ms ? Math.round(fps.frames * 1000 / fps.ms) : 0;
note("frame rate", rate >= 15 ? "fixed" : "open", rate + " fps on the VM software renderer");

await page.setViewport({ width: 1280, height: 800 });
await page.evaluate(() => {
  const C = window.CaptainAdventure;
  C.learn.setDate("2026-12-15");
  C.photo([42, 16, 30], [0, 1, 4]);
  C.qc(4);
});
await shot("winter-desktop.png");
await page.setViewport({ width: 390, height: 844 });
await page.evaluate(() => window.CaptainAdventure.qc(3));
await shot("winter-phone.png");
await page.setViewport({ width: 1280, height: 800 });
await page.evaluate(() => {
  const C = window.CaptainAdventure;
  C.photo([-6, 6.5, -1], [-9, 3.4, -9]);
  C.qc(3);
});
await shot("winter-roofs-desktop.png");

await page.evaluate(() => {
  const C = window.CaptainAdventure;
  C.learn.setDate("2026-11-17");
  C.setScore(800);
  for (const d of C.lair.DEFS) C.lair.commit(d.id);
  C.lair.leave();
  const door = C.scene.getObjectByName("lair-door");
  const water = C.scene.getObjectByName("lair-water");
  door.updateWorldMatrix(true, false);
  water.updateWorldMatrix(true, false);
  const e = door.matrixWorld.elements;
  const w = water.matrixWorld.elements;
  const x = e[12], y = e[13], z = e[14];
  const xx = e[0], xz = e[2], zx = e[8], zz = e[10];
  C.photo([x + zx * 18 - xx * 2.5, y + 8.5, z + zz * 18 - xz * 2.5], [(x + w[12]) / 2, 1.6, (z + w[14]) / 2]);
  C.qc(4);
});
await shot("after-lair-door-desktop.png");
await page.setViewport({ width: 390, height: 844 });
await page.evaluate(() => window.CaptainAdventure.qc(3));
await shot("after-lair-door-phone.png");
await page.evaluate(() => {
  const C = window.CaptainAdventure;
  const L = C.lair;
  const cam = L.world(-6, 24, 0);
  const look = L.world(2, -1, 2);
  C.photo([cam.x, 14, cam.z], [look.x, 3, look.z]);
  C.qc(3);
});
await shot("gfx-17-lair.png");

const savePage = await browser.newPage();
await savePage.evaluateOnNewDocument(() => {
  localStorage.setItem("captain-adventure-save-v1", JSON.stringify({
    score: 77, streak: 4, badges: { volcano: true }, prizes: ["yacht"], hat: "captain",
    fuel: { yacht: 0.5 }, layoutVer: 4, v45: { owned: { hq: 1, pool: 1 }, parked: 0 },
    shop: { equip: { hat: "captain" } }, pos: { x: 3, z: 4 }, ver: 3
  }));
});
await savePage.goto("http://127.0.0.1:8796/index.html?quiet=1", { waitUntil: "networkidle0", timeout: 60000 });
await savePage.waitForFunction(() => window.CaptainAdventure && window.CaptainAdventure.learn);
const migrated = await savePage.evaluate(() => {
  const s = window.CaptainAdventure.state();
  return { score: s.score, yacht: (s.prizes || []).includes("yacht"), hq: s.v45 && s.v45.owned && s.v45.owned.hq, v50: !!s.v50 };
});
note("save migration", migrated.score === 77 && migrated.yacht && migrated.hq === 1 && migrated.v50 ? "fixed" : "open", JSON.stringify(migrated));
await savePage.close();

note("console", errors.filter((e) => !/favicon|Failed to load resource/i.test(e)).length === 0 ? "fixed" : "open", errors.slice(0, 3).join(" | "));
fs.writeFileSync(path.join(out, "final-qc.json"), JSON.stringify({ findings, fps: rate, errors: errors.slice(0, 8) }, null, 2));
await browser.close();
server.close();
if (findings.some((f) => f.status === "open")) process.exitCode = 1;
