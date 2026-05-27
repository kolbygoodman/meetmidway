'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CalendarPicker from '@/components/CalendarPicker';
import AvailabilityHeatmap from '@/components/AvailabilityHeatmap';
import { computeOverlap } from '@/lib/availability';
import type { MeetingWithParticipants, DayAvailability, TimeSlot } from '@/lib/types';
import { TIME_SLOT_LABELS } from '@/lib/types';

export default function MeetingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [meeting, setMeeting] = useState<MeetingWithParticipants | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Join form state
  const [showJoin, setShowJoin] = useState(false);
  const [joinName, setJoinName] = useState('');
  const [joinCity, setJoinCity] = useState('');
  const [joinAvailability, setJoinAvailability] = useState<DayAvailability[]>([]);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  // My participant ID (stored in localStorage)
  const [myPid, setMyPid] = useState<string | null>(null);

  // Copy link state
  const [copied, setCopied] = useState(false);

  // Finalize state
  const [finalizing, setFinalizing] = useState(false);

  const fetchMeeting = useCallback(async () => {
    try {
      const res = await fetch(`/api/meetings/${id}`);
      if (!res.ok) throw new Error('Not found');
      const data: MeetingWithParticipants = await res.json();
      setMeeting(data);
    } catch {
      setError('Meeting not found.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMeeting();
    const stored = localStorage.getItem(`meetmidway:pid:${id}`);
    setMyPid(stored);
  }, [fetchMeeting, id]);

  // Auto-refresh every 15s while open
  useEffect(() => {
    if (!meeting || meeting.status === 'finalized') return;
    const t = setInterval(fetchMeeting, 15000);
    return () => clearInterval(t);
  }, [meeting, fetchMeeting]);

  const isOrganizer = !!myPid && myPid === meeting?.organizerId;
  const hasJoined = !!myPid && meeting?.participants.some((p) => p.id === myPid);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoinError('');
    if (!joinName.trim() || !joinCity.trim()) {
      setJoinError('Name and city are required.');
      return;
    }
    const hasSlots = joinAvailability.some((d) => d.slots.length > 0);
    if (!hasSlots) {
      setJoinError('Please select at least one time slot.');
      return;
    }

    setJoining(true);
    try {
      const res = await fetch(`/api/meetings/${id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: joinName,
          city: joinCity,
          availability: joinAvailability.filter((d) => d.slots.length > 0),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { participantId } = await res.json();
      localStorage.setItem(`meetmidway:pid:${id}`, participantId);
      setMyPid(participantId);
      setShowJoin(false);
      await fetchMeeting();
    } catch (err) {
      setJoinError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setJoining(false);
    }
  }

  async function handleFinalize(date: string, slot: TimeSlot) {
    if (!isOrganizer) return;
    setFinalizing(true);
    try {
      await fetch(`/api/meetings/${id}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, slot }),
      });
      router.push(`/meeting/${id}/results`);
    } catch {
      alert('Failed to finalize. Please try again.');
    } finally {
      setFinalizing(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Build heatmap data for CalendarPicker
  const heatmap: Record<string, Partial<Record<TimeSlot, number>>> = {};
  if (meeting) {
    for (const p of meeting.participants) {
      for (const day of p.availability) {
        if (!heatmap[day.date]) heatmap[day.date] = {};
        for (const slot of day.slots) {
          heatmap[day.date][slot] = (heatmap[day.date][slot] ?? 0) + 1;
        }
      }
    }
  }

  const overlap = meeting ? computeOverlap(meeting.participants) : [];

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <div className="text-indigo-600 font-semibold animate-pulse text-lg">Loading meeting…</div>
      </main>
    );
  }

  if (error || !meeting) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-800">Meeting not found</h2>
          <p className="text-gray-500 mt-2">This link may be invalid or expired.</p>
          <a href="/" className="mt-4 inline-block text-indigo-600 hover:underline font-semibold">
            Create a new meeting →
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <a href="/" className="text-xs text-indigo-500 font-semibold hover:underline mb-2 inline-block">
              ← MeetMidway
            </a>
            <h1 className="text-3xl font-extrabold text-gray-900">{meeting.title}</h1>
            <div className="flex flex-wrap gap-2 mt-2 items-center">
              <span
                className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  meeting.status === 'finalized'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                {meeting.status === 'finalized' ? '✅ Finalized' : '🔓 Open'}
              </span>
              <span className="text-xs text-gray-400">
                {meeting.participants.length} participant{meeting.participants.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {meeting.status === 'open' && (
            <button
              onClick={copyLink}
              className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white border-2 border-indigo-200 rounded-xl text-indigo-600 text-sm font-semibold hover:border-indigo-400 transition-all"
            >
              {copied ? '✅ Copied!' : '🔗 Copy Link'}
            </button>
          )}
        </div>

        {/* Finalized banner */}
        {meeting.status === 'finalized' && meeting.finalDate && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-3xl p-6 mb-6 shadow-lg">
            <h2 className="text-lg font-bold mb-1">🎉 Meeting finalized!</h2>
            <p className="text-green-100 text-sm mb-3">
              {new Date(meeting.finalDate + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
              })}
              {' · '}
              {meeting.finalTimeSlot && TIME_SLOT_LABELS[meeting.finalTimeSlot]}
            </p>
            <a
              href={`/meeting/${id}/results`}
              className="inline-block px-5 py-2.5 bg-white text-green-700 font-bold rounded-xl text-sm hover:bg-green-50 transition"
            >
              🗺️ See venue suggestions →
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LEFT: Availability overlap */}
          <div className="md:col-span-2 space-y-6">
            {/* Overlap heatmap */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-sm font-bold text-gray-700 mb-4">
                📊 Availability overview
              </h2>
              <AvailabilityHeatmap
                overlap={overlap}
                totalParticipants={meeting.participants.length}
                onSelect={handleFinalize}
                finalDate={meeting.finalDate}
                finalSlot={meeting.finalTimeSlot}
                isOrganizer={isOrganizer && meeting.status === 'open'}
              />
              {finalizing && (
                <p className="text-indigo-600 text-sm mt-2 font-medium animate-pulse">
                  ⏳ Finalizing…
                </p>
              )}
            </div>

            {/* Join form */}
            {meeting.status === 'open' && !hasJoined && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                {!showJoin ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm mb-4">
                      Haven&apos;t submitted your availability yet?
                    </p>
                    <button
                      onClick={() => setShowJoin(true)}
                      className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition"
                    >
                      + Add My Availability
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleJoin} className="space-y-5">
                    <h2 className="text-sm font-bold text-gray-700">Add your availability</h2>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                          Your name
                        </label>
                        <input
                          type="text"
                          value={joinName}
                          onChange={(e) => setJoinName(e.target.value)}
                          placeholder="e.g. Jordan"
                          className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-indigo-400 focus:outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                          Your city
                        </label>
                        <input
                          type="text"
                          value={joinCity}
                          onChange={(e) => setJoinCity(e.target.value)}
                          placeholder="e.g. Houston, TX"
                          className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-indigo-400 focus:outline-none text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                        When are you free?
                      </p>
                      <CalendarPicker
                        value={joinAvailability}
                        onChange={setJoinAvailability}
                        heatmap={heatmap}
                        totalParticipants={meeting.participants.length}
                      />
                    </div>
                    {joinError && (
                      <p className="text-red-600 text-sm">{joinError}</p>
                    )}
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={joining}
                        className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition disabled:opacity-60"
                      >
                        {joining ? '⏳ Saving…' : '✅ Submit Availability'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowJoin(false)}
                        className="px-4 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-2xl hover:border-gray-400 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {hasJoined && !isOrganizer && meeting.status === 'open' && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-700 font-medium">
                ✅ Your availability is in! The organizer will finalize a time soon.
              </div>
            )}
          </div>

          {/* RIGHT: Participants sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                Participants ({meeting.participants.length})
              </h3>
              <ul className="space-y-3">
                {meeting.participants.map((p) => (
                  <li key={p.id} className="flex items-start gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        p.id === meeting.organizerId
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {p.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 leading-none">
                        {p.name}
                        {p.id === meeting.organizerId && (
                          <span className="ml-1 text-xs text-indigo-500">(organizer)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">📍 {p.city}</p>
                      <p className="text-xs text-gray-400">
                        {p.availability.reduce((acc, d) => acc + d.slots.length, 0)} slot
                        {p.availability.reduce((acc, d) => acc + d.slots.length, 0) !== 1 ? 's' : ''} marked
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {meeting.status === 'open' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-2">Share this meeting:</p>
                  <button
                    onClick={copyLink}
                    className="w-full py-2 bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold rounded-xl hover:bg-indigo-100 transition"
                  >
                    {copied ? '✅ Copied!' : '🔗 Copy invite link'}
                  </button>
                </div>
              )}
            </div>

            {isOrganizer && meeting.status === 'open' && overlap.length > 0 && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-indigo-700 mb-2">Best time to meet</p>
                <p className="text-sm font-semibold text-indigo-900">
                  {new Date(overlap[0].date + 'T12:00:00').toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric',
                  })}
                </p>
                <p className="text-xs text-indigo-600">{TIME_SLOT_LABELS[overlap[0].slot]}</p>
                <p className="text-xs text-indigo-500 mt-1">
                  {overlap[0].count}/{meeting.participants.length} people free
                </p>
                <button
                  onClick={() => handleFinalize(overlap[0].date, overlap[0].slot)}
                  className="w-full mt-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition"
                >
                  ✅ Finalize this time
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
