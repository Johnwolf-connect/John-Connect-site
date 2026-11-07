import React,{useState} from 'react';
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
 const current=tools.find(tool=>tool.name===selected);
 return <section id="design-tools" className="design-tools" aria-label="Design tools">
  <div className="design-tools-stage">
   <div className="design-tools-layout">
    <div className="design-tools-information">
     <span className="design-tools-eyebrow">TOOLS / CREATIVE PRACTICE</span>
     <h2 id="design-tools-heading">{current?current.name:'Design Tools'}</h2>
     {current&&<div className="design-tool-feature-icon is-visible"><ToolIcon tool={current}/></div>}
     <p>{current?current.detail:intro}</p>
     {current&&<button className="design-tools-reset" type="button" onClick={()=>setSelected(null)}>Back to all tools</button>}
    </div>
    <div className="design-tools-orbit" aria-label="Select a design tool">
     <span className="design-tools-center" aria-hidden="true">{current?'Design Tools':'Select a tool'}</span>
     {tools.map((tool,i)=>{
      const a=-Math.PI/2-i*2*Math.PI/tools.length;
      return <button key={tool.name} className="design-tool-orbit-item" style={{left:(50+40*Math.cos(a))+'%',top:(50+40*Math.sin(a))+'%',transform:'translate(-50%,-50%)',opacity:1,pointerEvents:'auto'}} type="button" aria-label={'Explore '+tool.name} aria-pressed={selected===tool.name} onClick={()=>setSelected(tool.name)}>
       <span className="design-tool-orbit-icon"><ToolIcon tool={tool}/></span>
       <span className="design-tool-orbit-label">{tool.name}</span>
      </button>
     })}
    </div>
   </div>
  </div>
 </section>;
}
