# Floating About migration (isolated staging)

This branch preserves the existing portfolio's `main` branch and stages the original floating-head implementation for integration.

## Verified source inventory
- `src/floating-about/controller.js`: head pointer tracking, hit and motion states
- `src/floating-about/ripple.js`: surface ripple shader
- `src/floating-about/optical-ripple.js`: refractive click ripple
- `src/floating-about/floating-story.js`: 3D typography and scroll layout
- `src/floating-about/floppy.js`: separate 3D floppy renderer
- `src/floating-about/story-contour.js`: optional legacy contour logic
- `src/floating-about/standalone-main.js`, `standalone.css`, `standalone-reference.html`: unmodified reference implementation, NOT imported into the portfolio

## Important integration constraints
The existing portfolio is React/Vite, while the head experience is standalone Vite/Three.js with document-wide selectors, a global animation loop, fixed-position elements, and global styles. Importing the standalone entrypoint directly would mutate the portfolio DOM and conflict with its scroll and CSS.

Do not import the staged standalone files directly into `src/main.jsx`. First implement a scoped React mount/unmount boundary, refactor DOM queries and event handlers to that boundary, scope CSS, and dispose the renderers/observers/RAF loops on unmount.

## Missing binary assets — integration blocker
The original head loads `/head-interactive.glb` (fallback `/source_meshopt.glb`), and the floppy loads `/floppy/scene.gltf` with its referenced textures/buffers. These binary assets have NOT yet been copied. GitHub's text-file connector returns empty content for the large GLB, and the blob endpoint cannot decode the binary. Copy them via an authenticated Git checkout or Codespaces filesystem, preserving nested paths, to `public/models/about/` and adjust the loaders accordingly.

## Acceptance gates before switching About
1. Build the React component and verify assets load with HTTP 200 and no console errors.
2. Verify cursor tracking, head hit/shake, ripple, color switch, 3D text, floppy, and resize.
3. Verify navigation to `#about`, scroll continuity, footer exit, mobile, and reduced motion.
4. Run `npm run build` and browser checks on the integration branch.
5. Only then replace the old About section and merge the branch.

Rollback: discard the integration branch or revert its merge; `main` has not been modified.
