import React,{useEffect,useRef} from 'react';
import './visual-continuity.css';

// One light field survives section changes; scroll only changes its destination.
export default function VisualContinuity(){
 const field=useRef(null);
 useEffect(()=>{
  const node=field.current,mq=window.matchMedia('(prefers-reduced-motion: reduce)');
  const [primary,secondary]=node.children;
  let frame=0,last=0,x=50,y=55,intensity=.75;
  let targetX=50,targetY=55,targetIntensity=.6;
  const anchors=[['.hero-reference',36,62,.7],['.scroll-gallery',68,48,.64],['.brand-gallery',48,58,.52],['.about',28,50,.5]]
   .map(([selector,...values])=>[document.querySelector(selector),...values]);
  const render=time=>{
   frame=0;
   const dt=last?Math.min(.05,(time-last)/1000):0;last=time;
   const blend=mq.matches?1:1-Math.exp(-dt/.45);
   x+=(targetX-x)*blend;y+=(targetY-y)*blend;
   intensity+=(targetIntensity-intensity)*blend;
   const t=mq.matches?0:time/1000;
   primary.style.transform=`translate3d(${x-50+Math.sin(t*.34)*28}%,${y-50+Math.cos(t*.27)*24}%,0)`;
   secondary.style.transform=`translate3d(${50-x-Math.sin(t*.31+.8)*30}%,${50-y-Math.cos(t*.25)*25}%,0)`;
   node.style.opacity=String(intensity*(mq.matches?1:.82+.18*Math.sin(t*.9)));
   if(!mq.matches&&targetIntensity>0)frame=requestAnimationFrame(render);
   else last=0;
  };
  const measure=()=>{
   let total=0,tx=0,ty=0,light=0;
   for(const [section,ax,ay,alpha] of anchors){
    if(!section)continue;
    const r=section.getBoundingClientRect();
    const visible=Math.max(0,Math.min(r.bottom,innerHeight)-Math.max(r.top,0));
    const weight=visible/innerHeight;
    total+=weight;tx+=ax*weight;ty+=ay*weight;light+=alpha*weight;
   }
   targetX=total?tx/total:50;
   targetY=total?ty/total:55;
   targetIntensity=total?light/total:0;
   if(!targetIntensity)intensity=0;
   if(!frame)frame=requestAnimationFrame(render);
  };
  let measureFrame=0;
  const schedule=()=>{
   if(!measureFrame)measureFrame=requestAnimationFrame(()=>{measureFrame=0;measure()});
  };
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule);
  mq.addEventListener('change',schedule);
  schedule();
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
   if(!entry.isIntersecting||mq.matches)return;
   entry.target.animate([
    {opacity:0,transform:'translate(0,28px) skewY(-2deg) scale(1.025,.96)'},
    {opacity:1,transform:'translate(0,-2px) skewY(.3deg) scale(.995,1.015)',offset:.75},
    {opacity:1,transform:'none'}
   ],{duration:850,easing:'cubic-bezier(.22,.7,.2,1)'});
   observer.unobserve(entry.target);
  }),{threshold:.25});
  document.querySelectorAll('.logo-creations-title,.brand-gallery-heading,.about h2').forEach(el=>observer.observe(el));
  return()=>{
   cancelAnimationFrame(frame);cancelAnimationFrame(measureFrame);observer.disconnect();
   window.removeEventListener('scroll',schedule);
   window.removeEventListener('resize',schedule);
   mq.removeEventListener('change',schedule);
  };
 },[]);
 return <div ref={field} className="site-light-field" aria-hidden="true"><span/><span/></div>;
}
