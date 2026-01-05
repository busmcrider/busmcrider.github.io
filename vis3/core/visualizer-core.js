// core/visualizer-core.js
// Canvas rendering pipeline with FPS tracking

export class VisualizerCore {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = config;
    this.visualizers = new Map();
    this.isRunning = false;
    this.animationFrameId = null;

    // FPS tracking
    this.fpsHistory = [];
    this.lastFrameTime = performance.now();
    this.currentFPS = 0;

    // Handle canvas resize
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  handleResize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;

    // Notify all visualizers of resize
    for (const visualizer of this.visualizers.values()) {
      visualizer.resize(this.canvas.width, this.canvas.height);
    }
  }

  addVisualizer(name, visualizer) {
    this.visualizers.set(name, visualizer);
    visualizer.resize(this.canvas.width, this.canvas.height);
  }

  removeVisualizer(name) {
    this.visualizers.delete(name);
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.renderLoop();
    }
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  renderLoop() {
    if (!this.isRunning) return;

    // Calculate FPS
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;

    const fps = 1000 / delta;
    this.fpsHistory.push(fps);

    // Keep only last 60 frames
    if (this.fpsHistory.length > 60) {
      this.fpsHistory.shift();
    }

    // Calculate average FPS
    this.currentFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

    // Clear canvas
    const bgColor = this.config.get('visual.backgroundColor');
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Render all visualizers
    for (const visualizer of this.visualizers.values()) {
      try {
        visualizer.render();
      } catch (error) {
        console.error('Error rendering visualizer:', error);
      }
    }

    // Continue loop
    this.animationFrameId = requestAnimationFrame(() => this.renderLoop());
  }

  getFPS() {
    return Math.round(this.currentFPS);
  }

  getVisualizer(name) {
    return this.visualizers.get(name);
  }

  getAllVisualizers() {
    return this.visualizers;
  }
}
