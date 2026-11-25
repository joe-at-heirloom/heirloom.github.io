// Put the repository's mark images where the build serves them (public/ is
// copied as is). They stay in ../marks/img, the one place other work edits.
import { cpSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const site = join(dirname(fileURLToPath(import.meta.url)), '..');
rmSync(join(site, 'public', 'marks', 'img'), { recursive: true, force: true });
cpSync(join(site, '..', 'marks', 'img'), join(site, 'public', 'marks', 'img'), { recursive: true });
console.log('[prebuild] marks/img copied');
