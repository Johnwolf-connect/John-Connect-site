import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Uses the supplied Sketchfab model as soon as its glTF asset is available.
// A native three.js fallback keeps the story functional in previews.
function fallbackDisk(){
  const disk=new THREE.Group();
  const edge=new THREE.MeshStandardMaterial({color:0x111114,roughness:.83});
  const face=new THREE.MeshStandardMaterial({color:0x252528,roughness:.78});
  const silver=new THREE.MeshStandardMaterial({color:0xb7b7bd,metalness:.46,roughness:.48});
  const paper=new THREE.MeshStandardMaterial({color:0xf3f1ed,roughness:.92});
  const red=new THREE.MeshStandardMaterial({color:0xe72e3c,roughness:.8});
  const dark=new THREE.MeshStandardMaterial({color:0x121215,roughness:.8});
  function block(w,h,d,x,y,z,material){
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    m.position.set(x,y,z);disk.add(m);return m;
  }
  block(2.08,2.08,.14,0,0,0,edge);
  block(1.98,1.96,.01,0,0,.08,face);
  block(1.24,.65,.03,0,.65,.10,silver);
  block(.32,.51,.04,.35,.64,.125,dark);
  block(1.59,.91,.03,0,-.42,.10,paper);
  block(1.59,.20,.04,0,-.08,.126,red);
  block(.15,.09,.04,.47,-.79,.13,dark);
  block(.12,.12,.03,-.87,-.87,.10,dark);
  block(.12,.12,.03,.87,-.87,.10,dark);
  disk.rotation.x=-.12;
  return disk;
}
export function setupFloppyDisk(host){
  if(!host)return ()=>{};
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(35,1,.1,50);
  camera.position.set(0,0,7.2);
  scene.add(new THREE.HemisphereLight(0xffffff,0xaaaaaa,2.6));
  const light=new THREE.DirectionalLight(0xffffff,2.5);light.position.set(2,3,5);scene.add(light);
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
  renderer.setClearColor(0xffffff,0);
  host.appendChild(renderer.domElement);
  let disk=fallbackDisk();scene.add(disk);
  let alive=true,visible=false;
  const loader=new GLTFLoader();
  loader.load('/models/about/floppy/scene.gltf',gltf=>{
    if(!alive)return;
    scene.remove(disk);
    disk=gltf.scene;
    const box=new THREE.Box3().setFromObject(disk);
    const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
    disk.position.sub(center);
    disk.scale.setScalar(2.65/Math.max(size.x,size.y,size.z));
    scene.add(disk);
  },undefined,()=>{/* Use ready fallback if uploaded model is not yet deployed. */});
  const resize=()=>{
    const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  };
  const ro=new ResizeObserver(resize);ro.observe(host);resize();
  const io=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting||false},{rootMargin:'150px'});
  io.observe(host);
  let previous=0,request=0,elapsed=0;
  function frame(now){
    if(!alive)return;
    request=requestAnimationFrame(frame);
    if(!visible){previous=now;return}
    const dt=Math.min(.05,(now-previous)/1000||0);previous=now;
    elapsed+=dt;
    // Keep the floppy legible: a gentle three-quarter rocking turn rather
    // than a full 360-degree spin that becomes an unrecognizable black line.
    disk.rotation.y=Math.sin(elapsed*.58)*.47-.16;
    disk.rotation.x=-.10+Math.sin(elapsed*.37)*.06;
    renderer.render(scene,camera);
  }
  request=requestAnimationFrame(frame);
  return ()=>{alive=false;cancelAnimationFrame(request);io.disconnect();ro.disconnect();renderer.dispose();renderer.domElement.remove()};
}