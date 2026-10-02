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

/** The four card types every structure has hand-written generators for. */
export type CoreCardType = 'predict' | 'simulate' | 'count' | 'explain';
/** Card types built mostly from each structure's `extras` (plus some hand-written instance cards). */
export type ExtraCardType = 'break' | 'choose' | 'connect' | 'rebuild' | 'transfer';
export type CardType = CoreCardType | ExtraCardType;

export const CORE_CARD_TYPES: CoreCardType[] = ['predict', 'simulate', 'count', 'explain'];
export const CARD_TYPES: CardType[] = ['predict', 'simulate', 'count', 'break', 'explain', 'connect', 'choose', 'rebuild', 'transfer'];

export const CARD_TYPE_INFO: Record<CardType, { name: string; blurb: string; how: string }> = {
  predict: { name: 'Predict', blurb: 'Commit to what happens before you see it.', how: 'Work out what will happen, then pick your answer. Guess honestly first; that’s how it sticks.' },
  simulate: { name: 'Simulate', blurb: 'You are the CPU. Do the operation by hand.', how: 'Do the operation yourself: click the boxes (or put the steps in order) exactly as the computer would, one at a time.' },
  count: { name: 'Count', blurb: 'Count the work. Work out the cost yourself.', how: 'Work out how much work it takes: how many boxes are read or written, or how the work grows as the data grows.' },
  break: { name: 'Break it', blurb: 'Break the rule and see what fails.', how: 'Someone broke the structure’s rule. Work out what goes wrong (or find the part that breaks it).' },
  explain: { name: 'Explain', blurb: 'Put together the reason it works.', how: 'Build the explanation: pick the true statements, spot the false one, or put the reasoning in order.' },
  connect: { name: 'Connect', blurb: 'What is it built from?', how: 'Say what this structure is made of: which simpler pieces it combines.' },
  choose: { name: 'Choose', blurb: 'Pick the right structure for the job.', how: 'Read the situation and pick the structure that fits it best.' },
  rebuild: { name: 'Rebuild', blurb: 'Rebuild it from memory.', how: 'From memory, rebuild the structure (or its key facts) without looking anything up.' },
  transfer: { name: 'Transfer', blurb: 'Adapt it to a new problem.', how: 'A new problem you haven’t seen: pick how you’d use or adapt this structure to solve it.' },
};

/** The five skills of mastery, each fed by some card types. */
export type Skill = 'mechanism' | 'invariant' | 'cost' | 'tradeoff' | 'application';
export const SKILLS: { id: Skill; name: string; types: CardType[] }[] = [
  { id: 'mechanism', name: 'Mechanism', types: ['predict', 'simulate', 'rebuild'] },
  { id: 'invariant', name: 'Invariant', types: ['break', 'explain'] },
  { id: 'cost', name: 'Cost', types: ['count'] },
  { id: 'tradeoff', name: 'Tradeoff', types: ['choose', 'connect'] },
  { id: 'application', name: 'Application', types: ['transfer'] },
];

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
  /** Guided steps in plain language: what to do, and what it shows you. */
  guide: { do: string; see: string }[];
}

/** Hand-written facts that drive the generic Break / Choose / Connect / Transfer cards. */
export interface ConceptExtras {
  /** Structures in the same family are never used as each other's wrong answers in Choose cards. */
  family: string;
  /** Which primitive it rests on. */
  primitive: 'slots' | 'links' | 'both' | 'bits' | 'abstract';
  /** 2–4 building blocks, each a short phrase. */
  parts: string[];
  /** Situations where this structure is the best pick. */
  uses: string[];
  /** Other concept ids that would also be reasonable for these uses (never offered as wrong answers). */
  rivals?: string[];
  /** Break the invariant: what goes wrong? */
  breaks: { violation: string; result: string; wrong: string[] }[];
  /** A new problem this structure (or a small variant) solves. */
  transfer: { problem: string; answer: string; wrong: { text: string; why: string }[]; explain: string }[];
}

export interface Concept {
  id: string;
  title: string;
  /** Data structures are the default; algorithms come after the structures they use; systems topics (OS, databases,
   *  networking, system design) come after everything they build on. */
  kind?: 'algorithm' | 'systems';
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
  /** Hand-written generators. The core four are required; extra types are optional additions. */
  generators: Record<CoreCardType, CardGenerator[]> & Partial<Record<ExtraCardType, CardGenerator[]>>;
  /** Filled in from content/extras.ts when concepts are registered. */
  extras?: ConceptExtras;
  /** The teaching text shown first in the lesson. Filled in from content/learn.ts. */
  learn?: { what: string; how: string[] };
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
  'Operating systems',
  'Databases',
  'Networking',
];
