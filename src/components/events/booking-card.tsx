'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  Calendar,
  Share2,
  ShieldCheck,
  Zap,
  Check,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { EventItem } from '@/types';
import { formatPrice, downloadIcsFile } from '@/lib/utils';
import { useFavorites } from '@/hooks/use-favorites';
import { toast } from 'sonner';

interface BookingCardProps {
  event: EventItem;
}

export function BookingCard({ event }: BookingCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [copied, setCopied] = useState(false);
  const favorite = isFavorite(event.id);
  const priceDisplay = formatPrice(event.priceRange);

  const handleShare = async () => {
    const shareData = {
      title: event.name,
      text: `Check out ${event.name} on TicketHub!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      toast.error('Could not copy link');
    }
  };

  const handleAddCalendar = () => {
    downloadIcsFile(event);
    toast.success('Calendar event (.ics) downloaded');
  };

  return (
    <div className="rounded-3xl glass-card p-6 border border-border shadow-2xl space-y-6 sticky top-24">
      {/* Price Header */}
      <div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
          Official Ticket Range
        </span>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-3xl font-black text-foreground">{priceDisplay}</span>
          {event.priceRange && (
            <span className="text-xs text-muted-foreground">/ person</span>
          )}
        </div>
      </div>

      {/* Main Direct Purchase CTA Button */}
      <div className="space-y-2">
        <Link
          href={`/events/${event.id}/book`}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 hover:opacity-95 active:scale-[0.98] text-white font-extrabold text-base shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2 transition-all duration-200"
          id="book-tickets-btn"
        >
          <span>Select Seats & Book</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        {/* Live seat selection notice */}
        <p className="text-[11px] text-muted-foreground text-center leading-tight">
          Interactive stadium seating map • Instant digital reservation
        </p>
      </div>

      {/* Secondary Actions: Favorites, Calendar, Share */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60">
        {/* Favorite */}
        <button
          onClick={() => toggleFavorite(event)}
          className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border border-border text-xs font-semibold transition-all hover:bg-secondary ${
            favorite ? 'text-pink-500 bg-pink-500/10 border-pink-500/30' : 'text-muted-foreground'
          }`}
          aria-label={favorite ? 'Remove Favorite' : 'Save Favorite'}
        >
          <Heart className={`w-4 h-4 mb-1 ${favorite ? 'fill-pink-500' : ''}`} />
          <span>{favorite ? 'Saved' : 'Save'}</span>
        </button>

        {/* Add to Calendar (.ics) */}
        <button
          onClick={handleAddCalendar}
          className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          aria-label="Add to Calendar (.ics)"
        >
          <Calendar className="w-4 h-4 mb-1 text-primary" />
          <span>Calendar</span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          aria-label="Share Event"
        >
          {copied ? (
            <Check className="w-4 h-4 mb-1 text-emerald-500" />
          ) : (
            <Share2 className="w-4 h-4 mb-1 text-primary" />
          )}
          <span>{copied ? 'Copied!' : 'Share'}</span>
        </button>
      </div>

      {/* Trust & Guarantee points */}
      <div className="space-y-2.5 pt-4 border-t border-border/60 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>100% Buyer Guarantee on Official Tickets</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Instant mobile barcode entry</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-500 shrink-0" />
          <span>Official Event Status: {event.dates.status.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
