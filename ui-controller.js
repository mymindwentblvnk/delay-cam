class UIController {
  constructor(frameBuffer) {
    this.frameBuffer = frameBuffer;
    this.stream = null;
    this.frameCapture = null;
    this.framePlayer = null;

    this.elements = {
      liveVideo: document.getElementById('live-video'),
      delayedCanvas: document.getElementById('delayed-canvas'),
      startBtn: document.getElementById('start-btn'),
      stopBtn: document.getElementById('stop-btn'),
      delaySlider: document.getElementById('delay-slider'),
      delayValue: document.getElementById('delay-value'),
      delayDisplay: document.getElementById('delay-display'),
      fullscreenBtn: document.getElementById('fullscreen-btn'),
      status: document.getElementById('status'),
      countdown: document.getElementById('countdown'),
      countdownTimer: document.querySelector('.countdown-timer')
    };

    this._attachEventListeners();
  }

  async start() {
    try {
      this.showStatus('Starting camera...');

      // Request camera
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera initialized successfully');

      // Display live preview
      this.elements.liveVideo.srcObject = this.stream;

      // Wait for video to be ready
      await new Promise(resolve => {
        this.elements.liveVideo.onloadedmetadata = resolve;
      });

      // Start frame capture
      this.frameCapture = new FrameCapture(this.elements.liveVideo, (imageData) => {
        this.frameBuffer.addFrame(imageData);
      });
      this.frameCapture.start();

      // Start delayed playback
      this._startDelayedPlayback();

      this.elements.startBtn.disabled = true;
      this.elements.stopBtn.disabled = false;
      this.showStatus('Recording...');
    } catch (error) {
      console.error('Start error:', error);
      this.showStatus(`Error: ${error.message}`, 'error');
    }
  }

  stop() {
    if (this.frameCapture) {
      this.frameCapture.stop();
      this.frameCapture = null;
    }

    if (this.framePlayer) {
      this.framePlayer.stop();
      this.framePlayer = null;
    }

    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.frameBuffer.clear();

    this.elements.liveVideo.srcObject = null;
    this.elements.countdown.classList.add('hidden');

    this.elements.startBtn.disabled = false;
    this.elements.stopBtn.disabled = true;
    this.showStatus('Stopped');
  }

  _startDelayedPlayback() {
    let bufferStartTime = Date.now();

    // Show countdown overlay
    this.elements.countdown.classList.remove('hidden');

    // Update countdown every 100ms
    this.countdownInterval = setInterval(() => {
      const elapsedMs = Date.now() - bufferStartTime;
      const remainingMs = this.frameBuffer.delayMs - elapsedMs;
      const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));

      this.elements.countdownTimer.textContent = remainingSeconds;

      if (remainingSeconds === 0 && this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
    }, 100);

    // Wait for buffer, then start playback
    const checkBuffer = () => {
      if (!this.frameBuffer.hasEnoughData()) {
        setTimeout(checkBuffer, 200);
        return;
      }

      // Hide countdown
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
      this.elements.countdown.classList.add('hidden');

      // Start playing delayed frames
      this.framePlayer = new FramePlayer(this.elements.delayedCanvas, this.frameBuffer);
      this.framePlayer.start();

      const bufferInfo = this.frameBuffer.getBufferInfo();
      console.log(`Delayed playback started: ${bufferInfo.frameCount} frames, ${bufferInfo.durationSeconds.toFixed(1)}s`);

      this.showStatus('Recording...');
    };

    checkBuffer();
  }

  _attachEventListeners() {
    this.elements.startBtn.addEventListener('click', () => this.start());
    this.elements.stopBtn.addEventListener('click', () => this.stop());

    this.elements.delaySlider.addEventListener('input', (e) => {
      const delay = parseInt(e.target.value);
      this.frameBuffer.setDelay(delay);
      this.elements.delayValue.textContent = delay;
      this.elements.delayDisplay.textContent = `${delay}s`;

      // Update memory estimate (30fps * delay * 4 bytes per pixel * 1280*720)
      const estimatedMB = (30 * delay * 1280 * 720 * 4) / (1024 * 1024);
      document.getElementById('memory-estimate').textContent = estimatedMB.toFixed(1);
    });

    this.elements.fullscreenBtn.addEventListener('click', () => {
      this._toggleFullscreen();
    });

    // Stop camera when tab becomes hidden or browser closes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !this.elements.startBtn.disabled) {
        this.stop();
        this.showStatus('Camera stopped (tab hidden)');
      }
    });

    window.addEventListener('beforeunload', () => {
      if (!this.elements.startBtn.disabled) {
        this.stop();
      }
    });

    window.addEventListener('pagehide', () => {
      if (!this.elements.startBtn.disabled) {
        this.stop();
      }
    });
  }

  _toggleFullscreen() {
    const elem = document.documentElement;

    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  showStatus(message, type = 'info') {
    this.elements.status.textContent = message;
    this.elements.status.className = `status ${type}`;
  }
}
