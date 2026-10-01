/**
 * A tiny 2D animation model. An animation is a list of frames; each frame is a set of boxes, arrows and
 * texts with stable ids plus one caption. The player tweens between consecutive frames: anything with the
 * same id slides to its new place, new things fade in, removed things fade out, and arrows follow the boxes
 * they connect. Scripts never deal with time; they just describe states with the `Stage` builder.
 */

export type Tone = 'plain' | 'accent' | 'ok' | 'bad' | 'warn' | 'hl' | 'dim' | 'ptr' | 'ghost';

export interface ABox {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  /** Small text under the box. */
  sub?: string;
  /** Small text above the box (an index, an address). */
  top?: string;
  tone?: Tone;
  /** rect: a value. circle: a tree/graph node. slot: an empty place (dashed). tag: a named pointer/variable.
   *  frame: a labelled region drawn behind everything (memory, a bucket, "the stack"). */
  shape?: 'rect' | 'circle' | 'slot' | 'tag' | 'frame';
  mono?: boolean;
}

export interface AArrow {
  from: string;
  to: string;
  tone?: Tone;
  label?: string;
  /** Sideways bend of the curve, in px (negative bends the other way). */
  bend?: number;
  dashed?: boolean;
  /** A plain line with no arrow head (tree edges, undirected graph edges). */
  line?: boolean;
}

export interface AText {
  x: number;
  y: number;
  text: string;
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg';
  anchor?: 'start' | 'middle' | 'end';
  bold?: boolean;
}

export interface Frame {
  boxes: Record<string, ABox>;
  arrows: Record<string, AArrow>;
  texts: Record<string, AText>;
  say: string;
}

export interface Anim {
  title: string;
  frames: Frame[];
  view: { x: number; y: number; w: number; h: number };
}

export type AnimScript = () => Anim;

export const BOX = { w: 44, h: 40 };

/** Builds frames by mutating a current state and snapshotting it with `say`. */
export class Stage {
  boxes: Record<string, ABox> = {};
  arrows: Record<string, AArrow> = {};
  texts: Record<string, AText> = {};
  frames: Frame[] = [];

  /** Add a box, or update an existing one (props are merged). */
  box(id: string, props: Partial<ABox>): this {
    const old = this.boxes[id];
    this.boxes[id] = { ...(old ?? { x: 0, y: 0, w: BOX.w, h: BOX.h }), ...props };
    return this;
  }
  /** Update a box that must exist. */
  set(id: string, props: Partial<ABox>): this {
    if (!this.boxes[id]) throw new Error(`no box ${id}`);
    return this.box(id, props);
  }
  move(id: string, x: number, y: number): this {
    return this.set(id, { x, y });
  }
  tone(ids: string | string[], tone: Tone): this {
    for (const id of typeof ids === 'string' ? [ids] : ids) this.set(id, { tone });
    return this;
  }
  /** Remove boxes, arrows or texts by id. Arrows attached to removed boxes go too. */
  del(...ids: string[]): this {
    for (const id of ids) {
      delete this.boxes[id];
      delete this.arrows[id];
      delete this.texts[id];
      for (const [aid, a] of Object.entries(this.arrows)) if (a.from === id || a.to === id) delete this.arrows[aid];
    }
    return this;
  }
  arrow(id: string, from: string, to: string, props: Partial<AArrow> = {}): this {
    this.arrows[id] = { ...(this.arrows[id] ?? {}), from, to, ...props };
    return this;
  }
  text(id: string, x: number, y: number, text: string, props: Partial<AText> = {}): this {
    this.texts[id] = { ...(this.texts[id] ?? {}), x, y, text, ...props };
    return this;
  }
  has(id: string): boolean {
    return id in this.boxes || id in this.arrows || id in this.texts;
  }
  /** Snapshot the current state as the next frame, with its caption. */
  say(caption: string): this {
    this.frames.push(structuredClone({ boxes: this.boxes, arrows: this.arrows, texts: this.texts, say: caption }));
    return this;
  }
  build(title: string): Anim {
    if (!this.frames.length) throw new Error('animation has no frames');
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    const grow = (a: number, b: number, c: number, d: number) => {
      x0 = Math.min(x0, a);
      y0 = Math.min(y0, b);
      x1 = Math.max(x1, c);
      y1 = Math.max(y1, d);
    };
    for (const f of this.frames) {
      for (const b of Object.values(f.boxes)) {
        const titleW = b.shape === 'frame' && b.label ? b.label.length * 7.6 + 8 : 0;
        const half = Math.max(b.top?.length ?? 0, b.sub?.length ?? 0) * 3.4;
        const cx = b.x + b.w / 2;
        grow(Math.min(b.x, cx - half), b.y - (b.top ? 16 : 0) - (b.shape === 'frame' ? 18 : 0), Math.max(b.x + b.w, b.x + titleW, cx + half), b.y + b.h + (b.sub ? 16 : 0));
      }
      for (const t of Object.values(f.texts)) {
        const w = t.text.length * (t.size === 'lg' ? 9.5 : t.size === 'sm' ? 6.5 : 7.8);
        const left = t.anchor === 'middle' ? t.x - w / 2 : t.anchor === 'end' ? t.x - w : t.x;
        grow(left, t.y - 14, left + w, t.y + 5);
      }
      for (const a of Object.values(f.arrows)) if (a.bend) {
        const p = f.boxes[a.from];
        const q = f.boxes[a.to];
        if (p && q) {
          const c = control(center(p), center(q), a.bend);
          grow(c.x - 4, c.y - 4, c.x + 4, c.y + 4);
        }
      }
    }
    const m = 14;
    return { title, frames: this.frames, view: { x: x0 - m, y: y0 - m, w: x1 - x0 + 2 * m, h: y1 - y0 + 2 * m } };
  }
}

// ---------- geometry ----------

export interface Pt {
  x: number;
  y: number;
}
export const center = (b: ABox): Pt => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

export function control(p: Pt, q: Pt, bend: number): Pt {
  const mx = (p.x + q.x) / 2;
  const my = (p.y + q.y) / 2;
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: mx - (dy / len) * bend, y: my + (dx / len) * bend };
}

/** Where a ray from the box centre towards `toward` leaves the box. */
export function edgePoint(b: ABox, toward: Pt): Pt {
  const c = center(b);
  const dx = toward.x - c.x;
  const dy = toward.y - c.y;
  if (!dx && !dy) return c;
  if (b.shape === 'circle') {
    const r = Math.min(b.w, b.h) / 2;
    const len = Math.hypot(dx, dy);
    return { x: c.x + (dx / len) * r, y: c.y + (dy / len) * r };
  }
  const s = Math.min(dx ? b.w / 2 / Math.abs(dx) : Infinity, dy ? b.h / 2 / Math.abs(dy) : Infinity);
  return { x: c.x + dx * s, y: c.y + dy * s };
}

/** SVG path for an arrow between two boxes, plus the point where its label goes. */
export function arrowPath(p: ABox, q: ABox, bend = 0): { d: string; mid: Pt } {
  const pc = center(p);
  const qc = center(q);
  if (!bend) {
    const a = edgePoint(p, qc);
    const b = edgePoint(q, pc);
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    // Stop just short of the target so the arrow head sits on its edge.
    const e = { x: b.x - ((b.x - a.x) / len) * 2, y: b.y - ((b.y - a.y) / len) * 2 };
    return { d: `M${a.x} ${a.y} L${e.x} ${e.y}`, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
  }
  const c = control(pc, qc, bend);
  const a = edgePoint(p, c);
  const b = edgePoint(q, c);
  return { d: `M${a.x} ${a.y} Q${c.x} ${c.y} ${b.x} ${b.y}`, mid: { x: (a.x + 2 * c.x + b.x) / 4, y: (a.y + 2 * c.y + b.y) / 4 } };
}

// ---------- tweening ----------

export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export interface Shown<T> {
  id: string;
  v: T;
  opacity: number;
}

/** The scene part-way between two frames. t = 0 gives `a`, t = 1 gives `b`. */
export function between(a: Frame, b: Frame, t: number) {
  const e = ease(t);
  const boxes: Shown<ABox>[] = [];
  const all = new Set([...Object.keys(a.boxes), ...Object.keys(b.boxes)]);
  for (const id of all) {
    const p = a.boxes[id];
    const q = b.boxes[id];
    if (p && q)
      boxes.push({
        id,
        opacity: 1,
        v: { ...(e < 0.5 ? p : q), x: lerp(p.x, q.x, e), y: lerp(p.y, q.y, e), w: lerp(p.w, q.w, e), h: lerp(p.h, q.h, e), tone: e < 0.35 ? p.tone : q.tone },
      });
    else if (q) boxes.push({ id, opacity: e, v: { ...q, y: q.y - 18 * (1 - e) } });
    else if (p) boxes.push({ id, opacity: 1 - e, v: p });
  }
  const at = new Map(boxes.map((s) => [s.id, s]));
  const arrows: (Shown<AArrow> & { p: ABox; q: ABox })[] = [];
  for (const id of new Set([...Object.keys(a.arrows), ...Object.keys(b.arrows)])) {
    const x = a.arrows[id];
    const y = b.arrows[id];
    const v = y && (!x || e >= 0.5 || (x.from === y.from && x.to === y.to)) ? y : x!;
    const p = at.get(v.from);
    const q = at.get(v.to);
    if (!p || !q) continue;
    let op = Math.min(p.opacity, q.opacity);
    if (x && y && (x.from !== y.from || x.to !== y.to)) op *= Math.abs(1 - 2 * e); // re-aimed: fade out, then in
    else if (!x) op *= e;
    else if (!y) op *= 1 - e;
    arrows.push({ id, v: { ...v, bend: x && y ? lerp(x.bend ?? 0, y.bend ?? 0, e) : v.bend }, opacity: op, p: p.v, q: q.v });
  }
  const texts: Shown<AText>[] = [];
  for (const id of new Set([...Object.keys(a.texts), ...Object.keys(b.texts)])) {
    const p = a.texts[id];
    const q = b.texts[id];
    if (p && q) texts.push({ id, opacity: p.text === q.text ? 1 : Math.abs(1 - 2 * e), v: { ...(e < 0.5 ? p : q), x: lerp(p.x, q.x, e), y: lerp(p.y, q.y, e) } });
    else if (q) texts.push({ id, opacity: e, v: q });
    else if (p) texts.push({ id, opacity: 1 - e, v: p });
  }
  return { boxes, arrows, texts };
}
