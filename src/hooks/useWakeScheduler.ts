import { WakeSchedule } from '../types';
import { WAKEN_INTERVAL_MIN_MS, WAKEN_INTERVAL_MAX_MS, CONSECUTIVE_MISSES_MULTIPLIER, NIGHT_START_HOUR, NIGHT_END_HOUR, DAILY_MAX_CONVERSATIONS } from '../utils/constants';

export function isNightTime(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= NIGHT_START_HOUR && hour < NIGHT_END_HOUR;
}

export function randomIntervalMs(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function adjustInterval(
  baseInterval: number,
  consecutiveMisses: number,
  maxInterval: number = 4 * 60 * 60 * 1000,
): number {
  if (consecutiveMisses >= 3) {
    return Math.min(baseInterval * CONSECUTIVE_MISSES_MULTIPLIER, maxInterval);
  }
  return baseInterval;
}

export interface WakeScheduler {
  schedule: WakeSchedule;
  shouldWake: (now: number) => boolean;
  onConversationStarted: () => void;
  onConversationEnded: (userResponded: boolean) => void;
  computeNextWake: (now: number, consecutiveMisses: number) => number;
}

export function createWakeScheduler(initialSchedule: WakeSchedule): WakeScheduler {
  let schedule = { ...initialSchedule };

  return {
    get schedule() { return { ...schedule }; },

    shouldWake(now: number): boolean {
      if (isNightTime(new Date(now))) return false;
      if (schedule.dailyConversationCount >= DAILY_MAX_CONVERSATIONS) return false;
      return now >= schedule.nextWakeAt;
    },

    onConversationStarted() {
      schedule.dailyConversationCount += 1;
    },

    onConversationEnded(userResponded: boolean) {
      const now = Date.now();
      if (!userResponded) {
        schedule.consecutiveMisses += 1;
      } else {
        schedule.consecutiveMisses = 0;
      }
      schedule.nextWakeAt = this.computeNextWake(now, schedule.consecutiveMisses);
    },

    computeNextWake(now: number, consecutiveMisses: number): number {
      const baseInterval = randomIntervalMs(WAKEN_INTERVAL_MIN_MS, WAKEN_INTERVAL_MAX_MS);
      const adjusted = adjustInterval(baseInterval, consecutiveMisses);
      return now + adjusted;
    },
  };
}
