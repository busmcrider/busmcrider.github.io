// Configuration
let nodeCount = 16;
const HISTORY_DEPTH = 30; // Frames to keep for correlation (~0.5s at 60fps)
let correlationThreshold = 0.66; // Min correlation to draw connection

const config = {
  // Visual parameters (easy to adjust)
  nodeRadius: { min: 0, max: 16 },
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
  mode: 'monochrome', // 'monochrome' | 'frequency'

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
let currentArrangement = 'circle';

// Track management
let trackIndex = 0;
const tracks = [
  { title: "The Cosmic Groove Chronicles", src: "../Gnosify/audio/1 - The Cosmic Groove Chronicles.mp3" },
  { title: "War of Troy", src: "../Gnosify/audio/2 - War of Troy.mp3" },
  { title: "Shadows on the Wall", src: "../Gnosify/audio/3 - Shadows on the Wall.mp3" },
  { title: "Cosmic Blueprints", src: "../Gnosify/audio/4 - Cosmic Blueprints.mp3" },
  { title: "Enoch 2", src: "../Gnosify/audio/5 - Enoch 2.mp3" },
  { title: "Trojan Odyssey", src: "../Gnosify/audio/6 - Trojan Odyssey.mp3" },
  { title: "The Apocryphon Flow", src: "../Gnosify/audio/7 - The Apocryphon Flow.mp3" },
  { title: "Gilgamesh from the Soil", src: "../Gnosify II/audio/1 - Gilgamesh from the Soil.mp3" },
  { title: "Bronze Age Time Capsule", src: "../Gnosify II/audio/2 - Bronze Age Time Capsule.mp3" },
  { title: "Kurupted Odyssey", src: "../Gnosify II/audio/3 - Kurupted Odyssey.mp3" },
  { title: "Plows, Vines & Game Codes", src: "../Gnosify II/audio/4 - Plows, Vines & Game Codes.mp3" },
  { title: "Metamorphosis & Chronic Smoke", src: "../Gnosify II/audio/5 - Metamorphosis & Chronic Smoke.mp3" },
  { title: "Parallel Lives Cipher", src: "../Gnosify II/audio/6 - Parallel Lives Cipher.mp3" },
  { title: "Archon Autopsy", src: "../Gnosify II/audio/7 - Archon Autopsy.mp3" },
  { title: "Plows, Vines & Game Codes (Fast)", src: "../Gnosify II/audio/8 - Plows, Vines & Game Codes (Fast).mp3" },
  { title: "Cat Battles!", src: "../Cat Battles!/audio/1 - Cat Battles!.mp3" },
  { title: "The Cat Rangers", src: "../Cat Battles!/audio/2 - Cat Battles! The Cat Rangers.mp3" },
  { title: "Cat Rangers vs. The Iron Paw", src: "../Cat Battles!/audio/3 - Cat Battles! Cat Rangers vs. The Iron Paw.mp3" },
  { title: "The Cat Illuminati", src: "../Cat Battles!/audio/4 - Cat Battles! The Cat Illuminati.mp3" },
  { title: "Cat Battles! (End Credits)", src: "../Cat Battles!/audio/5 - Cat Battles! (End Credits).mp3" },
  { title: "1999 (Bratty Mix)", src: "../Girlz Rapp/audio/1999 (Bratty Mix).mp3" },
  { title: "Flip It Like a Woman", src: "../Girlz Rapp/audio/Flip It Like a Woman.mp3" },
  { title: "Flip It Like a Woman (Fast)", src: "../Girlz Rapp/audio/Flip It Like a Woman (Fast).mp3" },
  { title: "You Don’t Impress Me", src: "../Girlz Rapp/audio/You Don’t Impress Me.mp3" },
  { title: "Before He Cheats", src: "../Girlz Rapp/audio/Before He Cheats.mp3" },
  { title: "Jolene in My Own Name", src: "../Girlz Rapp/audio/Jolene in My Own Name.mp3" },
  { title: "Surveillance Floor 47", src: "../Neon Plaza/audio/1 - Surveillance Floor 47.mp3" },
  { title: "Sterile Observation Deck", src: "../Neon Plaza/audio/2 - Sterile Observation Deck.mp3" },
  { title: "Set the Stage", src: "../Neon Plaza/audio/3 - Set the Stage.mp3" },
  { title: "Escape the Maze", src: "../Neon Plaza/audio/4 - Escape the Maze.mp3" },
  { title: "Fluorescent Compliance, pt. I", src: "../Neon Plaza/audio/5 - Fluorescent Compliance.mp3" },
  { title: "Fluorescent Compliance, pt. II", src: "../Neon Plaza/audio/6 - Fluorescent Compliance 2.mp3" },
  { title: "Glass Spine Protocol", src: "../Neon Plaza/audio/7 - Glass Spine Protocol.mp3" },
  { title: "Glass Floors, Red Eyes", src: "../Neon Plaza/audio/8 - Glass Floors, Red Eyes.mp3" }
];

// Arrangement calculation functions
function getNodePosition(index, total, rect) {
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  switch (currentArrangement) {
    case 'circle':
      // Circle touches viewport edges
      const padding = 30; // Space for max node size + buffer
      const circleRadius = (Math.min(rect.width, rect.height) / 2) - padding;
      const angleCircle = (index / total) * Math.PI * 2 - Math.PI / 2;
      return {
        x: centerX + Math.cos(angleCircle) * circleRadius,
        y: centerY + Math.sin(angleCircle) * circleRadius
      };

    case 'edge':
      // Around viewport perimeter with padding
      const edgePadding = 30;
      const w = rect.width - edgePadding * 2;
      const h = rect.height - edgePadding * 2;
      const perimeter = (w + h) * 2;
      const segmentLength = perimeter / total;
      const distance = index * segmentLength;

      // Travel around rectangle: top → right → bottom → left
      if (distance < w) {
        return { x: edgePadding + distance, y: edgePadding };
      } else if (distance < w + h) {
        return { x: edgePadding + w, y: edgePadding + (distance - w) };
      } else if (distance < w * 2 + h) {
        return { x: edgePadding + w - (distance - w - h), y: edgePadding + h };
      } else {
        return { x: edgePadding, y: edgePadding + h - (distance - w * 2 - h) };
      }

    case 'grid':
      // Aspect-ratio aware grid layout
      const gridPadding = 40;
      const viewportRatio = rect.width / rect.height;
      let cols, rows;

      if (viewportRatio > 1) {
        // Landscape - more columns
        cols = Math.ceil(Math.sqrt(total * viewportRatio));
        rows = Math.ceil(total / cols);
      } else {
        // Portrait - more rows
        rows = Math.ceil(Math.sqrt(total / viewportRatio));
        cols = Math.ceil(total / rows);
      }

      const col = index % cols;
      const row = Math.floor(index / cols);

      const cellWidth = (rect.width - gridPadding * 2) / cols;
      const cellHeight = (rect.height - gridPadding * 2) / rows;

      return {
        x: gridPadding + cellWidth * (col + 0.5),
        y: gridPadding + cellHeight * (row + 0.5)
      };

    case 'fibonacci':
      // Fibonacci/golden spiral (counterclockwise) with boundary check
      const fibPadding = 30;
      const maxFibRadius = (Math.min(rect.width, rect.height) / 2) - fibPadding;
      const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5 degrees
      const angleFib = -index * goldenAngle; // Negative for counterclockwise
      const fibRadius = Math.sqrt(index / total) * maxFibRadius;
      return {
        x: centerX + Math.cos(angleFib) * fibRadius,
        y: centerY + Math.sin(angleFib) * fibRadius
      };

    default:
      return { x: centerX, y: centerY };
  }
}

// Position-based symmetry assignment
function assignSymmetryBands(nodes, mode, rect) {
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  if (mode === SYMMETRY_MODES.NONE) {
    // Sequential assignment
    nodes.forEach((node, i) => {
      node.bandIndex = i % frequencyBands.length;
    });
    return;
  }

  if (mode === SYMMETRY_MODES.HORIZONTAL) {
    // Mirror left/right based on x-coordinate
    const sortedByX = [...nodes].sort((a, b) => {
      const distA = Math.abs(a.x - centerX);
      const distB = Math.abs(b.x - centerX);
      return distA - distB;
    });

    const bandMap = new Map();
    sortedByX.forEach((node, i) => {
      const mirrorIndex = Math.floor(i / 2);
      const bandIndex = mirrorIndex % frequencyBands.length;
      bandMap.set(node, bandIndex);
    });

    nodes.forEach(node => {
      node.bandIndex = bandMap.get(node);
    });
    return;
  }

  if (mode === SYMMETRY_MODES.VERTICAL) {
    // Mirror top/bottom based on y-coordinate
    const sortedByY = [...nodes].sort((a, b) => {
      const distA = Math.abs(a.y - centerY);
      const distB = Math.abs(b.y - centerY);
      return distA - distB;
    });

    const bandMap = new Map();
    sortedByY.forEach((node, i) => {
      const mirrorIndex = Math.floor(i / 2);
      const bandIndex = mirrorIndex % frequencyBands.length;
      bandMap.set(node, bandIndex);
    });

    nodes.forEach(node => {
      node.bandIndex = bandMap.get(node);
    });
    return;
  }

  if (mode === SYMMETRY_MODES.QUAD) {
    // 4-way symmetry: group by quadrant proximity
    const bandMap = new Map();
    const processed = new Set();

    nodes.forEach(node => {
      if (processed.has(node)) return;

      // Find nodes in similar positions across all quadrants
      const dx = node.x - centerX;
      const dy = node.y - centerY;

      const mirrorNodes = [node];
      nodes.forEach(other => {
        if (other === node || processed.has(other)) return;
        const odx = other.x - centerX;
        const ody = other.y - centerY;

        // Check if node is a mirror across axes
        if ((Math.abs(Math.abs(dx) - Math.abs(odx)) < 10) &&
            (Math.abs(Math.abs(dy) - Math.abs(ody)) < 10)) {
          mirrorNodes.push(other);
        }
      });

      // Assign same band to all mirror nodes
      const bandIndex = (bandMap.size) % frequencyBands.length;
      mirrorNodes.forEach(n => {
        bandMap.set(n, bandIndex);
        processed.add(n);
      });
    });

    nodes.forEach(node => {
      node.bandIndex = bandMap.get(node) || 0;
    });
    return;
  }

  if (mode === SYMMETRY_MODES.RADIAL) {
    // Concentric rings: group by distance from center
    const nodesWithDist = nodes.map(node => {
      const dx = node.x - centerX;
      const dy = node.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return { node, dist };
    });

    nodesWithDist.sort((a, b) => a.dist - b.dist);

    const nodesPerBand = Math.ceil(nodes.length / frequencyBands.length);
    nodesWithDist.forEach((item, i) => {
      const bandIndex = Math.floor(i / nodesPerBand) % frequencyBands.length;
      item.node.bandIndex = bandIndex;
    });
    return;
  }

  // Fallback
  nodes.forEach((node, i) => {
    node.bandIndex = i % frequencyBands.length;
  });
}

// Initialize
function init() {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  audio = document.getElementById('audio');

  setupCanvas();
  setupNodes();
  loadTrack();

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
}

function setupNodes() {
  const rect = canvas.getBoundingClientRect();

  nodes = [];

  // First, position all nodes
  for (let i = 0; i < nodeCount; i++) {
    const pos = getNodePosition(i, nodeCount, rect);

    nodes.push({
      x: pos.x,
      y: pos.y,
      amplitude: 0,
      targetAmplitude: 0,
      bandIndex: 0 // Will be assigned by symmetry function
    });
  }

  // Then assign bands based on positions and symmetry mode
  assignSymmetryBands(nodes, currentSymmetryMode, rect);
}

function loadTrack(index) {
  trackIndex = index;
  audio.src = tracks[index].src;
  updateTrackDisplay();

  // If visualizer is running, keep it running
  if (isRunning) {
    audio.play();
  }
}

function nextTrack() {
  const nextIndex = (trackIndex + 1) % tracks.length;
  loadTrack(nextIndex);
}

function prevTrack() {
  const prevIndex = (trackIndex - 1 + tracks.length) % tracks.length;
  loadTrack(prevIndex);
}

function updateTrackDisplay() {
  const track = tracks[trackIndex];
  document.getElementById('trackTitle').textContent = track.title;
  document.getElementById('status').textContent = isRunning
    ? `Visualizing: ${track.title}`
    : 'Paused';
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

  // Auto-advance to next track when current ends
  audio.addEventListener('ended', () => {
    nextTrack();
  });

  // Load first track
  loadTrack(0);
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
  updateTrackDisplay();
  document.getElementById('startBtn').textContent = 'Stop';

  animate(0);
}

function stop() {
  if (!isRunning) return;

  audio.pause();
  isRunning = false;
  updateTrackDisplay();
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

document.getElementById('prevBtn').addEventListener('click', () => {
  prevTrack();
});

document.getElementById('nextBtn').addEventListener('click', () => {
  nextTrack();
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
  // Cycle through arrangements: circle → edge → grid → fibonacci → circle
  const arrangements = ['circle', 'edge', 'grid', 'fibonacci'];
  const labels = {
    circle: 'Circle',
    edge: 'Edge',
    grid: 'Grid',
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
