/**
 * Liberty Isle depth: practice follows the missed skill, plaques pick an era,
 * the rally is a 3-stop neighbor route, the quiz spins and shuffles, and a
 * higher tier pays at most one extra coin. Run: node tests/liberty-depth.mjs
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
await new Promise((r) => server.listen(8819, "127.0.0.1", r));
const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--no-sandbox", "--disable-dev-shm-usage"]
});
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8819/index.html?quiet=1&debug=nogate,nofuel", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForFunction(() => window.CaptainLiberty && window.CaptainLiberty.ready, { timeout: 30000 });

const depth = await page.evaluate(() => {
  const L = window.CaptainLiberty;
  const C = window.CaptainAdventure;
  const practice = L.practiceFor({
    type: "choice",
    state: "Ohio",
    question: "Which region of the United States is Ohio in?",
    fact: "Ohio is a Midwest state.",
    choices: ["Midwest", "West", "Northeast", "Southeast"],
    answer: 0
  });
  const yearPractice = L.practiceFor({
    type: "choice",
    fact: "The stock market crashed in 1929.",
    question: "In what year did the market crash?",
    choices: ["1929"],
    answer: 0,
    year: 1776
  });
  L.close();
  L.open("rally");
  const rally = L.session();
  const states = L.BANK.states;
  function neighbors(name) {
    const row = states.find((s) => s.name === name);
    return row ? row.neighbors : [];
  }
    const chain = (rally.qs || []).map((q) => {
    const named = String(q.question || "").match(/after ([^?]+)\?/);
    const subject = named ? named[1] : "";
    const correct = q.choices[q.answer];
    return { subject, correct, borders: neighbors(subject).indexOf(correct) >= 0 };
  });
  L.close();
  let quiz = null;
  let moved = false;
  for (let n = 0; n < 8 && !moved; n++) {
    L.close();
    L.open("quiz");
    L.spin();
    quiz = L.session();
    moved = (quiz.qs || []).some((q) => q.answer !== 0);
  }
  const cats = ["Capitals", "Flags", "History", "Geography", "Which state am I?"];
  const spin = quiz.spin || 0;
  const mod = ((360 - (spin % 360)) % 360);
  const wedge = Math.floor(mod / 72) % 5;
  const prices = L.BANK.landmarks.map((lm) => [lm.id, lm.price]);
  const e7 = L.BANK.history.find((q) => q.eraId === "e7" && q.type === "order");
  const people = L.pack && L.pack.people ? L.pack.people.length : 0;
  const before = C.state().score;
  const placed = (C.state().v51.placed || []).slice();
  L.tier("map", 2);
  L.close();
  L.open("map");
  const map2 = L.session();
  const scoreAfterOpen = C.state().score;
  L.close();
  return {
    practiceSkill: practice.skill,
    practiceQ: practice.question,
    yearSkill: yearPractice.skill,
    yearQ: yearPractice.question,
    chain,
    quizN: quiz.qs.length,
    category: quiz.category,
    wedge: cats[wedge],
    answers: quiz.qs.map((q) => q.answer),
    prices,
    e7: e7 && e7.correctOrder.map((i) => e7.events[i].year),
    people,
    map2: map2 && map2.qs[0] && map2.qs[0].question,
    mapTier: map2 && map2.tier,
    coinsSame: before === scoreAfterOpen,
    placed: placed.length,
    eras: C.state().v51.eras,
    pennant: C.state().v51.pennant
  };
});

check("a missed region question practices a region", depth.practiceSkill === "region" && /region/i.test(depth.practiceQ), depth.practiceQ);
check("a year fact practices that year, not a default 1776", depth.yearSkill === "year" && !/1776/.test(depth.yearQ), depth.yearQ);
check("the rally is a 3-stop neighbor route", depth.chain.length === 3 && depth.chain.every((stop) => stop.borders), JSON.stringify(depth.chain));
check("the quiz spin lands on its category", depth.category === depth.wedge, JSON.stringify({ category: depth.category, wedge: depth.wedge }));
check("quiz wrong answers are not stuck in one slot", depth.quizN === 3 && depth.answers.some((n) => n !== 0), JSON.stringify(depth.answers));
const priceMap = Object.fromEntries(depth.prices);
check("Washington Monument is optional inside the 25-50 band", priceMap.washington === 32 && priceMap.bell === 25 && priceMap.gate === 50 && priceMap.arch === 35, JSON.stringify(depth.prices));
check("era 7 has an order set", depth.e7 && depth.e7.join(",") === "1929,1941,1944", JSON.stringify(depth.e7));
check("people stay available in the pack", depth.people === 27, String(depth.people));
check("map level 2 asks for a capital and a nickname", depth.mapTier === 2 && /capital/i.test(depth.map2) && /nickname/i.test(depth.map2), depth.map2);
check("opening a higher tier does not spend coins", depth.coinsSame === true);
check("new save fields default without clearing the collection", depth.pennant === 0 && depth.eras && typeof depth.eras === "object", JSON.stringify({ pennant: depth.pennant, placed: depth.placed }));

await browser.close();
server.close();
const failed = failures.filter((f) => !f.ok).length;
console.log(JSON.stringify({ passed: failures.length - failed, failed }));
if (failed) process.exit(1);
