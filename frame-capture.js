class FrameCapture {
  constructor(videoElement, onFrameReady) {
    this.videoElement = videoElement;
    this.onFrameReady = onFrameReady;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.isCapturing = false;
    this.captureInterval = null;

    // Reduced settings for iOS memory constraints
    this.fps = 20; // Reduced from 30fps
    this.targetWidth = 640; // Reduced from 1280
    this.targetHeight = 360; // Reduced from 720
  }

  start() {
    if (this.isCapturing) return;

    // Use reduced resolution to save memory
    this.canvas.width = this.targetWidth;
    this.canvas.height = this.targetHeight;

    console.log(`Frame capture started: ${this.canvas.width}x${this.canvas.height} at ${this.fps}fps (memory optimized)`);

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

    // Draw current video frame to canvas at reduced resolution
    // This downscales the video, saving memory
    this.ctx.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);

    // Get image data at reduced resolution
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

    // Send to buffer
    this.onFrameReady(imageData);
  }
}
