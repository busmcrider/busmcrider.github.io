layout: page
title: "Minuta Clock"
permalink: /minuta-clock

<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Classical Clock Comparison</title>
  <!--
    Two side-by-side clocks: Standard (12‑hour) and Classical (minuta/secunda/tertia).
    Visuals are identical; only the underlying movement differs.

    Key behaviors (unchanged by this refactor):
      - Standard: second hand ticks once per second.
      - Classical: tertia (red) ticks every 400 ms; secunda (yellow) completes a spin every 24 minutes;
                  minuta (white) completes a spin every 24 hours.
      - Readouts: Standard => HH:MM:SS AM/PM; Classical => MM:SS:TT
                  where MM = white-hand ticks (0..59) from minuta, SS = secunda 0..59, TT = tertia 0..59.

    Architecture:
      - (Scheduler) One rAF loop with a 200 ms quantum that calls step() at stable intervals.
      - (Model)     Pure functions computeStandard(now) / computeClassical(now) => { angles, digits }.
      - (View)      DOM is mutated only if values changed (reduces paints & layout).
      - (Labels)    Label mapper generates 12/24-hour dial labels (☀️ at 12, 🌙 at 24, Roman elsewhere).

    This file is heavily commented for clarity and future edits.
  -->
  <style>
    /* ===== Layout & styling (identical for both clocks) ===== */
    body {background:#0f1724;color:#fff;font-family:sans-serif;display:flex;flex-wrap:wrap;gap:30px;justify-content:center;align-items:flex-start;margin:0;padding:20px}
    .clock {text-align:center}
    svg {
  /* Responsive: fill container width, keep square aspect */
  width: min(90vw, var(--clock-max, 360px));
  height: auto;
  aspect-ratio: 1 / 1;
  display: block;
  margin-inline: auto;
}
    .readout {font-family:monospace;margin-top:10px;font-weight:600}
    .readout span {padding:0 2px}
    .hour-color {color:#fff}          /* maps to: standard hour hand / classical minuta (white) */
    .tick-color {color:#9aa7b2}       /* (unused now) legacy style for former NN slot */
    .minute-color {color:#ffd166}     /* maps to: standard minute hand / classical secunda (yellow) */
    .second-color {color:#ff6b6b}     /* maps to: standard second hand / classical tertia (red) */
    .ampm {opacity:0.9;}              /* subdued AM/PM */
/* Subtle typography and dial legibility */
  #ticks text, #ticks2 text {
    font-weight: 600;
    filter: drop-shadow(0 0 0.5px rgba(0,0,0,0.45));
  }
  /* Mark dial faces for future styling hooks */
  .dial-face { filter: drop-shadow(0 0 0.75px rgba(0,0,0,0.35)); }
  /* Animated hands hint to the compositor */
  .hand { will-change: transform; }
  /* Optional high-contrast mode (can be toggled via hash persistence: #contrast=high) */
  body.high-contrast #ticks text,
  body.high-contrast #ticks2 text { filter: drop-shadow(0 0 1px rgba(0,0,0,0.9)); }
</style>
</head>
<body>
  <!-- ===== Standard clock ===== -->
  <div class="clock" id="standard">
    <h2>Standard Clock</h2>
    <svg viewBox="-130 -130 260 260" role="img" aria-label="Standard 12-hour clock">
      <circle class="dial-face" cx="0" cy="0" r="120" fill="#071425" stroke="rgba(255,255,255,0.2)"/>
      <g id="ticks"></g> <!-- ticks + numerals injected by JS -->
      <!-- Hands: identical geometry to classical for visual parity -->
      <line class="hand" id="hour"   x1="0" y1="10" x2="0" y2="-60"  stroke="#fff"     stroke-width="6" stroke-linecap="round"/>
      <line class="hand" id="minute" x1="0" y1="10" x2="0" y2="-90"  stroke="#ffd166"  stroke-width="4" stroke-linecap="round"/>
      <line class="hand" id="second" x1="0" y1="10" x2="0" y2="-100" stroke="#ff6b6b"  stroke-width="2" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="4" fill="#fff"/>
    </svg>
    <div class="readout" id="standardReadout">--:--:--</div>
  </div>

  <!-- ===== Classical clock ===== -->
  <div class="clock" id="classical">
    <h2>Classical Clock</h2>
    <svg viewBox="-130 -130 260 260" role="img" aria-label="Classical 24-hour clock with roman numerals and sun/moon">
      <circle class="dial-face" cx="0" cy="0" r="120" fill="#071425" stroke="rgba(255,255,255,0.2)"/>
      <g id="ticks2"></g> <!-- ticks + numerals injected by JS -->
      <!-- Hands: identical geometry to standard for visual parity -->
      <line class="hand" id="minuta"  x1="0" y1="10" x2="0" y2="-60"  stroke="#fff"     stroke-width="6" stroke-linecap="round"/>
      <line id="secunda" class="hand" x1="0" y1="10" x2="0" y2="-90"  stroke="#ffd166"  stroke-width="4" stroke-linecap="round"/>
      <line class="hand" id="tertia"  x1="0" y1="10" x2="0" y2="-100" stroke="#ff6b6b"  stroke-width="2" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="4" fill="#fff"/>
    </svg>
    <!-- Classical readout format: MM:SS:TT -->
    <div class="readout" id="classicalReadout">
      <span class='hour-color'>--</span>:<span class='minute-color'>--</span>:<span class='second-color'>--</span>
    </div>
  </div>

  <script>
    // =====================================================================
// SETTINGS PERSISTENCE (16): hash-based state save/restore
// ---------------------------------------------------------------------
// We keep a small `state` object and serialize it into location.hash.
// This gives you shareable URLs like: index.html#size=360&contrast=high
// Current supported keys:
//   - size: number (max px width of the clock; defaults to 360)
//   - contrast: 'normal' | 'high' (affects numeral drop-shadow)
// Extend this as you add real controls (e.g., theme, timezone).
// =====================================================================
const state = { size: 360, contrast: 'normal' };

function loadStateFromHash() {
  const hash = location.hash.slice(1);
  if (!hash) return;
  const params = new URLSearchParams(hash);
  if (params.has('size')) {
    const n = parseInt(params.get('size'), 10);
    if (!Number.isNaN(n) && n > 120 && n < 1200) state.size = n;
  }
  if (params.has('contrast')) {
    const v = params.get('contrast');
    if (v === 'high' || v === 'normal') state.contrast = v;
  }
}
function applyStateToDOM() {
  // Resize via CSS var consumed by the responsive SVG rule
  document.documentElement.style.setProperty('--clock-max', state.size + 'px');
  document.body.classList.toggle('high-contrast', state.contrast === 'high');
}
function saveStateToHash() {
  const params = new URLSearchParams();
  params.set('size', String(state.size));
  params.set('contrast', state.contrast);
  const newHash = '#' + params.toString();
  if (location.hash !== newHash) history.replaceState(null, '', newHash);
}
// Initialize from existing hash (if any)
loadStateFromHash();
applyStateToDOM();
// Keep DOM in sync if hash is manually edited
window.addEventListener('hashchange', () => { loadStateFromHash(); applyStateToDOM(); });

// =====================================================================
// CONFIG (5): central place to edit hand periods and tick cadences
// =====================================================================
    const CONFIG = {
      standard: {
        // Periods are informational here; hour/minute use continuous motion,
        // second hand is snapped to a 1s cadence.
        periods: { hour: 12*60*60*1000, minute: 60*60*1000, second: 60*1000 },
        secondTickMs: 1000 // standard second hand ticks once per second
      },
      classical: {
        // Classical movement periods
        periods: { minuta: 24*60*60*1000, secunda: 24*60*1000, tertia: 24*1000 },
        tertiaTickMs: 400  // tertia advances every 400 ms (60 ticks per 24s)
      },
      scheduler: {
        quantumMs: 200 // single rAF loop calls step() at 200 ms boundaries
      }
    };

    // =====================================================================
    // LABEL MAPPER (4): generator for dial numerals/symbols
    // =====================================================================
    const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
    /**
     * Return label text for a given position index.
     * @param {number} idx - 1..12 (12h mode) or 1..24 (24h mode)
     * @param {('12'|'24')} mode - dial mode
     * @returns {string} human label (Roman numerals, ☀️ at 12, 🌙 at 24)
     */
    function labelFor(idx, mode){
      if(mode === '24'){
        if(idx === 12) return '☀️';    // noon
        if(idx === 24) return '🌙';    // midnight
        return ROMAN[(idx-1) % 12];    // repeat I..XII after 12
      }
      // 12-hour mode: Arabic numerals 1..12
      return String(idx);
    }

    // =====================================================================
    // DIAL BUILDER: draws tick marks, subdivisions, and labels
    // =====================================================================
    const ns = 'http://www.w3.org/2000/svg';

    /** Create ticks and numerals for a dial. */
    function createTicks(container, is24=false){
      const totalTicks = 120;              // include subdivisions (2 per hour)
      const major = is24 ? 24 : 12;        // major divisions
      const mode  = is24 ? '24' : '12';

      for(let i=0;i<totalTicks;i++){
        const angle = (i/totalTicks)*2*Math.PI; // radians
        const isMajor = i % (totalTicks/major) === 0;            // on an hour mark
        const isSub   = i % (totalTicks/(major*2)) === 0 && !isMajor; // half-hour mark

        // Tick geometry & style
        const len = isMajor ? 12 : (isSub ? 8 : 4);
        const rOuter = 120, rInner = rOuter - len;
        const line = document.createElementNS(ns,'line');
        line.setAttribute('x1', Math.sin(angle)*rInner);
        line.setAttribute('y1',-Math.cos(angle)*rInner);
        line.setAttribute('x2', Math.sin(angle)*rOuter);
        line.setAttribute('y2',-Math.cos(angle)*rOuter);
        line.setAttribute('stroke', isMajor ? '#fff' : (isSub ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)'));
        line.setAttribute('stroke-width', isMajor ? 3 : (isSub ? 1.5 : 1));
        container.appendChild(line);

        // Hour labels
        if(isMajor){
          const txt = document.createElementNS(ns,'text');
          // Convert i (tick index) into hour index 1..major (replace 0 with major)
          const idx = (i/(totalTicks/major)) || major;
          const tx = Math.sin(angle) * (rInner - 16);
          const ty = -Math.cos(angle) * (rInner - 16) + 5; // slight vertical offset
          txt.setAttribute('x', tx);
          txt.setAttribute('y', ty);
          txt.setAttribute('text-anchor','middle');
          txt.setAttribute('font-size','14');
          txt.setAttribute('fill','rgba(255,255,255,0.8)');
          txt.textContent = labelFor(idx, mode);
          container.appendChild(txt);
        }
      }
    }

    // Build both dials (standard: 12h numerals; classical: 24h with Roman + sun/moon)
    createTicks(document.getElementById('ticks'),  false);
    createTicks(document.getElementById('ticks2'), true);

    // =====================================================================
    // DOM CACHE: elements we update each step
    // =====================================================================
    const els = {
      reg: {
        hour:   document.getElementById('hour'),
        minute: document.getElementById('minute'),
        second: document.getElementById('second'),
        readout:document.getElementById('standardReadout')
      },
      cls: {
        minuta:  document.getElementById('minuta'),
        secunda: document.getElementById('secunda'),
        tertia:  document.getElementById('tertia'),
        readout: document.getElementById('classicalReadout')
      }
    };

    // =====================================================================
    // HELPERS
    // =====================================================================
    function pad(n){ return String(n).padStart(2,'0'); }
    function midnight(d){ const x = new Date(d); x.setHours(0,0,0,0); return x; }

    // =====================================================================
    // MODEL (3): pure computations converting Date -> angles + digits
    // =====================================================================
    function computeStandard(now){
      // Continuous hour/minute; snapped second hand (1 Hz)
      const sec = now.getSeconds();
      const min = now.getMinutes() + sec/60;
      const h12 = (now.getHours() % 12) + min/60;

      const tday = now - midnight(now);
      const secondAngle = (Math.floor(tday / CONFIG.standard.secondTickMs) % 60) * 6; // snap per 1s

      const angles = {
        hour:   (h12/12) * 360,
        minute: (min/60) * 360,
        second: secondAngle
      };

      const ampm = now.getHours() < 12 ? 'AM' : 'PM';
      return {
        angles,
        digits: {
          HH: pad(now.getHours()),
          MM: pad(now.getMinutes()),
          SS: pad(now.getSeconds()),
          ampm
        }
      };
    }

    function computeClassical(now){
      // Classical periods (24h / 24m / 24s)
      const tday = now - midnight(now);
      const { periods, tertiaTickMs } = CONFIG.classical;

      // Tertia is snapped to 400 ms; secunda/minuta are continuous based on time-of-day
      const tertiaSteps = Math.floor((tday % periods.tertia) / tertiaTickMs) % 60; // 0..59
      const angles = {
        tertia:  tertiaSteps * 6,                                           // 6° per tick
        secunda: ((tday % periods.secunda) / periods.secunda) * 360,        // 24m per rev
        minuta:  (tday / periods.minuta) * 360                              // 24h per rev
      };

      // Readout digits (MM:SS:TT) — consistent time-fraction method for all
      const MM = pad(Math.floor((tday % periods.minuta)  / periods.minuta  * 60)); // white/minuta 0..59
      const SS = pad(Math.floor((tday % periods.secunda) / periods.secunda * 60)); // yellow/secunda 0..59
      const TT = pad(Math.floor((tday % periods.tertia)  / periods.tertia  * 60)); // red/tertia 0..59

      return {
        angles,
        digits: { MM, SS, TT }
      };
    }

    // =====================================================================
    // VIEW: apply changes only when values differ (perf-friendly)
    // =====================================================================
    const prev = {
      regAngles: {hour:null, minute:null, second:null},
      regDigits: {HH:null, MM:null, SS:null, ampm:null},
      clsAngles: {minuta:null, secunda:null, tertia:null},
      clsDigits: {MM:null, SS:null, TT:null}
    };

    function setAngle(el, angle, cache, key){
      if(cache[key] !== angle){
        el.setAttribute('transform', `rotate(${angle})`);
        cache[key] = angle;
      }
    }

    function updateStandardView(std){
      setAngle(els.reg.hour,   std.angles.hour,   prev.regAngles, 'hour');
      setAngle(els.reg.minute, std.angles.minute, prev.regAngles, 'minute');
      setAngle(els.reg.second, std.angles.second, prev.regAngles, 'second');

      const d = std.digits; const p = prev.regDigits;
      // Update readout only if any digit or AM/PM changed
      if (d.HH!==p.HH || d.MM!==p.MM || d.SS!==p.SS || d.ampm!==p.ampm) {
        els.reg.readout.innerHTML = `<span class='hour-color'>${d.HH}</span>:`+
          `<span class='minute-color'>${d.MM}</span>:`+
          `<span class='second-color'>${d.SS}</span> `+
          `<span class='ampm'>${d.ampm}</span>`;
        Object.assign(p, d);
      }
    }

    function updateClassicalView(cls){
      setAngle(els.cls.minuta,  cls.angles.minuta,  prev.clsAngles, 'minuta');
      setAngle(els.cls.secunda, cls.angles.secunda, prev.clsAngles, 'secunda');
      setAngle(els.cls.tertia,  cls.angles.tertia,  prev.clsAngles, 'tertia');

      const d = cls.digits; const p = prev.clsDigits;
      if (d.MM!==p.MM || d.SS!==p.SS || d.TT!==p.TT) {
        // Classical readout shows MM:SS:TT with colors matching their hands
        els.cls.readout.innerHTML = `<span class='hour-color'>${d.MM}</span>:`+
          `<span class='minute-color'>${d.SS}</span>:`+
          `<span class='second-color'>${d.TT}</span>`;
        Object.assign(p, d);
      }
    }

    // =====================================================================
    // STEP + SCHEDULER (1 & 2): rAF with a fixed quantum; call step() on boundaries
    // =====================================================================
    function step(){
      const now = new Date();
      updateStandardView(computeStandard(now));
      updateClassicalView(computeClassical(now));
    }

    let last = performance.now();
    let acc  = 0;
    function frame(ts){
      const dt = ts - last; last = ts; acc += dt;
      while (acc >= CONFIG.scheduler.quantumMs) { acc -= CONFIG.scheduler.quantumMs; step(); }
      requestAnimationFrame(frame);
    }

    // Initial render + start animation loop
    step();
    requestAnimationFrame(frame);

    // =====================================================================
    // LIGHTWEIGHT TESTS (run in console) — ensure key behaviors wire up
    // =====================================================================
    (function runTests(){
      try {
        console.assert(labelFor(12,'24') === '☀️', 'labelFor 24h: 12 should be sun');
        console.assert(labelFor(24,'24') === '🌙', 'labelFor 24h: 24 should be moon');
        console.assert(labelFor(13,'24') === 'I',  'labelFor 24h: 13 should map to I');

        const now = new Date();
        const std = computeStandard(now);
        const cls = computeClassical(now);
        console.assert('HH' in std.digits && 'MM' in std.digits && 'SS' in std.digits, 'standard digits present');
        console.assert('MM' in cls.digits && 'SS' in cls.digits && 'TT' in cls.digits, 'classical digits present');

        console.log('%cTests passed','color:#22c55e');
      } catch(e){
        console.error('Test failure:', e);
      }
    })();
  </script>
</body>
</html>
