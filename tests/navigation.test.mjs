import test from 'node:test';
import assert from 'node:assert/strict';
import {cardTilt,shipAnchor,ARRIVAL} from '../src/navigation.js';
test('tilt stays bounded even when pointer moves outside a card',()=>{
 for(const x of [-1000,0,50,100,1000])for(const y of [-1000,0,80,160,1000]){
  const angle=cardTilt(x,y,100,160);
  assert.ok(Math.abs(angle.x)<=5 && Math.abs(angle.y)<=5);
 }
 assert.equal(cardTilt(50,80,100,160).y,0);
 assert.equal(Math.abs(cardTilt(50,80,100,160).x),0);
});
test('ship anchors match desktop and mobile card centers; opened panel centers ship',()=>{
 for(const narrow of [false,true]){
  const centers=[0,1,2].map(i=>shipAnchor(i,false,narrow));
  assert.equal(centers[1],.5);
  assert.equal(centers[0]+centers[2],1);
  assert.ok(centers[0]>0 && centers[2]<1);
  for(const i of [0,1,2])assert.equal(shipAnchor(i,true,narrow),.5);
 }
 assert.equal(shipAnchor(0,false,false),.26);
 assert.equal(shipAnchor(0,false,true),.2);
});
test('arrival has remaining scroll room',()=>assert.ok(ARRIVAL>.55 && ARRIVAL<1));
