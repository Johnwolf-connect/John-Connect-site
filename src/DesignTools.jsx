import React,{useEffect,useRef,useState} from 'react';
import {gsap} from 'gsap';
import './design-tools.css';

const tools=[
 {name:'Adobe Photoshop',slug:'adobephotoshop',detail:'Image editing, compositing, retouching, and visual exploration.'},
 {name:'Adobe Illustrator',slug:'adobeillustrator',detail:'Precision vector artwork, logos, icons, and identity systems.'},
 {name:'Adobe After Effects',slug:'adobeaftereffects',detail:'Motion graphics, expressive typography, and cinematic animation.'},
 {name:'VS Code',slug:'visualstudiocode',detail:'Writing, refining, and organizing modern web experiences.'},
 {name:'GitHub',slug:'github',detail:'Version control, collaboration, and reliable project development.'},
 {name:'GSAP',slug:'greensock',detail:'Expressive interactions, scroll choreography, and polished motion.'},
 {name:'Three.js',slug:'threedotjs',detail:'Interactive 3D environments and immersive digital storytelling.'},
 {name:'Canva',slug:'canva',detail:'Fast visual concepts and flexible social design systems.'},
 {name:'ChatGPT',slug:'openai',detail:'Creative research, ideation, prototyping, and problem solving.'},
 {name:'Claude',slug:'anthropic',detail:'Research, writing exploration, and creative development.'},
 {name:'Parcel',slug:'parcel',detail:'Streamlined frontend builds and rapid development workflows.'},
 {name:'Procreate',slug:'procreate',detail:'Expressive digital illustration, sketching, and original artwork.'},
 {name:'Adobe Firefly',slug:'adobefirefly',detail:'Generative visual exploration and concept development.'}
];
const intro='Software applications used to conceptualize, plan, and create visual content. They help shape everything from visual identities to interactive websites and digital experiences.';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=v=>v*v*(3-2*v);
function ToolIcon({tool}){
 const [failed,setFailed]=useState(false);
 return failed?<span className="tool-icon-fallback">{tool.name.split(' ').map(s=>s[0]).join('').slice(0,3)}</span>:
 <img src={'https://cdn.simpleicons.org/'+tool.slug} alt="" draggable="false" onError={()=>setFailed(true)}/>;
}
export default function DesignTools(){
 const root=useRef(null),orbit=useRef(null),buttons=useRef({}),frame=useRef(0),angle=useRef(0),previous=useRef(0),chosen=useRef(null),reducedRef=useRef(false);
 const [selected,setSelected]=useState(null),[reduced,setReduced]=useState(false);
 chosen.current=selected;
 useEffect(()=>{
  const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
  const sync=()=>{setReduced(mq.matches);reducedRef.current=mq.matches};
  sync();mq.addEventListener?.('change',sync);
  return()=>mq.removeEventListener?.('change',sync);
 },[]);
 useEffect(()=>{
  const animate=time=>{
   const host=root.current,field=orbit.current;
   if(!host||!field)return;
   const hero=host.closest('.hero');
   const p=clamp(Number(hero?.style.getPropertyValue('--tools-progress')||0),0,1);
   const visible=reducedRef.current||p>.13;
   host.style.setProperty('--tool-panel-opacity',String(reducedRef.current?1:clamp((p-.24)/.10,0,1)));
   const dt=previous.current?Math.min(50,time-previous.current):16;
   previous.current=time;
   // Finish the entire entrance before the orbit begins to revolve.
   const orbitBlend=smooth(clamp((p-.60)/.08,0,1));
   if(!reducedRef.current&&p>.60&&p<.99)angle.current+=dt*.000085*orbitBlend;
   const keys=tools.filter(t=>t.name!==chosen.current);
   const width=field.clientWidth,height=field.clientHeight;
   const radius=Math.min(width,height)*.40;
   const bezier=(a,b,c,d,t)=>{const u=1-t;return u*u*u*a+3*u*u*t*b+3*u*t*t*c+t*t*t*d};
   keys.forEach((tool,i)=>{
    const node=buttons.current[tool.name];if(!node)return;
    const a=angle.current-Math.PI/2+i*2*Math.PI/keys.length;
    const x=width*.5+Math.cos(a)*radius;
    const y=height*.5+Math.sin(a)*radius;
    const index=tools.findIndex(t=>t.name===tool.name);
    // Distinct but coordinated flight paths avoid the diagonal queue and pileups.
    // The path has a sweeping S-shaped approach, then eases into each orbital slot.
    const stagger=index*.017;
    const enter=reducedRef.current?1:clamp((p-.17-stagger)/.20,0,1);
    const t=smooth(enter);
    const lane=(index%4-1.5);
    const sx=-width*.17,sy=height*(.66+lane*.085);
    const c1x=width*.16,c1y=height*(.10+lane*.085);
    const c2x=width*.82,c2y=height*(.86+lane*.035);
    // Interpolate a flowing S route into the final orbit position without snapping.
    const px=bezier(sx,c1x,c2x,x,t);
    const py=bezier(sy,c1y,c2y,y,t);
    node.style.left=px+'px';node.style.top=py+'px';
    node.style.transform=`translate(-50%,-50%) scale(${.78+.22*t})`;
    node.style.opacity=String(smooth(clamp(enter/.16,0,1)));
    node.style.pointerEvents=enter>.995?'auto':'none';
   });
   frame.current=requestAnimationFrame(animate);
  };
  frame.current=requestAnimationFrame(animate);
  return()=>cancelAnimationFrame(frame.current);
 },[]);
 const choose=tool=>{
  if(selected===tool.name)return;
  const source=buttons.current[tool.name];
  const destination=root.current?.querySelector('.design-tool-feature-icon');
  if(!source||!destination||reduced){setSelected(tool.name);return}
  const from=source.getBoundingClientRect();
  const to=destination.getBoundingClientRect();
  const ghost=source.cloneNode(true);
  ghost.removeAttribute('id');
  ghost.className='design-tool-travel';
  Object.assign(ghost.style,{position:'fixed',left:from.left+'px',top:from.top+'px',width:from.width+'px',height:from.height+'px',margin:'0',transform:'none',opacity:'1',pointerEvents:'none',zIndex:'9999'});
  document.body.appendChild(ghost);
  setSelected(tool.name);
  gsap.fromTo(ghost,{x:0,y:0,scale:1},{x:to.left-from.left,y:to.top-from.top,scale:1.75,duration:.72,ease:'power3.inOut',onComplete:()=>ghost.remove()});
 };
 const current=tools.find(t=>t.name===selected);
 return <section id="design-tools" ref={root} className="design-tools" aria-label="Interactive design tools">
  <div className="design-tools-stage">
   <div className="design-tools-layout">
    <div className="design-tools-information">
     <span className="design-tools-eyebrow">TOOLS / CREATIVE PRACTICE</span>
     <h2 id="design-tools-heading" key={selected||'intro'}>{current?current.name:'Design Tools'}</h2>
     <div className={'design-tool-feature-icon'+(current?' is-visible':'')} aria-hidden="true">{current&&<ToolIcon tool={current}/>}</div>
     <p key={'copy-'+(selected||'intro')}>{current?current.detail:intro}</p>
     {current&&<button className="design-tools-reset" type="button" onClick={()=>setSelected(null)}>Back to all tools <span aria-hidden="true">↗</span></button>}
    </div>
    <div className="design-tools-orbit" ref={orbit} aria-label="Select a design tool">
     <span className="design-tools-center" aria-hidden="true">{current?'Design Tools':'Select a tool'}</span>
     {tools.filter(t=>t.name!==selected).map(tool=><button key={tool.name} ref={el=>{if(el)buttons.current[tool.name]=el;else delete buttons.current[tool.name]}} className="design-tool-orbit-item" type="button" aria-label={'Explore '+tool.name} title={tool.name} onClick={()=>choose(tool)}>
      <span className="design-tool-orbit-icon"><ToolIcon tool={tool}/></span>
      <span className="design-tool-orbit-label">{tool.name}</span>
     </button>)}
    </div>
   </div>
  </div>
 </section>;
}
