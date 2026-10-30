import {
  CategoryItem,
  EventImage,
  EventItem,
  EventListResponse,
  VenueDetails,
} from '@/types';

export class EventMapper {
  public static mapImages(rawImages?: any[]): { images: EventImage[]; bestImageUrl: string } {
    if (!rawImages || !Array.isArray(rawImages) || rawImages.length === 0) {
      const fallbackUrl = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80';
      return {
        images: [{ url: fallbackUrl, ratio: '16_9', width: 1200, height: 675, fallback: true }],
        bestImageUrl: fallbackUrl,
      };
    }

    const mapped: EventImage[] = rawImages.map((img) => ({
      url: img.url,
      ratio: img.ratio || '16_9',
      width: Number(img.width) || 0,
      height: Number(img.height) || 0,
      fallback: Boolean(img.fallback),
    }));

    // Sort by resolution descending
    const sorted = [...mapped].sort((a, b) => b.width * b.height - a.width * a.height);
    const bestWide = sorted.find((img) => (img.ratio === '16_9' || img.ratio === '3_2') && img.width >= 640);
    const bestImageUrl = bestWide?.url || sorted[0]?.url || rawImages[0]?.url;

    return {
      images: sorted,
      bestImageUrl,
    };
  }

  public static toDto(raw: any): EventItem {
    const { images, bestImageUrl } = this.mapImages(raw.images);
    const rawVenue = raw._embedded?.venues?.[0] || {};

    let minPrice = 0;
    let maxPrice = 0;
    let currency = 'USD';

    if (raw.priceRanges && raw.priceRanges.length > 0) {
      minPrice = raw.priceRanges[0].min ?? 0;
      maxPrice = raw.priceRanges[0].max ?? minPrice;
      currency = raw.priceRanges[0].currency || 'USD';
    }

    const segment = raw.classifications?.[0]?.segment?.name || 'General';
    const genre = raw.classifications?.[0]?.genre?.name || undefined;
    const subGenre = raw.classifications?.[0]?.subGenre?.name || undefined;

    const localDate = raw.dates?.start?.localDate || 'TBD';
    const localTime = raw.dates?.start?.localTime || undefined;
    const timezone = raw.dates?.timezone || undefined;
    const status = raw.dates?.status?.code || 'onsale';

    const city = rawVenue.city?.name || rawVenue.address?.line1 || undefined;

    return {
      id: raw.id,
      name: raw.name || 'Untitled Event',
      imageUrl: bestImageUrl,
      images,
      dates: {
        localDate,
        localTime,
        timezone,
        status,
      },
      venue: rawVenue.id
        ? {
            id: rawVenue.id,
            name: rawVenue.name || 'Venue TBA',
            city: rawVenue.city?.name,
            state: rawVenue.state?.name || rawVenue.state?.stateCode,
            countryCode: rawVenue.country?.countryCode,
            address: rawVenue.address?.line1,
            postalCode: rawVenue.postalCode,
            latitude: rawVenue.location?.latitude ? Number(rawVenue.location.latitude) : undefined,
            longitude: rawVenue.location?.longitude ? Number(rawVenue.location.longitude) : undefined,
            imageUrl: rawVenue.images?.[0]?.url,
          }
        : undefined,
      city,
      priceRange:
        raw.priceRanges && raw.priceRanges.length > 0
          ? {
              min: minPrice,
              max: maxPrice,
              currency,
            }
          : undefined,
      classification: {
        segment,
        genre,
        subGenre,
      },
      url: raw.url || `https://www.ticketmaster.com/event/${raw.id}`,
      seatmap: raw.seatmap?.staticUrl
        ? {
            staticUrl: raw.seatmap.staticUrl,
          }
        : undefined,
      info: raw.info || undefined,
      pleaseNote: raw.pleaseNote || undefined,
      promoter: raw.promoter?.name || undefined,
    };
  }

  public static toListResponse(rawResponse: any, page = 0, size = 20): EventListResponse {
    const rawEvents = rawResponse._embedded?.events || [];
    const events = rawEvents.map((e: any) => this.toDto(e));

    const totalElements = rawResponse.page?.totalElements ?? events.length;
    const totalPages = rawResponse.page?.totalPages ?? Math.ceil(totalElements / size);

    return {
      events,
      pagination: {
        page: rawResponse.page?.number ?? page,
        size: rawResponse.page?.size ?? size,
        totalElements,
        totalPages,
      },
    };
  }
}

export class VenueMapper {
  public static toDto(raw: any, upcomingEvents: EventItem[] = []): VenueDetails {
    const images = raw.images || [];
    const bestImage =
      images.find((img: any) => img.ratio === '16_9' && img.width >= 600)?.url ||
      images[0]?.url ||
      'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&q=80';

    return {
      id: raw.id,
      name: raw.name || 'Venue',
      url: raw.url,
      address: raw.address?.line1,
      city: raw.city?.name,
      state: raw.state?.name || raw.state?.stateCode,
      postalCode: raw.postalCode,
      country: raw.country?.name || raw.country?.countryCode,
      timezone: raw.timezone,
      location: raw.location
        ? {
            latitude: Number(raw.location.latitude),
            longitude: Number(raw.location.longitude),
          }
        : undefined,
      imageUrl: bestImage,
      parkingDetail: raw.parkingDetail || raw.boxOfficeInfo?.openHoursDetail,
      accessibleSeatingDetail: raw.accessibleSeatingDetail,
      generalRules: raw.generalInfo?.generalRule || raw.generalInfo?.childRule,
      upcomingEvents,
    };
  }
}

export class ClassificationMapper {
  private static segmentIcons: Record<string, { icon: string; description: string; imageUrl: string }> = {
    music: {
      icon: 'Music2',
      description: 'Live concerts, stadium tours, music festivals, and acoustic sets',
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80',
    },
    sports: {
      icon: 'Trophy',
      description: 'Major league showdowns, basketball, soccer, football, tennis, and motorsports',
      imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80',
    },
    'arts & theatre': {
      icon: 'Theater',
      description: 'Award-winning Broadway musicals, plays, comedy tours, dance, and circus',
      imageUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=1200&q=80',
    },
    film: {
      icon: 'Film',
      description: 'Film festivals, cinema screenings with live orchestra, and premiere experiences',
      imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=80',
    },
    miscellaneous: {
      icon: 'Sparkles',
      description: 'Family entertainment, immersive exhibits, ice shows, conventions, and festivals',
      imageUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200&q=80',
    },
  };

  public static toListResponse(rawList: any[]): { classifications: CategoryItem[] } {
    const mapped: CategoryItem[] = [];

    for (const item of rawList) {
      const segment = item.segment;
      if (!segment || !segment.name || segment.name.toLowerCase() === 'undefined') {
        continue;
      }

      const name = segment.name;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const metaKey = name.toLowerCase();
      const meta = this.segmentIcons[metaKey] || {
        icon: 'Sparkles',
        description: `Live entertainment and tickets for ${name}`,
        imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80',
      };

      const rawGenres = segment._embedded?.genres || [];
      const genres = rawGenres
        .map((g: any) => g.name)
        .filter((gName: string) => Boolean(gName) && gName.toLowerCase() !== 'undefined');

      mapped.push({
        id: segment.id,
        name,
        slug,
        icon: meta.icon,
        description: meta.description,
        imageUrl: meta.imageUrl,
        genres,
      });
    }

    return { classifications: mapped };
  }
}
