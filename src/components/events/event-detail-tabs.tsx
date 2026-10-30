'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Info,
  MapPin,
  Compass,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { EventItem, HiResImagesResponse } from '@/types';
import { EventCarousel } from './event-carousel';

interface EventDetailTabsProps {
  event: EventItem;
  similarEvents: EventItem[];
  hiResImages?: HiResImagesResponse | null;
}

export function EventDetailTabs({ event, similarEvents, hiResImages }: EventDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'venue' | 'seatmap' | 'media' | 'notes'>('about');

  const { venue, seatmap, info, pleaseNote, promoter, classification } = event;
  const imagesList = hiResImages?.images?.length ? hiResImages.images : event.images || [];

  return (
    <div className="space-y-8">
      {/* Tab Navigation Pill Bar */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-secondary/70 border border-border overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('about')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'about'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Info className="w-4 h-4 text-primary" />
          <span>About Event</span>
        </button>

        <button
          onClick={() => setActiveTab('venue')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'venue'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MapPin className="w-4 h-4 text-primary" />
          <span>Venue & Location</span>
        </button>

        {imagesList.length > 0 && (
          <button
            onClick={() => setActiveTab('media')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'media'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-primary" />
            <span>Hi-Res Media ({imagesList.length})</span>
          </button>
        )}

        {seatmap?.staticUrl && (
          <button
            onClick={() => setActiveTab('seatmap')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'seatmap'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="w-4 h-4 text-primary" />
            <span>Interactive Seat Map</span>
          </button>
        )}

        {pleaseNote && (
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'notes'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Important Notes</span>
          </button>
        )}
      </div>

      {/* Tab Content Panels */}
      <div className="p-6 sm:p-8 rounded-3xl glass-card border border-border shadow-sm">
        {/* Tab 1: About */}
        {activeTab === 'about' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-3">About This Event</h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                {info ||
                  `${event.name} is scheduled to take place live in ${
                    event.city || 'its designated venue'
                  }. Grab your official tickets via TicketHub with direct verification on Ticketmaster.`}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/60">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider block font-semibold">
                  Genre & Category
                </span>
                <span className="text-sm font-bold text-foreground">
                  {classification.segment || 'General'}{' '}
                  {classification.genre ? `• ${classification.genre}` : ''}{' '}
                  {classification.subGenre ? `• ${classification.subGenre}` : ''}
                </span>
              </div>

              {promoter && (
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider block font-semibold">
                    Official Tour Promoter
                  </span>
                  <span className="text-sm font-bold text-foreground">{promoter}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Venue Info */}
        {activeTab === 'venue' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">{venue?.name || 'Venue TBA'}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {[venue?.address, venue?.city, venue?.state, venue?.postalCode, venue?.countryCode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>

              {venue?.id && (
                <Link
                  href={`/venues/${venue.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs border border-primary/20 transition-colors w-fit"
                >
                  <span>Full Venue Guide</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {venue?.latitude && venue?.longitude && (
              <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Compass className="w-5 h-5 text-primary" />
                  <div className="text-xs">
                    <span className="font-bold block">GPS Coordinates</span>
                    <span className="text-muted-foreground">
                      {venue.latitude.toFixed(4)}, {venue.longitude.toFixed(4)}
                    </span>
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-lg bg-background text-xs font-semibold border border-border hover:bg-secondary transition-colors"
                >
                  Open in Google Maps
                </a>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Hi-Res Media */}
        {activeTab === 'media' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">High-Resolution Media & Press Photos</h2>
                <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">
                  Ticketmaster Discovery API v2
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Official high-res tour assets, arena banners, and promotional artwork.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {imagesList.map((img, idx) => (
                <div
                  key={img.url + idx}
                  className="group relative rounded-2xl overflow-hidden border border-border bg-slate-900 flex flex-col justify-between"
                >
                  <div className="relative w-full aspect-[16/9] bg-slate-950 overflow-hidden">
                    <Image
                      src={img.url}
                      alt={`${event.name} media ${idx + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-white">
                        {img.ratio || '16_9'}
                      </span>
                      {img.width >= 1024 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/80 backdrop-blur-md text-white">
                          HD / Retina
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-secondary/40 flex items-center justify-between text-xs border-t border-border/50">
                    <span className="font-mono text-muted-foreground font-semibold">
                      {img.width} × {img.height} px
                    </span>
                    <a
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline font-bold"
                    >
                      <span>View Full Res</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Seat Map */}
        {activeTab === 'seatmap' && seatmap?.staticUrl && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h2 className="text-xl font-bold text-foreground">Interactive Seating Layout</h2>
            <p className="text-xs text-muted-foreground">
              Official stadium/arena seating chart provided by Ticketmaster.
            </p>
            <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-black/5 border border-border">
              <Image
                src={seatmap.staticUrl}
                alt={`${event.name} Seatmap`}
                fill
                className="object-contain"
              />
            </div>
          </div>
        )}

        {/* Tab 4: Important Notes */}
        {activeTab === 'notes' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="w-5 h-5" />
              <h2 className="text-lg font-bold">Important Event Guidelines & Restrictions</h2>
            </div>
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
              {pleaseNote}
            </div>
          </div>
        )}
      </div>

      {/* Similar Events Horizontal Carousel */}
      {similarEvents.length > 0 && (
        <div className="pt-6">
          <EventCarousel
            title="Fans Also Viewed"
            subtitle={`More ${classification.segment || 'live'} events you might like`}
            events={similarEvents}
            icon={<Sparkles className="w-5 h-5 text-violet-500" />}
          />
        </div>
      )}
    </div>
  );
}
