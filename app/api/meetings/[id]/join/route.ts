import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getMeeting, saveParticipant } from '@/lib/kv';
import type { Participant, DayAvailability } from '@/lib/types';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const meeting = await getMeeting(id);
  if (!meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  }
  if (meeting.status === 'finalized') {
    return NextResponse.json({ error: 'Meeting is already finalized' }, { status: 409 });
  }

  const body = await req.json();
  const { name, city, availability, participantId } = body as {
    name: string;
    city: string;
    availability: DayAvailability[];
    participantId?: string; // provided if updating existing entry
  };

  if (!name?.trim() || !city?.trim()) {
    return NextResponse.json({ error: 'name and city are required' }, { status: 400 });
  }

  const participant: Participant = {
    id: participantId ?? nanoid(12),
    meetingId: id,
    name: name.trim(),
    city: city.trim(),
    availability: availability ?? [],
    createdAt: new Date().toISOString(),
  };

  await saveParticipant(participant);
  return NextResponse.json({ participantId: participant.id }, { status: 200 });
}
