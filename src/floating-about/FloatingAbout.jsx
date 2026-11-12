import React, {useEffect, useRef} from 'react';
import './FloatingAbout.css';

/** The iframe owns the original Three.js runtime; the parent owns document scrolling. */
export default function FloatingAbout(){
 const frame=useRef(null);
 useEffect(()=>{
  let raf=0;
  const sync=()=>{
   cancelAnimationFrame(raf);
   raf=requestAnimationFrame(()=>{
    const el=frame.current;
    if(!el)return;
    const section=el.closest('#about');
    if(!section)return;
    const top=section.getBoundingClientRect().top;
    const height=section.offsetHeight;
    const view=window.innerHeight;
    const progress=Math.max(0,Math.min(1,-top/Math.max(1,height-view)));
    el.contentWindow?.postMessage({type:'jw-about-scroll',progress},window.location.origin);
   });
  };
  window.addEventListener('scroll',sync,{passive:true});
  window.addEventListener('resize',sync);
  const onMessage=e=>{
   if(e.source===frame.current?.contentWindow&&e.origin===window.location.origin&&e.data?.type==='jw-about-ready')sync();
  };
  window.addEventListener('message',onMessage);
  sync();
  return ()=>{cancelAnimationFrame(raf);window.removeEventListener('scroll',sync);window.removeEventListener('resize',sync);window.removeEventListener('message',onMessage)};
 },[]);
 return <section id="about" className="floating-about-shell" aria-label="About John Wolf — interactive 3D experience">
  <div className="floating-about-sticky">
   <iframe ref={frame} title="About John Wolf — interactive floating 3D head" src="/about-experience/" loading="lazy" className="floating-about-frame" onLoad={()=>frame.current?.contentWindow?.postMessage({type:'jw-about-scroll',progress:0},window.location.origin)}/>
  </div>
 </section>;
}
