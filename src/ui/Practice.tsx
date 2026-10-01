import { useState } from 'react';
import type { Concept } from '../engine/types';
import { PRACTICE, problemUrl } from '../content/practice';

const KEY = 'dslearning:solved';

/** Ticks are "lessonId:problemNumber", so one problem used by two lessons (solved two ways) is ticked separately. */
export function loadSolved(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

function saveSolved(s: Set<string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...s]));
  } catch {
    // Storage blocked: ticks just won't persist.
  }
}

export function solvedCount(conceptId: string, solved: Set<string>): { done: number; total: number } {
  const probs = PRACTICE[conceptId]?.problems ?? [];
  return { done: probs.filter((pr) => solved.has(`${conceptId}:${pr.n}`)).length, total: probs.length };
}

export function Practice({ concept }: { concept: Concept }) {
  const set = PRACTICE[concept.id];
  const [solved, setSolved] = useState(loadSolved);
  if (!set) return null;
  const toggle = (k: string) => {
    const next = new Set(solved);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    saveSolved(next);
    setSolved(next);
  };
  return (
    <div className="practice">
      <h2>More practice: LeetCode problems</h2>
      <p className="muted">
        You understand how {concept.title} works. These are real problems that use it. Solve them on LeetCode in C#: it runs
        your code against its own tests and tells you if it’s right. Try them in order; they get harder. Tick one off when
        LeetCode accepts it. Ticks are just your checklist; they don’t affect mastery.
      </p>
      {set.problems.length > 0 && (
        <ol className="practice-list">
          {set.problems.map((pr) => {
            const k = `${concept.id}:${pr.n}`;
            return (
              <li key={k} className={solved.has(k) ? 'solved' : ''}>
                <label className="practice-tick">
                  <input type="checkbox" checked={solved.has(k)} onChange={() => toggle(k)} aria-label={`Solved ${pr.title}`} />
                </label>
                <div>
                  <a href={problemUrl(pr)} target="_blank" rel="noreferrer">
                    {pr.n}. {pr.title}
                  </a>{' '}
                  <span className={`diff diff-${pr.diff.toLowerCase()}`}>{pr.diff}</span>
                  {pr.note && <div className="practice-note">{pr.note}</div>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {set.none && <p className="practice-none">{set.none}</p>}
    </div>
  );
}
