/**
 * Modular Ticketmaster API Client Index
 *
 * Each API domain is maintained in its own dedicated file:
 * - client.ts: Core HTTP client, base URLs, credentials & error parsing
 * - events.ts: Event searches, pagination, details & similarity recommendations
 * - images.ts: High-resolution image queries and aspect ratio calculations
 * - venues.ts: Venue details, accessibility, parking & upcoming schedule
 * - classifications.ts: Segments, genres, and category trees
 * - partner.ts: Ticketmaster Partner API reservations, carts, delivery, payment & commit
 */

export * from './client';
export * from './events';
export * from './images';
export * from './venues';
export * from './classifications';
export * from './partner';

import * as eventsApi from './events';
import * as imagesApi from './images';
import * as venuesApi from './venues';
import * as classificationsApi from './classifications';
import * as partnerApi from './partner';

/**
 * Consolidated API object for unified access when preferred
 */
export const api = {
  ...eventsApi,
  ...imagesApi,
  ...venuesApi,
  ...classificationsApi,
  ...partnerApi,
};

export default api;
