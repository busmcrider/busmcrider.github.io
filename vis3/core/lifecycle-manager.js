// core/lifecycle-manager.js
// BPM-aware animation timing (stub for Phase 1, full implementation in Phase 3)

export class LifecycleManager {
  constructor(config) {
    this.config = config;
    this.currentBPM = null;
    this.bpmConfidence = 0;
  }

  updateBPM(bpm, confidence) {
    this.currentBPM = bpm;
    this.bpmConfidence = confidence;
  }

  getDuration(beats, fallbackMs) {
    // Phase 3: Will calculate based on BPM
    // For now, always return fallback
    return fallbackMs;
  }

  getAnimationDuration(type) {
    // Phase 3: Will return BPM-synced durations
    // For now, return fixed durations
    const durations = {
      beatPulse: 300,
      colorFlash: 200,
      transition: 1000
    };

    return durations[type] || 500;
  }

  isBPMReliable() {
    return this.currentBPM !== null && this.bpmConfidence > 0.7;
  }

  getCurrentBPM() {
    return this.currentBPM;
  }
}
