/**
 * Second pass: activity visuals, phone layout, and screenshots.
 * Run: node tests/v50-qc.mjs
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
const failures = [];
function check(name, ok, detail = "") {
  failures.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
}

const server = http.createServer((req, res) => {
  const file = req.url.split("?")[0] === "/" ? "/index.html" : req.url.split("?")[0];
  const full = path.join(root, decodeURIComponent(file));
  if (!full.startsWith(root) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, { "content-type": path.extname(full) === ".js" ? "text/javascript" : "text/html" });
  fs.createReadStream(full).pipe(res);
});
await new Promise((r) => server.listen(8794, "127.0.0.1", r));
const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--no-sandbox", "--disable-dev-shm-usage"],
});
const errors = [];
const page = await browser.newPage();
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.setViewport({ width: 1280, height: 800 });
await page.goto("http://127.0.0.1:8794/index.html?quiet=1", { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForFunction(() => window.CaptainAdventure && window.CaptainAdventure.learn);
await page.evaluate(() => document.getElementById("intro").classList.add("hidden"));

async function shot(name, width, height) {
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 250));
  await page.screenshot({ path: path.join(out, name + ".png") });
}

const visuals = await page.evaluate(() => {
  const L = window.CaptainAdventure.learn;
  L.setDate("2026-11-02");
  L.play("nav");
  const nav = { visual: document.querySelector(".learn-visual").innerText, blocks: [...document.querySelectorAll(".hblk")].map((el) => el.innerText.replace(/\s+/g, " ")) };
  document.getElementById("learn-exit").click();
  L.play("market");
  const market = { fish: document.querySelectorAll(".fish").length, visual: document.querySelector(".learn-visual").innerText };
  document.getElementById("learn-exit").click();
  L.play("blueprint");
  const plan = { cells: document.querySelectorAll(".sq.cell").length, labeled: !!document.querySelector(".plan-rect"), prompt: document.querySelector(".learn-prompt").innerText };
  document.getElementById("learn-exit").click();
  L.play("code");
  const groups = [...document.querySelectorAll(".hblk")].map((el) => el.textContent.trim());
  document.getElementById("learn-exit").click();
  L.play("log");
  const log = { words: L.log.words, hasPassage: document.querySelector(".learn-story").innerText.includes("red flag") };
  document.getElementById("learn-exit").click();
  const foam = [];
  const wakes = [];
  window.CaptainAdventure.scene.traverse((o) => {
    if (o.name === "v50-foam") foam.push(1);
    if (o.name === "v50-wake") wakes.push(1);
  });
  return { nav, market, plan, groups, log, foam: foam.length, wakes: wakes.length };
});
check("the route visual shows the legs to add, not a shortcut", visuals.nav.blocks.join(" ").includes("5") && visuals.nav.blocks.join(" ").includes("east") && !/10/.test(visuals.nav.visual), JSON.stringify(visuals.nav));
check("the fish market shows three tags and not the change", visuals.market.fish === 3 && /2\.45/.test(visuals.market.visual) && !/2\.65/.test(visuals.market.visual), JSON.stringify(visuals.market));
check("the blueprint uses side labels instead of a counting grid", visuals.plan.cells === 0 && visuals.plan.labeled && /9 ft/.test(visuals.plan.prompt), JSON.stringify(visuals.plan));
check("the treasure code shows the given terms and not the next one", JSON.stringify(visuals.groups) === JSON.stringify(["4", "9", "19", "39"]), JSON.stringify(visuals.groups));
check("the log passage is on the card", visuals.log.hasPassage && visuals.log.words >= 150 && visuals.log.words <= 220);
check("foam lines and boat wakes were added", visuals.foam >= 4 && visuals.wakes >= 7, JSON.stringify(visuals));

await page.evaluate(() => {
  const C = window.CaptainAdventure;
  C.setScore(400);
  C.learn.openGate("hq");
});
await shot("gate-desktop", 1280, 800);
await shot("gate-phone", 390, 844);
const phoneGate = await page.evaluate(() => {
  document.body.classList.add("touch");
  const card = document.getElementById("learn-card").getBoundingClientRect();
  const buttons = [...document.querySelectorAll("#learn-card button")].map((b) => b.getBoundingClientRect());
  const hud = document.getElementById("hud").getBoundingClientRect();
  const chips = [...document.querySelectorAll("#hud .chip, #prize-bar, #ver-flag")].map((el) => {
    const r = el.getBoundingClientRect();
    return { right: Math.round(r.right), bottom: Math.round(r.bottom), top: Math.round(r.top) };
  });
  return {
    cardTop: card.top, cardBottom: card.bottom, view: window.innerHeight, viewW: window.innerWidth,
    buttons: buttons.every((b) => b.bottom <= window.innerHeight + 2 && b.right <= window.innerWidth + 2),
    hudRight: Math.round(hud.right), chips
  };
});
check("the phone lesson card and its buttons stay on screen", phoneGate.cardTop >= 0 && phoneGate.cardBottom <= phoneGate.view + 2 && phoneGate.buttons, JSON.stringify({ top: phoneGate.cardTop, bottom: phoneGate.cardBottom, view: phoneGate.view }));
check("the phone HUD wraps inside the screen", phoneGate.chips.every((c) => c.right <= phoneGate.viewW - 60 && c.top >= 0), JSON.stringify(phoneGate.chips));

await page.setViewport({ width: 1280, height: 800 });
await page.evaluate(() => {
  const L = window.CaptainAdventure.learn;
  const q = L.gate.current();
  L.answer(q.answer === 0 ? 1 : 0);
});
await shot("tutorial-desktop", 1280, 800);
await shot("tutorial-phone", 390, 844);
await page.evaluate(() => document.getElementById("learn-exit").click());

await page.evaluate(() => {
  const L = window.CaptainAdventure.learn;
  L.setDate("2026-11-03");
  L.startDaily();
});
await shot("daily-desktop", 1280, 800);
await shot("daily-phone", 390, 844);
await page.evaluate(() => document.getElementById("learn-exit").click());

await page.evaluate(() => window.CaptainAdventure.learn.hold(3000));
await shot("progress-desktop", 1280, 800);
await shot("progress-phone", 390, 844);
await page.evaluate(() => document.getElementById("learn-exit").click());

for (const id of ["nav", "market", "blueprint", "code", "log"]) {
  await page.evaluate((name) => window.CaptainAdventure.learn.play(name), id);
  await shot("activity-" + id + "-desktop", 1280, 800);
  await shot("activity-" + id + "-phone", 390, 844);
  if (id === "log") {
    const ready = await page.evaluate(() => {
      const btn = document.getElementById("learn-ready");
      const card = document.getElementById("learn-card").getBoundingClientRect();
      const ok = !!btn && btn.getBoundingClientRect().bottom <= window.innerHeight + 1 && card.bottom <= window.innerHeight + 1;
      if (btn) btn.click();
      return ok;
    });
    check("the log passage screen keeps Ready on screen", ready);
    await shot("activity-log-questions-desktop", 1280, 800);
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await shot("activity-log-questions-phone", 390, 844);
    const buttons = await page.evaluate(() => {
      const choices = [...document.querySelectorAll("[data-choice]")].map((el) => el.getBoundingClientRect());
      return choices.length === 4 && choices.every((b) => b.top >= 0 && b.bottom <= window.innerHeight + 1 && b.right <= window.innerWidth + 1);
    });
    check("log answer buttons stay on the phone screen", buttons);
  }
  await page.evaluate(() => document.getElementById("learn-exit").click());
}
await page.evaluate(() => window.CaptainAdventure.learn.openLore("lighthouse"));
await shot("lore-lighthouse-desktop", 1280, 800);
await shot("lore-lighthouse-phone", 390, 844);
await page.evaluate(() => document.getElementById("learn-exit").click());

await page.evaluate(() => {
  document.body.classList.remove("touch");
  const C = window.CaptainAdventure;
  C.learn.setDate("2026-12-15");
  C.photo([42, 16, 30], [0, 1, 4]);
  C.qc(6);
});
await shot("winter-desktop", 1280, 800);
await shot("winter-phone", 390, 844);

await page.evaluate(() => {
  const C = window.CaptainAdventure;
  C.learn.setDate("2026-11-17");
  for (const id of ["hud", "hint", "gear", "touch-toggle", "zoom", "learn-open", "winter-banner", "ver-flag"]) {
    const n = document.getElementById(id);
    if (n) n.style.visibility = "hidden";
  }
  C.photo([42, 16, 30], [0, 1, 4]);
  C.qc(8);
});
await shot("after-harbor-desktop", 1280, 800);
await shot("after-harbor-phone", 390, 844);
await page.setViewport({ width: 1280, height: 800 });
await page.evaluate(() => {
  const C = window.CaptainAdventure;
  C.setScore(800);
  for (const d of C.lair.DEFS) C.lair.commit(d.id);
  const L = C.lair;
  L.leave();
  const cam = L.world(-6, 24, 0);
  const look = L.world(2, -1, 2);
  C.photo([cam.x, 16, cam.z], [look.x, 3, look.z]);
  C.qc(8);
});
await shot("after-lair-desktop", 1280, 800);
await page.setViewport({ width: 390, height: 844 });
await page.evaluate(() => window.CaptainAdventure.qc(4));
await shot("after-lair-phone", 390, 844);

const pageErrors = errors.filter((e) => !/Failed to load resource|favicon/i.test(e));
check("no console or page errors during the pass", pageErrors.length === 0, pageErrors.slice(0, 3).join(" | "));
await browser.close();
server.close();
if (failures.some((f) => !f.ok)) process.exit(1);
