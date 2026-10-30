'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Ticket, Mail, ShieldCheck, Zap, Heart, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  if (pathname?.includes('/book')) {
    return null;
  }

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSubscribed(true);
    toast.success('Subscribed!', {
      description: "You'll be the first to know about presales, tour drops, and exclusive discounts.",
    });
    setEmail('');
  };

  return (
    <footer className="border-t border-border bg-card/60 backdrop-blur-md pt-16 pb-12 mt-20">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
                <Ticket className="w-5 h-5 -rotate-12" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 bg-clip-text text-transparent">
                TicketHub
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              The premier live entertainment discovery and ticket booking portal. Discover world-class concerts, championship sporting events, Broadway theatre, and family shows with real-time seat availability.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Verified Direct Booking</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Real-Time Discovery API</span>
              </div>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">
              Explore Categories
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/events?classificationName=Music" className="hover:text-primary transition-colors">
                  Concerts & Music
                </Link>
              </li>
              <li>
                <Link href="/events?classificationName=Sports" className="hover:text-primary transition-colors">
                  Sports & Athletics
                </Link>
              </li>
              <li>
                <Link href="/events?classificationName=Arts%20%26%20Theatre" className="hover:text-primary transition-colors">
                  Arts & Theatre
                </Link>
              </li>
              <li>
                <Link href="/events?classificationName=Film" className="hover:text-primary transition-colors">
                  Cinema & Film
                </Link>
              </li>
              <li>
                <Link href="/events?classificationName=Misc" className="hover:text-primary transition-colors">
                  Family & Festivals
                </Link>
              </li>
            </ul>
          </div>

          {/* Top Metros */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">
              Top Cities
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/events?city=New+York" className="hover:text-primary transition-colors">
                  New York, NY
                </Link>
              </li>
              <li>
                <Link href="/events?city=Los+Angeles" className="hover:text-primary transition-colors">
                  Los Angeles, CA
                </Link>
              </li>
              <li>
                <Link href="/events?city=London" className="hover:text-primary transition-colors">
                  London, UK
                </Link>
              </li>
              <li>
                <Link href="/events?city=Chicago" className="hover:text-primary transition-colors">
                  Chicago, IL
                </Link>
              </li>
              <li>
                <Link href="/events?city=Paris" className="hover:text-primary transition-colors">
                  Paris, France
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Stay in the Loop
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Never miss presale passwords, stadium announcements, or last-minute ticket drops.
            </p>
            <form onSubmit={handleNewsletter} className="space-y-2">
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>{subscribed ? 'Subscribed!' : 'Subscribe for Alerts'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/60 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} TicketHub Inc. Powered by Ticketmaster Discovery API v2.</p>
          <div className="flex items-center gap-6">
            <Link href="/events" className="hover:text-foreground transition-colors">
              Browse All
            </Link>
            <Link href="/favorites" className="hover:text-foreground transition-colors">
              Saved Events
            </Link>
            <span className="flex items-center gap-1 text-muted-foreground">
              Crafted with <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500 inline" /> for live fans
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
