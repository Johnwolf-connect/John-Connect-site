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
  const information=host.querySelector('.design-tools-information');
  const prompt=host.querySelector('.design-tools-center');
  if(reduced){
   Object.values(buttons.current).forEach(node=>{
    node.removeAttribute('style');
    node.classList.remove('is-pointer-magnified');
   });
   host.inert=false;
   host.style.setProperty('--tool-panel-opacity','1');
   if(information)information.style.removeProperty('transform');
   if(prompt)prompt.style.removeProperty('opacity');
   return;
  }

  // Section 2 is standalone: entrance progress must come from its own
  // visibility, never the retired homepage --tools-progress variable.
  const count=tools.length;
  const spacing=.16;
  const flightDuration=1.05;
  const finalLanding=flightDuration+(count-1)*spacing;
  const fastOrbit=2*Math.PI/(count*spacing);
  const idleOrbit=.19;
  const slowing=.38;
  const angles=new Map(tools.map((tool,i)=>[tool.name,-2*Math.PI*(i+1)/count]));
  const pointer={x:null,y:null,inside:false};
  let active=false,start=null,previous=null,hovered=null;
  const movePointer=event=>{
   if(event.pointerType==='touch')return;
   pointer.x=event.clientX;
   pointer.y=event.clientY;
   pointer.inside=true;
  };
  const clearPointer=()=>{pointer.inside=false;};
  const cubic=(a,b,c,d,t)=>{
   const k=1-t;
   return k*k*k*a+3*k*k*t*b+3*k*t*t*c+t*t*t*d;
  };
  const clock=t=>{
   if(t<=finalLanding)return fastOrbit*(t-finalLanding);
   const after=t-finalLanding;
   return (fastOrbit-idleOrbit)*slowing*(1-Math.exp(-after/slowing))+idleOrbit*after;
  };
  const animate=time=>{
   if(!active)return;
   if(start===null)start=time;
   const elapsed=Math.max(0,(time-start)/1000);
   const delta=previous===null?0:Math.min(.06,Math.max(0,(time-previous)/1000));
   previous=time;
   const width=field.clientWidth,height=field.clientHeight;
   const radius=Math.min(width,height)*.4;
   const centerX=width*.5,centerY=height*.5;
   const sectionRect=host.getBoundingClientRect();
   const fieldRect=field.getBoundingClientRect();
   // The icons begin near the lower LEFT of the entire Design Tools screen,
   // not at the left edge of the circular selector.
   const originX=sectionRect.left+Math.max(28,sectionRect.width*.055)-fieldRect.left;
   const originY=sectionRect.top+sectionRect.height*.86-fieldRect.top;
   const topX=centerX,topY=centerY-radius;
   const visibleTools=tools.filter(tool=>tool.name!==chosen.current);
   const ready=elapsed>=finalLanding;
   host.inert=false;
   host.style.setProperty('--tool-panel-opacity','1');
   if(information)information.style.transform='translateY(0)';
   if(prompt)prompt.style.opacity=String(smooth(clamp((elapsed-finalLanding+.18)/.35,0,1)));

   const centers=[];
   tools.forEach((tool,i)=>{
    const node=buttons.current[tool.name];
    if(!node)return;
    if(tool.name===chosen.current){
     node.style.opacity='0';
     node.style.pointerEvents='none';
     node.tabIndex=-1;
     node.classList.remove('is-pointer-magnified');
     return;
    }
    const started=elapsed-i*spacing;
    const ride=clamp(started/flightDuration,0,1);
    const complete=ride>=1;
    const currentOffset=angles.get(tool.name)??-2*Math.PI*(i+1)/count;
    // When a tool is selected, the remaining slots re-space gently rather
    // than snapping, while the orbit continues rotating at its normal pace.
    const slot=visibleTools.findIndex(item=>item.name===tool.name);
    const targetOffset=-2*Math.PI*(slot+1)/visibleTools.length;
    const angularError=Math.atan2(Math.sin(targetOffset-currentOffset),Math.cos(targetOffset-currentOffset));
    const offset=currentOffset+angularError*(1-Math.exp(-delta/.42));
    angles.set(tool.name,offset);
    const angle=-Math.PI/2+clock(elapsed)+offset;
    let x,y,bank=0;
    if(!complete){
     // One continuous swoop: low-left -> high-left -> the TOP of the ring.
     // The .16s launch spacing keeps the icons separate throughout the flight.
     const t=1-Math.pow(1-ride,2.1);
     x=cubic(originX,originX+sectionRect.width*.13,
             centerX-radius*1.15,topX,t);
     y=cubic(originY,originY-sectionRect.height*.35,
             centerY-radius*1.25,topY,t);
     bank=(1-ride)*(-18+22*Math.sin(ride*Math.PI));
    }else{
     x=centerX+Math.cos(angle)*radius;
     y=centerY+Math.sin(angle)*radius;
    }
    const opacity=smooth(clamp(ride/.14,0,1));
    node.style.transform='translate3d('+x+'px,'+y+'px,0) translate(-50%,-50%) rotate('+bank+'deg) scale('+(0.84+ride*.16)+')';
    node.style.opacity=String(travelName.current===tool.name?0:opacity);
    node.style.pointerEvents=complete?'auto':'none';
    node.tabIndex=complete?0:-1;
    if(complete&&travelName.current!==tool.name){
     centers.push({tool,node,x,y});
    }
   });

   // Hit-test against unmagnified orbit slots EVERY frame. This means a
   // stationary mouse enlarges whichever rotating icon is currently beneath
   // it, and the previous icon shrinks immediately after passing by.
   let nextHovered=null,bestDistance=Infinity;
   const pointerX=pointer.x-fieldRect.left;
   const pointerY=pointer.y-fieldRect.top;
   if(ready&&pointer.inside&&pointer.x>=fieldRect.left&&pointer.x<=fieldRect.right&&
      pointer.y>=fieldRect.top&&pointer.y<=fieldRect.bottom){
    for(const item of centers){
     const halfW=item.node.offsetWidth*.48;
     const halfH=item.node.offsetHeight*.48;
     const dx=pointerX-item.x,dy=pointerY-item.y;
     if(Math.abs(dx)>halfW||Math.abs(dy)>halfH)continue;
     const distance=dx*dx+dy*dy;
     if(distance<bestDistance){bestDistance=distance;nextHovered=item.tool.name;}
    }
   }
   if(nextHovered!==hovered){
    hovered=nextHovered;
    Object.values(buttons.current).forEach(node=>node.classList.toggle(
     'is-pointer-magnified',Boolean(hovered&&node===buttons.current[hovered])
    ));
   }
   frame.current=requestAnimationFrame(animate);
  };
  const stop=()=>{
   active=false;
   cancelAnimationFrame(frame.current);
   frame.current=0;
   hovered=null;
   Object.values(buttons.current).forEach(node=>{
    node.classList.remove('is-pointer-magnified');
    node.style.opacity='0';
    node.style.pointerEvents='none';
    node.tabIndex=-1;
   });
  };
  const observer=new IntersectionObserver(([entry])=>{
   const sufficientlyVisible=entry.isIntersecting&&entry.intersectionRatio>=.16;
   if(sufficientlyVisible&&!active){
    active=true;
    start=null;
    previous=null;
    angles.clear();
    tools.forEach((tool,i)=>angles.set(tool.name,-2*Math.PI*(i+1)/count));
    frame.current=requestAnimationFrame(animate);
   }else if(!sufficientlyVisible&&active){
    stop();
   }
  },{threshold:.16});
  window.addEventListener('pointermove',movePointer,{passive:true});
  window.addEventListener('blur',clearPointer);
  observer.observe(host);
  return()=>{
   observer.disconnect();
   stop();
   window.removeEventListener('pointermove',movePointer);
   window.removeEventListener('blur',clearPointer);
   host.inert=false;
  };
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
