class FrameBuffer {
  constructor(delaySeconds = 10) {
    this.delayMs = delaySeconds * 1000;
    this.fps = 15; // Optimized for smooth playback with minimal memory
    this.frameInterval = 1000 / this.fps;
    this.frames = []; // Array of {timestamp, imageData}
    this.maxFrames = Math.ceil((delaySeconds + 5) * this.fps); // Keep delay + 5s buffer
  }

  addFrame(imageData) {
    const timestamp = Date.now();
    this.frames.push({ timestamp, imageData });

    // Keep only necessary frames
    if (this.frames.length > this.maxFrames) {
      this.frames.shift();
    }
  }

  getDelayedFrame() {
    if (this.frames.length === 0) return null;

    const now = Date.now();
    const targetTime = now - this.delayMs;

    // Find the frame closest to the target time
    let closestFrame = null;
    let closestDiff = Infinity;

    for (const frame of this.frames) {
      const diff = Math.abs(frame.timestamp - targetTime);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestFrame = frame;
      }
    }

    return closestFrame ? closestFrame.imageData : null;
  }

  hasEnoughData() {
    if (this.frames.length === 0) return false;

    const now = Date.now();
    const oldestFrame = this.frames[0].timestamp;
    const recordingDuration = now - oldestFrame;

    return recordingDuration >= this.delayMs;
  }

  setDelay(seconds) {
    this.delayMs = seconds * 1000;
    this.maxFrames = Math.ceil((seconds + 5) * this.fps);

    // Trim excess frames if delay was reduced
    if (this.frames.length > this.maxFrames) {
      this.frames = this.frames.slice(-this.maxFrames);
    }
  }

  clear() {
    this.frames = [];
  }

  getBufferInfo() {
    const durationMs = this.frames.length > 0
      ? Date.now() - this.frames[0].timestamp
      : 0;

    return {
      frameCount: this.frames.length,
      durationSeconds: durationMs / 1000,
      memoryMB: (this.frames.length * 640 * 360 * 4) / (1024 * 1024) // Updated for 640x360 resolution
    };
  }
}
