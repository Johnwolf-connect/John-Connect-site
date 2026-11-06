import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';
import DesignTools from './DesignTools.jsx';
import BrandGallery from './BrandGallery.jsx';
import VisualContinuity from './VisualContinuity.jsx';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
// A full-width, scroll-driven sheet. Polygon points stay within the viewport,
// avoiding SVG objectBoundingBox clipping artifacts on Safari and Chromium.
function sheetClip(progress){
 const p=Math.max(0,Math.min(1,progress));
 if(p>=.34)return 'inset(0)';
 const phase=p/.34;
 const edge=100*(1-phase);
 const arch=Math.sin(Math.PI*phase)*64;
 const points=[];
 for(let i=0;i<=40;i++){
  const x=i/40;
  const dome=1-Math.pow(2*x-1,2);
  const y=Math.max(0,Math.min(100,edge-arch*dome));
  points.push(`${(x*100).toFixed(2)}% ${y.toFixed(3)}%`);
 }
 points.push('100% 100%','0% 100%');
 return `polygon(${points.join(',')})`;
}
function openDesignTools(event){
 if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 const transition=ScrollTrigger.getById('design-tools-reveal');
 if(!transition)return;
 event.preventDefault();
 window.scrollTo({top:transition.start+(transition.end-transition.start)*.65,behavior:'smooth'});
}

function CurvedSwipe(){
 const marker=useRef(null);
 useEffect(()=>{
  const hero=marker.current?.closest('.hero');
  const sheet=hero?.querySelector('.design-tools');
  if(!hero||!sheet||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const ctx=gsap.context(()=>{
   const render=scrollProgress=>{
    const progress=scrollProgress<.45
     ? scrollProgress/.45*.62
     : scrollProgress<.85
      ? .62+(scrollProgress-.45)/.40*.16
      : .78+(scrollProgress-.85)/.15*.22;
    hero.style.setProperty('--tools-progress',String(progress));
    sheet.style.clipPath=sheetClip(progress);
   };
   render(0);
   ScrollTrigger.create({
    id:'design-tools-reveal',trigger:hero,start:'top top',end:'+=260%',pin:true,pinSpacing:true,
    scrub:true,anticipatePin:1,invalidateOnRefresh:true,
    onUpdate:self=>render(self.progress),
    onRefresh:self=>render(self.progress)
   });
  },hero);
  return()=>{ctx.revert();sheet.style.removeProperty('clip-path');hero.style.removeProperty('--tools-progress')};
 },[]);
 return <span ref={marker} aria-hidden="true" style={{display:'none'}}/>;
}

const projects=[
 ['Lander','Home grown nursery','lander'],['MotivX','Brand identity','motivx'],
 ['Hasty Movers','Moving & logistics','hasty-movers'],['Coffeeology','Coffee culture','coffeeology'],
 ['Victor Valor','Emblem design','victor-valor'],['Crane Chow','Artisan Asian cuisine','crane-chow'],
 ['The Union Church','Community identity','union-church'],['NURUSH','Wellness & nutrition','nurush'],
 ['InKzilla','Creative identity','inkzilla'],['HopLock','Locksmith identity','hoplock'],
 ['Elite Dominion','Premium identity','elite-dominion'],['Vyra Studios','Creative studio','vyra-studios']
];
function Mark({project}){return <img src={'/logos/'+project[2]+'.webp'} alt={project[0]+' logo'} loading="lazy"/>;}


function ScrollGallery({projects,onSelect}){
 const galleryRef=useRef(null);
 const [progress,setProgress]=useState(0);
 const [reduced,setReduced]=useState(false);
 useEffect(()=>{
  const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
  const sync=()=>setReduced(mq.matches);sync();mq.addEventListener?.('change',sync);
  return()=>mq.removeEventListener?.('change',sync);
 },[]);
 useEffect(()=>{
  let frame=0;
  const update=()=>{
   frame=0;
   if(!galleryRef.current)return;
   const rect=galleryRef.current.getBoundingClientRect();
   const travel=Math.max(1,rect.height-window.innerHeight);
   setProgress(Math.max(0,Math.min(projects.length-1,(-rect.top/travel)*(projects.length-1))));
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)};
  update();window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
  return()=>{window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);cancelAnimationFrame(frame)};
 },[projects]);
 const current=Math.max(0,Math.min(projects.length-1,Math.round(progress)));
 return <section id="work" className="scroll-gallery" ref={galleryRef} aria-label="Scroll through selected logo projects">
  <div className="scroll-gallery-sticky">
   <aside className="project-info" aria-live="off">
    <h2 className="logo-creations-title"><strong>Logo</strong> Creations.</h2>
    <span className="kicker">LOGO SPOTLIGHT / {String(current+1).padStart(2,'0')} — {String(projects.length).padStart(2,'0')}</span>
    <div className="project-info-morph">
     {projects.map((project,i)=>{
      const delta=i-progress,distance=Math.abs(delta);
      const t=Math.max(0,Math.min(1,(distance-.2)/.6));
      const blend=1-t*t*(3-2*t);
      const opacity=reduced?(i===current?1:0):blend;
      return <div key={project[2]} className="project-info-body project-info-layer" aria-hidden={i!==current}
       style={{opacity,visibility:opacity>0?'visible':'hidden',transform:reduced?'none':`translateY(${delta*14}px) scale(${1+(1-blend)*.055},${1-(1-blend)*.075}) skewY(${delta*.7}deg)`,filter:reduced?'none':`blur(${(1-blend)*3}px)`}}>
       <h3>{project[0]}</h3>
       <p>{project[1]} — original identity design by John Wolf.</p>
      </div>;
     })}
    </div>
    <button className="project-detail" onClick={()=>onSelect(projects[current])}>View project details ↗</button>
    <div className="project-progress" aria-hidden="true"><span style={{width:((progress+1)/projects.length*100)+'%'}}/></div>
   </aside>
   <div className="logo-stage">
    {projects.map((project,i)=>{
     const delta=i-progress;
     const distance=Math.abs(delta);
     const scale=reduced?(i===current?1:0.2):Math.max(.12,1-.80*Math.min(1,distance));
     const y=reduced?(i-current)*130:Math.sign(delta)*(Math.min(1,distance)*22+Math.max(0,distance-1)*11);
     const opacity=reduced?(i===current?1:0):Math.max(0,(distance<1?1-distance*.68:.32)*Math.min(1,Math.max(0,3.5-distance)));
     return <button key={project[2]} type="button" className="stage-logo" onClick={()=>onSelect(project)} aria-label={'View '+project[0]} tabIndex={i===current?0:-1} style={{transform:`translate3d(-50%,calc(-50% + ${y}vh),0) scale(${scale})`,opacity,zIndex:100-Math.round(distance*10),pointerEvents:distance<.5?'auto':'none'}}>
      <Mark project={project}/>
     </button>;
    })}
   </div>
  </div>
 </section>;
}



function PurpleCursor(){
 useEffect(()=>{
  const html=document.documentElement;
  const point=event=>html.classList.toggle('purple-native-cursor',event.pointerType==='mouse');
  document.addEventListener('pointerover',point,{passive:true});
  return()=>{
   html.classList.remove('purple-native-cursor');
   document.removeEventListener('pointerover',point);
  };
 },[]);
 return null;
}
const contactServices = [
 ['Logo design', 'A distinctive mark for a new business or a brand ready for a refresh, with versions that work across print and digital.'],
 ['Brand identity', 'A visual system that brings your logo, color, typography, and imagery together, with guidelines your team can use.'],
 ['Websites', 'A responsive website that presents your work or business clearly and makes it easy for visitors to take the next step.'],
];

function Contact(){
 const [status,setStatus]=useState(''),[sending,setSending]=useState(false);
 const endpoint=import.meta.env.VITE_CONTACT_ENDPOINT?.trim();
 const email=import.meta.env.VITE_CONTACT_EMAIL?.trim() || 'johnwolf.connect@gmail.com';
 const canContact=Boolean(endpoint||email);
 const submit=async event=>{
  event.preventDefault();
  const form=event.currentTarget;
  if(sending||!canContact)return;
  const inquiry=Object.fromEntries(new FormData(form));
  if(!endpoint){
   const subject=encodeURIComponent(`Project inquiry — ${inquiry.projectType}`);
   const body=encodeURIComponent(`Name: ${inquiry.name}\r\nEmail: ${inquiry.email}\r\n\r\n${inquiry.message}`);
   window.location.href=`mailto:${email}?subject=${subject}&body=${body}`;
   setStatus('Finish sending your inquiry in your email app.');
   return;
  }
  setSending(true);setStatus('');
  try{
   const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(inquiry)});
   if(!response.ok)throw new Error('Delivery failed');
   setStatus('Thank you. Your inquiry has been submitted.');form.reset();
  }catch{setStatus('Your inquiry could not be sent. Your details are still here so you can try again.')}
  finally{setSending(false)}
 };
 return <section id="contact" className="contact-section" aria-labelledby="contact-heading">
  <div className="contact-copy"><span className="kicker">LET’S WORK TOGETHER</span><h2 id="contact-heading">An idea worth<br/><i>bringing to life.</i></h2><p>Tell me what you’re building, what you need, and when you’d like to launch.</p>
   <div className="contact-explore" aria-label="Explore ways to work together">
    {contactServices.map(([label,description])=><details key={label} className="contact-explore-option"><summary>{label}<span aria-hidden="true">+</span></summary><div className="contact-explore-reveal"><p>{description}</p></div></details>)}
   </div>
  </div>
  <form className="contact-form" onSubmit={submit} aria-busy={sending}>
   <div className="contact-field-pair">
    <label>Name<input name="name" autoComplete="name" required maxLength={120} placeholder="Your name"/></label>
    <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com"/></label>
   </div>
   <label>What do you have in mind?<select name="projectType" defaultValue="" required><option value="" disabled>Select a project type</option><option>Logo design</option><option>Brand identity</option><option>Website design</option><option>Something else</option></select></label>
   <label>Project details<textarea name="message" rows={5} required maxLength={6000} placeholder="A little about your project, goals, and timing."/></label>
   <button className="contact-submit" type="submit" disabled={sending||!canContact}>{sending?'Sending…':endpoint||!email?'Send inquiry':'Open email draft'} <span aria-hidden="true">↗</span></button>
   <p className="contact-status" role="status">{canContact?status:'Project inquiries will open once a contact address is available.'}</p>
  </form>
 </section>;
}

function App(){
 const [active,setActive]=useState(null);


 useEffect(()=>{const onKey=e=>{if(e.key==='Escape')setActive(null)};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[]);
 useEffect(()=>{document.body.style.overflow=active?'hidden':'';return()=>document.body.style.overflow=''},[active]);
 return <div>
  <VisualContinuity/>
  <PurpleCursor/>
  <header className="header"><a href="#top" className="wordmark">JOHN<span>WOLF</span><b>.</b></a><nav aria-label="Main navigation"><a href="#work">Work</a><a href="#design-tools" onClick={openDesignTools}>Design Tools</a><a href="#riches">Brand identity</a><a href="#about">About</a><a href="#contact">Contact</a></nav></header>
  <main id="top">
   <section className="hero hero-reference">
    <div className="hero-copy">
     <div className="hero-lockup">
      <h1><span>JOHN</span><span>WOLF</span></h1>
      <div className="hero-services" aria-label="Creative disciplines"><span>VISUAL DESIGN</span><span>BRAND DEVELOPMENT</span><span>WEB DESIGN</span></div>
     </div>
     <p className="hero-description">I build visual identities and digital experiences that make ideas impossible to overlook.</p>
     <a className="hero-cta" href="#work">VIEW PORTFOLIO <span aria-hidden="true">↗</span></a>
    </div>
    <div className="hero-visual" aria-label="Portrait area">
     <div className="hero-purple-shape" aria-hidden="true"/>
     <img className="hero-portrait" src="/john-wolf-portrait.webp" alt="Portrait of John Wolf" onError={e=>{e.currentTarget.style.display='none';e.currentTarget.parentElement.classList.add('portrait-missing')}}/>
     <div className="portrait-placeholder" aria-hidden="true"><span>JW<span className="purple">.</span></span></div>
    </div>
    <a className="hero-scroll" href="#work">SCROLL <span aria-hidden="true">↓</span></a>
    <CurvedSwipe/>
    <DesignTools/>
   </section>
   <ScrollGallery projects={projects} onSelect={setActive}/>
   <BrandGallery/>
   <section id="about" className="about"><span className="kicker">CREATIVE PRACTICE</span><h2>Design is how<br/>I make ideas <i>felt.</i></h2><p>I'm John Wolf. My work connects logo design, brand identity, and digital experiences through clarity and purpose.</p><a href="#contact" className="contact-note">Let’s work together ↗</a></section>
   <Contact/>
  </main>
  <footer><span>JOHN WOLF © {new Date().getFullYear()}</span><a href="#top">Back to top ↑</a></footer>
  {active&&<div className="backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setActive(null)}}><section className="dialog" role="dialog" aria-modal="true" aria-label={active==='riches'?'Riches Cosmetics':active[0]}><button className="close" onClick={()=>setActive(null)} aria-label="Close details">×</button>{active==='riches'?<><span className="kicker">FEATURED CASE STUDY</span><h2>RICHES COSMETICS</h2><blockquote>“Confidence is not an attitude. It is a discipline.”</blockquote><p>From logo and brand personality to a 27-page identity guideline: a visual doctrine built on clarity, restraint, and consistency.</p><p className="muted">Original guideline pages and editorial artwork will be added to this detailed view.</p></>:<><span className="kicker">LOGO DESIGN / SELECTED WORK</span><h2>{active[0]}</h2><div className="dialog-mark"><Mark project={active}/></div><p>{active[1]} — original identity design by John Wolf.</p></>}</section></div>}
 </div>;
}
createRoot(document.getElementById('root')).render(<App/>);

