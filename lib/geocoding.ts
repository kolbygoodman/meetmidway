export interface GeoPoint {
  lat: number;
  lng: number;
  displayName: string;
}

/**
 * Geocodes a city string to lat/lng using OpenStreetMap Nominatim (free, no key).
 */
export async function geocodeCity(city: string): Promise<GeoPoint | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'MeetMidway/1.0 (meetmidway-app)',
        'Accept-Language': 'en',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    };
  } catch {
    return null;
  }
}

/**
 * Computes the geographic centroid (average lat/lng) of multiple points.
 */
export function computeCentroid(points: GeoPoint[]): GeoPoint {
  const lat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
  const lng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
  return { lat, lng, displayName: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
}

/**
 * Geocodes all cities and returns their centroid.
 * Skips any cities that fail to geocode.
 */
export async function findMidpoint(cities: string[]): Promise<GeoPoint | null> {
  const points = await Promise.all(cities.map(geocodeCity));
  const valid = points.filter((p): p is GeoPoint => p !== null);
  if (!valid.length) return null;
  return computeCentroid(valid);
}
