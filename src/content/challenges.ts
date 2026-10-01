/**
 * Build-it challenges: a small, real feature in C# for each lesson, checked by xUnit tests.
 * The brief for each lives next to its starter code in challenges/src/<lesson id>/README.md;
 * the app reads those files directly so there is one source of truth.
 */

const raw = import.meta.glob('../../challenges/src/*/README.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export const CHALLENGES: Record<string, string> = Object.fromEntries(
  Object.entries(raw).map(([path, md]) => [path.split('/').slice(-2)[0], md]),
);

export const testCommand = (id: string) => `dotnet test --filter Lesson=${id}`;
