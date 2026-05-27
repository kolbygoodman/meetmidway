import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { saveMeeting, saveParticipant } from '@/lib/kv';
import type { Meeting, Participant, DayAvailability, TimeSlot } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, organizerName, organizerCity, availability } = body as {
      title: string;
      organizerName: string;
      organizerCity: string;
      availability: DayAvailability[];
    };

    if (!title?.trim() || !organizerName?.trim() || !organizerCity?.trim()) {
      return NextResponse.json({ error: 'title, organizerName, and organizerCity are required' }, { status: 400 });
    }

    const meetingId = nanoid(8);
    const organizerId = nanoid(12);
    const now = new Date().toISOString();

    const meeting: Meeting = {
      id: meetingId,
      title: title.trim(),
      createdAt: now,
      status: 'open',
      organizerId,
    };

    const organizer: Participant = {
      id: organizerId,
      meetingId,
      name: organizerName.trim(),
      city: organizerCity.trim(),
      availability: availability ?? [],
      createdAt: now,
    };

    await saveMeeting(meeting);
    await saveParticipant(organizer);

    return NextResponse.json({ meetingId, participantId: organizerId }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
