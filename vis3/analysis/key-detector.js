// analysis/key-detector.js
// Musical key detection with accumulative profile and key change detection
// Research: Temperley (2007) "Music and Probability"

import { BaseAnalyzer } from './base-analyzer.js';

export class KeyDetector extends BaseAnalyzer {
  constructor(analyser, config) {
    super(analyser, config);

    // Accumulative pitch class profile (builds over entire song)
    this.pitchClassProfile = new Array(12).fill(0);

    // Recent profile for detecting key changes
    this.recentProfile = new Array(12).fill(0);
    this.recentPitchHistory = [];
    this.recentHistorySize = 50; // ~3-5 seconds of pitches

    // Long-term pitch history (with timestamps for decay)
    this.pitchHistory = [];
    this.decayRate = 0.995; // Exponential decay factor per pitch added

    // Key locking
    this.lockedKey = null;
    this.lockedMode = null;
    this.lockedConfidence = 0;
    this.lockThreshold = 0.75; // Lock once this confident
    this.changeThreshold = 0.85; // Need this confidence to change key
    this.lockFrameCount = 0;

    // Krumhansl-Schmuckler key profiles (research-based weights)
    this.majorTemplate = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
    this.minorTemplate = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

    this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    console.log('[KEY] Initialized - Accumulative mode with key change detection');
  }

  analyze(currentTime) {
    // Build profiles from history
    this.buildPitchClassProfile();
    this.buildRecentProfile();

    const confidenceThreshold = this.config.get('analysis.key.confidenceThreshold');

    // Need sufficient data
    if (this.pitchHistory.length < 30) {
      return {
        timestamp: currentTime,
        key: null,
        mode: null,
        confidence: 0
      };
    }

    // Detect key from long-term profile
    const longTermKey = this.detectKeyFromProfile(this.pitchClassProfile);

    // If we have a locked key, check for key change
    if (this.lockedKey !== null) {
      this.lockFrameCount++;

      // Check for key change every 5 seconds worth of analysis
      if (this.lockFrameCount % 100 === 0 && this.recentPitchHistory.length >= 30) {
        const recentKey = this.detectKeyFromProfile(this.recentProfile);

        // Key change detected if:
        // 1. Recent key is different from locked key
        // 2. Recent key has very high confidence
        // 3. Sustained for sufficient time
        if (recentKey.key !== this.lockedKey &&
            recentKey.confidence >= this.changeThreshold) {

          console.log(`[KEY] CHANGE DETECTED: ${this.lockedKey} ${this.lockedMode} → ${recentKey.key} ${recentKey.mode} (confidence: ${recentKey.confidence.toFixed(2)})`);

          // Unlock and allow new key
          this.lockedKey = null;
          this.lockedMode = null;
          this.lockedConfidence = 0;
          this.lockFrameCount = 0;

          // Clear recent history to start fresh
          this.recentPitchHistory = [];
        }
      }

      // Return locked key
      return {
        timestamp: currentTime,
        key: this.lockedKey,
        mode: this.lockedMode,
        confidence: this.lockedConfidence
      };
    }

    // Not locked yet - evaluate current detection
    if (longTermKey.confidence >= this.lockThreshold && this.pitchHistory.length >= 50) {
      // Lock the key
      this.lockedKey = longTermKey.key;
      this.lockedMode = longTermKey.mode;
      this.lockedConfidence = longTermKey.confidence;
      this.lockFrameCount = 0;

      console.log(`[KEY] Locked: ${this.lockedKey} ${this.lockedMode} (confidence: ${this.lockedConfidence.toFixed(2)})`);

      return {
        timestamp: currentTime,
        key: this.lockedKey,
        mode: this.lockedMode,
        confidence: this.lockedConfidence
      };
    }

    // Return current best estimate (not locked yet)
    if (longTermKey.confidence >= confidenceThreshold) {
      return {
        timestamp: currentTime,
        key: longTermKey.key,
        mode: longTermKey.mode,
        confidence: longTermKey.confidence
      };
    }

    return {
      timestamp: currentTime,
      key: null,
      mode: null,
      confidence: 0
    };
  }

  updatePitch(note, confidence) {
    if (!note || confidence < 0.3) return;

    const noteName = note.replace(/[0-9]/g, '');
    const pitchClass = this.noteNames.indexOf(noteName);

    if (pitchClass !== -1) {
      const timestamp = Date.now();

      // Add to long-term history
      this.pitchHistory.push({ pitchClass, confidence, timestamp });

      // Add to recent history
      this.recentPitchHistory.push({ pitchClass, confidence, timestamp });
      if (this.recentPitchHistory.length > this.recentHistorySize) {
        this.recentPitchHistory.shift();
      }

      // Apply exponential decay to existing pitches
      for (let pitch of this.pitchHistory) {
        pitch.confidence *= this.decayRate;
      }

      // Remove very old/weak pitches (confidence < 0.01)
      this.pitchHistory = this.pitchHistory.filter(p => p.confidence >= 0.01);
    }
  }

  buildPitchClassProfile() {
    this.pitchClassProfile.fill(0);

    for (const pitch of this.pitchHistory) {
      this.pitchClassProfile[pitch.pitchClass] += pitch.confidence;
    }

    // Normalize
    const sum = this.pitchClassProfile.reduce((a, b) => a + b, 0);
    if (sum > 0) {
      for (let i = 0; i < 12; i++) {
        this.pitchClassProfile[i] /= sum;
      }
    }
  }

  buildRecentProfile() {
    this.recentProfile.fill(0);

    for (const pitch of this.recentPitchHistory) {
      this.recentProfile[pitch.pitchClass] += pitch.confidence;
    }

    // Normalize
    const sum = this.recentProfile.reduce((a, b) => a + b, 0);
    if (sum > 0) {
      for (let i = 0; i < 12; i++) {
        this.recentProfile[i] /= sum;
      }
    }
  }

  detectKeyFromProfile(profile) {
    let bestKey = null;
    let bestMode = null;
    let bestCorrelation = -1;

    // Test all 24 keys
    for (let root = 0; root < 12; root++) {
      const majorCorr = this.correlate(profile, this.majorTemplate, root);
      const minorCorr = this.correlate(profile, this.minorTemplate, root);

      if (majorCorr > bestCorrelation) {
        bestCorrelation = majorCorr;
        bestKey = this.noteNames[root];
        bestMode = 'major';
      }

      if (minorCorr > bestCorrelation) {
        bestCorrelation = minorCorr;
        bestKey = this.noteNames[root];
        bestMode = 'minor';
      }
    }

    // Normalize correlation to confidence (0-1)
    const confidence = Math.max(0, Math.min(1, (bestCorrelation + 1) / 2));

    return { key: bestKey, mode: bestMode, confidence: confidence };
  }

  correlate(profile, template, rotation) {
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

    // Pearson correlation
    const num = pSum - (sum1 * sum2 / 12);
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / 12) * (sum2Sq - sum2 * sum2 / 12));

    return den === 0 ? 0 : num / den;
  }

  reset() {
    this.pitchHistory = [];
    this.recentPitchHistory = [];
    this.pitchClassProfile.fill(0);
    this.recentProfile.fill(0);
    this.lockedKey = null;
    this.lockedMode = null;
    this.lockedConfidence = 0;
    this.lockFrameCount = 0;
  }
}
