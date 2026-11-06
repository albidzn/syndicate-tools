// ==UserScript==
// @name         Syndicate Activity Reporter
// @namespace    syndicate-tools
// @version      2.29.1
// @description  Leader panel on the Family tab, daily and weekly activity reports, a live leaderboard and war alerts in Discord.
// @match        https://mafiareborn.com/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/albidzn/syndicate-tools/main/syndicate-activity-reporter.user.js
// @downloadURL  https://raw.githubusercontent.com/albidzn/syndicate-tools/main/syndicate-activity-reporter.user.js
// ==/UserScript==

// Tampermonkey runs scripts in a sandbox that can't see the game's React data,
// so the reporter is added to the page as an ordinary script and runs there.
(function () {
  var s = document.createElement("script");
  s.textContent = "(" + reporter.toString() + ")();";
  document.documentElement.appendChild(s);
  s.remove();
})();

function reporter() {
  "use strict";
  if (window.__synActivity) { return; }
  window.__synActivity = true;
  var VERSION = "2.29.1";
  // What's new, posted to the leadership chat the first time a new version runs (see announceVersion). Add an entry with every release.
  var CHANGES = {
    "2.29.1": [
      "Recruiting message: Send test, to try it on any player first."
    ],
    "2.29.0": [
      "Recruits tab: a Message button sends your recruiting message (Discord invite and the 100 activity rule) to a player through the game's mail. Edit the text with Edit message."
    ],
    "2.28.2": [
      "Voice reminders for gang war, survival, wanted and the shops now only speak for the city you're in."
    ],
    "2.28.1": [
      "The shops now use the game's names: Black market and Corner shop."
    ],
    "2.28.0": [
      "More voice reminders: new goods in the shops, and your food, mission vehicle, crew members or family boosts running out."
    ],
    "2.27.0": [
      "Voice reminders, with their own switch in Extras: gang war, survival, wanted and free duel ready, energy full, and auto-join failed."
    ],
    "2.26.0": [
      "ElevenLabs now speaks every announcement. It leaves out enemy names and exact times so each line is only paid for once, and the Windows voice stays silent while a key is saved."
    ],
    "2.25.1": [
      "ElevenLabs: the voice list now loads whenever it's missing, and Extras says why if the key can't list voices."
    ],
    "2.25.0": [
      "Extras: an optional ElevenLabs voice for the greeting, your mission and levels. Battle calls stay on the PC's voice, each line is paid for only once, and there's a monthly limit."
    ],
    "2.24.0": [
      "Ranks tab: Weakest members, for when the family needs a seat. Ranked by activity over 30 days, Discord link and missed wars, with the seat count. Recruits points to it too."
    ],
    "2.23.0": [
      "Extras: Auto-join wars signs you up for attacks and defences you may fight in, as soon as the panel sees them. Each player switches it on for themselves, and the game has to be open at some point in the 10 hours before the battle."
    ],
    "2.22.0": [
      "Extras: effect sounds have their own volume slider, the voice uses names it can say (and Call me sets your own), and Windows pop-ups for your mission and the gang war, each with its own switch."
    ],
    "2.21.0": [
      "New Extras menu beside Discord settings, with a switch and a test button for everything fun, per PC.",
      "JARVIS voice (off until you switch it on), startup and effect sounds, Red Alert before battles, victory and defeat screens, level-up fireworks, a news ticker and a threat radar in the War planner.",
      "Most Wanted: a poster of last week's most active member in the family chat every Monday. There's also a secret code."
    ],
    "2.20.0": [
      "New startup animation with the family logo and a personal welcome when the panel opens. Click to skip it; Discord settings can switch it off or play it again."
    ],
    "2.19.3": [
      "Honor rank posts are now only for big moments: a new family #1, someone passing 3 or more members at once, or a first time in the game's top 100, 50, 25, 10 or 3. Besides a new #1, at most 3 a day.",
      "Discord settings has a button to switch them off."
    ],
    "2.19.2": [
      "Wide game dialogs, like Travel, now fit beside the docked panel instead of sliding under it."
    ],
    "2.19.1": [
      "The game's hover boxes now show on top of the panel instead of being cut off by it."
    ],
    "2.19.0": [
      "Game update alarm: after a game update the tools are checked, and this chat hears about any that stopped working, and when they work again.",
      "Family chat: a post when a member passes another on the honor rank, with a bigger one for a new family #1."
    ],
    "2.18.0": [
      "Family chat posts: far more wording for level-ups, activity, streaks, donations and reminders, some of it silly. Recent lines don't repeat.",
      "Family chat posts now also change their bot name and sometimes show as a coloured card or with big text. Leadership and war room posts stay as they were.",
      "The family level post says when the next level is due."
    ],
    "2.17.1": [
      "Your damage: shows your weapon's bonus against each class, like a rifle's +15% against Rogues."
    ],
    "2.17.0": [
      "Duels: new Your damage table. Your normal and crit hits against each class with your current gear, plus your crit chance and average per attack."
    ],
    "2.16.6": [
      "Daily report: sending it again now repeats the same numbers, and no longer takes levels away from the next report."
    ],
    "2.16.5": [
      "Timers: the city you're in now stands out, with a coloured column."
    ],
    "2.16.4": [
      "Activity tab: new No Discord filter shows how many and which members aren't linked, sorted like the rest of the list."
    ],
    "2.16.3": [
      "Duels: counts your attacks per player and hides anyone you've attacked 3 times today (4 with a Spy). Counting starts with this version."
    ],
    "2.16.2": [
      "Timers: the bonus opponent no longer shows ready when there's none left to fight. It shows which district has one open, or a reward waiting."
    ],
    "2.16.1": [
      "The mission timer is now a draining strip under the Personal and Family buttons, so it shows on every tab. Click it to open the Godfather bar."
    ],
    "2.16.0": [
      "Missions: shows when your running mission is ready, your energy, and for the best mission of your filter how much is missing and when you'll have enough. Missions you can't afford yet show in yellow."
    ],
    "2.15.1": [
      "Duels: per-player honor. From 121 real fights: a win pays about 5.8% of their honor × (their honor ÷ yours), and the loser loses 80% of what the winner gets. The column shows win and loss, and Best honor weighs both by your win chance."
    ],
    "2.15.0": [
      "Activity tab and leaderboard: about how long until the next family level. It measures the family's real XP gain, and uses the average AP as a rough estimate until it has 6 hours of that."
    ],
    "2.14.2": [
      "Duels: the honor column now says plainly what it is: what a typical win pays (~). The honor gap didn't predict real wins. Press Learn from mail once more: it reads more fights and keeps more about each."
    ],
    "2.14.1": [
      "Duels: Learn from mail now finds your past fights. The honor column uses a curve fitted to real fights, so big gaps show big wins, and shows ? until it has enough fights instead of a guess."
    ],
    "2.14.0": [
      "War planner: queue the next attack while one is planned. Any family can be queued, also the one we're attacking now. It's declared as soon as our battle and theirs are both over, and if someone else attacks them meanwhile it waits for that battle too."
    ],
    "2.13.1": [
      "Duels: Learn from mail works now. It was looking in the wrong game file."
    ],
    "2.13.0": [
      "Duels: Where to put stat points. Tries each of your stats a bit higher in simulated fights against players of your class, and compares your base stats with theirs."
    ],
    "2.12.0": [
      "Duels: Learn from mail reads your past duels, so the honor column uses real numbers: what a win pays, what a lost attack costs, and how the attacks on you went."
    ],
    "2.11.0": [
      "Personal tab: new Timers section with your gang members, mission booster and food running out, and shop, wanted, gang war and survival timers per city.",
      "Personal tab: new Gang war section rates the next opponent in each unlocked district with simulated fights, best chance first.",
      "Duels: honor column and a Best honor sort. It starts as a rough guess and learns from your won duels.",
      "The game's class icons now show in front of member names, and in the duel and gang war lists."
    ],
    "2.10.0": [
      "Personal tab: new Duels section. Scan the players around your rank and see your win chance against each, from simulated fights with the game's own formula. It only reads; fights start only when you press the game's own button."
    ],
    "2.9.0": [
      "Panel: new Personal and Family tabs at the top. Personal has the mission picker, so it no longer floats over the game. It opens by itself on the Godfather bar, and Family opens on the Family tab.",
      "The Today / Yesterday / Levels buttons moved next to the member search. The Mission Reader bookmark's own panel stays hidden while this panel is open."
    ],
    "2.8.4": [
      "Docked panel: the Mission Reader keeps its normal size and sits next to the panel instead of stretching across the screen."
    ],
    "2.8.3": [
      "Boost box: shows the cost for both boosts next to the single price, and how long the treasury keeps both boosts running at today's price. Hover for the details."
    ],
    "2.8.2": [
      "The docked panel now stays visible on every game page. When the window is too small to dock, or you dragged the panel away, it floats on the Family tab only."
    ],
    "2.8.1": [
      "Panel docking: a click on the top bar no longer counts as a drag, so the panel stays docked. A panel left at the right edge by an older version docks by itself."
    ],
    "2.8.0": [
      "The panel docks beside the game: it fills the right edge at full height and the game moves over, so nothing is covered. If the window is too small for that, it floats on top. Drag to float, drop on the right edge or double-click to dock again.",
      "Activity tab: long names no longer push rows onto two lines; tags have their own column.",
      "Activity tab: quick filters (Under 100, Not registered, Online, Away) and a 14-day trend when you click a member's row.",
      "Activity tab: boost box with time left, treasury, renewal cost, auto-renew and a Buy button once a boost has ended.",
      "Minimized bar: at-100 count, next battle with sign-ups, time to reset, and a warning when a boost is ending."
    ],
    "2.7.0": [
      "Game sound is now a slider, and its low end is much quieter (it follows how loud things sound, so 10% is really quiet).",
      "Activity tab: \"📣 Remind unregistered\" button pings, in the family chat, the members who can fight in a planned war but haven't registered. By button only, nothing automatic.",
      "Activity tab: member search box, and 🏖️ away marking (hover a row, click 🏖️, enter days). Away members get no idle alerts, evening or sign-up pings until they're back.",
      "The browser tab shows the next battle's countdown (⚔ attack, 🛡 defence) on every game page.",
      "The Family tab always opens on Activity.",
      "Overnight safety: if the family numbers stop refreshing for 15 minutes while nobody is using the game, the tab reloads itself. After an hour or more offline, the leadership chat gets a note with what's being caught up."
    ],
    "2.6.0": [
      "Panel: new 🔊 button at the top to turn the game's sound down (Off, 10–100%). Saved per PC, works on every game page, and unlike volume extensions it doesn't keep the screens awake."
    ],
    "2.5.0": [
      "Leaderboard: new \"Honor rank\" column with every member's place in the game's player ranking, best first.",
      "Leaderboard records: best honor rank ever reached (top 3), counted from now on."
    ],
    "2.4.1": [
      "Hover tips in the panel work again (war sign-ups, activity tags, war icons and the rest). The panel now shows its own tips, because its frequent refresh kept cancelling the browser's."
    ],
    "2.4.0": [
      "Activity tab: crosshair and shield next to each name show who is registered for our planned attack and defence, in the member's class colour (grey = not registered).",
      "Activity tab: new \"war sign-ups\" box with how many members are registered for the attack and the defence. Hover it for details."
    ],
    "2.3.1": [
      "Activity tags also use the game's own today/yesterday numbers, so they work before a week of history is saved. \"new\" only shows for members who joined in the last 2 days, and days at 50–99 points count half."
    ],
    "2.3.0": [
      "Activity tab: tags next to each name. The Discord icon shows who is linked (faded = not linked). The activity tag shows the last 7 days: 🔥 streak, active, mixed, inactive, 💤 idle or new. Hover a tag for details."
    ],
    "2.2.1": [
      "War planner: no new attack can be armed while we already have one planned or armed. Cancel the armed one first to pick another family."
    ],
    "2.2.0": [
      "War planner: \"⏰ Attack when free\" on a family under attack declares war on them automatically the moment the game allows it (the game has to stay open on that PC). Armed attacks show on every tab and can be cancelled.",
      "War planner: \"⚔️ Attack now\" on families that are ready."
    ],
    "2.1.0": [
      "War attendance follows the game's 12-hour rule: a member only counts wars declared at least 12 hours after they joined. Past wars are recounted.",
      "Activity tab: click a member's name to open their profile, without a page reload.",
      "New versions are announced here, like this one."
    ]
  };
  var KEY = "syn-activity";
  var ID = "syn-activity-panel";
  var PAGE = "/game/family";
  var FULL = 100; // 100 activity points in a day earn the full family bonus (members can go past it)
  var GRACE = 5 * 60 * 1000; // numbers fetched in the first minutes after the reset may not have rolled over yet
  var RETRY = 5 * 60 * 1000;
  var WEBHOOK = /^https:\/\/(?:(?:ptb|canary)\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/;

  // Settings and the last report live in this browser only:
  // { webhook, sentDay, sentAt, base: {id: {name, level, gold}}, prev, min, lock }
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

  // Game volume, per PC (s.volume, 0–100). The game plays every sound through Web Audio and connects each one to the
  // context's speakers, so those connections are sent through one gain node per context instead. Works on every game page.
  // The slider is squared into the gain because hearing is logarithmic: 50% on the slider is a quarter of the sound, 10% is 1%.
  var volume = volumeOf(load()), volGains = [];
  function volumeOf(s) { return typeof s.volume === "number" && s.volume >= 0 && s.volume <= 100 ? s.volume : 100; }
  function volGain(v) { return (v / 100) * (v / 100); }
  function setVolume(v) {
    volume = v;
    volGains.forEach(function (g) { g.gain.value = volGain(v); });
  }
  (function () {
    if (!window.AudioNode || !window.AudioDestinationNode) { return; }
    var connect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (dest) {
      if (dest instanceof AudioDestinationNode && !dest.context.__synOwn) { // the panel's own sounds have their own slider
        var ctx = dest.context, g = ctx.__synVolume;
        if (!g) {
          g = ctx.__synVolume = ctx.createGain();
          g.gain.value = volGain(volume);
          connect.call(g, dest);
          volGains.push(g);
        }
        if (this !== g) { arguments[0] = g; }
      }
      return connect.apply(this, arguments);
    };
    // Other game tabs pick up a change made in the panel.
    window.addEventListener("storage", function (e) { if (e.key === KEY) { setVolume(volumeOf(load())); } });
  })();

  // The game resets activity at 00:00 UTC, so "yesterday" is the UTC day before today.
  function dayStart(t) { var d = new Date(t); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); }
  function dayKey(t) { return new Date(t).toISOString().slice(0, 10); }
  function dayLabel(t) { return new Date(t).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }); }
  function clock(t) { return new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }

  // Family data comes from the game's own data cache (queries ["family", id]), found through React's internals.
  var client = null, diag = "";
  function fiberOf(el) {
    var ks = Object.keys(el);
    for (var i = 0; i < ks.length; i++) { if (ks[i].indexOf("__reactFiber$") === 0) { return el[ks[i]]; } }
    return null;
  }
  function findClient() {
    var els = [document.body].concat(Array.prototype.slice.call(document.querySelectorAll("body *")));
    var start = null;
    for (var i = 0; i < els.length && !start; i++) { if (els[i].id !== ID) { start = fiberOf(els[i]); } }
    if (!start) { return; }
    while (start.return) { start = start.return; }
    var stack = [start], n = 0;
    while (stack.length && n < 300000) {
      var f = stack.pop(); n++;
      var p = f.memoizedProps;
      if (p && p.client && typeof p.client.getQueryCache === "function") { client = p.client; return; }
      if (f.sibling) { stack.push(f.sibling); }
      if (f.child) { stack.push(f.child); }
    }
  }
  // Links inside the panel open through the game's own router (it registers itself as __TSR_ROUTER__), like the game's
  // links do, so the page doesn't reload and bookmarklets such as the Mission Reader keep running. Plain navigation if it's missing.
  function gameNavigate(href) {
    var r = window.__TSR_ROUTER__;
    if (r && typeof r.navigate === "function") {
      try { var p = r.navigate({ to: href }); if (p && p.catch) { p.catch(function () { location.href = href; }); } return; } catch (e) {}
    }
    location.href = href;
  }
  function readFamily() {
    if (!client) { findClient(); }
    if (!client) { diag = "The game's data can't be reached."; return null; }
    var best = null, seen = [];
    client.getQueryCache().findAll({ queryKey: ["family"] }).forEach(function (q) {
      var d = q.state.data, fam = d && (Array.isArray(d.members) ? d : d.family);
      seen.push(JSON.stringify(q.queryKey) + " → " + (d && typeof d === "object" ? Object.keys(d).slice(0, 8).join(",") : String(d)));
      if (!fam || !Array.isArray(fam.members)) { return; }
      // Other families (loaded by the war planner or by browsing the ranking) aren't ours.
      var key = q.queryKey[1];
      if (key && typeof key === "object" && key.familyId != null && !fam.private) { return; }
      if (!fam.members.some(function (m) { return m && ("yesterday" in m || "today" in m); })) { return; }
      if (!best || q.state.dataUpdatedAt > best.at) { best = { fam: fam, at: q.state.dataUpdatedAt, query: q }; }
    });
    // Shown under "Waiting…" so a screenshot tells what the game's data looks like.
    diag = best ? "" : seen.length ? "No member activity in: " + seen.join(" | ") : "No family data in the game's cache yet.";
    return best;
  }
  function members(fam) {
    return fam.members.map(function (m) {
      return {
        id: String(m.userId != null ? m.userId : m.name), name: String(m.name || "?"), level: +m.level || 0,
        yesterday: +m.yesterday || 0, today: +m.today || 0, gold: +m.donatedGold || 0, online: !!m.online, rank: m.rank || "",
        joinedAt: m.joinedAt ? +new Date(m.joinedAt) || 0 : 0, spec: m.spec || "", pos: +m.position || 0 // pos = place in the game's player ranking (honor), 1 = best
      };
    });
  }
  function snapshot(list) {
    var o = {};
    list.forEach(function (m) { o[m.id] = { name: m.name, level: m.level, gold: m.gold }; });
    return o;
  }

  // The Discord message: everyone sorted by yesterday's points, with levels and gold since the previous report.
  function md(s) { return String(s).replace(/([\\*_~`|>#])/g, "\\$1"); }
  function mark(ap) { return ap >= FULL ? "✅" : ap >= FULL / 2 ? "🟡" : ap > 0 ? "⚠️" : "💤"; }
  // streaks: {id: days in a row at 0 points, up to and including the reported day}
  function buildReport(famName, list, base, dayEnd, streaks) {
    var sorted = list.slice().sort(function (a, b) { return b.yesterday - a.yesterday || b.level - a.level; });
    var full = 0, total = 0, levels = 0;
    var lines = sorted.map(function (m, i) {
      var was = base && base[m.id], idle = streaks && streaks[m.id] || 0;
      var up = was ? m.level - was.level : 0, gold = was ? m.gold - was.gold : 0;
      if (m.yesterday >= FULL) { full++; }
      total += m.yesterday; levels += Math.max(0, up);
      return "`" + (i < 9 ? " " : "") + (i + 1) + ".` " + mark(m.yesterday) + " **" + md(m.name) + "** — " + m.yesterday + " AP · Lv " + m.level
        + (up > 0 ? " (+" + up + ")" : "") + (gold > 0 ? " · 🪙 +" + gold : "") + (idle >= 2 ? " · **" + idle + " days in a row**" : "");
    });
    if (base) {
      var joined = list.filter(function (m) { return !base[m.id]; }).map(function (m) { return md(m.name); });
      var left = Object.keys(base).filter(function (id) { return !list.some(function (m) { return m.id === id; }); }).map(function (id) { return md(base[id].name); });
      if (joined.length || left.length) { lines.push(""); }
      if (joined.length) { lines.push("➕ Joined: " + joined.join(", ")); }
      if (left.length) { lines.push("➖ Left: " + left.join(", ")); }
    }
    var avg = list.length ? Math.round(total / list.length) : 0;
    var foot = full + "/" + list.length + " reached 100 · total " + total.toLocaleString("en-US") + " AP · avg " + avg
      + (base ? " · +" + levels + " level" + (levels === 1 ? "" : "s") + " since last report" : " · level gains start with the next report");
    return {
      username: "Syndicate Activity",
      allowed_mentions: { parse: [] },
      embeds: [{
        title: "📊 " + (famName || "Family") + " · activity for " + dayLabel(dayEnd),
        description: lines.join("\n"),
        color: 0xee5d58,
        footer: { text: foot + "\n✅ 100+ (full bonus)  🟡 50–99  ⚠️ 1–49  💤 0" },
        timestamp: new Date().toISOString()
      }]
    };
  }
  // Every family chat post picks its wording from here, so no two look alike. {x} is filled in by the caller. A line starting with
  // "# ", "## ", "### ", "> " or "-# " shows big, as a quote or small in Discord. See say() for how they're picked.
  var LINES = {
    asFamily: ["Syndicate Activity", "The Consigliere", "Nonna's Scoreboard", "Paulie Two-Levels", "Family Gossip", "The Barber Heard", "Sal from the Bakery", "Cannoli Courier", "The Neighborhood Watch", "Uncle Grind"],
    asMoney: ["Vinnie the Accountant", "The Cash Counter", "Totally Legal Laundromat", "Syndicate Treasury", "Department of Envelopes", "The Bagman"],

    levelLow: [
      "🎉 {who} just reached **level {lv}**! The rookie has teeth! 🦷",
      "🐣 **Level {lv}** for {who}! Yesterday carrying bags, tomorrow carrying the family.",
      "🎈 {who} hit **level {lv}**. Someone give this rising star a tiny fedora! 🎩",
      "### 📈 {who} → level {lv}\nThe street is starting to learn the name.",
      "🍝 {who} is now **level {lv}**! That earns a seat at the kids' table. Progress!",
      "🧢 Level **{lv}**, {who}! Keep this up and they'll let you hold the good cannoli.",
      "> *\"Who's that?\"*\n> *\"{who}. Level {lv}. Remember the name.\"*",
      "🚲 {who} reached **level {lv}**. Next stop: a car that actually starts. 🚗",
      "📣 Ding! {who} is **level {lv}**. Only {next} is next, no pressure!",
      "🍕 **Level {lv}** unlocked by {who}! Pizza's on the new kid. That's how it works."
    ],
    levelMid: [
      "🎉 {who} just reached **level {lv}**! Respect! 🎩",
      "🥂 **Level {lv}**! {who} is officially a problem for the other families.",
      "## 🔔 DING! Level {lv}\n{who} keeps climbing and the neighbors are getting nervous.",
      "🥃 Pour one for {who}: **level {lv}** and still hungry. Level {next}, you're next.",
      "💼 {who} hit **level {lv}**. The promotion comes with a nicer suit and worse enemies.",
      "🗞️ **THE DAILY RACKET:** Local legend {who} reaches level {lv}. Police baffled.",
      "🎯 {who} is **level {lv}**! Word is even the pigeons report to them now. 🐦",
      "🚬 *leans back in chair* … Level {lv}, {who}. Not bad. Not bad at all.",
      "📈 Stonks: {who} at **level {lv}**. Do not bet against this one.",
      "> Word on the street: {who} just hit **level {lv}**.\n> The street is impressed.",
      "🍾 {who} reached **level {lv}**! That's {next} on the horizon. Somebody hide the rivals.",
      "🔥 **Level {lv}**. {who} didn't ask for permission. Well done! 👏"
    ],
    levelHigh: [
      "🐐 {who} just reached **level {lv}**. At this point the game should be paying rent to them.",
      "## 👑 LEVEL {lv}\n{who} is playing a different game than the rest of us.",
      "🏔️ **Level {lv}**: {who} can see their house from up there. And yours. And who's in it.",
      "🕴️ {who} hit **level {lv}**. Other families now just send fruit baskets. 🧺",
      "🚨 Level {lv} confirmed for {who}. Please stop, the rest of us have jobs.",
      "🎩 **Level {lv}**, {who}. Nobody's asking anymore how. They're asking what it costs.",
      "🗿 {who}. Level {lv}. No further comment.",
      "> \"How's the grind?\"\n> \"Level {lv},\" said {who}, without looking up.",
      "⚰️ Rivals of {who} are advised to update their wills: **level {lv}** has been reached.",
      "🦾 {who} reached **level {lv}**! Touch grass? They don't even know what grass is. Respect."
    ],
    levelBig: [
      "# 🏛️ LEVEL {lv} 🏛️\n{who} just walked into the history books and put their feet up. 👑",
      "# 💥 {lv} 💥\nThat's the level {who} just hit. Everybody take your hat off. 🎩",
      "## 🎆 BIG ONE ALERT: LEVEL {lv} 🎆\n{who} did it! Drinks are on the family tonight! 🥂🥂🥂",
      "🚨🎉🚨 **LEVEL {lv}** 🚨🎉🚨\n{who} just hit a number the rest of us tell our grandchildren about.",
      "# 👑 {who}\n### Level {lv}. Kiss the ring. 💍"
    ],

    ap500: [
      "🔥 {who} hit **500 activity** today! On fire! 🔥",
      "🔥 {who} just cracked **500 activity** today! Warming up nicely! 💪",
      "🔥 **500 activity** for {who} today! Keep that engine running! 🚂",
      "☕ {who} is at **500 activity** and the coffee hasn't even kicked in.",
      "🏃 **500 activity**, {who}! Does the family need to check on you? Blink twice.",
      "🧯 Somebody bring a fire extinguisher: {who} hit **500 activity** today.",
      "📊 Accounting flagged {who}: **500 activity** today. That's suspiciously productive.",
      "### 🔥 500 today\n{who} didn't come here to make friends. Well, a few. Mostly to grind.",
      "🍝 {who} has done **500 activity** today. Nonna says eat something.",
      "💪 500 down, {who}. Your keyboard would like a word with HR.",
      "🛞 **500 activity** from {who}! The wheels are officially off the wagon."
    ],
    ap1000: [
      "🚨💥 **ABSOLUTE MENACE ALERT** 💥🚨\n{who} just SMASHED **1,000 activity** today! 🔥🔥🔥 Somebody stop them! 🏆👑",
      "💥💥💥 **1,000 ACTIVITY** 💥💥💥\n{who} is UNSTOPPABLE today! 🚀🔥 The family bows down! 🙇",
      "⚡🔥 **ONE. THOUSAND. ACTIVITY.** 🔥⚡\n{who} is built different! 🦾🏆 Legend status unlocked! 👑",
      "# 🚨 1,000 ACTIVITY 🚨\n{who}, has anyone seen you eat today? Anyone? 🍽️",
      "## 🧠 Medical update\n{who} reached **1,000 activity** today. Doctors say go outside. {who} says no.",
      "🤖 **1,000 activity.** We've run the tests on {who}. Results: not human. 🛸",
      "🏆 Four digits. **1,000 activity**. {who} has left the group chat and entered the record books.",
      "🕯️ Light a candle for everyone trying to keep up with {who}: **1,000 activity** today.",
      "> They said it couldn't be done.\n> They said go to bed.\n> {who} did **1,000 activity** anyway. 🔥",
      "🛑 Stop. Everybody stop. {who} just did **1,000 activity**. Go home, it's over."
    ],

    rush3: [
      "⚡ {who} gained **+{n} levels** today! Leveling machine! 🚀",
      "📈 **+{n} levels** in one day for {who}! Climbing fast! 🧗",
      "⚡ {who} is on a level rush: **+{n} today**! Who can keep up? 🏃💨",
      "🛗 {who} took the elevator today: **+{n} levels** and counting.",
      "🎰 Jackpot! {who} rolled **+{n} levels** today. The house is not happy.",
      "🍝 {who} has inhaled **+{n} levels** today like it's Sunday lunch.",
      "📉 Everyone else's rank: down. {who}: **+{n} levels** today. Coincidence?",
      "### 🚀 +{n} today\n{who} is in a hurry. We're not asking why.",
      "🏎️ **+{n} levels** today. {who} just passed you on the inside. Wave!",
      "🧗 {who} is taking the levels three at a time: **+{n}** today."
    ],
    rush5: [
      "🚨💥 **LEVEL EXPLOSION** 💥🚨\n{who} just blasted through **+{n} LEVELS** today! 🚀🚀🚀 Somebody call the fire department! 🔥🧯",
      "☄️🔥 **+{n} LEVELS IN ONE DAY!** 🔥☄️\n{who} is absolutely UNSTOPPABLE! 🦾⚡ The leaderboard is shaking! 📈💥",
      "💥⚡ **{n} LEVELS. ONE DAY.** ⚡💥\n{who} has gone full beast mode! 🐉🔥 Bow down to the grind boss! 🙇",
      "# 🧨 +{n} LEVELS TODAY\n{who} isn't leveling up. {who} is leaving orbit. 🛰️",
      "## 🕵️ Investigation opened\n{who} gained **+{n} levels** in one day. Nobody saw a thing. Nobody ever does.",
      "🌪️ A level tornado has been spotted over {who}: **+{n} today**. Secure your rankings.",
      "> \"How many levels did you get today?\"\n> \"Yes,\" said {who}. **(+{n})**",
      "🏁 Race's over, everyone. {who} did **+{n} levels** today and is already asking what's next."
    ],

    streak7: [
      "🔥 {who} hit 100+ activity **7 days in a row**! Consistency boss! 👑",
      "📅 **One full week** at 100+ for {who}! That's a habit now. A beautiful one. 🔥",
      "🗓️ 7 days, 7 times 100+. {who} clocks in like the rent is due.",
      "🔥 {who} has a **7-day streak**. The couch is starting to file missing person reports. 🛋️",
      "### 🔥 Week one: done\n{who} has hit 100+ for **7 days straight**. Don't break the chain!"
    ],
    streak14: [
      "🔥🔥 {who} — **14 days in a row** at 100+! Two weeks of pure grind! 💪",
      "📆 **Two weeks straight** at 100+! {who} doesn't take days off, days take {who} off. 🔥",
      "🧱 14 days. Brick by brick, {who} is building something. Possibly an empire.",
      "🔥🔥 **14-day streak** for {who}! Family's starting to whisper about it. In a good way.",
      "## 🔥🔥 14 in a row\n{who} is making the rest of us look like we're on vacation. 🏖️"
    ],
    streak30: [
      "🔥🔥🔥 **30-DAY STREAK!** 🔥🔥🔥\n{who} hit 100+ every single day for a month! Absolute legend! 🏆👑",
      "# 🗓️ 30 DAYS\n{who} hit 100+ every day for **a whole month**. Not one excuse. 🏆",
      "🕰️ A month of 100+ days from {who}. You could set your watch by this. 🔥🔥🔥",
      "🎖️ For **30 straight days** of service, {who} receives the family's highest honor: a slightly better cannoli. 🏆"
    ],
    streak60: [
      "🌋🔥 **60 DAYS IN A ROW!** 🔥🌋\n{who} is a machine! Two months without missing a day! 🤖🏆",
      "# 🌋 60 DAYS\n{who}: two months of 100+ every day. Is this a person or a very dedicated cron job? 🤖",
      "🧬 **60-day streak.** Scientists want to study {who}. The family said no comment.",
      "🏔️ Two months. Every day. 100+. {who} isn't on a streak anymore, it's a lifestyle. 🔥"
    ],
    streak100: [
      "💯💯💯 **ONE HUNDRED DAYS IN A ROW** 💯💯💯\n{who} has entered the Hall of Fame! 🏛️👑🔥",
      "# 💯 100 DAYS 💯\n{who}. One hundred. In a row. They're putting up a statue. 🗿👑",
      "🏛️ **100 straight days** at 100+. {who} is no longer a member of the family. {who} *is* the family. 👑",
      "📜 Let it be written: on this day {who} completed **100 days in a row**. Tell your children. 🔥🔥🔥"
    ],

    famLevel: [
      "🏰🎉 **{fam}** just reached **family level {lv}**! 🎉🏰\nThanks to everyone grinding for it! 💪🔥",
      "# 🏰 FAMILY LEVEL {lv}\n**{fam}** just got bigger. Other families, please update your insurance. 🧾",
      "🍾 Pop the good stuff: **{fam}** is now **family level {lv}**! That's on every single one of you! 🥂",
      "📈 **Family level {lv}!** The empire grows. The rent stays the same. Well done, **{fam}**! 🏰",
      "## 🎆 Level {lv}\n**{fam}** levelled up. Nonna made a cake. It's a very threatening cake. 🎂",
      "🏗️ New floor just got added to the **{fam}** building: **family level {lv}**! 🏰💪",
      "🗞️ **THE DAILY RACKET:** **{fam}** reaches family level {lv}. Sources say \"it was the grinding\". 📰",
      "🍝 Sunday dinner is extra big this week. **{fam}** just hit **family level {lv}**! 🎉",
      "> A family is measured by its loyalty.\n> And by its level. Which is now **{lv}**. 🏰🔥",
      "👑 Everybody take a bow: **{fam}**, **family level {lv}**! Every 100 activity day got us here! 💯"
    ],

    record: [
      "👑 **NEW RECORD!** {who} just beat the best day ever with **{ap} AP** today! 🔥",
      "# 👑 NEW RECORD\n{who} has done **{ap} AP** today. Nobody in the family has ever done more. 🏆",
      "📜 The record books have been burned and rewritten: **{ap} AP** today by {who}! 🔥",
      "🚨 Best day ever, broken. {who}. **{ap} AP**. It's only a matter of time until they beat it again.",
      "🏆 Hold my cannoli: {who} just set a new all-time best with **{ap} AP**! 🍰",
      "## 🗿 All-time best: {ap} AP\nCongratulations to {who}, and our condolences to the old record.",
      "⚰️ Here lies the old record. Killed today by {who} with **{ap} AP**. It didn't see it coming.",
      "🥇 {who} just did what no one here has done: **{ap} AP** in one day! New family record! 🔥"
    ],

    overtake: [
      "📈 {who} just passed {them} on the honor rank! Now **#{rank}**.",
      "👋 {who} waved at {them} on the way past. Honor rank **#{rank}**.",
      "🏎️ Overtake! {who} just went around {them} on the outside. Honor rank **#{rank}**.",
      "🪞 {them}, check your mirrors. {who} just went past: honor rank **#{rank}**.",
      "📉 Bad news for {them}. Good news for {who}: honor rank **#{rank}**.",
      "🗞️ **THE DAILY RACKET:** {who} passes {them} in the honor ranks. Now **#{rank}**.",
      "👀 {them} blinked. {who} is ahead now: honor rank **#{rank}**.",
      "🎩 With respect, {them}: {who} is above you now. Honor rank **#{rank}**.",
      "🪜 {who} just climbed over {them} on the honor ladder: **#{rank}**.",
      "⚔️ Family rivalry update: {who} ahead of {them}, honor rank **#{rank}**. Your move.",
      "🥊 {who} just knocked {them} down a spot. Honor rank **#{rank}**.",
      "📞 Someone call {them}. {who} just went past: honor rank **#{rank}**.",
      "🧾 The books have changed: {who} now outranks {them} at **#{rank}**.",
      "> \"Wasn't {them} ahead of you?\"\n> \"Was,\" said {who}. **#{rank}** in honor.",
      "🏃💨 {who} passed {them} like they were standing still. Honor rank **#{rank}**.",
      "🍿 This is getting good: {who} passed {them}. Honor rank **#{rank}**. Revenge when?"
    ],
    honorTier: [
      "🏅 {who} just broke into the **top {tier}** of the whole game: honor rank **#{rank}**!",
      "📈 **Top {tier} in the whole game.** {who} just got there: honor rank **#{rank}**. 🔥",
      "## 🏅 Top {tier}\n{who} is now **#{rank}** in the whole game. The other families have noticed.",
      "🗞️ **THE DAILY RACKET:** {who} enters the game's top {tier}, now **#{rank}**. The family denies everything.",
      "🎩 Make room at the top {tier}: {who} has arrived at **#{rank}**.",
      "🍾 {who} reached the **top {tier}** of the whole game (**#{rank}**). Drinks on the family!"
    ],
    overtakeTop: [
      "# 👑 NEW FAMILY #1\n{who} just passed {them} and now has the family's best honor rank: **#{rank}**.",
      "👑 The throne has a new owner. {who} passed {them} for **#1 in the family** (honor rank **#{rank}**).",
      "🏆 {who} has the family's best honor rank now, past {them}: **#{rank}**. Kiss the ring. 💍",
      "🪑 {them}, please leave the big chair. {who} is top of the family now: honor rank **#{rank}**.",
      "## 👑 Regime change\n{who} passed {them} for the top spot in the family. Honor rank **#{rank}**.",
      "🚨 Coup alert! {who} has taken the family's best honor rank from {them}: **#{rank}**."
    ],

    vGreet: [
      "Good {part}, {name}. All systems are online.",
      "Welcome back, {name}. All systems are online.",
      "{name}. Good to see you again. All systems online.",
      "Systems online. The family is waiting, {name}.",
      "Good {part}, {name}. The family is in good hands."
    ],
    vGreetWar: ["Battle against {foe} in {left}.", "We fight {foe} in {left}.", "Your next battle, against {foe}, is in {left}."],
    vMission: ["Your mission is ready.", "Mission complete, boss.", "Your mission has finished. The next job is waiting.", "That job is done, boss. What's next?"],
    vWarAttack: ["War declared on {foe}. Battle in {left}.", "We are going after {foe}. Battle in {left}.", "New target, {foe}. Battle in {left}."],
    vWarDefend: ["Alert. {foe} has declared war on us. Battle in {left}.", "Warning. {foe} is coming for us. Battle in {left}.", "We are under attack by {foe}. Battle in {left}."],
    vWarSoon: ["Battle against {foe} in {left}.", "{left} until the battle against {foe}.", "Heads up, boss. {foe} in {left}."],
    vWin: ["Victory against {foe}.", "We beat {foe}. Well done, boss.", "{foe} has been dealt with. Victory."],
    vLoss: ["We lost against {foe}. We will remember this.", "Defeat against {foe}. We go again.", "{foe} got this one, boss. It won't happen twice."],
    vMvp: ["The MVP is {name}.", "{name} was the best of us tonight.", "Most valuable fighter: {name}."],
    vLevel: ["Congratulations. You have reached level {lv}.", "Level {lv}, boss. Very impressive.", "You are now level {lv}. The others should be worried."],
    vFamLevel: ["The family has reached level {lv}.", "Family level {lv}. The empire grows, boss."],
    vReset: ["One hour until the daily reset. You are at {ap} activity.", "Boss, one hour left today, and you are only at {ap} activity."],
    eWarAttack: ["War declared, boss.", "We are going to war."],
    eWarDefend: ["Alert. We are under attack.", "Warning. Another family has declared war on us."],
    eWin: ["Victory. Well done, boss.", "We won the war."],
    eLoss: ["We lost the war. We go again.", "Defeat. It won't happen twice."],
    eLevel: ["Congratulations. You have gone up a level.", "Another level, boss. Very impressive."],
    eFamLevel: ["The family has gone up a level.", "The family is a level stronger, boss."],
    eReset: ["One hour until the daily reset. You are under 100 activity.", "Boss, one hour left today, and you are still under 100 activity."],
    fxWin: ["Clean work, everyone. Nobody saw anything.", "Drinks at the bakery. Don't bring the receipts.", "Another one for the wall.", "Well done. Nonna made extra.", "That's how it's done. Take notes, other families.", "Tell your friends. Actually, don't."],
    fxLoss: ["Heads up. We'll remember this one.", "Tough one. Regroup, gear up, go again.", "Not our night. There's always another night.", "Eat something. Then we plan.", "Nobody's mad. Well. Somebody's mad.", "Write the name in the little black book."],
    tickJoke: ["Police baffled.", "Sources say it was the grinding.", "Nobody saw a thing.", "The family denies everything.", "Nonna is proud.", "More at eleven.", "The mayor declined to comment.", "Vinnie says the numbers check out.", "Witnesses have stopped talking.", "Stay tuned."],
    posterReward: ["The eternal respect of the family", "One slightly better cannoli", "Bragging rights until next Monday", "A seat at the big table", "Nonna's approval, which is priceless", "Whatever is in Vinnie's envelope"],
    posterLine: ["🤠 **MOST WANTED this week:** {who}, wanted for **{ap} activity**. Approach with caution.", "🤠 The sheriff has spoken: {who} is **Most Wanted** with **{ap} activity**.", "🤠 **WANTED:** {who}, last seen grinding **{ap} activity** in one week. Do not attempt to keep up.", "🤠 New poster on the saloon wall: {who}, **{ap} activity**. The family salutes you."],

    don1: [
      "💰 {who} donated **{gold} gold** to the family treasury. Thank you! 🙏",
      "🪙 **{gold} gold** from {who}! The family remembers. 🙏",
      "📒 Noted in the book: {who}, **{gold} gold**, no questions asked. Grazie! 🤌",
      "🧾 {who} put **{gold} gold** in the envelope. Clean, on time, respectful. 💰",
      "🍝 {who} donated **{gold} gold**. That buys a lot of meatballs. Thank you! 🙏",
      "💼 A small briefcase from {who} arrived: **{gold} gold**. Much appreciated!",
      "🤝 **{gold} gold** from {who}. That's what family is for.",
      "🐷 The piggy bank says thank you to {who} for **{gold} gold**! 🪙"
    ],
    don2: [
      "💎 {who} donated **{gold} gold** to the family treasury! That's huge, thank you! 🙌🔥",
      "💼💼 Two briefcases, one legend: {who} dropped **{gold} gold** in the treasury! 🙌",
      "### 💎 {gold} gold\nFrom {who}. The accountant had to sit down for a second. 🙏",
      "🤌 **{gold} gold** from {who}. Very generous. Very legal. Thank you! 💰",
      "🎩 Hats off to {who}! **{gold} gold** just went into the family treasury! 🔥",
      "📈 The treasury went up, Vinnie's blood pressure went down. Thanks {who}, **{gold} gold**! 💎",
      "🚚 An armored truck pulled up. It's from {who}. **{gold} gold**! 🙌"
    ],
    don3: [
      "👑💰 **{gold} GOLD** 💰👑\n{who} just made a LEGENDARY donation to the family treasury! The whole family salutes you! 🙇🏆",
      "# 💰 {gold} GOLD\n{who} just made the treasury cry tears of joy. We owe you one. A big one. 👑",
      "🚨 Vault door won't close! {who} just donated **{gold} gold**! The family salutes you! 🙇💰",
      "🤯 **{gold} gold**. From {who}. In one go. Somebody check on the accountant, Vinnie has fainted. 💰👑",
      "## 👑 Patron of the family\n{who} donated **{gold} gold**. You'll never pay for a drink in this town again. 🥃",
      "🏦 The bank called. They'd like to know who {who} is and why **{gold} gold** just moved. We said nothing. 🤐👑"
    ],

    eveHead: [
      "⏰ **{time} left** to reach 100 activity today! (reset {reset})",
      "⏳ Tick tock. **{time} left** until the reset ({reset}) and these names are still under 100:",
      "📋 The boss is checking the list. **{time} left** (reset {reset}). Still under 100:",
      "🍝 Nonna's asking about these ones. **{time} left** to hit 100 (reset {reset}):",
      "### ⏰ {time} to go\nReset at {reset}. Roll call of the people who still owe the family a 100:",
      "🕵️ We know where you live. And what your activity is. **{time} left** (reset {reset}):",
      "🔔 Last orders in **{time}**! Reset at {reset}. Still thirsty for activity:",
      "📞 This is your friendly reminder. Friendly, for now. **{time} left** until {reset}:",
      "🚧 The door closes in **{time}** (reset {reset}). Get those 100 in:",
      "> \"It's nothing personal, it's activity.\"\n**{time} left**, reset {reset}. Still under 100:"
    ],
    eveFew: [
      "🎯 So close! Nearly everyone made it. **{time} left** (reset {reset}) and just these still need 100:",
      "👀 The whole family is looking at you. **{time} left** (reset {reset}):",
      "🏁 One last push and the whole family's at 100. **{time} left** (reset {reset}):",
      "🕯️ It all comes down to this. **{time} left** (reset {reset}). No pressure. Lots of pressure:",
      "🔦 The spotlight is on these last few. **{time} left** until {reset}:"
    ],
    eveTail: [
      "Today's activity decides tomorrow's family bonus. Let's go! 💪",
      "100 activity, or you explain it to Nonna. 🍝",
      "Tomorrow's family bonus is on the line. Don't be that person. 😉",
      "It's not much. It's just everything. Tomorrow's bonus depends on it. 💪",
      "Do it for the family. Do it for the bonus. Do it so this bot stops naming you. 🤖",
      "A little activity now, a bigger family bonus tomorrow. That's the deal. 🤝",
      "Nobody's getting whacked over this. Probably. Just get the 100. 😇",
      "Go on. It'll take less time than reading all of these reminders. ⏰"
    ],
    eveAll: [
      "🎉 **Everyone has reached 100 activity today!** What a family! 💯",
      "# 💯 EVERYONE\nThe whole family hit 100 today. No names to name. Nonna is crying. 🥹",
      "🥂 Not one name on the list tonight. **Everyone made 100!** Drinks on the house. 🍾",
      "🤖 I had a whole speech ready and nobody needs it. **Everyone's at 100!** I'm so proud. 💯",
      "📋 The list is empty. The boss is smiling. That's scarier, but still: **everyone hit 100!** 🎩",
      "🏆 **100/100 from the whole family today!** Other families are taking notes. 🗒️"
    ],

    boostOn: [
      "🚀 **+{pct}% {name} boost** is active for the whole family until {until}! Time to grind! 💪",
      "🍾 Fresh **+{pct}% {name} boost**, running until {until}. No excuses now! 🚀",
      "### 🚀 +{pct}% {name}\nActive for everyone until {until}. The family paid for it, so go use it!",
      "⛽ The tank is full: **+{pct}% {name} boost** until {until}. Floor it! 🏎️",
      "🤌 Courtesy of the treasury: **+{pct}% {name}** for all of us until {until}. Don't waste it!",
      "📣 Attention family! **+{pct}% {name} boost** is on until {until}. If you're reading this, you're late. 🏃",
      "🍝 Double helpings! **+{pct}% {name} boost** until {until}. Grind now, sleep later. 😴"
    ],

    signHead: [
      "📣 **War sign-up reminder**", "📣 **Who's in?** War sign-ups are open", "📋 **The list is looking short**", "🔔 **Roll call for the next war**",
      "🚗 **There's still room in the car**", "🫵 **The family wants you**", "### 📣 War sign-ups: you know who you are"
    ],
    signTail: [
      "Register on the Family tab in the game. Every fighter counts! 💪",
      "Register on the Family tab. Takes one click, and you get to tell everyone you were there. 🎖️",
      "Family tab, one button. We'll wait. Not for long. ⏰",
      "Register on the Family tab. Nonna is watching. 👵",
      "Family tab → Register. Empty seats don't win wars. 💺",
      "Register on the Family tab before the bot starts using your full name. 😇"
    ],

    awardsHead: [
      "🏅 **Monthly awards · {month}** 🏅", "# 🏅 Monthly awards · {month}", "🎭 **The Syndicate Oscars · {month}** 🏆", "🥇 **{month}: the family gives out the medals** 🥇",
      "🍾 **{month} is done. Time to hand out the trophies.**", "📜 **The honors list · {month}** 🏅"
    ],
    awardsEnd: [
      "Congrats everyone! 🥂", "Winners eat first. 🍝", "Next month, it could be you. Or it could be them again. 🥂", "No recounts. Vinnie has spoken. 🧾", "Speeches are limited to 10 seconds. 🎤", "Everyone else: there's always next month. 💪"
    ]
  };
  var CARD_CHANCE = 0.3, CARD_COLORS = [0xee5d58, 0xffbf30, 0x4db2ff, 0x93d36d, 0xb06cff, 0xff7ac6, 0x2fd6c3];
  // A line from LINES[key], with no recent repeats: about half the pool has to go by before a line can come back.
  function say(key, vars) {
    var pool = LINES[key], seen = {}, text;
    try { seen = JSON.parse(localStorage.getItem("syn-lines")) || {}; } catch (e) {}
    var recent = (seen[key] || []).filter(function (i) { return i < pool.length; }), open = pool.map(function (x, i) { return i; }).filter(function (i) { return recent.indexOf(i) < 0; });
    var pick = open[Math.floor(Math.random() * open.length)];
    seen[key] = recent.concat([pick]).slice(-Math.floor(pool.length / 2));
    try { localStorage.setItem("syn-lines", JSON.stringify(seen)); } catch (e) {}
    text = pool[pick];
    Object.keys(vars || {}).forEach(function (k) { text = text.split("{" + k + "}").join(vars[k]); });
    return text;
  }
  // A family chat post with a changing bot name and, some of the time, as a coloured card instead of plain text.
  // Pings don't work inside a card, so the linked people are mentioned above it.
  function dress(who, text, users) {
    var msg = shout(text, users);
    msg.as = say("as" + who);
    if (Math.random() < CARD_CHANCE) {
      msg.content = (users || []).map(function (u) { return "<@" + u + ">"; }).join(" ");
      msg.embeds = [{ description: text.slice(0, 4000), color: CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)] }];
    }
    return msg;
  }
  // Posts are bundled per channel (webhook + bot name): everything that comes up while the channel is busy goes out as one
  // message once nothing new has arrived for a while, so opening the game in the morning doesn't flood Discord.
  // Catch-up posts (from the first 10 minutes after the game was opened) don't ping people by name; role pings
  // (@family for upcoming wars) stay. Edits (msgId) and test buttons (now) go out at once.
  var STARTED = Date.now(), CATCHUP = 10 * 60 * 1000, QUIET_START = 60 * 1000, QUIET = 15 * 1000, MAX_HOLD = 5 * 60 * 1000;
  var queues = {};
  function post(url, payload, msgId, now) {
    if (msgId || now) { return sendNow(url, msgId ? payload : bundle([payload], false)[0], msgId); }
    var key = url + "|" + (payload.username || ""), q = queues[key] = queues[key] || { url: url, items: [], first: Date.now(), timer: null };
    return new Promise(function (resolve, reject) {
      q.items.push({ payload: payload, resolve: resolve, reject: reject });
      clearTimeout(q.timer);
      var quiet = Date.now() - STARTED < CATCHUP ? QUIET_START : QUIET;
      q.timer = setTimeout(function () { flush(key); }, Math.max(0, Math.min(quiet, q.first + MAX_HOLD - Date.now())));
    });
  }
  function flush(key) {
    var q = queues[key];
    delete queues[key];
    var msgs = bundle(q.items.map(function (i) { return i.payload; }), q.first - STARTED < CATCHUP), result = null;
    msgs.reduce(function (p, m) { return p.then(function () { return sendNow(q.url, m).then(function (r) { result = r; }); }); }, Promise.resolve())
      .then(function () { q.items.forEach(function (i) { i.resolve(result); }); }, function (e) { q.items.forEach(function (i) { i.reject(e); }); });
  }
  // Joins payloads into as few Discord messages as fit: 2,000 characters of text, 10 embeds and ~6,000 characters of embeds each.
  function bundle(list, catchUp) {
    var out = [], cur = null;
    list.forEach(function (p) {
      var c = catchUp && p.pingsOnly && !p.keepPings ? "" : p.content || "", e = p.embeds || [], am = p.allowed_mentions || {}, size = JSON.stringify(e).length; // no pings then, so no bare mentions
      if (!cur || cur.content.length + c.length + 2 > 2000 || cur.embeds.length + e.length > 10 || cur.size + size > 5500) {
        cur = { username: p.username, as: p.as, posts: 0, content: "", embeds: [], size: 0, parse: [], roles: [], users: [] };
        out.push(cur);
      }
      cur.posts++;
      if (p.pingsOnly) { c = c.split(" ").filter(function (x) { return cur.content.indexOf(x) < 0; }).join(" "); } // already mentioned in this message
      if (c) { cur.content += (cur.content ? "\n\n" : "") + c; }
      cur.embeds = cur.embeds.concat(e); cur.size += size;
      ["parse", "roles", "users"].forEach(function (k) {
        if (k === "users" && catchUp && !p.keepPings) { return; } // names still show, they just don't ping
        (am[k] || []).forEach(function (v) { if (cur[k].indexOf(v) < 0) { cur[k].push(v); } });
      });
    });
    return out.map(function (m) {
      var msg = { username: m.posts === 1 && m.as || m.username, allowed_mentions: { parse: m.parse, roles: m.roles, users: m.users.slice(0, 100) } };
      if (m.content) { msg.content = m.content.slice(0, 2000); }
      if (m.embeds.length) { msg.embeds = m.embeds; }
      return msg;
    });
  }
  // Sends one message (or, with msgId, edits one this webhook posted earlier) and resolves with Discord's copy of it.
  function sendNow(url, payload, msgId) {
    return fetch(msgId ? url + "/messages/" + msgId : url + "?wait=true", { method: msgId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(function (r) {
        if (!r.ok) {
          return r.text().then(function (t) {
            var e = new Error(r.status === 404 ? (msgId ? "the message is gone" : "Discord doesn't know this webhook (deleted?)") : "Discord said " + r.status + " " + t.slice(0, 80));
            e.status = r.status; throw e;
          });
        }
        return r.json().catch(function () { return null; });
      });
  }

  // Levels gained today: compared with the levels last seen before the reset (or, failing that, the first ones seen after it).
  // Stored as { day: {key, levels: {id: level}, from}, seen: {at, levels} }.
  function trackDay(list, at) {
    var mid = dayStart(Date.now()), today = dayKey(mid), s = load(), cur = {}, changed = false;
    if (at < mid) { return; } // still yesterday's numbers in the cache
    list.forEach(function (m) { cur[m.id] = m.level; });
    if (!s.day || s.day.key !== today) {
      var prev = s.seen && s.seen.at < mid && s.seen.at >= mid - 864e5 ? s.seen : null;
      s.day = { key: today, levels: prev ? prev.levels : cur, from: prev ? prev.at : at };
      changed = true;
    }
    list.forEach(function (m) { if (!(m.id in s.day.levels)) { s.day.levels[m.id] = m.level; changed = true; } });
    if (!s.seen || s.seen.at !== at) { s.seen = { at: at, levels: cur }; changed = true; }
    if (changed) { save(s); }
  }
  function gainsToday(s) {
    return s.day && s.day.key === dayKey(dayStart(Date.now())) ? s.day.levels : null;
  }

  // Daily history for streaks, the weekly summary and the leaderboard: s.hist = {"YYYY-MM-DD": {id: {n: name, ap, lv, g}}}.
  // A day is written once its points are final (the morning after); level and gold are the first ones seen after it ended.
  var DAY = 864e5, HOUR = 3600000, HIST_DAYS = 70;
  function recordHistory() {
    var mid = dayStart(Date.now());
    if (!last || last.at < mid + GRACE) { return; }
    var s = load(), day = dayKey(mid - 1), had = s.hist && s.hist[day], rec = {};
    members(last.fam).forEach(function (m) {
      var was = had && had[m.id];
      rec[m.id] = { n: m.name, ap: m.yesterday, lv: was ? was.lv : m.level, g: was ? was.g : m.gold };
    });
    if (had && JSON.stringify(had) === JSON.stringify(rec)) { return; }
    s.hist = s.hist || {};
    s.hist[day] = rec;
    var oldest = dayKey(mid - HIST_DAYS * DAY);
    Object.keys(s.hist).forEach(function (k) { if (k < oldest) { delete s.hist[k]; } });
    ensureRecords(s);
    addRecordDay(s, day, rec, mid);
    save(s);
  }

  // Records for the leaderboard, kept apart from the 70-day history so they never expire:
  // s.records = {best: {id: {name, ap, day}} each member's best single day, fam: {ap, day} best family total,
  // streak: {id, name, n} longest run at 100+, wars: {won, lost}, mvps: {id: {name, n}}}. Counted since the script was installed.
  function ensureRecords(s) {
    if (s.records) { return s.records; }
    s.records = { best: {}, fam: null, streak: null, wars: { won: 0, lost: 0 }, mvps: {} };
    var h = s.hist || {};
    Object.keys(h).sort().forEach(function (k) { addRecordDay(s, k, h[k], null); }); // backfill from the history saved so far
    return s.records;
  }
  function addRecordDay(s, day, rec, upTo) {
    var r = s.records, total = 0;
    r.best = r.best || {};
    Object.keys(rec).forEach(function (id) {
      total += rec[id].ap;
      var b = r.best[id];
      if (rec[id].ap > 0 && (!b || rec[id].ap > b.ap || b.day === day)) { r.best[id] = { name: rec[id].n, ap: rec[id].ap, day: day }; }
    });
    if (!r.fam || total > r.fam.ap) { r.fam = { ap: total, day: day }; }
    if (upTo) {
      Object.keys(rec).forEach(function (id) {
        var n = fullStreak(s, id, upTo);
        if (n && (!r.streak || n > r.streak.n)) { r.streak = { id: id, name: rec[id].n, n: n }; }
      });
    }
  }
  // Days in a row at 0 points, counting back from the day before `upTo` (a day start). A day without data ends the run.
  function idleDays(s, id, upTo) {
    var n = 0;
    for (var t = upTo - DAY; ; t -= DAY) {
      var r = s.hist && s.hist[dayKey(t)];
      if (!r || !r[id] || r[id].ap > 0) { return n; }
      n++;
    }
  }
  function idleAll(s, list, upTo) {
    var o = {};
    list.forEach(function (m) { o[m.id] = idleDays(s, m.id, upTo); });
    return o;
  }
  // Game weeks run Monday to Sunday in game days (00:00 UTC).
  function weekStart(t) { var d = dayStart(t); return d - ((new Date(d).getUTCDay() + 6) % 7) * DAY; }
  function shortDay(t) { return new Date(t).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }); }
  function medal(i) { return ["🥇", "🥈", "🥉"][i] || "`" + (i < 9 ? " " : "") + (i + 1) + ".`"; }

  // Weekly summary for `days` game days starting at `from`: totals, days at 100, levels and gold over the week.
  function buildWeekly(s, from, days, famName) {
    var keys = [], h = s.hist || {};
    for (var i = 0; i < days; i++) { keys.push(dayKey(from + i * DAY)); }
    var recorded = keys.filter(function (k) { return h[k]; });
    if (!recorded.length) { return null; }
    var before = h[dayKey(from - DAY)], ids = {};
    if (last) { members(last.fam).forEach(function (m) { ids[m.id] = m.name; }); }
    else { recorded.forEach(function (k) { Object.keys(h[k]).forEach(function (id) { ids[id] = h[k][id].n; }); }); }
    var rows = Object.keys(ids).map(function (id) {
      var r = { id: id, name: ids[id], total: 0, seen: 0, full: 0, first: before && before[id], lastRec: null };
      recorded.forEach(function (k) {
        var d = h[k][id];
        if (!d) { return; }
        r.total += d.ap; r.seen++; if (d.ap >= FULL) { r.full++; }
        if (!r.first) { r.first = d; }
        r.lastRec = d;
      });
      r.levels = r.first && r.lastRec ? r.lastRec.lv - r.first.lv : 0;
      r.gold = r.first && r.lastRec ? r.lastRec.g - r.first.g : 0;
      return r;
    }).filter(function (r) { return r.seen; });
    rows.sort(function (a, b) { return b.total - a.total || b.full - a.full; });
    var total = 0, levels = 0, gold = 0;
    var lines = rows.map(function (r, i) {
      total += r.total; levels += Math.max(0, r.levels); gold += Math.max(0, r.gold);
      return medal(i) + " **" + md(r.name) + "** — " + r.total.toLocaleString("en-US") + " AP · " + r.full + "/" + r.seen + " days at 100"
        + (r.levels > 0 ? " · +" + r.levels + " Lv" : "") + (r.gold > 0 ? " · 🪙 +" + r.gold : "");
    });
    var weak = rows.filter(function (r) { return r.full * 2 < r.seen; }).map(function (r) { return md(r.name) + " (" + r.full + "/" + r.seen + ")"; });
    var idle = rows.map(function (r) { return { r: r, n: idleDays(s, r.id, from + days * DAY) }; }).filter(function (x) { return x.n >= 3; })
      .map(function (x) { return md(x.r.name) + " (" + x.n + " days)"; });
    if (weak.length || idle.length) { lines.push(""); }
    if (weak.length) { lines.push("⚠️ **Under 100 on most days:** " + weak.join(", ")); }
    if (idle.length) { lines.push("💤 **No activity lately:** " + idle.join(", ")); }
    var partial = days < 7;
    return {
      username: "Syndicate Activity",
      allowed_mentions: { parse: [] },
      embeds: [{
        title: "📅 " + (famName || "Family") + " · " + (partial ? "this week so far" : "weekly summary"),
        description: lines.join("\n"),
        color: 0xffbf30,
        footer: { text: shortDay(from) + " – " + shortDay(from + (days - 1) * DAY) + " · data for " + recorded.length + " of " + days + " days"
          + " · total " + total.toLocaleString("en-US") + " AP · +" + levels + " levels · 🪙 +" + gold },
        timestamp: new Date().toISOString()
      }]
    };
  }
  function sendWeekly(manual) {
    var s = load(), mid = dayStart(Date.now()), ws = weekStart(mid), from = ws - 7 * DAY, days = 7;
    if (!s.webhook || sending) { return; }
    // By hand during the week: the week so far. Otherwise (and on Mondays): the week that just ended.
    if (manual && mid > ws) { from = ws; days = (mid - ws) / DAY; }
    var payload = buildWeekly(s, from, days, last && last.fam.name);
    if (!payload) { if (manual) { alert("There's no saved activity for that week yet. The history starts with the first day after installing."); } return; }
    sending = true; error = ""; note = ""; redraw();
    post(s.webhook, payload).then(function () {
      var now = load(); if (days === 7) { now.weekSent = dayKey(from); } delete now.weekLock; save(now);
      note = manual ? "Weekly summary sent." : "";
    }, function (e) {
      var now = load(); delete now.weekLock; save(now);
      error = String(e && e.message || e); retryAt = Date.now() + RETRY;
    }).then(function () { sending = false; redraw(); });
  }
  // The weekly summary goes out right after the first daily report of a new week (normally Monday morning).
  function autoWeekly() {
    var s = load(), mid = dayStart(Date.now()), prev = weekStart(mid) - 7 * DAY;
    if (!s.webhook || sending || !last || Date.now() < retryAt || s.weekSent === dayKey(prev)) { return; }
    if (s.sentDay !== dayKey(mid - 1)) { return; }
    var any = false;
    for (var i = 0; i < 7; i++) { if (s.hist && s.hist[dayKey(prev + i * DAY)]) { any = true; } }
    if (!any) { return; }
    if (s.weekLock && Date.now() - s.weekLock < 60000) { return; }
    s.weekLock = Date.now(); save(s);
    sendWeekly(false);
  }

  // Level milestones: a congratulation in the family chat (its own webhook) when someone reaches level 10, 20, 30, …
  // s.lvSeen = {id: last level seen}. Starts quietly: levels reached before it was switched on aren't announced.
  var STEP = 10;
  var lvBusy = false, lvError = "", lvRetryAt = 0;
  // Members linked to their Discord account (s.links = {member id: Discord user id}) get pinged by name;
  // their user id is added to `users`, the only accounts the message may ping.
  function who(s, m, users) {
    var uid = s.links && s.links[m.id];
    if (uid && users.indexOf(uid) < 0) { users.push(uid); }
    return uid ? "<@" + uid + "> (**" + md(m.name) + "**)" : "**" + md(m.name) + "**";
  }
  function milestoneLine(s, m, lv, users) {
    return say(lv % 50 === 0 ? "levelBig" : lv <= 30 ? "levelLow" : lv <= 70 ? "levelMid" : "levelHigh", { who: who(s, m, users), lv: lv, next: lv + STEP });
  }
  function checkMilestones() {
    var s = load();
    if (!s.lvHook || !last || lvBusy || Date.now() < lvRetryAt) { return; }
    var list = members(last.fam), seen = s.lvSeen, before = {}, ups = [], changed = false;
    if (!seen) { s.lvSeen = {}; list.forEach(function (m) { s.lvSeen[m.id] = m.level; }); save(s); return; }
    list.forEach(function (m) {
      var was = seen[m.id];
      if (was === m.level) { return; }
      changed = true; before[m.id] = was; seen[m.id] = m.level;
      var top = Math.floor(m.level / STEP) * STEP;
      if (was != null && m.level > was && top > was && top >= STEP) { ups.push({ m: m, lv: top }); } // new members start quietly
    });
    if (!changed) { return; }
    save(s); // saved before posting so a second game tab doesn't post it too
    if (!ups.length) { return; }
    lvBusy = true;
    var users = [];
    var lines = ups.map(function (u) { return milestoneLine(s, u.m, u.lv, users); });
    post(s.lvHook, dress("Family", lines.join("\n\n"), users)).then(function () { lvError = ""; }, function (e) {
      // Put the old levels back so the same milestone is tried again later.
      var now = load(); ups.forEach(function (u) { if (now.lvSeen) { now.lvSeen[u.m.id] = before[u.m.id]; } }); save(now);
      lvError = String(e && e.message || e); lvRetryAt = Date.now() + RETRY;
    }).then(function () { lvBusy = false; redraw(); });
  }

  // Activity milestones: a shout-out in the family chat (same webhook and links as the level-ups) when someone
  // reaches 500 or 1,000 points in one game day, louder the higher it goes.
  // s.apHit = {day, ids: {id: highest mark announced that day}}. The very first run stays quiet about marks already reached.
  var AP_MARKS = [500, 1000];
  var apBusy = false, apError = "", apRetryAt = 0;
  function activityLine(s, m, mark, users) {
    return say("ap" + mark, { who: who(s, m, users) });
  }
  function checkActivity() {
    var s = load(), mid = dayStart(Date.now()), day = dayKey(mid);
    if (!s.lvHook || !last || apBusy || Date.now() < apRetryAt || last.at < mid) { return; } // no stale numbers from before the reset
    var quiet = !s.apHit, hits = [], before = {}, changed = false;
    if (!s.apHit || s.apHit.day !== day) { s.apHit = { day: day, ids: {} }; changed = true; }
    members(last.fam).forEach(function (m) {
      var top = 0, had = s.apHit.ids[m.id] || 0;
      AP_MARKS.forEach(function (k) { if (m.today >= k) { top = k; } });
      if (top <= had) { return; }
      before[m.id] = had; s.apHit.ids[m.id] = top; changed = true;
      if (!quiet) { hits.push({ m: m, mark: top }); } // only the highest new mark, if several were passed since the last look
    });
    if (changed) { save(s); } // saved before posting so a second game tab doesn't post it too
    if (!hits.length) { return; }
    apBusy = true;
    var users = [];
    hits.sort(function (a, b) { return a.mark - b.mark; });
    var text = hits.map(function (h) { return activityLine(s, h.m, h.mark, users); }).join("\n\n");
    post(s.lvHook, dress("Family", text, users)).then(function () { apError = ""; }, function (e) {
      var now = load();
      if (now.apHit && now.apHit.day === day) { hits.forEach(function (h) { now.apHit.ids[h.m.id] = before[h.m.id]; }); save(now); }
      apError = String(e && e.message || e); apRetryAt = Date.now() + RETRY;
    }).then(function () { apBusy = false; redraw(); });
  }

  // Posts for the features below go through here: one at a time per feature, a retry pause after a failure,
  // and `undo` to put the "already posted" marks back when Discord refuses.
  var busy = {}, fails = {}, retryOf = {};
  function canPost(name) { return !busy[name] && Date.now() >= (retryOf[name] || 0); }
  function postFor(name, url, payload, undo) {
    busy[name] = true;
    return post(url, payload).then(function () { delete fails[name]; }, function (e) {
      if (undo) { undo(); }
      fails[name] = String(e && e.message || e); retryOf[name] = Date.now() + RETRY;
    }).then(function () { busy[name] = false; redraw(); });
  }
  function shout(text, users) { return { username: "Syndicate Activity", allowed_mentions: { parse: [], users: users || [] }, content: text.slice(0, 2000) }; }

  // Level rush: a shout-out in the family chat when someone gains 3 levels in one game day, and a louder one at 5
  // (counted like "levels today" in the panel). Only the highest new mark is posted if both were passed since the last look.
  // s.lvRush = {day, ids: {id: highest mark announced that day}}. The very first run stays quiet about gains already made.
  var RUSH_MARKS = [3, 5];
  function checkLevelRush() {
    var s = load(), mid = dayStart(Date.now()), day = dayKey(mid), base = gainsToday(s);
    if (!s.lvHook || !last || !canPost("rush") || last.at < mid || !base) { return; }
    var quiet = !s.lvRush, hits = [], before = {}, changed = false;
    if (!s.lvRush || s.lvRush.day !== day) { s.lvRush = { day: day, ids: {} }; changed = true; }
    members(last.fam).forEach(function (m) {
      var n = base[m.id] == null ? 0 : m.level - base[m.id], top = 0, had = s.lvRush.ids[m.id] || 0;
      RUSH_MARKS.forEach(function (k) { if (n >= k) { top = k; } });
      if (top <= had) { return; }
      before[m.id] = had; s.lvRush.ids[m.id] = top; changed = true;
      if (!quiet) { hits.push({ m: m, n: n, mark: top }); }
    });
    if (changed) { save(s); } // saved before posting so a second game tab doesn't post it too
    if (!hits.length) { return; }
    var users = [];
    var text = hits.map(function (h) { return say("rush" + h.mark, { who: who(s, h.m, users), n: h.n }); }).join("\n\n");
    postFor("rush", s.lvHook, dress("Family", text, users), function () {
      var now = load();
      if (now.lvRush && now.lvRush.day === day) { hits.forEach(function (h) { now.lvRush.ids[h.m.id] = before[h.m.id]; }); save(now); }
    });
  }

  // 100+ streaks: a shout-out in the family chat at 7, 14, 30, 60 and 100 days in a row at 100 points or more.
  // Checked once the finished day is in the history. s.streakSaid = {id: {start, k}}: the run (by its first day) and the highest mark posted.
  var STREAK_MARKS = [7, 14, 30, 60, 100];
  function fullStreak(s, id, upTo) {
    var n = 0;
    for (var t = upTo - DAY; ; t -= DAY) {
      var r = s.hist && s.hist[dayKey(t)];
      if (!r || !r[id] || r[id].ap < FULL) { return n; }
      n++;
    }
  }
  function checkStreaks() {
    var s = load(), mid = dayStart(Date.now());
    if (!s.lvHook || !last || !canPost("streak") || !(s.hist && s.hist[dayKey(mid - DAY)])) { return; }
    var said = s.streakSaid = s.streakSaid || {}, before = {}, hits = [];
    members(last.fam).forEach(function (m) {
      var n = fullStreak(s, m.id, mid), k = 0, start = dayKey(mid - n * DAY), was = said[m.id];
      STREAK_MARKS.forEach(function (x) { if (n >= x) { k = x; } });
      if (!k || was && was.start === start && was.k >= k) { return; }
      before[m.id] = was; said[m.id] = { start: start, k: k }; hits.push({ m: m, k: k });
    });
    if (!hits.length) { return; }
    save(s);
    var users = [];
    var text = hits.map(function (h) { return say("streak" + h.k, { who: who(s, h.m, users) }); }).join("\n\n");
    postFor("streak", s.lvHook, dress("Family", text, users), function () {
      var now = load(); hits.forEach(function (h) { if (before[h.m.id]) { now.streakSaid[h.m.id] = before[h.m.id]; } else { delete now.streakSaid[h.m.id]; } }); save(now);
    });
  }

  // Family level: progress for the leaderboard, and a celebration in the family chat when it goes up. s.famLv = last level seen.
  function famProgress(fam) {
    if (typeof fam.level !== "number") { return null; }
    var max = fam.nextLevelXp == null, span = (fam.nextLevelXp || 0) - (fam.levelXp || 0);
    var pct = max ? 100 : span > 0 ? Math.max(0, Math.min(99, Math.floor(100 * (fam.xp - fam.levelXp) / span))) : 0;
    return { level: fam.level, pct: pct, max: max };
  }
  function progressLine(fam) {
    var p = famProgress(fam);
    if (!p) { return ""; }
    var n = Math.round(p.pct / 10), eta = famEta(load(), fam);
    return "🏰 **Family level " + p.level + "**" + (p.max ? " · max level" : " · " + new Array(n + 1).join("▰") + new Array(11 - n).join("▱") + " " + p.pct + "% to level " + (p.level + 1) + (eta ? " · about " + etaWords(eta.ms) : ""));
  }
  // Time to the next family level. The game doesn't say what family XP comes from, so it's measured: s.famXp keeps the family's XP
  // every half hour for a week, and the pace is the change since the oldest of those. Until there are 6 hours of that, the average
  // AP per day from the history stands in, assuming 1 AP is 1 XP, and is marked as a rough estimate.
  var FAM_XP_EVERY = 30 * 60000, FAM_XP_KEEP = 7 * 864e5, FAM_XP_MIN = 6 * 36e5;
  function trackFamXp() {
    var fam = last && last.fam;
    if (!fam || typeof fam.xp !== "number") { return; }
    var s = load(), log = s.famXp || [], now = Date.now(), end = log[log.length - 1];
    if (end && now - end.t < FAM_XP_EVERY) { return; }
    s.famXp = log.filter(function (x) { return now - x.t <= FAM_XP_KEEP; }).concat([{ t: now, xp: fam.xp }]);
    save(s);
  }
  function famEta(s, fam) {
    if (typeof fam.xp !== "number" || fam.nextLevelXp == null) { return null; }
    var left = fam.nextLevelXp - fam.xp, now = Date.now(), first = (s.famXp || []).filter(function (x) { return now - x.t <= FAM_XP_KEEP; })[0];
    if (left <= 0) { return null; }
    if (first && now - first.t >= FAM_XP_MIN && fam.xp > first.xp) {
      var rate = (fam.xp - first.xp) / (now - first.t);
      return { left: left, ms: left / rate, perDay: rate * 864e5, how: now - first.t >= 864e5 ? "measured" : "early", since: first.t };
    }
    // Finished days only: today isn't over.
    var h = s.hist || {}, mid = Math.floor(now / 864e5) * 864e5, totals = [];
    for (var i = 1; i <= 7; i++) {
      var r = h[new Date(mid - i * 864e5).toISOString().slice(0, 10)];
      if (r) { totals.push(Object.keys(r).reduce(function (a, id) { return a + (r[id].ap || 0); }, 0)); }
    }
    if (!totals.length) { return null; }
    var avg = totals.reduce(function (a, v) { return a + v; }, 0) / totals.length;
    return avg > 0 ? { left: left, ms: left / avg * 864e5, perDay: avg, how: "rough", days: totals.length } : null;
  }
  function etaWords(ms) {
    var h = ms / 36e5;
    return h >= 48 ? Math.round(h / 24) + " days" : h >= 2 ? Math.round(h) + " hours" : "1 hour";
  }
  function famEtaHtml(s, fam) {
    if (typeof fam.level !== "number") { return ""; }
    if (fam.nextLevelXp == null) { return "<div class='lvline'>🏰 Family level <b>" + fam.level + "</b> · max level</div>"; }
    var eta = famEta(s, fam), to = fam.level + 1;
    if (!eta) { return "<div class='lvline' title='Starts showing a time after a day of history, or 6 hours of watching the family XP.'>🏰 Level <b>" + fam.level + "</b> → " + to + (typeof fam.xp === "number" ? " · <b>" + Math.max(0, fam.nextLevelXp - fam.xp).toLocaleString("en-US") + "</b> XP to go" : "") + "</div>"; }
    var tip = eta.how === "rough" ? "Rough: assumes 1 AP is 1 XP, from an average of " + Math.round(eta.perDay).toLocaleString("en-US") + " AP a day over the last " + eta.days + " day" + (eta.days === 1 ? "" : "s") + ". It switches to the real XP gain after 6 hours of watching it."
      : "The family gained about " + Math.round(eta.perDay).toLocaleString("en-US") + " XP a day since " + new Date(eta.since).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" }) + (eta.how === "early" ? ". Under a day of data so far, so this still swings with the time of day." : ".");
    return "<div class='lvline' title='" + esc(tip) + "'>🏰 Level <b>" + fam.level + "</b> → " + to + " · <b>" + eta.left.toLocaleString("en-US") + "</b> XP to go · about <b>" + leftText(eta.ms) + "</b>" + (eta.how === "measured" ? "" : " <span class='idle'>(rough)</span>") + "</div>";
  }
  function checkFamilyLevel() {
    var s = load(), lv = last && last.fam.level;
    if (!s.lvHook || typeof lv !== "number" || !canPost("famlv")) { return; }
    if (s.famLv == null || lv < s.famLv) { s.famLv = lv; save(s); return; } // first look stays quiet
    if (lv === s.famLv) { return; }
    var was = s.famLv; s.famLv = lv; save(s);
    var eta = famEta(s, last.fam);
    postFor("famlv", s.lvHook, dress("Family", say("famLevel", { fam: md(last.fam.name || "The family"), lv: lv }) + (eta ? "\n-# Next up: level " + (lv + 1) + " in about " + etaWords(eta.ms) : "")),
      function () { var now = load(); now.famLv = was; save(now); });
  }

  // Monthly awards in the family chat, the first time the game is open in a new month (game days, 00:00 UTC).
  // Needs at least a week of history for that month, otherwise the month is skipped. s.monthSent = "YYYY-MM".
  var AWARD_MIN_DAYS = 7;
  function monthStart(t) { var d = new Date(dayStart(t)); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1); }
  function monthLabel(t) { return new Date(t).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }); }
  function buildAwards(s, from, to, partial) {
    var h = s.hist || {}, keys = [], ids = {}, users = [];
    for (var t = from; t < to; t += DAY) { keys.push(dayKey(t)); }
    var recorded = keys.filter(function (k) { return h[k]; });
    if (!recorded.length) { return null; }
    var before = h[dayKey(from - DAY)];
    (last ? members(last.fam) : []).forEach(function (m) { ids[m.id] = m; });
    var rows = Object.keys(ids).map(function (id) {
      var r = { m: ids[id], total: 0, full: 0, best: 0, run: 0, first: before && before[id], lastRec: null };
      keys.forEach(function (k) {
        var d = h[k] && h[k][id];
        if (!d) { r.run = 0; return; }
        r.total += d.ap;
        if (d.ap >= FULL) { r.full++; r.run++; r.best = Math.max(r.best, r.run); } else { r.run = 0; }
        if (!r.first) { r.first = d; }
        r.lastRec = d;
      });
      r.levels = r.first && r.lastRec ? r.lastRec.lv - r.first.lv : 0;
      r.gold = r.first && r.lastRec ? r.lastRec.g - r.first.g : 0;
      return r;
    }).filter(function (r) { return r.lastRec; });
    function top(key, min, unit, count) {
      var list = rows.filter(function (r) { return r[key] >= min; }).sort(function (a, b) { return b[key] - a[key]; }).slice(0, count);
      return list.length ? list.map(function (r, i) { return (count > 1 ? medal(i) + " " : "") + who(s, r.m, users) + " — " + r[key].toLocaleString("en-US") + unit; }).join("\n") : "Nobody yet.";
    }
    var text = (partial ? "🏅 **Monthly awards so far · " + monthLabel(from) + "** 🏅" : say("awardsHead", { month: monthLabel(from) })) + "\n\n"
      + "🏆 **Most active**\n" + top("total", 1, " AP", 3) + "\n\n"
      + "✅ **Most days at 100+**\n" + top("full", 1, " days", 1) + "\n\n"
      + "🔥 **Longest 100+ streak**\n" + top("best", 2, " days in a row", 1) + "\n\n"
      + "📈 **Most levels gained**\n" + top("levels", 1, " levels", 1) + "\n\n"
      + "🪙 **Top donor**\n" + top("gold", 1, " gold", 1) + "\n\n"
      + "-# Based on " + recorded.length + " of " + keys.length + " days. " + say("awardsEnd");
    return { text: text, users: users, days: recorded.length };
  }
  function sendAwards(manual) {
    var s = load(), mid = dayStart(Date.now()), ms = monthStart(mid), from = monthStart(ms - DAY), to = ms;
    if (!s.lvHook || !last || !canPost("month")) { return; }
    if (manual) { from = ms; to = mid; if (to <= from) { alert("The month just started. There's nothing to show yet."); return; } }
    var a = buildAwards(s, from, to, manual);
    if (!a) { if (manual) { alert("There's no saved activity for this month yet."); } return; }
    if (!manual) { s.monthSent = monthKey(from); save(s); if (a.days < AWARD_MIN_DAYS) { return; } }
    postFor("month", s.lvHook, dress("Family", a.text, a.users), manual ? null : function () { var now = load(); delete now.monthSent; save(now); });
  }
  function monthKey(t) { return new Date(t).toISOString().slice(0, 7); }
  function autoMonthly() {
    var s = load(), mid = dayStart(Date.now()), prev = monthKey(monthStart(mid) - DAY);
    if (!s.lvHook || !last || last.at < mid + GRACE || s.monthSent === prev || !canPost("month")) { return; } // fresh numbers: last month's final day is saved
    sendAwards(false);
  }

  // Instant alerts in the leadership chat (the daily report's webhook): who joined, who left, and who just reached
  // 3 days in a row at 0 points (once per idle run). s.roster = {id: name}; s.idleSaid = {id: first idle day}.
  var IDLE_ALERT = 3;
  function checkRoster() {
    var s = load(), mid = dayStart(Date.now());
    if (!s.webhook || !last || !canPost("alerts")) { return; }
    var list = members(last.fam), now = {}, lines = [], changed = false;
    list.forEach(function (m) { now[m.id] = m.name; });
    if (!s.roster) { s.roster = now; save(s); return; } // first look stays quiet
    var oldRoster = s.roster, oldIdle = JSON.parse(JSON.stringify(s.idleSaid || {}));
    list.forEach(function (m) {
      if (oldRoster[m.id]) { return; }
      lines.push("➕ **" + md(m.name) + "** joined the family (level " + m.level + ").");
      s.joinSeen = s.joinSeen || {}; s.joinSeen[m.id] = Date.now(); changed = true; // for the war attendance, if the game doesn't say
    });
    Object.keys(oldRoster).forEach(function (id) { if (!(id in now)) { lines.push("➖ **" + md(oldRoster[id]) + "** left the family."); } });
    if (JSON.stringify(oldRoster) !== JSON.stringify(now)) { s.roster = now; changed = true; }
    s.idleSaid = s.idleSaid || {};
    list.forEach(function (m) {
      var n = idleDays(s, m.id, mid), start = dayKey(mid - n * DAY);
      if (n < IDLE_ALERT || s.idleSaid[m.id] === start || awayUntil(s, m.id)) { return; }
      s.idleSaid[m.id] = start; changed = true;
      // Linked members show as their Discord name, without a ping.
      lines.push("💤 " + who(s, m, []) + " has had **0 activity for " + n + " days in a row** (since " + shortDay(mid - n * DAY) + ").");
    });
    if (changed) { save(s); }
    if (!lines.length) { return; }
    postFor("alerts", s.webhook, shout("🔔 **Family update**\n" + lines.join("\n")), function () {
      var back = load(); back.roster = oldRoster; back.idleSaid = oldIdle; save(back);
    });
  }

  // Backup: everything this script (and the Mission Reader) keeps in this browser, as one file to download and load back.
  function backupData() {
    var data = { app: "syndicate-tools", version: VERSION, savedAt: new Date().toISOString(), activity: load() };
    try { data.missionReader = JSON.parse(localStorage.getItem("mr-reader") || "null"); } catch (e) {}
    return data;
  }
  function downloadBackup() {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(backupData())], { type: "application/json" }));
    a.download = "syndicate-tools-backup-" + dayKey(Date.now()) + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
  }
  function restoreBackup() {
    var inp = document.createElement("input");
    inp.type = "file"; inp.accept = ".json,application/json";
    inp.onchange = function () {
      var f = inp.files && inp.files[0];
      if (!f) { return; }
      var rd = new FileReader();
      rd.onload = function () {
        var b;
        try { b = JSON.parse(rd.result); } catch (e) { b = null; }
        if (!b || b.app !== "syndicate-tools" || !b.activity) { alert("That file isn't a Syndicate tools backup."); return; }
        if (!confirm("Replace the settings and history on this PC with the backup from " + new Date(b.savedAt).toLocaleString() + "?")) { return; }
        save(b.activity);
        if (b.missionReader) { try { localStorage.setItem("mr-reader", JSON.stringify(b.missionReader)); } catch (e) {} }
        pos = load().pos || null; showSetup = false; redraw();
        alert("Backup restored.");
      };
      rd.readAsText(f);
    };
    inp.click();
  }

  // Daily backup into a folder the leader picks once ("Choose backup folder" in Discord settings; the browser's folder access).
  // Once a game day, after yesterday's history is written, it saves syndicate-tools-backup-YYYY-MM-DD.json there and keeps
  // the newest 30. The folder's handle lives in IndexedDB, since localStorage can't hold it. When the browser wants the
  // permission confirmed again (after a restart, unless "Allow on every visit" was chosen), the panel shows a button for it:
  // the browser only asks after a click. backupState: "" (no folder) · "granted" · "prompt" (waiting for that click) · "error".
  var BACKUP_KEEP = 30, BACKUP_NAME = /^syndicate-tools-backup-\d{4}-\d{2}-\d{2}\.json$/;
  var folder = null, folderLoaded = false, backupState = "", backupError = "", backupBusy = false, backupCheckAt = 0;
  function idb(mode, fn) {
    return new Promise(function (res, rej) {
      var open = indexedDB.open("syn-activity", 1);
      open.onupgradeneeded = function () { open.result.createObjectStore("kv"); };
      open.onerror = function () { rej(open.error); };
      open.onsuccess = function () {
        try {
          var tx = open.result.transaction("kv", mode), req = fn(tx.objectStore("kv"));
          tx.oncomplete = function () { open.result.close(); res(req.result); };
          tx.onerror = function () { open.result.close(); rej(tx.error); };
        } catch (e) { open.result.close(); rej(e); }
      };
    });
  }
  function loadFolder() {
    if (folderLoaded || !window.indexedDB) { return Promise.resolve(folder); }
    return idb("readonly", function (st) { return st.get("backupDir"); }).then(function (h) { folder = h || null; folderLoaded = true; return folder; });
  }
  function chooseFolder() {
    if (!window.showDirectoryPicker) { alert("This browser can't save into a folder. Use \"Download backup\" instead."); return; }
    window.showDirectoryPicker({ id: "syn-backup", mode: "readwrite" }).then(function (h) {
      folder = h; folderLoaded = true;
      return idb("readwrite", function (st) { return st.put(h, "backupDir"); }).then(writeBackup);
    }).catch(function (e) { if (e && e.name !== "AbortError") { alert("Couldn't use that folder: " + (e.message || e)); } }).then(redraw);
  }
  function allowFolder() {
    if (!folder) { return; }
    folder.requestPermission({ mode: "readwrite" }).then(function (p) { backupState = p; return p === "granted" ? writeBackup() : null; })
      .catch(function (e) { backupState = "error"; backupError = String(e && e.message || e); }).then(redraw);
  }
  function writeBackup() {
    var name = "syndicate-tools-backup-" + dayKey(Date.now()) + ".json";
    return folder.getFileHandle(name, { create: true }).then(function (f) { return f.createWritable(); }).then(function (w) {
      return w.write(JSON.stringify(backupData())).then(function () { return w.close(); });
    }).then(function () {
      var s = load(); s.backupDay = dayKey(dayStart(Date.now())); s.backupAt = Date.now(); s.backupFolder = folder.name; save(s);
      backupState = "granted"; backupError = "";
      return pruneBackups();
    }, function (e) { backupState = "error"; backupError = String(e && e.message || e); });
  }
  function pruneBackups() {
    var names = [], it = folder.keys();
    function next() { return it.next().then(function (r) { if (r.done) { return; } if (BACKUP_NAME.test(r.value)) { names.push(r.value); } return next(); }); }
    return next().then(function () {
      names.sort();
      return Promise.all(names.slice(0, Math.max(0, names.length - BACKUP_KEEP)).map(function (n) { return folder.removeEntry(n); }));
    }).catch(function () {});
  }
  function autoBackup() {
    var s = load(), mid = dayStart(Date.now());
    if (!folderLoaded && !backupBusy && window.indexedDB) { // so the settings can show the folder before the day's backup is due
      backupBusy = true;
      loadFolder().catch(function () { folderLoaded = true; }).then(function () { backupBusy = false; redraw(); });
      return;
    }
    if (backupBusy || s.backupDay === dayKey(mid) || !last || last.at < mid + GRACE || Date.now() < backupCheckAt) { return; }
    backupBusy = true; backupCheckAt = Date.now() + 60000;
    loadFolder().then(function (h) {
      if (!h) { backupState = ""; return; }
      return h.queryPermission({ mode: "readwrite" }).then(function (p) {
        var was = backupState; backupState = p;
        if (p === "granted") { return writeBackup(); }
        if (was !== p) { redraw(); }
      });
    }).catch(function (e) { backupState = "error"; backupError = String(e && e.message || e); })
      .then(function () { backupBusy = false; });
  }
  function backupHtml(s) {
    var at = s.backupAt ? new Date(s.backupAt).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
    return "<div style='margin-top:10px'><b>Daily backup to a folder</b>"
      + "<div style='font-size:11.5px;color:var(--muted)'>" + (s.backupFolder && folder
        ? "Saving to the folder <b>" + esc(s.backupFolder) + "</b> once a day" + (at ? ", last on " + esc(at) : "") + ". The newest " + BACKUP_KEEP + " are kept."
        : "Once a day, a backup file is saved into a folder you pick on this PC (the newest " + BACKUP_KEEP + " are kept).")
      + (backupState === "error" ? " <span style='color:#ff8a8a'>Last try failed: " + esc(backupError) + "</span>" : "") + "</div>"
      + "<div class='row' style='margin-top:4px'><button type='button' data-pickfolder>" + (folder ? "Change folder" : "Choose backup folder") + "</button>"
      + (folder ? "<button type='button' data-backupnow>Save a backup now</button>" : "") + "</div></div>";
  }

  // Leaderboard: one Discord message on its own webhook, edited in place every few minutes while the game is open.
  // Activity this week (finished days from the history plus today so far), today, and all-time gold donated.
  var BOARD_EVERY = 5 * 60 * 1000;
  var boardBusy = false, boardError = "", boardNext = 0;
  // The "Records" block: best single days (today's live numbers count too), streaks at 100+, the family's best day,
  // wars won/lost with the most MVPs, and last week's #1. list = members with .today.
  function recordsField(s, list) {
    var r = s.records || { best: {}, fam: null, streak: null, wars: { won: 0, lost: 0 }, mvps: {} }, mid = dayStart(Date.now()), today = dayKey(mid), lines = [];
    var dayOf = function (d) { return d.live ? "today" : shortDay(Date.parse(d.day)); };
    // Each member's personal best, with today's live points if they're higher.
    var bestOf = {};
    Object.keys(r.best || {}).forEach(function (id) { bestOf[id] = r.best[id]; });
    list.forEach(function (m) { if (m.today > 0 && (!bestOf[m.id] || m.today > bestOf[m.id].ap)) { bestOf[m.id] = { name: m.name, ap: m.today, day: today, live: true }; } });
    var days = Object.keys(bestOf).map(function (id) { return bestOf[id]; }).sort(function (a, b) { return b.ap - a.ap; }).slice(0, 3);
    if (days.length) {
      lines.push("👑 **Best day:** **" + md(days[0].name) + "** — " + days[0].ap.toLocaleString("en-US") + " AP (" + dayOf(days[0]) + ")"
        + days.slice(1).map(function (d, i) { return " · " + ["🥈", "🥉"][i] + " " + md(d.name) + " " + d.ap.toLocaleString("en-US"); }).join(""));
    }
    var now = list.map(function (m) { return { m: m, n: fullStreak(s, m.id, mid) + (m.today >= FULL ? 1 : 0) }; }).sort(function (a, b) { return b.n - a.n; })[0];
    var ever = r.streak && (!now || r.streak.n > now.n) ? r.streak : null;
    if (now && now.n >= 2 || ever) {
      lines.push("🔥 **Streaks at 100+:** " + (now && now.n >= 2 ? md(now.m.name) + " " + now.n + " days (now)" : "nobody on a run right now")
        + (ever ? " · best ever: " + md(ever.name) + " " + ever.n + " days" : now && now.n >= 2 ? " · the record!" : ""));
    }
    var todayTotal = list.reduce(function (a, m) { return a + m.today; }, 0);
    if (r.fam || todayTotal) {
      var famBest = r.fam && r.fam.ap >= todayTotal ? r.fam : { ap: todayTotal, live: true };
      lines.push("🏰 **Family best day:** " + famBest.ap.toLocaleString("en-US") + " AP (" + dayOf(famBest) + ")" + (famBest.live ? "" : " · today so far: " + todayTotal.toLocaleString("en-US")));
    }
    var top = Object.keys(r.mvps).map(function (k) { return r.mvps[k]; }).sort(function (a, b) { return b.n - a.n; })[0];
    if (r.wars.won || r.wars.lost || top) {
      lines.push("⚔️ **Wars:** " + r.wars.won + " won · " + r.wars.lost + " lost" + (top ? " · most MVPs: " + md(top.name) + " ×" + top.n : ""));
    }
    var ws = weekStart(mid), sums = {}, names = {};
    for (var t = ws - 7 * DAY; t < ws; t += DAY) {
      var rec = s.hist && s.hist[dayKey(t)];
      if (rec) { Object.keys(rec).forEach(function (id) { sums[id] = (sums[id] || 0) + rec[id].ap; names[id] = rec[id].n; }); }
    }
    var wk = Object.keys(sums).sort(function (a, b) { return sums[b] - sums[a]; })[0];
    if (wk && sums[wk] > 0) { lines.push("📅 **Last week's #1:** " + md(names[wk]) + " — " + sums[wk].toLocaleString("en-US") + " AP"); }
    var ranks = Object.keys(r.rank || {}).map(function (id) { return r.rank[id]; }).sort(function (a, b) { return a.pos - b.pos; }).slice(0, 3);
    if (ranks.length) {
      lines.push("🎖️ **Best honor rank:** **" + md(ranks[0].name) + "** #" + ranks[0].pos.toLocaleString("en-US") + " (" + (ranks[0].day === today ? "today" : shortDay(Date.parse(ranks[0].day))) + ")"
        + ranks.slice(1).map(function (b, i) { return " · " + ["🥈", "🥉"][i] + " " + md(b.name) + " #" + b.pos.toLocaleString("en-US"); }).join(""));
    }
    var first = Object.keys(s.hist || {}).sort()[0];
    if (!lines.length) { return null; }
    return { name: "🏆 Records", value: (lines.join("\n") + (first ? "\n-# Counted since " + shortDay(Date.parse(first)) : "")).slice(0, 1024), inline: false };
  }
  // A shout-out in the family chat the first time each day someone beats the best single day ever.
  // Waits for a week of history, so the first few days don't set a "record" every morning. s.recordSaid = {day, id, ap}.
  var RECORD_MIN_DAYS = 7;
  function checkRecord() {
    var s = load(), mid = dayStart(Date.now()), day = dayKey(mid);
    if (!s.lvHook || !last || last.at < mid || !canPost("record")) { return; }
    if (!s.records) { ensureRecords(s); save(s); }
    var r = s.records;
    var holder = Object.keys(r.best || {}).map(function (id) { return r.best[id]; }).sort(function (a, b) { return b.ap - a.ap; })[0];
    if (Object.keys(s.hist || {}).length < RECORD_MIN_DAYS || !holder || s.recordSaid && s.recordSaid.day === day) { return; }
    var lead = members(last.fam).sort(function (a, b) { return b.today - a.today; })[0];
    if (!lead || lead.today <= holder.ap) { return; }
    s.recordSaid = { day: day, id: lead.id, ap: lead.today }; save(s);
    var users = [];
    postFor("record", s.lvHook, dress("Family", say("record", { who: who(s, lead, users), ap: lead.today.toLocaleString("en-US") }) + "\n"
      + "-# Old record: " + md(holder.name) + " with " + holder.ap.toLocaleString("en-US") + " AP on " + shortDay(Date.parse(holder.day)), users),
      function () { var n = load(); delete n.recordSaid; save(n); });
  }
  // Honor rank news in the family chat, only for the big moments: a new family #1, someone passing 3 or more members at once, and a
  // member's first time in the game's top 100, 50, 25, 10 or 3. Names show without a ping. Each pair counts once per direction per
  // day, and besides a new #1 there are at most 2 at a time and 3 a day. s.overtakes === false switches it off (Discord settings); the ranks are still
  // followed then, so switching it on doesn't post old news. s.rankSeen = {id: place}; s.overTier = {id: best tier}; s.overSaid = {day, n, pairs}.
  var OVER_POSTS = 2, OVER_DAY = 3, OVER_JUMP = 3, OVER_TIERS = [100, 50, 25, 10, 3];
  function checkOvertakes() {
    var s = load(), day = dayKey(Date.now());
    if (!s.lvHook || !last || !canPost("overtake")) { return; }
    var list = members(last.fam).filter(function (m) { return m.pos > 0; }), now = {}, seen = s.rankSeen, changed = !seen;
    list.forEach(function (m) { now[m.id] = m.pos; if (!seen || seen[m.id] !== m.pos) { changed = true; } });
    if (!changed) { return; }
    s.rankSeen = now;
    var tierWas = s.overTier, tiers = s.overTier = Object.assign({}, tierWas), newTier = {};
    list.forEach(function (m) {
      var t = OVER_TIERS.filter(function (x) { return m.pos <= x; }).pop();
      if (!t || tiers[m.id] && tiers[m.id] <= t) { return; }
      if (tierWas && seen && seen[m.id]) { newTier[m.id] = t; } // the first look, and new members, start quietly
      tiers[m.id] = t;
    });
    if (!seen || s.overtakes === false) { save(s); return; }
    var was = s.overSaid, said = was && was.day === day ? was : { day: day, n: 0, pairs: {} }, best = Math.min.apply(null, list.map(function (m) { return seen[m.id] || Infinity; }));
    var bestNow = Math.min.apply(null, list.map(function (m) { return m.pos; })), hits = [];
    list.forEach(function (a) {
      var passed = !seen[a.id] ? [] : list.filter(function (b) { return b.id !== a.id && seen[b.id] && seen[a.id] > seen[b.id] && a.pos < b.pos && !said.pairs[a.id + "|" + b.id]; });
      var top = a.pos === bestNow && passed.some(function (b) { return seen[b.id] === best; }), tier = newTier[a.id];
      if (!top && !tier && passed.length < OVER_JUMP) { return; }
      passed.forEach(function (b) { said.pairs[a.id + "|" + b.id] = 1; });
      passed.sort(function (x, y) { return x.pos - y.pos; });
      hits.push({ m: a, passed: passed, top: top, tier: tier, jump: passed.length >= OVER_JUMP });
    });
    hits.sort(function (x, y) { return y.top - x.top || (x.tier || 1e9) - (y.tier || 1e9) || y.passed.length - x.passed.length; });
    var others = hits.filter(function (h) { return !h.top; }).slice(0, Math.max(0, Math.min(OVER_POSTS, OVER_DAY - said.n)));
    hits = hits.filter(function (h) { return h.top; }).concat(others);
    said.n += others.length; s.overSaid = said;
    save(s); // saved before posting so a second game tab doesn't post it too
    if (!hits.length) { return; }
    var text = hits.map(function (h) {
      if (!h.top && !h.jump) { return say("honorTier", { who: who(s, h.m, []), tier: h.tier, rank: h.m.pos }); }
      var first = h.top ? h.passed.filter(function (b) { return seen[b.id] === best; })[0] : h.passed[0], rest = h.passed.filter(function (b) { return b !== first; });
      return say(h.top ? "overtakeTop" : "overtake", { who: who(s, h.m, []), them: who(s, first, []), rank: h.m.pos })
        + (rest.length ? "\n-# Also passed: " + rest.map(function (b) { return md(b.name); }).join(", ") : "");
    }).join("\n\n");
    postFor("overtake", s.lvHook, dress("Family", text), function () {
      var n = load(); n.rankSeen = seen; if (tierWas) { n.overTier = tierWas; } else { delete n.overTier; } if (was) { n.overSaid = was; } else { delete n.overSaid; } save(n);
    });
  }
  function buildBoard(s, fam) {
    var list = members(fam), mid = dayStart(Date.now()), ws = weekStart(mid);
    list.forEach(function (m) {
      m.week = m.today;
      for (var t = ws; t < mid; t += DAY) { var r = s.hist && s.hist[dayKey(t)]; if (r && r[m.id]) { m.week += r[m.id].ap; } }
    });
    function column(key, skipZero) {
      var rows = list.filter(function (m) { return !skipZero || m[key] > 0; }).sort(function (a, b) { return b[key] - a[key]; });
      return rows.length ? rows.map(function (m, i) { return medal(i) + " **" + md(m.name) + "** " + m[key].toLocaleString("en-US"); }).join("\n").slice(0, 1024) : "Nothing yet.";
    }
    function rankColumn() { // best (lowest) place in the game's ranking first
      var rows = list.filter(function (m) { return m.pos > 0; }).sort(function (a, b) { return a.pos - b.pos; });
      return rows.length ? rows.map(function (m, i) { return medal(i) + " **" + md(m.name) + "** #" + m.pos.toLocaleString("en-US"); }).join("\n").slice(0, 1024) : "Nothing yet.";
    }
    return {
      username: "Syndicate Leaderboard",
      allowed_mentions: { parse: [] },
      embeds: [{
        title: "🏆 " + (fam.name || "Family") + " · leaderboard",
        description: progressLine(fam) || undefined,
        color: 0xffbf30,
        fields: [
          { name: "🔥 This week", value: column("week"), inline: true },
          { name: "⚡ Today", value: column("today"), inline: true },
          { name: "🎖️ Honor rank", value: rankColumn(), inline: true },
          { name: "🪙 Gold donated", value: column("gold", true), inline: true }
        ].concat(recordsField(s, list) || []),
        footer: { text: "Week = " + shortDay(ws) + " to Sunday · game days start 00:00 UTC (1 AM German time) · honor rank = place in the game's player ranking · gold = all time\nUpdates by itself while a leader has the game open." },
        timestamp: new Date().toISOString()
      }]
    };
  }
  // Each member's best place in the game's ranking ever seen: s.records.rank = {id: {name, pos, day}}.
  function trackRanks() {
    if (!last) { return; }
    var s = load(), r = ensureRecords(s), day = dayKey(Date.now()), changed = false;
    r.rank = r.rank || {};
    members(last.fam).forEach(function (m) {
      var b = r.rank[m.id];
      if (m.pos > 0 && (!b || m.pos < b.pos)) { r.rank[m.id] = { name: m.name, pos: m.pos, day: day }; changed = true; }
    });
    if (changed) { save(s); }
  }
  function updateBoard() {
    trackRanks();
    var s = load();
    if (!s.boardHook || !last || boardBusy || Date.now() < boardNext) { return; }
    if (last.at < dayStart(Date.now())) { return; } // yesterday's numbers would show as today's
    var payload = buildBoard(s, last.fam), sig = JSON.stringify(payload.embeds[0].fields) + payload.embeds[0].description;
    boardNext = Date.now() + BOARD_EVERY;
    if (s.boardMsg && sig === s.boardSig) { return; }
    if (!s.boardMsg && s.boardLock && Date.now() - s.boardLock < 60000) { return; } // another tab is posting it
    if (!s.boardMsg) { s.boardLock = Date.now(); save(s); }
    boardBusy = true;
    post(s.boardHook, payload, s.boardMsg).then(function (msg) {
      var now = load();
      if (msg && msg.id) { now.boardMsg = msg.id; }
      now.boardSig = sig; now.boardAt = Date.now(); delete now.boardLock; save(now);
      boardError = "";
    }, function (e) {
      var now = load(); delete now.boardLock;
      // Someone deleted the leaderboard message: post a fresh one next round.
      if (e && e.status === 404 && now.boardMsg) { delete now.boardMsg; delete now.boardSig; boardNext = 0; }
      else { boardError = String(e && e.message || e); boardNext = Date.now() + RETRY; }
      save(now);
    }).then(function () { boardBusy = false; redraw(); });
  }

  var last = null, sending = false, retryAt = 0, error = "", note = "", closed = false, showSetup = false, showLinks = false, showPlanner = false, showRecruits = false, showRanks = false, showVol = false;
  var box = null, lastKey = "", lastPath = location.pathname;
  // Personal (missions) or Family. Arriving on the Godfather bar opens Personal, arriving on the Family tab opens Family.
  var BAR = "/game/godfather", DUELS = "/game/duel", GANGWAR = "/game/gangwar", startPath = location.pathname.replace(/\/+$/, "");
  var area = startPath === BAR || startPath === DUELS ? "personal" : "family", personalTab = startPath === DUELS ? "duels" : "missions";
  if (startPath === GANGWAR) { area = "personal"; personalTab = "gang"; }

  // Level and gold when a day ended, from its history: the first ones seen after it, not changed later. was = what to use otherwise.
  function atDayEnd(s, day, id, was) {
    var r = s.hist && s.hist[day] && s.hist[day][id];
    return r ? Object.assign({}, was, { level: r.lv, gold: r.g }) : was;
  }
  function send(manual) {
    var mid = dayStart(Date.now()), day = dayKey(mid - 1), s = load();
    if (!s.webhook || !last || sending) { return; }
    // Sending the same day again (by hand) repeats the first send: same earlier report, same levels, and the next report still starts where this one ended.
    var again = s.sentDay === day, base = again ? s.prev : s.base, list = members(last.fam);
    if (again) { list = list.map(function (m) { return atDayEnd(s, day, m.id, m); }); }
    else if (base) {
      var from = {}; // who was there comes from the last report, levels and gold from when its day ended
      Object.keys(base).forEach(function (id) { from[id] = atDayEnd(s, s.sentDay, id, base[id]); });
      base = from;
    }
    var payload = buildReport(last.fam.name, list, base || null, mid - 1, idleAll(s, list, mid));
    sending = true; error = ""; note = ""; redraw();
    post(s.webhook, payload).then(function () {
      var now = load();
      if (!again) { now.prev = base || null; now.base = snapshot(list); now.sentDay = day; }
      now.sentAt = Date.now(); delete now.lock;
      save(now);
      note = manual ? "Sent again." : "";
    }, function (e) {
      var now = load(); delete now.lock; save(now);
      error = String(e && e.message || e); retryAt = Date.now() + RETRY;
    }).then(function () { sending = false; redraw(); });
  }
  function autoSend() {
    var s = load(), mid = dayStart(Date.now()), day = dayKey(mid - 1);
    if (!s.webhook || sending || !last || s.sentDay === day || Date.now() < retryAt) { return; }
    if (last.at < mid + GRACE) { return; }
    if (s.lock && s.lock.day === day && Date.now() - s.lock.at < 60000) { return; } // another game tab is sending it
    s.lock = { day: day, at: Date.now() }; save(s);
    send(false);
  }

  // War alerts, posted to their own webhook: a new war (with a countdown Discord keeps up to date),
  // a reminder shortly before the battle while a game tab is open, and the result.
  // Wars come from family.private.wars: {id, status: preparing|finished|cancelled, attacker(Id), defender(Id), startsAt, winnerId}.
  // Stored as s.wars = {id: {announced, reminded, result}}.
  var REMIND = 15 * 60 * 1000;
  var warBusy = false, warError = "", warRetryAt = 0;
  function nameOf(x) { return typeof x === "string" ? x : x && x.name || "?"; }
  function startOf(w) { return new Date(w.startsAt).getTime(); }
  function warsOf(fam) { return fam.private && Array.isArray(fam.private.wars) ? fam.private.wars : []; }
  function warSide(fam, w) {
    var attack = w.attackerId === fam.id;
    return { attack: attack, foe: md(nameOf(attack ? w.defender : w.attacker)), t: Math.round(startOf(w) / 1000) };
  }
  // role: the Discord role ID to ping (e.g. @family) on new wars and reminders; results don't ping.
  // est: the strength estimate line for this war, if one could be made.
  function warPost(fam, w, kind, role, est) {
    var x = warSide(fam, w), side = x.attack ? "attack" : "defense", at = "<t:" + x.t + ":R>";
    var mention = role && kind !== "result" ? "<@&" + role + "> " : "";
    var msg = { username: "Syndicate Wars", allowed_mentions: { parse: [], roles: mention ? [role] : [] } };
    if (kind === "new") {
      msg.content = mention + (x.attack ? "⚔️ **War declared!** We attack **" + x.foe + "**. Battle " + at + "."
        : "🛡️ **We're under attack!** **" + x.foe + "** declared war on us. Battle " + at + ".");
      msg.embeds = [{
        title: x.attack ? "⚔️ Attack on " + x.foe : "🛡️ Defense against " + x.foe,
        description: "**Battle:** <t:" + x.t + ":F> (" + at + ")\nOpen the **Family** tab in the game and press **Register for " + side + "** before the battle starts."
          + (est ? "\n\n📊 " + est + "\n-# Estimate from member levels. Who registers decides the real fight, so every fighter counts!" : ""),
        color: x.attack ? 0xffbf30 : 0x4db2ff
      }];
    } else if (kind === "remind") {
      msg.content = mention + "⏰ Battle " + (x.attack ? "against **" + x.foe + "**" : "with **" + x.foe + "** (they attack us)") + " starts " + at
        + "! Last chance to **Register for " + side + "** on the Family tab." + (est ? "\n📊 " + est : "");
    } else {
      var won = w.winnerId === fam.id, cancelled = w.status === "cancelled";
      msg.content = cancelled ? "✖️ The war with **" + x.foe + "** was cancelled."
        : won ? "🏆 **Victory!** We beat **" + x.foe + "**" + (x.attack ? " in our attack." : " and held our ground.")
        : "💀 **Defeat.** **" + x.foe + "** beat us" + (x.attack ? " when we attacked." : " in their attack.");
      // The family news line about this war carries the rewards ("… one free drink for each eligible fighter …").
      var foe = nameOf(x.attack ? w.defender : w.attacker), news = (fam.private.events || []).filter(function (e) {
        return e && e.text && new Date(e.createdAt).getTime() >= startOf(w) && (cancelled ? /^The war was cancelled/.test(e.text) : e.text.indexOf(foe) >= 0 && / defeated /.test(e.text));
      }).sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })[0];
      if (news) { msg.embeds = [{ description: md(news.text), color: cancelled ? 0x888888 : won ? 0x00cc00 : 0xcc0000 }]; }
    }
    return msg;
  }
  function checkWars() {
    var s = load();
    if (!s.warHook || !last || warBusy || Date.now() < warRetryAt) { return; }
    var fam = last.fam, wars = warsOf(fam), now = Date.now();
    if (!fam.private) { return; }
    s.wars = s.wars || {};
    // First run: wars that are already over are history, not news.
    if (!s.warsInit) {
      wars.forEach(function (w) { if (w.status !== "preparing") { s.wars[w.id] = { result: true }; } });
      s.warsInit = true; save(s);
    }
    for (var i = 0; i < wars.length; i++) {
      var w = wars[i], d = s.wars[w.id] || {}, start = startOf(w), kind = null;
      // Announced before strength was saved for wars (or the first try failed): load it now, at most every 30 minutes.
      if (w.status === "preparing" && d.announced && !d.est && !(now - (d.estTry || 0) < 30 * 60 * 1000)) {
        d.estTry = now; s.wars[w.id] = d; save(s); learnWar(w);
      }
      if (w.status === "preparing") {
        if (!d.announced) {
          if (start > now) { kind = "new"; } else { d.announced = true; s.wars[w.id] = d; save(s); learnWar(w); } // found too late to announce; still report the result
        } else if (!d.reminded && start > now && start - now <= REMIND) { kind = "remind"; }
      } else if ((w.status === "finished" || w.status === "cancelled") && d.announced && !d.result) { kind = "result"; }
      if (!kind) { continue; }
      // Mark it first so a second game tab doesn't post it too; undo if Discord refuses.
      var flag = kind === "new" ? "announced" : kind === "remind" ? "reminded" : "result";
      d[flag] = true; s.wars[w.id] = d; save(s);
      if (kind === "result" && w.status === "finished" && d.est) { logWar(d.est, w.winnerId === fam.id, w.attackerId === fam.id, w.id); }
      if (kind === "result" && w.status === "finished") { var rs = load(); countWar(rs, fam, w); save(rs); s = load(); d = s.wars[w.id]; }
      warBusy = true;
      // New wars first get a strength estimate against the other family (and keep it for learning from the result).
      (kind === "new" ? learnWar(w) : Promise.resolve(d.est || null)).then((function (w, kind, id, f) {
        return function (est) {
          var s2 = load();
          return post(s2.warHook, warPost(fam, w, kind, s2.warRole, est && estimateText(s2, est.us, est.them))).then(function () { warError = ""; }, function (e) {
            var now2 = load(); if (now2.wars && now2.wars[id]) { delete now2.wars[id][f]; save(now2); }
            warError = String(e && e.message || e); warRetryAt = Date.now() + RETRY;
          });
        };
      })(w, kind, w.id, flag)).then(function () { warBusy = false; redraw(); });
      return; // one post per round
    }
  }
  // Strength of both sides for a war, saved on the war (s.wars[id].est) so its result can teach the win estimate.
  function learnWar(w) {
    var fam = last.fam, foeId = w.attackerId === fam.id ? w.defenderId : w.attackerId;
    return familyById(foeId).then(function (foe) {
      if (!foe) { return null; }
      var est = { us: summary(fam).strength, them: summary(foe).strength }, s = load();
      if (s.wars && s.wars[w.id]) { s.wars[w.id].est = est; save(s); }
      return est;
    }).catch(function () { return null; });
  }
  // Adds a finished war to the planner's log (once per war id) and marks it on the war (s.wars[id].logged).
  function logWar(est, won, attack, id) {
    if (!est.us || !est.them) { return; }
    var s = load();
    s.warLog = s.warLog || [];
    if (s.wars && s.wars[id] && s.wars[id].logged || s.warLog.some(function (e) { return e.id === id; })) { return; }
    s.warLog = s.warLog.concat([{ id: id, r: est.us / est.them, won: won, attack: attack, at: Date.now() }]).slice(-100);
    if (s.wars && s.wars[id]) { s.wars[id].logged = true; }
    save(s);
  }
  // Catch-up for wars that finished without a saved strength (e.g. declared before v1.12): within 3 days of the end,
  // the other family's current levels are close enough, so the war is logged with those. One war per round,
  // a retry at most every 30 minutes if the other family couldn't be loaded.
  var LATE_LOG = 3 * DAY, lateBusy = false;
  function catchUpLog() {
    var s = load(), now = Date.now();
    if (lateBusy || !last || !last.fam.private || !s.wars) { return; }
    var fam = last.fam, w = warsOf(fam).filter(function (x) {
      var d = s.wars[x.id];
      return x.status === "finished" && d && d.result && !d.est && !d.logged && now - (d.lateTry || 0) > 30 * 60 * 1000
        && now - new Date(x.settledAt || x.startsAt).getTime() < LATE_LOG;
    })[0];
    if (!w) { return; }
    s.wars[w.id].lateTry = now; save(s);
    lateBusy = true;
    learnWar(w).then(function (est) {
      if (est) { logWar(est, w.winnerId === fam.id, w.attackerId === fam.id, w.id); }
    }).then(function () { lateBusy = false; redraw(); });
  }

  // ===== War planner =====
  // A war is a team fight between the fighters each side registers. Who registers isn't visible beforehand,
  // so every member counts. Health and damage both grow with level, so a member weighs level² (÷100 to keep numbers small).
  var WINDOW = 10, PAGE_SIZE = 8, SCAN_GAP = 700, LEARN_MIN = 10;
  function summary(fam) {
    var lv = (fam.members || []).map(function (m) { return +m.level || 0; }).sort(function (a, b) { return b - a; });
    var sum = function (a) { return a.reduce(function (x, y) { return x + y; }, 0); };
    return {
      members: lv.length, avg: lv.length ? Math.round(sum(lv) / lv.length) : 0, top5: lv.length ? Math.round(sum(lv.slice(0, 5)) / Math.min(5, lv.length)) : 0,
      strength: Math.round(sum(lv.map(function (l) { return l * l; })) / 100)
    };
  }
  // Colour and word for a strength ratio, or for the learned win chance once there is one (c = percent or null).
  function rating(ratio, c) {
    if (c != null) { return c >= 65 ? ["🟢", "favorable"] : c >= 40 ? ["🟡", "close"] : ["🔴", "risky"]; }
    return ratio >= 1.3 ? ["🟢", "favorable"] : ratio >= 0.8 ? ["🟡", "close"] : ["🔴", "risky"];
  }
  // Once LEARN_MIN of our wars are logged (strength ratio + result), fit a logistic curve to them and give a percentage.
  function fitChance(log) {
    var best = null;
    for (var k = 0.5; k <= 4; k += 0.25) { // a gentle curve: a dozen wars can't prove certainty
      for (var b = -1.5; b <= 1.5; b += 0.25) {
        var ll = 0;
        log.forEach(function (e) { var p = 1 / (1 + Math.exp(-(k * Math.log(e.r) + b))); p = Math.min(0.99, Math.max(0.01, p)); ll += Math.log(e.won ? p : 1 - p); });
        if (!best || ll > best.ll) { best = { k: k, b: b, ll: ll }; }
      }
    }
    return best;
  }
  // Until LEARN_MIN wars are logged, a rough guess from a standard curve (1.3× ≈ 63%, 2× ≈ 80%); after that, learned from our wars.
  var GUESS_K = 2;
  function learned(s) { return (s.warLog || []).length >= LEARN_MIN; }
  function chance(s, ratio) {
    var f = learned(s) ? fitChance(s.warLog) : { k: GUESS_K, b: 0 };
    return Math.min(95, Math.max(5, Math.round(100 / (1 + Math.exp(-(f.k * Math.log(ratio) + f.b)))))); // never claim a sure thing
  }
  function estimateText(s, us, them) {
    var ratio = them ? us / them : 9, c = chance(s, ratio), r = rating(ratio, c);
    return r[0] + " **~" + c + "% win chance**" + (learned(s) ? "" : " (rough guess)") + " · strength us " + us.toLocaleString("en-US") + " vs them " + them.toLocaleString("en-US") + " (" + ratio.toFixed(2) + "×)";
  }

  // Loading other families and war replays goes through the game's own queries (the options factories exported by its
  // family-*.js module, found by their source), so the requests are exactly what the game sends when you click around.
  // famQueries = {family: (params) => options, war: (warId) => options, account: (familyId) => options (treasury ledger)}
  var famQueries = null, famQueriesLoading = null, famUrls = [];
  function familyQueries() {
    if (famQueries && famQueries.family && famQueries.war && famQueries.account) { return Promise.resolve(famQueries); }
    if (famQueriesLoading) { return famQueriesLoading; }
    var urls = famUrls.slice(), found = { family: null, war: null, account: null };
    performance.getEntriesByType("resource").forEach(function (e) { if (/\/assets\/family-[\w-]+\.js(\?|$)/.test(e.name) && urls.indexOf(e.name) < 0) { urls.push(e.name); } });
    famQueriesLoading = urls.reduce(function (p, u) {
      return p.then(function () {
        return import(u).then(function (mod) {
          Object.keys(mod).forEach(function (k) {
            var f = mod[k], src = typeof f === "function" ? String(f) : "";
            if (!found.family && /view:`home`/.test(src) && /queryKey/.test(src)) { found.family = f; }
            if (!found.war && /familyWar\(/.test(src) && /warId/.test(src)) { found.war = f; }
            if (!found.account && /familyAccount\(/.test(src) && /familyId/.test(src)) { found.account = f; }
          });
        }, function () {});
      });
    }, Promise.resolve()).then(function () { famQueries = found; famQueriesLoading = null; return found; });
    return famQueriesLoading;
  }
  function familyOptions() { return familyQueries().then(function (q) { return q.family; }); }
  // A finished war's replay: {replay: {attackers, defenders, events, initialHealth, foughtAt}, winnerId, familyId, reward}.
  function warDetail(id) {
    return familyQueries().then(function (q) {
      if (!q.war || !client) { throw new Error("open the Family tab once, then try again"); }
      return client.fetchQuery(Object.assign({}, q.war(id), { staleTime: 0 }));
    });
  }
  function gameFetch(params) {
    return familyOptions().then(function (fo) {
      if (!fo || !client) { throw new Error("open the Family tab once, then try again"); }
      return client.fetchQuery(Object.assign({}, fo(params), { staleTime: 10 * 60 * 1000 }));
    });
  }
  function familyById(id) { return gameFetch({ view: "home", familyId: id, search: "", page: 0 }).then(function (d) { return d && (d.family || d); }); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // Scan: the ranking pages around our rank (±10), then each family in that window, one request at a time.
  // Saved as s.scan = {at, own, us, list: [{id, name, rank, level, honor, members, attacked, attacking, sum}]}.
  var scanning = null;
  function runScan() {
    if (scanning && scanning.running || !last) { return; }
    scanning = { running: true, step: "Loading the ranking…" }; redraw();
    var ownId = last.fam.id, rows = [], own;
    gameFetch({ view: "ranking", search: "", page: 0 }).then(function (first) {
      own = first && first.ownFamilyRank;
      if (!own) { throw new Error("the ranking didn't say where our family is"); }
      var lo = Math.max(1, own - WINDOW), hi = own + WINDOW, pages = [];
      for (var p = Math.floor((lo - 1) / PAGE_SIZE); p <= Math.floor((hi - 1) / PAGE_SIZE); p++) { pages.push(p); }
      return pages.reduce(function (chain, p) {
        return chain.then(function () { return p === 0 ? first : wait(SCAN_GAP).then(function () { return gameFetch({ view: "ranking", search: "", page: p }); }); })
          .then(function (d) {
            (d && d.families || []).forEach(function (f, j) {
              var rank = f.rank || p * PAGE_SIZE + j + 1;
              if (rank >= lo && rank <= hi && f.id !== ownId) { rows.push({ f: f, rank: rank }); }
            });
          });
      }, Promise.resolve());
    }).then(function () {
      rows.sort(function (a, b) { return a.rank - b.rank; });
      return rows.reduce(function (chain, r, i) {
        return chain.then(function () {
          scanning.step = "Checking " + (i + 1) + " of " + rows.length + ": " + r.f.name + "…"; redraw();
          return wait(SCAN_GAP).then(function () { return familyById(r.f.id); }).then(function (fam) { r.page = fam || null; r.sum = fam ? summary(fam) : null; }, function () { r.sum = null; });
        });
      }, Promise.resolve());
    }).then(function () {
      // Current wars, best source first: the family page's scheduled wars, then the ranking's attack/defense lists.
      // (The ranking's _count also counts past wars, so it's only a last resort.) Returns the other side's names.
      var wars = function (r, side) {
        var mine = side === "defenses" ? "defenderId" : "attackerId", other = side === "defenses" ? "attacker" : "defender";
        if (r.page && Array.isArray(r.page.scheduledWars)) {
          return r.page.scheduledWars.filter(function (w) { return w[mine] === r.f.id; }).map(function (w) { return nameOf(w[other]); });
        }
        if (Array.isArray(r.f[side])) { return r.f[side].map(function (x) { return nameOf(x[other]); }); }
        return r.f._count && r.f._count[side] > 0 ? ["?"] : [];
      };
      // When a family under attack can be attacked again: once its battle has been fought, at the latest start of the wars
      // against it (the game has no extra cooldown after a war). 0 when the start isn't known.
      var freeAt = function (r) {
        var list = r.page && Array.isArray(r.page.scheduledWars) ? r.page.scheduledWars.filter(function (w) { return w.defenderId === r.f.id; }) : Array.isArray(r.f.defenses) ? r.f.defenses : [];
        return list.reduce(function (a, w) { return Math.max(a, startOf(w) || 0); }, 0);
      };
      var s = load();
      s.scan = {
        at: Date.now(), own: own, us: summary(last.fam),
        list: rows.map(function (r) {
          var by = wars(r, "defenses"), on = wars(r, "attacks");
          return {
            id: r.f.id, name: r.f.name, rank: r.rank, level: r.page && typeof r.page.level === "number" ? r.page.level : r.f.level, honor: r.f.honor,
            members: r.f._count && r.f._count.members || r.sum && r.sum.members, attacked: by.length > 0, attackedBy: by, freeAt: by.length ? freeAt(r) : 0, attacking: on.length > 0, attackingOn: on, sum: r.sum
          };
        })
      };
      save(s); scanning = null;
    }).catch(function (e) { scanning = { error: String(e && e.message || e) }; }).then(redraw);
  }
  function targets(s) {
    var sc = s.scan;
    if (!sc) { return []; }
    // busy: still under attack. A family whose battle time has passed since the scan counts as free again.
    return sc.list.map(function (t) {
      t.ratio = t.sum && t.sum.strength ? sc.us.strength / t.sum.strength : null;
      t.busy = t.attacked && !(t.freeAt && t.freeAt <= Date.now());
      return t;
    }).sort(function (a, b) { return (a.busy - b.busy) || ((b.ratio || 0) - (a.ratio || 0)); });
  }
  // The planner's view settings, s.planView = {show: "all" | "ready" | "busy", sort: "best" | "win" | "free"}.
  // best: ready targets first, then by win chance · win: win chance only · free: soonest attackable first (ready ones at the top).
  function planView(s) {
    var v = s.planView || {};
    return { show: v.show === "ready" || v.show === "busy" ? v.show : "all", sort: v.sort === "win" || v.sort === "free" ? v.sort : "best" };
  }
  function plannerRows(s) {
    var v = planView(s), freeKey = function (t) { return !t.busy ? 0 : t.freeAt || Infinity; };
    var list = targets(s).filter(function (t) { return v.show === "all" || (v.show === "ready") === !t.busy; });
    if (v.sort === "win") { list.sort(function (a, b) { return (b.ratio || 0) - (a.ratio || 0); }); }
    if (v.sort === "free") { list.sort(function (a, b) { return freeKey(a) - freeKey(b) || (b.ratio || 0) - (a.ratio || 0); }); }
    return list;
  }
  // "in 3h 20m (21:40)"
  function inTime(t) {
    var m = Math.max(0, Math.round((t - Date.now()) / 60000));
    return "in " + (m >= 60 ? Math.floor(m / 60) + "h " : "") + (m % 60) + "m (" + clock(t) + ")";
  }
  function postPlanner() {
    var s = load(), sc = s.scan;
    if (!s.webhook || !sc) { return Promise.resolve(); }
    var list = targets(s), open = list.filter(function (t) { return !t.busy; }), busyOnes = list.filter(function (t) { return t.busy; });
    var line = function (t) {
      var c = t.ratio ? chance(s, t.ratio) : null, r = t.ratio ? rating(t.ratio, c) : ["⚪", "unknown"];
      return "`#" + t.rank + "` " + r[0] + " **" + md(t.name) + "** — " + (c != null ? "~" + c + "% (" + t.ratio.toFixed(2) + "×)" : "?")
        + " · lv " + (t.level || "?") + " · " + (t.members || "?") + " members" + (t.sum ? " · avg lv " + t.sum.avg + " · top 5 " + t.sum.top5 : "") + " · honor " + (t.honor || 0).toLocaleString("en-US");
    };
    var text = open.map(line).join("\n") + (busyOnes.length ? "\n\n🚫 **Already under attack** (attackable again after their battle):\n" + busyOnes.slice().sort(function (a, b) { return (a.freeAt || Infinity) - (b.freeAt || Infinity); }).map(function (t) {
      var by = (t.attackedBy || []).filter(function (n) { return n !== "?"; });
      return "`#" + t.rank + "` " + md(t.name) + (by.length ? " (by " + md(by.join(", ")) + ")" : "") + (t.freeAt ? " · free <t:" + Math.round(t.freeAt / 1000) + ":R>" : "");
    }).join("\n") : "");
    return postFor("planner", s.webhook, {
      username: "Syndicate Wars", allowed_mentions: { parse: [] },
      embeds: [{
        title: "⚔️ War planner · targets around rank " + sc.own + " (" + Math.max(1, sc.own - WINDOW) + "–" + (sc.own + WINDOW) + ")",
        description: (text || "No families found in our window.").slice(0, 4000),
        color: 0xffbf30,
        footer: { text: "Us: strength " + sc.us.strength.toLocaleString("en-US") + " · " + sc.us.members + " members · avg lv " + sc.us.avg
          + "\nEstimate from member levels (who registers isn't known). " + ((s.warLog || []).length >= LEARN_MIN ? "Win chances learned from " + s.warLog.length + " of our wars."
          : "Percentages are a rough guess until " + LEARN_MIN + " of our wars are logged (" + (s.warLog || []).length + " so far).") },
        timestamp: new Date(sc.at).toISOString()
      }]
    });
  }
  // While war alerts are on, refresh the family data every few minutes even when the Family tab isn't open,
  // using the game's own request for it, so new wars are noticed anywhere in the game.
  var KEEP = 3 * 60 * 1000;
  function keepFresh() {
    var s = load(), q = last && last.query;
    if (!(s.warHook || s.boardHook || s.lvHook || box || fxOn(s, "autojoin")) || !q || q.state.fetchStatus === "fetching" || Date.now() - q.state.dataUpdatedAt < KEEP) { return; }
    if (typeof q.fetch === "function" && q.options && q.options.queryFn) { q.fetch().catch(function () {}); }
  }
  // The docked panel can open on any game page, where the game hasn't loaded the family yet: load it through the game's own
  // query, the same one the Family tab uses. Its family-*.js module may not be loaded there, so that comes from the game's file list.
  var ownLoading = false, ownNext = 0;
  function loadOwnFamily(path) {
    if (last || path === PAGE || ownLoading || Date.now() < ownNext || !client) { return; }
    ownLoading = true; ownNext = Date.now() + 2 * 60000;
    var res = performance.getEntriesByType("resource").map(function (e) { return e.name; }), idx = res.filter(function (n) { return /\/assets\/index-[\w-]+\.js/.test(n); })[0];
    var ready = res.some(function (n) { return /\/assets\/family-[\w-]+\.js/.test(n); }) || !idx ? Promise.resolve() : fetch(idx).then(function (r) { return r.text(); }).then(function (t) {
      var seen = {};
      return Promise.all((t.match(/family-[\w-]+\.js/g) || []).filter(function (n) { return !seen[n] && (seen[n] = true); }).map(function (n) { return import(idx.replace(/index-[\w-]+\.js.*$/, n)); }));
    });
    ready.then(familyQueries).then(function (q) { return q && q.family ? client.fetchQuery(q.family()) : null; }).catch(function () {}).then(function () { ownLoading = false; });
  }
  function nextWar() {
    if (!last) { return null; }
    var fam = last.fam, ws = warsOf(fam).filter(function (w) { return w.status === "preparing" && startOf(w) > Date.now(); });
    ws.sort(function (a, b) { return startOf(a) - startOf(b); });
    return ws[0] ? { side: warSide(fam, ws[0]), w: ws[0] } : null;
  }

  // War countdown in the browser tab's title ("⚔ 3h 20m · …" for our attack, "🛡 12m · …" for a defence), on every game page.
  var TITLE_TAG = /^(?:⚔|🛡) [^·]* · /;
  function tabTitle() {
    var nw = nextWar(), base = document.title.replace(TITLE_TAG, ""), pre = "";
    if (nw) {
      var m = Math.max(0, Math.ceil((startOf(nw.w) - Date.now()) / 60000));
      pre = (nw.side.attack ? "⚔ " : "🛡 ") + (m >= 60 ? Math.floor(m / 60) + "h " + (m % 60) + "m" : m + "m") + " · ";
    }
    if (document.title !== pre + base) { document.title = pre + base; }
  }

  // Overnight safety on the PC that keeps Discord up to date (the one keepFresh runs on): when the family numbers haven't
  // refreshed for 15 minutes, reload the game, but only while nobody is using it, the internet works, and at most every 15 minutes.
  var STUCK = 15 * 60 * 1000, IDLE_USER = 5 * 60 * 1000, lastInput = Date.now(), reloading = false, awakeSince = Date.now(), lastCheck = Date.now();
  ["pointerdown", "keydown", "wheel"].forEach(function (k) { window.addEventListener(k, function () { lastInput = Date.now(); }, true); });
  function checkStuck() {
    var s = load(), at = last ? last.at : STARTED, now = Date.now();
    if (now - lastCheck > 2 * 60000) { awakeSince = now; } // the PC slept (or the tab was frozen): give the refresh its chance first
    lastCheck = now;
    if (!(s.warHook || s.boardHook || s.lvHook) || reloading || now - at < STUCK || now - awakeSince < STUCK) { return; }
    if (!document.hidden && now - lastInput < IDLE_USER) { return; }
    if (!navigator.onLine) { return; }
    var before = 0; try { before = +sessionStorage.getItem("syn-reload") || 0; } catch (e) {}
    if (now - before < STUCK) { return; }
    reloading = true;
    // A reload while the site is down would leave an error page with no script on it, so check the site answers first.
    fetch("/", { method: "HEAD", cache: "no-store" }).then(function (r) {
      if (!r.ok) { throw new Error(r.status); }
      try { sessionStorage.setItem("syn-reload", String(Date.now())); } catch (e) {}
      location.reload();
    }).catch(function () { reloading = false; });
  }

  // Game update alarm, on the PC with the leadership chat: when the game's files change (and once a day), each tool's way into the
  // game is tried, without starting anything. A tool that fails twice, 5 minutes apart, gets one post in the leadership chat, and
  // another when it works again. No answer from the game isn't a failure: that's tried again in 30 minutes.
  // s.gameCheck = {build, at, broken: {tool: reason}, pending: {tool: reason}, retryAt}.
  var GAME_CHECK_WAIT = 60000, GAME_CHECK_DAY = DAY, GAME_CHECK_AGAIN = 5 * 60000, GAME_CHECK_NET = 30 * 60000, gameChecking = false;
  var NO_ANSWER = /Failed to fetch|dynamically imported|NetworkError|Load failed|importing a module|no answer from the game/i;
  function gameIndex() { return performance.getEntriesByType("resource").map(function (e) { return e.name; }).filter(function (n) { return /\/assets\/index-[\w-]+\.js/.test(n); })[0] || ""; }
  function gameProbes() {
    var loaded = null;
    function family() { // the family's files and data, the way the Family tab gets them
      if (loaded) { return loaded; }
      var idx = gameIndex(), failed = false;
      if (!idx) { throw new Error("the game's files weren't found"); }
      loaded = fetch(idx).then(function (r) { return r.text(); }).then(function (t) {
        (t.match(/family-[\w-]+\.js/g) || []).forEach(function (n) { var u = idx.replace(/index-[\w-]+\.js.*$/, n); if (famUrls.indexOf(u) < 0) { famUrls.push(u); } });
        return Promise.all(famUrls.map(function (u) { return import(u).catch(function () { failed = true; }); })); // one of them not loading only matters if something's then missing
      }).then(familyQueries).then(function (q) {
        if (failed && !(q.family && q.war && q.account)) { throw new Error("no answer from the game"); }
        if (last) { return { q: q, fam: last.fam }; }
        if (!client) { findClient(); }
        if (!client) { throw new Error("the game's data can't be reached"); }
        if (!q.family) { return { q: q, fam: null }; }
        return client.fetchQuery(q.family()).then(function (d) { return { q: q, fam: d && (Array.isArray(d.members) ? d : d.family) }; }, function () { throw new Error("no answer from the game"); });
      });
      return loaded;
    }
    function fights(kit, me) { // a few real fights against yourself, since the win chances hide a fight that fails
      var at = new Date(), foe = Object.assign({}, me, { id: "syn-check" }), error = null;
      for (var i = 0; i < 5; i++) {
        try {
          var ev = kit.fight({ aggressors: [me], targets: [foe], rnd: new kit.Rnd(i + 1), useConsumables: true, at: at, maxTurnsPerRound: 1000 }), end = ev[ev.length - 1];
          if (end && Array.isArray(end.winners)) { return; }
          error = new Error("the game's fight results have changed");
        } catch (e) { error = e; }
      }
      throw new Error("the game's fight code failed: " + (error.message || error));
    }
    return [
      ["Family data and reports", function () { return family().then(function (o) {
        if (!o.q.family) { throw new Error("the family request wasn't found"); }
        if (!o.fam || !Array.isArray(o.fam.members) || !o.fam.members.some(function (m) { return m && "today" in m && "yesterday" in m; }) || !members(o.fam).some(function (m) { return m.level > 0; })) { throw new Error("the member list has changed"); }
      }); }],
      ["Honor ranks", function () { return family().then(function (o) { if (o.fam && Array.isArray(o.fam.members) && !members(o.fam).some(function (m) { return m.pos > 0; })) { throw new Error("the members' honor rank is missing"); } }); }],
      ["War alerts and debriefs", function () { return family().then(function (o) {
        if (!o.q.war) { throw new Error("the war request wasn't found"); }
        if (o.fam && (!o.fam.private || !Array.isArray(o.fam.private.wars))) { throw new Error("the family's war list is missing"); }
      }); }],
      ["Donation thank-yous", function () { return family().then(function (o) { if (!o.q.account) { throw new Error("the treasury request wasn't found"); } }); }],
      ["Invites, boosts and auto-attack", function () { return familyCommand(); }],
      ["War auto-join", function () { return family().then(function () {
        return Promise.all(famUrls.map(function (u) { return fetch(u).then(function (r) { return r.text(); }); }));
      }).then(function (files) { if (!/participate/.test(files.join(""))) { throw new Error("the game's Register request wasn't found"); } }); }],
      ["Recruit and duel scans", function () { return playerRanking(); }],
      ["Duel win chances", function () { return duelTools().then(function (kit) { var me = duelMe(); if (me) { fights(kit, me); } }); }],
      ["Your damage", function () { return duelTools().then(function (kit) {
        if (!kit.damage || !kit.fighter || !kit.stats) { throw new Error("the game's damage code wasn't recognised"); }
        var me = duelMe(); if (me) { damageRows(kit, me); }
      }); }],
      ["Learn from mail", function () { return Promise.all([duelTools(), mailboxFn()]).then(function (got) { if (!got[0].duel) { throw new Error("the game's fight records weren't recognised"); } }); }],
      ["Gang war", function () { return gangTools(); }]
    ];
  }
  function runGameChecks() {
    var out = { broken: {}, unsure: [] };
    return gameProbes().reduce(function (p, t) {
      return p.then(function () { return t[1](); }).then(null, function (e) {
        var why = String(e && e.message || e);
        if (NO_ANSWER.test(why)) { out.unsure.push(t[0]); } else { out.broken[t[0]] = why.replace(/ \(the game may have changed\)/, ""); }
      });
    }, Promise.resolve()).then(function () { return out; });
  }
  function checkGameUpdate() {
    var s = load(), now = Date.now(), g = s.gameCheck || {};
    if (!s.webhook || gameChecking || !canPost("gamecheck") || now - STARTED < GAME_CHECK_WAIT || !navigator.onLine || !/^\/game(\/|$)/.test(location.pathname)) { return; }
    var build = gameIndex().replace(/^.*\/|\?.*$/g, "");
    if (g.retryAt ? now < g.retryAt : g.build === build && now - g.at < GAME_CHECK_DAY) { return; }
    gameChecking = true;
    g.build = build; g.at = now; delete g.retryAt; s.gameCheck = g; save(s); // saved first, so a second game tab leaves it
    runGameChecks().then(function (res) {
      var n = load(), c = n.gameCheck, was = c.broken || {}, pend = c.pending || {}, broken = {}, pending = {}, news = [], fixed = [];
      Object.keys(res.broken).forEach(function (t) {
        if (was[t] || pend[t]) { broken[t] = res.broken[t]; if (!was[t]) { news.push(t); } } else { pending[t] = res.broken[t]; }
      });
      res.unsure.forEach(function (t) { if (was[t]) { broken[t] = was[t]; } });
      Object.keys(was).forEach(function (t) { if (!broken[t]) { fixed.push(t); } });
      c.broken = broken; c.pending = pending;
      if (Object.keys(pending).length) { c.retryAt = Date.now() + GAME_CHECK_AGAIN; } else if (res.unsure.length) { c.retryAt = Date.now() + GAME_CHECK_NET; }
      save(n);
      if (!news.length && !fixed.length) { return; }
      var lines = [];
      if (news.length) { lines.push("🚨 **A game update broke part of the tools**"); news.forEach(function (t) { lines.push("• **" + t + "**: " + broken[t]); }); lines.push("The rest keeps working. These need a script update."); }
      if (fixed.length) { lines.push("✅ **Working again:** " + fixed.join(", ") + "."); }
      postFor("gamecheck", n.webhook, shout(lines.join("\n")), function () { // Discord refused: post it next time
        var b = load(), bc = b.gameCheck;
        news.forEach(function (t) { bc.pending[t] = bc.broken[t]; delete bc.broken[t]; });
        fixed.forEach(function (t) { bc.broken[t] = was[t]; });
        bc.retryAt = Date.now() + GAME_CHECK_AGAIN; save(b);
      });
    }).catch(function () {}).then(function () { gameChecking = false; redraw(); });
  }

  // Offline report: a heartbeat in its own key (the main one is large) every minute from any game tab. A gap of an hour or
  // more (no game tab open, PC asleep or off) gets a note in the leadership chat with what is being caught up and what was
  // lost. The posts themselves catch up by their own checks (daily report, weekly summary, leaderboard, war results).
  var BEAT = "syn-activity-beat", GAP = HOUR, gap = null, beatAt = 0;
  function heartbeat() {
    var now = Date.now();
    if (now - beatAt < 60000) { return; }
    var prev = 0; try { prev = +localStorage.getItem(BEAT) || 0; } catch (e) {}
    if (prev && now - prev >= GAP && !gap) { gap = { from: prev, to: now }; }
    beatAt = now;
    try { localStorage.setItem(BEAT, String(now)); } catch (e) {}
  }
  function checkOffline() {
    var s = load();
    if (!gap || !last || last.at < gap.to - 5 * 60000 || !s.webhook || !canPost("offline")) { return; } // wait for numbers fetched after the gap
    var from = gap.from, to = gap.to, mid = dayStart(to), catchUp = [], lost = [];
    gap = null;
    if (s.sentDay !== dayKey(mid - DAY)) { catchUp.push("daily report for " + shortDay(mid - DAY)); }
    if (weekStart(from) < weekStart(to) && s.weekSent !== dayKey(weekStart(mid) - 7 * DAY)) { catchUp.push("weekly summary"); }
    if (s.boardHook) { catchUp.push("leaderboard"); }
    // A finished day is saved the morning after; days whose "morning after" fell entirely in the gap can't be saved any more.
    for (var d = dayStart(from); d < mid - DAY; d += DAY) { if (!(s.hist && s.hist[dayKey(d)])) { lost.push(shortDay(d)); } }
    var wars = warsOf(last.fam).filter(function (w) { var t = startOf(w); return t > from && t < to; }).map(function (w) { return md(warSide(last.fam, w).foe); });
    var mins = Math.round((to - from) / 60000);
    var text = "🔌 **The panel was offline** from <t:" + Math.round(from / 1000) + ":f> to <t:" + Math.round(to / 1000) + (to - from < 12 * HOUR ? ":t" : ":f") + "> (" + (mins >= 60 ? Math.floor(mins / 60) + "h " : "") + (mins % 60) + "m)."
      + (catchUp.length ? "\nCatching up now: " + catchUp.join(", ") + "." : "")
      + (lost.length ? "\nNo activity history for " + lost.join(", ") + " (it is saved the morning after, while the game is open)." : "")
      + (wars.length ? "\nWars that started while offline (no 15-minute reminder): " + wars.join(", ") + "." : "");
    postFor("offline", s.webhook, shout(text));
  }

  // ===== Recruiting finder =====
  // The player ranking marks players looking for a family. It isn't exported like the family queries, so the script
  // rebuilds the ranking page's own request: the game's createServerFn helpers plus the request id from its ranking-*.js file.
  // One request returns a batch of players ({players, total, batchFirst, batchLast}); the scan walks the whole ranking.
  var SPECS = { bully: "Bully", rogue: "Rogue", tactician: "Tactician" }, RECRUIT_MAX_PAGES = 80;
  var rankingFn = null, recruiting = null, copied = "";
  function playerRanking() {
    if (rankingFn) { return Promise.resolve(rankingFn); }
    var res = performance.getEntriesByType("resource").map(function (e) { return e.name; });
    var csf = res.filter(function (n) { return /\/assets\/createServerFn-[\w-]+\.js/.test(n); })[0], idx = res.filter(function (n) { return /\/assets\/index-[\w-]+\.js/.test(n); })[0];
    if (!csf || !idx) { return Promise.reject(new Error("the game's files weren't found, reload the game and try again")); }
    return Promise.all([import(csf), fetch(idx).then(function (r) { return r.text(); })]).then(function (got) {
      var mod = got[0], rk = (got[1].match(/ranking-[\w-]+\.js/) || [])[0];
      if (!rk) { throw new Error("the ranking page wasn't found in the game's files"); }
      return fetch(idx.replace(/index-[\w-]+\.js.*$/, rk)).then(function (r) { return r.text(); }).then(function (t) {
        var id = (t.match(/handler\(\w\(`([0-9a-f]{64})`\)\),\w+=\(e=\{\}\)=>\w+\(e,\(\)=>/) || [])[1], rpc = null, make = null;
        Object.keys(mod).forEach(function (k) {
          var f = mod[k], src = typeof f === "function" ? String(f) : "";
          if (src.indexOf("/_serverFn/") >= 0) { rpc = f; } else if (src.indexOf("inputValidator") >= 0) { make = f; }
        });
        if (!id || !rpc || !make) { throw new Error("the player ranking request wasn't found (the game may have changed)"); }
        rankingFn = make({ method: "GET" }).handler(rpc(id));
        return rankingFn;
      });
    });
  }
  function runRecruitScan() {
    if (recruiting && recruiting.running) { return; }
    recruiting = { running: true, step: "Loading the player ranking…" }; redraw();
    // Batches overlap (the game's batch can begin before the requested rank), so players are kept once per id.
    var found = [], seenIds = {}, start = 1, total = Infinity, pages = 0;
    playerRanking().then(function (fn) {
      function next() {
        if (start > total || pages >= RECRUIT_MAX_PAGES) { return Promise.resolve(); }
        pages++;
        return (pages > 1 ? wait(SCAN_GAP) : Promise.resolve()).then(function () { return fn({ data: { start: start } }); }).then(function (d) {
          var list = d && d.players || [];
          total = d && d.total || 0;
          list.forEach(function (p) {
            if (p.lookingForFamily && !p.family && !seenIds[p.id]) { seenIds[p.id] = true; found.push({ id: p.id, name: p.name, level: +p.level || 0, spec: p.spec, honor: +p.honor || 0, rank: p.rank }); }
          });
          var lastRank = d && d.batchLast || list.reduce(function (a, p) { return Math.max(a, p.rank || 0); }, 0);
          if (!list.length || lastRank < start) { total = 0; return; }
          start = lastRank + 1;
          recruiting.step = "Scanning the player ranking… " + Math.min(lastRank, total) + " of " + total + " players, " + found.length + " looking for a family"; redraw();
          return next();
        });
      }
      return next();
    }).then(function () {
      var s = load(); s.recruits = { at: Date.now(), total: total === Infinity ? 0 : total, list: found };
      recruiting = null;
      afterRecruitScan(s);
    }).catch(function (e) { recruiting = { error: String(e && e.message || e) }; }).then(redraw);
  }
  // Growth and alerts. Activity points of players outside the family aren't visible, but level and honor are, so every scan
  // remembers them: s.recruitHist = {id: {first: {at, level, honor}, last: {...}}}. Players searching for the first time
  // since the last scan, at or above s.recruitAlertMin, are posted to the leadership chat (the very first scan stays quiet).
  var RECRUIT_EVERY = 4 * HOUR, RECRUIT_FORGET = 14 * DAY;
  function afterRecruitScan(s) {
    var now = Date.now(), hist = s.recruitHist = s.recruitHist || {}, quiet = !s.recruitBase, fresh = [];
    s.recruits.list.forEach(function (p) {
      var snap = { at: now, level: p.level, honor: p.honor };
      if (hist[p.id]) { hist[p.id].last = snap; } else { hist[p.id] = { first: snap, last: snap }; if (!quiet) { fresh.push(p); } }
    });
    Object.keys(hist).forEach(function (id) { if (now - hist[id].last.at > RECRUIT_FORGET) { delete hist[id]; } });
    s.recruitBase = true;
    save(s);
    var min = s.recruitAlertMin || 0, alert = s.webhook && s.recruitAlert !== false ? fresh.filter(function (p) { return p.level >= min; }) : [];
    if (!alert.length) { return; }
    alert.sort(function (a, b) { return b.level - a.level; });
    postFor("recruitalert", s.webhook, {
      username: "Syndicate Activity", allowed_mentions: { parse: [] },
      embeds: [{
        title: "🧲 New player" + (alert.length === 1 ? "" : "s") + " looking for a family",
        description: alert.slice(0, 30).map(function (p) { return "`" + p.name.replace(/`/g, "'") + "` — lv " + p.level + " · " + (SPECS[p.spec] || p.spec || "?") + " · honor " + p.honor.toLocaleString("en-US"); }).join("\n").slice(0, 4000),
        color: 0x990099,
        footer: { text: "Level " + min + " and up · found by the automatic recruit scan. Tap a name to copy it." }
      }]
    });
  }
  function autoRecruits() {
    var s = load();
    if (!s.webhook || s.recruitAlert === false || !last || !client || recruiting) { return; }
    if (Date.now() - (s.recruits ? s.recruits.at : 0) < RECRUIT_EVERY) { return; }
    runRecruitScan();
  }
  function growth(s, p) {
    var h = s.recruitHist && s.recruitHist[p.id];
    if (!h) { return null; }
    var days = (h.last.at - h.first.at) / DAY;
    return { lv: h.last.level - h.first.level, honor: h.last.honor - h.first.honor, days: days, perDay: days >= 0.5 ? ((h.last.level - h.first.level) + (h.last.honor - h.first.honor) / 100) / days : null };
  }
  // inv: "all" · "open" (no open invitation) · "invited"
  function recruitFilter(s) {
    var f = s.recruitFilter || {};
    return { min: +f.min || 0, max: +f.max || 0, specs: f.specs || Object.keys(SPECS), sort: f.sort === "growth" ? "growth" : "level", inv: f.inv === "open" || f.inv === "invited" ? f.inv : "all" };
  }
  // With anyInvite, the invitation filter is left out (for the counts on its buttons).
  function recruitList(s, anyInvite) {
    var f = recruitFilter(s), once = {}, news = !anyInvite && f.inv !== "all" ? newsInvites() : null;
    return ((s.recruits && s.recruits.list) || []).filter(function (p) {
      if (once[p.id]) { return false; } // lists saved by v1.15 can hold the same player twice
      once[p.id] = true;
      if (news && !inviteOf(s, p, news) !== (f.inv === "open")) { return false; }
      return p.level >= f.min && (!f.max || p.level <= f.max) && (!p.spec || f.specs.indexOf(p.spec) >= 0);
    }).sort(function (a, b) {
      if (f.sort === "growth") {
        // Growth per day: levels plus honor/100. Players tracked for less than half a day go last.
        var ga = growth(s, a), gb = growth(s, b), x = ga && ga.perDay != null ? ga.perDay : -1, y = gb && gb.perDay != null ? gb.perDay : -1;
        if (x !== y) { return y - x; }
      }
      return b.level - a.level || b.honor - a.honor;
    });
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) { return navigator.clipboard.writeText(text).catch(function () { return copyOld(text); }); }
    return Promise.resolve(copyOld(text));
  }
  function copyOld(text) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    ta.remove();
  }
  // Invites go through the game's own request, the one behind "Invite to family" on a player's profile: the script finds
  // that page's file (an _id-*.js file named in the game's index file that sends the "invite" command) and calls the
  // function it imports from the family module. s.invited = {player id: {name, at}} remembers invites sent from here;
  // invites sent by anyone else show up in the family news ("X invited Y to the family."). Invites last 7 days in the game.
  var INVITE_DAYS = 7, INVITE_GAP = 2000;
  var inviteFn = null, inviteJob = null, inviteBusy = {};
  function familyCommand() {
    if (inviteFn) { return Promise.resolve(inviteFn); }
    var res = performance.getEntriesByType("resource").map(function (e) { return e.name; });
    var idx = res.filter(function (n) { return /\/assets\/index-[\w-]+\.js/.test(n); })[0];
    if (!idx) { return Promise.reject(new Error("the game's files weren't found, reload the game and try again")); }
    var dir = idx.replace(/index-[\w-]+\.js.*$/, "");
    return fetch(idx).then(function (r) { return r.text(); }).then(function (t) {
      var pages = (t.match(/_id-[\w-]+\.js/g) || []).filter(function (n, i, a) { return a.indexOf(n) === i; });
      return pages.reduce(function (p, n) {
        return p.then(function (got) {
          return got || fetch(dir + n).then(function (r) { return r.text(); }).then(function (src) {
            if (src.indexOf("action:`invite`") < 0) { return null; }
            var local = (src.match(/mutationFn:e=>([\w$]+)\(\{data:e\}\)/) || [])[1], re = /import\{([^}]*)\}from"\.\/(family-[\w-]+\.js)"/g, m, hit = null;
            while (local && !hit && (m = re.exec(src))) {
              m[1].split(",").forEach(function (part) { var x = part.split(" as "); if ((x[1] || x[0]) === local) { hit = { file: m[2], name: x[0] }; } });
            }
            return hit && import(dir + hit.file).then(function (mod) { return typeof mod[hit.name] === "function" ? mod[hit.name] : null; });
          });
        });
      }, Promise.resolve(null));
    }).then(function (fn) {
      if (!fn) { throw new Error("the game's invite request wasn't found (the game may have changed)"); }
      inviteFn = fn;
      return fn;
    });
  }
  function sendInvite(p) {
    if (!last) { return Promise.reject(new Error("open the Family tab once, then try again")); }
    var famId = last.fam.id;
    return familyCommand().then(function (fn) {
      return fn({ data: { requestId: crypto.randomUUID(), command: { action: "invite", familyId: famId, name: p.name } } });
    }).then(function () { markInvited(p); }, function (e) {
      var msg = String(e && e.message || e);
      if (/invit/i.test(msg) && /already|pending/i.test(msg)) { markInvited(p); return; } // invited before, by us or someone else
      var err = new Error(msg);
      // The list is from the last scan: since then the player may have joined a family or stopped searching.
      // Those are dropped from the list and skipped; refusals about our own family (full, rank) stop Invite all.
      if (/belongs to a family|already (in|has|joined) a family|already a member|not looking|no longer|not found|(doesn't|does not) exist/i.test(msg)) { dropRecruit(p); err.skip = true; }
      throw err;
    });
  }
  function dropRecruit(p) {
    var s = load();
    if (!s.recruits || !s.recruits.list) { return; }
    s.recruits.list = s.recruits.list.filter(function (x) { return x.id !== p.id; });
    save(s);
  }
  function markInvited(p) {
    var s = load(), now = Date.now();
    s.invited = s.invited || {};
    s.invited[p.id] = { name: p.name, at: now };
    Object.keys(s.invited).forEach(function (id) { if (now - s.invited[id].at > 2 * INVITE_DAYS * DAY) { delete s.invited[id]; } });
    save(s);
  }
  // Invites in the family news, by lower-case player name: {at, by}.
  function newsInvites() {
    var o = {};
    ((last && last.fam.private && last.fam.private.events) || []).forEach(function (e) {
      var m = /^(.+) invited (.+) to the family\.$/.exec(e.text || ""), at = +new Date(e.createdAt) || 0;
      if (!m) { return; }
      var k = m[2].toLowerCase();
      if (!o[k] || at > o[k].at) { o[k] = { at: at, by: m[1] }; }
    });
    return o;
  }
  // The newest invite for a player that is still open (under 7 days old), or null.
  function inviteOf(s, p, news) {
    var mine = s.invited && s.invited[p.id], n = news[String(p.name).toLowerCase()];
    var best = mine && (!n || mine.at >= n.at) ? { at: mine.at, by: "" } : n || null;
    return best && Date.now() - best.at < INVITE_DAYS * DAY ? best : null;
  }
  function ago(t) {
    var m = Math.max(0, Date.now() - t) / 60000;
    return m < 1 ? "just now" : m < 60 ? Math.round(m) + "m ago" : m < 1440 ? Math.round(m / 60) + "h ago" : Math.round(m / 1440) + "d ago";
  }
  function refreshFamily() {
    var q = last && last.query;
    if (q && typeof q.fetch === "function" && q.options && q.options.queryFn) { q.fetch().catch(function () {}); }
  }
  function inviteOne(id) {
    var p = recruitList(load()).filter(function (x) { return String(x.id) === id; })[0];
    if (!p || inviteBusy[id] || inviteJob && inviteJob.running) { return; }
    inviteBusy[id] = true; redraw();
    sendInvite(p).then(refreshFamily, function (e) { alert("Couldn't invite " + p.name + ": " + (e && e.message || e) + (e && e.skip ? "\n\nThey're no longer searching, so they've been removed from the list." : "")); })
      .then(function () { delete inviteBusy[id]; redraw(); });
  }
  // Invites everyone in the list as it's filtered now who has no open invite, one every 2 seconds. Players who have joined a
  // family since the scan are skipped; any other refusal stops it.
  function inviteAll() {
    if (inviteJob && inviteJob.running) { return; }
    var s = load(), news = newsInvites(), todo = recruitList(s).filter(function (p) { return !inviteOf(s, p, news); });
    if (!todo.length) { alert("Everyone in this list already has an open invitation."); return; }
    if (!confirm("Send a family invitation to " + todo.length + " player" + (todo.length === 1 ? "" : "s") + " (the list as filtered now)?\n\nOne goes out every " + INVITE_GAP / 1000 + " seconds. You can stop any time.")) { return; }
    var job = inviteJob = { running: true, done: 0, skipped: 0, total: todo.length, current: "" };
    redraw();
    todo.reduce(function (pr, p, i) {
      return pr.then(function () {
        if (!job.running) { return; }
        return wait(i ? INVITE_GAP : 0).then(function () {
          if (!job.running) { return; }
          job.current = p.name; redraw();
          return sendInvite(p).then(function () { job.done++; }, function (e) { if (e && e.skip) { job.skipped++; return; } throw e; });
        });
      });
    }, Promise.resolve()).then(function () {
      job.msg = (job.running ? "Done: " : "Stopped: ") + job.done + " of " + job.total + " invitations sent." + skippedNote(job);
    }, function (e) {
      job.error = "Stopped after " + job.done + " of " + job.total + " invitations." + skippedNote(job) + " The game said: " + (e && e.message || e);
    }).then(function () { job.running = false; job.current = ""; refreshFamily(); redraw(); });
  }
  // ----- A message to a searching player, through the game's own mail ("Write" tab: {to: name, message}, at most 450 characters).
  // Its request is rebuilt like the mailbox's. The text is the leader's own (s.recruitMsg, s.recruitDiscord), kept on this PC only.
  // s.messaged = {player id: {name, at}}: one message per player a week, sent one at a time by clicking, never in bulk.
  var RMSG_DEFAULT = "Hi {name}! {family} is recruiting and we'd like you with us. We ask for 100 activity points a day, and everyone joins our Discord: {discord} Reply here if you're interested.";
  var RMSG_MAX = 450, RMSG_DAYS = 7, msgFn = null, msgBusy = {}, rmsgOpen = false;
  function messageFn() {
    if (msgFn) { return Promise.resolve(msgFn); }
    var res = performance.getEntriesByType("resource").map(function (e) { return e.name; });
    var csf = res.filter(function (n) { return /\/assets\/createServerFn-[\w-]+\.js/.test(n); })[0], idx = res.filter(function (n) { return /\/assets\/index-[\w-]+\.js/.test(n); })[0];
    if (!csf || !idx) { return Promise.reject(new Error("the game's files weren't found, reload the game and try again")); }
    return Promise.all([import(csf), fetch(idx).then(function (r) { return r.text(); })]).then(function (got) {
      var mod = got[0], file = (got[1].match(/(?:^|[^\w-])(mail-[\w-]+\.js)/) || [])[1];
      if (!file) { throw new Error("the mail page wasn't found in the game's files"); }
      return fetch(idx.replace(/index-[\w-]+\.js.*$/, file)).then(function (r) { return r.text(); }).then(function (t) {
        var name = (t.match(/mutationFn:([\w$]+),retry:!1,onError:[^]{0,200}?Your message has been sent/) || [])[1], id = null, rpc = null, make = null;
        if (name) { id = (t.match(new RegExp("[^\\w$]" + name.replace(/\$/g, "\\$") + "=[\\w$]+\\(\\{method:`POST`\\}\\)\\.handler\\([\\w$]+\\(`([0-9a-f]{64})`\\)\\)")) || [])[1]; }
        Object.keys(mod).forEach(function (k) {
          var f = mod[k], src = typeof f === "function" ? String(f) : "";
          if (src.indexOf("/_serverFn/") >= 0) { rpc = f; } else if (src.indexOf("inputValidator") >= 0) { make = f; }
        });
        if (!id || !rpc || !make) { throw new Error("the game's message request wasn't found (the game may have changed)"); }
        msgFn = make({ method: "POST" }).handler(rpc(id));
        return msgFn;
      });
    });
  }
  function recruitMsgFor(s, p) {
    return (s.recruitMsg || RMSG_DEFAULT).split("{name}").join(p.name).split("{family}").join(last && last.fam && last.fam.name || "Our family")
      .split("{discord}").join(s.recruitDiscord || "").replace(/[ \t]+/g, " ").trim();
  }
  function recruitMsgProblem(s) {
    if ((s.recruitMsg || RMSG_DEFAULT).indexOf("{discord}") >= 0 && !s.recruitDiscord) { return "Add your Discord invite link first, under Edit message."; }
    if (recruitMsgFor(s, { name: "xxxxxxxxxxxxxxxxxxxx" }).length > RMSG_MAX) { return "The message is too long for the game, which takes " + RMSG_MAX + " characters. Shorten it under Edit message."; }
    return "";
  }
  function messagedOf(s, p) { var m = s.messaged && s.messaged[p.id]; return m && Date.now() - m.at < RMSG_DAYS * DAY ? m : null; }
  function messageOne(id) {
    var s = load(), p = recruitList(s, true).filter(function (x) { return String(x.id) === id; })[0], bad = recruitMsgProblem(s);
    if (!p || msgBusy[id]) { return; }
    if (bad) { alert(bad); rmsgOpen = true; redraw(); return; }
    msgBusy[id] = true; redraw();
    messageFn().then(function (fn) { return fn({ data: { to: p.name, message: recruitMsgFor(s, p) } }); }).then(function () {
      var n = load(), now = Date.now();
      n.messaged = n.messaged || {}; n.messaged[p.id] = { name: p.name, at: now };
      Object.keys(n.messaged).forEach(function (k) { if (now - n.messaged[k].at > 30 * DAY) { delete n.messaged[k]; } });
      save(n);
    }, function (e) { alert("Couldn't message " + p.name + ": " + (e && e.message || e)); })
      .then(function () { delete msgBusy[id]; redraw(); });
  }
  // A test of the message to any player, like a family member. It isn't remembered as a recruiting message.
  var msgTest = { busy: false, note: "", bad: false };
  function messageTest(name) {
    var s = load(), bad = recruitMsgProblem(s);
    name = String(name || "").trim();
    if (!name || msgTest.busy) { return; }
    if (bad) { msgTest = { busy: false, note: bad, bad: true }; redraw(); return; }
    msgTest = { busy: true, note: "Sending to " + name + "…", bad: false }; redraw();
    messageFn().then(function (fn) { return fn({ data: { to: name, message: recruitMsgFor(s, { name: name }) } }); }).then(function () {
      msgTest = { busy: false, note: "Sent to " + name + ". Check it in their Messages tab.", bad: false };
    }, function (e) { msgTest = { busy: false, note: "Couldn't send to " + name + ": " + (e && e.message || e), bad: true }; }).then(redraw);
  }
  function recruitMsgHtml(s) {
    var text = s.recruitMsg || RMSG_DEFAULT, sample = recruitMsgFor(s, { name: "PlayerName" }), bad = recruitMsgProblem(s);
    return "<div class='setup'><b>✉️ Recruiting message</b>"
      + "<div class='row filters'><label>Discord invite <input type='text' data-rdisc value='" + esc(s.recruitDiscord || "") + "' placeholder='https://discord.gg/…' spellcheck='false' autocomplete='off' style='min-width:220px'></label></div>"
      + "<textarea data-rmsg rows='4' maxlength='" + RMSG_MAX + "' spellcheck='true' style='width:100%;box-sizing:border-box;margin:4px 0;padding:7px 8px;border-radius:6px;border:1px solid var(--strong);background:var(--input);color:var(--fg);font:inherit;font-size:12px;resize:vertical'>" + esc(text) + "</textarea>"
      + "<div style='font-size:11.5px;color:var(--muted)'>{name} becomes the player's name, {family} the family's name and {discord} your invite link. With a 10-letter name it's " + sample.length + " of " + RMSG_MAX + " characters. Use a Discord invite that never expires.</div>"
      + (bad ? "<div class='st bad'>" + esc(bad) + "</div>" : "")
      + "<div class='row filters'><label>Test it on <input type='text' data-rmsgto placeholder='Player name' maxlength='20' spellcheck='false' autocomplete='off' style='max-width:150px'></label><button type='button' data-rmsgtest" + (msgTest.busy ? " disabled" : "") + ">Send test</button></div>"
      + (msgTest.note ? "<div class='st" + (msgTest.bad ? " bad" : "") + "'>" + esc(msgTest.note) + "</div>" : "")
      + "<div class='row'>" + (s.recruitMsg ? "<button type='button' data-rmsgreset>Reset text</button>" : "") + "<button type='button' data-rmsgopen>Done</button></div></div>";
  }
  function skippedNote(job) {
    return job.skipped ? " " + job.skipped + " skipped: no longer searching (removed from the list)." : "";
  }
  function recruitHtml(s) {
    var r = s.recruits, f = recruitFilter(s), list = recruitList(s), h = "";
    h += "<div class='st'>Players in the ranking marked <b>looking for a family</b>. Click a name to copy it, or send them your recruiting message.</div>";
    var wk = weakest(s).rows.slice(0, 2), seats = seatsLine(last.fam);
    if (seats || wk.length) { h += "<div class='st'>" + esc(seats) + (wk.length ? " Weakest now: " + wk.map(function (r) { return "<b>" + esc(r.m.name) + "</b>"; }).join(", ") + ". <button type='button' data-ranks>See why</button>" : "") + "</div>"; }
    if (recruiting && recruiting.running) { h += "<div class='st wait'>" + esc(recruiting.step) + "</div>"; }
    else if (recruiting && recruiting.error) { h += "<div class='st bad'>Scan failed: " + esc(recruiting.error) + ".</div>"; }
    h += "<div class='row filters'><label>Level <input type='number' min='0' data-rf='min' value='" + (f.min || "") + "' placeholder='min'></label>"
      + "<label>to <input type='number' min='0' data-rf='max' value='" + (f.max || "") + "' placeholder='max'></label><span class='seg'>"
      + Object.keys(SPECS).map(function (k) { return "<button type='button' data-spec='" + k + "' class='" + (f.specs.indexOf(k) >= 0 ? "on" : "") + "'>" + SPECS[k] + "</button>"; }).join("")
      + "</span><span class='seg'>" + [["level", "By level"], ["growth", "By growth"]].map(function (o) { return "<button type='button' data-rsort='" + o[0] + "' class='" + (f.sort === o[0] ? "on" : "") + "'>" + o[1] + "</button>"; }).join("")
      + "</span></div>";
    var news = newsInvites(), every = recruitList(s, true), invited = every.filter(function (p) { return inviteOf(s, p, news); }).length;
    h += "<div class='row filters'><span class='seg'>" + [["all", "All", every.length], ["open", "Not invited", every.length - invited], ["invited", "Invited", invited]].map(function (o) {
      return "<button type='button' data-rinv='" + o[0] + "' class='" + (f.inv === o[0] ? "on" : "") + "'>" + o[1] + " (" + o[2] + ")</button>";
    }).join("") + "</span></div>"
      + (s.webhook ? "<div class='row filters'><label>🔔 Alert the leadership chat about new searching players from level <input type='number' min='0' data-ra value='" + (s.recruitAlertMin || 0) + "'></label>"
        + "<button type='button' data-ratoggle>" + (s.recruitAlert === false ? "Alerts off" : "Alerts on") + "</button></div>" : "");
    var job = inviteJob, open = list.filter(function (p) { return !inviteOf(s, p, news); }).length;
    if (job && job.running) { h += "<div class='st wait'>Sending invitations… " + job.done + " of " + job.total + (job.current ? " · " + esc(job.current) : "") + " <button type='button' data-invstop>Stop</button></div>"; }
    else if (job && job.error) { h += "<div class='st bad'>" + esc(job.error) + "</div>"; }
    else if (job && job.msg) { h += "<div class='st'>" + esc(job.msg) + "</div>"; }
    // Buttons and the scan summary above the list, so nothing needs scrolling down.
    h += "<div class='row'><button type='button' class='go' data-rscan" + (recruiting && recruiting.running ? " disabled" : "") + ">" + (r ? "Scan again" : "Find recruits") + "</button>"
      + (open ? "<button type='button' data-inviteall" + (job && job.running ? " disabled" : "") + ">Invite all (" + open + ")</button>" : "")
      + (list.length ? "<button type='button' data-copyall>Copy all names</button>" : "")
      + "<button type='button' data-rmsgopen>" + (rmsgOpen ? "Close message" : "Edit message") + "</button>"
      + (list.length && s.webhook ? "<button type='button' data-postrecruits>Post to leadership chat</button>" : "") + "</div>";
    if (rmsgOpen) { h += recruitMsgHtml(s); }
    if (r) {
      h += "<div class='st'>" + list.length + " of " + Object.keys(r.list.reduce(function (o, p) { o[p.id] = 1; return o; }, {})).length + " searching players shown · scanned " + clock(r.at)
        + (Date.now() - r.at > 3600000 ? " (over an hour ago)" : "") + ", " + r.total.toLocaleString("en-US") + " players checked.</div>";
      h += "<table><thead><tr><th>Rank</th><th>Name</th><th>Class</th><th>Level</th><th>Honor</th><th title='Levels and honor gained since the scans first saw them searching'>Growth</th><th></th><th></th><th></th></tr></thead><tbody>"
        + (list.length ? list.map(function (p) {
          var g = growth(s, p), gt = !g || g.days < 0.5 ? "<span class='idle'>new</span>" : (g.lv > 0 ? "+" + g.lv + " lv " : "") + (g.honor > 0 ? "+" + g.honor + " hon " : "") + (g.lv <= 0 && g.honor <= 0 ? "– " : "") + "<span class='idle'>" + Math.round(g.days) + "d</span>";
          var inv = inviteOf(s, p, news), busyNow = inviteBusy[p.id] || job && job.running && job.current === p.name;
          var it = busyNow ? "<span class='idle'>sending…</span>"
            : inv ? "<span class='invd' title='Invited " + (inv.by ? "by " + esc(inv.by) + " " : "") + new Date(inv.at).toLocaleString() + ". Invitations last " + INVITE_DAYS + " days.'>✉ invited " + ago(inv.at) + "</span>"
            : "<button type='button' class='inv' data-invite='" + esc(p.id) + "'" + (job && job.running ? " disabled" : "") + ">Invite</button>";
          var msgd = messagedOf(s, p), mt = msgBusy[p.id] ? "<span class='idle'>sending…</span>"
            : msgd ? "<span class='invd' title='Messaged " + new Date(msgd.at).toLocaleString() + ". The button comes back after " + RMSG_DAYS + " days.'>✉ messaged " + ago(msgd.at) + "</span>"
            : "<button type='button' class='inv' data-rmsgsend='" + esc(p.id) + "' title='Sends your recruiting message to " + esc(p.name) + " through the game&#39;s mail'>Message</button>";
          return "<tr" + (inv ? " class='done'" : "") + "><td>" + (p.rank || "") + "</td><td><button type='button' class='name' data-copy='" + esc(p.name) + "' title='Copy name'>" + esc(p.name)
            + (copied === p.name ? " <span class='idle'>copied ✓</span>" : "") + "</button></td><td>" + esc(SPECS[p.spec] || p.spec || "?") + "</td><td>" + p.level + "</td><td>" + p.honor.toLocaleString("en-US") + "</td>"
            + "<td" + (g && g.lv > 0 ? " class='up'" : "") + ">" + gt + "</td><td>" + it + "</td><td>" + mt + "</td><td><a href='/game/player/" + encodeURIComponent(p.id) + "' title='Open profile'>👤</a></td></tr>";
        }).join("") : "<tr><td colspan='9' style='text-align:center'>Nobody matches these filters.</td></tr>")
        + "</tbody></table>";
      h += "<div class='st'>Growth: other players' activity points aren't visible, so the scans compare level and honor over time instead. "
        + (s.webhook && s.recruitAlert !== false ? "While the game is open, the scan repeats every " + RECRUIT_EVERY / HOUR + " hours by itself." : "") + "</div>";
    } else if (!recruiting) {
      h += "<div class='st'>The scan reads the whole player ranking, one page after another, so it can take a minute.</div>";
    }
    return h;
  }
  function postRecruits() {
    var s = load(), list = recruitList(s), f = recruitFilter(s);
    if (!s.webhook || !list.length) { return Promise.resolve(); }
    var lines = list.slice(0, 40).map(function (p) { return "`" + p.name.replace(/`/g, "'") + "` — lv " + p.level + " · " + (SPECS[p.spec] || p.spec || "?") + " · honor " + p.honor.toLocaleString("en-US"); });
    return postFor("recruits", s.webhook, {
      username: "Syndicate Activity", allowed_mentions: { parse: [] },
      embeds: [{
        title: "🧲 Players looking for a family" + (f.min || f.max ? " · level " + (f.min || 1) + (f.max ? "–" + f.max : "+") : "")
          + (f.specs.length < 3 ? " · " + f.specs.map(function (k) { return SPECS[k]; }).join(" / ") : ""),
        description: (lines.join("\n") + (list.length > 40 ? "\n…and " + (list.length - 40) + " more" : "")).slice(0, 4000),
        color: 0x990099,
        footer: { text: "From the player ranking (scanned " + clock(s.recruits.at) + "). Names in grey boxes can be tapped to copy." }
      }]
    });
  }

  // ===== Evening reminder =====
  // In the family chat, 3 hours before the reset (10 PM German winter time, 11 PM summer): everyone still under 100 today,
  // pinged if linked, or a celebration when everyone made it. Once per game day, and only with fresh numbers.
  var EVENING_BEFORE = 3 * HOUR, EVENING_LAST = 15 * 60 * 1000;
  function checkEvening() {
    var s = load(), now = Date.now(), mid = dayStart(now), reset = mid + DAY, day = dayKey(mid);
    if (!s.lvHook || !last || s.eveSaid === day || !canPost("evening")) { return; }
    if (now < reset - EVENING_BEFORE || now > reset - EVENING_LAST || last.at < now - 10 * 60 * 1000) { return; }
    var under = members(last.fam).filter(function (m) { return m.today < FULL && !awayUntil(s, m.id); }).sort(function (a, b) { return b.today - a.today; });
    s.eveSaid = day; save(s);
    var users = [], hours = Math.round((reset - now) / HOUR), t = Math.round(reset / 1000), time = hours >= 1 ? hours + " hour" + (hours === 1 ? "" : "s") : "under 1 hour";
    var text = under.length
      ? say(under.length <= 3 ? "eveFew" : "eveHead", { time: time, reset: "<t:" + t + ":t>" }) + "\n"
        + under.map(function (m) { return "• " + who(s, m, users) + " — " + m.today + "/100"; }).join("\n")
        + "\n" + say("eveTail")
      : say("eveAll");
    var msg = dress("Family", text, users);
    msg.keepPings = true; // the evening reminder is about right now, so it pings even right after the game was opened
    postFor("evening", s.lvHook, msg, function () { var n = load(); delete n.eveSaid; save(n); });
  }

  // ===== Rank suggestions =====
  // From the last 30 saved days and the war attendance: Soldiers who are ready for Capo, and Capos worth a talk.
  // Ready: 7+ saved days, 100+ on at least 80% of them, and fought in at least 75% of the wars tracked for them.
  // Check: 3+ days in a row at 0, under 40% of days at 100+, or (with 3+ wars) fought in under a third.
  var RANKS = { soldier: "Soldier", capo: "Capo", counselor: "Counselor", godfather: "Godfather" }, ADVICE_DAYS = 30, ADVICE_MIN_DAYS = 7;
  function rankAdvice(s) {
    var h = s.hist || {}, mid = dayStart(Date.now()), keys = [], att = attendance(s, members(last.fam));
    for (var i = 1; i <= ADVICE_DAYS; i++) { keys.push(dayKey(mid - i * DAY)); }
    var rows = members(last.fam).map(function (m) {
      var rec = keys.filter(function (k) { return h[k] && h[k][m.id]; }), full = rec.filter(function (k) { return h[k][m.id].ap >= FULL; }).length, a = att[m.id] || { fought: 0, wars: 0 };
      return { m: m, days: rec.length, full: full, rate: rec.length ? full / rec.length : 0, wars: a.wars, fought: a.fought, idle: idleDays(s, m.id, mid), streak: fullStreak(s, m.id, mid) };
    });
    var why = function (r) {
      return r.full + "/" + r.days + " days at 100+" + (r.streak >= 3 ? " · 🔥 " + r.streak + " in a row" : "") + (r.wars ? " · fought " + r.fought + "/" + r.wars + " wars" : "") + (r.idle >= 2 ? " · 💤 " + r.idle + " days at 0" : "");
    };
    var ready = rows.filter(function (r) { return r.m.rank === "soldier" && r.days >= ADVICE_MIN_DAYS && r.rate >= 0.8 && (!r.wars || r.fought / r.wars >= 0.75); })
      .sort(function (a, b) { return b.rate - a.rate || b.streak - a.streak; });
    var check = rows.filter(function (r) { return r.m.rank === "capo" && (r.idle >= 3 || r.days >= ADVICE_MIN_DAYS && r.rate < 0.4 || r.wars >= 3 && r.fought / r.wars < 1 / 3); })
      .sort(function (a, b) { return a.rate - b.rate; });
    var days = keys.filter(function (k) { return h[k]; }).length, wars = Object.keys(att).reduce(function (x, id) { return Math.max(x, att[id].wars); }, 0);
    return { ready: ready, check: check, why: why, days: days, wars: wars };
  }
  // Who to replace when the family needs a seat. Weakness is out of 100: 60 for activity, 20 for not being linked to Discord, 20 for missed wars.
  // Activity is two thirds reaching 100 (each finished day counts up to 100, and the last 7 days weigh as much as the whole 30, so someone who has recently
  // stopped shows up) and one third the average points against the family's median, because most members pass 100 and it would otherwise rank them alike. Without Discord links on this PC (or with too few wars) those parts aren't counted, and the score is scaled back up to 100.
  // Left out: the Godfather and Counselors, members marked away, and anyone with under 3 finished days to judge.
  var WEAK_DAYS = 30, WEAK_RECENT = 7, WEAK_MIN_DAYS = 3, WEAK_MIN_WARS = 3, WEAK_SHOW = 5, weakAll = false;
  function weakest(s) {
    var mid = dayStart(Date.now()), list = members(last.fam), att = attendance(s, list), linked = s.links && Object.keys(s.links).length > 0, out = { rows: [], away: 0, young: 0 };
    list.forEach(function (m) {
      if (m.rank === "godfather" || m.rank === "counselor") { return; }
      if (awayUntil(s, m.id)) { out.away++; return; }
      var days = 0, full = 0, zero = 0, sum = 0, capped = 0, recent = 0, recentDays = 0;
      for (var i = 1; i <= WEAK_DAYS; i++) {
        var t = mid - i * DAY, r = s.hist && s.hist[dayKey(t)], ap = r && r[m.id] ? r[m.id].ap : i === 1 ? m.yesterday : null;
        if (ap == null || m.joinedAt > t) { continue; }
        ap = +ap || 0;
        days++; sum += ap; capped += Math.min(ap, FULL);
        if (ap >= FULL) { full++; }
        if (!ap) { zero++; }
        if (i <= WEAK_RECENT) { recent += Math.min(ap, FULL); recentDays++; }
      }
      if (days < WEAK_MIN_DAYS) { out.young++; return; }
      var a = att[m.id] || { fought: 0, wars: 0 };
      out.rows.push({ m: m, reach: (capped / days + recent / recentDays) / 2 / FULL, days: days, full: full, zero: zero, avg: Math.round(sum / days), noDiscord: linked && !s.links[m.id], fought: a.fought, wars: a.wars, idle: idleDays(s, m.id, mid) });
    });
    var avgs = out.rows.map(function (r) { return r.avg; }).sort(function (x, y) { return x - y; }), median = avgs[avgs.length >> 1] || 1;
    out.rows.forEach(function (r) {
      var hasWars = r.wars >= WEAK_MIN_WARS, most = 60 + (linked ? 20 : 0) + (hasWars ? 20 : 0), act = r.reach * 2 / 3 + Math.min(1, r.avg / median) / 3;
      r.score = Math.round(((1 - act) * 60 + (r.noDiscord ? 20 : 0) + (hasWars ? (1 - r.fought / r.wars) * 20 : 0)) / most * 100);
    });
    out.rows.sort(function (x, y) { return y.score - x.score || x.m.level - y.m.level; });
    return out;
  }
  function weakWhy(r) {
    return "about " + r.avg.toLocaleString("en-US") + " points a day · " + r.full + "/" + r.days + " days at 100+" + (r.idle >= 2 ? " · 💤 " + r.idle + " days at 0 now" : r.zero ? " · " + r.zero + " at 0" : "")
      + (r.noDiscord ? " · not on Discord" : "") + (r.wars ? " · fought " + r.fought + "/" + r.wars + " wars" : "");
  }
  function seatsLine(fam) {
    var cap = +fam.capacity, n = fam.members.length;
    return cap ? n + " of " + cap + " seats taken" + (cap > n ? ": " + (cap - n) + " free, so nobody has to go yet." : ", so a new member needs a free seat.") : "";
  }
  function weakHtml(s) {
    var w = weakest(s), linked = s.links && Object.keys(s.links).length > 0, seats = seatsLine(last.fam), rows = weakAll ? w.rows : w.rows.slice(0, WEAK_SHOW), left = [];
    if (w.away) { left.push(w.away + " marked away"); }
    if (w.young) { left.push(w.young + " too new to judge"); }
    var h = "<div class='st' style='color:var(--fg)'><b>🔻 Weakest members</b></div><div class='st'>" + (seats ? esc(seats) + " " : "") + "Weakest first, out of 100"
      + "<span title='Activity over the last 30 days, with the last 7 counting extra" + (linked ? ", not being on Discord" : "") + " and missed wars. Leaders are left out.'> (what counts?)</span>."
      + (left.length ? " Left out: " + left.join(", ") + "." : "") + (linked ? "" : " Discord only counts on the PC with the member links.") + "</div>";
    if (!w.rows.length) { return h + "<div class='st'>Nobody to judge yet.</div>"; }
    if (w.rows[0].days < ADVICE_MIN_DAYS) { h += "<div class='st wait'>Only " + w.rows[0].days + " days of history so far, so treat this as a rough guide.</div>"; }
    h += "<table class='adv'><tbody>" + rows.map(function (r) {
      return "<tr><td><a class='who' href='/game/player/" + esc(r.m.id) + "' title='Open profile'>" + esc(r.m.name) + "</a> <span class='idle'>" + esc(RANKS[r.m.rank] || r.m.rank) + " · lv " + r.m.level + "</span></td><td><b>" + r.score + "</b> · " + esc(weakWhy(r)) + "</td></tr>";
    }).join("") + "</tbody></table>";
    if (w.rows.length > WEAK_SHOW) { h += "<div class='row'><button type='button' data-weakall>" + (weakAll ? "Show the " + WEAK_SHOW + " weakest" : "Show all " + w.rows.length) + "</button></div>"; }
    return h;
  }
  function ranksHtml(s) {
    var a = rankAdvice(s), h = "";
    h += "<div class='st'>Based on the last " + a.days + " saved day" + (a.days === 1 ? "" : "s") + " (of " + ADVICE_DAYS + ") and " + a.wars + " tracked war" + (a.wars === 1 ? "" : "s") + ". Suggestions only; you decide.</div>";
    if (a.days < ADVICE_MIN_DAYS) { h += "<div class='st wait'>Promotions need at least " + ADVICE_MIN_DAYS + " saved days of history (" + a.days + " so far). Capo checks already work.</div>"; }
    if (s.webhook) { h += "<div class='row'><button type='button' data-postranks>Post to leadership chat</button></div>"; }
    var block = function (title, list, empty) {
      return "<div class='st' style='color:var(--fg)'><b>" + title + "</b></div>" + (list.length ? "<table class='adv'><tbody>" + list.map(function (r) {
        return "<tr><td>" + esc(r.m.name) + " <span class='idle'>" + esc(RANKS[r.m.rank] || r.m.rank) + " · lv " + r.m.level + "</span></td><td>" + esc(a.why(r)) + "</td></tr>";
      }).join("") + "</tbody></table>" : "<div class='st'>" + empty + "</div>");
    };
    h += block("⬆️ Ready for Capo", a.ready, "Nobody yet: Soldiers need 100+ on 80% of their days and 75% war attendance.");
    h += block("👀 Capos to check", a.check, "All Capos are doing fine.");
    h += weakHtml(s);
    return h;
  }
  function postRanks() {
    var s = load(), a = rankAdvice(s), line = function (r) { return "**" + md(r.m.name) + "** (lv " + r.m.level + ") — " + a.why(r); }, weak = weakest(s).rows.slice(0, WEAK_SHOW);
    if (!s.webhook) { return Promise.resolve(); }
    return postFor("ranks", s.webhook, {
      username: "Syndicate Activity", allowed_mentions: { parse: [] },
      embeds: [{
        title: "👑 Rank suggestions",
        description: ("⬆️ **Ready for Capo**\n" + (a.ready.length ? a.ready.map(line).join("\n") : "Nobody yet.")
          + "\n\n👀 **Capos to check**\n" + (a.check.length ? a.check.map(line).join("\n") : "All Capos are doing fine.")
          + "\n\n🔻 **Weakest members**\n" + (weak.length ? weak.map(function (r) { return "**" + md(r.m.name) + "** (lv " + r.m.level + ", " + r.score + "/100) — " + weakWhy(r); }).join("\n") : "Nobody to judge yet.")).slice(0, 4000),
        color: 0xffbf30,
        footer: { text: "Last " + a.days + " saved days and " + a.wars + " tracked wars. Suggestions only." }
      }]
    });
  }

  // ===== Boost reminders =====
  // The family's XP and cash boosts (+10% / +25% for 7 days) are in family.private: xpBoost, xpBoostUntil, cashBoost, cashBoostUntil.
  // Leadership chat: a day before the end, an hour before, and when it ran out. Family chat: when a new boost starts.
  // s.boosts = {xp|cash: {until, pct, d24, h1, ended}}; the first look stays quiet.
  var BOOSTS = { xp: "XP", cash: "Cash" };
  function checkBoosts() {
    var s = load(), p = last && last.fam.private;
    if (!p || !canPost("boost") || !canPost("boostfam")) { return; }
    var now = Date.now(), lead = [], fam = [], changed = false, auto = autoOn(s, p), reminded = false;
    s.boosts = s.boosts || {};
    Object.keys(BOOSTS).forEach(function (k) {
      var until = p[k + "BoostUntil"] ? new Date(p[k + "BoostUntil"]).getTime() : 0, pct = +p[k + "Boost"] || 0, b = s.boosts[k], name = BOOSTS[k];
      if (!b) { s.boosts[k] = { until: until, pct: pct, d24: until - now <= DAY, h1: until - now <= HOUR, ended: until <= now }; changed = true; return; }
      var t = Math.round(until / 1000);
      if (until !== b.until && until > now) {
        if (until > b.until) { fam.push(say("boostOn", { pct: pct, name: name, until: "<t:" + t + ":f>" })); }
        s.boosts[k] = { until: until, pct: pct, d24: until - now <= DAY, h1: until - now <= HOUR, ended: false }; changed = true; return;
      }
      if (until > now) {
        if (b.pct !== pct) { b.pct = pct; changed = true; }
        var again = auto[k] ? " Auto-renew is on: it will be bought again when it ends, if the game is open on that PC." : " Buy it again on the Family tab to keep it running.";
        if (!b.h1 && until - now <= HOUR) { b.h1 = b.d24 = true; changed = reminded = true; lead.push("⏰ The **+" + pct + "% " + name + " boost** ends <t:" + t + ":R>!" + again); }
        else if (!b.d24 && until - now <= DAY) { b.d24 = true; changed = reminded = true; lead.push("⏳ The **+" + pct + "% " + name + " boost** ends <t:" + t + ":R> (<t:" + t + ":f>)." + again); }
      } else if (b.until && !b.ended) { b.ended = true; changed = true; lead.push("⌛ The **+" + b.pct + "% " + name + " boost** has ended." + (auto[k] ? " Auto-renew is buying a new one." : " Buy a new one on the Family tab.")); }
    });
    if (reminded) { var gl = renewGold(p, now); if (gl) { lead.push(gl); } }
    if (changed) { save(s); }
    if (lead.length && s.webhook) { postFor("boost", s.webhook, shout(lead.join("\n"))); }
    if (fam.length && s.lvHook) { postFor("boostfam", s.lvHook, dress("Family", fam.join("\n\n"))); }
  }
  // Added to the "ends in a day / an hour" reminders: what renewing at +25% costs for every boost ending within a day,
  // against the family treasury, so there's time to collect donations if gold is missing.
  function renewGold(p, now) {
    var price = p.boostPrices && +p.boostPrices.high, gold = +p.treasury || 0;
    if (!price || p.treasury == null) { return ""; }
    var n = Object.keys(BOOSTS).filter(function (k) { var u = boostEnd(p, k); return u > now && u - now <= DAY; }).length || 1, need = price * n;
    return "💰 Renewing at +" + AUTO_PCT + "% costs " + price.toLocaleString("en-US") + " gold" + (n > 1 ? " each (" + need.toLocaleString("en-US") + " for both)" : "")
      + "; the treasury has " + gold.toLocaleString("en-US") + "."
      + (gold < need ? " ⚠️ **" + (need - gold).toLocaleString("en-US") + " gold missing**: time to collect donations!" : " ✅ Enough gold.");
  }

  // Auto-renew (s.autoBoost = {xp, cash}, switched on per PC): a boost that has run out is bought again at +25% for 7 days
  // with family gold, through the same command as the Family tab's buy buttons. The game lets Godfathers and Counselors buy.
  // The family data is loaded fresh first, so a boost someone has just bought isn't bought twice.
  // s.autoTry = {xp|cash: {until, n, at, said}}: attempts for the boost that ended at `until`. A refusal is tried 3 times,
  // 30 minutes apart; too little family gold is checked again every 30 minutes. Each is posted to the leadership chat once.
  var AUTO_PCT = 25, AUTO_TRIES = 3, AUTO_GAP = 30 * 60000, autoBusy = false;
  function autoOn(s, p) {
    var on = s.autoBoost || {}, ok = p && (!p.rank || p.rank === "godfather" || p.rank === "counselor"); // without a rank the game decides
    return { xp: !!(ok && on.xp), cash: !!(ok && on.cash) };
  }
  function boostEnd(p, k) { return p[k + "BoostUntil"] ? new Date(p[k + "BoostUntil"]).getTime() : 0; }
  function checkAutoBoost() {
    var s = load(), p = last && last.fam.private, auto = autoOn(s, p), now = Date.now(), tries = s.autoTry || {};
    if (!p || autoBusy || !(auto.xp || auto.cash) || now - last.at > 5 * 60000) { return; }
    var kind = Object.keys(BOOSTS).filter(function (k) {
      var until = boostEnd(p, k), t = tries[k];
      if (!auto[k] || until > now) { return false; }
      return !t || t.until !== until || (t.gold || t.n < AUTO_TRIES) && now - t.at >= AUTO_GAP;
    })[0];
    if (!kind) { return; }
    var q = last.query, famId = last.fam.id, name = BOOSTS[kind];
    if (!q || typeof q.fetch !== "function") { return; }
    autoBusy = true;
    q.fetch().then(function (d) {
      var fp = d && (d.family || d).private, until = fp ? boostEnd(fp, kind) : 0;
      if (!fp || until > Date.now()) { return; } // someone has renewed it already
      var s2 = load(), t = s2.autoTry && s2.autoTry[kind], same = t && t.until === until;
      var rec = { until: until, n: (same ? t.n : 0) + 1, at: Date.now(), said: same ? t.said : "" };
      s2.autoTry = s2.autoTry || {}; s2.autoTry[kind] = rec; save(s2);
      var price = fp.boostPrices && fp.boostPrices.high, gold = +fp.treasury || 0;
      function note(key, text) { // one leadership post per ended boost and reason
        var s3 = load();
        if (s3.autoTry[kind].said === key) { return; }
        s3.autoTry[kind].said = key; save(s3);
        if (s3.webhook) { postFor("autoboost", s3.webhook, shout(text)); }
      }
      if (!price) { note("price", "⚠️ Couldn't auto-renew the **" + name + " boost**: the game didn't show a price. Buy it on the Family tab."); return; }
      if (gold < price) {
        var s4 = load(); s4.autoTry[kind].gold = true; save(s4);
        note("gold", "⚠️ Not enough family gold to auto-renew the **+" + AUTO_PCT + "% " + name + " boost**: it costs " + price.toLocaleString("en-US") + ", the treasury has " + gold.toLocaleString("en-US") + ". Checking again every 30 minutes.");
        return;
      }
      return familyCommand().then(function (fn) {
        return fn({ data: { requestId: crypto.randomUUID(), command: { action: "boost", familyId: famId, kind: kind, percent: AUTO_PCT, price: price } } });
      }).then(function () {
        note("bought", "🛒 Auto-renewed the **+" + AUTO_PCT + "% " + name + " boost** for 7 days: " + price.toLocaleString("en-US") + " family gold paid, " + (gold - price).toLocaleString("en-US") + " left.");
        refreshFamily();
      }, function (e) {
        if (rec.n >= AUTO_TRIES) { note("fail", "⚠️ Couldn't auto-renew the **" + name + " boost** after " + AUTO_TRIES + " tries. The game said: " + (e && e.message || e) + ". Buy it on the Family tab."); }
      });
    }).catch(function () {}).then(function () { autoBusy = false; redraw(); });
  }

  // ===== Donation shout-outs =====
  // A thank-you in the family chat for every single donation of 500 gold or more, louder for bigger ones. Read every 5 minutes
  // from the treasury ledger (the game's own query behind the Family tab's account page: {ledger: [{id, userId, userName, kind, amount}]}).
  // s.donSeen = highest ledger entry id handled; the first look stays quiet about older donations.
  var DON_MIN = 500, DON_EVERY = 5 * 60000, donAt = 0, donBusy = false;
  var DON_SHOUTS = [[10000, "don3"], [2000, "don2"], [DON_MIN, "don1"]];
  function checkDonations() {
    var s = load();
    if (!s.lvHook || !last || !client || donBusy || Date.now() - donAt < DON_EVERY || !canPost("donation")) { return; }
    donAt = Date.now(); donBusy = true;
    var famId = last.fam.id;
    familyQueries().then(function (q) {
      return q.account ? client.fetchQuery(Object.assign({}, q.account(famId), { staleTime: 60000 })) : null;
    }).then(function (acc) {
      var led = acc && acc.ledger;
      if (!led || !last) { return; }
      var s2 = load(), seen = s2.donSeen, top = seen || 0, hits = [];
      led.forEach(function (e) {
        var id = +e.id;
        if (!(id > 0)) { return; } // negative ids are the game's own not-yet-confirmed entries
        top = Math.max(top, id);
        if (seen != null && id > seen && /donat/i.test(e.kind || "") && +e.amount >= DON_MIN && Date.now() - +new Date(e.createdAt) < DAY) { hits.push(e); }
      });
      if (top !== seen) { s2.donSeen = top; save(s2); } // saved before posting so a second game tab doesn't post it too
      if (!hits.length) { return; }
      hits.sort(function (a, b) { return a.id - b.id; });
      var byId = {}, users = [];
      members(last.fam).forEach(function (m) { byId[m.id] = m; });
      var text = hits.map(function (e) {
        var m = byId[String(e.userId)] || { id: String(e.userId), name: e.userName || "Someone" }, gold = +e.amount;
        return say(DON_SHOUTS.filter(function (x) { return gold >= x[0]; })[0][1], { who: who(s2, m, users), gold: gold.toLocaleString("en-US") });
      }).join("\n\n");
      postFor("donation", s2.lvHook, dress("Money", text, users), function () { var n = load(); n.donSeen = seen; save(n); });
    }).catch(function () {}).then(function () { donBusy = false; });
  }

  // ===== War debrief =====
  // After a war's result is posted, its replay is loaded: fighters duel one at a time, and the winner stays in
  // with the health they have left. Per fighter: duels won (round_result), damage (attack/consumable), biggest hit, crits.
  // War channel: MVP (pinged if linked) and every fighter of ours. Leadership chat: who didn't fight, and attendance so far.
  // s.wars[id].debrief marks it done; who fought is kept per war in s.warFought (see War attendance below).
  function fighterId(f) { return String(f.id != null ? f.id : f.character && f.character.id); }
  function fighterName(f) { return f.name || f.login || f.character && (f.character.name || f.character.login) || "#" + fighterId(f); }
  function fighterLevel(f) { return +(f.level || f.character && f.character.level) || 0; }
  // Per-fighter numbers from a replay, each side sorted best first (duels won, then damage).
  function fighterStats(fam, w, rp) {
    var attack = w.attackerId === fam.id, st = {};
    var ours = (attack ? rp.attackers : rp.defenders) || [], theirs = (attack ? rp.defenders : rp.attackers) || [];
    ours.concat(theirs).forEach(function (f, i) {
      st[fighterId(f)] = { f: f, ours: i < ours.length, name: fighterName(f), level: fighterLevel(f), wins: 0, dmg: 0, best: 0, crits: 0, died: false };
    });
    (rp.events || []).forEach(function (e) {
      if (e.type === "attack" || e.type === "consumable") {
        var a = st[String(e.from)], dmg = (+e.damage || 0) + (+e.secondDamage || 0);
        if (a) { a.dmg += dmg; a.best = Math.max(a.best, dmg); if (e.isCrit) { a.crits++; } }
      } else if (e.type === "round_result") { if (st[String(e.winner)]) { st[String(e.winner)].wins++; } }
      else if (e.type === "character_died") { if (st[String(e.id)]) { st[String(e.id)].died = true; } }
    });
    var rank = function (a, b) { return b.wins - a.wins || b.dmg - a.dmg; }, all = Object.keys(st).map(function (k) { return st[k]; });
    return { us: all.filter(function (x) { return x.ours; }).sort(rank), them: all.filter(function (x) { return !x.ours; }).sort(rank) };
  }
  function fighterMember(fam, x) { return members(fam).filter(function (m) { return m.id === fighterId(x.f) || m.name === x.name; })[0]; }
  // Adds one to the MVP's count for the leaderboard, once per war (s.records.mvpWars = {war id: true}).
  function countMvp(s, fam, w, mvp) {
    var r = ensureRecords(s);
    r.mvpWars = r.mvpWars || {};
    if (!mvp || !(mvp.wins || mvp.dmg) || r.mvpWars[w.id]) { return; }
    r.mvpWars[w.id] = true;
    var mm = fighterMember(fam, mvp), mk = mm ? mm.id : fighterId(mvp.f);
    r.mvps[mk] = { name: mm ? mm.name : mvp.name, n: (r.mvps[mk] ? r.mvps[mk].n : 0) + 1 };
  }
  // Adds the war to won/lost, once per war (s.records.warIds = {war id: true}).
  function countWar(s, fam, w) {
    var r = ensureRecords(s);
    r.warIds = r.warIds || {};
    if (w.status !== "finished" || r.warIds[w.id]) { return; }
    r.warIds[w.id] = true;
    r.wars[w.winnerId === fam.id ? "won" : "lost"]++;
  }
  // ===== War attendance =====
  // The game lets a member fight only if they had been in the family for 12 hours when the war was declared (it says
  // "You needed 12 hours of membership when this war was declared"); a war is declared 10 hours before its battle.
  // So attendance counts, per member, only the wars they could have joined. s.warFought = {war id: {at: declared, ids: [member ids who fought]}};
  // the join time comes from the game's member data (joinedAt), or else from when the script first saw them join (s.joinSeen).
  var WAR_WAIT_HOURS = 12, WAR_PREP_HOURS = 10;
  function declaredAt(w) { return +new Date(w.declaredAt || w.createdAt || 0) || startOf(w) - WAR_PREP_HOURS * HOUR; }
  function joinTime(s, m) { return m.joinedAt || s.joinSeen && s.joinSeen[m.id] || 0; }
  function couldFight(s, m, at) { var j = joinTime(s, m); return !j || j + WAR_WAIT_HOURS * HOUR <= at; } // unknown join time: counted
  function recordFought(s, fam, w, us) {
    var ids = [];
    us.forEach(function (x) { var m = fighterMember(fam, x); if (m && ids.indexOf(m.id) < 0) { ids.push(m.id); } });
    if (!ids.length) { return false; } // fighters couldn't be matched to members
    s.warFought = s.warFought || {};
    s.warFought[w.id] = { at: declaredAt(w), ids: ids };
    return true;
  }
  // {member id: {fought, wars}} over the recorded wars each member could have joined. Before any war is recorded per war,
  // the old running count (s.attend, kept by versions before 2.1.0) is used.
  function attendance(s, list) {
    var wf = s.warFought, o = {};
    if (!wf || !Object.keys(wf).length) { return s.attend || {}; }
    list.forEach(function (m) {
      var a = o[m.id] = { fought: 0, wars: 0 };
      Object.keys(wf).forEach(function (id) {
        if (!couldFight(s, m, wf[id].at)) { return; }
        a.wars++; if (wf[id].ids.indexOf(m.id) >= 0) { a.fought++; }
      });
    });
    return o;
  }
  // One-time: the wars in the game's list, recorded per war from their replays, so past attendance follows the 12-hour rule too.
  var attendFilling = false, attendNext = 0;
  function backfillAttendance() {
    var s0 = load();
    if (attendFilling || !last || !last.fam.private || !s0.webhook || s0.attendFilled || Date.now() < attendNext) { return; }
    attendFilling = true; attendNext = Date.now() + 5 * 60000; // a failed try waits 5 minutes (redraw() runs this again at once)
    var fam = last.fam;
    familyQueries().then(function (q) {
      if (!q.war) { return false; }
      var todo = warsOf(fam).filter(function (w) { return w.status === "finished" && !(s0.warFought && s0.warFought[w.id]); }), ok = true;
      return todo.reduce(function (chain, w, i) {
        return chain.then(function () { return i ? wait(SCAN_GAP) : null; }).then(function () { return warDetail(w.id); }).then(function (det) {
          if (!det || !det.replay || !det.replay.events || !det.replay.events.length) { return; }
          var s2 = load(); if (recordFought(s2, fam, w, fighterStats(fam, w, det.replay).us)) { save(s2); }
        }).catch(function () { ok = false; });
      }, Promise.resolve()).then(function () { return ok; });
    }).then(function (ok) {
      if (ok) { var s3 = load(); s3.attendFilled = true; save(s3); }
    }).catch(function () {}).then(function () { attendFilling = false; redraw(); });
  }

  // ===== Attack when free =====
  // In the war planner, "Attack when free" on a family under attack arms an automatic war declaration, and "Attack now" on a
  // ready one does the same at once. s.autoAttack = {id, name, freeAt, armedAt, why}. From shortly before their battle, the
  // target's family page is loaded fresh every 15 seconds; as soon as the game says we may declare on them (its
  // warDeclaration has no "blocked" reason), the same "declare" command as the Family tab's Attack button is sent.
  // It gives up 30 minutes after the expected time, or if we have another attack planned by then. Only while the game is
  // open on this PC, and only Godfathers and Counselors can declare.
  // While we have an attack planned, one next attack can be queued (s.autoAttack.afterWar = that war's id): it goes out at the later of
  // our battle and the target's own battle. Any family in the scan can be queued, the one we're attacking now too, since its battle is ours.
  // If someone else attacks the target meanwhile, the expected time moves to their battle instead of running out.
  var ATTACK_POLL = 15000, ATTACK_LEAD = 30000, ATTACK_GIVEUP = 30 * 60000, attackBusy = false, attackAt = 0, attackNote = "";
  function canDeclare(p) { return !!p && (!p.rank || p.rank === "godfather" || p.rank === "counselor"); }
  function ourAttack() { return last ? warsOf(last.fam).filter(function (w) { return w.status === "preparing" && w.attackerId === last.fam.id; })[0] : null; }
  function familyFresh(id) {
    return familyOptions().then(function (fo) {
      if (!fo || !client) { throw new Error("open the Family tab once, then try again"); }
      return client.fetchQuery(Object.assign({}, fo({ view: "home", familyId: id, search: "", page: 0 }), { staleTime: 0 }));
    }).then(function (d) { return d && (d.family || d); });
  }
  function armAttack(id, now) {
    var s = load(), t = targets(s).filter(function (x) { return String(x.id) === String(id); })[0];
    if (!t) { return; }
    var ours = ourAttack(), ourEnd = ours ? startOf(ours) : 0;
    if (ours && now) { alert("We already have an attack planned on " + nameOf(ours.defender) + ". The game allows one at a time, so this one can only be queued for after that battle."); redraw(); return; }
    if (s.autoAttack) { alert("An attack on " + s.autoAttack.name + " is already armed. Cancel it first to pick another family."); redraw(); return; }
    var c = t.ratio ? chance(s, t.ratio) : null;
    var expected = now ? Date.now() : Math.max(ourEnd, t.busy || ours ? t.freeAt || 0 : 0, Date.now());
    var q = (now ? "Declare war on " + t.name + " now?" : ours ? "Declare war on " + t.name + " right after our battle against " + nameOf(ours.defender) + (expected > ourEnd ? " and their own battle" : "") + " (expected " + clock(expected) + ")?"
      : "Declare war on " + t.name + " automatically as soon as they can be attacked" + (t.freeAt ? " (expected " + clock(t.freeAt) + ")" : "") + "?")
      + (c != null ? "\n\nWin chance ~" + c + "%." : "")
      + (now ? "" : "\n\nThe game has to stay open on this PC until then.");
    if (!confirm(q)) { return; }
    s.autoAttack = { id: t.id, name: t.name, freeAt: expected, armedAt: Date.now(), chance: c };
    if (ours) { s.autoAttack.afterWar = ours.id; s.autoAttack.afterName = nameOf(ours.defender); }
    save(s); attackAt = 0; attackNote = "";
    if (!now && s.webhook) { postFor("autoattack", s.webhook, shout(ours ? "⏭️ **Next attack queued:** war on **" + md(t.name) + "** will be declared after our battle against **" + md(nameOf(ours.defender)) + "** (<t:" + Math.round(expected / 1000) + ":R>)" + (c != null ? ", ~" + c + "% win chance" : "") + "."
      : "⏰ **Auto-attack armed:** war on **" + md(t.name) + "** will be declared as soon as they're free" + (t.freeAt ? " (<t:" + Math.round(t.freeAt / 1000) + ":R>)" : "") + (c != null ? ", ~" + c + "% win chance" : "") + ".")); }
    redraw();
  }
  function disarmAttack() {
    var s = load(), a = s.autoAttack;
    if (!a) { return; }
    delete s.autoAttack; save(s); attackNote = "Auto-attack on " + a.name + " cancelled.";
    if (s.webhook) { postFor("autoattack", s.webhook, shout("🛑 Auto-attack on **" + md(a.name) + "** was cancelled.")); }
    redraw();
  }
  function finishAttack(ok, text) {
    var s = load(), a = s.autoAttack;
    if (!a) { return; }
    delete s.autoAttack; save(s);
    attackNote = (ok ? "✅ " : "⚠️ ") + text;
    if (s.webhook) {
      postFor("autoattack", s.webhook, shout(ok ? "⚔️ **Auto-attack:** war declared on **" + md(a.name) + "** at " + clock(Date.now()) + (a.chance != null ? " (~" + a.chance + "% win chance)" : "") + ". Register for the attack on the Family tab!"
        : "⚠️ **Auto-attack on " + md(a.name) + " stopped:** " + text));
    }
    redraw();
  }
  function checkAutoAttack() {
    var s = load(), a = s.autoAttack, now = Date.now();
    if (!a || attackBusy || !last || !client || now < attackAt || now < a.freeAt - ATTACK_LEAD) { return; }
    var ours = ourAttack();
    // Our own battle goes first. Past its start time the family list may still show it for a few minutes, so the game's answer decides from there.
    var waiting = ours && a.afterWar !== undefined && String(ours.id) === String(a.afterWar);
    if (waiting && now < startOf(ours)) { return; }
    if (waiting) { ours = null; }
    if (ours && ours.defenderId !== a.id) { finishAttack(false, "we already have an attack planned on " + nameOf(ours.defender) + ", and only one at a time is allowed."); return; }
    if (ours) { finishAttack(true, "war on " + a.name + " is planned."); return; } // declared already (by us or by hand)
    if (now > a.freeAt + ATTACK_GIVEUP) { finishAttack(false, "still not attackable 30 minutes after the expected time" + (a.why ? " (the game said: " + a.why + ")" : "") + "."); return; }
    attackBusy = true; attackAt = now + ATTACK_POLL;
    var why = function (text) { var n = load(); if (n.autoAttack) { n.autoAttack.why = text; save(n); } };
    familyFresh(a.id).then(function (f) {
      var wd = f && f.warDeclaration;
      if (!wd || wd.blocked) {
        why(wd ? String(wd.blocked) : "their family page didn't say");
        // Attacked by someone else meanwhile: wait for that battle instead of giving up.
        var until = (f && Array.isArray(f.scheduledWars) ? f.scheduledWars : []).filter(function (w) { return w.defenderId === a.id; }).reduce(function (m, w) { return Math.max(m, startOf(w) || 0); }, 0);
        var n = load();
        if (n.autoAttack && until > Date.now() && until > n.autoAttack.freeAt) {
          n.autoAttack.freeAt = until; save(n);
          if (n.webhook) { postFor("autoattack", n.webhook, shout("⏳ **Auto-attack on " + md(a.name) + ":** they've been attacked by someone else. Waiting for that battle, now expected <t:" + Math.round(until / 1000) + ":R>.")); }
        }
        return;
      }
      return familyCommand().then(function (fn) {
        return fn({ data: { requestId: crypto.randomUUID(), command: { action: "declare", familyId: last.fam.id, opponentId: a.id } } });
      }).then(function () {
        finishAttack(true, "war declared on " + a.name + " at " + clock(Date.now()) + ".");
        refreshFamily();
      }, function (e) { why(String(e && e.message || e)); }); // tried again in 15 seconds
    }).catch(function (e) { why(String(e && e.message || e)); }).then(function () { attackBusy = false; redraw(); });
  }
  function attackStatus(s) {
    var a = s.autoAttack;
    if (a) {
      return "<div class='st wait'>" + (a.afterWar !== undefined ? "⏭ Next attack queued on <b>" : "⏰ Auto-attack armed on <b>") + esc(a.name) + "</b>: "
        + (Date.now() < a.freeAt - ATTACK_LEAD ? (a.afterWar !== undefined ? "declaring after our battle against " + esc(a.afterName || "them") + ", " : "declaring as soon as they're free, ") + inTime(a.freeAt) : "trying now" + (a.why ? " (the game says: " + esc(a.why) + ")" : "") + "…")
        + " <button type='button' data-disarm>Cancel</button> <span class='idle'>Cancel it to pick another family.</span></div>";
    }
    return attackNote ? "<div class='st " + (/^✅/.test(attackNote) ? "ok" : "") + "'>" + esc(attackNote) + "</div>" : "";
  }

  // ===== Update notes =====
  // The first time a new version runs on a PC with the leadership webhook, it posts the CHANGES since the version that
  // ran before (s.lastVersion). Versions are major.minor.patch.
  function verCmp(a, b) {
    var x = String(a).split("."), y = String(b).split(".");
    for (var i = 0; i < Math.max(x.length, y.length); i++) { var d = (+x[i] || 0) - (+y[i] || 0); if (d) { return d; } }
    return 0;
  }
  function announceVersion() {
    var s = load();
    if (!s.webhook || !last || s.lastVersion === VERSION || !canPost("version")) { return; }
    var was = s.lastVersion, since = was || "0";
    var vers = Object.keys(CHANGES).filter(function (v) { return verCmp(v, since) > 0 && verCmp(v, VERSION) <= 0; }).sort(verCmp).reverse();
    s.lastVersion = VERSION; save(s); // saved before posting so a second game tab doesn't post it too
    if (!vers.length) { return; }
    postFor("version", s.webhook, {
      username: "Syndicate Activity", allowed_mentions: { parse: [] },
      embeds: [{
        title: "🆕 Syndicate tools updated to v" + VERSION,
        description: vers.map(function (v) { return (vers.length > 1 ? "**v" + v + "**\n" : "") + CHANGES[v].map(function (c) { return "• " + c; }).join("\n"); }).join("\n\n").slice(0, 4000),
        color: 0x5865f2,
        footer: { text: "Installed automatically by Tampermonkey" + (was ? " · was v" + was : "") }
      }]
    }, function () { var n = load(); if (was) { n.lastVersion = was; } else { delete n.lastVersion; } save(n); });
  }

  // One-time catch-up for the wars in the game's list from before the records counted them: won/lost for every finished
  // war, and each war's MVP from its replay, loaded one at a time. Counts made by v1.19 (without war ids) are redone here.
  var backfilling = false, backfillNext = 0;
  function backfillWars() {
    var s0 = load();
    if (backfilling || !last || !last.fam.private || !(s0.boardHook || s0.warHook) || s0.records && s0.records.backfilled || Date.now() < backfillNext) { return; }
    backfilling = true; backfillNext = Date.now() + 5 * 60000; // a failed try waits 5 minutes (redraw() runs this again at once)
    var fam = last.fam;
    familyQueries().then(function (q) {
      if (!q.war) { return false; } // the game's war loader isn't available yet: try again later
      var s = load(), r = ensureRecords(s);
      if (!r.warIds) { r.wars = { won: 0, lost: 0 }; r.warIds = {}; }
      if (!r.mvpWars) { r.mvps = {}; r.mvpWars = {}; }
      var done = warsOf(fam).filter(function (w) { return w.status === "finished"; });
      done.forEach(function (w) { countWar(s, fam, w); });
      save(s);
      return done.filter(function (w) { return !r.mvpWars[w.id]; }).reduce(function (chain, w, i) {
        return chain.then(function () { return i ? wait(SCAN_GAP) : null; }).then(function () { return warDetail(w.id); }).then(function (det) {
          if (!det || !det.replay || !det.replay.events || !det.replay.events.length) { return; }
          var s2 = load(); countMvp(s2, fam, w, fighterStats(fam, w, det.replay).us[0]); save(s2);
        }).catch(function () {});
      }, Promise.resolve()).then(function () { return true; });
    }).then(function (ok) {
      if (ok) { var s3 = load(); ensureRecords(s3).backfilled = true; save(s3); boardNext = 0; }
    }).catch(function () {}).then(function () { backfilling = false; redraw(); });
  }
  function buildDebrief(s, fam, w, det) {
    var rp = det.replay, attack = w.attackerId === fam.id, users = [], fs = fighterStats(fam, w, rp), us = fs.us, them = fs.them;
    var member = function (x) { return fighterMember(fam, x); };
    var label = function (x) { var m = member(x); return m ? who(s, m, users) : "**" + md(x.name) + "**"; };
    var line = function (x, i) {
      // Fighters further back in the queue may never get their turn before the battle is decided.
      if (!x.dmg && !x.wins && !x.died) { return medal(i) + " **" + md(x.name) + "** — ⏳ didn't get a turn (battle was already decided)"; }
      return medal(i) + " " + (i === 0 ? label(x) : "**" + md(x.name) + "**") + " — " + x.wins + " duel" + (x.wins === 1 ? "" : "s") + " won · "
        + x.dmg.toLocaleString("en-US") + " dmg · 💥 " + x.best.toLocaleString("en-US") + (x.crits ? " · " + x.crits + " crit" + (x.crits === 1 ? "" : "s") : "") + (x.died ? "" : " · 🛡️ survived");
    };
    var avg = function (a) { return a.length ? Math.round(a.reduce(function (t, x) { return t + x.level; }, 0) / a.length) : 0; };
    var won = w.winnerId === fam.id, foe = md(nameOf(attack ? w.defender : w.attacker)), mvp = us[0], best = them[0];
    countMvp(s, fam, w, mvp); // for the leaderboard's "most MVPs" (the caller saves s)
    var text = "📜 **War debrief · " + (won ? "🏆 Victory" : "💀 Defeat") + " " + (attack ? "attacking " : "defending against ") + foe + "**\n"
      + (mvp ? "🏅 **MVP: " + label(mvp) + "** — " + mvp.wins + " duel" + (mvp.wins === 1 ? "" : "s") + " won, " + mvp.dmg.toLocaleString("en-US") + " damage!" : "");
    var desc = "**Our fighters** (" + us.length + ", avg lv " + avg(us) + ")\n" + (us.length ? us.map(line).join("\n") : "Nobody fought for us.")
      + (best ? "\n\n😈 **Their best:** " + md(best.name) + " (lv " + best.level + ") — " + best.wins + " duel" + (best.wins === 1 ? "" : "s") + " won · " + best.dmg.toLocaleString("en-US") + " dmg" : "")
      + "\n\n-# Fighters: us " + us.length + " vs them " + them.length + " · duels fight one at a time, the winner stays in";
    var warMsg = { username: "Syndicate Wars", allowed_mentions: { parse: [], users: users.slice(0, 1) },
      content: text.slice(0, 2000), embeds: [{ description: desc.slice(0, 4000), color: won ? 0x00cc00 : 0xcc0000 }] };
    // Attendance: which current members fought, out of those who were allowed to (12 hours in the family when it was declared).
    if (!recordFought(s, fam, w, us)) { return { war: warMsg, lead: null }; } // fighters couldn't be matched to members
    var ids = s.warFought[w.id].ids, at = s.warFought[w.id].at, list = members(fam), att = attendance(s, list);
    var allowed = list.filter(function (m) { return couldFight(s, m, at); }), tooNew = list.filter(function (m) { return !couldFight(s, m, at); });
    var missing = allowed.filter(function (m) { return ids.indexOf(m.id) < 0; });
    var foughtN = allowed.length - missing.length;
    var leadMsg = shout("🪖 **War attendance · " + (won ? "won" : "lost") + " vs " + foe + "**: " + foughtN + " of " + allowed.length + " fought"
      + (tooNew.length ? " (" + tooNew.length + " too new to fight)" : "") + "."
      + (missing.length ? "\nDidn't fight: " + missing.map(function (m) { var a = att[m.id] || { fought: 0, wars: 0 }; return "**" + md(m.name) + "** (" + a.fought + "/" + a.wars + " wars)"; }).join(", ") : "\nEveryone who could fight did! 💪")
      + (tooNew.length ? "\n-# Too new: " + tooNew.map(function (m) { return md(m.name); }).join(", ") + ". Members need " + WAR_WAIT_HOURS + " hours in the family when a war is declared; this war doesn't count for them." : ""));
    return { war: warMsg, lead: leadMsg };
  }
  var DEBRIEF_TRIES = 6, DEBRIEF_GAP = 5 * 60 * 1000;
  function checkDebriefs() {
    var s = load();
    if (!s.warHook || !last || !last.fam.private || !canPost("debrief")) { return; }
    var wars = warsOf(last.fam), now = Date.now();
    for (var i = 0; i < wars.length; i++) {
      var w = wars[i], d = s.wars && s.wars[w.id];
      // Only wars whose result was posted while the script ran; the replay may need a few minutes after the result.
      if (w.status !== "finished" || !d || !d.result || d.debrief || (d.dTries || 0) >= DEBRIEF_TRIES || now < (d.dNext || 0)) { continue; }
      d.dTries = (d.dTries || 0) + 1; d.dNext = now + DEBRIEF_GAP; save(s);
      busy.debrief = true;
      warDetail(w.id).then((function (w) {
        return function (det) {
          if (!det || !det.replay || !det.replay.events || !det.replay.events.length) { return; }
          var s2 = load(), out = buildDebrief(s2, last.fam, w, det);
          s2.wars[w.id].debrief = true; save(s2);
          postFor("debrief", s2.warHook, out.war);
          if (out.lead && s2.webhook) { postFor("attendance", s2.webhook, out.lead); }
        };
      })(w)).catch(function () {}).then(function () { busy.debrief = false; redraw(); });
      return;
    }
  }

  // Same look as the Mission Reader's dark panel, in the colors of the city you're in. The game keeps that in its
  // player data (query ["getMe"], field city: NEW_YORK / MIAMI / HONG_KONG); the Mission Reader's last city is the fallback.
  var CITY_LOOK = { NEW_YORK: "ny", MIAMI: "miami", HONG_KONG: "hk" };
  function city() {
    try {
      var q = client && client.getQueryCache().find({ queryKey: ["getMe"] }), me = q && q.state.data;
      var c = me && CITY_LOOK[me.city || me.user && me.user.city];
      if (c) { return c; }
      var r = JSON.parse(localStorage.getItem("mr-reader") || "{}").region;
      return r === "miami" || r === "hk" ? r : "ny";
    } catch (e) { return "ny"; }
  }
  var css = "#ID{--bg:#1d1015;--fg:#f4e7ea;--muted:#b2939b;--line:#2d1820;--strong:#43252f;--soft:#2a1720;--accent:#ff4b5c;--on-accent:#fff;--up:#f5a0b4;--input:#120a0e;"
    + "position:fixed;top:12px;right:12px;z-index:2147483646;scrollbar-width:thin;scrollbar-color:var(--strong) transparent;background:var(--bg);color:var(--fg);font:14px/1.4 system-ui,sans-serif;border:2px solid var(--accent);border-radius:10px;padding:12px 14px;box-shadow:0 10px 30px rgba(0,0,0,.45),var(--glow,0 0 0 transparent);width:min(440px,calc(100vw - 24px));max-height:calc(100vh - 24px);overflow:auto;text-align:left}"
    + "#ID.miami{--bg:linear-gradient(180deg,#0e2430,#0a1820);--fg:#e4f5f6;--muted:#86aeb6;--line:#15333f;--strong:#21495a;--soft:#12303c;--accent:#22d3c5;--on-accent:#04242a;--up:#ff9ec4;--input:#071319}"
    + "#ID.hk{--bg:linear-gradient(180deg,#121637,#0b0e24);--fg:#e8eaff;--muted:#9097c6;--line:#1d2348;--strong:#2c3466;--soft:#1a2048;--accent:#4db2ff;--on-accent:#0b0e24;--up:#e7a3ff;--input:#080a1c;--glow:0 0 18px rgba(77,178,255,.35)}"
    + "#ID *{box-sizing:border-box}#ID.min{box-sizing:border-box;width:auto;padding:8px 10px}#ID.dragging{opacity:.9}"
    + "#ID.wide{width:min(620px,calc(100vw - 24px))}#ID tr.off td{opacity:.45}"
    + "#ID .filters label{display:flex;align-items:center;gap:4px;font-size:12px;color:var(--muted)}#ID .filters input{width:64px;margin:0;padding:5px 6px}"
    + "#ID button.name{border:0;padding:0;background:none;font:inherit;text-transform:none;letter-spacing:0;color:var(--fg);cursor:copy;text-align:left}#ID button.name:hover{color:var(--accent)}#ID td a{text-decoration:none}#ID a.who{color:inherit}#ID a.who:hover{color:var(--accent);text-decoration:underline}"
    + "#ID button.inv{margin:0;padding:2px 8px;font-size:10.5px}#ID .invd{font-size:11px;color:var(--up);white-space:nowrap;cursor:help}#ID tr.done td:nth-child(2){opacity:.6}"
    + "#ID .free{display:inline-block;font-size:11px;color:var(--up);white-space:nowrap}#ID tr.off .free{opacity:1}#ID .free.now{color:#93d36d}#ID tr.off td:nth-child(2){opacity:1}#ID tr.off td:nth-child(2) > :not(.free){opacity:.45}"
    + "#ID .top{display:flex;align-items:center;gap:6px;cursor:move;user-select:none}#ID .grow{flex:1}"
    + "#ID .t{font:600 11px/1.3 system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}"
    + "#ID .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:10px 0 8px}#ID .stats.five{grid-template-columns:repeat(5,1fr);gap:5px}#ID .stats.five .stat{padding:6px 6px}#ID .stats.five .stat b{font-size:20px;white-space:nowrap}"
    + "#ID .stat b.wk i{display:inline-flex;vertical-align:1px;margin-right:2px;opacity:.85}#ID .stat b.wk i svg{width:12px;height:12px}#ID .stat[data-tip]{cursor:help}"
    + "#ID .war{display:inline-flex;cursor:help}#ID .war.no{color:var(--muted);opacity:.35}"
    + "#ID .stat{background:var(--soft);border-radius:8px;padding:6px 8px}#ID .stat b{display:block;font:normal 22px/1.1 Impact,'Arial Narrow',sans-serif;color:var(--accent);letter-spacing:.02em}#ID .stat span{font-size:10.5px;color:var(--muted)}"
    + "#ID table{width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums}"
    + "#ID th{font:600 10.5px/1.3 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);text-align:right;padding:4px 6px;border-bottom:2px solid var(--strong);white-space:nowrap}#ID th.on{color:var(--accent)}"
    + "#ID td{text-align:right;padding:4px 6px;border-bottom:1px solid var(--line)}#ID th:nth-child(2),#ID td:nth-child(2){text-align:left}#ID td:first-child{color:var(--muted)}"
    + "#ID td.full{color:#93d36d;font-weight:700}#ID td.mid{color:#e8c46a}#ID td.low{color:#ff8a8a}#ID td.zero{color:var(--muted);opacity:.7}#ID td.up{color:var(--up);font-weight:700}"
    + "#ID .idle{font-size:11px;color:var(--muted);white-space:nowrap}#ID table.adv td{text-align:left}"
    + "#ID .links{margin-top:8px;padding:8px;border-radius:8px;background:var(--soft)}#ID .links .lk{display:grid;grid-template-columns:110px 1fr auto;gap:8px;align-items:center}#ID .links .lk button{padding:4px 8px}#ID .links input{margin:2px 0}#ID .links span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"
    + "#ID .dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:6px;background:var(--strong);vertical-align:1px}#ID .dot.on{background:#6bb133}"
    + "#ID .tags{display:inline-flex;align-items:center;gap:5px}#ID table.mem td.nm{max-width:0;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#ID table.mem td.tg{white-space:nowrap;padding-left:2px;padding-right:2px}"
    + "#ID tr[data-mid]{cursor:pointer}#ID tr[data-mid]:hover td{background:var(--soft)}#ID tr.open td{background:var(--soft);border-bottom-color:transparent}#ID tr.trend td{background:var(--soft);text-align:left;padding:2px 8px 8px}"
    + "#ID .chart{position:relative;display:flex;align-items:flex-end;gap:2px;height:46px;margin-top:4px;border-bottom:1px solid var(--strong)}#ID .bc{flex:1;height:100%;display:flex;align-items:flex-end;cursor:help}#ID .b{display:block;width:100%;border-radius:4px 4px 0 0;background:var(--muted)}"
    + "#ID .b.full{background:#93d36d}#ID .b.mid{background:#e8c46a}#ID .b.low{background:#ff8a8a}#ID .b.zero{background:var(--muted);opacity:.5}#ID .bc.today .b{opacity:.65}"
    + "#ID .ref{position:absolute;left:0;right:0;border-top:1px dashed var(--muted);opacity:.6;pointer-events:none}#ID .ref span{position:absolute;right:0;bottom:1px;font-size:9px;line-height:1}#ID .ax{display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:2px}"
    + "#ID .tfacts{display:flex;flex-wrap:wrap;gap:2px 10px;margin-top:5px;font-size:11px;color:var(--muted)}#ID .tfacts b{color:var(--fg);font-weight:600}"
    + "#ID .mfilters{display:flex;gap:4px;flex-wrap:wrap;margin:4px 0 4px}#ID .mfilters button{padding:3px 7px;font-size:10.5px;letter-spacing:0;text-transform:none;font-weight:500;border-radius:12px}#ID .mfilters button.on{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}#ID .nomatch{padding:8px 2px;font-size:12px;color:var(--muted)}"
    + "#ID .boosts{margin:0 0 6px;padding:6px 8px;border-radius:8px;background:var(--soft);font-size:11.5px;color:var(--muted)}#ID .bo{display:grid;grid-template-columns:82px 1fr auto auto;align-items:center;gap:6px;min-height:21px}#ID .bo b{color:var(--fg);font-weight:600;white-space:nowrap}#ID .bo .left{white-space:nowrap;min-width:44px;text-align:right}"
    + "#ID .bar{height:6px;border-radius:3px;background:var(--strong);overflow:hidden}#ID .bar i{display:block;height:100%;border-radius:3px;background:var(--accent)}#ID .bo.warn .bar i{background:#e8c46a}#ID .bo.warn .left{color:#e8c46a}#ID .bo.out .left{color:#ff8a8a}#ID .bo button{padding:2px 6px;font-size:10px;letter-spacing:0}#ID .bo button.go{font-weight:700}"
    + "#ID .trez{margin-top:3px;padding-top:4px;border-top:1px solid var(--strong)}#ID .trez b{color:var(--fg);font-weight:600}#ID .trez.bad{color:#ff8a8a}"
    + "#ID.dock{box-sizing:border-box;top:0;right:0;height:100vh;max-height:100vh;border-width:0 0 0 2px;border-radius:0;box-shadow:-8px 0 20px rgba(0,0,0,.35)}"
    + "#ID.compact table{font-size:12px}#ID.compact td,#ID.compact th{padding:3px 4px}#ID.compact table.mem tr[data-mid] td:first-child,#ID.compact table.mem th:first-child{display:none}#ID.compact table.mem tr[data-mid] td:nth-child(6),#ID.compact table.mem th:nth-child(6){display:none}#ID.compact .stats.five .stat b{font-size:16px}#ID.compact .stats.five .stat{padding:5px 4px}#ID.compact .stat span{font-size:9.5px}#ID.compact .top .seg button{padding:4px 5px;font-size:10px}"
    + "#ID.min .top{flex-wrap:wrap}#ID .mc{display:inline-flex;align-items:center;gap:4px;font-size:12px;white-space:nowrap;color:var(--muted);cursor:help}#ID .mc b{color:var(--accent);font-weight:700}#ID .mc.warn,#ID .mc.warn b{color:#e8c46a}#ID .mc i{display:inline-flex;font-style:normal}#ID .mc svg{width:12px;height:12px}#ID .minbtn{display:inline-flex;gap:4px;margin-left:auto}"
    + "#ID .top .grow{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"
    + "#ID .dc{display:inline-flex;color:#8f9bff;cursor:help}#ID .dc.no{color:var(--muted);opacity:.35}"
    + "#ID .tag{font-size:10px;line-height:1.5;padding:0 6px;border-radius:9px;white-space:nowrap;cursor:help}#ID .tag.good{background:rgba(107,177,51,.18);color:#93d36d}#ID .tag.mid{background:rgba(232,196,106,.16);color:#e8c46a}"
    + "#ID .tag.bad{background:rgba(255,138,138,.16);color:#ff8a8a}#ID .tag.new{background:rgba(77,178,255,.18);color:#7cc4ff}"
    + "#ID .st{margin-top:8px;font-size:12px;color:var(--muted)}#ID .st.ok{color:#93d36d}#ID .st.bad{color:#ff8a8a}#ID .st.wait{color:#e8c46a}"
    + "#ID button{font:600 11px/1.3 system-ui,sans-serif;letter-spacing:.04em;text-transform:uppercase;border-radius:6px;padding:6px 10px;cursor:pointer;border:1px solid var(--strong);background:transparent;color:var(--fg)}"
    + "#ID button:hover{border-color:var(--accent)}#ID button.go{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}#ID button:disabled{opacity:.45;cursor:default}"
    + "#ID button.icon{padding:4px 7px;font-size:13px;line-height:1}#ID button.vol{font-size:12px;white-space:nowrap}"
    + "#ID .volrow{display:flex;align-items:center;gap:10px;margin-top:8px;font-size:12px;color:var(--muted)}#ID .volrow input{flex:1;margin:0;padding:0;border:0;background:none;accent-color:var(--accent);cursor:pointer}#ID .volrow .vv{min-width:34px;text-align:right;color:var(--fg)}"
    + "#ID button.tag.away{border:0;font:400 10px/1.5 system-ui,sans-serif;letter-spacing:0;text-transform:none;padding:0 6px;border-radius:9px;cursor:pointer;background:rgba(124,196,255,.14);color:#9fd2ff}#ID table.mem td.tg{position:relative}#ID button.awaybtn{position:absolute;left:-16px;top:50%;transform:translateY(-50%);border:0;background:none;padding:0 2px;font-size:11px;line-height:1;cursor:pointer;opacity:0}#ID tr:hover .awaybtn{opacity:.55}#ID .awaybtn:hover{opacity:1}"
    + "#ID .msrow{display:flex;align-items:center;gap:6px;margin:8px 0 2px}#ID input.msearch{flex:1;min-width:0;width:auto;margin:0;font-family:inherit}#ID .seg.area button{padding:5px 9px;letter-spacing:.02em;white-space:nowrap}#ID .pick{font:normal 28px/1.1 Impact,'Arial Narrow',sans-serif;color:var(--accent);margin:2px 0 4px}#ID .mqhead{display:flex;align-items:center;gap:8px;margin:10px 0 6px}#ID .lead{font-size:12px;color:var(--muted);margin:0 0 6px}#ID .lead b.x{color:var(--up)}#ID .lead b.c{color:#93d36d}#ID table.mq th:nth-child(2),#ID table.mq td:nth-child(2){text-align:right}#ID table.mq td{padding:6px;vertical-align:top}#ID table.mq th:first-child,#ID table.mq td:first-child{text-align:left;color:var(--fg)}#ID table.mq th:first-child{color:var(--muted)}#ID table.mq td.x{color:var(--up);font-weight:700}#ID table.mq td.c{color:#93d36d;font-weight:700}#ID table.mq tr.best td{background:color-mix(in srgb,var(--accent) 10%,transparent)}#ID table.mq tr.rare td{background:color-mix(in srgb,var(--c) 13%,transparent)}#ID table.mq tr.best td:first-child{box-shadow:inset 3px 0 0 var(--accent)}#ID table.mq tr.best .nm{font-weight:700}#ID table.mq tr.best td.sc{color:var(--accent);font-weight:700}#ID .ib{display:inline-block;margin-left:6px;padding:0 6px;border-radius:999px;font:700 9px/1.6 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;border:1px solid var(--c);color:var(--c);vertical-align:1px}#ID .ib.rare{background:var(--c);color:#fff;animation:synGlow 1.6s ease-in-out infinite}@keyframes synGlow{0%,100%{box-shadow:0 0 0 0 transparent}50%{box-shadow:0 0 9px 2px var(--c)}}@media (prefers-reduced-motion:reduce){#ID .ib.rare{animation:none}}#ID .mqitem{display:flex;align-items:center;gap:6px;margin-top:4px;font-size:12px;color:var(--muted)}#ID .mqitem img{width:38px;height:22px;object-fit:contain;background:var(--fg);border-radius:4px;padding:2px}#ID .golink{color:var(--accent);font-weight:600}#ID table.dq th.here{background:var(--accent);color:var(--on-accent);border-radius:6px 6px 0 0}#ID table.dq td.here{background:color-mix(in srgb,var(--accent) 16%,transparent);color:var(--fg);font-weight:600}#ID a.mrun{position:relative;display:flex;justify-content:space-between;align-items:center;gap:8px;height:22px;margin-top:8px;padding:0 8px;border-radius:6px;overflow:hidden;background:var(--soft);color:var(--fg);font-size:12px;text-decoration:none}#ID a.mrun:hover{outline:1px solid var(--accent)}#ID .mfill{position:absolute;left:0;top:0;bottom:0;background:var(--accent);opacity:.38;transition:width 1s linear}#ID a.mrun.ready .mfill{background:#6bb133}#ID .mtxt,#ID .mleft{position:relative;white-space:nowrap}#ID .mleft{font-weight:600;font-variant-numeric:tabular-nums}#ID .mqstat{margin:0 0 5px;padding:5px 8px;border-radius:8px;background:var(--soft);font-size:12px;color:var(--muted)}#ID .mqstat b{color:var(--fg);font-weight:600}#ID .mqstat.warn,#ID .mqstat.warn b{color:#e8c46a}#ID .mqstat.ok,#ID .mqstat.ok b{color:#93d36d}#ID .lvline{margin:0 0 6px;padding:5px 8px;border-radius:8px;background:var(--soft);font-size:12px;color:var(--muted);cursor:help}#ID .lvline b{color:var(--fg);font-weight:600}#ID .dqhead{display:flex;align-items:center;gap:8px;margin:8px 0 6px;font-size:12px;color:var(--muted)}#ID .dqfacts{font-size:12px;color:var(--muted);margin:0 0 6px}#ID .dqfacts b{color:var(--fg);font-weight:600}#ID table.dq td,#ID table.dq th{padding:5px 6px}#ID table.dq td.nm2{max-width:0;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#ID .cdot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;vertical-align:1px}#ID .cico{width:15px;height:15px;object-fit:contain;margin-right:5px;vertical-align:-3px}#ID table.dq td.w{font-weight:700}#ID table.dq td.w.hi{color:#93d36d}#ID table.dq td.w.md{color:#e8c46a}#ID table.dq td.w.lo{color:#ff8a8a}#ID table.dq tr.below td:not(.w){opacity:.65}#ID table.dq a.fight{color:var(--accent);font-weight:600;white-space:nowrap;text-decoration:none}#ID table.dq a.fight:hover{text-decoration:underline}#ID .mqnote{margin-top:6px;font-size:11px;color:var(--muted)}#ID .remind{display:flex;align-items:center;gap:8px;margin:6px 0 2px;font-size:11px;color:var(--muted)}"
    + "#ID .seg{display:inline-flex;border:1px solid var(--strong);border-radius:6px;overflow:hidden}#ID .seg button{border:0;border-radius:0;padding:5px 8px}#ID .seg button+button{border-left:1px solid var(--strong)}#ID .seg button.on{background:var(--accent);color:var(--on-accent)}"
    + "#ID .row{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:8px}"
    // The game's hover boxes are placed against the whole window, so they can land on the panel: they go on top. Its dialogs stay below, as before.
    + "body>[data-portal]>:not(.mantine-Modal-root):not(.mantine-Drawer-root):not(.mantine-Overlay-root){z-index:2147483647!important}"
    + "#ID .tabs{display:flex;gap:4px;margin:8px -14px 4px;padding:6px 14px;border-bottom:1px solid var(--strong);position:sticky;top:-12px;z-index:2;background:var(--bg)}"
    + "#ID .tabs button{flex:1;padding:6px 4px;border-color:transparent;text-transform:none;letter-spacing:0;font-size:12px;white-space:nowrap}#ID .tabs button:hover{border-color:var(--strong)}#ID .tabs button.on{background:var(--accent);color:var(--on-accent)}"
    + "#ID .setup{margin-top:10px;padding:10px;border:1px solid var(--strong);border-radius:8px;font-size:12.5px}#ID .setup ol{margin:4px 0 8px;padding-left:18px}"
    + "#ID input{width:100%;margin:4px 0 8px;padding:7px 8px;border-radius:6px;border:1px solid var(--strong);background:var(--input);color:var(--fg);font:12px ui-monospace,Consolas,monospace}"
    + "#ID .ver{margin-top:6px;text-align:right;font-size:10px;color:var(--muted)}";

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  function apClass(v) { return v >= FULL ? "full" : v >= FULL / 2 ? "mid" : v > 0 ? "low" : "zero"; }
  // Tags after a member's name in the Activity list: Discord link and how active they've been over the last week.
  var TAG_DAYS = 7, NEW_DAYS = 2; // members who joined less than NEW_DAYS ago are tagged "new" instead of judged
  var DC_ICON = "<svg viewBox='0 0 24 18' width='14' height='11' aria-hidden='true'><path fill='currentColor' fill-rule='evenodd' d='M4.2 2.4C6 1.4 7.9.9 9.6.7l.6 1.3a17 17 0 0 1 3.6 0l.6-1.3c1.7.2 3.6.7 5.4 1.7 2.3 3.3 3.3 7 3 11.3a19 19 0 0 1-5.9 3l-1.3-2c.8-.3 1.5-.6 2.2-1.1-3.6 1.6-8 1.6-11.6 0 .7.5 1.4.8 2.2 1.1l-1.3 2a19 19 0 0 1-5.9-3c-.3-4.3.7-8 3-11.3ZM10.2 9.6a1.8 2 0 1 0-3.6 0a1.8 2 0 1 0 3.6 0ZM17.4 9.6a1.8 2 0 1 0-3.6 0a1.8 2 0 1 0 3.6 0Z'/></svg>";
  function activityTag(s, m, mid) {
    var idle = idleDays(s, m.id, mid), streak = fullStreak(s, m.id, mid), days = 0, full = 0, half = 0;
    if (idle >= 2) { return ["bad", "💤 " + idle + "d", idle + " days in a row with 0 points"]; }
    if (streak >= 7) { return ["good", "🔥 " + streak + "d", "100+ points " + streak + " days in a row"]; }
    // Finished days from the history. Yesterday also comes straight from the game, so this works before any history is saved.
    // Days the member wasn't in the family for from the start don't count.
    for (var i = 1; i <= TAG_DAYS; i++) {
      var t = mid - i * DAY, r = s.hist && s.hist[dayKey(t)], ap = r && r[m.id] ? r[m.id].ap : i === 1 ? m.yesterday : null;
      if (ap == null || m.joinedAt > t) { continue; }
      days++; if (ap >= FULL) { full++; } else if (ap >= FULL / 2) { half++; }
    }
    var today = m.today >= FULL; // today only counts once they've reached 100, the day isn't over yet
    if (today) { days++; full++; }
    var joined = m.joinedAt && Date.now() - m.joinedAt < TAG_DAYS * DAY ? Math.floor((Date.now() - m.joinedAt) / DAY) : -1;
    if (joined >= 0 && (joined < NEW_DAYS || !days)) { return ["new", "new", "Joined " + (joined ? joined + (joined === 1 ? " day" : " days") + " ago" : "today")]; }
    if (!days) { return null; }
    // A day at 100+ counts fully, a day at 50–99 half.
    var score = (full + half / 2) / days;
    var tip = "Last " + (days === 1 ? "day" : days + " days") + (today ? " (today included)" : "") + ": " + full + " at 100+" + (half ? ", " + half + " at 50–99" : "");
    return score >= 0.7 ? ["good", "active", tip] : score >= 0.3 ? ["mid", "mixed", tip] : ["bad", "inactive", tip];
  }
  // War sign-ups, read the way the game's own member list shows its crosshair and shield: who is registered for a planned war we attack in / defend.
  var SPEC_COLOR = { bully: "#f0852d", tactician: "#f2cf3a", rogue: "#3cc8dc" };
  var ATK_ICON = "<svg viewBox='0 0 16 16' width='13' height='13' aria-hidden='true'><g fill='none' stroke='currentColor' stroke-width='1.8'><circle cx='8' cy='8' r='5.2'/><path d='M8 .8v4M8 11.2v4M.8 8h4M11.2 8h4'/></g></svg>";
  var DEF_ICON = "<svg viewBox='0 0 16 16' width='12' height='13' aria-hidden='true'><path fill='currentColor' d='M8 .6 14.4 3v4.6c0 4-2.7 6.7-6.4 7.9C4.3 14.3 1.6 11.6 1.6 7.6V3Z'/></svg>";
  // Class icons: the game's own pictures, read from its SpecIcon file. Until they're loaded (or if the file changes) a dot in the class colour stands in.
  var specIcons = null, specIconsLoading = false;
  function loadSpecIcons() {
    if (specIcons || specIconsLoading) { return; }
    var idx = performance.getEntriesByType("resource").map(function (e) { return e.name; }).filter(function (n) { return /\/assets\/index-[\w-]+\.js/.test(n); })[0];
    if (!idx) { return; }
    specIconsLoading = true;
    fetch(idx).then(function (r) { return r.text(); }).then(function (t) {
      var m = t.match(/SpecIcon-[\w-]+\.js/);
      return m ? fetch(idx.replace(/index-[\w-]+\.js.*$/, m[0])).then(function (r) { return r.text(); }) : "";
    }).then(function (t) {
      var map = t.match(/\{bully:(\w+|`[^`]*`),tactician:(\w+|`[^`]*`),rogue:(\w+|`[^`]*`)\}/), found = {};
      if (map) {
        ["bully", "tactician", "rogue"].forEach(function (k, i) {
          var v = map[i + 1];
          if (v.charAt(0) === "`") { found[k] = v.slice(1, -1); return; }
          var d = t.match(new RegExp("\\b" + v + "=`([^`]*)`"));
          if (d) { found[k] = d[1]; }
        });
      }
      specIcons = found; redraw();
    }, function () { specIcons = {}; });
  }
  function specIcon(spec) {
    var name = esc(SPECS[spec] || ""), src = specIcons && specIcons[spec];
    if (src) { return "<img class='cico' src=\"" + esc(src) + "\" alt='' title='" + name + "'>"; }
    return spec ? "<span class='cdot' style='background:" + (SPEC_COLOR[spec] || "var(--muted)") + "' title='" + name + "'></span>" : "";
  }
  function warSignups(fam) {
    var o = { attack: null, defense: null };
    warsOf(fam).forEach(function (w) {
      var k = w.status !== "preparing" ? null : w.attackerId === fam.id ? "attack" : w.defenderId === fam.id ? "defense" : null;
      if (!k) { return; }
      var side = o[k] = o[k] || { foes: [], ids: {}, wars: [] };
      side.foes.push(nameOf(k === "attack" ? w.defender : w.attacker));
      side.wars.push(w);
      (w.registeredUsers || []).forEach(function (id) { side.ids[String(id)] = true; });
    });
    return o;
  }
  function warIcons(su, m) {
    return [["attack", ATK_ICON, "attack on"], ["defense", DEF_ICON, "defence against"]].map(function (k) {
      var side = su[k[0]], on = side && side.ids[m.id], color = SPEC_COLOR[m.spec];
      var tip = !side ? "No " + (k[0] === "attack" ? "attack" : "defence") + " planned" : (on ? "Registered for the " : "Not registered for the ") + k[2] + " " + side.foes.join(", ");
      return "<span class='war" + (on ? "" : " no") + "'" + (on && color ? " style='color:" + color + "'" : "") + " title='" + esc(tip) + "'>" + k[1] + "</span>";
    }).join("");
  }
  function memberTags(s, m, mid, su) {
    var until = awayUntil(s, m.id), a = activityTag(s, m, mid), h;
    // Away members show their return date instead of the activity tag; the 🏖️ button shows on hover for everyone else.
    h = until ? "<button type='button' class='tag away' data-away='" + esc(m.id) + "' title='Away until " + shortDay(until) + " (game days). No idle alerts, evening or war sign-up pings until then. Click to change.'>🏖️ " + shortDay(until).replace(/^\w+ /, "") + "</button>"
      : "<button type='button' class='awaybtn' data-away='" + esc(m.id) + "' title='Mark as away (vacation)'>🏖️</button>" + (a ? "<span class='tag " + a[0] + "' title='" + a[2] + "'>" + a[1] + "</span>" : "");
    h += warIcons(su, m);
    // Only where members are linked at all (the PC with the Discord settings); elsewhere every icon would look unlinked.
    // The icon goes last, so the icons line up in one column.
    if (s.links && Object.keys(s.links).length) {
      h += s.links[m.id] ? "<span class='dc' title='Discord linked: shout-outs ping them'>" + DC_ICON + "</span>"
        : "<span class='dc no' title='Discord not linked (Discord settings → Link members to Discord)'>" + DC_ICON + "</span>";
    }
    return h ? "<span class='tags'>" + h + "</span>" : "";
  }
  // ===== Personal: mission picker =====
  // The same picker as the Mission Reader bookmark: reads the Godfather bar's missions from the game's data ("getAvailableQuests"),
  // scores each by XP and cash per energy for the chosen goal. The goal is shared with the bookmark (localStorage "mr-reader").
  // The list stays in memory after leaving the bar, marked as from the last visit.
  var MQ_NAMES = { old_man: "Old Man", cookie: "Cookie", agatha: "Agatha", sean: "Sean", vincenzo: "Vincenzo", velvet: "Velvet Kiss", dwayne: "Dwayne", jose: "José", isabel: "Isabel", carlos: "Carlos", little_joe: "Little Joe", madam_chow: "Mihn", mei: "Amaya", wing: "Akuma", ah_keung: "Mr. Woo", suki: "Katara" };
  var MQ_MODES = { xp: { w: 1, label: "XP", title: "Best for XP" }, balanced: { w: 0.5, label: "Balanced", title: "Best balanced" }, cash: { w: 0, label: "Cash", title: "Best for cash" } };
  var MQ_TIERS = { cash: ["Item", "", false], gold1: ["Gold", "#c9961a", false], gold2: ["Gold II", "#c9961a", false], gold3: ["Gold III", "#c9961a", false], epic1: ["Epic", "#e0524f", true], epic2: ["Epic II", "#e0524f", true], legendary: ["Legendary", "#9b5fd0", true], unique: ["Unique", "#2fa3d6", true] };
  var missions = [], mqItems = null, mqItemsLoading = false;
  function mqNice(g) { return MQ_NAMES[g] || String(g || "Mission").split("_").map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(" "); }
  function mqIsQuest(q) { return !!q && typeof q === "object" && typeof q.energy === "number" && (typeof q.xp === "number" || typeof q.cash === "number"); }
  function mqPick(d, depth) {
    if (Array.isArray(d)) { return d.filter(mqIsQuest); }
    if (d && typeof d === "object" && depth < 3) { for (var k in d) { var r = mqPick(d[k], depth + 1); if (r.length) { return r; } } }
    return [];
  }
  function readMissions() {
    var q = client && client.getQueryCache().find({ queryKey: ["getAvailableQuests"] }), got = q ? mqPick(q.state.data, 0) : [];
    if (!got.length) { return; }
    missions = got.map(function (m) {
      return { id: m.id, name: mqNice(m.giver), energy: m.energy, xp: m.xp || 0, cash: m.cash || 0, item: m.item && m.item.id ? { id: String(m.item.id), tier: m.item.tier || "" } : null };
    }).filter(function (m) { return m.energy > 0; });
    if (missions.some(function (m) { return m.item; })) { loadMqItems(); }
  }
  // Item names and pictures come from the game's own item table, in its ItemImg script file.
  function loadMqItems() {
    if (mqItems || mqItemsLoading) { return; }
    var url = performance.getEntriesByType("resource").map(function (e) { return e.name; }).filter(function (n) { return /\/assets\/ItemImg-[\w-]+\.js/.test(n); })[0];
    if (!url) { return; }
    mqItemsLoading = true;
    fetch(url).then(function (r) { return r.text(); }).then(function (t) {
      var map = {}, m, re = /\{id:`([^`]+)`([^{}]*?)\}/g;
      while ((m = re.exec(t))) {
        var name = (m[2].match(/name:`([^`]+)`/) || [])[1], img = (m[2].match(/img:`([^`]+)`/) || [])[1];
        if (name || img) { map[m[1]] = { name: name, img: img }; }
      }
      mqItems = map; redraw();
    }, function () { mqItems = {}; });
  }
  function mqItemInfo(it) {
    var def = mqItems && mqItems[it.id] || {}, tier = MQ_TIERS[it.tier] || [it.tier ? mqNice(it.tier) : "Item", "", false];
    return { name: def.name || mqNice(it.id), img: def.img || "", label: tier[0], color: tier[1] || "var(--muted)", rare: tier[2] };
  }
  function mqMode() { try { var m = JSON.parse(localStorage.getItem("mr-reader") || "{}").mode; return MQ_MODES[m] ? m : "balanced"; } catch (e) { return "balanced"; } }
  function setMqMode(mode) { try { var o = JSON.parse(localStorage.getItem("mr-reader") || "{}"); o.mode = mode; localStorage.setItem("mr-reader", JSON.stringify(o)); } catch (e) {} }
  function mqRank(mode) {
    var w = MQ_MODES[mode].w, maxX = 0, maxC = 0, r = { bx: null, bc: null, bs: null };
    missions.forEach(function (m) { m.xpr = m.xp / m.energy; m.cr = m.cash / m.energy; maxX = Math.max(maxX, m.xpr); maxC = Math.max(maxC, m.cr); });
    missions.forEach(function (m) {
      m.score = (w * (maxX ? m.xpr / maxX : 0) + (1 - w) * (maxC ? m.cr / maxC : 0)) * 100;
      if (!r.bx || m.xpr > r.bx.xpr) { r.bx = m; }
      if (!r.bc || m.cr > r.bc.cr) { r.bc = m; }
      if (!r.bs || m.score > r.bs.score) { r.bs = m; }
    });
    return r;
  }
  // The running mission, from the game's data ("getActiveQuest"): {questId, startedAt, data: {seconds}}. Seconds left, or null when none is running.
  function missionRunning() {
    var q = client && client.getQueryCache().find({ queryKey: ["getActiveQuest"] }), d = q && q.state.data;
    if (!d || !d.data || typeof d.data.seconds !== "number" || !d.startedAt) { return null; }
    var m = missions.filter(function (x) { return x.id != null && x.id === d.questId; })[0];
    return { left: Math.max(0, Math.ceil(d.data.seconds - (Date.now() - new Date(d.startedAt).getTime()) / 1000)), total: d.data.seconds, name: m ? m.name : d.data.giver ? mqNice(d.data.giver) : "" };
  }
  function missionKey() { var me = duelMe(); return me ? me.energy : ""; }
  function missionState() { var run = missionRunning(); return !run ? "" : (run.left ? "running" : "ready") + run.name; }
  function missionBarHtml() {
    var run = missionRunning();
    if (!run) { return ""; }
    return "<a class='mrun" + (run.left ? "" : " ready") + "' href='" + BAR + "' title='Open the Godfather bar'><i class='mfill' style='width:" + missionPct(run) + "%'></i><span class='mtxt'>" + (run.left ? "⏱ " : "✅ ") + esc(run.name || "Mission") + "</span><b class='mleft'>" + missionLeftText(run) + "</b></a>";
  }
  function missionPct(run) { return run.left && run.total > 0 ? Math.max(0, Math.min(100, run.left / run.total * 100)).toFixed(1) : 100; }
  function missionLeftText(run) { return run.left ? clockText(run.left) + " · " + clock(Date.now() + run.left * 1000) : "ready"; }
  function updateMissionBar() {
    if (!box) { return; }
    var run = missionRunning(), fill = box.querySelector(".mfill"), left = box.querySelector(".mleft"), chip = box.querySelector(".mrunchip");
    if (!run) { return; }
    if (fill) { fill.style.width = missionPct(run) + "%"; }
    if (left) { left.textContent = missionLeftText(run); }
    if (chip) { chip.textContent = run.left ? clockText(run.left) : "ready"; }
  }
  setInterval(updateMissionBar, 1000);
  function clockText(sec) { return sec >= 3600 ? leftText(sec * 1000) : Math.floor(sec / 60) + ":" + ("0" + sec % 60).slice(-2); }
  // Energy goes up by 1 every 13 minutes by the clock: at :00, :13, :26, :39 and :52 of each hour (UTC minutes, the same in most time zones).
  var ENERGY_STEP = 13, ENERGY_MAX = 100;
  function energyTickAfter(t) {
    var d = new Date(t), next = Math.ceil((d.getUTCMinutes() + 1) / ENERGY_STEP) * ENERGY_STEP;
    if (next >= 60) { d.setUTCHours(d.getUTCHours() + 1, 0, 0, 0); } else { d.setUTCMinutes(next, 0, 0); }
    return d.getTime();
  }
  // When there's enough energy for `cost`: the time of the tick that gets there.
  function energyReadyAt(have, cost) {
    var t = Date.now(), n = Math.ceil(cost - have - 1e-9);
    for (var i = 0; i < n; i++) { t = energyTickAfter(t); }
    return t;
  }
  function missionStatusHtml(best) {
    var me = duelMe(), h = "";
    if (me && typeof me.energy === "number" && best) {
      var have = me.energy, short = best.energy - have;
      h += "<div class='mqstat" + (short > 0 ? " warn" : "") + "'>⚡ Energy <b>" + have.toFixed(1) + "</b> · " + esc(best.name) + " needs <b>" + best.energy + "</b>"
        + (short > 0 ? ": short by <b>" + short.toFixed(1) + "</b>, enough in <b>" + leftText(energyReadyAt(have, best.energy) - Date.now()) + "</b> (" + clock(energyReadyAt(have, best.energy)) + ")" + (me.familyDrinks > 0 ? ". A free family drink gives +20" : "")
          : ", enough for <b>" + Math.floor(have / best.energy + 1e-9) + "</b> run" + (Math.floor(have / best.energy + 1e-9) === 1 ? "" : "s")) + "</div>";
    }
    return h;
  }
  function mqBadge(it) { return "<span class='ib" + (it.rare ? " rare" : "") + "' style='--c:" + it.color + "'>" + esc(it.label) + "</span>"; }
  function missionHtml() {
    var onBar = lastPath === BAR, mode = mqMode(), fmt = function (v) { return v.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }); };
    var link = "<a class='golink' href='" + BAR + "'>Open the Godfather bar</a>";
    if (!missions.length) { return "<div class='mqnote' style='font-size:13px;margin-top:12px'>" + (onBar ? "Waiting for the missions to load…" : link + " to see the best mission.") + "</div>"; }
    var r = mqRank(mode), h = "<div class='mqhead'><span class='t grow'>" + MQ_MODES[mode].title + "</span><span class='seg'>" + Object.keys(MQ_MODES).map(function (k) {
      return "<button type='button' data-mqmode='" + k + "'" + (k === mode ? " class='on'" : "") + ">" + MQ_MODES[k].label + "</button>";
    }).join("") + "</span></div><div class='pick'>" + esc(r.bs.name) + "</div>" + missionStatusHtml(r.bs)
      + "<div class='lead'>Most XP per energy: <b class='x'>" + esc(r.bx.name) + "</b> · Most cash per energy: <b class='c'>" + esc(r.bc.name) + "</b></div>"
      + "<table class='mq'><thead><tr><th>Mission</th><th>Energy</th><th>XP/E</th><th>Cash/E</th><th>Score</th></tr></thead><tbody>";
    var meNow = duelMe(), energyNow = meNow && typeof meNow.energy === "number" ? meNow.energy : null;
    missions.forEach(function (m) {
      var it = m.item ? mqItemInfo(m.item) : null;
      h += "<tr class='" + (m === r.bs ? "best" : "") + (it && it.rare ? " rare" : "") + "'" + (it ? " style='--c:" + it.color + "'" : "") + "><td><span class='nm'>" + esc(m.name) + "</span>"
        + (it ? mqBadge(it) + "<div class='mqitem'>" + (it.img ? "<img src='" + esc(it.img) + "' alt=''>" : "") + "<span>" + esc(it.name) + "</span></div>" : "")
        + "</td><td" + (energyNow != null && m.energy > energyNow ? " style='color:#e8c46a' title='Enough energy in " + leftText(energyReadyAt(energyNow, m.energy) - Date.now()) + "'" : "") + ">" + m.energy + "</td><td class='" + (m === r.bx ? "x" : "") + "'>" + fmt(m.xpr) + "</td><td class='" + (m === r.bc ? "c" : "") + "'>" + fmt(m.cr) + "</td><td class='sc'>" + Math.round(m.score) + "</td></tr>";
    });
    return h + "</tbody></table>" + (onBar ? "" : "<div class='mqnote'>From your last visit. " + link + " for the current missions.</div>");
  }

  // ===== Personal: duel scan =====
  // Walks the player ranking around your place, loads each opponent the way the game's own compare screen does, and plays many
  // simulated fights with the game's own fight code to get a win chance. Only reads: a fight is only ever started by you, in the game.
  // The real fight's dice are the server's, so this is a chance, not a prediction. Last scan: s.duelScan = {at, myRank, rows}.
  var DUEL_SIMS = 200, DUEL_RANGES = [25, 50, 100], DUEL_FAIL_MAX = 5, duelRange = 50, duelFilter = 70, duelState = null, duelKit = null;
  function duelTools() {
    if (duelKit) { return Promise.resolve(duelKit); }
    var idx = performance.getEntriesByType("resource").map(function (e) { return e.name; }).filter(function (n) { return /\/assets\/index-[\w-]+\.js/.test(n); })[0];
    if (!idx) { return Promise.reject(new Error("the game's files weren't found, reload the game and try again")); }
    var dir = idx.replace(/index-[\w-]+\.js.*$/, "");
    return fetch(idx).then(function (r) { return r.text(); }).then(function (t) {
      var file = function (name) { var m = t.match(new RegExp("(?:^|[^\\w-])(" + name + "-[\\w-]+\\.js)")); if (!m) { throw new Error("the game's " + name + " file wasn't found (the game may have changed)"); } return dir + m[1]; };
      return Promise.all([import(file("computeFight")), import(file("Random")), import(file("duels"))]);
    }).then(function (got) {
      var kit = { fight: null, Rnd: null, opponent: null, duel: null, damage: null, fighter: null, stats: null };
      Object.keys(got[0]).forEach(function (k) {
        var f = got[0][k], src = typeof f === "function" ? String(f) : "";
        if (/aggressors/.test(src) && /targets/.test(src) && /fight_result/.test(src)) { kit.fight = f; }
        if (/minDamage/.test(src) && /isDodged/.test(src)) { kit.damage = f; }
        if (/thrownItemIds/.test(src)) { kit.fighter = f; }
        if (/roundsLeft/.test(src)) { kit.stats = f; }
      });
      Object.keys(got[1]).forEach(function (k) { var f = got[1][k]; if (typeof f === "function" && f.prototype && f.prototype.prob) { kit.Rnd = f; } });
      // Building a query's options sends nothing, so the opponent query can be told apart by its key.
      Object.keys(got[2]).forEach(function (k) {
        var f = got[2][k];
        if (typeof f !== "function") { return; }
        try { var o = f({ data: { id: 1 } }); if (o && o.queryKey && /opponent/i.test(JSON.stringify(o.queryKey))) { kit.opponent = f; } else if (o && o.queryKey && o.queryKey[0] === "getDuelFn") { kit.duel = f; } } catch (e) {}
      });
      if (!kit.fight || !kit.Rnd || !kit.opponent) { throw new Error("the game's duel code wasn't recognised (the game may have changed)"); }
      duelKit = kit;
      return kit;
    });
  }
  function duelMe() {
    var q = client && client.getQueryCache().find({ queryKey: ["getMe"] }), d = q && q.state.data;
    return d && (Array.isArray(d.combat) ? d : d.user && Array.isArray(d.user.combat) ? d.user : null);
  }
  function duelWinChance(kit, me, foe) { return Math.round(duelWinRate(kit, me, foe, Math.floor(Math.random() * 2147483647), DUEL_SIMS) * 100); }
  function duelWinRate(kit, me, foe, seed, sims) {
    var wins = 0, at = new Date();
    for (var i = 0; i < sims; i++) {
      try {
        var ev = kit.fight({ aggressors: [me], targets: [foe], rnd: new kit.Rnd(seed + i), useConsumables: true, at: at, maxTurnsPerRound: 1000 }), end = ev[ev.length - 1];
        if (end && end.winners && end.winners.indexOf(me.id) >= 0) { wins++; }
      } catch (e) {} // a fight past the game's turn limit doesn't count as a win
    }
    return wins / sims;
  }
  // What you deal to each class: the game's own damage code with the dice fixed, so weapon, gear, ammo, crew and food all count.
  // The target is a stand-in at your level with no toughness or armor. Thrown items only count in a fight, so they aren't in here.
  var DMG_CLASSES = [["tactician", 10], ["rogue", 25], ["bully", 50]], dmgLoading = false, dmgError = ""; // the class's damage reduction, in %
  function damageRows(kit, me) {
    var at = new Date(), mine = kit.fighter(me, at), st = kit.stats(mine), rows = DMG_CLASSES.map(function (c) {
      var foe = kit.fighter({ id: 0, login: "", spec: c[0], xp: me.xp, attack: 0, endurance: 1, luck: 0, toughness: 0, combat: [], equipment: {}, food: [], gang: [] }, at), odds;
      // The dice come in this order: does it hit, do they dodge, is it a crit.
      var hit = function (crit, high) {
        odds = [];
        var r = kit.damage({ attacker: mine, defender: foe, using: mine.weapon, rnd: { prob: function (p) { odds.push(p); return odds.length === 1 || odds.length === 3 && crit; }, int: function (a, b) { return high ? b : a; } } });
        if (r.isMiss || r.isDodged || r.isCrit !== crit) { throw new Error("the game's damage code wasn't recognised (the game may have changed)"); }
        return r.damage;
      };
      var lo = hit(false, false), hi = hit(false, true), critLo = hit(true, false), critHi = hit(true, true);
      // A landed shot can fire a second one for 10–20% of its damage.
      var avg = odds[0] * (1 - odds[1]) * ((1 - odds[2]) * (lo + hi) / 2 + odds[2] * (critLo + critHi) / 2) * (1 + (st.doubleShotChanceBuffPerc || 0) * 0.15);
      var vs = st[{ tactician: "damageVsTacticianPerc", rogue: "damageVsRoguePerc", bully: "damageVsBullyPerc" }[c[0]]] || 0;
      return { spec: c[0], cut: c[1], vs: vs, lo: lo, hi: hi, critLo: critLo, critHi: critHi, hit: odds[0], dodge: odds[1], crit: odds[2], avg: Math.round(avg) };
    });
    return { rows: rows, attack: Math.ceil(st.attack * (1 + (st.attackBuffPerc || 0))), min: mine.weapon.minDamage, max: mine.weapon.maxDamage, bonus: st.damageBuffPerc || 0, extra: st.doubleShotChanceBuffPerc || 0 };
  }
  function damageHtml() {
    var me = duelMe(), h = "<div class='dqhead' style='margin-top:12px'><span class='t grow'>Your damage</span></div>", pct = function (v) { return +(v * 100).toFixed(1) + "%"; }, n = function (v) { return v.toLocaleString("en-US"); };
    if (!me) { return h + "<div class='mqnote'>Your fighter hasn't loaded yet.</div>"; }
    if (!duelKit && !dmgError) {
      if (!dmgLoading) { dmgLoading = true; duelTools().then(redraw, function (e) { dmgError = String(e && e.message || e); redraw(); }); }
      return h + "<div class='st wait'>Loading the game's damage code…</div>";
    }
    var d;
    try {
      if (dmgError) { throw new Error(dmgError); }
      if (!duelKit.damage || !duelKit.fighter || !duelKit.stats) { throw new Error("the game's damage code wasn't recognised (the game may have changed)"); }
      d = damageRows(duelKit, me);
    } catch (e) { return h + "<div class='st bad'>Couldn't work it out: " + esc(e.message || e) + ".</div>"; }
    var top = d.rows[0];
    h += "<div class='dqfacts'>Attack <b>" + n(d.attack) + "</b> · Weapon <b>" + n(d.min) + "–" + n(d.max) + "</b> · Crit chance <b>" + pct(top.crit) + "</b> · Crit <b>×" + (top.critHi / top.hi).toFixed(2) + "</b>"
      + (d.bonus ? " · Damage <b>+" + pct(d.bonus) + "</b>" : "") + (d.extra ? " · Extra shot <b>" + pct(d.extra) + "</b>" : "") + "</div>";
    h += "<table class='dq'><thead><tr><th style='text-align:left'>Against</th><th>Normal</th><th>Crit</th><th title='Per attack, counting crits, misses and dodges'>Average</th></tr></thead><tbody>";
    d.rows.forEach(function (r) {
      h += "<tr><td style='text-align:left;white-space:nowrap;color:var(--fg)' title='Takes " + r.cut + "% less damage'>" + specIcon(r.spec) + SPECS[r.spec] + "<div style='font-size:11px'><span class='idle'>−" + r.cut + "%</span>"
        + (r.vs ? " <span style='color:" + (r.vs > 0 ? "#93d36d" : "#ff8a8a") + "' title='Your weapon does " + pct(Math.abs(r.vs)) + (r.vs > 0 ? " more" : " less") + " damage against this class'>" + (r.vs > 0 ? "+" : "−") + pct(Math.abs(r.vs)) + "</span>" : "") + "</div></td>"
        + "<td style='white-space:nowrap'>" + n(r.lo) + "–" + n(r.hi) + "</td><td style='white-space:nowrap'>" + n(r.critLo) + "–" + n(r.critHi) + "</td>"
        + "<td title='You hit " + pct(r.hit) + " of the time, then they dodge " + pct(r.dodge) + "' style='color:var(--fg);font-weight:600'>" + n(r.avg) + "</td></tr>";
    });
    return h + "</tbody></table><div class='mqnote'>" + (d.rows.some(function (r) { return r.vs; }) ? "Next to each class: its damage reduction, then your weapon's bonus against it. " : "") + "With your current gear, against a player at your level with no toughness or armor. Toughness lowers your crit chance, armor lowers your damage, and players above your level take less. Items thrown during a fight aren't counted.</div>";
  }
  function runDuelScan() {
    if (duelState && duelState.running) { return; }
    if (!client) { findClient(); }
    var me = duelMe();
    if (!me) { duelState = { error: "Your fighter hasn't loaded yet. Open a game page and try again." }; redraw(); return; }
    var myRank = me.ranking && +me.ranking.position || 0;
    if (!myRank) { duelState = { error: "Your place in the ranking isn't known yet. Open the game's ranking once and try again." }; redraw(); return; }
    duelState = { running: true, step: "Loading the game's duel code…" }; redraw();
    var foeKeys = "", myHonor = +me.honor || 0, range = duelRange, first = Math.max(1, myRank - range), lastWanted = myRank + Math.ceil(range / 2), found = [], seen = {}, own = {};
    if (last) { members(last.fam).forEach(function (m) { own[m.id] = true; }); }
    duelTools().then(function (kit) {
      return playerRanking().then(function (fn) {
        var start = first, pages = 0;
        function list() {
          if (start > lastWanted || pages >= 20) { return Promise.resolve(); }
          pages++;
          return (pages > 1 ? wait(SCAN_GAP) : Promise.resolve()).then(function () { return fn({ data: { start: start } }); }).then(function (d) {
            var players = d && d.players || [];
            players.forEach(function (x) {
              var rank = +x.rank || 0;
              if (x.id === me.id) { myHonor = +x.honor || myHonor; }
              // Your own family isn't a target.
              if (rank < first || rank > lastWanted || seen[x.id] || x.id === me.id || own[String(x.id)]) { return; }
              seen[x.id] = true;
              found.push({ id: x.id, name: x.name, rank: rank, level: +x.level || 0, spec: x.spec || "", honor: +x.honor || 0, family: x.family && (x.family.name || x.family) || "" });
            });
            var lastRank = d && d.batchLast || players.reduce(function (a, x) { return Math.max(a, x.rank || 0); }, 0);
            if (!players.length || lastRank < start) { return; }
            start = lastRank + 1;
            return list();
          });
        }
        return list();
      }).then(function () {
        found.sort(function (a, b) { return a.rank - b.rank; });
        var rows = [], fails = 0;
        function next(i) {
          if (i >= found.length || fails >= DUEL_FAIL_MAX) { return Promise.resolve(); }
          duelState = { running: true, step: "Checking " + (i + 1) + " of " + found.length + ": " + found[i].name, done: i, total: found.length }; redraw();
          return (i ? wait(SCAN_GAP) : Promise.resolve()).then(function () { return client.fetchQuery(kit.opponent({ data: { id: found[i].id } })); }).then(function (foe) {
            if (!foe) { fails++; return; }
            fails = 0;
            var row = found[i]; row.win = duelWinChance(kit, me, foe); rows.push(row); duelFoes[row.id] = foe; foeKeys = Object.keys(foe).sort().join(",");
          }, function () { fails++; }).then(function () { return next(i + 1); });
        }
        return next(0).then(function () {
          if (!rows.length && found.length) { throw new Error("no opponent could be loaded"); }
          var s = load();
          s.duelKeys = s.duelKeys || {}; s.duelKeys.opponent = foeKeys;
          s.duelScan = { at: Date.now(), myRank: myRank, myHonor: myHonor, rows: rows, partial: rows.length < found.length };
          save(s);
          duelState = null;
        });
      });
    }).catch(function (e) { duelState = { error: String(e && e.message || e) }; }).then(redraw);
  }
  // Honor isn't in the game's files, the server decides it, so it's learned from real fights: your own attacks as they happen, and
  // every attack on you from the mail. Each fight record has both players and both rewards, so what an attacker won or lost counts
  // whoever the attacker was. Fight records don't carry honor at the time, so aHonor and dHonor are their honor when read, and only
  // fights read within a day count for the formula. Found in 121 real fights (2026-11-03): the winner gets W and the loser loses 0.8 W, in
  // both directions, with W = k × loser's honor × (loser's honor ÷ winner's)^p, k 0.058, p 1.07. It predicted a known win of 20-30k
  // it wasn't fitted on (26k beating 96k: 22.7k), and is usually within 1.5×, sometimes 2.4×: same-pair wins vary, for reasons not found.
  // With enough fresh fights k and p are refitted from them.
  // s.duelLog = [{id, gain, ratio, won, at}], newest 300 (entries from before 2.12 have no "won" and are wins).
  // s.duelDefended = {won, lost, honor}: attacks on you and your honor change from them, counted once per fight.
  var HONOR_MIN = 3, HONOR_KEEP = 500, MAIL_PAGES = 10, DUEL_LOG_V = 2, HONOR_K = 0.058, HONOR_P = 1.07, HONOR_LOSER = 0.8, HONOR_REFIT = 20, duelSeen = {}, duelSort = "rank", learnState = null;
  function duelSeenInLog(s, id) { return (s.duelSeenIds || []).indexOf(id) >= 0 || (s.duelLog || []).some(function (l) { return l.id === id; }); }
  // Adds one fight record to s (the caller saves). honors: where honor comes from when the record itself doesn't carry it.
  function learnFight(s, d, attackerHonor, defenderHonor, meId) {
    var c = d.characters, a = d.rewards.attacker || {}, gain = +a.honor || 0;
    s.duelSeenIds = (s.duelSeenIds || []).concat([d.id]).slice(-1000);
    if (c.defender.id === meId) {
      var dd = s.duelDefended = s.duelDefended || { won: 0, lost: 0, honor: 0 };
      if (d.won) { dd.lost++; } else { dd.won++; }
      dd.honor += +(d.rewards.defender || {}).honor || 0;
    }
    // Which fields a fight record has, to tell what honor can be worked out from.
    var keys = s.duelKeys = s.duelKeys || {}, note = function (k, o) { keys[k] = Object.keys(o || {}).sort().join(","); };
    note("duel", d); note("attackerReward", a); note("defenderReward", d.rewards.defender); note("attacker", c.attacker); note("defender", c.defender);
    if (!attackerHonor || !defenderHonor || d.won && gain <= 0) { return; }
    s.duelLog = (s.duelLog || []).concat([{ id: d.id, gain: gain, ratio: defenderHonor / attackerHonor, won: !!d.won, at: Date.now(), when: d.createdAt ? +new Date(d.createdAt) : 0,
      aid: c.attacker.id, did: c.defender.id, axp: +c.attacker.xp || 0, dxp: +c.defender.xp || 0, aspec: c.attacker.spec, dspec: c.defender.spec, dgain: +(d.rewards.defender || {}).honor || 0, aHonor: attackerHonor, dHonor: defenderHonor }]).slice(-HONOR_KEEP);
  }
  // Each player can be attacked 3 times a day, 4 with an active Spy. The game's files have no count, the server just refuses, and no list of
  // your own attacks exists, so they're counted here as each fight appears: s.duelAttacks = [{id, did, when}], kept 3 days.
  // Assumes the day turns over at the game's 00:00 UTC reset. Attacks made before this version, or from another browser, aren't known.
  var DUEL_CAP = 3, DUEL_KEEP = 3 * 864e5;
  function countOwnAttack(d) {
    var s = load(), list = s.duelAttacks || [], now = Date.now();
    if (list.some(function (a) { return a.id === d.id; })) { return; }
    s.duelAttacks = list.filter(function (a) { return now - a.when <= DUEL_KEEP; }).concat([{ id: d.id, did: d.characters.defender.id, when: d.createdAt ? +new Date(d.createdAt) : now }]);
    save(s);
  }
  function duelCap(me) {
    var spy = me && (me.gang || []).some(function (g) { return g && g.id === "spy" && new Date(g.endsAt).getTime() > Date.now(); });
    return DUEL_CAP + (spy ? 1 : 0);
  }
  function attacksToday(s, id) {
    var mid = dayStart(Date.now());
    return (s.duelAttacks || []).filter(function (a) { return String(a.did) === String(id) && a.when >= mid; }).length;
  }
  function learnDuels() {
    var me = client && duelMe();
    if (!me) { return; }
    client.getQueryCache().findAll({ queryKey: ["getDuelFn"] }).forEach(function (q) {
      var d = q.state && q.state.data, c = d && d.characters;
      if (!d || duelSeen[d.id] || !c || !c.attacker || !c.defender || !d.rewards || !d.rewards.attacker) { return; }
      duelSeen[d.id] = true;
      if (c.attacker.id === me.id) { countOwnAttack(d); }
      if (c.attacker.id !== me.id || learnState && learnState.running) { return; } // attacks on you come in through the mail scan, with their honor looked up
      var s = load(), scan = s.duelScan, row = scan && scan.rows.filter(function (r) { return r.id === c.defender.id; })[0];
      if (duelSeenInLog(s, d.id)) { return; }
      learnFight(s, d, +c.attacker.honor || +me.honor || scan && scan.myHonor || 0, +c.defender.honor || row && row.honor || 0, me.id);
      save(s);
    });
  }
  function honorModel(s) {
    var pts = [];
    (s.duelLog || []).forEach(function (l) {
      if (!l.when || !l.aHonor || !l.dHonor || l.at - l.when > DAY) { return; }
      var w = l.won ? l.gain : l.dgain, loser = l.won ? l.dHonor : l.aHonor, winner = l.won ? l.aHonor : l.dHonor;
      if (w > 0) { pts.push({ x: Math.log(loser / winner), y: Math.log(w / loser) }); }
    });
    var base = { k: HONOR_K, p: HONOR_P, n: 0 };
    if (pts.length < HONOR_REFIT) { return base; }
    var mx = pts.reduce(function (a, q) { return a + q.x; }, 0) / pts.length, my = pts.reduce(function (a, q) { return a + q.y; }, 0) / pts.length;
    var xx = pts.reduce(function (a, q) { return a + (q.x - mx) * (q.x - mx); }, 0), xy = pts.reduce(function (a, q) { return a + (q.x - mx) * (q.y - my); }, 0), xs = pts.map(function (q) { return q.x; });
    if (Math.max.apply(null, xs) - Math.min.apply(null, xs) < 0.3 || !xx) { return base; }
    var slope = Math.max(0.5, Math.min(2, xy / xx));
    return { k: Math.exp(my - slope * mx), p: slope, n: pts.length };
  }
  // What the winner gets when `winner` beats `loser`.
  function honorWin(model, winner, loser) { return model.k * loser * Math.pow(loser / winner, model.p); }
  function honorEstimate(model, row, myHonor) { return row.honor && myHonor ? Math.max(1, Math.round(honorWin(model, myHonor, row.honor))) : 0; }
  // What a lost attack costs against this player: the same rule the other way round, and the loser loses 80%.
  function honorLoss(model, row, myHonor) { return row.honor && myHonor ? Math.max(1, Math.round(honorWin(model, row.honor, myHonor) * HONOR_LOSER)) : 0; }
  function honorShort(v) { return v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1) + "k" : String(v); }
  function honorWins(s) { return (s.duelLog || []).filter(function (l) { return l.won !== false; }); }
  function honorLosses(s) { return (s.duelLog || []).filter(function (l) { return l.won === false && l.gain < 0; }); }
  function median(list) { var a = list.slice().sort(function (x, y) { return x - y; }); return a[Math.floor(a.length / 2)]; }

  // The mail's duel tab (attacks on you) isn't exported by the game, so its request is rebuilt like the player ranking's.
  var mailFn = null;
  function mailboxFn() {
    if (mailFn) { return Promise.resolve(mailFn); }
    var res = performance.getEntriesByType("resource").map(function (e) { return e.name; });
    var csf = res.filter(function (n) { return /\/assets\/createServerFn-[\w-]+\.js/.test(n); })[0], idx = res.filter(function (n) { return /\/assets\/index-[\w-]+\.js/.test(n); })[0];
    if (!csf || !idx) { return Promise.reject(new Error("the game's files weren't found, reload the game and try again")); }
    return Promise.all([import(csf), fetch(idx).then(function (r) { return r.text(); })]).then(function (got) {
      var mod = got[0], file = (got[1].match(/(?:^|[^\w-])(mail-[\w-]+\.js)/) || [])[1]; // not the end of "verify-email-…"
      if (!file) { throw new Error("the mail page wasn't found in the game's files"); }
      return fetch(idx.replace(/index-[\w-]+\.js.*$/, file)).then(function (r) { return r.text(); }).then(function (t) {
        var id = (t.match(/handler\(\w+\(`([0-9a-f]{64})`\)\),\w+=\(\w+,\w+\)=>\w+\(\{queryKey:\w+\.mailbox/) || [])[1], rpc = null, make = null;
        Object.keys(mod).forEach(function (k) {
          var f = mod[k], src = typeof f === "function" ? String(f) : "";
          if (src.indexOf("/_serverFn/") >= 0) { rpc = f; } else if (src.indexOf("inputValidator") >= 0) { make = f; }
        });
        if (!id || !rpc || !make) { throw new Error("the mail request wasn't found (the game may have changed)"); }
        mailFn = make({ method: "POST" }).handler(rpc(id));
        return mailFn;
      });
    });
  }
  // Goes through the newest pages of the duel mail and learns from each fight it hasn't seen. Only reads, like clicking "view" on each.
  function runDuelLearn() {
    if (learnState && learnState.running) { return; }
    if (!client) { findClient(); }
    var me = duelMe();
    if (!me) { learnState = { error: "Your fighter hasn't loaded yet. Open a game page and try again." }; redraw(); return; }
    var s0 = load();
    if (s0.duelLogV !== DUEL_LOG_V) { s0.duelLogV = DUEL_LOG_V; delete s0.duelLog; delete s0.duelSeenIds; delete s0.duelDefended; save(s0); }
    learnState = { running: true, step: "Reading the duel mail…" }; redraw();
    var added = 0, honorOf = {};
    function lookup(name) { // the fight record may not carry honor: then it's the player's honor now, from the ranking
      if (!name) { return Promise.resolve(0); }
      if (name in honorOf) { return Promise.resolve(honorOf[name]); }
      return playerRanking().then(function (fn) { return wait(SCAN_GAP).then(function () { return fn({ data: { search: name } }); }); }).then(function (d) {
        var hit = (d && d.players || []).filter(function (x) { return x.name === name; })[0];
        honorOf[name] = hit ? +hit.honor || 0 : 0;
        return honorOf[name];
      }, function () { honorOf[name] = 0; return 0; });
    }
    Promise.all([duelTools(), mailboxFn()]).then(function (got) {
      var kit = got[0], mail = got[1];
      if (!kit.duel) { throw new Error("the game's fight records weren't recognised (the game may have changed)"); }
      var ids = [];
      function page(n) {
        if (n >= MAIL_PAGES) { return Promise.resolve(); }
        return (n ? wait(SCAN_GAP) : Promise.resolve()).then(function () { return mail({ data: { tab: "duels", page: n } }); }).then(function (d) {
          var mails = d && d.mails || [], s = load();
          mails.forEach(function (m) { if (m.duelId != null && !duelSeenInLog(s, m.duelId)) { ids.push(m.duelId); } });
          if (mails.length) { return page(n + 1); }
        });
      }
      return page(0).then(function () {
        function next(i) {
          if (i >= ids.length) { return Promise.resolve(); }
          learnState = { running: true, step: "Reading fight " + (i + 1) + " of " + ids.length, done: i, total: ids.length }; redraw();
          return wait(SCAN_GAP).then(function () { return client.fetchQuery(kit.duel({ data: { id: ids[i] } })); }).then(function (d) {
            var c = d && d.characters;
            if (!c || !c.attacker || !c.defender || !d.rewards) { return; }
            return Promise.all([+c.attacker.honor ? +c.attacker.honor : lookup(c.attacker.name), +c.defender.honor ? +c.defender.honor : c.defender.id === me.id && +me.honor ? +me.honor : lookup(c.defender.name)]).then(function (h) {
              var s = load();
              if (duelSeenInLog(s, d.id)) { return; }
              learnFight(s, d, h[0], h[1], me.id);
              save(s);
              added++;
            });
          }, function () {}).then(function () { return next(i + 1); });
        }
        return next(0);
      });
    }).then(function () { learnState = { note: added ? "Learned from " + added + " new fight" + (added === 1 ? "" : "s") + "." : "No new fights in the mail." }; })
      .catch(function (e) { learnState = { error: String(e && e.message || e) }; }).then(redraw);
  }
  // Where to put stat points: plays your fights against players of your class from the last scan, with each stat raised by the same
  // amount in turn. The fights share their dice, so the differences come from the stat and not from luck. Base stats only: gear is in the
  // fights, but not in the "You / Others" comparison. s.duelAdvice = {at, spec, peers, points, base, rows: [{key, mine, others, gain}]}.
  var ADVICE_STATS = [["attack", "Attack power"], ["endurance", "Endurance"], ["luck", "Luck"], ["toughness", "Toughness"]], ADVICE_PEERS = 20, ADVICE_MIN = 5, ADVICE_SIMS = 300, ADVICE_SAME = 0.5;
  var duelFoes = {}, adviceState = null;
  function runDuelAdvice() {
    if (adviceState && adviceState.running) { return; }
    if (!client) { findClient(); }
    var me = duelMe(), scan = load().duelScan;
    if (!me) { adviceState = { error: "Your fighter hasn't loaded yet" }; redraw(); return; }
    var peers = (scan ? scan.rows : []).filter(function (r) { return r.spec === me.spec; }).sort(function (a, b) { return Math.abs(a.rank - scan.myRank) - Math.abs(b.rank - scan.myRank); }).slice(0, ADVICE_PEERS);
    if (peers.length < ADVICE_MIN) { adviceState = { error: "Only " + peers.length + " players of your class in the last scan. Scan a wider range first" }; redraw(); return; }
    adviceState = { running: true, step: "Loading players of your class…" }; redraw();
    duelTools().then(function (kit) {
      var foes = [];
      function load1(i) {
        if (i >= peers.length) { return Promise.resolve(); }
        var known = duelFoes[peers[i].id];
        if (known) { foes.push(known); return load1(i + 1); }
        adviceState = { running: true, step: "Loading " + (i + 1) + " of " + peers.length + ": " + peers[i].name, done: i, total: peers.length }; redraw();
        return wait(SCAN_GAP).then(function () { return client.fetchQuery(kit.opponent({ data: { id: peers[i].id } })); }).then(function (f) { if (f) { duelFoes[peers[i].id] = f; foes.push(f); } }, function () {}).then(function () { return load1(i + 1); });
      }
      return load1(0).then(function () {
        if (foes.length < ADVICE_MIN) { throw new Error("too few of those players could be loaded"); }
        var avg = function (list, f) { return list.reduce(function (a, x) { return a + f(x); }, 0) / list.length; };
        var points = Math.max(10, Math.round(avg(ADVICE_STATS, function (k) { return +me[k[0]] || 0; }) * 0.05 / 5) * 5);
        var seeds = foes.map(function () { return Math.floor(Math.random() * 2147483647); });
        // Runs one fighter against everyone, a player at a time, so the page keeps breathing.
        function versus(who, label) {
          var total = 0;
          function step(i) {
            if (i >= foes.length) { return Promise.resolve(total / foes.length * 100); }
            adviceState = { running: true, step: "Simulating " + label + "…", done: i, total: foes.length }; redraw();
            total += duelWinRate(kit, who, foes[i], seeds[i], ADVICE_SIMS);
            return wait(0).then(function () { return step(i + 1); });
          }
          return step(0);
        }
        return versus(me, "your current stats").then(function (base) {
          var rows = [];
          function each(n) {
            if (n >= ADVICE_STATS.length) { return Promise.resolve(); }
            var k = ADVICE_STATS[n][0], plus = Object.assign({}, me); plus[k] = (+me[k] || 0) + points;
            return versus(plus, "+" + points + " " + ADVICE_STATS[n][1]).then(function (win) {
              rows.push({ key: k, mine: +me[k] || 0, others: Math.round(avg(foes, function (f) { return +f[k] || 0; })), gain: win - base });
              return each(n + 1);
            });
          }
          return each(0).then(function () {
            rows.sort(function (a, b) { return b.gain - a.gain; });
            var st = load();
            st.duelAdvice = { at: Date.now(), spec: me.spec, peers: foes.length, points: points, base: base, rows: rows };
            save(st);
            adviceState = null;
          });
        });
      });
    }).catch(function (e) { adviceState = { error: String(e && e.message || e) }; }).then(redraw);
  }
  function adviceHtml(s) {
    var a = s.duelAdvice, running = adviceState && adviceState.running, now = Date.now(), name = {};
    ADVICE_STATS.forEach(function (k) { name[k[0]] = k[1]; });
    var h = "<div class='dqhead' style='margin-top:12px'><span class='t grow'>Where to put stat points</span><button type='button' data-dueladvice" + (running ? " disabled" : "") + " title='Simulates your fights against players of your class from the last scan. Starts no fights and spends nothing.'>" + (running ? "Working…" : a ? "Check again" : "Check my stats") + "</button></div>";
    if (running) { h += "<div class='st wait'>" + esc(adviceState.step) + "</div>" + (adviceState.total ? "<div class='bar' style='margin:6px 0'><i style='width:" + Math.round(adviceState.done / adviceState.total * 100) + "%'></i></div>" : ""); }
    if (adviceState && adviceState.error) { h += "<div class='st bad'>Couldn't check: " + esc(adviceState.error) + ".</div>"; }
    if (!a) { return running || adviceState ? h : h + "<div class='mqnote'>Compares your stats with players of your class from the last scan, and tries each stat a bit higher to see which wins you the most fights.</div>"; }
    var best = a.rows[0], close = a.rows.length > 1 && best.gain - a.rows[1].gain < ADVICE_SAME, age = Math.max(0, Math.round((now - a.at) / 60000));
    h += "<div class='dqfacts'>" + (best.gain < ADVICE_SAME ? "No stat stands out: <b>+" + a.points + "</b> anywhere barely changes your wins against these players."
      : "Best next: <b>" + name[best.key] + "</b>" + (close ? " or <b>" + name[a.rows[1].key] + "</b>" : "") + ". <b>+" + a.points + "</b> adds about <b>" + best.gain.toFixed(1) + "</b> points to your win chance.") + "</div>";
    h += "<table class='dq'><thead><tr><th style='text-align:left'>Stat</th><th>You</th><th title='Average base stat of those players, without gear'>Others</th><th title='Change in your average win chance with +" + a.points + " in this stat'>+" + a.points + "</th></tr></thead><tbody>";
    a.rows.forEach(function (r) {
      var behind = r.mine < r.others;
      h += "<tr><td style='text-align:left;color:var(--fg);white-space:nowrap'>" + name[r.key] + "</td><td" + (behind ? " style='color:#e8c46a'" : "") + ">" + r.mine.toLocaleString("en-US") + "</td><td>" + r.others.toLocaleString("en-US") + "</td><td class='w " + (r.gain >= ADVICE_SAME ? "hi" : "") + "'>" + (r.gain >= 0 ? "+" : "") + r.gain.toFixed(1) + "</td></tr>";
    });
    return h + "</tbody></table><div class='mqnote'>Against " + a.peers + " " + esc(SPECS[a.spec] || "") + " players near your rank, " + ADVICE_SIMS + " fights each, your average win chance is " + a.base.toFixed(0) + "%. Checked " + (age < 1 ? "just now" : age < 60 ? age + "m ago" : leftText(now - a.at) + " ago") + ". This compares equal points: it doesn't know what each upgrade costs. Other players of your class only, so it won't show how you do against the other classes.</div>";
  }
  function learnHtml(s) {
    var running = learnState && learnState.running, wins = honorWins(s), lost = honorLosses(s), dd = s.duelDefended, h = "<div class='dqhead' style='margin-top:12px'><span class='t grow'>Learned so far</span><button type='button' data-duellearn" + (running ? " disabled" : "") + " title='Reads the newest pages of your duel mail, one fight at a time. Starts no fights.'>" + (running ? "Reading…" : "Learn from mail") + "</button></div><div class='dqfacts'>";
    if (wins.length || lost.length) {
      var most = wins.reduce(function (a, l) { return Math.max(a, l.gain); }, 0);
      h += "<b>" + wins.length + "</b> won and <b>" + lost.length + "</b> lost attacks" + (most ? " · Biggest win seen: <b>+" + most.toLocaleString("en-US") + "</b>" : "");
    } else { h += "No fights read yet."; }
    var mdl = honorModel(s);
    h += "<br>Rule found: a win pays about <b>" + (mdl.k * 100).toFixed(1) + "%</b> of their honor × (their honor ÷ yours)" + (mdl.p.toFixed(1) === "1.0" ? "" : "<sup>" + mdl.p.toFixed(1) + "</sup>") + ". The loser loses 80% of that." + (mdl.n ? " Fitted on " + mdl.n + " fresh fights." : "");
    if (dd && dd.won + dd.lost) { h += "<br>Attacks on you: <b>" + dd.won + "</b> won, <b>" + dd.lost + "</b> lost, honor <b>" + (dd.honor > 0 ? "+" : "") + dd.honor.toLocaleString("en-US") + "</b>"; }
    h += "</div>";
    if (running) { h += "<div class='st wait'>" + esc(learnState.step) + "</div>" + (learnState.total ? "<div class='bar' style='margin:6px 0'><i style='width:" + Math.round(learnState.done / learnState.total * 100) + "%'></i></div>" : ""); }
    if (learnState && learnState.note) { h += "<div class='st ok'>" + esc(learnState.note) + "</div>"; }
    if (learnState && learnState.error) { h += "<div class='st bad'>Couldn't read the mail: " + esc(learnState.error) + ".</div>"; }
    return h;
  }

  // ===== Personal: gang war =====
  // The gang war opponents are in the game's own files, so each district's next opponent is rated with the same simulated fights.
  // Only opponents you can reach count: unlocked districts in your current city. Bonus opponents aren't rated. s.gangScan = {at, city, rows}.
  var gangState = null, gangKit = null, CITY_NAMES = { NEW_YORK: "New York", MIAMI: "Miami", HONG_KONG: "Hong Kong" };
  function gangTools() {
    if (gangKit) { return Promise.resolve(gangKit); }
    return duelTools().then(function (kit) {
      var idx = performance.getEntriesByType("resource").map(function (e) { return e.name; }).filter(function (n) { return /\/assets\/index-[\w-]+\.js/.test(n); })[0];
      return fetch(idx).then(function (r) { return r.text(); }).then(function (t) {
        var m = t.match(/(?:^|[^\w-])(dialogs-[\w-]+\.js)/);
        if (!m) { throw new Error("the game's gang war data wasn't found (the game may have changed)"); }
        return import(idx.replace(/index-[\w-]+\.js.*$/, m[1]));
      }).then(function (mod) {
        var foe = null, list = null;
        Object.keys(mod).forEach(function (k) {
          var f = mod[k], src = typeof f === "function" ? String(f) : "";
          if (src.indexOf("gangwar-weapon-") >= 0) { foe = f; }
          // Only a plain table lookup gets called here, to see whether it's the table of districts.
          if (!list && /^(?:function \w*\(\w+\)\{return \w+\[\w+\]\}|\w+=>\w+\[\w+\])$/.test(src)) {
            try { var r = f("NEW_YORK"); if (Array.isArray(r) && r[0] && "family" in r[0]) { list = f; } } catch (e) {}
          }
        });
        if (!foe || !list) { throw new Error("the game's gang war code wasn't recognised (the game may have changed)"); }
        gangKit = { fight: kit.fight, Rnd: kit.Rnd, foe: foe, list: list };
        return gangKit;
      });
    });
  }
  function runGangScan() {
    if (gangState && gangState.running) { return; }
    if (!client) { findClient(); }
    var me = duelMe(), q = client && client.getQueryCache().find({ queryKey: ["city", "gangwar"] });
    if (!me) { gangState = { error: "Your fighter hasn't loaded yet. Open a game page and try again." }; redraw(); return; }
    if (!q) { gangState = { needMap: true }; redraw(); return; }
    gangState = { running: true }; redraw();
    var fresh = typeof q.fetch === "function" && q.options && q.options.queryFn ? q.fetch().catch(function () { return q.state.data; }) : Promise.resolve(q.state.data);
    gangTools().then(function (kit) {
      return fresh.then(function (d) {
        var city = d && d.city || me.city, progress = d && d.progress;
        if (!progress) { throw new Error("the game's gang war progress wasn't found (the game may have changed)"); }
        var rows = [];
        kit.list(city).forEach(function (dist) {
          var at = progress[dist.id], fam = dist.family;
          if (!fam || at === undefined || at >= fam.opponents.length) { return; }
          var wins = [];
          for (var i = at; i < fam.opponents.length; i++) { wins.push(duelWinChance(kit, me, kit.foe(city, dist.id, i))); }
          var o = fam.opponents[at];
          rows.push({ district: dist.id, family: fam.name || dist.name || "", level: +o.level || 0, spec: o.spec || "", name: o.name || "", done: at, total: fam.opponents.length, win: wins[0], later: wins.slice(1) });
        });
        rows.sort(function (a, b) { return b.win - a.win; });
        var s = load();
        s.gangScan = { at: Date.now(), city: city, rows: rows };
        save(s);
        gangState = null;
      });
    }).catch(function (e) { gangState = { error: String(e && e.message || e) }; }).then(redraw);
  }
  function gangHtml(s) {
    var scan = s.gangScan, running = gangState && gangState.running, q = client && client.getQueryCache().find({ queryKey: ["city", "gangwar"] }), d = q && q.state.data, cd = d && d.nextFightAt && new Date(d.nextFightAt).getTime(), now = Date.now();
    var h = "<div class='dqhead'><span class='grow'>Who to attack first in this city</span><button type='button' class='go' data-gangscan" + (running ? " disabled" : "") + ">" + (running ? "Rating…" : scan ? "Rate again" : "Rate opponents") + "</button></div>";
    if (cd) { h += "<div class='dqfacts'>" + (cd > now ? "Free attack in <b>" + leftText(cd - now) + "</b>" : "Free attack <b>ready</b>") + "</div>"; }
    if (gangState && gangState.needMap) { h += "<div class='mqnote' style='font-size:13px'><a class='golink' href='" + GANGWAR + "'>Open the gang war map</a> once, then press the button again.</div>"; }
    if (gangState && gangState.error) { h += "<div class='st bad'>Couldn't rate: " + esc(gangState.error) + ".</div>"; }
    if (!scan) { return gangState ? h : h + "<div class='mqnote'>Rates the next opponent in each district you've unlocked, using simulated fights with the game's own formula. It starts no fights.</div>"; }
    if (!scan.rows.length) { h += "<div class='nomatch'>No opponents left in the districts you've unlocked in " + esc(CITY_NAMES[scan.city] || scan.city) + ".</div>"; }
    else {
      h += "<table class='dq'><thead><tr><th>Lv</th><th>Next opponent</th><th>Done</th><th>Win</th></tr></thead><tbody>";
      scan.rows.forEach(function (r) {
        var cls = r.win >= 70 ? "hi" : r.win >= 50 ? "md" : "lo", tip = "District " + (r.district + 1) + (r.later.length ? ". Win chance for the ones after: " + r.later.map(function (w) { return w + "%"; }).join(", ") : "");
        h += "<tr title='" + esc(tip) + "'><td>" + r.level + "</td><td class='nm2'>" + specIcon(r.spec) + esc(r.family ? "Family " + r.family : r.name) + "</td><td>" + r.done + "/" + r.total + "</td><td class='w " + cls + "'>" + r.win + "%</td></tr>";
      });
      h += "</tbody></table>";
    }
    var age = Math.max(0, Math.round((now - scan.at) / 60000));
    return h + "<div class='mqnote'>" + esc(CITY_NAMES[scan.city] || scan.city || "") + ", rated " + (age < 1 ? "just now" : age < 60 ? age + "m ago" : leftText(now - scan.at) + " ago") + ". Hover a row for the opponents after that one. Win % is " + DUEL_SIMS + " simulated fights, using your consumables. Bonus opponents aren't rated. <a class='golink' href='" + GANGWAR + "'>Open the map</a></div>";
  }

  // ===== Personal: timers =====
  // Your gang, mission booster and food come from your player data. Shop, wanted and gang war timers only exist for the city you're in,
  // so each is remembered per city when the game has loaded it: s.cityTimers = {city: {weapon, food, wanted, gang, survival}}.
  var GANG_NAMES = { spy: "Spy", pickpocket: "Pickpocket", accountant: "Accountant", coach: "Fitness coach", fence: "Fence" };
  var BOOSTER_NAMES = { 1: "Bike", 2: "Taxi", 3: "Limousine", 4: "Jet" };
  var CITY_TIMERS = [["weapon", "Black market"], ["food", "Corner shop"], ["wanted", "Wanted"], ["gang", "Gang war"], ["survival", "Survival"]];
  function timeOf(v) { var t = v ? new Date(v).getTime() : 0; return t > 0 ? t : 0; }
  function rememberTimers() {
    var me = client && duelMe();
    if (!me || !me.city) { return; }
    var cache = client.getQueryCache(), data = function (k) { var q = cache.find({ queryKey: ["city", k] }); return q && q.state.data; };
    var shops = data("shops"), wanted = data("wanted"), gang = data("gangwar"), survival = data("survival");
    var now = { weapon: timeOf(shops && shops.weapon && shops.weapon.nextRefreshAt), food: timeOf(shops && shops.food && shops.food.nextRefreshAt), wanted: timeOf(wanted && wanted.nextAttackAt), gang: timeOf(gang && gang.nextFightAt), survival: timeOf(survival && survival.nextAt) };
    var s = null, all, cur;
    Object.keys(now).forEach(function (k) {
      if (!now[k]) { return; }
      if (!s) { s = load(); all = s.cityTimers = s.cityTimers || {}; cur = all[me.city] = all[me.city] || {}; }
      cur[k] = now[k];
    });
    if (s && JSON.stringify(cur) !== JSON.stringify(rememberedTimers[me.city] || {})) { rememberedTimers[me.city] = JSON.parse(JSON.stringify(cur)); save(s); }
  }
  var rememberedTimers = {};
  function timersHtml(s) {
    var me = duelMe(), now = Date.now(), h = "";
    if (!me) { return "<div class='mqnote'>Your player data hasn't loaded yet.</div>"; }
    var rows = [];
    (me.gang || []).forEach(function (g) { if (g) { rows.push({ kind: "Gang", name: GANG_NAMES[g.id] || mqNice(g.id), at: timeOf(g.endsAt), href: "/game/gang" }); } });
    var b = me.missionBooster;
    if (b && b.id && timeOf(b.endsAt)) { rows.push({ kind: "Mission booster", name: BOOSTER_NAMES[b.id] || mqNice(String(b.id)), at: timeOf(b.endsAt), href: "/game/shops" }); }
    (me.food || []).forEach(function (f) {
      var it = f && f.item;
      if (it && it.usedAt && it.durationDays) {
        var end = timeOf(it.usedAt) + it.durationDays * DAY;
        if (end > now) { rows.push({ kind: "Food", name: mqItemInfo({ id: String(it.id), tier: it.tier || "" }).name, at: end, href: "/game/shops" }); }
      }
    });
    if ((me.food || []).length) { loadMqItems(); }
    rows.sort(function (x, y) { return x.at - y.at; });
    h += "<div class='dqhead'><span class='t grow'>Running out</span></div>";
    if (!rows.length) { h += "<div class='nomatch'>No gang members, booster or food running.</div>"; }
    else {
      h += "<table class='dq'><tbody>";
      rows.forEach(function (r) {
        var left = r.at - now, cls = left <= 0 ? "lo" : left <= DAY ? "md" : "";
        h += "<tr><td>" + esc(r.kind) + "</td><td class='nm2'><a class='who' href='" + r.href + "'>" + esc(r.name) + "</a></td><td class='w " + cls + "' style='white-space:nowrap;font-weight:600'>" + (left > 0 ? leftText(left) : "ended") + "</td></tr>";
      });
      h += "</tbody></table>";
    }
    var cd = duelCooldown(), bossAt = timeOf(me.nextBossFightAt), cell = function (t) { return !t ? "–" : t > now ? leftText(t - now) : "<span style='color:#93d36d'>ready</span>"; };
    // Each district has one bonus opponent, so the timer only matters while one is left to fight. The map's data says, for the current city.
    var gq = client && client.getQueryCache().find({ queryKey: ["city", "gangwar"] }), quests = gq && gq.state.data && gq.state.data.cityQuests, bossText = "";
    if (Array.isArray(quests)) {
      var bossIn = function (st) { return quests.filter(function (q) { return q.status === st; }).map(function (q) { return q.district + 1; }); }, wonBoss = bossIn("FIGHT_WON"), openBoss = bossIn("FIGHT_AVAILABLE");
      bossText = wonBoss.length ? "reward waiting, district " + wonBoss.join(", ") : openBoss.length ? "district " + openBoss.join(", ") + " · " + cell(bossAt || 1) : "none to fight";
    }
    h += "<div class='dqhead' style='margin-top:12px'><span class='t grow'>Free again in</span></div><table class='dq'><thead><tr><th></th>" + Object.keys(CITY_NAMES).map(function (c) { return "<th class='" + (c === me.city ? "here" : "") + "' style='text-align:right'" + (c === me.city ? " title='You are here'" : "") + ">" + CITY_NAMES[c] + "</th>"; }).join("") + "</tr></thead><tbody>";
    var all = s.cityTimers || {};
    CITY_TIMERS.forEach(function (t) {
      h += "<tr><td style='color:var(--fg);white-space:nowrap'>" + t[1] + "</td>" + Object.keys(CITY_NAMES).map(function (c) { return "<td class='" + (c === me.city ? "here" : "") + "' style='text-align:right;white-space:nowrap'>" + cell(all[c] && all[c][t[0]]) + "</td>"; }).join("") + "</tr>";
    });
    h += "</tbody></table><div class='dqfacts' style='margin-top:8px'>" + (cd ? "Duel: <b>" + cell(cd) + "</b>" : "") + (bossText ? (cd ? " · " : "") + "Bonus opponent: <b>" + bossText + "</b>" : "") + "</div>";
    return h + "<div class='mqnote'>The city table fills in as you visit each shop, wanted and gang war page in that city. – means not seen yet.</div>";
  }

  function duelCooldown() {
    if (!client) { return null; }
    var at = 0;
    client.getQueryCache().findAll().forEach(function (q) { var d = q.state && q.state.data; if (d && d.nextDuelAttackAt) { at = new Date(d.nextDuelAttackAt).getTime() || 0; } });
    return at;
  }
  function duelHtml(s) {
    var scan = s.duelScan, me = duelMe(), running = duelState && duelState.running, myRank = me && me.ranking && +me.ranking.position || scan && scan.myRank || 0, cd = duelCooldown(), now = Date.now();
    var h = "<div class='dqhead'><span class='grow'>Scan the players around you</span><span class='seg'>" + DUEL_RANGES.map(function (n) {
      return "<button type='button' data-duelrange='" + n + "'" + (n === duelRange ? " class='on'" : "") + " title='" + n + " places above you and " + Math.ceil(n / 2) + " below'>" + n + "</button>";
    }).join("") + "</span><button type='button' class='go' data-duelscan" + (running ? " disabled" : "") + ">" + (scan ? "Scan again" : "Scan") + "</button></div>";
    h += "<div class='dqfacts'>" + (myRank ? "Your rank <b>#" + myRank + "</b>" : "") + (me && me.xp != null && last ? "" : "")
      + (cd ? (myRank ? " · " : "") + (cd > now ? "Free attack in <b>" + leftText(cd - now) + "</b>" : "Free attack <b>ready</b>") : "") + "</div>";
    if (running) { h += "<div class='st wait'>" + esc(duelState.step) + "</div>" + (duelState.total ? "<div class='bar' style='margin:6px 0'><i style='width:" + Math.round(duelState.done / duelState.total * 100) + "%'></i></div>" : ""); }
    if (duelState && duelState.error) { h += "<div class='st bad'>Couldn't scan: " + esc(duelState.error) + ".</div>"; }
    if (!scan) { return h + (running ? "" : "<div class='mqnote'>Press Scan to rate the players around your rank. It loads them one by one, about a second each, and starts no fights.</div>") + damageHtml() + learnHtml(s); }
    var cap = duelCap(me), used = {};
    scan.rows.forEach(function (r) { used[r.id] = attacksToday(s, r.id); });
    var count = function (min) { return scan.rows.filter(function (r) { return r.win >= min && (!min || used[r.id] < cap); }).length; }, capped = scan.rows.filter(function (r) { return used[r.id] >= cap; }).length;
    h += "<div class='mfilters'>" + [[70, "Beatable 70%+"], [50, "50%+"], [0, "All"]].map(function (o) {
      return "<button type='button' data-duelfilter='" + o[0] + "'" + (duelFilter === o[0] ? " class='on'" : "") + ">" + o[1] + " " + count(o[0]) + "</button>";
    }).join("") + "</div>";
    // Players above you first, best rank on top; those below you after them, faded.
    var rows = scan.rows.filter(function (r) { return r.win >= duelFilter && (!duelFilter || used[r.id] < cap); }), est = {};
    var model = honorModel(s), myH = me && +me.honor || scan.myHonor;
    scan.rows.forEach(function (r) { est[r.id] = honorEstimate(model, r, myH); });
    // What a fight is worth on average: the win weighed by the win chance, less the loss weighed by the chance of losing.
    var worth = function (r) { return (est[r.id] || 0) * r.win / 100 - honorLoss(model, r, myH) * (100 - r.win) / 100; };
    if (duelSort === "honor") { rows = rows.slice().sort(function (a, b) { return (used[a.id] >= cap) - (used[b.id] >= cap) || worth(b) - worth(a); }); }
    var honorTip = "An estimate from the rule found in real fights: usually within 1.5×, sometimes 2.4×.";
    h += "<div class='dqhead' style='margin-top:0'><span class='grow'>Sort</span><span class='seg'>" + [["rank", "Best rank"], ["honor", "Best honor"]].map(function (o) {
      return "<button type='button' data-duelsort='" + o[0] + "'" + (duelSort === o[0] ? " class='on'" : "") + (o[0] === "honor" ? " title='Honor if you win, weighed by your win chance'" : "") + ">" + o[1] + "</button>";
    }).join("") + "</span></div>";
    if (!rows.length) { h += "<div class='nomatch'>Nobody in this range at " + duelFilter + "%+. Try a wider scan or a lower filter.</div>"; }
    else {
      h += "<table class='dq'><thead><tr><th>Rank</th><th>Player</th><th>Lv</th><th>Win</th><th title='" + esc(honorTip + " First number: if you win. Second: if you lose.") + "'>Honor</th><th></th></tr></thead><tbody>";
      rows.forEach(function (r) {
        var cls = r.win >= 70 ? "hi" : r.win >= 50 ? "md" : "lo";
        var full = used[r.id] >= cap;
        h += "<tr" + (r.rank > scan.myRank || full ? " class='below'" : "") + "><td>#" + r.rank + "</td><td class='nm2'>" + specIcon(r.spec)
          + "<a class='who' href='/game/player/" + esc(r.id) + "' title='" + esc((r.family ? r.family + ". " : "") + "Open profile") + "'>" + esc(r.name) + "</a></td><td>" + r.level + "</td><td class='w " + cls + "'>" + r.win + "%</td><td style='white-space:nowrap' title='" + esc(honorTip + " Win about +" + (est[r.id] || 0).toLocaleString("en-US") + ", lose about −" + honorLoss(model, r, myH).toLocaleString("en-US") + ". Worth about " + Math.round(worth(r)).toLocaleString("en-US") + " a fight at this win chance.") + "'>" + (est[r.id] ? "+" + honorShort(est[r.id]) + " <span class='idle'>−" + honorShort(honorLoss(model, r, myH)) + "</span>" : "?") + "</td>"
          + "<td style='white-space:nowrap'>" + (full ? "<span class='idle' title='You attacked them " + used[r.id] + " times today, the daily limit. Resets at 00:00 UTC.'>" + used[r.id] + "/" + cap + " today</span>"
            : "<a class='fight' href='/game/duel/compare/" + esc(r.id) + "' title='Open the game&#39;s fight screen. Nothing starts until you press its button." + (used[r.id] ? " Attacked " + used[r.id] + " of " + cap + " times today." : "") + "'>" + (used[r.id] ? used[r.id] + "/" + cap + " " : "") + "Fight ›</a>") + "</td></tr>";
      });
      h += "</tbody></table>";
    }
    var age = Math.max(0, Math.round((now - scan.at) / 60000));
    if (capped && duelFilter) { h += "<div class='mqnote'>" + capped + " player" + (capped === 1 ? "" : "s") + " hidden: already attacked " + cap + " times today. See All.</div>"; }
    return h + damageHtml() + adviceHtml(s) + learnHtml(s) + "<div class='mqnote'>Scanned " + (age < 1 ? "just now" : age < 60 ? age + "m ago" : leftText(now - scan.at) + " ago") + (scan.partial ? ", some players couldn't be loaded" : "") + ". Win % is " + DUEL_SIMS + " simulated fights with the game's own formula, using your consumables. A real fight can still go either way.</div>";
  }

  // Away (vacation): s.away = {id: start of the last away game day}. Set per PC from the 🏖️ button; expired entries are ignored.
  function awayUntil(s, id) { var u = s.away && s.away[id]; return u && u >= dayStart(Date.now()) ? u : 0; }
  function setAway(id) {
    var s = load(), m = last && members(last.fam).filter(function (x) { return x.id === id; })[0], cur = awayUntil(s, id);
    var ans = prompt((m ? m.name : "Member") + " is away for how many days, today included? (e.g. 7)\nLeave empty or 0 to clear." + (cur ? "\nNow: away until " + shortDay(cur) + "." : ""), cur ? "" : "7");
    if (ans === null) { return; }
    var n = parseInt(ans, 10);
    s.away = s.away || {};
    Object.keys(s.away).forEach(function (k) { if (!awayUntil(s, k)) { delete s.away[k]; } });
    if (n > 0) { s.away[id] = dayStart(Date.now()) + (Math.min(n, 365) - 1) * DAY; } else { delete s.away[id]; }
    save(s); redraw();
  }
  // Member search and quick filter on the Activity tab (kept until the Family tab is left). Rows carry their filter flags:
  // u = under 100 today, r = can fight but isn't registered for a planned war, o = online, a = away, d = not linked to Discord.
  var memberQuery = "", memberFilter = "", trendId = "";
  function nameMatch(lower) { var q = memberQuery.trim().toLowerCase(); return !q || lower.indexOf(q) >= 0; }
  function rowShown(lower, flags) { return nameMatch(lower) && (!memberFilter || flags.indexOf(memberFilter) >= 0); }
  function memberFlags(s, m, su) {
    var miss = ["attack", "defense"].some(function (k) { return su[k] && unregistered(s, [m], su[k]).length; });
    return (m.today < FULL ? "u" : "") + (miss ? "r" : "") + (m.online ? "o" : "") + (awayUntil(s, m.id) ? "a" : "") + (s.links && !s.links[m.id] ? "d" : "");
  }
  function filterHtml(s, list, flags, su) {
    var count = function (f) { return list.filter(function (m) { return flags[m.id].indexOf(f) >= 0; }).length; };
    return "<div class='mfilters'>" + [["", "All", list.length], ["u", "Under 100", count("u")], ["r", "Not registered", count("r")], ["o", "Online", count("o")], ["a", "Away", count("a")]].concat(s.links && Object.keys(s.links).length ? [["d", "No Discord", count("d")]] : []).map(function (o) {
      var off = o[0] === "r" && !su.attack && !su.defense;
      return "<button type='button' data-mfilter='" + o[0] + "'" + (memberFilter === o[0] ? " class='on'" : "") + (off ? " disabled title='No war planned'" : "") + ">" + o[1] + " " + o[2] + "</button>";
    }).join("") + "</div>";
  }
  function applyMemberFilter() {
    var shown = 0;
    [].forEach.call(box.querySelectorAll("tr[data-name]"), function (tr) {
      var on = rowShown(tr.getAttribute("data-name"), tr.getAttribute("data-f") || "");
      tr.style.display = on ? "" : "none";
      if (on) { shown++; }
    });
    var none = box.querySelector(".nomatch");
    if (none) { none.style.display = shown ? "none" : ""; }
  }

  // A member's last 14 finished days plus today, opened by clicking their row. One bar per day, coloured like the table
  // (100+, 50–99, under 50, 0), on a linear scale with a line at 100. Days without data stay empty.
  var TREND_DAYS = 14;
  function trendHtml(s, m, mid, att) {
    var days = [], top = FULL, known = 0, sum = 0, full = 0, rec = s.records || {}, best = rec.best && rec.best[m.id], rank = rec.rank && rec.rank[m.id], a = att && att[m.id];
    for (var i = TREND_DAYS; i >= 1; i--) {
      var t = mid - i * DAY, r = s.hist && s.hist[dayKey(t)], ap = r && r[m.id] ? r[m.id].ap : i === 1 ? m.yesterday : null;
      if (m.joinedAt && m.joinedAt > t + DAY) { ap = null; }
      days.push({ t: t, ap: ap });
      if (ap != null) { known++; sum += ap; if (ap >= FULL) { full++; } top = Math.max(top, ap); }
    }
    top = Math.max(top, m.today);
    days.push({ t: mid, ap: m.today, today: true });
    var bars = days.map(function (d) {
      var tip = shortDay(d.t) + (d.today ? " (today so far)" : "") + ": " + (d.ap == null ? "no data" : d.ap.toLocaleString("en-US") + " points");
      return "<span class='bc" + (d.today ? " today" : "") + "' title='" + tip + "'>" + (d.ap == null ? "" : "<i class='b " + apClass(d.ap) + "' style='height:" + Math.max(d.ap ? 6 : 3, Math.round(d.ap / top * 100)) + "%'></i>") + "</span>";
    }).join("");
    var fact = function (label, val) { return "<span>" + label + " <b>" + val + "</b></span>"; }, streak = fullStreak(s, m.id, mid);
    return "<div class='chart'>" + bars + "<div class='ref' style='bottom:" + Math.round(FULL / top * 100) + "%'><span>100</span></div></div>"
      + "<div class='ax'><span>" + shortDay(days[0].t).replace(/^\w+ /, "") + "</span><span>today</span></div><div class='tfacts'>"
      + (known ? fact("At 100+", full + "/" + known + " days") + fact("Average", Math.round(sum / known).toLocaleString("en-US")) : "")
      + (streak ? fact("Streak", streak + "d") : "")
      + (best ? fact("Best day", best.ap.toLocaleString("en-US") + " (" + shortDay(+new Date(best.day)).replace(/^\w+ /, "") + ")") : "")
      + (a && a.wars ? fact("Wars", a.fought + "/" + a.wars) : "")
      + (m.pos ? fact("Honor rank", "#" + m.pos + (rank && rank.pos < m.pos ? " (best #" + rank.pos + ")" : "")) : "")
      + (m.joinedAt ? fact("Joined", shortDay(m.joinedAt).replace(/^\w+ /, "")) : "")
      + "</div>";
  }

  // The XP and cash boosts at a glance: time left of the 7 days, renewal, auto-renew and the treasury. A boost that has run
  // out can be bought from here at +25% (same command and rights as auto-renew, after a confirmation).
  var buyBusy = false;
  function leftText(ms) {
    var m = Math.max(0, Math.ceil(ms / 60000));
    return m >= 1440 ? Math.floor(m / 1440) + "d " + Math.floor(m % 1440 / 60) + "h" : m >= 60 ? Math.floor(m / 60) + "h " + (m % 60) + "m" : m + "m";
  }
  function boostHtml(s) {
    var p = last && last.fam.private, now = Date.now();
    if (!p || !("xpBoost" in p || "xpBoostUntil" in p || p.boostPrices)) { return ""; }
    var price = p.boostPrices && +p.boostPrices.high, can = !p.rank || p.rank === "godfather" || p.rank === "counselor", gold = p.treasury == null ? null : +p.treasury || 0, soon = 0;
    var rows = Object.keys(BOOSTS).map(function (k) {
      var until = boostEnd(p, k), left = until - now, on = left > 0, pct = +p[k + "Boost"] || 0, auto = s.autoBoost && s.autoBoost[k];
      if (!on || left <= DAY) { soon++; }
      return "<div class='bo" + (!on ? " out" : left <= DAY ? " warn" : "") + "'><b>" + BOOSTS[k] + (on && pct ? " +" + pct + "%" : "") + "</b>"
        + "<span class='bar' title='" + (on ? "Ends " + new Date(until).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Not active") + "'><i style='width:" + (on ? Math.max(2, Math.min(100, Math.round(left / (7 * DAY) * 100))) : 0) + "%'></i></span>"
        + "<span class='left'>" + (on ? leftText(left) : "ended") + "</span>"
        + "<span>" + (!on && can && price ? "<button type='button' class='go' data-buyboost='" + k + "'" + (buyBusy || gold != null && gold < price ? " disabled" : "") + " title='Buy +" + AUTO_PCT + "% for 7 days: " + price.toLocaleString("en-US") + " family gold'>Buy</button> " : "")
        + (can ? "<button type='button' data-autoboost='" + k + "'" + (auto ? " class='go'" : "") + " title='Auto-renew on this PC: " + (auto ? "on" : "off") + ". Use it on one PC only.'>Auto " + (auto ? "on" : "off") + "</button>" : "") + "</span></div>";
    }).join("");
    var trez = "";
    if (gold != null) {
      var missing = price ? price * soon - gold : 0;
      var runway = price ? goldRunway(p, gold, price, now) : null;
      trez = "<div class='trez" + (missing > 0 ? " bad" : "") + "'>🪙 Treasury <b>" + gold.toLocaleString("en-US") + "</b>"
        + (runway && runway.until > now ? " · <span title='At today&#39;s price, with both boosts kept running: " + runway.buys + " more renewal" + (runway.buys === 1 ? "" : "s") + ", " + runway.left.toLocaleString("en-US") + " gold left over. Both boosts are paid for until " + shortDay(runway.until) + ". Donations and price changes move this date.'>lasts <b>" + spanText(runway.until - now) + "</b> (to " + shortDay(runway.until).replace(/^\w+ /, "") + ")</span>" : "")
        + (price ? "<br>+" + AUTO_PCT + "% costs <b>" + price.toLocaleString("en-US") + "</b> each · <b>" + (price * 2).toLocaleString("en-US") + "</b> for both" : "")
        + (price && soon && missing > 0 ? " · ⚠️ " + missing.toLocaleString("en-US") + " missing for " + (soon > 1 ? "both boosts" : "the renewal") : price && soon ? " · ✅ renewal covered" : "") + "</div>";
    }
    return "<div class='boosts'>" + rows + trez + "</div>";
  }
  // How long the treasury keeps both boosts running: each boost is renewed for 7 days when it ends, whichever ends first
  // being paid first, until the gold can't pay the next one. Paid until = the moment the first boost would run out.
  function goldRunway(p, gold, price, now) {
    var ends = Object.keys(BOOSTS).map(function (k) { return Math.max(now, boostEnd(p, k)); }), buys = 0;
    while (gold >= price && buys < 1000) {
      var first = ends[0] <= ends[1] ? 0 : 1;
      ends[first] += 7 * DAY; gold -= price; buys++;
    }
    return { until: Math.min(ends[0], ends[1]), buys: buys, left: gold };
  }
  function spanText(ms) {
    var d = Math.floor(ms / DAY);
    return d >= 14 ? Math.floor(d / 7) + "w " + (d % 7) + "d" : leftText(ms);
  }
  function buyBoost(kind) {
    var p = last && last.fam.private, price = p && p.boostPrices && +p.boostPrices.high;
    if (!price || buyBusy) { return; }
    if (!confirm("Buy the +" + AUTO_PCT + "% " + BOOSTS[kind] + " boost for 7 days?\n\nCosts " + price.toLocaleString("en-US") + " family gold. The treasury has " + (+p.treasury || 0).toLocaleString("en-US") + ".")) { return; }
    buyBusy = true; redraw();
    var famId = last.fam.id;
    familyCommand().then(function (fn) {
      return fn({ data: { requestId: crypto.randomUUID(), command: { action: "boost", familyId: famId, kind: kind, percent: AUTO_PCT, price: price } } });
    }).then(function () { refreshFamily(); }, function (e) { alert("The game said: " + (e && e.message || e)); }).then(function () { buyBusy = false; redraw(); });
  }

  // The minimized bar: at-100 count, next battle with who's registered, time to reset, and a boost that needs attention.
  var DRAG_TIP = "Drag to float. Drop on the right edge or double-click to dock beside the game.";
  function minChips(s, list, full) {
    if (!last) { return "<span class='mc'>Loading…</span>"; }
    var h = "<span class='mc' title='Members at 100 points today'><b>" + full + "/" + list.length + "</b></span>", nw = nextWar();
    var runNow = missionRunning();
    if (runNow) { h = "<span class='mc" + (runNow.left ? "" : " warn") + "' title='" + esc(runNow.name || "Your mission") + "'>🎯 <b class='mrunchip'>" + (runNow.left ? clockText(runNow.left) : "ready") + "</b></span>" + h; }
    else if (lastPath === BAR && missions.length) { var mode = mqMode(); h = "<span class='mc' title='" + MQ_MODES[mode].title + "'>🎯 <b>" + esc(mqRank(mode).bs.name) + "</b></span>" + h; }
    if (nw) {
      var side = warSignups(last.fam)[nw.side.attack ? "attack" : "defense"], n = list.filter(function (m) { return side && side.ids[m.id]; }).length;
      h += "<span class='mc' title='" + (nw.side.attack ? "Our attack on " : "Defence against ") + esc(nw.side.foe) + ": " + n + " of " + list.length + " registered'><i>" + (nw.side.attack ? ATK_ICON : DEF_ICON) + "</i><b>" + leftText(startOf(nw.w) - Date.now()) + "</b> " + n + "/" + list.length + "</span>";
    }
    h += "<span class='mc' title='Until the daily reset'>⏳ <b>" + untilReset() + "</b></span>";
    var p = last.fam.private, now = Date.now();
    if (p) {
      Object.keys(BOOSTS).forEach(function (k) {
        var left = boostEnd(p, k) - now;
        if (("xpBoostUntil" in p || "xpBoost" in p) && left <= DAY) { h += "<span class='mc warn' title='" + BOOSTS[k] + " boost " + (left > 0 ? "ends soon" : "has ended") + "'>🚀 <b>" + BOOSTS[k] + " " + (left > 0 ? leftText(left) : "off") + "</b></span>"; }
      });
    }
    return h;
  }

  // War sign-up reminder, by button only: pings (in the family chat) the members who could fight in a planned war but
  // haven't registered. Members who joined too late for that war or are away are left out.
  var remindBusy = false;
  function unregistered(s, list, side) {
    return list.filter(function (m) {
      return !side.ids[m.id] && !awayUntil(s, m.id) && side.wars.some(function (w) { return couldFight(s, m, declaredAt(w)); });
    });
  }
  function remindHtml(s, list, su) {
    if (!s.lvHook || !(su.attack || su.defense)) { return ""; }
    var miss = {};
    ["attack", "defense"].forEach(function (k) { if (su[k]) { unregistered(s, list, su[k]).forEach(function (m) { miss[m.id] = 1; }); } });
    var n = Object.keys(miss).length, ago = s.remindAt ? Math.round((Date.now() - s.remindAt) / 60000) : -1;
    return "<div class='remind'><button type='button' data-remind" + (n && !remindBusy ? "" : " disabled") + " title='Pings the members who can fight but are not registered yet, in the family chat'>📣 Remind unregistered (" + n + ")</button>"
      + (remindBusy ? "<span>Sending…</span>" : ago >= 0 && ago < 24 * 60 ? "<span>last sent " + (ago < 60 ? ago + "m" : Math.floor(ago / 60) + "h " + (ago % 60) + "m") + " ago</span>" : "") + "</div>";
  }
  function sendRemind() {
    var s = load(), list = members(last.fam), su = warSignups(last.fam), users = [], lines = [], total = 0;
    [["attack", "⚔️ Attack on"], ["defense", "🛡️ Defence against"]].forEach(function (k) {
      var side = su[k[0]];
      if (!side) { return; }
      var miss = unregistered(s, list, side), first = side.wars.map(startOf).sort()[0];
      total += miss.length;
      lines.push(k[1] + " **" + md(side.foes.join(", ")) + "** · battle <t:" + Math.round(first / 1000) + ":R>");
      lines.push(miss.length ? "Not registered yet: " + miss.map(function (m) { return who(s, m, users); }).join(", ") : "Everyone who can fight is registered! ✅");
    });
    if (!total || !confirm("Ping " + users.length + " linked member" + (users.length === 1 ? "" : "s") + " in the family chat (" + total + " not registered)?")) { return; }
    remindBusy = true; redraw();
    var msg = dress("Family", say("signHead") + "\n" + lines.join("\n") + "\n" + say("signTail"), users);
    post(s.lvHook, msg, null, true).then(function () { var n = load(); n.remindAt = Date.now(); save(n); }, function (e) { alert("Couldn't send: " + (e && e.message || e)); })
      .then(function () { remindBusy = false; redraw(); });
  }

  function untilReset() {
    var m = Math.max(0, Math.ceil((dayStart(Date.now()) + 864e5 - Date.now()) / 60000));
    return Math.floor(m / 60) + "h " + (m % 60) + "m";
  }

  // One line about the Discord report. Leaders who don't post reports just see the panel.
  function status(s) {
    var mid = dayStart(Date.now()), day = dayKey(mid - 1);
    if (!s.webhook) { return ["", "Discord reports are off on this PC."]; }
    if (sending) { return ["wait", "Sending yesterday's report to Discord…"]; }
    if (error) { return ["bad", "Couldn't post to Discord: " + esc(error) + ". Trying again in a few minutes."]; }
    if (s.sentDay === day) { return ["ok", "✓ Report for " + dayLabel(mid - 1) + " is in Discord (" + clock(s.sentAt) + "). " + esc(note)]; }
    if (last && last.at < mid + GRACE) { return ["wait", "Waiting for fresh numbers after the daily reset…"]; }
    return ["wait", "The report for " + dayLabel(mid - 1) + " goes out in a moment."];
  }

  var SORTS = { today: "Today", yesterday: "Yesterday", levels: "Levels" };
  function draw() {
    if (!box || !document.body.contains(box)) {
      box = document.createElement("div");
      box.id = ID;
      showPlanner = showRecruits = showRanks = false; memberQuery = memberFilter = trendId = ""; // a freshly opened panel starts on Activity
      box.addEventListener("click", onClick);
      box.addEventListener("pointerdown", onDown);
      box.addEventListener("pointermove", onMove);
      box.addEventListener("pointerup", onUp);
      box.addEventListener("pointercancel", onUp);
      box.addEventListener("dblclick", onDbl);
      box.addEventListener("change", onChange);
      box.addEventListener("input", onInput);
      box.addEventListener("keydown", function (e) { if (e.key === "Escape" && e.target.hasAttribute("data-msearch")) { e.target.value = ""; onInput(e); e.target.blur(); } });
      box.addEventListener("mousemove", function (e) { tipX = e.clientX; tipY = e.clientY; showTip(); });
      box.addEventListener("mouseleave", function () { tipX = -1; showTip(); });
      box.addEventListener("scroll", function () { showTip(); });
      document.body.appendChild(box);
    }
    loadSpecIcons();
    var s = load(), sortBy = SORTS[s.sort] ? s.sort : "today", html = "<style>" + css.replace(/#ID/g, "#" + ID) + "</style>";
    var close = "<button type='button' class='icon' data-close title='Close'>&times;</button>";
    box.className = city() + (s.min ? " min" : "") + fxClasses(s);
    fxStyle();
    var st = status(s), list = last ? members(last.fam) : [], start = gainsToday(s);
    list.forEach(function (m) { m.levels = start && m.id in start ? m.level - start[m.id] : null; });
    var full = list.filter(function (m) { return m.today >= FULL; }).length;
    var total = list.reduce(function (a, m) { return a + m.today; }, 0);
    var gained = list.reduce(function (a, m) { return a + Math.max(0, m.levels || 0); }, 0);

    if (s.min) {
      box.innerHTML = html + "<div class='top' title='" + DRAG_TIP + "'>" + minChips(s, list, full) + "<span class='minbtn'>" + "<button type='button' class='icon' data-min title='Expand'>&#9662;</button>" + close + "</span></div>";
      place(); tipTitles();
      return;
    }
    var view = last && showRecruits ? "recruits" : last && showPlanner ? "planner" : last && showRanks ? "ranks" : "activity";
    if (view !== "activity" && area !== "personal") { box.className += " wide"; }
    html += "<div class='top' title='" + DRAG_TIP + "'><span class='seg area'>" + [["personal", "👤 Personal"], ["family", "👨‍👩‍👦 Family"]].map(function (o) {
      return "<button type='button' data-area='" + o[0] + "'" + (area === o[0] ? " class='on'" : "") + ">" + o[1] + "</button>";
    }).join("") + "</span><span class='grow'></span>"
      + "<button type='button' class='icon vol' data-vol title='Game sound volume (this PC)'>" + (volume === 0 ? "🔇" : volume < 50 ? "🔉" : "🔊") + " " + volume + "%</button>"
      + "<button type='button' class='icon' data-min title='Minimize'>&ndash;</button>" + close + "</div>";
    if (showVol) {
      // While the slider has focus the panel doesn't redraw (see tick), so dragging isn't interrupted.
      html += "<div class='volrow'><span>Game sound</span><input type='range' min='0' max='100' step='1' value='" + volume + "' data-volslider>"
        + "<b class='vv'>" + (volume ? volume + "%" : "Off") + "</b></div>";
    }
    html += alertHtml(s) + missionBarHtml();
    if (area === "personal") {
      html += "<div class='tabs'>" + [["missions", "🎯 Missions"], ["duels", "⚔️ Duels"], ["gang", "🗺️ Gang war"], ["timers", "⏱ Timers"]].map(function (o) {
        return "<button type='button' data-ptab='" + o[0] + "'" + (personalTab === o[0] ? " class='on'" : "") + ">" + o[1] + "</button>";
      }).join("") + "</div>";
      box.innerHTML = html + (personalTab === "duels" ? duelHtml(s) : personalTab === "gang" ? gangHtml(s) : personalTab === "timers" ? timersHtml(s) : missionHtml()) + "<div class='ver'>Activity v" + VERSION + "</div>";
      place(); tipTitles();
      return;
    }
    // The views as tabs right under the title, so switching never needs scrolling.
    if (last) {
      html += "<div class='tabs'>" + [["activity", "data-home", "📊 Activity"], ["planner", "data-planner", "⚔️ War planner"], ["recruits", "data-recruits", "🧲 Recruits"], ["ranks", "data-ranks", "👑 Ranks"]].map(function (o) {
        return "<button type='button' " + o[1] + (view === o[0] ? " class='on'" : "") + ">" + o[2] + "</button>";
      }).join("") + "</div>" + attackStatus(s); // an armed auto-attack shows on every tab
    }
    if (view === "recruits") {
      html += recruitHtml(s);
    } else if (view === "ranks") {
      html += ranksHtml(s);
    } else if (view === "planner") {
      html += plannerHtml(s);
    } else if (!last) {
      html += "<p>Waiting for the family list to load…</p>" + (diag ? "<p style='font-size:11px;color:var(--muted);word-break:break-all'>" + esc(diag) + "</p>" : "");
    } else {
      var su = warSignups(last.fam), signed = function (k) { var side = su[k]; return side ? list.filter(function (m) { return side.ids[m.id]; }).length : null; };
      var nA = signed("attack"), nD = signed("defense");
      var warTip = [["attack", nA, "Attack on"], ["defense", nD, "Defence against"]].map(function (k) {
        return su[k[0]] ? k[2] + " " + su[k[0]].foes.join(", ") + ": " + k[1] + " of " + list.length + " registered" : "No " + (k[0] === "attack" ? "attack" : "defence") + " planned";
      }).join("\n");
      html += "<div class='stats five'>"
        + "<div class='stat'><b>" + full + "/" + list.length + "</b><span>at 100 today</span></div>"
        + "<div class='stat'><b>" + total.toLocaleString("en-US") + "</b><span>points today</span></div>"
        + "<div class='stat'><b>" + (start ? "+" + gained : "–") + "</b><span>levels today</span></div>"
        + "<div class='stat' title='" + esc(warTip) + "'><b class='wk'><i>" + ATK_ICON + "</i>" + (nA == null ? "–" : nA) + " <i>" + DEF_ICON + "</i>" + (nD == null ? "–" : nD) + "</b><span>war sign-ups</span></div>"
        + "<div class='stat'><b>" + untilReset() + "</b><span>until reset</span></div></div>";
      html += famEtaHtml(s, last.fam) + boostHtml(s) + remindHtml(s, list, su);
      html += "<div class='msrow'><input type='search' class='msearch' data-msearch placeholder='Search members…' value='" + esc(memberQuery) + "' autocomplete='off'><span class='seg'>"
        + Object.keys(SORTS).map(function (k) { return "<button type='button' data-sort='" + k + "' class='" + (k === sortBy ? "on" : "") + "'>" + SORTS[k] + "</button>"; }).join("") + "</span></div>";
      var flags = {};
      list.forEach(function (m) { flags[m.id] = memberFlags(s, m, su); });
      html += filterHtml(s, list, flags, su);
      var key = sortBy === "levels" ? function (m) { return m.levels || 0; } : function (m) { return m[sortBy]; };
      list.sort(function (a, b) { return key(b) - key(a) || b.today - a.today || b.level - a.level; });
      var th = function (k, label, tip) { return "<th" + (k === sortBy ? " class='on'" : "") + (tip ? " title='" + tip + "'" : "") + ">" + label + "</th>"; };
      html += "<table class='mem'><thead><tr><th>#</th><th>Member</th><th></th>" + th("today", "Today") + th("yesterday", "Yday") + "<th>Level</th>"
        + th("levels", "+Lv", "Levels gained today") + "</tr></thead><tbody>";
      var mid = dayStart(Date.now()), att = trendId ? attendance(s, list) : null, shown = 0;
      list.forEach(function (m, i) {
        var nm = esc(m.name.toLowerCase()), attrs = "data-name='" + nm + "' data-f='" + flags[m.id] + "'" + (rowShown(m.name.toLowerCase(), flags[m.id]) ? "" : " style='display:none'"), open = trendId === m.id;
        if (rowShown(m.name.toLowerCase(), flags[m.id])) { shown++; }
        html += "<tr data-mid='" + esc(m.id) + "' " + attrs + (open ? " class='open'" : "") + " title='Click for the 14-day trend'><td>" + (i + 1) + "</td><td class='nm'><span class='dot" + (m.online ? " on" : "") + "' title='" + (m.online ? "Online" : "Offline") + "'></span>" + specIcon(m.spec)
          + (/^\d+$/.test(m.id) ? "<a class='who' href='/game/player/" + m.id + "' title='Open profile'>" + esc(m.name) + "</a>" : esc(m.name))
          + "</td><td class='tg'>" + memberTags(s, m, mid, su) + "</td>"
          + "<td class='" + apClass(m.today) + "'>" + m.today + "</td><td class='" + apClass(m.yesterday) + "'>" + m.yesterday + "</td><td>" + m.level + "</td>"
          + "<td class='" + (m.levels > 0 ? "up" : "") + "'>" + (m.levels == null ? "" : m.levels > 0 ? "+" + m.levels : "–") + "</td></tr>";
        if (open) { html += "<tr class='trend' " + attrs + "><td colspan='7'>" + trendHtml(s, m, mid, att) + "</td></tr>"; }
      });
      html += "</tbody></table><div class='nomatch'" + (shown ? " style='display:none'" : "") + ">No members match.</div>";
      // Say where "+Lv" starts counting when it isn't the reset itself (times shown in local time, like the reset).
      if (start && s.day.from < mid - 30 * 60000) { html += "<div class='st'>+Lv counts from " + clock(s.day.from) + ", the last time the family list was seen before the " + clock(mid) + " reset.</div>"; }
      else if (start && s.day.from > mid + 30 * 60000) { html += "<div class='st'>+Lv counts from " + clock(s.day.from) + ", when the family list was first opened after the " + clock(mid) + " reset.</div>"; }
    }
    var ws = warStatus(s);
    html += "<div class='st " + st[0] + "'>" + st[1] + "</div><div class='st " + ws[0] + "'>" + ws[1] + "</div>"
      + (lvError ? "<div class='st bad'>Couldn't post a level milestone: " + esc(lvError) + ". Trying again in a few minutes.</div>" : "")
      + (apError ? "<div class='st bad'>Couldn't post an activity shout-out: " + esc(apError) + ". Trying again in a few minutes.</div>" : "")
      + Object.keys(fails).map(function (k) {
        return "<div class='st bad'>Couldn't post " + ({ streak: "a streak shout-out", famlv: "the family level-up", month: "the monthly awards", alerts: "a family alert", planner: "the war planner", recruits: "the recruit list", boost: "a boost reminder", boostfam: "the boost news", debrief: "the war debrief", attendance: "the war attendance", evening: "the evening reminder", recruitalert: "the new-recruit alert", ranks: "the rank suggestions", record: "the new-record shout-out", version: "the update notes", autoattack: "an auto-attack note", gamecheck: "the game update alarm", poster: "the Most Wanted poster", overtake: "an honor rank post", rush: "the level-rush shout-out", donation: "a donation shout-out", autoboost: "an auto-renew note" }[k] || k)
          + ": " + esc(fails[k]) + ". Trying again in a few minutes.</div>";
      }).join("")
      + (s.webhook && s.gameCheck && Object.keys(s.gameCheck.broken || {}).length ? "<div class='st bad'>🚨 Not working since a game update: " + esc(Object.keys(s.gameCheck.broken).join(", ")) + ".</div>" : "")
      + (s.boardHook ? "<div class='st " + (boardError ? "bad" : "ok") + "'>" + (boardError ? "Couldn't update the leaderboard: " + esc(boardError) + "."
        : "🏆 Leaderboard " + (s.boardAt ? "updated " + clock(s.boardAt) : "goes up in a moment") + ".") + "</div>" : "")
      + "<div class='row'>"
      + (s.webhook && last ? "<button type='button' data-send" + (sending ? " disabled" : "") + ">" + (s.sentDay === dayKey(dayStart(Date.now()) - 1) ? "Send report again" : "Send report now") + "</button>" : "")
      + "<button type='button' data-setup>" + (showSetup ? "Hide Discord settings" : "Discord settings") + "</button>"
      + "<button type='button' data-extras>" + (showExtras ? "Hide extras" : "✨ Extras") + "</button></div>"
      + (showExtras ? extrasHtml(s) : "");
    if (showSetup) {
      html += "<div class='setup'>Only one leader needs these. Each Discord channel gets its own webhook: open the channel's settings (gear icon) → <b>Integrations</b> → <b>Webhooks</b> → <b>New Webhook</b> → <b>Copy Webhook URL</b>, and paste it below."
        + "<div class='row'><button type='button' data-backup>Download backup</button><button type='button' data-restore>Restore backup</button></div>"
        + backupHtml(s)
        + (s.webhook && s.gameCheck ? "<div style='font-size:11.5px;color:var(--muted);margin-top:4px'>🔧 Game update check, " + clock(s.gameCheck.at) + ": " + (Object.keys(s.gameCheck.broken || {}).length ? "some tools aren't working, see above." : "all tools found.") + "</div>" : "")
        + "<div style='font-size:11.5px;color:var(--muted);margin-top:4px'>The backup holds the webhooks, Discord links and history. Keep it private: anyone with it can post in your channels.</div>"
        + hookBlock("report", "Leadership chat: daily report, weekly summary (Mondays), join / leave / inactive alerts", s.webhook, s.webhook ? "<button type='button' data-weekly" + (sending ? " disabled" : "") + ">Send weekly summary</button>" : "")
        + hookBlock("board", "Leaderboard (one message, kept up to date, with family level)", s.boardHook, "")
        + hookBlock("level", "Family chat: level milestones, 500 / 1,000 shout-outs, 100+ streaks, donations of 500+ gold, family level-ups, monthly awards", s.lvHook,
          (last ? "<button type='button' data-links>Link members to Discord (" + members(last.fam).filter(function (m) { return s.links && s.links[m.id]; }).length + "/" + last.fam.members.length + ")</button>" : "")
          + (s.lvHook && last ? "<button type='button' data-awards>Send awards so far</button>" : "")
          + (s.lvHook ? "<button type='button' data-overtoggle title='A new family #1, someone passing 3 or more members at once, or a first time in the top 100, 50, 25, 10 or 3 of the whole game. Without pings, and besides a new #1 at most 3 a day.'>Honor rank posts: " + (s.overtakes === false ? "off" : "on") + "</button>" : ""))
        + (showLinks && last ? linkBlock(s) : "")
        + hookBlock("war", "War alerts", s.warHook, "")
        + (s.warHook ? "<div style='margin-top:10px'><b>Role to ping</b> on new wars and reminders (leave empty for no ping)"
          + "<div style='font-size:11.5px;color:var(--muted)'>In Discord, type <b>\\@family</b> in any channel and send it. It shows as &lt;@&amp;123…&gt;; copy that and paste it here.</div>"
          + "<input type='text' data-role placeholder='&lt;@&amp;123456789012345678&gt;' value='" + esc(s.warRole ? "<@&" + s.warRole + ">" : "") + "' spellcheck='false' autocomplete='off'>"
          + "<div class='row' style='margin-top:0'><button type='button' class='go' data-saverole>Save role</button>"
          + (s.warRole ? "<button type='button' data-testrole>Send test ping</button>" : "") + "</div></div>" : "")
        + "<div style='margin-top:10px'><b>Auto-renew boosts</b>: when a boost runs out, buy +" + AUTO_PCT + "% for 7 days with family gold"
        + "<div style='font-size:11.5px;color:var(--muted)'>Only while the game is open on this PC, and only for Godfathers and Counselors. Switch it on on one PC only."
        + (s.webhook ? " Each purchase is posted to the leadership chat." : "") + "</div>"
        + "<div class='row' style='margin-top:4px'>" + Object.keys(BOOSTS).map(function (k) {
          var on = s.autoBoost && s.autoBoost[k];
          return "<button type='button' data-autoboost='" + k + "' class='" + (on ? "go" : "") + "'>" + BOOSTS[k] + ": " + (on ? "on" : "off") + "</button>";
        }).join("") + "</div></div>"
        + "</div>";
    }
    if (backupState === "prompt" && folder) { html += "<div class='st wait'>💾 Today's backup is waiting: the browser wants your OK for the backup folder. <button type='button' data-allowfolder>Allow</button></div>"; }
    html += "<div class='ver'>Activity v" + VERSION + " · day resets 00:00 UTC</div>";
    box.innerHTML = html;
    place(); tipTitles();
  }
  function redraw() { lastKey = ""; tick(); }

  // The panel redraws whenever a number changes (every few seconds in a busy family), and that cancels the browser's own
  // tooltips before they appear. So titles become data-tip and show in our own tooltip, which outlives the redraws.
  var tipBox = null, tipX = -1, tipY = -1, tipEl = null, tipTimer = 0, TIP_DELAY = 350;
  function tipTitles() {
    [].forEach.call(box.querySelectorAll("[title]"), function (el) { el.setAttribute("data-tip", el.getAttribute("title")); el.removeAttribute("title"); });
    showTip();
  }
  function showTip() {
    var hit = tipX < 0 || drag ? null : document.elementFromPoint(tipX, tipY), el = hit && hit.closest ? hit.closest("[data-tip]") : null;
    if (el && !(box && box.contains(el))) { el = null; }
    var text = el && el.getAttribute("data-tip");
    if (!text) { tipEl = null; clearTimeout(tipTimer); if (tipBox) { tipBox.style.display = "none"; } return; }
    var same = tipEl === text; // same tooltip after a redraw: keep it up without waiting again
    tipEl = text;
    if (!same || !tipBox || tipBox.style.display === "none") {
      clearTimeout(tipTimer);
      if (!same && tipBox) { tipBox.style.display = "none"; }
      tipTimer = setTimeout(function () { if (tipEl === text) { placeTip(text); } }, same ? 0 : TIP_DELAY);
      return;
    }
    placeTip(text);
  }
  function placeTip(text) {
    if (!tipBox || !document.body.contains(tipBox)) {
      tipBox = document.createElement("div");
      tipBox.setAttribute("data-syn-tip", "");
      tipBox.style.cssText = "position:fixed;z-index:2147483647;pointer-events:none;max-width:280px;padding:6px 9px;border-radius:6px;background:rgba(12,8,10,.95);color:#f4e7ea;"
        + "border:1px solid rgba(255,255,255,.18);font:12px/1.4 system-ui,sans-serif;white-space:pre-line;box-shadow:0 6px 18px rgba(0,0,0,.5)";
      document.body.appendChild(tipBox);
    }
    tipBox.textContent = text;
    tipBox.style.display = "block";
    var w = tipBox.offsetWidth, h = tipBox.offsetHeight;
    var x = Math.max(8, Math.min(tipX + 12, window.innerWidth - w - 8)), y = tipY + 20 + h > window.innerHeight - 8 ? tipY - h - 10 : tipY + 20;
    tipBox.style.left = x + "px"; tipBox.style.top = Math.max(8, y) + "px";
  }
  // War planner view: our strength, then every family within ±10 ranks, best targets first; families under attack at the bottom.
  // While an attack is planned: queue this family as the next one. Shows when that would be if it's later than the end of our battle.
  function queueButton(t, ourEnd) {
    var at = Math.max(ourEnd, t.freeAt || 0);
    return (at > ourEnd ? " <span class='free'>⏭ from " + clock(at) + "</span>" : "") + " <button type='button' class='inv' data-arm='" + esc(t.id) + "' title='Declare war on them automatically at " + clock(at) + (at > ourEnd ? ", once their own battle is over" : ", right after our battle") + "'>⏭ Attack next</button>";
  }
  function plannerHtml(s) {
    var sc = s.scan, us = summary(last.fam), h = "";
    h += "<div class='stats' style='grid-template-columns:repeat(3,1fr)'>"
      + "<div class='stat'><b>" + us.strength.toLocaleString("en-US") + "</b><span>our strength</span></div>"
      + "<div class='stat'><b>" + us.avg + "</b><span>avg member level</span></div>"
      + "<div class='stat'><b>" + (sc ? "#" + sc.own : "–") + "</b><span>our rank" + (sc ? " (can attack " + Math.max(1, sc.own - WINDOW) + "–" + (sc.own + WINDOW) + ")" : "") + "</span></div></div>";
    var ours = warsOf(last.fam).filter(function (w) { return w.status === "preparing" && w.attackerId === last.fam.id; });
    if (ours.length) { h += "<div class='st wait'>We already have an attack planned on " + esc(nameOf(ours[0].defender)) + (startOf(ours[0]) > Date.now() ? ": battle " + inTime(startOf(ours[0])) : "") + ". " + (s.autoAttack ? "" : canDeclare(last.fam.private) ? "You can queue the next attack below, for right after that battle." : "") + "</div>"; }
    var armed = s.autoAttack, mayDeclare = canDeclare(last.fam.private);
    if (scanning && scanning.running) { h += "<div class='st wait'>" + esc(scanning.step) + "</div>"; }
    else if (scanning && scanning.error) { h += "<div class='st bad'>Scan failed: " + esc(scanning.error) + ".</div>"; }
    // Buttons above the list, so nothing needs scrolling down.
    h += "<div class='row'><button type='button' class='go' data-scan" + (scanning && scanning.running ? " disabled" : "") + ">" + (sc ? "Scan again" : "Scan targets") + "</button>"
      + (sc && s.webhook ? "<button type='button' data-postplan>Post to leadership chat</button>" : "")
      + (sc ? "<span class='idle'>Scanned " + clock(sc.at) + (Date.now() - sc.at > 3600000 ? " (over an hour ago, scan again before deciding)" : "") + "</span>" : "") + "</div>";
    if (sc) {
      var v = planView(s), all = targets(s), ready = all.filter(function (t) { return !t.busy; }).length, rows = plannerRows(s);
      h += "<div class='row filters'><span class='seg'>" + [["all", "All", all.length], ["ready", "Ready", ready], ["busy", "Not ready", all.length - ready]].map(function (o) {
        return "<button type='button' data-pshow='" + o[0] + "' class='" + (v.show === o[0] ? "on" : "") + "'>" + o[1] + " (" + o[2] + ")</button>";
      }).join("") + "</span><span class='seg'>" + [["best", "Best target"], ["win", "Win %"], ["free", "Free soonest"]].map(function (o) {
        return "<button type='button' data-psort='" + o[0] + "' class='" + (v.sort === o[0] ? "on" : "") + "'>" + o[1] + "</button>";
      }).join("") + "</span></div>";
      h += radarHtml(s, all);
      h += "<table><thead><tr><th>#</th><th>Family</th><th>Lv</th><th title='Members'>Mem</th><th title='Average member level'>Avg</th><th title='Average level of their top 5'>Top 5</th><th>Honor</th>"
        + "<th title='Win chance. A rough guess from levels until " + LEARN_MIN + " of our wars are logged, then learned from our results.'>Win %</th></tr></thead><tbody>";
      if (!rows.length) { h += "<tr><td colspan='8' style='text-align:center'>No families " + (v.show === "ready" ? "ready to attack right now." : v.show === "busy" ? "under attack right now." : "found in our window.") + "</td></tr>"; }
      rows.forEach(function (t) {
        var c = t.ratio ? chance(s, t.ratio) : null, r = t.ratio ? rating(t.ratio, c) : ["⚪", "?"];
        var by = (t.attackedBy || []).join(", "), on = (t.attackingOn || []).join(", ");
        var byText = by && by !== "?" ? " by " + esc(by) : "";
        h += "<tr" + (t.busy ? " class='off'" : "") + "><td>" + t.rank + "</td><td><span>" + esc(t.name) + "</span>"
          + (t.busy ? " <span class='idle' title='Already under attack" + byText + ": it can&#39;t be attacked until that battle is fought'>under attack" + byText + "</span>"
            + (t.freeAt ? " <span class='free'>⏳ free " + inTime(t.freeAt) + "</span>" : "")
            : t.attacked ? " <span class='free now'>✅ free since " + clock(t.freeAt) + "</span>"
            : t.attacking ? " <span class='idle'>attacking" + (on && on !== "?" ? " " + esc(on) : "") + "</span>" : "")
          + (!mayDeclare ? "" : armed && String(armed.id) === String(t.id) ? " <span class='free'>⏰ armed</span>"
            : armed ? "" // one armed or queued attack at a time
            : ours.length ? queueButton(t, startOf(ours[0]))
            : t.busy ? " <button type='button' class='inv' data-arm='" + esc(t.id) + "' title='Declare war on them automatically as soon as they can be attacked'>⏰ Attack when free</button>"
            : " <button type='button' class='inv' data-attacknow='" + esc(t.id) + "'>⚔️ Attack now</button>") + "</td>"
          + "<td>" + (t.level || "?") + "</td><td>" + (t.members || "?") + "</td><td>" + (t.sum ? t.sum.avg : "?") + "</td><td>" + (t.sum ? t.sum.top5 : "?") + "</td>"
          + "<td>" + (t.honor || 0).toLocaleString("en-US") + "</td><td title='Their strength " + (t.sum ? t.sum.strength.toLocaleString("en-US") : "?") + (t.ratio ? ", we are " + t.ratio.toFixed(2) + "× as strong" : "") + "'>" + r[0] + " "
          + (c != null ? (learned(s) ? "" : "~") + c + "%" : "?") + "</td></tr>";
      });
      h += "</tbody></table><div class='st'>"
        + "🟢 65%+ · 🟡 40–65% · 🔴 under 40%. "
        + "Strength counts every member by level, since who registers isn't known. "
        + ((s.warLog || []).length >= LEARN_MIN ? "Percentages are learned from our last " + s.warLog.length + " wars." : "~ = rough guess from levels (1.3× stronger ≈ 63%, 2× ≈ 80%) until " + LEARN_MIN + " of our wars are logged (" + (s.warLog || []).length + " so far), then learned from our results.") + "</div>";
    } else if (!scanning) {
      h += "<div class='st'>Scan the families ranked up to " + WINDOW + " places above and below us to see who we can attack and how strong they are. It loads about 20 family pages, one after another (takes ~20 seconds).</div>";
    }
    return h;
  }
  // One field per member for their Discord account, so milestone posts can ping them.
  function linkBlock(s) {
    var list = members(last.fam).sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });
    return "<div class='links'><div style='font-size:11.5px;color:var(--muted);margin-bottom:6px'>For each member, in Discord type <b>\\@</b> and their Discord name, then send it."
      + " Discord shows it as &lt;@123…&gt;. Copy that and paste it next to their game name. Leave empty for no ping.</div>"
      + list.map(function (m) {
        var uid = s.links && s.links[m.id];
        return "<div class='lk'><span>" + esc(m.name) + "</span><input type='text' data-link='" + esc(m.id) + "' data-name='" + esc(m.name) + "' placeholder='&lt;@123456789012345678&gt;' value='"
          + (uid ? "&lt;@" + uid + "&gt;" : "") + "' spellcheck='false' autocomplete='off'>"
          + (uid ? "<button type='button' data-testlink='" + esc(m.id) + "' title='Post a test milestone that pings this person'>Test</button>" : "<span></span>") + "</div>";
      }).join("")
      + "<div class='row'><button type='button' class='go' data-savelinks>Save links</button><button type='button' data-links>Cancel</button></div></div>";
  }
  function hookBlock(kind, title, url, extra) {
    return "<div style='margin-top:10px'><b>" + title + "</b>"
      + "<input type='text' data-hook='" + kind + "' placeholder='https://discord.com/api/webhooks/…' value='" + esc(url || "") + "' spellcheck='false' autocomplete='off'>"
      + "<div class='row' style='margin-top:0'><button type='button' class='go' data-save='" + kind + "'>Save</button>"
      + (url ? "<button type='button' data-test='" + kind + "'>Send test</button><button type='button' data-forget='" + kind + "'>Disconnect</button>" : "") + extra + "</div></div>";
  }
  function span(ms) {
    var m = Math.max(0, Math.round(ms / 60000));
    return (m >= 60 ? Math.floor(m / 60) + "h " : "") + (m % 60) + "m";
  }
  function warStatus(s) {
    if (!s.warHook) { return ["", "War alerts are off on this PC."]; }
    if (warError) { return ["bad", "Couldn't post a war alert: " + esc(warError) + ". Trying again in a few minutes."]; }
    var n = nextWar();
    if (!n) { return ["ok", "⚔️ War alerts on · no battle scheduled."]; }
    return ["ok", "⚔️ War alerts on · next battle: " + (n.side.attack ? "our attack on " : "defense against ") + esc(nameOf(n.side.attack ? n.w.defender : n.w.attacker))
      + " in " + span(startOf(n.w) - Date.now()) + "."];
  }

  // Drag the panel by its top row. The spot is remembered; double-click the top row to send it back to the corner.
  var drag = null, pos = load().pos || null, SNAP = 40, DRAG_MIN = 5, posChecked = false;
  // Docking: every part of the game is sized in vh and centred, with a stage of 132.8vh wide. When the side space fits the
  // panel, it fills the right edge at full height and the game's root gets narrower, so the game re-centres beside it.
  // The transform makes the game's own fixed elements (and its toasts) follow its narrower root. Too little room: the panel floats.
  var STAGE_VH = 1.328, DOCK_MIN = 380, DOCK_MAX = 520, COMPACT = 420, MIN_BAR = 190, dockStyle = null, dockNow = 0;
  // Only the game's own root is narrowed, marked here: other things added to the page (the Mission Reader, extensions) keep their
  // size. It's the tallest top-level block without an id.
  function markGameRoot() {
    var cur = document.querySelector("body > [data-syn-root]");
    if (cur) { return; }
    var all = [].slice.call(document.querySelectorAll("body > div:not([id]):not([data-portal]):not([data-syn-tip])"));
    all.sort(function (a, b) { return b.offsetHeight - a.offsetHeight; });
    if (all[0]) { all[0].setAttribute("data-syn-root", ""); }
  }
  var readerStyle = null;
  function setDock(w) {
    if (w) { markGameRoot(); }
    // The Mission Reader bookmark's own panel would only cover the game: Personal shows the same thing while this panel is open.
    if (!readerStyle) { readerStyle = document.createElement("style"); document.head.appendChild(readerStyle); }
    var hide = box ? "#mr-reader-panel{display:none!important}" : "";
    if (readerStyle.textContent !== hide) { readerStyle.textContent = hide; }
    if (w === dockNow) { return; }
    dockNow = w;
    if (!dockStyle) { dockStyle = document.createElement("style"); document.head.appendChild(dockStyle); }
    dockStyle.textContent = !w ? "" : "body > [data-syn-root]{width:calc(100% - " + w + "px)!important;transform:translateX(0)}"
      + ".mantine-Modal-inner{width:calc(100% - " + w + "px)!important;padding-inline:0!important}"; // its side padding is 5% of the whole window, which pushed wide dialogs under the panel
  }
  function wouldDock() { return !pos && window.innerWidth - window.innerHeight * STAGE_VH >= DOCK_MIN; }
  function place() {
    if (!box) { setDock(0); return; }
    var W = window.innerWidth, free = W - window.innerHeight * STAGE_VH, min = box.classList.contains("min");
    // A spot saved at the right edge (older versions also saved one on a plain click) counts as docked.
    if (pos && !posChecked && !min && !drag) {
      posChecked = true; box.style.width = "";
      if (pos.x + box.offsetWidth >= W - SNAP) { pos = null; savePos(); }
    }
    var dock = !pos && !min && free >= DOCK_MIN ? Math.min(Math.floor(free), DOCK_MAX) : 0;
    setDock(dock);
    box.classList.toggle("dock", !!dock);
    box.style.width = dock ? dock + "px" : "";
    box.style.maxWidth = min && !pos && free / 2 - 18 >= MIN_BAR ? Math.floor(free / 2) - 18 + "px" : ""; // in the game's side space when it fits
    box.classList.toggle("compact", !min && box.offsetWidth < COMPACT);
    if (!pos) { box.style.left = ""; box.style.top = ""; box.style.right = ""; return; }
    var x = Math.min(Math.max(0, pos.x), Math.max(0, window.innerWidth - box.offsetWidth));
    var y = Math.min(Math.max(0, pos.y), Math.max(0, window.innerHeight - box.offsetHeight));
    box.style.left = x + "px"; box.style.top = y + "px"; box.style.right = "auto";
  }
  function savePos() { var s = load(); s.pos = pos; save(s); }
  function onDown(ev) {
    if (ev.button !== 0 || !ev.target.closest(".top") || ev.target.closest("button")) { return; }
    var rect = box.getBoundingClientRect();
    drag = { dx: ev.clientX - rect.left, dy: ev.clientY - rect.top, sx: ev.clientX, sy: ev.clientY, moved: false };
    box.setPointerCapture(ev.pointerId);
    box.classList.add("dragging");
    ev.preventDefault();
  }
  function onMove(ev) {
    if (!drag) { return; }
    if (!drag.moved && Math.abs(ev.clientX - drag.sx) + Math.abs(ev.clientY - drag.sy) < DRAG_MIN) { return; } // a plain click on the top row is not a drag
    drag.moved = true;
    pos = { x: ev.clientX - drag.dx, y: ev.clientY - drag.dy };
    place();
  }
  function onUp() {
    if (!drag) { return; }
    var moved = drag.moved;
    drag = null;
    box.classList.remove("dragging");
    if (!moved) { return; }
    var rect = box.getBoundingClientRect();
    // Dropped on the right edge: snap back to the dock.
    pos = rect.right >= window.innerWidth - SNAP ? null : { x: Math.round(rect.left), y: Math.round(rect.top) };
    savePos(); place();
  }
  function onDbl(ev) {
    if (!ev.target.closest(".top") || ev.target.closest("button")) { return; }
    pos = null; savePos(); place();
  }

  // The recruit level filters are number fields; they're saved when the field changes (Enter, or clicking elsewhere).
  // Live updates that mustn't wait for a redraw: the volume while dragging, the member search while typing.
  function onInput(ev) {
    var t = ev.target;
    if (t.hasAttribute("data-volslider")) {
      setVolume(+t.value);
      var vv = box.querySelector(".vv"); if (vv) { vv.textContent = volume ? volume + "%" : "Off"; }
      return;
    }
    if (t.hasAttribute("data-fxvol")) { if (fxMaster) { fxMaster.gain.value = fxGain(+t.value); } return; }
    if (t.hasAttribute("data-msearch")) { memberQuery = t.value; applyMemberFilter(); }
  }
  function onChange(ev) {
    var t = ev.target, k = t && t.getAttribute && t.getAttribute("data-rf");
    if (t && t.hasAttribute && t.hasAttribute("data-volslider")) { var sv = load(); sv.volume = +t.value; save(sv); setVolume(sv.volume); t.blur(); redraw(); return; }
    if (t && t.hasAttribute && t.hasAttribute("data-fxvol")) { var sf = load(); sf.fxVol = +t.value; save(sf); if (fxMaster) { fxMaster.gain.value = fxGain(sf.fxVol); } t.blur(); fxSound("ping", true); return; }
    if (t && t.hasAttribute && t.hasAttribute("data-voicecall")) { var sc = load(); sc.voiceCall = t.value.trim(); save(sc); t.blur(); speakNice(say("vGreet", { part: "evening", name: spokenName(fxMe().name) }), true); redraw(); return; }
    if (t && t.hasAttribute && t.hasAttribute("data-voicepick")) { var sp = load(); sp.voiceName = t.value; save(sp); speak(say("vGreet", { part: "evening", name: spokenName(fxMe().name) }), true); return; }
    if (t && t.hasAttribute && t.hasAttribute("data-voicevol")) { var sq = load(); sq.voiceVol = +t.value; save(sq); t.blur(); speakNice("Volume set.", true); return; }
    if (t && t.hasAttribute && t.hasAttribute("data-elkey")) { var se = load(), pasted = t.value.trim(); t.value = ""; t.blur(); if (pasted) { se.elKey = pasted; save(se); elPausedUntil = 0; elListNote = ""; elListTried = true; elSetNote(""); elLoadVoices(); redraw(); } return; }
    if (t && t.hasAttribute && t.hasAttribute("data-elvoice")) { var sw = load(); sw.elVoice = t.value; save(sw); elPausedUntil = 0; elSetNote(""); elPreview(t.value); return; }
    if (t && t.hasAttribute && t.hasAttribute("data-elcap")) { var sl = load(); sl.elCap = Math.max(0, parseInt(t.value, 10) || 0); save(sl); t.blur(); redraw(); return; }
    if (t && t.hasAttribute && t.hasAttribute("data-ra")) { var s0 = load(); s0.recruitAlertMin = Math.max(0, parseInt(t.value, 10) || 0); save(s0); t.blur(); redraw(); return; }
    if (t && t.hasAttribute && t.hasAttribute("data-rmsg")) { var sm = load(), txt = t.value.trim(); if (txt && txt !== RMSG_DEFAULT) { sm.recruitMsg = txt; } else { delete sm.recruitMsg; } save(sm); t.blur(); redraw(); return; }
    if (t && t.hasAttribute && t.hasAttribute("data-rdisc")) { var sd = load(), link = t.value.trim(); if (link) { sd.recruitDiscord = link; } else { delete sd.recruitDiscord; } save(sd); t.blur(); redraw(); return; }
    if (!k) { return; }
    var s = load(), rf = recruitFilter(s);
    rf[k] = Math.max(0, parseInt(t.value, 10) || 0);
    s.recruitFilter = rf; save(s); t.blur(); redraw();
  }
  function onClick(ev) {
    var a = ev.target.closest("a[href^='/game/']");
    if (a && !ev.ctrlKey && !ev.metaKey && !ev.shiftKey && ev.button === 0) { ev.preventDefault(); gameNavigate(a.getAttribute("href")); return; }
    var t = ev.target.closest("button"), s = load();
    if (!t) {
      var row = !a && ev.target.closest("tr[data-mid]");
      if (row) { var mid = row.getAttribute("data-mid"); trendId = trendId === mid ? "" : mid; redraw(); }
      return;
    }
    if (t.hasAttribute("data-close")) { closed = true; if (box) { box.remove(); box = null; } setDock(0); tipX = -1; showTip(); return; }
    if (t.hasAttribute("data-mfilter")) { memberFilter = t.getAttribute("data-mfilter"); redraw(); return; }
    if (t.hasAttribute("data-buyboost")) { buyBoost(t.getAttribute("data-buyboost")); return; }
    if (t.hasAttribute("data-min")) { s.min = !s.min; save(s); redraw(); return; }
    if (t.hasAttribute("data-vol")) { showVol = !showVol; redraw(); return; }
    if (t.hasAttribute("data-area")) { area = t.getAttribute("data-area"); redraw(); return; }
    if (t.hasAttribute("data-mqmode")) { setMqMode(t.getAttribute("data-mqmode")); redraw(); return; }
    if (t.hasAttribute("data-ptab")) { personalTab = t.getAttribute("data-ptab"); redraw(); return; }
    if (t.hasAttribute("data-duelrange")) { duelRange = +t.getAttribute("data-duelrange"); redraw(); return; }
    if (t.hasAttribute("data-duelscan")) { runDuelScan(); return; }
    if (t.hasAttribute("data-duelfilter")) { duelFilter = +t.getAttribute("data-duelfilter"); redraw(); return; }
    if (t.hasAttribute("data-duelsort")) { duelSort = t.getAttribute("data-duelsort"); redraw(); return; }
    if (t.hasAttribute("data-gangscan")) { runGangScan(); return; }
    if (t.hasAttribute("data-duellearn")) { runDuelLearn(); return; }
    if (t.hasAttribute("data-dueladvice")) { runDuelAdvice(); return; }
    if (t.hasAttribute("data-away")) { setAway(t.getAttribute("data-away")); return; }
    if (t.hasAttribute("data-remind")) { sendRemind(); return; }
    if (t.hasAttribute("data-sort")) { s.sort = t.getAttribute("data-sort"); save(s); redraw(); return; }
    if (t.hasAttribute("data-setup")) { showSetup = !showSetup; redraw(); return; }
    if (t.hasAttribute("data-send")) { send(true); return; }
    // Settings buttons name which webhook they're for: "report" (s.webhook) or "war" (s.warHook).
    var kind = t.getAttribute("data-save") || t.getAttribute("data-test") || t.getAttribute("data-forget");
    var field = kind === "war" ? "warHook" : kind === "board" ? "boardHook" : kind === "level" ? "lvHook" : "webhook";
    if (t.hasAttribute("data-weekly")) { sendWeekly(true); return; }
    if (t.hasAttribute("data-awards")) { sendAwards(true); return; }
    if (t.hasAttribute("data-autoboost")) {
      var ab = t.getAttribute("data-autoboost");
      s.autoBoost = s.autoBoost || {};
      if (!s.autoBoost[ab] && !confirm("Renew the " + BOOSTS[ab] + " boost automatically?\n\nWhen it runs out, +" + AUTO_PCT + "% for 7 days is bought with family gold (at the game's current price) while the game is open on this PC. If it has already run out, it is bought right away.")) { return; }
      s.autoBoost[ab] = !s.autoBoost[ab]; save(s); redraw(); return;
    }
    if (t.hasAttribute("data-backup")) { downloadBackup(); return; }
    if (t.hasAttribute("data-pickfolder")) { chooseFolder(); return; }
    if (t.hasAttribute("data-allowfolder")) { allowFolder(); return; }
    if (t.hasAttribute("data-backupnow")) {
      if (backupState === "granted") { writeBackup().then(function () { redraw(); if (backupState === "granted") { alert("Backup saved."); } }); } else { allowFolder(); }
      return;
    }
    if (t.hasAttribute("data-restore")) { restoreBackup(); return; }
    if (t.hasAttribute("data-links")) { showLinks = !showLinks; redraw(); return; }
    if (t.hasAttribute("data-home")) { showPlanner = showRecruits = showRanks = false; redraw(); return; }
    if (t.hasAttribute("data-planner")) { showPlanner = true; showRecruits = showRanks = false; redraw(); return; }
    if (t.hasAttribute("data-recruits")) { showRecruits = true; showPlanner = showRanks = false; redraw(); return; }
    if (t.hasAttribute("data-ranks")) { showRanks = true; showPlanner = showRecruits = false; redraw(); return; }
    if (t.hasAttribute("data-weakall")) { weakAll = !weakAll; redraw(); return; }
    if (t.hasAttribute("data-postranks")) { postRanks().then(function () { if (!fails.ranks) { alert("Posted to the leadership chat."); } }); return; }
    if (t.hasAttribute("data-arm")) { armAttack(t.getAttribute("data-arm"), false); return; }
    if (t.hasAttribute("data-attacknow")) { armAttack(t.getAttribute("data-attacknow"), true); return; }
    if (t.hasAttribute("data-disarm")) { if (confirm("Cancel the automatic attack?")) { disarmAttack(); } return; }
    if (t.hasAttribute("data-pshow") || t.hasAttribute("data-psort")) {
      var pv = planView(s);
      if (t.hasAttribute("data-pshow")) { pv.show = t.getAttribute("data-pshow"); } else { pv.sort = t.getAttribute("data-psort"); }
      s.planView = pv; save(s); redraw(); return;
    }
    if (t.hasAttribute("data-rinv")) { var ri = recruitFilter(s); ri.inv = t.getAttribute("data-rinv"); s.recruitFilter = ri; save(s); redraw(); return; }
    if (t.hasAttribute("data-rsort")) { var rs = recruitFilter(s); rs.sort = t.getAttribute("data-rsort"); s.recruitFilter = rs; save(s); redraw(); return; }
    if (t.hasAttribute("data-introtoggle")) { s.intro = s.intro === false; save(s); redraw(); return; }
    if (t.hasAttribute("data-extras")) { showExtras = !showExtras; redraw(); return; }
    if (t.hasAttribute("data-fx")) {
      var fk = t.getAttribute("data-fx"), flip = function () { var n = load(); n.fx = n.fx || {}; n.fx[fk] = !fxOn(n, fk); save(n); redraw(); };
      if (/^pop/.test(fk) && !fxOn(s, fk)) { askPopups(flip); } else { flip(); }
      return;
    }
    if (t.hasAttribute("data-fxtest")) { fxTest(t.getAttribute("data-fxtest")); return; }
    if (t.hasAttribute("data-elremove")) { delete s.elKey; delete s.elVoices; delete s.elVoice; save(s); elPausedUntil = 0; elListNote = ""; elListTried = false; elSetNote(""); redraw(); return; }
    if (t.hasAttribute("data-overtoggle")) { s.overtakes = s.overtakes === false; save(s); redraw(); return; }
    if (t.hasAttribute("data-ratoggle")) { s.recruitAlert = s.recruitAlert === false; save(s); redraw(); return; }
    if (t.hasAttribute("data-rscan")) { runRecruitScan(); return; }
    if (t.hasAttribute("data-spec")) {
      var rf = recruitFilter(s), k = t.getAttribute("data-spec"), on = rf.specs.indexOf(k) >= 0;
      rf.specs = on ? rf.specs.filter(function (x) { return x !== k; }) : rf.specs.concat([k]);
      if (!rf.specs.length) { rf.specs = Object.keys(SPECS); } // never filter everyone out
      s.recruitFilter = rf; save(s); redraw(); return;
    }
    if (t.hasAttribute("data-copy")) { var nm = t.getAttribute("data-copy"); copyText(nm); copied = nm; redraw(); setTimeout(function () { if (copied === nm) { copied = ""; redraw(); } }, 2000); return; }
    if (t.hasAttribute("data-invite")) { inviteOne(t.getAttribute("data-invite")); return; }
    if (t.hasAttribute("data-rmsgsend")) { messageOne(t.getAttribute("data-rmsgsend")); return; }
    if (t.hasAttribute("data-rmsgopen")) { rmsgOpen = !rmsgOpen; redraw(); return; }
    if (t.hasAttribute("data-rmsgtest")) { var to = box && box.querySelector("[data-rmsgto]"); messageTest(to && to.value); return; }
    if (t.hasAttribute("data-rmsgreset")) { delete s.recruitMsg; save(s); redraw(); return; }
    if (t.hasAttribute("data-inviteall")) { inviteAll(); return; }
    if (t.hasAttribute("data-invstop")) { if (inviteJob) { inviteJob.running = false; } redraw(); return; }
    if (t.hasAttribute("data-copyall")) { copyText(recruitList(s).map(function (p) { return p.name; }).join("\n")); alert("Copied " + recruitList(s).length + " names, one per line."); return; }
    if (t.hasAttribute("data-postrecruits")) { postRecruits().then(function () { if (!fails.recruits) { alert("Posted to the leadership chat."); } }); return; }
    if (t.hasAttribute("data-scan")) { runScan(); return; }
    if (t.hasAttribute("data-postplan")) {
      postPlanner().then(function () { if (!fails.planner) { alert("Posted to the leadership chat."); } });
      return;
    }
    if (t.hasAttribute("data-testlink")) {
      var member = last && members(last.fam).filter(function (m) { return m.id === t.getAttribute("data-testlink"); })[0];
      if (!member || !s.lvHook) { return; }
      var pinged = [], line = milestoneLine(s, member, Math.max(STEP, Math.floor(member.level / STEP) * STEP), pinged);
      sendNow(s.lvHook, { username: say("asFamily"), allowed_mentions: { parse: [], users: pinged },
        content: "🧪 **Test** (not real, just showing what the posts look like):\n" + line + "\n\n" + activityLine(s, member, 500, pinged) + "\n\n" + activityLine(s, member, 1000, pinged) + "\n\n" + say("rush3", { who: who(s, member, pinged), n: 3 }) })
        .then(function () { alert("Test sent. Check the family chat."); }, function (e) { alert("Couldn't send: " + (e && e.message || e)); });
      return;
    }
    if (t.hasAttribute("data-savelinks")) {
      var links = {}, bad = [];
      Array.prototype.forEach.call(box.querySelectorAll("[data-link]"), function (inp) {
        var raw = inp.value.trim(), id = (raw.match(/\d{15,22}/) || [])[0];
        if (id) { links[inp.getAttribute("data-link")] = id; } else if (raw) { bad.push(inp.getAttribute("data-name")); }
      });
      if (bad.length) { alert("These don't look like Discord users: " + bad.join(", ") + ". Paste what Discord shows after sending \\@theirname, like <@123456789012345678>."); return; }
      // Keep links of members who aren't in the list right now (they may come back).
      Object.keys(s.links || {}).forEach(function (k) { if (!box.querySelector("[data-link='" + k + "']")) { links[k] = s.links[k]; } });
      s.links = links; save(s); showLinks = false; redraw(); return;
    }
    if (t.hasAttribute("data-save")) {
      var url = box.querySelector("[data-hook='" + kind + "']").value.trim();
      if (!WEBHOOK.test(url)) { alert("That doesn't look like a Discord webhook URL. It starts with https://discord.com/api/webhooks/"); return; }
      s[field] = url; save(s);
      if (kind === "war") { warError = ""; warRetryAt = 0; } else { error = ""; retryAt = 0; }
      redraw(); return;
    }
    if (t.hasAttribute("data-test")) {
      sendNow(s[field], kind === "war"
        ? { username: "Syndicate Wars", content: "✅ War alerts connected. New wars, reminders and results will be posted in this channel." }
        : kind === "board" ? { username: "Syndicate Leaderboard", content: "✅ Leaderboard connected. It will appear in this channel and update itself." }
        : kind === "level" ? { username: "Syndicate Activity", content: "✅ Family chat connected. Level milestones (10, 20, 30, …), +3 levels in a day, 500 / 1,000 activity days and donations of 500+ gold will be celebrated here." }
        : { username: "Syndicate Activity", content: "✅ Activity reporter connected. The daily family activity report will be posted in this channel." })
        .then(function () { alert("Test message sent. Check your Discord channel."); }, function (e) { alert("Couldn't send: " + (e && e.message || e)); });
      return;
    }
    if (t.hasAttribute("data-forget")) {
      if (confirm("Disconnect this Discord channel? Its posts stop until you paste a webhook URL again.")) {
        delete s[field];
        if (kind === "board") { delete s.boardMsg; delete s.boardSig; delete s.boardAt; }
        if (kind === "level") { delete s.lvSeen; delete s.apHit; delete s.lvRush; }
        save(s); redraw();
      }
      return;
    }
    if (t.hasAttribute("data-saverole")) {
      var raw = box.querySelector("[data-role]").value.trim(), id = (raw.match(/\d{15,22}/) || [])[0];
      if (raw && !id) { alert("That doesn't look like a role. Paste what Discord shows after sending \\@family, like <@&123456789012345678>."); return; }
      if (id) { s.warRole = id; } else { delete s.warRole; }
      save(s); redraw(); return;
    }
    if (t.hasAttribute("data-testrole")) {
      sendNow(s.warHook, { username: "Syndicate Wars", content: "<@&" + s.warRole + "> 🔔 Test: war alerts will ping this role.", allowed_mentions: { parse: [], roles: [s.warRole] } })
        .then(function () { alert("Test ping sent. Check your Discord channel."); }, function (e) { alert("Couldn't send: " + (e && e.message || e)); });
    }
  }

  // ===== Extras: effects, sounds and the voice =====
  // Just for fun, each with a switch per PC in the panel's Extras (s.fx = {name: true or false}). The voice starts switched off, since a
  // talking panel shouldn't surprise anyone; the rest starts on. Nothing here posts to Discord except the Most Wanted poster.
  var FX_ON = { autojoin: false, popMission: false, popGang: false, sound: true, voice: false, voiceRemind: true, alert: true, warfx: true, fireworks: true, ticker: true, radar: true, poster: true };
  var showExtras = false, fxQueue = [], fxActive = null, fxStyleEl = null;
  function fxOn(s, k) { return s.fx && typeof s.fx[k] === "boolean" ? s.fx[k] : FX_ON[k]; }
  function fxStyle() {
    if (fxStyleEl) { return; }
    fxStyleEl = document.createElement("style"); fxStyleEl.textContent = FX_CSS; document.head.appendChild(fxStyleEl);
  }
  var FX_CSS = "#syn-fx{position:fixed;z-index:2147483647;overflow:hidden;cursor:pointer;color:#f2ede2;font:13px/1.4 system-ui,sans-serif;text-align:center;user-select:none;animation:synfIn .3s ease-out both}"
    + "#syn-fx *{box-sizing:border-box}#syn-fx.out{pointer-events:none;animation:synfOut .55s ease-in both}"
    + "#syn-fx .fcv{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}"
    + "#syn-fx .fin{position:absolute;inset:0;padding:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}"
    + "#syn-fx .fhint{position:absolute;left:0;right:0;bottom:8px;font:9.5px ui-monospace,Consolas,monospace;letter-spacing:.18em;color:rgba(255,255,255,.34)}"
    + "#syn-fx .fstamp{font:400 min(19vw,74px)/1 Impact,'Arial Black',sans-serif;letter-spacing:.03em;will-change:transform,opacity}"
    + "#syn-fx .fcrest{height:150px;will-change:transform,opacity}"
    + "#syn-fx .ffoe{font:600 13px/1.3 ui-monospace,Consolas,monospace;letter-spacing:.2em;text-transform:uppercase;animation:synfUp .5s ease-out .95s both}"
    + "#syn-fx .fquip{font:italic 14px/1.35 Georgia,serif;opacity:.86;animation:synfUp .5s ease-out 1.15s both}"
    + "#syn-fx .fnums{display:flex;gap:8px;width:100%;margin-top:4px;animation:synfUp .5s ease-out 1.35s both}"
    + "#syn-fx .fnum{flex:1;padding:8px 2px;border:1px solid rgba(255,255,255,.14);border-radius:6px;background:rgba(0,0,0,.28)}#syn-fx .fnum b{display:block;font:700 19px/1.15 ui-monospace,Consolas,monospace}#syn-fx .fnum span{font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;opacity:.7}"
    + "#syn-fx .fmvp{width:100%;padding:9px 10px;border-radius:6px;border:1px solid currentColor;background:rgba(0,0,0,.3);animation:synfUp .5s ease-out 1.6s both}#syn-fx .fmvp small{display:block;font-size:9.5px;letter-spacing:.2em;opacity:.8}#syn-fx .fmvp b{display:block;font-size:20px;line-height:1.25;color:#fff}#syn-fx .fmvp span{font-size:12px;opacity:.85}"
    + "#syn-fx .fyou,#syn-fx .frew{font-size:12px;opacity:.82;animation:synfUp .5s ease-out 1.85s both}"
    // Victory
    + "#syn-fx.win{background:radial-gradient(circle at 50% 34%,#6a4a10,#1c1305 58%,#090602)}#syn-fx.win .fmvp,#syn-fx.win .ffoe{color:#ffd66e}"
    + "#syn-fx .frays{position:absolute;left:50%;top:32%;width:190%;aspect-ratio:1;margin:-95% 0 0 -95%;background:repeating-conic-gradient(rgba(255,214,110,.13) 0 9deg,transparent 9deg 24deg);border-radius:50%;-webkit-mask:radial-gradient(circle,#000,transparent 68%);mask:radial-gradient(circle,#000,transparent 68%);will-change:transform;animation:synfSpin 26s linear infinite}"
    + "#syn-fx.win .fstamp{background:linear-gradient(180deg,#fff6cf,#ffd258 46%,#b67812);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 3px 0 rgba(0,0,0,.55)) drop-shadow(0 0 18px rgba(255,190,60,.6));animation:synfSlam .55s cubic-bezier(.2,1.1,.3,1) .35s both}"
    + "#syn-fx.win .fcrest{filter:drop-shadow(0 0 16px rgba(255,200,90,.75));animation:synfRise .7s cubic-bezier(.16,1,.3,1) .1s both}"
    + "#syn-fx.win .fshock{position:absolute;left:50%;top:50%;width:80px;height:80px;margin:-40px;border:3px solid #ffe08a;border-radius:50%;opacity:0;animation:synfShock .8s ease-out .62s both}"
    + "#syn-fx.win .fin{animation:synfShake .4s linear .62s both}"
    // Defeat
    + "#syn-fx.lose{background:radial-gradient(circle at 50% 30%,#3a1216,#120709 62%,#050304)}#syn-fx.lose .fmvp,#syn-fx.lose .ffoe{color:#ff9aa2}"
    + "#syn-fx .frain{position:absolute;left:-30%;right:-30%;top:-40%;height:180%;opacity:.26;will-change:transform;background:repeating-linear-gradient(100deg,transparent 0 13px,rgba(200,215,240,.55) 13px 14px,transparent 14px 29px);-webkit-mask:repeating-linear-gradient(180deg,#000 0 26px,transparent 26px 62px);mask:repeating-linear-gradient(180deg,#000 0 26px,transparent 26px 62px);animation:synfRain .62s linear infinite}"
    + "#syn-fx .frain.r2{opacity:.14;animation-duration:.95s;background-size:100%;transform:scaleX(-1)}"
    + "#syn-fx.lose .fstamp{color:#c9c4c4;text-shadow:0 3px 0 #000,0 0 24px rgba(255,40,60,.5);animation:synfFall 1.2s cubic-bezier(.3,.7,.2,1) .25s both}"
    + "#syn-fx.lose .fcrest{filter:grayscale(1) brightness(.55);animation:synfFlick 1.8s linear .1s both}"
    // Fireworks and poster
    + "#syn-fx.fw{background:radial-gradient(circle at 50% 42%,rgba(0,0,0,.62),rgba(0,0,0,.2) 72%);pointer-events:none;cursor:default}#syn-fx.fw .fstamp{color:#ffe08a;text-shadow:0 3px 0 rgba(0,0,0,.7),0 0 26px rgba(255,190,60,.85);font-size:50px;animation:synfPop 3.3s cubic-bezier(.2,1,.3,1) both}#syn-fx.fw .fsub{font:700 14px/1.3 ui-monospace,Consolas,monospace;letter-spacing:.14em;color:#fff;text-shadow:0 2px 4px #000;animation:synfPop 3.3s cubic-bezier(.2,1,.3,1) .08s both}"
    + "#syn-fx.posterview{background:rgba(5,4,3,.92)}#syn-fx.posterview img{max-width:100%;max-height:92%;box-shadow:0 8px 30px #000;animation:synfRise .5s cubic-bezier(.16,1,.3,1) both}"
    // Secret code
    + "#syn-matrix{position:fixed;inset:0;z-index:2147483647;cursor:pointer;background:#000;animation:synfIn .5s ease-out both}#syn-matrix canvas{position:absolute;inset:0;width:100%;height:100%}#syn-matrix div{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;pointer-events:none;font:700 15px ui-monospace,Consolas,monospace;letter-spacing:.42em;color:#d8ffe0;text-shadow:0 0 12px #2bff66;animation:synfIn 1.2s ease-out 1.6s both}#syn-matrix img{height:38vh;filter:drop-shadow(0 0 22px #2bff66)}"
    // Red Alert, ticker and radar (the panel's own styles only apply inside it)
    + "#syn-activity-panel.redalert{border-color:#ff2d3f!important;animation:synfRed 1.3s ease-in-out infinite}"
    + "#syn-activity-panel .rabar{display:flex;align-items:center;gap:8px;margin:0 0 8px;padding:7px 10px;border-radius:6px;color:#fff;font:700 12px/1.25 system-ui,sans-serif;letter-spacing:.04em;background:repeating-linear-gradient(-45deg,#8d0f1c 0 12px,#b5152a 12px 24px);background-size:34px 34px;animation:synfHaz 1s linear infinite}"
    + "#syn-activity-panel .rabar .ratxt{flex:1;min-width:0}#syn-activity-panel .rabar small{display:block;font-weight:600;opacity:.92}#syn-activity-panel .rabar .raleft{font:700 21px/1 ui-monospace,Consolas,monospace;text-shadow:0 0 8px #ff8a95}"
    + "#syn-activity-panel.hasticker{padding-bottom:32px}#syn-activity-panel.hasticker:not(.dock){max-height:calc(100vh - 72px)}"
    + "#syn-ticker{position:fixed;z-index:2147483647;height:24px;overflow:hidden;display:flex;align-items:stretch;background:#07090f;border-top:1px solid rgba(255,255,255,.14);font:600 12px/24px system-ui,sans-serif;color:#e9edf5;white-space:nowrap}"
    + "#syn-ticker b{flex:none;position:relative;z-index:1;padding:0 9px;background:#d3142a;color:#fff;font-size:10.5px;letter-spacing:.1em}"
    + "#syn-ticker .tkw{flex:1;overflow:hidden;position:relative}#syn-ticker .tkt{position:absolute;left:0;top:0;will-change:transform;animation:synfTick var(--tk) linear both}#syn-ticker:hover .tkt{animation-play-state:paused}"
    + "#syn-activity-panel .radar{position:relative;width:min(100%,260px);aspect-ratio:1;margin:10px auto 4px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.04),rgba(0,0,0,.35));box-shadow:inset 0 0 0 1px var(--strong)}"
    + "#syn-activity-panel .radar .rsw{position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg,transparent 0 72%,color-mix(in srgb,var(--accent) 48%,transparent) 100%);will-change:transform;animation:synfSpin 4s linear infinite;pointer-events:none}"
    + "#syn-activity-panel .radar svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}#syn-activity-panel .radar .rb{animation:synfBlink 1.4s ease-in-out infinite}"
    + "#syn-activity-panel .radar img{position:absolute;left:50%;top:50%;height:13%;transform:translate(-50%,-50%);opacity:.8;pointer-events:none}"
    + "#syn-activity-panel .xrow{display:flex;align-items:center;gap:6px;margin-top:6px;flex-wrap:wrap}#syn-activity-panel .xrow .xn{flex:1;min-width:120px;font-size:12px}#syn-activity-panel .xrow select{max-width:100%;font-size:12px}"
    + "@keyframes synfIn{from{opacity:0}to{opacity:1}}@keyframes synfOut{to{opacity:0}}@keyframes synfSpin{to{transform:rotate(360deg)}}"
    + "@keyframes synfUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}"
    + "@keyframes synfSlam{from{opacity:0;transform:scale(3.1)}70%{opacity:1;transform:scale(.93)}to{opacity:1;transform:none}}"
    + "@keyframes synfRise{from{opacity:0;transform:translateY(22px) scale(.86)}to{opacity:1;transform:none}}"
    + "@keyframes synfShock{from{opacity:.95;transform:scale(.4)}to{opacity:0;transform:scale(7)}}"
    + "@keyframes synfShake{0%,100%{transform:none}20%{transform:translate(-5px,3px)}40%{transform:translate(5px,-4px)}60%{transform:translate(-3px,-2px)}80%{transform:translate(3px,2px)}}"
    + "@keyframes synfRain{from{transform:translateY(0)}to{transform:translateY(62px)}}"
    + "@keyframes synfFall{from{opacity:0;transform:translateY(-34px)}to{opacity:1;transform:none}}"
    + "@keyframes synfFlick{0%{opacity:0}8%{opacity:.8}12%{opacity:.1}24%{opacity:.7}30%{opacity:.2}46%,100%{opacity:1}}"
    + "@keyframes synfPop{0%{opacity:0;transform:scale(.4)}14%{opacity:1;transform:scale(1.1)}22%{transform:none}78%{opacity:1}100%{opacity:0;transform:translateY(-14px)}}"
    + "@keyframes synfRed{0%,100%{box-shadow:0 0 8px 1px rgba(255,45,63,.45),inset 0 0 12px rgba(255,45,63,.14)}50%{box-shadow:0 0 30px 7px rgba(255,45,63,.95),inset 0 0 34px rgba(255,45,63,.34)}}"
    + "@keyframes synfHaz{to{background-position:34px 0}}"
    + "@keyframes synfTick{from{transform:translateX(var(--tkw))}to{transform:translateX(-100%)}}"
    + "@keyframes synfBlink{0%,100%{opacity:1}50%{opacity:.25}}";
  function fxMe() {
    var me = duelMe(), self = null;
    if (me && last) { self = members(last.fam).filter(function (m) { return m.id === String(me.id) || m.name === me.name; })[0] || null; }
    return { me: me, self: self, name: me && (me.name || me.login) || self && self.name || "" };
  }
  function warFoe(fam, w) { return nameOf(w.attackerId === fam.id ? w.defender : w.attacker); }
  function fxNum(v) { return (+v || 0).toLocaleString("en-US"); }

  // ----- Sounds, made in the browser. They go through the volume slider like the game's own sounds. -----
  var fxCtx = null, fxMaster = null;
  function fxVolOf(s) { return typeof s.fxVol === "number" ? s.fxVol : 70; }
  function fxGain(v) { return (v / 100) * (v / 100) * 2; } // squared like the game's slider, and 70% is about full strength
  function fxAudio() { // resolves with a running sound context, or nothing if the browser wants a click on the page first
    if (!window.AudioContext) { return Promise.resolve(null); }
    try {
      if (!fxCtx) {
        fxCtx = new AudioContext(); fxCtx.__synOwn = true;
        fxMaster = fxCtx.createGain(); fxMaster.gain.value = fxGain(fxVolOf(load())); fxMaster.connect(fxCtx.destination);
      }
    } catch (e) { return Promise.resolve(null); }
    if (fxCtx.state === "running") { return Promise.resolve(fxCtx); }
    return Promise.race([fxCtx.resume().catch(function () {}), new Promise(function (r) { setTimeout(r, 200); })]).then(function () { return fxCtx.state === "running" ? fxCtx : null; });
  }
  function fxTone(c, o) { // o: {f, to, at, d, type, g, lp}
    var t = c.currentTime + (o.at || 0), n = c.createOscillator(), g = c.createGain(), end = t + o.d, out = g;
    n.type = o.type || "sine"; n.frequency.setValueAtTime(o.f, t);
    if (o.to) { n.frequency.exponentialRampToValueAtTime(o.to, end); }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.g || 0.08, t + Math.min(0.04, o.d / 3)); g.gain.exponentialRampToValueAtTime(0.0001, end);
    n.connect(g);
    if (o.lp) { var l = c.createBiquadFilter(); l.type = "lowpass"; l.frequency.value = o.lp; g.connect(l); out = l; }
    out.connect(fxMaster); n.start(t); n.stop(end + 0.02);
  }
  var FX_SOUNDS = {
    ping: function (c) { fxTone(c, { f: 660, d: 0.12, g: 0.09, type: "triangle" }); fxTone(c, { f: 880, d: 0.2, at: 0.11, g: 0.09, type: "triangle" }); },
    boot: function (c) {
      fxTone(c, { f: 48, to: 120, d: 1.9, g: 0.13, type: "sawtooth", lp: 300 }); fxTone(c, { f: 96, to: 240, d: 1.9, at: 0.15, g: 0.06, lp: 900 });
      [0.55, 0.85, 1.15, 1.45].forEach(function (at, i) { fxTone(c, { f: 660 + i * 220, d: 0.09, at: at, g: 0.05, type: "square", lp: 2400 }); });
      [392, 587, 784].forEach(function (f) { fxTone(c, { f: f, d: 1.5, at: 3.75, g: 0.05, type: "triangle" }); });
    },
    alarm: function (c) {
      for (var i = 0; i < 6; i++) { fxTone(c, { f: i % 2 ? 392 : 523, d: 0.34, at: i * 0.36, g: 0.1, type: "sawtooth", lp: 1700 }); }
    },
    victory: function (c) {
      [[0.35, 392], [0.52, 523], [0.69, 659], [0.86, 784]].forEach(function (n) { fxTone(c, { f: n[1], d: 0.32, at: n[0], g: 0.09, type: "sawtooth", lp: 2600 }); });
      [523, 659, 784, 1047].forEach(function (f) { fxTone(c, { f: f, d: 1.9, at: 1.05, g: 0.07, type: "sawtooth", lp: 3000 }); });
    },
    defeat: function (c) {
      fxTone(c, { f: 110, to: 49, d: 3, at: 0.2, g: 0.16, type: "sawtooth", lp: 420 });
      [220, 262, 311].forEach(function (f, i) { fxTone(c, { f: f, to: f * 0.9, d: 2.3, at: 0.35 + i * 0.1, g: 0.05, type: "triangle" }); });
    },
    fireworks: function (c) {
      [0, 0.45, 0.85, 1.3].forEach(function (at, i) { fxTone(c, { f: 300 + i * 90, to: 1500, d: 0.22, at: at, g: 0.025 }); fxTone(c, { f: 150, to: 40, d: 0.32, at: at + 0.22, g: 0.14, type: "square", lp: 700 }); });
    },
    matrix: function (c) {
      fxTone(c, { f: 55, to: 82, d: 4, g: 0.12, type: "sawtooth", lp: 380 });
      [880, 1175, 1568].forEach(function (f, i) { fxTone(c, { f: f, d: 0.8, at: 1.5 + i * 0.2, g: 0.035, type: "triangle" }); });
    }
  };
  function fxSound(name, force) {
    if (!force && !fxOn(load(), "sound")) { return; }
    fxAudio().then(function (c) { if (c) { FX_SOUNDS[name](c); } }).catch(function () {});
  }

  // ----- The voice. Browsers only let a page speak after a click on it, so what's said before that waits for the first click, for up to a minute. -----
  var voiceWaiting = null, voiceGreeted = false, voiceMission = null;
  // Game names aren't always sayable, so these are spelled how they sound; numbers at the end of a name are left out. Everyone can set their own in Extras.
  var SPOKEN = { albidzn: "Albi" };
  function spokenName(name) {
    if (!name) { return "boss"; }
    var s = load(), mine = fxMe().name;
    if (name === mine && s.voiceCall) { return s.voiceCall; }
    var known = SPOKEN[String(name).toLowerCase()];
    if (known) { return known; }
    var plain = String(name).replace(/[_.-]+/g, " ").replace(/\s*\d+$/, "").trim();
    return plain.length >= 3 ? plain : name;
  }
  function voiceList() {
    if (!window.speechSynthesis) { return []; }
    var all = speechSynthesis.getVoices() || [], en = all.filter(function (v) { return /^en/i.test(v.lang); });
    return en.length ? en : all;
  }
  function voicePick(s) {
    var list = voiceList(), saved = list.filter(function (v) { return v.name === s.voiceName; })[0];
    if (saved) { return saved; }
    // The closest to a British butler that this PC has.
    var wanted = [/Ryan.*Natural/i, /Thomas.*Natural/i, /Guy.*Natural/i, /Google UK English Male/i, /George/i, /Daniel/i, /David/i, /Mark/i];
    for (var i = 0; i < wanted.length; i++) {
      var hit = list.filter(function (v) { return wanted[i].test(v.name); })[0];
      if (hit) { return hit; }
    }
    return list.filter(function (v) { return /^en-GB/i.test(v.lang); })[0] || list[0] || null;
  }
  function speak(text, force) {
    if (!window.speechSynthesis || !text) { return; }
    var s = load();
    if (s.elKey) { speakNice(text, force); return; }
    if (!force && !fxOn(s, "voice")) { return; }
    if (!force && navigator.userActivation && !navigator.userActivation.hasBeenActive) { voiceWaiting = { text: text, at: Date.now() }; return; }
    var u = new SpeechSynthesisUtterance(text), v = voicePick(s);
    if (v) { u.voice = v; u.lang = v.lang; }
    u.rate = 0.98; u.pitch = 0.9; u.volume = (typeof s.voiceVol === "number" ? s.voiceVol : 80) / 100;
    speechSynthesis.speak(u);
  }
  // ----- ElevenLabs, optional. With a key every announcement uses it, in fixed wording (the e... lines) without names or exact numbers, because new text costs credits.
  // A clip is paid for once and then kept in this browser (IndexedDB), per voice and text. s.elUsed = {m: "2026-11", n: characters paid for this month}; over the limit (s.elCap)
  // or on any failure, a line that isn't saved yet stays quiet: the PC's voice is never used while there's a key. The key is never shown again after pasting and never leaves this PC except to ElevenLabs.
  var EL_API = "https://api.elevenlabs.io", EL_MODEL = "eleven_flash_v2_5", EL_VOICE = "JBFqnCBsd6RMkjVDRZzb", EL_CAP = 3000; // that voice is George, a British default voice
  var elChain = Promise.resolve(), elNote = "", elListNote = "", elListTried = false, elPausedUntil = 0, elDbP = null, elMem = {};
  function elMonth() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() < 9 ? "0" : "") + (d.getMonth() + 1); }
  function elUsed(s) { return s.elUsed && s.elUsed.m === elMonth() ? +s.elUsed.n || 0 : 0; }
  function elCap(s) { return typeof s.elCap === "number" && s.elCap >= 0 ? s.elCap : EL_CAP; }
  function elVoiceId(s) { return s.elVoice || EL_VOICE; }
  function elSetNote(text) { if (elNote !== text) { elNote = text; if (showExtras) { redraw(); } } }
  function elDb() {
    if (!elDbP) {
      elDbP = new Promise(function (ok, no) {
        var r = indexedDB.open("syn-voice", 1);
        r.onupgradeneeded = function () { r.result.createObjectStore("clips"); };
        r.onsuccess = function () { ok(r.result); };
        r.onerror = function () { no(r.error); };
      });
    }
    return elDbP;
  }
  function elLoad(id) {
    if (elMem[id]) { return Promise.resolve(elMem[id]); }
    return elDb().then(function (db) {
      return new Promise(function (ok) { var r = db.transaction("clips").objectStore("clips").get(id); r.onsuccess = function () { ok(r.result || null); }; r.onerror = function () { ok(null); }; });
    }).catch(function () { return null; });
  }
  function elStore(id, blob) {
    elMem[id] = blob;
    elDb().then(function (db) { db.transaction("clips", "readwrite").objectStore("clips").put(blob, id); }).catch(function () {});
  }
  function elFail(status, detail) {
    var pause = 5 * 60000, why = "ElevenLabs didn't answer, so new lines stay quiet for now.";
    if (detail === "quota_exceeded") { pause = 60 * 60000; why = "Your ElevenLabs credits have run out, so new lines stay quiet for now."; }
    else if (status === 401) { pause = 30 * 60000; why = "ElevenLabs refused this key, so new lines stay quiet for now."; }
    else if (status === 404) { pause = 30 * 60000; why = "ElevenLabs doesn't know this voice. Pick another one."; }
    else if (status === 402) { pause = 30 * 60000; why = "This voice needs a paid ElevenLabs plan. Pick another one."; }
    elPausedUntil = Date.now() + pause;
    elSetNote(why);
  }
  // Gives the clip for a line, from what's saved if possible. Rejects when it would have to pay and may not.
  function elClip(text) {
    var s = load(), id = elVoiceId(s) + "|" + text;
    return elLoad(id).then(function (saved) {
      if (saved) { return saved; }
      if (Date.now() < elPausedUntil) { throw new Error("paused"); }
      if (elUsed(s) + text.length > elCap(s)) { elSetNote(""); throw new Error("limit"); }
      var stop = window.AbortController ? new AbortController() : null, timer = stop ? setTimeout(function () { stop.abort(); }, 15000) : 0;
      return fetch(EL_API + "/v1/text-to-speech/" + encodeURIComponent(elVoiceId(s)), { method: "POST", signal: stop ? stop.signal : undefined, headers: { "xi-api-key": s.elKey, "Content-Type": "application/json" }, body: JSON.stringify({ text: text, model_id: EL_MODEL }) })
        .then(function (r) {
          clearTimeout(timer);
          if (r.ok) { return r.blob(); }
          return r.json().catch(function () { return {}; }).then(function (b) { var e = new Error("refused"); e.el = [r.status, b && b.detail && b.detail.status || ""]; throw e; });
        })
        .then(function (blob) {
          var fresh = load();
          fresh.elUsed = { m: elMonth(), n: elUsed(fresh) + text.length }; save(fresh);
          elStore(id, blob); elSetNote("");
          if (showExtras) { redraw(); }
          return blob;
        })
        .catch(function (e) { clearTimeout(timer); if (e.el) { elFail(e.el[0], e.el[1]); } else { elFail(0, ""); } throw e; });
    });
  }
  function elPlay(blob) {
    return new Promise(function (ok, no) {
      var url = URL.createObjectURL(blob), a = new Audio(url), s = load(), done = false;
      var end = function (bad) { if (done) { return; } done = true; clearTimeout(guard); URL.revokeObjectURL(url); if (bad) { no(new Error("no play")); } else { ok(); } };
      var guard = setTimeout(function () { end(false); }, 30000);
      a.volume = (typeof s.voiceVol === "number" ? s.voiceVol : 80) / 100;
      a.onended = function () { end(false); };
      a.onerror = function () { end(true); };
      var played = a.play();
      if (played && played.catch) { played.catch(function () { end(true); }); }
    });
  }
  function elOn() { return !!load().elKey; }
  // The time left in the few fixed steps there are clips for.
  function elWhen(ms) {
    var m = Math.max(1, Math.round(ms / 60000));
    if (m >= 90) { return "Battle in " + Math.round(m / 60) + " hours."; }
    return "Battle in " + (m >= 53 ? "1 hour" : m >= 38 ? "45 minutes" : m >= 23 ? "30 minutes" : m >= 8 ? "15 minutes" : "a few minutes") + ".";
  }
  // One line, or several played one after the other, each its own saved clip. What can't be played stays quiet.
  function speakNice(text, force) {
    var parts = [].concat(text).filter(Boolean), s = load();
    if (!parts.length) { return; }
    if (!s.elKey) { speak(parts.join(" "), force); return; }
    if (!force && !fxOn(s, "voice")) { return; }
    if (!force && navigator.userActivation && !navigator.userActivation.hasBeenActive) { voiceWaiting = { parts: parts, nice: true, at: Date.now() }; return; }
    parts.forEach(function (one) { elChain = elChain.then(function () { return elClip(one); }).then(elPlay).catch(function () {}); });
  }
  function elLoadVoices() {
    var s = load();
    if (!s.elKey) { return; }
    fetch(EL_API + "/v2/voices?page_size=100", { headers: { "xi-api-key": s.elKey } }).then(function (r) {
      if (r.ok) { return r.json(); }
      return r.json().catch(function () { return {}; }).then(function (b) { var e = new Error("refused"); e.st = r.status; e.why = b && b.detail && b.detail.status || ""; throw e; });
    }).then(function (b) {
      var fresh = load();
      fresh.elVoices = (b.voices || []).map(function (v) { return { id: v.voice_id, name: String(v.name || "").split(" - ")[0], accent: v.labels && v.labels.accent || "", preview: v.preview_url || "" }; }).sort(function (x, y) { return x.name.localeCompare(y.name); });
      elListNote = fresh.elVoices.length ? "" : "ElevenLabs sent no voices, so this uses George.";
      save(fresh); redraw();
    }).catch(function (e) {
      elListNote = e.st === 401 || e.st === 403 ? "This key can't list voices, so it uses George. To choose another, give the key Voices access at ElevenLabs, then reload the game." : "ElevenLabs didn't send the voice list, so this uses your current voice. It tries again after a reload.";
      if (showExtras) { redraw(); }
    });
  }
  function elPreview(id) { // ElevenLabs' own sample of a voice, which costs no credits
    var s = load(), v = (s.elVoices || []).filter(function (x) { return x.id === id; })[0];
    if (!v || !v.preview) { return; }
    var a = new Audio(v.preview); a.volume = (typeof s.voiceVol === "number" ? s.voiceVol : 80) / 100;
    var played = a.play(); if (played && played.catch) { played.catch(function () {}); }
  }
  function elHtml(s) {
    if (!s.elKey) {
      return "<div class='xrow' title='Optional. Your key stays in this browser and only goes to ElevenLabs.'><span class='xn'>✨ ElevenLabs key</span><input type='password' data-elkey placeholder='Paste your API key' spellcheck='false' autocomplete='new-password' style='max-width:150px'></div>"
        + "<div style='font-size:11.5px;color:var(--muted)'>Optional, a better voice for every announcement. With a key it leaves out names and exact times, so each line is only paid for once.</div>"
        + (elNote ? "<div class='st bad'>" + esc(elNote) + "</div>" : "");
    }
    var list = s.elVoices || [], now = elVoiceId(s), used = elUsed(s), cap = elCap(s), full = used >= cap;
    if (!list.length && !elListTried) { elListTried = true; setTimeout(elLoadVoices, 0); } // once per page load, when Extras shows no list
    return "<div class='xrow'><span class='xn'>✨ ElevenLabs key saved</span><button type='button' data-elremove>Remove</button></div>"
      + (list.length ? "<div class='xrow' title='Picking one plays a free sample.'><span class='xn'>ElevenLabs voice</span><select data-elvoice>" + list.map(function (v) { return "<option value='" + esc(v.id) + "'" + (v.id === now ? " selected" : "") + ">" + esc(v.name + (v.accent ? " (" + v.accent + ")" : "")) + "</option>"; }).join("") + "</select></div>" : "")
      + "<div class='xrow' title='New lines stop at this many characters a month and stay quiet. Lines already saved stay free.'><span class='xn'>Monthly limit (characters)</span><input type='number' min='0' step='100' data-elcap value='" + cap + "' style='max-width:80px'></div>"
      + "<div style='font-size:11.5px;color:var(--muted)'>" + used.toLocaleString("en-US") + " of " + cap.toLocaleString("en-US") + " used this month. Each line is paid for once, then it's free." + (full ? " Limit reached: new lines stay quiet." : "") + "</div>"
      + (elListNote ? "<div style='font-size:11.5px;color:var(--muted)'>" + esc(elListNote) + "</div>" : "")
      + (elNote ? "<div class='st bad'>" + esc(elNote) + "</div>" : "");
  }
  ["pointerdown", "keydown"].forEach(function (k) {
    window.addEventListener(k, function () {
      if (!voiceWaiting) { return; }
      var w = voiceWaiting; voiceWaiting = null;
      if (Date.now() - w.at < 60000) { setTimeout(function () { if (w.nice) { speakNice(w.parts); } else { speak(w.text); } }, 50); }
    }, true);
  });
  if (window.speechSynthesis) { speechSynthesis.onvoiceschanged = function () { if (showExtras) { redraw(); } }; }
  // Spoken once when a timer runs out. s.voiceDue = {what: when it's due while waiting, minus that once said}, so a reload or a second tab doesn't say it twice.
  // A timer never seen counting down here, or that ran out over 10 minutes ago, isn't news. Energy is said once each time it fills up, also if it was already full.
  var REMIND_LINES = { gang: "Gang war is ready.", survival: "Survival is ready.", wanted: "Your wanted attack is ready.", duel: "Your free duel is ready.", energy: "Your energy is full.",
    weapon: "The black market has new goods.", food: "The corner shop has new goods.", eaten: "Your food has run out.", vehicle: "Your mission vehicle has run out.", crew: "A crew member has run out.", boostxp: "The family XP boost has ended.", boostcash: "The family cash boost has ended." };
  var JOIN_FAILED_LINE = "I could not sign you up for the war. Please do it yourself.";
  function checkReminders() {
    var s = load();
    if (!client || !fxOn(s, "voice") || !fxOn(s, "voiceRemind")) { return; }
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) { return; } // kept for after the first click
    var said = s.voiceDue = s.voiceDue || {}, changed = false, now = Date.now(), spoken = {};
    function due(key, end, what) {
      if (!end) { return; }
      if (end > now) { if (said[key] !== end) { said[key] = end; changed = true; } return; }
      if (said[key] !== end) { return; }
      said[key] = -end; changed = true;
      if (now - end < 10 * 60000 && !spoken[what]) { spoken[what] = true; speak(REMIND_LINES[what]); }
    }
    var all = s.cityTimers || {}, me = duelMe();
    if (me && me.city) { // only the city you're in: the others wait until you're there
      var t = all[me.city] || {};
      ["gang", "survival", "wanted", "weapon", "food"].forEach(function (k) { due(k + me.city, t[k], k); });
    }
    due("duel", duelCooldown(), "duel");
    if (me) {
      (me.gang || []).forEach(function (g) { if (g) { due("crew" + g.id, timeOf(g.endsAt), "crew"); } });
      if (me.missionBooster && me.missionBooster.id) { due("vehicle", timeOf(me.missionBooster.endsAt), "vehicle"); }
      (me.food || []).forEach(function (f) { var it = f && f.item; if (it && it.usedAt && it.durationDays) { due("eaten" + it.id, timeOf(it.usedAt) + it.durationDays * DAY, "eaten"); } });
    }
    var fp = last && last.fam && last.fam.private;
    if (fp) { // a boost that auto-renews on this PC is about to be bought again, so that isn't news
      var renews = autoOn(s, fp);
      ["xp", "cash"].forEach(function (k) { if (!renews[k]) { due("boost" + k, boostEnd(fp, k), "boost" + k); } });
    }
    if (me && typeof me.energy === "number") {
      if (me.energy >= 100 && !said.full) { said.full = true; changed = true; speak(REMIND_LINES.energy); }
      else if (me.energy < 95 && said.full) { said.full = false; changed = true; }
    }
    if (changed) { save(s); }
  }
  function leftWords(ms) { // "3 hours" or "25 minutes", for saying out loud
    var m = Math.max(1, Math.round(ms / 60000));
    if (m >= 90) { var h = Math.round(m / 60); return h + " hour" + (h === 1 ? "" : "s"); }
    return m + " minute" + (m === 1 ? "" : "s");
  }
  // What the voice says by itself, once per thing. s.voiceSaid = {wars: {id: "new" or "soon"}, day}; its first look stays quiet about what's already known.
  function checkVoice() {
    var s = load();
    if (!fxOn(s, "voice") || !window.speechSynthesis) { return; }
    var who2 = fxMe();
    if (!voiceGreeted && who2.name && last) {
      voiceGreeted = true;
      var reloaded = 0; try { reloaded = +sessionStorage.getItem("syn-reload") || 0; } catch (e) {}
      if (!document.hidden && Date.now() - reloaded > 2 * 60000) {
        var hour = new Date().getHours(), part = hour < 5 ? "evening" : hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening", nw0 = nextWar();
        var greet = say("vGreet", { part: part, name: spokenName(who2.name) });
        if (elOn()) { speakNice([greet, nw0 ? elWhen(startOf(nw0.w) - Date.now()) : ""]); }
        else { speak(greet + (nw0 ? " " + say("vGreetWar", { foe: warFoe(last.fam, nw0.w), left: leftWords(startOf(nw0.w) - Date.now()) }) : "")); }
      }
    }
    var run = missionRunning();
    if (run) { if (voiceMission > 0 && run.left === 0) { speakNice(say("vMission")); } voiceMission = run.left; } else { voiceMission = null; }
    if (!last || !last.fam.private) { return; }
    var fam = last.fam, seen = s.voiceSaid, changed = !seen, now = Date.now();
    if (!seen) { seen = s.voiceSaid = { wars: {}, day: "" }; warsOf(fam).forEach(function (w) { if (w.status === "preparing") { seen.wars[w.id] = "new"; } }); }
    warsOf(fam).forEach(function (w) {
      if (w.status !== "preparing" || startOf(w) <= now) { return; }
      var had = seen.wars[w.id], attack = w.attackerId === fam.id, left = startOf(w) - now, foe = warFoe(fam, w);
      if (!had) { seen.wars[w.id] = "new"; changed = true; if (elOn()) { speakNice([say(attack ? "eWarAttack" : "eWarDefend"), elWhen(left)]); } else { speak(say(attack ? "vWarAttack" : "vWarDefend", { foe: foe, left: leftWords(left) })); } }
      if (had !== "soon" && left <= REMIND) {
        seen.wars[w.id] = "soon"; changed = true;
        var su = warSignups(fam)[attack ? "attack" : "defense"], reg = who2.me && su && su.ids[String(who2.me.id)];
        var regLine = reg ? "You are registered." : "You are not registered yet.";
        if (elOn()) { speakNice([elWhen(left), regLine]); } else { speak(say("vWarSoon", { foe: foe, left: leftWords(left) }) + " " + regLine); }
      }
    });
    var mid = dayStart(now), day = dayKey(mid);
    if (seen.day !== day && mid + DAY - now <= HOUR && who2.self && who2.self.today < FULL && last.at > now - 10 * 60000) {
      seen.day = day; changed = true; if (elOn()) { speakNice(say("eReset")); } else { speak(say("vReset", { ap: who2.self.today })); }
    }
    if (changed) { save(s); }
  }

  // ----- A cover over the panel for the big moments. It follows the panel and goes away with a click. -----
  function fxStage(kind, html, ms) {
    fxStyle();
    var el = document.createElement("div"), timers = [], loops = [], done = false, st = { el: el };
    el.id = "syn-fx"; el.className = kind; el.innerHTML = html;
    function fit() {
      if (!box || !document.body.contains(box) || box.classList.contains("min")) { st.close(); return; }
      var r = box.getBoundingClientRect(), h = Math.min(Math.max(r.height, 560), window.innerHeight - r.top - 4);
      el.style.left = r.left + "px"; el.style.top = r.top + "px"; el.style.width = r.width + "px"; el.style.height = h + "px";
      el.style.borderRadius = getComputedStyle(box).borderRadius;
    }
    st.later = function (t, f) { timers.push(setTimeout(f, t)); };
    st.every = function (t, f) { var i = setInterval(f, t); loops.push(i); return i; };
    st.close = function () {
      if (done) { return; }
      done = true; fxActive = null;
      timers.forEach(clearTimeout); loops.forEach(clearInterval);
      el.classList.add("out");
      setTimeout(function () { el.remove(); }, 560);
    };
    el.addEventListener("click", st.close);
    document.body.appendChild(el);
    fxActive = st;
    fit(); st.every(200, fit); st.later(ms, st.close);
    return st;
  }
  function fxCount(st, node, to, ms) {
    var from = performance.now(), i = st.every(40, function () {
      var p = Math.min(1, (performance.now() - from) / ms), e = 1 - Math.pow(1 - p, 3);
      node.textContent = fxNum(Math.round(to * e));
      if (p >= 1) { clearInterval(i); }
    });
  }
  // Sparks on a canvas: mode "fall" is confetti from above, mode "burst" is fireworks.
  function fxSparks(parent, mode, ms) {
    var cv = document.createElement("canvas"), cx = cv.getContext("2d"), ps = [], born = performance.now(), last2 = born, nextBurst = 0, cols = ["#ffd66e", "#fff3c4", "#ffb733", "#ff8fa3", "#8fd3ff", "#b7ff9e"];
    cv.className = "fcv"; parent.appendChild(cv);
    var W = cv.width = parent.clientWidth || 400, H = cv.height = parent.clientHeight || 600;
    function burst(x, y) {
      var col = cols[Math.floor(Math.random() * cols.length)];
      for (var i = 0; i < 64; i++) {
        var a = Math.random() * 6.283, v = 40 + Math.random() * 190;
        ps.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 90, life: 0.8 + Math.random() * 0.9, age: 0, c: Math.random() < 0.7 ? col : "#fff", s: 1.4 + Math.random() * 1.7, round: true });
      }
    }
    function drop() {
      ps.push({ x: Math.random() * W, y: -10, vx: -24 + Math.random() * 48, vy: 60 + Math.random() * 90, g: 26, life: 5, age: 0, c: cols[Math.floor(Math.random() * 3)], s: 2.5 + Math.random() * 3.2, r: Math.random() * 6, vr: -5 + Math.random() * 10 });
    }
    (function frame(now) {
      if (!parent.isConnected || now - born > ms && !ps.length) { cv.remove(); return; }
      var dt = Math.min(0.05, (now - last2) / 1000); last2 = now;
      if (now - born < ms) {
        if (mode === "burst" && now >= nextBurst) { burst(W * (0.18 + Math.random() * 0.64), H * (0.14 + Math.random() * 0.42)); nextBurst = now + 300 + Math.random() * 320; }
        if (mode === "fall" && now - born > 500) { for (var d = 0; d < 2; d++) { drop(); } }
      }
      cx.clearRect(0, 0, W, H);
      ps = ps.filter(function (p) {
        p.age += dt; if (p.age > p.life || p.y > H + 12) { return false; }
        p.vy += p.g * dt; p.vx *= mode === "burst" ? 0.985 : 1; p.vy *= mode === "burst" ? 0.985 : 1; p.x += p.vx * dt; p.y += p.vy * dt;
        cx.globalAlpha = Math.min(1, (p.life - p.age) * 2.4); cx.fillStyle = p.c;
        if (p.round) { cx.beginPath(); cx.arc(p.x, p.y, p.s, 0, 6.283); cx.fill(); }
        else { p.r += p.vr * dt; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillRect(-p.s, -p.s * 0.45, p.s * 2, p.s * 0.9); cx.restore(); }
        return true;
      });
      cx.globalAlpha = 1;
      requestAnimationFrame(frame);
    })(born);
  }

  // ----- Victory and defeat, the first time the panel is looked at after a war ended. s.fxWars = {war id: 1}. -----
  function warInfo(fam, w, det) {
    var attack = w.attackerId === fam.id, foe = warFoe(fam, w), o = { won: w.winnerId === fam.id, attack: attack, foe: foe, mvp: null, ours: 0, theirs: 0, duels: 0, dmg: 0, you: null, reward: "" };
    if (det && det.replay) {
      try {
        var st = fighterStats(fam, w, det.replay), me = fxMe();
        o.ours = st.us.length; o.theirs = st.them.length;
        st.us.forEach(function (x) { o.duels += x.wins; o.dmg += x.dmg; if (me.me && (fighterId(x.f) === String(me.me.id) || x.name === me.name)) { o.you = x; } });
        if (st.us[0] && (st.us[0].wins || st.us[0].dmg)) { o.mvp = st.us[0]; }
      } catch (e) {}
    }
    var news = (fam.private && fam.private.events || []).filter(function (e) { return e && e.text && new Date(e.createdAt).getTime() >= startOf(w) && e.text.indexOf(foe) >= 0 && / defeated /.test(e.text); })[0];
    if (news) { o.reward = news.text; }
    return o;
  }
  function playWarFx(o) {
    var win = o.won, h = win ? "<div class='frays'></div>" : "<div class='frain'></div><div class='frain r2'></div>";
    h += "<div class='fshock'></div><div class='fin'><img class='fcrest' alt='' src='" + INTRO_LOGO + "'><div class='fstamp'>" + (win ? "VICTORY" : "DEFEAT") + "</div>"
      + "<div class='ffoe'></div><div class='fquip'></div>"
      + (o.ours ? "<div class='fnums'><div class='fnum'><b class='n1'>0</b><span>fighters</span></div><div class='fnum'><b class='n2'>0</b><span>duels won</span></div><div class='fnum'><b class='n3'>0</b><span>damage</span></div></div>" : "")
      + (o.mvp ? "<div class='fmvp'><small>" + (win ? "MVP" : "BEST FIGHTER") + "</small><b class='fmn'></b><span class='fms'></span></div>" : "")
      + (o.you ? "<div class='fyou'></div>" : "") + "</div><div class='fhint'>CLICK TO CLOSE</div>";
    var st = fxStage(win ? "win" : "lose", h, 11000), q = function (c) { return st.el.querySelector(c); };
    q(".ffoe").textContent = (o.attack ? "attack on " : "defense against ") + o.foe;
    q(".fquip").textContent = say(win ? "fxWin" : "fxLoss");
    if (o.mvp) { q(".fmn").textContent = o.mvp.name; q(".fms").textContent = o.mvp.wins + " duel" + (o.mvp.wins === 1 ? "" : "s") + " won · " + fxNum(o.mvp.dmg) + " damage"; }
    if (o.you) { q(".fyou").textContent = "You: " + o.you.wins + " duel" + (o.you.wins === 1 ? "" : "s") + " won · " + fxNum(o.you.dmg) + " damage"; }
    if (o.ours) { st.later(1450, function () { fxCount(st, q(".n1"), o.ours, 500); fxCount(st, q(".n2"), o.duels, 800); fxCount(st, q(".n3"), o.dmg, 1100); }); }
    if (win) { st.later(600, function () { fxSparks(st.el, "fall", 9000); }); }
    fxSound(win ? "victory" : "defeat");
    return st;
  }
  function checkWarFx() {
    if (!last || !last.fam.private) { return; }
    var s = load(), fam = last.fam, wars = warsOf(fam), seen = s.fxWars;
    if (!seen) { s.fxWars = {}; wars.forEach(function (w) { if (w.status === "finished") { s.fxWars[w.id] = 1; } }); save(s); return; } // first look stays quiet
    var w = wars.filter(function (x) { return x.status === "finished" && !seen[x.id]; })[0];
    if (!w) { return; }
    seen[w.id] = 1; save(s); // saved first, so a second game tab leaves it
    if (Date.now() - startOf(w) > 12 * HOUR) { return; } // old news
    var go = function (det) {
      var o = warInfo(fam, w, det), n = load();
      if (elOn()) { speakNice([say(o.won ? "eWin" : "eLoss"), o.mvp && o.mvp.name === fxMe().name ? "You were the MVP." : ""]); }
      else { speak(say(o.won ? "vWin" : "vLoss", { foe: o.foe }) + (o.mvp ? " " + say("vMvp", { name: spokenName(o.mvp.name) }) : "")); }
      if (fxOn(n, "warfx")) { fxQueue.push(function () { playWarFx(o); }); }
    };
    warDetail(w.id).then(go, function () { go(null); });
  }

  // ----- Fireworks for your own level-up and the family's. s.fxLv = {me, fam}. -----
  function playFireworks(title, sub) {
    var st = fxStage("fw", "<div class='fin'><div class='fstamp'></div><div class='fsub'></div></div>", 3500);
    st.el.querySelector(".fstamp").textContent = title; st.el.querySelector(".fsub").textContent = sub;
    fxSparks(st.el, "burst", 2600);
    fxSound("fireworks");
    return st;
  }
  function checkLevels() {
    if (!last) { return; }
    var s = load(), me = fxMe(), mine = me.self ? me.self.level : 0, fam = typeof last.fam.level === "number" ? last.fam.level : 0, lv = s.fxLv || {}, changed = !s.fxLv;
    if (mine && lv.me && mine > lv.me) {
      if (elOn()) { speakNice(say("eLevel")); } else { speak(say("vLevel", { lv: mine })); }
      if (fxOn(s, "fireworks")) { fxQueue.push(function () { playFireworks("LEVEL " + mine, me.name.toUpperCase()); }); }
    }
    if (fam && lv.fam && fam > lv.fam) {
      if (elOn()) { speakNice(say("eFamLevel")); } else { speak(say("vFamLevel", { lv: fam })); }
      if (fxOn(s, "fireworks")) { fxQueue.push(function () { playFireworks("LEVEL " + fam, String(last.fam.name || "The family").toUpperCase()); }); }
    }
    if (mine && mine !== lv.me) { lv.me = mine; changed = true; }
    if (fam && fam !== lv.fam) { lv.fam = fam; changed = true; }
    if (changed) { s.fxLv = lv; save(s); }
  }

  // ----- Red Alert, the last 15 minutes before a battle: a pulsing panel, a countdown on top and one alarm. -----
  var alertTest = null;
  function alertNow(s) {
    if (alertTest) { if (Date.now() < alertTest.at) { return alertTest; } alertTest = null; }
    if (!last || !fxOn(s, "alert")) { return null; }
    var nw = nextWar();
    if (!nw || startOf(nw.w) - Date.now() > REMIND) { return null; }
    var su = warSignups(last.fam)[nw.side.attack ? "attack" : "defense"], me = fxMe();
    return { id: nw.w.id, foe: warFoe(last.fam, nw.w), at: startOf(nw.w), attack: nw.side.attack, reg: !!(me.me && su && su.ids[String(me.me.id)]) };
  }
  function alertHtml(s) {
    var a = alertNow(s);
    if (!a) { return ""; }
    return "<div class='rabar'><span class='ratxt'>🚨 RED ALERT: " + esc(a.foe) + "<small>" + (a.reg ? "You're registered. Stay close." : "You're NOT registered! Family tab → Register") + "</small></span><span class='raleft'>" + clockText(Math.max(0, Math.ceil((a.at - Date.now()) / 1000))) + "</span></div>";
  }
  function updateAlert() {
    var left = box && box.querySelector(".raleft");
    if (!left) { return; }
    var a = alertNow(load());
    if (a) { left.textContent = clockText(Math.max(0, Math.ceil((a.at - Date.now()) / 1000))); }
  }
  setInterval(updateAlert, 1000);
  function checkAlert() {
    var s = load(), a = alertNow(s);
    if (!a) { return; }
    if (s.alertSaid === a.id) { return; }
    s.alertSaid = a.id; save(s); // once per war
    fxSound("alarm");
    redraw();
  }
  function fxClasses(s) {
    return (alertNow(s) ? " redalert" : "") + (fxOn(s, "ticker") && !s.min ? " hasticker" : "");
  }

  // ----- Threat radar in the War planner: the stronger a family, the closer to the middle and the bigger; ones you can attack now blink. -----
  function radarHtml(s, list) {
    if (!fxOn(s, "radar") || !list.length) { return ""; }
    var dots = list.slice().sort(function (a, b) { return a.rank - b.rank; }).map(function (t, i) {
      var c = t.ratio ? chance(s, t.ratio) : null, a = i * 137.5 * Math.PI / 180, r = 16 + 82 * Math.max(0, Math.min(1, (c == null ? 50 : c) / 100));
      var col = t.busy ? "#7b8494" : c == null ? "#c8ccd4" : c >= 70 ? "#6fe07a" : c >= 40 ? "#ffd166" : "#ff5c6c", size = t.ratio ? Math.max(2.6, Math.min(7.5, 3.6 / t.ratio)) : 3.5;
      return "<circle class='" + (t.busy ? "" : "rb") + "' style='animation-delay:" + (-i * 0.31).toFixed(2) + "s' cx='" + (120 + Math.cos(a) * r).toFixed(1) + "' cy='" + (120 + Math.sin(a) * r).toFixed(1) + "' r='" + size.toFixed(1) + "' fill='" + col + "' stroke='rgba(0,0,0,.5)' stroke-width='.6'"
        + " title='" + esc("#" + t.rank + " " + t.name + (c != null ? ": ~" + c + "% win" : "") + (t.busy ? " (not attackable now)" : "")) + "'/>";
    }).join("");
    var rings = [38, 68, 98].map(function (r) { return "<circle cx='120' cy='120' r='" + r + "' fill='none' stroke='currentColor' stroke-opacity='.2'/>"; }).join("");
    return "<div class='radar'><div class='rsw' style='animation-delay:" + (-(Date.now() % 4000) / 1000).toFixed(2) + "s'></div><img alt='' src='" + INTRO_LOGO + "'><svg viewBox='0 0 240 240'>" + rings + "<path d='M120 16V224M16 120H224' stroke='currentColor' stroke-opacity='.12'/>" + dots + "</svg></div>"
      + "<div class='st' style='text-align:center;margin-top:0'>Threat radar: closer to the middle is more dangerous. Blinking means attackable now.</div>";
  }

  // ----- Breaking news along the panel's bottom edge, from the real numbers and the family's news. -----
  var tickerEl = null;
  function tickerItems(s) {
    if (!last) { return []; }
    var fam = last.fam, list = members(fam), out = [], joke = function () { return say("tickJoke"); }, base = gainsToday(s), now = Date.now();
    if (base) {
      var up = list.map(function (m) { return { m: m, n: base[m.id] == null ? 0 : m.level - base[m.id] }; }).sort(function (a, b) { return b.n - a.n; })[0];
      if (up && up.n > 0) { out.push(up.m.name + " gains +" + up.n + " level" + (up.n === 1 ? "" : "s") + " today. " + joke()); }
    }
    var lead = list.slice().sort(function (a, b) { return b.today - a.today; })[0];
    if (lead && lead.today > 0) { out.push(lead.name + " leads the family with " + fxNum(lead.today) + " activity today. " + joke()); }
    out.push(list.filter(function (m) { return m.today >= FULL; }).length + " of " + list.length + " members at 100 today. " + untilReset() + " until the reset.");
    var nw = nextWar();
    if (nw) { out.push("War watch: battle " + (nw.side.attack ? "against " : "with ") + warFoe(fam, nw.w) + " in " + leftText(startOf(nw.w) - now) + "."); }
    var p = fam.private;
    if (p && p.treasury != null) { out.push("Treasury report: " + fxNum(p.treasury) + " gold in the vault. " + joke()); }
    var eta = fam.nextLevelXp != null ? famEta(s, fam) : null;
    if (eta) { out.push("Family level " + (fam.level + 1) + " expected in about " + etaWords(eta.ms) + "."); }
    (p && p.events || []).filter(function (e) { return e && e.text && now - new Date(e.createdAt).getTime() < DAY; }).slice(0, 3).forEach(function (e) { out.push(e.text); });
    return out;
  }
  function syncTicker() {
    var s = load(), show = box && document.body.contains(box) && fxOn(s, "ticker") && !box.classList.contains("min") && !introStop && !fxActive && last;
    if (!show) { if (tickerEl) { tickerEl.remove(); tickerEl = null; } return; }
    fxStyle();
    if (!tickerEl) {
      tickerEl = document.createElement("div"); tickerEl.id = "syn-ticker";
      tickerEl.innerHTML = "<b>BREAKING</b><div class='tkw'><span class='tkt'></span></div>";
      document.body.appendChild(tickerEl);
      fillTicker();
      tickerEl.addEventListener("animationend", fillTicker);
    }
    var r = box.getBoundingClientRect(), cut = parseFloat(getComputedStyle(box).borderLeftWidth) || 0;
    tickerEl.style.left = r.left + cut + "px"; tickerEl.style.width = r.width - cut * (box.classList.contains("dock") ? 1 : 2) + "px"; tickerEl.style.top = r.bottom - 24 - (box.classList.contains("dock") ? 0 : cut) + "px";
    tickerEl.style.borderRadius = box.classList.contains("dock") ? "0" : "0 0 8px 8px";
  }
  function fillTicker() {
    if (!tickerEl) { return; }
    var t = tickerEl.querySelector(".tkt"), w = tickerEl.querySelector(".tkw"), items = tickerItems(load());
    t.textContent = items.join("   ◆   ");
    t.style.animation = "none"; void t.offsetWidth; t.style.animation = "";
    var width = w.clientWidth || 300;
    t.style.setProperty("--tkw", width + "px");
    t.style.setProperty("--tk", Math.max(8, (width + t.offsetWidth) / 62).toFixed(1) + "s");
  }

  // ----- Most Wanted: a poster of last week's most active member in the family chat, once a week (s.posterSent = the week's Monday). -----
  function posterData(s, from, days) {
    var h = s.hist || {}, byId = {}, list = last ? members(last.fam) : [];
    list.forEach(function (m) { byId[m.id] = { m: m, ap: 0, full: 0, first: null, end: null }; });
    for (var i = 0; i < days; i++) {
      var r = h[dayKey(from + i * DAY)];
      if (!r) { continue; }
      Object.keys(r).forEach(function (id) { var b = byId[id]; if (!b) { return; } b.ap += r[id].ap; if (r[id].ap >= FULL) { b.full++; } if (!b.first) { b.first = r[id]; } b.end = r[id]; });
    }
    var top = Object.keys(byId).map(function (id) { return byId[id]; }).sort(function (a, b) { return b.ap - a.ap; })[0];
    if (!top || !top.ap) { return null; }
    return { m: top.m, ap: top.ap, full: top.full, days: days, gain: top.first && top.end ? top.end.lv - top.first.lv : 0, from: from, family: last.fam.name || "The Family" };
  }
  function drawPoster(d) {
    var cv = document.createElement("canvas"), W = cv.width = 720, H = cv.height = 1020, c = cv.getContext("2d");
    function fit(text, y, font, size, min, width, color) {
      var px = size;
      do { c.font = font.replace("#", px); px -= 2; } while (c.measureText(text).width > width && px > min);
      c.fillStyle = color || "#2c1a0c"; c.textAlign = "center"; c.fillText(text, W / 2, y);
    }
    function rule(y) { c.fillStyle = "#2c1a0c"; c.fillRect(70, y, W - 140, 3); c.fillRect(70, y + 6, W - 140, 1); }
    var bg = c.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, 680);
    bg.addColorStop(0, "#efdcae"); bg.addColorStop(0.65, "#dcc07f"); bg.addColorStop(1, "#a97f42");
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    for (var i = 0; i < 5200; i++) { c.fillStyle = "rgba(70,40,10," + (Math.random() * 0.1).toFixed(3) + ")"; c.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 2.2, 1 + Math.random() * 2.2); }
    for (var k = 0; k < 7; k++) { // old stains
      var x = Math.random() * W, y = Math.random() * H, rr = 30 + Math.random() * 90, st = c.createRadialGradient(x, y, rr * 0.2, x, y, rr);
      st.addColorStop(0, "rgba(110,70,25,.0)"); st.addColorStop(0.85, "rgba(110,70,25,.12)"); st.addColorStop(1, "rgba(110,70,25,0)");
      c.fillStyle = st; c.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
    c.strokeStyle = "#2c1a0c"; c.lineWidth = 5; c.strokeRect(26, 26, W - 52, H - 52); c.lineWidth = 1.5; c.strokeRect(36, 36, W - 72, H - 72);
    c.textBaseline = "alphabetic";
    fit("WANTED", 178, "400 #px Impact,'Arial Black',sans-serif", 176, 90, W - 120);
    fit("FOR EXCESSIVE ACTIVITY", 228, "700 #px Georgia,serif", 31, 18, W - 130);
    rule(248);
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = img.onerror = function () {
        // The portrait frame, with the family's crest for a mugshot.
        var fx = 160, fy = 270, fw = 400, fh = 360, ph = c.createRadialGradient(W / 2, fy + fh / 2, 40, W / 2, fy + fh / 2, 300);
        ph.addColorStop(0, "#3b2a18"); ph.addColorStop(1, "#120c07");
        c.fillStyle = ph; c.fillRect(fx, fy, fw, fh);
        c.strokeStyle = "#2c1a0c"; c.lineWidth = 6; c.strokeRect(fx, fy, fw, fh);
        if (img.width) { var ih = 318, iw = img.width * ih / img.height; c.drawImage(img, W / 2 - iw / 2, fy + (fh - ih) / 2, iw, ih); }
        fit(String(d.m.name).toUpperCase(), 712, "400 #px Impact,'Arial Black',sans-serif", 74, 30, W - 130);
        rule(734);
        fit(fxNum(d.ap) + " ACTIVITY IN " + d.days + " DAY" + (d.days === 1 ? "" : "S"), 782, "700 #px Georgia,serif", 34, 18, W - 130);
        fit(d.full + " DAYS AT 100" + (d.gain > 0 ? "  ·  +" + d.gain + " LEVEL" + (d.gain === 1 ? "" : "S") : "") + "  ·  LEVEL " + d.m.level + (d.m.pos ? "  ·  HONOR #" + d.m.pos : ""), 822, "700 #px Georgia,serif", 24, 14, W - 130);
        rule(842);
        fit("REWARD", 886, "400 #px Impact,'Arial Black',sans-serif", 38, 20, W - 130);
        fit(d.reward, 926, "italic 700 #px Georgia,serif", 25, 13, W - 120);
        fit(String(d.family).toUpperCase() + "  ·  " + shortDay(d.from) + " – " + shortDay(d.from + (d.days - 1) * DAY), 972, "700 #px Georgia,serif", 16, 10, W - 130, "#4a3018");
        resolve(cv);
      };
      img.src = INTRO_LOGO;
    });
  }
  function posterFor(s) { // last full week; by hand with no history for that, the week so far
    var mid = dayStart(Date.now()), ws = weekStart(mid), d = posterData(s, ws - 7 * DAY, 7) || (mid > ws ? posterData(s, ws, (mid - ws) / DAY) : null);
    if (d) { d.reward = say("posterReward"); }
    return d;
  }
  function sendPoster(d, s, undo) {
    return drawPoster(d).then(function (cv) {
      return new Promise(function (r) { cv.toBlob(r, "image/png"); });
    }).then(function (blob) {
      var fd = new FormData(), users = [];
      fd.append("payload_json", JSON.stringify({ username: say("asFamily"), allowed_mentions: { parse: [], users: [] }, content: say("posterLine", { who: who(s, d.m, users), ap: fxNum(d.ap) }) }));
      fd.append("files[0]", blob, "most-wanted.png");
      busy.poster = true;
      return fetch(s.lvHook + "?wait=true", { method: "POST", body: fd }).then(function (r) {
        if (!r.ok) { throw new Error("Discord said " + r.status); }
        delete fails.poster;
      });
    }).catch(function (e) {
      if (undo) { undo(); }
      fails.poster = String(e && e.message || e); retryOf.poster = Date.now() + RETRY;
    }).then(function () { busy.poster = false; redraw(); });
  }
  function autoPoster() {
    var s = load(), mid = dayStart(Date.now()), week = dayKey(weekStart(mid) - 7 * DAY);
    if (!s.lvHook || !fxOn(s, "poster") || !last || last.at < mid + GRACE || s.posterSent === week || !canPost("poster")) { return; }
    var was = s.posterSent;
    s.posterSent = week; save(s); // saved first, so a second game tab leaves it
    if (!was) { return; } // the first week after updating stays quiet
    var d = posterData(s, weekStart(mid) - 7 * DAY, 7);
    if (!d) { return; }
    d.reward = say("posterReward");
    sendPoster(d, s, function () { var n = load(); n.posterSent = was; save(n); });
  }
  function previewPoster() {
    var d = posterFor(load());
    if (!d) { alert("There's no saved activity to make a poster from yet."); return; }
    drawPoster(d).then(function (cv) {
      if (fxActive) { fxActive.close(); }
      fxStage("posterview", "<div class='fin'><img alt='Most Wanted' src='" + cv.toDataURL("image/png") + "'></div><div class='fhint'>CLICK TO CLOSE</div>", 30000);
    });
  }
  function postPosterNow() {
    var s = load(), d = posterFor(s);
    if (!s.lvHook) { return; }
    if (!d) { alert("There's no saved activity to make a poster from yet."); return; }
    if (!confirm("Post the Most Wanted poster of " + d.m.name + " in the family chat?")) { return; }
    sendPoster(d, s).then(function () { if (!fails.poster) { alert("Posted to the family chat."); } });
  }

  // ----- The secret code: up up down down left right left right B A. -----
  var CODE = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"], codeAt = 0;
  window.addEventListener("keydown", function (e) {
    var k = e.key && e.key.length === 1 ? e.key.toLowerCase() : e.key;
    codeAt = k === CODE[codeAt] ? codeAt + 1 : k === CODE[0] ? 1 : 0;
    if (codeAt === CODE.length) { codeAt = 0; playMatrix(); }
  }, true);
  function playMatrix() {
    if (document.getElementById("syn-matrix")) { return; }
    fxStyle();
    var el = document.createElement("div"), names = (last ? members(last.fam).map(function (m) { return m.name; }) : ["THE SYNDICATE"]).join(" ").toUpperCase() || "THE SYNDICATE", done = false;
    el.id = "syn-matrix";
    el.innerHTML = "<canvas></canvas><div><img alt='' src='" + INTRO_LOGO + "'>ACCESS GRANTED<span class='mfam'></span></div>";
    el.querySelector(".mfam").textContent = last && last.fam.name || "THE SYNDICATE";
    document.body.appendChild(el);
    var cv = el.firstChild, c = cv.getContext("2d"), W = cv.width = window.innerWidth, H = cv.height = window.innerHeight, S = 16, cols = Math.ceil(W / S), ys = [], at = [], prev = 0;
    for (var i = 0; i < cols; i++) { ys.push(Math.random() * -60); at.push(Math.floor(Math.random() * names.length)); }
    c.font = "700 " + S + "px ui-monospace,Consolas,monospace";
    function stop() { if (done) { return; } done = true; el.style.transition = "opacity .5s"; el.style.opacity = 0; setTimeout(function () { el.remove(); }, 520); }
    el.addEventListener("click", stop);
    setTimeout(stop, 11000);
    (function frame(now) {
      if (done) { return; }
      requestAnimationFrame(frame);
      if (now - prev < 45) { return; }
      prev = now;
      c.fillStyle = "rgba(0,0,0,.075)"; c.fillRect(0, 0, W, H);
      for (var x = 0; x < cols; x++) {
        var ch = names.charAt(at[x] % names.length);
        at[x]++;
        c.fillStyle = "#d9ffe2"; c.fillText(ch, x * S, ys[x] * S);
        c.fillStyle = "#17e356"; c.fillText(ch, x * S, (ys[x] - 1) * S);
        ys[x] += 1;
        if (ys[x] * S > H && Math.random() > 0.965) { ys[x] = 0; at[x] = Math.floor(Math.random() * names.length); }
      }
    })(0);
    fxSound("matrix", false);
    speakNice("Access granted.");
  }

  // ----- Windows pop-ups for your mission and the gang war, through the browser's notifications. They need the browser's permission, asked when one is switched on.
  // s.popSaid = {what: when it's due while waiting, minus that once shown}, so a reload or a second tab doesn't show it twice. Something that came due over 10 minutes ago is old news.
  var popNote = "";
  function askPopups(then) {
    if (!window.Notification) { popNote = "This browser doesn't support pop-ups."; redraw(); return; }
    if (Notification.permission === "granted") { popNote = ""; then(); return; }
    Promise.resolve(Notification.requestPermission()).then(function (p) {
      if (p === "granted") { popNote = ""; then(); return; }
      popNote = "The browser is blocking pop-ups for this site. Click the icon left of the address, allow Notifications, then try again.";
      redraw();
    }, function () { popNote = "The browser didn't allow pop-ups."; redraw(); });
  }
  function showPopup(tag, title, body, href) {
    try {
      var n = new Notification(title, { body: body, icon: INTRO_LOGO, tag: "syn-" + tag });
      n.onclick = function () { window.focus(); gameNavigate(href); n.close(); };
    } catch (e) { popNote = "The browser wouldn't show a pop-up: " + (e && e.message || e); }
  }
  function checkPopups() {
    var s = load();
    if (!window.Notification || Notification.permission !== "granted" || !client || !(fxOn(s, "popMission") || fxOn(s, "popGang"))) { return; }
    var said = s.popSaid = s.popSaid || {}, changed = false, now = Date.now();
    function due(key, end, title, body, href) {
      if (!end) { return; }
      if (end > now) { if (said[key] !== end) { said[key] = end; changed = true; } return; }
      if (said[key] !== end) { return; } // never seen counting down here, so it isn't news
      said[key] = -end; changed = true;
      if (now - end < 10 * 60000) { showPopup(key, title, body, href); }
    }
    if (fxOn(s, "popMission")) {
      var q = client.getQueryCache().find({ queryKey: ["getActiveQuest"] }), d = q && q.state.data, run = missionRunning();
      if (run && d.startedAt) { due("mission", new Date(d.startedAt).getTime() + d.data.seconds * 1000, "🎯 Mission ready", (run.name ? run.name + " is done. " : "Your mission is done. ") + "Time for the next job.", BAR); }
    }
    if (fxOn(s, "popGang")) {
      var all = s.cityTimers || {};
      Object.keys(CITY_NAMES).forEach(function (c) { due("gang" + c, all[c] && all[c].gang, "🗺️ Gang war ready", "You can fight again in " + CITY_NAMES[c] + ".", GANGWAR); });
    }
    if (changed) { save(s); }
  }

  // ----- Auto-join wars: signs this player up for every planned attack and defence they may fight in, with the same command as the
  // game's own Register button. It acts as soon as a war is seen, since nobody knows if the game will still be open later in the 10 hours.
  // The game's data is loaded fresh first. s.joined = {war id: {at, what, start}} remembers sign-ups made here for a day,
  // s.joinTry = {war id: {n, at, why}} refusals, tried again every 10 minutes until the battle, because the 10 hours may outlast a bad spell.
  var JOIN_GAP = 10 * 60000, JOIN_KEEP = 24 * 3600000, joinBusy = false;
  function warOpenToMe(fam, w) { // the game's own conditions for its Register button
    return w.status === "preparing" && (w.attackerId === fam.id || w.defenderId === fam.id) && startOf(w) > Date.now() + 30000;
  }
  function amRegistered(w) {
    var me = duelMe();
    return !!w.registered || !!me && (w.registeredUsers || []).some(function (id) { return String(id) === String(me.id); });
  }
  function joinable(fam) {
    return warsOf(fam).filter(function (w) { return warOpenToMe(fam, w) && !amRegistered(w) && w.eligible !== false; });
  }
  function joinPopup(tag, title, body) {
    if (window.Notification && Notification.permission === "granted") { showPopup(tag, title, body, PAGE); }
  }
  function checkAutoJoin() {
    var s = load();
    if (!fxOn(s, "autojoin") || joinBusy || !client) { return; }
    if (!last) { loadOwnFamily(location.pathname.replace(/\/+$/, "")); return; } // with the panel closed nothing else loads the family
    if (navigator.onLine === false) { return; }
    var now = Date.now(), joined = s.joined || {}, tries = s.joinTry || {};
    var w = joinable(last.fam).filter(function (x) { return !joined[x.id] && (!tries[x.id] || now - tries[x.id].at >= JOIN_GAP); })[0];
    if (!w) { return; }
    var q = last.query, famId = last.fam.id, warId = w.id;
    joinBusy = true;
    (q && typeof q.fetch === "function" && q.options && q.options.queryFn ? q.fetch().catch(function () { return q.state.data; }) : Promise.resolve(q && q.state.data)).then(function (d) {
      var fam = d && (Array.isArray(d.members) ? d : d.family);
      var cur = (fam ? joinable(fam) : [w]).filter(function (x) { return x.id === warId; })[0];
      if (!cur) { return; } // signed up elsewhere in the meantime, or the battle has begun
      var side = warSide(fam || last.fam, cur), what = (side.attack ? "attack on " : "defence against ") + nameOf(side.attack ? cur.defender : cur.attacker);
      return familyCommand().then(function (fn) {
        return fn({ data: { requestId: crypto.randomUUID(), command: { action: "participate", familyId: famId, warId: warId, registered: true } } });
      }).then(function () {
        var n = load(), keep = {};
        n.joined = n.joined || {}; n.joined[warId] = { at: Date.now(), what: what, start: startOf(cur) };
        Object.keys(n.joined).forEach(function (id) { if (Date.now() - n.joined[id].at < JOIN_KEEP) { keep[id] = n.joined[id]; } });
        n.joined = keep;
        if (n.joinTry) { delete n.joinTry[warId]; }
        save(n);
        joinPopup("join" + warId, "⚔️ You're in the war", "Signed up for the " + what + ". Battle at " + clock(startOf(cur)) + ".");
        refreshFamily();
      }, function (e) {
        var n = load(), t = n.joinTry && n.joinTry[warId], count = (t ? t.n : 0) + 1;
        n.joinTry = n.joinTry || {}; n.joinTry[warId] = { n: count, at: Date.now(), what: what, why: String(e && e.message || e) };
        save(n);
        if (count === 3) {
          joinPopup("join" + warId, "⚠️ Couldn't join the war", "The " + what + ": sign up on the Family tab.");
          if (fxOn(n, "voiceRemind")) { speak(JOIN_FAILED_LINE); }
        }
      });
    }).catch(function () {}).then(function () { joinBusy = false; redraw(); });
  }
  function joinHtml(s) {
    var fam = last && last.fam, wars = fam ? warsOf(fam).filter(function (w) { return warOpenToMe(fam, w); }) : [], joined = s.joined || {}, tries = s.joinTry || {}, shown = {}, lines = [];
    Object.keys(joined).sort(function (a, b) { return joined[b].at - joined[a].at; }).forEach(function (id) {
      if (Date.now() - joined[id].at < JOIN_KEEP) { shown[id] = 1; lines.push("<div class='st ok'>✅ Signed up for the " + esc(joined[id].what) + " at " + clock(joined[id].at) + ".</div>"); }
    });
    wars.forEach(function (w) {
      if (shown[w.id]) { return; }
      var foe = nameOf(w.attackerId === fam.id ? w.defender : w.attacker);
      if (amRegistered(w)) { lines.push("<div class='st ok'>✅ You're signed up against " + esc(foe) + ".</div>"); }
      else if (w.eligible === false) { lines.push("<div class='st'>You can't fight " + esc(foe) + ": you needed 12 hours in the family when that war was declared.</div>"); }
      else if (tries[w.id]) { lines.push("<div class='st bad'>Couldn't sign up against " + esc(foe) + ", trying again every 10 minutes. The game said: " + esc(tries[w.id].why) + "</div>"); }
    });
    return lines.join("");
  }

  // ----- The Extras menu -----
  function extrasHtml(s) {
    var row = function (key, label, tip, tests) {
      return "<div class='xrow' title='" + esc(tip) + "'><span class='xn'>" + label + "</span><button type='button' data-fx='" + key + "'>" + (fxOn(s, key) ? "On" : "Off") + "</button>" + (tests || "") + "</div>";
    };
    var test = function (k, label) { return "<button type='button' data-fxtest='" + k + "'>" + label + "</button>"; };
    var intro = "<div class='xrow' title='Plays over the panel when the game loads. A click skips it.'><span class='xn'>🖥️ Startup animation</span><button type='button' data-introtoggle>" + (s.intro === false ? "Off" : "On") + "</button>" + test("intro", "Play") + "</div>";
    var voices = voiceList(), current = voicePick(s), vol = typeof s.voiceVol === "number" ? s.voiceVol : 80;
    var h = "<div class='setup'><b>Extras on this PC</b><div style='font-size:11.5px;color:var(--muted)'>Mostly for fun.</div>"
      + row("autojoin", "⚔️ Auto-join wars", "Signs you up for every attack and defence you may fight in, as soon as it shows up. Once you're signed up, the game has no button to take it back.")
      + (fxOn(s, "autojoin") ? "<div style='font-size:11.5px;color:var(--muted)'>The game has to be open at some point in the 10 hours before the battle. If it stays closed the whole time, nothing can sign you up.</div>" + joinHtml(s) : "")
      + intro
      + row("voice", "🗣️ JARVIS voice", "Greets you and calls out battles, your mission, levels and war results. Browsers only let it talk after your first click on the page.", test("voice", "Test"))
      + (fxOn(s, "voice") && voices.length ? (s.elKey ? "" : "<div class='xrow'><span class='xn'>Voice</span><select data-voicepick>" + voices.map(function (v) { return "<option value='" + esc(v.name) + "'" + (current && current.name === v.name ? " selected" : "") + ">" + esc(v.name) + "</option>"; }).join("") + "</select></div>")
        + "<div class='xrow'><span class='xn'>Voice volume</span><input type='range' min='0' max='100' step='5' value='" + vol + "' data-voicevol></div>"
        + "<div class='xrow' title='How the voice says your name. Spell it how it sounds.'><span class='xn'>Call me</span><input type='text' data-voicecall value='" + esc(s.voiceCall || "") + "' placeholder='" + esc(spokenName(fxMe().name)) + "' spellcheck='false' autocomplete='off' style='max-width:150px'></div>" + row("voiceRemind", "⏰ Voice reminders", "Says when your gang war, survival, wanted attack or free duel is ready, when a shop has new goods, when your food, mission vehicle, a crew member or a family boost runs out, when your energy is full, and when auto-join fails. City timers only count for the city you're in, once you've opened their page there. The game has to be open.") + elHtml(s) : "")
      + row("popMission", "🔔 Pop-up: mission ready", "A Windows pop-up when your mission is done, also when the game is in the background. Click it to open the bar. The game has to be open.", test("popMission", "Test"))
      + row("popGang", "🔔 Pop-up: gang war ready", "A Windows pop-up when you can fight again. Each city counts once you've opened its gang war map. The game has to be open.", test("popGang", "Test"))
      + (popNote ? "<div class='st bad'>" + esc(popNote) + "</div>" : "")
      + row("sound", "🔊 Effect sounds", "Startup hum, alarm, victory and defeat music, fireworks. Browsers may keep these quiet until your first click on the page.", test("sound", "Test"))
      + (fxOn(s, "sound") ? "<div class='xrow'><span class='xn'>Effects volume</span><input type='range' min='0' max='100' step='1' value='" + fxVolOf(s) + "' data-fxvol></div>" : "")
      + row("alert", "🚨 Red Alert", "In the last 15 minutes before a battle the panel pulses red, with a countdown and one alarm.", test("alert", "Test"))
      + row("warfx", "🏆 Victory and defeat screens", "A cinematic with the MVP, the first time you look after a war has ended.", test("win", "Win") + test("lose", "Loss"))
      + row("fireworks", "🎆 Level-up fireworks", "When you, or the family, go up a level.", test("fireworks", "Test"))
      + row("ticker", "📰 News ticker", "Breaking news from the real numbers along the bottom of the panel. Hover to pause it.")
      + row("radar", "📡 Threat radar", "A radar of the scanned families at the top of the War planner.");
    if (s.lvHook) { h += row("poster", "🤠 Most Wanted poster", "Last week's most active member, in the family chat every Monday.", test("posterview", "Preview") + test("postersend", "Post now")); }
    return h + "</div>";
  }
  function fxTest(k) {
    var me = fxMe(), name = me.name || "Your name";
    if (k === "intro") { playIntro(); return; }
    if (k === "voice") { speakNice(say("vGreet", { part: "evening", name: spokenName(me.name) }), true); return; }
    if (k === "sound") { fxSound("boot", true); return; }
    if (k === "popMission") { askPopups(function () { redraw(); showPopup("test", "🎯 Mission ready", "This is a test. Time for the next job.", BAR); }); return; }
    if (k === "popGang") { askPopups(function () { redraw(); showPopup("test", "🗺️ Gang war ready", "This is a test. You can fight again.", GANGWAR); }); return; }
    if (k === "alert") { alertTest = { id: "test", foe: "Test Family", at: Date.now() + 20000, reg: false }; fxSound("alarm", true); redraw(); setTimeout(redraw, 20500); return; }
    if (k === "win" || k === "lose") {
      if (fxActive) { fxActive.close(); }
      var x = { name: name, wins: 4, dmg: 18420 };
      playWarFx({ won: k === "win", attack: true, foe: "Test Family", mvp: x, you: x, ours: 12, theirs: 11, duels: 11, dmg: 164200, reward: "" });
      return;
    }
    if (k === "fireworks") { if (fxActive) { fxActive.close(); } playFireworks("LEVEL UP", name.toUpperCase()); return; }
    if (k === "posterview") { previewPoster(); return; }
    if (k === "postersend") { postPosterNow(); }
  }
  // Runs on every tick. Big moments wait until someone can see them.
  function fxTick() {
    try {
      checkVoice(); checkReminders(); checkLevels(); checkWarFx(); checkAlert(); autoPoster(); checkPopups();
      if (fxQueue.length && !document.hidden && box && document.body.contains(box) && !box.classList.contains("min") && !introStop && !fxActive) { fxQueue.shift()(); }
    } catch (e) {}
    syncTicker();
  }

  // ===== Startup animation =====
  // Plays over the panel the first time it appears after the game loads. It sits beside the panel in the page, so the panel below
  // is drawn and loads as usual, and it reads the real family numbers as they arrive. A click skips it. It stays away when the tab
  // is in the background, after an automatic reload, with "reduce motion" switched on, and when s.intro === false (Discord settings).
  var INTRO_LOGO = "data:image/webp;base64,UklGRmI1AABXRUJQVlA4WAoAAAAQAAAAvAAAKwEAQUxQSJ0ZAAAR8EX+3y+3/v9dbKLEpoTKQWxbKbEpPYhSmygllE1VqepBbHIQm9rKpuSgSlSJEiXMQdQQRhiGIYaIIYxhWAdjDLEYFutgGZYxFuNicXFxP1jXutaf+fN+f/4cRMQEiP/f4L/3VjoOV7n3sMpN4Y/V7SEwWN26AL+samskT1a1uoFVDfPhavYphdVMp/25ir0ApCFcxSSWD1avXWxvVq+hFb+sWvex/7ZqXWZg1cKo0g5Xq9OExna1IlWlvV2lzlKUm8YqRZ77q9NxWvWWyxRWJ5IK9GWvFac9W5meJ5LBNek1sTo/TvGjtLZYzuvzIfaBCD2TaWJJN5vFPM9NTFBRqEh/mduTzUJ2hmtztw5/FaEuc3tBpOJgmBKJvF+xUUSDUzH/32Gwlt8Zbl4CQOuUH3m9B5H/G0AsQkJ4n9shzPIaobB8ntNHiHNb6wMfF8JHejDaymkP4GE+bQjdtMf5XAPVvCokxWKU1CKo57Mh+8BhLnVgnLadC8m3+bzH+HJBvGJ8AnCQh/AT3OZxBxCl7OTwEON2HvdCjEosSp9+CBBu5uDgAuQB0xnpH3J4bxI5fiP1ycJ4CVcdkpVsDTrAXQ5PsO/msJvXHumhWJwe3XMD/J3lM60QyKEFKAtyODAEWTYDLP9YIDs4Y9fE1wyiMekDDzJtALigU86zhQaR8Tm2rlikTuzKmukgy71+D7jNJBOEYZzCVpa/Sb7Jcs/q94XyEHfQOTb8kkWcJvg3Qw3zCMsMTzHeyyK0hSMW6086/fNWQmQ+CR2AI6s6ud632ccsMlctthbMfaJ+p3GSy7nsJBj/kbIVkPPnlK0+udXombpi0bbw2m6nlkeL0ADB551H4pcTCjwRm7sfHSzXc5CmrYWzTTTsqZ9V1jL1VaxMRkmZ/8jUwtwTi7dDo92YnvEsy30iZIpUHhknKUrndJyJ1O0F9AchOpxxmuUA4igFJASGyOCm5D7MspXSEYu44V77nRCyuJIo1AbVDz2Y6cTEcCotxrnwIEMrZWMhbba+7PvUcewOiGAaAlE4A03Gf0Gem3J27LaByRS6YjFfDGv1H0OPTzabqClDObiKkEiYZqh+1NC/K4J9mzVSHy6oZ1GzcVFtdviW9psH4HZrh3XyVOcHMYW/TntKaiQW9a1XafeG9T7yL8PB1A1BdXputZoL40ovr5kFnXuJZwPS9xbWi+Bn2GoPhn5E1Hv1xR06budWBV7/9sfxSw3oLLRPc2pgX38/xFos7ltPdpph2280zl32b+96A3ndjPzR5X+fq/sDcpxMc8o4+g/7/QX2Ug3r5zUG/ZvajXR2f05dwoHqDD/Vri/OKwpPZRmTbyXDVS+DWOT9eqP2oX1712hfXRK8ao2DMBp1hydX/etO/xi6WebxeKEdhL1Bs+PUmq327bjn7VdDV9EadI6ajj9zvmA5m+hJNHUdPxhHqILqNg3EQv9t5nQ6NZxe86rn43e7Q9cbOlL3AqR0nWa/8eXvZ483RK7rG8/eHtU7oU1gCm1oLTZRD7udz1A9+9FuK75E7YnSkeLm/Gjv0Zoo6YNHbysdRc47C+6N7DW6dKoXzavOKTAMWh927ou5/PXgJMimxaIf3VUnYeXmenDnDfrVV7+JOd98c2X3eeHV41bTccbe+fGLX0X+vz7aPTg6+nR8cnp6+vXj4dsnfzxczyl5/+2tTllbeM/wCX++fyByvLf17PC86Uw1uathu/nt7z82MiUfVTQwEIu/3ftLZN58fvyzH8aYE9JUV3a2wfnLrQxCiK0Ke0sg66+vj/u+JOkM1CBS+DMsI4rtfnhqtXS3vw5gxljV6+gIPex0AFqARiWGBSXjxqtfl9C9w4qD+uEQ+hPwYQpR8zgCdEzZ5fHDpbL23kFqGJ2c34GaSUW7CwQhyVCOxr2r2unno48Hh/8eHVVqF5c3M6XzS148Wxb7fZR/Xem0G86k0/oayylG//L49Z/310SR9zaevvt03g1zAdrby+AAv3PWnDYdr/lDRu61cptXn17dFyVf3/vnMsoEy6Fx8bPSHwZEjGrvHm2KOX7418Vo2byj2W5OUO2z1xtiIW6+bS2TfUJ5dfRYLNhXjWXxrPZyTSzk345/LoP/r2RXzyRGrZTSWqO1wqiUkhprTaoGpdRspjRGreNYxrFSKKU1WbVSGtBaxzJWOlYAk8l0JmON1krGUpNRayVjpbRW8VTuFHLIqhuJYrtzEcxf6JXnfkE7BLp8y7Qjig4JCUunl4SC3wo7JAhGXq1cY+L56pYGpCj8Pp7rul7HK1HfHfvzVebj4kSo+54/85r1XmlgQnYFePcGC+f3EpzSc+88x+mMOj2ZW6/l1VLU6ach6Eza5Sao7LeLmBk6d8FdDGgdFKAsRAnf0x4M2heTQadX+fQxL9/7OIuAmSP5Z68utcyUelYEBD6EcEeRMpE6ZVaGJ4TXE01yFpH/7Jpk1K8fH9S9aEyQTz2fKCWpoVOEiq2gXYZt9ITiFebZ11Gn4oF0CWd5yHzGNkHI35S4VYbHWDoFaEAyuwYib8Q814IydcvwBFCGKYU3ScbXaYNs0xKU2ynDB4AI1F03P5kSG5hNUrJrFuykDCcJIKyTWU5SspuiHPAXDGW4M8UxeXtO9fT73/vv9/Z2nzx5KNY2xPqasNzOUMtQE5k3fv/94fYfO7v7BwcfP54GvixsrQQTmOlIEeVwcbCzKYrv2PkZqtly/f1lJSjgWXFbBMAMSdYfD0VJe1Z+bw6Mb7p5XRf3DojkBG0j4b0o78BGSzKel0eI9W4+FNcD8H72sQ5FmUc22X+WSYh/8/m9MJK9S6yrotSB3ThDrVxiJ5cvRT0HiWzHVgei3EO72VyJtTxUUTViD68H17WUR6Lkrl3WetmE6GajKEDpCIZ3jmEiSj8solk+8SPbYTGvAWJAa5J1Uf6+nZfhcg7Ebqa4mCEKIgDDZzGHrl2UoToP4l4WHhQCRAFJH3gp5tGzUxlqcyFEL0O1iLeAS/qWmMs7Kz3LUJ0TcWJHEQHe2EvxxJy6VkQZLuZFvLd7ld8TiFzMLTGvnl3W2tyIx1bT/HrIHuZDUf7H9w2jFD+Py/kR6zY8zOs+yMC0I8q+ewWHBjdF5nFh6F8+ngMhPIurvGoQYVwXpb733iF5YLgDHIydXpZzA0D1SfnEjzTygg7JUJT6/QSjwwdDH3BN2SspLYDvv5VNvEo7yucj03GiKkq8c0tqCO8NHQAtDaqdU+Rj/PqgXOJxCvlg/iDKe4R1c0cYB4n0aU620cf1MokHKa/yeEWceCPKutnC+ud9kdq1y3puUIBKAeTn+5k28xPCJPPQJB+Kkj4cYu1uC8tWikzMMnw2kOfly420zU9cFSH6CR5le0xyTZRz3SFVJT4L65uUSSLOcGCjpZ3x5rxSCQHqhYiTRC/bEBiJkjbIuCPsGykKiMcZjgwPOxR9XYx4BfBrlodAV5TzGxkjkbVLSE/dBRouR1k+G4QQRwXdFCSeAFdZBnAuSvmMrHWReQg3MfiA2w8yHKcJcVTIVVHiAbButw6fRClrZP0qsg+w1hm+2AjxAXSaKpkQULPr8FqU8XdF1k8ix6FdkOGTnRBVOr4pa7MEIsJqi6eijB/I/EXk6dj5Gb5kEYeMYyePVhlE0LT5c0uUsYc0dVKqoqgxkwxHmcRbiAKIxtMIaXFTCnFgU06Jwjw0DUS+HZOvIeI4w3/ZxJ8QAqo/mrTitHY5Sv4LOYqcuxBiHs76GY5yEI9JlVjeLJ4NIILp2OZJXrcAU0OgveLEOzQq9nxsWwtnA2MYxhbnIm8HOJWG7J9zEZ9gQsbmolknT1FIn9RxGUSNIMvNomF47Wd6V0zu73ISAVlHC2ZMqrIR+feBWZrK8Cav9Ux3i6VFnu8LaGMtM7zOS/ybpb9Q/sI6SBEF1i00uBne5SZGi2sNiNppqf2iJgZgluFVfusZeovEpQdoQNm8LKJGgS/yE+/t/AXylFSN9b3ShBn+KkA0rcIF4oMGLUFaiSIv7CYZXhYhrOTieA/gMgmx7xTy00KTuZh/FlKUGAJIq8tCahY57hYibFgYu8RI/IR9s5CfRbwq5llCLpYeySCbX8g5ak6EQ/qi+EXNEoq7KAOFnFHgXwXdT+hF8pIwAVMvJTL9XsTp/IivpC6KFhGhwjo0HS8msWjAi4e+ITSlF3EyT/uLZR1bL8zwtoCvRbwqTCyWXaA6NdHIQAFfinhT3JuF8hbwCSeJqJmlkt+HIl4WJ0xri+EzxjBBPwt78/CiBHsQwS+L4RsEwHQ4Q6rv4yxs57Vv0PnslkCMATYWQ4XbU8DxJ4zuhj8ysV2Ik8+LMuwkflsMZwAaIlARHZ2Jt/m8M6Tq8onEg8VQSwATks04Gz9zeW2XtRzvgI3F8DHFGM8Cu2kMoDdyeGdScyMWx18GZXLRdkz9OsCHbAemfEvyATYXw30gBPCAoEdGiUqgd7L8U8R2OcTCEKS6EcmL2ApinYC7TbudIh6X5JyNBdE0SOkDEmQjg+3Vuo0Q//q5PSnJBr8tiHcGsyTfqU7ApZUQO1dzJXp/Lghh1XLpRMNsUWCCxpaNEPe+ztPG2qJoGGbAJGDSjuNsjNwUUG9thBBv77I9Lsvi3DIAUzzQMywjIkPWj1ZC3D9RGZ4sG3GTUKBJOjapd1mgvWMjhHjmWO0snfUEME4EQ+hnyfcfKyHWv6q0x0tHfDVZSkD3UYXAxbaNEGK3b/pj+QiroSSGWeC3MY9zg+jbrzZC/HqS2F5Cv9l0JFoRhVFEeEdM0e4LGyHEyz5Pl5A4SJtKBfQlIPtdUMOCQH/6xUaIB2vLSByn4A1BEw4ixhBSTmfXZll/N8m7IcQzCInQGJ3CgLONJSe+JSQhdZgBRBGWgVKAKgAGL5eb+AwTgDbGWkTGHsUfry8zsQcu6bMm9pJyuq+XmNgkqQGNpWdIn+ligNqjpSXEJZZBinUEPYpVjobZ4dIS2zItb1mAD8SYrx4vKSHe56IswMstqVKAj0tKiB+AzgA6RVGwtICb7eUkHnRhGpqUyVYX0UdrG4jeLyUhNprkrSk2YmIH1DaWkRC/nucUNKzGMlNAJxMMd5eREGtHuUy0FZM0ZbqtxjkAR8tICPHSyyQxxyYggnBAMorR+DZapsH5xjISYrOWIU8Pd0xSSTJH2gLuHi8jIcT7aW6ThFECTLLpILQB9/FSEmK7kZNRJfLXduA9XkpCiH9UPgrrjpODpTSAs7WchNi+tJOGjEGVwUTnZdtZX05CiLehRfrIJnkemWSazDKawNmyEuLBhclNm9MXy0oI8d4jT4W2G+c2NNFbXkKsf4izFd+fEcdY7y0vIcTOVYZBcXlWl5kQ4iCyUOToFUe43ITYrqfMoST5aLkJIQ6jOUndXXZCbDfmoW7Q8HLu9vbmYs1GCLEfpwTg9bw0VUCtm8KreTt05+Lw7vCejRDbVYOP0rqblrljY703Z89Zm4c3A7d//MRGCHE4BZihZ7l9vcuHzfl6ytd5eNk+bTZbVx82bIR43KZYr2MzsWG+nsE8vO3Xbi6rndHw4qmNEL8cFeFMoJVm35q3p/PQqV23r0atxt2g/eGehRBib5LD1FDkn/P0FNw52LttOL1Or9l0Wle96tlTGyG2u5lSdX7MGevl2+39uHJaZ83mWfVn5We/73zYsBDi/oc8Ior8MkfPgEr5jvGdn2fX1ebZRf2y2qo1HffkiYUQYj9bwXO0C1C+zwC9xknz22Xzc6tXv6r97PbO/7IRYh/QpTman73EyXxA1PpYuWzcjOrVm/N6s35ze/LQQogPlHh+nieYF1C9Wq3aPm10L6vnZz8a/bB6z0KIE6teTpFpb26eGT6V7UsaoPtndeeifvGt0aydnt49sRKiYyFzAu6mQ9maM8r2HdApQPTtrNG8+Nm4OP/ZfphBPE3T+X3r92Bunpr+K9kJmW+PjyuVy0a73X+URYjPhhm531brUY9X8/LI0KFkn7O4QL/6/eL8stLfziY2EnnXe07va4ufwfd5eWBocV6uE7sIc7/x+cvnTh5CNHMYGM6G2r0ZEQf95rysGULYKNWpnW3v86ubJ7mIt9nimM9D5xgmfWcM+PMiAAXglOpblnhqiH3ueg/yEQ8zQcdneANDzw0lME9BgkdlOsmCNHigeZyT2Mg0bWP0XQVRh+05Modl+m4Xk+4Dz/MSGxkUFceQ/sfc8XeJzuyURV/BTm7inlUANDI8m6+JdqUqUSVFo4E4JdLAk/zEhg2gOgFEMDO9nCMPYNqnVZ6vKeOEj8cwmslAA2wXIP60Q3uG1N05snxdmlNDpFHcEUEPaAckHxch6nb0AZX2dBFQmnODMdIw6k1Q/kQldgoRGTI+nq+ZqVWWqg343DaU0r4KQBX12UIRM7VanycFMwO7JanZgfaI1Z2rgaKESktGVmKeAHXX8yIFv8xBI/IIgQmSgGcFnYBK87AN5+12pJwg9vDKF8BAk5wMtMvTgjbJV1GbN5wZRBFUSlGxAoIw4ccATwoS2kLZwP5cqTGMmYETwscynCQURKZelJA68ayoroU0TQz35yrAqGkHwMsSnCXMgQIHIL6NAl2Cs7Th2GSMxFylRxgflUnLGf5JIjylF8KfRb1Lsx5zshAmoUQHHmwUdm7hj6VPVQPRlRMBz4t6btVRJsn9eZNA7M4kuF99KKwKxFoT40HE3aWWgBd5mhdF7VndkdoX8xZrpi2SvY/ODO4VVCepvMlUAfRrOgSY0mGvqL/TNJNx2u5chaA1TG4Sanw6wIcHxbQMUz+EmYSrVi+SAcYXRX1PAw1MZyFIMVfm86Av/YnUYb09UMBOIV2DlgrQEPRPLq4CVY6R1WwGUQDPFkE/1EEj9HQ08Psk3xZxC3IIaKIWMJvJ/tmgrofAXlFYjkEDipFYBBCQjF0CkA4cF9DBHDFFQ3fC+FKeRMjiHlqMXOnLOAY2F8Okb8AfAyigld8VTBVMI19ByEcmjU7ggI44KKiaFrmu14+1lhyLOVOmMMAbA5NbCaD6EG/k1UQDRABqyKmUclj3UT58KIj0noIoBhDzhkooz0GOPYAYiIkYw185tRIKDYydIe6NhtZVSDjiUzH/WBhHUczm/CVHMzUE6cSYAyQM4TSfKyx1i9npdAr9AOjr42JIlZ7WLgTwQiwGQhnoWTSRKUYJsJvHjc3IhzYaOh2SHwt5kwa9WxfgRCwKiSaOQjJ2AFo53KZICIj0gAgYIoHjQgCdQhDfQUUsCh8kILMACtjP5BgiHCCaBK3JVEPke1M4K6JCauQCMqArFoQi8CRJlc0o/8ykSJ/2dOBOIkZB5I8c9b2Ax6RLDXjcigURxZgjDUwyxHEkJQx/t+phG0Fn2h+jmAUKvhRAqgoAhtTFojCGzjDEVqegZ4CG5pbFAInUGo3RC2OJAjWFen79lC6KGfCfWBj602/CvPOfk2KrMXbU9U6Kg7XE7Y8VwCQOOcvtB+ZRgPGlWBR6V2R8Uc2gcBLjYydi+tDQR9vAYf9D5+5kCMyo5fWW1BjjplgUDZHnds0GbjtEhN+9Toc3hh6gTIEPg27l6KX0XIBmTq9J+oCXaIqF+ZvIe69rQX8InWa71b3bswAiCUqCN7w5bkftOwVc5/OKZAAggRdiKX4amyRAt9ntdgOTw00nADTGsN0+GwduP5hCN5fX2J+Ipbl1mogCoNHujx3X1MVaMm659XbUarg0cPJ4BxML975Yqm/7GJvtG+cO012ajvHCSeW27nQvr2K/6nOTwxds9Z5YvoeTRLPf7LhPDR3QOsEkUjM+tYZuPYL2VZN2tkuS14bXYjk/rOju2Ok0w12DR8ZZoytvfJyzusdVhvtbPhI0gN4XS3zryzDqjf40kBqnXDv7E/A8GdGz2roGVKQAwhdi2T/9r7WTphOg0OBRbbRjpaHdCy3ejAAckvVHYnW8j23sRXwl+qFRXmtYu5iafm1hjIDOC7FSPkpEpuSBK+sTwD386GMSECXovF8TK+ZZwigNPpIIhtc1Z8qlSQDRt12xem5hO00ocAPVrGA8NG3sitVUgZT4hvTeRJP+xLCqNjGObRReb4jtryvMJ8xKWjB6NyR1QASry0vSrTqajMGqskXRIQQMcVYULGWQchR8twFGMKW5kmib5AwuZsGs1z9tTCwi0H0uVpAQUEht0OhrbzzwnGnj4rJabV6ndDGerxwuRg3g1Ib9KBpNiVw+9NvVdt/1RwZp4nzF6JGqh+1+x6nfurfSD31Ju39Xr130mu3q6Y8ell9XijZG1W20bzq+4329c/1gCnXoXZ/f1Abj2x9++8tRP0zheIVokYzcTtfpDYbh1O8M+0xDlB/tdzud68uhjn/U6t1vF06vNTbweWU4Bxi0z9ud3rgzHA/Dsev7EMmpP6l8ag2bt8OKe3tSbdx2vFa7V7lOcLQinAD9/nDkub2R1+j5bv1yKsNA6VDO6JxXmr1Gq33lfG/dNG6cfs8bDmUA8GUl+A4Qhf6d6zlBGEnZqgwCJSMlJZHq1a7fVYbfryrn1+3QRw57w4HjKgVQXwHqMPz4YlOYN559cTVMujPCmWQa3TTO6j+atXazAsPvuw+EeXPnsAP9pfe8syMy/1GBcRArcEO32uvcnjZqDV+ebYvM2/WDZZfz+hmMfYJeMP5xOuz1Ltq6siZW6K2AwJUB6sfHs1YNtSNW7ApSK82PytmZHorV+wNA+OW8Tl2s4vuAPq7QEKv5CcwOGIpVvc+oh1jdgd0Vbptzscp/Ef93MgBWUDggnhsAAJBwAJ0BKr0ALAE+lUSaSaWkIiEotazQsBKJaW7uqRAOjQ1Q4mYZ2c5D/lH4X+BP9q/Gjzh8jXx73F/cTmf9fdzNOf/X97/ym1AvbXmuPhOrnIb2AvaT7T4Fup34v9gD9YvQ3/i+Ez9q/33sB/zD/Gf9v2Yv8P/4/5/z6fof+o/93+u+Ab+Wf2L/x/5H23/ZB+5XsKfr5/0Pz/RihQfaeai+BryXMXlvdmy9FGpALpXLdFkPQM0UdvgK/pvyBTyHHB/90XbZKMCivu7vydPxVzEV8MfCA8ciftYCO0uVQYY+lvET4570aDsnA/CQkjak4AwX425kWSKNA6MM8cg07AFqkDo7N5zEP0Z1qCXIX41y507w9ckiJF1O/HviYxfY6Gf84D3P43ORu1l3Yh1nWD+no9/+xqYeNMqwYdhtG7hbf4jqZwyBWEKrM7vQQXgcZmyk84n2Prnylw47PCDU4Yekex7Dhp2cl64sLyFUcnOJ61jNACUq5yNAYLPfoonOxXYEvnqAeUQl82PUOtTqCt9ltAM1f72R9aUSn/BJvf1HYca4XUsC6uQUJLk/TombIH/Cqwl8fQJDW9AvNaVAralhSOPB2uQM0jl/pN704wj5KfLnMgIwUJF19HSbzBHunF19iRppkeDzqyTY880FwZMGa07DgTEbBlERqf7rHV0BwGbgF0YlMOccdMLzSDdkuNqhWV5UQ0L0tOia9zCDbWJy8Xop/MEVNu/BgZQk48WrWCvLvPDLBKaQxYjlB7EBhsM/G1Rqc/k2WZC3IHoOt7OugsLgVlIopngNZO4IvB9g6tziQmvxVkC/VWjrYj3hJmKMCRZ0fwrF/jub1mZExId0EdWzmUegT+M8UgOevrkKz03ZCDAMfoHL6YkuEJ9+hI+GzIQDeEuHuF4Vzsx84/wnkiS1koYk0hNSDpCIK08PXbkWTE0AHcHZv0RLKUOEb05qsWZKNEacYcjRYZLEPm6T8Y7l9SrTPMbUW2HbEULKf/5Vjuw/+vEmAN9aGHkPBCzrlWSEcnRfcxNE1Ojeg4biVvI7ar1u1WzcChMKdSXL+noC+D8HthedXRjQgITOYNhB9RbereswIs4OP7wZPnMZoSx1qocLRRs1EvVLCHIbaHHRGiWEVnYEh7Mv/jlWMol0gujG/kku9lYS2WtTmJ86FK2r9NIV6YQRQ44XdkjKZzWLYjW4tAqQp7vpQAD+3w2nuHnANF98ninGwgD9YtzxkjJ93NXenGZiQ+ECnO94KUmg3JGuNhatNC/Vx+JxJrzwUa/dariu8/o7CMLOtjxL2vb0rDxHsIz4ugpMBB7zXTlRZ5AySmfNVqbDZwaEjw17qPq4ItR0nelpM2IywIP5Q4cIxVfc+67FtEpi7e7rj0FTcqMjdcQJKi2kJabj4oZRLDEgJNHtSV8v3dMqYfUFQo85tyVlWiIMm22mjgX6EGL4nsP79WdOoCs9w+kwmZa5Q0oa/WjjrxdTc+9lfRWBMUGon07ztnSAzB2lgbKQpsmy9dLaivLWdyuaxBchP091Lv3fZobuOFaH2KgAC8NSi0BArjCWR0QQkNEoqSxrf4wykjwkohFnUlrZRkargfbA3xi+WRwyW2mIViLuVrXy8w6HWFi95bjP0XjcLhP55Ni2hgagK1N0k2pBWj00r2DcnXKhdJFeODrkpUB66nyFgxNIdeV30XnZbS6UXOP93QWhE4Yp9JvWTuRuUBiK59kr/s07xmrsPU22UG0zp+pwX9oOMU80QqtP+lyN0FQPbim34oXaDZvKM5YaiYngCnOGZ47/xW0wCXk7jGd9KrhYjZWcuquHU6zHO1kXAnS5vgc9uKArmGcoTKwm6YkfkT6+NgnTMmXmR83UPJO7D/yj7OV0+rPhStboL0okn4WnxQ0ofm/lffRr0rY6QUq/9L/dp14My1bt+4hcVyZzatEENWIIs8C8bxgJfJ+ER0b7L1FaSvtKpclvD0nu9cu2VssT9X3rnmCtgVnQQO1nV8XeuBe4s6W9trHjV0klH9mGx4ld/m9f6gbz0Z/lxfKWJXh8tQWd5d2zeQMfApsm1v9pDUHNYXvPjhLi60j68CXnWMC9G0MVRsF191owMC1jVSdRj98k+REj3X+UV/wJ7+jxr6PBggQs10QJwL6RT7lmnafpu4D6wqa7wuFFP3L9DBK5n/VwJZBGaKgX5fKvBCsBg9SY+oDFvtYMmR9jY8NCeTavJ+ze3WRt3IZb6BiAgBs9cTGAp5NYiifd7VtX6O7EPBrg9sgFThQcJsfIsQl4Rb+D+FjBgZ/cpI7Cz882//OjfZlKfdqFLbLIcZflhKkWRZVlCJB9PALs36Ubnd9XzG51MzgT9n4m23l7AMdS5caCkjGXutqBPTxNjtTLSjqO/DY2eGFItr6zFNpXHlxc6CsYBLW3+Qh+NbocjRIRg3bfuC4m7EMcxJRZZHGHOwiey+4dh00nR+eKhPsZ5mmlA3db/dpYvLgsIaB6iNt2tfv28mLilECpmksurkrwcWrs9xX3WHV7w40xc37k5uyCapMYwZqd+9NPw0S3XYYA8lFKQiDHnxRTHxz+cSMZ/zuW0JjmdaDCBMhCyIbi3agHIAM+krpZ//SWw/xX+reSLjA7zy81m2bhXxyUZ/peIcqb4pAk/9jnpWN/NJqpJWao1d64bdSMBwvUB4GW87tGc1RlY0gfCyYGg0mWKaDtxeft5zbYKv/tXDdCvSVs8GQ603L8zz2jui1rSsCE/oDZAv1ccFbQIWuLYlk6kA+FkXTYFXVMY9vkt54UJ10RDyIHbUwsCC/rgPOI6eeu12rIef6ohecQ/XiGUDD+eWHdFywNfV/lXU5C+yRzJbGxy0xPhdWLFolA6MK1cH1GO8ZhEKoCT6rAoMNBo/B1oIuiA0Hj4NRkUUgOt/gowo4F3fMGefCcpdyUSkGrfbnP6CAi4ruTPRzDxUNPlRgSA+/u42xMxRGQTvtjzMmU3+b8c5Kyq7Z/xTGUSscRMWiJBfhl0HqibQbkCx5lQWrfUOJNZaXaJVga9omg3sxpI2zd94R14vuIAlMnUu0iCIeJ+G5cQED1+Od8wqOA9/t5X4UNwjHKp25xQV5GrCNJRJwj+ODZTUiIxddefrOVZYWTVeZJjHdylSqwqA/U/m3SBXOhMrWqa5xbi4Rv3Y2QC6kLnhcb7qCIsw0F2Vnhp0Vul/BETTqJY5jV7FVpeja+lat7Xbd5HBycncz5+QhpzKlyOUVkUyaps/y8A5gWi9Mcopb1SkMHln7WtbfzauJHxCXFboOfS/IUhoYKmht2l+CX8C2q2vg5nIW3wfFpK094BHw4d3sIJynn4kb/d/a1/2DoN2s7K4h9eN+kD1IPwLo6uO1N2vwkJIJnWCWfWdaVrH2xWF3owGiCR0gpkI8dueBRzzeNlv1jSwL/55JBGgGLy5vWzQMaG2IQhcDALHRDCc1Ludt0j8tmk5Uer8fB2iYtL+pgMUAxoSLy9aoAgiwsAMRmOx3XqhD3d94+veIYg/ULjRtPWpzsaWe1Gm+oW6ciGzyg/Z9cvQiGALWVNLjA3P2ie7wMxzkDFjbEJErQaGDTNrdEF+cxheE+SbHW4VuwjsVzjOk6dPjXLpPxQvXdbGQlMlrFWV17XKd1KACL61qz9uCjyStwKNOJt2JY51UrXU6bYEmWb2mnYLahaQtGf5IppXV8kkbYr3US5zNMbNlXc9quhz9Eobr7Tq/eU9WeluPcOnGdERml0HEmHbbEnjIlbJFdthPzL36W1oX3Ow9kA9eXNNIIQ2GcWhDiET7QqePbeEjfy16hwLrcGMsIYQiaVnYJZKolyp1HvMiX5tO4gMgwedmpbfrjl6/FwcUk8lI6RfBtLruKdW0fW1mILF9I2kH6C5VnAy/SNmG/kjUIgWkI3w28pMvk9ifwK/WXZljohSbc4Uk/TdvX5CkmiNs7UkTGq3QiyswGlGY3o06bvBV/mnOiJ6o3E/YaDN0/vyDhffXpmaeyFT+i75r3+STaoZKTU9ae9aH4cj3quTyb/GSHg7Rr1sgK95UkuZY9Ra3XPq/L3ZENpWTiCj+xfFkqHfi+4CY66XDhHZRAuHdIDna2SmqmCnIz+KXbR2ZfiNw4PqZJrWSwhXuK7t0uTtegldBw2r7ECUoa4dHdjj+/TsbsdB3gWWNbM6ZcErLF1yoJEAJ9YD6d1SKWOEAH2csrRZxk2p0yof1v2iyT9tRi0cmhfpU1qvboRfkKRrHa5BEICk89W7pV6B9e3ouZd5H9qQfLKHHYp4KxPUnlmg7KJgfcTNF7XiSnIQM4hqv4wfC2tZNwJfRTBnzkBxAB0O7rT2ydK4koqzQ8UmOlXsf21nrniE0Tj8Q5tKaCI2QrBpMJ40Lx5rr/4tEQbrqHa+zQsmFghAdt+BJsXw/m2n5x40v7RL7kLY76G+W9d+23sLFOcTBpu/H589NNwhC5SODFmqOsX3LeOFM4iZO4NoEL3P5MXkM+1m4ZTh/smQ+L6s9ZPpZZYSUa/FJosx79CZxECltfL0G4C4vgr2F/GNHwQO1Dv+KKeZwjoshkV/2Y08aS8n/N47ZGBzNNSjzzyh6nOMW5GvdPsfrDhQ1IU0wRofRVHpNEK1MqPcdB8WwCiVQZTtNuDUHx8xDGOOr6cPw6gJq+RZZj0hL/UWipPIVYpL3YrqLxSf+JNKVmOj9CtcCW09JAq/06oBje8VbnBQi0zsQ5sjWwjS1iDW7t9oMn8DReatsf8O1K7/9L4yiCKjEKKd/WN5up9mQpq7+qBFvuin3zDXEtv4mgQ7mv04TyA817jzLCMb8YzfxxVXnto1aKynsFYF9E5hnpD2Ln+d//om/ee1Y1BPun8LF+oCv16ZhgRNE7+IKJmLJ3UbcPM6UGgtsipUh4U8P7QcIkKfRPic6Y76OofonOrvVBpNrqtMaA1kPsangeAw51EPNHsGmixWOAU5INH8BdxnwVoeZozqffoHESvz854KXPgQEiuHGhIv4zkFhcAUWbI7VlpzOfpDnVryf7gxXlUhsxitRgMF2QfOZpze4posgwTBlJc8AgyY44vGgKO3d9a2mHfyqr0HEkUL9td77ly7cUKtAKvBZcbdpNvkakOx+90SwjBNbOIux0dDXssZpLJjfoDq9iy91zvRdW5InFT0Pyatw+tJKViEuD86DVvo+HLemK4QQiSKWR4CklaO5ThsS96imeEek1FVmDwAdWNWcGHgofKFdGzytpcVZPkEzNpLGTUjUqmySNOCtOV7ogIA3sO4nlqkheaimEuOJeFOZqNUc/w9nb+cCauwtbA3Kb8fGcn5HSsyPuUgwfuLCRxiSWx0iIVD6+31jSp8B1J2PDzAHYwHzcH17VM/acQebv06EY0N+fi5WM3ZmRdpEjevQFupLhzYAlTlK2EJ96U+YQia7/v//OxWVjLWmtdoqsHUV12V9HMwvOelvKzsbFJaHYUkXcUyTLZ7Lqc7DYKPjDDCBP6HjDoD6h55yhUPPcYfzCkiErNWBF8zWGpewTyPwHsE/pr0kCWV8hkvzy/RTNQwis2UlfJAvJKmSxAeH8PBWcE+Qx4zuiOj1q+V+Wn8COI6TKw7fa7GnxtmDkca9LQTW0CrgrBFjq7YfsYmDA/Q76oELXGxg/JR5txT2Hkc8242srGL5yK1JTsKP30WiCnwc7hVKGkBpVTecypWvmHq3sNz6yUNvDWzk87ODT5fZS0oa8Xiu9bIbaaxeFXnyioT4+CrVi3hZP+cfrmfzXVEYGyCXn0Q93t7nCGApe3N2BGMj1JHwgrFHtakC+TYIVPpcXHU6m+WPcf1Db+PNsSpLb0ufiKSJ0C2EEWAOBnQE2hONlxyX/JIDguSj1j7w2d5imVKXfFvylov/TXVBAS1HIX8vSZnpPiio2V9KvbUE63LpeJRw8PGE+QpvZkozniauwOh/S3hGaT2JYMATL9e9ekdwLNErpnzmNbugR+QYXm5EYj9kLwGxd8K/KY4hSpa8CL6xz4xEKElQIHdDjzLWG/KiOJArixDlcjlyjIFqCfm+WxYKpVRDN9Sj25TEnG2PQsJcU/DcV/L5YlMzS3MKCp13SJ+pcpON0GINzA+dnw3rX1cmUvmum4qdDN8DwWb2sU4N960O1/U76g3UFCNTYm1ew0+YYgyF1Bb6lkcq2BYhiDKvXPOQKhpsGAGASx85TuHhURD5p6g3Vw5PT7XGrDJuVKCLD++AZvo+kjj7Y8AqCQeka12tdJBghsQK3JLfL+yrcL+/lzyZAC0YkPkdcfeODoaW7g+8+ZdgQa2Q1pXOH8rtqJAH4JnvT5+maBhUu3I0naZiP2fqEoexA2MUTkxpnZoAZE0ea9UCixc+zKtvW3KHlUkJHRYmTv374oWrfpOYmzvIE0OznAdlqDi4pSxKiUTjIPyogDXKkGDU+2uhiZGvdSXgPzrFNqDRSx8z8NNpQ2FJm7rW/LPTA9Op9ljiUx+mKGeNy2UGDu0pTT3vbjo0BV67rnyvzCMohA0VKUkzvfnqbRPGBr4qyAKvG/eYwCFmgRECc6FnE4frTVKO4j9WmDrASYrmtWqnAzMqse926eJiZE0L4Z5MoyvfGoAHliUDV2txaxAnZ6RZerBdC+y1BW++Z8WeFLOFcW8fhzVKsV0b8cc6/DgLjFlH/Ze1bjhKySUfCOD5E6stgAwa234aFYYJqsz9LbAlUhh5QJuyHm1XBKkXxirn1BhVLkKb2F9xsu0rPyZVrK51ZOLA0ONorm9XcjEcbeIsQ4Zjq1u+Rtl31K0/J0f1d65VsNUMobvi8fS0pR7K3LRucaZ4Uji5744nEyAOK0w4Dbb44ggmWS8mJlvmHM7QLwkMGdStevWYGl006djgoxUw/BHhoyA+Gx2Eh0BNcAQzu+gkY7hLwiEbcyw0W7nbCa6rfHb1fi1idaFoR7UUdf3VH9erWjbVSYKOocB0zOsIzYYfrAaSo6XOM9OdQyKYtdTEnJ7vbBBi/BGnjniOKsayhD683ThivbVupCL/5v1tBD62WODFPuv8iIBXIQ20ZMf5eklZXfrKSae8SSagjWQl204oVHfUopNJzsdYeQm4tmMixlHpoOHfH/kQiK91mVOcmqhDtj+AIMD5HeciXUScxT02RIatFG3y8jX/i0FSLLzwzJJGrxq45tXOw2X2tNcm1ou8t4rnfGAg8KMXm24hnooqjgUw2lGqqWcvmhRexwCLGkEQ1Nb+0ityDPu2RS/WUy1PL7rNB5SXnm4FH4X6hLpyOWPzj5SodEFtrjBCJ8LBNXugQM6Du9ctJQPOlN8IQrt5JWTAxo5EWUNdpui6SSfjyODe23imm9XscwEtOihGJhutxPGFU3hlMeYyPmqkKP40cBoXCPeKAlOz/rBcB8vK63gaOKfNWYkMYewSDXAb0Oybccq3E/4QDreypkaCp5+qPonj7E/kd48c6TSr663Sb1FhqUWfaRxAS7eSeHdUxwUGBnpd3Ho8ZWZC37H5amFJTOlGZCuE4iKq3zRutzomM12QXuOi/IyUz3nU3VVNuCmcy36UmVS7nHO2VVHeCb005R0oOJfKawdAtW9mKirE+Ts+96XZ57o2iocKQ4A3calFWblPCtbkAAUvbhYn6sWsr7S6J3i9UkU4ruGJDlmfU+8eH/3RuXhNKBO4H2JnaGQWTgZkHW177fsHANdQOCLPV6HeDt0L0+6ne9N+aQkCcHQnGp/AbC/gkxe1u4kCKv1lroOzq4z/tX2CzMG/NEXTtPTi3VbnbLT1rmIyBJms/hzaprbixdJoZOKLxT/VeLV8MMlTRY2SXxsbpIwW+zDyG0x+KAIgjhI8JY5z0V21Wy7eR+70ywAQF/EjUv6f25o9I+meuk5Ngc7RrE/NSgcN3YzAne6BUNqkt1b78H+vLG55ouXAzShLCEPyA6aRm+t39dvF6hHBCb2zltksULjV7k4/zoILSmqleq7yrBLdDV0ekUc6DktS9wDqc1LSFcvosbIb8Evharkk/oex3D+hZt9CFe3MlZl4zc38sUTH6ATBoc8MPJ2HZIquxdK8S8+6fkUYOnclm8mld5MnVFEiMZaLVuHSkZTv0QzovZHe75CYCtT9J5Aats/yDdJFRnUIvnUa3YOs0KVxNEQVWAvkIbwbEHs8qZ9vJW7XsasDG5Eesq8qzTGgwSDZ0KscNTChciAhP9hKH4cphUZspYIoy8Odz7prAI/5mKZtagtke5dJ89X1JZH0lPvdHdJ/QAI26twKZeQpHOGXga/LIpX0ED1hfliypamoX5vaffsxmo2qQdA0CUz79zaIoD6Osbn2WBXCerUqIdhQM1tXed9GE/6887vIDZLJbCVL3KKXO/ZM2UnqpM7qRy4dMk4mNK50cP9vW7sMkwWtdjPerWAfV+xb68a2cb2RS6jaR8xnw4fyThphR8F6XVFK1+3EXf42uMV1QJrS/xqKLgj0LY54Bai1md5FWS/w17lWpIGJH4BDPbVZQHK3DnXwHiLAuHynzAT+OsNah2rDhVkhizBm52s+qPpJzhv7ntvRjuqiLzDoEA2jeTCpGSyK9tsH3ML/hopSDygCf9onxfakicHnKeOjWOj4UWH3Np/02X1NY5Gp93u411DVibkMOa5pPCKMKgHOKtkRbKuk/E/2EORgUX+z7LE5Ely7e2gcd4Z2a6tj8PtzyJJaRPkcNOdntPZYTBkUEdcLkLmZRDcpHqaoq97YPBcnPouqG1ziIH0BwpdjEUFTbEGHUOUtsJRcHmwzjU8ryWwe2g5h5vmRniXBdbI79uyztnme7CU9Fu6PP1Z3nd8kRXyEKjCvVsN6p6vBQWOXZuP4QyjwcMqErKlwrz471p88D3M6+kp2chHPA6QAOHn85/eGvnbicLu2KNG+v3UtR/iHi23WUo4f88dgUayK+S8xgQvV7YUEmZ8H1s4eL7o4Q1tvN7qFpY0S17UWMFk4VrWPaLoBUB1pxiVkUKXbieeFMpAYgNne/EAElMa5miB5TNta5mVvg0aBCMD+qa0x/BHnEZap0FJhULrb3EQ4dE6ZwPYUz2rje+Uxv9/6Ue+4As+mKr3LuIlhh6IoODYjmXr5qwmOFD19RRcHvl4xrY5O0WJssrMTcZgNQqsj4QeF0Z27u+dWEtFeYtSRYRF3bzKlsOopZgmWkCi+b+T33JNHHux9CwikcnAN127hqAGY6lhJ7b92aajyY2jGF0LcxvNsBdaZBrprHV2lE2EYC5sVzu9ObSrUV3W4QWHqXpUHV61itsqNMgtkWZ+U4pIhsHkS7XrnE7tBBcGsBunhL4NBNJF6Err0/EQnTvNq+UNbx/FAE+cvF+ke3x7sddwoqUGtKVqjE2OXvdqYHHwArYygX21/cdt1LTq75lKwZEdMDk8dSGs9GxkxJaU2ilFkHvPidj66obgzMSinykVRR0QPAS7MaJ9AA";
  var INTRO_CSS = "#syn-intro{position:fixed;z-index:2147483647;overflow:hidden;cursor:pointer;background:#04060c;color:#dfe6ee;font:12px/1.45 ui-monospace,'Cascadia Mono',Consolas,monospace;user-select:none;animation:synbIn .25s ease-out both}"
    + "#syn-intro *{box-sizing:border-box}"
    + "#syn-intro .ibg{position:absolute;inset:0;background:radial-gradient(circle at 50% 30%,color-mix(in srgb,var(--hud) 26%,transparent),transparent 62%),repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 30px),repeating-linear-gradient(90deg,rgba(255,255,255,.035) 0 1px,transparent 1px 30px)}"
    + "#syn-intro .ibg:after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.18) 0 1px,transparent 1px 3px),radial-gradient(ellipse at center,transparent 45%,rgba(0,0,0,.72))}"
    + "#syn-intro .isweep{position:absolute;left:0;right:0;top:0;height:22%;background:linear-gradient(180deg,transparent,color-mix(in srgb,var(--hud) 14%,transparent));border-bottom:1px solid color-mix(in srgb,var(--hud) 55%,transparent);will-change:transform;animation:synbSweep 1.5s cubic-bezier(.4,0,.2,1) .05s both}"
    + "#syn-intro .ic{position:absolute;width:20px;height:20px;border:2px solid var(--hud);opacity:.85;animation:synbCorner .6s cubic-bezier(.2,.8,.2,1) both}"
    + "#syn-intro .c1{left:8px;top:8px;border-right:0;border-bottom:0}#syn-intro .c2{right:8px;top:8px;border-left:0;border-bottom:0}#syn-intro .c3{left:8px;bottom:8px;border-right:0;border-top:0}#syn-intro .c4{right:8px;bottom:8px;border-left:0;border-top:0}"
    + "#syn-intro .ib{position:absolute;inset:0;padding:18px 24px 16px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;gap:6px;will-change:transform,opacity}"
    + "#syn-intro .itop{width:100%;display:flex;justify-content:space-between;font-size:10.5px;letter-spacing:.14em;color:color-mix(in srgb,var(--hud) 70%,#fff);animation:synbFade .5s ease-out .15s both}"
    + "#syn-intro .ihud{position:relative;width:var(--hs);height:var(--hs);flex:none;animation:synbFade .4s ease-out both}"
    + "#syn-intro .ihud>*{position:absolute;inset:0}"
    + "#syn-intro .iglow{inset:8%;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--hud) 42%,transparent),transparent 68%);will-change:transform,opacity;animation:synbGlow 2.4s ease-in-out .9s infinite both}"
    + "#syn-intro .iradar{inset:13%;border-radius:50%;background:conic-gradient(from 0deg,transparent 0 62%,color-mix(in srgb,var(--hud) 55%,transparent) 100%);-webkit-mask:radial-gradient(circle,transparent 58%,#000 60%);mask:radial-gradient(circle,transparent 58%,#000 60%);will-change:transform;animation:synbSpin 2.6s linear infinite}"
    + "#syn-intro .iring{will-change:transform,opacity;animation:synbRing .9s cubic-bezier(.16,1,.3,1) both}"
    + "#syn-intro .iring svg{display:block;width:100%;height:100%;overflow:visible;will-change:transform;fill:none;stroke:var(--hud)}"
    + "#syn-intro .r1 svg{animation:synbSpin 38s linear infinite}#syn-intro .r2 svg{animation:synbSpin 9s linear infinite}#syn-intro .r3 svg{animation:synbSpin 15s linear infinite reverse}#syn-intro .r4 svg{animation:synbSpin 5.5s linear infinite reverse;filter:drop-shadow(0 0 3px var(--hud))}"
    + "#syn-intro .r1{animation-delay:.05s}#syn-intro .r2{animation-delay:.18s}#syn-intro .r3{animation-delay:.31s}#syn-intro .r4{animation-delay:.44s}"
    + "#syn-intro .ilogo{inset:auto;left:50%;top:50%;height:58%;transform:translate(-50%,-50%);filter:drop-shadow(0 0 10px color-mix(in srgb,var(--hud) 55%,transparent));animation:synbLogo 1.05s cubic-bezier(.3,.7,.2,1) .55s both}"
    + "#syn-intro .iscan{inset:auto 18% auto 18%;top:0;height:2px;background:linear-gradient(90deg,transparent,#fff,transparent);box-shadow:0 0 12px 2px var(--hud);opacity:0;will-change:transform,opacity;animation:synbScan 1.05s cubic-bezier(.3,.7,.2,1) .55s both}"
    + "#syn-intro .ifam{font:600 21px/1.2 'Trajan Pro','Cinzel','Palatino Linotype','Book Antiqua',Georgia,serif;letter-spacing:.26em;margin-right:-.26em;text-transform:uppercase;text-align:center;color:#eef2f6;text-shadow:0 0 14px color-mix(in srgb,var(--hud) 60%,transparent);will-change:transform,opacity;animation:synbFam .9s cubic-bezier(.16,1,.3,1) 1.35s both}"
    + "#syn-intro .iwho{display:flex;flex-direction:column;align-items:center;min-height:82px;width:100%}"
    + "#syn-intro .iwel{font-size:11px;letter-spacing:.42em;margin-right:-.42em;color:color-mix(in srgb,var(--hud) 72%,#fff);animation:synbFade .45s ease-out 1.75s both}"
    + "#syn-intro .iname{font-weight:700;line-height:1.25;letter-spacing:.05em;color:#fff;white-space:nowrap;text-shadow:0 0 16px var(--hud);min-height:1.25em}"
    + "#syn-intro .irank{font-size:10px;letter-spacing:.2em;padding:1px 9px;border:1px solid color-mix(in srgb,var(--hud) 60%,transparent);border-radius:3px;color:color-mix(in srgb,var(--hud) 75%,#fff);opacity:0;transition:opacity .4s}"
    + "#syn-intro .irank.on{opacity:1}"
    + "#syn-intro .ilog{width:100%;min-height:104px;font-size:11.5px;line-height:17px}"
    + "#syn-intro .ir{display:flex;gap:6px;align-items:baseline;white-space:nowrap}"
    + "#syn-intro .il{color:#8b95a7}#syn-intro .il:before{content:'> ';color:var(--hud)}"
    + "#syn-intro .id{flex:1;border-bottom:1px dotted rgba(255,255,255,.17);min-width:8px;transform:translateY(-3px)}"
    + "#syn-intro .iv{color:color-mix(in srgb,var(--hud) 60%,#fff);overflow:hidden;text-overflow:ellipsis;max-width:68%}"
    + "#syn-intro .iv.wait{opacity:.55;animation:synbBlink .7s steps(2) infinite}"
    + "#syn-intro .ibar{width:100%}"
    + "#syn-intro .ist{display:flex;justify-content:space-between;font-size:10.5px;letter-spacing:.16em;margin-bottom:4px}"
    + "#syn-intro .itrack{height:3px;background:rgba(255,255,255,.1);overflow:hidden;border-radius:2px}"
    + "#syn-intro .itrack i{display:block;height:100%;background:linear-gradient(90deg,color-mix(in srgb,var(--hud) 60%,transparent),#fff);box-shadow:0 0 8px var(--hud);transform-origin:left;will-change:transform;animation:synbBar 3.9s cubic-bezier(.35,.1,.5,1) both}"
    + "#syn-intro .iskip{font-size:9.5px;letter-spacing:.18em;color:rgba(255,255,255,.34);margin-top:4px;text-align:center}"
    + "#syn-intro .iflash{position:absolute;left:0;right:0;top:50%;height:2px;background:#fff;box-shadow:0 0 22px 5px var(--hud);opacity:0;pointer-events:none}"
    + "#syn-intro.out{pointer-events:none;animation:synbOut .6s cubic-bezier(.4,0,.2,1) .05s both}"
    + "#syn-intro.out .ib{animation:synbZoom .5s cubic-bezier(.4,0,.6,1) both}"
    + "#syn-intro.out .iflash{animation:synbFlash .5s ease-out both}"
    + "@keyframes synbIn{from{opacity:0}to{opacity:1}}@keyframes synbFade{from{opacity:0}to{opacity:1}}"
    + "@keyframes synbSweep{from{transform:translateY(-100%);opacity:1}85%{opacity:1}to{transform:translateY(520%);opacity:0}}"
    + "@keyframes synbCorner{from{opacity:0;transform:scale(2.2)}to{opacity:.85;transform:none}}"
    + "@keyframes synbSpin{to{transform:rotate(360deg)}}"
    + "@keyframes synbRing{from{opacity:0;transform:scale(.62) rotate(-70deg)}to{opacity:1;transform:none}}"
    + "@keyframes synbGlow{0%,100%{opacity:.5;transform:scale(.94)}50%{opacity:1;transform:scale(1.05)}}"
    + "@keyframes synbLogo{from{opacity:0;clip-path:inset(0 0 100% 0)}25%{opacity:1}to{opacity:1;clip-path:inset(0 0 0 0)}}"
    + "@keyframes synbScan{0%{opacity:0;transform:translateY(calc(var(--hs)*.2))}12%{opacity:1}88%{opacity:1}100%{opacity:0;transform:translateY(calc(var(--hs)*.8))}}"
    + "@keyframes synbFam{from{opacity:0;transform:scale(1.34)}to{opacity:1;transform:none}}"
    + "@keyframes synbBlink{50%{opacity:.15}}"
    + "@keyframes synbBar{from{transform:scaleX(0)}to{transform:none}}"
    + "@keyframes synbOut{from{opacity:1}to{opacity:0}}"
    + "@keyframes synbZoom{to{opacity:0;transform:scale(1.07)}}"
    + "@keyframes synbFlash{0%{opacity:0;transform:scaleX(.1)}35%{opacity:1;transform:none}100%{opacity:0;transform:scaleY(.4)}}";
  var introDone = false, introStop = null;
  function introRing(cls, r, width, dash, extra) {
    return "<div class='iring " + cls + "'><svg viewBox='0 0 200 200'><circle cx='100' cy='100' r='" + r + "' stroke-width='" + width + "' pathLength='360' stroke-dasharray='" + dash + "' " + (extra || "") + "/></svg></div>";
  }
  // What the animation shows, from whatever has loaded so far.
  function introFacts() {
    var me = duelMe(), fam = last && last.fam, list = fam ? members(fam) : [];
    var self = me && list.filter(function (m) { return m.id === String(me.id) || m.name === me.name; })[0], nw = fam ? nextWar() : null, p = fam && fam.private;
    return {
      name: me && (me.name || me.login) || self && self.name || "",
      rank: self && self.rank || p && p.rank || "",
      level: self && self.level || 0,
      family: fam && fam.name || "",
      facts: [
        ["secure link", function () { return "ESTABLISHED"; }],
        ["identity", function () { return me ? me.name || me.login : null; }],
        ["family network", function () { return fam ? (fam.name || "Family") + (typeof fam.level === "number" ? " · LV " + fam.level : "") : null; }],
        ["active today", function () { return fam ? list.filter(function (m) { return m.today >= FULL; }).length + "/" + list.length + " at 100" : null; }],
        ["war room", function () { return !fam ? null : nw ? (nw.side.attack ? "attacking " : "defending vs ") + nw.side.foe.replace(/\\/g, "") + " in " + leftText(startOf(nw.w) - Date.now()) : "no battle planned"; }],
        ["treasury", function () { return !fam ? null : p && p.treasury != null ? (+p.treasury).toLocaleString("en-US") + " gold" : "classified"; }]
      ]
    };
  }
  function playIntro() {
    if (!box || introStop) { return; }
    var el = document.createElement("div"), timers = [], loops = [], done = false, born = performance.now();
    el.id = "syn-intro";
    el.innerHTML = "<style>" + INTRO_CSS + "</style><div class='ibg'></div><div class='isweep'></div><i class='ic c1'></i><i class='ic c2'></i><i class='ic c3'></i><i class='ic c4'></i>"
      + "<div class='ib'><div class='itop'><span>SYNDICATE OS v" + VERSION + "</span><span class='iclock'></span></div>"
      + "<div class='ihud'><div class='iglow'></div><div class='iradar'></div>"
      + introRing("r1", 97, 4, "1 3.5", "opacity='.55'") + introRing("r2", 90, 1.5, "70 18 26 18 96 132") + introRing("r3", 82, 1, "3 5", "opacity='.7'") + introRing("r4", 75, 3, "48 132 48 132")
      + "<img class='ilogo' alt='' src='" + INTRO_LOGO + "'><div class='iscan'></div></div>"
      + "<div class='ifam'>The Syndicate</div><div class='iwho'><div class='iwel'>WELCOME BACK</div><div class='iname'></div><div class='irank'></div></div>"
      + "<div class='ilog'></div><div class='ibar'><div class='ist'><span class='ist1'>INITIALIZING</span><span class='ipct'>0%</span></div><div class='itrack'><i></i></div><div class='iskip'>CLICK TO SKIP</div></div></div><div class='iflash'></div>";
    var q = function (c) { return el.querySelector(c); }, later = function (ms, f) { timers.push(setTimeout(f, ms)); }, every = function (ms, f) { var t = setInterval(f, ms); loops.push(t); return t; };
    // Follows the panel, which can still change size while the game loads.
    function fit() {
      if (!box || !document.body.contains(box) || box.classList.contains("min")) { finish(true); return; }
      var r = box.getBoundingClientRect(), h = Math.min(Math.max(r.height, 600), window.innerHeight - r.top - 4);
      el.style.left = r.left + "px"; el.style.top = r.top + "px"; el.style.width = r.width + "px"; el.style.height = h + "px";
      var look = getComputedStyle(box);
      el.style.borderRadius = look.borderRadius;
      el.style.setProperty("--hud", look.getPropertyValue("--accent").trim() || "#4db2ff"); // the colour of the city you're in, once that's known
      el.style.setProperty("--hs", Math.round(Math.min(r.width * 0.66, h * 0.36)) + "px");
    }
    function decode(node, text, ms) {
      var start = performance.now(), LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#$%&", t = every(33, function () {
        var k = Math.floor(Math.min(1, (performance.now() - start) / ms) * text.length), out = text.slice(0, k);
        for (var i = k; i < text.length; i++) { out += text.charAt(i) === " " ? " " : LETTERS.charAt(Math.floor(Math.random() * LETTERS.length)); }
        node.textContent = out;
        if (k >= text.length) { clearInterval(t); }
      });
    }
    function row(fact, ms) {
      later(ms, function () {
        var r = document.createElement("div"), label = fact[0], typed = 0;
        r.className = "ir"; r.innerHTML = "<span class='il'></span><span class='id'></span><span class='iv wait'>…</span>";
        q(".ilog").appendChild(r);
        var t = every(16, function () { typed++; r.firstChild.textContent = label.slice(0, typed); if (typed >= label.length) { clearInterval(t); } });
        var waited = 0, v = every(120, function () { // shows the real number as soon as it has loaded
          waited += 120;
          var got = waited < 300 ? null : fact[1]();
          if (!got) { if (waited > 1500) { r.lastChild.textContent = "standing by"; r.lastChild.className = "iv"; } return; } // and it keeps looking
          clearInterval(v); r.lastChild.textContent = got; r.lastChild.className = "iv"; r.lastChild.title = got;
        });
      });
    }
    function live(f) { var o = {}; try { o = introFacts(); } catch (e) {} return f(o); }
    function finish(fast) {
      if (done) { return; }
      done = true; introStop = null;
      timers.forEach(clearTimeout); loops.forEach(clearInterval);
      el.classList.add("out");
      setTimeout(function () { el.remove(); }, fast ? 300 : 700);
    }
    introStop = finish;
    fxSound("boot");
    el.addEventListener("click", function () { finish(false); });
    document.body.appendChild(el);
    fit();
    every(200, fit);
    var clock = function () { q(".iclock").textContent = new Date().toTimeString().slice(0, 8); };
    clock(); every(1000, clock);
    live(function (o) { (o.facts || []).forEach(function (f, i) { row([f[0], function () { return live(function (n) { return n.facts ? n.facts[i][1]() : null; }); }], 380 + i * 480); }); });
    every(50, function () { q(".ipct").textContent = Math.min(100, Math.round(((performance.now() - born) / 3900) * 100)) + "%"; });
    later(1200, function () { q(".ist1").textContent = "LOADING FAMILY DATA"; });
    // The name appears as soon as the game has told us who's playing.
    var asked = 0, nameTry = function () {
      asked++;
      var f = live(function (o) { return o; }), name = f.name || (asked > 12 ? "BOSS" : "");
      if (!name) { later(150, nameTry); return; }
      var node = q(".iname");
      node.style.fontSize = Math.max(18, Math.min(32, Math.floor(el.clientWidth * 0.9 / (name.length * 0.68)))) + "px";
      decode(node, name, 650);
      if (f.family) { q(".ifam").textContent = f.family; }
      later(700, function () {
        var g = live(function (o) { return o; }), bits = [];
        if (g.rank) { bits.push(String(g.rank).toUpperCase()); }
        if (g.level) { bits.push("LEVEL " + g.level); }
        if (bits.length) { q(".irank").textContent = bits.join(" · "); q(".irank").classList.add("on"); }
      });
    };
    later(1950, nameTry);
    later(3920, function () { q(".ist1").textContent = "ALL SYSTEMS ONLINE"; q(".ist1").style.color = "#fff"; });
    later(4700, function () { finish(false); });
  }
  function maybeIntro() {
    if (introDone || !box) { return; }
    introDone = true;
    var reloaded = 0;
    try { reloaded = +sessionStorage.getItem("syn-reload") || 0; } catch (e) {}
    if (load().intro === false || document.hidden || box.classList.contains("min") || Date.now() - reloaded < 2 * 60000) { return; }
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) { return; }
    playIntro();
  }

  // Runs every few seconds on every game page: keeps the latest family numbers, tracks today's levels,
  // sends the daily report, and shows the panel on the Family tab only.
  function tick() {
    var path = location.pathname.replace(/\/+$/, "");
    if (path !== lastPath) { // closed stays closed until the Family tab or the bar is opened again
      lastPath = path;
      if (path === PAGE || path === BAR || path === DUELS) {
        closed = false; area = path === PAGE ? "family" : "personal";
        if (path !== PAGE) { personalTab = path === DUELS ? "duels" : "missions"; }
      }
      if (path === GANGWAR) { area = "personal"; personalTab = "gang"; }
    }
    var fresh = readFamily();
    // The game may drop the family data from its cache after leaving the tab; a refresh by keepFresh still lands on the query itself.
    if (!fresh && last && last.query && last.query.state.dataUpdatedAt > last.at) {
      var d = last.query.state.data, fam = d && (Array.isArray(d.members) ? d : d.family);
      if (fam && Array.isArray(fam.members)) { fresh = { fam: fam, at: last.query.state.dataUpdatedAt, query: last.query }; }
    }
    if (fresh) { last = fresh; trackDay(members(fresh.fam), fresh.at); }
    recordHistory();
    autoSend();
    autoWeekly();
    checkWars();
    updateBoard();
    checkMilestones();
    announceVersion();
    checkActivity();
    checkLevelRush();
    checkStreaks();
    checkFamilyLevel();
    autoMonthly();
    checkRoster();
    checkBoosts();
    checkAutoBoost();
    checkDonations();
    autoBackup();
    checkDebriefs();
    checkAutoAttack();
    checkAutoJoin();
    checkEvening();
    autoRecruits();
    checkRecord();
    checkOvertakes();
    backfillWars();
    backfillAttendance();
    catchUpLog();
    keepFresh();
    heartbeat();
    checkOffline();
    checkStuck();
    checkGameUpdate();
    tabTitle();
    readMissions();
    trackFamXp();
    learnDuels();
    rememberTimers();
    fxTick();
    // The docked panel stays on every game page; a floating one (too little room, or dragged away) only shows on the Family tab, the bar and the duel page.
    if (closed || path !== PAGE && path !== BAR && path !== DUELS && !(/^\/game(\/|$)/.test(path) && wouldDock())) { if (box) { box.remove(); box = null; tipX = -1; showTip(); } setDock(0); lastKey = ""; return; }
    loadOwnFamily(path);
    if (drag) { return; }
    if (box && document.activeElement && box.contains(document.activeElement) && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) { return; } // don't wipe what's being typed
    if (showLinks && box && document.body.contains(box) && lastKey) { return; } // nor unsaved links while that list is open
    var s = load(); delete s.seen; delete s.lock; delete s.pos; delete s.hist; delete s.recruitHist; delete s.boardLock; delete s.weekLock;
    var key = JSON.stringify(last && last.fam.members) + JSON.stringify(last && warsOf(last.fam)) + JSON.stringify(s) + sending + error + note + diag
      + warBusy + warError + boardBusy + boardError + lvError + apError + JSON.stringify(fails) + JSON.stringify(last && famProgress(last.fam)) + showSetup + showLinks + showPlanner + showRecruits + showRanks + showVol + showExtras + memberFilter + trendId + area + personalTab + missionState() + (area === "personal" && personalTab === "missions" ? missionKey() : "") + duelRange + duelFilter + duelSort + JSON.stringify(duelState) + JSON.stringify(gangState) + JSON.stringify(learnState) + JSON.stringify(adviceState) + JSON.stringify(missions) + mqMode() + copied + JSON.stringify(scanning) + JSON.stringify(recruiting) + city() + Math.floor(Date.now() / 60000);
    if (box && document.body.contains(box) && key === lastKey) { return; }
    lastKey = key;
    draw();
    maybeIntro();
  }
  var resizeTimer = 0;
  window.addEventListener("resize", function () { place(); clearTimeout(resizeTimer); resizeTimer = setTimeout(tick, 200); }); // shows or hides the panel when the room for docking changes
  setInterval(tick, 3000);
  tick();
}
