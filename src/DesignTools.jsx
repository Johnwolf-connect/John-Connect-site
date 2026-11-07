import React,{useLayoutEffect,useRef,useState} from 'react';
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
const TAU=Math.PI*2;
const ROTATION_SPEED=.28;
const SLOT_EASE=9;
const ORBIT_X=.40;
const ORBIT_Y=.40;
const PANEL_PREP_MS=190;
const RETURN_PREP_MS=230;
const OUTBOUND_MS=900;
const RETURN_MS=940;

function ToolIcon({tool}){return <img src={'/tools/'+tool.slug+'.webp'} alt="" draggable="false"/>}
const wait=ms=>new Promise(resolve=>window.setTimeout(resolve,ms));
const nextPaint=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
const slotAngle=(slot,count)=>-Math.PI/2-slot*TAU/count;
const angleDelta=(from,to)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));
const distance=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);

function smoothPolyline(points,iterations=3){
 let result=points.map(point=>[point[0],point[1]]);
 for(let step=0;step<iterations;step++){
  const next=[result[0]];
  for(let i=0;i<result.length-1;i++){
   const a=result[i],b=result[i+1];
   next.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25]);
   next.push([a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75]);
  }
  next.push(result[result.length-1]);
  result=next;
 }
 return result;
}

function resamplePath(points,count=120){
 const lengths=[0];
 for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+distance(points[i-1],points[i]));
 const total=lengths[lengths.length-1]||1;
 return Array.from({length:count},(_,index)=>{
  const target=total*index/(count-1);
  let segment=1;
  while(segment<lengths.length-1&&lengths[segment]<target)segment++;
  const a=points[segment-1],b=points[segment];
  const span=Math.max(.0001,lengths[segment]-lengths[segment-1]);
  const t=(target-lengths[segment-1])/span;
  return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
 });
}

function safeOutboundRoute(start,end,orbit){
 const cx=orbit.left+orbit.width/2,cy=orbit.top+orbit.height/2;
 const dx=start[0]-cx,dy=start[1]-cy,len=Math.hypot(dx,dy)||1;
 const clearance=Math.max(96,Math.min(132,Math.min(orbit.width,orbit.height)*.18));
 const radial=[start[0]+dx/len*clearance,start[1]+dy/len*clearance];
 if(start[0]<cx-orbit.width*.08){
  const corridorX=orbit.left-clearance;
  return [start,radial,[corridorX,radial[1]],[corridorX,end[1]],end];
 }
 const upper=start[1]<=cy;
 const corridorY=upper?orbit.top-clearance:orbit.bottom+clearance;
 const approachX=Math.max(orbit.left-clearance*.65,end[0]+clearance*.9);
 return [start,radial,[radial[0],corridorY],[approachX,corridorY],[approachX,end[1]],end];
}

function createGhost(source){
 if(!source)return null;
 const rect=source.getBoundingClientRect();
 if(!rect.width||!rect.height)return null;
 const node=source.cloneNode(true);
 Object.assign(node.style,{
  position:'fixed',
  left:rect.left+'px',
  top:rect.top+'px',
  width:rect.width+'px',
  height:rect.height+'px',
  maxWidth:'none',
  maxHeight:'none',
  margin:'0',
  objectFit:'contain',
  pointerEvents:'none',
  transform:'translate3d(0,0,0) scale(1)',
  transformOrigin:'center center',
  willChange:'transform',
  zIndex:'99999',
  filter:'drop-shadow(0 10px 22px rgba(92,44,148,.24))'
 });
 document.body.appendChild(node);
 return {node,rect};
}

async function flyGhost(pack,targetRect,orbit,reverse=false,duration=OUTBOUND_MS){
 if(!pack||!targetRect||!orbit)return;
 const start=[pack.rect.left+pack.rect.width/2,pack.rect.top+pack.rect.height/2];
 const end=[targetRect.left+targetRect.width/2,targetRect.top+targetRect.height/2];
 const raw=reverse?safeOutboundRoute(end,start,orbit).reverse():safeOutboundRoute(start,end,orbit);
 const path=resamplePath(smoothPolyline(raw,3),140);
 const scaleX=targetRect.width/pack.rect.width;
 const scaleY=targetRect.height/pack.rect.height;
 const endScale=Math.max(.28,Math.min(3.2,Math.min(scaleX,scaleY)));
 const frames=Array.from({length:121},(_,index)=>{
  const t=index/120;
  const eased=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  const exact=eased*(path.length-1);
  const low=Math.floor(exact),high=Math.min(path.length-1,low+1),mix=exact-low;
  const point=[
   path[low][0]+(path[high][0]-path[low][0])*mix,
   path[low][1]+(path[high][1]-path[low][1])*mix
  ];
  const scale=1+(endScale-1)*eased;
  return {
   offset:t,
   transform:'translate3d('+(point[0]-start[0])+'px,'+(point[1]-start[1])+'px,0) scale('+scale+')'
  };
 });
 const animation=pack.node.animate(frames,{duration,easing:'linear',fill:'forwards'});
 try{await animation.finished}catch{}
}

export default function DesignTools(){
 const [selected,setSelected]=useState(null);
 const [departing,setDeparting]=useState(null);
 const [returning,setReturning]=useState(false);

 const orbitRef=useRef(null);
 const infoRef=useRef(null);
 const featureSlotRef=useRef(null);
 const featureIconRef=useRef(null);
 const buttons=useRef([]);
 const phase=useRef(0);
 const baseAngles=useRef([]);
 const frame=useRef(0);
 const last=useRef(0);
 const pointer=useRef({inside:false,x:0,y:0});
 const busy=useRef(false);
 const ghostRef=useRef(null);
 const selectedRef=useRef(null);
 const departingRef=useRef(null);
 const returningRef=useRef(false);

 selectedRef.current=selected;
 departingRef.current=departing;
 returningRef.current=returning;

 const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;

 const position=dt=>{
  const host=orbitRef.current;
  if(!host)return;
  const rect=host.getBoundingClientRect();
  const hiddenName=departingRef.current||selectedRef.current;
  const openingGap=Boolean(hiddenName&&returningRef.current);
  const slotCount=hiddenName&&!openingGap?tools.length-1:tools.length;
  let visibleSlot=0;
  let nearest=-1;
  let minimum=Infinity;
  const alpha=reduced()?1:1-Math.exp(-SLOT_EASE*Math.max(0,dt));

  buttons.current.forEach((node,index)=>{
   if(!node)return;
   const tool=tools[index];
   const hidden=Boolean(hiddenName&&tool.name===hiddenName);

   if(hidden&&!openingGap){
    node.style.opacity='0';
    node.style.visibility='hidden';
    node.style.pointerEvents='none';
    node.classList.remove('is-proximity');
    return;
   }

   const slot=hiddenName&&!openingGap?visibleSlot++:index;
   const targetBase=slotAngle(slot,slotCount);
   if(baseAngles.current[index]===undefined)baseAngles.current[index]=targetBase;
   baseAngles.current[index]+=angleDelta(baseAngles.current[index],targetBase)*alpha;

   const angle=baseAngles.current[index]+phase.current;
   const offsetX=rect.width*ORBIT_X*Math.cos(angle);
   const offsetY=rect.height*ORBIT_Y*Math.sin(angle);
   node.style.transform='translate3d('+offsetX+'px,'+offsetY+'px,0) translate(-50%,-50%)';

   if(hidden){
    node.style.opacity='0';
    node.style.visibility='hidden';
    node.style.pointerEvents='none';
    node.classList.remove('is-proximity');
    return;
   }

   node.style.opacity='1';
   node.style.visibility='visible';
   node.style.pointerEvents=selectedRef.current?'none':'auto';

   if(pointer.current.inside){
    const centerX=rect.left+rect.width/2+offsetX;
    const centerY=rect.top+rect.height/2+offsetY;
    const d=Math.hypot(centerX-pointer.current.x,centerY-pointer.current.y);
    if(d<minimum){minimum=d;nearest=index}
   }
  });

  const threshold=Math.max(84,Math.min(112,rect.width*.105));
  buttons.current.forEach((node,index)=>{
   if(!node)return;
   const active=index===nearest&&minimum<threshold;
   node.classList.toggle('is-proximity',active);
  });
 };

 const animate=time=>{
  if(!last.current)last.current=time;
  const dt=Math.max(0,Math.min(.05,(time-last.current)/1000));
  last.current=time;
  if(!reduced())phase.current+=dt*ROTATION_SPEED;
  position(dt||1/60);
  frame.current=requestAnimationFrame(animate);
 };

 useLayoutEffect(()=>{
  position(1/60);
  frame.current=requestAnimationFrame(animate);
  return()=>{
   cancelAnimationFrame(frame.current);
   ghostRef.current?.node?.remove();
  };
 },[]);

 const selectTool=async(tool,index)=>{
  if(busy.current||selectedRef.current)return;
  busy.current=true;

  if(reduced()){
   selectedRef.current=tool.name;
   setSelected(tool.name);
   busy.current=false;
   return;
  }

  const source=buttons.current[index]?.querySelector('.design-tool-orbit-icon img');
  const ghost=createGhost(source);
  if(!ghost){
   selectedRef.current=tool.name;
   setSelected(tool.name);
   busy.current=false;
   return;
  }

  ghostRef.current=ghost;
  departingRef.current=tool.name;
  setDeparting(tool.name);

  await wait(PANEL_PREP_MS);
  const target=featureIconRef.current?.getBoundingClientRect();
  const orbit=orbitRef.current?.getBoundingClientRect();
  if(target&&orbit)await flyGhost(ghost,target,orbit,false,OUTBOUND_MS);

  selectedRef.current=tool.name;
  departingRef.current=null;
  setSelected(tool.name);
  setDeparting(null);
  await nextPaint();
  ghost.node.remove();
  ghostRef.current=null;
  busy.current=false;
 };

 const reset=async()=>{
  if(busy.current||!selectedRef.current)return;
  busy.current=true;
  const name=selectedRef.current;
  const index=tools.findIndex(tool=>tool.name===name);

  if(reduced()){
   selectedRef.current=null;
   returningRef.current=false;
   setSelected(null);
   setReturning(false);
   busy.current=false;
   return;
  }

  const source=featureIconRef.current?.querySelector('img');
  const ghost=createGhost(source);
  if(!ghost){
   selectedRef.current=null;
   setSelected(null);
   busy.current=false;
   return;
  }

  ghostRef.current=ghost;
  baseAngles.current[index]=slotAngle(index,tools.length);
  returningRef.current=true;
  setReturning(true);

  await wait(RETURN_PREP_MS);

  const orbit=orbitRef.current?.getBoundingClientRect();
  const targetImage=buttons.current[index]?.querySelector('.design-tool-orbit-icon img');
  const targetVisual=targetImage?.getBoundingClientRect();

  if(orbit&&targetVisual){
   const futureAngle=slotAngle(index,tools.length)+phase.current+ROTATION_SPEED*(RETURN_MS/1000);
   const centerX=orbit.left+orbit.width/2+orbit.width*ORBIT_X*Math.cos(futureAngle);
   const centerY=orbit.top+orbit.height/2+orbit.height*ORBIT_Y*Math.sin(futureAngle);
   const targetRect={
    left:centerX-targetVisual.width/2,
    top:centerY-targetVisual.height/2,
    width:targetVisual.width,
    height:targetVisual.height
   };
   await flyGhost(ghost,targetRect,orbit,true,RETURN_MS);
  }

  selectedRef.current=null;
  returningRef.current=false;
  setSelected(null);
  setReturning(false);
  await nextPaint();
  ghost.node.remove();
  ghostRef.current=null;
  busy.current=false;
 };

 const current=tools.find(tool=>tool.name===selected);
 const panelActive=Boolean(selected||departing||returning);

 return <section id="design-tools" className="design-tools" aria-label="Design tools" onKeyDown={event=>{if(event.key==='Escape'&&selected&&!busy.current){event.preventDefault();reset()}}}>
  <div className="design-tools-stage">
   <div className="design-tools-layout">
    <div className={'design-tools-information'+(panelActive?' has-tool-space':'')+(returning?' is-returning':'')} ref={infoRef} aria-live="polite">
     <span className="design-tools-eyebrow">TOOLS / CREATIVE PRACTICE</span>
     <h2 key={'heading-'+(current?.name||'all')} id="design-tools-heading" className="design-tools-heading-copy">{current?current.name:'Design Tools'}</h2>
     <div className="design-tool-feature-slot" ref={featureSlotRef} aria-hidden="true">
      <div className="design-tool-feature-icon" ref={featureIconRef}>
       {current&&<ToolIcon tool={current}/>}
      </div>
     </div>
     <div key={'copy-'+(current?.name||'all')} className="design-tools-copy">
      <p>{current?current.detail:intro}</p>
      {current&&<button className="design-tools-reset" type="button" onClick={reset}>Back to all tools</button>}
     </div>
    </div>

    <div className="design-tools-orbit" ref={orbitRef}
     onPointerEnter={event=>{pointer.current.inside=true;pointer.current.x=event.clientX;pointer.current.y=event.clientY}}
     onPointerMove={event=>{pointer.current.inside=true;pointer.current.x=event.clientX;pointer.current.y=event.clientY}}
     onPointerLeave={()=>{pointer.current.inside=false}}
     aria-label="Select a design tool">
     <span className="design-tools-center" aria-hidden="true">{current?'Design Tools':'Select a tool'}</span>
     {tools.map((tool,index)=><button
      key={tool.name}
      ref={node=>{buttons.current[index]=node}}
      className={'design-tool-orbit-item'+(selected===tool.name||departing===tool.name?' is-selected':'')}
      type="button"
      aria-label={'Explore '+tool.name}
      aria-pressed={selected===tool.name}
      aria-disabled={Boolean(selected&&selected!==tool.name)}
      tabIndex={selected&&selected!==tool.name?-1:0}
      onClick={()=>selectTool(tool,index)}>
      <span className="design-tool-orbit-icon"><ToolIcon tool={tool}/></span>
      <span className="design-tool-orbit-label">{tool.name}</span>
     </button>)}
    </div>
   </div>
  </div>
 </section>;
}
