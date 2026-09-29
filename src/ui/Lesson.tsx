import { useMemo, useState } from 'react';
import type { Card, Concept } from '../engine/types';
import { CARD_TYPES } from '../engine/types';
import type { Confidence } from '../engine/mastery';
import { generateCard } from '../content';
import { CardView } from './CardView';
import { Playground } from './Playground';

type Stage = 'hook' | 'lens' | 'play' | 'check' | 'done';

interface Props {
  concept: Concept;
  onAnswer: (type: Card['type'], correct: boolean, confidence: Confidence) => void;
  onFinish: () => void;
  onExit: () => void;
}

const LENS: { key: keyof Concept['lens']; q: string }[] = [
  { key: 'layout', q: 'Layout: how does it sit in memory?' },
  { key: 'invariant', q: 'Invariant: what rule does it always keep?' },
  { key: 'payoff', q: 'Payoff: what does that rule make cheap?' },
  { key: 'price', q: 'Price: what does keeping the rule cost?' },
];

export function Lesson({ concept, onAnswer, onFinish, onExit }: Props) {
  const stages: Stage[] = concept.playground ? ['hook', 'lens', 'play', 'check', 'done'] : ['hook', 'lens', 'check', 'done'];
  const [stage, setStage] = useState<Stage>('hook');
  const next = () => setStage(stages[stages.indexOf(stage) + 1]);

  return (
    <div className="lesson">
      <div className="lesson-top">
        <button type="button" className="btn ghost" onClick={onExit}>
          ← Map
        </button>
        <h1>{concept.title}</h1>
        <ol className="stepper">
          {stages.map((s) => (
            <li key={s} className={s === stage ? 'on' : stages.indexOf(s) < stages.indexOf(stage) ? 'past' : ''}>
              {{ hook: 'Problem', lens: 'Lens', play: 'Play', check: 'Checkpoint', done: 'Done' }[s]}
            </li>
          ))}
        </ol>
      </div>
      {stage === 'hook' && <Hook concept={concept} onNext={next} />}
      {stage === 'lens' && <Lens concept={concept} onNext={next} />}
      {stage === 'play' && concept.playground && (
        <section className="panel">
          <h2>Play with it</h2>
          <p className="muted">
            Run real operations. Watch the textbook picture and raw memory change together, and watch the touch counter. Try
            to predict each count before you press.
          </p>
          <Playground def={concept.playground} />
          <button type="button" className="btn primary" onClick={next}>
            Checkpoint →
          </button>
        </section>
      )}
      {stage === 'check' && <Checkpoint concept={concept} onAnswer={onAnswer} onDone={() => { onFinish(); next(); }} />}
      {stage === 'done' && (
        <section className="panel">
          <h2>{concept.title} is in your review pool</h2>
          <p>
            From now on it comes back in reviews as <em>fresh</em> problems, mixed in with the other structures. Nothing to
            memorise: every review is a new instance.
          </p>
          <button type="button" className="btn primary" onClick={onExit}>
            Back to the map
          </button>
        </section>
      )}
    </div>
  );
}

function Hook({ concept, onNext }: { concept: Concept; onNext: () => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const { hook } = concept;
  return (
    <section className="panel">
      <h2>The problem</h2>
      <p className="problem">{hook.problem}</p>
      <p>
        <strong>{hook.question}</strong>
      </p>
      <p className="muted small">Pick the idea you'd try. There's no penalty: wrong ideas teach you what the structure has to avoid.</p>
      <div className="options">
        {hook.options.map((o, i) => (
          <button key={i} type="button" className={`option ${picked === i ? (o.good ? 'right' : 'wrongpick') : ''}`} onClick={() => setPicked(i)}>
            <span className="opt-mark">{String.fromCharCode(65 + i)}</span>
            <span className="opt-text">
              {o.text}
              {picked === i && <span className="why">{o.feedback}</span>}
            </span>
          </button>
        ))}
      </div>
      {picked !== null && hook.options[picked].good && (
        <button type="button" className="btn primary" onClick={onNext}>
          That idea has a name → see how it works
        </button>
      )}
    </section>
  );
}

function Lens({ concept, onNext }: { concept: Concept; onNext: () => void }) {
  const [shown, setShown] = useState(0);
  return (
    <section className="panel">
      <h2>The Primitive Lens</h2>
      <p className="muted">Every structure answers the same four questions. Try to answer each one in your head before you reveal it.</p>
      <div className="lens">
        {LENS.map((l, i) => (
          <div key={l.key} className={`lens-q ${i < shown ? 'open' : ''}`}>
            <div className="lens-title">{l.q}</div>
            {i < shown ? (
              <p>{concept.lens[l.key]}</p>
            ) : i === shown ? (
              <button type="button" className="btn" onClick={() => setShown(shown + 1)}>
                I have my answer. Reveal
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {shown === LENS.length && (
        <button type="button" className="btn primary" onClick={onNext}>
          Continue →
        </button>
      )}
    </section>
  );
}

function Checkpoint({ concept, onAnswer, onDone }: { concept: Concept; onAnswer: Props['onAnswer']; onDone: () => void }) {
  const cards = useMemo(() => CARD_TYPES.map((t) => generateCard(concept.id, t)), [concept.id]);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  if (i >= cards.length)
    return (
      <section className="panel">
        <h2>
          Checkpoint: {score} / {cards.length}
        </h2>
        <p className="muted">Anything you missed is scheduled to come back first.</p>
        <button type="button" className="btn primary" onClick={onDone}>
          Finish lesson
        </button>
      </section>
    );
  return (
    <section>
      <p className="muted small">
        Checkpoint {i + 1} of {cards.length}: one card of each kind.
      </p>
      <CardView
        key={i}
        card={cards[i]}
        conceptTitle={concept.title}
        onDone={(correct, conf) => {
          onAnswer(cards[i].type, correct, conf);
          if (correct) setScore((s) => s + 1);
          setI(i + 1);
        }}
      />
    </section>
  );
}
