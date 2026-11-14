import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHoleTimeline,sampleHole,deformSheet} from '../src/paper/hole-motion.js';
import {HOLE_PRESET as p} from '../src/paper/preset.js';
const motion={backward:false,card:p.cardSize,curl:p.curl/100,flutter:p.flutter/100};
const options={frame:{width:1920,height:1080},aspects:[.75,1,16/9],count:p.count,look:{card:p.cardSize,ring:p.ring,flight:p.flight},period:p.duration,seed:p.seed};
const timeline=createHoleTimeline(options);
const summary=(time)=>sampleHole(timeline,time,motion).map(s=>[s.sheet.i,s.x,s.y,s.m,...s.q,s.bend,s.flutter]);
test('the 12-second loop repeats exactly without accumulated simulation drift',()=>{
 for(const t of [0,.5,2,6,11.999]){
  const a=summary(t),b=summary(t+12*1000);
  assert.equal(a.length,b.length);
  a.forEach((row,i)=>row.forEach((n,j)=>assert.ok(Math.abs(n-b[i][j])<1e-7)));
 }
 const again=createHoleTimeline(options);
 assert.deepEqual(sampleHole(timeline,6,motion),sampleHole(again,6,motion));
});
test('desktop and phone timelines produce finite geometry, unit normals and valid visibility',()=>{
 for(const width of [1920,1080,540]){
  const track=createHoleTimeline({...options,frame:{width,height:1080}});
  for(let time=0;time<12;time+=.125){
   for(const s of sampleHole(track,time,motion)){
    const aspect=options.aspects[s.sheet.picture],dims=aspect>=1?[1,1/aspect]:[aspect,1];
    assert.ok(Math.abs(Math.hypot(...s.q)-1)<1e-5);
    for(const x of [-.5,0,.5])for(const y of [-.5,0,.5]){
     const v=deformSheet(x*dims[0],y*dims[1],dims,p.cardSize,s);
     assert.ok([...v.p,...v.n,v.veil].every(Number.isFinite));
     assert.ok(Math.abs(Math.hypot(...v.n)-1)<1e-5);
     assert.ok(v.veil>=0&&v.veil<=1);
    }
   }
  }
 }
});
test('scrubbing backward reproduces the same deformed frame',()=>{
 const before=summary(4.3);
 for(const t of [11,0,6,2])summary(t);
 assert.deepEqual(summary(4.3),before);
 assert.ok(sampleHole(timeline,4.3,motion).some(s=>Math.abs(s.bend)>.01&&s.flutter>0));
});
test('preview artwork paths resolve to tracked local files',()=>{
 const source=readFileSync(new URL('../src/paper/PaperHome.jsx',import.meta.url),'utf8');
 const paths=[...source.matchAll(/"(\/(?:logos|brands)\/[^"\n]+\.webp)"/g)].map(m=>m[1]);
 assert.equal(paths.length,12);
 for(const path of paths)assert.ok(existsSync(new URL('../public'+path,import.meta.url)),path);
});
