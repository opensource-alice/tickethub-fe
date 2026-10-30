import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, MapPin, ChevronLeft, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { BookingCard } from '@/components/events/booking-card';
import { EventDetailTabs } from '@/components/events/event-detail-tabs';

interface EventPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  try {
    const event = await api.getEventById(params.id);
    const dateInfo = formatDate(event.dates.localDate, event.dates.localTime);

    return {
      title: `${event.name} Tickets & Event Info | TicketHub`,
      description: `Official tickets for ${event.name} on ${dateInfo.fullDisplay} at ${
        event.venue?.name || event.city || 'Venue'
      }. Book securely with verified seating on Ticketmaster.`,
      openGraph: {
        title: `${event.name} | Live Event Tickets`,
        description: `${dateInfo.fullDisplay} • ${event.venue?.name || event.city || 'Live Experience'}`,
        images: [
          {
            url: event.imageUrl,
            width: 1200,
            height: 675,
            alt: event.name,
          },
        ],
      },
    };
  } catch (e) {
    return {
      title: 'Event Details | TicketHub',
    };
  }
}

export default async function EventPage({ params }: EventPageProps) {
  let event;
  let similarEvents: any[] = [];
  let hiResImages: import('@/types').HiResImagesResponse | null = null;

  try {
    event = await api.getEventById(params.id);
  } catch (error) {
    notFound();
  }

  try {
    const [similarRes, imagesRes] = await Promise.all([
      api.getSimilarEvents(params.id).catch(() => ({ events: [] })),
      api.getEventImages(params.id).catch(() => null),
    ]);
    similarEvents = similarRes.events || [];
    hiResImages = imagesRes;
  } catch (e) {
    similarEvents = [];
    hiResImages = null;
  }

  const dateInfo = formatDate(event.dates.localDate, event.dates.localTime);

  // Generate structured JSON-LD schema for Google rich snippets
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    startDate: `${event.dates.localDate}T${event.dates.localTime || '19:00:00'}`,
    eventStatus:
      event.dates.status === 'canceled'
        ? 'https://schema.org/EventCancelled'
        : event.dates.status === 'postponed'
        ? 'https://schema.org/EventPostponed'
        : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.venue?.name || 'Event Venue',
      address: {
        '@type': 'PostalAddress',
        streetAddress: event.venue?.address || '',
        addressLocality: event.venue?.city || '',
        addressRegion: event.venue?.state || '',
        postalCode: event.venue?.postalCode || '',
        addressCountry: event.venue?.countryCode || 'US',
      },
    },
    image: [event.imageUrl],
    description: event.info || event.name,
    offers: {
      '@type': 'Offer',
      url: event.url,
      price: event.priceRange?.min || '0',
      priceCurrency: event.priceRange?.currency || 'USD',
      availability: 'https://schema.org/InStock',
    },
    organizer: {
      '@type': 'Organization',
      name: event.promoter || 'TicketHub Partner',
      url: 'https://tickethub.app',
    },
  };

  return (
    <>
      {/* Inject JSON-LD Event schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            href="/events"
            className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>All Events</span>
          </Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-xs">{event.name}</span>
        </div>

        {/* Hero Section */}
        <div className="relative rounded-3xl overflow-hidden glass-card border border-border">
          {/* Hero Image Container */}
          <div className="relative w-full aspect-[21/9] min-h-[300px] max-h-[500px] bg-muted">
            <Image
              src={event.imageUrl}
              alt={event.name}
              fill
              priority
              sizes="(max-width: 1400px) 100vw, 1400px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

            {/* Floating Hero Content */}
            <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 sm:right-8 text-white space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-primary/90 backdrop-blur-md text-xs font-bold uppercase tracking-wider">
                  {event.classification.segment || 'Live Experience'}
                </span>
                {event.classification.genre && (
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
                    {event.classification.genre}
                  </span>
                )}
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/80 backdrop-blur-md text-xs font-bold text-white">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Seating</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight max-w-4xl">
                {event.name}
              </h1>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm text-white/90 pt-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-semibold">{dateInfo.fullDisplay}</span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-pink-400 shrink-0" />
                  <span className="font-semibold">
                    {event.venue?.name || 'Venue TBA'}
                    {event.city ? ` • ${event.city}` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Grid: Tabs Content on Left, Sticky Booking Card on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <EventDetailTabs event={event} similarEvents={similarEvents} hiResImages={hiResImages} />
          </div>

          <div className="lg:col-span-4">
            <BookingCard event={event} />
          </div>
        </div>
      </div>
    </>
  );
}
