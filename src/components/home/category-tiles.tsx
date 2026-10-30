'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Music2, Trophy, Theater, Film, Sparkles, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api-client';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Music2,
  Trophy,
  Theater,
  Film,
  Sparkles,
};

const GRADIENTS: Record<string, string> = {
  music: 'from-purple-900/90 via-violet-900/60 to-transparent',
  sports: 'from-blue-900/90 via-cyan-900/60 to-transparent',
  'arts-theatre': 'from-pink-900/90 via-rose-900/60 to-transparent',
  film: 'from-amber-900/90 via-orange-900/60 to-transparent',
  misc: 'from-emerald-900/90 via-teal-900/60 to-transparent',
};

export function CategoryTiles() {
  const { data, isLoading } = useQuery({
    queryKey: ['classifications'],
    queryFn: () => api.getClassifications(),
    staleTime: 10 * 60 * 1000,
  });

  const categories = data?.classifications || [];

  return (
    <section className="py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            Browse by Category
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Official Ticketmaster categories & live events worldwide
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {isLoading
          ? [1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="rounded-2xl aspect-[4/5] bg-secondary/60 animate-pulse border border-border"
              />
            ))
          : categories.map((cat) => {
              const Icon = ICON_MAP[cat.icon] || Sparkles;
              const gradient = GRADIENTS[cat.slug] || 'from-slate-900/90 via-indigo-900/60 to-transparent';
              const topGenres = cat.genres?.slice(0, 3).join(', ') || 'Live Events';

              return (
                <Link
                  key={cat.id || cat.slug}
                  href={`/events?classificationName=${encodeURIComponent(cat.name)}`}
                  className="group relative rounded-2xl overflow-hidden aspect-[4/5] glass-card shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${gradient}`} />

                  <div className="absolute inset-0 p-4 flex flex-col justify-between text-white z-10">
                    <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-sm group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>

                    <div>
                      <h3 className="font-bold text-base sm:text-lg leading-tight group-hover:text-amber-300 transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-[11px] text-white/80 mt-1 line-clamp-1">{topGenres}</p>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-white/90 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Explore</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
