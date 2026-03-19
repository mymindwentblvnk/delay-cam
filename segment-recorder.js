class SegmentRecorder {
  constructor(stream, onSegmentReady) {
    this.stream = stream;
    this.onSegmentReady = onSegmentReady;
    this.isRecording = false;
    this.segmentDuration = 2000; // 2 second segments
  }

  start() {
    this.isRecording = true;
    this._recordNextSegment();
  }

  stop() {
    this.isRecording = false;
    if (this.currentRecorder && this.currentRecorder.state !== 'inactive') {
      this.currentRecorder.stop();
    }
  }

  _recordNextSegment() {
    if (!this.isRecording) return;

    const mimeType = this._getSupportedMimeType();
    const options = {
      videoBitsPerSecond: 2500000
    };

    if (mimeType) {
      options.mimeType = mimeType;
    }

    this.currentRecorder = new MediaRecorder(this.stream, options);
    const chunks = [];

    this.currentRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    this.currentRecorder.onstop = () => {
      if (chunks.length > 0) {
        const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
        this.onSegmentReady(blob, mimeType || 'video/webm');
      }

      // Record next segment
      if (this.isRecording) {
        setTimeout(() => this._recordNextSegment(), 0);
      }
    };

    this.currentRecorder.start();

    // Stop after segment duration
    setTimeout(() => {
      if (this.currentRecorder && this.currentRecorder.state === 'recording') {
        this.currentRecorder.stop();
      }
    }, this.segmentDuration);
  }

  _getSupportedMimeType() {
    const types = [
      'video/mp4',
      'video/webm;codecs=h264',
      'video/webm;codecs=vp8',
      'video/webm'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('Using MIME type:', type);
        return type;
      }
    }

    console.log('No specific MIME type supported, using default');
    return '';
  }
}
