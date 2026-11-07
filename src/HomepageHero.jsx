import React,{useEffect,useRef,useState} from 'react';
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
 return <div ref={homepageRef} className="jw-homepage" aria-label="John Wolf portfolio homepage">
  <div className="jw-artboard">
   {layer(states[index][0],'jw-art-title')}
   {layer('Man.svg','jw-art-man')}
   {layer(states[index][1],'jw-art-outline')}
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
    {states.map((_,i)=><button key={i} type="button" className={index===i?'selected':''} onClick={()=>setIndex(i)} aria-label={labels[i]} aria-current={index===i?'true':undefined}/>)}
   </nav>
   <a className="jw-hit-more" href="#about" aria-label="More about me"/>
   <a className="jw-hit-swipe" href="#work" aria-label="Swipe up to work"/>
  </div>
 </div>;
}
