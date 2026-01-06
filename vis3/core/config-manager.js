// core/config-manager.js
// Manages configuration object with dot-notation path access

export class ConfigManager {
  constructor() {
    this.config = {
      audio: {
        fftSize: 2048,
        smoothingTimeConstant: 0.8
      },
      analysis: {
        instantaneous: {
          enabled: true
        },
        beat: {
          enabled: true,
          sensitivity: 1.5,  // Higher = more sensitive (research: 1.5-2.0 typical)
          minTimeBetweenBeats: 200  // Faster for uptempo music (300ms = max 200 BPM)
        },
        pitch: {
          enabled: true,
          minFrequency: 80,     // Low male voice fundamental
          maxFrequency: 2000    // Covers most musical instruments (was 1000, too narrow)
        },
        tempo: {
          enabled: true,
          minBPM: 60,
          maxBPM: 200  // Increased from 180 to cover faster genres
        },
        key: {
          enabled: true,
          confidenceThreshold: 0.5  // Lowered from 0.7 (more lenient)
        },
        voice: {
          enabled: true,
          confidenceThreshold: 0.7  // Increased from 0.6 (more strict)
        }
      },
      visual: {
        backgroundColor: '#000000',
        targetFPS: 60
      },
      visualizers: {
        spectrumBars: {
          enabled: true,
          numBars: 128,
          colorScheme: 'rainbow'
        }
      }
    };
  }

  get(path) {
    const keys = path.split('.');
    return keys.reduce((obj, key) => {
      return obj && obj[key] !== undefined ? obj[key] : undefined;
    }, this.config);
  }

  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();

    // Traverse and create intermediate objects if needed
    const target = keys.reduce((obj, key) => {
      if (!obj[key] || typeof obj[key] !== 'object') {
        obj[key] = {};
      }
      return obj[key];
    }, this.config);

    // Set the value
    target[lastKey] = value;
  }

  export() {
    return JSON.stringify(this.config, null, 2);
  }

  import(json) {
    try {
      const parsed = JSON.parse(json);
      this.config = parsed;
      return true;
    } catch (error) {
      console.error('Failed to import config:', error);
      return false;
    }
  }

  getAll() {
    return this.config;
  }
}
