// Main controller - wires everything together
class TestController {
  constructor() {
    this.audioManager = new AudioContextManager();
    this.analyzer = null;
    this.renderer = null;
    this.config = new ConfigManager();
    this.beatDetector = null;
    this.mappingEngine = null;

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

      // Setup beat detector
      this.beatDetector = new BeatDetector(this.config);

      // Setup mapping engine
      this.mappingEngine = new MappingEngine(this.config);

      // Setup global animations
      const canvas = document.getElementById('canvas');
      const globalAnimations = new GlobalAnimations(canvas, this.renderer.ctx);
      this.renderer.setGlobalAnimations(globalAnimations);

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

    const currentTime = this.audioManager.getCurrentTime();

    // Run analysis
    if (this.analyzer) {
      this.analyzer.analyze(currentTime);
    }

    // Run beat detection
    if (this.beatDetector) {
      this.beatDetector.detect(currentTime);
    }

    // Process mappings
    if (this.mappingEngine) {
      const commands = this.mappingEngine.process();

      // Execute visual commands
      for (const command of commands) {
        if (command.type === 'globalAnimation') {
          this.renderer.globalAnimations.trigger(command);
        } else if (command.type === 'setGlobalScale') {
          this.renderer.globalAnimations.setGlobalScale(command.value);
        }
      }

      this.mappingEngine.clearCommands();
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
