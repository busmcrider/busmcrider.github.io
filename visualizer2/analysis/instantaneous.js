// Performs instantaneous analysis (every frame)
// Extracts FFT spectrum, amplitude, and basic spectral features
class InstantaneousAnalyzer {
  constructor(analyser) {
    this.analyser = analyser;
    this.bufferLength = analyser.frequencyBinCount;

    // Reusable buffers (avoid allocating every frame)
    this.dataArray = new Uint8Array(this.bufferLength);
    this.floatArray = new Float32Array(this.bufferLength);
  }

  // Main analysis function - called every frame
  analyze(currentTime) {
    // Get frequency data (0-255 range)
    this.analyser.getByteFrequencyData(this.dataArray);

    // Calculate amplitude (average of all frequencies, normalized to 0-1)
    let sum = 0;
    for (let i = 0; i < this.bufferLength; i++) {
      sum += this.dataArray[i];
    }
    const amplitude = sum / this.bufferLength / 255;

    // Calculate RMS (root mean square - more accurate volume)
    let squareSum = 0;
    for (let i = 0; i < this.bufferLength; i++) {
      const normalized = this.dataArray[i] / 255;
      squareSum += normalized * normalized;
    }
    const rms = Math.sqrt(squareSum / this.bufferLength);

    // Calculate spectral centroid (brightness - where is the "center" of the spectrum)
    let weightedSum = 0;
    let magnitudeSum = 0;
    for (let i = 0; i < this.bufferLength; i++) {
      const magnitude = this.dataArray[i] / 255;
      weightedSum += i * magnitude;
      magnitudeSum += magnitude;
    }
    const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;

    // Update global state
    MusicState.instantaneous.timestamp = currentTime;
    MusicState.instantaneous.spectrum = this.dataArray;
    MusicState.instantaneous.amplitude = amplitude;
    MusicState.instantaneous.rms = rms;
    MusicState.instantaneous.spectralCentroid = spectralCentroid;

    // Note: spectralFlux will be implemented later (requires previous frame comparison)
  }
}
