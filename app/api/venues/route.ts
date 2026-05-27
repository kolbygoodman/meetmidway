import { NextResponse } from 'next/server';
import { findMidpoint } from '@/lib/geocoding';
import { searchVenuesNear } from '@/lib/venues';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cities = searchParams.getAll('city');

  if (!cities.length) {
    return NextResponse.json({ error: 'Provide at least one city query param' }, { status: 400 });
  }

  const midpoint = await findMidpoint(cities);
  if (!midpoint) {
    return NextResponse.json({ error: 'Could not geocode any of the provided cities' }, { status: 422 });
  }

  const venues = await searchVenuesNear(midpoint);
  return NextResponse.json({ midpoint, venues });
}
