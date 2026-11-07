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
const layer=(name,cls)=> <img className={'jw-art '+cls} src={root+encodeURIComponent(name)} alt="" aria-hidden="true" draggable="false"/>;
export default function HomepageHero(){
 const [index,setIndex]=useState(0);
 const homepageRef=useRef(null);
 const [pending,setPending]=useState(null);
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
  const strips=host?.querySelectorAll('.jw-title-chain-strip');
  if(!strips?.length)return;
  const outgoing=[...strips].filter(el=>el.dataset.phase==='out');
  const incoming=[...strips].filter(el=>el.dataset.phase==='in');
  const distance=Math.max(host.clientWidth*1.25,900);
  gsap.set(incoming,{x:distance});
  const timeline=gsap.timeline({onComplete:()=>{setIndex(pending);indexRef.current=pending;pendingRef.current=null;setPending(null)}});
  // Leftmost slices lead the exit; each following slice is pulled after it.
  timeline.to(outgoing,{x:-distance,duration:.66,stagger:.035,ease:'power3.in'},0);
  // Incoming leftmost slices lead; the rest catch up with a soft settle.
  timeline.to(incoming,{x:0,duration:.82,stagger:.038,ease:'back.out(1.12)'},.18);
  return()=>timeline.kill();
 },[pending]);
 useEffect(()=>{
  const host=homepageRef.current;if(!host)return;
  const onWheel=e=>{
   if(Math.abs(e.deltaY)<8||Math.abs(e.deltaX)>Math.abs(e.deltaY)*1.3)return;
   const direction=Math.sign(e.deltaY),next=indexRef.current+direction;
   if(pendingRef.current!==null){e.preventDefault();return}
   if(next<0||next>=states.length)return;
   e.preventDefault();changeTitle(next);
  };
  const onTouchStart=e=>{touchRef.current={x:e.touches[0].clientX,y:e.touches[0].clientY}};
  const onTouchEnd=e=>{
   const start=touchRef.current;touchRef.current=null;if(!start)return;
   const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;
   if(Math.max(Math.abs(dx),Math.abs(dy))<45)return;
   changeTitle(indexRef.current+(Math.abs(dx)>Math.abs(dy)?(dx<0?1:-1):(dy<0?1:-1)));
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
 const chain=(phase,which)=>Array.from({length:12},(_,i)=><React.Fragment key={phase+'-'+i}>
  <div className="jw-title-chain-strip jw-chain-base" data-phase={phase} style={{clipPath:`inset(0 ${(11-i)/12*100}% 0 ${i/12*100}%)`}}>{layer(states[which][0],'jw-art-title')}</div>
  <div className="jw-title-chain-strip jw-chain-outline" data-phase={phase} style={{clipPath:`inset(0 ${(11-i)/12*100}% 0 ${i/12*100}%)`}}>{layer(states[which][1],'jw-art-outline')}</div>
 </React.Fragment>);
 return <div ref={homepageRef} className="jw-homepage" aria-label="John Wolf portfolio homepage">
  <div className="jw-artboard">
   {pending===null&&layer(states[index][0],'jw-art-title')}
   {pending!==null&&chain('out',index)}
   {pending!==null&&chain('in',pending)}
   {layer('Man.svg','jw-art-man')}
   {pending===null&&layer(states[index][1],'jw-art-outline')}
   {layer('Subtitle dot.svg','jw-art-subtitle-dot')}
   {layer(index===0?'Subtitle.svg':'subtitle for all other Large Titles.svg','jw-art-subtitle')}
   {layer('Indicators.svg','jw-art-indicator-visual')}
   {index===0&&layer('Portfolio sub-body.svg','jw-art-subbody')}
   {index===0&&layer('Portfolio body.svg','jw-art-body')}
   {layer('More about me.svg','jw-art-more')}
   {layer('underline for more about me.svg','jw-art-underline')}
   {layer('More about me (arrow).svg','jw-art-more-arrow')}
   {layer('Swipe up icon.svg','jw-art-swipe')}
   <nav className="jw-hit-indicators" aria-label="Select homepage title">
    {states.map((_,i)=><button key={i} type="button" className={index===i?'selected':''} onClick={()=>changeTitle(i)} aria-label={labels[i]} aria-current={index===i?'true':undefined}/>)}
   </nav>
   <a className="jw-hit-more" href="#about" aria-label="More about me"/>
   <a className="jw-hit-swipe" href="#work" aria-label="Swipe up to work"/>
  </div>
 </div>;
}
