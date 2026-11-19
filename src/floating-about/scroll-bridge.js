// Only the portfolio owns scrolling when embedded; standalone stays native.
export function installScrollBridge(){
 const embedded=window.parent!==window;
 let active=!embedded,offset=0,lastHeight=0;
 const send=data=>window.parent.postMessage(data,window.location.origin);
 const sync=()=>{
  if(!embedded)return;
  const height=document.documentElement.scrollHeight;
  if(height!==lastHeight){lastHeight=height;send({type:'jw-about-size',height});}
  window.scrollTo({top:offset,behavior:'instant'});
 };
 if(embedded){
  window.addEventListener('message',event=>{
   if(event.source!==window.parent||event.origin!==window.location.origin||event.data?.type!=='jw-about-scroll')return;
   if(!Number.isFinite(event.data.offset))return;
   offset=Math.max(0,event.data.offset);active=event.data.active===true;sync();
  });
  const observer=new ResizeObserver(sync);observer.observe(document.body);
  window.addEventListener('resize',sync);
  document.fonts?.ready.then(sync);
  const scroll=deltaY=>send({type:'jw-about-wheel',deltaY});
  window.addEventListener('wheel',event=>{
   if(event.ctrlKey)return;
   event.preventDefault();
   scroll(event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?window.innerHeight:1));
  },{passive:false});
  let touchY=null;
  window.addEventListener('touchstart',event=>{touchY=event.touches.length===1?event.touches[0].clientY:null},{passive:true});
  window.addEventListener('touchmove',event=>{
   if(touchY===null||event.touches.length!==1)return;
   event.preventDefault();
   const y=event.touches[0].clientY;scroll(touchY-y);touchY=y;
  },{passive:false});
  window.addEventListener('touchend',()=>{touchY=null},{passive:true});
  window.addEventListener('keydown',event=>{
   if(event.target.closest('button,a,input,textarea,select,[contenteditable]')||event.ctrlKey||event.metaKey||event.altKey)return;
   const distances={ArrowDown:40,ArrowUp:-40,PageDown:window.innerHeight*.85,PageUp:-window.innerHeight*.85,' ':window.innerHeight*.85*(event.shiftKey?-1:1)};
   if(event.key in distances){event.preventDefault();scroll(distances[event.key]);}
   if(event.key==='Home'||event.key==='End'){event.preventDefault();send({type:'jw-about-key',key:event.key});}
  });
  send({type:'jw-about-ready'});sync();
 }
 return {isActive:()=>active&&!document.hidden};
}
