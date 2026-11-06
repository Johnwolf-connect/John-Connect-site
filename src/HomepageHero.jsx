import React,{useEffect,useRef,useState} from 'react';
import './HomepageHero.css';
const topics=[
 ['PORTFOLIO','WELCOME TO THE','Creative work built around meaningful visual connections.','Explore branding, design, and digital experiences shaped with intention.'],
 ['BRANDING','CREATIVE','A brand should be recognizable before its name is read.','I build cohesive visual systems that connect people to ideas.'],
 ['DESIGNER','VISUAL','Every detail contributes to the story.','I turn complex ideas into memorable visual experiences.'],
 ['CREATION','CONTENT','Strong content begins with a clear creative direction.','From concept to execution, every frame has a purpose.'],
 ['GUIDELINES','CONTENT','Good systems keep a visual language unmistakable.','Clear guidelines help brands stay recognizable everywhere.'],
 ['LEARNING','AI MACHINE','New tools expand the possibilities of visual thinking.','I explore ways to combine human direction with emerging technology.'],
 ['SOLVING','PROBLEM','Design is not only how things look.','It is how thoughtful solutions make experiences work better.']
];
export default function HomepageHero(){
 const [index,setIndex]=useState(0),[phase,setPhase]=useState('rest'),[direction,setDirection]=useState(1);
 const [reduce,setReduce]=useState(true);
 const timer=useRef(null),lastInput=useRef(0),locked=useRef(false),touch=useRef(null);
 const active=useRef(0);
 // Layout review mode: keep the hero static until composition is approved.
 const advance=(next,manual=false)=>{
  if(locked.current)return;
  if(manual)lastInput.current=Date.now();
  const target=(next+topics.length)%topics.length;
  if(target===active.current)return;
  locked.current=true;setDirection(target===((active.current+topics.length-1)%topics.length)?-1:1);
  if(reduce){active.current=target;setIndex(target);locked.current=false;return;}
  setPhase('out');
  timer.current=setTimeout(()=>{setPhase('title-out');timer.current=setTimeout(()=>{
   active.current=target;setIndex(target);setPhase('in');
   timer.current=setTimeout(()=>{setPhase('rest');locked.current=false},650);
  },330)},450);
 };
 // Autoplay intentionally disabled for layout review.
 const swipeStart=e=>{touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY}};
 const swipeEnd=e=>{if(!touch.current)return;const dx=e.changedTouches[0].clientX-touch.current.x,dy=e.changedTouches[0].clientY-touch.current.y;touch.current=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy))advance(active.current+(dx<0?1:-1),true)};
 const wheel=e=>{};
 const t=topics[index];
 return <div className={'jw-homepage jw-phase-'+phase+' jw-direction-'+(direction>0?'forward':'backward')}  tabIndex={0} aria-label="John Wolf creative disciplines carousel">
  <div className="jw-hero-dot" aria-hidden="true"/>
  <div className="jw-hero-photo"><img src="/john-wolf-portrait.webp" alt="Portrait of John Wolf"/></div>
  <div className="jw-hero-content">
   <div className="jw-eyebrow"><i className="jw-subtitle-dot" aria-hidden="true"/><span key={'s'+index}>{t[1]}</span></div>
   <div className="jw-title-layer"><h1 key={'t'+index} className="jw-title">{t[0]}</h1><h1 aria-hidden="true" key={'o'+index} className="jw-title jw-outline">{t[0]}</h1></div>
   <div className="jw-body" key={'b'+index}><p>{t[2]}</p><p>{t[3]}</p></div>
  </div>
  <a className="jw-more" href="#about">MORE ABOUT ME <span aria-hidden="true">↗</span></a>
  <a className="jw-swipe" href="#work">SWIPE UP <span aria-hidden="true">↑</span></a>
  <div className="jw-indicators" role="group" aria-label="Choose a creative discipline">{topics.map((topic,i)=><button type="button" key={topic[0]} className={i===index?'active':''} onClick={()=>advance(i,true)} aria-label={'Show '+topic[0].toLowerCase()} aria-current={i===index?'true':undefined}/>)}</div>
 </div>;
}
