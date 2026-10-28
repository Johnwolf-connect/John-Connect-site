// Synchronize local GLBs without changing their embedded materials or textures.
// The approved 4K planet is identified by its SHA-256, not a guessed filename.
import {existsSync,mkdirSync,readdirSync,copyFileSync,createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {homedir} from 'node:os';
import {join,resolve} from 'node:path';

const project=resolve(import.meta.dirname,'..');
const target=join(project,'public','models');
mkdirSync(target,{recursive:true});
const otherNames=['platform.glb','ufo.glb','black_hole.glb','audras_moon-web-optimized.glb'];
const planet='purple_planet.glb';
const originalName='purple_planet(5).glb';
const approvedSha='d9c8694975801df074264107e5199a6936498eb72b6f2f119641685fbba81144';
const roots=[join(project,'assets'),join(homedir(),'Downloads'),join(homedir(),'Desktop')];
const found=new Map();

function scan(dir,depth=0){
 if(depth>3 || !existsSync(dir))return;
 let entries;
 try{entries=readdirSync(dir,{withFileTypes:true});}catch{return;}
 for(const entry of entries){
  if(entry.name.startsWith('.') || entry.name==='node_modules')continue;
  const full=join(dir,entry.name);
  if(entry.isFile() && [...otherNames,planet,originalName].includes(entry.name)){
   const matches=found.get(entry.name)||[];
   matches.push(full);
   found.set(entry.name,matches);
  }
  if(entry.isDirectory())scan(full,depth+1);
 }
}
function digest(path){
 return new Promise((resolveHash,reject)=>{
  const hash=createHash('sha256');
  const stream=createReadStream(path);
  stream.on('data',bytes=>hash.update(bytes));
  stream.on('error',reject);
  stream.on('end',()=>resolveHash(hash.digest('hex')));
 });
}
roots.forEach(root=>scan(root));

// Only the approved original may be installed as the planet. Never fall back to
// a 1K export or a previous monochrome asset because a filename happens to fit.
const destination=join(target,planet);
const installed=existsSync(destination)?await digest(destination):null;
if(installed===approvedSha){
 console.log('[models] Approved 4K purple planet verified (SHA-256).');
}else{
 let source=null;
 for(const candidate of [...(found.get(originalName)||[]),...(found.get(planet)||[])]){
  if(await digest(candidate)===approvedSha){source=candidate;break;}
 }
 if(source){
  copyFileSync(source,destination);
  if(await digest(destination)!==approvedSha)throw Error('[models] Planet copy failed SHA-256 verification.');
  console.log('[models] Installed approved 4K purple planet; SHA-256 verified.');
 }else{
  console.warn('[models] APPROVED purple planet not installed. Download purple_planet.glb to Downloads and restart npm run dev.');
  if(installed)console.warn('[models] An unverified older planet remains in public/models; refusing to replace it with another unverified file.');
 }
}
for(const name of otherNames){
 const output=join(target,name);
 if(existsSync(output))continue;
 const source=(found.get(name)||[])[0];
 if(!source){console.warn('[models] Missing '+name+'; optional objects may not appear.');continue;}
 try{copyFileSync(source,output);console.log('[models] Installed '+name+' from existing local asset');}
 catch(e){console.warn('[models] Could not install '+name+': '+e.message);}
}
