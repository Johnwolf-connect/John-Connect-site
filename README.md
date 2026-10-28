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

## Model asset synchronization

Running `npm run dev` now first runs `scripts/sync-models.mjs`. It checks
`public/models/` for the project's actual GLBs, then searches existing copies
under `assets/`, `~/Downloads`, and `~/Desktop` (up to three directory levels)
and copies exact filename matches into `public/models/` without overwriting
existing files.

Models currently referenced: `platform.glb`, `ufo.glb`,
`black_hole.glb`, `purple_planet.glb`, and
`audras_moon-web-optimized.glb`.

Use `npm run models` to rerun the check manually. Missing assets produce
warnings rather than invented replacements. The large original GLBs remain
excluded from Git history; GitHub code commits alone do **not** deliver binary
models that are absent from both your local system and repository.
