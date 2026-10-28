// Locate already-owned GLB assets without asking for repeated manual downloads.
// Never overwrite existing models; do not silently substitute a different model.
import {existsSync,mkdirSync,readdirSync,copyFileSync,statSync} from 'node:fs';
import {homedir} from 'node:os';
import {join,resolve} from 'node:path';
const project=resolve(import.meta.dirname,'..');
const target=join(project,'public','models');
mkdirSync(target,{recursive:true});
const names=['platform.glb','ufo.glb','black_hole.glb','purple_planet.glb','audras_moon-web-optimized.glb'];
const roots=[join(project,'assets'),join(homedir(),'Downloads'),join(homedir(),'Desktop')];
const found=new Map();
function scan(dir,depth=0){
 if(depth>3 || !existsSync(dir))return;
 let entries;
 try{entries=readdirSync(dir,{withFileTypes:true});}catch{return;}
 for(const entry of entries){
  if(entry.name.startsWith('.') || entry.name==='node_modules')continue;
  const full=join(dir,entry.name);
  if(entry.isFile()&&names.includes(entry.name)&&!found.has(entry.name))found.set(entry.name,full);
  if(entry.isDirectory())scan(full,depth+1);
 }
}
const missing=names.filter(name=>!existsSync(join(target,name)));
if(missing.length)roots.forEach(root=>scan(root));
for(const name of missing){
 const source=found.get(name);
 if(!source){console.warn('[models] Missing '+name+'; optional objects may not appear.');continue;}
 try{
  const bytes=statSync(source).size;
  if(bytes>100*1024*1024)console.warn('[models] Large source file: '+name);
  copyFileSync(source,join(target,name));
  console.log('[models] Installed '+name+' from existing local asset');
 }catch(e){console.warn('[models] Could not install '+name+': '+e.message);}
}
