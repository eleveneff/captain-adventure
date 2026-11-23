/* Captain Adventure 5.1 — Liberty Isle.
   Five stations on the engine island "liberty". Saves live on state.v51 and do not touch coins. */
(function () {
  const CA = window.CaptainAdventure;
  const BANK = window.LIBERTY_BANK;
  if (!CA || !BANK) return;
  const VER = "Captain Adventure 5.1: Liberty Isle";
  const REGIONS = BANK.regions;
  let PACK = null;
  let ERAS = [];
  let readyResolve = null;
  const readyP = new Promise((resolve) => { readyResolve = resolve; });

  function state() { return CA.state(); }
  function coins() { return Math.max(0, Math.floor(Number(state().score) || 0)); }
  function setCoins(n) { CA.setScore(Math.max(0, Math.floor(n))); return coins(); }
  function persist() { if (CA.save) CA.save(); }
  function bag() {
    const s = state();
    const fresh = !s.v51 || typeof s.v51 !== "object" || Array.isArray(s.v51);
    if (fresh) s.v51 = {};
    const v = s.v51;
    v.ver = 1;
    if (!Array.isArray(v.placed)) v.placed = [];
    if (!v.flags || typeof v.flags !== "object") v.flags = {};
    if (!Array.isArray(v.postcards)) v.postcards = [];
    if (!v.landmarks || typeof v.landmarks !== "object") v.landmarks = {};
    if (!v.cleared || typeof v.cleared !== "object") v.cleared = {};
    if (!v.quiz || typeof v.quiz !== "object") v.quiz = { rounds: 0, stars: 0, best: 0 };
    if (fresh) persist();
    return v;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  function kit() { return CA.gfxKit; }
  function byName(name) { return BANK.states.find((s) => s.name === name); }

  let isle = null;
  let stations = [];
  let rooms = [];
  let flags = {};
  let monuments = {};
  let session = null;
  let nearest = null;
  let lay = null;
  let mountainBlock = null;
  let host = null;
  let mapMesh = null;
  let mapAnchor = null;
  let caveAnchor = null;
  let caveWalls = null;
  let builderPlot = null;
  let bridgeWalk = null;
  let rallyPad = null;
  let rushmorePhoto = null;
  const GROW = 1.275;
  const SHORE = 1.112;
  const CHAN = { s: 17.4, half: 1.65, f0: 16, f1: 34 };
  const CAVE = { f: 6.4, s: 0.3 };
  const LAYOUT = {
    map: [18.6, -9.2],
    tunnel: [CAVE.f + 2.5, CAVE.s],
    lawn: [13.8, -12.4],
    builder: [11.2, 10.2],
    quiz: [19.4, 5.2],
    table: [19.6, -13.1],
    plot: [13.4, 8.2],
    flag: [25.6, 3.2],
    isleSign: [23.0, 3.5]
  };
  const ui = { layer: null, prompt: null };

  function worldPos(x, z) {
    const wx = isle.cx + x;
    const wz = isle.cz + z;
    let y = 0.2;
    try { y = isle.ground(wx, wz); } catch (err) { y = 0.2; }
    if (!Number.isFinite(y)) y = 0.2;
    return { x: wx, y: y, z: wz };
  }

  function css() {
    if (document.getElementById("v51-style")) return;
    const s = document.createElement("style");
    s.id = "v51-style";
    s.textContent = `
#liberty-layer{position:fixed;top:16px;right:118px;bottom:16px;width:min(420px,calc(100vw - 200px));z-index:18;display:none}
#liberty-layer.show{display:block}
body.liberty-open #shop-btn,body.liberty-open #prompt,body.liberty-open #liberty-prompt{visibility:hidden !important}
#liberty-card{height:100%;overflow:auto;background:#fffdf6;color:#10234d;border:6px solid #ffc83d;border-radius:22px;padding:12px 14px 16px;box-shadow:0 16px 36px rgba(7,20,48,.28)}
#liberty-card h2{margin:0 0 6px;font-size:22px}
#liberty-card p{margin:6px 0}
#liberty-card button{font:800 16px/1.25 Trebuchet MS,sans-serif;border-radius:12px;border:0;background:#14336b;color:#fff;padding:8px 10px;min-height:42px;cursor:pointer;margin:4px 4px 0 0}
#liberty-card button.ghost{background:#fff;color:#14336b;border:3px solid #00a7a0}
.liberty-fact{background:#fff;border:4px solid #14336b;border-radius:16px;padding:10px;margin:8px 0}
.liberty-fact b{display:block;font-size:18px}
.postcard{position:relative;background:#fff8e8;border:3px solid #c0392b;border-radius:8px;padding:12px 14px 10px;margin:8px 0;box-shadow:4px 4px 0 rgba(20,40,80,.15);min-height:92px}
.postcard .stamp{position:absolute;top:8px;right:8px;width:42px;height:48px;border:2px dashed #c0392b;color:#c0392b;font-weight:800;display:flex;align-items:center;justify-content:center;transform:rotate(8deg)}
.postcard b{display:block;font-size:18px;margin-right:52px}
.wheel-wrap{position:relative;width:230px;height:230px;margin:10px auto 4px}
.wheel-pointer{position:absolute;left:50%;top:-2px;transform:translateX(-50%);width:0;height:0;border-left:11px solid transparent;border-right:11px solid transparent;border-top:20px solid #10234d;z-index:2}
.wheel{width:230px;height:230px;border-radius:50%;border:6px solid #14336b;background:conic-gradient(#14336b 0 20%,#e6a817 0 40%,#c0392b 0 60%,#1e88e5 0 80%,#2e7d32 0 100%);position:relative;transition:transform 1.15s cubic-bezier(.12,.8,.16,1)}
.wheel span{position:absolute;width:76px;margin-left:-38px;margin-top:-8px;text-align:center;font-size:12px;font-weight:800;color:#fff;text-shadow:0 1px 2px #10234d}
#liberty-prompt{position:fixed;left:50%;bottom:76px;transform:translateX(-50%);z-index:16;display:none}
#liberty-prompt.show{display:block}
#liberty-prompt button{font:800 18px Trebuchet MS,sans-serif;background:#14336b;color:#fff;border:3px solid #ffc83d;border-radius:14px;padding:8px 14px}
@media (max-width:700px){#liberty-layer{top:108px;right:70px;left:8px;bottom:8px;width:auto}}
`;
    document.head.appendChild(s);
  }

  function ensureUi() {
    css();
    if (!ui.layer) {
      ui.layer = document.createElement("div");
      ui.layer.id = "liberty-layer";
      ui.layer.innerHTML = '<div id="liberty-card"></div>';
      ui.layer.addEventListener("pointerdown", (e) => e.stopPropagation());
      document.body.appendChild(ui.layer);
      ui.prompt = document.createElement("div");
      ui.prompt.id = "liberty-prompt";
      document.body.appendChild(ui.prompt);
      ui.prompt.addEventListener("click", () => { if (nearest) openStation(nearest.id); });
    }
  }
  function card() { return document.getElementById("liberty-card"); }
  function showCard(html) {
    ensureUi();
    ui.layer.classList.add("show");
    document.body.classList.add("liberty-open");
    card().innerHTML = html;
    card().querySelectorAll("[data-i]").forEach((btn) => {
      btn.onclick = () => answer(Number(btn.dataset.i));
    });
    const exit = card().querySelector("#liberty-exit");
    if (exit) exit.onclick = closePlay;
    const next = card().querySelector("#liberty-next");
    if (next) next.onclick = advance;
    card().querySelectorAll("[data-build]").forEach((btn) => {
      btn.onclick = () => startBuild(btn.dataset.build);
    });
    const spin = card().querySelector("#liberty-spin");
    if (spin) spin.onclick = spinWheel;
  }
  function closePlay() {
    session = null;
    document.body.classList.remove("liberty-open");
    if (ui.layer) ui.layer.classList.remove("show");
  }

  function payout(stationId, firstTry) {
    const cleared = !!bag().cleared[stationId];
    const base = firstTry ? 10 : 5;
    const gain = cleared ? Math.max(1, Math.floor(base / 2)) : base;
    setCoins(coins() + gain);
    return gain;
  }

  function practiceFor(q) {
    const year = q.year || 1776;
    const choices = [String(year), String(year + 11), String(year - 7), String(year + 40)];
    return {
      type: "choice",
      fact: q.fact,
      question: "Practice, for no coins. The fact names a year. Which year is it? " + q.fact,
      choices: choices,
      answer: 0,
      explanation: "The year in the fact is " + year + "."
    };
  }

  function choiceButtons(q) {
    return q.choices.map((c, i) => `<button data-i="${i}"><b>${"ABCD"[i]}</b> ${esc(c)}</button>`).join("");
  }

  function renderAsk() {
    const q = session.qs[session.i];
    const step = `Question ${session.i + 1} of ${session.qs.length}`;
    let body = "";
    if (!q) body = "<p>Done.</p>";
    else if (q.type === "order") {
      const picked = session.order.map((n) => q.events[n].text);
      body = `<p class="liberty-fact"><b>Fact.</b> ${esc(q.fact)}</p><p>${esc(q.question)}</p><p>${picked.length ? esc(picked.join(" → ")) : "Tap the earliest event first."}</p>` +
        q.events.map((ev, i) => `<button data-i="${i}" ${session.order.indexOf(i) >= 0 ? "disabled" : ""}>${esc(ev.text)}</button>`).join("");
    }     else {
      let ask = q.question || "";
      if (q.fact && ask.indexOf(q.fact) === 0) ask = ask.slice(q.fact.length).replace(/^[\s.]+/, "");
      body = `<p class="liberty-fact"><b>Fact.</b> ${esc(q.fact)}</p><p>${esc(ask)}</p>${choiceButtons(q)}`;
    }
    const title = session.title || "Liberty Isle";
    showCard(`<h2>${esc(title)}</h2><p>${step}</p>${body}<p><button class="ghost" id="liberty-exit">Exit</button></p>`);
  }

  function renderTutor() {
    const q = session.qs[session.i];
    showCard(`<h2>Let's learn it</h2><p>A miss is a lesson. Coins do not change on this step.</p><div class="liberty-fact"><b>Fact.</b> ${esc(q.fact)}</div><p>${esc(q.explanation || "")}</p><button id="liberty-next">Practice</button><button class="ghost" id="liberty-exit">Exit</button>`);
  }

  function renderPractice() {
    const q = session.practice;
    showCard(`<h2>Try one like it</h2><p>This practice does not change your coins.</p><p>${esc(q.question)}</p>${choiceButtons(q)}<button class="ghost" id="liberty-exit">Exit</button>`);
  }

  function renderFact(extra) {
    const q = session.lastFact;
    const more = extra ? `<p>${extra}</p>` : "";
    const post = q.postcard ? `<div class="postcard"><div class="stamp">USA</div><b>Greetings from ${esc(q.postcard)}</b><p>${esc(q.fact)}</p></div>` : "";
    showCard(`<h2>Fact card</h2>${post}<div class="liberty-fact" id="liberty-fact"><b>${esc(q.title || "Fact")}</b><p>${esc(q.fact)}</p>${q.extra ? `<p>${esc(q.extra)}</p>` : ""}</div>${more}<button id="liberty-next">Continue</button>`);
  }

  function renderDone() {
    session.phase = "done";
    const stars = session.stars != null ? `<p>Stars this round: ${session.stars} / ${session.qs.length}</p>` : "";
    showCard(`<h2>Set complete</h2><p>${esc(session.title)} is done.</p>${stars}<p>Coins: ${coins()}</p><button id="liberty-exit">Close</button>`);
  }

  function renderBuilder() {
    const v = bag();
    const rows = BANK.landmarks.map((lm) => {
      const owned = !!v.landmarks[lm.id];
      return `<p><b>${esc(lm.name)}</b> — ${lm.price} coins. ${esc(lm.blurb)}<br><button data-build="${lm.id}">${owned ? "Already built" : "Build"}</button></p>`;
    }).join("");
    showCard(`<h2>Landmark Builder</h2><p>Each monument needs 3 questions. A perfect first try returns 1 coin. Prices stay on this list.</p>${rows}<button class="ghost" id="liberty-exit">Exit</button>`);
  }

  function renderWheel() {
    const cats = ["Capitals", "Flags", "History", "Geography", "Which state?"];
    const labels = cats.map((name, i) => {
      const ang = ((i * 72) + 36) * Math.PI / 180;
      const x = 50 + Math.sin(ang) * 30;
      const y = 50 - Math.cos(ang) * 30;
      return `<span style="left:${x}%;top:${y}%">${esc(name)}</span>`;
    }).join("");
    showCard(`<h2>Fifty-State Quiz Show</h2><div class="wheel-wrap"><div class="wheel-pointer"></div><div class="wheel" id="liberty-wheel" style="transform:rotate(${session.spin || 0}deg)">${labels}</div></div><p>${session.category ? "Category: " + esc(session.category) : "Spin the wheel. The pointer marks the top."}</p><button id="liberty-spin">Spin</button><button class="ghost" id="liberty-exit">Exit</button>`);
  }

  function openStation(id) {
    const station = stations.find((s) => s.id === id);
    if (!station) return { ok: false, reason: "missing" };
    if (id === "builder") {
      session = { id, title: station.name, mode: "builder" };
      renderBuilder();
      return { ok: true, id };
    }
    if (id === "quiz" && !session) {
      session = { id, title: station.name, mode: "wheel", spin: 0, category: "" };
      renderWheel();
      return { ok: true, id };
    }
    const built = buildSet(id, station);
    if (!built.ok) return built;
    session = built.session;
    renderAsk();
    return { ok: true, id, total: session.qs.length };
  }

  function eraSet(era) {
    const all = BANK.history.filter((q) => q.era === era);
    const order = all.filter((q) => q.type === "order");
    const mc = all.filter((q) => q.type === "choice");
    const qs = [];
    if (order[0]) qs.push(order[0]);
    mc.forEach((q) => { if (qs.length < 3) qs.push(q); });
    return qs.slice(0, 3).map((q) => Object.assign({}, q, {
      choices: q.choices ? q.choices.slice() : undefined,
      events: q.events ? q.events.map((ev) => Object.assign({}, ev)) : undefined,
      correctOrder: q.correctOrder ? q.correctOrder.slice() : undefined
    }));
  }
  function landmarkGates() {
    const q = (fact, question, choices, answer, explanation) => ({ fact, question, choices, answer, explanation });
    return {
      "Statue of Liberty": { id: "liberty", price: 40, questions: [
        q("The people of France gave the Statue of Liberty to the United States, and it was dedicated in 1886.", "The Statue of Liberty was dedicated in 1886. Which country gave it to the United States?", ["France", "Spain", "Russia", "Japan"], 0, "France gave the statue. It was dedicated in New York Harbor in 1886."),
        q("A plaque inside the statue holds Emma Lazarus's poem welcoming the huddled masses yearning to breathe free.", "Emma Lazarus's poem on the statue welcomes which people?", ["Immigrants, the huddled masses yearning to breathe free", "Only kings and nobles", "People who already lived in every state", "Soldiers from the Civil War"], 0, "The poem welcomed immigrants arriving by ship."),
        q("For millions of immigrants arriving by ship, the statue was their first sight of America.", "Where did arriving immigrants see the statue first?", ["New York Harbor", "The Grand Canyon", "San Antonio", "The Black Hills"], 0, "The statue stands in New York Harbor.")
      ]},
      "Mount Rushmore": { id: "rushmore", price: 45, questions: [
        q("Sculptor Gutzon Borglum and about 400 workers carved four faces between 1927 and 1941.", "Who directed the carving of Mount Rushmore?", ["Gutzon Borglum", "Thomas Jefferson", "Neil Armstrong", "Roger Williams"], 0, "Borglum led about 400 workers from 1927 to 1941."),
        q("The faces are Washington, Jefferson, Theodore Roosevelt, and Lincoln. Each face is about 60 feet tall.", "About how tall is each face on Mount Rushmore?", ["60 feet", "6 feet", "600 feet", "6,000 feet"], 0, "Each carved face is about 60 feet tall."),
        q("Mount Rushmore is in the Black Hills of South Dakota. The four faces are Washington, Jefferson, Theodore Roosevelt and Lincoln.", "Which state is home to Mount Rushmore?", ["South Dakota", "Virginia", "Hawaii", "Maine"], 0, "The memorial is in the Black Hills of South Dakota.")
      ]},
      "Golden Gate Bridge": { id: "gate", price: 50, questions: [
        q("The Golden Gate Bridge opened in 1937 across the entrance to San Francisco Bay.", "The Golden Gate Bridge opened in 1937. Which city does it serve?", ["San Francisco", "Philadelphia", "St. Louis", "Boston"], 0, "It crosses the entrance to San Francisco Bay."),
        q("Its 4,200-foot main span was the longest of any suspension bridge in the world at the time.", "In 1937, the bridge's main span was known for being what?", ["The longest suspension span in the world at the time", "Shorter than a city block", "A tunnel under the bay", "A wooden ferry"], 0, "The 4,200-foot main span set the record in 1937."),
        q("Its famous color is called International Orange.", "What is the bridge's famous color called?", ["International Orange", "Liberty Green", "Bison Brown", "Palmetto Blue"], 0, "International Orange was chosen so ships could see the bridge in fog.")
      ]},
      "The Alamo": { id: "alamo", price: 30, questions: [
        q("In 1836, Texan defenders held the Alamo for 13 days. The fort fell, and nearly all inside were killed.", "In 1836, the Alamo was a battle in which present-day state?", ["Texas", "Florida", "Virginia", "Maine"], 0, "The Alamo is in San Antonio, Texas."),
        q("The Alamo was an old Spanish mission before the battle.", "Before the 1836 battle, the Alamo had been what?", ["A Spanish mission", "A railroad station", "A moon rocket", "A New England school"], 0, "Spain built it as a mission. The chapel still stands."),
        q("After the fall of the Alamo, Texan forces won independence at the Battle of San Jacinto on April 21, 1836.", "Where did Texan forces win independence in April 1836?", ["San Jacinto", "Gettysburg", "Yorktown", "Fort Sumter"], 0, "The Battle of San Jacinto was fought in Texas on April 21, 1836. Texas then became an independent republic.")
      ]},
      "Liberty Bell": { id: "bell", price: 25, questions: [
        q("The Liberty Bell hung in the Pennsylvania State House, now called Independence Hall.", "The Liberty Bell hung in which building?", ["The Pennsylvania State House, now Independence Hall", "The Alamo", "The Golden Gate Bridge", "Mount Rushmore"], 0, "Independence Hall in Philadelphia was the Pennsylvania State House."),
        q("The bell is inscribed 'Proclaim LIBERTY throughout all the Land unto all the Inhabitants thereof.'", "The words on the Liberty Bell proclaim what throughout the land?", ["Liberty", "A king's tax", "A state church", "A closed harbor"], 0, "The inscription says Proclaim LIBERTY throughout all the Land."),
        q("A crack in the Liberty Bell grew in the 1840s, and the bell stopped ringing.", "What stopped the Liberty Bell from regular ringing?", ["A crack in the metal", "A move to the Moon", "A flood in 1964", "A law against bells"], 0, "The bell cracked, was repaired and cracked again. That crack is why it is no longer rung hard.")
      ]},
      "Gateway Arch": { id: "arch", price: 35, questions: [
        q("The Gateway Arch, finished in 1965, is 630 feet tall and 630 feet wide.", "The Gateway Arch was finished in 1965. How tall is it?", ["630 feet", "63 feet", "6,300 feet", "12 feet"], 0, "It is 630 feet tall and 630 feet wide."),
        q("It honors St. Louis as the Gateway to the West, near where Lewis and Clark began their journey in 1804.", "Lewis and Clark began their 1804 journey near which city?", ["St. Louis", "Boston", "Seattle", "Juneau"], 0, "St. Louis, on the Mississippi, was a starting point for the Corps of Discovery."),
        q("The arch is the tallest monument in the United States.", "Which fact is true of the Gateway Arch?", ["It is the tallest monument in the United States", "It is a wooden stockade", "It was dedicated in 1492", "It stands in New York Harbor"], 0, "At 630 feet, the arch is the tallest monument in the country.")
      ]}
    };
  }
  function applyPack(pack) {
    PACK = pack;
    const names = {};
    const eraFact = {};
    pack.eras.forEach((era) => {
      names[era.id] = era.name;
      eraFact[era.id] = String(era.summary || "").split(". ")[0] + ".";
    });
    ERAS = pack.eras.map((era) => era.name);
    BANK.history = pack.questions.map((q) => {
      const era = names[q.era] || q.era;
      if (q.type === "order") {
        return {
          type: "order",
          id: q.id,
          era,
          eraId: q.era,
          fact: eraFact[q.era] || q.explanation,
          question: "Tap these events from earliest to latest. The years stay hidden until you finish.",
          events: q.events.map((ev) => ({ year: ev.year, title: ev.title, text: ev.title })),
          correctOrder: q.correctOrder.slice(),
          explanation: q.explanation
        };
      }
      return {
        type: "choice",
        id: q.id,
        era,
        eraId: q.era,
        year: q.year,
        fact: q.fact,
        question: q.question,
        choices: q.choices.slice(),
        answer: q.answerIndex,
        explanation: q.explanation
      };
    });
    const facts = {};
    pack.states.forEach((row) => { facts[row.state] = row.fact; });
    BANK.states.forEach((row) => { if (facts[row.name]) row.fact = facts[row.name]; });
    const gates = landmarkGates();
    BANK.landmarks = pack.landmarks.map((lm) => {
      const gate = gates[lm.name];
      return { id: gate.id, name: lm.name, price: gate.price, blurb: lm.location, story: lm.story, questions: gate.questions };
    });
  }
  function buildSet(id, station) {
    let qs = [];
    let title = station ? station.name : id;
    if (id === "map") qs = mapQuestions();
    else if (id === "tunnel") {
      const era = (station && station.era) || ERAS[0];
      title = era;
      qs = eraSet(era);
    } else if (id === "rally") qs = rallyQuestions();
    else if (id === "quiz") qs = quizQuestions(session && session.category);
    else return { ok: false, reason: "bad-set" };
    if (qs.length < 3) return { ok: false, reason: "short", total: qs.length };
    return { ok: true, session: { id, title, qs, i: 0, misses: 0, order: [], retry: false, phase: "ask", stars: 0 } };
  }

  function factWords(s) {
    return String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3);
  }
  function sameFact(a, b) {
    const A = factWords(a);
    const B = new Set(factWords(b));
    if (!A.length || !B.size) return false;
    const hit = A.filter((w) => B.has(w)).length;
    return hit >= 4 || hit / Math.min(A.length, B.size) > 0.5;
  }
  function stateExtra(s) {
    const head = "Capital: " + s.capital + ". Nickname: " + s.nickname + ".";
    const fresh = [s.landmark, s.flag].filter((line) => line && !sameFact(s.fact, line));
    return fresh.length ? head + " " + fresh[0] : head;
  }
  function mapQuestions() {
    const v = bag();
    const fresh = BANK.states.filter((s) => v.placed.indexOf(s.name) < 0);
    const pool = (fresh.length >= 3 ? fresh : BANK.states).slice();
    const picked = [];
    while (picked.length < 3 && pool.length) {
      const i = Math.floor(Math.random() * pool.length);
      picked.push(pool.splice(i, 1)[0]);
    }
    return picked.map((s) => ({
      type: "choice",
      state: s.name,
      fact: s.fact,
      question: s.fact + " Which region of the United States is " + s.name + " in?",
      choices: REGIONS.slice(),
      answer: REGIONS.indexOf(s.region),
      explanation: s.name + " is in the " + s.region + ". Capital: " + s.capital + ". Nickname: " + s.nickname + ". " + s.landmark,
      card: { title: s.name, fact: s.fact, extra: stateExtra(s) }
    }));
  }

  function makeBorderQuestion(s) {
    const neighbor = s.neighbors.find((n) => n !== s.name);
    if (!neighbor) return null;
    const wrong = BANK.states.map((x) => x.name).filter((n) => n !== s.name && s.neighbors.indexOf(n) < 0);
    for (let i = wrong.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const swap = wrong[i];
      wrong[i] = wrong[j];
      wrong[j] = swap;
    }
    if (wrong.length < 3) return null;
    return {
      type: "choice",
      fact: s.fact,
      question: "Which of these states shares a border with " + s.name + "?",
      choices: [neighbor, wrong[0], wrong[1], wrong[2]],
      answer: 0,
      explanation: neighbor + " is a neighbor of " + s.name + ". The others on this list are not.",
      postcard: s.name
    };
  }
  function rallyQuestions() {
    const withN = BANK.states.filter((s) => s.neighbors.length);
    const qs = [];
    const used = new Set();
    let guard = 0;
    while (qs.length < 3 && guard < 80) {
      guard++;
      const s = withN[Math.floor(Math.random() * withN.length)];
      if (used.has(s.name)) continue;
      const q = makeBorderQuestion(s);
      if (!q) continue;
      used.add(s.name);
      qs.push(q);
    }
    return qs;
  }
  function contentProblems() {
    const problems = [];
    function checkQ(q, label) {
      if (!q || !q.choices) return;
      const choices = q.choices.map((c) => String(c).trim());
      if (choices.length < 2) problems.push(label + " has too few choices");
      if (new Set(choices.map((c) => c.toLowerCase())).size !== choices.length) problems.push(label + " has duplicate choices");
      if (!(q.answer >= 0 && q.answer < choices.length)) problems.push(label + " is missing its correct answer");
      const match = String(q.question || "").match(/border with (.+)\?$/);
      if (!match) return;
      const subject = match[1];
      const state = BANK.states.find((s) => s.name === subject);
      if (choices.indexOf(subject) >= 0) problems.push(label + " lists " + subject + " as a choice about itself");
      const hits = choices.filter((c) => state && state.neighbors.indexOf(c) >= 0);
      if (hits.length !== 1) problems.push(label + " has " + hits.length + " bordering choices");
      if (!state || state.neighbors.indexOf(choices[q.answer]) < 0) problems.push(label + " correct answer does not border " + subject);
    }
    const capitals = {};
    const flags = {};
    BANK.states.forEach((s) => {
      if (s.neighbors.indexOf(s.name) >= 0) problems.push(s.name + " lists itself as a neighbor");
      capitals[s.capital] = (capitals[s.capital] || 0) + 1;
      if (s.flag) flags[s.flag] = (flags[s.flag] || 0) + 1;
      if (!s.neighbors.length) return;
      const neighbor = s.neighbors.find((n) => n !== s.name);
      const wrong = BANK.states.map((x) => x.name).filter((n) => n !== s.name && s.neighbors.indexOf(n) < 0);
      checkQ({
        question: "Which of these states shares a border with " + s.name + "?",
        choices: [neighbor, wrong[0], wrong[1], wrong[2]],
        answer: 0
      }, "border " + s.name);
    });
    Object.keys(capitals).forEach((cap) => {
      if (capitals[cap] !== 1) problems.push(cap + " is the capital of more than one state");
    });
    Object.keys(flags).forEach((line) => {
      if (flags[line] !== 1) problems.push("duplicate flag fact");
    });
    BANK.states.forEach((s) => {
      const others = BANK.states.filter((x) => x.name !== s.name);
      const capitalChoices = [s.name, others[0].name, others[1].name, others[2].name];
      if (new Set(capitalChoices).size !== capitalChoices.length) problems.push(s.name + " capital choices repeat");
      const hits = capitalChoices.filter((name) => BANK.states.some((x) => x.name === name && x.capital === s.capital));
      if (hits.length !== 1) problems.push(s.name + " capital question has " + hits.length + " correct states");
    });
    BANK.history.forEach((q, i) => checkQ(q, "history " + (q.id || i)));
    const gates = landmarkGates();
    Object.keys(gates).forEach((name) => gates[name].questions.forEach((q, i) => checkQ(q, name + " " + i)));
    BANK.states.forEach((s) => {
      if (REGIONS.indexOf(s.region) < 0) problems.push(s.name + " has no region choice");
    });
    return problems;
  }

  function quizQuestions(category) {
    const cat = category || "Capitals";
    const qs = [];
    const states = BANK.states.slice();
    function take() { return states.splice(Math.floor(Math.random() * states.length), 1)[0]; }
    if (cat === "Flags") {
      const flagged = BANK.states.filter((s) => s.flag);
      while (qs.length < 3) {
        const s = flagged[qs.length % flagged.length];
        const others = BANK.states.filter((x) => x.name !== s.name);
        qs.push({
          type: "choice",
          fact: s.flag,
          question: s.flag + " Which state is that?",
          choices: [s.name, others[0].name, others[1].name, others[2].name],
          answer: 0,
          explanation: s.flag
        });
      }
      return qs;
    }
    if (cat === "History") {
      const pool = BANK.history.filter((q) => q.type === "choice");
      const picked = [];
      const copy = pool.slice();
      while (picked.length < 3 && copy.length) picked.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
      return picked.map((q) => Object.assign({}, q, { choices: q.choices.slice() }));
    }
    if (cat === "Geography") return rallyQuestions();
    if (cat.indexOf("Which") === 0) {
      while (qs.length < 3) {
        const s = take();
        const others = BANK.states.filter((x) => x.name !== s.name);
        qs.push({
          type: "choice",
          fact: s.fact,
          question: s.fact + " Which state am I?",
          choices: [s.name, others[1].name, others[2].name, others[3].name],
          answer: 0,
          explanation: s.name + ": " + s.landmark
        });
      }
      return qs;
    }
    while (qs.length < 3) {
      const s = take();
      const others = BANK.states.filter((x) => x.capital !== s.capital);
      qs.push({
        type: "choice",
        fact: s.capital + " is the capital of " + s.name + ".",
        question: s.capital + " is the capital of which state?",
        choices: [s.name, others[0].name, others[1].name, others[2].name],
        answer: 0,
        explanation: s.capital + " is the capital of " + s.name + "."
      });
    }
    return qs;
  }

  function gradeChoice(q, choice) {
    return choice === q.answer;
  }

  function answer(choice) {
    if (!session) return { ok: false, reason: "closed" };
    if (session.phase === "practice") return answerPractice(choice);
    const q = session.qs[session.i];
    if (!q) return { ok: false, reason: "done" };
    if (q.type === "order") return answerOrder(choice);
    const right = gradeChoice(q, choice);
    return finishAttempt(right);
  }

  function answerOrder(choice) {
    const q = session.qs[session.i];
    if (session.order.indexOf(choice) >= 0) return { ok: false, reason: "repeat" };
    session.order.push(choice);
    const sorted = q.events.map((ev, i) => ({ i, year: ev.year })).sort((a, b) => a.year - b.year || a.i - b.i);
    const order = q.correctOrder || sorted.map((row) => row.i);
    const expect = order[session.order.length - 1];
    if (choice !== expect) {
      session.order = [];
      return finishAttempt(false);
    }
    if (session.order.length < q.events.length) {
      renderAsk();
      return { ok: true, right: true, partial: true, score: coins() };
    }
    return finishAttempt(true);
  }

  function finishAttempt(right) {
    const q = session.qs[session.i];
    if (!right) {
      session.misses += 1;
      session.phase = "tutor";
      renderTutor();
      return { ok: true, right: false, score: coins(), tutorial: true };
    }
    let gain = 0;
    if (session.mode !== "gate") gain = payout(session.id, !session.retry);
    if (session.id === "map" && q.state && bag().placed.indexOf(q.state) < 0) {
      bag().placed.push(q.state);
      refreshMap();
    }
    if (session.id === "rally" && q.postcard && bag().postcards.indexOf(q.postcard) < 0) bag().postcards.push(q.postcard);
    if (session.id === "quiz") session.stars += 1;
    const regionDone = session.id === "map" ? markRegion(q.state) : null;
    session.lastFact = q.card || { title: q.person || "Fact", fact: q.fact, extra: q.explanation, postcard: q.postcard || "" };
    session.phase = "fact";
    session.pendingRegion = regionDone;
    persist();
    renderFact(regionDone ? regionDone + " flag is up." : "");
    return { ok: true, right: true, gain, score: coins(), fact: session.lastFact, region: regionDone };
  }

  function markRegion(stateName) {
    const st = byName(stateName);
    if (!st) return null;
    const all = BANK.states.filter((s) => s.region === st.region).map((s) => s.name);
    const have = all.every((name) => bag().placed.indexOf(name) >= 0);
    if (!have || bag().flags[st.region]) return null;
    bag().flags[st.region] = 1;
    raiseFlag(st.region);
    return st.region;
  }

  function answerPractice(choice) {
    const q = session.practice;
    if (choice !== q.answer) {
      showCard(`<h2>Look again</h2><p>${esc(q.explanation)}</p><button id="liberty-next">Try the practice once more</button>`);
      session.phase = "practice-retry";
      return { ok: true, right: false, practice: true, score: coins() };
    }
    session.phase = "ask";
    session.retry = true;
    session.order = [];
    renderAsk();
    return { ok: true, right: true, practice: true, score: coins() };
  }

  function advance() {
    if (!session) return { ok: false };
    if (session.phase === "tutor") {
      session.practice = practiceFor(session.qs[session.i]);
      session.phase = "practice";
      renderPractice();
      return { ok: true, phase: "practice" };
    }
    if (session.phase === "practice-retry") {
      session.phase = "practice";
      renderPractice();
      return { ok: true, phase: "practice" };
    }
    if (session.phase === "fact") {
      session.i += 1;
      session.order = [];
      session.retry = false;
      if (session.i >= session.qs.length) return completeSet();
      session.phase = "ask";
      renderAsk();
      return { ok: true, phase: "ask", index: session.i };
    }
    return { ok: false, phase: session.phase };
  }

  function completeSet() {
    const v = bag();
    if (session.mode === "gate") return finishGate();
    v.cleared[session.id] = 1;
    if (session.id === "quiz") {
      v.quiz.rounds += 1;
      v.quiz.stars += session.stars;
      v.quiz.best = Math.max(v.quiz.best || 0, session.stars);
    }
    persist();
    renderDone();
    return { ok: true, done: true, score: coins(), stars: session.stars, id: session.id };
  }

  function startBuild(id) {
    const lm = BANK.landmarks.find((m) => m.id === id);
    if (!lm) return { ok: false, reason: "missing" };
    if (bag().landmarks[id]) return { ok: false, reason: "owned", score: coins() };
    if (coins() < lm.price) return { ok: false, reason: "short", score: coins(), price: lm.price };
    session = {
      id: "builder",
      mode: "gate",
      landmark: lm,
      title: lm.name,
      qs: lm.questions.map((q) => Object.assign({ type: "choice", fact: q.fact }, q)),
      i: 0, misses: 0, order: [], retry: false, phase: "ask"
    };
    renderAsk();
    return { ok: true, id, price: lm.price, total: 3 };
  }

  function finishGate() {
    if (session.phase === "done") return { ok: true, built: session.landmark && session.landmark.id, score: coins() };
    session.phase = "done";
    const lm = session.landmark;
    if (coins() < lm.price) {
      showCard(`<h2>Not enough coins</h2><p>${lm.name} costs ${lm.price}. You have ${coins()}.</p><button id="liberty-exit">Close</button>`);
      return { ok: false, reason: "short", score: coins() };
    }
    let score = setCoins(coins() - lm.price);
    let refund = 0;
    if (session.misses === 0) { refund = 1; score = setCoins(score + 1); }
    bag().landmarks[lm.id] = 1;
    persist();
    buildMonument(lm.id);
    mountPlot(lm.id);
    const titled = /^the /i.test(lm.name) ? lm.name : "the " + lm.name;
    let pay = "You built " + titled + "! -" + lm.price + " coins";
    if (refund) pay += ". You got 1 coin back for a perfect first try.";
    showCard(`<h2>${esc(lm.name)}</h2><div class="liberty-fact" id="liberty-fact"><b>Why it matters</b><p>${esc(lm.story)}</p></div><p>${esc(pay)}</p><button id="liberty-exit">Close</button>`);
    return { ok: true, built: lm.id, price: lm.price, refund, score };
  }

  function spinWheel() {
    const cats = ["Capitals", "Flags", "History", "Geography", "Which state am I?"];
    const pick = Math.floor(Math.random() * cats.length);
    session.spin = (session.spin || 0) + 720 + pick * 72;
    session.category = cats[pick];
    const built = buildSet("quiz", { name: "Fifty-State Quiz Show" });
    if (!built.ok) return built;
    const keepSpin = session.spin;
    const category = session.category;
    session = built.session;
    session.spin = keepSpin;
    session.category = category;
    session.mode = "play";
    renderAsk();
    return { ok: true, category, total: 3 };
  }

  function raiseFlag(region) {
    if (!flags[region] || !kit()) return;
    flags[region].cloth.visible = true;
    flags[region].pole.visible = true;
  }

  function buildMonument(id) {
    if (monuments[id]) monuments[id].visible = true;
  }

  function findPeak() {
    const anchor = { x: 175, z: 231 };
    let best = null;
    CA.scene.traverse((o) => {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes || !o.geometry.attributes.position) return;
      const pos = o.geometry.attributes.position;
      if (pos.count < 2000) return;
      const col = o.geometry.attributes.color;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        if (y < 7) continue;
        const x = pos.getX(i);
        const z = pos.getZ(i);
        if (Math.hypot(x - anchor.x, z - anchor.z) > 36) continue;
        if (!best || y > best.y) best = { x, y, z, r: col ? col.getX(i) : 0, g: col ? col.getY(i) : 1 };
      }
    });
    return best || { x: anchor.x, y: 10, z: anchor.z };
  }
  function toFS(dx, dz) {
    return { f: (dx * lay.fx + dz * lay.fz) / GROW, s: (dx * lay.rx + dz * lay.rz) / GROW };
  }
  function worldFS(f, s) {
    return { x: lay.fx * f * GROW + lay.rx * s * GROW, z: lay.fz * f * GROW + lay.rz * s * GROW };
  }
  function smoothstep(t) {
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return t * t * (3 - 2 * t);
  }
  function hsh(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function massifDome(f, s) {
    const u = (f + 0.15) / 5.4;
    const v = (s - 0.15) / 14.2;
    const lump = Math.sin(s * 0.33 + 0.4) * 0.55
      + Math.sin(s * 0.72 + f * 0.2) * 0.28
      + Math.cos(f * 0.5 + 0.6) * 0.18;
    let h = 24.8 * Math.exp(-(u * u * 0.72 + v * v * 0.3));
    h += lump * Math.exp(-(u * u + v * v) * 0.45);
    const edge = Math.max(0, Math.abs(s) - 7.5);
    h *= Math.exp(-(edge * edge) / 26);
    h += 3.2 * Math.exp(-((f + 0.8) * (f + 0.8)) / 18 - ((s - 9.5) * (s - 9.5)) / 16);
    h += 2.8 * Math.exp(-((f + 0.4) * (f + 0.4)) / 16 - ((s + 9.2) * (s + 9.2)) / 18);
    return h;
  }
  function cliffLine(s) {
    return 1.7 + 0.18 * Math.sin(s * 0.28);
  }
  function massifH(f, s) {
    const face = cliffLine(s);
    if (f <= face) return ruggedRock(f, s, massifDome(f, s));
    const lip = massifDome(face, s);
    const ahead = f - face;
    const drop = smoothstep(Math.min(1, ahead / 1.05));
    const fan = Math.exp(-(s * s) / 14) * Math.exp(-Math.pow((ahead - 1.15) / 1.7, 2));
    const talusH = 1.12 + fan * 3.6;
    let h = lip * (1 - drop) + talusH * drop;
    const spill = Math.max(0, (Math.abs(s) - 3.6) / 1.5, (ahead - 3.1) / 1.2);
    if (spill > 0) {
      const u = smoothstep(Math.min(1, spill));
      h = h * (1 - u) + 1.12 * u;
    }
    return ruggedRock(f, s, h);
  }
  function ruggedRock(f, s, h) {
    if (h < 6.5 || inMouth(f, s)) return h;
    const cf = Math.round(f * 2.1) / 2.1;
    const cs = Math.round(s * 2.6) / 2.6;
    const cell = Math.sin(cf * 3.7 + cs * 2.9) * Math.cos(cs * 4.8 - cf * 1.4);
    const ledge = Math.sin(cs * 2.2 + 0.4) > 0.2 ? 0.62 : -0.22;
    const crack = Math.abs(Math.sin(s * 8.4 + f * 2.7)) < 0.045 ? -0.85 : 0;
    const amp = h > 16 ? 0.55 : 0.95;
    let add = (cell * 0.85 + ledge + crack) * amp;
    if (h > 22) add *= 0.3;
    return h + add;
  }
  function rockPlanes(f, s) {
    return [massifH(f, s)];
  }
  function shoreOf(f, s) {
    const a = Math.atan2(s, f);
    const dock = Math.exp(-(a * a) / 1.7) * 4.6;
    const cove = -3.5 * Math.exp(-Math.pow((a - 2.2) / 0.5, 2));
    const bulge = 3.3 * Math.exp(-Math.pow((a + 1.2) / 0.62, 2));
    return SHORE * (27.4
      + 3.2 * Math.sin(a * 2 + 0.3)
      + 1.55 * Math.sin(a * 3 + 0.85)
      + dock + cove + bulge);
  }
  function beachOf(f, s) {
    const a = Math.atan2(s, f);
    return 2.15 + 0.9 * Math.sin(a * 2 + 0.5) + 0.55 * Math.sin(a * 3 + 1.8);
  }
  function facetNoise(f, s) {
    return Math.sin(f * 0.42 + 0.6) * Math.cos(s * 0.37 + 0.2) * 0.16
      + Math.sin(f * 0.85 - s * 0.5 + 1.1) * 0.07;
  }
  function outcropAt(f, s) {
    const d = Math.hypot(f, s);
    const shore = shoreOf(f, s);
    if (d < 7.5 || d > shore - 5.5) return 0;
    if (inMouth(f, s) || inRoomFS(f, s)) return 0;
    if (Math.abs(s) < 2.4 && f > 18) return 0;
    const spots = [LAYOUT.map, LAYOUT.tunnel, LAYOUT.builder, LAYOUT.quiz, LAYOUT.table, LAYOUT.plot];
    for (let i = 0; i < spots.length; i++) {
      if (Math.hypot(f - spots[i][0], s - spots[i][1]) < 3.4) return 0;
    }
    const cellF = Math.round(f * 0.42);
    const cellS = Math.round(s * 0.42);
    const spike = hsh(cellF * 8.3 + cellS * 4.9 + 1.2);
    if (d > shore - 9) return 0;
    if (spike < 0.74) return 0;
    return 0.45 + (spike - 0.74) * 3.2;
  }
  function inMouth(f, s) {
    return f > CAVE.f - 2.6 && f < CAVE.f + 6.8 && Math.abs(s - CAVE.s) < 2.5;
  }
  function inRoomFS(f, s) {
    const side = Math.abs(s - CAVE.s);
    const depth = CAVE.f - f;
    if (depth < -0.35 || depth > 6.4 || side >= 2.15) return false;
    if (depth < 0.9 && side >= 1.7) return false;
    return true;
  }
  function rockTop(f, s) {
    if (inRoomFS(f, s)) return 1.22 * GROW;
    const planes = rockPlanes(f, s);
    let rock = planes[0];
    for (let i = 1; i < planes.length; i++) if (planes[i] > rock) rock = planes[i];
    if (f > CAVE.f - 2 && f < CAVE.f + 6 && Math.abs(s - CAVE.s) < 2.6) rock = Math.min(rock, 1.35 + Math.max(0, (f - CAVE.f) * 0.05));
    if (inMouth(f, s)) rock = Math.min(rock, 1.26);
    return rock * GROW;
  }
  function knob(f, s, cf, cs, radius, height, power) {
    const ang = Math.atan2(s - cs, f - cf);
    let warp = 1 + 0.2 * Math.sin(ang * 2 + cf * 0.7) + 0.12 * Math.sin(ang * 3 + 1.2);
    if (warp < 0.8) warp = 0.8;
    const u = Math.hypot(f - cf, s - cs) / (radius * warp);
    if (u >= 1) return 0;
    return height * Math.pow(1 - u, power);
  }
  function ridge(f, s) {
    let rock = 0;
    rock = Math.max(rock, knob(f, s, -5.2, 0.6, 8.4, 13.6, 1.28));
    rock = Math.max(rock, knob(f, s, -2.2, -6.4, 6.6, 9.2, 1.42));
    rock = Math.max(rock, knob(f, s, -4.6, 6.2, 6.2, 8.1, 1.48));
    rock = Math.max(rock, knob(f, s, 0.8, -1.6, 5.6, 4.4, 1.62));
    if (rock <= 0.05) return 0;
    rock += facetNoise(f, s);
    return rock > 0 ? rock : 0;
  }
  function lowland(f, s) {
    const d = Math.hypot(f, s);
    const shore = shoreOf(f, s);
    if (d > shore + 9) return null;
    let grass = 1.06
      + Math.sin(f * 0.14 + 0.5) * Math.cos(s * 0.11 + 0.25) * 0.14
      + Math.sin(f * 0.06 - s * 0.05 + 1.2) * 0.08;
    let y = grass;
    let rockH = 0;
    rockPlanes(f, s).forEach((p) => { if (p > rockH) rockH = p; });
    if (inMouth(f, s)) rockH = Math.min(rockH, 1.26);
    if (rockH > grass + 0.2) {
      const u = smoothstep(Math.min(1, (rockH - grass) / 1.8));
      y = grass + (rockH - grass) * u;
    }
    const pads = [LAYOUT.map, LAYOUT.builder, LAYOUT.quiz, LAYOUT.table, LAYOUT.flag];
    for (let i = 0; i < pads.length; i++) {
      const pd = Math.hypot(f - pads[i][0], s - pads[i][1]);
      if (pd >= 4.4) continue;
      const u = smoothstep(pd / 4.4);
      const flat = Math.min(Math.max(y, 0.98), 1.18);
      y = flat * (1 - u) + y * u;
    }
    const band = shore - d;
    const beach = beachOf(f, s) * 1.45;
    const waterU = -0.55 / GROW;
    const lip = waterU - 0.015;
    if (band >= 0 && band < beach) {
      const u = band / beach;
      const blend = u * u * (3 - 2 * u);
      y = lip + (y - lip) * blend;
    } else if (band < 0) {
      y = lip;
    }
    if (inMouth(f, s)) y = Math.min(y, 1.26);
    return y * GROW;
  }
  function heightFS(f, s) {
    return lowland(f, s);
  }
  function sampleGround(dx, dz) {
    if (!lay) return null;
    const q = toFS(dx, dz);
    if (q.f > 24.2 && q.f < 37.4 && Math.abs(q.s) < 1.45) return 0.52 * GROW;
    if (inRoomFS(q.f, q.s)) return 1.22 * GROW;
    return heightFS(q.f, q.s);
  }
  function inCaveFS(q) {
    return q.f > CAVE.f - 2.6 && q.f < CAVE.f - 0.4 && Math.abs(q.s - CAVE.s) < 1.55;
  }
  function caveLocal(wx, wy, wz) {
    const dx = wx - caveAnchor.x;
    const dz = wz - caveAnchor.z;
    const yaw = caveAnchor.yaw;
    return {
      x: dx * Math.cos(yaw) - dz * Math.sin(yaw),
      y: wy - caveAnchor.y,
      z: dx * Math.sin(yaw) + dz * Math.cos(yaw)
    };
  }
  function caveWorld(lx, ly, lz) {
    const yaw = caveAnchor.yaw;
    return {
      x: caveAnchor.x + lx * Math.cos(yaw) + lz * Math.sin(yaw),
      y: caveAnchor.y + ly,
      z: caveAnchor.z - lx * Math.sin(yaw) + lz * Math.cos(yaw)
    };
  }
  function captainInRoom(pos) {
    if (!caveAnchor || !pos) return false;
    const q = caveLocal(pos.x, pos.y, pos.z);
    return Math.abs(q.x) < 1.85 && q.z < -0.45 && q.z > -6.2 && q.y > -0.5 && q.y < 3.2;
  }
  function dropOldShore() {
    const turtle = (CA.isl.L || []).find((j) => j.id === "turtle");
    const doomed = [];
    const K = kit();
    CA.scene.traverse((o) => {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes || !o.geometry.attributes.position) return;
      if (o.parent && o.parent.name === "v51-root") return;
      const name = o.name || "";
      if (/turtle|pirate|parrot|lair|whale|dolphin|light|buoy|boat/i.test(name)) return;
      const pos = o.geometry.attributes.position;
      if (pos.count < 8000) return;
      const xz = (i) => ({ x: pos.getX(i), z: pos.getZ(i) });
      const close = (i) => {
        const p = xz(i);
        return Math.hypot(p.x - host.x, p.z - host.z) < 74;
      };
      const seabed = o.material && o.material.color && o.material.color.getHex && o.material.color.getHex() === 0x1565c0 && !o.material.vertexColors;
      if (seabed) {
        let sunk = false;
        for (let i = 0; i < pos.count; i++) {
          if (!close(i) || pos.getY(i) <= -1.25) continue;
          pos.setY(i, -1.7);
          sunk = true;
        }
        if (sunk) {
          pos.needsUpdate = true;
          o.geometry.computeVertexNormals();
        }
        return;
      }
      const index = o.geometry.index;
      if (!index) {
        const next = [];
        const color = o.geometry.attributes.color;
        const colors = [];
        let dropped = 0;
        for (let i = 0; i + 2 < pos.count; i += 3) {
          const pa = xz(i);
          const pb = xz(i + 1);
          const pc = xz(i + 2);
          const mx = (pa.x + pb.x + pc.x) / 3;
          const mz = (pa.z + pb.z + pc.z) / 3;
          const near = close(i) || close(i + 1) || close(i + 2);
          const land = pos.getY(i) > -0.48 || pos.getY(i + 1) > -0.48 || pos.getY(i + 2) > -0.48;
          const allInTurtle = turtle && [i, i + 1, i + 2].every((k) => Math.hypot(pos.getX(k) - turtle.cx, pos.getZ(k) - turtle.cz) < turtle.R + 2);
          if (near && land && !allInTurtle) {
            dropped++;
            continue;
          }
          for (let k = 0; k < 3; k++) {
            next.push(pos.getX(i + k), pos.getY(i + k), pos.getZ(i + k));
            if (color) colors.push(color.getX(i + k), color.getY(i + k), color.getZ(i + k));
          }
        }
        if (!dropped) return;
        o.geometry.setAttribute("position", new K.Attr(new Float32Array(next), 3));
        if (color) o.geometry.setAttribute("color", new K.Attr(new Float32Array(colors), 3));
        o.geometry.deleteAttribute("normal");
        o.geometry.computeVertexNormals();
        if (!next.length) doomed.push(o);
        return;
      }
      const keep = [];
      let dropped = 0;
      for (let t = 0; t < index.count; t += 3) {
        const a = index.getX(t);
        const b = index.getX(t + 1);
        const c = index.getX(t + 2);
        const pa = xz(a);
        const pb = xz(b);
        const pc = xz(c);
        const mx = (pa.x + pb.x + pc.x) / 3;
        const mz = (pa.z + pb.z + pc.z) / 3;
        const near = close(a) || close(b) || close(c);
        const land = pos.getY(a) > -0.48 || pos.getY(b) > -0.48 || pos.getY(c) > -0.48;
        const allInTurtle = turtle && [a, b, c].every((k) => Math.hypot(pos.getX(k) - turtle.cx, pos.getZ(k) - turtle.cz) < turtle.R + 2);
        if (near && land && !allInTurtle) {
          dropped++;
          continue;
        }
        keep.push(a, b, c);
      }
      if (!dropped) return;
      o.geometry.setIndex(new K.Attr(new Uint32Array(keep), 1));
      o.geometry.computeVertexNormals();
      if (!keep.length) doomed.push(o);
    });
    doomed.forEach((o) => {
      o.visible = false;
      if (o.parent) o.parent.remove(o);
    });
  }
  function mixHex(K, a, b, t) {
    const col = new K.Color(a);
    col.lerp(new K.Color(b), t < 0 ? 0 : t > 1 ? 1 : t);
    return col;
  }
  function toneAt(f, s) {
    return 0.5
      + 0.5 * Math.sin(f * 0.085 + 0.7) * Math.cos(s * 0.07 + 0.4)
      + 0.16 * Math.sin(f * 0.04 - s * 0.035 + 1.3);
  }
  function faceColor(y, f, s) {
    const K = kit();
    const h = y / GROW;
    const t = toneAt(f, s);
    const sand = mixHex(K, 0xf6e0b8, 0xd7b57a, t);
    const wet = mixHex(K, 0xc4a06a, 0x9a7344, t);
    const grass = mixHex(K, 0x5cb85c, 0x2f7d38, t);
    const granite = mixHex(K, 0xd5cfc3, 0xb3ada2, t);
    const talusC = mixHex(K, 0xc8c2b6, 0xb0a898, t);
    const pines = mixHex(K, 0x1c4630, 0x143628, t);
    const face = cliffLine(s);
    const ahead = f - face;
    let col = grass.clone();
    if (h < 0.1) col = wet;
    else if (h < 0.72) {
      const u = Math.max(0, Math.min(1, (h - 0.1) / 0.62));
      sand.lerp(grass, u * u * u);
      col = sand;
    }
    const onCliff = h > 7.5 && ahead < 1.6 && ahead > -3 && Math.abs(s) < 12;
    const onSummit = h > 10 && ahead <= 0.5 && Math.abs(s) < 12;
    const onTalus = Math.abs(s) < 3.3 && ahead > 0.65 && ahead < 3.2 && h > 1.7 && h < 6.5;
    const onForest = h > 1.35 && h < 7.2 && !onTalus && !onCliff && Math.hypot(f, s) > 3.2 && Math.hypot(f, s) < 14;
    if (onSummit || onCliff) {
      col = granite.clone();
      const grit = 0.5 + 0.5 * Math.sin(f * 2.6 + s * 1.7) * Math.cos(s * 3.1 - f * 0.8);
      col.lerp(mixHex(K, 0xc4bba8, 0x7d776f, t), 0.08 + grit * 0.42);
      if (Math.abs(Math.sin(f * 6.4 + s * 4.8)) < 0.07) col.lerp(mixHex(K, 0x5c564f, 0x3c3834, 0.5), 0.55);
    } else if (onTalus) col = talusC;
    else if (onForest) col.lerp(pines, smoothstep((h - 1.3) / 2.2) * 0.85);
    const band = shoreOf(f, s) - Math.hypot(f, s);
    if (band < 2.5 && h < 1.2) {
      col.lerp(wet, smoothstep((2.5 - Math.max(band, 0)) / 2.5) * 0.9);
    }
    return col;
  }
  function gridMesh(K, N, half, sample, skip) {
    const positions = [];
    const colors = [];
    const index = [];
    for (let iz = 0; iz <= N; iz++) {
      for (let ix = 0; ix <= N; ix++) {
        const f = -half + (ix / N) * half * 2;
        const s = -half + (iz / N) * half * 2;
        const y = sample(f, s);
        const w = worldFS(f, s);
        const col = faceColor(y == null ? -1 : y, f, s);
        positions.push(host.x + w.x, y == null ? -1.4 : y, host.z + w.z);
        colors.push(col.r, col.g, col.b);
      }
    }
    for (let iz = 0; iz < N; iz++) {
      for (let ix = 0; ix < N; ix++) {
        const f = -half + ((ix + 0.5) / N) * half * 2;
        const s = -half + ((iz + 0.5) / N) * half * 2;
        if (skip(f, s)) continue;
        const a = iz * (N + 1) + ix;
        const b = a + 1;
        const c = a + N + 1;
        const d = c + 1;
        index.push(a, d, b, a, c, d);
      }
    }
    const geo = new K.Geo();
    geo.setAttribute("position", new K.Attr(new Float32Array(positions), 3));
    geo.setAttribute("color", new K.Attr(new Float32Array(colors), 3));
    geo.setIndex(index);
    geo.computeVertexNormals();
    return geo;
  }
  function buildTerrain(K) {
    const A = 720;
    const fracs = [];
    for (let i = 0; i <= 46; i++) {
      const t = i / 46;
      fracs.push(t < 0.62 ? (t / 0.62) * 0.38 : 0.38 + ((t - 0.62) / 0.38) * 0.62);
    }
    const R = fracs.length - 1;
    const skirt = 0;
    const positions = [];
    const colors = [];
    const index = [];
    for (let ia = 0; ia <= A; ia++) {
      const ang = (ia / A) * Math.PI * 2;
      const cf = Math.cos(ang);
      const cs = Math.sin(ang);
      const shore = shoreOf(cf, cs);
      for (let ir = 0; ir <= R; ir++) {
        const rad = fracs[ir] * (shore + skirt);
        const f = cf * rad;
        const s = cs * rad;
        const y = lowland(f, s);
        const w = worldFS(f, s);
        const col = faceColor(y == null ? -2 : y, f, s);
        positions.push(host.x + w.x, y == null ? -2 : y, host.z + w.z);
        colors.push(col.r, col.g, col.b);
      }
    }
    const stride = R + 1;
    for (let ia = 0; ia < A; ia++) {
      for (let ir = 0; ir < R; ir++) {
        const a = ia * stride + ir;
        const b = a + 1;
        const c = a + stride;
        const d = c + 1;
        index.push(a, c, b, b, c, d);
      }
    }
    const geo = new K.Geo();
    geo.setAttribute("position", new K.Attr(new Float32Array(positions), 3));
    geo.setAttribute("color", new K.Attr(new Float32Array(colors), 3));
    geo.setIndex(index);
    geo.computeVertexNormals();
    const mesh = new K.Mesh(geo, new K.Lambert({ vertexColors: true }));
    mesh.receiveShadow = true;
    mesh.name = "v51-terrain";
    mesh.userData.nofade = 1;
    return mesh;
  }
  function spot(f, s) {
    const w = worldFS(f, s);
    const y = sampleGround(w.x, w.z);
    return { f: f, s: s, x: w.x, z: w.z, wx: host.x + w.x, wz: host.z + w.z, y: y == null ? 0.4 : y };
  }
  function place(root, mesh, f, s, dy) {
    const p = spot(f, s);
    mesh.position.set(p.wx, p.y + (dy || 0), p.wz);
    root.add(mesh);
    return mesh;
  }
  function ribbon(K, root, points, half, hex, stone) {
    const samples = [];
    points.forEach((line) => {
      for (let i = 0; i < line.length - 1; i++) {
        const a = line[i];
        const b = line[i + 1];
        const dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const n = Math.max(1, Math.ceil(dist / 1.05));
        for (let k = 0; k < n; k++) {
          const t = k / n;
          samples.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
        }
      }
      const last = line[line.length - 1];
      samples.push([last[0], last[1]]);
    });
    const world = samples.map((p) => spot(p[0], p[1]));
    const pos = [];
    const col = [];
    const Kc = new K.Color(hex);
    for (let i = 0; i < world.length - 1; i++) {
      const p = world[i];
      const q = world[i + 1];
      const dx = q.wx - p.wx;
      const dz = q.wz - p.wz;
      const len = Math.hypot(dx, dz) || 1;
      if (len < 0.08 || len > 4) continue;
      if (p.y > 2.5 || q.y > 2.5) continue;
      if (p.y < 0.2 || q.y < 0.2) continue;
      if (Math.abs(p.y - q.y) > 0.7) continue;
      const px = -dz / len * half;
      const pz = dx / len * half;
      const y0 = p.y + 0.07;
      const y1 = q.y + 0.07;
      [p.wx + px, y0, p.wz + pz, p.wx - px, y0, p.wz - pz, q.wx - px, y1, q.wz - pz, p.wx + px, y0, p.wz + pz, q.wx - px, y1, q.wz - pz, q.wx + px, y1, q.wz + pz].forEach((v, k) => {
        pos.push(v);
        if (k % 3 === 0) col.push(Kc.r, Kc.g, Kc.b);
      });
    }
    if (!pos.length) return;
    const geo = new K.Geo();
    geo.setAttribute("position", new K.Attr(new Float32Array(pos), 3));
    geo.setAttribute("color", new K.Attr(new Float32Array(col), 3));
    geo.computeVertexNormals();
    const mesh = new K.Mesh(geo, new K.Lambert({ vertexColors: true, side: 2 }));
    mesh.name = "v51-path";
    mesh.userData.nofade = 1;
    mesh.receiveShadow = true;
    root.add(mesh);
    const capMat = new K.Lambert({ color: hex });
    const seen = {};
    points.forEach((line) => line.forEach((p) => {
      const key = p[0].toFixed(1) + "," + p[1].toFixed(1);
      if (seen[key]) return;
      seen[key] = 1;
      const disc = new K.Mesh(new K.Cyl(half, half, 0.06, 10), capMat);
      disc.name = "v51-path";
      disc.userData.nofade = 1;
      place(root, disc, p[0], p[1], 0.08);
    }));
    return mesh;
  }
  function mergedMesh(K, list) {
    const positions = [];
    list.forEach((m) => {
      m.updateWorldMatrix(true, false);
      const e = m.matrixWorld.elements;
      const p = m.geometry.attributes.position;
      const index = m.geometry.index;
      const count = index ? index.count : p.count;
      for (let i = 0; i < count; i++) {
        const vi = index ? index.getX(i) : i;
        const x = p.getX(vi);
        const y = p.getY(vi);
        const z = p.getZ(vi);
        positions.push(
          e[0] * x + e[4] * y + e[8] * z + e[12],
          e[1] * x + e[5] * y + e[9] * z + e[13],
          e[2] * x + e[6] * y + e[10] * z + e[14]
        );
      }
    });
    const geo = new K.Geo();
    geo.setAttribute("position", new K.Attr(new Float32Array(positions), 3));
    geo.computeVertexNormals();
    const mesh = new K.Mesh(geo, list[0].material);
    mesh.castShadow = !!list[0].castShadow;
    mesh.receiveShadow = !!list[0].receiveShadow;
    return mesh;
  }
  function bakeNamed(K, root, name) {
    const meshes = [];
    root.traverse((o) => { if (o.isMesh && o.name === name && o.geometry) meshes.push(o); });
    const groups = {};
    meshes.forEach((m) => {
      if (!m.material || m.geometry.attributes.color || m.material.map) return;
      const hex = m.material.color ? m.material.color.getHexString() : "0";
      const key = hex + (m.material.transparent ? "t" : "");
      (groups[key] = groups[key] || []).push(m);
    });
    Object.keys(groups).forEach((key) => {
      const list = groups[key];
      if (list.length < 2) return;
      const mesh = mergedMesh(K, list);
      mesh.name = name;
      root.add(mesh);
      list.forEach((m) => { if (m.parent) m.parent.remove(m); });
    });
  }
  function bakeIsland(K, root) {
    ["v51-bush", "v51-flower", "v51-stem", "v51-rock", "v51-foam", "v51-dock", "v51-path", "v51-bulb"].forEach((name) => bakeNamed(K, root, name));
  }
  function dress() {
    const K = kit();
    if (!K || !CA.scene || !CA.isl || CA.scene.getObjectByName("v51-root")) return;
    const peak = findPeak();
    const turtle = (CA.isl.L || []).find((j) => j.id === "turtle");
    let shiftX = 0;
    let shiftZ = 0;
    if (turtle) {
      const awayX = peak.x - turtle.cx;
      const awayZ = peak.z - turtle.cz;
      const away = Math.hypot(awayX, awayZ) || 1;
      shiftX = awayX / away * 12;
      shiftZ = awayZ / away * 12;
    }
    const center = { x: peak.x + shiftX, z: peak.z + shiftZ };
    const homeX = -center.x;
    const homeZ = -center.z;
    const span = Math.hypot(homeX, homeZ) || 1;
    lay = {
      fx: homeX / span, fz: homeZ / span, rx: -homeZ / span, rz: homeX / span,
      yaw: Math.atan2(homeX, homeZ),
      at(forward, side) { return worldFS(forward, side); }
    };
    host = { x: center.x, z: center.z, y: peak.y, land: { x: center.x, z: center.z }, dock: { x: center.x, z: center.z } };
    const landOff = lay.at(21.6, 1.2);
    const dockOff = lay.at(40, 0);
    host.land = { x: center.x + landOff.x, z: center.z + landOff.z };
    host.dock = { x: center.x + dockOff.x, z: center.z + dockOff.z };
    isle = {
      id: "liberty-mount",
      cx: center.x,
      cz: center.z,
      R: 46,
      yaw: lay.yaw,
      ground(x, z) {
        const y = sampleGround(x - center.x, z - center.z);
        return y == null ? 0.2 : y;
      },
      landSpot: host.land,
      boatSpot: host.dock
    };
    mountainBlock = { x: center.x, z: center.z, r: 6.2 };
    dropOldShore();
    const root = new K.Group();
    root.name = "v51-root";
    CA.scene.add(root);
    root.add(buildTerrain(K));
    const lamb = (hex, extra) => new K.Lambert(Object.assign({ color: hex }, extra || {}));
    const here = { map: LAYOUT.map, tunnel: LAYOUT.tunnel, builder: LAYOUT.builder, quiz: LAYOUT.quiz };
    stations = [
      { id: "map", name: "Map Puzzle Dock", f: here.map[0], s: here.map[1] },
      { id: "tunnel", name: "History Time-Tunnel", f: here.tunnel[0], s: here.tunnel[1], era: ERAS[0] },
      { id: "rally", name: "Road Trip Rally", turtle: true },
      { id: "builder", name: "Landmark Builder", f: here.builder[0], s: here.builder[1] },
      { id: "quiz", name: "Fifty-State Quiz Show", f: here.quiz[0], s: here.quiz[1] }
    ];
    stations.forEach((st) => {
      if (st.turtle) return;
      const p = spot(st.f, st.s);
      st.x = p.x; st.z = p.z; st.wx = p.wx; st.wz = p.wz;
      const ring = new K.Mesh(new K.Torus(1.05, 0.07, 8, 24), new K.Lambert({ color: 0xffc83d, emissive: 0xffb300, emissiveIntensity: 0.65 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(p.wx, p.y + 0.14, p.wz);
      ring.name = "v51-ring";
      ring.userData.nofade = 1;
      root.add(ring);
      st.ring = ring;
      const label = new K.Sprite(new K.SpriteMat({ map: labelTex(K, st.name), transparent: true, depthWrite: false }));
      label.scale.set(3.4, 0.86, 1);
      label.position.set(p.wx, p.y + 2.35, p.wz);
      label.name = "v51-label";
      root.add(label);
    });
    const labelAt = spot(22.8, 6.2);
    const isleLabel = new K.Sprite(new K.SpriteMat({ map: labelTex(K, "Liberty Isle"), transparent: true, depthWrite: false }));
    isleLabel.scale.set(3.2, 0.8, 1);
    isleLabel.position.set(labelAt.wx, labelAt.y + 2.1, labelAt.wz);
    isleLabel.name = "v51-label";
    root.add(isleLabel);
    ribbon(K, root, [
      [[26.4, 0.6], [23.2, -2.4], [20.6, -5.6], [18.2, -8.4], [here.map[0], here.map[1]]],
      [[23.2, -2.4], [21.6, 1.2], [here.quiz[0], here.quiz[1]]],
      [[21.6, 1.2], [17.4, 5.2], [here.builder[0], here.builder[1]]],
      [[20.6, -5.6], [15.4, -2.8], [12.2, -0.6], [here.tunnel[0] + 1.6, here.tunnel[1]]]
    ], 0.78, 0xc4a06a);
    dressDock(K, root, lamb);
    dressFlag(K, root, lamb);
    dressFoliage(K, root, lamb);
    dressPines(K, root);
    /* The shore ends at the water. No underwater skirt and no foam sheet. */
    dressMapTable(K, root, lamb);
    dressTunnel(K, root, lamb);
    dressBench(K, root, lamb);
    dressStage(K, root, lamb);
    dressMonuments(K, root, lamb);
    dressRally(K, root, lamb);
    dressRegionFlags(K, root, lamb);
    dressClearings(K, root);
    bakeIsland(K, root);
    hookShore();
  }
  function dressDock(K, root, lamb) {
    const woodA = lamb(0xc4894a);
    const woodB = lamb(0xa86b32);
    const pile = lamb(0x6d4c2f);
    for (let i = 0; i < 10; i++) {
      const f = 24.8 + i * 1.15;
      const plank = new K.Mesh(new K.Box(1.08, 0.08, 2.35), i % 2 ? woodA : woodB);
      plank.userData.nofade = 1;
      const p = spot(f, 0);
      plank.position.set(p.wx, 0.52 * GROW, p.wz);
      plank.name = "v51-dock";
      plank.rotation.y = lay.yaw;
      root.add(plank);
      if (i % 3 === 0) {
        [-1.05, 1.05].forEach((side) => {
          const w = worldFS(f, side);
          const post = new K.Mesh(new K.Cyl(0.09, 0.11, 1.7, 6), pile);
          post.position.set(host.x + w.x, -0.35, host.z + w.z);
          post.castShadow = true;
          post.name = "v51-dock";
          root.add(post);
        });
      }
    }
    const buoy = new K.Group();
    const b = spot(36.5, 3.2);
    buoy.position.set(b.wx, -0.15, b.wz);
    const body = new K.Mesh(new K.Cyl(0.42, 0.42, 0.85, 10), lamb(0xe53935));
    body.position.y = 0.7;
    const top = new K.Mesh(new K.Cone(0.32, 0.5, 8), lamb(0xe53935));
    top.position.y = 1.3;
    const band = new K.Mesh(new K.Cyl(0.44, 0.44, 0.16, 10), lamb(0xffffff));
    band.position.y = 0.85;
    buoy.add(body); buoy.add(top); buoy.add(band);
    root.add(buoy);
  }
  function hangingFlag(K, mat) {
    const geo = new K.Geo();
    const w = 2.25;
    const h = 1.22;
    const droop = 0.32;
    geo.setAttribute("position", new K.Attr(new Float32Array([
      0, 0, 0, w, -droop, 0.12, 0, -h, 0, w, -h - droop * 1.15, 0.18
    ]), 3));
    geo.setAttribute("uv", new K.Attr(new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]), 2));
    geo.setIndex([0, 2, 1, 1, 2, 3]);
    geo.computeVertexNormals();
    const mesh = new K.Mesh(geo, mat);
    mesh.name = "v51-us-flag";
    return mesh;
  }
  function dressFlag(K, root, lamb) {
    const p = spot(LAYOUT.flag[0], LAYOUT.flag[1]);
    const poleH = 5.5;
    const pole = new K.Mesh(new K.Cyl(0.065, 0.09, poleH, 8), lamb(0xf7f4ee));
    pole.position.set(p.wx, p.y + poleH / 2, p.wz);
    pole.castShadow = true;
    root.add(pole);
    const top = p.y + poleH;
    const ball = new K.Mesh(new K.Sphere(0.14, 8, 6), lamb(0xffc83d));
    ball.position.set(p.wx, top + 0.02, p.wz);
    root.add(ball);
    const flagMat = new K.Lambert({ map: usFlagTex(K), color: 0xffffff, side: 2 });
    const flag = hangingFlag(K, flagMat);
    const rig = new K.Group();
    rig.position.set(p.wx, top - 0.08, p.wz);
    rig.rotation.y = Math.atan2(-lay.rz, lay.rx);
    rig.add(flag);
    root.add(rig);
    const board = new K.Mesh(new K.Box(1.7, 0.72, 0.08), lamb(0x8d5a2b));
    const post = new K.Mesh(new K.Cyl(0.06, 0.07, 1.5, 6), lamb(0x6d4c41));
    const signAt = spot(LAYOUT.isleSign[0], LAYOUT.isleSign[1]);
    post.position.set(signAt.wx, signAt.y + 0.75, signAt.wz);
    board.position.set(signAt.wx, signAt.y + 1.55, signAt.wz);
    board.rotation.y = lay.yaw;
    root.add(post); root.add(board);
    const plate = new K.Mesh(new K.Plane(1.5, 0.52), new K.Lambert({ map: labelTex(K, "Liberty Isle"), color: 0xffffff }));
    plate.position.set(board.position.x + lay.fx * 0.06, board.position.y, board.position.z + lay.fz * 0.06);
    plate.rotation.y = lay.yaw;
    root.add(plate);
  }
  function palmAt(K, root, f, s, lean, height, seed) {
    const y = heightFS(f, s);
    if (y == null || y < 0.35 * GROW || y > 2.5 * GROW) return;
    const p = spot(f, s);
    const trunk = new K.Lambert({ color: seed % 2 ? 0x8d5a2b : 0x6d4c2f });
    const trunks = [];
    const frondsA = [];
    const frondsB = [];
    const parts = 5;
    const seg = height / parts;
    for (let i = 0; i < parts; i++) {
      const piece = new K.Mesh(new K.Cyl(0.1 + (parts - i) * 0.012, 0.13 + (parts - i) * 0.014, seg * 1.08, 6), trunk);
      const ox = Math.sin(lean) * i * 0.22;
      const oz = Math.cos(lean) * i * 0.16;
      piece.position.set(p.wx + ox, p.y + (i + 0.5) * seg, p.wz + oz);
      piece.castShadow = false;
      trunks.push(piece);
    }
    const topX = p.wx + Math.sin(lean) * (parts - 1) * 0.22;
    const topZ = p.wz + Math.cos(lean) * (parts - 1) * 0.16;
    const topY = p.y + height - 0.05;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + seed;
      const frond = new K.Mesh(new K.Sphere(1, 6, 4), new K.Lambert({ color: i % 2 ? 0x2e7d32 : 0x3e9a45 }));
      frond.scale.set(1.45, 0.1, 0.4);
      frond.position.set(topX + Math.cos(a) * 0.85, topY - 0.05, topZ + Math.sin(a) * 0.85);
      frond.rotation.y = -a;
      frond.rotation.z = 0.55 + (i % 3) * 0.08;
      frond.castShadow = false;
      (i % 2 ? frondsA : frondsB).push(frond);
    }
    const nut = new K.Mesh(new K.Sphere(0.14, 6, 4), new K.Lambert({ color: 0x5d4037 }));
    nut.position.set(topX, topY - 0.12, topZ);
    trunks.push(nut);
    const hold = new K.Group();
    root.add(hold);
    trunks.concat(frondsA, frondsB).forEach((m) => hold.add(m));
    hold.updateWorldMatrix(true, true);
    [trunks, frondsA, frondsB].forEach((list) => {
      if (!list.length) return;
      const mesh = mergedMesh(K, list);
      mesh.name = "v51-palm";
      mesh.castShadow = false;
      root.add(mesh);
    });
    root.remove(hold);
  }
  function dressFoliage(K, root, lamb) {
    [[-13.2, 17.4, 0.4, 4.6, 1], [-14.6, 19.2, -0.3, 5.1, 2], [-15.4, 21.0, 0.5, 4.4, 3],
      [-13.8, -18.2, 0.2, 4.8, 4], [-15.2, -20.4, -0.4, 5.2, 5], [-16.2, -22.2, 0.3, 4.5, 6],
      [0.6, -23.4, 0.5, 4.7, 7], [0.4, -25.6, -0.2, 5.0, 8], [-1.2, -21.6, 0.4, 4.3, 9],
      [9.2, 22.4, 0.25, 4.6, 11], [10.4, 24.2, -0.35, 5.0, 12], [8.2, 20.6, 0.15, 4.4, 13]].forEach((row) => palmAt(K, root, row[0], row[1], row[2], row[3], row[4]));
    const bushes = [[18.4, -3.2], [16.2, 3.4], [12.8, -8.6], [11.2, 6.4], [20.4, 9.2], [9.4, -12.4], [21.6, -8.2], [14.2, 14.2], [8.2, 8.4], [19.2, -12.6]];
    bushes.forEach((b, i) => {
      const greens = [0x2f7d32, 0x388e3c, 0x1b5e20];
      for (let k = 0; k < 3; k++) {
        const bush = new K.Mesh(new K.Sphere(0.34 + (k % 2) * 0.1, 7, 5), lamb(greens[(i + k) % 3]));
        bush.scale.set(1.15, 0.72, 0.95);
        bush.castShadow = true;
        bush.name = "v51-bush";
        place(root, bush, b[0] + (k - 1) * 0.28, b[1] + (k % 2) * 0.2, 0.22);
      }
    });
    const flowers = [[19.4, -1.6, 0xff5fa2], [18.2, 2.2, 0xffd24a], [15.6, -6.2, 0xffffff], [16.8, 4.6, 0xff8a65],
      [12.6, -4.4, 0xffd24a], [13.6, 5.2, 0xff5fa2], [21.4, 3.6, 0xffffff], [10.6, -9.2, 0xffd24a]];
    flowers.forEach((fl) => {
      for (let k = 0; k < 3; k++) {
        const stem = new K.Mesh(new K.Cone(0.03, 0.22, 4), lamb(0x2e7d32));
        stem.name = "v51-stem";
        place(root, stem, fl[0] + k * 0.18, fl[1] + (k - 1) * 0.12, 0.1);
        const bloom = new K.Mesh(new K.Sphere(0.1, 6, 5), lamb(fl[2]));
        bloom.name = "v51-flower";
        place(root, bloom, fl[0] + k * 0.18, fl[1] + (k - 1) * 0.12, 0.24);
      }
    });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + 0.2;
      if (Math.abs(a) < 0.45 || Math.abs(a - Math.PI * 2) < 0.45) continue;
      if (a > 0.85 && a < 1.45) continue;
      const rad = 25.5 + (i % 4) * 0.7;
      const f = Math.cos(a) * rad;
      const s = Math.sin(a) * rad;
      const y = heightFS(f, s);
      if (y == null || y < -0.15 * GROW || y > 1.8 * GROW) continue;
      const rock = new K.Mesh(new K.Sphere(0.38 + (i % 3) * 0.14, 5, 4), lamb(i % 2 ? 0x8e877c : 0xb7aa96));
      rock.scale.set(1.25, 0.55, 0.95);
      rock.castShadow = true;
      rock.name = "v51-rock";
      place(root, rock, f, s, 0.12);
    }
  }
  function dressPines(K, root) {
    const trunks = [];
    const tops = [];
    const used = [];
    const pads = [LAYOUT.map, LAYOUT.tunnel, LAYOUT.builder, LAYOUT.quiz, LAYOUT.table, LAYOUT.plot, LAYOUT.flag];
    const plant = (f, s, scale, seed) => {
      const y = heightFS(f, s);
      if (y == null) return;
      const h = y / GROW;
      if (h < 1.3 || h > 6.6) return;
      if (inMouth(f, s) || inRoomFS(f, s)) return;
      if (Math.abs(s) < 5.4 && f > cliffLine(s) - 0.4 && f < cliffLine(s) + 3.4) return;
      if (Math.abs(s) < 2.3 && f > 16) return;
      for (let i = 0; i < pads.length; i++) {
        if (Math.hypot(f - pads[i][0], s - pads[i][1]) < 3.3) return;
      }
      for (let i = 0; i < used.length; i++) {
        if (Math.hypot(f - used[i][0], s - used[i][1]) < 1.15) return;
      }
      used.push([f, s]);
      const p = spot(f, s);
      const trunkH = (0.7 + (seed % 5) * 0.08) * scale;
      const coneH = (1.35 + (seed % 3) * 0.12) * scale;
      trunks.push({ geo: new K.Cyl(0.07 * scale, 0.11 * scale, trunkH, 5), color: seed % 2 ? 0x5c4030 : 0x4a3428, x: p.wx, y: p.y + trunkH / 2, z: p.wz });
      tops.push({ geo: new K.Cone(0.52 * scale, coneH, 7), color: seed % 2 ? 0x1b4332 : 0x234e38, x: p.wx, y: p.y + trunkH + coneH * 0.32, z: p.wz });
      tops.push({ geo: new K.Cone(0.34 * scale, coneH * 0.62, 6), color: 0x163628, x: p.wx, y: p.y + trunkH + coneH * 0.72, z: p.wz });
    };
    for (let i = 0; i < 64; i++) {
      const ang = hsh(i * 2.3 + 0.4) * Math.PI * 2;
      const rad = 3.8 + hsh(i * 4.1) * 8.4;
      plant(Math.cos(ang) * rad, Math.sin(ang) * rad, 0.85 + hsh(i * 6.6) * 0.7, i + 1);
    }
    [-1, 1].forEach((side) => {
      for (let i = 0; i < 8; i++) {
        const s = side * (5.6 + i * 0.85);
        plant(2.4 + (i % 3) * 0.4, s, 1.05, 20 + i + side);
        plant(-1.6 - (i % 2) * 0.5, s * 0.92, 0.95, 40 + i);
        plant(5.2, s * 1.05, 0.9, 60 + i);
      }
    });
    if (trunks.length) paintProps(K, root, "v51-pine-trunk", trunks);
    if (tops.length) paintProps(K, root, "v51-pine", tops);
    const rubble = [];
    for (let i = 0; i < 18; i++) {
      const s = -6.5 + (i / 17) * 13;
      if (Math.abs(s - CAVE.s) < 1.7) continue;
      const f = cliffLine(s) + 1.6 + hsh(i * 3.3) * 1.4;
      const y = heightFS(f, s);
      if (y == null || y / GROW < 1.8 || y / GROW > 8) continue;
      const p = spot(f, s);
      const rad = 0.28 + hsh(i * 8.1) * 0.34;
      rubble.push({ geo: new K.Sphere(rad, 7, 5), color: i % 2 ? 0xe4ddd2 : 0xcfc6b6, x: p.wx, y: p.y + rad * 0.35, z: p.wz });
    }
    if (rubble.length) paintProps(K, root, "v51-talus", rubble);
  }
  function bakeParts(K, parts) {
    const positions = [];
    const colors = [];
    parts.forEach((part) => {
      const mesh = new K.Mesh(part.geo, new K.Lambert({ color: 0xffffff }));
      mesh.position.set(part.x, part.y, part.z);
      if (part.rot) mesh.rotation.y = part.rot;
      if (part.rx) mesh.rotation.x = part.rx;
      if (part.rz) mesh.rotation.z = part.rz;
      mesh.updateWorldMatrix(true, false);
      const e = mesh.matrixWorld.elements;
      const p = mesh.geometry.attributes.position;
      const index = mesh.geometry.index;
      const count = index ? index.count : p.count;
      const col = new K.Color(part.color);
      for (let i = 0; i < count; i++) {
        const vi = index ? index.getX(i) : i;
        const x = p.getX(vi);
        const y = p.getY(vi);
        const z = p.getZ(vi);
        positions.push(
          e[0] * x + e[4] * y + e[8] * z + e[12],
          e[1] * x + e[5] * y + e[9] * z + e[13],
          e[2] * x + e[6] * y + e[10] * z + e[14]
        );
        colors.push(col.r, col.g, col.b);
      }
    });
    if (!positions.length) return;
    const geo = new K.Geo();
    geo.setAttribute("position", new K.Attr(new Float32Array(positions), 3));
    geo.setAttribute("color", new K.Attr(new Float32Array(colors), 3));
    geo.computeVertexNormals();
    const mesh = new K.Mesh(geo, new K.Lambert({ vertexColors: true }));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }
  function paintProps(K, root, name, parts) {
    const mesh = bakeParts(K, parts);
    mesh.name = name;
    root.add(mesh);
    return mesh;
  }
  function propAt(f, s, dy) {
    const p = spot(f, s);
    return { x: p.wx, y: p.y + dy, z: p.wz, rot: lay.yaw };
  }
  function dressClearings(K, root) {
    const map = [];
    const mf = LAYOUT.map[0] - 1.4;
    const ms = LAYOUT.map[1] + 1.6;
    [[-1.3, -0.9], [1.3, -0.9], [-1.3, 0.9], [1.3, 0.9]].forEach((p) => {
      map.push(Object.assign({ geo: new K.Cyl(0.07, 0.08, 1.7, 6), color: 0x6d4c2f }, propAt(mf + p[0], ms + p[1], 0.85)));
    });
    map.push(Object.assign({ geo: new K.Box(3.1, 0.08, 2.2), color: 0xe6c36a }, propAt(mf, ms, 1.72)));
    map.push(Object.assign({ geo: new K.Box(1.3, 0.1, 0.42), color: 0x8d5a2b }, propAt(mf + 2.2, ms, 0.48)));
    [[-0.5, -0.16], [0.5, -0.16], [-0.5, 0.16], [0.5, 0.16]].forEach((leg) => {
      map.push(Object.assign({ geo: new K.Box(0.08, 0.42, 0.08), color: 0x6d4c2f }, propAt(mf + 2.2 + leg[0], ms + leg[1], 0.22)));
    });
    paintProps(K, root, "v51-map-set", map);

    const lights = [];
    const bulbs = [];
    const qf = LAYOUT.quiz[0];
    const qs = LAYOUT.quiz[1];
    [[-2.3, 0], [2.3, 0]].forEach((p) => {
      lights.push(Object.assign({ geo: new K.Cyl(0.05, 0.06, 2.3, 6), color: 0x455a64 }, propAt(qf + p[0] * 0.15, qs + p[1] + (p[0] < 0 ? -2.1 : 2.1), 1.15)));
    });
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      const s = qs - 2.1 + t * 4.2;
      const sag = Math.sin(t * Math.PI) * 0.35;
      lights.push(Object.assign({ geo: new K.Box(0.04, 0.04, 0.72), color: 0x263238 }, propAt(qf, s, 2.15 - sag)));
      const bulb = propAt(qf, s, 2.0 - sag);
      const lamp = new K.Mesh(new K.Sphere(0.1, 8, 6), new K.Lambert({ color: 0xfff3c4, emissive: 0xffe082, emissiveIntensity: 0.9 }));
      lamp.position.set(bulb.x, bulb.y, bulb.z);
      lamp.name = "v51-bulb";
      root.add(lamp);
      bulbs.push(lamp);
    }
    paintProps(K, root, "v51-quiz-set", lights);
    void bulbs;

    const yard = [];
    const bf = LAYOUT.builder[0];
    const bs = LAYOUT.builder[1];
    [[0, 0, 0.32], [0.7, 0.15, 0.28], [0.3, 0.45, 0.7]].forEach((c) => {
      yard.push(Object.assign({ geo: new K.Box(0.55, 0.42, 0.48), color: c[2] > 0.5 ? 0x8d6e63 : 0xa1887f }, propAt(bf + 1.8 + c[0], bs - 1.5 + c[1], c[2])));
    });
    yard.push(Object.assign({ geo: new K.Cyl(0.08, 0.1, 2.4, 6), color: 0xf9a825 }, propAt(bf + 2.6, bs + 1.2, 1.2)));
    yard.push(Object.assign({ geo: new K.Box(1.6, 0.1, 0.12), color: 0xf9a825 }, propAt(bf + 1.9, bs + 1.2, 2.35)));
    yard.push(Object.assign({ geo: new K.Box(0.04, 0.7, 0.04), color: 0x455a64 }, propAt(bf + 1.2, bs + 1.2, 1.9)));
    yard.push(Object.assign({ geo: new K.Box(0.22, 0.16, 0.16), color: 0x546e7a }, propAt(bf + 1.2, bs + 1.2, 1.5)));
    paintProps(K, root, "v51-builder-set", yard);

    const mouth = [];
    [[1.6, -1.5, 0.45], [2.1, 1.3, 0.32], [3.2, -0.8, 0.55], [3.6, 1.6, 0.28]].forEach((r) => {
      mouth.push(Object.assign({ geo: new K.Sphere(r[2], 5, 4), color: 0x7a736c }, propAt(CAVE.f + r[0], CAVE.s + r[1], r[2] * 0.45)));
    });
    [[2.4, -1.8], [2.8, 1.7]].forEach((p) => {
      mouth.push(Object.assign({ geo: new K.Cyl(0.05, 0.06, 1.2, 6), color: 0x4e342e }, propAt(CAVE.f + p[0], CAVE.s + p[1], 0.6)));
      const at = propAt(CAVE.f + p[0], CAVE.s + p[1], 1.25);
      const lamp = new K.Mesh(new K.Sphere(0.12, 8, 6), new K.Lambert({ color: 0xffe082, emissive: 0xffb300, emissiveIntensity: 1 }));
      lamp.position.set(at.x, at.y, at.z);
      lamp.name = "v51-bulb";
      root.add(lamp);
    });
    paintProps(K, root, "v51-tunnel-set", mouth);
  }
  function dressMapTable(K, root, lamb) {
    const p = spot(LAYOUT.table[0], LAYOUT.table[1]);
    const table = new K.Group();
    table.name = "v51-map-table";
    table.position.set(p.wx, p.y, p.wz);
    table.rotation.y = lay.yaw;
    const top = new K.Mesh(new K.Box(6.5, 0.14, 4.35), lamb(0x8d5a2b));
    top.position.y = 0.96;
    top.castShadow = true;
    top.receiveShadow = true;
    table.add(top);
    [[-2.9, -1.85], [2.9, -1.85], [-2.9, 1.85], [2.9, 1.85]].forEach((leg) => {
      const post = new K.Mesh(new K.Box(0.16, 0.9, 0.16), lamb(0x6d4c2f));
      post.position.set(leg[0], 0.45, leg[1]);
      table.add(post);
    });
    const lip = new K.Mesh(new K.Box(6.15, 0.06, 4.05), lamb(0xf4efe4));
    lip.position.y = 1.05;
    table.add(lip);
    const map = new K.Mesh(new K.Plane(6, 4), new K.Lambert({ map: mapTexture(K), color: 0xffffff, side: 2 }));
    map.rotation.x = -Math.PI / 2;
    map.position.y = 1.1;
    map.name = "v51-map";
    map.userData.nofade = 1;
    table.add(map);
    root.add(table);
    mapMesh = map;
    mapAnchor = { x: p.wx, y: p.y + 1.1, z: p.wz };
  }
  function dressTunnel(K, root, lamb) {
    const p = spot(CAVE.f, CAVE.s);
    const cave = new K.Group();
    cave.position.set(p.wx, p.y, p.wz);
    cave.rotation.y = lay.yaw;
    cave.name = "v51-cave";
    const rock = lamb(0x7a736c);
    const rockDark = lamb(0x5e5852);
    for (let i = 0; i <= 9; i++) {
      const t = i / 9;
      const a = Math.PI * (1 - t);
      const jitter = 0.85 + hsh(i * 4.2) * 0.35;
      const stone = new K.Mesh(new K.Sphere(0.38 * jitter, 5, 4), i % 2 ? rock : rockDark);
      stone.scale.set(1.2, 0.9, 0.85);
      stone.position.set(Math.cos(a) * 1.72, 0.28 + Math.sin(a) * 1.62, 0.05);
      stone.castShadow = true;
      stone.name = "v51-arch";
      cave.add(stone);
    }
    [-1.55, 1.55].forEach((x, n) => {
      const jamb = new K.Mesh(new K.Box(0.55, 1.7, 0.7), n ? rockDark : rock);
      jamb.position.set(x, 0.85, 0.05);
      jamb.castShadow = true;
      cave.add(jamb);
    });
    const roof = new K.Mesh(new K.Box(4.1, 0.55, 3.6), lamb(0x6e675f));
    roof.position.set(0, 2.85, -1.15);
    roof.castShadow = true;
    cave.add(roof);
    const curtain = new K.Mesh(new K.Box(2.7, 2.2, 0.12), new K.Lambert({ color: 0x14110e, transparent: true, opacity: 0.92, side: 2 }));
    curtain.position.set(0, 1.15, 0.02);
    curtain.name = "v51-cave-dark";
    curtain.userData.nofade = 1;
    cave.add(curtain);
    const floor = new K.Mesh(new K.Box(3.2, 0.08, 6.8), lamb(0x6a635c));
    floor.position.set(0, 0.04, -3.1);
    floor.userData.nofade = 1;
    cave.add(floor);
    const roofIn = new K.Mesh(new K.Box(3.5, 0.28, 6.4), lamb(0x5e5852));
    roofIn.position.set(0, 3.55, -3.1);
    roofIn.userData.nofade = 1;
    cave.add(roofIn);
    [-1.2, -3.4].forEach((z) => {
      [-1.35, 1.35].forEach((x) => {
        const post = new K.Mesh(new K.Cyl(0.05, 0.06, 1.15, 6), lamb(0x4e342e));
        post.position.set(x, 1.35, z);
        const lamp = new K.Mesh(new K.Sphere(0.14, 8, 6), new K.Lambert({ color: 0xffe082, emissive: 0xffb300, emissiveIntensity: 1 }));
        lamp.position.set(x, 1.95, z);
        lamp.name = "v51-lantern";
        cave.add(post); cave.add(lamp);
      });
    });
    const sign = new K.Mesh(new K.Plane(1.55, 0.72), new K.Lambert({ map: stackTex(K, ["History", "Time-Tunnel"]), color: 0xffffff, side: 2 }));
    sign.position.set(0.9, 1.08, -1.25);
    sign.rotation.y = Math.PI;
    sign.name = "v51-cave-sign";
    cave.add(sign);
    const walls = new K.Group();
    walls.name = "v51-room";
    function roomWall(w, h, d, x, y, z, name) {
      const wall = new K.Mesh(new K.Box(w, h, d), lamb(0x6a635c));
      wall.position.set(x, y, z);
      wall.name = name;
      wall.userData.nofade = 1;
      walls.add(wall);
      return wall;
    }
    const left = roomWall(0.26, 3.2, 6.4, -1.7, 1.6, -3.1, "v51-wall-left");
    const right = roomWall(0.26, 3.2, 6.4, 1.7, 1.6, -3.1, "v51-wall-right");
    const back = roomWall(3.7, 3.2, 0.26, 0, 1.6, -6.3, "v51-wall-back");
    cave.add(walls);
    root.add(cave);
    caveAnchor = { x: p.wx, y: p.y, z: p.wz, yaw: lay.yaw };
    caveWalls = { left: left, right: right, back: back };
    const names = ERAS.length ? ERAS : ["A new world"];
    names.forEach((era, i) => {
      const side = i % 2 ? 1 : -1;
      const row = Math.floor(i / 2);
      const plaque = new K.Mesh(new K.Plane(1.15, 0.36), new K.Lambert({ map: plaqueTex(K, era), color: 0xffffff }));
      plaque.position.set(side * 1.42, 1.55 - (row % 2) * 0.5, -1.1 - (row % 4) * 0.95);
      plaque.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      plaque.name = "v51-plaque";
      cave.add(plaque);
    });
    rooms = names.map((era) => ({ era: era, x: p.wx, z: p.wz, group: walls, blocks: [] }));
  }
  function dressRally(K, root, lamb) {
    const turtle = (CA.isl.L || []).find((j) => j.id === "turtle");
    const st = stations.find((s) => s.id === "rally");
    if (!turtle || !st || !bridgeWalk) return;
    const towardX = bridgeWalk.bx - turtle.cx;
    const towardZ = bridgeWalk.bz - turtle.cz;
    const span = Math.hypot(towardX, towardZ) || 1;
    const ux = towardX / span;
    const uz = towardZ / span;
    const px = -uz;
    const pz = ux;
    const at = (u, v) => ({ x: turtle.cx + ux * u + px * v, z: turtle.cz + uz * u + pz * v });
    const gy = (u, v) => {
      const p = at(u, v);
      const y = turtleGround(turtle, p.x, p.z);
      return y == null ? 0.8 : y;
    };
    const parts = [];
    const push = (geo, color, u, v, dy, rot, rx, rz) => {
      const p = at(u, v);
      parts.push({ geo: geo, color: color, x: p.x, y: gy(u, v) + dy, z: p.z, rot: rot, rx: rx, rz: rz });
    };
    const samples = 28;
    const loop = (a) => ({ u: -2.4 + Math.cos(a) * 7.4, v: Math.sin(a) * 5.5 });
    const outside = (a, extra) => {
      const p = loop(a);
      const cu = p.u + 2.4;
      const cv = p.v;
      const d = Math.hypot(cu, cv) || 1;
      return { u: p.u + (cu / d) * extra, v: p.v + (cv / d) * extra };
    };
    const ribbonN = 96;
    const halfW = 3.15;
    const roadPos = [];
    const roadCol = [];
    const roadIdx = [];
    const asphalt = [0.15, 0.15, 0.16];
    const white = [0.95, 0.95, 0.96];
    const yellow = [0.93, 0.78, 0.16];
    const across = [-halfW, -halfW + 0.18, -halfW + 0.36, -0.2, -0.07, 0.07, 0.2, halfW - 0.36, halfW - 0.18, halfW];
    for (let i = 0; i <= ribbonN; i++) {
      const a = (i / ribbonN) * Math.PI * 2;
      const p = loop(a);
      const ahead = loop(a + 0.04);
      const du = ahead.u - p.u;
      const dv = ahead.v - p.v;
      const seg = Math.hypot(du, dv) || 1;
      const su = -dv / seg;
      const sv = du / seg;
      const y = gy(p.u, p.v) + 0.2;
      const dash = Math.floor(i / 4) % 2 === 0;
      across.forEach((side, k) => {
        const w = at(p.u + su * side, p.v + sv * side);
        roadPos.push(w.x, y, w.z);
        const center = k === 4 || k === 5;
        const edge = k < 2 || k > 7;
        const col = center ? (dash ? yellow : asphalt) : edge ? white : asphalt;
        roadCol.push(col[0], col[1], col[2]);
      });
    }
    const spanV = across.length;
    for (let i = 0; i < ribbonN; i++) {
      for (let k = 0; k < spanV - 1; k++) {
        const a = i * spanV + k;
        const b = a + spanV;
        roadIdx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const roadGeo = new K.Geo();
    roadGeo.setAttribute("position", new K.Attr(new Float32Array(roadPos), 3));
    roadGeo.setAttribute("color", new K.Attr(new Float32Array(roadCol), 3));
    roadGeo.setIndex(roadIdx);
    roadGeo.computeVertexNormals();
    const roadMat = new K.Lambert({ vertexColors: true, side: 2 });
    const road = new K.Mesh(roadGeo, roadMat);
    road.name = "v51-rally-road";
    road.receiveShadow = true;
    root.add(road);
    for (let i = 0; i < samples; i += 4) {
      const a = (i / samples) * Math.PI * 2;
      const p = loop(a);
      const ahead = loop(a + 0.08);
      const du = ahead.u - p.u;
      const dv = ahead.v - p.v;
      const seg = Math.hypot(du, dv) || 1;
      const rail = { u: p.u + (-dv / seg) * 3.05, v: p.v + (du / seg) * 3.05 };
      push(new K.Cyl(0.07, 0.08, 0.9, 6), 0xb0bec5, rail.u, rail.v, 0.55, 0);
    }
    const start = loop(0);
    const next = loop(0.2);
    const w0 = at(start.u, start.v);
    const w1 = at(next.u, next.v);
    const carHead = Math.atan2(w1.x - w0.x, w1.z - w0.z);
    const fx = Math.sin(carHead);
    const fz = Math.cos(carHead);
    const rx = fz;
    const rz = -fx;
    const carAt = (forward, right) => {
      const wx = w0.x + fx * forward + rx * right;
      const wz = w0.z + fz * forward + rz * right;
      const u = (wx - turtle.cx) * ux + (wz - turtle.cz) * uz;
      const v = (wx - turtle.cx) * px + (wz - turtle.cz) * pz;
      return { u: u, v: v };
    };
    const bodyGeo = new K.Sphere(1, 16, 12);
    bodyGeo.scale(0.7, 0.28, 1.55);
    const body = carAt(0.15, 0);
    push(bodyGeo, 0xc62828, body.u, body.v, 0.58, carHead);
    const hoodGeo = new K.Sphere(1, 14, 10);
    hoodGeo.scale(0.62, 0.2, 0.7);
    const hood = carAt(1.15, 0);
    push(hoodGeo, 0xb71c1c, hood.u, hood.v, 0.62, carHead);
    const cabinGeo = new K.Sphere(1, 14, 10);
    cabinGeo.scale(0.62, 0.38, 0.62);
    const cabin = carAt(-0.25, 0);
    push(cabinGeo, 0xe53935, cabin.u, cabin.v, 0.95, carHead);
    const glassGeo = new K.Sphere(1, 12, 8);
    glassGeo.scale(0.55, 0.28, 0.48);
    const glass = carAt(0.15, 0);
    push(glassGeo, 0x90caf9, glass.u, glass.v, 1.05, carHead);
    [-0.42, 0.42].forEach((side) => {
      const lampGeo = new K.Sphere(0.13, 8, 6);
      const lamp = carAt(1.35, side);
      push(lampGeo, 0xfff59d, lamp.u, lamp.v, 0.58, carHead);
    });
    [[0.85, -0.78], [0.85, 0.78], [-0.55, -0.78], [-0.55, 0.78]].forEach((wheel) => {
      const p = carAt(wheel[0], wheel[1]);
      push(new K.Cyl(0.32, 0.32, 0.2, 12), 0x212121, p.u, p.v, 0.32, carHead, 0, Math.PI / 2);
      push(new K.Cyl(0.16, 0.16, 0.24, 8), 0xeceff1, p.u, p.v, 0.32, carHead, 0, Math.PI / 2);
    });
    const archBase = loop(2.45);
    const archNext = loop(2.62);
    const adu = archNext.u - archBase.u;
    const adv = archNext.v - archBase.v;
    const aseg = Math.hypot(adu, adv) || 1;
    const asu = -adv / aseg;
    const asv = adu / aseg;
    const acrossX = ux * asu + px * asv;
    const acrossZ = uz * asu + pz * asv;
    const archYaw = Math.atan2(-acrossZ, acrossX);
    push(new K.Box(0.28, 2.3, 0.28), 0xf5f5f5, archBase.u + asu * 1.9, archBase.v + asv * 1.9, 1.3, archYaw);
    push(new K.Box(0.28, 2.3, 0.28), 0xf5f5f5, archBase.u - asu * 1.9, archBase.v - asv * 1.9, 1.3, archYaw);
    push(new K.Box(3.8, 0.32, 0.32), 0xffc83d, archBase.u, archBase.v, 2.5, archYaw);
    const pump = loop(1.15);
    push(new K.Box(2.4, 1.5, 2.2), 0xeceff1, pump.u, pump.v + 4.2, 0.85, 0);
    push(new K.Box(3.2, 0.16, 2.6), 0xc62828, pump.u, pump.v + 4.2, 1.7, 0);
    push(new K.Box(0.16, 1.5, 0.16), 0x546e7a, pump.u + 0.8, pump.v + 3.2, 0.8, 0);
    const diner = loop(3.4);
    push(new K.Box(3.4, 1.7, 2.4), 0xffcc80, diner.u, diner.v - 4.4, 0.95, 0);
    push(new K.Box(3.6, 0.2, 2.7), 0x6d4c41, diner.u, diner.v - 4.4, 1.85, 0);
    push(new K.Box(1.1, 1.2, 0.08), 0x81d4fa, diner.u - 0.6, diner.v - 3.3, 1.15, 0);
    [[0.9, "Grand Canyon"], [2.2, "Gateway Arch"], [3.4, "Liberty"], [4.6, "Golden Gate"]].forEach((bill) => {
      const spotA = outside(bill[0], 7.4);
      push(new K.Cyl(0.08, 0.09, 2.2, 5), 0x6d4c41, spotA.u, spotA.v, 1.1, 0);
    });
    [2.2, 2.9, 3.7, 4.5].forEach((a) => {
      const p = loop(a);
      const cu = p.u + 2.4;
      const cv = p.v;
      const d = Math.hypot(cu, cv) || 1;
      const tree = { u: p.u + (cu / d) * 3.4, v: p.v + (cv / d) * 3.4 };
      push(new K.Cyl(0.16, 0.2, 1.5, 6), 0x6d4c2f, tree.u, tree.v, 0.75, 0);
      push(new K.Sphere(0.85, 6, 5), 0x2e7d32, tree.u, tree.v, 1.7, 0);
    });
    paintProps(K, root, "v51-rally-set", parts);
    const boardSpot = outside(0.55, 7.2);
    const boardAt = at(boardSpot.u, boardSpot.v);
    const board = new K.Mesh(new K.Box(1.8, 1.05, 0.08), new K.Lambert({ map: routeTex(K), color: 0xffffff }));
    board.position.set(boardAt.x, gy(boardSpot.u, boardSpot.v) + 1.7, boardAt.z);
    board.rotation.y = Math.atan2(turtle.cx - boardAt.x, turtle.cz - boardAt.z);
    root.add(board);
    [[0.9, "Grand Canyon", "Arizona"], [2.2, "Gateway Arch", "Missouri"], [3.4, "Statue of Liberty", "New York"], [4.6, "Golden Gate", "California"]].forEach((bill) => {
      const spotA = outside(bill[0], 7.4);
      const p = at(spotA.u, spotA.v);
      const sign = new K.Mesh(new K.Plane(1.7, 1.05), new K.Lambert({ map: stackTex(K, [bill[1], bill[2]]), color: 0xffffff, side: 2 }));
      sign.position.set(p.x, gy(spotA.u, spotA.v) + 2.15, p.z);
      sign.rotation.y = Math.atan2(turtle.cx - p.x, turtle.cz - p.z);
      sign.name = "v51-rally-sign";
      root.add(sign);
    });
    const pad = at(start.u, start.v);
    const padY = gy(start.u, start.v);
    st.wx = pad.x;
    st.wz = pad.z;
    st.x = pad.x - host.x;
    st.z = pad.z - host.z;
    const ring = new K.Mesh(new K.Torus(1.15, 0.08, 8, 24), new K.Lambert({ color: 0xffc83d, emissive: 0xffb300, emissiveIntensity: 0.65 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(pad.x, padY + 0.2, pad.z);
    ring.name = "v51-ring";
    ring.userData.nofade = 1;
    root.add(ring);
    st.ring = ring;
    const label = new K.Sprite(new K.SpriteMat({ map: labelTex(K, st.name), transparent: true, depthWrite: false }));
    label.scale.set(3.4, 0.86, 1);
    label.position.set(pad.x, padY + 2.5, pad.z);
    label.name = "v51-label";
    root.add(label);
    const path = [];
    const door = at(8.6, 0);
    path.push(door);
    path.push(at(start.u + 1.2, start.v));
    path.push(pad);
    const loopPts = [];
    for (let i = 0; i < samples; i++) {
      const p = loop((i / samples) * Math.PI * 2);
      loopPts.push(at(p.u, p.v));
    }
    const carWorld = at(body.u, body.v);
    const camLocal = { u: 0.2, v: 2.4 };
    const lookLocal = { u: 7.4, v: 1.5 };
    const camBack = at(camLocal.u, camLocal.v);
    const lookAt = at(lookLocal.u, lookLocal.v);
    CA.scene.traverse((o) => {
      if (!o.isMesh || !o.geometry) return;
      const keep = o.name === "v51-rally-set" || o.name === "v51-rally-road" || o.name === "v51-ring" || o.name === "v51-rally-sign" || o.name === "v51-label" || o.name === "v51-terrain";
      if (keep) return;
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      const rad = (o.geometry.boundingSphere.radius || 0) * Math.max(o.scale.x || 1, o.scale.y || 1, o.scale.z || 1);
      if (rad > 7) return;
      o.updateWorldMatrix(true, false);
      const e = o.matrixWorld.elements;
      const dx = e[12] - camBack.x;
      const dz = e[14] - camBack.z;
      const along = dx * fx + dz * fz;
      const side = dx * rx + dz * rz;
      if (along > -1 && along < 16 && Math.abs(side) < 2.6 && e[13] > 0.3 && e[13] < 9) o.visible = false;
    });
    rallyPad = {
      x: pad.x, y: padY, z: pad.z, heading: carHead, path: path, loop: loopPts, turtle: turtle,
      car: { x: carWorld.x, y: gy(body.u, body.v) + 0.7, z: carWorld.z, heading: carHead },
      view: { x: camBack.x, y: gy(camLocal.u, camLocal.v) + 1.45, z: camBack.z },
      look: { x: lookAt.x, y: gy(lookLocal.u, lookLocal.v) + 0.85, z: lookAt.z }
    };
    root.userData.rally = rallyPad;
  }
  function makeMonument(K, id) {
    const lamb = (hex, extra) => new K.Lambert(Object.assign({ color: hex }, extra || {}));
    const makers = { bell: bellMesh, alamo: alamoMesh, arch: archMesh, liberty: statueMesh, rushmore: rushmoreMesh, gate: bridgeMesh };
    return makers[id] ? makers[id](K, lamb) : null;
  }
  function mountPlot(id) {
    if (!builderPlot || !id) return;
    const K = kit();
    if (!K) return;
    if (builderPlot.model) builderPlot.group.remove(builderPlot.model);
    const mesh = makeMonument(K, id);
    if (!mesh) return;
    const wide = id === "gate" || id === "arch" || id === "alamo";
    mesh.scale.setScalar(wide ? 0.2 : 0.3);
    mesh.position.y = 1.08;
    mesh.rotation.y = wide ? 0.4 : 0;
    mesh.name = "v51-plot-model";
    builderPlot.group.add(mesh);
    builderPlot.model = mesh;
    builderPlot.shown = id;
  }
  function dressBench(K, root, lamb) {
    const p = spot(LAYOUT.builder[0], LAYOUT.builder[1]);
    const top = new K.Mesh(new K.Box(1.5, 0.1, 0.7), lamb(0xa86b32));
    top.position.set(p.wx, p.y + 0.85, p.wz);
    top.rotation.y = lay.yaw;
    root.add(top);
    [[-0.55, -0.24], [0.55, -0.24], [-0.55, 0.24], [0.55, 0.24]].forEach((leg) => {
      const post = new K.Mesh(new K.Box(0.1, 0.8, 0.1), lamb(0x6d4c2f));
      const w = worldFS(LAYOUT.builder[0] + leg[0] * 0.15, LAYOUT.builder[1] + leg[1]);
      post.position.set(host.x + w.x, p.y + 0.4, host.z + w.z);
      root.add(post);
    });
    const plotAt = spot(LAYOUT.plot[0], LAYOUT.plot[1]);
    const group = new K.Group();
    group.position.set(plotAt.wx, plotAt.y, plotAt.wz);
    group.rotation.y = lay.yaw + 0.4;
    group.name = "v51-plot";
    const foot = new K.Mesh(new K.Cyl(1.05, 1.15, 0.2, 8), lamb(0xb7b1a6));
    foot.position.y = 0.1;
    const shaft = new K.Mesh(new K.Cyl(0.72, 0.82, 0.72, 8), lamb(0x8d847c));
    shaft.position.y = 0.55;
    const cap = new K.Mesh(new K.Cyl(0.9, 0.9, 0.14, 8), lamb(0xe7e0d6));
    cap.position.y = 0.98;
    group.add(foot); group.add(shaft); group.add(cap);
    root.add(group);
    builderPlot = { group: group, x: plotAt.wx, y: plotAt.y, z: plotAt.wz, model: null, shown: "" };
    const owned = BANK.landmarks.filter((lm) => bag().landmarks[lm.id]);
    if (owned.length) mountPlot(owned[owned.length - 1].id);
  }
  function dressStage(K, root, lamb) {
    const p = spot(LAYOUT.quiz[0], LAYOUT.quiz[1]);
    const deck = new K.Mesh(new K.Cyl(2.15, 2.15, 0.22, 16), lamb(0x6d4c41));
    deck.position.set(p.wx, p.y + 0.12, p.wz);
    deck.receiveShadow = true;
    root.add(deck);
    const podium = new K.Mesh(new K.Box(0.7, 0.95, 0.45), lamb(0x14336b));
    podium.position.set(p.wx + lay.fx * 0.35, p.y + 0.7, p.wz + lay.fz * 0.35);
    root.add(podium);
    [-1.55, 1.55].forEach((side) => {
      const at = spot(LAYOUT.quiz[0], LAYOUT.quiz[1] + side);
      const post = new K.Mesh(new K.Cyl(0.06, 0.06, 2.15, 6), lamb(0x455a64));
      post.position.set(at.wx, at.y + 1.05, at.wz);
      const bulb = new K.Mesh(new K.Sphere(0.14, 8, 6), new K.Lambert({ color: 0xfff3c4, emissive: 0xffe082, emissiveIntensity: 0.9 }));
      bulb.position.set(at.wx, at.y + 2.15, at.wz);
      root.add(post); root.add(bulb);
    });
    const wheel = new K.Mesh(new K.Cyl(1.05, 1.05, 0.14, 20), new K.Lambert({ color: 0xffc83d, emissive: 0xffb300, emissiveIntensity: 0.4 }));
    wheel.position.set(p.wx - lay.fx * 0.7, p.y + 1.35, p.wz - lay.fz * 0.7);
    wheel.rotation.y = lay.yaw;
    wheel.rotation.x = Math.PI / 2;
    wheel.name = "v51-wheel";
    root.add(wheel);
    monuments.wheel = wheel;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const bunt = new K.Mesh(new K.Cone(0.12, 0.28, 3), lamb(i % 2 ? 0xc0392b : 0x14336b));
      bunt.position.set(p.wx + Math.cos(a) * 1.9, p.y + 0.42, p.wz + Math.sin(a) * 1.9);
      root.add(bunt);
    }
  }
  function dressRegionFlags(K, root, lamb) {
    REGIONS.forEach((region, i) => {
      const at = spot(16.4, -5.6 - i * 1.15);
      const pole = new K.Mesh(new K.Cyl(0.045, 0.05, 1.8, 6), lamb(0xf4efe4));
      pole.position.set(at.wx, at.y + 0.9, at.wz);
      const cloth = new K.Mesh(new K.Plane(0.85, 0.52), lamb([0x6a1b9a, 0xc0392b, 0xe6a817, 0x2e7d32, 0x1e88e5][i]));
      cloth.position.set(at.wx + lay.rx * 0.45, at.y + 1.45, at.wz + lay.rz * 0.45);
      cloth.rotation.y = lay.yaw;
      cloth.name = "v51-flag";
      const up = !!bag().flags[region];
      cloth.visible = up;
      pole.visible = up;
      root.add(pole); root.add(cloth);
      flags[region] = { cloth: cloth, pole: pole };
    });
  }
  function hookShore() {
    if (!host) return;
    if (CA.walkCircles) {
      for (let f = -16; f <= 36; f += 3.2) {
        for (let s = -34; s <= 34; s += 3.2) {
          if (Math.hypot(f, s) > 40) continue;
          if (Math.hypot(f + 1.3, s) < 3.7) continue;
          const w = worldFS(f, s);
          const y = sampleGround(w.x, w.z);
          if (y == null || y < 0.12 || y > 5.5 * GROW) continue;
          CA.walkCircles.push({ x: host.x + w.x, z: host.z + w.z, r: 2.45 });
        }
      }
      for (let f = 24; f <= 37; f += 2.8) {
        const w = worldFS(f, 0);
        CA.walkCircles.push({ x: host.x + w.x, z: host.z + w.z, r: 2.15 });
      }
      if (bridgeWalk) {
        for (let t = 0; t <= bridgeWalk.len; t += 2.1) {
          CA.walkCircles.push({
            x: bridgeWalk.ax + bridgeWalk.ux * t,
            z: bridgeWalk.az + bridgeWalk.uz * t,
            r: 1.7
          });
        }
      }
      if (rallyPad && bridgeWalk) {
        const chain = [{ x: bridgeWalk.bx, z: bridgeWalk.bz }].concat(rallyPad.path || []);
        for (let i = 0; i < chain.length - 1; i++) {
          const a = chain[i];
          const b = chain[i + 1];
          const dist = Math.hypot(b.x - a.x, b.z - a.z);
          const n = Math.max(1, Math.ceil(dist / 1.8));
          for (let k = 0; k <= n; k++) {
            CA.walkCircles.push({
              x: a.x + (b.x - a.x) * (k / n),
              z: a.z + (b.z - a.z) * (k / n),
              r: 2.4
            });
          }
        }
        (rallyPad.loop || []).forEach((p) => CA.walkCircles.push({ x: p.x, z: p.z, r: 3.1 }));
      }
    }
    if (CA.obstacles) CA.obstacles.push({ x: host.x, z: host.z, r: 3.3 });
    window.__libertyGround = (x, z) => {
      if (!host) return null;
      if (bridgeWalk && bridgeWalk.mesh && bridgeWalk.mesh.visible) {
        const deck = bridgeDeckY(x, z);
        if (deck != null) return deck;
      }
      const y = sampleGround(x - host.x, z - host.z);
      if (y == null || y < -0.12) return null;
      return y;
    };
    const proxy = { id: "liberty-mount" };
    const origCan = CA.isl.canLand.bind(CA.isl);
    const origLand = CA.isl.land.bind(CA.isl);
    const origGoal = CA.isl.nextGoal.bind(CA.isl);
    CA.isl.canLand = (pos) => {
      const hit = origCan(pos);
      if (hit) return hit;
      if (pos && Math.hypot(pos.x - host.dock.x, pos.z - host.dock.z) < 12) return proxy;
      return null;
    };
    CA.isl.land = (j) => {
      if (j && j.id === "liberty-mount") {
        if (CA.exitVehicle && CA.mode !== "walk") CA.exitVehicle();
        const gy = window.__libertyGround(host.land.x, host.land.z);
        CA.captain.position.set(host.land.x, gy == null ? 0.6 : gy, host.land.z);
        CA.captain.rotation.y = Math.atan2(host.x - host.land.x, host.z - host.land.z);
        if (CA.snapCamera) CA.snapCamera();
        return;
      }
      return origLand(j);
    };
    CA.isl.nextGoal = (pos) => {
      const goal = origGoal(pos);
      if (!pos) return goal;
      const d = Math.hypot(pos.x - host.dock.x, pos.z - host.dock.z);
      if (!goal || d < goal.d) return { d: d, brg: Math.atan2(host.dock.x - pos.x, host.dock.z - pos.z), text: "\u{1F9ED} Next island: \u{1F5FD} <b>Liberty Isle</b> \u00B7 " + Math.round(d) + " m" };
      return goal;
    };
  }

  const US_LL = [
    [-124.8, 48.4], [-124.5, 47.1], [-124.4, 46.2], [-124.1, 44.6], [-124.2, 43.3],
    [-124.4, 42.0], [-124.2, 40.4], [-123.7, 39.0], [-122.8, 37.8], [-122.4, 36.6],
    [-121.8, 36.0], [-120.6, 34.4], [-118.8, 34.0], [-117.2, 32.6], [-114.6, 32.5],
    [-111.1, 31.3], [-108.2, 31.3], [-106.5, 31.8], [-103.0, 29.0], [-100.8, 29.6],
    [-99.0, 27.5], [-97.4, 25.9], [-97.1, 27.8], [-95.0, 28.9], [-93.8, 29.7],
    [-90.6, 29.2], [-89.4, 29.0], [-89.1, 30.3], [-87.5, 30.3], [-84.9, 29.7],
    [-83.6, 30.0], [-82.7, 27.8], [-82.4, 26.4], [-81.8, 25.2], [-80.4, 25.2],
    [-80.0, 26.9], [-80.1, 28.8], [-80.6, 30.7], [-81.4, 30.7], [-81.2, 31.9],
    [-80.8, 32.1], [-79.2, 32.8], [-78.4, 33.8], [-77.3, 34.5], [-75.6, 35.2],
    [-75.5, 36.2], [-76.0, 37.0], [-76.0, 37.8], [-75.3, 38.4], [-74.8, 39.0],
    [-74.1, 40.2], [-73.9, 40.8], [-72.0, 41.2], [-70.7, 41.5], [-70.0, 42.1],
    [-70.6, 42.9], [-70.1, 43.2], [-69.2, 43.8], [-67.8, 44.6], [-67.0, 44.8],
    [-67.1, 45.6], [-67.9, 47.1], [-69.2, 47.3], [-70.8, 45.3], [-71.5, 45.0],
    [-73.3, 45.0], [-74.9, 45.0], [-76.1, 44.1], [-76.6, 43.5], [-79.0, 43.2],
    [-79.2, 42.6], [-81.2, 42.0], [-82.6, 41.7], [-83.0, 42.3], [-82.6, 43.2],
    [-83.3, 44.0], [-83.8, 45.2], [-84.6, 46.0], [-85.4, 46.6], [-87.2, 46.6],
    [-89.4, 46.8], [-92.1, 46.7], [-92.6, 48.3], [-95.2, 49.0], [-104.0, 49.0],
    [-116.0, 49.0], [-123.0, 49.0], [-124.8, 48.4]
  ];
  const LAKE_MI = [
    [-86.2, 45.85], [-86.8, 45.1], [-87.2, 44.1], [-87.7, 43.1], [-87.6, 42.4],
    [-87.0, 41.75], [-86.5, 42.05], [-86.1, 43.1], [-85.7, 44.3], [-85.5, 45.3], [-85.9, 45.85]
  ];
  const STATE_GEO = {
    Washington: [-120.4, 47.4, "West"], Oregon: [-120.5, 44.0, "West"], California: [-119.4, 37.2, "West"],
    Nevada: [-116.6, 39.3, "West"], Idaho: [-114.5, 44.4, "West"], Montana: [-109.6, 47.0, "West"],
    Wyoming: [-107.5, 43.0, "West"], Utah: [-111.6, 39.3, "West"], Colorado: [-105.5, 39.0, "West"],
    Arizona: [-111.6, 34.3, "Southwest"], "New Mexico": [-106.0, 34.4, "Southwest"], Texas: [-99.2, 31.4, "Southwest"],
    Oklahoma: [-97.5, 35.5, "Southwest"], Kansas: [-98.3, 38.5, "Midwest"], Nebraska: [-99.8, 41.5, "Midwest"],
    "South Dakota": [-100.2, 44.4, "Midwest"], "North Dakota": [-100.4, 47.4, "Midwest"], Minnesota: [-94.3, 46.3, "Midwest"],
    Iowa: [-93.5, 42.0, "Midwest"], Missouri: [-92.5, 38.4, "Midwest"], Arkansas: [-92.4, 34.9, "Southeast"],
    Louisiana: [-91.8, 31.0, "Southeast"], Wisconsin: [-89.8, 44.6, "Midwest"], Illinois: [-89.2, 40.0, "Midwest"],
    Mississippi: [-89.7, 32.7, "Southeast"], Michigan: [-84.6, 44.3, "Midwest"], Indiana: [-86.3, 39.9, "Midwest"],
    Kentucky: [-85.2, 37.5, "Southeast"], Tennessee: [-86.3, 35.8, "Southeast"], Alabama: [-86.8, 32.8, "Southeast"],
    Ohio: [-82.8, 40.3, "Midwest"], "West Virginia": [-80.6, 38.6, "Southeast"], Georgia: [-83.4, 32.6, "Southeast"],
    Florida: [-81.6, 28.1, "Southeast"], "South Carolina": [-80.9, 33.9, "Southeast"], "North Carolina": [-79.4, 35.5, "Southeast"],
    Virginia: [-78.6, 37.5, "Southeast"], Maryland: [-76.7, 39.0, "Southeast"], Delaware: [-75.5, 39.0, "Southeast"],
    Pennsylvania: [-77.6, 40.9, "Northeast"], "New Jersey": [-74.6, 40.2, "Northeast"], "New York": [-75.6, 43.0, "Northeast"],
    Connecticut: [-72.7, 41.6, "Northeast"], "Rhode Island": [-71.5, 41.7, "Northeast"], Massachusetts: [-71.8, 42.3, "Northeast"],
    Vermont: [-72.7, 44.1, "Northeast"], "New Hampshire": [-71.6, 43.7, "Northeast"], Maine: [-69.2, 45.4, "Northeast"]
  };
  const REGION_RGB = {
    West: [122, 52, 168], Southwest: [198, 62, 48], Midwest: [214, 148, 32], Southeast: [46, 125, 52], Northeast: [30, 120, 200]
  };
  let mapArt = null;
  function traceLL(g, pts, proj) {
    pts.forEach((p, i) => {
      const xy = proj(p[0], p[1]);
      if (i) g.lineTo(xy[0], xy[1]);
      else g.moveTo(xy[0], xy[1]);
    });
    g.closePath();
  }
  function paintMap(K) {
    const c = mapArt ? mapArt.canvas : document.createElement("canvas");
    c.width = 768; c.height = 560;
    const g = c.getContext("2d");
    const LON0 = -125.5, LON1 = -66.3, LAT0 = 24.3, LAT1 = 49.6;
    const proj = (lon, lat) => [(lon - LON0) / (LON1 - LON0) * 700 + 34, (LAT1 - lat) / (LAT1 - LAT0) * 400 + 24];
    const unproj = (x, y) => [LON0 + (x - 34) / 700 * (LON1 - LON0), LAT1 - (y - 24) / 400 * (LAT1 - LAT0)];
    g.fillStyle = "#8ec6ea";
    g.fillRect(0, 0, 768, 560);
    g.strokeStyle = "rgba(255,255,255,.28)";
    g.lineWidth = 2;
    for (let y = 40; y < 430; y += 18) { g.beginPath(); g.moveTo(20, y); g.lineTo(748, y + 6); g.stroke(); }
    g.beginPath();
    traceLL(g, US_LL, proj, false);
    traceLL(g, LAKE_MI, proj, true);
    g.fillStyle = "#f4efe4";
    g.fill("evenodd");
    const img = g.getImageData(0, 0, 768, 560);
    const data = img.data;
    const names = Object.keys(STATE_GEO);
    for (let y = 0; y < 560; y++) {
      for (let x = 0; x < 768; x++) {
        const i = (y * 768 + x) * 4;
        if (data[i] < 230 || data[i + 1] < 220) continue;
        const ll = unproj(x, y);
        let best = 1e9;
        let region = "Midwest";
        for (let n = 0; n < names.length; n++) {
          const row = STATE_GEO[names[n]];
          const dx = ll[0] - row[0];
          const dy = (ll[1] - row[1]) * 1.15;
          const d2 = dx * dx + dy * dy;
          if (d2 < best) { best = d2; region = row[2]; }
        }
        const rgb = REGION_RGB[region];
        data[i] = rgb[0]; data[i + 1] = rgb[1]; data[i + 2] = rgb[2];
      }
    }
    g.putImageData(img, 0, 0);
    g.beginPath();
    traceLL(g, US_LL, proj);
    g.lineWidth = 7;
    g.strokeStyle = "#10234d";
    g.lineJoin = "round";
    g.stroke();
    g.beginPath();
    traceLL(g, LAKE_MI, proj);
    g.fillStyle = "#8ec6ea";
    g.fill();
    g.lineWidth = 3;
    g.stroke();
    const placed = bag().placed || [];
    g.beginPath();
    traceLL(g, US_LL, proj);
    traceLL(g, LAKE_MI, proj);
    const dots = [];
    names.forEach((name) => {
      const row = STATE_GEO[name];
      const xy = proj(row[0], row[1]);
      if (g.isPointInPath(xy[0], xy[1], "evenodd")) dots.push({ x: xy[0], y: xy[1], on: placed.indexOf(name) >= 0 });
    });
    dots.forEach((dot) => {
      g.beginPath();
      g.arc(dot.x, dot.y, dot.on ? 6 : 2.6, 0, Math.PI * 2);
      g.fillStyle = dot.on ? "#ffe082" : "rgba(255,255,255,.92)";
      g.fill();
      g.lineWidth = 1;
      g.strokeStyle = "#10234d";
      g.stroke();
    });
    g.font = "bold 20px sans-serif";
    g.textAlign = "center";
    g.lineWidth = 4;
    g.strokeStyle = "#10234d";
    g.fillStyle = "#fff";
    [[-116, 42, "West"], [-100, 32.5, "Southwest"], [-93, 43, "Midwest"], [-84, 33, "Southeast"], [-74, 43.2, "Northeast"]].forEach((lab) => {
      const xy = proj(lab[0], lab[1]);
      g.strokeText(lab[2], xy[0], xy[1]);
      g.fillText(lab[2], xy[0], xy[1]);
    });
    function inset(pts, label, lx, ly) {
      g.beginPath();
      pts.forEach((p, i) => { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); });
      g.closePath();
      g.fillStyle = "rgb(122,52,168)";
      g.fill();
      g.lineWidth = 4;
      g.strokeStyle = "#10234d";
      g.stroke();
      const on = placed.indexOf(label) >= 0;
      g.fillStyle = on ? "#ffe082" : "#fff";
      g.font = "bold 20px sans-serif";
      g.strokeText(label, lx, ly);
      g.fillText(label, lx, ly);
    }
    inset([[48, 450], [78, 428], [120, 420], [150, 438], [168, 462], [140, 478], [148, 508], [124, 498], [108, 480], [86, 492], [64, 478], [40, 484], [36, 462]], "Alaska", 100, 530);
    g.beginPath(); g.ellipse(58, 498, 16, 5, -0.4, 0, Math.PI * 2); g.fillStyle = "rgb(122,52,168)"; g.fill(); g.stroke();
    inset([[210, 448], [228, 440], [236, 456], [222, 464]], "Hawaii", 268, 492);
    [[248, 456], [262, 448], [274, 460], [258, 470]].forEach((p, i) => {
      g.beginPath(); g.ellipse(p[0], p[1], 8 - i, 4, 0.4, 0, Math.PI * 2);
      g.fillStyle = "rgb(122,52,168)"; g.fill(); g.stroke();
    });
    g.fillStyle = "#10234d";
    g.font = "bold 26px sans-serif";
    g.fillText("United States", 384, 22);
    if (!mapArt) {
      const tex = new K.CanvasTex(c);
      tex.needsUpdate = true;
      mapArt = { canvas: c, tex: tex };
    } else mapArt.tex.needsUpdate = true;
    return mapArt.tex;
  }
  function mapTexture(K) { return paintMap(K); }
  function refreshMap() { if (mapArt && kit()) paintMap(kit()); }
  function stackTex(K, lines) {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 280;
    const g = c.getContext("2d");
    g.fillStyle = "#14336b";
    g.fillRect(0, 0, 512, 280);
    g.strokeStyle = "#ffc83d";
    g.lineWidth = 12;
    g.strokeRect(8, 8, 496, 264);
    g.fillStyle = "#fff";
    g.textAlign = "center";
    g.textBaseline = "middle";
    let size = 68;
    g.font = "bold " + size + "px sans-serif";
    while (lines.some((line) => g.measureText(line).width > 360) && size > 28) {
      size -= 2;
      g.font = "bold " + size + "px sans-serif";
    }
    lines.forEach((line, i) => g.fillText(line, 256, 100 + i * 88));
    const tex = new K.CanvasTex(c);
    tex.needsUpdate = true;
    return tex;
  }
  function labelTex(K, text) {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 128;
    const g = c.getContext("2d");
    g.fillStyle = "#14336b";
    g.fillRect(0, 0, 512, 128);
    g.strokeStyle = "#ffc83d";
    g.lineWidth = 10;
    g.strokeRect(8, 8, 496, 112);
    g.fillStyle = "#fff";
    g.textAlign = "center";
    g.textBaseline = "middle";
    let size = 40;
    g.font = "bold " + size + "px sans-serif";
    while (g.measureText(text).width > 470 && size > 18) { size -= 2; g.font = "bold " + size + "px sans-serif"; }
    g.fillText(text, 256, 64);
    const tex = new K.CanvasTex(c);
    tex.needsUpdate = true;
    return tex;
  }
  function plaqueTex(K, text) {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 160;
    const g = c.getContext("2d");
    g.fillStyle = "#14336b";
    g.fillRect(0, 0, 512, 160);
    g.strokeStyle = "#ffc83d";
    g.lineWidth = 12;
    g.strokeRect(8, 8, 496, 144);
    g.fillStyle = "#fff";
    g.textAlign = "center";
    g.textBaseline = "middle";
    let size = 34;
    g.font = "bold " + size + "px sans-serif";
    while (g.measureText(text).width > 460 && size > 16) { size -= 2; g.font = "bold " + size + "px sans-serif"; }
    g.fillText(text, 256, 80);
    const tex = new K.CanvasTex(c);
    tex.needsUpdate = true;
    return tex;
  }
  function routeTex(K) {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 160;
    const g = c.getContext("2d");
    g.fillStyle = "#14336b";
    g.fillRect(0, 0, 256, 160);
    g.strokeStyle = "#ffc83d";
    g.lineWidth = 8;
    g.strokeRect(6, 6, 244, 148);
    g.fillStyle = "#fff";
    g.font = "bold 28px sans-serif";
    g.textAlign = "center";
    g.fillText("Road Trip", 128, 40);
    g.strokeStyle = "#ffc83d";
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(36, 110); g.lineTo(90, 78); g.lineTo(140, 100); g.lineTo(210, 64);
    g.stroke();
    g.fillStyle = "#e53935";
    [[36, 110], [90, 78], [140, 100], [210, 64]].forEach((p) => { g.beginPath(); g.arc(p[0], p[1], 6, 0, Math.PI * 2); g.fill(); });
    const tex = new K.CanvasTex(c);
    tex.needsUpdate = true;
    return tex;
  }
  function usFlagTex(K) {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 140;
    const g = c.getContext("2d");
    for (let i = 0; i < 13; i++) {
      g.fillStyle = i % 2 ? "#ffffff" : "#b22234";
      g.fillRect(0, i * (140 / 13), 256, 140 / 13 + 1);
    }
    g.fillStyle = "#3c3b6e";
    g.fillRect(0, 0, 102, 76);
    g.fillStyle = "#ffffff";
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 6; col++) {
        g.beginPath();
        g.arc(10 + col * 16 + (row % 2 ? 8 : 0), 8 + row * 14, 2.2, 0, Math.PI * 2);
        g.fill();
      }
    }
    const tex = new K.CanvasTex(c);
    tex.needsUpdate = true;
    return tex;
  }
  function lathe(K, profile, seg, mat) {
    const geo = new K.Geo();
    const pos = [];
    const idx = [];
    for (let i = 0; i < profile.length; i++) {
      for (let k = 0; k < seg; k++) {
        const a = (k / seg) * Math.PI * 2;
        const fold = 1 + Math.cos(a * 3) * 0.045;
        const r = profile[i][0] * fold;
        pos.push(Math.cos(a) * r, profile[i][1], Math.sin(a) * r);
      }
    }
    for (let i = 0; i < profile.length - 1; i++) {
      for (let k = 0; k < seg; k++) {
        const a = i * seg + k;
        const b = i * seg + (k + 1) % seg;
        const c = a + seg;
        const d = b + seg;
        idx.push(a, b, c, b, d, c);
      }
    }
    geo.setAttribute("position", new K.Attr(new Float32Array(pos), 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const mesh = new K.Mesh(geo, mat);
    return mesh;
  }
  function turtleGround(turtle, x, z) {
    try {
      if (turtle && typeof turtle.ground === "function") {
        const y = turtle.ground(x, z);
        if (Number.isFinite(y)) return y;
      }
    } catch (err) { /* fall through */ }
    try {
      if (CA.isl && CA.isl.groundAt) {
        const y = CA.isl.groundAt(x, z);
        if (Number.isFinite(y)) return y;
      }
    } catch (err) { /* fall through */ }
    return null;
  }
  function bridgeAnchors() {
    const turtle = (CA.isl.L || []).find((j) => j.id === "turtle");
    if (!turtle || !lay) return null;
    const rel = toFS(turtle.cx - host.x, turtle.cz - host.z);
    let ang = Math.atan2(rel.s, rel.f);
    if (Math.abs(ang) < 0.75) ang = ang < 0 ? -0.95 : 0.95;
    const dirF = Math.cos(ang);
    const dirS = Math.sin(ang);
    const shore = shoreOf(dirF, dirS);
    let ax = 0;
    let az = 0;
    let yA = null;
    for (let inland = 9.4; inland >= 4.2; inland -= 0.6) {
      const f = dirF * (shore - inland);
      const s = dirS * (shore - inland);
      const w = worldFS(f, s);
      ax = host.x + w.x;
      az = host.z + w.z;
      const y = sampleGround(w.x, w.z);
      if (y != null && y > 0.55) { yA = y; break; }
      yA = y;
    }
    const dx = ax - turtle.cx;
    const dz = az - turtle.cz;
    const dist = Math.hypot(dx, dz) || 1;
    const tx = dx / dist;
    const tz = dz / dist;
    let bx = turtle.cx;
    let bz = turtle.cz;
    let yB = null;
    const radius = turtle.R || 19;
    for (let inset = 8.4; inset >= 3.2; inset -= 0.7) {
      bx = turtle.cx + tx * (radius - inset);
      bz = turtle.cz + tz * (radius - inset);
      const y = turtleGround(turtle, bx, bz);
      if (y != null && y > 0.25 && Math.hypot(bx - turtle.cx, bz - turtle.cz) < radius - 2) {
        yB = y;
        break;
      }
      yB = y;
    }
    return { ax: ax, az: az, bx: bx, bz: bz, turtle: turtle, terrainA: yA, terrainB: yB };
  }
  function bridgeDeckY(x, z) {
    if (!bridgeWalk) return null;
    const b = bridgeWalk;
    const dx = x - b.ax;
    const dz = z - b.az;
    const along = dx * b.ux + dz * b.uz;
    const side = dx * b.px + dz * b.pz;
    if (side < -1.35 || side > 1.35 || along < -0.6 || along > b.len + 0.6) return null;
    const ramp = b.ramp;
    const deck = b.deckY;
    const ease = (u) => { const t = u < 0 ? 0 : u > 1 ? 1 : u; return t * t * (3 - 2 * t); };
    if (along < ramp) return b.deckA + (deck - b.deckA) * ease(Math.max(0, along) / ramp);
    if (along > b.len - ramp) return b.deckB + (deck - b.deckB) * ease(Math.max(0, b.len - along) / ramp);
    return deck;
  }
  function placeSpan(K, lamb, root) {
    const ends = bridgeAnchors();
    if (!ends) return null;
    const dx = ends.bx - ends.ax;
    const dz = ends.bz - ends.az;
    const len = Math.hypot(dx, dz);
    if (len < 8) return null;
    const ux = dx / len;
    const uz = dz / len;
    const deckY = 3.45;
    const yA = ends.terrainA != null && ends.terrainA > 0.2 ? ends.terrainA : 0.7;
    const yB = ends.terrainB != null && ends.terrainB > 0.2 ? ends.terrainB : 0.7;
    const deckA = yA + 0.42;
    const deckB = yB + 0.42;
    const ramp = Math.min(11, Math.max(7, len * 0.26));
    const ease = (u) => { const t = u < 0 ? 0 : u > 1 ? 1 : u; return t * t * (3 - 2 * t); };
    const yAt = (along) => {
      if (along < ramp) return deckA + (deckY - deckA) * ease(along / ramp);
      if (along > len - ramp) return deckB + (deckY - deckB) * ease((len - along) / ramp);
      return deckY;
    };
    const g = new K.Group();
    g.position.set((ends.ax + ends.bx) / 2, 0, (ends.az + ends.bz) / 2);
    g.rotation.y = Math.atan2(-dz, dx);
    const orange = lamb(0xf04a00);
    const dark = lamb(0xc2410c);
    const concrete = lamb(0xc8c2b8);
    const deckPos = [];
    const deckIdx = [];
    const segs = 22;
    const halfW = 1.08;
    for (let i = 0; i <= segs; i++) {
      const along = (len * i) / segs;
      const x = -len / 2 + along;
      const top = yAt(along);
      deckPos.push(x, top, -halfW, x, top, halfW, x, top - 0.16, -halfW, x, top - 0.16, halfW);
    }
    for (let i = 0; i < segs; i++) {
      const a = i * 4;
      const b = a + 4;
      deckIdx.push(a, b, a + 1, b, b + 1, a + 1);
      deckIdx.push(a + 2, a + 3, b + 2, a + 3, b + 3, b + 2);
      deckIdx.push(a, a + 2, b, b, a + 2, b + 2);
      deckIdx.push(a + 1, b + 1, a + 3, b + 1, b + 3, a + 3);
    }
    const deckGeo = new K.Geo();
    deckGeo.setAttribute("position", new K.Attr(new Float32Array(deckPos), 3));
    deckGeo.setIndex(deckIdx);
    deckGeo.computeVertexNormals();
    g.add(new K.Mesh(deckGeo, lamb(0x5d6d7a)));
    [-halfW + 0.06, halfW - 0.06].forEach((z) => {
      const railPos = [];
      const railIdx = [];
      for (let i = 0; i <= segs; i++) {
        const along = (len * i) / segs;
        const x = -len / 2 + along;
        const y = yAt(along) + 0.28;
        railPos.push(x, y, z - 0.03, x, y, z + 0.03, x, y + 0.08, z - 0.03, x, y + 0.08, z + 0.03);
      }
      for (let i = 0; i < segs; i++) {
        const a = i * 4;
        const b = a + 4;
        railIdx.push(a + 2, b + 2, a + 3, b + 2, b + 3, a + 3);
      }
      const railGeo = new K.Geo();
      railGeo.setAttribute("position", new K.Attr(new Float32Array(railPos), 3));
      railGeo.setIndex(railIdx);
      railGeo.computeVertexNormals();
      g.add(new K.Mesh(railGeo, orange));
    });
    const towerX = len * 0.22;
    const towerTop = deckY + 8.6;
    const legBottom = -0.35;
    const legH = towerTop - legBottom;
    [-towerX, towerX].forEach((x) => {
      [-0.62, 0.62].forEach((z) => {
        const leg = new K.Mesh(new K.Box(0.16, legH, 0.16), orange);
        leg.position.set(x, (towerTop + legBottom) / 2, z);
        g.add(leg);
      });
      const pier = new K.Mesh(new K.Cyl(0.16, 0.2, 1.35, 7), dark);
      pier.position.set(x, 0.15, 0);
      g.add(pier);
      [deckY + 1.35, deckY + 4.05, towerTop - 0.55].forEach((y, i) => {
        const beam = new K.Mesh(new K.Box(0.2, i === 2 ? 0.28 : 0.12, 1.45), i === 2 ? dark : orange);
        beam.position.set(x, y, 0);
        g.add(beam);
      });
    });
    const pos = [];
    const idx = [];
    function quad(a, b, c, d) {
      const o = pos.length / 3;
      [a, b, c, d].forEach((p) => pos.push(p[0], p[1], p[2]));
      idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
    }
    function cableStrip(z, x0, y0, x1, y1, sag) {
      const n = 8;
      const w = 0.07;
      for (let i = 0; i < n; i++) {
        const t0 = i / n;
        const t1 = (i + 1) / n;
        const sx0 = x0 + (x1 - x0) * t0;
        const sx1 = x0 + (x1 - x0) * t1;
        const bow = (t) => Math.sin(t * Math.PI) * sag;
        const sy0 = y0 + (y1 - y0) * t0 - bow(t0);
        const sy1 = y0 + (y1 - y0) * t1 - bow(t1);
        quad([sx0, sy0, z - w], [sx1, sy1, z - w], [sx1, sy1, z + w], [sx0, sy0, z + w]);
      }
    }
    const top = towerTop - 0.35;
    const mainSag = Math.max(1.6, towerX * 0.55);
    [-0.62, 0.62].forEach((z) => {
      cableStrip(z, -len / 2 + 0.7, yA + 0.85, -towerX, top, 0.8);
      cableStrip(z, -towerX, top, towerX, top, mainSag);
      cableStrip(z, towerX, top, len / 2 - 0.7, yB + 0.85, 0.8);
      const steps = Math.max(6, Math.round(towerX * 1.4));
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const x = -towerX + t * towerX * 2;
        const y = top - Math.sin(t * Math.PI) * mainSag;
        if (y - deckY < 0.45) continue;
        quad([x - 0.025, deckY + 0.22, z], [x + 0.025, deckY + 0.22, z], [x + 0.025, y, z], [x - 0.025, y, z]);
      }
    });
    const geo = new K.Geo();
    geo.setAttribute("position", new K.Attr(new Float32Array(pos), 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    g.add(new K.Mesh(geo, orange));
    [[-len / 2 + 0.7, yA], [len / 2 - 0.7, yB]].forEach((end) => {
      const block = new K.Mesh(new K.Box(2.2, 0.9, 2.5), concrete);
      block.position.set(end[0], end[1] + 0.45, 0);
      g.add(block);
    });
    root.add(g);
    bridgeWalk = {
      ax: ends.ax, az: ends.az, bx: ends.bx, bz: ends.bz,
      ux: ux, uz: uz, px: -uz, pz: ux,
      len: len, deckY: deckY, ramp: ramp,
      terrainA: yA, terrainB: yB, deckA: deckA, deckB: deckB,
      mesh: g
    };
    g.userData.span = bridgeWalk;
    g.userData.role = "gate";
    return g;
  }
  function dressMonuments(K, root, lamb) {
    const makers = {
      bell: () => bellMesh(K, lamb),
      alamo: () => alamoMesh(K, lamb),
      arch: () => archMesh(K, lamb),
      liberty: () => statueMesh(K, lamb),
      needle: () => needleMesh(K, lamb),
      rushmore: () => rushmoreMesh(K, lamb),
      gate: () => bridgeMesh(K, lamb)
    };
    const spots = {
      liberty: [30.2, -8.2, 0],
      arch: [24.2, 0.2, 0],
      bell: [20.4, 3.2, 0],
      alamo: [2.4, 12.6, 0],
      needle: [15.2, 10.4, 0],
      rushmore: [-1.4, -1.5, 2.4]
    };
    BANK.landmarks.forEach((lm) => {
      let mesh = null;
      if (lm.id === "gate") mesh = placeSpan(K, lamb, root);
      if (!mesh) mesh = makers[lm.id]();
      const at = spots[lm.id] || [0, 0, 0];
      if (lm.id === "rushmore") {
        seatRushmore(mesh);
        root.add(mesh);
        mesh.userData.role = "rushmore";
      } else if (lm.id !== "gate") place(root, mesh, at[0], at[1], at[2] || 0);
      if (lm.id === "liberty" || lm.id === "alamo" || lm.id === "bell" || lm.id === "needle") mesh.rotation.y = lay.yaw;
      if (lm.id === "arch") {
        mesh.rotation.y = lay.yaw;
        mesh.scale.setScalar(3.5);
        mesh.userData.role = "arch";
      }
      if (lm.id === "needle") mesh.scale.setScalar(2.2);
      mesh.name = "v51-monument";
      mesh.visible = lm.id === "gate" ? true : !!bag().landmarks[lm.id];
      monuments[lm.id] = mesh;
      const shade = new K.Mesh(new K.Circle(1.3, 12), new K.Basic({ color: 0x14301c, transparent: true, opacity: 0.22, depthWrite: false }));
      shade.rotation.x = -Math.PI / 2;
      shade.position.set(mesh.position.x, mesh.position.y + 0.03, mesh.position.z);
      shade.visible = mesh.visible && lm.id !== "rushmore";
      shade.userData.nofade = 1;
      if (lm.id !== "rushmore") {
        root.add(shade);
        mesh.userData.shade = shade;
      }
    });
  }
  function bellMesh(K, lamb) {
    const g = new K.Group();
    const wood = lamb(0x6d4c41);
    const brass = lamb(0xd4a017);
    [-0.85, 0.85].forEach((x) => {
      const post = new K.Mesh(new K.Cyl(0.09, 0.11, 2.6, 6), wood);
      post.position.set(x, 1.3, 0);
      g.add(post);
    });
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      const a = Math.PI * (1 - t);
      const beam = new K.Mesh(new K.Box(0.34, 0.16, 0.2), wood);
      beam.position.set(Math.cos(a) * 0.85, 2.55 + Math.sin(a) * 0.55, 0);
      g.add(beam);
    }
    const body = lathe(K, [[0.18, 2.15], [0.28, 1.95], [0.42, 1.7], [0.62, 1.15], [0.72, 0.55], [0.6, 0.28]], 14, brass);
    g.add(body);
    const lip = new K.Mesh(new K.Torus(0.62, 0.07, 6, 16), lamb(0xb8860b));
    lip.rotation.x = Math.PI / 2;
    lip.position.y = 0.32;
    g.add(lip);
    const crack = new K.Mesh(new K.Box(0.05, 0.7, 0.08), lamb(0x3e2723));
    crack.position.set(0.18, 0.7, 0.58);
    crack.rotation.z = 0.18;
    g.add(crack);
    const clapper = new K.Mesh(new K.Sphere(0.1, 6, 5), lamb(0x5d4037));
    clapper.position.y = 1.15;
    g.add(clapper);
    const roof = new K.Mesh(new K.Box(2.3, 0.12, 1.35), lamb(0x8d6e63));
    roof.position.y = 3.2;
    g.add(roof);
    return g;
  }
  function alamoMesh(K, lamb) {
    const g = new K.Group();
    const stone = lamb(0xe7d3b0);
    stone.side = 2;
    const geo = new K.Geo();
    const pos = [];
    const n = 18;
    const W = 5.6;
    function topY(t) {
      const x = (t - 0.5) * 2;
      let y = 2.15 + Math.cos(x * Math.PI * 0.5) * 0.95;
      const c = Math.max(0, 1 - Math.abs(t - 0.5) / 0.07);
      y += c * 0.62;
      return y;
    }
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = (t - 0.5) * W;
      const y = topY(t);
      pos.push(x, 0, 0.32, x, y, 0.32, x, 0, -0.32, x, y, -0.32);
    }
    const idx = [];
    for (let i = 0; i < n; i++) {
      const a = i * 4;
      idx.push(a, a + 4, a + 1, a + 1, a + 4, a + 5);
      idx.push(a + 2, a + 3, a + 6, a + 3, a + 7, a + 6);
      idx.push(a + 1, a + 5, a + 3, a + 3, a + 5, a + 7);
    }
    geo.setAttribute("position", new K.Attr(new Float32Array(pos), 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    g.add(new K.Mesh(geo, stone));
    const door = new K.Mesh(new K.Box(0.7, 1.15, 0.2), lamb(0x4e342e));
    door.position.set(0, 0.6, 0.36);
    g.add(door);
    const arch = new K.Mesh(new K.Torus(0.38, 0.07, 6, 10), lamb(0x4e342e));
    arch.position.set(0, 1.15, 0.38);
    g.add(arch);
    [-1.6, 1.6].forEach((x) => {
      const win = new K.Mesh(new K.Box(0.28, 0.42, 0.12), lamb(0x3e2723));
      win.position.set(x, 1.35, 0.38);
      g.add(win);
    });
    const step = new K.Mesh(new K.Box(2.2, 0.18, 0.9), stone);
    step.position.set(0, 0.09, 0.7);
    g.add(step);
    return g;
  }
  function cable(K, mat, x0, y0, x1, y1, z) {
    const parts = [];
    const n = 10;
    for (let i = 0; i < n; i++) {
      const t0 = i / n;
      const t1 = (i + 1) / n;
      const ax = x0 + (x1 - x0) * t0;
      const bx = x0 + (x1 - x0) * t1;
      const ay = y0 + (y1 - y0) * t0;
      const by = y0 + (y1 - y0) * t1;
      const len = Math.hypot(bx - ax, by - ay);
      const seg = new K.Mesh(new K.Cyl(0.035, 0.035, len * 1.08, 5), mat);
      seg.position.set((ax + bx) / 2, (ay + by) / 2, z);
      seg.rotation.z = Math.atan2(bx - ax, by - ay);
      parts.push(seg);
    }
    return parts;
  }
  function archMesh(K, lamb) {
    const g = new K.Group();
    const steel = new K.Lambert({ color: 0xe7eef2, emissive: 0xb7c4ce, emissiveIntensity: 0.35, side: 2 });
    const span = 8.2;
    const height = 8.4;
    const n = 40;
    const a = span / 2.35;
    const xMax = span / 2;
    const coshE = Math.cosh(xMax / a);
    const yAt = (x) => (coshE - Math.cosh(x / a)) / (coshE - 1) * height;
    const frames = [];
    for (let i = 0; i <= n; i++) {
      const x = -xMax + (span * i) / n;
      const y = yAt(x);
      const dx = 0.05;
      const dy = yAt(Math.min(xMax, x + dx)) - yAt(Math.max(-xMax, x - dx));
      const len = Math.hypot(dx * 2, dy) || 1;
      const tx = (dx * 2) / len;
      const ty = dy / len;
      const thick = 0.82 * (1 - y / height) + 0.2;
      frames.push({ x: x, y: y, nx: -ty, ny: tx, w: thick * 0.5, d: thick * 0.32 });
    }
    const pos = [];
    const idx = [];
    frames.forEach((f) => {
      const pts = [
        [f.x + f.nx * f.w, f.y + f.ny * f.w, f.d],
        [f.x + f.nx * f.w, f.y + f.ny * f.w, -f.d],
        [f.x - f.nx * f.w, f.y - f.ny * f.w, -f.d],
        [f.x - f.nx * f.w, f.y - f.ny * f.w, f.d]
      ];
      pts.forEach((p) => pos.push(p[0], p[1], p[2]));
    });
    for (let i = 1; i <= n; i++) {
      const b = i * 4;
      const a0 = b - 4;
      for (let k = 0; k < 4; k++) {
        const k2 = (k + 1) % 4;
        idx.push(a0 + k, b + k, b + k2, a0 + k, b + k2, a0 + k2);
      }
    }
    const geo = new K.Geo();
    geo.setAttribute("position", new K.Attr(new Float32Array(pos), 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const tube = new K.Mesh(geo, steel);
    tube.castShadow = true;
    g.add(tube);
    [-xMax, xMax].forEach((x) => {
      const pad = new K.Mesh(new K.Box(0.7, 0.16, 0.55), steel);
      pad.position.set(x, 0.08, 0);
      g.add(pad);
    });
    return g;
  }
  function statueMesh(K, lamb) {
    const g = new K.Group();
    const copper = lamb(0x3f9d6e);
    copper.side = 2;
    const copperDeep = lamb(0x2f7d52);
    const stone = lamb(0xd4cdc2);
    const stoneDark = lamb(0xb7b1a6);
    let y = 0;
    [[3.5, 0.34], [2.9, 0.28], [2.4, 0.24], [1.55, 0.18], [1.22, 1.9], [1.55, 0.18], [1.18, 0.16]].forEach((step, i) => {
      const block = new K.Mesh(new K.Box(step[0], step[1], step[0] * 0.92), i % 2 ? stoneDark : stone);
      block.position.y = y + step[1] / 2;
      y += step[1];
      block.castShadow = true;
      g.add(block);
    });
    const figure = new K.Group();
    figure.position.y = y;
    const robe = lathe(K, [[0.95, 0], [0.84, 0.35], [0.66, 0.9], [0.52, 1.45], [0.4, 1.9], [0.36, 2.25], [0.44, 2.7], [0.34, 3.05], [0.2, 3.25]], 12, copper);
    robe.castShadow = true;
    figure.add(robe);
    const fold = new K.Mesh(new K.Box(0.08, 2.4, 0.12), copperDeep);
    fold.position.set(0, 1.3, 0.5);
    figure.add(fold);
    const head = new K.Mesh(new K.Sphere(0.32, 12, 10), copper);
    head.position.set(0, 3.62, 0.02);
    head.scale.set(1, 1.12, 0.95);
    figure.add(head);
    const nose = new K.Mesh(new K.Box(0.06, 0.08, 0.08), copperDeep);
    nose.position.set(0, 3.58, 0.3);
    figure.add(nose);
    const band = new K.Mesh(new K.Cyl(0.34, 0.34, 0.1, 10), copper);
    band.position.y = 3.92;
    figure.add(band);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
      const spike = new K.Mesh(new K.Cone(0.055, 0.62, 4), copper);
      spike.position.set(Math.cos(a) * 0.28, 4.28, Math.sin(a) * 0.28);
      spike.rotation.x = Math.sin(a) * 0.35;
      spike.rotation.z = -Math.cos(a) * 0.35;
      figure.add(spike);
    }
    const arm = new K.Mesh(new K.Cyl(0.08, 0.1, 1.55, 6), copper);
    arm.position.set(-0.48, 3.45, 0.22);
    arm.rotation.z = 0.22;
    arm.rotation.x = -0.15;
    figure.add(arm);
    const cup = new K.Mesh(new K.Cyl(0.16, 0.1, 0.16, 8), lamb(0xc9a227));
    cup.position.set(-0.62, 4.22, 0.32);
    const flame = new K.Mesh(new K.Cone(0.18, 0.55, 8), new K.Lambert({ color: 0xffe082, emissive: 0xffb300, emissiveIntensity: 1.1 }));
    flame.position.set(-0.62, 4.58, 0.32);
    figure.add(cup); figure.add(flame);
    const left = new K.Mesh(new K.Cyl(0.075, 0.09, 1.15, 6), copper);
    left.position.set(0.48, 2.15, 0.28);
    left.rotation.z = -0.7;
    left.rotation.x = 0.25;
    figure.add(left);
    const tablet = new K.Mesh(new K.Box(0.42, 0.72, 0.08), lamb(0xe7d7b0));
    tablet.position.set(0.78, 1.85, 0.42);
    tablet.rotation.y = -0.4;
    const tabletEdge = new K.Mesh(new K.Box(0.48, 0.78, 0.04), lamb(0xc4b48a));
    tabletEdge.position.copy(tablet.position);
    tabletEdge.position.z -= 0.04;
    tabletEdge.rotation.y = -0.4;
    figure.add(tabletEdge); figure.add(tablet);
    g.add(figure);
    return g;
  }
  function needleMesh(K, lamb) {
    const g = new K.Group();
    const shaft = new K.Mesh(new K.Cyl(0.08, 0.12, 2.4, 8), lamb(0xeceff1));
    shaft.position.y = 1.2;
    g.add(shaft);
    return g;
  }
  function rushmoreFrame() {
    const s = 0.1;
    const f = cliffLine(s) + 0.22;
    const lip = massifH(cliffLine(s), s);
    const h = lip - 2.15;
    let nx = lay.fx * 0.94;
    let ny = 0.22;
    let nz = lay.fz * 0.94;
    const nl = Math.hypot(nx, ny, nz) || 1;
    nx /= nl; ny /= nl; nz /= nl;
    const w = worldFS(f, s);
    return { x: host.x + w.x, y: h * GROW, z: host.z + w.z, nx: nx, ny: ny, nz: nz, f: f, s: s, h: h };
  }
  function seatRushmore(mesh) {
    const frame = mesh.userData.frame;
    const nx = frame.nx;
    const ny = frame.ny;
    const nz = frame.nz;
    let ux = -nx * ny;
    let uy = 1 - ny * ny;
    let uz = -nz * ny;
    const ul = Math.hypot(ux, uy, uz) || 1;
    ux /= ul; uy /= ul; uz /= ul;
    let rx = uy * nz - uz * ny;
    let ry = uz * nx - ux * nz;
    let rz = ux * ny - uy * nx;
    const rl = Math.hypot(rx, ry, rz) || 1;
    rx /= rl; ry /= rl; rz /= rl;
    if (rx * nz + rz * -nx < 0) { rx = -rx; ry = -ry; rz = -rz; ux = -ux; uy = -uy; uz = -uz; }
    mesh.position.set(frame.x, frame.y, frame.z);
    mesh.matrixAutoUpdate = false;
    const m = mesh.matrix.elements;
    m[0] = rx; m[1] = ry; m[2] = rz; m[3] = 0;
    m[4] = ux; m[5] = uy; m[6] = uz; m[7] = 0;
    m[8] = nx; m[9] = ny; m[10] = nz; m[11] = 0;
    m[12] = frame.x; m[13] = frame.y; m[14] = frame.z; m[15] = 1;
    mesh.matrixWorldNeedsUpdate = true;
  }
  function blurField(src, w, h) {
    const tmp = new Float32Array(src.length);
    const out = new Float32Array(src.length);
    const k = [0.15, 0.7, 0.15];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let acc = 0;
        for (let t = -1; t <= 1; t++) acc += src[y * w + Math.max(0, Math.min(w - 1, x + t))] * k[t + 1];
        tmp[y * w + x] = acc;
      }
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let acc = 0;
        for (let t = -1; t <= 1; t++) acc += tmp[Math.max(0, Math.min(h - 1, y + t)) * w + x] * k[t + 1];
        out[y * w + x] = acc;
      }
    }
    return out;
  }
  function sampleField(field, w, h, u, v) {
    const x = Math.max(0, Math.min(w - 1.001, u * (w - 1)));
    const y = Math.max(0, Math.min(h - 1.001, v * (h - 1)));
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const tx = x - x0;
    const ty = y - y0;
    const i = (yy, xx) => field[yy * w + xx];
    return i(y0, x0) * (1 - tx) * (1 - ty) + i(y0, x0 + 1) * tx * (1 - ty) + i(y0 + 1, x0) * (1 - tx) * ty + i(y0 + 1, x0 + 1) * tx * ty;
  }
  function rushmoreMaps(img) {
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    const raw = g.getImageData(0, 0, c.width, c.height);
    const data = raw.data;
    const feather = Math.round(Math.min(c.width, c.height) * 0.22);
    const rockPx = (x, y) => {
      const p = (y * c.width + x) * 4;
      const r = data[p];
      const gg = data[p + 1];
      const b = data[p + 2];
      if (b > r + 16 && b > 140) return false;
      let spread = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const xx = Math.max(0, Math.min(c.width - 1, x + dx));
          const yy = Math.max(0, Math.min(c.height - 1, y + dy));
          spread += Math.abs(data[(yy * c.width + xx) * 4] - r);
        }
      }
      const flatFill = spread < 90 && r < 205 && Math.abs(r - gg) < 22 && Math.abs(gg - b) < 28 && r > 130;
      return !flatFill;
    };
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        const n = 0.55 + 0.45 * Math.sin(x * 0.31 + y * 0.17) * Math.cos(y * 0.27 - x * 0.11);
        const edge = Math.min(x, y, c.width - 1 - x, c.height - 1 - y) / (feather * (0.55 + n * 0.7));
        let t = edge >= 1 ? 1 : edge * edge * (3 - 2 * edge);
        if (!rockPx(x, y)) t = 0;
        const p = (y * c.width + x) * 4;
        const warmR = Math.min(255, data[p] * 1.03);
        const warmG = data[p + 1] * 0.99;
        const warmB = data[p + 2] * 0.9;
        data[p] = warmR * t + 196 * (1 - t);
        data[p + 1] = warmG * t + 188 * (1 - t);
        data[p + 2] = warmB * t + 176 * (1 - t);
        data[p + 3] = Math.round(255 * t);
      }
    }
    g.putImageData(raw, 0, 0);
    const blurred = g.getImageData(0, 0, c.width, c.height);
    const srcA = blurred.data;
    const outA = new Uint8ClampedArray(srcA);
    for (let y = 1; y < c.height - 1; y++) {
      for (let x = 1; x < c.width - 1; x++) {
        let a = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) a += srcA[((y + dy) * c.width + (x + dx)) * 4 + 3];
        }
        outA[(y * c.width + x) * 4 + 3] = a / 9;
      }
    }
    blurred.data.set(outA);
    g.putImageData(blurred, 0, 0);
    const w = c.width;
    const h = c.height;
    const lum = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      lum[i] = (data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114) / 255;
    }
    let broad = lum;
    for (let n = 0; n < 14; n++) broad = blurField(broad, w, h);
    const detail = new Float32Array(w * h);
    for (let i = 0; i < lum.length; i++) detail[i] = lum[i] - broad[i];
    const normals = document.createElement("canvas");
    normals.width = w;
    normals.height = h;
    const ng = normals.getContext("2d");
    const imgData = ng.createImageData(w, h);
    const strength = 1.6;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const l = broad[y * w + Math.max(0, x - 1)] + detail[y * w + Math.max(0, x - 1)] * 1.4;
        const r = broad[y * w + Math.min(w - 1, x + 1)] + detail[y * w + Math.min(w - 1, x + 1)] * 1.4;
        const u = broad[Math.max(0, y - 1) * w + x] + detail[Math.max(0, y - 1) * w + x] * 1.4;
        const d = broad[Math.min(h - 1, y + 1) * w + x] + detail[Math.min(h - 1, y + 1) * w + x] * 1.4;
        let nx = (l - r) * strength;
        let ny = (u - d) * strength;
        let nz = 1;
        const len = Math.hypot(nx, ny, nz) || 1;
        const p = (y * w + x) * 4;
        imgData.data[p] = (nx / len * 0.5 + 0.5) * 255;
        imgData.data[p + 1] = (ny / len * 0.5 + 0.5) * 255;
        imgData.data[p + 2] = (nz / len * 0.5 + 0.5) * 255;
        imgData.data[p + 3] = 255;
      }
    }
    ng.putImageData(imgData, 0, 0);
    return { albedo: c, broad: broad, detail: detail, normals: normals, w: w, h: h };
  }
  function rushmoreMesh(K) {
    const g = new K.Group();
    const frame = rushmoreFrame();
    g.userData.frame = frame;
    if (!rushmorePhoto) return g;
    const maps = rushmoreMaps(rushmorePhoto);
    const cols = 128;
    const rows = 64;
    const span = 15.4;
    const tall = span * (maps.h / maps.w) * 1.2;
    const positions = [];
    const uvs = [];
    const index = [];
    for (let iy = 0; iy <= rows; iy++) {
      for (let ix = 0; ix <= cols; ix++) {
        const u = ix / cols;
        const v = iy / rows;
        const x = (u - 0.5) * span;
        const y = (v - 0.5) * tall;
        const edge = Math.min(u, 1 - u, v, 1 - v) / 0.08;
        const mask = edge >= 1 ? 1 : edge * edge * (3 - 2 * edge);
        const base = sampleField(maps.broad, maps.w, maps.h, u, 1 - v);
        let z = 0.62 + (base - 0.5) * 0.28 * mask;
        if (z < 0.4) z = 0.4;
        positions.push(x, y, z);
        uvs.push(u, 1 - v);
      }
    }
    const stride = cols + 1;
    for (let iy = 0; iy < rows; iy++) {
      for (let ix = 0; ix < cols; ix++) {
        const a = iy * stride + ix;
        index.push(a, a + 1, a + stride, a + 1, a + stride + 1, a + stride);
      }
    }
    const geo = new K.Geo();
    geo.setAttribute("position", new K.Attr(new Float32Array(positions), 3));
    geo.setAttribute("uv", new K.Attr(new Float32Array(uvs), 2));
    geo.setIndex(index);
    geo.computeVertexNormals();
    try { if (geo.computeTangents) geo.computeTangents(); } catch (err) { /* the displaced vertices still carry smooth normals */ }
    const albedo = new K.CanvasTex(maps.albedo);
    albedo.needsUpdate = true;
    const normal = new K.CanvasTex(maps.normals);
    normal.needsUpdate = true;
    albedo.flipY = false;
    normal.flipY = false;
    const mat = new K.Lambert({ map: albedo, normalMap: normal, transparent: true, depthWrite: true, side: 2 });
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = -1;
    mat.polygonOffsetUnits = -1;
    const mesh = new K.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
    return g;
  }
  function bridgeMesh(K, lamb) {
    const g = new K.Group();
    const orange = lamb(0xf04a00);
    const dark = lamb(0xc2410c);
    const deck = new K.Mesh(new K.Box(12.5, 0.16, 1.15), lamb(0x546e7a));
    deck.position.y = 2.05;
    g.add(deck);
    [-0.52, 0.52].forEach((z) => {
      const rail = new K.Mesh(new K.Box(12.4, 0.08, 0.06), lamb(0x37474f));
      rail.position.set(0, 2.35, z);
      g.add(rail);
    });
    [-3.5, 3.5].forEach((x) => {
      [-0.42, 0.42].forEach((z) => {
        const leg = new K.Mesh(new K.Box(0.28, 6.6, 0.28), orange);
        leg.position.set(x, 3.3, z);
        leg.castShadow = true;
        g.add(leg);
      });
      [2.15, 4.15, 5.55, 6.35].forEach((y, i) => {
        const beam = new K.Mesh(new K.Box(0.34, i === 3 ? 0.28 : 0.18, 1.15), i % 2 ? dark : orange);
        beam.position.set(x, y, 0);
        g.add(beam);
      });
      const cap = new K.Mesh(new K.Box(0.7, 0.22, 1.35), orange);
      cap.position.set(x, 6.7, 0);
      g.add(cap);
    });
    [-0.42, 0.42].forEach((z) => {
      cable(K, orange, -8.2, 2.2, -3.5, 6.5, z).forEach((seg) => g.add(seg));
      cable(K, orange, 3.5, 6.5, 8.2, 2.2, z).forEach((seg) => g.add(seg));
      const n = 14;
      for (let i = 0; i < n; i++) {
        const t0 = i / n;
        const t1 = (i + 1) / n;
        const sag = (t) => 6.5 - Math.sin(t * Math.PI) * 3.15;
        const x0 = -3.5 + t0 * 7;
        const x1 = -3.5 + t1 * 7;
        cable(K, orange, x0, sag(t0), x1, sag(t1), z).forEach((seg) => g.add(seg));
      }
    });
    for (let i = 1; i < 12; i++) {
      const t = i / 12;
      const x = -3.5 + t * 7;
      const sag = 6.5 - Math.sin(t * Math.PI) * 3.15;
      const drop = sag - 2.15;
      if (drop < 0.2) continue;
      [-0.42, 0.42].forEach((z) => {
        const line = new K.Mesh(new K.Box(0.03, drop, 0.03), orange);
        line.position.set(x, 2.15 + drop / 2, z);
        g.add(line);
      });
    }
    [-6.4, 6.4].forEach((x) => {
      const anch = new K.Mesh(new K.Box(0.7, 0.45, 1.1), lamb(0x8d847c));
      anch.position.set(x, 1.7, 0);
      g.add(anch);
    });
    return g;
  }
  function frameCave(cam, cap) {
    const c = caveLocal(cap.position.x, cap.position.y, cap.position.z);
    const room = { x0: -1.15, x1: 1.15, z0: -5.55, z1: -0.7, y0: 0.85, y1: 1.7 };
    let z = c.z - 3.6;
    if (z < room.z0 || z > room.z1) z = c.z + 3.6;
    z = Math.max(room.z0, Math.min(room.z1, z));
    if (Math.abs(z - c.z) < 2.9) z = Math.abs(room.z0 - c.z) >= Math.abs(room.z1 - c.z) ? room.z0 : room.z1;
    const x = c.x >= 0 ? 1.05 : -1.05;
    const y = c.y + 0.95;
    const w = caveWorld(
      Math.max(room.x0, Math.min(room.x1, x)),
      Math.max(room.y0, Math.min(room.y1, y)),
      Math.max(room.z0, Math.min(room.z1, z))
    );
    cam.position.set(w.x, w.y, w.z);
    cam.lookAt(cap.position.x, cap.position.y + 1.02, cap.position.z);
  }
  function rallyCover(hide) {
    const root = CA.scene.getObjectByName("v51-root");
    if (!root || root.userData.rallyCover === hide) return;
    root.userData.rallyCover = hide;
    root.traverse((o) => {
      if (o.name === "v51-palm" || o.name === "v51-map-table") o.visible = !hide;
    });
  }
  function aimCamera(cam) {
    if (!cam || !host || !lay) return;
    if (cam.clearViewOffset) cam.clearViewOffset();
    rallyCover(!!(session && session.id === "rally"));
    const shot = window.__libertyCam;
    if (shot && shot.x != null) {
      cam.position.set(shot.x, shot.y, shot.z);
      cam.lookAt(shot.lx, shot.ly, shot.lz);
      return;
    }
    if (window.__libertyAerial) {
      cam.position.set(host.x + lay.fx * 78, 58, host.z + lay.fz * 78);
      cam.lookAt(host.x, 6, host.z);
      return;
    }
    if (session && session.id === "map" && mapAnchor) {
      const p = mapAnchor;
      cam.position.set(p.x + lay.fx * 2.8, p.y + 9.5, p.z + lay.fz * 2.8);
      cam.lookAt(p.x, p.y, p.z);
      const W = window.innerWidth || 1280;
      const H = window.innerHeight || 800;
      if (cam.setViewOffset) cam.setViewOffset(W, H, Math.round(W * 0.2), Math.round(H * -0.04), W, H);
      return;
    }
    if (session && session.id === "builder" && session.phase === "done" && builderPlot && CA.captain) {
      const cap = CA.captain.position;
      const mx = (cap.x + builderPlot.x) / 2;
      const mz = (cap.z + builderPlot.z) / 2;
      const my = cap.y + 1.4;
      cam.position.set(mx + lay.fx * 7.6, my + 2.6, mz + lay.fz * 7.6);
      cam.lookAt(mx - lay.rx * 2.8, my, mz - lay.rz * 2.8);
      return;
    }
    if (cam.position.y > 40) return;
    const cap = CA.captain;
    if (!cap) return;
    const walking = !CA.mode || CA.mode === "walk";
    if (walking && session && session.id === "rally" && rallyPad) {
      const onDeck = bridgeWalk && bridgeDeckY(cap.position.x, cap.position.z) != null;
      const near = Math.hypot(cap.position.x - rallyPad.x, cap.position.z - rallyPad.z) < 26;
      if (onDeck || near) {
        const dx = cap.position.x - rallyPad.x;
        const dz = cap.position.z - rallyPad.z;
        const d = Math.hypot(dx, dz) || 1;
        cam.position.set(cap.position.x + (dx / d) * 9, cap.position.y + 7.2, cap.position.z + (dz / d) * 9);
        cam.lookAt(cap.position.x, cap.position.y + 0.7, cap.position.z);
        return;
      }
    }
    const q = toFS(cap.position.x - host.x, cap.position.z - host.z);
    const on = Math.hypot(q.f, q.s) < 38;
    if (walking && on && captainInRoom(cap.position)) {
      frameCave(cam, cap);
      const W = window.innerWidth || 1280;
      const H = window.innerHeight || 800;
      if (cam.setViewOffset) cam.setViewOffset(W, H, Math.round(W * 0.08), 0, W, H);
      return;
    }
    if (walking && on && !inCaveFS(q) && Math.hypot(q.f - CAVE.f, q.s - CAVE.s) < 3.4) {
      const standF = CAVE.f + 4.6;
      const standS = CAVE.s + 1.4;
      const w = worldFS(standF, standS);
      const gy = heightFS(standF, standS);
      cam.position.set(host.x + w.x, (gy == null ? 2 : gy) + 3.2, host.z + w.z);
      const mouth = worldFS(CAVE.f - 0.1, CAVE.s);
      const my = heightFS(CAVE.f - 0.1, CAVE.s);
      cam.lookAt(host.x + mouth.x, (my == null ? 1.2 : my) + 1.7, host.z + mouth.z);
      return;
    }
    if (walking && on) {
      const d = Math.hypot(q.f, q.s) || 1;
      const cf = q.f + (q.f / d) * 12;
      const cs = q.s + (q.s / d) * 12;
      const w = worldFS(cf, cs);
      let gy = sampleGround(w.x, w.z);
      if (gy == null || gy < 0) gy = 0;
      cam.position.set(host.x + w.x, Math.max(gy + 3.6, cap.position.y + 5.4), host.z + w.z);
      cam.lookAt(cap.position.x, cap.position.y + 1.35, cap.position.z);
    }
    const g = sampleGround(cam.position.x - host.x, cam.position.z - host.z);
    if (g != null && cam.position.y < g + 2.4) cam.position.y = g + 2.4;
    if (!walking || !on) return;
    for (let i = 1; i <= 5; i++) {
      const t = i / 5;
      const x = cap.position.x + (cam.position.x - cap.position.x) * t;
      const z = cap.position.z + (cam.position.z - cap.position.z) * t;
      const y = cap.position.y + 1.2 + (cam.position.y - cap.position.y - 1.2) * t;
      const ground = sampleGround(x - host.x, z - host.z);
      if (ground != null && y < ground + 0.85) {
        const need = cap.position.y + 1.2 + (ground + 1.6 - cap.position.y - 1.2) / t;
        if (cam.position.y < need) cam.position.y = need;
      }
    }
  }
  function captainNear() {
    if (!CA.captain || !stations.length) return null;
    const p = CA.captain.position;
    let best = null;
    let bestD = 3.4;
    stations.forEach((st) => {
      if (st.room) return;
      const d = Math.hypot(p.x - st.wx, p.z - st.wz);
      if (d < bestD) { bestD = d; best = st; }
    });
    rooms.forEach((room) => {
      const d = Math.hypot(p.x - room.x, p.z - room.z);
      if (d < bestD) {
        bestD = d;
        best = stations.find((st) => st.room && st.era === room.era) || best;
      }
    });
    return best;
  }

  function onKey(e) {
    if (e.key !== "e" && e.key !== "E") return;
    if (session) return;
    const hit = captainNear();
    if (!hit || (CA.mode && CA.mode !== "walk")) return;
    e.preventDefault();
    e.stopPropagation();
    openStation(hit.room ? "tunnel" : hit.id);
    if (hit.era) session.eraRoom = hit.era;
  }

  function fadeBetween(cam) {
    if (!cam || !CA.captain || !CA.scene) return;
    const root = CA.scene.getObjectByName("v51-root");
    if (!root) return;
    const ax = cam.position.x;
    const ay = cam.position.y;
    const az = cam.position.z;
    const bx = CA.captain.position.x;
    const by = CA.captain.position.y + 1.1;
    const bz = CA.captain.position.z;
    const abx = bx - ax;
    const aby = by - ay;
    const abz = bz - az;
    const ab2 = abx * abx + aby * aby + abz * abz || 1;
    root.traverse((o) => {
      if (!o.isMesh || !o.material || o.userData.nofade) return;
      if (!o.geometry) return;
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      const rad = (o.geometry.boundingSphere && o.geometry.boundingSphere.radius) || 0;
      const sc = Math.max(o.scale.x, o.scale.y, o.scale.z);
      if (rad * sc < 0.35 || rad * sc > 18) return;
      o.updateWorldMatrix(true, false);
      const e = o.matrixWorld.elements;
      const px = e[12];
      const py = e[13];
      const pz = e[14];
      const u = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby + (pz - az) * abz) / ab2));
      const dx = px - (ax + abx * u);
      const dy = py - (ay + aby * u);
      const dz = pz - (az + abz * u);
      const reach = Math.max(0.8, rad * sc * 0.65);
      const block = u > 0.12 && u < 0.92 && dx * dx + dy * dy + dz * dz < reach * reach;
      if (!o.userData.v51seen) {
        o.material = o.material.clone();
        o.userData.v51base = o.material.opacity == null ? 1 : o.material.opacity;
        o.userData.v51trans = !!o.material.transparent;
        o.userData.v51seen = 1;
      }
      if (block) {
        o.material.transparent = true;
        o.material.opacity = 0.12;
        o.material.depthWrite = false;
      } else if (o.userData.v51block) {
        o.material.opacity = o.userData.v51base;
        o.material.transparent = o.userData.v51trans;
        o.material.depthWrite = !o.userData.v51trans;
      }
      o.userData.v51block = block ? 1 : 0;
    });
  }
  function frame() {
    if (!isle) return;
    nearest = captainNear();
    if (ui.prompt) {
      if (nearest && !session && (!CA.mode || CA.mode === "walk")) {
        ui.prompt.classList.add("show");
        ui.prompt.innerHTML = `<button type="button">${esc(nearest.name)} · E</button>`;
      } else ui.prompt.classList.remove("show");
    }
    stations.forEach((st) => {
      if (!st.ring) return;
      const s = 1 + Math.sin(Date.now() / 280) * 0.06;
      st.ring.scale.set(s, s, s);
    });
    if (monuments.wheel) monuments.wheel.rotation.y += session && session.mode === "wheel" ? 0.03 : 0.008;
    prepView();
    if (CA.captain && (!CA.mode || CA.mode === "walk")) {
      const p = CA.captain.position;
      const onIsle = Math.hypot(p.x - isle.cx, p.z - isle.cz) < isle.R + 8;
      const stand = toFS(p.x - host.x, p.z - host.z);
      if (onIsle && mountainBlock && !inRoomFS(stand.f, stand.s)) {
        const dxm = p.x - mountainBlock.x;
        const dzm = p.z - mountainBlock.z;
        const dist = Math.hypot(dxm, dzm) || 0.001;
        if (dist < mountainBlock.r) {
          p.x = mountainBlock.x + (dxm / dist) * (mountainBlock.r + 0.35);
          p.z = mountainBlock.z + (dzm / dist) * (mountainBlock.r + 0.35);
        }
      }
      rooms.forEach((room) => {
        if (Math.hypot(p.x - room.x, p.z - room.z) > 2.5) return;
        room.blocks.forEach((b) => {
          const dx = p.x - b.x;
          const dz = p.z - b.z;
          const dist = Math.hypot(dx, dz) || 0.001;
          if (dist < b.r) {
            p.x = b.x + (dx / dist) * b.r;
            p.z = b.z + (dz / dist) * b.r;
          }
        });
      });
    }
    Object.keys(monuments).forEach((id) => {
      const mesh = monuments[id];
      if (mesh && mesh.userData && mesh.userData.shade) mesh.userData.shade.visible = mesh.visible;
    });
    const cardEl = document.getElementById("learn-card");
    if (cardEl && /Progress/.test(cardEl.textContent)) {
      cardEl.querySelectorAll("p").forEach((p) => {
        if (/Captain Adventure 5\.0/.test(p.textContent)) p.textContent = VER;
      });
      if (!cardEl.querySelector("#liberty-progress")) {
        const p = document.createElement("p");
        p.id = "liberty-progress";
        p.textContent = progressLine();
        const header = cardEl.querySelector("header");
        if (header) header.insertAdjacentElement("afterend", p);
        else cardEl.appendChild(p);
      }
    }
  }

  function progressLine() {
    const v = bag();
    const regions = REGIONS.filter((r) => v.flags[r]).length;
    const built = BANK.landmarks.filter((lm) => v.landmarks[lm.id]).length;
    return `Liberty Isle: ${v.placed.length}/50 states placed, ${regions}/5 regional flags, ${v.postcards.length} postcards, ${built}/${BANK.landmarks.length} monuments, quiz best ${v.quiz.best}/3.`;
  }

  function watchCard() {
    const cardEl = document.getElementById("learn-card");
    if (!cardEl || cardEl.querySelector("#liberty-progress")) return;
    if (/<h2[^>]*>[^<]*Progress/.test(cardEl.innerHTML) || /Progress<\/h2>/.test(cardEl.innerHTML)) {
      const p = document.createElement("p");
      p.id = "liberty-progress";
      p.textContent = progressLine();
      cardEl.appendChild(p);
    }
  }

  function version() {
    const meta = document.querySelector('meta[name="game-version"]');
    if (meta) meta.setAttribute("content", VER);
    window.__GAME_VERSION__ = VER;
    const h1 = document.querySelector("#intro h1");
    if (h1) h1.textContent = "🗽 " + VER;
    const flag = document.getElementById("ver-flag");
    if (flag) flag.textContent = VER;
  }

  function prepView() {
    const cam = CA.camera;
    if (!cam || !host) return;
    const root = CA.scene.getObjectByName("v51-root");
    if (root) root.traverse((o) => {
      if (o.name !== "v51-label") return;
      const show = !session;
      o.visible = show;
      o.userData.v50labelVis = show;
    });
    aimCamera(cam);
    const inside = caveAnchor && captainInRoom(CA.captain && CA.captain.position);
    if (caveWalls && caveAnchor) {
      const q = caveLocal(cam.position.x, cam.position.y, cam.position.z);
      const fadeWall = (wall, near) => {
        if (!wall || !wall.material) return;
        wall.material.transparent = !!near;
        wall.material.opacity = near ? 0.14 : 1;
        wall.material.depthWrite = !near;
      };
      const leftDist = Math.abs(q.x + 1.7);
      const rightDist = Math.abs(q.x - 1.7);
      fadeWall(caveWalls.left, inside && leftDist < 0.55 && leftDist <= rightDist);
      fadeWall(caveWalls.right, inside && rightDist < 0.55 && rightDist < leftDist);
      fadeWall(caveWalls.back, inside && q.z < -5.35);
    }
    const dark = CA.scene.getObjectByName("v51-cave-dark");
    if (dark && dark.material) {
      const q = caveAnchor ? caveLocal(cam.position.x, cam.position.y, cam.position.z) : { z: 1 };
      const through = inside && q.z < -0.2;
      dark.material.transparent = true;
      dark.material.opacity = through ? 0.05 : 0.92;
      dark.material.depthWrite = !through;
    }
    fadeBetween(cam);
  }
  function hookRender() {
    const renderer = CA.renderer;
    if (!renderer || renderer.__v51) return;
    const prev = renderer.render.bind(renderer);
    renderer.render = function (scene, camera) {
      try { prepView(); } catch (err) { /* keep drawing */ }
      return prev(scene, camera || CA.camera);
    };
    renderer.__v51 = 1;
  }
  function boot() {
    bag();
    version();
    ensureUi();
    try { dress(); } catch (err) { console.error(err); }
    try { hookRender(); } catch (err) { console.error(err); }
    document.addEventListener("keydown", onKey, true);
    const learn = document.getElementById("learn-card");
    if (learn) new MutationObserver(() => watchCard()).observe(learn, { childList: true });
    requestAnimationFrame(function loop() { try { frame(); } catch (err) { /* keep drawing */ } requestAnimationFrame(loop); });
  }
  function loadPack() {
    const start = () => {
      const go = () => { try { boot(); } catch (err) { /* the island can still be walked */ } readyResolve(!!PACK); };
      const img = new Image();
      img.onload = () => { rushmorePhoto = img; go(); };
      img.onerror = () => go();
      img.src = "assets/rushmore-faces.jpg";
    };
    fetch("content/liberty-isle/history-pack.json").then((res) => res.json()).then((pack) => {
      try { applyPack(pack); } catch (err) { PACK = null; }
      start();
    }).catch(() => start());
  }
  if (CA.scene && CA.isl) loadPack();
  else document.addEventListener("DOMContentLoaded", loadPack);

  CA.liberty = {
    VER,
    BANK,
    get ERAS() { return ERAS; },
    get pack() { return PACK; },
    ready: readyP,
    island: () => isle,
    host: () => host,
    stations: () => stations.map((s) => ({ id: s.id, name: s.name, era: s.era || "", x: s.wx, z: s.wz })),
    bag,
    progressLine,
    open: openStation,
    answer,
    advance,
    close: closePlay,
    build: startBuild,
    spin: spinWheel,
    near: captainNear,
    session: () => session,
    contentProblems
  };
  window.CaptainLiberty = CA.liberty;
})();
