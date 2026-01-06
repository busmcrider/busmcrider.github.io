// analysis/beat-detector.js
// Beat detection via energy-based onset detection with adaptive threshold

import { BaseAnalyzer } from './base-analyzer.js';

export class BeatDetector extends BaseAnalyzer {
  constructor(analyser, config) {
    super(analyser, config);

    // Energy history for adaptive threshold
    this.historySize = 60; // 1 second at 60fps
    this.energyHistory = [];

    // Beat tracking
    this.lastBeatTime = 0;
    this.beatIntervals = [];
    this.maxIntervals = 8;

    // State
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
  }

  analyze(currentTime) {
    // Get frequency data
    this.analyser.getByteFrequencyData(this.dataArray);

    // Calculate RMS energy (Root Mean Square)
    let sumSquares = 0;
    for (let i = 0; i < this.bufferLength; i++) {
      const normalized = this.dataArray[i] / 255;
      sumSquares += normalized * normalized;
    }
    const energy = Math.sqrt(sumSquares / this.bufferLength);

    // Add to history
    this.energyHistory.push(energy);
    if (this.energyHistory.length > this.historySize) {
      this.energyHistory.shift();
    }

    // Need enough history to detect beats
    if (this.energyHistory.length < 20) {
      return {
        timestamp: currentTime,
        detected: false,
        confidence: 0,
        strength: 0,
        timeSinceLastBeat: currentTime - this.lastBeatTime,
        energy: energy
      };
    }

    // Calculate adaptive threshold
    const sensitivity = this.config.get('analysis.beat.sensitivity');
    const mean = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;
    const variance = this.energyHistory.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / this.energyHistory.length;
    const stdDev = Math.sqrt(variance);

    // Threshold = mean + (sensitivity * stdDev)
    const threshold = mean + (sensitivity * stdDev);

    // Check for beat
    const minTimeBetweenBeats = this.config.get('analysis.beat.minTimeBetweenBeats');
    const timeSinceLastBeat = (currentTime * 1000) - this.lastBeatTime; // Convert to ms
    const isBeat = energy > threshold && timeSinceLastBeat > minTimeBetweenBeats;

    let confidence = 0;

    if (isBeat) {
      // Record beat timing
      this.lastBeatTime = currentTime * 1000; // Store in ms

      if (timeSinceLastBeat > 0) {
        this.beatIntervals.push(timeSinceLastBeat);
        if (this.beatIntervals.length > this.maxIntervals) {
          this.beatIntervals.shift();
        }
      }

      // Calculate confidence based on timing consistency
      if (this.beatIntervals.length >= 3) {
        const avgInterval = this.beatIntervals.reduce((a, b) => a + b, 0) / this.beatIntervals.length;
        const intervalVariance = this.beatIntervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / this.beatIntervals.length;
        const intervalStdDev = Math.sqrt(intervalVariance);

        // Confidence is higher when intervals are consistent
        confidence = Math.max(0, Math.min(1, 1 - (intervalStdDev / avgInterval)));
      } else {
        confidence = 0.5;
      }

      // Log detection
      console.log(`[BEAT] Detected at ${currentTime.toFixed(2)}s | Energy: ${energy.toFixed(3)} > Threshold: ${threshold.toFixed(3)} | Confidence: ${confidence.toFixed(2)}`);
    }

    // Normalized strength
    const strength = Math.min(1, energy / (threshold > 0 ? threshold : 1));

    return {
      timestamp: currentTime,
      detected: isBeat,
      confidence: confidence,
      strength: strength,
      timeSinceLastBeat: timeSinceLastBeat,
      energy: energy,
      threshold: threshold
    };
  }

  reset() {
    this.energyHistory = [];
    this.lastBeatTime = 0;
    this.beatIntervals = [];
  }
}
