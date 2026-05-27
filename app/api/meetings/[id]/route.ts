import { NextResponse } from 'next/server';
import { getMeetingWithParticipants } from '@/lib/kv';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const meeting = await getMeetingWithParticipants(id);
  if (!meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  }
  return NextResponse.json(meeting);
}
