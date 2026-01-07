// analysis/instantaneous.js
// Real-time frequency analysis with amplitude and spectral features

import { BaseAnalyzer } from './base-analyzer.js';

export class InstantaneousAnalyzer extends BaseAnalyzer {
  constructor(analyser, config) {
    super(analyser, config);

    // Reuse typed array for performance
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);

    console.log(`[INSTANTANEOUS] Initialized - FFT: ${this.analyser.fftSize}, Bins: ${this.bufferLength}`);
  }

  updateFFTSize() {
    // Recreate buffer if FFT size changed
    const newBufferLength = this.analyser.frequencyBinCount;
    if (newBufferLength !== this.bufferLength) {
      console.log(`[INSTANTANEOUS] FFT changed - Bins: ${this.bufferLength} → ${newBufferLength}`);
      this.bufferLength = newBufferLength;
      this.dataArray = new Uint8Array(this.bufferLength);
    }
  }

  analyze(currentTime) {
    // Get frequency data
    this.analyser.getByteFrequencyData(this.dataArray);

    // Calculate amplitude (average of all bins, normalized 0-1)
    let sum = 0;
    for (let i = 0; i < this.bufferLength; i++) {
      sum += this.dataArray[i];
    }
    const amplitude = sum / this.bufferLength / 255;

    // Calculate spectral centroid (weighted average frequency)
    // Higher value = brighter sound
    let weightedSum = 0;
    let magnitudeSum = 0;

    for (let i = 0; i < this.bufferLength; i++) {
      const magnitude = this.dataArray[i];
      weightedSum += i * magnitude;
      magnitudeSum += magnitude;
    }

    const spectralCentroid = magnitudeSum > 0
      ? weightedSum / magnitudeSum / this.bufferLength
      : 0;

    return {
      timestamp: currentTime,
      spectrum: this.dataArray,
      amplitude: amplitude,
      spectralCentroid: spectralCentroid
    };
  }
}
