'use client';

import React, { useState } from 'react';
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
    const { showToast } = useToast() as any;
    const { user } = useAuth();

    const handlePayment = async () => {
        setIsLoading(true);

        try {
            const order = await tripsAPI.createTripPaymentOrder(tripId, bookingId);

            const options = {
                key: order.key,
                amount: order.amount,
                currency: order.currency,
                name: "Commuto Ride",
                description: `Payment for trip: ${tripName}`,
                order_id: order.order_id,
                handler: async function (response: any) {
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
                    } catch (err: any) {
                        console.error('Verification Error:', err);
                        showToast('error', err.response?.data?.detail || 'Failed to verify payment');
                    }
                },
                prefill: {
                    name: user?.name || "",
                    email: user?.email || "",
                    contact: user?.phone || ""
                },
                theme: {
                    color: "#4F46E5"
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();

        } catch (error: any) {
            console.error('Payment Error:', error);
            showToast('error', error.response?.data?.detail || 'Failed to initiate payment');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Complete Ride Payment" size="sm">
            <div className="space-y-6">
                <div className="text-center p-6 bg-[#1E293B] rounded-2xl border border-[#374151]">
                    <p className="text-[#6B7280] font-bold uppercase tracking-widest text-xs mb-1">Amount to Pay</p>
                    <h2 className="text-4xl font-black text-[#F9FAFB] italic tracking-tighter">
                        {formatCurrency(amount)}
                    </h2>
                    <p className="text-xs text-[#6B7280] font-medium mt-2">
                        For your ride to <span className="text-[#9CA3AF] font-bold">{tripName}</span>
                    </p>
                </div>

                <div className="space-y-3">
                    <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest text-center">
                        Securely pay via UPI, GPay, or Card
                    </p>
                    <Button
                        onClick={handlePayment}
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 text-lg font-black italic tracking-widest uppercase shadow-xl shadow-indigo-500/20"
                    >
                        {isLoading ? 'Processing...' : `Pay ${formatCurrency(amount)} Now`}
                    </Button>
                </div>

                <div className="flex items-center justify-center gap-2 opacity-40">
                    <div className="w-16 h-px bg-[#374151]" />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-[#6B7280]">Razorpay Secure</span>
                    <div className="w-16 h-px bg-[#374151]" />
                </div>
            </div>
        </Modal>
    );
};
