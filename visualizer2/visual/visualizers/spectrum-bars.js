// Simple frequency spectrum bars visualizer
class SpectrumBars {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  // Render the visualizer
  render() {
    const spectrum = MusicState.instantaneous.spectrum;
    if (!spectrum) return;

    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // How many bars to show (use subset of frequency bins for performance)
    const numBars = 128;
    const barWidth = width / numBars;
    const binStep = Math.floor(spectrum.length / numBars);

    // Draw bars
    for (let i = 0; i < numBars; i++) {
      // Sample frequency bin
      const binIndex = i * binStep;
      const value = spectrum[binIndex] / 255; // Normalize to 0-1

      // Bar height
      const barHeight = value * height * 0.8;
      const x = i * barWidth;
      const y = height - barHeight;

      // Color based on frequency (low = red, mid = green, high = blue)
      const hue = (i / numBars) * 280; // 0-280 degrees
      ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;

      // Draw bar
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    }
  }
}
