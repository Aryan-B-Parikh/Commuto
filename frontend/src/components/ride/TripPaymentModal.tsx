'use client';

import React, { useState } from 'react';
import { CreditCard, ShieldCheck, Wallet } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { tripsAPI } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/formatters';

interface TripPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    tripId: string;
    bookingId: string;
    amount: number;
    tripName: string;
    onSuccess: () => void;
}

interface RazorpayResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

interface RazorpayConstructor {
    open: () => void;
}

declare global {
    interface Window {
        Razorpay: new (options: Record<string, unknown>) => RazorpayConstructor;
    }
}

export const TripPaymentModal: React.FC<TripPaymentModalProps> = ({
    isOpen,
    onClose,
    tripId,
    bookingId,
    amount,
    tripName,
    onSuccess,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();
    const { user } = useAuth();

    const handlePayment = async () => {
        setIsLoading(true);

        try {
            const order = await tripsAPI.createTripPaymentOrder(tripId, bookingId);

            const options = {
                key: order.key,
                amount: order.amount,
                currency: order.currency,
                name: 'Commuto Ride',
                description: `Payment for trip: ${tripName}`,
                order_id: order.order_id,
                handler: async function (response: RazorpayResponse) {
                    try {
                        const result = await tripsAPI.verifyTripPayment({
                            trip_id: tripId,
                            booking_id: bookingId,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        if (result.status === 'success') {
                            showToast('success', 'Payment successful! Driver will be notified.');
                            onSuccess();
                            onClose();
                        } else {
                            showToast('error', 'Payment verification failed');
                        }
                    } catch (err: unknown) {
                        console.error('Verification Error:', err);
                        const message = typeof err === 'object' && err !== null && 'response' in err
                            ? ((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to verify payment')
                            : 'Failed to verify payment';
                        showToast('error', message);
                    }
                },
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                    contact: user?.phone || ''
                },
                theme: {
                    color: '#0f6fff'
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error: unknown) {
            console.error('Payment Error:', error);
            const message = typeof error === 'object' && error !== null && 'response' in error
                ? ((error as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to initiate payment')
                : 'Failed to initiate payment';
            showToast('error', message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Complete ride payment" size="sm">
            <div className="space-y-5">
                <div className="rounded-[28px] bg-[linear-gradient(135deg,var(--primary),#59b0ff)] p-6 text-white">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm text-white/80">Amount to pay</p>
                            <h2 className="mt-3 font-display text-4xl font-bold">{formatCurrency(amount)}</h2>
                            <p className="mt-3 text-sm text-white/80">For your ride to {tripName}</p>
                        </div>
                        <div className="rounded-[22px] bg-white/15 p-3 backdrop-blur-sm">
                            <Wallet className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                <div className="rounded-[24px] border border-card-border bg-background/55 p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">Trusted checkout</p>
                            <p className="mt-1 text-sm text-muted-foreground">Pay securely with UPI, card, or wallet-compatible methods through Razorpay.</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-[24px] border border-card-border bg-background/55 p-4">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <CreditCard className="h-4 w-4 text-primary" />
                        Review the amount once, then continue to the hosted payment sheet.
                    </div>
                </div>

                <Button onClick={handlePayment} disabled={isLoading} fullWidth size="lg">
                    {isLoading ? 'Processing...' : `Pay ${formatCurrency(amount)}`}
                </Button>
            </div>
        </Modal>
    );
};
