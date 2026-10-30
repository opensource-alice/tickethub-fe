'use client';

import Link from 'next/link';
import { Heart, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import { useFavorites } from '@/hooks/use-favorites';
import { EventCard } from '@/components/events/event-card';

export default function FavoritesPage() {
  const { favorites, isLoaded } = useFavorites();

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to remove all saved events?')) {
      localStorage.removeItem('tickethub_favorites_v1');
      window.dispatchEvent(new Event('tickethub_favorites_change'));
    }
  };

  if (!isLoaded) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-xs text-muted-foreground">Loading your saved events...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Saved Favorites
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Keep track of upcoming tours, tournaments, and shows you want to attend
          </p>
        </div>

        {favorites.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-semibold transition-colors w-fit"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Grid or Empty State */}
      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="p-12 sm:p-20 text-center rounded-3xl glass-card border border-border max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-pink-500/10 text-pink-500 flex items-center justify-center mx-auto shadow-inner">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">No saved events yet</h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Click the heart icon on any event card to save it here for easy access, calendar sync, and ticket tracking.
          </p>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary/90 transition-colors"
          >
            <span>Explore Events</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
