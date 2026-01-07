// core/workers/voice-worker.js
// Voice Activity Detection using multiple acoustic features
// Research: ITU-T G.729 Annex B, Moattar & Homayounpour (2010)

let config = {
  sampleRate: 44100,
  fftSize: 2048,
  confidenceThreshold: 0.7
};

self.onmessage = function(e) {
  const { type, data } = e.data;

  switch (type) {
    case 'init':
      config = { ...config, ...data };
      self.postMessage({ type: 'ready' });
      break;

    case 'analyze':
      const result = analyzeVoice(data.frequencyData, data.timeDomainData);
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

function analyzeVoice(frequencyData, timeDomainData) {
  // Calculate multiple acoustic features
  const features = {
    formantScore: calculateFormantScore(frequencyData),
    hnr: calculateHNR(frequencyData),
    spectralFlatness: calculateSpectralFlatness(frequencyData),
    zcr: calculateZCR(timeDomainData),
    energyRatio: calculateVocalEnergyRatio(frequencyData)
  };

  // Combined weighted score
  const score = (
    features.formantScore * 0.30 +
    features.hnr * 0.25 +
    (1 - features.spectralFlatness) * 0.20 +  // Low flatness = voice
    features.energyRatio * 0.15 +
    features.zcr * 0.10
  );

  const voicePresent = score > config.confidenceThreshold;
  const confidence = Math.min(1, score / config.confidenceThreshold);

  return {
    voicePresent: voicePresent,
    confidence: confidence,
    strength: score,
    features: features
  };
}

function calculateFormantScore(frequencyData) {
  // Voice has characteristic formants (resonances)
  // F1: 300-1000Hz, F2: 800-3000Hz for speech
  const frequencyResolution = config.sampleRate / config.fftSize;

  // First formant region (300-1000Hz)
  const f1MinBin = Math.floor(300 / frequencyResolution);
  const f1MaxBin = Math.floor(1000 / frequencyResolution);

  // Second formant region (800-3000Hz)
  const f2MinBin = Math.floor(800 / frequencyResolution);
  const f2MaxBin = Math.floor(3000 / frequencyResolution);

  // Find peaks in formant regions
  let f1Peak = 0;
  for (let i = f1MinBin; i < Math.min(f1MaxBin, frequencyData.length); i++) {
    f1Peak = Math.max(f1Peak, frequencyData[i]);
  }

  let f2Peak = 0;
  for (let i = f2MinBin; i < Math.min(f2MaxBin, frequencyData.length); i++) {
    f2Peak = Math.max(f2Peak, frequencyData[i]);
  }

  // Voice has strong peaks in both regions
  const f1Normalized = f1Peak / 255;
  const f2Normalized = f2Peak / 255;

  // Both formants should be present
  return Math.min(f1Normalized, f2Normalized) * Math.sqrt(f1Normalized * f2Normalized);
}

function calculateHNR(frequencyData) {
  // Harmonics-to-Noise Ratio
  // Voice has strong harmonic structure (regular peaks)

  const peaks = findPeaks(frequencyData);

  if (peaks.length < 2) {
    return 0;
  }

  // Calculate harmonic energy (sum of peaks)
  let harmonicEnergy = 0;
  for (const peak of peaks) {
    harmonicEnergy += peak.magnitude;
  }

  // Calculate total energy
  let totalEnergy = 0;
  for (let i = 0; i < frequencyData.length; i++) {
    totalEnergy += frequencyData[i];
  }

  if (totalEnergy === 0) return 0;

  // HNR ratio
  const hnr = harmonicEnergy / totalEnergy;

  // Also check if harmonics are regularly spaced
  if (peaks.length >= 3) {
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i].bin - peaks[i - 1].bin);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const regularity = 1 - Math.min(1, stdDev / avgInterval);

    // Boost HNR if harmonics are regular
    return hnr * (0.7 + regularity * 0.3);
  }

  return hnr;
}

function calculateSpectralFlatness(frequencyData) {
  // Spectral flatness: geometric mean / arithmetic mean
  // Flat spectrum = noise (high flatness)
  // Peaked spectrum = tonal/voice (low flatness)

  let geometricSum = 0;
  let arithmeticSum = 0;
  let count = 0;

  // Only analyze vocal range (100-4000Hz)
  const minBin = Math.floor(100 / (config.sampleRate / config.fftSize));
  const maxBin = Math.floor(4000 / (config.sampleRate / config.fftSize));

  for (let i = minBin; i < Math.min(maxBin, frequencyData.length); i++) {
    const magnitude = frequencyData[i] + 1; // +1 to avoid log(0)
    geometricSum += Math.log(magnitude);
    arithmeticSum += magnitude;
    count++;
  }

  if (count === 0 || arithmeticSum === 0) return 1;

  const geometricMean = Math.exp(geometricSum / count);
  const arithmeticMean = arithmeticSum / count;

  const flatness = geometricMean / arithmeticMean;

  return flatness; // Low = voice, High = noise
}

function calculateZCR(timeDomainData) {
  // Zero-crossing rate
  // Voice has moderate ZCR (not too high like noise, not too low like pure tone)

  let crossings = 0;
  for (let i = 1; i < timeDomainData.length; i++) {
    const prev = timeDomainData[i - 1] - 128;
    const curr = timeDomainData[i] - 128;

    if ((prev >= 0 && curr < 0) || (prev < 0 && curr >= 0)) {
      crossings++;
    }
  }

  const zcr = crossings / timeDomainData.length;

  // Voice typically has ZCR between 0.1 and 0.3
  // Map to 0-1 score with peak at 0.2
  const optimal = 0.2;
  const deviation = Math.abs(zcr - optimal);
  const score = Math.max(0, 1 - (deviation / optimal));

  return score;
}

function calculateVocalEnergyRatio(frequencyData) {
  // Energy in vocal range vs total
  const frequencyResolution = config.sampleRate / config.fftSize;

  const vocalMinBin = Math.floor(300 / frequencyResolution);
  const vocalMaxBin = Math.floor(3000 / frequencyResolution);

  let vocalEnergy = 0;
  let totalEnergy = 0;

  for (let i = 0; i < frequencyData.length; i++) {
    const energy = frequencyData[i];
    totalEnergy += energy;

    if (i >= vocalMinBin && i < Math.min(vocalMaxBin, frequencyData.length)) {
      vocalEnergy += energy;
    }
  }

  return totalEnergy === 0 ? 0 : vocalEnergy / totalEnergy;
}

function findPeaks(data) {
  const peaks = [];
  const minPeakHeight = 60;
  const minProminence = 15;

  for (let i = 2; i < data.length - 2; i++) {
    const current = data[i];

    if (current > minPeakHeight &&
        current > data[i - 1] + minProminence &&
        current > data[i - 2] + minProminence &&
        current > data[i + 1] + minProminence &&
        current > data[i + 2] + minProminence) {
      peaks.push({
        bin: i,
        magnitude: current
      });
    }
  }

  return peaks;
}
