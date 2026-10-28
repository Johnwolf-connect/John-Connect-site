import React, {useEffect, useRef} from 'react';
import {labels, cardTilt} from './navigation.js';

export default function Navigation({active, selected, onHover, onSelect, onClose, reduced}) {
 const buttons=useRef([]), close=useRef(), previous=useRef(null);
 useEffect(()=>{
  if(selected!==null) close.current?.focus();
  else if(previous.current!==null) buttons.current[previous.current]?.focus();
  previous.current=selected;
 },[selected]);
 useEffect(()=>{
  if(selected===null)return;
  const key=e=>{
   if(e.key==='Escape'){e.preventDefault();onClose();}
   // This panel currently has only one focusable control.
   if(e.key==='Tab'){e.preventDefault();close.current?.focus();}
  };
  window.addEventListener('keydown',key);
  return ()=>window.removeEventListener('keydown',key);
 },[selected,onClose]);
 const tilt=e=>{
  if(reduced || e.pointerType==='touch')return;
  const r=e.currentTarget.getBoundingClientRect();
  const a=cardTilt(e.clientX-r.left,e.clientY-r.top,r.width,r.height);
  e.currentTarget.style.setProperty('--rx',`${a.x}deg`);
  e.currentTarget.style.setProperty('--ry',`${a.y}deg`);
 };
 const reset=e=>{e.currentTarget.style.setProperty('--rx','0deg');e.currentTarget.style.setProperty('--ry','0deg');};
 return <section className={`navigation ${selected!==null?'is-open':''}`} aria-label="Explore" data-navigation>
  {selected===null ? <>
   <p className="choose-caption">CHOOSE YOUR NEXT CHAPTER</p>
   <div className="glass-grid">{labels.map((label,i)=><button key={label} ref={el=>buttons.current[i]=el}
    className={`glass-card ${active===i?'is-active':''}`} onPointerEnter={()=>onHover(i)} onPointerMove={tilt}
    onPointerLeave={reset} onFocus={()=>onHover(i)} onBlur={reset} onClick={()=>onSelect(i)} aria-haspopup="dialog">
    <span className="card-number">0{i+1}</span><span className="card-title">{label}</span><span className="card-mark" aria-hidden="true">—</span>
   </button>)}</div>
  </> : <div className="content-glass" role="dialog" aria-modal="true" aria-labelledby="panel-title">
   <button ref={close} className="close-panel" onClick={onClose} aria-label="Close and return to navigation">×</button>
   <div className="panel-copy"><span className="panel-eyebrow">0{selected+1} / EXPLORE</span><h2 id="panel-title">{labels[selected]}</h2>
   {selected===0 && <><p>Selected work</p><div className="project-preview"><span>01</span><div><h3>The Ascent</h3><p>A cinematic journey through space, guided by your scroll.</p></div></div><p className="content-note">More projects will be added here.</p></>}
   {selected===1 && <><h3>Behind the experience</h3><p>A space for the story behind the work: creativity, exploration, and immersive digital experiences.</p><p className="content-note">Full biography to follow.</p></>}
   {selected===2 && <><h3>Start a conversation</h3><p>Contact details will appear here once configured.</p></>}
   </div>
  </div>}
 </section>;
}
