/* =====================================================
   STAR PARTY 2.0 — EMBEDDED MINIGAMES + SLOT MACHINE
   Each round a slot machine picks 1 of 6 minigames; every
   player's turn that round plays an INSTANCE of that game
   at the difficulty they bet (basic 1★ / inter 3★ / adv 5★).

   Uniform minigame API:
     SP_MINIGAMES[id] = {
       name, tag,                 // display name + short how-to-win line
       icon(size)                 // HTML for the slot window / risk header
       start(host, ctx, onDone)   // render into `host`, call onDone(won)
     }
   ctx = { tier, player, cpu, cpuWins, used }
     tier    — "basic" | "intermediate" | "advanced" (= the bet)
     cpu     — true for CPU turns (scripted, non-interactive)
     cpuWins — pre-rolled SINGLE result for the whole turn (90/60/35%);
               the animation is scripted to MATCH this outcome, so the
               real probability is exact no matter how many words the
               game has.
     used    — per-round Set of content keys already given to another
               player this round (no player repeats another's content).

   Data: BOMBWORD_DATA, EMOJIBOMB_DATA, WORDLINKS_DATA,
         STARPARTY_REALWORD_POOLS, GAME_DATA.blanks (app.js loads first).
   Trivia delegates back to spTriviaStart (starparty.js).
   ===================================================== */

/* ---------- timers (intervals + timeouts) that die with the turn ---------- */
let spMgTimers = [];
function spMgTimeout(fn, ms) { const id = setTimeout(fn, ms); spMgTimers.push({ t: "o", id }); return id; }
function spMgInterval(fn, ms) { const id = setInterval(fn, ms); spMgTimers.push({ t: "i", id }); return id; }
function spMgClear() {
  spMgTimers.forEach((x) => (x.t === "i" ? clearInterval(x.id) : clearTimeout(x.id)));
  spMgTimers = [];
}

/* ---------- per-tier settings straight from the design doc ---------- */
const SP_MG_TIER_KEY = { basic: "basico", intermediate: "intermedio", advanced: "avanzado" };
const SP_MG_TIME = {
  bombword:   { basic: 12, intermediate: 8, advanced: 6 },
  fillblanks: { basic: 20, intermediate: 15, advanced: 10 },
  realword:   { basic: 6, intermediate: 5, advanced: 4 },
  emojibomb:  { basic: 10, intermediate: 8, advanced: 6 },
  wordlinks:  { basic: 18, intermediate: 15, advanced: 10 },
};
const SP_MG_EB_LIVES = { basic: 3, intermediate: 2, advanced: 1 }; // advanced = 1 try total
const SP_MG_WORDS_PER_TURN = 5; // bombword / realword / emojibomb
const SP_MG_WL_WORDS = 2;
const SP_MG_WL_ATTEMPTS = 3;

/* ---------- content pools (built lazily, once) ---------- */
let spMgPools = null;
function spMgBuildPools() {
  if (spMgPools) return spMgPools;
  const bw = BOMBWORD_DATA.levels;
  // fill-in-blanks: flatten every category's sentences per level
  const fb = { basic: [], intermediate: [], advanced: [] };
  Object.values(GAME_DATA.blanks).forEach((cat) => {
    (cat.basico || []).forEach((it) => fb.basic.push(it));
    (cat.intermedio || []).forEach((it) => fb.intermediate.push(it));
    (cat.avanzado || []).forEach((it) => fb.advanced.push(it));
  });
  // emoji bomb: basic + intermediate use the Básico vocab, advanced uses Hardcore
  const ebFlat = (mode) => Object.values(EMOJIBOMB_DATA.words[mode]).reduce((a, l) => a.concat(l), []);
  const ebBasico = ebFlat("basico"), ebHard = ebFlat("hardcore");
  spMgPools = {
    bombword: {
      basic: bw.level1.prefixes.slice(),
      intermediate: bw.level2.prefixes.concat(bw.level3.prefixes.filter((_, i) => i % 3 === 0)), // level 2 (+ some 3)
      advanced: bw.level3.prefixes.concat(bw.level4.prefixes),
    },
    fillblanks: fb,
    realword: STARPARTY_REALWORD_POOLS.pools, // { tier: { real:[], fake:[] } }
    emojibomb: { basic: ebBasico, intermediate: ebBasico, advanced: ebHard },
    wordlinks: WORDLINKS_DATA.words, // { tier: [{word,clues,hint,type}] }
  };
  return spMgPools;
}

// draw `n` items from `pool`, skipping keys already in `used` this round,
// and registering the drawn keys so the NEXT player can't get them
function spMgDraw(pool, n, used, keyFn) {
  keyFn = keyFn || ((x) => x);
  let candidates = pool.filter((x) => !used.has(keyFn(x)));
  if (candidates.length < n) candidates = pool.slice(); // bank exhausted — allow repeats
  const picked = shuffle(candidates).slice(0, n);
  picked.forEach((x) => used.add(keyFn(x)));
  return picked;
}

/* ---------- shared embedded-UI toolkit ---------- */
function spMgShell(title, tierLabel) {
  const box = spEl("div", "sp-mg");
  box.innerHTML =
    `<div class="sp-mg-head">
       <span class="sp-mg-title">${title}</span>
       <span class="sp-mg-lives" id="sp-mg-lives"></span>
       <span class="sp-mg-prog" id="sp-mg-prog"></span>
     </div>
     <div class="sp-mg-timer"><div class="sp-mg-timer-fill" id="sp-mg-timer-fill"></div><span class="sp-mg-seconds" id="sp-mg-seconds"></span></div>
     <div class="sp-mg-body" id="sp-mg-body"></div>`;
  return box;
}
function spMgLives(n, total) {
  const el = $("#sp-mg-lives");
  if (!el) return;
  if (total <= 1) { el.innerHTML = `<span class="sp-mg-1try">1 TRY</span>`; return; }
  let html = "";
  for (let i = 0; i < total; i++) html += `<span class="bw-heart${i < n ? "" : " lost"}">💜</span>`;
  el.innerHTML = html;
}
function spMgProg(i, n) { const el = $("#sp-mg-prog"); if (el) el.textContent = `${i + 1} / ${n}`; }

// Date.now()-based countdown driving the shared bar; onTimeout fires once.
function spMgTimer(seconds, onTimeout) {
  const state = { deadline: Date.now() + seconds * 1000, total: seconds * 1000, dead: false, id: null };
  const tick = () => {
    const left = Math.max(0, state.deadline - Date.now());
    const fill = $("#sp-mg-timer-fill"), sec = $("#sp-mg-seconds");
    if (fill) fill.style.width = (left / state.total) * 100 + "%";
    if (sec) sec.textContent = Math.ceil(left / 1000) + "s";
    const urgent = left <= 2000;
    if (fill) fill.classList.toggle("urgent", urgent);
    if (left <= 0 && !state.dead) { state.dead = true; clearInterval(state.id); onTimeout(); }
  };
  tick();
  state.id = spMgInterval(tick, 100);
  state.stop = () => { state.dead = true; clearInterval(state.id); };
  return state;
}

function spMgFeedback(html, ok) {
  const el = $("#sp-mg-body .sp-mg-fb");
  if (el) { el.innerHTML = html; el.className = "sp-mg-fb " + (ok ? "ok" : "bad"); }
}
// end-of-instance banner (✅ CLEARED / 💥 FAILED), then hand the result back
function spMgFinish(won, detail, onDone) {
  spMgClear();
  const body = $("#sp-mg-body");
  if (body) {
    const el = spEl("div", "sp-mg-result " + (won ? "won" : "lost"),
      `${won ? "✅ CLEARED!" : "💥 FAILED"}${detail ? `<small>${detail}</small>` : ""}`);
    body.appendChild(el);
  }
  spMgTimeout(() => onDone(won), 1400);
}

// standard input row (text field + GO button) used by the typing games
function spMgInputRow(placeholder) {
  return `<form class="sp-mg-form" id="sp-mg-form" autocomplete="off">
    <input id="sp-mg-input" class="sp-mg-input" type="text" placeholder="${placeholder}" autocomplete="off" spellcheck="false" autocapitalize="off">
    <button class="primary-btn small" type="submit">GO</button>
  </form><div class="sp-mg-fb"></div>`;
}

/* ---------- CPU scripting helpers ---------- */
// simulate typing `word` into the #sp-mg-input, one letter every ~90ms, then cb
function spMgCpuType(word, cb) {
  const inp = $("#sp-mg-input");
  if (!inp) { cb(); return; }
  let i = 0;
  const id = spMgInterval(() => {
    i++;
    inp.value = word.slice(0, i);
    if (i >= word.length) { clearInterval(id); spMgTimeout(cb, 350); }
  }, 90);
}
// pick a real dictionary word for a prefix (CPU's bombword answers)
function spMgDictWord(prefix) {
  for (const w of BW_DICTIONARY) {
    if (w.startsWith(prefix) && w.length > prefix.length && w.length <= prefix.length + 6) return w;
  }
  for (const w of BW_DICTIONARY) if (w.startsWith(prefix) && w.length > prefix.length) return w;
  return prefix + "S";
}

/* =====================================================
   1) TRIVIA — the original game, delegated to starparty.js
   ===================================================== */
const SP_MG_ICONS = {
  trivia: (s) => `<span class="sp-slot-ico sp-slot-trivia" style="--s:${s}px"><span class="sp-slot-trivia-wheel"></span><span class="sp-slot-trivia-star l">${spStarIcon(Math.round(s * 0.30))}</span><span class="sp-slot-trivia-star r">${spStarIcon(Math.round(s * 0.30))}</span></span>`,
  bombword: (s) => `<span class="sp-slot-ico sp-slot-bomb" style="--s:${s}px"><span class="sp-slot-bomb-body">💣</span></span>`,
  fillblanks: (s) => `<span class="sp-slot-ico sp-slot-fib" style="--s:${s}px"><span class="sp-slot-fib-cell done">A</span><span class="sp-slot-fib-cell up"></span><span class="sp-slot-fib-cell"></span><span class="sp-slot-fib-cell"></span></span>`,
  realword: (s) => `<span class="sp-slot-ico sp-slot-real" style="--s:${s}px"><i>REAL</i><span class="sp-slot-real-btns"><b class="y">✓</b><b class="n">✗</b></span></span>`,
  emojibomb: (s) => `<span class="sp-slot-ico sp-slot-emoji" style="--s:${s}px"><span class="sp-slot-emoji-tree">🌳</span><span class="sp-slot-emoji-letter">T</span></span>`,
  wordlinks: (s) => `<span class="sp-slot-ico sp-slot-links" style="--s:${s}px"><small>WORD</small><span class="sp-slot-links-circle">🔗</span><small>LINKS</small></span>`,
};

const SP_MINIGAMES = {
  trivia: {
    name: "TRIVIA",
    tag: "1 question — answer right to win",
    icon: SP_MG_ICONS.trivia,
    start(host, ctx, onDone) { spTriviaStart(host, ctx, onDone); },
  },

  /* =====================================================
     2) BOMB WORD — 5 prefixes, 3 lives, type a real word
     wrong = -1 life (same prefix, clock keeps running)
     timeout = -1 life (NEW prefix, fresh clock)
     ===================================================== */
  bombword: {
    name: "BOMB WORD",
    tag: "5 words · 3 lives — type real words that start with the letters",
    icon: SP_MG_ICONS.bombword,
    start(host, ctx, onDone) {
      const pools = spMgBuildPools();
      const prefixes = spMgDraw(pools.bombword[ctx.tier], SP_MG_WORDS_PER_TURN, ctx.used);
      const secs = SP_MG_TIME.bombword[ctx.tier];
      let idx = 0, lives = 3, timer = null, processing = false;

      host.appendChild(spMgShell("💣 BOMB WORD", ctx.tier));
      spMgLives(lives, 3);

      const body = $("#sp-mg-body");
      const lose = (why) => { if (timer) timer.stop(); spMgFinish(false, why, onDone); };
      const win = () => { if (timer) timer.stop(); spMgFinish(true, "", onDone); };

      const load = () => {
        processing = false;
        spMgProg(idx, prefixes.length);
        body.innerHTML =
          `<div class="sp-mg-prompt sp-mg-prefix">${spEsc(prefixes[idx])}</div>` + spMgInputRow("type a word…");
        if (timer) timer.stop();
        timer = spMgTimer(secs, () => {
          // timeout: lose a life and move to a NEW prefix with a fresh clock
          lives--;
          spMgLives(lives, 3);
          if (lives <= 0) { lose("💥 out of lives"); return; }
          spMgFeedback("💥 Time's up! -1 life", false);
          spMgTimeout(next, 800);
        });
        wire();
        const inp = $("#sp-mg-input");
        if (inp && !ctx.cpu) inp.focus();
      };
      const next = () => { idx++; if (idx >= prefixes.length) win(); else load(); };

      const submit = (guess) => {
        if (processing) return;
        const prefix = prefixes[idx];
        guess = (guess || "").trim().toUpperCase();
        const valid = guess.startsWith(prefix) && guess.length > prefix.length && BW_DICTIONARY.has(guess);
        if (!valid) {
          lives--;
          spMgLives(lives, 3);
          if (lives <= 0) { lose(`the letters were "${spEsc(prefix)}"`); return; }
          spMgFeedback(`❌ ${guess ? `"${spEsc(guess.toLowerCase())}"` : "empty"} — ${lives} left`, false);
          const inp = $("#sp-mg-input");
          if (inp) { inp.value = ""; if (!ctx.cpu) inp.focus(); }
          return; // same prefix, timer keeps running
        }
        processing = true;
        if (timer) timer.stop();
        spMgFeedback(`✓ ${spEsc(guess)}`, true);
        spMgTimeout(next, 550);
      };
      const wire = () => {
        const form = $("#sp-mg-form");
        if (form && !ctx.cpu) form.addEventListener("submit", (e) => { e.preventDefault(); submit($("#sp-mg-input").value); });
        if (form && ctx.cpu) form.addEventListener("submit", (e) => e.preventDefault());
      };

      load();

      if (ctx.cpu) {
        // scripted: play each word after a short "think"; on the destined fail
        // word, burn all remaining lives with wrong answers
        const failAt = ctx.cpuWins ? -1 : Math.floor(Math.random() * prefixes.length);
        const playWord = () => {
          if (!$("#sp-mg-input")) return; // finished/aborted
          const prefix = prefixes[idx];
          if (idx === failAt) {
            let burns = lives;
            const burnOne = () => {
              if (!$("#sp-mg-input")) return;
              spMgCpuType(prefix + "XQ", () => {
                submit(prefix + "XQ");
                burns--;
                if (burns > 0) spMgTimeout(burnOne, 700);
              });
            };
            spMgTimeout(burnOne, spRand(600, 1200));
          } else {
            spMgTimeout(() => spMgCpuType(spMgDictWord(prefix), () => { submit($("#sp-mg-input").value); spMgTimeout(playWord, 1000); }), spRand(700, 1500));
          }
        };
        spMgTimeout(playWord, 600);
      }
    },
  },

  /* =====================================================
     3) FILL IN THE BLANKS — 1 sentence, type the word.
     floor(35%) letters shown (min 1) · first miss reveals
     +1 (≤6 letters) or +2 (≥7) more, ONCE, never all ·
     unlimited attempts · timer never resets.
     ===================================================== */
  fillblanks: {
    name: "FILL IN THE BLANKS",
    tag: "1 sentence — type the missing word before time runs out",
    icon: SP_MG_ICONS.fillblanks,
    start(host, ctx, onDone) {
      const pools = spMgBuildPools();
      const item = spMgDraw(pools.fillblanks[ctx.tier], 1, ctx.used, (x) => x.word)[0];
      const word = item.word.toUpperCase();
      const secs = SP_MG_TIME.fillblanks[ctx.tier];
      let revealed = spFibInitialReveal(word.length);
      let extraUsed = false, over = false;

      host.appendChild(spMgShell("▮▯ FILL IN THE BLANKS", ctx.tier));
      spMgProg(0, 1);
      const body = $("#sp-mg-body");

      const render = () => {
        body.innerHTML =
          `<div class="sp-mg-sentence">${spEsc(item.sentence).replace("___", '<span class="gap">___</span>')}</div>
           <div class="sp-mg-cells">${word.split("").map((ch, i) =>
             `<span class="letter-cell ${i < revealed ? "fixed" : "sp-mg-hidden"}">${i < revealed ? ch : ""}</span>`).join("")}</div>` +
          spMgInputRow("type the whole word…");
        const form = $("#sp-mg-form");
        if (form && !ctx.cpu) form.addEventListener("submit", (e) => { e.preventDefault(); submit($("#sp-mg-input").value); });
        if (form && ctx.cpu) form.addEventListener("submit", (e) => e.preventDefault());
        const inp = $("#sp-mg-input");
        if (inp && !ctx.cpu) inp.focus();
      };

      const timer = spMgTimer(secs, () => {
        if (over) return;
        over = true;
        spMgFinish(false, `it was "${spEsc(item.word)}"`, onDone);
      });

      const submit = (guess) => {
        if (over) return;
        guess = (guess || "").trim().toUpperCase();
        if (!guess) return;
        if (guess === word) {
          over = true;
          timer.stop();
          spMgFeedback(`✓ ${spEsc(item.word)}`, true);
          spMgFinish(true, "", onDone);
          return;
        }
        if (!extraUsed) {
          // single extra reveal: +1 letter (≤6-letter words) or +2 (7+), never the whole word
          extraUsed = true;
          revealed = Math.min(word.length - 1, revealed + (word.length <= 6 ? 1 : 2));
          render();
          spMgFeedback("❌ Not quite — a few more letters revealed (only once!)", false);
        } else {
          spMgFeedback("❌ Keep trying…", false);
          const inp = $("#sp-mg-input");
          if (inp) { inp.value = ""; if (!ctx.cpu) inp.focus(); }
        }
      };

      render();

      if (ctx.cpu) {
        if (ctx.cpuWins) {
          // maybe miss once first (looks human), then type the right word
          const missFirst = Math.random() < 0.4;
          const typeRight = () => spMgCpuType(word, () => submit(word));
          if (missFirst) spMgTimeout(() => spMgCpuType(word.slice(0, revealed) + "ER", () => { submit(word.slice(0, revealed) + "ER"); spMgTimeout(typeRight, 900); }), spRand(1000, 2000));
          else spMgTimeout(typeRight, spRand(1500, Math.min(4000, secs * 700)));
        } else {
          // destined to fail: type wrong guesses until the clock runs out
          const wrongGuess = () => {
            if (over || !$("#sp-mg-input")) return;
            const junk = word.slice(0, revealed) + shuffle("AEIOURST".split("")).slice(0, Math.max(2, word.length - revealed)).join("");
            spMgCpuType(junk, () => { submit(junk); spMgTimeout(wrongGuess, spRand(1200, 2200)); });
          };
          spMgTimeout(wrongGuess, spRand(800, 1500));
        }
      }
    },
  },

  /* =====================================================
     4) IS IT A REAL WORD? — 5 words, all-or-nothing.
     One mistake (or timeout) = lose everything.
     ===================================================== */
  realword: {
    name: "IS IT A REAL WORD?",
    tag: "5 words · all-or-nothing — one mistake loses it all",
    icon: SP_MG_ICONS.realword,
    start(host, ctx, onDone) {
      const pools = spMgBuildPools();
      const P = pools.realword[ctx.tier];
      const realCount = 2 + Math.floor(Math.random() * 2); // 2-3 real of 5
      const reals = spMgDraw(P.real, realCount, ctx.used).map((w) => ({ word: w, real: true }));
      const fakes = spMgDraw(P.fake, SP_MG_WORDS_PER_TURN - realCount, ctx.used).map((w) => ({ word: w, real: false }));
      const words = shuffle(reals.concat(fakes));
      const secs = SP_MG_TIME.realword[ctx.tier];
      let idx = 0, timer = null, answered = false;

      host.appendChild(spMgShell("✓✗ IS IT A REAL WORD?", ctx.tier));
      const body = $("#sp-mg-body");

      const load = () => {
        answered = false;
        spMgProg(idx, words.length);
        body.innerHTML =
          `<div class="sp-mg-prompt sp-mg-realword"><i>${spEsc(words[idx].word.toLowerCase())}</i></div>
           <div class="sp-mg-rw-btns">
             <button class="sp-mg-rw-btn yes" id="sp-mg-yes">✓ Yes</button>
             <button class="sp-mg-rw-btn no" id="sp-mg-no">✗ No</button>
           </div><div class="sp-mg-fb"></div>`;
        if (!ctx.cpu) {
          $("#sp-mg-yes").addEventListener("click", () => answer(true), { once: true });
          $("#sp-mg-no").addEventListener("click", () => answer(false), { once: true });
        }
        if (timer) timer.stop();
        timer = spMgTimer(secs, () => answer(null)); // timeout = wrong = lose all
      };

      const answer = (saidReal) => {
        if (answered) return;
        answered = true;
        timer.stop();
        const it = words[idx];
        const correct = saidReal !== null && saidReal === it.real;
        const yes = $("#sp-mg-yes"), no = $("#sp-mg-no");
        if (yes) yes.disabled = true;
        if (no) no.disabled = true;
        if (!correct) {
          spMgFeedback(saidReal === null ? "✗ Time's up!" : `✗ it was ${it.real ? "REAL" : "FAKE"}`, false);
          spMgTimeout(() => spMgFinish(false, "all-or-nothing!", onDone), 700);
          return;
        }
        spMgFeedback("✓", true);
        spMgTimeout(() => {
          idx++;
          if (idx >= words.length) spMgFinish(true, "5 / 5 — perfect!", onDone);
          else load();
        }, 600);
      };

      load();

      if (ctx.cpu) {
        const failAt = ctx.cpuWins ? -1 : Math.floor(Math.random() * words.length);
        const play = () => {
          if (!$("#sp-mg-yes")) return;
          spMgTimeout(() => {
            const it = words[idx];
            const btnOk = idx === failAt ? !it.real : it.real; // destined wrong answer on failAt
            const btn = $(btnOk ? "#sp-mg-yes" : "#sp-mg-no");
            if (btn) btn.classList.add("picked");
            spMgTimeout(() => { answer(btnOk); spMgTimeout(play, 900); }, 350);
          }, spRand(700, Math.min(2400, secs * 600)));
        };
        spMgTimeout(play, 500);
      }
    },
  },

  /* =====================================================
     5) EMOJI BOMB — 5 prompts. basic: 3 lives · inter: 2 ·
     advanced: hardcore vocab, 1 mistake = out.
     wrong = -1 life (same prompt, clock running)
     timeout = -1 life (new prompt) — advanced: instant loss
     ===================================================== */
  emojibomb: {
    name: "EMOJI BOMB",
    tag: "5 emoji words — guess the exact word each time",
    icon: SP_MG_ICONS.emojibomb,
    start(host, ctx, onDone) {
      const pools = spMgBuildPools();
      const words = spMgDraw(pools.emojibomb[ctx.tier], SP_MG_WORDS_PER_TURN, ctx.used, (x) => x.word);
      const secs = SP_MG_TIME.emojibomb[ctx.tier];
      const totalLives = SP_MG_EB_LIVES[ctx.tier];
      let idx = 0, lives = totalLives, timer = null, processing = false;

      host.appendChild(spMgShell("🌳 EMOJI BOMB", ctx.tier));
      spMgLives(lives, totalLives);
      const body = $("#sp-mg-body");

      const lose = (why) => { if (timer) timer.stop(); spMgFinish(false, why, onDone); };
      const win = () => { if (timer) timer.stop(); spMgFinish(true, "", onDone); };

      const load = () => {
        processing = false;
        spMgProg(idx, words.length);
        const it = words[idx];
        body.innerHTML =
          `<div class="sp-mg-prompt sp-mg-emoji"><span class="sp-mg-emoji-letter">${spEsc(it.letter)}</span>
             <span class="sp-mg-emoji-icons">${it.emojis.map((e) => `<span>${e}</span>`).join("")}</span></div>` +
          spMgInputRow("type the word…");
        const form = $("#sp-mg-form");
        if (form && !ctx.cpu) form.addEventListener("submit", (e) => { e.preventDefault(); submit($("#sp-mg-input").value); });
        if (form && ctx.cpu) form.addEventListener("submit", (e) => e.preventDefault());
        const inp = $("#sp-mg-input");
        if (inp && !ctx.cpu) inp.focus();
        if (timer) timer.stop();
        timer = spMgTimer(secs, () => {
          lives--;
          spMgLives(lives, totalLives);
          if (lives <= 0) { lose(`the word was "${spEsc(words[idx].word)}"`); return; }
          spMgFeedback("💥 Time's up! -1 life", false);
          spMgTimeout(() => { idx++; if (idx >= words.length) win(); else load(); }, 800);
        });
      };

      const submit = (guess) => {
        if (processing) return;
        const it = words[idx];
        guess = (guess || "").trim().toUpperCase();
        if (guess !== it.word) {
          lives--;
          spMgLives(lives, totalLives);
          if (lives <= 0) { lose(`the word was "${spEsc(it.word)}"`); return; }
          spMgFeedback(`❌ ${guess ? `"${spEsc(guess.toLowerCase())}"` : "empty"} — ${lives} left`, false);
          const inp = $("#sp-mg-input");
          if (inp) { inp.value = ""; if (!ctx.cpu) inp.focus(); }
          return; // same prompt, clock keeps running
        }
        processing = true;
        if (timer) timer.stop();
        spMgFeedback(`✓ ${spEsc(it.word)}`, true);
        spMgTimeout(() => { idx++; if (idx >= words.length) win(); else load(); }, 550);
      };

      load();

      if (ctx.cpu) {
        const failAt = ctx.cpuWins ? -1 : Math.floor(Math.random() * words.length);
        const play = () => {
          if (!$("#sp-mg-input")) return;
          const it = words[idx];
          if (idx === failAt) {
            let burns = lives;
            const burnOne = () => {
              if (!$("#sp-mg-input")) return;
              const junk = it.letter + "XQ";
              spMgCpuType(junk, () => { submit(junk); burns--; if (burns > 0) spMgTimeout(burnOne, 700); });
            };
            spMgTimeout(burnOne, spRand(700, 1400));
          } else {
            spMgTimeout(() => spMgCpuType(it.word, () => { submit(it.word); spMgTimeout(play, 1000); }), spRand(800, 1600));
          }
        };
        spMgTimeout(play, 600);
      }
    },
  },

  /* =====================================================
     6) WORD LINKS — 2 secret words, 4 clue chips each,
     3 attempts + its own timer per word, NO hint.
     Both right = win, anything else = lose.
     ===================================================== */
  wordlinks: {
    name: "WORD LINKS",
    tag: "2 secret words · 3 tries each — guess from the clues",
    icon: SP_MG_ICONS.wordlinks,
    start(host, ctx, onDone) {
      const pools = spMgBuildPools();
      const words = spMgDraw(pools.wordlinks[ctx.tier], SP_MG_WL_WORDS, ctx.used, (x) => x.word);
      const secs = SP_MG_TIME.wordlinks[ctx.tier];
      let idx = 0, attempts = SP_MG_WL_ATTEMPTS, timer = null, over = false;

      host.appendChild(spMgShell("🔗 WORD LINKS", ctx.tier));
      const body = $("#sp-mg-body");

      const lose = (why) => { if (over) return; over = true; if (timer) timer.stop(); spMgFinish(false, why, onDone); };

      const load = () => {
        attempts = SP_MG_WL_ATTEMPTS;
        spMgProg(idx, words.length);
        const it = words[idx];
        body.innerHTML =
          `<div class="sp-mg-wl-clues">${it.clues.map((c) => `<span class="wl-chip">${spEsc(c)}</span>`).join("")}</div>
           <div class="sp-mg-wl-meta">${it.type === "verb" ? "(Verb)" : "(Noun)"} · <span id="sp-mg-attempts">${attempts} tries</span></div>` +
          spMgInputRow("guess the word…");
        const form = $("#sp-mg-form");
        if (form && !ctx.cpu) form.addEventListener("submit", (e) => { e.preventDefault(); submit($("#sp-mg-input").value); });
        if (form && ctx.cpu) form.addEventListener("submit", (e) => e.preventDefault());
        const inp = $("#sp-mg-input");
        if (inp && !ctx.cpu) inp.focus();
        if (timer) timer.stop();
        timer = spMgTimer(secs, () => lose(`time's up — it was "${spEsc(it.word)}"`));
      };

      const submit = (guess) => {
        if (over) return;
        const it = words[idx];
        guess = (guess || "").trim().toLowerCase();
        if (!guess) return;
        const w = it.word.toLowerCase();
        const hit = guess === w || guess === w + "s" || guess === w + "es" ||
          (guess.endsWith("es") && guess.slice(0, -2) === w) || (guess.endsWith("s") && guess.slice(0, -1) === w);
        if (hit) {
          timer.stop();
          spMgFeedback(`✓ ${spEsc(it.word)}`, true);
          spMgTimeout(() => {
            idx++;
            if (idx >= words.length) { over = true; spMgFinish(true, "both words!", onDone); }
            else load();
          }, 650);
          return;
        }
        attempts--;
        const at = $("#sp-mg-attempts");
        if (at) at.textContent = `${attempts} tries`;
        if (attempts <= 0) { lose(`it was "${spEsc(it.word)}"`); return; }
        spMgFeedback("❌ Nope…", false);
        const inp = $("#sp-mg-input");
        if (inp) { inp.value = ""; if (!ctx.cpu) inp.focus(); }
      };

      load();

      if (ctx.cpu) {
        const failAt = ctx.cpuWins ? -1 : Math.floor(Math.random() * words.length);
        const play = () => {
          if (over || !$("#sp-mg-input")) return;
          const it = words[idx];
          if (idx === failAt) {
            let burns = attempts;
            const burnOne = () => {
              if (over || !$("#sp-mg-input")) return;
              const junk = shuffle(["THING", "PLACE", "LIGHT", "WATER", "SOUND"])[0];
              spMgCpuType(junk, () => { submit(junk); burns--; if (burns > 0 && !over) spMgTimeout(burnOne, 900); });
            };
            spMgTimeout(burnOne, spRand(1200, 2200));
          } else {
            spMgTimeout(() => spMgCpuType(it.word, () => { submit(it.word); spMgTimeout(play, 1100); }), spRand(1500, 3000));
          }
        };
        spMgTimeout(play, 700);
      }
    },
  },
};
const SP_MG_IDS = Object.keys(SP_MINIGAMES);

// initial reveal for Fill in the Blanks: floor(35%) of the length, min 1,
// and always at least 1 letter left hidden (shared with the standalone game)
function spFibInitialReveal(len) {
  return Math.min(len - 1, Math.max(1, Math.floor(len * 0.35)));
}

/* =====================================================
   THE SLOT — red casino machine, ONE window, 6 icons.
   The 6 minigame icons scroll UP through the single window
   as a real reel and decelerate to a clean stop on the
   chosen game (result decided up-front, like the wildcard
   wheel), then a tactic-card-style reveal names the game.
   Whole flow ≈ 5s: spin (bulk) + a brief card read.
   ===================================================== */
const SP_SLOT_CELL = 128;                                 // reel cell height = the window's inner height
const SP_SLOT_LEVER_MS = 550;                             // the lever visibly pulls down BEFORE the reel moves
const SP_SLOT_SPIN_MS = 3600;                             // the spin takes most of the budget
const SP_SLOT_REVEAL_MS = 5000;                           // reveal card stays up long enough to actually read it
// strong ease-OUT: the reel starts FAST (icons blur past) and decelerates
// gradually to a clean stop — same non-linear "casino" decel family as the
// wildcard wheel's cubic-bezier, tuned for a linear reel instead of a disc.
const SP_SLOT_EASE = "cubic-bezier(0.10, 0.72, 0.12, 1)";

function spSlotHTML() {
  return `<div class="sp-slot">
    <div class="sp-slot-top"><span class="sp-slot-sign">ROUND GAME</span></div>
    <div class="sp-slot-bulbs"></div>
    <div class="sp-slot-body">
      <div class="sp-slot-window"><div class="sp-slot-reel" id="sp-slot-reel"></div><span class="sp-slot-payline"></span></div>
      <div class="sp-slot-lever"><span class="sp-slot-lever-arm"></span><span class="sp-slot-lever-knob"></span></div>
    </div>
  </div>`;
}

// decorate the machine with golden bulbs around the top arch
function spSlotDecorate(root) {
  const holder = root.querySelector(".sp-slot-bulbs");
  if (!holder) return;
  const N = 12;
  for (let i = 0; i < N; i++) {
    const b = spEl("span", "sp-wheel-bulb");
    b.style.left = 6 + (i / (N - 1)) * 88 + "%";
    b.style.top = Math.abs(i - (N - 1) / 2) * 4 + 2 + "px";
    b.style.animationDelay = (i % 2) * 0.55 + "s";
    holder.appendChild(b);
  }
}

// spin the reel: `targetId` is ALREADY chosen — the animation only travels there.
// A tall strip of icon cells scrolls up under CSS transform + ease-out easing
// (reflow-committed + double-rAF so it animates even when timer-triggered), then
// the tactic-card reveal fires.  onLand() runs after the card's brief read time.
function spSlotSpin(targetId, onLand) {
  const reel = $("#sp-slot-reel");
  if (!reel) { onLand(); return; }
  const lever = $(".sp-slot-lever");

  // build the strip up-front: many random cells, ENDING on the target (the
  // resting cell) — but DON'T start scrolling yet, the lever pulls down first
  const CYCLES = 22;
  const ids = [];
  for (let k = 0; k < CYCLES; k++) ids.push(SP_MG_IDS[Math.floor(Math.random() * SP_MG_IDS.length)]);
  ids.push(targetId); // final, centred cell
  reel.innerHTML = ids.map((id) => `<div class="sp-slot-cell">${SP_MINIGAMES[id].icon(84)}</div>`).join("");
  reel.style.transition = "none";
  reel.style.transform = "translateY(0)";

  // STEP 1 — the lever visibly pulls down (arm swings, knob drops)
  if (lever) lever.classList.add("pulled");

  // STEP 2 — only once the pull has read does the reel actually start spinning
  spMgTimeout(() => {
    const dist = (ids.length - 1) * SP_SLOT_CELL; // scroll up to the last cell
    void reel.offsetWidth;                        // commit the rest state first
    requestAnimationFrame(() => {
      reel.style.transition = `transform ${SP_SLOT_SPIN_MS}ms ${SP_SLOT_EASE}`;
      requestAnimationFrame(() => { reel.style.transform = `translateY(${-dist}px)`; });
    });
  }, SP_SLOT_LEVER_MS);

  let fired = false;
  const land = () => {
    if (fired) return;
    fired = true;
    reel.removeEventListener("transitionend", land);
    if (lever) lever.classList.remove("pulled");
    const cells = reel.querySelectorAll(".sp-slot-cell");
    const last = cells[cells.length - 1];
    if (last) last.classList.add("landed"); // little pop on the chosen icon
    spSlotReveal(targetId, onLand);
  };
  reel.addEventListener("transitionend", land);
  spMgTimeout(land, SP_SLOT_LEVER_MS + SP_SLOT_SPIN_MS + 700); // safety net (hidden-tab / missed transitionend)
}

// tactic-card-style reveal for the round's minigame — SAME component as the
// wildcard reveal cards (category label → rounded icon box → big name → short
// one-line description), but informational: it auto-advances, no OK button.
function spSlotReveal(targetId, onDone) {
  const mg = SP_MINIGAMES[targetId];
  const card = spEl("div", "sp-wc-card sp-wc-big sp-slot-reveal");
  card.style.setProperty("--wc-color", "#a855f7"); // neon violet accent
  card.innerHTML =
    `<div class="sp-wc-catlabel">ROUND MINIGAME</div>
     <div class="sp-wc-iconbox"><span class="sp-wc-icon">${mg.icon(58)}</span></div>
     <div class="sp-wc-name">${spEsc(mg.name)}</div>
     <div class="sp-wc-desc">${spEsc(mg.tag)}</div>`;
  spSetCenter(card); // replaces the machine; cleared automatically by the first turn
  spMgTimeout(onDone, SP_SLOT_REVEAL_MS);
}
