import {
  ShaderMaterial as _i,
  Matrix3 as H,
  Vector2 as B,
  Vector3 as V,
} from "three";
const e = { value: -1 };
var fa = `
attribute float shading;
attribute float veil;
varying vec2 vUv;
varying float vShading;
varying float vVeil;
#ifdef TRAIL
// a dust cell: its middle and two numbers of its own (its delay, its way); the card's width, as built
attribute vec4 cell;
uniform float cardWidth;
uniform float wave;
uniform float wavePhase;
uniform float bend;
uniform float bendAxis;
uniform float dust;
uniform float dustReach;
varying float vTilt;
#endif
void main() {
  vUv = uv;
  vShading = shading;
  vVeil = veil;
  vec3 p = position;
#ifdef TRAIL
  // trail.math's dustCell: every cell leaves on a delay of its own, out and with the wind, shrinking
  if (dust > 0.0) {
    float t = clamp((dust - 0.6 * cell.z) / 0.4, 0.0, 1.0);
    float q = t * t * (3.0 - 2.0 * t);
    float a = cell.w * 6.2831853;
    float reach = (0.2 + 0.5 * cell.z) * dustReach;
    vec2 off = vec2(
      cos(a) * reach + 0.6 * dustReach * (0.5 + cell.w),
      sin(a) * reach - 0.25 * dustReach * (0.5 + cell.w)
    );
    p.xy = cell.xy + (p.xy - cell.xy) * (1.0 - 0.6 * q) + off * q * cardWidth;
    vVeil = max(vVeil, smoothstep(0.5, 1.0, q));
  }
  float k = 6.2831853 / cardWidth;
  p.x += wave * cardWidth * sin(p.y * k * 1.3 + wavePhase);
  p.y += 0.5 * wave * cardWidth * sin(p.x * k * 1.1 + wavePhase * 1.3);
  // bend.ts's bendPoint: round an axis through the middle, by bend radians across the width
  vTilt = 0.0;
  if (abs(bend) > 1e-4) {
    float c = cos(bendAxis);
    float s = sin(bendAxis);
    float across = p.x * c + p.y * s;
    float along = -p.x * s + p.y * c;
    float r = cardWidth / bend;
    vTilt = across / r;
    float bent = r * sin(vTilt);
    p = vec3(bent * c - along * s, bent * s + along * c, p.z + r * (1.0 - cos(vTilt)));
  }
#endif
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`,
  pa = `
uniform sampler2D map;
uniform mat3 mapTransform;
uniform vec2 cover;
uniform float aspect;
uniform float corner;
uniform float opacity;
uniform float shade;
uniform vec3 backdrop;
uniform float useBackdrop;
uniform float mirror;
uniform float hasMap;
uniform sampler2D mapBack;
uniform mat3 mapBackTransform;
uniform vec2 coverBack;
uniform float backMode;
uniform vec2 frame;
uniform vec2 frameBack;
uniform vec2 focus;
uniform vec2 focusBack;
uniform float picking;
uniform float pickOnly;
uniform vec3 pickFront;
uniform vec3 pickBack;
varying vec2 vUv;
varying float vShading;
varying float vVeil;
#ifdef TRAIL
// a canvas blur, σ in card widths: the picture and its edge both soften; the card is built with room round it
uniform float blur;
uniform float split;
uniform float dim;
uniform float sheen;
uniform float sheenAt;
uniform float sheenHue;
uniform float bendAxis;
uniform float blocks;
uniform float glitch;
uniform vec2 blockGrid;
uniform float seed;
varying float vTilt;
vec2 mapUv(vec2 v) {
  vec2 u = (v - 0.5) / frame + 0.5;
  return (mapTransform * vec3((u - 0.5) * cover + 0.5 + focus * (1.0 - cover), 1.0)).xy;
}
// a golden-angle disc out to 2σ, weighted as a gaussian; the mip level fills in between the taps
vec4 blurred(vec2 v, float lod) {
  vec4 sum = vec4(0.0);
  float total = 0.0;
  for (int i = 0; i < 16; i++) {
    float r = 2.0 * sqrt((float(i) + 0.5) / 16.0);
    float a = float(i) * 2.39996;
    vec2 o = vec2(cos(a), sin(a)) * r * blur;
    float w = exp(-0.5 * r * r);
    sum += texture2D(map, mapUv(v + vec2(o.x, o.y * aspect)), lod) * w;
    total += w;
  }
  return sum / total;
}
// how far from the card's edge, in card widths: inside below 0
float cardEdge(vec2 v) {
  vec2 p = (v - 0.5) * vec2(1.0, 1.0 / aspect);
  vec2 size = vec2(0.5 * frame.x, 0.5 * frame.y / aspect);
  float r = min(corner, min(size.x, size.y));
  vec2 q = abs(p) - (size - r);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float edgeMask(float d, float aa) {
  return blur > 0.0 ? 1.0 - smoothstep(-2.0 * blur, 2.0 * blur, d) : clamp(0.5 - d / aa, 0.0, 1.0);
}
float cellRandom(vec2 c) {
  return fract(sin(dot(c, vec2(127.1, 311.7)) + seed * 17.13) * 43758.5453);
}
// a pure hue: red at 0, through green and blue, back to red at 1
vec3 spectrum(float t) {
  return clamp(abs(mod(t * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
}
#endif
#ifdef REFLECT
uniform float reflectStrength;
// a card mirrored under the floor: strongest where it meets the floor, gone by three quarters of its height
float reflection() { return reflectStrength * (1.0 - smoothstep(0.0, 0.75, vUv.y)); }
#endif

void main() {
  bool reverseSide = backMode > 0.5 && !gl_FrontFacing;
  // a picture with a shape of its own sits inside its card: frame is the share of the card it takes
  vec2 inside = reverseSide ? frameBack : frame;
  vec2 uv = (vUv - 0.5) / frame + 0.5;
  vec2 uvReverse = (vUv - 0.5) / frameBack + 0.5;
  if (mirror > 0.5) uv.x = 1.0 - uv.x;
  // a face seen from behind arrives mirrored along the axis it was flipped over; undo it so the back reads upright
  vec2 uvBack = backMode < 1.5 ? vec2(1.0 - uvReverse.x, uvReverse.y) : vec2(uvReverse.x, 1.0 - uvReverse.y);
  // the crop window slides over the media towards its focus: the offset is in the media's own, upright space
  uv = (mapTransform * vec3((uv - 0.5) * cover + 0.5 + focus * (1.0 - cover), 1.0)).xy;
  uvBack = (mapBackTransform * vec3((uvBack - 0.5) * coverBack + 0.5 + focusBack * (1.0 - coverBack), 1.0)).xy;
  // both sides are sampled outside any branch: derivatives (mip selection) are undefined inside one
  vec4 front = texture2D(map, uv);
  vec4 reverse = texture2D(mapBack, uvBack);
  float mask = 1.0;
#ifdef TRAIL
  // blocks: the card comes in cell by cell, in an order of its own; while rough, a cell shows its picture coarse
  // and its slice of the card slid along
  vec2 v = vUv;
  float gone = 0.0;
  if (blocks > 0.0 || glitch > 0.0) {
    // in from one side, raggedly: where a cell lies decides more than chance when it comes
    vec2 c = floor(vUv * blockGrid);
    float order = 0.55 * (1.0 - (c.y + 0.5) / blockGrid.y) + 0.45 * cellRandom(c);
    gone = step(order, blocks * 1.001);
    v.x += (cellRandom(vec2(floor(vUv.y * blockGrid.y * 2.0), 7.0)) - 0.5) * 0.12 * glitch;
    vec2 fine = blockGrid * exp2(mix(8.0, 1.5, clamp(glitch, 0.0, 1.0)));
    v = (floor(v * fine) + 0.5) / fine;
  }
  // the level whose texel is about as wide as the taps lie apart, in pixels of the frame
  float lod = log2(max(1.0, 0.9 * blur / max(fwidth(vUv.x), 1e-6)));
  // the card is built with room round it, so its edge is always cut here
  float aa = max(fwidth(cardEdge(vUv)), 1e-6);
  mask = edgeMask(cardEdge(v), aa);
  if (split > 0.0) {
    // red and blue slid apart from green, each with its own edge
    vec2 o = vec2(split, 0.0);
    float red = edgeMask(cardEdge(v + o), aa);
    float blue = edgeMask(cardEdge(v - o), aa);
    vec3 c = vec3(
      texture2D(map, mapUv(v + o)).r * red,
      texture2D(map, mapUv(v)).g * mask,
      texture2D(map, mapUv(v - o)).b * blue
    );
    mask = max(max(red, blue), mask);
    front = vec4(c / max(mask, 1e-4), 1.0);
  } else if (blur > 0.0) {
    front = blurred(v, lod);
  } else {
    front = texture2D(map, mapUv(v));
  }
  mask *= 1.0 - gone;
#endif
  vec4 color = hasMap < 0.5 ? vec4(vec3(0.5), 0.25) : reverseSide ? reverse : front;

#ifdef TRAIL
#else
  if (corner > 0.0 || inside.x < 1.0 || inside.y < 1.0) {
    vec2 p = (vUv - 0.5) * vec2(1.0, 1.0 / aspect);
    vec2 size = vec2(0.5 * inside.x, 0.5 * inside.y / aspect);
    float r = min(corner, min(size.x, size.y));
    vec2 q = abs(p) - (size - r);
    float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
    mask = clamp(0.5 - d / max(fwidth(d), 1e-6), 0.0, 1.0);
  }
#endif

  if (picking > 0.5) {
#ifdef REFLECT
    discard;
#endif
    // the hidden frame behind a click: a card is one flat colour that names its picture
    vec3 id = reverseSide ? pickBack : pickFront;
    if (id.r < 0.0 || opacity < 0.05 || vVeil > 0.95) discard;
    if (pickOnly > -0.5) {
      // the outline of one picture: white where it shows, black where another covers it, the soft edge kept
      if (mask <= 0.0) discard;
      float own = abs(id.r * 255.0 - pickOnly - 1.0) < 0.5 ? 1.0 : 0.0;
      gl_FragColor = vec4(vec3(own), mask);
      return;
    }
    if (mask < 0.5) discard;
    gl_FragColor = vec4(id, 1.0);
    return;
  }

  float seen = opacity * (1.0 - vVeil);
  gl_FragColor = vec4(color.rgb, color.a * mask * (useBackdrop > 0.5 ? 1.0 : seen));
#ifdef REFLECT
  if (useBackdrop < 0.5) gl_FragColor.a *= reflection();
#endif
  #include <colorspace_fragment>
  gl_FragColor.rgb *= (1.0 - shade) * (1.0 - vShading);
#ifdef TRAIL
  gl_FragColor.rgb *= 1.0 - dim;
  if (sheen > 0.0) {
    // a rainbow band runs over the paper across its bend, edge to edge; its hue turns with the way the paper faces
    vec2 c = (vUv - 0.5) * vec2(1.0, 1.0 / aspect);
    vec2 way = vec2(cos(bendAxis), sin(bendAxis));
    float across = dot(c, way);
    float reach = 0.5 * abs(way.x) + 0.5 / aspect * abs(way.y) + 0.12;
    float at = across - sheenAt * reach;
    float band = exp(-at * at / 0.02) + 0.35 * abs(sin(vTilt));
    vec3 hue = mix(vec3(1.0), spectrum(vTilt * 0.8 + across * 1.6 + sheenHue), 0.55);
    gl_FragColor.rgb = 1.0 - (1.0 - gl_FragColor.rgb) * (1.0 - clamp(sheen * 0.42 * band, 0.0, 1.0) * hue);
  }
#endif
  // mixed after encoding, in display space, so it matches what alpha-blending over the 2D background gives
  if (useBackdrop > 0.5) gl_FragColor.rgb = mix(backdrop, gl_FragColor.rgb, seen);
#ifdef REFLECT
  if (useBackdrop > 0.5) gl_FragColor.rgb = mix(backdrop, gl_FragColor.rgb, reflection());
#endif
}
`,
  ma = { value: 0 },
  ha = /^#([0-9a-f]{6})$/i;
function ga(t, n = 0, r) {
  let i = r ? ha.exec(r)?.[1] : void 0,
    a = i
      ? [0, 2, 4].map((e) => parseInt(i.slice(e, e + 2), 16) / 255)
      : [0, 0, 0];
  return new _i({
    uniforms: {
      map: { value: null },
      mapTransform: { value: new H() },
      cover: { value: new B(1, 1) },
      aspect: { value: t },
      corner: { value: Math.max(0, Math.min(n, 0.5, 0.5 / t)) },
      opacity: { value: 1 },
      shade: { value: 0 },
      backdrop: { value: new V(a[0], a[1], a[2]) },
      useBackdrop: { value: +!!i },
      mirror: { value: 0 },
      hasMap: { value: 0 },
      mapBack: { value: null },
      mapBackTransform: { value: new H() },
      coverBack: { value: new B(1, 1) },
      backMode: { value: 0 },
      frame: { value: new B(1, 1) },
      frameBack: { value: new B(1, 1) },
      focus: { value: new B(0, 0) },
      focusBack: { value: new B(0, 0) },
      picking: ma,
      pickOnly: e,
      pickFront: { value: new V(-1, 0, 0) },
      pickBack: { value: new V(-1, 0, 0) },
    },
    vertexShader: fa,
    fragmentShader: pa,
    transparent: !0,
    side: 2,
    toneMapped: !1,
  });
}
export { ga as createPaperMaterial };
