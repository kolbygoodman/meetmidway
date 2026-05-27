'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import VenueCard from '@/components/VenueCard';
import type { MeetingWithParticipants, Venue } from '@/lib/types';
import type { GeoPoint } from '@/lib/geocoding';
import { TIME_SLOT_LABELS } from '@/lib/types';

type FilterType = 'all' | 'coffee' | 'restaurant' | 'bar';

const FILTER_KEYWORDS: Record<FilterType, string[]> = {
  all: [],
  coffee: ['coffee', 'café', 'cafe', 'espresso', 'tea'],
  restaurant: ['restaurant', 'bistro', 'diner', 'eatery', 'grill', 'kitchen', 'pizza', 'sushi'],
  bar: ['bar', 'pub', 'tavern', 'taproom', 'brewery', 'cocktail', 'lounge'],
};

function filterVenues(venues: Venue[], type: FilterType): Venue[] {
  if (type === 'all') return venues;
  const keywords = FILTER_KEYWORDS[type];
  return venues.filter((v) =>
    v.categories.some((c) =>
      keywords.some((k) => c.name.toLowerCase().includes(k)),
    ),
  );
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();

  const [meeting, setMeeting] = useState<MeetingWithParticipants | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [midpoint, setMidpoint] = useState<GeoPoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [venueLoading, setVenueLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/meetings/${id}`);
        if (!res.ok) throw new Error('Not found');
        const data: MeetingWithParticipants = await res.json();
        setMeeting(data);

        // Fetch venues
        const cities = data.participants.map((p) => p.city);
        if (cities.length) {
          setVenueLoading(true);
          const params = new URLSearchParams();
          cities.forEach((c) => params.append('city', c));
          const vRes = await fetch(`/api/venues?${params}`);
          if (vRes.ok) {
            const vData = await vRes.json();
            setVenues(vData.venues ?? []);
            setMidpoint(vData.midpoint ?? null);
          }
          setVenueLoading(false);
        }
      } catch {
        setError('Could not load results.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <div className="text-indigo-600 font-semibold animate-pulse text-lg">Loading results…</div>
      </main>
    );
  }

  if (error || !meeting) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error || 'Meeting not found.'}</p>
      </main>
    );
  }

  const filteredVenues = filterVenues(venues, filter);
  const cities = meeting.participants.map((p) => p.city);

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Back link */}
        <a
          href={`/meeting/${id}`}
          className="text-xs text-indigo-500 font-semibold hover:underline mb-4 inline-block"
        >
          ← Back to meeting
        </a>

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl p-8 mb-8 shadow-xl">
          <div className="text-4xl mb-3">🎉</div>
          <h1 className="text-2xl font-extrabold">{meeting.title}</h1>

          {meeting.finalDate && meeting.finalTimeSlot && (
            <p className="text-indigo-200 mt-2 text-lg">
              {new Date(meeting.finalDate + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
              })}
              {' · '}
              {TIME_SLOT_LABELS[meeting.finalTimeSlot]}
            </p>
          )}

          {/* Participants */}
          <div className="flex flex-wrap gap-2 mt-4">
            {meeting.participants.map((p) => (
              <div
                key={p.id}
                className="bg-white/20 backdrop-blur rounded-xl px-3 py-1.5 text-sm font-medium flex items-center gap-1.5"
              >
                <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-xs font-bold">
                  {p.name[0].toUpperCase()}
                </span>
                {p.name}
                <span className="text-indigo-200 text-xs">· {p.city}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Midpoint info */}
        {midpoint && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <h2 className="text-sm font-bold text-gray-700 mb-2">📍 Halfway point between everyone</h2>
            <div className="flex flex-wrap gap-2 items-center text-sm text-gray-500">
              {cities.map((c, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="text-indigo-500">📌</span> {c}
                  {i < cities.length - 1 && <span className="text-gray-300 ml-2">+</span>}
                </span>
              ))}
              <span className="text-gray-300">→</span>
              <a
                href={`https://www.google.com/maps?q=${midpoint.lat},${midpoint.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-indigo-600 hover:underline"
              >
                📍 View midpoint on map
              </a>
            </div>
          </div>
        )}

        {/* Venue filters */}
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-lg font-bold text-gray-900">Venue suggestions</h2>
          <div className="flex gap-2 ml-auto">
            {(['all', 'coffee', 'restaurant', 'bar'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={[
                  'px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all',
                  filter === f
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300',
                ].join(' ')}
              >
                {f === 'all' ? '🗺️ All' : f === 'coffee' ? '☕ Coffee' : f === 'restaurant' ? '🍽️ Food' : '🍺 Bar'}
              </button>
            ))}
          </div>
        </div>

        {venueLoading ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3 animate-bounce">📍</div>
            <p className="text-indigo-600 font-semibold">Finding the perfect spot…</p>
            <p className="text-gray-400 text-sm mt-1">Geocoding cities and searching nearby venues</p>
          </div>
        ) : filteredVenues.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🔍</div>
            <p>No venues found for this filter.</p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="mt-3 text-indigo-500 font-semibold hover:underline text-sm"
              >
                Show all venues
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVenues.map((venue) => (
              <VenueCard key={venue.fsq_id} venue={venue} />
            ))}
          </div>
        )}

        {/* No Foursquare key notice */}
        {venues.some((v) => v.fsq_id.startsWith('mock')) && (
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-amber-800 mb-1">
              🔑 Add a Foursquare API key for real venue data
            </h3>
            <p className="text-xs text-amber-700">
              The venues above are placeholders. To get real recommendations, sign up at{' '}
              <a
                href="https://foursquare.com/developers"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline"
              >
                foursquare.com/developers
              </a>{' '}
              and add <code className="bg-amber-100 px-1 rounded">FOURSQUARE_API_KEY=your_key</code> to
              your <code className="bg-amber-100 px-1 rounded">.env.local</code> file.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
