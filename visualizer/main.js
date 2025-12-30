// Configuration
const NODE_COUNT = 8; // Easy to adjust - try 16 for denser web
const HISTORY_DEPTH = 30; // Frames to keep for correlation (~0.5s at 60fps)
const CORRELATION_THRESHOLD = 0.3; // Min correlation to draw connection

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
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const radius = Math.min(rect.width, rect.height) * config.ringRadius;

  nodes = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    const angle = (i / NODE_COUNT) * Math.PI * 2 - Math.PI / 2; // Start at top
    nodes.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      amplitude: 0,
      targetAmplitude: 0,
      bandIndex: i % frequencyBands.length
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
    return Array(NODE_COUNT).fill(null).map(() => Array(NODE_COUNT).fill(0));
  }

  const correlations = [];

  // Calculate Pearson correlation between each pair of bands
  for (let i = 0; i < NODE_COUNT; i++) {
    correlations[i] = [];
    const bandI = i % frequencyBands.length;

    for (let j = 0; j < NODE_COUNT; j++) {
      if (i === j) {
        correlations[i][j] = 0;
        continue;
      }

      const bandJ = j % frequencyBands.length;

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
    const bandIndex = i % frequencyBands.length;
    node.targetAmplitude = bandData[bandIndex];

    // Smooth interpolation
    node.amplitude += (node.targetAmplitude - node.amplitude) * 0.2;
  });
}

function drawNodes() {
  nodes.forEach(node => {
    const radius = config.nodeRadius.min +
                   (config.nodeRadius.max - config.nodeRadius.min) * node.amplitude;

    // Glow effect
    const glowRadius = radius + 8 * node.amplitude;
    const gradient = ctx.createRadialGradient(
      node.x, node.y, radius * 0.5,
      node.x, node.y, glowRadius
    );
    gradient.addColorStop(0, config.nodeGlowColor);
    gradient.addColorStop(0.4, config.nodeGlowColor + '40'); // 25% opacity
    gradient.addColorStop(1, config.nodeGlowColor + '00'); // transparent

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Node core
    ctx.fillStyle = config.nodeColor;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawConnections(correlations) {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const correlation = Math.abs(correlations[i][j]);

      if (correlation > CORRELATION_THRESHOLD) {
        const nodeI = nodes[i];
        const nodeJ = nodes[j];

        // Line width and opacity based on correlation strength
        const normalizedCorr = (correlation - CORRELATION_THRESHOLD) /
                               (1 - CORRELATION_THRESHOLD);
        const width = config.connectionWidth.min +
                     (config.connectionWidth.max - config.connectionWidth.min) * normalizedCorr;
        const opacity = 0.2 + 0.6 * normalizedCorr;

        // Amplitude influence (brighter when both nodes are active)
        const ampFactor = (nodeI.amplitude + nodeJ.amplitude) / 2;
        const finalOpacity = opacity * (0.3 + 0.7 * ampFactor);

        ctx.strokeStyle = config.connectionColor + Math.floor(finalOpacity * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = width;
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

// Initialize on load
window.addEventListener('DOMContentLoaded', init);
