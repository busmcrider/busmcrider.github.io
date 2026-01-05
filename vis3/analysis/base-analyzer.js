// analysis/base-analyzer.js
// Abstract base class for all analyzers

export class BaseAnalyzer {
  constructor(analyser, config) {
    this.analyser = analyser;
    this.config = config;
  }

  analyze(currentTime) {
    throw new Error('analyze() must be implemented by subclass');
  }

  // Helper method to get frequency data
  getFrequencyData() {
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  // Helper method to get time domain data
  getTimeDomainData() {
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }
}
