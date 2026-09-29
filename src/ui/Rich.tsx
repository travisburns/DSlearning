import { useState } from 'react';
import { GLOSSARY_RE, lookup } from '../content/glossary';

/** A technical word: underlined, tap/click (or hover) to see its plain meaning. */
function Term({ word }: { word: string }) {
  const [open, setOpen] = useState(false);
  const entry = lookup(word)!;
  return (
    <span className="term-wrap">
      <span
        role="button"
        tabIndex={0}
        className="term"
        title={entry.def}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            setOpen(!open);
          }
        }}
      >
        {word}
      </span>
      {open && (
        <span className="term-pop" role="note">
          <b>{entry.term}:</b> {entry.def}
        </span>
      )}
    </span>
  );
}

/**
 * Text with every technical word explained in place. Each term is marked the first time it
 * appears in a block, so the text stays readable.
 */
export function Rich({ text }: { text: string }) {
  const seen = new Set<string>();
  const parts: (string | { word: string })[] = [];
  let last = 0;
  for (const m of text.matchAll(GLOSSARY_RE)) {
    const key = m[0].toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    parts.push(text.slice(last, m.index), { word: m[0] });
    last = m.index! + m[0].length;
  }
  parts.push(text.slice(last));
  return <>{parts.map((p, i) => (typeof p === 'string' ? p : <Term key={i} word={p.word} />))}</>;
}
