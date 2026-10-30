'use client';

import { useQuery } from '@tanstack/react-query';
import { MapPin, Navigation, Sparkles } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useGeolocation } from '@/hooks/use-geolocation';
import { EventCarousel } from '@/components/events/event-carousel';
import { CitySelector } from '@/components/shared/city-selector';
import { useState } from 'react';

export function NearYouSection() {
  const geo = useGeolocation();
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const activeCity = selectedCity || geo.city;

  const { data, isLoading } = useQuery({
    queryKey: ['events-near-you', activeCity],
    queryFn: () => api.getEvents({ city: activeCity, size: 8 }),
    staleTime: 5 * 60 * 1000,
  });

  const events = data?.events || [];

  return (
    <div className="py-4">
      {/* City Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-secondary/50 border border-border mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-medium">
              {geo.isDetected ? 'Auto-detected via GPS' : 'Discover local events in'}
            </span>
            <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              {activeCity}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">Change city:</span>
          <CitySelector currentCity={activeCity} onCityChange={(city) => setSelectedCity(city)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-hidden py-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-[300px] shrink-0 h-72 rounded-2xl bg-secondary/60 animate-pulse border border-border/50"
            />
          ))}
        </div>
      ) : events.length > 0 ? (
        <EventCarousel
          title={`Popular Events Near ${activeCity}`}
          subtitle={`Top rated experiences and entertainment taking place around ${activeCity}`}
          events={events}
          viewAllHref={`/events?city=${encodeURIComponent(activeCity)}`}
          icon={<Sparkles className="w-5 h-5 text-amber-500" />}
        />
      ) : (
        <div className="p-8 text-center rounded-2xl border border-dashed border-border text-muted-foreground text-sm">
          No live events currently found in {activeCity}. Try selecting a major metro like New York or Los Angeles!
        </div>
      )}
    </div>
  );
}
