// Locate original GLB assets without asking for repeated downloads.
// Prefer the user's newer 4K purple planet over older monochrome/1K exports.
import {existsSync,mkdirSync,readdirSync,copyFileSync,statSync} from 'node:fs';
import {homedir} from 'node:os';
import {join,resolve} from 'node:path';
const project=resolve(import.meta.dirname,'..');
const target=join(project,'public','models');
mkdirSync(target,{recursive:true});
const names=['platform.glb','ufo.glb','black_hole.glb','purple_planet.glb','audras_moon-web-optimized.glb'];
const purpleVersions=['purple_planet(4).glb','purple_planet(2).glb'];
const roots=[join(project,'assets'),join(homedir(),'Downloads'),join(homedir(),'Desktop')];
const found=new Map();
function scan(dir,depth=0){
 if(depth>3 || !existsSync(dir))return;
 let entries;
 try{entries=readdirSync(dir,{withFileTypes:true});}catch{return;}
 for(const entry of entries){
  if(entry.name.startsWith('.') || entry.name==='node_modules')continue;
  const full=join(dir,entry.name);
  if(entry.isFile() && [...names,...purpleVersions].includes(entry.name) && !found.has(entry.name))found.set(entry.name,full);
  if(entry.isDirectory())scan(full,depth+1);
 }
}
// Scan even if the old planet is already installed; the previous implementation
// silently kept that older file forever and never noticed newer named exports.
roots.forEach(root=>scan(root));
for(const name of names){
 const destination=join(target,name);
 const preferred=name==='purple_planet.glb'
  ? purpleVersions.map(v=>found.get(v)).find(Boolean)
  : null;
 const source=preferred || (!existsSync(destination)?found.get(name):null);
 if(!source){
  if(!existsSync(destination))console.warn('[models] Missing '+name+'; optional objects may not appear.');
  continue;
 }
 try{
  const src=statSync(source);
  if(src.size>100*1024*1024)console.warn('[models] Large source file: '+name);
  const dest=existsSync(destination)?statSync(destination):null;
  // Do not rewrite the model on each dev server start if already synchronized.
  if(dest && dest.size===src.size && dest.mtimeMs>=src.mtimeMs)continue;
  copyFileSync(source,destination);
  console.log('[models] '+(dest?'Updated ':'Installed ')+name+' from '+source);
 }catch(e){console.warn('[models] Could not install '+name+': '+e.message);}
}
