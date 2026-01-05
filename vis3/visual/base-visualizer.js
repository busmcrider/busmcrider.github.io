// visual/base-visualizer.js
// Abstract base class for all visualizers

export class BaseVisualizer {
  constructor(canvas, ctx, config) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.config = config;
    this.data = null;
    this.width = canvas.width;
    this.height = canvas.height;
  }

  update(data) {
    // Store data for use in render()
    this.data = data;
  }

  render() {
    throw new Error('render() must be implemented by subclass');
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  // Helper method to check if data is available
  hasData() {
    return this.data !== null && this.data !== undefined;
  }
}
