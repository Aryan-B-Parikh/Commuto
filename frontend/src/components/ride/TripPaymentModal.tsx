'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Info, ShieldCheck, Wallet } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
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
    amount,
    tripName,
    tripId,
    bookingId,
    onSuccess,
}) => {
    const router = useRouter();
    void tripId;
    void bookingId;

    const handleGoToWallet = () => {
        onSuccess();
        onClose();
        router.push('/passenger/wallet');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Wallet prepayment required" size="sm">
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
                            <p className="text-sm font-semibold text-foreground">Direct ride checkout is no longer available</p>
                            <p className="mt-1 text-sm text-muted-foreground">This build now uses wallet-first prepayment. Riders need balance in their Commuto wallet before joining or creating a ride.</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-[24px] border border-card-border bg-background/55 p-4">
                    <div className="flex items-start gap-3 text-sm text-muted-foreground">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <p>
                            If this ride still shows a pending payment, that status is from the legacy trip-payment flow.
                            Add money to your wallet for future bookings instead of paying after the trip ends.
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose} fullWidth size="lg">
                        Close
                    </Button>
                    <Button onClick={handleGoToWallet} fullWidth size="lg" className="gap-2">
                        Open wallet
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
