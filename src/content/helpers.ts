import type { Card, CardGenerator, ChoiceOption } from '../engine/types';
import { pick, shuffle } from '../engine/random';

/** Build a single-answer option list: one correct answer + unique distractors, shuffled, max 4. */
export function options(correct: { text: string; why?: string }, distractors: { text: string; why?: string }[]): ChoiceOption[] {
  const seen = new Set([correct.text]);
  const ds: ChoiceOption[] = [];
  for (const d of shuffle(distractors)) {
    if (seen.has(d.text)) continue;
    seen.add(d.text);
    ds.push({ ...d, correct: false });
    if (ds.length === 3) break;
  }
  return shuffle([{ ...correct, correct: true }, ...ds]);
}

/** Numeric distractors near the true value that correspond to common off-by-one / wrong-model mistakes. */
export function numberOptions(answer: number, wrong: { value: number; why: string }[], why: string): ChoiceOption[] {
  return options(
    { text: String(answer), why },
    wrong.filter((w) => w.value !== answer && w.value >= 0).map((w) => ({ text: String(w.value), why: w.why })),
  );
}

export const GROWTH = ['O(1) — same work no matter how big', 'O(log n) — grows slowly', 'O(n) — grows with the size', 'O(n²) — grows with the square'] as const;
export type Growth = 0 | 1 | 2 | 3;

/**
 * "Here are the measured touch counts at several sizes. What's the growth?"
 * The learner names the pattern they see; Big-O is only a name for it.
 */
export function growthCard(
  concept: string,
  opName: string,
  measure: (n: number) => number,
  growth: Growth,
  explain: string,
): Card {
  const sizes = [4, 8, 16, 32];
  const rows = sizes.map((n) => `n = ${n}: ${measure(n)} touches`).join('\n');
  return {
    concept,
    type: 'count',
    prompt: `You measured "${opName}" at different sizes:\n\n${rows}\n\nHow does the work grow?`,
    body: {
      kind: 'choice',
      options: GROWTH.map((text, i) => ({ text, correct: i === growth })),
    },
    explain,
  };
}

// ---------- Explain (programmatic Feynman) ----------

export interface ExplainBank {
  concept: string;
  /** True, core statements. */
  truths: string[];
  /** Tempting but false statements, each with why it's wrong. */
  myths: { text: string; why: string }[];
  /** Cause → effect chains. The learner puts the reasoning in order. */
  chains: { prompt: string; steps: string[] }[];
  /** Plain one-sentence summary vs. worse ones. */
  summary: { best: string; others: { text: string; why: string }[] };
}

/**
 * Feynman without a grader: instead of writing prose, the learner *assembles* the explanation —
 * sorting truth from misconception, ordering the chain of reasoning, and picking the plain summary.
 * Every piece is checked by code.
 */
export function explainGenerators(b: ExplainBank): CardGenerator[] {
  const pickTrue: CardGenerator = () => {
    const truths = shuffle(b.truths).slice(0, 2);
    const myths = shuffle(b.myths).slice(0, 2);
    return {
      concept: b.concept,
      type: 'explain',
      prompt: 'Build the explanation: select every statement that is TRUE.',
      body: {
        kind: 'choice',
        multi: true,
        options: shuffle([
          ...truths.map((text) => ({ text, correct: true })),
          ...myths.map((m) => ({ text: m.text, correct: false, why: m.why })),
        ]),
      },
      explain: 'A real explanation keeps the true pieces and throws out the misconceptions. Read why each false one fails.',
    };
  };

  const spotMyth: CardGenerator = () => {
    const myth = pick(b.myths);
    const truths = shuffle(b.truths).slice(0, 3);
    return {
      concept: b.concept,
      type: 'explain',
      prompt: 'One of these is a misconception. Which one?',
      body: {
        kind: 'choice',
        options: shuffle([{ text: myth.text, correct: true, why: myth.why }, ...truths.map((text) => ({ text, correct: false, why: 'This one is true.' }))]),
      },
      explain: myth.why,
    };
  };

  const chain: CardGenerator = () => {
    const c = pick(b.chains);
    return {
      concept: b.concept,
      type: 'explain',
      prompt: `${c.prompt}\n\nPut the reasoning in order, from cause to effect.`,
      body: { kind: 'order', steps: c.steps },
      explain: c.steps.map((s, i) => `${i + 1}. ${s}`).join('\n'),
    };
  };

  const summary: CardGenerator = () => ({
    concept: b.concept,
    type: 'explain',
    prompt: 'Explain it to a 12-year-old in one sentence. Which is the best?',
    body: { kind: 'choice', options: options({ text: b.summary.best, why: 'Plain words, and it says *why*.' }, b.summary.others) },
    explain: b.summary.best,
  });

  return [pickTrue, spotMyth, chain, summary];
}
