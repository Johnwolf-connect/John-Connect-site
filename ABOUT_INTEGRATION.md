# Separate 3D About page integration

This work lives on the **draft feature branch** `feature/standalone-3d-about-page`, not on `main`. It preserves the original standalone repository. The portfolio homepage is loaded from an existing animated hero branch and its **More about me** action now completes the purple title-letter fly-through before navigating to `/about.html`.

The About experience is a separate Vite HTML entry (`about.html`) with its own code in `src/about/`; it is **not mounted on the homepage**.

## Required assets

### 1. Exact approved 3D head

The verified 20,022,596-byte `head-interactive.glb` is present at `/workspaces/john-wolf-3d-head/web/public/head-interactive.glb` in the original repository (Git blob SHA `42fa6e31d60018fba35e2d553ae7f67e0b10924f`). GitHub doesn't permit reusing an object SHA from another independent repository, so it must be copied as a file. In Codespaces with both repositories checked out:

```bash
cd /workspaces/John-Connect-site
git fetch origin
git switch feature/standalone-3d-about-page
bash scripts/copy-approved-about-model.sh
git add -f public/about/head-interactive.glb
git commit -m 'Add approved 3D head asset'
git push origin feature/standalone-3d-about-page
```

Do not substitute a different model. The `-f` on git add is required because this portfolio repository ignores `*.glb`.

### 2. Homepage Canva SVGs

The original animated hero expects its individual title/overlay SVGs, Man.svg, and other artwork in `public/homepage-canva/`. **Those files are not in the GitHub branches currently inspected.** Restore them from the approved homepage source asset package before visual approval. Never silently substitute generated or guessed title artwork.

## Test

```bash
cd /workspaces/John-Connect-site
npm ci
npm run build
npm run dev
```

Verify root homepage, the purple letters' expansion from the title, automatic navigation to `/about.html`, solid head, center-origin optical ripple behind the head, click recoil and shake-off, scroll-following story text, and returning home via the Home link. Check both desktop and mobile.

**Not tested visually. Do not merge until the head model and homepage SVGs are present and browser testing is complete.**
