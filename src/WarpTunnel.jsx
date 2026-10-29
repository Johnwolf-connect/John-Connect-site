import React,{useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import * as THREE from 'three';

// Nebula Traveller: a compact spherical mesh with one morph-target animation.
// The sphere becomes a moving warp envelope around the camera and spacecraft.
// Preserve the supplied material and authored morph animation.
export const WARP_FILE='/models/nebula_traveller.glb';
const clamp=v=>Math.min(1,Math.max(0,v));
const smooth=v=>{const t=clamp(v);return t*t*(3-2*t);};
export function warpEnvelope(progress){
 // The tunnel appears only after the UFO has cleared the platform.
 return smooth((progress-.63)/.095)*(1-smooth((progress-.83)/.105));
}
export default function WarpTunnel({progress,reduced}){
 const {scene,animations}=useGLTF(WARP_FILE);
 const rig=useRef();
 const materials=useMemo(()=>{
  const copy=scene.clone(true);
  const cloned=[];
  copy.traverse(object=>{
   if(!object.isMesh)return;
   object.frustumCulled=false; // morphs can exceed the rest-pose bounding box
   const original=Array.isArray(object.material)?object.material:[object.material];
   const next=original.map(material=>{
    const m=material.clone();
    m.transparent=true;
    m.depthWrite=false;
    m.side=THREE.DoubleSide;
    m.opacity=0;
    cloned.push(m);
    return m;
   });
   object.material=Array.isArray(object.material)?next:next[0];
  });
  const bounds=new THREE.Box3().setFromObject(copy);
  copy.position.sub(bounds.getCenter(new THREE.Vector3()));
  return {copy,cloned};
 },[scene]);
 const mixer=useMemo(()=>{
  if(!animations.length)return null;
  const m=new THREE.AnimationMixer(materials.copy);
  for(const clip of animations)m.clipAction(clip).setLoop(THREE.LoopRepeat,Infinity).play();
  return m;
 },[materials,animations]);
 useEffect(()=>()=>{mixer?.stopAllAction();mixer?.uncacheRoot(materials.copy);materials.cloned.forEach(m=>m.dispose());},[mixer,materials]);
 const intensity=useRef(0);
 const forward=useMemo(()=>new THREE.Vector3(0,0,-1),[]);
 useFrame(({camera},delta)=>{
  if(!rig.current)return;
  const dt=Math.min(delta,.08);
  const wanted=reduced?0:warpEnvelope(progress.current);
  intensity.current=THREE.MathUtils.damp(intensity.current,wanted,10,dt);
  const strength=intensity.current;
  rig.current.visible=strength>.008;
  if(!rig.current.visible)return;
  // The UFO always flies toward world -Z. Align the envelope with the
  // camera's forward axis, keeping both the UFO and the camera inside it.
  rig.current.quaternion.copy(camera.quaternion);
  rig.current.position.copy(camera.position).addScaledVector(
   forward.clone().applyQuaternion(camera.quaternion),17
  );
  // Spherical source: uniform scaling prevents an unintended sideways tunnel.
  rig.current.scale.setScalar(46);
  for(const material of materials.cloned)material.opacity=strength*.88;
  // Animation plays faster during acceleration and eases as warp dissipates.
  mixer?.update(dt*(1.0+strength*1.4));
 });
 return <group ref={rig} visible={false} renderOrder={-1}>
  <primitive object={materials.copy}/>
 </group>;
}
