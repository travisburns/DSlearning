import { useState } from 'react';
import type { Concept } from '../engine/types';
import { CHALLENGES, testCommand } from '../content/challenges';
import { Markdown } from './Markdown';

const KEY = 'dslearning:built';

export function loadBuilt(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

/** The work-style challenge for a lesson: a small C# feature, checked by the tests in challenges/tests. */
export function BuildIt({ concept }: { concept: Concept }) {
  const md = CHALLENGES[concept.id];
  const [built, setBuilt] = useState(loadBuilt);
  if (!md) return null;
  const title = md.match(/^# (.*)$/m)?.[1] ?? concept.title;
  const toggle = () => {
    const next = new Set(built);
    if (next.has(concept.id)) next.delete(concept.id);
    else next.add(concept.id);
    try {
      localStorage.setItem(KEY, JSON.stringify([...next]));
    } catch {
      // storage blocked: the tick just won't persist
    }
    setBuilt(next);
  };
  return (
    <div className="buildit">
      <h2>C# challenge: {title}</h2>
      <p className="muted">
        A small feature like one you'd get at work. You decide how {concept.title} fits in, write it in C#, and the tests
        check that it works and that it's fast enough. Nothing here is graded by you or by an AI: the tests are the judge.
      </p>
      <div className="brief">
        <Markdown text={md.replace(/\*\*Run:\*\*.*$/m, '')} skipTitle />
      </div>
      <h3>How to do it</h3>
      <ol className="how-run">
        <li>
          Open the <code>challenges</code> folder of this project in your editor (Visual Studio, Rider or VS Code). You
          need the .NET 8 SDK.
        </li>
        <li>
          Write your code in <code>challenges/src/{concept.id}/</code>. The methods are there, empty.
        </li>
        <li>
          In a terminal, inside <code>challenges/tests</code>, run:
          <pre className="cmd">{testCommand(concept.id)}</pre>
          Red tests tell you what's wrong. A speed test failing means it works but the approach is too slow.
        </li>
        <li>
          When everything is green, compare with the reference answer in <code>challenges/solutions/{concept.id}/</code>.
        </li>
      </ol>
      <label className="built-tick">
        <input type="checkbox" checked={built.has(concept.id)} onChange={toggle} /> All tests pass for me
      </label>
    </div>
  );
}
