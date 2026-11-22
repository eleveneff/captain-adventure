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
  const GROW = 1.275;
  const CHAN = { s: 17.4, half: 1.65, f0: 16, f1: 34 };
  const CAVE = { f: 6.4, s: 0.3 };
  const LAYOUT = {
    map: [18.6, -9.2],
    tunnel: [CAVE.f + 2.5, CAVE.s],
    rally: [11.6, -18.6],
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
    } else {
      body = `<p class="liberty-fact"><b>Fact.</b> ${esc(q.fact)}</p><p>${esc(q.question)}</p>${choiceButtons(q)}`;
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
        q("The Black Hills are sacred to the Lakota, and the United States took them in the 1870s despite an 1868 treaty. The Supreme Court later ruled that taking was wrong.", "The Supreme Court later ruled that taking the Black Hills broke which 1868 promise?", ["A treaty with the Lakota", "The Mayflower Compact", "The golden spike", "The Bill of Rights' ban on newspapers"], 0, "An 1868 treaty protected the Black Hills. The Court later said the United States was wrong to take them.")
      ]},
      "Golden Gate Bridge": { id: "gate", price: 50, questions: [
        q("The Golden Gate Bridge opened in 1937 across the entrance to San Francisco Bay.", "The Golden Gate Bridge opened in 1937. Which city does it serve?", ["San Francisco", "Philadelphia", "St. Louis", "Boston"], 0, "It crosses the entrance to San Francisco Bay."),
        q("Its 4,200-foot main span was the longest of any suspension bridge in the world at the time.", "In 1937, the bridge's main span was known for being what?", ["The longest suspension span in the world at the time", "Shorter than a city block", "A tunnel under the bay", "A wooden ferry"], 0, "The 4,200-foot main span set the record in 1937."),
        q("Its famous color is called International Orange.", "What is the bridge's famous color called?", ["International Orange", "Liberty Green", "Bison Brown", "Palmetto Blue"], 0, "International Orange was chosen so ships could see the bridge in fog.")
      ]},
      "The Alamo": { id: "alamo", price: 30, questions: [
        q("In 1836, Texan defenders held the Alamo for 13 days. The fort fell, and nearly all inside were killed.", "In 1836, the Alamo was a battle in which present-day state?", ["Texas", "Florida", "Virginia", "Maine"], 0, "The Alamo is in San Antonio, Texas."),
        q("The Alamo was an old Spanish mission before the battle.", "Before the 1836 battle, the Alamo had been what?", ["A Spanish mission", "A railroad station", "A moon rocket", "A New England school"], 0, "Spain built it as a mission. The chapel still stands."),
        q("One cause of the conflict was that many American settlers held enslaved people, and Mexico had moved to end slavery.", "Which fact was one cause of the fight at the Alamo?", ["Mexico had moved to end slavery, and many American settlers held enslaved people", "Mexico had banned all churches", "The defenders wanted to join Canada", "Spain still ruled Texas in 1836"], 0, "Mexico was ending slavery. Many settlers from the United States wanted to keep enslaved people. That was one cause of the Texas Revolution.")
      ]},
      "Liberty Bell": { id: "bell", price: 25, questions: [
        q("The Liberty Bell hung in the Pennsylvania State House, now called Independence Hall.", "The Liberty Bell hung in which building?", ["The Pennsylvania State House, now Independence Hall", "The Alamo", "The Golden Gate Bridge", "Mount Rushmore"], 0, "Independence Hall in Philadelphia was the Pennsylvania State House."),
        q("The bell is inscribed 'Proclaim LIBERTY throughout all the Land unto all the Inhabitants thereof.'", "The words on the Liberty Bell proclaim what throughout the land?", ["Liberty", "A king's tax", "A state church", "A closed harbor"], 0, "The inscription says Proclaim LIBERTY throughout all the Land."),
        q("In the 1830s, people working to end slavery named it the Liberty Bell and made it their symbol.", "Who made the bell a symbol in the 1830s?", ["People working to end slavery", "The crew of Columbus", "The builders of the Space Needle", "The Supreme Court in 1954"], 0, "Abolitionists, people who worked to end slavery, gave the bell the name Liberty Bell.")
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

  function rallyQuestions() {
    const withN = BANK.states.filter((s) => s.neighbors.length);
    const qs = [];
    const used = new Set();
    while (qs.length < 3) {
      const s = withN[Math.floor(Math.random() * withN.length)];
      if (used.has(s.name)) continue;
      used.add(s.name);
      const neighbor = s.neighbors[0];
      const wrong = BANK.states.map((x) => x.name).filter((n) => n !== neighbor && s.neighbors.indexOf(n) < 0);
      const choices = [neighbor, wrong[0], wrong[3], wrong[7]];
      qs.push({
        type: "choice",
        fact: s.fact,
        question: s.fact + " Which of these states shares a border with " + s.name + "?",
        choices,
        answer: 0,
        explanation: neighbor + " is a neighbor of " + s.name + ". The others on this list are not.",
        postcard: s.name
      });
    }
    return qs;
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
  function rockPlanes(f, s) {
    const qf = Math.round(f * 0.42) / 0.42;
    const qs = Math.round(s * 0.42) / 0.42;
    const n = Math.sin(qf * 1.7 + qs * 1.3) * 0.32;
    return [
      14.2 - Math.abs(f * 0.9 + 1.45) * 0.95 - Math.abs(s) * 0.78 + n,
      9.4 - Math.abs(f + 4.3) * 0.82 - Math.abs(s - 5.0) * 1.15 + n * 0.55,
      8.2 - Math.abs(f - 2.7) * 0.9 - Math.abs(s + 5.5) * 0.82 + n * 0.45,
      6.1 - Math.abs(f + 0.5) * 0.55 - Math.abs(s + 1.8) * 1.25
    ];
  }
  function shoreOf(f, s) {
    const a = Math.atan2(s, f);
    return 27.4 + 2.05 * Math.sin(a * 3 + 0.45) + 1.15 * Math.sin(a * 5 + 1.7) + 0.45 * Math.sin(a * 8 - 0.4);
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
  function lowland(f, s) {
    const d = Math.hypot(f, s);
    const shore = shoreOf(f, s);
    if (d > shore + 3.4) return null;
    let y = 0.9 + 0.16 * Math.sin(f * 0.41 + 0.7) * Math.cos(s * 0.33 + 0.4) + 0.08 * Math.sin((f + s) * 0.85);
    y += Math.max(0, 0.85 * (1 - d / 22));
    if (inMouth(f, s)) y = Math.min(y, 1.26);
    if (inRoomFS(f, s)) y = 1.22;
    const edge = smoothstep((d - (shore - 6.6)) / 6.6);
    const beach = 0.58 * (1 - edge) - 0.38 * edge;
    y = y * (1 - edge) + beach * edge;
    const ds = Math.abs(s - CHAN.s);
    if (ds < CHAN.half + 1.15 && f > CHAN.f0 - 0.8 && f < CHAN.f1 + 0.5) {
      const u = ds > CHAN.half ? smoothstep((ds - CHAN.half) / 1.15) : 0;
      y = -0.95 * (1 - u) + y * u;
    }
    if (d > shore) y = y * (1 - smoothstep((d - shore) / 2.4)) - 1.2 * smoothstep((d - shore) / 2.4);
    return y * GROW;
  }
  function heightFS(f, s) {
    const low = lowland(f, s);
    if (low == null) return null;
    return Math.max(low, rockTop(f, s));
  }
  function sampleGround(dx, dz) {
    if (!lay) return null;
    const q = toFS(dx, dz);
    if (q.f > 24.2 && q.f < 37.4 && Math.abs(q.s) < 1.45) return 0.52 * GROW;
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
  function sinkDome() {
    let mesh = null;
    CA.scene.traverse((o) => {
      if (mesh || !o.isMesh || !o.geometry || o.geometry.type !== "BufferGeometry") return;
      const pos = o.geometry.attributes && o.geometry.attributes.position;
      if (pos && pos.count > 20000) mesh = o;
    });
    if (!mesh) return;
    const pos = mesh.geometry.attributes.position;
    const col = mesh.geometry.attributes.color;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      if (Math.hypot(x - host.x, z - host.z) > 50) continue;
      if (pos.getY(i) < -0.45) continue;
      pos.setY(i, -2.4);
      if (col) col.setXYZ(i, 0.04, 0.16, 0.28);
    }
    pos.needsUpdate = true;
    if (col) col.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
  }
  function faceColor(y, f, s) {
    const K = kit();
    const salt = Math.floor(hsh(f * 3.1 + s * 5.7 + y) * 4);
    let hex = 0x3c9a45;
    if (y < 0.06) hex = [0xc4a06e, 0xb08b58, 0xd0b07a][salt % 3];
    else if (y < 0.58) hex = [0xf0d5a4, 0xe4c48c, 0xf6e2b8, 0xd7b57a][salt % 4];
    else if (y < 2.05) hex = [0x3c9a45, 0x2f7d38, 0x4caf50, 0x347d3c][salt % 4];
    else {
      const planes = rockPlanes(f, s);
      let id = 0;
      for (let i = 1; i < planes.length; i++) if (planes[i] > planes[id]) id = i;
      const families = [
        [0x9c958e, 0x8e877f, 0xa39c94],
        [0x7d766e, 0x6e675f, 0x8a837a],
        [0x6a635c, 0x7a736c, 0x5e5852],
        [0x8a847c, 0x7c766e, 0x968f86]
      ];
      hex = families[id][salt % 3];
    }
    return new K.Color(hex);
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
        index.push(a, b, d, a, d, c);
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
    const geo = gridMesh(K, 72, 33, (f, s) => lowland(f, s), (f, s) => {
      const y = lowland(f, s);
      return y == null || y < -0.65;
    });
    const mesh = new K.Mesh(geo, new K.Lambert({ vertexColors: true }));
    mesh.receiveShadow = true;
    mesh.name = "v51-terrain";
    mesh.userData.nofade = 1;
    return mesh;
  }
  function buildRock(K) {
    const N = 42;
    const half = 15;
    const positions = [];
    const colors = [];
    for (let iz = 0; iz < N; iz++) {
      for (let ix = 0; ix < N; ix++) {
        const f0 = -half + (ix / N) * half * 2;
        const s0 = -half + (iz / N) * half * 2;
        const f1 = -half + ((ix + 1) / N) * half * 2;
        const s1 = -half + ((iz + 1) / N) * half * 2;
        const pts = [[f0, s0], [f1, s0], [f1, s1], [f0, s1]];
        const rocks = pts.map((p) => rockTop(p[0], p[1]));
        const midF = (f0 + f1) / 2;
        const midS = (s0 + s1) / 2;
        if (inMouth(midF, midS) || inRoomFS(midF, midS)) continue;
        if (Math.max.apply(null, rocks) < 1.65) continue;
        const corners = pts.map((p, i) => {
          const low = lowland(p[0], p[1]);
          const y = rocks[i] > (low == null ? 0 : low) + 0.35 ? rocks[i] : (low == null ? rocks[i] : low);
          const w = worldFS(p[0], p[1]);
          return [host.x + w.x, y, host.z + w.z, p[0], p[1]];
        });
        [[0, 1, 2], [0, 2, 3]].forEach((tri) => {
          const fc = (corners[tri[0]][3] + corners[tri[1]][3] + corners[tri[2]][3]) / 3;
          const sc = (corners[tri[0]][4] + corners[tri[1]][4] + corners[tri[2]][4]) / 3;
          const fy = (corners[tri[0]][1] + corners[tri[1]][1] + corners[tri[2]][1]) / 3;
          const col = faceColor(Math.max(fy, 2.2), fc, sc);
          tri.forEach((k) => {
            positions.push(corners[k][0], corners[k][1], corners[k][2]);
            colors.push(col.r, col.g, col.b);
          });
        });
      }
    }
    const geo = new K.Geo();
    geo.setAttribute("position", new K.Attr(new Float32Array(positions), 3));
    geo.setAttribute("color", new K.Attr(new Float32Array(colors), 3));
    geo.computeVertexNormals();
    const mesh = new K.Mesh(geo, new K.Lambert({ vertexColors: true }));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = "v51-rock-peak";
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
    ["v51-bush", "v51-flower", "v51-stem", "v51-rock", "v51-foam", "v51-dock", "v51-path"].forEach((name) => bakeNamed(K, root, name));
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
      R: 41,
      yaw: lay.yaw,
      ground(x, z) {
        const y = sampleGround(x - center.x, z - center.z);
        return y == null ? 0.2 : y;
      },
      landSpot: host.land,
      boatSpot: host.dock
    };
    mountainBlock = { x: center.x, z: center.z, r: 4.5 };
    sinkDome();
    const root = new K.Group();
    root.name = "v51-root";
    CA.scene.add(root);
    root.add(buildTerrain(K));
    root.add(buildRock(K));
    const lamb = (hex, extra) => new K.Lambert(Object.assign({ color: hex }, extra || {}));
    const here = { map: LAYOUT.map, tunnel: LAYOUT.tunnel, rally: LAYOUT.rally, builder: LAYOUT.builder, quiz: LAYOUT.quiz };
    stations = [
      { id: "map", name: "Map Puzzle Dock", f: here.map[0], s: here.map[1] },
      { id: "tunnel", name: "History Time-Tunnel", f: here.tunnel[0], s: here.tunnel[1], era: ERAS[0] },
      { id: "rally", name: "Road Trip Rally", f: here.rally[0], s: here.rally[1] },
      { id: "builder", name: "Landmark Builder", f: here.builder[0], s: here.builder[1] },
      { id: "quiz", name: "Fifty-State Quiz Show", f: here.quiz[0], s: here.quiz[1] }
    ];
    stations.forEach((st) => {
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
    const peakSpot = spot(-1.5, 0);
    const isleLabel = new K.Sprite(new K.SpriteMat({ map: labelTex(K, "Liberty Isle"), transparent: true, depthWrite: false }));
    isleLabel.scale.set(5.2, 1.3, 1);
    isleLabel.position.set(peakSpot.wx, peakSpot.y + 2.4, peakSpot.wz);
    isleLabel.name = "v51-label";
    root.add(isleLabel);
    ribbon(K, root, [
      [[24.6, 0], [19.4, -0.6], [15.4, -1.4]],
      [[15.4, -1.4], [here.map[0], here.map[1]], [here.rally[0], here.rally[1]]],
      [[15.4, -1.4], [here.quiz[0], here.quiz[1]], [here.builder[0], here.builder[1]]],
      [[15.4, -1.4], [11.2, 0.15], [9.4, 0.25]]
    ], 0.72, 0xc4a06a);
    ribbon(K, root, [[[9.4, 0.25], [here.tunnel[0], here.tunnel[1]]]], 0.84, 0x9a9188);
    dressDock(K, root, lamb);
    dressFlag(K, root, lamb);
    dressFoliage(K, root, lamb);
    dressFoam(K, root);
    dressMapTable(K, root, lamb);
    dressTunnel(K, root, lamb);
    dressRally(K, root, lamb);
    dressBench(K, root, lamb);
    dressStage(K, root, lamb);
    dressMonuments(K, root, lamb);
    dressRegionFlags(K, root, lamb);
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
    [[21.2, -4.2, 0.4, 5.1, 1], [19.6, 5.6, -0.6, 4.5, 2], [15.4, -11.2, 0.8, 5.6, 3], [14.6, 8.8, 0.2, 4.3, 4],
      [11.4, -16.2, -0.3, 5.0, 5], [10.2, 13.2, 0.5, 4.7, 6], [23.2, -9.4, 0.15, 3.9, 7], [8.6, -6.4, -0.4, 5.4, 8],
      [16.8, 12.6, 0.35, 4.4, 9], [20.4, -15.2, 0.3, 4.6, 11], [8.2, 14.6, -0.4, 4.8, 12],
      [14.8, 16.4, 0.2, 4.2, 13], [4.8, -8.6, 0.5, 5.2, 14]].forEach((row) => palmAt(K, root, row[0], row[1], row[2], row[3], row[4]));
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
    [[2.2, -6.4, 0.7], [-3.4, 4.8, 0.85], [1.4, 6.2, 0.55], [-2.2, -3.6, 0.6], [6.8, -3.4, 0.5]].forEach((r, i) => {
      const y = heightFS(r[0], r[1]);
      if (y == null || y < 1.4 * GROW) return;
      const rock = new K.Mesh(new K.Sphere(r[2], 5, 4), lamb(i % 2 ? 0x7a746c : 0x918a82));
      rock.scale.set(1.35, 0.85, 1.05);
      rock.rotation.y = i;
      rock.castShadow = true;
      rock.name = "v51-rock";
      place(root, rock, r[0], r[1], r[2] * 0.35);
    });
  }
  function dressFoam(K, root) {
    const waterY = typeof CA.waterY === "number" ? CA.waterY : -0.55;
    const mat = new K.Basic({ color: 0xf7fbff, transparent: true, opacity: 0.55, depthWrite: false });
    for (let i = 0; i < 42; i++) {
      const a = (i / 42) * Math.PI * 2;
      let lo = 16;
      let hi = 34;
      for (let k = 0; k < 8; k++) {
        const mid = (lo + hi) / 2;
        const y = heightFS(Math.cos(a) * mid, Math.sin(a) * mid);
        if (y == null || y < -0.02) hi = mid;
        else lo = mid;
      }
      const rad = (lo + hi) / 2;
      const f = Math.cos(a) * rad;
      const s = Math.sin(a) * rad;
      if (Math.abs(s - CHAN.s) < CHAN.half && f > CHAN.f0) continue;
      if (Math.abs(s) < 2.2 && f > 23) continue;
      for (let k = 0; k < 2; k++) {
        const blob = new K.Mesh(new K.Sphere(0.22 + ((i + k) % 3) * 0.06, 6, 4), mat);
        blob.scale.set(1.45, 0.22, 0.8);
        const w = worldFS(f + Math.cos(a) * k * 0.35, s + Math.sin(a) * k * 0.35);
        blob.position.set(host.x + w.x, waterY + 0.06, host.z + w.z);
        blob.rotation.y = a;
        blob.name = "v51-foam";
        blob.userData.nofade = 1;
        root.add(blob);
      }
    }
  }
  function dressMapTable(K, root, lamb) {
    const p = spot(LAYOUT.table[0], LAYOUT.table[1]);
    const table = new K.Group();
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
    const p = spot(LAYOUT.rally[0], LAYOUT.rally[1]);
    const postL = new K.Mesh(new K.Cyl(0.07, 0.08, 1.8, 6), lamb(0x6d4c41));
    const postR = postL.clone();
    postL.position.set(p.wx, p.y + 0.9, p.wz);
    const w = worldFS(LAYOUT.rally[0], LAYOUT.rally[1] + 0.9);
    postR.position.set(host.x + w.x, p.y + 0.9, host.z + w.z);
    const board = new K.Mesh(new K.Box(1.6, 0.9, 0.08), new K.Lambert({ map: routeTex(K), color: 0xffffff }));
    board.position.set((postL.position.x + postR.position.x) / 2, p.y + 1.45, (postL.position.z + postR.position.z) / 2);
    board.rotation.y = lay.yaw;
    root.add(postL); root.add(postR); root.add(board);
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
      for (let f = -8; f <= 30; f += 3.1) {
        for (let s = -26; s <= 26; s += 3.1) {
          if (Math.hypot(f, s) > 29.5) continue;
          if (Math.hypot(f + 1.3, s) < 3.7) continue;
          if (Math.abs(s - CHAN.s) < CHAN.half + 0.35 && f > CHAN.f0 - 0.4 && f < CHAN.f1) continue;
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
    }
    if (CA.obstacles) CA.obstacles.push({ x: host.x, z: host.z, r: 3.3 });
    window.__libertyGround = (x, z) => {
      if (!host) return null;
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
      liberty: [25.2, -5.4, 0],
      gate: [23.4, CHAN.s, 0],
      arch: [4.2, -24.2, 0],
      bell: [22.4, 19.6, 0],
      alamo: [-1.6, 23.4, 0],
      rushmore: [4.8, -3.2, -1.2]
    };
    BANK.landmarks.forEach((lm) => {
      const mesh = makers[lm.id]();
      const at = spots[lm.id] || [0, 0, 0];
      if (lm.id === "gate") {
        const w = worldFS(at[0], at[1]);
        mesh.position.set(host.x + w.x, 0, host.z + w.z);
        root.add(mesh);
      } else place(root, mesh, at[0], at[1], at[2] || 0);
      if (lm.id === "liberty" || lm.id === "alamo" || lm.id === "bell" || lm.id === "rushmore") mesh.rotation.y = lay.yaw;
      if (lm.id === "arch") mesh.rotation.y = lay.yaw + 0.55;
      if (lm.id === "gate") mesh.rotation.y = Math.atan2(-lay.rz, lay.rx);
      mesh.name = "v51-monument";
      mesh.visible = !!bag().landmarks[lm.id];
      monuments[lm.id] = mesh;
      const shade = new K.Mesh(new K.Circle(1.3, 12), new K.Basic({ color: 0x14301c, transparent: true, opacity: 0.22, depthWrite: false }));
      shade.rotation.x = -Math.PI / 2;
      shade.position.set(mesh.position.x, mesh.position.y + 0.03, mesh.position.z);
      shade.visible = mesh.visible;
      shade.userData.nofade = 1;
      root.add(shade);
      mesh.userData.shade = shade;
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
  function rushmoreMesh(K, lamb) {
    const g = new K.Group();
    const cliff = new K.Mesh(new K.Box(8.4, 4.6, 1.5), lamb(0x8d847c));
    cliff.position.y = 2.3;
    g.add(cliff);
    const skin = lamb(0xd7ccc8);
    const hair = lamb(0xc8b8ae);
    const faces = [
      { x: -3.05, beard: 0, glasses: 0, hair: 0.42, nose: 0.16 },
      { x: -1.05, beard: 0, glasses: 0, hair: 0.2, nose: 0.2 },
      { x: 0.95, beard: 0, glasses: 1, hair: 0.16, nose: 0.14 },
      { x: 2.95, beard: 1, glasses: 0, hair: 0.18, nose: 0.18 }
    ];
    faces.forEach((face) => {
      const head = new K.Mesh(new K.Sphere(0.72, 10, 8), skin);
      head.scale.set(0.86, 1.15, 0.72);
      head.position.set(face.x, 2.55, 0.72);
      g.add(head);
      const brow = new K.Mesh(new K.Box(0.5, 0.08, 0.16), hair);
      brow.position.set(face.x, 2.95, 1.15);
      g.add(brow);
      const nose = new K.Mesh(new K.Box(0.12, 0.22, face.nose), skin);
      nose.position.set(face.x, 2.5, 1.22);
      g.add(nose);
      if (face.hair > 0.3) {
        const wig = new K.Mesh(new K.Box(0.7, 0.28, 0.4), hair);
        wig.position.set(face.x, 3.15, 0.55);
        g.add(wig);
      }
      if (face.beard) {
        const beard = new K.Mesh(new K.Box(0.46, 0.55, 0.28), hair);
        beard.position.set(face.x, 1.85, 0.95);
        g.add(beard);
      }
      if (face.glasses) {
        [-0.18, 0.18].forEach((dx) => {
          const eye = new K.Mesh(new K.Torus(0.1, 0.025, 4, 8), lamb(0x3e2723));
          eye.position.set(face.x + dx, 2.72, 1.2);
          g.add(eye);
        });
        const stache = new K.Mesh(new K.Box(0.28, 0.06, 0.08), hair);
        stache.position.set(face.x, 2.28, 1.18);
        g.add(stache);
      }
    });
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
  function aimCamera(cam) {
    if (!cam || !host || !lay) return;
    if (cam.clearViewOffset) cam.clearViewOffset();
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
    const start = () => { try { boot(); } catch (err) { /* the island can still be walked */ } readyResolve(!!PACK); };
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
    session: () => session
  };
  window.CaptainLiberty = CA.liberty;
})();
