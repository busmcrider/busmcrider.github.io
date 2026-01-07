// analysis/beat-detector.js
// Beat detection via bass-focused spectral flux with median threshold
// Research: Ellis (2007) "Beat Tracking by Dynamic Programming"

import { BaseAnalyzer } from './base-analyzer.js';

export class BeatDetector extends BaseAnalyzer {
  constructor(analyser, config) {
    super(analyser, config);

    // Calculate frequency bins for bass range (20-200Hz)
    this.sampleRate = analyser.context.sampleRate;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.frequencyResolution = this.sampleRate / (this.bufferLength * 2);

    // Bass frequency range for beat detection
    this.bassMinFreq = 20;
    this.bassMaxFreq = 200;
    this.bassMinBin = Math.floor(this.bassMinFreq / this.frequencyResolution);
    this.bassMaxBin = Math.floor(this.bassMaxFreq / this.frequencyResolution);

    // Flux history for median-based threshold
    this.historySize = 60; // 1 second at 60fps
    this.fluxHistory = [];

    // Previous spectrum for flux calculation
    this.lastSpectrum = null;

    // Beat tracking
    this.lastBeatTime = 0;
    this.beatIntervals = [];
    this.maxIntervals = 8;

    // State
    this.dataArray = new Uint8Array(this.bufferLength);

    console.log(`[BEAT] Initialized - Bass range: ${this.bassMinFreq}-${this.bassMaxFreq}Hz (bins ${this.bassMinBin}-${this.bassMaxBin})`);
  }

  analyze(currentTime) {
    // Get frequency data
    this.analyser.getByteFrequencyData(this.dataArray);

    // Calculate spectral flux in bass range only
    let flux = 0;

    if (this.lastSpectrum) {
      // Sum positive differences in bass range
      for (let i = this.bassMinBin; i < Math.min(this.bassMaxBin, this.bufferLength); i++) {
        const diff = this.dataArray[i] - this.lastSpectrum[i];
        // Only positive changes (onsets)
        if (diff > 0) {
          flux += diff;
        }
      }

      // Normalize by number of bins
      flux = flux / (this.bassMaxBin - this.bassMinBin);
    }

    // Store current spectrum for next frame
    if (!this.lastSpectrum) {
      this.lastSpectrum = new Uint8Array(this.bufferLength);
    }
    this.lastSpectrum.set(this.dataArray);

    // Add to history
    this.fluxHistory.push(flux);
    if (this.fluxHistory.length > this.historySize) {
      this.fluxHistory.shift();
    }

    // Need enough history
    if (this.fluxHistory.length < 20) {
      return {
        timestamp: currentTime,
        detected: false,
        confidence: 0,
        strength: 0,
        timeSinceLastBeat: (currentTime * 1000) - this.lastBeatTime,
        flux: flux
      };
    }

    // Calculate MEDIAN-based threshold (more robust than mean)
    const sortedFlux = [...this.fluxHistory].sort((a, b) => a - b);
    const median = sortedFlux[Math.floor(sortedFlux.length / 2)];

    // Calculate MAD (Median Absolute Deviation) for robustness
    const deviations = this.fluxHistory.map(f => Math.abs(f - median));
    const sortedDeviations = deviations.sort((a, b) => a - b);
    const mad = sortedDeviations[Math.floor(sortedDeviations.length / 2)];

    // Threshold = median + (sensitivity * MAD)
    const sensitivity = this.config.get('analysis.beat.sensitivity');
    const threshold = median + (sensitivity * mad);

    // Check for beat
    const minTimeBetweenBeats = this.config.get('analysis.beat.minTimeBetweenBeats');
    const timeSinceLastBeat = (currentTime * 1000) - this.lastBeatTime;
    const isBeat = flux > threshold && timeSinceLastBeat > minTimeBetweenBeats;

    let confidence = 0;

    if (isBeat) {
      this.lastBeatTime = currentTime * 1000;

      if (timeSinceLastBeat > 0) {
        this.beatIntervals.push(timeSinceLastBeat);
        if (this.beatIntervals.length > this.maxIntervals) {
          this.beatIntervals.shift();
        }
      }

      // Calculate confidence from interval consistency
      if (this.beatIntervals.length >= 3) {
        const avgInterval = this.beatIntervals.reduce((a, b) => a + b, 0) / this.beatIntervals.length;
        const variance = this.beatIntervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / this.beatIntervals.length;
        const stdDev = Math.sqrt(variance);

        confidence = Math.max(0, Math.min(1, 1 - (stdDev / avgInterval)));
      } else {
        confidence = 0.5;
      }

      console.log(`[BEAT] Detected at ${currentTime.toFixed(2)}s | Flux: ${flux.toFixed(1)} > Threshold: ${threshold.toFixed(1)} | Interval: ${timeSinceLastBeat.toFixed(0)}ms | Confidence: ${confidence.toFixed(2)}`);
    }

    const strength = Math.min(1, flux / (threshold > 0 ? threshold : 1));

    return {
      timestamp: currentTime,
      detected: isBeat,
      confidence: confidence,
      strength: strength,
      timeSinceLastBeat: timeSinceLastBeat,
      flux: flux,
      threshold: threshold
    };
  }

  reset() {
    this.fluxHistory = [];
    this.lastSpectrum = null;
    this.lastBeatTime = 0;
    this.beatIntervals = [];
  }
}
