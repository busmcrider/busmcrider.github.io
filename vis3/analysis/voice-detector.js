// analysis/voice-detector.js
// Voice detection via vocal frequency range and harmonic analysis

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

    // Vocal frequency ranges (based on formants research)
    // Fundamental: 85-255Hz (male/female voice fundamentals)
    // First formant (F1): 300-1000Hz
    // Second formant (F2): 800-3000Hz
    this.vocalMinFreq = 300;
    this.vocalMaxFreq = 3000;

    // Calculate bin indices
    this.vocalMinBin = Math.floor(this.vocalMinFreq / this.frequencyResolution);
    this.vocalMaxBin = Math.floor(this.vocalMaxFreq / this.frequencyResolution);

    // History for temporal smoothing
    this.detectionHistory = [];
    this.historySize = 15; // ~0.25 seconds at 60fps
  }

  analyze(currentTime) {
    // Get frequency data
    this.analyser.getByteFrequencyData(this.dataArray);

    // Calculate total energy across all frequencies
    let totalEnergy = 0;
    for (let i = 0; i < this.bufferLength; i++) {
      totalEnergy += this.dataArray[i];
    }

    // Calculate energy in vocal frequency range
    let vocalEnergy = 0;
    const vocalBins = Math.min(this.vocalMaxBin, this.bufferLength) - this.vocalMinBin;
    for (let i = this.vocalMinBin; i < Math.min(this.vocalMaxBin, this.bufferLength); i++) {
      vocalEnergy += this.dataArray[i];
    }

    // Avoid division by zero
    if (totalEnergy < 10) { // Silence threshold
      this.detectionHistory.push(0);
      if (this.detectionHistory.length > this.historySize) {
        this.detectionHistory.shift();
      }

      return {
        timestamp: currentTime,
        voicePresent: false,
        confidence: 0,
        strength: 0
      };
    }

    // Calculate average energy per bin in vocal range
    const avgVocalEnergyPerBin = vocalEnergy / vocalBins;
    const avgTotalEnergyPerBin = totalEnergy / this.bufferLength;

    // Voice detection metric: vocal range should have HIGHER energy per bin
    const vocalRatio = avgVocalEnergyPerBin / avgTotalEnergyPerBin;

    // Detect harmonic structure (voices have clear peaks)
    const harmonicScore = this.detectHarmonicPeaks();

    // Combined score weighted toward harmonic structure
    const rawScore = (vocalRatio * 0.3) + (harmonicScore * 0.7);

    // Add to history for temporal smoothing
    this.detectionHistory.push(rawScore);
    if (this.detectionHistory.length > this.historySize) {
      this.detectionHistory.shift();
    }

    // Smooth over history
    const smoothedScore = this.detectionHistory.reduce((a, b) => a + b, 0) / this.detectionHistory.length;

    // Get threshold from config
    const threshold = this.config.get('analysis.voice.confidenceThreshold');

    // Voice is present if smoothed score exceeds threshold
    const voicePresent = smoothedScore > threshold;

    // Confidence is how far above threshold
    const confidence = Math.min(1, smoothedScore / threshold);

    // Log voice detections
    if (voicePresent && confidence > 0.7) {
      console.log(`[VOICE] Detected | Score: ${smoothedScore.toFixed(2)} | Confidence: ${confidence.toFixed(2)}`);
    }

    return {
      timestamp: currentTime,
      voicePresent: voicePresent,
      confidence: confidence,
      strength: smoothedScore
    };
  }

  detectHarmonicPeaks() {
    // Voice has characteristic harmonic peaks (fundamental + overtones)
    // Look for regularly spaced peaks in the spectrum

    const peaks = [];
    const minPeakHeight = 80; // Magnitude threshold (0-255)
    const minPeakProminence = 20; // Peak must be this much higher than neighbors

    // Find peaks in vocal range
    for (let i = this.vocalMinBin + 2; i < Math.min(this.vocalMaxBin - 2, this.bufferLength - 2); i++) {
      const current = this.dataArray[i];
      const prev1 = this.dataArray[i - 1];
      const prev2 = this.dataArray[i - 2];
      const next1 = this.dataArray[i + 1];
      const next2 = this.dataArray[i + 2];

      // Peak detection: current higher than neighbors
      if (current > minPeakHeight &&
          current > prev1 + minPeakProminence &&
          current > prev2 + minPeakProminence &&
          current > next1 + minPeakProminence &&
          current > next2 + minPeakProminence) {
        peaks.push({
          bin: i,
          magnitude: current,
          frequency: i * this.frequencyResolution
        });
      }
    }

    // Voice typically has 3-7 strong harmonics in this range
    if (peaks.length < 2 || peaks.length > 15) {
      return 0;
    }

    // Calculate harmonic regularity
    // Voice harmonics are at integer multiples of fundamental
    if (peaks.length >= 3) {
      const intervals = [];
      for (let i = 1; i < peaks.length; i++) {
        intervals.push(peaks[i].frequency - peaks[i - 1].frequency);
      }

      // Check if intervals are roughly consistent (harmonic)
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);
      const consistency = 1 - Math.min(1, stdDev / avgInterval);

      // Strong peaks with consistent spacing = voice
      const peakStrength = Math.min(1, peaks.length / 6);
      return (consistency * 0.6) + (peakStrength * 0.4);
    }

    // Few peaks - rely on count
    return Math.min(1, peaks.length / 5);
  }

  reset() {
    this.detectionHistory = [];
  }
}
