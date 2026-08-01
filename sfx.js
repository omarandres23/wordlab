/* =====================================================
   SFX — central audio manager for every game with sound effects
   (Bomb Word, Emoji Bomb, Fill in the Blanks, Word Links,
   Spot the Error, Waffle, Connections, Wordle, Is It A Real Word,
   Emoji Match, Impostor, Strands).
   Every sound in every game goes through SFX.play/loop/stop —
   nothing else in the codebase creates an Audio() object.

   Playback engine: Web Audio API (AudioBufferSourceNode → per-sound
   GainNode → master GainNode → destination), for near-zero trigger
   latency. Falls back to plain HTMLAudioElement per sound whenever
   Web Audio isn't available, or a specific file hasn't finished
   decoding yet — so one slow/broken file never disables the rest.
   The public API (play/loop/stop/stopAll/isMuted/setMuted/
   toggleMuted/getVolume/setVolume) is unchanged either way.
   ===================================================== */
const SFX = (() => {
  const FILES = {
    correct: "assets/audios/correct.mp3",
    wrong: "assets/audios/wrong.mp3",
    tick: "assets/audios/tick.mp3",
    tick_soft: "assets/audios/tick_soft.mp3",
    explosion: "assets/audios/explosion.mp3",
    level: "assets/audios/level.mp3",
    success: "assets/audios/success.mp3",
    fail: "assets/audios/fail.mp3",
    letter_correct: "assets/audios/letter_correct.mp3",
    letter_move: "assets/audios/letter_move.mp3",
    hint: "assets/audios/hint.mp3",
    impostor_ok: "assets/audios/impostor_ok.mp3",
    strand_word: "assets/audios/strand_word.mp3",
    victory: "assets/audios/victory.mp3",
  };
  // per-sound RELATIVE volume — the single place to retune the mix. The
  // source files are already normalized to the same loudness, so most of
  // these are 1.0 (no correction needed) — what's left is an artistic
  // choice: background loops stay low, high-frequency cues stay modest,
  // and the win fanfare doesn't overpower everything else.
  const VOLUMES = {
    tick: 0.45,
    tick_soft: 0.45,
    letter_move: 0.55,
    victory: 0.75,
    correct: 1.0,
    wrong: 1.0,
    success: 1.0,
    fail: 1.0,
    explosion: 1.0,
    level: 1.0,
    hint: 1.0,
    impostor_ok: 1.0,
    letter_correct: 1.0,
  };
  const LOOPING = new Set(["tick", "tick_soft"]);
  const DEFAULT_VOLUME = 0.5;

  let muted = false;
  try {
    muted = localStorage.getItem("sfx_muted") === "true";
  } catch (err) { /* private mode — default unmuted */ }
  let globalVolume = DEFAULT_VOLUME;
  try {
    const stored = parseFloat(localStorage.getItem("sfx_volume"));
    if (!Number.isNaN(stored) && stored >= 0 && stored <= 1) globalVolume = stored;
  } catch (err) { /* private mode — default volume */ }
  let unlocked = false;

  /* ---------- Web Audio path ---------- */
  let ctx = null;
  let masterGain = null; // globalVolume lives here; muting sets this to 0
  const gains = {};      // name -> GainNode, holds the fixed VOLUMES[name] weight
  const buffers = {};    // name -> decoded AudioBuffer, filled in async as each file lands
  const sources = {};    // name -> the AudioBufferSourceNode currently playing (for stop()/restart)
  let useWebAudio = false;

  /* ---------- HTMLAudioElement fallback — always built regardless of Web
     Audio support, as a per-sound safety net (see play() below) ---------- */
  const els = {};

  function initWebAudio() {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return false;
    try {
      ctx = new Ctor();
      masterGain = ctx.createGain();
      masterGain.gain.value = muted ? 0 : globalVolume;
      masterGain.connect(ctx.destination);
      Object.keys(FILES).forEach((name) => {
        const g = ctx.createGain();
        g.gain.value = VOLUMES[name] ?? 1;
        g.connect(masterGain);
        gains[name] = g;
      });
      return true;
    } catch (err) {
      return false;
    }
  }

  // decodeAudioData has both a Promise form and an older Safari
  // callback-only form — this covers both without feature-sniffing.
  function decode(arrayBuffer) {
    return new Promise((resolve, reject) => {
      const maybePromise = ctx.decodeAudioData(arrayBuffer, resolve, reject);
      if (maybePromise && maybePromise.then) maybePromise.then(resolve, reject);
    });
  }

  function decodeAll() {
    Object.keys(FILES).forEach((name) => {
      fetch(FILES[name])
        .then((r) => r.arrayBuffer())
        .then((buf) => decode(buf))
        .then((decoded) => {
          buffers[name] = decoded;
        })
        .catch(() => {
          /* this one file failed to fetch/decode — buffers[name] stays
             unset, so play() below quietly uses the HTMLAudioElement
             fallback for just this sound, every other sound is unaffected */
        });
    });
  }

  function initFallbackElements() {
    Object.keys(FILES).forEach((name) => {
      const audio = new Audio(FILES[name]);
      audio.preload = "auto";
      if (LOOPING.has(name)) audio.loop = true;
      els[name] = audio;
    });
    applyFallbackMutedState();
    applyFallbackVolumes();
  }

  function applyFallbackMutedState() {
    Object.values(els).forEach((audio) => {
      audio.muted = muted;
    });
  }

  function applyFallbackVolumes() {
    Object.keys(els).forEach((name) => {
      els[name].volume = (VOLUMES[name] ?? 1) * globalVolume;
    });
  }

  function init() {
    useWebAudio = initWebAudio();
    if (useWebAudio) decodeAll();
    // built unconditionally: the safety net for browsers with no Web Audio
    // AND the per-sound safety net for any file still mid-decode
    initFallbackElements();

    // iOS/Android suspend a freshly-created AudioContext, and also block
    // HTMLAudioElement playback, until a real user gesture. On the first
    // pointer interaction of the session: resume the context, and silently
    // play+pause every fallback element once to unlock those too.
    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
      Object.values(els).forEach((audio) => {
        const prevVol = audio.volume;
        audio.volume = 0;
        const p = audio.play();
        if (p && p.catch) p.catch(() => {});
        audio.pause();
        audio.currentTime = 0;
        audio.volume = prevVol;
      });
    };
    document.addEventListener("pointerdown", unlock, { once: true, passive: true });

    // a background loop (tick/tick_soft) left running while the tab is hidden
    // is the single most annoying thing an audio system can do — kill both,
    // but leave short one-shots alone since they're likely already finished
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stop("tick");
        stop("tick_soft");
      }
    });
  }

  function playWebAudio(name) {
    // AudioBufferSourceNodes are single-use — "restart, don't stack" means
    // stopping any node already playing under this name and creating a
    // fresh one, not rewinding currentTime like HTMLAudioElement.
    const prev = sources[name];
    if (prev) {
      try {
        prev.stop();
      } catch (err) { /* already stopped/ended — ignore */ }
      sources[name] = null;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffers[name];
    src.loop = LOOPING.has(name);
    src.connect(gains[name]);
    src.start(0);
    sources[name] = src;
    src.onended = () => {
      if (sources[name] === src) sources[name] = null;
    };
  }

  function playFallback(name) {
    const audio = els[name];
    if (!audio) return;
    audio.currentTime = 0;
    const p = audio.play();
    if (p && p.catch) p.catch(() => {}); // ignore autoplay-policy rejections
  }

  function play(name) {
    if (muted) return;
    if (useWebAudio && buffers[name]) playWebAudio(name);
    else playFallback(name);
  }

  function loop(name) {
    play(name); // same restart-not-stack behaviour; loop flag is set per-path above
  }

  function stop(name) {
    const src = sources[name];
    if (src) {
      try {
        src.stop();
      } catch (err) { /* already stopped/ended — ignore */ }
      sources[name] = null;
    }
    const audio = els[name];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  function stopAll() {
    Object.keys(FILES).forEach(stop);
  }

  function isMuted() {
    return muted;
  }

  function setMuted(value) {
    muted = !!value;
    try {
      localStorage.setItem("sfx_muted", String(muted));
    } catch (err) { /* private mode — ignore */ }
    if (masterGain) masterGain.gain.value = muted ? 0 : globalVolume;
    applyFallbackMutedState();
    if (muted) stopAll();
  }

  function toggleMuted() {
    setMuted(!muted);
    return muted;
  }

  function getVolume() {
    return globalVolume;
  }

  // value is 0..1. Applied immediately, including to a sound that is
  // currently looping (tick), so dragging the slider mid-round is heard.
  function setVolume(value) {
    globalVolume = Math.min(1, Math.max(0, value));
    try {
      localStorage.setItem("sfx_volume", String(globalVolume));
    } catch (err) { /* private mode — ignore */ }
    if (masterGain && !muted) masterGain.gain.value = globalVolume;
    applyFallbackVolumes();
  }

  return {
    init,
    play,
    loop,
    stop,
    stopAll,
    isMuted,
    setMuted,
    toggleMuted,
    getVolume,
    setVolume,
    DEFAULT_VOLUME,
  };
})();

document.addEventListener("DOMContentLoaded", SFX.init);
