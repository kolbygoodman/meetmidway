/**
 * KV storage layer.
 * In production: uses @vercel/kv (Redis).
 * In development (no KV env vars): falls back to an in-memory store so you
 * can run the app locally without wiring up Vercel KV.
 */

import type { Meeting, Participant, MeetingWithParticipants } from './types';

// ─── In-memory fallback for local dev ────────────────────────────────────────

const memStore: Map<string, unknown> = new Map();

async function kvGet<T>(key: string): Promise<T | null> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv');
    return kv.get<T>(key);
  }
  return (memStore.get(key) as T) ?? null;
}

async function kvSet(key: string, value: unknown): Promise<void> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv');
    await kv.set(key, value);
    return;
  }
  memStore.set(key, value);
}

async function kvDel(key: string): Promise<void> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv');
    await kv.del(key);
    return;
  }
  memStore.delete(key);
}

// ─── Meeting helpers ──────────────────────────────────────────────────────────

export async function getMeeting(id: string): Promise<Meeting | null> {
  return kvGet<Meeting>(`meeting:${id}`);
}

export async function saveMeeting(meeting: Meeting): Promise<void> {
  await kvSet(`meeting:${meeting.id}`, meeting);
  // Add to index
  const index = (await kvGet<string[]>('meetings:index')) ?? [];
  if (!index.includes(meeting.id)) {
    index.push(meeting.id);
    await kvSet('meetings:index', index);
  }
}

// ─── Participant helpers ──────────────────────────────────────────────────────

export async function getParticipants(meetingId: string): Promise<Participant[]> {
  return (await kvGet<Participant[]>(`meeting:${meetingId}:participants`)) ?? [];
}

export async function saveParticipant(participant: Participant): Promise<void> {
  const participants = await getParticipants(participant.meetingId);
  const idx = participants.findIndex((p) => p.id === participant.id);
  if (idx >= 0) {
    participants[idx] = participant;
  } else {
    participants.push(participant);
  }
  await kvSet(`meeting:${participant.meetingId}:participants`, participants);
}

export async function getMeetingWithParticipants(
  id: string,
): Promise<MeetingWithParticipants | null> {
  const [meeting, participants] = await Promise.all([getMeeting(id), getParticipants(id)]);
  if (!meeting) return null;
  return { ...meeting, participants };
}
