import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Canvas,useFrame} from '@react-three/fiber';
import {useGLTF,Environment} from '@react-three/drei';
import * as THREE from 'three';
import './style.css';
const clamp=(v)=>Math.min(1,Math.max(0,v));
const ease=(v)=>{const t=clamp(v);return t*t*(3-2*t)};
const vec=(v)=>new THREE.Vector3(...v);
// LED accents are attached to the UFO group; original materials remain unchanged.
// Dimensions are provisional until the local GLB is visually checked.
const LED_PURPLE='#8b3dff';
function UfoAccentLights(){
 // Model bounds: radius 4.685, underside black assembly y=0.005..0.943.
 // Selected concentric mechanical zones, not an indiscriminate wireframe.
 const lowerBands=[
  {radius:1.18,y:0.15,tube:0.018},
  {radius:2.68,y:0.28,tube:0.021},
  {radius:4.42,y:0.48,tube:0.015}
 ];
 return <>
  {lowerBands.map(({radius,y,tube},i)=>
   <mesh key={i} rotation={[Math.PI/2,0,0]} position={[0,y,0]}>
    <torusGeometry args={[radius,tube,6,128]}/>
    <meshBasicMaterial color={LED_PURPLE} toneMapped={false}/>
   </mesh>
  )}
  {/* Eight short accents mark the radial machinery, with gaps between them. */}
  {Array.from({length:8},(_,i)=>{
   const a=i*Math.PI/4;
   return <mesh key={i} rotation={[Math.PI/2,0,a]} position={[0,0.31,0]}>
    <torusGeometry args={[3.25,0.016,6,20,a-0.12,0.24]}/>
    <meshBasicMaterial color={LED_PURPLE} toneMapped={false}/>
   </mesh>;
  })}
  <pointLight position={[0,-0.15,0]} color={LED_PURPLE} intensity={1.6} distance={5} decay={2}/>
  {/* Preserve the upper crown LED. */}
  <mesh rotation={[Math.PI/2,0,0]} position={[0,2.02,0]}>
   <torusGeometry args={[1.5,0.028,8,128]}/>
   <meshBasicMaterial color={LED_PURPLE} toneMapped={false}/>
  </mesh>
  <pointLight position={[0,2.12,0]} color={LED_PURPLE} intensity={1.8} distance={4.5} decay={2}/>
 </>;
}

// Follow the actual GLB mesh edges rather than inventing architectural outlines.
// High-angle edges emphasize structural breaks while avoiding wireframe triangles.
function StructuralLEDs({scene,kind}){
 useEffect(()=>{
  const added=[];
  scene.traverse(obj=>{
   if(!obj.isMesh || !obj.geometry) return;
   // The UFO's black lower assembly contains its underside mechanical detailing.
   if(kind==='ufo') return; // Deliberate underside accents are handled by UfoAccentLights.
   // Select platform architecture, excluding tiny high-density surface details.
   if(kind==='platform' && (obj.geometry.index?.count||obj.geometry.attributes.position.count)>60000) return;
   const edges=new THREE.EdgesGeometry(obj.geometry,48);
   const count=edges.attributes.position?.count||0;
   if(count<4 || count>22000){edges.dispose();return;}
   const material=new THREE.LineBasicMaterial({
    color:LED_PURPLE,transparent:true,opacity:kind==='platform'?0.46:0.7,
    depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1
   });
   const lines=new THREE.LineSegments(edges,material);
   lines.name='structural-violet-led';
   lines.renderOrder=2;
   obj.add(lines);
   added.push({obj,lines,edges,material});
  });
  return ()=>added.forEach(({obj,lines,edges,material})=>{
   obj.remove(lines);edges.dispose();material.dispose();
  });
 },[scene,kind]);
 return null;
}
function Chamber({progress,onFrame}){
 const platform=useGLTF('/models/platform.glb');
 const ufo=useGLTF('/models/ufo.glb');
 const ship=useRef();
 const roof=11.112;
 useFrame(({camera,clock})=>{
  const p=progress.current;
  // The front hangar exit is along negative Z, directly ahead of the initial camera.
  // Stay near docking-pad altitude until clear of the structure; climb afterward.
  const depart=ease((p-.12)/.56);
  const climb=ease((p-.68)/.32);
  const y=1.4 + depart*0.8 + climb*12 + Math.sin(clock.elapsedTime*1.6)*.07;
  const z=-depart*34 - climb*16;
  ship.current.position.set(0,y,z);
  // Keep the camera behind the UFO (positive Z) throughout the forward exit.
  const close=[0,3.55,8.4];
  const tracking=[5.5,4.8,-5];
  const exit=[9,6.5,-19];
  const chase=[5,11,-37];
  let from,to,t;
  if(p<.38){from=close;to=tracking;t=ease((p-.10)/.28)}
  else if(p<.70){from=tracking;to=exit;t=ease((p-.38)/.32)}
  else{from=exit;to=chase;t=ease((p-.70)/.30)}
  camera.position.copy(vec(from).lerp(vec(to),t));
  camera.lookAt(0,y+0.5,z);
  if(onFrame.current && clock.elapsedTime%0.15<0.025)onFrame.current({y,roof,inside:camera.position.y<roof});
 });
 return <>
  <ambientLight intensity={1.4}/><hemisphereLight args={['#e2e8ef','#20252b',1.7]}/>
  <directionalLight position={[8,18,12]} intensity={3.0}/>
  <directionalLight position={[-9,8,-10]} intensity={1.4}/>
  <StructuralLEDs scene={platform.scene} kind="platform"/><primitive object={platform.scene} />
  <group ref={ship}><StructuralLEDs scene={ufo.scene} kind="ufo"/><primitive object={ufo.scene}/><UfoAccentLights/></group>
 </>;
}
function App(){
 const progress=useRef(0),onFrame=useRef(null);
 const [pct,setPct]=useState(0),[diag,setDiag]=useState({y:1.4,roof:11.112,inside:true}),[error,setError]=useState('');
 onFrame.current=setDiag;
 useEffect(()=>{
  const scroll=()=>{const p=window.scrollY/Math.max(1,document.documentElement.scrollHeight-window.innerHeight);progress.current=clamp(p);setPct(Math.round(progress.current*100))};
  window.addEventListener('scroll',scroll,{passive:true});scroll();return()=>window.removeEventListener('scroll',scroll);
 },[]);
 const phase=pct<16?'01 / POINT 2 · INTERIOR':pct<68?'02 / FORWARD DEPARTURE':pct<80?'03 / HANGAR EXIT':'04 / CHASE VIEW';
 return <>
  <div className="scene"><Canvas gl={{antialias:true,powerPreference:'high-performance'}} camera={{fov:53,near:0.1,far:700,position:[0,3.55,8.4]}} onCreated={({gl})=>{gl.setClearColor('#090c10')}} onError={e=>setError(String(e))}>
   <React.Suspense fallback={null}><Chamber progress={progress} onFrame={onFrame}/></React.Suspense>
  </Canvas></div>
  <div className="scroll-track" aria-hidden="true"/>
  <header className="overlay"><div className="eyebrow">KASANE / ATLANTA / LAUNCH CHAMBER</div><h1>THE ASCENT</h1><p>Point 2 · Inner docking pad. Scroll to fly forward through the hangar opening, then climb into a third-person chase view.</p><div className="diagnostic">ALT {diag.y.toFixed(1)} / ROOF {diag.roof.toFixed(1)} / CAMERA {diag.inside?'INTERIOR':'EXTERIOR'}</div>{error&&<div className="error">{error}</div>}<button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>RESET TO INTERIOR</button></header>
  <footer><span>{phase}</span><div className="progress"><div style={{width:`${pct}%`}}/></div><span>{pct}%</span></footer>
 </>;
}
createRoot(document.getElementById('root')).render(<App/>);
