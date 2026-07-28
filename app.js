/* =====================================================
   ENGLISH 11 — game logic
   Screens: home → intro modal → wordle / blanks
   Data comes from data.js (GAME_DATA).
   ===================================================== */

// ---------- helpers ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function showScreen(id) {
  $$(".screen").forEach((s) => s.classList.remove("active"));
  $(id).classList.add("active");
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
// each value is { en, es }. lang defaults to "en" — the meaning panels always
// show English by default; the per-word translate button asks for "es" on
// top of that, independent of the general UI language toggle.
function lookupDefinition(word, lang) {
  if (typeof DEFINITIONS !== "object" || !DEFINITIONS) return null;
  const entry = DEFINITIONS[String(word).toUpperCase()];
  if (!entry) return null;
  return entry[lang === "es" ? "es" : "en"] || null;
}

// small "🌐 ES" button appended after a word's English meaning. Reveals the
// Spanish translation IN ADDITION to the English text already shown (never
// replaces it) — independent of the general UI language toggle, since a
// player using the English interface may still want one definition in
// Spanish. No-ops silently if there's no Spanish entry for that word.
function attachTranslateButton(container, word) {
  const es = lookupDefinition(word, "es");
  if (!es) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "translate-btn";
  btn.textContent = "🌐 ES";

  const esLine = document.createElement("p");
  esLine.className = "translate-es hidden";
  esLine.textContent = `🇪🇸 ${es}`;

  btn.addEventListener("click", () => {
    const nowHidden = esLine.classList.toggle("hidden");
    btn.classList.toggle("active", !nowHidden);
  });

  container.appendChild(btn);
  container.appendChild(esLine);
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

  // Spot the Error, Word Links and Connections have no categories — difficulty only.
  // Is It a Real Word and Bomb Word have NO selectors; Emoji Bomb and Strands only have their own mode row.
  // Fill in the Blanks, Impostor and Wordle no longer show category either — those
  // games now mix every category together and only ask for difficulty.
  const noSelectors = game === "realword" || game === "bombword" || game === "emojibomb" || game === "strands";
  const showCategory =
    !noSelectors &&
    game !== "spot" && game !== "wordlinks" && game !== "connections" && game !== "waffle" &&
    game !== "blanks" && game !== "impostor" && game !== "wordle";
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
    openIntro(card.dataset.game);
  });
});

$("#intro-close").addEventListener("click", () => {
  $("#intro-overlay").classList.add("hidden");
  pendingGame = null;
});

$("#intro-start").addEventListener("click", () => {
  const level = document.querySelector('input[name="difficulty"]:checked').value;
  const category = document.querySelector('input[name="category"]:checked').value;
  $("#intro-overlay").classList.add("hidden");

  if (pendingGame === "wordle") startWordle(category, level);
  if (pendingGame === "blanks") startBlanks(category, level);
  if (pendingGame === "spot") startSpot(level);
  if (pendingGame === "wordlinks") startWordLinks(level);
  if (pendingGame === "impostor") startImpostor(category, level);
  if (pendingGame === "connections") startConnections(level);
  if (pendingGame === "realword") startRealword();
  if (pendingGame === "bombword") startBombword();
  if (pendingGame === "waffle")
    startWaffle(document.querySelector('input[name="wmode"]:checked').value, level);
  if (pendingGame === "emojibomb")
    startEmojiBomb(document.querySelector('input[name="ebmode"]:checked').value);
  if (pendingGame === "strands")
    startStrands(document.querySelector('input[name="stmode"]:checked').value);
});

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
    showScreen("#screen-home");
  })
);

$$("[data-replay]").forEach((btn) =>
  btn.addEventListener("click", () => {
    wordleActive = false;
    showScreen("#screen-home");
    openIntro(btn.dataset.replay); // reopen the selector for the same game
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
let blanksTimerId = null;
let blanksDeadline = 0;
// per-sentence timer, by level (same table as the STAR PARTY minigame)
const BLANKS_SECONDS = { basico: 20, intermedio: 15, avanzado: 10 };
let blanksSeconds = 20;

function fbStopTimer() {
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

function startBlanks(category, level) {
  // category selector removed — mix travel + business + daily sentences together
  // and shuffle across all of them for this difficulty (12 sentences combined).
  const pool = Object.values(GAME_DATA.blanks).flatMap((byLevel) => byLevel[level] || []);
  blanksRound = shuffle(pool);
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
    fbStopTimer();
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
    fbStopTimer();
    blanksScore += 1;
    $("#blanks-feedback").textContent = t("blanks", "messages.correct");
    revealAndNext(item);
    return;
  }

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
  const def = lookupDefinition(item.word, "en");
  $("#blanks-meaning-text").textContent = def
    ? interp(t("blanks", "messages.meaning"), { def })
    : t("blanks", "messages.meaning_unavailable");
  const extra = $("#blanks-meaning-extra");
  extra.innerHTML = ""; // reused across sentences — clear the previous word's translate button
  if (def) attachTranslateButton(extra, item.word);
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

function nextSentence() {
  fbStopMeaningTimer();
  $("#blanks-meaning-panel").classList.add("hidden");
  blanksIndex++;
  if (blanksIndex >= blanksRound.length) {
    $("#blanks-play").classList.add("hidden");
    $("#blanks-end").classList.remove("hidden");
    $("#blanks-score").textContent = `${blanksScore} / ${blanksRound.length}`;
  } else {
    loadSentence();
  }
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
let spotWordFailed = false;
let spotErrorSentence = "";

function startSpot(level) {
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
    btn.classList.add("found");
    $("#spot-feedback").textContent = t("spot", "messages.phase1_correct");
    setTimeout(startSpotPhase2, 700);
  } else {
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
        btn.classList.add("found");
        wrap.querySelectorAll("button").forEach((b) => (b.disabled = true));
        finishSpotRound();
      } else {
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

$("#spot-next").addEventListener("click", () => {
  spotIndex++;
  if (spotIndex >= spotRounds.length) {
    $("#spot-play").classList.add("hidden");
    $("#spot-end").classList.remove("hidden");
    $("#spot-score").textContent = interp(t("spot", "messages.score_value"), { spotTotal, "spotRounds.length * 2": spotRounds.length * 2 });
  } else {
    loadSpotRound();
  }
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
    const points = WORDLINKS_DATA.scoring[`attempt${attemptNumber}`] || 0;
    wlEndRound(points, true);
    return;
  }

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
  const total = wlScores.reduce((a, b) => a + b, 0);
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
    btn.classList.add("impostor-reveal", "shake");
    impFinishRound(false);
  } else {
    btn.classList.add("removed"); // fades out via CSS, unclickable
    impRemaining--;
    if (impRules().auto_win_when_one_remains && impRemaining === 1) {
      // only the impostor is left — auto win, no extra click needed
      $$("#imp-words .imp-word").forEach((b) => {
        if (b.textContent === set.impostor) b.classList.add("impostor-reveal");
      });
      impFinishRound(true);
    }
  }
}

function impFinishRound(won) {
  const set = impSets[impIndex];
  impRoundOver = true;
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
  const total = impScores.reduce((a, b) => a + b, 0);
  $("#imp-score").textContent = `${total} / ${IMPOSTOR_DATA.scoring.max_per_game}`;

  const list = $("#imp-breakdown");
  list.innerHTML = "";
  impSets.forEach((s, i) => {
    const li = document.createElement("li");
    if (impScores[i] > 0) li.classList.add("was-found");
    const name = document.createElement("span");
    name.textContent = interp(t("impostor", "messages.breakdown_row"), { "i + 1": i + 1, "impHintText(s)": impHintText(s), "s.impostor": s.impostor });
    const pts = document.createElement("span");
    pts.textContent = `${impScores[i]} pts`;
    li.appendChild(name);
    li.appendChild(pts);
    list.appendChild(li);
  });

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
    const def = lookupDefinition(w, "en");
    const dEl = document.createElement("p");
    dEl.className = "conn-meaning-def meaning-en";
    dEl.textContent = def || t("connections", "messages.meaning_unavailable");
    defWrap.appendChild(dEl);
    if (def) attachTranslateButton(defWrap, w);

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
    // exactly 3 of one group: keep the selection so the player can adjust
    $("#conn-message").textContent = t("connections", "messages.three_of_four");
  } else {
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

function startRealword() {
  // random split per game: 3 to 5 real words, the rest fake
  const min = rwRules().min_real_per_game;
  const max = rwRules().max_real_per_game;
  const realCount = min + Math.floor(Math.random() * (max - min + 1));
  const fakeCount = rwRules().words_per_game - realCount;

  let lastWords = [];
  try {
    lastWords = JSON.parse(localStorage.getItem(RW_STORAGE_KEY)) || [];
  } catch (err) { /* corrupted storage — ignore */ }

  const reals = rwPick(REALWORD_DATA.real_words, realCount, lastWords).map((w) => ({ word: w, real: true }));
  const fakes = rwPick(REALWORD_DATA.fake_words, fakeCount, lastWords).map((w) => ({ word: w, real: false }));
  rwWords = shuffle([...reals, ...fakes]); // fully random order

  rwIndex = 0;
  rwResults = [];

  // don't reveal the real/fake split — that's the whole challenge
  $("#rw-meta").textContent = interp(t("realword", "labels.meta"), {
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
  const score = rwResults.filter((r) => r.correct).length * REALWORD_DATA.scoring.points_per_correct;
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
    const def = r.real ? lookupDefinition(r.word, "en") : null;
    const meaningLine = document.createElement("p");
    meaningLine.className = "meaning-en";
    meaningLine.textContent = r.real
      ? (def || t("realword", "messages.meaning_unavailable"))
      : t("realword", "messages.meaning_not_real");
    panel.appendChild(meaningLine);
    if (!r.real) panel.classList.add("rw-meaning-fake");
    if (r.real && def) attachTranslateButton(panel, r.word);

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

$("#rw-again-btn").addEventListener("click", startRealword);

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

// 28k-word dictionary as a Set for O(1) validation lookups
const BW_DICTIONARY = new Set(BOMBWORD_DATA.dictionary);

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
  bwStopTimer();
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
  bwStopTimer();
  bwSaveLastPrefixes();
  $("#bw-end-title").textContent = t("bombword", "messages.end_title_won");
  $("#bw-end-detail").textContent = t("bombword", "messages.end_detail_won");
  $("#bw-play").classList.add("hidden");
  $("#bw-end").classList.remove("hidden");
}

function bwGameOver(reason) {
  bwActive = false;
  bwStopTimer();
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
    [wfCurrent[wfSelected], wfCurrent[i]] = [wfCurrent[i], wfCurrent[wfSelected]];
    wfSelected = null;
    if (wfSwapsLeft !== null) wfSwapsLeft--;

    const solved = wfCurrent.every((letter, idx) => letter === wfCells[idx].solution);
    if (solved) {
      wfRefresh();
      wfFinish(true);
      return;
    }
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
    const def = lookupDefinition(word, "en");
    const meaningLine = document.createElement("p");
    meaningLine.className = "meaning-en";
    meaningLine.textContent = def || t("waffle", "messages.meaning_unavailable");
    panel.appendChild(meaningLine);
    if (def) attachTranslateButton(panel, word);

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
  ebStopTimer();
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
  ebStopTimer();
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
  ebStopTimer();
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
const ST_DICTIONARY = new Set(STRANDS_DATA.dictionary);

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
    if (match.is_spangram) {
      const flash = $("#st-flash");
      flash.textContent = t("strands", "messages.spangram_flash");
      flash.classList.remove("hidden");
      setTimeout(() => flash.classList.add("hidden"), 1200);
    } else {
      $("#st-message").textContent = interp(t("strands", "messages.word_found"), { "match.word": match.word });
    }
    stRefresh();
    if (stFound.size === stPuzzle.words.length) setTimeout(() => stFinish(true), 900);
    return;
  }

  // b) any real dictionary word that isn't the puzzle's theme: never costs a life,
  // even in hardcore. 4+ letters also earns hint credit (same threshold both modes).
  if (ST_DICTIONARY.has(word)) {
    if (word.length >= stRules().min_word_length_for_hint_credit) {
      if (stNonTheme.has(word)) {
        $("#st-message").textContent = interp(t("strands", "messages.already_found"), { word });
      } else {
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

  // list all 8 words: found vs missed, spangram highlighted (order: spangram first)
  const list = $("#st-wordlist");
  list.innerHTML = "";
  const ordered = [...stPuzzle.words].sort((a, b) => (b.is_spangram ? 1 : 0) - (a.is_spangram ? 1 : 0));
  ordered.forEach((w) => {
    const li = document.createElement("li");
    const foundIt = stEverFound.has(w.word); // found by the player, not by the give-up reveal
    li.className = (w.is_spangram ? "span " : "") + (foundIt ? "found" : "missed");
    li.textContent = `${foundIt ? "✓ " : ""}${w.word}`;
    if (w.is_spangram) {
      const tag = document.createElement("span");
      tag.className = "span-tag";
      tag.textContent = "SPANGRAM";
      li.appendChild(tag);
    }
    list.appendChild(li);
  });

  $("#st-end").classList.remove("hidden"); // overlay on top of the (revealed) board
}

// PLAY AGAIN: new puzzle, same mode
$("#st-again-btn").addEventListener("click", () => startStrands(stMode));

