import type { Progress } from '../engine/mastery';
import { isMastered, isUnlocked } from '../engine/mastery';
import type { Concept } from '../engine/types';
import { CONCEPTS } from '../content';

const W = 132;
const H = 46;
const GX = 12;
const GY = 48;
/** Room on the left for the tier labels. */
const LABEL = 64;

/**
 * The learning path as a diagram: bottom-level primitives at the top, arrows from each structure to
 * the ones built on it. Rows are tiers; order within a row follows the prerequisites to keep lines short.
 */
function layout() {
  const byId = new Map(CONCEPTS.map((c) => [c.id, c]));
  // Rows follow the course tiers; inside a tier, anything built on another lesson of the same tier
  // goes one row lower, so every arrow points downwards.
  const sub = new Map<string, number>();
  const d = (id: string): number => {
    if (sub.has(id)) return sub.get(id)!;
    const c = byId.get(id)!;
    const same = c.prereqs.filter((p) => byId.get(p)!.tier === c.tier);
    const v = same.length ? 1 + Math.max(...same.map(d)) : 0;
    sub.set(id, v);
    return v;
  };
  CONCEPTS.forEach((c) => d(c.id));
  const keys = [...new Set(CONCEPTS.map((c) => `${String(c.tier).padStart(2, '0')}.${sub.get(c.id)}`))].sort();
  const rows: Concept[][] = keys.map((k) => CONCEPTS.filter((c) => `${String(c.tier).padStart(2, '0')}.${sub.get(c.id)}` === k));
  const maxRow = Math.max(...rows.map((r) => r.length));
  const width = (maxRow + 1) * (W + GX) + GX + LABEL;
  const cx = new Map<string, number>(); // centre x of each node
  rows.forEach((row) => {
    // Want each node under the average of what it's built from; then pack left to right without overlap.
    const want = row.map((c) => {
      const ps = c.prereqs.map((p) => cx.get(p)).filter((v): v is number => v !== undefined);
      return { c, w: ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : width / 2 };
    });
    want.sort((a, b) => a.w - b.w);
    const step = W + GX;
    let xs = want.map((v) => v.w);
    for (let i = 1; i < xs.length; i++) xs[i] = Math.max(xs[i], xs[i - 1] + step);
    // Shift back inside the canvas if the packing ran off either side.
    const over = xs[xs.length - 1] + W / 2 + GX - width;
    if (over > 0) xs = xs.map((v) => v - over);
    for (let i = xs.length - 2; i >= 0; i--) xs[i] = Math.min(xs[i], xs[i + 1] - step);
    const under = LABEL + GX + W / 2 - xs[0];
    if (under > 0) xs = xs.map((v) => v + under);
    want.forEach((v, i) => cx.set(v.c.id, xs[i]));
  });
  const coords = new Map<string, { x: number; y: number }>();
  rows.forEach((row, r) => row.forEach((c) => coords.set(c.id, { x: cx.get(c.id)! - W / 2, y: 24 + r * (H + GY) })));
  const labels = rows.map((row, r) => ({ y: 24 + r * (H + GY) + H / 2 + 4, text: r === 0 || rows[r - 1][0].tier !== row[0].tier ? `Tier ${row[0].tier}` : '' }));
  return { coords, width, height: 24 + rows.length * (H + GY), rows, labels };
}

/** Drop arrows implied by others (A→C when A→B→C exists) so the picture shows only direct steps. */
function directEdges(): [string, string][] {
  const byId = new Map(CONCEPTS.map((c) => [c.id, c]));
  const reach = new Map<string, Set<string>>();
  const ancestors = (id: string): Set<string> => {
    if (reach.has(id)) return reach.get(id)!;
    const out = new Set<string>();
    for (const p of byId.get(id)!.prereqs) {
      out.add(p);
      ancestors(p).forEach((a) => out.add(a));
    }
    reach.set(id, out);
    return out;
  };
  const edges: [string, string][] = [];
  for (const c of CONCEPTS)
    for (const p of c.prereqs) if (!c.prereqs.some((q) => q !== p && ancestors(q).has(p))) edges.push([p, c.id]);
  return edges;
}
const EDGES = directEdges();

const L = layout();

export function PathMap({ progress, onLearn }: { progress: Progress; onLearn: (id: string) => void }) {
  const status = (c: Concept) =>
    isMastered(progress, c.id) ? 'mastered' : progress.learned.includes(c.id) ? 'passed' : isUnlocked(progress, c) ? 'open' : 'locked';
  return (
    <div className="pathmap-wrap">
      <svg className="pathmap" width={L.width} height={L.height} viewBox={`0 0 ${L.width} ${L.height}`}>
        <defs>
          <marker id="pm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0 0 L10 5 L0 10 z" className="pm-arrowfill" />
          </marker>
        </defs>
        {L.labels.map((l, i) =>
          l.text ? (
            <text key={i} x={8} y={l.y} className="pm-tier">
              {l.text}
            </text>
          ) : null,
        )}
        {EDGES.map(([p, cid]) => {
            const c = { id: cid };
            const a = L.coords.get(p)!;
            const b = L.coords.get(c.id)!;
            const x1 = a.x + W / 2;
            const y1 = a.y + H;
            const x2 = b.x + W / 2;
            const y2 = b.y;
            const my = (y1 + y2) / 2;
            const lit = progress.learned.includes(p);
            return <path key={`${p}-${c.id}`} d={`M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2 - 2}`} className={`pm-edge ${lit ? 'lit' : ''}`} markerEnd="url(#pm-arrow)" />;
          })}
        {CONCEPTS.map((c) => {
          const { x, y } = L.coords.get(c.id)!;
          const st = status(c);
          const clickable = st !== 'locked';
          return (
            <g
              key={c.id}
              className={`pm-node pm-${st} ${c.kind === 'algorithm' ? 'pm-algo' : ''}`}
              transform={`translate(${x} ${y})`}
              onClick={clickable ? () => onLearn(c.id) : undefined}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              onKeyDown={clickable ? (e) => (e.key === 'Enter' || e.key === ' ') && onLearn(c.id) : undefined}
            >
              <title>{`${c.kind === 'algorithm' ? 'Algorithm. ' : ''}${c.title}: ${st === 'locked' ? 'locked (needs ' + c.prereqs.map((p) => CONCEPTS.find((o) => o.id === p)?.title).join(', ') + ')' : st}. ${c.tagline}`}</title>
              <rect width={W} height={H} rx={c.kind === 'algorithm' ? H / 2 : 8} />
              <text x={W / 2} y={19} textAnchor="middle" className="pm-title">
                {c.title.length > 18 ? c.title.slice(0, 17) + '…' : c.title}
              </text>
              <text x={W / 2} y={36} textAnchor="middle" className="pm-sub">
                {st === 'mastered' ? '★ mastered' : st === 'passed' ? '✓ passed' : st === 'open' ? 'start here' : '🔒 locked'}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
