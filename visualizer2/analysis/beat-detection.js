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
    this.consecutiveBeats = 0;
    this.targetBeatsForConfidence = 10; // Need 10 good beats for 1.0 confidence
    this.expectedBeatInterval = 0;

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
      beatStrength = Math.min((flux - threshold) / threshold, 1.0);

      // Check if this beat is consistent with previous timing
      const isConsistent = this.expectedBeatInterval === 0 ||
                          Math.abs(timeSinceLastBeat - this.expectedBeatInterval) < 100;

      if (isConsistent) {
        this.consecutiveBeats++;
        this.beatConfidence = Math.min(this.consecutiveBeats / this.targetBeatsForConfidence, 1.0);
      } else {
        // Reset on timing inconsistency
        this.consecutiveBeats = 1;
        this.beatConfidence = 0.1;
      }

      // Update expected interval (running average)
      if (this.expectedBeatInterval === 0) {
        this.expectedBeatInterval = timeSinceLastBeat;
      } else {
        this.expectedBeatInterval = this.expectedBeatInterval * 0.9 + timeSinceLastBeat * 0.1;
      }

      this.lastBeatTime = currentTime;
    } else {
      // Decay confidence when beats are missed
      const expectedNextBeat = (currentTime - this.lastBeatTime) * 1000;
      if (this.expectedBeatInterval > 0 && expectedNextBeat > this.expectedBeatInterval * 1.5) {
        // We missed an expected beat
        this.consecutiveBeats = Math.max(0, this.consecutiveBeats - 1);
        this.beatConfidence = Math.max(this.consecutiveBeats / this.targetBeatsForConfidence, 0);
      }
    }

    // Calculate fast tempo from beat intervals
    if (beatDetected && this.consecutiveBeats >= 2) {
      const bpm = 60000 / this.expectedBeatInterval; // Convert ms to BPM

      // Update state with fast tempo
      if (!MusicState.features.tempo) {
        MusicState.features.tempo = {
          fast: null,
          slow: null,
          current: null
        };
      }

      MusicState.features.tempo.fast = {
        bpm: bpm,
        confidence: this.beatConfidence,
        source: 'beat_intervals',
        lastUpdated: currentTime
      };

      // Use fast tempo as current if slow isn't available or reliable
      if (!MusicState.features.tempo.slow || MusicState.features.tempo.slow.confidence < 0.7) {
        MusicState.features.tempo.current = {
          bpm: bpm,
          confidence: this.beatConfidence,
          stable: this.beatConfidence > 0.7
        };
      }
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
