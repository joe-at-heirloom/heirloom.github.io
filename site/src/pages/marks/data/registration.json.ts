// /marks/data/registration.json: the registration reader's data (the app's
// registration.json, synced into src/data/app): the Archives' design books and
// the diamond code tables, without the prose the page carries itself.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const f = join(process.cwd(), 'src', 'data', 'app', 'registration.json');
export const GET = () => {
  const t = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : { pieces: [], diamond: {} };
  return new Response(JSON.stringify({ pieces: t.pieces, diamond: t.diamond }), { headers: { 'Content-Type': 'application/json' } });
};
