export const randInt = (lo: number, hi: number): number => lo + Math.floor(Math.random() * (hi - lo + 1));

export const pick = <T>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];

export function shuffle<T>(xs: readonly T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** `count` distinct values from [lo, hi]. */
export function distinctInts(count: number, lo: number, hi: number): number[] {
  const set = new Set<number>();
  while (set.size < count) set.add(randInt(lo, hi));
  return [...set];
}

/** Small, readable values for storing in memory. */
export const values = (count: number): number[] => distinctInts(count, 1, 99);
