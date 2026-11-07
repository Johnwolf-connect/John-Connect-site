import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
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
 const exitProgress=useRef(0);
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
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reducedMotion){
   Object.values(buttons.current).forEach(node=>node.removeAttribute('style'));
   host.style.setProperty('--tool-panel-opacity','1');
   return;
  }
  // Pin only during deliberate scrolling. The pinned section remains a full
  // viewport; wheel/touch scroll controls departure and naturally reverses it.
  let entranceRequested=false;
  let reverseEntry=false;
  const pin=ScrollTrigger.create({
   id:'design-tools-lock',trigger:host,start:'top top',end:'+=115%',
   pin:true,pinSpacing:true,scrub:true,anticipatePin:1,
   invalidateOnRefresh:true,
   onEnter:()=>{entranceRequested=true;reverseEntry=false},
   onEnterBack:()=>{entranceRequested=true;reverseEntry=true},
   onUpdate:self=>{exitProgress.current=self.progress},
   onRefresh:self=>{exitProgress.current=self.progress}
  });
  const count=tools.length;
  const TAU=Math.PI*2;
  const clamp01=v=>Math.max(0,Math.min(1,v));
  const mod=(v,m)=>((v%m)+m)%m;
  const cubic=(a,b,c,d,t)=>{const q=1-t;return q*q*q*a+3*q*q*t*b+3*q*t*t*c+t*t*t*d};
  const curve=(p0,p1,p2,p3,t)=>({
   x:cubic(p0.x,p1.x,p2.x,p3.x,t),
   y:cubic(p0.y,p1.y,p2.y,p3.y,t)
  });
  // Lookup tables turn each Bezier into a constant-speed, arc-length track.
  // This is essential: equal time delays do NOT preserve spacing in bends.
  const track=(segments)=>{
   const samples=[],lengths=[];let length=0,previous=null;
   for(const segment of segments){
    for(let j=0;j<=80;j++){
     if(samples.length&&j===0)continue;
     const point=curve(...segment,j/80);
     if(previous)length+=Math.hypot(point.x-previous.x,point.y-previous.y);
     samples.push(point);lengths.push(length);previous=point;
    }
   }
   return {length,pointAt(distance){
    const d=Math.max(0,Math.min(length,distance));
    let low=0,high=lengths.length-1;
    while(low<high){const mid=(low+high)>>1;if(lengths[mid]<d)low=mid+1;else high=mid}
    if(low===0)return samples[0];
    const fraction=(d-lengths[low-1])/Math.max(.00001,lengths[low]-lengths[low-1]);
    return {x:samples[low-1].x+(samples[low].x-samples[low-1].x)*fraction,
     y:samples[low-1].y+(samples[low].y-samples[low-1].y)*fraction};
   }};
  };
  const pointer={x:null,y:null,inside:false};
  const movePointer=e=>{if(e.pointerType!=='touch'){pointer.x=e.clientX;pointer.y=e.clientY;pointer.inside=true}};
  const clearPointer=()=>{pointer.inside=false};
  let active=false,start=null,last=null,phase=0,frozenPhase=null,hovered=null;
  const animate=now=>{
   if(!active)return;
   if(entranceRequested){
    entranceRequested=false;
    start=reverseEntry?now-3150:now;
    last=now;phase=0;frozenPhase=null;
   }
   if(start===null)start=now;
   const dt=last===null?0:Math.min(.06,(now-last)/1000);
   last=now;
   const elapsed=(now-start)/1000;
   const rect=field.getBoundingClientRect();
   const section=host.getBoundingClientRect();
   const width=field.clientWidth,height=field.clientHeight;
   const cx=width/2,cy=height/2,radius=Math.min(width,height)*.4;
   const circumference=TAU*radius;
   const gap=circumference/count;
   const origin={x:section.left+Math.max(28,section.width*.055)-rect.left,
    y:section.top+section.height*.86-rect.top};
   const top={x:cx,y:cy-radius};
   const turn={x:origin.x+(top.x-origin.x)*.52,y:origin.y};
   // Tangent-continuous entry: horizontal -> rising -> horizontal at 12 o'clock.
   const incoming=track([
    [origin,{x:origin.x+(turn.x-origin.x)*.35,y:origin.y},
     {x:turn.x-(turn.x-origin.x)*.28,y:turn.y},turn],
    [turn,{x:turn.x+(top.x-turn.x)*.55,y:turn.y},
     {x:top.x-(top.x-turn.x)*.40,y:top.y},top]
   ]);
   const right={x:cx+radius,y:cy};
   const bottom={x:right.x,y:cy+Math.max(radius*.7,height*.22)};
   const end={x:width+Math.max(140,width*.22),y:bottom.y+Math.min(height*.19,130)};
   // Tangent-continuous exit at 3 o'clock: down -> down/right -> right.
   const outgoing=track([
    [right,{x:right.x,y:right.y+(bottom.y-right.y)*.35},
     {x:bottom.x,y:bottom.y-(bottom.y-right.y)*.35},bottom],
    [bottom,{x:bottom.x,y:bottom.y+(end.y-bottom.y)*.65},
     {x:end.x-(end.x-bottom.x)*.55,y:end.y},end]
   ]);
   const departure=clamp01(exitProgress.current);
   // Freeze the orbit phase on the FIRST intentional departure; reverse
   // scrolling reuses the exact same phase and geometry.
   if(departure>0&&frozenPhase===null)frozenPhase=phase;
   if(departure===0)frozenPhase=null;
   const introDuration=3.15;
   const introTravel=incoming.length+(count-1)*gap;
   const introDistance=introTravel*clamp01(elapsed/introDuration);
   if(departure===0&&elapsed>=introDuration)phase+=dt*.19;
   // Match the last arrival's angular position at the intro/orbit boundary.
   const ringPhase=frozenPhase===null?phase:frozenPhase;
   const travelOut=departure*(circumference+outgoing.length+gap);
   const centers=[];
   tools.forEach((tool,i)=>{
    const node=buttons.current[tool.name];if(!node)return;
    if(chosen.current===tool.name){
     node.style.opacity='0';node.style.pointerEvents='none';node.tabIndex=-1;
     node.classList.remove('is-pointer-magnified');return;
    }
    let x,y,visible=true,onRing=false;
    const offset=i*gap;
    if(elapsed<introDuration&&departure===0){
     const distance=introDistance-offset;
     if(distance<0){visible=false;({x,y}=origin)}
     else if(distance<incoming.length){({x,y}=incoming.pointAt(distance))}
     else{
      const angle=-Math.PI/2+(distance-incoming.length)/radius;
      x=cx+Math.cos(angle)*radius;y=cy+Math.sin(angle)*radius;
      onRing=true;
     }
    }else{
     const angle=-Math.PI/2+ringPhase-i*TAU/count;
     // Clockwise distance from the current position to the 3 o'clock exit.
     const toGate=mod(Math.PI/2-angle,TAU)*radius;
     const along=travelOut-toGate;
     if(departure>0&&along>=0){
      ({x,y}=outgoing.pointAt(along));
      if(along>=outgoing.length)visible=false;
     }else{
      const a=angle+travelOut/radius;
      x=cx+Math.cos(a)*radius;y=cy+Math.sin(a)*radius;
      onRing=true;
     }
    }
    node.style.transform='translate3d('+x+'px,'+y+'px,0) translate(-50%,-50%)';
    node.style.opacity=visible&&travelName.current!==tool.name?'1':'0';
    node.style.pointerEvents=visible&&onRing&&departure===0?'auto':'none';
    node.tabIndex=visible&&onRing&&departure===0?0:-1;
    if(visible&&onRing&&departure===0&&travelName.current!==tool.name)
     centers.push({node,name:tool.name,x,y});
   });
   let next=null,nearest=Infinity;
   if(pointer.inside&&departure===0){
    const px=pointer.x-rect.left,py=pointer.y-rect.top;
    for(const item of centers){
     const dx=px-item.x,dy=py-item.y;
     if(Math.abs(dx)>item.node.offsetWidth*.48||Math.abs(dy)>item.node.offsetHeight*.48)continue;
     const d=dx*dx+dy*dy;if(d<nearest){nearest=d;next=item.name}
    }
   }
   if(hovered!==next){
    hovered=next;
    Object.entries(buttons.current).forEach(([name,node])=>
     node.classList.toggle('is-pointer-magnified',name===hovered));
   }
   host.style.setProperty('--tool-panel-opacity','1');
   if(information)information.style.transform='translateY(0)';
   if(prompt)prompt.style.opacity=String(clamp01((elapsed-introDuration+.45)/.4)*(1-departure));
   frame.current=requestAnimationFrame(animate);
  };
  const stop=()=>{
   active=false;cancelAnimationFrame(frame.current);frame.current=0;
   hovered=null;frozenPhase=null;
   Object.values(buttons.current).forEach(node=>{
    node.classList.remove('is-pointer-magnified');
    node.style.opacity='0';node.style.pointerEvents='none';node.tabIndex=-1;
   });
  };
  const observer=new IntersectionObserver(([entry])=>{
   if(entry.isIntersecting&&!active){
    active=true;start=null;last=null;phase=0;frozenPhase=null;
    if(pin.isActive&&pin.direction>=0){entranceRequested=true;reverseEntry=false}
    else if(pin.isActive){entranceRequested=true;reverseEntry=true}
    frame.current=requestAnimationFrame(animate);
   }else if(!entry.isIntersecting&&active)stop();
  },{threshold:0});
  window.addEventListener('pointermove',movePointer,{passive:true});
  window.addEventListener('blur',clearPointer);
  observer.observe(host);
  return()=>{
   observer.disconnect();pin.kill();stop();exitProgress.current=0;
   window.removeEventListener('pointermove',movePointer);
   window.removeEventListener('blur',clearPointer);
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
