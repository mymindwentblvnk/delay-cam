class FrameCapture {
  constructor(videoElement, onFrameReady) {
    this.videoElement = videoElement;
    this.onFrameReady = onFrameReady;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.isCapturing = false;
    this.captureInterval = null;
    this.fps = 30;
  }

  start() {
    if (this.isCapturing) return;

    // Set canvas size to match video
    this.canvas.width = this.videoElement.videoWidth || 1280;
    this.canvas.height = this.videoElement.videoHeight || 720;

    console.log(`Frame capture started: ${this.canvas.width}x${this.canvas.height} at ${this.fps}fps`);

    this.isCapturing = true;
    this.captureInterval = setInterval(() => {
      this.captureFrame();
    }, 1000 / this.fps);
  }

  stop() {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    this.isCapturing = false;
    console.log('Frame capture stopped');
  }

  captureFrame() {
    if (!this.isCapturing || !this.videoElement.videoWidth) return;

    // Update canvas size if video dimensions changed
    if (this.canvas.width !== this.videoElement.videoWidth) {
      this.canvas.width = this.videoElement.videoWidth;
      this.canvas.height = this.videoElement.videoHeight;
    }

    // Draw current video frame to canvas
    this.ctx.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);

    // Get image data
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

    // Send to buffer
    this.onFrameReady(imageData);
  }
}
