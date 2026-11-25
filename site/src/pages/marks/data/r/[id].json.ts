import { familyRecords, PER_RECORD } from '../../../../lib/portal';
const all = () => [...PER_RECORD].flatMap((f) => familyRecords(f));
export function getStaticPaths() {
  return all().map((r) => ({ params: { id: r.id }, props: { r } }));
}
export const GET = ({ props }: { props: { r: unknown } }) => new Response(JSON.stringify(props.r), { headers: { 'Content-Type': 'application/json' } });
