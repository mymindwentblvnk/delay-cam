# DelayCam - Sports Training Video Delay App

Instant video feedback for sports and fitness training. See yourself from X seconds ago while performing exercises - like a delayed mirror for self-correction.

## Features

- **Continuous delayed playback** - See yourself 5-30 seconds in the past
- **Dual-view layout** - Small live preview + large delayed playback
- **No video storage** - Everything stays in memory, auto-discarded
- **iOS Safari compatible** - Works on iPhone/iPad with optimizations
- **PWA support** - Add to home screen for full-screen experience
- **Adjustable delay** - Configure 5-30 second delays in real-time
- **Automatic cleanup** - Camera stops when switching tabs or closing browser

## Quick Start

### Local Development
```bash
# Clone the repository
git clone https://github.com/<username>/delay-cam.git
cd delay-cam

# Start local server
python3 -m http.server 8000

# Open browser
open http://localhost:8000
```

### Production Deployment

The app automatically deploys to GitHub Pages on every push to `main`:

1. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Source: "GitHub Actions"
   - Save

2. **Push to main:**
   ```bash
   git add .
   git commit -m "Deploy DelayCam"
   git push origin main
   ```

3. **Access app:**
   - `https://<username>.github.io/delay-cam/`
   - HTTPS required for camera access

## Usage

1. Tap **Start Camera** button (requires permission)
2. Small **live preview** appears in top-right corner
3. Large **delayed playback** shows you from X seconds ago
4. Adjust **delay slider** to change feedback timing (5-30 seconds)
5. Tap **Info** button (ℹ️) to see deployment time and settings
6. Tap **Stop** when finished

## iOS Setup (Recommended)

For the best experience on iPhone/iPad:

1. Open app in Safari
2. Tap Share button → "Add to Home Screen"
3. Launch from home screen for full-screen mode
4. Grant camera permission when prompted

## Technical Details

### Architecture
- **Canvas-based frame capture** - Captures video frames at 15fps (640×360 resolution) using HTML5 Canvas
- **Frame buffer** - Stores frames in memory with timestamps
- **Memory-optimized** - Reduced resolution and frame rate for iOS stability
- **Automatic cleanup** - Removes old frames continuously
- **No video encoding** - Direct frame-to-canvas display (bypasses iOS codec issues)

### Browser Support
- **iOS Safari 14+** (primary target)
- **Chrome/Edge** (desktop and Android)
- **Firefox** (desktop and Android)

### Memory Usage (15fps @ 640×360)
- 5 seconds: ~6.6 MB
- 10 seconds: ~13.2 MB (default)
- 15 seconds: ~19.8 MB
- 20 seconds: ~26.4 MB
- 30 seconds: ~39.6 MB

*All memory is temporary RAM - deleted when you stop the camera*

**Optimized for iOS:** Resolution and frame rate tuned to prevent crashes on mobile devices while maintaining clear video quality for sports training feedback.

### Privacy & Security

**100% Privacy-First Design - No Video Recording or Storage**

DelayCam is built with complete privacy in mind. Your video is **never saved, never uploaded, and never leaves your device**.

#### What Happens to Your Video?

**Zero Permanent Storage:**
- ✅ **All processing in browser memory (RAM)** - Video frames exist only temporarily in memory
- ✅ **No files written to disk** - Nothing saved to your device storage
- ✅ **No cloud uploads** - Zero network communication for video data
- ✅ **No server backend** - Pure client-side web application
- ✅ **Immediate deletion** - All video data deleted when you press Stop
- ✅ **Automatic cleanup** - Memory released when you close the app

**How It Works:**
1. Camera captures live frames → stored in JavaScript array in RAM
2. Delayed frames displayed on canvas → read from RAM
3. Press Stop → all data immediately deleted from memory
4. Close browser → all data permanently gone, cannot be recovered

#### Network Activity

**Zero Video Uploads - Verified:**
- No `fetch()`, `XMLHttpRequest`, or AJAX calls for video data
- No API endpoints or server communication
- Only network activity: Initial page load (HTML/CSS/JS files)
- Works completely offline after initial load

**You can verify this yourself:**
1. Open browser DevTools (F12) → Network tab
2. Start camera and use the app
3. You'll see: **Zero video uploads** (only initial page assets)

#### What IS Stored

**Only tiny user preference in localStorage:**
- Delay setting (e.g., "10") - ~10 bytes
- **Total:** ~10 bytes of plain text
- **No video, no images, no personal data**
- **Note:** Camera is always rear-facing (no preference stored)

#### Security Features

- ✅ **HTTPS required** - Secure camera access (browsers enforce this)
- ✅ **Camera permission prompt** - Explicit user consent required
- ✅ **Auto-stop on tab switch** - Camera turns off when you leave the tab
- ✅ **Auto-stop on close** - Camera turns off when closing browser
- ✅ **No microphone access** - Audio disabled (`audio: false`)
- ✅ **Open source** - All code visible on GitHub for inspection

#### Privacy Summary

| Question | Answer |
|----------|--------|
| Is video recorded? | No - only displayed in real-time |
| Is video saved to disk? | No - only exists in temporary RAM |
| Is video uploaded anywhere? | No - zero network uploads |
| Can I use it offline? | Yes - works offline after initial load |
| What data leaves my device? | None - 100% local processing |
| Can the video be recovered? | No - permanently deleted when stopped |

**Perfect for sensitive training environments** where privacy is critical - sports training, physical therapy, dance practice, etc.

**Trust but verify:** The entire source code is available on GitHub. You can inspect every line to confirm there are no hidden uploads or storage.

## Use Cases

- **Sports training** - Golf swing, tennis serve, basketball form
- **Fitness coaching** - Squat depth, deadlift form, yoga poses
- **Dance practice** - Choreography review, posture correction
- **Martial arts** - Technique refinement, movement analysis
- **Physical therapy** - Exercise form verification

## Development

### File Structure
```
delay-cam/
├── index.html              # Main app structure
├── styles.css              # Mobile-first styling
├── app.js                  # App orchestration
├── frame-buffer.js         # Frame buffer with timestamps
├── frame-capture.js        # Canvas-based frame capture
├── frame-player.js         # Delayed frame playback
├── ui-controller.js        # UI interactions & camera control
├── manifest.json           # PWA configuration
├── update-timestamp.sh     # Deployment timestamp updater
└── .github/workflows/
    └── deploy.yml          # Auto-deployment with timestamp
```

### Key Components

**FrameBuffer** - Manages frame storage with configurable delay
- `addFrame(imageData)` - Stores captured frame with timestamp
- `getDelayedFrame()` - Returns frame from X seconds ago
- `setDelay(seconds)` - Updates delay duration
- `clear()` - Removes all frames from memory

**FrameCapture** - Captures frames from live video
- `start()` - Begins capturing frames at 30fps to canvas
- `captureFrame()` - Draws video frame to canvas and extracts ImageData
- `stop()` - Stops frame capture

**FramePlayer** - Displays delayed frames
- `start()` - Begins displaying delayed frames at 30fps
- `displayFrame()` - Renders delayed frame from buffer to canvas
- `stop()` - Stops playback

**UIController** - Manages UI state and camera control
- `start()` - Initializes camera and starts frame capture/playback
- `stop()` - Stops everything and cleans up memory
- `flipCamera()` - Switches between front/rear cameras
- `showStatus(message, type)` - Displays status messages

## Troubleshooting

**Camera won't start:**
- Ensure HTTPS connection (or localhost for testing)
- Check browser camera permissions
- Try reloading the page

**Delayed video not showing:**
- Wait for configured delay duration (default 10 seconds)
- Check browser console for errors
- Verify camera is recording (live preview should show)

**Memory issues on iOS:**
- Reduce delay to 10 seconds or less
- Close other browser tabs
- Restart Safari if needed

**Auto-stop not working:**
- This is a feature, not a bug! Camera stops automatically when:
  - Switching to another tab
  - Closing the browser
  - App goes to background

## License

MIT License - Use freely for personal and commercial projects.

## Contributing

Issues and pull requests welcome at https://github.com/<username>/delay-cam
