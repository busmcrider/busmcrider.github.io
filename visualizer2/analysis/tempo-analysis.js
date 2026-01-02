// Tempo analysis using autocorrelation
// Detects BPM by finding periodic patterns in the audio energy

export class TempoAnalyzer {
  constructor(config) {
    this.config = config;

    // Audio buffer for analysis
    this.audioBuffer = [];
    this.maxBufferSize = 8000; // ~8 seconds at typical sample rates

    // Beat interval history for BPM calculation
    this.beatIntervals = [];
    this.maxIntervals = 10;

    // State
    this.bpm = null;
    this.confidence = 0;
    this.lastAnalysisTime = 0;
    this.analysisInterval = 2000; // Analyze every 2 seconds
  }

  // Analyze audio data for tempo
  analyze(audioData, sampleRate, currentTime) {
    // Only analyze periodically (every 2 seconds)
    if (currentTime - this.lastAnalysisTime < this.analysisInterval / 1000) {
      return null;
    }

    this.lastAnalysisTime = currentTime;

    // Add new audio data to buffer
    this.audioBuffer.push(...audioData);

    // Trim buffer if too large
    if (this.audioBuffer.length > this.maxBufferSize) {
      this.audioBuffer = this.audioBuffer.slice(-this.maxBufferSize);
    }

    // Need at least 2 seconds of audio
    if (this.audioBuffer.length < 2000) {
      return null;
    }

    // Calculate energy envelope (simplified onset strength)
    const envelope = this.calculateEnergyEnvelope(this.audioBuffer);

    // Find tempo using autocorrelation
    const tempoResult = this.detectTempo(envelope, sampleRate);

    if (tempoResult) {
      this.bpm = tempoResult.bpm;
      this.confidence = tempoResult.confidence;

      console.log(`[Tempo] Detected: ${this.bpm.toFixed(1)} BPM (confidence: ${this.confidence.toFixed(2)})`);

      return {
        bpm: this.bpm,
        confidence: this.confidence,
        stable: this.confidence > 0.7,
        timestamp: currentTime
      };
    }

    return null;
  }

  // Calculate energy envelope from audio samples
  calculateEnergyEnvelope(samples) {
    const windowSize = 512;
    const hopSize = 256;
    const envelope = [];

    for (let i = 0; i < samples.length - windowSize; i += hopSize) {
      let energy = 0;
      for (let j = 0; j < windowSize; j++) {
        const sample = samples[i + j] / 255; // Normalize to 0-1
        energy += sample * sample;
      }
      envelope.push(Math.sqrt(energy / windowSize));
    }

    return envelope;
  }

  // Detect tempo using autocorrelation
  detectTempo(envelope, sampleRate) {
    const minBPM = 60;
    const maxBPM = 180;

    // Convert BPM range to lag range (in samples)
    const hopSize = 256;
    const effectiveSampleRate = sampleRate / hopSize;
    const minLag = Math.floor((60 / maxBPM) * effectiveSampleRate);
    const maxLag = Math.floor((60 / minBPM) * effectiveSampleRate);

    // Compute autocorrelation
    const autocorr = [];
    for (let lag = minLag; lag < maxLag && lag < envelope.length / 2; lag++) {
      let sum = 0;
      let count = 0;

      for (let i = 0; i < envelope.length - lag; i++) {
        sum += envelope[i] * envelope[i + lag];
        count++;
      }

      autocorr.push(sum / count);
    }

    // Find peak in autocorrelation (strongest periodic pattern)
    let maxCorr = -Infinity;
    let maxLag = 0;

    for (let i = 0; i < autocorr.length; i++) {
      if (autocorr[i] > maxCorr) {
        maxCorr = autocorr[i];
        maxLag = i + minLag;
      }
    }

    // Convert lag to BPM
    const periodInSeconds = maxLag / effectiveSampleRate;
    const bpm = 60 / periodInSeconds;

    // Calculate confidence (peak strength relative to average)
    const avgCorr = autocorr.reduce((a, b) => a + b, 0) / autocorr.length;
    const confidence = Math.min((maxCorr / avgCorr - 1) / 2, 1.0);

    // Only return if confidence is reasonable
    if (confidence > 0.3) {
      return { bpm, confidence };
    }

    return null;
  }

  updateConfig(config) {
    this.config = config;
  }
}
