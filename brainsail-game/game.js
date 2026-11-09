(function () {
  "use strict";

  const MESSAGES = Object.freeze({
    startTitle: "BrainSail",
    startOne: "Sail to rescue your princess. When a brainstorm hits, use a random word to spark a new idea for a creative solution to a problem and calm it.",
    startTwo: "Lateral thinking means solving a problem from a new angle.",
    brainstormTitle: "A Brainstorm hits!",
    instructions: Object.freeze({
      1: "Let’s do some lateral thinking! Pick one word. Use that random word to spark a new way to solve the problem. Type your idea before the clock runs out.",
      2: "Let’s continue our lateral thinking. Pick a word. Same as before, use that random word to ignite a new way to solve the problem. Type your idea before the clock runs out.",
      3: "No choice this time! Your word is ready. Let it provoke a new way to solve the problem. Type your idea before the clock runs out."
    }),
    lockedBox: "Pick a word and let your brainsailing begin with a new idea!",
    done: "Done! Is your answer clear for others to understand?",
    timeUp: "Time’s up! Is your answer clear for others to understand?",
    yes: "Yes, it’s clear", no: "No, not yet", unsure: "Not sure",
    stormCalmed: "Storm calmed! Your new idea cleared the sky. Keep sailing to save your princess.",
    boatSunk: "Oh no! The brainstorm made your boat sink! No worries, your next idea is waiting... same level, with a new problem and new words. A hero never gives up!",
    rescued: (level) => `Princess rescued! Level ${level} complete. Congratulations Hero! Your lateral thinking worked. But oh no! The brainstorms got her again and now she’s stuck on another island! Get ready! The next level has more brainstorms and less time...`,
    gameComplete: "All three levels complete! You did it, hero! Your princess is safe. That was some incredible lateral thinking! Who would have thought that a random word would help you find a creative solution to a problem? Imagine what would happen if you practiced lateral thinking every day...",
    luckyIntro: "You reached your princess without hitting a brainstorm. Lucky you!",
    lucky: Object.freeze({
      1: "To get to Level 2, write down two reasons why lateral thinking is worth learning. You have 30 seconds.",
      2: "To get to Level 3, write down two ways you could apply lateral thinking. You have 30 seconds.",
      3: "To finish the game, give two examples of how you have shown lateral thinking in your life. You have 30 seconds."
    }),
    luckyFailed: "Oh no! Your boat got taken by the brainstorm and it’s out to sea! How will you leave the island with your princess?!? No worries, a hero never gives up! Let’s do it again!",
    pausedSailing: "Paused. Resume when you are ready.",
    pausedThinking: "Paused. Your clock is frozen. Resume when you are ready."
  });

  const STATES = Object.freeze({ READY: "Ready", SAILING: "Sailing", BRAINSTORM: "Brainstorm", LUCKY: "Lucky pass", PAUSED: "Paused", SUNK: "Boat sunk", COMPLETE: "Level complete", GAME_COMPLETE: "Game complete" });

  /*
   * STORM TUNING DATA
   * All editable geometry, visual sizes, hit sizes, and speeds are in this block.
   * Coordinates use the 760 × 440 map. Loops use cx/cy/rx/ry; horizontal sweeps
   * use x1/x2/y/amplitude; vertical sweeps use y1/y2/x/amplitude.
   */
  const STORM_DATA = Object.freeze({
    1: Object.freeze({ visualWidth: 168, visualHeight: 128, hitRadius: 71, paths: Object.freeze([
      { type: "loop", cx: 242, cy: 220, rx: 194, ry: 180, speed: 0.82, startAngle: 0.25 },
      { type: "loop", cx: 380, cy: 218, rx: 210, ry: 183, speed: -0.76, startAngle: 2.15 },
      { type: "loop", cx: 518, cy: 220, rx: 194, ry: 180, speed: 0.88, startAngle: 4.35 }
    ]) }),
    2: Object.freeze({ visualWidth: 176, visualHeight: 134, hitRadius: 80, paths: Object.freeze([
      { type: "loop", cx: 225, cy: 220, rx: 180, ry: 184, speed: 0.94, startAngle: 0.35 },
      { type: "loop", cx: 390, cy: 218, rx: 205, ry: 186, speed: -0.88, startAngle: 2.2 },
      { type: "loop", cx: 555, cy: 220, rx: 180, ry: 184, speed: 1.02, startAngle: 4.25 },
      { type: "horizontal", x1: 88, x2: 672, y: 220, amplitude: 118, speed: 0.76, startAngle: 1.1 }
    ]) }),
    3: Object.freeze({ visualWidth: 180, visualHeight: 138, hitRadius: 61, paths: Object.freeze([
      { type: "loop", cx: 205, cy: 220, rx: 166, ry: 188, speed: 1.04, startAngle: 0.2 },
      { type: "loop", cx: 380, cy: 218, rx: 200, ry: 190, speed: -0.98, startAngle: 2.05 },
      { type: "loop", cx: 555, cy: 220, rx: 166, ry: 188, speed: 1.12, startAngle: 4.4 },
      { type: "loop", cx: 380, cy: 220, rx: 310, ry: 142, speed: -0.74, startAngle: 5.2 },
      { type: "horizontal", x1: 72, x2: 688, y: 140, amplitude: 92, speed: 0.88, startAngle: 0.8 },
      { type: "horizontal", x1: 72, x2: 688, y: 304, amplitude: 88, speed: 0.96, startAngle: 3.5 },
      { type: "vertical", y1: 54, y2: 386, x: 382, amplitude: 154, speed: 0.86, startAngle: 2.4 }
    ]) })
  });
  const LEVELS = Object.freeze({
    1: Object.freeze({ stormCount: 3, wordCount: 3, clockSeconds: 60, storms: STORM_DATA[1] }),
    2: Object.freeze({ stormCount: 4, wordCount: 2, clockSeconds: 45, storms: STORM_DATA[2] }),
    3: Object.freeze({ stormCount: 7, wordCount: 1, clockSeconds: 30, storms: STORM_DATA[3] })
  });
  const MAP = Object.freeze({ width: 760, height: 440, start: { x: 115, y: 365 }, goal: { x: 686, y: 91 }, minX: 42, maxX: 718, minY: 42, maxY: 398, step: 24, goalRadius: 46 });
  /*
   * LEVEL ISLAND ART
   * Decorative SVG paths and princess-island crabs live here. These values do
   * not affect the fixed boat start, rescue zone, collisions, or storm paths.
   */
  const ISLAND_ART = Object.freeze({
    1: Object.freeze({
      heroSand: "M8 398 C8 354 48 334 104 341 C156 348 176 384 150 420 C118 437 43 438 14 420 Z",
      heroLand: "M17 396 C19 362 51 345 101 350 C143 355 158 382 140 411 C108 425 49 427 22 414 Z",
      princessSand: "M610 82 C610 38 662 14 711 27 C748 39 756 77 744 108 C720 139 650 143 616 112 Z",
      princessLand: "M620 80 C622 48 664 25 706 35 C738 44 750 73 735 99 C710 127 654 132 624 106 Z",
      crabs: Object.freeze([{ type: "small", x: 685, y: 104, scale: 0.9 }])
    }),
    2: Object.freeze({
      heroSand: "M8 399 C5 373 22 350 55 340 C81 331 102 338 120 344 C151 348 174 372 165 397 C160 418 131 432 98 434 C62 439 27 429 13 416 Z",
      heroLand: "M18 397 C17 374 34 355 60 349 C83 341 102 348 119 353 C145 357 157 375 154 395 C146 414 122 422 96 424 C65 429 36 420 23 409 Z",
      princessSand: "M610 83 C605 57 623 33 653 23 C680 14 701 23 719 29 C744 38 754 61 752 84 C756 120 738 154 702 169 C661 173 625 148 614 116 Z",
      princessLand: "M620 81 C618 60 634 42 658 33 C680 26 699 33 715 38 C735 45 744 62 743 82 C748 114 733 145 700 158 C666 162 640 142 623 111 Z",
      crabs: Object.freeze([{ type: "small", x: 684, y: 108, scale: 0.86 }, { type: "small", x: 710, y: 128, scale: 0.86 }])
    }),
    3: Object.freeze({
      heroSand: "M8 400 C3 378 17 356 42 346 C65 331 85 339 100 337 C123 336 148 346 158 364 C177 383 165 407 149 419 C127 438 94 432 72 437 C43 439 20 428 13 416 Z",
      heroLand: "M18 397 C14 378 29 360 49 352 C68 341 85 348 101 346 C122 345 142 354 149 369 C163 384 153 403 140 412 C121 426 95 421 72 426 C47 428 29 419 22 408 Z",
      princessSand: "M610 83 C603 62 617 40 640 29 C659 15 681 23 697 22 C721 21 742 34 750 52 C756 73 750 98 742 116 C735 145 710 174 675 181 C640 180 615 158 611 127 Z",
      princessLand: "M620 81 C616 63 629 46 647 37 C663 27 681 33 698 31 C718 31 735 41 742 57 C747 75 741 96 733 112 C726 137 704 160 674 169 C646 168 626 150 622 124 Z",
      crabs: Object.freeze([{ type: "giant", x: 670, y: 134, scale: 1.65 }])
    })
  });
  const GRACE_MS = 1700, LUCKY_SECONDS = 30;
  const banks = window.BRAINSAIL_BANKS;
  if (!banks || !Array.isArray(banks.problems) || !Array.isArray(banks.words)) throw new Error("BrainSail banks are missing.");

  const byId = (id) => document.getElementById(id);
  const screens = {
    [STATES.READY]: byId("ready-screen"), [STATES.SAILING]: byId("sailing-screen"),
    [STATES.BRAINSTORM]: byId("brainstorm-screen"), [STATES.LUCKY]: byId("brainstorm-screen"),
    [STATES.PAUSED]: byId("paused-screen"), [STATES.SUNK]: byId("sunk-screen"),
    [STATES.COMPLETE]: byId("complete-screen"), [STATES.GAME_COMPLETE]: byId("game-complete-screen")
  };
  const uniqueScreens = [...new Set(Object.values(screens))];
  const els = {
    startButton: byId("start-button"), soundToggle: byId("sound-toggle"), soundLabel: byId("sound-label"), seaSoundToggle: byId("sea-sound-toggle"), seaSoundLabel: byId("sea-sound-label"), levelLabel: byId("level-label"), seaMap: byId("sea-map"), boat: byId("boat"), heroIslandSand: byId("hero-island-sand"), heroIslandLand: byId("hero-island-land"), princessIslandSand: byId("princess-island-sand"), princessIslandLand: byId("princess-island-land"), crabLayer: byId("crab-layer"), stormLayer: byId("storm-layer"), fishLayer: byId("fish-layer"), stormCounter: byId("storm-counter"), sailingMessage: byId("sailing-message"), pauseButton: byId("pause-button"), restartButton: byId("restart-button"), brainstormEyebrow: document.querySelector("#brainstorm-screen .eyebrow"), brainstormTitle: byId("brainstorm-title"), brainstormInstructions: byId("brainstorm-instructions"), problemBlock: byId("problem-block"), problemText: byId("problem-text"), wordCards: byId("word-cards"), ideaBox: byId("idea-box"), characterCount: byId("character-count"), finishIdeaButton: byId("finish-idea-button"), clock: byId("clock"), timeUpPanel: byId("time-up-panel"), timeUpQuestion: byId("time-up-question"), yesButton: byId("yes-button"), noButton: byId("no-button"), unsureButton: byId("unsure-button"), pausedMessage: byId("paused-message"), resumeButton: byId("resume-button"), pausedRestartButton: byId("paused-restart-button"), sunkMessage: byId("sunk-message"), tryAgainButton: byId("try-again-button"), completeMessage: byId("complete-message"), nextLevelButton: byId("next-level-button"), gameCompleteMessage: byId("game-complete-message"), playAgainButton: byId("play-again-button")
  };
  const game = { state: STATES.READY, level: 1, boat: { ...MAP.start }, storms: [], calmed: 0, stormHits: 0, currentStormId: null, pendingMoves: [], graceUntil: 0, remainingSeconds: 60, answering: false, lastFrameTime: 0, selectedWord: null, previousProblem: null, previousWordsKey: null, pauseSource: null, challengeType: null, visualTime: 0, nextLightningAt: 2.4, nextFishAt: 1.8, fish: null, fishColorQueue: [], lastTickSecond: null };

  /*
   * SOUND VOLUME TUNING
   * Every gain value lives here. Source gains feed the gentle master gain, so
   * even overlapping effects remain well below clipping. Sea/rain is roughly
   * twice the previous level; effects remain clearly louder than ambience.
   */
  const SOUND_VOLUME = Object.freeze({
    master: 0.13,
    silenceFloor: 0.0001,
    ambience: 0.036,
    rainProximity: 0.10,
    defaultTone: 0.12,
    defaultNoise: 0.08,
    stormBloop: 0.18,
    clockTickTone: 0.040,
    clockTickNoise: 0.026,
    clockTickFrequency: 520,
    urgentTickTone: 0.052,
    urgentTickNoise: 0.032,
    urgentTickFrequency: 690,
    chime: 0.12,
    whistle: 0.15,
    luckyJingle: 0.09,
    trumpet: 0.036,
    trumpetDetune: 7,
    crowdCheer: 0.032,
    drumRoll: 0.027,
    thunder: 0.16,
    fishPlip: 0.065,
    /* MUSIC TUNING: two quiet, synthesized A A B A loops. */
    musicMaster: 0.30,
    musicDuck: 0.40,
    musicReverb: 0.11,
    musicMenuBpm: 84,
    musicSailingBpm: 104,
    musicLookahead: 0.34,
    musicSchedulerMs: 100,
    musicCrossfade: 1.20,
    musicJingleFade: 0.28,
    musicVoiceCap: 28,
    musicVibe: 0.050,
    musicMarimba: 0.048,
    musicBass: 0.040,
    musicStrings: 0.024,
    musicFlute: 0.030,
    musicDrum: 0.034,
    musicShaker: 0.010,
    musicBird: 0.022
  });

  /* Quiet Web Audio synthesis only; no audio files are loaded. */
  const audio = { enabled: false, ctx: null, master: null, ambient: null, ambientGain: null, eventCounts: {}, musicMaster: null, musicDelay: null, musicDelayGain: null, music: null, voices: new Set(), jingleTimer: null };
  function countSound(name) { audio.eventCounts[name] = (audio.eventCounts[name] || 0) + 1; document.body.dataset.lastSound = name; document.body.dataset.soundEvents = JSON.stringify(audio.eventCounts); }
  function ensureAudio() {
    if (audio.ctx) return audio.ctx;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    const ctx = new AudioContext();
    const master = ctx.createGain(); master.gain.value = SOUND_VOLUME.master; master.connect(ctx.destination);
    const musicMaster = ctx.createGain(); musicMaster.gain.value = SOUND_VOLUME.musicMaster; musicMaster.connect(master);
    const delay = ctx.createDelay(.5); delay.delayTime.value = .19; const delayGain = ctx.createGain(); delayGain.gain.value = SOUND_VOLUME.musicReverb;
    delay.connect(delayGain); delayGain.connect(master);
    audio.ctx = ctx; audio.master = master; audio.musicMaster = musicMaster; audio.musicDelay = delay; audio.musicDelayGain = delayGain; return ctx;
  }
  const NOTES = Object.freeze({ B2:123.47, D3:146.83, E3:164.81, Fs3:185, A3:220, B3:246.94, Cs4:277.18, D4:293.66, E4:329.63, Fs4:369.99, Gs4:415.3, A4:440, B4:493.88, Cs5:554.37, D5:587.33, E5:659.25, Fs5:739.99, Gs5:830.61, A5:880, B5:987.77 });
  const MUSIC = Object.freeze({
    menu: { bpm: SOUND_VOLUME.musicMenuBpm, bars: 32, form: "AABA" },
    sailing: { bpm: SOUND_VOLUME.musicSailingBpm, bars: 32, form: "AABA" }
  });
  function musicLoopSeconds(theme) { const data = MUSIC[theme]; return data.bars * 4 * 60 / data.bpm; }
  function registerVoice(sources, output) {
    if (audio.voices.size >= SOUND_VOLUME.musicVoiceCap) { sources.forEach((source) => { try { source.disconnect(); } catch (_) {} }); return false; }
    const voice = { sources, output }; audio.voices.add(voice);
    const last = sources[sources.length - 1]; last.addEventListener("ended", () => { audio.voices.delete(voice); try { output.disconnect(); } catch (_) {} }, { once: true });
    return true;
  }
  function synthNote(frequency, when, duration, gainValue, options = {}) {
    if (!audio.music || !audio.ctx) return;
    const ctx = audio.ctx; const gain = ctx.createGain(); const filter = ctx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = options.filter || 4200;
    const oscillator = ctx.createOscillator(); oscillator.type = options.type || "sine"; oscillator.frequency.setValueAtTime(frequency, when);
    if (options.pitchEnd) oscillator.frequency.exponentialRampToValueAtTime(options.pitchEnd, when + duration * .7);
    gain.gain.setValueAtTime(SOUND_VOLUME.silenceFloor, when); gain.gain.linearRampToValueAtTime(gainValue, when + (options.attack || .012)); gain.gain.exponentialRampToValueAtTime(SOUND_VOLUME.silenceFloor, when + duration);
    oscillator.connect(filter); filter.connect(gain); gain.connect(audio.music.bus); if (options.echo) gain.connect(audio.musicDelay);
    if (!registerVoice([oscillator], gain)) return; oscillator.start(when); oscillator.stop(when + duration + .03);
  }
  function synthStrings(frequencies, when, duration) {
    if (!audio.music || !audio.ctx || audio.voices.size >= SOUND_VOLUME.musicVoiceCap) return;
    const ctx = audio.ctx; const gain = ctx.createGain(); const filter = ctx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = 1250;
    gain.gain.setValueAtTime(SOUND_VOLUME.silenceFloor, when); gain.gain.linearRampToValueAtTime(SOUND_VOLUME.musicStrings, when + .34); gain.gain.exponentialRampToValueAtTime(SOUND_VOLUME.silenceFloor, when + duration);
    const sources = frequencies.map((frequency, index) => { const oscillator = ctx.createOscillator(); oscillator.type = "sawtooth"; oscillator.frequency.value = frequency; oscillator.detune.value = index % 2 ? 5 : -5; oscillator.connect(filter); return oscillator; });
    filter.connect(gain); gain.connect(audio.music.bus); gain.connect(audio.musicDelay); if (!registerVoice(sources, gain)) return; sources.forEach((source) => { source.start(when); source.stop(when + duration + .03); });
  }
  function synthNoise(when, duration, gainValue, frequency) {
    if (!audio.music || !audio.ctx || audio.voices.size >= SOUND_VOLUME.musicVoiceCap) return;
    const ctx = audio.ctx; const frames = Math.max(1, Math.floor(ctx.sampleRate * duration)); const buffer = ctx.createBuffer(1, frames, ctx.sampleRate); const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const source = ctx.createBufferSource(); source.buffer = buffer; const filter = ctx.createBiquadFilter(); filter.type = "highpass"; filter.frequency.value = frequency; const gain = ctx.createGain(); gain.gain.setValueAtTime(gainValue, when); gain.gain.exponentialRampToValueAtTime(SOUND_VOLUME.silenceFloor, when + duration);
    source.connect(filter); filter.connect(gain); gain.connect(audio.music.bus); if (!registerVoice([source], gain)) return; source.start(when); source.stop(when + duration + .02);
  }
  function scheduleMenu(step, when, beat) {
    const section = Math.floor(step / 128); const local = step % 128; const eighth = local % 8 === 0; const quarter = local % 16 === 0; const bar = Math.floor(local / 16);
    const a = [NOTES.B4, NOTES.Cs5, NOTES.E5, NOTES.Fs5, NOTES.E5, NOTES.Cs5, NOTES.A4, NOTES.B4];
    const b = [NOTES.E5, NOTES.Fs5, NOTES.A5, NOTES.Gs5, NOTES.Fs5, NOTES.E5, NOTES.D5, NOTES.B4]; const melody = section === 2 ? b : a;
    if (eighth) {
      const note = melody[(local / 8) % 8];
      synthNote(note, when, beat * .8, SOUND_VOLUME.musicVibe, { type: "sine", echo: true });
      if (local % 16 === 8) synthNote(note * 2, when, beat * .34, SOUND_VOLUME.musicMarimba * .38, { type: "triangle", filter: 3200 });
    }
    if (quarter && local % 64 === 0) synthStrings(section === 2 ? [NOTES.E3, NOTES.B3, NOTES.Fs4] : [NOTES.B2, NOTES.Fs3, NOTES.Cs4], when, beat * 3.7);
    if (local % 16 === 4 || local % 16 === 12) synthNote(105, when, .10, SOUND_VOLUME.musicDrum, { type: "triangle", pitchEnd: 72, filter: 650 });
    if (local % 8 === 4) synthNoise(when, .045, SOUND_VOLUME.musicShaker, 4800);
    if (bar === 6 && local % 16 === 8) synthNote(NOTES.B5, when, beat * 1.4, SOUND_VOLUME.musicBird, { type: "sine", pitchEnd: NOTES.E5, echo: true });
  }
  function scheduleSailing(step, when, beat) {
    const section = Math.floor(step / 128); const local = step % 128; const eighth = local % 8 === 0; const quarter = local % 16 === 0;
    const a = [NOTES.B4, NOTES.Fs4, NOTES.Cs5, NOTES.E5, NOTES.Fs5, NOTES.E5, NOTES.Cs5, NOTES.A4];
    const b = [NOTES.E5, NOTES.B4, NOTES.Fs5, NOTES.A5, NOTES.Gs5, NOTES.Fs5, NOTES.D5, NOTES.B4]; const melody = section === 2 ? b : a;
    if (eighth) synthNote(melody[(local / 8) % 8], when, beat * .55, SOUND_VOLUME.musicMarimba, { type: "triangle", filter: 2800, echo: true });
    if (quarter) synthNote(section === 2 ? NOTES.E3 : (local % 64 < 32 ? NOTES.B2 : NOTES.A3), when, beat * .72, SOUND_VOLUME.musicBass, { type: "triangle", filter: 520 });
    if (local % 16 === 4 || local % 16 === 10) synthNote(150, when, .09, SOUND_VOLUME.musicDrum, { type: "triangle", pitchEnd: 88, filter: 780 });
    if (local % 8 === 4) synthNoise(when, .04, SOUND_VOLUME.musicShaker, 5200);
    if (local % 64 === 0) synthStrings(section === 2 ? [NOTES.E3, NOTES.B3, NOTES.Fs4] : [NOTES.B2, NOTES.Fs3, NOTES.Cs4], when, beat * 1.8);
    if (section === 2 && local % 32 === 16) synthNote([NOTES.B5, NOTES.A5, NOTES.Fs5, NOTES.E5][Math.floor(local / 32)], when, beat * 1.6, SOUND_VOLUME.musicFlute, { type: "sine", echo: true });
  }
  function runMusicScheduler() {
    const player = audio.music; if (!player || !audio.ctx) return;
    while (player.nextTime < audio.ctx.currentTime + SOUND_VOLUME.musicLookahead) {
      const beat = 60 / player.bpm; if (player.theme === "menu") scheduleMenu(player.step, player.nextTime, beat); else scheduleSailing(player.step, player.nextTime, beat);
      player.step = (player.step + 1) % 512; player.nextTime += beat / 4;
    }
  }
  function setMusicLevel(level, seconds = .18) {
    if (!audio.musicMaster || !audio.ctx) return; const now = audio.ctx.currentTime; const target = SOUND_VOLUME.musicMaster * level;
    audio.musicMaster.gain.cancelScheduledValues(now); audio.musicMaster.gain.setValueAtTime(Math.max(SOUND_VOLUME.silenceFloor, audio.musicMaster.gain.value), now); audio.musicMaster.gain.linearRampToValueAtTime(target, now + seconds); document.body.dataset.musicLevel = String(level);
  }
  function stopMusic(fade = .12) {
    const player = audio.music; if (!player) return; clearInterval(player.timer); const now = audio.ctx.currentTime; player.bus.gain.cancelScheduledValues(now); player.bus.gain.setValueAtTime(player.bus.gain.value, now); player.bus.gain.linearRampToValueAtTime(SOUND_VOLUME.silenceFloor, now + fade); window.setTimeout(() => { try { player.bus.disconnect(); } catch (_) {} }, (fade + .1) * 1000); audio.music = null; document.body.dataset.musicTheme = "stopped"; document.body.dataset.musicScheduler = "stopped";
  }
  function startMusic(theme) {
    if (!audio.enabled) return; const ctx = ensureAudio(); if (!ctx || !MUSIC[theme]) return;
    if (audio.music && audio.music.theme === theme) { setMusicLevel([STATES.BRAINSTORM, STATES.LUCKY].includes(game.state) ? SOUND_VOLUME.musicDuck : 1); return; }
    const old = audio.music; const bus = ctx.createGain(); const now = ctx.currentTime; bus.gain.setValueAtTime(SOUND_VOLUME.silenceFloor, now); bus.gain.linearRampToValueAtTime(1, now + SOUND_VOLUME.musicCrossfade); bus.connect(audio.musicMaster); bus.connect(audio.musicDelay);
    const player = { theme, bpm: MUSIC[theme].bpm, bus, step: 0, nextTime: now + .06, timer: null }; audio.music = player; runMusicScheduler(); player.timer = window.setInterval(runMusicScheduler, SOUND_VOLUME.musicSchedulerMs);
    if (old) { clearInterval(old.timer); old.bus.gain.cancelScheduledValues(now); old.bus.gain.setValueAtTime(old.bus.gain.value, now); old.bus.gain.linearRampToValueAtTime(SOUND_VOLUME.silenceFloor, now + SOUND_VOLUME.musicCrossfade); window.setTimeout(() => { try { old.bus.disconnect(); } catch (_) {} }, (SOUND_VOLUME.musicCrossfade + .1) * 1000); }
    document.body.dataset.musicTheme = theme; document.body.dataset.musicLoopSeconds = musicLoopSeconds(theme).toFixed(3); document.body.dataset.musicForm = MUSIC[theme].form; document.body.dataset.musicScheduler = "running";
    setMusicLevel([STATES.BRAINSTORM, STATES.LUCKY].includes(game.state) ? SOUND_VOLUME.musicDuck : 1);
  }
  function syncMusicForState() {
    if (!audio.enabled || game.state === STATES.PAUSED) { stopMusic(); return; }
    startMusic(game.state === STATES.READY ? "menu" : "sailing");
    setMusicLevel([STATES.BRAINSTORM, STATES.LUCKY].includes(game.state) ? SOUND_VOLUME.musicDuck : 1);
  }
  function fadeMusicForJingle(holdMilliseconds = 1500) {
    if (!audio.music) return; setMusicLevel(0, SOUND_VOLUME.musicJingleFade); clearTimeout(audio.jingleTimer); audio.jingleTimer = window.setTimeout(() => { if (audio.enabled && game.state !== STATES.PAUSED) setMusicLevel(1, SOUND_VOLUME.musicJingleFade); }, holdMilliseconds);
  }
  function tone(frequency, duration, options = {}) {
    if (!audio.enabled) return;
    const ctx = ensureAudio(); if (!ctx) return;
    const when = ctx.currentTime + (options.delay || 0); const oscillator = ctx.createOscillator(); const gain = ctx.createGain();
    oscillator.type = options.type || "sine"; oscillator.frequency.setValueAtTime(frequency, when);
    if (options.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(options.endFrequency, when + duration);
    gain.gain.setValueAtTime(SOUND_VOLUME.silenceFloor, when); gain.gain.exponentialRampToValueAtTime(options.gain || SOUND_VOLUME.defaultTone, when + 0.018);
    gain.gain.exponentialRampToValueAtTime(SOUND_VOLUME.silenceFloor, when + duration); oscillator.connect(gain); gain.connect(audio.master);
    oscillator.start(when); oscillator.stop(when + duration + 0.03);
  }
  function noise(duration, options = {}) {
    if (!audio.enabled) return;
    const ctx = ensureAudio(); if (!ctx) return;
    const frames = Math.max(1, Math.floor(ctx.sampleRate * duration)); const buffer = ctx.createBuffer(1, frames, ctx.sampleRate); const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const source = ctx.createBufferSource(); source.buffer = buffer; const filter = ctx.createBiquadFilter(); filter.type = options.filter || "lowpass"; filter.frequency.value = options.frequency || 480;
    const gain = ctx.createGain(); gain.gain.value = options.gain || SOUND_VOLUME.defaultNoise; source.connect(filter); filter.connect(gain); gain.connect(audio.master); source.start();
  }
  function playSound(name, options = {}) {
    if (!audio.enabled) return; countSound(name);
    if (name === "stormHit") tone(210, .42, { type: "sine", endFrequency: 82, gain: SOUND_VOLUME.stormBloop });
    if (name === "tick") {
      const urgent = Boolean(options.urgent); const frequency = urgent ? SOUND_VOLUME.urgentTickFrequency : SOUND_VOLUME.clockTickFrequency;
      tone(frequency, .052, { type: "sine", gain: urgent ? SOUND_VOLUME.urgentTickTone : SOUND_VOLUME.clockTickTone });
      noise(.026, { filter: "bandpass", frequency: frequency * 1.7, gain: urgent ? SOUND_VOLUME.urgentTickNoise : SOUND_VOLUME.clockTickNoise });
    }
    if (name === "yes") { [523, 659, 784].forEach((f, i) => tone(f, .34, { type: "sine", gain: SOUND_VOLUME.chime, delay: i * .11 })); }
    if (name === "sink") tone(620, .72, { type: "triangle", endFrequency: 105, gain: SOUND_VOLUME.whistle });
    if (name === "lucky") { [880, 1175, 1320].forEach((f, i) => tone(f, .28, { type: "sine", gain: SOUND_VOLUME.luckyJingle, delay: i * .075 })); }
    if (name === "thunder") noise(.62, { filter: "lowpass", frequency: 180, gain: SOUND_VOLUME.thunder });
    if (name === "fish") tone(540, .12, { type: "sine", endFrequency: 820, gain: SOUND_VOLUME.fishPlip });
  }
  function brassNote(frequency, delay, duration, gainValue = SOUND_VOLUME.trumpet) {
    if (!audio.enabled) return; const ctx = ensureAudio(); if (!ctx) return; const when = ctx.currentTime + delay; const filter = ctx.createBiquadFilter(); const gain = ctx.createGain();
    filter.type = "lowpass"; filter.frequency.setValueAtTime(1100, when); filter.frequency.linearRampToValueAtTime(3400, when + .08); filter.frequency.exponentialRampToValueAtTime(1500, when + duration);
    gain.gain.setValueAtTime(SOUND_VOLUME.silenceFloor, when); gain.gain.linearRampToValueAtTime(gainValue, when + .045); gain.gain.exponentialRampToValueAtTime(SOUND_VOLUME.silenceFloor, when + duration);
    [-SOUND_VOLUME.trumpetDetune, 0, SOUND_VOLUME.trumpetDetune].forEach((detune) => { const oscillator = ctx.createOscillator(); oscillator.type = "sawtooth"; oscillator.frequency.value = frequency; oscillator.detune.value = detune; oscillator.connect(filter); oscillator.start(when); oscillator.stop(when + duration + .03); });
    filter.connect(gain); gain.connect(audio.master);
  }
  function celebrationNoise(delay, duration, gainValue, frequency = 900) {
    if (!audio.enabled) return; const ctx = ensureAudio(); if (!ctx) return; const frames = Math.max(1, Math.floor(ctx.sampleRate * duration)); const buffer = ctx.createBuffer(1, frames, ctx.sampleRate); const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * (.55 + Math.random() * .45);
    const source = ctx.createBufferSource(); const filter = ctx.createBiquadFilter(); const gain = ctx.createGain(); const when = ctx.currentTime + delay; source.buffer = buffer; filter.type = "bandpass"; filter.frequency.value = frequency; filter.Q.value = .55;
    gain.gain.setValueAtTime(SOUND_VOLUME.silenceFloor, when); gain.gain.linearRampToValueAtTime(gainValue, when + .08); gain.gain.exponentialRampToValueAtTime(SOUND_VOLUME.silenceFloor, when + duration); source.connect(filter); filter.connect(gain); gain.connect(audio.master); source.start(when); source.stop(when + duration + .02);
  }
  function playCelebration(grand = false) {
    if (!audio.enabled) return; countSound(grand ? "gameFanfare" : "levelFanfare"); const hold = grand ? 7200 : 3800; fadeMusicForJingle(hold);
    const phrase = grand
      ? [[392,0,.38],[494,.42,.38],[587,.84,.58],[523,1.5,.34],[659,1.88,.42],[784,2.34,.82],[587,3.35,.32],[659,3.7,.32],[784,4.05,.38],[988,4.52,1.25]]
      : [[392,0,.34],[494,.38,.34],[587,.76,.5],[523,1.42,.3],[659,1.78,.38],[784,2.22,.82]];
    phrase.forEach(([frequency, delay, duration]) => brassNote(frequency, delay, duration));
    if (grand) { for (let i = 0; i < 22; i += 1) celebrationNoise(i * .11, .075, SOUND_VOLUME.drumRoll, 180); celebrationNoise(4.45, 2.2, SOUND_VOLUME.crowdCheer * 1.18, 1150); }
    else celebrationNoise(2.15, 1.35, SOUND_VOLUME.crowdCheer, 1050);
  }
  function makeLoopingNoise() {
    const ctx = ensureAudio(); if (!ctx) return null;
    const frames = ctx.sampleRate * 2; const buffer = ctx.createBuffer(1, frames, ctx.sampleRate); const data = buffer.getChannelData(0);
    let smooth = 0; for (let i = 0; i < frames; i += 1) { smooth = smooth * .96 + (Math.random() * 2 - 1) * .04; data[i] = smooth; }
    const source = ctx.createBufferSource(); source.buffer = buffer; source.loop = true; return source;
  }
  function startAmbient() {
    if (!audio.enabled || audio.ambient || game.state !== STATES.SAILING) return;
    const ctx = ensureAudio(); if (!ctx) return; const source = makeLoopingNoise(); const filter = ctx.createBiquadFilter(); const gain = ctx.createGain();
    filter.type = "bandpass"; filter.frequency.value = 620; filter.Q.value = .45; gain.gain.value = SOUND_VOLUME.ambience;
    source.connect(filter); filter.connect(gain); gain.connect(audio.master); source.start(); audio.ambient = source; audio.ambientGain = gain; document.body.dataset.ambient = "running";
  }
  function stopAmbient() { if (audio.ambient) { try { audio.ambient.stop(); } catch (_) {} } audio.ambient = null; audio.ambientGain = null; document.body.dataset.ambient = "stopped"; }
  function stopLoops() { stopAmbient(); }
  function syncSoundForState() {
    stopLoops(); if (!audio.enabled) { stopMusic(); return; }
    if (game.state === STATES.SAILING) startAmbient();
    syncMusicForState();
  }
  function setSoundEnabled(enabled) {
    audio.enabled = enabled; els.soundToggle.checked = enabled; els.seaSoundToggle.checked = enabled;
    document.body.dataset.soundEnabled = String(enabled);
    els.soundLabel.textContent = `Sound: ${enabled ? "On" : "Off"}`; els.seaSoundLabel.textContent = `Sound: ${enabled ? "On" : "Off"}`;
    if (enabled) { const ctx = ensureAudio(); if (ctx) ctx.resume().then(() => { document.body.dataset.audioState = ctx.state; }); syncSoundForState(); }
    else { stopLoops(); stopMusic(); if (audio.ctx) audio.ctx.suspend().then(() => { document.body.dataset.audioState = audio.ctx.state; }); else document.body.dataset.audioState = "not-created"; }
  }
  function pauseAllSound() { stopLoops(); stopMusic(); if (audio.ctx && audio.ctx.state === "running") audio.ctx.suspend().then(() => { document.body.dataset.audioState = audio.ctx.state; }); }
  function resumeAllSound() { if (!audio.enabled || !audio.ctx) return; audio.ctx.resume().then(() => { document.body.dataset.audioState = audio.ctx.state; syncSoundForState(); }); }

  function showState(nextState) {
    game.state = nextState;
    if ([STATES.BRAINSTORM, STATES.LUCKY].includes(nextState)) {
      if (game.fish) { game.fish.element.remove(); game.fish = null; }
      game.storms.forEach((storm) => { storm.strikeUntil = 0; storm.element.classList.remove("is-striking"); });
    }
    document.body.classList.toggle("motion-stopped", nextState !== STATES.SAILING);
    uniqueScreens.forEach((screen) => { const active = screen === screens[nextState]; screen.hidden = !active; screen.inert = !active; screen.setAttribute("aria-hidden", active ? "false" : "true"); });
    syncSoundForState();
  }
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const distance = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  function formatClock(seconds) { const whole = Math.max(0, Math.ceil(seconds)); return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`; }
  function setBoatPosition() { els.boat.setAttribute("transform", `translate(${game.boat.x} ${game.boat.y})`); }
  function crabMarkup(crab) {
    const sizeClass = crab.type === "giant" ? "giant-crab" : "small-crab";
    return `<g class="crab ${sizeClass}" transform="translate(${crab.x} ${crab.y}) scale(${crab.scale})" stroke-linecap="round" stroke-linejoin="round"><g class="crab-claw crab-claw-left"><path class="crab-arm" d="M-9 3 C-14 -1 -16 -7 -15 -12"></path><path class="crab-pincer" d="M-15 -12 C-18 -14 -19 -19 -17 -21 C-14 -22 -12 -19 -13 -16 Z"></path><path class="crab-pincer" d="M-15 -11 C-18 -9 -19 -6 -17 -4 C-14 -3 -11 -6 -12 -9 Z"></path><path class="crab-claw-tip" d="M-17 -21 Q-19 -19 -18 -16 L-15 -17 Q-15 -20 -17 -21 Z M-17 -4 Q-19 -5 -18 -8 L-15 -9 Q-15 -5 -17 -4 Z"></path></g><g class="crab-claw crab-claw-right"><path class="crab-arm" d="M9 3 C14 -1 16 -7 15 -12"></path><path class="crab-pincer" d="M15 -12 C18 -14 19 -19 17 -21 C14 -22 12 -19 13 -16 Z"></path><path class="crab-pincer" d="M15 -11 C18 -9 19 -6 17 -4 C14 -3 11 -6 12 -9 Z"></path><path class="crab-claw-tip" d="M17 -21 Q19 -19 18 -16 L15 -17 Q15 -20 17 -21 Z M17 -4 Q19 -5 18 -8 L15 -9 Q15 -5 17 -4 Z"></path></g><path class="crab-body" d="M-12 2 Q0 -11 12 2 L11 9 Q0 15 -11 9 Z"></path><path class="crab-legs" d="M-9 5 l-5 1 l-3 3 M-9 8 l-5 3 l-3 2 M-6 10 l-4 3 l-2 2 M9 5 l5 1 l3 3 M9 8 l5 3 l3 2 M6 10 l4 3 l2 2"></path><path class="crab-highlight" d="M-7 8 q7 4 14 0 M-16 -17 l3 -1 M13 -18 l3 1"></path><circle class="crab-eye" cx="-4" cy="0" r="3"></circle><circle class="crab-eye" cx="4" cy="0" r="3"></circle><circle class="crab-pupil" cx="-4" cy="0" r="1.15"></circle><circle class="crab-pupil" cx="4" cy="0" r="1.15"></circle><path class="crab-brow" d="M-8 -5 L-2 -2 M2 -2 L8 -5"></path><path class="crab-frown" d="M-5 8 Q0 2 5 8"></path><path class="crab-mouthparts" d="M-4 9 L-2 12 L0 9 L2 12 L4 9 L3 13 Q0 15 -3 13 Z"></path></g>`;
  }
  function updateIslandArt() {
    const art = ISLAND_ART[game.level];
    els.heroIslandSand.setAttribute("d", art.heroSand); els.heroIslandLand.setAttribute("d", art.heroLand);
    els.princessIslandSand.setAttribute("d", art.princessSand); els.princessIslandLand.setAttribute("d", art.princessLand);
    els.crabLayer.innerHTML = art.crabs.map(crabMarkup).join("");
    els.crabLayer.dataset.level = String(game.level);
  }
  function stormPoint(path, phase) {
    if (path.type === "loop") return { x: path.cx + Math.cos(phase) * path.rx, y: path.cy + Math.sin(phase) * path.ry };
    const wave = Math.sin(phase), cross = Math.sin(phase * 2 + 0.7);
    if (path.type === "horizontal") return { x: path.x1 + ((wave + 1) / 2) * (path.x2 - path.x1), y: path.y + cross * path.amplitude };
    return { x: path.x + cross * path.amplitude, y: path.y1 + ((wave + 1) / 2) * (path.y2 - path.y1) };
  }
  function createStorms() {
    els.stormLayer.replaceChildren(); const tuning = LEVELS[game.level].storms;
    game.storms = tuning.paths.map((path, index) => {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g"); group.classList.add("storm"); group.dataset.stormId = String(index);
      const x = -tuning.visualWidth / 2, y = -tuning.visualHeight / 2;
      group.innerHTML = `<ellipse class="storm-shadow" cx="0" cy="${Math.round(tuning.visualHeight * .32)}" rx="${Math.round(tuning.visualWidth * .32)}" ry="10"></ellipse><g class="storm-art"><use class="cloud-art" href="#bs-cloud" x="${x}" y="${y}" width="${tuning.visualWidth}" height="${tuning.visualHeight}"></use><use class="lightning-bolt" href="#bs-bolt" x="${x}" y="${y}" width="${tuning.visualWidth}" height="${tuning.visualHeight}"></use></g>`;
      els.stormLayer.appendChild(group); return { id: index, path, phase: path.startAngle, x: 0, y: 0, active: true, element: group };
    }); positionStorms();
  }
  function positionStorms() { game.storms.forEach((storm) => { const p = stormPoint(storm.path, storm.phase); storm.x = p.x; storm.y = p.y; storm.element.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`); }); }
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const FISH_COLORS = Object.freeze([
    { name: "white", fill: "#FBF8F1", spot: "#E95B4E" }, { name: "red", fill: "#E95B4E", spot: "#FBF8F1" },
    { name: "black", fill: "#1B1B1B", spot: "#F7D154" }, { name: "yellow", fill: "#F7D154", spot: "#E95B4E" },
    { name: "green", fill: "#3C9D57", spot: "#FBF8F1" }
  ]);
  const FISH_PHRASES = Object.freeze(["You can do it!", "Think laterally!", "Think outside the box!", "Think differently!"]);
  function refillFishColors() {
    game.fishColorQueue = [...FISH_COLORS];
    for (let i = game.fishColorQueue.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [game.fishColorQueue[i], game.fishColorQueue[j]] = [game.fishColorQueue[j], game.fishColorQueue[i]]; }
  }
  function fishStartPoint(direction) {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const x = direction > 0 ? 120 + Math.random() * 400 : 240 + Math.random() * 400, y = 125 + Math.random() * 205;
      const samples = [0, .25, .5, .75, 1].map((progress) => ({ x: x + direction * 86 * progress, y: y - Math.sin(progress * Math.PI) * 54 }));
      const clearBoat = samples.every((point) => distance(point.x, point.y, game.boat.x, game.boat.y) > 120);
      const clearStorms = samples.every((point) => game.storms.every((storm) => !storm.active || distance(point.x, point.y, storm.x, storm.y) > 112));
      if (clearBoat && clearStorms) return { x, y };
    }
    return { x: direction > 0 ? 240 : 520, y: 382 };
  }
  function launchFish(forcedColor) {
    if (game.state !== STATES.SAILING || reducedMotion.matches || game.fish) return;
    if (!game.fishColorQueue.length) refillFishColors();
    let color = game.fishColorQueue.shift();
    if (forcedColor) color = FISH_COLORS.find((item) => item.name === forcedColor) || color;
    const direction = Math.random() < .5 ? -1 : 1, start = fishStartPoint(direction), phrase = FISH_PHRASES[Math.floor(Math.random() * FISH_PHRASES.length)];
    const element = document.createElementNS("http://www.w3.org/2000/svg", "g"); element.classList.add("fish"); element.dataset.color = color.name; element.dataset.direction = direction > 0 ? "right" : "left"; element.dataset.phrase = phrase;
    element.innerHTML = `<g class="fish-shape" transform="scale(${direction} 1)"><ellipse class="fish-body" cx="0" cy="0" rx="18" ry="10" fill="${color.fill}"></ellipse><path class="fish-body" d="M-16 0 L-30 -11 L-28 11 Z" fill="${color.fill}"></path><circle class="fish-spot" cx="6" cy="1" r="3.2" fill="${color.spot}"></circle><circle class="fish-eye" cx="11" cy="-3" r="4" fill="#FFFFFF"></circle><circle class="fish-pupil" cx="12" cy="-3" r="1.7" fill="#1B1B1B"></circle><path class="fish-smile" d="M8 3 Q13 8 17 3" fill="none"></path></g><g class="fish-speech"><rect x="-68" y="-52" width="136" height="28" rx="10"></rect><path d="M-7 -25 L1 -14 L9 -25 Z"></path><text x="0" y="-34" text-anchor="middle">${phrase}</text></g><ellipse class="fish-splash" cx="0" cy="0" rx="22" ry="6"></ellipse>`;
    els.fishLayer.replaceChildren(element); game.fish = { element, color: color.name, phrase, startX: start.x, startY: start.y, direction, startTime: game.visualTime, splashed: false };
  }
  function updateFish() {
    if (!game.fish) { if (game.visualTime >= game.nextFishAt) { launchFish(); game.nextFishAt = game.visualTime + 2.6 + Math.random() * 2.5; } return; }
    const fish = game.fish, elapsed = game.visualTime - fish.startTime, progress = elapsed / 1.25;
    if (progress <= 1) {
      const x = fish.startX + fish.direction * 86 * progress, y = fish.startY - Math.sin(progress * Math.PI) * 54;
      const tooClose = distance(x, y, game.boat.x, game.boat.y) < 62 || game.storms.some((storm) => storm.active && distance(x, y, storm.x, storm.y) < 72);
      if (tooClose) { fish.element.remove(); game.fish = null; game.nextFishAt = game.visualTime + 1.1; return; }
      fish.element.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    } else if (progress <= 1.36) {
      if (!fish.splashed) { fish.splashed = true; fish.element.classList.add("is-splashing"); playSound("fish"); }
    } else { fish.element.remove(); game.fish = null; }
  }
  function updateLightning() {
    game.storms.forEach((storm) => { storm.element.classList.toggle("is-striking", Boolean(storm.strikeUntil && game.visualTime < storm.strikeUntil)); });
    if (game.visualTime < game.nextLightningAt) return;
    const active = game.storms.filter((storm) => storm.active); if (!active.length) return;
    const storm = active[Math.floor(Math.random() * active.length)]; storm.strikeUntil = game.visualTime + .38; storm.element.classList.add("is-striking");
    game.nextLightningAt = game.visualTime + 2.2 + Math.random() * 3.4; playSound("thunder");
  }
  function updateRainDistance() {
    if (!audio.ambientGain || !game.storms.length) return;
    const nearest = Math.min(...game.storms.filter((storm) => storm.active).map((storm) => distance(game.boat.x, game.boat.y, storm.x, storm.y)), 500);
    const closeness = clamp(1 - nearest / 260, 0, 1); const target = SOUND_VOLUME.ambience + closeness * SOUND_VOLUME.rainProximity; audio.ambientGain.gain.setTargetAtTime(target, audio.ctx.currentTime, .12); document.body.dataset.rainGain = target.toFixed(4);
  }
  function updateLabels() { els.levelLabel.textContent = `Level ${game.level} of 3`; els.stormCounter.textContent = `Storms calmed ${game.calmed} of ${LEVELS[game.level].stormCount}`; }
  function resetChallengeUi() { game.answering = false; game.selectedWord = null; els.ideaBox.value = ""; els.characterCount.textContent = "0 / 500"; els.finishIdeaButton.hidden = false; els.finishIdeaButton.disabled = true; els.timeUpPanel.hidden = true; }
  function resetLevel() {
    Object.assign(game.boat, MAP.start); game.calmed = 0; game.stormHits = 0; game.currentStormId = null; game.pendingMoves.length = 0; game.graceUntil = performance.now() + GRACE_MS; game.remainingSeconds = LEVELS[game.level].clockSeconds; game.challengeType = null; game.visualTime = 0; game.nextLightningAt = 2.4; game.nextFishAt = 1.8; game.fish = null; game.lastTickSecond = null; els.fishLayer.replaceChildren(); resetChallengeUi();
    els.sailingMessage.textContent = "Steer around the storms and reach your princess."; setBoatPosition(); updateIslandArt(); createStorms(); updateLabels();
  }
  function startLevel(level = game.level) { game.level = clamp(level, 1, 3); resetLevel(); showState(STATES.SAILING); requestAnimationFrame(() => els.seaMap.focus({ preventScroll: true })); }
  function queueMove(direction) { if (game.state === STATES.SAILING) game.pendingMoves.push(direction); }
  function applyPendingMoves() {
    while (game.pendingMoves.length) { const d = game.pendingMoves.shift(); if (d === "left") game.boat.x -= MAP.step; if (d === "right") game.boat.x += MAP.step; if (d === "up") game.boat.y -= MAP.step; if (d === "down") game.boat.y += MAP.step; game.boat.x = clamp(game.boat.x, MAP.minX, MAP.maxX); game.boat.y = clamp(game.boat.y, MAP.minY, MAP.maxY); } setBoatPosition();
  }
  function checkSailingEvents(now) {
    if (distance(game.boat.x, game.boat.y, MAP.goal.x, MAP.goal.y) <= MAP.goalRadius) { if (game.stormHits === 0) openLuckyPass(); else completeLevel(); return; }
    if (now < game.graceUntil) return; const radius = LEVELS[game.level].storms.hitRadius;
    const hit = game.storms.find((s) => s.active && distance(game.boat.x, game.boat.y, s.x, s.y) <= radius); if (hit) openBrainstorm(hit.id);
  }
  function pickDifferentProblem() { const choices = banks.problems.filter((p) => p !== game.previousProblem); const pool = choices.length ? choices : banks.problems; game.previousProblem = pool[Math.floor(Math.random() * pool.length)]; return game.previousProblem; }
  function drawWords(count) {
    let selected, key, attempts = 0; do { const pool = [...banks.words]; selected = []; while (selected.length < count) selected.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]); key = [...selected].sort().join("|"); attempts += 1; } while (key === game.previousWordsKey && attempts < 20); game.previousWordsKey = key; return selected;
  }
  function renderWordCards(words, preselect = false) {
    els.wordCards.replaceChildren(); words.forEach((word) => { const button = document.createElement("button"); button.type = "button"; button.className = "word-card"; button.textContent = word; button.setAttribute("aria-pressed", "false"); button.addEventListener("click", () => selectWord(button, word)); els.wordCards.appendChild(button); if (preselect) selectWord(button, word); });
  }
  function selectWord(selectedButton, word) {
    if (game.state !== STATES.BRAINSTORM || game.remainingSeconds <= 0 || game.answering) return; game.selectedWord = word;
    [...els.wordCards.children].forEach((button) => { const chosen = button === selectedButton; button.classList.toggle("is-chosen", chosen); button.classList.toggle("is-dimmed", !chosen); button.setAttribute("aria-pressed", String(chosen)); });
    els.ideaBox.disabled = false; els.ideaBox.placeholder = "Type your idea here..."; updateFinishButton();
  }
  function updateFinishButton() { const ready = game.challengeType === STATES.LUCKY || Boolean(game.selectedWord); els.finishIdeaButton.disabled = !ready || els.ideaBox.value.length === 0 || game.answering; }
  function prepareChallenge(seconds) { game.remainingSeconds = seconds; game.lastTickSecond = Math.ceil(seconds); resetChallengeUi(); els.clock.textContent = formatClock(seconds); els.ideaBox.placeholder = MESSAGES.lockedBox; els.ideaBox.disabled = true; }
  function openBrainstorm(stormId) {
    game.challengeType = STATES.BRAINSTORM; game.currentStormId = stormId; game.stormHits += 1; prepareChallenge(LEVELS[game.level].clockSeconds);
    els.brainstormEyebrow.textContent = `Level ${game.level} of 3`; els.brainstormTitle.textContent = MESSAGES.brainstormTitle; els.brainstormInstructions.textContent = MESSAGES.instructions[game.level]; els.problemBlock.hidden = false; els.wordCards.hidden = false; els.problemText.textContent = pickDifferentProblem(); showState(STATES.BRAINSTORM);
    renderWordCards(drawWords(LEVELS[game.level].wordCount), game.level === 3); playSound("stormHit"); if (game.level === 3) requestAnimationFrame(() => els.ideaBox.focus({ preventScroll: true }));
  }
  function openLuckyPass() {
    game.challengeType = STATES.LUCKY; game.currentStormId = null; prepareChallenge(LUCKY_SECONDS); els.brainstormEyebrow.textContent = `Lucky pass · Level ${game.level} of 3`; els.brainstormTitle.textContent = "WOW!"; els.brainstormInstructions.textContent = `${MESSAGES.luckyIntro} ${MESSAGES.lucky[game.level]}`; els.problemText.textContent = ""; els.wordCards.replaceChildren(); els.problemBlock.hidden = true; els.wordCards.hidden = true; els.ideaBox.disabled = false; els.ideaBox.placeholder = "Type your answer here..."; showState(STATES.LUCKY); playSound("lucky"); requestAnimationFrame(() => els.ideaBox.focus({ preventScroll: true }));
  }
  function showAnswerQuestion(question) { game.answering = true; els.ideaBox.disabled = true; [...els.wordCards.children].forEach((button) => { button.disabled = true; }); els.finishIdeaButton.hidden = true; els.timeUpQuestion.textContent = question; els.timeUpPanel.hidden = false; els.yesButton.focus({ preventScroll: true }); }
  function finishClock() { game.remainingSeconds = 0; els.clock.textContent = "0:00"; showAnswerQuestion(MESSAGES.timeUp); }
  function finishIdeaEarly() { if (![STATES.BRAINSTORM, STATES.LUCKY].includes(game.state) || game.answering || game.remainingSeconds <= 0 || els.ideaBox.value.length === 0 || (game.state === STATES.BRAINSTORM && !game.selectedWord)) return; showAnswerQuestion(MESSAGES.done); }
  function calmCurrentStorm() {
    playSound("yes"); if (game.challengeType === STATES.LUCKY) { completeLevel(); return; }
    const storm = game.storms.find((s) => s.id === game.currentStormId); if (!storm) return; storm.active = false; storm.element.classList.add("is-calmed"); game.calmed += 1; updateLabels();
    const dx = game.boat.x - storm.x, dy = game.boat.y - storm.y, magnitude = Math.hypot(dx, dy) || 1; game.boat.x = clamp(game.boat.x + dx / magnitude * 62, MAP.minX, MAP.maxX); game.boat.y = clamp(game.boat.y + dy / magnitude * 62, MAP.minY, MAP.maxY); setBoatPosition(); game.graceUntil = performance.now() + GRACE_MS; game.currentStormId = null; els.sailingMessage.textContent = MESSAGES.stormCalmed; showState(STATES.SAILING); requestAnimationFrame(() => els.seaMap.focus({ preventScroll: true }));
  }
  function sinkBoat() { els.sunkMessage.textContent = game.challengeType === STATES.LUCKY ? MESSAGES.luckyFailed : MESSAGES.boatSunk; showState(STATES.SUNK); playSound("sink"); requestAnimationFrame(() => els.tryAgainButton.focus({ preventScroll: true })); }
  function completeLevel() {
    game.pendingMoves.length = 0;
    if (game.level === 3) { els.gameCompleteMessage.textContent = MESSAGES.gameComplete; showState(STATES.GAME_COMPLETE); playCelebration(true); requestAnimationFrame(() => els.playAgainButton.focus({ preventScroll: true })); }
    else { els.completeMessage.textContent = MESSAGES.rescued(game.level); showState(STATES.COMPLETE); playCelebration(false); requestAnimationFrame(() => els.nextLevelButton.focus({ preventScroll: true })); }
  }
  function pauseGame() { if (![STATES.SAILING, STATES.BRAINSTORM, STATES.LUCKY].includes(game.state)) return; game.pauseSource = game.state; els.pausedMessage.textContent = game.state === STATES.SAILING ? MESSAGES.pausedSailing : MESSAGES.pausedThinking; els.pausedRestartButton.hidden = game.state !== STATES.SAILING; showState(STATES.PAUSED); pauseAllSound(); }
  function resumeGame() { if (game.state !== STATES.PAUSED || !game.pauseSource) return; const prior = game.pauseSource; game.pauseSource = null; game.lastFrameTime = performance.now(); showState(prior); resumeAllSound(); requestAnimationFrame(() => (prior === STATES.SAILING ? els.seaMap : els.ideaBox).focus({ preventScroll: true })); }
  function playAgain() { game.level = 1; resetLevel(); showState(STATES.READY); }
  function updateFrame(now) {
    if (!game.lastFrameTime) game.lastFrameTime = now; const elapsed = Math.min((now - game.lastFrameTime) / 1000, 0.1); game.lastFrameTime = now;
    if (game.state === STATES.SAILING) {
      game.visualTime += elapsed; game.storms.forEach((s) => { if (s.active) s.phase += s.path.speed * elapsed; }); positionStorms(); applyPendingMoves(); updateLightning(); updateFish(); updateRainDistance(); checkSailingEvents(now);
    } else if ([STATES.BRAINSTORM, STATES.LUCKY].includes(game.state) && game.remainingSeconds > 0 && !game.answering) {
      game.remainingSeconds = Math.max(0, game.remainingSeconds - elapsed); const shownSecond = Math.ceil(game.remainingSeconds); els.clock.textContent = formatClock(game.remainingSeconds);
      if (shownSecond > 0 && shownSecond !== game.lastTickSecond) playSound("tick", { urgent: shownSecond <= 10 }); game.lastTickSecond = shownSecond;
      if (game.remainingSeconds <= 0) finishClock();
    }
    requestAnimationFrame(updateFrame);
  }

  byId("game-title").textContent = MESSAGES.startTitle; byId("start-copy-one").textContent = MESSAGES.startOne; byId("start-copy-two").textContent = MESSAGES.startTwo; els.yesButton.textContent = MESSAGES.yes; els.noButton.textContent = MESSAGES.no; els.unsureButton.textContent = MESSAGES.unsure;
  els.startButton.addEventListener("click", () => startLevel(1)); document.querySelectorAll(".skip-level").forEach((button) => button.addEventListener("click", () => startLevel(Number(button.dataset.level))));
  els.soundToggle.addEventListener("change", () => setSoundEnabled(els.soundToggle.checked));
  els.seaSoundToggle.addEventListener("change", () => setSoundEnabled(els.seaSoundToggle.checked));
  byId("hear-menu-theme").addEventListener("click", () => { if (audio.enabled) startMusic("menu"); });
  byId("hear-sailing-theme").addEventListener("click", () => { if (audio.enabled) startMusic("sailing"); });
  document.addEventListener("keydown", (event) => {
    const directions = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
    if (game.state === STATES.READY && ["1", "2", "3"].includes(event.key)) { startLevel(Number(event.key)); return; }
    /* Tester-only keys: Alt+Shift+B opens a hit; Alt+Shift+G reaches the goal. */
    if (game.state === STATES.SAILING && event.altKey && event.shiftKey && event.code === "KeyB") { event.preventDefault(); const active = game.storms.find((storm) => storm.active); if (active) openBrainstorm(active.id); return; }
    if (game.state === STATES.SAILING && event.altKey && event.shiftKey && event.code === "KeyG") { event.preventDefault(); Object.assign(game.boat, MAP.goal); setBoatPosition(); checkSailingEvents(performance.now()); return; }
    if (game.state === STATES.SAILING && event.altKey && event.shiftKey && event.code === "KeyL") { event.preventDefault(); game.nextLightningAt = game.visualTime; updateLightning(); return; }
    if (game.state === STATES.SAILING && event.altKey && event.shiftKey && event.code === "KeyF") { event.preventDefault(); if (game.fish) { game.fish.element.remove(); game.fish = null; } launchFish(); return; }
    if ([STATES.BRAINSTORM, STATES.LUCKY].includes(game.state) && event.altKey && event.shiftKey && event.code === "KeyT") { event.preventDefault(); game.remainingSeconds = 10.05; game.lastTickSecond = 11; els.clock.textContent = formatClock(game.remainingSeconds); return; }
    if (!directions[event.key] || game.state !== STATES.SAILING) return; event.preventDefault(); queueMove(directions[event.key]);
  });
  document.querySelectorAll(".direction-button").forEach((button) => button.addEventListener("click", () => queueMove(button.dataset.direction)));
  els.ideaBox.addEventListener("input", () => { els.characterCount.textContent = `${els.ideaBox.value.length} / 500`; updateFinishButton(); });
  els.finishIdeaButton.addEventListener("click", finishIdeaEarly); els.yesButton.addEventListener("click", calmCurrentStorm); els.noButton.addEventListener("click", sinkBoat); els.unsureButton.addEventListener("click", sinkBoat); els.tryAgainButton.addEventListener("click", () => startLevel(game.level)); els.nextLevelButton.addEventListener("click", () => startLevel(game.level + 1)); els.playAgainButton.addEventListener("click", playAgain); els.pauseButton.addEventListener("click", pauseGame); els.restartButton.addEventListener("click", () => startLevel(game.level)); els.pausedRestartButton.addEventListener("click", () => startLevel(game.level)); els.resumeButton.addEventListener("click", resumeGame);
  document.addEventListener("visibilitychange", () => { if (document.hidden) { pauseGame(); pauseAllSound(); } else if (game.state === STATES.READY) resumeAllSound(); });
  window.addEventListener("blur", () => { window.setTimeout(() => { if (!document.hasFocus()) { pauseGame(); pauseAllSound(); } }, 80); });
  window.addEventListener("focus", () => { if (game.state === STATES.READY) resumeAllSound(); });

  window.__brainsailTest = Object.freeze({
    getState: () => ({ state: game.state, level: game.level, stormCount: game.storms.length, activeStorms: game.storms.filter((s) => s.active).length, calmed: game.calmed, stormHits: game.stormHits, seconds: Math.ceil(game.remainingSeconds), selectedWord: game.selectedWord, answering: game.answering }),
    startLevel, openBrainstorm: (id = 0) => openBrainstorm(id), reachGoal: (withHit = true) => { game.stormHits = withHit ? 1 : 0; Object.assign(game.boat, MAP.goal); setBoatPosition(); checkSailingEvents(performance.now()); }, expireClock: () => { if ([STATES.BRAINSTORM, STATES.LUCKY].includes(game.state)) finishClock(); }, setIdea: (text) => { els.ideaBox.value = text; els.ideaBox.dispatchEvent(new Event("input", { bubbles: true })); }, stormData: STORM_DATA,
    forceLightning: () => { game.nextLightningAt = game.visualTime; }, forceFish: (color) => { if (game.fish) { game.fish.element.remove(); game.fish = null; } launchFish(color); },
    getPolishState: () => ({ visualTime: game.visualTime, lightning: game.storms.filter((s) => s.element.classList.contains("is-striking")).length, fishColor: game.fish && game.fish.color, soundEnabled: audio.enabled, audioState: audio.ctx ? audio.ctx.state : "not-created", soundEvents: { ...audio.eventCounts } }),
    getMusicState: () => ({ theme: audio.music && audio.music.theme, schedulerRunning: Boolean(audio.music && audio.music.timer), voices: audio.voices.size, level: document.body.dataset.musicLevel, form: audio.music && MUSIC[audio.music.theme].form, menuLoopSeconds: musicLoopSeconds("menu"), sailingLoopSeconds: musicLoopSeconds("sailing") })
  });
  setSoundEnabled(false); showState(STATES.READY); requestAnimationFrame(updateFrame);
}());
