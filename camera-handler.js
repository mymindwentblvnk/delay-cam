class CameraHandler {
  constructor(onSegmentReady) {
    this.stream = null;
    this.segmentRecorder = null;
    this.onSegmentReady = onSegmentReady;
  }

  async initialize() {
    try {
      // Request rear camera for recording others
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false // No audio needed
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera initialized successfully');
      return this.stream;
    } catch (error) {
      console.error('Camera initialization failed:', error);
      throw new Error(`Camera access failed: ${error.message}`);
    }
  }

  startRecording() {
    if (!this.stream) {
      throw new Error('Camera not initialized');
    }

    console.log('Starting segment recorder...');
    this.segmentRecorder = new SegmentRecorder(this.stream, this.onSegmentReady);
    this.segmentRecorder.start();
  }

  stopRecording() {
    if (this.segmentRecorder) {
      this.segmentRecorder.stop();
      this.segmentRecorder = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
      console.log('Camera stopped');
    }
  }
}
