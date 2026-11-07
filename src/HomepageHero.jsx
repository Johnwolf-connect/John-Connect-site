import React,{useEffect,useRef,useState} from 'react';
import {gsap} from 'gsap';
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
// Exact circle centers from the original Canva Indicators.svg (1440 x 810 viewBox).
const indicatorXs=[483.425781,517.5,551.574219,585.644531,619.71875,653.789062,687.863281];
const indicatorY=195.027344;
const layer=(name,cls)=> <img className={'jw-art '+cls} src={root+encodeURIComponent(name)} alt="" aria-hidden="true" draggable="false"/>;
export default function HomepageHero(){
 const [index,setIndex]=useState(0);
 const homepageRef=useRef(null);
 const [pending,setPending]=useState(null);
 const titleRunRef=useRef(null);
 const pendingRef=useRef(null),indexRef=useRef(0),touchRef=useRef(null);
 indexRef.current=index;
 const changeTitle=(next)=>{
  if(pendingRef.current!==null||next===indexRef.current||next<0||next>=states.length)return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){setIndex(next);return}
  pendingRef.current=next;setPending(next);
 };
 useEffect(()=>{
  if(pending===null)return;
  const host=homepageRef.current;
  // Each original Canva title is a single vector drawing, never vertical slices.
  // Purple and outline are paired and transformed by the same progress value.
  const distance=Math.max(host.clientWidth,800);
  // Mirror the same motion for previous titles so backward gestures feel natural.
  const direction=pending>indexRef.current?1:-1;
  const getPair=phase=>({
   purple:host.querySelector('.jw-live-title-base[data-phase="'+phase+'"] .jw-title-whole'),
   white:host.querySelector('.jw-live-title-overlay[data-phase="'+phase+'"] .jw-title-whole')
  });
  const outgoing=getPair('out'),incoming=getPair('in');
  if(!outgoing.purple||!outgoing.white||!incoming.purple||!incoming.white)return;
  const move=(pair,x,stretch=1)=>{
   gsap.set([pair.purple,pair.white],{x,scaleX:stretch,transformOrigin:'50% 50%',force3D:true});
  };
  move(outgoing,0);move(incoming,distance*direction);
  const timeline=gsap.timeline({onComplete:()=>{
   indexRef.current=pending;setIndex(pending);pendingRef.current=null;setPending(null);
  }});
  titleRunRef.current=timeline;
  const leaving={x:0,stretch:1},arriving={x:distance*direction,stretch:1};
  timeline.to(leaving,{x:-distance*direction,duration:.82,ease:'power3.inOut',onUpdate:()=>move(outgoing,leaving.x,leaving.stretch)},0)
   .to(leaving,{stretch:1.018,duration:.25,ease:'power2.out',onUpdate:()=>move(outgoing,leaving.x,leaving.stretch)},0)
   .to(leaving,{stretch:1,duration:.32,ease:'power2.inOut',onUpdate:()=>move(outgoing,leaving.x,leaving.stretch)},.25)
   .to(arriving,{x:0,duration:.88,ease:'power3.out',onUpdate:()=>move(incoming,arriving.x,arriving.stretch)},.34)
   .to(arriving,{stretch:1.022,duration:.3,ease:'power2.out',onUpdate:()=>move(incoming,arriving.x,arriving.stretch)},.34)
   .to(arriving,{stretch:1,duration:.44,ease:'power2.inOut',onUpdate:()=>move(incoming,arriving.x,arriving.stretch)},.66);
  return()=>{timeline.kill();titleRunRef.current=null};
 },[pending]);
 useEffect(()=>{
  const host=homepageRef.current;if(!host)return;
  const onWheel=e=>{
   // Vertical wheel movement always belongs to page navigation.
   if(Math.abs(e.deltaX)<24||Math.abs(e.deltaX)<=Math.abs(e.deltaY)*1.25)return;
   e.preventDefault();
   if(pendingRef.current!==null)return;
   changeTitle(indexRef.current+(e.deltaX>0?1:-1));
  };
  const onTouchStart=e=>{touchRef.current={x:e.touches[0].clientX,y:e.touches[0].clientY}};
  const onTouchEnd=e=>{
   const start=touchRef.current;touchRef.current=null;if(!start)return;
   const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;
   if(Math.abs(dx)<45||Math.abs(dx)<Math.abs(dy)*1.25)return;
   changeTitle(indexRef.current+(dx<0?1:-1));
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
 const activeIndicator=pending===null?index:pending;
 const liveTitle=(phase,which)=><React.Fragment>
  <div className="jw-live-title jw-live-title-base" data-phase={phase} aria-hidden="true">
   <div className="jw-title-whole">{layer(states[which][0],'jw-art-title')}</div>
  </div>
  <div className="jw-live-title jw-live-title-overlay" data-phase={phase} aria-hidden="true">
   <div className="jw-title-whole">{layer(states[which][1],'jw-art-outline')}</div>
  </div>
 </React.Fragment>;
 return <div ref={homepageRef} className="jw-homepage" aria-label="John Wolf portfolio homepage">
  <div className="jw-artboard">
   {pending===null&&liveTitle('still',index)}
   {pending!==null&&liveTitle('out',index)}
   {pending!==null&&liveTitle('in',pending)}
   {layer('Man.svg','jw-art-man')}
   
   {layer('Subtitle dot.svg','jw-art-subtitle-dot')}
   {layer(index===0?'Subtitle.svg':'subtitle for all other Large Titles.svg','jw-art-subtitle')}
   {index===0&&layer('Portfolio sub-body.svg','jw-art-subbody')}
   {index===0&&layer('Portfolio body.svg','jw-art-body')}
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
   <a className="jw-hit-more" href="#about" aria-label="More about me"/>
   <a className="jw-hit-swipe" href="#work" aria-label="Swipe up to work"/>
  </div>
 </div>;
}
