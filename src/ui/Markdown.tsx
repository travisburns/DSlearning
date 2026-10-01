import type React from 'react';

/** Inline bits: `code` and **bold**. */
function inline(text: string): React.ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('`') && part.endsWith('`') ? (
      <code key={i}>{part.slice(1, -1)}</code>
    ) : part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      part
    ),
  );
}

/** Just enough Markdown for the challenge briefs: headings, paragraphs and bullet lists. */
export function Markdown({ text, skipTitle = false }: { text: string; skipTitle?: boolean }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className="md">
      {blocks.map((b, i) => {
        const lines = b.split('\n');
        if (b.startsWith('# ')) return skipTitle ? null : <h3 key={i}>{inline(b.slice(2))}</h3>;
        if (b.startsWith('## ')) return <h4 key={i}>{inline(b.slice(3))}</h4>;
        if (lines.every((l) => l.startsWith('- ')))
          return (
            <ul key={i}>
              {lines.map((l, k) => (
                <li key={k}>{inline(l.slice(2))}</li>
              ))}
            </ul>
          );
        // A paragraph followed directly by a list ("**Build** …:\n\n- …" is split already; this handles "text:\n- a\n- b").
        const firstBullet = lines.findIndex((l) => l.startsWith('- '));
        if (firstBullet > 0)
          return (
            <div key={i}>
              <p>{inline(lines.slice(0, firstBullet).join(' '))}</p>
              <ul>
                {lines.slice(firstBullet).map((l, k) => (
                  <li key={k}>{inline(l.replace(/^- /, ''))}</li>
                ))}
              </ul>
            </div>
          );
        return <p key={i}>{inline(lines.join(' '))}</p>;
      })}
    </div>
  );
}
