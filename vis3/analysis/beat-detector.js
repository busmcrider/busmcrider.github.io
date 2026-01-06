// analysis/beat-detector.js
// Beat detection via spectral flux onset detection

import { BaseAnalyzer } from './base-analyzer.js';

export class BeatDetector extends BaseAnalyzer {
  constructor(analyser, config) {
    super(analyser, config);

    // Energy history for spectral flux calculation
    this.historySize = 43; // ~1 second at 60fps
    this.energyHistory = [];
    this.lastSpectrum = null;

    // Beat tracking
    this.lastBeatTime = 0;
    this.beatIntervals = [];
    this.maxIntervals = 8; // Track last 8 intervals for consistency

    // State
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
  }

  analyze(currentTime) {
    // Get frequency data
    this.analyser.getByteFrequencyData(this.dataArray);

    // Calculate spectral flux (energy change from last frame)
    let flux = 0;
    if (this.lastSpectrum) {
      for (let i = 0; i < this.bufferLength; i++) {
        const diff = this.dataArray[i] - this.lastSpectrum[i];
        // Only positive changes (onsets)
        if (diff > 0) {
          flux += diff;
        }
      }
    }

    // Store current spectrum for next frame
    this.lastSpectrum = new Uint8Array(this.dataArray);

    // Add to history
    this.energyHistory.push(flux);
    if (this.energyHistory.length > this.historySize) {
      this.energyHistory.shift();
    }

    // Need enough history to detect beats
    if (this.energyHistory.length < 10) {
      return {
        timestamp: currentTime,
        detected: false,
        confidence: 0,
        strength: 0,
        timeSinceLastBeat: currentTime - this.lastBeatTime
      };
    }

    // Calculate threshold
    const sensitivity = this.config.get('analysis.beat.sensitivity');
    const average = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;
    const variance = this.energyHistory.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / this.energyHistory.length;
    const stdDev = Math.sqrt(variance);
    const threshold = average + (sensitivity * stdDev);

    // Check for beat
    const minTimeBetweenBeats = this.config.get('analysis.beat.minTimeBetweenBeats');
    const timeSinceLastBeat = currentTime - this.lastBeatTime;
    const isBeat = flux > threshold && timeSinceLastBeat > minTimeBetweenBeats;

    let confidence = 0;

    if (isBeat) {
      // Record beat timing
      this.lastBeatTime = currentTime;

      if (timeSinceLastBeat > 0) {
        this.beatIntervals.push(timeSinceLastBeat);
        if (this.beatIntervals.length > this.maxIntervals) {
          this.beatIntervals.shift();
        }
      }

      // Calculate confidence based on timing consistency
      if (this.beatIntervals.length >= 4) {
        const avgInterval = this.beatIntervals.reduce((a, b) => a + b, 0) / this.beatIntervals.length;
        const intervalVariance = this.beatIntervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / this.beatIntervals.length;
        const intervalStdDev = Math.sqrt(intervalVariance);

        // Confidence is higher when intervals are consistent (low stdDev)
        confidence = Math.max(0, Math.min(1, 1 - (intervalStdDev / avgInterval)));
      } else {
        confidence = 0.5; // Default confidence for first few beats
      }
    }

    // Normalized strength (0-1)
    const strength = Math.min(1, flux / (threshold * 2));

    return {
      timestamp: currentTime,
      detected: isBeat,
      confidence: confidence,
      strength: strength,
      timeSinceLastBeat: timeSinceLastBeat
    };
  }

  reset() {
    this.energyHistory = [];
    this.lastSpectrum = null;
    this.lastBeatTime = 0;
    this.beatIntervals = [];
  }
}
