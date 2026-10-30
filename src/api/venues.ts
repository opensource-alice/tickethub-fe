import { VenueDetails, EventItem } from '@/types';
import { VenueMapper, EventMapper } from '@/lib/ticketmaster-mapper';
import { tmRequest } from './client';

/**
 * Fetches comprehensive venue details, parking, accessibility, and upcoming scheduled events
 */
export async function getVenueById(id: string): Promise<VenueDetails> {
  const venueData = await tmRequest<any>(`/venues/${id}.json`);

  let upcomingEvents: EventItem[] = [];
  try {
    const eventsData = await tmRequest<any>('/events.json', {
      venueId: id,
      size: 6,
    });
    const rawEvents = eventsData?._embedded?.events || [];
    upcomingEvents = rawEvents.map((e: any) => EventMapper.toDto(e));
  } catch { }

  return VenueMapper.toDto(venueData, upcomingEvents);
}
