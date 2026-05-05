/* ============================================================
   Birthday Wheel — fixed-outcome spinner
   ------------------------------------------------------------
   The wheel APPEARS random, but always lands on
   `config.winningIndex`. A small random offset within the
   winning segment (and a varying number of full rotations)
   ensures no two spins look identical.
   ============================================================ */

/* ---------------------------------------------
   1. CUSTOMIZE EVERYTHING HERE
   --------------------------------------------- */
const config = {
  // 12–15 options. Order matters: index of the winning option goes in `winningIndex`.
  options: [
    "Spa Day",
    "Cute Outfit",
    "500 cá",
    "1 nụ hôn nồng cháy",
    "Vé concert Sơn Tùng",
    "Đi mua mỹ phẩm",
    "Món quà bí mật",
    "2 nụ hôn cháy nồng",
    "2 cái ôm",
    "1 cái cõng",
    "Túi tote mới",
    "1 cái ôm",
    "Vé máy bay đi Đà Nẵng",   // <-- the predetermined winner
  ],

  // Optional per-option emoji (must be the same length as `options`)
  emojis: ["💆", "👗", "🎬", "🏖️", "🎤", "👩‍🍳", "🎁", "📸", "📚", "🍰", "🌃", "🌅", "✈️"],

  // Index of the option the wheel will ALWAYS land on
  winningIndex: 12,

  // Message that appears on the result card
  winningMessage:
    "Chúc mừng em yêu đã bốc trúng giải thưởng độc đắc 'Vé máy bay đi Đà Nẵng'!! ",

  // Hidden second-screen message revealed by the "Open my note" button
  hiddenMessage:
    "Mỗi một giây phút ở bên em, anh luôn cảm thấy là người được yêu chiều nhất trên thế gian này. Anh đã nói rằng chuyến Đà Nẵng năm nay sẽ split 50/50, nhưng vì em đã lỡ trúng độc đắc rồi nên cho anh 'bao' em vé máy bay nhé!! Chúc mừng sinh nhật em iu",

  // Spin animation duration in ms (must match CSS .wheel transition-duration)
  spinDuration: 4600,
  // Extra "heartbeat pause" after the wheel stops, before the modal appears
  revealDelay: 650,
};

/* ---------------------------------------------
   2. WHEEL RENDERING (SVG)
   --------------------------------------------- */
const wheel        = document.getElementById('wheel');
const spinBtn      = document.getElementById('spinBtn');
const pointer      = document.querySelector('.pointer');
const numSegments  = config.options.length;
const sectorAngle  = 360 / numSegments;

function escapeXML(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Returns the SVG path string for a pie slice from startAngle to endAngle (degrees)
function describeSlice(startAngle, endAngle, r) {
  const startRad = startAngle * Math.PI / 180;
  const endRad   = endAngle   * Math.PI / 180;
  const x1 = Math.cos(startRad) * r;
  const y1 = Math.sin(startRad) * r;
  const x2 = Math.cos(endRad)   * r;
  const y2 = Math.sin(endRad)   * r;
  const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;
  return `M 0 0 L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

function renderWheel() {
  const r = 100;
  let svg = '';

  // Glow filter for highlighting the winning segment
  svg += `
    <defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.5" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>`;

  // Outer decorative rings
  svg += `<circle cx="0" cy="0" r="106" fill="none" stroke="#c9a961" stroke-width="0.6" opacity="0.5"/>`;
  svg += `<circle cx="0" cy="0" r="103" fill="#fff" stroke="#c9a961" stroke-width="0.4" opacity="0.7"/>`;

  // Segments + labels
  for (let i = 0; i < numSegments; i++) {
    const startAngle = -90 + (i - 0.5) * sectorAngle;
    const endAngle   = -90 + (i + 0.5) * sectorAngle;
    const path       = describeSlice(startAngle, endAngle, r);
    const colorVar   = `var(--seg-${(i % 8) + 1})`;

    svg += `<path d="${path}" fill="${colorVar}" stroke="#fff" stroke-width="0.8"
            data-index="${i}" id="seg-${i}" class="seg"/>`;

    // Label position: along the radius at radius=62
    const textAngle = -90 + i * sectorAngle;
    const textR     = 62;
    const trad      = textAngle * Math.PI / 180;
    const tx        = Math.cos(trad) * textR;
    const ty        = Math.sin(trad) * textR;

    // Radial text rotation; flip on the left half so labels are never upside-down
    let rot = textAngle;
    const norm = ((textAngle % 360) + 360) % 360;
    if (norm > 90 && norm < 270) rot = textAngle + 180;

    const emoji = config.emojis[i] || '';
    const label = config.options[i];

    svg += `<g transform="rotate(${rot.toFixed(2)} ${tx.toFixed(2)} ${ty.toFixed(2)})" pointer-events="none">`;
    svg += `  <text x="${tx.toFixed(2)}" y="${(ty - 6).toFixed(2)}"
              text-anchor="middle" dominant-baseline="middle"
              font-size="6.2">${escapeXML(emoji)}</text>`;
    svg += `  <text x="${tx.toFixed(2)}" y="${(ty + 6).toFixed(2)}"
              text-anchor="middle" dominant-baseline="middle"
              font-family="'Manrope', system-ui, sans-serif"
              font-size="4.4" font-weight="600"
              fill="#3d2128"
              letter-spacing="0.2">${escapeXML(label)}</text>`;
    svg += `</g>`;
  }

  // Center hub decoration (sits behind the spin button)
  svg += `<circle cx="0" cy="0" r="34" fill="rgba(255,255,255,0.55)"/>`;
  svg += `<circle cx="0" cy="0" r="34" fill="none" stroke="#c9a961" stroke-width="0.5"
          stroke-dasharray="1.5 1.5" opacity="0.7"/>`;

  // Outer rim of decorative dots
  for (let k = 0; k < 36; k++) {
    const a  = (k * 10) * Math.PI / 180;
    const dx = Math.cos(a) * 108;
    const dy = Math.sin(a) * 108;
    svg += `<circle cx="${dx.toFixed(2)}" cy="${dy.toFixed(2)}" r="0.8" fill="#c9a961" opacity="0.55"/>`;
  }

  wheel.innerHTML = svg;
}

/* ---------------------------------------------
   3. SPIN LOGIC (fixed outcome with variation)
   --------------------------------------------- */
let totalRotation = 0;   // accumulated rotation across spins (always increases)
let isSpinning    = false;

function spin() {
  if (isSpinning) return;
  isSpinning = true;
  spinBtn.disabled = true;
  spinBtn.classList.remove('pulse');

  const winningIndex = config.winningIndex;

  // --- The math ---
  // Initially, the center of segment i is at SVG-math angle (-90 + i*sectorAngle).
  // After applying CSS rotate(R) clockwise, it moves to (-90 + i*sectorAngle + R).
  // The pointer is fixed at the top (-90).
  // To land segment `winningIndex` under the pointer:
  //     R ≡ -winningIndex * sectorAngle  (mod 360)
  //     R ≡  360 - winningIndex * sectorAngle  (mod 360)
  //
  // We then add a small random offset (within the segment) so each spin
  // looks slightly different, plus 5–7 full rotations for drama.

  const randomOffset  = (Math.random() - 0.5) * sectorAngle * 0.7;   // stays in middle 70% of segment
  const fullRotations = 5 + Math.floor(Math.random() * 3);            // 5, 6, or 7 full turns

  const targetMod  = ((360 - winningIndex * sectorAngle + randomOffset) % 360 + 360) % 360;
  const currentMod = ((totalRotation % 360) + 360) % 360;

  let delta = targetMod - currentMod;
  if (delta < 0) delta += 360;
  delta += fullRotations * 360;

  totalRotation += delta;
  wheel.style.transform = `rotate(${totalRotation}deg)`;

  // Start polling for tick-tick effect
  pollTicks();

  // After the spin animation finishes + heartbeat pause → reveal
  setTimeout(onSpinComplete, config.spinDuration + config.revealDelay);
}

function onSpinComplete() {
  // Highlight the winning segment with a soft glow
  const winSeg = document.getElementById(`seg-${config.winningIndex}`);
  if (winSeg) {
    winSeg.setAttribute('filter', 'url(#glow)');
    winSeg.style.transition = 'fill 0.4s';
    winSeg.style.fill = '#fff8ef';
  }

  showResult();
  fireConfetti();
  playChime();
}

/* ---------------------------------------------
   4. TICK FEEDBACK while spinning
   (each time a divider passes the pointer)
   --------------------------------------------- */
let lastTickIndex = -1;

function pollTicks() {
  if (!isSpinning) { lastTickIndex = -1; return; }

  // Read the wheel's current rotation from its computed transform
  const t = getComputedStyle(wheel).transform;
  let deg = 0;
  if (t && t !== 'none') {
    const m = t.match(/matrix\(([^)]+)\)/);
    if (m) {
      const v = m[1].split(',').map(Number);
      deg = Math.atan2(v[1], v[0]) * 180 / Math.PI;  // a=v[0], b=v[1]
    }
  }
  // Which segment is currently at the top?
  const norm = ((deg % 360) + 360) % 360;
  const topIdx = Math.round((360 - norm) / sectorAngle) % numSegments;

  if (topIdx !== lastTickIndex && lastTickIndex !== -1) {
    pointer.classList.remove('tick');
    void pointer.offsetWidth;     // restart CSS animation
    pointer.classList.add('tick');
    playTickSound();
  }
  lastTickIndex = topIdx;
  requestAnimationFrame(pollTicks);
}

/* ---------------------------------------------
   5. RESULT MODAL
   --------------------------------------------- */
const modalOverlay  = document.getElementById('modalOverlay');
const modalClose    = document.getElementById('modalClose');
const resultOption  = document.getElementById('resultOption');
const resultEmoji   = document.getElementById('resultEmoji');
const resultMessage = document.getElementById('resultMessage');
const revealBtn     = document.getElementById('revealBtn');
const hiddenNote    = document.getElementById('hiddenNote');
const hiddenText    = document.getElementById('hiddenText');

function showResult() {
  resultOption.textContent  = config.options[config.winningIndex];
  resultEmoji.textContent   = config.emojis[config.winningIndex] || '✨';
  resultMessage.textContent = config.winningMessage;
  hiddenText.textContent    = config.hiddenMessage;

  hiddenNote.classList.remove('shown');
  revealBtn.style.display = '';

  modalOverlay.classList.add('active');
}

function closeModal() {
  modalOverlay.classList.remove('active');
  isSpinning = false;
  spinBtn.disabled = false;

  // Remove the winning highlight after the modal fades out
  setTimeout(() => {
    const winSeg = document.getElementById(`seg-${config.winningIndex}`);
    if (winSeg) {
      winSeg.removeAttribute('filter');
      winSeg.style.fill = '';
    }
  }, 400);
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('active')) closeModal();
});
revealBtn.addEventListener('click', () => {
  hiddenNote.classList.add('shown');
  revealBtn.style.display = 'none';
});

/* ---------------------------------------------
   6. CONFETTI (canvas, no dependencies)
   --------------------------------------------- */
const confettiCanvas = document.getElementById('confetti');
const cctx = confettiCanvas.getContext('2d');
let confettiParticles = [];
let confettiAnim = null;

function resizeConfetti() {
  confettiCanvas.width  = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeConfetti);
resizeConfetti();

function fireConfetti() {
  const palette = ['#c87b8a', '#c9a961', '#f4cdd1', '#f4dcc0', '#e9bfae', '#a85268', '#8b3a4e', '#fff'];
  confettiParticles = [];
  for (let i = 0; i < 180; i++) {
    confettiParticles.push({
      x: window.innerWidth * (0.3 + Math.random() * 0.4),
      y: window.innerHeight * 0.25 + Math.random() * 80,
      vx: (Math.random() - 0.5) * 14,
      vy: -7 - Math.random() * 9,
      g:  0.18 + Math.random() * 0.06,
      size: 4 + Math.random() * 7,
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 14,
      color: palette[Math.floor(Math.random() * palette.length)],
      shape: Math.random() > 0.45 ? 'rect' : (Math.random() > 0.5 ? 'circle' : 'heart'),
    });
  }
  if (!confettiAnim) animateConfetti();
}

function drawHeart(ctx, size) {
  const s = size / 2;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.6);
  ctx.bezierCurveTo(s, -s * 0.3, s * 1.2, -s, 0, -s * 0.4);
  ctx.bezierCurveTo(-s * 1.2, -s, -s, -s * 0.3, 0, s * 0.6);
  ctx.fill();
}

function animateConfetti() {
  cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  let alive = false;
  for (const p of confettiParticles) {
    if (p.y > confettiCanvas.height + 30) continue;
    alive = true;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.g;
    p.vx *= 0.995;
    p.rot += p.vr;

    cctx.save();
    cctx.translate(p.x, p.y);
    cctx.rotate(p.rot * Math.PI / 180);
    cctx.fillStyle = p.color;
    if (p.shape === 'rect') {
      cctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    } else if (p.shape === 'circle') {
      cctx.beginPath();
      cctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      cctx.fill();
    } else {
      drawHeart(cctx, p.size);
    }
    cctx.restore();
  }
  if (alive) {
    confettiAnim = requestAnimationFrame(animateConfetti);
  } else {
    cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confettiAnim = null;
  }
}

/* ---------------------------------------------
   7. SOUND (Web Audio — no audio files needed)
   --------------------------------------------- */
let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { audioCtx = null; }
  }
  return audioCtx;
}

function playTickSound() {
  const ctx = ensureAudio(); if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g   = ctx.createGain();
  osc.frequency.value = 1300;
  osc.type = 'square';
  g.gain.setValueAtTime(0.035, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  osc.connect(g).connect(ctx.destination);
  osc.start(t); osc.stop(t + 0.06);
}

function playChime() {
  const ctx = ensureAudio(); if (!ctx) return;
  const t = ctx.currentTime;
  // Soft C major arpeggio: C5 → E5 → G5 → C6
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    const start = t + i * 0.13;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.18, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.7);
    osc.connect(g).connect(ctx.destination);
    osc.start(start); osc.stop(start + 0.7);
  });
}

/* ---------------------------------------------
   8. INITIALIZE
   --------------------------------------------- */
renderWheel();

spinBtn.addEventListener('click', () => {
  ensureAudio();   // unlock audio on first user gesture
  spin();
});

// Invite the first click with a soft pulsing ring
window.addEventListener('load', () => {
  setTimeout(() => spinBtn.classList.add('pulse'), 1500);
});
