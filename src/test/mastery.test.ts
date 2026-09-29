import { describe, expect, it } from 'vitest';
import { calibration, emptyProgress, interleave, markLearned, misconceptions, recordAnswer, scheduleAnswer, newItem, skillStrength, dueItems } from '../engine/mastery';
import { CARD_TYPES } from '../engine/types';

const now = 1_000_000_000_000;

describe('scheduling', () => {
  it('moves up a level when right and sure', () => {
    expect(scheduleAnswer(newItem(now), true, 2, now).level).toBe(1);
  });
  it('does not promote lucky guesses', () => {
    expect(scheduleAnswer(newItem(now), true, 1, now).level).toBe(0);
  });
  it('drops to level 0 and counts a misconception when certain and wrong', () => {
    const it = scheduleAnswer({ ...newItem(now), level: 4 }, false, 3, now);
    expect(it.level).toBe(0);
    expect(it.confidentMisses).toBe(1);
    expect(it.due).toBe(now);
  });
  it('waits longer at higher levels', () => {
    const a = scheduleAnswer({ ...newItem(now), level: 1 }, true, 3, now);
    const b = scheduleAnswer({ ...newItem(now), level: 3 }, true, 3, now);
    expect(b.due - now).toBeGreaterThan(a.due - now);
  });
});

describe('progress', () => {
  it('logs answers and computes calibration', () => {
    let p = emptyProgress();
    p = recordAnswer(p, 'stack', 'predict', true, 3, now);
    p = recordAnswer(p, 'stack', 'count', false, 3, now);
    p = recordAnswer(p, 'queue', 'predict', true, 1, now);
    const cal = calibration(p);
    expect(cal[2]).toEqual({ confidence: 3, answered: 2, correct: 1 });
    expect(cal[0]).toEqual({ confidence: 1, answered: 1, correct: 1 });
    expect(misconceptions(p)).toEqual([{ concept: 'stack', type: 'count', count: 1 }]);
  });
  it('skill strength averages the card types that feed it', () => {
    let p = emptyProgress();
    p = recordAnswer(p, 'stack', 'count', true, 3, now);
    expect(skillStrength(p, 'stack', 'cost')).toBeCloseTo(0.2);
    expect(skillStrength(p, 'stack', 'mechanism')).toBe(0);
  });
  it('every card type of a learned concept becomes due', () => {
    const p = markLearned(emptyProgress(), 'stack');
    expect(dueItems(p, now).length).toBe(CARD_TYPES.length);
  });
  it('interleaving avoids the same concept twice in a row when possible', () => {
    const items = [
      { concept: 'a', type: 'predict' as const },
      { concept: 'a', type: 'count' as const },
      { concept: 'b', type: 'predict' as const },
      { concept: 'b', type: 'count' as const },
    ];
    const out = interleave(items);
    for (let i = 1; i < out.length; i++) expect(out[i].concept).not.toBe(out[i - 1].concept);
  });
});
