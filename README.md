# 📍 MeetMidway

> Schedule a meeting with multiple people and find the perfect halfway spot — coffee shop, restaurant, or bar.

## Features

- 📅 **Calendar availability picker** — click dates, then choose Morning / Lunch / Afternoon
- 🗺️ **Shareable invite link** — send to anyone, they add their availability in seconds
- 📊 **Overlap heatmap** — color-coded calendar showing who's free when
- 🏆 **Smart finalization** — organizer picks the best slot with one click
- 📍 **Halfway venue finder** — geocodes everyone's city, finds the midpoint, and shows real coffee shops, restaurants, and bars nearby

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS**
- **Vercel KV** (serverless Redis) for storage
- **OpenStreetMap Nominatim** for free geocoding
- **Foursquare Places API** for venue search

---

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** Without API keys the app still works — it uses an in-memory store (resets on restart) and shows mock venue data.

### Add a Foursquare key (optional, for real venues)

1. Sign up at [foursquare.com/developers](https://foursquare.com/developers)
2. Create a new app → copy the API key
3. Add to `.env.local`:
   ```
   FOURSQUARE_API_KEY=your_key_here
   ```

---

## Deploy to Vercel

```bash
npx vercel
```

Then in the Vercel dashboard:

1. **Storage → Create KV store** — link it to your project (auto-adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` env vars)
2. **Settings → Environment Variables** → add `FOURSQUARE_API_KEY`
3. Redeploy

---

## How It Works

### Scheduling
1. Organizer creates a meeting, picks their available dates/times and enters their city
2. They share the generated link with participants
3. Each participant opens the link, enters their name/city, and marks their availability
4. The organizer sees a color-coded heatmap of overlapping availability
5. Organizer clicks a cell to finalize — everyone is redirected to the results page

### Venue Finding
1. Each participant's city is geocoded via OpenStreetMap Nominatim
2. The geographic centroid (average lat/lng) is calculated as the midpoint
3. Foursquare Places API searches for coffee shops, restaurants, and bars within 8km
4. Results are shown with photos, ratings, addresses, and directions links
