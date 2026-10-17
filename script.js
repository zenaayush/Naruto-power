const vElement = document.getElementById('v_src');
    const cElement = document.getElementById('out');
    const ctx = cElement.getContext('2d');
    const n = document.getElementById('n');
    const s = document.getElementById('s');
    const statusEl = document.getElementById('status');

    let pwr = [0, 0];
    let wasOpen = [false, false];
    let sending = false;

    function showStatus(title, detail, options = {}) {
      const { hint = '', retry = false } = options;
      statusEl.classList.remove('hidden');
      statusEl.innerHTML = `<div>
        <h1>${title}</h1>
        <p>${detail}</p>
        ${hint ? `<code>${hint}</code>` : ''}
        ${retry ? '<br><button type="button" id="retry-cam">Try again</button>' : ''}
      </div>`;
      const btn = document.getElementById('retry-cam');
      if (btn) btn.onclick = () => start(true);
    }

    function hideStatus() {
      statusEl.classList.add('hidden');
    }

    function checkOpen(pts) {
      let count = 0;
      const wrist = pts[0];
      const tips = [8, 12, 16, 20];
      const pips = [6, 10, 14, 18];
      for (let i = 0; i < tips.length; i++) {
        const tip = pts[tips[i]];
        const pip = pts[pips[i]];
        if (Math.hypot(tip.x - wrist.x, tip.y - wrist.y) > Math.hypot(pip.x - wrist.x, pip.y - wrist.y)) count++;
      }
      return count >= 3;
    }

    function onResults(res) {
      if (!vElement.videoWidth) return;

      // Avoid resetting the canvas on every result frame.
      // A resize clears it, so only do this when the camera size changes.
      if (cElement.width !== vElement.videoWidth ||
          cElement.height !== vElement.videoHeight) {
        cElement.width = vElement.videoWidth;
        cElement.height = vElement.videoHeight;
      }
      ctx.save();
      ctx.clearRect(0, 0, cElement.width, cElement.height);

      let fL = false;
      let fR = false;

      n.style.display = 'none';
      s.style.display = 'none';

      if (res.multiHandLandmarks && res.multiHandedness) {
        res.multiHandLandmarks.forEach((pts, i) => {
          const label = res.multiHandedness[i].label;
          const isR = label === 'Right';
          const idx = isR ? 1 : 0;

          ctx.save();
          // Keep the hand skeleton visible, with a lighter glow for smoother drawing.
          ctx.shadowBlur = 4;
          ctx.shadowColor = '#4d5dfa';

          drawConnectors(ctx, pts, HAND_CONNECTIONS, {
            color: '#00d4ff',
            lineWidth: 3
          });

          drawLandmarks(ctx, pts, {
            color: '#4d5dfa',
            lineWidth: 1,
            radius: 2
          });
          ctx.restore();

          const open = checkOpen(pts);
          pwr[idx] += open ? 0.05 : -0.15;
          pwr[idx] = Math.max(0, Math.min(1, pwr[idx]));

          if (open && !wasOpen[idx]) {
            const vid = isR ? s : n;
            vid.currentTime = 0;
            vid.play().catch(() => {});
          }
          wasOpen[idx] = open;

          const wrist = pts[0];
          const knk = pts[9];

          if (pwr[idx] > 0.01) {
            if (isR) {
              fR = true;
              const tx = (wrist.x + knk.x) / 2;
              const ty = (wrist.y + knk.y) / 2;
              s.style.left = `${(1 - tx) * window.innerWidth}px`;
              s.style.top = `${ty * window.innerHeight}px`;
              s.style.display = 'block';
              s.style.opacity = pwr[idx];
            } else {
              fL = true;
              const dx = knk.x - wrist.x;
              const dy = knk.y - wrist.y;
              const tx = knk.x + (dx * 0.8);
              const ty = knk.y + (dy * 0.8);
              n.style.left = `${(1 - tx) * window.innerWidth}px`;
              n.style.top = `${(ty * window.innerHeight) - 120}px`;
              n.style.display = 'block';
              n.style.opacity = pwr[idx];
            }
          }
        });
      }

      if (!fL) {
        pwr[0] = Math.max(0, pwr[0] - 0.15);
        if (pwr[0] > 0.01) { n.style.display = 'block'; n.style.opacity = pwr[0]; }
        wasOpen[0] = false;
      }
      if (!fR) {
        pwr[1] = Math.max(0, pwr[1] - 0.15);
        if (pwr[1] > 0.01) { s.style.display = 'block'; s.style.opacity = pwr[1]; }
        wasOpen[1] = false;
      }
      ctx.restore();
    }

    function cameraErrorMessage(err) {
      const name = err && err.name ? err.name : 'Error';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        return ['Camera blocked', 'Allow camera access for this site, then click Try again.'];
      }
      if (name === 'NotReadableError' || name === 'TrackStartError') {
        return [
          'Camera in use',
          'Close other tabs/apps using the webcam (Zoom, Teams, Discord, Cursor Simple Browser, another Chrome tab of this page), then click Try again.'
        ];
      }
      if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        return ['No camera found', 'Connect a webcam, then click Try again.'];
      }
      if (location.protocol === 'file:') {
        return ['Cannot use camera from a file', 'Open this page through Live Server or a local http URL, not by double-clicking the file.'];
      }
      return ['Camera failed', err && err.message ? err.message : String(err)];
    }

    let hands = null;
    let camera = null;

    async function start(isRetry = false) {
      showStatus('Starting camera…', 'Allow camera access when prompted. Open your hand to trigger power effects.');

      if (typeof Hands !== 'function' || typeof Camera !== 'function') {
        showStatus('MediaPipe failed to load', 'Check your internet connection, then refresh.', { retry: true });
        return;
      }

      if (location.protocol === 'file:') {
        showStatus(
          'Open via local server',
          'Double-clicking the HTML file blocks the camera / hand tracker. Use Live Server, or run this in a terminal from the project folder:',
          { hint: 'python -m http.server 8765' }
        );
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showStatus('Camera API unavailable', 'Use Chrome or Edge on localhost / https.', { retry: true });
        return;
      }

      if (vElement.srcObject) {
        vElement.srcObject.getTracks().forEach((t) => t.stop());
        vElement.srcObject = null;
      }
      if (camera && typeof camera.stop === 'function') {
        try { camera.stop(); } catch (_) {}
        camera = null;
      }

      if (!hands) {
        hands = new Hands({
          locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
        });
        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 0,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6
        });
        hands.onResults(onResults);
      }

      try {
        camera = new Camera(vElement, {
          onFrame: async () => {
            if (sending || !vElement.videoWidth) return;
            sending = true;
            try {
              await hands.send({ image: vElement });
            } catch (e) {
              console.error(e);
            } finally {
              sending = false;
            }
          },
          // 960x540 reduces tracking work on many phones and laptops.
          // The browser may choose a nearby supported camera mode.
          width: 960,
          height: 540
        });
        await camera.start();
        hideStatus();
      } catch (err) {
        console.error(err);
        const [title, detail] = cameraErrorMessage(err);
        showStatus(title, detail, { retry: true });
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => start());
    } else {
      start();
    }
