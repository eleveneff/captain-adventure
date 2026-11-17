/* Captain Adventure 5.0 — Learn & Build.
   Direct lair.commit() is unchanged, so older saves and tests keep their prices.
   The Yes button opens a short skill gate first, unless debug includes nogate. */
(function () {
  const CA = window.CaptainAdventure;
  if (!CA || !CA.lair || !CA.state) return;
  const VER = "Captain Adventure 5.0: Learn & Build";

  const BUILD_SKILL = {
    hq: "reading", pool: "area", garage: "measure", tower: "measure", trophy: "patterns",
    slide: "area", course: "time", aqua: "data", roof: "area", tunnel: "measure"
  };
  const SKILL_NAME = {
    area: "Area and volume", money: "Money", measure: "Measurement", reading: "Reading",
    vocab: "Vocabulary", patterns: "Patterns and place value", time: "Time", data: "Data",
    navigation: "Navigation", fractions: "Fractions", word: "Word problems"
  };

  function item(skill, level, prompt, choices, answer, hint, explain, visual, extra) {
    return Object.assign({ skill, level, prompt, choices, answer, hint, explain, visual: visual || "line" }, extra || {});
  }
  const BANK = [
    item("area", "confidence", "A rug is 4 squares long and 3 squares wide. How many squares cover it?", ["12", "7", "43", "1"], 0, "Multiply the two sides.", "4 times 3 is 12.", "grid", { n: 12 }),
    item("area", "confidence", "A pool is 5 feet long and 2 feet wide. What is its area?", ["10 square feet", "7 square feet", "52 square feet", "3 square feet"], 0, "Area is length times width.", "5 times 2 is 10.", "grid", { n: 10 }),
    item("area", "level", "A pool is 4 feet long, 3 feet wide, and 2 feet deep. How many 1-foot cubes fill it?", ["24", "9", "14", "432"], 0, "Find the bottom layer, then the layers.", "4 times 3 is 12. Two layers make 24.", "grid", { n: 24 }),
    item("area", "level", "A dock is 6 meters long and 2 meters wide. What is the perimeter?", ["16 meters", "12 meters", "8 meters", "62 meters"], 0, "Add all four sides.", "6 + 2 + 6 + 2 = 16.", "grid", { n: 16 }),
    item("area", "stretch", "A rectangle has area 18 and length 6. What is the width?", ["3", "12", "24", "18"], 0, "Divide the area by the length.", "18 divided by 6 is 3.", "grid", { n: 3 }),
    item("area", "stretch", "On a plan, 1 square stands for 2 meters. A room is 4 squares long. How many meters is that?", ["8 meters", "6 meters", "2 meters", "42 meters"], 0, "Each square is worth 2 meters.", "4 times 2 is 8.", "grid", { n: 8 }),

    item("measure", "confidence", "A rope is 9 meters. You use 4 meters. How much is left?", ["5 meters", "13 meters", "94 meters", "4 meters"], 0, "Subtract the piece you used.", "9 minus 4 is 5.", "line", { n: 5 }),
    item("measure", "confidence", "Which length is longer?", ["12 meters", "7 meters", "They are equal", "0 meters"], 0, "The bigger number is the longer length.", "12 is more than 7.", "line", { n: 12 }),
    item("measure", "level", "A dock is 15 meters. The boat is 9 meters. How much longer is the dock?", ["6 meters", "24 meters", "15 meters", "4 meters"], 0, "Subtract the shorter length.", "15 minus 9 is 6.", "line", { n: 6 }),
    item("measure", "level", "A plank is 14 feet. You saw off 5 feet. How long is it now?", ["9 feet", "19 feet", "3 feet", "145 feet"], 0, "Take the cut piece away.", "14 minus 5 is 9.", "line", { n: 9 }),
    item("measure", "stretch", "1 meter is 100 centimeters. A rope is 1 meter and you cut off 30 centimeters. How many centimeters are left?", ["70 cm", "30 cm", "130 cm", "100 cm"], 0, "Change the meter into centimeters first.", "100 minus 30 is 70.", "line", { n: 70 }),
    item("measure", "stretch", "How many centimeters are in 2 meters?", ["200 cm", "20 cm", "2 cm", "100 cm"], 0, "Each meter is 100 centimeters.", "2 times 100 is 200.", "line", { n: 200 }),

    item("reading", "confidence", "Mina planted seeds and watered them every day. The seeds grew into flowers. What is the main idea?", ["Mina's seeds grew into flowers.", "Mina dislikes water.", "Flowers do not need sun.", "The story is about a race."], 0, "The main idea is what the whole bit is about.", "Both sentences are about the seeds becoming flowers.", "read"),
    item("reading", "confidence", "The captain checked the chart, then steered toward the green buoy. What is this mostly about?", ["The captain using a chart to steer.", "How to bake bread.", "A closed market.", "Counting by twos."], 0, "Ask what both parts share.", "The captain uses the chart and then steers.", "read"),
    item("reading", "level", "Lila read the sign, checked the map, and chose the left channel. What is the main idea?", ["Lila used clues to choose a channel.", "Lila lost her map.", "The left channel was closed.", "Signs are only for decoration."], 0, "Look at what Lila did with the information.", "She used the sign and the map to decide.", "read"),
    item("reading", "level", "The keeper filled the lamp, trimmed the wick, and lit the beam. What is the passage mainly about?", ["The keeper getting the lamp ready.", "A fish jumping a net.", "Why stars twinkle.", "A broken dock."], 0, "Who is doing the actions?", "Every sentence is about the keeper and the lamp.", "read"),
    item("reading", "stretch", "The cove looked empty, but fresh tracks crossed the sand. Mara followed them and found the nest. What can you tell?", ["The tracks led Mara to the nest.", "Mara never entered the cove.", "The nest was in the clouds.", "There were no tracks."], 0, "Use the clues plus what she did.", "She followed the tracks and found the nest.", "read"),
    item("reading", "stretch", "The cabin was quiet. Coils of rope hung on pegs, and a half-drawn chart waited on the table. What is the main idea?", ["Someone is in the middle of planning a trip.", "The cabin is a kitchen.", "The chart blew into the sea.", "Rope cannot be stored."], 0, "A half-drawn chart means the work is still going.", "The waiting chart is the clue.", "read"),

    item("patterns", "confidence", "3, 6, 9, 12, ___", ["15", "13", "16", "10"], 0, "The numbers grow by 3.", "12 plus 3 is 15.", "blocks", { n: 15 }),
    item("patterns", "confidence", "4, 8, 12, ___", ["16", "13", "20", "14"], 0, "Add 4 each time.", "12 plus 4 is 16.", "blocks", { n: 16 }),
    item("patterns", "level", "How many hundreds are in 416?", ["4", "1", "6", "41"], 0, "The first digit shows the hundreds.", "416 is 4 hundreds, 1 ten, and 6 ones.", "blocks", { n: 4 }),
    item("patterns", "level", "Star, shell, star, shell, ___", ["Star", "Map", "Shell", "Coin"], 0, "The pair repeats.", "After shell, the pattern starts again with star.", "blocks", { n: 2 }),
    item("patterns", "stretch", "325 is…", ["3 hundreds, 2 tens, and 5 ones", "5 hundreds and 2 ones", "325 hundreds", "3 ones"], 0, "Say the number in hundreds, tens, and ones.", "The 3 is in the hundreds place.", "blocks", { n: 325 }),
    item("patterns", "stretch", "300 + 40 + 6 =", ["346", "364", "436", "300"], 0, "Add hundreds, then tens, then ones.", "300 + 40 is 340, plus 6 is 346.", "blocks", { n: 346 }),

    item("time", "confidence", "A watch starts at 2:00 and lasts 1 hour. When does it end?", ["3:00", "2:00", "1:00", "4:30"], 0, "One hour later.", "2:00 plus 1 hour is 3:00.", "line", { n: 3 }),
    item("time", "level", "Practice starts at 1:10 and ends at 1:40. How long is it?", ["30 minutes", "40 minutes", "10 minutes", "2 minutes"], 0, "Count the minutes from 10 to 40.", "40 minus 10 is 30.", "line", { n: 30 }),
    item("time", "stretch", "A sail starts at 3:20 and lasts 25 minutes. When does it end?", ["3:45", "3:25", "4:20", "3:05"], 0, "Add the minutes onto the start time.", "3:20 plus 25 minutes is 3:45.", "line", { n: 45 }),

    item("data", "confidence", "A chart shows 2 turtles and 6 fish. Which group has more?", ["Fish", "Turtles", "They are equal", "Boats"], 0, "Compare the two numbers.", "6 is more than 2.", "bars", { n: 6 }),
    item("data", "level", "The tally is 4 parrots and 3 turtles. How many animals in all?", ["7", "1", "12", "43"], 0, "Add the two groups.", "4 plus 3 is 7.", "bars", { n: 7 }),
    item("data", "stretch", "Each shell on a chart means 2 coins. What do 4 shells mean?", ["8 coins", "4 coins", "6 coins", "2 coins"], 0, "Four groups of 2.", "4 times 2 is 8.", "bars", { n: 8 }),

    item("money", "confidence", "A bun costs 4 coins. You pay 10. What is your change?", ["6 coins", "14 coins", "4 coins", "40 coins"], 0, "Subtract the price from what you paid.", "10 minus 4 is 6.", "coins", { n: 6 }),
    item("money", "confidence", "You have 3 coins and find 2 more. How many coins now?", ["5", "1", "6", "32"], 0, "Add the coins you found.", "3 plus 2 is 5.", "coins", { n: 5 }),
    item("money", "level", "Fish costs 8 coins. You pay with 20. What is your change?", ["12 coins", "28 coins", "8 coins", "2 coins"], 0, "Subtract the price.", "20 minus 8 is 12.", "coins", { n: 12 }),
    item("money", "level", "Two ropes cost 7 coins each. What do they cost together?", ["14 coins", "9 coins", "27 coins", "7 coins"], 0, "Two groups of 7.", "7 plus 7 is 14.", "coins", { n: 14 }),
    item("money", "stretch", "Three fish cost 5 coins each. You pay 20. What is your change?", ["5 coins", "15 coins", "8 coins", "25 coins"], 0, "Find the total, then the change.", "3 times 5 is 15. 20 minus 15 is 5.", "coins", { n: 5 }),
    item("money", "stretch", "A chart costs 15 coins. You pay 10, then 8. What is left?", ["3 coins", "18 coins", "15 coins", "0 coins"], 0, "Add what you paid, then subtract the price.", "10 + 8 = 18, and 18 minus 15 is 3.", "coins", { n: 3 }),

    item("vocab", "confidence", "A harbor is a…", ["sheltered place for boats", "kind of storm", "math sign", "desert path"], 0, "Boats tie up in a harbor.", "A harbor is a sheltered place for boats.", "read"),
    item("vocab", "level", "Swift means…", ["very fast", "very slow", "very salty", "very square"], 0, "A swift boat moves quickly.", "Swift means very fast.", "read"),
    item("vocab", "stretch", "Mooring means…", ["a place to tie a boat", "a loud engine", "a kind of fish", "a coin"], 0, "You moor a boat when you tie it up.", "A mooring is a place to tie a boat.", "read"),

    item("navigation", "confidence", "A boat goes 3 squares east and 4 squares north. How long is the straight path?", ["5 squares", "7 squares", "12 squares", "1 square"], 0, "3 and 4 make a 3-4-5 triangle.", "3, 4, and 5 are a right-triangle triple. 3×3 + 4×4 = 5×5.", "legs", { east: 3, north: 4 }),
    item("navigation", "level", "A boat sails 6 knots for 3 hours. How far does it go?", ["18 miles", "9 miles", "2 miles", "63 miles"], 0, "Distance is speed times time.", "6 times 3 is 18.", "hours", { hours: 3, speed: 6 }),
    item("navigation", "stretch", "North is marked. The bow points to the right of north. Which way is that?", ["East", "West", "South", "North"], 0, "Right of north on a map is east.", "Clockwise from north is east.", "compass"),

    item("fractions", "confidence", "One apple is shared equally by 2 friends. What fraction does each friend get?", ["1/2", "1/4", "2/1", "1/3"], 0, "Two equal shares.", "Each friend gets 1 of the 2 parts.", "bars", { n: 1 }),
    item("fractions", "level", "What is 1/2 of 10?", ["5", "10", "2", "12"], 0, "Half means split into 2 equal groups.", "10 divided by 2 is 5.", "bars", { n: 5 }),
    item("fractions", "stretch", "A cake is cut into 4 equal slices. Mara eats 1. What fraction is left?", ["3/4", "1/4", "4/3", "1/2"], 0, "Subtract the eaten slice from the whole.", "4 minus 1 leaves 3 slices, so 3/4.", "bars", { n: 3 })
  ];

  const TEACH = {
    money: [
      { say: "First, count the coins you started with.", visual: "coins", n: 10 },
      { say: "Next, take away the coins you spent.", visual: "coins", n: 6 },
      { say: "The coins still in your hand are the change.", visual: "coins", n: 4 }
    ],
    reading: [
      { say: "Read the question, then look back at the story.", visual: "read" },
      { say: "The highlighted sentence is where the answer lives.", visual: "read" },
      { say: "The main idea is the big point of the whole story.", visual: "read" }
    ],
    area: [
      { say: "The bottom of the pool is a rectangle. Multiply the two sides.", visual: "grid", n: 12 },
      { say: "If it has depth, that rectangle is one layer of cubes.", visual: "grid", n: 12 },
      { say: "Two layers means you double the bottom.", visual: "grid", n: 24 }
    ],
    measure: [
      { say: "Find the longer mark.", visual: "line", n: 9 },
      { say: "Jump back by the piece you used or compare.", visual: "line", n: 4 },
      { say: "The difference is what is left.", visual: "line", n: 5 }
    ],
    patterns: [
      { say: "A three-digit number has hundreds, tens, and ones.", visual: "blocks", n: 346 },
      { say: "Each big bar can stand for one hundred.", visual: "blocks", n: 300 },
      { say: "Then add the tens and the ones.", visual: "blocks", n: 46 }
    ],
    time: [
      { say: "Start at the first time.", visual: "line", n: 2 },
      { say: "Each hop can be 10 minutes.", visual: "line", n: 3 },
      { say: "Land on the end time.", visual: "line", n: 4 }
    ],
    data: [
      { say: "A taller bar means a bigger count.", visual: "bars", n: 4 },
      { say: "To compare, subtract the smaller count.", visual: "bars", n: 2 },
      { say: "That difference is how many more.", visual: "bars", n: 2 }
    ],
    navigation: [
      { say: "Draw the two legs of the trip.", visual: "line", n: 3 },
      { say: "A 3-east and 4-north trip closes with 5.", visual: "line", n: 5 },
      { say: "Speed times hours gives the distance.", visual: "line", n: 6 }
    ],
    fractions: [
      { say: "Split the bar into equal parts.", visual: "bars", n: 4 },
      { say: "Shade only the parts the question names.", visual: "bars", n: 1 },
      { say: "The top number is the shaded parts. The bottom is all the parts.", visual: "bars", n: 1 }
    ],
    vocab: [
      { say: "Read the word in the sentence.", visual: "read" },
      { say: "Swap in each choice and see which one fits.", visual: "read" },
      { say: "The choice that keeps the meaning is the answer.", visual: "read" }
    ]
  };
  TEACH.word = TEACH.money;

  const LOG_TEXT = "Captain Mara opened the log before the crew left the home harbor. The sky over Turtle Cove held a thin line of clouds, but the channel was calm and the water was clear enough to see the sand. She wrote the time, the wind, and the heading so the next watch would know what she had seen. The power boat's tank was half full, which was enough for the short run to Parrot Palms and back. On the way, a child on the dock waved a red flag. Mara slowed the boat, because a red flag means the channel is closed to fast boats. She steered toward the green buoy and kept the speed low. At the palms, the crew counted eight fish in the live well and traded four of them for a coil of rope. Mara noted the trade, the buoy, and the flag in the same lines so nothing important would be forgotten. The trip home was quiet. The clouds never became a storm, and the lighthouse lamp was already bright when the boat reached the mooring. Mara closed the log, wiped the salt from the page, and told the crew they had made a careful and kind voyage. She checked the knot twice, then set the pencil back in its box.";

  const LORE = {
    harbor: "Home harbor is where every voyage in this bay begins. The wooden docks reach into calm water, and the power boat waits with its rope coiled in a neat circle. Before anyone casts off, the crew checks the tank, the life rings, and the way the wind pushes the flag. A green buoy marks the safe side of the channel. A red buoy marks the side to avoid. Children on the pier sell cold lemonade, but a careful captain writes the heading in the log before buying a cup. Across the water the lighthouse keeps a steady blink, even in the afternoon. Sailboats slide past the sandbar without rushing. The rule of the harbor is simple: look, count, and then move. When the buoys on the water match the chart, the boat may leave. When they do not, the crew waits and looks again. That pause has saved more trips than any burst of speed. At sunset the docks turn gold, and every captain ties up with the same careful knot they used at dawn.",
    turtle: "Turtle Cove is a quiet bowl of water on the far side of the bay. The sand there is pale, and the nests sit above the reach of an ordinary wave. Mara walked the beach at dusk and counted the tracks that led from the grass to the water. She did not touch a nest. She only marked the spot on her chart so the next crew would walk around it. A low fence of driftwood kept the bright pier lights from shining straight onto the sand. Baby turtles follow the brightest path, so a dark beach helps them find the sea. The captain dimmed the boat lamp and waited. One small shape crossed the last ridge of sand and slipped into the wash. Mara wrote the time and the number of tracks, then pushed the boat back with an oar so the motor would not startle the rest. The cove teaches a simple kind of care: some places are for watching, not for landing.",
    parrot: "Parrot Palms rises as a green mound with tall trees that rattle in a light wind. The birds there are loud, curious, and quick to repeat a word they have just heard. Mara tied the boat to a palm root and carried only a notebook up the path. She did not bring food, because a parrot that is fed from a hand may stop hunting for fruit. Under the largest tree she found a scatter of bright shells. They were not treasure. They were the birds' playthings, dropped and picked up again. She counted twelve shells and left every one of them. A blue parrot landed on the chart table in the boat and said the word rope, which made the crew laugh. Mara wrote that the palms were healthy and the path was dry. On the way down she stopped to retie the bow line, because a rising tide can lift a knot off a root. The island is a good teacher: look closely, take nothing, and listen before you speak.",
    pirate: "Pirate Point is the largest of the outer islands, and the secret lair sits inside its round rock. The old stories say pirates buried a chest on this beach. Mara knows the truer story: most crews spent what they earned, and the X on a map was often a lesson, not a hole. Still, the point is a fine place to practice plans. She paced the rock and wrote the length of each wall she hoped to build. A pool would need length, width, and depth. A dock would need a measured walk from the door to the water. The hidden door is only a disk in a wooden frame until a captain earns it. Lanterns along the dry path show the way so nobody steps into the pool by mistake. From the lookout, the whole bay fits into one turn of the glass. Mara closed her notebook and patted the rock. Building, she decided, is just careful counting that you can walk through later.",
    lighthouse: "The lighthouse stands on the home island where the channel bends toward open water. Its brick tower is striped so a boat can see it against a gray sky. Inside, a spiral stair climbs past small portholes to the lamp room. The keeper's first job is to make the lamp bright, and the second job is to write the truth in the log. A dark lamp is a danger even on a clear evening, because a stranger does not know the bend. Mara climbed slowly and kept one hand on the rail. At the top she checked the wick, the glass, and the direction of the beam. It pointed down the channel, not into the palms. She signed the log with the date and a short note: lamp lit, channel clear, wind gentle. Then she walked back down, counting the steps so she would know the tower on a night with no moon. A lighthouse is a promise. The promise is kept only if someone climbs, lights, and writes."
  };

  let clockMs = 0;
  let clockDate = null;
  let holdMs = 0;
  let holding = false;
  let mode = null;
  let pausedFrom = null;
  let gate = null;
  let daily = null;
  let act = null;
  let tutor = null;
  let resumeMode = null;
  let loreId = "harbor";
  let gfx = null;
  let worldHidden = null;
  let lastNow = 0;
  const pending = [];

  function coins() { return Math.max(0, Math.floor(+CA.state().score || 0)); }
  function paintScore() {
    const el = document.getElementById("score");
    if (el) el.textContent = String(coins());
  }
  function persist() { if (CA.save) CA.save(); paintScore(); }
  function bag() {
    const s = CA.state();
    const fresh = !s.v50 || typeof s.v50 !== "object" || Array.isArray(s.v50);
    if (fresh) s.v50 = {};
    const v = s.v50;
    v.ver = 1;
    if (!v.skills || typeof v.skills !== "object" || Array.isArray(v.skills)) v.skills = {};
    if (!Array.isArray(v.due)) v.due = [];
    if (!v.daily || typeof v.daily !== "object") v.daily = { day: "", done: 0, streak: 0, last: "", paidDay: "", paid: 0 };
    if (!v.passed || typeof v.passed !== "object") v.passed = {};
    if (!v.ready || typeof v.ready !== "object") v.ready = {};
    if (!v.refunded || typeof v.refunded !== "object") v.refunded = {};
    if (typeof v.playMs !== "number") v.playMs = 0;
    if (typeof v.quiet !== "boolean") v.quiet = !!(window.__CA_QUIET || /(?:^|[?&])quiet=1(?:&|$)/.test(location.search));
    if (fresh) persist();
    return v;
  }
  function today() {
    if (clockDate) return clockDate;
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function dayNum(iso) {
    const parts = String(iso || "").split("-").map(Number);
    return Math.floor(Date.UTC(parts[0], parts[1] - 1, parts[2]) / 86400000);
  }
  function addDays(iso, n) {
    const parts = iso.split("-").map(Number);
    const dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    dt.setUTCDate(dt.getUTCDate() + n);
    return dt.toISOString().slice(0, 10);
  }
  function later(ms, fn) { pending.push({ at: clockMs + ms, fn }); }
  function skillRow(skill) {
    const v = bag();
    if (!v.skills[skill]) v.skills[skill] = { c: 0, w: 0, n: 0 };
    return v.skills[skill];
  }
  function record(skill, ok) {
    const row = skillRow(skill);
    row.n += 1;
    if (ok) row.c += 1;
    else { row.w += 1; queueReview(skill); }
    return row;
  }
  function queueReview(skill) {
    const day = dayNum(today());
    const v = bag();
    [1, 3, 7].forEach((n) => {
      if (!v.due.some((d) => d.skill === skill && d.at === day + n)) v.due.push({ skill, at: day + n });
    });
  }
  function nextDue() {
    const day = dayNum(today());
    const hit = bag().due.find((d) => d.at <= day);
    return hit ? hit.skill : null;
  }
  function serveDue(skill) {
    const day = dayNum(today());
    const v = bag();
    const i = v.due.findIndex((d) => d.skill === skill && d.at <= day);
    if (i >= 0) v.due.splice(i, 1);
  }
  function weakest() {
    const rows = Object.entries(bag().skills).filter(([, s]) => s.n > 0);
    rows.sort((a, b) => (a[1].c / a[1].n) - (b[1].c / b[1].n) || b[1].n - a[1].n);
    if (!rows.length) return null;
    return rows[0][1].c / rows[0][1].n < 0.8 ? rows[0][0] : null;
  }
  function pick(skill, level, used) {
    const all = BANK.filter((q) => q.skill === skill && q.level === level);
    const fresh = all.filter((q) => !used.has(q.prompt));
    const q = fresh[0] || all[0];
    if (!q) return item(skill, level, "Count on by 1: 4, 5, ___", ["6", "3", "8", "45"], 0, "Add 1.", "5 plus 1 is 6.", "line", { n: 6 });
    used.add(q.prompt);
    return Object.assign({}, q);
  }
  function mapSkill(raw) {
    const t = String(raw || "").toLowerCase();
    if (/read|main|infer|detail|tone|passage/.test(t)) return "reading";
    if (/vocab|synonym|word/.test(t)) return "vocab";
    if (/frac/.test(t)) return "fractions";
    if (/money|coin|change|price/.test(t)) return "money";
    if (/area|volume|perim/.test(t)) return "area";
    if (/place|pattern|code/.test(t)) return "patterns";
    if (/time|elapsed/.test(t)) return "time";
    if (/data|graph|tally|fish/.test(t)) return "data";
    if (/nav|compass|heading|speed|distance/.test(t)) return "navigation";
    if (/meas|length|dock|ruler/.test(t)) return "measure";
    if (BANK.some((q) => q.skill === t)) return t;
    return "word";
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  function wordCount(text) { return String(text || "").trim().split(/\s+/).filter(Boolean).length; }
  function highlightSentence(info) {
    const passage = String((info && (info.passage || info.explain)) || "");
    const sentences = passage.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
    if (!sentences.length) return "Look back at the story. The answer is in one sentence.";
    const words = String((info.choices && info.choices[info.answer]) || info.explain || "").toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    let best = sentences[0], score = -1;
    sentences.forEach((s) => {
      const low = s.toLowerCase();
      const sc = words.reduce((n, w) => n + (low.includes(w) ? 1 : 0), 0);
      if (sc > score) { score = sc; best = s; }
    });
    return best;
  }
  function quiet() {
    const v = bag();
    const btn = document.getElementById("sound");
    if (btn && /off/i.test(btn.textContent || "")) return true;
    return !!v.quiet;
  }
  function progress() {
    const v = bag();
    const rows = Object.entries(v.skills).map(([skill, s]) => ({
      skill, n: s.n, c: s.c, w: s.w, acc: s.n ? Math.round(100 * s.c / s.n) : 0
    }));
    const weak = rows.filter((r) => r.n >= 2 && r.acc < 80).sort((a, b) => a.acc - b.acc || b.n - a.n).slice(0, 3);
    return { rows, weak, playMs: v.playMs || 0, streak: (v.daily && v.daily.streak) || 0 };
  }

  function css() {
    if (document.getElementById("v50-style")) return;
    const s = document.createElement("style");
    s.id = "v50-style";
    s.textContent = `
#learn-layer{position:fixed;inset:0;z-index:70;display:none;align-items:flex-end;justify-content:center;background:rgba(8,24,48,.28);padding:10px}
#learn-layer.show{display:flex}
#learn-card{width:min(760px,100%);max-height:min(64vh,680px);overflow:auto;background:linear-gradient(#fffdf6,#f3f7ff);border:6px solid #ffc83d;border-radius:22px;padding:12px 14px 16px;color:#10234d;box-shadow:0 18px 40px rgba(7,20,48,.35),0 8px 0 rgba(20,40,80,.18)}
#learn-card header{display:flex;align-items:center;justify-content:space-between;gap:8px}
#learn-card h2{margin:0;font-size:24px;display:flex;align-items:center;gap:8px}
.learn-ico{width:36px;height:36px;border-radius:12px;background:linear-gradient(#fff,#d7e6ff);border:2px solid #ffc83d;display:inline-flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 3px 0 rgba(20,40,80,.18)}
#learn-card button{font:800 17px/1.2 Trebuchet MS,sans-serif;border-radius:14px;border:0;background:#14336b;color:#fff;padding:8px 10px;min-height:42px;cursor:pointer}
#learn-card .ghost{background:#fff;color:#14336b;border:3px solid #00a7a0}
.learn-prompt{font-size:22px;font-weight:800;margin:8px 0}
.learn-choices{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.learn-choices button{text-align:left;display:flex;gap:8px;align-items:center}
.learn-choices b{width:28px;height:28px;border-radius:8px;background:#ffc83d;color:#10234d;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto}
.learn-hint{background:#fff4d6;border:3px solid #ffc83d;border-radius:14px;padding:8px 10px;margin-top:8px}
mark.learn-hit{background:#ffe08a;border-radius:6px;padding:0 3px}
.learn-visual{margin:8px 0;background:#fff;border:3px dashed #b9c7e4;border-radius:16px;padding:8px;min-height:64px}
.sq{width:22px;height:22px;display:inline-block;margin:2px;border-radius:4px;border:2px solid #14336b}
.sq.e{background:#7ec8ff}.sq.n{background:#ffd45a}.sq.cell{background:#c9e6ff}
.fish{font-size:28px;margin-right:4px}.coin{width:22px;height:22px;border-radius:50%;display:inline-block;margin:2px;background:#ffd45a;border:3px solid #c09010}
.ex-coin,.ex-cell{width:26px;height:26px;border-radius:50%;display:inline-block;margin:3px;background:#f3e6c4;border:3px solid #c09010}
.ex-coin.on{background:#ffd45a}.ex-cell{border-radius:6px;width:36px}.ex-cell.on{background:#7ec8ff;border-color:#14336b}
.ex-line{position:relative;height:34px;margin:14px 8px;background:linear-gradient(#14336b,#14336b) center/100% 4px no-repeat}
.ex-dot{position:absolute;top:8px;width:16px;height:16px;border-radius:50%;background:#e23d3d;transform:translateX(-50%)}
.ex-rod{display:inline-block;width:16px;height:48px;margin:2px;background:#b9e0ff;border:3px solid #14336b;border-radius:6px}
.ex-one{display:inline-block;width:14px;height:14px;margin:2px;background:#ffd45a;border:3px solid #c09010;border-radius:4px}
.hblk{display:inline-block;min-width:54px;margin:3px;padding:6px 4px;border-radius:8px;background:#14336b;color:#ffc83d;text-align:center;font-size:12px}
.rose{width:120px;height:120px;margin:4px auto;border:4px solid #14336b;border-radius:50%;position:relative}
.rose i{position:absolute;left:50%;top:8px;font-style:normal;font-weight:800}
.rose b{position:absolute;left:50%;top:50%;width:46px;height:4px;background:#e23d3d;transform-origin:left center}
.learn-story{font-size:16px;line-height:1.45;max-height:28vh;overflow:auto;background:#fff;border-radius:12px;padding:8px 10px}
#learn-pause{position:absolute;inset:0;background:rgba(255,250,242,.94);display:none;align-items:center;justify-content:center;text-align:center;border-radius:18px}
#learn-pause.show{display:flex}
#v50-cheer{position:fixed;left:50%;top:14%;transform:translateX(-50%);z-index:80;display:none;background:#fff;border:5px solid #ffc83d;border-radius:22px;padding:10px 16px;font:800 22px Trebuchet MS,sans-serif;color:#10234d;text-align:center;box-shadow:0 8px 0 rgba(0,0,0,.12);pointer-events:none}
#v50-cheer.show{display:block}
#v50-confetti{position:fixed;inset:0;pointer-events:none;z-index:75}
#winter-banner{position:fixed;left:50%;bottom:72px;transform:translateX(-50%);z-index:12;display:none;background:#14336b;color:#fff;border:3px solid #ffc83d;border-radius:14px;padding:6px 12px;font-weight:800;box-shadow:0 8px 18px rgba(0,0,0,.28);max-width:calc(100vw - 24px);text-align:center}
#winter-banner.show{display:block}
#ver-flag{font-size:12px;font-weight:800;color:#ffc83d;background:#14336b;border:2px solid #ffc83d;border-radius:10px;padding:3px 8px;max-width:100%;margin-top:4px}
#learn-open{position:static;border:3px solid #ffc83d;background:#14336b;color:#fff;font-weight:800;border-radius:12px;padding:6px 10px;box-shadow:0 3px 0 rgba(0,0,0,.25)}
body.learn-on #hud,body.learn-on #gear,body.learn-on #zoom,body.learn-on #touch-toggle,body.learn-on #hint,body.learn-on #settings,body.learn-on #prompt,body.learn-on #act,body.learn-on #joy,body.learn-on #learn-open,body.mg-on #hud,body.mg-on #hint,body.mg-on #gear,body.mg-on #zoom,body.mg-on #touch-toggle{visibility:hidden !important;pointer-events:none !important}
.card,.pcard{box-shadow:0 16px 36px rgba(7,20,48,.28)}
@media (max-width:430px) and (min-height:700px){
  #hud{max-width:calc(100vw - 78px)}
  #hud .hud-row{flex-wrap:wrap}
  #hud .chip{font-size:15px;padding:3px 8px}
  #prize-bar{width:100% !important;max-width:100%;font-size:13px}
  #hint{white-space:normal;max-width:calc(100vw - 16px);font-size:14px}
  #learn-card{max-height:72vh;padding:8px 10px 12px}
  #learn-card button{min-height:38px;padding:6px 8px}
  .learn-choices{grid-template-columns:1fr}
  .learn-prompt{font-size:18px;margin:4px 0}
  .learn-story{max-height:16vh}
  #winter-banner{bottom:88px;font-size:13px;max-width:calc(100vw - 20px)}
}
`;
    document.head.appendChild(s);
  }
  function layer() {
    css();
    let el = document.getElementById("learn-layer");
    if (!el) {
      el = document.createElement("div");
      el.id = "learn-layer";
      el.innerHTML = '<div id="learn-card"></div>';
      el.addEventListener("pointerdown", (e) => e.stopPropagation());
      document.body.appendChild(el);
      const bits = document.createElement("canvas");
      bits.id = "v50-confetti";
      document.body.appendChild(bits);
      const ban = document.createElement("div");
      ban.id = "winter-banner";
      ban.textContent = "Winter watch · December 1 to January 6";
      document.body.appendChild(ban);
    }
    return el;
  }
  function setPlay(on) {
    document.body.classList.toggle("learn-on", !!on);
    layer().classList.toggle("show", !!on);
  }
  function closePlay() {
    mode = null;
    pausedFrom = null;
    tutor = null;
    resumeMode = null;
    setPlay(false);
  }
  function orderOf(q) {
    if (!q._perm) {
      const shift = 1 + ([...String(q.prompt)].reduce((n, c) => n + c.charCodeAt(0), 0) % 3);
      q._perm = [0, 1, 2, 3].map((i) => (i + shift) % 4);
    }
    return q._perm;
  }
  function choiceButtons(q, attr) {
    const perm = orderOf(q);
    return perm.map((src) => `<button data-${attr}="${src}"><b>${"ABCD"[perm.indexOf(src)]}</b>${esc(q.choices[src])}</button>`).join("");
  }
  function visualHtml(kind, n, progress, q) {
    if (kind === "read" || (q && q.visual === "read")) return "";
    const p = Math.max(0, Math.min(1, progress == null ? 0.75 : progress));
    if (q && q.visual === "legs") {
      const e = q.east || 3, north = q.north || 4;
      return `<div class="learn-visual">${"<i class='sq e'></i>".repeat(e)}${"<i class='sq n'></i>".repeat(north)}<div>${e} east, then ${north} north. The straight path is the question.</div></div>`;
    }
    if (q && q.visual === "hours") {
      const h = q.hours || 3;
      return `<div class="learn-visual">${Array.from({ length: h }, (_, i) => `<span class="hblk">hour ${i + 1}<br>${q.speed || ""} kn</span>`).join("")}</div>`;
    }
    if (q && q.visual === "compass") {
      return `<div class="learn-visual"><div class="rose"><i>N</i><b style="transform:translate(-4px,-2px) rotate(90deg)"></b></div><div>North is marked. The red bow points right.</div></div>`;
    }
    if (q && q.visual === "market") {
      return `<div class="learn-visual">${"<span class='fish'>🐟</span>".repeat(q.fish || 1)}${"<i class='coin'></i>".repeat(Math.min(12, q.coins || 0))}<div>${q.caption || ""}</div></div>`;
    }
    if (q && q.visual === "cells") {
      return `<div class="learn-visual">${"<i class='sq cell'></i>".repeat(q.cells || 0)}<div>${q.caption || ""}</div></div>`;
    }
    if (q && q.visual === "code") {
      const groups = q.groups || [];
      return `<div class="learn-visual">${groups.map((g) => `<span class="hblk">${"<b style='color:#fff'>•</b>".repeat(g)}</span>`).join("")}<div>${q.caption || ""}</div></div>`;
    }
    if (kind === "coins") {
      const total = Math.max(1, Math.min(12, n || 5));
      const on = Math.max(1, Math.round(p * total));
      return `<div class="learn-visual">${Array.from({ length: total }, (_, i) => `<span class="ex-coin${i < on ? " on" : ""}"></span>`).join("")}<div>Counting ${on} of ${total}</div></div>`;
    }
    if (kind === "grid" || kind === "bars") {
      const total = kind === "grid" ? 8 : 4;
      const on = Math.max(1, Math.round(p * Math.min(total, Math.max(1, (n || 1) % total || 1))));
      return `<div class="learn-visual">${Array.from({ length: total }, (_, i) => `<span class="ex-cell${i < on ? " on" : ""}"></span>`).join("")}</div>`;
    }
    if (kind === "blocks") {
      const tens = Math.min(3, Math.max(1, Math.round(p * 3)));
      const ones = Math.min(6, Math.round(p * 4) + 1);
      return `<div class="learn-visual">${"<span class='ex-rod'></span>".repeat(tens)}${"<span class='ex-one'></span>".repeat(ones)}<div>${tens} tens and ${ones} ones</div></div>`;
    }
    const left = Math.round(20 + p * 60);
    return `<div class="learn-visual"><div class="ex-line"><div class="ex-dot" style="left:${left}%"></div></div><div>Number line</div></div>`;
  }
  function qVisual(q) { return visualHtml(q.visual, q.n, 0.8, q); }

  function openTutorial(info) {
    info = info || {};
    const skill = mapSkill(info.skill);
    if (tutor) return { ok: true, already: true, skill: tutor.skill, steps: tutor.steps.length };
    const steps = (TEACH[skill] || TEACH.word).slice(0, 4);
    const used = new Set(info.prompt ? [info.prompt] : []);
    const practice = pick(skill, "confidence", used);
    tutor = { skill, steps, step: 0, phase: "teach", practice, info, hit: highlightSentence(info) };
    resumeMode = mode;
    mode = "tutor";
    show();
    return { ok: true, skill, steps: steps.length, skippable: false };
  }
  function tutorAdvance() {
    if (!tutor || tutor.phase !== "teach") return { ok: false };
    tutor.step += 1;
    if (tutor.step >= tutor.steps.length) tutor.phase = "practice";
    show();
    return { ok: true, step: tutor.step, phase: tutor.phase, skippable: tutor.step >= 1 };
  }
  function tutorSkip() {
    if (!tutor || tutor.step < 1) return { ok: false, reason: "first-step" };
    tutor.phase = "practice";
    show();
    return { ok: true, phase: "practice" };
  }
  function endTutor(right) {
    const back = resumeMode;
    const session = back === "gate" ? gate : back === "daily" ? daily : back === "act" ? act : null;
    tutor = null;
    if (session) {
      const q = session.qs[session.i];
      if (q && q._fresh) session.qs[session.i] = q._fresh;
      mode = back;
      resumeMode = null;
      show();
    } else {
      resumeMode = null;
      mode = null;
      closePlay();
    }
    return { ok: true, right: !!right, score: coins() };
  }

  function sessionNow() {
    if (mode === "daily" || (mode === "tutor" && resumeMode === "daily")) return daily;
    if (mode === "act" || (mode === "tutor" && resumeMode === "act")) return act;
    if (mode === "gate" || (mode === "tutor" && resumeMode === "gate")) return gate;
    return null;
  }
  function makeGate(id) {
    const skill = BUILD_SKILL[id];
    const used = new Set();
    const qs = [];
    const due = nextDue();
    const weak = weakest();
    if (due) qs.push(pick(due, "confidence", used));
    else if (weak && weak !== skill) qs.push(pick(weak, "confidence", used));
    else qs.push(pick(skill, "confidence", used));
    if (qs[0].skill !== skill) qs.push(pick(skill, "confidence", used));
    qs.push(pick(skill, "level", used));
    qs.push(pick(skill, "stretch", used));
    if (qs.length < 4) qs.push(pick(skill, "level", used));
    return qs.slice(0, 5);
  }
  function priceOf(id) {
    const d = CA.lair.DEFS.find((x) => x.id === id);
    if (!d) return { ok: false, reason: "missing", score: coins() };
    if (CA.lair.own(id)) return { ok: false, reason: "owned", score: coins() };
    if ((d.need || []).some((n) => !CA.lair.own(n))) return { ok: false, reason: "need", score: coins() };
    if (coins() < d.price) return { ok: false, reason: "short", price: d.price, score: coins() };
    return { ok: true, price: d.price, name: d.name, score: coins() };
  }
  function openGate(id) {
    if (!BUILD_SKILL[id]) return { ok: false, reason: "missing", score: coins() };
    const v = bag();
    if (gate && gate.id === id) return { ok: true, total: gate.qs.length, already: true, score: coins() };
    if (v.passed[id] || v.ready[id]) return { ok: false, reason: "ready", score: coins() };
    const asked = priceOf(id);
    if (!asked.ok) return asked;
    const qs = makeGate(id);
    gate = { id, qs, i: 0, misses: 0, hinted: 0, price: asked.price, name: asked.name };
    openMode("gate");
    return { ok: true, total: qs.length, skill: qs[0].skill, price: asked.price, score: coins() };
  }
  function answer(choice) {
    const session = sessionNow();
    if (!session || mode === "tutor") {
      if (mode === "tutor") {
        const live = resumeMode === "daily" ? daily : resumeMode === "act" ? act : gate;
        if (!live) return { ok: false, reason: "tutor", score: coins() };
        return answerInto(live, choice);
      }
      return { ok: false, reason: "closed", score: coins() };
    }
    return answerInto(session, choice);
  }
  function answerInto(session, choice) {
    const q = session.qs[session.i];
    if (!q) return { ok: false, reason: "done", score: coins() };
    const right = choice === q.answer;
    const beforeIndex = session.i;
    record(q.skill, right);
    serveDue(q.skill);
    persist();
    if (!right) {
      session.misses = (session.misses || 0) + 1;
      const used = new Set(session.qs.map((x) => x.prompt));
      q._hint = q.hint;
      q._fresh = pick(q.skill, q.level || "confidence", used);
      openTutorial({ skill: q.skill, prompt: q.prompt, explain: q.explain, choices: q.choices, answer: q.answer, passage: q.passage });
      return { ok: true, right: false, hint: q.hint, restart: false, index: beforeIndex, score: coins(), gentle: session.misses === 1, tutorial: true };
    }
    session.i += 1;
    celebrate(session.i > 0 && session.i % 3 === 0 ? "Three in a row!" : "Aye, Captain!");
    if (session.i >= session.qs.length) return finishSession(session);
    show();
    return { ok: true, right: true, done: false, index: session.i, score: coins() };
  }
  function finishSession(session) {
    if (session === daily) {
      const pay = completeDaily();
      const streak = bag().daily.streak;
      closePlay();
      daily = null;
      if (streak >= 3) celebrate("Three-day streak!");
      return { ok: true, right: true, done: true, pay, streak, score: coins() };
    }
    if (session === act) {
      closePlay();
      const id = act.id;
      act = null;
      return { ok: true, right: true, done: true, pay: 0, id, score: coins() };
    }
    const id = gate.id;
    const misses = gate.misses || 0;
    const hinted = gate.hinted || 0;
    const v = bag();
    v.ready[id] = 1;
    const res = CA.lair.commit(id);
    let refund = 0;
    if (res && res.ok) {
      v.passed[id] = 1;
      if (misses === 0 && !hinted && !v.refunded[id]) {
        CA.state().score = coins() + 1;
        v.refunded[id] = 1;
        refund = 1;
        paintScore();
      }
      celebrate(refund ? "Built! 1 coin back." : "Room built!");
    }
    persist();
    closePlay();
    gate = null;
    return { ok: !!(res && res.ok), right: true, done: true, reason: res && res.reason, refund, misses, score: coins(), price: res && res.price };
  }
  function completeDaily() {
    const v = bag();
    const day = today();
    if (v.daily.last === addDays(day, -1)) v.daily.streak = (v.daily.streak || 0) + 1;
    else if (v.daily.last !== day) v.daily.streak = 1;
    v.daily.last = day;
    v.daily.day = day;
    v.daily.done = 3;
    let pay = 0;
    if (v.daily.paidDay !== day) {
      pay = Math.min(3, 2 + (v.daily.streak >= 3 ? 1 : 0));
      CA.state().score = coins() + pay;
      v.daily.paidDay = day;
      v.daily.paid = pay;
      paintScore();
    }
    persist();
    return pay;
  }
  function startDaily() {
    const v = bag();
    const day = today();
    if (v.daily.day === day && v.daily.done >= 3) return { ok: false, reason: "done", streak: v.daily.streak, score: coins() };
    const used = new Set();
    const due = nextDue();
    const qs = [];
    if (due) qs.push(pick(due, "level", used));
    else qs.push(pick("patterns", "confidence", used));
    qs.push(pick("reading", "confidence", used));
    qs.push(pick("money", "confidence", used));
    daily = { qs: qs.slice(0, 3), i: 0, misses: 0, day };
    openMode("daily");
    return { ok: true, total: daily.qs.length, skill: daily.qs[0].skill, skills: daily.qs.map((q) => q.skill), score: coins() };
  }
  function openParent() {
    openMode("parent");
    return { ok: true, held: true, card: progress() };
  }
  function hold(ms) {
    holdMs += ms;
    if (holdMs >= 3000) {
      holdMs = 0;
      holding = false;
      return openParent();
    }
    return { ok: false, reason: "hold", heldMs: holdMs };
  }

  const ACT = {
    nav: {
      title: "Navigation", icon: "🧭",
      qs: [
        item("navigation", "confidence", "The boat goes 3 squares east and 4 squares north. How long is the straight path?", ["5 squares", "7 squares", "12 squares", "1 square"], 0, "3 and 4 make a 3-4-5 triangle.", "3×3 + 4×4 = 25, and 5×5 = 25.", "legs", { east: 3, north: 4 }),
        item("navigation", "level", "The boat sails at 6 knots for 3 hours. How far does it go?", ["18 miles", "9 miles", "2 miles", "63 miles"], 0, "Distance is speed times time.", "6 times 3 is 18.", "hours", { hours: 3, speed: 6 }),
        item("navigation", "stretch", "North is the only mark. The bow points to the right. Which heading is that?", ["East", "West", "South", "North"], 0, "On a chart, right of north is east.", "The right-hand heading is east.", "compass")
      ]
    },
    market: {
      title: "Fish market", icon: "🐟",
      qs: [
        item("money", "confidence", "One fish costs 6 coins. You pay 10. What is your change?", ["4 coins", "16 coins", "6 coins", "60 coins"], 0, "Subtract the price from 10.", "10 minus 6 is 4.", "market", { fish: 1, coins: 10, caption: "You pay these 10 coins. The tag says 6." }),
        item("money", "level", "Two fish cost 5 coins each. What do they cost together?", ["10 coins", "7 coins", "25 coins", "3 coins"], 0, "Two groups of 5.", "5 plus 5 is 10.", "market", { fish: 2, coins: 0, caption: "Each tag says 5. Find the total." }),
        item("money", "stretch", "Four fish cost 12 coins together. What is the price of one fish?", ["3 coins", "12 coins", "8 coins", "4 coins"], 0, "Share 12 equally into 4.", "12 divided by 4 is 3.", "market", { fish: 4, coins: 0, caption: "Four fish. The pile of coins is 12, not the unit price." })
      ]
    },
    blueprint: {
      title: "Lair blueprints", icon: "📐",
      qs: [
        item("area", "confidence", "How many squares are in this plan?", ["10", "7", "15", "4"], 0, "Count the squares, or multiply 5 by 2.", "There are 5 across and 2 up, so 10.", "cells", { cells: 10, caption: "Count the squares. The total is not printed." }),
        item("area", "level", "A deck is 6 meters long and 4 meters wide. What is the perimeter?", ["20 meters", "24 meters", "10 meters", "64 meters"], 0, "Add all four sides.", "6 + 4 + 6 + 4 = 20.", "line", { n: 6, caption: "The sides are 6 and 4. Add every side." }),
        item("area", "stretch", "On this plan, 1 square stands for 3 meters. The dock drawing is 4 squares long. How many meters is the real dock?", ["12 meters", "7 meters", "4 meters", "43 meters"], 0, "Each square is worth 3 meters.", "4 times 3 is 12.", "cells", { cells: 4, caption: "Four squares. Each square means 3 meters." })
      ]
    },
    code: {
      title: "Treasure codes", icon: "🗝️",
      qs: [
        item("patterns", "confidence", "The code grows: 3, 6, 9, 12, ___", ["15", "13", "14", "10"], 0, "Add 3 each time.", "12 plus 3 is 15.", "code", { groups: [3, 6, 9, 12], caption: "Each group has 3 more dots. The next group is not drawn." }),
        item("patterns", "level", "The chest code is 4 hundreds, 1 ten, and 6 ones. What number is that?", ["416", "146", "461", "4"], 0, "Hundreds, then tens, then ones.", "4 hundreds, 1 ten, and 6 ones is 416.", "blocks", { n: 416 }),
        item("patterns", "stretch", "20, 17, 14, ___  What comes next?", ["11", "13", "15", "10"], 0, "The code counts down by 3.", "14 minus 3 is 11.", "line", { n: 11 })
      ]
    },
    log: {
      title: "Captain's log", icon: "📖",
      passage: LOG_TEXT,
      qs: [
        item("reading", "confidence", "What is the main idea of this log?", ["Mara kept a careful record of a safe short trip.", "The crew was lost in a storm all day.", "The lighthouse lamp was broken.", "The harbor was closed for the whole week."], 0, "What is the whole entry about?", "She checks, writes, slows down, and comes home safely.", "read", { kind: "main", passage: LOG_TEXT }),
        item("reading", "level", "What did the red flag mean?", ["The channel is closed to fast boats.", "The fish were ready to sell.", "The tank was empty.", "A storm had already started."], 0, "Look for the sentence that tells what the flag means.", "The log says a red flag means the channel is closed to fast boats.", "read", { kind: "detail", passage: LOG_TEXT }),
        item("reading", "level", "Why did Mara write the flag, the buoy, and the trade in the same lines?", ["So the next watch would have the important facts together.", "She had run out of pages.", "She wanted to hide the trade.", "The pencil only worked for one line."], 0, "The log says why she put them together.", "She did not want anything important to be forgotten.", "read", { kind: "infer", passage: LOG_TEXT }),
        item("vocab", "level", "In this log, a mooring is…", ["a place to tie up a boat", "a kind of storm cloud", "a fish that lives in a well", "a coin used at the market"], 0, "She reaches the mooring at the end of the trip.", "The boat arrives and is tied up, so a mooring is that place.", "read", { kind: "vocab", passage: LOG_TEXT }),
        item("reading", "stretch", "What is the tone of this log?", ["Careful and calm.", "Angry and rushed.", "Silly and teasing.", "Frightened and lost."], 0, "How does Mara sound while she works?", "She slows down, writes clearly, and calls the voyage careful and kind.", "read", { kind: "tone", passage: LOG_TEXT })
      ]
    }
  };

  function startAct(id) {
    const pack = ACT[id];
    if (!pack) return { ok: false, reason: "missing" };
    const qs = pack.qs.map((q) => Object.assign({}, q, { passage: pack.passage || q.passage }));
    act = { id, qs, i: 0, misses: 0, passage: pack.passage || "" };
    openMode("act");
    return { ok: true, total: qs.length, id, skills: qs.map((q) => q.kind || q.skill) };
  }
  function loreFor(id) {
    const text = LORE[id];
    if (!text) return null;
    const pack = {
      harbor: ["Home harbor asks a captain to look, count, and then move.", "Children sell lemonade on the pier.", "Harbors are busy.", "The lighthouse was dark all afternoon."],
      turtle: ["Turtle Cove is a place for watching nests, not for landing on them.", "Mara counted tracks in the sand.", "Turtles live in the sea.", "She started the motor beside the nest."],
      parrot: ["Parrot Palms is for looking and listening, and for leaving the shells where they are.", "A parrot said the word rope.", "Birds can be loud.", "Mara fed the parrots from her hand."],
      pirate: ["Pirate Point is where careful measuring turns into rooms a captain can walk through.", "Most pirates spent what they earned.", "Islands have beaches.", "The hidden door was already a finished castle."],
      lighthouse: ["The lighthouse keeps its promise only if someone climbs, lights the lamp, and writes the log.", "The tower has a spiral stair.", "Bricks are red.", "The beam pointed into the palms."]
    }[id];
    const infer = {
      harbor: ["A captain who skips the buoy count may have to turn back.", "Lemonade is required before every trip.", "The red buoy is the safe side.", "Sunset unties every knot."],
      turtle: ["A bright lamp on the beach could lead the hatchlings the wrong way.", "Mara took a baby turtle onto the boat.", "The fence was built to block the water.", "Tracks mean the cove has no nests."],
      parrot: ["Feeding the parrots would change how they find their own fruit.", "Mara filled her pockets with shells.", "The path was underwater.", "The parrot refused every word."],
      pirate: ["Mara will use her measurements when she builds the next room.", "She dug up a real chest that afternoon.", "The lookout faces only the rock.", "A pool does not need depth."],
      lighthouse: ["On a moonless night, the step count would still help her climb down.", "She left the lamp dark on purpose.", "The log was blank at the end.", "The beam was aimed at the palms."]
    }[id];
    const detail = {
      harbor: ["A green buoy marks the safe side of the channel.", "The red buoy is the safe side.", "The crew skips the tank check.", "The log is written after the cup, never before."],
      turtle: ["Baby turtles follow the brightest path toward the sea.", "Mara moved a nest into the boat.", "The pier lights should shine on the sand.", "She counted no tracks at all."],
      parrot: ["Mara left all twelve shells under the tree.", "She brought a bag of food up the path.", "The shells were a buried chest.", "The bow line did not matter."],
      pirate: ["A pool plan needs length, width, and depth.", "The X always marks a real hole.", "The hidden door is a finished hall.", "The lookout cannot see the bay."],
      lighthouse: ["Mara signed that the lamp was lit and the channel was clear.", "The beam pointed into the palms.", "She ran up the stairs with both hands free.", "A dark lamp is safe on a clear evening."]
    }[id];
    const ask = (prompt, choices) => ({ prompt, choices, answer: 0 });
    return {
      id, text, words: wordCount(text),
      title: { harbor: "Home Harbor", turtle: "Turtle Cove", parrot: "Parrot Palms", pirate: "Pirate Point", lighthouse: "The Lighthouse" }[id],
      main: ask("What is the main idea?", pack),
      detail: ask("Which detail is in the story?", detail),
      infer: ask("What can you tell that the story does not say outright?", infer)
    };
  }
  function openLore(id) {
    loreId = LORE[id] ? id : loreId;
    const story = loreFor(loreId);
    const qs = ["main", "detail", "infer"].map((kind) => item("reading", "level", story[kind].prompt, story[kind].choices, 0, "Look back at the story.", story.text, "read", { kind, passage: story.text }));
    act = { id: "lore", loreId, qs, i: 0, misses: 0, passage: story.text, title: story.title };
    openMode("act");
    return { ok: true, total: 3, words: story.words, id: loreId };
  }

  function cardHtml() {
    const pause = pausedFrom
      ? `<div id="learn-pause" class="show"><div><h2>Paused</h2><p>The lesson is waiting.</p><button id="learn-resume">Keep going</button><button class="ghost" id="learn-exit">Exit</button></div></div>`
      : `<div id="learn-pause"></div>`;
    if (mode === "tutor" && tutor) {
      if (tutor.phase === "practice") {
        const q = tutor.practice;
        return `<header><h2><span class="learn-ico">✎</span>Try one like it</h2><button class="ghost" id="learn-exit">Exit</button></header><p>${esc(SKILL_NAME[tutor.skill] || tutor.skill)}. This practice does not change your coins.</p><p class="learn-prompt">${esc(q.prompt)}</p>${qVisual(q)}<div class="learn-choices">${choiceButtons(q, "tutor")}</div>${pause}`;
      }
      const step = tutor.steps[tutor.step];
      const visual = step.visual === "read"
        ? `<div class="learn-visual"><p>Look here: <mark class="learn-hit">${esc(tutor.hit)}</mark></p></div>`
        : visualHtml(step.visual, step.n, 0.75);
      const skip = tutor.step >= 1 ? `<button id="learn-skip" class="ghost">Skip</button>` : "";
      return `<header><h2><span class="learn-ico">✎</span>Let's learn it</h2><button class="ghost" id="learn-exit">Exit</button></header><p>Step ${tutor.step + 1} of ${tutor.steps.length}. The first miss is a lesson, not a scolding.</p><p class="learn-prompt">${esc(step.say)}</p>${visual}<button id="learn-next">${tutor.step === tutor.steps.length - 1 ? "Practice" : "Next"}</button>${skip}${pause}`;
    }
    if (mode === "parent") {
      const info = progress();
      const rows = info.rows.length ? info.rows.map((r) => `<div><b>${esc(SKILL_NAME[r.skill] || r.skill)}</b> — ${r.acc}% of ${r.n}</div>`).join("") : "<p>No answers yet.</p>";
      const weak = info.weak.length ? info.weak.map((r, i) => `<div>${i + 1}. ${esc(SKILL_NAME[r.skill] || r.skill)} (${r.acc}%, ${r.n} tries)</div>`).join("") : "<p>No weak spots yet. A skill is weak only under 80% with at least 2 tries.</p>";
      return `<header><h2><span class="learn-ico">★</span>Progress</h2><button class="ghost" id="learn-exit">Exit</button></header><p>${esc(VER)}</p><p>Time played: ${Math.round(info.playMs / 60000)} min. Daily streak: ${info.streak}.</p><p><b>Weakest skills</b></p>${weak}<p><b>Accuracy</b></p>${rows}${pause}`;
    }
    if (mode === "menu") {
      const buttons = [["daily", "Daily Three"], ["nav", "Navigation"], ["market", "Fish market"], ["blueprint", "Lair blueprints"], ["code", "Treasure codes"], ["log", "Captain's log"], ["lore", "Island stories"], ["winter", "Winter watch"]].map(([id, label]) => `<button data-go="${id}">${label}</button>`).join("");
      const places = Object.keys(LORE).map((id) => `<button data-lore="${id}">${esc(loreFor(id).title)}</button>`).join("");
      return `<header><h2><span class="learn-ico">⚓</span>Lessons</h2><button class="ghost" id="learn-exit">Exit</button></header><p>${esc(VER)}</p><div class="learn-choices">${buttons}${places}</div><p>Hold the treasure coin for 3 seconds to open the progress card.</p>${pause}`;
    }
    if (mode === "winter") {
      return `<header><h2><span class="learn-ico">❄</span>Winter watch</h2><button class="ghost" id="learn-exit">Exit</button></header><p>${winterOn() ? "December 1 to January 6. Snow is falling over the bay. Caps sit on roofs and palm crowns, never on the captain." : "The winter watch waits from December 1 to January 6."}</p>${pause}`;
    }
    const session = mode === "daily" ? daily : mode === "act" ? act : mode === "gate" ? gate : null;
    if (session) {
      const q = session.qs[session.i];
      const title = mode === "daily" ? "Daily Three" : mode === "gate" ? (gate.name || "Build") : (act.title || (ACT[act.id] && ACT[act.id].title) || "Lesson");
      const icon = mode === "daily" ? "☀" : mode === "gate" ? "🏗" : "⚓";
      const step = q ? `Question ${Math.min(session.i + 1, session.qs.length)} of ${session.qs.length}` : "Done";
      const price = mode === "gate" ? `<p>The price stays <b>${gate.price} coins</b>. A perfect first try, with no hint, gives <b>1 coin</b> back.</p>` : "";
      const passage = session.passage && q ? `<div class="learn-story">${esc(session.passage)}</div>` : "";
      const hint = q && q._hint ? `<div class="learn-hint"><b>Hint:</b> ${esc(q._hint)}</div>` : "";
      const hintBtn = mode === "gate" && q && !q._hint ? `<button id="learn-hint" class="ghost">Hint</button>` : "";
      const body = q ? `${passage}<p class="learn-prompt">${esc(q.prompt)}</p>${qVisual(q)}<div class="learn-choices">${choiceButtons(q, "choice")}</div>${hint}${hintBtn}` : "<p>Done for now.</p>";
      return `<header><h2><span class="learn-ico">${icon}</span>${esc(title)}</h2><button class="ghost" id="learn-exit">Exit</button></header><p>${step}</p>${price}${body}${pause}`;
    }
    return "";
  }
  function show() {
    const el = layer();
    const card = el.querySelector("#learn-card");
    card.innerHTML = cardHtml();
    setPlay(!!mode);
    card.onclick = (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.id === "learn-exit") { tutor = null; resumeMode = null; gate = null; daily = null; act = null; closePlay(); return; }
      if (b.id === "learn-resume") { mode = pausedFrom; pausedFrom = null; show(); return; }
      if (b.id === "learn-skip") { tutorSkip(); return; }
      if (b.id === "learn-next") { tutorAdvance(); return; }
      if (b.id === "learn-hint" && gate) {
        const q = gate.qs[gate.i];
        if (q) { q._hint = q.hint; gate.hinted = 1; show(); }
        return;
      }
      if (b.dataset.tutor != null && tutor && tutor.phase === "practice") {
        endTutor(+b.dataset.tutor === tutor.practice.answer);
        return;
      }
      if (b.dataset.choice != null && !pausedFrom) answer(+b.dataset.choice);
      if (b.dataset.go) {
        const id = b.dataset.go;
        if (id === "daily") startDaily();
        else if (id === "winter") openWinter();
        else if (id === "lore") openLore(loreId);
        else startAct(id);
        return;
      }
      if (b.dataset.lore) openLore(b.dataset.lore);
    };
  }
  function openMode(next) { mode = next; pausedFrom = null; show(); }
  function openWinter() {
    drawWinter();
    openMode("winter");
    return { ok: true, winter: winterOn() };
  }
  function openPlay(name) {
    if (name === "daily") return startDaily();
    if (name === "winter") return openWinter();
    if (name === "lore") return openLore(loreId);
    if (name === "menu") { openMode("menu"); return { ok: true, mode: "menu" }; }
    if (ACT[name]) return startAct(name);
    return { ok: false, reason: "missing" };
  }

  let bits = [];
  function celebrate(text) {
    const el = document.getElementById("v50-cheer") || document.body.appendChild(Object.assign(document.createElement("div"), { id: "v50-cheer" }));
    el.innerHTML = `<div>⚓</div><div>${esc(text || "Aye, Captain!")}</div>`;
    el.classList.add("show");
    later(2200, () => el.classList.remove("show"));
    const canvas = document.getElementById("v50-confetti");
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      bits = Array.from({ length: 70 }, () => ({
        x: canvas.width * 0.5 + (Math.random() - 0.5) * 80,
        y: canvas.height * 0.2,
        vx: (Math.random() - 0.5) * 6,
        vy: 2 + Math.random() * 3,
        c: ["#ffc83d", "#00a7a0", "#e23d3d", "#ffffff", "#7ec8ff"][Math.floor(Math.random() * 5)],
        life: 70
      }));
    }
    if (quiet()) return { ok: true, quiet: true };
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return { ok: true };
      const ctx = new Ctx();
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        gain.gain.value = 0.03;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + 0.2 + i * 0.08);
      });
    } catch (err) { /* no audio */ }
    return { ok: true, quiet: false };
  }
  function drawBits() {
    const canvas = document.getElementById("v50-confetti");
    if (!canvas) return;
    const g = canvas.getContext("2d");
    if (!bits.length) { if (canvas.width) g.clearRect(0, 0, canvas.width, canvas.height); return; }
    g.clearRect(0, 0, canvas.width, canvas.height);
    bits.forEach((b) => {
      b.x += b.vx; b.y += b.vy; b.vy += 0.08; b.life -= 1;
      g.globalAlpha = Math.max(0, b.life / 70);
      g.fillStyle = b.c;
      g.fillRect(b.x, b.y, 7, 10);
    });
    g.globalAlpha = 1;
    bits = bits.filter((b) => b.life > 0);
  }

  function winterOn(iso) {
    const day = iso || today();
    const month = +day.slice(5, 7);
    const date = +day.slice(8, 10);
    return month === 12 || (month === 1 && date <= 6);
  }
  function kit() { return CA.gfxKit; }
  function clearNamed(prefix) {
    if (!CA.scene) return;
    const gone = [];
    CA.scene.traverse((o) => { if (o.name && o.name.indexOf(prefix) === 0) gone.push(o); });
    gone.forEach((o) => { if (o.parent) o.parent.remove(o); });
  }
  function drawWinter() {
    const ban = document.getElementById("winter-banner");
    if (ban) ban.classList.toggle("show", winterOn());
    if (!winterOn() || !kit() || !CA.scene) { clearNamed("v50-snow"); clearNamed("v50-cap"); return; }
    if (CA.scene.getObjectByName("v50-snow")) return;
    const K = kit();
    const count = 160;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = 2 + Math.random() * 18;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    const geo = new K.Geo();
    geo.setAttribute("position", new K.Attr(pos, 3));
    const dot = document.createElement("canvas");
    dot.width = dot.height = 32;
    const g = dot.getContext("2d");
    const grd = g.createRadialGradient(16, 16, 2, 16, 16, 15);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.beginPath();
    g.arc(16, 16, 15, 0, Math.PI * 2);
    g.fill();
    const tex = new K.CanvasTex(dot);
    const mat = new K.PointsMat({ color: 0xffffff, size: 0.45, map: tex, transparent: true, depthWrite: false, sizeAttenuation: true });
    const pts = new K.Points(geo, mat);
    pts.name = "v50-snow";
    pts.frustumCulled = false;
    CA.scene.add(pts);
    snowCaps();
  }
  function snowCaps() {
    const K = kit();
    if (!K || CA.scene.getObjectByName("v50-cap")) return;
    let n = 0;
    const list = [];
    CA.scene.updateMatrixWorld(true);
    CA.scene.traverse((o) => { if (o.isMesh && o.geometry) list.push(o); });
    list.forEach((o) => {
      if (n > 28) return;
      try { capOne(o); } catch (err) { /* skip a mesh that has no bounds */ }
    });
    function capOne(o) {
      let parent = o.parent, onCaptain = false;
      while (parent) {
        if (parent === CA.captain) onCaptain = true;
        parent = parent.parent;
      }
      if (onCaptain) return;
      if (!o.geometry.boundingBox && o.geometry.computeBoundingBox) o.geometry.computeBoundingBox();
      const bb = o.geometry.boundingBox;
      if (!bb) return;
      const ws = new K.Vector3(1, 1, 1);
      if (o.getWorldScale) o.getWorldScale(ws);
      const sx = Math.abs(bb.max.x - bb.min.x) * Math.abs(ws.x || 1);
      const sy = Math.abs(bb.max.y - bb.min.y) * Math.abs(ws.y || 1);
      const sz = Math.abs(bb.max.z - bb.min.z) * Math.abs(ws.z || 1);
      const palmish = sy > 2.4 && sy < 8 && sx < 2.4 && sz < 2.4;
      const roof = /lair|tower|roof|lh-/i.test(String(o.name || "") + String(o.parent && o.parent.name || "")) && sy > 0.4 && sy < 6 && Math.max(sx, sz) < 5;
      if (!palmist && !roof) return;
      const r = Math.max(0.18, Math.min(0.55, Math.min(sx, sz, sy) * 0.28));
      const cap = new K.Mesh(new K.Sphere(r, 10, 8), new K.Lambert({ color: 0xf4f7ff }));
      cap.scale.y = 0.45;
      const wp = new K.Vector3();
      o.getWorldPosition(wp);
      if (CA.captain && wp.distanceTo(CA.captain.position) < 1.4) return;
      cap.position.set(wp.x, wp.y + sy * 0.45, wp.z);
      cap.name = "v50-cap";
      CA.scene.add(cap);
      n += 1;
    }
  }
  function dress() {
    const K = kit();
    if (!K || !CA.scene || CA.scene.getObjectByName("v50-gfx")) return;
    const root = new K.Group();
    root.name = "v50-gfx";
    CA.scene.add(root);
    gfx = { root, wakes: [] };
    const waterY = typeof CA.waterY === "number" ? CA.waterY : -0.55;
    const foamMat = new K.Lambert({ color: 0xf7fbff, transparent: true, opacity: 0.92 });
    function foam(cx, cz, radius) {
      if (!(radius > 2)) return;
      const ring = new K.Mesh(new K.Torus(radius, 0.16, 6, 64), foamMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(cx, waterY + 0.2, cz);
      ring.name = "v50-foam";
      root.add(ring);
    }
    foam(0, 0, 24.15);
    [[0, -62.5], [44.2, -44.2], [62.5, 0], [44.2, 44.2], [0, 62.5], [-44.2, 44.2], [-62.5, 0], [-44.2, -44.2]].forEach(([x, z]) => foam(x, z, 17.7));
    (CA.isl && CA.isl.L || []).forEach((isle) => foam(isle.cx, isle.cz, (isle.R || 18) + 0.45));
    const rockMat = new K.Lambert({ color: 0xb7b1a6 });
    const grassMat = new K.Lambert({ color: 0x3f9d45 });
    (CA.isl && CA.isl.L || []).forEach((isle) => {
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        const rad = (isle.R || 16) * (0.45 + (i % 2) * 0.15);
        const rock = new K.Mesh(new K.Sphere(0.28 + (i % 3) * 0.08, 8, 6), rockMat);
        rock.scale.set(1.1, 0.62, 0.9);
        rock.position.set(isle.cx + Math.cos(a) * rad, 0.35, isle.cz + Math.sin(a) * rad);
        rock.name = "v50-rock";
        root.add(rock);
      }
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const rad = (isle.R || 16) * 0.62;
        const tuft = new K.Mesh(new K.Cone(0.12, 0.38, 5), grassMat);
        tuft.position.set(isle.cx + Math.cos(a) * rad, 0.2, isle.cz + Math.sin(a) * rad);
        tuft.name = "v50-grass";
        root.add(tuft);
      }
    });
    CA.scene.traverse((o) => {
      if (!o.isMesh || !o.material || !o.material.normalMap || !o.geometry || !o.geometry.parameters) return;
      if ((o.geometry.parameters.width || 0) < 400) return;
      o.material.normalMap.repeat.set(18, 18);
      if (o.material.normalScale) o.material.normalScale.set(0.1, 0.1);
      if (o.material.shininess) o.material.shininess = 24;
      if (o.material.color) o.material.color.set("#217fc4");
    });
    const shell = CA.scene.getObjectByName("lair-shell");
    if (shell && shell.material) {
      const c = document.createElement("canvas");
      c.width = 128; c.height = 128;
      const g = c.getContext("2d");
      g.fillStyle = "#d9c4a2";
      g.fillRect(0, 0, 128, 128);
      g.strokeStyle = "#b89a72";
      g.lineWidth = 3;
      for (let y = 8; y < 128; y += 32) {
        for (let x = (y / 32) % 2 ? -16 : 8; x < 128; x += 40) {
          g.strokeRect(x, y, 34, 22);
          g.fillStyle = (x + y) % 2 ? "#e6d3b0" : "#cbb892";
          g.fillRect(x + 2, y + 2, 30, 18);
        }
      }
      const tex = new K.CanvasTex(c);
      tex.wrapS = tex.wrapT = 1000;
      tex.repeat.set(3, 2);
      const mat = shell.material.clone();
      mat.map = tex;
      mat.color && mat.color.set("#ffffff");
      shell.material = mat;
      const lair = CA.scene.getObjectByName("pirate-lair");
      if (lair) lair.traverse((mesh) => {
        if (!mesh.isMesh || mesh === shell || !mesh.material || !mesh.material.color || !mesh.material.clone) return;
        const col = mesh.material.color;
        if (!(col.r > 0.55 && col.r > col.b && col.g > 0.4)) return;
        if (!mesh.geometry.boundingBox && mesh.geometry.computeBoundingBox) mesh.geometry.computeBoundingBox();
        const bb = mesh.geometry.boundingBox;
        if (!bb) return;
        const span = Math.max(bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z);
        if (span < 1.2) return;
        const next = mesh.material.clone();
        next.map = tex;
        next.color.set("#ffffff");
        mesh.material = next;
      });
    }
    CA.scene.traverse((o) => {
      if (!o.isLight) return;
      if (o.isDirectionalLight && o.intensity) { o.color && o.color.set("#ffe0b0"); o.intensity = Math.min(o.intensity, 1.35); }
      if (o.isHemisphereLight) { o.color && o.color.set("#e7f2ff"); o.groundColor && o.groundColor.set("#c6b48a"); }
    });
    if (CA.scene.fog && CA.scene.fog.color) CA.scene.fog.color.set("#d5ecff");
    const wakeGeo = new K.Plane(1.1, 0.45);
    wakeGeo.rotateX(-Math.PI / 2);
    ["motorboat", "yacht", "sailboat"].forEach((id) => {
      const veh = CA.VEH && CA.VEH[id];
      if (!veh || !veh.obj) return;
      for (let i = 0; i < 7; i++) {
        const m = new K.Mesh(wakeGeo, new K.Basic({ color: 0xffffff, transparent: true, opacity: 0.55 - i * 0.07, depthWrite: false }));
        m.name = "v50-wake";
        m.renderOrder = 2;
        root.add(m);
        gfx.wakes.push({ mesh: m, id, i });
      }
    });
  }
  function moveWakes() {
    if (!gfx || !CA.VEH) return;
    const waterY = typeof CA.waterY === "number" ? CA.waterY : -0.55;
    gfx.wakes.forEach((w) => {
      const veh = CA.VEH[w.id];
      if (!veh || !veh.obj) return;
      const yaw = veh.yaw || veh.obj.rotation.y || 0;
      const fx = Math.sin(yaw), fz = Math.cos(yaw);
      const dist = 1.4 + w.i * 0.85;
      const away = Math.hypot(veh.obj.position.x, veh.obj.position.z);
      w.mesh.visible = !!veh.obj.visible && away > 12;
      w.mesh.position.set(veh.obj.position.x - fx * dist, waterY + 0.22, veh.obj.position.z - fz * dist);
      w.mesh.rotation.y = -yaw;
      const moving = Math.abs(veh.v || 0) > 0.2;
      w.mesh.scale.set(moving ? 1.3 : 0.85, 1, moving ? 1 : 0.7);
    });
  }
  function fallSnow(step) {
    const snow = CA.scene && CA.scene.getObjectByName("v50-snow");
    if (!snow || !snow.geometry) return;
    const arr = snow.geometry.attributes.position.array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] -= step * 1.6;
      arr[i] += Math.sin(clockMs / 500 + i) * 0.01;
      if (arr[i + 1] < 0.2) arr[i + 1] = 14 + Math.random() * 6;
    }
    snow.geometry.attributes.position.needsUpdate = true;
  }
  function syncMG() {
    const mg = document.getElementById("mg");
    const on = !!(mg && !mg.classList.contains("hidden"));
    document.body.classList.toggle("mg-on", on);
    if (!CA.scene) return;
    if (on && !worldHidden) {
      const saved = [];
      CA.scene.traverse((o) => {
        if (o === CA.scene) return;
        saved.push([o, o.visible, o.layers ? o.layers.mask : 1]);
        o.visible = false;
        if (o.layers) o.layers.mask = 0;
      });
      worldHidden = saved;
    } else if (!on && worldHidden) {
      worldHidden.forEach(([o, vis, mask]) => {
        o.visible = vis;
        if (o.layers) o.layers.mask = mask;
      });
      worldHidden = null;
    }
  }
  function onKey(e) {
    if (e.key !== "Escape" || !mode) return;
    e.preventDefault();
    e.stopPropagation();
    if (pausedFrom) { mode = pausedFrom; pausedFrom = null; }
    else pausedFrom = mode;
    show();
  }
  function ui() {
    css();
    layer();
    const hud = document.getElementById("hud");
    if (hud && !document.getElementById("ver-flag")) {
      const flag = document.createElement("div");
      flag.id = "ver-flag";
      flag.textContent = VER;
      hud.appendChild(flag);
    }
    if (!document.getElementById("learn-open")) {
      const b = document.createElement("button");
      b.id = "learn-open";
      b.type = "button";
      b.textContent = "Lessons";
      b.onclick = () => openPlay("menu");
      (hud || document.body).appendChild(b);
    }
    const settings = document.getElementById("settings");
    if (settings && !document.getElementById("learn-daily-btn")) {
      const dailyBtn = document.createElement("button");
      dailyBtn.id = "learn-daily-btn";
      dailyBtn.className = "btn small";
      dailyBtn.textContent = "Daily Three";
      dailyBtn.onclick = () => startDaily();
      settings.appendChild(dailyBtn);
    }
    const score = document.getElementById("hud-score");
    if (score && !score.dataset.v50hold) {
      score.dataset.v50hold = "1";
      score.style.pointerEvents = "auto";
      score.addEventListener("pointerdown", (e) => { e.preventDefault(); holding = true; holdMs = 0; });
      const stop = () => { if (holdMs < 3000) { holding = false; holdMs = 0; } };
      score.addEventListener("pointerup", stop);
      score.addEventListener("pointerleave", stop);
    }
    const title = document.querySelector("#intro h1");
    if (title) title.textContent = "⚓ " + VER;
  }
  function tick(dt) {
    const step = Math.max(0, Math.min(0.05, dt || 0));
    clockMs += step * 1000;
    if (!document.hidden && step) bag().playMs += step * 1000;
    if (holding) {
      holdMs += step * 1000;
      if (holdMs >= 3000) { holding = false; holdMs = 0; openParent(); }
    }
    const dueJobs = pending.filter((job) => job.at <= clockMs);
    if (dueJobs.length) {
      const keep = pending.filter((job) => job.at > clockMs);
      pending.length = 0;
      keep.forEach((job) => pending.push(job));
      dueJobs.forEach((job) => job.fn());
    }
    drawBits();
    try { syncMG(); } catch (err) { /* leave the world as it is */ }
    try { moveWakes(); fallSnow(step); } catch (err) { /* a missing boat is skipped */ }
    const cam = CA.camera;
    const cap = CA.captain;
    if (cam && cap && CA.mode === "walk" && !mode) {
      const dx = cam.position.x - cap.position.x;
      const dy = cam.position.y - (cap.position.y + 1.4);
      const dz = cam.position.z - cap.position.z;
      const dist = Math.hypot(dx, dy, dz);
      if (dist < 1.1 && dist > 0) {
        const k = 3.2 / dist;
        cam.position.set(cap.position.x + dx * k, cap.position.y + 1.4 + dy * k, cap.position.z + dz * k);
      }
    }
  }
  function loop(now) {
    const dt = lastNow ? (now - lastNow) / 1000 : 0;
    lastNow = now;
    try { tick(dt); } catch (err) { /* keep the frame going */ }
    requestAnimationFrame(loop);
  }

  document.addEventListener("keydown", onKey, true);
  ui();
  bag();
  try { dress(); } catch (err) { gfx = gfx || { error: String(err && err.message || err) }; }
  try { drawWinter(); } catch (err) { /* winter can wait for a date override */ }
  requestAnimationFrame(loop);

  const api = {
    VER, BUILD_SKILL, SKILL_NAME, BANK,
    needsGate: (id) => !!(BUILD_SKILL[id] && !bag().passed[id] && !bag().ready[id]),
    openGate, startDaily, answer, hold, progress,
    setDate: (iso) => { clockDate = iso; try { drawWinter(); } catch (err) { /* ignore */ } },
    play: openPlay,
    today, addPlay: (ms) => { bag().playMs += ms; persist(); },
    record: (skill, ok) => { record(mapSkill(skill), !!ok); persist(); },
    setQuiet: (q) => { bag().quiet = !!q; persist(); },
    quiet, later, bag: () => bag(), due: () => bag().due.slice(),
    gate: {
      current: () => (gate && gate.qs[gate.i]) || null,
      index: () => gate ? gate.i : -1,
      misses: () => gate ? gate.misses : 0,
      answer
    },
    daily: {
      current: () => (daily && daily.qs[daily.i]) || null,
      answer,
      status: () => ({ day: bag().daily.day, done: bag().daily.done, streak: bag().daily.streak, paid: bag().daily.paid })
    },
    parent: { hold, open: openParent, card: progress },
    tutorial: {
      open: openTutorial,
      next: tutorAdvance,
      skip: tutorSkip,
      state: () => tutor ? { skill: tutor.skill, step: tutor.step, steps: tutor.steps.length, phase: tutor.phase, skippable: tutor.step >= 1, hit: tutor.hit } : null
    },
    onWrong: openTutorial,
    lore: loreFor,
    openLore,
    log: { text: LOG_TEXT, words: wordCount(LOG_TEXT), questions: ACT.log.qs },
    activity: (id) => ACT[id] ? { total: ACT[id].qs.length, kinds: ACT[id].qs.map((q) => q.kind || q.skill) } : null,
    winter: {
      on: winterOn,
      draw: drawWinter,
      stats: () => {
        let points = false, cones = 0, onCaptain = 0;
        if (CA.scene) CA.scene.traverse((o) => {
          if (o.name === "v50-snow") points = o.isPoints === true;
          if (o.name === "v50-cap") {
            let p = o.parent;
            while (p) { if (p === CA.captain) onCaptain += 1; p = p.parent; }
          }
          if (o.name && o.name.indexOf("v50-snow") === 0 && o.geometry && o.geometry.type === "ConeGeometry") cones += 1;
        });
        return { on: winterOn(), points, cones, onCaptain };
      }
    },
    celebrate,
    ui: { open: () => !!mode, paused: () => !!pausedFrom },
    tick, advance: (ms) => tick((ms || 0) / 1000),
    wordCount
  };
  CA.learn = api;
  window.CaptainLearn = api;
})();
