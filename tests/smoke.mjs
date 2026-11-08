/**
 * Interactive regression for systems this branch must not break.
 * Drives the real panels: math-gate buttons, fuel choices, boarding,
 * throttle drain, tow, and mini-game ticket buttons.
 * Run: node tests/smoke.mjs
 */
import { createRequire } from "module";
import fs from "fs";
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
await page.goto("http://127.0.0.1:8765/index.html", { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForFunction(() => window.CaptainAdventure && window.CaptainAdventure.fuel && window.CaptainAdventure.lair, { timeout: 30000 });
await page.evaluate(() => document.getElementById("intro").classList.add("hidden"));

const setup = await page.evaluate(() => {
  const C = window.CaptainAdventure;
  const s = C.state();
  s.badges = Object.assign({}, s.badges, { volcano: true });
  s.prizes = Array.from(new Set([].concat(s.prizes || [], ["yacht"])));
  s.isles = Object.assign({}, s.isles, { turtle: 1, pirate: 1 });
  s.hat = "captain";
  s.streak = 6;
  s.fuel = Object.assign({}, s.fuel, { motorboat: 0, yacht: 0.8 });
  s.layoutVer = 4;
  C.setScore(40);
  C.fuel.setLevel("motorboat", 0);
  C.teleport(0, 8);
  C.save();
  const near = C.lair.near({ x: 0, z: 8 });
  return {
    near: near && near.id,
    mode: C.mode,
    score: C.state().score,
    tank: C.fuel.FULL_TANK_COINS,
    yacht: C.state().fuel.yacht,
  };
});
check("home beach is not a lair prompt", setup.near == null, String(setup.near));
check("still on foot at home before boarding", setup.mode === "walk", setup.mode);
check("full tank price is still 20 coins", setup.tank === 20, String(setup.tank));

await page.evaluate(() => window.CaptainAdventure.enterVehicle("motorboat"));
await page.waitForSelector("#panel-body .choice", { timeout: 8000 });
let gateScore = 40;
for (let i = 0; i < 3; i++) {
  const step = await page.evaluate(() => {
    const C = window.CaptainAdventure;
    const idx = C.bfGate.answerIndex();
    const btn = document.querySelectorAll("#panel-body .choice")[idx];
    if (!btn) return { ok: false, idx, score: C.state().score };
    btn.click();
    return { ok: true, idx, score: C.state().score, streak: C.bfGate.streak };
  });
  if (!step.ok) {
    check("math gate accepts the right answer", false, JSON.stringify(step));
    break;
  }
  gateScore = step.score;
  await new Promise((r) => setTimeout(r, 150));
  await page.evaluate(() => { const n = document.getElementById("next"); if (n) n.click(); });
  await new Promise((r) => setTimeout(r, 250));
}
check("three correct gate answers pay 20 coins", gateScore === 60, "score " + gateScore);

await page.waitForFunction(() => {
  const fuel = document.getElementById("fuel");
  return fuel && !fuel.classList.contains("hidden");
}, { timeout: 8000 });
let paid = false;
for (let i = 0; i < 4 && !paid; i++) {
  paid = await page.evaluate(() => {
    const fb = document.getElementById("fuel-fb");
    if (fb && /Glug/.test(fb.textContent || "")) return true;
    const btn = [...document.querySelectorAll("#fuel .choice")].find((b) => !b.disabled);
    if (btn) btn.click();
    return false;
  });
  await new Promise((r) => setTimeout(r, 200));
  paid = await page.evaluate(() => /Glug/.test(document.getElementById("fuel-fb")?.textContent || ""));
}
const fueled = await page.evaluate(() => {
  const C = window.CaptainAdventure;
  return { score: C.state().score, level: C.fuel.level("motorboat") };
});
check("fuel dock charges 20 and fills the tank", paid && fueled.score === 40 && fueled.level >= 0.99, JSON.stringify(fueled));
await page.evaluate(() => { const go = document.getElementById("fuel-go"); if (go) go.click(); });
await page.waitForFunction(() => window.CaptainAdventure.mode === "motorboat", { timeout: 8000 });
check("boarding still puts the captain in the power boat", true);

const drained = await page.evaluate(() => new Promise((resolve) => {
  const C = window.CaptainAdventure;
  const start = C.state().score;
  C.fuel.setLevel("motorboat", 0.03);
  const startLevel = C.fuel.level("motorboat");
  C.keys.KeyW = true;
  const t0 = performance.now();
  let sawDrop = false;
  let low = startLevel;
  function tick() {
    const level = C.fuel.level("motorboat");
    if (level < startLevel - 0.005) sawDrop = true;
    low = Math.min(low, level);
    const toast = document.getElementById("toast");
    const text = toast && !toast.classList.contains("hidden") ? toast.textContent : "";
    const towed = C.mode === "walk" && /Tow/i.test(text);
    if (towed || performance.now() - t0 > 20000) {
      C.keys.KeyW = false;
      resolve({ sawDrop, level, mode: C.mode, text: text.slice(0, 80), score: C.state().score, start });
    } else requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}));
check("throttle drains the tank", drained.sawDrop, "level " + drained.level);
check("empty tank tows home for free", drained.mode === "walk" && /Tow/i.test(drained.text) && drained.score === drained.start, JSON.stringify(drained));

const homeAgain = await page.evaluate(() => {
  const C = window.CaptainAdventure;
  C.teleport(0, 8);
  const near = C.lair.near(C.captain.position);
  return { near: near && near.id, inside: C.lair.inside(), mode: C.mode };
});
check("after the tow, home is still not a lair action", homeAgain.near == null && homeAgain.inside === false, JSON.stringify(homeAgain));

await page.evaluate(() => window.CaptainAdventure.setScore(200));
await page.evaluate(() => window.CaptainAdventure.openMG("baseball"));
await page.waitForSelector("#mg .mg-start", { timeout: 8000 });
const beforePlay = await page.evaluate(() => window.CaptainAdventure.state().score);
await page.click("#mg .mg-start");
await new Promise((r) => setTimeout(r, 300));
const openedGate = await page.evaluate(() => !!document.querySelector("#mg .gch button"));
check("baseball's first play opens the math gate", openedGate);
if (openedGate) {
  for (let n = 0; n < 3; n++) {
    const solved = await page.evaluate(() => {
      const prompt = document.querySelector("#mg .gq")?.textContent || "";
      const buttons = [...document.querySelectorAll("#mg .gch button")];
      const texts = buttons.map((b) => b.textContent.replace(/^[A-D]\s*/, "").trim());
      let answer = null;
      const bank = JSON.parse(document.getElementById("question-bank").textContent);
      const all = [];
      for (const loc of bank.locations || []) {
        for (const reading of loc.readings || []) for (const q of reading.questions || []) all.push(q);
        for (const q of loc.questions || []) all.push(q);
      }
      const hit = all.find((q) => q.prompt && (prompt.includes(q.prompt.slice(0, 36)) || q.prompt.includes(prompt.slice(0, 36))));
      if (hit) answer = String(hit.choices[hit.answer_index]);
      const num = (re) => { const m = prompt.match(re); return m ? m.slice(1).map(Number) : null; };
      let value = null;
      let m = num(/has (\d+)\D+with (\d+)/); if (m) value = m[0] * m[1];
      m = num(/had (\d+)\D+got (\d+)\D+gave away (\d+)/); if (m) value = m[0] + m[1] - m[2];
      m = num(/(\d+)\D+shared equally into (\d+)/); if (m) value = m[0] / m[1];
      m = num(/There are (\d+)\D+(\d+)\/(\d+)/); if (m) value = m[0] * m[1] / m[2];
      m = num(/(\d+) feet long and (\d+) feet wide/); if (m) value = 2 * (m[0] + m[1]);
      m = prompt.match(/pattern\?\s*([0-9,\s]+)/); if (m) {
        const seq = m[1].split(",").map((x) => parseInt(x, 10)).filter((x) => !Number.isNaN(x));
        if (seq.length >= 2) value = seq[seq.length - 1] + (seq[1] - seq[0]);
      }
      const want = answer != null ? answer : (value != null ? String(value) : null);
      if (want == null) return { ok: false, prompt: prompt.slice(0, 180), texts };
      const btn = buttons.find((b) => b.textContent.includes(want) || b.textContent.replace(/[^\d.]/g, "") === String(parseFloat(want)));
      if (!btn) return { ok: false, prompt: prompt.slice(0, 160), want, texts };
      btn.click();
      return { ok: true };
    });
    check(n === 0 ? "mini-game gate question is answerable" : "mini-game gate keeps the streak", solved.ok, solved.ok ? "" : JSON.stringify(solved));
    if (!solved.ok) break;
    await new Promise((r) => setTimeout(r, 200));
    if (n < 2) {
      await page.evaluate(() => document.querySelector("#mg .mg-next")?.click());
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  const reward = await page.evaluate(() => {
    const text = document.querySelector("#mg .gfb")?.textContent || "";
    const m = text.match(/\+(\d+)/);
    return m ? Number(m[1]) : 0;
  });
  const mid = await page.evaluate(() => window.CaptainAdventure.state().score);
  await page.evaluate(() => document.querySelector("#mg .mg-go")?.click());
  await new Promise((r) => setTimeout(r, 300));
  const after = await page.evaluate(() => window.CaptainAdventure.state().score);
  check("passing the mini-game gate can pay its coin reward", reward === 20 || reward === 0, "reward " + reward);
  check("baseball's first Let's play charges 30", mid - after === 30, mid + " -> " + after);
}
await page.evaluate(() => document.querySelector("#mg .mg-x")?.click());
await new Promise((r) => setTimeout(r, 200));
const beforeReplay = await page.evaluate(() => window.CaptainAdventure.state().score);
await page.evaluate(() => window.CaptainAdventure.openMG("baseball"));
await page.waitForSelector("#mg .mg-start", { timeout: 5000 });
await page.click("#mg .mg-start");
await new Promise((r) => setTimeout(r, 300));
const afterReplay = await page.evaluate(() => ({
  score: window.CaptainAdventure.state().score,
  phase: document.querySelector("#mg")?.classList.contains("hidden") ? "closed" : "open",
  gated: !!document.querySelector("#mg .gch button"),
}));
check("baseball replay charges another 30 and does not reopen the gate", beforeReplay - afterReplay.score === 30 && afterReplay.gated === false, JSON.stringify(afterReplay));
await page.evaluate(() => document.querySelector("#mg .mg-x")?.click());

await page.evaluate(() => {
  const C = window.CaptainAdventure;
  const s = C.state();
  s.gatePlays = Object.assign({}, s.gatePlays, { tennis: 1 });
  C.setScore(220);
  C.save();
  C.openMG("tennis");
});
await page.waitForSelector("#mg .mg-start", { timeout: 5000 });
await page.click("#mg .mg-start");
await new Promise((r) => setTimeout(r, 300));
const tennis = await page.evaluate(() => window.CaptainAdventure.state().score);
check("tennis charges the normal 10-coin ticket", tennis === 210, "score " + tennis);
await page.evaluate(() => document.querySelector("#mg .mg-x")?.click());

const kept = await page.evaluate(() => {
  const C = window.CaptainAdventure;
  C.save();
  const s = C.state();
  return {
    badges: s.badges,
    prizes: s.prizes,
    isles: s.isles,
    hat: s.hat,
    streak: s.streak,
    yacht: s.fuel && s.fuel.yacht,
    layout: s.layoutVer,
    score: s.score,
  };
});
await page.reload({ waitUntil: "networkidle0", timeout: 60000 });
await page.waitForFunction(() => window.CaptainAdventure && window.CaptainAdventure.state, { timeout: 30000 });
const reloaded = await page.evaluate(() => {
  const s = window.CaptainAdventure.state();
  return { badges: s.badges, prizes: s.prizes, isles: s.isles, hat: s.hat, streak: s.streak, yacht: s.fuel && s.fuel.yacht, layout: s.layoutVer, score: s.score };
});
check("reload keeps the volcano badge", !!(reloaded.badges && reloaded.badges.volcano));
check("reload keeps the yacht", (reloaded.prizes || []).includes("yacht"));
check("reload keeps island discoveries", reloaded.isles && reloaded.isles.turtle === 1 && reloaded.isles.pirate === 1, JSON.stringify(reloaded.isles));
check("reload keeps the hat, streak, yacht fuel, and score", reloaded.hat === "captain" && reloaded.streak === 6 && reloaded.yacht === 0.8 && reloaded.score === kept.score && reloaded.layout === 4, JSON.stringify(reloaded));

await browser.close();
const real = errors.filter((e) => !/favicon/i.test(e));
check("no console errors", real.length === 0, real.slice(0, 3).join(" | "));
fs.mkdirSync("/tmp/cap-shots", { recursive: true });
fs.writeFileSync("/tmp/cap-shots/smoke-result.json", JSON.stringify({ passed: failures.filter((f) => f.ok).length, failed: failures.filter((f) => !f.ok).length, failures }, null, 2));
console.log(JSON.stringify({ passed: failures.filter((f) => f.ok).length, failed: failures.filter((f) => !f.ok).length }));
if (failures.some((f) => !f.ok)) process.exit(1);
