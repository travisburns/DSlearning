import type { ReactNode } from 'react';
import type { Cell, Scene, TreeNode, Val, View } from '../engine/types';
import { walkList } from '../engine/memory';

interface Props {
  scene: Scene;
  onTarget?: (id: string) => void;
  /** Targets already done in a click task, shown numbered. */
  done?: string[];
  /** Briefly flash a wrong target. */
  wrong?: string | null;
}

type Ctx = Required<Pick<Props, 'done'>> & Omit<Props, 'scene' | 'done'> & { hl: Set<string> };

const cls = (ctx: Ctx, id: string, base: string) => {
  const parts = [base];
  if (ctx.hl.has(id)) parts.push('hl');
  if (ctx.done.includes(id)) parts.push('done');
  if (ctx.wrong === id) parts.push('wrong');
  if (ctx.onTarget) parts.push('clickable');
  return parts.join(' ');
};

function Target({ id, ctx, className, children, title }: { id: string; ctx: Ctx; className: string; children: ReactNode; title?: string }) {
  const order = ctx.done.indexOf(id);
  const content = (
    <>
      {children}
      {order >= 0 && <span className="badge">{order + 1}</span>}
    </>
  );
  if (!ctx.onTarget)
    return (
      <div className={cls(ctx, id, className)} title={title}>
        {content}
      </div>
    );
  return (
    <button type="button" className={cls(ctx, id, className)} onClick={() => ctx.onTarget!(id)} title={title}>
      {content}
    </button>
  );
}

const showVal = (v: Val) => (v === null || v === undefined ? '' : String(v));

function cellText(c: Cell) {
  if (c.kind === 'ptr') return c.v === null ? '∅' : `→${c.v}`;
  return c.v === null ? '' : String(c.v);
}

function MemoryTape({ scene, ctx }: { scene: Scene; ctx: Ctx }) {
  const cells = scene.cells ?? [];
  const markersAt = new Map<number, string[]>();
  for (const mk of scene.markers ?? []) markersAt.set(mk.addr, [...(markersAt.get(mk.addr) ?? []), mk.name]);
  return (
    <div className="view">
      <div className="view-title">Memory</div>
      <div className="tape">
        {cells.map((c, addr) => (
          <div className="tape-slot" key={addr}>
            <div className="marker">{markersAt.get(addr)?.join(', ') ?? ''}</div>
            <Target id={`m:${addr}`} ctx={ctx} className={`cell k-${c.kind}${c.kind === 'free' && c.v !== null ? ' garbage' : ''}`}>
              <span className="addr">{addr}</span>
              <span className="cv">{cellText(c)}</span>
              <span className="clabel">{c.label ?? ''}</span>
            </Target>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArrayBoxes({ cells, v, ctx }: { cells: Cell[]; v: Extract<View, { type: 'array' }>; ctx: Ctx }) {
  const cap = v.capacity ?? v.length;
  return (
    <div className="view">
      <div className="view-title">{v.title ?? 'Array'}: length {v.length}{v.capacity !== undefined ? `, capacity ${cap}` : ''}</div>
      <div className="row">
        {Array.from({ length: cap }, (_, k) => {
          const addr = v.base + k;
          const used = k < v.length;
          return (
            <div className="row-slot" key={k}>
              <Target id={`m:${addr}`} ctx={ctx} className={`box${used ? '' : ' unused'}`}>
                {used ? cellText(cells[addr]) : ''}
              </Target>
              <div className="idx">[{k}]</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListNodes({ cells, v, ctx }: { cells: Cell[]; v: Extract<View, { type: 'list' }>; ctx: Ctx }) {
  const nextOff = v.doubly ? 2 : 1;
  const nodes = walkList(cells, v.head, nextOff);
  return (
    <div className="view">
      <div className="view-title">{v.title ?? (v.doubly ? 'Doubly linked list' : 'Linked list')}</div>
      <div className="list">
        <span className="list-head">head</span>
        <span className="arrow">{v.doubly ? '⇄' : '→'}</span>
        {nodes.map((a) => (
          <span className="list-item" key={a}>
            <Target id={`m:${a}`} ctx={ctx} className="node" title={`node at address ${a}`}>
              <span className="nv">{cells[a].v}</span>
              <span className="naddr">@{a}</span>
            </Target>
            <span className="arrow">{v.doubly ? '⇄' : '→'}</span>
          </span>
        ))}
        <span className="nil">∅</span>
      </div>
    </div>
  );
}

function StackCol({ cells, v, ctx }: { cells: Cell[]; v: Extract<View, { type: 'stack' }>; ctx: Ctx }) {
  const slots = Array.from({ length: v.capacity }, (_, k) => k).reverse();
  return (
    <div className="view">
      <div className="view-title">{v.title ?? 'Stack'}: top = {v.top}</div>
      <div className="stack">
        {slots.map((k) => (
          <div className="stack-slot" key={k}>
            <span className="idx">[{k}]</span>
            <Target id={`m:${v.base + k}`} ctx={ctx} className={`box${k < v.top ? '' : ' unused'}`}>
              {k < v.top ? cellText(cells[v.base + k]) : ''}
            </Target>
            <span className="ptr-tag">{k === v.top ? '← top (next free)' : k === v.top - 1 ? '← top item' : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QueueRing({ cells, v, ctx }: { cells: Cell[]; v: Extract<View, { type: 'queue' }>; ctx: Ctx }) {
  const tail = (v.head + v.size) % v.capacity;
  const used = (k: number) => (k - v.head + v.capacity) % v.capacity < v.size;
  return (
    <div className="view">
      <div className="view-title">{v.title ?? 'Circular queue'}: size {v.size} of {v.capacity}</div>
      <div className="row">
        {Array.from({ length: v.capacity }, (_, k) => (
          <div className="row-slot" key={k}>
            <Target id={`m:${v.base + k}`} ctx={ctx} className={`box${used(k) ? '' : ' unused'}`}>
              {used(k) ? cellText(cells[v.base + k]) : ''}
            </Target>
            <div className="idx">[{k}]</div>
            <div className="ptr-tag">
              {[k === v.head ? 'head' : '', k === tail && v.size < v.capacity ? 'tail' : ''].filter(Boolean).join(' / ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RowView({ v, ctx }: { v: Extract<View, { type: 'row' }>; ctx: Ctx }) {
  return (
    <div className="view">
      {v.title && <div className="view-title">{v.title}</div>}
      <div className="row">
        {v.items.map((x, i) => (
          <div className="row-slot" key={i}>
            <Target id={`${v.key}:${i}`} ctx={ctx} className={`box${v.dimFrom !== undefined && i >= v.dimFrom ? ' unused' : ''}${x === null ? ' empty' : ''}`}>
              {showVal(x)}
            </Target>
            <div className="idx">{v.labels ? v.labels[i] : `[${i}]`}</div>
            <div className="ptr-tag">{(v.pointers ?? []).filter((p) => p.index === i).map((p) => p.name).join(' / ')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GridView({ v, ctx }: { v: Extract<View, { type: 'grid' }>; ctx: Ctx }) {
  return (
    <div className="view">
      {v.title && <div className="view-title">{v.title}</div>}
      <div className="grid-wrap">
        <table className="grid">
          {v.colLabels && (
            <thead>
              <tr>
                {v.rowLabels && <th />}
                {v.colLabels.map((c, i) => (
                  <th key={i}>{c}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {v.rows.map((row, r) => (
              <tr key={r}>
                {v.rowLabels && <th>{v.rowLabels[r]}</th>}
                {row.map((x, c) => (
                  <td key={c}>
                    <Target id={`${v.key}:${r},${c}`} ctx={ctx} className={`box${x === null ? ' empty' : ''}`}>
                      {showVal(x)}
                    </Target>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BucketsView({ v, ctx }: { v: Extract<View, { type: 'buckets' }>; ctx: Ctx }) {
  return (
    <div className="view">
      {v.title && <div className="view-title">{v.title}</div>}
      <div className="buckets">
        {v.buckets.map((b, i) => (
          <div className="bucket" key={i}>
            <Target id={`${v.key}:${i}`} ctx={ctx} className="box bucket-label">
              {v.labels ? v.labels[i] : i}
            </Target>
            {b.map((x, j) => (
              <span className="list-item" key={j}>
                <span className="arrow">→</span>
                <Target id={`${v.key}:${i}.${j}`} ctx={ctx} className="node">
                  <span className="nv">{showVal(x)}</span>
                </Target>
              </span>
            ))}
            <span className="arrow">→</span>
            <span className="nil">∅</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Tree (SVG) ----------

interface Placed {
  node: TreeNode;
  x: number;
  y: number;
  parent?: Placed;
}

function layoutTree(root: TreeNode, binary: boolean): Placed[] {
  const out: Placed[] = [];
  let slot = 0;
  const visit = (n: TreeNode, depth: number, parent?: Placed): Placed => {
    const p: Placed = { node: n, x: 0, y: depth, parent };
    if (binary) {
      const [l, r] = n.children;
      if (l) visit(l, depth + 1, p);
      p.x = slot++;
      if (r) visit(r, depth + 1, p);
    } else {
      const kids = n.children.filter((c): c is TreeNode => !!c).map((c) => visit(c, depth + 1, p));
      p.x = kids.length ? (kids[0].x + kids[kids.length - 1].x) / 2 : slot++;
    }
    out.push(p);
    return p;
  };
  visit(root, 0);
  return out;
}

function TreeView({ v, ctx }: { v: Extract<View, { type: 'tree' }>; ctx: Ctx }) {
  if (!v.root)
    return (
      <div className="view">
        {v.title && <div className="view-title">{v.title}</div>}
        <div className="muted">(empty tree)</div>
      </div>
    );
  const placed = layoutTree(v.root, !!v.binary);
  const W = 52;
  const H = 64;
  const maxX = Math.max(...placed.map((p) => p.x));
  const maxY = Math.max(...placed.map((p) => p.y));
  const width = (maxX + 1) * W + 20;
  const height = (maxY + 1) * H + 20;
  const px = (p: Placed) => 10 + p.x * W + W / 2;
  const py = (p: Placed) => 10 + p.y * H + 22;
  return (
    <div className="view">
      {v.title && <div className="view-title">{v.title}</div>}
      <div className="svg-wrap">
        <svg viewBox={`0 0 ${width} ${height}`} width={width} style={{ maxWidth: '100%' }} className="tree">
          {placed.map(
            (p) => p.parent && <line key={`e${p.node.id}`} x1={px(p.parent)} y1={py(p.parent)} x2={px(p)} y2={py(p)} className="edge" />,
          )}
          {placed.map((p) => {
            const id = `t:${p.node.id}`;
            const order = ctx.done.indexOf(id);
            return (
              <g
                key={p.node.id}
                className={cls(ctx, id, `tnode tone-${p.node.tone ?? 'none'}`)}
                onClick={ctx.onTarget ? () => ctx.onTarget!(id) : undefined}
                role={ctx.onTarget ? 'button' : undefined}
                tabIndex={ctx.onTarget ? 0 : undefined}
                onKeyDown={ctx.onTarget ? (e) => (e.key === 'Enter' || e.key === ' ') && ctx.onTarget!(id) : undefined}
              >
                <circle cx={px(p)} cy={py(p)} r={17} />
                <text x={px(p)} y={py(p) + 4} textAnchor="middle" className="tlabel">
                  {p.node.label}
                </text>
                {p.node.note && (
                  <text x={px(p)} y={py(p) + 31} textAnchor="middle" className="tnote">
                    {p.node.note}
                  </text>
                )}
                {order >= 0 && (
                  <text x={px(p) + 16} y={py(p) - 12} className="tbadge">
                    {order + 1}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ---------- Graph (SVG, circular layout) ----------

function GraphView({ v, ctx }: { v: Extract<View, { type: 'graph' }>; ctx: Ctx }) {
  const n = v.nodes.length;
  const R = Math.max(70, n * 16);
  const size = 2 * R + 60;
  const pos = new Map(v.nodes.map((node, i) => [node.id, { x: size / 2 + R * Math.cos((2 * Math.PI * i) / n - Math.PI / 2), y: size / 2 + R * Math.sin((2 * Math.PI * i) / n - Math.PI / 2) }]));
  return (
    <div className="view">
      {v.title && <div className="view-title">{v.title}</div>}
      <div className="svg-wrap">
        <svg viewBox={`0 0 ${size} ${size}`} width={size} style={{ maxWidth: '100%' }} className="graph">
          <defs>
            <marker id="arrowhead" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" className="arrowfill" />
            </marker>
          </defs>
          {v.edges.map((e, i) => {
            const a = pos.get(e.from)!;
            const b = pos.get(e.to)!;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const r = 18;
            const x1 = a.x + (dx / len) * r;
            const y1 = a.y + (dy / len) * r;
            const x2 = b.x - (dx / len) * (r + (v.directed ? 2 : 0));
            const y2 = b.y - (dy / len) * (r + (v.directed ? 2 : 0));
            return (
              <g key={i}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} className="edge" markerEnd={v.directed ? 'url(#arrowhead)' : undefined} />
                {e.w !== undefined && (
                  <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 4} textAnchor="middle" className="ew">
                    {e.w}
                  </text>
                )}
              </g>
            );
          })}
          {v.nodes.map((node) => {
            const p = pos.get(node.id)!;
            const id = `g:${node.id}`;
            const order = ctx.done.indexOf(id);
            return (
              <g
                key={node.id}
                className={cls(ctx, id, 'tnode')}
                onClick={ctx.onTarget ? () => ctx.onTarget!(id) : undefined}
                role={ctx.onTarget ? 'button' : undefined}
                tabIndex={ctx.onTarget ? 0 : undefined}
                onKeyDown={ctx.onTarget ? (e) => (e.key === 'Enter' || e.key === ' ') && ctx.onTarget!(id) : undefined}
              >
                <circle cx={p.x} cy={p.y} r={18} />
                <text x={p.x} y={p.y + 4} textAnchor="middle" className="tlabel">
                  {node.label}
                </text>
                {order >= 0 && (
                  <text x={p.x + 16} y={p.y - 14} className="tbadge">
                    {order + 1}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function SceneView({ scene, onTarget, done = [], wrong = null }: Props) {
  const ctx: Ctx = { onTarget, done, wrong, hl: new Set(scene.highlight ?? []) };
  const cells = scene.cells ?? [];
  return (
    <div className="scene">
      {scene.views.map((v, i) => {
        switch (v.type) {
          case 'memory':
            return <MemoryTape key={i} scene={scene} ctx={ctx} />;
          case 'array':
            return <ArrayBoxes key={i} cells={cells} v={v} ctx={ctx} />;
          case 'list':
            return <ListNodes key={i} cells={cells} v={v} ctx={ctx} />;
          case 'stack':
            return <StackCol key={i} cells={cells} v={v} ctx={ctx} />;
          case 'queue':
            return <QueueRing key={i} cells={cells} v={v} ctx={ctx} />;
          case 'row':
            return <RowView key={i} v={v} ctx={ctx} />;
          case 'grid':
            return <GridView key={i} v={v} ctx={ctx} />;
          case 'buckets':
            return <BucketsView key={i} v={v} ctx={ctx} />;
          case 'tree':
            return <TreeView key={i} v={v} ctx={ctx} />;
          case 'graph':
            return <GraphView key={i} v={v} ctx={ctx} />;
          case 'text':
            return (
              <pre key={i} className="view text-view">
                {v.text}
              </pre>
            );
        }
      })}
    </div>
  );
}
