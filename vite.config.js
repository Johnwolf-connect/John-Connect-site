import {defineConfig} from 'vite';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
export default defineConfig({build:{rollupOptions:{input:{main:resolve(root,'index.html'),about:resolve(root,'about-experience/index.html'),paper:resolve(root,'paper-preview/index.html')}}}});
