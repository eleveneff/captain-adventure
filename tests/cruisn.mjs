/**
 * Cruis'n Liberty: the rally still asks 3 questions, a wrong answer teaches
 * and practices, and the race ticket is 10 coins with no extra payout.
 * Run: node tests/cruisn.mjs
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
await new Promise((r) => server.listen(8834, "127.0.0.1", r));
const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--no-sandbox", "--disable-dev-shm-usage"]
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await page.goto("http://127.0.0.1:8834/index.html?quiet=1", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForFunction(() => window.CaptainLiberty && window.CaptainLiberty.ready, { timeout: 30000 });
await page.evaluate(() => document.getElementById("intro")?.classList.add("hidden"));

const flow = await page.evaluate(() => {
  const L = window.CaptainLiberty;
  const C = window.CaptainAdventure;
  C.state().score = 40;
  C.state().v51 = C.state().v51 || {};
  C.state().v51.placed = ["Ohio"];
  C.state().v51.landmarks = { bell: 1 };
  L.open("rally");
  const qs = L.session().qs;
  const wrong = L.answer(L.session().qs[0].answer === 0 ? 1 : 0);
  const afterTutor = L.session();
  L.advance();
  const practiceSnap = L.session();
  const practicePhase = practiceSnap && practiceSnap.phase;
  const practiceText = practiceSnap && practiceSnap.practice && practiceSnap.practice.question;
  L.answer(practiceSnap && practiceSnap.practice ? practiceSnap.practice.answer : 0);
  while (L.session() && L.session().phase !== "done") {
    const q = L.session();
    if (q.phase === "ask") L.answer(q.qs[q.i].answer);
    else L.advance();
  }
  const beforeRace = C.state().score;
  const placed = C.state().v51.placed.slice();
  const bell = C.state().v51.landmarks.bell;
  const started = L.start();
  const idle = L.drive({ dt: 0.05 });
  let moved = L.drive({ gas: true, boost: true, dt: 0.2 });
  for (let i = 0; i < 40; i++) moved = L.drive({ gas: true, boost: true, dt: 0.05 });
  const names = (L.race().checks || []).map((c) => c.name + (c.hit ? "*" : ""));
  let finish = L.race();
  for (let i = 0; i < 500 && finish && !finish.over; i++) finish = L.drive({ gas: true, boost: true, dt: 0.05 });
  return {
    questions: qs.length,
    tutorial: !!(wrong && wrong.tutorial),
    practiceQ: practicePhase === "practice" && /Practice/.test(practiceText || ""),
    practicePhase,
    practiceText,
    beforeRace,
    afterStart: started.score,
    ticket: started.price,
    bonus: started.bonus,
    moved: idle && moved && Math.hypot(moved.pose.x - idle.pose.x, moved.pose.z - idle.pose.z) > 1,
    names,
    finish,
    coins: C.state().score,
    placed: C.state().v51.placed,
    bell: C.state().v51.landmarks.bell,
    samePlaced: JSON.stringify(C.state().v51.placed) === JSON.stringify(placed) && bell === 1
  };
});
check("the rally set still has at least 3 questions", flow.questions >= 3, String(flow.questions));
check("a wrong answer opens the tutorial and a practice question", flow.tutorial && flow.practiceQ, JSON.stringify({ tutorial: flow.tutorial, practice: flow.practiceQ, phase: flow.practicePhase }));
check("the race ticket is 10 coins and the question bonus is separate", flow.afterStart === flow.beforeRace - 10 && flow.ticket === 10 && flow.bonus > 0, JSON.stringify(flow));
check("driving moves the car and the course has the four landmarks", flow.moved && flow.names.length === 4, flow.names.join(", "));
check("finishing does not mint coins or clear the collection", flow.finish && flow.finish.madeIt && flow.coins === flow.afterStart && flow.samePlaced, JSON.stringify({ coins: flow.coins, afterStart: flow.afterStart, place: flow.finish && flow.finish.place, placed: flow.placed, bell: flow.bell }));

const fps = await page.evaluate(() => new Promise((resolve) => {
  const C = window.CaptainAdventure;
  const times = [];
  let last = performance.now();
  const start = last;
  function tick(now) {
    C.renderer.render(C.scene, C.camera);
    times.push(now - last);
    last = now;
    if (now - start < 1500) requestAnimationFrame(tick);
    else {
      times.sort((a, b) => a - b);
      const mid = times[Math.floor(times.length / 2)];
      resolve({ frames: times.length, fps: Math.round(1000 / mid) });
    }
  }
  requestAnimationFrame(tick);
}));
check("the tablet view still draws frames", fps.frames >= 3 && fps.fps >= 1, JSON.stringify(fps));
console.log(JSON.stringify({ passed: failures.filter((f) => f.ok).length, failed: failures.filter((f) => !f.ok).length, fps }));
await browser.close();
server.close();
if (failures.some((f) => !f.ok)) process.exit(1);
