# Shinobi Power FX

A browser-based hand-tracking effects project powered by MediaPipe Hands.

## Run on Android (Termux)

You do not need to download the project files individually. Clone the GitHub repository and run it directly.

### 1. Install requirements

```bash
pkg update -y && pkg upgrade -y
pkg install git python -y
```

### 2. Clone the repository

```bash
git clone https://github.com/zenaayush/Shinobi-power.git
```

### 3. Enter the project folder

```bash
cd Shinobi-power
```

### 4. Start the local server

```bash
python -m http.server 8765
```

### 5. Open in your browser

Visit:

```text
http://localhost:8765
```

Allow camera permission when your browser asks.

## Update the project

To get the latest changes from GitHub later, stop the server with `Ctrl + C`, then run:

```bash
cd Shinobi-power
git pull
python -m http.server 8765
```

## Project files

- `index.html` — page structure and MediaPipe library imports
- `style.css` — page layout and visual styling
- `script.js` — camera, hand tracking, and effects logic
- `assets/` — video assets used by the effects

## Required video files

Make sure these exact files are present in the `assets` folder:

- `assets/naruto.mp4`
- `assets/sasuke.mp4`

## Notes

- Camera access requires `localhost` or HTTPS. Use `http://localhost:8765` when running locally.
- An internet connection is needed to load the MediaPipe libraries from jsDelivr.
- Camera smoothness depends on your device and browser.
