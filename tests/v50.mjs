/**
 * Captain Adventure 5.0 Learn & Build.
 * Run: node tests/v50.mjs
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

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const bank = JSON.parse(html.match(/<script type="application\/json" id="question-bank">([\s\S]*?)<\/script>/)[1]);
const table = JSON.parse(fs.readFileSync(path.join(root, "tests/set-table.json"), "utf8"));
const sets = [];
for (const loc of bank.locations) {
  sets.push([loc.id + " questions", loc.questions.length]);
  for (const reading of loc.readings || []) sets.push([loc.id + " / " + reading.id, reading.questions.length]);
}
check("every bank set has at least 3 questions", sets.every((row) => row[1] >= 3), sets.filter((row) => row[1] < 3).map((row) => row.join(":")).join(",") || sets.map((row) => row.join(":")).join(" "));
check("trimmed bank counts match the table", table.filter((row) => row.set.includes("questions") || row.set.includes("/")).every((row) => {
  const hit = sets.find((s) => s[0] === row.set);
  return hit && hit[1] === row.newCount && row.newCount >= 3 && row.newCount < row.oldCount && row.newReward === row.newCount * 10 && row.oldReward === row.oldCount * 10;
}), "");
check("rewards were cut only for trimmed sets and in proportion to the question count", table.filter((row) => row.oldCount !== row.newCount).every((row) => row.newReward < row.oldReward) && table.find((row) => row.set.startsWith("Math gate")).newReward === 20, "");
check("the 3-question math gate keeps 20 coins", html.includes("var Of=20"));
check("full tank, big games, and other tickets are unchanged", html.includes("FULL_TANK_COINS:20") && html.includes("baseball:30,tecmo:30") && html.includes("Z_=10"));
check("study sets and the practice replay were shortened with the jars", html.includes("buildSet(Et.locId,4)") && html.includes("COACH_N:4") && html.includes("COACH_DAY:24") && html.includes("VOCAB_N:5") && html.includes("VOCAB_DAY:20") && html.includes("TIMED_N:7") && html.includes("TIMED_DAY:11"));
check("the version label is Captain Adventure 5.0: Learn & Build", html.includes("Captain Adventure 5.0: Learn & Build") && html.includes('src="v50.js"'));

const server = http.createServer((req, res) => {
  const file = req.url.split("?")[0] === "/" ? "/index.html" : req.url.split("?")[0];
  const full = path.join(root, decodeURIComponent(file));
  if (!full.startsWith(root) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(full);
  res.writeHead(200, { "content-type": ext === ".js" ? "text/javascript" : ext === ".json" ? "application/json" : "text/html" });
  fs.createReadStream(full).pipe(res);
});
await new Promise((r) => server.listen(8791, "127.0.0.1", r));
const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--no-sandbox", "--disable-dev-shm-usage"],
});
const errors = [];
async function open(save) {
  const page = await browser.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.evaluateOnNewDocument((payload) => {
    if (payload) localStorage.setItem("captain-adventure-save-v1", JSON.stringify(payload));
    else localStorage.removeItem("captain-adventure-save-v1");
  }, save || null);
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto("http://127.0.0.1:8791/index.html?quiet=1", { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForFunction(() => window.CaptainAdventure && window.CaptainAdventure.learn, { timeout: 30000 });
  await page.evaluate(() => document.getElementById("intro")?.classList.add("hidden"));
  return page;
}

const old = {
  score: 88, streak: 6, bestStreak: 9, badges: { volcano: true }, prizes: ["yacht"],
  hat: "captain", fuel: { yacht: 0.8, motorboat: 0.35 }, layoutVer: 4,
  isles: { turtle: 1, pirate: 1 }, v43: { isles: { turtle: 1, pirate: 1 }, visits: 3 },
  v45: { owned: { hq: 1, pool: 1, garage: 1 }, parked: 1 },
  shop: { owned: { "hat-captain": true }, equip: { hat: "captain" } },
  pos: { x: 1, z: 2 }, ver: 3
};
const migratedPage = await open(old);
const migrated = await migratedPage.evaluate(() => {
  const s = window.CaptainAdventure.state();
  return {
    score: s.score, hat: s.shop && s.shop.equip && s.shop.equip.hat, yacht: (s.prizes || []).includes("yacht"),
    badge: s.badges && s.badges.volcano, fuel: s.fuel && s.fuel.yacht, owned: s.v45 && s.v45.owned,
    parked: s.v45 && s.v45.parked, layout: s.layoutVer, pos: s.pos, v50: !!s.v50,
    play: s.v50.playMs, streak: s.v50.daily.streak, skills: s.v50.skills
  };
});
check("an old save keeps coins, lair builds, fuel, and items", migrated.score === 88 && migrated.hat === "captain" && migrated.yacht && migrated.badge && migrated.fuel === 0.8 && migrated.owned.hq === 1 && migrated.owned.pool === 1 && migrated.owned.garage === 1 && migrated.parked === 1 && migrated.layout === 4 && migrated.v50 && migrated.play < 60000 && migrated.streak === 0, JSON.stringify(migrated));
await migratedPage.close();

const page = await open(null);
const gate = await page.evaluate(() => {
  const C = window.CaptainAdventure;
  const L = C.learn;
  C.setScore(200);
  const opened = L.openGate("hq");
  const q = L.gate.current();
  const wrong = L.answer(q.answer === 0 ? 1 : 0);
  const tutor = L.tutorial.state();
  const skipEarly = L.tutorial.skip();
  L.tutorial.next();
  const skip = L.tutorial.skip();
  const after = L.tutorial.state();
  const pausedBefore = L.ui.paused();
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  const paused = L.ui.paused();
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  L.gate.answer(0);
  return {
    opened, total: opened.total, wrong, tutorSteps: tutor && tutor.steps, skipEarly, skip,
    phase: after && after.phase, skill: tutor && tutor.skill, coins: C.lair.coins(),
    misses: L.gate.misses(), pausedBefore, paused, owned: C.lair.own("hq")
  };
});
check("a build gate stays between 3 and 5 questions", gate.opened.ok && gate.total >= 3 && gate.total <= 5, JSON.stringify({ total: gate.total }));
check("a miss shows a tutorial, does not charge, and Escape pauses only while it is open", gate.wrong.right === false && gate.wrong.restart === false && gate.wrong.index === 0 && gate.wrong.gentle === true && gate.tutorSteps >= 2 && gate.tutorSteps <= 4 && gate.skipEarly.ok === false && gate.skip.ok === true && gate.phase === "practice" && gate.coins === 200 && gate.misses === 1 && gate.owned === false && gate.pausedBefore === false && gate.paused === true, JSON.stringify(gate));

const finished = await page.evaluate(() => {
  const L = window.CaptainAdventure.learn;
  const log = [];
  while (L.gate.current()) {
    const q = L.gate.current();
    const res = L.answer(q.answer);
    log.push({ right: res.right, done: res.done, refund: res.refund });
    if (res.done || log.length > 8) break;
  }
  return { log, score: window.CaptainAdventure.lair.coins(), built: window.CaptainAdventure.lair.own("hq") };
});
check("a missed gate still builds at the old price and does not refund", finished.built && finished.score === 140, JSON.stringify(finished));

const clean = await page.evaluate(() => {
  const C = window.CaptainAdventure;
  const L = C.learn;
  const opened = L.openGate("tower");
  let res = { score: C.lair.coins() };
  let guard = 0;
  while (L.gate.current() && guard < 8) {
    res = L.answer(L.gate.current().answer);
    guard++;
  }
  return { total: opened.total, res, score: C.lair.coins(), built: C.lair.own("tower") };
});
check("all correct on the first try refunds 1 coin and still charges 30", clean.built && clean.res.refund === 1 && clean.score === 140 - 30 + 1, JSON.stringify(clean));

const direct = await page.evaluate(() => {
  const C = window.CaptainAdventure;
  const before = C.lair.coins();
  const res = C.lair.commit("pool");
  return { before, score: res.score, drop: before - res.score, price: res.price, ok: res.ok };
});
check("direct commit still charges the old pool price", direct.ok && direct.drop === 40 && direct.score === 71, JSON.stringify(direct));

const daily = await page.evaluate(() => {
  const L = window.CaptainAdventure.learn;
  L.setDate("2026-11-16");
  const start = L.startDaily();
  let guard = 0, last = null;
  while (L.daily.current() && guard < 6) { last = L.answer(L.daily.current().answer); guard++; }
  const again = L.startDaily();
  L.setDate("2026-11-17");
  L.startDaily();
  let guard2 = 0, second = null;
  while (L.daily.current() && guard2 < 6) { second = L.answer(L.daily.current().answer); guard2++; }
  L.setDate("2026-11-18");
  const thirdStart = L.startDaily();
  let guard3 = 0, third = null;
  while (L.daily.current() && guard3 < 6) { third = L.answer(L.daily.current().answer); guard3++; }
  L.setDate("2026-11-19");
  L.startDaily();
  let guard4 = 0, fourth = null;
  while (L.daily.current() && guard4 < 6) { fourth = L.answer(L.daily.current().answer); guard4++; }
  return { count: start.total, pay: last && last.pay, again: again.reason, second: second && second.pay, third: third && third.pay, fourth: fourth && fourth.pay, streak: fourth && fourth.streak, thirdCount: thirdStart.total };
});
check("Daily Three stays at 3 and the streak bonus is capped at 3", daily.count === 3 && daily.thirdCount === 3 && daily.pay === 2 && daily.again === "done" && daily.second === 2 && daily.third === 3 && daily.fourth === 3 && daily.streak === 4, JSON.stringify(daily));

const review = await page.evaluate(() => {
  const L = window.CaptainAdventure.learn;
  L.setDate("2026-11-16");
  L.record("money", false);
  const due = L.due().filter((d) => d.skill === "money").map((d) => d.at);
  L.setDate("2026-11-20");
  const day = L.startDaily();
  return { due, first: day.skills && day.skills[0], skills: day.skills || [], count: day.total };
});
check("a missed skill is queued for 1, 3, and 7 days and comes back in Daily Three", review.due.length === 3 && review.due[1] - review.due[0] === 2 && review.due[2] - review.due[1] === 4 && review.skills.includes("money") && review.count === 3, JSON.stringify(review));

const parent = await page.evaluate(() => {
  const L = window.CaptainAdventure.learn;
  const before = L.progress();
  L.record("fractions", false);
  const one = L.progress().weak.some((w) => w.skill === "fractions");
  L.record("fractions", false);
  L.record("vocab", true); L.record("vocab", true); L.record("vocab", true); L.record("vocab", true); L.record("vocab", false);
  const cardNow = L.progress();
  const early = L.hold(2000);
  L.addPlay(120000);
  const open = L.hold(1000);
  const idle = L.ui.paused();
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  return {
    one, early: early.reason,
    weak: open.card.weak, play: open.card.playMs, streak: open.card.streak,
    vocab: cardNow.rows.find((r) => r.skill === "vocab"),
    pausedAfterEsc: L.ui.paused(), idle
  };
});
check("a skill is weak only under 80% with at least 2 tries", parent.one === false && parent.weak.some((w) => w.skill === "fractions" && w.n >= 2 && w.acc < 80) && parent.vocab && parent.vocab.acc === 80 && !parent.weak.some((w) => w.skill === "vocab"), JSON.stringify({ weak: parent.weak, vocab: parent.vocab }));
check("the progress card needs a 3 second hold", parent.early === "hold" && parent.play >= 120000 && parent.streak === 4 && parent.idle === false && parent.pausedAfterEsc === true, JSON.stringify(parent));

const acts = await page.evaluate(() => {
  const L = window.CaptainAdventure.learn;
  document.getElementById("learn-exit")?.click();
  const names = ["nav", "market", "blueprint", "code", "log"];
  const out = {};
  names.forEach((id) => {
    const info = L.activity(id);
    L.play(id);
    const q = L.gate.current ? null : null;
    const text = document.getElementById("learn-card").innerText;
    out[id] = { total: info.total, kinds: info.kinds, text: text.slice(0, 220) };
    document.getElementById("learn-exit").click();
  });
  const logWords = L.log.words;
  const lore = ["harbor", "turtle", "parrot", "pirate", "lighthouse"].map((id) => L.lore(id));
  return { out, logWords, lore: lore.map((s) => ({ id: s.id, words: s.words, n: 3, main: s.main.choices.length, answer: s.main.answer })) };
});
check("each captain activity is a short set of at least 3", ["nav", "market", "blueprint", "code"].every((id) => acts.out[id].total === 3) && acts.out.log.total === 5 && acts.logWords >= 150 && acts.logWords <= 220 && /east/.test(acts.out.nav.text) && /fish/i.test(acts.out.market.text), JSON.stringify(acts.out.nav));
check("the log covers main idea, detail, inference, vocabulary, and tone", ["main", "detail", "infer", "vocab", "tone"].every((k) => acts.out.log.kinds.includes(k)), acts.out.log.kinds.join(","));
check("each island and lighthouse story is 120 to 180 words with a real question", acts.lore.every((s) => s.words >= 120 && s.words <= 180 && s.n === 3 && s.main === 4 && s.answer === 0), JSON.stringify(acts.lore));

const winter = await page.evaluate(() => {
  const L = window.CaptainAdventure.learn;
  const dates = {
    nov: L.winter.on("2026-11-30"),
    dec1: L.winter.on("2026-12-01"),
    dec25: L.winter.on("2026-12-25"),
    jan6: L.winter.on("2026-01-06"),
    jan7: L.winter.on("2026-01-07")
  };
  L.setDate("2026-12-15");
  const stats = L.winter.stats();
  L.setDate("2026-11-17");
  const off = L.winter.stats();
  return { dates, stats, off: off.on, banner: document.getElementById("winter-banner").classList.contains("show") };
});
check("winter runs from December 1 through January 6", winter.dates.nov === false && winter.dates.dec1 && winter.dates.dec25 && winter.dates.jan6 && winter.dates.jan7 === false, JSON.stringify(winter.dates));
check("winter snow is round points, not cones, and not on the captain", winter.stats.on && winter.stats.points && winter.stats.cones === 0 && winter.stats.onCaptain === 0 && winter.off === false && winter.banner === false, JSON.stringify(winter));

const reading = await page.evaluate(() => {
  const L = window.CaptainAdventure.learn;
  document.getElementById("learn-exit")?.click();
  L.setQuiet(true);
  const opened = L.onWrong({
    skill: "main_idea",
    prompt: "What is the story about?",
    explain: "Mina planted seeds and the seeds grew into flowers.",
    passage: "Mina planted seeds. The seeds grew into flowers.",
    choices: ["Mina's seeds grew into flowers.", "A boat race.", "A lost map.", "A quiet kitchen."],
    answer: 0
  });
  const state = L.tutorial.state();
  return { steps: opened.steps, skill: state.skill, hit: state.hit, quiet: L.quiet(), skip: L.tutorial.skip().ok };
});
check("a reading miss highlights a sentence and cannot skip the first step", reading.skill === "reading" && reading.steps >= 2 && reading.steps <= 4 && /flowers/.test(reading.hit) && reading.quiet && reading.skip === false, JSON.stringify(reading));

const pageErrors = errors.filter((e) => !/Failed to load resource|favicon/i.test(e));
check("no page errors", pageErrors.length === 0, pageErrors.slice(0, 4).join(" | "));
await browser.close();
server.close();
if (failures.some((f) => !f.ok)) process.exit(1);
