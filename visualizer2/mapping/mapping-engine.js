// Mapping engine - translates musical features to visual commands
import { MusicState } from '../core/music-state.js';

export class MappingEngine {
  constructor(config) {
    this.config = config;

    // Visual commands to be executed this frame
    this.commands = [];

    // Smoothed values for continuous mappings
    this.smoothedValues = {
      scale: 1.0
    };
  }

  // Process all mappings and generate visual commands
  process() {
    this.commands = [];

    // Process beat mapping
    this.processBeatMapping();

    // Process amplitude mapping
    this.processAmplitudeMapping();

    return this.commands;
  }

  // Map beat detection to animations
  processBeatMapping() {
    const beatMapping = this.config.get('mappings.beat');
    if (!beatMapping.enabled) return;

    const beat = MusicState.features.beat;
    if (!beat || !beat.detected) return;

    // Trigger each configured animation
    for (const anim of beatMapping.animations) {
      this.commands.push({
        type: 'globalAnimation',
        animation: anim.type,
        intensity: anim.intensity * beat.strength,
        duration: anim.duration,
        easing: anim.easing,
        targetProperty: anim.targetProperty
      });
    }
  }

  // Map amplitude to scale
  processAmplitudeMapping() {
    const ampMapping = this.config.get('mappings.amplitude');
    if (!ampMapping.enabled) return;

    const amplitude = MusicState.instantaneous.amplitude;

    // Map amplitude to target range
    const targetScale = ampMapping.min + amplitude * (ampMapping.max - ampMapping.min);

    // Smooth the value
    const smoothing = ampMapping.smoothing;
    this.smoothedValues.scale += (targetScale - this.smoothedValues.scale) * (1 - smoothing);

    // Create command
    this.commands.push({
      type: 'setGlobalScale',
      value: this.smoothedValues.scale
    });
  }

  // Get all commands for this frame
  getCommands() {
    return this.commands;
  }

  // Clear commands (called after processing)
  clearCommands() {
    this.commands = [];
  }
}
