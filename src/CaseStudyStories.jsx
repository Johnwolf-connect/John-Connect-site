import React from 'react';
import caseStudies from './case-studies.json';
import './case-study-stories.css';

const byId = Object.fromEntries(caseStudies.projects.map(project => [project.id, project]));
const HIGHLIGHTS = {
 'chick-muy-caliente':['memorable, simple, fun, and highly marketable',"Don't Be Chicken.",'personality people could remember'],
 riches:['Confidence isn\'t something you put on','reminder of that confidence'],
 'bring-love-back':['Bring Love Back','Different expressions of love'],
 inkzilla:['octopus—the king of ink','a signature they could proudly leave behind'],
 brewty:["Life's a Brewty",'brown','blue','cream','how the experience feels'],
 'chit-chat':['honest','clock it','everyone gets to speak, laugh, and be heard']
};
function Marked({text,phrases}) {
 if(!text)return null;
 const fragments=[];let remainder=text;
 while(remainder.length){
  const matches=(phrases||[]).map(phrase=>({phrase,index:remainder.toLowerCase().indexOf(phrase.toLowerCase())})).filter(m=>m.index>=0).sort((a,b)=>a.index-b.index);
  if(!matches.length){fragments.push(remainder);break;}
  const {phrase,index}=matches[0];
  if(index)fragments.push(remainder.slice(0,index));
  fragments.push(<mark className="case-study-marker" key={fragments.length}>{remainder.slice(index,index+phrase.length)}</mark>);
  remainder=remainder.slice(index+phrase.length);
 }
 return <>{fragments}</>;
}
export default function CaseStudyStories({id,position='intro'}){
 const study=byId[id];if(!study)return null;
 const color=study.highlight||'#d7c0c0';
 const phrases=HIGHLIGHTS[id]||[];
 if(position==='intro')return <section className="case-study-story case-study-opening" style={{'--case-marker':color}} aria-label={study.name||id+' case study'}>
   <span className="case-study-eyebrow">THE STORY BEHIND THE IDENTITY</span>
   <h2>{study.name||id.replaceAll('-',' ').toUpperCase()}</h2>
   <p><Marked text={study.intro} phrases={phrases}/></p>
 </section>;
 if(!study.beats?.length)return null;
 return <section className="case-study-story case-study-closing" style={{'--case-marker':color}}>
  {study.beats.map((beat,i)=><div className="case-study-beat" key={i}><p><Marked text={beat.text} phrases={phrases}/></p></div>)}
 </section>;
}
