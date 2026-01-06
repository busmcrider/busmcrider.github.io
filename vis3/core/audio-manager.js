// core/audio-manager.js
// Manages Web Audio API and audio file loading

export class AudioManager {
  constructor(config) {
    this.config = config;
    this.audioContext = null;
    this.analyser = null;
    this.audioElement = null;
    this.sourceNode = null;
    this.isPlaying = false;
  }

  async loadFile(file) {
    try {
      // Clean up existing audio
      this.cleanup();

      // Create audio element from file
      const url = URL.createObjectURL(file);
      this.audioElement = new Audio(url);

      // Initialize Web Audio API
      await this.init();

      // Return metadata
      return {
        name: file.name,
        size: file.size,
        type: file.type,
        duration: null // Will be available after loadedmetadata event
      };
    } catch (error) {
      throw new Error(`Failed to load audio file: ${error.message}`);
    }
  }

  async init() {
    // Create audio context
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Create analyser node
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = this.config.get('audio.fftSize');
    this.analyser.smoothingTimeConstant = this.config.get('audio.smoothingTimeConstant');

    // Create source from audio element
    this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);

    // Connect: source -> analyser -> destination
    this.sourceNode.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  getAnalyser() {
    return this.analyser;
  }

  play() {
    if (this.audioElement && !this.isPlaying) {
      this.audioElement.play();
      this.isPlaying = true;

      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
    }
  }

  pause() {
    if (this.audioElement && this.isPlaying) {
      this.audioElement.pause();
      this.isPlaying = false;
    }
  }

  getCurrentTime() {
    return this.audioElement ? this.audioElement.currentTime : 0;
  }

  getDuration() {
    return this.audioElement ? this.audioElement.duration : 0;
  }

  cleanup() {
      // Stop and cleanup existing audio
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement.src = '';
        this.audioElement = null;
      }

      // Disconnect source node
      if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }

      this.isPlaying = false;
    }

  isAudioPlaying() {
    return this.isPlaying;
  }
}
