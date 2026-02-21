'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { bidsAPI } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { TripResponse } from '@/types/api';
import { Car, DollarSign, MessageSquare, Clock } from 'lucide-react';

interface BidModalProps {
    isOpen: boolean;
    onClose: () => void;
    trip: TripResponse | null;
    onBidPlaced: () => void;
}

export const BidModal: React.FC<BidModalProps> = ({ isOpen, onClose, trip, onBidPlaced }) => {
    const [amount, setAmount] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast() as any;

    if (!trip) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || isNaN(Number(amount))) {
            showToast('error', 'Please enter a valid amount');
            return;
        }

        setIsSubmitting(true);
        try {
            await bidsAPI.placeBid(trip.id, {
                amount: Number(amount),
                message: message.trim() || undefined
            });
            showToast('success', 'Bid placed successfully!');
            onBidPlaced();
            onClose();
        } catch (error: any) {
            console.error('Failed to place bid:', error);
            showToast('error', error.response?.data?.detail || 'Failed to place bid');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Submit Your Bid" size="md">
            <div className="space-y-6">
                {/* Trip Summary Card */}
                <div className="bg-muted/50 rounded-2xl p-4 border border-card-border/30">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-lg">
                            <Car size={18} />
                        </div>
                        <h4 className="font-bold text-foreground text-sm">Trip Details</h4>
                    </div>
                    <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <span className="text-muted-foreground font-medium truncate">{trip.origin_address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span className="text-muted-foreground font-medium truncate">{trip.dest_address}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-card-border/20 text-indigo-600 font-bold uppercase tracking-widest text-[9px]">
                            <span className="flex items-center gap-1"><Clock size={10} /> {new Date(trip.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="flex items-center gap-1">👥 {trip.seats_requested} Seats</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Input
                            label="Your Bid Amount (₹)"
                            placeholder="Enter amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            icon={<DollarSign size={18} />}
                            required
                        />
                    </div>

                    <div>
                        <TextArea
                            label="Message to Passenger (Optional)"
                            placeholder="I'm nearby and can reach in 5 mins..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            type="button"
                            fullWidth
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="font-bold uppercase tracking-widest text-xs h-12"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            fullWidth
                            isLoading={isSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 font-bold uppercase tracking-widest text-xs h-12 border-none"
                        >
                            Place Bid
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};
