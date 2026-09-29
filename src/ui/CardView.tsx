import { useMemo, useState } from 'react';
import type { Card } from '../engine/types';
import { CARD_TYPE_INFO } from '../engine/types';
import type { Confidence } from '../engine/mastery';
import { shuffle } from '../engine/random';
import { SceneView } from './SceneView';

interface Props {
  card: Card;
  conceptTitle: string;
  onDone: (correct: boolean, confidence: Confidence) => void;
}

const CONF_LABELS: Record<Confidence, string> = { 1: 'Guessing', 2: 'Fairly sure', 3: 'Certain' };

function ConfidenceButtons({ disabled, onPick, verb = 'Submit' }: { disabled?: boolean; onPick: (c: Confidence) => void; verb?: string }) {
  return (
    <div className="confidence">
      <span className="muted">{verb}: how sure are you?</span>
      <div className="conf-buttons">
        {([1, 2, 3] as Confidence[]).map((c) => (
          <button key={c} type="button" className={`btn conf-${c}`} disabled={disabled} onClick={() => onPick(c)}>
            {CONF_LABELS[c]}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CardView({ card, conceptTitle, onDone }: Props) {
  const [result, setResult] = useState<{ correct: boolean; confidence: Confidence } | null>(null);
  const info = CARD_TYPE_INFO[card.type];

  const finish = (correct: boolean, confidence: Confidence) => setResult({ correct, confidence });

  return (
    <div className="card">
      <div className="card-head">
        <span className={`chip chip-${card.type}`}>{info.name}</span>
        <span className="muted">{conceptTitle}</span>
      </div>
      <p className="prompt">{card.prompt}</p>
      {card.body.kind !== 'click' && card.scene && <SceneView scene={card.scene} />}
      <Body card={card} result={result} onSubmit={finish} />
      {result && (
        <div className={`feedback ${result.correct ? 'ok' : 'bad'}`}>
          <strong>{result.correct ? 'Correct.' : 'Not quite.'}</strong>
          {!result.correct && result.confidence === 3 && (
            <span className="misconception"> You were certain, so this is a misconception worth fixing. It will come back soon.</span>
          )}
          {result.correct && result.confidence === 1 && <span className="muted"> Right, but you were guessing, so it won't count as mastered yet.</span>}
          <p className="explain">{card.explain}</p>
          <button type="button" className="btn primary" onClick={() => onDone(result.correct, result.confidence)} autoFocus>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}

function Body({ card, result, onSubmit }: { card: Card; result: { correct: boolean } | null; onSubmit: (correct: boolean, c: Confidence) => void }) {
  switch (card.body.kind) {
    case 'choice':
      return <ChoiceBody card={card} body={card.body} result={result} onSubmit={onSubmit} />;
    case 'order':
      return <OrderBody body={card.body} result={result} onSubmit={onSubmit} />;
    case 'number':
      return <NumberBody body={card.body} result={result} onSubmit={onSubmit} />;
    case 'click':
      return <ClickBody card={card} body={card.body} result={result} onSubmit={onSubmit} />;
  }
}

type BodyOf<K extends Card['body']['kind']> = Extract<Card['body'], { kind: K }>;

function ChoiceBody({ body, result, onSubmit }: { card: Card; body: BodyOf<'choice'>; result: { correct: boolean } | null; onSubmit: (c: boolean, conf: Confidence) => void }) {
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const toggle = (i: number) => {
    if (result) return;
    setPicked((p) => {
      if (!body.multi) return new Set([i]);
      const n = new Set(p);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  };
  const grade = () => body.options.every((o, i) => o.correct === picked.has(i));
  return (
    <>
      {body.multi && !result && <p className="muted small">Select all that apply.</p>}
      <div className="options">
        {body.options.map((o, i) => {
          const state = result ? (o.correct ? 'right' : picked.has(i) ? 'wrongpick' : '') : picked.has(i) ? 'picked' : '';
          return (
            <button key={i} type="button" className={`option ${state}`} onClick={() => toggle(i)} disabled={!!result}>
              <span className="opt-mark">{body.multi ? (picked.has(i) ? '☑' : '☐') : String.fromCharCode(65 + i)}</span>
              <span className="opt-text">
                {o.text}
                {result && o.why && (picked.has(i) || o.correct) && <span className="why">{o.why}</span>}
              </span>
            </button>
          );
        })}
      </div>
      {!result && <ConfidenceButtons disabled={picked.size === 0} onPick={(c) => onSubmit(grade(), c)} />}
    </>
  );
}

function OrderBody({ body, result, onSubmit }: { body: BodyOf<'order'>; result: { correct: boolean } | null; onSubmit: (c: boolean, conf: Confidence) => void }) {
  const pool = useMemo(() => {
    // Never present the steps already in the right order.
    let s = shuffle(body.steps.map((_, i) => i));
    for (let t = 0; t < 5 && s.every((x, i) => x === i) && s.length > 1; t++) s = shuffle(s);
    return s;
  }, [body]);
  const [seq, setSeq] = useState<number[]>([]);
  const remaining = pool.filter((i) => !seq.includes(i));
  return (
    <>
      <div className="order">
        <div className="order-col">
          <div className="muted small">Your order (click a step to remove it)</div>
          <ol className="order-seq">
            {seq.map((i, k) => (
              <li key={i}>
                <button type="button" className={`option ${result ? (i === k ? 'right' : 'wrongpick') : 'picked'}`} disabled={!!result} onClick={() => setSeq(seq.filter((x) => x !== i))}>
                  <span className="opt-text">{body.steps[i]}</span>
                </button>
              </li>
            ))}
            {seq.length === 0 && <li className="muted small placeholder">Click the steps below in order.</li>}
          </ol>
        </div>
        {remaining.length > 0 && (
          <div className="order-col">
            <div className="muted small">Steps</div>
            {remaining.map((i) => (
              <button key={i} type="button" className="option" disabled={!!result} onClick={() => setSeq([...seq, i])}>
                <span className="opt-text">{body.steps[i]}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {!result && <ConfidenceButtons disabled={seq.length !== body.steps.length} onPick={(c) => onSubmit(seq.every((x, k) => x === k), c)} />}
    </>
  );
}

function NumberBody({ body, result, onSubmit }: { body: BodyOf<'number'>; result: { correct: boolean } | null; onSubmit: (c: boolean, conf: Confidence) => void }) {
  const [val, setVal] = useState('');
  const n = Number(val);
  const valid = val.trim() !== '' && Number.isFinite(n);
  return (
    <>
      <div className="number-row">
        <input className="num-input" type="number" inputMode="numeric" value={val} disabled={!!result} onChange={(e) => setVal(e.target.value)} aria-label="Your answer" />
        {body.unit && <span className="muted">{body.unit}</span>}
        {result && !result.correct && <span className="muted">Answer: {body.answer}</span>}
      </div>
      {!result && <ConfidenceButtons disabled={!valid} onPick={(c) => onSubmit(n === body.answer, c)} />}
    </>
  );
}

function ClickBody({ body, result, onSubmit }: { card: Card; body: BodyOf<'click'>; result: { correct: boolean } | null; onSubmit: (c: boolean, conf: Confidence) => void }) {
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [step, setStep] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);

  const click = (id: string) => {
    if (!confidence || result) return;
    if (id === body.expected[step]) {
      const next = step + 1;
      setStep(next);
      setHint(null);
      setWrong(null);
      if (next === body.expected.length) onSubmit(mistakes === 0, confidence);
    } else {
      setMistakes((m) => m + 1);
      setWrong(id);
      setHint(body.wrongHint?.(step, id) ?? 'Not that one. Think about what has to happen next.');
    }
  };

  const frame = body.frames[Math.min(step, body.frames.length - 1)];
  return (
    <>
      {!confidence ? (
        <>
          <SceneView scene={body.frames[0]} />
          <ConfidenceButtons verb="Before you start" onPick={setConfidence} />
        </>
      ) : (
        <>
          <p className="muted small">
            Step {Math.min(step + 1, body.expected.length)} of {body.expected.length}
            {mistakes > 0 && ` · ${mistakes} mistake${mistakes > 1 ? 's' : ''}`}
          </p>
          <SceneView scene={frame} onTarget={result ? undefined : click} done={body.expected.slice(0, step)} wrong={wrong} />
          {hint && !result && <div className="hint">{hint}</div>}
        </>
      )}
    </>
  );
}
