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
          // Initialize tempo structure if needed
          if (!MusicState.features.tempo) {
            MusicState.features.tempo = {
              fast: null,
              slow: null,
              current: null
            };
          }

          // Update slow (accurate) tempo from worker
          MusicState.features.tempo.slow = {
            bpm: data.bpm,
            confidence: data.confidence,
            stable: data.stable,
            source: 'autocorrelation',
            lastUpdated: data.timestamp
          };

          // Use slow tempo as current if it's reliable
          if (data.confidence > 0.7) {
            MusicState.features.tempo.current = {
              bpm: data.bpm,
              confidence: data.confidence,
              stable: data.stable
            };
          }

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
    if (this.worker) {
      // Get time-domain data for tempo analysis
      const analyser = this.audioManager.getAnalyser();
      const timeDomainData = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(timeDomainData);

      // Collect audio samples (time-domain, not frequency)
      this.workerAudioBuffer.push(...Array.from(timeDomainData));

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
      // Update FPS
      document.getElementById('fps').textContent = this.renderer ? this.renderer.getFPS() : 0;
      
      // Update amplitude
      const amp = MusicState.instantaneous.amplitude;
      document.getElementById('amp').textContent = amp.toFixed(2);
      
      // Update beat indicator and confidence
      const beat = MusicState.features.beat;
      if (beat) {
        const indicator = document.getElementById('beatIndicator');
        if (beat.detected) {
          indicator.classList.add('active');
        } else {
          indicator.classList.remove('active');
        }
        document.getElementById('beatConf').textContent = beat.confidence.toFixed(2);
      }
      
      // Update BPM display (show current tempo)
      const tempo = MusicState.features.tempo;
      if (tempo && tempo.current && tempo.current.bpm) {
        const bpmText = `${tempo.current.bpm.toFixed(1)} BPM`;
        document.getElementById('bpm').textContent = bpmText;
      } else {
        document.getElementById('bpm').textContent = '--';
      }
      
      // Update worker status
      const workerActive = this.worker !== null;
      document.getElementById('workerStatus').textContent = workerActive ? 'Active' : 'Inactive';
    }, 100); // Update 10 times per second
  }
}
