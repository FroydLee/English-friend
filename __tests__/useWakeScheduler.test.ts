import { isNightTime, randomIntervalMs, adjustInterval, createWakeScheduler } from '../src/hooks/useWakeScheduler';

describe('isNightTime', () => {
  it('returns true at hour 3', () => {
    const d = new Date('2026-05-14T03:00:00');
    expect(isNightTime(d)).toBe(true);
  });

  it('returns false at hour 14', () => {
    const d = new Date('2026-05-14T14:00:00');
    expect(isNightTime(d)).toBe(false);
  });

  it('returns true at hour 0', () => {
    const d = new Date('2026-05-14T00:00:00');
    expect(isNightTime(d)).toBe(true);
  });

  it('returns false at hour 8', () => {
    const d = new Date('2026-05-14T08:00:00');
    expect(isNightTime(d)).toBe(false);
  });
});

describe('randomIntervalMs', () => {
  it('returns a value between min and max', () => {
    const min = 1000;
    const max = 5000;
    for (let i = 0; i < 100; i++) {
      const v = randomIntervalMs(min, max);
      expect(v).toBeGreaterThanOrEqual(min);
      expect(v).toBeLessThanOrEqual(max);
    }
  });
});

describe('adjustInterval', () => {
  it('doubles interval when consecutiveMisses >= 3', () => {
    expect(adjustInterval(60000, 3)).toBe(120000);
  });

  it('does not change interval when misses < 3', () => {
    expect(adjustInterval(60000, 1)).toBe(60000);
  });

  it('caps at maxInterval', () => {
    expect(adjustInterval(60000, 3, 100000)).toBe(100000);
  });
});

describe('createWakeScheduler', () => {
  it('shouldWake returns false during night time', () => {
    const scheduler = createWakeScheduler({ nextWakeAt: 0, consecutiveMisses: 0, dailyConversationCount: 0 });
    // Use a known night time
    const nightTime = new Date('2026-05-14T03:00:00').getTime();
    expect(scheduler.shouldWake(nightTime)).toBe(false);
  });

  it('shouldWake returns false when daily limit reached', () => {
    const scheduler = createWakeScheduler({ nextWakeAt: 0, consecutiveMisses: 0, dailyConversationCount: 12 });
    const dayTime = new Date('2026-05-14T14:00:00').getTime();
    expect(scheduler.shouldWake(dayTime)).toBe(false);
  });

  it('shouldWake returns true when past nextWakeAt', () => {
    const scheduler = createWakeScheduler({ nextWakeAt: 0, consecutiveMisses: 0, dailyConversationCount: 5 });
    const dayTime = new Date('2026-05-14T14:00:00').getTime();
    expect(scheduler.shouldWake(dayTime)).toBe(true);
  });

  it('onConversationStarted increments daily count', () => {
    const scheduler = createWakeScheduler({ nextWakeAt: 5000, consecutiveMisses: 0, dailyConversationCount: 5 });
    scheduler.onConversationStarted();
    expect(scheduler.schedule.dailyConversationCount).toBe(6);
  });

  it('onConversationEnded resets misses on response', () => {
    const scheduler = createWakeScheduler({ nextWakeAt: 5000, consecutiveMisses: 3, dailyConversationCount: 5 });
    scheduler.onConversationEnded(true);
    expect(scheduler.schedule.consecutiveMisses).toBe(0);
    expect(scheduler.schedule.nextWakeAt).toBeGreaterThan(Date.now());
  });

  it('onConversationEnded increments misses on no response', () => {
    const scheduler = createWakeScheduler({ nextWakeAt: 5000, consecutiveMisses: 0, dailyConversationCount: 5 });
    scheduler.onConversationEnded(false);
    expect(scheduler.schedule.consecutiveMisses).toBe(1);
  });
});
