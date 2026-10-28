import React,{useEffect,useRef} from 'react';
import {labels} from './navigation.js';

// Transparent, keyboard-accessible hit areas line up with the 3D GLBs.
// The models themselves live in the existing WebGL scene, not inside cards.
export default function Navigation({active,selected,onHover,onLeave,onSelect,onClose,reduced}){
 const buttons=useRef([]),close=useRef(),previous=useRef(null);
 useEffect(()=>{
  if(selected!==null)close.current?.focus();
  else if(previous.current!==null)buttons.current[previous.current]?.focus();
  previous.current=selected;
 },[selected]);
 useEffect(()=>{
  if(selected===null)return;
  const key=e=>{
   if(e.key==='Escape'){e.preventDefault();onClose();}
   if(e.key==='Tab'){e.preventDefault();close.current?.focus();}
  };
  window.addEventListener('keydown',key);
  return ()=>window.removeEventListener('keydown',key);
 },[selected,onClose]);
 return <section className={`navigation orbit-navigation ${selected!==null?'is-open':''}`}
  aria-label="Explore" data-navigation>
  {selected===null ? <>
   <p className="choose-caption">CHOOSE YOUR NEXT CHAPTER</p>
   <div className="orbit-grid">{labels.map((label,i)=>
    <button key={label} ref={el=>buttons.current[i]=el}
     className={`orbit-choice ${active===i?'is-active':''}`}
     onPointerEnter={()=>onHover(i)} onPointerLeave={onLeave}
     onFocus={()=>onHover(i)} onBlur={onLeave}
     onClick={()=>onSelect(i)} aria-haspopup="dialog"
     aria-label={`Explore ${label}`}>
     <span className="orbit-hit" aria-hidden="true"/>
     <span className="orbit-label">{label}</span>
    </button>
   )}</div>
  </> : <div className="content-glass" role="dialog" aria-modal="true" aria-labelledby="panel-title">
   <button ref={close} className="close-panel" onClick={onClose} aria-label="Close and return to navigation">×</button>
   <div className="panel-copy"><span className="panel-eyebrow">0{selected+1} / EXPLORE</span><h2 id="panel-title">{labels[selected]}</h2>
    {selected===0 && <><h3>Behind the experience</h3><p>A space for the story behind the work: creativity, exploration, and immersive digital experiences.</p><p className="content-note">Full biography to follow.</p></>}
    {selected===1 && <><p>Selected work</p><div className="project-preview"><span>01</span><div><h3>The Ascent</h3><p>A cinematic journey through space, guided by your scroll.</p></div></div><p className="content-note">More projects will be added here.</p></>}
    {selected===2 && <><h3>Start a conversation</h3><p>Contact details will appear here once configured.</p></>}
   </div>
  </div>}
 </section>;
}
