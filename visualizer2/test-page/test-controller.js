// Main controller - wires everything together
import { AudioContextManager } from '../core/audio-context.js';
import { ConfigManager } from '../core/config-manager.js';
import { MusicState } from '../core/music-state.js';
import { InstantaneousAnalyzer } from '../analysis/instantaneous.js';
import { BeatDetector } from '../analysis/beat-detection.js';
import { MappingEngine } from '../mapping/mapping-engine.js';
import { CanvasRenderer } from '../visual/canvas-renderer.js';
import { GlobalAnimations } from '../visual/global-animations.js';
import { SpectrumBars } from '../visual/visualizers/spectrum-bars.js';
import { LifecycleManager } from '../core/lifecycle-manager.js';

export class TestController {
  constructor() {
    this.audioManager = new AudioContextManager();
    this.analyzer = null;
    this.renderer = null;
    this.config = new ConfigManager();
    this.beatDetector = null;
    this.mappingEngine = null;
    this.lifecycleManager = null;
    this.worker = null;
    this.workerAudioBuffer = [];

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

  setupWorker() {
      // Create worker
      this.worker = new Worker('./core/analysis-worker.js', { type: 'module' });

      // Handle messages from worker
      this.worker.onmessage = (e) => {
        const { type, data } = e.data;

        if (type === 'tempoUpdate') {
          // Update state with tempo data
          MusicState.features.tempo = {
            bpm: data.bpm,
            confidence: data.confidence,
            stable: data.stable,
            lastUpdated: data.timestamp
          };

          console.log(`[Controller] Tempo updated: ${data.bpm.toFixed(1)} BPM`);
        }
      };

      // Initialize worker with config
      this.worker.postMessage({
        type: 'init',
        data: { config: this.config.config }
      });

      console.log('[Controller] Worker initialized');
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

      // Setup worker if not already done
      if (!this.worker) {
        this.setupWorker();
      }

      // Reset worker audio buffer
      this.workerAudioBuffer = [];

      // Setup beat detector
      this.beatDetector = new BeatDetector(this.config);

      // Setup mapping engine
      this.mappingEngine = new MappingEngine(this.config, this.lifecycleManager);

      // Setup lifecycle manager
      this.lifecycleManager = new LifecycleManager(this.config);

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

    // Send audio data to worker for tempo analysis
    if (this.worker && MusicState.instantaneous.spectrum) {
      // Collect audio samples
      this.workerAudioBuffer.push(...Array.from(MusicState.instantaneous.spectrum));

      // Send to worker every 100ms worth of samples (~4-5 frames)
      if (this.workerAudioBuffer.length >= 500) {
        this.worker.postMessage({
          type: 'analyzeAudio',
          data: {
            audioData: this.workerAudioBuffer,
            sampleRate: 44100, // Approximate
            currentTime: currentTime
          }
        });
        this.workerAudioBuffer = [];
      }
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

      const beatConf = MusicState.features.beat ? MusicState.features.beat.confidence : 0;
      document.getElementById('beatConf').textContent = beatConf.toFixed(2);

      // Update BPM display
      const tempo = MusicState.features.tempo;
      if (tempo && tempo.bpm) {
        const bpmText = `${tempo.bpm.toFixed(1)} (${(tempo.confidence * 100).toFixed(0)}%)`;
        document.getElementById('bpm').textContent = bpmText;
      }

    }, 100); // Update 10 times per second
  }
}
