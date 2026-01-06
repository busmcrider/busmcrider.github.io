// core/lifecycle-manager.js
// BPM-aware animation timing

export class LifecycleManager {
  constructor(config) {
    this.config = config;
    this.currentBPM = null;
    this.bpmConfidence = 0;
    this.reliabilityThreshold = 0.7;
  }

  updateBPM(bpm, confidence) {
    this.currentBPM = bpm;
    this.bpmConfidence = confidence;
  }

  getDuration(beats, fallbackMs) {
    // Calculate duration based on BPM if reliable
    if (this.isBPMReliable() && this.currentBPM > 0) {
      // Convert beats to milliseconds
      // BPM = beats per minute, so ms per beat = 60000 / BPM
      const msPerBeat = 60000 / this.currentBPM;
      return beats * msPerBeat;
    }

    // Fall back to provided duration if BPM not reliable
    return fallbackMs;
  }

  getAnimationDuration(type) {
    // Return BPM-synced durations for animation types
    const beatDurations = {
      beatPulse: 0.5,    // Half beat
      colorFlash: 0.25,  // Quarter beat
      transition: 2,     // Two beats
      slowPulse: 1,      // One beat
      fastFlash: 0.125   // Eighth beat
    };

    const beats = beatDurations[type] || 0.5;
    const fallbackMs = beats * 500; // Assume 120 BPM as fallback

    return this.getDuration(beats, fallbackMs);
  }

  isBPMReliable() {
    return this.currentBPM !== null &&
           this.currentBPM > 0 &&
           this.bpmConfidence >= this.reliabilityThreshold;
  }

  getCurrentBPM() {
    return this.currentBPM;
  }

  getBPMConfidence() {
    return this.bpmConfidence;
  }

  getBeatsPerSecond() {
    if (this.isBPMReliable()) {
      return this.currentBPM / 60;
    }
    return null;
  }

  getMsPerBeat() {
    if (this.isBPMReliable()) {
      return 60000 / this.currentBPM;
    }
    return null;
  }

  reset() {
    this.currentBPM = null;
    this.bpmConfidence = 0;
  }
}
