// analysis/key-detector.js
// Musical key detection via pitch class profile

import { BaseAnalyzer } from './base-analyzer.js';

export class KeyDetector extends BaseAnalyzer {
  constructor(analyser, config) {
    super(analyser, config);

    // Pitch class histogram (12 bins: C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
    this.pitchClassProfile = new Array(12).fill(0);

    // Pitch history for building profile
    this.pitchHistory = [];
    this.maxHistorySize = 100; // Keep last 100 pitch detections

    // Key templates (Krumhansl-Schmuckler key profiles)
    this.majorTemplate = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
    this.minorTemplate = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

    this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  }

  analyze(currentTime) {
    // Note: This analyzer doesn't detect pitch itself
    // It expects pitch data to be fed via updatePitch() method
    // or it can be called less frequently (e.g., every 10 frames)

    // Build profile from history
    this.buildPitchClassProfile();

    // Need sufficient data to detect key
    const confidenceThreshold = this.config.get('analysis.key.confidenceThreshold');

    if (this.pitchHistory.length < 20) {
      return {
        timestamp: currentTime,
        key: null,
        mode: null,
        confidence: 0
      };
    }

    // Test all 24 keys (12 major + 12 minor)
    let bestKey = null;
    let bestMode = null;
    let bestCorrelation = -1;

    // Test major keys
    for (let root = 0; root < 12; root++) {
      const correlation = this.correlate(this.pitchClassProfile, this.majorTemplate, root);
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestKey = this.noteNames[root];
        bestMode = 'major';
      }
    }

    // Test minor keys
    for (let root = 0; root < 12; root++) {
      const correlation = this.correlate(this.pitchClassProfile, this.minorTemplate, root);
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestKey = this.noteNames[root];
        bestMode = 'minor';
      }
    }

    // Normalize correlation to 0-1 confidence
    const confidence = Math.max(0, Math.min(1, (bestCorrelation + 1) / 2));

    // Only return result if confidence exceeds threshold
    if (confidence < confidenceThreshold) {
      return {
        timestamp: currentTime,
        key: null,
        mode: null,
        confidence: 0
      };
    }

    return {
      timestamp: currentTime,
      key: bestKey,
      mode: bestMode,
      confidence: confidence
    };
  }

  updatePitch(note, confidence) {
    // Called externally to feed pitch data
    if (!note || confidence < 0.3) return;

    // Extract note name (without octave)
    const noteName = note.replace(/[0-9]/g, '');
    const pitchClass = this.noteNames.indexOf(noteName);

    if (pitchClass !== -1) {
      this.pitchHistory.push({ pitchClass, confidence, timestamp: Date.now() });

      if (this.pitchHistory.length > this.maxHistorySize) {
        this.pitchHistory.shift();
      }
    }
  }

  buildPitchClassProfile() {
    // Reset profile
    this.pitchClassProfile.fill(0);

    // Weight pitches by confidence
    for (const pitch of this.pitchHistory) {
      this.pitchClassProfile[pitch.pitchClass] += pitch.confidence;
    }

    // Normalize to sum to 1
    const sum = this.pitchClassProfile.reduce((a, b) => a + b, 0);
    if (sum > 0) {
      for (let i = 0; i < 12; i++) {
        this.pitchClassProfile[i] /= sum;
      }
    }
  }

  correlate(profile, template, rotation) {
    // Pearson correlation with rotated template
    let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, pSum = 0;

    for (let i = 0; i < 12; i++) {
      const templateIndex = (i + rotation) % 12;
      const val1 = profile[i];
      const val2 = template[templateIndex];

      sum1 += val1;
      sum2 += val2;
      sum1Sq += val1 * val1;
      sum2Sq += val2 * val2;
      pSum += val1 * val2;
    }

    // Pearson correlation coefficient
    const num = pSum - (sum1 * sum2 / 12);
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / 12) * (sum2Sq - sum2 * sum2 / 12));

    if (den === 0) return 0;

    return num / den;
  }

  reset() {
    this.pitchHistory = [];
    this.pitchClassProfile.fill(0);
  }
}
