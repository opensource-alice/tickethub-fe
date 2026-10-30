'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Calendar, Sparkles, ShieldCheck, Ticket, Users } from 'lucide-react';

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

const DATE_OPTIONS = [
  { label: 'Anytime', value: '' },
  { label: 'This Weekend', value: 'weekend' },
  { label: 'Next 30 Days', value: 'month' },
];

export function HeroSection() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('All Cities');
  const [dateFilter, setDateFilter] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('keyword', keyword.trim());
    if (city && city !== 'All Cities') params.set('city', city);

    if (dateFilter === 'weekend') {
      const today = new Date();
      const friday = new Date(today);
      friday.setDate(today.getDate() + ((5 - today.getDay() + 7) % 7));
      const sunday = new Date(friday);
      sunday.setDate(friday.getDate() + 2);
      params.set('startDateTime', `${friday.toISOString().split('T')[0]}T00:00:00Z`);
      params.set('endDateTime', `${sunday.toISOString().split('T')[0]}T23:59:59Z`);
    } else if (dateFilter === 'month') {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setDate(today.getDate() + 30);
      params.set('startDateTime', `${today.toISOString().split('T')[0]}T00:00:00Z`);
      params.set('endDateTime', `${nextMonth.toISOString().split('T')[0]}T23:59:59Z`);
    }

    params.set('page', '0');
    router.push(`/events?${params.toString()}`);
  };

  return (
    <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
      {/* Background ambient radial gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none gradient-hero-glow -z-10" />

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 text-center">
        {/* Top Tagline Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-semibold mb-6 animate-pulse-glow">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Ticketmaster Discovery API v2 Verified Portal</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-foreground max-w-4xl mx-auto leading-[1.1] mb-6">
          Experience Live Moments That{' '}
          <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 bg-clip-text text-transparent">
            Stay With You
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Discover world-tour concerts, major league showdowns, Broadway phenomena, and local festivals with real-time seat availability.
        </p>

        {/* Large Multi-Field Search Card */}
        <div className="max-w-4xl mx-auto rounded-3xl glass-card p-3 sm:p-4 shadow-2xl shadow-violet-500/10 border border-border/80">
          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
          >
            {/* Keyword Field */}
            <div className="md:col-span-5 relative flex items-center bg-background/80 rounded-2xl border border-border px-3.5 py-2.5">
              <Search className="w-4 h-4 text-muted-foreground shrink-0 mr-2.5" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search event, artist, or team..."
                className="w-full bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/70"
              />
            </div>

            {/* City Selector */}
            <div className="md:col-span-3 relative flex items-center bg-background/80 rounded-2xl border border-border px-3.5 py-2.5">
              <MapPin className="w-4 h-4 text-primary shrink-0 mr-2.5" />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none appearance-none cursor-pointer text-foreground"
              >
                {POPULAR_CITIES.map((c) => (
                  <option key={c} value={c} className="bg-background text-foreground">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Selector */}
            <div className="md:col-span-2 relative flex items-center bg-background/80 rounded-2xl border border-border px-3.5 py-2.5">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0 mr-2" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm focus:outline-none appearance-none cursor-pointer text-foreground"
              >
                {DATE_OPTIONS.map((d) => (
                  <option key={d.label} value={d.value} className="bg-background text-foreground">
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Submit CTA */}
            <div className="md:col-span-2">
              <button
                type="submit"
                id="hero-search-submit"
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Find Tickets</span>
              </button>
            </div>
          </form>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Official Ticketmaster Verified Partner</span>
          </div>
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-violet-500" />
            <span>100% Authentic Seating</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-500" />
            <span>Over 5 Million Happy Fans</span>
          </div>
        </div>
      </div>
    </section>
  );
}
