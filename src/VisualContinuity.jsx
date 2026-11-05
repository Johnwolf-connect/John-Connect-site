import React,{useEffect,useRef} from 'react';
import './visual-continuity.css';

// One light field survives section changes; scroll only changes its destination.
export default function VisualContinuity(){
 const field=useRef(null);
 useEffect(()=>{
  const node=field.current,mq=window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,last=0,x=50,y=55,intensity=.75;
  const anchors=[['.hero-reference',36,62,.7],['.scroll-gallery',68,48,.64],['.brand-gallery',48,58,.52],['.about',28,50,.5]];
  const render=time=>{
   const dt=last?Math.min(.05,(time-last)/1000):0;last=time;
   let total=0,tx=0,ty=0,light=0;
   anchors.forEach(([selector,ax,ay,alpha])=>{
    const section=document.querySelector(selector);if(!section)return;
    const r=section.getBoundingClientRect();
    const visible=Math.max(0,Math.min(r.bottom,innerHeight)-Math.max(r.top,0));
    const weight=visible/innerHeight;
    total+=weight;tx+=ax*weight;ty+=ay*weight;light+=alpha*weight;
   });
   const blend=mq.matches?1:1-Math.exp(-dt/.45);
   x+=((total?tx/total:50)-x)*blend;y+=((total?ty/total:55)-y)*blend;
   intensity+=((total?light/total:.6)-intensity)*blend;
   const t=mq.matches?0:time/1000;
   node.style.setProperty('--light-x',`${x+Math.sin(t*.34)*28}%`);
   node.style.setProperty('--light-y',`${y+Math.cos(t*.27)*24}%`);
   node.style.setProperty('--light-second-x',`${100-x-Math.sin(t*.31+.8)*30}%`);
   node.style.setProperty('--light-second-y',`${100-y-Math.cos(t*.25)*25}%`);
   node.style.opacity=String(intensity*(mq.matches?1:.82+.18*Math.sin(t*.9)));
   frame=requestAnimationFrame(render);
  };
  frame=requestAnimationFrame(render);
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
  return()=>{cancelAnimationFrame(frame);observer.disconnect()};
 },[]);
 return <div ref={field} className="site-light-field" aria-hidden="true"/>;
}
