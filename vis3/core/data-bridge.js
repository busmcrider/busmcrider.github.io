// core/data-bridge.js
// Routes analysis data to visualizers without coupling

export class DataBridge {
  constructor() {
    // Map of analyzer names to sets of visualizer names
    this.pairings = new Map();
  }

  pair(analyzerName, visualizerName) {
    if (!this.pairings.has(analyzerName)) {
      this.pairings.set(analyzerName, new Set());
    }
    this.pairings.get(analyzerName).add(visualizerName);
  }

  unpair(analyzerName, visualizerName) {
    if (this.pairings.has(analyzerName)) {
      this.pairings.get(analyzerName).delete(visualizerName);

      // Clean up empty sets
      if (this.pairings.get(analyzerName).size === 0) {
        this.pairings.delete(analyzerName);
      }
    }
  }

  route(analysisResults, visualizers) {
    // Iterate through all pairings
    for (const [analyzerName, visualizerNames] of this.pairings) {
      // Get the data from this analyzer
      const data = analysisResults[analyzerName];

      // Skip if no data from this analyzer
      if (!data) {
        continue;
      }

      // Send data to all paired visualizers
      for (const visualizerName of visualizerNames) {
        const visualizer = visualizers.get(visualizerName);

        if (visualizer) {
          try {
            visualizer.update(data);
          } catch (error) {
            console.error(`Error updating visualizer '${visualizerName}':`, error);
          }
        }
      }
    }
  }

  getPairings() {
    const pairingList = [];
    for (const [analyzerName, visualizerNames] of this.pairings) {
      for (const visualizerName of visualizerNames) {
        pairingList.push({ analyzerName, visualizerName });
      }
    }
    return pairingList;
  }

  clearAll() {
    this.pairings.clear();
  }
}
