import { indexRows } from '../../../lib/portal';
export const GET = () => new Response(JSON.stringify(indexRows()), { headers: { 'Content-Type': 'application/json' } });
