// utils/logger.js
// Batched logging system - flushes once per second

class Logger {
  constructor() {
    this.buffer = {
      beat: [],
      pitch: [],
      key: [],
      voice: [],
      tempo: [],
      other: []
    };

    this.flushInterval = 1000; // 1 second
    this.lastFlush = Date.now();

    // Auto-flush timer
    setInterval(() => this.flush(), this.flushInterval);
  }

  log(category, message) {
    if (!this.buffer[category]) {
      category = 'other';
    }

    this.buffer[category].push({
      message,
      timestamp: Date.now()
    });

    // Limit buffer size per category
    if (this.buffer[category].length > 100) {
      this.buffer[category].shift();
    }
  }

  flush() {
    const now = Date.now();

    for (const [category, messages] of Object.entries(this.buffer)) {
      if (messages.length === 0) continue;

      // Group by message content
      const grouped = {};
      for (const msg of messages) {
        const key = msg.message;
        if (!grouped[key]) {
          grouped[key] = { count: 0, first: msg.timestamp, last: msg.timestamp };
        }
        grouped[key].count++;
        grouped[key].last = msg.timestamp;
      }

      // Log summary
      console.groupCollapsed(`[${category.toUpperCase()}] ${messages.length} events in last ${((now - this.lastFlush) / 1000).toFixed(1)}s`);
      for (const [msg, stats] of Object.entries(grouped)) {
        if (stats.count === 1) {
          console.log(msg);
        } else {
          console.log(`${msg} (×${stats.count})`);
        }
      }
      console.groupEnd();

      // Clear buffer
      this.buffer[category] = [];
    }

    this.lastFlush = now;
  }
}

export const logger = new Logger();
