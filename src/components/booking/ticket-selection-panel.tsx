'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { SlidersHorizontal, ChevronDown, Check, CheckSquare, Square, Lock } from 'lucide-react';
import { SeatNode } from './interactive-seat-map';

export interface TicketListing {
  id: string;
  sectionId: string;
  sectionName: string;
  row: string;
  seats: string;
  type: 'Standard Admission' | 'Verified Resale Ticket' | 'VIP Package';
  price: number;
  featured?: boolean;
  viewImage: string;
}

interface TicketSelectionPanelProps {
  listings: TicketListing[];
  selectedListing: TicketListing | null;
  onSelectListing: (listing: TicketListing) => void;
  selectedSection: string | null;
  onClearSectionFilter: () => void;
  ticketQuantity: number;
  onQuantityChange: (qty: number) => void;
  selectedSeatIds?: string[];
  onToggleSeat?: (seat: SeatNode) => void;
  bookedSeatIds?: string[];
  sec212Seats?: SeatNode[];
}

export function TicketSelectionPanel({
  listings,
  selectedListing,
  onSelectListing,
  selectedSection,
  onClearSectionFilter,
  ticketQuantity,
  onQuantityChange,
  selectedSeatIds = [],
  onToggleSeat,
  bookedSeatIds = [],
  sec212Seats = [],
}: TicketSelectionPanelProps) {
  const [tab, setTab] = useState<'lowest' | 'best'>('lowest');
  const [minPrice, setMinPrice] = useState<number>(29);
  const [maxPrice, setMaxPrice] = useState<number>(154);
  const [qtyDropdownOpen, setQtyDropdownOpen] = useState(false);
  const [filterResaleOnly, setFilterResaleOnly] = useState(false);
  const [selectedRow212, setSelectedRow212] = useState<string>('All');

  // Filter listings by active section (if clicked on map) and price
  let filtered = listings.filter((item) => item.price >= minPrice && item.price <= maxPrice);

  if (selectedSection) {
    filtered = filtered.filter((item) => item.sectionId === selectedSection);
  }

  if (filterResaleOnly) {
    filtered = filtered.filter((item) => item.type === 'Verified Resale Ticket');
  }

  // Sort
  if (tab === 'lowest') {
    filtered.sort((a, b) => {
      // Prioritize FEATURED tickets at the top matching Ticketmaster screenshot
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.price - b.price;
    });
  } else {
    // Best seats: PIT / Floor DDD / AAA first, then 100 level
    const rank: Record<string, number> = { PIT: 1, DDD: 2, AAA: 3, BBB: 4, '120': 5, '124': 6, '108': 7 };
    filtered.sort((a, b) => (rank[a.sectionId] || 99) - (rank[b.sectionId] || 99));
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 shadow-sm overflow-hidden text-slate-900 select-none">
      {/* Top Bar: Quantity Dropdown & Filters Button */}
      <div className="p-3.5 space-y-3 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-2">
          {/* Ticket Quantity Dropdown */}
          <div className="relative">
            <button
              onClick={() => setQtyDropdownOpen(!qtyDropdownOpen)}
              className="flex items-center gap-6 px-3.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <span>{ticketQuantity} {ticketQuantity === 1 ? 'Ticket' : 'Tickets'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {qtyDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setQtyDropdownOpen(false)} />
                <div className="absolute left-0 mt-1 w-36 rounded-md bg-white border border-slate-200 shadow-xl p-1 z-40 text-xs space-y-0.5">
                  {[1, 2, 3, 4, 6, 8].map((qty) => (
                    <button
                      key={qty}
                      onClick={() => {
                        onQuantityChange(qty);
                        setQtyDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-3 py-1.5 rounded text-left font-medium ${
                        ticketQuantity === qty
                          ? 'bg-blue-600 text-white font-bold'
                          : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <span>{qty} {qty === 1 ? 'Ticket' : 'Tickets'}</span>
                      {ticketQuantity === qty && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Filters Button */}
          <button
            onClick={() => setFilterResaleOnly(!filterResaleOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors shadow-2xs ${
              filterResaleOnly
                ? 'bg-blue-50 border-blue-600 text-blue-600'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Dual Range Price Slider (Matching $29 - $154+) */}
        <div className="flex items-center gap-3 pt-1">
          <span className="text-xs font-bold text-slate-700 shrink-0">$29</span>
          <div className="relative flex-1 flex items-center">
            {/* Slider track line */}
            <div className="w-full h-1 bg-slate-900 rounded-full" />
            {/* Left Thumb */}
            <div className="absolute left-0 w-3.5 h-3.5 bg-white border-2 border-slate-900 rounded-full shadow-sm cursor-pointer" />
            {/* Right Thumb with Interactive Range Slider */}
            <input
              type="range"
              min="50"
              max="250"
              step="5"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
              title={`Max Price: $${maxPrice}`}
            />
            <div
              className="absolute w-3.5 h-3.5 bg-white border-2 border-slate-900 rounded-full shadow-sm pointer-events-none"
              style={{ left: `calc(${((maxPrice - 50) / 200) * 100}% - 7px)` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-700 shrink-0">${maxPrice}+</span>
        </div>

        {/* Active Section Filter Badge */}
        {selectedSection && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 px-3 py-1 rounded text-xs text-blue-700 font-bold">
            <span>Filtered by Sec {selectedSection}</span>
            <button onClick={onClearSectionFilter} className="underline hover:opacity-80">
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Tabs: LOWEST PRICE | BEST SEATS (Matching blue bottom border) */}
      <div className="grid grid-cols-2 text-xs font-bold tracking-wider text-center border-b border-slate-200 bg-white">
        <button
          onClick={() => setTab('lowest')}
          className={`py-3.5 transition-colors relative ${
            tab === 'lowest'
              ? 'text-slate-950 font-black'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>LOWEST PRICE</span>
          {tab === 'lowest' && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0052cc]" />
          )}
        </button>

        <button
          onClick={() => setTab('best')}
          className={`py-3.5 transition-colors relative ${
            tab === 'best'
              ? 'text-slate-950 font-black'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>BEST SEATS</span>
          {tab === 'best' && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0052cc]" />
          )}
        </button>
      </div>

      {/* We're All In Fee Notice (Matching Light Grey Strip in Screenshot) */}
      <div className="px-4 py-2 bg-[#f4f4f5] border-b border-slate-200 text-[11px] text-slate-600 font-medium">
        <span>We&apos;re All In: Prices include fees (before taxes).</span>
      </div>

      {/* PayPal Buy Now, Pay Later Banner (Matching blue underline) */}
      <div className="px-4 py-3 bg-white border-b-2 border-[#0052cc] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <span className="italic font-black text-blue-900">PayPal</span>
          <span className="text-[12px] font-bold text-slate-800">Buy Now, Pay Later</span>
        </div>
        <span className="text-[12px] text-[#0052cc] font-semibold cursor-pointer hover:underline">
          More Info
        </span>
      </div>

      {/* Ticket Listings Scroll Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
            <p>No seats found matching your price or section criteria.</p>
            <button
              onClick={() => {
                setMaxPrice(154);
                onClearSectionFilter();
                setFilterResaleOnly(false);
              }}
              className="text-[#0052cc] font-bold underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filtered.map((item) => {
            const isSelected = selectedListing?.id === item.id;

            return (
              <div
                key={item.id}
                onClick={() => onSelectListing(item)}
                className={`group p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all duration-150 hover:bg-blue-50/50 ${
                  isSelected ? 'bg-blue-50/90 border-l-4 border-l-[#0052cc]' : 'hover:border-l-4 hover:border-l-blue-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Section View Thumbnail (Live Ticketmaster Concert View) */}
                  <div className="relative w-14 h-10 rounded-md overflow-hidden shrink-0 bg-slate-900 border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform duration-150">
                    <Image
                      src={item.viewImage}
                      alt={`View from ${item.sectionName}`}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>

                  {/* Section & Ticket Details */}
                  <div className="min-w-0">
                    {item.featured ? (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-50 text-[#0052cc] border border-blue-200 mb-0.5">
                        FEATURED
                      </span>
                    ) : item.type === 'Verified Resale Ticket' ? (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 mb-0.5">
                        RESALE
                      </span>
                    ) : null}

                    <h4 className="font-extrabold text-[13px] text-slate-900 truncate group-hover:text-[#0052cc] transition-colors">
                      Sec {item.sectionName} • {item.row}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {item.type} • {item.seats}
                    </p>
                  </div>
                </div>

                {/* Price Display in Ticketmaster Blue */}
                <div className="text-right shrink-0">
                  <div className="font-extrabold text-[15px] text-[#0052cc] group-hover:scale-105 transition-transform">
                    ${item.price.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">ea / all-in</div>
                </div>
              </div>
            );
          })
        )}

        {/* Section 212 Interactive Ticket Checkboxes (212 Checkboxes) */}
        {selectedSection === '212' && sec212Seats.length > 0 && (
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  <span>Select Section 212 Tickets</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  {sec212Seats.length} ticket checkboxes available across 14 rows
                </p>
              </div>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                212 Tickets
              </span>
            </div>

            {/* Row Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              {['All', 'Row 8', 'Row 1', 'Row 2', 'Row 3', 'Row 4', 'Row 5', 'Row 6', 'Row 7', 'Row 9', 'Row 10', 'Row 11', 'Row 12', 'Row 13', 'Row 14'].map((row) => (
                <button
                  key={row}
                  onClick={() => setSelectedRow212(row)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedRow212 === row
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {row}
                </button>
              ))}
            </div>

            {/* Checkboxes List for Seats in Section 212 */}
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
              {sec212Seats
                .filter((s) => selectedRow212 === 'All' || s.row === selectedRow212)
                .map((seat) => {
                  const isChecked = selectedSeatIds.includes(seat.id);
                  const isBooked = bookedSeatIds.includes(seat.id);

                  return (
                    <div
                      key={seat.id}
                      onClick={() => {
                        if (!isBooked && onToggleSeat) onToggleSeat(seat);
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-all select-none ${
                        isBooked
                          ? 'bg-slate-100/90 border-slate-200 text-slate-400 cursor-not-allowed opacity-70'
                          : isChecked
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-xs cursor-pointer'
                          : 'bg-white border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Checkbox Icon */}
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                            isBooked
                              ? 'bg-slate-300 text-slate-600 border border-slate-400'
                              : isChecked
                              ? 'bg-emerald-500 text-white border border-emerald-600'
                              : 'border border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          {isBooked && <span className="text-[10px] font-bold leading-none">✕</span>}
                        </div>

                        <span className={`truncate text-xs ${isBooked ? 'line-through text-slate-400' : ''}`}>
                          {seat.row} • Seat {seat.seatNumber}
                        </span>

                        {seat.type === 'resale' && !isBooked && (
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 bg-rose-50 text-rose-600 border border-rose-200 rounded">
                            Resale
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isBooked ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                            Disabled / Paid
                          </span>
                        ) : (
                          <span className="font-extrabold text-[#0052cc]">
                            ${seat.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
