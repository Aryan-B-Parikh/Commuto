'use client';

import React, { useState } from 'react';
import { Star, CheckCircle2 } from 'lucide-react';
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

    return (
        <Card className="border-none shadow-sm p-5 lg:p-6">
            <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-[#F9FAFB] flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-400" /> Trip Receipt
                </h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-lg font-black uppercase">
                    Completed
                </span>
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
