class VideoBufferManager {
  constructor(delaySeconds = 10) {
    this.delayMs = delaySeconds * 1000;
    this.chunks = []; // Array of {timestamp, blob}
    this.maxBufferSizeMB = 50; // iOS memory constraint
    this.chunkDurationMs = 100; // Each chunk represents 100ms
  }

  addChunk(blob) {
    const timestamp = Date.now();
    this.chunks.push({ timestamp, blob });

    // Keep only chunks within delay window + small buffer
    const cutoffTime = timestamp - this.delayMs - 3000;
    this.chunks = this.chunks.filter(chunk => chunk.timestamp > cutoffTime);

    // Enforce memory limits for iOS
    this._enforceMemoryLimit();
  }

  getDelayedChunks() {
    const now = Date.now();
    const targetTime = now - this.delayMs;

    // Get chunks from around the delayed timepoint (±2 seconds window)
    const windowStart = targetTime - 2000;
    const windowEnd = targetTime + 100;

    return this.chunks
      .filter(chunk => chunk.timestamp >= windowStart && chunk.timestamp <= windowEnd)
      .map(chunk => chunk.blob);
  }

  hasEnoughData() {
    if (this.chunks.length === 0) return false;

    const now = Date.now();
    const oldestChunk = this.chunks[0].timestamp;
    const recordingDuration = now - oldestChunk;

    return recordingDuration >= this.delayMs;
  }

  setDelay(seconds) {
    this.delayMs = seconds * 1000;
  }

  clear() {
    this.chunks = [];
  }

  _enforceMemoryLimit() {
    const totalSizeMB = this.chunks.reduce((sum, chunk) =>
      sum + chunk.blob.size, 0) / (1024 * 1024);

    if (totalSizeMB > this.maxBufferSizeMB) {
      // Remove 20% oldest chunks
      const removeCount = Math.floor(this.chunks.length * 0.2);
      this.chunks = this.chunks.slice(removeCount);
    }
  }
}
