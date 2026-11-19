// Projected-mesh text contour: the exclusion area follows the actual head,
// rather than a viewport-sized ellipse. Does not alter model interactions.
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const cards=[...document.querySelectorAll('.story-message')];
const scratch=[];
const projection={left:[],right:[],top:0,step:0,valid:false};
let raf=0,dirty=true,lastSignature='';
function update(){
 raf=0;dirty=false;
 const vh=window.innerHeight;
 for(const card of cards){
  const floater=card.querySelector('.story-contour');
  if(!floater)continue;
  const rect=card.getBoundingClientRect();
  const onLeft=card.classList.contains('story-left');
  const width=rect.width;
  // A float only needs to extend through this passage, not the whole section.
  const contentHeight=[...card.querySelectorAll('p')].reduce((n,p)=>n+p.offsetHeight+parseFloat(getComputedStyle(p).marginBottom||0),0);
  const disk=card.querySelector('.disk-view');
  const height=Math.min(900,Math.max(1,contentHeight+(disk?disk.offsetHeight+24:0)));
  if(rect.bottom<0||rect.top>vh||!projection.valid){
   floater.style.width='0px';floater.style.height='1px';floater.style.shapeOutside='none';continue;
  }
  const headLeft=Math.min(...projection.left),headRight=Math.max(...projection.right);
  const needed=onLeft?rect.right-headLeft:headRight-rect.left;
  if(needed<=0){
   floater.style.width='0px';floater.style.height='1px';floater.style.shapeOutside='none';continue;
  }
  const floatWidth=clamp(needed,0,width);
  const origin=onLeft?rect.right-floatWidth:rect.left;
  // A full-height polygon permits variable line-by-line margins, including
  // the narrow temples, wide beanie, ear and tapered chin.
  const points=[];
  const samples=Math.max(48,Math.ceil(height/7));
  for(let i=0;i<=samples;i++){
   const y=i*height/samples;
   const row=Math.round((rect.top+y-projection.top)/projection.step);
   const seen=row>=0&&row<projection.left.length&&Number.isFinite(projection.left[row]);
   const edge=seen?(onLeft?projection.left[row]:projection.right[row]):(onLeft?rect.right:rect.left);
   const x=clamp(edge-origin,0,floatWidth);
   points.push([x,y]);
  }
  const px=(p)=>p[0].toFixed(1)+'px '+p[1].toFixed(1)+'px';
  // The polygon fills inward from the mesh edge, never the text side.
  const path=onLeft
   ? [[floatWidth,0],[floatWidth,height],...points.reverse()].map(px)
   : [[0,0],...points.map(px),[0,height]].map(px);
  floater.style.width=floatWidth.toFixed(1)+'px';
  floater.style.height=height.toFixed(1)+'px';
  floater.style.shapeOutside='polygon('+path.join(',')+')';
 }
}
function schedule(){dirty=true;if(!raf)raf=requestAnimationFrame(update)}
export function installStoryContour(){
 window.addEventListener('scroll',schedule,{passive:true});
 window.addEventListener('resize',schedule,{passive:true});
 schedule();
 return ()=>{window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);cancelAnimationFrame(raf)};
}
const v3Cache=[];
export function createSilhouetteSampler(meshes,camera,stage){
 const samples=[];
 for(const mesh of meshes){
  const position=mesh.geometry?.attributes?.position;
  if(!position)continue;
  // Bound projection work even for the ~1M-vertex source mesh.
  const step=Math.max(1,Math.floor(position.count/4500));
  const vertices=[];
  for(let i=0;i<position.count;i+=step)vertices.push([position.getX(i),position.getY(i),position.getZ(i)]);
  samples.push({mesh,vertices});
 }
 const v=new (camera.position.constructor)();
 let last=0;
 return function sampleSilhouette(now){
  if(now-last<80)return;
  last=now;
  camera.updateMatrixWorld();
  for(const {mesh} of samples)mesh.updateWorldMatrix(true,false);
  const bounds=stage.getBoundingClientRect();
  const rowStep=5,rows=Math.ceil(bounds.height/rowStep)+1;
  const left=Array(rows).fill(Infinity),right=Array(rows).fill(-Infinity);
  for(const {mesh,vertices} of samples){
   for(const p of vertices){
    v.set(p[0],p[1],p[2]).applyMatrix4(mesh.matrixWorld).project(camera);
    if(v.z < -1 || v.z > 1)continue;
    const x=bounds.left+(v.x+1)*bounds.width/2;
    const y=bounds.top+(1-v.y)*bounds.height/2;
    const row=Math.round((y-bounds.top)/rowStep);
    if(row>=0&&row<rows){left[row]=Math.min(left[row],x);right[row]=Math.max(right[row],x);}
   }
  }
  // Fill gaps caused by vertex sampling; also pad against rotation and glyphs.
  for(let row=0;row<rows;row++){
   if(left[row]===Infinity)continue;
   for(let d=-2;d<=2;d++){
    const r=row+d;
    if(r<0||r>=rows)continue;
    scratch.push([r,left[row]-18,right[row]+18]);
   }
  }
  const smLeft=Array(rows).fill(Infinity),smRight=Array(rows).fill(-Infinity);
  for(const [r,l,rr] of scratch){smLeft[r]=Math.min(smLeft[r],l);smRight[r]=Math.max(smRight[r],rr);}
  scratch.length=0;
  const signature=smLeft.map((x,i)=>Number.isFinite(x)?Math.round(x/3)+':'+Math.round(smRight[i]/3):'').join('|');
  if(signature!==lastSignature){
   lastSignature=signature;
   projection.left=smLeft;projection.right=smRight;projection.top=bounds.top;projection.step=rowStep;
   projection.valid=smLeft.some(Number.isFinite);
   schedule();
  }
 };
}
