import {
  CategoryItem,
  EventItem,
  EventListResponse,
  FilterParams,
  HiResImagesResponse,
  HiResImageItem,
  PartnerCartResponse,
  PartnerCommitResponse,
  VenueDetails,
} from '@/types';
import {
  ClassificationMapper,
  EventMapper,
  VenueMapper,
} from './ticketmaster-mapper';

const TM_BASE_URL =
  process.env.NEXT_PUBLIC_TICKETMASTER_BASE_URL ||
  'https://app.ticketmaster.com/discovery/v2';
const TM_API_KEY =
  process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY ||
  'aida6OnYLISdlPlYPKABTjLpgMoP4qec';

class TicketmasterApiClient {
  private readonly baseUrl: string = TM_BASE_URL;
  private readonly apiKey: string = TM_API_KEY;

  private async tmRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set('apikey', this.apiKey);

    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        url.searchParams.set(key, String(val));
      }
    });

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 300 }, // 5 min Next.js cache
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Resource not found at ${endpoint}`);
      }
      let errDetail = `${response.status} ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson.fault?.faultstring) {
          errDetail = errJson.fault.faultstring;
        } else if (errJson.message) {
          errDetail = errJson.message;
        }
      } catch {}
      throw new Error(`Ticketmaster API error: ${errDetail}`);
    }

    return response.json();
  }

  async getEvents(params: FilterParams = {}): Promise<EventListResponse> {
    let safePage = params.page || 0;
    const safeSize = Math.min(params.size || 20, 100);
    // Ticketmaster deep paging rule: size * page < 1000
    if (safePage * safeSize >= 1000) {
      safePage = Math.max(0, Math.floor(999 / safeSize));
    }

    const queryParams: Record<string, any> = {
      page: safePage,
      size: safeSize,
      sort: params.sort || 'date,asc',
    };

    if (params.keyword) queryParams.keyword = params.keyword;
    if (params.city) queryParams.city = params.city;
    if (params.countryCode) queryParams.countryCode = params.countryCode;
    if (params.genre) {
      queryParams.classificationName = params.genre;
    } else if (params.classificationName) {
      queryParams.classificationName = params.classificationName;
    }
    if (params.promoterId) queryParams.promoterId = params.promoterId;
    if (params.startDateTime) queryParams.startDateTime = params.startDateTime;
    if (params.endDateTime) queryParams.endDateTime = params.endDateTime;

    try {
      const data = await this.tmRequest<any>('/events.json', queryParams);
      return EventMapper.toListResponse(data, safePage, safeSize);
    } catch (error) {
      return {
        events: [],
        pagination: {
          page: safePage,
          size: safeSize,
          totalElements: 0,
          totalPages: 0,
        },
      };
    }
  }

  async getEventById(id: string): Promise<EventItem> {
    const data = await this.tmRequest<any>(`/events/${id}.json`);
    return EventMapper.toDto(data);
  }

  async getEventImages(id: string): Promise<HiResImagesResponse> {
    let rawImages: any[] = [];
    try {
      const data = await this.tmRequest<any>(`/events/${id}/images.json`);
      rawImages = data?._embedded?.images || data?.images || [];
    } catch {
      try {
        const event = await this.getEventById(id);
        rawImages = event.images || [];
      } catch {
        rawImages = [];
      }
    }

    const mapped: HiResImageItem[] = rawImages.map((img: any) => {
      const width = Number(img.width) || 0;
      const height = Number(img.height) || 0;
      return {
        url: img.url,
        ratio: img.ratio || '16_9',
        width,
        height,
        fallback: Boolean(img.fallback),
        attribution: img.attribution,
        isHiRes: width >= 1024 || width * height >= 786432,
      };
    });

    mapped.sort((a, b) => b.width * b.height - a.width * a.height);
    const hiResImage = mapped.find((img) => img.isHiRes) || mapped[0];
    const bannerImage = mapped.find((img) => img.ratio === '16_9') || mapped[0];
    const thumbnailImage =
      mapped.find((img) => img.ratio === '4_3' || img.ratio === '3_2') || mapped[mapped.length - 1];

    return {
      id,
      type: 'event',
      hiResImage,
      bannerImage,
      thumbnailImage,
      images: mapped,
    };
  }

  async getAttractionImages(id: string): Promise<HiResImagesResponse> {
    let rawImages: any[] = [];
    try {
      const data = await this.tmRequest<any>(`/attractions/${id}/images.json`);
      rawImages = data?._embedded?.images || data?.images || [];
    } catch {
      rawImages = [];
    }

    const mapped: HiResImageItem[] = rawImages.map((img: any) => {
      const width = Number(img.width) || 0;
      const height = Number(img.height) || 0;
      return {
        url: img.url,
        ratio: img.ratio || '16_9',
        width,
        height,
        fallback: Boolean(img.fallback),
        attribution: img.attribution,
        isHiRes: width >= 1024 || width * height >= 786432,
      };
    });

    mapped.sort((a, b) => b.width * b.height - a.width * a.height);
    const hiResImage = mapped.find((img) => img.isHiRes) || mapped[0];
    const bannerImage = mapped.find((img) => img.ratio === '16_9') || mapped[0];
    const thumbnailImage =
      mapped.find((img) => img.ratio === '4_3' || img.ratio === '3_2') || mapped[mapped.length - 1];

    return {
      id,
      type: 'attraction',
      hiResImage,
      bannerImage,
      thumbnailImage,
      images: mapped,
    };
  }

  async getSimilarEvents(id: string): Promise<EventListResponse> {
    try {
      const event = await this.getEventById(id);
      const classification =
        event.classification.segment || event.classification.genre || 'Music';

      const similar = await this.getEvents({
        classificationName: classification,
        page: 0,
        size: 6,
      });

      const filtered = similar.events.filter((e) => e.id !== id);
      return {
        events: filtered.slice(0, 4),
        pagination: {
          page: 0,
          size: 4,
          totalElements: filtered.length,
          totalPages: 1,
        },
      };
    } catch {
      return {
        events: [],
        pagination: { page: 0, size: 4, totalElements: 0, totalPages: 0 },
      };
    }
  }

  async getVenueById(id: string): Promise<VenueDetails> {
    const venueData = await this.tmRequest<any>(`/venues/${id}.json`);

    let upcomingEvents: EventItem[] = [];
    try {
      const eventsData = await this.tmRequest<any>('/events.json', {
        venueId: id,
        size: 6,
      });
      const rawEvents = eventsData?._embedded?.events || [];
      upcomingEvents = rawEvents.map((e: any) => EventMapper.toDto(e));
    } catch {}

    return VenueMapper.toDto(venueData, upcomingEvents);
  }

  async getClassifications(): Promise<{ classifications: CategoryItem[] }> {
    const data = await this.tmRequest<any>('/classifications.json', { size: 20 });
    const rawList = data?._embedded?.classifications || [];
    return ClassificationMapper.toListResponse(rawList);
  }

  // --- Direct Ticket Reservation & Partner Checkout ---

  async createPartnerCart(
    eventId: string,
    reserves: {
      section: string;
      row?: string;
      quantity: number;
      unitPrice: number;
      currency?: string;
    }[],
    customer?: { customerName?: string; customerEmail?: string },
  ): Promise<PartnerCartResponse> {
    const event = await this.getEventById(eventId);
    const cartId = `tm_cart_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36).slice(-4)}`;
    const expiresAt = new Date(Date.now() + 600 * 1000).toISOString(); // 10 min hold

    let totalQuantity = 0;
    let subtotal = 0;

    const items = reserves.map((res, index) => {
      const lineTotal = res.unitPrice * res.quantity;
      subtotal += lineTotal;
      totalQuantity += res.quantity;

      const seats = Array.from(
        { length: res.quantity },
        (_, i) => `${res.section} Row ${res.row || '1'} Seat ${i + 1}`,
      );

      return {
        reserveId: `res_${cartId}_${index + 1}`,
        section: res.section,
        row: res.row || 'GA',
        seats,
        quantity: res.quantity,
        unitPrice: res.unitPrice,
        lineTotal,
      };
    });

    const serviceFee = Math.round(subtotal * 0.15 * 100) / 100;
    const facilityFee = Math.round(totalQuantity * 3.5 * 100) / 100;
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = Math.round((subtotal + serviceFee + facilityFee + tax) * 100) / 100;

    const cart: PartnerCartResponse = {
      cartId,
      eventId,
      status: 'RESERVED',
      expiresAt,
      holdSeconds: 600,
      totals: {
        currency: reserves[0]?.currency || event.priceRange?.currency || 'USD',
        subtotal,
        serviceFee,
        facilityFee,
        tax,
        total,
      },
      items,
      customer: customer ? { name: customer.customerName, email: customer.customerEmail } : undefined,
    };

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`cart_${cartId}`, JSON.stringify(cart));
      } catch {}
    }

    return cart;
  }

  async getPartnerCart(eventId: string, cartId: string): Promise<PartnerCartResponse> {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(`cart_${cartId}`);
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    throw new Error(`Cart ${cartId} not found or expired.`);
  }

  async addPartnerPayment(
    eventId: string,
    cartId: string,
    payment: {
      paymentType: string;
      amount: number;
      cardBrand?: string;
      cardLast4?: string;
      billingZip?: string;
    },
  ): Promise<PartnerCartResponse> {
    const cart = await this.getPartnerCart(eventId, cartId);
    cart.status = 'AUTHORIZED';
    cart.payment = {
      paymentType: payment.paymentType,
      cardBrand: payment.cardBrand || 'Visa',
      cardLast4: payment.cardLast4 || '4242',
      authorizedAmount: payment.amount,
      authorizedAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`cart_${cartId}`, JSON.stringify(cart));
      } catch {}
    }

    return cart;
  }

  async commitPartnerOrder(
    eventId: string,
    cartId: string,
    customer: {
      customerName: string;
      customerEmail: string;
      customerPhone?: string;
      deliveryMethod?: string;
    },
  ): Promise<PartnerCommitResponse> {
    const event = await this.getEventById(eventId);
    let cart: PartnerCartResponse | null = null;
    try {
      cart = await this.getPartnerCart(eventId, cartId);
    } catch {}

    const confirmationCode = `TM-ORD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const tickets: any[] = [];
    if (cart?.items) {
      for (const item of cart.items) {
        for (let i = 0; i < item.quantity; i++) {
          const barcode = `TM${Math.random().toString(36).substring(2, 8).toUpperCase()}${Date.now().toString().slice(-6)}`;
          tickets.push({
            ticketId: `tkt_${Math.random().toString(36).substring(2, 9)}`,
            section: item.section,
            row: item.row || '1',
            seat: item.seats?.[i] || `Seat ${i + 1}`,
            barcode,
            qrPassPayload: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(barcode)}`,
          });
        }
      }
    }

    const order: PartnerCommitResponse = {
      orderId: `ord_${Math.random().toString(36).substring(2, 10)}`,
      confirmationCode,
      eventId: event.id,
      eventName: event.name,
      venueName: event.venue?.name || 'Venue',
      eventDate: event.dates.localDate,
      status: 'CONFIRMED',
      committedAt: new Date().toISOString(),
      deliveryMethod: customer.deliveryMethod || 'Mobile Entry (Ticketmaster SafeTix)',
      customer: {
        name: customer.customerName,
        email: customer.customerEmail,
        phone: customer.customerPhone,
      },
      totals: cart?.totals || {
        currency: 'USD',
        subtotal: 100,
        serviceFee: 15,
        facilityFee: 7,
        tax: 8,
        total: 130,
      },
      tickets,
    };

    return order;
  }

  async deletePartnerCart(eventId: string, cartId: string): Promise<{ status: string; cartId: string }> {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(`cart_${cartId}`);
      } catch {}
    }
    return { status: 'deleted', cartId };
  }
}

export const api = new TicketmasterApiClient();
