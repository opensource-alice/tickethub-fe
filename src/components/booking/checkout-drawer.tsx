'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  X,
  ShieldCheck,
  CreditCard,
  QrCode,
  Download,
  Calendar,
  CheckCircle2,
  Lock,
  ArrowRight,
  Ticket,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { TicketListing } from './ticket-selection-panel';
import { EventItem, PartnerCartResponse, PartnerCommitResponse } from '@/types';
import { formatDate, downloadIcsFile } from '@/lib/utils';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export interface CheckoutSeatItem {
  id: string;
  sectionName: string;
  row: string;
  seatNumber: number;
  price: number;
}

interface CheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  listing: TicketListing | null;
  quantity: number;
  event: EventItem;
  selectedSeats?: CheckoutSeatItem[];
  onPaymentSuccess?: (seatIds: string[]) => void;
}

export function CheckoutDrawer({
  isOpen,
  onClose,
  listing,
  quantity,
  event,
  selectedSeats = [],
  onPaymentSuccess,
}: CheckoutDrawerProps) {
  const [step, setStep] = useState<'review' | 'payment' | 'confirmed'>('review');
  const [fullName, setFullName] = useState('Alex Morgan');
  const [email, setEmail] = useState('alex.morgan@example.com');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [isProcessing, setIsProcessing] = useState(false);
  const [partnerCart, setPartnerCart] = useState<PartnerCartResponse | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<PartnerCommitResponse | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(600);

  // Initialize Ticketmaster Partner Cart when drawer opens
  useEffect(() => {
    let isMounted = true;
    if (isOpen && (listing || selectedSeats.length > 0)) {
      setStep('review');
      setConfirmedOrder(null);

      const reserves =
        selectedSeats.length > 0
          ? selectedSeats.map((s) => ({
              section: s.sectionName,
              row: s.row,
              quantity: 1,
              unitPrice: s.price,
            }))
          : listing
          ? [
              {
                section: listing.sectionName,
                row: listing.row,
                quantity,
                unitPrice: listing.price,
              },
            ]
          : [];

      api
        .createPartnerCart(event.id, reserves, { customerName: fullName, customerEmail: email })
        .then((cart) => {
          if (isMounted) {
            setPartnerCart(cart);
            setRemainingSeconds(cart.holdSeconds || 600);
          }
        })
        .catch((err) => {
          console.warn('Partner cart init:', err.message);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, listing, quantity, event.id]);

  // Hold countdown timer
  useEffect(() => {
    if (!isOpen || step === 'confirmed' || remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, step, remainingSeconds]);

  if (!isOpen || (!listing && selectedSeats.length === 0)) return null;

  const dateInfo = formatDate(event.dates.localDate, event.dates.localTime);
  const seatsSubtotal =
    selectedSeats.length > 0
      ? selectedSeats.reduce((acc, s) => acc + s.price, 0)
      : (listing?.price || 50) * quantity;
  const effectiveCount = selectedSeats.length > 0 ? selectedSeats.length : quantity;

  const totals = partnerCart?.totals || {
    subtotal: Number(seatsSubtotal.toFixed(2)),
    serviceFee: Number((seatsSubtotal * 0.15).toFixed(2)),
    facilityFee: Number((effectiveCount * 4.5).toFixed(2)),
    tax: Number((seatsSubtotal * 0.08).toFixed(2)),
    total: Number((seatsSubtotal * 1.23 + effectiveCount * 4.5).toFixed(2)),
    currency: 'USD',
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      let activeCart = partnerCart;
      if (!activeCart) {
        const reserves =
          selectedSeats.length > 0
            ? selectedSeats.map((s) => ({
                section: s.sectionName,
                row: s.row,
                quantity: 1,
                unitPrice: s.price,
              }))
            : [
                {
                  section: listing?.sectionName || 'Floor',
                  row: listing?.row || 'GA',
                  quantity,
                  unitPrice: listing?.price || 50,
                },
              ];

        activeCart = await api.createPartnerCart(event.id, reserves, {
          customerName: fullName,
          customerEmail: email,
        });
        setPartnerCart(activeCart);
      }

      // 1. Authorize Payment via Ticketmaster Partner API
      await api.addPartnerPayment(event.id, activeCart.cartId, {
        paymentType: 'credit_card',
        amount: activeCart.totals.total,
        cardBrand: 'Visa',
        cardLast4: cardNumber.replace(/\D/g, '').slice(-4) || '4242',
      });

      // 2. Commit Order & Generate Tickets via Ticketmaster Partner API
      const order = await api.commitPartnerOrder(event.id, activeCart.cartId, {
        customerName: fullName,
        customerEmail: email,
      });

      setConfirmedOrder(order);
      setStep('confirmed');

      if (onPaymentSuccess) {
        const bookedIds =
          selectedSeats.length > 0
            ? selectedSeats.map((s) => s.id)
            : listing
            ? [listing.id]
            : [];
        onPaymentSuccess(bookedIds);
      }

      toast.success('Ticketmaster Partner Reservation Confirmed! 🎉', {
        description: `Order #${order.orderId} generated with official mobile QR passes.`,
      });
    } catch (error: any) {
      toast.error('Booking failed: ' + (error.message || 'Please try again.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (step !== 'confirmed' && partnerCart?.cartId) {
      api.deletePartnerCart(event.id, partnerCart.cartId).catch(() => {});
    }
    onClose();
  };

  const handleDownloadTicket = () => {
    toast.info('Downloading official mobile barcode pass...');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (step !== 'confirmed') onClose();
        }}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between border-l border-border animate-in slide-in-from-right duration-250">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Ticket className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-foreground">
                  {step === 'confirmed' ? 'Order Confirmed' : 'Checkout & Booking'}
                </h3>
                <span className="text-[11px] text-muted-foreground block">
                  {effectiveCount}x Sec{' '}
                  {selectedSeats.length > 0 ? selectedSeats[0].sectionName : listing?.sectionName || 'GA'} •{' '}
                  {selectedSeats.length > 0 ? selectedSeats[0].row : listing?.row || 'GA'}
                </span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {step === 'review' && (
              <div className="space-y-6 animate-in fade-in">
                {/* Hold Timer Banner */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 animate-pulse text-amber-500" />
                    <span className="text-xs font-bold">Partner Reserved Hold</span>
                  </div>
                  <div className="text-xs font-black font-mono px-2 py-0.5 rounded bg-amber-500/20">
                    {formatTimer(remainingSeconds)}
                  </div>
                </div>

                {/* Event Summary Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                      {event.classification.segment || 'Concert'}
                    </span>
                    {partnerCart?.cartId && (
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {partnerCart.cartId}
                      </span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-sm text-foreground leading-snug">
                    {event.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {dateInfo.fullDisplay}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {event.venue?.name || 'Arena'} • {event.city || ''}
                  </p>
                </div>

                {/* Seating Details */}
                <div className="p-4 rounded-2xl border border-border space-y-2">
                  <div className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Selected Seats ({effectiveCount})
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-extrabold text-foreground">
                      {selectedSeats.length > 0
                        ? `Section ${selectedSeats[0].sectionName}, ${selectedSeats[0].row}`
                        : `Section ${listing?.sectionName}, ${listing?.row}`}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {selectedSeats.length > 0
                        ? selectedSeats.map((s) => `Seat ${s.seatNumber}`).join(', ')
                        : `Seats 1-${quantity}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {listing?.type || 'Standard Admission'} • Direct Ticketmaster Partner Integration
                  </p>
                </div>

                {/* Itemized Price Breakdown */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-border space-y-2.5 text-xs">
                  <div className="font-bold uppercase tracking-wider text-muted-foreground pb-1 border-b border-border">
                    Price Breakdown
                  </div>
                  <div className="flex justify-between">
                    <span>Tickets ({effectiveCount}x)</span>
                    <span className="font-semibold">${totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>TM Service Fee (15%)</span>
                    <span>${totals.serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Facility Charge ($4.50/tkt)</span>
                    <span>${totals.facilityFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Estimated Tax (8%)</span>
                    <span>${totals.tax.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-border flex justify-between text-sm font-extrabold text-foreground">
                    <span>Total Amount</span>
                    <span className="text-primary text-base">${totals.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Buyer Information Form */}
                <div className="space-y-3">
                  <div className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Ticket Recipient
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Email Address (for Digital E-Ticket)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setStep('payment')}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 text-white font-extrabold text-sm shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition-all"
                >
                  <span>Continue to Payment (${totals.total.toFixed(2)})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step === 'payment' && (
              <form onSubmit={handlePay} className="space-y-6 animate-in fade-in">
                {/* Total reminder */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <span className="text-xs font-bold">Total to Authorize</span>
                  <span className="text-lg font-black">${totals.total.toFixed(2)}</span>
                </div>

                {/* Card Fields */}
                <div className="space-y-3 p-4 rounded-2xl border border-border bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-foreground">Payment Method</span>
                    <span className="flex items-center gap-1 text-[11px] text-emerald-500 font-semibold">
                      <Lock className="w-3 h-3" />
                      <span>256-Bit SSL Encrypted</span>
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">
                      Card Number
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-background border border-border"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        defaultValue="12/28"
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">
                        CVC / CVV
                      </label>
                      <input
                        type="text"
                        defaultValue="888"
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Official Ticketmaster Partner Guaranteed Order</span>
                </div>

                <div className="space-y-2">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 text-white font-extrabold text-sm shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Authorizing with Ticketmaster Partner API...</span>
                      </div>
                    ) : (
                      <span>Confirm & Pay ${totals.total.toFixed(2)}</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('review')}
                    className="w-full py-2 text-xs text-muted-foreground hover:text-foreground text-center"
                  >
                    Back to Review
                  </button>
                </div>
              </form>
            )}

            {step === 'confirmed' && (
              <div className="space-y-6 text-center animate-in zoom-in-95 duration-200">
                {/* Success Icon */}
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">
                    Booking Confirmed!
                  </span>
                  <h3 className="text-xl font-black text-foreground mt-1">
                    You&apos;re Going to the Show!
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Order ID: <span className="font-mono font-bold text-foreground">{confirmedOrder?.orderId || 'TM-ORD-2026-99120'}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Confirmation Code: <span className="font-mono font-bold text-primary">{confirmedOrder?.confirmationCode || 'TMC-88192'}</span>
                  </p>
                </div>

                {/* Digital Mobile Pass Preview */}
                <div className="p-5 rounded-3xl bg-slate-900 text-white shadow-xl space-y-4 text-left border border-slate-800">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-primary">
                        Ticketmaster Partner Mobile Pass
                      </span>
                      <h4 className="font-black text-sm text-white line-clamp-1">{event.name}</h4>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">Verified</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-300">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">
                        Section
                      </span>
                      <span className="font-black text-sm text-white">
                        {selectedSeats.length > 0 ? selectedSeats[0].sectionName : listing?.sectionName || 'Floor'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">
                        Row
                      </span>
                      <span className="font-black text-sm text-white">
                        {(selectedSeats.length > 0 ? selectedSeats[0].row : listing?.row || 'GA').replace('Row ', '')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">
                        Seats
                      </span>
                      <span className="font-black text-sm text-white">
                        {selectedSeats.length > 0
                          ? selectedSeats.map((s) => s.seatNumber).join(', ')
                          : `1-${quantity}`}
                      </span>
                    </div>
                  </div>

                  {/* QR Code Barcode Representation */}
                  <div className="pt-2 flex flex-col items-center justify-center bg-white p-3 rounded-2xl">
                    <QrCode className="w-28 h-28 text-slate-900" />
                    <span className="text-[10px] font-mono font-bold text-slate-700 tracking-wider mt-1">
                      {confirmedOrder?.tickets?.[0]?.barcode || '708910398162113887'}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                      {confirmedOrder?.tickets?.[0]?.ticketId || `TKT-${confirmedOrder?.orderId || 'TM-ORD'}-1`}
                    </span>
                  </div>
                </div>

                {/* Post Booking Actions */}
                <div className="space-y-2">
                  <button
                    onClick={handleDownloadTicket}
                    className="w-full py-2.5 px-4 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold flex items-center justify-center gap-2 border border-border"
                  >
                    <Download className="w-4 h-4 text-primary" />
                    <span>Download Mobile Pass (PDF)</span>
                  </button>

                  <button
                    onClick={() => downloadIcsFile(event)}
                    className="w-full py-2.5 px-4 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold flex items-center justify-center gap-2 border border-border"
                  >
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>Add to Calendar (.ics)</span>
                  </button>

                  <button
                    onClick={handleClose}
                    className="w-full py-3 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary/90 mt-2"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
