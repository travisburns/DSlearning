import type { Progress } from '../engine/mastery';
import { dueItems, isUnlocked, skillStrength } from '../engine/mastery';
import { SKILLS, TIERS } from '../engine/types';
import { CONCEPTS, getConcept } from '../content';

interface Props {
  progress: Progress;
  onLearn: (id: string) => void;
  onReview: () => void;
  onStats: () => void;
  onReset: () => void;
}

export function Home({ progress, onLearn, onReview, onStats, onReset }: Props) {
  const due = dueItems(progress).length;
  const learned = progress.learned.length;
  const tiers = TIERS.map((name, t) => ({ name, t, concepts: CONCEPTS.filter((c) => c.tier === t) })).filter((x) => x.concepts.length);

  return (
    <div className="home">
      <header className="hero">
        <div>
          <h1>DS Learning</h1>
          <p className="muted">
            Every data structure is built from two things: <strong>slots in a row</strong> and <strong>pointers</strong>, plus
            one rule it promises to keep. Learn each one by working it by hand, not by memorising.
          </p>
        </div>
        <div className="hero-actions">
          <div className="stat">
            <strong>{learned}</strong>/<span>{CONCEPTS.length}</span> learned
          </div>
          <button type="button" className="btn" onClick={onStats} disabled={progress.log.length === 0}>
            Stats
          </button>
          <button type="button" className="btn primary" onClick={onReview} disabled={learned === 0}>
            {due ? `Review (${due} due)` : 'Practise'}
          </button>
        </div>
      </header>

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
          <div className="tiles">
            {concepts.map((c) => {
              const unlocked = isUnlocked(progress, c);
              const done = progress.learned.includes(c.id);
              const missing = c.prereqs.filter((p) => !progress.learned.includes(p)).map((p) => getConcept(p)?.title ?? p);
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`tile ${done ? 'learned' : unlocked ? 'open' : 'locked'}`}
                  disabled={!unlocked}
                  onClick={() => onLearn(c.id)}
                  title={unlocked ? '' : `Needs: ${missing.join(', ')}`}
                >
                  <div className="tile-title">
                    {c.title}
                    <span className="tile-status">{done ? '✓' : unlocked ? 'New' : '🔒'}</span>
                  </div>
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
