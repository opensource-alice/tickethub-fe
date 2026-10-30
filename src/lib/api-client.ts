/**
 * TicketHub API Client
 *
 * All API domains are now separated into dedicated, modular files under '@/api':
 * - '@/api/client': Core fetch requests and credentials
 * - '@/api/events': Events discovery, details, and recommendations
 * - '@/api/images': High-res event and performer imagery
 * - '@/api/venues': Venues information and schedules
 * - '@/api/classifications': Categories and classifications
 * - '@/api/partner': Ticketmaster Partner API commerce & cart management
 *
 * This file maintains backwards compatibility by re-exporting all APIs.
 */

export * from '@/api';
export { api, default } from '@/api';
