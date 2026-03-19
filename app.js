// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const frameBuffer = new FrameBuffer(10); // 10 second default delay

  const uiController = new UIController(frameBuffer);

  // Show initial instructions
  uiController.showStatus('Tap "Start Camera" to begin');

  console.log('DelayCam initialized with frame-based capture');
});
