// core/analysis-coordinator.js
// Orchestrates analysis loop and collects analyzer outputs

export class AnalysisCoordinator {
  constructor(audioManager, config) {
    this.audioManager = audioManager;
    this.config = config;
    this.analyzers = new Map();
  }

  registerAnalyzer(name, analyzer) {
    this.analyzers.set(name, analyzer);
  }

  unregisterAnalyzer(name) {
    this.analyzers.delete(name);
  }

  runAnalysis(currentTime) {
    const results = {};

    // Iterate through all registered analyzers
    for (const [name, analyzer] of this.analyzers) {
      // Check if analyzer is enabled in config
      const enabledPath = `analysis.${name}.enabled`;
      const isEnabled = this.config.get(enabledPath);

      // Skip if disabled (default to true if not specified)
      if (isEnabled === false) {
        continue;
      }

      // Run analysis and collect result
      try {
        const result = analyzer.analyze(currentTime);
        results[name] = result;
      } catch (error) {
        console.error(`Error in analyzer '${name}':`, error);
        // Continue with other analyzers even if one fails
      }
    }

    return results;
  }

  getAnalyzer(name) {
    return this.analyzers.get(name);
  }

  getAllAnalyzers() {
    return Array.from(this.analyzers.keys());
  }
}
