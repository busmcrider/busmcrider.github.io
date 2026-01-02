// Manages Web Audio API setup and audio file loading
export class AudioContextManager {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.audioElement = null;
    this.source = null;
    this.isPlaying = false;
  }

  // Initialize Web Audio API
  async init() {
    if (this.audioContext) return;

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();

    // Configure analyser
    this.analyser.fftSize = 2048;  // Higher = more frequency resolution
    this.analyser.smoothingTimeConstant = 0.8;  // 0-1, smooths changes

    console.log('[AudioContext] Initialized');
  }

  // Load audio file
  async loadFile(file) {
    await this.init();

    // Clean up previous audio
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }
    if (this.source) {
      this.source.disconnect();
    }

    // Create audio element from file
    this.audioElement = new Audio();
    this.audioElement.src = URL.createObjectURL(file);

    // Wait for metadata to load
    await new Promise((resolve) => {
      this.audioElement.addEventListener('loadedmetadata', resolve, { once: true });
    });

    // Connect audio graph: audio element → source → analyser → destination
    this.source = this.audioContext.createMediaElementSource(this.audioElement);
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    console.log('[AudioContext] File loaded:', file.name);
    console.log('[AudioContext] Duration:', this.audioElement.duration, 'seconds');

    return {
      duration: this.audioElement.duration,
      name: file.name
    };
  }

  // Playback controls
  play() {
    if (this.audioElement) {
      this.audioElement.play();
      this.isPlaying = true;
      console.log('[AudioContext] Playing');
    }
  }

  pause() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.isPlaying = false;
      console.log('[AudioContext] Paused');
    }
  }

  // Get current time
  getCurrentTime() {
    return this.audioElement ? this.audioElement.currentTime : 0;
  }

  // Get analyser for data extraction
  getAnalyser() {
    return this.analyser;
  }
}
