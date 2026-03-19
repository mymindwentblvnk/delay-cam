class VideoBufferManager {
  constructor(delaySeconds = 10) {
    this.delayMs = delaySeconds * 1000;
    this.chunks = []; // Array of {timestamp: Date.now(), blob: Blob}
    this.maxBufferSizeMB = 50; // iOS memory constraint
  }

  addChunk(blob) {
    const now = Date.now();
    this.chunks.push({ timestamp: now, blob: blob });

    // Remove chunks older than delay + 2s safety margin
    const cutoffTime = now - this.delayMs - 2000;
    this.chunks = this.chunks.filter(chunk => chunk.timestamp > cutoffTime);

    // Enforce memory limits for iOS
    this._enforceMemoryLimit();
  }

  getPlayableChunks() {
    const now = Date.now();
    const targetTime = now - this.delayMs;

    // Get chunks that should be displayed now
    return this.chunks
      .filter(chunk => chunk.timestamp <= targetTime)
      .map(chunk => chunk.blob);
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
