// Configuration
let nodeCount = 24;
const HISTORY_DEPTH = 30; // Frames to keep for correlation (~0.5s at 60fps)
let correlationThreshold = 0.3; // Min correlation to draw connection

const config = {
  // Visual parameters (easy to adjust)
  nodeRadius: { min: 8, max: 32 },
  nodeColor: '#eee',
  nodeGlowColor: '#eee',
  connectionColor: '#eee',
  connectionWidth: { min: 0.5, max: 3 },

  // Layout
  ringRadius: 0.35, // Fraction of canvas size

  // Audio analysis
  fftSize: 2048,
  smoothingTimeConstant: 0.8,

  // Performance
  minFrameTime: 1000 / 120 // Cap at 120fps
};

// Color system configuration
const colorConfig = {
  mode: 'frequency', // 'monochrome' | 'frequency'

  // Frequency color mode settings
  frequencyHueRange: [0, 270], // Red (bass) to purple (treble)
  baseLightness: 70, // Constant brightness (good visibility on dark bg)
  minSaturation: 0, // At amplitude 0 (white/desaturated)
  maxSaturation: 100, // At amplitude 1 (full color)

  // Glow settings
  glowSaturation: 80, // Slightly less saturated than core
  glowLightness: 60,
};

// Utility: Expand shorthand hex colors (#eee -> #eeeeee)
function expandHexColor(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  return '#' + hex;
}

// Color utilities
function hslToString(h, s, l, a = 1) {
  if (a < 1) {
    return `hsla(${h}, ${s}%, ${l}%, ${a})`;
  }
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function parseHSL(hslString) {
  // Parse 'hsl(120, 100%, 50%)' or 'hsla(120, 100%, 50%, 0.5)'
  const match = hslString.match(/hsla?\(([^,]+),\s*([^,]+)%?,\s*([^,]+)%?(?:,\s*([^)]+))?\)/);
  if (!match) return { h: 0, s: 0, l: 0, a: 1 };

  return {
    h: parseFloat(match[1]),
    s: parseFloat(match[2]),
    l: parseFloat(match[3]),
    a: match[4] ? parseFloat(match[4]) : 1
  };
}

function getNodeColor(node, forGlow = false) {
  if (colorConfig.mode === 'monochrome') {
    return forGlow ? config.nodeGlowColor : config.nodeColor;
  }

  if (colorConfig.mode === 'frequency') {
    const band = frequencyBands[node.bandIndex];
    const avgFreq = (band.min + band.max) / 2;

    // Map frequency to hue using logarithmic scale (musical)
    const freqLog = Math.log10(avgFreq);
    const minLog = Math.log10(20);
    const maxLog = Math.log10(20000);
    const hueT = (freqLog - minLog) / (maxLog - minLog);
    const hue = colorConfig.frequencyHueRange[0] +
                (colorConfig.frequencyHueRange[1] - colorConfig.frequencyHueRange[0]) * hueT;

    // Map amplitude to saturation (fades to white at low amplitude)
    const sat = colorConfig.minSaturation +
                (colorConfig.maxSaturation - colorConfig.minSaturation) * node.amplitude;

    if (forGlow) {
      // Glow is slightly less saturated and darker
      const glowSat = Math.min(sat, colorConfig.glowSaturation);
      return hslToString(hue, glowSat, colorConfig.glowLightness);
    }

    return hslToString(hue, sat, colorConfig.baseLightness);
  }

  return '#eee'; // Fallback
}

// Frequency bands (Hz ranges)
const frequencyBands = [
  { name: 'Sub-Bass', min: 20, max: 60 },
  { name: 'Bass', min: 60, max: 250 },
  { name: 'Low-Mid', min: 250, max: 500 },
  { name: 'Mid', min: 500, max: 2000 },
  { name: 'High-Mid', min: 2000, max: 4000 },
  { name: 'Presence', min: 4000, max: 6000 },
  { name: 'Brilliance', min: 6000, max: 12000 },
  { name: 'Air', min: 12000, max: 20000 }
];

// Global state
let canvas, ctx, audio, audioCtx, analyser, dataArray;
let nodes = [];
let frequencyHistory = [];
let animationId = null;
let lastFrameTime = 0;
let isRunning = false;
let currentSymmetryMode = SYMMETRY_MODES.NONE;
let currentArrangement = 'circle'; // 'circle' | 'edge' | 'spiral' | 'fibonacci'

// Arrangement calculation functions
function getNodePosition(index, total, rect) {
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const radius = Math.min(rect.width, rect.height) * config.ringRadius;

  switch (currentArrangement) {
    case 'circle':
      // Original: circle at center
      const angleCircle = (index / total) * Math.PI * 2 - Math.PI / 2;
      return {
        x: centerX + Math.cos(angleCircle) * radius,
        y: centerY + Math.sin(angleCircle) * radius
      };

    case 'edge':
      // Around viewport perimeter with padding
      const padding = 20;
      const w = rect.width - padding * 2;
      const h = rect.height - padding * 2;
      const perimeter = (w + h) * 2;
      const segmentLength = perimeter / total;
      const distance = index * segmentLength;

      // Travel around rectangle: top → right → bottom → left
      if (distance < w) {
        // Top edge
        return { x: padding + distance, y: padding };
      } else if (distance < w + h) {
        // Right edge
        return { x: padding + w, y: padding + (distance - w) };
      } else if (distance < w * 2 + h) {
        // Bottom edge
        return { x: padding + w - (distance - w - h), y: padding + h };
      } else {
        // Left edge
        return { x: padding, y: padding + h - (distance - w * 2 - h) };
      }

    case 'spiral':
      // Spiral outward clockwise from center
      const angleSpiral = (index / total) * Math.PI * 4; // 2 full rotations
      const spiralRadius = (index / total) * radius * 1.5;
      return {
        x: centerX + Math.cos(angleSpiral) * spiralRadius,
        y: centerY + Math.sin(angleSpiral) * spiralRadius
      };

    case 'fibonacci':
      // Fibonacci/golden spiral (counterclockwise)
      const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5 degrees
      const angleFib = -index * goldenAngle; // Negative for counterclockwise
      const fibRadius = Math.sqrt(index / total) * radius * 1.8; // Square root for smooth distribution
      return {
        x: centerX + Math.cos(angleFib) * fibRadius,
        y: centerY + Math.sin(angleFib) * fibRadius
      };

    default:
      return { x: centerX, y: centerY };
  }
}

// Initialize
function init() {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  audio = document.getElementById('audio');

  setupCanvas();
  setupNodes();

  window.addEventListener('resize', () => {
    setupCanvas();
    setupNodes();
  });
}

function setupCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  ctx.scale(dpr, dpr);
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
}

function setupNodes() {
  const rect = canvas.getBoundingClientRect();

  nodes = [];

  for (let i = 0; i < nodeCount; i++) {
    // Get position based on current arrangement
    const pos = getNodePosition(i, nodeCount, rect);

    // Get band index based on current symmetry mode
    const bandIndex = getSymmetryBandIndex(
      i,
      nodeCount,
      frequencyBands.length,
      currentSymmetryMode
    );

    nodes.push({
      x: pos.x,
      y: pos.y,
      amplitude: 0,
      targetAmplitude: 0,
      bandIndex: bandIndex
    });
  }
}

function setupAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();

  const source = audioCtx.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);

  analyser.fftSize = config.fftSize;
  analyser.smoothingTimeConstant = config.smoothingTimeConstant;

  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
}

function getFrequencyBandData() {
  analyser.getByteFrequencyData(dataArray);

  const sampleRate = audioCtx.sampleRate;
  const bandData = new Array(frequencyBands.length).fill(0);
  const bandCounts = new Array(frequencyBands.length).fill(0);

  // Map FFT bins to frequency bands
  for (let i = 0; i < dataArray.length; i++) {
    const freq = (i * sampleRate) / (analyser.fftSize * 2);

    for (let b = 0; b < frequencyBands.length; b++) {
      if (freq >= frequencyBands[b].min && freq < frequencyBands[b].max) {
        bandData[b] += dataArray[i];
        bandCounts[b]++;
        break;
      }
    }
  }

  // Average and normalize to 0-1
  return bandData.map((sum, i) =>
    bandCounts[i] > 0 ? (sum / bandCounts[i]) / 255 : 0
  );
}

function calculateCorrelations(bandData) {
  // Add current frame to history
  frequencyHistory.push([...bandData]);
  if (frequencyHistory.length > HISTORY_DEPTH) {
    frequencyHistory.shift();
  }

  // Need enough history for meaningful correlation
  if (frequencyHistory.length < 10) {
    return Array(nodeCount).fill(null).map(() => Array(nodeCount).fill(0));
  }

  const correlations = [];

  // Calculate Pearson correlation between each pair of bands
  for (let i = 0; i < nodeCount; i++) {
    correlations[i] = [];
    const bandI = nodes[i].bandIndex;

    for (let j = 0; j < nodeCount; j++) {
      if (i === j) {
        correlations[i][j] = 0;
        continue;
      }

      const bandJ = nodes[j].bandIndex;

      // Get history for both bands
      const seriesA = frequencyHistory.map(frame => frame[bandI]);
      const seriesB = frequencyHistory.map(frame => frame[bandJ]);

      // Calculate Pearson correlation
      const n = seriesA.length;
      const sumA = seriesA.reduce((a, b) => a + b, 0);
      const sumB = seriesB.reduce((a, b) => a + b, 0);
      const sumAB = seriesA.reduce((sum, a, k) => sum + a * seriesB[k], 0);
      const sumA2 = seriesA.reduce((sum, a) => sum + a * a, 0);
      const sumB2 = seriesB.reduce((sum, b) => sum + b * b, 0);

      const numerator = n * sumAB - sumA * sumB;
      const denominator = Math.sqrt((n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB));

      correlations[i][j] = denominator !== 0 ? numerator / denominator : 0;
    }
  }

  return correlations;
}

function updateNodes(bandData) {
  nodes.forEach((node, i) => {
    // Use the bandIndex assigned by symmetry system
    node.targetAmplitude = bandData[node.bandIndex];

    // Smooth interpolation
    node.amplitude += (node.targetAmplitude - node.amplitude) * 0.2;
  });
}

function drawNodes() {
  nodes.forEach(node => {
    const radius = config.nodeRadius.min +
                   (config.nodeRadius.max - config.nodeRadius.min) * node.amplitude;

    // Get colors for this node
    const coreColor = getNodeColor(node, false);
    const glowColor = getNodeColor(node, true);

    // Glow effect
    const glowRadius = radius + 8 * node.amplitude;
    const gradient = ctx.createRadialGradient(
      node.x, node.y, radius * 0.5,
      node.x, node.y, glowRadius
    );

    // Use dynamic colors with alpha
    if (colorConfig.mode === 'monochrome') {
      const baseColor = expandHexColor(glowColor);
      gradient.addColorStop(0, baseColor);
      gradient.addColorStop(0.4, baseColor + '40');
      gradient.addColorStop(1, baseColor + '00');
    } else {
      // Frequency mode - parse HSL and add alpha
      const hsl = parseHSL(glowColor);
      gradient.addColorStop(0, hslToString(hsl.h, hsl.s, hsl.l, 1));
      gradient.addColorStop(0.4, hslToString(hsl.h, hsl.s, hsl.l, 0.25));
      gradient.addColorStop(1, hslToString(hsl.h, hsl.s, hsl.l, 0));
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Node core
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawConnections(correlations) {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const correlation = Math.abs(correlations[i][j]);

      if (correlation > correlationThreshold) {
        const nodeI = nodes[i];
        const nodeJ = nodes[j];

        // Line width and opacity based on correlation strength
        const normalizedCorr = (correlation - correlationThreshold) /
                               (1 - correlationThreshold);
        const width = config.connectionWidth.min +
                     (config.connectionWidth.max - config.connectionWidth.min) * normalizedCorr;
        const opacity = 0.2 + 0.6 * normalizedCorr;

        // Amplitude influence (brighter when both nodes are active)
        const ampFactor = (nodeI.amplitude + nodeJ.amplitude) / 2;
        const finalOpacity = opacity * (0.3 + 0.7 * ampFactor);

        ctx.lineWidth = width;

        if (colorConfig.mode === 'monochrome') {
          // Monochrome mode - solid color with opacity
          const baseColor = expandHexColor(config.connectionColor);
          const opacityHex = Math.floor(finalOpacity * 255).toString(16).padStart(2, '0');
          ctx.strokeStyle = baseColor + opacityHex;
        } else {
          // Frequency mode - gradient from node A to node B
          const gradient = ctx.createLinearGradient(
            nodeI.x, nodeI.y,
            nodeJ.x, nodeJ.y
          );

          const colorA = getNodeColor(nodeI, false);
          const colorB = getNodeColor(nodeJ, false);
          const hslA = parseHSL(colorA);
          const hslB = parseHSL(colorB);

          // Gradient: node A color -> blended middle -> node B color
          gradient.addColorStop(0, hslToString(hslA.h, hslA.s, hslA.l, finalOpacity));
          gradient.addColorStop(0.5, hslToString(
            (hslA.h + hslB.h) / 2,
            (hslA.s + hslB.s) / 2,
            (hslA.l + hslB.l) / 2,
            finalOpacity
          ));
          gradient.addColorStop(1, hslToString(hslB.h, hslB.s, hslB.l, finalOpacity));

          ctx.strokeStyle = gradient;
        }

        ctx.beginPath();
        ctx.moveTo(nodeI.x, nodeI.y);
        ctx.lineTo(nodeJ.x, nodeJ.y);
        ctx.stroke();
      }
    }
  }
}

function animate(timestamp) {
  if (!isRunning) return;

  // Frame rate limiting
  const elapsed = timestamp - lastFrameTime;
  if (elapsed < config.minFrameTime) {
    animationId = requestAnimationFrame(animate);
    return;
  }
  lastFrameTime = timestamp;

  // Clear canvas
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Get frequency data
  const bandData = getFrequencyBandData();

  // Calculate correlations
  const correlations = calculateCorrelations(bandData);

  // Update node states
  updateNodes(bandData);

  // Draw connections first (behind nodes)
  drawConnections(correlations);

  // Draw nodes on top
  drawNodes();

  animationId = requestAnimationFrame(animate);
}

function start() {
  if (isRunning) return;

  if (!audioCtx) {
    setupAudio();
  }

  audio.play();
  isRunning = true;
  document.getElementById('status').textContent = 'Visualizing: Cosmic Blueprints';
  document.getElementById('startBtn').textContent = 'Stop';

  animate(0);
}

function stop() {
  if (!isRunning) return;

  audio.pause();
  isRunning = false;
  document.getElementById('status').textContent = 'Paused';
  document.getElementById('startBtn').textContent = 'Start Visualizer';

  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

// Event listeners
document.getElementById('startBtn').addEventListener('click', () => {
  if (isRunning) {
    stop();
  } else {
    start();
  }
});

document.getElementById('symmetryBtn').addEventListener('click', () => {
  // Cycle to next symmetry mode
  currentSymmetryMode = getNextSymmetryMode(currentSymmetryMode);

  // Update button label
  const label = getSymmetryLabel(currentSymmetryMode);
  document.getElementById('symmetryBtn').textContent = `Symmetry: ${label.replace(' Symmetry', '')}`;

  // Rebuild nodes with new symmetry
  setupNodes();
});

document.getElementById('colorBtn').addEventListener('click', () => {
  // Toggle color mode
  colorConfig.mode = colorConfig.mode === 'monochrome' ? 'frequency' : 'monochrome';

  // Update button label
  const label = colorConfig.mode === 'monochrome' ? 'Monochrome' : 'Frequency';
  document.getElementById('colorBtn').textContent = `Color: ${label}`;
});

document.getElementById('nodeCountBtn').addEventListener('click', () => {
  // Cycle through node counts: 8 → 16 → 24 → 32 → 8
  const counts = [8, 16, 24, 32];
  const currentIndex = counts.indexOf(nodeCount);
  const nextIndex = (currentIndex + 1) % counts.length;
  nodeCount = counts[nextIndex];

  // Update button label
  document.getElementById('nodeCountBtn').textContent = `Nodes: ${nodeCount}`;

  // Rebuild nodes
  setupNodes();
});

document.getElementById('arrangementBtn').addEventListener('click', () => {
  // Cycle through arrangements: circle → edge → spiral → fibonacci → circle
  const arrangements = ['circle', 'edge', 'spiral', 'fibonacci'];
  const labels = {
    circle: 'Circle',
    edge: 'Edge',
    spiral: 'Spiral ↻',
    fibonacci: 'Fibonacci ↺'
  };

  const currentIndex = arrangements.indexOf(currentArrangement);
  const nextIndex = (currentIndex + 1) % arrangements.length;
  currentArrangement = arrangements[nextIndex];

  // Update button label
  document.getElementById('arrangementBtn').textContent = `Layout: ${labels[currentArrangement]}`;

  // Rebuild nodes
  setupNodes();
});

document.getElementById('correlationSlider').addEventListener('input', (e) => {
  correlationThreshold = parseFloat(e.target.value);
  document.getElementById('correlationValue').textContent = correlationThreshold.toFixed(2);
});

// Initialize on load
window.addEventListener('DOMContentLoaded', init);
