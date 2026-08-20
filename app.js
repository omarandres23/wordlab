/* =====================================================
   ENGLISH 11 — game logic
   Screens: home → intro modal → wordle / blanks
   Data comes from data.js (GAME_DATA).
   ===================================================== */

// ---------- helpers ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* =====================================================
   DATA LOADER — the game banks load on demand, not up front.

   The home screen used to download and execute 2.4 MB of JavaScript before
   the player clicked anything, nearly all of it data banks for games they
   might never open. Each bank is a plain script declaring one global
   (WORDLINKS_DATA, STRANDS_DATA…), so injecting that same <script> when the
   game is actually picked makes the global appear exactly as before — the
   thirteen game blocks below did not change by a single line.

   Deliberately NOT fetch()+eval or ES modules: the whole project is built on
   window globals with no build step, and swapping that pattern would be a
   refactor, not a loading optimisation.

   Timing: loading starts when the card is CLICKED, in parallel with the intro
   modal opening. Reading the modal and picking a difficulty takes seconds, so
   the download lands inside that gap and the player never waits. START then
   awaits the promise before running the game.
   ===================================================== */

// Cache-busting for injected scripts. MUST match the ?v= suffix on the
// <script> tags in index.html — the regex bump updates both, and this is the
// single place the JS side reads it from.
const ASSET_V = "sp21";

const DataLoader = (() => {
  // one entry per game: the files that must exist before start...() runs.
  // waffle_data.js is NOT here on purpose — see the eager note in index.html.
  const DEFS = "definitions.js"; // shared meanings bank, 204 KB, loaded once
  const NEEDS = {
    wordle: ["data.js"],
    // spFibInitialReveal() lives in starparty_minigames.js — Fill in the Blanks
    // has depended on it since before Star Party was paused. That file only
    // touches the Star Party banks inside spMgBuildPools(), which this game
    // never calls, so it loads standalone.
    blanks: ["data.js", "starparty_minigames.js", DEFS],
    spot: ["spot_data.js"],
    wordlinks: ["wordlinks_data.js"],
    impostor: ["impostor_data.js", "impostor_explanations_es.js", "impostor_labels.js", DEFS],
    connections: ["connections_data.js", "connections_categories_es.js", DEFS],
    realword: ["realword_data.js", DEFS],
    bombword: ["bombword_data.js"],
    waffle: [DEFS], // waffle_data.js is already loaded eagerly
    emojibomb: ["emojibomb_data.js"],
    strands: ["strands_data.js", DEFS],
    emojimatch: ["emojimatch_data.js", DEFS],
    hearit: ["hearit_data.js", DEFS],
  };

  // Cache is keyed by FILE, not by game: definitions.js is shared by eight
  // games and must only ever be fetched once, and double-clicking a card must
  // not start two downloads. A file's promise is memoised the moment it starts.
  const inFlight = new Map();
  // Separate from inFlight on purpose: inFlight means "asked for", done means
  // "the global actually exists now". isReady() must answer the second one, or
  // START would fire mid-download and hit an undefined global.
  const done = new Set();

  function loadFile(file) {
    if (inFlight.has(file)) return inFlight.get(file);
    const p = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = file + "?v=" + ASSET_V;
      s.async = false; // preserve execution order within a batch
      s.onload = () => { done.add(file); resolve(file); };
      s.onerror = () => {
        inFlight.delete(file); // a failed load must stay retryable
        s.remove();
        reject(new Error("No se pudo cargar " + file));
      };
      document.body.appendChild(s);
    });
    inFlight.set(file, p);
    return p;
  }

  // Returns a promise for every file this game needs. Safe to call repeatedly.
  function load(game) {
    const files = NEEDS[game] || [];
    return Promise.all(files.map(loadFile)).then(() => game);
  }

  // Synchronous: lets START decide whether to show a loading state at all,
  // instead of flashing one for the common already-cached case.
  const isReady = (game) => (NEEDS[game] || []).every((f) => done.has(f));
  const filesFor = (game) => (NEEDS[game] || []).slice();

  return { load, isReady, filesFor, ASSET_V };
})();

// The promise for the game whose modal is currently open. START awaits it.
let pendingLoad = null;

// ---------- sound control: speaker icon + volume popover (header and every
// game screen with sound) ----------
// every instance shares SFX's single localStorage-backed muted/volume state,
// so touching any one of them updates every icon and slider on the page.
//
// Structure per instance:
//   <div class="sfx-control">
//     <button data-sfx-toggle>            -- click opens/closes the popover
//       <span class="mute-icon">          -- reflects mute state (visible even closed)
//     <div class="sfx-panel" data-sfx-panel>   -- the popover itself
//       <button data-mute-btn>            -- actually toggles mute, lives INSIDE the panel
//         <span class="mute-icon">
//       <input data-sfx-volume>           -- the volume slider

// updates EVERY speaker icon on the page (both the outer trigger and the
// mute toggle inside each panel) — there are two icons per instance
function muteRenderIcons() {
  const muted = SFX.isMuted();
  $$(".mute-icon").forEach((icon) => {
    icon.textContent = muted ? "🔇" : "🔊";
  });
  $$("[data-mute-btn]").forEach((btn) => {
    btn.setAttribute("aria-label", muted ? "Unmute sound effects" : "Mute sound effects");
  });
  // purely visual: the header trigger is an image now, so it can't swap glyph
  // like the emoji does. CSS dims/desaturates it off this class instead.
  $$(".sfx-control").forEach((c) => c.classList.toggle("is-muted", muted));
}
$$("[data-mute-btn]").forEach((btn) =>
  btn.addEventListener("click", () => {
    SFX.toggleMuted();
    muteRenderIcons();
  })
);
muteRenderIcons(); // reflect the persisted preference on load

function volumeRenderSliders() {
  const pct = Math.round(SFX.getVolume() * 100);
  $$("[data-sfx-volume]").forEach((slider) => {
    slider.value = pct;
  });
}
$$("[data-sfx-volume]").forEach((slider) =>
  slider.addEventListener("input", () => {
    SFX.setVolume(Number(slider.value) / 100);
    volumeRenderSliders(); // keep every slider on the page in sync with this one
  })
);
volumeRenderSliders(); // reflect the persisted volume (default 0.5) on load

// ---- popover open/close ----
function sfxCloseAllPanels(except) {
  $$("[data-sfx-panel]").forEach((panel) => {
    if (panel !== except) {
      panel.classList.add("hidden");
      panel.closest(".sfx-control")?.querySelector("[data-sfx-toggle]")?.setAttribute("aria-expanded", "false");
    }
  });
}
$$("[data-sfx-toggle]").forEach((btn) => {
  const panel = btn.parentElement.querySelector("[data-sfx-panel]");
  btn.addEventListener("click", (e) => {
    e.stopPropagation(); // don't let this same click immediately hit the outside-click closer below
    const willOpen = panel.classList.contains("hidden");
    sfxCloseAllPanels(willOpen ? panel : null);
    panel.classList.toggle("hidden", !willOpen);
    btn.setAttribute("aria-expanded", String(willOpen));
  });
});
// tap outside any open panel closes it
document.addEventListener("click", (e) => {
  if (!e.target.closest(".sfx-control")) sfxCloseAllPanels(null);
});

function showScreen(id) {
  $$(".screen").forEach((s) => s.classList.remove("active"));
  $(id).classList.add("active");
  // the sound control lives in the header (outside the screen system, so it
  // stays visually anchored beside the logo) but must only be VISIBLE on the
  // home screen — every game screen had its own copy removed entirely.
  const sfx = $("#home-sfx-control");
  if (sfx) sfx.classList.toggle("hidden", id !== "#screen-home");
  // The badge counter is anchored in the header the same way, so it follows the
  // same rule. Landing on home is also the moment to repaint the medals and the
  // red dot: a game just ended, so a badge may have become claimable.
  if (id === "#screen-home" && typeof refreshBadgeUI === "function") refreshBadgeUI();
  else {
    const counter = $("#home-badge-counter");
    if (counter) counter.classList.add("hidden");
  }
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// shared word meanings (definitions.js → DEFINITIONS). Keys are UPPERCASE,
// each value is { en, es }.
//
// `lang` is optional and normally left out: it falls back to selectedLanguage,
// the language the player picked on the game's loading screen. That makes the
// language choice the single source of truth for meanings too, so a player on
// Spanish reads meanings in Spanish immediately — no extra "translate" button
// to press. Pass `lang` explicitly only to force one specific language.
function lookupDefinition(word, lang) {
  if (typeof DEFINITIONS !== "object" || !DEFINITIONS) return null;
  const entry = DEFINITIONS[String(word).toUpperCase()];
  if (!entry) return null;
  const l = lang || selectedLanguage;
  // fall back to the other language rather than showing nothing, in the rare
  // case an entry only has one side filled in.
  return (l === "es" ? entry.es || entry.en : entry.en || entry.es) || null;
}

const LEVEL_LABELS = { basico: "Basic", intermedio: "Intermediate", avanzado: "Advanced" };
const CAT_LABELS = { business: "Business", travel: "Travel", daily: "Daily", general: "General" };

const GAME_INFO = {
  wordle: {
    title: "WORDLE",
    desc: "Guess the hidden English word in 6 tries. Green = right letter, right spot. Yellow = right letter, wrong spot. Gray = not in the word.",
  },
  blanks: {
    title: "FILL IN THE BLANKS",
    desc: "Complete 4 sentences with the missing word. Some starting letters are shown — type the rest before time runs out. Your first miss reveals a few extra letters (only once). Unlimited tries, 1 point per sentence.",
  },
  spot: {
    title: "SPOT THE ERROR",
    desc: "3 rounds. In each round, one of 4 sentences has an error: first find the wrong sentence, then click the exact word with the mistake. Start each round with 2 points — wrong sentence -0.25, wrong word -0.5.",
  },
  strands: {
    title: "STRANDS",
    desc: "Find 8 hidden words connected by a theme, including the spangram (it touches two opposite sides). Drag across adjacent letters to trace a word. Extra real words you find along the way earn hints: every 3 gives you 1.",
  },
  hearit: {
    title: "HEAR IT",
    desc: "Listen to an English word and answer what you heard. Basic: pick from 4 options, listen as often as you want. Intermediate: type it, 3 listens. Advanced: type it, 1 listen and 10 seconds. 8 rounds, 1 point each.",
  },
  emojimatch: {
    title: "EMOJI MATCH",
    desc: "Three emojis, four words. Pick the one they describe. 8 rounds, no timer and no lives — take your time. A wrong pick shows you the right answer before moving on. 1 point per correct answer.",
  },
  emojibomb: {
    title: "EMOJI BOMB",
    desc: "One letter, three emojis, one word. Type the exact word they describe before the bomb goes off. 4 levels. Choose Basico (3 lives per level) or Hardcore (1 try, no room for mistakes).",
  },
  waffle: {
    title: "WAFFLE",
    desc: "Swap letters to solve 6 (or 8) connected words. Green = right spot, yellow = in this word but wrong spot, gray = not in its words. Click one cell, then another, to swap their letters before your swaps run out.",
  },
  bombword: {
    title: "BOMB WORD",
    desc: "You'll see letters. Type any real English word that starts with them before time runs out. 4 levels, getting harder each time. One mistake and you're out.",
  },
  realword: {
    title: "IS IT A REAL WORD?",
    desc: "You'll see 8 words. Decide if each one is REAL or FAKE. You have 6 seconds per word — no answer counts as incorrect. 1 point per correct answer.",
  },
  connections: {
    title: "CONNECTIONS",
    desc: "Group 16 words into 4 hidden categories by meaning. Select 4 words and press Submit — unlimited tries, but Give Up resets your score to 0. Each solved group is 1 point.",
  },
  impostor: {
    title: "IMPOSTOR",
    desc: "Find the word that doesn't belong. One wrong click and you're out. 3 rounds: click the 4 words that share something, leave the impostor for last. No hint = 3 pts, with hint = 2 pts.",
  },
  wordlinks: {
    title: "WORD LINKS",
    desc: "Guess the secret word from 4 clue words. 3 rounds, 3 attempts each: guess on attempt 1 for 3 points, attempt 2 for 2, attempt 3 for 1. The HINT button reveals a 5th clue but costs 1 attempt.",
  },
};

// ---------- language toggle (shared intro modal) ----------
// selectedLanguage is the language chosen on the loading screen for the
// CURRENT game session — 'es' or 'en'. It stays fixed once the player hits
// START (nothing re-reads it mid-game); re-opening the intro modal (Play
// Again / Change Settings / picking another game) resets it back to the
// 'en' default and lets the player choose again.
let selectedLanguage = "en";

function setLanguage(lang) {
  selectedLanguage = lang === "es" ? "es" : "en";
  $("#lang-toggle").dataset.active = selectedLanguage;
  $("#lang-btn-es").classList.toggle("active", selectedLanguage === "es");
  $("#lang-btn-en").classList.toggle("active", selectedLanguage === "en");
  $("#lang-btn-es").setAttribute("aria-pressed", selectedLanguage === "es" ? "true" : "false");
  $("#lang-btn-en").setAttribute("aria-pressed", selectedLanguage === "en" ? "true" : "false");
  if (pendingGame) applyIntroLanguage(pendingGame); // live-update the open modal when the player toggles
}

$("#lang-btn-es").addEventListener("click", () => setLanguage("es"));
$("#lang-btn-en").addEventListener("click", () => setLanguage("en"));

// ---------- UI_STRINGS lookup (ui_strings_en.js / ui_strings_es.js) ----------
// t(game, "buttons.hint") reads the string for the CURRENT selectedLanguage,
// falling back to English if the key is missing in either dictionary.
// ts(path) is the same for the "_shared" section (intro modal chrome, the
// generic level/category labels, and the shared back/play-again/back-to-menu
// button text used across screens).
function t(game, path) {
  const dig = (dict) => {
    let node = dict && dict[game];
    for (const key of path.split(".")) {
      if (node == null) return undefined;
      node = node[key];
    }
    return node;
  };
  const primary = selectedLanguage === "es" ? UI_STRINGS_ES : UI_STRINGS_EN;
  const val = dig(primary);
  return val !== undefined ? val : dig(UI_STRINGS_EN);
}
function ts(path) {
  return t("_shared", path);
}

// applies a list of [selector, text] pairs — used once per startX() call to
// translate that game's static buttons/labels (the ones always in the DOM,
// just hidden until their screen is shown) in the CURRENT selectedLanguage.
function applyText(pairs) {
  pairs.forEach(([selector, text]) => {
    const el = typeof selector === "string" ? $(selector) : selector;
    if (el && text != null) el.textContent = text;
  });
}

// ui_strings_*.json keep each message's original ${...} placeholders as
// literal text (e.g. "💡 Pista: ... (${myAnswer.length} letras)"). interp()
// substitutes them with real runtime values — vars keys must match the
// placeholder expression exactly (e.g. { "myAnswer.length": 5 }). Brace-depth
// counting (not a simple regex) because a couple of messages nest a template
// literal with its own ${...} inside the outer placeholder (Waffle's
// end_detail_won: "${wfSwapsLeft !== null ? `with ${wfSwapsLeft} ...` : ""}").
function interp(template, vars) {
  if (template == null) return "";
  let out = "";
  let i = 0;
  while (i < template.length) {
    if (template[i] === "$" && template[i + 1] === "{") {
      let depth = 1;
      let j = i + 2;
      while (j < template.length && depth > 0) {
        if (template[j] === "{") depth++;
        else if (template[j] === "}") depth--;
        j++;
      }
      const expr = template.slice(i + 2, j - 1);
      out += Object.prototype.hasOwnProperty.call(vars, expr) ? vars[expr] : `\${${expr}}`;
      i = j;
    } else {
      out += template[i];
      i++;
    }
  }
  return out;
}

// ---------- intro modal ----------
let pendingGame = null;

function openIntro(game) {
  pendingGame = game;
  setLanguage("en"); // default to English every time the modal opens (also renders the modal text)

  // "General" category only exists in the vocab bank (wordle), not in blanks
  const generalOpt = $("#opt-general");
  const generalInput = generalOpt.querySelector("input");
  if (game === "blanks") {
    generalOpt.style.display = "none";
    if (generalInput.checked) $('input[name="category"][value="business"]').checked = true;
  } else {
    generalOpt.style.display = "";
  }

  // Spot the Error, Word Links, Connections, Is It a Real Word, Emoji Match and
  // Hear It have no categories — difficulty only.
  // Bomb Word has NO selectors; Emoji Bomb and Strands only have their own mode row.
  // Fill in the Blanks, Impostor and Wordle no longer show category either — those
  // games now mix every category together and only ask for difficulty.
  const noSelectors = game === "bombword" || game === "emojibomb" || game === "strands";
  const showCategory =
    !noSelectors &&
    game !== "spot" && game !== "wordlinks" && game !== "connections" && game !== "waffle" &&
    game !== "blanks" && game !== "impostor" && game !== "wordle" && game !== "realword" &&
    game !== "emojimatch" && game !== "hearit";
  $("#category-label").style.display = showCategory ? "" : "none";
  $("#category-row").style.display = showCategory ? "" : "none";

  // Strands has no difficulty levels
  const hideDifficulty = noSelectors || game === "strands";
  $("#difficulty-label").style.display = hideDifficulty ? "none" : "";
  $("#difficulty-row").style.display = hideDifficulty ? "none" : "";

  $("#opt-avanzado").style.display = "";

  // Waffle has its Normal/Deluxe mode selector; Emoji Bomb has Basico/Hardcore
  const isWaffle = game === "waffle";
  $("#mode-label").style.display = isWaffle ? "" : "none";
  $("#mode-row").style.display = isWaffle ? "" : "none";
  const isEmojiBomb = game === "emojibomb";
  $("#eb-mode-label").style.display = isEmojiBomb ? "" : "none";
  $("#eb-mode-row").style.display = isEmojiBomb ? "" : "none";
  const isStrands = game === "strands";
  $("#st-mode-label").style.display = isStrands ? "" : "none";
  $("#st-mode-row").style.display = isStrands ? "" : "none";
  wfUpdateIntroExtra();

  $("#intro-overlay").classList.remove("hidden");
}

// renders every translatable piece of the shared intro modal (title, desc,
// START button, mode/difficulty/category labels+options) for `game` in the
// CURRENT selectedLanguage. Called once when the modal opens, and again every
// time the player flips the flag toggle, so the modal updates live.
function applyIntroLanguage(game) {
  // Fill in the Blanks / Impostor / Bomb Word keep a composed icon+logo header
  // whose words ("FILL IN", "BLANKS", "IMPOSTOR", "BOMB WORD") are brand names
  // that stay identical in both languages (confirmed in ui_strings_*.json) —
  // only the plain-text titles of the other 8 games route through t().
  if (game === "blanks") {
    $("#intro-title").innerHTML =
      `<span class="fib-logo">
         <span class="fib-logo-word">FILL IN</span>
         <span class="fib-logo-cells">
           <span class="fib-cell done">A</span>
           <span class="fib-cell up"></span>
           <span class="fib-cell"></span>
           <span class="fib-cell"></span>
         </span>
         <span class="fib-logo-word">BLANKS</span>
       </span>`;
  } else if (game === "impostor") {
    $("#intro-title").innerHTML =
      `<span class="intro-icon-logo">
         <svg class="mini-impo-spy" viewBox="0 0 120 120" width="70" height="70" aria-hidden="true">
           <ellipse cx="60" cy="50" rx="50" ry="12" fill="#fff"/>
           <path d="M30 50 Q30 20 46 17 Q60 15 74 17 Q90 20 90 50 Q75 44 60 44 Q45 44 30 50 Z" fill="#f1eef7"/>
           <path d="M31 47 Q45 41 60 41 Q75 41 89 47 L88 51 Q74 45 60 45 Q46 45 32 51 Z" fill="#c9bfe0"/>
           <circle cx="44" cy="80" r="15" fill="#e9e5f3" stroke="#fff" stroke-width="3"/>
           <circle cx="76" cy="80" r="15" fill="#e9e5f3" stroke="#fff" stroke-width="3"/>
           <path d="M57 76 Q60 72 63 76" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
           <path d="M29 74 L20 70 M91 74 L100 70" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
         </svg>
         <span class="intro-icon-logo-word">${GAME_INFO[game].title}</span>
       </span>`;
  } else if (game === "bombword") {
    $("#intro-title").innerHTML =
      `<span class="intro-icon-logo">
         <span class="intro-icon-logo-emoji">💣</span>
         <span class="intro-icon-logo-word">${GAME_INFO[game].title}</span>
       </span>`;
  } else {
    $("#intro-title").textContent = t(game, "intro_title") || GAME_INFO[game].title;
  }
  $("#intro-desc").textContent = t(game, "intro") || GAME_INFO[game].desc;

  $("#intro-start").textContent = ts("intro_modal.start_button");
  $("#mode-label").textContent = ts("intro_modal.mode_label");
  $("#eb-mode-label").textContent = ts("intro_modal.eb_mode_label");
  $("#st-mode-label").textContent = ts("intro_modal.st_mode_label");
  $("#difficulty-label").textContent = ts("intro_modal.difficulty_label");
  $("#category-label").textContent = ts("intro_modal.category_label");

  const setOptText = (input, text) => {
    const span = input.closest(".opt").querySelector("span");
    if (span) span.textContent = text;
  };
  setOptText($('input[name="difficulty"][value="basico"]'), ts("intro_modal.difficulty_options.basic"));
  setOptText($('input[name="difficulty"][value="intermedio"]'), ts("intro_modal.difficulty_options.intermediate"));
  setOptText($('input[name="difficulty"][value="avanzado"]'), ts("intro_modal.difficulty_options.advanced"));
  setOptText($('input[name="category"][value="business"]'), ts("intro_modal.category_options.business"));
  setOptText($('input[name="category"][value="travel"]'), ts("intro_modal.category_options.travel"));
  setOptText($('input[name="category"][value="daily"]'), ts("intro_modal.category_options.daily"));
  setOptText($('input[name="category"][value="general"]'), ts("intro_modal.category_options.general"));
  setOptText($('input[name="wmode"][value="normal"]'), ts("intro_modal.waffle_mode_options.normal"));
  setOptText($('input[name="wmode"][value="deluxe"]'), ts("intro_modal.waffle_mode_options.deluxe"));
  setOptText($('input[name="ebmode"][value="basico"]'), ts("intro_modal.emojibomb_mode_options.basico"));
  setOptText($('input[name="ebmode"][value="hardcore"]'), ts("intro_modal.emojibomb_mode_options.hardcore"));
  setOptText($('input[name="stmode"][value="normal"]'), ts("intro_modal.strands_mode_options.normal"));
  setOptText($('input[name="stmode"][value="hardcore"]'), ts("intro_modal.strands_mode_options.hardcore"));
}

// context line in the modal: Waffle swaps info / Emoji Bomb mode description
function wfUpdateIntroExtra() {
  const extra = $("#intro-extra");
  if (pendingGame === "emojibomb") {
    const ebMode = document.querySelector('input[name="ebmode"]:checked').value;
    extra.textContent =
      ebMode === "hardcore"
        ? "Hardcore: 1 try, no room for mistakes · 8s/8s/6s/6s"
        : "Basico: 3 lives per level · 9s/9s/7s/7s";
    return;
  }
  if (pendingGame === "strands") {
    const stMode = document.querySelector('input[name="stmode"]:checked').value;
    extra.textContent =
      stMode === "hardcore"
        ? "Hardcore: 3 lives · lose one only for tracing letters that spell no real word · 5 extra words per hint"
        : "Normal: no lives · 3 extra words per hint";
    return;
  }
  if (pendingGame !== "waffle") {
    extra.textContent = "";
    return;
  }
  const mode = document.querySelector('input[name="wmode"]:checked').value;
  const levelRaw = document.querySelector('input[name="difficulty"]:checked').value;
  const limit = WAFFLE_DATA.swaps[mode][WL_LEVEL_KEYS[levelRaw]];
  const modeName = mode === "deluxe" ? "Deluxe (7×7, 8 words)" : "Normal (5×5, 6 words)";
  extra.textContent =
    limit === null
      ? `${modeName} · Basic: unlimited swaps`
      : `${modeName} · ${ts("level_labels." + levelRaw)}: ${limit} swaps`;
}

$$('input[name="wmode"], input[name="difficulty"], input[name="ebmode"], input[name="stmode"]').forEach((input) =>
  input.addEventListener("change", wfUpdateIntroExtra)
);

$$(".game-card").forEach((card) => {
  card.addEventListener("click", () => {
    // STAR PARTY has its own multi-player setup screen, not the shared intro modal
    if (card.dataset.game === "starparty") {
      if (typeof spOpenSetup === "function") spOpenSetup();
      return;
    }
    // Same tick: the modal opens while the bank downloads, so reading it
    // covers the transfer and the player normally never sees a wait.
    // openIntro() FIRST — it re-renders the modal text, including the START
    // label, so starting the load after it is what keeps the busy state.
    openIntro(card.dataset.game);
    startLoading(card.dataset.game);
  });
});

// Begins (or re-uses) the load for a game and wires the START button's state
// to it. Called from both the card click and PLAY AGAIN.
function startLoading(game) {
  const btn = $("#intro-start");
  introLoadFailed = false;
  if (DataLoader.isReady(game)) {
    pendingLoad = Promise.resolve(game);
    setStartBusy(false);
    return pendingLoad;
  }
  setStartBusy(true);
  pendingLoad = DataLoader.load(game).then(
    (g) => {
      if (pendingGame === game) setStartBusy(false);
      return g;
    },
    (err) => {
      if (pendingGame === game) {
        introLoadFailed = true;
        setStartBusy(false);
        $("#intro-extra").textContent = ts("intro_modal.load_error");
      }
      throw err;
    }
  );
  // the catch above already surfaces it; this keeps it off the unhandled list
  pendingLoad.catch(() => {});
  return pendingLoad;
}

let introLoadFailed = false;

// START disabled + "Loading…" while the bank is still in flight. Never let the
// player through with an undefined global.
function setStartBusy(busy) {
  const btn = $("#intro-start");
  if (!btn) return;
  btn.disabled = busy;
  btn.classList.toggle("is-loading", busy);
  btn.textContent = busy ? ts("intro_modal.loading") : ts("intro_modal.start_button");
}

$("#intro-close").addEventListener("click", () => {
  $("#intro-overlay").classList.add("hidden");
  pendingGame = null;
});

$("#intro-start").addEventListener("click", () => {
  const level = document.querySelector('input[name="difficulty"]:checked').value;
  const category = document.querySelector('input[name="category"]:checked').value;
  const game = pendingGame;

  // The bank may still be downloading (slow network, or an unusually fast
  // click). Wait for it rather than starting a game whose global is undefined;
  // the modal stays open and the button shows its loading state meanwhile.
  if (!DataLoader.isReady(game)) {
    setStartBusy(true);
    // After a failure the stored promise is already rejected, and .then() on it
    // would re-report the error without ever retrying — which would make the
    // "press START again" message a lie. Start a fresh load instead.
    const attempt = introLoadFailed || !pendingLoad ? startLoading(game) : pendingLoad;
    attempt.then(
      () => { if (pendingGame === game) runGame(game, category, level); },
      () => {
        introLoadFailed = true;
        setStartBusy(false);
        $("#intro-extra").textContent = ts("intro_modal.load_error");
      }
    );
    return;
  }
  runGame(game, category, level);
});

// The dispatch itself, unchanged — only lifted out so the START handler can
// call it either immediately or once the download lands.
function runGame(pendingGame, category, level) {
  $("#intro-overlay").classList.add("hidden");

  if (pendingGame === "wordle") startWordle(category, level);
  if (pendingGame === "blanks") startBlanks(category, level);
  if (pendingGame === "spot") startSpot(level);
  if (pendingGame === "wordlinks") startWordLinks(level);
  if (pendingGame === "impostor") startImpostor(category, level);
  if (pendingGame === "connections") startConnections(level);
  if (pendingGame === "realword") startRealword(level);
  if (pendingGame === "emojimatch") startEmojiMatch(level);
  if (pendingGame === "hearit") startHearIt(level);
  if (pendingGame === "bombword") startBombword();
  if (pendingGame === "waffle")
    startWaffle(document.querySelector('input[name="wmode"]:checked').value, level);
  if (pendingGame === "emojibomb")
    startEmojiBomb(document.querySelector('input[name="ebmode"]:checked').value);
  if (pendingGame === "strands")
    startStrands(document.querySelector('input[name="stmode"]:checked').value);
}

// back buttons + play again
$$("[data-back]").forEach((btn) =>
  btn.addEventListener("click", () => {
    wordleActive = false;
    rwStopTimer(); // leaving Is It a Real Word mid-game must kill its timer
    bwStopTimer(); // same for Bomb Word
    ebStopTimer(); // same for Emoji Bomb
    fbStopTimer(); // same for Fill in the Blanks
    fbStopMeaningTimer(); // and its post-answer meaning panel
    stStopReveal(); // and Strands' give-up reveal sequence
    SFX.stopAll(); // leaving mid-game must not leave the tick loop (or anything else) running
    showScreen("#screen-home");
  })
);

$$("[data-replay]").forEach((btn) =>
  btn.addEventListener("click", () => {
    wordleActive = false;
    SFX.stopAll();
    showScreen("#screen-home");
    openIntro(btn.dataset.replay); // reopen the selector for the same game
    // already cached by definition (the game just finished), so this resolves
    // immediately and START never flashes its loading state
    startLoading(btn.dataset.replay);
  })
);

/* =====================================================
   GAME 1 — WORDLE
   ===================================================== */
const MAX_TRIES = 6;
const HINT2_AFTER = 2; // failed rows before the second hint appears
let wordleActive = false;
let answer = "";
let currentRow = 0;
let currentGuess = "";
let keyStates = {}; // letter -> green | yellow | gray
let wordInfo = null; // { pos, definition, synonym, example } from the dictionary API
let hint2Shown = false;
let greenPositions = new Set(); // positions the player already guessed in green
let hintedPositions = new Set(); // positions revealed with the HINT button
// the difficulty this round was started on. Wordle used to just consume its
// `level` argument and forget it; the achievement layer needs to know which
// difficulty a win belongs to. Same xxLevelRaw convention the other games use.
let wordleLevelRaw = null;

// Word length preference: 5 is the sweet spot, shorter is fine, 6-7 are rare.
const LENGTH_WEIGHTS = { 3: 3, 4: 4, 5: 6, 6: 2, 7: 1 };

function pickWordleWord(pool) {
  const bag = [];
  pool.forEach((w) => {
    const weight = LENGTH_WEIGHTS[w.length] || 0;
    for (let i = 0; i < weight; i++) bag.push(w);
  });
  return randomItem(bag);
}

// Free dictionary lookup (dictionaryapi.dev) for hints + final meaning
async function fetchWordInfo(word) {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const meanings = (data[0] && data[0].meanings) || [];
    if (!meanings.length) return null;

    const info = {
      pos: meanings[0].partOfSpeech || null,
      definition: (meanings[0].definitions[0] && meanings[0].definitions[0].definition) || null,
      synonym: null,
      example: null,
    };
    meanings.forEach((m) => {
      (m.definitions || []).forEach((d) => {
        if (!info.example && d.example) info.example = d.example;
        if (!info.synonym && d.synonyms && d.synonyms.length) info.synonym = d.synonyms[0];
      });
      if (!info.synonym && m.synonyms && m.synonyms.length) info.synonym = m.synonyms[0];
    });
    return info;
  } catch (err) {
    return null; // offline or word not in dictionary — game still playable
  }
}

// Hide the answer (and derived forms) inside hint/example text
function maskWord(text) {
  const root = answer.length > 4 ? answer.slice(0, answer.length - 2) : answer;
  return text.replace(new RegExp(`\\b${root}\\w*`, "gi"), "_____");
}

// HINT button: reveal one green letter the player does NOT have yet
// (never a position already guessed in green or already revealed by a hint)
function useHint() {
  if (!wordleActive) return;
  const candidates = [];
  for (let i = 0; i < answer.length; i++) {
    if (!greenPositions.has(i) && !hintedPositions.has(i)) candidates.push(i);
  }
  if (!candidates.length) return;

  SFX.play("hint");
  hintedPositions.add(randomItem(candidates));
  renderHintReveals();
  if (hintedPositions.size + greenPositions.size >= answer.length) {
    $("#wordle-hint-btn").disabled = true;
  }
}

function renderHintReveals() {
  const wrap = $("#hint-reveals");
  wrap.innerHTML = "";
  wrap.classList.remove("hidden");
  for (let i = 0; i < answer.length; i++) {
    const tile = document.createElement("div");
    tile.className = "hint-tile";
    if (hintedPositions.has(i)) {
      tile.classList.add("revealed");
      tile.textContent = answer[i];
    }
    wrap.appendChild(tile);
  }
}

$("#wordle-hint-btn").addEventListener("click", useHint);

$("#wordle-forfeit-btn").addEventListener("click", () => {
  if (!wordleActive) return;
  endWordle(false, true);
});

function buildHint2() {
  if (!wordInfo) return null;
  if (wordInfo.synonym && wordInfo.synonym.toLowerCase() !== answer) {
    return `💭 Similar meaning to: "${wordInfo.synonym}"`;
  }
  if (wordInfo.example) {
    return `💭 You could hear it like this: "${maskWord(wordInfo.example)}"`;
  }
  if (wordInfo.definition) {
    return `💭 Clue: ${maskWord(wordInfo.definition)}`;
  }
  return null;
}

const KB_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["enter", "z", "x", "c", "v", "b", "n", "m", "back"],
];

function startWordle(category, level) {
  wordleLevelRaw = level;
  // category selector removed — mix every category (business/travel/daily/general)
  // together and pick randomly from the combined pool for this difficulty.
  const pool = Object.values(GAME_DATA.vocab)
    .flatMap((byLevel) => byLevel[level] || [])
    .filter((w) => /^[a-z]{3,7}$/.test(w)); // only plain a-z words, 3 to 7 letters (5 is ideal — see LENGTH_WEIGHTS)
  answer = pickWordleWord(pool).toLowerCase();
  currentRow = 0;
  currentGuess = "";
  keyStates = {};
  wordleActive = true;
  wordInfo = null;
  hint2Shown = false;
  greenPositions = new Set();
  hintedPositions = new Set();

  $("#wordle-meta").textContent = ts("level_labels." + level);
  $("#wordle-message").textContent = "";
  $("#wordle-end").classList.add("hidden");
  $("#wordle-hint1").textContent = "";
  $("#wordle-hint2").textContent = "";
  $("#wordle-hint2").classList.add("hidden");
  $("#hint-reveals").classList.add("hidden");
  $("#hint-reveals").innerHTML = "";
  $("#wordle-hint-btn").disabled = false;
  $("#wordle-forfeit-btn").disabled = false;
  applyText([
    ["#screen-wordle .game-topline [data-back]", ts("buttons.back")],
    ["#wordle-hint-btn", t("wordle", "buttons.hint")],
    ["#wordle-forfeit-btn", t("wordle", "buttons.forfeit")],
    ['#screen-wordle [data-replay="wordle"]', t("wordle", "buttons.play_again")],
    ["#wordle-end [data-back]", t("wordle", "buttons.back_to_menu")],
  ]);

  // first hint: what kind of word it is (noun / verb / adjective...)
  const myAnswer = answer;
  fetchWordInfo(answer).then((info) => {
    if (answer !== myAnswer) return; // player already started another round
    wordInfo = info;
    if (info && info.pos) {
      $("#wordle-hint1").textContent = interp(t("wordle", "messages.hint1_pos"), { "info.pos": info.pos, "myAnswer.length": myAnswer.length });
    } else {
      $("#wordle-hint1").textContent = interp(t("wordle", "messages.hint1_no_pos"), { "myAnswer.length": myAnswer.length });
    }
  });

  buildBoard();
  buildKeyboard();
  showScreen("#screen-wordle");
}

function buildBoard() {
  const board = $("#wordle-board");
  board.innerHTML = "";
  board.classList.remove("compact", "tiny");
  if (answer.length >= 8) board.classList.add("compact");
  if (answer.length >= 12) board.classList.add("tiny");

  for (let r = 0; r < MAX_TRIES; r++) {
    const row = document.createElement("div");
    row.className = "board-row";
    row.style.gridTemplateColumns = `repeat(${answer.length}, auto)`;
    for (let c = 0; c < answer.length; c++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.id = `tile-${r}-${c}`;
      row.appendChild(tile);
    }
    board.appendChild(row);
  }
}

function buildKeyboard() {
  const kb = $("#keyboard");
  kb.innerHTML = "";
  KB_ROWS.forEach((rowKeys) => {
    const row = document.createElement("div");
    row.className = "kb-row";
    rowKeys.forEach((k) => {
      const btn = document.createElement("button");
      btn.className = "key" + (k.length > 1 ? " wide" : "");
      btn.textContent = k === "back" ? "⌫" : k;
      btn.dataset.key = k;
      btn.addEventListener("click", () => handleKey(k));
      row.appendChild(btn);
    });
    kb.appendChild(row);
  });
}

document.addEventListener("keydown", (e) => {
  if (!wordleActive) return;
  if (e.key === "Enter") handleKey("enter");
  else if (e.key === "Backspace") handleKey("back");
  else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toLowerCase());
});

function handleKey(k) {
  if (!wordleActive) return;
  $("#wordle-message").textContent = "";

  if (k === "back") {
    currentGuess = currentGuess.slice(0, -1);
  } else if (k === "enter") {
    submitGuess();
    return;
  } else if (currentGuess.length < answer.length) {
    SFX.play("letter_move"); // fires the same for on-screen clicks and physical keys — both funnel through handleKey
    currentGuess += k;
  }
  paintCurrentRow();
}

function paintCurrentRow() {
  for (let c = 0; c < answer.length; c++) {
    const tile = $(`#tile-${currentRow}-${c}`);
    tile.textContent = currentGuess[c] || "";
    tile.classList.toggle("filled", Boolean(currentGuess[c]));
  }
}

function submitGuess() {
  if (currentGuess.length !== answer.length) {
    $("#wordle-message").textContent = interp(t("wordle", "messages.not_enough_letters"), { "answer.length": answer.length });
    return;
  }

  // classic wordle scoring with duplicate handling
  const result = new Array(answer.length).fill("gray");
  const remaining = {};
  for (let i = 0; i < answer.length; i++) {
    if (currentGuess[i] === answer[i]) result[i] = "green";
    else remaining[answer[i]] = (remaining[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < answer.length; i++) {
    if (result[i] === "green") continue;
    const ch = currentGuess[i];
    if (remaining[ch] > 0) {
      result[i] = "yellow";
      remaining[ch]--;
    }
  }

  const rank = { gray: 0, yellow: 1, green: 2 };
  for (let c = 0; c < answer.length; c++) {
    if (result[c] === "green") greenPositions.add(c);
    $(`#tile-${currentRow}-${c}`).classList.add(result[c]);
    const ch = currentGuess[c];
    if (!keyStates[ch] || rank[result[c]] > rank[keyStates[ch]]) keyStates[ch] = result[c];
  }
  $$(".key").forEach((btn) => {
    const st = keyStates[btn.dataset.key];
    btn.classList.remove("green", "yellow", "gray");
    if (st) btn.classList.add(st);
  });

  if (currentGuess === answer) {
    endWordle(true);
    return;
  }

  currentRow++;
  currentGuess = "";
  if (currentRow >= MAX_TRIES) {
    endWordle(false);
    return;
  }

  // second hint after two failed tries
  if (currentRow >= HINT2_AFTER && !hint2Shown) {
    const hint = buildHint2();
    if (hint) {
      $("#wordle-hint2").textContent = hint;
      $("#wordle-hint2").classList.remove("hidden");
    }
    hint2Shown = true;
  }
}

function endWordle(won, forfeited = false) {
  wordleActive = false;
  // a hint disqualifies the run; the store applies that rule, this only reports
  Progress.record({ game: "wordle", level: wordleLevelRaw, won, usedHint: hintedPositions.size > 0 });
  SFX.play("success"); // end-of-game cue, win or lose — nothing else sounds on submit
  $("#wordle-hint-btn").disabled = true;
  $("#wordle-forfeit-btn").disabled = true;
  $("#wordle-result").textContent = won
    ? t("wordle", "messages.result_won")
    : forfeited
      ? t("wordle", "messages.result_forfeited")
      : t("wordle", "messages.result_lost");
  $("#wordle-answer").textContent = answer;

  const meaningEl = $("#wordle-meaning");
  if (wordInfo && wordInfo.definition) {
    const pos = wordInfo.pos ? ` (${wordInfo.pos})` : "";
    meaningEl.textContent = interp(t("wordle", "messages.meaning"), { pos, "wordInfo.definition": wordInfo.definition });
  } else {
    meaningEl.textContent = "";
    // definition may still be loading — try once more when it arrives
    const myAnswer = answer;
    fetchWordInfo(answer).then((info) => {
      if (answer !== myAnswer || !info || !info.definition) return;
      const pos = info.pos ? ` (${info.pos})` : "";
      meaningEl.textContent = interp(t("wordle", "messages.meaning"), { pos, "wordInfo.definition": info.definition });
    });
  }

  $("#wordle-end").classList.remove("hidden");
}

/* =====================================================
   GAME 2 — FILL IN THE BLANKS
   ===================================================== */
let blanksRound = [];
let blanksIndex = 0;
let blanksScore = 0;
let blanksCells = []; // the editable letter inputs of the current sentence
let blanksReveal = 0; // letters currently revealed for this sentence
let blanksExtraUsed = false; // the one-time extra reveal after the first miss
let blanksOver = false; // current sentence resolved (won or timed out)
let blanksLevelRaw = null; // difficulty this round runs on, for the achievement layer
let blanksTimerId = null;
let blanksDeadline = 0;
// per-sentence timer, by level (same table as the STAR PARTY minigame)
const BLANKS_SECONDS = { basico: 20, intermedio: 15, avanzado: 10 };
let blanksSeconds = 20;

function fbStopTimer() {
  SFX.stop("tick_soft"); // single choke point: covers correct/timeout/exit/next sentence
  if (blanksTimerId) {
    clearInterval(blanksTimerId);
    blanksTimerId = null;
  }
}

// independent 8s timer for the post-answer meaning panel (starts only after
// the sentence is already resolved — correct, incorrect, or timed out).
let blanksMeaningTimerId = null;
let blanksMeaningDeadline = 0;
const BLANKS_MEANING_SECONDS = 8;

function fbStopMeaningTimer() {
  if (blanksMeaningTimerId) {
    clearInterval(blanksMeaningTimerId);
    blanksMeaningTimerId = null;
  }
}

// sentences per round. The pool holds 12 per difficulty (travel + business +
// daily, 4 each), so a round is a random 4 of those 12 — short games, and a
// different mix every time. Everything downstream (progress text, score,
// end-of-game check) derives from blanksRound.length, so this is the only
// place the round length is defined.
const BLANKS_PER_ROUND = 4;

function startBlanks(category, level) {
  blanksLevelRaw = level;
  // category selector removed — mix travel + business + daily sentences together
  // and shuffle across all of them for this difficulty, then take the first
  // BLANKS_PER_ROUND of the shuffled pool.
  const pool = Object.values(GAME_DATA.blanks).flatMap((byLevel) => byLevel[level] || []);
  blanksRound = shuffle(pool).slice(0, BLANKS_PER_ROUND);
  blanksIndex = 0;
  blanksScore = 0;
  blanksSeconds = BLANKS_SECONDS[level] || 20;

  $("#blanks-meta").textContent = ts("level_labels." + level);
  $("#blanks-end").classList.add("hidden");
  $("#blanks-play").classList.remove("hidden");
  applyText([
    ["#screen-blanks .game-topline [data-back]", ts("buttons.back")],
    ["#blanks-form button[type=\"submit\"]", t("blanks", "buttons.check")],
    ["#blanks-next-btn", t("blanks", "buttons.next")],
    ['#screen-blanks [data-replay="blanks"]', t("blanks", "buttons.play_again")],
    ["#blanks-end [data-back]", t("blanks", "buttons.back_to_menu")],
    ["#blanks-end .end-title", t("blanks", "messages.round_complete_title")],
  ]);
  const scoreLabel = $("#blanks-end .end-word");
  if (scoreLabel) scoreLabel.firstChild.textContent = t("blanks", "messages.score_label");

  showScreen("#screen-blanks");
  loadSentence();
}

// Initial reveal: floor(35%) of the word's length, min 1, and the word is
// NEVER fully revealed (defined in starparty_minigames.js, shared with the
// STAR PARTY embedded version so both games use the exact same rule).
function revealCount(word) {
  return spFibInitialReveal(word.length);
}

// Build one box per letter: the revealed prefix is fixed,
// the player types the missing letters right in place.
function buildLetterBoxes(word, reveal) {
  const wrap = $("#blanks-letters");
  wrap.innerHTML = "";
  blanksCells = [];

  word.split("").forEach((ch, i) => {
    if (i < reveal) {
      const cell = document.createElement("div");
      cell.className = "letter-cell fixed";
      cell.textContent = ch.toUpperCase();
      wrap.appendChild(cell);
    } else {
      const inp = document.createElement("input");
      inp.className = "letter-cell";
      inp.type = "text";
      inp.maxLength = 1;
      inp.autocomplete = "off";
      inp.spellcheck = false;
      const idx = blanksCells.length;

      inp.addEventListener("input", () => {
        inp.value = inp.value.replace(/[^a-zA-Z]/g, "");
        if (inp.value && idx < blanksCells.length - 1) blanksCells[idx + 1].focus();
      });
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !inp.value && idx > 0) {
          blanksCells[idx - 1].focus();
          blanksCells[idx - 1].value = "";
          e.preventDefault();
        }
      });

      wrap.appendChild(inp);
      blanksCells.push(inp);
    }
  });
}

function loadSentence() {
  const item = blanksRound[blanksIndex];
  blanksReveal = revealCount(item.word);
  blanksExtraUsed = false;
  blanksOver = false;

  $("#blanks-progress").textContent = interp(t("blanks", "messages.progress"), { "blanksIndex + 1": blanksIndex + 1, "blanksRound.length": blanksRound.length });
  $("#blanks-sentence").innerHTML = item.sentence.replace("___", '<span class="gap">___</span>');
  $("#blanks-feedback").textContent = "";
  $("#blanks-options").classList.add("hidden");
  $("#blanks-options").innerHTML = "";
  $("#blanks-form").classList.remove("hidden");
  fbStopMeaningTimer();
  $("#blanks-meaning-panel").classList.add("hidden");
  buildLetterBoxes(item.word, blanksReveal);
  if (blanksCells.length) blanksCells[0].focus();

  // per-sentence countdown (20s/15s/10s by level) — it NEVER resets, not even
  // when the extra letters get revealed after the first miss
  fbStopTimer();
  SFX.loop("tick_soft"); // starts the instant the countdown starts, per sentence
  blanksDeadline = Date.now() + blanksSeconds * 1000;
  fbTick();
  blanksTimerId = setInterval(fbTick, 100);
}

function fbTick() {
  const msLeft = Math.max(0, blanksDeadline - Date.now());
  const total = blanksSeconds * 1000;
  const fill = $("#blanks-timer-fill");
  if (fill) {
    fill.style.width = `${(msLeft / total) * 100}%`;
    fill.classList.toggle("urgent", msLeft <= 3000);
  }
  const sec = $("#blanks-seconds");
  if (sec) sec.textContent = `${Math.ceil(msLeft / 1000)}s`;

  if (msLeft <= 0 && !blanksOver) {
    // time's up: reveal the answer, no points, move on
    blanksOver = true;
    fbStopTimer(); // stops tick_soft BEFORE wrong, so they never overlap
    SFX.play("wrong");
    const item = blanksRound[blanksIndex];
    $("#blanks-feedback").textContent = interp(t("blanks", "messages.time_up"), { "item.word": item.word });
    revealAndNext(item);
  }
}

$("#blanks-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (blanksOver) return;
  const item = blanksRound[blanksIndex];
  const word = item.word.toLowerCase();
  const typed = blanksCells.map((c) => c.value.toLowerCase()).join("");
  if (typed.length < blanksCells.length) {
    $("#blanks-feedback").textContent = t("blanks", "messages.incomplete");
    return;
  }
  const guess = word.slice(0, blanksReveal) + typed;

  if (guess === word) {
    blanksOver = true;
    fbStopTimer(); // stops tick_soft
    SFX.play("correct");
    blanksScore += 1;
    $("#blanks-feedback").textContent = t("blanks", "messages.correct");
    revealAndNext(item);
    return;
  }

  // any incorrect submission plays wrong — both the first miss (which reveals
  // extra letters) and every miss after it — WITHOUT touching tick_soft, which
  // keeps counting down through both
  SFX.play("wrong");
  if (!blanksExtraUsed) {
    // ONE-TIME reveal after the first miss: +1 letter (words of ≤6 letters) or
    // +2 (7+), but never the whole word. The timer keeps running untouched.
    blanksExtraUsed = true;
    blanksReveal = Math.min(word.length - 1, blanksReveal + (word.length <= 6 ? 1 : 2));
    buildLetterBoxes(item.word, blanksReveal);
    if (blanksCells.length) blanksCells[0].focus();
    $("#blanks-feedback").textContent = t("blanks", "messages.first_miss_reveal");
  } else {
    // unlimited attempts while the clock runs — but no more reveals
    blanksCells.forEach((c) => (c.value = ""));
    if (blanksCells.length) blanksCells[0].focus();
    $("#blanks-feedback").textContent = t("blanks", "messages.keep_trying");
  }
});

function revealAndNext(item) {
  $("#blanks-sentence").innerHTML = item.sentence.replace(
    "___",
    `<span class="gap">${item.word}</span>`
  );
  blanksCells.forEach((c) => (c.disabled = true));
  showMeaning(item);
}

// meaning panel: shown once the sentence is already resolved. NEXT button
// advances immediately; otherwise auto-advances after 8s (independent of the
// per-sentence letter-input timer, which is already stopped by this point).
function showMeaning(item) {
  const def = lookupDefinition(item.word);
  $("#blanks-meaning-text").textContent = def
    ? interp(t("blanks", "messages.meaning"), { def })
    : t("blanks", "messages.meaning_unavailable");
  const extra = $("#blanks-meaning-extra");
  extra.innerHTML = ""; // reused across sentences — clear the previous word's content
  $("#blanks-meaning-panel").classList.remove("hidden");

  fbStopMeaningTimer();
  blanksMeaningDeadline = Date.now() + BLANKS_MEANING_SECONDS * 1000;
  fbMeaningTick();
  blanksMeaningTimerId = setInterval(fbMeaningTick, 100);
}

function fbMeaningTick() {
  const msLeft = Math.max(0, blanksMeaningDeadline - Date.now());
  const total = BLANKS_MEANING_SECONDS * 1000;
  const fill = $("#blanks-meaning-timer-fill");
  if (fill) {
    fill.style.width = `${(msLeft / total) * 100}%`;
    fill.classList.toggle("urgent", msLeft <= 3000);
  }
  const sec = $("#blanks-meaning-seconds");
  if (sec) sec.textContent = `${Math.ceil(msLeft / 1000)}s`;

  if (msLeft <= 0) {
    fbStopMeaningTimer();
    nextSentence();
  }
}

$("#blanks-next-btn").addEventListener("click", () => {
  fbStopMeaningTimer();
  nextSentence();
});

// end of the round, split out of nextSentence() so there is one named place
// that owns "the game is over" for this game, like every other game has.
function blanksFinish() {
  Progress.record({ game: "blanks", level: blanksLevelRaw, score: blanksScore, maxScore: blanksRound.length });
  SFX.stop("tick_soft"); // kill the round loop BEFORE the closing cue, never after
  SFX.play("success");
  $("#blanks-play").classList.add("hidden");
  $("#blanks-end").classList.remove("hidden");
  $("#blanks-score").textContent = `${blanksScore} / ${blanksRound.length}`;
}

function nextSentence() {
  fbStopMeaningTimer();
  $("#blanks-meaning-panel").classList.add("hidden");
  blanksIndex++;
  if (blanksIndex >= blanksRound.length) blanksFinish();
  else loadSentence();
}

/* =====================================================
   GAME 3 — SPOT THE ERROR
   3 random rounds. Phase 1: find the wrong sentence.
   Phase 2: click the exact word with the mistake.
   Round score starts at 2: wrong sentence -0.25 each,
   wrong word -0.5 (charged only once).
   ===================================================== */
const SPOT_ROUNDS_PER_GAME = 3;
let spotRounds = [];
let spotIndex = 0;
let spotTotal = 0;
let spotRoundScore = 2;
let spotLevelRaw = null; // difficulty this game runs on, for the achievement layer
let spotWordFailed = false;
let spotErrorSentence = "";

function startSpot(level) {
  spotLevelRaw = level;
  spotRounds = shuffle(SPOT_DATA[level]).slice(0, SPOT_ROUNDS_PER_GAME);
  spotIndex = 0;
  spotTotal = 0;

  $("#spot-meta").textContent = ts("level_labels." + level);
  $("#spot-end").classList.add("hidden");
  $("#spot-play").classList.remove("hidden");
  applyText([
    ["#screen-spot .game-topline [data-back]", ts("buttons.back")],
    ["#spot-next", t("spot", "buttons.next")],
    ['#screen-spot [data-replay="spot"]', t("spot", "buttons.play_again")],
    ["#spot-end [data-back]", t("spot", "buttons.back_to_menu")],
    ["#spot-end .end-title", t("spot", "messages.game_complete_title")],
  ]);
  const scoreLabel = $("#spot-end .end-word");
  if (scoreLabel) scoreLabel.firstChild.textContent = t("spot", "messages.score_label");

  showScreen("#screen-spot");
  loadSpotRound();
}

function loadSpotRound() {
  const round = spotRounds[spotIndex];
  spotRoundScore = 2;
  spotWordFailed = false;
  // remember the error sentence by CONTENT — the list below gets shuffled
  spotErrorSentence = round.sentences[round.errorSentenceIndex];

  $("#spot-progress").textContent = interp(t("spot", "messages.progress"), { "spotIndex + 1": spotIndex + 1, "spotRounds.length": spotRounds.length });
  $("#spot-instruction").textContent = t("spot", "messages.instruction_phase1");
  $("#spot-feedback").textContent = "";
  $("#spot-explain").classList.add("hidden");
  $("#spot-words").classList.add("hidden");
  $("#spot-words").innerHTML = "";

  const wrap = $("#spot-sentences");
  wrap.innerHTML = "";
  wrap.classList.remove("hidden");

  shuffle(round.sentences).forEach((sentence) => {
    const btn = document.createElement("button");
    btn.className = "spot-sentence";
    btn.textContent = sentence;
    btn.addEventListener("click", () => handleSentenceClick(btn, sentence));
    wrap.appendChild(btn);
  });
}

function handleSentenceClick(btn, sentence) {
  if (sentence === spotErrorSentence) {
    SFX.play("correct");
    btn.classList.add("found");
    $("#spot-feedback").textContent = t("spot", "messages.phase1_correct");
    setTimeout(startSpotPhase2, 700);
  } else {
    SFX.play("wrong");
    btn.classList.add("wrong"); // fades out via CSS and becomes unclickable
    spotRoundScore -= 0.25;
    $("#spot-feedback").textContent = t("spot", "messages.phase1_wrong");
  }
}

function startSpotPhase2() {
  const round = spotRounds[spotIndex];
  $("#spot-sentences").classList.add("hidden");
  $("#spot-instruction").textContent = t("spot", "messages.instruction_phase2");
  $("#spot-feedback").textContent = "";

  // errorWord can be TWO words (e.g. "could of") — clicking either counts
  const errorTokens = round.errorWord.toLowerCase().split(/\s+/);
  const normalize = (w) => w.toLowerCase().replace(/[^a-z']/g, "");

  const wrap = $("#spot-words");
  wrap.innerHTML = "";
  wrap.classList.remove("hidden");

  spotErrorSentence.split(/\s+/).forEach((token) => {
    const btn = document.createElement("button");
    btn.className = "spot-word";
    btn.textContent = token;
    btn.addEventListener("click", () => {
      if (errorTokens.includes(normalize(token))) {
        SFX.play("correct");
        btn.classList.add("found");
        wrap.querySelectorAll("button").forEach((b) => (b.disabled = true));
        finishSpotRound();
      } else {
        SFX.play("wrong"); // fires on every wrong word click, not just the first
        btn.classList.add("wrong");
        if (!spotWordFailed) {
          spotWordFailed = true;
          spotRoundScore -= 0.5; // fixed penalty, only once
          $("#spot-feedback").textContent = t("spot", "messages.phase2_wrong_first");
        } else {
          $("#spot-feedback").textContent = t("spot", "messages.phase2_wrong_again");
        }
      }
    });
    wrap.appendChild(btn);
  });
}

function correctedSentence(round) {
  const pattern = new RegExp(escapeRegex(round.errorWord), "i");
  let fixed = spotErrorSentence.replace(pattern, round.correction || "");
  fixed = fixed.replace(/\s{2,}/g, " ").replace(/\s+([.,!?;:])/g, "$1").trim();
  return fixed.charAt(0).toUpperCase() + fixed.slice(1);
}

function finishSpotRound() {
  const round = spotRounds[spotIndex];
  spotTotal += spotRoundScore;

  $("#spot-feedback").textContent = "";
  $("#spot-round-result").textContent = interp(t("spot", "messages.round_solved"), { spotRoundScore });
  $("#spot-corrected").textContent = interp(t("spot", "messages.corrected_sentence"), { "correctedSentence(round)": correctedSentence(round) });
  const explTemplate = round.errorType === "spelling" ? t("spot", "messages.explanation_spelling") : t("spot", "messages.explanation_grammar");
  $("#spot-explanation").textContent = interp(explTemplate, { "round.explanation": round.explanation });
  $("#spot-explain").classList.remove("hidden");
}

// end of the game, split out of the NEXT handler so there is one named place
// that owns "the game is over" for this game, like every other game has.
function spotFinish() {
  Progress.record({ game: "spot", level: spotLevelRaw, score: spotTotal, maxScore: spotRounds.length * 2 });
  SFX.play("success"); // end-of-game cue; this is a plain button click, nothing else sounds
  $("#spot-play").classList.add("hidden");
  $("#spot-end").classList.remove("hidden");
  $("#spot-score").textContent = interp(t("spot", "messages.score_value"), { spotTotal, "spotRounds.length * 2": spotRounds.length * 2 });
}

$("#spot-next").addEventListener("click", () => {
  spotIndex++;
  if (spotIndex >= spotRounds.length) spotFinish();
  else loadSpotRound();
});

/* =====================================================
   GAME 5 — WORD LINKS
   3 rounds, 1 secret word each. 4 clue chips shown from
   the start (+ optional 5th via HINT, which costs 1 of
   the 3 attempts). Points: attempt 1 = 3, 2 = 2, 3 = 1.
   Data: WORDLINKS_DATA (wordlinks_data.js).
   ===================================================== */
const WL_LEVEL_KEYS = { basico: "basic", intermedio: "intermediate", avanzado: "advanced" };
const WL_STORAGE_KEY = "wordlinks_last_words";

let wlLevel = null; // "basic" | "intermediate" | "advanced"
let wlWords = []; // the 3 words of this game
let wlIndex = 0;
let wlAttemptsLeft = 3;
let wlHintUsed = false;
let wlRoundOver = false;
let wlScores = []; // points per round
let wlSuggestIndex = -1;

const wlNorm = (s) => s.toLowerCase().trim();
const wlRules = () => WORDLINKS_DATA.rules;

// accept simple singular/plural variants (word+s, word+es, and the reverse)
function wlIsCorrect(guess, word) {
  const w = wlNorm(word);
  if (guess === w) return true;
  if (guess === w + "s" || guess === w + "es") return true;
  if (guess.endsWith("es") && guess.slice(0, -2) === w) return true;
  if (guess.endsWith("s") && guess.slice(0, -1) === w) return true;
  return false;
}

function wlPickWords(levelKey) {
  const pool = (WORDLINKS_DATA.words[levelKey] || []).slice();
  if (!pool.length) return null;

  // avoid repeating last game's words (stored in localStorage) when possible
  let lastWords = [];
  try {
    lastWords = JSON.parse(localStorage.getItem(WL_STORAGE_KEY)) || [];
  } catch (err) { /* corrupted storage — ignore */ }

  let candidates = pool.filter((w) => !lastWords.includes(w.word));
  if (candidates.length < wlRules().rounds_per_game) candidates = pool;
  return shuffle(candidates).slice(0, wlRules().rounds_per_game);
}

function startWordLinks(level) {
  wlLevel = WL_LEVEL_KEYS[level] || level;
  const words = wlPickWords(wlLevel);
  if (!words || words.length < wlRules().rounds_per_game) {
    alert(t("wordlinks", "messages.data_error"));
    return;
  }
  wlWords = words;
  wlIndex = 0;
  wlScores = [];

  $("#wl-meta").textContent = ts("level_labels." + level);
  $("#wl-end").classList.add("hidden");
  $("#wl-play").classList.remove("hidden");
  applyText([
    ["#screen-wordlinks .game-topline [data-back]", ts("buttons.back")],
    ["#wl-guess-btn", t("wordlinks", "buttons.guess")],
    ["#wl-hint-btn", t("wordlinks", "buttons.hint")],
    ["#screen-wordlinks .wl-instruction", t("wordlinks", "static_labels.instruction")],
    ["#wl-again-btn", t("wordlinks", "buttons.play_again")],
    ['#screen-wordlinks [data-replay="wordlinks"]', t("wordlinks", "buttons.change_level")],
    ["#wl-end [data-back]", t("wordlinks", "buttons.back_to_menu")],
    ["#wl-end .end-title", t("wordlinks", "messages.game_complete_title")],
  ]);
  const scoreLabel = $("#wl-end .end-word");
  if (scoreLabel) scoreLabel.firstChild.textContent = t("wordlinks", "messages.score_label");

  showScreen("#screen-wordlinks");
  wlLoadRound();
}

function wlLoadRound() {
  const item = wlWords[wlIndex];
  wlAttemptsLeft = wlRules().attempts_per_round;
  wlHintUsed = false;
  wlRoundOver = false;

  $("#wl-round").textContent = interp(t("wordlinks", "messages.progress"), { "wlIndex + 1": wlIndex + 1, "wlWords.length": wlWords.length });
  $("#wl-type").textContent = item.type === "verb" ? t("wordlinks", "messages.type_verb") : t("wordlinks", "messages.type_noun");
  $("#wl-feedback").textContent = "";
  $("#wl-input").value = "";
  $("#wl-input").disabled = false;
  $("#wl-guess-btn").disabled = false;
  $("#wl-hint-btn").disabled = false;
  $("#wl-next-btn").classList.add("hidden");
  wlHideSuggest();

  const wrap = $("#wl-clues");
  wrap.innerHTML = "";
  item.clues.forEach((clue) => {
    const chip = document.createElement("span");
    chip.className = "wl-chip";
    chip.textContent = clue;
    wrap.appendChild(chip);
  });

  wlUpdateAttempts();
  $("#wl-input").focus();
}

function wlUpdateAttempts() {
  $("#wl-attempts").textContent = interp(t("wordlinks", "messages.attempts_left"), { wlAttemptsLeft });
}

function wlEndRound(points, won) {
  wlRoundOver = true;
  wlScores.push(points);
  $("#wl-input").disabled = true;
  $("#wl-guess-btn").disabled = true;
  $("#wl-hint-btn").disabled = true;
  wlHideSuggest();

  const item = wlWords[wlIndex];
  if (won) {
    $("#wl-feedback").textContent = interp(t("wordlinks", "messages.correct"), {
      "item.word": item.word,
      points,
      'points === 1 ? "" : "s"': points === 1 ? "" : "s",
    });
  } else {
    $("#wl-feedback").innerHTML = interp(t("wordlinks", "messages.out_of_attempts"), { "item.word": item.word });
  }
  $("#wl-next-btn").classList.remove("hidden");
  $("#wl-next-btn").textContent = wlIndex + 1 >= wlWords.length ? t("wordlinks", "buttons.see_results") : t("wordlinks", "buttons.next_round");
}

// -------- GUESS --------
$("#wl-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (wlRoundOver) return; // double-submit guard

  // if the dropdown has an active suggestion, Enter picks it instead of guessing
  const active = $("#wl-suggest .suggest-item.active");
  if (active) {
    $("#wl-input").value = active.textContent;
    wlHideSuggest();
    return;
  }
  wlHideSuggest();

  const guess = wlNorm($("#wl-input").value);
  if (!guess) {
    $("#wl-feedback").textContent = t("wordlinks", "messages.type_a_word");
    return; // no attempt spent
  }

  const item = wlWords[wlIndex];
  const attemptNumber = wlRules().attempts_per_round - wlAttemptsLeft + 1;

  if (wlIsCorrect(guess, item.word)) {
    SFX.play("correct");
    const points = WORDLINKS_DATA.scoring[`attempt${attemptNumber}`] || 0;
    wlEndRound(points, true);
    return;
  }

  // wrong: fires on every failed attempt, not just the one that ends the round
  SFX.play("wrong");
  // wrong: spend 1 attempt, minimal feedback only
  wlAttemptsLeft--;
  $("#wl-input").value = "";
  $("#wl-feedback").textContent = "";
  wlUpdateAttempts();
  if (wlAttemptsLeft <= 0) {
    wlEndRound(WORDLINKS_DATA.scoring.fail, false);
  }
});

// -------- HINT: reveals the 5th clue, costs 1 attempt (not a failed guess) --------
$("#wl-hint-btn").addEventListener("click", () => {
  if (wlRoundOver || wlHintUsed || wlAttemptsLeft <= 1) {
    // never let the hint burn the last attempt into an instant loss
    if (!wlRoundOver && !wlHintUsed && wlAttemptsLeft <= 1) {
      $("#wl-feedback").textContent = t("wordlinks", "messages.not_enough_for_hint");
    }
    return;
  }
  SFX.play("hint");
  wlHintUsed = true;
  wlAttemptsLeft--;
  wlUpdateAttempts();
  $("#wl-hint-btn").disabled = true;

  const chip = document.createElement("span");
  chip.className = "wl-chip hint-chip";
  chip.textContent = wlWords[wlIndex].hint;
  $("#wl-clues").appendChild(chip);
  $("#wl-input").focus();
});

// -------- NEXT ROUND / RESULTS --------
$("#wl-next-btn").addEventListener("click", () => {
  wlIndex++;
  if (wlIndex >= wlWords.length) {
    wlShowResults();
  } else {
    wlLoadRound();
  }
});

function wlShowResults() {
  SFX.play("success"); // end-of-game cue; reached by the SEE RESULTS click, nothing else sounds
  const total = wlScores.reduce((a, b) => a + b, 0);
  // wlLevel is already the English bank key; the store passes it straight through.
  // 9/9 can only happen without hints, since a hint costs an attempt.
  Progress.record({ game: "wordlinks", level: wlLevel, score: total, maxScore: WORDLINKS_DATA.scoring.max_per_game });
  $("#wl-score").textContent = `${total} / ${WORDLINKS_DATA.scoring.max_per_game}`;

  const list = $("#wl-breakdown");
  list.innerHTML = "";
  wlWords.forEach((w, i) => {
    const li = document.createElement("li");
    if (wlScores[i] > 0) li.classList.add("was-found");
    const name = document.createElement("span");
    name.textContent = interp(t("wordlinks", "messages.breakdown_row_name"), { "i + 1": i + 1, "w.word": w.word });
    const pts = document.createElement("span");
    pts.textContent = interp(t("wordlinks", "messages.breakdown_row_pts"), { "wlScores[i]": wlScores[i] });
    li.appendChild(name);
    li.appendChild(pts);
    list.appendChild(li);
  });

  // remember this game's words so the next game avoids them
  try {
    localStorage.setItem(WL_STORAGE_KEY, JSON.stringify(wlWords.map((w) => w.word)));
  } catch (err) { /* private mode — no big deal */ }

  $("#wl-play").classList.add("hidden");
  $("#wl-end").classList.remove("hidden");
}

// PLAY AGAIN keeps the same level; CHANGE LEVEL uses the shared data-replay handler
$("#wl-again-btn").addEventListener("click", () => startWordLinks(wlLevel));

// -------- autocomplete (WORDLINKS_DATA.autocomplete_pool) --------
function wlHideSuggest() {
  $("#wl-suggest").classList.add("hidden");
  $("#wl-suggest").innerHTML = "";
  wlSuggestIndex = -1;
}

function wlShowSuggest(query) {
  const box = $("#wl-suggest");
  const q = query.toUpperCase();
  // the pool is large (~29k) and alphabetically sorted: collect prefix
  // matches and stop as soon as we have 7 or we've passed the prefix range
  const pool = WORDLINKS_DATA.autocomplete_pool;
  const results = [];
  for (let i = 0; i < pool.length && results.length < 7; i++) {
    if (pool[i].startsWith(q)) results.push(pool[i]);
    else if (results.length) break; // sorted: past the matching block
  }
  if (!results.length) {
    wlHideSuggest();
    return;
  }
  box.innerHTML = "";
  wlSuggestIndex = -1;
  results.forEach((w) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "suggest-item";
    const b = document.createElement("b");
    b.textContent = w.slice(0, q.length);
    btn.append(b, w.slice(q.length));
    btn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      $("#wl-input").value = w;
      wlHideSuggest();
      $("#wl-input").focus();
    });
    box.appendChild(btn);
  });
  box.classList.remove("hidden");
}

$("#wl-input").addEventListener("input", () => {
  const q = wlNorm($("#wl-input").value);
  if (!wlRoundOver && q.length >= 2) wlShowSuggest(q);
  else wlHideSuggest();
});

$("#wl-input").addEventListener("keydown", (e) => {
  const items = [...$("#wl-suggest").querySelectorAll(".suggest-item")];
  if (e.key === "Escape") {
    wlHideSuggest();
    return;
  }
  if (!items.length) return;
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    wlSuggestIndex =
      e.key === "ArrowDown"
        ? (wlSuggestIndex + 1) % items.length
        : (wlSuggestIndex - 1 + items.length) % items.length;
    items.forEach((el, i) => el.classList.toggle("active", i === wlSuggestIndex));
  }
});

$("#wl-input").addEventListener("blur", () => setTimeout(wlHideSuggest, 150));
document.addEventListener("click", (e) => {
  if (!e.target.closest("#wl-form")) wlHideSuggest();
});

/* =====================================================
   GAME 6 — IMPOSTOR
   3 rounds, 5 words each: 4 share a criterion, 1 is the
   impostor. Click the 4 shared words; clicking the
   impostor loses the round instantly. Scoring per round:
   no hint = 3, with hint = 2, fail = 0.
   Data: IMPOSTOR_DATA (impostor_data.js).
   ===================================================== */
const IMP_STORAGE_KEY = "impostor_last_sets";

let impLevel = null; // "basic" | "intermediate" | "advanced" (data key)
let impLevelRaw = null; // "basico" | ... (modal value, for PLAY AGAIN)
let impCategory = null;
let impSets = []; // the 3 sets of this game
let impIndex = 0;
let impScores = [];
let impHintUsed = false;
let impRoundOver = false;
let impRemaining = 0;

const impSetId = (s) => s.words.join("|");
const impRules = () => IMPOSTOR_DATA.rules;

// round_id = {category}_{level}_{index within IMPOSTOR_DATA.sets[category][level]},
// same identity the impostor sets share as object references (the shuffled
// impSets array is built from those same arrays via flatMap, never cloned).
function impRoundId(s) {
  const arr = IMPOSTOR_DATA.sets[s.category] && IMPOSTOR_DATA.sets[s.category][s.level];
  if (!arr) return null;
  const idx = arr.indexOf(s);
  return idx < 0 ? null : `${s.category}_${s.level}_${idx}`;
}

// the explanation of why the impostor doesn't belong — words and the
// impostor's name are never translated, only this sentence. Follows the
// general UI language toggle (selectedLanguage), unlike the per-word
// translate button used for dictionary meanings elsewhere.
function impExplanation(s) {
  if (selectedLanguage === "es" && typeof IMPOSTOR_EXPLANATIONS_ES === "object") {
    const rid = impRoundId(s);
    const es = rid && IMPOSTOR_EXPLANATIONS_ES[rid];
    if (es) return es;
  }
  return s.explanation;
}

// hint text = the part of the explanation BEFORE the first semicolon
const impHintText = (s) => impExplanation(s).split(";")[0].trim();

// short category title for the end screen, from impostor_labels.js (same
// positional round_id as the Spanish explanations). Falls back to the hint
// text — the first clause of the explanation — so a set with no label still
// shows something meaningful rather than an empty bar.
function impLabelText(s) {
  const rid = impRoundId(s);
  const entry = rid && typeof IMPOSTOR_LABELS === "object" && IMPOSTOR_LABELS ? IMPOSTOR_LABELS[rid] : null;
  if (!entry) return impHintText(s);
  const pick = selectedLanguage === "es" ? entry.es || entry.en : entry.en || entry.es;
  return pick || impHintText(s);
}

function impReadLast() {
  try {
    return JSON.parse(localStorage.getItem(IMP_STORAGE_KEY)) || {};
  } catch (err) {
    return {};
  }
}

function startImpostor(category, level) {
  impCategory = category;
  impLevelRaw = level;
  impLevel = WL_LEVEL_KEYS[level] || level;

  // category selector removed — mix business + travel + daily + general sets
  // together and pick randomly from the combined pool for this difficulty.
  const pool = Object.values(IMPOSTOR_DATA.sets).flatMap((byLevel) => byLevel[impLevel] || []);
  if (pool.length < impRules().rounds_per_game) {
    alert("Impostor data for this combination could not be loaded. Please try another one.");
    return;
  }

  // avoid repeating last game's sets for this same level (category mixed)
  const exclude = impReadLast()[`mixed_${impLevel}`] || [];
  let candidates = pool.filter((s) => !exclude.includes(impSetId(s)));
  if (candidates.length < impRules().rounds_per_game) candidates = pool;

  impSets = shuffle(candidates).slice(0, impRules().rounds_per_game);
  impIndex = 0;
  impScores = [];

  $("#imp-meta").textContent = ts("level_labels." + level);
  $("#imp-end").classList.add("hidden");
  $("#imp-play").classList.remove("hidden");
  applyText([
    ["#screen-impostor .game-topline [data-back]", ts("buttons.back")],
    ["#screen-impostor .spot-instruction", t("impostor", "static_labels.instruction")],
    ["#imp-hint-btn", t("impostor", "buttons.hint")],
    ["#imp-again-btn", t("impostor", "buttons.play_again")],
    ['#screen-impostor [data-replay="impostor"]', t("impostor", "buttons.change_settings")],
    ["#imp-end [data-back]", t("impostor", "buttons.back_to_menu")],
    ["#imp-end .end-title", t("impostor", "messages.game_complete_title")],
  ]);
  const scoreLabel = $("#imp-end .end-word");
  if (scoreLabel) scoreLabel.firstChild.textContent = t("impostor", "messages.score_label");

  showScreen("#screen-impostor");
  impLoadRound();
}

function impLoadRound() {
  const set = impSets[impIndex];
  impHintUsed = false;
  impRoundOver = false;
  impRemaining = set.words.length;

  $("#imp-round").textContent = interp(t("impostor", "messages.progress"), { "impIndex + 1": impIndex + 1, "impSets.length": impSets.length });
  $("#imp-feedback").textContent = "";
  $("#imp-hint-text").classList.add("hidden");
  $("#imp-hint-text").textContent = "";
  $("#imp-hint-btn").disabled = false;
  $("#imp-next-btn").classList.add("hidden");
  $("#imp-explain").classList.add("hidden");

  const wrap = $("#imp-words");
  wrap.innerHTML = "";
  shuffle(set.words).forEach((word) => {
    const btn = document.createElement("button");
    btn.className = "imp-word";
    btn.textContent = word;
    btn.addEventListener("click", () => impClickWord(btn, word));
    wrap.appendChild(btn);
  });
}

function impClickWord(btn, word) {
  const set = impSets[impIndex];
  if (impRoundOver || btn.classList.contains("removed")) return; // ignore repeats

  if (word === set.impostor) {
    // instant fail
    SFX.play("wrong");
    btn.classList.add("impostor-reveal", "shake");
    impFinishRound(false);
  } else {
    btn.classList.add("removed"); // fades out via CSS, unclickable
    impRemaining--;
    if (impRules().auto_win_when_one_remains && impRemaining === 1) {
      // only the impostor is left — auto win, no extra click needed. Do NOT
      // play impostor_ok here: this click also wins the round, and
      // impFinishRound(true) plays correct.mp3 — only one sound on this click.
      $$("#imp-words .imp-word").forEach((b) => {
        if (b.textContent === set.impostor) b.classList.add("impostor-reveal");
      });
      impFinishRound(true);
    } else {
      SFX.play("impostor_ok");
    }
  }
}

function impFinishRound(won) {
  const set = impSets[impIndex];
  impRoundOver = true;
  if (won) SFX.play("correct");
  $("#imp-hint-btn").disabled = true;

  // reveal everything: shared words green-ish, impostor red
  $$("#imp-words .imp-word").forEach((b) => {
    if (b.textContent === set.impostor) b.classList.add("impostor-reveal");
    else b.classList.add("removed");
  });

  const points = won ? (impHintUsed ? IMPOSTOR_DATA.scoring.with_hint : IMPOSTOR_DATA.scoring.no_hint) : IMPOSTOR_DATA.scoring.fail;
  impScores.push(points);

  $("#imp-result").textContent = won
    ? interp(t("impostor", "messages.round_won"), { "set.impostor": set.impostor, points })
    : t("impostor", "messages.round_lost");
  $("#imp-result").style.color = won ? "#7ee2a0" : "#ff8a8a";
  $("#imp-explanation").textContent = impExplanation(set); // always shown, win or lose
  $("#imp-explain").classList.remove("hidden");

  $("#imp-next-btn").textContent = impIndex + 1 >= impSets.length ? t("impostor", "buttons.see_results") : t("impostor", "buttons.next_round");
  $("#imp-next-btn").classList.remove("hidden");
}

// -------- HINT: shows the shared criterion, once per round, marks round as hinted --------
$("#imp-hint-btn").addEventListener("click", () => {
  if (impRoundOver || impHintUsed) return;
  SFX.play("hint");
  impHintUsed = true; // clicks stay unlimited; only the score drops to 2
  $("#imp-hint-btn").disabled = true;
  $("#imp-hint-text").textContent = interp(t("impostor", "messages.hint_text"), { "impHintText(impSets[impIndex])": impHintText(impSets[impIndex]) });
  $("#imp-hint-text").classList.remove("hidden");
});

$("#imp-next-btn").addEventListener("click", () => {
  impIndex++;
  if (impIndex >= impSets.length) {
    impShowResults();
  } else {
    impLoadRound();
  }
});

function impShowResults() {
  SFX.play("success"); // end-of-game cue; reached by the SEE RESULTS click, nothing else sounds
  const total = impScores.reduce((a, b) => a + b, 0);
  // 9/9 can only happen without hints, since a hint drops that round to 2 points
  Progress.record({ game: "impostor", level: impLevelRaw, score: total, maxScore: IMPOSTOR_DATA.scoring.max_per_game });
  $("#imp-score").textContent = `${total} / ${IMPOSTOR_DATA.scoring.max_per_game}`;

  // one expandable bar per round: chevron | category title + impostor | points.
  // Opening it lists the round's 5 words with their meanings in the chosen
  // language — the same lookupDefinition() every other game uses.
  const list = $("#imp-breakdown");
  list.innerHTML = "";
  impSets.forEach((s, i) => {
    const li = document.createElement("li");
    li.className = "imp-round" + (impScores[i] > 0 ? "" : " imp-lost");

    const head = document.createElement("button");
    head.type = "button";
    head.className = "imp-round-head";
    head.setAttribute("aria-expanded", "false");

    const chev = document.createElement("span");
    chev.className = "imp-round-chev";
    chev.setAttribute("aria-hidden", "true");
    chev.textContent = "▾";

    const main = document.createElement("span");
    main.className = "imp-round-main";
    const title = document.createElement("span");
    title.className = "imp-round-title";
    title.textContent = impLabelText(s);
    const imp = document.createElement("span");
    imp.className = "imp-round-impostor";
    imp.textContent = interp(t("impostor", "messages.breakdown_impostor"), { "s.impostor": s.impostor });
    main.appendChild(title);
    main.appendChild(imp);

    const pts = document.createElement("span");
    pts.className = "imp-round-pts";
    pts.textContent = interp(t("impostor", "messages.breakdown_points"), { "impScores[i]": impScores[i] });

    head.appendChild(chev);
    head.appendChild(main);
    head.appendChild(pts);

    // drawer: all 5 words, impostor flagged. Words with no entry in
    // definitions.json still get a row — the fallback line says so instead of
    // silently dropping the word.
    const drawer = document.createElement("div");
    drawer.className = "imp-round-words";
    s.words.forEach((w) => {
      const row = document.createElement("div");
      row.className = "imp-word-row" + (w === s.impostor ? " is-impostor" : "");
      const wEl = document.createElement("span");
      wEl.className = "imp-word";
      wEl.textContent = w;
      if (w === s.impostor) {
        const tag = document.createElement("span");
        tag.className = "imp-word-tag";
        tag.textContent = "impostor";
        wEl.appendChild(tag);
      }
      const def = lookupDefinition(w);
      const dEl = document.createElement("span");
      dEl.className = "imp-word-def" + (def ? "" : " is-missing");
      dEl.textContent = def || t("impostor", "messages.meaning_unavailable");
      row.appendChild(wEl);
      row.appendChild(dEl);
      drawer.appendChild(row);
    });

    head.addEventListener("click", () => {
      const open = li.classList.toggle("open");
      head.setAttribute("aria-expanded", open ? "true" : "false");
    });

    li.appendChild(head);
    li.appendChild(drawer);
    list.appendChild(li);
  });

  $("#imp-breakdown-hint").textContent = t("impostor", "messages.tap_for_meaning");

  // remember this game's sets for the anti-repeat rule (category mixed)
  const last = impReadLast();
  last[`mixed_${impLevel}`] = impSets.map(impSetId);
  try {
    localStorage.setItem(IMP_STORAGE_KEY, JSON.stringify(last));
  } catch (err) { /* private mode — ignore */ }

  $("#imp-play").classList.add("hidden");
  $("#imp-end").classList.remove("hidden");
}

// PLAY AGAIN keeps the same level+category; CHANGE SETTINGS reopens the selector
$("#imp-again-btn").addEventListener("click", () => startImpostor(impCategory, impLevelRaw));

/* =====================================================
   GAME 7 — CONNECTIONS
   One 16-word puzzle: group them into 4 hidden categories.
   Select 4 → Submit. Exact group = solved (+1). Exactly 3
   of a group = "3 correct" feedback, selection kept.
   Unlimited mistakes. Give Up = final score 0.
   Data: CONNECTIONS_DATA (connections_data.js).
   ===================================================== */
const CONN_STORAGE_PREFIX = "connections_last_puzzle_";
const CONN_MAX_SELECT = 4;

let connLevel = null; // "basic" | "intermediate" | "advanced" (data key)
let connLevelRaw = null; // modal value, for PLAY AGAIN
let connPuzzle = null;
let connSolved = []; // category indexes already solved, in solve order
let connSelection = []; // currently selected words
let connLastSubmit = null; // guard against double-submit of the same 4
let connOver = false;
// failed Submits this puzzle — BOTH failure branches count (the "3 of 4" near
// miss and the outright miss), since from the player's side pressing Submit
// and not solving a group is the same mistake either way. Purely informational
// today; the achievement layer reads it later.
let connMistakes = 0;

function startConnections(level) {
  connLevelRaw = level;
  connLevel = WL_LEVEL_KEYS[level] || level;

  const pool = CONNECTIONS_DATA.puzzles[connLevel] || [];
  if (!pool.length) {
    alert("Connections data for this level could not be loaded. Please try another level.");
    return;
  }

  // avoid repeating the last puzzle played on this level
  const lastId = localStorage.getItem(CONN_STORAGE_PREFIX + connLevel);
  let candidates = pool.filter((p) => p.id !== lastId);
  if (!candidates.length) candidates = pool;
  connPuzzle = randomItem(candidates);
  try {
    localStorage.setItem(CONN_STORAGE_PREFIX + connLevel, connPuzzle.id);
  } catch (err) { /* private mode — ignore */ }

  connSolved = [];
  connSelection = [];
  connLastSubmit = null;
  connOver = false;
  connMistakes = 0;

  $("#conn-meta").textContent = ts("level_labels." + level);
  $("#conn-end").classList.add("hidden");
  $("#conn-play").classList.remove("hidden");
  $("#conn-solved").innerHTML = "";
  $("#conn-message").textContent = "";
  applyText([
    ["#screen-connections .game-topline [data-back]", ts("buttons.back")],
    ["#screen-connections .spot-instruction", t("connections", "static_labels.instruction")],
    ["#conn-submit", t("connections", "buttons.submit")],
    ["#conn-clear", t("connections", "buttons.clear")],
    ["#conn-giveup", t("connections", "buttons.give_up")],
    ["#conn-again-btn", t("connections", "buttons.play_again")],
    ["#conn-end [data-back]", t("connections", "buttons.back_to_menu")],
  ]);
  const scoreLabel = $("#conn-end .end-word");
  if (scoreLabel) scoreLabel.firstChild.textContent = t("connections", "messages.score_label");

  connRenderGrid();
  connRefreshButtons();
  showScreen("#screen-connections");
}

// which category index a word belongs to (words are unique within a puzzle)
function connCategoryOf(word) {
  return connPuzzle.categories.findIndex((c) => c.words.includes(word));
}

function connRenderGrid() {
  const grid = $("#conn-grid");
  grid.innerHTML = "";
  const remaining = connPuzzle.categories
    .filter((c, i) => !connSolved.includes(i))
    .flatMap((c) => c.words);
  shuffle(remaining).forEach((word) => {
    const btn = document.createElement("button");
    btn.className = "conn-word";
    btn.textContent = word;
    btn.addEventListener("click", () => connToggleWord(btn, word));
    grid.appendChild(btn);
  });
}

function connToggleWord(btn, word) {
  if (connOver) return;
  const idx = connSelection.indexOf(word);
  if (idx >= 0) {
    connSelection.splice(idx, 1);
    btn.classList.remove("selected");
  } else {
    if (connSelection.length >= CONN_MAX_SELECT) return; // never more than 4 selected
    SFX.play("letter_move"); // only on adding a word — deselecting stays silent
    connSelection.push(word);
    btn.classList.add("selected");
  }
  connRefreshButtons();
}

function connRefreshButtons() {
  $("#conn-submit").disabled = connOver || connSelection.length !== CONN_MAX_SELECT;
}

function connClearSelection() {
  connSelection = [];
  $$("#conn-grid .conn-word").forEach((b) => b.classList.remove("selected"));
  connRefreshButtons();
}

// full-width colored card for a solved/revealed group. Clickable to expand and
// show each of the 4 words with its meaning (from definitions.js). Works both
// for groups solved mid-game and for groups revealed after a loss.
function connGroupCard(catIndex) {
  const cat = connPuzzle.categories[catIndex];
  const card = document.createElement("div");
  card.className = `conn-group g${catIndex} conn-group-expandable`; // color fixed by JSON order

  const head = document.createElement("button");
  head.type = "button";
  head.className = "conn-group-head";
  head.setAttribute("aria-expanded", "false");

  const title = document.createElement("p");
  title.className = "conn-group-title";
  // category name follows the general UI language toggle; the 4 words below
  // (words.textContent) are never translated.
  const catEs = typeof CONNECTIONS_CATEGORIES_ES === "object"
    ? CONNECTIONS_CATEGORIES_ES[`${connPuzzle.id}|${catIndex}`]
    : null;
  title.textContent = selectedLanguage === "es" && catEs ? catEs : cat.category;
  const words = document.createElement("p");
  words.className = "conn-group-words";
  words.textContent = cat.words.join(" · ");
  head.appendChild(title);
  head.appendChild(words);

  const panel = document.createElement("div");
  panel.className = "conn-group-meanings";
  cat.words.forEach((w) => {
    const row = document.createElement("div");
    row.className = "conn-meaning-row";
    const wEl = document.createElement("span");
    wEl.className = "conn-meaning-word";
    wEl.textContent = w;

    const defWrap = document.createElement("div");
    defWrap.className = "conn-meaning-defwrap";
    const def = lookupDefinition(w);
    const dEl = document.createElement("p");
    dEl.className = "conn-meaning-def meaning-en";
    dEl.textContent = def || t("connections", "messages.meaning_unavailable");
    defWrap.appendChild(dEl);

    row.appendChild(wEl);
    row.appendChild(defWrap);
    panel.appendChild(row);
  });

  head.addEventListener("click", () => {
    const open = card.classList.toggle("open");
    head.setAttribute("aria-expanded", open ? "true" : "false");
  });

  card.appendChild(head);
  card.appendChild(panel);
  return card;
}

$("#conn-submit").addEventListener("click", () => {
  if (connOver || connSelection.length !== CONN_MAX_SELECT) return;

  // double-submit guard: same 4 words as the previous attempt do nothing
  const key = [...connSelection].sort().join("|");
  if (key === connLastSubmit) return;
  connLastSubmit = key;

  // count how many of the selection fall in each category
  const counts = {};
  connSelection.forEach((w) => {
    const c = connCategoryOf(w);
    counts[c] = (counts[c] || 0) + 1;
  });
  const best = Math.max(...Object.values(counts));

  if (best === 4) {
    // exact group solved
    SFX.play("success");
    const catIndex = Number(Object.keys(counts)[0]);
    connSolved.push(catIndex);
    $("#conn-solved").appendChild(connGroupCard(catIndex));
    $("#conn-message").textContent = "";
    connSelection = [];
    connLastSubmit = null;
    connRenderGrid();
    connRefreshButtons();
    if (connSolved.length === connPuzzle.categories.length) {
      connFinish(false);
    }
  } else if (best === 3) {
    // exactly 3 of one group: keep the selection so the player can adjust.
    // Still a failed attempt from the player's point of view — pressing Submit
    // and hearing nothing would read as a broken button, so fail.mp3 fires here too.
    connMistakes++;
    SFX.play("fail");
    $("#conn-message").textContent = t("connections", "messages.three_of_four");
  } else {
    connMistakes++;
    SFX.play("fail");
    $("#conn-message").textContent = t("connections", "messages.not_quite");
    connClearSelection();
  }
});

$("#conn-clear").addEventListener("click", () => {
  if (connOver) return;
  connClearSelection();
  $("#conn-message").textContent = "";
});

$("#conn-giveup").addEventListener("click", () => {
  if (connOver) return;
  connFinish(true); // forfeit: score resets to 0 no matter what was solved
});

function connFinish(gaveUp) {
  connOver = true;
  // the only game whose condition needs more than the score: all four groups
  // AND at most three failed Submits, so connMistakes rides along
  Progress.record({
    game: "connections",
    level: connLevelRaw,
    won: !gaveUp && connSolved.length === connPuzzle.categories.length,
    mistakes: connMistakes,
  });
  const score = gaveUp ? 0 : connSolved.length * CONNECTIONS_DATA.scoring.points_per_group;

  $("#conn-end-title").textContent = gaveUp ? t("connections", "messages.gave_up_title") : t("connections", "messages.puzzle_complete_title");
  $("#conn-score").textContent = `${score} / ${CONNECTIONS_DATA.scoring.max_per_game}`;

  // reveal all 4 categories (in JSON order) so the player learns
  const wrap = $("#conn-end-groups");
  wrap.innerHTML = "";
  connPuzzle.categories.forEach((c, i) => wrap.appendChild(connGroupCard(i)));

  $("#conn-play").classList.add("hidden");
  $("#conn-end").classList.remove("hidden");
}

// PLAY AGAIN: new puzzle, same level
$("#conn-again-btn").addEventListener("click", () => startConnections(connLevelRaw));

/* =====================================================
   GAME 8 — IS IT A REAL WORD? (DET-style)
   8 words, one at a time, 6 seconds each: decide REAL or
   FAKE. Random real/fake split per game (3-5 real).
   Timeout counts as incorrect. +1 per correct answer.
   Data: REALWORD_DATA (realword_data.js).
   ===================================================== */
const RW_STORAGE_KEY = "realword_last_words";
const RW_FEEDBACK_MS = 800; // brief ✓/✗ flash between words

let rwWords = []; // [{ word, real }] in play order
let rwIndex = 0;
let rwResults = []; // [{ word, real, correct }]
let rwAnswered = false; // double-click guard for the current word
let rwTimerId = null;
let rwDeadline = 0; // Date.now()-based so the timer never pauses

const rwRules = () => REALWORD_DATA.rules;

// difficulty (added in data v2, which splits the bank into basic/intermediate/
// advanced). The radio values are Spanish (basico/…) while the bank keys are
// English, so we reuse WL_LEVEL_KEYS — the same mapping Word Links and Waffle
// already use. rwLevelRaw keeps the radio value so PLAY AGAIN can replay the
// same difficulty; rwLevel is the bank key.
let rwLevelRaw = null; // "basico" | "intermedio" | "avanzado"
let rwLevel = null; // "basic" | "intermediate" | "advanced"

// the real/fake pools for the level in play. Rules (8 words, 6s, 3-5 real) are
// identical across levels — only the word pools differ.
const rwBank = () => REALWORD_DATA.words[rwLevel] || REALWORD_DATA.words.basic;

function rwStopTimer() {
  if (rwTimerId) {
    clearInterval(rwTimerId);
    rwTimerId = null;
  }
}

function rwPick(pool, count, exclude) {
  let candidates = pool.filter((w) => !exclude.includes(w));
  if (candidates.length < count) candidates = pool; // bank too small — allow repeats
  return shuffle(candidates).slice(0, count);
}

function startRealword(level) {
  rwLevelRaw = level || "basico";
  rwLevel = WL_LEVEL_KEYS[rwLevelRaw] || rwLevelRaw;

  // random split per game: 3 to 5 real words, the rest fake
  const min = rwRules().min_real_per_game;
  const max = rwRules().max_real_per_game;
  const realCount = min + Math.floor(Math.random() * (max - min + 1));
  const fakeCount = rwRules().words_per_game - realCount;

  let lastWords = [];
  try {
    lastWords = JSON.parse(localStorage.getItem(RW_STORAGE_KEY)) || [];
  } catch (err) { /* corrupted storage — ignore */ }

  const reals = rwPick(rwBank().real, realCount, lastWords).map((w) => ({ word: w, real: true }));
  const fakes = rwPick(rwBank().fake, fakeCount, lastWords).map((w) => ({ word: w, real: false }));
  rwWords = shuffle([...reals, ...fakes]); // fully random order

  rwIndex = 0;
  rwResults = [];

  // don't reveal the real/fake split — that's the whole challenge
  $("#rw-meta").textContent = interp(t("realword", "labels.meta"), {
    "LEVEL_LABELS[level]": ts("level_labels." + rwLevelRaw),
    "rwRules().words_per_game": rwRules().words_per_game,
    "rwRules().seconds_per_word": rwRules().seconds_per_word,
  });
  $("#rw-end").classList.add("hidden");
  $("#rw-play").classList.remove("hidden");
  applyText([
    ["#screen-realword .game-topline [data-back]", ts("buttons.back")],
    ["#screen-realword .rw-question", t("realword", "static_labels.question")],
    ["#rw-yes", t("realword", "buttons.yes")],
    ["#rw-no", t("realword", "buttons.no")],
    ["#rw-again-btn", t("realword", "buttons.play_again")],
    ["#rw-end [data-back]", t("realword", "buttons.back_to_menu")],
    ["#rw-end .end-title", t("realword", "messages.game_complete_title")],
  ]);
  const scoreLabel = $("#rw-end .end-word");
  if (scoreLabel) scoreLabel.firstChild.textContent = t("realword", "messages.score_label");

  showScreen("#screen-realword");
  rwLoadWord();
}

function rwLoadWord() {
  const item = rwWords[rwIndex];
  rwAnswered = false;

  $("#rw-progress").textContent = interp(t("realword", "messages.progress"), { "rwIndex + 1": rwIndex + 1, "rwWords.length": rwWords.length });
  $("#rw-word").textContent = item.word.toLowerCase(); // lowercase, like the DET
  $("#rw-feedback").textContent = "";
  $("#rw-feedback").className = "rw-feedback";
  $("#rw-yes").disabled = false;
  $("#rw-no").disabled = false;

  // real-time 6s countdown (Date.now() based — keeps running if the tab is hidden)
  rwStopTimer();
  rwDeadline = Date.now() + rwRules().seconds_per_word * 1000;
  rwTick();
  rwTimerId = setInterval(rwTick, 100);
}

function rwTick() {
  const msLeft = Math.max(0, rwDeadline - Date.now());
  const total = rwRules().seconds_per_word * 1000;
  const fill = $("#rw-timer-fill");
  fill.style.width = `${(msLeft / total) * 100}%`;

  const secondsLeft = Math.ceil(msLeft / 1000);
  $("#rw-seconds").textContent = `${secondsLeft}s`;

  const urgent = msLeft <= 2000; // last 2 seconds: red + pulsing
  fill.classList.toggle("urgent", urgent);
  $("#rw-seconds").classList.toggle("urgent", urgent);

  if (msLeft <= 0 && !rwAnswered) {
    rwAnswer(null); // timeout counts as incorrect
  }
}

// answeredReal: true = pressed Yes, false = pressed No, null = timed out
function rwAnswer(answeredReal) {
  if (rwAnswered) return; // ignore double-clicks
  rwAnswered = true;
  rwStopTimer();
  $("#rw-yes").disabled = true;
  $("#rw-no").disabled = true;

  const item = rwWords[rwIndex];
  const correct = answeredReal !== null && answeredReal === item.real;
  SFX.play(correct ? "correct" : "wrong"); // timeout (answeredReal === null) counts as wrong here too
  rwResults.push({ word: item.word, real: item.real, correct });

  const fb = $("#rw-feedback");
  fb.textContent = correct
    ? t("realword", "messages.correct")
    : answeredReal === null
      ? t("realword", "messages.timeout")
      : t("realword", "messages.wrong");
  fb.className = `rw-feedback ${correct ? "ok" : "bad"}`;

  setTimeout(() => {
    rwIndex++;
    if (rwIndex >= rwWords.length) rwShowResults();
    else rwLoadWord();
  }, RW_FEEDBACK_MS);
}

$("#rw-yes").addEventListener("click", () => rwAnswer(true));
$("#rw-no").addEventListener("click", () => rwAnswer(false));

function rwShowResults() {
  rwStopTimer();
  SFX.stop("tick"); // kill the per-word loop BEFORE the closing cue, never after
  SFX.play("success");
  const score = rwResults.filter((r) => r.correct).length * REALWORD_DATA.scoring.points_per_correct;
  Progress.record({ game: "realword", level: rwLevelRaw, score, maxScore: REALWORD_DATA.scoring.max_per_game });
  $("#rw-score").textContent = `${score} / ${REALWORD_DATA.scoring.max_per_game}`;

  // per-word review: what it was, whether the player got it, and click-to-expand
  // the meaning (real words) or "Not a real word" (fake words).
  const list = $("#rw-summary");
  list.innerHTML = "";
  rwResults.forEach((r) => {
    const li = document.createElement("li");
    li.classList.add(r.correct ? "was-found" : "was-missed", "rw-expandable");

    const head = document.createElement("button");
    head.type = "button";
    head.className = "rw-row-head";
    head.setAttribute("aria-expanded", "false");

    const name = document.createElement("span");
    name.className = "rw-row-name";
    name.textContent = r.correct
      ? interp(t("realword", "messages.row_correct_prefix"), { "r.word.toLowerCase()": r.word.toLowerCase() })
      : interp(t("realword", "messages.row_wrong_prefix"), { "r.word.toLowerCase()": r.word.toLowerCase() });

    const tag = document.createElement("span");
    tag.className = "rw-tag";
    tag.textContent = r.real ? t("realword", "messages.tag_real") : t("realword", "messages.tag_fake");

    head.appendChild(name);
    head.appendChild(tag);

    const panel = document.createElement("div");
    panel.className = "rw-meaning";
    const def = r.real ? lookupDefinition(r.word) : null;
    const meaningLine = document.createElement("p");
    meaningLine.className = "meaning-en";
    meaningLine.textContent = r.real
      ? (def || t("realword", "messages.meaning_unavailable"))
      : t("realword", "messages.meaning_not_real");
    panel.appendChild(meaningLine);
    if (!r.real) panel.classList.add("rw-meaning-fake");

    head.addEventListener("click", () => {
      const open = li.classList.toggle("open");
      head.setAttribute("aria-expanded", open ? "true" : "false");
    });

    li.appendChild(head);
    li.appendChild(panel);
    list.appendChild(li);
  });

  // remember this game's words for the anti-repeat rule
  try {
    localStorage.setItem(RW_STORAGE_KEY, JSON.stringify(rwWords.map((w) => w.word)));
  } catch (err) { /* private mode — ignore */ }

  $("#rw-play").classList.add("hidden");
  $("#rw-end").classList.remove("hidden");
}

// pass the remembered difficulty, or PLAY AGAIN would hand startRealword the
// click Event as its `level` argument
$("#rw-again-btn").addEventListener("click", () => startRealword(rwLevelRaw));

/* =====================================================
   GAME 9 — BOMB WORD (BombParty-style)
   4 levels × 3 prefixes. Type ANY real English word that
   starts with the prefix before the bomb goes off
   (8s levels 1-2, 6s levels 3-4). One wrong/late answer
   ends the game. No score — only the level you reached.
   Data: BOMBWORD_DATA (bombword_data.js).
   ===================================================== */
const BW_STORAGE_KEY = "bombword_last_prefixes";
const BW_LEVEL_KEYS = ["level1", "level2", "level3", "level4"];
const BW_FLASH_MS = 450; // quick green flash between prefixes — keep the pace up

// 28k-word dictionary as a Set for O(1) validation lookups.
// Built on FIRST USE, not at load: bombword_data.js now arrives on demand, so
// touching BOMBWORD_DATA while app.js is still executing would throw and abort
// the rest of the file. The .has() call site is unchanged.
let bwDictSet = null;
const BW_DICTIONARY = {
  has: (w) => (bwDictSet || (bwDictSet = new Set(BOMBWORD_DATA.dictionary))).has(w),
};

let bwPrefixes = []; // 12 prefixes for this game, in play order (3 per level)
let bwIndex = 0; // 0-11
let bwActive = false;
let bwProcessing = false; // double-submit guard
let bwTimerId = null;
let bwDeadline = 0; // Date.now()-based
let bwLives = 3; // fresh 3 lives on EACH level (they don't carry over)
let bwTransitionId = null; // pending "LEVEL X" splash timeouts

const bwLevelIndex = () => Math.floor(bwIndex / BOMBWORD_DATA.rules.prefixes_per_level_in_game);
const bwLevelKey = () => BW_LEVEL_KEYS[bwLevelIndex()];
const bwTimeSeconds = () => BOMBWORD_DATA.levels[bwLevelKey()].time_seconds;

function bwStopTimer() {
  SFX.stop("tick"); // single choke point: covers correct/timeout/loss/win/exit/new transition
  if (bwTimerId) {
    clearInterval(bwTimerId);
    bwTimerId = null;
  }
  if (bwTransitionId) {
    clearTimeout(bwTransitionId);
    bwTransitionId = null;
    $("#bw-transition").classList.add("hidden");
  }
}

function bwRenderLives() {
  const wrap = $("#bw-lives");
  wrap.innerHTML = "";
  const total = BOMBWORD_DATA.rules.lives_per_level;
  for (let i = 0; i < total; i++) {
    const heart = document.createElement("span");
    heart.className = "bw-heart" + (i < bwLives ? "" : " lost");
    heart.textContent = "💜";
    wrap.appendChild(heart);
  }
}

// "LEVEL X" splash: holds for rules.level_transition_screen_seconds,
// fades out, then the first prefix of the level starts with its timer running
function bwShowTransition(levelNumber, done) {
  const splash = $("#bw-transition");
  $("#bw-transition-text").textContent = interp(t("bombword", "messages.level_splash"), { levelNumber });
  splash.classList.remove("hidden", "fade");
  SFX.play("level");

  const holdMs = (BOMBWORD_DATA.rules.level_transition_screen_seconds || 1.5) * 1000;
  const fadeMs = 400; // matches the CSS opacity transition
  bwTransitionId = setTimeout(() => {
    splash.classList.add("fade");
    bwTransitionId = setTimeout(() => {
      splash.classList.add("hidden");
      splash.classList.remove("fade");
      bwTransitionId = null;
      done();
    }, fadeMs);
  }, holdMs);
}

function startBombword() {
  let lastPrefixes = [];
  try {
    lastPrefixes = JSON.parse(localStorage.getItem(BW_STORAGE_KEY)) || [];
  } catch (err) { /* corrupted storage — ignore */ }

  // 3 random prefixes per level, avoiding last game's when possible
  bwPrefixes = [];
  BW_LEVEL_KEYS.forEach((key) => {
    const pool = BOMBWORD_DATA.levels[key].prefixes;
    let candidates = pool.filter((p) => !lastPrefixes.includes(p));
    if (candidates.length < BOMBWORD_DATA.rules.prefixes_per_level_in_game) candidates = pool;
    bwPrefixes.push(...shuffle(candidates).slice(0, BOMBWORD_DATA.rules.prefixes_per_level_in_game));
  });

  bwIndex = 0;
  bwActive = true;
  bwProcessing = false;

  $("#bw-meta").textContent = t("bombword", "labels.meta");
  $("#bw-end").classList.add("hidden");
  $("#bw-play").classList.remove("hidden");
  applyText([
    ["#screen-bombword .game-topline [data-back]", ts("buttons.back")],
    ["#screen-bombword .rw-question", t("bombword", "static_labels.prompt")],
    ["#bw-form button[type=\"submit\"]", t("bombword", "buttons.submit")],
    ["#bw-again-btn", t("bombword", "buttons.play_again")],
    ["#bw-end [data-back]", t("bombword", "buttons.back_to_menu")],
  ]);

  showScreen("#screen-bombword");
  bwEnterLevel(); // level 1 also gets its "LEVEL 1" splash
}

// entering a level (including level 1): fresh 3 lives + transition splash
function bwEnterLevel() {
  bwLives = BOMBWORD_DATA.rules.lives_per_level;
  bwRenderLives();
  bwShowTransition(bwLevelIndex() + 1, bwLoadPrefix);
}

function bwLoadPrefix() {
  bwProcessing = false;

  $("#bw-level").textContent = interp(t("bombword", "labels.level_progress"), { "bwLevelIndex() + 1": bwLevelIndex() + 1, "BOMBWORD_DATA.rules.levels_per_game": BOMBWORD_DATA.rules.levels_per_game });
  $("#bw-progress").textContent = interp(t("bombword", "labels.word_progress"), { "(bwIndex % 3) + 1": (bwIndex % 3) + 1, "BOMBWORD_DATA.rules.prefixes_per_level_in_game": BOMBWORD_DATA.rules.prefixes_per_level_in_game });
  $("#bw-prefix-text").textContent = bwPrefixes[bwIndex];
  $("#bw-feedback").textContent = "";
  $("#bw-feedback").className = "rw-feedback";
  $("#bw-input").value = "";
  $("#bw-input").disabled = false;
  $("#bw-input").focus(); // type immediately, no tap needed

  // real-time countdown with the current level's time (8s / 8s / 6s / 6s)
  bwStopTimer();
  SFX.loop("tick"); // starts the instant the countdown starts, per prefix
  bwDeadline = Date.now() + bwTimeSeconds() * 1000;
  bwTick();
  bwTimerId = setInterval(bwTick, 100);
}

function bwTick() {
  const msLeft = Math.max(0, bwDeadline - Date.now());
  const total = bwTimeSeconds() * 1000;
  const fill = $("#bw-timer-fill");
  fill.style.width = `${(msLeft / total) * 100}%`;
  $("#bw-seconds").textContent = `${Math.ceil(msLeft / 1000)}s`;

  const urgent = msLeft <= 2000; // last 2s: red bar + shaking bomb
  fill.classList.toggle("urgent", urgent);
  $("#bw-seconds").classList.toggle("urgent", urgent);
  $("#bw-bomb").classList.toggle("urgent", urgent);

  if (msLeft <= 0 && bwActive && !bwProcessing) {
    bwGameOver(t("bombword", "messages.gameover_timeout")); // timeout = instant fail
  }
}

$("#bw-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!bwActive || bwProcessing) return; // ignore double-Enter
  bwProcessing = true;

  const prefix = bwPrefixes[bwIndex];
  const guess = $("#bw-input").value.trim().toUpperCase();

  const valid =
    guess.startsWith(prefix) && // (a) starts with the prefix
    guess.length > prefix.length && // (b) longer than the prefix itself
    BW_DICTIONARY.has(guess); // (c) real word in the dictionary

  if (!valid) {
    // invalid word: lose 1 life, keep the SAME prefix, and the timer
    // KEEPS RUNNING with whatever time was left (it never restarts)
    SFX.play("wrong"); // fires on every wrong word, even the one that costs the last life — tick is untouched
    bwLives--;
    bwRenderLives();
    if (bwLives <= 0) {
      bwGameOver(t("bombword", "messages.gameover_lives")); // 3 invalid words in this level
      return;
    }
    const fb = $("#bw-feedback");
    fb.textContent = guess
      ? interp(t("bombword", "messages.wrong_guess"), {
          "guess.toLowerCase()": guess.toLowerCase(),
          bwLives,
          'bwLives === 1 ? "life" : "lives"': bwLives === 1 ? "life" : "lives",
          'bwLives === 1 ? "vida" : "vidas"': bwLives === 1 ? "vida" : "vidas",
        })
      : interp(t("bombword", "messages.empty_answer"), {
          bwLives,
          'bwLives === 1 ? "life" : "lives"': bwLives === 1 ? "life" : "lives",
          'bwLives === 1 ? "vida" : "vidas"': bwLives === 1 ? "vida" : "vidas",
        });
    fb.className = "rw-feedback bad";
    $("#bw-input").value = "";
    $("#bw-input").focus();
    bwProcessing = false; // same prefix, keep playing against the same clock
    return;
  }

  // valid: quick green flash, then next prefix / next level / victory
  bwStopTimer(); // stops tick
  SFX.play("correct");
  $("#bw-input").disabled = true;
  const fb = $("#bw-feedback");
  fb.textContent = interp(t("bombword", "messages.correct_flash"), { guess });
  fb.className = "rw-feedback ok";

  setTimeout(() => {
    bwIndex++;
    if (bwIndex >= bwPrefixes.length) bwWin();
    else if (bwIndex % BOMBWORD_DATA.rules.prefixes_per_level_in_game === 0) bwEnterLevel(); // new level: lives reset + splash
    else bwLoadPrefix();
  }, BW_FLASH_MS);
});

function bwSaveLastPrefixes() {
  // remember only the prefixes actually played, for the anti-repeat rule
  try {
    localStorage.setItem(BW_STORAGE_KEY, JSON.stringify(bwPrefixes.slice(0, bwIndex + 1)));
  } catch (err) { /* private mode — ignore */ }
}

function bwWin() {
  bwActive = false;
  // no selectors at all: a single key, and only the victory path records
  Progress.record({ game: "bombword", won: true });
  bwStopTimer(); // stops tick BEFORE the closing cue, same order as bwGameOver
  SFX.play("success"); // victory only — defeat goes through bwGameOver and keeps explosion alone
  bwSaveLastPrefixes();
  $("#bw-end-title").textContent = t("bombword", "messages.end_title_won");
  $("#bw-end-detail").textContent = t("bombword", "messages.end_detail_won");
  $("#bw-play").classList.add("hidden");
  $("#bw-end").classList.remove("hidden");
}

function bwGameOver(reason) {
  bwActive = false;
  bwStopTimer(); // stops tick BEFORE explosion, so they never overlap
  SFX.play("explosion");
  bwSaveLastPrefixes();
  $("#bw-end-title").textContent = interp(t("bombword", "messages.end_title_lost"), { "bwLevelIndex() + 1": bwLevelIndex() + 1 });
  $("#bw-end-detail").textContent = interp(t("bombword", "messages.end_detail_lost"), { reason, "bwPrefixes[bwIndex]": bwPrefixes[bwIndex] });
  $("#bw-play").classList.add("hidden");
  $("#bw-end").classList.remove("hidden");
}

$("#bw-again-btn").addEventListener("click", startBombword);

/* =====================================================
   GAME 10 — WAFFLE
   One waffle-pattern grid (5×5 normal / 7×7 deluxe).
   Cells: green = matches the solution, yellow = not yet.
   Click two cells to swap their letters. Solve every cell
   before running out of swaps (Basic = unlimited).
   Data: WAFFLE_DATA (waffle_data.js).
   ===================================================== */
const WF_STORAGE_PREFIX = "waffle_last_";
const WF_UNIFORM_ATTEMPTS = 400; // tries at a pure random scramble before the guaranteed fallback

let wfMode = null; // "normal" | "deluxe"
let wfLevelRaw = null; // modal value, for PLAY AGAIN
let wfPuzzle = null;
let wfCells = []; // occupied cells: { r, c, solution } in build order
let wfCurrent = []; // current letter at each occupied cell index
let wfSwapsLeft = null; // null = unlimited (Basic)
let wfSelected = null; // index of the cell awaiting its swap partner
let wfOver = false;

// Occupied waffle cells: a cell exists unless BOTH row and column are odd.
// Even rows come from across words, odd rows (even columns) from down words.
function wfBuildCells(puzzle, size) {
  const cells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (r % 2 === 1 && c % 2 === 1) continue; // waffle hole
      const solution = r % 2 === 0 ? puzzle.across[r / 2][c] : puzzle.down[c / 2][r];
      cells.push({ r, c, solution });
    }
  }
  return cells;
}

// Minimum swaps to sort a permutation = n - number_of_cycles
// (perm[i] = which solution index's letter currently sits at cell i)
function wfMinSwaps(perm) {
  const seen = new Array(perm.length).fill(false);
  let cycles = 0;
  for (let i = 0; i < perm.length; i++) {
    if (seen[i]) continue;
    cycles++;
    let j = i;
    while (!seen[j]) {
      seen[j] = true;
      j = perm[j];
    }
  }
  return perm.length - cycles;
}

// Build a scramble permutation whose minimum-swap distance fits the limit.
// 1) try uniform random permutations (spec's discard-and-retry);
// 2) if the limit is too tight for that to ever pass (e.g. Deluxe Advanced),
//    fall back to composing `limit` random transpositions, which by
//    construction needs <= limit swaps — still verified with the same formula.
function wfMakeScramble(n, limit) {
  const floor = Math.min(3, limit === null ? 3 : limit); // never hand out a solved board
  if (limit !== null) {
    for (let attempt = 0; attempt < WF_UNIFORM_ATTEMPTS; attempt++) {
      const perm = shuffle([...Array(n).keys()]);
      const min = wfMinSwaps(perm);
      if (min <= limit && min >= floor) return perm;
    }
    // guaranteed fallback
    for (;;) {
      const perm = [...Array(n).keys()];
      for (let k = 0; k < limit; k++) {
        const a = Math.floor(Math.random() * n);
        let b = Math.floor(Math.random() * n);
        while (b === a) b = Math.floor(Math.random() * n);
        [perm[a], perm[b]] = [perm[b], perm[a]];
      }
      const min = wfMinSwaps(perm);
      if (min <= limit && min >= floor) return perm;
    }
  }
  // unlimited: any random permutation that isn't (nearly) solved
  for (;;) {
    const perm = shuffle([...Array(n).keys()]);
    if (wfMinSwaps(perm) >= floor) return perm;
  }
}

function startWaffle(mode, level) {
  wfMode = mode;
  wfLevelRaw = level;
  const levelKey = WL_LEVEL_KEYS[level] || level;

  const pool = (WAFFLE_DATA.puzzles[mode] && WAFFLE_DATA.puzzles[mode][levelKey]) || [];
  if (!pool.length) {
    alert("Waffle data for this combination could not be loaded. Please try another one.");
    return;
  }

  // anti-repeat per mode+level combo
  const storageKey = `${WF_STORAGE_PREFIX}${mode}_${levelKey}`;
  const lastId = localStorage.getItem(storageKey);
  let candidates = pool.filter((p) => p.id !== lastId);
  if (!candidates.length) candidates = pool;
  wfPuzzle = randomItem(candidates);
  try {
    localStorage.setItem(storageKey, wfPuzzle.id);
  } catch (err) { /* private mode — ignore */ }

  const size = WAFFLE_DATA.modes[mode].grid_size;
  wfCells = wfBuildCells(wfPuzzle, size);
  const limit = WAFFLE_DATA.swaps[mode][levelKey];
  wfSwapsLeft = limit; // null = unlimited
  const perm = wfMakeScramble(wfCells.length, limit);
  wfCurrent = perm.map((srcIdx) => wfCells[srcIdx].solution);
  wfSelected = null;
  wfOver = false;

  $("#wf-meta").textContent = `${mode.toUpperCase()} · ${ts("level_labels." + level)}`;
  $("#wf-message").textContent = "";
  $("#wf-end").classList.add("hidden");
  $("#wf-play").classList.remove("hidden");
  applyText([
    ["#screen-waffle .game-topline [data-back]", ts("buttons.back")],
    ["#wf-again-btn", t("waffle", "buttons.play_again")],
    ['#screen-waffle [data-replay="waffle"]', t("waffle", "buttons.change_settings")],
    ["#wf-end [data-back]", t("waffle", "buttons.back_to_menu")],
  ]);

  wfRenderGrid(size);
  wfRefresh();
  showScreen("#screen-waffle");
}

function wfRenderGrid(size) {
  const grid = $("#wf-grid");
  grid.innerHTML = "";
  grid.style.gridTemplateColumns = `repeat(${size}, var(--wf-cell))`;
  grid.style.setProperty("--wf-cell", size === 7 ? "min(48px, 11.8vw)" : "min(56px, 15vw)");

  let occupied = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = document.createElement("button");
      if (r % 2 === 1 && c % 2 === 1) {
        cell.className = "wf-cell hole"; // waffle hole: invisible, unclickable
        cell.tabIndex = -1;
      } else {
        cell.className = "wf-cell";
        cell.dataset.idx = occupied++;
        cell.addEventListener("click", () => wfClickCell(Number(cell.dataset.idx)));
      }
      grid.appendChild(cell);
    }
  }
}

// Wordle-style color for one cell, checked against its row word AND/OR its
// column word (intersection cells belong to both; qualifying in either is enough):
// green  = exact match at this position;
// yellow = the letter has an occurrence in that word not already covered by a
//          green cell with the same letter (so duplicates never over-count);
// gray   = no available occurrence in any of its words.
function wfCellColor(i) {
  const cell = wfCells[i];
  const letter = wfCurrent[i];
  if (letter === cell.solution) return "green";

  const lines = [];
  if (cell.r % 2 === 0) lines.push({ word: wfPuzzle.across[cell.r / 2], along: (x) => x.r === cell.r });
  if (cell.c % 2 === 0) lines.push({ word: wfPuzzle.down[cell.c / 2], along: (x) => x.c === cell.c });

  for (const line of lines) {
    const totalInWord = [...line.word].filter((ch) => ch === letter).length;
    if (!totalInWord) continue;
    // occurrences already claimed by GREEN cells of this same letter in this line
    let coveredByGreens = 0;
    wfCells.forEach((x, idx) => {
      if (line.along(x) && wfCurrent[idx] === x.solution && x.solution === letter) coveredByGreens++;
    });
    if (totalInWord - coveredByGreens > 0) return "yellow";
  }
  return "gray";
}

function wfRefresh() {
  // letters + colors (recomputed for EVERY cell after each swap, since one swap
  // can change the available-letter counts across whole rows and columns)
  $$("#wf-grid .wf-cell:not(.hole)").forEach((el) => {
    const i = Number(el.dataset.idx);
    const color = wfCellColor(i);
    el.textContent = wfCurrent[i];
    el.classList.toggle("green", color === "green");
    el.classList.toggle("yellow", color === "yellow");
    el.classList.toggle("gray", color === "gray");
    el.classList.toggle("selected", wfSelected === i);
  });

  // swaps counter
  const swapsEl = $("#wf-swaps");
  if (wfSwapsLeft === null) {
    swapsEl.textContent = t("waffle", "messages.unlimited_swaps");
    swapsEl.classList.remove("low");
  } else {
    swapsEl.textContent = interp(t("waffle", "messages.swaps_remaining"), { wfSwapsLeft, 'wfSwapsLeft === 1 ? "" : "S"': wfSwapsLeft === 1 ? "" : "S" });
    swapsEl.classList.toggle("low", wfSwapsLeft <= 3);
  }
}

function wfClickCell(i) {
  if (wfOver) return;
  if (wfCurrent[i] === wfCells[i].solution) return; // green cells are locked

  if (wfSelected === null) {
    wfSelected = i;
  } else if (wfSelected === i) {
    wfSelected = null; // same cell again: deselect, no swap spent
  } else {
    // swap the two letters
    const a = wfSelected, b = i;
    [wfCurrent[a], wfCurrent[b]] = [wfCurrent[b], wfCurrent[a]];
    wfSelected = null;
    if (wfSwapsLeft !== null) wfSwapsLeft--;

    const solved = wfCurrent.every((letter, idx) => letter === wfCells[idx].solution);
    if (solved) {
      // the winning swap plays ONLY success.mp3 (from wfFinish) — no
      // letter_correct/letter_move here, or it would overlap on top of it
      wfRefresh();
      wfFinish(true);
      return;
    }

    // priority rule: if this swap lands EITHER letter in its correct spot,
    // letter_correct plays alone — it replaces letter_move, never both, and
    // fires once even if both letters land correctly on the same swap
    const aOk = wfCurrent[a] === wfCells[a].solution;
    const bOk = wfCurrent[b] === wfCells[b].solution;
    SFX.play(aOk || bOk ? "letter_correct" : "letter_move");

    if (wfSwapsLeft !== null && wfSwapsLeft <= 0) {
      wfRefresh();
      wfFinish(false);
      return;
    }
  }
  wfRefresh();
}

function wfFinish(won) {
  wfOver = true;
  wfSelected = null;
  // the only game with two axes: every tier needs the same difficulty cleared
  // in BOTH modes, so mode is part of the play key
  Progress.record({ game: "waffle", level: wfLevelRaw, mode: wfMode, won });
  SFX.play(won ? "success" : "fail"); // generic, neutral end-of-game cue — Waffle has no bomb to justify explosion.mp3

  $("#wf-end-title").textContent = won ? t("waffle", "messages.end_title_won") : t("waffle", "messages.end_title_lost");
  const solvedCount = wfCurrent.filter((l, i) => l === wfCells[i].solution).length;
  // the nested ${wfSwapsLeft !== null ? `...` : ""} placeholder was translated
  // WORD-FOR-WORD inside the ES string too (not just the outer text), so the
  // captured expression text differs by language — both variants are supplied
  // as vars keys; interp() only ever matches the one actually present.
  $("#wf-end-detail").textContent = won
    ? interp(t("waffle", "messages.end_detail_won"), {
        "wfCells.length": wfCells.length,
        'wfSwapsLeft !== null ? ` with ${wfSwapsLeft} swap${wfSwapsLeft === 1 ? "" : "s"} to spare` : ""':
          wfSwapsLeft !== null ? ` with ${wfSwapsLeft} swap${wfSwapsLeft === 1 ? "" : "s"} to spare` : "",
        'wfSwapsLeft !== null ? ` con ${wfSwapsLeft} intercambio${wfSwapsLeft === 1 ? "" : "s"} de sobra` : ""':
          wfSwapsLeft !== null ? ` con ${wfSwapsLeft} intercambio${wfSwapsLeft === 1 ? "" : "s"} de sobra` : "",
      })
    : interp(t("waffle", "messages.end_detail_lost"), { solvedCount, "wfCells.length": wfCells.length });

  // reveal the solution words — each one is clickable to expand its meaning
  // (same behaviour whether the player won or ran out of swaps).
  const list = $("#wf-solution");
  list.innerHTML = "";
  const addWord = (label, word) => {
    const li = document.createElement("li");
    li.className = "wf-word-item";

    const head = document.createElement("button");
    head.type = "button";
    head.className = "wf-word-head";
    head.setAttribute("aria-expanded", "false");
    head.innerHTML = `<span>${label}</span><span class="wf-word-value">${word}</span>`;

    const panel = document.createElement("div");
    panel.className = "wf-word-meaning";
    const def = lookupDefinition(word);
    const meaningLine = document.createElement("p");
    meaningLine.className = "meaning-en";
    meaningLine.textContent = def || t("waffle", "messages.meaning_unavailable");
    panel.appendChild(meaningLine);

    head.addEventListener("click", () => {
      const open = li.classList.toggle("open");
      head.setAttribute("aria-expanded", open ? "true" : "false");
    });

    li.appendChild(head);
    li.appendChild(panel);
    list.appendChild(li);
  };
  wfPuzzle.across.forEach((w, i) => addWord(interp(t("waffle", "messages.solution_row_label"), { "i + 1": i + 1 }), w));
  wfPuzzle.down.forEach((w, i) => addWord(interp(t("waffle", "messages.solution_row_label_down"), { "i + 1": i + 1 }), w));

  setTimeout(() => {
    $("#wf-play").classList.add("hidden");
    $("#wf-end").classList.remove("hidden");
  }, won ? 900 : 1200); // let the player see the final board briefly
}

// PLAY AGAIN keeps the same mode+level; CHANGE SETTINGS reopens the selector
$("#wf-again-btn").addEventListener("click", () => startWaffle(wfMode, wfLevelRaw));

/* =====================================================
   GAME 11 — EMOJI BOMB (Bomb Word variant)
   4 levels × 3 prompts. Each prompt: one starting letter
   + three emojis describing ONE exact word — type it
   before time runs out.
   Basico: 3 lives per level (wrong = -1 life, same
   prompt, clock keeps running). Hardcore: 1 try — any
   wrong answer ends the game. Timeout always ends the
   game in both modes.
   Data: EMOJIBOMB_DATA (emojibomb_data.js).
   ===================================================== */
const EB_STORAGE_PREFIX = "emojibomb_last_";
const EB_FLASH_MS = 450;

let ebMode = null; // "basico" | "hardcore"
let ebWords = []; // 12 prompts for this game (3 per level)
let ebIndex = 0;
let ebActive = false;
let ebProcessing = false;
let ebTimerId = null;
let ebDeadline = 0; // Date.now()-based
let ebLives = 3;
let ebTransitionId = null;

const ebRules = () => EMOJIBOMB_DATA.rules;
const ebModeCfg = () => EMOJIBOMB_DATA.modes[ebMode];
const ebLevelNum = () => Math.floor(ebIndex / ebRules().words_per_level_in_game) + 1;
const ebTimeSeconds = () => ebModeCfg().time_per_level_seconds[String(ebLevelNum())];

function ebStopTimer() {
  SFX.stop("tick"); // single choke point: covers correct/timeout/loss/win/exit/new transition
  if (ebTimerId) {
    clearInterval(ebTimerId);
    ebTimerId = null;
  }
  if (ebTransitionId) {
    clearTimeout(ebTransitionId);
    ebTransitionId = null;
    $("#eb-transition").classList.add("hidden");
  }
}

function ebRenderLives() {
  const wrap = $("#eb-lives");
  wrap.innerHTML = "";
  if (ebMode === "hardcore") {
    // no life counter in hardcore: one wrong answer ends it all
    const tag = document.createElement("span");
    tag.className = "eb-lives-hardcore";
    tag.textContent = t("emojibomb", "messages.one_try_tag");
    wrap.appendChild(tag);
    return;
  }
  for (let i = 0; i < ebModeCfg().lives_per_level; i++) {
    const heart = document.createElement("span");
    heart.className = "bw-heart" + (i < ebLives ? "" : " lost");
    heart.textContent = "💜";
    wrap.appendChild(heart);
  }
}

function ebShowTransition(levelNumber, done) {
  const splash = $("#eb-transition");
  $("#eb-transition-text").textContent = interp(t("emojibomb", "messages.level_splash"), { levelNumber });
  splash.classList.remove("hidden", "fade");
  SFX.play("level");
  const holdMs = (ebRules().level_transition_screen_seconds || 1.5) * 1000;
  ebTransitionId = setTimeout(() => {
    splash.classList.add("fade");
    ebTransitionId = setTimeout(() => {
      splash.classList.add("hidden");
      splash.classList.remove("fade");
      ebTransitionId = null;
      done();
    }, 400); // matches the .bw-transition CSS fade
  }, holdMs);
}

function startEmojiBomb(mode) {
  ebMode = mode;

  let lastWords = [];
  try {
    lastWords = JSON.parse(localStorage.getItem(EB_STORAGE_PREFIX + mode)) || [];
  } catch (err) { /* corrupted storage — ignore */ }

  // 3 random prompts per level, avoiding last game's words in this mode
  ebWords = [];
  for (let lvl = 1; lvl <= ebRules().levels_per_game; lvl++) {
    const pool = EMOJIBOMB_DATA.words[mode][String(lvl)];
    let candidates = pool.filter((w) => !lastWords.includes(w.word));
    if (candidates.length < ebRules().words_per_level_in_game) candidates = pool;
    ebWords.push(...shuffle(candidates).slice(0, ebRules().words_per_level_in_game));
  }

  ebIndex = 0;
  ebActive = true;
  ebProcessing = false;

  $("#eb-meta").textContent =
    mode === "hardcore" ? "HARDCORE · ONE MISTAKE ENDS IT" : "BASICO · 3 LIVES PER LEVEL";
  $("#eb-play").classList.toggle("eb-hardcore", mode === "hardcore");
  $("#eb-end").classList.add("hidden");
  $("#eb-play").classList.remove("hidden");
  applyText([
    ["#screen-emojibomb .game-topline [data-back]", ts("buttons.back")],
    ["#screen-emojibomb .rw-question", t("emojibomb", "static_labels.prompt")],
    ["#eb-form button[type=\"submit\"]", t("emojibomb", "buttons.submit")],
    ["#eb-again-btn", t("emojibomb", "buttons.play_again")],
    ['#screen-emojibomb [data-replay="emojibomb"]', t("emojibomb", "buttons.change_mode")],
    ["#eb-end [data-back]", t("emojibomb", "buttons.back_to_menu")],
  ]);

  showScreen("#screen-emojibomb");
  ebEnterLevel(); // level 1 also gets its splash
}

function ebEnterLevel() {
  ebLives = ebModeCfg().lives_per_level; // 3 in basico (reset per level), 1 in hardcore
  ebRenderLives();
  ebShowTransition(ebLevelNum(), ebLoadPrompt);
}

function ebLoadPrompt() {
  const item = ebWords[ebIndex];
  ebProcessing = false;

  $("#eb-level").textContent = interp(t("emojibomb", "labels.level_progress"), { "ebLevelNum()": ebLevelNum(), "ebRules().levels_per_game": ebRules().levels_per_game });
  $("#eb-progress").textContent = interp(t("emojibomb", "labels.word_progress"), { "(ebIndex % 3) + 1": (ebIndex % 3) + 1, "ebRules().words_per_level_in_game": ebRules().words_per_level_in_game });
  $("#eb-letter").textContent = item.letter;
  // one span per emoji so ZWJ sequences (like 👨‍🍳) always render as ONE symbol
  const emojiWrap = $("#eb-emojis");
  emojiWrap.innerHTML = "";
  item.emojis.forEach((e) => {
    const span = document.createElement("span");
    span.textContent = e;
    emojiWrap.appendChild(span);
  });
  $("#eb-feedback").textContent = "";
  $("#eb-feedback").className = "rw-feedback";
  $("#eb-input").value = "";
  $("#eb-input").disabled = false;
  $("#eb-input").focus(); // type immediately under time pressure

  ebStopTimer();
  SFX.loop("tick"); // starts the instant the countdown starts, per prompt
  ebDeadline = Date.now() + ebTimeSeconds() * 1000;
  ebTick();
  ebTimerId = setInterval(ebTick, 100);
}

function ebTick() {
  const msLeft = Math.max(0, ebDeadline - Date.now());
  const total = ebTimeSeconds() * 1000;
  const fill = $("#eb-timer-fill");
  fill.style.width = `${(msLeft / total) * 100}%`;
  $("#eb-seconds").textContent = `${Math.ceil(msLeft / 1000)}s`;

  const urgent = msLeft <= 2000;
  fill.classList.toggle("urgent", urgent);
  $("#eb-seconds").classList.toggle("urgent", urgent);

  if (msLeft <= 0 && ebActive && !ebProcessing) {
    ebGameOver(t("emojibomb", "messages.gameover_timeout")); // timeout always ends the game, both modes
  }
}

$("#eb-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!ebActive || ebProcessing) return; // double-Enter guard
  ebProcessing = true;

  const item = ebWords[ebIndex];
  const guess = $("#eb-input").value.trim().toUpperCase();

  if (guess !== item.word) {
    // fires for every wrong word in both modes, including the hardcore one
    // that ends the game — it's a distinct cue for "that word was wrong",
    // separate from the explosion that follows right after for the loss itself
    SFX.play("wrong");
    if (ebMode === "hardcore") {
      // hardcore: the single try failed — game over on the spot
      ebGameOver(guess ? interp(t("emojibomb", "messages.gameover_wrong"), { "guess.toLowerCase()": guess.toLowerCase() }) : t("emojibomb", "messages.gameover_empty"));
      return;
    }
    // basico: lose 1 life, SAME prompt, timer keeps running with its remaining time
    ebLives--;
    ebRenderLives();
    if (ebLives <= 0) {
      ebGameOver(t("emojibomb", "messages.gameover_lives"));
      return;
    }
    const fb = $("#eb-feedback");
    fb.textContent = guess
      ? interp(t("emojibomb", "messages.wrong_guess"), {
          "guess.toLowerCase()": guess.toLowerCase(),
          ebLives,
          'ebLives === 1 ? "life" : "lives"': ebLives === 1 ? "life" : "lives",
          'ebLives === 1 ? "vida" : "vidas"': ebLives === 1 ? "vida" : "vidas",
        })
      : interp(t("emojibomb", "messages.empty_answer"), {
          ebLives,
          'ebLives === 1 ? "life" : "lives"': ebLives === 1 ? "life" : "lives",
          'ebLives === 1 ? "vida" : "vidas"': ebLives === 1 ? "vida" : "vidas",
        });
    fb.className = "rw-feedback bad";
    $("#eb-input").value = "";
    $("#eb-input").focus();
    ebProcessing = false;
    return;
  }

  // correct: quick green flash, then next prompt / next level / victory
  ebStopTimer(); // stops tick
  SFX.play("correct");
  $("#eb-input").disabled = true;
  const fb = $("#eb-feedback");
  fb.textContent = interp(t("emojibomb", "messages.correct_flash"), { "item.word": item.word });
  fb.className = "rw-feedback ok";

  setTimeout(() => {
    ebIndex++;
    if (ebIndex >= ebWords.length) ebWin();
    else if (ebIndex % ebRules().words_per_level_in_game === 0) ebEnterLevel();
    else ebLoadPrompt();
  }, EB_FLASH_MS);
});

function ebSaveLastWords() {
  try {
    localStorage.setItem(
      EB_STORAGE_PREFIX + ebMode,
      JSON.stringify(ebWords.slice(0, ebIndex + 1).map((w) => w.word))
    );
  } catch (err) { /* private mode — ignore */ }
}

function ebWin() {
  ebActive = false;
  // mode only, no difficulty. Its bank keys are "basico"/"hardcore", not English.
  Progress.record({ game: "emojibomb", mode: ebMode, won: true });
  ebStopTimer(); // stops tick BEFORE the closing cue, same order as ebGameOver
  SFX.play("success"); // victory only — defeat goes through ebGameOver and keeps explosion alone
  ebSaveLastWords();
  $("#eb-end-title").textContent =
    ebMode === "hardcore" ? "🏆 You beat EMOJI BOMB on HARDCORE!" : "🎉 You completed all 4 levels!";
  $("#eb-end-detail").textContent =
    ebMode === "hardcore"
      ? "12 words, zero mistakes, one life. Legendary."
      : "12 emoji words solved. The bomb never went off.";
  $("#eb-end-prompt").textContent = "";
  $("#eb-play").classList.add("hidden");
  $("#eb-end").classList.remove("hidden");
}

function ebGameOver(reason) {
  ebActive = false;
  ebStopTimer(); // stops tick BEFORE explosion, so they never overlap
  SFX.play("explosion");
  ebSaveLastWords();
  const item = ebWords[ebIndex];
  $("#eb-end-title").textContent = interp(t("emojibomb", "messages.end_title"), { "ebLevelNum()": ebLevelNum() });
  $("#eb-end-detail").textContent = interp(t("emojibomb", "messages.end_detail"), { reason });
  $("#eb-end-prompt").innerHTML = "";
  const prompt = $("#eb-end-prompt");
  prompt.append(`${item.letter} · `);
  item.emojis.forEach((e, i) => prompt.append(e + (i < 2 ? " " : " · ")));
  const answer = document.createElement("strong");
  answer.textContent = item.word;
  prompt.appendChild(answer);
  $("#eb-play").classList.add("hidden");
  $("#eb-end").classList.remove("hidden");
}

$("#eb-again-btn").addEventListener("click", () => startEmojiBomb(ebMode));

/* =====================================================
   GAME 12 — STRANDS (NYT-style)
   One 6×8 grid, 8 theme words (incl. the gold spangram)
   hidden as paths of adjacent letters (8 directions).
   Drag (or tap letter by letter) to trace a word.
   Extra dictionary words (4+ letters) earn hints:
   every 3 → 1 hint (lights up 2 letters of a pending
   word). Give Up reveals the rest progressively.
   Data: STRANDS_DATA (strands_data.js).
   ===================================================== */
const ST_STORAGE_KEY = "strands_last_puzzles";
const ST_LAST_PUZZLES_MAX = 5;
// Same lazy pattern as BW_DICTIONARY: strands_data.js loads on demand, so the
// Set is built the first time a word is checked, not while app.js runs.
let stDictSet = null;
const ST_DICTIONARY = {
  has: (w) => (stDictSet || (stDictSet = new Set(STRANDS_DATA.dictionary))).has(w),
};

let stMode = "normal";
let stPuzzle = null;
let stFound = new Set(); // theme words solved OR revealed (both paint the grid)
let stEverFound = new Set(); // words the PLAYER actually traced (excludes give-up reveals)
let stSolvedCells = {}; // "r_c" -> "theme" | "span" (permanent colors)
let stNonTheme = new Set(); // credited non-theme words (no double credit)
let stHintsUsed = 0;
let stHintedWord = null; // word currently partially revealed by a hint
let stHintedCells = new Set(); // "r_c" keys currently lit by the hint (grows as the reveal animates)
let stPath = []; // active selection: array of [r, c]
let stDragging = false;
let stDragMoved = false;
let stOver = false;
let stRevealTimer = null;
let stLives = null; // null in normal mode, an integer counting down in hardcore
// set when the SPANGRAM is the word that completes the puzzle. victory.mp3 is a
// ~2-3s fanfare and stFinish lands only 900ms later, so the end-of-game success
// cue is suppressed in exactly that case — one sound per moment, never two.
let stEndedWithSpangram = false;

// how many leading letters a hint reveals: 3 for ≤6, 4 for 7, then ceil(len/2)
// for 8+ (8→4, 9→5). Capped at len-1 so a hint never spells out the whole word.
const stHintRevealCount = (word) => {
  const base = word.length <= 6 ? 3 : word.length === 7 ? 4 : Math.ceil(word.length / 2);
  return Math.min(base, word.length - 1);
};

const stKey = (r, c) => `${r}_${c}`;
const stRules = () => STRANDS_DATA.rules;
const stModeCfg = () => STRANDS_DATA.modes[stMode];
const stHintsAvailable = () =>
  Math.floor(stNonTheme.size / stModeCfg().non_theme_words_per_hint) - stHintsUsed;

function stStopReveal() {
  if (stRevealTimer) {
    clearInterval(stRevealTimer);
    stRevealTimer = null;
  }
}

function stGetLastPuzzles() {
  try {
    const raw = localStorage.getItem(ST_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function stRememberPuzzle(id) {
  try {
    const last = stGetLastPuzzles().filter((x) => x !== id);
    last.push(id);
    while (last.length > ST_LAST_PUZZLES_MAX) last.shift();
    localStorage.setItem(ST_STORAGE_KEY, JSON.stringify(last));
  } catch (err) { /* private mode — ignore */ }
}

function startStrands(mode) {
  stMode = mode;
  const lastPuzzles = stGetLastPuzzles();
  let candidates = STRANDS_DATA.puzzles.filter((p) => !lastPuzzles.includes(p.id));
  if (!candidates.length) candidates = STRANDS_DATA.puzzles;
  stPuzzle = randomItem(candidates);
  stRememberPuzzle(stPuzzle.id);

  stFound = new Set();
  stEverFound = new Set();
  stSolvedCells = {};
  stNonTheme = new Set();
  stHintsUsed = 0;
  stHintedWord = null;
  stHintedCells = new Set();
  stPath = [];
  stDragging = false;
  stOver = false;
  stEndedWithSpangram = false;
  stLives = stModeCfg().lives; // null in normal, 3 in hardcore
  stStopReveal();

  $("#st-meta").textContent = stMode.toUpperCase();
  $("#st-theme").textContent = stPuzzle.theme;
  $("#st-message").textContent = "";
  $("#st-flash").classList.add("hidden");
  $("#st-end").classList.add("hidden");
  $("#st-play").classList.remove("hidden");
  applyText([
    ["#screen-strands .game-topline [data-back]", ts("buttons.back")],
    ["#screen-strands .st-theme-label", t("strands", "static_labels.todays_theme")],
    ["#st-clear-btn", t("strands", "buttons.clear")],
    ["#st-giveup-btn", t("strands", "buttons.give_up")],
    ["#st-again-btn", t("strands", "buttons.play_again")],
    ['#screen-strands [data-replay="strands"]', t("strands", "buttons.change_mode")],
    ["#st-end [data-back]", t("strands", "buttons.back_to_menu")],
  ]);

  stRenderLives();
  stRenderGrid();
  stRefresh();
  showScreen("#screen-strands");
  requestAnimationFrame(stDrawLines); // cells need layout before measuring centers
}

function stRenderLives() {
  const wrap = $("#st-lives");
  wrap.innerHTML = "";
  if (stLives === null) {
    wrap.classList.add("hidden");
    return;
  }
  wrap.classList.remove("hidden");
  for (let i = 0; i < stModeCfg().lives; i++) {
    const heart = document.createElement("span");
    heart.className = "bw-heart" + (i < stLives ? "" : " lost");
    heart.textContent = "💜";
    wrap.appendChild(heart);
  }
}

function stRenderGrid() {
  const grid = $("#st-grid");
  grid.innerHTML = "";
  stPuzzle.grid.forEach((row, r) => {
    row.forEach((letter, c) => {
      const cell = document.createElement("button");
      cell.className = "st-cell";
      cell.textContent = letter;
      cell.dataset.r = r;
      cell.dataset.c = c;
      grid.appendChild(cell);
    });
  });
}

const stCellEl = (r, c) => $(`#st-grid .st-cell[data-r="${r}"][data-c="${c}"]`);

function stRefresh() {
  $$("#st-grid .st-cell").forEach((el) => {
    const key = stKey(el.dataset.r, el.dataset.c);
    el.classList.toggle("solved-theme", stSolvedCells[key] === "theme");
    el.classList.toggle("solved-span", stSolvedCells[key] === "span");
    el.classList.toggle("sel", stPath.some(([r, c]) => stKey(r, c) === key));
    el.classList.toggle("hinted", stHintedCells.has(key));
  });
  $("#st-current").textContent = stPath.map(([r, c]) => stPuzzle.grid[r][c]).join("");
  $("#st-progress").textContent = interp(t("strands", "messages.progress"), { "stFound.size": stFound.size, "stPuzzle.words.length": stPuzzle.words.length });
  const need = stModeCfg().non_theme_words_per_hint;
  $("#st-hint-progress").textContent = interp(t("strands", "messages.hint_progress"), { "stNonTheme.size % need": stNonTheme.size % need, need });
  const avail = stHintsAvailable();
  $("#st-hint-btn").textContent = interp(t("strands", "messages.hint_count"), { avail });
  $("#st-hint-btn").disabled = stOver || avail <= 0;
  stDrawLines();
}

// connector lines: permanent colored paths for solved words + the active trace
function stDrawLines() {
  const svg = $("#st-svg");
  const board = $("#st-board");
  svg.setAttribute("viewBox", `0 0 ${board.offsetWidth} ${board.offsetHeight}`);
  svg.innerHTML = "";
  const center = (r, c) => {
    const el = stCellEl(r, c);
    return `${el.offsetLeft + el.offsetWidth / 2},${el.offsetTop + el.offsetHeight / 2}`;
  };
  const addLine = (path, cls) => {
    if (path.length < 2) return;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    line.setAttribute("points", path.map(([r, c]) => center(r, c)).join(" "));
    line.setAttribute("class", `st-line ${cls}`);
    svg.appendChild(line);
  };
  stPuzzle.words.forEach((w) => {
    if (stFound.has(w.word)) addLine(w.path, w.is_spangram ? "span" : "theme");
  });
  addLine(stPath, "active");
}

window.addEventListener("resize", () => {
  if (stPuzzle && !$("#st-play").classList.contains("hidden")) stDrawLines();
});

// -------- selection: drag across adjacent letters (works with touch via pointer events) --------
function stCellFromEvent(e) {
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const cell = el && el.closest ? el.closest("#st-grid .st-cell") : null;
  if (!cell) return null;
  return [Number(cell.dataset.r), Number(cell.dataset.c)];
}

const stAdjacent = (a, b) =>
  Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])) === 1;
const stInPath = ([r, c]) => stPath.findIndex(([pr, pc]) => pr === r && pc === c);

// extend the active trace onto an adjacent cell. Solved cells ARE allowed
// (their letters can be reused to form new words for hint credit).
function stTryExtend(cell) {
  const idx = stInPath(cell);
  if (idx >= 0) {
    // sliding back onto the second-to-last letter undoes the last step
    if (idx === stPath.length - 2) stPath.pop();
    return;
  }
  if (!stPath.length || stAdjacent(stPath[stPath.length - 1], cell)) stPath.push(cell);
}

// pure drag interaction: press to start a fresh trace, drag over adjacent
// letters, release to evaluate. Nothing stays selected after release.
$("#st-board").addEventListener("pointerdown", (e) => {
  if (stOver) return;
  const cell = stCellFromEvent(e);
  if (!cell) return;
  e.preventDefault();
  stDragging = true;
  stPath = [cell]; // always start a brand-new trace here
  stRefresh();
});

document.addEventListener("pointermove", (e) => {
  if (!stDragging || stOver) return;
  const cell = stCellFromEvent(e);
  if (!cell) return;
  const before = stPath.length;
  stTryExtend(cell);
  if (stPath.length !== before) stRefresh();
});

document.addEventListener("pointerup", () => {
  if (!stDragging || stOver) return;
  stDragging = false;
  const traced = [...stPath];
  stPath = [];
  if (traced.length > 1) stSubmit(traced);
  else stRefresh(); // single tap or empty: just clear the trace
});

$("#st-clear-btn").addEventListener("click", () => {
  stPath = [];
  $("#st-message").textContent = "";
  stRefresh();
});

// -------- submit a traced word --------
const stSamePath = (a, b) =>
  a.length === b.length && a.every(([r, c], i) => r === b[i][0] && c === b[i][1]);
// does a traced path match a word's stored path, in either direction?
const stMatchesPath = (path, wordPath) =>
  stSamePath(wordPath, path) || stSamePath(wordPath, [...path].reverse());

function stSubmit(traced) {
  const path = traced || stPath;
  stPath = [];
  if (!path || path.length < 2 || stOver) {
    stRefresh();
    return;
  }
  // normalized text of the traced path (grid letters, case/space-safe)
  const word = path.map(([r, c]) => stPuzzle.grid[r][c]).join("").trim().toUpperCase();

  // 0) exact path of an ALREADY-FOUND word → ignore silently (no re-credit)
  if (stPuzzle.words.some((w) => stFound.has(w.word) && stMatchesPath(path, w.path))) {
    stRefresh();
    return;
  }

  // a) exact path match (in either direction) against the unsolved theme words
  const match = stPuzzle.words.find((w) => !stFound.has(w.word) && stMatchesPath(path, w.path));
  if (match) {
    stFound.add(match.word);
    stEverFound.add(match.word); // genuinely traced by the player
    match.path.forEach(([r, c]) => (stSolvedCells[stKey(r, c)] = match.is_spangram ? "span" : "theme"));
    if (stHintedWord && stHintedWord.word === match.word) {
      stHintedWord = null;
      stHintedCells = new Set(); // the hinted word is solved — clear its lit letters
    }
    // spangram gets its own dedicated cue; every other theme word plays one of
    // two interchangeable cues at random, purely for variety
    SFX.play(match.is_spangram ? "victory" : (Math.random() < 0.5 ? "hint" : "strand_word"));
    if (match.is_spangram) {
      const flash = $("#st-flash");
      flash.textContent = t("strands", "messages.spangram_flash");
      flash.classList.remove("hidden");
      setTimeout(() => flash.classList.add("hidden"), 1200);
    } else {
      $("#st-message").textContent = interp(t("strands", "messages.word_found"), { "match.word": match.word });
    }
    stRefresh();
    if (stFound.size === stPuzzle.words.length) {
      stEndedWithSpangram = match.is_spangram; // victory.mp3 is still playing if so
      setTimeout(() => stFinish(true), 900);
    }
    return;
  }

  // b) any real dictionary word that isn't the puzzle's theme: never costs a life,
  // even in hardcore. 4+ letters also earns hint credit (same threshold both modes).
  if (ST_DICTIONARY.has(word)) {
    if (word.length >= stRules().min_word_length_for_hint_credit) {
      if (stNonTheme.has(word)) {
        $("#st-message").textContent = interp(t("strands", "messages.already_found"), { word });
      } else {
        // third state, distinct from theme words (random hint/strand_word)
        // and the spangram (victory): a newly-credited extra word
        SFX.play("correct");
        stNonTheme.add(word);
        $("#st-message").textContent = interp(t("strands", "messages.nice_find"), { word });
        path.forEach(([r, c]) => {
          const el = stCellEl(r, c);
          el.classList.add("pulse");
          setTimeout(() => el.classList.remove("pulse"), 500);
        });
      }
    } else {
      $("#st-message").textContent = "";
    }
    stRefresh();
    return;
  }

  // c) invalid: not a real word at all — brief red shake.
  // Hardcore only: this costs a life (a real off-theme word above never does).
  SFX.play("wrong");
  path.forEach(([r, c]) => {
    const el = stCellEl(r, c);
    el.classList.add("bad");
    setTimeout(() => el.classList.remove("bad"), 450);
  });
  if (stModeCfg().lose_life_on_invalid_word) {
    stLives--;
    stRenderLives();
    if (stLives <= 0) {
      $("#st-message").textContent = t("strands", "messages.out_of_lives");
      stRefresh();
      setTimeout(stLoseAllLives, 500);
      return;
    }
    $("#st-message").textContent = interp(t("strands", "messages.not_a_word"), {
      stLives,
      'stLives === 1 ? "life" : "lives"': stLives === 1 ? "life" : "lives",
      'stLives === 1 ? "vida" : "vidas"': stLives === 1 ? "vida" : "vidas",
    });
  } else {
    $("#st-message").textContent = "";
  }
  stRefresh();
}

// -------- HINT: lights up the first ceil(len/2) letters of a pending theme word,
// one at a time (grow-then-settle wave) so the order reads without numbers --------
$("#st-hint-btn").addEventListener("click", () => {
  if (stOver || stHintsAvailable() <= 0) return;
  const pending = stPuzzle.words.filter((w) => !stFound.has(w.word) && (!stHintedWord || stHintedWord.word !== w.word));
  if (!pending.length) return;
  stHintsUsed++;
  stHintedWord = randomItem(pending);

  const count = stHintRevealCount(stHintedWord.word); // 3 for ≤6, 4 for 7-8, 5 for 9...
  const cells = stHintedWord.path.slice(0, count); // ALWAYS the first N letters, in real order
  stHintedCells = new Set(); // reset; the wave fills it in sequence
  $("#st-message").textContent = interp(t("strands", "messages.hint_reveal"), { count });
  $("#st-hint-btn").disabled = true; // locked during the wave
  stRefresh();

  // step between letters shrinks as the word gets longer, keeping the whole wave ~1.2–2s
  const stepMs = count <= 3 ? 400 : count === 4 ? 360 : 320;
  cells.forEach(([r, c], i) => {
    setTimeout(() => {
      const key = stKey(r, c);
      stHintedCells.add(key); // stays lit permanently from here on
      SFX.play("letter_correct");
      const el = stCellEl(r, c);
      if (!el) return;
      el.classList.add("hinted", "hint-pop"); // grows
      setTimeout(() => el.classList.remove("hint-pop"), 220); // settles back to normal
      if (i === cells.length - 1) setTimeout(stRefresh, 260); // re-sync hint button after the wave
    }, i * stepMs);
  });
});

// shared progressive reveal used by both GIVE UP and running out of hardcore lives
function stRevealRemaining(onDone) {
  stOver = true;
  stPath = [];
  const remaining = stPuzzle.words.filter((w) => !stFound.has(w.word));
  let i = 0;
  stRevealTimer = setInterval(() => {
    if (i >= remaining.length) {
      stStopReveal();
      setTimeout(onDone, 700);
      return;
    }
    const w = remaining[i++];
    stFound.add(w.word);
    w.path.forEach(([r, c]) => (stSolvedCells[stKey(r, c)] = w.is_spangram ? "span" : "theme"));
    stRefresh();
  }, 800);
  stRefresh();
}

// -------- GIVE UP: progressive reveal, one word at a time --------
$("#st-giveup-btn").addEventListener("click", () => {
  if (stOver) return;
  if (!confirm("Are you sure? This will end the game.")) return;
  const foundBefore = stFound.size;
  stRevealRemaining(() => stFinish(false, foundBefore));
});

// -------- HARDCORE: ran out of lives — same progressive reveal, different ending --------
function stLoseAllLives() {
  if (stOver) return;
  const foundBefore = stFound.size;
  stRevealRemaining(() => stFinish(false, foundBefore, true));
}

function stFinish(won, foundBefore, outOfLives) {
  stOver = true;
  // hints are a core mechanic here, paid for with extra words, so a hinted win
  // still counts — Strands is the one exemption from the no-hint rule
  Progress.record({ game: "strands", mode: stMode, won });
  // suppressed only when the spangram closed the puzzle — victory.mp3 is still
  // ringing from 900ms ago and the two would stack
  if (!stEndedWithSpangram) SFX.play("success");
  $("#st-end-title").textContent = won
    ? t("strands", "messages.end_title_won")
    : outOfLives
    ? t("strands", "messages.end_title_lives")
    : t("strands", "messages.end_title_gaveup");
  $("#st-end-detail").textContent = won
    ? interp(t("strands", "messages.end_detail_won"), { "stPuzzle.words.length": stPuzzle.words.length, stHintsUsed, "stNonTheme.size": stNonTheme.size })
    : outOfLives
    ? interp(t("strands", "messages.end_detail_lives"), { foundBefore, "stPuzzle.words.length": stPuzzle.words.length })
    : interp(t("strands", "messages.end_detail_gaveup"), { foundBefore, "stPuzzle.words.length": stPuzzle.words.length });

  // list all 8 words: found vs missed, spangram highlighted (order: spangram first).
  // Words the player actually FOUND are buttons: tapping one shows its meaning in
  // the shared panel below the list (the chips wrap in a row, so a per-chip
  // accordion would break the layout — one shared panel keeps it compact).
  // Meanings come from lookupDefinition, so they render in the language chosen
  // on the loading screen. Missed words stay plain text — nothing to reward.
  const list = $("#st-wordlist");
  const meaningPanel = $("#st-word-meaning");
  list.innerHTML = "";
  meaningPanel.classList.remove("visible");
  meaningPanel.innerHTML = "";

  const ordered = [...stPuzzle.words].sort((a, b) => (b.is_spangram ? 1 : 0) - (a.is_spangram ? 1 : 0));
  let anyFound = false;

  const showWordMeaning = (word, chip) => {
    list.querySelectorAll(".st-word-btn.active").forEach((b) => b.classList.remove("active"));
    chip.classList.add("active");
    meaningPanel.innerHTML = "";
    const wEl = document.createElement("span");
    wEl.className = "st-meaning-word";
    wEl.textContent = word;
    const dEl = document.createElement("p");
    dEl.className = "st-meaning-def";
    dEl.textContent = lookupDefinition(word) || t("strands", "messages.meaning_unavailable");
    meaningPanel.appendChild(wEl);
    meaningPanel.appendChild(dEl);
    meaningPanel.classList.add("visible");
  };

  ordered.forEach((w) => {
    const li = document.createElement("li");
    const foundIt = stEverFound.has(w.word); // found by the player, not by the give-up reveal
    li.className = (w.is_spangram ? "span " : "") + (foundIt ? "found" : "missed");

    // the chip itself: a real <button> when found (keyboard + screen-reader
    // reachable), a plain <span> when missed.
    const chip = document.createElement(foundIt ? "button" : "span");
    chip.className = "st-word-chip" + (foundIt ? " st-word-btn" : "");
    chip.textContent = `${foundIt ? "✓ " : ""}${w.word}`;
    if (w.is_spangram) {
      const tag = document.createElement("span");
      tag.className = "span-tag";
      tag.textContent = "SPANGRAM";
      chip.appendChild(tag);
    }
    if (foundIt) {
      anyFound = true;
      chip.type = "button";
      chip.title = t("strands", "messages.tap_for_meaning");
      chip.addEventListener("click", () => showWordMeaning(w.word, chip));
    }

    li.appendChild(chip);
    list.appendChild(li);
  });

  // affordance hint — only worth showing if there is something to tap
  const hint = $("#st-wordlist-hint");
  hint.textContent = anyFound ? t("strands", "messages.tap_for_meaning") : "";
  hint.classList.toggle("hidden", !anyFound);

  $("#st-end").classList.remove("hidden"); // overlay on top of the (revealed) board
}

// PLAY AGAIN: new puzzle, same mode
$("#st-again-btn").addEventListener("click", () => startStrands(stMode));


/* =====================================================
   GAME 12 — EMOJI MATCH
   3 emojis, 4 word options, pick the one they describe.
   8 rounds. No timer, no lives — the player thinks freely.
   A wrong pick marks it red AND reveals the correct one in
   green, then advances. +1 per correct answer, max 8.
   Data: EMOJIMATCH_DATA (emojimatch_data.js).
   ===================================================== */
const EM_STORAGE_KEY = "emojimatch_last_words";
const EM_FEEDBACK_MS = 1100; // pause on the revealed answer before advancing

let emRounds = []; // the 8 rounds of this game, options already re-shuffled
let emIndex = 0;
let emScore = 0;
let emAnswered = false; // double-click guard for the current round
let emTimeoutId = null;

// difficulty: the radio values are Spanish, the bank keys are English, so we
// reuse WL_LEVEL_KEYS like Word Links / Waffle / Real Word already do.
let emLevelRaw = null; // "basico" | "intermedio" | "avanzado"
let emLevel = null; // "basic" | "intermediate" | "advanced"

const emRules = () => EMOJIMATCH_DATA.rules;

function emStopTimer() {
  if (emTimeoutId) {
    clearTimeout(emTimeoutId);
    emTimeoutId = null;
  }
}

// same idea as rwPick, but the pool holds round OBJECTS, so "already seen" is
// matched on the round's answer word. Falls back to the whole pool if the
// level is too small to fill a game without repeats.
function emPick(pool, count, exclude) {
  let candidates = pool.filter((r) => !exclude.includes(r.answer));
  if (candidates.length < count) candidates = pool;
  return shuffle(candidates).slice(0, count);
}

function startEmojiMatch(level) {
  emStopTimer();
  emLevelRaw = level || "basico";
  emLevel = WL_LEVEL_KEYS[emLevelRaw] || emLevelRaw;

  let lastWords = [];
  try {
    lastWords = JSON.parse(localStorage.getItem(EM_STORAGE_KEY)) || [];
  } catch (err) { /* corrupted storage — ignore */ }

  const pool = EMOJIMATCH_DATA.rounds[emLevel] || EMOJIMATCH_DATA.rounds.basic;
  // re-shuffle each round's options: the JSON ships them shuffled, but a fixed
  // order would let a repeat player memorise the correct SLOT instead of the word
  emRounds = emPick(pool, emRules().rounds_per_game, lastWords).map((r) => ({
    ...r,
    options: shuffle([...r.options]),
  }));

  emIndex = 0;
  emScore = 0;

  $("#em-meta").textContent = interp(t("emojimatch", "labels.meta"), {
    "LEVEL_LABELS[level]": ts("level_labels." + emLevelRaw),
    "emRules().rounds_per_game": emRules().rounds_per_game,
  });
  $("#em-end").classList.add("hidden");
  $("#em-play").classList.remove("hidden");
  applyText([
    ["#screen-emojimatch .game-topline [data-back]", ts("buttons.back")],
    ["#em-again-btn", t("emojimatch", "buttons.play_again")],
    ["#em-end [data-back]", t("emojimatch", "buttons.back_to_menu")],
  ]);
  const scoreLabel = $("#em-end .end-word");
  if (scoreLabel) scoreLabel.firstChild.textContent = t("emojimatch", "messages.score_label");

  showScreen("#screen-emojimatch");
  emLoadRound();
}

function emLoadRound() {
  const round = emRounds[emIndex];
  emAnswered = false;

  $("#em-progress").textContent = interp(t("emojimatch", "messages.progress"), {
    "emIndex + 1": emIndex + 1,
    "emRounds.length": emRounds.length,
  });

  // the 3 emojis
  const emojiBox = $("#em-emojis");
  emojiBox.innerHTML = "";
  round.emojis.forEach((e) => {
    const span = document.createElement("span");
    span.className = "em-emoji";
    span.textContent = e;
    emojiBox.appendChild(span);
  });

  // the 4 options
  const box = $("#em-options");
  box.innerHTML = "";
  round.options.forEach((word) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "em-option";
    btn.textContent = word;
    btn.dataset.word = word;
    btn.addEventListener("click", () => emAnswer(word));
    box.appendChild(btn);
  });
}

function emAnswer(picked) {
  if (emAnswered) return; // ignore double clicks while the answer is revealed
  emAnswered = true;

  const round = emRounds[emIndex];
  const correct = picked === round.answer;
  SFX.play(correct ? "correct" : "wrong");
  round.gotIt = correct; // remembered for the end screen's ✓ / ✗ chips
  if (correct) emScore += EMOJIMATCH_DATA.scoring.points_per_correct;

  // lock every option, then paint: the picked one red if wrong, and ALWAYS the
  // correct one green — so a wrong guess still teaches the right answer
  $$("#em-options .em-option").forEach((btn) => {
    btn.disabled = true;
    if (btn.dataset.word === round.answer) btn.classList.add("correct");
    else if (btn.dataset.word === picked) btn.classList.add("wrong");
  });

  emTimeoutId = setTimeout(() => {
    emIndex++;
    if (emIndex >= emRounds.length) emFinish();
    else emLoadRound();
  }, EM_FEEDBACK_MS);
}

function emFinish() {
  emStopTimer();
  Progress.record({ game: "emojimatch", level: emLevelRaw, score: emScore, maxScore: EMOJIMATCH_DATA.scoring.max_per_game });
  SFX.play("success"); // end-of-game cue; the last answer's correct/wrong fired EM_FEEDBACK_MS ago
  $("#em-play").classList.add("hidden");

  $("#em-end-title").textContent = t("emojimatch", "messages.game_complete_title");
  $("#em-score").textContent = `${emScore} / ${EMOJIMATCH_DATA.scoring.max_per_game}`;

  // remember this game's answers so the next one doesn't repeat them
  try {
    localStorage.setItem(EM_STORAGE_KEY, JSON.stringify(emRounds.map((r) => r.answer)));
  } catch (err) { /* storage full or blocked — not worth failing the game over */ }

  // the 8 words, tappable to reveal their meaning in the chosen language.
  // Same shared-panel pattern as Strands (chips wrap in a row, so one shared
  // panel below keeps the layout compact instead of a per-chip accordion).
  const list = $("#em-wordlist");
  const meaningPanel = $("#em-word-meaning");
  list.innerHTML = "";
  meaningPanel.classList.remove("visible");
  meaningPanel.innerHTML = "";

  const showWordMeaning = (word, chip) => {
    list.querySelectorAll(".st-word-btn.active").forEach((b) => b.classList.remove("active"));
    chip.classList.add("active");
    meaningPanel.innerHTML = "";
    const wEl = document.createElement("span");
    wEl.className = "st-meaning-word";
    wEl.textContent = word;
    const dEl = document.createElement("p");
    dEl.className = "st-meaning-def";
    dEl.textContent = lookupDefinition(word) || t("emojimatch", "messages.meaning_unavailable");
    meaningPanel.appendChild(wEl);
    meaningPanel.appendChild(dEl);
    meaningPanel.classList.add("visible");
  };

  emRounds.forEach((r) => {
    const li = document.createElement("li");
    // every word is tappable regardless — a word you got WRONG is the one whose
    // meaning you most need, so "missed" only tints it, it never disables it
    li.className = r.gotIt ? "found" : "missed";
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "st-word-chip st-word-btn";
    chip.textContent = `${r.gotIt ? "✓ " : "✗ "}${r.answer}`;
    chip.title = t("emojimatch", "messages.tap_for_meaning");
    chip.addEventListener("click", () => showWordMeaning(r.answer, chip));
    li.appendChild(chip);
    list.appendChild(li);
  });

  const hint = $("#em-wordlist-hint");
  hint.textContent = t("emojimatch", "messages.tap_for_meaning");
  hint.classList.remove("hidden");

  $("#em-end").classList.remove("hidden");
}

// PLAY AGAIN: new rounds, same difficulty
$("#em-again-btn").addEventListener("click", () => startEmojiMatch(emLevelRaw));

// Card art that fails to load (e.g. an image not uploaded yet) would render the
// browser's broken-image icon + alt text inside the preview box. Hiding the img
// leaves the card's own purple gradient, which looks intentional.
// Uses its own class, not the shared .hidden: .hidden and .card-art-img have
// equal specificity and .card-art-img's display:block comes later, so .hidden
// would lose and the broken image would stay visible.
$$(".card-art-img").forEach((img) => {
  img.addEventListener("error", () => img.classList.add("card-art-img-failed"));
  // an image that already failed before this listener attached (cached 404)
  if (img.complete && img.naturalWidth === 0) img.classList.add("card-art-img-failed");
});

/* =====================================================
   GAME 13 — HEAR IT
   The browser pronounces an English word; the player answers.
   Three DIFFERENT mechanics, one per level (rules.by_level):
     basic         4 options, unlimited replays, no timer.
                   One option is always a MINIMAL PAIR of the answer,
                   so a wrong pick teaches a real sound contrast.
     intermediate  type the word, 3 replays, letter count shown.
     advanced      type the word, 1 replay, 10s, letter count shown.
   Data: HEARIT_DATA (hearit_data.js).
   ===================================================== */
const HI_STORAGE_KEY = "hearit_last_words";
const HI_FEEDBACK_MS = 1400; // pause on the revealed answer before advancing

/* ---------- AUDIO: the only place that touches speechSynthesis ----------
   Everything else in the game calls playWord(). To move to MP3 files later,
   replace the body of playWord() with `new Audio(...)` and nothing else in
   this file needs to change. */
let hearitVoice = null;
let hiVoicesReady = false; // getVoices() has returned a non-empty list at least once

function hiPickVoice() {
  const all = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
  if (!all.length) return false; // Chrome returns [] until voiceschanged fires
  // prefer the exact lang from the data file, but ANY English voice works —
  // plenty of Android devices ship only en-GB or en-IN, and refusing those
  // would kill the game for no reason
  // hiInitVoices() runs at load to warm up Chrome's async getVoices(), but
  // hearit_data.js only arrives when the game is picked — so read the bank
  // defensively. The fallback is the same "en-US" the bank specifies, and
  // hiEnsureVoice() re-runs this once the game (and the bank) are live.
  const want = (
    (typeof HEARIT_DATA !== "undefined" && HEARIT_DATA.audio && HEARIT_DATA.audio.lang) || "en-US"
  ).toLowerCase();
  hearitVoice =
    all.find((v) => v.lang.toLowerCase() === want) ||
    all.find((v) => v.lang.toLowerCase().replace("_", "-").startsWith("en")) ||
    null;
  hiVoicesReady = true;
  return true;
}

function hiInitVoices() {
  if (!window.speechSynthesis) return;
  if (!hiPickVoice()) {
    speechSynthesis.addEventListener("voiceschanged", hiPickVoice, { once: true });
  }
}
hiInitVoices();

// Resolves once the voice list is known, or after a short grace period. Only
// AFTER this is "no English voice" a trustworthy answer — checking earlier
// would show the error screen on a device that simply had not loaded yet.
function hiWhenVoicesReady(cb) {
  if (hiVoicesReady || hiPickVoice()) return cb();
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    hiPickVoice();
    cb();
  };
  if (window.speechSynthesis) {
    speechSynthesis.addEventListener("voiceschanged", finish, { once: true });
  }
  setTimeout(finish, 2000); // do not hang forever on a browser that never fires it
}

const hiHasVoice = () => !!(window.speechSynthesis && hearitVoice);

// >>> THE TWO AUDIO ENTRY POINTS — playWord + stopWord <<<
// Nothing else in the game touches speechSynthesis for playback. Swapping in
// MP3 files means rewriting only these two bodies.

// stop whatever is currently sounding (round change, answer, leaving the game)
function stopWord() {
  if (window.speechSynthesis) speechSynthesis.cancel();
}

function playWord(word) {
  if (!window.speechSynthesis) return;
  stopWord(); // never let two words overlap
  const u = new SpeechSynthesisUtterance(String(word).toLowerCase());
  u.lang = HEARIT_DATA.audio.lang;
  u.rate = HEARIT_DATA.audio.rate;
  // the voice is an optimisation, not a requirement — u.lang alone already asks
  // for English. A stale voice object (the list can be rebuilt underneath us)
  // throws on assignment, and losing the audio entirely over that would be far
  // worse than falling back to the browser's default English voice.
  try {
    if (hearitVoice) u.voice = hearitVoice;
  } catch (err) {
    hearitVoice = null;
  }
  speechSynthesis.speak(u);
}

/* ---------- game state ---------- */
let hiRounds = [];
let hiIndex = 0;
let hiScore = 0;
let hiAnswered = false;
let hiReplaysLeft = 0;
let hiTimerId = null;
let hiFeedbackId = null;
let hiDeadline = 0;
let hiTimerStarted = false; // advanced: the clock starts on the FIRST play, not on load
let hiLevelRaw = null;
let hiLevel = null;

const hiCfg = () => HEARIT_DATA.rules.by_level[hiLevel] || HEARIT_DATA.rules.by_level.basic;
const hiIsTyping = () => hiCfg().mode === "type_the_word";

function hiStopTimers() {
  if (hiTimerId) { clearInterval(hiTimerId); hiTimerId = null; }
  if (hiFeedbackId) { clearTimeout(hiFeedbackId); hiFeedbackId = null; }
}

// same idea as rwPick/emPick — the pool holds round objects, so "already seen"
// is matched on the answer word
function hiPick(pool, count, exclude) {
  let candidates = pool.filter((r) => !exclude.includes(r.answer));
  if (candidates.length < count) candidates = pool;
  return shuffle(candidates).slice(0, count);
}

function startHearIt(level) {
  hiStopTimers();
  stopWord();
  hiLevelRaw = level || "basico";
  hiLevel = WL_LEVEL_KEYS[hiLevelRaw] || hiLevelRaw;

  let lastWords = [];
  try {
    lastWords = JSON.parse(localStorage.getItem(HI_STORAGE_KEY)) || [];
  } catch (err) { /* corrupted storage — ignore */ }

  const pool = HEARIT_DATA.rounds[hiLevel] || HEARIT_DATA.rounds.basic;
  hiRounds = hiPick(pool, HEARIT_DATA.rules.rounds_per_game, lastWords).map((r) => ({
    ...r,
    // basic ships the options pre-shuffled, but re-shuffle so a repeat player
    // cannot learn the correct SLOT instead of the sound
    options: r.options ? shuffle([...r.options]) : null,
  }));

  hiIndex = 0;
  hiScore = 0;

  $("#hi-meta").textContent = interp(t("hearit", "labels.meta"), {
    "LEVEL_LABELS[level]": ts("level_labels." + hiLevelRaw),
    "HEARIT_DATA.rules.rounds_per_game": HEARIT_DATA.rules.rounds_per_game,
  });
  $("#hi-end").classList.add("hidden");
  $("#hi-play").classList.remove("hidden");
  $("#hi-novoice-note").classList.add("hidden"); // never shown before voice detection resolves
  applyText([
    ["#screen-hearit .game-topline [data-back]", ts("buttons.back")],
    ["#hi-submit", t("hearit", "buttons.check")],
    ["#hi-again-btn", t("hearit", "buttons.play_again")],
    ["#hi-end [data-back]", t("hearit", "buttons.back_to_menu")],
  ]);
  $("#hi-input").placeholder = t("hearit", "static_labels.input_placeholder");
  const scoreLabel = $("#hi-end .end-word");
  if (scoreLabel) scoreLabel.firstChild.textContent = t("hearit", "messages.score_label");

  showScreen("#screen-hearit");

  // the game is always playable — playWord() falls back to the browser's
  // default voice for the language even with no exact voice match. This note
  // is purely informational, shown only once voice detection is conclusive.
  hiWhenVoicesReady(() => {
    if (!hiHasVoice()) {
      $("#hi-novoice-note").textContent = t("hearit", "messages.no_voice");
      $("#hi-novoice-note").classList.remove("hidden");
    }
    hiLoadRound();
  });
}

function hiLoadRound() {
  hiStopTimers();
  const round = hiRounds[hiIndex];
  const cfg = hiCfg();
  hiAnswered = false;
  hiTimerStarted = false;
  hiReplaysLeft = cfg.replays === "unlimited" ? Infinity : cfg.replays;

  $("#hi-progress").textContent = interp(t("hearit", "messages.progress"), {
    "hiIndex + 1": hiIndex + 1,
    "hiRounds.length": hiRounds.length,
  });
  $("#hi-feedback").textContent = "";
  $("#hi-feedback").className = "hi-feedback";

  // play button back to its ready state
  const playBtn = $("#hi-play-btn");
  playBtn.disabled = false;
  playBtn.classList.remove("spent");
  hiRenderReplays();

  // letter count (typing levels only)
  const lettersEl = $("#hi-letters");
  if (cfg.show_letter_count) {
    lettersEl.textContent = interp(t("hearit", "messages.letter_count"), {
      "round.letters": round.letters,
    });
    lettersEl.classList.remove("hidden");
  } else {
    lettersEl.classList.add("hidden");
  }

  // timer bar: only advanced has one, and it stays idle until the first play
  const timer = $("#hi-timer");
  if (cfg.timer_seconds) {
    timer.classList.remove("hidden");
    $("#hi-timer-fill").style.width = "100%";
  } else {
    timer.classList.add("hidden");
  }

  if (hiIsTyping()) {
    $("#hi-options").classList.add("hidden");
    $("#hi-options").innerHTML = "";
    $("#hi-input-wrap").classList.remove("hidden");
    const input = $("#hi-input");
    input.value = "";
    input.disabled = false;
    $("#hi-submit").disabled = false;
  } else {
    $("#hi-input-wrap").classList.add("hidden");
    const box = $("#hi-options");
    box.classList.remove("hidden");
    box.innerHTML = "";
    round.options.forEach((word) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hi-option";
      btn.textContent = word;
      btn.dataset.word = word;
      btn.addEventListener("click", () => hiAnswer(word));
      box.appendChild(btn);
    });
  }
}

function hiRenderReplays() {
  const el = $("#hi-replays");
  if (hiReplaysLeft === Infinity) {
    el.textContent = t("hearit", "messages.replays_unlimited");
    return;
  }
  el.textContent = interp(t("hearit", "messages.replays_left"), { hiReplaysLeft });
}

// the play button is the ONLY thing that starts audio — never automatic. That
// is what mobile needs (speechSynthesis requires a real user gesture) and it
// also means the advanced countdown cannot burn seconds before the player has
// heard anything.
$("#hi-play-btn").addEventListener("click", () => {
  if (hiAnswered || hiReplaysLeft <= 0) return;
  playWord(hiRounds[hiIndex].answer);

  if (hiReplaysLeft !== Infinity) {
    hiReplaysLeft--;
    hiRenderReplays();
    if (hiReplaysLeft <= 0) {
      const btn = $("#hi-play-btn");
      btn.disabled = true;
      btn.classList.add("spent"); // visibly out of listens, not just inert
    }
  }

  const secs = hiCfg().timer_seconds;
  if (secs && !hiTimerStarted) {
    hiTimerStarted = true;
    hiDeadline = Date.now() + secs * 1000;
    hiTimerId = setInterval(hiTick, 100);
  }
});

function hiTick() {
  const total = hiCfg().timer_seconds * 1000;
  const left = Math.max(0, hiDeadline - Date.now());
  $("#hi-timer-fill").style.width = `${(left / total) * 100}%`;
  if (left <= 0) {
    hiStopTimers();
    hiAnswer(null, true); // ran out of time
  }
}

$("#hi-submit").addEventListener("click", () => hiAnswer($("#hi-input").value));
$("#hi-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") hiAnswer($("#hi-input").value);
});

function hiAnswer(given, timedOut) {
  if (hiAnswered) return;
  hiAnswered = true;
  hiStopTimers();
  stopWord();

  const round = hiRounds[hiIndex];
  // answer_checking: case-insensitive + trimmed (homophones are excluded from
  // the typing levels, so each audio has exactly one correct spelling)
  const norm = (s) => String(s == null ? "" : s).trim().toLowerCase();
  const correct = !timedOut && norm(given) === norm(round.answer);
  // one cue covers all three outcomes: right, wrong, and advanced's timeout
  // (timedOut forces correct=false, so it lands on wrong.mp3 like any miss)
  SFX.play(correct ? "correct" : "wrong");
  round.gotIt = correct;
  round.given = timedOut ? null : given;
  if (correct) hiScore += HEARIT_DATA.rules.scoring.points_per_correct;

  const fb = $("#hi-feedback");
  fb.className = "hi-feedback " + (correct ? "ok" : "bad");
  fb.textContent = correct
    ? t("hearit", "messages.correct")
    : interp(
        timedOut ? t("hearit", "messages.timeout") : t("hearit", "messages.wrong"),
        { "round.answer": round.answer }
      );

  $("#hi-play-btn").disabled = true;
  if (hiIsTyping()) {
    $("#hi-input").disabled = true;
    $("#hi-submit").disabled = true;
  } else {
    // lock the options and reveal: the correct one always turns green
    $$("#hi-options .hi-option").forEach((btn) => {
      btn.disabled = true;
      if (btn.dataset.word === round.answer) btn.classList.add("correct");
      else if (btn.dataset.word === given) btn.classList.add("wrong");
    });
  }

  hiFeedbackId = setTimeout(() => {
    hiIndex++;
    if (hiIndex >= hiRounds.length) hiFinish();
    else hiLoadRound();
  }, HI_FEEDBACK_MS);
}

function hiFinish() {
  hiStopTimers();
  stopWord();
  // basic must be perfect; the typing levels pass with one miss. The store owns
  // that split, so it needs the raw level to tell them apart.
  Progress.record({ game: "hearit", level: hiLevelRaw, score: hiScore, maxScore: HEARIT_DATA.rules.scoring.max_per_game });
  SFX.play("success"); // end-of-game cue; the last answer's correct/wrong fired HI_FEEDBACK_MS ago
  $("#hi-play").classList.add("hidden");

  $("#hi-end-title").textContent = t("hearit", "messages.game_complete_title");
  $("#hi-score").textContent = `${hiScore} / ${HEARIT_DATA.rules.scoring.max_per_game}`;

  try {
    localStorage.setItem(HI_STORAGE_KEY, JSON.stringify(hiRounds.map((r) => r.answer)));
  } catch (err) { /* storage blocked — not worth failing the game over */ }

  const list = $("#hi-wordlist");
  const meaningPanel = $("#hi-word-meaning");
  list.innerHTML = "";
  meaningPanel.classList.remove("visible");
  meaningPanel.innerHTML = "";

  const showWordMeaning = (round, chip) => {
    list.querySelectorAll(".st-word-btn.active").forEach((b) => b.classList.remove("active"));
    chip.classList.add("active");
    meaningPanel.innerHTML = "";

    const wEl = document.createElement("span");
    wEl.className = "st-meaning-word";
    wEl.textContent = round.answer;
    const dEl = document.createElement("p");
    dEl.className = "st-meaning-def";
    dEl.textContent = lookupDefinition(round.answer) || t("hearit", "messages.meaning_unavailable");
    meaningPanel.appendChild(wEl);
    meaningPanel.appendChild(dEl);

    // THE teaching moment: the player got a minimal pair wrong, so tell them
    // exactly which sound contrast tricked them and why it is hard in Spanish
    if (!round.gotIt && round.minimal_pair && round.contrast) {
      // the explanation comes from ui_strings so it follows the chosen language.
      // The copy in the data file is Spanish-only, so using it directly would
      // print a Spanish sentence inside an otherwise English screen — it stays
      // as a last-resort fallback if a new contrast id ever lands in the data
      // before it has been translated.
      const why =
        t("hearit", "phonetic_contrasts." + round.contrast) ||
        HEARIT_DATA.phonetic_contrasts[round.contrast];
      if (why) {
        const cEl = document.createElement("p");
        cEl.className = "hi-contrast";
        cEl.textContent = interp(t("hearit", "messages.contrast_note"), {
          "round.answer": round.answer,
          "round.minimal_pair": round.minimal_pair,
          why,
        });
        meaningPanel.appendChild(cEl);
      }
    }

    // let them hear it again while reading the meaning
    const replay = document.createElement("button");
    replay.type = "button";
    replay.className = "hi-replay-btn";
    replay.textContent = t("hearit", "buttons.listen_again");
    replay.addEventListener("click", () => playWord(round.answer));
    meaningPanel.appendChild(replay);

    meaningPanel.classList.add("visible");
  };

  hiRounds.forEach((r) => {
    const li = document.createElement("li");
    li.className = r.gotIt ? "found" : "missed";
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "st-word-chip st-word-btn";
    chip.textContent = `${r.gotIt ? "✓ " : "✗ "}${r.answer}`;
    chip.title = t("hearit", "messages.tap_for_meaning");
    chip.addEventListener("click", () => showWordMeaning(r, chip));
    li.appendChild(chip);
    list.appendChild(li);
  });

  const hint = $("#hi-wordlist-hint");
  hint.textContent = t("hearit", "messages.tap_for_meaning");
  hint.classList.remove("hidden");

  $("#hi-end").classList.remove("hidden");
}

// PLAY AGAIN: new rounds, same difficulty
$("#hi-again-btn").addEventListener("click", () => startHearIt(hiLevelRaw));

// leaving the game must not keep the browser talking
$$("#screen-hearit [data-back]").forEach((btn) =>
  btn.addEventListener("click", () => {
    hiStopTimers();
    stopWord();
  })
);

/* =====================================================
   ACHIEVEMENTS — the UI over Progress.

   All state lives in progress.js; nothing here writes localStorage directly.
   The screen is rebuilt from the bank on every open, so it can never drift
   out of sync with what the player has actually earned.
   ===================================================== */
const ACH_TIER_IMG = {
  bronze: "assets/badges/Broncebadge.png",
  silver: "assets/badges/Platebadge.png",
  gold: "assets/badges/Goldbadge.png",
  platinum: "assets/badges/Platiniumbadge.png",
};

function achBank() {
  const b = typeof ACHIEVEMENTS !== "undefined" ? ACHIEVEMENTS : null;
  if (!b) return [];
  return Array.isArray(b) ? b : (Array.isArray(b.badges) ? b.badges : []);
}

// same trick as .card-art-img-failed: a badge PNG that 404s must not leave a
// broken-image glyph behind, on the card or in the grid
function achGuardImg(img, failedClass) {
  img.addEventListener("error", () => img.classList.add(failedClass));
  if (img.complete && img.naturalWidth === 0) img.classList.add(failedClass);
}

/* ---- the medal on each home card ---- */
function refreshCardMedals() {
  const on = Progress.badgesEnabled();
  $$(".game-card").forEach((card) => {
    const old = card.querySelector(".card-medal");
    if (old) old.remove();
    if (!on) return;
    const tier = Progress.highestClaimed(card.dataset.game);
    if (!tier || !ACH_TIER_IMG[tier]) return; // nothing claimed: card stays clean
    const img = document.createElement("img");
    img.className = "card-medal card-medal-" + tier;
    img.src = ACH_TIER_IMG[tier];
    img.loading = "lazy";
    img.alt = t("achievements", "badges." + card.dataset.game + ":" + tier + ".name") || tier;
    achGuardImg(img, "card-medal-failed");
    card.appendChild(img); // direct child: .card-art has overflow:hidden
  });
}

const achAnyClaimable = () => achBank().some((b) => Progress.isClaimable(b.id));

/* ---- header counter + red dot ---- */
function refreshBadgeChrome() {
  const on = Progress.badgesEnabled();
  const counter = $("#home-badge-counter");
  const total = achBank().length;
  const claimed = Progress.countClaimed();
  if (counter) {
    counter.classList.toggle("hidden", !on);
    const txt = $("#home-badge-counter-text");
    if (txt) txt.textContent = interp(t("achievements", "progress"), { claimed, total });
    counter.setAttribute("aria-label", interp(t("achievements", "progress_aria"), { claimed, total }));
  }
  const dot = $("#achievements-dot");
  if (dot) dot.classList.toggle("hidden", !achAnyClaimable());
  const btn = $("#achievements-btn");
  if (btn) btn.setAttribute("aria-label", t("achievements", "open"));
}

// one entry point, called on load and every time the player lands on home
function refreshBadgeUI() {
  refreshCardMedals();
  refreshBadgeChrome();
}

/* ---- the achievements screen ---- */
function renderAchievements() {
  const total = achBank().length;
  const claimed = Progress.countClaimed();
  applyText([
    ["#screen-achievements [data-back]", ts("buttons.back")],
    ["#ach-title", t("achievements", "title")],
    ["#ach-subtitle", t("achievements", "subtitle")],
    ["#ach-progress", interp(t("achievements", "progress"), { claimed, total })],
    ["#ach-toggle-label", t("achievements", "show_badges")],
  ]);
  const toggle = $("#ach-toggle-badges");
  if (toggle) toggle.checked = Progress.badgesEnabled();

  // group by game, keeping the bank's own order
  const order = [];
  const byGame = {};
  achBank().forEach((b) => {
    if (!byGame[b.game]) { byGame[b.game] = []; order.push(b.game); }
    byGame[b.game].push(b);
  });

  const host = $("#ach-groups");
  host.innerHTML = "";
  order.forEach((game) => {
    const group = document.createElement("div");
    group.className = "ach-group";

    const done = byGame[game].filter((b) => Progress.isClaimed(b.id)).length;
    const title = document.createElement("h3");
    title.className = "ach-group-title";
    title.innerHTML = "";
    title.append(t("achievements", "games." + game) || game);
    const count = document.createElement("span");
    count.className = "ach-group-count";
    count.textContent = done + "/" + byGame[game].length;
    title.appendChild(count);
    group.appendChild(title);

    const row = document.createElement("div");
    row.className = "ach-row";
    byGame[game].forEach((b) => row.appendChild(achBadgeTile(b)));
    group.appendChild(row);
    host.appendChild(group);
  });
}

function achBadgeTile(b) {
  const isClaimed = Progress.isClaimed(b.id);
  const isReady = Progress.isClaimable(b.id);
  // condition met, not claimed, but isClaimable() said no — the only way that
  // happens is the chain: the previous tier exists and is not claimed yet.
  // Without this the player can't tell "never played it" from "already beat
  // it, go claim the last one first", which is the whole point of the order rule.
  const isPending = !isClaimed && !isReady && Progress.isEarned(b.id);

  const tile = document.createElement("div");
  tile.className = "ach-badge " + (isClaimed ? "is-claimed" : isReady ? "is-ready" : isPending ? "is-pending" : "is-locked");

  const img = document.createElement("img");
  img.className = "ach-badge-img";
  img.src = ACH_TIER_IMG[b.tier] || "";
  img.loading = "lazy";
  img.alt = t("achievements", "badges." + b.id + ".name") || b.id;
  achGuardImg(img, "ach-badge-img-failed");
  tile.appendChild(img);

  const name = document.createElement("p");
  name.className = "ach-badge-name";
  name.textContent = t("achievements", "badges." + b.id + ".name") || b.id;
  tile.appendChild(name);

  const goal = document.createElement("p");
  goal.className = "ach-badge-goal";
  goal.textContent = t("achievements", "badges." + b.id + ".goal") || "";
  tile.appendChild(goal);

  // "0 / 1" on a single-play bronze is noise, not information — only shown
  // once there is a real count to track, and only while it is still open
  if (!isClaimed) {
    const prog = Progress.progressFor(b.id);
    if (prog.target > 1) {
      const progress = document.createElement("p");
      progress.className = "ach-badge-progress";
      progress.textContent = interp(t("achievements", "badge_progress"), { current: prog.current, target: prog.target });
      tile.appendChild(progress);
    }
  }

  if (isReady) {
    const btn = document.createElement("button");
    btn.className = "ach-claim-btn";
    btn.type = "button";
    btn.textContent = t("achievements", "claim");
    btn.addEventListener("click", () => {
      if (!Progress.claim(b.id)) return;
      SFX.play("victory");
      renderAchievements(); // a claim can unlock the next tier of the same chain
      refreshBadgeUI();
    });
    tile.appendChild(btn);
  } else {
    const state = document.createElement("p");
    state.className = "ach-badge-state";
    if (isPending) {
      const reqBadge = achBank().find((x) => x.id === b.requires);
      const tierName = reqBadge ? t("achievements", "tier_labels." + reqBadge.tier) : "";
      state.textContent = interp(t("achievements", "pending_locked"), { tier: tierName });
    } else {
      state.textContent = t("achievements", isClaimed ? "claimed" : "locked");
    }
    tile.appendChild(state);
  }
  return tile;
}

$("#achievements-btn").addEventListener("click", () => {
  renderAchievements();
  showScreen("#screen-achievements");
});

$("#ach-toggle-badges").addEventListener("change", (e) => {
  Progress.setBadgesEnabled(e.target.checked);
  refreshBadgeUI(); // medals and counter appear/disappear immediately
});

refreshBadgeUI();
