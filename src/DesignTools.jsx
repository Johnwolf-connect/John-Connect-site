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
 const root=useRef(null),orbit=useRef(null),buttons=useRef({}),frame=useRef(0),chosen=useRef(null),reducedRef=useRef(false);
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
   // Each icon rides the same curved track before peeling into its slot.
   // Progress is entirely scroll-driven, so reversing scroll retraces the ride.
   const motion=reducedRef.current;
   const leave=motion?0:smooth(clamp((p-.78)/.20,0,1));
   const panel=(motion?1:smooth(clamp((p-.53)/.09,0,1)))*(1-leave);
   host.style.setProperty('--tool-panel-opacity',String(panel));
   const information=host.querySelector('.design-tools-information');
   if(information)information.style.transform=`translateY(${(1-panel)*18}px)`;
   const prompt=host.querySelector('.design-tools-center');
   if(prompt)prompt.style.opacity=String((motion?1:smooth(clamp((p-.56)/.06,0,1)))*(1-leave));
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
   const origin=-field.getBoundingClientRect().left-80;
   const cubic=(a,b,c,d,t)=>{const u=1-t;return u*u*u*a+3*u*u*t*b+3*u*t*t*c+t*t*t*d};
   keys.forEach((tool,i)=>{
    const node=buttons.current[tool.name];if(!node)return;
    const landing=firstLanding+i*interval;
    const ride=motion?1:clamp((p-(landing-flight))/flight,0,1);
    const entryX=width*.5-radius,entryY=height*.5;
    const a=Math.PI+clock(Math.max(p,landing))-clock(landing);
    // The last control point matches the circle's tangent and speed exactly.
    // All icons follow the same broad cross-page swoop, separated in time.
    const xTrack=cubic(origin,origin+(entryX-origin)*.42,entryX,entryX,ride);
    const yTrack=cubic(height*.82,-height*.55,entryY+radius*speed*flight/3,entryY,ride);
    const finalX=width*.5+Math.cos(a)*radius;
    const finalY=height*.5+Math.sin(a)*radius;
    const dock=ride;
    const departure=motion?0:smooth(clamp((p-.78-i*.003)/.18,0,1));
    const x=(ride<1?xTrack:finalX)+width*.78*departure;
    const y=(ride<1?yTrack:finalY)-height*.28*Math.sin(departure*Math.PI/2);
    const bank=(1-dock)*Math.sin(ride*Math.PI*2)*12-departure*10;
    const reveal=motion?1:smooth(clamp(ride/.16,0,1))*(1-smooth(clamp((departure-.45)/.55,0,1)));
    node.style.left=x+'px';node.style.top=y+'px';
    node.style.transform=`translate(-50%,-50%) rotate(${bank}deg) scale(${.82+.18*dock-.10*departure})`;
    node.style.opacity=String(reveal);
    const interactive=motion||(p>=.58&&p<.78);
    node.style.pointerEvents=interactive?'auto':'none';
    node.tabIndex=interactive?0:-1;
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
