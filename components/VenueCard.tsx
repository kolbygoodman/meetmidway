import type { Venue } from '@/lib/types';
import { getVenuePhotoUrl, getVenueCategory, getVenueMapsUrl } from '@/lib/venues';

interface Props {
  venue: Venue;
}

function distanceLabel(m?: number): string {
  if (!m) return '';
  if (m < 1000) return `${m}m away`;
  return `${(m / 1000).toFixed(1)}km away`;
}

function ratingColor(r?: number): string {
  if (!r) return 'text-gray-400';
  if (r >= 9) return 'text-green-600';
  if (r >= 8) return 'text-lime-600';
  if (r >= 7) return 'text-yellow-600';
  return 'text-orange-500';
}

const CATEGORY_ICONS: Record<string, string> = {
  'Coffee Shop': '☕',
  'Café': '☕',
  'Bar': '🍺',
  'Restaurant': '🍽️',
  'Cocktail Bar': '🍹',
  'Gastropub': '🍺',
  'Bistro': '🍽️',
};

export default function VenueCard({ venue }: Props) {
  const photoUrl = getVenuePhotoUrl(venue, '400x300');
  const category = getVenueCategory(venue);
  const mapsUrl = getVenueMapsUrl(venue);
  const icon = CATEGORY_ICONS[category] ?? '📍';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-200 flex flex-col">
      {/* Photo */}
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={venue.name}
          className="w-full h-40 object-cover"
        />
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-5xl">
          {icon}
        </div>
      )}

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-gray-900 text-sm leading-tight">{venue.name}</h3>
          {venue.rating && (
            <span className={`text-sm font-bold shrink-0 ${ratingColor(venue.rating)}`}>
              ★ {venue.rating.toFixed(1)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-lg">{icon}</span>
          <span className="text-xs text-gray-500">{category}</span>
          {venue.distance !== undefined && (
            <span className="text-xs text-gray-400 ml-auto">
              {distanceLabel(venue.distance)}
            </span>
          )}
        </div>

        {venue.location?.formatted_address && (
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            📍 {venue.location.formatted_address}
          </p>
        )}

        {venue.hours?.display && (
          <p className="text-xs mt-1.5">
            <span
              className={venue.hours.open_now ? 'text-green-600 font-semibold' : 'text-red-500'}
            >
              {venue.hours.open_now ? '● Open now' : '● Closed'}
            </span>
            <span className="text-gray-400 ml-1">· {venue.hours.display}</span>
          </p>
        )}

        <div className="flex gap-2 mt-auto pt-3">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-2 px-3 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
          >
            📍 Directions
          </a>
          {venue.website && (
            <a
              href={venue.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center py-2 px-3 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            >
              🌐 Website
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
