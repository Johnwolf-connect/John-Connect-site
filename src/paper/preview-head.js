import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { HeadController } from "../floating-about/controller.js";
import { installSurfaceRipple } from "../floating-about/ripple.js";

export async function createPreviewHead(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100);
  camera.position.z = 5.1;
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd3c4e8, 2.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(3, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xbca8ff, 1.3);
  rim.position.set(-3, 2, -4);
  scene.add(rim);
  const pivot = new THREE.Group(),
    orient = new THREE.Group();
  scene.add(pivot);
  pivot.add(orient);
  orient.rotation.y = -Math.PI / 2;
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  let gltf;
  try {
    gltf = await loader.loadAsync("/models/about/head-interactive.glb");
  } catch (error) {
    renderer.dispose();
    throw error;
  }
  const object = gltf.scene;
  const bounds = new THREE.Box3().setFromObject(object),
    center = bounds.getCenter(new THREE.Vector3());
  const dims = bounds.getSize(new THREE.Vector3());
  const scale = 2.5 / Math.max(dims.x, dims.y, dims.z);
  object.position.copy(center).multiplyScalar(-1);
  orient.scale.setScalar(scale);
  orient.add(object);
  const ripples = [],
    morphs = [];
  object.traverse((mesh) => {
    if (!mesh.isMesh) return;
    ripples.push(installSurfaceRipple(mesh));
    for (const [name, index] of Object.entries(
      mesh.morphTargetDictionary || {},
    ))
      if (/blink|eyes.?close/i.test(name)) morphs.push({ mesh, index });
  });
  const controller = new HeadController();
  const move = (event) =>
    controller.movePointer(
      (event.clientX / innerWidth) * 2 - 1,
      1 - (event.clientY / innerHeight) * 2,
    );
  const click = () => controller.hit();
  window.addEventListener("pointermove", move, { passive: true });
  canvas.addEventListener("click", click);
  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  return {
    render(dt) {
      const m = controller.update(dt);
      pivot.rotation.set(m.pitch, m.yaw, m.roll, "YXZ");
      pivot.position.set(m.horizontal, m.vertical, m.depth);
      orient.scale.setScalar(scale * m.scale);
      for (const r of ripples) r.update(controller.time);
      for (const { mesh, index } of morphs)
        mesh.morphTargetInfluences[index] = m.blink;
      renderer.render(scene, camera);
    },
    dispose() {
      observer.disconnect();
      window.removeEventListener("pointermove", move);
      canvas.removeEventListener("click", click);
      object.traverse((o) => {
        if (!o.isMesh) return;
        o.geometry.dispose();
        for (const m of [].concat(o.material)) {
          for (const value of Object.values(m))
            if (value?.isTexture) value.dispose();
          m.dispose();
        }
      });
      renderer.dispose();
    },
  };
}
