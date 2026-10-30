import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  MapPin,
  Car,
  Accessibility,
  FileText,
  ExternalLink,
  ChevronLeft,
  Calendar,
} from 'lucide-react';
import { getVenueById } from '@/api/venues';
import { EventCard } from '@/components/events/event-card';

interface VenuePageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: VenuePageProps): Promise<Metadata> {
  try {
    const venue = await getVenueById(params.id);
    return {
      title: `${venue.name} Seating, Schedule & Info | TicketHub`,
      description: `Official venue guide for ${venue.name} in ${venue.city || 'City'}. View upcoming concerts, sporting events, accessibility, and parking.`,
    };
  } catch (e) {
    return {
      title: 'Venue Guide | TicketHub',
    };
  }
}

export default async function VenuePage({ params }: VenuePageProps) {
  let venue;
  try {
    venue = await getVenueById(params.id);
  } catch (e) {
    notFound();
  }

  // Also query any events for this city or venue
  const upcomingEvents = venue.upcomingEvents || [];

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/events" className="flex items-center gap-1 hover:text-foreground">
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Events</span>
        </Link>
        <span>/</span>
        <span className="text-foreground">{venue.name}</span>
      </div>

      {/* Venue Hero */}
      <div className="relative rounded-3xl overflow-hidden glass-card border border-border min-h-[260px] sm:min-h-[340px] flex items-end p-6 sm:p-10">
        <Image
          src={venue.imageUrl || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&q=80'}
          alt={venue.name}
          fill
          priority
          sizes="(max-width: 1400px) 100vw, 1400px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        <div className="relative z-10 text-white space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/90 text-xs font-bold uppercase tracking-wider">
            Official Entertainment Venue
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight">{venue.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-white/90">
            <MapPin className="w-4 h-4 text-pink-400 shrink-0" />
            <span>
              {[venue.address, venue.city, venue.state, venue.postalCode, venue.country]
                .filter(Boolean)
                .join(', ')}
            </span>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Parking */}
        <div className="p-6 rounded-2xl glass-card border border-border space-y-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Car className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-foreground">Parking & Transit</h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {venue.parkingDetail || 'On-site public parking and rideshare drop-off zones available. Arriving 45 minutes prior to event time is advised.'}
          </p>
        </div>

        {/* Accessibility */}
        <div className="p-6 rounded-2xl glass-card border border-border space-y-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
            <Accessibility className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-foreground">Accessible Seating</h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {venue.accessibleSeatingDetail || 'ADA wheelchair accessible platforms, companion seating, and assisted listening devices available upon request.'}
          </p>
        </div>

        {/* General Rules */}
        <div className="p-6 rounded-2xl glass-card border border-border space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-foreground">Rules & Policies</h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {venue.generalRules || 'Clear bag policy in effect. No professional recording equipment or outside food and beverages permitted inside the gates.'}
          </p>
        </div>
      </div>

      {/* Upcoming Events at Venue */}
      <div className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Upcoming Events at {venue.name}
            </h2>
          </div>
          <Link
            href={`/events?city=${encodeURIComponent(venue.city || '')}`}
            className="text-xs sm:text-sm font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>View all in {venue.city || 'area'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((evt) => (
              <EventCard key={evt.id} event={evt} />
            ))}
          </div>
        ) : (
          <div className="p-10 text-center rounded-2xl border border-dashed border-border glass-card space-y-3">
            <p className="text-sm text-muted-foreground">
              Explore more upcoming shows taking place across {venue.city || 'nearby venues'}.
            </p>
            <Link
              href={`/events?city=${encodeURIComponent(venue.city || '')}`}
              className="inline-flex px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
            >
              Browse Local Events
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
