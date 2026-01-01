// Configuration manager - holds all settings with defaults
class ConfigManager {
  constructor() {
    this.config = this.getDefaults();
  }

  // Default configuration
  getDefaults() {
    return {
      // ===== VISUAL VOCABULARY =====
      visual: {
        color: {
          saturation: 0.75,
          brightness: 0.80,
          scheme: 'harmonic'  // 'harmonic', 'monochrome', 'complementary'
        },
        symmetry: {
          type: 'radial',     // 'radial', 'bilateral', 'none'
          order: 8
        },
        depth: {
          enabled: false,      // Not implemented yet
          layers: 3,
          spacing: 100,
          perspective: 0.6
        }
      },

      // ===== ANALYSIS SETTINGS =====
      analysis: {
        fftSize: 2048,
        smoothingTimeConstant: 0.8,

        beat: {
          enabled: true,
          sensitivity: 0.7,           // 0-1, higher = more sensitive
          minTimeBetweenBeats: 300,   // ms, prevents double-triggers
          energyThreshold: 1.3,       // multiplier above average
          historySize: 43             // ~1 second at 43 fps
        }
      },

      // ===== FEATURE → VISUAL MAPPINGS =====
      mappings: {
        beat: {
          enabled: true,
          animations: [
            {
              type: 'radialPump',
              intensity: 1.0,
              duration: 200,      // ms (will be BPM-based in Stage 2)
              easing: 'easeOutCubic'
            },
            {
              type: 'colorFlash',
              intensity: 0.3,
              duration: 100,
              targetProperty: 'brightness'
            }
          ]
        },

        amplitude: {
          enabled: true,
          target: 'scale',
          min: 0.8,
          max: 1.4,
          smoothing: 0.3
        }
      },

      // ===== PERFORMANCE =====
      performance: {
        targetFPS: 60,
        adaptiveQuality: false  // Not implemented yet
      }
    };
  }

  // Get config value by path (e.g., 'analysis.beat.sensitivity')
  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.config);
  }

  // Set config value by path
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => obj[key], this.config);
    target[lastKey] = value;
    console.log(`[Config] Set ${path} = ${value}`);
  }

  // Update multiple values at once
  update(updates) {
    for (const [path, value] of Object.entries(updates)) {
      this.set(path, value);
    }
  }

  // Export config as JSON
  export() {
    return JSON.stringify(this.config, null, 2);
  }

  // Import config from JSON
  import(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      this.config = { ...this.getDefaults(), ...imported };
      console.log('[Config] Configuration imported');
      return true;
    } catch (error) {
      console.error('[Config] Import failed:', error);
      return false;
    }
  }

  // Reset to defaults
  reset() {
    this.config = this.getDefaults();
    console.log('[Config] Reset to defaults');
  }
}
