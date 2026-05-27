export type TimeSlot = 'morning' | 'lunch' | 'afternoon';

export interface DayAvailability {
  date: string; // ISO date string "YYYY-MM-DD"
  slots: TimeSlot[];
}

export interface Participant {
  id: string;
  meetingId: string;
  name: string;
  city: string;
  availability: DayAvailability[];
  createdAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  createdAt: string;
  status: 'open' | 'finalized';
  finalDate?: string;
  finalTimeSlot?: TimeSlot;
  organizerId: string;
}

export interface MeetingWithParticipants extends Meeting {
  participants: Participant[];
}

export interface Venue {
  fsq_id: string;
  name: string;
  categories: { name: string; icon?: { prefix: string; suffix: string } }[];
  location: {
    address?: string;
    locality?: string;
    region?: string;
    formatted_address?: string;
  };
  distance?: number;
  rating?: number;
  stats?: { total_ratings?: number };
  hours?: { display?: string; is_local_holiday?: boolean; open_now?: boolean };
  photos?: { prefix: string; suffix: string }[];
  website?: string;
  tel?: string;
  link?: string;
}

export interface OverlapEntry {
  date: string;
  slot: TimeSlot;
  count: number;
  participants: string[];
}

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  morning: '☀️ Morning (8am–12pm)',
  lunch: '🍽️ Lunch (12–2pm)',
  afternoon: '🌤️ Afternoon (2–6pm)',
};

export const TIME_SLOT_SHORT: Record<TimeSlot, string> = {
  morning: 'Morn',
  lunch: 'Lunch',
  afternoon: 'Aft',
};
