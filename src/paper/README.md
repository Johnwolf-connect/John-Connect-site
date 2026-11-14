# Paper motion review

Open `/paper-preview/` after starting Vite. This isolated entry does not replace the homepage or change Projects, Design Tools, About, or Contact.

## Source and scope

The user supplied Premotio's `DEF_5RhL.js` and `C69exm3b.js` to reproduce Hole 01. The motion solver, sheet deformation, deterministic random generator, paper shaders, and lens pass were adapted to the repository's Three.js dependency. The original Hole 01 settings are in `preset.js`. No Premotio editor, account state, remote runtime, or media service is loaded by the preview.

The logical artboard is 1080 units tall. Artwork uses existing repository images with natural aspect ratios. The exact media list and saved settings from the original Premotio project were not supplied; identical image order and pixel-for-pixel matching are not claimed.

Layer order: title, transparent paper canvas, information, head canvas. This deliberately covers the homepage state only. Title cycling, the shared 3D scene, two-turn head/card orbit, and the next section's arrangement remain to be integrated. Do not use the separate canvases for the transition: cards must then be able to occlude the head correctly in a shared depth space.

The head loads the existing Codespace asset at `/models/about/head-interactive.glb`; it is ignored by Git as before. Missing assets or WebGL failures are reported visibly. Pause, timeline scrubbing, and the Cards only toggle support visual review. Reduced-motion preference pauses playback on entry.

## Verification

Run `node --test tests/*.test.js`, `npm run build`, and `git diff --check`. Browser controls and composition can be inspected without WebGL, but actual sheet rendering and head appearance require WebGL. Build and math tests do not establish visual equivalence. The supplied recording is the visual acceptance reference.
