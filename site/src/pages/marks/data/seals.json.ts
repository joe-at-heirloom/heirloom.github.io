import { sealRows } from '../../../lib/portal';
export const GET = () => new Response(JSON.stringify(sealRows()), { headers: { 'Content-Type': 'application/json' } });
