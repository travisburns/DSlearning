// ---------- Memory ----------

export type CellKind = 'free' | 'val' | 'ptr' | 'meta';

/** One numbered box of memory. `ptr` cells hold an address (or null = ∅). */
export interface Cell {
  v: number | null;
  kind: CellKind;
  /** Small caption under the cell, e.g. "len", "next". */
  label?: string;
}

/** Named arrow pointing at an address on the memory tape (e.g. "head", "top"). */
export interface Marker {
  name: string;
  addr: number;
}

export type Val = number | string | null;

export interface TreeNode {
  id: string;
  label: string;
  /** For binary trees keep exactly two slots: [left, right], null = empty. */
  children: (TreeNode | null)[];
  /** Small text under the node (height, color, count, …). */
  note?: string;
  /** Optional colour tag: 'red' | 'black' | 'dim' | 'accent'. */
  tone?: 'red' | 'black' | 'dim' | 'accent';
}

/**
 * The views of a scene. Memory-backed views (array/list/stack/queue) are *derived from the cells*,
 * so the picture can never disagree with memory. Self-contained views carry their own data.
 *
 * Click targets are strings:
 *   memory cell `m:<addr>` · row `<key>:<i>` · grid `<key>:<r>,<c>` · bucket `<key>:<b>` / `<key>:<b>.<j>`
 *   tree node `t:<id>` · graph node `g:<id>`
 */
export type View =
  | { type: 'memory' }
  | { type: 'array'; base: number; length: number; capacity?: number; title?: string }
  | { type: 'list'; head: number | null; doubly?: boolean; circular?: boolean; title?: string }
  | { type: 'stack'; base: number; capacity: number; top: number; title?: string }
  | { type: 'queue'; base: number; capacity: number; head: number; size: number; title?: string }
  | { type: 'row'; key: string; items: Val[]; labels?: string[]; pointers?: { name: string; index: number }[]; title?: string; dimFrom?: number }
  | { type: 'grid'; key: string; rows: Val[][]; rowLabels?: string[]; colLabels?: string[]; title?: string }
  | { type: 'buckets'; key: string; buckets: Val[][]; labels?: string[]; title?: string }
  | { type: 'tree'; root: TreeNode | null; binary?: boolean; title?: string }
  | { type: 'graph'; nodes: { id: string; label: string }[]; edges: { from: string; to: string; w?: number | string }[]; directed?: boolean; title?: string }
  | { type: 'text'; text: string };

/** Everything needed to draw the learner's picture. */
export interface Scene {
  /** Raw memory. Present for structures where the memory layout is the lesson. */
  cells?: Cell[];
  views: View[];
  markers?: Marker[];
  /** Click-target ids to highlight (see View docs). */
  highlight?: string[];
}

// ---------- Cards ----------

export type CardType = 'predict' | 'simulate' | 'count' | 'explain';

export const CARD_TYPES: CardType[] = ['predict', 'simulate', 'count', 'explain'];

export const CARD_TYPE_INFO: Record<CardType, { name: string; blurb: string }> = {
  predict: { name: 'Predict', blurb: 'Commit to what happens before you see it.' },
  simulate: { name: 'Simulate', blurb: 'You are the CPU. Do the operation by hand.' },
  count: { name: 'Count', blurb: 'Count the work. Work out the cost yourself.' },
  explain: { name: 'Explain', blurb: 'Put together the reason it works.' },
};

export interface ChoiceOption {
  text: string;
  correct: boolean;
  /** Why this option is right/wrong. Shown after answering. */
  why?: string;
}

export type CardBody =
  | { kind: 'choice'; multi?: boolean; options: ChoiceOption[] }
  | { kind: 'order'; steps: string[] }
  | { kind: 'number'; answer: number; unit?: string }
  | {
      kind: 'click';
      /** Target ids the learner must click, in order. */
      expected: string[];
      /** Scene before any click, then after each correct click. Length = expected.length + 1. */
      frames: Scene[];
      /** Feedback when the learner clicks the wrong target at step i. */
      wrongHint?: (step: number, target: string) => string;
    };

export interface Card {
  concept: string;
  type: CardType;
  prompt: string;
  scene?: Scene;
  body: CardBody;
  /** Shown after the answer, right or wrong. The "why". */
  explain: string;
}

export type CardGenerator = () => Card;

// ---------- Concepts ----------

export interface HookOption {
  text: string;
  /** Mark the idea that leads to this structure. */
  good?: boolean;
  feedback: string;
}

export interface PlaygroundOp {
  label: string;
  /** Names of the numeric inputs this op takes, e.g. ['value'] or ['value', 'index']. */
  inputs?: string[];
  run: (s: Scene, args: number[]) => { scene: Scene; touches: number; note: string } | { error: string };
}

export interface PlaygroundDef {
  initial: () => Scene;
  ops: PlaygroundOp[];
}

export interface Concept {
  id: string;
  title: string;
  tier: number;
  prereqs: string[];
  /** One-line summary shown on the map. */
  tagline: string;
  hook: {
    /** The problem that hurts with what you already know. */
    problem: string;
    question: string;
    options: HookOption[];
  };
  /** The Primitive Lens. */
  lens: { layout: string; invariant: string; payoff: string; price: string };
  playground?: PlaygroundDef;
  generators: Record<CardType, CardGenerator[]>;
}

export const TIERS: string[] = [
  'Primitives',
  'Linear',
  'Restricted interfaces',
  'Hashing',
  'Core trees',
  'Balanced & disk trees',
  'Graphs & groups',
  'Range & spatial',
  'String structures',
  'Probabilistic',
  'Composites & advanced',
];
