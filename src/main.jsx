import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';
import {Canvas,useFrame} from '@react-three/fiber';
import {Float} from '@react-three/drei';

const projects=[
 ['Watson Home','Residential identity','watson-home'],['Snackablez','Food & lifestyle','snackablez'],
 ['Hasty Movers','Moving & logistics','hasty-movers'],['Coffeeology','Coffee culture','coffeeology'],
 ['Victor Valor','Emblem design','victor-valor'],['Crane Chow','Artisan Asian cuisine','crane-chow'],
 ['The Union Church','Community identity','union-church'],['NURUSH','Wellness & nutrition','nurush'],
 ['InKzilla','Creative identity','inkzilla'],['HopLock','Locksmith identity','hoplock'],
 ['Elite Dominion','Premium identity','elite-dominion'],['Vyra Studios','Creative studio','vyra-studios']
];
function Mark({project}){const [missing,setMissing]=useState(false);return missing?<span className="missing-mark">{project[0]}</span>:<img src={'/logos/'+project[2]+'.png'} alt={project[0]+' logo'} loading="lazy" onError={()=>setMissing(true)}/>;}

function Sculpture(){
 const group=useRef();
 const ring=useRef();
 useFrame(({clock,pointer})=>{
  if(!group.current)return;
  const scroll=typeof window==='undefined'?0:Math.min(window.scrollY/Math.max(window.innerHeight,1),2);
  const t=clock.getElapsedTime();
  group.current.rotation.y+=(pointer.x*.22+scroll*.55+ t*.065-group.current.rotation.y)*.035;
  group.current.rotation.x+=(pointer.y*-.16+scroll*.24-group.current.rotation.x)*.035;
  group.current.position.y+=(scroll*-.55-group.current.position.y)*.035;
  group.current.scale.setScalar(1+scroll*.1);
  if(ring.current)ring.current.rotation.z=t*.11;
 });
 return <group ref={group} rotation={[.22,.1,.35]}>
   <Float speed={1.15} rotationIntensity={.12} floatIntensity={.25}>
    <mesh>
     <icosahedronGeometry args={[1.5,3]}/>
     <meshPhysicalMaterial color="#eee9f5" metalness={.65} roughness={.18} clearcoat={.8} flatShading/>
    </mesh>
    <mesh scale={1.012}>
     <icosahedronGeometry args={[1.5,2]}/>
     <meshBasicMaterial color="#6d34c7" wireframe transparent opacity={.24}/>
    </mesh>
    <group ref={ring}>
     <mesh rotation={[1.12,.3,0]}>
      <torusGeometry args={[2.05,.024,8,160]}/>
      <meshStandardMaterial color="#763bd1" metalness={.65} roughness={.2}/>
     </mesh>
     <mesh rotation={[.2,1.05,.7]}>
      <torusGeometry args={[1.83,.013,8,160]}/>
      <meshStandardMaterial color="#b99cfa" metalness={.4} roughness={.3}/>
     </mesh>
    </group>
   </Float>
 </group>;
}
function HeroScene(){
 const [enabled,setEnabled]=useState(false);
 useEffect(()=>{
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  setEnabled(!reduced);
 },[]);
 if(!enabled)return <div className="hero-scene-fallback" aria-hidden="true"/>;
 return <div className="hero-scene" aria-hidden="true">
  <Canvas dpr={[1,1.5]} camera={{position:[0,0,7],fov:42}} gl={{alpha:true,antialias:true,powerPreference:'low-power'}} fallback={<div className="hero-scene-fallback"/>}>
   <ambientLight intensity={1.5}/>
   <directionalLight position={[3,4,5]} intensity={3.2} color="#ffffff"/>
   <pointLight position={[-4,-1,3]} intensity={14} color="#8e54ff" distance={12}/>
   <Sculpture/>
  </Canvas>
 </div>;
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
   <section className="hero"><span className="kicker">INDEPENDENT CREATIVE DESIGNER / VISUAL COMMUNICATION</span><h1>Make it<br/><i>mean</i> something<span className="purple">.</span></h1><div className="hero-foot"><p>Identity, digital design, and experiences<br/>built with intention.</p><a href="#work">Explore selected work <span aria-hidden="true">↘</span></a></div><HeroScene/></section>
   <section id="work" className="work-intro"><span className="kicker">01 / SELECTED LOGO DESIGN</span><h2>Twelve identities.<br/><i>Distinct voices.</i></h2><p>A curated collection of original marks. Select any identity to explore.</p></section>
   <div className="gallery" aria-label="Selected logo gallery">{[0,1,2,3].map((group)=><section key={group} className={'gallery-band '+(group%2?'dark':'light')} aria-label={'Logo collection '+(group+1)}><div className="gallery-grid">{projects.slice(group*3,group*3+3).map((project,j)=>{const i=group*3+j;return <button type="button" className={'logo-card card-'+j} key={project[2]} style={{'--dx':(pointer.x*(j===1?-.65:1))+'px','--dy':(pointer.y*(j===2?-.8:.65))+'px'}} onClick={()=>setActive(project)} aria-label={'View '+project[0]}><div className="mark"><Mark project={project}/></div><div className="card-label"><span>{String(i+1).padStart(2,'0')} / {project[0]}</span><span aria-hidden="true">↗</span></div></button>})}</div></section>)}</div>
   <section id="riches" className="riches"><div className="riches-text"><span className="kicker">02 / FEATURED BRAND IDENTITY</span><h2>RICHES<br/>COSMETICS<span className="purple">.</span></h2><blockquote>“Confidence is not an attitude.<br/>It is a discipline.”</blockquote><p>A brand built from philosophy into a complete visual system. The identity is grounded in clarity, restraint, and intentional design.</p><button className="explore" onClick={()=>setActive('riches')}>Explore the identity <span>↗</span></button></div><div className="riches-art" aria-hidden="true"><div className="riches-monogram">R</div><span>THE CODE / IDENTITY / VISUAL LANGUAGE</span></div></section>
   <section id="about" className="about"><span className="kicker">03 / CREATIVE PRACTICE</span><h2>Design is how<br/>I make ideas <i>felt.</i></h2><p>I'm John Wolf. My work connects logo design, brand identity, and digital experiences through clarity and purpose.</p><a href="mailto:" onClick={e=>e.preventDefault()} className="contact-note">Contact details coming soon</a></section>
  </main>
  <footer><span>JOHN WOLF © {new Date().getFullYear()}</span><a href="#top">Back to top ↑</a></footer>
  {active&&<div className="backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setActive(null)}}><section className="dialog" role="dialog" aria-modal="true" aria-label={active==='riches'?'Riches Cosmetics':active[0]}><button className="close" onClick={()=>setActive(null)} aria-label="Close details">×</button>{active==='riches'?<><span className="kicker">FEATURED CASE STUDY</span><h2>RICHES COSMETICS</h2><blockquote>“Confidence is not an attitude. It is a discipline.”</blockquote><p>From logo and brand personality to a 27-page identity guideline: a visual doctrine built on clarity, restraint, and consistency.</p><p className="muted">Original guideline pages and editorial artwork will be added to this detailed view.</p></>:<><span className="kicker">LOGO DESIGN / SELECTED WORK</span><h2>{active[0]}</h2><div className="dialog-mark"><Mark project={active}/></div><p>{active[1]} — original identity design by John Wolf.</p></>}</section></div>}
 </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
