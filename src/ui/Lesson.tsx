import { useMemo, useState } from 'react';
import type { Card, Concept } from '../engine/types';
import type { CardType } from '../engine/types';
import type { Confidence } from '../engine/mastery';
import { PASS_SCORE } from '../engine/mastery';
import { generateCard } from '../content';
import { CardView } from './CardView';
import { Playground } from './Playground';
import { StepThrough } from './StepThrough';

/** Lesson checkpoint order. Rebuild is left for reviews: recalling after a delay is the point of it. */
const CHECKPOINT: CardType[] = ['predict', 'simulate', 'count', 'break', 'explain', 'connect', 'choose', 'transfer'];

type Stage = 'hook' | 'lens' | 'play' | 'check' | 'done';

interface Props {
  concept: Concept;
  /** Review cards due on the structures this one is built from. They must be cleared first. */
  duePrereqs: number;
  alreadyPassed: boolean;
  onReviewPrereqs: () => void;
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

export function Lesson({ concept, duePrereqs, alreadyPassed, onReviewPrereqs, onAnswer, onFinish, onExit }: Props) {
  const stages: Stage[] = ['hook', 'lens', 'play', 'check', 'done'];
  const [stage, setStage] = useState<Stage>('hook');
  const next = () => setStage(stages[stages.indexOf(stage) + 1]);

  if (duePrereqs > 0 && !alreadyPassed)
    return (
      <div className="lesson">
        <div className="lesson-top">
          <button type="button" className="btn ghost" onClick={onExit}>
            ← Map
          </button>
          <h1>{concept.title}</h1>
        </div>
        <section className="panel">
          <h2>Review the foundations first</h2>
          <p>
            {concept.title} is built from {concept.prereqs.length === 1 ? 'a structure' : 'structures'} with{' '}
            <strong>{duePrereqs}</strong> review card{duePrereqs === 1 ? '' : 's'} due. New material goes on a solid base, so
            clear those first.
          </p>
          <button type="button" className="btn primary" onClick={onReviewPrereqs}>
            Review now
          </button>
        </section>
      </div>
    );

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
      {stage === 'play' && (
        <section className="panel">
          {concept.playground ? (
            <>
              <h2>Play with it</h2>
              <p className="muted">
                Run real operations. Watch the textbook picture and raw memory change together, and watch the touch counter.
                Try to predict each count before you press.
              </p>
              <Playground def={concept.playground} />
            </>
          ) : (
            <>
              <h2>Watch it work</h2>
              <p className="muted">
                A worked example, one step at a time. Before each Next, say what you think happens. Then you'll do one
                yourself in the checkpoint.
              </p>
              <StepThrough concept={concept} />
            </>
          )}
          <button type="button" className="btn primary" onClick={next}>
            Checkpoint →
          </button>
        </section>
      )}
      {stage === 'check' && <Checkpoint concept={concept} onAnswer={onAnswer} onPassed={() => { onFinish(); next(); }} onExit={onExit} />}
      {stage === 'done' && (
        <section className="panel">
          <h2>Passed. {concept.title} is in your review pool</h2>
          <p>
            Structures built on it are now unlocked. It isn't <em>mastered</em> yet: that happens when you get every kind of
            card right, without guessing, on three separate days. Reviews bring it back as fresh problems at growing
            intervals, and a miss later drops it back.
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

function Checkpoint({ concept, onAnswer, onPassed, onExit }: { concept: Concept; onAnswer: Props['onAnswer']; onPassed: () => void; onExit: () => void }) {
  const [attempt, setAttempt] = useState(0);
  const cards = useMemo(() => CHECKPOINT.map((t) => generateCard(concept.id, t)), [concept.id, attempt]);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [guessedRight, setGuessedRight] = useState(0);
  const passed = score >= PASS_SCORE;

  if (i >= cards.length)
    return (
      <section className="panel">
        <h2>
          Checkpoint: {score} / {cards.length} {passed ? '✓ passed' : '✗ not yet'}
        </h2>
        {passed ? (
          <>
            <p className="muted">You needed {PASS_SCORE}. Anything you missed is scheduled to come back first.</p>
            <button type="button" className="btn primary" onClick={onPassed}>
              Finish lesson
            </button>
          </>
        ) : (
          <>
            <p>
              You need {PASS_SCORE} of {cards.length} right, answered as “fairly sure” or “certain”, to move on.
              {guessedRight > 0 && ` ${guessedRight} right answer${guessedRight > 1 ? 's were' : ' was a'} guess${guessedRight > 1 ? 'es' : ''}, and guesses don't count.`}
            </p>
            <p className="muted">Retrying gives you completely new problems. Consider going back over the Lens and Play first.</p>
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setAttempt((a) => a + 1);
                setI(0);
                setScore(0);
                setGuessedRight(0);
              }}
            >
              Retry with new problems
            </button>{' '}
            <button type="button" className="btn ghost" onClick={onExit}>
              Back to the map
            </button>
          </>
        )}
      </section>
    );
  return (
    <section>
      <p className="muted small">
        Checkpoint {i + 1} of {cards.length}
        {attempt > 0 && ` (attempt ${attempt + 1})`}: one card of each kind. Pass mark: {PASS_SCORE} right without guessing.
      </p>
      <CardView
        key={`${attempt}-${i}`}
        card={cards[i]}
        conceptTitle={concept.title}
        onDone={(correct, conf) => {
          onAnswer(cards[i].type, correct, conf);
          if (correct && conf >= 2) setScore((s) => s + 1);
          if (correct && conf === 1) setGuessedRight((g) => g + 1);
          setI(i + 1);
        }}
      />
    </section>
  );
}
