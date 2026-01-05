// main.js
// Test page entry point - orchestrates Phase 1

import { AudioManager } from './core/audio-manager.js';
import { ConfigManager } from './core/config-manager.js';
import { ConfigSchema } from './core/config-schema.js';
import { AnalysisCoordinator } from './core/analysis-coordinator.js';
import { DataBridge } from './core/data-bridge.js';
import { VisualizerCore } from './core/visualizer-core.js';
import { InstantaneousAnalyzer } from './analysis/instantaneous.js';
import { SpectrumBarsVisualizer } from './visual/visualizers/spectrum-bars.js';
import { ConfigPanel } from './ui/config-panel.js';
import { savePreset, loadPreset, listPresets, deletePreset } from './utils/storage.js';
import { handleError } from './utils/error-handler.js';

class MusicVisualizerApp {
  constructor() {
    // Core managers
    this.config = new ConfigManager();
    this.audioManager = new AudioManager(this.config);
    this.analysisCoordinator = null;
    this.dataBridge = new DataBridge();
    this.visualizerCore = null;
    this.configPanel = null;

    // UI elements
    this.elements = {
      fileInput: document.getElementById('fileInput'),
      loadBtn: document.getElementById('loadBtn'),
      playBtn: document.getElementById('playBtn'),
      pauseBtn: document.getElementById('pauseBtn'),
      fileName: document.getElementById('fileName'),
      canvas: document.getElementById('visualizerCanvas'),
      fpsValue: document.getElementById('fpsValue'),
      configControls: document.getElementById('configControls'),
      presetNameInput: document.getElementById('presetNameInput'),
      savePresetBtn: document.getElementById('savePresetBtn'),
      exportConfigBtn: document.getElementById('exportConfigBtn'),
      importConfigBtn: document.getElementById('importConfigBtn'),
      presetList: document.getElementById('presetList')
    };

    // State
    this.isInitialized = false;
    this.animationLoopId = null;

    this.init();
  }

  init() {
    // Initialize config panel
    this.configPanel = new ConfigPanel(
      this.config,
      ConfigSchema,
      this.elements.configControls
    );
    this.configPanel.generate();

    // Listen for config changes
    this.elements.configControls.addEventListener('configchange', (e) => {
      this.handleConfigChange(e.detail.path, e.detail.value);
    });

    // Wire up preset controls
    this.setupPresetControls();
    this.refreshPresetList();

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

    setupPresetControls() {
      // Save preset
      this.elements.savePresetBtn.addEventListener('click', () => {
        const name = this.elements.presetNameInput.value.trim();
        if (!name) {
          alert('Please enter a preset name');
          return;
        }

        const config = this.config.getAll();
        if (savePreset(name, config)) {
          this.elements.presetNameInput.value = '';
          this.refreshPresetList();
          console.log(`Preset "${name}" saved`);
        } else {
          alert('Failed to save preset');
        }
      });

      // Export config
      this.elements.exportConfigBtn.addEventListener('click', () => {
        const json = this.config.export();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'visualizer-config.json';
        a.click();
        URL.revokeObjectURL(url);
        console.log('Config exported');
      });

      // Import config
      this.elements.importConfigBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (event) => {
            if (this.config.import(event.target.result)) {
              this.configPanel.refresh();
              console.log('Config imported');
            } else {
              alert('Failed to import config');
            }
          };
          reader.readAsText(file);
        };
        input.click();
      });
    }

    refreshPresetList() {
      const presets = listPresets();
      this.elements.presetList.innerHTML = '';

      if (presets.length === 0) {
        this.elements.presetList.innerHTML = '<div style="padding: 10px; text-align: center; color: #888; font-size: 12px;">No saved presets</div>';
        return;
      }

      for (const name of presets) {
        const item = document.createElement('div');
        item.className = 'preset-item';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'preset-item-name';
        nameSpan.textContent = name;
        nameSpan.addEventListener('click', () => {
          const preset = loadPreset(name);
          if (preset) {
            this.config.import(JSON.stringify(preset));
            this.configPanel.refresh();
            console.log(`Preset "${name}" loaded`);
          }
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'preset-item-delete';
        deleteBtn.textContent = '×';
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm(`Delete preset "${name}"?`)) {
            deletePreset(name);
            this.refreshPresetList();
          }
        });

        item.appendChild(nameSpan);
        item.appendChild(deleteBtn);
        this.elements.presetList.appendChild(item);
      }
    }

    handleConfigChange(path, value) {
      // Handle special config changes that require reinitialization
      if (path === 'audio.fftSize' || path === 'audio.smoothingTimeConstant') {
        // Need to reinitialize audio analyser
        if (this.audioManager.analyser) {
          this.audioManager.analyser.fftSize = this.config.get('audio.fftSize');
          this.audioManager.analyser.smoothingTimeConstant = this.config.get('audio.smoothingTimeConstant');
          console.log(`Audio setting updated: ${path} = ${value}`);
        }
      }

      // Visualizers automatically pick up config changes on next render
      console.log(`Config changed: ${path} = ${value}`);
    }
  }

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new MusicVisualizerApp();
  console.log('Music Visualizer initialized');
});
