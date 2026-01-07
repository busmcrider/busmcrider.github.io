// analysis/voice-detector.js
// Voice detection using multi-feature analysis (offloaded to worker)

import { BaseAnalyzer } from './base-analyzer.js';

export class VoiceDetector extends BaseAnalyzer {
  constructor(analyser, config) {
    super(analyser, config);

    // State
    this.bufferLength = this.analyser.frequencyBinCount;
    this.frequencyData = new Uint8Array(this.bufferLength);
    this.timeDomainData = new Uint8Array(this.bufferLength);
    this.sampleRate = analyser.context.sampleRate;

    // Cached result from worker
    this.cachedResult = {
      voicePresent: false,
      confidence: 0,
      strength: 0
    };

    // Throttle worker calls (every 2 frames)
    this.frameCount = 0;
    this.analysisInterval = 2;

    // Temporal smoothing
    this.detectionHistory = [];
    this.historySize = 10;

    // Worker will be set externally
    this.worker = null;
    this.workerReady = false;

    console.log('[VOICE] Initialized - Multi-feature worker-based detection');
  }

  setWorker(worker) {
    this.worker = worker;
    this.worker.onmessage = (e) => {
      if (e.data.type === 'result') {
        // Add to history for smoothing
        this.detectionHistory.push(e.data.strength);
        if (this.detectionHistory.length > this.historySize) {
          this.detectionHistory.shift();
        }

        // Smooth over history
        const smoothedStrength = this.detectionHistory.reduce((a, b) => a + b, 0) / this.detectionHistory.length;
        const threshold = this.config.get('analysis.voice.confidenceThreshold');
        const voicePresent = smoothedStrength > threshold;
        const confidence = voicePresent ? Math.min(1, smoothedStrength / threshold) : 0;

        this.cachedResult = {
          voicePresent: voicePresent,
          confidence: confidence,
          strength: smoothedStrength,
          features: e.data.features
        };

        // Log voice detections
        if (voicePresent && confidence > 0.8) {
          console.log(`[VOICE] Detected | Strength: ${smoothedStrength.toFixed(2)} | Confidence: ${confidence.toFixed(2)} | Features:`, e.data.features);
        }
      } else if (e.data.type === 'ready') {
        this.workerReady = true;
      }
    };

    // Initialize worker with config
    this.worker.postMessage({
      type: 'init',
      data: {
        sampleRate: this.sampleRate,
        fftSize: this.analyser.fftSize,
        confidenceThreshold: this.config.get('analysis.voice.confidenceThreshold')
      }
    });
  }

  analyze(currentTime) {
    // Throttle analysis
    this.frameCount++;
    if (this.frameCount % this.analysisInterval !== 0) {
      return {
        timestamp: currentTime,
        ...this.cachedResult
      };
    }

    if (!this.worker || !this.workerReady) {
      return {
        timestamp: currentTime,
        voicePresent: false,
        confidence: 0,
        strength: 0
      };
    }

    // Get both frequency and time domain data
    this.analyser.getByteFrequencyData(this.frequencyData);
    this.analyser.getByteTimeDomainData(this.timeDomainData);

    // Clone data for worker transfer
    const freqData = new Uint8Array(this.frequencyData);
    const timeData = new Uint8Array(this.timeDomainData);

    // Send to worker
    this.worker.postMessage({
      type: 'analyze',
      data: {
        frequencyData: freqData,
        timeDomainData: timeData
      }
    }, [freqData.buffer, timeData.buffer]);

    // Return cached result
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
          confidenceThreshold: this.config.get('analysis.voice.confidenceThreshold')
        }
      });
    }
  }

  reset() {
    this.detectionHistory = [];
    this.cachedResult = {
      voicePresent: false,
      confidence: 0,
      strength: 0
    };
  }
}
