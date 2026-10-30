'use client';

import { useState, Suspense } from 'react';
import { MapPin, ChevronDown, Check } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

const POPULAR_CITIES = [
  'New York',
  'Los Angeles',
  'Chicago',
  'London',
  'Las Vegas',
  'Miami',
  'San Francisco',
  'Toronto',
  'Paris',
];

interface CitySelectorProps {
  currentCity?: string;
  onCityChange?: (city: string) => void;
}

function CitySelectorInner({ currentCity, onCityChange }: CitySelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const selectedCity = currentCity || searchParams.get('city') || 'All Cities';

  const handleSelect = (city: string) => {
    setIsOpen(false);
    if (onCityChange) {
      onCityChange(city);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      if (city === 'All Cities') {
        params.delete('city');
      } else {
        params.set('city', city);
      }
      params.set('page', '0');
      router.push(`/events?${params.toString()}`);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-secondary/80 hover:bg-secondary text-foreground border border-border/80 hover:border-primary/40 transition-colors focus-visible:ring-2 focus-visible:ring-primary"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        id="city-selector-btn"
      >
        <MapPin className="w-3.5 h-3.5 text-primary" />
        <span className="max-w-[100px] sm:max-w-[130px] truncate">{selectedCity}</span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-48 rounded-2xl glass-card shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
            role="listbox"
          >
            <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Select City
            </div>
            <button
              onClick={() => handleSelect('All Cities')}
              className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs sm:text-sm hover:bg-primary/10 hover:text-primary transition-colors text-left"
              role="option"
              aria-selected={selectedCity === 'All Cities'}
            >
              <span>All Cities</span>
              {selectedCity === 'All Cities' && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
            <div className="my-1 border-t border-border/60" />
            <div className="max-h-56 overflow-y-auto space-y-0.5">
              {POPULAR_CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => handleSelect(city)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs sm:text-sm hover:bg-primary/10 hover:text-primary transition-colors text-left"
                  role="option"
                  aria-selected={selectedCity === city}
                >
                  <span>{city}</span>
                  {selectedCity === city && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function CitySelector(props: CitySelectorProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary/80 text-foreground border border-border">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span>{props.currentCity || 'All Cities'}</span>
        </div>
      }
    >
      <CitySelectorInner {...props} />
    </Suspense>
  );
}
