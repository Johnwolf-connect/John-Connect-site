import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {gsap} from 'gsap';
import './design-tools.css';

const tools=[
 {name:'CSS3',slug:'css3',detail:'Responsive layouts, visual styling, and expressive web animation.'},
 {name:'LottieFiles',slug:'lottiefiles',detail:'Lightweight animations for polished websites and digital experiences.'},
 {name:'Adobe Photoshop',slug:'photoshop',detail:'Image editing, compositing, retouching, and visual exploration.'},
 {name:'Adobe Illustrator',slug:'illustrator',detail:'Precision vector artwork, logos, icons, and identity systems.'},
 {name:'Figma',slug:'figma',detail:'Interface design, interactive prototypes, and shared design systems.'},
 {name:'GitHub',slug:'github',detail:'Version control, collaboration, and reliable project development.'},
 {name:'GSAP',slug:'gsap',detail:'Expressive interactions, scroll choreography, and polished motion.'},
 {name:'Canva',slug:'canva',detail:'Fast visual concepts and flexible social design systems.'},
 {name:'ChatGPT',slug:'chatgpt',detail:'Creative research, ideation, prototyping, and problem solving.'},
 {name:'Procreate',slug:'procreate',detail:'Expressive digital illustration, sketching, and original artwork.'},
 {name:'Adobe Firefly',slug:'firefly',detail:'Generative visual exploration and concept development.'}
];
const intro='Software applications used to conceptualize, plan, and create visual content. They help shape everything from visual identities to interactive websites and digital experiences.';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=v=>v*v*(3-2*v);
function ToolIcon({tool}){
 return <img src={'/tools/'+tool.slug+'.webp'} alt="" draggable="false"/>;
}
export default function DesignTools(){
 const root=useRef(null),orbit=useRef(null),buttons=useRef({}),frame=useRef(0),chosen=useRef(null),travel=useRef(null),travelName=useRef(null),busy=useRef(false),feature=useRef(null),flightTween=useRef(null);
 const [selected,setSelected]=useState(null),[reduced,setReduced]=useState(false);
 chosen.current=selected;
 useEffect(()=>{
  const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
  const sync=()=>setReduced(mq.matches);
  sync();mq.addEventListener?.('change',sync);
  return()=>mq.removeEventListener?.('change',sync);
 },[]);
 useEffect(()=>{
  const host=root.current,field=orbit.current;
  if(!host||!field)return;
  if(reduced){
   for(const button of Object.values(buttons.current))button.removeAttribute('style');
   host.inert=false;
   host.style.removeProperty('--tool-panel-opacity');
   host.querySelector('.design-tools-information').style.removeProperty('transform');
   host.querySelector('.design-tools-center').style.removeProperty('opacity');
   return;
  }
  const hero=host.closest('.hero');
  const information=host.querySelector('.design-tools-information');
  const prompt=host.querySelector('.design-tools-center');
  let previousTime=null,rotation=0,exitAngles=null;
  const positions=new Map();
  const animate=time=>{
   // Keep one clock alive through GSAP pin/unpin and browser-tab visibility.
   // IntersectionObserver can report a transformed pinned ancestor as outside
   // the viewport; cancelling its only RAF there leaves no frame to recover.
   frame.current=requestAnimationFrame(animate);
   const bounds=host.getBoundingClientRect();
   if(document.hidden||bounds.bottom<=0||bounds.top>=window.innerHeight){previousTime=null;return}
   const p=clamp(Number(hero?.style.getPropertyValue('--tools-progress')||0),0,1);
   const elapsed=previousTime===null?0:Math.min(50,Math.max(0,time-previousTime))/1000;
   previousTime=time;
   const idleBlend=smooth(clamp((p-.54)/.10,0,1));
   if(p>=.54&&p<.78&&!document.hidden)rotation+=elapsed*.10*idleBlend;
   if(p<=.54)rotation=0;
   const idleAngle=rotation*idleBlend;
   const leave=smooth(clamp((p-.78)/.20,0,1));
   const panel=smooth(clamp((p-.53)/.09,0,1))*(1-leave);
   host.style.setProperty('--tool-panel-opacity',String(panel));
   if(information)information.style.transform=`translateY(${(1-panel)*18}px)`;
   if(prompt)prompt.style.opacity=String(smooth(clamp((p-.56)/.06,0,1))*(1-leave));
   const interactive=p>=.62&&p<.78;
   host.inert=!interactive;
   const selectedNode=buttons.current[chosen.current];
   if(selectedNode){selectedNode.style.opacity='0';selectedNode.style.pointerEvents='none';selectedNode.tabIndex=-1}
   const keys=tools.filter(tool=>tool.name!==chosen.current);
   const width=field.clientWidth,height=field.clientHeight;
   const radius=Math.min(width,height)*.40;
   const interval=.014,flight=.30,firstLanding=.36;
   const speed=2*Math.PI/(tools.length*interval);
   // Integrate one shared orbit clock. Arrivals use its exact position and
   // tangent, then it gently slows to the browsing rotation.
   const clock=q=>{
    if(q<=.54)return speed*(q-firstLanding);
    const d=Math.min(q-.54,.10),u=d/.10;
    return speed*(.54-firstLanding)+speed*d+(.8-speed)*.10*(u*u/2)+Math.max(0,q-.64)*.8;
   };
   const fieldLeft=field.getBoundingClientRect().left;
   const cubic=(a,b,c,d,t)=>{const u=1-t;return u*u*u*a+3*u*u*t*b+3*u*t*t*c+t*t*t*d};
   // Capture the live rotation once, then feed icons through the top exit.
   // The leading icon is the next one to reach twelve o'clock.
   if(p<.78)exitAngles=null;
   if(p>=.78&&!exitAngles){
    exitAngles=new Map(keys.map((tool,i)=>[tool.name,positions.get(tool.name)??(Math.PI+clock(.78)-clock(firstLanding)-i*2*Math.PI/keys.length+idleAngle)]));
   }
   keys.forEach((tool,i)=>{
    const node=buttons.current[tool.name];if(!node)return;
    const landing=firstLanding+i*interval;
    const ride=clamp((p-(landing-flight))/flight,0,1);
    const entryX=width*.5-radius,entryY=height*.5;
    let a=Math.PI+clock(Math.max(p,landing))-clock(landing)+idleAngle;
    if(p>=.58){
     const target=Math.PI+clock(p)-clock(firstLanding)-i*2*Math.PI/keys.length+idleAngle;
     const previous=positions.get(tool.name)??a;
     const delta=Math.atan2(Math.sin(target-previous),Math.cos(target-previous));
     a=previous+delta*(1-Math.exp(-elapsed/ .24));
    }
    positions.set(tool.name,a);
    // The last control point aligns with the circle's tangent.
    // Keep the entrance inside the selector so icons never sweep through the copy.
    const xTrack=cubic(width*.5,entryX,entryX,entryX,ride);
    const yTrack=cubic(height*.94,height*.84,entryY+Math.min(radius*.65,radius*speed*flight/3),entryY,ride);
    const finalX=width*.5+Math.cos(a)*radius;
    const finalY=height*.5+Math.sin(a)*radius;
    const dock=ride;
    let departure=0;
    let x=ride<1?xTrack:finalX,y=ride<1?yTrack:finalY;
    if(p>=.78&&exitAngles?.has(tool.name)){
     const start=exitAngles.get(tool.name),tau=2*Math.PI;
     const distance=((-Math.PI/2-start)%tau+tau)%tau;
     const travelSpeed=tau/.12;
     const toTop=distance/travelSpeed;
     const exitProgress=p-.78;
     if(exitProgress<=toTop){
      const exitAngle=start+exitProgress*travelSpeed;
      x=width*.5+Math.cos(exitAngle)*radius;
      y=height*.5+Math.sin(exitAngle)*radius;
     }else{
      departure=clamp((exitProgress-toTop)/.08,0,1);
      const topX=width*.5,topY=height*.5-radius;
      const offscreen=window.innerWidth-fieldLeft+100;
      // Horizontal tangent at twelve o'clock continues into a shared right sweep.
      x=cubic(topX,topX+radius*travelSpeed*.08/3,offscreen-width*.22,offscreen,departure);
      y=cubic(topY,topY,topY+height*.16,topY+height*.12,departure);
     }
    }
    const bank=(1-dock)*Math.sin(ride*Math.PI*2)*12-departure*10;
    const reveal=smooth(clamp(ride/.16,0,1))*(1-smooth(clamp((departure-.45)/.55,0,1)));
    node.style.transform=`translate3d(${x}px,${y}px,0) translate(-50%,-50%) rotate(${bank}deg) scale(${.82+.18*dock-.10*departure})`;
    node.style.opacity=String(travelName.current===tool.name?0:reveal);
    node.style.pointerEvents=interactive?'auto':'none';
    node.tabIndex=interactive?0:-1;
   });
  };
  frame.current=requestAnimationFrame(animate);
  return()=>{cancelAnimationFrame(frame.current);host.inert=false};
 },[reduced]);
 useEffect(()=>()=>{flightTween.current?.kill();if(travel.current){gsap.killTweensOf(travel.current);travel.current.remove()}},[]);

 useLayoutEffect(()=>{
  const element=feature.current;if(!element)return;
  const height=selected?(window.innerWidth<=720?68:155):0;
  const tween=gsap.to(element,{height,duration:reduced?0:.65,ease:'power3.inOut',overwrite:true});
  return()=>tween.kill();
 },[selected,reduced]);
 const fly=(tool,source,target,returning=false)=>new Promise(resolve=>{
  if(!source){resolve();return}
  const from=source.getBoundingClientRect(),ghost=source.cloneNode(true);
  ghost.setAttribute('aria-hidden','true');
  Object.assign(ghost.style,{position:'fixed',left:from.left+'px',top:from.top+'px',width:from.width+'px',height:from.height+'px',maxWidth:'none',maxHeight:'none',objectFit:'contain',margin:'0',transform:'none',transformOrigin:'0 0',opacity:'1',pointerEvents:'none',zIndex:'9999'});
  document.body.appendChild(ghost);travel.current=ghost;travelName.current=tool.name;
  const state={progress:0};
  // Re-measure on every frame: the returning icon meets its live orbit slot.
  flightTween.current=gsap.to(state,{progress:1,duration:reduced?0:.85,ease:'power2.inOut',onUpdate:()=>{
   const node=target();if(!node)return;
   const to=node.getBoundingClientRect(),p=state.progress;
   gsap.set(ghost,{x:(to.left-from.left)*p,y:(to.top-from.top)*p-Math.sin(p*Math.PI)*30,scaleX:1+(to.width/from.width-1)*p,scaleY:1+(to.height/from.height-1)*p});
  },onComplete:()=>{
   ghost.remove();travel.current=null;travelName.current=null;resolve();
  }});
 });
 const returnTool=async()=>{
  const name=chosen.current;if(!name)return;
  const tool=tools.find(item=>item.name===name);
  const source=feature.current?.querySelector('img');
  // Restore its orbit slot before flying back; only the traveling copy is visible.
  travelName.current=name;
  const image=source?.cloneNode(true);
  const rect=source?.getBoundingClientRect();
  setSelected(null);chosen.current=null;
  if(reduced||!image||!rect){travelName.current=null;return}
  // The source detaches during React's update, so preserve its measured geometry.
  image.getBoundingClientRect=()=>rect;
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  await fly(tool,image,()=>buttons.current[name]?.querySelector('img'),true);
 };
 const choose=async tool=>{
  if(busy.current)return;
  busy.current=true;
  const same=chosen.current===tool?.name;
  await returnTool();
  if(tool&&!same&&reduced){
   setSelected(tool.name);
  }else if(tool&&!same){
   const source=buttons.current[tool.name]?.querySelector('img');
   travelName.current=tool.name;
   setSelected(tool.name);chosen.current=tool.name;
   if(feature.current)feature.current.style.visibility='hidden';
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   await fly(tool,source,()=>feature.current?.querySelector('img'));
   if(feature.current)feature.current.style.visibility='';
  }
  busy.current=false;
 };
 const current=tools.find(t=>t.name===selected);
 return <section id="design-tools" ref={root} className="design-tools" aria-label="Interactive design tools">
  <div className="design-tools-stage">
   <div className="design-tools-layout">
    <div className="design-tools-information">
     <span className="design-tools-eyebrow">TOOLS / CREATIVE PRACTICE</span>
     <h2 id="design-tools-heading" key={selected||'intro'}>{current?current.name:'Design Tools'}</h2>
     <div ref={feature} className={'design-tool-feature-icon'+(current?' is-visible':'')} aria-hidden="true">{current&&<ToolIcon tool={current}/>}</div>
     <p>{current?current.detail:intro}</p>
     {current&&<button className="design-tools-reset" type="button" onClick={()=>choose(null)}>Back to all tools <span aria-hidden="true">↗</span></button>}
    </div>
    <div className="design-tools-orbit" ref={orbit} aria-label="Select a design tool">
     <span className="design-tools-center" aria-hidden="true">{current?'Design Tools':'Select a tool'}</span>
     {tools.map(tool=><button key={tool.name} ref={el=>{if(el)buttons.current[tool.name]=el;else delete buttons.current[tool.name]}} className="design-tool-orbit-item" type="button" aria-label={'Explore '+tool.name} title={tool.name} tabIndex={reduced?0:-1} aria-pressed={selected===tool.name} onClick={()=>choose(tool)}>
      <span className="design-tool-orbit-icon"><ToolIcon tool={tool}/></span>
      <span className="design-tool-orbit-label">{tool.name}</span>
     </button>)}
    </div>
   </div>
  </div>
 </section>;
}
