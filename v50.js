/* Captain Adventure 5.0 — Learn & Build.
   Direct lair.commit() is unchanged, so older saves and tests keep their prices.
   The Yes button opens a short skill gate first, unless debug includes nogate. */
(function () {
  const CA = window.CaptainAdventure;
  if (!CA || !CA.lair || !CA.state) return;
  const VER = "Captain Adventure 5.0: Learn & Build";

  const BUILD_SKILL = {
    hq: "area", pool: "area", garage: "measure", tower: "measure", trophy: "patterns",
    slide: "area", course: "time", aqua: "fractions", roof: "area", tunnel: "measure"
  };
  const BUILD_THEME = {
    hq: "hq", pool: "pool", garage: "dock", tower: "tower", trophy: "trophy",
    slide: "pool", course: "course", aqua: "aqua", roof: "roof", tunnel: "tunnel"
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
    item("navigation", "confidence", "A chart route goes 5 squares east, then 3 squares north, then 2 squares east. How many squares do you travel along the route?", ["10 squares", "8 squares", "5 squares", "7 squares"], 0, "Add every leg. Do not cut across.", "5 + 3 + 2 = 10 squares along the route.", "route", { legs: [{ n: 5, dir: "east" }, { n: 3, dir: "north" }, { n: 2, dir: "east" }], caption: "Add the labeled legs.", audit: { op: "add", inputs: [5, 3, 2], value: 10 }, theme: "nav" }),
    item("navigation", "level", "The boat sails at 12 knots for 2.5 hours. How far does it go?", ["30 nautical miles", "24 nautical miles", "14.5 nautical miles", "300 nautical miles"], 0, "Distance = speed × time. 2.5 is 2 and a half.", "12 × 2 = 24, and 12 × 0.5 = 6, so 24 + 6 = 30.", "hours", { hours: 2.5, speed: 12, caption: "12 knots for 2.5 hours.", audit: { op: "mul", inputs: [12, 2.5], value: 30 }, theme: "nav" }),
    item("navigation", "level", "You face north. You turn 90 degrees clockwise, then 90 degrees clockwise again. Which way do you face?", ["South", "East", "West", "North"], 0, "Each turn is a quarter turn to the right.", "North to east is one turn. East to south is the second turn.", "compass", { turns: 2, caption: "Two quarter-turns clockwise from north.", audit: { op: "heading", value: "South" }, theme: "nav" }),
    item("navigation", "stretch", "On the chart, 1 cm stands for 3 miles. A channel is drawn 4.5 cm long. How many miles is the real channel?", ["13.5 miles", "7.5 miles", "12 miles", "4.5 miles"], 0, "Multiply the drawing length by the scale.", "4 × 3 = 12, and 0.5 × 3 = 1.5, so 12 + 1.5 = 13.5.", "scale", { caption: "1 cm = 3 miles. The drawing is 4.5 cm.", audit: { op: "mul", inputs: [4.5, 3], value: 13.5 }, theme: "nav" }),

    item("money", "confidence", "You buy 3 fish at $2.45 each and pay with $10. How much change do you get?", ["$2.65", "$7.35", "$5.10", "$2.55"], 0, "Find the cost of 3 fish, then subtract from $10.", "3 × $2.45 = $7.35. $10.00 − $7.35 = $2.65.", "market", { fish: 3, coins: 0, caption: "Three tags say $2.45. You pay with a $10 bill.", audit: { op: "change", price: 2.45, count: 3, paid: 10, value: 2.65 }, theme: "market" }),
    item("money", "level", "A stand sells 4 fish for $3.00 or 6 fish for $4.20. Which is the lower price per fish?", ["6 fish for $4.20", "4 fish for $3.00", "They are the same price per fish", "4 fish, because $3.00 is less than $4.20"], 0, "Divide each price by the number of fish.", "$3.00 ÷ 4 = $0.75. $4.20 ÷ 6 = $0.70. The pack of 6 costs less per fish.", "tags", { caption: "4 for $3.00, or 6 for $4.20.", audit: { op: "unit", aCount: 4, aPrice: 3, bCount: 6, bPrice: 4.2, cheaper: 6 }, theme: "market" }),
    item("money", "stretch", "The crew kept 2/5 of a catch of 30 fish and sold the rest. How many fish did they keep?", ["12 fish", "15 fish", "10 fish", "6 fish"], 0, "Find 1/5 of 30, then take 2 of those parts.", "30 ÷ 5 = 6, and 2 × 6 = 12.", "bars", { n: 2, caption: "2 of 5 equal parts of 30 fish.", audit: { op: "frac", num: 2, den: 5, whole: 30, value: 12 }, theme: "market" }),

    item("area", "confidence", "The secret room on the plan is 9 ft long and 6 ft wide. What is its area?", ["54 square feet", "15 square feet", "45 square feet", "96 square feet"], 0, "Area = length × width.", "9 × 6 = 54.", "labeled", { len: "9 ft", wid: "6 ft", caption: "Use the side labels. There is no grid to count.", audit: { op: "mul", inputs: [9, 6], value: 54 }, theme: "hq" }),
    item("area", "level", "That same room is 9 ft long and 6 ft wide. What is its perimeter?", ["30 feet", "54 feet", "15 feet", "27 feet"], 0, "Perimeter adds all four sides.", "9 + 6 + 9 + 6 = 30.", "labeled", { len: "9 ft", wid: "6 ft", caption: "Add both lengths and both widths.", audit: { op: "add", inputs: [9, 6, 9, 6], value: 30 }, theme: "hq" }),
    item("area", "level", "An L-shaped deck is a 10 ft by 8 ft rectangle with a 4 ft by 3 ft rectangle removed. What area is left?", ["68 square feet", "80 square feet", "12 square feet", "25 square feet"], 0, "Find the big rectangle, then subtract the corner that was cut away.", "10 × 8 = 80. 4 × 3 = 12. 80 − 12 = 68.", "labeled", { len: "10 ft", wid: "8 ft", caption: "Big rectangle 10 by 8, corner 4 by 3 removed.", audit: { op: "lshape", big: [10, 8], cut: [4, 3], value: 68 }, theme: "hq" }),
    item("area", "stretch", "The plan uses 1 inch = 4 feet. The pool is drawn 3.5 inches long. How long is the real pool?", ["14 feet", "7.5 feet", "12 feet", "16 feet"], 0, "Multiply the drawing length by 4 feet per inch.", "3.5 × 4 = 14.", "scale", { caption: "1 inch = 4 feet. The drawing is 3.5 inches.", audit: { op: "mul", inputs: [3.5, 4], value: 14 }, theme: "pool" }),
    item("area", "confidence", "The pool is 8 ft long and 5 ft wide. What is the area of the water?", ["40 square feet", "13 square feet", "26 square feet", "85 square feet"], 0, "Multiply length by width.", "8 × 5 = 40.", "labeled", { len: "8 ft", wid: "5 ft", caption: "Pool length 8 ft, width 5 ft.", audit: { op: "mul", inputs: [8, 5], value: 40 }, theme: "pool" }),
    item("area", "level", "The pool is 8 ft long, 5 ft wide, and 2 ft deep. How many cubic feet of water fill it?", ["80 cubic feet", "40 cubic feet", "15 cubic feet", "16 cubic feet"], 0, "Volume = length × width × depth.", "8 × 5 = 40, and 40 × 2 = 80.", "labeled", { len: "8 ft", wid: "5 ft", caption: "Depth is 2 ft. Do not stop after the floor area.", audit: { op: "mul", inputs: [8, 5, 2], value: 80 }, theme: "pool" }),
    item("money", "stretch", "Filling the pool costs $1.25 per cubic foot. The pool holds 80 cubic feet. What is the water bill?", ["$100", "$81.25", "$64", "$125"], 0, "Multiply the volume by the price of one cubic foot.", "80 × $1.25 = $100.", "tags", { caption: "$1.25 for each of 80 cubic feet.", audit: { op: "mul", inputs: [80, 1.25], value: 100 }, theme: "pool" }),

    item("measure", "confidence", "A dock plank is 3.5 meters. You need 12 meters of planks. How many whole planks do you need at least?", ["4 planks", "3 planks", "15.5 planks", "8.5 planks"], 0, "Divide the length you need by one plank, then round up.", "12 ÷ 3.5 is a little more than 3, so 4 planks.", "line", { caption: "Each plank is 3.5 m. You need 12 m.", audit: { op: "ceil-div", inputs: [12, 3.5], value: 4 }, theme: "dock" }),
    item("measure", "level", "The dock is 18 feet long. How many yards is that? (3 feet = 1 yard)", ["6 yards", "54 yards", "15 yards", "21 yards"], 0, "Divide feet by 3.", "18 ÷ 3 = 6.", "line", { caption: "18 feet. 3 feet make 1 yard.", audit: { op: "div", inputs: [18, 3], value: 6 }, theme: "dock" }),
    item("measure", "stretch", "1 meter = 100 centimeters. A rope is 2.4 meters. How many centimeters is that?", ["240 cm", "24 cm", "2.4 cm", "204 cm"], 0, "Multiply the meters by 100.", "2.4 × 100 = 240.", "line", { caption: "2.4 meters, and 1 meter = 100 cm.", audit: { op: "mul", inputs: [2.4, 100], value: 240 }, theme: "dock" }),
    item("measure", "level", "The passage is 46 meters. You have already walked 19 meters. How much is left?", ["27 meters", "65 meters", "25 meters", "37 meters"], 0, "Subtract the distance already walked.", "46 − 19 = 27.", "line", { caption: "46 m passage, 19 m already walked.", audit: { op: "sub", inputs: [46, 19], value: 27 }, theme: "tunnel" }),
    item("measure", "stretch", "The tunnel plan says 1 cm = 2 meters. The drawing is 7.5 cm. How long is the real tunnel?", ["15 meters", "9.5 meters", "14 meters", "7.5 meters"], 0, "Multiply the drawing by 2 meters per centimeter.", "7.5 × 2 = 15.", "scale", { caption: "1 cm = 2 m. The line is 7.5 cm.", audit: { op: "mul", inputs: [7.5, 2], value: 15 }, theme: "tunnel" }),
    item("measure", "confidence", "A ladder to the lookout is 24 feet. The first landing is 9 feet up. How much higher is the top?", ["15 feet", "33 feet", "13 feet", "216 feet"], 0, "Subtract the landing from the full height.", "24 − 9 = 15.", "line", { caption: "Tower ladder 24 ft. Landing at 9 ft.", audit: { op: "sub", inputs: [24, 9], value: 15 }, theme: "tower" }),
    item("measure", "level", "On the tower drawing, 1 inch = 6 feet. The tower is drawn 4.5 inches tall. How tall is the real tower?", ["27 feet", "10.5 feet", "24 feet", "4.5 feet"], 0, "Multiply the drawing height by 6.", "4.5 × 6 = 27.", "scale", { caption: "1 inch = 6 feet. The drawing is 4.5 inches tall.", audit: { op: "mul", inputs: [4.5, 6], value: 27 }, theme: "tower" }),
    item("measure", "stretch", "From the gallery you can see 2.5 miles. How many feet is that? (1 mile = 5,280 feet)", ["13,200 feet", "5,282.5 feet", "2,112 feet", "7,780 feet"], 0, "Multiply 2.5 by 5,280.", "2 × 5,280 = 10,560, and 0.5 × 5,280 = 2,640. Together that is 13,200.", "line", { caption: "2.5 miles. 1 mile = 5,280 feet.", audit: { op: "mul", inputs: [2.5, 5280], value: 13200 }, theme: "tower" }),

    item("patterns", "confidence", "A code starts at 4. Each step does ×2, then +1. The list is 4, 9, 19, 39, ___. What comes next?", ["79", "78", "40", "41"], 0, "Do both parts of the rule, in order.", "39 × 2 = 78, then 78 + 1 = 79.", "code", { groups: [4, 9, 19, 39], caption: "Rule: ×2, then +1. The next number is not printed.", audit: { op: "rule", start: 4, mul: 2, add: 1, steps: 4, value: 79 }, theme: "trophy" }),
    item("patterns", "level", "In 472,815.36, what is the value of the digit 7?", ["70,000", "7,000", "700,000", "70"], 0, "Find the place. The 7 is in the ten-thousands place.", "472,815.36 has 4 hundred-thousands and 7 ten-thousands. The 7 means 70,000.", "blocks", { caption: "472,815.36", audit: { op: "place", value: 70000 }, theme: "trophy" }),
    item("patterns", "stretch", "Round 6,482 to the nearest hundred.", ["6,500", "6,400", "6,480", "7,000"], 0, "Look at the tens digit to decide the hundreds.", "The tens digit is 8, so 6,482 rounds up to 6,500.", "line", { caption: "6,482 to the nearest hundred.", audit: { op: "round", value: 6500 }, theme: "trophy" }),
    item("patterns", "level", "3_6 + 128 = 474. What is the missing digit?", ["4", "5", "3", "8"], 0, "Subtract to find the first number, then read the blank.", "474 − 128 = 346, so the missing digit is 4.", "line", { caption: "3 _ 6 + 128 = 474", audit: { op: "digit", value: 4 }, theme: "trophy" }),

    item("time", "confidence", "The course drill starts at 2:15 and lasts 40 minutes. When does it end?", ["2:55", "3:05", "2:45", "3:15"], 0, "Add 40 minutes to 2:15.", "2:15 + 40 minutes = 2:55.", "line", { caption: "Start 2:15. Add 40 minutes.", audit: { op: "clock", value: "2:55" }, theme: "course" }),
    item("time", "level", "Gate practice runs from 1:10 to 1:55. How many minutes is that?", ["45 minutes", "65 minutes", "40 minutes", "55 minutes"], 0, "Count from 1:10 up to 1:55.", "55 − 10 = 45 minutes.", "line", { caption: "From 1:10 to 1:55.", audit: { op: "sub", inputs: [55, 10], value: 45 }, theme: "course" }),
    item("time", "stretch", "Each of 4 gates takes 3.5 minutes, plus a 6-minute warm-up. How long is the whole drill?", ["20 minutes", "14 minutes", "13.5 minutes", "24 minutes"], 0, "Multiply the gates first, then add the warm-up.", "4 × 3.5 = 14, and 14 + 6 = 20.", "line", { caption: "4 gates at 3.5 minutes, then 6 minutes warm-up.", audit: { op: "mul-add", inputs: [4, 3.5, 6], value: 20 }, theme: "course" }),

    item("fractions", "confidence", "The tank holds 30 fish. The sign says 2/5 of them are parrotfish. How many parrotfish is that?", ["12", "15", "10", "6"], 0, "Divide by the bottom, then multiply by the top.", "30 ÷ 5 = 6, and 2 × 6 = 12.", "bars", { caption: "2/5 of 30 fish.", audit: { op: "frac", num: 2, den: 5, whole: 30, value: 12 }, theme: "aqua" }),
    item("data", "level", "The aquarium tally is 14 blue fish and 9 yellow fish. How many more blue fish are there?", ["5", "23", "4", "126"], 0, "Subtract the smaller tally.", "14 − 9 = 5.", "bars", { caption: "14 blue and 9 yellow.", audit: { op: "sub", inputs: [14, 9], value: 5 }, theme: "aqua" }),
    item("data", "stretch", "Each star on the tank chart means 4 fish. The chart shows 6 stars. How many fish?", ["24 fish", "10 fish", "46 fish", "64 fish"], 0, "Six groups of 4.", "6 × 4 = 24.", "bars", { caption: "Each star means 4 fish. There are 6 stars.", audit: { op: "mul", inputs: [6, 4], value: 24 }, theme: "aqua" }),

    item("area", "confidence", "The roof is 12 ft long and 7 ft wide. What is its area?", ["84 square feet", "19 square feet", "74 square feet", "38 square feet"], 0, "Multiply the two sides.", "12 × 7 = 84.", "labeled", { len: "12 ft", wid: "7 ft", caption: "Roof 12 ft by 7 ft.", audit: { op: "mul", inputs: [12, 7], value: 84 }, theme: "roof" }),
    item("area", "level", "A hammock roof is 12 ft by 7 ft. What is the perimeter of that roof?", ["38 feet", "84 feet", "19 feet", "31 feet"], 0, "Add all four sides.", "12 + 7 + 12 + 7 = 38.", "labeled", { len: "12 ft", wid: "7 ft", caption: "Add both lengths and both widths.", audit: { op: "add", inputs: [12, 7, 12, 7], value: 38 }, theme: "roof" }),
    item("area", "stretch", "The roof plan uses 1 inch = 4 feet. The roof is drawn 3 inches by 2 inches. What is the real area?", ["96 square feet", "24 square feet", "6 square feet", "20 square feet"], 0, "Scale each side, then multiply.", "3 × 4 = 12 feet and 2 × 4 = 8 feet. 12 × 8 = 96.", "labeled", { len: "3 in", wid: "2 in", caption: "1 inch = 4 feet. Scale both sides before you multiply.", audit: { op: "scale-area", w: 3, h: 2, per: 4, value: 96 }, theme: "roof" }),
    item("measure", "confidence", "Two tunnel sections are 18 meters and 13.5 meters. How long are they together?", ["31.5 meters", "4.5 meters", "31 meters", "22.5 meters"], 0, "Add the two sections. Line up the decimal.", "18.0 + 13.5 = 31.5.", "line", { caption: "18 m and 13.5 m.", audit: { op: "add", inputs: [18, 13.5], value: 31.5 }, theme: "tunnel" }),

    item("reading", "confidence", "Mara checked the green buoy, wrote the heading, and only then cast off. What is this mostly about?", ["Mara checked the channel before she left.", "She wrote one heading in the log.", "Sailors think about safety.", "She sailed because the buoy light was broken."], 0, "The main idea covers every action, not one detail.", "Checking, writing, and then leaving are all part of getting ready.", "read", { theme: "hq" }),
    item("reading", "level", "The keeper lit the lamp, then wrote 'channel clear, wind gentle.' What can you tell?", ["She would not sign the log until the lamp was actually lit.", "The wind was gentle.", "Keepers care about the sea.", "The lamp had been dark for a week."], 0, "Use the order of the actions.", "She lights the lamp first, and the log reports the channel she can now see.", "read", { theme: "tower" }),
    item("reading", "stretch", "In the sentence 'Mara slowed because a red flag closed the channel to fast boats,' what does channel mean?", ["The deep path boats are supposed to follow.", "A television station.", "Any water a person can see.", "The rope that ties a boat to the dock."], 0, "Swap each meaning into the sentence.", "A channel here is the marked path for boats, which a flag can close.", "read", { theme: "dock" })
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
      { say: "Add every labeled leg of the route. Stay on the path.", visual: "line", n: 5 },
      { say: "Then add the next leg to that sum.", visual: "line", n: 8 },
      { say: "Distance is speed times time. A half hour is 0.5.", visual: "line", n: 12 }
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
#learn-layer{position:fixed;inset:0;z-index:70;display:none;align-items:center;justify-content:center;background:rgba(8,24,48,.28);padding:12px}
#learn-layer.show{display:flex}
#learn-card{width:min(760px,100%);max-height:calc(100vh - 28px);overflow:auto;background:linear-gradient(#fffdf6,#f3f7ff);border:6px solid #ffc83d;border-radius:22px;padding:12px 14px 16px;color:#10234d;box-shadow:0 18px 40px rgba(7,20,48,.35),0 8px 0 rgba(20,40,80,.18)}
.learn-foot{position:sticky;bottom:0;background:#fffdf6;padding-top:8px;display:flex;flex-wrap:wrap;gap:8px}
.plan-rect{position:relative;width:180px;height:96px;margin:8px auto 28px;border:4px solid #14336b;border-radius:6px}
.plan-rect .plan-w{position:absolute;left:-8px;top:36px;background:#fff;padding:0 3px}
.plan-rect .plan-l{position:absolute;left:50%;top:100%;transform:translateX(-50%);margin-top:6px;background:#fff;padding:0 4px;white-space:nowrap}
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
  #learn-card{max-height:calc(100vh - 16px);padding:8px 10px 10px}
  #learn-card button{min-height:40px;padding:6px 8px}
  .learn-choices{grid-template-columns:1fr 1fr}
  .learn-choices.stack{grid-template-columns:1fr}
  .learn-choices.stack button{min-height:36px;font-size:15px;padding:6px 8px}
  .learn-prompt{font-size:17px;margin:4px 0}
  .learn-visual{min-height:0;margin:4px 0;padding:4px}
  .plan-rect{width:160px;height:70px;margin-bottom:26px}
  .learn-story{max-height:22vh}
  #winter-banner{bottom:150px;font-size:13px;max-width:calc(100vw - 24px)}
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
  function choicesBox(q, attr) {
    const long = (q.choices || []).some((c) => String(c).length > 46);
    return `<div class="learn-choices${long ? " stack" : ""}">${choiceButtons(q, attr)}</div>`;
  }
  function visualHtml(kind, n, progress, q) {
    if (kind === "read" || (q && q.visual === "read")) return "";
    if (q && q.visual === "route") {
      const legs = q.legs || [];
      return `<div class="learn-visual">${legs.map((leg) => `<span class="hblk">${leg.n}<br>${esc(leg.dir)}</span>`).join("<span> then </span>")}<div>${esc(q.caption || "")}</div></div>`;
    }
    if (q && q.visual === "labeled") {
      return `<div class="learn-visual"><div class="plan-rect"><b class="plan-w">${esc(q.wid || "")}</b><b class="plan-l">${esc(q.len || "")}</b></div><div>${esc(q.caption || "")}</div></div>`;
    }
    if (q && (q.visual === "scale" || q.visual === "tags")) {
      return `<div class="learn-visual"><div>${esc(q.caption || "")}</div></div>`;
    }
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
      return `<div class="learn-visual">${groups.map((g) => `<span class="hblk">${g}</span>`).join("<span> , </span>")}<div>${esc(q.caption || "")}</div></div>`;
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
    const theme = BUILD_THEME[id];
    const pool = BANK.filter((q) => q.theme === theme);
    const used = new Set();
    const qs = [];
    pool.filter((q) => q.skill !== "reading").forEach((q) => {
      if (qs.length < 4 && !used.has(q.prompt)) { used.add(q.prompt); qs.push(Object.assign({}, q)); }
    });
    const lore = pool.find((q) => q.skill === "reading");
    if (lore && qs.length < 5) qs.push(Object.assign({}, lore));
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

  function copyTheme(theme, skill) {
    return BANK.filter((q) => q.theme === theme && (!skill || q.skill === skill)).map((q) => Object.assign({}, q));
  }
  const ACT = {
    nav: { title: "Navigation", icon: "🧭", qs: copyTheme("nav") },
    market: { title: "Fish market", icon: "🐟", qs: copyTheme("market") },
    blueprint: { title: "Lair blueprints", icon: "📐", qs: copyTheme("hq", "area") },
    code: { title: "Treasure codes", icon: "🗝️", qs: copyTheme("trophy") },
    log: {
      title: "Captain's log", icon: "📖", passage: LOG_TEXT,
      qs: [
        item("reading", "level", "What is the main idea of this log?", ["Mara kept a careful record of a calm run so the next watch would know the channel.", "A child on the dock waved a red flag.", "Captains write about the sea.", "The crew turned back because the tank ran dry."], 0, "The main idea covers the whole entry, not one detail.", "She checks the sky, slows for the flag, records the trade, and comes home with the lamp already bright.", "read", { kind: "main", passage: LOG_TEXT }),
        item("reading", "stretch", "What can you tell about the next watch from this log?", ["They can use Mara's notes about the flag, the buoy, and the trade.", "She traded four fish for a coil of rope.", "A log is useful on every ship.", "The next watch had already left before she returned."], 0, "Ask what the notes are for, not just one fact she wrote.", "She says she wrote those facts so nothing important would be forgotten for the next watch.", "read", { kind: "infer", passage: LOG_TEXT }),
        item("reading", "level", "What is the tone of this log?", ["Careful and steady.", "She mentions a red flag.", "The log is mostly about feelings.", "She sounds angry that the channel was closed."], 0, "Tone is how the writer sounds, not one object in the story.", "She slows down, writes the facts, checks the knot twice, and calls the voyage careful and kind.", "read", { kind: "tone", passage: LOG_TEXT })
      ]
    }
  };

  function startAct(id) {
    const pack = ACT[id];
    if (!pack) return { ok: false, reason: "missing" };
    const qs = pack.qs.map((q) => Object.assign({}, q, { passage: pack.passage || q.passage }));
    act = { id, qs, i: 0, misses: 0, passage: pack.passage || "", phase: pack.passage ? "read" : "ask", showRead: false, title: pack.title };
    openMode("act");
    return { ok: true, total: qs.length, id, skills: qs.map((q) => q.kind || q.skill) };
  }
  function loreFor(id) {
    const text = LORE[id];
    if (!text) return null;
    const pack = {
      harbor: ["A careful captain matches the buoys to the chart before leaving the harbor.", "Children on the pier sell cold lemonade.", "Harbors are places where boats come and go.", "The crew left without looking at the buoys."],
      turtle: ["Turtle Cove is for watching the nests, not for landing on them.", "Mara counted the tracks from the grass to the water.", "People should be kind to animals.", "She carried a nest back to the boat."],
      parrot: ["Parrot Palms is a place to look and listen, and to leave the shells where they are.", "A blue parrot said the word rope.", "Islands with trees are pleasant to visit.", "Mara fed the birds so they would stay."],
      pirate: ["Pirate Point is where measuring a rock becomes rooms a captain can walk through.", "Most crews spent what they earned instead of burying it.", "Building takes planning.", "The hidden door was already a finished hall."],
      lighthouse: ["The lighthouse promise is kept only when someone climbs, lights the lamp, and writes the truth.", "Mara signed that the channel was clear and the wind was gentle.", "Lights help people at night.", "She left the lamp dark because the sky was clear."]
    }[id];
    const infer = {
      harbor: ["Skipping the buoy check could send the boat back to the dock.", "A green buoy marks the safe side of the channel.", "Good captains are careful people.", "The red buoy is the one boats should follow."],
      turtle: ["A bright lamp on that beach could lead hatchlings away from the water.", "Baby turtles follow the brightest path.", "Wildlife needs quiet places.", "Mara took a hatchling aboard to keep it safe."],
      parrot: ["Feeding the parrots would change how they look for their own fruit.", "Mara counted twelve shells and left every one.", "Wild birds are interesting.", "The shells were a buried chest of coins."],
      pirate: ["Mara's measurements are notes she can use when the next room is built.", "A pool plan needs length, width, and depth.", "Math is part of construction.", "She dug up a real chest before she left the beach."],
      lighthouse: ["On a moonless night, the step count would still help her come down.", "The beam pointed down the channel, not into the palms.", "A lighthouse is a tall building.", "The log was still blank when she reached the bottom."]
    }[id];
    const detail = {
      harbor: ["A green buoy marks the safe side of the channel.", "The red buoy is the safe side.", "The crew skips the tank check.", "The heading is written after the lemonade, never before."],
      turtle: ["A low driftwood fence keeps the pier lights off the sand.", "Mara moved a nest above the tide line.", "The cove has no tracks in the evening.", "She started the motor beside the nests."],
      parrot: ["Mara left all twelve shells under the largest tree.", "She carried a bag of fruit up the path.", "The parrot would not repeat a word.", "The path was still wet from the tide."],
      pirate: ["Lanterns along the dry path show the way so nobody steps into the pool.", "The X on the map marked a hole she dug that day.", "The lookout glass cannot see the bay.", "The hidden door was a finished hall with windows."],
      lighthouse: ["Mara signed: lamp lit, channel clear, wind gentle.", "The beam was aimed into the palms.", "She climbed with both hands off the rail.", "A dark lamp is safe on a clear evening."]
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
    act = { id: "lore", loreId, qs, i: 0, misses: 0, passage: story.text, title: story.title, phase: "read", showRead: false };
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
        return `<header><h2><span class="learn-ico">✎</span>Try one like it</h2><button class="ghost" id="learn-exit">Exit</button></header><p>${esc(SKILL_NAME[tutor.skill] || tutor.skill)}. This practice does not change your coins.</p><p class="learn-prompt">${esc(q.prompt)}</p>${qVisual(q)}${choicesBox(q, "tutor")}${pause}`;
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
      if (session.passage && session.phase === "read") {
        return `<header><h2><span class="learn-ico">${icon}</span>${esc(title)}</h2><button class="ghost" id="learn-exit">Exit</button></header><div class="learn-story">${esc(session.passage)}</div><div class="learn-foot"><button id="learn-ready">Ready for questions</button></div>${pause}`;
      }
      const passage = session.passage && session.showRead ? `<div class="learn-story">${esc(session.passage)}</div>` : "";
      const reread = session.passage ? `<button id="learn-reread" class="ghost">${session.showRead ? "Hide the passage" : "Reread"}</button>` : "";
      const hint = q && q._hint ? `<div class="learn-hint"><b>Hint:</b> ${esc(q._hint)}</div>` : "";
      const hintBtn = mode === "gate" && q && !q._hint ? `<button id="learn-hint" class="ghost">Hint</button>` : "";
      const body = q ? `${passage}<p class="learn-prompt">${esc(q.prompt)}</p>${qVisual(q)}${choicesBox(q, "choice")}<div class="learn-foot">${hint}${hintBtn}${reread}</div>` : "<p>Done for now.</p>";
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
      if (b.id === "learn-ready" && act) { act.phase = "ask"; show(); return; }
      if (b.id === "learn-reread" && act) { act.showRead = !act.showRead; show(); return; }
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
  let skyBase = null;
  function skyMaterial() {
    let found = null;
    if (!CA.scene) return null;
    CA.scene.traverse((o) => {
      if (!found && o.isMesh && o.material && o.material.uniforms && o.material.uniforms.uTop) found = o.material;
    });
    return found;
  }
  function applySky() {
    const mat = skyMaterial();
    if (!mat || !mat.uniforms.uTop) return;
    if (!skyBase) {
      skyBase = {
        top: mat.uniforms.uTop.value.clone(),
        mid: mat.uniforms.uMid.value.clone(),
        hor: mat.uniforms.uHor.value.clone(),
        fog: CA.scene.fog && CA.scene.fog.color ? CA.scene.fog.color.clone() : null
      };
    }
    const win = winterOn();
    mat.uniforms.uTop.value.copy(skyBase.top);
    mat.uniforms.uMid.value.copy(skyBase.mid);
    mat.uniforms.uHor.value.copy(skyBase.hor);
    if (win) {
      mat.uniforms.uTop.value.set("#8ea4b8");
      mat.uniforms.uMid.value.set("#c5d4e0");
      mat.uniforms.uHor.value.set("#e7eef3");
    }
    if (CA.scene.fog && CA.scene.fog.color) {
      if (win) CA.scene.fog.color.set("#e4eef4");
      else if (skyBase.fog) CA.scene.fog.color.copy(skyBase.fog);
    }
  }
  function flakeTexture() {
    const dot = document.createElement("canvas");
    dot.width = dot.height = 64;
    const g = dot.getContext("2d");
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, "rgba(255,255,255,0.95)");
    grd.addColorStop(0.28, "rgba(255,255,255,0.35)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    const tex = new (kit().CanvasTex)(dot);
    tex.needsUpdate = true;
    return tex;
  }
  function paintGazeboRoof(on) {
    if (!CA.scene) return;
    CA.scene.traverse((o) => {
      if (!o.isMesh || !o.geometry || o.geometry.type !== "BufferGeometry") return;
      const pos = o.geometry.attributes && o.geometry.attributes.position;
      const colAttr = o.geometry.attributes && o.geometry.attributes.color;
      if (!pos || !colAttr) return;
      if (!o.userData.v50Roof) o.userData.v50Roof = colAttr.array.slice(0);
      const saved = o.userData.v50Roof;
      if (!on) {
        colAttr.array.set(saved);
        colAttr.needsUpdate = true;
        return;
      }
      o.updateWorldMatrix(true, false);
      const e = o.matrixWorld.elements;
      let changed = false;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const wx = e[0] * x + e[4] * y + e[8] * z + e[12];
        const wy = e[1] * x + e[5] * y + e[9] * z + e[13];
        const wz = e[2] * x + e[6] * y + e[10] * z + e[14];
        if (wx < -7.4 || wx > -4 || wz < -15.6 || wz > -12.4 || wy < 3.7) continue;
        const lift = Math.min(1, (wy - 3.7) / 1.2);
        const base = i * 3;
        colAttr.setXYZ(i,
          saved[base] + (0.96 - saved[base]) * lift,
          saved[base + 1] + (0.98 - saved[base + 1]) * lift,
          saved[base + 2] + (1 - saved[base + 2]) * lift);
        changed = true;
      }
      if (changed) {
        colAttr.needsUpdate = true;
        if (o.material) o.material.vertexColors = true;
      }
    });
  }
  function restoreGazeboRoof() { paintGazeboRoof(false); }
  function clearNamed(prefix) {
    if (!CA.scene) return;
    const gone = [];
    CA.scene.traverse((o) => { if (o.name && o.name.indexOf(prefix) === 0) gone.push(o); });
    gone.forEach((o) => { if (o.parent) o.parent.remove(o); });
  }
  function drawWinter() {
    const ban = document.getElementById("winter-banner");
    if (ban) ban.classList.toggle("show", winterOn());
    ["v50-snow", "v50-cap", "v50-frost", "v50-wreath", "v50-roof", "v50-flake"].forEach((name) => { if (!winterOn()) clearNamed(name); });
    applySky();
    if (!winterOn()) { restoreGazeboRoof(); return; }
    if (!kit() || !CA.scene) return;
    if (CA.scene.getObjectByName("v50-snow")) return;
    const K = kit();
    const count = 1600;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 90;
      pos[i * 3 + 1] = 3 + Math.random() * 28;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }
    const geo = new K.Geo();
    geo.setAttribute("position", new K.Attr(pos, 3));
    const tex = flakeTexture();
    const mat = new K.PointsMat({ color: 0xffffff, size: 0.42, map: tex, transparent: true, depthWrite: false, sizeAttenuation: true, opacity: 0.9 });
    const pts = new K.Points(geo, mat);
    pts.name = "v50-snow";
    pts.frustumCulled = false;
    CA.scene.add(pts);
    const spriteMat = new K.SpriteMat({ map: tex, color: 0xffffff, transparent: true, depthWrite: false, opacity: 0.8 });
    for (let i = 0; i < 16; i++) {
      const flake = new K.Sprite(spriteMat);
      const ang = Math.random() * Math.PI * 2;
      const rad = 6 + Math.random() * 28;
      flake.position.set(Math.cos(ang) * rad, 6 + Math.random() * 16, Math.sin(ang) * rad);
      flake.scale.setScalar(0.16 + (i % 4) * 0.05);
      flake.name = "v50-flake";
      CA.scene.add(flake);
    }
    dressWinterSet();
    paintGazeboRoof(true);
    applySky();
  }
  function dressWinterSet() {
    const K = kit();
    if (!K || CA.scene.getObjectByName("v50-frost")) return;
    const frostMat = new K.Basic({ color: 0xe9f6ff, transparent: true, opacity: 0.72, depthWrite: false, side: 2 });
    function frost(cx, cz, inner, outer) {
      const ring = new K.Mesh(new K.Ring(inner, outer, 40), frostMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(cx, 0.06, cz);
      ring.name = "v50-frost";
      CA.scene.add(ring);
    }
    frost(0, 0, 20.4, 23.55);
    [[0, -62.5], [44.2, -44.2], [62.5, 0], [44.2, 44.2], [0, 62.5], [-44.2, 44.2], [-62.5, 0], [-44.2, -44.2]].forEach(([x, z]) => frost(x, z, 14.4, 17.25));
    const snowMat = new K.Lambert({ color: 0xf7fbff });
    CA.scene.traverse((o) => {
      if (!o.isMesh || !o.geometry || !o.material || !o.material.color) return;
      if (!o.geometry.boundingBox && o.geometry.computeBoundingBox) o.geometry.computeBoundingBox();
      const bb = o.geometry.boundingBox;
      if (!bb) return;
      o.updateWorldMatrix(true, false);
      const e = o.matrixWorld.elements;
      const x = e[12], y = e[13], z = e[14];
      if (Math.hypot(x, z) > 20) return;
      const sx = Math.hypot(e[0], e[1], e[2]);
      const sy = Math.hypot(e[4], e[5], e[6]);
      const sz = Math.hypot(e[8], e[9], e[10]);
      const w = Math.abs(bb.max.x - bb.min.x) * sx;
      const h = Math.abs(bb.max.y - bb.min.y) * sy;
      const d = Math.abs(bb.max.z - bb.min.z) * sz;
      const col = o.material.color;
      const garage = o.geometry.type === "BoxGeometry" && col.b > col.r + 0.08 && w > 6 && h < 0.7 && y > 3;
      const slope = o.geometry.type === "BoxGeometry" && Math.abs(o.rotation.x) > 0.6 && w > 1.2 && h < 0.4 && y < 2;
      const gallery = o.geometry.type === "CylinderGeometry" && Math.hypot(x - 10.94, z + 10.16) < 1.2 && Math.abs(y - 8.1) < 0.4 && h < 0.4;
      const gazebo = o.geometry.type === "ConeGeometry" && col.b > 0.45 && col.r < 0.25 && y > 2;
      if (garage) {
        const slab = new K.Mesh(new K.Box(w * 0.96, 0.22, d * 0.96), snowMat);
        slab.position.y = bb.max.y + 0.11;
        slab.name = "v50-roof";
        o.add(slab);
      }
      if (slope) {
        const slab = new K.Mesh(new K.Box((bb.max.x - bb.min.x) * 0.94, 0.1, (bb.max.z - bb.min.z) * 0.9), snowMat);
        slab.position.y = bb.max.y + 0.05;
        slab.name = "v50-roof";
        o.add(slab);
      }
      if (gallery) {
        const ring = new K.Mesh(new K.Torus(Math.max(w, d) * 0.46, 0.16, 8, 24), snowMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = bb.max.y + 0.04;
        ring.name = "v50-roof";
        o.add(ring);
      }
      if (gazebo) {
        const height = bb.max.y - bb.min.y;
        const radius = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) / 2;
        const cap = new K.Mesh(new K.Cone(radius * 1.04, height * 0.62, 12), snowMat);
        cap.position.y = bb.max.y - height * 0.22;
        cap.name = "v50-roof";
        o.add(cap);
        const lip = new K.Mesh(new K.Torus(radius * 0.98, height * 0.08, 6, 14), snowMat);
        lip.rotation.x = Math.PI / 2;
        lip.position.y = bb.min.y + height * 0.2;
        lip.name = "v50-roof";
        o.add(lip);
      }
    });
    [[1.75, 1.15, 25.04, 1, 0], [-1.75, 1.15, 25.04, -1, 0], [1.75, 1.15, 27.54, 1, 0], [-1.75, 1.15, 27.54, -1, 0], [17.17, 1.15, 14.7, 0.71, -0.71], [14.7, 1.15, 17.17, -0.71, 0.71], [18.94, 1.15, 16.47, 0.71, -0.71], [16.47, 1.15, 18.94, -0.71, 0.71]].forEach(([x, y, z, ox, oz]) => {
      const wreath = new K.Mesh(new K.Torus(0.22, 0.055, 8, 16), new K.Lambert({ color: 0x1f8a3b }));
      wreath.position.set(x, y, z);
      wreath.rotation.y = Math.atan2(ox, oz);
      wreath.name = "v50-wreath";
      const bulb = new K.Mesh(new K.Sphere(0.055, 6, 5), new K.Lambert({ color: 0xffe7a8, emissive: 0xffc83d, emissiveIntensity: 0.9 }));
      bulb.position.y = 0.14;
      wreath.add(bulb);
      CA.scene.add(wreath);
    });
  }
  function dress() {
    const K = kit();
    if (!K || !CA.scene || CA.scene.getObjectByName("v50-gfx")) return;
    const root = new K.Group();
    root.name = "v50-gfx";
    CA.scene.add(root);
    gfx = { root, wakes: [], foam: [] };
    const waterY = typeof CA.waterY === "number" ? CA.waterY : -0.55;
    const foamMat = new K.Basic({ color: 0xf7fbff, transparent: true, opacity: 0.38, depthWrite: false });
    function foam(cx, cz, radius) {
      if (!(radius > 2)) return;
      const ring = new K.Mesh(new K.Torus(radius, 0.1, 8, 96), foamMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(cx, waterY + 0.2, cz);
      ring.name = "v50-foam";
      root.add(ring);
      gfx.foam.push(ring);
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
    const wet = new K.Basic({ color: 0x8a6840, transparent: true, opacity: 0.82, depthWrite: false, side: 2 });
    function wetBand(cx, cz, inner, outer) {
      const band = new K.Mesh(new K.Ring(inner, outer, 48), wet);
      band.rotation.x = -Math.PI / 2;
      band.position.set(cx, 0.035, cz);
      band.name = "v50-wetsand";
      root.add(band);
    }
    wetBand(0, 0, 21.7, 23.5);
    [[0, -62.5], [44.2, -44.2], [62.5, 0], [44.2, 44.2], [0, 62.5], [-44.2, 44.2], [-62.5, 0], [-44.2, -44.2]].forEach(([x, z]) => wetBand(x, z, 15.5, 17.25));
    const flowerColors = [0xff5fa2, 0xffd24a, 0xffffff];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const rad = 8 + (i % 3) * 2.2;
      const rock = new K.Mesh(new K.Sphere(0.22 + (i % 3) * 0.08, 7, 5), new K.Lambert({ color: i % 2 ? 0x9aa098 : 0xc4b8a4 }));
      rock.scale.set(1.15, 0.55, 0.9);
      rock.position.set(Math.cos(a) * rad, 0.16, Math.sin(a) * rad);
      rock.name = "v50-rock";
      root.add(rock);
      const tuft = new K.Mesh(new K.Cone(0.1, 0.28, 5), new K.Lambert({ color: 0x3c9a46 }));
      tuft.position.set(Math.cos(a + 0.3) * (rad + 1.1), 0.14, Math.sin(a + 0.3) * (rad + 1.1));
      tuft.name = "v50-grass";
      root.add(tuft);
      const bloom = new K.Mesh(new K.Sphere(0.16, 6, 5), new K.Lambert({ color: flowerColors[i % 3] }));
      bloom.position.set(Math.cos(a + 0.5) * (rad - 0.6), 0.28, Math.sin(a + 0.5) * (rad - 0.6));
      bloom.name = "v50-flower";
      root.add(bloom);
    }
    const shore = Math.atan2(30, 42);
    for (let i = 0; i < 7; i++) {
      const a = shore - 0.35 + i * 0.11;
      const rad = 17.5 + (i % 3) * 1.1;
      const rock = new K.Mesh(new K.Sphere(0.35 + (i % 4) * 0.16, 7, 5), new K.Lambert({ color: i % 2 ? 0x8e877c : 0xb7aa96 }));
      rock.scale.set(1.2, 0.55, 0.95);
      rock.position.set(Math.cos(a) * rad, 0.22, Math.sin(a) * rad);
      rock.name = "v50-rock";
      root.add(rock);
      const bloom = new K.Mesh(new K.Sphere(0.2, 6, 5), new K.Lambert({ color: flowerColors[i % 3] }));
      bloom.position.set(Math.cos(a + 0.06) * (rad - 1.3), 0.32, Math.sin(a + 0.06) * (rad - 1.3));
      bloom.name = "v50-flower";
      root.add(bloom);
      const tuft = new K.Mesh(new K.Cone(0.16, 0.42, 5), new K.Lambert({ color: 0x3c9a46 }));
      tuft.position.set(Math.cos(a - 0.05) * (rad - 1.6), 0.2, Math.sin(a - 0.05) * (rad - 1.6));
      tuft.name = "v50-grass";
      root.add(tuft);
    }
    softenWater(K);
    const ao = CA.scene.getObjectByName("v35-contact-ao");
    if (ao) ao.visible = false;
    const woodCanvas = document.createElement("canvas");
    woodCanvas.width = 64; woodCanvas.height = 64;
    const wg = woodCanvas.getContext("2d");
    wg.fillStyle = "#c4894a";
    wg.fillRect(0, 0, 64, 64);
    for (let y = 0; y < 64; y += 10) {
      wg.fillStyle = y % 20 ? "#a86b32" : "#e0a86a";
      wg.fillRect(0, y, 64, 8);
      wg.fillStyle = "rgba(90,50,20,.35)";
      wg.fillRect(0, y + 7, 64, 2);
    }
    const woodTex = new K.CanvasTex(woodCanvas);
    woodTex.wrapS = woodTex.wrapT = 1000;
    let planks = 0;
    CA.scene.traverse((o) => {
      if (planks > 18 || !o.isMesh || !o.material || !o.material.color || !o.geometry || o.material.map) return;
      if (!o.geometry.boundingBox && o.geometry.computeBoundingBox) o.geometry.computeBoundingBox();
      const bb = o.geometry.boundingBox;
      if (!bb) return;
      const sx = Math.abs(bb.max.x - bb.min.x);
      const sy = Math.abs(bb.max.y - bb.min.y);
      const sz = Math.abs(bb.max.z - bb.min.z);
      const col = o.material.color;
      const flat = o.geometry.type === "BoxGeometry" && sy < 0.4 && Math.max(sx, sz) > 4 && Math.min(sx, sz) < 8 && col.r > 0.35 && col.r > col.b;
      if (!flat) return;
      const next = o.material.clone();
      next.map = woodTex;
      next.color.set("#ffffff");
      o.material = next;
      planks += 1;
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
      if (o.isDirectionalLight && o.shadow) o.shadow.radius = 2.4;
    });
    applySky();
    const poolWater = CA.scene.getObjectByName("lair-water");
    if (poolWater && !poolWater.getObjectByName("v50-shimmer")) {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const g = c.getContext("2d");
      g.clearRect(0, 0, 128, 128);
      for (let i = 0; i < 18; i++) {
        const cx = 16 + (i * 37) % 96;
        const cy = 16 + (i * 53) % 96;
        const grd = g.createRadialGradient(cx, cy, 1, cx, cy, 14);
        grd.addColorStop(0, "rgba(255,255,255,0.55)");
        grd.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = grd;
        g.beginPath();
        g.arc(cx, cy, 14, 0, Math.PI * 2);
        g.fill();
      }
      const tex = new K.CanvasTex(c);
      tex.wrapS = tex.wrapT = 1000;
      tex.needsUpdate = true;
      const shimmer = new K.Mesh(new K.Circle(0.68, 28), new K.Basic({ map: tex, transparent: true, opacity: 0.32, depthWrite: false, color: 0xdff6ff }));
      shimmer.rotation.x = -Math.PI / 2;
      shimmer.position.y = 0.16;
      shimmer.name = "v50-shimmer";
      poolWater.add(shimmer);
      gfx.shimmer = shimmer;
    }
    const doorPivot = CA.scene.getObjectByName("lair-door");
    if (doorPivot && !doorPivot.getObjectByName("v50-door")) {
      const frame = new K.Group();
      frame.name = "v50-door";
      const wood = new K.Lambert({ color: 0x6a3e22 });
      const iron = new K.Lambert({ color: 0x2a241e });
      [[0, 2.15, 1.15, 3.5, 0.4, 0.32], [-1.6, 0.45, 1.15, 0.36, 3.8, 0.32], [1.6, 0.45, 1.15, 0.36, 3.8, 0.32]].forEach(([x, y, z, w, h, d]) => {
        const bar = new K.Mesh(new K.Box(w, h, d), wood);
        bar.position.set(x, y, z);
        frame.add(bar);
      });
      const glowTex = flakeTexture();
      [-2.05, 2.05].forEach((x) => {
        const torch = new K.Group();
        torch.position.set(x, 0, 1.4);
        const post = new K.Mesh(new K.Cyl(0.06, 0.075, 1.25, 6), wood);
        post.position.y = 0.5;
        const bracket = new K.Mesh(new K.Box(0.05, 0.32, 0.18), iron);
        bracket.position.set(0, 1.05, 0.08);
        const cup = new K.Mesh(new K.Cyl(0.13, 0.1, 0.14, 8), iron);
        cup.position.y = 1.22;
        const flame = new K.Mesh(new K.Cone(0.09, 0.32, 8), new K.Lambert({ color: 0xffb03a, emissive: 0xff6a00, emissiveIntensity: 1.15 }));
        flame.position.y = 1.48;
        flame.name = "v50-flame";
        const glow = new K.Sprite(new K.SpriteMat({ map: glowTex, color: 0xffd27a, transparent: true, depthWrite: false, opacity: 0.55 }));
        glow.position.y = 1.5;
        glow.scale.setScalar(0.18);
        glow.name = "v50-flame";
        torch.add(post);
        torch.add(bracket);
        torch.add(cup);
        torch.add(flame);
        torch.add(glow);
        frame.add(torch);
      });
      doorPivot.add(frame);
    }
    if (CA.lair && CA.lair.world && !CA.scene.getObjectByName("v50-lantern")) {
      [[2.2, 8.2], [4.4, 10.6], [6.6, 12.4]].forEach(([ie, ge], i) => {
        const p = CA.lair.world(ie, ge, 0);
        const ground = CA.lair.gy ? CA.lair.gy(ie, ge) : 0.6;
        const post = new K.Mesh(new K.Cyl(0.08, 0.1, 1.7, 6), new K.Lambert({ color: 0x5c4030 }));
        post.position.set(p.x, ground + 0.85, p.z);
        const lamp = new K.Mesh(new K.Sphere(0.22, 8, 6), new K.Lambert({ color: 0xffe7a0, emissive: 0xffc83d, emissiveIntensity: 1 }));
        lamp.position.y = 1.05;
        post.add(lamp);
        post.name = i === 0 ? "v50-lantern" : "v50-lantern";
        root.add(post);
      });
    }
    const wakeTex = wakeTexture(K);
    ["motorboat", "yacht", "sailboat"].forEach((id) => {
      const veh = CA.VEH && CA.VEH[id];
      if (!veh) return;
      const m = new K.Mesh(new K.Plane(3.6, 7.2), new K.Basic({ map: wakeTex, transparent: true, depthWrite: false, color: 0xffffff }));
      m.rotation.x = -Math.PI / 2;
      m.name = "v50-wake";
      m.visible = false;
      m.renderOrder = 2;
      root.add(m);
      gfx.wakes.push({ mesh: m, id });
    });
  }
  function wakeTexture(K) {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 256;
    const g = c.getContext("2d");
    g.clearRect(0, 0, 128, 256);
    g.lineCap = "round";
    g.strokeStyle = "rgba(255,255,255,0.85)";
    g.lineWidth = 14;
    g.beginPath();
    g.moveTo(64, 8);
    g.quadraticCurveTo(46, 90, 16, 236);
    g.stroke();
    g.beginPath();
    g.moveTo(64, 8);
    g.quadraticCurveTo(82, 90, 112, 236);
    g.stroke();
    g.globalCompositeOperation = "destination-in";
    const fade = g.createLinearGradient(0, 0, 0, 256);
    fade.addColorStop(0, "rgba(0,0,0,0.15)");
    fade.addColorStop(0.18, "rgba(0,0,0,0.85)");
    fade.addColorStop(0.62, "rgba(0,0,0,0.4)");
    fade.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = fade;
    g.fillRect(0, 0, 128, 256);
    const tex = new K.CanvasTex(c);
    tex.needsUpdate = true;
    return tex;
  }
  function softenWater(K) {
    const N = 512;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = N;
    const g = canvas.getContext("2d");
    const img = g.createImageData(N, N);
    const height = (x, y) => {
      const u = (x / N) * Math.PI * 2;
      const v = (y / N) * Math.PI * 2;
      return Math.sin(u * 2 + v) * 0.5 + Math.sin(u * 3 - v * 2 + 1.1) * 0.28 + Math.cos(u - v * 3 + 0.4) * 0.16;
    };
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const hx = height(x + 1, y) - height(x - 1, y);
        const hy = height(x, y + 1) - height(x, y - 1);
        const nx = -hx * 0.28;
        const ny = -hy * 0.28;
        const nz = 1;
        const len = Math.hypot(nx, ny, nz) || 1;
        const i = (y * N + x) * 4;
        img.data[i] = (nx / len * 0.5 + 0.5) * 255;
        img.data[i + 1] = (ny / len * 0.5 + 0.5) * 255;
        img.data[i + 2] = (nz / len * 0.5 + 0.5) * 255;
        img.data[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    const tex = new K.CanvasTex(canvas);
    tex.wrapS = tex.wrapT = 1000;
    tex.repeat.set(42, 42);
    tex.generateMipmaps = true;
    tex.minFilter = 1008;
    tex.magFilter = 1006;
    tex.anisotropy = 8;
    if (tex.colorSpace !== undefined) tex.colorSpace = "srgb-linear";
    const maxA = CA.renderer && CA.renderer.capabilities && CA.renderer.capabilities.getMaxAnisotropy && CA.renderer.capabilities.getMaxAnisotropy();
    if (maxA) tex.anisotropy = maxA;
    tex.needsUpdate = true;
    CA.scene.traverse((o) => {
      if (!o.isMesh || !o.material || !o.material.normalMap) return;
      const width = o.geometry && o.geometry.parameters && o.geometry.parameters.width;
      if (!(width > 500)) return;
      o.material.normalMap = tex;
      if (o.material.normalScale) o.material.normalScale.set(0.16, 0.16);
      o.material.needsUpdate = true;
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
      const moving = !!veh.obj.visible && Math.abs(veh.v || 0) > 0.35;
      w.mesh.visible = moving;
      if (!moving) return;
      const speed = Math.min(2.2, Math.abs(veh.v));
      w.mesh.position.set(veh.obj.position.x - fx * (2.4 + speed), waterY + 0.16, veh.obj.position.z - fz * (2.4 + speed));
      w.mesh.rotation.x = -Math.PI / 2;
      w.mesh.rotation.z = Math.atan2(fx, fz);
      w.mesh.scale.set(0.85 + speed * 0.2, 0.9 + speed * 0.35, 1);
    });
  }
  function fallSnow(step) {
    const snow = CA.scene && CA.scene.getObjectByName("v50-snow");
    if (gfx && gfx.foam) gfx.foam.forEach((ring, i) => { ring.rotation.z = clockMs / 900 + i; });
    if (gfx && gfx.shimmer && gfx.shimmer.material && gfx.shimmer.material.map) {
      gfx.shimmer.material.map.offset.x = (clockMs / 4000) % 1;
      gfx.shimmer.material.map.offset.y = (clockMs / 5300) % 1;
      gfx.shimmer.material.opacity = 0.22 + Math.sin(clockMs / 280) * 0.08;
    }
    if (CA.scene) CA.scene.traverse((o) => {
      if (o.name !== "v50-flame" || !o.isMesh) return;
      const flick = 0.85 + Math.sin(clockMs / 70 + o.id) * 0.2;
      o.scale.set(1, flick, 1);
    });
    const flakes = [];
    if (CA.scene) CA.scene.traverse((o) => { if (o.name === "v50-flake") flakes.push(o); });
    flakes.forEach((flake, i) => {
      flake.position.y -= step * 1.3;
      if (flake.position.y < 0.4) flake.position.y = 18;
      flake.position.x += Math.sin(clockMs / 400 + i) * 0.02;
    });
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
  try { if (!/(?:\?|&)plain=1(?:&|$)/.test(location.search)) dress(); } catch (err) { gfx = gfx || { error: String(err && err.message || err) }; }
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
    activity: (id) => ACT[id] ? { total: ACT[id].qs.length, kinds: ACT[id].qs.map((q) => q.kind || q.skill), questions: ACT[id].qs } : null,
    gateQuestions: (id) => makeGate(id).map((q) => ({ theme: q.theme, skill: q.skill, prompt: q.prompt, choices: q.choices, answer: q.answer })),
    questions: () => BANK.concat(ACT.log.qs),
    winter: {
      on: winterOn,
      draw: drawWinter,
      stats: () => {
        let points = false, cones = 0, onCaptain = 0, flakes = 0, frost = 0, roofs = 0, wreaths = 0, count = 0;
        if (CA.scene) CA.scene.traverse((o) => {
          if (o.name === "v50-snow" && o.isPoints) { points = true; count = o.geometry.attributes.position.count; }
          if (o.name === "v50-flake") flakes += 1;
          if (o.name === "v50-frost") frost += 1;
          if (o.name === "v50-roof") roofs += 1;
          if (o.name === "v50-wreath") wreaths += 1;
          let p = o.parent;
          while (p) { if (p === CA.captain && (o.name === "v50-roof" || o.name === "v50-flake" || o.name === "v50-snow")) onCaptain += 1; p = p.parent; }
          if (o.name && o.name.indexOf("v50-snow") === 0 && o.geometry && o.geometry.type === "ConeGeometry") cones += 1;
        });
        return { on: winterOn(), points, cones, onCaptain, flakes, frost, roofs, wreaths, count };
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
