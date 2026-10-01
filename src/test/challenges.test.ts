import { describe, expect, it } from 'vitest';
import { CHALLENGES } from '../content/challenges';
import { CONCEPTS } from '../content';

const files = import.meta.glob('../../challenges/{src,solutions,tests}/**/*.cs', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const inDir = (dir: string, id: string) =>
  Object.keys(files)
    .filter((p) => p.includes(`/challenges/${dir}/${id}/`))
    .map((p) => p.split('/').pop()!)
    .sort();
const testSources = Object.entries(files)
  .filter(([p]) => p.includes('/challenges/tests/'))
  .map(([, src]) => src);

describe('C# build-it challenges', () => {
  const ids = Object.keys(CHALLENGES);
  it('every lesson has a challenge', () => {
    for (const c of CONCEPTS) expect(CHALLENGES[c.id], `${c.id} has no C# challenge`).toBeDefined();
  });
  it('every challenge folder belongs to a lesson', () => {
    for (const id of ids) expect(CONCEPTS.some((c) => c.id === id), `${id} is not a lesson`).toBe(true);
  });
  for (const id of ids) {
    it(`${id}: has a brief, starter code, a solution and tests`, () => {
      const md = CHALLENGES[id];
      expect(md).toMatch(/^# .+/);
      expect(md).toContain(`dotnet test --filter Lesson=${id}`);
      expect(inDir('src', id).length).toBeGreaterThan(0);
      expect(inDir('solutions', id)).toEqual(inDir('src', id));
      expect(testSources.some((src) => src.includes(`[Trait("Lesson", "${id}")]`)), `${id} has no tests`).toBe(true);
      for (const f of inDir('src', id)) {
        const starter = files[Object.keys(files).find((p) => p.endsWith(`/challenges/src/${id}/${f}`))!];
        expect(starter, `${id}/${f} starter should leave the work to you`).toContain('NotImplementedException');
      }
    });
  }
});
