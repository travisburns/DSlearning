import type { Card, Concept, Scene } from '../engine/types';
import { cloneScene } from '../engine/memory';
import { distinctInts, pick, randInt, shuffle } from '../engine/random';
import { explainGenerators, growthCard, options } from './helpers';

const BS = 'bitset';

const fmtSet = (xs: number[]) => `{${[...xs].sort((a, b) => a - b).join(', ')}}`;

/** Two 8-bit words showing elements 0..15. */
function bitsetScene(members: number[]): Scene {
  const word = (w: number) => Array.from({ length: 8 }, (_, b) => (members.includes(w * 8 + b) ? 1 : 0));
  return {
    views: [0, 1].map((w) => ({
      type: 'row' as const,
      key: `w${w}`,
      items: word(w),
      labels: Array.from({ length: 8 }, (_, b) => String(w * 8 + b)),
      title: `word ${w}: elements ${w * 8}–${w * 8 + 7}`,
    })),
  };
}

const tgt = (x: number) => `w${Math.floor(x / 8)}:${x % 8}`;

const predictWhere = (): Card => {
  const x = randInt(9, 250);
  const w = Math.floor(x / 8);
  const b = x % 8;
  const t = (ww: number, bb: number) => `word ${ww}, bit ${bb}`;
  return {
    concept: BS,
    type: 'predict',
    prompt: `A bitset uses 8-bit words: element x is present if its bit is 1. Which word and bit hold element ${x}?`,
    body: {
      kind: 'choice',
      options: options({ text: t(w, b), why: `${x} ÷ 8 = ${w} remainder ${b}.` }, [
        { text: t(b, w), why: 'Swapped: the word is x ÷ 8, the bit is the remainder.' },
        { text: t(w + 1, b), why: 'Words count from 0: word 0 holds 0–7.' },
        { text: t(w, (b + 1) % 8), why: 'Bits count from 0 inside each word.' },
      ]),
    },
    explain: `word = ${x} ÷ 8 = ${w}, bit = ${x} mod 8 = ${b}. Same "base + offset" arithmetic as an array, just with bits.`,
  };
};

const predictSetOp = (): Card => {
  const a = distinctInts(randInt(3, 4), 0, 7);
  const b = distinctInts(randInt(3, 4), 0, 7);
  const and = a.filter((x) => b.includes(x));
  const or = [...new Set([...a, ...b])];
  const xor = or.filter((x) => !and.includes(x));
  const op = pick(['AND', 'OR'] as const);
  const ans = op === 'AND' ? and : or;
  const bits = (xs: number[]) => Array.from({ length: 8 }, (_, i) => (xs.includes(i) ? 1 : 0)).join('');
  return {
    concept: BS,
    type: 'predict',
    prompt: `Bitsets over elements 0–7 (bit i shown at position i, left to right):\n\nA = ${bits(a)}  ${fmtSet(a)}\nB = ${bits(b)}  ${fmtSet(b)}\n\nWhich set is A ${op} B (bit by bit)?`,
    body: {
      kind: 'choice',
      options: options({ text: fmtSet(ans), why: op === 'AND' ? 'AND keeps bits set in both: intersection.' : 'OR keeps bits set in either: union.' }, [
        { text: fmtSet(op === 'AND' ? or : and), why: op === 'AND' ? 'That’s OR (union).' : 'That’s AND (intersection).' },
        { text: fmtSet(xor), why: 'That’s XOR: in exactly one of them.' },
        { text: fmtSet(a), why: 'That’s just A.' },
      ]),
    },
    explain: `${op} on whole words does ${op === 'AND' ? 'intersection' : 'union'} of up to 64 elements in a single CPU instruction.`,
  };
};

const simulateAdd = (): Card => {
  const add = shuffle(distinctInts(3, 0, 15));
  const frames: Scene[] = [bitsetScene([])];
  add.forEach((_, i) => {
    const f = cloneScene(bitsetScene(add.slice(0, i + 1)));
    f.highlight = [tgt(add[i])];
    frames.push(f);
  });
  return {
    concept: BS,
    type: 'simulate',
    prompt: `Add ${add.join(', then ')} to the set. Click the bit for each element, in that order.`,
    scene: frames[0],
    body: {
      kind: 'click',
      expected: add.map(tgt),
      frames,
      wrongHint: (step) => `Element ${add[step]} is in word ${Math.floor(add[step] / 8)} (${add[step]} ÷ 8), bit ${add[step] % 8} (the remainder).`,
    },
    explain: 'Each add is one computed position and one bit flip. No searching, no shifting.',
  };
};

const countBytes = (): Card => {
  const u = pick([64, 256, 1000, 1024, 4096, 8000]);
  return {
    concept: BS,
    type: 'count',
    prompt: `A bitset must be able to hold any subset of the numbers 0..${u - 1}. How many bytes does it need?`,
    body: { kind: 'number', answer: Math.ceil(u / 8), unit: 'bytes' },
    explain: `One bit per possible element: ${u} bits = ${Math.ceil(u / 8)} bytes, no matter how many are actually in the set. Storing them as 4-byte ints would take 4 bytes *each*.`,
  };
};

const countOps = (): Card => {
  const u = pick([256, 512, 1024, 4096]);
  return {
    concept: BS,
    type: 'count',
    prompt: `Two bitsets over 0..${u - 1}, stored in 64-bit words. Computing their union word by word takes how many OR operations?`,
    body: { kind: 'number', answer: u / 64, unit: 'ORs' },
    explain: `${u} / 64 = ${u / 64} words, one OR each. Each OR handles 64 elements at once.`,
  };
};

const growthBS = (): Card => growthCard(BS, 'test whether x is in the set', () => 2, 0, 'Compute word and bit, read one word. The set’s size doesn’t matter.');

const bsExplain = explainGenerators({
  concept: BS,
  truths: [
    'A bitset stores one bit per possible element: 1 means present.',
    'Element x lives in word x ÷ w at bit x mod w.',
    'Membership test, add and remove are O(1).',
    'Union and intersection are bitwise OR and AND on whole words.',
    'Memory depends on the range of possible values, not on how many are present.',
  ],
  myths: [
    { text: 'A bitset stores the element values themselves.', why: 'It stores only presence bits. The value is the position.' },
    { text: 'A bitset is cheap for any set of numbers.', why: 'For a huge range with few members, most bits are wasted zeros.' },
    { text: 'Union means looping over every element one at a time.', why: 'One OR handles a whole word of elements at once.' },
    { text: 'A bitset can count how many times x was added.', why: 'Each bit is 0 or 1: present or not, no counts.' },
  ],
  chains: [
    {
      prompt: 'Why is checking membership O(1)?',
      steps: ['Each possible element has a fixed bit position.', 'The position is computed from x: word x ÷ w, bit x mod w.', 'Reading one word and one bit answers the question.', 'No searching needed.'],
    },
  ],
  summary: {
    best: 'A bitset is a row of light switches, one per possible number: switch on means “in the set”, so checking is just looking at one switch.',
    others: [
      { text: 'A bitset is a compact representation of a set.', why: 'Compact how? Says nothing about positions.' },
      { text: 'A bitset uses bitwise operations.', why: 'Mechanism without the idea.' },
      { text: 'A bitset stores small numbers efficiently.', why: 'It doesn’t store numbers at all, only presence.' },
    ],
  },
});

export const bitsetConcept: Concept = {
  id: BS,
  title: 'Bit Array / Bitset',
  tier: 1,
  prereqs: ['bits', 'static-array'],
  tagline: 'One light switch per possible element.',
  hook: {
    problem: 'You need to track which of 10,000 seats in a stadium are taken, and answer "is seat 4,721 taken?" instantly.',
    question: 'What’s the smallest, fastest way to store that?',
    options: [
      { text: 'Keep a list of taken seat numbers and search it.', feedback: 'Searching is slow, and each number costs 4 bytes.' },
      { text: 'An array of 10,000 true/false bytes.', feedback: 'Fast! But a byte has 8 bits and you only use one of them. 8× waste.' },
      { text: 'One bit per seat: 10,000 bits packed into bytes.', good: true, feedback: 'Yes. 1,250 bytes total, and seat x is at byte x ÷ 8, bit x mod 8.' },
    ],
  },
  lens: {
    layout: 'An array of words; element x is bit (x mod w) of word (x ÷ w).',
    invariant: 'Bit x is 1 exactly when x is in the set.',
    payoff: 'O(1) add/remove/contains; union and intersection a whole word at a time; 1 bit per element.',
    price: 'Only for small integer ranges. Memory scales with the range, not the count, and no duplicates or counts.',
  },
  generators: {
    predict: [predictWhere, predictSetOp],
    simulate: [simulateAdd],
    count: [countBytes, countOps, growthBS],
    explain: bsExplain,
  },
};
