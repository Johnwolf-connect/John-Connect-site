import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import './brand-gallery.css';
import {createPortal} from 'react-dom';
import {gsap} from 'gsap';
import brands from './brand-guidelines.json';

export default function BrandGallery(){
 const [position,setPosition]=useState(0),[opened,setOpened]=useState(false);
 const positionRef=useRef(0),slideTween=useRef(null),track=useRef(null),suppressClick=useRef(0);
 const wrap=n=>((n%brands.length)+brands.length)%brands.length;
 const index=wrap(Math.round(position));
 const dialog=useRef(null),returnFocus=useRef(null),swipe=useRef(null);
 const reader=useRef(null),sheet=useRef(null),origin=useRef(null),readerDrag=useRef(null),loopReady=useRef(false);
 const [details,setDetails]=useState(false),[readingProgress,setReadingProgress]=useState(0);
 const current=brands[index];
 const moveTo=target=>{
  slideTween.current?.kill();
  const state={value:positionRef.current};
  slideTween.current=gsap.to(state,{value:target,duration:window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:.65,ease:'power3.out',onUpdate:()=>{positionRef.current=state.value;setPosition(state.value)}});
 };
 const step=direction=>moveTo(Math.round(positionRef.current)+direction);
 useEffect(()=>()=>slideTween.current?.kill(),[]);
 const stride=()=>track.current.clientWidth*(window.innerWidth<=720 ? .80 : .59);
 const dragStart=e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;
  slideTween.current?.kill();
  swipe.current={x:e.clientX,y:e.clientY,start:positionRef.current,moved:false};
 };
 const dragMove=e=>{
  const gesture=swipe.current;if(!gesture)return;
  const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
  if(!gesture.moved&&Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>10){swipe.current=null;return}
  if(!gesture.moved&&Math.abs(dx)>7){gesture.moved=true;track.current.setPointerCapture(e.pointerId)}
  if(!gesture.moved)return;
  positionRef.current=gesture.start-dx/stride();setPosition(positionRef.current);
 };
 const dragEnd=e=>{
  const gesture=swipe.current;swipe.current=null;
  if(track.current?.hasPointerCapture(e.pointerId))track.current.releasePointerCapture(e.pointerId);
  if(!gesture?.moved)return;
  suppressClick.current=performance.now()+400;
  const delta=positionRef.current-gesture.start;
  const target=Math.abs(delta)>.12?Math.round(gesture.start)+Math.sign(delta)*Math.max(1,Math.round(Math.abs(delta))):Math.round(gesture.start);
  moveTo(target);
 };
 useEffect(()=>{
  const element=track.current;if(!element)return;
  let timer=0,wheelStart=null;
  const wheel=e=>{
   if(opened||e.ctrlKey)return;
   const dx=e.shiftKey&&Math.abs(e.deltaX)<1?e.deltaY:e.deltaX;
   if(Math.abs(dx)<1||(!e.shiftKey&&Math.abs(dx)<Math.abs(e.deltaY)*1.15))return;
   e.preventDefault();slideTween.current?.kill();
   if(wheelStart===null)wheelStart=positionRef.current;
   positionRef.current+=dx*(e.deltaMode===1?16:1)/stride();setPosition(positionRef.current);
   clearTimeout(timer);
   timer=setTimeout(()=>{
    const delta=positionRef.current-wheelStart;
    const target=Math.abs(delta)>.08?Math.round(wheelStart)+Math.sign(delta)*Math.max(1,Math.round(Math.abs(delta))):Math.round(wheelStart);
    wheelStart=null;moveTo(target);
   },140);
  };
  const move=e=>dragMove(e),end=e=>dragEnd(e);
  element.addEventListener('wheel',wheel,{passive:false});
  window.addEventListener('pointermove',move);
  window.addEventListener('pointerup',end);
  window.addEventListener('pointercancel',end);
  return()=>{clearTimeout(timer);element.removeEventListener('wheel',wheel);window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);window.removeEventListener('pointercancel',end)};
 },[opened]);
 const open=()=>{
  returnFocus.current=document.activeElement;
  origin.current=track.current?.querySelector('.is-center')?.getBoundingClientRect();
  setDetails(false);setOpened(true);
 };
 useLayoutEffect(()=>{
  if(!opened||!sheet.current)return;
  const page=sheet.current,veil=page.querySelector('.brand-paper-veil');
  const content=Array.from(page.children).filter(node=>node!==veil);
  const r=origin.current;
  if(!r||window.matchMedia('(prefers-reduced-motion: reduce)').matches){
   gsap.set(veil,{autoAlpha:0});return;
  }
  const curved='polygon(1% 3%,25% 1%,50% 0%,75% 1%,97% 3%,100% 48%,98% 96%,74% 100%,48% 99%,1% 94%)';
  const bowed='polygon(3% 5%,26% 1%,51% 0%,76% 1%,94% 4%,100% 58%,96% 94%,72% 100%,43% 97%,0% 89%)';
  const flat='polygon(0% 0%,25% 0%,50% 0%,75% 0%,100% 0%,100% 50%,100% 100%,75% 100%,50% 100%,0% 100%)';
  gsap.set(content,{autoAlpha:0});
  gsap.set(veil,{autoAlpha:1});
  gsap.set(page,{x:r.left,y:r.top,scaleX:r.width/window.innerWidth,scaleY:r.height/window.innerHeight,skewY:0,rotationX:0,transformOrigin:'0 0',clipPath:curved});
  // Blank white paper leads the transition; the document is revealed last.
  const animation=gsap.timeline();
  animation.to(page,{duration:.16,clipPath:bowed,ease:'power1.inOut'})
   .to(page,{x:r.left*.28,y:r.top*.2,scaleX:.91,scaleY:.87,skewY:-2.5,rotationX:5,clipPath:bowed,duration:.62,ease:'power2.inOut'})
   .to(page,{x:0,y:0,scaleX:1,scaleY:1,skewY:0,rotationX:0,clipPath:flat,duration:.38,ease:'power2.out'})
   .set(content,{autoAlpha:1})
   .to(veil,{autoAlpha:0,duration:.3,ease:'power1.inOut'});
  return()=>animation.kill();
 },[opened]);
 useLayoutEffect(()=>{
  if(!opened||!reader.current)return;
  loopReady.current=false;
  const element=reader.current;
  const cycle=element.querySelector('.brand-reader-cycle');
  if(!cycle)return;
  element.scrollTop=cycle.offsetHeight;
  setReadingProgress(0);loopReady.current=true;
 },[opened,current.id]);
 const loopScroll=()=>{
  const element=reader.current;if(!element||!loopReady.current)return;
  const height=element.querySelector('.brand-reader-cycle')?.offsetHeight;
  if(!height)return;
  let y=element.scrollTop;
  if(y<height*.5){y+=height;element.scrollTop=y}
  else if(y>height*1.5){y-=height;element.scrollTop=y}
  setReadingProgress(((y%height)+height)%height/height);
 };
 const readerDown=e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;
  if(e.target.closest('button,a,input,textarea'))return;
  readerDrag.current={id:e.pointerId,y:e.clientY,moved:false};
 };
 useEffect(()=>{
  if(!opened)return;
  const move=e=>{
   const drag=readerDrag.current;if(!drag||drag.id!==e.pointerId||!reader.current)return;
   const dy=e.clientY-drag.y;
   if(!drag.moved&&Math.abs(dy)<5)return;
   drag.moved=true;drag.y=e.clientY;
   reader.current.scrollTop-=dy;
   loopScroll();
  };
  const end=()=>{readerDrag.current=null};
  window.addEventListener('pointermove',move);window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);
  return()=>{end();window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);window.removeEventListener('pointercancel',end)};
 },[opened,current.id]);
 useEffect(()=>{
  if(!opened)return;
  const previous=document.body.style.overflow;
  document.body.style.overflow='hidden';
  dialog.current?.querySelector('button')?.focus();
  const key=e=>{
   if(e.key==='Escape')setOpened(false);
   if(e.key==='Tab'){
    const items=Array.from(dialog.current?.querySelectorAll('button,a[href]')||[]);
    const first=items[0],last=items[items.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
   }
  };
  window.addEventListener('keydown',key);
  return()=>{document.body.style.overflow=previous;window.removeEventListener('keydown',key);returnFocus.current?.focus()};
 },[opened]);

 return <section id="riches" className="brand-gallery" aria-label="Brand identity guidelines">
  <header className="brand-gallery-heading">
   <div><span className="kicker">02 / BRAND IDENTITY</span><h2>Identity, defined.</h2></div>
   <p>Brand guidelines by John Wolf.</p>
  </header>
  <div ref={track} className={'brand-gallery-track'+(swipe.current?.moved?' is-dragging':'')} aria-label="Browse brand guidelines" tabIndex={0}
   onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();step(1)}if(e.key==='ArrowLeft'){e.preventDefault();step(-1)}}}
   onPointerDown={dragStart}
   onClickCapture={e=>{if(performance.now()<suppressClick.current){e.preventDefault();e.stopPropagation()}}}>
   {[-2,-1,0,1,2].map(offset=>{
    const slot=Math.round(position)+offset,delta=slot-position;
    const project=brands[wrap(slot)],center=slot===Math.round(position);
    const scale=1-.14*Math.min(2,Math.abs(delta));
    return <button key={slot} className={'brand-gallery-panel'+(center?' is-center':'')}
     style={{transform:`translate(-50%,-50%) translateX(calc(var(--brand-stride) * ${delta})) rotateY(${-Math.max(-1,Math.min(1,delta))*24}deg) scale(${scale})`,zIndex:10-Math.round(Math.abs(delta)*2),opacity:Math.max(0,Math.min(1,2.5-Math.abs(delta)))}}
     aria-label={center?'Open '+project.name+' guidelines':'Show '+project.name} tabIndex={center?0:-1}
     onClick={()=>{if(center)open();else moveTo(slot)}}>
     <img src={project.pages[0]} alt={project.name+' brand guidelines cover'} draggable="false"/>
     {center&&<span className="brand-panel-open">Explore guidelines ↗</span>}
    </button>
   })}
  </div>
  <footer className="brand-gallery-controls">
   <div><button onClick={()=>step(-1)} aria-label="Previous brand">←</button><button className="brand-current-name" onClick={open}>{current.name}</button><button onClick={()=>step(1)} aria-label="Next brand">→</button></div>
   <span>{current.pages.length} pages</span>
  </footer>
  {opened&&createPortal(<div ref={dialog} className="brand-reader" role="dialog" aria-modal="true" aria-label={current.name+' brand guidelines'} onPointerDown={readerDown}>
   <div ref={sheet} className="brand-reader-sheet">
    <div className="brand-paper-veil" aria-hidden="true"/>
    <aside className="brand-reader-meta">
     <span>Brand identity</span><span>Guidelines &amp; visual system</span><span>Designer: John Wolf</span>
    </aside>
    <button className="brand-reader-details-toggle" aria-expanded={details} onClick={()=>setDetails(v=>!v)}>{details?'Close details':'View details'}</button>
    {details&&<aside className="brand-reader-details"><h3>{current.name}</h3><p>Brand identity guidelines by John Wolf.</p><p>{current.pages.length} pages covering this brand’s visual system.</p><p>Scroll or drag vertically to explore. The guideline repeats continuously.</p></aside>}
    <div ref={reader} className="brand-reader-pages" key={current.id} onScroll={loopScroll} tabIndex={0} aria-label={current.name+' continuously scrolling guideline pages'}>
     {[0,1,2].map(cycle=><div className="brand-reader-cycle" key={cycle}>
      {current.pages.map((page,i)=>{
       const size=current.sizes?.[i]||[1200,675];
       return <figure key={page}><img src={page} alt={current.name+' guideline page '+(i+1)} width={size[0]} height={size[1]} draggable="false" decoding="async"/><figcaption>{String(i+1).padStart(2,'0')} / {current.pages.length}</figcaption></figure>;
      })}
     </div>)}
    </div>
    <div className="brand-reader-progress" aria-label="Position within guideline">
     <svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" opacity=".25"/><circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="87.965" strokeDashoffset={87.965*(1-readingProgress)} transform="rotate(-90 20 20)"/></svg>
    </div>
    <nav className="brand-reader-projects" aria-label="Switch brand guideline">
     <button onClick={()=>step(-1)} aria-label="Previous project">←</button><span>{current.name}</span><button onClick={()=>step(1)} aria-label="Next project">→</button>
    </nav>
    <button className="brand-reader-exit" onClick={()=>setOpened(false)} aria-label="Exit guideline reader">×</button>
   </div>
  </div>,document.body)}

 </section>;
}
