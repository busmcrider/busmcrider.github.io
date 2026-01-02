// Global animations - effects that apply to the entire visualization
export class GlobalAnimations {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;

    // Active animations
    this.activeAnimations = [];

    // Global state
    this.globalScale = 1.0;
    this.colorFlash = 0; // 0-1, brightness boost
  }

  // Trigger a new animation
  trigger(command) {
    switch (command.animation) {
      case 'radialPump':
        this.triggerRadialPump(command);
        break;
      case 'colorFlash':
        this.triggerColorFlash(command);
        break;
    }
  }

  // Radial pump - scales everything from center
  triggerRadialPump(command) {
    this.activeAnimations.push({
      type: 'radialPump',
      startTime: performance.now(),
      duration: command.duration,
      intensity: command.intensity,
      easing: command.easing
    });
  }

  // Color flash - brightness boost
  triggerColorFlash(command) {
    this.activeAnimations.push({
      type: 'colorFlash',
      startTime: performance.now(),
      duration: command.duration,
      intensity: command.intensity,
      easing: command.easing
    });
  }

  // Update all animations
  update() {
    const now = performance.now();

    // Reset values
    let pumpScale = 1.0;
    this.colorFlash = 0;

    // Update each animation
    this.activeAnimations = this.activeAnimations.filter(anim => {
      const elapsed = now - anim.startTime;
      const progress = Math.min(elapsed / anim.duration, 1.0);

      if (progress >= 1.0) {
        return false; // Remove finished animation
      }

      // Apply easing
      const easedProgress = this.ease(progress, anim.easing);
      const value = 1.0 - easedProgress; // Reverse for fade-out effect

      // Apply animation
      switch (anim.type) {
        case 'radialPump':
          pumpScale = Math.max(pumpScale, 1.0 + value * 0.1 * anim.intensity);
          break;
        case 'colorFlash':
          this.colorFlash = Math.max(this.colorFlash, value * anim.intensity);
          break;
      }

      return true; // Keep animation
    });

    // Combine pump with global scale
    this.globalScale = pumpScale;
  }

  // Apply transformations before rendering
  applyPreRender() {
    const ctx = this.ctx;

    // Save state
    ctx.save();

    // Apply radial pump (scale from center)
    if (this.globalScale !== 1.0) {
      const cx = this.canvas.width / 2;
      const cy = this.canvas.height / 2;
      ctx.translate(cx, cy);
      ctx.scale(this.globalScale, this.globalScale);
      ctx.translate(-cx, -cy);
    }
  }

  // Restore after rendering
  applyPostRender() {
    this.ctx.restore();

    // Apply color flash as overlay
    if (this.colorFlash > 0) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${this.colorFlash * 0.3})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  // Easing functions
  ease(t, type) {
    switch (type) {
      case 'easeOutCubic':
        return 1 - Math.pow(1 - t, 3);
      case 'easeOutQuad':
        return 1 - Math.pow(1 - t, 2);
      case 'linear':
      default:
        return t;
    }
  }

  // Set global scale (from mapping)
  setGlobalScale(scale) {
    // Don't override pump animation, just store for future frames
    // In practice, we might want to blend these differently
  }
}
