import type { GeoPoint } from './geocoding';
import type { Venue } from './types';

// Foursquare category IDs
// 13035 = Coffee Shop, 13065 = Restaurant, 10032 = Bar
const CATEGORY_IDS = '13035,13065,10032';

export async function searchVenuesNear(
  point: GeoPoint,
  radiusMeters = 8000,
  limit = 15,
): Promise<Venue[]> {
  const apiKey = process.env.FOURSQUARE_API_KEY;
  if (!apiKey) {
    console.warn('FOURSQUARE_API_KEY not set — returning mock venues');
    return getMockVenues();
  }

  const params = new URLSearchParams({
    ll: `${point.lat},${point.lng}`,
    categories: CATEGORY_IDS,
    radius: String(radiusMeters),
    limit: String(limit),
    sort: 'RATING',
    fields: 'fsq_id,name,categories,location,distance,rating,stats,hours,photos,website,tel,link',
  });

  const res = await fetch(`https://api.foursquare.com/v3/places/search?${params}`, {
    headers: {
      Authorization: apiKey,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    console.error('Foursquare error:', res.status, await res.text());
    return [];
  }

  const data = await res.json();
  return (data.results ?? []) as Venue[];
}

export function getVenuePhotoUrl(venue: Venue, size = '200x200'): string | null {
  const photo = venue.photos?.[0];
  if (!photo) return null;
  return `${photo.prefix}${size}${photo.suffix}`;
}

export function getVenueCategory(venue: Venue): string {
  return venue.categories?.[0]?.name ?? 'Venue';
}

export function getVenueMapsUrl(venue: Venue): string {
  const name = encodeURIComponent(venue.name);
  const addr = encodeURIComponent(venue.location?.formatted_address ?? '');
  return `https://www.google.com/maps/search/?api=1&query=${name}+${addr}`;
}

// ─── Mock data for local dev without an API key ───────────────────────────────

function getMockVenues(): Venue[] {
  return [
    {
      fsq_id: 'mock1',
      name: 'The Midpoint Café',
      categories: [{ name: 'Coffee Shop' }],
      location: { formatted_address: '123 Central Ave, Springfield' },
      distance: 420,
      rating: 9.1,
    },
    {
      fsq_id: 'mock2',
      name: 'Halfway House Bar & Grill',
      categories: [{ name: 'Bar' }],
      location: { formatted_address: '456 Meeting St, Springfield' },
      distance: 780,
      rating: 8.7,
    },
    {
      fsq_id: 'mock3',
      name: 'Common Ground Restaurant',
      categories: [{ name: 'Restaurant' }],
      location: { formatted_address: '789 Gather Rd, Springfield' },
      distance: 1100,
      rating: 8.4,
    },
    {
      fsq_id: 'mock4',
      name: 'Crossroads Espresso',
      categories: [{ name: 'Coffee Shop' }],
      location: { formatted_address: '321 Union Blvd, Springfield' },
      distance: 1450,
      rating: 8.2,
    },
    {
      fsq_id: 'mock5',
      name: 'The Junction Tap Room',
      categories: [{ name: 'Bar' }],
      location: { formatted_address: '654 Convergence Ln, Springfield' },
      distance: 1800,
      rating: 7.9,
    },
  ];
}
