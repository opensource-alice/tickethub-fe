'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutGrid,
  List,
  Search,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Frown,
  X,
} from 'lucide-react';
import { getEvents } from '@/api/events';
import { EventFilters } from '@/components/events/event-filters';
import { EventCard } from '@/components/events/event-card';
import { EventListItem } from '@/components/events/event-list-item';

function EventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const keyword = searchParams.get('keyword') || undefined;
  const city = searchParams.get('city') || undefined;
  const countryCode = searchParams.get('countryCode') || undefined;
  const classificationName = searchParams.get('classificationName') || undefined;
  const startDateTime = searchParams.get('startDateTime') || undefined;
  const endDateTime = searchParams.get('endDateTime') || undefined;
  const page = parseInt(searchParams.get('page') || '0', 10);
  const size = 12;
  const sort = searchParams.get('sort') || 'date,asc';

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['events', { keyword, city, countryCode, classificationName, startDateTime, endDateTime, page, size, sort }],
    queryFn: () =>
      getEvents({
        keyword,
        city,
        countryCode,
        classificationName,
        startDateTime,
        endDateTime,
        page,
        size,
        sort,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const events = data?.events || [];
  const pagination = data?.pagination || { page: 0, size, totalElements: 0, totalPages: 0 };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`/events?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.set('page', '0');
    router.push(`/events?${params.toString()}`);
  };

  const activeFilters = [
    keyword && { key: 'keyword', label: `Keyword: "${keyword}"` },
    classificationName && { key: 'classificationName', label: `Category: ${classificationName}` },
    city && { key: 'city', label: `City: ${city}` },
    countryCode && { key: 'countryCode', label: `Country: ${countryCode}` },
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Header & Search Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {classificationName ? `${classificationName} Events` : 'Explore Live Events'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {isLoading
              ? 'Searching live events...'
              : `Found ${pagination.totalElements} verified events ready to book`}
          </p>
        </div>

        {/* View Mode & Quick Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-secondary/80 p-1 rounded-xl border border-border">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label="Grid view"
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label="List view"
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs text-muted-foreground font-medium">Active filters:</span>
          {activeFilters.map((f) => (
            <span
              key={f.key}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
            >
              <span>{f.label}</span>
              <button
                onClick={() => removeFilter(f.key)}
                className="hover:opacity-75 focus:outline-none"
                aria-label={`Remove filter ${f.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            onClick={() => router.push('/events')}
            className="text-xs text-muted-foreground hover:text-foreground underline ml-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Main Layout: Sidebar Filters + Events List */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <EventFilters />

        <div className="flex-1 w-full">
          {/* Loading Skeletons */}
          {isLoading ? (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-secondary/50 border border-border h-80 animate-pulse"
                />
              ))}
            </div>
          ) : isError ? (
            /* Error State */
            <div className="p-12 text-center rounded-3xl glass-card border border-destructive/20 space-y-4 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                <Frown className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Failed to load events</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {(error as Error)?.message || 'There was a problem communicating with the Ticketmaster service.'}
              </p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md"
              >
                Try Again
              </button>
            </div>
          ) : events.length === 0 ? (
            /* Empty State */
            <div className="p-12 sm:p-16 text-center rounded-3xl glass-card border border-border space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground mx-auto">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-foreground">No events found</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                We couldn&apos;t find any events matching your selected criteria. Try adjusting your search keyword or clearing the filters.
              </p>
              <button
                onClick={() => router.push('/events')}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary/90 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            /* Events Grid / List */
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event, index) => (
                    <EventCard key={event.id} event={event} priority={index < 4} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <EventListItem key={event.id} event={event} />
                  ))}
                </div>
              )}

              {/* Pagination Bar */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12 pt-6 border-t border-border">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 0}
                    className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-border bg-secondary/60 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary text-xs font-semibold text-foreground transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-xs font-semibold">
                    <span>Page</span>
                    <span className="text-primary font-bold">{page + 1}</span>
                    <span>of</span>
                    <span>{pagination.totalPages}</span>
                  </div>

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= pagination.totalPages - 1}
                    className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-border bg-secondary/60 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary text-xs font-semibold text-foreground transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading events discovery...</p>
        </div>
      }
    >
      <EventsContent />
    </Suspense>
  );
}
