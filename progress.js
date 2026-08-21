/* =====================================================
   PROGRESS — the player's persistent progress store.

   Loaded BEFORE app.js (same slot as sfx.js). Nothing else in the project
   reads or writes these localStorage keys: every access goes through the
   public API below, so the day this syncs with a backend there is exactly
   one pair of functions to rewrite (load/save).

   This is phase 1 of a larger plan (streak, daily game, learner level and a
   combined hardcore mode come later), so the schema is deliberately open:
   `plays` is a free-form counter map, `settings` a free-form object, and `v`
   exists so a future shape can migrate instead of wiping people's progress.

   Star Party is outside this system, exactly like it is outside the sound
   system and the endPop animation.
   ===================================================== */
const Progress = (() => {
  const KEY = "wordlab_progress";
  const VERSION = 1;
  const TIER_ORDER = ["bronze", "silver", "gold", "platinum"];

  /* ---------- shape ---------- */
  // `level` is the placement test result (phase 2 of the level test), or null
  // if the player has never taken it. It MUST be declared here: normalize()
  // rebuilds the state field by field from this shape, so a field that is not
  // in blank() and not copied in normalize() saves fine, works all session,
  // and vanishes silently on the next reload.
  function blank() {
    return {
      v: VERSION,
      plays: {},
      claimed: [],
      settings: { badgesEnabled: true },
      level: null,
    };
  }

  // defensive: a hand-edited or half-written entry must never break a game,
  // so anything unexpected falls back to the blank shape field by field
  function normalize(raw) {
    const base = blank();
    if (!raw || typeof raw !== "object") return base;
    if (raw.plays && typeof raw.plays === "object") {
      Object.keys(raw.plays).forEach((k) => {
        const n = Number(raw.plays[k]);
        if (Number.isFinite(n) && n > 0) base.plays[k] = Math.floor(n);
      });
    }
    if (Array.isArray(raw.claimed)) {
      base.claimed = raw.claimed.filter((id) => typeof id === "string");
    }
    if (raw.settings && typeof raw.settings === "object") {
      base.settings.badgesEnabled = raw.settings.badgesEnabled !== false;
    }
    base.level = normalizeLevel(raw.level);
    return base;
  }

  // Same defensive contract as the rest of normalize(): anything that does not
  // fit is dropped rather than trusted, and a half-written entry can never
  // throw. Returns null unless the record has at least a usable overall score,
  // because a level with no number is not a level.
  function normalizeLevel(raw) {
    if (!raw || typeof raw !== "object") return null;
    const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
    const overall = num(raw.overall);
    if (overall === null) return null;

    const ids = (v) =>
      Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 64) : [];

    const skills = {};
    if (raw.skills && typeof raw.skills === "object") {
      ["vocab", "grammar", "listening"].forEach((sk) => {
        const s = raw.skills[sk];
        if (!s || typeof s !== "object") {
          skills[sk] = null; // not measured — a real, meaningful value
          return;
        }
        const score = num(s.score);
        skills[sk] =
          score === null ? null : { score, label: typeof s.label === "string" ? s.label : null };
      });
    }

    return {
      overall,
      cefr: typeof raw.cefr === "string" ? raw.cefr : null,
      display: num(raw.display) !== null ? Math.round(num(raw.display)) : Math.round(overall),
      skills,
      standardError: num(raw.standardError),
      listeningMeasured: raw.listeningMeasured === true,
      // stored as an epoch number so no Date parsing can throw on a corrupt value
      takenAt: num(raw.takenAt),
      itemsSeen: ids(raw.itemsSeen),
      itemsFailed: ids(raw.itemsFailed),
    };
  }

  // future versions land here. v1 is the first shape, so there is nothing to
  // convert yet — normalize() already tolerates anything older or malformed.
  function migrate(raw) {
    return normalize(raw);
  }

  /* ---------- THE ONLY TWO FUNCTIONS THAT TOUCH localStorage ---------- */
  function load() {
    let raw = null;
    try {
      raw = localStorage.getItem(KEY);
    } catch (err) { /* private mode — start fresh, never throw */ }
    if (!raw) return blank();
    try {
      return migrate(JSON.parse(raw));
    } catch (err) {
      return blank(); // corrupted entry: better a clean slate than a crash
    }
  }

  function save(s) {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
      return true;
    } catch (err) {
      return false; // quota or private mode: the game keeps working in memory
    }
  }

  // Deliberately NO in-memory cache. A full 48-badge screen is ~150 reads,
  // measured at 1.6ms total — a tenth of one frame — so caching buys nothing
  // measurable while costing correctness: a cached copy goes stale the moment
  // a second tab writes, or the player clears site data. Every call reads the
  // current truth instead.
  const get = load;

  // read-modify-write in one place, so no caller can forget to persist
  function update(mutate) {
    const s = load();
    mutate(s);
    save(s);
    return s;
  }

  /* ---------- keys ----------
     "game[:level][:mode]", with the level in the ENGLISH bank keys. The radio
     values are Spanish, and WL_LEVEL_KEYS in app.js is the project's single
     conversion — read lazily (never at load time) because app.js loads after
     this file. */
  function toLevelKey(level) {
    if (!level) return null;
    const map = typeof WL_LEVEL_KEYS === "object" && WL_LEVEL_KEYS ? WL_LEVEL_KEYS : null;
    return (map && map[level]) || level;
  }

  function playKey(game, level, mode) {
    let k = String(game);
    const lk = toLevelKey(level);
    if (lk) k += ":" + lk;
    if (mode) k += ":" + mode;
    return k;
  }

  /* ---------- what counts as beating a game ----------
     Calibrated per game on purpose: a flat percentage does not work because
     100% does not cost the same everywhere. The 13 games report only what
     happened; the decision lives here, in one place. */
  const BEATEN = {
    wordle: (r) => r.won === true,
    blanks: (r) => r.score === r.maxScore,
    spot: (r) => r.score === r.maxScore,
    wordlinks: (r) => r.score === r.maxScore, // 9/9 already implies no hint was used
    impostor: (r) => r.score === r.maxScore, // idem: a hint drops the round to 2 pts
    connections: (r) => r.won === true && Number(r.mistakes || 0) <= 3,
    realword: (r) => r.score === r.maxScore,
    emojimatch: (r) => r.score === r.maxScore,
    // the typing levels are much harder than picking from four options, so
    // they allow one miss; basic must be perfect. Compared against the
    // CONVERTED level: callers hand over the raw Spanish radio value.
    hearit: (r) =>
      toLevelKey(r.level) === "basic" ? r.score === r.maxScore : r.score >= r.maxScore - 1,
    waffle: (r) => r.won === true,
    bombword: (r) => r.won === true,
    emojibomb: (r) => r.won === true,
    strands: (r) => r.won === true,
  };

  // using a hint disqualifies the run everywhere EXCEPT Strands, where hints
  // are a core mechanic paid for with extra words — solving the puzzle counts
  // either way.
  const HINT_EXEMPT = new Set(["strands"]);

  /* ---------- the bank (achievements.js) ----------
     Read lazily and shape-tolerantly: this file must not care whether the
     generated bank is an array or an object wrapping one. */
  function allBadges() {
    const b = typeof ACHIEVEMENTS !== "undefined" ? ACHIEVEMENTS : null;
    if (!b) return [];
    if (Array.isArray(b)) return b;
    if (Array.isArray(b.badges)) return b.badges;
    return [];
  }

  const findBadge = (id) => allBadges().find((x) => x && x.id === id) || null;

  /* ---------- public API ---------- */

  // Called by every game when a round ends. Returns the play key when the run
  // counted, or null when it did not — never throws, whatever it is handed.
  function record(result) {
    const r = result || {};
    if (!r.game || !BEATEN[r.game]) return null;
    if (r.usedHint && !HINT_EXEMPT.has(r.game)) return null;

    let beaten = false;
    try {
      beaten = BEATEN[r.game](r) === true;
    } catch (err) {
      return null;
    }
    if (!beaten) return null;

    const key = playKey(r.game, r.level, r.mode);
    update((s) => {
      s.plays[key] = (s.plays[key] || 0) + 1;
    });
    return key;
  }

  const getPlays = (key) => get().plays[key] || 0;

  // condition is either { key, count } or { all: [{ key, count }, ...] } —
  // Waffle is the only tier that needs several keys at once (both modes).
  function conditionMet(cond) {
    if (!cond) return false;
    const parts = Array.isArray(cond.all) ? cond.all : [cond];
    return parts.every((p) => p && p.key && getPlays(p.key) >= (p.count || 1));
  }

  // numeric progress for the achievements screen. Same cond.all/single-part
  // normalization as conditionMet(), but each part is CLAMPED to its own count
  // before summing — otherwise Waffle (7 plays normal, 0 deluxe, 5 needed each)
  // would show 7/10 and look more than half done when really zero deluxe runs
  // have happened. Clamped, it reads 5/10: honest about what's missing.
  function progressFor(badgeId) {
    const b = findBadge(badgeId);
    if (!b || !b.condition) return { current: 0, target: 0, done: false };
    const parts = Array.isArray(b.condition.all) ? b.condition.all : [b.condition];
    let current = 0;
    let target = 0;
    parts.forEach((p) => {
      if (!p || !p.key) return;
      const count = p.count || 1;
      current += Math.min(getPlays(p.key), count);
      target += count;
    });
    return { current, target, done: current >= target };
  }

  const isEarned = (badgeId) => {
    const b = findBadge(badgeId);
    return !!b && conditionMet(b.condition);
  };

  const isClaimed = (badgeId) => get().claimed.indexOf(badgeId) !== -1;

  // earned is not enough: the previous tier of the chain must already have
  // been CLAIMED. Beating advanced before bronze still banks the play, so the
  // badge simply waits and falls in on its own once the earlier ones are
  // claimed — effort is never lost, and the order is never skipped.
  function isClaimable(badgeId) {
    const b = findBadge(badgeId);
    if (!b || isClaimed(badgeId) || !conditionMet(b.condition)) return false;
    return !b.requires || isClaimed(b.requires);
  }

  function claim(badgeId) {
    if (!isClaimable(badgeId)) return false;
    update((s) => {
      s.claimed.push(badgeId);
    });
    return true;
  }

  // highest tier claimed for a game — what the card medal shows. Null when the
  // player has claimed nothing for it yet, so the card stays clean.
  function highestClaimed(game) {
    let best = null;
    let bestRank = -1;
    get().claimed.forEach((id) => {
      const b = findBadge(id);
      if (!b || b.game !== game) return;
      const rank = TIER_ORDER.indexOf(b.tier);
      if (rank > bestRank) {
        bestRank = rank;
        best = b.tier;
      }
    });
    return best;
  }

  // ids that no longer exist in the bank do not inflate the counter
  function countClaimed() {
    const known = allBadges();
    if (!known.length) return get().claimed.length;
    const ids = new Set(known.map((b) => b.id));
    return get().claimed.filter((id) => ids.has(id)).length;
  }

  const badgesEnabled = () => get().settings.badgesEnabled !== false;

  // turning this off only hides the medals and the counter; record() keeps
  // banking plays underneath, so nothing is lost by switching it back on
  function setBadgesEnabled(v) {
    update((s) => {
      s.settings.badgesEnabled = !!v;
    });
    return badgesEnabled();
  }

  /* ---------- the placement test result ----------
     The level test is NOT part of the 48-badge system — it never calls
     record(), and nothing here feeds conditionMet(). It lives in Progress only
     because this is the one place allowed to touch localStorage. */

  // Null until the player finishes the test once. Always normalized, so callers
  // can read .overall/.skills without guarding against a hand-edited entry.
  const getLevel = () => get().level;

  // `result` is what Placement's session.result() returns. takenAt is stamped
  // here rather than trusted from the caller: the store owns "when", and a
  // clock read belongs next to the write.
  function setLevel(result) {
    if (!result || typeof result !== "object") return null;
    const stamped = Object.assign({}, result, { takenAt: Date.now() });
    const clean = normalizeLevel(stamped);
    if (!clean) return null; // unusable result: leave the previous level alone
    update((s) => {
      s.level = clean;
    });
    return clean;
  }

  const exportData = () => JSON.stringify(get());

  function importData(str) {
    let parsed;
    try {
      parsed = JSON.parse(str);
    } catch (err) {
      return false;
    }
    if (!parsed || typeof parsed !== "object") return false;
    return save(migrate(parsed));
  }

  return {
    record,
    getPlays,
    progressFor,
    isEarned,
    isClaimable,
    isClaimed,
    claim,
    highestClaimed,
    countClaimed,
    badgesEnabled,
    setBadgesEnabled,
    getLevel,
    setLevel,
    export: exportData,
    import: importData,
    // exposed for the achievements screen and the build script's vocabulary
    TIER_ORDER,
    playKey,
  };
})();
