/** Original motion controller, isolated from Three.js for deterministic tests. */
export const SETTINGS={yawMax:.59,pitchMax:.62,follow:6.2,floatAmplitude:.025,floatSpeed:1.5,boredAfter:30,hitCooldown:1.35,impact:.36,returnEnd:.96,shakeStart:1.04,recover:1.54,blinkDuration:.16,blinkMin:3,blinkJitter:2};
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const damp=(a,b,k,dt)=>a+(b-a)*(1-Math.exp(-k*dt));
const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
export class HeadController{
 constructor(random=Math.random){
  this.random=random;this.time=0;this.lastActivity=0;this.pointer={x:0,y:0};
  this.yaw=0;this.pitch=0;this.roll=0;this.blinkAt=SETTINGS.blinkMin+SETTINGS.blinkJitter*random();
  this.blinkStart=-10;this.hitStart=-100;this.hitCount=0;this.sign=1;this.hitSide=0;
 }
 movePointer(x,y){this.pointer.x=clamp(x,-1,1);this.pointer.y=clamp(y,-1,1);this.interact()}
 interact(){this.lastActivity=this.time}
 hit(side=0){if(this.time-this.hitStart<SETTINGS.hitCooldown)return false;
  this.hitStart=this.time;this.hitCount++;
  // A hit on the viewer's left sends the head backward and toward the right.
  // Side is measured in screen coordinates, independent of model orientation.
  this.hitSide=side<0?-1:side>0?1:0;
  this.sign=this.hitSide||((this.hitCount%2)?-1:1);
  this.blinkStart=this.time;this.interact();return true}
 update(dt){
  dt=clamp(dt,0,.05);this.time+=dt;const s=SETTINGS;
  const bored=this.time-this.lastActivity>s.boredAfter;
  const sinceHit=this.time-this.hitStart;
  if(this.time>=this.blinkAt&&sinceHit>s.recover){
   this.blinkStart=this.time;this.blinkAt=this.time+s.blinkMin+s.blinkJitter*this.random()}
  const sinceBlink=this.time-this.blinkStart;
  let blink=sinceBlink>=0&&sinceBlink<s.blinkDuration?Math.sin(Math.PI*sinceBlink/s.blinkDuration):0;
  let lean=0,shake=0,impact=0,state=bored?'bored':'tracking';
  if(sinceHit>=0&&sinceHit<s.impact){
   state='impact';const p=sinceHit/s.impact;
   // Reach the text at the deepest point of the backward recoil.
   lean=.5-.5*Math.cos(Math.PI*p);impact=Math.sin(Math.PI*p)*this.sign;
   blink=Math.max(blink,Math.sin(Math.PI*clamp(p*1.15,0,1)));
  }else if(sinceHit>=s.impact&&sinceHit<s.returnEnd){
   state='return';const p=(sinceHit-s.impact)/(s.returnEnd-s.impact);
   lean=.5+.5*Math.cos(Math.PI*p);
  }else if(sinceHit>=s.returnEnd&&sinceHit<s.shakeStart){
   state='settle'; // regain full size and position before shaking
  }else if(sinceHit>=s.shakeStart&&sinceHit<s.recover){
   state='shake';
   const p=(sinceHit-s.shakeStart)/(s.recover-s.shakeStart);
   // Uneven, intentional shake-off instead of a repeating bobblehead sine.
   const keys=[[0,0],[.15,.43],[.33,-.49],[.53,.27],[.75,-.10],[1,0]];
   for(let i=1;i<keys.length;i++)if(p<=keys[i][0]){
    const [a,v]=keys[i-1],[b,w]=keys[i];
    shake=v+(w-v)*smooth((p-a)/(b-a));break;
   }
  }
  const tracking=state==='tracking';
  this.yaw=damp(this.yaw,tracking?this.pointer.x*s.yawMax*.72:0,s.follow,dt);
  this.pitch=damp(this.pitch,tracking?-this.pointer.y*s.pitchMax*.57:0,s.follow,dt);
  this.roll=damp(this.roll,bored?-.09:0,3.4,dt);
  return {state,bored,contact:sinceHit>=s.impact&&sinceHit<s.returnEnd,blink:clamp(blink,0,1),lean,scale:1-lean*.085,
   vertical:Math.sin(this.time*s.floatSpeed)*s.floatAmplitude*(bored?.25:1)-lean*.055,
   horizontal:lean*(-this.sign)*.055,
   yaw:this.yaw+lean*this.sign*.16+impact*.022+shake*.075,
   pitch:this.pitch-lean*.31+shake*.018,
   roll:this.roll-lean*this.sign*.085+impact*.012+shake*.045,
   depth:-lean*.36};
 }
}