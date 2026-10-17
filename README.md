# Hand Effects

A browser-based hand-tracking effects project using MediaPipe Hands.

## Project files

- `index.html` — page structure and MediaPipe library imports
- `style.css` — page layout and visual styling
- `script.js` — camera, hand tracking, and effects logic
- `assets/` — add your existing `naruto.mp4` and `sasuke.mp4` files here

## Run locally

Camera access generally requires HTTPS or localhost. From this folder, run:

```bash
python -m http.server 8765
```

Then open `http://localhost:8765`.

Keep the video files at these exact paths:

- `assets/naruto.mp4`
- `assets/sasuke.mp4`

## Notes

The project loads MediaPipe libraries from jsDelivr, so an internet connection is needed.
Camera smoothness depends on the device and browser.
