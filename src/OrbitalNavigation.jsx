import React,{useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import * as THREE from 'three';
import {shipAnchor} from './navigation.js';

// Original uploaded GLBs, never recolored or rewritten.
// The 55 MB amethyst model may take longer to load on mobile.
const ORBITS=[
 {file:'/models/technotron.glb',name:'About',size:7.7},
 {file:'/models/amethyst_torus.glb',name:'Projects',size:7.8},
 {file:'/models/the_great_morpheus.glb',name:'Contact',size:7.7}
];

function haloTexture(){
 const canvas=document.createElement('canvas');
 canvas.width=canvas.height=256;
 const ctx=canvas.getContext('2d');
 const g=ctx.createRadialGradient(128,128,12,128,128,126);
 g.addColorStop(0,'rgba(170,74,255,0.65)');
 g.addColorStop(.28,'rgba(125,35,255,0.38)');
 g.addColorStop(.58,'rgba(92,17,207,0.16)');
 g.addColorStop(1,'rgba(70,0,150,0)');
 ctx.fillStyle=g;ctx.fillRect(0,0,256,256);
 const tex=new THREE.CanvasTexture(canvas);
 tex.colorSpace=THREE.SRGBColorSpace;
 return tex;
}
// A silhouette-only purple atmosphere. The Fresnel term suppresses the
// center of the sphere so the original GLB's details remain visible.
const RIM_VERTEX=`
 varying vec3 vNormalView;
 varying vec3 vPositionView;
 void main(){
  vec4 viewPosition=modelViewMatrix*vec4(position,1.0);
  vPositionView=viewPosition.xyz;
  vNormalView=normalize(normalMatrix*normal);
  gl_Position=projectionMatrix*viewPosition;
 }
`;
const RIM_FRAGMENT=`
 precision highp float;
 varying vec3 vNormalView;
 varying vec3 vPositionView;
 uniform float uStrength;
 void main(){
  vec3 viewDir=normalize(-vPositionView);
  float fresnel=1.0-abs(dot(normalize(vNormalView),viewDir));
  float thin=pow(fresnel,16.0);
  float wide=pow(fresnel,5.5);
  float alpha=uStrength*(thin*0.76+wide*0.22);
  vec3 color=mix(vec3(0.37,0.05,0.95),vec3(0.85,0.46,1.0),thin);
  gl_FragColor=vec4(color,alpha);
 }
`;
const haloCache={texture:null};
function Orbit({definition,index,interaction,reduced}){
 const {scene,animations}=useGLTF(definition.file);
 const orbit=useRef();
 const halo=useRef();
 const rim=useRef();
 const light=useRef();
 const glow=useRef(0);
 const model=useMemo(()=>{
  const clone=scene.clone(true);
  const bounds=new THREE.Box3().setFromObject(clone);
  const center=bounds.getCenter(new THREE.Vector3());
  const size=bounds.getSize(new THREE.Vector3());
  clone.position.sub(center);
  const holder=new THREE.Group();
  holder.add(clone);
  holder.scale.setScalar(definition.size/Math.max(size.x,size.y,size.z,0.001));
  return holder;
 },[scene,definition.size]);
 const mixer=useMemo(()=>{
  if(!animations.length)return null;
  const result=new THREE.AnimationMixer(model);
  animations.forEach(clip=>result.clipAction(clip).play());
  return result;
 },[model,animations]);
 useEffect(()=>()=>{if(mixer)mixer.stopAllAction();},[mixer]);
 const texture=useMemo(()=>{
  if(!haloCache.texture)haloCache.texture=haloTexture();
  return haloCache.texture;
 },[]);
 useFrame(({clock,camera},delta)=>{
  if(!orbit.current)return;
  const isActive=interaction.current.selected===index || interaction.current.hovered===index;
  const target=isActive?1:0.10;
  glow.current=THREE.MathUtils.damp(glow.current,target,reduced?100:9,Math.min(delta,.1));
  const g=glow.current;
  if(halo.current)halo.current.material.opacity=g*.52;
  if(rim.current)rim.current.uniforms.uStrength.value=g*1.4;
  if(light.current)light.current.intensity=g*2.6;
  orbit.current.position.y=reduced?0:Math.sin(clock.elapsedTime*1.05+index*1.7)*.30;
  orbit.current.rotation.y=reduced?0:Math.sin(clock.elapsedTime*.22+index)*.22;
  if(!reduced)mixer?.update(Math.min(delta,.1));
  // Always face the camera enough to retain the authored toroidal silhouette.
  // Leave each source model's geometry and animations intact.
 });
 return <group ref={orbit}>
  <sprite ref={halo} position={[0,0,-2]} scale={[14,14,1]} renderOrder={2}>
   <spriteMaterial map={texture} color="#a144ff" opacity={.1}
    transparent depthWrite={false} blending={THREE.AdditiveBlending}/>
  </sprite>
  <pointLight ref={light} position={[0,0,2]} color="#993eff" intensity={0} distance={12} decay={2}/>
  <primitive object={model}/>
  <mesh renderOrder={3}>
   <sphereGeometry args={[definition.size*.53,64,48]}/>
   <shaderMaterial ref={rim} vertexShader={RIM_VERTEX} fragmentShader={RIM_FRAGMENT}
    uniforms={{uStrength:{value:0}}} transparent depthWrite={false}
    depthTest={false} blending={THREE.AdditiveBlending} side={THREE.FrontSide} toneMapped={false}/>
  </mesh>
 </group>;
}
class AssetBoundary extends React.Component{
 constructor(props){super(props);this.state={failed:false};}
 static getDerivedStateFromError(){return {failed:true};}
 componentDidCatch(error){console.warn('Navigation GLB unavailable',error);}
 render(){return this.state.failed?null:this.props.children;}
}
function OrbitalSlot({definition,index,interaction,reduced}){
 const position=useRef();
 const intro=useRef(0);
 useFrame(({camera},delta)=>{
  if(!position.current)return;
  intro.current=THREE.MathUtils.damp(intro.current,interaction.current.arrived?1:0,reduced?100:3.5,Math.min(delta,.1));
  position.current.visible=intro.current>.015;
  position.current.scale.setScalar(Math.max(.001,intro.current));
  const distance=32;
  const fieldHeight=2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*distance;
  const fieldWidth=fieldHeight*camera.aspect;
  const narrow=window.innerWidth<600;
  position.current.position.set((shipAnchor(index,false,narrow)-.5)*fieldWidth,28-fieldHeight*.045-(1-intro.current)*7,-140);
 });
 return <group ref={position}>
  <AssetBoundary><React.Suspense fallback={null}>
   <Orbit definition={definition} index={index} interaction={interaction} reduced={reduced}/>
  </React.Suspense></AssetBoundary>
 </group>;
}
export default function OrbitalNavigation({interaction,reduced}){
 return <>{ORBITS.map((definition,index)=>
  <OrbitalSlot key={definition.file} definition={definition} index={index}
   interaction={interaction} reduced={reduced}/>
 )}</>;
}
