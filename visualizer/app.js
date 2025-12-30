import {
  AUDIO_CONFIG,
  VISUAL_CONFIG,
  FREQUENCY_BANDS,
  ARRANGEMENTS,
  NODE_COUNTS,
  COLOR_MODES,
} from './lib/config.js';
import { assignSymmetry, getNextSymmetryMode, getSymmetryLabel, SYMMETRY_MODES } from './lib/symmetry.js';
import { layoutNode, resizeCanvas } from './lib/geometry.js';
import { calculateBandAmplitudes, connectionStrength, smoothBands } from './lib/correlation.js';
import { connectionColor, nodeColors } from './lib/colors.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const audioEl = document.getElementById('audio');

const albumSelect = document.getElementById('albumSelect');
const startBtn = document.getElementById('startBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const symmetryBtn = document.getElementById('symmetryBtn');
const colorBtn = document.getElementById('colorBtn');
const nodeCountBtn = document.getElementById('nodeCountBtn');
const arrangementBtn = document.getElementById('arrangementBtn');
const correlationSlider = document.getElementById('correlationSlider');
const correlationValue = document.getElementById('correlationValue');
const trackTitle = document.getElementById('trackTitle');
const status = document.getElementById('status');
const trackListEl = document.getElementById('trackList');
const playlistWrapper = document.querySelector('.playlist-wrapper');
const playlistToggle = document.getElementById('playlist-toggle');
const playlistChevron = document.getElementById('playlist-chevron');
const playlistTitle = document.getElementById('playlist-title');

const state = {
  albums: Array.isArray(window.albumConfigs) ? window.albumConfigs : [],
  albumIndex: 0,
  trackIndex: 0,
  arrangement: ARRANGEMENTS[0],
  nodeCount: NODE_COUNTS[1],
  colorMode: COLOR_MODES[0],
  symmetry: SYMMETRY_MODES.NONE,
  correlationThreshold: parseFloat(correlationSlider.value),
  isRunning: false,
  lastFrame: 0,
  nodes: [],
  frequencyHistory: [],
  tracks: [],
  audio: {
    ctx: null,
    analyser: null,
    dataArray: null,
  },
};

function init() {
  if (!state.albums.length) {
    status.textContent = 'No albums found. Check shared/music.js';
    startBtn.disabled = true;
    return;
  }

  state.albumIndex = Math.max(state.albums.findIndex(album => album.title === 'Gnosify'), 0);
  populateAlbumSelect();
  setAlbum(state.albumIndex, false);

  resizeCanvas(canvas, ctx);
  buildNodes();
  updateTrackUI();

  window.addEventListener('resize', () => {
    resizeCanvas(canvas, ctx);
    buildNodes();
  });

  playlistToggle?.addEventListener('click', () => {
    playlistWrapper.classList.toggle('collapsed');
    const collapsed = playlistWrapper.classList.contains('collapsed');
    playlistChevron.textContent = collapsed ? '▸' : '▾';
  });

  bindControls();
}

function populateAlbumSelect() {
  albumSelect.innerHTML = '';
  state.albums.forEach((album, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = `${album.title} — ${album.artist}`;
    albumSelect.appendChild(option);
  });
  albumSelect.value = String(state.albumIndex);
}

function encodePathSegments(path) {
  return path.split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');
}

function albumAssetPath(album, relativePath) {
  const albumSegment = encodeURIComponent(album.title);
  return `../${albumSegment}/${encodePathSegments(relativePath)}`;
}

function setAlbum(index, continuePlayback) {
  state.albumIndex = index;
  const album = state.albums[state.albumIndex];
  document.title = `Audio Visualizer — ${album.title}`;

  state.tracks = album.tracks.map(track => ({
    title: track.title,
    src: albumAssetPath(album, track.src),
  }));

  albumSelect.value = String(state.albumIndex);
  updateBackground(album);
  renderTrackList();
  state.trackIndex = 0;
  loadTrack(state.trackIndex, continuePlayback && state.isRunning);
}

function updateBackground(album) {
  if (album.background) {
    document.body.style.backgroundImage = `url('${albumAssetPath(album, album.background)}')`;
  } else {
    document.body.style.backgroundImage = 'none';
  }
}

function renderTrackList() {
  trackListEl.innerHTML = '';
  state.tracks.forEach((track, index) => {
    const li = document.createElement('li');
    li.textContent = track.title;
    li.onclick = () => loadTrack(index, true);
    trackListEl.appendChild(li);
  });
  playlistTitle.textContent = `${state.albums[state.albumIndex].title} (${state.tracks.length})`;
  highlightActiveTrack();
}

function highlightActiveTrack() {
  [...trackListEl.children].forEach((li, idx) => {
    li.classList.toggle('active', idx === state.trackIndex);
  });
  const active = trackListEl.querySelector('.active');
  if (active) active.scrollIntoView({ block: 'nearest' });
}

function buildNodes() {
  const rect = canvas.getBoundingClientRect();
  const nodes = [];
  for (let i = 0; i < state.nodeCount; i++) {
    const position = layoutNode(i, state.nodeCount, rect, state.arrangement, VISUAL_CONFIG.ringRadius);
    nodes.push({
      ...position,
      amplitude: 0,
      target: 0,
      bandIndex: i % FREQUENCY_BANDS.length,
    });
  }

  const center = { x: rect.width / 2, y: rect.height / 2 };
  state.nodes = assignSymmetry(nodes, state.symmetry, FREQUENCY_BANDS.length, center);
}

function setupAudio() {
  if (state.audio.ctx) return;

  state.audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
  state.audio.analyser = state.audio.ctx.createAnalyser();
  state.audio.analyser.fftSize = AUDIO_CONFIG.fftSize;
  state.audio.analyser.smoothingTimeConstant = AUDIO_CONFIG.smoothing;

  const src = state.audio.ctx.createMediaElementSource(audioEl);
  src.connect(state.audio.analyser);
  state.audio.analyser.connect(state.audio.ctx.destination);

  state.audio.dataArray = new Uint8Array(state.audio.analyser.frequencyBinCount);
  audioEl.addEventListener('ended', nextTrack);
  loadTrack(state.trackIndex);
}

function loadTrack(index, play = false) {
  if (!state.tracks.length) return;
  state.trackIndex = ((index % state.tracks.length) + state.tracks.length) % state.tracks.length;
  audioEl.src = state.tracks[state.trackIndex].src;
  updateTrackUI();
  highlightActiveTrack();
  if (state.isRunning && play) audioEl.play();
}

function nextTrack() {
  loadTrack(state.trackIndex + 1, true);
}

function prevTrack() {
  loadTrack(state.trackIndex - 1, true);
}

function updateTrackUI() {
  if (!state.tracks.length) {
    trackTitle.textContent = 'No tracks available';
    status.textContent = 'Select a different album to continue';
    return;
  }

  const track = state.tracks[state.trackIndex];
  const album = state.albums[state.albumIndex];
  trackTitle.textContent = track.title;
  status.textContent = state.isRunning
    ? `Visualizing: ${track.title} — ${album.title}`
    : `Ready: ${album.title}`;
}

function toggleRunState() {
  if (!state.isRunning) {
    setupAudio();
    audioEl.play();
    state.isRunning = true;
    startBtn.textContent = 'Pause Visualizer';
    draw();
  } else {
    state.isRunning = false;
    startBtn.textContent = 'Resume Visualizer';
    audioEl.pause();
    cancelAnimationFrame(state.animationId);
  }
  updateTrackUI();
}

function cycleNodeCount() {
  const idx = (NODE_COUNTS.indexOf(state.nodeCount) + 1) % NODE_COUNTS.length;
  state.nodeCount = NODE_COUNTS[idx];
  nodeCountBtn.textContent = `Nodes: ${state.nodeCount}`;
  buildNodes();
}

function cycleArrangement() {
  const idx = (ARRANGEMENTS.indexOf(state.arrangement) + 1) % ARRANGEMENTS.length;
  state.arrangement = ARRANGEMENTS[idx];
  arrangementBtn.textContent = `Layout: ${capitalize(state.arrangement)}`;
  buildNodes();
}

function cycleColorMode() {
  const idx = (COLOR_MODES.indexOf(state.colorMode) + 1) % COLOR_MODES.length;
  state.colorMode = COLOR_MODES[idx];
  colorBtn.textContent = `Color: ${capitalize(state.colorMode)}`;
}

function cycleSymmetry() {
  state.symmetry = getNextSymmetryMode(state.symmetry);
  symmetryBtn.textContent = `Symmetry: ${getSymmetryLabel(state.symmetry)}`;
  buildNodes();
}

function updateCorrelationThreshold(value) {
  state.correlationThreshold = value;
  correlationValue.textContent = value.toFixed(2);
}

function draw() {
  const now = performance.now();
  if (now - state.lastFrame < AUDIO_CONFIG.minFrameTime) {
    state.animationId = requestAnimationFrame(draw);
    return;
  }
  state.lastFrame = now;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  state.audio.analyser.getByteFrequencyData(state.audio.dataArray);
  const nyquist = state.audio.ctx.sampleRate / 2;
  const bandValues = calculateBandAmplitudes(state.audio.dataArray, FREQUENCY_BANDS, nyquist);
  const { smoothed, nextHistory } = smoothBands(state.frequencyHistory, bandValues, VISUAL_CONFIG.historyDepth);
  state.frequencyHistory = nextHistory;

  updateNodes(smoothed);
  drawConnections();
  drawNodes();

  state.animationId = requestAnimationFrame(draw);
}

function updateNodes(bandValues) {
  state.nodes.forEach(node => {
    const bandValue = bandValues[node.bandIndex];
    node.target = bandValue / 255;
    node.amplitude += (node.target - node.amplitude) * 0.22;
  });
}

function drawNodes() {
  for (const node of state.nodes) {
    const radius = VISUAL_CONFIG.nodeRadius.min + node.amplitude * (VISUAL_CONFIG.nodeRadius.max - VISUAL_CONFIG.nodeRadius.min);
    const { fill, glow } = nodeColors(state.colorMode, node.bandIndex, FREQUENCY_BANDS.length, node.amplitude);

    ctx.beginPath();
    ctx.fillStyle = fill;
    ctx.shadowColor = glow;
    ctx.shadowBlur = node.amplitude * 20;
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function drawConnections() {
  ctx.lineCap = 'round';

  for (let i = 0; i < state.nodes.length; i++) {
    for (let j = i + 1; j < state.nodes.length; j++) {
      const a = state.nodes[i];
      const b = state.nodes[j];
      const correlation = connectionStrength(a.amplitude, b.amplitude);
      if (correlation < state.correlationThreshold) continue;

      const width = VISUAL_CONFIG.connectionWidth.min + correlation * (VISUAL_CONFIG.connectionWidth.max - VISUAL_CONFIG.connectionWidth.min);
      ctx.lineWidth = width;

      const bandIndexAverage = (a.bandIndex + b.bandIndex) / 2;
      const stroke = connectionColor(state.colorMode, bandIndexAverage, FREQUENCY_BANDS.length, correlation);

      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const cp1x = midX + (a.y - b.y) * 0.12;
      const cp1y = midY + (b.x - a.x) * 0.12;

      ctx.beginPath();
      ctx.strokeStyle = stroke;
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(cp1x, cp1y, b.x, b.y);
      ctx.stroke();
    }
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function bindControls() {
  startBtn.addEventListener('click', toggleRunState);
  prevBtn.addEventListener('click', prevTrack);
  nextBtn.addEventListener('click', nextTrack);
  symmetryBtn.addEventListener('click', cycleSymmetry);
  colorBtn.addEventListener('click', cycleColorMode);
  nodeCountBtn.addEventListener('click', cycleNodeCount);
  arrangementBtn.addEventListener('click', cycleArrangement);
  correlationSlider.addEventListener('input', () => updateCorrelationThreshold(parseFloat(correlationSlider.value)));
  albumSelect.addEventListener('change', (event) => {
    const nextAlbumIndex = Number(event.target.value);
    setAlbum(nextAlbumIndex, state.isRunning);
  });
}

init();
