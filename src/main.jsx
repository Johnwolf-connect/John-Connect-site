import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';
import DesignTools from './DesignTools.jsx';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {MorphSVGPlugin} from 'gsap/MorphSVGPlugin';
gsap.registerPlugin(ScrollTrigger,MorphSVGPlugin);
const WAVE_START='M 0 1050 C 280 1050 720 1050 1000 1050 L 1000 1100 L 0 1100 Z';
const WAVE_MIDDLE='M 0 660 C 280 280 720 860 1000 460 L 1000 1100 L 0 1100 Z';
const WAVE_END='M 0 -120 C 280 -120 720 -120 1000 -120 L 1000 1100 L 0 1100 Z';
function CurvedSwipe(){const path=useRef(null),wrapper=useRef(null);useEffect(()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const hero=wrapper.current?.closest('.hero');if(!hero||!path.current)return;const timeline=gsap.timeline({scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:true,invalidateOnRefresh:true}});timeline.to(path.current,{morphSVG:WAVE_MIDDLE,duration:.48,ease:'none'}).to(path.current,{morphSVG:WAVE_END,duration:.52,ease:'none'});return()=>{timeline.scrollTrigger?.kill();timeline.kill()}},[]);return <svg ref={wrapper} className="hero-curved-swipe" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"><path ref={path} d={WAVE_START} fill="#fff"/></svg>}


const projects=[
 ['Watson Home','Residential identity','watson-home'],['Snackablez','Food & lifestyle','snackablez'],
 ['Hasty Movers','Moving & logistics','hasty-movers'],['Coffeeology','Coffee culture','coffeeology'],
 ['Victor Valor','Emblem design','victor-valor'],['Crane Chow','Artisan Asian cuisine','crane-chow'],
 ['The Union Church','Community identity','union-church'],['NURUSH','Wellness & nutrition','nurush'],
 ['InKzilla','Creative identity','inkzilla'],['HopLock','Locksmith identity','hoplock'],
 ['Elite Dominion','Premium identity','elite-dominion'],['Vyra Studios','Creative studio','vyra-studios']
];
function Mark({project}){const [missing,setMissing]=useState(false);return missing?<span className="missing-mark">{project[0]}</span>:<img src={'/logos/'+project[2]+'.png'} alt={project[0]+' logo'} loading="lazy" onError={()=>setMissing(true)}/>;}


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
 return <section className="scroll-gallery" ref={galleryRef} aria-label="Scroll through selected logo projects">
  <div className="scroll-gallery-sticky">
   <aside className="project-info" aria-live="off">
    <span className="kicker">SELECTED WORK / {String(current+1).padStart(2,'0')} — {String(projects.length).padStart(2,'0')}</span>
    <div className="project-info-body" key={current}>
     <h3>{projects[current][0]}</h3>
     <p className="project-date">PROJECT DATE / TO BE ADDED</p>
     <p>{projects[current][1]} — original identity design by John Wolf.</p>
     <button className="project-detail" onClick={()=>onSelect(projects[current])}>View project details ↗</button>
    </div>
    <div className="project-progress" aria-hidden="true"><span style={{width:((current+1)/projects.length*100)+'%'}}/></div>
   </aside>
   <div className="logo-stage">
    {projects.map((project,i)=>{
     const delta=i-progress;
     const distance=Math.abs(delta);
     const scale=reduced?(i===current?1:0.2):Math.max(.12,1-.73*Math.min(1,distance));
     const y=reduced?(i-current)*130:delta*76;
     const opacity=reduced?(i===current?1:0):Math.max(0,1-distance*.8);
     return <button key={project[2]} type="button" className="stage-logo" onClick={()=>onSelect(project)} aria-label={'View '+project[0]} tabIndex={i===current?0:-1} style={{transform:`translate3d(-50%,calc(-50% + ${y}vh),0) scale(${scale})`,opacity,zIndex:100-Math.round(distance*10),pointerEvents:distance<.5?'auto':'none'}}>
      <Mark project={project}/>
     </button>;
    })}
    <div className="stage-index">{String(current+1).padStart(2,'0')} <span>/ {String(projects.length).padStart(2,'0')}</span></div>
   </div>
  </div>
 </section>;
}

function App(){
 const [active,setActive]=useState(null),[pointer,setPointer]=useState({x:0,y:0});
 const raf=useRef(0);
 useEffect(()=>{const onKey=e=>{if(e.key==='Escape')setActive(null)};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[]);
 useEffect(()=>{document.body.style.overflow=active?'hidden':'';return()=>document.body.style.overflow=''},[active]);
 const move=e=>{if(!window.matchMedia('(hover:hover) and (pointer:fine)').matches)return;cancelAnimationFrame(raf.current);raf.current=requestAnimationFrame(()=>setPointer({x:(e.clientX/window.innerWidth-.5)*16,y:(e.clientY/window.innerHeight-.5)*16}));};
 return <div onMouseMove={move}>
  <header className="header"><a href="#top" className="wordmark">JOHN<span>WOLF</span><b>.</b></a><nav aria-label="Main navigation"><a href="#work">Work</a><a href="#riches">Riches</a><a href="#about">About</a></nav></header>
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
     <img className="hero-portrait" src="/john-wolf-portrait.png" alt="Portrait of John Wolf" onError={e=>{e.currentTarget.style.display='none';e.currentTarget.parentElement.classList.add('portrait-missing')}}/>
     <div className="portrait-placeholder" aria-hidden="true"><span>JW<span className="purple">.</span></span></div>
    </div>
    <a className="hero-scroll" href="#work">SCROLL <span aria-hidden="true">↓</span></a>
    <CurvedSwipe/>
   </section>
   <DesignTools/>
   <section id="work" className="work-intro"><span className="kicker">01 / SELECTED LOGO DESIGN</span><h2>Twelve identities.<br/><i>Distinct voices.</i></h2><p>A curated collection of original marks. Select any identity to explore.</p></section>
   <ScrollGallery projects={projects} onSelect={setActive}/>
   <section id="riches" className="riches"><div className="riches-text"><span className="kicker">02 / FEATURED BRAND IDENTITY</span><h2>RICHES<br/>COSMETICS<span className="purple">.</span></h2><blockquote>“Confidence is not an attitude.<br/>It is a discipline.”</blockquote><p>A brand built from philosophy into a complete visual system. The identity is grounded in clarity, restraint, and intentional design.</p><button className="explore" onClick={()=>setActive('riches')}>Explore the identity <span>↗</span></button></div><div className="riches-art" aria-hidden="true"><div className="riches-monogram">R</div><span>THE CODE / IDENTITY / VISUAL LANGUAGE</span></div></section>
   <section id="about" className="about"><span className="kicker">03 / CREATIVE PRACTICE</span><h2>Design is how<br/>I make ideas <i>felt.</i></h2><p>I'm John Wolf. My work connects logo design, brand identity, and digital experiences through clarity and purpose.</p><a href="mailto:" onClick={e=>e.preventDefault()} className="contact-note">Contact details coming soon</a></section>
  </main>
  <footer><span>JOHN WOLF © {new Date().getFullYear()}</span><a href="#top">Back to top ↑</a></footer>
  {active&&<div className="backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setActive(null)}}><section className="dialog" role="dialog" aria-modal="true" aria-label={active==='riches'?'Riches Cosmetics':active[0]}><button className="close" onClick={()=>setActive(null)} aria-label="Close details">×</button>{active==='riches'?<><span className="kicker">FEATURED CASE STUDY</span><h2>RICHES COSMETICS</h2><blockquote>“Confidence is not an attitude. It is a discipline.”</blockquote><p>From logo and brand personality to a 27-page identity guideline: a visual doctrine built on clarity, restraint, and consistency.</p><p className="muted">Original guideline pages and editorial artwork will be added to this detailed view.</p></>:<><span className="kicker">LOGO DESIGN / SELECTED WORK</span><h2>{active[0]}</h2><div className="dialog-mark"><Mark project={active}/></div><p>{active[1]} — original identity design by John Wolf.</p></>}</section></div>}
 </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
