import { useState } from 'react';
import { bidsAPI } from '@/services/api';
import { useToast } from '@/hooks/useToast';

interface UseCounterBidOptions {
    /** Called after a successful counter-bid submission. Use to refresh bid list. */
    onSuccess: () => Promise<void> | void;
}

interface UseCounterBidReturn {
    /** ID of the bid currently being countered, or null when no counter form is open */
    counterBidId: string | null;
    setCounterBidId: (id: string | null) => void;
    counterAmount: string;
    setCounterAmount: (amount: string) => void;
    isCountering: boolean;
    handleCounterBid: (bidId: string) => Promise<void>;
}

/**
 * Shared hook that centralises counter-bid validation, API interaction and
 * error handling so the logic isn't duplicated across ride-detail pages.
 */
export function useCounterBid({ onSuccess }: UseCounterBidOptions): UseCounterBidReturn {
    const { showToast } = useToast() as any;
    const [counterBidId, setCounterBidId] = useState<string | null>(null);
    const [counterAmount, setCounterAmount] = useState('');
    const [isCountering, setIsCountering] = useState(false);

    const isValidBidId = (value: string) => /^(urn:uuid:)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

    const handleCounterBid = async (bidId: string) => {
        if (!bidId || !isValidBidId(bidId)) {
            showToast('error', 'Bid reference is invalid. Please refresh and try again.');
            return;
        }
        const amount = parseFloat(counterAmount);
        if (!counterAmount || isNaN(amount) || amount <= 0) {
            showToast('error', 'Enter a valid counter amount');
            return;
        }
        try {
            setIsCountering(true);
            await bidsAPI.counterBid(bidId, { amount, message: 'Passenger counter offer' });
            showToast('success', 'Counter offer sent to driver!');
            setCounterBidId(null);
            setCounterAmount('');
            await onSuccess();
        } catch (error: any) {
            showToast('error', error?.response?.data?.detail ?? 'Failed to send counter offer.');
        } finally {
            setIsCountering(false);
        }
    };

    return {
        counterBidId,
        setCounterBidId,
        counterAmount,
        setCounterAmount,
        isCountering,
        handleCounterBid,
    };
}
