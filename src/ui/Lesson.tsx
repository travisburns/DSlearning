import { useMemo, useState } from 'react';
import type React from 'react';
import type { Card, Concept } from '../engine/types';
import type { CardType } from '../engine/types';
import type { Confidence } from '../engine/mastery';
import { PASS_SCORE } from '../engine/mastery';
import { generateCard } from '../content';
import { CardView } from './CardView';
import { Playground } from './Playground';
import { StepThrough } from './StepThrough';
import { Rich } from './Rich';
import { getConcept } from '../content';

/** Lesson checkpoint order. Rebuild is left for reviews: recalling after a delay is the point of it. */
const CHECKPOINT: CardType[] = ['predict', 'simulate', 'count', 'break', 'explain', 'connect', 'choose', 'transfer'];

type Stage = 'learn' | 'play' | 'lens' | 'check' | 'done';

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
  { key: 'layout', q: '1. How is it stored in memory?' },
  { key: 'invariant', q: '2. What rule does it always keep true?' },
  { key: 'payoff', q: '3. What does that rule make fast?' },
  { key: 'price', q: '4. What does that rule cost?' },
];

const STAGE_NAMES: Record<Stage, string> = { learn: 'Learn', play: 'Try it', lens: '4 questions', check: 'Checkpoint', done: 'Done' };

/** One plain line at the top of each step saying what it's for. */
function StepIntro({ children }: { children: React.ReactNode }) {
  return <div className="step-intro">{children}</div>;
}

export function Lesson({ concept, duePrereqs, alreadyPassed, onReviewPrereqs, onAnswer, onFinish, onExit }: Props) {
  const stages: Stage[] = ['learn', 'play', 'lens', 'check', 'done'];
  const [stage, setStage] = useState<Stage>('learn');
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
              {STAGE_NAMES[s]}
            </li>
          ))}
        </ol>
      </div>
      {stage === 'learn' && <Learn concept={concept} onNext={next} />}
      {stage === 'lens' && <Lens concept={concept} onNext={next} />}
      {stage === 'play' && (
        <section className="panel">
          <StepIntro>
            <b>This step:</b> see what you just read actually happen. Nothing here is graded.
          </StepIntro>
          {concept.playground ? (
            <>
              <h2>Try it yourself</h2>
              <p className="muted">
                Do the steps below with the buttons. Before each one, guess what will happen; then open “What does this
                show?” to check.
              </p>
              <Playground def={concept.playground} />
            </>
          ) : (
            <>
              <h2>Watch it work</h2>
              <p className="muted">
                A worked example, one step at a time. Press Next to see each step; before you do, guess what it will be.
                You'll do one yourself in the checkpoint.
              </p>
              <StepThrough concept={concept} />
            </>
          )}
          <button type="button" className="btn primary" onClick={next}>
            Next: 4 questions →
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

function Learn({ concept, onNext }: { concept: Concept; onNext: () => void }) {
  const good = concept.hook.options.find((o) => o.good);
  const built = concept.prereqs.map((id) => getConcept(id)?.title ?? id);
  return (
    <section className="panel learn">
      <StepIntro>
        <b>This step:</b> read what {concept.title} is and how it works. Take your time. Underlined words can be tapped
        for a plain definition.
      </StepIntro>
      <h2>What it is</h2>
      <p className="lead">
        <Rich text={concept.learn?.what ?? concept.tagline} />
      </p>

      <h2>The problem it solves</h2>
      <p>
        <Rich text={concept.hook.problem} />
      </p>
      {good && (
        <p>
          <b>The idea:</b> <Rich text={good.text} /> <Rich text={good.feedback} />
        </p>
      )}

      <h2>How it works</h2>
      <ol className="how-list">
        {(concept.learn?.how ?? []).map((h, i) => (
          <li key={i}>
            <Rich text={h} />
          </li>
        ))}
      </ol>

      {concept.extras && (
        <>
          <h2>Where it’s used</h2>
          <ul>
            {concept.extras.uses.map((u, i) => (
              <li key={i}>
                <Rich text={u} />
              </li>
            ))}
          </ul>
        </>
      )}

      {built.length > 0 && (
        <p className="muted small">Built on: {built.join(', ')} (lessons you’ve already passed).</p>
      )}
      <button type="button" className="btn primary" onClick={onNext}>
        Got it. Show me →
      </button>
    </section>
  );
}

function Lens({ concept, onNext }: { concept: Concept; onNext: () => void }) {
  const [shown, setShown] = useState(0);
  return (
    <section className="panel">
      <StepIntro>
        <b>This step:</b> every data structure can be summed up by the same four questions. Answer each one in your own
        head first, then reveal it to check. Recalling before you look is what makes it stick.
      </StepIntro>
      <h2>The 4 questions</h2>
      <div className="lens">
        {LENS.map((l, i) => (
          <div key={l.key} className={`lens-q ${i < shown ? 'open' : ''}`}>
            <div className="lens-title">{l.q}</div>
            {i < shown ? (
              <p>
                <Rich text={concept.lens[l.key]} />
              </p>
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
          Next: checkpoint →
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
      {i === 0 && (
        <StepIntro>
          <b>This step:</b> {cards.length} questions, one of each kind, each on a fresh example. Before submitting, you say
          how sure you are. You need {PASS_SCORE} right, and not guessed, to pass and unlock the next lessons. After every
          answer you’ll see why it was right or wrong.
        </StepIntro>
      )}
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
