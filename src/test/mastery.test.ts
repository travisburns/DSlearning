import { describe, expect, it } from 'vitest';
import { isMastered, MASTERY_LEVEL, calibration, emptyProgress, interleave, markLearned, misconceptions, recordAnswer, scheduleAnswer, newItem, skillStrength, dueItems } from '../engine/mastery';
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
  it('never promotes when practising before the card is due', () => {
    const early = scheduleAnswer({ ...newItem(now), level: 2, due: now + 1000 }, true, 3, now);
    expect(early.level).toBe(2);
    expect(early.due).toBe(now + 1000);
  });
  it('an early miss still drops the level', () => {
    expect(scheduleAnswer({ ...newItem(now), level: 2, due: now + 1000 }, false, 2, now).level).toBe(0);
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
  it('mastery needs every card type proven, and is lost after a miss', () => {
    let p = markLearned(emptyProgress(), 'stack');
    for (const t of CARD_TYPES) p.items[`stack:${t}`] = { ...newItem(now), level: MASTERY_LEVEL };
    expect(isMastered(p, 'stack')).toBe(true);
    p = recordAnswer(p, 'stack', 'count', false, 2, now);
    expect(isMastered(p, 'stack')).toBe(false);
  });
  it('mastery requires passing the lesson', () => {
    const p = emptyProgress();
    for (const t of CARD_TYPES) p.items[`stack:${t}`] = { ...newItem(now), level: MASTERY_LEVEL };
    expect(isMastered(p, 'stack')).toBe(false);
  });
  it('unseen card types of a passed lesson come due the next day, not immediately', () => {
    const p = markLearned(emptyProgress(), 'stack', now);
    expect(dueItems(p, now).length).toBe(0);
    expect(dueItems(p, now + 25 * 3600 * 1000).length).toBe(CARD_TYPES.length);
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
