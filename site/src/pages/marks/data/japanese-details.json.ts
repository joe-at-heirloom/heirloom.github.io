import { marks, details } from '../../../lib/japanese';
export const GET = () => new Response(JSON.stringify(details(marks())), { headers: { 'Content-Type': 'application/json' } });
