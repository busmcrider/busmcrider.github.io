// Beat detection using onset detection algorithm
// Tracks energy spikes in the audio signal
import { MusicState } from '../core/music-state.js';

export class BeatDetector {
  constructor(config) {
    this.config = config;

    // Energy history for comparison
    this.energyHistory = [];
    this.historySize = config.get('analysis.beat.historySize');

    // Beat state
    this.lastBeatTime = 0;
    this.beatConfidence = 0;

    // Previous frame data for flux calculation
    this.previousSpectrum = null;
  }

  // Main beat detection function
  detect(currentTime) {
    const spectrum = MusicState.instantaneous.spectrum;
    if (!spectrum) return;

    const beatConfig = this.config.get('analysis.beat');
    if (!beatConfig.enabled) return;

    // Calculate spectral flux (rate of change in spectrum)
    let flux = 0;
    if (this.previousSpectrum) {
      for (let i = 0; i < spectrum.length; i++) {
        const diff = spectrum[i] - this.previousSpectrum[i];
        // Only count increases (onsets)
        if (diff > 0) {
          flux += diff;
        }
      }
      flux = flux / spectrum.length;
    }

    // Store current spectrum for next frame
    if (!this.previousSpectrum) {
      this.previousSpectrum = new Uint8Array(spectrum.length);
    }
    this.previousSpectrum.set(spectrum);

    // Update energy history
    this.energyHistory.push(flux);
    if (this.energyHistory.length > this.historySize) {
      this.energyHistory.shift();
    }

    // Calculate average energy
    const avgEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;

    // Calculate variance for confidence
    const variance = this.energyHistory.reduce((sum, val) => {
      return sum + Math.pow(val - avgEnergy, 2);
    }, 0) / this.energyHistory.length;
    const stdDev = Math.sqrt(variance);

    // Detect beat: current flux significantly higher than average
    const threshold = avgEnergy * beatConfig.energyThreshold;
    const timeSinceLastBeat = (currentTime - this.lastBeatTime) * 1000; // Convert to ms

    let beatDetected = false;
    let beatStrength = 0;

    if (flux > threshold && timeSinceLastBeat > beatConfig.minTimeBetweenBeats) {
      beatDetected = true;
      // Calculate strength (how much above threshold)
      beatStrength = Math.min((flux - threshold) / threshold, 1.0);
      this.lastBeatTime = currentTime;

      // Update confidence (increases with consistent detection)
      this.beatConfidence = Math.min(this.beatConfidence + 0.1, 1.0);
    } else {
      // Decay confidence slowly
      this.beatConfidence = Math.max(this.beatConfidence - 0.01, 0);
    }

    // Update state
    if (!MusicState.features.beat) {
      MusicState.features.beat = {};
    }

    MusicState.features.beat = {
      detected: beatDetected,
      confidence: this.beatConfidence,
      lastBeatTime: this.lastBeatTime,
      timeSinceLastBeat: timeSinceLastBeat,
      strength: beatStrength,
      currentFlux: flux,
      avgFlux: avgEnergy,
      threshold: threshold
    };

    // Update spectral flux in instantaneous state
    MusicState.instantaneous.spectralFlux = flux;

    // Log beats for debugging
    if (beatDetected) {
      console.log(`[Beat] Detected at ${currentTime.toFixed(2)}s, strength: ${beatStrength.toFixed(2)}, confidence: ${this.beatConfidence.toFixed(2)}`);
    }
  }

  // Adjust sensitivity
  setSensitivity(value) {
    this.config.set('analysis.beat.sensitivity', value);
  }
}
