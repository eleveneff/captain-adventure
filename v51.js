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
      card: { title: s.name, fact: s.fact, extra: "Capital: " + s.capital + ". Nickname: " + s.nickname + ". " + s.landmark }
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
    showCard(`<h2>${esc(lm.name)}</h2><div class="liberty-fact" id="liberty-fact"><b>Why it matters</b><p>${esc(lm.story)}</p></div><p>Paid ${lm.price}. Refund ${refund}. Coins: ${score}.</p><button id="liberty-exit">Close</button>`);
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

  function dress() {
    const K = kit();
    isle = (CA.isl && CA.isl.L || []).find((n) => n.id === "turtle");
    if (!K || !isle || !CA.scene || CA.scene.getObjectByName("v51-root")) return;
    const root = new K.Group();
    root.name = "v51-root";
    CA.scene.add(root);
    const lamb = (hex) => new K.Lambert({ color: hex });
    function add(mesh, x, z, dy) {
      const p = worldPos(x, z);
      mesh.position.set(p.x, p.y + (dy || 0), p.z);
      root.add(mesh);
      return mesh;
    }
    const map = new K.Mesh(new K.Plane(12, 8), new K.Lambert({ map: mapTexture(K), color: 0xffffff }));
    map.rotation.x = -Math.PI / 2;
    add(map, 0, 1, 0.08);
    map.name = "v51-map";
    const shadow = new K.Mesh(new K.Circle(5.2, 20), new K.Basic({ color: 0x14301c, transparent: true, opacity: 0.28, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    add(shadow, 0, 1, 0.03);
    const dx = isle.boatSpot.x - isle.cx;
    const dz = isle.boatSpot.z - isle.cz;
    const span = Math.hypot(dx, dz) || 1;
    lay = {
      fx: dx / span, fz: dz / span, rx: -dz / span, rz: dx / span,
      yaw: Math.atan2(dx, dz),
      at(forward, side) {
        return { x: (dx / span) * forward + (-dz / span) * side, z: (dz / span) * forward + (dx / span) * side };
      }
    };
    const here = {
      map: lay.at(9, 6),
      tunnel: lay.at(5.6, 0),
      rally: lay.at(-2, 11),
      builder: lay.at(2, -11),
      quiz: lay.at(11, -7)
    };
    stations = [
      { id: "map", name: "Map Puzzle Dock", x: here.map.x, z: here.map.z },
      { id: "tunnel", name: "History Time-Tunnel", x: here.tunnel.x, z: here.tunnel.z, era: ERAS[0] },
      { id: "rally", name: "Road Trip Rally", x: here.rally.x, z: here.rally.z },
      { id: "builder", name: "Landmark Builder", x: here.builder.x, z: here.builder.z },
      { id: "quiz", name: "Fifty-State Quiz Show", x: here.quiz.x, z: here.quiz.z }
    ];
    stations.forEach((st) => {
      const ring = new K.Mesh(new K.Torus(1.15, 0.08, 8, 24), new K.Lambert({ color: 0xffc83d, emissive: 0xffb300, emissiveIntensity: 0.8 }));
      ring.rotation.x = Math.PI / 2;
      add(ring, st.x, st.z, 0.16);
      ring.name = "v51-ring";
      st.ring = ring;
      const p = worldPos(st.x, st.z);
      st.wx = p.x; st.wz = p.z;
      const label = new K.Sprite(new K.SpriteMat({ map: labelTex(K, st.name), transparent: true, depthWrite: false }));
      label.scale.set(3.8, 0.95, 1);
      label.position.set(p.x, p.y + 2.2, p.z);
      label.name = "v51-label";
      root.add(label);
    });
    const isleLabel = new K.Sprite(new K.SpriteMat({ map: labelTex(K, "Liberty Isle"), transparent: true, depthWrite: false }));
    isleLabel.scale.set(5.4, 1.4, 1);
    const sign = worldPos(0, -2);
    isleLabel.position.set(sign.x, sign.y + 4.6, sign.z);
    isleLabel.name = "v51-label";
    root.add(isleLabel);
    dressDockFlag(K, root, add, lamb);
    REGIONS.forEach((region, i) => {
      const a = -1.2 + i * 0.45;
      const pole = new K.Mesh(new K.Cyl(0.06, 0.06, 2.2, 6), lamb(0xf4efe4));
      add(pole, Math.cos(a) * 5, Math.sin(a) * 3, 1.1);
      const cloth = new K.Mesh(new K.Plane(1.1, 0.7), lamb([0x1e88e5, 0x2e7d32, 0xffc83d, 0xc0392b, 0x6a1b9a][i]));
      cloth.position.set(pole.position.x + 0.55, pole.position.y + 0.7, pole.position.z);
      cloth.name = "v51-flag";
      const up = !!bag().flags[region];
      cloth.visible = up;
      pole.visible = up;
      root.add(cloth);
      flags[region] = { cloth, pole };
    });
    dressMountain(K, root, add, lamb);
    dressPaths(K, root, lamb);
    dressDockSeam(K, root, lamb);
    dressFoliage(K, root, add, lamb);
    dressTunnel(K, root, add, lamb);
    dressMonuments(K, root, add, lamb);
    dressStage(K, root, add, lamb);
  }
  function dressMountain(K, root, add, lamb) {
    const rock = lamb(0x7d8b78);
    const snow = lamb(0xf4f7fb);
    const cone = new K.Mesh(new K.Cone(6.2, 9.2, 10), rock);
    add(cone, 0, 0, 4.2);
    const cap = new K.Mesh(new K.Cone(1.5, 1.6, 8), snow);
    cap.position.set(cone.position.x, cone.position.y + 4.6, cone.position.z);
    root.add(cap);
    mountainBlock = { x: isle.cx, z: isle.cz, r: 4.6 };
    const mouth = lay.at(5.4, 0);
    const arch = new K.Mesh(new K.Torus(1.7, 0.38, 8, 18, Math.PI), lamb(0x5f6b62));
    const p = worldPos(mouth.x, mouth.z);
    arch.position.set(p.x, p.y + 1.7, p.z);
    arch.rotation.y = lay.yaw;
    arch.rotation.z = Math.PI;
    root.add(arch);
    const lamp = new K.Mesh(new K.Sphere(0.16, 8, 6), new K.Lambert({ color: 0xffe082, emissive: 0xffb300, emissiveIntensity: 0.9 }));
    lamp.position.set(p.x, p.y + 2.7, p.z);
    root.add(lamp);
    const overlook = lay.at(-1.5, 3.2);
    const pad = new K.Mesh(new K.Cyl(1.5, 1.5, 0.18, 8), lamb(0xb0a090));
    add(pad, overlook.x, overlook.z, 2.6);
    const rail = new K.Mesh(new K.Torus(1.35, 0.05, 6, 16), lamb(0x6d4c41));
    rail.rotation.x = Math.PI / 2;
    rail.position.set(pad.position.x, pad.position.y + 0.35, pad.position.z);
    root.add(rail);
  }
  function dressPaths(K, root, lamb) {
    const dirt = lamb(0xc4a574);
    const stops = stations.map((st) => ({ x: st.x, z: st.z }));
    stops.push(lay.at(13, -3), lay.at(0, 0), lay.at(-1.5, 3.2));
    for (let i = 0; i < stops.length - 1; i++) {
      const a = worldPos(stops[i].x, stops[i].z);
      const b = worldPos(stops[i + 1].x, stops[i + 1].z);
      const len = Math.hypot(b.x - a.x, b.z - a.z);
      if (len < 0.4) continue;
      const mesh = new K.Mesh(new K.Box(1.15, 0.05, len), dirt);
      mesh.position.set((a.x + b.x) / 2, (a.y + b.y) / 2 + 0.05, (a.z + b.z) / 2);
      mesh.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
      root.add(mesh);
    }
    const zig = [lay.at(4, 4), lay.at(1.5, 5.2), lay.at(-1.5, 3.2)];
    zig.forEach((spot, i) => {
      if (!i) return;
      const a = worldPos(zig[i - 1].x, zig[i - 1].z);
      const b = worldPos(spot.x, spot.z);
      const len = Math.hypot(b.x - a.x, b.z - a.z);
      const mesh = new K.Mesh(new K.Box(0.9, 0.05, len), lamb(0xb08968));
      mesh.position.set((a.x + b.x) / 2, (a.y + b.y) / 2 + 0.4 + i * 0.7, (a.z + b.z) / 2);
      mesh.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
      root.add(mesh);
    });
  }
  function dressDockSeam(K, root, lamb) {
    const spot = isle.landSpot;
    if (!spot) return;
    const y = isle.ground(spot.x, spot.z);
    const apron = new K.Mesh(new K.Cyl(2.4, 2.6, 0.1, 12), lamb(0xe6c98a));
    apron.position.set(spot.x, Math.max(0.02, y) + 0.02, spot.z);
    root.add(apron);
    const plank = new K.Mesh(new K.Box(2.5, 0.08, 1.8), lamb(0x8a5d33));
    plank.position.set(spot.x, apron.position.y + 0.08, spot.z);
    plank.rotation.y = isle.yaw || lay.yaw;
    root.add(plank);
  }

  const US_OUTLINE = [[78, 86], [96, 58], [150, 46], [230, 40], [310, 44], [370, 52], [400, 78], [424, 58], [458, 50], [500, 62], [545, 48], [582, 72], [560, 102], [538, 124], [552, 156], [528, 188], [508, 220], [492, 252], [508, 286], [520, 328], [496, 348], [470, 300], [448, 268], [410, 262], [370, 278], [330, 292], [292, 332], [248, 318], [206, 276], [168, 258], [128, 248], [96, 220], [72, 176], [64, 128], [72, 96]];
  const STATE_DOT = {
    Washington: [92, 78], Oregon: [84, 128], California: [78, 190], Nevada: [118, 168], Idaho: [130, 100],
    Montana: [180, 72], Wyoming: [176, 120], Utah: [150, 168], Colorado: [196, 168], Arizona: [140, 214],
    "New Mexico": [190, 214], Texas: [250, 270], Oklahoma: [240, 214], Kansas: [230, 176], Nebraska: [230, 142],
    "South Dakota": [230, 108], "North Dakota": [230, 72], Minnesota: [300, 78], Iowa: [300, 140], Missouri: [300, 186],
    Arkansas: [300, 224], Louisiana: [310, 268], Wisconsin: [330, 100], Illinois: [340, 156], Mississippi: [350, 240],
    Michigan: [380, 110], Indiana: [380, 156], Kentucky: [390, 190], Tennessee: [380, 214], Alabama: [390, 246],
    Ohio: [420, 156], "West Virginia": [450, 176], Georgia: [430, 246], Florida: [490, 310], "South Carolina": [460, 230],
    "North Carolina": [480, 200], Virginia: [490, 176], Maryland: [500, 160], Delaware: [518, 152], Pennsylvania: [480, 140],
    "New Jersey": [524, 136], "New York": [500, 110], Connecticut: [530, 118], "Rhode Island": [542, 116], Massachusetts: [548, 104],
    Vermont: [524, 88], "New Hampshire": [546, 84], Maine: [568, 64], Alaska: [78, 332], Hawaii: [150, 348]
  };
  let mapArt = null;
  function tracePath(g, pts) {
    g.beginPath();
    pts.forEach((p, i) => { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); });
    g.closePath();
  }
  function paintMap(K) {
    const c = mapArt ? mapArt.canvas : document.createElement("canvas");
    c.width = 640; c.height = 400;
    const g = c.getContext("2d");
    g.fillStyle = "#8ec6ea";
    g.fillRect(0, 0, 640, 400);
    tracePath(g, US_OUTLINE);
    g.save();
    g.clip();
    g.fillStyle = "#d7c4a2";
    g.fillRect(0, 0, 640, 400);
    const regions = [
      ["#6a1b9a", [[60, 40], [160, 40], [160, 250], [60, 250]], "West", 110, 150],
      ["#c0392b", [[150, 190], [310, 190], [310, 360], [150, 250]], "Southwest", 220, 250],
      ["#e6a817", [[160, 40], [400, 40], [400, 200], [160, 190]], "Midwest", 280, 110],
      ["#2e7d32", [[300, 180], [500, 180], [530, 360], [300, 280]], "Southeast", 410, 240],
      ["#1e88e5", [[400, 40], [600, 40], [600, 190], [400, 190]], "Northeast", 500, 100]
    ];
    regions.forEach(([color, pts]) => {
      g.fillStyle = color;
      g.globalAlpha = 0.88;
      tracePath(g, pts);
      g.fill();
    });
    g.globalAlpha = 1;
    g.restore();
    tracePath(g, US_OUTLINE);
    g.lineWidth = 7;
    g.strokeStyle = "#10234d";
    g.stroke();
    g.lineJoin = "round";
    const placed = bag().placed || [];
    Object.keys(STATE_DOT).forEach((name) => {
      if (name === "Alaska" || name === "Hawaii") return;
      const [x, y] = STATE_DOT[name];
      const on = placed.indexOf(name) >= 0;
      g.beginPath();
      g.arc(x, y, on ? 7 : 3.2, 0, Math.PI * 2);
      g.fillStyle = on ? "#ffe082" : "rgba(255,255,255,.85)";
      g.fill();
      g.lineWidth = on ? 2 : 1;
      g.strokeStyle = "#10234d";
      g.stroke();
    });
    g.font = "bold 15px sans-serif";
    g.textAlign = "center";
    g.fillStyle = "#fff";
    g.strokeStyle = "#10234d";
    g.lineWidth = 3;
    regions.forEach((row) => { g.strokeText(row[2], row[3], row[4]); g.fillText(row[2], row[3], row[4]); });
    function inset(pts, label, lx, ly) {
      tracePath(g, pts);
      g.fillStyle = "#6a1b9a";
      g.fill();
      g.lineWidth = 4;
      g.strokeStyle = "#10234d";
      g.stroke();
      const on = placed.indexOf(label) >= 0;
      g.fillStyle = on ? "#ffe082" : "#fff";
      g.font = "bold 16px sans-serif";
      g.strokeText(label, lx, ly);
      g.fillText(label, lx, ly);
    }
    inset([[40, 310], [70, 292], [112, 308], [96, 352], [52, 360]], "Alaska", 74, 332);
    inset([[128, 328], [150, 318], [176, 334], [164, 356], [132, 354]], "Hawaii", 150, 346);
    g.fillStyle = "#10234d";
    g.font = "bold 22px sans-serif";
    g.fillText("United States", 320, 26);
    if (!mapArt) {
      const tex = new K.CanvasTex(c);
      tex.needsUpdate = true;
      mapArt = { canvas: c, tex };
    } else mapArt.tex.needsUpdate = true;
    return mapArt.tex;
  }
  function mapTexture(K) { return paintMap(K); }
  function refreshMap() { if (mapArt && kit()) paintMap(kit()); }
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
    g.font = "bold 42px sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, 256, 64);
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
        const x = 10 + col * 16 + (row % 2 ? 8 : 0);
        const y = 8 + row * 14;
        g.beginPath();
        g.arc(x, y, 2.2, 0, Math.PI * 2);
        g.fill();
      }
    }
    const tex = new K.CanvasTex(c);
    tex.needsUpdate = true;
    return tex;
  }
  function dressDockFlag(K, root, add, lamb) {
    const dx = isle.boatSpot.x - isle.cx;
    const dz = isle.boatSpot.z - isle.cz;
    const len = Math.hypot(dx, dz) || 1;
    const ux = dx / len;
    const uz = dz / len;
    const pole = new K.Mesh(new K.Cyl(0.07, 0.09, 5.4, 6), lamb(0xf7f4ee));
    add(pole, ux * 13, uz * 13, 2.7);
    const ball = new K.Mesh(new K.Sphere(0.16, 8, 6), lamb(0xffc83d));
    ball.position.set(pole.position.x, pole.position.y + 2.8, pole.position.z);
    root.add(ball);
    const yaw = Math.atan2(ux, uz);
    const flagMat = new K.Lambert({ map: usFlagTex(K), color: 0xffffff, side: 2 });
    const cloth = new K.Mesh(new K.Plane(2.6, 1.45), flagMat);
    cloth.rotation.order = "YXZ";
    cloth.rotation.y = yaw;
    cloth.rotation.x = -0.55;
    cloth.position.set(pole.position.x + Math.cos(yaw) * 1.35, pole.position.y + 1.35, pole.position.z - Math.sin(yaw) * 1.35);
    cloth.name = "v51-us-flag";
    root.add(cloth);
    const board = new K.Mesh(new K.Box(1.6, 0.7, 0.08), lamb(0x8d5a2b));
    const post = new K.Mesh(new K.Cyl(0.06, 0.06, 1.4, 5), lamb(0x6d4c41));
    add(post, ux * 11.2, uz * 11.2, 0.7);
    board.position.set(post.position.x, post.position.y + 0.85, post.position.z);
    board.rotation.y = yaw;
    root.add(board);
    const plate = new K.Mesh(new K.Plane(1.4, 0.5), new K.Lambert({ map: labelTex(K, "Liberty Isle"), color: 0xffffff }));
    plate.position.set(board.position.x + ux * 0.06, board.position.y, board.position.z + uz * 0.06);
    plate.rotation.y = yaw;
    root.add(plate);
  }
  function dressFoliage(K, root, add, lamb) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const rad = 13;
      const trunk = new K.Mesh(new K.Cyl(0.18, 0.24, 1.6, 6), lamb(0x8d5a2b));
      add(trunk, Math.cos(a) * rad, Math.sin(a) * rad, 0.8);
      const crown = new K.Mesh(new K.Cone(0.7, 1.3, 7), lamb(i % 2 ? 0x2e7d32 : 0x388e3c));
      crown.position.set(trunk.position.x, trunk.position.y + 1.2, trunk.position.z);
      root.add(crown);
      const rock = new K.Mesh(new K.Sphere(0.35, 7, 5), lamb(0x9aa098));
      rock.scale.set(1.2, 0.55, 0.9);
      add(rock, Math.cos(a + 0.3) * 10, Math.sin(a + 0.3) * 10, 0.2);
      const shade = new K.Mesh(new K.Circle(0.7, 10), new K.Basic({ color: 0x14301c, transparent: true, opacity: 0.3, depthWrite: false }));
      shade.rotation.x = -Math.PI / 2;
      add(shade, Math.cos(a) * rad, Math.sin(a) * rad, 0.04);
    }
  }
  function dressTunnel(K, root, add, lamb) {
    const colors = [0x8d6e63, 0x6d4c41, 0x795548, 0x5d4037, 0x4e342e, 0x8d6e63, 0x6d4c41, 0x795548];
    const props = ["📜", "⚓", "⚖", "🚂", "🕊", "⚙", "✈", "🚀"];
    rooms = ERAS.map((era, i) => {
      const spot = lay.at(4.6 - i * 0.15, (i - 3.5) * 1.15);
      const x = spot.x;
      const z = spot.z;
      const p = worldPos(x, z);
      const group = new K.Group();
      group.position.set(p.x, p.y, p.z);
      group.name = "v51-room";
      const walls = [];
      const blocks = [];
      [[-1.3, 0, 1.6, 1.5, 0.15], [1.3, 0, 1.6, 1.5, 0.15], [0, -1.2, 0.15, 1.5, 2.4]].forEach(([lx, lz, sx, sy, sz], n) => {
        const wall = new K.Mesh(new K.Box(sx, sy, sz), lamb(colors[i % colors.length]));
        wall.position.set(lx, 0.75, lz);
        wall.name = "v51-wall";
        group.add(wall);
        walls.push(wall);
        if (n < 3) blocks.push({ x: p.x + lx, z: p.z + lz, r: 0.55 });
      });
      const floor = new K.Mesh(new K.Cyl(1.15, 1.15, 0.08, 8), lamb(0x6d5c4d));
      floor.position.y = 0.04;
      group.add(floor);
      const arch = new K.Mesh(new K.Torus(1.05, 0.22, 8, 14, Math.PI), lamb(colors[i % colors.length]));
      arch.position.y = 1.15;
      arch.rotation.y = lay.yaw;
      group.add(arch);
      const lantern = new K.Mesh(new K.Sphere(0.12, 8, 6), new K.Lambert({ color: 0xffe082, emissive: 0xffb300, emissiveIntensity: 0.85 }));
      lantern.position.set(0.7, 1.7, 0);
      group.add(lantern);
      const sign = new K.Mesh(new K.Plane(1.3, 0.36), new K.Lambert({ map: labelTex(K, era.split(" ")[0] + " " + props[i]), color: 0xffffff }));
      sign.position.set(0, 1.55, 0.2);
      sign.rotation.y = lay.yaw;
      group.add(sign);
      root.add(group);
      const station = { id: "tunnel", name: "History Time-Tunnel", era, x, z, wx: p.x, wz: p.z, room: true };
      stations.push(station);
      return { era, x: p.x, z: p.z, walls, blocks, group };
    });
  }
  function dressStage(K, root, add, lamb) {
    const spot = lay.at(11, -7);
    const deck = new K.Mesh(new K.Cyl(2.2, 2.2, 0.28, 16), lamb(0x5d4037));
    add(deck, spot.x, spot.z, 0.14);
    const podium = new K.Mesh(new K.Box(0.7, 0.9, 0.45), lamb(0x14336b));
    podium.position.set(deck.position.x + lay.fx * 0.4, deck.position.y + 0.6, deck.position.z + lay.fz * 0.4);
    root.add(podium);
    [-1.6, 1.6].forEach((side) => {
      const post = new K.Mesh(new K.Cyl(0.06, 0.06, 2.2, 6), lamb(0x455a64));
      const at = lay.at(11, -7 + side);
      add(post, at.x, at.z, 1.1);
      const bulb = new K.Mesh(new K.Sphere(0.16, 8, 6), new K.Lambert({ color: 0xfff3c4, emissive: 0xffe082, emissiveIntensity: 0.9 }));
      bulb.position.set(post.position.x, post.position.y + 1.2, post.position.z);
      root.add(bulb);
    });
    const wheel = new K.Mesh(new K.Cyl(1.15, 1.15, 0.16, 16), new K.Lambert({ color: 0xffc83d, emissive: 0xffb300, emissiveIntensity: 0.45 }));
    wheel.position.set(deck.position.x - lay.fx * 0.8, deck.position.y + 1.3, deck.position.z - lay.fz * 0.8);
    wheel.rotation.x = Math.PI / 2;
    wheel.name = "v51-wheel";
    root.add(wheel);
    monuments.wheel = wheel;
  }
  function dressMonuments(K, root, add, lamb) {
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
      liberty: Object.assign(lay.at(13.5, -3), { y: 0 }),
      gate: Object.assign(lay.at(8, 9), { y: 0 }),
      arch: Object.assign(lay.at(-1, -7), { y: 1.4 }),
      bell: Object.assign(lay.at(10, 5), { y: 0 }),
      alamo: Object.assign(lay.at(-5, 9), { y: 0 }),
      rushmore: Object.assign(lay.at(-3.2, -1.2), { y: 2.4 })
    };
    BANK.landmarks.forEach((lm) => {
      const mesh = makers[lm.id]();
      const spot = spots[lm.id] || lay.at(0, 0);
      add(mesh, spot.x, spot.z, spot.y || 0);
      mesh.scale.setScalar(1);
      mesh.name = "v51-monument";
      mesh.visible = !!bag().landmarks[lm.id];
      monuments[lm.id] = mesh;
      const shade = new K.Mesh(new K.Circle(1.1, 12), new K.Basic({ color: 0x14301c, transparent: true, opacity: 0.28, depthWrite: false }));
      shade.rotation.x = -Math.PI / 2;
      shade.position.set(mesh.position.x, mesh.position.y + 0.03, mesh.position.z);
      shade.visible = mesh.visible;
      root.add(shade);
      mesh.userData.shade = shade;
    });
  }
  function bellMesh(K, lamb) {
    const g = new K.Group();
    const wood = lamb(0x6d4c41);
    const brass = lamb(0xd4a017);
    [-0.9, 0.9].forEach((x) => {
      const post = new K.Mesh(new K.Cyl(0.1, 0.12, 3.2, 6), wood);
      post.position.set(x, 1.6, 0);
      g.add(post);
    });
    const beam = new K.Mesh(new K.Box(2.2, 0.16, 0.18), wood);
    beam.position.y = 3.15;
    g.add(beam);
    const body = new K.Mesh(new K.Sphere(0.7, 14, 12), brass);
    body.scale.set(1, 1.2, 1);
    body.position.y = 1.9;
    const yoke = new K.Mesh(new K.Torus(0.55, 0.08, 8, 16), lamb(0x8d6a12));
    yoke.rotation.x = Math.PI / 2;
    yoke.position.y = 2.7;
    const crack = new K.Mesh(new K.Box(0.06, 0.7, 0.04), lamb(0x4e342e));
    crack.position.set(0.22, 1.45, 0.62);
    g.add(body); g.add(yoke); g.add(crack);
    return g;
  }
  function alamoMesh(K, lamb) {
    const g = new K.Group();
    const stone = lamb(0xe6d3b1);
    const wall = new K.Mesh(new K.Box(4.6, 2.4, 0.4), stone);
    wall.position.y = 1.2;
    g.add(wall);
    for (let i = 0; i < 5; i++) {
      const hump = new K.Mesh(new K.Sphere(0.55, 10, 8), stone);
      hump.scale.set(1.15, 0.7, 0.45);
      hump.position.set(-1.6 + i * 0.8, 2.55, 0);
      g.add(hump);
    }
    const door = new K.Mesh(new K.Box(0.7, 1.3, 0.5), lamb(0x5d4037));
    door.position.set(0, 0.65, 0.05);
    const step = new K.Mesh(new K.Box(1.6, 0.2, 0.8), stone);
    step.position.set(0, 0.1, 0.45);
    g.add(door); g.add(step);
    return g;
  }
  function ribbon(K, mat, x0, y0, x1, y1, thick) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy) + 0.02;
    const seg = new K.Mesh(new K.Box(thick, len, thick), mat);
    seg.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0);
    seg.rotation.z = Math.atan2(dx, dy);
    return seg;
  }
  function archMesh(K, lamb) {
    const g = new K.Group();
    const steel = lamb(0xd5dde4);
    const span = 7.2;
    const height = 8.2;
    const n = 18;
    const a = span / 2.6;
    const edge = a * Math.cosh((span / 2) / a);
    for (let i = 0; i < n; i++) {
      const t0 = i / n;
      const t1 = (i + 1) / n;
      const x0 = (t0 - 0.5) * span;
      const x1 = (t1 - 0.5) * span;
      const y0 = (edge - a * Math.cosh(x0 / a)) / (edge - a) * height;
      const y1 = (edge - a * Math.cosh(x1 / a)) / (edge - a) * height;
      const mid = (y0 + y1) / 2 / height;
      const thick = 0.72 - mid * 0.4;
      const seg = new K.Mesh(new K.Cyl(thick * 0.55, thick * 0.72, Math.hypot(x1 - x0, y1 - y0) + 0.08, 3), steel);
      seg.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0);
      seg.rotation.z = Math.atan2(x1 - x0, y1 - y0);
      g.add(seg);
    }
    return g;
  }
  function statueMesh(K, lamb) {
    const g = new K.Group();
    const copper = lamb(0x3d9a58);
    const stone = lamb(0xd9d0c2);
    [[2.4, 0.55, 0.28], [1.9, 0.5, 0.85], [1.45, 0.45, 1.32]].forEach(([w, h, y]) => {
      const step = new K.Mesh(new K.Box(w, h, w), stone);
      step.position.y = y;
      g.add(step);
    });
    const robe = new K.Mesh(new K.Cone(0.95, 3.6, 10), copper);
    robe.position.y = 3.5;
    const head = new K.Mesh(new K.Sphere(0.42, 12, 10), copper);
    head.position.y = 5.55;
    const band = new K.Mesh(new K.Cyl(0.46, 0.46, 0.16, 10), copper);
    band.position.y = 5.9;
    g.add(robe); g.add(head); g.add(band);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const spike = new K.Mesh(new K.Cone(0.07, 0.7, 4), copper);
      spike.position.set(Math.cos(a) * 0.34, 6.35, Math.sin(a) * 0.34);
      g.add(spike);
    }
    const arm = new K.Mesh(new K.Cyl(0.1, 0.1, 1.7, 6), copper);
    arm.position.set(0.62, 6.15, 0);
    arm.rotation.z = -0.35;
    const cup = new K.Mesh(new K.Cyl(0.18, 0.12, 0.18, 8), copper);
    cup.position.set(0.95, 6.95, 0);
    const flame = new K.Mesh(new K.Cone(0.2, 0.55, 8), new K.Lambert({ color: 0xffe082, emissive: 0xffb300, emissiveIntensity: 1 }));
    flame.position.set(0.95, 7.35, 0);
    const tablet = new K.Mesh(new K.Box(0.42, 0.7, 0.1), lamb(0xe6ee9c));
    tablet.position.set(-0.7, 4.1, 0.35);
    g.add(arm); g.add(cup); g.add(flame); g.add(tablet);
    return g;
  }
  function needleMesh(K, lamb) {
    const g = new K.Group();
    const shaft = new K.Mesh(new K.Cyl(0.08, 0.12, 2.4, 8), lamb(0xeceff1));
    shaft.position.y = 1.2;
    const saucer = new K.Mesh(new K.Cyl(0.55, 0.55, 0.12, 12), lamb(0xffc83d));
    saucer.position.y = 2.3;
    const legMat = lamb(0xb0bec5);
    for (let i = 0; i < 3; i++) {
      const leg = new K.Mesh(new K.Cyl(0.04, 0.04, 1.1, 5), legMat);
      leg.position.set(Math.cos(i * 2.1) * 0.35, 0.4, Math.sin(i * 2.1) * 0.35);
      leg.rotation.z = Math.cos(i) * 0.3;
      g.add(leg);
    }
    g.add(shaft); g.add(saucer);
    return g;
  }
  function rushmoreMesh(K, lamb) {
    const g = new K.Group();
    const cliff = new K.Mesh(new K.Box(5.4, 3.6, 1.6), lamb(0x8d6e63));
    cliff.position.y = 1.8;
    g.add(cliff);
    const names = [-1.9, -0.65, 0.6, 1.85];
    names.forEach((x) => {
      const face = new K.Mesh(new K.Sphere(0.48, 10, 8), lamb(0xd7ccc8));
      face.position.set(x, 2.35, 0.7);
      const brow = new K.Mesh(new K.Box(0.36, 0.08, 0.12), lamb(0xc8b8ae));
      brow.position.set(x, 2.55, 1.05);
      g.add(face); g.add(brow);
    });
    return g;
  }
  function bridgeMesh(K, lamb) {
    const g = new K.Group();
    const orange = lamb(0xf4511e);
    const water = new K.Mesh(new K.Box(8, 0.08, 3.2), lamb(0x1e88e5));
    water.position.y = 0.05;
    g.add(water);
    const deck = new K.Mesh(new K.Box(13.5, 0.16, 0.7), lamb(0x546e7a));
    deck.position.y = 1.35;
    g.add(deck);
    [-4.2, 4.2].forEach((x) => {
      const tower = new K.Mesh(new K.Box(0.45, 6.4, 0.45), orange);
      tower.position.set(x, 3.2, 0);
      g.add(tower);
      [2.4, 4.2, 5.6].forEach((y) => {
        const beam = new K.Mesh(new K.Box(0.7, 0.16, 0.55), orange);
        beam.position.set(x, y, 0);
        g.add(beam);
      });
    });
    const n = 16;
    for (let i = 0; i < n; i++) {
      const t0 = i / n;
      const t1 = (i + 1) / n;
      const sag = (t) => 5.5 - Math.sin(t * Math.PI) * 3.4;
      const x0 = -4.2 + t0 * 8.4;
      const x1 = -4.2 + t1 * 8.4;
      g.add(ribbon(K, orange, x0, sag(t0), x1, sag(t1), 0.08));
      const drop = sag(t0) - 1.35;
      if (drop > 0.25) {
        const line = new K.Mesh(new K.Box(0.04, drop, 0.04), orange);
        line.position.set(x0, 1.35 + drop / 2, 0);
        g.add(line);
      }
    }
    return g;
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
    if (monuments.wheel) monuments.wheel.rotation.y += 0.01;
    const cam = CA.camera;
    rooms.forEach((room) => {
      const nearCam = cam && Math.hypot(cam.position.x - room.x, cam.position.z - room.z) < 8;
      const hide = nearCam && (!session || session.id !== "tunnel");
      if (room.group) room.group.traverse((o) => {
        if (!o.material) return;
        o.material.transparent = true;
        o.material.opacity = hide ? 0.12 : 1;
        o.material.depthWrite = !hide;
      });
    });
    if (CA.captain && (!CA.mode || CA.mode === "walk")) {
      const p = CA.captain.position;
      const onIsle = Math.hypot(p.x - isle.cx, p.z - isle.cz) < isle.R + 8;
      if (onIsle && mountainBlock) {
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

  function boot() {
    bag();
    version();
    ensureUi();
    try { dress(); } catch (err) { console.error(err); }
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
