'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Heart, ArrowUpRight, Calendar, Sparkles } from 'lucide-react';
import { EventItem } from '@/types';
import { formatDate, formatPrice } from '@/lib/utils';
import { useFavorites } from '@/hooks/use-favorites';

interface EventCardProps {
  event: EventItem;
  priority?: boolean;
}

export function EventCard({ event, priority = false }: EventCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const dateInfo = formatDate(event.dates.localDate, event.dates.localTime);
  const priceDisplay = formatPrice(event.priceRange);
  const favorite = isFavorite(event.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(event);
  };

  return (
    <div className="group relative flex flex-col h-full rounded-2xl glass-card overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-violet-500/10 hover:border-primary/40">
      {/* Clickable Card Link */}
      <Link href={`/events/${event.id}`} className="flex flex-col h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
        {/* Image Container with 16:9 ratio */}
        <div className="relative w-full aspect-[16/10] overflow-hidden bg-muted">
          <Image
            src={event.imageUrl}
            alt={event.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Top Floating Badges: Date & Favorite */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
            {/* Date Badge */}
            <div className="flex flex-col items-center justify-center px-2.5 py-1 rounded-xl bg-background/90 backdrop-blur-md border border-border/80 shadow-md text-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                {dateInfo.monthName}
              </span>
              <span className="text-sm font-extrabold leading-tight">
                {dateInfo.dayNumber}
              </span>
            </div>

            {/* Favorite Button */}
            <button
              onClick={handleFavoriteClick}
              aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
              className="w-8 h-8 rounded-full bg-background/90 backdrop-blur-md border border-border/80 flex items-center justify-center text-foreground hover:scale-110 active:scale-95 transition-all shadow-md focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  favorite ? 'text-pink-500 fill-pink-500' : 'text-muted-foreground hover:text-pink-500'
                }`}
              />
            </button>
          </div>

          {/* Bottom Overlay Info: Category & Price Chip */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs z-10">
            <span className="px-2 py-0.5 rounded-full bg-primary/80 backdrop-blur-md text-[11px] font-semibold tracking-wide">
              {event.classification.segment || 'Event'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md font-bold text-amber-300 border border-white/10">
              {priceDisplay}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 flex flex-col flex-1 justify-between gap-3">
          <div>
            <h3
              className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug tracking-tight"
              title={event.name}
            >
              {event.name}
            </h3>

            {/* Venue and City */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">
                {event.venue?.name || 'Venue TBA'}
                {event.city ? ` • ${event.city}` : ''}
              </span>
            </div>

            {/* Date and Time full */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <Calendar className="w-3.5 h-3.5 shrink-0 text-muted-foreground/80" />
              <span className="truncate">{dateInfo.fullDisplay}</span>
            </div>
          </div>

          {/* Footer Action Strip */}
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary">
            <span>View Details & Tickets</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </Link>
    </div>
  );
}
