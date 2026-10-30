import { CategoryItem } from '@/types';
import { ClassificationMapper } from '@/lib/ticketmaster-mapper';
import { tmRequest } from './client';

/**
 * Fetches root classifications and segments (Music, Sports, Arts & Theatre, Film, etc.)
 */
export async function getClassifications(): Promise<{ classifications: CategoryItem[] }> {
  const data = await tmRequest<any>('/classifications.json', { size: 20 });
  const rawList = data?._embedded?.classifications || [];
  return ClassificationMapper.toListResponse(rawList);
}
