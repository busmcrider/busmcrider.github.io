// core/config-schema.js
// Defines UI control metadata for configuration parameters

export const ConfigSchema = {
  // Audio settings
  'audio.fftSize': {
    type: 'select',
    options: [512, 1024, 2048, 4096, 8192],
    label: 'FFT Size',
    description: 'Frequency resolution (higher = more detail, slower)'
  },
  'audio.smoothingTimeConstant': {
    type: 'slider',
    min: 0,
    max: 1,
    step: 0.1,
    label: 'Smoothing',
    description: 'Amount of smoothing applied to frequency changes'
  },

  // Instantaneous analysis
  'analysis.instantaneous.enabled': {
    type: 'checkbox',
    label: 'Enable Instantaneous Analysis'
  },

  // Beat detection
  'analysis.beat.enabled': {
    type: 'checkbox',
    label: 'Enable Beat Detection'
  },
  'analysis.beat.sensitivity': {
    type: 'slider',
    min: 0,
    max: 1,
    step: 0.05,
    label: 'Beat Sensitivity',
    description: 'Higher = detects weaker beats'
  },
  'analysis.beat.minTimeBetweenBeats': {
    type: 'number',
    min: 100,
    max: 1000,
    step: 50,
    label: 'Min Time Between Beats (ms)',
    description: 'Prevents false beat detection'
  },

  // Pitch detection
  'analysis.pitch.enabled': {
    type: 'checkbox',
    label: 'Enable Pitch Detection'
  },
  'analysis.pitch.minFrequency': {
    type: 'number',
    min: 20,
    max: 500,
    step: 10,
    label: 'Min Frequency (Hz)'
  },
  'analysis.pitch.maxFrequency': {
    type: 'number',
    min: 500,
    max: 4000,
    step: 100,
    label: 'Max Frequency (Hz)'
  },

  // Tempo detection
  'analysis.tempo.enabled': {
    type: 'checkbox',
    label: 'Enable Tempo Detection'
  },
  'analysis.tempo.minBPM': {
    type: 'number',
    min: 40,
    max: 120,
    step: 10,
    label: 'Min BPM'
  },
  'analysis.tempo.maxBPM': {
    type: 'number',
    min: 120,
    max: 240,
    step: 10,
    label: 'Max BPM'
  },

  // Visual settings
  'visual.backgroundColor': {
    type: 'color',
    label: 'Background Color'
  },
  'visual.targetFPS': {
    type: 'number',
    min: 30,
    max: 60,
    step: 10,
    label: 'Target FPS'
  },

  // Spectrum bars visualizer
  'visualizers.spectrumBars.enabled': {
    type: 'checkbox',
    label: 'Enable Spectrum Bars'
  },
  'visualizers.spectrumBars.numBars': {
    type: 'slider',
    min: 32,
    max: 256,
    step: 16,
    label: 'Number of Bars',
    description: 'More bars = finer detail'
  },
  'visualizers.spectrumBars.colorScheme': {
    type: 'select',
    options: ['rainbow', 'blue', 'green', 'red', 'purple'],
    label: 'Color Scheme'
  }
};
