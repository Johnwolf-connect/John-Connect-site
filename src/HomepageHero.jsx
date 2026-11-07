import React,{useState} from 'react';
import './HomepageHero.css';
const root='/homepage-canva/';
const states=[
 ['Large title.svg','Large title overlay mask to man.svg'],
 ['Large Title Branding.svg','Large Title Branding overlay mask to man.svg'],
 ['Large Title Designer.svg','Large Title Designer overlay mask to man.svg'],
 ['Large Title Creation.svg','Large Title Creation overlay mask to man.svg'],
 ['Large Title Guidelines.svg','Large Title Guidelines Large Title Guidelines overlay mask to man.svg'],
 ['Large Title Learning.svg','Large Title Learning Large Title Creation overlay mask to man.svg'],
 ['Large Title Solving.svg','Large Title Solving  overlay mask to man.svg']
];
const labels=['Portfolio','Branding','Designer','Creation','Guidelines','Learning','Solving'];
const layer=(name,cls)=> <img className={'jw-art '+cls} src={root+encodeURIComponent(name)} alt="" aria-hidden="true" draggable="false"/>;
export default function HomepageHero(){
 const [index,setIndex]=useState(0);
 return <div className="jw-homepage" aria-label="John Wolf portfolio homepage">
  <div className="jw-artboard">
   {layer(states[index][0],'jw-art-title')}
   {layer('Man.svg','jw-art-man')}
   {layer(states[index][1],'jw-art-outline')}
   {layer('Subtitle dot.svg','jw-art-subtitle-dot')}
   {layer(index===0?'Subtitle.svg':'subtitle for all other Large Titles.svg','jw-art-subtitle')}
   {layer('Indicators.svg','jw-art-indicator-visual')}
   {index===0&&layer('Portfolio sub-body.svg','jw-art-subbody')}
   {index===0&&layer('Portfolio body.svg','jw-art-body')}
   {layer('More about me.svg','jw-art-more')}
   {layer('underline for more about me.svg','jw-art-underline')}
   {layer('More about me (arrow).svg','jw-art-more-arrow')}
   {layer('Swipe up icon.svg','jw-art-swipe')}
   <nav className="jw-hit-indicators" aria-label="Select homepage title">
    {states.map((_,i)=><button key={i} type="button" className={index===i?'selected':''} onClick={()=>setIndex(i)} aria-label={labels[i]} aria-current={index===i?'true':undefined}/>)}
   </nav>
   <a className="jw-hit-more" href="#about" aria-label="More about me"/>
   <a className="jw-hit-swipe" href="#work" aria-label="Swipe up to work"/>
  </div>
 </div>;
}
