// Central state object for all music analysis data
// This is the single source of truth that gets updated by analyzers
// and read by visualizers

const MusicState = {
  // Instantaneous data (updated every frame)
  instantaneous: {
    timestamp: 0,              // Current audio time in seconds
    spectrum: null,            // Float32Array of FFT frequency data
    amplitude: 0,              // 0-1, current volume level
    spectralCentroid: 0,       // Hz, brightness of sound
    spectralFlux: 0,           // Rate of spectral change
    rms: 0                     // Root mean square (alternative amplitude measure)
  },

  // Features (will be populated in later stages)
  features: {
    beat: {
      detected: false,
      confidence: 0,
      lastBeatTime: 0,
      timeSinceLastBeat: 0,
      strength: 0,
      currentFlux: 0,
      avgFlux: 0,
      threshold: 0
    },
    tempo: null,
    key: null,
    harmonic: null
  },

  // Meta information
  meta: {
    analyzedDuration: 0,       // ms of audio analyzed so far
    totalDuration: 0,          // total track length if known
    analysisQuality: 'initializing'  // 'initializing', 'building', 'stable'
  },

  // Reset state (useful when loading new audio)
  reset() {
    this.instantaneous.timestamp = 0;
    this.instantaneous.spectrum = null;
    this.instantaneous.amplitude = 0;
    this.instantaneous.spectralCentroid = 0;
    this.instantaneous.spectralFlux = 0;
    this.instantaneous.rms = 0;
    this.meta.analyzedDuration = 0;
    this.meta.totalDuration = 0;
    this.meta.analysisQuality = 'initializing';
  }
};
