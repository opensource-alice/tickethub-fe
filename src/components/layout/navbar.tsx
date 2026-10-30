'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Ticket,
  Search,
  Heart,
  Menu,
  X,
  Music2,
  Trophy,
  Theater,
  Film,
  Sparkles,
} from 'lucide-react';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { CitySelector } from '@/components/shared/city-selector';
import { useFavorites } from '@/hooks/use-favorites';

const CATEGORIES = [
  { name: 'Music', slug: 'Music', icon: Music2 },
  { name: 'Sports', slug: 'Sports', icon: Trophy },
  { name: 'Arts & Theatre', slug: 'Arts & Theatre', icon: Theater },
  { name: 'Film', slug: 'Film', icon: Film },
  { name: 'Family & Misc', slug: 'Misc', icon: Sparkles },
];

function NavbarSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (keyword.trim()) {
      params.set('keyword', keyword.trim());
    } else {
      params.delete('keyword');
    }
    params.set('page', '0');
    router.push(`/events?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearchSubmit}
      className="hidden md:flex items-center relative flex-1 max-w-md mx-2"
    >
      <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 pointer-events-none" />
      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="Search artists, teams, concerts, venues..."
        className="w-full pl-9 pr-20 py-2 text-xs sm:text-sm rounded-full bg-secondary/60 hover:bg-secondary/90 focus:bg-background border border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/70"
      />
      <button
        type="submit"
        className="absolute right-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
      >
        Search
      </button>
    </form>
  );
}

function MobileSearch({ onFinish }: { onFinish: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (keyword.trim()) {
      params.set('keyword', keyword.trim());
    } else {
      params.delete('keyword');
    }
    params.set('page', '0');
    router.push(`/events?${params.toString()}`);
    onFinish();
  };

  return (
    <form onSubmit={handleSearchSubmit} className="relative">
      <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="Search events, artists, teams..."
        className="w-full pl-9 pr-20 py-2 text-sm rounded-xl bg-secondary/80 border border-border"
      />
      <button
        type="submit"
        className="absolute right-1.5 top-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-primary text-white"
      >
        Go
      </button>
    </form>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { favorites } = useFavorites();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (pathname?.includes('/book')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full glass-navbar transition-all duration-200">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
            id="brand-logo-link"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-violet-500/25 group-hover:scale-105 group-hover:shadow-violet-500/40 transition-all duration-300">
              <Ticket className="w-5 h-5 -rotate-12 transition-transform group-hover:rotate-0" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 bg-clip-text text-transparent">
                TicketHub
              </span>
              <span className="text-[10px] text-muted-foreground font-medium -mt-1 hidden sm:block">
                Discovery & Live Booking
              </span>
            </div>
          </Link>

          {/* Quick Search in Navbar wrapped in Suspense */}
          <Suspense fallback={<div className="hidden md:flex flex-1 max-w-md mx-2 h-9 rounded-full bg-secondary/40 animate-pulse" />}>
            <NavbarSearch />
          </Suspense>

          {/* Right Action Icons: City Selector, Favorites, Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <CitySelector />
            </div>

            {/* Saved Favorites Link */}
            <Link
              href="/favorites"
              className="relative flex items-center justify-center w-9 h-9 rounded-full bg-secondary/70 hover:bg-secondary text-foreground border border-border/80 hover:border-pink-500/40 transition-all focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="View Saved Events"
              title="Saved Favorites"
              id="navbar-favorites-btn"
            >
              <Heart className="w-4 h-4 text-pink-500" />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {favorites.length > 9 ? '9+' : favorites.length}
                </span>
              )}
            </Link>

            <ThemeToggle />

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-secondary/80 text-foreground border border-border/80"
              aria-label="Toggle navigation menu"
              id="mobile-nav-toggle"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Secondary Category Nav links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 border-t border-border/40 py-2.5 overflow-x-auto no-scrollbar">
          <Link
            href="/events"
            className="px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground whitespace-nowrap"
          >
            All Events
          </Link>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.slug}
                href={`/events?classificationName=${encodeURIComponent(cat.slug)}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground whitespace-nowrap"
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl p-4 space-y-4 animate-in slide-in-from-top duration-200">
          <Suspense fallback={<div className="h-9 rounded-xl bg-secondary animate-pulse" />}>
            <MobileSearch onFinish={() => setMobileMenuOpen(false)} />
          </Suspense>

          <div className="pt-2">
            <CitySelector />
          </div>

          <div className="pt-2 border-t border-border/60">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Browse Categories
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/events"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-secondary/50 text-xs font-medium hover:bg-primary/10 hover:text-primary flex items-center gap-2"
              >
                <Ticket className="w-4 h-4 text-primary" />
                <span>All Events</span>
              </Link>
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.slug}
                    href={`/events?classificationName=${encodeURIComponent(cat.slug)}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2.5 rounded-xl bg-secondary/50 text-xs font-medium hover:bg-primary/10 hover:text-primary flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4 text-primary" />
                    <span>{cat.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
