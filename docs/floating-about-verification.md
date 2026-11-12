# Floating About verification checkpoint

The integration remains on integrate-floating-about, Draft PR #3. Do not merge yet.

Implemented:
- Pixel-for-pixel parent/iframe scroll synchronization using measured content height.
- Instant wheel forwarding, with line/page delta normalization.
- Touch and keyboard forwarding; browser zoom and interactive controls retain their input.
- Parent-window and origin validation for messages.
- Pause the head renderer while About is offscreen or the document hidden.
- Correct floppy URL under /models/about/floppy/ and respect reduced motion for its rocking.
- Keyboard-accessible Enter reaction and initialized headline displacement measurements.

Verified in silver chainsaw:
- node --test tests/floating-about.test.js: 2 passing tests.
- npm run build: passes; existing large About chunk warning remains.
- git diff --check: passes.
- Chrome: About navigation, wheel movement over iframe (600px), PageDown movement (588px).
- Responsive layout at 390x844: frame 390x844, document width 390, content-height synchronization.

Outstanding:
- Copy original head and floppy assets, then validate model, textures, blinking morphs, tracking, hit/recovery, optical ripple, color toggle, full chapter flow and Contact exit.
- silver chainsaw Git credentials return 403 for the private john-wolf-3d-head repository.
- Repository ZIP downloaded through authenticated GitHub to /Users/Wolf/Downloads/john-wolf-3d-head-main.zip. Browser upload is blocked until ChatGPT extension Allow access to file URLs is enabled.
- Transfer ZIP into Codespace, extract outside portfolio, run scripts/copy-about-assets.sh with HEAD_REPO pointing to extracted source, and verify binary completeness.
- Existing local deletion public/john-wolf-portrait.webp and untracked public/homepage-canva/ predate this work and were not staged or changed.

Passing compilation is not approval of the 3D experience. No merge or production deployment performed.
