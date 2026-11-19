import * as THREE from "three";
import {
  createHoleTimeline,
  sampleHole,
  deformSheet,
  ringDimensions,
} from "./hole-motion.js";
import { createPaperMaterial } from "./paper-material.js";
import { createHoleLens } from "./hole-lens.js";
import { HOLE_PRESET as preset } from "./preset.js";

// A fixed 1080-unit artboard preserves the reference's proportions at every size.
export async function createPaperField(canvas, sources) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0xffffff, 0);
  const textures = [];
  try {
    for (const source of sources) {
      const texture = await new THREE.TextureLoader().loadAsync(source);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(
        4,
        renderer.capabilities.getMaxAnisotropy(),
      );
      textures.push(texture);
    }
  } catch (error) {
    textures.forEach((t) => t.dispose());
    renderer.dispose();
    throw error;
  }
  const aspects = textures.map((t) => t.image.width / t.image.height);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera();
  camera.near = 1;
  camera.far = 500000;
  camera.position.z = 1000;
  const look = {
    card: preset.cardSize,
    ring: preset.ring,
    flight: preset.flight,
  };
  const motion = {
    backward: false,
    card: preset.cardSize,
    curl: preset.curl / 100,
    flutter: preset.flutter / 100,
  };
  const sheets = Array.from({ length: preset.count }, (_, index) => {
    const texture = textures[index % textures.length];
    const aspect = aspects[index % aspects.length];
    const dims = aspect >= 1 ? [1, 1 / aspect] : [aspect, 1];
    const geometry = new THREE.PlaneGeometry(...dims, 28, 28);
    const position = geometry.getAttribute("position");
    geometry.setAttribute(
      "shading",
      new THREE.BufferAttribute(new Float32Array(position.count), 1),
    );
    geometry.setAttribute(
      "veil",
      new THREE.BufferAttribute(new Float32Array(position.count), 1),
    );
    // Transparent backdrop retains the user's title -> cards -> information -> head order.
    const material = createPaperMaterial(aspect, 0);
    material.uniforms.map.value = texture;
    material.uniforms.mapTransform.value = texture.matrix;
    material.uniforms.hasMap.value = 1;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    scene.add(mesh);
    return { mesh, dims, flat: position.array.slice() };
  });
  const lens = createHoleLens(renderer);
  let frame,
    timeline,
    lastTime = 0,
    disposed = false;
  const observer = new ResizeObserver(resize);
  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    frame = { width: (1080 * rect.width) / rect.height, height: 1080 };
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = frame.width / frame.height;
    camera.fov = (2 * Math.atan(frame.height / 2000) * 180) / Math.PI;
    camera.updateProjectionMatrix();
    timeline = createHoleTimeline({
      frame,
      aspects,
      count: preset.count,
      look,
      period: preset.duration,
      seed: preset.seed,
    });
    seek(lastTime);
  }
  function seek(time) {
    if (disposed || !timeline) return;
    lastTime = time;
    sheets.forEach(({ mesh }) => (mesh.visible = false));
    const light = new THREE.Vector3(-0.35, 0.5, 0.8).normalize();
    const states = sampleHole(timeline, time, motion).sort((a, b) => a.m - b.m);
    states.forEach((state, order) => {
      const { mesh, dims, flat } = sheets[state.sheet.i];
      const position = mesh.geometry.getAttribute("position");
      const shading = mesh.geometry.getAttribute("shading");
      const veil = mesh.geometry.getAttribute("veil");
      for (let j = 0; j < position.count; j++) {
        const vertex = deformSheet(
          flat[j * 3],
          flat[j * 3 + 1],
          dims,
          preset.cardSize,
          state,
        );
        const [x, y, z] = vertex.p;
        const projected = 1000 / Math.max(0.000001, 1000 - z);
        const distance = Math.hypot(x, y) * projected;
        const magnify =
          1 /
          (1 -
            (preset.lens / 100) *
              Math.exp(
                -((distance / Math.min(frame.width, frame.height)) ** 2) /
                  (2 * 0.42 ** 2),
              ));
        position.setXYZ(j, x * magnify, y * magnify, z);
        const normal = vertex.n,
          side = normal[2] < 0 ? -1 : 1;
        const brightness =
          side *
          (normal[0] * light.x + normal[1] * light.y + normal[2] * light.z);
        shading.setX(
          j,
          preset.shade *
            (1 - THREE.MathUtils.smoothstep(brightness, -0.1, 0.8)),
        );
        veil.setX(j, vertex.veil);
      }
      position.needsUpdate = shading.needsUpdate = veil.needsUpdate = true;
      mesh.material.polygonOffset = true;
      mesh.material.polygonOffsetUnits = -order * 4;
      mesh.renderOrder = order;
      mesh.visible = true;
    });
    renderer.render(scene, camera);
    lens.apply(
      frame,
      ringDimensions(frame, look),
      Math.min(frame.width, frame.height),
      preset.rays / 100,
      preset.edges / 100,
    );
  }
  observer.observe(canvas);
  resize();
  return {
    seek,
    dispose() {
      disposed = true;
      observer.disconnect();
      lens.dispose();
      sheets.forEach(({ mesh }) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
      textures.forEach((t) => t.dispose());
      renderer.dispose();
    },
  };
}
