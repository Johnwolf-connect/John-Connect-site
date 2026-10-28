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
const LED_SOFT='#6630a8';
function UfoAccentLights(){
 // Model bounds: radius 4.685, underside black assembly y=0.005..0.943.
 // Selected concentric mechanical zones, not an indiscriminate wireframe.
 const lowerBands=[
  {radius:1.18,y:0.15,tube:0.012},
  {radius:2.68,y:0.28,tube:0.014},
  {radius:4.42,y:0.48,tube:0.009}
 ];
 return <>
  {lowerBands.map(({radius,y,tube},i)=>
   <mesh key={i} rotation={[Math.PI/2,0,0]} position={[0,y,0]}>
    <torusGeometry args={[radius,tube,6,128]}/>
    <meshBasicMaterial color={LED_SOFT} toneMapped={false}/>
   </mesh>
  )}
  {/* Eight short accents mark the radial machinery, with gaps between them. */}
  {Array.from({length:8},(_,i)=>{
   const a=i*Math.PI/4;
   return <mesh key={i} rotation={[Math.PI/2,0,0]} position={[0,0.31,0]}>
    <torusGeometry args={[3.25,0.011,6,16,a-0.12,0.24]}/>
    <meshBasicMaterial color={LED_SOFT} toneMapped={false}/>
   </mesh>;
  })}
  <pointLight position={[0,-0.15,0]} color={LED_PURPLE} intensity={0.65} distance={4} decay={2}/>
  {/* Preserve the upper crown LED. */}
  <mesh rotation={[Math.PI/2,0,0]} position={[0,2.02,0]}>
   <torusGeometry args={[1.5,0.028,8,128]}/>
   <meshBasicMaterial color={LED_SOFT} toneMapped={false}/>
  </mesh>
  <pointLight position={[0,2.12,0]} color={LED_PURPLE} intensity={0.75} distance={3.5} decay={2}/>
 </>;
}

// Restrained platform accent lighting: only long, nearly horizontal architectural
// edges are candidates. This deliberately avoids tracing every mesh triangle.
function StructuralLEDs({scene,kind}){
 useEffect(()=>{
  if(kind!=='platform') return;
  const added=[];
  scene.traverse(obj=>{
   if(!obj.isMesh || !obj.geometry) return;
   const size=new THREE.Vector3();
   obj.geometry.computeBoundingBox();
   obj.geometry.boundingBox.getSize(size);
   if(Math.max(size.x,size.z)<2) return;
   const edges=new THREE.EdgesGeometry(obj.geometry,65);
   const positions=edges.getAttribute('position');
   if(!positions){edges.dispose();return;}
   const selected=[];
   for(let i=0;i<positions.count;i+=2){
    const ax=positions.getX(i),ay=positions.getY(i),az=positions.getZ(i);
    const bx=positions.getX(i+1),by=positions.getY(i+1),bz=positions.getZ(i+1);
    const length=Math.hypot(bx-ax,by-ay,bz-az);
    if(length<0.8 || Math.abs(by-ay)>0.08*length) continue;
    selected.push(ax,ay,az,bx,by,bz);
   }
   edges.dispose();
   if(selected.length<6 || selected.length>9000) return;
   const geometry=new THREE.BufferGeometry();
   geometry.setAttribute('position',new THREE.Float32BufferAttribute(selected,3));
   const material=new THREE.LineBasicMaterial({
    color:LED_SOFT,transparent:true,opacity:0.24,depthWrite:false,depthTest:true
   });
   const lines=new THREE.LineSegments(geometry,material);
   lines.name='subtle-platform-architectural-led';
   obj.add(lines);
   added.push({obj,lines,geometry,material});
  });
  return ()=>added.forEach(({obj,lines,geometry,material})=>{
   obj.remove(lines);geometry.dispose();material.dispose();
  });
 },[scene,kind]);
 return null;
}
// Recolor existing blue light-emitting materials and actual light objects in the GLBs.
// Diffuse chrome/paint colors are deliberately not recolored.
function RecolorBuiltInLights({scene}){
 useEffect(()=>{
  const swaps=[],lights=[];
  const violet=new THREE.Color(LED_PURPLE);
  const isBlue=color=>{
   if(!color) return false;
   const hsl={h:0,s:0,l:0};color.getHSL(hsl);
   return hsl.h>=0.52 && hsl.h<=0.72 && hsl.s>0.3;
  };
  scene.traverse(obj=>{
   if(obj.isLight && isBlue(obj.color)){
    lights.push([obj,obj.color.clone()]);
    obj.color.copy(violet);
   }
   if(!obj.isMesh || !obj.material) return;
   const originals=Array.isArray(obj.material)?obj.material:[obj.material];
   let changed=false;
   const replacements=originals.map(mat=>{
    if(!mat) return mat;
    const luminous=mat.emissive && isBlue(mat.emissive) && (mat.emissiveIntensity??1)>0;
    const namedLight=/led|neon|emissive|glow|light|strip/i.test(mat.name||'');
    const blueLightSurface=namedLight && isBlue(mat.color);
    if(!luminous && !blueLightSurface) return mat;
    const next=mat.clone();
    if(luminous) next.emissive.copy(violet);
    if(blueLightSurface && next.color) next.color.copy(violet);
    swaps.push(next);
    changed=true;
    return next;
   });
   if(changed){
    const previous=obj.material;
    obj.material=Array.isArray(previous)?replacements:replacements[0];
    swaps.push({obj,previous});
   }
  });
  return ()=>{
   swaps.forEach(item=>{
    if(item.obj) item.obj.material=item.previous;
    else item.dispose();
   });
   lights.forEach(([light,color])=>light.color.copy(color));
  };
 },[scene]);
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
  <RecolorBuiltInLights scene={platform.scene}/><StructuralLEDs scene={platform.scene} kind="platform"/><primitive object={platform.scene} />
  <group ref={ship}><RecolorBuiltInLights scene={ufo.scene}/><StructuralLEDs scene={ufo.scene} kind="ufo"/><primitive object={ufo.scene}/><UfoAccentLights/></group>
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
