// Lifecycle manager - handles BPM-aware timing for animations and transitions
import { MusicState } from './music-state.js';

export class LifecycleManager {
  constructor(config) {
    this.config = config;
  }

  // Get duration in milliseconds, using BPM if available
  getDuration(beats, fallbackMs) {
    const tempo = MusicState.features.tempo;

    // If we have reliable BPM, use it
    if (tempo && tempo.bpm && tempo.confidence > 0.7) {
      const msPerBeat = 60000 / tempo.bpm;
      return beats * msPerBeat;
    }

    // Otherwise use fallback
    return fallbackMs;
  }

  // Get beat-synced animation duration
  getAnimationDuration(type) {
    const lifecycleConfig = this.config.get('lifecycle');

    if (!lifecycleConfig.useBPMTiming) {
      return lifecycleConfig.fallbackDurations[type];
    }

    // Map animation types to beat counts
    const beatMapping = {
      fadeIn: 2,
      fadeOut: 4,
      hold: 8,
      beatPump: 0.25, // Quarter beat
      beatFlash: 0.125 // Eighth beat
    };

    const beats = beatMapping[type] || 1;
    const fallback = lifecycleConfig.fallbackDurations[type] || 1000;

    return this.getDuration(beats, fallback);
  }

  // Calculate key transition timing
  getKeyTransitionTiming() {
    const lifecycleConfig = this.config.get('lifecycle');
    const keyConfig = lifecycleConfig.keyTransition;

    return {
      oldKeyFadeOut: this.getDuration(keyConfig.oldKeyFadeBeats, 2000),
      overlap: this.getDuration(keyConfig.overlapBeats, 1000),
      newKeyFadeIn: this.getDuration(keyConfig.newKeyFadeBeats, 2000)
    };
  }
}
