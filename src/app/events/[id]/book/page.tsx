import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api-client';
import { StandardBookingView } from '@/components/booking/standard-booking-view';

interface BookingPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: BookingPageProps): Promise<Metadata> {
  try {
    const event = await api.getEventById(params.id);
    return {
      title: `Select Seats & Tickets: ${event.name} | TicketHub`,
      description: `Ticket selection and booking for ${event.name} at ${event.venue?.name || 'Venue'}.`,
    };
  } catch (e) {
    return {
      title: 'Select Seats | TicketHub',
    };
  }
}

export default async function BookingPage({ params }: BookingPageProps) {
  let event;
  try {
    event = await api.getEventById(params.id);
  } catch (e) {
    notFound();
  }
  return <StandardBookingView event={event} />;
}
