'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { EventItem } from '@/types';
import { EventCard } from './event-card';

interface EventCarouselProps {
  title: string;
  subtitle?: string;
  events: EventItem[];
  viewAllHref?: string;
  icon?: React.ReactNode;
}

export function EventCarousel({
  title,
  subtitle,
  events,
  viewAllHref,
  icon,
}: EventCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!events || events.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      {/* Header with Title and Scroll Controls */}
      <div className="flex items-end justify-between mb-5 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {icon && <span className="text-primary">{icon}</span>}
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              {title}
            </h2>
          </div>
          {subtitle && <p className="text-xs sm:text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-xs sm:text-sm font-semibold text-primary hover:underline flex items-center gap-1 mr-2"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full border border-border bg-card/80 hover:bg-secondary flex items-center justify-center text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`Scroll ${title} left`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full border border-border bg-card/80 hover:bg-secondary flex items-center justify-center text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`Scroll ${title} right`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {events.map((event, index) => (
          <div
            key={event.id}
            className="w-[280px] sm:w-[320px] md:w-[350px] shrink-0 snap-start"
          >
            <EventCard event={event} priority={index < 2} />
          </div>
        ))}
      </div>
    </section>
  );
}
