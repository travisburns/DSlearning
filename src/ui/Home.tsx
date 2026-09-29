import type { Progress } from '../engine/mastery';
import { dueItems, isMastered, isUnlocked, provenTypes, skillStrength } from '../engine/mastery';
import { CARD_TYPES, SKILLS, TIERS } from '../engine/types';
import { useState } from 'react';
import { CONCEPTS, getConcept } from '../content';
import { TIER_INTRO } from '../content/learn';
import { PathMap } from './PathMap';

interface Props {
  progress: Progress;
  onLearn: (id: string) => void;
  onReview: () => void;
  onStats: () => void;
  onHelp: () => void;
  onReset: () => void;
}

function loadView(): 'path' | 'list' {
  try {
    return localStorage.getItem('dslearning:view') === 'list' ? 'list' : 'path';
  } catch {
    return 'path';
  }
}

export function Home({ progress, onLearn, onReview, onStats, onHelp, onReset }: Props) {
  const [view, setView] = useState<'path' | 'list'>(loadView);
  const pickView = (v: 'path' | 'list') => {
    setView(v);
    try {
      localStorage.setItem('dslearning:view', v);
    } catch {
      /* ignore */
    }
  };
  const due = dueItems(progress).length;
  const learned = progress.learned.length;
  const mastered = CONCEPTS.filter((c) => isMastered(progress, c.id)).length;
  const tiers = TIERS.map((name, t) => ({ name, t, concepts: CONCEPTS.filter((c) => c.tier === t) })).filter((x) => x.concepts.length);

  return (
    <div className="home">
      <header className="hero">
        <div>
          <h1>DS Learning</h1>
          <p className="muted">
            Every data structure is built from two things: <strong>slots in a row</strong> and <strong>pointers</strong>, plus
            one rule it promises to keep. Algorithms then put those structures to work. Learn each one by working it by
            hand, not by memorising.
          </p>
        </div>
        <div className="hero-actions">
          <div className="stat">
            <div>
              <strong>{mastered}</strong>/<span>{CONCEPTS.length}</span> mastered
            </div>
            <div className="muted small">{learned} passed</div>
          </div>
          <button type="button" className="btn" onClick={onHelp}>
            How this works
          </button>
          <button type="button" className="btn" onClick={onStats} disabled={progress.log.length === 0}>
            Stats
          </button>
          <button type="button" className="btn primary" onClick={onReview} disabled={learned === 0}>
            {due ? `Review (${due} due)` : 'Practise'}
          </button>
        </div>
      </header>

      <p className="map-help">
        This is your learning path. You start at the top with the most basic ideas and work down; arrows show which lessons
        are built on which. A lesson opens once you’ve passed everything it’s built on. <b>Start here</b> marks lessons you
        can do now. Rounded, dashed boxes are <b>algorithms</b>: they open once you’ve passed the data structures they
        use.
      </p>

      <div className="view-toggle" role="tablist">
        <button type="button" role="tab" aria-selected={view === 'path'} className={`btn small ${view === 'path' ? 'on' : 'ghost'}`} onClick={() => pickView('path')}>
          Path
        </button>
        <button type="button" role="tab" aria-selected={view === 'list'} className={`btn small ${view === 'list' ? 'on' : 'ghost'}`} onClick={() => pickView('list')}>
          List with progress
        </button>
      </div>

      {view === 'path' && <PathMap progress={progress} onLearn={onLearn} />}

      {view === 'list' && (
      <>
      <div className="legend">
        <span className="legend-item">Skills:</span>
        {SKILLS.map((sk) => (
          <span key={sk.id} className="legend-item" title={`Fed by: ${sk.types.join(', ')}`}>
            <span className={`bar-swatch skill-${sk.id}`} /> {sk.name}
          </span>
        ))}
      </div>

      {tiers.map(({ name, t, concepts }) => (
        <section className="tier" key={t}>
          <h2>
            <span className="tier-num">Tier {t}</span> {name}
          </h2>
          <p className="tier-intro">{TIER_INTRO[t]}</p>
          <div className="tiles">
            {concepts.map((c) => {
              const unlocked = isUnlocked(progress, c);
              const done = progress.learned.includes(c.id);
              const star = isMastered(progress, c.id);
              const missing = c.prereqs.filter((p) => !progress.learned.includes(p)).map((p) => getConcept(p)?.title ?? p);
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`tile ${star ? 'mastered' : done ? 'learned' : unlocked ? 'open' : 'locked'}`}
                  disabled={!unlocked}
                  onClick={() => onLearn(c.id)}
                  title={unlocked ? '' : `Needs: ${missing.join(', ')}`}
                >
                  <div className="tile-title">
                    {c.title}
                    <span className="tile-status">
                      {star ? '★ Mastered' : done ? `✓ ${provenTypes(progress, c.id)}/${CARD_TYPES.length} proven` : unlocked ? 'New' : '🔒'}
                    </span>
                  </div>
                  {c.kind === 'algorithm' && <span className="algo-badge">Algorithm</span>}
                  <div className="tile-tag">{unlocked ? c.tagline : `Needs: ${missing.join(', ')}`}</div>
                  {done && (
                    <div className="bars" aria-label="Skill strength">
                      {SKILLS.map((sk) => {
                        const v = skillStrength(progress, c.id, sk.id);
                        return (
                          <div key={sk.id} className="bar" title={`${sk.name}: ${Math.round(v * 100)}%`}>
                            <div className={`bar-fill skill-${sk.id}`} style={{ width: `${v * 100}%` }} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ))}

      </>
      )}

      <footer className="foot">
        <button
          type="button"
          className="btn ghost small"
          onClick={() => {
            if (confirm('Erase all progress?')) onReset();
          }}
        >
          Reset progress
        </button>
      </footer>
    </div>
  );
}
