// core/workers/tempo-worker.js
// Tempo detection with histogram accumulation and tempo locking

let config = {
  minBPM: 60,
  maxBPM: 200,
  lockConfidenceThreshold: 0.8  // Lock tempo once this confident
};

let beatTimestamps = [];
let tempoHistogram = new Map(); // BPM -> count
let lockedBPM = null;
let lockedConfidence = 0;
let lockFrameCount = 0;

self.onmessage = function(e) {
  const { type, data } = e.data;

  switch (type) {
    case 'init':
      config = { ...config, ...data };
      self.postMessage({ type: 'ready' });
      break;

    case 'beatDetected':
      handleBeatDetected(data.timestamp, data.confidence);
      break;

    case 'reset':
      beatTimestamps = [];
      tempoHistogram.clear();
      lockedBPM = null;
      lockedConfidence = 0;
      lockFrameCount = 0;
      self.postMessage({ type: 'reset_complete' });
      break;

    default:
      console.warn('Unknown message type:', type);
  }
};

function handleBeatDetected(timestamp, beatConfidence) {
  beatTimestamps.push(timestamp);

  // Keep last 16 beats for analysis
  if (beatTimestamps.length > 16) {
    beatTimestamps.shift();
  }

  // Need at least 4 beats
  if (beatTimestamps.length < 4) {
    self.postMessage({
      type: 'result',
      bpm: null,
      confidence: 0
    });
    return;
  }

  // Calculate intervals
  const intervals = [];
  for (let i = 1; i < beatTimestamps.length; i++) {
    intervals.push(beatTimestamps[i] - beatTimestamps[i - 1]);
  }

  // If tempo is locked, only refine gradually
  if (lockedBPM !== null && lockedConfidence >= config.lockConfidenceThreshold) {
    lockFrameCount++;

    // Recalculate every 8 beats to refine
    if (lockFrameCount % 8 === 0) {
      const refinedBPM = refineLockedTempo(intervals, lockedBPM);
      lockedBPM = refinedBPM;
      lockedConfidence = Math.min(0.95, lockedConfidence + 0.01); // Gradually increase confidence
    }

    self.postMessage({
      type: 'result',
      bpm: lockedBPM,
      confidence: lockedConfidence
    });
    return;
  }

  // Not locked yet - accumulate tempo histogram
  accumulateTempoHistogram(intervals);

  // Find most likely tempo from histogram
  const tempoEstimate = getTempoFromHistogram();

  if (!tempoEstimate) {
    self.postMessage({
      type: 'result',
      bpm: null,
      confidence: 0
    });
    return;
  }

  // Check if we should lock
  if (tempoEstimate.confidence >= config.lockConfidenceThreshold && beatTimestamps.length >= 8) {
    lockedBPM = tempoEstimate.bpm;
    lockedConfidence = tempoEstimate.confidence;
    lockFrameCount = 0;
    console.log(`[TEMPO] Locked at ${lockedBPM.toFixed(1)} BPM (confidence: ${lockedConfidence.toFixed(2)})`);
  }

  self.postMessage({
    type: 'result',
    bpm: tempoEstimate.bpm,
    confidence: tempoEstimate.confidence
  });
}

function accumulateTempoHistogram(intervals) {
  // Add each interval's implied BPM to histogram
  for (const interval of intervals) {
    const bpm = 60000 / interval;

    // Quantize to nearest 0.5 BPM
    const quantizedBPM = Math.round(bpm * 2) / 2;

    // Only accumulate valid BPMs
    if (quantizedBPM >= config.minBPM && quantizedBPM <= config.maxBPM) {
      const count = tempoHistogram.get(quantizedBPM) || 0;
      tempoHistogram.set(quantizedBPM, count + 1);
    }

    // Also consider double-time and half-time
    const doubleBPM = Math.round((bpm * 2) * 2) / 2;
    const halfBPM = Math.round((bpm / 2) * 2) / 2;

    if (doubleBPM >= config.minBPM && doubleBPM <= config.maxBPM) {
      const count = tempoHistogram.get(doubleBPM) || 0;
      tempoHistogram.set(doubleBPM, count + 0.5); // Weight less
    }

    if (halfBPM >= config.minBPM && halfBPM <= config.maxBPM) {
      const count = tempoHistogram.get(halfBPM) || 0;
      tempoHistogram.set(halfBPM, count + 0.5); // Weight less
    }
  }

  // Decay old histogram entries (exponential forgetting)
  for (const [bpm, count] of tempoHistogram.entries()) {
    tempoHistogram.set(bpm, count * 0.98);

    // Remove very low counts
    if (count < 0.1) {
      tempoHistogram.delete(bpm);
    }
  }
}

function getTempoFromHistogram() {
  if (tempoHistogram.size === 0) {
    return null;
  }

  // Find peak in histogram
  let maxCount = 0;
  let peakBPM = null;

  for (const [bpm, count] of tempoHistogram.entries()) {
    if (count > maxCount) {
      maxCount = count;
      peakBPM = bpm;
    }
  }

  if (peakBPM === null) {
    return null;
  }

  // Calculate confidence from histogram distribution
  const totalCount = Array.from(tempoHistogram.values()).reduce((a, b) => a + b, 0);
  const confidence = maxCount / totalCount;

  return {
    bpm: peakBPM,
    confidence: Math.min(1, confidence)
  };
}

function refineLockedTempo(intervals, currentBPM) {
  // Calculate average interval near locked tempo
  const expectedInterval = 60000 / currentBPM;
  const tolerance = expectedInterval * 0.1; // 10% tolerance

  const validIntervals = intervals.filter(interval =>
    Math.abs(interval - expectedInterval) < tolerance
  );

  if (validIntervals.length === 0) {
    return currentBPM; // Keep current if no valid intervals
  }

  const avgInterval = validIntervals.reduce((a, b) => a + b, 0) / validIntervals.length;
  const refinedBPM = 60000 / avgInterval;

  // Smooth adjustment (move slowly toward refined value)
  return currentBPM * 0.9 + refinedBPM * 0.1;
}
