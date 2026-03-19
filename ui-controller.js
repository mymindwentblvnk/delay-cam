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
      infoBtn: document.getElementById('info-btn'),
      status: document.getElementById('status'),
      countdown: document.getElementById('countdown'),
      countdownTimer: document.querySelector('.countdown-timer'),
      infoModal: document.getElementById('info-modal'),
      closeModal: document.getElementById('close-modal'),
      deployTime: document.getElementById('deploy-time'),
      currentCamera: document.getElementById('current-camera'),
      currentDelay: document.getElementById('current-delay')
    };

    // Set deployment time
    this._setDeploymentTime();

    this._loadSavedDelay();
    this._attachEventListeners();
  }

  _loadSavedDelay() {
    // Load saved delay from localStorage
    const savedDelay = localStorage.getItem('delaycam-delay');

    if (savedDelay) {
      const delay = parseInt(savedDelay);

      // Validate delay is within range
      if (delay >= 5 && delay <= 30) {
        // Update UI
        this.elements.delaySlider.value = delay;
        this.elements.delayValue.textContent = delay;
        this.elements.delayDisplay.textContent = `${delay}s`;

        // Update buffer
        this.frameBuffer.setDelay(delay);

        console.log(`Loaded saved delay: ${delay}s`);
      }
    }
  }

  _saveDelay(delay) {
    localStorage.setItem('delaycam-delay', delay.toString());
    console.log(`Saved delay: ${delay}s`);
  }

  _setDeploymentTime() {
    // Build timestamp - will be updated during deployment
    const buildTimestamp = '2026-03-19T22:08:14Z'; // DEPLOYMENT_TIMESTAMP

    try {
      if (!this.elements.deployTime) {
        console.error('Deploy time element not found!');
        return;
      }

      const date = new Date(buildTimestamp);
      const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      };
      this.elements.deployTime.textContent = date.toLocaleString(undefined, options);
      console.log('Deployment time set:', this.elements.deployTime.textContent);
    } catch (error) {
      console.error('Error setting deployment time:', error);
      if (this.elements.deployTime) {
        this.elements.deployTime.textContent = buildTimestamp;
      }
    }
  }

  _openInfoModal() {
    console.log('Opening info modal');

    try {
      if (!this.elements.infoModal) {
        console.error('Info modal element not found!');
        return;
      }

      // Update current settings
      if (this.elements.currentCamera) {
        this.elements.currentCamera.textContent = 'Rear Camera';
      }

      if (this.elements.currentDelay) {
        this.elements.currentDelay.textContent = `${this.elements.delayValue.textContent}s`;
      }

      // Show modal
      this.elements.infoModal.classList.remove('hidden');
      console.log('Info modal opened');
    } catch (error) {
      console.error('Error opening info modal:', error);
    }
  }

  _closeInfoModal() {
    console.log('Closing info modal');

    if (this.elements.infoModal) {
      this.elements.infoModal.classList.add('hidden');
    }
  }

  async start() {
    try {
      this.showStatus('Starting camera...');

      // Request rear camera
      // Try with exact first (needed for iOS), fallback to non-exact if it fails
      let stream;

      try {
        // Try exact constraint first (works on iOS/Safari)
        const exactConstraints = {
          video: {
            facingMode: { exact: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        };

        console.log('Requesting rear camera with exact constraint');
        stream = await navigator.mediaDevices.getUserMedia(exactConstraints);
      } catch (exactError) {
        // Fallback to non-exact constraint (works on Firefox/Chrome)
        console.log('Exact constraint failed, trying non-exact:', exactError.message);

        const fallbackConstraints = {
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        };

        stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
      }

      this.stream = stream;

      // Log which camera we actually got
      const videoTrack = this.stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      console.log(`Camera initialized: ${settings.facingMode || 'unknown'} (rear camera)`);

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

      // Clean up on error
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
      this.elements.startBtn.disabled = false;
      this.elements.stopBtn.disabled = true;
    }
  }

  stop() {
    console.log('Stopping camera...');

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

    // Critical: Stop all tracks and clear stream immediately
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped track: ${track.kind}, facing: ${track.getSettings().facingMode}`);
      });
      this.stream = null;
    }

    this.frameBuffer.clear();

    // Clear video source
    this.elements.liveVideo.srcObject = null;
    this.elements.countdown.classList.add('hidden');

    this.elements.startBtn.disabled = false;
    this.elements.stopBtn.disabled = true;

    console.log('Camera stopped');
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

      // Save to localStorage
      this._saveDelay(delay);
    });

    this.elements.infoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Info button clicked');
      this._openInfoModal();
    });

    this.elements.closeModal.addEventListener('click', (e) => {
      e.preventDefault();
      this._closeInfoModal();
    });

    // Close modal when clicking outside
    this.elements.infoModal.addEventListener('click', (e) => {
      if (e.target === this.elements.infoModal) {
        this._closeInfoModal();
      }
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

  showStatus(message, type = 'info') {
    this.elements.status.textContent = message;
    this.elements.status.className = `status ${type}`;
  }
}
