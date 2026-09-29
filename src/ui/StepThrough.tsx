import { useState } from 'react';
import type { Card, Concept } from '../engine/types';
import { generatorsFor } from '../content';
import { SceneView } from './SceneView';

/** Find a fresh worked example: a Simulate card with a step-by-step body. */
function example(concept: Concept): Card | null {
  const gens = generatorsFor(concept.id, 'simulate');
  for (let i = 0; i < 12; i++) {
    const card = gens[i % gens.length]();
    if (card.body.kind === 'click' || card.body.kind === 'order') return card;
  }
  return null;
}

/**
 * Worked example: the same operations the Simulate cards ask for, shown one step at a time
 * with Back / Next. Seeing it done first, then doing it yourself, is the classic worked-example effect.
 */
export function StepThrough({ concept }: { concept: Concept }) {
  const [card, setCard] = useState(() => example(concept));
  const [step, setStep] = useState(0);
  if (!card) return <p className="muted">No worked example for this one yet.</p>;

  const total = card.body.kind === 'click' ? card.body.expected.length : card.body.kind === 'order' ? card.body.steps.length : 0;
  const done = step >= total;
  const fresh = () => {
    setCard(example(concept));
    setStep(0);
  };

  return (
    <div className="stepthrough">
      <p className="prompt">{card.prompt}</p>
      {card.body.kind === 'click' && (
        <SceneView scene={card.body.frames[step]} done={card.body.expected.slice(0, step)} />
      )}
      {card.body.kind === 'order' && (
        <ol className="order-seq">
          {card.body.steps.slice(0, step).map((s, i) => (
            <li key={i}>
              <div className="option right">
                <span className="opt-text">{s}</span>
              </div>
            </li>
          ))}
          {step === 0 && <li className="muted small placeholder">Press Next to see the first step.</li>}
        </ol>
      )}
      <div className="step-controls">
        <button type="button" className="btn" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          ← Back
        </button>
        <span className="muted small">
          Step {Math.min(step, total)} of {total}
        </span>
        <button type="button" className="btn" onClick={() => setStep(Math.min(total, step + 1))} disabled={done}>
          Next →
        </button>
        <button type="button" className="btn ghost" onClick={fresh}>
          New example
        </button>
      </div>
      {done && <div className="feedback ok explain">{card.explain}</div>}
    </div>
  );
}
