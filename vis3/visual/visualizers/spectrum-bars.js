// visual/visualizers/spectrum-bars.js
// Frequency spectrum bars visualization

import { BaseVisualizer } from '../base-visualizer.js';

export class SpectrumBarsVisualizer extends BaseVisualizer {
  constructor(canvas, ctx, config) {
    super(canvas, ctx, config);
    this.spectrum = null;
  }

  update(data) {
    super.update(data);
    // Store spectrum array
    this.spectrum = data.spectrum;
  }

  render() {
    if (!this.hasData() || !this.spectrum) {
      return;
    }

    const numBars = this.config.get('visualizers.spectrumBars.numBars');
    const colorScheme = this.config.get('visualizers.spectrumBars.colorScheme');
    const barWidth = this.width / numBars;
    const gap = Math.min(2, barWidth * 0.1); // Gap proportional to bar width, max 2px

    // Debug logging (only once)
    if (!this._debugLogged) {
      console.log(`[SPECTRUM] Canvas: ${this.width}x${this.height} | Bars: ${numBars} | BarWidth: ${barWidth.toFixed(2)} | Gap: ${gap.toFixed(2)}`);
      this._debugLogged = true;
    }

    // Sample spectrum array for numBars
    const samplingRate = Math.floor(this.spectrum.length / numBars);

    for (let i = 0; i < numBars; i++) {
      // Sample from spectrum
      const dataIndex = Math.floor(i * samplingRate);
      const value = this.spectrum[dataIndex] || 0;

      // Calculate bar height (normalized 0-1, then to canvas height)
      const normalizedValue = value / 255;
      const barHeight = normalizedValue * this.height;

      // Calculate color based on scheme
      const color = this.getColor(i, numBars, colorScheme, normalizedValue);

      // Draw bar - ensure exact positioning
      this.ctx.fillStyle = color;
      const x = i * barWidth;
      const y = this.height - barHeight;
      const width = Math.ceil(barWidth - gap); // Ceil to prevent gaps
      this.ctx.fillRect(x, y, width, barHeight);
    }
  }

  getColor(index, total, scheme, intensity) {
    switch (scheme) {
      case 'rainbow':
        // Map index to hue (0-360)
        const hue = (index / total) * 360;
        const saturation = 70 + (intensity * 30); // 70-100%
        const lightness = 40 + (intensity * 20);  // 40-60%
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;

      case 'blue':
        const blueLightness = 30 + (intensity * 40);
        return `hsl(220, 80%, ${blueLightness}%)`;

      case 'green':
        const greenLightness = 30 + (intensity * 40);
        return `hsl(120, 70%, ${greenLightness}%)`;

      case 'red':
        const redLightness = 30 + (intensity * 40);
        return `hsl(0, 80%, ${redLightness}%)`;

      case 'purple':
        const purpleLightness = 30 + (intensity * 40);
        return `hsl(280, 70%, ${purpleLightness}%)`;

      default:
        return `hsl(${(index / total) * 360}, 70%, ${40 + intensity * 20}%)`;
    }
  }

  reset() {
    this.spectrum = null;
    this.data = null;
    this._debugLogged = false;
  }
}
