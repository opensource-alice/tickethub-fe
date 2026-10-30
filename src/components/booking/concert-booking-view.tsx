'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, Clock, ShieldCheck } from 'lucide-react';
import { EventItem } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  InteractiveSeatMap,
  SectionData,
  SeatNode,
  generateSection212Seats,
} from './interactive-seat-map';
import {
  TicketSelectionPanel,
  TicketListing,
} from './ticket-selection-panel';
import { CheckoutDrawer, CheckoutSeatItem } from './checkout-drawer';
import { toast } from 'sonner';

interface ConcertBookingViewProps {
  event: EventItem;
}

export function ConcertBookingView({ event }: ConcertBookingViewProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<TicketListing | null>(null);
  const [ticketQuantity, setTicketQuantity] = useState<number>(2);
  const [checkoutOpen, setCheckoutOpen] = useState<boolean>(false);
  const [panelCollapsed, setPanelCollapsed] = useState<boolean>(false);

  // Checkbox seat selection & persistent booked seats state
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [selectedSeatsData, setSelectedSeatsData] = useState<CheckoutSeatItem[]>([]);
  const [bookedSeatIds, setBookedSeatIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`booked_seats_${event.id}`);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    // Default initial mock booked seats to reflect live stadium status
    return ['DDD-Row14-1', 'DDD-Row14-2', 'FFF-Row18-4', '108-Row20-1', '120-Row7-1'];
  });

  const handleToggleSeat = (seat: SeatNode) => {
    // If seat is in bookedSeatIds, it's non-clickable
    if (bookedSeatIds.includes(seat.id)) {
      toast.error('This seat has been booked and is no longer available.', {
        description: `Section ${seat.sectionName}, ${seat.row}, Seat ${seat.seatNumber}`,
      });
      return;
    }

    if (selectedSeatIds.includes(seat.id)) {
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.id));
      setSelectedSeatsData((prev) => prev.filter((s) => s.id !== seat.id));
    } else {
      setSelectedSeatIds((prev) => [...prev, seat.id]);
      setSelectedSeatsData((prev) => [
        ...prev,
        {
          id: seat.id,
          sectionName: seat.sectionName,
          row: seat.row,
          seatNumber: seat.seatNumber,
          price: seat.price,
        },
      ]);
    }
  };

  const handlePaymentSuccess = (newlyBookedSeatIds: string[]) => {
    setBookedSeatIds((prev) => {
      const merged = Array.from(new Set([...prev, ...newlyBookedSeatIds]));
      if (typeof window !== 'undefined') {
        localStorage.setItem(`booked_seats_${event.id}`, JSON.stringify(merged));
      }
      return merged;
    });
    // Clear selection so the seats immediately show as locked/sold non-clickable
    setSelectedSeatIds([]);
    setSelectedSeatsData([]);
  };

  const handleCheckoutSelectedSeats = () => {
    if (selectedSeatsData.length === 0) return;
    setSelectedSection(selectedSeatsData[0].sectionName);
    setSelectedListing({
      id: `custom-booking-${Date.now()}`,
      sectionId: selectedSeatsData[0].sectionName,
      sectionName: selectedSeatsData[0].sectionName,
      row: selectedSeatsData[0].row,
      seats: selectedSeatsData.map((s) => `Seat ${s.seatNumber}`).join(', '),
      type: 'Standard Admission',
      price: selectedSeatsData[0].price,
      viewImage: event.images?.[0]?.url || event.imageUrl,
    });
    setTicketQuantity(selectedSeatsData.length);
    setCheckoutOpen(true);
  };

  const dateInfo = formatDate(event.dates.localDate, event.dates.localTime);

  // Derive dynamic pricing and images directly from the Ticketmaster API event payload
  const minPrice = event.priceRange?.min ?? 45.0;
  const maxPrice = event.priceRange?.max ?? 189.0;
  const priceSpan = Math.max(maxPrice - minPrice, 20);

  // Real concert image from Ticketmaster API images array
  const tmHeroImage = event.images?.[0]?.url || event.imageUrl;
  const tmStageImage = event.images?.find((img) => img.ratio === '16_9')?.url || tmHeroImage;
  const tmThumbImage = event.images?.find((img) => img.ratio === '4_3' || img.ratio === '3_2')?.url || tmHeroImage;

  // Sections matching the stadium geometry with prices dynamically calibrated to Ticketmaster's price ranges
  const SECTIONS: SectionData[] = [
    { id: 'PIT', name: 'PIT', level: 'Pit', available: true, price: Number(maxPrice.toFixed(2)), featured: true, ticketsCount: 18, viewAngle: 'Front Stage Standing' },
    { id: 'DDD', name: 'DDD', level: 'Floor', available: true, price: Number((minPrice + priceSpan * 0.25).toFixed(2)), featured: true, ticketsCount: 8, viewAngle: 'Floor Center' },
    { id: 'AAA', name: 'AAA', level: 'Floor', available: true, price: Number((minPrice + priceSpan * 0.65).toFixed(2)), featured: true, ticketsCount: 12, viewAngle: 'Floor Front Left' },
    { id: 'BBB', name: 'BBB', level: 'Floor', available: true, price: Number((minPrice + priceSpan * 0.55).toFixed(2)), featured: false, ticketsCount: 14, viewAngle: 'Floor Front Center' },
    { id: 'CCC', name: 'CCC', level: 'Floor', available: true, price: Number((minPrice + priceSpan * 0.55).toFixed(2)), featured: false, ticketsCount: 10, viewAngle: 'Floor Front Right' },
    { id: 'EEE', name: 'EEE', level: 'Floor', available: true, price: Number((minPrice + priceSpan * 0.40).toFixed(2)), featured: false, ticketsCount: 8, viewAngle: 'Floor Center Mid' },
    { id: 'FFF', name: 'FFF', level: 'Floor', available: true, price: Number((minPrice + priceSpan * 0.30).toFixed(2)), featured: false, ticketsCount: 6, viewAngle: 'Floor Rear Right' },
    { id: '120', name: '120', level: 'Lower', available: true, price: Number((minPrice + priceSpan * 0.25).toFixed(2)), featured: true, ticketsCount: 22, viewAngle: 'Lower Bowl Side Stage' },
    { id: '122', name: '122', level: 'Lower', available: true, price: Number((minPrice + priceSpan * 0.35).toFixed(2)), featured: false, ticketsCount: 16, viewAngle: 'Lower Bowl Center' },
    { id: '124', name: '124', level: 'Lower', available: true, price: Number((minPrice + priceSpan * 0.38).toFixed(2)), featured: false, ticketsCount: 14, viewAngle: 'Lower Bowl Prime Center' },
    { id: '126', name: '126', level: 'Lower', available: true, price: Number((minPrice + priceSpan * 0.35).toFixed(2)), featured: false, ticketsCount: 18, viewAngle: 'Lower Bowl Center Right' },
    { id: '128', name: '128', level: 'Lower', available: true, price: Number((minPrice + priceSpan * 0.28).toFixed(2)), featured: false, ticketsCount: 10, viewAngle: 'Lower Bowl Right' },
    { id: '118', name: '118', level: 'Lower', available: true, price: Number((minPrice + priceSpan * 0.20).toFixed(2)), featured: false, ticketsCount: 15, viewAngle: 'Lower Bowl Corner' },
    { id: '116', name: '116', level: 'Lower', available: true, price: Number((minPrice + priceSpan * 0.18).toFixed(2)), featured: false, ticketsCount: 16, viewAngle: 'Lower Bowl West' },
    { id: '114', name: '114', level: 'Lower', available: true, price: Number((minPrice + priceSpan * 0.08).toFixed(2)), featured: false, ticketsCount: 24, viewAngle: 'Lower Bowl Diagonal' },
    { id: '112', name: '112', level: 'Lower', available: true, price: Number((minPrice + priceSpan * 0.08).toFixed(2)), featured: false, ticketsCount: 18, viewAngle: 'Lower Bowl West Mid' },
    { id: '110', name: '110', level: 'Lower', available: true, price: Number((minPrice + priceSpan * 0.08).toFixed(2)), featured: false, ticketsCount: 14, viewAngle: 'Lower Bowl West South' },
    { id: '108', name: '108', level: 'Lower', available: true, price: Number((minPrice + priceSpan * 0.08).toFixed(2)), featured: false, ticketsCount: 19, viewAngle: 'Lower Bowl Straight' },
    { id: '106', name: '106', level: 'Lower', available: true, price: Number((minPrice + priceSpan * 0.08).toFixed(2)), featured: false, ticketsCount: 11, viewAngle: 'Lower Bowl Side' },
    { id: '104', name: '104', level: 'Lower', available: true, price: Number((minPrice + priceSpan * 0.16).toFixed(2)), featured: false, ticketsCount: 13, viewAngle: 'Lower Bowl Rear' },
    { id: '102', name: '102', level: 'Lower', available: true, price: Number((minPrice + priceSpan * 0.12).toFixed(2)), featured: false, ticketsCount: 12, viewAngle: 'Lower Bowl Rear Right' },
    { id: '148', name: '148', level: 'Lower', available: true, price: Number((minPrice + priceSpan * 0.10).toFixed(2)), featured: false, ticketsCount: 9, viewAngle: 'Lower Bowl Corner Right' },
    { id: '146', name: '146', level: 'Lower', available: true, price: Number((minPrice + priceSpan * 0.10).toFixed(2)), featured: false, ticketsCount: 8, viewAngle: 'Lower Bowl Corner Right' },
    { id: '212', name: '212', level: 'Club', available: true, price: Number(minPrice.toFixed(2)), featured: false, ticketsCount: 12, viewAngle: 'Club Level 200' },
  ];

  const fallbackImages = [
    'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&q=80',
  ];

  const getListingImage = (index: number) => {
    if (event.images && event.images.length > 0) {
      return event.images[index % event.images.length]?.url || event.imageUrl;
    }
    return fallbackImages[index % fallbackImages.length];
  };

  // Ticket listings dynamically mapped to the event's Ticketmaster pricing tiers & official event images
  const LISTINGS: TicketListing[] = [
    {
      id: 'list-1',
      sectionId: 'DDD',
      sectionName: 'DDD',
      row: 'Row 14',
      seats: 'Seats 5-6',
      type: 'Standard Admission',
      price: Number((minPrice + priceSpan * 0.25).toFixed(2)),
      featured: true,
      viewImage: getListingImage(0),
    },
    {
      id: 'list-2',
      sectionId: 'DDD',
      sectionName: 'DDD',
      row: 'Row 17',
      seats: 'Seats 12-13',
      type: 'Standard Admission',
      price: Number((minPrice + priceSpan * 0.25).toFixed(2)),
      featured: true,
      viewImage: getListingImage(1),
    },
    {
      id: 'list-3',
      sectionId: '120',
      sectionName: '120',
      row: 'Row 7',
      seats: 'Seats 1-2',
      type: 'Standard Admission',
      price: Number((minPrice + priceSpan * 0.25).toFixed(2)),
      featured: true,
      viewImage: getListingImage(2),
    },
    {
      id: 'list-4',
      sectionId: '108',
      sectionName: '108',
      row: 'Row 22',
      seats: 'Seats 14-15',
      type: 'Verified Resale Ticket',
      price: Number((minPrice + priceSpan * 0.08).toFixed(2)),
      featured: false,
      viewImage: getListingImage(3),
    },
    {
      id: 'list-5',
      sectionId: '114',
      sectionName: '114',
      row: 'Row 20',
      seats: 'Seats 3-4',
      type: 'Verified Resale Ticket',
      price: Number((minPrice + priceSpan * 0.08).toFixed(2)),
      featured: false,
      viewImage: getListingImage(4),
    },
    {
      id: 'list-6',
      sectionId: '106',
      sectionName: '106',
      row: 'Row 15',
      seats: 'Seats 9-10',
      type: 'Verified Resale Ticket',
      price: Number((minPrice + priceSpan * 0.08).toFixed(2)),
      featured: false,
      viewImage: getListingImage(5),
    },
    {
      id: 'list-7',
      sectionId: '212',
      sectionName: '212',
      row: 'Row 8',
      seats: 'Seats 1-2',
      type: 'Standard Admission',
      price: Number(minPrice.toFixed(2)),
      featured: false,
      viewImage: getListingImage(6),
    },
    {
      id: 'list-8',
      sectionId: 'PIT',
      sectionName: 'PIT',
      row: 'Standing GA',
      seats: 'General Admission',
      type: 'Standard Admission',
      price: Number(maxPrice.toFixed(2)),
      featured: true,
      viewImage: getListingImage(7),
    },
    {
      id: 'list-9',
      sectionId: 'AAA',
      sectionName: 'AAA',
      row: 'Row 4',
      seats: 'Seats 3-4',
      type: 'Standard Admission',
      price: Number((minPrice + priceSpan * 0.65).toFixed(2)),
      featured: false,
      viewImage: getListingImage(8),
    },
  ];

  const sec212Seats = useMemo(() => generateSection212Seats(), []);

  const handleSelectListing = (listing: TicketListing) => {
    setSelectedListing(listing);
    setSelectedSection(listing.sectionId);

    // If selecting Sec 212 listing and no specific seats selected yet, auto-select Row 8 seats 1-2
    if (listing.sectionId === '212' && selectedSeatsData.length === 0) {
      const seat1 = sec212Seats.find((s) => s.row === 'Row 8' && s.seatNumber === 1);
      const seat2 = sec212Seats.find((s) => s.row === 'Row 8' && s.seatNumber === 2);
      const toSelect: CheckoutSeatItem[] = [];
      const toSelectIds: string[] = [];

      if (seat1 && !bookedSeatIds.includes(seat1.id)) {
        toSelect.push({
          id: seat1.id,
          sectionName: seat1.sectionName,
          row: seat1.row,
          seatNumber: seat1.seatNumber,
          price: seat1.price,
        });
        toSelectIds.push(seat1.id);
      }
      if (seat2 && !bookedSeatIds.includes(seat2.id)) {
        toSelect.push({
          id: seat2.id,
          sectionName: seat2.sectionName,
          row: seat2.row,
          seatNumber: seat2.seatNumber,
          price: seat2.price,
        });
        toSelectIds.push(seat2.id);
      }

      if (toSelect.length > 0) {
        setSelectedSeatsData(toSelect);
        setSelectedSeatIds(toSelectIds);
      }
    }

    setCheckoutOpen(true);
  };

  return (
    <div className="h-screen w-screen flex flex-col lg:flex-row bg-[#f8fafc] overflow-hidden select-none">
      {/* Left Pane: Interactive Stadium Seating Map (Expansive, fills most of the screen) */}
      <div className="flex-1 h-full overflow-hidden relative">
        <InteractiveSeatMap
          sections={SECTIONS}
          selectedSection={selectedSection}
          onSelectSection={(secId) => setSelectedSection(secId)}
          eventName={event.name}
          venueName={event.venue?.name}
          eventId={event.id}
          staticSeatmapUrl={event.seatmap?.staticUrl}
          panelCollapsed={panelCollapsed}
          onTogglePanel={() => setPanelCollapsed(!panelCollapsed)}
          selectedSeatIds={selectedSeatIds}
          onToggleSeat={handleToggleSeat}
          bookedSeatIds={bookedSeatIds}
          onCheckoutSelectedSeats={handleCheckoutSelectedSeats}
        />
      </div>

      {/* Right Pane: Ticket Selection Panel (Collapsible to give 100% space to map) */}
      <div
        className={`h-full shrink-0 transition-all duration-300 ease-in-out border-l border-slate-200 ${
          panelCollapsed
            ? 'w-0 opacity-0 overflow-hidden pointer-events-none'
            : 'w-full lg:w-[340px] xl:w-[360px] opacity-100'
        }`}
      >
        <TicketSelectionPanel
          listings={LISTINGS}
          selectedListing={selectedListing}
          onSelectListing={handleSelectListing}
          selectedSection={selectedSection}
          onClearSectionFilter={() => setSelectedSection(null)}
          ticketQuantity={selectedSeatIds.length > 0 ? selectedSeatIds.length : ticketQuantity}
          onQuantityChange={(qty) => setTicketQuantity(qty)}
          selectedSeatIds={selectedSeatIds}
          onToggleSeat={handleToggleSeat}
          bookedSeatIds={bookedSeatIds}
          sec212Seats={sec212Seats}
        />
      </div>

      {/* Checkout Drawer */}
      <CheckoutDrawer
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        listing={selectedListing}
        quantity={selectedSeatIds.length > 0 ? selectedSeatIds.length : ticketQuantity}
        event={event}
        selectedSeats={selectedSeatsData}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
