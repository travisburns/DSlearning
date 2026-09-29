import { useState } from 'react';
import type { PlaygroundDef } from '../engine/types';
import { SceneView } from './SceneView';

/** Free play: run real operations and watch both views and the touch counter. */
export function Playground({ def }: { def: PlaygroundDef }) {
  const [scene, setScene] = useState(def.initial);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [log, setLog] = useState<{ text: string; touches?: number; error?: boolean }[]>([]);
  const [total, setTotal] = useState(0);

  const run = (i: number) => {
    const op = def.ops[i];
    const names = op.inputs ?? [];
    const args = names.map((n) => Number(inputs[`${i}:${n}`] ?? ''));
    if (names.some((n, k) => (inputs[`${i}:${n}`] ?? '').trim() === '' || !Number.isFinite(args[k]))) {
      setLog((l) => [{ text: `${op.label}: fill in ${names.join(' and ')}.`, error: true }, ...l].slice(0, 8));
      return;
    }
    const res = op.run(scene, args);
    if ('error' in res) {
      setLog((l) => [{ text: res.error, error: true }, ...l].slice(0, 8));
      return;
    }
    setScene(res.scene);
    setTotal((t) => t + res.touches);
    setLog((l) => [{ text: res.note, touches: res.touches }, ...l].slice(0, 8));
  };

  return (
    <div className="playground">
      <div className="ops">
        {def.ops.map((op, i) => (
          <div className="op" key={i}>
            {(op.inputs ?? []).map((n) => (
              <input
                key={n}
                className="num-input small"
                type="number"
                placeholder={n}
                aria-label={`${op.label} ${n}`}
                value={inputs[`${i}:${n}`] ?? ''}
                onChange={(e) => setInputs({ ...inputs, [`${i}:${n}`]: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && run(i)}
              />
            ))}
            <button type="button" className="btn" onClick={() => run(i)}>
              {op.label}
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            setScene(def.initial());
            setLog([]);
            setTotal(0);
          }}
        >
          Reset
        </button>
      </div>
      <div className="touch-counter">
        Last op: <strong>{log.find((l) => l.touches !== undefined)?.touches ?? 0}</strong> touches · Total: <strong>{total}</strong>
      </div>
      <SceneView scene={scene} />
      <ul className="log">
        {log.map((l, i) => (
          <li key={i} className={l.error ? 'err' : ''}>
            {l.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
