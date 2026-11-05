import React,{useEffect,useRef,useState} from 'react';
import './brand-gallery.css';
import {gsap} from 'gsap';
import brands from './brand-guidelines.json';

export default function BrandGallery(){
 const [position,setPosition]=useState(0),[opened,setOpened]=useState(false);
 const positionRef=useRef(0),slideTween=useRef(null),track=useRef(null),suppressClick=useRef(0);
 const wrap=n=>((n%brands.length)+brands.length)%brands.length;
 const index=wrap(Math.round(position));
 const dialog=useRef(null),returnFocus=useRef(null),swipe=useRef(null);
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
  if(e.button!==0)return;
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
 const open=()=>{returnFocus.current=document.activeElement;setOpened(true)};
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
 useEffect(()=>{if(opened)dialog.current?.querySelector('.brand-reader-pages')?.scrollTo({top:0})},[index,opened]);
 return <section id="riches" className="brand-gallery" aria-label="Brand identity guidelines">
  <header className="brand-gallery-heading">
   <div><span className="kicker">02 / BRAND IDENTITY</span><h2>Identity, defined.</h2></div>
   <p>Brand guidelines by John Wolf.</p>
  </header>
  <div ref={track} className={'brand-gallery-track'+(swipe.current?.moved?' is-dragging':'')} aria-label="Browse brand guidelines" tabIndex={0}
   onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();step(1)}if(e.key==='ArrowLeft'){e.preventDefault();step(-1)}}}
   onPointerDown={dragStart} onPointerMove={dragMove} onPointerUp={dragEnd} onPointerCancel={dragEnd}
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
  {opened&&<div ref={dialog} className="brand-reader" role="dialog" aria-modal="true" aria-label={current.name+' brand guidelines'}>
   <header className="brand-reader-header"><div><span className="kicker">BRAND IDENTITY / JOHN WOLF</span><h3>{current.name}</h3></div><button onClick={()=>setOpened(false)} aria-label="Close brand guidelines">Close ×</button></header>
   <div className="brand-reader-pages" key={current.id}>
    {current.pages.map((page,i)=><figure key={page}><img src={page} alt={current.name+' guideline page '+(i+1)} loading={i===0?'eager':'lazy'}/><figcaption>{String(i+1).padStart(2,'0')} / {current.pages.length}</figcaption></figure>)}
   </div>
   <footer className="brand-reader-footer"><button onClick={()=>step(-1)}>← Previous brand</button><span>{current.name}</span><button onClick={()=>step(1)}>Next brand →</button></footer>
  </div>}
 </section>;
}
