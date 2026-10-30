import Link from 'next/link';
import { Ticket, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container max-w-xl mx-auto px-4 py-24 text-center space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-violet-600 via-purple-600 to-pink-500 text-white flex items-center justify-center mx-auto shadow-2xl shadow-violet-500/30">
        <Ticket className="w-10 h-10 -rotate-12" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-primary">
          404 Error
        </span>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
          Event or Page Not Found
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The event or venue you&apos;re looking for may have moved, concluded, or the link may be outdated. Let&apos;s get you back to the hottest live shows.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary/90 transition-colors w-full sm:w-auto justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <Link
          href="/events"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-secondary/80 text-foreground text-xs font-bold hover:bg-secondary transition-colors w-full sm:w-auto justify-center"
        >
          <Search className="w-4 h-4 text-primary" />
          <span>Search All Events</span>
        </Link>
      </div>
    </div>
  );
}
