import type { Card, CardGenerator, Concept, ConceptExtras, ExtraCardType } from '../engine/types';
import { pick, shuffle } from '../engine/random';
import { options } from './helpers';

/**
 * Cards built from a concept's lens and hand-written extras. They work the same way for every
 * structure, so all 61 get Break / Choose / Connect / Rebuild / Transfer cards.
 */

const PRIMITIVE_TEXT: Record<ConceptExtras['primitive'], string> = {
  slots: 'Contiguous slots: positions are computed, like an array',
  links: 'Links: nodes hold addresses of other nodes',
  both: 'Both: arrays and links working together',
  bits: 'Bits packed into words',
  abstract: 'Neither directly: it’s an idea or interface that can sit on different layouts',
};

const LENS_FIELDS = [
  { key: 'layout', name: 'LAYOUT (how it sits in memory)' },
  { key: 'invariant', name: 'INVARIANT (the rule it always keeps)' },
  { key: 'payoff', name: 'PAYOFF (what the rule makes cheap)' },
  { key: 'price', name: 'PRICE (what it costs)' },
] as const;

/** Other concepts that are safe to use as wrong answers for `c`: different family, not a rival. */
function foils(c: Concept, all: Concept[], maxTierGap = 1): Concept[] {
  const ex = c.extras!;
  const ok = (o: Concept) => o.id !== c.id && o.extras && o.extras.family !== ex.family && !(ex.rivals ?? []).includes(o.id) && !(o.extras.rivals ?? []).includes(c.id);
  const near = all.filter((o) => ok(o) && o.tier <= c.tier + maxTierGap);
  return near.length >= 3 ? near : all.filter(ok);
}

/** Concepts close in the curriculum, used to make Rebuild distractors hard. */
function neighbours(c: Concept, all: Concept[]): Concept[] {
  const others = all.filter((o) => o.id !== c.id);
  const close = others.filter((o) => Math.abs(o.tier - c.tier) <= 1);
  return close.length >= 3 ? close : others;
}

export function extraGenerators(c: Concept, all: Concept[]): Record<ExtraCardType, CardGenerator[]> {
  const ex = c.extras!;

  const breakIt: CardGenerator = () => {
    const b = pick(ex.breaks);
    return {
      concept: c.id,
      type: 'break',
      prompt: `Break it. ${b.violation}\n\nWhat goes wrong?`,
      body: {
        kind: 'choice',
        options: options(
          { text: b.result, why: `The rule being broken: ${c.lens.invariant}` },
          b.wrong.map((w) => ({ text: w, why: `Trace it through the rule: ${c.lens.invariant}` })),
        ),
      },
      explain: `${b.result}\n\nThat's why ${c.title} insists: ${c.lens.invariant}`,
    };
  };

  const choose: CardGenerator = () => {
    const scenario = pick(ex.uses);
    const wrong = shuffle(foils(c, all)).slice(0, 3);
    return {
      concept: c.id,
      type: 'choose',
      prompt: `Which structure fits best?\n\n${scenario}`,
      body: {
        kind: 'choice',
        options: options(
          { text: c.title, why: c.lens.payoff },
          wrong.map((o) => ({ text: o.title, why: `${o.title}: ${o.lens.price}` })),
        ),
      },
      explain: `${c.title}. ${c.lens.payoff}`,
    };
  };

  const connectParts: CardGenerator = () => {
    const own = ex.parts.slice(0, 3);
    const others = shuffle(foils(c, all, 3).flatMap((o) => o.extras!.parts)).filter((p) => !ex.parts.includes(p));
    const fake = [...new Set(others)].slice(0, 2);
    return {
      concept: c.id,
      type: 'connect',
      prompt: `What is ${c.title} built from? Select every piece it needs.`,
      body: {
        kind: 'choice',
        multi: true,
        options: shuffle([
          ...own.map((p) => ({ text: p, correct: true })),
          ...fake.map((p) => ({ text: p, correct: false, why: `That belongs to ${all.find((o) => o.extras?.parts.includes(p))?.title ?? 'another structure'}.` })),
        ]),
      },
      explain: `${c.title} = ${ex.parts.join(' + ')}. Every structure is a combination of simpler pieces.`,
    };
  };

  const connectPrimitive: CardGenerator = () => ({
    concept: c.id,
    type: 'connect',
    prompt: `Strip ${c.title} down to its primitives. What does it rest on?`,
    body: {
      kind: 'choice',
      options: (Object.keys(PRIMITIVE_TEXT) as ConceptExtras['primitive'][]).map((k) => ({
        text: PRIMITIVE_TEXT[k],
        correct: k === ex.primitive,
        why: k === ex.primitive ? c.lens.layout : undefined,
      })),
    },
    explain: `Layout: ${c.lens.layout}`,
  });

  const connectName: CardGenerator = () => {
    const wrong = shuffle(foils(c, all, 3)).slice(0, 3);
    return {
      concept: c.id,
      type: 'connect',
      prompt: `Which structure is built from: ${ex.parts.join(' + ')}?`,
      body: {
        kind: 'choice',
        options: options({ text: c.title, why: c.lens.layout }, wrong.map((o) => ({ text: o.title, why: `${o.title} = ${o.extras!.parts.join(' + ')}` }))),
      },
      explain: `${c.title}: ${c.lens.layout}`,
    };
  };

  const rebuildLens: CardGenerator = () => {
    const f = pick(LENS_FIELDS);
    const wrong = shuffle(neighbours(c, all)).slice(0, 3);
    return {
      concept: c.id,
      type: 'rebuild',
      prompt: `From memory: what is the ${f.name} of ${c.title}?`,
      body: {
        kind: 'choice',
        options: options({ text: c.lens[f.key], why: 'That’s the one.' }, wrong.map((o) => ({ text: o.lens[f.key], why: `That’s ${o.title}.` }))),
      },
      explain: `${c.title}: ${c.lens[f.key]}`,
    };
  };

  const rebuildReverse: CardGenerator = () => {
    const f = pick(LENS_FIELDS.filter((x) => x.key !== 'payoff'));
    const wrong = shuffle(neighbours(c, all)).slice(0, 3);
    return {
      concept: c.id,
      type: 'rebuild',
      prompt: `Which structure has this ${f.name.split(' ')[0].toLowerCase()}?\n\n“${c.lens[f.key]}”`,
      body: { kind: 'choice', options: options({ text: c.title }, wrong.map((o) => ({ text: o.title, why: `${o.title}: ${o.lens[f.key]}` }))) },
      explain: `${c.title}. ${c.lens.invariant}`,
    };
  };

  const rebuildFour: CardGenerator = () => ({
    concept: c.id,
    type: 'rebuild',
    prompt: `Rebuild ${c.title} from memory: put the lens in order from how it’s laid out to what it costs.`,
    body: { kind: 'order', steps: [c.lens.layout, c.lens.invariant, c.lens.payoff, c.lens.price] },
    explain: 'Layout → the rule it keeps → what the rule buys → what the rule costs. Every structure answers these four.',
  });

  const transfer: CardGenerator = (): Card => {
    const tr = pick(ex.transfer);
    return {
      concept: c.id,
      type: 'transfer',
      prompt: `New problem. ${tr.problem}`,
      body: { kind: 'choice', options: options({ text: tr.answer, why: tr.explain }, tr.wrong) },
      explain: tr.explain,
    };
  };

  return {
    break: [breakIt],
    choose: [choose],
    connect: [connectParts, connectPrimitive, connectName],
    rebuild: [rebuildLens, rebuildReverse, rebuildFour],
    transfer: [transfer],
  };
}
