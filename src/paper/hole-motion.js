// Motion and sheet deformation adapted from the user-supplied Premotio Hole renderer.
// Keep the deterministic solver separate from rendering for reproducible timeline checks.
const r = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const n = (v, period) => ((v % period) + period) % period;
const O = 1000;
function c(e) {
  let t = e | 0;
  return () => {
    t = (t + 1831565813) | 0;
    let e = t;
    return (
      (e = Math.imul(e ^ (e >>> 15), e | 1)),
      (e ^= e + Math.imul(e ^ (e >>> 7), e | 61)),
      ((e ^ (e >>> 14)) >>> 0) / 4294967296
    );
  };
}
var k = (e, t, n) => e + (t - e) * n,
  A = (e, t, n) => {
    let i = r((n - e) / (t - e), 0, 1);
    return i * i * (3 - 2 * i);
  };
function j(e, t, n) {
  return n <= 0
    ? Math.min(e, t)
    : e <= t - n
      ? e
      : e >= t + n
        ? t
        : t - (t + n - e) ** 2 / (4 * n);
}
var M = (e, t) => e[0] * t[0] + e[1] * t[1] + e[2] * t[2],
  N = (e, t) => [
    e[1] * t[2] - e[2] * t[1],
    e[2] * t[0] - e[0] * t[2],
    e[0] * t[1] - e[1] * t[0],
  ],
  P = (e, t) => [e[0] * t, e[1] * t, e[2] * t],
  F = (e) => P(e, 1 / Math.max(1e-12, Math.sqrt(M(e, e)))),
  I = (e, t) => [
    e[3] * t[0] + e[0] * t[3] + e[1] * t[2] - e[2] * t[1],
    e[3] * t[1] - e[0] * t[2] + e[1] * t[3] + e[2] * t[0],
    e[3] * t[2] + e[0] * t[1] - e[1] * t[0] + e[2] * t[3],
    e[3] * t[3] - e[0] * t[0] - e[1] * t[1] - e[2] * t[2],
  ],
  L = (e) => {
    let t = Math.hypot(e[0], e[1], e[2], e[3]);
    return [e[0] / t, e[1] / t, e[2] / t, e[3] / t];
  };
function R(e, t) {
  let [n, r, i, a] = e,
    o = P(N([n, r, i], t), 2),
    s = N([n, r, i], o);
  return [
    t[0] + a * o[0] + s[0],
    t[1] + a * o[1] + s[1],
    t[2] + a * o[2] + s[2],
  ];
}
function z(e, t, n) {
  let [r, i, a] = [Math.cos(e / 2), Math.cos(t / 2), Math.cos(n / 2)],
    [o, s, c] = [Math.sin(e / 2), Math.sin(t / 2), Math.sin(n / 2)];
  return [
    o * i * a + r * s * c,
    r * s * a - o * i * c,
    r * i * c + o * s * a,
    r * i * a - o * s * c,
  ];
}
function B(e) {
  let t = Math.sqrt(M(e, e));
  if (t < 1e-9) return [0, 0, 0, 1];
  let n = Math.sin(t / 2) / t;
  return [e[0] * n, e[1] * n, e[2] * n, Math.cos(t / 2)];
}
function ee(e, t, n) {
  let r = e[0] * t[0] + e[1] * t[1] + e[2] * t[2] + e[3] * t[3] < 0 ? -1 : 1;
  return L([0, 1, 2, 3].map((i) => e[i] * (1 - n) + t[i] * r * n));
}
var te = Math.PI * (3 - Math.sqrt(5)),
  V = 0.6,
  H = 0.35,
  U = 0.55,
  W = [0.7, 1.2],
  G = 2,
  K = (50 * Math.PI) / 180,
  ne = 0.11 / 0.312,
  re = 0.4;
function q(e, t, n) {
  let r = n * (Math.PI - K);
  if (e < 0) return { rho: t - n, z: e, along: 0, up: 1 };
  let i = Math.PI - Math.min(e, r) / n,
    a = Math.max(0, e - r),
    o = Math.sin(i),
    s = -Math.cos(i);
  return {
    rho: t + n * Math.cos(i) + a * o,
    z: n * Math.sin(i) + a * s,
    along: o,
    up: s,
  };
}
var J = (e, t) => {
    let n = (t.ring / 100) * Math.min(e.width, e.height);
    return { R: n, a: n * ne };
  },
  ie = (e, t) =>
    Math.min(
      t.width / 2 / Math.max(1e-9, Math.abs(Math.cos(e))),
      t.height / 2 / Math.max(1e-9, Math.abs(Math.sin(e))),
    ),
  Y = 1.35 ** V - H ** V,
  ae = (e) => ((e + H) ** V - H ** V) / Y,
  oe = (e) => (e * Y + H ** V) ** (1 / V) - H,
  se = (e) => e - G * (1 - Math.exp(-e / G)),
  ce = (e) => {
    let t = 0,
      n = e + G;
    for (let r = 0; r < 48; r++) {
      let r = (t + n) / 2;
      se(r) < e ? (t = r) : (n = r);
    }
    return (t + n) / 2;
  },
  X = (e) => O - O / U - e,
  Z = (e) => O / (O - e);
function le(e, t, n, r, i = 0) {
  let a = c(Math.imul(e + 1 + i * 7919, 2654435761)),
    o = e * te + (a() * 2 - 1) * 0.1,
    s = k(W[0], W[1], a()),
    l = Math.cos(o),
    u = Math.sin(o),
    d = (n >= 1 ? r.card / n : r.card) / 2,
    f = J(t, r),
    p = f.R / U,
    m = f.a / U,
    h = -d - 0.1 * m,
    g = m * (Math.PI - K) + d,
    _ = q(g, p, m),
    v = X(m) + _.z,
    y = Math.PI / 2 - o,
    b = I(B([u * (Math.PI / 2 - K), l * (Math.PI / 2 - K), 0]), z(0, 0, y)),
    x = (e) => r.card * e * 0.8,
    S = ie(o, t) + x(s),
    C = Math.hypot(t.width, t.height) / 2 + x(W[1]),
    w = U * (g - h),
    T = r.flight;
  return {
    n: e,
    angle: o,
    cos: l,
    sin: u,
    roll: y,
    half: d,
    near: s,
    R: p,
    a: m,
    from: h,
    off: g,
    leaves: b,
    rho: _.rho,
    z: v,
    exit: S,
    freeAt: ce(T * oe(w / C)),
    life: ce(T * oe((w + S - _.rho * Z(v)) / C)),
    reach: C,
    flight: T,
  };
}
var ue = (e, t, n, r, i) => {
  let a = i * i,
    o = a * i;
  return (
    (2 * o - 3 * a + 1) * e +
    (o - 2 * a + i) * t +
    (3 * a - 2 * o) * n +
    (o - a) * r
  );
};
function de(e, t) {
  let n = e.reach * ae(se(r(t, 0, e.life)) / e.flight),
    i = U * (e.off - e.from),
    a,
    o,
    s = e.from + n / U,
    c = t < e.freeAt,
    l = c ? 0 : A(e.freeAt, e.freeAt + re, t);
  if (c) {
    let t = q(s, e.R, e.a);
    ((a = t.rho), (o = X(e.a) + t.z));
  } else {
    let t = e.exit - e.rho * Z(e.z),
      s = r((n - i) / t, 0, 1),
      c = e.exit / e.near,
      l = O - O / e.near,
      u = Math.hypot(c - e.rho, l - e.z);
    ((a = ue(e.rho, Math.sin(K) * u, c, c - e.rho, s)),
      (o = ue(e.z, -Math.cos(K) * u, l, l - e.z, s)));
  }
  let u = Z(o),
    d = a * u;
  return { r: d, s, wrapped: c, toward: l, m: u, x: d * e.cos, y: d * e.sin };
}
var fe = 1e3,
  pe = 0.22,
  me = 2.6,
  he = 620;
function ge(e) {
  let t = c(e),
    n = Array.from({ length: 4 }, () => {
      let e = t() * 2 - 1,
        n = t() * Math.PI * 2,
        r = [
          Math.sqrt(1 - e * e) * Math.cos(n),
          Math.sqrt(1 - e * e) * Math.sin(n),
          e,
        ],
        i = F(N(r, Math.abs(r[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0])),
        a = ((2 * Math.PI) / he) * (0.7 + 0.6 * t()),
        o = P(r, a),
        s = (pe * fe) / a;
      return {
        k: o,
        along: P(N(o, i), s),
        swirl: P(i, me),
        phase: t() * Math.PI * 2,
        beat: (1 + Math.floor(t() * 3)) * (t() < 0.5 ? -1 : 1),
      };
    });
  return {
    flow: fe,
    toWay: 1.6,
    gusts: 0.35,
    sway: [0, 0, 0, 0].map(() => t() * Math.PI * 2),
    modes: n,
  };
}
function _e(e, t) {
  let n = 2 * Math.PI * t;
  return (
    1 +
    e.gusts *
      (0.6 * Math.sin(n + e.sway[0]) + 0.4 * Math.sin(2 * n + e.sway[1]))
  );
}
function ve(e, t, n, r, i) {
  let a = 2 * Math.PI * r,
    o = e.flow * e.gusts * 0.25,
    s = -e.toWay * n[0] + o * Math.sin(a + e.sway[2]),
    c = -e.toWay * n[1] + o * 0.6 * Math.sin(2 * a + e.sway[3]),
    l = 0;
  for (let n of e.modes) {
    let e = Math.cos(M(n.k, t) + n.phase + n.beat * a);
    ((s += e * n.along[0]), (c += e * n.along[1]), (l += e * n.along[2]));
  }
  return [s * i, c * i, l * i];
}
function ye(e, t, n, r) {
  let i = 2 * Math.PI * n,
    a = [0, 0, 0];
  for (let n of e.modes) {
    let e = Math.sin(M(n.k, t) + n.phase + n.beat * i) * r;
    ((a[0] += e * n.swirl[0]),
      (a[1] += e * n.swirl[1]),
      (a[2] += e * n.swirl[2]));
  }
  return a;
}
var be = 8,
  Q = 480,
  xe = 4,
  Se = 0.22,
  Ce = 1.3,
  we = (e) => A(0, 0.14, e) * (0.5 + 0.5 * (1 - A(0.14, 0.7, e))),
  Te = 34;
function Ee(e) {
  let t = new Float32Array(968),
    { air: n } = e,
    i = c(Math.imul(e.seed + 1, 2246822507)),
    a = (e = 1) => (i() * 2 - 1) * e,
    o = n.flow,
    s = 1 / Q,
    l = F([Se * Math.cos(e.heading), -0.22 * Math.sin(e.heading), 1]),
    u = [a(4e3), a(4e3), a(4e3)],
    d = [0, 0, 0],
    f = [0, 0, 0],
    p = [...e.from],
    m = [0, 0, 0];
  for (let i = 0; i <= Q; i++) {
    let a = i * s,
      c = we(a),
      h = e.t0 + a * e.span,
      g = [u[0] + d[0], u[1] + d[1], u[2] + 0.35 * o * a],
      _ = ve(n, g, d, h, c),
      v = R(p, [0, 0, 1]),
      y = [_[0] - f[0], _[1] - f[1], _[2] - f[2]],
      b = 0.35 * c * o * _e(n, h),
      x = F([l[0] * c, l[1] * c, l[2]]),
      S = [y[0] + b * x[0], y[1] + b * x[1], y[2] + b * x[2]];
    if (i % xe === 0) {
      let e = r(M(S, v) / (0.8 * o), -1, 1),
        n = r(Math.sqrt(M(S, S)) / (0.8 * o), 0, 1);
      t.set([d[0] * Ce, d[1] * Ce, ...p, e, n], (i / xe) * be);
    }
    if (i === Q) break;
    let C = M(y, v),
      w = [y[0] - C * v[0], y[1] - C * v[1], y[2] - C * v[2]],
      T = Math.sqrt(M(w, w)),
      E = [0, 1, 2].map(
        (e) => ((8 * C * Math.abs(C)) / o) * v[e] + ((0.8 * T) / o) * w[e],
      ),
      D = ye(n, g, h, c),
      O = N(v, x),
      k = Te * (M(x, v) < 0 ? -1 : 1),
      A = R(p, [0, 1, 0]),
      j = Math.atan2(-A[0], A[1]) - e.roll,
      P = -68 * Math.sin(Math.atan2(Math.sin(j), Math.cos(j)) / 2),
      z = [0, 1, 2].map(
        (e) => k * O[e] + (e === 2 ? P : 0) + 3 * (D[e] - m[e]) - m[e],
      );
    ((f = [f[0] + E[0] * s, f[1] + E[1] * s, f[2] + E[2] * s]),
      (d = [d[0] + f[0] * s, d[1] + f[1] * s, 0]),
      (m = [m[0] + z[0] * s, m[1] + z[1] * s, m[2] + z[2] * s]));
    let B = I([m[0], m[1], m[2], 0], p);
    p = L([
      p[0] + 0.5 * s * B[0],
      p[1] + 0.5 * s * B[1],
      p[2] + 0.5 * s * B[2],
      p[3] + 0.5 * s * B[3],
    ]);
  }
  return t;
}
function De(e, t) {
  let n = r(t, 0, 1) * 120,
    i = Math.min(120, Math.floor(n)),
    a = n - i,
    o = (t) => {
      let n = t * be;
      return {
        slip: [e[n], e[n + 1]],
        q: [e[n + 2], e[n + 3], e[n + 4], e[n + 5]],
        press: e[n + 6],
        rush: e[n + 7],
      };
    },
    s = o(i);
  if (a === 0) return s;
  let c = o(i + 1),
    l = (e, t) => e + (t - e) * a;
  return {
    slip: [l(s.slip[0], c.slip[0]), l(s.slip[1], c.slip[1])],
    q: ee(s.q, c.q, a),
    press: l(s.press, c.press),
    rush: l(s.rush, c.rush),
  };
}
var Oe = 325,
  ke = 0.8,
  Ae = 9,
  je = 0.5;
function Me(e) {
  let t = Math.max(1, e.aspects.length),
    n = (n) => e.aspects[n % t] ?? 3 / 4,
    r = (t) =>
      Math.max(
        ...Array.from({ length: e.count }, (r, i) =>
          le(i, e.frame, n(i), { ...e.look, flight: t }, e.seed),
        ).map((e) => e.life),
      ),
    i = e.look.flight;
  for (let t = 0; t < 12 && r(i) > e.period * 0.999; t++)
    i *= (e.period * 0.995) / r(i);
  let a = ge(5 + e.seed),
    o = { ...e.look, flight: i },
    s = Array.from({ length: e.count }, (r, s) => {
      let l = le(s, e.frame, n(s), o, e.seed),
        u = (s / e.count) * e.period,
        d = c(Math.imul(s + 1 + e.seed * 7919, 3266489909));
      return {
        i: s,
        picture: s % t,
        born: u,
        rail: l,
        flight: Ee({
          air: a,
          seed: s + e.seed * 101,
          heading: l.angle,
          roll: l.roll,
          from: l.leaves,
          t0: u / i,
          span: (l.life - l.freeAt) / i,
        }),
        phase: d() * Math.PI * 2,
      };
    });
  return { period: e.period, flight: i, sheets: s };
}
function Ne(e, t, n, r) {
  let i = Math.PI / Math.max(n, r),
    a = Math.abs(e) / n + Math.abs(t) * i * i,
    o = 1 / (je * n);
  if (a <= o / 2) return [e, t];
  let s = j(a, o, o / 2) / a;
  return [e * s, t * s];
}
function Pe(e, t, i) {
  let a = [];
  for (let o of e.sheets) {
    let s = n(t - o.born, e.period);
    if (s >= o.rail.life) continue;
    let c = i.backward ? o.rail.life - s : s,
      l = de(o.rail, c),
      u = {
        sheet: o,
        m: l.m,
        s: l.s,
        toward: l.toward,
        axis: Math.PI / 2,
        phase: o.phase + s * Ae,
        shows: i.backward ? A(0, ke, s) : 1,
      };
    if (l.wrapped) {
      a.push({ ...u, x: l.x, y: l.y, q: o.rail.leaves, bend: 0, flutter: 0 });
      continue;
    }
    let d = o.rail,
      f = De(o.flight, r((c - d.freeAt) / (d.life - d.freeAt), 0, 1)),
      p = i.card / Oe;
    a.push({
      ...u,
      x: l.x + f.slip[0] * p * l.m,
      y: l.y - f.slip[1] * p * l.m,
      q: f.q,
      bend: 1.5 * f.press * i.curl,
      flutter: 0.045 * f.rush * i.flutter,
    });
  }
  return a;
}
function Fe(e, t, n, r, i) {
  let [a, o] = n,
    [s, c] = Ne(i.bend, i.flutter, a, o),
    l = Math.cos(i.axis),
    u = Math.sin(i.axis),
    d = e * l + t * u,
    f = -e * u + t * l,
    p = d,
    m = 0,
    h = 0;
  if (Math.abs(s) > 1e-4) {
    let e = a / s;
    ((h = d / e), (p = e * Math.sin(h)), (m = e * (1 - Math.cos(h))));
  }
  let g = Math.PI / Math.max(a, o),
    _ = f * g + i.phase;
  m += c * Math.sin(_);
  let v = F([-Math.sin(h), -c * g * Math.cos(_), Math.cos(h)]),
    y = R(i.q, [(p * l - f * u) * r, (p * u + f * l) * r, m * r]),
    b = i.m,
    x = [i.x / b + y[0], -i.y / b + y[1], O - O / b + y[2]],
    S = R(i.q, [v[0] * l - v[1] * u, v[0] * u + v[1] * l, v[2]]);
  if (i.toward >= 1) return { p: x, n: S, veil: 1 - i.shows };
  let C = i.sheet.rail,
    w = Math.cos(C.roll),
    T = Math.sin(C.roll),
    E = [(e * w - t * T) * r, (e * T + t * w) * r],
    D = [Math.cos(C.angle), -Math.sin(C.angle)],
    j = [-D[1], D[0]],
    M = i.s + E[0] * D[0] + E[1] * D[1],
    N = E[0] * j[0] + E[1] * j[1],
    P = q(M, C.R, C.a),
    I = [D[0] * P.rho + j[0] * N, D[1] * P.rho + j[1] * N, X(C.a) + P.z],
    L = F([D[0] * -P.up, D[1] * -P.up, P.along]),
    z = i.toward,
    B = k(A(0, 0.42 * C.a * (Math.PI / 2), M), 1, z);
  return {
    p: [k(I[0], x[0], z), k(I[1], x[1], z), k(I[2], x[2], z)],
    n: F([k(L[0], S[0], z), k(L[1], S[1], z), k(L[2], S[2], z)]),
    veil: 1 - B * i.shows,
  };
}
export {
  Me as createHoleTimeline,
  Pe as sampleHole,
  Fe as deformSheet,
  J as ringDimensions,
};
