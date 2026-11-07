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
 const orbitRef=useRef(null);
 const phase=useRef(0);
 const raf=useRef(0);
 const last=useRef(0);
 const running=useRef(false);
 const buttons=useRef([]);
 const infoRef=useRef(null);
 const flightRef=useRef(null);
 const busyRef=useRef(false);
 const [departing,setDeparting]=useState(null);
 const selectTool=async(tool,i)=>{
  if(busyRef.current||selected===tool.name)return;
  const source=buttons.current[i]?.querySelector('.design-tool-orbit-icon img');
  const host=orbitRef.current;
  if(!source||!host||window.matchMedia('(prefers-reduced-motion: reduce)').matches){setSelected(tool.name);return;}
  busyRef.current=true;stop();setDeparting(tool.name);
  const from=source.getBoundingClientRect(),orbit=host.getBoundingClientRect(),info=infoRef.current.getBoundingClientRect();
  const size=Math.max(from.width,from.height,38),startX=from.left+from.width/2,startY=from.top+from.height/2;
  const endX=info.left+Math.min(82,info.width*.3),endY=Math.min(info.bottom+100,window.innerHeight-130);
  const cx=orbit.left+orbit.width/2,cy=orbit.top+orbit.height/2;
  const dx=startX-cx,dy=startY-cy,len=Math.hypot(dx,dy)||1;
  const outsideX=startX+dx/len*110,outsideY=startY+dy/len*110;
  const corridorY=Math.max(88,orbit.top-72);
  const ghost=source.cloneNode(true);flightRef.current=ghost;
  Object.assign(ghost.style,{position:'fixed',left:'0px',top:'0px',width:size+'px',height:size+'px',objectFit:'contain',zIndex:'99999',pointerEvents:'none',transformOrigin:'center center',filter:'drop-shadow(0 9px 16px rgba(91,42,146,.25))'});
  document.body.appendChild(ghost);
  const points=[[startX,startY,1],[outsideX,outsideY,1.4],[outsideX,corridorY,1.6],[endX,corridorY,2],[endX,endY,2.4]];
  const frames=[];
  const ease=t=>t*t*(3-2*t);
  for(let k=0;k<=80;k++){
   const u=k/80,segment=Math.min(3,Math.floor(u*4)),t=ease(u*4-segment);
   const a=points[segment],b=points[segment+1];
   const x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,scale=a[2]+(b[2]-a[2])*t;
   frames.push({offset:u,transform:'translate3d('+(x-size/2)+'px,'+(y-size/2)+'px,0) scale('+scale+')'});
  }
  try{await ghost.animate(frames,{duration:1150,easing:'linear',fill:'forwards'}).finished;}catch(e){}
  ghost.remove();flightRef.current=null;setSelected(tool.name);setDeparting(null);busyRef.current=false;
 };
 useEffect(()=>()=>{flightRef.current?.remove();},[]);
 const paint=()=>{buttons.current.forEach((node,i)=>{if(!node)return;const a=-Math.PI/2-i*2*Math.PI/tools.length+phase.current;node.style.left=(50+40*Math.cos(a))+'%';node.style.top=(50+40*Math.sin(a))+'%';});};
 const tick=(time)=>{if(!running.current)return;if(last.current)phase.current+=(Math.min(64,time-last.current)/1000)*.32;last.current=time;paint();raf.current=requestAnimationFrame(tick);};
 const start=()=>{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches||running.current)return;running.current=true;last.current=0;raf.current=requestAnimationFrame(tick);};
 const stop=()=>{running.current=false;cancelAnimationFrame(raf.current);last.current=0;};
 useEffect(()=>()=>{running.current=false;cancelAnimationFrame(raf.current);},[]);
 const current=tools.find(tool=>tool.name===selected);
 return <section id="design-tools" className="design-tools" aria-label="Design tools">
  <div className="design-tools-stage">
   <div className="design-tools-layout">
    <div className="design-tools-information" ref={infoRef}>
     <span className="design-tools-eyebrow">TOOLS / CREATIVE PRACTICE</span>
     <h2 id="design-tools-heading">{current?current.name:'Design Tools'}</h2>
     {current&&<div className="design-tool-feature-icon is-visible"><ToolIcon tool={current}/></div>}
     <p>{current?current.detail:intro}</p>
     {current&&<button className="design-tools-reset" type="button" onClick={()=>setSelected(null)}>Back to all tools</button>}
    </div>
    <div className="design-tools-orbit" ref={orbitRef} onPointerEnter={start} onPointerLeave={stop} onFocus={start} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))stop();}} aria-label="Select a design tool">
     <span className="design-tools-center" aria-hidden="true">{current?'Design Tools':'Select a tool'}</span>
     {tools.map((tool,i)=>{
      const a=-Math.PI/2-i*2*Math.PI/tools.length;
      return <button key={tool.name} ref={node=>{buttons.current[i]=node;}} className={"design-tool-orbit-item"+(selected===tool.name||departing===tool.name?" is-selected":"")} style={{left:(50+40*Math.cos(a))+'%',top:(50+40*Math.sin(a))+'%',transform:'translate(-50%,-50%)',opacity:selected===tool.name||departing===tool.name?0:1,pointerEvents:selected===tool.name||departing===tool.name?'none':'auto'}} type="button" aria-label={'Explore '+tool.name} aria-pressed={selected===tool.name} onClick={()=>selectTool(tool,i)}>
       <span className="design-tool-orbit-icon"><ToolIcon tool={tool}/></span>
       <span className="design-tool-orbit-label">{tool.name}</span>
      </button>
     })}
    </div>
   </div>
  </div>
 </section>;
}
