// Manages the canvas rendering pipeline
class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.visualizers = [];
    this.globalAnimations = null;
    this.isRunning = false;
    this.lastFrameTime = 0;
    this.fps = 0;

    // Handle canvas resizing
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  // Make canvas fill its container
  resizeCanvas() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    console.log('[Renderer] Canvas resized:', this.canvas.width, 'x', this.canvas.height);
  }

  // Register a visualizer
  addVisualizer(visualizer) {
    this.visualizers.push(visualizer);
    console.log('[Renderer] Visualizer added:', visualizer.constructor.name);
  }

  // Clear all visualizers
  clearVisualizers() {
    this.visualizers = [];
  }

  // Set global animations
  setGlobalAnimations(globalAnimations) {
    this.globalAnimations = globalAnimations;
    console.log('[Renderer] Global animations set');
  }

  // Start the render loop
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.renderLoop();
    console.log('[Renderer] Started');
  }

  // Stop the render loop
  stop() {
    this.isRunning = false;
    console.log('[Renderer] Stopped');
  }

  // Main render loop
  renderLoop() {
    if (!this.isRunning) return;

    // Calculate FPS
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.fps = Math.round(1000 / delta);
    this.lastFrameTime = now;

    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and apply global animations
    if (this.globalAnimations) {
      this.globalAnimations.update();
      this.globalAnimations.applyPreRender();
    }

    // Render all visualizers
    for (const visualizer of this.visualizers) {
      visualizer.render();
    }

    // Restore after global animations
    if (this.globalAnimations) {
      this.globalAnimations.applyPostRender();
    }

    // Continue loop
    requestAnimationFrame(() => this.renderLoop());
  }

  // Get current FPS
  getFPS() {
    return this.fps;
  }
}
