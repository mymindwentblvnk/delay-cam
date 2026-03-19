// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const bufferManager = new VideoBufferManager(10); // 10 second default delay

  const cameraHandler = new CameraHandler((chunk) => {
    bufferManager.addChunk(chunk);
  });

  const uiController = new UIController(bufferManager, cameraHandler);

  // Show initial instructions
  uiController.showStatus('Tap "Start Camera" to begin');
});
