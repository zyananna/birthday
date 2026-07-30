/* =========================================================
   BIRTHDAY EXPERIENCE — LOGIC
   Scene 1: System Breach + Countdown (canvas particle system)
   Scene 2: Biometric Verification (face-scan / database search / warning)
   Scenes 3–5: Verification (identity / age / gift confirmation)
   Scene 6: Memory Archive (photo gallery)
   Scene 7: Memory Playback (video)
   Scene 8: Final Cake (drag-to-cut + celebration)
   Scene 9: Final Message (hidden archive letter reveal)
========================================================= */

/* ---------------------------------------------------------
   0. EDIT ME — personalise the ending message here
--------------------------------------------------------- */
const BIRTHDAY_NAME = "Aina";
const BIRTHDAY_AGE = 24;
const BIRTHDAY_MESSAGE =
  "Semoga tahun baharu ini membawa lebih banyak ketawa, lebih banyak kejayaan, " +
  "dan lebih banyak detik indah untuk dikenang. Selamat hari lahir — semoga sentiasa bersinar. ✨";
// BIRTHDAY_MESSAGE is reserved for a future Scene 6 (not built yet).

/* Decoy pools for the verification scenes (3–4). Three are sampled at
   random each time the page loads and mixed in with the real answer. */
const NAME_DECOYS = ["Zyan", "Piya", "Aliah"];
const AGE_DECOYS = [7, 10, 13, 18, 20, 28];

/* ---------------------------------------------------------
   1. HELPERS
--------------------------------------------------------- */
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const PALETTE = ["#5B4BFF", "#6E8CFF", "#FFB3F4", "#FFFFFF"];

/* ---------------------------------------------------------
   2. AUDIO ENGINE (procedural — no external files needed)
--------------------------------------------------------- */
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.unlocked = false;
    this._pendingAmbient = false;
    this._pendingQueue = [];
  }

  queueOnUnlock(fn) {
    if (this.ready) fn();
    else this._pendingQueue.push(fn);
  }

  ensure() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(this.ctx.destination);
  }

  unlock() {
    this.ensure();
    if (!this.ctx) return;
    const finish = () => {
      this.unlocked = true;
      document.dispatchEvent(new CustomEvent("audio-unlocked"));
      if (this._pendingAmbient) {
        this._pendingAmbient = false;
        this.startAmbient();
      }
      const queue = this._pendingQueue.splice(0);
      queue.forEach((fn) => fn());
    };
    if (this.ctx.state === "suspended") {
      this.ctx.resume().then(finish).catch(() => {});
    } else {
      finish();
    }
  }

  get ready() {
    return this.ctx && this.unlocked && this.ctx.state === "running";
  }

  _noiseBuffer(duration = 0.3) {
    const ctx = this.ctx;
    const buf = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  bootChime() {
    if (!this.ctx) this.ensure();
    const play = () => {
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(90, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.5);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      osc.connect(g).connect(this.master);
      osc.start();
      osc.stop(ctx.currentTime + 0.65);
      this.chime(1046.5, 0.08, 0.6, 0.12);
      this.chime(1568, 0.14, 0.6, 0.1);
    };
    this.queueOnUnlock(play);
  }

  glitchBlip() {
    if (!this.ready) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this._noiseBuffer(rand(0.03, 0.12));
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = rand(400, 4000);
    bp.Q.value = rand(4, 14);
    const g = ctx.createGain();
    const vol = rand(0.05, 0.22);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + rand(0.08, 0.25));
    src.connect(bp).connect(g).connect(this.master);
    src.start();
    src.stop(ctx.currentTime + 0.3);
  }

  glitchTick() {
    if (!this.ready) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = rand(800, 3200);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(rand(0.02, 0.08), ctx.currentTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + rand(0.03, 0.09));
    osc.connect(g).connect(this.master);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  whoom() {
    if (!this.ready) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(48, ctx.currentTime + 0.9);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.1);
    osc.connect(g).connect(this.master);
    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  }

  pop() {
    if (!this.ready) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc.connect(g).connect(this.master);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }

  chime(freq = 880, delay = 0, dur = 1.2, vol = 0.18) {
    if (!this.ready) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.1);
  }

  deliveryChime() {
    // gentle music-box arpeggio
    const notes = [880, 1174.7, 1318.5, 1567.98, 1760];
    notes.forEach((f, i) => this.chime(f, i * 0.16, 1.4, 0.1));
  }

  sparkleChime() {
    const notes = [1318.5, 1760, 2093];
    notes.forEach((f, i) => this.chime(f, i * 0.1, 0.9, 0.12));
  }

  birthdayTune() {
    // Procedural "Happy Birthday" melody (public-domain tune), played as a
    // sequence of chimes for the cake-cutting celebration.
    const q = 0.3; // quarter-note spacing
    const notes = [
      [392.0, 0, 0.5], [392.0, 0.5, 0.5], [440.0, 1, 1], [392.0, 2, 1], [523.25, 3, 1], [493.88, 4, 2],
      [392.0, 6, 0.5], [392.0, 6.5, 0.5], [440.0, 7, 1], [392.0, 8, 1], [587.33, 9, 1], [523.25, 10, 2],
      [392.0, 12, 0.5], [392.0, 12.5, 0.5], [783.99, 13, 1], [659.25, 14, 1], [523.25, 15, 1], [493.88, 16, 1], [440.0, 17, 1.5],
      [698.46, 19, 0.5], [698.46, 19.5, 0.5], [659.25, 20, 1], [523.25, 21, 1], [587.33, 22, 1], [523.25, 23, 2],
    ];
    notes.forEach(([freq, beat, dur]) => this.chime(freq, beat * q, dur * q * 1.15, 0.16));
  }

  keyTick() {
    if (!this.ready) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = rand(1400, 2200);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
    osc.connect(g).connect(this.master);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  }

  errorBuzz() {
    if (!this.ready) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.35);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc.connect(g).connect(this.master);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  }

  startDrone() {
    if (!this.ctx) this.ensure();
    this.queueOnUnlock(() => {
      if (this.droneNodes || !this.ctx) return;
      const ctx = this.ctx;
      const noiseSrc = ctx.createBufferSource();
      const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      noiseSrc.buffer = buf;
      noiseSrc.loop = true;

      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 220;

      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.18;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 60;
      lfo.connect(lfoGain).connect(lp.frequency);

      const g = ctx.createGain();
      g.gain.value = 0.0001;
      g.gain.setTargetAtTime(0.06, ctx.currentTime, 0.6);

      noiseSrc.connect(lp).connect(g).connect(this.master);
      noiseSrc.start();
      lfo.start();
      this.droneNodes = { noiseSrc, lfo, g };
    });
  }

  stopDrone(fade = 0.6) {
    if (!this.droneNodes || !this.ctx) return;
    const { noiseSrc, lfo, g } = this.droneNodes;
    g.gain.setTargetAtTime(0, this.ctx.currentTime, fade / 3);
    setTimeout(() => {
      try { noiseSrc.stop(); lfo.stop(); } catch (e) {}
    }, fade * 1000 + 200);
    this.droneNodes = null;
  }

  interferenceSweep() {
    if (!this.ready) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    const up = Math.random() < 0.5;
    osc.frequency.setValueAtTime(up ? 200 : 2400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(up ? 2400 : 200, ctx.currentTime + 0.35);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1200;
    bp.Q.value = 6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc.connect(bp).connect(g).connect(this.master);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  }

  startAmbient() {
    if (!this.ctx) return;
    if (!this.ready) { this._pendingAmbient = true; return; }
    if (this.ambientNodes) return;
    const ctx = this.ctx;
    const pad = ctx.createGain();
    pad.gain.value = 0.05;
    pad.connect(this.master);

    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.value = 220;
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = 220 * 1.5;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 60;
    lfo.connect(lfoGain).connect(osc1.frequency);

    osc1.connect(pad);
    osc2.connect(pad);
    osc1.start(); osc2.start(); lfo.start();

    this.ambientNodes = { pad, osc1, osc2, lfo };
  }

  stopAmbient(fade = 1.2) {
    if (!this.ambientNodes || !this.ctx) return;
    const { pad } = this.ambientNodes;
    const ctx = this.ctx;
    pad.gain.setTargetAtTime(0, ctx.currentTime, fade / 3);
    const nodes = this.ambientNodes;
    setTimeout(() => {
      try { nodes.osc1.stop(); nodes.osc2.stop(); nodes.lfo.stop(); } catch (e) {}
    }, fade * 1000 + 200);
    this.ambientNodes = null;
  }
}

const audio = new AudioEngine();

function tryUnlockAudio() {
  audio.unlock();
  if (audio.ready) {
    ["pointerdown", "keydown", "touchstart"].forEach((evt) =>
      window.removeEventListener(evt, tryUnlockAudio)
    );
    hideSoundHint();
  }
}
["pointerdown", "keydown", "touchstart"].forEach((evt) => {
  window.addEventListener(evt, tryUnlockAudio, { passive: true });
});

function showSoundHint() {
  if (audio.ready) return;
  const hint = document.getElementById("tapHint");
  if (hint) hint.classList.add("show");
}
function hideSoundHint() {
  const hint = document.getElementById("tapHint");
  if (hint) { hint.classList.remove("show"); hint.classList.add("hide"); }
}
document.addEventListener("audio-unlocked", hideSoundHint);
// If the very first attempt (page load) got blocked by the browser,
// surface a small, unobtrusive hint almost immediately.
setTimeout(showSoundHint, 500);

/* ---------------------------------------------------------
   3. SCENE 1 — SYSTEM BREACH + PARTICLE COUNTDOWN
--------------------------------------------------------- */
class GlitchScene {
  constructor(canvas, onComplete) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.onComplete = onComplete;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.resize();
    window.addEventListener("resize", () => this.resize());

    this.startTime = performance.now();
    this.mode = "glitch"; // glitch -> countdown -> done
    this.flashDone = false;
    this.corrupted = [];
    this.blocks = [];
    this.gridOffset = 0;

    this.tickTimer = 0;
    this.blipTimer = 0;
    this.banner = null;

    const glyphChars = "01アイウエオカキクケコ$#%&+=<>";
    const cols = Math.ceil(window.innerWidth / 22);
    this.rain = new Array(cols).fill(0).map((_, i) => ({
      x: i * 22 + rand(-4, 4),
      y: rand(-window.innerHeight, 0),
      speed: rand(2.5, 7),
      char: pick(glyphChars.split("")),
      switchTimer: rand(4, 20),
    }));
    this.glyphChars = glyphChars;

    // countdown particle system
    this.particles = [];
    this.particleCount = 850;
    this.offCanvas = document.createElement("canvas");
    this.offCtx = this.offCanvas.getContext("2d");
    this.countdownIndex = 0;
    this.countdownNumbers = ["3", "2", "1"];
    this.phase = null; // gather | hold | break
    this.phaseStart = 0;

    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: rand(0, this.w), y: rand(0, this.h),
        vx: 0, vy: 0,
        tx: 0, ty: 0,
        color: pick(PALETTE),
        size: rand(1.2, 2.6),
        alpha: 0,
      });
    }

    audio.startDrone();
    this.sweepTimer = rand(700, 1400);

    this.raf = requestAnimationFrame((t) => this.loop(t));

    setTimeout(() => this.beginCountdown(), 5000);
  }

  resize() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = this.w * this.dpr;
    this.canvas.height = this.h * this.dpr;
    this.canvas.style.width = this.w + "px";
    this.canvas.style.height = this.h + "px";
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  beginCountdown() {
    this.mode = "countdown";
    audio.stopDrone(0.8);
    this.ctx.clearRect(0, 0, this.w, this.h);
    this.nextNumber();
  }

  sampleTargets(text) {
    const off = this.offCanvas;
    const octx = this.offCtx;
    off.width = this.w;
    off.height = this.h;
    octx.clearRect(0, 0, this.w, this.h);
    const size = Math.min(this.w, this.h) * 0.62;
    octx.fillStyle = "#fff";
    octx.font = `900 ${size}px Arial, sans-serif`;
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.fillText(text, this.w / 2, this.h / 2 + size * 0.05);

    const step = Math.max(3, Math.floor(Math.min(this.w, this.h) / 220));
    const data = octx.getImageData(0, 0, this.w, this.h).data;
    const targets = [];
    for (let y = 0; y < this.h; y += step) {
      for (let x = 0; x < this.w; x += step) {
        const idx = (y * this.w + x) * 4 + 3;
        if (data[idx] > 128) targets.push({ x: x + rand(-1, 1), y: y + rand(-1, 1) });
      }
    }
    return targets;
  }

  nextNumber() {
    if (this.countdownIndex >= this.countdownNumbers.length) {
      this.mode = "done";
      setTimeout(() => this.onComplete(), 650);
      return;
    }
    const text = this.countdownNumbers[this.countdownIndex];
    const targets = this.sampleTargets(text);

    this.particles.forEach((p) => {
      const t = pick(targets) || { x: this.w / 2, y: this.h / 2 };
      p.tx = t.x;
      p.ty = t.y;
      if (p.alpha === 0) {
        const angle = rand(0, Math.PI * 2);
        const r = Math.max(this.w, this.h) * 0.75;
        p.x = this.w / 2 + Math.cos(angle) * r;
        p.y = this.h / 2 + Math.sin(angle) * r;
      }
      p.alpha = 1;
      p.easing = rand(0.05, 0.11);
    });

    audio.whoom();
    this.phase = "gather";
    this.phaseStart = performance.now();
    this.countdownIndex++;

    setTimeout(() => { this.phase = "hold"; this.phaseStart = performance.now(); }, 1150);
    setTimeout(() => {
      this.phase = "break";
      this.phaseStart = performance.now();
      audio.pop();
      this.particles.forEach((p) => {
        const dx = p.x - this.w / 2;
        const dy = p.y - this.h / 2;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const force = rand(2.5, 7);
        p.vx = (dx / dist) * force + rand(-1, 1);
        p.vy = (dy / dist) * force + rand(-1, 1);
      });
    }, 1950);
    setTimeout(() => this.nextNumber(), 2650);
  }

  drawGrid(t) {
    const ctx = this.ctx;
    this.gridOffset = (this.gridOffset + 0.15) % 60;
    ctx.strokeStyle = "rgba(110,140,255,0.08)";
    ctx.lineWidth = 1;
    const gap = 60;
    for (let x = -gap; x < this.w + gap; x += gap) {
      ctx.beginPath();
      ctx.moveTo(x + this.gridOffset, 0);
      ctx.lineTo(x + this.gridOffset, this.h);
      ctx.stroke();
    }
    for (let y = -gap; y < this.h + gap; y += gap) {
      ctx.beginPath();
      ctx.moveTo(0, y + this.gridOffset * 0.6);
      ctx.lineTo(this.w, y + this.gridOffset * 0.6);
      ctx.stroke();
    }
  }

  drawCorrupted(intensity) {
    const words = [
      "ACCESS", "NULL", "SYSTEM", "ERROR", "*****", "INITIALIZING", "UNKNOWN",
      "DATA LOST", "01001101", "0xFF3A", "SYNC...", "CORRUPTED", "REROUTE",
      "0x00DEAD", "SCANNING", "OVERRIDE", "??????", "PACKET LOST", "10110010",
      "TRACE", "KERNEL PANIC", "RECONNECTING",
    ];
    if (Math.random() < 0.09 + intensity * 0.2) {
      this.corrupted.push({
        text: pick(words),
        x: rand(0, this.w),
        y: rand(0, this.h),
        life: 1,
        color: pick(PALETTE),
        size: rand(10, 22),
      });
      if (Math.random() < 0.5) audio.glitchTick();
    }
    const ctx = this.ctx;
    this.corrupted = this.corrupted.filter((c) => c.life > 0);
    this.corrupted.forEach((c) => {
      ctx.globalAlpha = c.life * 0.7;
      ctx.fillStyle = c.color;
      ctx.font = `${c.size}px monospace`;
      ctx.fillText(c.text, c.x, c.y);
      c.life -= 0.08;
    });
    ctx.globalAlpha = 1;
  }

  drawParticlesAmbient() {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    for (let i = 0; i < 40; i++) {
      ctx.globalAlpha = rand(0.05, 0.3);
      ctx.fillRect(rand(0, this.w), rand(0, this.h), 1.5, 1.5);
    }
    ctx.globalAlpha = 1;
  }

  drawRain(intensity) {
    const ctx = this.ctx;
    ctx.font = "16px monospace";
    this.rain.forEach((d) => {
      d.y += d.speed * (0.5 + intensity);
      d.switchTimer -= 1;
      if (d.switchTimer <= 0) {
        d.char = pick(this.glyphChars.split(""));
        d.switchTimer = rand(4, 20);
      }
      if (d.y > this.h + 20) { d.y = rand(-200, -20); d.speed = rand(2.5, 7); }
      ctx.globalAlpha = rand(0.05, 0.16) * (0.4 + intensity);
      ctx.fillStyle = Math.random() < 0.15 ? "#FFB3F4" : "#6E8CFF";
      ctx.fillText(d.char, d.x, d.y);
    });
    ctx.globalAlpha = 1;
  }

  drawBanner(intensity) {
    const banners = ["SYSTEM BREACH DETECTED", "UNAUTHORIZED ACCESS", "FIREWALL FAILURE", "DECRYPTING..."];
    if (!this.banner && Math.random() < 0.012 * intensity) {
      this.banner = { text: pick(banners), life: 1 };
    }
    if (this.banner) {
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha = this.banner.life * 0.85;
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.font = `700 ${clamp(this.w * 0.03, 16, 34)}px monospace`;
      ctx.shadowBlur = 14;
      ctx.shadowColor = "#FFB3F4";
      const jitter = Math.random() < 0.3 ? rand(-4, 4) : 0;
      ctx.fillText(this.banner.text, this.w / 2 + jitter, this.h * 0.5);
      ctx.restore();
      this.banner.life -= 0.045;
      if (this.banner.life <= 0) this.banner = null;
    }
  }

  drawGlitchBlocks(intensity) {
    const ctx = this.ctx;
    if (Math.random() < intensity * 0.4) {
      const bw = rand(30, 260);
      const bh = rand(4, 18);
      const x = rand(0, this.w);
      const y = rand(0, this.h);
      ctx.globalAlpha = rand(0.08, 0.25);
      ctx.fillStyle = pick(PALETTE);
      ctx.fillRect(x, y, bw, bh);
      ctx.globalAlpha = 1;
    }
  }

  drawRGBSplit(intensity) {
    if (Math.random() > intensity * 0.35) return;
    const ctx = this.ctx;
    const offset = rand(2, 8) * intensity;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = "#ff2d6a";
    ctx.fillRect(-offset, 0, this.w, this.h);
    ctx.fillStyle = "#2d8cff";
    ctx.fillRect(offset, 0, this.w, this.h);
    ctx.restore();
  }

  renderGlitchPhase(now) {
    const elapsed = now - this.startTime;
    const intensity = clamp(elapsed / 4000, 0, 1);
    const ctx = this.ctx;

    ctx.fillStyle = "rgba(5,8,22,0.32)";
    ctx.fillRect(0, 0, this.w, this.h);

    this.drawGrid();
    this.drawRain(intensity);
    this.drawParticlesAmbient();
    this.drawCorrupted(intensity);
    this.drawBanner(intensity);
    this.drawGlitchBlocks(intensity);
    this.drawRGBSplit(intensity);

    this.blipTimer -= 16;
    if (this.blipTimer <= 0) {
      this.blipTimer = rand(55, 170) / (0.6 + intensity);
      audio.glitchBlip();
    }

    this.sweepTimer -= 16;
    if (this.sweepTimer <= 0) {
      this.sweepTimer = rand(900, 2200) / (0.5 + intensity);
      audio.interferenceSweep();
    }

    if (elapsed > 3900 && elapsed < 4200 && !this.flashDone) {
      this.flashDone = true;
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillRect(0, 0, this.w, this.h);
    }

    if (elapsed > 4700) {
      ctx.fillStyle = "rgba(5,8,22,0.5)";
      ctx.fillRect(0, 0, this.w, this.h);
    }
  }

  renderCountdownPhase() {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(5,8,22,0.28)";
    ctx.fillRect(0, 0, this.w, this.h);
    this.drawGrid();

    const now = performance.now();
    const phaseElapsed = now - this.phaseStart;

    this.particles.forEach((p) => {
      if (p.alpha <= 0) return;
      if (this.phase === "gather") {
        const t = clamp(phaseElapsed / 1100, 0, 1);
        const e = easeOutCubic(t);
        p.x = lerp(p.x, p.tx, p.easing + e * 0.05);
        p.y = lerp(p.y, p.ty, p.easing + e * 0.05);
        p.x += Math.sin(now * 0.01 + p.tx) * 0.3;
        p.y += Math.cos(now * 0.01 + p.ty) * 0.3;
      } else if (this.phase === "hold") {
        p.x = lerp(p.x, p.tx, 0.2);
        p.y = lerp(p.y, p.ty, 0.2);
        p.x += Math.sin(now * 0.02 + p.tx) * 0.4;
        p.y += Math.cos(now * 0.02 + p.ty) * 0.4;
      } else if (this.phase === "break") {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.alpha = clamp(1 - phaseElapsed / 700, 0, 1) * 0.9 + 0.1;
      }

      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  loop(now) {
    if (this.mode === "done") return;
    if (this.mode === "glitch") this.renderGlitchPhase(now);
    else if (this.mode === "countdown") this.renderCountdownPhase(now);
    this.raf = requestAnimationFrame((t) => this.loop(t));
  }

  destroy() {
    cancelAnimationFrame(this.raf);
  }
}

/* ---------------------------------------------------------
   4. SCENE 2 — STARFIELD BACKGROUND CANVAS
--------------------------------------------------------- */
class StarField {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.stars = [];
    this.shootTimer = rand(2000, 5000);
    this.shootingStars = [];
    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.last = performance.now();
    this.raf = requestAnimationFrame((t) => this.loop(t));
  }

  resize() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = this.w * this.dpr;
    this.canvas.height = this.h * this.dpr;
    this.canvas.style.width = this.w + "px";
    this.canvas.style.height = this.h + "px";
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const count = Math.floor((this.w * this.h) / 4500);
    this.stars = new Array(count).fill(0).map(() => ({
      x: rand(0, this.w),
      y: rand(0, this.h),
      r: rand(0.4, 1.8),
      baseAlpha: rand(0.3, 1),
      speed: rand(0.4, 1.2),
      phase: rand(0, Math.PI * 2),
    }));
  }

  loop(now) {
    const dt = now - this.last;
    this.last = now;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    this.stars.forEach((s) => {
      s.phase += dt * 0.0015 * s.speed;
      const a = s.baseAlpha * (0.55 + 0.45 * Math.sin(s.phase));
      ctx.globalAlpha = a;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      this.shootTimer = rand(3500, 8000);
      this.shootingStars.push({
        x: rand(this.w * 0.1, this.w * 0.7),
        y: rand(0, this.h * 0.3),
        vx: rand(6, 10),
        vy: rand(3, 5),
        life: 1,
      });
    }
    this.shootingStars = this.shootingStars.filter((s) => s.life > 0);
    this.shootingStars.forEach((s) => {
      ctx.save();
      ctx.globalAlpha = s.life;
      const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 8, s.y - s.vy * 8);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 8, s.y - s.vy * 8);
      ctx.stroke();
      ctx.restore();
      s.x += s.vx;
      s.y += s.vy;
      s.life -= 0.02;
    });

    this.raf = requestAnimationFrame((t) => this.loop(t));
  }
}

/* ---------------------------------------------------------
   5. SCENE 2 — BIOMETRIC VERIFICATION SEQUENCE
--------------------------------------------------------- */

/* ---- boot terminal (phase 1) ---- */
async function scanBootLine(text, cls = "") {
  const term = document.getElementById("scanBootTerminal");
  const line = document.createElement("p");
  line.className = "scan-boot-line " + cls;
  line.innerHTML = `&gt;&gt; `;
  term.appendChild(line);
  const textSpan = document.createElement("span");
  line.appendChild(textSpan);
  await msgTypeInto(textSpan, text, 26);
}

function scanBootStatic(text, cls = "") {
  const term = document.getElementById("scanBootTerminal");
  const line = document.createElement("p");
  line.className = "scan-boot-line " + cls;
  line.textContent = text;
  term.appendChild(line);
}

async function runScanBootPhase() {
  const boot = document.getElementById("scanBoot");
  const term = document.getElementById("scanBootTerminal");
  term.innerHTML = `<span class="scan-boot-caret">&gt;</span>`;
  await wait(1300);
  term.innerHTML = "";

  await scanBootLine("SYSTEM RECOVERED...");
  audio.glitchTick();
  await wait(350);
  await scanBootLine("AI CORE ONLINE");
  audio.glitchTick();
  await wait(350);
  await scanBootLine("Searching Active User...");
  await wait(450);
  scanBootStatic("...");
  await wait(700);

  const warnLine = document.createElement("p");
  warnLine.className = "scan-boot-line scan-boot-line--danger";
  warnLine.innerHTML = `UNKNOWN USER DETECTED <span class="scan-boot-warn">⚠</span>`;
  term.appendChild(warnLine);
  audio.errorBuzz();
  await wait(550);
  warnLine.classList.add("scan-boot-line--calm");
  await wait(900);

  boot.classList.add("hide");
  await wait(700);
}

/* ---- face-scan mesh (decorative dotted overlay on the face wireframe) ---- */
function buildFaceMesh() {
  const g = document.getElementById("scanFaceMesh");
  if (!g) return;
  g.innerHTML = "";
  const cx = 100, cy = 122, rx = 58, ry = 78;
  const count = 70;
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2);
    const r = Math.sqrt(rand(0, 1));
    const x = cx + Math.cos(a) * rx * r;
    const y = cy + Math.sin(a) * ry * r;
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", x.toFixed(1));
    dot.setAttribute("cy", y.toFixed(1));
    dot.setAttribute("r", rand(0.6, 1.4).toFixed(2));
    dot.setAttribute("class", "scan-face-dot");
    dot.style.setProperty("--delay", rand(0, 1.6).toFixed(2) + "s");
    g.appendChild(dot);
  }
}

function buildWaveform() {
  const wave = document.getElementById("scanWave");
  if (!wave) return;
  wave.innerHTML = "";
  for (let i = 0; i < 14; i++) {
    const bar = document.createElement("span");
    bar.style.height = rand(30, 100) + "%";
    bar.style.animationDelay = rand(0, 1) + "s";
    bar.style.animationDuration = rand(0.8, 1.5) + "s";
    wave.appendChild(bar);
  }
}

function setScanRing(pct) {
  const fill = document.getElementById("scanRingFill");
  const value = document.getElementById("scanRingValue");
  const circumference = 2 * Math.PI * 42;
  fill.style.strokeDashoffset = String(circumference * (1 - pct / 100));
  value.textContent = Math.round(pct) + "%";
}

function scanDataRow(label) {
  const list = document.getElementById("scanDataList");
  const row = document.createElement("div");
  row.className = "scan-data-row";
  row.innerHTML = `<span class="scan-data-label">${label}</span><span class="scan-data-mark"></span>`;
  list.appendChild(row);
  requestAnimationFrame(() => row.classList.add("show"));
  return row;
}
function scanDataMark(row, mark) {
  row.querySelector(".scan-data-mark").textContent = mark;
  audio.keyTick();
}

/* ---- phase 2: face scan ---- */
async function runFaceScanPhase() {
  buildFaceMesh();
  buildWaveform();
  setScanRing(0);

  const dashboard = document.getElementById("scanDashboard");
  dashboard.classList.add("show");
  audio.whoom();

  const frame = document.getElementById("scanFrame");
  frame.classList.add("show");
  await wait(300);

  const laser = document.getElementById("scanLaser");
  laser.className = "scan-laser sweep-v";
  audio.glitchBlip();
  await wait(1300);
  laser.className = "scan-laser sweep-h";
  audio.glitchBlip();
  await wait(1300);
  laser.className = "scan-laser";

  document.getElementById("scanTargetRing").classList.add("show");

  let pct = 0;
  const progressTimer = setInterval(() => {
    pct = Math.min(100, pct + rand(3, 8));
    setScanRing(pct);
    if (pct >= 100) clearInterval(progressTimer);
  }, 170);

  const eyesRow = scanDataRow("Eyes");
  await wait(260);
  scanDataMark(eyesRow, "✔");
  await wait(480);

  const noseRow = scanDataRow("Nose");
  await wait(260);
  scanDataMark(noseRow, "✔");
  await wait(480);

  const mouthRow = scanDataRow("Mouth");
  await wait(260);
  scanDataMark(mouthRow, "✔");
  await wait(480);

  const shapeRow = scanDataRow("Face Shape");
  await wait(260);
  scanDataMark(shapeRow, "✔");
  await wait(480);

  const emoRow = scanDataRow("Emotion");
  await wait(260);
  scanDataMark(emoRow, "🙂");
  await wait(550);

  while (pct < 100) await wait(100);
  setScanRing(100);

  const confRow = scanDataRow("Confidence");
  confRow.classList.add("scan-data-row--confidence");
  await wait(220);
  scanDataMark(confRow, "98.6%");
  audio.sparkleChime();
  document.getElementById("scanTopbarStatus").textContent = "COMPLETE";
  await wait(1000);

  dashboard.classList.remove("show");
  await wait(500);
}

/* ---- phase 3: database search ---- */
async function runDatabaseSearchPhase() {
  const overlay = document.getElementById("scanDbOverlay");
  const list = document.getElementById("scanDbList");
  const bar = document.getElementById("scanDbBar");
  const title = document.getElementById("scanDbTitle");
  title.textContent = "SEARCHING DATABASE...";
  title.classList.remove("scan-accent");
  list.innerHTML = "";
  bar.style.width = "0%";
  overlay.classList.add("show");
  audio.glitchBlip();

  const users = ["USER_001", "USER_023", "USER_087", "USER_145", "USER_309"];
  for (const u of users) {
    const row = document.createElement("div");
    row.className = "scan-db-row";
    row.innerHTML = `<span class="scan-db-user">${u}</span><span class="scan-db-result">NO MATCH</span>`;
    list.appendChild(row);
    requestAnimationFrame(() => row.classList.add("show"));
    audio.glitchTick();
    list.scrollTop = list.scrollHeight;
    await wait(360);
  }

  await wait(300);
  const unknownRow = document.createElement("div");
  unknownRow.className = "scan-db-row scan-db-row--unknown";
  unknownRow.innerHTML = `<span class="scan-db-user">UNKNOWN</span><span class="scan-db-result">Searching Again...</span>`;
  list.appendChild(unknownRow);
  requestAnimationFrame(() => unknownRow.classList.add("show"));
  list.scrollTop = list.scrollHeight;
  await wait(1000);

  title.textContent = "POSSIBLE MATCH FOUND";
  title.classList.add("scan-accent");
  audio.whoom();
  await wait(400);

  bar.style.transition = "width 900ms ease";
  bar.style.width = "12%";
  await wait(1000);

  const confRow = document.createElement("div");
  confRow.className = "scan-db-row scan-db-row--confidence";
  confRow.innerHTML = `<span class="scan-db-user">Confidence</span><span class="scan-db-result scan-accent">12%</span>`;
  list.appendChild(confRow);
  requestAnimationFrame(() => confRow.classList.add("show"));
  list.scrollTop = list.scrollHeight;
  audio.errorBuzz();
  await wait(1400);

  overlay.classList.remove("show");
  await wait(500);
}

/* ---- phase 4: verification required ---- */
async function runVerifyRequiredPhase() {
  const overlay = document.getElementById("scanVerifyOverlay");
  document.getElementById("scanVerifyLine1").textContent = "";
  document.getElementById("scanVerifyLine2").textContent = "";
  document.getElementById("scanVerifyLine3").textContent = "";
  overlay.classList.add("show");
  audio.pop();
  await wait(600);

  await msgTypeInto(document.getElementById("scanVerifyLine1"), "Identity cannot be confirmed.", 24);
  await wait(400);
  await msgTypeInto(document.getElementById("scanVerifyLine2"), "Manual verification required.", 24);
  await wait(500);
  await msgTypeInto(document.getElementById("scanVerifyLine3"), "Proceeding to Question Protocol...", 24);
  audio.sparkleChime();
  await wait(1300);

  overlay.classList.remove("show");
  await wait(400);
}

async function runScanScene() {
  await runScanBootPhase();
  await runFaceScanPhase();
  await runDatabaseSearchPhase();
  await runVerifyRequiredPhase();

  const whiteout = document.getElementById("whiteout");
  whiteout.classList.add("blast");
  audio.sparkleChime();
  await wait(1600);

  goToScene3();
}

/* ---------------------------------------------------------
   6. SCENES 3–5 — VERIFICATION SYSTEM
--------------------------------------------------------- */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function toAbsolute(btn, container) {
  if (btn.dataset.abs) return;
  const cRect = container.getBoundingClientRect();
  const bRect = btn.getBoundingClientRect();
  btn.style.position = "absolute";
  btn.style.left = bRect.left - cRect.left + "px";
  btn.style.top = bRect.top - cRect.top + "px";
  btn.style.margin = "0";
  btn.dataset.abs = "1";
}

function dodgeButton(btn, container) {
  toAbsolute(btn, container);
  const cw = container.clientWidth,
    ch = container.clientHeight;
  const bw = btn.offsetWidth || 110,
    bh = btn.offsetHeight || 46;
  const maxX = Math.max(4, cw - bw - 4);
  const maxY = Math.max(4, ch - bh - 4);
  btn.style.left = rand(4, maxX) + "px";
  btn.style.top = rand(4, maxY) + "px";
  btn.classList.add("dodging");
  audio.glitchTick();
  clearTimeout(btn._dodgeTimer);
  btn._dodgeTimer = setTimeout(() => btn.classList.remove("dodging"), 300);
}

// Buttons that flee the cursor before it can land a click — used for every
// wrong answer (scenes 3 & 4) and for the un-catchable "YES" in scene 5.
function setupFleeingButton(btn, container, { proximity = 85, cooldown = 220 } = {}) {
  let lastDodge = 0;
  const tryDodge = () => {
    const now = performance.now();
    if (now - lastDodge < cooldown) return;
    lastDodge = now;
    dodgeButton(btn, container);
  };
  btn._proximityCheck = (x, y) => {
    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2,
      cy = r.top + r.height / 2;
    if (Math.hypot(x - cx, y - cy) < proximity) tryDodge();
  };
  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    tryDodge();
  });
  btn.addEventListener("touchstart", () => tryDodge(), { passive: true });
  return tryDodge;
}

function attachPanelProximity(container) {
  const handler = (e) => {
    const pt = e.touches ? e.touches[0] : e;
    if (!pt) return;
    container.querySelectorAll(".choice-decoy").forEach((b) => {
      if (b._proximityCheck) b._proximityCheck(pt.clientX, pt.clientY);
    });
  };
  container.addEventListener("mousemove", handler);
  container.addEventListener("touchmove", handler, { passive: true });
  return () => {
    container.removeEventListener("mousemove", handler);
    container.removeEventListener("touchmove", handler);
  };
}

// Occasionally shuffles a random decoy on its own, so the panel feels alive
// even when the cursor isn't moving.
function startAutonomousDodging(container) {
  let stopped = false;
  const tick = () => {
    if (stopped) return;
    const decoys = Array.from(container.querySelectorAll(".choice-decoy"));
    if (decoys.length) dodgeButton(pick(decoys), container);
    setTimeout(tick, rand(2200, 4200));
  };
  setTimeout(tick, rand(2200, 4200));
  return () => {
    stopped = true;
  };
}

/**
 * Renders a set of choice buttons into a container.
 * options: [{ label, correct }]. The correct/catchable option resolves the
 * question on click; every other option flees the cursor and never resolves.
 * Returns a cleanup function to stop timers/listeners when leaving the scene.
 */
function buildVerificationChoices(container, options, onCorrect) {
  container.innerHTML = "";
  const cleanups = [];
  options.forEach(({ label, correct }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice-btn " + (correct ? "choice-correct" : "choice-decoy");
    btn.textContent = label;
    if (correct) {
      btn.addEventListener("click", () => onCorrect(btn));
    } else {
      setupFleeingButton(btn, container);
    }
    container.appendChild(btn);
  });
  cleanups.push(attachPanelProximity(container));
  cleanups.push(startAutonomousDodging(container));
  return () => cleanups.forEach((fn) => fn());
}

function revealStatus(statusEl, text) {
  statusEl.textContent = text;
  statusEl.classList.add("show");
}

function dissolvePanel(panel, callback) {
  panel.classList.add("dissolve");
  setTimeout(callback, 750);
}

/* -- Scene 3: Identity Verification -- */
function runScene3() {
  const panel = document.getElementById("panel3");
  const status = document.getElementById("status3");
  const choicesEl = document.getElementById("choices3");
  status.textContent = "";
  status.classList.remove("show");
  panel.classList.remove("dissolve");

  const decoys = shuffle(NAME_DECOYS).slice(0, 3);
  const options = shuffle([
    { label: BIRTHDAY_NAME, correct: true },
    ...decoys.map((label) => ({ label, correct: false })),
  ]);

  const stop = buildVerificationChoices(choicesEl, options, () => {
    stop();
    revealStatus(status, "ACCESS VERIFIED");
    audio.sparkleChime();
    dissolvePanel(panel, () => goToScene4());
  });
}

/* -- Scene 4: Age Verification -- */
function runScene4() {
  const panel = document.getElementById("panel4");
  const status = document.getElementById("status4");
  const choicesEl = document.getElementById("choices4");
  status.textContent = "";
  status.classList.remove("show");
  panel.classList.remove("dissolve");

  const decoys = shuffle(AGE_DECOYS).slice(0, 3);
  const options = shuffle([
    { label: String(BIRTHDAY_AGE), correct: true },
    ...decoys.map((n) => ({ label: String(n), correct: false })),
  ]);

  const stop = buildVerificationChoices(choicesEl, options, () => {
    stop();
    revealStatus(status, "VERIFIED");
    audio.whoom();
    dissolvePanel(panel, () => goToScene5());
  });
}

/* -- Scene 5: Gift Confirmation -- */
function runScene5() {
  const panel = document.getElementById("panel5");
  const status = document.getElementById("status5");
  const choicesEl = document.getElementById("choices5");
  status.textContent = "";
  status.classList.remove("show");
  panel.classList.remove("dissolve");

  // "YES" is the decoy here — it always flees. Only "NO" can be caught.
  const options = shuffle([
    { label: "NO", correct: true },
    { label: "YES", correct: false },
  ]);

  const stop = buildVerificationChoices(choicesEl, options, () => {
    stop();
    audio.pop();
    revealStatus(status, "Haha... Nice try 😆\nOf course it's yours.");
    setTimeout(() => {
      revealStatus(status, "Permission Granted.");
      audio.sparkleChime();
    }, 1800);
    setTimeout(() => {
      revealStatus(status, "Opening Birthday Memories...");
      audio.stopDrone(1.2);
    }, 3400);
    setTimeout(() => {
      dissolvePanel(panel, () => goToScene6());
    }, 5000);
  });
}

function goToScene3() {
  audio.stopAmbient(1.5);
  document.getElementById("scene2").classList.remove("scene--active");
  document.getElementById("scene3").classList.add("scene--active");
  runScene3();
}

function goToScene4() {
  document.getElementById("scene3").classList.remove("scene--active");
  document.getElementById("scene4").classList.add("scene--active");
  runScene4();
}

function goToScene5() {
  document.getElementById("scene4").classList.remove("scene--active");
  document.getElementById("scene5").classList.add("scene--active");
  runScene5();
}

/* ---------------------------------------------------------
   Reserved — confetti helper for a future "memories" scene
--------------------------------------------------------- */
function runConfetti(canvas) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize);

  const w = () => window.innerWidth;
  const h = () => window.innerHeight;
  const pieces = new Array(120).fill(0).map(() => ({
    x: rand(0, w()),
    y: rand(-h(), 0),
    r: rand(3, 7),
    speed: rand(1, 3),
    drift: rand(-1, 1),
    rot: rand(0, Math.PI * 2),
    rotSpeed: rand(-0.05, 0.05),
    color: pick(PALETTE),
  }));

  function loop() {
    ctx.clearRect(0, 0, w(), h());
    pieces.forEach((p) => {
      p.y += p.speed;
      p.x += p.drift;
      p.rot += p.rotSpeed;
      if (p.y > h() + 20) { p.y = rand(-40, -10); p.x = rand(0, w()); }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.5);
      ctx.restore();
    });
    requestAnimationFrame(loop);
  }
  loop();
}

/* ---------------------------------------------------------
   7. SCENE 6 — MEMORY ARCHIVE
--------------------------------------------------------- */
/* EDIT ME — swap these image URLs for the real photos later.
   date/time/caption/label are all free text. */
const MEMORIES = [
  { image: "assets/images/photo1.jpeg", date: "2026.01.19", time: "17:33 PM", caption: "For you." },
  { image: "assets/images/photo2.jpeg", date: "2026.01.31", time: "10:17 AM", caption: "Quiet mornings." },
  { image: "assets/images/photo3.jpeg", date: "2026.01.31", time: "10:20 AM", caption: "Some good days." },
  { image: "assets/images/photo4.jpeg", date: "2026.04.03", time: "13:53 PM", caption: "Little things worth keeping." },
  { image: "assets/images/photo5.jpeg", date: "2026.04.25", time: "08:21 PM", caption: "Laughing about nothing." },
  { image: "assets/images/photo6.jpeg", date: "2026.04.25", time: "08:29 PM", caption: "One more year, together." },
];

const memoryState = {
  index: 0,
  autoplay: true,
  autoplayTimer: null,
  cards: [],
  dots: [],
  bootDone: false,
};

function memoryLabel(i) {
  return "MEMORY_" + String(i + 1).padStart(2, "0");
}

function buildMemoryStage() {
  const stage = document.getElementById("memoryStage");
  stage.innerHTML = "";
  memoryState.cards = MEMORIES.map((mem, i) => {
    const card = document.createElement("div");
    card.className = "memory-card";
    card.innerHTML = `
      <div class="memory-card-frame">
        <div class="memory-card-photo" style="background-image:url('${mem.image}')"></div>
        <div class="memory-card-shine"></div>
        <div class="memory-card-label">${memoryLabel(i)}</div>
        <div class="memory-card-heart">♥</div>
        <div class="memory-card-info">
          <div class="memory-card-date"><span>${mem.date}</span><span class="memory-card-time">${mem.time}</span></div>
          <div class="memory-card-caption">${mem.caption}</div>
        </div>
      </div>
      <div class="memory-card-reflection" style="background-image:url('${mem.image}')"></div>
    `;
    card.addEventListener("click", () => {
      if (i !== memoryState.index) goToMemory(i);
    });
    stage.appendChild(card);
    return card;
  });

  const pagination = document.getElementById("memoryPagination");
  pagination.innerHTML = "";
  memoryState.dots = MEMORIES.map((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "memory-dot";
    dot.setAttribute("aria-label", "Go to " + memoryLabel(i));
    dot.addEventListener("click", () => goToMemory(i));
    pagination.appendChild(dot);
    return dot;
  });

  document.getElementById("memoryTotalCount").textContent = MEMORIES.length;
}

function renderMemoryStage() {
  const total = MEMORIES.length;
  memoryState.cards.forEach((card, i) => {
    let offset = i - memoryState.index;
    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;

    const abs = Math.abs(offset);
    let x = 0, scale = 1, rotY = 0, z = 0, opacity = 1, blur = 0;

    if (abs === 0) {
      x = 0; scale = 1; rotY = 0; z = 40; opacity = 1; blur = 0;
    } else if (abs === 1) {
      x = 230 * Math.sign(offset); scale = 0.8; rotY = -22 * Math.sign(offset); z = 10; opacity = 0.55; blur = 1;
    } else if (abs === 2) {
      x = 380 * Math.sign(offset); scale = 0.64; rotY = -30 * Math.sign(offset); z = 0; opacity = 0.25; blur = 2;
    } else {
      x = 460 * Math.sign(offset); scale = 0.5; rotY = -32 * Math.sign(offset); z = -10; opacity = 0; blur = 3;
    }

    card.style.transform = `translate(-50%, -50%) translateX(${x}px) translateZ(${z}px) rotateY(${rotY}deg) scale(${scale})`;
    card.style.opacity = opacity;
    card.style.filter = blur ? `blur(${blur}px)` : "none";
    card.style.zIndex = 100 - abs;
    card.style.pointerEvents = abs <= 2 ? "auto" : "none";
    card.classList.toggle("memory-card--active", abs === 0);
  });

  memoryState.dots.forEach((dot, i) => {
    dot.classList.toggle("memory-dot--active", i === memoryState.index);
  });
}

function goToMemory(index) {
  const total = MEMORIES.length;
  memoryState.index = ((index % total) + total) % total;
  renderMemoryStage();
  updateMemoryContinueVisibility();
  audio.chime(pick([720, 780, 840]), 0, 0.8, 0.12);
}

function updateMemoryContinueVisibility() {
  const btn = document.getElementById("memoryContinueBtn");
  const isLast = memoryState.index === MEMORIES.length - 1;
  btn.classList.toggle("show", memoryState.bootDone && isLast);
}

function startMemoryAutoplay() {
  clearInterval(memoryState.autoplayTimer);
  memoryState.autoplayTimer = setInterval(() => goToMemory(memoryState.index + 1), 4200);
}

function stopMemoryAutoplay() {
  clearInterval(memoryState.autoplayTimer);
  memoryState.autoplayTimer = null;
}

function setupMemoryControls() {
  if (memoryState.controlsBound) return;
  memoryState.controlsBound = true;

  document.getElementById("memPrevBtn").addEventListener("click", () => {
    goToMemory(memoryState.index - 1);
  });
  document.getElementById("memNextBtn").addEventListener("click", () => {
    goToMemory(memoryState.index + 1);
  });

  const autoplayBtn = document.getElementById("memAutoplayBtn");
  autoplayBtn.addEventListener("click", () => {
    memoryState.autoplay = !memoryState.autoplay;
    autoplayBtn.dataset.on = memoryState.autoplay ? "true" : "false";
    autoplayBtn.textContent = memoryState.autoplay ? "ON" : "OFF";
    if (memoryState.autoplay) startMemoryAutoplay();
    else stopMemoryAutoplay();
  });

  document.addEventListener("keydown", (e) => {
    if (!document.getElementById("scene6").classList.contains("scene--active")) return;
    if (e.key === "ArrowLeft") goToMemory(memoryState.index - 1);
    if (e.key === "ArrowRight") goToMemory(memoryState.index + 1);
  });

  const stage = document.getElementById("memoryStage");
  let touchStartX = null;
  stage.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) goToMemory(memoryState.index + (dx < 0 ? 1 : -1));
    touchStartX = null;
  });
}

function animateDataTransferFlavor() {
  const pctEl = document.getElementById("dataTransferPct");
  const fillEl = document.getElementById("dataTransferFill");
  const etaEl = document.getElementById("dataTransferEta");
  let pct = 68;
  const tick = () => {
    pct = clamp(pct + rand(-2, 3), 40, 99);
    pctEl.textContent = Math.round(pct) + "%";
    fillEl.style.width = pct + "%";
    const secs = Math.round((100 - pct) * 8);
    const mm = String(Math.floor(secs / 60)).padStart(2, "0");
    const ss = String(secs % 60).padStart(2, "0");
    etaEl.textContent = "00:" + mm + ":" + ss;
    setTimeout(tick, rand(1400, 2400));
  };
  tick();
}

function spawnMemoryParticles() {
  const host = document.getElementById("memoryParticles");
  host.innerHTML = "";
  const count = 26;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    p.className = "memory-particle";
    p.style.left = rand(0, 100) + "%";
    p.style.animationDelay = rand(0, 8) + "s";
    p.style.animationDuration = rand(7, 14) + "s";
    p.style.setProperty("--drift", rand(-40, 40) + "px");
    host.appendChild(p);
  }
}

function runMemoryBootSequence() {
  const subtitle = document.getElementById("memorySubtitle");
  const loadFill = document.getElementById("memoryLoadFill");
  const steps = ["Loading Memory...", "Memory Restored...", "Archive Opened..."];
  [document.getElementById("hudTopleft"), document.getElementById("hudTopright"),
   document.getElementById("hudBottomleft"), document.getElementById("hudBottomright"),
   document.getElementById("memoryPagination")].forEach((el) => el.classList.remove("show"));
  document.getElementById("memoryStage").classList.remove("show");
  loadFill.style.width = "0%";

  steps.forEach((text, i) => {
    setTimeout(() => {
      subtitle.textContent = text;
      loadFill.style.width = Math.round(((i + 1) / steps.length) * 100) + "%";
      audio.glitchTick();
    }, i * 900);
  });

  setTimeout(() => {
    subtitle.textContent = "";
    document.getElementById("memoryStage").classList.add("show");
    [document.getElementById("hudTopleft"), document.getElementById("hudTopright"),
     document.getElementById("hudBottomleft"), document.getElementById("hudBottomright"),
     document.getElementById("memoryPagination")].forEach((el) => el.classList.add("show"));
    memoryState.bootDone = true;
    updateMemoryContinueVisibility();
    audio.sparkleChime();
    if (memoryState.autoplay) startMemoryAutoplay();
  }, steps.length * 900 + 500);
}

function setupMemoryContinue() {
  const btn = document.getElementById("memoryContinueBtn");
  if (btn.dataset.bound) return;
  btn.dataset.bound = "1";
  btn.addEventListener("click", () => {
    stopMemoryAutoplay();
    btn.classList.remove("show");
    // Prime the video element for unmuted autoplay while we still have a
    // direct user-gesture context (this click). Browsers require that.
    const video = document.getElementById("pbVideo");
    video.muted = false;
    video.play().then(() => {
      video.pause();
      video.currentTime = 0;
    }).catch(() => {});
    goToScene7();
  });
}

function goToScene6() {
  document.getElementById("scene5").classList.remove("scene--active");
  document.getElementById("scene6").classList.add("scene--active");

  buildMemoryStage();
  goToMemory(0);
  setupMemoryControls();
  setupMemoryContinue();
  spawnMemoryParticles();
  animateDataTransferFlavor();
  runMemoryBootSequence();
}

/* ---------------------------------------------------------
   8. SCENE 7 — MEMORY PLAYBACK
--------------------------------------------------------- */
/* EDIT ME — swap `src` for your real video (e.g. "assets/videos/aina-video.mp4").
   poster/description are all free text. Chapter timestamps below are set as
   fractions of the video's real length, so they auto-adjust to fit — no need
   to change anything just because your clip is a different length (e.g. 21s). */
const PLAYBACK_VIDEO = {
  src: "assets/videos/aina.mp4",
  poster: MEMORIES[2] ? MEMORIES[2].image : "",
  label: "PLAYBACK_01",
  date: "2026.08.28",
  location: "UNKNOWN",
  mood: "HAPPY",
  description: "Random moments that turned into the best memories.",
};

/* Chapter markers as fractions (0–1) of the video's real duration, so they
   still line up nicely once a longer real video is swapped in. */
const PLAYBACK_CHAPTERS = [
  { fraction: 0, label: "START", thumb: MEMORIES[0] && MEMORIES[0].image },
  { fraction: 0.25, label: "DAY ONE", thumb: MEMORIES[1] && MEMORIES[1].image },
  { fraction: 0.6, label: "MEMORIES", thumb: MEMORIES[2] && MEMORIES[2].image },
  { fraction: 0.9, label: "SPECIAL", thumb: MEMORIES[5] && MEMORIES[5].image },
];

function formatTime(secs) {
  if (!isFinite(secs) || secs < 0) secs = 0;
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

function buildPlaybackWaveform() {
  const host = document.getElementById("pbWaveform");
  host.innerHTML = "";
  const bars = 28;
  for (let i = 0; i < bars; i++) {
    const bar = document.createElement("span");
    bar.className = "waveform-bar";
    bar.style.animationDelay = rand(0, 1.2) + "s";
    bar.style.animationDuration = rand(0.6, 1.3) + "s";
    host.appendChild(bar);
  }
}

function buildPlaybackDetails() {
  document.getElementById("pbClipLabel").textContent = PLAYBACK_VIDEO.label;
  document.getElementById("pbDetailDate").textContent = PLAYBACK_VIDEO.date;
  document.getElementById("pbDetailLocation").textContent = PLAYBACK_VIDEO.location;
  document.getElementById("pbDetailMood").textContent = PLAYBACK_VIDEO.mood;
  document.getElementById("pbDetailDescription").textContent = PLAYBACK_VIDEO.description;
  document.getElementById("pbMemoriesFound").textContent = MEMORIES.length;
  const video = document.getElementById("pbVideo");
  video.poster = PLAYBACK_VIDEO.poster || "";
  const src = document.createElement("source");
  src.src = PLAYBACK_VIDEO.src;
  video.innerHTML = "";
  video.appendChild(src);
  document.getElementById("pbReflection").style.backgroundImage = PLAYBACK_VIDEO.poster
    ? `url('${PLAYBACK_VIDEO.poster}')`
    : "none";
}

function buildPlaybackChapters() {
  const list = document.getElementById("chaptersList");
  list.innerHTML = "";
  PLAYBACK_CHAPTERS.forEach((ch, i) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "chapter-item";
    item.innerHTML = `
      <div class="chapter-thumb" style="background-image:url('${ch.thumb || ""}')"></div>
      <div class="chapter-meta">
        <span class="chapter-time" data-fraction="${ch.fraction}">--:--</span>
        <span class="chapter-label">${ch.label}</span>
      </div>
    `;
    item.addEventListener("click", () => seekToChapter(i));
    list.appendChild(item);
  });
}

function seekToChapter(i) {
  const video = document.getElementById("pbVideo");
  const dur = video.duration;
  if (!isFinite(dur)) return;
  video.currentTime = clamp(PLAYBACK_CHAPTERS[i].fraction * dur, 0, dur - 0.05);
  audio.glitchTick();
}

function currentChapterIndex() {
  const video = document.getElementById("pbVideo");
  const dur = video.duration || 1;
  const frac = video.currentTime / dur;
  let idx = 0;
  PLAYBACK_CHAPTERS.forEach((ch, i) => { if (frac >= ch.fraction - 0.001) idx = i; });
  return idx;
}

function setupPlaybackControls() {
  const video = document.getElementById("pbVideo");
  const playBtn = document.getElementById("pbPlayBtn");
  const muteBtn = document.getElementById("pbMuteBtn");
  const prevBtn = document.getElementById("pbPrevBtn");
  const nextBtn = document.getElementById("pbNextBtn");
  const settingsBtn = document.getElementById("pbSettingsBtn");
  const fullscreenBtn = document.getElementById("pbFullscreenBtn");
  const seek = document.getElementById("pbSeek");
  const seekFill = document.getElementById("pbSeekFill");
  const timeCurrent = document.getElementById("pbTimeCurrent");
  const timeTotal = document.getElementById("pbTimeTotal");
  const emotionFill = document.getElementById("pbEmotionFill");
  const emotionLabel = document.getElementById("pbEmotionLabel");

  if (video.dataset.bound) return;
  video.dataset.bound = "1";

  playBtn.addEventListener("click", () => {
    if (video.paused) video.play(); else video.pause();
  });
  video.addEventListener("play", () => { playBtn.textContent = "⏸"; });
  video.addEventListener("pause", () => { playBtn.textContent = "▶"; });

  muteBtn.addEventListener("click", () => {
    video.muted = !video.muted;
    muteBtn.textContent = video.muted ? "🔇" : "🔊";
  });

  prevBtn.addEventListener("click", () => {
    seekToChapter(Math.max(0, currentChapterIndex() - 1));
  });
  nextBtn.addEventListener("click", () => {
    seekToChapter(Math.min(PLAYBACK_CHAPTERS.length - 1, currentChapterIndex() + 1));
  });

  settingsBtn.addEventListener("click", () => audio.glitchTick());

  fullscreenBtn.addEventListener("click", () => {
    const frame = document.getElementById("playbackFrame");
    if (frame.requestFullscreen) frame.requestFullscreen().catch(() => {});
  });

  const seekTo = (clientX) => {
    const r = seek.getBoundingClientRect();
    const frac = clamp((clientX - r.left) / r.width, 0, 1);
    if (isFinite(video.duration)) video.currentTime = frac * video.duration;
  };
  seek.addEventListener("click", (e) => seekTo(e.clientX));

  video.addEventListener("loadedmetadata", () => {
    timeTotal.textContent = formatTime(video.duration);
    document.querySelectorAll(".chapter-time").forEach((el) => {
      const frac = parseFloat(el.dataset.fraction);
      el.textContent = formatTime(frac * video.duration);
    });
  });

  video.addEventListener("timeupdate", () => {
    const dur = video.duration || 0;
    const pct = dur ? (video.currentTime / dur) * 100 : 0;
    seekFill.style.width = pct + "%";
    timeCurrent.textContent = formatTime(video.currentTime);
    emotionFill.style.width = pct + "%";
    emotionLabel.textContent = "LOADING EMOTIONS... " + Math.round(pct) + "%";
    document.querySelectorAll(".chapter-item").forEach((item, i) => {
      item.classList.toggle("chapter-item--active", i === currentChapterIndex());
    });
  });

  video.addEventListener("ended", () => {
    playBtn.textContent = "▶";
    const status = document.getElementById("pbStatusText");
    status.textContent = "Playback Complete.";
    audio.sparkleChime();
    setTimeout(() => {
      status.textContent = "Preparing Final Gift...";
      audio.whoom();
    }, 1600);
    setTimeout(() => {
      goToScene8();
    }, 3400);
  });
}

function goToScene7() {
  document.getElementById("scene6").classList.remove("scene--active");
  const scene7 = document.getElementById("scene7");
  scene7.classList.add("scene--active");

  const blackout = document.getElementById("playbackBlackout");
  blackout.style.opacity = "1";
  [document.getElementById("pbHudTopleft"), document.getElementById("pbHudTopright"),
   document.getElementById("pbHudChapters"), document.getElementById("pbHudDetails"),
   document.getElementById("pbHudNext"), document.getElementById("playbackFrame")]
    .forEach((el) => el.classList.remove("show"));

  buildPlaybackWaveform();

  const subtitle = document.getElementById("pbSubtitle");
  const video = document.getElementById("pbVideo");
  subtitle.textContent = "";

  setTimeout(() => {
    subtitle.textContent = "Initializing...";
    audio.glitchTick();
  }, 500);

  setTimeout(() => {
    blackout.style.opacity = "0";
    subtitle.textContent = "ARCHIVE ID: AC-0724";
    [document.getElementById("pbHudTopleft"), document.getElementById("pbHudTopright"),
     document.getElementById("pbHudChapters"), document.getElementById("pbHudDetails"),
     document.getElementById("pbHudNext"), document.getElementById("playbackFrame")]
      .forEach((el) => el.classList.add("show"));
    audio.sparkleChime();
    video.play().catch(() => {});
  }, 2000);
}

/* ---------------------------------------------------------
   9. SCENE 8 — FINAL CAKE
--------------------------------------------------------- */
function spawnCakeFireflies() {
  const host = document.getElementById("cakeFireflies");
  if (!host) return;
  host.innerHTML = "";
  const count = 22;
  for (let i = 0; i < count; i++) {
    const f = document.createElement("span");
    f.className = "cake-firefly";
    f.style.left = rand(0, 100) + "%";
    f.style.animationDelay = rand(0, 10) + "s";
    f.style.animationDuration = rand(9, 16) + "s";
    f.style.setProperty("--drift", rand(-50, 50) + "px");
    host.appendChild(f);
  }
}

/* Confetti + firework burst overlay, self-contained so it never touches the
   earlier `runConfetti` helper reserved above. Runs for `duration` ms then
   clears itself. */
function runCakeCelebration(canvas, duration = 6500) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = () => window.innerWidth;
  const h = () => window.innerHeight;

  function resize() {
    canvas.width = w() * dpr;
    canvas.height = h() * dpr;
    canvas.style.width = w() + "px";
    canvas.style.height = h() + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  const onResize = () => resize();
  window.addEventListener("resize", onResize);

  const confetti = new Array(140).fill(0).map(() => ({
    x: rand(0, w()), y: rand(-h(), 0),
    r: rand(3, 7), speed: rand(1.5, 4), drift: rand(-1, 1),
    rot: rand(0, Math.PI * 2), rotSpeed: rand(-0.06, 0.06),
    color: pick(PALETTE),
  }));

  let fireworks = [];
  function spawnFirework() {
    const cx = rand(w() * 0.15, w() * 0.85);
    const cy = rand(h() * 0.15, h() * 0.45);
    const color = pick(PALETTE);
    const particles = new Array(40).fill(0).map(() => {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(1.5, 5);
      return { x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, color };
    });
    fireworks.push(particles);
    audio.sparkleChime();
  }

  let fireTimer = 0;
  const start = performance.now();
  function loop(now) {
    const elapsed = now - start;
    ctx.clearRect(0, 0, w(), h());

    confetti.forEach((p) => {
      p.y += p.speed; p.x += p.drift; p.rot += p.rotSpeed;
      if (p.y > h() + 20) { p.y = rand(-40, -10); p.x = rand(0, w()); }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.5);
      ctx.restore();
    });

    fireTimer -= 16;
    if (fireTimer <= 0 && elapsed < duration - 1200) {
      fireTimer = rand(500, 1100);
      spawnFirework();
    }

    fireworks.forEach((particles) => {
      particles.forEach((fp) => {
        fp.x += fp.vx; fp.y += fp.vy; fp.vy += 0.02; fp.life -= 0.018;
        ctx.globalAlpha = Math.max(fp.life, 0);
        ctx.fillStyle = fp.color;
        ctx.beginPath();
        ctx.arc(fp.x, fp.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
    });
    fireworks = fireworks.filter((particles) => particles.some((fp) => fp.life > 0));
    ctx.globalAlpha = 1;

    if (elapsed < duration) {
      requestAnimationFrame(loop);
    } else {
      ctx.clearRect(0, 0, w(), h());
      window.removeEventListener("resize", onResize);
    }
  }
  requestAnimationFrame(loop);
}

function cutCake() {
  const stage = document.getElementById("cakeStage");
  const panel = document.getElementById("cakePanel");
  const knife = document.getElementById("cakeKnife");
  const sub = document.getElementById("cakeSub");

  stage.classList.add("sliced");
  knife.classList.remove("active");
  knife.classList.add("drop");
  audio.pop();
  if (sub) sub.textContent = "Make a wish...";

  setTimeout(() => {
    runCakeCelebration(document.getElementById("cakeFxCanvas"));
    audio.sparkleChime();
  }, 300);

  setTimeout(() => audio.birthdayTune(), 700);

  setTimeout(() => {
    stage.classList.add("fade-out");
    panel.classList.add("fade-out");
    document.getElementById("cakeTitleBlock").classList.add("fade-out");
  }, 6200);

  setTimeout(() => {
    document.getElementById("cakeWish").classList.add("show");
  }, 7400);
}

function setupCakeWish() {
  const btn = document.getElementById("cakeWish");
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound = "1";
  btn.addEventListener("click", () => {
    if (btn.dataset.clicked) return;
    btn.dataset.clicked = "1";
    goToScene9();
  });
}

function setupCakeDrag() {
  const stage = document.getElementById("cakeStage");
  const knife = document.getElementById("cakeKnife");
  if (stage.dataset.bound) return;
  stage.dataset.bound = "1";

  let dragging = false;
  let cut = false;
  let startY = null;

  const moveKnife = (x, y) => {
    const r = stage.getBoundingClientRect();
    knife.style.left = (x - r.left) + "px";
    knife.style.top = (y - r.top) + "px";
  };

  const onDown = (e) => {
    if (cut) return;
    audio.unlock();
    dragging = true;
    const pt = e.touches ? e.touches[0] : e;
    startY = pt.clientY;
    knife.classList.add("active");
    moveKnife(pt.clientX, pt.clientY);
    if (e.cancelable) e.preventDefault();
  };
  const onMove = (e) => {
    if (!dragging || cut) return;
    const pt = e.touches ? e.touches[0] : e;
    moveKnife(pt.clientX, pt.clientY);
    const dy = pt.clientY - startY;
    if (dy > stage.clientHeight * 0.5) {
      cut = true;
      dragging = false;
      cutCake();
    }
    if (e.cancelable) e.preventDefault();
  };
  const onUp = () => { dragging = false; };

  stage.addEventListener("pointerdown", onDown);
  stage.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  stage.addEventListener("touchstart", onDown, { passive: false });
  stage.addEventListener("touchmove", onMove, { passive: false });
  window.addEventListener("touchend", onUp);
}

function goToScene8() {
  document.getElementById("scene7").classList.remove("scene--active");
  const scene8 = document.getElementById("scene8");
  scene8.classList.add("scene--active");

  new StarField(document.getElementById("cakeStarsCanvas"));
  spawnCakeFireflies();
  setupCakeDrag();
  setupCakeWish();

  audio.stopAmbient(1.5);
  audio.whoom();

  setTimeout(() => {
    document.getElementById("cakeTitleBlock").classList.add("show");
    audio.sparkleChime();
  }, 900);

  setTimeout(() => {
    document.getElementById("cakePanel").classList.add("show");
  }, 1700);

  setTimeout(() => {
    document.getElementById("cakeStage").classList.add("show");
    audio.deliveryChime();
  }, 2400);
}

/* ---------------------------------------------------------
   10. SCENE 9 — FINAL MESSAGE (hidden archive letter)
--------------------------------------------------------- */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const LETTER_META = { senderMasked: "********", sender: "Zyan", receiver: "Aina", security: "PRIVATE" };

const MEMORY_ITEMS = [
  { file: "MEMORY_001.JPG", caption: "First Day — UMP Year 1, Sem 1, Hari 1", grad: "linear-gradient(135deg,#4a3aa8,#8f6fe0)" },
  { file: "MEMORY_028.JPG", caption: "Makan Together", grad: "linear-gradient(135deg,#9a3f76,#e08bb0)" },
  { file: "MEMORY_056.JPG", caption: "Fish It Together — GAME_RECORD.LOG", grad: "linear-gradient(135deg,#2f7f9f,#6fd0e8)" },
  { file: "MEMORY_078.JPG", caption: "Chit Chat — Night Talk", grad: "linear-gradient(135deg,#6a3fa0,#b98ef0)" },
];

/* The letter itself. Each entry is typed as its own terminal line, in
   order; `memory` entries reveal a card in the MEMORY ARCHIVE panel,
   `slow` switches the letter into its quieter emotional pace, and
   `error` runs the missing-memory (file-not-found) beat. Edit the text
   here to change the message. */
const LETTER_SCRIPT = [
  { t: "line", text: "Hi Aina." },
  { t: "line", text: "Selamat Hari Jadi." },
  { t: "line", text: "Sebenarnya..." },
  { t: "line", text: "Aku tak pandai sangat nak cakap apa yang aku rasa." },
  { t: "line", text: "Tapi untuk hari istimewa ni..." },
  { t: "line", text: "Aku nak cakap sikit benda yang mungkin selama ni aku tak pernah cakap." },
  { t: "line", text: "Terima kasih sebab sudi berkawan dengan aku." },
  { t: "memory", index: 0 },
  { t: "line", text: "Terima kasih sebab masih kawan dengan aku..." },
  { t: "line", text: "...dari Hari Kelas Pertama dekat UMP." },
  { t: "line", text: "Tahun 1. Semester 1. Hari Pertama." },
  { t: "line", text: "Terima kasih sebab selalu bawak aku keluar." },
  { t: "line", text: "Terima kasih sebab pernah belanja aku makan." },
  { t: "memory", index: 1 },
  { t: "line", text: "Terima kasih sebab main Fish It sama-sama." },
  { t: "memory", index: 2 },
  { t: "line", text: "Terima kasih sebab selalu bergosip aku." },
  { t: "memory", index: 3 },
  { t: "slow" },
  { t: "line", text: "Aku tau..." },
  { t: "line", text: "Aku ni bukanlah kawan yang paling best sangat pun." },
  { t: "line", text: "Kadang-kadang aku membosankan." },
  { t: "line", text: "Kadang-kadang aku menyusahkan." },
  { t: "line", text: "Kadang-kadang aku ni....." },
  { t: "line", text: "Tapi kau tetap berkawan dengan aku sampai sekarang.", pauseAfter: 1000 },
  { t: "line", text: "Sorry..." },
  { t: "line", text: "...sebab kita tak banyak ambil gambar dan video sama-sama." },
  { t: "line", text: "Bila fikir balik..." },
  { t: "line", text: "Rasa rugi juga." },
  { t: "line", text: "Lagi sedih..." },
  { t: "line", text: "...bila gambar dan video lama hilang sebab phone aku rosak." },
  { t: "error" },
  { t: "line", text: "Selama ni..." },
  { t: "line", text: "Aku tak pernah wish betul-betul dekat kau." },
  { t: "line", text: "Tak pernah juga bagi hadiah." },
  { t: "line", text: "Jadi..." },
  { t: "line", text: "Website ni hadiah pertama daripada aku." },
  { t: "line", text: "Sekarang kita dah habis intern." },
  { t: "line", text: "Lepas ni..." },
  { t: "line", text: "Aku tak tau bila kita akan jumpa lagi.", pauseAfter: 1600 },
  { t: "line", text: "Tapi aku harap..." },
  { t: "line", text: "Walau macam mana pun nanti..." },
  { t: "line", text: "Kita tetap berkawan.", pauseAfter: 1200 },
  { t: "signature" },
  { t: "line", text: "Happy Birthday, Aina. — Zyan", pauseAfter: 2600 },
];

let msgTypingSpeed = 24;

async function msgTypeInto(el, text, speed) {
  return new Promise((resolve) => {
    let i = 0;
    const step = () => {
      el.textContent = text.slice(0, i);
      if (i % 2 === 0) audio.keyTick();
      i++;
      if (i <= text.length) {
        setTimeout(step, speed);
      } else {
        resolve();
      }
    };
    step();
  });
}

function msgLogAppend(text, ok = true) {
  const list = document.getElementById("msgLogList");
  if (!list) return;
  const time = new Date().toLocaleTimeString("en-GB", { hour12: false });
  const line = document.createElement("div");
  line.className = "msg-log-line";
  line.innerHTML = `<span class="msg-log-time">${time}</span>${text} <span class="msg-log-ok">${ok ? "[OK]" : ""}</span>`;
  list.appendChild(line);
  list.scrollTop = list.scrollHeight;
  requestAnimationFrame(() => line.classList.add("show"));
}

/* ---- boot terminal ---- */
async function msgBootLine(text, cls = "") {
  const term = document.getElementById("msgBootTerminal");
  const line = document.createElement("p");
  line.className = "msg-boot-line " + cls;
  line.innerHTML = `&gt;&gt; `;
  term.appendChild(line);
  const textSpan = document.createElement("span");
  line.appendChild(textSpan);
  await msgTypeInto(textSpan, text, 26);
}

function msgBootStatic(text, cls = "") {
  const term = document.getElementById("msgBootTerminal");
  const line = document.createElement("p");
  line.className = "msg-boot-line " + cls;
  line.textContent = text;
  term.appendChild(line);
}

async function msgBootProgress(duration = 1500) {
  const term = document.getElementById("msgBootTerminal");
  const wrap = document.createElement("div");
  wrap.className = "hud-progress";
  const fill = document.createElement("div");
  fill.className = "hud-progress-fill";
  wrap.appendChild(fill);
  term.appendChild(wrap);
  await wait(60);
  fill.style.transition = `width ${duration}ms ease`;
  fill.style.width = "100%";
  await wait(duration + 100);
}

async function runMessageBoot() {
  const boot = document.getElementById("msgBoot");
  const term = document.getElementById("msgBootTerminal");
  term.innerHTML = `<span class="msg-boot-caret">&gt;</span>`;
  await wait(2000);
  term.innerHTML = "";

  await msgBootLine("SYSTEM ONLINE...");
  await wait(500);
  await msgBootLine("Birthday Celebration Protocol...");
  msgBootStatic("COMPLETED ✔", "msg-boot-line--ok");
  audio.sparkleChime();
  await wait(500);

  await msgBootLine("Searching hidden archive...");
  await msgBootProgress(1700);
  msgLogAppend("Scanning memories...");
  await msgBootLine("Archive Found.", "msg-boot-line--accent");
  await wait(400);

  await msgBootLine("Decrypting...");
  await msgBootProgress(1500);
  msgLogAppend("Decrypting message...");

  document.getElementById("scene9").classList.add("msg-glitching");
  audio.glitchBlip();
  audio.glitchTick();
  await wait(300);
  document.getElementById("scene9").classList.remove("msg-glitching");

  const whiteout = document.getElementById("msgWhiteout");
  whiteout.classList.add("blast");
  audio.whoom();
  msgBootStatic("ACCESS GRANTED", "msg-boot-line--accent");
  await wait(900);

  boot.classList.add("hide");
  await wait(600);
  whiteout.classList.remove("blast");
  whiteout.style.opacity = 0;
}

/* ---- dashboard reveal ---- */
async function revealMessageDashboard() {
  const dashboard = document.getElementById("msgDashboard");
  dashboard.classList.add("show");

  const order = ["msgPanelAccess", "msgPanelDecrypt", "msgPanelMemory", "msgLetterPanel", "msgPanelLog", "msgPanelStatus", "msgPanelEnvelope", "msgPanelConnection", "msgPanelIdentity"];
  for (const id of order) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.classList.add("show");
    audio.glitchTick();
    await wait(120);
  }

  document.getElementById("msgAccessBar").style.width = "100%";
  document.getElementById("msgDecryptBar").style.width = "100%";
  document.getElementById("msgStatDecrypt").textContent = "[OK]";
  document.getElementById("msgStatDecrypt").classList.add("hud-value--ok");
  msgLogAppend("Loading emotions...");

  await wait(500);
}

/* ---- letter header meta ---- */
async function typeLetterMeta() {
  await msgTypeInto(document.getElementById("msgMetaSender"), LETTER_META.senderMasked, 40);
  await wait(250);
  await msgTypeInto(document.getElementById("msgMetaReceiver"), LETTER_META.receiver, 40);
  await wait(250);
  await msgTypeInto(document.getElementById("msgMetaSecurity"), LETTER_META.security, 40);
  await wait(250);
  const accessRow = document.getElementById("msgMetaAccess");
  accessRow.style.transition = "opacity 0.6s ease";
  accessRow.style.opacity = 1;
  accessRow.textContent = `Only ${LETTER_META.receiver} can read this message.`;
  await wait(900);
}

/* ---- memory card reveal ---- */
function revealMemoryCard(index) {
  const item = MEMORY_ITEMS[index];
  const list = document.getElementById("msgMemoryList");
  const card = document.createElement("div");
  card.className = "msg-memory-item";
  card.innerHTML = `
    <div class="msg-memory-thumb" style="background:${item.grad}"></div>
    <div class="msg-memory-info">
      <div class="msg-memory-file">${item.file}</div>
      <div class="msg-memory-caption">${item.caption}</div>
    </div>`;
  list.appendChild(card);
  requestAnimationFrame(() => card.classList.add("show"));
  audio.sparkleChime();
  list.scrollTop = list.scrollHeight;
}

/* ---- missing memory (file-not-found) beat ---- */
async function runMissingMemoryError() {
  const list = document.getElementById("msgMemoryList");
  const card = document.createElement("div");
  card.className = "msg-memory-item msg-memory-item--error";
  card.innerHTML = `
    <div class="msg-memory-thumb">⚠</div>
    <div class="msg-memory-info">
      <div class="msg-memory-file" id="msgErrorFile">Searching Archive...</div>
      <div class="msg-memory-caption" id="msgErrorCaption">&nbsp;</div>
    </div>`;
  list.appendChild(card);
  requestAnimationFrame(() => card.classList.add("show"));
  list.scrollTop = list.scrollHeight;

  const fileEl = document.getElementById("msgErrorFile");
  const capEl = document.getElementById("msgErrorCaption");
  await wait(700);
  fileEl.textContent = "MEMORY_014.JPG";
  await wait(600);
  capEl.textContent = "Loading...";
  await wait(500);
  capEl.textContent = "Loading...";
  audio.glitchTick();
  await wait(600);
  fileEl.textContent = "ERROR";
  capEl.textContent = "FILE NOT FOUND";
  audio.errorBuzz();
  await wait(1500);
  card.style.transition = "opacity 0.6s ease";
  card.style.opacity = 0;
  await wait(650);
  card.remove();
}

/* ---- signature / connection info reveal ---- */
async function revealSignature() {
  document.getElementById("msgStatReading").textContent = "[OK]";
  document.getElementById("msgStatReading").classList.add("hud-value--ok");

  await wait(400);
  document.getElementById("msgConnStatus").textContent = "ACTIVE ✔";
  await wait(200);
  document.getElementById("msgConnStable").textContent = "STABLE";
  await wait(200);
  document.getElementById("msgConnLimit").textContent = "NONE";
  await wait(200);
  document.getElementById("msgConnArchive").textContent = "FOREVER";
  audio.sparkleChime();

  await wait(500);
  await msgTypeInto(document.getElementById("msgIdentityName"), LETTER_META.sender, 55);
  document.getElementById("msgIdentityName").textContent += " ✓";
  audio.deliveryChime();
  msgLogAppend("Heart Check...");
  await wait(600);
}

/* ---- main letter runner ---- */
async function runLetterScript() {
  const body = document.getElementById("msgLetterBody");
  let lineCount = 0;
  const totalLines = LETTER_SCRIPT.filter((s) => s.t === "line").length;

  for (const step of LETTER_SCRIPT) {
    if (step.t === "line") {
      const p = document.createElement("p");
      p.className = "msg-line";
      p.innerHTML = `<span class="msg-caret">&gt;</span><span class="msg-line-text"></span><span class="msg-cursor"></span>`;
      body.appendChild(p);
      body.scrollTop = body.scrollHeight;
      const textEl = p.querySelector(".msg-line-text");
      const cursorEl = p.querySelector(".msg-cursor");
      await msgTypeInto(textEl, step.text, msgTypingSpeed);
      cursorEl.remove();
      lineCount++;
      const pct = Math.min(100, Math.round((lineCount / totalLines) * 100));
      document.getElementById("msgStatEmotions").textContent = pct + "%";
      await wait(step.pauseAfter || (msgTypingSpeed > 30 ? 650 : 450));
    } else if (step.t === "memory") {
      revealMemoryCard(step.index);
      await wait(600);
    } else if (step.t === "slow") {
      msgTypingSpeed = 42;
      document.getElementById("msgLetterPanel").classList.add("msg-emotional");
      await wait(400);
    } else if (step.t === "error") {
      await runMissingMemoryError();
    } else if (step.t === "signature") {
      await wait(800);
      await revealSignature();
    }
  }
}

/* ---- ending ---- */
async function runMessageEnding() {
  document.getElementById("msgStatDelivery").textContent = "[SUCCESS]";
  document.getElementById("msgStatDelivery").classList.add("hud-value--ok");
  document.getElementById("msgPanelEnvelope").classList.add("delivered");
  msgLogAppend("Ready to deliver...");
  audio.deliveryChime();

  await wait(1200);
  document.getElementById("msgFinal").classList.add("show");
  await wait(3200);

  const ending = document.getElementById("msgEnding");
  const endingText = document.getElementById("msgEndingText");
  ending.classList.add("show");
  audio.stopAmbient(1.5);
  audio.stopDrone(1.5);

  const lines = ["SYSTEM SHUTDOWN...", "", "Goodbye.", "See you again.", "", "❤"];
  for (const line of lines) {
    if (line) {
      const span = document.createElement("div");
      span.textContent = line;
      endingText.appendChild(span);
    } else {
      endingText.appendChild(document.createElement("br"));
    }
    await wait(900);
  }
}

async function goToScene9() {
  audio.unlock();
  document.getElementById("scene8").classList.remove("scene--active");
  const scene9 = document.getElementById("scene9");
  scene9.classList.add("scene--active");

  await runMessageBoot();
  await revealMessageDashboard();
  await typeLetterMeta();
  await runLetterScript();
  await runMessageEnding();
}

/* ---------------------------------------------------------
   11. BOOTSTRAP
--------------------------------------------------------- */
window.addEventListener("load", () => {
  buildPlaybackDetails();
  buildPlaybackChapters();
  setupPlaybackControls();

  const gate = document.getElementById("gate");
  const gateBtn = document.getElementById("gateBtn");

  const beginExperience = () => {
    audio.unlock();
    audio.bootChime();
    gateBtn.classList.add("launching");

    setTimeout(() => {
      gate.classList.add("hide");
      setTimeout(() => { gate.style.display = "none"; }, 750);

      const canvas = document.getElementById("glitch-canvas");
      new GlitchScene(canvas, () => {
        document.getElementById("scene1").classList.remove("scene--active");
        const scene2 = document.getElementById("scene2");
        scene2.classList.add("scene--active");
        audio.startAmbient();
        runScanScene();
      });
    }, 350);
  };

  gateBtn.addEventListener("click", beginExperience);
  gateBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") beginExperience();
  });
});