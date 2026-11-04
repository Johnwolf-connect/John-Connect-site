import React,{useEffect,useRef,useState} from 'react';
import './design-tools.css';

const tools=[
 ['Adobe Photoshop','photoshop','adobephotoshop'],['Adobe Illustrator','illustrator','adobeillustrator'],['Adobe After Effects','aftereffects','adobeaftereffects'],
 ['VS Code','vscode','visualstudiocode'],['GitHub','github','github'],['GSAP','gsap','greensock'],['Three.js','threejs','threedotjs'],['Canva','canva','canva'],['ChatGPT','chatgpt','openai'],['Claude','claude','anthropic'],
 ['Parcel','parcel','parcel'],['Procreate','procreate','procreate'],['Adobe Firefly','firefly','adobefirefly']
];
const positions=[[-23,-31],[0,-31],[23,-31],[-45,0],[-30,0],[-15,0],[0,0],[15,0],[30,0],[45,0],[-23,31],[0,31],[23,31]];
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export default function DesignTools(){
 const section=useRef(null),items=useRef([]),pointer=useRef({x:-9999,y:-9999}),motion=useRef([]),raf=useRef(0),[reduced,setReduced]=useState(false);
 useEffect(()=>{const mq=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(mq.matches);update();mq.addEventListener?.('change',update);return()=>mq.removeEventListener?.('change',update)},[]);
 useEffect(()=>{
  if(reduced)return;
  const run=()=>{
   const root=section.current;if(!root)return;
   const rect=root.getBoundingClientRect(),vh=innerHeight;
   // Keep the stage visible for a full scroll beat before beginning the exit.
   const travel=Math.max(1,rect.height-vh);
   const progress=clamp(-rect.top/travel,0,1);
   const entry=clamp(progress/.22,0,1);
   const exit=clamp((progress-.82)/.18,0,1);
   const leave=exit*exit*(3-2*exit);
   const stage=root.querySelector('.design-tools-stage').getBoundingClientRect();
   items.current.forEach((node,i)=>{
    if(!node)return;
    const p=positions[i],state=motion.current[i]||(motion.current[i]={x:0,y:0,vx:0,vy:0});
    const centerX=stage.left+stage.width*(.5+p[0]/100),centerY=stage.top+stage.height*(.53+p[1]/100);
    const dx=centerX-pointer.current.x,dy=centerY-pointer.current.y,dist=Math.hypot(dx,dy)||1;
    const force=clamp((155-dist)/155,0,1);const targetX=dx/dist*force*85,targetY=dy/dist*force*65;
    state.vx=(state.vx+(targetX-state.x)*.065)*.79;state.vy=(state.vy+(targetY-state.y)*.065)*.79;
    state.x+=state.vx;state.y+=state.vy;
    const stagger=i%4*.065,individual=clamp((entry-stagger)/(1-stagger),0,1),arrive=1-(1-individual)**3;
    const incoming=(-stage.width-140)*(1-arrive),arc=Math.sin(arrive*Math.PI)*(i%2?34:-34);
    const outgoing=(stage.width+200)*leave;
    node.style.transform=`translate3d(${incoming+outgoing+state.x}px,${arc+state.y}px,0)`;
    node.style.opacity=String(clamp(arrive*2,0,1)*(1-clamp((leave-.7)*3.33,0,1)));
   });
   raf.current=requestAnimationFrame(run);
  };
  raf.current=requestAnimationFrame(run);return()=>cancelAnimationFrame(raf.current);
 },[reduced]);
 return <section id="design-tools" ref={section} className="design-tools" aria-labelledby="design-tools-heading" onPointerMove={e=>{if(e.pointerType==='mouse')pointer.current={x:e.clientX,y:e.clientY}}} onPointerLeave={()=>{pointer.current={x:-9999,y:-9999}}}>
  <div className="design-tools-stage"><div className="design-tools-heading"><span className="kicker">TOOLS / CREATIVE PRACTICE</span><h2 id="design-tools-heading">Design Tools<span>.</span></h2></div>
  <div className="design-tools-field" aria-label="Creative software and development tools">
   {tools.map(([name,key,slug],i)=><div className="design-tool" key={key} ref={el=>items.current[i]=el} style={{'--x':positions[i][0]+'%','--y':positions[i][1]+'%'}} title={name}>
    <img src={`https://cdn.simpleicons.org/${slug}`} alt="" loading="lazy" onError={e=>{e.currentTarget.style.display='none';e.currentTarget.nextSibling.style.display='block'}}/>
    <span className="design-tool-fallback" style={{display:'none'}}>{name}</span><span className="design-tool-label">{name}</span>
   </div>)}
  </div></div>
 </section>;
}
