// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const bufferManager = new VideoBufferManager(10); // 10 second default delay

  const cameraHandler = new CameraHandler((blob, mimeType) => {
    bufferManager.addSegment(blob, mimeType);
  });

  const uiController = new UIController(bufferManager, cameraHandler);

  // Show initial instructions
  uiController.showStatus('Tap "Start Camera" to begin');

  console.log('DelayCam initialized');
});
