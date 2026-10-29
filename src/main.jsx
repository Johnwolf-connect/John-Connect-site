import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';

const expertise=['BRAND IDENTITY','ART DIRECTION','WEB EXPERIENCES','VISUAL COMMUNICATION'];
const work=[
 {number:'01',type:'IDENTITY / CREATIVE DIRECTION',title:'Riches',desc:'A study in confidence, restraint and deliberate visual identity.',theme:'riches',symbol:'R.'},
 {number:'02',type:'DIGITAL / INTERACTION',title:'Digital worlds',desc:'Experimental interfaces, spatial thinking and immersive web concepts.',theme:'worlds',symbol:'◉'},
 {number:'03',type:'BRANDING / DESIGN SYSTEMS',title:'Identity systems',desc:'Distinctive visual languages built to work across every touchpoint.',theme:'systems',symbol:'JW'}
];
function Arrow({diagonal=false}){return <span aria-hidden="true" className="arrow">{diagonal?'↗':'→'}</span>}
function App(){
 const [menu,setMenu]=useState(false);
 const [scroll,setScroll]=useState(0);
 const cursor=useRef(null);
 useEffect(()=>{
  const onScroll=()=>setScroll(window.scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight));
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in-view');observer.unobserve(e.target);}}),{threshold:.12,rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll('[data-reveal]').forEach(el=>observer.observe(el));
  return ()=>{window.removeEventListener('scroll',onScroll);observer.disconnect();};
 },[]);
 useEffect(()=>{
  const onMove=e=>{if(cursor.current){cursor.current.style.setProperty('--mx',e.clientX+'px');cursor.current.style.setProperty('--my',e.clientY+'px');}};
  window.addEventListener('pointermove',onMove,{passive:true});
  return ()=>window.removeEventListener('pointermove',onMove);
 },[]);
 const navigate=()=>setMenu(false);
 return <div className="site" ref={cursor}>
  <div className="reading-progress" style={{transform:`scaleX(${scroll})`}}/>
  <header className="site-header">
   <a className="wordmark" href="#home" onClick={navigate} aria-label="John Wolf, home">JOHN<span>WOLF</span><span className="wordmark-dot">.</span></a>
   <div className="header-right"><span className="availability"><span className="status-dot"/>INDEPENDENT CREATIVE</span>
    <button className="menu-toggle" type="button" aria-expanded={menu} aria-controls="site-menu" onClick={()=>setMenu(v=>!v)}>{menu?'CLOSE':'MENU'}<span className={`menu-icon ${menu?'open':''}`}><i/><i/></span></button>
   </div>
  </header>
  <nav id="site-menu" className={`menu-panel ${menu?'is-open':''}`} aria-hidden={!menu}>
   {[['01','Work','#work'],['02','About','#about'],['03','Expertise','#expertise'],['04','Contact','#contact']].map(([n,label,url])=><a key={n} tabIndex={menu?0:-1} href={url} onClick={navigate}><small>{n}</small>{label}<Arrow diagonal/></a>)}
  </nav>
  <main>
   <section className="hero" id="home">
    <div className="hero-topline"><span>INDEPENDENT DESIGNER & CREATIVE DIRECTOR</span><span>EST. 2004 <span className="hero-star">✳</span> ALWAYS EVOLVING</span></div>
    <div className="hero-main">
     <p className="hero-kicker" data-reveal>DESIGN IS NOT JUST WHAT YOU SEE.<br/>IT'S WHAT YOU REMEMBER.</p>
     <h1 className="hero-title" data-reveal><span>MAKE</span><span>IT <em>MEAN</em></span><span>SOMETHING<span className="title-period">.</span></span></h1>
     <div className="hero-bottom"><p>Identity. Direction. Digital.<br/>Crafting experiences with a point of view.</p><a className="circle-link" href="#work" aria-label="Explore selected work"><span>EXPLORE<br/>WORK</span><span className="circle-arrow">↘</span></a></div>
    </div>
    <div className="hero-art" aria-hidden="true"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-core"/><span className="art-caption">FORM / FEELING / FUNCTION</span></div>
    <div className="hero-index"><span>SCROLL TO DISCOVER</span><span>01 — 05</span></div>
   </section>
   <div className="marquee" aria-label="Design with intention"><div className="marquee-track">{Array.from({length:4},(_,i)=><span key={i}>CREATE WITH INTENTION <b>✳</b> THINK BEYOND THE EXPECTED <b>✳</b> </span>)}</div></div>
   <section className="intro section-pad" id="about">
    <div className="section-label" data-reveal><span className="label-dot"/>01 / THE APPROACH</div>
    <div className="intro-body"><h2 data-reveal>NOT JUST<br/><span className="purple-italic">DIFFERENT.</span><br/>DISTINCTIVE.</h2><div className="intro-side" data-reveal><span className="asterisk">✳</span><p>I'm John Wolf. I build brands, visual identities and digital experiences that don't just look good — they communicate something worth remembering.</p><p>With over two decades in design, I bring strategy, craft and a restless curiosity to every creative challenge.</p><a className="text-link" href="#expertise">WHAT I DO <Arrow/></a></div></div>
   </section>
   <section className="work-section section-pad" id="work">
    <div className="section-heading"><div className="section-label" data-reveal><span className="label-dot"/>02 / SELECTED THINKING</div><p data-reveal>A GLIMPSE INTO THE WORK<br/>AND THE WAY I THINK.</p></div>
    <h2 className="work-heading" data-reveal>WORK<span className="purple-italic"> / </span>IDEAS<span className="heading-star">✳</span></h2>
    <div className="work-grid">{work.map(item=><article className={`work-card ${item.theme}`} key={item.number} data-reveal>
     <div className="work-visual"><span className="visual-top">{item.number} / JOHN WOLF</span><div className="work-symbol">{item.symbol}</div><span className="visual-bottom">{item.type}</span></div>
     <div className="work-meta"><div><span className="work-type">{item.type}</span><h3>{item.title}</h3><p>{item.desc}</p></div><span className="work-arrow" aria-hidden="true">↗</span></div>
    </article>)}</div>
    <p className="work-disclaimer">SELECTED CREATIVE DIRECTIONS / FULL CASE STUDIES COMING SOON</p>
   </section>
   <section className="expertise section-pad" id="expertise">
    <div className="section-label" data-reveal><span className="label-dot"/>03 / WHAT I BRING</div>
    <div className="expertise-layout"><h2 data-reveal>ONE MIND.<br/><span className="purple-italic">MANY</span><br/>DIMENSIONS.</h2><div className="expertise-list">{expertise.map((item,i)=><div className="expertise-row" key={item} data-reveal><span>0{i+1}</span><h3>{item}</h3><span className="expertise-plus">↗</span></div>)}</div></div>
   </section>
   <section className="statement"><div className="statement-inner" data-reveal><span>THE PHILOSOPHY</span><p>GOOD DESIGN<br/>GETS NOTICED.<br/><em>GREAT DESIGN</em><br/>GETS FELT.</p><span className="statement-mark">✳</span></div></section>
   <section className="contact section-pad" id="contact">
    <div className="section-label" data-reveal><span className="label-dot"/>04 / THE NEXT CHAPTER</div>
    <p className="contact-intro" data-reveal>HAVE SOMETHING IN MIND?</p>
    <h2 data-reveal>LET'S MAKE<br/><span>IT <em>HAPPEN.</em></span></h2>
    <a className="contact-cta" href="mailto:hello@johnwolf.design?subject=Let's%20create%20something"><span>START A CONVERSATION</span><Arrow diagonal/></a>
    <p className="contact-note">Email address is a placeholder until confirmed.</p>
   </section>
  </main>
  <footer className="site-footer"><a className="footer-logo" href="#home">JW<span>.</span></a><span>INDEPENDENT BY DESIGN.</span><a href="#home">BACK TO TOP ↑</a><span>© {new Date().getFullYear()} JOHN WOLF</span></footer>
 </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
