'use client';

import React, { useState, useRef } from 'react';
import { Star, CheckCircle2, Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { tripsAPI } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/utils/formatters';
import type { TripResponse } from '@/types/api';
import type { Trip } from '@/types';

interface Props {
    rawTrip: TripResponse;
    trip: Trip;
    tripId: string;
    distance: string;
}

/**
 * Renders the post-ride receipt and optional driver rating form for a
 * completed passenger trip.  Extracted from PassengerTripDetailsPage to
 * reduce cognitive load in that component.
 */
export function TripReceiptCard({ rawTrip, trip, tripId, distance }: Props) {
    const { showToast } = useToast() as any;
    const [driverRating, setDriverRating] = useState(0);
    const [hasRated, setHasRated] = useState(false);
    const [isRating, setIsRating] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);

    const handleRateDriver = async () => {
        if (!driverRating || driverRating < 1) {
            showToast('error', 'Please select a star rating');
            return;
        }
        try {
            setIsRating(true);
            await tripsAPI.rateDriver(tripId, driverRating);
            setHasRated(true);
            showToast('success', 'Thank you for rating your driver!');
        } catch {
            showToast('error', 'Failed to submit rating.');
        } finally {
            setIsRating(false);
        }
    };

    const handleDownloadBill = () => {
        const totalAmount = rawTrip.booking_total_price ?? rawTrip.price_per_seat ?? 0;
        const tripDate = rawTrip.start_time ? new Date(rawTrip.start_time).toLocaleString('en-IN', {
            dateStyle: 'long', timeStyle: 'short'
        }) : '—';

        const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Commuto Trip Receipt - ${tripId.slice(0, 8).toUpperCase()}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #fff; color: #111; padding: 40px; max-width: 600px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #6366F1; padding-bottom: 20px; }
        .header h1 { font-size: 28px; font-weight: 800; color: #6366F1; letter-spacing: -0.5px; }
        .header p { font-size: 12px; color: #666; margin-top: 4px; text-transform: uppercase; letter-spacing: 2px; }
        .section { margin-bottom: 24px; }
        .section-title { font-size: 10px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; }
        .row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
        .row:last-child { border-bottom: none; }
        .row .label { font-size: 13px; color: #666; font-weight: 600; }
        .row .value { font-size: 13px; color: #111; font-weight: 700; text-align: right; max-width: 60%; }
        .total-row { background: #f8f9fa; border-radius: 12px; padding: 16px 20px; margin-top: 16px; display: flex; justify-content: space-between; align-items: center; }
        .total-row .label { font-size: 16px; font-weight: 800; color: #111; text-transform: uppercase; letter-spacing: 1px; }
        .total-row .value { font-size: 24px; font-weight: 900; color: #059669; }
        .footer { margin-top: 40px; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
        .footer p { font-size: 11px; color: #999; }
        .route-card { background: #f8f9fa; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
        .route-point { display: flex; align-items: flex-start; gap: 12px; }
        .route-point + .route-point { margin-top: 12px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
        .dot.pickup { background: #6366F1; }
        .dot.dest { background: #EF4444; }
        .route-label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
        .route-address { font-size: 13px; color: #111; font-weight: 600; margin-top: 2px; }
        .line { width: 2px; height: 20px; background: #ddd; margin-left: 4px; }
        @media print { body { padding: 20px; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>Commuto</h1>
        <p>Trip Receipt</p>
    </div>

    <div class="route-card">
        <div class="route-point">
            <div class="dot pickup"></div>
            <div>
                <div class="route-label">Pickup</div>
                <div class="route-address">${trip.from.name}</div>
            </div>
        </div>
        <div style="margin-left: 4px;"><div class="line"></div></div>
        <div class="route-point">
            <div class="dot dest"></div>
            <div>
                <div class="route-label">Destination</div>
                <div class="route-address">${trip.to.name}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Trip Details</div>
        <div class="row"><span class="label">Trip ID</span><span class="value">${tripId.slice(0, 8).toUpperCase()}</span></div>
        <div class="row"><span class="label">Date & Time</span><span class="value">${tripDate}</span></div>
        <div class="row"><span class="label">Distance</span><span class="value">${distance} km</span></div>
        <div class="row"><span class="label">Driver</span><span class="value">${rawTrip.driver_name || '—'}</span></div>
        <div class="row"><span class="label">Payment Status</span><span class="value" style="color: ${rawTrip.booking_payment_status === 'completed' ? '#059669' : '#EAB308'}">${(rawTrip.booking_payment_status || 'pending').toUpperCase()}</span></div>
    </div>

    <div class="total-row">
        <span class="label">Total</span>
        <span class="value">₹${totalAmount.toFixed(2)}</span>
    </div>

    <div class="footer">
        <p>Thank you for riding with Commuto!</p>
        <p style="margin-top: 4px;">Generated on ${new Date().toLocaleString('en-IN')}</p>
    </div>
</body>
</html>`.trim();

        // Open in a new window and trigger print/download
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(receiptHTML);
            printWindow.document.close();
            // Small delay to ensure styles are applied before printing
            setTimeout(() => {
                printWindow.print();
            }, 500);
        } else {
            showToast('error', 'Pop-up blocked. Please allow pop-ups for this site.');
        }
    };

    return (
        <Card className="border-none shadow-sm p-5 lg:p-6">
            <div ref={receiptRef}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-[#F9FAFB] flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-emerald-400" /> Trip Receipt
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownloadBill}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                        >
                            <Download size={12} />
                            Download Bill
                        </button>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-lg font-black uppercase">
                            Completed
                        </span>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-[#1E293B]">
                        <span className="text-xs text-[#9CA3AF] font-bold uppercase tracking-widest">Trip ID</span>
                        <span className="text-xs font-black text-[#F9FAFB] font-mono">{tripId.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#1E293B]">
                        <span className="text-xs text-[#9CA3AF] font-bold uppercase tracking-widest">Route</span>
                        <span className="text-xs font-bold text-[#F9FAFB] text-right max-w-[55%]">
                            {trip.from.name.split(',')[0]} → {trip.to.name.split(',')[0]}
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#1E293B]">
                        <span className="text-xs text-[#9CA3AF] font-bold uppercase tracking-widest">Driver</span>
                        <span className="text-xs font-bold text-[#F9FAFB]">{rawTrip.driver_name || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#1E293B]">
                        <span className="text-xs text-[#9CA3AF] font-bold uppercase tracking-widest">Distance</span>
                        <span className="text-xs font-bold text-[#F9FAFB]">{distance} km</span>
                    </div>
                    <div className="flex justify-between items-center py-3 mt-1 bg-emerald-500/5 rounded-xl px-3">
                        <span className="text-sm font-black text-[#F9FAFB] uppercase tracking-widest">Total Charged</span>
                        <span className="text-xl font-black text-emerald-400">
                            {formatCurrency(rawTrip.booking_total_price ?? rawTrip.price_per_seat ?? 0)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Driver Rating */}
            {rawTrip.driver_name && !hasRated && (
                <div className="mt-5 pt-5 border-t border-[#1E293B]">
                    <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest mb-3">
                        Rate your driver – {rawTrip.driver_name}
                    </p>
                    <div className="flex gap-2 mb-3">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                onClick={() => setDriverRating(star)}
                                className="transition-transform hover:scale-110"
                            >
                                <Star
                                    size={28}
                                    className={star <= driverRating ? 'text-amber-400 fill-amber-400' : 'text-[#374151]'}
                                    fill={star <= driverRating ? 'currentColor' : 'none'}
                                />
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleRateDriver}
                        disabled={isRating || driverRating === 0}
                        className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl disabled:opacity-40"
                    >
                        {isRating ? 'Submitting...' : 'Submit Rating'}
                    </button>
                </div>
            )}

            {hasRated && (
                <div className="flex items-center justify-center gap-2 mt-4 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs font-black text-amber-400">Rating submitted – Thanks!</span>
                </div>
            )}
        </Card>
    );
}
