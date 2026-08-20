/* =====================================================
   PLACEMENT — the adaptive level test engine.

   Loaded EAGERLY, next to progress.js and sfx.js. The bank it scores
   (placement_data.js, 216 items / 69 KB) is loaded on demand by DataLoader,
   so this file must work — and must LOAD — with PLACEMENT_DATA still
   undefined: the home screen needs to read a saved level without pulling
   the whole bank down.

   🚨 Consequence, and it is the documented trap of this project: NOTHING at
   the top level of this file may touch PLACEMENT_DATA, not directly and not
   through a call. Every read goes through bank(), which is only ever invoked
   from inside a function. The same mistake already broke the achievements
   screen once (hiInitVoices reading HEARIT_DATA.audio.lang at load time).

   ---- The model ----

   One-parameter logistic (Rasch) with a guessing floor:

       P(correct | theta, b) = c + (1 - c) / (1 + exp(-(theta - b) / S))

   c = 0.25 because every item has four options. The floor sits INSIDE the
   probability rather than being subtracted afterwards, which matters at the
   bottom of the scale: without it the model believes someone far below an
   item has ~0 chance of getting it right, and then reads their lucky guesses
   as evidence of ability. That is exactly the bias that inflates beginners.

   Ability is estimated by MAP (maximum a posteriori) on a grid, not by
   Newton-Raphson: with only 24 responses the likelihood has no interior
   maximum for a perfect or an empty score, and Newton diverges. The grid
   plus a weak prior always returns something finite.

   ⚠️ The prior is centred at 25 and therefore SHRINKS extreme scores toward
   the middle. That is deliberate — it is what keeps 24/24 from returning
   "infinity" — but it means a true C2 will not score 50. The exact size of
   that shrinkage is measured in tools/simulate_placement.py and must be
   reported alongside any result; it is not a free lunch.

   ---- What this file does NOT do ----

   No DOM, no localStorage, no strings for the player. Persistence goes
   through Progress.getLevel/setLevel (phase 2) and every visible text comes
   from ui_strings. This module only turns responses into numbers.

   =====================================================
   WHAT THIS TEST CANNOT DO — measured, not guessed
   =====================================================
   Five limits that 2.000 simulated players exposed and that no amount of code
   will fix. They are here so nobody spends a week trying.

   1. FOUR OPTIONS PUT A FLOOR UNDER EVERYONE.
      A true beginner gets ~25% right by luck, so no estimator can tell a
      lucky A1 from an unlucky A2. This is a property of 4-option items, NOT
      a bug in the 0.25 floor — the floor is what stops it being worse.
      Proof: regenerating the same players with no guessing at all flips the
      A1 bias from +3.57 to -1.96. Guessing, not the prior, is what lifts the
      bottom of the scale. Fixing it needs more items or more options, not a
      better formula.

   2. THE TOP OF THE SCALE IS CENSORED.
      No item is harder than 50, so a genuine C2 cannot be measured any higher
      than the hardest thing we own. That is where the negative bias at C2
      (-2.21) comes from, and it is a property of the bank, not the estimator.

   3. THE ITEM DIFFICULTIES ARE EXPERT JUDGEMENT, NOT CALIBRATION.
      Every `difficulty` in the bank was assigned a priori. None has ever been
      checked against real responses. The simulator's N(0,6) scenario exists to
      bound that risk — it says the estimate survives a bank that is wrong by
      about six points per item — but bounding is not removing. The day real
      response data exists, recalibrate and re-run everything here.

   4. THE CEFR BAND IS WRONG ABOUT ONE TIME IN THREE — AND THAT IS FINE.
      63.3% exact, 35.0% off by one band, and only 1.7% off by two or more.
      Being told B2 when you are B1 is survivable; being told C1 when you are
      B1 essentially does not happen. This is the whole reason the per-skill
      results are shown as a LABEL and never as a number: three buckets absorb
      an error that one decimal place would advertise as precision.

   5. WITHOUT ENGLISH VOICES THE RESULT IS WORSE, NOT EQUAL.
      12 vocab + 12 grammar gives MAE 3.92 against the player's real level,
      versus 3.44 for the full test: a degradation of +0.47. Still usable, but
      phase 2 must SAY SO on the result screen rather than quietly presenting
      a two-skill score as if it were a three-skill one.
   ===================================================== */
const Placement = (() => {
  /* ---------- scale ---------- */
  const SCALE_MIN = 0;
  const SCALE_MAX = 50;

  /* ---------- model ---------- */
  // Logistic scale. 6 points ~= one CEFR half-step, so an item 6 points above
  // someone sits at roughly 0.25 + 0.75*0.27 = 45% expected success. Tuned
  // against the simulator; changing it changes every reported score.
  const S = 6;
  const GUESS = 0.25; // four options, always

  // Weak Gaussian prior. Its only real job is to keep the estimate finite for
  // a perfect or an empty score; 24 real responses dominate it everywhere else.
  //
  // SD was 15 and is now 40, measured rather than guessed. Over 2.000 simulated
  // players in the pessimistic N(0,6) calibration scenario, widening it moved
  // the A1 bias from +3.57 to +2.46 while the global MAE did not move at all
  // (3.77 -> 3.77), and 24/24 and 0/24 still land on 50 and 0. A tighter prior
  // was buying nothing and costing beginners a point of shrinkage.
  const PRIOR_MEAN = 25;
  const PRIOR_SD = 40;

  const GRID_STEP = 0.1;

  /* ---------- test shape ---------- */
  const TOTAL = 24;
  const PER_SKILL = 8; // when all three skills are measured
  const LOCATE_N = 6;  // first phase: sweep, do not refine

  // Staircase for the locating phase, shrinking. Starts at half the scale so
  // six items can reach either end from the middle, and ends small enough to
  // hand the refinement phase a usable starting point.
  const LOCATE_STEPS = [12, 8, 5, 3.5, 2.5, 2];
  const LOCATE_START = 25;

  // Content balancing: among the NEAR_POOL items closest to the current
  // estimate, prefer the format this skill has used least. Picking strictly
  // the closest item would be marginally more informative and would routinely
  // serve eight items of the same format — which measures the format, and
  // feels like a broken test. The information lost inside a 6-item window is
  // negligible; the variety is not.
  const NEAR_POOL = 6;

  const SKILLS = ["vocab", "grammar", "listening"];

  /* ---------- the bank, always read lazily ---------- */
  // Shape-tolerant on purpose: this must never throw just because the bank
  // has not been downloaded yet.
  function bank() {
    return typeof PLACEMENT_DATA !== "undefined" && PLACEMENT_DATA ? PLACEMENT_DATA : null;
  }

  function allItems() {
    const b = bank();
    return b && Array.isArray(b.items) ? b.items : [];
  }

  function recos() {
    const b = bank();
    return (b && b.recommendations) || null;
  }

  /* ---------- scale helpers ---------- */
  const clamp = (x) => Math.max(SCALE_MIN, Math.min(SCALE_MAX, x));

  // Anchors live in the bank so the scale can be retuned without touching JS,
  // but a fallback keeps cefrFor() working before the bank arrives — the home
  // screen shows a saved CEFR label without downloading 216 items.
  const FALLBACK_ANCHORS = {
    0: "A1.0", 5: "A1.5", 10: "A2.0", 15: "A2.5", 20: "B1.0", 25: "B1.5",
    30: "B2.0", 35: "B2.5", 40: "C1.0", 45: "C1.5", 50: "C2",
  };

  function cefrFor(score) {
    const b = bank();
    const anchors = (b && b.scale && b.scale.anchors) || FALLBACK_ANCHORS;
    let best = null;
    let bestDist = Infinity;
    Object.keys(anchors).forEach((k) => {
      const d = Math.abs(Number(k) - score);
      if (d < bestDist) {
        bestDist = d;
        best = anchors[k];
      }
    });
    return best;
  }

  // Same fallback logic for the three bucket labels. The words are the
  // project's own difficulty values (Spanish, unaccented) so a recommendation
  // can be handed straight to openIntro's radios — see WL_LEVEL_KEYS.
  // ⚠️ CALIBRATED, NOT CEFR-ALIGNED. These were (20, 33) — where CEFR puts A2.0
  // and B2.0 — and are now (22, 35): both moved up by the engine's MEASURED
  // global bias of +1.76, rounded. It is an arithmetic correction for a bias we
  // measured over 2.000 simulated players, applied at the boundary instead of at
  // the score, not a number tuned to make a distribution look tidy.
  //
  // It buys: over-recommendation — sending someone to a difficulty they cannot
  // hold, which is what makes beginners quit — drops from 23.6% to 21.9% on a
  // realistic N(17,8) population, and BOTH populations improve (realistic
  // +2.9pp, uniform +1.5pp), which is the check that it is not overfitted.
  //
  // It costs: the label no longer means exactly what CEFR says. It means "what
  // this engine, with this bank, calls basico/intermedio/avanzado". That is a
  // fair trade because the label exists to pick a game difficulty, not to
  // certify a level — but IF THE BANK IS EVER RECALIBRATED against real
  // responses, these cuts must be revisited, because the bias they compensate
  // will have changed.
  //
  // The authoritative copy lives in placement_data.json (recommendations.
  // label_cuts, from LABEL_CUTS in tools/build_placement.py) and is what the
  // result screen uses. This constant only covers the home screen, which reads
  // a saved level before the bank is downloaded — keep the two in sync or the
  // same score gets two different labels on two different screens.
  const FALLBACK_CUTS = { basico_max: 22, intermedio_max: 35 };

  function cuts() {
    const r = recos();
    return (r && r.label_cuts) || FALLBACK_CUTS;
  }

  function labelFor(score) {
    const c = cuts();
    if (score < c.basico_max) return "basico";
    if (score <= c.intermedio_max) return "intermedio";
    return "avanzado";
  }

  /* ---------- the model ---------- */
  function prob(theta, b) {
    return GUESS + (1 - GUESS) / (1 + Math.exp(-(theta - b) / S));
  }

  // log posterior, up to a constant
  function logPost(theta, responses) {
    let ll = 0;
    for (let i = 0; i < responses.length; i++) {
      const p = prob(theta, responses[i].b);
      // clamped so a freak p of exactly 0 or 1 cannot produce -Infinity
      const pc = Math.min(0.999999, Math.max(0.000001, p));
      ll += responses[i].correct ? Math.log(pc) : Math.log(1 - pc);
    }
    const z = (theta - PRIOR_MEAN) / PRIOR_SD;
    return ll - 0.5 * z * z;
  }

  /* Grid MAP + numeric curvature.

     The standard error comes from the curvature of the log posterior at the
     peak, computed by finite differences rather than the analytic Fisher
     information. Two reasons: the guessing floor makes the analytic form easy
     to get subtly wrong, and the numeric version automatically includes the
     prior's contribution, which is what actually keeps SE finite at 0/24 and
     24/24. */
  function estimate(responses) {
    if (!responses.length) {
      return { theta: PRIOR_MEAN, se: PRIOR_SD, n: 0 };
    }
    let bestTheta = PRIOR_MEAN;
    let bestVal = -Infinity;
    for (let t = SCALE_MIN; t <= SCALE_MAX + 1e-9; t += GRID_STEP) {
      const v = logPost(t, responses);
      if (v > bestVal) {
        bestVal = v;
        bestTheta = t;
      }
    }
    const h = 0.5;
    const lo = clamp(bestTheta - h);
    const hi = clamp(bestTheta + h);
    const second = (logPost(hi, responses) - 2 * bestVal + logPost(lo, responses)) / (h * h);
    // second < 0 at a maximum; guard against a flat/degenerate curve
    const info = second < 0 ? -second : 1 / (PRIOR_SD * PRIOR_SD);
    return {
      theta: Math.round(bestTheta * 10) / 10,
      se: Math.round((1 / Math.sqrt(info)) * 10) / 10,
      n: responses.length,
    };
  }

  /* ---------- item selection ---------- */
  // Fixed interleaved schedule, built up front. Round-robin over the skills in
  // play gives perfect interleaving for both shapes (8/8/8 and 12/12) without
  // any run-time bookkeeping, and guarantees the per-skill counts land exactly.
  function buildSchedule(useListening) {
    const skills = useListening ? SKILLS : ["vocab", "grammar"];
    const out = [];
    while (out.length < TOTAL) {
      for (let i = 0; i < skills.length && out.length < TOTAL; i++) out.push(skills[i]);
    }
    return out;
  }

  function pickItem(pool, theta, formatCounts) {
    if (!pool.length) return null;
    const sorted = pool
      .map((it) => ({ it, d: Math.abs(it.difficulty - theta) }))
      .sort((a, b) => a.d - b.d);
    const near = sorted.slice(0, Math.min(NEAR_POOL, sorted.length));
    let best = near[0].it;
    let bestCount = Infinity;
    for (let i = 0; i < near.length; i++) {
      const f = near[i].it.format;
      const c = formatCounts[f] || 0;
      if (c < bestCount) {
        bestCount = c;
        best = near[i].it;
      }
    }
    return best;
  }

  /* ---------- a test session ---------- */
  /* create({ seenIds, listening, items })

     `items` is an injection point for the simulator and the tests; the browser
     never passes it and gets the real bank. `seenIds` are the item ids this
     player has already been shown in previous tests — the interface reads them
     from Progress and hands them over, which is what stops a second run from
     repeating questions. */
  function create(opts) {
    const o = opts || {};
    const source = Array.isArray(o.items) ? o.items : allItems();
    const seen = new Set(Array.isArray(o.seenIds) ? o.seenIds : []);

    // Listening is measured unless the caller says otherwise (no English
    // voices) or the bank simply has no listening items left to show.
    const wantListening = o.listening !== false;
    const available = source.filter((it) => !seen.has(it.id));
    const listeningPool = available.filter((it) => it.skill === "listening");
    const useListening = wantListening && listeningPool.length >= PER_SKILL;

    const schedule = buildSchedule(useListening);
    const used = new Set();
    const responses = []; // { item, correct, b }
    const bySkill = { vocab: [], grammar: [], listening: [] };
    const formatCounts = { vocab: {}, grammar: {}, listening: {} };

    let theta = LOCATE_START;
    let current = null;

    function poolFor(skill) {
      return available.filter((it) => it.skill === skill && !used.has(it.id));
    }

    function advance() {
      if (responses.length >= TOTAL) {
        current = null;
        return null;
      }
      const skill = schedule[responses.length];
      const pool = poolFor(skill);
      if (!pool.length) {
        // The bank cannot serve this skill any more. Rather than end the test
        // short, fall back to any other skill that still has items: a slightly
        // unbalanced test is far better than one that cannot be finished.
        const alt = SKILLS.map(poolFor).find((p) => p.length);
        if (!alt) {
          current = null;
          return null;
        }
        current = pickItem(alt, theta, formatCounts[alt[0].skill]);
      } else {
        current = pickItem(pool, theta, formatCounts[skill]);
      }
      if (current) used.add(current.id);
      return current;
    }

    function answer(optionIndex) {
      if (!current) return null;
      const it = current;
      const correct = Number(optionIndex) === it.correct_index;

      responses.push({ item: it, correct, b: it.difficulty });
      bySkill[it.skill].push({ b: it.difficulty, correct });
      formatCounts[it.skill][it.format] = (formatCounts[it.skill][it.format] || 0) + 1;

      // Phase 1 walks a shrinking staircase; phase 2 re-estimates properly.
      // The staircase is deliberately NOT a real estimate: its only job is to
      // get near the player fast, and a full MAP on two responses would just
      // sit on the prior.
      if (responses.length <= LOCATE_N) {
        const step = LOCATE_STEPS[Math.min(responses.length - 1, LOCATE_STEPS.length - 1)];
        theta = clamp(theta + (correct ? step : -step));
      } else {
        theta = estimate(responses).theta;
      }

      advance();
      return { correct, done: responses.length >= TOTAL || !current };
    }

    function result() {
      const overallEst = estimate(responses.map((r) => ({ b: r.b, correct: r.correct })));
      const skills = {};
      SKILLS.forEach((sk) => {
        const rs = bySkill[sk];
        if (!rs.length) {
          skills[sk] = null; // not measured at all
          return;
        }
        const e = estimate(rs);
        skills[sk] = { score: e.theta, label: labelFor(e.theta), se: e.se, n: e.n };
      });

      return {
        overall: overallEst.theta,
        cefr: cefrFor(overallEst.theta),
        display: Math.round(overallEst.theta),
        skills,
        standardError: overallEst.se,
        itemsSeen: responses.map((r) => r.item.id),
        itemsFailed: responses.filter((r) => !r.correct).map((r) => r.item.id),
        answered: responses.length,
        listeningMeasured: useListening && bySkill.listening.length > 0,
      };
    }

    advance();

    return {
      total: TOTAL,
      listeningMeasured: useListening,
      current: () => current,
      answered: () => responses.length,
      isDone: () => responses.length >= TOTAL || !current,
      answer,
      result,
      // read-only view for the progress bar; never mutate this
      theta: () => theta,
    };
  }

  /* ---------- recommendations ----------
     The table and the policy live in placement_data.json so they can be
     retuned without touching this file. Everything here is lazy, and returns
     empty lists rather than throwing when the bank is not loaded. */
  function bandValue(axis, score) {
    if (!axis || !Array.isArray(axis.bands) || !axis.bands.length) return null;
    for (let i = 0; i < axis.bands.length; i++) {
      if (score <= axis.bands[i].max) return axis.bands[i];
    }
    return axis.bands[axis.bands.length - 1];
  }

  function recommend(res) {
    const r = recos();
    if (!r || !res) return { play: [], avoid: [] };

    const sel = r.selection || {};
    const scoreOf = (sk) => (res.skills && res.skills[sk] ? res.skills[sk].score : null);

    // Only skills that were actually measured can drive a recommendation.
    // With no listening score, Hear It must not appear on EITHER list — a
    // "don't play this" is as much of a claim as a "play this".
    const measured = SKILLS.filter((sk) => scoreOf(sk) !== null);
    const ranked = measured.slice().sort((a, b) => scoreOf(a) - scoreOf(b));
    const weakest = ranked[0];
    const strongest = ranked[ranked.length - 1];
    const middle = ranked.length > 2 ? ranked[1] : null;

    const games = Object.keys(r.skill_of_game || {});
    const forSkill = (sk) =>
      games
        .filter((g) => r.skill_of_game[g] === sk)
        .sort((a, b) => (r.priority_of_game[a] || 99) - (r.priority_of_game[b] || 99));

    const entry = (g) => {
      const sk = r.skill_of_game[g];
      const score = scoreOf(sk);
      const axis = (r.axes || {})[r.axis_of_game[g]];
      const band = bandValue(axis, score);
      return {
        game: g,
        skill: sk,
        axis: (axis && axis.kind) || "none",
        level: band ? band.value : null,
        mode: band && band.mode ? band.mode : null,
      };
    };

    const play = [];
    const taken = new Set();
    const take = (sk, n) => {
      if (!sk) return;
      forSkill(sk).forEach((g) => {
        if (play.length >= (sel.recommend_total || 4) || taken.has(g)) return;
        if (n <= 0) return;
        // never suggest a game whose only setting is out of reach
        const e = entry(g);
        if (e.axis === "none" && scoreOf(sk) < (sel.avoid_if_no_axis_below || 20)) return;
        play.push(e);
        taken.add(g);
        n--;
      });
    };

    // Weakest first — that is where practice pays — but never only the
    // weakest: a result that says nothing but "you are bad at this, go drill
    // it" gets closed. One game at the player's strongest skill is what keeps
    // them in.
    take(weakest, sel.from_weakest || 2);
    take(strongest, sel.from_strongest || 1);
    take(middle, sel.from_middle || 1);

    const avoid = [];
    const avoidMax = sel.avoid_max || 3;
    forSkill(weakest).forEach((g) => {
      if (avoid.length >= avoidMax || taken.has(g)) return;
      const e = entry(g);
      const score = scoreOf(weakest);
      // Two ways a game is wrong for someone right now: it cannot be made
      // easier (no difficulty selector, and they are low), or the only setting
      // it would land on is its hard mode.
      const noAxisTooHard = e.axis === "none" && score < (sel.avoid_if_no_axis_below || 20);
      const hardModeTooSoon =
        e.axis === "mode" && score < (sel.avoid_hard_mode_below || 33) && e.level !== null &&
        /hardcore/.test(String(e.level));
      if (noAxisTooHard || hardModeTooSoon) {
        avoid.push(e);
        taken.add(g);
      }
    });

    return { play, avoid };
  }

  return {
    create,
    recommend,
    // exposed for the simulator, the browser checks and phase 2's UI
    estimate,
    prob,
    cefrFor,
    labelFor,
    SCALE_MIN,
    SCALE_MAX,
    TOTAL,
    S,
    GUESS,
    PRIOR_MEAN,
    PRIOR_SD,
    LOCATE_N,
    LOCATE_STEPS,
  };
})();
