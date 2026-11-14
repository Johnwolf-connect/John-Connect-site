import React, {useEffect, useRef} from 'react';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import './FloatingAbout.css';

export default function FloatingAbout(){
 const frame=useRef(null),shell=useRef(null);
 useEffect(()=>{
  let raf=0,refresh=0;
  const sync=()=>{
   if(raf)return;
   raf=requestAnimationFrame(()=>{
    raf=0;
    const section=shell.current,el=frame.current;
    if(!section||!el)return;
    const rect=section.getBoundingClientRect();
    el.contentWindow?.postMessage({
     type:'jw-about-scroll',
     offset:Math.max(0,Math.min(section.offsetHeight-window.innerHeight,-rect.top)),
     active:rect.top<window.innerHeight&&rect.bottom>0
    },window.location.origin);
   });
  };
  const onMessage=e=>{
   if(e.source!==frame.current?.contentWindow||e.origin!==window.location.origin)return;
   const data=e.data;
   if(data?.type==='jw-about-ready')sync();
   if(data?.type==='jw-about-size'&&Number.isFinite(data.height)){
    const height=Math.max(window.innerHeight,Math.ceil(data.height));
    if(Math.abs(shell.current.offsetHeight-height)>1){
     shell.current.style.height=height+'px';
     cancelAnimationFrame(refresh);
     refresh=requestAnimationFrame(()=>{ScrollTrigger.refresh();sync()});
    }
   }
   if(data?.type==='jw-about-wheel'&&Number.isFinite(data.deltaY)){
    // Explicit instant behavior avoids repeatedly restarting CSS smooth scroll.
    window.scrollBy({top:data.deltaY,behavior:'instant'});
   }
   if(data?.type==='jw-about-key'){
    const top=shell.current.getBoundingClientRect().top+window.scrollY;
    if(data.key==='Home')window.scrollTo({top,behavior:'instant'});
    if(data.key==='End')window.scrollTo({top:top+shell.current.offsetHeight-window.innerHeight,behavior:'instant'});
   }
  };
  window.addEventListener('scroll',sync,{passive:true});
  window.addEventListener('resize',sync);
  window.addEventListener('message',onMessage);
  const observer=new ResizeObserver(sync);observer.observe(shell.current);
  sync();
  return()=>{cancelAnimationFrame(raf);cancelAnimationFrame(refresh);observer.disconnect();window.removeEventListener('scroll',sync);window.removeEventListener('resize',sync);window.removeEventListener('message',onMessage)};
 },[]);
 return <section ref={shell} id="about" className="floating-about-shell" aria-label="About John Wolf — interactive 3D experience">
  <div className="floating-about-sticky">
   <iframe ref={frame} title="About John Wolf — interactive floating 3D head" src="/about-experience/" loading="lazy" className="floating-about-frame"/>
  </div>
 </section>;
}
