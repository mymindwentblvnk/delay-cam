class CameraHandler {
  constructor(onChunkReady) {
    this.stream = null;
    this.recorder = null;
    this.onChunkReady = onChunkReady;
  }

  async initialize() {
    try {
      // Request camera with front-facing for self-review
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false // No audio needed
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.stream;
    } catch (error) {
      throw new Error(`Camera access failed: ${error.message}`);
    }
  }

  startRecording() {
    if (!this.stream) {
      throw new Error('Camera not initialized');
    }

    // Detect supported codec for iOS
    const mimeType = this._getSupportedMimeType();

    const options = {
      mimeType: mimeType,
      videoBitsPerSecond: 2500000 // 2.5 Mbps
    };

    this.recorder = new MediaRecorder(this.stream, options);

    // Capture chunks every 100ms for smooth playback
    this.recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.onChunkReady(event.data);
      }
    };

    this.recorder.start(100); // 100ms timeslice
  }

  stopRecording() {
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  _getSupportedMimeType() {
    const types = [
      'video/mp4',
      'video/webm;codecs=h264',
      'video/webm'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return ''; // Use default
  }
}
