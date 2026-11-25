import { familyRecords, families, PER_RECORD } from '../../../../lib/portal';
export function getStaticPaths() {
  return families().filter((f) => !PER_RECORD.has(f.family)).map((f) => ({ params: { family: f.family } }));
}
export const GET = ({ params }: { params: { family: string } }) =>
  new Response(JSON.stringify(familyRecords(params.family)), { headers: { 'Content-Type': 'application/json' } });
