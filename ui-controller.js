class UIController {
  constructor(bufferManager, cameraHandler) {
    this.bufferManager = bufferManager;
    this.cameraHandler = cameraHandler;
    this.updateInterval = null;

    this.elements = {
      liveVideo: document.getElementById('live-video'),
      delayedVideo: document.getElementById('delayed-video'),
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

      // Initialize camera (must be called from user gesture)
      const stream = await this.cameraHandler.initialize();

      // Display live preview
      this.elements.liveVideo.srcObject = stream;

      // Start recording
      this.cameraHandler.startRecording();

      // Start updating delayed video
      this._startDelayedPlayback();

      this.elements.startBtn.disabled = true;
      this.elements.stopBtn.disabled = false;
      this.showStatus('Recording...');
    } catch (error) {
      this.showStatus(`Error: ${error.message}`, 'error');
    }
  }

  stop() {
    this.cameraHandler.stopRecording();
    this.bufferManager.clear();

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.stopDelayedPlayback) {
      this.stopDelayedPlayback();
      this.stopDelayedPlayback = null;
    }

    this.elements.liveVideo.srcObject = null;
    this.elements.delayedVideo.src = '';
    this.elements.countdown.classList.add('hidden');

    this.elements.startBtn.disabled = false;
    this.elements.stopBtn.disabled = true;
    this.showStatus('Stopped');
  }

  _startDelayedPlayback() {
    let lastBlobUrl = null;
    let bufferStartTime = Date.now();
    let countdownInterval = null;
    let playbackInterval = null;
    let isFirstSegment = true;

    // Show countdown overlay
    this.elements.countdown.classList.remove('hidden');

    // Update countdown every 100ms
    countdownInterval = setInterval(() => {
      const elapsedMs = Date.now() - bufferStartTime;
      const remainingMs = this.bufferManager.delayMs - elapsedMs;
      const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));

      this.elements.countdownTimer.textContent = remainingSeconds;

      if (remainingSeconds === 0 && countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
    }, 100);

    // Wait for initial buffer, then start continuous playback
    const startContinuousPlayback = () => {
      if (!this.bufferManager.hasEnoughData()) {
        setTimeout(startContinuousPlayback, 500);
        return;
      }

      // Hide countdown
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
      this.elements.countdown.classList.add('hidden');
      this.showStatus('Recording...');

      // Update delayed video every 2 seconds
      playbackInterval = setInterval(() => {
        const segment = this.bufferManager.getDelayedSegment();

        if (!segment) {
          console.log('No delayed segment available');
          return;
        }

        console.log(`Playing delayed segment: ${(segment.blob.size / 1024).toFixed(1)}KB, type: ${segment.mimeType}`);

        // Clean up old blob URL
        if (lastBlobUrl) {
          URL.revokeObjectURL(lastBlobUrl);
        }

        lastBlobUrl = URL.createObjectURL(segment.blob);

        // Update video src and play
        const video = this.elements.delayedVideo;
        const previousSrc = video.src;
        video.src = lastBlobUrl;

        // Force load and play
        video.load();
        video.play().then(() => {
          if (isFirstSegment) {
            console.log('First delayed segment playing successfully!');
            isFirstSegment = false;
          }
        }).catch(err => {
          console.error('Delayed video play error:', err);
        });
      }, 2000); // Update every 2 seconds (matches segment duration)
    };

    startContinuousPlayback();

    // Store the cleanup function
    this.stopDelayedPlayback = () => {
      if (lastBlobUrl) {
        URL.revokeObjectURL(lastBlobUrl);
        lastBlobUrl = null;
      }
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
      if (playbackInterval) {
        clearInterval(playbackInterval);
        playbackInterval = null;
      }
      this.elements.delayedVideo.onended = null;
      this.elements.countdown.classList.add('hidden');
    };
  }

  _attachEventListeners() {
    this.elements.startBtn.addEventListener('click', () => this.start());
    this.elements.stopBtn.addEventListener('click', () => this.stop());

    this.elements.delaySlider.addEventListener('input', (e) => {
      const delay = parseInt(e.target.value);
      this.bufferManager.setDelay(delay);
      this.elements.delayValue.textContent = delay;
      this.elements.delayDisplay.textContent = `${delay}s`;

      // Update memory estimate (2.5 Mbps bitrate / 8 = MB per second)
      const estimatedMB = (2.5 * delay / 8).toFixed(1);
      document.getElementById('memory-estimate').textContent = estimatedMB;
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

    // Stop camera when page unloads (browser close, navigation)
    window.addEventListener('beforeunload', () => {
      if (!this.elements.startBtn.disabled) {
        this.stop();
      }
    });

    // Additional handler for mobile (more reliable)
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
      } else if (elem.webkitRequestFullscreen) { // iOS Safari
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
