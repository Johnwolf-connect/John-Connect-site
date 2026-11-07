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
export default function HomepageHero(){
 const [index,setIndex]=useState(0);
 const homepageRef=useRef(null);
 const [pending,setPending]=useState(null);
 const [aboutOpen,setAboutOpen]=useState(false);
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
 const closeAbout=()=>{
  if(aboutClosingRef.current)return;
  aboutClosingRef.current=true;
  // Restore the live lettering while purple still covers the screen.
  homepageRef.current?.querySelectorAll('.jw-live-title-visible').forEach(node=>node.style.removeProperty('opacity'));
  const stage=aboutStageRef.current;
  if(!stage){setAboutOpen(false);return;}
  gsap.to(stage,{autoAlpha:0,duration:.3,ease:'power2.inOut',
   onComplete:()=>{setAboutOpen(false);}});
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
  document.body.style.overflow='hidden';
  let cancelled=false,flightTimeline=null;
  const activeTitle=indexRef.current;
  const hero=homepageRef.current;
  const originalTitle=hero?.querySelector('.jw-live-title-base[data-title-index="'+activeTitle+'"] img');
  const originalLayers=[...hero.querySelectorAll('.jw-live-title-visible')];
  const restoreOriginal=()=>originalLayers.forEach(node=>node.style.removeProperty('opacity'));
  gsap.set(splash,{clipPath:'circle(0% at 50% 48%)'});
  gsap.set(content,{autoAlpha:0,y:34});
  gsap.set(close,{autoAlpha:0,y:-10});
  if(reduced){
   gsap.set(splash,{clipPath:'circle(155% at 50% 48%)'});
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
    glyphs=vector.glyphs;
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
   if(glyphs.length)gsap.set(glyphs,{transformOrigin:'50% 50%',transformBox:'fill-box',force3D:true});
   flightTimeline=gsap.timeline({onComplete:()=>{
    if(!cancelled)close.focus({preventScroll:true});
   }});
   if(glyphs.length){
    const middle=(glyphs.length-1)/2;
    flightTimeline.to(glyphs,{
     scale:i=>13+(i%3)*3,
     x:i=>(i-middle)*window.innerWidth*.14,
     y:i=>((i%3)-1)*window.innerHeight*.18,
     rotation:i=>(i-middle)*3.2,
     opacity:0,filter:'blur(7px)',duration:1.12,ease:'power4.in',
     stagger:{each:.045,from:'center'}
    },0);
   }else if(fallback){
    flightTimeline.to(fallback,{scale:13,opacity:0,filter:'blur(8px)',duration:1.12,ease:'power4.in'},0);
   }
   flightTimeline.to(splash,{clipPath:'circle(155% at 50% 48%)',duration:.87,ease:'power3.out'},.63)
    .to(content,{autoAlpha:1,y:0,duration:.66,ease:'power3.out'},1.38)
    .to(close,{autoAlpha:1,y:0,duration:.43,ease:'power2.out'},1.48);
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
    <section ref={aboutContentRef} className="jw-about-content" tabIndex={-1}>
     <span className="jw-about-kicker">JOHN WOLF / MORE ABOUT ME</span>
     <h2 id="jw-about-heading">Design is how<br/>I make ideas <em>felt.</em></h2>
     <p>I'm John Wolf. My work connects logo design, brand identity, and digital experiences through clarity and purpose.</p>
     <a className="jw-about-contact" href="#contact" onClick={()=>{aboutReturnFocusRef.current=false;setAboutOpen(false)}}>Let's work together <span aria-hidden="true">↗</span></a>
    </section>
    <button ref={aboutCloseRef} type="button" className="jw-about-close" onClick={closeAbout} aria-label="Back to homepage">
     Back to homepage <span aria-hidden="true">×</span>
    </button>
   </div>,document.body)}
 </div>;
}
