class FramePlayer {
  constructor(canvasElement, frameBuffer) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.frameBuffer = frameBuffer;
    this.isPlaying = false;
    this.playInterval = null;

    // Match capture settings for consistency
    this.fps = 15; // Optimized for smooth playback with minimal memory
    this.targetWidth = 640;
    this.targetHeight = 360;
  }

  start() {
    if (this.isPlaying) return;

    console.log('Frame playback started (memory optimized)');
    this.isPlaying = true;

    // Set canvas to reduced size
    this.canvas.width = this.targetWidth;
    this.canvas.height = this.targetHeight;

    this.playInterval = setInterval(() => {
      this.displayFrame();
    }, 1000 / this.fps);
  }

  stop() {
    if (this.playInterval) {
      clearInterval(this.playInterval);
      this.playInterval = null;
    }
    this.isPlaying = false;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    console.log('Frame playback stopped');
  }

  displayFrame() {
    if (!this.isPlaying) return;

    const frameData = this.frameBuffer.getDelayedFrame();

    if (frameData) {
      // Update canvas size if needed
      if (this.canvas.width !== frameData.width) {
        this.canvas.width = frameData.width;
        this.canvas.height = frameData.height;
      }

      // Display the delayed frame
      this.ctx.putImageData(frameData, 0, 0);
    }
  }
}
