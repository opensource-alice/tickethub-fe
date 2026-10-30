import { EventItem, EventListResponse, FilterParams } from '@/types';
import { EventMapper } from '@/lib/ticketmaster-mapper';
import { tmRequest } from './client';

/**
 * Searches and paginates Ticketmaster events with deep-paging limits and multi-criteria filters
 */
export async function getEvents(params: FilterParams = {}): Promise<EventListResponse> {
  let safePage = params.page || 0;
  const safeSize = Math.min(params.size || 20, 100);
  // Ticketmaster deep paging rule: size * page < 1000
  if (safePage * safeSize >= 1000) {
    safePage = Math.max(0, Math.floor(999 / safeSize));
  }

  const queryParams: Record<string, any> = {
    page: safePage,
    size: safeSize,
    sort: params.sort || 'date,asc',
  };

  if (params.keyword) queryParams.keyword = params.keyword;
  if (params.city) queryParams.city = params.city;
  if (params.countryCode) queryParams.countryCode = params.countryCode;
  if (params.genre) {
    queryParams.classificationName = params.genre;
  } else if (params.classificationName) {
    queryParams.classificationName = params.classificationName;
  }
  if (params.promoterId) queryParams.promoterId = params.promoterId;
  if (params.startDateTime) queryParams.startDateTime = params.startDateTime;
  if (params.endDateTime) queryParams.endDateTime = params.endDateTime;

  try {
    const data = await tmRequest<any>('/events.json', queryParams);
    return EventMapper.toListResponse(data, safePage, safeSize);
  } catch (error) {
    return {
      events: [],
      pagination: {
        page: safePage,
        size: safeSize,
        totalElements: 0,
        totalPages: 0,
      },
    };
  }
}

/**
 * Fetches single event details by Ticketmaster Event ID
 */
export async function getEventById(id: string): Promise<EventItem> {
  const data = await tmRequest<any>(`/events/${id}.json`);
  return EventMapper.toDto(data);
}

/**
 * Fetches similar/recommended events sharing classification genre or segment
 */
export async function getSimilarEvents(id: string): Promise<EventListResponse> {
  try {
    const event = await getEventById(id);
    const classification =
      event.classification.segment || event.classification.genre || 'Music';

    const similar = await getEvents({
      classificationName: classification,
      page: 0,
      size: 6,
    });

    const filtered = similar.events.filter((e) => e.id !== id);
    return {
      events: filtered.slice(0, 4),
      pagination: {
        page: 0,
        size: 4,
        totalElements: filtered.length,
        totalPages: 1,
      },
    };
  } catch {
    return {
      events: [],
      pagination: { page: 0, size: 4, totalElements: 0, totalPages: 0 },
    };
  }
}
