// Main controller - wires everything together
class TestController {
  constructor() {
    this.audioManager = new AudioContextManager();
    this.analyzer = null;
    this.renderer = null;

    this.setupUI();
    this.setupCanvas();
    this.startDebugLoop();
  }

  setupUI() {
    // File input
    document.getElementById('loadBtn').addEventListener('click', () => {
      document.getElementById('fileInput').click();
    });

    document.getElementById('fileInput').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        await this.loadAudio(file);
      }
    });

    // Playback controls
    document.getElementById('playBtn').addEventListener('click', () => {
      this.audioManager.play();
      this.startVisualization();
    });

    document.getElementById('pauseBtn').addEventListener('click', () => {
      this.audioManager.pause();
    });
  }

  setupCanvas() {
    const canvas = document.getElementById('canvas');
    this.renderer = new CanvasRenderer(canvas);
  }

  async loadAudio(file) {
    try {
      document.getElementById('status').textContent = 'Loading...';

      // Load file
      const info = await this.audioManager.loadFile(file);

      // Reset state
      MusicState.reset();
      MusicState.meta.totalDuration = info.duration * 1000; // Convert to ms

      // Setup analyzer
      const analyser = this.audioManager.getAnalyser();
      this.analyzer = new InstantaneousAnalyzer(analyser);

      // Setup visualizers
      this.renderer.clearVisualizers();
      const spectrumBars = new SpectrumBars(
        document.getElementById('canvas'),
        this.renderer.ctx
      );
      this.renderer.addVisualizer(spectrumBars);

      // Enable controls
      document.getElementById('playBtn').disabled = false;
      document.getElementById('pauseBtn').disabled = false;
      document.getElementById('status').textContent = `Loaded: ${info.name}`;

      console.log('[Controller] Audio loaded successfully');
    } catch (error) {
      console.error('[Controller] Error loading audio:', error);
      document.getElementById('status').textContent = 'Error loading file';
    }
  }

  startVisualization() {
    // Start renderer
    this.renderer.start();

    // Start analysis loop
    this.analysisLoop();
  }

  analysisLoop() {
    if (!this.audioManager.isPlaying) return;

    // Get current time
    const currentTime = this.audioManager.getCurrentTime();

    // Run analysis
    if (this.analyzer) {
      this.analyzer.analyze(currentTime);
    }

    // Continue loop
    requestAnimationFrame(() => this.analysisLoop());
  }

  startDebugLoop() {
    setInterval(() => {
      // Update debug panel
      document.getElementById('fps').textContent = this.renderer ? this.renderer.getFPS() : 0;

      const amp = MusicState.instantaneous.amplitude;
      document.getElementById('amp').textContent = amp.toFixed(2);

      const bins = MusicState.instantaneous.spectrum ? MusicState.instantaneous.spectrum.length : 0;
      document.getElementById('bins').textContent = bins;
    }, 100); // Update 10 times per second
  }
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
  console.log('=== Music Visualizer - Stage 0 ===');
  console.log('Initializing...');
  const controller = new TestController();
  console.log('Ready! Load an audio file to begin.');
});
