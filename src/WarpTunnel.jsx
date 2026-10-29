import React,{useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import * as THREE from 'three';

export const WARP_FILE='/models/nebula_traveller.glb';
const clamp=v=>Math.min(1,Math.max(0,v));
const smooth=v=>{const t=clamp(v);return t*t*(3-2*t);};
export function warpEnvelope(progress){
 return smooth((progress-.63)/.105)*(1-smooth((progress-.84)/.105));
}

// The original GLB is black, 25%-alpha transmissive glass. Under a dark sky
// it is effectively invisible. Retain its authored morph animation, but render
// its mesh as a translucent violet wire grid during the warp phase.
export default function WarpTunnel({progress,reduced}){
 const {scene,animations}=useGLTF(WARP_FILE);
 const rig=useRef();
 const morph=useMemo(()=>{
  const copy=scene.clone(true);
  const materials=[];
  copy.traverse(object=>{
   if(!object.isMesh)return;
   object.frustumCulled=false;
   const mat=new THREE.MeshBasicMaterial({
    color:'#8743e8',wireframe:true,transparent:true,opacity:0,
    blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,
    toneMapped:false
   });
   object.material=mat;
   materials.push(mat);
  });
  const box=new THREE.Box3().setFromObject(copy);
  copy.position.sub(box.getCenter(new THREE.Vector3()));
  return {copy,materials};
 },[scene]);
 const mixer=useMemo(()=>{
  if(!animations.length)return null;
  const result=new THREE.AnimationMixer(morph.copy);
  animations.forEach(clip=>result.clipAction(clip).play());
  return result;
 },[animations,morph]);
 useEffect(()=>()=>{mixer?.stopAllAction();mixer?.uncacheRoot(morph.copy);morph.materials.forEach(m=>m.dispose());},[mixer,morph]);
 const rings=useMemo(()=>Array.from({length:18},(_,i)=>({
  radius:11.5+i*.42,
  z:-10-i*6.4
 })),[]);
 const streaks=useMemo(()=>{
  let seed=92471;
  const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  return Array.from({length:220},(_,i)=>({
   angle:random()*Math.PI*2,
   radius:11.7+random()*15,
   z:-8-random()*130,
   length:1.5+random()*9,
   phase:random()*140
  }));
 },[]);
 const streakGeometry=useMemo(()=>{
  const positions=new Float32Array(streaks.length*6);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  return geometry;
 },[streaks]);
 useEffect(()=>()=>streakGeometry.dispose(),[streakGeometry]);
 const intensity=useRef(0);
 const grid=useRef();
 const lineMaterial=useRef();
 const ringMaterial=useMemo(()=>new THREE.MeshBasicMaterial({color:'#7044d9',transparent:true,opacity:0,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}),[]);
 useEffect(()=>()=>ringMaterial.dispose(),[ringMaterial]);
 useFrame(({camera},delta)=>{
  if(!rig.current)return;
  const t=progress.current;
  const target=reduced?0:warpEnvelope(t);
  intensity.current=THREE.MathUtils.damp(intensity.current,target,12,Math.min(delta,.08));
  const strength=intensity.current;
  rig.current.visible=strength>.003;
  if(!rig.current.visible)return;
  // Entire effect is camera-relative, centered on the ship's flight axis.
  rig.current.position.copy(camera.position);
  rig.current.quaternion.copy(camera.quaternion);
  if(lineMaterial.current)lineMaterial.current.opacity=strength*.65;
  ringMaterial.opacity=strength*.21;
  if(grid.current)grid.current.material.opacity=strength*.13;
  for(const m of morph.materials)m.opacity=strength*.13;
  // Scroll-driven travel remains reversible and reproducible.
  const distance=210*smooth((t-.63)/.30);
  const arr=streakGeometry.attributes.position.array;
  streaks.forEach((s,i)=>{
   const z=-8-(((-s.z-8)+distance*2+s.phase)%140);
   const len=s.length*(.7+strength*1.8);
   const x=Math.cos(s.angle)*s.radius,y=Math.sin(s.angle)*s.radius;
   const k=i*6;
   arr[k]=x;arr[k+1]=y;arr[k+2]=z;
   arr[k+3]=x;arr[k+4]=y;arr[k+5]=z-len;
  });
  streakGeometry.attributes.position.needsUpdate=true;
  mixer?.setTime(10.416667*smooth((t-.63)/.30));
 });
 return <group ref={rig} visible={false}>
  <group position={[0,0,-24]} scale={[13,13,13]}>
   <primitive object={morph.copy}/>
  </group>
  {rings.map((r,i)=><mesh key={i} position={[0,0,r.z]} rotation={[0,0,i*.23]} scale={[r.radius,r.radius,1]}>
   <ringGeometry args={[.995,1.005,72]}/>
   <primitive object={ringMaterial} attach="material"/>
  </mesh>)}
  <lineSegments geometry={streakGeometry}>
   <lineBasicMaterial ref={lineMaterial} color="#bb8bff" transparent opacity={0}
    blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false}/>
  </lineSegments>
 </group>;
}
