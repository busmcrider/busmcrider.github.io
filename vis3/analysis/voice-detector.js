// analysis/voice-detector.js
// Voice detection via vocal frequency range analysis

import { BaseAnalyzer } from './base-analyzer.js';

export class VoiceDetector extends BaseAnalyzer {
  constructor(analyser, config) {
    super(analyser, config);

    // State
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);

    // Get sample rate and calculate frequency resolution
    this.sampleRate = analyser.context.sampleRate;
    this.frequencyResolution = this.sampleRate / (this.bufferLength * 2);

    // Vocal frequency range (fundamental + formants)
    this.vocalMinFreq = 300;  // Hz
    this.vocalMaxFreq = 3000; // Hz

    // Calculate bin indices for vocal range
    this.vocalMinBin = Math.floor(this.vocalMinFreq / this.frequencyResolution);
    this.vocalMaxBin = Math.floor(this.vocalMaxFreq / this.frequencyResolution);

    // History for smoothing
    this.detectionHistory = [];
    this.historySize = 10;
  }

  analyze(currentTime) {
    // Get frequency data
    this.analyser.getByteFrequencyData(this.dataArray);

    // Calculate total energy
    let totalEnergy = 0;
    for (let i = 0; i < this.bufferLength; i++) {
      totalEnergy += this.dataArray[i];
    }

    // Calculate energy in vocal range
    let vocalEnergy = 0;
    for (let i = this.vocalMinBin; i < Math.min(this.vocalMaxBin, this.bufferLength); i++) {
      vocalEnergy += this.dataArray[i];
    }

    // Avoid division by zero
    if (totalEnergy === 0) {
      return {
        timestamp: currentTime,
        voicePresent: false,
        confidence: 0,
        strength: 0
      };
    }

    // Calculate vocal energy ratio
    const vocalRatio = vocalEnergy / totalEnergy;

    // Look for harmonic structure (peaks in vocal range)
    const harmonicStrength = this.detectHarmonicStructure();

    // Combine vocal ratio and harmonic structure for detection
    const rawStrength = (vocalRatio * 0.6) + (harmonicStrength * 0.4);

    // Add to history for smoothing
    this.detectionHistory.push(rawStrength);
    if (this.detectionHistory.length > this.historySize) {
      this.detectionHistory.shift();
    }

    // Smooth strength over history
    const smoothedStrength = this.detectionHistory.reduce((a, b) => a + b, 0) / this.detectionHistory.length;

    // Get threshold from config
    const confidenceThreshold = this.config.get('analysis.voice.confidenceThreshold');

    // Voice is present if smoothed strength exceeds threshold
    const voicePresent = smoothedStrength > confidenceThreshold;

    // Confidence based on how far above threshold
    const confidence = voicePresent
      ? Math.min(1, smoothedStrength / confidenceThreshold)
      : 0;

    return {
      timestamp: currentTime,
      voicePresent: voicePresent,
      confidence: confidence,
      strength: smoothedStrength
    };
  }

  detectHarmonicStructure() {
    // Look for peaks that might indicate harmonics
    // Voice has characteristic harmonic structure with peaks at multiples of fundamental

    let peakCount = 0;
    let peakStrength = 0;
    const minPeakHeight = 50; // Minimum magnitude to count as peak

    // Look for peaks in vocal range
    for (let i = this.vocalMinBin + 1; i < Math.min(this.vocalMaxBin - 1, this.bufferLength - 1); i++) {
      const current = this.dataArray[i];
      const prev = this.dataArray[i - 1];
      const next = this.dataArray[i + 1];

      // Peak detection: current value higher than neighbors
      if (current > prev && current > next && current > minPeakHeight) {
        peakCount++;
        peakStrength += current / 255;
      }
    }

    // Normalize: more peaks with higher strength = more likely to be voice
    // Typical voice has 3-8 prominent peaks (fundamental + harmonics)
    const normalizedPeakCount = Math.min(1, peakCount / 8);
    const normalizedPeakStrength = Math.min(1, peakStrength / 5);

    return (normalizedPeakCount * 0.5) + (normalizedPeakStrength * 0.5);
  }

  reset() {
    this.detectionHistory = [];
  }
}
