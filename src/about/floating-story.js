import * as THREE from 'three';

// Canvas-texture line planes and screen-space ellipse displacement.
// The method follows the inspected reference About-page architecture.
// DOM source paragraphs remain in the document for accessibility.
export function installFloatingStory(scene,camera,stage,about){
 const articles=[...document.querySelectorAll('.story-message')];
 if(!articles.length)return {update(){},dispose(){}};
 const chapters=[];
 const textureAssets=[];
 const root=new THREE.Group();
 scene.add(root);
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const smooth=(current,target,rate,dt)=>current+(target-current)*(1-Math.exp(-rate*dt));
 let worldPerPixel=0;
 let scrollSmooth=window.scrollY,positions=[],radiusX=.71,radiusY=.77;
 let lastWidth=0,lastHeight=0,needsLayout=true;
 let enabled=true;
 let impactAt=-100,impactX=0,impactY=0;
 const resize=()=>{needsLayout=true};
 window.addEventListener('resize',resize,{passive:true});
 document.fonts?.ready.then(resize);
 const fontFamily="'Avenir Next', Inter, Arial, sans-serif";
 function makeLine(text,fontPx){
  const pxRatio=Math.min(window.devicePixelRatio||1,2);
  const measure=document.createElement('canvas').getContext('2d');
  measure.font='400 '+fontPx+'px '+fontFamily;
  const inkWidth=Math.max(1,measure.measureText(text).width);
  const pad=14,boxWidth=Math.ceil(inkWidth+pad*2),boxHeight=Math.ceil(fontPx*1.65);
  const image=document.createElement('canvas');
  image.width=Math.ceil(boxWidth*pxRatio);
  image.height=Math.ceil(boxHeight*pxRatio);
  const ctx=image.getContext('2d');
  ctx.scale(pxRatio,pxRatio);
  ctx.clearRect(0,0,boxWidth,boxHeight);
  ctx.fillStyle='#17151b';
  ctx.font=measure.font;
  ctx.textBaseline='middle';
  ctx.fillText(text,pad,boxHeight*.52);
  const texture=new THREE.CanvasTexture(image);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.minFilter=THREE.LinearFilter;
  texture.magFilter=THREE.LinearFilter;
  const material=new THREE.MeshBasicMaterial({
   map:texture,transparent:true,depthTest:true,depthWrite:false,
   toneMapped:false,side:THREE.DoubleSide
  });
  // Segment the text plane so neighboring parts of one line can bend independently.
  // Distort the ink texture at each pixel, not rigid text lines.
  // The original alpha mask confines purple to the letters.
  const wave={
   age:{value:-1},strength:{value:0},amplitude:{value:0},
   origin:{value:new THREE.Vector2(.5,.5)},
   pixelSize:{value:new THREE.Vector2(boxWidth,boxHeight)}
  };
  material.onBeforeCompile=shader=>{
   shader.uniforms.uWaveAge=wave.age;
   shader.uniforms.uWaveStrength=wave.strength;
   shader.uniforms.uWaveAmplitude=wave.amplitude;
   shader.uniforms.uWaveOrigin=wave.origin;
   shader.uniforms.uWavePixelSize=wave.pixelSize;
   shader.vertexShader=shader.vertexShader.replace('#include <common>',
    '#include <common>\nvarying vec2 vTextWaveUv;');
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
    '#include <begin_vertex>\nvTextWaveUv=uv;');
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
    `#include <common>
    varying vec2 vTextWaveUv;
    uniform float uWaveAge;
    uniform float uWaveStrength;
    uniform float uWaveAmplitude;
    uniform vec2 uWaveOrigin;
    uniform vec2 uWavePixelSize;`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',
    `#ifdef USE_MAP
      // Distance is measured in pixels so waves remain circular on narrow text lines.
      vec2 deltaPx=(vTextWaveUv-uWaveOrigin)*uWavePixelSize;
      float distancePx=length(deltaPx);
      float frontPx=max(0.0,uWaveAge)*620.0;
      float offsetPx=distancePx-frontPx;
      float envelope=exp(-pow(offsetPx/125.0,2.0));
      float oscillation=sin(offsetPx*0.052)*0.78+sin(offsetPx*0.086+0.55)*0.22;
      vec2 radial=deltaPx/max(distancePx,1.0);
      vec2 tangent=vec2(-radial.y,radial.x);
      float displacement=uWaveStrength*uWaveAmplitude*envelope*oscillation;
      vec2 warpedUv=vMapUv+(radial+tangent*0.23)*(displacement/max(uWavePixelSize,vec2(1.0)));
      vec4 distortedInk=texture2D(map,clamp(warpedUv,vec2(0.0),vec2(1.0)));
      // Preserve ink color; the ripple itself is external to the text.
      diffuseColor*=distortedInk;
    #endif`);
  };
  material.customProgramCacheKey=()=> 'story-displacement-external-wave-v4';
  const geometry=new THREE.PlaneGeometry(boxWidth*worldPerPixel,boxHeight*worldPerPixel,28,4);
  const mesh=new THREE.Mesh(geometry,material);
  mesh.renderOrder=-2;
  mesh.position.z=-1.2;
  root.add(mesh);
  textureAssets.push({mesh,texture,material,geometry});
  mesh.userData.inkWave=wave;
  return {mesh,width:boxWidth*worldPerPixel,pad:pad*worldPerPixel};
 }
 function breakLines(text,fontPx,maxWidth){
  const ctx=document.createElement('canvas').getContext('2d');
  ctx.font='400 '+fontPx+'px '+fontFamily;
  const words=text.trim().split(/\s+/),out=[];
  let current='';
  for(const word of words){
   const candidate=current?current+' '+word:word;
   if(current&&ctx.measureText(candidate).width>maxWidth){
    out.push(current);current=word;
   }else current=candidate;
  }
  if(current)out.push(current);
  return out;
 }
 function clear(){
  for(const a of textureAssets){
   root.remove(a.mesh);a.geometry.dispose();a.material.dispose();a.texture.dispose();
  }
  textureAssets.length=0;chapters.length=0;positions=[];
 }
 function layout(){
  const rect=stage.getBoundingClientRect(),vw=rect.width,vh=rect.height;
  if(vw<1||vh<1)return;
  if(!needsLayout&&lastWidth===vw&&lastHeight===vh)return;
  needsLayout=false;lastWidth=vw;lastHeight=vh;
  enabled=true;
  const mobile=vw<=700;
  root.visible=enabled;
  clear();
  const fov=THREE.MathUtils.degToRad(camera.fov);
  worldPerPixel=2*Math.tan(fov/2)*(camera.position.z+1.2)/vh;
  // A screen-centric zone, calibrated for the approved head at ~30vh tall.
  // All values use the same projected plane as the text.
  radiusX=mobile?vw*.16*worldPerPixel:clamp(vw*.103*worldPerPixel,.55,1.03);
  radiusY=mobile?vh*.115*worldPerPixel:clamp(vh*.214*worldPerPixel,.60,1.08);
  const fontPx=mobile?clamp(vw*.051,19,21):clamp(vw*.019,18,25);
  const lineHeightPx=fontPx*(mobile?1.45:1.47);
  let nextTop=vh*(mobile?1.16:1.16);
  articles.forEach((article,index)=>{
   const left=article.classList.contains('story-left');
   const paragraphs=[...article.querySelectorAll('p')];
   const lines=[];
   for(const p of paragraphs){
    // Narrower mobile lines let text flow past the centered, stationary head.
    const safeWidth=mobile?Math.max(92,Math.min(128,vw*.27)):
     Math.min(vw*.315,410,Math.max(168,vw*.5-vw*.103-34));
    const chunks=breakLines(p.textContent,fontPx,safeWidth);
    for(const t of chunks)lines.push({text:t,paragraph:false});
    lines.push({text:'',paragraph:true});
   }
   let offset=0;
   for(const item of lines){
    if(item.paragraph){offset+=lineHeightPx*.57;continue;}
    const asset=makeLine(item.text,fontPx);
    const defaultEdge=(left?-(mobile?.12:.16):(mobile?.12:.16));
    const inkWidth=asset.width-2*asset.pad;
    asset.mesh.userData.storyLine={
     left,defaultEdge,worldWidth:asset.width,inkWidth,pad:asset.pad,
     screenY:nextTop+offset,screenFont:fontPx
    };
    asset.mesh.position.x=left?-asset.width/2:asset.width/2;
    asset.mesh.userData.storyLine.baseX=asset.mesh.position.x;
    chapters.push(asset.mesh);
    offset+=lineHeightPx;
   }
   positions[index]={top:nextTop,height:offset};
   nextTop+=offset+Math.max(vh*.085,58);
  });
  // Keep the existing independent 3D floppy visible near the second chapter.
  const floppy=articles[1];
  if(floppy)floppy.style.top=(positions[1].top/vh*100-12)+'svh';
  about.style.minHeight=Math.ceil((nextTop+vh*.17)/vh*100)+'svh';
 }
 function update(dt,modelBounds){
  layout();
  if(!enabled)return;
  // Document native scroll: this controls the same 3D scene without wheel hijacking.
  scrollSmooth=smooth(scrollSmooth,window.scrollY,10,dt);
  const aboutStart=window.scrollY+about.getBoundingClientRect().top;
  const vh=stage.clientHeight;
  const stageRect=stage.getBoundingClientRect();
  // Model transform may vary with pointer motion; follow its projected center.
  let cx=0,cy=0,rx=radiusX,ry=radiusY;
  if(modelBounds&&modelBounds.center){
   cx=modelBounds.center.x;
   cy=modelBounds.center.y;
   if(Number.isFinite(modelBounds.halfWidth))rx=Math.max(rx,modelBounds.halfWidth+.11);
   if(Number.isFinite(modelBounds.halfHeight))ry=Math.max(ry,modelBounds.halfHeight+.12);
  }
  const scrolling=scrollSmooth-aboutStart;
  const impactAge=performance.now()/1000-impactAt;
  const waveActive=impactAge>=0&&impactAge<1.7;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  for(const mesh of chapters){
   const data=mesh.userData.storyLine;
   // Screen position converted to world space at the text plane.
   const pixelY=data.screenY-scrolling;
   mesh.position.y=(vh/2-pixelY)*worldPerPixel;
   const dy=(mesh.position.y-cy)/ry;
   const inside=Math.abs(dy)<1;
   // Keep a readable buffer around the beanie, nose and moving jaw.
   const halfSpan=inside?rx*Math.sqrt(Math.max(0,1-dy*dy)):0;
   const clearance=stage.clientWidth<=700?.075:.20;
   const edge=data.left?
    (inside?Math.min(data.defaultEdge,cx-halfSpan-clearance):data.defaultEdge):
    (inside?Math.max(data.defaultEdge,cx+halfSpan+clearance):data.defaultEdge);
   // Position by the *ink bounds*, not by the transparent texture padding.
   const targetX=data.left?edge-data.inkWidth/2:
    edge+data.inkWidth/2;
   data.baseX=smooth(data.baseX,targetX,17,dt);
   // Animate the ink itself, not a translation of the entire text line.
   // Leave the existing ellipse wrapping and all head materials untouched.
   const wave=mesh.userData.inkWave;
   const centerPx=data.baseX/worldPerPixel+stage.clientWidth/2;
   const boxWidthPx=data.worldWidth/worldPerPixel;
   const boxHeightPx=data.screenFont*1.65;
   wave.origin.value.set((impactX-(centerPx-boxWidthPx/2))/boxWidthPx,0.5+(pixelY-impactY)/boxHeightPx);
   const distance=Math.hypot(centerPx-impactX,pixelY-impactY);
   const arrival=impactAge-distance/620;
   const active=waveActive&&!reduced&&arrival>0;
   const envelope=active?(1-Math.exp(-arrival*17))*Math.exp(-arrival*1.65):0;
   wave.age.value=active?impactAge:-1;
   wave.strength.value=envelope;
   wave.amplitude.value=14.0;
   mesh.position.x=data.baseX;
   mesh.visible=pixelY>-150&&pixelY<vh+150;
  }
 }
 return {
  triggerImpact(clientX,clientY){
   const rect=stage.getBoundingClientRect();
   impactX=clientX-rect.left;
   impactY=clientY-rect.top;
   impactAt=performance.now()/1000;
  },
  update,dispose(){
  window.removeEventListener('resize',resize);
  clear();scene.remove(root);
 }};
}
