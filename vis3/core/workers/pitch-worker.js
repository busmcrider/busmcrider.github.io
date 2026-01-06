// core/workers/pitch-worker.js
// Web Worker for pitch detection via autocorrelation

let config = {
  minFrequency: 80,
  maxFrequency: 2000,
  sampleRate: 44100
};

self.onmessage = function(e) {
  const { type, data } = e.data;

  switch (type) {
    case 'init':
      config = { ...config, ...data };
      self.postMessage({ type: 'ready' });
      break;

    case 'analyze':
      const result = detectPitch(data.buffer, data.sampleRate || config.sampleRate);
      self.postMessage({
        type: 'result',
        ...result
      });
      break;

    case 'updateConfig':
      config = { ...config, ...data };
      break;

    default:
      console.warn('Unknown message type:', type);
  }
};

function detectPitch(buffer, sampleRate) {
  // Calculate lag range from frequency range
  const minLag = Math.floor(sampleRate / config.maxFrequency);
  const maxLag = Math.floor(sampleRate / config.minFrequency);

  // Perform autocorrelation
  const { lag, correlation } = autoCorrelate(buffer, minLag, maxLag);

  if (lag === -1 || correlation < 0.1) {
    return {
      frequency: 0,
      note: null,
      confidence: 0
    };
  }

  // Convert lag to frequency
  const frequency = sampleRate / lag;

  // Convert frequency to note
  const note = frequencyToNote(frequency);

  // Confidence based on correlation strength
  const confidence = Math.min(1, correlation * 2); // Scale up correlation

  return {
    frequency: frequency,
    note: note,
    confidence: confidence
  };
}

function autoCorrelate(buffer, minLag, maxLag) {
  let bestLag = -1;
  let bestCorrelation = 0;

  // Find lag with maximum correlation
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    let normalization = 0;

    // Calculate normalized correlation at this lag
    for (let i = 0; i < buffer.length - lag; i++) {
      sum += buffer[i] * buffer[i + lag];
      normalization += buffer[i] * buffer[i];
    }

    // Normalize by energy
    const correlation = normalization > 0 ? sum / normalization : 0;

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }

  return { lag: bestLag, correlation: bestCorrelation };
}

function frequencyToNote(frequency) {
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
