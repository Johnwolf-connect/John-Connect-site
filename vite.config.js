import {defineConfig} from 'vite';
import {resolve, dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {existsSync, mkdirSync, readFileSync, copyFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const root=dirname(fileURLToPath(import.meta.url));
const target=join(root,'public/about/head-interactive.glb');
const approvedSha='42fa6e31d60018fba35e2d553ae7f67e0b10924f';

function gitBlobSha(file){
  const bytes=readFileSync(file);
  return createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
}
function ensureApprovedModel(){
  const choices=[
    process.env.JOHN_WOLF_APPROVED_HEAD,
    resolve(root,'../john-wolf-3d-head/web/public/head-interactive.glb'),
    '/workspaces/john-wolf-3d-head/web/public/head-interactive.glb'
  ].filter(Boolean);
  if(existsSync(target)){
    if(gitBlobSha(target)!==approvedSha)throw new Error('About model differs from the approved head');
    return;
  }
  for(const candidate of choices){
    if(!existsSync(candidate))continue;
    if(gitBlobSha(candidate)!==approvedSha)throw new Error('Found a head model with the wrong SHA at '+candidate);
    mkdirSync(dirname(target),{recursive:true});
    copyFileSync(candidate,target);
    console.info('[about] Exact approved 3D head model copied from '+candidate);
    return;
  }
  console.warn('[about] Original approved 3D head missing. Set JOHN_WOLF_APPROVED_HEAD or copy web/public/head-interactive.glb from the original repository.');
}
export default defineConfig({
  plugins:[{name:'approved-about-model',configResolved:ensureApprovedModel}],
  build:{rollupOptions:{input:{main:resolve(root,'index.html'),about:resolve(root,'about.html')}}}
});
