/**
 * Liberty Isle: pack validation, docking, five stations, one landmark, save migration.
 * Run: node tests/v51.mjs
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

const pack = JSON.parse(fs.readFileSync(path.join(root, "content/liberty-isle/history-pack.json"), "utf8"));
check("pack has 8 eras", pack.eras.length === 8, String(pack.eras.length));
check("pack has 76 events", pack.events.length === 76, String(pack.events.length));
check("pack has 27 people", pack.people.length === 27, String(pack.people.length));
check("pack has 50 states", pack.states.length === 50 && new Set(pack.states.map((s) => s.state)).size === 50, String(pack.states.length));
check("pack has 6 landmark stories", pack.landmarks.length === 6, String(pack.landmarks.length));
const mc = pack.questions.filter((q) => q.type === "mc");
const order = pack.questions.filter((q) => q.type === "order");
check("pack has 41 multiple-choice questions", mc.length === 41, String(mc.length));
check("pack has 8 order sets", order.length === 8 && order[0].id === "q41" && order[7].id === "q48", order.map((q) => q.id).join(","));
const early = pack.questions.filter((q) => q.year != null && q.year < 1500);
check("only Columbus 1492 is before 1500", early.length === 1 && early[0].id === "q00" && early[0].year === 1492, JSON.stringify(early.map((q) => [q.id, q.year])));
check("every multiple-choice item has a fact, four choices, and a valid answer", mc.every((q) => q.fact && q.choices.length === 4 && q.answerIndex >= 0 && q.answerIndex < 4 && q.explanation));
check("every order set has correctOrder for its events", order.every((q) => q.events.length >= 3 && q.correctOrder.length === q.events.length && q.correctOrder.every((n) => n >= 0 && n < q.events.length)));
const eraIds = new Set(pack.eras.map((e) => e.id));
check("every era has at least 3 multiple-choice questions", pack.eras.every((era) => mc.filter((q) => q.era === era.id).length >= 3));
check("questions name a known era", pack.questions.every((q) => eraIds.has(q.era)));
check("no event is dated before 1500", pack.events.every((e) => e.year >= 1500));

const server = http.createServer((req, res) => {
  const file = req.url.split("?")[0] === "/" ? "/index.html" : req.url.split("?")[0];
  const full = path.join(root, decodeURIComponent(file));
  if (!full.startsWith(root) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(full);
  const type = ext === ".js" ? "text/javascript" : ext === ".json" ? "application/json" : "text/html";
  res.writeHead(200, { "content-type": type });
  fs.createReadStream(full).pipe(res);
});
await new Promise((r) => server.listen(8802, "127.0.0.1", r));
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
await page.evaluateOnNewDocument(() => {
  if (sessionStorage.getItem("v51-seeded")) return;
  sessionStorage.setItem("v51-seeded", "1");
  localStorage.setItem("captain-adventure-save-v1", JSON.stringify({
    score: 77, layoutVer: 4, badges: { volcano: true }, prizes: ["yacht"],
    fuel: { motorboat: 0.5, yacht: 0.8 }, hat: "captain", streak: 4,
    v50: { ver: 1, skills: {}, due: [], passed: {}, ready: {} }
  }));
});
await page.goto("http://127.0.0.1:8802/index.html?quiet=1", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForFunction(() => window.CaptainLiberty && window.CaptainLiberty.ready, { timeout: 30000 });
await page.evaluate(() => document.getElementById("intro")?.classList.add("hidden"));
const booted = await page.evaluate(() => window.CaptainLiberty.ready.then(() => {
  const C = window.CaptainAdventure;
  const isle = C.isl.L.find((n) => n.id === "turtle");
  return {
    ready: true,
    version: window.__GAME_VERSION__,
    isle: isle && { id: isle.id, name: isle.I.name, R: isle.R },
    eras: C.liberty.ERAS.length,
    history: C.liberty.BANK.history.length,
    q00: C.liberty.BANK.history.find((q) => q.id === "q00"),
    alabama: C.liberty.BANK.states.find((s) => s.name === "Alabama").fact,
    score: C.state().score,
    v51: !!C.state().v51,
    coinsKept: C.state().score
  };
}));
check("pack loaded into the game", booted.ready && booted.eras === 8 && booted.history === 49, JSON.stringify({ eras: booted.eras, history: booted.history }));
check("q00 is the Columbus question", booted.q00 && booted.q00.year === 1492 && /Columbus/.test(booted.q00.fact), booted.q00 && booted.q00.fact);
check("state facts come from the pack", /Montgomery bus boycott/.test(booted.alabama), booted.alabama);
check("a 5.0 save keeps its 77 coins", booted.score === 77, String(booted.score));
check("version marker is 5.1", booted.version === "Captain Adventure 5.1: Liberty Isle", booted.version);
check("Liberty Isle exists with a dock", !!(booted.isle && booted.isle.name === "Liberty Isle" && booted.isle.R === 19), JSON.stringify(booted.isle));

const trip = await page.evaluate(() => {
  const C = window.CaptainAdventure;
  const isle = C.isl.L.find((n) => n.id === "turtle");
  C.boatAt(isle.boatSpot.x, isle.boatSpot.z, isle.yaw || 0);
  const boat = C.VEH.motorboat.obj.position;
  const can = C.isl.canLand(boat);
  C.isl.land("turtle");
  C.setScore(200);
  return { can: !!(can && can.id === "turtle"), mode: C.mode, x: C.captain.position.x, z: C.captain.position.z };
});
check("the boat can dock at Liberty Isle", trip.can, JSON.stringify(trip));

async function stand(id) {
  await page.evaluate((stationId) => {
    const C = window.CaptainAdventure;
    const spots = C.liberty.stations().filter((s) => s.id === stationId);
    const spot = spots[0];
    C.teleport(spot.x, spot.z);
    C.mode && C.captain.position.set(spot.x, C.isl.groundAt(spot.x, spot.z) || 0, spot.z);
  }, id);
  await page.keyboard.press("e");
  await page.waitForFunction(() => {
    const layer = document.getElementById("liberty-layer");
    return layer && layer.classList.contains("show");
  }, { timeout: 5000 });
}

async function playSet() {
  const steps = [];
  for (let guard = 0; guard < 12; guard++) {
    const view = await page.evaluate(() => {
      const s = window.CaptainLiberty.session();
      if (!s) return { done: true };
      return { phase: s.phase, i: s.i, type: s.qs[s.i] && s.qs[s.i].type, answer: s.qs[s.i] && s.qs[s.i].answer, order: s.qs[s.i] && s.qs[s.i].correctOrder, picked: s.order && s.order.length, n: s.qs.length };
    });
    if (view.done || view.phase == null) break;
    if (view.phase === "ask") {
      if (view.type === "order") {
        const next = view.order[view.picked || 0];
        await page.click(`#liberty-card button[data-i="${next}"]`);
      } else {
        await page.click(`#liberty-card button[data-i="${view.answer}"]`);
      }
    } else if (view.phase === "fact" || view.phase === "tutor" || view.phase === "practice-retry") {
      await page.click("#liberty-next");
    } else if (view.phase === "practice") {
      await page.click("#liberty-card button[data-i=\"0\"]");
    } else break;
    steps.push(view.phase);
    await new Promise((r) => setTimeout(r, 40));
  }
  return steps;
}

const stations = ["map", "tunnel", "rally", "quiz"];
const played = {};
for (const id of stations) {
  if (id === "quiz") {
    await stand("quiz");
    await page.click("#liberty-spin");
    await page.waitForFunction(() => {
      const s = window.CaptainLiberty.session();
      return s && s.qs && s.qs.length >= 3;
    });
  } else await stand(id);
  const before = await page.evaluate(() => window.CaptainAdventure.state().score);
  const steps = await playSet();
  const after = await page.evaluate(() => {
    const s = window.CaptainLiberty.session();
    return { score: window.CaptainAdventure.state().score, phase: s && s.phase, steps: s && s.qs && s.qs.length };
  });
  played[id] = { before, after: after.score, gain: after.score - before, phase: after.phase, steps: steps.length };
  check(`${id} set is 3 questions and pays 30 on a perfect first try`, played[id].gain === 30 && after.steps === 3, JSON.stringify(played[id]));
  await page.evaluate(() => window.CaptainLiberty.close());
}

await stand("builder");
const built = await page.evaluate(() => {
  const before = window.CaptainAdventure.state().score;
  const opened = window.CaptainLiberty.build("bell");
  return { before, opened };
});
const gate = await playSet();
const bill = await page.evaluate(() => {
  const s = window.CaptainAdventure.state();
  return { score: s.score, owned: !!(s.v51 && s.v51.landmarks && s.v51.landmarks.bell), story: document.getElementById("liberty-fact") && document.getElementById("liberty-fact").textContent };
});
check("Liberty Bell charges 25 and refunds 1 after a perfect gate", built.before - bill.score === 24 && bill.owned, JSON.stringify({ before: built.before, after: bill.score, owned: bill.owned, gate: gate.length }));
check("the bell story card is on screen", /Independence Hall|LIBERTY/.test(bill.story || ""), bill.story);

const saved = await page.evaluate(() => {
  window.CaptainAdventure.save();
  return JSON.parse(localStorage.getItem("captain-adventure-save-v1"));
});
check("save keeps coins, the yacht, and v51", saved.score === bill.score && saved.prizes.includes("yacht") && saved.v51 && saved.v51.ver === 1 && saved.v51.landmarks.bell === 1, JSON.stringify({ score: saved.score, v51: saved.v51 && saved.v51.ver, bell: saved.v51 && saved.v51.landmarks.bell }));

await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.CaptainLiberty && window.CaptainLiberty.ready, { timeout: 30000 });
await page.evaluate(() => window.CaptainLiberty.ready);
const reloaded = await page.evaluate(() => {
  const s = window.CaptainAdventure.state();
  const mesh = window.CaptainAdventure.scene.getObjectByName("v51-root");
  let bell = false;
  mesh && mesh.traverse((o) => { if (o.userData && o.visible && o.parent && o.parent.visible !== false) bell = true; });
  return { score: s.score, bell: s.v51.landmarks.bell, placed: s.v51.placed.length, yacht: s.prizes.includes("yacht"), fuel: s.fuel.motorboat };
});
check("reload keeps the bell, the coins, and the yacht", reloaded.score === saved.score && reloaded.bell === 1 && reloaded.yacht && reloaded.placed === 3, JSON.stringify(reloaded));
check("fuel rules were not rewritten", reloaded.fuel === 0.5, String(reloaded.fuel));
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
