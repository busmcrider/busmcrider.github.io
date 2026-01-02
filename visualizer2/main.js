// Main entry point - imports and initializes the visualizer
import { TestController } from './test-page/test-controller.js';

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
  console.log('=== Music Visualizer - Stage 1 ===');
  console.log('Initializing...');
  const controller = new TestController();
  console.log('Ready! Load an audio file to begin.');

  // Expose to window for debugging
  window.musicVisualizer = controller;
});
