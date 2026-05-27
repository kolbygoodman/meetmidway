import type { Participant, TimeSlot, OverlapEntry } from './types';

/**
 * Returns every (date, slot) pair that at least one participant has marked
 * available, sorted by participant count descending.
 */
export function computeOverlap(participants: Participant[]): OverlapEntry[] {
  const map = new Map<string, { count: number; names: string[] }>();

  for (const p of participants) {
    for (const day of p.availability) {
      for (const slot of day.slots) {
        const key = `${day.date}__${slot}`;
        const existing = map.get(key) ?? { count: 0, names: [] };
        existing.count += 1;
        existing.names.push(p.name);
        map.set(key, existing);
      }
    }
  }

  const entries: OverlapEntry[] = [];
  for (const [key, val] of map.entries()) {
    const [date, slot] = key.split('__') as [string, TimeSlot];
    entries.push({ date, slot, count: val.count, participants: val.names });
  }

  return entries.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.date.localeCompare(b.date);
  });
}

/**
 * Returns the best (date, slot) for a given number of participants (highest overlap).
 */
export function getBestSlot(
  participants: Participant[],
): OverlapEntry | null {
  const overlap = computeOverlap(participants);
  return overlap[0] ?? null;
}

/**
 * Generates the next N days starting from today as ISO date strings.
 */
export function getNextDays(n: number): string[] {
  const days: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export function formatDate(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00'); // noon avoids DST edge cases
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatDateLong(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
