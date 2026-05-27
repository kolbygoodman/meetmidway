import { NextResponse } from 'next/server';
import { getMeeting, saveMeeting } from '@/lib/kv';
import type { TimeSlot } from '@/lib/types';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const meeting = await getMeeting(id);
  if (!meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  }

  const { date, slot } = (await req.json()) as { date: string; slot: TimeSlot };

  if (!date || !slot) {
    return NextResponse.json({ error: 'date and slot are required' }, { status: 400 });
  }

  await saveMeeting({ ...meeting, status: 'finalized', finalDate: date, finalTimeSlot: slot });
  return NextResponse.json({ ok: true });
}
