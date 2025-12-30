export const AUDIO_CONFIG = {
  fftSize: 2048,
  smoothing: 0.82,
  minFrameTime: 1000 / 120,
};

export const VISUAL_CONFIG = {
  nodeRadius: { min: 2, max: 14 },
  ringRadius: 0.38,
  connectionWidth: { min: 0.5, max: 3 },
  historyDepth: 30,
};

export const FREQUENCY_BANDS = [
  { min: 20, max: 60 },
  { min: 60, max: 250 },
  { min: 250, max: 500 },
  { min: 500, max: 2000 },
  { min: 2000, max: 4000 },
  { min: 4000, max: 6000 },
  { min: 6000, max: 12000 },
  { min: 12000, max: 20000 },
];

export const ARRANGEMENTS = ['circle', 'edge', 'grid', 'spiral'];
export const NODE_COUNTS = [12, 16, 24, 32, 48];
export const COLOR_MODES = ['monochrome', 'frequency'];
