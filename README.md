# ATLANTA — THE ASCENT

React + React Three Fiber + Three.js + Vite. Uses the real platform and chrome UFO GLB models, locally included in `public/models`.

## Run on Mac

1. Extract the ZIP into a folder you control, e.g. `~/Desktop/atlanta-launch-react`.
2. Open **VS Code** → **File → Open Folder…** → select the extracted `atlanta-launch-react` folder.
3. In VS Code choose **Terminal → New Terminal**.
4. Run `npm install` (first time only), then `npm run dev`.
5. Open the localhost URL printed by Vite.

Requires Node.js 20.19+ or 22.12+.

## Current milestone

This is a real-model React migration and first implementation of the requested scroll trajectory. The precise visibility of the inner pad, roof geometry and aperture still needs to be inspected in the browser. Do not treat the staging as approved until it is visually verified.

## Structure

- `src/main.jsx` — 3D scene, camera trajectory, scroll progression, UI
- `src/style.css` — layout
- `public/models/platform.glb` — original platform
- `public/models/ufo.glb` — chrome-top detailed-bottom UFO


## Forward-exit update
The UFO now travels along negative Z through the front hangar opening before climbing. Camera remains behind the craft. Exact exit clearance and composition must be visually checked in the browser; coordinates are an initial path, not a verified collision-free trajectory.
