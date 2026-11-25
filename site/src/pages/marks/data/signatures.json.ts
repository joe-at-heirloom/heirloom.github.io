// The signatures search's records (artists and their signatures, Chinese painters and collectors); their seals are seals.json.
import { indexRows } from '../../../lib/portal';
export const GET = () => new Response(JSON.stringify(indexRows('signatures')), { headers: { 'Content-Type': 'application/json' } });
