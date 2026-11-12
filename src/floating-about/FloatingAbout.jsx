import React from 'react';
/** Isolated legacy Three.js application: separate document, styles and lifecycle. */
export default function FloatingAbout(){
 return <section id="about" className="floating-about-shell" aria-label="About John Wolf — interactive 3D experience">
  <iframe title="About John Wolf — floating 3D head" src="/about-experience/" loading="lazy" className="floating-about-frame" />
 </section>;
}
