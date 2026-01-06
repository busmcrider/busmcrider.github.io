// core/workers/tempo-worker.js
// Web Worker for tempo detection via autocorrelation

let config = {
  minBPM: 60,
  maxBPM: 180,
  analysisWindow: 8 // Number of beat intervals to analyze
};

let beatTimestamps = [];

self.onmessage = function(e) {
  const { type, data } = e.data;

  switch (type) {
    case 'init':
      config = { ...config, ...data };
      self.postMessage({ type: 'ready' });
      break;

    case 'beatDetected':
      handleBeatDetected(data.timestamp);
      break;

    case 'reset':
      beatTimestamps = [];
      self.postMessage({ type: 'reset_complete' });
      break;

    default:
      console.warn('Unknown message type:', type);
  }
};

function handleBeatDetected(timestamp) {
  beatTimestamps.push(timestamp);

  // Keep only recent beats for analysis
  const maxBeats = config.analysisWindow * 2;
  if (beatTimestamps.length > maxBeats) {
    beatTimestamps.shift();
  }

  // Need at least 4 beats to calculate BPM
  if (beatTimestamps.length < 4) {
    self.postMessage({
      type: 'result',
      bpm: null,
      confidence: 0
    });
    return;
  }

  // Calculate intervals between beats
  const intervals = [];
  for (let i = 1; i < beatTimestamps.length; i++) {
    intervals.push(beatTimestamps[i] - beatTimestamps[i - 1]);
  }

  // Perform autocorrelation to find dominant period
  const { period, correlation } = autoCorrelate(intervals);

  if (period === -1) {
    self.postMessage({
      type: 'result',
      bpm: null,
      confidence: 0
    });
    return;
  }

  // Convert period (ms) to BPM
  const bpm = 60000 / period;

  // Clamp to configured range
  const clampedBPM = Math.max(config.minBPM, Math.min(config.maxBPM, bpm));

  // Confidence based on correlation strength and consistency
  const confidence = Math.min(1, correlation);

  self.postMessage({
    type: 'result',
    bpm: clampedBPM,
    confidence: confidence
  });
}

function autoCorrelate(intervals) {
  if (intervals.length < 3) {
    return { period: -1, correlation: 0 };
  }

  let bestPeriod = -1;
  let bestCorrelation = 0;

  // Calculate average interval as starting point
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

  // Test periods around the average interval
  const minPeriod = avgInterval * 0.5;
  const maxPeriod = avgInterval * 1.5;
  const step = 10; // ms

  for (let period = minPeriod; period <= maxPeriod; period += step) {
    let sum = 0;
    let count = 0;

    // Calculate correlation at this period
    for (let i = 0; i < intervals.length; i++) {
      const deviation = Math.abs(intervals[i] - period);
      const maxDeviation = period * 0.1; // 10% tolerance

      if (deviation < maxDeviation) {
        // Good match - contribution to correlation
        sum += 1 - (deviation / maxDeviation);
        count++;
      }
    }

    if (count > 0) {
      const correlation = (sum / count) * (count / intervals.length);

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }
  }

  return { period: bestPeriod, correlation: bestCorrelation };
}
