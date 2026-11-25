// /marks/tiffany-windows/search.json: one short row per building for the
// hub's search box (lib/tiffany.ts searchIndex), fetched when the box is used.
import { searchIndex } from '../../../lib/tiffany';
export const GET = () => new Response(JSON.stringify(searchIndex()), { headers: { 'Content-Type': 'application/json' } });
