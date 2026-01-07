// main.js
// Test page entry point - orchestrates Phase 1

import { AudioManager } from './core/audio-manager.js';
import { ConfigManager } from './core/config-manager.js';
import { ConfigSchema } from './core/config-schema.js';
import { AnalysisCoordinator } from './core/analysis-coordinator.js';
import { DataBridge } from './core/data-bridge.js';
import { VisualizerCore } from './core/visualizer-core.js';
import { InstantaneousAnalyzer } from './analysis/instantaneous.js';
import { BeatDetector } from './analysis/beat-detector.js';
import { PitchDetector } from './analysis/pitch-detector.js';
import { KeyDetector } from './analysis/key-detector.js';
import { VoiceDetector } from './analysis/voice-detector.js';
import { SpectrumBarsVisualizer } from './visual/visualizers/spectrum-bars.js';
import { ConfigPanel } from './ui/config-panel.js';
import { LifecycleManager } from './core/lifecycle-manager.js';
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
    this.lifecycleManager = null;
    this.tempoWorker = null;
    this.pitchWorker = null;
    this.keyDetector = null;  // Store reference for pitch feeding
    this.voiceDetector = null;  // Store reference for config updates

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
      presetList: document.getElementById('presetList'),
      toggleConfigBtn: document.getElementById('toggleConfigBtn'),
      configPanel: document.getElementById('configPanel')
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

    // Wire up config panel toggle
    this.elements.toggleConfigBtn.addEventListener('click', () => {
      this.elements.configPanel.classList.toggle('hidden');
    });

    // Initialize visualizer core
    this.visualizerCore = new VisualizerCore(this.elements.canvas, this.config);
  }

  async handleFileLoad(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // Stop playback if running
      if (this.audioManager.isAudioPlaying()) {
        this.pause();
      }

      // Cleanup existing workers and audio
      this.cleanup();

      // Load audio file
      const metadata = await this.audioManager.loadFile(file);
      this.elements.fileName.textContent = metadata.name;

      // Always reinitialize analysis system for new file
      this.setupAnalysisSystem();
      this.isInitialized = true;

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

      // Reset lifecycle manager
      if (this.lifecycleManager) {
        this.lifecycleManager.reset();
      }
      this.lifecycleManager = new LifecycleManager(this.config);

      // Clear existing coordinator if present
      if (this.analysisCoordinator) {
        // Reset all analyzers
        for (const name of this.analysisCoordinator.getAllAnalyzers()) {
          const analyzer = this.analysisCoordinator.getAnalyzer(name);
          if (analyzer && analyzer.reset) {
            analyzer.reset();
          }
        }
      }

      // Create analysis coordinator
      this.analysisCoordinator = new AnalysisCoordinator(this.audioManager, this.config);

      // Create and register instantaneous analyzer
      const instantaneousAnalyzer = new InstantaneousAnalyzer(analyser, this.config);
      this.analysisCoordinator.registerAnalyzer('instantaneous', instantaneousAnalyzer);

      // Create and register beat detector
      const beatDetector = new BeatDetector(analyser, this.config);
      this.analysisCoordinator.registerAnalyzer('beat', beatDetector);

      // Create and register pitch detector with worker
      const pitchDetector = new PitchDetector(analyser, this.config);
      this.pitchWorker = new Worker('core/workers/pitch-worker.js');
      pitchDetector.setWorker(this.pitchWorker);
      this.analysisCoordinator.registerAnalyzer('pitch', pitchDetector);

      // Create and register key detector
      this.keyDetector = new KeyDetector(analyser, this.config);
      this.analysisCoordinator.registerAnalyzer('key', this.keyDetector);

      // Create and register voice detector with worker
      this.voiceDetector = new VoiceDetector(analyser, this.config);
      this.voiceWorker = new Worker('core/workers/voice-worker.js');
      this.voiceDetector.setWorker(this.voiceWorker);
      this.analysisCoordinator.registerAnalyzer('voice', this.voiceDetector);

      // Initialize tempo worker
      this.tempoWorker = new Worker('core/workers/tempo-worker.js');
      this.tempoWorker.onmessage = (e) => {
        if (e.data.type === 'result') {
          this.lifecycleManager.updateBPM(e.data.bpm, e.data.confidence);
        }
      };
      this.tempoWorker.postMessage({
        type: 'init',
        data: {
          minBPM: this.config.get('analysis.tempo.minBPM'),
          maxBPM: this.config.get('analysis.tempo.maxBPM')
        }
      });

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

  cleanup() {
    // Terminate workers
    if (this.tempoWorker) {
      this.tempoWorker.terminate();
      this.tempoWorker = null;
    }
    if (this.pitchWorker) {
      this.pitchWorker.terminate();
      this.pitchWorker = null;
    }
    if (this.voiceWorker) {
      this.voiceWorker.terminate();
      this.voiceWorker = null;
    }
    
    // Reset lifecycle manager
    if (this.lifecycleManager) {
      this.lifecycleManager.reset();
    }
    
    // Reset visualizer core
    if (this.visualizerCore) {
      this.visualizerCore.reset();
    }
    
    // Reset debug display
    this.elements.fpsValue.textContent = '0';
    const bpmElement = document.getElementById('bpmValue');
    const pitchElement = document.getElementById('pitchValue');
    const keyElement = document.getElementById('keyValue');
    const voiceElement = document.getElementById('voiceValue');
    
    if (bpmElement) bpmElement.textContent = '--';
    if (pitchElement) pitchElement.textContent = '--';
    if (keyElement) keyElement.textContent = '--';
    if (voiceElement) voiceElement.textContent = '--';
  }

  startAnalysisLoop() {
      const loop = () => {
        if (this.audioManager.isAudioPlaying()) {
          // Run analysis
          const currentTime = this.audioManager.getCurrentTime();
          const analysisResults = this.analysisCoordinator.runAnalysis(currentTime);

          // Feed pitch data to key detector
          if (analysisResults.pitch && analysisResults.pitch.note) {
            this.keyDetector.updatePitch(analysisResults.pitch.note, analysisResults.pitch.confidence);
          }

          // Send beat detections to tempo worker
          if (analysisResults.beat && analysisResults.beat.detected) {
            this.tempoWorker.postMessage({
              type: 'beatDetected',
              data: {
                timestamp: currentTime * 1000,  // Convert to ms
                confidence: analysisResults.beat.confidence
              }
            });
          }

          // Route data to visualizers
          this.dataBridge.route(analysisResults, this.visualizerCore.getAllVisualizers());

          // Update debug display
          this.updateDebugDisplay(analysisResults);

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

    updateDebugDisplay(analysisResults) {
      // Update FPS
      this.elements.fpsValue.textContent = this.visualizerCore.getFPS();

      // Update BPM
      const bpm = this.lifecycleManager.getCurrentBPM();
      const bpmElement = document.getElementById('bpmValue');
      if (bpmElement) {
        bpmElement.textContent = bpm ? Math.round(bpm) : '--';
      }

      // Update beat indicator (flash on beat)
      const beatFlash = document.querySelector('.beat-flash');
      if (beatFlash && analysisResults.beat && analysisResults.beat.detected) {
        beatFlash.classList.add('active');
        setTimeout(() => beatFlash.classList.remove('active'), 100);
      }

      // Update pitch
      const pitchElement = document.getElementById('pitchValue');
      if (pitchElement && analysisResults.pitch) {
        pitchElement.textContent = analysisResults.pitch.note || '--';
      }

      // Update key
      const keyElement = document.getElementById('keyValue');
      if (keyElement && analysisResults.key && analysisResults.key.key) {
        keyElement.textContent = `${analysisResults.key.key} ${analysisResults.key.mode}`;
      } else if (keyElement) {
        keyElement.textContent = '--';
      }

      // Update voice
      const voiceElement = document.getElementById('voiceValue');
      if (voiceElement && analysisResults.voice) {
        voiceElement.textContent = analysisResults.voice.voicePresent ? '🎤 Active' : '--';
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

      // Update pitch worker config if pitch parameters change
      if (path === 'analysis.pitch.minFrequency' || path === 'analysis.pitch.maxFrequency') {
        const pitchAnalyzer = this.analysisCoordinator.getAnalyzer('pitch');
        if (pitchAnalyzer && pitchAnalyzer.updateConfig) {
          pitchAnalyzer.updateConfig();
          console.log(`Pitch config updated: ${path} = ${value}`);
        }
      }

      // Update voice worker config if voice threshold changes
      if (path === 'analysis.voice.confidenceThreshold') {
        if (this.voiceDetector && this.voiceDetector.updateConfig) {
          this.voiceDetector.updateConfig();
          console.log(`Voice config updated: ${path} = ${value}`);
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
