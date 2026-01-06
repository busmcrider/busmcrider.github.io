// analysis/pitch-detector.js
// Pitch detection via autocorrelation

import { BaseAnalyzer } from './base-analyzer.js';

export class PitchDetector extends BaseAnalyzer {
  constructor(analyser, config) {
    super(analyser, config);

    // Get sample rate from audio context
    this.sampleRate = analyser.context.sampleRate;

    // State
    this.bufferLength = this.analyser.fftSize;
    this.dataArray = new Uint8Array(this.bufferLength);
  }

  analyze(currentTime) {
    // Get time domain data
    this.analyser.getByteTimeDomainData(this.dataArray);

    // Convert to normalized float values (-1 to 1)
    const buffer = new Float32Array(this.bufferLength);
    for (let i = 0; i < this.bufferLength; i++) {
      buffer[i] = (this.dataArray[i] - 128) / 128;
    }

    // Get frequency range from config
    const minFrequency = this.config.get('analysis.pitch.minFrequency');
    const maxFrequency = this.config.get('analysis.pitch.maxFrequency');

    // Calculate lag range from frequency range
    const minLag = Math.floor(this.sampleRate / maxFrequency);
    const maxLag = Math.floor(this.sampleRate / minFrequency);

    // Perform autocorrelation
    const { lag, correlation } = this.autoCorrelate(buffer, minLag, maxLag);

    if (lag === -1 || correlation < 0.1) {
      // No clear pitch detected
      return {
        timestamp: currentTime,
        frequency: 0,
        note: null,
        confidence: 0
      };
    }

    // Convert lag to frequency
    const frequency = this.sampleRate / lag;

    // Convert frequency to note
    const note = this.frequencyToNote(frequency);

    // Confidence based on correlation strength
    const confidence = Math.min(1, correlation);

    return {
      timestamp: currentTime,
      frequency: frequency,
      note: note,
      confidence: confidence
    };
  }

  autoCorrelate(buffer, minLag, maxLag) {
    let bestLag = -1;
    let bestCorrelation = 0;

    // Find lag with maximum correlation
    for (let lag = minLag; lag <= maxLag; lag++) {
      let sum = 0;

      // Calculate correlation at this lag
      for (let i = 0; i < buffer.length - lag; i++) {
        sum += buffer[i] * buffer[i + lag];
      }

      // Normalize by number of samples
      const correlation = sum / (buffer.length - lag);

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestLag = lag;
      }
    }

    return { lag: bestLag, correlation: bestCorrelation };
  }

  frequencyToNote(frequency) {
    // A4 = 440 Hz
    const A4 = 440;
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    // Calculate semitones from A4
    const semitones = 12 * Math.log2(frequency / A4);
    const noteIndex = Math.round(semitones) + 9; // A is index 9

    // Get octave and note name
    const octave = Math.floor(noteIndex / 12) + 4;
    const noteName = noteNames[((noteIndex % 12) + 12) % 12];

    return `${noteName}${octave}`;
  }
}
