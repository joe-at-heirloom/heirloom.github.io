import { indexRows } from '../../../lib/portal';
export const GET = () => new Response(JSON.stringify(indexRows('marks')), { headers: { 'Content-Type': 'application/json' } });
