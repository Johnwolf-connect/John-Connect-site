import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Canvas,useFrame} from '@react-three/fiber';
import {useGLTF,Environment} from '@react-three/drei';
import * as THREE from 'three';
import './style.css';
import Navigation from './Navigation.jsx';
import {ARRIVAL,shipAnchor} from './navigation.js';
import {CELESTIAL_LAYOUT} from './celestial-layout.js';
const clamp=(v)=>Math.min(1,Math.max(0,v));
const ease=(v)=>{const t=clamp(v);return t*t*(3-2*t)};
const vec=(v)=>new THREE.Vector3(...v);
// LED accents are attached to the UFO group; original materials remain unchanged.
// Dimensions are provisional until the local GLB is visually checked.
const LED_PURPLE='#8b3dff';
const LED_SOFT='#6630a8';
// Build underside accents from the actual black mechanical mesh edges.
// No synthetic concentric rings: only short, recessed structural segments.
// Sample the real underside surface and fit short light strips onto the radial ribs.
// Unlike line overlays, each segment sits just below the visible underside surface.
function UfoAccentLights({scene}){
 const engineGlow=useRef();
 const crownGlow=useRef();
 useFrame(({clock})=>{
  const pulse=Math.sin(clock.elapsedTime*1.45);
  if(engineGlow.current) engineGlow.current.intensity=0.8+0.12*pulse;
  if(crownGlow.current) crownGlow.current.intensity=0.75+0.08*pulse;
 });
 useEffect(()=>{
  const parts=[];
  scene.updateMatrixWorld(true);
  scene.traverse(obj=>{
   if(!obj.isMesh || !/UFO_BLACK/i.test(obj.name) || !obj.geometry)return;
   const box=new THREE.Box3().setFromObject(obj);
   const center=box.getCenter(new THREE.Vector3());
   const radius=Math.max(box.max.x-box.min.x,box.max.z-box.min.z)/2;
   const down=new THREE.Vector3(0,1,0);
   const ray=new THREE.Raycaster();
   ray.firstHitOnly=true;
   const segments=[];
   // Surface-projected, discrete ribs; the ray hits the actual mechanical mesh.
   for(let spoke=0;spoke<48;spoke++){
    const angle=spoke*Math.PI*2/48;
    const ux=Math.cos(angle),uz=Math.sin(angle);
    let prev=null;
    for(let j=0;j<=30;j++){
     const r=radius*(0.36+j*0.014);
     const origin=new THREE.Vector3(center.x+ux*r,box.min.y-radius*0.4,center.z+uz*r);
     ray.set(origin,down);
     ray.far=radius*1.5;
     const hit=ray.intersectObject(obj,false)[0];
     const point=hit?.point;
     if(prev && point && point.distanceTo(prev)<radius*0.055){
      const dy=Math.abs(point.y-prev.y);
      // A short segment follows a continuous rib surface, never bridges gaps.
      if(dy<radius*0.012 && j%3!==0){
       // Raycast hits are world-space. Convert into this mesh's local space
       // so these strips remain physically attached during the entire flight.
       const offset=radius*0.0018;
       const a=obj.worldToLocal(prev.clone().add(new THREE.Vector3(0,-offset,0)));
       const b=obj.worldToLocal(point.clone().add(new THREE.Vector3(0,-offset,0)));
       segments.push(a.x,a.y,a.z,b.x,b.y,b.z);
      }
     }
     prev=point||null;
    }
   }
   if(!segments.length)return;
   const geometry=new THREE.BufferGeometry();
   geometry.setAttribute('position',new THREE.Float32BufferAttribute(segments,3));
   const material=new THREE.LineBasicMaterial({
    color:LED_PURPLE,transparent:true,opacity:0.72,depthTest:true,depthWrite:false
   });
   const lines=new THREE.LineSegments(geometry,material);
   lines.name='surface-fitted-underside-rib-leds';
   obj.add(lines);
   parts.push({obj,lines,geometry,material});
  });
  return ()=>parts.forEach(({obj,lines,geometry,material})=>{
   obj.remove(lines);geometry.dispose();material.dispose();
  });
 },[scene]);
 return <>
  <mesh rotation={[Math.PI/2,0,0]} position={[0,2.02,0]}>
   <torusGeometry args={[1.5,0.028,8,128]}/>
   <meshBasicMaterial color={LED_SOFT} toneMapped={false}/>
  </mesh>
  <pointLight ref={engineGlow} position={[0,0.12,0]} color={LED_PURPLE} intensity={0.8} distance={2.5} decay={2}/>
  <pointLight ref={crownGlow} position={[0,2.12,0]} color={LED_PURPLE} intensity={0.75} distance={3.5} decay={2}/>
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
    color:LED_PURPLE,transparent:true,opacity:0.38,depthWrite:false,depthTest:true
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
function RecolorBuiltInLights({scene,platform=false}){
 useEffect(()=>{
  const swaps=[],lights=[];
  const violet=new THREE.Color(LED_PURPLE);
  const isBlueOrCyan=color=>{
   if(!color) return false;
   const hsl={h:0,s:0,l:0};color.getHSL(hsl);
   return hsl.h>=0.45 && hsl.h<=0.72 && hsl.s>0.3;
  };
  scene.traverse(obj=>{
   if(obj.isLight && isBlueOrCyan(obj.color)){
    lights.push([obj,obj.color.clone()]);
    obj.color.copy(violet);
   }
   if(!obj.isMesh || !obj.material) return;
   const originals=Array.isArray(obj.material)?obj.material:[obj.material];
   let changed=false;
   const replacements=originals.map(mat=>{
    if(!mat) return mat;
    const platformCyan=mat.name==='Emissive_Cyan__0';
    const luminous=(mat.emissive && isBlueOrCyan(mat.emissive) && (mat.emissiveIntensity??1)>0) || platformCyan;
    const namedLight=/led|neon|emissive|glow|light|strip/i.test(mat.name||'');
    const blueLightSurface=namedLight && isBlueOrCyan(mat.color);
    if(!luminous && !blueLightSurface) return mat;
    const next=mat.clone();
    if(luminous && next.emissive){
     next.emissive.copy(violet);
     // Boost the existing platform light strips, not the UFO or non-emissive surfaces.
     if(platform) next.emissiveIntensity=Math.max(2.2,next.emissiveIntensity??1);
    }
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
// First universe layer: sparse, deterministic deep-space stars beyond the hangar.
// This requires no additional GLBs and leaves the approved flight untouched.
function DeepSpace(){
 const nearby=React.useMemo(()=>{
  // Sparse stars surrounding the flight corridor, with no stars on the path.
  // Camera translation provides real parallax; these never follow the camera.
  let seed=9183;
  const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const positions=[];
  for(let i=0;i<180;i++){
   const angle=rand()*Math.PI*2, radius=18+rand()*65;
   positions.push(Math.cos(angle)*radius,28+Math.sin(angle)*radius,-65-rand()*260);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  return geometry;
 },[]);
 useEffect(()=>()=>nearby.dispose(),[nearby]);
 const stars=React.useMemo(()=>{
  let seed=73129;
  const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  const points=[];
  for(let i=0;i<1100;i++){
   const x=(rand()-.5)*850;
   const y=(rand()-.5)*600+55;
   const z=-120-rand()*450;
   // Avoid a conspicuous star cluster directly in the hangar opening.
   points.push(x,y,z);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
  return geo;
 },[]);
 useEffect(()=>()=>stars.dispose(),[stars]);
 return <><points geometry={stars} frustumCulled={false}>
  <pointsMaterial color="#b6b2cb" size={0.85} sizeAttenuation transparent opacity={0.72} depthWrite={false}/>
 </points><points geometry={nearby}>
  <pointsMaterial color="#d7c5f2" size={0.12} sizeAttenuation transparent opacity={0.65} depthWrite={false}/>
 </points></>;
}
// Use the supplied space asset rather than a procedural planet.
// Keep this under its own Suspense boundary so missing local GLBs do not hide the UFO.
// Optional universe assets must never bring down the main animated scene.
class SpaceAssetBoundary extends React.Component{
 constructor(props){super(props);this.state={failed:false};}
 static getDerivedStateFromError(){return {failed:true};}
 componentDidCatch(error){console.warn('Optional universe GLB unavailable:',error);}
 render(){return this.state.failed?null:this.props.children;}
}
function OptionalSpaceAsset({children}){
 return <SpaceAssetBoundary><React.Suspense fallback={null}>{children}</React.Suspense></SpaceAssetBoundary>;
}
// The Sketchfab source contains large gray reflective light shells. They create
// the flat metal-disc appearance in our bright hangar lighting. Keep the original
// geometry and texture maps, but render its accretion light independently of
// directional/ambient illumination, without gray metallic reflections.
function CosmicVortex(){
 const {scene}=useGLTF('/models/black_hole.glb');
 const model=React.useMemo(()=>{
  const copy=scene.clone(true);
  copy.traverse(object=>{
   if(!object.isMesh || !object.material)return;
   const originals=Array.isArray(object.material)?object.material:[object.material];
   const materials=originals.map(source=>{
    const name=source.name||'';
    if(name==='black_hole_blackoutside'){
     return new THREE.MeshBasicMaterial({name,color:'#010105',side:THREE.DoubleSide});
    }
    if(/^black_hole_light[123]$/.test(name)){
     // Only the original source's luminous ribbon textures remain visible.
     // Additive transparency removes the oversized pale gray reflector look.
     const strength=name.endsWith('1')?.85:name.endsWith('2')?.48:.22;
     const tint=name.endsWith('1')?'#ffc4a0':name.endsWith('2')?'#fa886f':'#b567aa';
     return new THREE.MeshBasicMaterial({
      name,map:source.map,color:tint,transparent:true,opacity:strength,
      blending:THREE.AdditiveBlending,depthWrite:false,
      side:THREE.DoubleSide,toneMapped:false
     });
    }
    if(name==='ring'||name==='ring2'){
     return new THREE.MeshBasicMaterial({
      name,map:source.map,color:name==='ring'?'#d37589':'#98506f',
      transparent:true,opacity:name==='ring'?.42:.18,
      blending:THREE.AdditiveBlending,depthWrite:false,
      side:THREE.DoubleSide,toneMapped:false
     });
    }
    if(name==='black_hole_center'||name==='black_hole_distortion'){
     return new THREE.MeshBasicMaterial({
      name,color:'#000001',transparent:name==='black_hole_distortion',
      opacity:name==='black_hole_distortion'?.8:1,
      depthWrite:name==='black_hole_center',side:THREE.DoubleSide
     });
    }
    if(name==='Planet'){
     // Small source-mesh accent; keep it dark so it does not resemble a moon.
     return new THREE.MeshBasicMaterial({name,color:'#090812'});
    }
    return source.clone();
   });
   object.material=Array.isArray(object.material)?materials:materials[0];
  });
  const bounds=new THREE.Box3().setFromObject(copy);
  const size=bounds.getSize(new THREE.Vector3());
  const center=bounds.getCenter(new THREE.Vector3());
  copy.position.sub(center);
  const wrapper=new THREE.Group();
  wrapper.add(copy);
  wrapper.scale.setScalar(CELESTIAL_LAYOUT.vortex.diameter/Math.max(size.x,size.y,size.z,1));
  return wrapper;
 },[scene]);
 useEffect(()=>()=>model.traverse(object=>{
  if(!object.isMesh||!object.material)return;
  const materials=Array.isArray(object.material)?object.material:[object.material];
  materials.forEach(material=>material.dispose());
 }),[model]);
 return <group position={CELESTIAL_LAYOUT.vortex.position} rotation={[Math.PI/2,0,-0.15]}>
  <primitive object={model}/>
 </group>;
}
// A restrained reflection of the concealed purple planet. This illuminates the
// lower departure opening without revealing or replacing the actual GLB.
function PlanetaryBounceGlow({reduced}){
 const glow=useRef();
 useFrame(({clock})=>{
  if(glow.current)glow.current.intensity=reduced?0.45:0.45+0.045*Math.sin(clock.elapsedTime*0.55);
 });
 return <pointLight ref={glow} position={[-6,-3,-17]} color="#8e51d8" intensity={0.45} distance={30} decay={2}/>;
}

// A vast body beneath the station establishes scale as the floor leaves the frame.
// Sized from the GLB's actual dimensions; no replacement sphere or generated texture.
function DistantPurplePlanet({reduced}){
 const rotation=useRef();
 const mixer=useRef(null);
 useFrame((_,delta)=>{
  if(reduced)return;
  const step=Math.min(delta,.1);
  if(mixer.current)mixer.current.update(step);
  else if(rotation.current)rotation.current.rotation.y+=step*.075;
 });
 const {scene,animations}=useGLTF('/models/purple_planet.glb');
 const model=React.useMemo(()=>{
  const clone=scene.clone(true);
  const bounds=new THREE.Box3().setFromObject(clone);
  const size=bounds.getSize(new THREE.Vector3());
  const center=bounds.getCenter(new THREE.Vector3());
  clone.position.sub(center);
  const wrapper=new THREE.Group();
  wrapper.add(clone);
  wrapper.scale.setScalar(CELESTIAL_LAYOUT.stationPlanet.diameter/Math.max(size.x,size.y,size.z,0.001));
  return wrapper;
 },[scene]);
 // Display the source GLB materials without overrides. Keep its original
 // textures, color, opacity, emission, and tone mapping as authored.
 // The model is cloned above for scene placement; no GLB asset is modified.
 useEffect(()=>{
  if(!animations.length)return;
  const player=new THREE.AnimationMixer(model);
  // The supplied Take 01 animates both the planet and an independent cloud
  // layer. Fit one authored cycle to the approved ~84-second rotation.
  const clip=animations[0];
  const action=player.clipAction(clip);
  action.setEffectiveTimeScale(clip.duration/84).play();
  mixer.current=player;
  return ()=>{
   mixer.current=null;
   player.stopAllAction();
   player.uncacheRoot(model);
  };
 },[model,animations]);
 return <group ref={rotation} position={CELESTIAL_LAYOUT.stationPlanet.position} rotation={[0,0.4,0.1]}>
  <primitive object={model}/>
 </group>;
}
// Existing spherical moon asset, web-optimized for the live scene.
function DistantMoon({reduced}){
 const rotation=useRef();
 useFrame((_,delta)=>{if(rotation.current && !reduced)rotation.current.rotation.y+=Math.min(delta,.1)*.009;});
 const {scene}=useGLTF('/models/audras_moon-web-optimized.glb');
 const model=React.useMemo(()=>{
  const copy=scene.clone(true);
  const bounds=new THREE.Box3().setFromObject(copy);
  const size=bounds.getSize(new THREE.Vector3());
  const center=bounds.getCenter(new THREE.Vector3());
  copy.position.sub(center);
  const holder=new THREE.Group();
  holder.add(copy);
  holder.scale.setScalar(CELESTIAL_LAYOUT.moon.diameter/Math.max(size.x,size.y,size.z,0.001));
  return holder;
 },[scene]);
 return <group ref={rotation} position={CELESTIAL_LAYOUT.moon.position} rotation={[0.18,-0.35,0.1]}>
  <primitive object={model}/>
 </group>;
}
function Chamber({progress,onFrame,navigation,reduced}){
 const platform=useGLTF('/models/platform.glb');
 const ufo=useGLTF('/models/ufo.glb');
 const ship=useRef(),beam=useRef(),beamMaterial=useRef();
 const hoverX=useRef(0);
 const cameraTarget=useRef(new THREE.Vector3());
 const pointer=useRef({x:0,y:0});
 const smoothPointer=useRef({x:0,y:0});
 useEffect(()=>{
  const move=e=>{pointer.current.x=(e.clientX/window.innerWidth-0.5)*2;pointer.current.y=(e.clientY/window.innerHeight-0.5)*2;};
  const reset=()=>{pointer.current.x=0;pointer.current.y=0;};
  window.addEventListener('pointermove',move,{passive:true});
  window.addEventListener('blur',reset);
  document.addEventListener('pointerleave',reset);
  return ()=>{window.removeEventListener('pointermove',move);window.removeEventListener('blur',reset);document.removeEventListener('pointerleave',reset);};
 },[]);
 const roof=11.112;
 useFrame(({camera,clock},delta)=>{
  const total=progress.current;
  const p=clamp(total/.55);
  const pointerEase=1-Math.exp(-3.5*Math.min(delta,0.1));
  smoothPointer.current.x+= (pointer.current.x-smoothPointer.current.x)*pointerEase;
  smoothPointer.current.y+= (pointer.current.y-smoothPointer.current.y)*pointerEase;
  // The front hangar exit is along negative Z, directly ahead of the initial camera.
  // Stay near docking-pad altitude until clear of the structure; climb afterward.
  const depart=ease((p-.12)/.56);
  const climb=ease((p-.68)/.32);
  const y=1.4 + depart*0.8 + climb*12 + (reduced?0:Math.sin(clock.elapsedTime*1.6)*.07);
  const z=-depart*34 - climb*16;
  ship.current.position.set(0,y,z);
  // Gentle cursor-follow tilt, strongest while docked; fades during cinematic chase.
  const cursorWeight=1-0.7*ease((p-0.22)/0.55);
  ship.current.rotation.x=-smoothPointer.current.y*0.028*cursorWeight;
  ship.current.rotation.z=-smoothPointer.current.x*0.038*cursorWeight;
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
  // Soft cursor-driven camera pan, layered over the approved chase framing.
  // Keep the motion subtle and fade it during flight; no change to the path.
  const panWeight=1-0.65*ease((p-0.25)/0.65);
  const panX=smoothPointer.current.x*0.42*panWeight;
  const panY=-smoothPointer.current.y*0.24*panWeight;
  camera.position.x+=panX;
  camera.position.y+=panY;
  cameraTarget.current.set(panX*0.3,y+0.5+panY*0.3,z);
  // The approved departure occupies the first 55%; the next segment reveals space.
  const travel=ease((total-.55)/.35);
  const width=window.innerWidth, narrow=width<600;
  const distance=narrow?48:32;
  const destination=new THREE.Vector3(0,28,-140+distance);
  camera.position.lerp(destination,travel);
  cameraTarget.current.lerp(new THREE.Vector3(0,28,-140),travel);
  camera.lookAt(cameraTarget.current);
  const fieldHeight=2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*distance;
  const fieldWidth=fieldHeight*camera.aspect;
  const targetX=(shipAnchor(navigation.current.active,navigation.current.selected!==null,narrow)-.5)*fieldWidth;
  hoverX.current=THREE.MathUtils.damp(hoverX.current,targetX,reduced?1000:5,Math.min(delta,.1));
  const restingY=28+fieldHeight*.23-1;
  ship.current.position.lerp(new THREE.Vector3(hoverX.current,restingY+(reduced?0:Math.sin(clock.elapsedTime*1.4)*.08),-140),travel);
  ship.current.rotation.x*=1-travel;
  ship.current.rotation.z*=1-travel;
  const beamOn=navigation.current.selected!==null && total>=ARRIVAL && Math.abs(hoverX.current-targetX)<.4;
  beamMaterial.current.opacity=THREE.MathUtils.damp(beamMaterial.current.opacity,beamOn?.15:0,5,Math.min(delta,.1));
  beam.current.visible=beamMaterial.current.opacity>.002;
  beam.current.scale.set(1,fieldHeight*.30,1);
  beam.current.position.set(0,-fieldHeight*.15,0);

  if(onFrame.current && clock.elapsedTime%0.15<0.025)onFrame.current({y,roof,inside:camera.position.y<roof});
 });
 return <>
  <DeepSpace/><PlanetaryBounceGlow reduced={reduced}/><OptionalSpaceAsset><CosmicVortex/></OptionalSpaceAsset><OptionalSpaceAsset><DistantPurplePlanet reduced={reduced}/></OptionalSpaceAsset><OptionalSpaceAsset><DistantMoon reduced={reduced}/></OptionalSpaceAsset>
  <ambientLight intensity={1.4}/><hemisphereLight args={['#e2e8ef','#20252b',1.7]}/>
  <directionalLight position={[8,18,12]} intensity={3.0}/>
  <directionalLight position={[-9,8,-10]} intensity={1.4}/>
  <RecolorBuiltInLights scene={platform.scene} platform/><StructuralLEDs scene={platform.scene} kind="platform"/><primitive object={platform.scene} />
  <group ref={ship}><RecolorBuiltInLights scene={ufo.scene}/><StructuralLEDs scene={ufo.scene} kind="ufo"/><primitive object={ufo.scene}/><UfoAccentLights scene={ufo.scene}/>
   <mesh ref={beam} visible={false}><cylinderGeometry args={[.35,5,1,48,1,true]}/><meshBasicMaterial ref={beamMaterial} color="#a663ff" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending}/></mesh>
  </group>
  <PassingTraffic source={ufo.scene} reduced={reduced}/>
 </>;
}
function PassingTraffic({source,reduced}){
 const group=useRef();
 const copies=React.useMemo(()=>[source.clone(true),source.clone(true),source.clone(true)],[source]);
 useFrame(({clock})=>{
  group.current.children.forEach((ship,i)=>{
   const t=reduced?i*.7:clock.elapsedTime*(.025+i*.006)+i*2.1;
   ship.position.set(Math.sin(t)*65,32+i*9,-185-i*26);
   ship.rotation.z=Math.cos(t)*.08;
  });
 });
 return <group ref={group}>{copies.map((model,i)=><group key={i} scale={.16+i*.04}><primitive object={model}/></group>)}</group>;
}
function App(){
 const progress=useRef(0),onFrame=useRef(null),navigation=useRef({active:0,selected:null});
 const [pct,setPct]=useState(0),[active,setActive]=useState(0),[selected,setSelected]=useState(null),[error,setError]=useState('');
 const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 navigation.current={active,selected};
 const close=React.useCallback(()=>setSelected(null),[]);
 useEffect(()=>{
  const query=window.matchMedia('(prefers-reduced-motion: reduce)');
  const changed=()=>setReduced(query.matches);query.addEventListener('change',changed);
  return ()=>query.removeEventListener('change',changed);
 },[]);
 useEffect(()=>{
  if(selected===null)return;
  const previous=document.body.style.overflow;
  document.body.style.overflow='hidden';
  return ()=>{document.body.style.overflow=previous;};
 },[selected]);
 useEffect(()=>{
  const maxScroll=()=>Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
  const update=()=>{progress.current=clamp(window.scrollY/maxScroll());setPct(progress.current*100);};
  const key=e=>{
   if(navigation.current.selected!==null || e.target.closest('button,a,input,textarea,select,[contenteditable]'))return;
   const steps={ArrowDown:.035,ArrowUp:-.035,PageDown:.22,PageUp:-.22,' ':e.shiftKey?-.22:.22,Home:-1,End:1};
   if(!(e.key in steps))return;
   e.preventDefault();
   const next=e.key==='Home'?0:e.key==='End'?1:clamp(progress.current+steps[e.key]);
   window.scrollTo({top:next*maxScroll(),behavior:'instant'});
  };
  window.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',update);window.addEventListener('keydown',key);update();
  return ()=>{window.removeEventListener('scroll',update);window.removeEventListener('resize',update);window.removeEventListener('keydown',key);};
 },[]);
 const arrived=pct>=ARRIVAL*100;
 const phase=pct<9?'01 / DOCKING STATION':pct<38?'02 / DEPARTURE':pct<55?'03 / THE ASCENT':!arrived?'04 / OPEN SPACE':'05 / EXPLORE';
 return <>
  <div className="scene"><Canvas gl={{antialias:true,powerPreference:'high-performance'}} camera={{fov:53,near:.1,far:700,position:[0,3.55,8.4]}} onCreated={({gl})=>gl.setClearColor('#090c10')} onError={e=>setError(String(e))}>
   <React.Suspense fallback={null}><Chamber progress={progress} onFrame={onFrame} navigation={navigation} reduced={reduced}/></React.Suspense>
  </Canvas></div>
  <div className="scroll-track" aria-hidden="true"/>
  {!arrived && <header className={`overlay ${pct>50?'quiet':''}`}><div className="eyebrow">ATLANTA / THE ASCENT</div><h1>Beyond the familiar.</h1><p>Scroll to leave the dock and explore.</p>{error&&<div className="error">{error}</div>}
   <button onClick={()=>window.scrollTo({top:(document.documentElement.scrollHeight-window.innerHeight)*.94,behavior:reduced?'instant':'smooth'})}>EXPLORE</button></header>}
  {arrived && <Navigation active={active} selected={selected} reduced={reduced} onHover={setActive} onSelect={i=>{setActive(i);setSelected(i);}} onClose={close}/>}
  <footer aria-hidden={selected!==null}><span>{phase}</span><div className="progress"><div style={{width:`${pct}%`}}/></div><span>{Math.round(pct)}%</span></footer>
 </>;
}
createRoot(document.getElementById('root')).render(<App/>);

