import type { CardType, Concept, Skill } from './types';
import { CARD_TYPES, SKILLS } from './types';
import { shuffle } from './random';

/** How sure the learner was *before* answering. */
export type Confidence = 1 | 2 | 3; // guessing, fairly sure, certain

export interface ItemState {
  /** 0..MAX_LEVEL. Each level waits longer before coming back. */
  level: number;
  due: number;
  seen: number;
  correct: number;
  /** Times the learner was certain and wrong: a misconception, not a slip. */
  confidentMisses: number;
}

/** One answered card, kept for the calibration dashboard. */
export interface LogEntry {
  t: number;
  concept: string;
  type: CardType;
  correct: boolean;
  confidence: Confidence;
}

export interface Progress {
  learned: string[];
  items: Record<string, ItemState>;
  log: LogEntry[];
}

const MAX_LOG = 5000;

export const MAX_LEVEL = 5;
const DAY = 24 * 60 * 60 * 1000;
/** Days to wait after reaching each level. */
const INTERVAL_DAYS = [0, 1, 3, 7, 16, 35];

const KEY = 'dslearning:v1';

export const itemKey = (concept: string, type: CardType) => `${concept}:${type}`;

export const emptyProgress = (): Progress => ({ learned: [], items: {}, log: [] });

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    const p = JSON.parse(raw) as Progress;
    return { learned: p.learned ?? [], items: p.items ?? {}, log: p.log ?? [] };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Storage unavailable (private mode etc.) — progress lives for this tab only.
  }
}

export const newItem = (now: number): ItemState => ({ level: 0, due: now, seen: 0, correct: 0, confidentMisses: 0 });

/**
 * Schedule the next review.
 * - Right and sure: move up a level (wait longer).
 * - Right but guessing: stay put. A lucky guess doesn't prove understanding.
 * - Wrong: back to level 0, due now. Wrong *and certain* is recorded as a misconception.
 */
export function scheduleAnswer(item: ItemState, correct: boolean, confidence: Confidence, now: number): ItemState {
  const next = { ...item, seen: item.seen + 1 };
  if (correct) {
    next.correct++;
    if (confidence >= 2) next.level = Math.min(MAX_LEVEL, item.level + 1);
    next.due = now + INTERVAL_DAYS[next.level] * DAY;
  } else {
    next.level = 0;
    next.due = now;
    if (confidence === 3) next.confidentMisses++;
  }
  return next;
}

export function recordAnswer(
  p: Progress,
  concept: string,
  type: CardType,
  correct: boolean,
  confidence: Confidence,
  now = Date.now(),
): Progress {
  const key = itemKey(concept, type);
  const item = p.items[key] ?? newItem(now);
  const log = [...p.log, { t: now, concept, type, correct, confidence }].slice(-MAX_LOG);
  return { ...p, items: { ...p.items, [key]: scheduleAnswer(item, correct, confidence, now) }, log };
}

export function markLearned(p: Progress, concept: string): Progress {
  if (p.learned.includes(concept)) return p;
  return { ...p, learned: [...p.learned, concept] };
}

export const isUnlocked = (p: Progress, c: Concept) => c.prereqs.every((id) => p.learned.includes(id));

/** 0..1 strength for a concept's skill, for the understanding map. */
export function strength(p: Progress, concept: string, type: CardType): number {
  const item = p.items[itemKey(concept, type)];
  return item ? item.level / MAX_LEVEL : 0;
}

/** 0..1 strength of one of the five skills: the average level of the card types that feed it. */
export function skillStrength(p: Progress, concept: string, skill: Skill): number {
  const types = SKILLS.find((s) => s.id === skill)!.types;
  return types.reduce((sum, t) => sum + strength(p, concept, t), 0) / types.length;
}

export interface Calibration {
  confidence: Confidence;
  answered: number;
  correct: number;
}

/** How often you were right at each confidence level. Well calibrated: guess < fairly sure < certain ≈ 100%. */
export function calibration(p: Progress): Calibration[] {
  return ([1, 2, 3] as Confidence[]).map((confidence) => {
    const xs = p.log.filter((e) => e.confidence === confidence);
    return { confidence, answered: xs.length, correct: xs.filter((e) => e.correct).length };
  });
}

/** Accuracy per card type. */
export function accuracyByType(p: Progress): { type: CardType; answered: number; correct: number }[] {
  return CARD_TYPES.map((type) => {
    const xs = p.log.filter((e) => e.type === type);
    return { type, answered: xs.length, correct: xs.filter((e) => e.correct).length };
  });
}

/** Concept × card type pairs with confident misses, worst first. */
export function misconceptions(p: Progress): { concept: string; type: CardType; count: number }[] {
  return Object.entries(p.items)
    .filter(([, it]) => it.confidentMisses > 0)
    .map(([k, it]) => {
      const i = k.lastIndexOf(':');
      return { concept: k.slice(0, i), type: k.slice(i + 1) as CardType, count: it.confidentMisses };
    })
    .sort((a, b) => b.count - a.count);
}

export interface ReviewItem {
  concept: string;
  type: CardType;
}

/** Items due for review, weakest and misconception-heavy first. */
export function dueItems(p: Progress, now = Date.now()): ReviewItem[] {
  const out: (ReviewItem & { item: ItemState })[] = [];
  for (const concept of p.learned) {
    for (const type of CARD_TYPES) {
      const item = p.items[itemKey(concept, type)] ?? newItem(now);
      if (item.due <= now) out.push({ concept, type, item });
    }
  }
  // Shuffle first so equal-priority items come up in a random order (the sort is stable).
  const mixed = shuffle(out);
  mixed.sort(
    (a, b) =>
      b.item.confidentMisses - a.item.confidentMisses || a.item.level - b.item.level || a.item.due - b.item.due,
  );
  return mixed.map(({ concept, type }) => ({ concept, type }));
}

/** When nothing is due: the weakest learned skills, so there's always something to practise. */
export function weakestItems(p: Progress, count: number): ReviewItem[] {
  const all: (ReviewItem & { level: number })[] = [];
  for (const concept of p.learned)
    for (const type of CARD_TYPES) all.push({ concept, type, level: p.items[itemKey(concept, type)]?.level ?? 0 });
  all.sort((a, b) => a.level - b.level || Math.random() - 0.5);
  return all.slice(0, count).map(({ concept, type }) => ({ concept, type }));
}

/**
 * Interleave: reorder so the same concept doesn't come up twice in a row where avoidable.
 * Mixing topics forces you to recognise *which* idea applies, not just repeat the last one.
 */
export function interleave(items: ReviewItem[]): ReviewItem[] {
  const pool = [...items];
  const out: ReviewItem[] = [];
  while (pool.length) {
    const prev = out[out.length - 1]?.concept;
    const idx = pool.findIndex((x) => x.concept !== prev);
    out.push(pool.splice(idx === -1 ? 0 : idx, 1)[0]);
  }
  return out;
}
