import * as THREE from 'three';

/**
 * Screen-space refractive burst, modeled after the inspected reference lens.
 * The original model and its materials are never modified.
 * Separate source and silhouette passes prevent the head from being refracted.
 */
export function installOpticalRipple(renderer, scene, camera, headRoot, headlineLines = []) {
  const size = new THREE.Vector2();
  const clearColor = new THREE.Color();
  const source = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat, depthBuffer: true
  });
  // A canvas texture mirrors the DOM headline at its actual screen coordinates.
  // The DOM remains authoritative for font choice and layout.
  const headlineCanvas = document.createElement('canvas');
  const headlineCtx = headlineCanvas.getContext('2d');
  const headlineTexture = new THREE.CanvasTexture(headlineCanvas);
  headlineTexture.colorSpace = THREE.SRGBColorSpace;
  headlineTexture.minFilter = THREE.LinearFilter;
  headlineTexture.magFilter = THREE.LinearFilter;
  const headlineUniforms = {uHeadline:{value:headlineTexture},uHeadMask:{value:null}};
  const headlineScene = new THREE.Scene();
  const headlineMaterial = new THREE.ShaderMaterial({
    uniforms:headlineUniforms, transparent:true, depthTest:false, depthWrite:false,
    toneMapped:false,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:'uniform sampler2D uHeadline;uniform sampler2D uHeadMask;varying vec2 vUv;void main(){vec4 ink=texture2D(uHeadline,vUv);ink.a*=1.0-texture2D(uHeadMask,vUv).a;gl_FragColor=ink;}'
  });
  const headlineQuad = new THREE.Mesh(new THREE.PlaneGeometry(2,2),headlineMaterial);
  headlineQuad.frustumCulled=false;
  headlineScene.add(headlineQuad);
  const silhouette = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat, depthBuffer: true
  });
  headlineUniforms.uHeadMask.value=silhouette.texture;
  const maskMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff, side: THREE.DoubleSide, depthTest: true, depthWrite: true
  });
  const uniforms = {
    uBg: { value: source.texture },
    uHeadMask: { value: silhouette.texture },
    uHeadline: {value:headlineTexture},
    uRes: { value: new THREE.Vector2(1, 1) },
    uCursorUV: { value: new THREE.Vector2(.5, .5) },
    uRadiusPx: { value: 1 },
    uDissolve: { value: 1 },
    uTime: { value: 0 },
    uZoom: { value: .5 },
    uDispersion: { value: 1.64 },
    uGlow: { value: 11 },
    uWhiteGlow: { value: .285 },
    uBlueRing: { value: .9 },
    uRingRadius: { value: .49 },
    uRingWidth: { value: .08 },
    uRimStart: { value: .85 },
    uRimInward: { value: .2344 },
    uRimTangential: { value: 0 },
    uRimFreq1: { value: 12 },
    uRimFreq2: { value: 20 },
    uEdgeRingIntensity: { value: 1.053 },
    uEdgeRingWidth: { value: .06 },
    uEdgeRingSoftness: { value: 1 },
    uPurple: { value: new THREE.Color('#7740d1') }
  };
  const fragmentShader = `
    uniform sampler2D uBg;
    uniform sampler2D uHeadMask;
    uniform sampler2D uHeadline;
    uniform vec2 uRes;
    uniform vec2 uCursorUV;
    uniform float uRadiusPx;
    uniform float uDissolve;
    uniform float uTime;
    uniform float uZoom;
    uniform float uDispersion;
    uniform float uGlow;
    uniform float uWhiteGlow;
    uniform float uBlueRing;
    uniform float uRingRadius;
    uniform float uRingWidth;
    uniform float uRimStart;
    uniform float uRimInward;
    uniform float uRimTangential;
    uniform float uRimFreq1;
    uniform float uRimFreq2;
    uniform float uEdgeRingIntensity;
    uniform float uEdgeRingWidth;
    uniform float uEdgeRingSoftness;
    uniform vec3 uPurple;
    varying vec2 vUv;

    float gauss(float v, float width) {
      return exp(-pow(v / max(width, .00001), 2.0));
    }
    void main() {
      vec2 px = (vUv - uCursorUV) * uRes;
      float distancePx = length(px);
      float radius = max(uRadiusPx, .001);
      float nd = distancePx / radius;
      if (nd > 1.04) discard;
      float disc = 1.0 - smoothstep(.965, 1.015, nd);
      float rimStrength = smoothstep(uRimStart, 1.0, nd);
      vec2 radial = px / max(distancePx, .001);
      vec2 tangent = vec2(-radial.y, radial.x);
      float angle = atan(px.y, px.x);
      float fluidWave = sin(angle * uRimFreq1) * .55 +
                        sin(angle * uRimFreq2) * .25;

      // The reference fades glow first, restores original sample coordinates
      // next, and only then fades the optical overlay.
      float kGlow = 1.0 - smoothstep(0.0, .6, uDissolve);
      float kDistort = 1.0 - smoothstep(0.0, .8, uDissolve);
      vec2 offset = vUv - uCursorUV;
      float pull = uZoom * .30 * nd * nd * kDistort;
      vec2 rimOff = tangent * fluidWave * rimStrength *
                    radius * uRimTangential / uRes * kDistort;
      vec2 rimPull = -radial * rimStrength *
                     radius * uRimInward / uRes * kDistort;
      vec2 baseUV = uCursorUV + offset * (1.0 - pull) + rimOff + rimPull;

      float dispersion = uDispersion * .004 *
                         smoothstep(.60, 1.0, nd) * kDistort;
      vec2 chromaOffset = radial * length(offset) * dispersion;
      vec3 ca = vec3(0.0);
      vec3 weights = vec3(0.0);
      for(int i=0;i<8;i++){
        float t = float(i) / 7.0;
        vec2 sampleUV = clamp(baseUV + chromaOffset * (t - .5),
                              vec2(0.0), vec2(1.0));
        vec3 sceneColor = texture2D(uBg, sampleUV).rgb;
        vec4 headlinePixel = texture2D(uHeadline, sampleUV);
        vec3 sampleColor = mix(sceneColor, headlinePixel.rgb, headlinePixel.a);
        vec3 w = vec3(
          gauss(t, .38), gauss(t - .5, .38), gauss(t - 1.0, .38)
        );
        ca += sampleColor * w;
        weights += w;
      }
      vec3 col = ca / max(weights, vec3(.001));
      vec3 refractedBase = col; // Unlit sample for transparency detection.

      float rr = nd * .5;
      float rimRing = gauss(rr - uRingRadius, uRingWidth);
      float aura = gauss(rr - uRingRadius, uRingWidth * 6.0) * .28;
      float shimmer = .88 + .12 * sin(angle * 12.0 + uTime * 3.5);
      float edge = gauss(rr - .478, uEdgeRingWidth) * shimmer;
      float edgeHalo = gauss(rr - .478,
        uEdgeRingWidth * (1.0 + uEdgeRingSoftness * 7.0))
        * .35 * uEdgeRingSoftness;

      // Preserve the reference's layered optical lighting, substituting
      // signature purple everywhere the source uses its blue ring.
      col += uPurple * ((rimRing * shimmer + aura) * uBlueRing *
              (uGlow / 17.0) * 1.8 + (edge + edgeHalo) *
              uEdgeRingIntensity) * kGlow;
      float nova = gauss(nd * .5, .25) * uWhiteGlow *
                   (uGlow / 17.0) * .23 * kGlow;
      col += vec3(nova);

      // The refraction source is the WebGL story, not the DOM headline.
      // On the opening screen its background is white: compositing that
      // background as a nearly opaque lens washes the DOM letters to white.
      // Preserve dark refracted story pixels, but make neutral white pixels
      // transparent except where the luminous purple wave actually passes.
      vec3 sceneInk = texture2D(uBg, vUv).rgb;
      vec4 headlineInk = texture2D(uHeadline, vUv);
      vec3 sourceInk = mix(sceneInk, headlineInk.rgb, headlineInk.a);
      float inkCoverage = 1.0 - smoothstep(.68, .975,
                              min(min(sourceInk.r, sourceInk.g), sourceInk.b));
      float refractedInk = 1.0 - smoothstep(.72, .985,
                              min(min(refractedBase.r, refractedBase.g), refractedBase.b));
      float textCoverage = max(inkCoverage, refractedInk);
      float opticalLight = ((rimRing * shimmer + aura) * uBlueRing *
                           (uGlow / 17.0) * 1.8 +
                           (edge + edgeHalo) * uEdgeRingIntensity) * kGlow;
      float lightAlpha = min(.58, opticalLight * .32);
      // The fully composited source replaces the already-drawn baseline headline
      // inside the lens, avoiding double letters and white fog.
      float glassAlpha = max(textCoverage * .96, lightAlpha);
      glassAlpha *= 1.0 - smoothstep(.8, 1.0, uDissolve);
      // Head and all of its materials remain an untouched foreground.
      float headCoverage = texture2D(uHeadMask, vUv).a;
      float alpha = disc * (1.0 - headCoverage) * (0.98 - 0.02*uDissolve) * (1.0 - smoothstep(.8, 1.0, uDissolve));
      gl_FragColor = vec4(col, alpha);
    }
  `;
  const overlayMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      varying vec2 vUv;
      void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}
    `,
    fragmentShader, transparent: true, depthTest: false, depthWrite: false,
    toneMapped: false
  });
  const overlayScene = new THREE.Scene();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), overlayMaterial);
  quad.frustumCulled = false;
  overlayScene.add(quad);
  const overlayCamera = new THREE.Camera();
  const EXPANSION_DURATION = 4;
  const EXPLOSION_SCALE = 10;
  const DISSOLVE_AT_SCALE = 6.1405;
  const DISSOLVE_DURATION = .8975;
  // expo.out: 1 - 2^(-10t) for t in (0,1).
  const dissolveStart = EXPANSION_DURATION *
    (-Math.log2(1 - DISSOLVE_AT_SCALE / EXPLOSION_SCALE) / 10);
  let impact = -100;
  let enabled = true;

  function resize() {
    renderer.getDrawingBufferSize(size);
    const w = Math.max(1, Math.round(size.x));
    const h = Math.max(1, Math.round(size.y));
    source.setSize(w, h);
    silhouette.setSize(w, h);
    headlineCanvas.width=w;
    headlineCanvas.height=h;
    headlineTexture.needsUpdate=true;
    uniforms.uRes.value.set(w, h);
  }
  function drawHeadline(stageRect){
    const sx=headlineCanvas.width/Math.max(1,stageRect.width);
    const sy=headlineCanvas.height/Math.max(1,stageRect.height);
    headlineCtx.clearRect(0,0,headlineCanvas.width,headlineCanvas.height);
    headlineCtx.save();
    headlineCtx.scale(sx,sy);
    headlineCtx.fillStyle='#0d0c0e';
    headlineCtx.textAlign='center';
    headlineCtx.textBaseline='alphabetic';
    for(const line of headlineLines){
      const style=getComputedStyle(line);
      const rect=line.getBoundingClientRect();
      const font=style.fontStyle+' '+style.fontWeight+' '+style.fontSize+' '+style.fontFamily;
      headlineCtx.font=font;
      if('letterSpacing' in headlineCtx)headlineCtx.letterSpacing=style.letterSpacing;
      const text=line.textContent;
      const metrics=headlineCtx.measureText(text);
      const ascent=metrics.actualBoundingBoxAscent||parseFloat(style.fontSize)*.76;
      const descent=metrics.actualBoundingBoxDescent||parseFloat(style.fontSize)*.22;
      const x=rect.left+rect.width/2-stageRect.left;
      const y=rect.top-stageRect.top+(rect.height-ascent-descent)/2+ascent;
      headlineCtx.fillText(text,x,y);
    }
    headlineCtx.restore();
    headlineTexture.needsUpdate=true;
  }
  function trigger(clientX, clientY, stageRect, now) {
    const x = (clientX - stageRect.left) / Math.max(1, stageRect.width);
    const y = 1 - (clientY - stageRect.top) / Math.max(1, stageRect.height);
    uniforms.uCursorUV.value.set(THREE.MathUtils.clamp(x, 0, 1),
      THREE.MathUtils.clamp(y, 0, 1));
    impact = now;
  }
  function render(now) {
    const age = now - impact;
    const active = enabled && age >= 0 &&
      age < dissolveStart + DISSOLVE_DURATION;
    if (!active) {
      for(const line of headlineLines)line.style.visibility='';
      renderer.render(scene, camera);
      return;
    }
    const stageRect=renderer.domElement.getBoundingClientRect();
    drawHeadline(stageRect);
    for(const line of headlineLines)line.style.visibility='hidden';
    renderer.getClearColor(clearColor);
    const originalAlpha = renderer.getClearAlpha();
    const previousTarget = renderer.getRenderTarget();
    const oldOverride = scene.overrideMaterial;
    const oldAutoClear = renderer.autoClear;
    const originalBackground = scene.background;
    const children = scene.children.map(node => [node, node.visible]);
    const oldHeadVisible = headRoot.visible;
    try {
      // Render visible story text and scenery WITHOUT the head as refraction source.
      headRoot.visible = false;
      renderer.setRenderTarget(source);
      renderer.setClearColor(0xffffff, 1);
      renderer.clear(true, true, true);
      renderer.render(scene, camera);

      // Draw a separate head silhouette to protect the original mesh completely.
      for(const [child] of children)child.visible = child === headRoot;
      headRoot.visible = oldHeadVisible;
      scene.overrideMaterial = maskMaterial;
      renderer.setRenderTarget(silhouette);
      renderer.setClearColor(0x000000, 0);
      renderer.clear(true, true, true);
      renderer.render(scene, camera);

      // Restore the untouched scene and render the original head in full.
      scene.overrideMaterial = oldOverride;
      for(const [child, visible] of children)child.visible = visible;
      headRoot.visible = oldHeadVisible;
      renderer.setRenderTarget(null);
      renderer.setClearColor(clearColor, originalAlpha);
      renderer.render(scene, camera);
      renderer.autoClear=false;
      renderer.render(headlineScene,overlayCamera);

      const progress = Math.min(1, age / EXPANSION_DURATION);
      const ease = progress <= 0 ? 0 :
        progress >= 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const scale = EXPLOSION_SCALE * ease;
      const baseRadius = Math.min(size.x, size.y) * .11;
      uniforms.uRadiusPx.value = Math.max(.5, baseRadius * scale);
      const t = THREE.MathUtils.clamp(
        (age - dissolveStart) / DISSOLVE_DURATION, 0, 1);
      uniforms.uDissolve.value = t * t * (3 - 2 * t);
      uniforms.uTime.value = age;
      renderer.autoClear = false;
      renderer.render(overlayScene, overlayCamera);
    } finally {
      scene.overrideMaterial = oldOverride;
      scene.background = originalBackground;
      for(const [child, visible] of children)child.visible = visible;
      headRoot.visible = oldHeadVisible;
      renderer.autoClear = oldAutoClear;
      renderer.setRenderTarget(previousTarget);
      renderer.setClearColor(clearColor, originalAlpha);
    }
  }
  function dispose() {
    source.dispose();
    silhouette.dispose();
    maskMaterial.dispose();
    headlineTexture.dispose();
    headlineMaterial.dispose();
    headlineQuad.geometry.dispose();
    quad.geometry.dispose();
    overlayMaterial.dispose();
  }
  resize();
  return {resize, trigger, render, dispose,
    setEnabled(value){enabled=Boolean(value)}};
}
