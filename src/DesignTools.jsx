import React,{useEffect,useRef,useState} from 'react';
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
function ToolIcon({tool}){return <img src={'/tools/'+tool.slug+'.webp'} alt="" draggable="false"/>}
export default function DesignTools(){
 const [selected,setSelected]=useState(null);
 const [departing,setDeparting]=useState(null);
 const orbitRef=useRef(null),infoRef=useRef(null),featureRef=useRef(null);
 const buttons=useRef([]),phase=useRef(0),frame=useRef(0),last=useRef(0),angles=useRef([]);
 const pointer=useRef({inside:false,x:0,y:0}),busy=useRef(false),ghostRef=useRef(null);
 const selectedRef=useRef(null),departingRef=useRef(null);
 selectedRef.current=selected;departingRef.current=departing;
 const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const position=()=>{
  const host=orbitRef.current;if(!host)return;
  const rect=host.getBoundingClientRect(),count=tools.length-(selectedRef.current?1:0)-(departingRef.current&&!selectedRef.current?1:0);
  let slot=0,nearest=-1,minimum=Infinity;
  buttons.current.forEach((node,i)=>{
   if(!node)return;
   if(tools[i].name===selectedRef.current||tools[i].name===departingRef.current){node.style.opacity='0';node.style.pointerEvents='none';return;}
   const target=-Math.PI/2-2*Math.PI*slot++/count+phase.current;
   if(angles.current[i]===undefined)angles.current[i]=target;
   const delta=Math.atan2(Math.sin(target-angles.current[i]),Math.cos(target-angles.current[i]));
   angles.current[i]+=delta*.13;
   const a=angles.current[i];
   const x=50+40*Math.cos(a),y=50+40*Math.sin(a);
   node.style.left=x+'%';node.style.top=y+'%';node.style.opacity='1';node.style.pointerEvents='auto';
   if(pointer.current.inside){
    const px=rect.left+rect.width*x/100,py=rect.top+rect.height*y/100;
    const d=Math.hypot(px-pointer.current.x,py-pointer.current.y);
    if(d<minimum){minimum=d;nearest=i;}
   }
  });
  buttons.current.forEach((node,i)=>{
   if(!node)return;
   const active=i===nearest&&minimum<85&&!selectedRef.current&&!departingRef.current;
   node.classList.toggle('is-proximity',active);
  });
 };
 const animate=t=>{
  if(last.current&&!reduced())phase.current+=Math.min(48,t-last.current)/1000*.28;
  last.current=t;position();frame.current=requestAnimationFrame(animate);
 };
 useEffect(()=>{frame.current=requestAnimationFrame(animate);return()=>{cancelAnimationFrame(frame.current);ghostRef.current?.remove();};},[]);
 const flight=(tool,source,target,reverse=false)=>new Promise(resolve=>{
  if(reduced()||!source||!target){resolve();return;}
  const a=source.getBoundingClientRect(),b=target.getBoundingClientRect();
  const size=Math.max(40,a.width,a.height),sx=a.left+a.width/2,sy=a.top+a.height/2,ex=b.left+b.width/2,ey=b.top+b.height/2;
  const orbit=orbitRef.current.getBoundingClientRect();
  // Sweep outside the orbit on the upper side, avoiding the other orbit positions.
  const top=Math.max(78,orbit.top-85);
  const outX=Math.min(window.innerWidth-48,Math.max(orbit.left+orbit.width*.2,sx+(sx-(orbit.left+orbit.width/2))*.35));
  const p0=[sx,sy],p1=[outX,top],p2=[ex,top],p3=[ex,ey];
  const ghost=source.cloneNode(true);ghostRef.current=ghost;
  Object.assign(ghost.style,{position:'fixed',left:'0',top:'0',width:size+'px',height:size+'px',objectFit:'contain',zIndex:'99999',pointerEvents:'none',transformOrigin:'center',filter:'drop-shadow(0 10px 20px rgba(90,40,145,.24))'});
  document.body.appendChild(ghost);
  const frames=Array.from({length:91},(_,i)=>{
   const t=i/90,u=1-t;
   const x=u*u*u*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t*t*t*p3[0];
   const y=u*u*u*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t*t*t*p3[1];
   const scale=reverse?2.25-1.25*t:1+1.25*t;
   return {offset:t,transform:'translate3d('+(x-size/2)+'px,'+(y-size/2)+'px,0) scale('+scale+')'};
  });
  ghost.animate(frames,{duration:1100,easing:'cubic-bezier(.35,0,.15,1)',fill:'forwards'}).finished.catch(()=>{}).then(()=>{ghost.remove();ghostRef.current=null;resolve();});
 });
 const selectTool=async(tool,i)=>{
  if(busy.current||selectedRef.current)return;
  busy.current=true;
  const source=buttons.current[i]?.querySelector('img');
  setDeparting(tool.name);departingRef.current=tool.name;position();
  const target=infoRef.current?.querySelector('#design-tools-heading');
  await flight(tool,source,target);
  selectedRef.current=tool.name;departingRef.current=null;setSelected(tool.name);setDeparting(null);busy.current=false;position();
 };
 const reset=async()=>{
  if(busy.current||!selectedRef.current)return;
  busy.current=true;
  const name=selectedRef.current,idx=tools.findIndex(t=>t.name===name);
  const source=featureRef.current?.querySelector('img');
  // Establish the destination within the orbit while the remaining tools continue moving.
  const target=buttons.current[idx]?.querySelector('img');
  if(source&&target)await flight(tools[idx],source,target,true);
  selectedRef.current=null;setSelected(null);busy.current=false;position();
 };
 const current=tools.find(t=>t.name===selected);
 return <section id="design-tools" className="design-tools" aria-label="Design tools">
  <div className="design-tools-stage"><div className="design-tools-layout">
   <div className="design-tools-information" ref={infoRef}>
    <span className="design-tools-eyebrow">TOOLS / CREATIVE PRACTICE</span>
    <h2 id="design-tools-heading">{current?current.name:'Design Tools'}</h2>
    {current&&<div ref={featureRef} className="design-tool-feature-icon is-visible"><ToolIcon tool={current}/></div>}
    <p>{current?current.detail:intro}</p>
    {current&&<button className="design-tools-reset" type="button" onClick={reset}>Back to all tools</button>}
   </div>
   <div className="design-tools-orbit" ref={orbitRef} onPointerEnter={e=>{pointer.current.inside=true;pointer.current.x=e.clientX;pointer.current.y=e.clientY;}} onPointerMove={e=>{pointer.current.inside=true;pointer.current.x=e.clientX;pointer.current.y=e.clientY;}} onPointerLeave={()=>{pointer.current.inside=false;}} aria-label="Select a design tool">
    <span className="design-tools-center" aria-hidden="true">{current?'Design Tools':'Select a tool'}</span>
    {tools.map((tool,i)=>{const a=-Math.PI/2-i*2*Math.PI/tools.length;return <button key={tool.name} ref={node=>{buttons.current[i]=node;}} className={'design-tool-orbit-item'+(selected===tool.name||departing===tool.name?' is-selected':'')} style={{left:(50+40*Math.cos(a))+'%',top:(50+40*Math.sin(a))+'%',transform:'translate(-50%,-50%)',opacity:selected===tool.name||departing===tool.name?0:1,pointerEvents:selected===tool.name||departing===tool.name?'none':'auto'}} type="button" aria-label={'Explore '+tool.name} aria-pressed={selected===tool.name} onClick={()=>selectTool(tool,i)}><span className="design-tool-orbit-icon"><ToolIcon tool={tool}/></span><span className="design-tool-orbit-label">{tool.name}</span></button>;})}
   </div>
  </div></div>
 </section>;
}
