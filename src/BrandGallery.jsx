import React,{useEffect,useRef,useState} from 'react';
import './brand-gallery.css';
import brands from './brand-guidelines.json';

export default function BrandGallery(){
 const [index,setIndex]=useState(0),[opened,setOpened]=useState(false);
 const dialog=useRef(null),returnFocus=useRef(null),swipe=useRef(null);
 const current=brands[index];
 const step=direction=>setIndex(i=>(i+direction+brands.length)%brands.length);
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
  <div className="brand-gallery-track" aria-label="Browse brand guidelines" tabIndex={0}
   onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();step(1)}if(e.key==='ArrowLeft'){e.preventDefault();step(-1)}}}
   onPointerDown={e=>{swipe.current={x:e.clientX,y:e.clientY}}}
   onPointerUp={e=>{if(!swipe.current)return;const dx=e.clientX-swipe.current.x,dy=e.clientY-swipe.current.y;swipe.current=null;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)step(dx<0?1:-1)}}>
   {[-1,0,1].map(offset=>{
    const project=brands[(index+offset+brands.length)%brands.length];
    return <button key={offset} className={'brand-gallery-panel brand-panel-'+(offset===0?'center':offset<0?'left':'right')}
     aria-label={offset===0?'Open '+project.name+' guidelines':'Show '+project.name}
     onClick={()=>{if(offset===0)open();else step(offset)}}>
     <img key={project.id} src={project.pages[0]} alt={project.name+' brand guidelines cover'} draggable="false"/>
     {offset===0&&<span className="brand-panel-open">Explore guidelines ↗</span>}
    </button>
   })}
  </div>
  <footer className="brand-gallery-controls">
   <span className="brand-gallery-count">{String(index+1).padStart(2,'0')} / {String(brands.length).padStart(2,'0')}</span>
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
