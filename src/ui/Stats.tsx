import type { Progress } from '../engine/mastery';
import { accuracyByType, calibration, misconceptions, skillStrength } from '../engine/mastery';
import { CARD_TYPE_INFO, SKILLS } from '../engine/types';
import { getConcept } from '../content';

const CONF_NAMES = { 1: 'Guessing', 2: 'Fairly sure', 3: 'Certain' } as const;
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

function verdict(cal: ReturnType<typeof calibration>): string {
  const [g, f, c] = cal;
  const notes: string[] = [];
  if (c.answered >= 5 && pct(c.correct, c.answered) < 85)
    notes.push(`When you say “Certain” you're right only ${pct(c.correct, c.answered)}% of the time. Those misses are misconceptions: they're being brought back first.`);
  if (g.answered >= 5 && pct(g.correct, g.answered) > 70)
    notes.push(`Your “Guessing” answers are right ${pct(g.correct, g.answered)}% of the time. You know more than you think; trust it a bit more.`);
  if (f.answered >= 5 && c.answered >= 5 && pct(f.correct, f.answered) > pct(c.correct, c.answered))
    notes.push('You do better when “fairly sure” than when “certain”. Slow down on the answers that feel obvious.');
  if (!notes.length) notes.push(c.answered + f.answered + g.answered < 15 ? 'Answer a few more cards for a clear picture.' : 'Your confidence matches your accuracy well. That self-knowledge is part of mastery.');
  return notes.join(' ');
}

export function Stats({ progress, onExit, onLearn }: { progress: Progress; onExit: () => void; onLearn: (id: string) => void }) {
  const cal = calibration(progress);
  const byType = accuracyByType(progress).filter((x) => x.answered > 0);
  const miss = misconceptions(progress).slice(0, 10);
  const learned = progress.learned;
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const recent = progress.log.filter((e) => e.t >= weekAgo).length;

  return (
    <div className="stats">
      <div className="lesson-top">
        <button type="button" className="btn ghost" onClick={onExit}>
          ← Map
        </button>
        <h1>Your stats</h1>
        <span className="muted">
          {progress.log.length} cards answered · {recent} in the last 7 days
        </span>
      </div>

      <section className="panel">
        <h2>Calibration: do you know what you know?</h2>
        <p className="muted small">Before every answer you said how sure you were. This is how often you were right at each level.</p>
        <div className="calib">
          {cal.map((c) => (
            <div key={c.confidence} className="calib-row">
              <span className="calib-label">{CONF_NAMES[c.confidence]}</span>
              <div className="meter">
                <div className={`meter-fill conf-${c.confidence}`} style={{ width: `${pct(c.correct, c.answered)}%` }} />
              </div>
              <span className="calib-num">
                {c.answered ? `${pct(c.correct, c.answered)}%` : '–'} <span className="muted small">({c.correct}/{c.answered})</span>
              </span>
            </div>
          ))}
        </div>
        <p>{verdict(cal)}</p>
      </section>

      <section className="panel">
        <h2>Skills across everything you've learned</h2>
        {learned.length === 0 ? (
          <p className="muted">Finish a lesson to see this.</p>
        ) : (
          <div className="calib">
            {SKILLS.map((sk) => {
              const v = learned.reduce((s, id) => s + skillStrength(progress, id, sk.id), 0) / learned.length;
              return (
                <div key={sk.id} className="calib-row">
                  <span className="calib-label" title={`Fed by: ${sk.types.map((t) => CARD_TYPE_INFO[t].name).join(', ')}`}>
                    {sk.name}
                  </span>
                  <div className="meter">
                    <div className={`meter-fill skill-${sk.id}`} style={{ width: `${v * 100}%` }} />
                  </div>
                  <span className="calib-num">{Math.round(v * 100)}%</span>
                </div>
              );
            })}
          </div>
        )}
        <p className="muted small">Strength grows when you answer correctly (and weren't guessing) at longer and longer intervals.</p>
      </section>

      <section className="panel">
        <h2>Accuracy by card type</h2>
        <div className="calib">
          {byType.map((x) => (
            <div key={x.type} className="calib-row">
              <span className="calib-label">
                <span className={`chip chip-${x.type}`}>{CARD_TYPE_INFO[x.type].name}</span>
              </span>
              <div className="meter">
                <div className={`meter-fill chipfill-${x.type}`} style={{ width: `${pct(x.correct, x.answered)}%` }} />
              </div>
              <span className="calib-num">
                {pct(x.correct, x.answered)}% <span className="muted small">({x.correct}/{x.answered})</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Misconceptions (certain, but wrong)</h2>
        {miss.length === 0 ? (
          <p className="muted">None so far.</p>
        ) : (
          <ul className="miss-list">
            {miss.map((m) => (
              <li key={`${m.concept}:${m.type}`}>
                <button type="button" className="btn ghost small" onClick={() => onLearn(m.concept)}>
                  {getConcept(m.concept)?.title ?? m.concept}
                </button>
                <span className={`chip chip-${m.type}`}>{CARD_TYPE_INFO[m.type].name}</span>
                <span className="muted small">× {m.count}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="muted small">These come back first in reviews. Click one to redo its lesson.</p>
      </section>
    </div>
  );
}
