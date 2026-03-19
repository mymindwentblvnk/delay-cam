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
      flipCameraBtn: document.getElementById('flip-camera-btn'),
      fullscreenBtn: document.getElementById('fullscreen-btn'),
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

    // Default to rear camera
    this.facingMode = 'environment';

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

        // Update memory estimate
        const estimatedMB = (30 * delay * 1280 * 720 * 4) / (1024 * 1024);
        document.getElementById('memory-estimate').textContent = estimatedMB.toFixed(1);

        console.log(`Loaded saved delay: ${delay}s`);
      }
    }

    // Load saved camera facing mode from localStorage
    const savedFacingMode = localStorage.getItem('delaycam-camera');
    if (savedFacingMode === 'user' || savedFacingMode === 'environment') {
      this.facingMode = savedFacingMode;
      console.log(`Loaded saved camera: ${this.facingMode}`);
    }
  }

  _saveDelay(delay) {
    localStorage.setItem('delaycam-delay', delay.toString());
    console.log(`Saved delay: ${delay}s`);
  }

  _saveCamera(facingMode) {
    localStorage.setItem('delaycam-camera', facingMode);
    console.log(`Saved camera: ${facingMode}`);
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
      const cameraName = this.facingMode === 'environment' ? 'Rear Camera' : 'Front Camera';

      if (this.elements.currentCamera) {
        this.elements.currentCamera.textContent = cameraName;
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

      // Request camera with saved/current facing mode
      // Use exact facingMode for iOS to force specific camera
      const constraints = {
        video: {
          facingMode: { exact: this.facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      console.log(`Requesting camera with facingMode: ${this.facingMode}`);

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Log which camera we actually got
      const videoTrack = this.stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      console.log(`Camera initialized: ${settings.facingMode || 'unknown'} camera (requested: ${this.facingMode})`);

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

  async flipCamera() {
    try {
      console.log('Flip camera button clicked');

      // Toggle facing mode
      this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
      this._saveCamera(this.facingMode);

      const cameraName = this.facingMode === 'environment' ? 'Rear' : 'Front';
      console.log(`Switching to ${cameraName} camera`);

      // If camera is running, restart it with new facing mode
      const wasRunning = !this.elements.startBtn.disabled;

      if (wasRunning) {
        this.showStatus(`Switching to ${cameraName} camera...`);

        // Stop current stream and ensure complete cleanup
        this.stop();

        // Longer delay for iOS to fully release camera
        await new Promise(resolve => setTimeout(resolve, 800));

        // Restart with new camera
        await this.start();

        console.log('Camera switch complete');
      } else {
        // Camera not running, just save the preference
        this.showStatus(`${cameraName} camera will be used when you start`, 'info');
        setTimeout(() => {
          this.showStatus('Tap "Start Camera" to begin');
        }, 2000);
      }

      console.log(`Camera switched to: ${this.facingMode}`);
    } catch (error) {
      console.error('Flip camera error:', error);
      this.showStatus(`Error switching camera: ${error.message}`, 'error');
    }
  }

  _attachEventListeners() {
    this.elements.startBtn.addEventListener('click', () => this.start());
    this.elements.stopBtn.addEventListener('click', () => this.stop());

    this.elements.flipCameraBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await this.flipCamera();
    });

    this.elements.delaySlider.addEventListener('input', (e) => {
      const delay = parseInt(e.target.value);
      this.frameBuffer.setDelay(delay);
      this.elements.delayValue.textContent = delay;
      this.elements.delayDisplay.textContent = `${delay}s`;

      // Update memory estimate (30fps * delay * 4 bytes per pixel * 1280*720)
      const estimatedMB = (30 * delay * 1280 * 720 * 4) / (1024 * 1024);
      document.getElementById('memory-estimate').textContent = estimatedMB.toFixed(1);

      // Save to localStorage
      this._saveDelay(delay);
    });

    this.elements.fullscreenBtn.addEventListener('click', () => {
      this._toggleFullscreen();
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
