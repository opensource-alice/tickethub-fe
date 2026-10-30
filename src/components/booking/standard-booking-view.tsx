'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronLeft,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  Check,
  X,
  Ticket,
  Sparkles,
  Users,
  Info,
  CreditCard,
  Lock,
  ArrowRight,
  SlidersHorizontal,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { EventItem } from '@/types';
import { formatDate } from '@/lib/utils';
import { CheckoutDrawer, CheckoutSeatItem } from './checkout-drawer';
import { TicketListing } from './ticket-selection-panel';
import { toast } from 'sonner';

interface StandardBookingViewProps {
  event: EventItem;
}

export interface SeatInfo {
  id: string; // e.g. "VIP-RowA-3"
  tierId: 'vip' | 'prime' | 'standard';
  tierName: string;
  row: string;
  seatNumber: number;
  price: number;
}

export function StandardBookingView({ event }: StandardBookingViewProps) {
  const [activeTab, setActiveTab] = useState<'seats' | 'tiers'>('seats');
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<CheckoutSeatItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [tierQuantities, setTierQuantities] = useState<Record<string, number>>({
    ga: 0,
    vip_pass: 0,
    balcony: 0,
  });

  // Load and persist booked/paid seats per event (only actual user confirmed transactions)
  const [bookedSeatIds, setBookedSeatIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`booked_seats_${event.id}`);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  // Calculate dynamic pricing based on Ticketmaster price ranges
  const minPrice = event.priceRange?.min ?? 45.0;
  const maxPrice = event.priceRange?.max ?? 175.0;
  const priceDiff = Math.max(maxPrice - minPrice, 30);

  const vipPrice = Number(maxPrice.toFixed(2));
  const primePrice = Number((minPrice + priceDiff * 0.55).toFixed(2));
  const standardPrice = Number(minPrice.toFixed(2));
  const gaPrice = Number((minPrice * 0.85).toFixed(2));

  // Generate standard universal seating grid:
  // VIP (2 rows), Executive/Prime (3 rows), Standard (4 rows)
  const SECTIONS_CONFIG = useMemo(() => [
    {
      id: 'vip',
      name: 'VIP Front Row',
      badge: 'Best View • Premium Comfort',
      price: vipPrice,
      color: 'amber',
      rows: ['Row A', 'Row B'],
      seatsPerRow: 14, // 7 left, 7 right
    },
    {
      id: 'prime',
      name: 'Executive Prime',
      badge: 'Center Acoustics • Clear Sightline',
      price: primePrice,
      color: 'blue',
      rows: ['Row C', 'Row D', 'Row E'],
      seatsPerRow: 16, // 8 left, 8 right
    },
    {
      id: 'standard',
      name: 'Standard Reserved',
      badge: 'Great Value • Balanced Sound',
      price: standardPrice,
      color: 'slate',
      rows: ['Row F', 'Row G', 'Row H', 'Row J'],
      seatsPerRow: 18, // 9 left, 9 right
    },
  ], [vipPrice, primePrice, standardPrice]);

  // Flatten all available seats in this universal layout
  const allSeats: SeatInfo[] = useMemo(() => {
    const list: SeatInfo[] = [];
    SECTIONS_CONFIG.forEach((sec) => {
      sec.rows.forEach((row) => {
        for (let s = 1; s <= sec.seatsPerRow; s++) {
          list.push({
            id: `${sec.id.toUpperCase()}-${row.replace(/\s+/g, '')}-${s}`,
            tierId: sec.id as 'vip' | 'prime' | 'standard',
            tierName: sec.name,
            row,
            seatNumber: s,
            price: sec.price,
          });
        }
      });
    });
    return list;
  }, [SECTIONS_CONFIG]);

  // Toggle seat checkbox
  const handleToggleSeat = (seat: SeatInfo) => {
    if (bookedSeatIds.includes(seat.id)) {
      toast.error('Seat Unavailable', {
        description: `This seat (${seat.tierName}, ${seat.row}, Seat ${seat.seatNumber}) has been booked.`,
      });
      return;
    }

    if (selectedSeatIds.includes(seat.id)) {
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.id));
      setSelectedSeats((prev) => prev.filter((s) => s.id !== seat.id));
    } else {
      setSelectedSeatIds((prev) => [...prev, seat.id]);
      setSelectedSeats((prev) => [
        ...prev,
        {
          id: seat.id,
          sectionName: seat.tierName,
          row: seat.row,
          seatNumber: seat.seatNumber,
          price: seat.price,
        },
      ]);
    }
  };

  // Quick tier counter (+ / -)
  const handleUpdateTierQty = (tierKey: string, delta: number) => {
    setTierQuantities((prev) => {
      const current = prev[tierKey] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [tierKey]: next };
    });
  };

  // Total calculations
  const seatsSubtotal = selectedSeats.reduce((acc, s) => acc + s.price, 0);
  const tiersSubtotal =
    (tierQuantities.ga || 0) * gaPrice +
    (tierQuantities.vip_pass || 0) * (vipPrice + 25) +
    (tierQuantities.balcony || 0) * (standardPrice - 10);
  const totalTicketsCount =
    selectedSeats.length +
    (tierQuantities.ga || 0) +
    (tierQuantities.vip_pass || 0) +
    (tierQuantities.balcony || 0);

  const subtotal = seatsSubtotal + tiersSubtotal;
  const serviceFee = Number((subtotal * 0.12).toFixed(2));
  const facilityFee = totalTicketsCount > 0 ? Number((totalTicketsCount * 4.5).toFixed(2)) : 0;
  const tax = Number((subtotal * 0.08).toFixed(2));
  const grandTotal = Number((subtotal + serviceFee + facilityFee + tax).toFixed(2));

  // Payment completed
  const handlePaymentSuccess = (paidSeatIds: string[]) => {
    setBookedSeatIds((prev) => {
      const updated = Array.from(new Set([...prev, ...paidSeatIds]));
      if (typeof window !== 'undefined') {
        localStorage.setItem(`booked_seats_${event.id}`, JSON.stringify(updated));
      }
      return updated;
    });

    // Clear selection so the seats are now permanently disabled
    setSelectedSeatIds([]);
    setSelectedSeats([]);
    setTierQuantities({ ga: 0, vip_pass: 0, balcony: 0 });

    toast.success('Payment Confirmed! 🎉', {
      description: 'Your tickets have been reserved and barcodes generated.',
    });
  };

  // Synthesize listing for checkout drawer
  const checkoutListing: TicketListing = useMemo(() => {
    if (selectedSeats.length > 0) {
      const first = selectedSeats[0];
      return {
        id: `seat-booking-${Date.now()}`,
        sectionId: first.sectionName,
        sectionName: first.sectionName,
        row: first.row,
        seats: selectedSeats.map((s) => `Seat ${s.seatNumber}`).join(', '),
        type: 'Standard Admission',
        price: first.price,
        viewImage: event.images?.[0]?.url || event.imageUrl,
      };
    }
    return {
      id: `pass-booking-${Date.now()}`,
      sectionId: 'General Admission',
      sectionName: 'General Admission',
      row: 'GA Floor',
      seats: `Quantity: ${totalTicketsCount}`,
      type: 'Standard Admission',
      price: subtotal / Math.max(1, totalTicketsCount),
      viewImage: event.images?.[0]?.url || event.imageUrl,
    };
  }, [selectedSeats, totalTicketsCount, subtotal, event]);

  const dateInfo = formatDate(event.dates.localDate, event.dates.localTime);
  const heroImage = event.images?.[0]?.url || event.imageUrl;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans select-none">
      {/* ── Top Event Header Bar ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/events/${event.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all hover:scale-105 shrink-0 shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
              <span>Event Details</span>
            </Link>

            {/* Event Info Pill */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200 hidden sm:block">
                <Image src={heroImage} alt={event.name} fill className="object-cover" unoptimized />
              </div>
              <div className="min-w-0">
                <h1 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                  {event.name}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    {dateInfo.fullDisplay}
                  </span>
                  {event.venue?.name && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 truncate hidden md:inline">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {event.venue.name} {event.city ? `(${event.city})` : ''}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Status Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Official Tickets</span>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Tickets From</div>
              <div className="text-sm font-black text-blue-600">${minPrice.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Layout: Seating / Tier View (Left) & Order Summary (Right) ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Universal Booking Interface (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          {/* Booking View Selector: Interactive Seating vs Quick Passes */}
          <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('seats')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'seats'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Interactive Seat Layout</span>
              </button>
              <button
                onClick={() => setActiveTab('tiers')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'tiers'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Ticket className="w-4 h-4" />
                <span>Ticket Tiers & Passes</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500 px-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Real-Time Seat Availability</span>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TAB 1: INTERACTIVE UNIVERSAL SEAT LAYOUT (CHECKBOXES)       */}
          {activeTab === 'seats' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col space-y-6">
              {/* Official Ticketmaster Venue Seating Map Banner */}
              {event.seatmap?.staticUrl && (
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                        Official {event.venue?.name || 'Venue'} Seating Chart
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Live Ticketmaster verified seat map & venue geometry
                      </p>
                    </div>
                  </div>
                  <a
                    href={event.seatmap.staticUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shrink-0 flex items-center gap-1 shadow-sm"
                  >
                    <span>View Seating Map</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Legend & Help Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 text-xs">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <div className="w-4 h-4 rounded-md border-2 border-slate-300 bg-white" />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <div className="w-4 h-4 rounded-md bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-400">
                    <div className="w-4 h-4 rounded-md bg-slate-200 text-slate-500 flex items-center justify-center text-[11px] font-bold">
                      ✕
                    </div>
                    <span>Sold / Disabled</span>
                  </div>
                </div>

                <div className="text-slate-500 text-[11px] flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  <span>Click any seat checkbox to select or deselect</span>
                </div>
              </div>

              {/* ── Universal Stage Representation ── */}
              <div className="w-full flex flex-col items-center">
                <div className="relative w-full max-w-lg flex flex-col items-center">
                  {/* Spotlight Beam Effect */}
                  <div className="w-full h-8 bg-gradient-to-b from-blue-500/10 to-transparent blur-md pointer-events-none" />

                  {/* Stage Deck */}
                  <div className="w-full py-3 px-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white text-center rounded-2xl shadow-md border border-slate-700 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-2 font-black text-xs tracking-widest uppercase text-blue-300">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>STAGE / PERFORMANCE AREA</span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                      All eyes & sound oriented forward
                    </span>
                  </div>

                  {/* Curving glow floor line */}
                  <div className="w-3/4 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full -mt-0.5 shadow-sm shadow-blue-500/50" />
                </div>
              </div>

              {/* ── Universal Seating Blocks ── */}
              <div className="space-y-8 pt-4 overflow-x-auto pb-4 scrollbar-thin">
                {SECTIONS_CONFIG.map((section) => (
                  <div key={section.id} className="space-y-3 min-w-[580px]">
                    {/* Section Header */}
                    <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">
                          {section.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200 shadow-2xs">
                          {section.badge}
                        </span>
                      </div>
                      <div className="font-black text-xs text-blue-600">
                        ${section.price.toFixed(2)}{' '}
                        <span className="text-[10px] text-slate-400 font-medium">ea</span>
                      </div>
                    </div>

                    {/* Rows in this section */}
                    <div className="space-y-2">
                      {section.rows.map((rowName) => {
                        const halfCount = Math.floor(section.seatsPerRow / 2);
                        const leftSeats = allSeats.filter(
                          (s) =>
                            s.tierId === section.id &&
                            s.row === rowName &&
                            s.seatNumber <= halfCount
                        );
                        const rightSeats = allSeats.filter(
                          (s) =>
                            s.tierId === section.id &&
                            s.row === rowName &&
                            s.seatNumber > halfCount
                        );

                        return (
                          <div key={rowName} className="flex items-center justify-center gap-2">
                            {/* Row Label (Left) */}
                            <span className="w-12 text-[11px] font-extrabold text-slate-400 text-right shrink-0">
                              {rowName}
                            </span>

                            {/* Left Aisle Group */}
                            <div className="flex items-center gap-1.5">
                              {leftSeats.map((seat) => {
                                const isSelected = selectedSeatIds.includes(seat.id);
                                const isBooked = bookedSeatIds.includes(seat.id);

                                return (
                                  <button
                                    key={seat.id}
                                    onClick={() => handleToggleSeat(seat)}
                                    disabled={isBooked}
                                    title={`${section.name} • ${seat.row} • Seat ${seat.seatNumber} ($${seat.price.toFixed(2)}) ${
                                      isBooked ? '- Booked' : isSelected ? '- Selected' : '- Available'
                                    }`}
                                    className={`w-7 h-7 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all duration-150 relative ${
                                      isBooked
                                        ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60'
                                        : isSelected
                                        ? 'bg-emerald-500 text-white border-2 border-emerald-600 shadow-md shadow-emerald-500/30 scale-110 z-10'
                                        : section.id === 'vip'
                                        ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 hover:border-amber-400 hover:scale-110 shadow-2xs'
                                        : section.id === 'prime'
                                        ? 'bg-blue-50 text-blue-900 border border-blue-300 hover:bg-blue-100 hover:border-blue-400 hover:scale-110 shadow-2xs'
                                        : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 hover:border-slate-400 hover:scale-110 shadow-2xs'
                                    }`}
                                  >
                                    {isBooked ? (
                                      <span>✕</span>
                                    ) : isSelected ? (
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    ) : (
                                      <span>{seat.seatNumber}</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Center Aisle Walkway */}
                            <div className="w-8 flex items-center justify-center">
                              <span className="text-[9px] uppercase font-bold text-slate-300 tracking-wider">
                                AISLE
                              </span>
                            </div>

                            {/* Right Aisle Group */}
                            <div className="flex items-center gap-1.5">
                              {rightSeats.map((seat) => {
                                const isSelected = selectedSeatIds.includes(seat.id);
                                const isBooked = bookedSeatIds.includes(seat.id);

                                return (
                                  <button
                                    key={seat.id}
                                    onClick={() => handleToggleSeat(seat)}
                                    disabled={isBooked}
                                    title={`${section.name} • ${seat.row} • Seat ${seat.seatNumber} ($${seat.price.toFixed(2)}) ${
                                      isBooked ? '- Booked' : isSelected ? '- Selected' : '- Available'
                                    }`}
                                    className={`w-7 h-7 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all duration-150 relative ${
                                      isBooked
                                        ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60'
                                        : isSelected
                                        ? 'bg-emerald-500 text-white border-2 border-emerald-600 shadow-md shadow-emerald-500/30 scale-110 z-10'
                                        : section.id === 'vip'
                                        ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 hover:border-amber-400 hover:scale-110 shadow-2xs'
                                        : section.id === 'prime'
                                        ? 'bg-blue-50 text-blue-900 border border-blue-300 hover:bg-blue-100 hover:border-blue-400 hover:scale-110 shadow-2xs'
                                        : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 hover:border-slate-400 hover:scale-110 shadow-2xs'
                                    }`}
                                  >
                                    {isBooked ? (
                                      <span>✕</span>
                                    ) : isSelected ? (
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    ) : (
                                      <span>{seat.seatNumber}</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Row Label (Right) */}
                            <span className="w-12 text-[11px] font-extrabold text-slate-400 text-left shrink-0">
                              {rowName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TAB 2: TICKET TIERS & CATEGORY PASSES                       */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'tiers' && (
            <div className="space-y-4">
              {/* VIP All Access Pass */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900">VIP All-Access Pass</span>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      VIP Lounge Included
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Priority front-row stage standing, express VIP entrance, exclusive commemorative tour badge & 1 complimentary beverage.
                  </p>
                  <div className="text-xs font-bold text-amber-700">
                    ${(vipPrice + 25).toFixed(2)} per ticket
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleUpdateTierQty('vip_pass', -1)}
                    disabled={(tierQuantities.vip_pass || 0) <= 0}
                    className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-black text-sm text-slate-900">
                    {tierQuantities.vip_pass || 0}
                  </span>
                  <button
                    onClick={() => handleUpdateTierQty('vip_pass', 1)}
                    className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* General Admission Floor Pass */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900">General Admission (GA Floor)</span>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      Standing Area
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Main floor open standing admission with immersive concert energy and close proximity to the stage.
                  </p>
                  <div className="text-xs font-bold text-blue-700">
                    ${gaPrice.toFixed(2)} per ticket
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleUpdateTierQty('ga', -1)}
                    disabled={(tierQuantities.ga || 0) <= 0}
                    className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-black text-sm text-slate-900">
                    {tierQuantities.ga || 0}
                  </span>
                  <button
                    onClick={() => handleUpdateTierQty('ga', 1)}
                    className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Balcony / Upper Level Pass */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900">Balcony Reserved Pass</span>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      Elevated Sightline
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Comfortable elevated balcony overview with panoramic views of the entire stage and production.
                  </p>
                  <div className="text-xs font-bold text-slate-700">
                    ${Math.max(25, standardPrice - 10).toFixed(2)} per ticket
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleUpdateTierQty('balcony', -1)}
                    disabled={(tierQuantities.balcony || 0) <= 0}
                    className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-black text-sm text-slate-900">
                    {tierQuantities.balcony || 0}
                  </span>
                  <button
                    onClick={() => handleUpdateTierQty('balcony', 1)}
                    className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column: Order Summary & Checkout Card (4 cols) ── */}
        <div className="lg:col-span-4">
          <div className="sticky top-20 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Order Summary</h3>
                <p className="text-xs text-slate-500">
                  {totalTicketsCount} {totalTicketsCount === 1 ? 'ticket' : 'tickets'} selected
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                <Ticket className="w-4 h-4" />
              </div>
            </div>

            {/* Selected Seats List */}
            {selectedSeats.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700">Selected Seats:</div>
                <div className="max-h-44 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {selectedSeats.map((seat) => (
                    <div
                      key={seat.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-800">
                          {seat.sectionName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {seat.row} • Seat {seat.seatNumber}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-blue-600">${seat.price.toFixed(2)}</span>
                        <button
                          onClick={() => {
                            const found = allSeats.find((s) => s.id === seat.id);
                            if (found) handleToggleSeat(found);
                          }}
                          className="w-5 h-5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tier Passes List */}
            {(tierQuantities.ga > 0 || tierQuantities.vip_pass > 0 || tierQuantities.balcony > 0) && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700">Selected Passes:</div>
                {tierQuantities.vip_pass > 0 && (
                  <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="font-bold text-amber-900">
                      {tierQuantities.vip_pass}x VIP All-Access Pass
                    </span>
                    <span className="font-black text-amber-700">
                      ${((vipPrice + 25) * tierQuantities.vip_pass).toFixed(2)}
                    </span>
                  </div>
                )}
                {tierQuantities.ga > 0 && (
                  <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-blue-50 border border-blue-200">
                    <span className="font-bold text-blue-900">
                      {tierQuantities.ga}x GA Floor Standing
                    </span>
                    <span className="font-black text-blue-700">
                      ${(gaPrice * tierQuantities.ga).toFixed(2)}
                    </span>
                  </div>
                )}
                {tierQuantities.balcony > 0 && (
                  <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-800">
                      {tierQuantities.balcony}x Balcony Pass
                    </span>
                    <span className="font-black text-slate-700">
                      ${(Math.max(25, standardPrice - 10) * tierQuantities.balcony).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {totalTicketsCount === 0 && (
              <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                <Ticket className="w-8 h-8 text-slate-300 mx-auto stroke-1" />
                <p>No seats or passes selected yet.</p>
                <p className="text-[11px] text-slate-400">Click on any seat checkbox to start booking.</p>
              </div>
            )}

            {/* Price Breakdown */}
            <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Tickets Subtotal</span>
                <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Service Fee (12%)</span>
                <span className="font-semibold text-slate-900">${serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Facility & Processing Fee</span>
                <span className="font-semibold text-slate-900">${facilityFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Taxes</span>
                <span className="font-semibold text-slate-900">${tax.toFixed(2)}</span>
              </div>

              <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                <div>
                  <div className="font-black text-base text-slate-900">Total Price</div>
                  <div className="text-[10px] text-slate-400">All fees included</div>
                </div>
                <div className="font-black text-xl text-blue-600">${grandTotal.toFixed(2)}</div>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={() => setCheckoutOpen(true)}
              disabled={totalTicketsCount === 0}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-extrabold text-sm transition-all shadow-md shadow-blue-600/25 disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Continue to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Security Guarantee Strip */}
            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Verified Official Tickets • Secure 256-bit SSL</span>
            </div>
          </div>
        </div>
      </main>

      {/* ── Checkout Drawer Integration ── */}
      <CheckoutDrawer
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        listing={checkoutListing}
        quantity={totalTicketsCount}
        event={event}
        selectedSeats={selectedSeats}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
