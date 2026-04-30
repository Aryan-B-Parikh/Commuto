'use client';

import React from 'react';
import { Car, Star } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useCounterBid } from '@/hooks/useCounterBid';
import CounterBidInput from '@/components/ride/CounterBidInput';
import { formatCurrency } from '@/utils/formatters';
import type { BidResponse } from '@/types/api';

interface Props {
    bids: BidResponse[];
    isAccepting: string | null;
    onAcceptBid: (bidId: string) => void;
    /** Called after a successful counter-bid so the parent can refresh data */
    onRefetch: () => Promise<void>;
}

/**
 * Renders the driver-bids list for a passenger trip, including accept and
 * counter controls.  Counter-bid logic is centralised via the useCounterBid
 * hook and is no longer duplicated across ride-detail pages.
 */
export function BiddingSection({ bids, isAccepting, onAcceptBid, onRefetch }: Props) {
    const {
        counterBidId,
        setCounterBidId,
        counterAmount,
        setCounterAmount,
        isCountering,
        handleCounterBid,
    } = useCounterBid({ onSuccess: onRefetch });

    const resolveBidId = (bid: any): string | null => {
        const value = bid?.id ?? bid?.bid_id ?? bid?.bidId;
        return typeof value === 'string' && value.length > 0 ? value : null;
    };

    const resolveBidAmount = (bid: any): number | null => {
        const value = Number(bid?.bid_amount ?? bid?.amount ?? bid?.bidAmount);
        return Number.isFinite(value) ? value : null;
    };

    return (
        <Card className="border-none shadow-sm p-5 lg:p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#F9FAFB] flex items-center gap-2">
                    <Car size={18} className="text-emerald-400" /> Driver Bids
                </h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-lg font-black uppercase">
                    {bids.length} {bids.length === 1 ? 'Bid' : 'Bids'}
                </span>
            </div>

            <div className="space-y-3">
                {bids.map((bid: any, index: number) => {
                    const bidId = resolveBidId(bid);
                    const bidAmount = resolveBidAmount(bid);
                    const bidAmountLabel = bidAmount === null ? '--' : formatCurrency(bidAmount);
                    const bidKey = bidId ?? `bid-${index}`;
                    const isCounterActive = Boolean(bidId && counterBidId === bidId);

                    return (
                        <div
                            key={bidKey}
                            className="p-4 rounded-2xl bg-emerald-500/5 ring-1 ring-emerald-500/15 space-y-3"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                                        {bid.driver_name?.[0] || 'D'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[#F9FAFB]">{bid.driver_name || 'Driver'}</p>
                                        {bid.driver_rating && (
                                            <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                                                <Star size={10} fill="currentColor" />
                                                {Number(bid.driver_rating).toFixed(1)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xl font-black text-emerald-400">{bidAmountLabel}</p>
                            </div>

                            {bid.is_counter_bid && (
                                <div className="text-[10px] font-bold text-indigo-400 uppercase bg-indigo-500/10 px-2 py-1 rounded-lg w-fit">
                                    Counter Offer
                                </div>
                            )}

                            {isCounterActive && bidId ? (
                                <CounterBidInput
                                    bidId={bidId}
                                    isActive
                                    counterAmount={counterAmount}
                                    onAmountChange={setCounterAmount}
                                    isSubmitting={isCountering}
                                    onSubmit={handleCounterBid}
                                    onCancel={() => { setCounterBidId(null); setCounterAmount(''); }}
                                />
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            if (bidId) {
                                                onAcceptBid(bidId);
                                            }
                                        }}
                                        disabled={!bidId || isAccepting === bidId}
                                        className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl disabled:opacity-50"
                                    >
                                        {isAccepting === bidId && bidId ? 'Accepting...' : '✓ Accept'}
                                    </button>
                                    {!bid.is_counter_bid && (
                                        <button
                                            onClick={() => {
                                                if (!bidId) return;
                                                setCounterBidId(bidId);
                                                setCounterAmount(bidAmount === null ? '' : String(bidAmount));
                                            }}
                                            disabled={!bidId}
                                            className="flex-1 h-9 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 font-bold text-xs rounded-xl border border-indigo-500/30 disabled:opacity-50"
                                        >
                                            ↔ Counter
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
