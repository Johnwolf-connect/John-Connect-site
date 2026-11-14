import test from 'node:test';
import assert from 'node:assert/strict';
import {installScrollBridge} from '../src/floating-about/scroll-bridge.js';
import {HeadController} from '../src/floating-about/controller.js';

test('embedded scroll accepts only parent, normalizes input, and re-syncs resized content', async()=>{
 const listeners={},messages=[],scrolls=[];
 let resized;
 const parent={postMessage:data=>messages.push(data)};
 global.window={parent,location:{origin:'https://portfolio.test'},innerHeight:800,
  addEventListener:(name,fn)=>listeners[name]=fn,scrollTo:value=>scrolls.push(value)};
 global.document={body:{},documentElement:{scrollHeight:3000},fonts:{ready:Promise.resolve()},hidden:false};
 global.ResizeObserver=class{constructor(fn){resized=fn}observe(){}};
 const bridge=installScrollBridge();
 await Promise.resolve();
 assert.equal(bridge.isActive(),false);
 listeners.message({source:{},origin:window.location.origin,data:{type:'jw-about-scroll',offset:100,active:true}});
 assert.equal(bridge.isActive(),false);
 listeners.message({source:parent,origin:'https://other.test',data:{type:'jw-about-scroll',offset:100,active:true}});
 assert.equal(bridge.isActive(),false);
 listeners.message({source:parent,origin:window.location.origin,data:{type:'jw-about-scroll',offset:450,active:true}});
 assert.deepEqual(scrolls.at(-1),{top:450,behavior:'instant'});
 assert.equal(bridge.isActive(),true);
 let prevented=false;
 listeners.wheel({deltaY:3,deltaMode:1,preventDefault(){prevented=true}});
 assert.equal(prevented,true);assert.equal(messages.at(-1).deltaY,48);
 const before=messages.length;
 listeners.wheel({ctrlKey:true,deltaY:1});
 assert.equal(messages.length,before);
 listeners.touchstart({touches:[{clientY:400}]});
 listeners.touchmove({touches:[{clientY:300}],preventDefault(){}});
 assert.equal(messages.at(-1).deltaY,100);
 listeners.keydown({key:'PageDown',target:{closest:()=>null},preventDefault(){}});
 assert.equal(messages.at(-1).deltaY,680);
 const n=messages.length;
 listeners.keydown({key:' ',target:{closest:()=>({})},preventDefault(){throw Error('button intercepted')}});
 assert.equal(messages.length,n);
 document.documentElement.scrollHeight=4200;resized();
 assert.deepEqual(messages.at(-1),{type:'jw-about-size',height:4200});
 assert.equal(scrolls.at(-1).top,450);
 document.hidden=true;assert.equal(bridge.isActive(),false);
});
test('head hit reaches contact, shakes off, recovers, and blinks',()=>{
 const head=new HeadController(()=>0);
 assert.equal(head.hit(-1),true);assert.equal(head.hit(1),false);
 const states=new Set();let contact=false,blink=false;
 for(let i=0;i<100;i++){const m=head.update(.05);states.add(m.state);contact ||= m.contact;blink ||=m.blink>0;}
 assert.ok(contact&&blink);
 for(const state of ['impact','return','settle','shake','tracking'])assert.ok(states.has(state),state);
 head.movePointer(1,0);for(let i=0;i<20;i++)head.update(.05);
 assert.ok(head.yaw>0);
});
