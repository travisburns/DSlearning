import { useMemo, useState } from 'react';
import type { Card } from '../engine/types';
import type { Confidence, Progress, ReviewItem } from '../engine/mastery';
import { dueItems, interleave, weakestItems } from '../engine/mastery';
import { generateCard, getConcept } from '../content';
import { CardView } from './CardView';

const SESSION_SIZE = 12;

interface Props {
  progress: Progress;
  onAnswer: (concept: string, type: Card['type'], correct: boolean, confidence: Confidence) => void;
  onExit: () => void;
  /** Only review these concepts (e.g. the foundations of a lesson you're about to start). */
  only?: string[];
  title?: string;
}

export function Review({ progress, onAnswer, onExit, only, title = 'Review' }: Props) {
  // Freeze the session at start so answering doesn't reshuffle it.
  const [session] = useState<{ items: ReviewItem[]; extra: boolean }>(() => {
    const due = dueItems(progress, Date.now(), only);
    if (due.length) return { items: interleave(due.slice(0, SESSION_SIZE)), extra: false };
    if (only) return { items: [], extra: false };
    return { items: interleave(weakestItems(progress, SESSION_SIZE)), extra: true };
  });
  const cards = useMemo(() => session.items.map((it) => generateCard(it.concept, it.type)), [session]);
  const [i, setI] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);

  if (!cards.length)
    return (
      <section className="panel">
        <h2>{only ? 'All caught up' : 'Nothing to review yet'}</h2>
        <p>{only ? 'Nothing is due on these structures.' : 'Finish a lesson first; its structure joins the review pool.'}</p>
        <button type="button" className="btn primary" onClick={onExit}>
          Continue
        </button>
      </section>
    );

  if (i >= cards.length) {
    const right = results.filter(Boolean).length;
    return (
      <section className="panel">
        <h2>
          Session done: {right} / {cards.length}
        </h2>
        <p className="muted">
          Misses come back straight away (they're due again now). Right answers, when you weren't guessing, wait longer
          before returning.
        </p>
        <button type="button" className="btn primary" onClick={onExit}>
          Continue
        </button>
      </section>
    );
  }

  const card = cards[i];
  return (
    <div className="review">
      <div className="lesson-top">
        <button type="button" className="btn ghost" onClick={onExit}>
          ← Map
        </button>
        <h1>{title}</h1>
        <span className="muted">
          {i + 1} / {cards.length}
          {session.extra && ' · nothing due, practising your weakest skills'}
        </span>
      </div>
      <div className="progress-bar">
        <div style={{ width: `${(i / cards.length) * 100}%` }} />
      </div>
      <CardView
        key={i}
        card={card}
        conceptTitle={getConcept(card.concept)?.title ?? card.concept}
        onDone={(correct, conf) => {
          onAnswer(card.concept, card.type, correct, conf);
          setResults((r) => [...r, correct]);
          setI(i + 1);
        }}
      />
    </div>
  );
}
