'use client';

import type { DayAvailability, TimeSlot } from '@/lib/types';
import { getDaysUntilEndOfNextMonth, formatDate } from '@/lib/availability';
import { TIME_SLOT_LABELS } from '@/lib/types';

interface Props {
  value: DayAvailability[];
  onChange: (val: DayAvailability[]) => void;
  /** Highlight these dates from other participants (date → slot → count) */
  heatmap?: Record<string, Partial<Record<TimeSlot, number>>>;
  totalParticipants?: number;
}

const DAYS = getDaysUntilEndOfNextMonth();
const SLOTS: TimeSlot[] = ['morning', 'lunch', 'afternoon'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Build week rows with null-padding for the first partial week
function buildWeeks(days: string[]): (string | null)[][] {
  const weeks: (string | null)[][] = [];
  let week: (string | null)[] = [];
  const firstDow = new Date(days[0] + 'T12:00:00').getDay();
  for (let i = 0; i < firstDow; i++) week.push(null);
  for (const day of days) {
    week.push(day);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  while (week.length > 0 && week.length < 7) week.push(null);
  if (week.length) weeks.push(week);
  return weeks;
}

function heatRing(count: number, total: number): string {
  if (!total || !count) return '';
  const r = count / total;
  if (r >= 1) return 'ring-2 ring-green-400';
  if (r >= 0.5) return 'ring-2 ring-yellow-400';
  return 'ring-2 ring-orange-300';
}

export default function CalendarPicker({ value, onChange, heatmap, totalParticipants }: Props) {
  function getAvail(date: string) {
    return value.find((d) => d.date === date);
  }

  // Step 1: toggle a date selected/unselected — NO popover, no blocking
  function toggleDate(date: string) {
    if (getAvail(date)) {
      onChange(value.filter((d) => d.date !== date));
    } else {
      onChange([...value, { date, slots: [] }]);
    }
  }

  // Step 2: toggle a time slot on an already-selected date
  function toggleSlot(date: string, slot: TimeSlot) {
    onChange(
      value.map((d) => {
        if (d.date !== date) return d;
        const slots = d.slots.includes(slot)
          ? d.slots.filter((s) => s !== slot)
          : [...d.slots, slot];
        return { ...d, slots };
      }),
    );
  }

  const weeks = buildWeeks(DAYS);
  const selectedDates = [...value].sort((a, b) => a.date.localeCompare(b.date));
  const shownMonths = new Set<string>();

  return (
    <div className="select-none space-y-6">
      {/* ── STEP 1: Calendar grid ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Step 1 — Tap dates you could meet
        </p>

        {/* Day-of-week header */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DOW.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 uppercase py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="space-y-1">
          {weeks.map((week, wi) => {
            const firstReal = week.find((d): d is string => d !== null);
            let monthLabel: string | null = null;
            if (firstReal) {
              const m = new Date(firstReal + 'T12:00:00').toLocaleDateString('en-US', {
                month: 'long', year: 'numeric',
              });
              if (!shownMonths.has(m)) { shownMonths.add(m); monthLabel = m; }
            }

            return (
              <div key={wi}>
                {monthLabel && (
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-3 mb-1 pl-1">
                    {monthLabel}
                  </p>
                )}
                <div className="grid grid-cols-7 gap-1">
                  {week.map((date, di) => {
                    if (!date) return <div key={`empty-${wi}-${di}`} />;

                    const avail = getAvail(date);
                    const selected = !!avail;
                    const hasSlots = selected && avail!.slots.length > 0;
                    const dayNum = new Date(date + 'T12:00:00').getDate();
                    const dayHeat = heatmap?.[date];
                    const maxHeat = dayHeat ? Math.max(...SLOTS.map((s) => dayHeat[s] ?? 0)) : 0;

                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => toggleDate(date)}
                        className={[
                          'w-full aspect-square rounded-xl text-sm font-medium border-2 transition-all duration-100 flex flex-col items-center justify-center gap-0.5',
                          selected
                            ? 'bg-indigo-600 border-indigo-700 text-white shadow-md scale-105'
                            : maxHeat && totalParticipants
                            ? `bg-white text-gray-700 ${heatRing(maxHeat, totalParticipants)} hover:bg-indigo-50`
                            : 'border-gray-200 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50 bg-white',
                        ].join(' ')}
                      >
                        <span>{dayNum}</span>
                        {/* green dot = slots chosen */}
                        {hasSlots && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── STEP 2: Time slot panel (shown only when dates are selected) ── */}
      {selectedDates.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Step 2 — Pick times for each selected date
          </p>
          <div className="space-y-3">
            {selectedDates.map(({ date, slots }) => {
              const dayHeat = heatmap?.[date];
              return (
                <div
                  key={date}
                  className="bg-gray-50 rounded-2xl p-4 border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-gray-800">{formatDate(date)}</span>
                    <button
                      type="button"
                      onClick={() => toggleDate(date)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      ✕ remove
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SLOTS.map((slot) => {
                      const active = slots.includes(slot);
                      const cnt = dayHeat?.[slot] ?? 0;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => toggleSlot(date, slot)}
                          className={[
                            'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all',
                            active
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600',
                          ].join(' ')}
                        >
                          {TIME_SLOT_LABELS[slot]}
                          {cnt > 0 && totalParticipants && (
                            <span className={`text-xs ${active ? 'text-indigo-200' : 'text-gray-400'}`}>
                              ({cnt}/{totalParticipants})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {slots.length === 0 && (
                    <p className="text-xs text-amber-500 mt-2">
                      ↑ Select at least one time slot
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
