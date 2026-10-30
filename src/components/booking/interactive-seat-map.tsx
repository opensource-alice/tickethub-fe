'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Home,
  Plus,
  Minus,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Check,
  Lock,
  Layers,
  X,
  CreditCard,
  CheckSquare,
  Square,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export interface SectionData {
  id: string;
  name: string;
  level: 'Pit' | 'Floor' | 'Lower' | 'Club' | 'Upper';
  available: boolean;
  price: number;
  featured?: boolean;
  ticketsCount: number;
  viewAngle: string;
}

export interface SeatNode {
  id: string; // e.g. 'DDD-14-5'
  sectionId: string;
  sectionName: string;
  row: string;
  seatNumber: number;
  price: number;
  type: 'standard' | 'resale';
  x: number;
  y: number;
}

interface InteractiveSeatMapProps {
  sections: SectionData[];
  selectedSection: string | null;
  onSelectSection: (sectionId: string | null) => void;
  eventName?: string;
  venueName?: string;
  eventId?: string;
  staticSeatmapUrl?: string;
  panelCollapsed?: boolean;
  onTogglePanel?: () => void;
  // Seat Checkbox Selection State
  selectedSeatIds: string[];
  onToggleSeat: (seat: SeatNode) => void;
  bookedSeatIds: string[]; // <-- PAID/BOOKED SEATS: TURNED NON-CLICKABLE!
  onCheckoutSelectedSeats?: () => void;
}

// Helper to generate precise elliptical arc wedge paths
function makeArcWedge(
  cx: number,
  cy: number,
  rxOut: number,
  ryOut: number,
  rxIn: number,
  ryIn: number,
  startDeg: number,
  endDeg: number,
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const a1 = toRad(startDeg);
  const a2 = toRad(endDeg);

  const xO1 = cx + rxOut * Math.cos(a1);
  const yO1 = cy + ryOut * Math.sin(a1);
  const xO2 = cx + rxOut * Math.cos(a2);
  const yO2 = cy + ryOut * Math.sin(a2);

  const xI1 = cx + rxIn * Math.cos(a1);
  const yI1 = cy + ryIn * Math.sin(a1);
  const xI2 = cx + rxIn * Math.cos(a2);
  const yI2 = cy + ryIn * Math.sin(a2);

  const midDeg = (startDeg + endDeg) / 2;
  const midA = toRad(midDeg);
  const midRx = (rxOut + rxIn) / 2;
  const midRy = (ryOut + ryIn) / 2;
  const textX = cx + midRx * Math.cos(midA);
  const textY = cy + midRy * Math.sin(midA) + 4;

  const path = `M ${xO1.toFixed(1)} ${yO1.toFixed(1)} A ${rxOut} ${ryOut} 0 0 1 ${xO2.toFixed(1)} ${yO2.toFixed(1)} L ${xI2.toFixed(1)} ${yI2.toFixed(1)} A ${rxIn} ${ryIn} 0 0 0 ${xI1.toFixed(1)} ${yI1.toFixed(1)} Z`;

  return { path, textX, textY };
}

// Helper to generate exactly 212 seat checkboxes for Section 212
export function generateSection212Seats(cx = 450, cy = 375): SeatNode[] {
  const nodes: SeatNode[] = [];
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const sec212StartDeg = 126.5;
  const sec212EndDeg = 143.5;
  const totalSec212Rows = 14;

  for (let r = 1; r <= totalSec212Rows; r++) {
    // 13 rows with 15 seats (195) + 1 row with 17 seats (17) = exactly 212 seats!
    const seatsInRow = r === totalSec212Rows ? 17 : 15;
    const rowFrac = (r - 0.5) / totalSec212Rows;
    const radiusX = 308 + rowFrac * 43;
    const radiusY = 238 + rowFrac * 33;

    for (let s = 1; s <= seatsInRow; s++) {
      const degFrac = (s - 0.5) / seatsInRow;
      const deg = sec212StartDeg + degFrac * (sec212EndDeg - sec212StartDeg);
      const rad = toRad(deg);
      nodes.push({
        id: `212-Row${r}-${s}`,
        sectionId: '212',
        sectionName: '212',
        row: `Row ${r}`,
        seatNumber: s,
        price: 45.0,
        type: (r === 8 && (s === 1 || s === 2)) ? 'standard' : s % 4 === 0 ? 'resale' : 'standard',
        x: cx + radiusX * Math.cos(rad),
        y: cy + radiusY * Math.sin(rad),
      });
    }
  }
  return nodes;
}

export function InteractiveSeatMap({
  sections,
  selectedSection,
  onSelectSection,
  eventName,
  venueName,
  eventId,
  staticSeatmapUrl,
  panelCollapsed = false,
  onTogglePanel,
  selectedSeatIds = [],
  onToggleSeat,
  bookedSeatIds = [],
  onCheckoutSelectedSeats,
}: InteractiveSeatMapProps) {
  const [zoom, setZoom] = useState(1.05);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredSection, setHoveredSection] = useState<SectionData | null>(null);
  const [hoveredSeat, setHoveredSeat] = useState<SeatNode | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [showVenueModal, setShowVenueModal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const getSection = (id: string) => sections.find((s) => s.id === id);

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(Math.max(Number((prev + delta).toFixed(2)), 0.8), 3.0));
  };

  const resetView = () => {
    setZoom(1.05);
    setPan({ x: 0, y: 0 });
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom((prev) => Math.min(Math.max(Number((prev + zoomFactor).toFixed(2)), 0.8), 3.0));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // Smoothly zoom in to Section 212 when selected so all 212 seat checkboxes are clearly visible and interactive
  useEffect(() => {
    if (selectedSection === '212') {
      setZoom(2.2);
      setPan({ x: 380, y: -260 });
    } else if (selectedSection === null) {
      setZoom(1.05);
      setPan({ x: 0, y: 0 });
    }
  }, [selectedSection]);

  const cx = 450;
  const cy = 375;

  // Generate realistic seat nodes across the stadium (Floor DDD, FFF, AAA, BBB, CCC, and Lower 120/108)
  const SEAT_NODES: SeatNode[] = useMemo(() => {
    const nodes: SeatNode[] = [];

    // Helper to generate a rectangular floor grid of seats
    const addFloorGrid = (
      secId: string,
      secName: string,
      startX: number,
      startY: number,
      rows: string[],
      cols: number,
      spacingX: number,
      spacingY: number,
      price: number,
      typeDistribution: (rIdx: number, cIdx: number) => 'standard' | 'resale',
    ) => {
      rows.forEach((row, rIdx) => {
        for (let c = 1; c <= cols; c++) {
          nodes.push({
            id: `${secId}-${row.replace(/\s+/g, '')}-${c}`,
            sectionId: secId,
            sectionName: secName,
            row,
            seatNumber: c,
            price,
            type: typeDistribution(rIdx, c),
            x: startX + (c - 1) * spacingX,
            y: startY + rIdx * spacingY,
          });
        }
      });
    };

    // 1. Floor DDD (Top Floor Block)
    addFloorGrid(
      'DDD',
      'DDD',
      336,
      318,
      ['Row 14', 'Row 15', 'Row 16', 'Row 17'],
      9,
      13,
      8,
      65.55,
      (r, c) => (c % 4 === 0 ? 'resale' : 'standard'),
    );

    // 2. Floor FFF (Bottom Floor Block)
    addFloorGrid(
      'FFF',
      'FFF',
      336,
      418,
      ['Row 18', 'Row 19', 'Row 20'],
      9,
      13,
      8,
      75.0,
      (r, c) => (c % 5 === 0 ? 'resale' : 'standard'),
    );

    // 3. Floor AAA (Front Stage Left)
    addFloorGrid(
      'AAA',
      'AAA',
      468,
      316,
      ['Row 1', 'Row 2', 'Row 3', 'Row 4'],
      3,
      7.5,
      8,
      125.0,
      () => 'standard',
    );

    // 4. Floor BBB (Front Stage Center)
    addFloorGrid(
      'BBB',
      'BBB',
      468,
      358,
      ['Row 1', 'Row 2', 'Row 3', 'Row 4'],
      3,
      7.5,
      8,
      110.0,
      () => 'standard',
    );

    // 5. Floor CCC (Front Stage Right)
    addFloorGrid(
      'CCC',
      'CCC',
      468,
      404,
      ['Row 1', 'Row 2', 'Row 3', 'Row 4'],
      3,
      7.5,
      8,
      110.0,
      () => 'standard',
    );

    // 6. Floor EEE (Center Floor Block)
    addFloorGrid(
      'EEE',
      'EEE',
      410,
      358,
      ['Row 1', 'Row 2', 'Row 3'],
      4,
      11,
      10,
      95.0,
      (r, c) => (c === 2 ? 'resale' : 'standard'),
    );

    // 7. Lower Bowl 120 (Top Stage-Side Arc)
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    for (let r = 0; r < 3; r++) {
      const radiusX = 282 - r * 14;
      const radiusY = 218 - r * 12;
      for (let s = 1; s <= 7; s++) {
        const deg = -58 + (s - 1) * 5;
        const rad = toRad(deg);
        nodes.push({
          id: `120-Row${r + 7}-${s}`,
          sectionId: '120',
          sectionName: '120',
          row: `Row ${r + 7}`,
          seatNumber: s,
          price: 65.55,
          type: s % 3 === 0 ? 'resale' : 'standard',
          x: cx + radiusX * Math.cos(rad),
          y: cy + radiusY * Math.sin(rad),
        });
      }
    }

    // 8. Lower Bowl 108 (Bottom Stage-Side Arc)
    for (let r = 0; r < 3; r++) {
      const radiusX = 282 - r * 14;
      const radiusY = 218 - r * 12;
      for (let s = 1; s <= 7; s++) {
        const deg = 62 + (s - 1) * 5;
        const rad = toRad(deg);
        nodes.push({
          id: `108-Row${r + 20}-${s}`,
          sectionId: '108',
          sectionName: '108',
          row: `Row ${r + 20}`,
          seatNumber: s,
          price: 51.75,
          type: s % 2 === 0 ? 'resale' : 'standard',
          x: cx + radiusX * Math.cos(rad),
          y: cy + radiusY * Math.sin(rad),
        });
      }
    }

    // 9. Lower Bowl 114 (Bottom Left Arc)
    for (let r = 0; r < 2; r++) {
      const radiusX = 278 - r * 14;
      const radiusY = 214 - r * 12;
      for (let s = 1; s <= 5; s++) {
        const deg = 5 + (s - 1) * 6;
        const rad = toRad(deg);
        nodes.push({
          id: `114-Row${r + 19}-${s}`,
          sectionId: '114',
          sectionName: '114',
          row: `Row ${r + 19}`,
          seatNumber: s,
          price: 51.75,
          type: 'resale',
          x: cx + radiusX * Math.cos(rad),
          y: cy + radiusY * Math.sin(rad),
        });
      }
    }

    // 10. Club Section 212 (Exact 212 seat checkboxes)
    nodes.push(...generateSection212Seats(cx, cy));

    return nodes;
  }, [cx, cy]);

  // Compute selected seats summary
  const selectedSeatsList = useMemo(() => {
    return SEAT_NODES.filter((seat) => selectedSeatIds.includes(seat.id));
  }, [SEAT_NODES, selectedSeatIds]);

  const selectedSeatsTotal = useMemo(() => {
    return selectedSeatsList.reduce((acc, seat) => acc + seat.price, 0);
  }, [selectedSeatsList]);

  // Section Ring Definitions
  const LEVEL_300 = [
    { id: '350', start: -36, end: -26 },
    { id: '348', start: -46, end: -36 },
    { id: '346', start: -56, end: -46 },
    { id: '344', start: -66, end: -56 },
    { id: '342', start: -78, end: -66 },
    { id: '340', start: -90, end: -78 },
    { id: '338', start: -102, end: -90 },
    { id: '336', start: -114, end: -102 },
    { id: '334', start: -124, end: -114 },
    { id: '332', start: -134, end: -124 },
    { id: '330', start: -144, end: -134 },
    { id: '328', start: -154, end: -144 },
    { id: '326', start: -166, end: -154 },
    { id: '324', start: -178, end: -166 },
    { id: '322', start: 170, end: 182 },
    { id: '320', start: 158, end: 170 },
    { id: '318', start: 146, end: 158 },
    { id: '316', start: 134, end: 146 },
    { id: '314', start: 122, end: 134 },
    { id: '312', start: 110, end: 122 },
    { id: '310', start: 98, end: 110 },
    { id: '308', start: 86, end: 98 },
    { id: '306', start: 74, end: 86 },
    { id: '304', start: 62, end: 74 },
    { id: '302', start: 50, end: 62 },
    { id: '380', start: 40, end: 50 },
    { id: '378', start: 30, end: 40 },
    { id: '376', start: 20, end: 30 },
    { id: '374', start: 10, end: 20 },
    { id: '372', start: 0, end: 10 },
    { id: '370', start: -10, end: 0 },
    { id: '368', start: -18, end: -10 },
    { id: '366', start: -26, end: -18 },
  ];

  const LEVEL_200 = [
    { id: '222', start: -135, end: -115, isBlue: false },
    { id: '220', start: -155, end: -135, isBlue: false },
    { id: '218', start: -175, end: -155, isBlue: false },
    { id: '216', start: 165, end: 185, isBlue: false },
    { id: '214', start: 145, end: 165, isBlue: false },
    { id: '212', start: 125, end: 145, isBlue: true },
    { id: '210', start: 105, end: 125, isBlue: false },
    { id: '208', start: 85, end: 105, isBlue: false },
    { id: '206', start: 65, end: 85, isBlue: false },
    { id: '256', start: 45, end: 65, isBlue: false },
    { id: '254', start: 25, end: 45, isBlue: false },
    { id: '252', start: 5, end: 25, isBlue: false },
    { id: '250', start: -15, end: 5, isBlue: false },
    { id: '248', start: -35, end: -15, isBlue: false },
    { id: '246', start: -55, end: -35, isBlue: false },
    { id: '244', start: -75, end: -55, isBlue: false },
    { id: '242', start: -95, end: -75, isBlue: false },
    { id: '240', start: -115, end: -95, isBlue: false },
  ];

  const LEVEL_100 = [
    { id: '128', start: -140, end: -120, isBlue: true },
    { id: '126', start: -120, end: -100, isBlue: true },
    { id: '124', start: -100, end: -80, isBlue: true },
    { id: '122', start: -80, end: -60, isBlue: true },
    { id: '120', start: -60, end: -40, isBlue: true },
    { id: '118', start: -40, end: -20, isBlue: true },
    { id: '116', start: -20, end: 0, isBlue: true },
    { id: '114', start: 0, end: 20, isBlue: true },
    { id: '112', start: 20, end: 40, isBlue: true },
    { id: '110', start: 40, end: 60, isBlue: true },
    { id: '108', start: 60, end: 80, isBlue: true },
    { id: '106', start: 80, end: 100, isBlue: true },
    { id: '104', start: 100, end: 120, isBlue: true },
    { id: '102', start: 120, end: 140, isBlue: true },
    { id: '148', start: 140, end: 160, isBlue: true },
    { id: '146', start: 160, end: 180, isBlue: true },
    { id: '130', start: -160, end: -140, isBlue: false },
    { id: '132', start: -180, end: -160, isBlue: false },
    { id: '134', start: 160, end: 180, isBlue: false },
    { id: '136', start: 140, end: 160, isBlue: false },
    { id: '144', start: 18, end: 38, isBlue: false },
    { id: '142', start: -2, end: 18, isBlue: false },
    { id: '140', start: -20, end: -2, isBlue: false },
    { id: '138', start: -38, end: -20, isBlue: false },
  ];

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative w-full h-full bg-[#f8fafc] flex flex-col justify-between overflow-hidden select-none cursor-grab active:cursor-grabbing"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 50%, #ffffff 0%, #f1f5f9 60%, #e2e8f0 100%)`,
      }}
    >
      {/* Background Architectural Stadium Rings Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* Top Floating Glass HUD: Event Info & Navigation Pill */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2 max-w-[calc(100%-240px)]">
        {eventId && (
          <Link
            href={`/events/${eventId}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 hover:bg-white border border-slate-300 text-xs font-bold text-slate-800 shadow-md backdrop-blur-md transition-all hover:scale-105 shrink-0"
            title="Return to Event Overview"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Event</span>
          </Link>
        )}

        {selectedSection && (
          <button
            onClick={() => {
              onSelectSection(null);
              resetView();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all hover:scale-105 shrink-0"
            title="Return to full arena overview"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>All Sections</span>
          </button>
        )}

        {/* Event Context Pill */}
        {(eventName || venueName) && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-slate-200/90 shadow-md backdrop-blur-md text-xs truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-extrabold text-slate-900 truncate max-w-[180px] sm:max-w-xs md:max-w-md">
              {eventName || 'Live Concert Experience'}
            </span>
            {venueName && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 truncate hidden md:inline flex items-center gap-1">
                  <MapPin className="w-3 h-3 inline text-slate-400" />
                  {venueName}
                </span>
              </>
            )}
          </div>
        )}

        {/* Official Ticketmaster Venue Map Modal Trigger */}
        {staticSeatmapUrl && (
          <button
            onClick={() => setShowVenueModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-[#0052cc] border border-blue-200 text-xs font-bold shadow-sm backdrop-blur-xs transition-colors shrink-0"
            title="View Official Venue Static Seating Diagram"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Venue Chart</span>
          </button>
        )}
      </div>

      {/* Top Right Mini-Map & Zoom Controls (Matching User Screenshot) */}
      <div className="absolute top-4 right-4 z-30 flex items-start gap-2.5">
        {/* Arena Mini-Map Thumbnail Box */}
        <div className="hidden sm:block w-28 h-20 bg-white/90 rounded-lg border border-slate-300 shadow-md backdrop-blur-xs overflow-hidden relative p-1 pointer-events-none">
          <svg viewBox="20 40 860 670" className="w-full h-full opacity-80">
            <ellipse cx="450" cy="375" rx="412" ry="322" fill="#cfd4da" stroke="#ffffff" strokeWidth="2" />
            <ellipse cx="450" cy="375" rx="305" ry="235" fill="#6889e2" stroke="#ffffff" strokeWidth="2" />
            <rect x="260" y="275" width="385" height="200" rx="45" fill="#ffffff" />
            <rect x="565" y="312" width="72" height="126" rx="3" fill="#18181b" />
            <path d="M 495 312 L 565 312 L 565 360 L 525 360 L 525 390 L 565 390 L 565 438 L 495 438 Z" fill="#2055e8" />
          </svg>
          {/* Viewport Frame */}
          <div
            className="absolute border-2 border-blue-600 bg-blue-500/10 rounded-xs pointer-events-none"
            style={{
              width: `${Math.max(25, 100 / zoom)}%`,
              height: `${Math.max(25, 100 / zoom)}%`,
              left: `${Math.max(0, Math.min(65, 45 - (pan.x / 10)))}%`,
              top: `${Math.max(0, Math.min(65, 40 - (pan.y / 10)))}%`,
            }}
          />
        </div>

        {/* Zoom & Toggle Buttons */}
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-col gap-1 bg-white/95 p-1 rounded-lg border border-slate-300/80 shadow-md backdrop-blur-xs">
            <button
              onClick={resetView}
              className="w-8 h-8 rounded-md flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"
              title="Reset View"
            >
              <Home className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(0.25)}
              className="w-8 h-8 rounded-md flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"
              title="Zoom In"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(-0.25)}
              className="w-8 h-8 rounded-md flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"
              title="Zoom Out"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {onTogglePanel && (
            <button
              onClick={onTogglePanel}
              className="w-8 h-8 rounded-lg bg-white/95 border border-slate-300/80 shadow-md flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"
              title={panelCollapsed ? 'Show Tickets Panel' : 'Expand Map (Hide Tickets)'}
            >
              {panelCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Floating Interactive Seat Checkbox Tooltip */}
      {hoveredSeat && (
        <div className="absolute top-20 left-6 z-30 bg-slate-900/95 text-white px-3.5 py-2.5 rounded-xl shadow-2xl border border-slate-700 text-xs pointer-events-none backdrop-blur-md animate-in fade-in duration-100 max-w-xs">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-extrabold text-sm text-white">
              Sec {hoveredSeat.sectionName} • {hoveredSeat.row}
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                hoveredSeat.type === 'resale'
                  ? 'bg-pink-500/30 text-pink-300'
                  : 'bg-blue-500/30 text-blue-300'
              }`}
            >
              {hoveredSeat.type === 'resale' ? 'Resale' : 'Standard'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
            <span className="font-semibold text-slate-300">Seat {hoveredSeat.seatNumber}</span>
            {bookedSeatIds.includes(hoveredSeat.id) ? (
              <span className="text-rose-400 font-extrabold flex items-center gap-1">
                <Lock className="w-3 h-3" /> SOLD / NON-CLICKABLE
              </span>
            ) : selectedSeatIds.includes(hoveredSeat.id) ? (
              <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                <Check className="w-3 h-3" /> Selected (${hoveredSeat.price.toFixed(2)})
              </span>
            ) : (
              <span className="text-emerald-400 font-bold">${hoveredSeat.price.toFixed(2)} • Click to Select</span>
            )}
          </div>
        </div>
      )}

      {/* Main Expansive Stadium Map SVG Workspace */}
      <div className="w-full h-full flex-1 flex items-center justify-center overflow-hidden p-2 sm:p-4">
        <div
          className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <svg
            viewBox="20 40 860 670"
            className="w-full h-full max-w-full max-h-full drop-shadow-lg"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7a9af2" />
                <stop offset="100%" stopColor="#557be6" />
              </linearGradient>

              <linearGradient id="pitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2962ff" />
                <stop offset="100%" stopColor="#1a47d4" />
              </linearGradient>

              <linearGradient id="selectedGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1e40af" />
              </linearGradient>

              <filter id="seatGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Stadium Outer Ring Concrete Track */}
            <ellipse cx={cx} cy={cy} rx="414" ry="324" fill="#cbd5e1" stroke="#ffffff" strokeWidth="2.5" />
            <ellipse cx={cx} cy={cy} rx="412" ry="322" fill="#f1f5f9" stroke="#ffffff" strokeWidth="2" />

            {/* 300 LEVEL (Outer Ring) */}
            <g id="ring-300" stroke="#ffffff" strokeWidth="1.5">
              {LEVEL_300.map((item) => {
                const { path, textX, textY } = makeArcWedge(cx, cy, 410, 320, 355, 275, item.start, item.end);
                return (
                  <g key={item.id}>
                    <path
                      d={path}
                      fill="#e2e8f0"
                      className="hover:fill-[#cbd5e1] cursor-pointer transition-colors"
                      onClick={() => onSelectSection(item.id)}
                    />
                    <text
                      x={textX}
                      y={textY}
                      fontSize="9"
                      fontWeight="bold"
                      fill="#94a3b8"
                      textAnchor="middle"
                      pointerEvents="none"
                    >
                      {item.id}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* 200 LEVEL (Middle Ring) */}
            <g id="ring-200" stroke="#ffffff" strokeWidth="1.5">
              {LEVEL_200.map((item) => {
                const { path, textX, textY } = makeArcWedge(cx, cy, 355, 275, 305, 235, item.start, item.end);
                const isSelected = selectedSection === item.id;
                const fill = isSelected ? 'url(#selectedGlowGrad)' : item.isBlue ? 'url(#blueGrad)' : '#e2e8f0';

                return (
                  <g key={item.id}>
                    <path
                      d={path}
                      fill={fill}
                      className="hover:brightness-105 cursor-pointer transition-all"
                      onClick={() => onSelectSection(item.id)}
                    />
                    <text
                      x={textX}
                      y={textY}
                      fontSize="9"
                      fontWeight="bold"
                      fill={item.isBlue || isSelected ? '#ffffff' : '#94a3b8'}
                      textAnchor="middle"
                      pointerEvents="none"
                    >
                      {item.id}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* 100 LEVEL (Lower Bowl) */}
            <g id="ring-100" stroke="#ffffff" strokeWidth="1.5">
              {LEVEL_100.map((item) => {
                const { path, textX, textY } = makeArcWedge(cx, cy, 305, 235, 240, 180, item.start, item.end);
                const fill = selectedSection === item.id ? 'url(#selectedGlowGrad)' : item.isBlue ? '#f8fafc' : '#e2e8f0';

                return (
                  <g key={item.id}>
                    <path
                      d={path}
                      fill={fill}
                      stroke="#e2e8f0"
                      strokeWidth="1.5"
                      className="hover:fill-blue-50/50 cursor-pointer transition-all"
                      onClick={() => onSelectSection(item.id)}
                    />
                    <text
                      x={textX}
                      y={textY}
                      fontSize="9"
                      fontWeight="bold"
                      fill="#94a3b8"
                      textAnchor="middle"
                      pointerEvents="none"
                    >
                      {item.id}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* CENTRAL FLOOR & STAGE AREA */}
            <rect
              x="260"
              y="275"
              width="385"
              height="200"
              rx="45"
              fill="#ffffff"
              stroke="#e2e8f0"
              strokeWidth="2"
              className="drop-shadow-sm"
            />

            {/* STAGE COMPLEX */}
            <g id="stage-complex">
              <rect
                x="565"
                y="312"
                width="72"
                height="126"
                rx="3"
                fill="#18181b"
                stroke="#fbbf24"
                strokeWidth="1.5"
                className="drop-shadow-md"
              />
              <rect x="525" y="360" width="40" height="30" fill="#18181b" stroke="#fbbf24" strokeWidth="1.5" />
              <rect x="563" y="361.5" width="4" height="27" fill="#18181b" />
              <line x1="525" y1="360" x2="525" y2="390" stroke="#38bdf8" strokeWidth="2.5" />

              <text
                x="605"
                y="375"
                fontSize="14"
                fontWeight="900"
                fill="#ffffff"
                letterSpacing="3"
                textAnchor="middle"
                style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}
              >
                STAGE
              </text>
            </g>

            {/* PIT Standing Area */}
            <path
              d="M 495 312 L 565 312 L 565 360 L 525 360 L 525 390 L 565 390 L 565 438 L 495 438 Z"
              fill="url(#pitGrad)"
              stroke="#ffffff"
              strokeWidth="1.5"
              className="hover:brightness-110 cursor-pointer transition-all"
              onClick={() => onSelectSection('PIT')}
            />
            <text x="535" y="342" fontSize="13" fontWeight="900" fill="#ffffff" textAnchor="middle">
              PIT
            </text>

            {/* Section outlines & labels */}
            <rect x="465" y="312" width="28" height="39" fill="none" stroke="#e2e8f0" strokeWidth="1" />
            <text x="479" y="325" fontSize="8" fontWeight="bold" fill="#64748b" textAnchor="middle">AAA</text>

            <rect x="465" y="353" width="28" height="44" fill="none" stroke="#e2e8f0" strokeWidth="1" />
            <text x="479" y="366" fontSize="8" fontWeight="bold" fill="#64748b" textAnchor="middle">BBB</text>

            <rect x="465" y="399" width="28" height="39" fill="none" stroke="#e2e8f0" strokeWidth="1" />
            <text x="479" y="412" fontSize="8" fontWeight="bold" fill="#64748b" textAnchor="middle">CCC</text>

            <text x="396" y="310" fontSize="11" fontWeight="bold" fill="#64748b" textAnchor="middle">DDD</text>
            <text x="396" y="450" fontSize="11" fontWeight="bold" fill="#64748b" textAnchor="middle">FFF</text>

            {/* Sound / Lighting MIX Booth */}
            <rect x="360" y="360" width="43" height="30" rx="2" fill="#dedfe3" stroke="#cbd5e1" strokeWidth="1" />
            <text x="381" y="379" fontSize="8" fontWeight="bold" fill="#64748b" textAnchor="middle">MIX</text>

            {/* ======================================================== */}
            {/* SEAT CHECKBOXES / SEAT NODES LAYER                       */}
            {/* ======================================================== */}
            <g id="seats-checkboxes-layer">
              {SEAT_NODES.map((seat) => {
                const isSelected = selectedSeatIds.includes(seat.id);
                const isBooked = bookedSeatIds.includes(seat.id);

                // Styling logic:
                // 1. Booked (Paid): Non-clickable, greyed out, strikethrough/lock
                // 2. Selected (Checked): Green/Blue with white checkmark
                // 3. Available: Blue (Standard) or Pink (Resale) checkbox
                let fillColor = seat.type === 'resale' ? '#f43f5e' : '#2563eb';
                let strokeColor = seat.type === 'resale' ? '#e11d48' : '#1d4ed8';

                if (isSelected) {
                  fillColor = '#10b981'; // Vibrant Emerald Check
                  strokeColor = '#059669';
                } else if (isBooked) {
                  fillColor = '#94a3b8'; // Sold Out Non-clickable Grey
                  strokeColor = '#64748b';
                }

                return (
                  <g
                    key={seat.id}
                    transform={`translate(${seat.x.toFixed(1)}, ${seat.y.toFixed(1)})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isBooked) return; // Non-clickable when booked!
                      onToggleSeat(seat);
                    }}
                    onMouseEnter={() => setHoveredSeat(seat)}
                    onMouseLeave={() => setHoveredSeat(null)}
                    className={`transition-all duration-150 ${
                      isBooked
                        ? 'cursor-not-allowed opacity-60'
                        : 'cursor-pointer hover:scale-125'
                    }`}
                  >
                    {/* Checkbox Rounded Seat Node Box */}
                    <rect
                      x="-4"
                      y="-4"
                      width="8"
                      height="8"
                      rx="2"
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? '1.5' : '0.8'}
                      filter={isSelected ? 'url(#seatGlow)' : undefined}
                    />

                    {/* Inside Checkbox: Checkmark for Selected, Lock for Booked */}
                    {isSelected ? (
                      <path
                        d="M -2.5 0 L -0.8 1.8 L 2.5 -1.5"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ) : isBooked ? (
                      <path
                        d="M -2 -2 L 2 2 M 2 -2 L -2 2"
                        stroke="#ffffff"
                        strokeWidth="1"
                        strokeLinecap="round"
                      />
                    ) : null}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>

      {/* Floating Bottom Action Bar (Appears when 1+ Seats are Checked) */}
      {selectedSeatIds.length > 0 && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-white">
                {selectedSeatIds.length} {selectedSeatIds.length === 1 ? 'Seat' : 'Seats'} Selected
              </div>
              <div className="text-[11px] text-slate-300">
                {selectedSeatsList.map((s) => `Sec ${s.sectionName} R${s.row.replace(/\D/g, '')} S${s.seatNumber}`).join(', ')}
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-700" />

          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Total</div>
            <div className="font-extrabold text-base text-emerald-400">
              ${selectedSeatsTotal.toFixed(2)}
            </div>
          </div>

          <button
            onClick={onCheckoutSelectedSeats}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black tracking-wide shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
          >
            <span>Book Selected Seats</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Footer: Legal Notice & Collapsible Legend */}
      <div className="px-6 py-2.5 flex items-center justify-between text-[11px] text-slate-500 bg-white/95 border-t border-slate-200 backdrop-blur-sm z-30">
        <div className="truncate max-w-xl">
          By continuing past this page, you agree to our{' '}
          <a href="#" className="underline text-[#0052cc] hover:text-blue-800">
            terms of use
          </a>
          . |{' '}
          <a href="#" className="underline text-[#0052cc] hover:text-blue-800">
            Manage my cookies and ad choices
          </a>{' '}
          | © Ticketmaster 2026.
        </div>

        {/* Legend Collapsible Button */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-300 shadow-2xs text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span>Legend</span>
            {showLegend ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {showLegend && (
            <div className="absolute bottom-full right-0 mb-2 w-64 p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xl text-xs space-y-2 animate-in fade-in z-40">
              <div className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                Seat & Checkbox Legend
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-xs bg-[#2563eb] border border-[#1d4ed8] shrink-0" />
                <span className="text-slate-700 font-medium">Standard Admission Seat</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-xs bg-[#f43f5e] border border-[#e11d48] shrink-0" />
                <span className="text-slate-700 font-medium">Verified Resale Seat</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-xs bg-[#10b981] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  ✓
                </span>
                <span className="text-slate-800 font-extrabold">Selected Checkbox (In Cart)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-xs bg-slate-400 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                  ✕
                </span>
                <span className="text-slate-500 font-semibold line-through">
                  Booked / Paid (Non-Clickable)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Official Venue Seating Diagram Modal */}
      {showVenueModal && staticSeatmapUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Official Venue Seating Chart</h3>
                <p className="text-xs text-slate-500">{venueName || 'Main Arena'}</p>
              </div>
              <button
                onClick={() => setShowVenueModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative w-full h-[450px] bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={staticSeatmapUrl}
                alt={`Official venue seating chart for ${venueName}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            <div className="text-right">
              <button
                onClick={() => setShowVenueModal(false)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800"
              >
                Close Diagram
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
