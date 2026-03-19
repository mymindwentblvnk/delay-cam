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
5. Tap **fullscreen** button for immersive experience
6. Tap **Stop** when finished

## iOS Setup (Recommended)

For the best experience on iPhone/iPad:

1. Open app in Safari
2. Tap Share button → "Add to Home Screen"
3. Launch from home screen for full-screen mode
4. Grant camera permission when prompted

## Technical Details

### Architecture
- **Circular buffer** stores video chunks with timestamps
- **MediaRecorder API** captures video at 2.5 Mbps
- **Memory-efficient** - Only keeps configured delay duration
- **Automatic cleanup** - Removes old chunks continuously

### Browser Support
- **iOS Safari 14+** (primary target)
- **Chrome/Edge** (desktop and Android)
- **Firefox** (desktop and Android)

### Memory Usage
- 5 seconds: ~1.6 MB
- 10 seconds: ~3.1 MB (default)
- 15 seconds: ~4.7 MB
- 20 seconds: ~6.3 MB
- 30 seconds: ~9.4 MB

### Privacy & Security
- **No uploads** - Everything processed locally
- **No storage** - Video discarded when stopped
- **HTTPS required** - Secure camera access
- **Auto-stop** - Camera shuts down when tab hidden or browser closed

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
├── camera-handler.js       # Camera access & recording
├── buffer-manager.js       # Circular buffer logic
├── ui-controller.js        # UI interactions
├── manifest.json           # PWA configuration
└── .github/workflows/
    └── deploy.yml          # Auto-deployment
```

### Key Components

**VideoBufferManager** - Manages circular buffer with configurable delay
- `addChunk(blob)` - Adds video chunk with timestamp
- `getPlayableChunks()` - Returns chunks for current delay
- `setDelay(seconds)` - Updates delay duration
- `clear()` - Removes all chunks

**CameraHandler** - Handles camera access and recording
- `initialize()` - Requests camera permission
- `startRecording()` - Begins MediaRecorder capture
- `stopRecording()` - Stops camera and cleans up

**UIController** - Manages UI state and video playback
- `start()` - Initializes camera and starts recording
- `stop()` - Stops everything and cleans up
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
