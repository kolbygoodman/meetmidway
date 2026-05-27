'use client';

import type { OverlapEntry, TimeSlot } from '@/lib/types';
import { TIME_SLOT_SHORT } from '@/lib/types';
import { formatDate } from '@/lib/availability';

interface Props {
  overlap: OverlapEntry[];
  totalParticipants: number;
  onSelect?: (date: string, slot: TimeSlot) => void;
  finalDate?: string;
  finalSlot?: TimeSlot;
  isOrganizer?: boolean;
}

function bgColor(count: number, total: number): string {
  if (!count) return 'bg-gray-100 text-gray-300';
  const r = count / total;
  if (r >= 1) return 'bg-green-500 text-white';
  if (r >= 0.75) return 'bg-green-400 text-white';
  if (r >= 0.5) return 'bg-yellow-400 text-gray-800';
  if (r >= 0.25) return 'bg-orange-300 text-gray-800';
  return 'bg-red-200 text-gray-600';
}

const SLOTS: TimeSlot[] = ['morning', 'lunch', 'afternoon'];

export default function AvailabilityHeatmap({
  overlap,
  totalParticipants,
  onSelect,
  finalDate,
  finalSlot,
  isOrganizer,
}: Props) {
  // Build lookup: date → slot → entry
  const lookup: Record<string, Partial<Record<TimeSlot, OverlapEntry>>> = {};
  for (const entry of overlap) {
    if (!lookup[entry.date]) lookup[entry.date] = {};
    lookup[entry.date][entry.slot] = entry;
  }

  // Unique dates sorted
  const dates = [...new Set(overlap.map((e) => e.date))].sort();

  if (!dates.length) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No availability submitted yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="text-xs font-semibold text-gray-400 text-left pr-3 pb-2">Date</th>
            {SLOTS.map((s) => (
              <th key={s} className="text-xs font-semibold text-gray-500 text-center pb-2 px-1 whitespace-nowrap">
                {TIME_SLOT_SHORT[s]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dates.map((date) => (
            <tr key={date}>
              <td className="text-xs font-medium text-gray-600 pr-3 py-0.5 whitespace-nowrap">
                {formatDate(date)}
              </td>
              {SLOTS.map((slot) => {
                const entry = lookup[date]?.[slot];
                const count = entry?.count ?? 0;
                const isFinal = finalDate === date && finalSlot === slot;

                return (
                  <td key={slot} className="text-center">
                    <button
                      type="button"
                      disabled={!isOrganizer || !entry}
                      onClick={() => entry && onSelect?.(date, slot)}
                      title={
                        entry
                          ? `${entry.participants.join(', ')} available`
                          : 'No one available'
                      }
                      className={[
                        'w-16 py-1.5 rounded-lg text-xs font-bold transition-all',
                        isFinal
                          ? 'ring-4 ring-indigo-500 ring-offset-1 scale-110 bg-indigo-600 text-white'
                          : bgColor(count, totalParticipants),
                        isOrganizer && entry ? 'cursor-pointer hover:opacity-80 hover:scale-105' : '',
                      ].join(' ')}
                    >
                      {count ? `${count}/${totalParticipants}` : '—'}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 text-xs text-gray-500">
        <span className="font-semibold">Legend:</span>
        {[
          { label: 'All free', cls: 'bg-green-500' },
          { label: '75%+', cls: 'bg-green-400' },
          { label: '50%+', cls: 'bg-yellow-400' },
          { label: '25%+', cls: 'bg-orange-300' },
          { label: 'Some', cls: 'bg-red-200' },
        ].map(({ label, cls }) => (
          <div key={label} className="flex items-center gap-1">
            <span className={`w-3 h-3 rounded ${cls}`} />
            {label}
          </div>
        ))}
      </div>
      {isOrganizer && (
        <p className="mt-2 text-xs text-indigo-600 font-medium">
          💡 Click any cell to finalize that date and time.
        </p>
      )}
    </div>
  );
}
