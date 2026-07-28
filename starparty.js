/* =====================================================
   STAR PARTY — board-game trivia + wildcard wheel
   2–6 local players (human or CPU) on one device.

   ARCHITECTURE (3 layers, kept separate on purpose):
     1) TURN ENGINE  — fixed random turn order, 8 rounds,
        who's up, when a round/the game ends.
     2) EFFECT ENGINE — a generic dispatch table
        (SP_EFFECTS[effect_type]) so a brand-new wildcard
        that reuses one of the 6 existing effect_types only
        needs a JSON entry, never a code change.
     3) UI — the "table" (seats around a felt), the center
        stage (turn splash → risk → question → wheel →
        reveal), and the final standings.

   Data: STARPARTY_QUESTIONS (starparty_questions.js),
         STARPARTY_WILDCARDS (starparty_wildcards.js, v2 —
         includes wheel_slices + wheel_config).
   Shared helpers ($ , $$ , showScreen, randomItem, shuffle)
   come from app.js, which loads first.
   ===================================================== */

const SP_TOTAL_ROUNDS = 8; // default; overridable per game via the setup rounds selector
const SP_ROUND_OPTIONS = [5, 6, 7, 8, 9, 10];
const SP_SEAT_COLORS = ["#a855f7", "#22c55e", "#f59e0b", "#ef4444", "#38bdf8", "#ec4899"];
// the three risk levels map 1:1 to the three question tiers
const SP_RISKS = [
  { stars: 1, tier: "basic", cls: "risk-1", name: "Basic" },
  { stars: 3, tier: "intermediate", cls: "risk-3", name: "intermediate" },
  { stars: 5, tier: "advanced", cls: "risk-5", name: "Advance" },
];
// how often a CPU answers correctly, per tier
const SP_CPU_ACCURACY = { basic: 0.9, intermediate: 0.6, advanced: 0.35 };

const SP_WC = STARPARTY_WILDCARDS;            // wildcard bank (v3)
const SP_WC_COLORS = SP_WC.wildcard_colors;   // { good, bad, neutral }
const SP_Q = STARPARTY_QUESTIONS.questions;   // { basic, intermediate, advanced }

// wildcards grouped by category — the two-step wheel lands on a COLOR, then we
// pick one of that category's wildcards at random (equiprobable within the color)
const SP_WC_BY_CAT = SP_WC.wildcards.reduce((m, w) => {
  (m[w.category] = m[w.category] || []).push(w);
  return m;
}, {});
const SP_CATS = ["good", "bad", "neutral"];

// thematic emoji per wildcard id, for the reveal card's icon box (C2). New wildcards
// without an entry fall back to a sensible per-category default.
const SP_WC_ICONS = {
  neutral_redistribute: "⚖️",
  neutral_shift: "🔁",
  bad_next_turn_penalty: "☠️",
  good_all_give_3: "🎁",
  good_steal_5: "🦹",
  good_steal_10: "🥷",
  good_double_or_half: "⚡",
  good_birthday: "🎂",
  good_exchange: "🔄",
  neutral_reverse: "↩️",
  neutral_next_player_penalty: "⚔️",
  neutral_triple_stakes: "🎰",
  neutral_shuffle: "🔀",
  neutral_coin_duel: "🪙",
  neutral_curse_wheel: "🌀",
  neutral_double_down: "🃏",
  neutral_round_jackpot: "🎲",
  bad_robin_hood: "🏹",
  bad_downgrade: "📉",
  bad_coin_gamble: "🪙",
};
const SP_WC_ICON_FALLBACK = { good: "✨", bad: "💀", neutral: "🎯" };
const spWcIcon = (w) => SP_WC_ICONS[w.id] || SP_WC_ICON_FALLBACK[w.category] || "❓";
const SP_SLICES_PER_CAT = (SP_WC.wheel_config && SP_WC.wheel_config.slices_per_category) || { good: 4, bad: 4, neutral: 4 };

// ---------- pacing knobs (ms) ----------
const SP_CPU_THINK_MIN = 3000, SP_CPU_THINK_MAX = 5000; // bots "think" 3–5s
const SP_SPIN_MIN = 5000, SP_SPIN_MAX = 7000;           // wheel spins 5–7s
const SP_READ_WILDCARD = 2800;   // pause to read the revealed wildcard
const SP_READ_AFTER_EFFECT = 2000; // pause after an effect resolves
const SP_READ_ANSWER = 2100;     // pause to read the question result
const SP_TRANSITION = 1500;      // turn splash
const SP_POP_MS = 450;           // wheel pop-out duration
const SP_COIN_MS = 5000;         // coin flip duration (~5s, ARREGLO 6)
const SP_OK_TIMEOUT = 15000;     // auto-advance after the wheel reveal (ARREGLO 8)
const SP_FLY_MS = 850;           // star-transfer flight duration (ARREGLO 4)
const SP_READ_STEP = 1200;       // reading pause between multi-step sequences
const spRand = (min, max) => min + Math.random() * (max - min);

let sp = null;         // whole game state (null when not in a game)
let spTimers = [];     // pending timeouts, so we can cancel on leave/restart
let spSetupCount = 4;  // remembered player count on the setup screen
let spSetupRounds = 8; // remembered round count on the setup screen
let spSetupPlayers = []; // remembered { name, type } rows on the setup screen

// ---------- tiny helpers ----------
const spSeatColor = (i) => SP_SEAT_COLORS[i % SP_SEAT_COLORS.length];
function spTimeout(fn, ms) { const id = setTimeout(fn, ms); spTimers.push(id); return id; }
function spClearTimers() {
  spTimers.forEach(clearTimeout);
  spTimers = [];
  if (typeof spMgClear === "function") spMgClear(); // minigame intervals die with the turn
}
function spEl(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
function spEsc(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
const spCurrentPlayer = () => (sp ? sp.players[sp.order[sp.turnPtr]] : null);
const spActivePlayers = () => sp.players.filter((p) => p.active);

// ---------- central star mutations (feed the ROUND JACKPOT pot) ----------
// EVERY star change in the game goes through here so the per-round pot can
// accumulate total gains (positive deltas) and total losses (abs of negatives).
function spAddStars(player, delta) {
  if (!delta) return;
  player.stars += delta;
  if (delta > 0) sp.roundGains += delta;
  else sp.roundLosses += -delta;
}
// set to an absolute value, recorded as the equivalent delta
function spSetStars(player, value) { spAddStars(player, value - player.stars); }
function spSetCenter(node) {
  const c = $("#sp-center");
  c.classList.remove("sp-mode-wheel"); // wheel widens the stage; every other view is normal width
  c.innerHTML = "";
  if (typeof node === "string") c.innerHTML = node;
  else if (node) c.appendChild(node);
}

/* =====================================================
   SETUP SCREEN
   ===================================================== */
function spOpenSetup() {
  spClearTimers();
  sp = null;
  $("#sp-table").classList.add("hidden");
  $("#sp-end").classList.add("hidden");
  $("#sp-setup").classList.remove("hidden");
  spRenderCountButtons();
  spRenderRoundButtons();
  spRenderPlayerRows();
  showScreen("#screen-starparty");
}

function spRenderCountButtons() {
  const wrap = $("#sp-count-btns");
  wrap.innerHTML = "";
  for (let n = 2; n <= 6; n++) {
    const b = spEl("button", "sp-count-btn" + (n === spSetupCount ? " active" : ""), String(n));
    b.addEventListener("click", () => {
      spSetupCount = n;
      spRenderCountButtons();
      spRenderPlayerRows();
    });
    wrap.appendChild(b);
  }
}

function spRenderRoundButtons() {
  const wrap = $("#sp-rounds-btns");
  if (!wrap) return;
  wrap.innerHTML = "";
  SP_ROUND_OPTIONS.forEach((n) => {
    const b = spEl("button", "sp-count-btn" + (n === spSetupRounds ? " active" : ""), String(n));
    b.addEventListener("click", () => { spSetupRounds = n; spRenderRoundButtons(); });
    wrap.appendChild(b);
  });
}

function spEnsureSetupPlayers() {
  while (spSetupPlayers.length < spSetupCount) {
    const i = spSetupPlayers.length;
    // first two default to Human, the rest to CPU (easy mixed games)
    spSetupPlayers.push({ name: "Player " + (i + 1), type: i < 2 ? "human" : "cpu" });
  }
}

function spRenderPlayerRows() {
  spEnsureSetupPlayers();
  const wrap = $("#sp-player-rows");
  wrap.innerHTML = "";
  for (let i = 0; i < spSetupCount; i++) {
    const p = spSetupPlayers[i];
    const row = spEl("div", "sp-player-row");

    const dot = spEl("span", "sp-seat-dot");
    dot.style.background = spSeatColor(i);

    const input = spEl("input", "sp-name-input");
    input.type = "text";
    input.maxLength = 14;
    input.value = p.name;
    input.placeholder = "Player " + (i + 1);
    input.addEventListener("input", () => { p.name = input.value; });

    const toggle = spEl("button", "sp-type-toggle " + (p.type === "cpu" ? "is-cpu" : "is-human"));
    const paint = () => {
      toggle.className = "sp-type-toggle " + (p.type === "cpu" ? "is-cpu" : "is-human");
      toggle.textContent = p.type === "cpu" ? "🤖 CPU" : "🧑 Human";
    };
    paint();
    toggle.addEventListener("click", () => {
      p.type = p.type === "cpu" ? "human" : "cpu";
      paint();
    });

    row.append(dot, input, toggle);
    wrap.appendChild(row);
  }
}

/* =====================================================
   START A GAME
   ===================================================== */
function spStartGame() {
  spClearTimers();
  const players = spSetupPlayers.slice(0, spSetupCount).map((p, i) => ({
    id: i,
    name: (p.name || "").trim().slice(0, 14) || "Player " + (i + 1),
    type: p.type,
    color: spSeatColor(i),
    stars: 0,
    deferred: null, // at most ONE pending deferred effect at a time
    active: true,   // no elimination in the 8-round format, but kept for effect-engine clarity
  }));

  sp = {
    players,
    order: shuffle(players.map((p) => p.id)), // fixed random turn order for the whole game
    turnPtr: 0,
    dir: 1,          // turn direction (+1 / -1); REVERSE wildcard toggles it
    turnsTaken: 0,   // total turns played; game lasts SP_TOTAL_ROUNDS * players turns
    round: 1,
    totalRounds: spSetupRounds, // chosen on the setup screen (5–10, default 8)
    used: { basic: new Set(), intermediate: new Set(), advanced: new Set() },
    wheelColors: spBuildWheel(), // fixed 12 color-only sectors (4 good / 4 bad / 4 neutral)
    phase: "idle",
    question: null,
    risk: null,
    // ---- SP 2.0 multi-minigame state ----
    roundGame: null,   // minigame id chosen by the slot for the CURRENT round
    prevRoundGame: null, // the slot never repeats the previous round's game
    slotRound: 0,      // which round the slot has already spun for
    mgUsed: {},        // per-round used-content sets, keyed by minigame id
    tripleRound: 0,    // TRIPLE OR NOTHING: the round number where EVERYTHING is x3
    // ROUND JACKPOT pot: accumulated positive gains / absolute losses this round.
    // Every star change routes through spAddStars/spSetStars, which feed these.
    roundGains: 0,
    roundLosses: 0,
    roundTracked: 1, // which round the counters above belong to (reset on a new round)
  };

  $("#sp-setup").classList.add("hidden");
  $("#sp-end").classList.add("hidden");
  $("#sp-table").classList.remove("hidden");

  spRenderSeats();
  spUpdateRoundHud();
  spBeginTurn();
}

/* =====================================================
   TURN ENGINE
   ===================================================== */
function spBeginTurn() {
  sp.round = Math.floor(sp.turnsTaken / sp.order.length) + 1;
  // a genuinely new round resets the ROUND JACKPOT pot counters
  if (sp.round !== sp.roundTracked) {
    sp.roundGains = 0;
    sp.roundLosses = 0;
    sp.roundTracked = sp.round;
  }
  spUpdateSeats();
  spUpdateRoundHud();
  // SP 2.0: a NEW round starts with the SLOT choosing this round's minigame
  if (sp.round !== sp.slotRound) {
    spRunSlot(spBeginTurnSplash);
    return;
  }
  spBeginTurnSplash();
}

function spBeginTurnSplash() {
  const p = spCurrentPlayer();
  sp.phase = "transition";
  const box = spEl("div", "sp-transition");
  box.innerHTML =
    `<div class="sp-trans-sub">${p.type === "cpu" ? "🤖 CPU" : "🧑 Human"}</div>
     <div class="sp-trans-name" style="color:${p.color}">${spEsc(p.name)}</div>
     <div class="sp-trans-tag">it's your turn</div>`;
  spSetCenter(box);

  // AMBUSH: a pending penalty planted by the previous player fires now, BEFORE the question
  if (p.pendingPenalty) {
    const amt = p.pendingPenalty;
    p.pendingPenalty = 0;
    spTimeout(() => {
      spAddStars(p, -amt);
      spUpdateSeats();
      const bang = spEl("div", "sp-ambush-alert");
      bang.innerHTML = `💥 <b>${spEsc(p.name)}</b> was ambushed!<span class="sp-ambush-amt">-${amt}${spStarIcon(18)}</span>`;
      spSetCenter(bang);
      spTimeout(spBeginRisk, 2200);
    }, SP_TRANSITION);
    return;
  }
  spTimeout(spBeginRisk, SP_TRANSITION);
}

/* =====================================================
   SP 2.0 — THE SLOT (start of every round)
   Picks this round's minigame: uniform among the 6, but
   never the same game as the immediately previous round.
   ===================================================== */
function spRunSlot(cb) {
  sp.phase = "slot";
  const candidates = SP_MG_IDS.filter((id) => id !== sp.prevRoundGame);
  const target = randomItem(candidates);
  const box = spEl("div", "sp-slot-stage");
  box.innerHTML = `<div class="sp-center-title">🎰 Round ${sp.round} — what are we playing?</div>` + spSlotHTML();
  spSetCenter(box);
  spSlotDecorate(box);
  spSlotSpin(target, () => {
    sp.roundGame = target;
    sp.prevRoundGame = target;
    sp.slotRound = sp.round;
    sp.mgUsed = {}; // fresh no-repeat content pool for the new round
    spUpdateRoundHud();
    spFlash(`🎰 This round: <b>${SP_MINIGAMES[target].name}</b>`);
    cb();
  });
}

function spAdvanceTurn() {
  sp.turnsTaken++;
  // the game is a fixed length: sp.totalRounds full laps, regardless of REVERSE
  if (sp.turnsTaken >= sp.totalRounds * sp.order.length) {
    spEndGame();
    return;
  }
  const n = sp.order.length;
  sp.turnPtr = (sp.turnPtr + sp.dir + n) % n; // move in the current direction
  spBeginTurn();
}

// the player who will go right after the current one (respecting REVERSE direction)
function spNextPlayer() {
  const n = sp.order.length;
  const idx = (sp.turnPtr + sp.dir + n) % n;
  return sp.players[sp.order[idx]];
}

/* =====================================================
   PHASE 1 — RISK (choose how many stars to wager)
   The buttons show the REAL win/lose values, which change when the player has
   an active stars-modifying deferred effect (Cursed Turn / High Stakes / Triple).
   ===================================================== */
// what a tier will actually pay this player right now (honors deferred effects, no consume)
function spTierOutcome(player, tier, stars) {
  const d = player.deferred;
  let o;
  if (d && d.type === "penalty_table") {
    const row = d.table[tier];
    o = {
      correct: row.stars_if_correct * row.stars_if_correct_sign,
      wrong: row.stars_if_wrong * row.stars_if_wrong_sign,
      modName: d.name,
    };
  } else if (d && d.type === "multiplier") {
    o = { correct: Math.round(stars * d.win), wrong: -Math.round(stars * d.lose), modName: d.name };
  } else if (d && d.type === "forced_advanced") {
    // DOUBLE DOWN: outcome REPLACES normal scoring and depends on current total.
    // correct → double (or reset a negative to 0); wrong → drop to 0 (or double a negative down)
    const s = player.stars;
    return {
      correct: s >= 0 ? s : -s,       // delta to reach 2s (>=0) or 0 (neg)
      wrong: s > 0 ? -s : s,          // delta to reach 0 (>0) or 2s (<=0)
      modName: d.name,
      forced: true,
    };
  } else {
    o = { correct: stars, wrong: -stars, modName: "" };
  }
  // TRIPLE OR NOTHING (SP 2.0): the WHOLE round after the wildcard is x3 for
  // everyone — win or lose (Double Down's replace-scoring is exempt above).
  if (sp && sp.tripleRound === sp.round) {
    o.correct *= 3;
    o.wrong *= 3;
    o.modName = o.modName ? o.modName + " · x3 ROUND" : "TRIPLE OR NOTHING x3";
  }
  return o;
}
const spSignCls = (n) => (n > 0 ? "pos" : n < 0 ? "neg" : "zero");
const spFmt = (n) => (n > 0 ? "+" + n : String(n));

// fixed, hand-placed star layouts (percent coords within the box + a pixel size
// each) so 3 and 5 stars fall into the same irregular/diagonal clumps as the
// reference design, sized big enough to fill most of the box (not tiny dots)
const SP_BET_STAR_LAYOUTS = {
  1: [{ x: 50, y: 50, r: 0, size: 58 }],
  3: [
    { x: 50, y: 30, r: -8, size: 36 },
    { x: 26, y: 74, r: 10, size: 34 },
    { x: 74, y: 76, r: -6, size: 36 },
  ],
  5: [
    { x: 30, y: 24, r: -10, size: 29 },
    { x: 70, y: 26, r: 8, size: 30 },
    { x: 50, y: 55, r: -4, size: 26 },
    { x: 23, y: 78, r: 12, size: 29 },
    { x: 77, y: 80, r: -9, size: 30 },
  ],
};

// a "chubby" 5-point star with rounded tips (quadratic-bezier-rounded polygon,
// built from 10 vertices) — a plain "★" glyph has sharp pointed tips, this doesn't
const SP_STAR_PATH =
  "M 43.36 15.45 Q 50.00 2.00 56.64 15.45 L 60.57 23.41 Q 64.11 30.58 72.02 31.73 " +
  "L 80.81 33.01 Q 95.65 35.17 84.91 45.64 L 78.55 51.83 Q 72.83 57.42 74.18 65.30 " +
  "L 75.68 74.05 Q 78.21 88.83 64.94 81.85 L 57.08 77.72 Q 50.00 74.00 42.92 77.72 " +
  "L 35.06 81.85 Q 21.79 88.83 24.32 74.05 L 25.82 65.30 Q 27.17 57.42 21.45 51.83 " +
  "L 15.09 45.64 Q 4.35 35.17 19.19 33.01 L 27.98 31.73 Q 35.89 30.58 39.43 23.41 Z";
let spStarGradSeq = 0;
// THE single reusable star icon — chubby rounded-tip shape, white→lavender radial
// gradient, glow via the shared .sp-star-ico CSS class. EVERY star anywhere in the
// UI (floating over seats, standings, bet boxes, flash messages, flying tokens,
// wheel hub, end screen…) renders through this one function — never a copy.
function spStarIcon(sizePx) {
  const id = "sp-star-grad-" + spStarGradSeq++;
  return (
    `<svg class="sp-star-ico" viewBox="0 0 100 100" width="${sizePx}" height="${sizePx}">` +
    `<defs><radialGradient id="${id}" cx="42%" cy="36%" r="72%">` +
    `<stop offset="0%" stop-color="#ffffff"/>` +
    `<stop offset="55%" stop-color="#f3e8ff"/>` +
    `<stop offset="100%" stop-color="#d9bdf0"/>` +
    `</radialGradient></defs>` +
    `<path d="${SP_STAR_PATH}" fill="url(#${id})"/></svg>`
  );
}
// "N ★" inline helper — a number immediately followed by the star icon, for the
// many flash/toast/label strings that used to just concatenate `${n} ★`
function spStarNum(n, sizePx) {
  return `<span class="sp-star-inline">${n}${spStarIcon(sizePx || 15)}</span>`;
}
function spBetStarsHTML(n) {
  const layout = SP_BET_STAR_LAYOUTS[n] || SP_BET_STAR_LAYOUTS[1];
  return layout
    .map((s) => `<span class="sp-bet-star" style="left:${s.x}%;top:${s.y}%;transform:translate(-50%,-50%) rotate(${s.r}deg)">${spStarIcon(s.size)}</span>`)
    .join("");
}
// clean box + label — matches the reference exactly, no numbers/outcomes shown here
function spRiskBtnInner(r) {
  return (
    `<div class="sp-risk-box"><div class="sp-bet-stars">${spBetStarsHTML(r.stars)}</div></div>` +
    `<span class="sp-risk-label">${spEsc(r.name)}</span>`
  );
}
const SP_THINKING = `<span class="sp-thinking"><span></span><span></span><span></span></span>`;

// small header line naming this round's minigame, shown on the risk screen
function spRoundGameLabel() {
  const mg = SP_MINIGAMES[sp.roundGame || "trivia"];
  return `<div class="sp-round-game">${mg.icon(30)}<span>${mg.name}</span></div>`;
}

function spBeginRisk() {
  const p = spCurrentPlayer();
  sp.phase = "risk";

  // DOUBLE DOWN: no difficulty choice — the round's minigame at forced ADVANCED, double-or-nothing
  if (p.deferred && p.deferred.type === "forced_advanced") {
    const splash = spEl("div", "sp-risk");
    splash.innerHTML =
      `<div class="sp-center-title">🎰 DOUBLE OR NOTHING</div>
       ${spRoundGameLabel()}
       <div class="sp-center-hint">${spEsc(p.name)} must play on ADVANCED. Win = stars double · Lose = down to 0.</div>`;
    spSetCenter(splash);
    spTimeout(() => spPlayTurn(SP_RISKS[2]), 1600); // advanced tier
    return;
  }

  const box = spEl("div", "sp-risk");

  if (p.type === "cpu") {
    box.innerHTML =
      `<div class="sp-center-title">${spEsc(p.name)} is choosing… ${SP_THINKING}</div>` + spRoundGameLabel();
    const row = spEl("div", "sp-risk-btns");
    SP_RISKS.forEach((r) => {
      const b = spEl("span", "sp-risk-btn " + r.cls, spRiskBtnInner(r));
      b.dataset.stars = r.stars;
      row.appendChild(b);
    });
    box.appendChild(row);
    spSetCenter(box);
    const chosen = randomItem(SP_RISKS); // CPU picks difficulty at random
    // part of the bot's 3–5s "thinking" happens here, the rest before it answers
    spTimeout(() => {
      row.querySelectorAll(".sp-risk-btn").forEach((b) => {
        if (Number(b.dataset.stars) === chosen.stars) b.classList.add("picked");
        else b.classList.add("dim");
      });
      spTimeout(() => spPlayTurn(chosen), 700);
    }, spRand(1200, 2000));
    return;
  }

  box.innerHTML = `<div class="sp-center-title">bet how many stars?</div>` + spRoundGameLabel();
  const btns = spEl("div", "sp-risk-btns");
  SP_RISKS.forEach((r) => {
    const b = spEl("button", "sp-risk-btn " + r.cls, spRiskBtnInner(r));
    b.addEventListener("click", () => spPlayTurn(r), { once: true });
    btns.appendChild(b);
  });
  box.appendChild(btns);
  spSetCenter(box);
}

/* =====================================================
   PHASE 2 — QUESTION
   ===================================================== */
function spPickQuestion(tier) {
  const all = SP_Q[tier];
  const used = sp.used[tier];
  let pool = all.filter((q) => !used.has(q.id));
  if (!pool.length) { used.clear(); pool = all.slice(); } // recycle when the tier is exhausted
  const q = randomItem(pool);
  used.add(q.id);
  return q;
}

/* SP 2.0 — the turn plays an INSTANCE of this round's minigame at the tier the
   player bet. Trivia is just one of the six. Win/lose maps to the exact same
   star math as before (spTierOutcome → spComputeStarDelta). */
function spPlayTurn(risk) {
  const p = spCurrentPlayer();
  sp.risk = risk;
  sp.phase = "minigame";
  // token (ARREGLO 3): a resolution can never land on a different player/tier
  // than the one this instance was started for, even from a stale timer.
  sp.questionToken = (sp.questionToken || 0) + 1;
  const myToken = sp.questionToken;

  const gameId = sp.roundGame || "trivia";
  const mg = SP_MINIGAMES[gameId];
  const o = spTierOutcome(p, risk.tier, risk.stars);
  const badgeMod = o.modName ? ` · <span class="sp-q-mod">${spEsc(o.modName)}</span>` : "";

  const box = spEl("div", "sp-question sp-mg-stage");
  box.innerHTML =
    `<div class="sp-q-tier ${risk.cls}">${risk.tier} · <b class="${spSignCls(o.correct)}">✓ ${spFmt(o.correct)}${spStarIcon(13)}</b> <b class="${spSignCls(o.wrong)}">✗ ${spFmt(o.wrong)}${spStarIcon(13)}</b>${badgeMod}</div>` +
    (o.forced ? `<div class="sp-q-easy">🎰 DOUBLE OR NOTHING — win doubles your ${p.stars}${spStarIcon(13)}, lose drops you to 0</div>` : "");
  const host = spEl("div", "sp-mg-host");
  box.appendChild(host);
  spSetCenter(box);

  const ctx = {
    tier: risk.tier,
    player: p,
    cpu: p.type === "cpu",
    // ONE roll decides the whole turn (90/60/35) — the minigame's animation is
    // scripted to match, so the real odds are exact regardless of word count
    cpuWins: p.type === "cpu" ? Math.random() < SP_CPU_ACCURACY[risk.tier] : false,
    used: (sp.mgUsed[gameId] = sp.mgUsed[gameId] || new Set()),
  };
  mg.start(host, ctx, (won) => spResolveTurn(p, risk, myToken, won));
}

/* TRIVIA as an embedded minigame — the original question UI, now reporting
   won/lost through the uniform onDone instead of resolving stars itself. */
function spTriviaStart(host, ctx, onDone) {
  const p = ctx.player;
  const q = spPickQuestion(ctx.tier);
  sp.question = q;
  const options = shuffle(q.options.map((text, idx) => ({ text, correct: idx === q.correct_index })));

  const box = spEl("div", "sp-trivia");
  box.innerHTML = `<div class="sp-q-text">${spEsc(q.question)}</div>`;
  const optWrap = spEl("div", "sp-q-opts");
  let over = false;
  const resolve = (correct, chosenBtn) => {
    if (over) return;
    over = true;
    [...optWrap.querySelectorAll(".sp-q-opt")].forEach((b) => {
      b.disabled = true;
      if (b.dataset.correct === "1") b.classList.add("correct");
    });
    if (!correct && chosenBtn) chosenBtn.classList.add("wrong");
    spTimeout(() => onDone(correct), 900);
  };
  options.forEach((op) => {
    const b = spEl("button", "sp-q-opt", spEsc(op.text));
    b.dataset.correct = op.correct ? "1" : "0";
    if (!ctx.cpu) b.addEventListener("click", () => resolve(op.correct, b), { once: true });
    optWrap.appendChild(b);
  });
  box.appendChild(optWrap);
  host.appendChild(box);

  if (ctx.cpu) {
    const thinking = spEl("div", "sp-q-thinking", `${spEsc(p.name)} is thinking… ${SP_THINKING}`);
    box.appendChild(thinking);
    spTimeout(() => {
      const all = [...optWrap.querySelectorAll(".sp-q-opt")];
      let target;
      if (ctx.cpuWins) target = all.find((b) => b.dataset.correct === "1");
      else target = randomItem(all.filter((b) => b.dataset.correct === "0"));
      if (!target) target = all[0];
      resolve(target.dataset.correct === "1", target);
    }, spRand(1900, 3000));
  }
}

// star change for this turn, honoring any pending deferred effect (which is consumed here).
// Uses the SAME math as the numbers shown on the risk/minigame header (spTierOutcome).
function spComputeStarDelta(p, correct, risk) {
  const o = spTierOutcome(p, risk.tier, risk.stars);
  const note = o.modName;
  if (p.deferred && (p.deferred.type === "penalty_table" || p.deferred.type === "multiplier" || p.deferred.type === "forced_advanced")) {
    p.deferred = null; // consumed
  }
  return { delta: correct ? o.correct : o.wrong, note };
}

function spResolveTurn(p, risk, myToken, won) {
  // stale/duplicate guard: same instance, still in the minigame phase
  if (sp.phase !== "minigame" || myToken !== sp.questionToken) return;
  sp.phase = "answered";

  const { delta, note } = spComputeStarDelta(p, won, risk);
  spAddStars(p, delta);
  spFloatDelta(p.id, delta); // floating +N/-N over the player's seat — turn results ONLY

  const box = $("#sp-center .sp-question");
  if (box) {
    const fb = spEl("div", "sp-q-feedback " + (delta >= 0 ? "gain" : "loss"));
    fb.innerHTML =
      `${won ? "✅ Won!" : "❌ Lost!"} <b>${delta >= 0 ? "+" : ""}${delta}${spStarIcon(16)}</b>` +
      (note ? `<small>${spEsc(note)}</small>` : "");
    box.appendChild(fb);
  }
  spUpdateSeats();
  spTimeout(spBeginWheel, SP_READ_ANSWER);
}

/* =====================================================
   PHASE 3 — WHEEL (always spins, win or lose)
   TWO-STEP: the wheel has 12 COLOR-ONLY sectors (4 good / 4 bad / 4 neutral).
   It lands on a color; THEN the game picks a random wildcard of that category.
   ===================================================== */
// build the fixed color layout: 4 good / 4 bad / 4 neutral, shuffled so no two
// adjacent sectors share a color (keeps it readable as thirds without clumping).
function spBuildWheel() {
  const colors = [];
  SP_CATS.forEach((cat) => {
    for (let i = 0; i < (SP_SLICES_PER_CAT[cat] || 0); i++) colors.push(cat);
  });
  for (let attempt = 0; attempt < 400; attempt++) {
    const arr = shuffle(colors);
    let ok = true;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === arr[(i + 1) % arr.length]) { ok = false; break; }
    }
    if (ok) return arr;
  }
  // guaranteed-valid fallback: strict good/bad/neutral rotation
  return colors.map((_, i) => SP_CATS[i % SP_CATS.length]);
}

// per-category light→dark shades so each sector reads as a shaded wedge, not flat color
const SP_WHEEL_SHADES = {
  good: ["#7ab1ff", "#1d4ed8"],
  bad: ["#ff8a8a", "#b91c1c"],
  neutral: ["#ffe27a", "#c8880a"],
};
function spWheelGradient(colors) {
  const step = 360 / colors.length;
  const parts = colors.map((cat, i) => {
    const [lo, hi] = SP_WHEEL_SHADES[cat] || [SP_WC_COLORS[cat], SP_WC_COLORS[cat]];
    return `${lo} ${i * step}deg, ${hi} ${(i + 1) * step}deg`;
  });
  return `conic-gradient(from 0deg, ${parts.join(", ")})`;
}

// golden dividers between sectors + the ring of light bulbs on the rim
function spDecorateWheel(wrap, sectors) {
  const step = 360 / sectors, w = 1.7;
  const lines = wrap.querySelector(".sp-wheel-lines");
  if (lines) {
    lines.style.background =
      `repeating-conic-gradient(from ${-w / 2}deg, #f7d977 0deg ${w}deg, rgba(0,0,0,0) ${w}deg ${step}deg)`;
  }
  const holder = wrap.querySelector(".sp-wheel-bulbs");
  if (holder) {
    const N = 20;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const b = spEl("span", "sp-wheel-bulb");
      b.style.left = 50 + Math.sin(a) * 50 + "%";
      b.style.top = 50 - Math.cos(a) * 50 + "%";
      b.style.animationDelay = (i % 2) * 0.55 + "s";
      holder.appendChild(b);
    }
  }
}
// hub content is a parameter (not baked in) so the CURSE WHEEL can swap in ☠️
// while everywhere else uses the shared star icon
function spWheelWrapHTML(hubHTML) {
  return `<div class="sp-wheel-rim"></div>
   <div class="sp-wheel" id="sp-wheel"><div class="sp-wheel-lines"></div><div class="sp-wheel-shine"></div></div>
   <div class="sp-wheel-bulbs"></div>
   <div class="sp-wheel-hub">${hubHTML}</div>
   <div class="sp-wheel-pointer"></div>`;
}

// generic spin: rotates `wheel` to a uniformly-random sector of `n`, then calls
// onLand(k). Shared by the normal wildcard wheel and the CURSE WHEEL.
function spSpinWheelTo(wheel, n, spinBtn, onLand) {
  if (sp.phase !== "wheel") return;
  sp.phase = "spinning";
  if (spinBtn) spinBtn.disabled = true;

  const step = 360 / n;
  const k = Math.floor(Math.random() * n);
  const jitter = (Math.random() * 2 - 1) * (step / 2 - 4);
  const baseRest = ((360 - (k * step + step / 2)) % 360 + 360) % 360;
  const spins = 6 + Math.floor(Math.random() * 3);       // 6–8 full turns
  const targetR = spins * 360 + baseRest + jitter;
  const dur = spRand(SP_SPIN_MIN, SP_SPIN_MAX);           // 5–7s, accel → sustain → decel
  // force a reflow before starting the transition so a timer-triggered spin (CPU) always
  // animates instead of possibly collapsing straight to the end state (see spCoinFlipAnim)
  wheel.style.transition = "none";
  void wheel.offsetWidth;
  requestAnimationFrame(() => {
    wheel.style.transition = `transform ${dur}ms cubic-bezier(0.30, 0.02, 0.12, 1)`;
    requestAnimationFrame(() => { wheel.style.transform = `rotate(${targetR}deg)`; });
  });

  let fired = false;
  const fin = () => {
    if (fired) return;
    fired = true;
    wheel.removeEventListener("transitionend", fin);
    if (sp.phase === "spinning") onLand(k);
  };
  wheel.addEventListener("transitionend", fin);
  spTimeout(fin, dur + 800); // safety net
}

function spBeginWheel() {
  const p = spCurrentPlayer();

  // CURSE WHEEL: this player was marked — they spin the negative wheel instead
  if (p.cursedWheel) {
    const segments = p.cursedWheel.segments;
    p.cursedWheel = null;
    spUpdateSeats();
    spBeginNegativeWheel(p, segments);
    return;
  }

  sp.phase = "wheel";
  $("#sp-center").classList.add("sp-mode-wheel"); // widen the stage for the big wheel
  const box = spEl("div", "sp-wheel-stage");
  box.innerHTML =
    `<div class="sp-center-title">Spin the wildcard wheel</div>
     <div class="sp-wheel-wrap">${spWheelWrapHTML(spStarIcon(28))}</div>
     <button class="primary-btn small sp-spin-btn" id="sp-spin-btn">SPIN</button>`;
  spSetCenter(box);

  const wheel = box.querySelector("#sp-wheel");
  wheel.style.background = spWheelGradient(sp.wheelColors);
  spDecorateWheel(box.querySelector(".sp-wheel-wrap"), sp.wheelColors.length);
  wheel.style.transform = "rotate(0deg)";
  box.querySelector(".sp-wheel-wrap").style.animation =
    `sp-pop-out ${SP_POP_MS}ms cubic-bezier(0.34, 1.56, 0.64, 1) both`;

  const onLand = (k) => {
    const category = sp.wheelColors[k];            // STEP 1: the wheel decides the COLOR
    const wildcard = randomItem(SP_WC_BY_CAT[category]); // STEP 2: random wildcard of that color
    spRevealWildcard(wildcard);
  };

  const spinBtn = box.querySelector("#sp-spin-btn");
  sp.phase = "wheel";
  if (p.type === "cpu") {
    spinBtn.textContent = "🤖 spinning…";
    spinBtn.disabled = true;
    spTimeout(() => spSpinWheelTo(wheel, sp.wheelColors.length, spinBtn, onLand), SP_POP_MS + 700);
  } else {
    spinBtn.disabled = true;
    spTimeout(() => { spinBtn.disabled = false; }, SP_POP_MS);
    spinBtn.addEventListener("click", () => spSpinWheelTo(wheel, sp.wheelColors.length, spinBtn, onLand), { once: true });
  }
}

/* ---- CURSE WHEEL: a special 6-sector wheel of only negative outcomes ---- */
const spNegColor = (v) => (v === 0 ? "#3b82f6" : v >= -3 ? "#f59e0b" : v >= -5 ? "#ef4444" : "#991b1b");
function spNegWheelGradient(segs) {
  const step = 360 / segs.length;
  const parts = segs.map((v, i) => `${spNegColor(v)} ${i * step}deg ${(i + 1) * step}deg`);
  return `conic-gradient(from 0deg, ${parts.join(", ")})`;
}
// labels are appended INSIDE the wheel element so they rotate together with their
// coloured sector during the spin (B1 fix). Each is rotated to sit radially in its wedge.
function spRenderWheelLabels(wheelEl, segs) {
  const step = 360 / segs.length;
  segs.forEach((v, i) => {
    const mid = i * step + step / 2; // degrees from top, clockwise
    const a = (mid * Math.PI) / 180;
    const lab = spEl("span", "sp-wheel-label", v === 0 ? "0" : String(v));
    lab.style.left = 50 + Math.sin(a) * 34 + "%";
    lab.style.top = 50 - Math.cos(a) * 34 + "%";
    lab.style.transform = `translate(-50%, -50%) rotate(${mid}deg)`; // face outward within the wedge
    wheelEl.appendChild(lab);
  });
}

function spBeginNegativeWheel(p, segments) {
  sp.phase = "wheel";
  $("#sp-center").classList.add("sp-mode-wheel");
  const box = spEl("div", "sp-wheel-stage");
  box.innerHTML =
    `<div class="sp-center-title">😈 CURSE WHEEL — ${spEsc(p.name)} spins for bad luck only</div>
     <div class="sp-wheel-wrap">${spWheelWrapHTML("☠️").replace('class="sp-wheel"', 'class="sp-wheel sp-wheel-neg"')}</div>
     <button class="primary-btn small sp-spin-btn" id="sp-spin-btn">SPIN</button>`;
  spSetCenter(box);

  const wheel = box.querySelector("#sp-wheel");
  wheel.style.background = spNegWheelGradient(segments);
  wheel.style.transform = "rotate(0deg)";
  spDecorateWheel(box.querySelector(".sp-wheel-wrap"), segments.length);
  spRenderWheelLabels(wheel, segments); // append labels INSIDE the wheel (B1)
  box.querySelector(".sp-wheel-wrap").style.animation =
    `sp-pop-out ${SP_POP_MS}ms cubic-bezier(0.34, 1.56, 0.64, 1) both`;

  const onLand = (k) => {
    const val = segments[k];
    const spinBtn = $("#sp-spin-btn");
    if (spinBtn) spinBtn.style.display = "none";
    const stage = $("#sp-center .sp-wheel-stage");
    const missed = val === 0;
    const card = spEl("div", "sp-wc-card sp-wc-big cat-bad");
    card.style.setProperty("--wc-color", missed ? SP_WC_COLORS.good : SP_WC_COLORS.bad);
    card.innerHTML =
      `<div class="sp-wc-catlabel">BAD</div>
       <div class="sp-wc-iconbox"><span class="sp-wc-icon">${missed ? "🍀" : "💀"}</span></div>
       <div class="sp-wc-name">${missed ? "Phew — 0" : val + " " + spStarIcon(22)}</div>
       <div class="sp-wc-desc">${missed ? "The curse missed — no stars lost." : `${spEsc(p.name)} loses ${-val} stars.`}</div>
       <button class="primary-btn small sp-ok-btn">OK ▶</button>`;
    if (stage) stage.appendChild(card);
    spWaitOk(() => spDismissWheelStage(() => {
      if (val !== 0) { spAddStars(p, val); spFloatDelta(p.id, val); spUpdateSeats(); }
      spTimeout(spAdvanceTurn, SP_READ_AFTER_EFFECT);
    }));
  };

  const spinBtn = box.querySelector("#sp-spin-btn");
  if (p.type === "cpu") {
    spinBtn.textContent = "🤖 spinning…";
    spinBtn.disabled = true;
    spTimeout(() => spSpinWheelTo(wheel, segments.length, spinBtn, onLand), SP_POP_MS + 700);
  } else {
    spinBtn.disabled = true;
    spTimeout(() => { spinBtn.disabled = false; }, SP_POP_MS);
    spinBtn.addEventListener("click", () => spSpinWheelTo(wheel, segments.length, spinBtn, onLand), { once: true });
  }
}

/* =====================================================
   ANIMATION TOOLKIT — flying star tokens, floating deltas,
   central pot, "OK to continue" gate. Shared by transfers,
   COIN DUEL and ROUND JACKPOT.
   ===================================================== */
const spFeltEl = () => $("#sp-felt");
function spSeatXY(pid) {
  const felt = spFeltEl(), seat = $(`#sp-seats .sp-seat[data-pid="${pid}"]`);
  const fr = felt.getBoundingClientRect(), sr = seat.getBoundingClientRect();
  return { x: sr.left + sr.width / 2 - fr.left, y: sr.top + sr.height / 2 - fr.top };
}
const spCenterXY = () => { const f = spFeltEl(); return { x: f.clientWidth / 2, y: f.clientHeight / 2 }; };

// a star token that flies from → to along a curved ARC, leaving a glowing trail
// and landing with a small impact burst (video-style transfer)
function spFlyToken(from, to, label, onDone) {
  const felt = spFeltEl();
  const tok = spEl("div", "sp-fly", `<span class="sp-fly-star">${spStarIcon(24)}</span>` + (label ? `<span class="sp-fly-num">${label}</span>` : ""));
  tok.style.left = from.x + "px";
  tok.style.top = from.y + "px";
  felt.appendChild(tok);

  const dx = to.x - from.x, dy = to.y - from.y;
  const dist = Math.hypot(dx, dy) || 1;
  // control point: midpoint pushed perpendicular to the path, biased upward → arc
  let px = -dy / dist, py = dx / dist;
  if (py > 0) { px = -px; py = -py; }
  const lift = Math.min(150, dist * 0.4) + 50;
  const cx = (from.x + to.x) / 2 + px * lift;
  const cy = (from.y + to.y) / 2 + py * lift;

  const start = performance.now();
  let lastTrail = 0;
  const step = (now) => {
    if (!tok.isConnected) return;
    const t = Math.min(1, (now - start) / SP_FLY_MS);
    const e = t * t * (3 - 2 * t); // smoothstep easing
    const x = (1 - e) * (1 - e) * from.x + 2 * (1 - e) * e * cx + e * e * to.x;
    const y = (1 - e) * (1 - e) * from.y + 2 * (1 - e) * e * cy + e * e * to.y;
    tok.style.left = x + "px";
    tok.style.top = y + "px";
    if (now - lastTrail > 34 && t < 0.95) {
      lastTrail = now;
      const d = spEl("span", "sp-fly-trail");
      d.style.left = x + "px";
      d.style.top = y + "px";
      felt.appendChild(d);
      setTimeout(() => d.remove(), 520);
    }
    if (t < 1) { requestAnimationFrame(step); return; }
    // impact burst at the destination, then hand off
    const bang = spEl("span", "sp-fly-impact", spStarIcon(28));
    bang.style.left = to.x + "px";
    bang.style.top = to.y + "px";
    felt.appendChild(bang);
    setTimeout(() => bang.remove(), 460);
    tok.remove();
    if (onDone) onDone();
  };
  requestAnimationFrame(step);
}
// squash-and-bounce the seat card when a star lands on it
function spSeatBounce(pid) {
  const inner = $(`#sp-seats .sp-seat[data-pid="${pid}"] .sp-seat-inner`);
  if (!inner) return;
  inner.classList.remove("sp-hit");
  void inner.offsetWidth;
  inner.classList.add("sp-hit");
  setTimeout(() => inner.classList.remove("sp-hit"), 420);
}
// a floating +N / -N over a seat
function spFloatDelta(pid, delta) {
  if (!delta) return;
  const felt = spFeltEl(), at = spSeatXY(pid);
  const f = spEl("div", "sp-float " + (delta >= 0 ? "pos" : "neg"), `${delta > 0 ? "+" : ""}${delta}${spStarIcon(15)}`);
  f.style.left = at.x + "px";
  f.style.top = at.y + "px";
  felt.appendChild(f);
  requestAnimationFrame(() => f.classList.add("go"));
  spTimeout(() => f.remove(), 1500);
}
// a central pot bubble showing a running total
function spShowPot(total) {
  spHidePot();
  const felt = spFeltEl(), c = spCenterXY();
  const pot = spEl("div", "sp-pot", `<span class="sp-pot-ico">🏆</span><span class="sp-pot-num">${total}${spStarIcon(18)}</span>`);
  pot.id = "sp-pot";
  pot.style.left = c.x + "px";
  pot.style.top = c.y + "px";
  felt.appendChild(pot);
  requestAnimationFrame(() => pot.classList.add("go"));
  return pot;
}
function spSetPot(total) { const n = $("#sp-pot .sp-pot-num"); if (n) n.innerHTML = total + spStarIcon(18); }
function spHidePot() { const p = $("#sp-pot"); if (p) p.remove(); }

// animate pairwise transfers (loser → winner) VIDEO-STYLE: each transfer is split
// into up to 5 stars that launch one by one in an arc. The SOURCE counter drops as
// each star leaves and the DESTINATION counter rises as each star lands (visual
// only — the real state is applied by onCommit at the end, which re-syncs the UI).
function spTransferAnim(moves, onCommit) {
  if (!moves.length) { onCommit(); return; }
  let committed = false;
  const commit = () => { if (committed) return; committed = true; onCommit(); };

  // live display counters, seeded from current real values
  const disp = {};
  const seed = (pid) => { if (!(pid in disp)) disp[pid] = sp.players[pid].stars; };
  const paint = (pid) => {
    const n1 = $(`#sp-seats .sp-seat[data-pid="${pid}"] .sp-seat-stars-num`);
    if (n1) n1.textContent = disp[pid];
    const n2 = $(`#sp-standings-panel .sp-rank-row[data-pid="${pid}"] .sp-rank-num`);
    if (n2) n2.textContent = disp[pid];
  };

  let delay = 0, pending = 0, launchedAll = false, totalDelay = 0;
  const maybeDone = () => { if (launchedAll && pending === 0) spTimeout(commit, 250); };
  moves.forEach((m) => {
    const k = Math.max(1, Math.min(5, Math.abs(m.amount)));
    const base = Math.floor(m.amount / k);
    const rem = m.amount - base * k;
    spTimeout(() => spFloatDelta(m.from, -m.amount), delay);
    for (let i = 0; i < k; i++) {
      const chunk = base + (i < rem ? 1 : 0);
      const last = i === k - 1;
      pending++;
      spTimeout(() => {
        seed(m.from);
        disp[m.from] -= chunk;
        paint(m.from);
        spFlyToken(spSeatXY(m.from), spSeatXY(m.to), chunk > 1 ? "+" + chunk : "", () => {
          seed(m.to);
          disp[m.to] += chunk;
          paint(m.to);
          spSeatBounce(m.to);
          if (last) spFloatDelta(m.to, m.amount);
          pending--;
          maybeDone();
        });
      }, delay);
      delay += 150;
    }
  });
  launchedAll = true;
  totalDelay = delay;
  maybeDone();
  spTimeout(commit, totalDelay + SP_FLY_MS + 1600); // safety net
}
// animate simultaneous per-seat +/- (all-player effects), then run onCommit
function spFloatsAnim(deltas, onCommit) {
  deltas.forEach((d) => spFloatDelta(d.pid, d.delta));
  spTimeout(onCommit, 1600);
}

// gate: show an "OK" button; proceed on click OR auto after SP_OK_TIMEOUT (ARREGLO 8)
function spWaitOk(onProceed) {
  const ok = $(".sp-ok-btn");
  let fired = false;
  const go = () => { if (fired) return; fired = true; if (onProceed) onProceed(); };
  if (ok) ok.addEventListener("click", go, { once: true });
  spTimeout(go, SP_OK_TIMEOUT);
}
// shrink/fade the wheel stage away so the whole table is visible (ARREGLO 4)
function spDismissWheelStage(onDone) {
  const stage = $("#sp-center .sp-wheel-stage");
  if (stage) stage.classList.add("sp-dismiss");
  spTimeout(() => { spSetCenter(""); if (onDone) onDone(); }, 460);
}

// reveal the wildcard card with a big pop-out (ARREGLO 3) over the stopped wheel,
// then wait for OK / 15s (ARREGLO 8) before dismissing the wheel and applying (ARREGLO 4).
function spRevealWildcard(w) {
  sp.phase = "reveal";
  const spinBtn = $("#sp-spin-btn");
  if (spinBtn) spinBtn.style.display = "none";

  const stage = $("#sp-center .sp-wheel-stage");
  const card = spEl("div", "sp-wc-card sp-wc-big cat-" + w.category);
  card.style.setProperty("--wc-color", SP_WC_COLORS[w.category]);
  card.innerHTML =
    `<div class="sp-wc-catlabel">${w.category.toUpperCase()}</div>
     <div class="sp-wc-iconbox"><span class="sp-wc-icon">${spWcIcon(w)}</span></div>
     <div class="sp-wc-name">${spEsc(w.name)}</div>
     <div class="sp-wc-desc">${spEsc(w.description)}</div>
     <button class="primary-btn small sp-ok-btn">OK ▶</button>`;
  if (stage) stage.appendChild(card);

  const actor = spCurrentPlayer();
  spWaitOk(() => spDismissWheelStage(() => spApplyWildcard(w, actor)));
}

/* =====================================================
   EFFECT ENGINE — generic dispatch table.
   Add a wildcard reusing any of these effect_types with
   different params and NO code here changes.
   ===================================================== */
function spDoSteal(actor, target, amt) { spAddStars(target, -amt); spAddStars(actor, amt); }

function spShiftStars(dir) {
  // rotate every active player's stars to the neighbour in `dir` (turn order, circular)
  const ring = sp.order.map((id) => sp.players.find((p) => p.id === id)).filter((p) => p.active);
  const stars = ring.map((p) => p.stars);
  const n = ring.length;
  ring.forEach((p, i) => {
    const from = dir === "right" ? (i - 1 + n) % n : (i + 1) % n;
    spSetStars(p, stars[from]);
  });
}

const SP_EFFECTS = {
  redistribute_equal(w, actor, done) {
    const act = spActivePlayers();
    const total = act.reduce((s, p) => s + p.stars, 0);
    const share = Math.round(total / act.length); // round to nearest integer
    const deltas = act.map((p) => ({ pid: p.id, delta: share - p.stars }));
    spFlash(`Stars pooled & split — everyone gets ${share}${spStarIcon(15)}`);
    spFloatsAnim(deltas, () => { // per-seat +/- for all players (ARREGLO 4)
      act.forEach((p) => spSetStars(p, share));
      spUpdateSeats();
      done();
    });
  },
  shift_stars(w, actor, done) {
    // ARREGLO 2 (bug fix): "random" no longer coin-flips a direction — it follows
    // the CURRENT turn direction (sp.dir), so once REVERSE flips play to
    // counter-clockwise, Star Shift passes stars the same way turns are moving,
    // not the original clockwise direction. sp.dir: +1 = clockwise = "right",
    // -1 = counter-clockwise = "left" (matches spAdvanceTurn's own convention).
    const dir = w.params.direction === "random" ? (sp.dir === 1 ? "right" : "left") : w.params.direction;
    spShiftStars(dir);
    spFlash(`Everyone's stars shifted ${dir}`);
    spUpdateSeats();
    done();
  },
  next_turn_penalty_table(w, actor, done) {
    // deferred: consumed on the actor's NEXT question
    actor.deferred = { type: "penalty_table", table: w.params.table, icon: "☠️", name: w.name };
    spFlash(`${spEsc(actor.name)} is cursed next turn`);
    spUpdateSeats();
    done();
  },
  receive_from_all(w, actor, done) {
    const others = spActivePlayers().filter((p) => p.id !== actor.id);
    const amt = w.params.amount_per_player;
    spFlash(`${spEsc(actor.name)} collects ${amt}${spStarIcon(15)} from everyone`);
    const moves = others.map((o) => ({ from: o.id, to: actor.id, amount: amt }));
    spTransferAnim(moves, () => {
      others.forEach((p) => spAddStars(p, -amt));
      spAddStars(actor, amt * others.length);
      spUpdateSeats();
      done();
    });
  },
  steal_choice(w, actor, done) {
    const others = spActivePlayers().filter((p) => p.id !== actor.id);
    const amt = w.params.amount;
    if (!others.length) { done(); return; }
    const doIt = (target) => {
      spFlash(`${spEsc(actor.name)} steals ${amt}${spStarIcon(15)} from ${spEsc(target.name)}`);
      spTransferAnim([{ from: target.id, to: actor.id, amount: amt }], () => {
        spDoSteal(actor, target, amt);
        spUpdateSeats();
        done();
      });
    };
    if (actor.type === "cpu") {
      // CPU rule (consistent): always steal from whoever currently has the most stars
      doIt(others.reduce((a, b) => (b.stars > a.stars ? b : a), others[0]));
    } else {
      spRenderStealPicker(actor, others, amt, doIt);
    }
  },
  next_turn_multiplier(w, actor, done) {
    // TRIPLE OR NOTHING is GLOBAL and jumps to the WHOLE NEXT ROUND (SP 2.0):
    // the slot draws a fresh game and EVERYONE plays it at x3, win or lose.
    // High Stakes stays personal: it defers onto the actor's own next turn.
    const applyAll = w.params.applies_to_all || w.id === "neutral_triple_stakes";
    if (applyAll) {
      sp.tripleRound = sp.round + 1; // consumed by spTierOutcome during that round
      spFlash(`✨ NEXT ROUND is worth ×${w.params.win_multiplier} for EVERYONE!`);
    } else {
      actor.deferred = { type: "multiplier", win: w.params.win_multiplier, lose: w.params.lose_multiplier, icon: "✨", name: w.name };
      spFlash(`${spEsc(actor.name)} raised the stakes for next turn`);
    }
    spUpdateSeats();
    done();
  },

  // ---- v3 effect_types ----
  flat_bonus(w, actor, done) {
    // pure bonus from nowhere — nobody else loses anything
    spAddStars(actor, w.params.amount);
    spFlash(`🎉 ${spEsc(actor.name)} gets +${w.params.amount}${spStarIcon(15)} out of nowhere!`);
    spUpdateSeats();
    done();
  },
  swap_stars_choice(w, actor, done) {
    // interactive: swap totals with ANY player, or pick yourself to skip
    const choices = spActivePlayers(); // includes the actor (self = no swap)
    const doSwap = (target) => {
      if (target.id === actor.id) { spFlash(`${spEsc(actor.name)} kept their stars`); done(); return; }
      spFlash(`${spEsc(actor.name)} swaps totals with ${spEsc(target.name)}`);
      spSwapAnim(actor, target, done);
    };
    if (actor.type === "cpu") {
      // CPU plays to win: swap with the richest (or self = keep, if already richest)
      doSwap(choices.reduce((a, b) => (b.stars > a.stars ? b : a), choices[0]));
    } else {
      spRenderSwapPicker(actor, choices, doSwap);
    }
  },
  // EASY PICK (next_question_reduce_options) was REMOVED in SP 2.0 — with most
  // minigames having no multiple-choice options it stopped making sense.
  reverse_turn_order(w, actor, done) {
    // global toggle: flips the direction turns advance in (UNO-style)
    sp.dir *= -1;
    spFlash(`🔄 Turn order reversed!`);
    done();
  },
  next_player_penalty(w, actor, done) {
    // the NEXT player (in the CURRENT direction) is docked when their turn begins
    const victim = spNextPlayer();
    victim.pendingPenalty = (victim.pendingPenalty || 0) + w.params.amount;
    spUpdateSeats();
    spFlash(`🎯 ${spEsc(victim.name)} will be ambushed for -${w.params.amount}${spStarIcon(15)} next turn`);
    done();
  },
  shuffle_stars(w, actor, done) {
    // reassign the SAME set of star totals to a random permutation of players
    const act = spActivePlayers();
    const values = shuffle(act.map((p) => p.stars));
    spShuffleAnimate(act, values, done);
  },

  // ---- v4 effect_types ----
  coin_duel_choice(w, actor, done) {
    // pick a rival, then run the full 5-step COIN DUEL sequence (ARREGLO 7)
    const others = spActivePlayers().filter((p) => p.id !== actor.id);
    if (!others.length) { done(); return; }
    if (actor.type === "cpu") {
      spCoinDuelSequence(actor, others.reduce((a, b) => (b.stars > a.stars ? b : a), others[0]), done);
    } else {
      spRenderPlayerPicker("COIN DUEL — choose your rival", others, (rival) => spCoinDuelSequence(actor, rival, done));
    }
  },
  assign_negative_wheel_choice(w, actor, done) {
    // mark a target: on their NEXT turn they spin the negative wheel instead of the normal one
    const others = spActivePlayers().filter((p) => p.id !== actor.id);
    if (!others.length) { done(); return; }
    const mark = (target) => {
      target.cursedWheel = { segments: w.params.segments };
      spUpdateSeats();
      spFlash(`😈 ${spEsc(target.name)} will spin the CURSE WHEEL next turn`);
      done();
    };
    if (actor.type === "cpu") {
      const target = others.reduce((a, b) => (b.stars > a.stars ? b : a), others[0]); // hurt the leader
      mark(target);
    } else {
      spRenderPlayerPicker("CURSE WHEEL — choose a victim", others, mark);
    }
  },
  next_turn_forced_advanced_double_or_nothing(w, actor, done) {
    // deferred: next turn is a forced ADVANCED question with double-or-nothing scoring
    actor.deferred = { type: "forced_advanced", icon: "🎰", name: "Double or Nothing" };
    spFlash(`${spEsc(actor.name)}'s next turn is DOUBLE OR NOTHING`);
    spUpdateSeats();
    done();
  },
  round_pot_dice(w, actor, done) {
    // pool the round's gains (or losses if no gains) and a die picks who gets it
    const act = spActivePlayers();
    const usingGains = sp.roundGains > 0;
    const pot = usingGains ? sp.roundGains : sp.roundLosses;
    if (pot <= 0) { spFlash("Nothing in the round pot yet"); done(); return; }
    spRoundJackpotSequence(act, usingGains, pot, done); // 3-step animated sequence (B2)
  },
  percent_to_lowest(w, actor, done) {
    // give 25% (rounded up) of |your stars| to whoever currently has the fewest
    const act = spActivePlayers();
    const lowest = act.reduce((a, b) => (b.stars < a.stars ? b : a), act[0]);
    if (lowest.id === actor.id) {
      spFlash(`${spEsc(actor.name)} already has the fewest — nothing happens`);
      done();
      return;
    }
    const amt = Math.ceil(Math.abs(actor.stars) * (w.params.percent / 100));
    spFlash(`🏹 ${spEsc(actor.name)} gives ${amt}${spStarIcon(15)} to ${spEsc(lowest.name)}`);
    spTransferAnim([{ from: actor.id, to: lowest.id, amount: amt }], () => {
      spAddStars(actor, -amt);
      spAddStars(lowest, amt);
      spUpdateSeats();
      done();
    });
  },
  swap_with_lowest(w, actor, done) {
    // auto-swap totals with whoever has the fewest stars
    const act = spActivePlayers();
    const lowest = act.reduce((a, b) => (b.stars < a.stars ? b : a), act[0]);
    if (lowest.id === actor.id) {
      spFlash(`${spEsc(actor.name)} already has the fewest — nothing happens`);
      done();
      return;
    }
    spFlash(`⬇️ ${spEsc(actor.name)} swaps down with ${spEsc(lowest.name)}`);
    spSwapAnim(actor, lowest, done);
  },
  coin_flip_double_or_nothing_choice(w, actor, done) {
    // immediate coin flip: win doubles your stars, lose drops you to 0 (negatives worsen)
    const resolve = (callerFace) => {
      spCoinFlipAnim(`COIN GAMBLE — ${spEsc(actor.name)} called ${callerFace}`, (result) => {
        const win = result === callerFace;
        spApplyDoubleOrNothing(actor, win);
        spFlash(win ? `🪙 ${spEsc(actor.name)} wins the flip — stars doubled!` : `🪙 ${spEsc(actor.name)} loses the flip`);
        spUpdateSeats();
        done();
      });
    };
    spCoinChoose(actor.type === "cpu" ? `COIN GAMBLE — ${spEsc(actor.name)} calls it` : "COIN GAMBLE — heads or tails?", actor.type === "cpu", resolve);
  },
};

// double-or-nothing math shared by COIN GAMBLE (immediate) and DOUBLE DOWN (question)
function spApplyDoubleOrNothing(p, win) {
  const s = p.stars;
  const target = win ? (s >= 0 ? s * 2 : 0) : (s > 0 ? 0 : s * 2);
  spSetStars(p, target);
}

// ---- COIN DUEL: 5 clearly separated steps with reading pauses (ARREGLO 7) ----
function spCoinDuelSequence(actor, rival, done) {
  const pot = actor.stars + rival.stars;
  const aStake = actor.stars, rStake = rival.stars;
  // STEP 1 — both stakes fly to the central pot; both drop to 0
  spSetCenter("");
  spFlash(`⚔️ COIN DUEL — ${spEsc(actor.name)} vs ${spEsc(rival.name)}`);
  spShowPot(0);
  spFlyToken(spSeatXY(actor.id), spCenterXY(), String(aStake), null);
  spFlyToken(spSeatXY(rival.id), spCenterXY(), String(rStake), null);
  spFloatDelta(actor.id, -aStake);
  spFloatDelta(rival.id, -rStake);
  spTimeout(() => {
    spSetStars(actor, 0); spSetStars(rival, 0); spUpdateSeats();
    spSetPot(pot);
    // STEP 2 — the caller chooses a face (CPU "thinks" ~3s)
    spTimeout(() => {
      spHidePot();
      const withFace = (callerFace) => {
        const rivalFace = callerFace === "heads" ? "tails" : "heads";
        // STEP 3 — rival automatically gets the other face, shown for a beat
        const info = spEl("div", "sp-coin-stage sp-pop-in");
        info.innerHTML =
          `<div class="sp-center-title">Pot: ${pot}${spStarIcon(16)}</div>
           <div class="sp-duel-faces">
             <div class="sp-duel-side"><span class="sp-duel-name" style="color:${actor.color}">${spEsc(actor.name)}</span>${spCoinFaceHTML(callerFace)}<b>${callerFace.toUpperCase()}</b></div>
             <div class="sp-duel-vs">VS</div>
             <div class="sp-duel-side"><span class="sp-duel-name" style="color:${rival.color}">${spEsc(rival.name)}</span>${spCoinFaceHTML(rivalFace)}<b>${rivalFace.toUpperCase()}</b></div>
           </div>`;
        spSetCenter(info);
        // STEP 4 — flip (~5s)
        spTimeout(() => {
          spCoinFlipAnim(`COIN DUEL — flipping for ${pot}${spStarIcon(16)}`, (result) => {
            const winner = result === callerFace ? actor : rival;
            // STEP 5 — the whole pot flies to the winner, then their counter updates
            spSetCenter("");
            spShowPot(pot);
            spTimeout(() => {
              spFlyToken(spCenterXY(), spSeatXY(winner.id), String(pot), null);
              spTimeout(() => {
                spHidePot();
                spAddStars(winner, pot);
                spFloatDelta(winner.id, pot);
                spUpdateSeats();
                spFlash(`🪙 ${spEsc(winner.name)} wins the ${pot}${spStarIcon(15)} pot!`);
                done();
              }, SP_FLY_MS + 200);
            }, SP_READ_STEP);
          });
        }, SP_READ_STEP + 400);
      };
      spCoinChoose(
        actor.type === "cpu" ? `${spEsc(actor.name)} calls the coin` : `COIN DUEL — call it (${spEsc(rival.name)} gets the other side)`,
        actor.type === "cpu", withFace, actor.type === "cpu" ? 3000 : undefined
      );
    }, SP_READ_STEP);
  }, SP_FLY_MS + 300);
}

// ---- ROUND JACKPOT: pot gathers → dice → pot flies to winner (ARREGLO B2) ----
function spRoundJackpotSequence(act, usingGains, pot, done) {
  // STEP 1 — gather the round pot into the centre
  spSetCenter("");
  spFlash(usingGains ? `🎲 ROUND JACKPOT — ${pot}${spStarIcon(15)} up for grabs!` : `🎲 ROUND JACKPOT — ${pot}${spStarIcon(15)} of losses to hand out`);
  spShowPot(0);
  act.forEach((p) => spFlyToken(spSeatXY(p.id), spCenterXY(), "", null));
  spTimeout(() => {
    spSetPot(pot);
    // STEP 2 — roll the die (improved, multi-axis, 3–4s)
    spTimeout(() => {
      spHidePot();
      spDiceRoll(usingGains ? "Rolling to pick the winner…" : "Rolling to pick who takes the hit…", act.length, (roll) => {
        const chosen = act[roll - 1];
        // STEP 3 — the pot travels from the centre to the chosen player, then commits
        spTimeout(() => {
          spSetCenter("");
          spShowPot(pot);
          spTimeout(() => {
            spFlyToken(spCenterXY(), spSeatXY(chosen.id), (usingGains ? "" : "−") + pot, null);
            spTimeout(() => {
              spHidePot();
              if (usingGains) { spAddStars(chosen, pot); spFloatDelta(chosen.id, pot); spFlash(`🎲 ${spEsc(chosen.name)} wins the ${pot}${spStarIcon(15)} pot!`); }
              else { spAddStars(chosen, -pot); spFloatDelta(chosen.id, -pot); spFlash(`🎲 ${spEsc(chosen.name)} takes -${pot}${spStarIcon(15)} of losses`); }
              spUpdateSeats();
              done();
            }, SP_FLY_MS + 200);
          }, SP_READ_STEP);
        }, SP_READ_STEP);
      });
    }, SP_READ_STEP);
  }, SP_FLY_MS + 300);
}

function spApplyWildcard(w, actor) {
  sp.phase = "effect";
  const handler = SP_EFFECTS[w.effect_type];
  const done = () => spTimeout(spAdvanceTurn, SP_READ_AFTER_EFFECT);
  if (!handler) { spFlash("Unknown wildcard effect"); done(); return; }
  handler(w, actor, done);
}

function spSwapStars(a, b) { const ta = a.stars, tb = b.stars; spSetStars(a, tb); spSetStars(b, ta); }

// animate two crossing tokens (a↔b), then commit the swap
function spSwapAnim(a, b, done) {
  spFlyToken(spSeatXY(a.id), spSeatXY(b.id), String(a.stars), null);
  spFlyToken(spSeatXY(b.id), spSeatXY(a.id), String(b.stars), null);
  spTimeout(() => { spSwapStars(a, b); spUpdateSeats(); done(); }, SP_FLY_MS + 350);
}

// brief "numbers mixing" animation before settling on the shuffled assignment.
// Visual ticks mutate stars directly (not accounted); only the final settle is
// recorded, as the net delta from each player's ORIGINAL value.
function spShuffleAnimate(players, finalValues, done) {
  spFlash("🔀 Everyone's stars are being reshuffled…");
  const originals = players.map((p) => p.stars);
  let ticks = 0;
  const spin = setInterval(() => {
    const rnd = shuffle(originals);
    players.forEach((p, i) => (p.stars = rnd[i]));
    spUpdateSeats();
    if (++ticks >= 6) {
      clearInterval(spin);
      players.forEach((p, i) => (p.stars = originals[i])); // restore before accounting
      players.forEach((p, i) => spSetStars(p, finalValues[i]));
      spUpdateSeats();
      done();
    }
  }, 220);
}

// selection only — the caller's onPick(target) runs the (animated) steal
function spRenderStealPicker(actor, others, amt, onPick) {
  sp.phase = "steal";
  const box = spEl("div", "sp-steal");
  box.innerHTML = `<div class="sp-center-title">Steal ${amt}${spStarIcon(16)} — pick a target</div>`;
  const list = spEl("div", "sp-steal-list");
  others.forEach((t) => {
    const b = spEl("button", "sp-steal-opt");
    b.style.setProperty("--seat-color", t.color);
    b.innerHTML = `<span class="sp-steal-name">${spEsc(t.name)}</span><span class="sp-steal-stars">${t.stars}${spStarIcon(14)}</span>`;
    b.addEventListener("click", () => onPick(t), { once: true });
    list.appendChild(b);
  });
  box.appendChild(list);
  spSetCenter(box);
}

// selection only — the caller's onPick(target) runs the (animated) swap (self = skip)
function spRenderSwapPicker(actor, choices, onPick) {
  sp.phase = "swap";
  const box = spEl("div", "sp-steal");
  box.innerHTML = `<div class="sp-center-title">Swap stars with… <span class="sp-center-hint">(pick yourself to skip)</span></div>`;
  const list = spEl("div", "sp-steal-list");
  choices.forEach((t) => {
    const self = t.id === actor.id;
    const b = spEl("button", "sp-steal-opt");
    b.style.setProperty("--seat-color", t.color);
    b.innerHTML =
      `<span class="sp-steal-name">${spEsc(t.name)}${self ? " (you — skip)" : ""}</span>` +
      `<span class="sp-steal-stars">${t.stars}${spStarIcon(14)}</span>`;
    b.addEventListener("click", () => onPick(t), { once: true });
    list.appendChild(b);
  });
  box.appendChild(list);
  spSetCenter(box);
}

// generic "pick a player" list — used by COIN DUEL (rival) and CURSE WHEEL (victim)
function spRenderPlayerPicker(title, candidates, onPick) {
  sp.phase = "picker";
  const box = spEl("div", "sp-steal");
  box.innerHTML = `<div class="sp-center-title">${title}</div>`;
  const list = spEl("div", "sp-steal-list");
  candidates.forEach((t) => {
    const b = spEl("button", "sp-steal-opt");
    b.style.setProperty("--seat-color", t.color);
    b.innerHTML = `<span class="sp-steal-name">${spEsc(t.name)}</span><span class="sp-steal-stars">${t.stars}${spStarIcon(14)}</span>`;
    b.addEventListener("click", () => onPick(t), { once: true });
    list.appendChild(b);
  });
  box.appendChild(list);
  spSetCenter(box);
}

/* =====================================================
   REUSABLE COMPONENTS — COIN + DICE
   Built once here; any wildcard (present or future) can call them.
   ===================================================== */
const SP_FACE = { heads: "👑 Heads", tails: "⭐ Tails" };
const SP_FACE_EMOJI = { heads: "👑", tails: "⭐" };
// a mini visual of a coin face, used inside the big choice cards (ARREGLO 6)
const spCoinFaceHTML = (face) =>
  `<span class="sp-coin-mini sp-coin-mini-${face}">${SP_FACE_EMOJI[face]}</span>`;

// choose heads/tails via two BIG pop-out cards, each showing the real coin face.
// If cpu, auto-picks after `thinkMs` (default short; COIN DUEL passes ~3s).
function spCoinChoose(title, cpu, onPick, thinkMs) {
  sp.phase = "coin-choose";
  const box = spEl("div", "sp-coin-stage sp-pop-in");
  box.innerHTML = `<div class="sp-center-title">${title}</div>`;
  const row = spEl("div", "sp-coin-choice");
  ["heads", "tails"].forEach((face) => {
    const b = spEl("button", "sp-coin-btn " + face,
      `${spCoinFaceHTML(face)}<span class="sp-coin-btn-label">${face.toUpperCase()}</span>`);
    if (!cpu) b.addEventListener("click", () => onPick(face), { once: true });
    row.appendChild(b);
  });
  box.appendChild(row);
  if (cpu) box.appendChild(spEl("div", "sp-coin-caption", `thinking… ${SP_THINKING}`));
  spSetCenter(box);
  if (cpu) {
    const pick = Math.random() < 0.5 ? "heads" : "tails";
    spTimeout(() => {
      [...row.children].forEach((b) => b.classList.add(b.classList.contains(pick) ? "picked" : "dim"));
      spTimeout(() => onPick(pick), 800);
    }, thinkMs != null ? thinkMs : spRand(700, 1300));
  }
}

// flip a 3D coin for ~5s (SP_COIN_MS, decelerating), landing on a random face, then onResult(face)
function spCoinFlipAnim(title, onResult) {
  sp.phase = "coin-flip";
  const box = spEl("div", "sp-coin-stage sp-pop-in");
  box.innerHTML =
    `<div class="sp-center-title">${title}</div>
     <div class="sp-coin-wrap">
       <div class="sp-coin" id="sp-coin">
         <div class="sp-coin-face sp-coin-heads">👑</div>
         <div class="sp-coin-face sp-coin-tails">⭐</div>
       </div>
     </div>
     <div class="sp-coin-caption">The coin is in the air…</div>`;
  spSetCenter(box);
  const coin = box.querySelector("#sp-coin");
  const result = Math.random() < 0.5 ? "heads" : "tails";
  const dur = SP_COIN_MS; // ~5s
  const spins = 10 + Math.floor(Math.random() * 5);
  const endDeg = spins * 360 + (result === "tails" ? 180 : 0); // heads=0°, tails=180°
  // Freshly-created elements have no committed style yet, so setting `transition` and
  // the target `transform` back-to-back can collapse straight to the end state instead
  // of animating (most visible when this is timer-triggered, i.e. a CPU turn, rather
  // than click-triggered). Force a layout flush to commit the resting state first,
  // then set the transition on the NEXT frame so the browser has something to animate from.
  coin.style.transition = "none";
  coin.style.transform = "rotateY(0deg)";
  void coin.offsetWidth; // force reflow — commits the resting state
  requestAnimationFrame(() => {
    coin.style.transition = `transform ${dur}ms cubic-bezier(0.18, 0.62, 0.12, 1)`; // strong decel
    requestAnimationFrame(() => { coin.style.transform = `rotateY(${endDeg}deg)`; });
  });
  let fired = false;
  const fin = () => {
    if (fired) return;
    fired = true;
    coin.removeEventListener("transitionend", fin);
    const cap = box.querySelector(".sp-coin-caption");
    if (cap) cap.innerHTML = `It's <b>${SP_FACE[result]}</b>!`;
    spTimeout(() => onResult(result), 1100); // reading pause
  };
  coin.addEventListener("transitionend", fin);
  spTimeout(fin, dur + 500); // safety net
}

// pip layout for a die face 1–6
function spDicePips(n) {
  const on = {
    1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
  }[n] || [4];
  let html = "";
  for (let i = 0; i < 9; i++) html += `<span class="sp-pip${on.includes(i) ? " on" : ""}"></span>`;
  return html;
}

// roll a die (1..sides) for ~2–3s of tumbling, then onResult(value)
function spDiceRoll(title, sides, onResult) {
  sp.phase = "dice";
  const box = spEl("div", "sp-dice-stage sp-pop-in");
  box.innerHTML =
    `<div class="sp-center-title">${title}</div>
     <div class="sp-dice-wrap"><div class="sp-dice" id="sp-dice"></div></div>
     <div class="sp-dice-caption">Rolling…</div>`;
  spSetCenter(box);
  const dice = box.querySelector("#sp-dice");
  const result = 1 + Math.floor(Math.random() * sides);
  const dur = spRand(3000, 4000); // longer, easier to follow (B2)
  const start = performance.now();
  let raf, lastFace = 0, angle = 0, lastNow = start;
  const tick = (now) => {
    const t = Math.min(1, (now - start) / dur);
    const speed = 1 - t; // decelerate toward the end
    angle += (now - lastNow) * speed; // accumulate so it eases to a stop
    lastNow = now;
    dice.style.transform = `rotateX(${angle * 0.7}deg) rotateY(${angle}deg) rotateZ(${angle * 0.45}deg)`;
    // swap the shown face every ~110ms while it's still tumbling
    if (t < 0.85 && now - lastFace > 110) { dice.innerHTML = spDicePips(1 + Math.floor(Math.random() * sides)); lastFace = now; }
    if (t < 1) { raf = requestAnimationFrame(tick); }
    else {
      dice.innerHTML = spDicePips(result);
      dice.style.transform = "rotateX(0deg) rotateY(0deg) rotateZ(0deg)";
      const cap = box.querySelector(".sp-dice-caption");
      if (cap) cap.innerHTML = `Rolled a <b>${result}</b>!`;
      spTimeout(() => onResult(result), 1000); // reading pause
    }
  };
  raf = requestAnimationFrame(tick);
}

/* =====================================================
   UI — SEATS, HUD, FLASH
   ===================================================== */
function spRenderSeats() {
  const seats = $("#sp-seats");
  seats.innerHTML = "";
  const N = sp.order.length;
  // seat players around the table FOLLOWING TURN ORDER, clockwise from the top
  // (order[0] at top, order[1] to its right, …). REVERSE later just flips the
  // direction of play (sp.dir) — the seats themselves never move.
  sp.order.forEach((pid, j) => {
    const p = sp.players[pid];
    const seat = spEl("div", "sp-seat");
    seat.dataset.pid = p.id;
    const ang = -Math.PI / 2 + (j / N) * Math.PI * 2; // -90° = top, then clockwise
    const topPct = 50 + Math.sin(ang) * 43;
    seat.style.left = 50 + Math.cos(ang) * 44 + "%";
    seat.style.top = topPct + "%";
    seat.style.setProperty("--seat-color", p.color);
    // seats near the top edge of the circular felt would push their floating stars
    // OFF the felt if the stars sit above the box (video reference) — for those,
    // draw the stars BELOW the box instead, toward the center (ARREGLO 1)
    if (topPct < 32) seat.classList.add("sp-seat-top");
    seat.innerHTML =
      `<div class="sp-seat-stars">
         <span class="sp-seat-stars-num"></span>
         <span class="sp-seat-stars-cluster"></span>
       </div>
       <div class="sp-seat-inner">
         <div class="sp-seat-name">
           <span class="sp-seat-badge"></span>
           <span class="sp-seat-label"></span>
           <span class="sp-defer" title="Pending wildcard effect"></span>
         </div>
         <div class="sp-star-bar"><div class="sp-star-fill"></div></div>
       </div>`;
    seats.appendChild(seat);
  });
  // turn-indicator arrow: an orbit layer centered on the felt that rotates smoothly
  // so its arrow points at whoever's turn it is (video-style)
  const felt = spFeltEl();
  const oldOrbit = $("#sp-turn-orbit");
  if (oldOrbit) oldOrbit.remove();
  const orbit = spEl("div", "sp-turn-orbit", `<div class="sp-turn-arrow"></div>`);
  orbit.id = "sp-turn-orbit";
  felt.appendChild(orbit);
  sp.arrowRot = 0;
  spRenderStandingsPanel();
  spUpdateSeats();
}

// rotate the turn arrow to the current player's seat via the SHORTEST path,
// accumulating rotation so the CSS transition always animates smoothly
function spUpdateTurnArrow() {
  const orbit = $("#sp-turn-orbit");
  const cur = spCurrentPlayer();
  if (!orbit || !cur) return;
  const j = sp.order.indexOf(cur.id);
  const target = (j / sp.order.length) * 360;
  const prev = sp.arrowRot || 0;
  let delta = ((target - prev) % 360 + 540) % 360 - 180;
  sp.arrowRot = prev + delta;
  orbit.style.transform = `rotate(${sp.arrowRot}deg)`;
}

function spUpdateSeats() {
  if (!sp) return;
  const cur = spCurrentPlayer();
  const curId = cur ? cur.id : -1;
  sp.players.forEach((p) => {
    const seat = $(`#sp-seats .sp-seat[data-pid="${p.id}"]`);
    if (!seat) return;
    seat.classList.toggle("current", p.id === curId);
    seat.classList.toggle("negative", p.stars < 0);
    seat.querySelector(".sp-seat-badge").textContent = p.type === "cpu" ? "🤖" : "🧑";
    seat.querySelector(".sp-seat-label").textContent = p.name;
    // exact star count lives OUTSIDE/ABOVE the seat box now, next to the star cluster
    seat.querySelector(".sp-seat-stars-num").textContent = p.stars;

    const fill = seat.querySelector(".sp-star-fill");
    const clamped = Math.max(-25, Math.min(50, p.stars));
    fill.style.width = ((clamped + 25) / 75) * 100 + "%";
    fill.classList.toggle("neg", p.stars < 0);

    const defer = seat.querySelector(".sp-defer");
    // pending deferred (☠️/✨/🎯/🎰), incoming ambush (💥), or a queued CURSE WHEEL (😈)
    let marks = "";
    if (p.deferred) marks += p.deferred.icon || "✦";
    if (p.pendingPenalty) marks += "💥";
    if (p.cursedWheel) marks += "😈";
    defer.textContent = marks;
    defer.classList.toggle("show", !!marks);

    // decorative star cluster next to the number: 1–9 ★ → one, 10–19 → two, 20+ → three, ≤0 → none
    const cluster = seat.querySelector(".sp-seat-stars-cluster");
    if (cluster) {
      const n = p.stars >= 20 ? 3 : p.stars >= 10 ? 2 : p.stars >= 1 ? 1 : 0;
      const hoverSizes = [30, 26, 23]; // ARREGLO 4: bumped further (was 22/19/17)
      if (cluster.childElementCount !== n) {
        cluster.innerHTML = "";
        for (let i = 0; i < n; i++) {
          const s = spEl("span", "sp-hover-star sp-hover-star-" + i, spStarIcon(hoverSizes[i]));
          s.style.animationDelay = i * 0.55 + "s";
          cluster.appendChild(s);
        }
      }
    }
  });
  spUpdateTurnArrow();
  spUpdateStandingsPanel();
}

/* =====================================================
   LIVE STANDINGS PANEL — Mario-Party-style ranking list,
   fixed beside the table, re-sorted by stars on every update.
   ===================================================== */
const SP_ORDINALS = ["1st", "2nd", "3rd", "4th", "5th", "6th"];

function spRenderStandingsPanel() {
  const panel = $("#sp-standings-panel");
  if (!panel) return;
  panel.innerHTML = "";
  sp.players.forEach((p) => {
    const row = spEl("div", "sp-rank-row");
    row.dataset.pid = p.id;
    // --seat-color here is assigned by RANK (spUpdateStandingsPanel), not by player
    row.innerHTML =
      `<span class="sp-rank-name"></span>
       <span class="sp-rank-stars"><span class="sp-rank-ico">${spStarIcon(15)}</span><span class="sp-rank-x">x</span><span class="sp-rank-num"></span></span>
       <span class="sp-rank-pos"></span>`;
    panel.appendChild(row);
  });
  spUpdateStandingsPanel(true);
}

// ARREGLO 5: standings colors are fixed BY POSITION, not by player.
// Full 6-place sequence: gold, green, blue, pink, purple, red. With fewer than
// 6 players, 1st is always gold and LAST is always red; the places in between
// keep walking the same sequence starting at green (so e.g. with 4 players,
// 2nd=green, 3rd=blue, 4th=red — the sequence is truncated, not compressed).
const SP_RANK_COLORS = ["#eab308", "#22c55e", "#3b82f6", "#ec4899", "#a855f7", "#ef4444"];
function spRankColor(i, n) {
  if (i === n - 1) return SP_RANK_COLORS[5]; // last place is always red
  return SP_RANK_COLORS[i]; // 1st..(n-2)th walk the fixed sequence from the top
}

// re-sorts the rows by current stars (desc) and animates the reorder with a FLIP
// (record old screen position → reorder DOM → transform from old to new → release)
function spUpdateStandingsPanel(skipAnim) {
  const panel = $("#sp-standings-panel");
  if (!panel || !sp) return;
  const rows = [...panel.children];
  const firstTop = {};
  rows.forEach((r) => { firstTop[r.dataset.pid] = r.getBoundingClientRect().top; });

  const sorted = [...sp.players].sort((a, b) => b.stars - a.stars);
  const n = sorted.length;
  sorted.forEach((p, i) => {
    const row = panel.querySelector(`.sp-rank-row[data-pid="${p.id}"]`);
    if (!row) return;
    row.querySelector(".sp-rank-name").textContent = p.name;
    row.querySelector(".sp-rank-num").textContent = p.stars;
    const ord = SP_ORDINALS[i] || i + 1 + "th";
    row.querySelector(".sp-rank-pos").innerHTML =
      `<b>${i + 1}</b><small>${ord.replace(/^\d+/, "")}</small>`;
    row.style.setProperty("--seat-color", spRankColor(i, n)); // position-based, not player-based
    row.classList.toggle("sp-rank-first", i === 0);
    row.classList.toggle("sp-rank-negative", p.stars < 0);
    panel.appendChild(row); // moves it to the end, in sorted order
  });

  if (skipAnim) return;
  rows.forEach((r) => {
    const delta = firstTop[r.dataset.pid] - r.getBoundingClientRect().top;
    if (!delta) return;
    r.style.transition = "none";
    r.style.transform = `translateY(${delta}px)`;
    requestAnimationFrame(() => {
      r.style.transition = "transform 0.4s ease";
      r.style.transform = "";
    });
  });
}

function spUpdateRoundHud() {
  const mg = sp.roundGame && sp.slotRound === sp.round ? SP_MINIGAMES[sp.roundGame] : null;
  $("#sp-round").textContent = `ROUND ${sp.round} / ${sp.totalRounds}` + (mg ? ` · ${mg.name}` : "");
}

function spFlash(html) {
  let el = $("#sp-flash");
  if (!el) {
    el = spEl("div", "sp-flash");
    el.id = "sp-flash";
    $("#sp-felt").appendChild(el);
  }
  el.innerHTML = html;
  el.classList.remove("show");
  // reflow so the animation restarts even on back-to-back flashes
  void el.offsetWidth;
  el.classList.add("show");
  spTimeout(() => el.classList.remove("show"), 1700);
}

/* =====================================================
   END OF GAME — highest stars after 8 rounds (ties allowed)
   ===================================================== */
function spEndGame() {
  sp.phase = "ended";
  spClearTimers();
  const sorted = [...sp.players].sort((a, b) => b.stars - a.stars);
  const top = sorted[0].stars;
  const winners = sorted.filter((p) => p.stars === top);

  const title = $("#sp-end-title");
  const detail = $("#sp-end-detail");
  if (winners.length === 1) {
    title.textContent = `🏆 ${winners[0].name} wins!`;
    detail.innerHTML = `${winners[0].stars}${spStarIcon(16)} after ${sp.totalRounds} rounds.`;
  } else {
    title.textContent = "🏆 It's a tie!";
    detail.innerHTML = `${winners.map((w) => spEsc(w.name)).join(" & ")} tied at ${top}${spStarIcon(16)}.`;
  }

  const list = $("#sp-standings");
  list.innerHTML = "";
  sorted.forEach((p, i) => {
    const li = spEl("li", "sp-standing" + (p.stars === top ? " winner" : ""));
    li.style.setProperty("--seat-color", p.color);
    li.innerHTML =
      `<span class="sp-rank">${i + 1}</span>
       <span class="sp-standing-name">${p.type === "cpu" ? "🤖" : "🧑"} ${spEsc(p.name)}</span>
       <span class="sp-standing-stars ${p.stars < 0 ? "neg" : ""}">${p.stars}${spStarIcon(15)}</span>`;
    list.appendChild(li);
  });

  $("#sp-end").classList.remove("hidden");
}

/* =====================================================
   WIRING
   ===================================================== */
(function spInit() {
  const startBtn = $("#sp-start-btn");
  if (startBtn) startBtn.addEventListener("click", spStartGame);
  const againBtn = $("#sp-again-btn");
  if (againBtn) againBtn.addEventListener("click", spOpenSetup);
  // leaving via any Back button inside STAR PARTY cancels pending timers
  $$("#screen-starparty [data-back]").forEach((b) =>
    b.addEventListener("click", () => { spClearTimers(); sp = null; })
  );
})();
