import { Flame, Music2, Trophy, Theater, Sparkles } from 'lucide-react';
import { HeroSection } from '@/components/home/hero-section';
import { CategoryTiles } from '@/components/home/category-tiles';
import { NearYouSection } from '@/components/home/near-you-section';
import { EventCarousel } from '@/components/events/event-carousel';
import { api } from '@/lib/api-client';

export const revalidate = 300; // 5 min ISR

export default async function HomePage() {
  // Fetch initial event groups concurrently on server for instant SSR performance
  const [trendingData, musicData, sportsData, theatreData, familyData] = await Promise.all([
    api.getEvents({ size: 8, sort: 'relevance,desc' }).catch(() => ({ events: [], pagination: { page: 0, size: 8, totalElements: 0, totalPages: 0 } })),
    api.getEvents({ classificationName: 'Music', size: 8 }).catch(() => ({ events: [], pagination: { page: 0, size: 8, totalElements: 0, totalPages: 0 } })),
    api.getEvents({ classificationName: 'Sports', size: 8 }).catch(() => ({ events: [], pagination: { page: 0, size: 8, totalElements: 0, totalPages: 0 } })),
    api.getEvents({ classificationName: 'Arts & Theatre', size: 8 }).catch(() => ({ events: [], pagination: { page: 0, size: 8, totalElements: 0, totalPages: 0 } })),
    api.getEvents({ classificationName: 'Misc', size: 8 }).catch(() => ({ events: [], pagination: { page: 0, size: 8, totalElements: 0, totalPages: 0 } })),
  ]);

  return (
    <div className="space-y-6">
      {/* Hero Section with Large Search */}
      <HeroSection />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        {/* Category Tiles */}
        <CategoryTiles />

        {/* Trending Events Carousel */}
        <EventCarousel
          title="Trending Events"
          subtitle="Top selling shows and high-demand tours fans are loving right now"
          events={trendingData.events}
          viewAllHref="/events?sort=relevance,desc"
          icon={<Flame className="w-6 h-6 text-orange-500 fill-orange-500/20" />}
        />

        {/* Events Near You (Client Geolocation) */}
        <NearYouSection />

        {/* Concerts & Music */}
        <EventCarousel
          title="Concerts & Music Festivals"
          subtitle="World tours, rock legends, pop sensations, and electronic beats"
          events={musicData.events}
          viewAllHref="/events?classificationName=Music"
          icon={<Music2 className="w-6 h-6 text-violet-500" />}
        />

        {/* Sports & Athletics */}
        <EventCarousel
          title="Championship Sports"
          subtitle="Experience the roar of the arena in basketball, soccer, football & motorsport"
          events={sportsData.events}
          viewAllHref="/events?classificationName=Sports"
          icon={<Trophy className="w-6 h-6 text-amber-500" />}
        />

        {/* Arts & Theatre */}
        <EventCarousel
          title="Broadway & Stage Arts"
          subtitle="Critically acclaimed drama, timeless musicals, stand-up comedy, and circus"
          events={theatreData.events}
          viewAllHref="/events?classificationName=Arts%20%26%20Theatre"
          icon={<Theater className="w-6 h-6 text-pink-500" />}
        />

        {/* Family & Misc */}
        <EventCarousel
          title="Family & Spectacular Experiences"
          subtitle="Unforgettable memories for all ages, ice shows, conventions & festivals"
          events={familyData.events}
          viewAllHref="/events?classificationName=Misc"
          icon={<Sparkles className="w-6 h-6 text-emerald-500" />}
        />
      </div>
    </div>
  );
}
