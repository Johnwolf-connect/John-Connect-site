import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Canvas,useFrame} from '@react-three/fiber';
import {useGLTF,Environment} from '@react-three/drei';
import * as THREE from 'three';
import './style.css';
const clamp=(v)=>Math.min(1,Math.max(0,v));
const ease=(v)=>{const t=clamp(v);return t*t*(3-2*t)};
const vec=(v)=>new THREE.Vector3(...v);
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
  <primitive object={platform.scene} />
  <group ref={ship}><primitive object={ufo.scene}/></group>
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
