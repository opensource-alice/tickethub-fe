'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, X, RotateCcw, Check } from 'lucide-react';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

const POPULAR_CITIES = [
  'All Cities',
  'New York',
  'Los Angeles',
  'London',
  'Chicago',
  'Toronto',
  'Las Vegas',
  'Miami',
  'Paris',
];

const COUNTRIES = [
  { code: '', label: 'All Countries' },
  { code: 'US', label: 'United States' },
  { code: 'CA', label: 'Canada' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'FR', label: 'France' },
  { code: 'DE', label: 'Germany' },
  { code: 'AU', label: 'Australia' },
];

const SORT_OPTIONS = [
  { value: 'date,asc', label: 'Date: Upcoming First' },
  { value: 'date,desc', label: 'Date: Latest First' },
  { value: 'relevance,desc', label: 'Most Relevant' },
  { value: 'name,asc', label: 'Name: A to Z' },
];

const PROMOTERS = [
  { id: '', label: 'All Promoters' },
  { id: '653', label: 'Live Nation (653)' },
  { id: '494', label: 'AEG Presents (494)' },
  { id: '268', label: 'Messina Touring (268)' },
];

export function EventFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const selectedCategory = searchParams.get('classificationName') || 'All';
  const selectedGenre = searchParams.get('genre') || 'All Genres';
  const selectedPromoter = searchParams.get('promoterId') || '';
  const selectedCity = searchParams.get('city') || 'All Cities';
  const selectedCountry = searchParams.get('countryCode') || '';
  const selectedSort = searchParams.get('sort') || 'date,asc';

  const { data: classificationsData } = useQuery({
    queryKey: ['classifications'],
    queryFn: () => api.getClassifications(),
    staleTime: 10 * 60 * 1000,
  });

  const categories = ['All', ...(classificationsData?.classifications?.map((c) => c.name) || ['Music', 'Sports', 'Arts & Theatre', 'Film', 'Miscellaneous'])];

  const currentClassification = classificationsData?.classifications?.find(
    (c) => c.name.toLowerCase() === selectedCategory.toLowerCase(),
  );

  const genres = [
    'All Genres',
    ...(currentClassification?.genres ||
      Array.from(
        new Set(classificationsData?.classifications?.flatMap((c) => c.genres) || []),
      )),
  ];

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === 'All' || value === 'All Cities' || value === 'All Genres') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set('page', '0');
    router.push(`/events?${params.toString()}`);
  };

  const handleReset = () => {
    router.push('/events');
    setMobileFilterOpen(false);
  };

  const filterContent = (
    <div className="space-y-6">
      {/* Category Filter */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-3">
          Category
        </label>
        <div className="space-y-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => updateParam('classificationName', cat)}
              className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors text-left ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{cat}</span>
              {selectedCategory === cat && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* Genre Filter */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
          Genre
        </label>
        <select
          value={selectedGenre}
          onChange={(e) => updateParam('genre', e.target.value)}
          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground cursor-pointer"
        >
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {/* Promoter Filter */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
          Promoter
        </label>
        <select
          value={selectedPromoter}
          onChange={(e) => updateParam('promoterId', e.target.value)}
          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground cursor-pointer"
        >
          {PROMOTERS.map((p) => (
            <option key={p.label} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* City Filter */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
          City
        </label>
        <select
          value={selectedCity}
          onChange={(e) => updateParam('city', e.target.value)}
          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground cursor-pointer"
        >
          {POPULAR_CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      {/* Country Filter */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
          Country
        </label>
        <select
          value={selectedCountry}
          onChange={(e) => updateParam('countryCode', e.target.value)}
          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground cursor-pointer"
        >
          {COUNTRIES.map((c) => (
            <option key={c.label} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sort Options */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
          Sort By
        </label>
        <select
          value={selectedSort}
          onChange={(e) => updateParam('sort', e.target.value)}
          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Reset button */}
      <button
        onClick={handleReset}
        className="flex items-center justify-center gap-1.5 w-full py-2.5 px-3 rounded-xl border border-border hover:bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Reset Filters</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile Filter Trigger Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileFilterOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-secondary text-foreground text-sm font-semibold border border-border shadow-sm"
          id="mobile-filter-open-btn"
        >
          <Filter className="w-4 h-4 text-primary" />
          <span>Filters & Sort</span>
        </button>
      </div>

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 rounded-2xl glass-card p-5 border border-border h-fit sticky top-24">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Filter className="w-4 h-4 text-primary" />
            <span>Filter Events</span>
          </div>
          <button
            onClick={handleReset}
            className="text-[11px] text-muted-foreground hover:text-primary transition-colors"
          >
            Clear all
          </button>
        </div>
        {filterContent}
      </aside>

      {/* Mobile Drawer Backdrop and Panel */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-background p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-border">
                <div className="flex items-center gap-2 font-bold text-base">
                  <Filter className="w-4 h-4 text-primary" />
                  <span>Filters</span>
                </div>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {filterContent}
            </div>

            <button
              onClick={() => setMobileFilterOpen(false)}
              className="mt-6 w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-md"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </>
  );
}
