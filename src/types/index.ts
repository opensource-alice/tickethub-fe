export interface EventImage {
  url: string;
  ratio: string;
  width: number;
  height: number;
  fallback?: boolean;
}

export interface EventDates {
  localDate: string;
  localTime?: string;
  timezone?: string;
  status: 'onsale' | 'offsale' | 'canceled' | 'postponed' | 'rescheduled' | string;
  formattedDate?: string;
}

export interface PriceRange {
  min: number;
  max: number;
  currency: string;
}

export interface VenueSummary {
  id: string;
  name: string;
  city?: string;
  state?: string;
  countryCode?: string;
  address?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
}

export interface Classification {
  segment?: string;
  genre?: string;
  subGenre?: string;
}

export interface Seatmap {
  staticUrl?: string;
}

export interface EventItem {
  id: string;
  name: string;
  imageUrl: string;
  images: EventImage[];
  dates: EventDates;
  venue?: VenueSummary;
  city?: string;
  priceRange?: PriceRange;
  classification: Classification;
  url: string;
  seatmap?: Seatmap;
  info?: string;
  pleaseNote?: string;
  promoter?: string;
}

export interface PaginationMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface EventListResponse {
  events: EventItem[];
  pagination: PaginationMeta;
}

export interface VenueLocation {
  longitude?: number;
  latitude?: number;
}

export interface VenueDetails {
  id: string;
  name: string;
  url?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  timezone?: string;
  location?: VenueLocation;
  imageUrl?: string;
  parkingDetail?: string;
  accessibleSeatingDetail?: string;
  generalRules?: string;
  upcomingEvents?: EventItem[];
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  imageUrl: string;
  genres: string[];
}

export interface FilterParams {
  keyword?: string;
  city?: string;
  countryCode?: string;
  classificationName?: string;
  genre?: string;
  promoterId?: string;
  startDateTime?: string;
  endDateTime?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface HiResImageItem {
  url: string;
  ratio?: string;
  width: number;
  height: number;
  fallback?: boolean;
  attribution?: string;
  isHiRes: boolean;
}

export interface HiResImagesResponse {
  id: string;
  type: 'event' | 'attraction';
  hiResImage?: HiResImageItem;
  bannerImage?: HiResImageItem;
  thumbnailImage?: HiResImageItem;
  images: HiResImageItem[];
}

export interface CartTotals {
  subtotal: number;
  serviceFee: number;
  facilityFee: number;
  tax: number;
  total: number;
  currency: string;
}

export interface CartReservedItem {
  reserveId: string;
  section: string;
  row?: string;
  seats?: string[];
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PartnerCartResponse {
  cartId: string;
  eventId: string;
  status: 'RESERVED' | 'PAYMENT_PENDING' | 'AUTHORIZED' | 'COMMITTED' | 'CANCELLED';
  holdSeconds: number;
  expiresAt: string;
  items: CartReservedItem[];
  totals: CartTotals;
  customer?: {
    name?: string;
    email?: string;
  };
  payment?: {
    paymentType: string;
    cardBrand?: string;
    cardLast4?: string;
    authorizedAmount: number;
    authorizedAt: string;
  };
}

export interface IssuedTicket {
  ticketId: string;
  section: string;
  row: string;
  seat: string;
  barcode: string;
  qrPassPayload: string;
}

export interface PartnerCommitResponse {
  orderId: string;
  confirmationCode: string;
  eventId: string;
  eventName: string;
  venueName: string;
  eventDate: string;
  status: 'CONFIRMED';
  committedAt: string;
  deliveryMethod: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  totals: CartTotals;
  tickets: IssuedTicket[];
}

