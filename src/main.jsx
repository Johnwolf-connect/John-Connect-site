import React, {useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';

const work=[
 ['Watson Home','Residential identity','watson-home.png'],
 ['Snackablez','Food & lifestyle','snackablez.png'],
 ['Hasty Movers','Moving & logistics','hasty-movers.png'],
 ['Coffeeology','Coffee culture','coffeeology.png'],
 ['Victor Valor','Emblem design','victor-valor.png'],
 ['Crane Chow','Artisan Asian cuisine','crane-chow.png'],
 ['The Union Church','Community identity','union-church.png'],
 ['NURUSH','Wellness & nutrition','nurush.png'],
 ['InKzilla','Creative identity','inkzilla.png'],
 ['HopLock','Rabbit locksmith','hoplock.png'],
 ['Elite Dominion','Premium identity','elite-dominion.png'],
 ['Vyra Studios','Creative studio','vyra-studios.png']
];
function Logo({item}){const [failed,setFailed]=useState(false);return <div className="logo-space">{!failed?<img src={'/logos/'+item[2]} alt={item[0]+' logo'} onError={()=>setFailed(true)}/>:<span className="logo-fallback">{item[0]}</span>}</div>}
function App(){
 const [active,setActive]=useState(null);
 const [pointer,setPointer]=useState({x:0,y:0});
 const frame=useRef(null);
 useEffect(()=>{const key=e=>{if(e.key==='Escape')setActive(null)};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[]);
 useEffect(()=>{document.body.style.overflow=active?'hidden':'';return()=>{document.body.style.overflow=''}},[active]);
 const move=e=>{if(window.matchMedia('(pointer:fine)').matches){cancelAnimationFrame(frame.current);frame.current=requestAnimationFrame(()=>setPointer({x:(e.clientX/window.innerWidth-.5)*12,y:(e.clientY/window.innerHeight-.5)*12}))}};
 return <div onMouseMove={move}>
  <header className="site-header"><a className="brand" href="#top">JOHN<span>WOLF</span><b>.</b></a><nav><a href="#work">Work</a><a href="#about">About</a><a href="mailto:hello@example.com" onClick={e=>e.preventDefault()} title="Contact address coming soon">Contact</a></nav></header>
  <main id="top">
   <section className="hero"><p className="eyebrow">INDEPENDENT DESIGNER / VISUAL COMMUNICATION</p><h1>Ideas made<br/><em>impossible</em><br/>to ignore<span className="dot">.</span></h1><div className="hero-bottom"><p>Identity. Digital. Experience.<br/>Built with intention.</p><a href="#work" className="text-link">Explore selected work <span>↘</span></a></div><span className="hero-orbit" aria-hidden="true"></span></section>
   <section id="work" className="work-section"><div className="section-heading"><span>01 / SELECTED IDENTITIES</span><h2>Every mark<br/>has a meaning<span className="dot">.</span></h2><p>Twelve identities. Different voices. One commitment to clarity.</p></div>
    <div className="gallery">{work.map((item,i)=><button className={'logo-tile tile-'+i} key={item[0]} onClick={()=>setActive(item)} style={{'--mx':pointer.x*(i%3===0?1:-.65)+'px','--my':pointer.y*(i%2===0?1:-.7)+'px'}}><div className="tile-inner"><Logo item={item}/><div className="tile-meta"><span>{String(i+1).padStart(2,'0')} / {item[0]}</span><span className="tile-arrow">↗</span></div></div></button>)}</div>
   </section>
   <section className="feature" id="feature"><div className="feature-copy"><span className="eyebrow">02 / FEATURED BRAND SYSTEM</span><h2>RICHES<br/>COSMETICS<span className="dot">.</span></h2><p className="feature-statement">Confidence is not an attitude.<br/>It is a discipline.</p><p>A study in restraint, consistency, and visual authority. Explore the identity thinking behind the brand.</p><button className="outline-button" onClick={()=>setActive('riches')}>Explore brand direction ↗</button></div><div className="feature-art" aria-hidden="true"><span>R</span><small>IDENTITY / EDITORIAL / SYSTEM</small></div></section>
   <section id="about" className="about"><span className="eyebrow">03 / ABOUT</span><h2>Design is how<br/>I make ideas <em>felt.</em></h2><p>I'm John Wolf, a designer working across visual identities, websites, and experiences. I believe strong design says more with less.</p></section>
  </main>
  <footer className="site-footer"><span>JOHN WOLF © {new Date().getFullYear()}</span><a href="#top">Back to top ↑</a></footer>
  {active&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setActive(null)}}><section className="modal" role="dialog" aria-modal="true" aria-label={active==='riches'?'Riches Cosmetics':active[0]}><button className="close" onClick={()=>setActive(null)} aria-label="Close">×</button>{active==='riches'?<><span className="eyebrow">FEATURED IDENTITY</span><h2>RICHES COSMETICS</h2><p className="feature-statement">Confidence is not an attitude. It is a discipline.</p><p>Brand identity explored through logo construction, spacing, typography, and editorial direction. Original guideline imagery will be added here when available.</p></>:<><span className="eyebrow">SELECTED IDENTITY</span><h2>{active[0]}</h2><div className="modal-logo"><Logo item={active}/></div><p>{active[1]} — selected logo work by John Wolf.</p></>}</section></div>}
 </div>
}
createRoot(document.getElementById('root')).render(<App/>);
