import { useCallback, useEffect, useRef, useState } from 'react';
import type { ABox, AnimScript, AText } from '../anim/engine';
import { arrowPath, between } from '../anim/engine';
import { Rich } from './Rich';

const SPEEDS = [0.5, 1, 2] as const;
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function BoxShape({ b }: { b: ABox }) {
  const tone = `tone-${b.tone ?? 'plain'}`;
  const label = b.label ?? '';
  const fs = label.length > 6 ? 11 : label.length > 3 ? 13 : 16;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  return (
    <>
      {b.shape === 'frame' ? (
        <>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={10} className={`an-frame ${tone}`} />
          {label && (
            <text x={b.x + 4} y={b.y - 7} className="an-frame-title">
              {label}
            </text>
          )}
        </>
      ) : (
        <>
          {b.shape === 'circle' ? (
            <circle cx={cx} cy={cy} r={Math.min(b.w, b.h) / 2} className={`an-box ${tone}`} />
          ) : (
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={b.shape === 'tag' ? b.h / 2 : 6} className={`an-box ${b.shape === 'slot' ? 'an-slot' : ''} ${b.shape === 'tag' ? 'an-tag' : ''} ${tone}`} />
          )}
          {label && (
            <text x={cx} y={cy + fs * 0.35} textAnchor="middle" className={`an-label lt-${b.tone ?? 'plain'} ${b.mono !== false ? 'mono' : ''} ${b.shape === 'tag' ? 'an-tag-label' : ''} ${b.shape === 'slot' ? 'an-slot-label' : ''}`} fontSize={b.shape === 'tag' ? 12 : fs}>
              {label}
            </text>
          )}
        </>
      )}
      {b.top && (
        <text x={cx} y={b.y - 5} textAnchor="middle" className="an-top">
          {b.top}
        </text>
      )}
      {b.sub && (
        <text x={cx} y={b.y + b.h + 13} textAnchor="middle" className="an-sub">
          {b.sub}
        </text>
      )}
    </>
  );
}

function TextShape({ t }: { t: AText }) {
  return (
    <text x={t.x} y={t.y} textAnchor={t.anchor ?? 'start'} className={`an-text an-${t.size ?? 'md'} tone-t-${t.tone ?? 'plain'} ${t.bold ? 'bold' : ''}`}>
      {t.text}
    </text>
  );
}

/**
 * Plays an animation: smooth movement between steps, a caption per step, and the usual controls.
 * Starts paused so the first picture and caption can be read.
 */
export function AnimPlayer({ script }: { script: AnimScript }) {
  const [anim, setAnim] = useState(script);
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(0);
  const [t, setT] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const start = useRef(0);
  const raf = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const last = anim.frames.length - 1;
  const dur = reduced() ? 1 : 750 / speed;

  const goTo = useCallback(
    (k: number) => {
      const target = Math.max(0, Math.min(last, k));
      clearTimeout(timer.current);
      setFrom(to);
      setTo(target);
      start.current = performance.now();
      setT(target === to ? 1 : 0);
    },
    [last, to],
  );

  // Tween.
  useEffect(() => {
    if (t >= 1) return;
    const tick = (now: number) => {
      const v = Math.min(1, (now - start.current) / dur);
      setT(v);
      if (v < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [from, to, dur, t >= 1]); // eslint-disable-line react-hooks/exhaustive-deps

  // Autoplay: after a step lands, wait long enough to read its caption, then go on.
  useEffect(() => {
    if (!playing || t < 1) return;
    if (to >= last) {
      setPlaying(false);
      return;
    }
    const words = anim.frames[to].say.split(/\s+/).length;
    timer.current = setTimeout(() => goTo(to + 1), Math.max(1300, words * 260) / speed);
    return () => clearTimeout(timer.current);
  }, [playing, t, to, last, speed, anim, goTo]);

  const fresh = () => {
    clearTimeout(timer.current);
    setAnim(script());
    setFrom(0);
    setTo(0);
    setT(1);
    setPlaying(false);
  };

  const play = () => {
    if (to >= last) {
      setFrom(0);
      setTo(0);
      setT(1);
    }
    setPlaying(!playing || to >= last);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') goTo(to + 1);
    else if (e.key === 'ArrowLeft') goTo(to - 1);
    else if (e.key === ' ') play();
    else return;
    e.preventDefault();
  };

  const scene = between(anim.frames[from] ?? anim.frames[0], anim.frames[to], t);
  const v = anim.view;
  // Layers: regions, then empty slots, then arrows, then values and nodes on top.
  const behind = [...scene.boxes.filter((s) => s.v.shape === 'frame'), ...scene.boxes.filter((s) => s.v.shape === 'slot')];
  const front = scene.boxes.filter((s) => s.v.shape !== 'frame' && s.v.shape !== 'slot');

  return (
    <div className="anim" tabIndex={0} onKeyDown={onKey} aria-label={`Animation: ${anim.title}`}>
      <div className="anim-title">{anim.title}</div>
      <div className="anim-stage">
        <svg viewBox={`${v.x} ${v.y} ${v.w} ${v.h}`} width={v.w} style={{ maxWidth: '100%', height: 'auto' }} role="img" aria-label={anim.frames[to].say}>
          <defs>
            {['plain', 'accent', 'ok', 'bad', 'warn', 'ptr', 'dim'].map((k) => (
              <marker key={k} id={`an-head-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" className={`an-head tone-a-${k}`} />
              </marker>
            ))}
          </defs>
          {behind.map((s) => (
            <g key={s.id} opacity={s.opacity}>
              <BoxShape b={s.v} />
            </g>
          ))}
          {scene.arrows.map((a) => {
            const { d, mid } = arrowPath(a.p, a.q, a.v.bend);
            const k = a.v.tone && a.v.tone !== 'hl' && a.v.tone !== 'ghost' ? a.v.tone : 'plain';
            return (
              <g key={a.id} opacity={a.opacity}>
                <path d={d} className={`an-arrow tone-a-${k} ${a.v.dashed ? 'dashed' : ''}`} markerEnd={a.v.line ? undefined : `url(#an-head-${k})`} />
                {a.v.label && (
                  <text x={mid.x} y={mid.y - 5} textAnchor="middle" className="an-arrow-label">
                    {a.v.label}
                  </text>
                )}
              </g>
            );
          })}
          {front.map((s) => (
            <g key={s.id} opacity={s.opacity}>
              <BoxShape b={s.v} />
            </g>
          ))}
          {scene.texts.map((s) => (
            <g key={s.id} opacity={s.opacity}>
              <TextShape t={s.v} />
            </g>
          ))}
        </svg>
      </div>
      <div className="anim-caption" aria-live="polite">
        <span className="anim-stepno">
          {to + 1}/{last + 1}
        </span>
        <span>
          <Rich text={anim.frames[to].say} />
        </span>
      </div>
      <div className="anim-progress" aria-hidden="true">
        {anim.frames.map((_, i) => (
          <button key={i} type="button" tabIndex={-1} className={`anim-dot ${i <= to ? 'on' : ''}`} onClick={() => goTo(i)} title={`Step ${i + 1}`} />
        ))}
      </div>
      <div className="anim-controls">
        <button type="button" className="btn small" onClick={() => goTo(0)} disabled={to === 0} title="Back to the start">
          ⏮
        </button>
        <button type="button" className="btn small" onClick={() => goTo(to - 1)} disabled={to === 0}>
          ◀ Back
        </button>
        <button type="button" className="btn small primary anim-play" onClick={play}>
          {playing ? '⏸ Pause' : to >= last ? '↺ Replay' : '▶ Play'}
        </button>
        <button type="button" className="btn small" onClick={() => goTo(to + 1)} disabled={to >= last}>
          Next ▶
        </button>
        <span className="anim-speed">
          {SPEEDS.map((s) => (
            <button key={s} type="button" className={`btn small ${speed === s ? 'on' : 'ghost'}`} onClick={() => setSpeed(s)}>
              {s}×
            </button>
          ))}
        </span>
        <button type="button" className="btn small ghost" onClick={fresh} title="Same idea, new values">
          New example
        </button>
      </div>
    </div>
  );
}
