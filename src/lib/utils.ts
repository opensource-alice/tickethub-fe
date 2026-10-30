import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { EventItem } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr?: string, timeStr?: string): {
  dayName: string;
  monthName: string;
  dayNumber: string;
  year: string;
  timeFormatted: string;
  fullDisplay: string;
} {
  if (!dateStr || dateStr === 'TBD') {
    return {
      dayName: 'TBD',
      monthName: 'TBD',
      dayNumber: '--',
      year: '----',
      timeFormatted: 'Time TBA',
      fullDisplay: 'Date to be announced',
    };
  }

  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);

    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const dayNumber = String(day);
    const yearStr = String(year);

    let timeFormatted = 'Time TBA';
    if (timeStr) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const tempDate = new Date();
      tempDate.setHours(hours, minutes, 0);
      timeFormatted = tempDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }

    return {
      dayName,
      monthName,
      dayNumber,
      year: yearStr,
      timeFormatted,
      fullDisplay: `${dayName}, ${monthName} ${dayNumber}, ${yearStr}${timeStr ? ` • ${timeFormatted}` : ''}`,
    };
  } catch (e) {
    return {
      dayName: '',
      monthName: '',
      dayNumber: '',
      year: '',
      timeFormatted: '',
      fullDisplay: dateStr,
    };
  }
}

export function formatPrice(priceRange?: EventItem['priceRange']): string {
  if (!priceRange) return 'Check Ticketmaster';
  const { min, max, currency } = priceRange;
  const symbol = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : `${currency} `;

  if (min === max || max === 0) {
    return `${symbol}${min.toFixed(0)}`;
  }
  return `${symbol}${min.toFixed(0)} – ${symbol}${max.toFixed(0)}`;
}

export function downloadIcsFile(event: EventItem) {
  const { dates, name, info, venue, url } = event;
  const startDateStr = dates.localDate.replace(/-/g, '');
  const startTimeStr = (dates.localTime || '19:00:00').replace(/:/g, '').slice(0, 6);
  const startDateTime = `${startDateStr}T${startTimeStr}`;

  // End time default: 3 hours later
  const startObj = new Date(`${dates.localDate}T${dates.localTime || '19:00:00'}`);
  const endObj = new Date(startObj.getTime() + 3 * 60 * 60 * 1000);
  const endDateStr = endObj.toISOString().slice(0, 10).replace(/-/g, '');
  const endTimeStr = endObj.toTimeString().slice(0, 8).replace(/:/g, '');
  const endDateTime = `${endDateStr}T${endTimeStr}`;

  const location = venue ? `${venue.name}, ${venue.city || ''} ${venue.state || ''}`.trim() : 'Event Venue';
  const description = `${info || 'Tickets available at TicketHub'}\\n\\nDirect Purchase Link: ${url}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TicketHub//Event Discovery//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.id}@tickethub.com`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART:${startDateTime}`,
    `DTEND:${endDateTime}`,
    `SUMMARY:${name}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `URL:${url}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
