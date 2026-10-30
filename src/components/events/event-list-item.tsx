'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Calendar, Heart, ArrowUpRight } from 'lucide-react';
import { EventItem } from '@/types';
import { formatDate, formatPrice } from '@/lib/utils';
import { useFavorites } from '@/hooks/use-favorites';

interface EventListItemProps {
  event: EventItem;
}

export function EventListItem({ event }: EventListItemProps) {
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
    <div className="group rounded-2xl glass-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/40 border border-border">
      <Link href={`/events/${event.id}`} className="flex flex-col sm:flex-row items-stretch">
        {/* Thumbnail */}
        <div className="relative w-full sm:w-56 aspect-[16/10] sm:aspect-auto shrink-0 bg-muted overflow-hidden">
          <Image
            src={event.imageUrl}
            alt={event.name}
            fill
            sizes="(max-width: 640px) 100vw, 240px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-bold text-white">
            {event.classification.segment || 'Live'}
          </div>
        </div>

        {/* Info */}
        <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 gap-3">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors leading-snug">
                {event.name}
              </h3>
              <button
                onClick={handleFavoriteClick}
                className="w-8 h-8 rounded-full bg-secondary hover:scale-110 flex items-center justify-center text-foreground shrink-0 transition-transform"
                aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart
                  className={`w-4 h-4 ${favorite ? 'text-pink-500 fill-pink-500' : 'text-muted-foreground'}`}
                />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{dateInfo.fullDisplay}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>
                  {event.venue?.name || 'Venue TBA'}
                  {event.city ? `, ${event.city}` : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
            <span className="font-extrabold text-foreground text-sm">
              From <span className="text-primary">{priceDisplay}</span>
            </span>

            <span className="font-semibold text-primary flex items-center gap-1 group-hover:underline">
              <span>Book Tickets</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
