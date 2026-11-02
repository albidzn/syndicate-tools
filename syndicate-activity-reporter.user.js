// ==UserScript==
// @name         Syndicate Activity Reporter
// @namespace    syndicate-tools
// @version      2.8.2
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
  var VERSION = "2.8.2";
  // What's new, posted to the leadership chat the first time a new version runs (see announceVersion). Add an entry with every release.
  var CHANGES = {
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
      if (dest instanceof AudioDestinationNode) {
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
  // Posts are bundled per channel (webhook + bot name): everything that comes up while the channel is busy goes out as one
  // message once nothing new has arrived for a while, so opening the game in the morning doesn't flood Discord.
  // Catch-up posts (from the first 10 minutes after the game was opened) don't ping people by name; role pings
  // (@family for upcoming wars) stay. Edits (msgId) and test buttons (now) go out at once.
  var STARTED = Date.now(), CATCHUP = 10 * 60 * 1000, QUIET_START = 60 * 1000, QUIET = 15 * 1000, MAX_HOLD = 5 * 60 * 1000;
  var queues = {};
  function post(url, payload, msgId, now) {
    if (msgId || now) { return sendNow(url, payload, msgId); }
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
      var c = p.content || "", e = p.embeds || [], am = p.allowed_mentions || {}, size = JSON.stringify(e).length;
      if (!cur || cur.content.length + c.length + 2 > 2000 || cur.embeds.length + e.length > 10 || cur.size + size > 5500) {
        cur = { username: p.username, content: "", embeds: [], size: 0, parse: [], roles: [], users: [] };
        out.push(cur);
      }
      if (c) { cur.content += (cur.content ? "\n\n" : "") + c; }
      cur.embeds = cur.embeds.concat(e); cur.size += size;
      ["parse", "roles", "users"].forEach(function (k) {
        if (k === "users" && catchUp && !p.keepPings) { return; } // names still show, they just don't ping
        (am[k] || []).forEach(function (v) { if (cur[k].indexOf(v) < 0) { cur[k].push(v); } });
      });
    });
    return out.map(function (m) {
      var msg = { username: m.username, allowed_mentions: { parse: m.parse, roles: m.roles, users: m.users.slice(0, 100) } };
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
  var CHEERS = ["Congrats! 🥂", "Well done! 👏", "Keep it up! 💪", "Respect! 🎩"];
  // Members linked to their Discord account (s.links = {member id: Discord user id}) get pinged by name;
  // their user id is added to `users`, the only accounts the message may ping.
  function who(s, m, users) {
    var uid = s.links && s.links[m.id];
    if (uid && users.indexOf(uid) < 0) { users.push(uid); }
    return uid ? "<@" + uid + "> (**" + md(m.name) + "**)" : "**" + md(m.name) + "**";
  }
  function milestoneLine(s, m, lv, users) {
    return "🎉 " + who(s, m, users) + " just reached **level " + lv + "**! " + CHEERS[lv / STEP % CHEERS.length];
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
    post(s.lvHook, { username: "Syndicate Activity", allowed_mentions: { parse: [], users: users }, content: lines.join("\n") }).then(function () { lvError = ""; }, function (e) {
      // Put the old levels back so the same milestone is tried again later.
      var now = load(); ups.forEach(function (u) { if (now.lvSeen) { now.lvSeen[u.m.id] = before[u.m.id]; } }); save(now);
      lvError = String(e && e.message || e); lvRetryAt = Date.now() + RETRY;
    }).then(function () { lvBusy = false; redraw(); });
  }

  // Activity milestones: a shout-out in the family chat (same webhook and links as the level-ups) when someone
  // reaches 500 or 1,000 points in one game day, louder the higher it goes.
  // s.apHit = {day, ids: {id: highest mark announced that day}}. The very first run stays quiet about marks already reached.
  var AP_MARKS = [500, 1000];
  var AP_SHOUTS = {
    500: ["🔥 {who} hit **500 activity** today! On fire! 🔥",
      "🔥 {who} just cracked **500 activity** today! Warming up nicely! 💪",
      "🔥 **500 activity** for {who} today! Keep that engine running! 🚂"],
    1000: ["🚨💥 **ABSOLUTE MADMAN ALERT** 💥🚨\n{who} just SMASHED **1,000 activity** today! 🔥🔥🔥 Somebody stop them! 🏆👑",
      "💥💥💥 **1,000 ACTIVITY** 💥💥💥\n{who} is UNSTOPPABLE today! 🚀🔥 The family bows down! 👑🙇",
      "⚡🔥 **ONE. THOUSAND. ACTIVITY.** 🔥⚡\n{who} is built different! 🦾🏆 Legend status unlocked! 👑"]
  };
  var apBusy = false, apError = "", apRetryAt = 0;
  function activityLine(s, m, mark, users) {
    var pool = AP_SHOUTS[mark];
    return pool[Math.floor(Math.random() * pool.length)].replace("{who}", who(s, m, users));
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
    post(s.lvHook, { username: "Syndicate Activity", allowed_mentions: { parse: [], users: users }, content: text.slice(0, 2000) }).then(function () { apError = ""; }, function (e) {
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
  var RUSH_SHOUTS = {
    3: ["⚡ {who} gained **+{n} levels** today! Leveling machine! 🚀",
      "📈 **+{n} levels** in one day for {who}! Climbing fast! 🧗",
      "⚡ {who} is on a level rush: **+{n} today**! Who can keep up? 🏃💨"],
    5: ["🚨💥 **LEVEL EXPLOSION** 💥🚨\n{who} just blasted through **+{n} LEVELS** today! 🚀🚀🚀 Somebody call the fire department! 🔥🧯",
      "☄️🔥 **+{n} LEVELS IN ONE DAY!** 🔥☄️\n{who} is absolutely UNSTOPPABLE! 🦾⚡ The leaderboard is shaking! 📈💥",
      "💥⚡ **{n} LEVELS. ONE DAY.** ⚡💥\n{who} has gone full beast mode! 🐉🔥 Bow down to the grind king! 👑🙇"]
  };
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
    var text = hits.map(function (h) {
      var pool = RUSH_SHOUTS[h.mark];
      return pool[Math.floor(Math.random() * pool.length)].replace("{who}", who(s, h.m, users)).replace("{n}", h.n);
    }).join("\n\n");
    postFor("rush", s.lvHook, shout(text, users), function () {
      var now = load();
      if (now.lvRush && now.lvRush.day === day) { hits.forEach(function (h) { now.lvRush.ids[h.m.id] = before[h.m.id]; }); save(now); }
    });
  }

  // 100+ streaks: a shout-out in the family chat at 7, 14, 30, 60 and 100 days in a row at 100 points or more.
  // Checked once the finished day is in the history. s.streakSaid = {id: {start, k}}: the run (by its first day) and the highest mark posted.
  var STREAK_MARKS = [7, 14, 30, 60, 100];
  var STREAK_SHOUTS = {
    7: "🔥 {who} hit 100+ activity **7 days in a row**! Consistency king! 👑",
    14: "🔥🔥 {who} — **14 days in a row** at 100+! Two weeks of pure grind! 💪",
    30: "🔥🔥🔥 **30-DAY STREAK!** 🔥🔥🔥\n{who} hit 100+ every single day for a month! Absolute legend! 🏆👑",
    60: "🌋🔥 **60 DAYS IN A ROW!** 🔥🌋\n{who} is a machine! Two months without missing a day! 🤖🏆",
    100: "💯💯💯 **ONE HUNDRED DAYS IN A ROW** 💯💯💯\n{who} has entered the Hall of Fame! 🏛️👑🔥"
  };
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
    var text = hits.map(function (h) { return STREAK_SHOUTS[h.k].replace("{who}", who(s, h.m, users)); }).join("\n\n");
    postFor("streak", s.lvHook, shout(text, users), function () {
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
    var n = Math.round(p.pct / 10);
    return "🏰 **Family level " + p.level + "**" + (p.max ? " · max level" : " · " + new Array(n + 1).join("▰") + new Array(11 - n).join("▱") + " " + p.pct + "% to level " + (p.level + 1));
  }
  function checkFamilyLevel() {
    var s = load(), lv = last && last.fam.level;
    if (!s.lvHook || typeof lv !== "number" || !canPost("famlv")) { return; }
    if (s.famLv == null || lv < s.famLv) { s.famLv = lv; save(s); return; } // first look stays quiet
    if (lv === s.famLv) { return; }
    var was = s.famLv; s.famLv = lv; save(s);
    postFor("famlv", s.lvHook, shout("🏰🎉 **" + md(last.fam.name || "The family") + "** just reached **family level " + lv + "**! 🎉🏰\nThanks to everyone grinding for it! 💪🔥"),
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
    var text = "🏅 **" + (partial ? "Monthly awards so far · " : "Monthly awards · ") + monthLabel(from) + "** 🏅\n\n"
      + "🏆 **Most active**\n" + top("total", 1, " AP", 3) + "\n\n"
      + "✅ **Most days at 100+**\n" + top("full", 1, " days", 1) + "\n\n"
      + "🔥 **Longest 100+ streak**\n" + top("best", 2, " days in a row", 1) + "\n\n"
      + "📈 **Most levels gained**\n" + top("levels", 1, " levels", 1) + "\n\n"
      + "🪙 **Top donor**\n" + top("gold", 1, " gold", 1) + "\n\n"
      + "-# Based on " + recorded.length + " of " + keys.length + " days. Congrats everyone! 🥂";
    return { text: text, users: users, days: recorded.length };
  }
  function sendAwards(manual) {
    var s = load(), mid = dayStart(Date.now()), ms = monthStart(mid), from = monthStart(ms - DAY), to = ms;
    if (!s.lvHook || !last || !canPost("month")) { return; }
    if (manual) { from = ms; to = mid; if (to <= from) { alert("The month just started. There's nothing to show yet."); return; } }
    var a = buildAwards(s, from, to, manual);
    if (!a) { if (manual) { alert("There's no saved activity for this month yet."); } return; }
    if (!manual) { s.monthSent = monthKey(from); save(s); if (a.days < AWARD_MIN_DAYS) { return; } }
    postFor("month", s.lvHook, shout(a.text, a.users), manual ? null : function () { var now = load(); delete now.monthSent; save(now); });
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
    postFor("record", s.lvHook, shout("👑 **NEW RECORD!** " + who(s, lead, users) + " just beat the best day ever with **" + lead.today.toLocaleString("en-US") + " AP** today! 🔥\n"
      + "-# Old record: " + md(holder.name) + " with " + holder.ap.toLocaleString("en-US") + " AP on " + shortDay(Date.parse(holder.day)), users),
      function () { var n = load(); delete n.recordSaid; save(n); });
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

  function send(manual) {
    var mid = dayStart(Date.now()), day = dayKey(mid - 1), s = load();
    if (!s.webhook || !last || sending) { return; }
    // Sending the same day again (by hand) compares against the same earlier report as the first send did.
    var base = s.sentDay === day ? s.prev : s.base;
    var list = members(last.fam);
    var payload = buildReport(last.fam.name, list, base || null, mid - 1, idleAll(s, list, mid));
    sending = true; error = ""; note = ""; redraw();
    post(s.webhook, payload).then(function () {
      var now = load();
      now.prev = base || null; now.base = snapshot(members(last.fam)); now.sentDay = day; now.sentAt = Date.now(); delete now.lock;
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
  var famQueries = null, famQueriesLoading = null;
  function familyQueries() {
    if (famQueries && famQueries.family && famQueries.war && famQueries.account) { return Promise.resolve(famQueries); }
    if (famQueriesLoading) { return famQueriesLoading; }
    var urls = [], found = { family: null, war: null, account: null };
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
    if (!(s.warHook || s.boardHook || s.lvHook || box) || !q || q.state.fetchStatus === "fetching" || Date.now() - q.state.dataUpdatedAt < KEEP) { return; }
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
  function skippedNote(job) {
    return job.skipped ? " " + job.skipped + " skipped: no longer searching (removed from the list)." : "";
  }
  function recruitHtml(s) {
    var r = s.recruits, f = recruitFilter(s), list = recruitList(s), h = "";
    h += "<div class='st'>Players in the ranking marked <b>looking for a family</b>. Click a name to copy it.</div>";
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
      + (list.length && s.webhook ? "<button type='button' data-postrecruits>Post to leadership chat</button>" : "") + "</div>";
    if (r) {
      h += "<div class='st'>" + list.length + " of " + Object.keys(r.list.reduce(function (o, p) { o[p.id] = 1; return o; }, {})).length + " searching players shown · scanned " + clock(r.at)
        + (Date.now() - r.at > 3600000 ? " (over an hour ago)" : "") + ", " + r.total.toLocaleString("en-US") + " players checked.</div>";
      h += "<table><thead><tr><th>Rank</th><th>Name</th><th>Class</th><th>Level</th><th>Honor</th><th title='Levels and honor gained since the scans first saw them searching'>Growth</th><th></th><th></th></tr></thead><tbody>"
        + (list.length ? list.map(function (p) {
          var g = growth(s, p), gt = !g || g.days < 0.5 ? "<span class='idle'>new</span>" : (g.lv > 0 ? "+" + g.lv + " lv " : "") + (g.honor > 0 ? "+" + g.honor + " hon " : "") + (g.lv <= 0 && g.honor <= 0 ? "– " : "") + "<span class='idle'>" + Math.round(g.days) + "d</span>";
          var inv = inviteOf(s, p, news), busyNow = inviteBusy[p.id] || job && job.running && job.current === p.name;
          var it = busyNow ? "<span class='idle'>sending…</span>"
            : inv ? "<span class='invd' title='Invited " + (inv.by ? "by " + esc(inv.by) + " " : "") + new Date(inv.at).toLocaleString() + ". Invitations last " + INVITE_DAYS + " days.'>✉ invited " + ago(inv.at) + "</span>"
            : "<button type='button' class='inv' data-invite='" + esc(p.id) + "'" + (job && job.running ? " disabled" : "") + ">Invite</button>";
          return "<tr" + (inv ? " class='done'" : "") + "><td>" + (p.rank || "") + "</td><td><button type='button' class='name' data-copy='" + esc(p.name) + "' title='Copy name'>" + esc(p.name)
            + (copied === p.name ? " <span class='idle'>copied ✓</span>" : "") + "</button></td><td>" + esc(SPECS[p.spec] || p.spec || "?") + "</td><td>" + p.level + "</td><td>" + p.honor.toLocaleString("en-US") + "</td>"
            + "<td" + (g && g.lv > 0 ? " class='up'" : "") + ">" + gt + "</td><td>" + it + "</td><td><a href='/game/player/" + encodeURIComponent(p.id) + "' title='Open profile'>👤</a></td></tr>";
        }).join("") : "<tr><td colspan='8' style='text-align:center'>Nobody matches these filters.</td></tr>")
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
    var users = [], hours = Math.round((reset - now) / HOUR), t = Math.round(reset / 1000);
    var text = under.length
      ? "⏰ **" + (hours >= 1 ? hours + " hour" + (hours === 1 ? "" : "s") : "Less than an hour") + " left** to reach 100 activity today! (reset <t:" + t + ":t>)\n"
        + under.map(function (m) { return "• " + who(s, m, users) + " — " + m.today + "/100"; }).join("\n")
        + "\nToday's activity decides tomorrow's family bonus. Let's go! 💪"
      : "🎉 **Everyone has reached 100 activity today!** What a family! 💯";
    var msg = shout(text, users);
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
  function ranksHtml(s) {
    var a = rankAdvice(s), h = "";
    h += "<div class='st'>Based on the last " + a.days + " saved day" + (a.days === 1 ? "" : "s") + " (of " + ADVICE_DAYS + ") and " + a.wars + " tracked war" + (a.wars === 1 ? "" : "s") + ". Suggestions only; you decide.</div>";
    if (a.days < ADVICE_MIN_DAYS) { h += "<div class='st wait'>Promotions need at least " + ADVICE_MIN_DAYS + " saved days of history (" + a.days + " so far). Capo checks already work.</div>"; }
    if (s.webhook && (a.ready.length || a.check.length)) { h += "<div class='row'><button type='button' data-postranks>Post to leadership chat</button></div>"; }
    var block = function (title, list, empty) {
      return "<div class='st' style='color:var(--fg)'><b>" + title + "</b></div>" + (list.length ? "<table class='adv'><tbody>" + list.map(function (r) {
        return "<tr><td>" + esc(r.m.name) + " <span class='idle'>" + esc(RANKS[r.m.rank] || r.m.rank) + " · lv " + r.m.level + "</span></td><td>" + esc(a.why(r)) + "</td></tr>";
      }).join("") + "</tbody></table>" : "<div class='st'>" + empty + "</div>");
    };
    h += block("⬆️ Ready for Capo", a.ready, "Nobody yet: Soldiers need 100+ on 80% of their days and 75% war attendance.");
    h += block("👀 Capos to check", a.check, "All Capos are doing fine.");
    return h;
  }
  function postRanks() {
    var s = load(), a = rankAdvice(s), line = function (r) { return "**" + md(r.m.name) + "** (lv " + r.m.level + ") — " + a.why(r); };
    if (!s.webhook) { return Promise.resolve(); }
    return postFor("ranks", s.webhook, {
      username: "Syndicate Activity", allowed_mentions: { parse: [] },
      embeds: [{
        title: "👑 Rank suggestions",
        description: ("⬆️ **Ready for Capo**\n" + (a.ready.length ? a.ready.map(line).join("\n") : "Nobody yet.")
          + "\n\n👀 **Capos to check**\n" + (a.check.length ? a.check.map(line).join("\n") : "All Capos are doing fine.")).slice(0, 4000),
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
        if (until > b.until) { fam.push("🚀 **+" + pct + "% " + name + " boost** is active for the whole family until <t:" + t + ":f>! Time to grind! 💪"); }
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
    if (fam.length && s.lvHook) { postFor("boostfam", s.lvHook, shout(fam.join("\n"))); }
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
  var DON_SHOUTS = [
    [10000, "👑💰 **{gold} GOLD** 💰👑\n{who} just made a LEGENDARY donation to the family treasury! The whole family salutes you! 🙇🏆"],
    [2000, "💎 {who} donated **{gold} gold** to the family treasury! That's huge, thank you! 🙌🔥"],
    [DON_MIN, "💰 {who} donated **{gold} gold** to the family treasury. Thank you! 🙏"]];
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
        var tpl = DON_SHOUTS.filter(function (x) { return gold >= x[0]; })[0][1];
        return tpl.replace("{who}", who(s2, m, users)).replace("{gold}", gold.toLocaleString("en-US"));
      }).join("\n\n");
      postFor("donation", s2.lvHook, shout(text, users), function () { var n = load(); n.donSeen = seen; save(n); });
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
    var ours = ourAttack(); // the buttons are hidden then, this catches a panel that hadn't redrawn yet
    if (ours) { alert("We already have an attack planned on " + nameOf(ours.defender) + ". The game allows one at a time."); redraw(); return; }
    if (s.autoAttack) { alert("An attack on " + s.autoAttack.name + " is already armed. Cancel it first to pick another family."); redraw(); return; }
    var c = t.ratio ? chance(s, t.ratio) : null;
    var q = (now ? "Declare war on " + t.name + " now?" : "Declare war on " + t.name + " automatically as soon as they can be attacked" + (t.freeAt ? " (expected " + clock(t.freeAt) + ")" : "") + "?")
      + (c != null ? "\n\nWin chance ~" + c + "%." : "")
      + (now ? "" : "\n\nThe game has to stay open on this PC until then.");
    if (!confirm(q)) { return; }
    s.autoAttack = { id: t.id, name: t.name, freeAt: now ? Date.now() : t.freeAt || Date.now(), armedAt: Date.now(), chance: c };
    save(s); attackAt = 0; attackNote = "";
    if (!now && s.webhook) { postFor("autoattack", s.webhook, shout("⏰ **Auto-attack armed:** war on **" + md(t.name) + "** will be declared as soon as they're free" + (t.freeAt ? " (<t:" + Math.round(t.freeAt / 1000) + ":R>)" : "") + (c != null ? ", ~" + c + "% win chance" : "") + ".")); }
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
    if (ours && ours.defenderId !== a.id) { finishAttack(false, "we already have an attack planned on " + nameOf(ours.defender) + ", and only one at a time is allowed."); return; }
    if (ours) { finishAttack(true, "war on " + a.name + " is planned."); return; } // declared already (by us or by hand)
    if (now > a.freeAt + ATTACK_GIVEUP) { finishAttack(false, "still not attackable 30 minutes after the expected time" + (a.why ? " (the game said: " + a.why + ")" : "") + "."); return; }
    attackBusy = true; attackAt = now + ATTACK_POLL;
    var why = function (text) { var n = load(); if (n.autoAttack) { n.autoAttack.why = text; save(n); } };
    familyFresh(a.id).then(function (f) {
      var wd = f && f.warDeclaration;
      if (!wd || wd.blocked) { why(wd ? String(wd.blocked) : "their family page didn't say"); return; }
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
      return "<div class='st wait'>⏰ Auto-attack armed on <b>" + esc(a.name) + "</b>: "
        + (Date.now() < a.freeAt - ATTACK_LEAD ? "declaring as soon as they're free, " + inTime(a.freeAt) : "trying now" + (a.why ? " (the game says: " + esc(a.why) + ")" : "") + "…")
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
    + "#ID input.msearch{margin:8px 0 2px;font-family:inherit}#ID .remind{display:flex;align-items:center;gap:8px;margin:6px 0 2px;font-size:11px;color:var(--muted)}"
    + "#ID .seg{display:inline-flex;border:1px solid var(--strong);border-radius:6px;overflow:hidden}#ID .seg button{border:0;border-radius:0;padding:5px 8px}#ID .seg button+button{border-left:1px solid var(--strong)}#ID .seg button.on{background:var(--accent);color:var(--on-accent)}"
    + "#ID .row{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:8px}"
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
  // u = under 100 today, r = can fight but isn't registered for a planned war, o = online, a = away.
  var memberQuery = "", memberFilter = "", trendId = "";
  function nameMatch(lower) { var q = memberQuery.trim().toLowerCase(); return !q || lower.indexOf(q) >= 0; }
  function rowShown(lower, flags) { return nameMatch(lower) && (!memberFilter || flags.indexOf(memberFilter) >= 0); }
  function memberFlags(s, m, su) {
    var miss = ["attack", "defense"].some(function (k) { return su[k] && unregistered(s, [m], su[k]).length; });
    return (m.today < FULL ? "u" : "") + (miss ? "r" : "") + (m.online ? "o" : "") + (awayUntil(s, m.id) ? "a" : "");
  }
  function filterHtml(list, flags, su) {
    var count = function (f) { return list.filter(function (m) { return flags[m.id].indexOf(f) >= 0; }).length; };
    return "<div class='mfilters'>" + [["", "All", list.length], ["u", "Under 100", count("u")], ["r", "Not registered", count("r")], ["o", "Online", count("o")], ["a", "Away", count("a")]].map(function (o) {
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
      trez = "<div class='trez" + (missing > 0 ? " bad" : "") + "'>🪙 Treasury <b>" + gold.toLocaleString("en-US") + "</b>" + (price ? " · +" + AUTO_PCT + "% costs <b>" + price.toLocaleString("en-US") + "</b>" : "")
        + (price && soon && missing > 0 ? " · ⚠️ " + missing.toLocaleString("en-US") + " missing for " + (soon > 1 ? "both boosts" : "the renewal") : price && soon ? " · ✅ renewal covered" : "") + "</div>";
    }
    return "<div class='boosts'>" + rows + trez + "</div>";
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
    var msg = shout("📣 **War sign-up reminder**\n" + lines.join("\n") + "\nRegister on the Family tab in the game. Every fighter counts! 💪", users);
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
    var s = load(), sortBy = SORTS[s.sort] ? s.sort : "today", html = "<style>" + css.replace(/#ID/g, "#" + ID) + "</style>";
    var close = "<button type='button' class='icon' data-close title='Close'>&times;</button>";
    box.className = city() + (s.min ? " min" : "");
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
    if (view !== "activity") { box.className += " wide"; }
    html += "<div class='top' title='" + DRAG_TIP + "'><span class='t grow'>" + ({ recruits: "Recruits", planner: "War planner", ranks: "Rank suggestions", activity: "Activity" }[view]) + "</span>"
      + (view !== "activity" ? "" : "<span class='seg'>" + Object.keys(SORTS).map(function (k) { return "<button type='button' data-sort='" + k + "' class='" + (k === sortBy ? "on" : "") + "'>" + SORTS[k] + "</button>"; }).join("") + "</span>")
      + "<button type='button' class='icon vol' data-vol title='Game sound volume (this PC)'>" + (volume === 0 ? "🔇" : volume < 50 ? "🔉" : "🔊") + " " + volume + "%</button>"
      + "<button type='button' class='icon' data-min title='Minimize'>&ndash;</button>" + close + "</div>";
    if (showVol) {
      // While the slider has focus the panel doesn't redraw (see tick), so dragging isn't interrupted.
      html += "<div class='volrow'><span>Game sound</span><input type='range' min='0' max='100' step='1' value='" + volume + "' data-volslider>"
        + "<b class='vv'>" + (volume ? volume + "%" : "Off") + "</b></div>";
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
      html += boostHtml(s) + remindHtml(s, list, su);
      html += "<input type='search' class='msearch' data-msearch placeholder='Search members…' value='" + esc(memberQuery) + "' autocomplete='off'>";
      var flags = {};
      list.forEach(function (m) { flags[m.id] = memberFlags(s, m, su); });
      html += filterHtml(list, flags, su);
      var key = sortBy === "levels" ? function (m) { return m.levels || 0; } : function (m) { return m[sortBy]; };
      list.sort(function (a, b) { return key(b) - key(a) || b.today - a.today || b.level - a.level; });
      var th = function (k, label, tip) { return "<th" + (k === sortBy ? " class='on'" : "") + (tip ? " title='" + tip + "'" : "") + ">" + label + "</th>"; };
      html += "<table class='mem'><thead><tr><th>#</th><th>Member</th><th></th>" + th("today", "Today") + th("yesterday", "Yday") + "<th>Level</th>"
        + th("levels", "+Lv", "Levels gained today") + "</tr></thead><tbody>";
      var mid = dayStart(Date.now()), att = trendId ? attendance(s, list) : null, shown = 0;
      list.forEach(function (m, i) {
        var nm = esc(m.name.toLowerCase()), attrs = "data-name='" + nm + "' data-f='" + flags[m.id] + "'" + (rowShown(m.name.toLowerCase(), flags[m.id]) ? "" : " style='display:none'"), open = trendId === m.id;
        if (rowShown(m.name.toLowerCase(), flags[m.id])) { shown++; }
        html += "<tr data-mid='" + esc(m.id) + "' " + attrs + (open ? " class='open'" : "") + " title='Click for the 14-day trend'><td>" + (i + 1) + "</td><td class='nm'><span class='dot" + (m.online ? " on" : "") + "' title='" + (m.online ? "Online" : "Offline") + "'></span>"
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
        return "<div class='st bad'>Couldn't post " + ({ streak: "a streak shout-out", famlv: "the family level-up", month: "the monthly awards", alerts: "a family alert", planner: "the war planner", recruits: "the recruit list", boost: "a boost reminder", boostfam: "the boost news", debrief: "the war debrief", attendance: "the war attendance", evening: "the evening reminder", recruitalert: "the new-recruit alert", ranks: "the rank suggestions", record: "the new-record shout-out", version: "the update notes", autoattack: "an auto-attack note", rush: "the level-rush shout-out", donation: "a donation shout-out", autoboost: "an auto-renew note" }[k] || k)
          + ": " + esc(fails[k]) + ". Trying again in a few minutes.</div>";
      }).join("")
      + (s.boardHook ? "<div class='st " + (boardError ? "bad" : "ok") + "'>" + (boardError ? "Couldn't update the leaderboard: " + esc(boardError) + "."
        : "🏆 Leaderboard " + (s.boardAt ? "updated " + clock(s.boardAt) : "goes up in a moment") + ".") + "</div>" : "")
      + "<div class='row'>"
      + (s.webhook && last ? "<button type='button' data-send" + (sending ? " disabled" : "") + ">" + (s.sentDay === dayKey(dayStart(Date.now()) - 1) ? "Send report again" : "Send report now") + "</button>" : "")
      + "<button type='button' data-setup>" + (showSetup ? "Hide Discord settings" : "Discord settings") + "</button></div>";
    if (showSetup) {
      html += "<div class='setup'>Only one leader needs these. Each Discord channel gets its own webhook: open the channel's settings (gear icon) → <b>Integrations</b> → <b>Webhooks</b> → <b>New Webhook</b> → <b>Copy Webhook URL</b>, and paste it below."
        + "<div class='row'><button type='button' data-backup>Download backup</button><button type='button' data-restore>Restore backup</button></div>"
        + backupHtml(s)
        + "<div style='font-size:11.5px;color:var(--muted);margin-top:4px'>The backup holds the webhooks, Discord links and history. Keep it private: anyone with it can post in your channels.</div>"
        + hookBlock("report", "Leadership chat: daily report, weekly summary (Mondays), join / leave / inactive alerts", s.webhook, s.webhook ? "<button type='button' data-weekly" + (sending ? " disabled" : "") + ">Send weekly summary</button>" : "")
        + hookBlock("board", "Leaderboard (one message, kept up to date, with family level)", s.boardHook, "")
        + hookBlock("level", "Family chat: level milestones, 500 / 1,000 shout-outs, 100+ streaks, donations of 500+ gold, family level-ups, monthly awards", s.lvHook,
          (last ? "<button type='button' data-links>Link members to Discord (" + members(last.fam).filter(function (m) { return s.links && s.links[m.id]; }).length + "/" + last.fam.members.length + ")</button>" : "")
          + (s.lvHook && last ? "<button type='button' data-awards>Send awards so far</button>" : ""))
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
  function plannerHtml(s) {
    var sc = s.scan, us = summary(last.fam), h = "";
    h += "<div class='stats' style='grid-template-columns:repeat(3,1fr)'>"
      + "<div class='stat'><b>" + us.strength.toLocaleString("en-US") + "</b><span>our strength</span></div>"
      + "<div class='stat'><b>" + us.avg + "</b><span>avg member level</span></div>"
      + "<div class='stat'><b>" + (sc ? "#" + sc.own : "–") + "</b><span>our rank" + (sc ? " (can attack " + Math.max(1, sc.own - WINDOW) + "–" + (sc.own + WINDOW) + ")" : "") + "</span></div></div>";
    var ours = warsOf(last.fam).filter(function (w) { return w.status === "preparing" && w.attackerId === last.fam.id; });
    if (ours.length) { h += "<div class='st wait'>We already have an attack planned on " + esc(nameOf(ours[0].defender)) + (startOf(ours[0]) > Date.now() ? ": battle " + inTime(startOf(ours[0])) : "") + ". The next attack can be planned after that battle.</div>"; }
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
            : armed || ours.length ? "" // one attack at a time: the planned or armed one has to be fought or cancelled first
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
  function setDock(w) {
    if (w === dockNow) { return; }
    dockNow = w;
    if (!dockStyle) { dockStyle = document.createElement("style"); document.head.appendChild(dockStyle); }
    dockStyle.textContent = !w ? "" : "body > div:not(#" + ID + "):not([data-portal]):not([data-syn-tip]){width:calc(100% - " + w + "px)!important;transform:translateX(0)}"
      + ".mantine-Modal-inner{width:calc(100% - " + w + "px)!important}";
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
    if (t.hasAttribute("data-msearch")) { memberQuery = t.value; applyMemberFilter(); }
  }
  function onChange(ev) {
    var t = ev.target, k = t && t.getAttribute && t.getAttribute("data-rf");
    if (t && t.hasAttribute && t.hasAttribute("data-volslider")) { var sv = load(); sv.volume = +t.value; save(sv); setVolume(sv.volume); t.blur(); redraw(); return; }
    if (t && t.hasAttribute && t.hasAttribute("data-ra")) { var s0 = load(); s0.recruitAlertMin = Math.max(0, parseInt(t.value, 10) || 0); save(s0); t.blur(); redraw(); return; }
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
      sendNow(s.lvHook, { username: "Syndicate Activity", allowed_mentions: { parse: [], users: pinged },
        content: "🧪 **Test** (not real, just showing what the posts look like):\n" + line + "\n\n" + activityLine(s, member, 500, pinged) + "\n\n" + activityLine(s, member, 1000, pinged) })
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

  // Runs every few seconds on every game page: keeps the latest family numbers, tracks today's levels,
  // sends the daily report, and shows the panel on the Family tab only.
  function tick() {
    var path = location.pathname.replace(/\/+$/, "");
    if (path !== lastPath) { lastPath = path; if (path === PAGE) { closed = false; } } // closed stays closed until the Family tab is opened again
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
    checkEvening();
    autoRecruits();
    checkRecord();
    backfillWars();
    backfillAttendance();
    catchUpLog();
    keepFresh();
    heartbeat();
    checkOffline();
    checkStuck();
    tabTitle();
    // The docked panel stays on every game page; a floating one (too little room, or dragged away) only shows on the Family tab.
    if (closed || path !== PAGE && !(/^\/game(\/|$)/.test(path) && wouldDock())) { if (box) { box.remove(); box = null; tipX = -1; showTip(); } setDock(0); lastKey = ""; return; }
    loadOwnFamily(path);
    if (drag) { return; }
    if (box && document.activeElement && box.contains(document.activeElement) && document.activeElement.tagName === "INPUT") { return; } // don't wipe what's being typed
    if (showLinks && box && document.body.contains(box) && lastKey) { return; } // nor unsaved links while that list is open
    var s = load(); delete s.seen; delete s.lock; delete s.pos; delete s.hist; delete s.recruitHist; delete s.boardLock; delete s.weekLock;
    var key = JSON.stringify(last && last.fam.members) + JSON.stringify(last && warsOf(last.fam)) + JSON.stringify(s) + sending + error + note + diag
      + warBusy + warError + boardBusy + boardError + lvError + apError + JSON.stringify(fails) + JSON.stringify(last && famProgress(last.fam)) + showSetup + showLinks + showPlanner + showRecruits + showRanks + showVol + memberFilter + trendId + copied + JSON.stringify(scanning) + JSON.stringify(recruiting) + city() + Math.floor(Date.now() / 60000);
    if (box && document.body.contains(box) && key === lastKey) { return; }
    lastKey = key;
    draw();
  }
  var resizeTimer = 0;
  window.addEventListener("resize", function () { place(); clearTimeout(resizeTimer); resizeTimer = setTimeout(tick, 200); }); // shows or hides the panel when the room for docking changes
  setInterval(tick, 3000);
  tick();
}
