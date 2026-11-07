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

const toolNames=tools.map(tool=>tool.name);
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
const SWITCH_OUT_MS=820;
const SWITCH_RETURN_MS=860;
const SWITCH_STAGGER_MS=110;

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

function safeOutboundRoute(start,end,orbit,alternate=false){
 const cx=orbit.left+orbit.width/2,cy=orbit.top+orbit.height/2;
 const dx=start[0]-cx,dy=start[1]-cy,len=Math.hypot(dx,dy)||1;
 const clearance=Math.max(96,Math.min(132,Math.min(orbit.width,orbit.height)*.18));
 const radial=[start[0]+dx/len*clearance,start[1]+dy/len*clearance];

 if(alternate){
  const upper=start[1]<=cy;
  const corridorY=upper?orbit.bottom+clearance:orbit.top-clearance;
  const approachX=Math.max(orbit.left-clearance*.65,end[0]+clearance*.9);
  return [start,radial,[radial[0],corridorY],[approachX,corridorY],[approachX,end[1]],end];
 }

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

async function flyGhost(pack,targetRect,orbit,{reverse=false,duration=OUTBOUND_MS,alternate=false}={}){
 if(!pack||!targetRect||!orbit)return;
 const start=[pack.rect.left+pack.rect.width/2,pack.rect.top+pack.rect.height/2];
 const end=[targetRect.left+targetRect.width/2,targetRect.top+targetRect.height/2];
 const raw=reverse
  ?safeOutboundRoute(end,start,orbit,alternate).reverse()
  :safeOutboundRoute(start,end,orbit,alternate);
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
 const [switching,setSwitching]=useState(false);

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
 const selectedRef=useRef(null);
 const departingRef=useRef(null);
 const returningRef=useRef(false);
 const orbitOrderRef=useRef([...toolNames]);
 const hiddenOrbitRef=useRef(new Set());
 const ghostsRef=useRef(new Set());

 selectedRef.current=selected;
 departingRef.current=departing;
 returningRef.current=returning;

 const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;

 const trackGhost=pack=>{
  if(pack?.node)ghostsRef.current.add(pack.node);
  return pack;
 };
 const removeGhost=pack=>{
  if(!pack?.node)return;
  pack.node.remove();
  ghostsRef.current.delete(pack.node);
 };

 const position=dt=>{
  const host=orbitRef.current;
  if(!host)return;
  const rect=host.getBoundingClientRect();
  const order=orbitOrderRef.current;
  const slotCount=Math.max(1,order.length);
  let nearest=-1;
  let minimum=Infinity;
  const alpha=reduced()?1:1-Math.exp(-SLOT_EASE*Math.max(0,dt));

  buttons.current.forEach((node,index)=>{
   if(!node)return;
   const name=tools[index].name;
   const slot=order.indexOf(name);
   const hidden=slot<0||hiddenOrbitRef.current.has(name);

   if(slot>=0){
    const targetBase=slotAngle(slot,slotCount);
    if(baseAngles.current[index]===undefined)baseAngles.current[index]=targetBase;
    baseAngles.current[index]+=angleDelta(baseAngles.current[index],targetBase)*alpha;

    const angle=baseAngles.current[index]+phase.current;
    const offsetX=rect.width*ORBIT_X*Math.cos(angle);
    const offsetY=rect.height*ORBIT_Y*Math.sin(angle);
    node.style.transform='translate3d('+offsetX+'px,'+offsetY+'px,0) translate(-50%,-50%)';

    if(!hidden&&pointer.current.inside){
     const centerX=rect.left+rect.width/2+offsetX;
     const centerY=rect.top+rect.height/2+offsetY;
     const d=Math.hypot(centerX-pointer.current.x,centerY-pointer.current.y);
     if(d<minimum){minimum=d;nearest=index}
    }
   }

   if(hidden){
    node.style.opacity='0';
    node.style.visibility='hidden';
    node.style.pointerEvents='none';
    node.classList.remove('is-proximity');
   }else{
    node.style.opacity='1';
    node.style.visibility='visible';
    node.style.pointerEvents=busy.current?'none':'auto';
   }
  });

  const threshold=Math.max(84,Math.min(112,rect.width*.105));
  buttons.current.forEach((node,index)=>{
   if(!node)return;
   node.classList.toggle('is-proximity',index===nearest&&minimum<threshold);
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
   ghostsRef.current.forEach(node=>node.remove());
   ghostsRef.current.clear();
  };
 },[]);

 const targetRectForSlot=(slot,count,visual,duration)=>{
  const orbit=orbitRef.current?.getBoundingClientRect();
  if(!orbit||!visual)return null;
  const futureAngle=slotAngle(slot,count)+phase.current+ROTATION_SPEED*(duration/1000);
  const centerX=orbit.left+orbit.width/2+orbit.width*ORBIT_X*Math.cos(futureAngle);
  const centerY=orbit.top+orbit.height/2+orbit.height*ORBIT_Y*Math.sin(futureAngle);
  return {
   left:centerX-visual.width/2,
   top:centerY-visual.height/2,
   width:visual.width,
   height:visual.height
  };
 };

 const firstSelect=async(tool,index)=>{
  busy.current=true;

  if(reduced()){
   orbitOrderRef.current=orbitOrderRef.current.filter(name=>name!==tool.name);
   selectedRef.current=tool.name;
   setSelected(tool.name);
   busy.current=false;
   return;
  }

  const source=buttons.current[index]?.querySelector('.design-tool-orbit-icon img');
  const ghost=trackGhost(createGhost(source));
  if(!ghost){
   orbitOrderRef.current=orbitOrderRef.current.filter(name=>name!==tool.name);
   selectedRef.current=tool.name;
   setSelected(tool.name);
   busy.current=false;
   return;
  }

  hiddenOrbitRef.current.add(tool.name);
  orbitOrderRef.current=orbitOrderRef.current.filter(name=>name!==tool.name);
  departingRef.current=tool.name;
  setDeparting(tool.name);

  await wait(PANEL_PREP_MS);
  const target=featureIconRef.current?.getBoundingClientRect();
  const orbit=orbitRef.current?.getBoundingClientRect();
  if(target&&orbit)await flyGhost(ghost,target,orbit,{duration:OUTBOUND_MS});

  selectedRef.current=tool.name;
  departingRef.current=null;
  setSelected(tool.name);
  setDeparting(null);
  hiddenOrbitRef.current.delete(tool.name);
  await nextPaint();
  removeGhost(ghost);
  busy.current=false;
 };

 const switchTool=async(tool,index)=>{
  const oldName=selectedRef.current;
  if(!oldName||oldName===tool.name)return;
  busy.current=true;

  const oldIndex=tools.findIndex(item=>item.name===oldName);
  const order=[...orbitOrderRef.current];
  const newSlot=order.indexOf(tool.name);
  if(newSlot<0){
   busy.current=false;
   return;
  }

  if(reduced()){
   order[newSlot]=oldName;
   orbitOrderRef.current=order;
   baseAngles.current[oldIndex]=baseAngles.current[index]??slotAngle(newSlot,order.length);
   selectedRef.current=tool.name;
   setSelected(tool.name);
   busy.current=false;
   return;
  }

  const newSource=buttons.current[index]?.querySelector('.design-tool-orbit-icon img');
  const oldSource=featureIconRef.current?.querySelector('img');
  const newGhost=trackGhost(createGhost(newSource));
  const oldGhost=trackGhost(createGhost(oldSource));

  if(!newGhost||!oldGhost){
   removeGhost(newGhost);
   removeGhost(oldGhost);
   order[newSlot]=oldName;
   orbitOrderRef.current=order;
   baseAngles.current[oldIndex]=baseAngles.current[index]??slotAngle(newSlot,order.length);
   selectedRef.current=tool.name;
   setSelected(tool.name);
   busy.current=false;
   return;
  }

  const orbit=orbitRef.current?.getBoundingClientRect();
  const featureTarget=featureIconRef.current?.getBoundingClientRect();
  const targetVisual=newSource?.getBoundingClientRect();

  hiddenOrbitRef.current.add(tool.name);
  hiddenOrbitRef.current.add(oldName);
  order[newSlot]=oldName;
  orbitOrderRef.current=order;
  baseAngles.current[oldIndex]=baseAngles.current[index]??slotAngle(newSlot,order.length);
  departingRef.current=tool.name;
  setDeparting(tool.name);
  setSwitching(true);
  await nextPaint();

  const oldTarget=targetRectForSlot(newSlot,order.length,targetVisual,SWITCH_RETURN_MS+SWITCH_STAGGER_MS);

  const outbound=orbit&&featureTarget
   ?flyGhost(newGhost,featureTarget,orbit,{duration:SWITCH_OUT_MS})
   :Promise.resolve();

  const inbound=(async()=>{
   await wait(SWITCH_STAGGER_MS);
   if(orbit&&oldTarget)await flyGhost(oldGhost,oldTarget,orbit,{reverse:true,duration:SWITCH_RETURN_MS,alternate:true});
  })();

  await Promise.all([outbound,inbound]);

  selectedRef.current=tool.name;
  departingRef.current=null;
  setSelected(tool.name);
  setDeparting(null);
  hiddenOrbitRef.current.delete(oldName);
  hiddenOrbitRef.current.delete(tool.name);
  setSwitching(false);
  await nextPaint();
  removeGhost(newGhost);
  removeGhost(oldGhost);
  busy.current=false;
 };

 const selectTool=async(tool,index)=>{
  if(busy.current||selectedRef.current===tool.name)return;
  if(selectedRef.current){
   await switchTool(tool,index);
   return;
  }
  await firstSelect(tool,index);
 };

 const reset=async()=>{
  if(busy.current||!selectedRef.current)return;
  busy.current=true;
  const name=selectedRef.current;
  const index=tools.findIndex(tool=>tool.name===name);

  if(reduced()){
   orbitOrderRef.current=[...toolNames];
   hiddenOrbitRef.current.clear();
   selectedRef.current=null;
   returningRef.current=false;
   setSelected(null);
   setReturning(false);
   busy.current=false;
   return;
  }

  const source=featureIconRef.current?.querySelector('img');
  const ghost=trackGhost(createGhost(source));
  if(!ghost){
   orbitOrderRef.current=[...toolNames];
   hiddenOrbitRef.current.clear();
   selectedRef.current=null;
   setSelected(null);
   busy.current=false;
   return;
  }

  orbitOrderRef.current=[...toolNames];
  hiddenOrbitRef.current.add(name);
  baseAngles.current[index]=slotAngle(index,tools.length);
  returningRef.current=true;
  setReturning(true);

  await wait(RETURN_PREP_MS);

  const orbit=orbitRef.current?.getBoundingClientRect();
  const targetImage=buttons.current[index]?.querySelector('.design-tool-orbit-icon img');
  const targetVisual=targetImage?.getBoundingClientRect();
  const targetRect=targetRectForSlot(index,tools.length,targetVisual,RETURN_MS);

  if(orbit&&targetRect)await flyGhost(ghost,targetRect,orbit,{reverse:true,duration:RETURN_MS});

  selectedRef.current=null;
  returningRef.current=false;
  setSelected(null);
  setReturning(false);
  hiddenOrbitRef.current.delete(name);
  await nextPaint();
  removeGhost(ghost);
  busy.current=false;
 };

 const current=tools.find(tool=>tool.name===selected);
 const panelActive=Boolean(selected||departing||returning);

 return <section id="design-tools" className="design-tools" aria-label="Design tools" onKeyDown={event=>{if(event.key==='Escape'&&selected&&!busy.current){event.preventDefault();reset()}}}>
  <div className="design-tools-stage">
   <div className="design-tools-layout">
    <div className={'design-tools-information'+(panelActive?' has-tool-space':'')+(returning?' is-returning':'')+(switching?' is-switching':'')} ref={infoRef} aria-live="polite">
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
      tabIndex={selected===tool.name||departing===tool.name?-1:0}
      onClick={()=>selectTool(tool,index)}>
      <span className="design-tool-orbit-icon"><ToolIcon tool={tool}/></span>
      <span className="design-tool-orbit-label">{tool.name}</span>
     </button>)}
    </div>
   </div>
  </div>
 </section>;
}
