# Standalone 3D About page

This integration is staged on a feature branch, not main. The standalone About page is `/about.html`; its original approved JavaScript and CSS are in `src/about/`. Only the model URL and a return-home link were changed. No existing homepage file has been replaced.

## Required original 3D head asset

The exact approved model is a 20 MB binary from the separate `Johnwolf-connect/john-wolf-3d-head` repository. The binary is NOT included in this branch. In a Codespace with both repositories checked out, run:

```bash
cd /workspaces/John-Connect-site
bash scripts/copy-approved-about-model.sh
git add public/about/head-interactive.glb
git commit -m 'Include approved 3D head model'
```

The standalone About application cannot render the 3D head until that file is present. Do not substitute a different head model.

## Connecting the approved homepage

The exact approved animated homepage has not been identified in the current GitHub main branch and should not be overwritten. Once restored, make its existing More About Me action complete the purple splash first, then navigate to `/about.html` (for example, `window.location.assign('/about.html')` inside the transition completion handler). Keep all existing typography and timings.

## Checks

Run `npm install && npm run build`. Confirm `/about.html` works in dev and preview, the head is solid, ripple starts from behind the moving head's center, recoil remains directional, and the home link returns to `/`. Also test `More About Me` and purple splash once wired. None of these visual checks have yet been performed.
