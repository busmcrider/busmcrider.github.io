// main.js
// Test page entry point - orchestrates Phase 1

import { AudioManager } from './core/audio-manager.js';
import { ConfigManager } from './core/config-manager.js';
import { AnalysisCoordinator } from './core/analysis-coordinator.js';
import { DataBridge } from './core/data-bridge.js';
import { VisualizerCore } from './core/visualizer-core.js';
import { InstantaneousAnalyzer } from './analysis/instantaneous.js';
import { SpectrumBarsVisualizer } from './visual/visualizers/spectrum-bars.js';
import { handleError } from './utils/error-handler.js';

class MusicVisualizerApp {
  constructor() {
    // Core managers
    this.config = new ConfigManager();
    this.audioManager = new AudioManager(this.config);
    this.analysisCoordinator = null;
    this.dataBridge = new DataBridge();
    this.visualizerCore = null;

    // UI elements
    this.elements = {
      fileInput: document.getElementById('fileInput'),
      loadBtn: document.getElementById('loadBtn'),
      playBtn: document.getElementById('playBtn'),
      pauseBtn: document.getElementById('pauseBtn'),
      fileName: document.getElementById('fileName'),
      canvas: document.getElementById('visualizerCanvas'),
      fpsValue: document.getElementById('fpsValue')
    };

    // State
    this.isInitialized = false;
    this.animationLoopId = null;

    this.init();
  }

  init() {
    // Wire up UI controls
    this.elements.loadBtn.addEventListener('click', () => {
      this.elements.fileInput.click();
    });

    this.elements.fileInput.addEventListener('change', (e) => {
      this.handleFileLoad(e);
    });

    this.elements.playBtn.addEventListener('click', () => {
      this.play();
    });

    this.elements.pauseBtn.addEventListener('click', () => {
      this.pause();
    });

    // Initialize visualizer core
    this.visualizerCore = new VisualizerCore(this.elements.canvas, this.config);
  }

  async handleFileLoad(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // Load audio file
      const metadata = await this.audioManager.loadFile(file);
      this.elements.fileName.textContent = metadata.name;

      // Initialize analysis system
      if (!this.isInitialized) {
        this.setupAnalysisSystem();
        this.isInitialized = true;
      }

      // Enable playback controls
      this.elements.playBtn.disabled = false;
      this.elements.pauseBtn.disabled = false;

      console.log('Audio loaded:', metadata);
    } catch (error) {
      handleError(error, 'File Load');
      alert('Failed to load audio file. Please try another file.');
    }
  }

  setupAnalysisSystem() {
    const analyser = this.audioManager.getAnalyser();

    // Create analysis coordinator
    this.analysisCoordinator = new AnalysisCoordinator(this.audioManager, this.config);

    // Create and register instantaneous analyzer
    const instantaneousAnalyzer = new InstantaneousAnalyzer(analyser, this.config);
    this.analysisCoordinator.registerAnalyzer('instantaneous', instantaneousAnalyzer);

    // Create and add spectrum bars visualizer
    const spectrumBarsVisualizer = new SpectrumBarsVisualizer(
      this.elements.canvas,
      this.elements.canvas.getContext('2d'),
      this.config
    );
    this.visualizerCore.addVisualizer('spectrumBars', spectrumBarsVisualizer);

    // Set up pairing: instantaneous analyzer -> spectrum bars visualizer
    this.dataBridge.pair('instantaneous', 'spectrumBars');

    console.log('Analysis system initialized');
  }

  play() {
    this.audioManager.play();

    // Start render loop
    this.visualizerCore.start();

    // Start analysis loop
    this.startAnalysisLoop();

    console.log('Playback started');
  }

  pause() {
    this.audioManager.pause();
    this.stopAnalysisLoop();
    console.log('Playback paused');
  }

  startAnalysisLoop() {
    const loop = () => {
      if (this.audioManager.isAudioPlaying()) {
        // Run analysis
        const currentTime = this.audioManager.getCurrentTime();
        const analysisResults = this.analysisCoordinator.runAnalysis(currentTime);

        // Route data to visualizers
        this.dataBridge.route(analysisResults, this.visualizerCore.getAllVisualizers());

        // Update FPS display
        this.elements.fpsValue.textContent = this.visualizerCore.getFPS();

        // Continue loop
        this.animationLoopId = requestAnimationFrame(loop);
      }
    };

    loop();
  }

  stopAnalysisLoop() {
    if (this.animationLoopId) {
      cancelAnimationFrame(this.animationLoopId);
      this.animationLoopId = null;
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new MusicVisualizerApp();
  console.log('Music Visualizer initialized');
});
