import {
  ShaderMaterial as h,
  Vector2 as E,
  Vector3 as g,
  Mesh as m,
  PlaneGeometry as w,
  Scene as b,
  OrthographicCamera as x,
  FramebufferTexture as f,
  LinearFilter as p,
} from "three";
var Be = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`,
  Ve = `
precision highp float;
uniform sampler2D frame;
uniform vec2 size;
uniform vec2 ring;
uniform float shorter;
uniform float near;
uniform float far;
uniform vec3 backdrop;
uniform float useBackdrop;
varying vec2 vUv;

vec4 tap(vec2 p) {
  vec2 uv = p / size;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
  return texture2D(frame, uv);
}

// red at 0, through green, to blue at 1
vec3 spectrum(float t) {
  vec3 c = clamp(abs(mod(t * 4.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return mix(vec3(1.0), c, 0.85);
}

float ease(float x) {
  x = clamp(x, 0.0, 1.0);
  return x * x * (3.0 - 2.0 * x);
}

vec4 rays(vec2 p, vec2 dir, float reach, out vec3 cover) {
  if (reach < 0.75) {
    vec4 c = tap(p);
    cover = vec3(c.a);
    return c;
  }
  vec3 colour = vec3(0.0);
  cover = vec3(0.0);
  vec3 weights = vec3(0.0);
  // each pixel starts its taps at a place of its own: the steps between them show as grain, not as bands
  float grain = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  float taps = clamp(ceil(reach / 3.0), 4.0, 16.0);
  for (int i = 0; i < 16; i++) {
    if (float(i) >= taps) break;
    float t = (float(i) + grain) / taps;
    vec4 c = tap(p + dir * reach * (t - 0.5));
    vec3 k = spectrum(t);
    colour += c.rgb * k;
    cover += c.a * k;
    weights += k;
  }
  cover /= weights;
  return vec4(colour / weights, 1.0);
}

void main() {
  vec2 p = vUv * size;
  vec2 c = p - 0.5 * size;
  float d = length(c);
  vec2 dir = d > 0.0 ? c / d : vec2(0.0);
  float x = (d - ring.x) / ring.y;
  float byHole = near * exp(-pow((x + 1.0) / 0.6, 2.0));
  vec2 e = abs(2.0 * vUv - 1.0);
  float byEdge = far * ease((max(e.x, e.y) - 0.8) / 0.2);
  float reach = ring.y * byHole * 0.46 + shorter * byEdge * 0.058;
  vec3 cover;
  vec4 seen = rays(p, dir, reach, cover);
  float light = exp(-pow(d / max(0.8 * (ring.x - ring.y), 1.0), 2.0));
  float a = max(cover.r, max(cover.g, cover.b));
  vec3 rgb = seen.rgb;
  if (useBackdrop > 0.5) {
    // over a flat ground: the ground where nothing covers it, the sheets lit into the ground's own colour
    rgb = mix(rgb, backdrop * cover, light) + backdrop * (a - cover);
  } else {
    rgb *= 1.0 - light;
    a *= 1.0 - light;
  }
  gl_FragColor = vec4(rgb, a);
}
`,
  He = /^#([0-9a-f]{6})$/i;
function Ue(e, t) {
  let n = t ? He.exec(t)?.[1] : void 0,
    r = n
      ? [0, 2, 4].map((e) => parseInt(n.slice(e, e + 2), 16) / 255)
      : [0, 0, 0],
    i = new h({
      uniforms: {
        frame: { value: null },
        size: { value: new E() },
        ring: { value: new E() },
        shorter: { value: 1 },
        near: { value: 1 },
        far: { value: 1 },
        backdrop: { value: new g(r[0], r[1], r[2]) },
        useBackdrop: { value: +!!n },
      },
      vertexShader: Be,
      fragmentShader: Ve,
      blending: 0,
      depthTest: !1,
      depthWrite: !1,
      toneMapped: !1,
    }),
    a = new m(new w(2, 2), i);
  a.frustumCulled = !1;
  let o = new b();
  o.add(a);
  let s = new x(-1, 1, 1, -1, 0, 1),
    c = new E(),
    l = null;
  return {
    apply(t, n, r, a, u) {
      (e.getDrawingBufferSize(c),
        (!l || l.image.width !== c.x || l.image.height !== c.y) &&
          (l?.dispose(),
          (l = new f(c.x, c.y)),
          (l.minFilter = p),
          (l.magFilter = p)),
        e.copyFramebufferToTexture(l));
      let d = c.x / t.width,
        m = i.uniforms;
      ((m.frame.value = l),
        m.size.value.set(c.x, c.y),
        m.ring.value.set(n.R * d, n.a * d),
        (m.shorter.value = r * d),
        (m.near.value = a),
        (m.far.value = u),
        e.render(o, s));
    },
    dispose() {
      (l?.dispose(), a.geometry.dispose(), i.dispose());
    },
  };
}
export { Ue as createHoleLens };
