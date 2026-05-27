'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CalendarPicker from '@/components/CalendarPicker';
import type { DayAvailability } from '@/lib/types';

export default function Home() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!title.trim() || !name.trim() || !city.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    const hasSlots = availability.some((d) => d.slots.length > 0);
    if (!hasSlots) {
      setError('Please select at least one date and time slot.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          organizerName: name,
          organizerCity: city,
          availability: availability.filter((d) => d.slots.length > 0),
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const { meetingId, participantId } = await res.json();

      // Store participantId so this person is recognized as organizer
      localStorage.setItem(`meetmidway:pid:${meetingId}`, participantId);

      router.push(`/meeting/${meetingId}`);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">📍</div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Meet<span className="text-indigo-600">Midway</span>
          </h1>
          <p className="mt-2 text-gray-500 text-lg">
            Find a time that works for everyone — and a great spot halfway between you all.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Meeting title */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              What&apos;s this meeting for?
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Team Lunch, Friend Hangout, Client Meeting…"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 focus:outline-none text-gray-900 placeholder-gray-400 transition"
            />
          </div>

          {/* Your info */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-bold text-gray-700 mb-4">About you</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                  Your name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 focus:outline-none text-gray-900 placeholder-gray-400 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                  Your city
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Austin, TX"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 focus:outline-none text-gray-900 placeholder-gray-400 transition"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Used to find a meeting spot halfway between everyone.
                </p>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-bold text-gray-700 mb-1">
              When are you available?
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Click dates to select them, then pick morning / lunch / afternoon.
            </p>
            <CalendarPicker value={availability} onChange={setAvailability} />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-lg rounded-2xl shadow-lg transition-all"
          >
            {loading ? '⏳ Creating…' : '✨ Create Meeting & Get Link'}
          </button>
        </form>
      </div>
    </main>
  );
}
