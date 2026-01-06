// analysis/pitch-detector.js
// Pitch detection via autocorrelation (offloaded to worker)

import { BaseAnalyzer } from './base-analyzer.js';

export class PitchDetector extends BaseAnalyzer {
  constructor(analyser, config) {
    super(analyser, config);

    // Get sample rate from audio context
    this.sampleRate = analyser.context.sampleRate;

    // State
    this.bufferLength = this.analyser.fftSize;
    this.dataArray = new Uint8Array(this.bufferLength);

    // Cached result from worker
    this.cachedResult = {
      frequency: 0,
      note: null,
      confidence: 0
    };

    // Throttle worker calls (every 3 frames = ~20 times per second)
    this.frameCount = 0;
    this.analysisInterval = 3;

    // Worker will be set externally
    this.worker = null;
    this.workerReady = false;
  }

  setWorker(worker) {
    this.worker = worker;
    this.worker.onmessage = (e) => {
      if (e.data.type === 'result') {
        this.cachedResult = {
          frequency: e.data.frequency,
          note: e.data.note,
          confidence: e.data.confidence
        };

        // Log significant pitch detections
        if (e.data.note && e.data.confidence > 0.5) {
          console.log(`[PITCH] Detected: ${e.data.note} (${Math.round(e.data.frequency)}Hz) | Confidence: ${e.data.confidence.toFixed(2)}`);
        }
      } else if (e.data.type === 'ready') {
        this.workerReady = true;
      }
    };

    // Initialize worker with config
    this.worker.postMessage({
      type: 'init',
      data: {
        minFrequency: this.config.get('analysis.pitch.minFrequency'),
        maxFrequency: this.config.get('analysis.pitch.maxFrequency'),
        sampleRate: this.sampleRate
      }
    });
  }

  analyze(currentTime) {
    // Throttle analysis to reduce CPU load
    this.frameCount++;
    if (this.frameCount % this.analysisInterval !== 0) {
      // Return cached result
      return {
        timestamp: currentTime,
        ...this.cachedResult
      };
    }

    if (!this.worker || !this.workerReady) {
      return {
        timestamp: currentTime,
        frequency: 0,
        note: null,
        confidence: 0
      };
    }

    // Get time domain data
    this.analyser.getByteTimeDomainData(this.dataArray);

    // Convert to normalized float values (-1 to 1)
    const buffer = new Float32Array(this.bufferLength);
    for (let i = 0; i < this.bufferLength; i++) {
      buffer[i] = (this.dataArray[i] - 128) / 128;
    }

    // Send to worker (no need to wait for response, use cached result)
    this.worker.postMessage({
      type: 'analyze',
      data: {
        buffer: buffer,
        sampleRate: this.sampleRate
      }
    }, [buffer.buffer]); // Transfer buffer for performance

    // Return current cached result
    return {
      timestamp: currentTime,
      ...this.cachedResult
    };
  }

  updateConfig() {
    if (this.worker && this.workerReady) {
      this.worker.postMessage({
        type: 'updateConfig',
        data: {
          minFrequency: this.config.get('analysis.pitch.minFrequency'),
          maxFrequency: this.config.get('analysis.pitch.maxFrequency')
        }
      });
    }
  }
}
