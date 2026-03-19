class VideoBufferManager {
  constructor(delaySeconds = 10) {
    this.delayMs = delaySeconds * 1000;
    this.segments = []; // Array of {timestamp, blob, mimeType}
    this.maxBufferSizeMB = 50; // iOS memory constraint
  }

  addSegment(blob, mimeType) {
    const timestamp = Date.now();
    this.segments.push({ timestamp, blob, mimeType });

    console.log(`Added segment: ${(blob.size / 1024).toFixed(1)}KB at ${new Date(timestamp).toTimeString()}`);

    // Keep only segments within delay window + buffer
    const cutoffTime = timestamp - this.delayMs - 10000;
    const oldLength = this.segments.length;
    this.segments = this.segments.filter(seg => seg.timestamp > cutoffTime);

    if (this.segments.length < oldLength) {
      console.log(`Removed ${oldLength - this.segments.length} old segments`);
    }

    // Enforce memory limits for iOS
    this._enforceMemoryLimit();
  }

  getDelayedSegment() {
    if (this.segments.length === 0) return null;

    const now = Date.now();
    const targetTime = now - this.delayMs;

    // Find the segment closest to the target delay time
    let closestSegment = null;
    let closestDiff = Infinity;

    for (const segment of this.segments) {
      const diff = Math.abs(segment.timestamp - targetTime);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestSegment = segment;
      }
    }

    return closestSegment;
  }

  hasEnoughData() {
    if (this.segments.length === 0) return false;

    const now = Date.now();
    const oldestSegment = this.segments[0].timestamp;
    const recordingDuration = now - oldestSegment;

    const hasEnough = recordingDuration >= this.delayMs;
    console.log(`Buffer check: ${(recordingDuration / 1000).toFixed(1)}s recorded, need ${(this.delayMs / 1000).toFixed(1)}s, hasEnough: ${hasEnough}`);

    return hasEnough;
  }

  setDelay(seconds) {
    this.delayMs = seconds * 1000;
    console.log(`Delay set to ${seconds} seconds`);
  }

  clear() {
    this.segments = [];
    console.log('Buffer cleared');
  }

  _enforceMemoryLimit() {
    const totalSizeMB = this.segments.reduce((sum, seg) =>
      sum + seg.blob.size, 0) / (1024 * 1024);

    console.log(`Buffer size: ${totalSizeMB.toFixed(2)}MB (${this.segments.length} segments)`);

    if (totalSizeMB > this.maxBufferSizeMB) {
      const removeCount = Math.floor(this.segments.length * 0.2);
      this.segments = this.segments.slice(removeCount);
      console.log(`Memory limit exceeded, removed ${removeCount} segments`);
    }
  }
}

