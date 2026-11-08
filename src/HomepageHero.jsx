import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {gsap} from 'gsap';
import {createPortal} from 'react-dom';
import './HomepageHero.css';
const root='/homepage-canva/';
const states=[
 ['Large title.svg','Large title overlay mask to man.svg'],
 ['Large Title Branding.svg','Large Title Branding overlay mask to man.svg'],
 ['Large Title Designer.svg','Large Title Designer overlay mask to man.svg'],
 ['Large Title Creation.svg','Large Title Creation overlay mask to man.svg'],
 ['Large Title Guidelines.svg','Large Title Guidelines Large Title Guidelines overlay mask to man.svg'],
 ['Large Title Learning.svg','Large Title Learning Large Title Creation overlay mask to man.svg'],
 ['Large Title Solving.svg','Large Title Solving  overlay mask to man.svg']
];
const labels=['Portfolio','Branding','Designer','Creation','Guidelines','Learning','Solving'];
// Editable copy. Portfolio keeps its original Canva service-line artwork.
const subtitles=['WELCOME TO THE','THE ART OF','BEHIND THE','THE PROCESS OF','BUILDING','ALWAYS','CREATIVE PROBLEM'];
const bodyLines=[
 ['Brand identity, digital experiences, and visuals built to connect.'],
 ['Distinctive identities built with clarity, character, and purpose.',
  'Every detail contributes to a recognizable brand.'],
 ['Design is where thoughtful details meet bold ideas.',
  'I create visual experiences with personality.'],
 ['From the first concept to the finishing touch,',
  'every idea is an opportunity to make something memorable.'],
 ['Clear creative standards make a brand consistent.',
  'Strong guidelines give great ideas room to grow.'],
 ['Curiosity keeps the creative process moving.',
  'I explore, experiment, and keep refining my craft.'],
 ['Making complicated challenges feel intuitive.',
  'Design can turn problems into meaningful solutions.']
];
// Exact circle centers from the original Canva Indicators.svg (1440 x 810 viewBox).
const aboutPrinciples=[
 {name:'THINK',detail:'I look for the idea underneath the design—the part that gives everything else a reason to exist.'},
 {name:'BUILD',detail:'Identity systems, logos, digital experiences, and visual direction built to work as one clear system.'},
 {name:'REFINE',detail:'I keep pushing the work until every decision feels intentional rather than merely finished.'}
];
const aboutCapabilities=['Brand identity','Logo systems','UX / UI + web','Art direction','Motion + interaction','AI-assisted creative workflows'];
const aboutProof=[
 ['20+ years','Designing brands, identities, visual communication, and digital experiences.'],
 ['Independent by nature','Working directly with businesses, founders, and ideas from concept through execution.'],
 ['Design + technology','Visual design combined with interaction, motion, web development, and modern creative tools.']
];

const indicatorXs=[483.425781,517.5,551.574219,585.644531,619.71875,653.789062,687.863281];
const indicatorY=195.027344;
const layer=(name,cls)=> <img className={'jw-art '+cls} src={root+encodeURIComponent(name)} alt="" aria-hidden="true" draggable="false"/>;

// Each Canva title contains one vector path per glyph. Wrapping those paths
// preserves the exact approved lettering during the 3D-style camera rush.
function buildFlyThroughArtwork(xml){
 const doc=new DOMParser().parseFromString(xml,'image/svg+xml');
 if(doc.querySelector('parsererror')||doc.documentElement.localName!=='svg')return null;
 const svg=document.importNode(doc.documentElement,true);
 svg.classList.add('jw-about-fly-svg');
 svg.removeAttribute('width');
 svg.removeAttribute('height');
 svg.querySelectorAll('[clip-path]').forEach(el=>el.removeAttribute('clip-path'));
 const ns='http://www.w3.org/2000/svg';
 const glyphs=[...svg.querySelectorAll('path')].filter(el=>!el.closest('defs')).map(path=>{
  const group=document.createElementNS(ns,'g');
  group.setAttribute('class','jw-about-fly-glyph');
  path.parentNode.insertBefore(group,path);
  group.appendChild(path);
  return group;
 });
 return glyphs.length?{svg,glyphs}:null;
}

// Render each original Canva vector path in its own *pixel-aligned* stage.
// SVG groups use viewBox/local transform units, which can make a numerically
// centered destination look visibly low. HTML elements use viewport pixels,
// so the transform center here is exactly the viewer's eye-level center.
function makeScreenAlignedGlyphs(vector,flight,stage){
 const stageRect=stage.getBoundingClientRect();
 const ns='http://www.w3.org/2000/svg';
 const holders=[];
 for(const group of vector.glyphs){
  const path=group.querySelector('path');
  if(!path)continue;
  const rect=path.getBoundingClientRect();
  const ctm=path.getScreenCTM();
  if(!ctm||!rect.width||!rect.height)continue;
  const holder=document.createElement('div');
  holder.className='jw-about-screen-glyph';
  holder.style.left=(rect.left-stageRect.left)+'px';
  holder.style.top=(rect.top-stageRect.top)+'px';
  holder.style.width=rect.width+'px';
  holder.style.height=rect.height+'px';
  const svg=document.createElementNS(ns,'svg');
  svg.setAttribute('viewBox','0 0 '+rect.width+' '+rect.height);
  svg.setAttribute('width','100%');
  svg.setAttribute('height','100%');
  svg.setAttribute('aria-hidden','true');
  const copy=path.cloneNode(true);
  const style=getComputedStyle(path);
  copy.removeAttribute('transform');
  copy.setAttribute('fill',style.fill||'#8a4cf3');
  copy.setAttribute('fill-opacity',style.fillOpacity||'1');
  if(style.stroke&&style.stroke!=='none'){
   copy.setAttribute('stroke',style.stroke);
   copy.setAttribute('stroke-width',style.strokeWidth);
  }
  // Transform the path directly into this letter's pixel-space crop.
  copy.setAttribute('transform','matrix('+[
   ctm.a,ctm.b,ctm.c,ctm.d,ctm.e-rect.left,ctm.f-rect.top
  ].join(' ')+')');
  svg.appendChild(copy);
  holder.appendChild(svg);
  flight.appendChild(holder);
  holders.push(holder);
 }
 vector.svg.remove();
 return holders;
}
export default function HomepageHero(){
 const [index,setIndex]=useState(0);
 const homepageRef=useRef(null);
 const [pending,setPending]=useState(null);
 const [aboutOpen,setAboutOpen]=useState(false);
 const [aboutPrinciple,setAboutPrinciple]=useState(0);
 const aboutStageRef=useRef(null),aboutSplashRef=useRef(null),aboutFlightRef=useRef(null);
 const aboutContentRef=useRef(null),aboutCloseRef=useRef(null);
 const aboutLaunchQueuedRef=useRef(false),aboutClosingRef=useRef(false);
 const aboutReturnFocusRef=useRef(true),titleSvgCacheRef=useRef(new Map());
 useEffect(()=>{
  // Warm the exact Canva vector paths so the camera rush starts immediately.
  let live=true;
  states.forEach(([name])=>{
   fetch(root+encodeURIComponent(name),{cache:'force-cache'})
    .then(res=>res.ok?res.text():null)
    .then(xml=>{if(live&&xml)titleSvgCacheRef.current.set(name,xml)})
    .catch(()=>{});
  });
  return()=>{live=false};
 },[]);
 const titleRunRef=useRef(null);
 const pendingRef=useRef(null),indexRef=useRef(0),touchRef=useRef(null),directionRef=useRef(1);
 indexRef.current=index;
 const changeTitle=(next,swipeDirection)=>{
  // Wrap the first and last titles without losing the direction of the gesture.
  const wrapped=((next%states.length)+states.length)%states.length;
  if(pendingRef.current!==null||wrapped===indexRef.current)return;
  directionRef.current=swipeDirection??(wrapped>indexRef.current?1:-1);
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
   indexRef.current=wrapped;setIndex(wrapped);return;
  }
  pendingRef.current=wrapped;setPending(wrapped);
 };
 useLayoutEffect(()=>{
  if(pending===null)return;
  const host=homepageRef.current;
  // Each original Canva title is a single vector drawing, never vertical slices.
  // Purple and outline are paired and transformed by the same progress value.
  const distance=Math.max(host.clientWidth,800);
  // Explicit gesture direction also applies at the first/last title boundary.
  const direction=directionRef.current;
  const getPair=titleIndex=>({
   purple:host.querySelector('.jw-live-title-base[data-title-index="'+titleIndex+'"] .jw-title-whole'),
   white:host.querySelector('.jw-live-title-overlay[data-title-index="'+titleIndex+'"] .jw-title-whole')
  });
  // All seven Canva title pairs stay mounted, so nothing is replaced mid-swipe.
  const outgoing=getPair(indexRef.current),incoming=getPair(pending);
  if(!outgoing.purple||!outgoing.white||!incoming.purple||!incoming.white)return;
  const move=(pair,x,stretch=1)=>{
   gsap.set([pair.purple,pair.white],{x,scaleX:stretch,transformOrigin:'50% 50%',force3D:true});
  };
  // Body retracts vertically into the title's lower edge; subtitle only shifts a letter-width.
  const stage=(type,which)=>host.querySelector('.jw-'+type+'-stage[data-'+type+'-index="'+which+'"] .jw-'+type+'-motion');
  const bodyOut=stage('body',indexRef.current),bodyIn=stage('body',pending);
  const subtitleOut=stage('subtitle',indexRef.current),subtitleIn=stage('subtitle',pending);
  if(!bodyOut||!bodyIn||!subtitleOut||!subtitleIn)return;
  const artworkHeight=Math.min(host.clientHeight,host.clientWidth*9/16);
  const bodyShift=artworkHeight*.235;
  const shortSlide=artworkHeight*.034;
  const titleLowerEdge=(host.clientHeight-artworkHeight)/2+artworkHeight*.515;
  host.style.setProperty('--jw-body-reveal-top',titleLowerEdge.toFixed(2)+'px');
  move(outgoing,0);move(incoming,distance*direction);
  gsap.set(bodyOut,{y:0,autoAlpha:1});
  gsap.set(bodyIn,{y:-bodyShift,autoAlpha:0});
  gsap.set(subtitleOut,{x:0,autoAlpha:1});
  gsap.set(subtitleIn,{x:shortSlide*direction,autoAlpha:0});
  let cancelled=false;
  let timeline=null;
  const leaving={x:0,stretch:1},arriving={x:distance*direction,stretch:1};
  // Use the same progress for each purple/white pair, avoiding any timing split.
  const run=()=>{
   if(cancelled)return;
   timeline=gsap.timeline({onComplete:()=>{
    indexRef.current=pending;setIndex(pending);pendingRef.current=null;setPending(null);
    if(aboutLaunchQueuedRef.current){
     aboutLaunchQueuedRef.current=false;
     setAboutOpen(true);
    }
   }});
   titleRunRef.current=timeline;
   // Exit order: body retracts, title begins moving, then the short subtitle shift.
   timeline.to(bodyOut,{y:-bodyShift,duration:.29,ease:'power2.in'},0)
    .to(bodyOut,{autoAlpha:0,duration:.13,ease:'power1.in'},.16)
    .to(leaving,{x:-distance*direction,duration:.72,ease:'power3.inOut',onUpdate:()=>move(outgoing,leaving.x,leaving.stretch)},.27)
    .to(leaving,{stretch:1.018,duration:.22,ease:'power2.out',onUpdate:()=>move(outgoing,leaving.x,leaving.stretch)},.27)
    .to(leaving,{stretch:1,duration:.3,ease:'power2.inOut',onUpdate:()=>move(outgoing,leaving.x,leaving.stretch)},.49)
    .to(subtitleOut,{x:-shortSlide*direction,autoAlpha:0,duration:.22,ease:'power2.inOut'},.42)
    // Arrival order: subtitle reveals within its fixed area, then title settles,
    // and body emerges downward from beneath the title, last.
    .to(arriving,{x:0,duration:.78,ease:'power3.out',onUpdate:()=>move(incoming,arriving.x,arriving.stretch)},.52)
    .to(arriving,{stretch:1.022,duration:.25,ease:'power2.out',onUpdate:()=>move(incoming,arriving.x,arriving.stretch)},.52)
    .to(arriving,{stretch:1,duration:.38,ease:'power2.inOut',onUpdate:()=>move(incoming,arriving.x,arriving.stretch)},.77)
    .to(subtitleIn,{x:0,autoAlpha:1,duration:.26,ease:'power2.out'},.97)
    .to(bodyIn,{y:0,autoAlpha:1,duration:.38,ease:'power3.out'},1.35);
  };
  // Both images of the incoming title must be decoded before its first frame.
  // The outgoing title remains in place until that is true.
  const images=[...incoming.purple.querySelectorAll('img'),...incoming.white.querySelectorAll('img')];
  Promise.all(images.map(img=>img.decode?img.decode().catch(()=>{}):Promise.resolve())).then(run);
  return()=>{cancelled=true;timeline?.kill();titleRunRef.current=null};
 },[pending]);
 useEffect(()=>{
  const host=homepageRef.current;if(!host)return;
  const onWheel=e=>{
   // Vertical wheel movement always belongs to page navigation.
   if(Math.abs(e.deltaX)<24||Math.abs(e.deltaX)<=Math.abs(e.deltaY)*1.25)return;
   e.preventDefault();
   if(pendingRef.current!==null)return;
   const step=e.deltaX>0?1:-1;
   changeTitle(indexRef.current+step,step);
  };
  const onTouchStart=e=>{touchRef.current={x:e.touches[0].clientX,y:e.touches[0].clientY}};
  const onTouchEnd=e=>{
   const start=touchRef.current;touchRef.current=null;if(!start)return;
   const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;
   if(Math.abs(dx)<45||Math.abs(dx)<Math.abs(dy)*1.25)return;
   const step=dx<0?1:-1;
   changeTitle(indexRef.current+step,step);
  };
  host.addEventListener('wheel',onWheel,{passive:false});
  host.addEventListener('touchstart',onTouchStart,{passive:true});
  host.addEventListener('touchend',onTouchEnd,{passive:true});
  return()=>{host.removeEventListener('wheel',onWheel);host.removeEventListener('touchstart',onTouchStart);host.removeEventListener('touchend',onTouchEnd)};
 },[]);
 useEffect(()=>{
  const host=homepageRef.current;
  const portrait=host?.querySelector('.jw-art-man');
  if(!host||!portrait)return;
  let cancelled=false;
  const align=()=>{
   if(cancelled||!portrait.complete||!portrait.naturalWidth)return;
   const w=portrait.naturalWidth,h=portrait.naturalHeight;
   const canvas=document.createElement('canvas');
   canvas.width=w;canvas.height=h;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   if(!ctx)return;
   try{
    ctx.clearRect(0,0,w,h);
    ctx.drawImage(portrait,0,0,w,h);
    const pixels=ctx.getImageData(0,0,w,h).data;
    let last=-1;
    for(let y=h-1;y>=0&&last<0;y--){
     for(let x=0;x<w;x++){
      if(pixels[(y*w+x)*4+3]>24){last=y+1;break}
     }
    }
    if(last<0)return;
    const box=host.getBoundingClientRect();
    const scale=Math.min(box.width/w,box.height/h);
    const imageTop=(box.height-h*scale)/2;
    const visibleBottom=imageTop+last*scale;
    host.style.setProperty('--jw-portrait-bottom-offset',Math.max(0,box.height-visibleBottom).toFixed(2)+'px');
   }catch(error){host.style.removeProperty('--jw-portrait-bottom-offset')}
  };
  const observer=new ResizeObserver(align);
  observer.observe(host);
  if(portrait.complete)align();
  portrait.addEventListener('load',align);
  return()=>{cancelled=true;observer.disconnect();portrait.removeEventListener('load',align)};
 },[]);
 const openAbout=event=>{
  event.preventDefault();
  if(aboutOpen||aboutClosingRef.current)return;
  aboutReturnFocusRef.current=true;
  // If the visitor clicks during a swipe, finish the current word first.
  if(pendingRef.current!==null){aboutLaunchQueuedRef.current=true;return;}
  setAboutOpen(true);
 };
 const closeAbout=async()=>{
  if(aboutClosingRef.current)return;
  aboutClosingRef.current=true;
  const stage=aboutStageRef.current,flight=aboutFlightRef.current,splash=aboutSplashRef.current;
  const content=aboutContentRef.current,close=aboutCloseRef.current,hero=homepageRef.current;
  if(!stage||!flight||!splash||!content||!close||!hero){setAboutOpen(false);return;}
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){setAboutOpen(false);return;}
  const activeTitle=indexRef.current;
  const originalTitle=hero.querySelector('.jw-live-title-base[data-title-index="'+activeTitle+'"] img');
  const originalLayers=[...hero.querySelectorAll('.jw-live-title-visible')];
  const finish=()=>{originalLayers.forEach(node=>node.style.removeProperty('opacity'));setAboutOpen(false);};
  let glyphs=[],fallback=null;
  flight.innerHTML='';
  try{
   let markup=titleSvgCacheRef.current.get(states[activeTitle][0]);
   if(!markup){const res=await fetch(root+encodeURIComponent(states[activeTitle][0]),{cache:'force-cache'});if(!res.ok)throw new Error();markup=await res.text();titleSvgCacheRef.current.set(states[activeTitle][0],markup);}
   const vector=buildFlyThroughArtwork(markup);if(!vector)throw new Error();
   const box=originalTitle?.getBoundingClientRect(),stageBox=stage.getBoundingClientRect(),p=vector.svg.style;
   p.left=((box?.left??stageBox.left)-stageBox.left)+'px';p.top=((box?.top??stageBox.top)-stageBox.top)+'px';p.width=(box?.width??stageBox.width)+'px';p.height=(box?.height??stageBox.height)+'px';
   flight.appendChild(vector.svg);glyphs=makeScreenAlignedGlyphs(vector,flight,stage);if(!glyphs.length)throw new Error();
  }catch(e){if(originalTitle){fallback=originalTitle.cloneNode(true);fallback.className='jw-about-fly-fallback';const b=originalTitle.getBoundingClientRect(),sb=stage.getBoundingClientRect();Object.assign(fallback.style,{left:(b.left-sb.left)+'px',top:(b.top-sb.top)+'px',width:b.width+'px',height:b.height+'px'});flight.appendChild(fallback);}}
  gsap.set(flight,{autoAlpha:1});
  const cx=window.innerWidth/2,cy=window.innerHeight/2;
  if(glyphs.length){
   glyphs.forEach(g=>{const r=g.getBoundingClientRect();const scale=Math.max(36,Math.min(100,Math.max(window.innerWidth/Math.max(r.width,1),window.innerHeight/Math.max(r.height,1))*2.1));gsap.set(g,{x:cx-(r.left+r.width/2),y:cy-(r.top+r.height/2),scale,transformOrigin:'50% 50%',force3D:true});});
  }else if(fallback){const r=fallback.getBoundingClientRect();gsap.set(fallback,{x:cx-(r.left+r.width/2),y:cy-(r.top+r.height/2),scale:Math.max(34,window.innerWidth/Math.max(r.width*.3,1)*2),transformOrigin:'50% 50%',force3D:true});}
  const tl=gsap.timeline({onComplete:finish});
  tl.to([content,close],{autoAlpha:0,y:20,duration:.28,ease:'power2.in'},0)
    .to(splash,{autoAlpha:0,duration:.46,ease:'power2.inOut'},.22);
  if(glyphs.length)tl.to(glyphs,{x:0,y:0,scale:1,duration:1.45,ease:'power2.out',force3D:true,stagger:{each:.008,from:'end'}},.18);
  else if(fallback)tl.to(fallback,{x:0,y:0,scale:1,duration:1.45,ease:'power2.out',force3D:true},.18);
 };
 useLayoutEffect(()=>{
  if(!aboutOpen)return;
  const stage=aboutStageRef.current;
  const flight=aboutFlightRef.current;
  const splash=aboutSplashRef.current;
  const content=aboutContentRef.current;
  const close=aboutCloseRef.current;
  if(!stage||!flight||!splash||!content||!close)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const savedOverflow=document.body.style.overflow;
  stage.scrollTop=0;
  document.body.style.overflow='hidden';
  let cancelled=false,flightTimeline=null;
  const activeTitle=indexRef.current;
  const hero=homepageRef.current;
  const originalTitle=hero?.querySelector('.jw-live-title-base[data-title-index="'+activeTitle+'"] img');
  const originalLayers=[...hero.querySelectorAll('.jw-live-title-visible')];
  const restoreOriginal=()=>originalLayers.forEach(node=>node.style.removeProperty('opacity'));
  // No radial-dot wipe: the lettering itself is the transition. The full-screen purple field fades in only after the letters fill the frame.
  gsap.set(splash,{autoAlpha:0,clipPath:'none'});
  gsap.set(content,{autoAlpha:0,y:34});
  gsap.set(close,{autoAlpha:0,y:-10});
  if(reduced){
   gsap.set(splash,{autoAlpha:1,clipPath:'none'});
   gsap.set([content,close],{autoAlpha:1,y:0});
   close.focus({preventScroll:true});
   return()=>{document.body.style.overflow=savedOverflow;aboutClosingRef.current=false;};
  }
  async function launch(){
   let glyphs=[],fallback=null;
   const url=root+encodeURIComponent(states[activeTitle][0]);
   try{
    let markup=titleSvgCacheRef.current.get(states[activeTitle][0]);
    if(!markup){
     const res=await fetch(url,{cache:'force-cache'});
     if(!res.ok)throw new Error('Title SVG was not available');
     markup=await res.text();
     titleSvgCacheRef.current.set(states[activeTitle][0],markup);
    }
    const vector=buildFlyThroughArtwork(markup);
    if(!vector)throw new Error('Title SVG did not contain glyph paths');
    if(cancelled)return;
    const originalBounds=originalTitle?.getBoundingClientRect();
    const stageBounds=stage.getBoundingClientRect();
    const placement=vector.svg.style;
    placement.left=((originalBounds?.left??stageBounds.left)-stageBounds.left)+'px';
    placement.top=((originalBounds?.top??stageBounds.top)-stageBounds.top)+'px';
    placement.width=(originalBounds?.width??stageBounds.width)+'px';
    placement.height=(originalBounds?.height??stageBounds.height)+'px';
    flight.appendChild(vector.svg);
    glyphs=makeScreenAlignedGlyphs(vector,flight,stage);
    if(!glyphs.length)throw new Error('Vector letters could not be isolated');
   }catch(error){
    // Fallback keeps navigation functional if an SVG can't be fetched.
    if(cancelled)return;
    if(originalTitle){
     fallback=originalTitle.cloneNode(true);
     fallback.className='jw-about-fly-fallback';
     const box=originalTitle.getBoundingClientRect(),stageBox=stage.getBoundingClientRect();
     Object.assign(fallback.style,{left:(box.left-stageBox.left)+'px',top:(box.top-stageBox.top)+'px',width:box.width+'px',height:box.height+'px'});
     flight.appendChild(fallback);
    }
   }
   if(cancelled)return;
   // The copy is now in the same position as the live title: no blink at launch.
   originalLayers.forEach(node=>node.style.opacity='0');
   const centerX=window.innerWidth/2,centerY=window.innerHeight/2;
   const rushStart=.06;
   // Every letter converges toward the same camera point, unlike the old
   // fan-out that pushed letters toward the edges of the viewport.
   if(glyphs.length){
    // Individual HTML layers translate in pixels; their own visual centers
    // move straight to 50vw/50vh at every viewport size.
    gsap.set(glyphs,{transformOrigin:'50% 50%',force3D:true});
    const targets=glyphs.map(glyph=>{
     const rect=glyph.getBoundingClientRect();
     const midX=rect.left+rect.width/2,midY=rect.top+rect.height/2;
     // A letter becomes larger than the screen, completing the engulfing rush.
     const scale=Math.max(36,Math.min(100,
      Math.max(window.innerWidth/Math.max(rect.width,1),
               window.innerHeight/Math.max(rect.height,1))*2.1));
     return {x:centerX-midX,y:centerY-midY,scale};
    });
    flightTimeline=gsap.timeline({onComplete:()=>{
     if(!cancelled)close.focus({preventScroll:true});
    }});
    // A short cinematic anticipation is followed by a rapid depth rush.
    flightTimeline.to(glyphs,{scale:1.1,duration:.18,ease:'power1.out'},0);
    glyphs.forEach((glyph,i)=>{
     const t=targets[i];
     flightTimeline.to(glyph,{
      x:t.x,y:t.y,scale:t.scale,rotation:0,duration:1.2,
      ease:'power3.in',force3D:true
     },rushStart+i*.027);
    });
    // Keep the vectors opaque while enlarging; the splash is revealed by
    // their scale, not by a small circle expanding from a dot.
   }else{
    flightTimeline=gsap.timeline({onComplete:()=>{
     if(!cancelled)close.focus({preventScroll:true});
    }});
    if(fallback){
     const bounds=fallback.getBoundingClientRect();
     flightTimeline.to(fallback,{
      x:centerX-(bounds.left+bounds.width/2),
      y:centerY-(bounds.top+bounds.height/2),
      scale:Math.max(34,window.innerWidth/Math.max(bounds.width*.3,1)*2),
      duration:1.28,ease:'power3.in'
     },0);
    }
   }
   // The purple field appears as the oversized letters engulf the viewer.
   // It covers the entire viewport at once; there is no circular dot.
   flightTimeline.to(splash,{autoAlpha:1,duration:.48,ease:'power2.inOut'},1.08)
    .to(flight,{autoAlpha:0,duration:.22,ease:'power1.out'},1.43)
    .to(content,{autoAlpha:1,y:0,duration:.64,ease:'power3.out'},1.53)
    .to(close,{autoAlpha:1,y:0,duration:.4,ease:'power2.out'},1.67);
  }
  launch();
  return()=>{
   cancelled=true;
   flightTimeline?.kill();
   restoreOriginal();
   document.body.style.overflow=savedOverflow;
   aboutClosingRef.current=false;
   const hit=homepageRef.current?.querySelector('.jw-hit-more');
   if(aboutReturnFocusRef.current&&hit&&document.contains(hit))hit.focus({preventScroll:true});
  };
 },[aboutOpen]);
 useEffect(()=>{
  if(!aboutOpen)return;
  const onEscape=e=>{if(e.key==='Escape'){e.preventDefault();closeAbout();}};
  window.addEventListener('keydown',onEscape);
  return()=>window.removeEventListener('keydown',onEscape);
 },[aboutOpen]);
 const activeIndicator=pending===null?index:pending;
 const visibleDuringSwipe=which=>which===index||which===pending;
 const liveSubtitle=which=><div key={'subtitle-'+which}
   className="jw-subtitle-stage" data-subtitle-index={which}
   style={{visibility:visibleDuringSwipe(which)?'visible':'hidden'}}>
   <div className="jw-subtitle-motion">
    {which===0?layer('Subtitle.svg','jw-art-subtitle'):
     <svg className="jw-art jw-subtitle-svg" viewBox="0 0 1440 810" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <text x="87" y="204" fill="#181818" fontFamily="Arial, Helvetica, sans-serif" fontSize="24" fontWeight="700">{subtitles[which]}</text>
     </svg>}
   </div>
  </div>;
 const liveBody=which=><div key={'body-'+which}
   className="jw-body-stage" data-body-index={which}
   style={{visibility:visibleDuringSwipe(which)?'visible':'hidden'}}>
   <div className="jw-body-motion">
    {which===0&&layer('Portfolio sub-body.svg','jw-art-subbody')}
    <svg className="jw-art jw-body-svg" viewBox="0 0 1440 810" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
     <text x="65" y={which===0?565:486} fill="#161616" fontFamily="Arial, Helvetica, sans-serif" fontSize="24">
      {bodyLines[which].map((line,i)=><tspan key={i} x="65" dy={i===0?0:34}>{line}</tspan>)}
     </text>
    </svg>
   </div>
  </div>;
 const liveTitle=which=><React.Fragment key={which}>
  <div className={'jw-live-title jw-live-title-base'+(which===index||which===pending?' jw-live-title-visible':'')} data-title-index={which}
       style={{visibility:which===index||which===pending?'visible':'hidden'}} aria-hidden="true">
   <div className="jw-title-whole">{layer(states[which][0],'jw-art-title')}</div>
  </div>
  <div className={'jw-live-title jw-live-title-overlay'+(which===index||which===pending?' jw-live-title-visible':'')} data-title-index={which}
       style={{visibility:which===index||which===pending?'visible':'hidden'}} aria-hidden="true">
   <div className="jw-title-whole">{layer(states[which][1],'jw-art-outline')}</div>
  </div>
 </React.Fragment>;
 return <div ref={homepageRef} className="jw-homepage" aria-label="John Wolf portfolio homepage">
  <div className="jw-artboard">
   {states.map((_,which)=>liveTitle(which))}
   {layer('Man.svg','jw-art-man')}
   
   {layer('Subtitle dot.svg','jw-art-subtitle-dot')}
   {states.map((_,which)=>liveSubtitle(which))}
   {states.map((_,which)=>liveBody(which))}
   {layer('More about me.svg','jw-art-more')}
   {layer('underline for more about me.svg','jw-art-underline')}
   {layer('More about me (arrow).svg','jw-art-more-arrow')}
   {layer('Swipe up icon.svg','jw-art-swipe')}
   <nav className="jw-hit-indicators" aria-label="Select homepage title">
    <svg viewBox="0 0 1440 810" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Homepage title indicators">
     {indicatorXs.map((x,i)=><g key={labels[i]} className="jw-indicator" role="button" tabIndex={0}
       aria-label={'Show '+labels[i]} aria-current={activeIndicator===i?'true':undefined}
       onClick={()=>changeTitle(i)}
       onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();changeTitle(i)}}}>
       <circle className="jw-indicator-hit" cx={x} cy={indicatorY} r={16.9} fill="transparent"/>
       <circle className="jw-indicator-dot" cx={x} cy={indicatorY} r={8.977} fill={activeIndicator===i?'#8a4cf3':'#c9acfa'}/>
      </g>)}
    </svg>
   </nav>
   <a className="jw-hit-more" href="#about" aria-label="More about me" onClick={openAbout}/>
   <a className="jw-hit-swipe" href="#work" aria-label="Swipe up to work"/>
  </div>
  {aboutOpen&&createPortal(
   <div ref={aboutStageRef} className="jw-about-transition" role="dialog" aria-modal="true" aria-labelledby="jw-about-heading">
    <div ref={aboutSplashRef} className="jw-about-splash" aria-hidden="true">
     <div className="jw-about-splash-glow"/>
     <div className="jw-about-splash-orbit"/>
    </div>
    <div ref={aboutFlightRef} className="jw-about-flight" aria-hidden="true"/>
    <nav className="jw-about-chapter-nav" aria-label="About page sections">
     <a href="#jw-about-top" aria-label="About introduction"><span>01</span></a>
     <a href="#jw-about-process" aria-label="How I work"><span>02</span></a>
     <a href="#jw-about-capabilities-heading" aria-label="What I do"><span>03</span></a>
     <a href="#jw-about-proof-heading" aria-label="Experience"><span>04</span></a>
     <a href="#jw-about-closeout-heading" aria-label="Next"><span>05</span></a>
    </nav>
    <main ref={aboutContentRef} className="jw-about-content" tabIndex={-1}>
     <section id="jw-about-top" className="jw-about-hero" aria-labelledby="jw-about-heading">
      <div className="jw-about-hero-watermark" aria-hidden="true">ABOUT</div>
      <div className="jw-about-hero-grid">
       <div className="jw-about-hero-copy">
        <span className="jw-about-kicker">JOHN WOLF / MULTIDISCIPLINARY DESIGNER</span>
        <h2 id="jw-about-heading">Good design gives an idea<br/><em>a point of view.</em></h2>
        <p className="jw-about-lede">I’m John Wolf. I build brand identities, visual systems, and digital experiences that make ideas easier to understand—and harder to forget.</p>
        <a className="jw-about-explore" href="#jw-about-process">Explore how I work <span aria-hidden="true">↓</span></a>
       </div>
       <aside className="jw-about-hero-aside" aria-label="Creative profile">
        <div className="jw-about-orbit-badge" aria-hidden="true"><span>JW</span><i/></div>
        <dl>
         <div><dt>20+</dt><dd>Years designing</dd></div>
         <div><dt>04</dt><dd>Core disciplines</dd></div>
         <div><dt>01</dt><dd>Point of view</dd></div>
        </dl>
       </aside>
      </div>
      <div className="jw-about-marquee" aria-hidden="true"><div>BRAND IDENTITY&nbsp;&nbsp;•&nbsp;&nbsp;DIGITAL EXPERIENCES&nbsp;&nbsp;•&nbsp;&nbsp;ART DIRECTION&nbsp;&nbsp;•&nbsp;&nbsp;INTERACTION&nbsp;&nbsp;•&nbsp;&nbsp;</div></div>
     </section>

     <section id="jw-about-process" className="jw-about-process" aria-labelledby="jw-about-process-heading">
      <div className="jw-about-section-intro">
       <span className="jw-about-kicker">HOW I WORK</span>
       <h3 id="jw-about-process-heading">One idea.<br/>Three moves.</h3>
      </div>
      <div className="jw-about-principles">
       <div className="jw-about-principle-list" role="tablist" aria-label="How I work">
        {aboutPrinciples.map((item,i)=><button key={item.name} type="button" role="tab"
         aria-selected={aboutPrinciple===i}
         aria-controls="jw-about-principle-panel"
         className={'jw-about-principle'+(aboutPrinciple===i?' is-active':'')}
         onPointerEnter={()=>setAboutPrinciple(i)}
         onFocus={()=>setAboutPrinciple(i)}
         onClick={()=>setAboutPrinciple(i)}>
         <span>{String(i+1).padStart(2,'0')}</span>{item.name}
        </button>)}
       </div>
       <div id="jw-about-principle-panel" className="jw-about-principle-panel" role="tabpanel" aria-live="polite">
        <span className="jw-about-principle-index">{String(aboutPrinciple+1).padStart(2,'0')} / 03</span>
        <p key={aboutPrinciples[aboutPrinciple].name}>{aboutPrinciples[aboutPrinciple].detail}</p>
       </div>
      </div>
     </section>

     <section className="jw-about-capabilities" aria-labelledby="jw-about-capabilities-heading">
      <span className="jw-about-kicker">WHAT I DO</span>
      <h3 id="jw-about-capabilities-heading">I connect the pieces<br/>until they feel inevitable.</h3>
      <div className="jw-about-capability-list">
       {aboutCapabilities.map((item,i)=><span key={item}><small>{String(i+1).padStart(2,'0')}</small>{item}</span>)}
      </div>
     </section>

     <section className="jw-about-proof" aria-labelledby="jw-about-proof-heading">
      <div className="jw-about-section-intro">
       <span className="jw-about-kicker">EXPERIENCE</span>
       <h3 id="jw-about-proof-heading">Experience without the résumé wall.</h3>
      </div>
      <div className="jw-about-proof-grid">
       {aboutProof.map(([title,copy])=><article key={title}><h4>{title}</h4><p>{copy}</p></article>)}
      </div>
     </section>

     <section className="jw-about-closeout" aria-labelledby="jw-about-closeout-heading">
      <span className="jw-about-kicker">NEXT</span>
      <h3 id="jw-about-closeout-heading">Make it<br/><em>memorable.</em></h3>
      <p>I don’t design decoration. I find what the idea needs to communicate, then build the visual language that makes it unmistakable.</p>
      <div className="jw-about-actions">
       <a href="#work" onClick={()=>{aboutReturnFocusRef.current=false;setAboutOpen(false)}}>View my work <span aria-hidden="true">→</span></a>
       <a href="#contact" onClick={()=>{aboutReturnFocusRef.current=false;setAboutOpen(false)}}>Start a project <span aria-hidden="true">→</span></a>
      </div>
     </section>
    </main>
    <button ref={aboutCloseRef} type="button" className="jw-about-close" onClick={closeAbout} aria-label="Return to portfolio">
     <span aria-hidden="true">←</span> Portfolio
    </button>
   </div>,document.body)}
 </div>;
}
