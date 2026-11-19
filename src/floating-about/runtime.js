import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {HeadController} from './controller.js';
import {installSurfaceRipple} from './ripple.js';
import {setupFloppyDisk} from './floppy.js';
import {installFloatingStory} from './floating-story.js';
import {installOpticalRipple} from './optical-ripple.js';
import './standalone.css';
import {installScrollBridge} from './scroll-bridge.js';
const scrollBridge=installScrollBridge();

const layout=document.querySelector('.layout');
const about=document.querySelector('.about-journey');
const headLayer=document.querySelector('.head-sticky');
// Mount the fixed head outside the isolated About stacking context.
// z-index cannot escape an ancestor stacking context, even at very high values.
layout.appendChild(headLayer);
const stage=document.querySelector('#stage'),canvas=document.querySelector('#canvas');
const status=document.querySelector('#status'),state=document.querySelector('#state'),modelLabel=document.querySelector('#model');
const colorButton=document.querySelector('#color-switch'),pageRipple=document.querySelector('#page-ripple');
const statementLines=[...document.querySelectorAll('.statement-line')];
const introOverlay=document.querySelector('#experience-loader');
const introMessage=document.querySelector('#loader-message');
const retryButton=document.querySelector('#loader-retry');
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const intro={
 reveal:{value:0}, minY:{value:-0.7}, maxY:{value:0.7}, time:{value:0}
};
let introStart=-1, introFinished=false;
retryButton.addEventListener('click',()=>window.location.reload());
const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.01,100);
camera.position.set(0,0,5.1);
scene.add(new THREE.HemisphereLight(0xffffff,0xd3c4e8,2.1));
const key=new THREE.DirectionalLight(0xffffff,2.6);key.position.set(3,4,5);scene.add(key);
const rim=new THREE.DirectionalLight(0xbca8ff,1.3);rim.position.set(-3,2,-4);scene.add(rim);
const pivot=new THREE.Group(),orient=new THREE.Group();
scene.add(pivot);pivot.add(orient);
orient.rotation.y=-Math.PI/2; // source Blender head points +X
const opticalRipple=installOpticalRipple(renderer,scene,camera,pivot,statementLines);
const controller=new HeadController(),ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
const rippleSurfaces=new Map(),targets=[],morphTargets=[];
let loaded=false,colorTarget=0,colorAmount=0;
let floatingStory=null;
let baseScale=1,pageImpactAt=-100,impactOrigin={x:50,y:50},pendingImpact=null,lastHoverRipple=-100;

colorButton.addEventListener('click',e=>{
 e.stopPropagation();
 colorTarget=colorTarget===0?1:0;
 colorButton.setAttribute('aria-pressed',String(colorTarget===1));
 colorButton.setAttribute('aria-label',colorTarget===1?'Return head to black and white':'Reveal head in color');
});
function addTemporaryLids(){
 // Temporary timing indicator only; hidden until real eyelids are authored.
 // The Candidate F approved geometry is intentionally unchanged.
}
function attach(gltf,source){
 const object=gltf.scene;object.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(object),center=bounds.getCenter(new THREE.Vector3());
 const dims=bounds.getSize(new THREE.Vector3());
 // Screenshot-approved scale: head occupies ~28–30% of a desktop viewport's height.
 baseScale=.94/Math.max(dims.x,dims.y,dims.z);
 object.position.copy(center).multiplyScalar(-1);
 orient.scale.setScalar(baseScale);orient.add(object);
 object.traverse(o=>{
  if(!o.isMesh)return;
  targets.push(o);o.frustumCulled=false;
  rippleSurfaces.set(o,installSurfaceRipple(o,intro));
  for(const [name,index] of Object.entries(o.morphTargetDictionary||{}))
   if(/blink|eyes.?close/i.test(name))morphTargets.push({o,index});
 });
 if(!morphTargets.length)addTemporaryLids();

 const headBounds=new THREE.Box3().setFromObject(pivot);
 intro.minY.value=headBounds.min.y;
 intro.maxY.value=headBounds.max.y;
 loaded=true;modelLabel.textContent=source==='candidate'?'Candidate F textured proxy':'Fallback source model';
 status.textContent='Interactive floating head ready';
}
const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
async function load(){
 for(const [path,type] of [['/models/about/head-interactive.glb','candidate'],['/models/about/source_meshopt.glb','fallback']]){
  try{attach(await loader.loadAsync(path),type);
   introMessage.textContent='Preparing materials';
   resize();
   // Compile the scene while the opaque loader covers every partially-ready frame.
   await renderer.compileAsync(scene,camera);
   // Render a hidden first frame to upload textures and warm the GPU.
   renderer.render(scene,camera);
   introStart=performance.now()/1000;
   introOverlay.classList.add('is-exiting');
   introOverlay.addEventListener('transitionend',()=>introOverlay.remove(),{once:true});
   return;
  }
  catch(error){console.warn('Unable to load',path,error);}
 }
 status.textContent='3D model unavailable; check your GLB asset';
 introMessage.textContent='The 3D model could not be loaded';
 retryButton.hidden=false;
}
load();
setupFloppyDisk(document.querySelector('#disk-view'));
floatingStory=installFloatingStory(scene,camera,stage,document.querySelector('.about-journey'));
function coordinates(e){
 const r=canvas.getBoundingClientRect();
 return {x:THREE.MathUtils.clamp((e.clientX-r.left)/r.width*2-1,-1,1),
         y:THREE.MathUtils.clamp(1-(e.clientY-r.top)/r.height*2,-1,1)};
}
function rayHit(p){
 if(!loaded||!introFinished)return null;
 pointer.set(p.x,p.y);ray.setFromCamera(pointer,camera);
 return ray.intersectObjects(targets,true)[0]||null;
}
function startPageImpact(){
 const rect=stage.getBoundingClientRect();
 // Project the head's own center instead of using the click contact point.
 // All waves emerge from behind the head, including when the head is moving.
 pivot.updateWorldMatrix(true,false);
 const center=pivot.getWorldPosition(new THREE.Vector3()).project(camera);
 const originX=rect.left+(center.x*.5+.5)*rect.width;
 const originY=rect.top+(.5-center.y*.5)*rect.height;
 impactOrigin={x:(originX-rect.left)/rect.width*100,y:(originY-rect.top)/rect.height*100};
 pageImpactAt=controller.time;
 floatingStory?.triggerImpact(originX,originY);
 opticalRipple.trigger(originX,originY,rect,controller.time);
 layout.classList.remove('is-impact');
 void layout.offsetWidth; // replay typography spring when hit repeatedly
 layout.classList.add('is-impact');
}
function triggerHit(contact,e){
 if(!introFinished)return;
 // Convert the actual contact point into viewport space to identify the hit side.
 const projected=contact?contact.point.clone().project(camera):null;
 const side=projected?(projected.x<-.07?-1:projected.x>.07?1:0):0;
 if(!controller.hit(side))return;
 if(contact){
  rippleSurfaces.get(contact.object)?.trigger(contact.point,controller.time,1);
 }
 pendingImpact={x:e.clientX,y:e.clientY}; // typography reacts on collision, not click
 status.textContent='Impact, purple ripple, and shake-off';
}
window.addEventListener('pointermove',e=>{
 const p=coordinates(e);
 // Whole-viewport pointer normalization keeps following at screen edges.
 controller.movePointer(p.x,p.y);
 if(loaded&&controller.time-lastHoverRipple>1.7&&controller.time-controller.hitStart>1.3){
  const contact=rayHit(p);
  if(contact){rippleSurfaces.get(contact.object)?.trigger(contact.point,controller.time,.30);
    lastHoverRipple=controller.time;}
 }
},{passive:true});
window.addEventListener('blur',()=>controller.movePointer(0,0));
window.addEventListener('pointerdown',e=>{
 const contact=rayHit(coordinates(e));
 if(contact)triggerHit(contact,e);
});
window.addEventListener('keydown',e=>{
 if(e.code==='Enter'&&e.target===canvas){
  e.preventDefault();
  const rect=canvas.getBoundingClientRect(),center={clientX:rect.left+rect.width/2,clientY:rect.top+rect.height/2};
  const contact=rayHit({x:0,y:0});
  triggerHit(contact,center);
 }
});
function resize(){
 const w=Math.max(stage.clientWidth,1),h=Math.max(stage.clientHeight,1);
 camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
 opticalRipple.resize();
}
new ResizeObserver(resize).observe(stage);resize();

let last=performance.now(),lastState='';
function frame(now){
 requestAnimationFrame(frame);
 const dt=Math.min(.05,(now-last)/1000);last=now;
 if(!scrollBridge.isActive())return;
 const motion=controller.update(dt);
 if(introStart>=0&&!introFinished){
  const elapsed=Math.max(0,now/1000-introStart);
  const progress=reducedMotion.matches?1:Math.min(1,elapsed/1.65);
  // Smooth growth of the reveal edge, rather than an opacity-only fade.
  intro.reveal.value=progress*progress*(3-2*progress);
  intro.time.value=elapsed;
  if(progress>=1){intro.reveal.value=1;introFinished=true;status.textContent='Interactive floating head ready';}
 }
 const mobile=stage.clientWidth<=700;
 // A small floating companion on phones, not a full-screen portrait.
 const phoneScale=mobile?(stage.clientWidth<=420?.59:.66):1;
 // Keep the starting head centered within the opening typography.
 pivot.position.set(motion.horizontal,motion.vertical*(mobile?.60:1),motion.depth);
 pivot.rotation.set(motion.pitch,motion.yaw,motion.roll,'YXZ');
 orient.scale.setScalar(baseScale*motion.scale*phoneScale);
 // Use this frame's updated head position when the impact begins.
 if(pendingImpact&&motion.contact){
  startPageImpact();
  pendingImpact=null;
 }
 colorAmount+=(colorTarget-colorAmount)*(1-Math.exp(-dt*5.5));
 for(const ripple of rippleSurfaces.values()){
  ripple.colorMix.value=colorAmount;
  ripple.update(controller.time);
 }
 for(const {o,index} of morphTargets)o.morphTargetInfluences[index]=motion.blink;
 const age=controller.time-pageImpactAt;
 // Let the opening lines respond as a cohesive, damped wave instead of a CSS shake.
 const reduceMotionNow=reducedMotion.matches;
 for(const line of statementLines){
  let offsetX=0,offsetY=0;
  if(age>=0&&age<2.2&&!reduceMotionNow){
   const r=line.getBoundingClientRect();
   // Correct for the preceding frame's transform when finding the rest center.
   // Otherwise measuring already-displaced text feeds jitter back into the wave.
   const dx=r.left+r.width/2-(line._waveX||0)-window.innerWidth*impactOrigin.x/100;
   const dy=r.top+r.height/2-(line._waveY||0)-window.innerHeight*impactOrigin.y/100;
   const distance=Math.hypot(dx,dy);
   const arrival=age-distance/480;
   if(arrival>0){
    const amount=5*(1-Math.exp(-arrival*24))*
     Math.exp(-arrival*3.1)*Math.sin(arrival*Math.PI*2/0.48);
    offsetX=amount*dx/(distance+16);
    offsetY=amount*dy/(distance+16)*.65;
   }
  }
  // Headline keeps its ink color while the surrounding field propagates.
  line._waveX=offsetX;
  line._waveY=offsetY;
  line.style.transform=`translate3d(${offsetX.toFixed(3)}px,${offsetY.toFixed(3)}px,0)`;
 }
 // The reference-inspired shader now renders the optical refraction.
 // The older CSS approximation stays off to avoid double-light artifacts.
 pageRipple.style.opacity='0';
 if(age>=1.1&&layout.classList.contains('is-impact'))layout.classList.remove('is-impact');
 if(motion.state!==lastState){lastState=motion.state;state.textContent=motion.state;}
 // Fixed viewport anchor for the complete story. As the About section ends,
 // deliberately carry the head offscreen with the section; never let the
 // sticky layout boundary unexpectedly drag it upward mid-chapter.
 const aboutRect=about.getBoundingClientRect();
 // The opener belongs only to the first viewport, never behind later chapters.
 about.classList.toggle('is-reading',aboutRect.top < -window.innerHeight*.62);
 const overflowPastEnd=Math.max(0,window.innerHeight-aboutRect.bottom);
 headLayer.style.transform=`translate3d(0,${-overflowPastEnd}px,0)`;
 headLayer.style.visibility=aboutRect.bottom<=0?'hidden':'visible';
 if(floatingStory)floatingStory.update(dt);
 opticalRipple.setEnabled(!reduceMotionNow);
 opticalRipple.render(controller.time);
}
requestAnimationFrame(frame);

